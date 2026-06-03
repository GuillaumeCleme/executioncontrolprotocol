/**
 * Per-task harness binding defaults (shared repair/trace; task-specific output/context).
 * @category Harness
 */
export const EVAL_HARNESS_TRACE = {
  includePrompt: true,
  includeRawOutput: true,
  includeValidation: true,
} as const

export const EVAL_HARNESS_REPAIR = {
  enabled: true,
  maxAttempts: 3,
  includeValidationErrors: true,
} as const

const SHARED_CONTEXT = {
  includeEnvironmentDescriptor: true,
  includeEncodedDescriptor: false,
  descriptorFormat: "@ecp/format-eql",
} as const

/** Harness task ids (match {@link EVAL_HARNESS_NAMES} in `@ecp/evals`). */
export const HARNESS_TASKS = {
  WORKFLOW_AUTHORING: "workflow-authoring",
  INTENT_CLASSIFICATION: "intent-classification",
  WORKFLOW_ASSISTANT: "workflow-assistant",
} as const

/** @deprecated Use {@link HARNESS_TASKS} */
export const EVAL_HARNESS_TASKS = HARNESS_TASKS

export type HarnessTask = (typeof HARNESS_TASKS)[keyof typeof HARNESS_TASKS]

/** @deprecated Use {@link HarnessTask} */
export type EvalHarnessTask = HarnessTask

/** Binding profile: Ollama matrix vs browser demo UI. */
export type HarnessProfile = "matrix" | "browser-demo"

const MATRIX_INTENT = {
  promptFixture: "intent-classification",
  output: { schema: "@ecp.intent", format: "@ecp/format-eql", validate: true },
  context: { ...SHARED_CONTEXT },
  repair: EVAL_HARNESS_REPAIR,
  trace: EVAL_HARNESS_TRACE,
} as const

const MATRIX_WORKFLOW = {
  output: { schema: "@ecp.workflow", format: "@ecp/format-eql", validate: true },
  context: {
    ...SHARED_CONTEXT,
    includeRunContext: true,
    runContextFormat: "@ecp/format-json",
  },
  repair: EVAL_HARNESS_REPAIR,
  trace: EVAL_HARNESS_TRACE,
} as const

const MATRIX_ASSISTANT = {
  promptFixture: "workflow-assistant",
  output: { schema: "@ecp.harness.reply", format: "@ecp/format-eql", validate: true },
  context: {
    ...SHARED_CONTEXT,
    includeRunContext: true,
    runContextFormat: "@ecp/format-json",
  },
  repair: { ...EVAL_HARNESS_REPAIR, safeReplyFallback: true },
  trace: EVAL_HARNESS_TRACE,
} as const

/** Full harness binding config for a task (matrix or browser-demo profile). */
export function getHarnessMatrixConfig(
  task: HarnessTask,
  profile: HarnessProfile = "matrix"
): Record<string, unknown> {
  if (profile === "browser-demo") {
    return getHarnessMatrixConfig(task, "matrix")
  }
  switch (task) {
    case HARNESS_TASKS.INTENT_CLASSIFICATION:
      return { ...MATRIX_INTENT }
    case HARNESS_TASKS.WORKFLOW_AUTHORING:
      return { ...MATRIX_WORKFLOW }
    case HARNESS_TASKS.WORKFLOW_ASSISTANT:
      return { ...MATRIX_ASSISTANT }
    default:
      return { ...MATRIX_WORKFLOW }
  }
}

/** @deprecated Use {@link getHarnessMatrixConfig} */
export const getEvalMatrixHarnessConfig = getHarnessMatrixConfig

/** Loose env binding for matrix eval environments. */
export const HARNESS_MATRIX_BINDING = {
  harnessProfile: "matrix" as HarnessProfile,
  repair: EVAL_HARNESS_REPAIR,
  trace: EVAL_HARNESS_TRACE,
  context: SHARED_CONTEXT,
} as const

/** @deprecated Use {@link HARNESS_MATRIX_BINDING} */
export const EVAL_MATRIX_HARNESS_BINDING = HARNESS_MATRIX_BINDING

/** Loose env binding for browser demo (same matrix harness profile; provider swapped at invoke). */
export const HARNESS_BROWSER_DEMO_BINDING = {
  harnessProfile: "matrix" as HarnessProfile,
  repair: EVAL_HARNESS_REPAIR,
  trace: EVAL_HARNESS_TRACE,
  context: SHARED_CONTEXT,
} as const
