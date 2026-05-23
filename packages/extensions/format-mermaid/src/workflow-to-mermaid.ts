import type { StepNode, WorkflowManifest, WorkflowNode } from "@ecp/types"

function stepLabel(node: StepNode): string {
  const label = node.label ?? node.id
  return label.replace(/"/g, "'")
}

function walkNodes(nodes: WorkflowNode[], lines: string[], prefix: string): void {
  nodes.forEach((node, index) => {
    const id = `${prefix}${index}`
    if (node.type === "step") {
      lines.push(`  ${id}["${stepLabel(node)}"]`)
      return
    }
    if (node.type === "parallel") {
      lines.push(`  ${id}["parallel"]`)
      node.branches.forEach((branch, bi) => walkNodes(branch, lines, `${id}b${bi}_`))
      return
    }
    if (node.type === "branch") {
      lines.push(`  ${id}["branch"]`)
      node.branches.forEach((branch, bi) => walkNodes(branch.steps, lines, `${id}b${bi}_`))
      return
    }
    if (node.type === "loop") {
      lines.push(`  ${id}["loop"]`)
      walkNodes(node.steps, lines, `${id}_`)
    }
  })
}

/**
 * Render a workflow manifest as a Mermaid flowchart (encode-only).
 * @category Encoding
 */
export function workflowToMermaid(manifest: WorkflowManifest): string {
  const lines = ["flowchart TD", `  root["${manifest.workflow.id}"]`]
  walkNodes(manifest.steps, lines, "s")
  if (lines.length === 2) {
    lines.push('  empty["no steps"]')
    lines.push("  root --> empty")
  }
  return lines.join("\n")
}
