import { describe, expect, it } from "vitest"
import { countOllamaEvalCases, loadEvalCases, loadHarnessRunFixture } from "../../src/fixtures/load-eval-cases.js"
import { EVAL_SUITE_VALUES } from "../../src/fixtures/eval-case-schema.js"

describe("loadEvalCases", () => {
  it("loads 52 cases across suites", () => {
    expect(loadEvalCases().length).toBe(52)
    expect(countOllamaEvalCases()).toBe(52)
  })

  it("loads workflow-create suite", () => {
    const cases = loadEvalCases({ suite: EVAL_SUITE_VALUES.WORKFLOW_CREATE })
    expect(cases.length).toBe(12)
  })

  it("loads harness run fixture", () => {
    const ctx = loadHarnessRunFixture("failed-echo-step.json")
    expect(ctx.run.run.status).toBe("failed")
  })
})
