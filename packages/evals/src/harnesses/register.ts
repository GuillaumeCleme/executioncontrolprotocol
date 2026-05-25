import { registerEvalsIntentClassificationHarness } from "./evals-intent-classification.js"
import { registerEvalsWorkflowAuthoringHarness } from "./evals-workflow-authoring.js"

let registered = false

/**
 * Register eval-only harness definitions in the global catalog.
 * @category Evals
 */
export function registerEvalHarnesses(): void {
  if (registered) return
  registerEvalsWorkflowAuthoringHarness()
  registerEvalsIntentClassificationHarness()
  registered = true
}

/** Reset eval harness registration (tests). @internal */
export function resetEvalHarnessesRegistrationForTests(): void {
  registered = false
}
