import { describe, expect, it } from "vitest"
import {
  buildRepairHint,
  buildSystemPrompt,
  formatSchemaExampleJson,
  HARNESS_PROMPT_FIXTURE_IDS,
  loadHarnessPromptFixture,
  loadSchemaExample,
} from "../../src/harness/prompts/index.js"

describe("harness prompt fixtures", () => {
  it("loads intent-classification fixture", () => {
    const fixture = loadHarnessPromptFixture(HARNESS_PROMPT_FIXTURE_IDS.INTENT_CLASSIFICATION)
    expect(fixture.fewShots?.length).toBeGreaterThanOrEqual(4)
    expect(fixture.definitions?.length).toBe(4)
  })

  it("schema examples contain no pipe union in JSON", () => {
    for (const schema of [
      "@ecp.intent",
      "@ecp.workflow",
      "@ecp.patch",
      "@ecp.harness.reply",
    ] as const) {
      const json = formatSchemaExampleJson(schema)
      expect(json).not.toMatch(/"\|"/)
      expect(json).not.toContain("|")
      loadSchemaExample(schema)
    }
  })

  it("buildSystemPrompt has no pipe inside JSON example line", () => {
    const system = buildSystemPrompt(HARNESS_PROMPT_FIXTURE_IDS.INTENT_CLASSIFICATION)
    const exampleLine = system
      .split("\n")
      .find((line) => line.startsWith("Example output"))
    expect(exampleLine).toBeDefined()
    expect(exampleLine).not.toMatch(/intent":"[^"]*\|/)
    expect(system).toContain("workflow-create")
    expect(system).toContain("Examples (message -> JSON output)")
  })

  it("buildRepairHint references valid example JSON", () => {
    const hint = buildRepairHint(HARNESS_PROMPT_FIXTURE_IDS.WORKFLOW_ASSISTANT)
    expect(hint).toContain("@ecp.harness.reply")
    expect(hint).not.toContain('"kind":"step"|')
  })
})
