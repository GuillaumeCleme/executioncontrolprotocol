import type { HarnessRunContext } from "@ecp/types"

/** Compact run context for assistant harness prompts (eval internal). */
export interface CompactRunContextSummary {
  runId: string
  status: string
  workflowId?: string
  workflowLabel?: string
  failedSteps: Array<{ stepId: string; status: string }>
}

/**
 * Summarize harness run context for model prompts.
 * @internal Eval harness only — not part of @ecp/core.
 */
export function summarizeHarnessRunContext(context: HarnessRunContext): CompactRunContextSummary {
  const run = context.run
  const failedSteps: Array<{ stepId: string; status: string }> = []
  for (const [stepId, record] of Object.entries(run.history ?? {})) {
    if (record.status === "failed") {
      failedSteps.push({ stepId, status: record.status })
    }
  }
  const wf = context.workflow as { workflow?: { id?: string; label?: string } } | undefined
  return {
    runId: run.run.id,
    status: run.run.status,
    workflowId: wf?.workflow?.id,
    workflowLabel: wf?.workflow?.label,
    failedSteps,
  }
}

/**
 * Format run context summary as prompt lines.
 * @internal Eval harness only.
 */
export function formatRunContextSummaryLines(context: HarnessRunContext): string[] {
  const summary = summarizeHarnessRunContext(context)
  const lines = [
    `Run ${summary.runId} status: ${summary.status}`,
  ]
  if (summary.workflowId) {
    lines.push(
      `Workflow: ${summary.workflowId}${summary.workflowLabel ? ` (${summary.workflowLabel})` : ""}`
    )
  }
  if (summary.failedSteps.length > 0) {
    lines.push("Failed steps:")
    for (const f of summary.failedSteps) {
      lines.push(`- ${f.stepId}: ${f.status}`)
    }
  }
  return lines
}
