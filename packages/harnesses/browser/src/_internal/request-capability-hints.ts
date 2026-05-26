import { collectModelOutputFeedback } from "@ecp/core"
import type { HarnessOperationFeedback, WorkflowManifest } from "@ecp/types"
import type { CompactEnvironmentSummary } from "./summarize-environment.js"

/**
 * Match capability ids mentioned in a natural-language request (eval harness internal).
 * @internal
 */
export function inferRequiredCapabilityIds(
  request: string,
  capabilityIds: readonly string[]
): string[] {
  const lower = request.toLowerCase()
  const matched = new Set<string>()

  for (const id of capabilityIds) {
    if (request.includes(id)) matched.add(id)
  }

  const bySuffix = (suffix: string): string | undefined =>
    capabilityIds.find((id) => id.endsWith(suffix))

  if (/\becho\b/.test(lower)) {
    const echo = bySuffix("echo")
    if (echo) matched.add(echo)
  }
  if (/\bsummarize\b/.test(lower) && !/\bremove\b[^.]*\bsummarize\b/.test(lower)) {
    const cap = bySuffix("summarize")
    if (cap) matched.add(cap)
  }
  if (/\bnotify\b/.test(lower)) {
    const cap = bySuffix("notify")
    if (cap) matched.add(cap)
  }
  if (/\btranslate\b/.test(lower)) {
    const cap = bySuffix("translate")
    if (cap) matched.add(cap)
  }
  const validateCapIds = capabilityIds.filter((id) => id.endsWith(".validate"))
  const hasExplicitValidateCap = validateCapIds.some((id) => request.includes(id))
  const validateThenWithoutCap =
    /\bvalidate\s+then\b/i.test(request) && !hasExplicitValidateCap
  if (
    hasExplicitValidateCap ||
    (/\bvalidate\b/.test(lower) &&
      !validateThenWithoutCap &&
      (/\bfirst\s+.*\bvalidate\b/.test(lower) || /\bvalidate\s+step\b/i.test(request)))
  ) {
    const cap = bySuffix("validate")
    if (cap) matched.add(cap)
  }

  return [...matched]
}

/**
 * User-prompt lines nudging the model toward required capabilities.
 * @internal
 */
export function buildRequestCapabilityHintLines(
  request: string,
  summary: CompactEnvironmentSummary
): string[] {
  const ids = summary.capabilities.map((c) => c.id)
  const required = inferRequiredCapabilityIds(request, ids)
  if (required.length === 0) return []
  return [
    `Required: ${required.length} step(s) in order (top-level steps array, not nested under workflow):`,
    ...required.map((id, index) => `${index + 1}. uses ${id}`),
    "Use only these capability ids; do not substitute summarize/notify/translate unless listed.",
    "",
  ]
}

/**
 * Patch-specific user-prompt lines (operation + target step ids).
 * @internal
 */
export function buildPatchOperationHintLines(
  request: string,
  manifest: WorkflowManifest
): string[] {
  const lower = request.toLowerCase()
  const stepIds =
    manifest.steps
      ?.filter((s) => "uses" in s && typeof s.uses === "string")
      .map((s) => s.id) ?? []
  const lines = [
    `Patch targets only existing step ids: ${stepIds.join(", ") || "none"}.`,
    "Never use capability ids (e.g. @ecp/demo.summarize) as step ids in patch paths.",
  ]

  const labelStep =
    request.match(/change\s+(?:the\s+)?(\w+)\s+step\s+label/i)?.[1] ??
    request.match(/rename\s+(\w+)\s+label/i)?.[1]
  if (labelStep && /label|rename/i.test(lower)) {
    lines.push(
      `Operation: replace steps[${labelStep}].label only (bracket notation, not slash). Do not change other step ids or add steps.`
    )
    return lines
  }

  if (/remove\s+(?:the\s+)?\w+\s+step/i.test(lower)) {
    lines.push('Operation: patch path "steps" mode "replace" with array omitting the removed step id.')
    return lines
  }

  if (/add|insert|append|include/i.test(lower)) {
    lines.push(
      'Operation: patch path "steps" mode "replace" with full array: keep existing steps plus new step(s) for requested capabilities. Do NOT rename an existing step label.'
    )
    return lines
  }

  lines.push(
    "Operation: use steps[stepId].field (bracket notation) for edits; use path steps replace only when adding or removing steps."
  )
  return lines
}

function stepUsesList(workflow: WorkflowManifest): string[] {
  const uses: string[] = []
  for (const node of workflow.steps ?? []) {
    if ("uses" in node && typeof node.uses === "string") {
      uses.push(node.uses)
    }
  }
  return uses
}

/**
 * Harness repair feedback when create output omits requested capabilities.
 * @internal
 */
export function collectCreateCapabilityFeedback(
  request: string,
  summary: CompactEnvironmentSummary,
  workflow: WorkflowManifest
): HarnessOperationFeedback[] | undefined {
  const required = inferRequiredCapabilityIds(
    request,
    summary.capabilities.map((c) => c.id)
  )
  if (required.length === 0) return undefined
  const uses = stepUsesList(workflow)
  const missing = required.filter((id) => !uses.includes(id))
  if (missing.length === 0) return undefined
  const allStepsList = required.map((id, i) => `${i + 1}. uses ${id}`).join(", ")
  return [
    collectModelOutputFeedback(
      `Workflow has ${uses.length} step(s) but needs ${required.length}. ` +
        `The steps array MUST include ALL ${required.length} steps: ${allStepsList}. ` +
        `Missing: ${missing.join(", ")}.`
    ),
  ]
}

/**
 * Harness repair feedback for common patch goals (label, remove step, add capability).
 * @internal
 */
export function collectPatchGoalFeedback(
  request: string,
  patched: WorkflowManifest,
  summary: CompactEnvironmentSummary,
  baseline?: WorkflowManifest
): HarnessOperationFeedback[] | undefined {
  const lower = request.toLowerCase()
  const feedback: HarnessOperationFeedback[] = []

  const removeMatch = lower.match(/remove\s+(?:the\s+)?(\w+)\s+step/)
  if (removeMatch) {
    const stepId = removeMatch[1]
    const still = patched.steps?.find((s) => s.id === stepId)
    if (still) {
      const keepIds =
        patched.steps?.filter((s) => s.id !== stepId).map((s) => s.id) ?? []
      feedback.push(
        collectModelOutputFeedback(
          `Request removes step "${stepId}" but it is still present. Patch path "steps" with mode "replace" and a value array containing only steps: ${keepIds.join(", ") || "none"}.`
        )
      )
    }
  }

  const explicitStepLabel =
    request.match(/change\s+(?:the\s+)?(\w+)\s+step\s+label\s+to\s+(.+?)\.?\s*$/i) ??
    request.match(/rename\s+(\w+)\s+label\s+to\s+(.+?)\.?\s*$/i)
  const genericStepLabel = request.match(
    /(?:change|set)\s+(?:the\s+)?\w+\s+step\s+label\s+to\s+(.+?)\.?\s*$/i
  )
  if ((explicitStepLabel ?? genericStepLabel) && /label|rename/.test(lower)) {
    const targetStepId = explicitStepLabel?.[1]?.trim()
    const wanted = (explicitStepLabel?.[2] ?? genericStepLabel?.[1] ?? "").trim()
    if (targetStepId !== undefined) {
      const target = patched.steps?.find((s) => s.id === targetStepId)
      if (target && target.label !== wanted) {
        feedback.push(
          collectModelOutputFeedback(
            `Patch steps[${targetStepId}].label to "${wanted}" (mode replace). Do not patch other step ids.`
          )
        )
      }
    }
  }

  const required = inferRequiredCapabilityIds(
    request,
    summary.capabilities.map((c) => c.id)
  )
  const uses = stepUsesList(patched)
  const missing = required.filter((id) => !uses.includes(id))
  if (missing.length > 0 && /add|include|append|insert/i.test(lower)) {
    const baselineSteps =
      baseline?.steps?.filter((s) => "uses" in s && typeof s.uses === "string") ?? []
    const baselineIds = baselineSteps.map((s) => s.id).join(", ")
    const totalSteps = baselineSteps.length + missing.length
    feedback.push(
      collectModelOutputFeedback(
        `Patch path "steps" mode "replace". The value array needs ${totalSteps} steps total: ` +
          `keep existing step(s) [${baselineIds || "none"}] and add new step(s) with uses: ${missing.join(", ")}. ` +
          `Do not drop any existing steps. Do not add step objects outside the patches array.`
      )
    )
  }

  return feedback.length > 0 ? feedback : undefined
}
