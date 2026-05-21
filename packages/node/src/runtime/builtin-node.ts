import { defineRuntime, globalRegistry } from "@ecp/core"
import { number } from "@ecp/core"
import { NodeRuntimeExecutor } from "./node-executor.js"

export { NodeRuntimeExecutor } from "./node-executor.js"

/** Node runtime id. @category Runtime */
export const NODE_RUNTIME_ID = "@ecp/node" as const

/** Built-in Node runtime definition. @category Runtime */
export const nodeRuntimeDefinition = defineRuntime("@ecp", "node")
  .withConfig({
    maxConcurrency: number().optional(),
  })
  .withExecutor(new NodeRuntimeExecutor())

/** Register `@ecp/node` on the global registry. */
export function registerNodeRuntime(registry = globalRegistry): void {
  if (!registry.getRuntime(NODE_RUNTIME_ID)) {
    registry.registerRuntime(nodeRuntimeDefinition)
  }
}
