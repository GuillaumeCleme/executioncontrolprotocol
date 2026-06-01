import { defineExtension, capabilityFor, globalRegistry, string, catalogExtension } from "@ecp/core"
import { z } from "zod"

const blobs = new Map<string, unknown>()

/** In-memory @ecp/storage stub. @category Extensions */
export const storageExtension = defineExtension("@ecp", "storage")
  .withConfig({
    prefix: string().optional(),
  })
  .withCapabilities([
    capabilityFor("@ecp/storage", "write")
      .withInput(z.object({ key: z.string(), value: z.unknown() }))
      .withOutput(z.object({ ok: z.boolean() }))
      .withHandler(async (input, ctx) => {
        const cfg = (ctx as { extensionConfig?: Record<string, unknown> }).extensionConfig ?? {}
        const prefix = (cfg.prefix as string) ?? ""
        const key = `${prefix}${(input as { key: string }).key}`
        blobs.set(key, (input as { value: unknown }).value)
        return { ok: true }
      }),
    capabilityFor("@ecp/storage", "read")
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

/** Register @ecp/storage. */
export async function registerStorageExtension(): Promise<void> {
  if (!globalRegistry.getExtension("@ecp/storage")) {
    await globalRegistry.registerExtension(storageExtension)
  }
}

export default storageExtension
