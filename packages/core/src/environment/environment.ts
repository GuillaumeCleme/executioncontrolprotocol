import { LATEST_ECP_VERSION } from "@ecp/types"
import type {
  DescribeQuery,
  EnvironmentDescriptor,
  EnvironmentManifest,
  RegistryRegistrationRequest,
  RunResult,
  SearchOptions,
  SearchResult,
  ValidationResult,
  WorkflowManifest,
} from "@ecp/types"
import type { NamespacedId } from "@ecp/types"
import { extension, type ExtensionBindingBuilder } from "../bindings/extension.js"
import type { PolicyBindingBuilder } from "../bindings/policy.js"
import type { RuntimeBindingBuilder } from "../bindings/runtime.js"
import { Registry, globalRegistry } from "../registry/registry.js"
import { ensureBoundExtensionsRegistered as ensureBoundExtensions } from "../registry/ensure-bound-extensions.js"
import { RegistryRegistrationDeniedError } from "../registry/errors.js"
import type { RuntimeExecutor } from "../runtime/executor.js"
import type { EnvironmentLifecycleHost, PolicyContext } from "../runtime/context.js"
import { createUsageLedger } from "../runtime/context.js"
import { evaluatePolicies } from "../runtime/policy-engine.js"
import {
  manifestConfig,
  resolveBindingsForRun,
  type ResolvedBindings,
} from "./bindings.js"
import type { EnvironmentConfigResolver } from "./config-resolver.js"
import { buildDescriptor } from "./describe.js"
import { searchCapabilities } from "./search.js"
import { validateEnvironmentWithWorkflow } from "../validate/environment.js"
import type { HookDefinition } from "../definitions/types.js"
import {
  createDecodeBuilder,
  createEncodeBuilder,
  type DecodeOperationBuilder,
  type EncodeOperationBuilder,
} from "../encoding/index.js"
import { createPatchBuilder, type PatchOperationBuilder } from "../patch/index.js"
import { EcpImpl, type Ecp } from "./ecp.js"

function resolveId(ref: NamespacedId | { id: NamespacedId } | string): NamespacedId {
  if (typeof ref === "string") return ref as NamespacedId
  if ("id" in ref) return ref.id
  return ref as NamespacedId
}

function emptyWorkflowStub(): WorkflowManifest {
  return {
    schema: "@ecp.workflow",
    version: LATEST_ECP_VERSION,
    workflow: { id: "environment-stub" },
    steps: [],
  }
}

const REGISTRY_CHECK_STEP = {
  id: "registry-check",
  capabilityId: "registry.registerExtension",
} as const

/** Run options. @category Environment */
export interface RunOptions {
  input?: Record<string, unknown>
  dryRun?: boolean
  signal?: AbortSignal
}

/**
 * Configured ECP environment.
 * @category Environment
 */
export class Environment implements EnvironmentLifecycleHost {
  private resolved?: ResolvedBindings
  private discoveryPrepared = false
  private readonly configResolvers: EnvironmentConfigResolver[] = []

  constructor(
    private readonly envId: string,
    private readonly envLabel: string | undefined,
    private runtimeBinding: RuntimeBindingBuilder | undefined,
    private extensionBindings: ExtensionBindingBuilder[] = [],
    private policyBindings: PolicyBindingBuilder[] = [],
    private readonly registry: Registry = globalRegistry
  ) {}

  registerConfigResolver(resolver: EnvironmentConfigResolver): void {
    this.configResolvers.push(resolver)
  }

  withRuntime(binding: RuntimeBindingBuilder): this {
    this.runtimeBinding = binding
    this.invalidatePrepared()
    return this
  }

  withExtensions(bindings: ExtensionBindingBuilder[]): this {
    this.extensionBindings = bindings
    this.invalidatePrepared()
    return this
  }

  withPolicies(bindings: PolicyBindingBuilder[]): this {
    this.policyBindings = bindings
    this.invalidatePrepared()
    return this
  }

  /** Dynamically add an extension binding (e.g. browser registry auto-bind). */
  addExtensionBinding(ref: NamespacedId, config: Record<string, unknown> = {}): void {
    this.extensionBindings.push(extension(ref).with(config))
    this.invalidatePrepared()
  }

  private invalidatePrepared(): void {
    this.resolved = undefined
    this.discoveryPrepared = false
  }

  private collectPolicyHooks(
    event: import("@ecp/types").PolicyLifecycleEvent
  ): Array<{ hook: HookDefinition; config: Record<string, unknown> }> {
    return this.policyBindings.flatMap((b) => {
      const id = resolveId(b.getRef())
      const def = this.registry.getPolicy(id)
      if (!def) return []
      return def.hooks
        .filter((h) => h.event === event)
        .map((hook) => ({ hook, config: b.getConfig() }))
    })
  }

  /** Evaluate bound policies before registry accepts a registration. */
  async evaluateRegistryRegistration(request: RegistryRegistrationRequest): Promise<void> {
    await this.prepareForDiscovery()
    const ctx: PolicyContext = {
      workflow: emptyWorkflowStub(),
      run: { id: this.envId, input: {} },
      step: REGISTRY_CHECK_STEP,
      state: {},
      input: {},
      usage: createUsageLedger(),
      scope: "environment",
      operation:
        request.kind === "extension"
          ? "registry.registerExtension"
          : request.kind === "policy"
            ? "registry.registerPolicy"
            : "registry.registerRuntime",
      registryRequest: request,
    }
    const decision = await evaluatePolicies("policy:pre", this.collectPolicyHooks("policy:pre"), ctx)
    if (decision.type === "deny") {
      throw new RegistryRegistrationDeniedError(
        request.id,
        decision.reason ?? "Registration denied by policy"
      )
    }
  }

  private async emitEnvironmentEvent(
    event: import("@ecp/types").EnvironmentLifecycleEvent
  ): Promise<void> {
    const base = {
      event,
      workflow: emptyWorkflowStub(),
      run: { id: this.envId, input: {} },
      state: {},
      environment: this,
    }
    for (const binding of this.extensionBindings) {
      const id = resolveId(binding.getRef())
      const def = this.registry.getExtension(id)
      if (!def) continue
      const hooks = [...def.hooks]
        .filter((h) => h.event === event)
        .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
      for (const h of hooks) {
        await h.handler({
          ...base,
          extensionConfig: binding.getConfig(),
        } as import("../runtime/context.js").LifecycleContext & {
          extensionConfig?: Record<string, unknown>
        })
      }
    }
  }

  /** Discovery path: configuring only (no ready). */
  private async prepareForDiscovery(): Promise<void> {
    if (this.discoveryPrepared) return

    await this.ensureBoundExtensionsRegistered()

    await this.emitEnvironmentEvent("environment:created")

    if (!this.runtimeBinding) {
      throw new Error("Environment requires a runtime binding (.withRuntime(...))")
    }

    await this.emitEnvironmentEvent("environment:configuring")
    this.discoveryPrepared = true
  }

  /** Run path: full binding resolution and ready. */
  private async prepareForRun(): Promise<ResolvedBindings> {
    await this.prepareForDiscovery()
    if (this.resolved) return this.resolved

    const rtId = resolveId(this.runtimeBinding!.getRef())
    const rtDef = this.registry.getRuntime(rtId)
    if (!rtDef) throw new Error(`Runtime ${rtId} is not registered`)

    const extensionBindings = this.extensionBindings.map((b, i) => ({
      id: resolveId(b.getRef()),
      label: b.getLabel(),
      order: i,
      rawConfig: b.getConfig(),
    }))

    const policyBindings = this.policyBindings.map((b, i) => ({
      id: resolveId(b.getRef()),
      label: b.getLabel(),
      order: i,
      rawConfig: b.getConfig(),
    }))

    const extensionHooks = extensionBindings.flatMap((ext) => {
      const def = this.registry.getExtension(ext.id)
      return def?.hooks ?? []
    })

    const policyHooks = policyBindings.flatMap((pol) => {
      const def = this.registry.getPolicy(pol.id)
      if (!def) return []
      return def.hooks.map((hook) => ({ hook, config: pol.rawConfig }))
    })

    this.resolved = await resolveBindingsForRun(
      {
        id: rtId,
        label: this.runtimeBinding!.getLabel(),
        rawConfig: this.runtimeBinding!.getConfig(),
      },
      extensionBindings,
      policyBindings,
      extensionHooks,
      policyHooks,
      this.configResolvers
    )

    await this.emitEnvironmentEvent("environment:ready")
    return this.resolved
  }

  private resolveBindings(): ResolvedBindings {
    if (!this.resolved) {
      throw new Error("Environment not prepared for run; call run() or validate(workflow) first")
    }
    return this.resolved
  }

  /** Prepare bindings for execution and emit environment:ready. */
  async ensureReady(): Promise<void> {
    await this.prepareForRun()
  }

  compile(): EnvironmentManifest {
    if (!this.runtimeBinding) {
      throw new Error("Environment requires a runtime binding (.withRuntime(...))")
    }
    const rtId = resolveId(this.runtimeBinding.getRef())
    return {
      schema: "@ecp.environment",
      version: LATEST_ECP_VERSION,
      environment: {
        id: this.envId,
        ...(this.envLabel ? { label: this.envLabel } : {}),
      },
      runtime: {
        id: rtId,
        ...(this.runtimeBinding.getLabel() ? { label: this.runtimeBinding.getLabel() } : {}),
        config: manifestConfig(this.runtimeBinding.getConfig()),
      },
      extensions: this.extensionBindings.map((b, i) => ({
        id: resolveId(b.getRef()),
        ...(b.getLabel() ? { label: b.getLabel() } : {}),
        order: i,
        config: manifestConfig(b.getConfig()),
      })),
      policies: this.policyBindings.map((b, i) => ({
        id: resolveId(b.getRef()),
        ...(b.getLabel() ? { label: b.getLabel() } : {}),
        order: i,
        config: manifestConfig(b.getConfig()),
      })),
    }
  }

  async validate(workflow?: WorkflowManifest): Promise<ValidationResult> {
    if (workflow) {
      await this.prepareForRun()
      return validateEnvironmentWithWorkflow(
        workflow,
        await this.describe(),
        this.resolveBindings()
      )
    }
    await this.prepareForDiscovery()
    return {
      schema: "@ecp.validation.result",
      version: LATEST_ECP_VERSION,
      valid: true,
      errors: [],
      warnings: [],
    }
  }

  async describe(query?: DescribeQuery): Promise<EnvironmentDescriptor> {
    await this.prepareForDiscovery()
    return buildDescriptor(this.registry, this.compile(), query)
  }

  getRegistry(): Registry {
    return this.registry
  }

  /**
   * Register extension definitions for all bindings (catalog lookup or inline def).
   * Idempotent; safe to call before encode, decode, describe, or run.
   * @category Environment
   */
  async ensureBoundExtensionsRegistered(): Promise<void> {
    await ensureBoundExtensions(this.extensionBindings, this.registry)
  }

  /** Environment id (for utility operations). @category Environment */
  getEnvId(): string {
    return this.envId
  }

  /** Environment label when set. @category Environment */
  getEnvLabel(): string | undefined {
    return this.envLabel
  }

  /**
   * Encode a document via format extensions or default JSON codec.
   * Does not emit workflow lifecycle events.
   * @category Environment
   */
  encode(input: unknown): EncodeOperationBuilder {
    return createEncodeBuilder(this, input)
  }

  /**
   * Decode encoded content via format extensions or default JSON codec.
   * Does not emit workflow lifecycle events.
   * @category Environment
   */
  decode(input: unknown): DecodeOperationBuilder {
    return createDecodeBuilder(this, input)
  }

  /**
   * Apply a canonical JSON patch (not TOON).
   * @category Environment
   */
  patch<T = unknown>(document: T): PatchOperationBuilder<T> {
    return createPatchBuilder(document)
  }

  /**
   * Initialize environment for operational use and return an {@link Ecp} instance.
   * @category Environment
   */
  async init(): Promise<Ecp> {
    await this.prepareForRun()
    return new EcpImpl(this)
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult> {
    const descriptor = await this.describe()
    return searchCapabilities(query, descriptor, options)
  }

  async dispose(): Promise<void> {
    await this.emitEnvironmentEvent("environment:terminate")
    this.invalidatePrepared()
  }

  async run(workflow: WorkflowManifest, options?: RunOptions): Promise<RunResult> {
    await this.prepareForRun()
    const validation = await validateEnvironmentWithWorkflow(
      workflow,
      await this.describe(),
      this.resolveBindings()
    )
    if (!validation.valid) {
      throw new Error(
        `Workflow validation failed: ${validation.errors.map((e) => e.message).join("; ")}`
      )
    }
    if (options?.dryRun) {
      return {
        schema: "@ecp.run.result",
        version: LATEST_ECP_VERSION,
        run: { id: "dry-run", status: "completed" },
        state: options.input ?? {},
      }
    }

    await this.emitEnvironmentEvent("environment:beforeRun")

    const bindings = this.resolveBindings()
    const rtDef = this.registry.getRuntime(bindings.runtime.id)!
    const executor: RuntimeExecutor = rtDef.executor

    return executor.execute(workflow, {
      runId: globalThis.crypto.randomUUID(),
      input: options?.input ?? {},
      registry: this.registry,
      bindings,
      signal: options?.signal,
    })
  }
}

/**
 * Create an ECP environment (no default runtime; bind with `.withRuntime(...)`).
 * @category Environment
 */
export function environment(id: string, label?: string, registry: Registry = globalRegistry): Environment {
  return new Environment(id, label, undefined, [], [], registry)
}
