import { describe, expect, it } from "vitest"
import type { HarnessOperationFeedback } from "@executioncontrolprotocol/types"
import {
  formatFeedbackForModel,
  formatStructuredRepairForModel,
  formatModelRepairDialogLines,
  truncatePriorModelOutput,
  HARNESS_REPAIR_PRIOR_OUTPUT_MAX_CHARS,
  isRepairTemplateEcho,
  isRepairFeedbackEcho,
} from "../../src/harness/authoring/presentation.js"

const feedback: HarnessOperationFeedback[] = [
  {
    operation: "validate",
    issues: [
      { severity: "error", code: "INVALID_TYPE", message: "Required", path: "schema" },
      { severity: "error", message: "Missing uses" },
    ],
  } as unknown as HarnessOperationFeedback,
]

describe("formatFeedbackForModel", () => {
  it("formats issues with path and code", () => {
    const text = formatFeedbackForModel(feedback)
    expect(text).toContain("schema: Required [INVALID_TYPE]")
    expect(text).toContain("Missing uses")
  })

  it("returns undefined when there are no issues", () => {
    expect(formatFeedbackForModel([])).toBeUndefined()
  })
})

describe("formatStructuredRepairForModel", () => {
  it("produces a bulleted repair instruction block", () => {
    const text = formatStructuredRepairForModel(feedback)
    expect(text).toContain("Fix the document")
    expect(text).toContain("- schema: Required (INVALID_TYPE)")
  })

  it("returns undefined when there are no issues", () => {
    expect(formatStructuredRepairForModel([])).toBeUndefined()
  })
})

describe("truncatePriorModelOutput", () => {
  it("truncates long prior output with a marker", () => {
    const raw = "x".repeat(HARNESS_REPAIR_PRIOR_OUTPUT_MAX_CHARS + 50)
    const truncated = truncatePriorModelOutput(raw)
    expect(truncated).toContain("... [truncated]")
    expect(truncated.length).toBeLessThan(raw.length)
  })
})

describe("formatModelRepairDialogLines", () => {
  it("includes prior output block when enabled", () => {
    const lines = formatModelRepairDialogLines({
      includePriorOutput: true,
      priorRaw: "INTENT faq",
      repairFeedback: "- intent: invalid",
      repairHint: "Return corrected EQL only.",
      repairLead: "Previous attempt failed. Fix these issues and return corrected EQL only:",
    })
    expect(lines.join("\n")).toContain("--- Your previous output")
    expect(lines.join("\n")).toContain("INTENT faq")
    expect(lines.join("\n")).toContain("Follow-up:")
  })

  it("omits prior output block when disabled", () => {
    const lines = formatModelRepairDialogLines({
      includePriorOutput: false,
      priorRaw: "INTENT faq",
      repairFeedback: "- intent: invalid",
      repairLead: "Previous attempt failed.",
    })
    expect(lines.join("\n")).not.toContain("--- Your previous output")
    expect(lines[0]).toBe("Previous attempt failed.")
  })
})

describe("isRepairTemplateEcho", () => {
  it("detects copied repair-template placeholders", () => {
    expect(isRepairTemplateEcho("WORKFLOW example-wf STEP example-step")).toBe(true)
  })

  it("passes real documents", () => {
    expect(isRepairTemplateEcho('{"schema":"@executioncontrolprotocol.workflow"}')).toBe(false)
  })
})

describe("isRepairFeedbackEcho", () => {
  it("flags output that echoes the formatted feedback verbatim", () => {
    const formatted = "schema: Required; steps: Required"
    expect(isRepairFeedbackEcho(formatted, formatted)).toBe(true)
  })

  it("does not flag a genuine JSON document", () => {
    expect(isRepairFeedbackEcho('{"schema":"@executioncontrolprotocol.workflow","version":"1.0"}')).toBe(false)
  })

  it("flags repair-hint prose echoed as PATCH output", () => {
    expect(
      isRepairFeedbackEcho(
        'PATCH WORKFLOW with the workflow id from the user prompt. Use UPDATE STEP echo with LABEL "Patched Echo".'
      )
    ).toBe(true)
  })

  it("flags multiple WORKFLOW documents in one response", () => {
    expect(
      isRepairFeedbackEcho(
        'WORKFLOW echo-summarize "Echo summarize"\nSTEP echo USES @executioncontrolprotocol/test.echo\nWORKFLOW echo-notify "Echo and notify"'
      )
    ).toBe(true)
  })

  it("accepts a valid PATCH WORKFLOW opener", () => {
    expect(
      isRepairFeedbackEcho('PATCH WORKFLOW echo-test\nUPDATE STEP echo\n  LABEL "Patched Echo"')
    ).toBe(false)
  })

  it("flags intent validation prose echoed without INTENT header", () => {
    expect(
      isRepairFeedbackEcho(
        "INTIntent workflow-patch intent must be one of: faq, workflow-create, workflow-patch, assistant"
      )
    ).toBe(true)
  })
})
