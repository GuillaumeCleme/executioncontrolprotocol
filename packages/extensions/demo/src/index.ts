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
  } else if (/update|patch|change.*step|modify.*workflow|failed on|help me fix/.test(lower)) {
    intent = "workflow-patch"
  } else if (/what is ecp|how does|how do|execution control protocol/.test(lower)) {
    intent = "faq"
  }
  return `INTENT ${intent}`
}

function demoAssistantResponse(prompt: string): string {
  const msgMatch = prompt.match(/User message:\s*(.+?)(?:\n|$)/i)
  const message = (msgMatch?.[1] ?? prompt).toLowerCase()
  if (/what is ecp|execution control protocol/.test(message)) {
    return 'REPLY\n  ANSWER "ECP is the Execution Control Protocol: portable workflows run in governed environments that bind tools, models, policies, and runtimes."'
  }
  if (/what can you do|what are you good at/.test(message)) {
    return 'REPLY\n  ANSWER "I build and patch ECP workflows, answer ECP questions, and explain capabilities registered in this environment. I cannot install extensions."'
  }
  if (/register|install.*extension/.test(message)) {
    return 'REPLY\n  ANSWER "I cannot register or install extensions. I can list loaded capabilities and help you build workflows with them."'
  }
  if (/capabilit|extensions?|plugins?/.test(message)) {
    return 'REPLY\n  ANSWER "Loaded capabilities include @ecp/test.echo and @ecp/demo.summarize, @ecp/demo.validate, @ecp/demo.notify, @ecp/demo.translate."\n  CITATION extension @ecp/test "@ecp/test.echo"'
  }
  if (/error|fail|fix/.test(message)) {
    return 'REPLY\n  ANSWER "The echo step failed with an error; patch the echo step input to recover."\n  CITATION step echo "Failed echo step in run context."'
  }
  return 'REPLY\n  ANSWER "I am the ECP assistant. Ask about workflows, ECP, or available capabilities."'
}

function demoGenerateHandler(input: { prompt?: string; system?: string }) {
  const prompt = input.prompt ?? ""
  const system = input.system ?? ""
  if (/intent router/i.test(system)) {
    return { text: demoIntentResponse(prompt) }
  }
  if (/ECP assistant|harness\.reply|REPLY block/i.test(system)) {
    return { text: demoAssistantResponse(prompt) }
  }
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
      .withHandler(async (input) => demoGenerateHandler(input as { prompt?: string; system?: string })),
    capabilityFor("@ecp/demo", "generateText")
      .withInput(GenerateTextInput)
      .withOutput(GenerateTextOutput)
      .withHandler(async (input) => demoGenerateHandler(input as { prompt?: string; system?: string })),
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
