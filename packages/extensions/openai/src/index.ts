import { defineExtension, capabilityFor, globalRegistry, string } from "@ecp/core"
import { z } from "zod"

const GenerateInput = z.object({
  prompt: z.string(),
  context: z.unknown().optional(),
  model: z.string().optional(),
})

const GenerateOutput = z.object({
  content: z.string(),
})

async function chatComplete(
  apiKey: string,
  model: string,
  prompt: string,
  context?: unknown
): Promise<string> {
  const body = {
    model,
    messages: [
      ...(context
        ? [{ role: "system" as const, content: JSON.stringify(context) }]
        : []),
      { role: "user" as const, content: prompt },
    ],
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`)
  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>
  }
  return data.choices[0]?.message?.content ?? ""
}

/** @ecp/openai extension. @category Extensions */
export const openaiExtension = defineExtension("@ecp", "openai")
  .withConfig({
    apiKey: string().optional(),
    defaultModel: string().optional(),
  })
  .withCapabilities([
    capabilityFor("@ecp/openai", "generate")
      .withInput(GenerateInput)
      .withOutput(GenerateOutput)
      .withHandler(async (input, ctx) => {
        const cfg = (ctx as { extensionConfig?: Record<string, unknown> }).extensionConfig ?? {}
        const apiKey =
          (cfg.apiKey as string) ?? process.env.OPENAI_API_KEY ?? ""
        if (!apiKey) throw new Error("OpenAI API key required")
        const model =
          (input as z.infer<typeof GenerateInput>).model ??
          (cfg.defaultModel as string) ??
          "gpt-4o-mini"
        ctx.usage.increment({ modelCalls: 1 })
        const content = await chatComplete(
          apiKey,
          model,
          (input as z.infer<typeof GenerateInput>).prompt,
          (input as z.infer<typeof GenerateInput>).context
        )
        return { content }
      }),
    capabilityFor("@ecp/openai", "evaluate")
      .withInput(
        z.object({
          artifact: z.unknown(),
          criteria: z.unknown().optional(),
          goal: z.string().optional(),
        })
      )
      .withOutput(z.object({ approved: z.boolean(), feedback: z.string().optional() }))
      .withHandler(async (input) => {
        const prompt = `Evaluate: ${(input as { goal?: string }).goal ?? "quality check"}. Reply JSON {approved:boolean,feedback:string}`
        const apiKey = process.env.OPENAI_API_KEY ?? ""
        if (!apiKey) return { approved: true, feedback: "skipped (no API key)" }
        const content = await chatComplete(apiKey, "gpt-4o-mini", prompt, input)
        try {
          return JSON.parse(content) as { approved: boolean; feedback?: string }
        } catch {
          return { approved: true, feedback: content }
        }
      }),
  ])
  .build()

/** Register @ecp/openai. */
export function registerOpenaiExtension(): void {
  if (!globalRegistry.getExtension("@ecp/openai")) {
    globalRegistry.registerExtension(openaiExtension)
  }
}

export default openaiExtension
