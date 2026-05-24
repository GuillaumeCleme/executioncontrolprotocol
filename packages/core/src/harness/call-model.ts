import {
  ECP_MODEL_CAPABILITY_NAME,
  modelGenerateInputSchema,
  modelGenerateOutputSchema,
  type CapabilityId,
  type ModelGenerateInput,
} from "@ecp/types"
import type { CapabilityContext } from "../runtime/context.js"
import { inferResponseFormatFromFormatter } from "./format-resolve.js"

function extractText(output: unknown): string {
  if (output !== null && typeof output === "object") {
    if ("text" in output && typeof (output as { text: unknown }).text === "string") {
      return (output as { text: string }).text
    }
    if ("content" in output && typeof (output as { content: unknown }).content === "string") {
      return (output as { content: string }).content
    }
  }
  return String(output)
}

/**
 * Call a harness-compatible model provider with normalized input/output.
 * @category Harness
 */
export async function callModelGenerate(
  providerCapabilityId: CapabilityId,
  input: ModelGenerateInput,
  ctx: CapabilityContext,
  outputFormat?: string
): Promise<{ text: string }> {
  const capName = providerCapabilityId.split(".").pop()
  if (capName !== ECP_MODEL_CAPABILITY_NAME) {
    throw new Error(
      `Provider ${providerCapabilityId} must use capability name "${ECP_MODEL_CAPABILITY_NAME}"`
    )
  }

  const responseFormat =
    input.responseFormat ??
    (outputFormat ? inferResponseFormatFromFormatter(outputFormat) : undefined)

  let prompt = input.prompt
  if (responseFormat === "json" && !prompt.includes("JSON")) {
    prompt = `${prompt}\n\nReply with JSON only. No markdown fences.`
  } else if (responseFormat === "toon" && !prompt.toLowerCase().includes("toon")) {
    prompt = `${prompt}\n\nReply with compact TOON only. No markdown fences.`
  }

  const payload = modelGenerateInputSchema.parse({
    ...input,
    prompt,
    responseFormat,
  })

  const raw = await ctx.capabilities.call(providerCapabilityId, payload)
  const text = extractText(raw)
  return modelGenerateOutputSchema.parse({ text })
}
