import { registerWorkflowAuthoringHarness } from "./definitions/workflow-authoring.js"
import { registerIntentClassificationHarness } from "./definitions/intent-classification.js"

let registered = false

/**
 * Catalog standard ECP harness definitions.
 * @category Harness
 */
export function registerStandardHarnesses(): void {
  if (registered) return
  registerWorkflowAuthoringHarness()
  registerIntentClassificationHarness()
  registered = true
}

/** Reset harness registration flag (tests). @internal */
export function resetStandardHarnessesRegistrationForTests(): void {
  registered = false
}
