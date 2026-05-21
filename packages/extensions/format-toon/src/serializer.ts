import type {
  BranchNode,
  ExprValue,
  InputValue,
  LoopNode,
  ParallelNode,
  StepNode,
  WorkflowManifest,
  WorkflowNode,
} from "@ecp/types"

function indent(level: number): string {
  return "  ".repeat(level)
}

function quoteString(s: string): string {
  if (/^[a-zA-Z0-9_./@-]+$/.test(s) && !s.includes(" ")) return s
  return JSON.stringify(s)
}

function serializeExpr(expr: ExprValue): string {
  if ("eq" in expr && Array.isArray(expr.eq)) {
    return `${String(expr.eq[0])} == ${serializeScalar(expr.eq[1])}`
  }
  if ("neq" in expr && Array.isArray(expr.neq)) {
    return `${String(expr.neq[0])} != ${serializeScalar(expr.neq[1])}`
  }
  return JSON.stringify(expr)
}

function serializeScalar(v: unknown): string {
  if (v === null) return "null"
  if (typeof v === "boolean") return v ? "true" : "false"
  if (typeof v === "number") return String(v)
  if (typeof v === "string") return quoteString(v)
  return JSON.stringify(v)
}

function serializeInputValue(value: InputValue, level: number): string[] {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    if ("$ref" in value) {
      const path = (value as { $ref: string }).$ref.replace(/^state\./, "")
      return [`${indent(level)}$${path}`]
    }
    if ("$state" in value) {
      return [`${indent(level)}~${(value as { $state: string }).$state}`]
    }
    const lines: string[] = []
    for (const [k, v] of Object.entries(value)) {
      if (v !== null && typeof v === "object" && !Array.isArray(v) && ("$ref" in v || "$state" in v)) {
        lines.push(`${indent(level)}${k}: ${serializeInputValue(v as InputValue, 0)[0]!.trim()}`)
      } else if (typeof v === "object" && v !== null) {
        lines.push(`${indent(level)}${k}: ${JSON.stringify(v)}`)
      } else {
        lines.push(`${indent(level)}${k}: ${serializeScalar(v)}`)
      }
    }
    return lines
  }
  return [`${indent(level)}${serializeScalar(value)}`]
}

function serializeInputBlock(input: Record<string, InputValue> | undefined, level: number): string[] {
  if (!input || Object.keys(input).length === 0) return []
  const lines = [`${indent(level)}in:`]
  for (const [k, v] of Object.entries(input)) {
    if (v !== null && typeof v === "object" && !Array.isArray(v) && ("$ref" in v || "$state" in v)) {
      const inner = serializeInputValue(v, 0)[0]!.trim()
      lines.push(`${indent(level + 1)}${k}: ${inner}`)
    } else if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      lines.push(`${indent(level + 1)}${k}: ${JSON.stringify(v)}`)
    } else {
      lines.push(`${indent(level + 1)}${k}: ${serializeScalar(v)}`)
    }
  }
  return lines
}

function serializeOut(step: StepNode, level: number): string[] {
  if (!step.commitAs) return []
  const mode = step.commitMode ? ` ${step.commitMode}` : ""
  return [`${indent(level)}out: ${step.commitAs}${mode}`]
}

function serializeStep(step: StepNode, level: number): string[] {
  const lines: string[] = []
  const label = step.label ? ` ${quoteString(step.label)}` : ""
  lines.push(`${indent(level)}step ${step.id}${label}`)
  lines.push(`${indent(level + 1)}uses: ${step.uses}`)
  if (step.when) {
    lines.push(`${indent(level + 1)}when: ${serializeExpr(step.when)}`)
  }
  lines.push(...serializeInputBlock(step.input, level + 1))
  lines.push(...serializeOut(step, level + 1))
  return lines
}

function serializeNodes(nodes: WorkflowNode[], level: number): string[] {
  const lines: string[] = []
  for (const node of nodes) {
    if (!node.type || node.type === "step") {
      lines.push(...serializeStep(node as StepNode, level))
      continue
    }
    if (node.type === "loop") {
      const loop = node as LoopNode
      const label = loop.label ? ` ${quoteString(loop.label)}` : ""
      lines.push(`${indent(level)}loop ${loop.id}${label}`)
      if (loop.until) {
        lines.push(`${indent(level + 1)}until: ${serializeExpr(loop.until)}`)
      }
      if (loop.maxRounds !== undefined) {
        lines.push(`${indent(level + 1)}max: ${loop.maxRounds}`)
      }
      lines.push(...serializeNodes(loop.steps, level + 1))
      lines.push(`${indent(level)}end`)
      continue
    }
    if (node.type === "parallel") {
      const par = node as ParallelNode
      const label = par.label ? ` ${quoteString(par.label)}` : ""
      lines.push(`${indent(level)}parallel ${par.id}${label}`)
      par.branches.forEach((branch, i) => {
        lines.push(`${indent(level + 1)}branch ${i}`)
        lines.push(...serializeNodes(branch, level + 2))
        lines.push(`${indent(level + 1)}end`)
      })
      lines.push(`${indent(level)}end`)
      continue
    }
    const branch = node as BranchNode
    const label = branch.label ? ` ${quoteString(branch.label)}` : ""
    lines.push(`${indent(level)}branch ${branch.id}${label}`)
    for (const b of branch.branches) {
      const caseLabel = b.label ?? "case"
      lines.push(`${indent(level + 1)}case ${caseLabel} when ${serializeExpr(b.when)}`)
      lines.push(...serializeNodes(b.steps, level + 2))
      lines.push(`${indent(level + 1)}end`)
    }
    lines.push(`${indent(level)}end`)
  }
  return lines
}

/**
 * Serialize workflow manifest to TOON text.
 * @category Encoding
 */
export function serializeWorkflowManifestToToon(
  manifest: WorkflowManifest,
  _options?: { compact?: boolean }
): string {
  const wfLabel = manifest.workflow.label
    ? ` ${quoteString(manifest.workflow.label)}`
    : ""
  const header = [
    "schema: @ecp.workflow",
    `version: ${manifest.version}`,
    `workflow: ${manifest.workflow.id}${wfLabel}`,
    "",
  ]
  return [...header, ...serializeNodes(manifest.steps, 0)].join("\n").trimEnd() + "\n"
}
