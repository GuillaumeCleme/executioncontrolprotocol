import { Registry } from "@executioncontrolprotocol/core"
import { createBrowserDemoEnvironment, registerBrowserDefaults } from "../src/environment.js"

/** Demo browser environment with registry-control and browser-registry defaults. */
export async function createBrowserTestEnvironment(id = "browser-test", label?: string) {
  const registry = new Registry()
  await registerBrowserDefaults(registry)
  return createBrowserDemoEnvironment(id, label, registry)
}
