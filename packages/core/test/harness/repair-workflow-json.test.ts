import { describe, expect, it } from "vitest"
import {
  repairWorkflowJsonSyntax,
  repairPatchJsonSyntax,
  hoistWorkflowStepsInRawJson,
} from "../../src/harness/authoring/repair-workflow-json.js"

function parse(raw: string): unknown {
  return JSON.parse(raw)
}

describe("repairWorkflowJsonSyntax", () => {
  it("returns valid JSON unchanged (still parseable)", () => {
    const valid = JSON.stringify({
      schema: "@ecp.workflow",
      version: "1.0",
      workflow: { id: "w" },
      steps: [{ type: "step", id: "a", uses: "@executioncontextprotocol/demo.echo", input: {}, as: "a" }],
    })
    expect(() => parse(repairWorkflowJsonSyntax(valid))).not.toThrow()
  })

  it("strips trailing stray array brackets after the root object", () => {
    const raw = '{"schema":"@ecp.workflow","version":"1.0","workflow":{"id":"w"},"steps":[]}]'
    const repaired = repairWorkflowJsonSyntax(raw)
    expect(() => parse(repaired)).not.toThrow()
  })

  it("closes a single missing root brace", () => {
    const raw = '{"schema":"@ecp.workflow","version":"1.0","workflow":{"id":"w"},"steps":[]'
    const repaired = repairWorkflowJsonSyntax(raw)
    const parsed = parse(repaired) as { schema: string }
    expect(parsed.schema).toBe("@ecp.workflow")
  })

  it("moves a floating 'as' back inside the preceding step", () => {
    const raw =
      '{"schema":"@ecp.workflow","version":"1.0","workflow":{"id":"w"},"steps":[{"type":"step","id":"echo","uses":"@executioncontextprotocol/demo.echo","input":{"value":"hi"}},"as":"echo"},{"type":"step","id":"two","uses":"@executioncontextprotocol/demo.echo","input":{}}]}'
    const repaired = repairWorkflowJsonSyntax(raw)
    const parsed = parse(repaired) as { steps: { id: string; as?: string }[] }
    const echo = parsed.steps.find((s) => s.id === "echo")
    expect(echo?.as).toBe("echo")
  })

  it("preserves $ref inputs with legitimate nested braces", () => {
    const raw = JSON.stringify({
      schema: "@ecp.workflow",
      version: "1.0",
      workflow: { id: "w" },
      steps: [
        { type: "step", id: "a", uses: "@executioncontextprotocol/demo.echo", input: { x: { $ref: "state.y" } }, as: "a" },
      ],
    })
    const repaired = repairWorkflowJsonSyntax(raw)
    const parsed = parse(repaired) as {
      steps: { input: { x: { $ref: string } } }[]
    }
    expect(parsed.steps[0]!.input.x.$ref).toBe("state.y")
  })
})

describe("hoistWorkflowStepsInRawJson", () => {
  it("hoists steps nested under workflow to the top level", () => {
    const raw = JSON.stringify({
      schema: "@ecp.workflow",
      version: "1.0",
      workflow: {
        id: "w",
        steps: [{ type: "step", id: "a", uses: "@executioncontextprotocol/demo.echo", input: {}, as: "a" }],
      },
    })
    const hoisted = hoistWorkflowStepsInRawJson(raw)
    const parsed = parse(hoisted) as {
      steps?: unknown[]
      workflow: { steps?: unknown[] }
    }
    expect(Array.isArray(parsed.steps)).toBe(true)
    expect(parsed.workflow.steps).toBeUndefined()
  })
})

describe("repairPatchJsonSyntax", () => {
  it("strips a stray ) before } that wraps the document", () => {
    const raw = '{"schema":"@ecp.patch","version":"1.0","targetSchema":"@ecp.workflow","patches":[])}'
    const repaired = repairPatchJsonSyntax(raw)
    const parsed = parse(repaired) as { schema: string }
    expect(parsed.schema).toBe("@ecp.patch")
  })
})
