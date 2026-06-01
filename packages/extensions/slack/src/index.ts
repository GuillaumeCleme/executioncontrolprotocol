import { defineExtension, capabilityFor, globalRegistry, catalogExtension } from "@ecp/core"
import { z } from "zod"

/** @ecp/slack extension (mock send for v1). @category Extensions */
export const slackExtension = defineExtension("@ecp", "slack")
  .withConfig({
    botToken: z.string().optional(),
    defaultChannel: z.string().optional(),
  })
  .withCapabilities([
    capabilityFor("@ecp/slack", "send")
      .withInput(z.object({ message: z.unknown(), channel: z.string().optional() }))
      .withOutput(z.object({ ok: z.boolean(), ts: z.string().optional() }))
      .withHandler(async () => ({
        ok: true,
        ts: `mock-${Date.now()}`,
      })),
  ])
  .build()

catalogExtension(slackExtension)

export async function registerSlackExtension(): Promise<void> {
  if (!globalRegistry.getExtension("@ecp/slack")) {
    await globalRegistry.registerExtension(slackExtension)
  }
}

export default slackExtension
