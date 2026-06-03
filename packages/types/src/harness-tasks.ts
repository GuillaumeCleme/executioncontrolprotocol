import { z } from "zod"
import { harnessRunContextSchema } from "./harness-run-context.js"

/** Shared harness task ids for browser and third-party harnesses. @category Harness */
export const HARNESS_TASK_IDS = {
  WORKFLOW_AUTHORING: "workflow-authoring",
  INTENT_CLASSIFICATION: "intent-classification",
  WORKFLOW_ASSISTANT: "workflow-assistant",
} as const

/** Harness task id union. @category Harness */
export type HarnessTaskId = (typeof HARNESS_TASK_IDS)[keyof typeof HARNESS_TASK_IDS]

/** Intent classification harness input. @category Harness */
export const harnessIntentClassificationInputSchema = z.object({
  /** User message to classify. */
  message: z.string(),
  /** Optional model override. */
  model: z.string().optional(),
})

/** Workflow authoring harness input. @category Harness */
export const harnessWorkflowAuthoringInputSchema = z.object({
  /** Authoring request text. */
  request: z.string(),
  /** Baseline manifest for patch mode. */
  manifest: z.unknown().optional(),
  /** Optional model override. */
  model: z.string().optional(),
})

/** Unified workflow assistant harness input. @category Harness */
export const harnessWorkflowAssistantInputSchema = z.object({
  /** User message. */
  message: z.string(),
  /** Optional model override. */
  model: z.string().optional(),
  /** Optional run context for run-aware Q&A. */
  runContext: harnessRunContextSchema.optional(),
  /** Optional workflow manifest summary context. */
  workflow: z.record(z.string(), z.unknown()).optional(),
})

/** Intent classification input type. @category Harness */
export type HarnessIntentClassificationInput = z.infer<
  typeof harnessIntentClassificationInputSchema
>

/** Workflow authoring input type. @category Harness */
export type HarnessWorkflowAuthoringInput = z.infer<typeof harnessWorkflowAuthoringInputSchema>

/** Workflow assistant input type. @category Harness */
export type HarnessWorkflowAssistantInput = z.infer<typeof harnessWorkflowAssistantInputSchema>
