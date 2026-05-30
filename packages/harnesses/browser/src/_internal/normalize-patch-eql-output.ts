const PATCH_OPERATION_LINE = /^(UPDATE|DELETE|ADD)\s+STEP\b/i

/** Prepend PATCH WORKFLOW when the model omits the header but outputs patch operations. */
export function normalizePatchEqlRawOutput(
  raw: string,
  workflowId: string | undefined
): string {
  let trimmed = raw.trim()
  if (!trimmed) return raw

  trimmed = trimmed.replace(
    /^PATCH WORKFLOW (\S+)\s+with\s+LABEL\b[^\n]*/gim,
    "PATCH WORKFLOW $1"
  )
  trimmed = trimmed.replace(
    /^UPDATE STEP (\S+)\s+with\s+LABEL\s+"([^"]+)"/gim,
    'UPDATE STEP $1\n  LABEL "$2"'
  )

  if (!workflowId) return trimmed

  trimmed = trimmed.replace(/^PATCH WORKFLOW \S+/im, `PATCH WORKFLOW ${workflowId}`)

  const firstLine = trimmed.split(/\r?\n/, 1)[0]?.trim() ?? ""
  if (/^PATCH\s+WORKFLOW\b/i.test(firstLine)) return trimmed

  if (PATCH_OPERATION_LINE.test(firstLine)) {
    return `PATCH WORKFLOW ${workflowId}\n${trimmed}`
  }

  return trimmed
}

const REPAIR_TEMPLATE_MARKERS =
  /\bexample-wf\b|\bexample-step\b|\bcapability-id\b|\banchor-step\b|\bremove-step\b|\btarget-step\b|\bnew-step\b|"Example label"/

/** Replace neutral repair-template tokens with values from the current patch context. */
export function substitutePatchRepairTemplate(
  raw: string,
  workflowId: string | undefined,
  targetStepId: string | undefined,
  requestedLabel?: string
): string {
  if (!REPAIR_TEMPLATE_MARKERS.test(raw)) return raw
  let result = raw
  if (workflowId) {
    result = result.replace(/\bexample-wf\b/g, workflowId)
    result = result.replace(/^PATCH WORKFLOW example-step\b/gim, `PATCH WORKFLOW ${workflowId}`)
  }
  if (targetStepId) {
    result = result.replace(/\bexample-step\b/g, targetStepId)
  }
  if (requestedLabel) {
    result = result.replace(/"Example label"/g, `"${requestedLabel}"`)
  }
  return result
}
