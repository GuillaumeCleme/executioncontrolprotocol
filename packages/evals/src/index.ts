export {
  createHarnessOllamaEnvironment,
  createHarnessOllamaWorkflowEnvironment,
  createHarnessOllamaIntentEnvironment,
} from "./environments/harness-ollama.js"
export { createHarnessOllamaMatrixEnvironment } from "./environments/harness-ollama-matrix.js"
export { createHarnessOllamaCodingMatrixEnvironment } from "./environments/harness-ollama-coding-matrix.js"
export { createHarnessNodeCodingMatrixEnvironment } from "./environments/create-harness-node-coding-matrix-environment.js"
export { createHarnessChromeMatrixEnvironment } from "./environments/harness-chrome-matrix.js"
export { createHarnessMatrixEnvironment } from "./environments/create-harness-matrix-environment.js"
export { createHarnessBrowserMatrixEnvironment } from "./environments/create-harness-browser-matrix-environment.js"
export { createHarnessNodeMatrixEnvironment } from "./environments/create-harness-node-matrix-environment.js"
export { OLLAMA_GEMMA_1B_EVAL, OLLAMA_GEMMA_1B_BASE_URL, type OllamaGemmaEvalProfile } from "./profiles/ollama-gemma.js"
export {
  OLLAMA_QWEN_CODER_15B_EVAL,
  OLLAMA_QWEN_CODER_15B_BASE_URL,
  type OllamaQwenCoderEvalProfile,
} from "./profiles/ollama-qwen.js"
export { CHROME_NANO_EVAL } from "./profiles/chrome-nano.js"
export type { EvalProviderProfile } from "./profiles/eval-provider.js"
export {
  getActiveEvalProvider,
  setActiveEvalProvider,
  resetActiveEvalProvider,
} from "./profiles/eval-provider-context.js"
export {
  HARNESS_NANO_REPAIR,
  HARNESS_NANO_TRACE,
  INTENT_EVAL_EXTENSIONS,
  INTENT_EVAL_HARNESS_CONFIG,
  WORKFLOW_EVAL_EXTENSIONS,
  WORKFLOW_EVAL_HARNESS_CONFIG,
  MATRIX_EVAL_EXTENSION_IDS,
  MATRIX_EVAL_HARNESS_CONFIG,
  MATRIX_INTENT_HARNESS_CONFIG,
  MATRIX_ASSISTANT_HARNESS_CONFIG,
} from "./harness-eval-config.js"
export {
  BROWSER_NANO_HARNESS_ID,
  BROWSER_NANO_HARNESS_CAPABILITY,
  HARNESS_TASKS,
  registerBrowserNanoHarnesses,
  resetBrowserNanoHarnessRegistrationForTests,
  type HarnessTask,
} from "./harness-bindings.js"
export {
  BROWSER_CODING_HARNESS_ID,
  BROWSER_CODING_HARNESS_CAPABILITY,
  registerBrowserCodingHarnesses,
  resetBrowserCodingHarnessRegistrationForTests,
  HARNESS_CODING_BINDING,
  HARNESS_CODING_REPAIR,
  HARNESS_CODING_TRACE,
  getHarnessCodingConfig,
} from "./harness-coding-bindings.js"
export {
  ollamaEvalReady,
  ollamaHasModel,
  ollamaReachable,
  type OllamaEvalReadiness,
} from "./helpers/ollama.js"
export { ollamaQwenEvalReady } from "./helpers/ollama-qwen.js"
export {
  chromeNanoEvalReady,
  type ChromeNanoEvalReadiness,
} from "./helpers/chrome-ai.js"
export {
  EVAL_SUITE_VALUES,
  EVAL_HARNESS_NAMES,
  evalCaseSchema,
  type EvalCase,
  type EvalSuite,
  type SingleEvalCase,
  type FlowEvalCase,
  type DeterministicAssertion,
  type JudgeAssertion,
  isFlowEvalCase,
} from "./fixtures/eval-case-schema.js"
export {
  loadEvalCases,
  loadWorkflowFixture,
  loadHarnessRunFixture,
  resolveSingleEvalCaseInput,
  countOllamaEvalCases,
  type LoadEvalCasesOptions,
} from "./fixtures/load-eval-cases.js"
export { runEvalCase, runSingleEvalCase, runFlowEvalCase, type RunEvalCaseOptions } from "./fixtures/run-eval-case.js"
export {
  evalDebugMode,
  isEvalDebugEnabled,
  isEvalTimingDebugEnabled,
  describeAssertionExpectation,
  extractAssertionActual,
  logEvalCaseContext,
  logEvalCaseInvoke,
  logEvalCaseTiming,
  logEvalAssertionMismatch,
  evalDebugContextFromCase,
} from "./fixtures/eval-debug.js"
export { formatHarnessTrace, formatInvokeFailure } from "./fixtures/harness-trace-format.js"
export {
  EVAL_FIXTURES_ROOT,
  EVAL_CASES_DIR,
  resolveEvalFixturePath,
} from "./fixtures/fixtures-root.js"

