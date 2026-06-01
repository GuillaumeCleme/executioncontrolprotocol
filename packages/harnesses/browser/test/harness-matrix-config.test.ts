import { describe, expect, it } from "vitest"
import {
  HARNESS_TASKS,
  getHarnessMatrixConfig,
} from "../src/harness-matrix-config.js"

describe("HARNESS_TASKS", () => {
  it("exposes the three harness task ids", () => {
    expect(HARNESS_TASKS).toEqual({
      WORKFLOW_AUTHORING: "workflow-authoring",
      INTENT_CLASSIFICATION: "intent-classification",
      WORKFLOW_ASSISTANT: "workflow-assistant",
    })
  })
})

describe("getHarnessMatrixConfig", () => {
  it("maps workflow authoring to the @ecp.workflow output schema", () => {
    const config = getHarnessMatrixConfig(HARNESS_TASKS.WORKFLOW_AUTHORING)
    expect((config.output as { schema: string }).schema).toBe("@ecp.workflow")
  })

  it("maps intent classification to the @ecp.intent output schema", () => {
    const config = getHarnessMatrixConfig(HARNESS_TASKS.INTENT_CLASSIFICATION)
    expect((config.output as { schema: string }).schema).toBe("@ecp.intent")
  })

  it("maps the assistant task to the @ecp.harness.reply output schema", () => {
    const config = getHarnessMatrixConfig(HARNESS_TASKS.WORKFLOW_ASSISTANT)
    expect((config.output as { schema: string }).schema).toBe("@ecp.harness.reply")
  })

  it("enables the repair loop with multiple attempts", () => {
    const config = getHarnessMatrixConfig(HARNESS_TASKS.WORKFLOW_AUTHORING)
    expect((config.repair as { enabled: boolean; maxAttempts: number }).enabled).toBe(true)
    expect((config.repair as { maxAttempts: number }).maxAttempts).toBeGreaterThan(1)
  })

  it("returns the matrix config for the browser-demo profile (parity today)", () => {
    const matrix = getHarnessMatrixConfig(HARNESS_TASKS.WORKFLOW_AUTHORING, "matrix")
    const demo = getHarnessMatrixConfig(HARNESS_TASKS.WORKFLOW_AUTHORING, "browser-demo")
    expect(demo).toEqual(matrix)
  })
})
