import { describe, expect, it } from "vitest"
import {
  HARNESS_BROWSER_NANO_DEMO_BINDING,
  HARNESS_NANO_BINDING,
  HARNESS_TASKS,
  getHarnessNanoConfig,
} from "../src/harness-nano-config.js"

describe("HARNESS_TASKS", () => {
  it("exposes the three harness task ids", () => {
    expect(HARNESS_TASKS).toEqual({
      WORKFLOW_AUTHORING: "workflow-authoring",
      INTENT_CLASSIFICATION: "intent-classification",
      WORKFLOW_ASSISTANT: "workflow-assistant",
    })
  })
})

describe("getHarnessNanoConfig", () => {
  it("maps workflow authoring to the @ecp.workflow output schema", () => {
    const config = getHarnessNanoConfig(HARNESS_TASKS.WORKFLOW_AUTHORING)
    expect((config.output as { schema: string }).schema).toBe("@ecp.workflow")
  })

  it("maps intent classification to the @ecp.intent output schema", () => {
    const config = getHarnessNanoConfig(HARNESS_TASKS.INTENT_CLASSIFICATION)
    expect((config.output as { schema: string }).schema).toBe("@ecp.intent")
  })

  it("maps the assistant task to the @ecp.harness.reply output schema", () => {
    const config = getHarnessNanoConfig(HARNESS_TASKS.WORKFLOW_ASSISTANT)
    expect((config.output as { schema: string }).schema).toBe("@ecp.harness.reply")
  })

  it("uses EQL output format for every task", () => {
    for (const task of Object.values(HARNESS_TASKS)) {
      const config = getHarnessNanoConfig(task)
      expect((config.output as { format: string }).format).toBe("@executioncontextprotocol/format-eql")
    }
  })

  it("enables the repair loop with multiple attempts", () => {
    const config = getHarnessNanoConfig(HARNESS_TASKS.WORKFLOW_AUTHORING)
    expect((config.repair as { enabled: boolean; maxAttempts: number }).enabled).toBe(true)
    expect((config.repair as { maxAttempts: number }).maxAttempts).toBeGreaterThan(1)
  })

  it("browser demo binding matches eval matrix binding", () => {
    expect(HARNESS_BROWSER_NANO_DEMO_BINDING).toBe(HARNESS_NANO_BINDING)
  })
})
