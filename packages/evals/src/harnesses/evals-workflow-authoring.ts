import {
  callModelGenerate,
  catalogHarness,
  collectDecodeFeedback,
  collectModelOutputFeedback,
  collectPatchFeedback,
  collectValidationFeedback,
  defineHarness,
  inferResponseFormatFromFormatter,
  runModelRepairLoop,
  stripMarkdownCodeFences,
} from "@ecp/core"
import {
  ECP_CORE_FORMATTER_IDS,
  ECP_MODEL_GENERATE_INTERFACE,
  harnessEvaluateOutputSchema,
  type EcpPatchInput,
  type HarnessInvokeResult,
  type HarnessOperationFeedback,
  type WorkflowManifest,
} from "@ecp/types"
import { z } from "zod"
import { EVALS_WORKFLOW_AUTHORING_ID } from "./harness-ids.js"
import { normalizeWorkflowDocumentCandidate } from "./normalize-workflow-output.js"
import { formatFeedbackForModel, isRepairFeedbackEcho } from "./presentation.js"

const outputConfigSchema = z.object({
  schema: z.string().default("@ecp.workflow"),
  format: z.string().default("@ecp/format-json"),
  validate: z.boolean().default(true),
})

const harnessConfigSchema = z.object({
  system: z.string().optional(),
  context: z
    .object({
      includeEnvironmentDescriptor: z.boolean().default(true),
      descriptorFormat: z.string().default("@ecp/format-toon"),
    })
    .default({}),
  output: outputConfigSchema.default({}),
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
      includeRepairAttempts: z.boolean().default(true),
    })
    .default({}),
})

const harnessInputSchema = z.object({
  request: z.string(),
  manifest: z.unknown().optional(),
  model: z.string().optional(),
})

/**
 * Eval workflow authoring harness (@ecp/evals-workflow-authoring).
 * @category Evals
 */
export const evalsWorkflowAuthoringHarness = defineHarness("@ecp", "evals-workflow-authoring")
  .withConfig(harnessConfigSchema)
  .withInput(harnessInputSchema)
  .withOutput(harnessEvaluateOutputSchema)
  .usesProviderInterface(ECP_MODEL_GENERATE_INTERFACE)
  .withHandler(async (input, ctx) => {
    const config = ctx.config
    const isPatch = input.manifest !== undefined
    const outputSchema = isPatch ? "@ecp.patch" : config.output.schema
    const format = config.output.format
    const descriptorFormat = config.context.descriptorFormat ?? format
    const outputIsJson =
      format === ECP_CORE_FORMATTER_IDS.JSON || format.endsWith("/format-json")

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
        ? 'Return only JSON for @ecp.patch. No markdown fences. Example: {"schema":"@ecp.patch","version":"1.0.0","targetSchema":"@ecp.workflow","patches":[{"path":"steps[echo].label","value":"New label","mode":"replace"}]}'
        : 'Return only JSON for @ecp.workflow. No markdown fences. Include workflow.id, workflow.label, and steps with id, uses, label, input, as.')

    const buildPrompt = (repairText?: string) => {
      const lines = isPatch
        ? [
            "Return only compact JSON for schema @ecp.patch.",
            `User request: ${input.request}`,
            "Environment descriptor (TOON):",
            descriptorText,
            "Current workflow (JSON):",
            workflowEncoded,
          ]
        : [
            "Return only a compact JSON @ecp.workflow document for this request.",
            `User request: ${input.request}`,
            "Environment descriptor (TOON):",
            descriptorText,
            'Example: {"schema":"@ecp.workflow","version":"1.0.0","workflow":{"id":"minimal-echo","label":"Minimal Echo"},"steps":[{"type":"step","id":"echo","label":"Echo","uses":"@ecp/test.echo","input":{"value":"hello"},"as":"echo"}]}',
          ]
      if (repairText) {
        lines.push(
          "Previous attempt failed. Do not repeat error text. Output only the corrected document:",
          repairText
        )
        if (isPatch) {
          lines.push(
            'Required JSON keys: schema "@ecp.patch", version, targetSchema "@ecp.workflow", patches[{path,value}].'
          )
        }
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
                "Output echoed validation errors instead of a document. Return only the workflow or patch document."
              ),
            ],
          }
        }

        const decoded = await ctx.ecp
          .decode(raw)
          .uses(format)
          .to(isPatch ? "@ecp.patch" : "@ecp.workflow")
          .with({ headers: false, compact: true })
          .process()

        let document = decoded.result
        if (!isPatch && outputIsJson && document !== undefined) {
          document = normalizeWorkflowDocumentCandidate(document)
        }

        feedback.push(collectDecodeFeedback(decoded))

        if (!decoded.success || document === undefined) {
          if (!isPatch && outputIsJson && document !== undefined) {
            const validation = await ctx.ecp.validate(document as WorkflowManifest)
            feedback.push(collectValidationFeedback(validation))
            if (validation.valid) {
              return { success: true, artifact: document, feedback }
            }
          }
          return { success: false, feedback }
        }

        let artifact: unknown = document

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
      harness: EVALS_WORKFLOW_AUTHORING_ID,
      provider: ctx.uses,
      model: input.model,
      outputSchema,
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

/** Register eval workflow authoring harness. @category Evals */
export function registerEvalsWorkflowAuthoringHarness(): void {
  catalogHarness(evalsWorkflowAuthoringHarness)
}
