export {
  BROWSER_RUNTIME_ID,
  browserRuntimeDefinition,
  BrowserRuntimeExecutor,
  registerBrowserRuntime,
} from "./runtime/builtin-browser.js"

export {
  browserRegistryExtension,
  registerBrowserRegistryExtension,
  exposeBrowserRegistry,
  getActiveBrowserEnvironmentHost,
} from "./extensions/browser-registry.js"

export {
  browserSessionConfigExtension,
  registerBrowserSessionConfigExtension,
  createBrowserSessionConfig,
  setBrowserSessionValue,
  type BrowserSessionConfigController,
} from "./extensions/browser-session-config.js"
export { getBrowserSessionValue } from "./extensions/browser-session-config.js"

export {
  browserLocalConfigExtension,
  registerBrowserLocalConfigExtension,
} from "./extensions/browser-local-config.js"

export {
  registerBrowserDefaults,
  environment,
  createBrowserDemoEnvironment,
} from "./environment.js"
export { createEcp, type BrowserOperationalEcp, type CreateEcpOptions } from "./create-ecp.js"
export { installBrowserWorkflowShim, type BrowserWorkflowShim } from "./workflow-shim.js"
export {
  BrowserAuthoringService,
  type AuthoringPanels,
  type CreateWorkflowResult,
  type PatchWorkflowResult,
} from "./authoring/browser-authoring-service.js"
export { encodeAuthoringPanels } from "./authoring/browser-authoring-panels.js"
export {
  BROWSER_HARNESS_CAPABILITY,
  BROWSER_HARNESS_ID,
  HARNESS_TASKS,
  BROWSER_HARNESS_CAPABILITY as WORKFLOW_AUTHORING_CAPABILITY,
  BROWSER_HARNESS_CAPABILITY as INTENT_CLASSIFICATION_CAPABILITY,
} from "@ecp/harnesses-browser"
export type { BrowserEcpGlobal } from "./extensions/browser-registry.js"
export type { Ecp } from "@ecp/core"

export {
  workflow,
  step,
  ref,
  state,
  env,
  expr,
  parallel,
  branch,
  loop,
  extension,
  runtime,
  policy,
  defineExtension,
  defineRuntime,
  definePolicy,
  capability,
  capabilityFor,
  hook,
  Environment,
  Registry,
  globalRegistry,
} from "@ecp/core"
