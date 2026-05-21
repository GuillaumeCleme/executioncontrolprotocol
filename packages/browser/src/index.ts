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

export {
  browserLocalConfigExtension,
  registerBrowserLocalConfigExtension,
} from "./extensions/browser-local-config.js"

export {
  registerBrowserDefaults,
  environment,
  createBrowserDemoEnvironment,
} from "./environment.js"
export type { BrowserEcpGlobal } from "./extensions/browser-registry.js"

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
  boolean,
  number,
  string,
  array,
  Environment,
  Registry,
  globalRegistry,
} from "@ecp/core"
