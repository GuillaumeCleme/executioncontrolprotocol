import { LATEST_ECP_VERSION } from "@executioncontextprotocol/types"
import type { EnvironmentDescriptor, ValidationResult, WorkflowManifest } from "@executioncontextprotocol/types"
import { validateWorkflow } from "./workflow.js"
import type { ResolvedBindings } from "../environment/bindings.js"

const BROWSER_FORBIDDEN_EXTENSIONS = new Set(["@executioncontextprotocol/process-env", "@executioncontextprotocol/secrets"])

/** Validate workflow against a live environment. */
export function validateEnvironmentWithWorkflow(
  workflow: WorkflowManifest,
  descriptor: EnvironmentDescriptor,
  bindings: ResolvedBindings
): ValidationResult {
  const result = validateWorkflow(workflow, descriptor)
  const rtId = String(bindings.runtime.id)
  if (rtId === "@executioncontextprotocol/browser") {
    for (const ext of bindings.extensions) {
      if (BROWSER_FORBIDDEN_EXTENSIONS.has(String(ext.id))) {
        result.valid = false
        result.errors.push({
          code: "BROWSER_FORBIDDEN_EXTENSION",
          message: `Extension ${ext.id} cannot be used with @executioncontextprotocol/browser runtime.`,
        })
      }
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
