import { defineExtension } from "../definitions/extension.js"
import { capabilityFor } from "../definitions/capability.js"
import { globalRegistry } from "../registry/registry.js"
import { z } from "zod"

const testExtension = defineExtension("@ecp", "test")
  .withConfig({})
  .withCapabilities([
    capabilityFor("@ecp/test", "echo")
      .withInput(z.object({ value: z.unknown().optional() }))
      .withOutput(z.object({ echo: z.unknown() }))
      .withHandler(async (input) => ({
        echo: (input as { value?: unknown }).value ?? "hi",
      })),
  ])
  .build()

/** Register @ecp/test.echo for examples and tests. */
export function registerTestExtension(): void {
  if (!globalRegistry.getExtension("@ecp/test")) {
    globalRegistry.registerExtension(testExtension)
  }
}
