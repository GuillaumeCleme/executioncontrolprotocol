import type { StepNode, WorkflowManifest, WorkflowNode } from "@ecp/types"
import { type MermaidEncodeOptions, mermaidFlowchartHeader } from "./options.js"

function stepLabel(node: StepNode): string {
  const label = node.label ?? node.id
  return label.replace(/"/g, "'")
}

/** Step nodes may omit `type` (e.g. compact TOON rows); match runtime executor rules. */
function isStepNode(node: WorkflowNode): node is StepNode {
  return !node.type || node.type === "step"
}

function walkNodes(
  nodes: WorkflowNode[],
  lines: string[],
  stepIds: string[],
  prefix: string
): void {
  nodes.forEach((node, index) => {
    const id = `${prefix}${index}`
    if (isStepNode(node)) {
      lines.push(`  ${id}["${stepLabel(node)}"]`)
      stepIds.push(id)
      return
    }
    if (node.type === "parallel") {
      lines.push(`  ${id}["parallel"]`)
      node.branches.forEach((branch, bi) => walkNodes(branch, lines, stepIds, `${id}b${bi}_`))
      return
    }
    if (node.type === "branch") {
      lines.push(`  ${id}["branch"]`)
      node.branches.forEach((branch, bi) => walkNodes(branch.steps, lines, stepIds, `${id}b${bi}_`))
      return
    }
    if (node.type === "loop") {
      lines.push(`  ${id}["loop"]`)
      walkNodes(node.steps, lines, stepIds, `${id}_`)
    }
  })
}

/**
 * Render a workflow manifest as a Mermaid flowchart (encode-only).
 * @category Encoding
 */
export function workflowToMermaid(
  manifest: WorkflowManifest,
  options?: MermaidEncodeOptions
): string {
  const lines = [mermaidFlowchartHeader(options), `  root["${manifest.workflow.id}"]`]
  const stepIds: string[] = []
  walkNodes(manifest.steps, lines, stepIds, "s")
  if (stepIds.length === 0) {
    lines.push('  empty["no steps"]')
    lines.push("  root --> empty")
  } else {
    lines.push(`  root --> ${stepIds[0]}`)
    for (let i = 0; i < stepIds.length - 1; i++) {
      lines.push(`  ${stepIds[i]} --> ${stepIds[i + 1]}`)
    }
  }
  return lines.join("\n")
}
