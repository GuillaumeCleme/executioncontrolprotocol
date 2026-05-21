import { describe, expect, it } from "vitest"
import {
  environment,
  extension,
  workflow,
  step,
  ref,
  normalizeWorkflowManifest,
} from "@ecp/core"
import { registerFormatToonExtension } from "../src/index.js"

describe("TOON round trip", () => {
  it("round trips refs", async () => {
    await registerFormatToonExtension()
    const manifest = workflow("Ref Test")
      .run([
        step("@ecp/test.echo", "S")
          .with({ context: ref("signals.results") })
          .as("out"),
      ])
      .toManifest()

    const env = environment("test").withExtensions([
      extension("@ecp/format-toon").with({}),
    ])

    const toon = await env.encode(manifest).uses("@ecp/format-toon").process()
    expect(String(toon.content)).toContain("$signals.results")

    const decoded = await env.decode(toon.content).uses("@ecp/format-toon").process()
    const step0 = decoded.document.steps[0] as import("@ecp/types").StepNode
    expect(step0.input?.context).toEqual({ $ref: "state.signals.results" })
  })

  it("round trips full manifest", async () => {
    await registerFormatToonExtension()
    const manifest = workflow("Echo")
      .id("echo-wf")
      .run([step("@ecp/test.echo", "E").with({ value: "x" }).as("o")])
      .toManifest()

    const env = environment("test").withExtensions([
      extension("@ecp/format-toon").with({}),
    ])

    const toon = await env.encode(manifest).uses("@ecp/format-toon").process()
    const decoded = await env.decode(toon.content).uses("@ecp/format-toon").process()

    expect(normalizeWorkflowManifest(decoded.document)).toEqual(
      normalizeWorkflowManifest(manifest)
    )
  })
})
