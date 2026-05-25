import type { HarnessOperationFeedback } from "@ecp/types"

/**
 * Format structured harness feedback for model repair prompts.
 * @category Browser
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
 * True when model output looks like echoed validation/repair text.
 * @category Browser
 */
export function isRepairFeedbackEcho(raw: string, formattedFeedback?: string): boolean {
  const text = raw.trim()
  if (!text) return false
  if (formattedFeedback && text === formattedFeedback.trim()) return true
  const echoPattern =
    /(?:workflow|steps|targetSchema|patches|schema):\s*(?:Required|Invalid)/i
  const documentStart =
    /^(?:```|schema:\s*@ecp\.|"schema"\s*:|workflow:\s*@ecp\.|\{\s*"schema")/i
  return echoPattern.test(text) && !documentStart.test(text.split("\n")[0] ?? "")
}
