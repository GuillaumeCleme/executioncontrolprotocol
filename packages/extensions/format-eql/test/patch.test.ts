import { describe, expect, it } from "vitest"
import type { EcpPatchDocument } from "@ecp/types"
import { decodePatch, encodePatch, loadPatchFixture } from "./helpers.js"

describe("EQL patch encode/decode", () => {
  it("round-trips UPDATE with WITH, LABEL, AS, and MODE", () => {
    const patch = loadPatchFixture("update-echo")
    const encoded = encodePatch(patch)
    expect(encoded.success).toBe(true)
    expect(encoded.result).toContain("PATCH WORKFLOW echo-test")
    expect(encoded.result).toContain("UPDATE STEP echo")
    expect(encoded.result).toMatch(/WITH prompt = hello/)

    const decoded = decodePatch(encoded.result!)
    expect(decoded.success).toBe(true)
    expect(decoded.result).toEqual(patch)
  })

  it("compiles DELETE, ADD, and MOVE surface syntax", () => {
    const text = `ECP @ecp.patch 1.0
PATCH WORKFLOW chain
DELETE STEP old
ADD STEP new USES @ecp/test.echo AFTER echo
  WITH value = "added"
MOVE STEP new AFTER summarize`
    const decoded = decodePatch(text)
    expect(decoded.success).toBe(true)
    const doc = decoded.result as EcpPatchDocument
    expect(doc.patches.some((p) => p.reason === "eql:delete" && p.path === "steps[old]")).toBe(
      true
    )
    expect(doc.patches.some((p) => p.reason === "eql:add-steps")).toBe(true)
    expect(doc.patches.some((p) => p.reason === "eql:move")).toBe(true)
  })

  it("compiles UPDATE WHEN into patch entries", () => {
    const text = `ECP @ecp.patch 1.0
PATCH WORKFLOW wf
UPDATE STEP s
  WHEN ready == true`
    const decoded = decodePatch(text)
    expect(decoded.success).toBe(true)
    const doc = decoded.result as EcpPatchDocument
    expect(doc.patches.some((p) => p.path === "steps[s].when")).toBe(true)
  })

  it("round-trips patch document through encode/decode", () => {
    const patch = loadPatchFixture("update-echo")
    const encoded = encodePatch(patch, { headers: false })
    const decoded = decodePatch(encoded.result!, { headers: false })
    expect(decoded.success).toBe(true)
    expect(decoded.result).toEqual(patch)
  })
})
