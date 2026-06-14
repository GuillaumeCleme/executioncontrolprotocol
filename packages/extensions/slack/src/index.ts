import { defineExtension, capabilityFor, globalRegistry, catalogExtension } from "@executioncontextprotocol/core"
import { z } from "zod"

/** @executioncontextprotocol/slack extension (mock send for v1). @category Extensions */
export const slackExtension = defineExtension("@executioncontextprotocol", "slack")
  .withConfig({
    botToken: z.string().optional(),
    defaultChannel: z.string().optional(),
  })
  .withCapabilities([
    capabilityFor("@executioncontextprotocol/slack", "send")
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
  if (!globalRegistry.getExtension("@executioncontextprotocol/slack")) {
    await globalRegistry.registerExtension(slackExtension)
  }
}

export default slackExtension
