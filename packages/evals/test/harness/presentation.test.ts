import { describe, expect, it } from "vitest"
import { isRepairFeedbackEcho } from "@ecp/harnesses-evals/presentation"

describe("isRepairFeedbackEcho", () => {
  it("detects echoed capability repair prose", () => {
    expect(
      isRepairFeedbackEcho(
        "Workflow must include steps for every required capability. Missing uses: @ecp/demo.validate."
      )
    ).toBe(true)
  })

  it("allows compact JSON workflow output", () => {
    expect(
      isRepairFeedbackEcho('{"schema":"@ecp.workflow","version":"1.0.0","steps":[]}')
    ).toBe(false)
  })
})
