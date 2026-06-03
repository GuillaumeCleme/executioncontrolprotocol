import { describe, expect, it } from "vitest"
import {
  formatEnvironmentSummaryLines,
  summarizeEnvironmentDescriptor,
} from "@ecp/core"
import type { EnvironmentDescriptor } from "@ecp/types"

const minimalDescriptor: EnvironmentDescriptor = {
  schema: "@ecp.environment.describe",
  version: "1.0.0",
  environment: { id: "test" },
  runtime: { id: "local", features: {} },
  extensions: [
    { id: "@ecp/test", order: 0, capabilities: ["@ecp/test.echo"] },
    { id: "@ecp/demo", order: 1, capabilities: ["@ecp/demo.summarize"] },
  ],
  capabilities: [
    {
      id: "@ecp/test.echo",
      extension: "@ecp/test",
      inputSchema: { type: "object", properties: { value: { type: "string" } } },
      outputSchema: { type: "object", properties: { text: { type: "string" } } },
    },
    {
      id: "@ecp/demo.summarize",
      extension: "@ecp/demo",
      inputSchema: { type: "object", properties: { text: { type: "string" } } },
    },
  ],
  policies: [],
}

describe("summarizeEnvironmentDescriptor", () => {
  it("produces smaller JSON than full descriptor", () => {
    const summary = summarizeEnvironmentDescriptor(minimalDescriptor)
    const summaryJson = JSON.stringify(summary)
    const fullJson = JSON.stringify(minimalDescriptor)
    expect(summaryJson.length).toBeLessThan(fullJson.length)
    expect(summary.capabilities.map((c) => c.id)).toContain("@ecp/test.echo")
    expect(summary.extensions[0]?.id).toBe("@ecp/test")
  })

  it("formatEnvironmentSummaryLines lists capability ids", () => {
    const summary = summarizeEnvironmentDescriptor(minimalDescriptor)
    const text = formatEnvironmentSummaryLines(summary).join("\n")
    expect(text).toContain("@ecp/test.echo")
    expect(text).toContain("@ecp/demo.summarize")
  })

  it("formatEnvironmentSummaryLines eql-patch marks caps already in workflow", () => {
    const summary = summarizeEnvironmentDescriptor(minimalDescriptor)
    const text = formatEnvironmentSummaryLines(summary, {
      format: "eql-patch",
      existingCapabilityUses: new Set(["@ecp/test.echo"]),
    }).join("\n")
    expect(text).toContain("ADD STEP <newStepId> USES @ecp/demo.summarize")
    expect(text).toContain("@ecp/test.echo (already used by an existing step")
  })
})
