import { describe, expect, it } from "vitest"
import {
  environment,
  extension,
  workflow,
  step,
  ref,
  compileWorkflowSource,
  normalizeWorkflowManifest,
} from "@ecp/core"
import { registerFormatFluentExtension } from "../src/index.js"

describe("Fluent encoder", () => {
  it("encodes workflow manifest to Fluent API source", async () => {
    await registerFormatFluentExtension()
    const manifest = workflow("Weekly Brief")
      .id("weekly-brief")
      .run([
        step("@ecp/memory.search", "Collect")
          .id("collect")
          .with({ query: "q" })
          .as("signals"),
      ])
      .toManifest()

    const env = environment("test").withExtensions([
      extension("@ecp/format-fluent").with({}),
    ])

    const encoded = await env
      .encode(manifest)
      .uses("@ecp/format-fluent")
      .process()

    expect(encoded.format).toBe("fluent")
    expect(String(encoded.content)).toContain("export default workflow")
    expect(String(encoded.content)).toContain("step(")
  })

  it("generated Fluent source compiles back to manifest", async () => {
    await registerFormatFluentExtension()
    const manifest = workflow("W")
      .run([
        step("@ecp/test.echo", "E")
          .with({ value: ref("signals.results") })
          .as("o"),
      ])
      .toManifest()

    const env = environment("test").withExtensions([
      extension("@ecp/format-fluent").with({}),
    ])

    const encoded = await env
      .encode(manifest)
      .uses("@ecp/format-fluent")
      .process()

    expect(String(encoded.content)).toContain('ref("signals.results")')

    const compiled = await compileWorkflowSource({
      source: String(encoded.content),
      filename: "generated.workflow.ts",
    })

    expect(compiled.ok).toBe(true)
    expect(normalizeWorkflowManifest(compiled.manifest!)).toEqual(
      normalizeWorkflowManifest(manifest)
    )
  })
})
