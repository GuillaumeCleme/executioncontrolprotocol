import { registerEvalsIntentClassificationHarness } from "./evals-intent-classification.js"
import { registerEvalsWorkflowAssistantHarness } from "./evals-workflow-assistant.js"
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
  registerEvalsWorkflowAssistantHarness()
  registered = true
}

/** Reset eval harness registration (tests). @internal */
export function resetEvalHarnessesRegistrationForTests(): void {
  registered = false
}
