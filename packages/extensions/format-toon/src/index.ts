import { globalRegistry } from "@ecp/core"
import { formatToonExtension } from "./extension.js"

export { formatToonExtension } from "./extension.js"
export { encodeWorkflowToToon } from "./encode.js"
export { decodeToonToWorkflow } from "./decode.js"
export { serializeWorkflowManifestToToon } from "./serializer.js"
export { parseToonWorkflow } from "./parser.js"

/** Register TOON format extension on the registry. @category Extensions */
export async function registerFormatToonExtension(
  registry = globalRegistry
): Promise<void> {
  if (!registry.getExtension("@ecp/format-toon")) {
    await registry.registerExtension(formatToonExtension)
  }
}

export default formatToonExtension
