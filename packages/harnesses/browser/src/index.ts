/**
 * Unified harness (`@ecp/harness-browser`): workflow authoring, intent, assistant.
 * Used by browser demo and `@ecp/evals` matrix tests.
 * @category Harness
 */
export {
  BROWSER_HARNESS_ID,
  BROWSER_HARNESS_CAPABILITY,
  EVALS_HARNESS_ID,
  EVALS_HARNESS_CAPABILITY,
} from "./harness-ids.js"

export {
  registerBrowserHarnesses,
  registerEvalHarnesses,
  resetHarnessRegistrationForTests,
  resetEvalHarnessesRegistrationForTests,
} from "./register.js"

export {
  HARNESS_TASKS,
  EVAL_HARNESS_TASKS,
  EVAL_HARNESS_REPAIR,
  EVAL_HARNESS_TRACE,
  HARNESS_MATRIX_BINDING,
  EVAL_MATRIX_HARNESS_BINDING,
  HARNESS_BROWSER_DEMO_BINDING,
  getHarnessMatrixConfig,
  getEvalMatrixHarnessConfig,
  type HarnessTask,
  type EvalHarnessTask,
  type HarnessProfile,
} from "./harness-matrix-config.js"

export type { BrowserHarnessInput } from "./browser-harness.js"
