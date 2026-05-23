import { describe, expect, it } from "vitest"
import {
  environment,
  extension,
  compileWorkflowSource,
  normalizeWorkflowManifest,
  registerTestExtension,
} from "../../src/index.js"
import { registerFormatToonExtension } from "@ecp/format-toon"
import { registerFormatFluentExtension } from "@ecp/format-fluent"

const fluentSource = `
import { workflow, step, ref } from "@ecp/core";

export default workflow("Weekly Brief")
  .id("weekly-brief")
  .run([
    step("@ecp/test.echo", "Collect Signals")
      .id("collect-signals")
      .with({ value: "weekly" })
      .as("signals"),
  ]);
`

describe("full format round trip", () => {
  it("round trips Fluent → JSON → TOON → JSON → Fluent", async () => {
    await registerTestExtension()
    await registerFormatToonExtension()
    await registerFormatFluentExtension()

    const env = environment("test").withExtensions([
      extension("@ecp/format-toon").with({}),
      extension("@ecp/format-fluent").with({}),
    ])

    const compiledA = await compileWorkflowSource({
      source: fluentSource,
      filename: "workflow.ts",
    })
    expect(compiledA.ok).toBe(true)
    const manifestA = compiledA.manifest!

    const toon = await env.encode(manifestA).uses("@ecp/format-toon").process()

    const decoded = await env.decode(toon.result).uses("@ecp/format-toon").process()

    const manifestB = decoded.result

    const fluent = await env
      .encode(manifestB)
      .uses("@ecp/format-fluent")
      .process()

    const compiledB = await compileWorkflowSource({
      source: String(fluent.result),
      filename: "workflow.generated.ts",
    })

    expect(compiledB.ok).toBe(true)
    expect(normalizeWorkflowManifest(compiledB.manifest!)).toEqual(
      normalizeWorkflowManifest(manifestA)
    )
  })
})
