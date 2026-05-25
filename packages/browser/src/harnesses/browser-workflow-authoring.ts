import {
  callModelGenerate,
  catalogHarness,
  collectDecodeFeedback,
  collectPatchFeedback,
  collectValidationFeedback,
  defineHarness,
  inferResponseFormatFromFormatter,
  runModelRepairLoop,
  stripMarkdownCodeFences,
} from "@ecp/core"
import {
  ECP_MODEL_GENERATE_INTERFACE,
  harnessEvaluateOutputSchema,
  type EcpPatchInput,
  type HarnessInvokeResult,
  type WorkflowManifest,
} from "@ecp/types"
import { z } from "zod"
import { BROWSER_WORKFLOW_AUTHORING_ID } from "./harness-ids.js"
import { formatFeedbackForModel } from "./presentation.js"

const harnessConfigSchema = z.object({
  system: z.string().optional(),
  context: z
    .object({
      includeEnvironmentDescriptor: z.boolean().default(true),
      descriptorFormat: z.string().default("@ecp/format-toon"),
    })
    .default({}),
  output: z
    .object({
      schema: z.string().default("@ecp.workflow"),
      format: z.string().default("@ecp/format-toon"),
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
      includePrompt: z.boolean().default(true),
      includeRawOutput: z.boolean().default(true),
      includeValidation: z.boolean().default(true),
    })
    .default({}),
})

const harnessInputSchema = z.object({
  request: z.string(),
  manifest: z.unknown().optional(),
  model: z.string().optional(),
})

/**
 * Browser workflow authoring harness (@ecp/browser-workflow-authoring).
 * @category Browser
 */
export const browserWorkflowAuthoringHarness = defineHarness("@ecp", "browser-workflow-authoring")
  .withConfig(harnessConfigSchema)
  .withInput(harnessInputSchema)
  .withOutput(harnessEvaluateOutputSchema)
  .usesProviderInterface(ECP_MODEL_GENERATE_INTERFACE)
  .withHandler(async (input, ctx) => {
    const config = ctx.config
    const isPatch = input.manifest !== undefined
    const format = config.output.format
    const descriptorFormat = config.context.descriptorFormat ?? format

    let descriptorText = ""
    if (config.context.includeEnvironmentDescriptor) {
      const descriptor = await ctx.ecp.describe()
      const encoded = await ctx.ecp
        .encode(descriptor)
        .uses(descriptorFormat)
        .with({ headers: false, compact: true })
        .process()
      descriptorText = String(encoded.result ?? "")
    }

    let workflowEncoded = ""
    if (isPatch && input.manifest) {
      const wfEncoded = await ctx.ecp
        .encode(input.manifest)
        .uses(format)
        .with({ headers: false, compact: true })
        .process()
      workflowEncoded = String(wfEncoded.result ?? "")
    }

    const system =
      config.system ??
      (isPatch
        ? "Return only ECP TOON patch document. No markdown fences."
        : "Return only ECP TOON workflow text. No markdown fences.")

    const buildPrompt = (repairText?: string) => {
      const lines = isPatch
        ? [
            "Return only compact TOON for schema @ecp.patch.",
            `User request: ${input.request}`,
            "Environment descriptor (TOON):",
            descriptorText,
            "Current workflow (TOON):",
            workflowEncoded,
          ]
        : [
            "Return only a compact TOON @ecp.workflow document for this request.",
            `User request: ${input.request}`,
            "Environment descriptor (TOON):",
            descriptorText,
          ]
      if (repairText) {
        lines.push("Previous attempt failed. Output only corrected TOON:", repairText)
      }
      return lines.join("\n")
    }

    const responseFormat = inferResponseFormatFromFormatter(format)
    const maxAttempts = config.repair.enabled ? 1 + config.repair.maxAttempts : 1
    let lastPrompt = buildPrompt()

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
          { prompt: lastPrompt, system, model: input.model, responseFormat },
          ctx.capabilityContext,
          format
        )
        return { raw: stripMarkdownCodeFences(generated.text) }
      },
      evaluate: async (raw) => {
        const feedback = []
        const decoded = await ctx.ecp
          .decode(raw)
          .uses(format)
          .to(isPatch ? "@ecp.patch" : "@ecp.workflow")
          .with({ headers: false, compact: true })
          .process()
        feedback.push(collectDecodeFeedback(decoded))
        if (!decoded.success || decoded.result === undefined) {
          return { success: false, feedback }
        }
        let artifact: unknown = decoded.result
        if (isPatch && input.manifest) {
          const patched = await ctx.ecp
            .patch(input.manifest as WorkflowManifest)
            .with(artifact as EcpPatchInput)
            .process()
          feedback.push(collectPatchFeedback(patched))
          if (!patched.success || !patched.result) {
            return { success: false, feedback }
          }
          artifact = patched.result
        }
        if (config.output.validate) {
          const validation = await ctx.ecp.validate(artifact as WorkflowManifest)
          feedback.push(collectValidationFeedback(validation))
          if (!validation.valid) {
            return { success: false, feedback }
          }
        }
        return { success: true, artifact, feedback }
      },
    })

    const validation = await ctx.ecp.validate(loopResult.artifact as WorkflowManifest)
    const trace: HarnessInvokeResult["trace"] = {
      harness: BROWSER_WORKFLOW_AUTHORING_ID,
      provider: ctx.uses,
      model: input.model,
      outputSchema: isPatch ? "@ecp.patch" : config.output.schema,
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

/** Register browser workflow authoring harness. @category Browser */
export function registerBrowserWorkflowAuthoringHarness(): void {
  catalogHarness(browserWorkflowAuthoringHarness)
}
