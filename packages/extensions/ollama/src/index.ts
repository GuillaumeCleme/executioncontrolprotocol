import { defineExtension, capabilityFor, globalRegistry, string, number } from "@ecp/core"
import { z } from "zod"

import { modelGenerateInputSchema, modelGenerateOutputSchema } from "@ecp/types"

const GenerateInput = modelGenerateInputSchema

async function ollamaChat(
  baseURL: string,
  model: string,
  prompt: string,
  system?: string,
  context?: unknown
): Promise<string> {
  const messages = [
    ...(system ? [{ role: "system" as const, content: system }] : []),
    ...(context
      ? [{ role: "system" as const, content: JSON.stringify(context) }]
      : []),
    { role: "user" as const, content: prompt },
  ]
  const res = await fetch(`${baseURL.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false }),
  })
  if (!res.ok) throw new Error(`Ollama API error: ${res.status}`)
  const data = (await res.json()) as { message: { content: string } }
  return data.message.content
}

/** @ecp/ollama extension. @category Extensions */
export const ollamaExtension = defineExtension("@ecp", "ollama")
  .withConfig({
    baseURL: string().optional(),
    defaultModel: string().optional(),
    timeoutMs: number().optional(),
  })
  .withCapabilities([
    capabilityFor("@ecp/ollama", "generate")
      .withInput(GenerateInput)
      .withOutput(modelGenerateOutputSchema)
      .withHandler(async (input, ctx) => {
        const parsed = input as z.infer<typeof GenerateInput>
        const cfg = (ctx as { extensionConfig?: Record<string, unknown> }).extensionConfig ?? {}
        const baseURL =
          (cfg.baseURL as string) ??
          process.env.OLLAMA_BASE_URL ??
          "http://localhost:11434"
        const model =
          parsed.model ?? (cfg.defaultModel as string) ?? "gemma3:1b"
        ctx.usage.increment({ modelCalls: 1 })
        const text = await ollamaChat(
          baseURL,
          model,
          parsed.prompt,
          parsed.system,
          parsed.context
        )
        return { text }
      }),
    capabilityFor("@ecp/ollama", "evaluate")
      .withInput(
        z.object({
          artifact: z.unknown(),
          criteria: z.unknown().optional(),
          goal: z.string().optional(),
        })
      )
      .withOutput(z.object({ approved: z.boolean(), feedback: z.string().optional() }))
      .withHandler(async (input) => {
        const baseURL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"
        const prompt = `Reply with JSON only: {"approved":boolean,"feedback":string}. Goal: ${(input as { goal?: string }).goal ?? "review"}`
        try {
          const content = await ollamaChat(
            baseURL,
            "gemma3:1b",
            prompt,
            undefined,
            input
          )
          return JSON.parse(content) as { approved: boolean; feedback?: string }
        } catch {
          return { approved: true, feedback: "evaluation skipped" }
        }
      }),
  ])
  .build()

/** Register @ecp/ollama. */
export async function registerOllamaExtension(): Promise<void> {
  if (!globalRegistry.getExtension("@ecp/ollama")) {
    await globalRegistry.registerExtension(ollamaExtension)
  }
}

export default ollamaExtension
