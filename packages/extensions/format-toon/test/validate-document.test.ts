import { describe, expect, it } from "vitest"
import { workflow, step } from "@ecp/core"
import { validateEcpDocument } from "../src/validate-document.js"

describe("validateEcpDocument", () => {
  it("validates workflow manifests", () => {
    const manifest = workflow("W")
      .run([step("@ecp/test.echo", "S").with({}).as("o")])
      .toManifest()
    const result = validateEcpDocument(manifest, "@ecp.workflow")
    expect(result.valid).toBe(true)
  })

  it("skips validation for unknown schemas", () => {
    const result = validateEcpDocument(
      { schema: "@ecp.future", version: "1.0" },
      "@ecp.future"
    )
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("reports environment manifest errors", () => {
    const result = validateEcpDocument(
      { schema: "@ecp.environment", version: "1.0", environment: {} },
      "@ecp.environment"
    )
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
