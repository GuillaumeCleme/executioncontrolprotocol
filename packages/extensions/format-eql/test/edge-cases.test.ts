import { describe, expect, it } from "vitest"
import type { EcpPatchDocument, WorkflowManifest } from "@executioncontextprotocol/types"
import { encodeToEql } from "../src/encode/encode-eql.js"
import { encodePatchToEql } from "../src/encode/encode-patch.js"
import { encodeWorkflowToEql } from "../src/encode/encode-workflow.js"
import { decodePatch, decodeWorkflow, encodePatch, encodeWorkflow, testCtx } from "./helpers.js"

describe("EQL edge cases and coverage", () => {
  it("infers sourceSchema from document when omitted", () => {
    const manifest = {
      schema: "@ecp.workflow",
      version: "1.0",
      workflow: { id: "x" },
      steps: [{ type: "step", id: "s", uses: "@executioncontextprotocol/demo.echo" }],
    } as WorkflowManifest
    const result = encodeToEql({ source: manifest }, testCtx)
    expect(result.success).toBe(true)
  })

  it("returns encode failure for invalid workflow", () => {
    const bad = {
      schema: "@ecp.workflow",
      version: "1.0",
      workflow: { id: "" },
      steps: [],
    } as WorkflowManifest
    const result = encodeWorkflow(bad)
    expect(result.success).toBe(false)
    expect(result.diagnostics.length).toBeGreaterThan(0)
  })

  it("returns encode failure for invalid patch document", () => {
    const bad = {
      schema: "@ecp.patch",
      version: "1.0",
      targetSchema: "@ecp.workflow",
    } as EcpPatchDocument
    const result = encodePatch(bad)
    expect(result.success).toBe(false)
    expect(result.diagnostics[0]?.code).toBeDefined()
  })

  it("uses quote always for string literals", () => {
    const manifest = {
      schema: "@ecp.workflow",
      version: "1.0",
      workflow: { id: "q" },
      steps: [
        {
          type: "step",
          id: "s",
          uses: "@executioncontextprotocol/demo.echo",
          input: { msg: "hi" },
        },
      ],
    } as WorkflowManifest
    const text = encodeWorkflow(manifest, { quote: "always" }).result!
    expect(text).toMatch(/WITH msg = "hi"/)
  })

  it("encodes inline object WITH values", () => {
    const manifest = {
      schema: "@ecp.workflow",
      version: "1.0",
      workflow: { id: "obj" },
      steps: [
        {
          type: "step",
          id: "s",
          uses: "@executioncontextprotocol/demo.echo",
          input: { payload: { a: 1, b: "two" } },
        },
      ],
    } as WorkflowManifest
    const encoded = encodeWorkflow(manifest)
    const decoded = decodeWorkflow(encoded.result!)
    expect(decoded.success).toBe(true)
    const step = (decoded.result as WorkflowManifest).steps[0] as {
      input?: { payload?: unknown }
    }
    expect(step.input?.payload).toEqual({ a: 1, b: "two" })
  })

  it("round-trips DELETE, ADD, and MOVE patch operations", () => {
    const text = `ECP @ecp.patch 1.0
PATCH WORKFLOW chain
DELETE STEP old
ADD STEP new USES @executioncontextprotocol/demo.echo AFTER echo
  WITH value = "added"
  LABEL "New"
MOVE STEP new BEFORE summarize`
    const decoded = decodePatch(text)
    expect(decoded.success).toBe(true)
    const encoded = encodePatch(decoded.result as EcpPatchDocument)
    const again = decodePatch(encoded.result!)
    expect(again.result).toEqual(decoded.result)
    expect(encoded.result).toContain("DELETE STEP old")
    expect(encoded.result).toContain("ADD STEP new")
    expect(encoded.result).toContain("MOVE STEP new")
  })

  it("encodes step MODE without AS on its own line", () => {
    const patch: EcpPatchDocument = {
      schema: "@ecp.patch",
      version: "1.0",
      targetSchema: "@ecp.workflow",
      patches: [
        { path: "workflow.id", mode: "replace", value: "wf" },
        { path: "steps[s].mode", mode: "replace", value: "append" },
      ],
    }
    const text = encodePatchToEql(patch, "wf")
    expect(text).toContain("MODE append")
    const decoded = decodePatch(text)
    expect(decoded.success).toBe(true)
  })

  it("reports syntax error for invalid JSON in WITH", () => {
    const text = `ECP @ecp.workflow 1.0
WORKFLOW bad
STEP s USES @executioncontextprotocol/demo.echo
  WITH data = {not-json}`
    const decoded = decodeWorkflow(text)
    expect(decoded.success).toBe(false)
    expect(decoded.diagnostics.some((d) => d.code === "EQL_SYNTAX")).toBe(true)
  })

  it("reports syntax error for empty REF path", () => {
    const text = `ECP @ecp.workflow 1.0
WORKFLOW bad
STEP s USES @executioncontextprotocol/demo.echo
  WITH x = REF`
    const decoded = decodeWorkflow(text)
    expect(decoded.success).toBe(false)
  })

  it("encodes UPDATE USES and skips non-step workflow nodes", () => {
    const patch: EcpPatchDocument = {
      schema: "@ecp.patch",
      version: "1.0",
      targetSchema: "@ecp.workflow",
      patches: [
        { path: "workflow.id", mode: "replace", value: "wf" },
        { path: "steps[s].uses", mode: "replace", value: "@executioncontextprotocol/other" },
      ],
    }
    const text = encodePatchToEql(patch, "wf")
    expect(text).toContain("USES @executioncontextprotocol/other")

    const manifest = {
      schema: "@ecp.workflow",
      version: "1.0",
      workflow: { id: "mix" },
      steps: [
        { type: "parallel", id: "p", steps: [] },
        { type: "step", id: "s", uses: "@executioncontextprotocol/demo.echo" },
      ],
    } as WorkflowManifest
    const wfText = encodeWorkflowToEql(manifest)
    expect(wfText).toContain("STEP s USES")
    expect(wfText).not.toContain("PARALLEL")
  })

  it("reports unsupported WHEN expression", () => {
    const text = `ECP @ecp.workflow 1.0
WORKFLOW w
STEP s USES @executioncontextprotocol/demo.echo
  WHEN not-valid`
    const decoded = decodeWorkflow(text)
    expect(decoded.success).toBe(false)
    expect(decoded.diagnostics.some((d) => d.code === "EQL_SYNTAX")).toBe(true)
  })

  it("decodes escaped string literals", () => {
    const text = `ECP @ecp.workflow 1.0
WORKFLOW esc
STEP s USES @executioncontextprotocol/demo.echo
  LABEL "say \\"hi\\""`
    const decoded = decodeWorkflow(text)
    expect(decoded.success).toBe(true)
    const step = (decoded.result as WorkflowManifest).steps[0] as { label?: string }
    expect(step.label).toBe('say "hi"')
  })
})
