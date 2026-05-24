import {
  catalogExtension,
  capabilityFor,
  defineExtension,
  globalRegistry,
  type Registry,
} from "@ecp/core"
import { LATEST_ECP_VERSION } from "@ecp/types"
import { z } from "zod"

const GenerateTextInput = z.object({
  prompt: z.string(),
  system: z.string().optional(),
})

const GenerateTextOutput = z.object({
  text: z.string(),
})

/** Demo model provider for offline browser demo. @category Extensions */
export const demoExtension = defineExtension("@ecp", "demo")
  .withCapabilities([
    capabilityFor("@ecp/demo", "generateText")
      .withInput(GenerateTextInput)
      .withOutput(GenerateTextOutput)
      .withHandler(async (input) => {
        const prompt = (input as { prompt?: string }).prompt ?? ""
        if (prompt.includes("@ecp.patch") || prompt.includes("schema @ecp.patch")) {
          return {
            text: [
              'schema: "@ecp.patch"',
              `version: "${LATEST_ECP_VERSION}"`,
              "entries[1]{path,value}:",
              '  steps[echo].input,"{value:\\"patched\\"}"',
            ].join("\n"),
          }
        }
        return {
          text: [
          'schema: "@ecp.workflow"',
          `version: "${LATEST_ECP_VERSION}"`,
          "workflow:",
          "  id: demo-generated",
          "steps[1]{id,uses,label,as}:",
          "  echo,@ecp/test.echo,Demo Echo,echo",
        ].join("\n"),
        }
      }),
  ])
  .build()

catalogExtension(demoExtension)

/** Register demo extension. @category Extensions */
export async function registerDemoExtension(registry: Registry = globalRegistry): Promise<void> {
  if (!registry.getExtension("@ecp/demo")) {
    await registry.registerExtension(demoExtension)
  }
}
