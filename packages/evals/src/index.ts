export {
  createHarnessOllamaEnvironment,
  createHarnessOllamaWorkflowEnvironment,
  createHarnessOllamaIntentEnvironment,
} from "./environments/harness-ollama.js"
export { OLLAMA_GEMMA_1B_EVAL, type OllamaGemmaEvalProfile } from "./profiles/ollama-gemma.js"
export {
  EVAL_HARNESS_REPAIR,
  EVAL_HARNESS_TRACE,
  INTENT_EVAL_EXTENSIONS,
  INTENT_EVAL_HARNESS_CONFIG,
  WORKFLOW_EVAL_EXTENSIONS,
  WORKFLOW_EVAL_HARNESS_CONFIG,
} from "./harness-eval-config.js"
export { registerEvalHarnesses } from "./harnesses/register.js"
export {
  EVALS_WORKFLOW_AUTHORING_ID,
  EVALS_INTENT_CLASSIFICATION_ID,
  EVALS_WORKFLOW_AUTHORING_CAPABILITY,
  EVALS_INTENT_CLASSIFICATION_CAPABILITY,
} from "./harnesses/harness-ids.js"
export {
  ollamaEvalReady,
  ollamaHasModel,
  ollamaReachable,
  type OllamaEvalReadiness,
} from "./helpers/ollama.js"
