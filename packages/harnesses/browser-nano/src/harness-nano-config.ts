/**
 * Per-task Browser Nano harness binding defaults (shared repair/trace; task-specific output/context).
 * Single EQL output surface for eval matrix and browser demo — provider is hot-swapped at invoke.
 * @category Harness
 */
export const HARNESS_NANO_TRACE = {
  includePrompt: true,
  includeRawOutput: true,
  includeValidation: true,
} as const

export const HARNESS_NANO_REPAIR = {
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

export type HarnessTask = (typeof HARNESS_TASKS)[keyof typeof HARNESS_TASKS]

const NANO_INTENT = {
  promptFixture: "intent-classification",
  output: { schema: "@ecp.intent", format: "@ecp/format-eql", validate: true },
  context: { ...SHARED_CONTEXT },
  repair: HARNESS_NANO_REPAIR,
  trace: HARNESS_NANO_TRACE,
} as const

const NANO_WORKFLOW = {
  output: { schema: "@ecp.workflow", format: "@ecp/format-eql", validate: true },
  context: {
    ...SHARED_CONTEXT,
    includeRunContext: true,
    runContextFormat: "@ecp/format-json",
  },
  repair: HARNESS_NANO_REPAIR,
  trace: HARNESS_NANO_TRACE,
} as const

const NANO_ASSISTANT = {
  promptFixture: "workflow-assistant",
  output: { schema: "@ecp.harness.reply", format: "@ecp/format-eql", validate: true },
  context: {
    ...SHARED_CONTEXT,
    includeRunContext: true,
    runContextFormat: "@ecp/format-json",
  },
  repair: { ...HARNESS_NANO_REPAIR, safeReplyFallback: true },
  trace: HARNESS_NANO_TRACE,
} as const

/** Full harness binding config for a task (EQL outputs for all nano tasks). */
export function getHarnessNanoConfig(task: HarnessTask): Record<string, unknown> {
  switch (task) {
    case HARNESS_TASKS.INTENT_CLASSIFICATION:
      return { ...NANO_INTENT }
    case HARNESS_TASKS.WORKFLOW_AUTHORING:
      return { ...NANO_WORKFLOW }
    case HARNESS_TASKS.WORKFLOW_ASSISTANT:
      return { ...NANO_ASSISTANT }
    default:
      return { ...NANO_WORKFLOW }
  }
}

/** Loose env binding for nano eval matrix environments. */
export const HARNESS_NANO_BINDING = {
  repair: HARNESS_NANO_REPAIR,
  trace: HARNESS_NANO_TRACE,
  context: SHARED_CONTEXT,
} as const

/**
 * Browser demo uses the same harness binding as eval matrix tests.
 * Only the model provider (`.uses(...)` at invoke) differs in the demo app.
 */
export const HARNESS_BROWSER_NANO_DEMO_BINDING = HARNESS_NANO_BINDING
