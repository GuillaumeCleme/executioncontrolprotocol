import { describe, expect, it } from "vitest"
import {
  buildPatchOperationHintLines,
  buildRequestCapabilityHintLines,
  collectCreateCapabilityFeedback,
  collectPatchGoalFeedback,
  inferRequiredCapabilityIds,
} from "../../../harnesses/browser/src/_internal/request-capability-hints.js"
import type { CompactEnvironmentSummary } from "../../../harnesses/browser/src/_internal/summarize-environment.js"
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

  it("buildPatchOperationHintLines provides workflow context and operation selection", () => {
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
    expect(lines.some((l) => l.includes('PATCH WORKFLOW must use id "two-step"'))).toBe(true)
    expect(lines.some((l) => l.includes("echo, summarize"))).toBe(true)
    expect(lines.some((l) => l.includes("change a step label or input"))).toBe(true)
    expect(lines.some((l) => l.includes("UPDATE STEP"))).toBe(true)
  })

  it("buildPatchOperationHintLines steers workflow label to UPDATE WORKFLOW", () => {
    const wf: WorkflowManifest = {
      schema: "@ecp.workflow",
      version: "1.0.0",
      workflow: { id: "two-step-chain", label: "Two step chain" },
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
    const lines = buildPatchOperationHintLines("Change workflow label to Updated Chain.", wf)
    expect(lines.some((l) => l.includes("UPDATE WORKFLOW"))).toBe(true)
    expect(lines.some((l) => l.includes("not UPDATE STEP"))).toBe(true)
  })

  it("buildPatchOperationHintLines targets summarize for step label change", () => {
    const wf: WorkflowManifest = {
      schema: "@ecp.workflow",
      version: "1.0.0",
      workflow: { id: "two-step-chain", label: "Two" },
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
    expect(lines.some((l) => l.includes("Target step: summarize"))).toBe(true)
    expect(lines.some((l) => l.includes("UPDATE STEP summarize"))).toBe(true)
  })

  it("buildPatchOperationHintLines spells out combined delete and add", () => {
    const wf: WorkflowManifest = {
      schema: "@ecp.workflow",
      version: "1.0.0",
      workflow: { id: "two-step-chain", label: "Two" },
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
      "Add translate after echo and remove summarize if present.",
      wf,
      summary.capabilities.map((c) => c.id)
    )
    const text = lines.join("\n")
    expect(text).toContain("DELETE STEP summarize")
    expect(text).toContain("ADD STEP translate USES @ecp/demo.translate AFTER echo")
    expect(text).not.toContain("for the new capability")
    expect(text).toContain("Do not UPDATE STEP summarize")
  })

  it("buildRequestCapabilityHintLines patch mode does not inject operation templates", () => {
    const lines = buildRequestCapabilityHintLines(
      "Add a summarize step after echo using @ecp/demo.summarize.",
      summary,
      { mode: "patch" }
    )
    const text = lines.join("\n")
    expect(text).not.toContain("ADD STEP summarize USES @ecp/demo.summarize")
    expect(text).not.toContain("Required: 1 step(s) in order")
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

  it("buildPatchOperationHintLines suggests MOVE STEP for reorder requests", () => {
    const wf: WorkflowManifest = {
      schema: "@ecp.workflow",
      version: "1.0.0",
      workflow: { id: "echo-validate", label: "Echo validate reorder" },
      steps: [
        { type: "step", id: "echo", uses: "@ecp/test.echo", label: "Echo", as: "echo" },
        { type: "step", id: "validate", uses: "@ecp/demo.validate", label: "Validate", as: "validated" },
      ],
    }
    const lines = buildPatchOperationHintLines(
      "Move the echo step to run after validate.",
      wf
    )
    const text = lines.join("\n")
    expect(text).toContain("MOVE STEP echo AFTER validate")
    expect(text).toContain("Current step order: echo, validate")
    expect(text).toContain("do not ADD STEP validate")
    expect(text).not.toContain("UPDATE STEP echo")
  })

  it("collectPatchGoalFeedback flags wrong step order after move request", () => {
    const baseline: WorkflowManifest = {
      schema: "@ecp.workflow",
      version: "1.0.0",
      workflow: { id: "echo-validate", label: "Echo validate reorder" },
      steps: [
        { type: "step", id: "echo", uses: "@ecp/test.echo", label: "Echo", as: "echo" },
        { type: "step", id: "validate", uses: "@ecp/demo.validate", label: "Validate", as: "validated" },
      ],
    }
    const feedback = collectPatchGoalFeedback(
      "Move the echo step to run after validate.",
      baseline,
      summary,
      baseline
    )
    expect(
      feedback?.some((f) => f.issues.some((i) => i.message.includes("MOVE STEP echo AFTER validate")))
    ).toBe(true)
  })
})
