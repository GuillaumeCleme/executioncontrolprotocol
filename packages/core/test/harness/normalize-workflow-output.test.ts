import { describe, expect, it } from "vitest"
import { LATEST_ECP_VERSION } from "@executioncontextprotocol/types"
import { normalizeWorkflowDocumentCandidate } from "../../src/harness/authoring/normalize-workflow-output.js"

describe("normalizeWorkflowDocumentCandidate", () => {
  it("fills in default schema and version", () => {
    const result = normalizeWorkflowDocumentCandidate({
      workflow: { id: "w" },
      steps: [],
    }) as { schema: string; version: string }
    expect(result.schema).toBe("@ecp.workflow")
    expect(result.version).toBe(LATEST_ECP_VERSION)
  })

  it("hoists steps nested under workflow to the top level", () => {
    const result = normalizeWorkflowDocumentCandidate({
      workflow: {
        id: "w",
        steps: [{ uses: "@executioncontextprotocol/demo.echo", id: "a", input: {} }],
      },
    }) as { steps: unknown[]; workflow: { steps?: unknown[] } }
    expect(result.steps).toHaveLength(1)
    expect(result.workflow.steps).toBeUndefined()
  })

  it("renames step `inputs` to `input` and adds type:step", () => {
    const result = normalizeWorkflowDocumentCandidate({
      workflow: { id: "w" },
      steps: [{ id: "a", uses: "@executioncontextprotocol/demo.echo", inputs: { value: "x" } }],
    }) as { steps: { type: string; input: { value: string }; inputs?: unknown }[] }
    const step = result.steps[0]!
    expect(step.type).toBe("step")
    expect(step.input.value).toBe("x")
    expect(step.inputs).toBeUndefined()
  })

  it("passes through non-object documents unchanged", () => {
    expect(normalizeWorkflowDocumentCandidate("not-an-object")).toBe("not-an-object")
    expect(normalizeWorkflowDocumentCandidate(null)).toBeNull()
  })
})
