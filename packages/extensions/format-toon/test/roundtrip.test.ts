import { describe, expect, it } from "vitest"
import type { EnvironmentDescriptor, WorkflowManifest } from "@executioncontextprotocol/types"
import { LATEST_ECP_VERSION, StepNode } from "@executioncontextprotocol/types"
import {
  environment,
  extension,
  workflow,
  step,
  ref,
  normalizeWorkflowManifest,
  runtime,
} from "@executioncontextprotocol/core"
import { NODE_RUNTIME_ID, registerNodeRuntime } from "@executioncontextprotocol/node"
import { registerFormatToonExtension } from "../src/index.js"
import type { Ecp } from "@executioncontextprotocol/core"

async function initToonEcp(): Promise<Ecp> {
  await registerNodeRuntime()
  const env = environment("test")
    .withRuntime(runtime(NODE_RUNTIME_ID))
    .withExtensions([extension("@executioncontextprotocol/format-toon").with({})])
  return env.init()
}
import { encodeDocumentToToon, decodeDocumentFromToon } from "../src/toon-codec.js"

/** JSON-safe describe fixture (no Zod schemas). Extension tests must not depend on live describe(). */
function sampleDescribeFixture(): EnvironmentDescriptor {
  return {
    schema: "@ecp.environment.describe",
    version: LATEST_ECP_VERSION,
    environment: { id: "disc", label: "Discovery" },
    runtime: { id: "@executioncontextprotocol/in-memory", features: {} },
    extensions: [
      { id: "@executioncontextprotocol/test", order: 0, capabilities: ["@executioncontextprotocol/test.echo"] },
    ],
    capabilities: [
      { id: "@executioncontextprotocol/test.echo", label: "Echo", extension: "@executioncontextprotocol/test" },
    ],
    policies: [],
  }
}

describe("TOON round trip (@toon-format/toon)", () => {
  it("round trips workflow refs", async () => {
    await registerFormatToonExtension()
    const manifest = workflow("Ref Test")
      .run([
        step("@executioncontextprotocol/test.echo", "S")
          .with({ context: ref("signals.results") })
          .as("out"),
      ])
      .toManifest()

    const ecp = await initToonEcp()

    const toon = await ecp.encode(manifest).uses("@executioncontextprotocol/format-toon").process()
    const decoded = await ecp.decode(toon.result).uses("@executioncontextprotocol/format-toon").process()
    await ecp.terminate()
    const step0 = (decoded.result as WorkflowManifest).steps[0] as StepNode
    expect(step0.input?.context).toEqual({ $ref: "state.signals.results" })
  })

  it("round trips full workflow manifest", async () => {
    await registerFormatToonExtension()
    const manifest = workflow("Echo")
      .id("echo-wf")
      .run([step("@executioncontextprotocol/test.echo", "E").with({ value: "x" }).as("o")])
      .toManifest()

    const ecp = await initToonEcp()

    const toon = await ecp.encode(manifest).uses("@executioncontextprotocol/format-toon").process()
    const decoded = await ecp.decode(toon.result).uses("@executioncontextprotocol/format-toon").process()
    await ecp.terminate()

    expect(normalizeWorkflowManifest(decoded.result as WorkflowManifest)).toEqual(
      normalizeWorkflowManifest(manifest)
    )
  })

  it("round trips environment manifest", async () => {
    const manifest = {
      schema: "@ecp.environment" as const,
      version: LATEST_ECP_VERSION,
      environment: { id: "test-env", label: "Test" },
      extensions: [{ id: "@executioncontextprotocol/test", order: 0, config: {} }],
    }

    const text = encodeDocumentToToon(manifest)
    const restored = decodeDocumentFromToon(text) as typeof manifest
    expect(restored).toEqual(manifest)
  })

  it("round trips environment describe via encode/decode", async () => {
    await registerFormatToonExtension()
    const descriptor = sampleDescribeFixture()
    const ecp = await initToonEcp()

    const encoded = await ecp.encode(descriptor).uses("@executioncontextprotocol/format-toon").process()
    expect(encoded.sourceSchema).toBe("@ecp.environment.describe")

    const decoded = await ecp.decode(encoded.result).uses("@executioncontextprotocol/format-toon").process()
    await ecp.terminate()
    expect(decoded.targetSchema).toBe("@ecp.environment.describe")
    expect(decoded.result).toEqual(descriptor)
  })

  it("supports headerless compact TOON", async () => {
    await registerFormatToonExtension()
    const manifest = workflow("Echo")
      .run([step("@executioncontextprotocol/test.echo", "E").with({ value: "x" }).as("o")])
      .toManifest()

    const ecp = await initToonEcp()

    const encoded = await ecp
      .encode(manifest)
      .uses("@executioncontextprotocol/format-toon")
      .to("@ecp.workflow")
      .with({ headers: false, compact: true })
      .process()

    expect(encoded.success).toBe(true)
    expect(String(encoded.result)).not.toMatch(/^\s*schema:/m)

    const decoded = await ecp
      .decode(encoded.result)
      .uses("@executioncontextprotocol/format-toon")
      .to("@ecp.workflow")
      .with({ headers: false, compact: true })
      .process()
    expect(decoded.success).toBe(true)
    expect(normalizeWorkflowManifest(decoded.result as WorkflowManifest)).toEqual(
      normalizeWorkflowManifest(manifest)
    )
    await ecp.terminate()
  })

  it("round trips @ecp.patch headerless TOON via codec", async () => {
    await registerFormatToonExtension()
    const manifest = workflow("Echo")
      .run([step("@executioncontextprotocol/test.echo", "E").with({ value: "x" }).as("o")])
      .toManifest()
    const stepId = (manifest.steps[0] as StepNode).id
    const patchDoc = {
      schema: "@ecp.patch" as const,
      version: LATEST_ECP_VERSION,
      entries: [{ path: `steps[${stepId}].input`, value: { value: "y" } }],
    }
    const toon = encodeDocumentToToon(patchDoc, { headers: false, compact: true })
    const restored = decodeDocumentFromToon(toon) as typeof patchDoc
    expect(restored.schema).toBe("@ecp.patch")
    expect(restored.entries.length).toBe(1)
  })

  it("encodes unknown schema without validation errors", async () => {
    await registerFormatToonExtension()
    const doc = { schema: "@ecp.custom.future", version: "1.0", data: { ok: true } }
    const ecp = await initToonEcp()
    const encoded = await ecp.encode(doc).uses("@executioncontextprotocol/format-toon").process()
    expect(encoded.diagnostics).toEqual([])
    const decoded = await ecp.decode(encoded.result).uses("@executioncontextprotocol/format-toon").process()
    await ecp.terminate()
    expect(decoded.result).toEqual(doc)
  })
})
