import { z } from "zod"

/** Few-shot row in a harness prompt fixture. @category Harness */
export const harnessPromptFewShotSchema = z.object({
  message: z.string(),
  output: z.record(z.string(), z.unknown()),
})

/** Intent definition row in a harness prompt fixture. @category Harness */
export const harnessPromptDefinitionSchema = z.object({
  intent: z.string(),
  when: z.string(),
})

/** Harness prompt fixture file shape. @category Harness */
export const harnessPromptFixtureSchema = z.object({
  id: z.string(),
  role: z.string(),
  task: z.string(),
  outputSchema: z.string(),
  allowedValues: z.record(z.string(), z.array(z.string())).optional(),
  definitions: z.array(harnessPromptDefinitionSchema).optional(),
  fewShots: z.array(harnessPromptFewShotSchema).optional(),
  repairHint: z.string().optional(),
})

/** Parsed harness prompt fixture. @category Harness */
export type HarnessPromptFixture = z.infer<typeof harnessPromptFixtureSchema>

/** Known harness prompt fixture ids. @category Harness */
export const HARNESS_PROMPT_FIXTURE_IDS = {
  INTENT_CLASSIFICATION: "intent-classification",
  WORKFLOW_AUTHORING_CREATE: "workflow-authoring-create",
  WORKFLOW_AUTHORING_PATCH: "workflow-authoring-patch",
  WORKFLOW_ASSISTANT: "workflow-assistant",
} as const

/** Harness prompt fixture id union. @category Harness */
export type HarnessPromptFixtureId =
  (typeof HARNESS_PROMPT_FIXTURE_IDS)[keyof typeof HARNESS_PROMPT_FIXTURE_IDS]
