import { LATEST_ECP_VERSION } from "@ecp/types"

/**
 * Normalize common model JSON mistakes before workflow validation (eval workflow harness).
 * @category Evals
 */
export function normalizeWorkflowDocumentCandidate(document: unknown): unknown {
  if (document === null || typeof document !== "object" || Array.isArray(document)) {
    return document
  }

  const record = document as Record<string, unknown>
  const workflow =
    record.workflow !== null && typeof record.workflow === "object" && !Array.isArray(record.workflow)
      ? (record.workflow as Record<string, unknown>)
      : undefined

  let steps = record.steps
  let workflowMeta = workflow

  if (workflow && Array.isArray(workflow.steps) && steps === undefined) {
    const { steps: nestedSteps, ...rest } = workflow
    steps = nestedSteps
    workflowMeta = rest
  }

  const normalized: Record<string, unknown> = {
    ...record,
    schema: record.schema ?? "@ecp.workflow",
    version: record.version ?? LATEST_ECP_VERSION,
  }

  if (workflowMeta !== undefined) {
    normalized.workflow = workflowMeta
  }
  if (steps !== undefined) {
    normalized.steps = steps
  }

  return normalized
}
