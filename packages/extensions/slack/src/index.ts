import { defineExtension, capabilityFor, globalRegistry, string } from "@ecp/core"
import { z } from "zod"

/** @ecp/slack extension (mock send for v1). @category Extensions */
export const slackExtension = defineExtension("@ecp", "slack")
  .withConfig({
    botToken: string().optional(),
    defaultChannel: string().optional(),
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

export function registerSlackExtension(): void {
  if (!globalRegistry.getExtension("@ecp/slack")) {
    globalRegistry.registerExtension(slackExtension)
  }
}

export default slackExtension
