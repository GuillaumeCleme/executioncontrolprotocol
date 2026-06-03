import { describe, expect, it } from "vitest"
import { buildSystemPrompt, HARNESS_PROMPT_FIXTURE_IDS } from "@ecp/core"

/** Per-task character budget for 1B harness system prompts (identity + EQL primer + few-shots). */
const SYSTEM_PROMPT_CHAR_BUDGET: Record<string, number> = {
  [HARNESS_PROMPT_FIXTURE_IDS.INTENT_CLASSIFICATION]: 12_000,
  [HARNESS_PROMPT_FIXTURE_IDS.WORKFLOW_AUTHORING_CREATE]: 14_000,
  [HARNESS_PROMPT_FIXTURE_IDS.WORKFLOW_AUTHORING_PATCH]: 14_000,
  [HARNESS_PROMPT_FIXTURE_IDS.WORKFLOW_ASSISTANT]: 12_000,
}

describe("buildSystemPrompt size guardrail", () => {
  for (const [fixtureId, budget] of Object.entries(SYSTEM_PROMPT_CHAR_BUDGET)) {
    it(`${fixtureId} stays under ${budget} characters`, () => {
      const prompt = buildSystemPrompt(fixtureId)
      expect(prompt.length).toBeLessThanOrEqual(budget)
    })
  }
})
