import type { EnvironmentDescriptor, ValidationResult, WorkflowManifest } from "@ecp/types"
import { validateWorkflow } from "./workflow.js"
import type { ResolvedBindings } from "../environment/bindings.js"

/** Validate workflow against a live environment. */
export function validateEnvironmentWithWorkflow(
  workflow: WorkflowManifest,
  descriptor: EnvironmentDescriptor,
  _bindings: ResolvedBindings
): ValidationResult {
  return validateWorkflow(workflow, descriptor)
}
