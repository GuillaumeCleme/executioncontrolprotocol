import {
  buildRepairHint,
  buildSystemPrompt,
  buildAssistantSafeReply,
  callModelGenerate,
  collectDecodeFeedback,
  collectModelOutputFeedback,
  collectValidationFeedback,
  defineHarness,
  encodeForPrompt,
  formatEnvironmentSummaryLines,
  formatFeedbackForModel,
  formatRunContextSummaryLines,
  formatWorkflowSummaryLines,
  type HarnessCapabilityContext,
  inferResponseFormatFromFormatter,
  isEnvironmentQuestion,
  isRepairFeedbackEcho,
  runModelRepairLoop,
  stripMarkdownCodeFences,
  summarizeEnvironmentDescriptor,
} from "@ecp/core"
import {
  ECP_CORE_FORMATTER_IDS,
  ECP_HARNESS_REPLY_SCHEMA,
  ECP_MODEL_GENERATE_INTERFACE,
  harnessEvaluateOutputSchema,
  harnessRunContextSchema,
  LATEST_ECP_VERSION,
  type HarnessEvaluateOutput,
  type HarnessInvokeResult,
  type HarnessOperationFeedback,
  type HarnessReply,
  type HarnessRunContext,
  type ValidationResult,
  type WorkflowManifest,
} from "@ecp/types"
import { z } from "zod"
import { BROWSER_NANO_HARNESS_ID } from "./harness-ids.js"

const harnessConfigSchema = z.object({
  promptFixture: z.string().default("workflow-assistant"),
  system: z.string().optional(),
  context: z
    .object({
      includeEnvironmentDescriptor: z.boolean().default(true),
      includeEncodedDescriptor: z.boolean().default(false),
      descriptorFormat: z.string().default("@ecp/format-eql"),
      includeRunContext: z.boolean().default(true),
      runContextFormat: z.string().default(ECP_CORE_FORMATTER_IDS.JSON),
    })
    .default({}),
  output: z
    .object({
      schema: z.string().default(ECP_HARNESS_REPLY_SCHEMA),
      format: z.string().default("@ecp/format-eql"),
      validate: z.boolean().default(true),
    })
    .default({}),
  repair: z
    .object({
      enabled: z.boolean().default(true),
      maxAttempts: z.number().default(1),
      includeValidationErrors: z.boolean().default(true),
      safeReplyFallback: z.boolean().default(true),
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
  runContext: harnessRunContextSchema.optional(),
  workflow: z.record(z.string(), z.unknown()).optional(),
})

function formatReplyAsEql(reply: HarnessReply): string {
  const lines = ["REPLY", `  ANSWER "${reply.answer.replace(/"/g, '\\"')}"`]
  for (const c of reply.citations ?? []) {
    const idPart = c.id ? ` ${c.id}` : ""
    const detailPart = c.detail ? ` "${c.detail.replace(/"/g, '\\"')}"` : ""
    lines.push(`  CITATION ${c.kind}${idPart}${detailPart}`)
  }
  return lines.join("\n")
}

/**
 * Unified ECP assistant harness (workflow Q&A, FAQ, environment help).
 * @category Harness
 */
export const evalsWorkflowAssistantHarness = defineHarness("@ecp", "evals-workflow-assistant")
  .withConfig(harnessConfigSchema)
  .withInput(harnessInputSchema)
  .withOutput(harnessEvaluateOutputSchema)
  .usesProviderInterface(ECP_MODEL_GENERATE_INTERFACE)
  .withHandler(async (input, ctx) => {
    const config = ctx.config
    const format = config.output.format
    const outputIsEql = format === "@ecp/format-eql" || format.endsWith("/format-eql")
    const descriptorFormat = config.context.descriptorFormat ?? format
    const promptFixtureId = config.promptFixture
    const system = config.system ?? buildSystemPrompt(promptFixtureId)
    const envQuestion = isEnvironmentQuestion(input.message)

    let descriptorText = ""
    let environmentSummaryLines = ""
    if (config.context.includeEnvironmentDescriptor) {
      const descriptor = await ctx.ecp.describe()
      const summary = summarizeEnvironmentDescriptor(descriptor)
      environmentSummaryLines = formatEnvironmentSummaryLines(summary, {
        format: outputIsEql ? "plain" : "plain",
      }).join("\n")
      const includeEncoded =
        config.context.includeEncodedDescriptor || envQuestion
      if (includeEncoded) {
        descriptorText = await encodeForPrompt(ctx.ecp, descriptor, descriptorFormat)
      }
    }

    let runContextText = ""
    if (config.context.includeRunContext && input.runContext) {
      runContextText = formatRunContextSummaryLines(input.runContext as HarnessRunContext).join(
        "\n"
      )
    }

    let workflowText = ""
    if (input.workflow) {
      workflowText = formatWorkflowSummaryLines(input.workflow as unknown as WorkflowManifest, {
        eql: outputIsEql,
        patchContext: false,
      }).join("\n")
    }

    const buildPrompt = (repairText?: string) => {
      const lines = [`User message: ${input.message}`]
      if (environmentSummaryLines) {
        lines.unshift(
          "Environment capabilities:",
          environmentSummaryLines,
          ...(descriptorText
            ? ["", "Environment capabilities (encoded):", descriptorText, ""]
            : [""])
        )
      }
      if (runContextText) {
        lines.push("Run context (summary):", runContextText, "")
      }
      if (workflowText) {
        lines.push("Workflow (summary):", workflowText, "")
      }
      if (repairText) {
        const outputLabel = outputIsEql ? "EQL" : "JSON"
        lines.push(
          `Previous attempt failed. Fix these issues and return corrected ${outputLabel} only:`,
          repairText,
          buildRepairHint(promptFixtureId)
        )
      }
      return lines.join("\n")
    }

    const maxAttempts = config.repair.enabled ? 1 + config.repair.maxAttempts : 1
    let lastPrompt = buildPrompt()
    let validation = decodedValidationStub()
    let lastRaw = ""

    try {
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
            {
              prompt: lastPrompt,
              system,
              model: input.model,
              responseFormat: inferResponseFormatFromFormatter(format),
            },
            ctx.capabilityContext,
            format
          )
          lastRaw = stripMarkdownCodeFences(generated.text)
          return { raw: lastRaw }
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
                  "Output echoed validation errors instead of a document. Return only a valid harness reply."
                ),
              ],
            }
          }

          const decoded = await ctx.ecp
            .decode(raw)
            .uses(format)
            .to(ECP_HARNESS_REPLY_SCHEMA)
            .with({ headers: false })
            .process()

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
        harness: BROWSER_NANO_HARNESS_ID,
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
    } catch (err) {
      if (!config.repair.safeReplyFallback) {
        throw err
      }
      const fallbackReply = buildAssistantSafeReply()
      const safeRaw = formatReplyAsEql(fallbackReply)
      const trace: HarnessInvokeResult["trace"] = {
        harness: BROWSER_NANO_HARNESS_ID,
        provider: ctx.uses,
        model: input.model,
        outputSchema: config.output.schema,
        outputFormat: format,
        decodeSucceeded: false,
        validationSucceeded: false,
        ...(config.trace.includePrompt ? { prompt: lastPrompt } : {}),
        ...(config.trace.includeRawOutput ? { rawOutput: lastRaw || safeRaw } : {}),
      }
      return {
        artifact: fallbackReply,
        raw: lastRaw || safeRaw,
        validation: decodedValidationStub(false),
        trace,
      }
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

/** Assistant task handler (invoked by `@ecp/harness-browser-nano`). @category Harness */
export async function invokeWorkflowAssistant(
  input: { message: string; runContext?: unknown; model?: string },
  ctx: HarnessCapabilityContext<Record<string, unknown>>
): Promise<HarnessEvaluateOutput> {
  return evalsWorkflowAssistantHarness.handler(input, ctx) as Promise<HarnessEvaluateOutput>
}

/** @deprecated Use {@link invokeWorkflowAssistant} */
export const invokeEvalWorkflowAssistant = invokeWorkflowAssistant
