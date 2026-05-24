/** Whether a guided-mode message should trigger workflow authoring. */
export function looksLikeWorkflowRequest(message: string): boolean {
  const lower = message.toLowerCase()
  if (lower.includes("patch") || lower.includes("update workflow") || lower.includes("change workflow")) {
    return true
  }
  if (
    lower.includes("create") ||
    lower.includes("build") ||
    lower.includes("generate") ||
    lower.includes("add step")
  ) {
    return lower.includes("workflow") || lower.includes("echo") || lower.includes("step")
  }
  return false
}
