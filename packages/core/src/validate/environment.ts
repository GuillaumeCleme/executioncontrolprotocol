import { LATEST_ECP_VERSION } from "@ecp/types"
import type { EnvironmentDescriptor, ValidationResult, WorkflowManifest } from "@ecp/types"
import { validateWorkflow } from "./workflow.js"
import type { ResolvedBindings } from "../environment/bindings.js"

const BROWSER_FORBIDDEN_EXTENSIONS = new Set(["@ecp/process-env", "@ecp/secrets"])

/** Validate workflow against a live environment. */
export function validateEnvironmentWithWorkflow(
  workflow: WorkflowManifest,
  descriptor: EnvironmentDescriptor,
  bindings: ResolvedBindings
): ValidationResult {
  const result = validateWorkflow(workflow, descriptor)
  const rtId = String(bindings.runtime.id)
  if (rtId === "@ecp/browser") {
    for (const ext of bindings.extensions) {
      if (BROWSER_FORBIDDEN_EXTENSIONS.has(String(ext.id))) {
        result.valid = false
        result.errors.push({
          code: "BROWSER_FORBIDDEN_EXTENSION",
          message: `Extension ${ext.id} cannot be used with @ecp/browser runtime.`,
        })
      }
    }
  }
  if (rtId === "@ecp/local") {
    result.valid = false
    result.errors.push({
      code: "DEPRECATED_RUNTIME",
      message: "Runtime @ecp/local was replaced by @ecp/node.",
    })
  }
  result.schema = "@ecp.validation.result"
  result.version = LATEST_ECP_VERSION
  return result
}
