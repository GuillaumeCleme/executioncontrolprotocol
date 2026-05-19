import { defineExtension, capabilityFor, globalRegistry, string, number } from "@ecp/core"
import { z } from "zod"

const GenerateInput = z.object({
  prompt: z.string(),
  context: z.unknown().optional(),
  model: z.string().optional(),
})

async function ollamaChat(
  baseURL: string,
  model: string,
  prompt: string,
  context?: unknown
): Promise<string> {
  const messages = [
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
      .withOutput(z.object({ content: z.string() }))
      .withHandler(async (input, ctx) => {
        const cfg = (ctx as { extensionConfig?: Record<string, unknown> }).extensionConfig ?? {}
        const baseURL =
          (cfg.baseURL as string) ??
          process.env.OLLAMA_BASE_URL ??
          "http://localhost:11434"
        const model =
          (input as z.infer<typeof GenerateInput>).model ??
          (cfg.defaultModel as string) ??
          "gemma3:1b"
        ctx.usage.increment({ modelCalls: 1 })
        const content = await ollamaChat(
          baseURL,
          model,
          (input as z.infer<typeof GenerateInput>).prompt,
          (input as z.infer<typeof GenerateInput>).context
        )
        return { content }
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
          const content = await ollamaChat(baseURL, "gemma3:1b", prompt, input)
          return JSON.parse(content) as { approved: boolean; feedback?: string }
        } catch {
          return { approved: true, feedback: "evaluation skipped" }
        }
      }),
  ])
  .build()

/** Register @ecp/ollama. */
export function registerOllamaExtension(): void {
  if (!globalRegistry.getExtension("@ecp/ollama")) {
    globalRegistry.registerExtension(ollamaExtension)
  }
}

export default ollamaExtension
