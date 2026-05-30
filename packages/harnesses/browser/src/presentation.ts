import type { HarnessOperationFeedback, ValidationIssue } from "@ecp/types"

/**
 * Format structured harness feedback for model repair prompts (eval harnesses).
 * @category Evals
 */
export function formatFeedbackForModel(feedback: HarnessOperationFeedback[]): string | undefined {
  const issues = feedback.flatMap((f) => f.issues)
  if (issues.length === 0) return undefined
  const lines: string[] = []
  for (const issue of issues) {
    const code = issue.code ? ` [${issue.code}]` : ""
    lines.push(issue.path ? `${issue.path}: ${issue.message}${code}` : `${issue.message}${code}`)
  }
  return lines.join("; ")
}

/**
 * Compact repair instructions for small models (avoids echoing long prose).
 * @category Evals
 */
export function formatStructuredRepairForModel(
  feedback: HarnessOperationFeedback[]
): string | undefined {
  const issues = feedback.flatMap((f) => f.issues)
  if (issues.length === 0) return undefined
  const bullets = issues.map((issue) => {
    const code = issue.code ? ` (${issue.code})` : ""
    const path = issue.path ? `${issue.path}: ` : ""
    return `- ${path}${issue.message}${code}`
  })
  return ["Fix the document (EQL only — do not repeat these lines):", ...bullets].join("\n")
}

const REPAIR_TEMPLATE_MARKERS =
  /\bexample-wf\b|\bexample-step\b|\bcapability-id\b|\banchor-step\b|\bremove-step\b|\btarget-step\b|\bnew-step\b|"Example label"/

/** True when model copied the neutral repair template instead of substituting real ids. */
export function isRepairTemplateEcho(raw: string): boolean {
  return REPAIR_TEMPLATE_MARKERS.test(raw)
}

/**
 * True when model output looks like echoed validation/repair text, not a document.
 * @category Evals
 */
export function isRepairFeedbackEcho(
  raw: string,
  formattedFeedback?: string
): boolean {
  const text = raw.trim()
  if (!text) return false
  if (formattedFeedback && text === formattedFeedback.trim()) return true
  if (/^Fix the document/i.test(text) && !/^\{/.test(text) && !/^schema:/m.test(text)) {
    return true
  }
  if (
    /PATCH WORKFLOW then workflow id/i.test(text) ||
    /UPDATE STEP step-id/i.test(text) ||
    /Repair syntax example only/i.test(text) ||
    /\bexample-wf\b/.test(text)
  ) {
    return true
  }
  const feedbackProse =
    /Workflow must include steps|Missing uses:|MODEL_OUTPUT_INVALID|Do not repeat error|Add \d+ more step/i
  const firstLine = text.split("\n")[0] ?? ""
  const documentStart =
    /^(?:WORKFLOW \S|PATCH WORKFLOW|INTENT \S|REPLY$|STEP \S+ USES)/.test(firstLine) ||
    /^(?:```|schema:\s*@ecp\.|"schema"\s*:|workflow:\s*@ecp\.|\{\s*"schema")/i.test(firstLine)
  if (feedbackProse.test(text) && !documentStart) {
    return true
  }
  const echoPattern =
    /(?:workflow|steps|targetSchema|patches|schema):\s*(?:Required|Invalid)/i
  return echoPattern.test(text) && !documentStart
}

/**
 * Detect echo from structured issues only.
 * @category Evals
 */
export function isIssuesOnlyOutput(raw: string, issues: ValidationIssue[]): boolean {
  const formatted = issues
    .map((i) => (i.path ? `${i.path}: ${i.message}` : i.message))
    .join("; ")
  return formatted.length > 0 && isRepairFeedbackEcho(raw, formatted)
}
