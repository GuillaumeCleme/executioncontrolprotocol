import type { StepNode, WorkflowManifest } from "@ecp/types"

/** Compact workflow step row for model prompts (eval harness internal). */
export interface CompactWorkflowStepRow {
  id: string
  uses: string
  label?: string
  inputKeys: string[]
}

/**
 * Summarize a workflow manifest for harness user prompts.
 * @internal Eval harness only — not part of @ecp/core.
 */
export function summarizeWorkflowManifest(manifest: WorkflowManifest): {
  workflowId: string
  workflowLabel?: string
  steps: CompactWorkflowStepRow[]
} {
  const workflow = manifest.workflow
  const steps: CompactWorkflowStepRow[] = []
  for (const node of manifest.steps ?? []) {
    if (node.type !== undefined && node.type !== "step") continue
    if (!("uses" in node) || typeof node.uses !== "string") continue
    const step = node as StepNode
    const input = step.input as Record<string, unknown> | undefined
    steps.push({
      id: step.id,
      uses: step.uses,
      label: step.label,
      inputKeys: input ? Object.keys(input) : [],
    })
  }
  return {
    workflowId: workflow?.id ?? "",
    workflowLabel: workflow?.label,
    steps,
  }
}

/**
 * Format workflow summary as prompt lines.
 * @internal Eval harness only.
 */
export function formatWorkflowSummaryLines(manifest: WorkflowManifest): string[] {
  const summary = summarizeWorkflowManifest(manifest)
  const lines = [
    `Workflow: ${summary.workflowId}${summary.workflowLabel ? ` (${summary.workflowLabel})` : ""}`,
    `Existing step ids (patch only these ids): ${summary.steps.map((s) => s.id).join(", ") || "none"}`,
    "Steps:",
  ]
  for (const step of summary.steps) {
    const inputPart =
      step.inputKeys.length > 0 ? ` input keys: ${step.inputKeys.join(", ")}` : ""
    lines.push(
      `- ${step.id}: uses ${step.uses}${step.label ? ` label "${step.label}"` : ""}${inputPart}`
    )
  }
  return lines
}
