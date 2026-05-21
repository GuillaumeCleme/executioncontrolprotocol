/**
 * Browser-safe subset of @ecp/core (no Node compile/loaders).
 * @packageDocumentation
 */

export * from "./browser.js"
export { environment, Environment, type RunOptions } from "./environment/environment.js"
export type { EnvironmentConfigResolver } from "./environment/config-resolver.js"
export { extension } from "./bindings/extension.js"
export { runtime } from "./bindings/runtime.js"
export { policy } from "./bindings/policy.js"
export { Registry, globalRegistry, type RegistryRegistrationGuard } from "./registry/registry.js"
export {
  RegistryFrozenError,
  RegistryRegistrationDeniedError,
} from "./registry/errors.js"
export { matchesNamespace, matchesAnyNamespace } from "./registry/namespace.js"
export { InMemoryRuntimeExecutor } from "./runtime/in-memory-executor.js"
export type { RuntimeExecutor, RuntimeExecutionContext } from "./runtime/executor.js"
export type {
  PolicyContext,
  CapabilityContext,
  LifecycleContext,
  EnvironmentLifecycleHost,
} from "./runtime/context.js"
export { createUsageLedger } from "./runtime/context.js"
export { evaluatePolicies } from "./runtime/policy-engine.js"
export type {
  ExtensionDefinition,
  RuntimeDefinition,
  PolicyDefinition,
  CapabilityDefinition,
  HookDefinition,
} from "./definitions/types.js"
export { registerTestExtension } from "./testing/test-extension.js"
