import type { EnvironmentDescriptor } from "@executioncontrolprotocol/types"

/** Compact capability row for model prompts. @category Harness */
export interface CompactCapabilityRow {
  /** Capability id. */
  id: string
  /** Owning extension id. */
  extension: string
  /** Input field names from schema. */
  inputs: string[]
  /** Output field names from schema. */
  outputs: string[]
}

/** Compact environment summary for small models. @category Harness */
export interface CompactEnvironmentSummary {
  /** Extension rows with capability ids. */
  extensions: Array<{ id: string; capabilities: string[] }>
  /** Flat capability rows. */
  capabilities: CompactCapabilityRow[]
}

function summarizeSchemaFields(schema: unknown): string[] {
  if (schema === null || typeof schema !== "object") return []
  const props = (schema as { properties?: Record<string, unknown> }).properties
  if (!props || typeof props !== "object") return []
  return Object.keys(props)
}

/**
 * Build a compact environment summary from a full describe() result.
 * @category Harness
 */
export function summarizeEnvironmentDescriptor(
  descriptor: EnvironmentDescriptor
): CompactEnvironmentSummary {
  const extensions = [...(descriptor.extensions ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((ext) => ({
      id: ext.id,
      capabilities: [...(ext.capabilities ?? [])],
    }))

  const capabilities = (descriptor.capabilities ?? []).map((cap) => ({
    id: cap.id,
    extension: cap.extension,
    inputs: summarizeSchemaFields(cap.inputSchema),
    outputs: summarizeSchemaFields(cap.outputSchema),
  }))

  return { extensions, capabilities }
}

/** How to render capability rows in user prompts. @category Harness */
export type EnvironmentSummaryFormat = "plain" | "eql-create" | "eql-patch"

function isWorkflowStepCapability(capId: string): boolean {
  return capId.startsWith("@executioncontrolprotocol/demo.") || capId.startsWith("@executioncontrolprotocol/demo.")
}

function workflowStepCapabilities(summary: CompactEnvironmentSummary): CompactCapabilityRow[] {
  return summary.capabilities.filter((cap) => isWorkflowStepCapability(cap.id))
}

function capabilityStepId(capId: string): string {
  const parts = capId.split(".")
  return parts[parts.length - 1] ?? "step"
}

function sampleWithLines(inputs: string[]): string[] {
  if (inputs.length === 0) return []
  const field = inputs[0]!
  if (field === "value") return [`  WITH value = "hello"`]
  if (field === "text") return [`  WITH text = REF echo.output`]
  if (field === "payload") return [`  WITH payload = {"ok": true}`]
  return [`  WITH ${field} = "..."`]
}

function capabilityEqlCreateSnippet(cap: CompactCapabilityRow): string[] {
  const stepId = capabilityStepId(cap.id)
  return [
    `# ${cap.id}`,
    ...(cap.inputs.length > 0 || cap.outputs.length > 0
      ? [`#   inputs: ${cap.inputs.join(", ") || "none"}; outputs: ${cap.outputs.join(", ") || "none"}`]
      : []),
    `STEP ${stepId} USES ${cap.id}`,
    `  LABEL "${stepId.charAt(0).toUpperCase()}${stepId.slice(1)}"`,
    ...sampleWithLines(cap.inputs),
    `  AS ${stepId}`,
  ]
}

function capabilityEqlPatchSnippet(
  cap: CompactCapabilityRow,
  alreadyInWorkflow: boolean
): string[] {
  if (alreadyInWorkflow) {
    return [
      `# ${cap.id} (already used by an existing step — UPDATE STEP or DELETE STEP, not ADD STEP)`,
    ]
  }
  return [
    `# ${cap.id}`,
    ...(cap.inputs.length > 0 || cap.outputs.length > 0
      ? [`#   inputs: ${cap.inputs.join(", ") || "none"}; outputs: ${cap.outputs.join(", ") || "none"}`]
      : []),
    `#   ADD STEP <newStepId> USES ${cap.id} AFTER|BEFORE <anchorStepId from current workflow>`,
  ]
}

/**
 * Plain-text capability lines for small models (readable without parsing TOON).
 * @category Harness
 */
export function formatEnvironmentSummaryLines(
  summary: CompactEnvironmentSummary,
  options?: { format?: EnvironmentSummaryFormat; existingCapabilityUses?: ReadonlySet<string> }
): string[] {
  const format = options?.format ?? "plain"
  const existingUses = options?.existingCapabilityUses ?? new Set<string>()

  if (format === "eql-create") {
    const lines = [
      "EQL capability reference (exact ids — copy USES values verbatim):",
      "",
    ]
    for (const cap of workflowStepCapabilities(summary)) {
      lines.push(...capabilityEqlCreateSnippet(cap), "")
    }
    return lines
  }

  if (format === "eql-patch") {
    const lines = [
      "EQL patch reference (ADD STEP inserts; existing steps stay unless DELETE STEP):",
      "",
    ]
    for (const cap of workflowStepCapabilities(summary)) {
      lines.push(...capabilityEqlPatchSnippet(cap, existingUses.has(cap.id)), "")
    }
    return lines
  }

  const lines = ["Capability ids you may reference (exact strings):"]
  for (const cap of summary.capabilities) {
    const io =
      cap.inputs.length > 0 || cap.outputs.length > 0
        ? ` (inputs: ${cap.inputs.join(", ") || "none"}; outputs: ${cap.outputs.join(", ") || "none"})`
        : ""
    lines.push(`- ${cap.id}${io}`)
  }
  lines.push("Extensions:")
  for (const ext of summary.extensions) {
    lines.push(`- ${ext.id}: ${ext.capabilities.join(", ")}`)
  }
  return lines
}
