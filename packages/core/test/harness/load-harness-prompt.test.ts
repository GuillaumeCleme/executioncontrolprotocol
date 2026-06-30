import { describe, expect, it } from "vitest"
import {
  buildRepairHint,
  buildSystemPrompt,
  formatSchemaExampleEql,
  formatSchemaExampleJson,
  HARNESS_PROMPT_FIXTURE_IDS,
  loadHarnessPromptFixture,
  loadSchemaExample,
  loadSchemaExampleEql,
  loadRepairNeutralExampleEql,
} from "../../src/harness/prompts/index.js"

describe("harness prompt fixtures", () => {
  it("loads intent-classification fixture", () => {
    const fixture = loadHarnessPromptFixture(HARNESS_PROMPT_FIXTURE_IDS.INTENT_CLASSIFICATION)
    expect(fixture.fewShots?.length).toBeGreaterThanOrEqual(4)
    expect(fixture.definitions?.length).toBe(4)
    expect(fixture.promptFormat).toBe("eql")
  })

  it("schema examples contain no pipe union in JSON", () => {
    for (const schema of [
      "@executioncontrolprotocol.intent",
      "@executioncontrolprotocol.workflow",
      "@executioncontrolprotocol.patch",
      "@executioncontrolprotocol.harness.reply",
    ] as const) {
      const json = formatSchemaExampleJson(schema)
      expect(json).not.toMatch(/"\|"/)
      expect(json).not.toContain("|")
      loadSchemaExample(schema)
      expect(loadSchemaExampleEql(schema)).toMatch(/\S/)
      expect(formatSchemaExampleEql(schema)).toBe(loadSchemaExampleEql(schema))
    }
  })

  it("buildSystemPrompt uses EQL examples for intent classification", () => {
    const system = buildSystemPrompt(HARNESS_PROMPT_FIXTURE_IDS.INTENT_CLASSIFICATION)
    expect(system).toContain("INTENT workflow-create")
    expect(system).toContain("Additional examples (message -> EQL output)")
    expect(system).toContain("Reply with SQL-like EQL only")
    expect(system).toContain("no prior knowledge of EQL")
    expect(system).not.toContain("Examples (message -> JSON output)")
  })

  it("buildSystemPrompt includes patch-specific EQL primer", () => {
    const system = buildSystemPrompt(HARNESS_PROMPT_FIXTURE_IDS.WORKFLOW_AUTHORING_PATCH)
    expect(system).toContain("Here is a workflow query language called EQL")
    expect(system).toContain("UPDATE WORKFLOW")
    expect(system).toContain("UPDATE STEP")
    expect(system).toContain("ADD STEP")
    expect(system).toContain("DELETE STEP")
    expect(system).toContain("MOVE STEP")
    expect(system).toContain("Patched Echo")
    expect(system).toContain("Translated Output")
    expect(system).toContain("Updated Chain")
    expect(system).toContain("Short Summary")
    expect(system).toContain("DELETE STEP summarize")
    expect(system).toContain('WITH value = "world"')
    expect(system).toContain("Do NOT re-emit unchanged steps")
    expect(system).toContain("Examples teach syntax only")
    expect(system).not.toContain("Full operation reference")
  })

  it("buildRepairHint for patch avoids copyable eval-specific examples", () => {
    const hint = buildRepairHint(HARNESS_PROMPT_FIXTURE_IDS.WORKFLOW_AUTHORING_PATCH)
    expect(hint).toContain("PATCH WORKFLOW")
    expect(hint).not.toContain("example-wf")
    expect(hint).not.toContain("echo-test")
    expect(hint).not.toContain("Patched Echo")
    expect(hint).not.toContain("Example shape")
  })

  it("loadRepairNeutralExampleEql loads patch repair fixture", () => {
    const example = loadRepairNeutralExampleEql("@executioncontrolprotocol.patch")
    expect(example).toContain("example-wf")
    expect(example).not.toContain("echo-test")
  })

  it("buildRepairHint references valid EQL example", () => {
    const hint = buildRepairHint(HARNESS_PROMPT_FIXTURE_IDS.WORKFLOW_ASSISTANT)
    expect(hint).toContain("REPLY")
    expect(hint).toContain("ANSWER")
    expect(hint).not.toContain('"kind":"step"|')
  })

  it("buildSystemPrompt for workflow create includes unique step id rule", () => {
    const system = buildSystemPrompt(HARNESS_PROMPT_FIXTURE_IDS.WORKFLOW_AUTHORING_CREATE)
    expect(system).toContain("unique stepId")
    expect(system).toContain("poem, summarize")
    expect(system).toContain("poem-summarize")
  })

  it("workflow create few-shots use unique STEP ids", () => {
    const fixture = loadHarnessPromptFixture(HARNESS_PROMPT_FIXTURE_IDS.WORKFLOW_AUTHORING_CREATE)
    for (const shot of fixture.fewShots ?? []) {
      if (typeof shot.output !== "string") continue
      const stepIds = [...shot.output.matchAll(/^STEP\s+(\S+)\s+USES/gm)].map((m) => m[1]!)
      expect(new Set(stepIds).size, shot.message).toBe(stepIds.length)
    }
  })
})
