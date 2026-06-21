import { describe, expect, it } from "vitest"
import {
  formatEnvironmentSummaryLines,
  summarizeEnvironmentDescriptor,
} from "@executioncontrolprotocol/core"
import type { EnvironmentDescriptor } from "@executioncontrolprotocol/types"

const minimalDescriptor: EnvironmentDescriptor = {
  schema: "@executioncontrolprotocol.environment.describe",
  version: "1.0.0",
  environment: { id: "test" },
  runtime: { id: "local", features: {} },
  extensions: [
    { id: "@executioncontrolprotocol/demo", order: 0, capabilities: ["@executioncontrolprotocol/demo.echo"] },
    { id: "@executioncontrolprotocol/demo", order: 1, capabilities: ["@executioncontrolprotocol/demo.summarize"] },
  ],
  capabilities: [
    {
      id: "@executioncontrolprotocol/demo.echo",
      extension: "@executioncontrolprotocol/demo",
      inputSchema: { type: "object", properties: { value: { type: "string" } } },
      outputSchema: { type: "object", properties: { text: { type: "string" } } },
    },
    {
      id: "@executioncontrolprotocol/demo.summarize",
      extension: "@executioncontrolprotocol/demo",
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
    expect(summary.capabilities.map((c) => c.id)).toContain("@executioncontrolprotocol/demo.echo")
    expect(summary.extensions[0]?.id).toBe("@executioncontrolprotocol/demo")
  })

  it("formatEnvironmentSummaryLines lists capability ids", () => {
    const summary = summarizeEnvironmentDescriptor(minimalDescriptor)
    const text = formatEnvironmentSummaryLines(summary).join("\n")
    expect(text).toContain("@executioncontrolprotocol/demo.echo")
    expect(text).toContain("@executioncontrolprotocol/demo.summarize")
  })

  it("formatEnvironmentSummaryLines eql-patch marks caps already in workflow", () => {
    const summary = summarizeEnvironmentDescriptor(minimalDescriptor)
    const text = formatEnvironmentSummaryLines(summary, {
      format: "eql-patch",
      existingCapabilityUses: new Set(["@executioncontrolprotocol/demo.echo"]),
    }).join("\n")
    expect(text).toContain("ADD STEP <newStepId> USES @executioncontrolprotocol/demo.summarize")
    expect(text).toContain("@executioncontrolprotocol/demo.echo (already used by an existing step")
  })
})
