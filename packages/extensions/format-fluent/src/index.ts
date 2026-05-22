import { catalogExtension, globalRegistry } from "@ecp/core"
import { formatFluentExtension } from "./extension.js"

catalogExtension(formatFluentExtension)

export { formatFluentExtension } from "./extension.js"
export { encodeWorkflowToFluent } from "./encode.js"
export { renderWorkflowManifestToFluent } from "./render-workflow.js"

/** Register Fluent format extension on the registry. @category Extensions */
export async function registerFormatFluentExtension(
  registry = globalRegistry
): Promise<void> {
  if (!registry.getExtension("@ecp/format-fluent")) {
    await registry.registerExtension(formatFluentExtension)
  }
}

export default formatFluentExtension
