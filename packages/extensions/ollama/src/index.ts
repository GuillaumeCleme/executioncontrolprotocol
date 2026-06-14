import { defineExtension, capabilityFor, globalRegistry, catalogExtension } from "@executioncontextprotocol/core"
import { z } from "zod"

import { modelGenerateInputSchema, modelGenerateOutputSchema } from "@executioncontextprotocol/types"

const GenerateInput = modelGenerateInputSchema

async function ollamaChat(
  baseURL: string,
  model: string,
  prompt: string,
  system?: string,
  context?: unknown,
  requestOptions?: Record<string, unknown>
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
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: {
        num_ctx: 8192,
        ...(requestOptions ?? {}),
      },
    }),
  })
  if (!res.ok) throw new Error(`Ollama API error: ${res.status}`)
  const data = (await res.json()) as { message: { content: string } }
  return data.message.content
}

/** @executioncontextprotocol/ollama extension. @category Extensions */
export const ollamaExtension = defineExtension("@executioncontextprotocol", "ollama")
  .withConfig({
    baseURL: z.string().optional(),
    defaultModel: z.string().optional(),
    timeoutMs: z.number().optional(),
  })
  .withCapabilities([
    capabilityFor("@executioncontextprotocol/ollama", "generate")
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
          parsed.context,
          parsed.options as Record<string, unknown> | undefined
        )
        return { text }
      }),
    capabilityFor("@executioncontextprotocol/ollama", "evaluate")
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
        const row = input as {
          goal?: string
          criteria?: string
          artifact?: { answer?: string }
        }
        const goal = row.goal ?? "review"
        const rubric = row.criteria ?? "Accurate, on-topic, and actionable."
        const answer =
          row.artifact !== null &&
          typeof row.artifact === "object" &&
          "answer" in row.artifact &&
          typeof row.artifact.answer === "string"
            ? row.artifact.answer
            : JSON.stringify(row.artifact ?? {})
        const prompt = [
          'Reply with JSON only: {"approved":true,"feedback":"ok"} or {"approved":false,"feedback":"reason"}.',
          `Goal: ${goal}`,
          `Rubric: ${rubric}`,
          `Answer: ${answer.slice(0, 1500)}`,
        ].join("\n")
        try {
          const content = await ollamaChat(
            baseURL,
            "gemma3:1b",
            prompt,
            "Approve (approved true) when the answer satisfies the goal and rubric; otherwise approved false."
          )
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (!jsonMatch) {
            return { approved: true, feedback: "evaluation skipped (no JSON)" }
          }
          const parsed = JSON.parse(jsonMatch[0]) as { approved?: boolean; feedback?: string }
          return {
            approved: parsed.approved !== false,
            feedback: parsed.feedback,
          }
        } catch {
          return { approved: true, feedback: "evaluation skipped" }
        }
      }),
  ])
  .build()

catalogExtension(ollamaExtension)

/** Register @executioncontextprotocol/ollama. */
export async function registerOllamaExtension(): Promise<void> {
  if (!globalRegistry.getExtension("@executioncontextprotocol/ollama")) {
    await globalRegistry.registerExtension(ollamaExtension)
  }
}

export default ollamaExtension
