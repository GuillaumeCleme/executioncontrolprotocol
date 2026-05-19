import { LATEST_ECP_VERSION } from "@ecp/types"
import type {
  DescribeQuery,
  EnvironmentDescriptor,
  EnvironmentManifest,
  RunResult,
  SearchOptions,
  SearchResult,
  ValidationResult,
  WorkflowManifest,
} from "@ecp/types"
import type { NamespacedId } from "@ecp/types"
import type { ExtensionBindingBuilder } from "../bindings/extension.js"
import type { PolicyBindingBuilder } from "../bindings/policy.js"
import { runtime } from "../bindings/runtime.js"
import type { RuntimeBindingBuilder } from "../bindings/runtime.js"
import { Registry, globalRegistry } from "../registry/registry.js"
import { LOCAL_RUNTIME_ID, registerLocalRuntime } from "../runtime/builtin-local.js"
import type { RuntimeExecutor } from "../runtime/executor.js"
import { resolveEnvConfig, type ResolvedBindings } from "./bindings.js"
import { buildDescriptor } from "./describe.js"
import { searchCapabilities } from "./search.js"
import { validateEnvironmentWithWorkflow } from "../validate/environment.js"

function resolveId(ref: NamespacedId | { id: NamespacedId } | string): NamespacedId {
  if (typeof ref === "string") return ref as NamespacedId
  if ("id" in ref) return ref.id
  return ref as NamespacedId
}

/** Run options. @category Environment */
export interface RunOptions {
  input?: Record<string, unknown>
  dryRun?: boolean
}

/**
 * Configured ECP environment.
 * @category Environment
 */
export class Environment {
  private resolved?: ResolvedBindings

  constructor(
    private readonly envId: string,
    private readonly envLabel: string | undefined,
    private runtimeBinding: RuntimeBindingBuilder | undefined,
    private extensionBindings: ExtensionBindingBuilder[] = [],
    private policyBindings: PolicyBindingBuilder[] = [],
    private readonly registry: Registry = globalRegistry
  ) {
    registerLocalRuntime()
  }

  withRuntime(binding: RuntimeBindingBuilder): this {
    this.runtimeBinding = binding
    return this
  }

  withExtensions(bindings: ExtensionBindingBuilder[]): this {
    this.extensionBindings = bindings
    return this
  }

  withPolicies(bindings: PolicyBindingBuilder[]): this {
    this.policyBindings = bindings
    return this
  }

  private resolveBindings(): ResolvedBindings {
    if (this.resolved) return this.resolved

    const rtRef = this.runtimeBinding?.getRef() ?? LOCAL_RUNTIME_ID
    const rtId = resolveId(rtRef)
    const rtDef = this.registry.getRuntime(rtId)
    if (!rtDef) throw new Error(`Runtime ${rtId} is not registered`)

    const extensions = this.extensionBindings.map((b, i) => ({
      id: resolveId(b.getRef()),
      label: b.getLabel(),
      order: i,
      config: resolveEnvConfig(b.getConfig()),
    }))

    const policies = this.policyBindings.map((b, i) => ({
      id: resolveId(b.getRef()),
      label: b.getLabel(),
      order: i,
      config: resolveEnvConfig(b.getConfig()),
    }))

    const extensionHooks = extensions.flatMap((ext) => {
      const def = this.registry.getExtension(ext.id)
      return def?.hooks ?? []
    })

    const policyHooks = policies.flatMap((pol) => {
      const def = this.registry.getPolicy(pol.id)
      if (!def) return []
      return def.hooks.map((hook) => ({ hook, config: pol.config }))
    })

    this.resolved = {
      runtime: {
        id: rtId,
        label: this.runtimeBinding?.getLabel(),
        config: resolveEnvConfig(this.runtimeBinding?.getConfig() ?? {}),
      },
      extensions,
      policies,
      extensionHooks,
      policyHooks,
    }
    return this.resolved
  }

  compile(): EnvironmentManifest {
    const bindings = this.resolveBindings()
    return {
      schema: "@ecp.environment",
      version: LATEST_ECP_VERSION,
      environment: {
        id: this.envId,
        ...(this.envLabel ? { label: this.envLabel } : {}),
      },
      runtime: {
        id: bindings.runtime.id,
        ...(bindings.runtime.label ? { label: bindings.runtime.label } : {}),
        config: bindings.runtime.config,
      },
      extensions: bindings.extensions.map((e) => ({
        id: e.id,
        ...(e.label ? { label: e.label } : {}),
        order: e.order,
        config: e.config,
      })),
      policies: bindings.policies.map((p) => ({
        id: p.id,
        ...(p.label ? { label: p.label } : {}),
        order: p.order,
        config: p.config,
      })),
    }
  }

  async validate(workflow?: WorkflowManifest): Promise<ValidationResult> {
    if (!workflow) {
      return {
        schema: "@ecp.validation.result",
        version: LATEST_ECP_VERSION,
        valid: true,
        errors: [],
        warnings: [],
      }
    }
    return validateEnvironmentWithWorkflow(
      workflow,
      await this.describe(),
      this.resolveBindings()
    )
  }

  async describe(query?: DescribeQuery): Promise<EnvironmentDescriptor> {
    return buildDescriptor(this.registry, this.compile(), query)
  }

  /** Registry used by this environment. */
  getRegistry(): Registry {
    return this.registry
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult> {
    const descriptor = await this.describe()
    return searchCapabilities(query, descriptor, options)
  }

  async run(
    workflow: WorkflowManifest,
    options?: RunOptions
  ): Promise<RunResult> {
    const validation = await this.validate(workflow)
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

    const bindings = this.resolveBindings()
    const rtId = bindings.runtime.id
    const rtDef = this.registry.getRuntime(rtId)!
    const executor: RuntimeExecutor = rtDef.executor

    return executor.execute(workflow, {
      runId: crypto.randomUUID(),
      input: options?.input ?? {},
      registry: this.registry,
      bindings,
    })
  }
}

/**
 * Create an ECP environment.
 * @category Environment
 */
export function environment(id: string, label?: string): Environment {
  registerLocalRuntime()
  return new Environment(id, label, undefined, [], [], globalRegistry).withRuntime(
    runtime(LOCAL_RUNTIME_ID, "Local Runtime")
  )
}
