import { describe, expect, it } from "vitest"
import {
  selectBestWorkflowEqlBlock,
  takeFirstWorkflowEqlBlock,
} from "../../src/harness/authoring/normalize-create-eql-output.js"

describe("takeFirstWorkflowEqlBlock", () => {
  it("keeps only the first WORKFLOW block", () => {
    const raw = [
      'WORKFLOW echo-summarize "Echo summarize"',
      "STEP echo USES @executioncontrolprotocol/test.echo",
      'WORKFLOW echo-notify "Echo and notify"',
      "STEP notify USES @executioncontrolprotocol/demo.notify",
    ].join("\n")
    const trimmed = takeFirstWorkflowEqlBlock(raw)
    expect(trimmed).toContain("echo-summarize")
    expect(trimmed).not.toContain("echo-notify")
  })
})

describe("selectBestWorkflowEqlBlock", () => {
  it("picks the block that matches required capabilities", () => {
    const raw = [
      'WORKFLOW two-step-translate "Echo translate"',
      "STEP echo USES @executioncontrolprotocol/test.echo",
      "STEP translate USES @executioncontrolprotocol/demo.translate",
      'WORKFLOW echo-summarize "Echo summarize"',
      "STEP echo USES @executioncontrolprotocol/test.echo",
      "STEP summarize USES @executioncontrolprotocol/demo.summarize",
    ].join("\n")
    const best = selectBestWorkflowEqlBlock(raw, [
      "@executioncontrolprotocol/test.echo",
      "@executioncontrolprotocol/demo.summarize",
    ])
    expect(best).toContain("echo-summarize")
    expect(best).not.toContain("translate")
  })
})

describe("filterWorkflowEqlToRequiredCapabilities", () => {
  it("removes extra STEP blocks when all required capabilities are present", async () => {
    const { filterWorkflowEqlToRequiredCapabilities } = await import(
      "../../src/harness/authoring/normalize-create-eql-output.js"
    )
    const raw = [
      'WORKFLOW echo-workflow "Echo workflow"',
      "STEP echo USES @executioncontrolprotocol/test.echo",
      "  LABEL \"Echo\"",
      "  AS echo",
      "STEP generate USES @executioncontrolprotocol/demo.generate",
      "  LABEL \"Generate\"",
      "  AS generate",
      "STEP summarize USES @executioncontrolprotocol/demo.summarize",
      "  LABEL \"Summarize\"",
      "  AS summarize",
    ].join("\n")
    const filtered = filterWorkflowEqlToRequiredCapabilities(raw, [
      "@executioncontrolprotocol/test.echo",
      "@executioncontrolprotocol/demo.summarize",
    ])
    expect((filtered.match(/^STEP /gm) ?? []).length).toBe(2)
    expect(filtered).not.toContain("demo.generate")
  })
})
