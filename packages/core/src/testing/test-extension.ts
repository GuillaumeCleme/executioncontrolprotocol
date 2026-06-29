import { defineExtension } from "../definitions/extension.js"
import { capabilityFor } from "../definitions/capability.js"
import { catalogExtension } from "../registry/extension-catalog.js"
import { globalRegistry } from "../registry/registry.js"
import { z } from "zod"

/** In-repo stub extension for examples and tests. @category Testing */
export const testExtension = defineExtension("@executioncontrolprotocol", "test")
  .withConfig({})
  .withCapabilities([
    capabilityFor("@executioncontrolprotocol/test", "echo")
      .withInput(z.object({ value: z.unknown().optional() }))
      .withOutput(z.object({ echo: z.unknown() }))
      .withHandler(async (input) => ({
        echo: (input as { value?: unknown }).value ?? "hi",
      })),
  ])
  .build()

catalogExtension(testExtension)

/** Register @executioncontrolprotocol/test.echo for examples and tests. */
export async function registerTestExtension(
  registry = globalRegistry
): Promise<void> {
  if (!registry.getExtension("@executioncontrolprotocol/test")) {
    await registry.registerExtension(testExtension)
  }
}
