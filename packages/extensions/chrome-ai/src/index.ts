import {
  catalogExtension,
  capabilityFor,
  defineExtension,
  globalRegistry,
  type Registry,
} from "@ecp/core"
import { z } from "zod"

const GenerateTextInput = z.object({
  prompt: z.string(),
  system: z.string().optional(),
})

interface ChromeLanguageModel {
  prompt(input: string): Promise<{ text: string }>
}

interface ChromeAiGlobal {
  LanguageModel?: {
    availability(): Promise<string>
    create(options?: { systemPrompt?: string }): Promise<ChromeLanguageModel>
  }
}

function chromeAi(): ChromeAiGlobal["LanguageModel"] | undefined {
  return (globalThis as ChromeAiGlobal).LanguageModel
}

/** Chrome built-in AI provider. @category Extensions */
export const chromeAiExtension = defineExtension("@ecp", "chrome-ai")
  .withCapabilities([
    capabilityFor("@ecp/chrome-ai", "checkAvailability")
      .withInput(z.object({}))
      .withOutput(z.object({ available: z.boolean(), status: z.string().optional() }))
      .withHandler(async () => {
        const model = chromeAi()
        if (!model?.availability) {
          return { available: false, status: "unsupported" }
        }
        const status = await model.availability()
        return { available: status === "available", status }
      }),
    capabilityFor("@ecp/chrome-ai", "generateText")
      .withInput(GenerateTextInput)
      .withOutput(z.object({ text: z.string() }))
      .withHandler(async (raw) => {
        const input = raw as z.infer<typeof GenerateTextInput>
        const model = chromeAi()
        if (!model?.create) {
          throw new Error("Chrome LanguageModel API is not available")
        }
        const session = await model.create({
          systemPrompt: input.system,
        })
        const response = await session.prompt(input.prompt)
        return { text: response.text }
      }),
  ])
  .build()

catalogExtension(chromeAiExtension)

/** Register Chrome AI extension. @category Extensions */
export async function registerChromeAiExtension(registry: Registry = globalRegistry): Promise<void> {
  if (!registry.getExtension("@ecp/chrome-ai")) {
    await registry.registerExtension(chromeAiExtension)
  }
}
