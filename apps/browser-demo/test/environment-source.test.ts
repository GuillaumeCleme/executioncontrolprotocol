import { describe, expect, it } from "vitest"
import { environmentSourceFromDescriptor } from "../src/lib/environment-source.js"
import type { EnvironmentDescriptor } from "@ecp/types"

const SAMPLE: EnvironmentDescriptor = {
  schema: "@ecp.environment.describe",
  version: "1.0.0",
  environment: { id: "browser-demo-app", label: "Browser demo" },
  runtime: { id: "@ecp/browser", features: {} },
  extensions: [
    { id: "@ecp/test", order: 0, capabilities: ["@ecp/test.echo"] },
    { id: "@ecp/format-toon", order: 1, capabilities: [] },
  ],
  capabilities: [],
  policies: [],
}

describe("environmentSourceFromDescriptor", () => {
  it("returns placeholder when descriptor is null", () => {
    const src = environmentSourceFromDescriptor(null)
    expect(src).toContain("@ecp/browser")
    expect(src).toContain("browser-demo-app")
  })

  it("generates extension bindings from descriptor", () => {
    const src = environmentSourceFromDescriptor(SAMPLE)
    expect(src).toContain('environment("browser-demo-app", "Browser demo")')
    expect(src).toContain('extension("@ecp/test")')
    expect(src).toContain('extension("@ecp/format-toon")')
    expect(src).toContain("View only")
  })
})
