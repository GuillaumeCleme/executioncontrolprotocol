import {
  ECP_MODEL_GENERATE_INTERFACE,
  LATEST_ECP_VERSION,
  type EcpPatchInput,
  type HarnessInvokeResult,
  type WorkflowManifest,
} from "@ecp/types"
import { z } from "zod"
import { defineHarness } from "../define-harness.js"
import { catalogHarness } from "../harness-catalog.js"
import { callModelGenerate } from "../call-model.js"
import { inferResponseFormatFromFormatter } from "../format-resolve.js"

const outputConfigSchema = z.object({
  schema: z.string().default("@ecp.workflow"),
  format: z.string().default("@ecp/format-toon"),
  validate: z.boolean().default(true),
  apply: z.string().optional(),
  validateResult: z.boolean().optional(),
})

const harnessConfigSchema = z.object({
  system: z.string().optional(),
  context: z
    .object({
      includeEnvironmentDescriptor: z.boolean().default(true),
      descriptorFormat: z.string().default("@ecp/format-toon"),
      includeCurrentWorkflow: z.boolean().default(false),
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
    })
    .default({}),
})

const harnessInputSchema = z.object({
  request: z.string(),
  manifest: z.unknown().optional(),
  model: z.string().optional(),
})

/**
 * Workflow authoring harness (@ecp/workflow-authoring).
 * @category Harness
 */
export const workflowAuthoringHarness = defineHarness("@ecp", "workflow-authoring")
  .withConfig(harnessConfigSchema)
  .withInput(harnessInputSchema)
  .withOutput(
    z.object({
      artifact: z.unknown(),
      raw: z.string(),
      validation: z.unknown().optional(),
      trace: z.record(z.unknown()),
      usage: z.unknown().optional(),
    })
  )
  .usesProviderInterface(ECP_MODEL_GENERATE_INTERFACE)
  .withHandler(async (rawInput, ctx) => {
    const input = harnessInputSchema.parse(rawInput)
    const config = harnessConfigSchema.parse(ctx.config)
    const isPatch = input.manifest !== undefined
    const outputSchema = isPatch ? "@ecp.patch" : config.output.schema
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

    let workflowToon = ""
    if (isPatch && input.manifest) {
      const wfEncoded = await ctx.ecp
        .encode(input.manifest)
        .uses(format)
        .with({ headers: false, compact: true })
        .process()
      workflowToon = String(wfEncoded.result ?? "")
    }

    const system =
      config.system ??
      (isPatch
        ? "Return only ECP TOON patch document. No markdown fences."
        : "Return only ECP TOON workflow text. No markdown fences.")

    const buildPrompt = (repairErrors?: string) => {
      const lines = isPatch
        ? [
            "Return only compact TOON for schema @ecp.patch.",
            `User request: ${input.request}`,
            "Environment descriptor (TOON):",
            descriptorText,
            "Current workflow (TOON):",
            workflowToon,
          ]
        : [
            "Return only a compact TOON @ecp.workflow document for this request.",
            `User request: ${input.request}`,
            "Environment descriptor (TOON):",
            descriptorText,
          ]
      if (repairErrors) lines.push("Fix these validation errors:", repairErrors)
      return lines.join("\n")
    }

    const responseFormat = inferResponseFormatFromFormatter(format)
    let raw = ""
    let artifact: unknown
    let validation: import("@ecp/types").ValidationResult = {
      schema: "@ecp.validation.result",
      version: LATEST_ECP_VERSION,
      valid: true,
      errors: [],
      warnings: [],
    }
    const maxAttempts = config.repair.enabled ? 1 + config.repair.maxAttempts : 0

    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      const repairErrors =
        attempt > 0 && config.repair.includeValidationErrors
          ? validation.errors.map((e) => e.message).join("; ")
          : undefined
      const prompt = buildPrompt(repairErrors)

      const generated = await callModelGenerate(
        ctx.uses,
        { prompt, system, model: input.model, responseFormat },
        ctx.capabilityContext,
        format
      )
      raw = generated.text

      const decoded = await ctx.ecp
        .decode(raw)
        .uses(format)
        .to(isPatch ? "@ecp.patch" : "@ecp.workflow")
        .with({ headers: false, compact: true })
        .process()

      if (!decoded.success || decoded.result === undefined) {
        if (attempt >= maxAttempts) {
          throw new Error(
            decoded.diagnostics.map((d) => d.message).join("; ") || "Failed to decode model output"
          )
        }
        continue
      }

      artifact = decoded.result

      if (isPatch && input.manifest) {
        const patched = await ctx.ecp
          .patch(input.manifest as WorkflowManifest)
          .with(artifact as EcpPatchInput)
          .process()
        if (!patched.success || !patched.result) {
          throw new Error(
            patched.diagnostics?.map((d) => d.message).join("; ") || "Patch application failed"
          )
        }
        artifact = patched.result
      }

      if (config.output.validate || config.output.validateResult) {
        validation = await ctx.ecp.validate(artifact as WorkflowManifest)
        if (!validation.valid && attempt < maxAttempts) continue
      }
      break
    }

    const trace: HarnessInvokeResult["trace"] = {
      harness: ctx.harnessId,
      provider: ctx.uses,
      model: input.model,
      outputSchema,
      outputFormat: format,
      decodeSucceeded: true,
      validationSucceeded: validation.valid,
      ...(config.trace.includePrompt ? { prompt: buildPrompt() } : {}),
      ...(config.trace.includeRawOutput ? { rawOutput: raw } : {}),
    }

    return {
      artifact,
      raw,
      ...(config.trace.includeValidation ? { validation } : {}),
      trace,
    }
  })
  .build()

/** Register workflow authoring harness in the global catalog. @category Harness */
export function registerWorkflowAuthoringHarness(): void {
  catalogHarness(workflowAuthoringHarness)
}
