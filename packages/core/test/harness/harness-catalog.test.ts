import { describe, expect, it } from "vitest"
import {
  harnessEvaluateCapabilityId,
  harnessIdFromCapabilityId,
  isHarnessCapabilityId,
  listCatalogedHarnessIds,
  normalizeHarnessId,
} from "../../src/harness/harness-catalog.js"
import { registerStandardHarnesses } from "../../src/harness/register-standard-harnesses.js"

describe("harness-catalog", () => {
  it("normalizes harness ids", () => {
    expect(normalizeHarnessId("@ecp/workflow-authoring")).toBe("@ecp/workflow-authoring")
    expect(normalizeHarnessId("workflow-authoring")).toBe("@ecp/workflow-authoring")
  })

  it("parses and builds evaluate capability ids", () => {
    expect(harnessEvaluateCapabilityId("@ecp/workflow-authoring")).toBe(
      "@ecp/workflow-authoring.evaluate"
    )
    expect(harnessIdFromCapabilityId("@ecp/workflow-authoring.evaluate")).toBe(
      "@ecp/workflow-authoring"
    )
    expect(isHarnessCapabilityId("@ecp/workflow-authoring.evaluate")).toBe(true)
    expect(isHarnessCapabilityId("@ecp/demo.generate")).toBe(false)
    expect(harnessIdFromCapabilityId("@ecp/demo.generate")).toBeUndefined()
  })

  it("lists standard harness ids after registration", () => {
    registerStandardHarnesses()
    const ids = listCatalogedHarnessIds()
    expect(ids).toContain("@ecp/workflow-authoring")
    expect(ids).toContain("@ecp/intent-classification")
  })
})
