import { LATEST_ECP_VERSION, type EcpVersion } from "@ecp/types"
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

function parseScalar(token: string): unknown {
  const t = token.trim()
  if (t === "true") return true
  if (t === "false") return false
  if (t === "null") return null
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t)
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return JSON.parse(t.startsWith("'") ? `"${t.slice(1, -1)}"` : t)
  }
  return t
}

function parseExpr(expr: string): ExprValue {
  const eqMatch = expr.match(/^(.+?)\s*==\s*(.+)$/)
  if (eqMatch) {
    return { eq: [eqMatch[1]!.trim(), parseScalar(eqMatch[2]!)] }
  }
  const neqMatch = expr.match(/^(.+?)\s*!=\s*(.+)$/)
  if (neqMatch) {
    return { neq: [neqMatch[1]!.trim(), parseScalar(neqMatch[2]!)] }
  }
  return { eq: [expr.trim(), true] }
}

function parseInputValue(raw: string): InputValue {
  const t = raw.trim()
  if (t.startsWith("$")) {
    return { $ref: `state.${t.slice(1)}` }
  }
  if (t.startsWith("~")) {
    return { $state: t.slice(1) }
  }
  if (t.startsWith("{") || t.startsWith("[")) {
    return JSON.parse(t) as InputValue
  }
  return parseScalar(t) as InputValue
}

interface ParseLine {
  indent: number
  text: string
}

function toLines(text: string): ParseLine[] {
  return text
    .split("\n")
    .map((line) => {
      const m = line.match(/^(\s*)(.*)$/)
      const spaces = m?.[1]?.length ?? 0
      const indent = Math.floor(spaces / 2)
      return { indent, text: (m?.[2] ?? "").trim() }
    })
    .filter((l) => l.text.length > 0)
}

function parseHeader(lines: ParseLine[]): {
  version: EcpVersion
  workflowId: string
  workflowLabel?: string
  start: number
} {
  let version: EcpVersion = LATEST_ECP_VERSION
  let workflowId = "workflow"
  let workflowLabel: string | undefined
  let start = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (line.text.startsWith("version:")) {
      version = line.text.slice("version:".length).trim() as EcpVersion
      start = i + 1
    } else if (line.text.startsWith("workflow:")) {
      const rest = line.text.slice("workflow:".length).trim()
      const match = rest.match(/^(\S+)(?:\s+(.+))?$/)
      if (match) {
        workflowId = match[1]!
        if (match[2]) {
          workflowLabel = parseScalar(match[2]!) as string
        }
      }
      start = i + 1
    } else if (line.text.startsWith("schema:")) {
      start = i + 1
    } else if (line.text.startsWith("step ") || line.text.startsWith("loop ") || line.text.startsWith("parallel ") || line.text.startsWith("branch ")) {
      start = i
      break
    }
  }
  return { version, workflowId, workflowLabel, start }
}

function parseStepBlock(lines: ParseLine[], index: number): { node: StepNode; next: number } {
  const header = lines[index]!.text
  const stepMatch = header.match(/^step\s+(\S+)(?:\s+(.+))?$/)
  if (!stepMatch) throw new Error(`Invalid step header: ${header}`)
  const step: StepNode = {
    type: "step",
    id: stepMatch[1]!,
    uses: "",
  }
  if (stepMatch[2]) step.label = parseScalar(stepMatch[2]!) as string

  let i = index + 1
  const baseIndent = lines[index]!.indent
  let inBlock = false
  const input: Record<string, InputValue> = {}

  while (i < lines.length) {
    const line = lines[i]!
    if (line.indent <= baseIndent && i > index + 1) break
    if (line.text === "end" && line.indent === baseIndent) break

    if (line.text.startsWith("uses:")) {
      step.uses = line.text.slice("uses:".length).trim()
    } else if (line.text.startsWith("when:")) {
      step.when = parseExpr(line.text.slice("when:".length).trim())
    } else if (line.text === "in:") {
      inBlock = true
    } else if (line.text.startsWith("out:")) {
      inBlock = false
      const outRest = line.text.slice("out:".length).trim()
      const parts = outRest.split(/\s+/)
      step.commitAs = parts[0]
      if (parts[1]) step.commitMode = parts[1] as StepNode["commitMode"]
    } else if (inBlock && line.text.includes(":")) {
      const colon = line.text.indexOf(":")
      const key = line.text.slice(0, colon).trim()
      const val = line.text.slice(colon + 1).trim()
      input[key] = parseInputValue(val)
    } else if (!inBlock && line.text.includes(":")) {
      const colon = line.text.indexOf(":")
      const key = line.text.slice(0, colon).trim()
      const val = line.text.slice(colon + 1).trim()
      if (key === "uses") step.uses = val
      else if (key === "when") step.when = parseExpr(val)
    }
    i++
  }

  if (Object.keys(input).length > 0) step.input = input
  return { node: step, next: i }
}

function parseNodes(lines: ParseLine[], start: number, endIndent: number): { nodes: WorkflowNode[]; next: number } {
  const nodes: WorkflowNode[] = []
  let i = start

  while (i < lines.length) {
    const line = lines[i]!
    if (line.indent < endIndent) break
    if (line.indent > endIndent) {
      i++
      continue
    }

    if (line.text.startsWith("step ")) {
      const { node, next } = parseStepBlock(lines, i)
      nodes.push(node)
      i = next
      continue
    }

    if (line.text.startsWith("loop ")) {
      const m = line.text.match(/^loop\s+(\S+)(?:\s+(.+))?$/)
      const loop: LoopNode = {
        type: "loop",
        id: m?.[1] ?? "loop",
        steps: [],
      }
      if (m?.[2]) loop.label = parseScalar(m[2]) as string
      i++
      while (i < lines.length && lines[i]!.indent > line.indent) {
        const inner = lines[i]!
        if (inner.text.startsWith("until:")) {
          loop.until = parseExpr(inner.text.slice("until:".length).trim())
        } else if (inner.text.startsWith("max:")) {
          loop.maxRounds = Number(inner.text.slice("max:".length).trim())
        } else if (inner.text.startsWith("step ") || inner.text.startsWith("loop ")) {
          const nested = parseNodes(lines, i, line.indent + 1)
          loop.steps.push(...nested.nodes)
          i = nested.next
          continue
        } else if (inner.text === "end") {
          i++
          break
        }
        i++
      }
      nodes.push(loop)
      continue
    }

    if (line.text.startsWith("parallel ")) {
      const m = line.text.match(/^parallel\s+(\S+)(?:\s+(.+))?$/)
      const par: ParallelNode = {
        type: "parallel",
        id: m?.[1] ?? "parallel",
        branches: [],
      }
      if (m?.[2]) par.label = parseScalar(m[2]) as string
      i++
      let currentBranch: WorkflowNode[] = []
      while (i < lines.length && lines[i]!.indent > line.indent) {
        const inner = lines[i]!
        if (inner.text.startsWith("branch ")) {
          if (currentBranch.length > 0) par.branches.push(currentBranch)
          currentBranch = []
          i++
          continue
        }
        if (inner.text === "end" && inner.indent === line.indent + 1) {
          if (currentBranch.length > 0) par.branches.push(currentBranch)
          currentBranch = []
          i++
          continue
        }
        if (inner.text.startsWith("step ") || inner.text.startsWith("loop ")) {
          const nested = parseNodes(lines, i, inner.indent)
          currentBranch.push(...nested.nodes)
          i = nested.next
          continue
        }
        i++
      }
      if (currentBranch.length > 0) par.branches.push(currentBranch)
      if (par.branches.length === 0) par.branches = [[]]
      nodes.push(par)
      continue
    }

    if (line.text.startsWith("branch ")) {
      const m = line.text.match(/^branch\s+(\S+)(?:\s+(.+))?$/)
      const br: BranchNode = {
        type: "branch",
        id: m?.[1] ?? "branch",
        branches: [],
      }
      if (m?.[2]) br.label = parseScalar(m[2]) as string
      i++
      while (i < lines.length && lines[i]!.indent > line.indent) {
        const inner = lines[i]!
        const caseMatch = inner.text.match(/^case\s+(\S+)\s+when\s+(.+)$/)
        if (caseMatch) {
          const caseSteps: WorkflowNode[] = []
          i++
          while (i < lines.length && lines[i]!.indent > inner.indent) {
            if (lines[i]!.text === "end") {
              i++
              break
            }
            if (lines[i]!.text.startsWith("step ")) {
              const { node, next } = parseStepBlock(lines, i)
              caseSteps.push(node)
              i = next
            } else {
              i++
            }
          }
          br.branches.push({
            label: caseMatch[1],
            when: parseExpr(caseMatch[2]!),
            steps: caseSteps,
          })
          continue
        }
        if (inner.text === "end" && inner.indent === line.indent) break
        i++
      }
      nodes.push(br)
      continue
    }

    if (line.text === "end") {
      i++
      break
    }
    i++
  }

  return { nodes, next: i }
}

/**
 * Parse TOON text into a workflow manifest.
 * @category Encoding
 */
export function parseToonWorkflow(text: string): WorkflowManifest {
  const lines = toLines(text)
  const { version, workflowId, workflowLabel, start } = parseHeader(lines)
  const { nodes } = parseNodes(lines, start, 0)
  return {
    schema: "@ecp.workflow",
    version,
    workflow: {
      id: workflowId,
      ...(workflowLabel ? { label: workflowLabel } : {}),
    },
    steps: nodes,
  }
}
