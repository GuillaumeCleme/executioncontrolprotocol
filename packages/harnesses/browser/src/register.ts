import { registerBrowserHarness } from "./browser-harness.js"

let registered = false

/** Register the unified harness in the global catalog. @category Harness */
export function registerBrowserHarnesses(): void {
  if (registered) return
  registerBrowserHarness()
  registered = true
}

/** @deprecated Use {@link registerBrowserHarnesses} */
export const registerEvalHarnesses = registerBrowserHarnesses

/** Reset harness registration (tests). @internal */
export function resetHarnessRegistrationForTests(): void {
  registered = false
}

/** @deprecated Use {@link resetHarnessRegistrationForTests} */
export const resetEvalHarnessesRegistrationForTests = resetHarnessRegistrationForTests
