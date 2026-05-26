import { describe, expect, it } from "vitest"
import {
  buildPatchOperationHintLines,
  collectCreateCapabilityFeedback,
  collectPatchGoalFeedback,
  inferRequiredCapabilityIds,
} from "@ecp/harnesses-evals/request-capability-hints"
import type { CompactEnvironmentSummary } from "@ecp/harnesses-evals/summarize-environment"
import type { WorkflowManifest } from "@ecp/types"

const summary: CompactEnvironmentSummary = {
  extensions: [{ id: "@ecp/demo", capabilities: ["@ecp/demo.summarize", "@ecp/demo.notify"] }],
  capabilities: [
    { id: "@ecp/test.echo", extension: "@ecp/test", inputs: ["value"], outputs: ["text"] },
    { id: "@ecp/demo.summarize", extension: "@ecp/demo", inputs: ["text"], outputs: [] },
    { id: "@ecp/demo.notify", extension: "@ecp/demo", inputs: ["payload"], outputs: [] },
    { id: "@ecp/demo.validate", extension: "@ecp/demo", inputs: ["payload"], outputs: [] },
    { id: "@ecp/demo.translate", extension: "@ecp/demo", inputs: ["text"], outputs: [] },
  ],
}

describe("request-capability-hints", () => {
  it("infers echo and summarize from natural language", () => {
    const ids = inferRequiredCapabilityIds(
      "Create a workflow with echo (@ecp/test.echo) then summarize (@ecp/demo.summarize)",
      summary.capabilities.map((c) => c.id)
    )
    expect(ids).toContain("@ecp/test.echo")
    expect(ids).toContain("@ecp/demo.summarize")
  })

  it("infers validate when capability id appears in request", () => {
    const ids = inferRequiredCapabilityIds(
      "Build a workflow: first @ecp/demo.validate then @ecp/test.echo.",
      summary.capabilities.map((c) => c.id)
    )
    expect(ids).toContain("@ecp/demo.validate")
    expect(ids).toContain("@ecp/test.echo")
  })

  it("does not treat Validate then echo as validate capability", () => {
    const ids = inferRequiredCapabilityIds(
      "Validate then echo with hello input",
      summary.capabilities.map((c) => c.id)
    )
    expect(ids).toContain("@ecp/test.echo")
    expect(ids).not.toContain("@ecp/demo.validate")
  })

  it("collectCreateCapabilityFeedback accepts steps without type field", () => {
    const wf: WorkflowManifest = {
      schema: "@ecp.workflow",
      version: "1.0.0",
      workflow: { id: "w", label: "W" },
      steps: [
        {
          id: "echo",
          uses: "@ecp/test.echo",
          label: "Echo",
          as: "echo",
        },
      ],
    }
    const feedback = collectCreateCapabilityFeedback(
      "Create an echo workflow",
      summary,
      wf
    )
    expect(feedback).toBeUndefined()
  })

  it("collectCreateCapabilityFeedback flags missing summarize step", () => {
    const wf: WorkflowManifest = {
      schema: "@ecp.workflow",
      version: "1.0.0",
      workflow: { id: "w", label: "W" },
      steps: [
        {
          type: "step",
          id: "echo",
          label: "Echo",
          uses: "@ecp/test.echo",
          input: { value: "hi" },
          as: "echo",
        },
      ],
    }
    const feedback = collectCreateCapabilityFeedback(
      "echo then summarize",
      summary,
      wf
    )
    expect(feedback?.length).toBeGreaterThan(0)
  })

  it("does not require summarize when request removes summarize step", () => {
    const ids = inferRequiredCapabilityIds(
      "Add translate after echo and remove summarize if present.",
      summary.capabilities.map((c) => c.id)
    )
    expect(ids).toContain("@ecp/demo.translate")
    expect(ids).not.toContain("@ecp/demo.summarize")
  })

  it("buildPatchOperationHintLines targets summarize for label change", () => {
    const wf: WorkflowManifest = {
      schema: "@ecp.workflow",
      version: "1.0.0",
      workflow: { id: "two-step", label: "Two" },
      steps: [
        {
          type: "step",
          id: "echo",
          uses: "@ecp/test.echo",
          label: "Echo",
          as: "echo",
        },
        {
          type: "step",
          id: "summarize",
          uses: "@ecp/demo.summarize",
          label: "Summarize",
          as: "summary",
        },
      ],
    }
    const lines = buildPatchOperationHintLines(
      "Change summarize step label to Short Summary.",
      wf
    )
    expect(lines.some((l) => l.includes("steps[summarize].label"))).toBe(true)
  })

  it("collectPatchGoalFeedback flags insert validate on echo-only workflow", () => {
    const baseline: WorkflowManifest = {
      schema: "@ecp.workflow",
      version: "1.0.0",
      workflow: { id: "echo-only", label: "Echo" },
      steps: [
        {
          type: "step",
          id: "echo",
          uses: "@ecp/test.echo",
          label: "Echo",
          as: "echo",
        },
      ],
    }
    const feedback = collectPatchGoalFeedback(
      "Insert a validate step before echo using @ecp/demo.validate.",
      baseline,
      summary,
      baseline
    )
    expect(
      feedback?.some((f) => f.issues.some((i) => i.message.includes("@ecp/demo.validate")))
    ).toBe(true)
  })

  it("collectPatchGoalFeedback flags wrong label capitalization", () => {
    const wf: WorkflowManifest = {
      schema: "@ecp.workflow",
      version: "1.0.0",
      workflow: { id: "echo-test", label: "Echo" },
      steps: [
        {
          type: "step",
          id: "echo",
          label: "patched echo",
          uses: "@ecp/test.echo",
          input: { value: "hi" },
          as: "echo",
        },
      ],
    }
    const feedback = collectPatchGoalFeedback(
      "Change the echo step label to Patched Echo.",
      wf,
      summary
    )
    expect(
      feedback?.some((f) => f.issues.some((i) => i.message.includes("Patched Echo")))
    ).toBe(true)
  })
})
