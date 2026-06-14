import { describe, expect, it } from "vitest"
import {
  normalizePatchEqlRawOutput,
  substitutePatchRepairTemplate,
} from "@executioncontextprotocol/core"

describe("normalizePatchEqlRawOutput", () => {
  it("prepends PATCH WORKFLOW when the header is missing", () => {
    const raw = `DELETE STEP summarize
ADD STEP translate USES @executioncontextprotocol/demo.translate AFTER echo
  LABEL "Translate"`
    expect(normalizePatchEqlRawOutput(raw, "two-step-chain")).toBe(
      `PATCH WORKFLOW two-step-chain
DELETE STEP summarize
ADD STEP translate USES @executioncontextprotocol/demo.translate AFTER echo
  LABEL "Translate"`
    )
  })

  it("leaves output unchanged when PATCH WORKFLOW is already present", () => {
    const raw = "PATCH WORKFLOW echo-test\nDELETE STEP notify"
    expect(normalizePatchEqlRawOutput(raw, "two-step-chain")).toBe(
      "PATCH WORKFLOW two-step-chain\nDELETE STEP notify"
    )
  })

  it("corrects wrong PATCH WORKFLOW id to the baseline workflow id", () => {
    const raw = "PATCH WORKFLOW echo-validate\nMOVE STEP echo AFTER validate"
    expect(normalizePatchEqlRawOutput(raw, "multi-cap")).toBe(
      "PATCH WORKFLOW multi-cap\nMOVE STEP echo AFTER validate"
    )
  })

  it("normalizes inline with LABEL on UPDATE STEP", () => {
    const raw = 'PATCH WORKFLOW echo-test with LABEL "Patched Echo"\nUPDATE STEP echo with LABEL "Patched Echo"'
    expect(normalizePatchEqlRawOutput(raw, "echo-test")).toBe(
      'PATCH WORKFLOW echo-test\nUPDATE STEP echo\n  LABEL "Patched Echo"'
    )
  })

  it("returns raw output when workflow id is unknown", () => {
    const raw = "DELETE STEP summarize"
    expect(normalizePatchEqlRawOutput(raw, undefined)).toBe(raw)
  })
})

describe("substitutePatchRepairTemplate", () => {
  it("replaces fictional repair template ids", () => {
    const raw = `PATCH WORKFLOW example-wf
UPDATE STEP example-step
  LABEL "Short Summary"`
    expect(substitutePatchRepairTemplate(raw, "two-step-chain", "summarize")).toBe(
      `PATCH WORKFLOW two-step-chain
UPDATE STEP summarize
  LABEL "Short Summary"`
    )
  })
})
