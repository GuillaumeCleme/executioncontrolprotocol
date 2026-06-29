import { describe, expect, it } from "vitest"
import {
  buildPatchOperationHintLines,
  buildRequestCapabilityHintLines,
  collectCreateCapabilityFeedback,
  collectPatchGoalFeedback,
  inferPatchTargetStepId,
  inferRequiredCapabilityIds,
} from "../../../harnesses/browser-nano/src/_internal/request-capability-hints.js"
import type { CompactEnvironmentSummary } from "@executioncontrolprotocol/core"
import type { WorkflowManifest } from "@executioncontrolprotocol/types"

const summary: CompactEnvironmentSummary = {
  extensions: [{ id: "@executioncontrolprotocol/demo", capabilities: ["@executioncontrolprotocol/demo.summarize", "@executioncontrolprotocol/demo.notify"] }],
  capabilities: [
    { id: "@executioncontrolprotocol/test.echo", extension: "@executioncontrolprotocol/test", inputs: ["value"], outputs: ["text"] },
    { id: "@executioncontrolprotocol/demo.summarize", extension: "@executioncontrolprotocol/demo", inputs: ["text"], outputs: [] },
    { id: "@executioncontrolprotocol/demo.notify", extension: "@executioncontrolprotocol/demo", inputs: ["payload"], outputs: [] },
    { id: "@executioncontrolprotocol/demo.validate", extension: "@executioncontrolprotocol/demo", inputs: ["payload"], outputs: [] },
    { id: "@executioncontrolprotocol/demo.translate", extension: "@executioncontrolprotocol/demo", inputs: ["text"], outputs: [] },
  ],
}

describe("request-capability-hints", () => {
  it("infers echo and summarize from natural language", () => {
    const ids = inferRequiredCapabilityIds(
      "Create a workflow with echo (@executioncontrolprotocol/test.echo) then summarize (@executioncontrolprotocol/demo.summarize)",
      summary.capabilities.map((c) => c.id)
    )
    expect(ids).toContain("@executioncontrolprotocol/test.echo")
    expect(ids).toContain("@executioncontrolprotocol/demo.summarize")
  })

  it("infers validate when capability id appears in request", () => {
    const ids = inferRequiredCapabilityIds(
      "Build a workflow: first @executioncontrolprotocol/demo.validate then @executioncontrolprotocol/test.echo.",
      summary.capabilities.map((c) => c.id)
    )
    expect(ids).toContain("@executioncontrolprotocol/demo.validate")
    expect(ids).toContain("@executioncontrolprotocol/test.echo")
  })

  it("does not treat Validate then echo as validate capability", () => {
    const ids = inferRequiredCapabilityIds(
      "Validate then echo with hello input",
      summary.capabilities.map((c) => c.id)
    )
    expect(ids).toContain("@executioncontrolprotocol/test.echo")
    expect(ids).not.toContain("@executioncontrolprotocol/demo.validate")
  })

  it("collectCreateCapabilityFeedback accepts steps without type field", () => {
    const wf: WorkflowManifest = {
      schema: "@executioncontrolprotocol.workflow",
      version: "1.0.0",
      workflow: { id: "w", label: "W" },
      steps: [
        {
          id: "echo",
          uses: "@executioncontrolprotocol/test.echo",
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
      schema: "@executioncontrolprotocol.workflow",
      version: "1.0.0",
      workflow: { id: "w", label: "W" },
      steps: [
        {
          type: "step",
          id: "echo",
          label: "Echo",
          uses: "@executioncontrolprotocol/test.echo",
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
    expect(ids).toContain("@executioncontrolprotocol/demo.translate")
    expect(ids).not.toContain("@executioncontrolprotocol/demo.summarize")
  })

  it("buildPatchOperationHintLines provides workflow context and operation selection", () => {
    const wf: WorkflowManifest = {
      schema: "@executioncontrolprotocol.workflow",
      version: "1.0.0",
      workflow: { id: "two-step", label: "Two" },
      steps: [
        {
          type: "step",
          id: "echo",
          uses: "@executioncontrolprotocol/test.echo",
          label: "Echo",
          as: "echo",
        },
        {
          type: "step",
          id: "summarize",
          uses: "@executioncontrolprotocol/demo.summarize",
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
      schema: "@executioncontrolprotocol.workflow",
      version: "1.0.0",
      workflow: { id: "two-step-chain", label: "Two step chain" },
      steps: [
        {
          type: "step",
          id: "echo",
          uses: "@executioncontrolprotocol/test.echo",
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
      schema: "@executioncontrolprotocol.workflow",
      version: "1.0.0",
      workflow: { id: "two-step-chain", label: "Two" },
      steps: [
        {
          type: "step",
          id: "echo",
          uses: "@executioncontrolprotocol/test.echo",
          label: "Echo",
          as: "echo",
        },
        {
          type: "step",
          id: "summarize",
          uses: "@executioncontrolprotocol/demo.summarize",
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
      schema: "@executioncontrolprotocol.workflow",
      version: "1.0.0",
      workflow: { id: "two-step-chain", label: "Two" },
      steps: [
        {
          type: "step",
          id: "echo",
          uses: "@executioncontrolprotocol/test.echo",
          label: "Echo",
          as: "echo",
        },
        {
          type: "step",
          id: "summarize",
          uses: "@executioncontrolprotocol/demo.summarize",
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
    expect(text).toContain("ADD STEP translate USES @executioncontrolprotocol/demo.translate AFTER echo")
    expect(text).not.toContain("for the new capability")
    expect(text).toContain("Do not UPDATE STEP summarize")
  })

  it("buildRequestCapabilityHintLines patch mode does not inject operation templates", () => {
    const lines = buildRequestCapabilityHintLines(
      "Add a summarize step after echo using @executioncontrolprotocol/demo.summarize.",
      summary,
      { mode: "patch" }
    )
    const text = lines.join("\n")
    expect(text).not.toContain("ADD STEP summarize USES @executioncontrolprotocol/demo.summarize")
    expect(text).not.toContain("Required: 1 step(s) in order")
  })

  it("collectPatchGoalFeedback flags insert validate on echo-only workflow", () => {
    const baseline: WorkflowManifest = {
      schema: "@executioncontrolprotocol.workflow",
      version: "1.0.0",
      workflow: { id: "echo-only", label: "Echo" },
      steps: [
        {
          type: "step",
          id: "echo",
          uses: "@executioncontrolprotocol/test.echo",
          label: "Echo",
          as: "echo",
        },
      ],
    }
    const feedback = collectPatchGoalFeedback(
      "Insert a validate step before echo using @executioncontrolprotocol/demo.validate.",
      baseline,
      summary,
      baseline
    )
    expect(
      feedback?.some((f) => f.issues.some((i) => i.message.includes("@executioncontrolprotocol/demo.validate")))
    ).toBe(true)
  })

  it("collectPatchGoalFeedback flags wrong label capitalization", () => {
    const wf: WorkflowManifest = {
      schema: "@executioncontrolprotocol.workflow",
      version: "1.0.0",
      workflow: { id: "echo-test", label: "Echo" },
      steps: [
        {
          type: "step",
          id: "echo",
          label: "patched echo",
          uses: "@executioncontrolprotocol/test.echo",
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
      schema: "@executioncontrolprotocol.workflow",
      version: "1.0.0",
      workflow: { id: "echo-validate", label: "Echo validate reorder" },
      steps: [
        { type: "step", id: "echo", uses: "@executioncontrolprotocol/test.echo", label: "Echo", as: "echo" },
        { type: "step", id: "validate", uses: "@executioncontrolprotocol/demo.validate", label: "Validate", as: "validated" },
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

  it("infers echo step id from rename label request", () => {
    expect(
      inferPatchTargetStepId("Rename echo label to Translated Output.", ["echo", "summarize"])
    ).toBe("echo")
  })

  it("collectPatchGoalFeedback flags delete instead of move", () => {
    const baseline: WorkflowManifest = {
      schema: "@executioncontrolprotocol.workflow",
      version: "1.0.0",
      workflow: { id: "echo-validate", label: "Echo validate reorder" },
      steps: [
        { type: "step", id: "echo", uses: "@executioncontrolprotocol/test.echo", label: "Echo", as: "echo" },
        { type: "step", id: "validate", uses: "@executioncontrolprotocol/demo.validate", label: "Validate", as: "validated" },
      ],
    }
    const patched: WorkflowManifest = {
      ...baseline,
      steps: [
        { type: "step", id: "validate", uses: "@executioncontrolprotocol/demo.validate", label: "Validate", as: "validated" },
      ],
    }
    const feedback = collectPatchGoalFeedback(
      "Move the echo step to run after validate.",
      patched,
      summary,
      baseline
    )
    expect(
      feedback?.some((f) => f.issues.some((i) => i.message.includes("Do not DELETE STEP echo")))
    ).toBe(true)
  })

  it("collectPatchGoalFeedback flags wrong step order after move request", () => {
    const baseline: WorkflowManifest = {
      schema: "@executioncontrolprotocol.workflow",
      version: "1.0.0",
      workflow: { id: "echo-validate", label: "Echo validate reorder" },
      steps: [
        { type: "step", id: "echo", uses: "@executioncontrolprotocol/test.echo", label: "Echo", as: "echo" },
        { type: "step", id: "validate", uses: "@executioncontrolprotocol/demo.validate", label: "Validate", as: "validated" },
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
