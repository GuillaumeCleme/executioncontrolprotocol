import {
  catalogExtension,
  capabilityFor,
  defineExtension,
  globalRegistry,
  type Registry,
} from "@ecp/core"
import { modelGenerateInputSchema, modelGenerateOutputSchema } from "@ecp/types"
import { z } from "zod"

const GenerateTextInput = z.object({
  prompt: z.string(),
  system: z.string().optional(),
})

const GenerateTextOutput = z.object({
  text: z.string(),
})

function demoIntentResponse(prompt: string): string {
  const lower = prompt.toLowerCase()
  let intent = "general"
  if (/create.*workflow|new workflow|sends.*email|build a workflow/.test(lower)) {
    intent = "workflow-create"
  } else if (/update|patch|change.*step|modify.*workflow/.test(lower)) {
    intent = "workflow-patch"
  } else if (/what is|how does|faq|explain/.test(lower)) {
    intent = "faq"
  }
  return `INTENT ${intent}`
}

function demoGenerateHandler(input: { prompt?: string }) {
  const prompt = input.prompt ?? ""
  if (prompt.includes("User message:")) {
    return { text: demoIntentResponse(prompt) }
  }
  if (prompt.includes("@ecp.patch") || /PATCH\s+WORKFLOW/i.test(prompt)) {
    return {
      text: [
        "PATCH WORKFLOW echo-test",
        "UPDATE STEP echo",
        '  WITH value = "patched"',
      ].join("\n"),
    }
  }
  return {
    text: [
      'WORKFLOW demo-generated "Demo generated"',
      "STEP echo USES @ecp/test.echo",
      '  LABEL "Demo Echo"',
      '  WITH value = "hello"',
      "  AS echo",
    ].join("\n"),
  }
}

const DemoStubInput = z.object({ payload: z.unknown().optional() })
const DemoStubOutput = z.object({ ok: z.boolean(), result: z.unknown().optional() })

function demoStubHandler(input: { payload?: unknown }) {
  return { ok: true, result: input.payload ?? "demo-stub" }
}

/** Demo model provider for offline browser demo. @category Extensions */
export const demoExtension = defineExtension("@ecp", "demo")
  .withCapabilities([
    capabilityFor("@ecp/demo", "generate")
      .withInput(modelGenerateInputSchema)
      .withOutput(modelGenerateOutputSchema)
      .withHandler(async (input) => demoGenerateHandler(input as { prompt?: string })),
    capabilityFor("@ecp/demo", "generateText")
      .withInput(GenerateTextInput)
      .withOutput(GenerateTextOutput)
      .withHandler(async (input) => demoGenerateHandler(input as { prompt?: string })),
    capabilityFor("@ecp/demo", "summarize")
      .withInput(DemoStubInput)
      .withOutput(DemoStubOutput)
      .withHandler(async (input) => demoStubHandler(input as { payload?: unknown })),
    capabilityFor("@ecp/demo", "translate")
      .withInput(DemoStubInput)
      .withOutput(DemoStubOutput)
      .withHandler(async (input) => demoStubHandler(input as { payload?: unknown })),
    capabilityFor("@ecp/demo", "notify")
      .withInput(DemoStubInput)
      .withOutput(DemoStubOutput)
      .withHandler(async (input) => demoStubHandler(input as { payload?: unknown })),
    capabilityFor("@ecp/demo", "validate")
      .withInput(DemoStubInput)
      .withOutput(DemoStubOutput)
      .withHandler(async (input) => demoStubHandler(input as { payload?: unknown })),
  ])
  .build()

catalogExtension(demoExtension)

/** Register demo extension. @category Extensions */
export async function registerDemoExtension(registry: Registry = globalRegistry): Promise<void> {
  if (!registry.getExtension("@ecp/demo")) {
    await registry.registerExtension(demoExtension)
  }
}
