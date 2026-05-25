import {
  callModelGenerate,
  catalogHarness,
  collectDecodeFeedback,
  collectValidationFeedback,
  defineHarness,
  runModelRepairLoop,
  stripMarkdownCodeFences,
} from "@ecp/core"
import {
  ECP_CORE_FORMATTER_IDS,
  ECP_INTENT_SCHEMA,
  ECP_MODEL_GENERATE_INTERFACE,
  harnessEvaluateOutputSchema,
  LATEST_ECP_VERSION,
  type HarnessInvokeResult,
  type ValidationResult,
} from "@ecp/types"
import { z } from "zod"
import { BROWSER_INTENT_CLASSIFICATION_ID } from "./harness-ids.js"
import { formatFeedbackForModel } from "./presentation.js"

const harnessConfigSchema = z.object({
  system: z
    .string()
    .default(
      'Classify the user message. Reply with JSON only: {"schema":"@ecp.intent","intent":"faq"|"workflow-create"|"workflow-patch"|"general"}. No markdown.'
    ),
  context: z
    .object({
      includeEnvironmentDescriptor: z.boolean().default(false),
      descriptorFormat: z.string().default("@ecp/format-toon"),
    })
    .default({}),
  output: z
    .object({
      schema: z.string().default(ECP_INTENT_SCHEMA),
      format: z.string().default(ECP_CORE_FORMATTER_IDS.JSON),
      validate: z.boolean().default(true),
    })
    .default({}),
  repair: z
    .object({
      enabled: z.boolean().default(true),
      maxAttempts: z.number().default(1),
      includeValidationErrors: z.boolean().default(true),
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
 * Browser intent classification harness (@ecp/browser-intent-classification).
 * @category Browser
 */
export const browserIntentClassificationHarness = defineHarness(
  "@ecp",
  "browser-intent-classification"
)
  .withConfig(harnessConfigSchema)
  .withInput(harnessInputSchema)
  .withOutput(harnessEvaluateOutputSchema)
  .usesProviderInterface(ECP_MODEL_GENERATE_INTERFACE)
  .withHandler(async (input, ctx) => {
    const config = ctx.config
    const format = config.output.format

    const buildPrompt = (repairText?: string) => {
      const lines = [`User message: ${input.message}`]
      if (repairText) {
        lines.push("Previous attempt failed. Fix these issues:", repairText)
      }
      return lines.join("\n")
    }

    const maxAttempts = config.repair.enabled ? 1 + config.repair.maxAttempts : 1
    let lastPrompt = buildPrompt()
    let validation = stubValidation(true)

    const loopResult = await runModelRepairLoop({
      maxAttempts,
      generate: async ({ attempt, priorFeedback }) => {
        const repairText =
          attempt > 0 && config.repair.includeValidationErrors
            ? formatFeedbackForModel(priorFeedback)
            : undefined
        lastPrompt = buildPrompt(repairText)
        const generated = await callModelGenerate(
          ctx.uses,
          { prompt: lastPrompt, system: config.system, model: input.model, responseFormat: "json" },
          ctx.capabilityContext,
          format
        )
        return { raw: stripMarkdownCodeFences(generated.text) }
      },
      evaluate: async (raw) => {
        const decoded = await ctx.ecp.decode(raw).uses(format).to(ECP_INTENT_SCHEMA).process()
        validation = decoded.validation ?? stubValidation(decoded.success)
        const feedback = [collectDecodeFeedback(decoded)]
        if (!decoded.success || !decoded.result) {
          return { success: false, feedback }
        }
        if (config.output.validate && !validation.valid) {
          feedback.push(collectValidationFeedback(validation))
          return { success: false, feedback }
        }
        return { success: true, artifact: decoded.result, feedback }
      },
    })

    const trace: HarnessInvokeResult["trace"] = {
      harness: BROWSER_INTENT_CLASSIFICATION_ID,
      provider: ctx.uses,
      model: input.model,
      outputSchema: config.output.schema,
      outputFormat: format,
      decodeSucceeded: true,
      validationSucceeded: validation.valid,
      ...(config.trace.includePrompt ? { prompt: lastPrompt } : {}),
      ...(config.trace.includeRawOutput ? { rawOutput: loopResult.raw } : {}),
    }

    return {
      artifact: loopResult.artifact,
      raw: loopResult.raw,
      ...(config.trace.includeValidation ? { validation } : {}),
      trace,
    }
  })
  .build()

function stubValidation(valid: boolean): ValidationResult {
  return {
    schema: "@ecp.validation.result",
    version: LATEST_ECP_VERSION,
    valid,
    errors: [],
    warnings: [],
  }
}

/** Register browser intent harness. @category Browser */
export function registerBrowserIntentClassificationHarness(): void {
  catalogHarness(browserIntentClassificationHarness)
}
