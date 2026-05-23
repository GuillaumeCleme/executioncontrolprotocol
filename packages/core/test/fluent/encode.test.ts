import { describe, expect, it } from "vitest"
import {
  workflow,
  step,
  ref,
  normalizeWorkflowManifest,
  renderWorkflowToFluent,
  encodeFluent,
} from "../../src/index.js"
import { compileWorkflowSource } from "../../src/compile/index.js"
import { ECP_FORMATS } from "@ecp/types"
import { initEncodingTestEcp } from "../helpers.js"

describe("renderWorkflowToFluent", () => {
  it("renders workflow manifest to Fluent API source", () => {
    const manifest = workflow("Weekly Brief")
      .id("weekly-brief")
      .run([
        step("@ecp/memory.search", "Collect")
          .id("collect")
          .with({ query: "q" })
          .as("signals"),
      ])
      .toManifest()

    const source = renderWorkflowToFluent(manifest)
    expect(source).toContain("export default workflow")
    expect(source).toContain("step(")
    expect(source).not.toContain('.id("collect")')
  })

  it("generated Fluent source compiles back to manifest", async () => {
    const manifest = workflow("W")
      .run([
        step("@ecp/test.echo", "E")
          .with({ value: ref("signals.results") })
          .as("o"),
      ])
      .toManifest()

    const source = renderWorkflowToFluent(manifest)
    expect(source).toContain('ref("signals.results")')

    const compiled = await compileWorkflowSource({
      source,
      filename: "generated.workflow.ts",
    })

    expect(compiled.ok).toBe(true)
    expect(normalizeWorkflowManifest(compiled.manifest!)).toEqual(
      normalizeWorkflowManifest(manifest)
    )
  })

  it("toFluentSource on builder matches renderWorkflowToFluent", () => {
    const builder = workflow("Echo").run([
      step("@ecp/test.echo", "E").with({ value: "x" }).as("o"),
    ])
    expect(builder.toFluentSource()).toBe(renderWorkflowToFluent(builder.toManifest()))
  })
})

describe("encodeFluent", () => {
  it("returns EncodeResult with fluent format", () => {
    const manifest = workflow("Echo")
      .run([step("@ecp/test.echo", "E").with({ value: "x" }).as("o")])
      .toManifest()

    const encoded = encodeFluent(manifest)
    expect(encoded.success).toBe(true)
    expect(encoded.format).toBe(ECP_FORMATS.FLUENT)
    expect(String(encoded.result)).toContain("export default workflow")
  })
})

describe("env.encode built-in fluent", () => {
  it("encodes without format extension registration", async () => {
    const manifest = workflow("Echo")
      .run([step("@ecp/test.echo", "E").with({ value: "x" }).as("o")])
      .toManifest()

    const ecp = await initEncodingTestEcp()
    const encoded = await ecp.encode(manifest).as("fluent").process()
    await ecp.terminate()

    expect(encoded.success).toBe(true)
    expect(encoded.format).toBe("fluent")
  })
})
