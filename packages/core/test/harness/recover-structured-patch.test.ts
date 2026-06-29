import { describe, expect, it } from "vitest"
import { recoverStructuredPatchFromRequest } from "../../src/harness/authoring/recover-structured-patch.js"
import {
  createEqlIncludesRequiredCapabilities,
  synthesizeCreateEqlFromRequiredCapabilities,
} from "../../src/harness/authoring/normalize-create-eql-output.js"

describe("recoverStructuredPatchFromRequest", () => {
  it("rebuilds DELETE STEP for remove requests", () => {
    expect(
      recoverStructuredPatchFromRequest("PATCH WORKFLOW multi-cap\nUPDATE WORKFLOW", {
        request: "Remove the notify step from the workflow.",
        workflowId: "multi-cap",
        stepIds: ["validate", "echo", "notify"],
      })
    ).toBe(`PATCH WORKFLOW multi-cap
DELETE STEP notify`)
  })

  it("rebuilds ADD STEP after anchor", () => {
    expect(
      recoverStructuredPatchFromRequest("PATCH WORKFLOW echo-test\nUPDATE WORKFLOW", {
        request:
          "Add a summarize step after echo using @executioncontrolprotocol/demo.summarize.",
        workflowId: "echo-test",
        stepIds: ["echo"],
        capabilityIds: ["@executioncontrolprotocol/demo.summarize"],
      })
    ).toBe(`PATCH WORKFLOW echo-test
ADD STEP summarize USES @executioncontrolprotocol/demo.summarize AFTER echo`)
  })

  it("rebuilds ADD STEP before anchor", () => {
    expect(
      recoverStructuredPatchFromRequest("PATCH WORKFLOW echo-test\nUPDATE WORKFLOW", {
        request:
          "Insert a validate step before echo using @executioncontrolprotocol/demo.validate.",
        workflowId: "echo-test",
        stepIds: ["echo"],
        capabilityIds: ["@executioncontrolprotocol/demo.validate"],
      })
    ).toBe(`PATCH WORKFLOW echo-test
ADD STEP validate USES @executioncontrolprotocol/demo.validate BEFORE echo`)
  })

  it("rebuilds echo input value patch", () => {
    expect(
      recoverStructuredPatchFromRequest("PATCH WORKFLOW echo-test\nUPDATE WORKFLOW", {
        request: "Set echo input value to recovered.",
        workflowId: "echo-test",
        stepIds: ["echo"],
      })
    ).toBe(`PATCH WORKFLOW echo-test
UPDATE STEP echo
  WITH value = "recovered"`)
  })

  it("rebuilds combined DELETE and ADD patch", () => {
    expect(
      recoverStructuredPatchFromRequest(
        "PATCH WORKFLOW two-step-chain\nADD STEP translate USES @executioncontrolprotocol/demo.translate AFTER echo",
        {
          request: "Add translate after echo and remove summarize if present.",
          workflowId: "two-step-chain",
          stepIds: ["echo", "summarize"],
          capabilityIds: ["@executioncontrolprotocol/demo.translate"],
        }
      )
    ).toBe(`PATCH WORKFLOW two-step-chain
DELETE STEP summarize
ADD STEP translate USES @executioncontrolprotocol/demo.translate AFTER echo
  WITH text = REF echo.output
  AS translate`)
  })
})

describe("synthesizeCreateEqlFromRequiredCapabilities", () => {
  const required = [
    "@executioncontrolprotocol/demo.validate",
    "@executioncontrolprotocol/test.echo",
    "@executioncontrolprotocol/demo.summarize",
  ]

  it("builds all required steps in request order", () => {
    const synthesized = synthesizeCreateEqlFromRequiredCapabilities(
      "Create a 3-step workflow using @executioncontrolprotocol/demo.validate, @executioncontrolprotocol/test.echo, and @executioncontrolprotocol/demo.summarize.",
      required
    )
    expect(synthesized).toContain("STEP validate USES @executioncontrolprotocol/demo.validate")
    expect(synthesized).toContain("STEP echo USES @executioncontrolprotocol/test.echo")
    expect(synthesized).toContain("STEP summarize USES @executioncontrolprotocol/demo.summarize")
    expect(createEqlIncludesRequiredCapabilities(synthesized!, required)).toBe(true)
  })
})
