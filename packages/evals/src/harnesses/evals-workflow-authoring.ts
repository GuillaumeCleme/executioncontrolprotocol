import {
  buildRepairHint,
  buildWorkflowCreateSystemPrompt,
  buildWorkflowPatchSystemPrompt,
  callModelGenerate,
  catalogHarness,
  collectDecodeFeedback,
  collectModelOutputFeedback,
  collectPatchFeedback,
  collectValidationFeedback,
  defineHarness,
  formatSchemaExampleJson,
  HARNESS_PROMPT_FIXTURE_IDS,
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
import {
  formatEnvironmentSummaryLines,
  summarizeEnvironmentDescriptor,
} from "./_internal/summarize-environment.js"
import { encodeForPrompt } from "./_internal/encode-prompt-text.js"
import { formatWorkflowSummaryLines } from "./_internal/summarize-workflow.js"
import {
  buildPatchOperationHintLines,
  buildRequestCapabilityHintLines,
  collectCreateCapabilityFeedback,
  collectPatchGoalFeedback,
} from "./_internal/request-capability-hints.js"
import type { CompactEnvironmentSummary } from "./_internal/summarize-environment.js"
import { EVALS_WORKFLOW_AUTHORING_ID } from "./harness-ids.js"
import { normalizeWorkflowDocumentCandidate } from "./normalize-workflow-output.js"
import { repairPatchJsonSyntax, repairWorkflowJsonSyntax } from "./repair-workflow-json.js"
import {
  formatStructuredRepairForModel,
  isRepairFeedbackEcho,
} from "./presentation.js"

const outputConfigSchema = z.object({
  schema: z.string().default("@ecp.workflow"),
  format: z.string().default("@ecp/format-json"),
  validate: z.boolean().default(true),
})

const harnessConfigSchema = z.object({
  promptFixture: z.string().optional(),
  system: z.string().optional(),
  context: z
    .object({
      includeEnvironmentDescriptor: z.boolean().default(true),
      /** When false, only plain-text capability lines are sent (smaller prompts for 1B models). */
      includeEncodedDescriptor: z.boolean().default(true),
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

    const promptFixtureId =
      config.promptFixture ??
      (isPatch
        ? HARNESS_PROMPT_FIXTURE_IDS.WORKFLOW_AUTHORING_PATCH
        : HARNESS_PROMPT_FIXTURE_IDS.WORKFLOW_AUTHORING_CREATE)

    const system =
      config.system ??
      (isPatch ? buildWorkflowPatchSystemPrompt() : buildWorkflowCreateSystemPrompt())

    let descriptorText = ""
    let environmentSummaryLines = ""
    let environmentSummary: CompactEnvironmentSummary | undefined
    if (config.context.includeEnvironmentDescriptor) {
      const descriptor = await ctx.ecp.describe()
      environmentSummary = summarizeEnvironmentDescriptor(descriptor)
      environmentSummaryLines = formatEnvironmentSummaryLines(environmentSummary).join("\n")
      if (config.context.includeEncodedDescriptor) {
        descriptorText = await encodeForPrompt(ctx.ecp, environmentSummary, descriptorFormat)
      }
    }

    const baselineManifest = isPatch
      ? (input.manifest as WorkflowManifest | undefined)
      : undefined

    let workflowSummaryText = ""
    if (isPatch && baselineManifest) {
      workflowSummaryText = formatWorkflowSummaryLines(baselineManifest).join("\n")
    }

    const buildPrompt = (repairText?: string) => {
      const requestHints =
        environmentSummary !== undefined
          ? buildRequestCapabilityHintLines(input.request, environmentSummary)
          : []
      const patchHints =
        isPatch && baselineManifest
          ? buildPatchOperationHintLines(input.request, baselineManifest)
          : []
      const envBlock = environmentSummaryLines
        ? [
            "Environment capabilities:",
            environmentSummaryLines,
            ...(descriptorText
              ? ["", "Environment capabilities (encoded):", descriptorText, ""]
              : [""]),
          ]
        : []
      const createOutputLine = outputIsJson
        ? "Return only a compact JSON @ecp.workflow document for this request."
        : `Return only a compact @ecp.workflow document encoded as ${format} for this request.`
      const patchOutputLine = outputIsJson
        ? "Return only compact JSON for schema @ecp.patch."
        : `Return only a compact @ecp.patch document encoded as ${format}.`
      const lines = isPatch
        ? [
            patchOutputLine,
            `User request: ${input.request}`,
            ...patchHints,
            ...requestHints,
            ...envBlock,
            "Current workflow (summary):",
            workflowSummaryText,
          ]
        : [
            createOutputLine,
            `User request: ${input.request}`,
            ...requestHints,
            ...envBlock,
            // Suppress single-step schema example when specific multi-step requirements
            // are already in the prompt — it anchors the 1B model to single-step outputs.
            ...(outputIsJson && requestHints.length === 0
              ? [`Example output shape: ${formatSchemaExampleJson("@ecp.workflow")}`]
              : []),
          ]
      if (repairText) {
        lines.push(
          "Previous attempt failed. Do not repeat error text. Output only the corrected document:",
          repairText,
          buildRepairHint(promptFixtureId)
        )
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
            ? formatStructuredRepairForModel(priorFeedback)
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
      evaluate: async (raw, { priorFeedback }) => {
        const feedback: HarnessOperationFeedback[] = []

        if (
          !isPatch &&
          outputIsJson &&
          (raw.match(/"schema"\s*:\s*"@ecp\.workflow"/g)?.length ?? 0) > 1
        ) {
          return {
            success: false,
            feedback: [
              collectModelOutputFeedback(
                "Return exactly one @ecp.workflow JSON object. Do not output multiple documents or examples."
              ),
            ],
          }
        }

        const structuredPrior = formatStructuredRepairForModel(priorFeedback)
        if (
          config.repair.includeValidationErrors &&
          isRepairFeedbackEcho(raw, structuredPrior)
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

        let decodeRaw = raw
        if (outputIsJson) {
          decodeRaw = isPatch ? repairPatchJsonSyntax(raw) : repairWorkflowJsonSyntax(raw)
        }

        const decoded = await ctx.ecp
          .decode(decodeRaw)
          .uses(format)
          .to(isPatch ? "@ecp.patch" : "@ecp.workflow")
          .with({ headers: false, compact: true })
          .process()

        let document = decoded.result
        if (!isPatch && document !== undefined) {
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

        const wfArtifact = artifact as WorkflowManifest
        if (!isPatch && environmentSummary) {
          const capFeedback = collectCreateCapabilityFeedback(
            input.request,
            environmentSummary,
            wfArtifact
          )
          if (capFeedback) {
            return { success: false, feedback: [...feedback, ...capFeedback] }
          }
        }
        if (isPatch && environmentSummary) {
          const patchFeedback = collectPatchGoalFeedback(
            input.request,
            wfArtifact,
            environmentSummary,
            baselineManifest
          )
          if (patchFeedback) {
            return { success: false, feedback: [...feedback, ...patchFeedback] }
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
