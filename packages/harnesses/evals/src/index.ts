/**
 * @deprecated Import from `@ecp/harnesses-browser` instead.
 * Re-exports the unified `@ecp/harness-browser` harness for `@ecp/evals` compatibility.
 */
export {
  BROWSER_HARNESS_ID as EVALS_HARNESS_ID,
  BROWSER_HARNESS_CAPABILITY as EVALS_HARNESS_CAPABILITY,
  HARNESS_TASKS as EVAL_HARNESS_TASKS,
  EVAL_HARNESS_REPAIR,
  EVAL_HARNESS_TRACE,
  HARNESS_MATRIX_BINDING as EVAL_MATRIX_HARNESS_BINDING,
  getHarnessMatrixConfig as getEvalMatrixHarnessConfig,
  registerBrowserHarnesses as registerEvalHarnesses,
  resetHarnessRegistrationForTests as resetEvalHarnessesRegistrationForTests,
  type HarnessTask as EvalHarnessTask,
  type BrowserHarnessInput as EvalHarnessInput,
} from "@ecp/harnesses-browser"
