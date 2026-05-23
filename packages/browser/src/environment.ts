import {
  environment as coreEnvironment,
  extension,
  runtime,
  policy,
  Registry,
  globalRegistry,
} from "@ecp/core"
import type { Environment } from "@ecp/core"
import { registerStandardPolicies } from "@ecp/policies"
import { BROWSER_RUNTIME_ID, registerBrowserRuntime } from "./runtime/builtin-browser.js"
import { registerBrowserRegistryExtension } from "./extensions/browser-registry.js"
import { registerBrowserSessionConfigExtension } from "./extensions/browser-session-config.js"
import { registerBrowserLocalConfigExtension } from "./extensions/browser-local-config.js"

/** Register browser runtime and standard browser extensions. */
export async function registerBrowserDefaults(registry: Registry = globalRegistry): Promise<void> {
  await registerBrowserRuntime(registry)
  await registerBrowserRegistryExtension(registry)
  await registerBrowserSessionConfigExtension(registry)
  await registerBrowserLocalConfigExtension(registry)
  await registerStandardPolicies(registry)
}

/**
 * Browser demo environment with registry-control and browser-registry defaults.
 * @category Environment
 */
export function createBrowserDemoEnvironment(
  id: string,
  label?: string,
  registry: Registry = globalRegistry
): Environment {
  return coreEnvironment(id, label, registry)
    .withRuntime(runtime(BROWSER_RUNTIME_ID, "Browser Runtime"))
    .withExtensions([
      extension("@ecp/browser-registry").with({
        freezeOn: "environment:beforeRun",
        autoBindRegisteredExtensions: true,
        exposeGlobal: true,
        globalName: "ecp",
      }),
      extension("@ecp/browser-session-config").with({ persist: false }),
      extension("@ecp/browser-local-config").with({}),
    ])
    .withPolicies([
      policy("@ecp/registry-control").with({
        allowedExtensionNamespaces: ["@ecp/demo", "@customer/*", "@ecp/test"],
        deniedExtensionNamespaces: [],
        allowDynamicExtensionRegistration: true,
        allowAutoBind: true,
      }),
    ])
}

/**
 * Create a browser environment with `@ecp/browser` runtime pre-bound.
 * @category Environment
 */
export async function environment(id: string, label?: string): Promise<Environment> {
  await registerBrowserDefaults()
  return createBrowserDemoEnvironment(id, label)
}
