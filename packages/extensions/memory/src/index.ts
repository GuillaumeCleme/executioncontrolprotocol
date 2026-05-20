import { defineExtension, capabilityFor, globalRegistry, hook, boolean, array, string } from "@ecp/core"
import { z } from "zod"

const store = new Map<string, unknown[]>()

/** In-memory stub for @ecp/memory. @category Extensions */
export const memoryExtension = defineExtension("@ecp", "memory")
  .withConfig({
    hydrateModels: boolean().default(true),
    rememberOutputs: boolean().default(false),
    collections: array(string()).default([]),
  })
  .withCapabilities([
    capabilityFor("@ecp/memory", "search")
      .withInput(z.object({ query: z.string(), since: z.string().optional() }))
      .withOutput(z.object({ results: z.array(z.unknown()) }))
      .withHandler(async (input) => {
        const q = (input as { query: string }).query.toLowerCase()
        const all = [...store.values()].flat()
        return {
          results: all.filter((r) => JSON.stringify(r).toLowerCase().includes(q)),
        }
      }),
    capabilityFor("@ecp/memory", "remember")
      .withInput(z.object({ entry: z.unknown(), collection: z.string().optional() }))
      .withOutput(z.object({ stored: z.boolean() }))
      .withHandler(async (input) => {
        const col = (input as { collection?: string }).collection ?? "default"
        const list = store.get(col) ?? []
        list.push((input as { entry: unknown }).entry)
        store.set(col, list)
        return { stored: true }
      }),
  ])
  .withHooks([
    hook("step:completed", async (ctx) => {
      if (ctx.output === undefined || !ctx.step) return
      const col = "step-outputs"
      const list = store.get(col) ?? []
      list.push({ stepId: ctx.step.id, output: ctx.output })
      store.set(col, list)
    }),
    hook("run:finally", async () => undefined),
  ])
  .build()

export function registerMemoryExtension(): void {
  if (!globalRegistry.getExtension("@ecp/memory")) {
    globalRegistry.registerExtension(memoryExtension)
  }
}

export default memoryExtension
