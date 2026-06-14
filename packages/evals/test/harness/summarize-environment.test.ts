import { describe, expect, it } from "vitest"
import {
  formatEnvironmentSummaryLines,
  summarizeEnvironmentDescriptor,
} from "@executioncontextprotocol/core"
import type { EnvironmentDescriptor } from "@executioncontextprotocol/types"

const minimalDescriptor: EnvironmentDescriptor = {
  schema: "@ecp.environment.describe",
  version: "1.0.0",
  environment: { id: "test" },
  runtime: { id: "local", features: {} },
  extensions: [
    { id: "@executioncontextprotocol/test", order: 0, capabilities: ["@executioncontextprotocol/test.echo"] },
    { id: "@executioncontextprotocol/demo", order: 1, capabilities: ["@executioncontextprotocol/demo.summarize"] },
  ],
  capabilities: [
    {
      id: "@executioncontextprotocol/test.echo",
      extension: "@executioncontextprotocol/test",
      inputSchema: { type: "object", properties: { value: { type: "string" } } },
      outputSchema: { type: "object", properties: { text: { type: "string" } } },
    },
    {
      id: "@executioncontextprotocol/demo.summarize",
      extension: "@executioncontextprotocol/demo",
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
    expect(summary.capabilities.map((c) => c.id)).toContain("@executioncontextprotocol/test.echo")
    expect(summary.extensions[0]?.id).toBe("@executioncontextprotocol/test")
  })

  it("formatEnvironmentSummaryLines lists capability ids", () => {
    const summary = summarizeEnvironmentDescriptor(minimalDescriptor)
    const text = formatEnvironmentSummaryLines(summary).join("\n")
    expect(text).toContain("@executioncontextprotocol/test.echo")
    expect(text).toContain("@executioncontextprotocol/demo.summarize")
  })

  it("formatEnvironmentSummaryLines eql-patch marks caps already in workflow", () => {
    const summary = summarizeEnvironmentDescriptor(minimalDescriptor)
    const text = formatEnvironmentSummaryLines(summary, {
      format: "eql-patch",
      existingCapabilityUses: new Set(["@executioncontextprotocol/test.echo"]),
    }).join("\n")
    expect(text).toContain("ADD STEP <newStepId> USES @executioncontextprotocol/demo.summarize")
    expect(text).toContain("@executioncontextprotocol/test.echo (already used by an existing step")
  })
})
