import type { WorkflowManifest } from "@ecp/types"
import { renderNodes } from "./render-node.js"
import { createImportNeeds } from "./render-value.js"

/** Options for rendering a manifest to Fluent source. @category Fluent */
export interface RenderWorkflowToFluentOptions {
  /** Prefer compact output (reserved for future formatting). */
  compact?: boolean
}

function renderImports(needs: ReturnType<typeof createImportNeeds>): string {
  const names: string[] = ["workflow", "step"]
  if (needs.ref) names.push("ref")
  if (needs.state) names.push("state")
  if (needs.expr) names.push("expr")
  if (needs.loop) names.push("loop")
  if (needs.parallel) names.push("parallel")
  if (needs.branch) names.push("branch")
  return `import {\n  ${names.join(",\n  ")},\n} from "@ecp/core";\n\n`
}

/**
 * Render workflow manifest to Fluent API TypeScript source.
 * @category Fluent
 */
export function renderWorkflowToFluent(
  manifest: WorkflowManifest,
  _options?: RenderWorkflowToFluentOptions
): string {
  const needs = createImportNeeds()
  const nodes = renderNodes(manifest.steps, needs, "    ")
  const header = renderImports(needs)
  let body = `export default workflow(${JSON.stringify(manifest.workflow.label ?? manifest.workflow.id)})\n`
  if (manifest.workflow.id) {
    body += `  .id(${JSON.stringify(manifest.workflow.id)})\n`
  }
  body += `  .run([\n${nodes},\n  ]);\n`
  return header + body
}

/** @deprecated Use {@link renderWorkflowToFluent}. @category Fluent */
export const renderWorkflowManifestToFluent = renderWorkflowToFluent
