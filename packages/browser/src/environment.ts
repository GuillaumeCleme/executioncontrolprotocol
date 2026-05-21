import { environment as coreEnvironment, runtime } from "@ecp/core"
import type { Environment } from "@ecp/core"
import { registerStandardPolicies } from "@ecp/policies"
import { BROWSER_RUNTIME_ID, registerBrowserRuntime } from "./runtime/builtin-browser.js"
import { registerBrowserRegistryExtension } from "./extensions/browser-registry.js"
import { registerBrowserSessionConfigExtension } from "./extensions/browser-session-config.js"
import { registerBrowserLocalConfigExtension } from "./extensions/browser-local-config.js"

/** Register browser runtime and standard browser extensions. */
export function registerBrowserDefaults(): void {
  registerBrowserRuntime()
  registerBrowserRegistryExtension()
  registerBrowserSessionConfigExtension()
  registerBrowserLocalConfigExtension()
  registerStandardPolicies()
}

/**
 * Create a browser environment with `@ecp/browser` runtime pre-bound.
 * @category Environment
 */
export function environment(id: string, label?: string): Environment {
  registerBrowserDefaults()
  return coreEnvironment(id, label).withRuntime(
    runtime(BROWSER_RUNTIME_ID, "Browser Runtime")
  )
}
