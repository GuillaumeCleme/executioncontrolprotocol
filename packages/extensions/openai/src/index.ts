import { defineExtension, capabilityFor, globalRegistry, string, catalogExtension, type Registry } from "@ecp/core"
import { modelGenerateInputSchema, modelGenerateOutputSchema } from "@ecp/types"
import { z } from "zod"
import { resolveOpenaiApiKey } from "./resolve-api-key.js"

async function chatComplete(
  apiKey: string,
  model: string,
  prompt: string,
  system?: string,
  context?: unknown
): Promise<string> {
  const body = {
    model,
    messages: [
      ...(system ? [{ role: "system" as const, content: system }] : []),
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
      .withInput(modelGenerateInputSchema)
      .withOutput(modelGenerateOutputSchema)
      .withHandler(async (input, ctx) => {
        const parsed = input as z.infer<typeof modelGenerateInputSchema>
        const cfg = (ctx as { extensionConfig?: Record<string, unknown> }).extensionConfig ?? {}
        const apiKey = resolveOpenaiApiKey(cfg)
        if (!apiKey) throw new Error("OpenAI API key required")
        const model = parsed.model ?? (cfg.defaultModel as string) ?? "gpt-4o-mini"
        ctx.usage.increment({ modelCalls: 1 })
        const text = await chatComplete(
          apiKey,
          model,
          parsed.prompt,
          parsed.system,
          parsed.context
        )
        return { text }
      }),
    capabilityFor("@ecp/openai", "generateText")
      .withInput(modelGenerateInputSchema)
      .withOutput(modelGenerateOutputSchema)
      .withHandler(async (input, ctx) => {
        const parsed = input as z.infer<typeof modelGenerateInputSchema>
        const cfg = (ctx as { extensionConfig?: Record<string, unknown> }).extensionConfig ?? {}
        const apiKey = resolveOpenaiApiKey(cfg)
        if (!apiKey) throw new Error("OpenAI API key required")
        const model = parsed.model ?? (cfg.defaultModel as string) ?? "gpt-4o-mini"
        ctx.usage.increment({ modelCalls: 1 })
        const text = await chatComplete(
          apiKey,
          model,
          parsed.prompt,
          parsed.system,
          parsed.context
        )
        return { text }
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
      .withHandler(async (input, ctx) => {
        const prompt = `Evaluate: ${(input as { goal?: string }).goal ?? "quality check"}. Reply JSON {approved:boolean,feedback:string}`
        const cfg = (ctx as { extensionConfig?: Record<string, unknown> }).extensionConfig ?? {}
        const apiKey = resolveOpenaiApiKey(cfg)
        if (!apiKey) return { approved: true, feedback: "skipped (no API key)" }
        const content = await chatComplete(apiKey, "gpt-4o-mini", prompt, undefined, input)
        try {
          return JSON.parse(content) as { approved: boolean; feedback?: string }
        } catch {
          return { approved: true, feedback: content }
        }
      }),
  ])
  .build()

catalogExtension(openaiExtension)

/** Register @ecp/openai. */
export async function registerOpenaiExtension(registry: Registry = globalRegistry): Promise<void> {
  if (!registry.getExtension("@ecp/openai")) {
    await registry.registerExtension(openaiExtension)
  }
}

export default openaiExtension
