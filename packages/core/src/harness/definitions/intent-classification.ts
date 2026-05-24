import {
  ECP_CORE_FORMATTER_IDS,
  ECP_INTENT_SCHEMA,
  ECP_MODEL_GENERATE_INTERFACE,
  type HarnessInvokeResult,
} from "@ecp/types"
import { z } from "zod"
import { defineHarness } from "../define-harness.js"
import { catalogHarness } from "../harness-catalog.js"
import { callModelGenerate } from "../call-model.js"

const harnessConfigSchema = z.object({
  system: z
    .string()
    .default(
      'Classify the user message. Reply with JSON only: {"schema":"@ecp.intent","intent":"faq"|"workflow-create"|"workflow-patch"|"general"}. No markdown.'
    ),
  context: z
    .object({
      includeEnvironmentDescriptor: z.boolean().default(false),
    })
    .default({}),
  output: z
    .object({
      schema: z.string().default(ECP_INTENT_SCHEMA),
      format: z.string().default(ECP_CORE_FORMATTER_IDS.JSON),
      validate: z.boolean().default(true),
    })
    .default({}),
  trace: z
    .object({
      includePrompt: z.boolean().default(false),
      includeRawOutput: z.boolean().default(true),
      includeValidation: z.boolean().default(true),
    })
    .default({}),
})

const harnessInputSchema = z.object({
  message: z.string(),
  model: z.string().optional(),
})

/**
 * Intent classification harness (@ecp/intent-classification).
 * @category Harness
 */
export const intentClassificationHarness = defineHarness("@ecp", "intent-classification")
  .withConfig(harnessConfigSchema)
  .withInput(harnessInputSchema)
  .withOutput(
    z.object({
      artifact: z.unknown(),
      raw: z.string(),
      validation: z.unknown().optional(),
      trace: z.record(z.unknown()),
    })
  )
  .usesProviderInterface(ECP_MODEL_GENERATE_INTERFACE)
  .withHandler(async (rawInput, ctx) => {
    const input = harnessInputSchema.parse(rawInput)
    const config = harnessConfigSchema.parse(ctx.config)
    const format = config.output.format

    const prompt = `User message: ${input.message}`
    const generated = await callModelGenerate(
      ctx.uses,
      {
        prompt,
        system: config.system,
        model: input.model,
        responseFormat: "json",
      },
      ctx.capabilityContext,
      format
    )
    const raw = generated.text

    const decoded = await ctx.ecp.decode(raw).uses(format).to(ECP_INTENT_SCHEMA).process()
    if (!decoded.success || !decoded.result) {
      throw new Error(
        decoded.diagnostics.map((d) => d.message).join("; ") || "Failed to decode intent JSON"
      )
    }

    const trace: HarnessInvokeResult["trace"] = {
      harness: ctx.harnessId,
      provider: ctx.uses,
      model: input.model,
      outputSchema: config.output.schema,
      outputFormat: format,
      decodeSucceeded: true,
      validationSucceeded: decoded.validation?.valid ?? true,
      ...(config.trace.includeRawOutput ? { rawOutput: raw } : {}),
    }

    return {
      artifact: decoded.result,
      raw,
      ...(config.trace.includeValidation ? { validation: decoded.validation } : {}),
      trace,
    }
  })
  .build()

/** Register intent classification harness in the global catalog. @category Harness */
export function registerIntentClassificationHarness(): void {
  catalogHarness(intentClassificationHarness)
}
