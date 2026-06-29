import { describe, expect, it } from "vitest"
import { buildContextBundle, CONTEXT_PROMPT_BUDGET } from "../../src/harness/authoring/context-policy.js"
import {
  deriveIntentSummaryFallback,
  deriveIntentTopicFallback,
  enrichClassifiedIntent,
  formatClassifiedIntentBlock,
} from "../../src/harness/authoring/classified-intent.js"
import type { Ecp } from "../../src/environment/ecp.js"
import { ECP_INTENT_SCHEMA, ECP_INTENT_VALUES } from "@executioncontrolprotocol/types"

const mockEcp = {
  describe: async () => ({
    extensions: [{ id: "@executioncontrolprotocol/test", order: 0, capabilities: ["@executioncontrolprotocol/test.echo"] }],
    capabilities: [
      {
        id: "@executioncontrolprotocol/test.echo",
        extension: "@executioncontrolprotocol/test",
        inputSchema: { properties: { value: {} } },
        outputSchema: { properties: { output: {} } },
      },
    ],
  }),
  encode: () => ({
    uses: () => ({
      with: () => ({
        process: async () => ({ success: true, result: "ENCODED" }),
      }),
    }),
  }),
} as unknown as Ecp

describe("context-policy", () => {
  it("unfiltered phase omits environment context", async () => {
    const bundle = await buildContextBundle(mockEcp, {
      phase: "unfiltered",
      message: "Hello",
      includeEnvironmentDescriptor: true,
    })
    expect(bundle.lines).toEqual([])
  })

  it("contextualized phase includes environment for workflow-create", async () => {
    const bundle = await buildContextBundle(mockEcp, {
      phase: "contextualized",
      message: "Create echo workflow",
      intent: ECP_INTENT_VALUES.WORKFLOW_CREATE,
      includeEnvironmentDescriptor: true,
      outputIsEql: true,
    })
    const joined = bundle.lines.join("\n")
    expect(joined).toContain("Environment capabilities")
    expect(joined.length).toBeLessThanOrEqual(CONTEXT_PROMPT_BUDGET.contextualized)
  })
})

describe("classified-intent", () => {
  it("enriches missing topic and summary", () => {
    const enriched = enrichClassifiedIntent(
      { schema: ECP_INTENT_SCHEMA, intent: ECP_INTENT_VALUES.FAQ },
      "How does workflow patching work?"
    )
    expect(enriched.topic).toBe("patching")
    expect(enriched.summary).toContain("patching")
  })

  it("formats classified intent block", () => {
    const lines = formatClassifiedIntentBlock({
      schema: ECP_INTENT_SCHEMA,
      intent: ECP_INTENT_VALUES.WORKFLOW_PATCH,
      topic: "echo-failure",
      summary: "User reports echo failure",
    })
    expect(lines.join("\n")).toContain("workflow-patch")
    expect(lines.join("\n")).toContain("echo-failure")
  })

  it("derives off-topic topic", () => {
    expect(deriveIntentTopicFallback("Tell me a joke", ECP_INTENT_VALUES.GENERAL)).toBe("off-topic")
    expect(deriveIntentSummaryFallback("A".repeat(200)).endsWith("...")).toBe(true)
  })
})
