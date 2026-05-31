/**
 * Shared harness binding config for `@ecp/evals` (trace + context).
 * Matrix task configs live in `@ecp/harnesses-evals`.
 * @category Evals
 */
import {
  EVAL_HARNESS_REPAIR,
  EVAL_HARNESS_TASKS,
  EVAL_HARNESS_TRACE,
  EVAL_MATRIX_HARNESS_BINDING,
  getEvalMatrixHarnessConfig,
} from "@ecp/harnesses-evals"

export {
  EVAL_HARNESS_REPAIR,
  EVAL_HARNESS_TRACE,
  EVAL_HARNESS_TASKS,
  EVAL_MATRIX_HARNESS_BINDING,
  getEvalMatrixHarnessConfig,
}

/**
 * Intent classification harness config aligned with {@link INTENT_EVAL_EXTENSIONS}.
 * @category Evals
 */
export const INTENT_EVAL_HARNESS_CONFIG = getEvalMatrixHarnessConfig(
  EVAL_HARNESS_TASKS.INTENT_CLASSIFICATION
)

/**
 * Workflow authoring harness config aligned with {@link WORKFLOW_EVAL_EXTENSIONS}.
 * @category Evals
 */
export const WORKFLOW_EVAL_HARNESS_CONFIG = getEvalMatrixHarnessConfig(
  EVAL_HARNESS_TASKS.WORKFLOW_AUTHORING
)

/** Extension ids bound in workflow eval environments. @category Evals */
export const WORKFLOW_EVAL_EXTENSIONS = ["@ecp/format-toon", "@ecp/format-eql", "@ecp/test"] as const

/** Extension ids bound in intent eval environments (same ops surface as workflow). @category Evals */
export const INTENT_EVAL_EXTENSIONS = ["@ecp/format-toon", "@ecp/format-eql", "@ecp/test"] as const

/** Extension ids bound in Ollama matrix eval environments (binding order). @category Evals */
export const MATRIX_EVAL_EXTENSION_IDS = [
  "@ecp/format-toon",
  "@ecp/format-eql",
  "@ecp/format-json",
  "@ecp/test",
  "@ecp/demo",
] as const

/** Intent harness config for matrix environment. @category Evals */
export const MATRIX_INTENT_HARNESS_CONFIG = getEvalMatrixHarnessConfig(
  EVAL_HARNESS_TASKS.INTENT_CLASSIFICATION
)

/** Workflow harness config for matrix environment. @category Evals */
export const MATRIX_EVAL_HARNESS_CONFIG = getEvalMatrixHarnessConfig(
  EVAL_HARNESS_TASKS.WORKFLOW_AUTHORING
)

/** Assistant harness config for matrix environment. @category Evals */
export const MATRIX_ASSISTANT_HARNESS_CONFIG = getEvalMatrixHarnessConfig(
  EVAL_HARNESS_TASKS.WORKFLOW_ASSISTANT
)
