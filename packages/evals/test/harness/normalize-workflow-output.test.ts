import { describe, expect, it } from "vitest"
import { normalizeWorkflowDocumentCandidate } from "../../src/harnesses/normalize-workflow-output.js"

describe("normalizeWorkflowDocumentCandidate", () => {
  it("hoists steps nested under workflow and fills schema/version", () => {
    const normalized = normalizeWorkflowDocumentCandidate({
      workflow: {
        id: "minimal-echo",
        label: "Minimal Echo",
        steps: [{ type: "step", id: "echo", uses: "@ecp/test.echo" }],
      },
    }) as Record<string, unknown>

    expect(normalized.schema).toBe("@ecp.workflow")
    expect(normalized.version).toBeTruthy()
    expect((normalized.workflow as Record<string, unknown>).id).toBe("minimal-echo")
    expect(normalized.steps).toHaveLength(1)
    expect((normalized.workflow as Record<string, unknown>).steps).toBeUndefined()
  })
})
