import { describe, expect, it } from "vitest"
import type { EnvironmentDescriptor, WorkflowManifest } from "@ecp/types"
import { LATEST_ECP_VERSION, StepNode } from "@ecp/types"
import {
  environment,
  extension,
  workflow,
  step,
  ref,
  normalizeWorkflowManifest,
} from "@ecp/core"
import { registerFormatToonExtension } from "../src/index.js"
import { encodeDocumentToToon, decodeDocumentFromToon } from "../src/toon-codec.js"

/** JSON-safe describe fixture (no Zod schemas). Extension tests must not depend on live describe(). */
function sampleDescribeFixture(): EnvironmentDescriptor {
  return {
    schema: "@ecp.environment.describe",
    version: LATEST_ECP_VERSION,
    environment: { id: "disc", label: "Discovery" },
    runtime: { id: "@ecp/in-memory", features: {} },
    extensions: [
      { id: "@ecp/test", order: 0, capabilities: ["@ecp/test.echo"] },
    ],
    capabilities: [
      { id: "@ecp/test.echo", label: "Echo", extension: "@ecp/test" },
    ],
    policies: [],
  }
}

describe("TOON round trip (@toon-format/toon)", () => {
  it("round trips workflow refs", async () => {
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
    const decoded = await env.decode(toon.content).uses("@ecp/format-toon").process()
    const step0 = (decoded.document as WorkflowManifest).steps[0] as StepNode
    expect(step0.input?.context).toEqual({ $ref: "state.signals.results" })
  })

  it("round trips full workflow manifest", async () => {
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

    expect(normalizeWorkflowManifest(decoded.document as WorkflowManifest)).toEqual(
      normalizeWorkflowManifest(manifest)
    )
  })

  it("round trips environment manifest", async () => {
    const manifest = {
      schema: "@ecp.environment" as const,
      version: LATEST_ECP_VERSION,
      environment: { id: "test-env", label: "Test" },
      extensions: [{ id: "@ecp/test", order: 0, config: {} }],
    }

    const text = encodeDocumentToToon(manifest)
    const restored = decodeDocumentFromToon(text) as typeof manifest
    expect(restored).toEqual(manifest)
  })

  it("round trips environment describe via encode/decode", async () => {
    await registerFormatToonExtension()
    const descriptor = sampleDescribeFixture()
    const env = environment("test").withExtensions([
      extension("@ecp/format-toon").with({}),
    ])

    const encoded = await env.encode(descriptor).uses("@ecp/format-toon").process()
    expect(encoded.sourceSchema).toBe("@ecp.environment.describe")

    const decoded = await env.decode(encoded.content).uses("@ecp/format-toon").process()
    expect(decoded.targetSchema).toBe("@ecp.environment.describe")
    expect(decoded.document).toEqual(descriptor)
  })

  it("encodes unknown schema without validation errors", async () => {
    await registerFormatToonExtension()
    const doc = { schema: "@ecp.custom.future", version: "1.0", data: { ok: true } }
    const env = environment("test").withExtensions([
      extension("@ecp/format-toon").with({}),
    ])
    const encoded = await env.encode(doc).uses("@ecp/format-toon").process()
    expect(encoded.diagnostics).toEqual([])
    const decoded = await env.decode(encoded.content).uses("@ecp/format-toon").process()
    expect(decoded.document).toEqual(doc)
  })
})
