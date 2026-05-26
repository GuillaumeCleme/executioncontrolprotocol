/**
 * Shared harness binding config for `@ecp/evals` (trace + context).
 * @category Evals
 */
export const EVAL_HARNESS_TRACE = {
  includePrompt: true,
  includeRawOutput: true,
  includeValidation: true,
} as const

/** Repair loop defaults for Ollama evals (model sees paths + messages on retry). */
export const EVAL_HARNESS_REPAIR = {
  enabled: true,
  maxAttempts: 3,
  includeValidationErrors: true,
} as const

/**
 * Intent classification harness config aligned with {@link INTENT_EVAL_EXTENSIONS}.
 * @category Evals
 */
export const INTENT_EVAL_HARNESS_CONFIG = {
  output: { schema: "@ecp.intent", format: "@ecp/format-json", validate: true },
  context: {
    includeEnvironmentDescriptor: true,
    includeEncodedDescriptor: false,
    descriptorFormat: "@ecp/format-toon",
  },
  repair: EVAL_HARNESS_REPAIR,
  trace: EVAL_HARNESS_TRACE,
} as const

/**
 * Workflow authoring harness config aligned with {@link WORKFLOW_EVAL_EXTENSIONS}.
 * @category Evals
 */
export const WORKFLOW_EVAL_HARNESS_CONFIG = {
  output: { schema: "@ecp.workflow", format: "@ecp/format-json", validate: true },
  context: {
    includeEnvironmentDescriptor: true,
    includeEncodedDescriptor: false,
    descriptorFormat: "@ecp/format-toon",
  },
  repair: EVAL_HARNESS_REPAIR,
  trace: EVAL_HARNESS_TRACE,
} as const

/** Extension ids bound in workflow eval environments. @category Evals */
export const WORKFLOW_EVAL_EXTENSIONS = ["@ecp/format-toon", "@ecp/test"] as const

/** Extension ids bound in intent eval environments (same ops surface as workflow). @category Evals */
export const INTENT_EVAL_EXTENSIONS = ["@ecp/format-toon", "@ecp/test"] as const

/** Extension ids bound in Ollama matrix eval environments (binding order). @category Evals */
export const MATRIX_EVAL_EXTENSION_IDS = [
  "@ecp/format-toon",
  "@ecp/format-json",
  "@ecp/test",
  "@ecp/demo",
] as const

/** Shared matrix harness binding config. @category Evals */
export const MATRIX_EVAL_HARNESS_CONFIG = {
  output: { schema: "@ecp.workflow", format: "@ecp/format-json", validate: true },
  context: {
    includeEnvironmentDescriptor: true,
    includeEncodedDescriptor: false,
    descriptorFormat: "@ecp/format-toon",
    includeRunContext: true,
    runContextFormat: "@ecp/format-json",
  },
  repair: EVAL_HARNESS_REPAIR,
  trace: EVAL_HARNESS_TRACE,
} as const

/** Intent harness config for matrix environment. @category Evals */
export const MATRIX_INTENT_HARNESS_CONFIG = {
  ...INTENT_EVAL_HARNESS_CONFIG,
} as const

/** Assistant harness config for matrix environment. @category Evals */
export const MATRIX_ASSISTANT_HARNESS_CONFIG = {
  promptFixture: "workflow-assistant",
  context: {
    includeEnvironmentDescriptor: true,
    includeEncodedDescriptor: false,
    descriptorFormat: "@ecp/format-toon",
    includeRunContext: true,
    runContextFormat: "@ecp/format-json",
  },
  output: { schema: "@ecp.harness.reply", format: "@ecp/format-json", validate: true },
  repair: EVAL_HARNESS_REPAIR,
  trace: EVAL_HARNESS_TRACE,
} as const
