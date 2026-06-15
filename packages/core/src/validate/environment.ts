import { LATEST_ECP_VERSION } from "@executioncontextprotocol/types"
import type { EnvironmentDescriptor, ValidationResult, WorkflowManifest } from "@executioncontextprotocol/types"
import { globalRegistry } from "../registry/registry.js"
import { validateWorkflow } from "./workflow.js"
import type { ResolvedBindings } from "../environment/bindings.js"

/** Validate workflow against a live environment. */
export function validateEnvironmentWithWorkflow(
  workflow: WorkflowManifest,
  descriptor: EnvironmentDescriptor,
  bindings: ResolvedBindings
): ValidationResult {
  const result = validateWorkflow(workflow, descriptor)
  const rtId = String(bindings.runtime.id)

  for (const ext of bindings.extensions) {
    const def = globalRegistry.getExtension(String(ext.id))
    const supported = def?.supportedRuntimes
    if (supported?.length && !supported.includes(rtId as (typeof supported)[number])) {
      result.valid = false
      result.errors.push({
        code: "UNSUPPORTED_RUNTIME_EXTENSION",
        message: `Extension ${ext.id} does not support runtime ${rtId}. Supported: ${supported.join(", ")}`,
      })
    }
  }

  if (rtId === "@executioncontextprotocol/local") {
    result.valid = false
    result.errors.push({
      code: "DEPRECATED_RUNTIME",
      message: "Runtime @executioncontextprotocol/local was replaced by @executioncontextprotocol/node.",
    })
  }
  result.schema = "@ecp.validation.result"
  result.version = LATEST_ECP_VERSION
  return result
}
