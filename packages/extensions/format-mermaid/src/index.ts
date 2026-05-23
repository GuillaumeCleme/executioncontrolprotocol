import { globalRegistry, type Registry } from "@ecp/core"
import { formatMermaidExtension } from "./extension.js"

export { formatMermaidExtension } from "./extension.js"
export { workflowToMermaid, workflowToMermaid as renderWorkflowToMermaid } from "./workflow-to-mermaid.js"

/** Register Mermaid format extension. @category Extensions */
export async function registerFormatMermaidExtension(
  registry: Registry = globalRegistry
): Promise<void> {
  if (!registry.getExtension("@ecp/format-mermaid")) {
    await registry.registerExtension(formatMermaidExtension)
  }
}
