import { defineRuntime, globalRegistry, boolean, number } from "@ecp/core"
import { BrowserRuntimeExecutor } from "./browser-executor.js"

export { BrowserRuntimeExecutor } from "./browser-executor.js"

/** Browser runtime id. @category Runtime */
export const BROWSER_RUNTIME_ID = "@ecp/browser" as const

/** Built-in browser runtime definition. @category Runtime */
export const browserRuntimeDefinition = defineRuntime("@ecp", "browser")
  .withConfig({
    maxConcurrency: number().optional(),
    allowParallel: boolean().default(true),
    allowLongRunningTasks: boolean().default(false),
  })
  .withExecutor(new BrowserRuntimeExecutor())

/** Register `@ecp/browser` on the global registry. */
export function registerBrowserRuntime(registry = globalRegistry): void {
  if (!registry.getRuntime(BROWSER_RUNTIME_ID)) {
    registry.registerRuntime(browserRuntimeDefinition)
  }
}
