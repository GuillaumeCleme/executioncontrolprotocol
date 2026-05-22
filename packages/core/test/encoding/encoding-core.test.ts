import { describe, expect, it } from "vitest"
import {
  environment,
  extension,
  workflow,
  step,
  registerTestExtension,
  hook,
  defineExtension,
} from "../../src/index.js"
import { registerFormatToonExtension } from "@ecp/format-toon"

const sampleManifest = workflow("Weekly Brief")
  .id("weekly-brief")
  .run([
    step("@ecp/test.echo", "Collect")
      .id("collect")
      .with({ value: "hello" })
      .as("signals"),
  ])
  .toManifest()

describe("env.encode/decode", () => {
  it("returns an encode operation builder", () => {
    const env = environment("test")
    const builder = env.encode(sampleManifest)
    expect(builder.uses).toBeTypeOf("function")
    expect(builder.process).toBeTypeOf("function")
  })

  it("encodes JSON by default when no extension is used", async () => {
    const env = environment("test")
    const encoded = await env.encode(sampleManifest).process()
    expect(encoded.schema).toBe("@ecp.encoded")
    expect(encoded.format).toBe("json")
    expect(encoded.content).toEqual(sampleManifest)
  })

  it("decodes JSON by default when no extension is used", async () => {
    const env = environment("test")
    const decoded = await env.decode(JSON.stringify(sampleManifest)).process()
    expect(decoded.schema).toBe("@ecp.decoded")
    expect(decoded.document).toEqual(sampleManifest)
  })

  it("fails when encoder extension is not registered", async () => {
    const env = environment("test")
    await expect(
      env.encode(sampleManifest).uses("@ecp/format-toon").process()
    ).rejects.toMatchObject({
      code: "FORMAT_EXTENSION_NOT_FOUND",
    })
  })

  it("encodes TOON when extension is registered", async () => {
    await registerFormatToonExtension()
    const env = environment("test").withExtensions([
      extension("@ecp/format-toon").with({}),
    ])
    const encoded = await env
      .encode(sampleManifest)
      .uses("@ecp/format-toon")
      .process()
    expect(encoded.format).toBe("toon")
    expect(String(encoded.content)).toContain("schema: @ecp.workflow")
    expect(String(encoded.content)).toContain("steps[")
  })
})

describe("encode/decode lifecycle isolation", () => {
  it("does not emit run or step lifecycle during encode/decode", async () => {
    const events: string[] = []
    await registerTestExtension()
    await registerFormatToonExtension()

    const spy = defineExtension("@ecp", "telemetry-spy")
      .withHooks([
        hook("run:before", async () => {
          events.push("run:before")
        }),
        hook("step:started", async () => {
          events.push("step:started")
        }),
      ])
      .build()

    const { globalRegistry } = await import("../../src/registry/registry.js")
    if (!globalRegistry.getExtension("@ecp/telemetry-spy")) {
      await globalRegistry.registerExtension(spy)
    }

    const env = environment("test").withExtensions([
      extension("@ecp/telemetry-spy").with({}),
      extension("@ecp/format-toon").with({}),
    ])

    const toon = await env.encode(sampleManifest).uses("@ecp/format-toon").process()

    await env.decode(toon.content).uses("@ecp/format-toon").process()

    expect(events).toEqual([])
  })
})
