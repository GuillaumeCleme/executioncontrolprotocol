export {
  createHarnessOllamaEnvironment,
  createHarnessOllamaWorkflowEnvironment,
  createHarnessOllamaIntentEnvironment,
} from "./environments/harness-ollama.js"
export { createHarnessOllamaMatrixEnvironment } from "./environments/harness-ollama-matrix.js"
export { OLLAMA_GEMMA_1B_EVAL, type OllamaGemmaEvalProfile } from "./profiles/ollama-gemma.js"
export {
  EVAL_HARNESS_REPAIR,
  EVAL_HARNESS_TRACE,
  INTENT_EVAL_EXTENSIONS,
  INTENT_EVAL_HARNESS_CONFIG,
  WORKFLOW_EVAL_EXTENSIONS,
  WORKFLOW_EVAL_HARNESS_CONFIG,
  MATRIX_EVAL_EXTENSION_IDS,
  MATRIX_EVAL_HARNESS_CONFIG,
  MATRIX_INTENT_HARNESS_CONFIG,
  MATRIX_ASSISTANT_HARNESS_CONFIG,
} from "./harness-eval-config.js"
export { registerEvalHarnesses } from "./harnesses/register.js"
export {
  EVALS_WORKFLOW_AUTHORING_ID,
  EVALS_INTENT_CLASSIFICATION_ID,
  EVALS_WORKFLOW_ASSISTANT_ID,
  EVALS_WORKFLOW_AUTHORING_CAPABILITY,
  EVALS_INTENT_CLASSIFICATION_CAPABILITY,
  EVALS_WORKFLOW_ASSISTANT_CAPABILITY,
} from "./harnesses/harness-ids.js"
export {
  ollamaEvalReady,
  ollamaHasModel,
  ollamaReachable,
  type OllamaEvalReadiness,
} from "./helpers/ollama.js"
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
export { runEvalCase, runSingleEvalCase, runFlowEvalCase } from "./fixtures/run-eval-case.js"
export {
  EVAL_FIXTURES_ROOT,
  EVAL_CASES_DIR,
  resolveEvalFixturePath,
} from "./fixtures/fixtures-root.js"
