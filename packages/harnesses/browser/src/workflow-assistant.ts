import {

  buildRepairHint,

  buildSystemPrompt,

  callModelGenerate,

  collectDecodeFeedback,
  type HarnessCapabilityContext,

  collectModelOutputFeedback,

  collectValidationFeedback,

  defineHarness,

  HARNESS_PROMPT_FIXTURE_IDS,

  inferResponseFormatFromFormatter,

  runModelRepairLoop,

  stripMarkdownCodeFences,

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

  type HarnessRunContext,

  type ValidationResult,

} from "@ecp/types"

import { z } from "zod"

import {
  formatEnvironmentSummaryLines,
  summarizeEnvironmentDescriptor,
} from "./_internal/summarize-environment.js"

import { encodeForPrompt } from "./_internal/encode-prompt-text.js"

import { formatRunContextSummaryLines } from "./_internal/summarize-run-context.js"

import { formatWorkflowSummaryLines } from "./_internal/summarize-workflow.js"

import { BROWSER_HARNESS_ID } from "./harness-ids.js"

import { formatFeedbackForModel, isRepairFeedbackEcho } from "./presentation.js"

import type { WorkflowManifest } from "@ecp/types"



const harnessConfigSchema = z.object({

  promptFixture: z.string().default(HARNESS_PROMPT_FIXTURE_IDS.WORKFLOW_ASSISTANT),

  system: z.string().optional(),

  context: z

    .object({

      includeEnvironmentDescriptor: z.boolean().default(true),

      includeEncodedDescriptor: z.boolean().default(true),

      descriptorFormat: z.string().default("@ecp/format-toon"),

      includeRunContext: z.boolean().default(true),

      runContextFormat: z.string().default(ECP_CORE_FORMATTER_IDS.JSON),

    })

    .default({}),

  output: z

    .object({

      schema: z.string().default(ECP_HARNESS_REPLY_SCHEMA),

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

  runContext: harnessRunContextSchema.optional(),

  workflow: z.record(z.string(), z.unknown()).optional(),

})



/**

 * Eval workflow assistant harness (@ecp/evals-workflow-assistant).

 * @category Evals

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



    let descriptorText = ""

    let environmentSummaryLines = ""

    if (config.context.includeEnvironmentDescriptor) {

      const descriptor = await ctx.ecp.describe()

      const summary = summarizeEnvironmentDescriptor(descriptor)

      environmentSummaryLines = formatEnvironmentSummaryLines(summary, {
        format: outputIsEql ? "eql-create" : "plain",
      }).join("\n")

      if (config.context.includeEncodedDescriptor) {
        descriptorText = await encodeForPrompt(ctx.ecp, summary, descriptorFormat)
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

      workflowText = formatWorkflowSummaryLines(
        input.workflow as unknown as WorkflowManifest,
        { eql: outputIsEql, patchContext: false }
      ).join("\n")

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

        lines.push(

          "Previous attempt failed. Fix these issues and return corrected EQL only:",

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

          {
            prompt: lastPrompt,
            system,
            model: input.model,
            responseFormat: inferResponseFormatFromFormatter(format),
          },

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

                "Output echoed validation errors instead of a document. Return only harness reply EQL."

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



/** Assistant task handler (invoked by unified `@ecp/harness-evals`). @category Evals */
export async function invokeWorkflowAssistant(
  input: { message: string; runContext?: unknown; model?: string },
  ctx: HarnessCapabilityContext<Record<string, unknown>>
): Promise<HarnessEvaluateOutput> {
  return evalsWorkflowAssistantHarness.handler(input, ctx) as Promise<HarnessEvaluateOutput>
}

/** @deprecated Use {@link invokeWorkflowAssistant} */
export const invokeEvalWorkflowAssistant = invokeWorkflowAssistant

