import { defineRuntime } from "../definitions/runtime.js"
import { LocalRuntimeExecutor } from "./local-executor.js"
import { globalRegistry } from "../registry/registry.js"

const LOCAL_RUNTIME_ID = "@ecp/local" as const

/** Built-in local runtime definition. @category Runtime */
export const localRuntimeDefinition = defineRuntime("@ecp", "local")
  .withConfig({})
  .withExecutor(new LocalRuntimeExecutor())

/** Register @ecp/local on the global registry. */
export function registerLocalRuntime(): void {
  if (!globalRegistry.getRuntime(LOCAL_RUNTIME_ID)) {
    globalRegistry.registerRuntime(localRuntimeDefinition)
  }
}

export { LOCAL_RUNTIME_ID }
