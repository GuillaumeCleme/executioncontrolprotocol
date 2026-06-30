import { describe, expect, it, beforeAll } from "vitest"
import { z } from "zod"
import { harnessCapabilityId, modelGenerateInputSchema } from "@executioncontrolprotocol/types"
import {
  formatEnvironmentSummaryLines,
  summarizeEnvironmentDescriptor,
} from "../../src/harness/authoring/summarize-environment.js"
import { catalogHarness, resetHarnessCatalogForTests } from "../../src/harness/harness-catalog.js"
import { defineHarness } from "../../src/harness/define-harness.js"
import type { EnvironmentDescriptor } from "@executioncontrolprotocol/types"

const STEP_FILTER_TEST_HARNESS_ID = "@executioncontrolprotocol/harness-step-filter-test" as const
const STEP_FILTER_TEST_HARNESS_CAPABILITY = harnessCapabilityId(STEP_FILTER_TEST_HARNESS_ID)

const browserDescriptor: EnvironmentDescriptor = {
  schema: "@executioncontrolprotocol.environment.describe",
  version: "1.0.0",
  environment: { id: "browser-demo" },
  runtime: { id: "@executioncontrolprotocol/browser", features: {} },
  extensions: [
    {
      id: "@executioncontrolprotocol/test",
      order: 0,
      capabilities: ["@executioncontrolprotocol/test.echo"],
    },
    {
      id: "@executioncontrolprotocol/chrome-ai",
      order: 1,
      capabilities: [
        "@executioncontrolprotocol/chrome-ai.generate",
        "@executioncontrolprotocol/chrome-ai.checkAvailability",
      ],
    },
    {
      id: STEP_FILTER_TEST_HARNESS_ID,
      order: 2,
      capabilities: [STEP_FILTER_TEST_HARNESS_CAPABILITY],
    },
  ],
  capabilities: [
    {
      id: "@executioncontrolprotocol/test.echo",
      extension: "@executioncontrolprotocol/test",
      inputSchema: {
        type: "object",
        properties: { value: { type: "string" } },
        required: ["value"],
      },
      outputSchema: { type: "object", properties: { echo: { type: "string" } } },
    },
    {
      id: "@executioncontrolprotocol/chrome-ai.generate",
      extension: "@executioncontrolprotocol/chrome-ai",
      inputSchema: modelGenerateInputSchema,
      outputSchema: { type: "object", properties: { text: { type: "string" } } },
    },
    {
      id: "@executioncontrolprotocol/chrome-ai.checkAvailability",
      extension: "@executioncontrolprotocol/chrome-ai",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object", properties: { available: { type: "boolean" } } },
    },
    {
      id: STEP_FILTER_TEST_HARNESS_CAPABILITY,
      extension: STEP_FILTER_TEST_HARNESS_ID,
      inputSchema: { type: "object", properties: { task: { type: "string" } } },
      outputSchema: { type: "object", properties: { artifact: { type: "object" } } },
    },
  ],
  policies: [],
}

describe("summarize-environment workflow step capabilities", () => {
  beforeAll(() => {
    resetHarnessCatalogForTests()
    catalogHarness(
      defineHarness("@executioncontrolprotocol", "harness-step-filter-test")
        .withInput(z.object({ task: z.string() }))
        .withOutput(z.object({ artifact: z.unknown(), raw: z.string(), trace: z.record(z.unknown()) }))
        .withHandler(async () => ({ artifact: {}, raw: "", trace: {} }))
        .build()
    )
  })

  it("includes chrome-ai.generate in eql-create reference with required prompt label", () => {
    const summary = summarizeEnvironmentDescriptor(browserDescriptor)
    const chromeCap = summary.capabilities.find((c) => c.id === "@executioncontrolprotocol/chrome-ai.generate")
    expect(chromeCap?.requiredInputs).toContain("prompt")
    expect(chromeCap?.optionalInputs).toContain("system")

    const text = formatEnvironmentSummaryLines(summary, { format: "eql-create" }).join("\n")
    expect(text).toContain("@executioncontrolprotocol/chrome-ai.generate")
    expect(text).toContain("prompt (required)")
    expect(text).toContain("WITH prompt =")
    expect(text).not.toContain("@executioncontrolprotocol/chrome-ai.checkAvailability")
  })

  it("labels JSON Schema required fields for test.echo", () => {
    const summary = summarizeEnvironmentDescriptor(browserDescriptor)
    const echoCap = summary.capabilities.find((c) => c.id === "@executioncontrolprotocol/test.echo")
    expect(echoCap?.requiredInputs).toEqual(["value"])
    const text = formatEnvironmentSummaryLines(summary, { format: "eql-create" }).join("\n")
    expect(text).toContain("value (required)")
  })

  it("excludes harness evaluate from eql-create step reference", () => {
    const summary = summarizeEnvironmentDescriptor(browserDescriptor)
    const text = formatEnvironmentSummaryLines(summary, { format: "eql-create" }).join("\n")
    expect(text).not.toContain(STEP_FILTER_TEST_HARNESS_CAPABILITY)
    expect(text).toContain("@executioncontrolprotocol/test.echo")
  })
})
