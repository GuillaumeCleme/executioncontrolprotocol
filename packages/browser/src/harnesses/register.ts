import { registerBrowserIntentClassificationHarness } from "./browser-intent-classification.js"
import { registerBrowserWorkflowAuthoringHarness } from "./browser-workflow-authoring.js"

let registered = false

/** Register browser harness definitions in the global catalog. @category Browser */
export function registerBrowserHarnesses(): void {
  if (registered) return
  registerBrowserWorkflowAuthoringHarness()
  registerBrowserIntentClassificationHarness()
  registered = true
}
