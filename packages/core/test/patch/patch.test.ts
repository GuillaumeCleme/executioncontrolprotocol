import { describe, expect, it } from "vitest"
import { workflow, step, applyPatch, buildStepIndex, parallel } from "../../src/index.js"
import type { WorkflowManifest } from "@ecp/types"

function weeklyBriefManifest(): WorkflowManifest {
  return workflow("Weekly Brief")
    .id("weekly-brief")
    .run([
      step("@ecp/memory.search", "Collect Signals")
        .id("collect-signals")
        .with({ query: "risks", since: "7d" })
        .as("signals"),
      step("@ecp/openai.generate", "Write Brief")
        .id("write-brief")
        .with({
          prompt: "Create a brief",
          options: { maxWords: 100, tone: "neutral" },
        })
        .as("brief"),
    ])
    .toManifest()
}

describe("applyPatch", () => {
  it("applies shorthand patch using step id path", async () => {
    const manifest = weeklyBriefManifest()
    const patched = applyPatch(manifest, {
      "steps[write-brief].input": {
        prompt: "Create a concise executive brief.",
      },
    })

    expect(patched.success).toBe(true)
    const index = buildStepIndex(patched.result!)
    const path = index.pathsById.get("write-brief")!
    const stepNode = path.match(/^steps\[(\d+)\]/)?.[1]
    const stepAt = patched.result!.steps[Number(stepNode)] as import("@ecp/types").StepNode
    expect(stepAt.input?.prompt).toBe("Create a concise executive brief.")
  })

  it("deep merges by default", () => {
    const manifest = weeklyBriefManifest()
    const patched = applyPatch(manifest, {
      "steps[write-brief].input.options": {
        tone: "executive",
      },
    })

    expect(patched.success).toBe(true)
    const index = buildStepIndex(patched.result!)
    const stepNode = patched.result!.steps[
      Number(index.pathsById.get("write-brief")!.match(/^steps\[(\d+)\]/)?.[1])
    ] as import("@ecp/types").StepNode
    expect(stepNode.input?.options).toMatchObject({ tone: "executive", maxWords: 100 })
  })

  it("replaces when mode is replace", () => {
    const manifest = weeklyBriefManifest()
    const patched = applyPatch(manifest, [
      {
        path: "steps[write-brief].input",
        mode: "replace",
        value: { prompt: "Only this remains." },
      },
    ])

    expect(patched.success).toBe(true)
    const index = buildStepIndex(patched.result!)
    const stepNode = patched.result!.steps[
      Number(index.pathsById.get("write-brief")!.match(/^steps\[(\d+)\]/)?.[1])
    ] as import("@ecp/types").StepNode
    expect(stepNode.input).toEqual({ prompt: "Only this remains." })
  })

  it("fails when duplicate step ids exist", () => {
    const duplicate: WorkflowManifest = {
      schema: "@ecp.workflow",
      version: "1.0",
      workflow: { id: "dup" },
      steps: [
        { type: "step", id: "write-brief", uses: "@ecp/test.echo", input: {} },
        { type: "step", id: "write-brief", uses: "@ecp/test.echo", input: {} },
      ],
    }

    const patched = applyPatch(duplicate, {
      "steps[write-brief].input": { prompt: "x" },
    })

    expect(patched.success).toBe(false)
    expect(patched.diagnostics.some((d) => d.code === "DUPLICATE_STEP_ID")).toBe(true)
  })

  it("returns PATCH_PATH_NOT_FOUND for unknown step id", () => {
    const manifest = weeklyBriefManifest()
    const patched = applyPatch(manifest, {
      "steps[unknown-step].input": { prompt: "x" },
    })
    expect(patched.success).toBe(false)
    expect(patched.diagnostics.some((d) => d.code === "PATCH_PATH_NOT_FOUND")).toBe(true)
  })

  it("resolves nested parallel step paths", () => {
    const manifest = workflow("Nested")
      .run([
        parallel([
          [step("@ecp/test.echo", "Inner").with({ value: "a" }).as("inner")],
        ]),
      ])
      .toManifest()
    const parallelNode = manifest.steps[0] as import("@ecp/types").ParallelNode
    const innerStep = parallelNode.branches[0]![0] as import("@ecp/types").StepNode
    const index = buildStepIndex(manifest)
    const innerPath = index.pathsById.get(innerStep.id)
    expect(innerPath).toMatch(/^steps\[0\]\.branches\[/)
    const patched = applyPatch(manifest, {
      [`steps[${innerStep.id}].input`]: { value: "patched" },
    })
    expect(patched.success).toBe(true)
  })
})

describe("assignUniqueStepIds via toManifest", () => {
  it("assigns unique ids for duplicate labels", () => {
    const manifest = workflow("Dup labels")
      .run([
        step("@ecp/test.echo", "Echo").with({ value: "a" }).as("o"),
        step("@ecp/test.echo", "Echo").with({ value: "b" }).as("o2"),
      ])
      .toManifest()

    const ids = manifest.steps.map((s) => (s as import("@ecp/types").StepNode).id)
    expect(new Set(ids).size).toBe(2)
  })
})
