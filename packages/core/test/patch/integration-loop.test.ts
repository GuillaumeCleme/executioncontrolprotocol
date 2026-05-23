import { describe, expect, it } from "vitest"
import {
  environment,
  extension,
  runtime,
  compileWorkflowSource,
  normalizeWorkflowManifest,
  registerTestExtension,
} from "../../src/index.js"
import { NODE_RUNTIME_ID, registerNodeRuntime } from "@ecp/node"
import { registerFormatToonExtension } from "@ecp/format-toon"
import { registerFormatFluentExtension } from "@ecp/format-fluent"
import type { WorkflowManifest } from "@ecp/types"

const fluentSource = `
import { workflow, step } from "@ecp/core";

export default workflow("Weekly Brief")
  .id("weekly-brief")
  .run([
    step("@ecp/test.echo", "Write Brief")
      .with({ value: "Create a brief", options: { maxWords: 100 } })
      .as("brief"),
  ]);
`

describe("patch compaction loop", () => {
  it("Fluent → JSON → TOON → patch decode → ecp.patch → compact TOON → Fluent", async () => {
    await registerNodeRuntime()
    await registerTestExtension()
    await registerFormatToonExtension()
    await registerFormatFluentExtension()

    const env = environment("test")
      .withRuntime(runtime(NODE_RUNTIME_ID))
      .withExtensions([
      extension("@ecp/test").with({}),
      extension("@ecp/format-toon").with({}),
      extension("@ecp/format-fluent").with({}),
      ])
    const ecp = await env.init()

    const compiledA = await compileWorkflowSource({
      source: fluentSource,
      filename: "workflow.ts",
    })
    expect(compiledA.ok).toBe(true)
    const manifestA = compiledA.manifest!

    const toon = await ecp
      .encode(manifestA)
      .uses("@ecp/format-toon")
      .to("@ecp.workflow")
      .with({ headers: false, compact: true })
      .process()
    expect(toon.success).toBe(true)

    const decodedWorkflow = await ecp
      .decode(toon.result)
      .uses("@ecp/format-toon")
      .to("@ecp.workflow")
      .with({ headers: false, compact: true })
      .process()
    expect(decodedWorkflow.success).toBe(true)

    const writeBriefId = (
      (decodedWorkflow.result as WorkflowManifest).steps[0] as import("@ecp/types").StepNode
    ).id

    const patched = await ecp
      .patch(decodedWorkflow.result as WorkflowManifest)
      .with({
        [`steps[${writeBriefId}].input`]: {
          value: "Create a concise executive brief.",
        },
      })
      .process()
    expect(patched.success).toBe(true)
    expect(patched.result).toBeDefined()

    const compactToon = await ecp
      .encode(patched.result!)
      .uses("@ecp/format-toon")
      .to("@ecp.workflow")
      .with({ headers: false, compact: true })
      .process()
    expect(compactToon.success).toBe(true)

    const decoded = await ecp
      .decode(compactToon.result)
      .uses("@ecp/format-toon")
      .to("@ecp.workflow")
      .with({ headers: false, compact: true })
      .process()
    expect(decoded.success).toBe(true)

    const fluent = await ecp
      .encode(decoded.result as WorkflowManifest)
      .uses("@ecp/format-fluent")
      .process()
    expect(fluent.success).toBe(true)

    const compiledB = await compileWorkflowSource({
      source: String(fluent.result),
      filename: "workflow.generated.ts",
    })
    expect(compiledB.ok).toBe(true)
    expect(normalizeWorkflowManifest(compiledB.manifest!)).toEqual(
      normalizeWorkflowManifest(patched.result!)
    )

    await ecp.terminate()
  })
})
