import {
  buildRepairHint,
  buildSystemPrompt,
  callModelGenerate,
  type HarnessCapabilityContext,
  collectDecodeFeedback,
  collectModelOutputFeedback,
  collectValidationFeedback,
  defineHarness,
  HARNESS_PROMPT_FIXTURE_IDS,
  runModelRepairLoop,
  stripMarkdownCodeFences,
} from "@ecp/core"
import {
  ECP_CORE_FORMATTER_IDS,
  ECP_INTENT_SCHEMA,
  ECP_MODEL_GENERATE_INTERFACE,
  harnessEvaluateOutputSchema,
  LATEST_ECP_VERSION,
  type HarnessEvaluateOutput,
  type HarnessInvokeResult,
  type HarnessOperationFeedback,
  type ValidationResult,
} from "@ecp/types"
import { z } from "zod"
import {
  formatEnvironmentSummaryLines,
  summarizeEnvironmentDescriptor,
} from "./_internal/summarize-environment.js"
import { encodeForPrompt } from "./_internal/encode-prompt-text.js"
import { BROWSER_HARNESS_ID } from "./harness-ids.js"
import { formatFeedbackForModel, isRepairFeedbackEcho } from "./presentation.js"

const harnessConfigSchema = z.object({
  promptFixture: z
    .string()
    .default(HARNESS_PROMPT_FIXTURE_IDS.INTENT_CLASSIFICATION),
  system: z.string().optional(),
  context: z
    .object({
      includeEnvironmentDescriptor: z.boolean().default(false),
      includeEncodedDescriptor: z.boolean().default(true),
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
      includeRepairAttempts: z.boolean().default(true),
    })
    .default({}),
})

const harnessInputSchema = z.object({
  message: z.string(),
  model: z.string().optional(),
})

/**
 * Eval intent classification harness (@ecp/evals-intent-classification).
 * @category Evals
 */
const evalsIntentClassificationHarness = defineHarness("@ecp", "evals-intent-classification-internal")
  .withConfig(harnessConfigSchema)
  .withInput(harnessInputSchema)
  .withOutput(harnessEvaluateOutputSchema)
  .usesProviderInterface(ECP_MODEL_GENERATE_INTERFACE)
  .withHandler(async (input, ctx) => {
    const config = ctx.config
    const format = config.output.format
    const descriptorFormat = config.context.descriptorFormat ?? format
    const promptFixtureId = config.promptFixture
    const system = config.system ?? buildSystemPrompt(promptFixtureId)

    let descriptorText = ""
    let environmentSummaryLines = ""
    if (config.context.includeEnvironmentDescriptor) {
      const descriptor = await ctx.ecp.describe()
      const summary = summarizeEnvironmentDescriptor(descriptor)
      environmentSummaryLines = formatEnvironmentSummaryLines(summary).join("\n")
      if (config.context.includeEncodedDescriptor) {
        descriptorText = await encodeForPrompt(ctx.ecp, summary, descriptorFormat)
      }
    }

    const buildPrompt = (repairText?: string) => {
      const lines = [`User message: ${input.message}`]
      if (environmentSummaryLines) {
        const envHeader = [
          "Environment capabilities:",
          environmentSummaryLines,
          ...(descriptorText
            ? ["", "Environment capabilities (encoded):", descriptorText, ""]
            : [""]),
        ]
        lines.unshift(...envHeader)
      }
      if (repairText) {
        lines.push(
          "Previous attempt failed. Fix these issues and return corrected JSON only:",
          repairText,
          buildRepairHint(promptFixtureId)
        )
      }
      return lines.join("\n")
    }

    const maxAttempts = config.repair.enabled ? 1 + config.repair.maxAttempts : 1
    let lastPrompt = buildPrompt()
    let validation = decodedValidationStub()

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
          { prompt: lastPrompt, system, model: input.model, responseFormat: "json" },
          ctx.capabilityContext,
          format
        )
        return { raw: stripMarkdownCodeFences(generated.text) }
      },
      evaluate: async (raw, { attempt, priorFeedback }) => {
        const feedback: HarnessOperationFeedback[] = []

        if (
          attempt > 0 &&
          config.repair.includeValidationErrors &&
          isRepairFeedbackEcho(raw, formatFeedbackForModel(priorFeedback))
        ) {
          return {
            success: false,
            feedback: [
              collectModelOutputFeedback(
                "Output echoed validation errors instead of a document. Return only intent JSON."
              ),
            ],
          }
        }

        const decoded = await ctx.ecp.decode(raw).uses(format).to(ECP_INTENT_SCHEMA).process()
        validation = decoded.validation ?? decodedValidationStub(!decoded.success)
        feedback.push(collectDecodeFeedback(decoded))

        if (!decoded.success || !decoded.result) {
          return { success: false, feedback }
        }

        if (config.output.validate && validation.valid === false) {
          feedback.push(collectValidationFeedback(validation))
          return { success: false, feedback }
        }

        return { success: true, artifact: decoded.result, feedback }
      },
    })

    const trace: HarnessInvokeResult["trace"] = {
      harness: BROWSER_HARNESS_ID,
      provider: ctx.uses,
      model: input.model,
      outputSchema: config.output.schema,
      outputFormat: format,
      decodeSucceeded: true,
      validationSucceeded: validation.valid,
      ...(config.trace.includePrompt ? { prompt: lastPrompt } : {}),
      ...(config.trace.includeRawOutput ? { rawOutput: loopResult.raw } : {}),
      ...(config.trace.includeRepairAttempts ? { repairAttempts: loopResult.attempts } : {}),
    }

    return {
      artifact: loopResult.artifact,
      raw: loopResult.raw,
      ...(config.trace.includeValidation ? { validation } : {}),
      trace,
    }
  })
  .build()

function decodedValidationStub(valid = true): ValidationResult {
  return {
    schema: "@ecp.validation.result",
    version: LATEST_ECP_VERSION,
    valid,
    errors: [],
    warnings: [],
  }
}

/** Intent task handler (invoked by unified `@ecp/harness-evals`). @category Evals */
export async function invokeIntentClassification(
  input: { message: string; model?: string },
  ctx: HarnessCapabilityContext<Record<string, unknown>>
): Promise<HarnessEvaluateOutput> {
  return evalsIntentClassificationHarness.handler(input, ctx) as Promise<HarnessEvaluateOutput>
}

/** @deprecated Use {@link invokeIntentClassification} */
export const invokeEvalIntentClassification = invokeIntentClassification
