import { describe, expect, it } from "vitest"
import { ECP_ENCODING_ERROR_CODES } from "@ecp/types"
import { encodeToEql } from "../src/encode/encode-eql.js"
import { decodeFromEql } from "../src/decode/decode-eql.js"
import { EQL_ERROR_CODES } from "../src/decode/diagnostics.js"
import { encodeWorkflow, loadWorkflowFixture, testCtx } from "./helpers.js"

describe("EQL unsupported schema handling", () => {
  it("encode fails for unknown sourceSchema", () => {
    expect(() =>
      encodeToEql(
        { source: { schema: "@ecp.intent" }, sourceSchema: "@ecp.intent" },
        testCtx
      )
    ).toThrow(expect.objectContaining({
      code: ECP_ENCODING_ERROR_CODES.FORMAT_UNSUPPORTED_SOURCE_SCHEMA,
    }))
  })

  it("encode fails when schema cannot be inferred", () => {
    expect(() => encodeToEql({ source: { foo: 1 } }, testCtx)).toThrow(
      expect.objectContaining({
        code: ECP_ENCODING_ERROR_CODES.FORMAT_UNSUPPORTED_SOURCE_SCHEMA,
      })
    )
  })

  it("decode fails for unsupported targetSchema", () => {
    const encoded = encodeWorkflow(loadWorkflowFixture("echo-workflow"), {
      headers: false,
    })
    const decoded = decodeFromEql(
      {
        input: encoded.result,
        targetSchema: "@ecp.intent",
        options: { headers: false },
      },
      testCtx
    )
    expect(decoded.success).toBe(false)
    expect(decoded.diagnostics[0]?.code).toBe(EQL_ERROR_CODES.UNSUPPORTED_SCHEMA)
  })

  it("decode rejects targetSchema that is not workflow or patch", () => {
    const decoded = decodeFromEql(
      {
        input: "WORKFLOW x\nSTEP s USES @ecp/test.echo",
        targetSchema: "@ecp.intent",
        options: { headers: false },
      },
      testCtx
    )
    expect(decoded.success).toBe(false)
    expect(decoded.diagnostics[0]?.code).toBe(EQL_ERROR_CODES.UNSUPPORTED_SCHEMA)
  })

  it("decode reports schema mismatch between header and targetSchema", () => {
    const patchText = `ECP @ecp.patch 1.0
PATCH WORKFLOW x
UPDATE STEP s
  LABEL "x"`
    const decoded = decodeFromEql(
      {
        input: patchText,
        targetSchema: "@ecp.workflow",
      },
      testCtx
    )
    expect(decoded.success).toBe(false)
    expect(decoded.diagnostics.some((d) => d.code === EQL_ERROR_CODES.UNSUPPORTED_SCHEMA)).toBe(
      true
    )
  })
})
