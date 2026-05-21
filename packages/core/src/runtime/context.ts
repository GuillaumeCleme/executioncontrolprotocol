import type {
  LifecycleEvent,
  PolicyEvaluationScope,
  RegistryRegistrationRequest,
  WorkflowManifest,
} from "@ecp/types"
import type { PendingMutation, StoreStateHandle } from "@ecp/types"
import type { StoreContext } from "./store.js"

/** Run-level context. @category Runtime */
export interface RunContext {
  id: string
  input: Record<string, unknown>
}

/** Step execution context. @category Runtime */
export interface StepExecutionContext {
  id: string
  capabilityId: string
  label?: string
}

/** Capability invocation context. @category Runtime */
export interface CapabilityContext {
  store: StoreContext
  state: Readonly<Record<string, unknown>>
  run: RunContext
  step: StepExecutionContext
  logger: Logger
  usage: UsageLedger
  capabilities: {
    call(id: string, input: unknown): Promise<unknown>
  }
}

/** Host surface exposed on environment lifecycle hooks. @category Environment */
export interface EnvironmentLifecycleHost {
  registerConfigResolver(resolver: import("../environment/config-resolver.js").EnvironmentConfigResolver): void
  getRegistry(): import("../registry/registry.js").Registry
  addExtensionBinding?(ref: import("@ecp/types").NamespacedId, config?: Record<string, unknown>): void
  /** Evaluate bound policies before accepting a registry registration. */
  evaluateRegistryRegistration?(request: RegistryRegistrationRequest): Promise<void>
}

/** Lifecycle hook context. @category Runtime */
export interface LifecycleContext {
  event: LifecycleEvent
  workflow: WorkflowManifest
  run: RunContext
  step?: StepExecutionContext
  state: Record<string, unknown>
  /** Step capability output when available (e.g. `step:completed`). */
  output?: unknown
  /** Present on `environment:*` events. */
  environment?: EnvironmentLifecycleHost
}

/** Policy evaluation context. @category Policies */
export interface PolicyContext {
  workflow: WorkflowManifest
  run: RunContext
  step: StepExecutionContext
  state: Record<string, unknown>
  input: Record<string, unknown>
  output?: unknown
  mutableStateHandles?: StoreStateHandle[]
  pendingMutations?: PendingMutation[]
  proposedState?: Record<string, unknown>
  usage: UsageLedger
  /** Non-step policy scope (e.g. environment registry checks). */
  scope?: PolicyEvaluationScope
  /** Operation identifier for environment-scoped checks. */
  operation?: string
  /** Present when evaluating dynamic registry registration. */
  registryRequest?: RegistryRegistrationRequest
}

/** Minimal logger. @category Runtime */
export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void
  warn(message: string, meta?: Record<string, unknown>): void
  error(message: string, meta?: Record<string, unknown>): void
}

/** Usage tracking. @category Runtime */
export interface UsageLedger {
  modelCalls: number
  costUsd: number
  tokens: number
  increment(partial: Partial<Pick<UsageLedger, "modelCalls" | "costUsd" | "tokens">>): void
}

/** Create a usage ledger. */
export function createUsageLedger(): UsageLedger {
  const ledger = { modelCalls: 0, costUsd: 0, tokens: 0 }
  return {
    ...ledger,
    increment(partial) {
      if (partial.modelCalls) ledger.modelCalls += partial.modelCalls
      if (partial.costUsd) ledger.costUsd += partial.costUsd
      if (partial.tokens) ledger.tokens += partial.tokens
    },
  }
}

/** Console logger implementation. */
export function createConsoleLogger(): Logger {
  return {
    info: (m, meta) => console.log(m, meta ?? ""),
    warn: (m, meta) => console.warn(m, meta ?? ""),
    error: (m, meta) => console.error(m, meta ?? ""),
  }
}
