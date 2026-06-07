import { defineRuntime, globalRegistry } from "@ecp/core"
import { z } from "zod"
import { NodeRuntimeExecutor } from "./node-executor.js"

export { NodeRuntimeExecutor } from "./node-executor.js"

/** Node runtime id. @category Runtime */
export const NODE_RUNTIME_ID = "@ecp/node" as const

/** Built-in Node runtime definition. @category Runtime */
export const nodeRuntimeDefinition = defineRuntime("@ecp", "node")
  .withConfig({
    maxConcurrency: z.number().optional(),
  })
  .withExecutor(new NodeRuntimeExecutor())

/** Register `@ecp/node` on the global registry. */
export async function registerNodeRuntime(registry = globalRegistry): Promise<void> {
  if (!registry.getRuntime(NODE_RUNTIME_ID)) {
    await registry.registerRuntime(nodeRuntimeDefinition)
  }
}
