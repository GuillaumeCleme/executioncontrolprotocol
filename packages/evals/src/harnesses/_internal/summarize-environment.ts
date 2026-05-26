import type { EnvironmentDescriptor } from "@ecp/types"

/** Compact capability row for model prompts (eval harness internal). */
export interface CompactCapabilityRow {
  id: string
  extension: string
  inputs: string[]
  outputs: string[]
}

/** Compact environment summary for small models (eval harness internal). */
export interface CompactEnvironmentSummary {
  extensions: Array<{ id: string; capabilities: string[] }>
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
 * @internal Eval harness only — not part of @ecp/core.
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

/**
 * Plain-text capability lines for small models (readable without parsing TOON).
 * @internal Eval harness only.
 */
export function formatEnvironmentSummaryLines(summary: CompactEnvironmentSummary): string[] {
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
