import { defineExtension, capabilityFor, globalRegistry, catalogExtension } from "@executioncontextprotocol/core"
import { z } from "zod"

const blobs = new Map<string, unknown>()

/** In-memory @executioncontextprotocol/storage stub. @category Extensions */
export const storageExtension = defineExtension("@executioncontextprotocol", "storage")
  .withConfig({
    prefix: z.string().optional(),
  })
  .withCapabilities([
    capabilityFor("@executioncontextprotocol/storage", "write")
      .withInput(z.object({ key: z.string(), value: z.unknown() }))
      .withOutput(z.object({ ok: z.boolean() }))
      .withHandler(async (input, ctx) => {
        const cfg = (ctx as { extensionConfig?: Record<string, unknown> }).extensionConfig ?? {}
        const prefix = (cfg.prefix as string) ?? ""
        const key = `${prefix}${(input as { key: string }).key}`
        blobs.set(key, (input as { value: unknown }).value)
        return { ok: true }
      }),
    capabilityFor("@executioncontextprotocol/storage", "read")
      .withInput(z.object({ key: z.string() }))
      .withOutput(z.object({ value: z.unknown().optional() }))
      .withHandler(async (input, ctx) => {
        const cfg = (ctx as { extensionConfig?: Record<string, unknown> }).extensionConfig ?? {}
        const prefix = (cfg.prefix as string) ?? ""
        const key = `${prefix}${(input as { key: string }).key}`
        return { value: blobs.get(key) }
      }),
  ])
  .build()

catalogExtension(storageExtension)

/** Register @executioncontextprotocol/storage. */
export async function registerStorageExtension(): Promise<void> {
  if (!globalRegistry.getExtension("@executioncontextprotocol/storage")) {
    await globalRegistry.registerExtension(storageExtension)
  }
}

export default storageExtension
