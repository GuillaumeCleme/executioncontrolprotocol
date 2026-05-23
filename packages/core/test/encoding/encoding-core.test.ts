import { describe, expect, it } from "vitest"
import {
  environment,
  extension,
  workflow,
  step,
  runtime,
  registerTestExtension,
  hook,
  defineExtension,
} from "../../src/index.js"
import { NODE_RUNTIME_ID, registerNodeRuntime } from "@ecp/node"
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
    expect(encoded.schema).toBe("@ecp.encode.result")
    expect(encoded.success).toBe(true)
    expect(encoded.format).toBe("json")
    expect(encoded.result).toEqual(sampleManifest)
  })

  it("decodes JSON by default when no extension is used", async () => {
    const env = environment("test")
    const decoded = await env.decode(JSON.stringify(sampleManifest)).process()
    expect(decoded.schema).toBe("@ecp.decode.result")
    expect(decoded.success).toBe(true)
    expect(decoded.result).toEqual(sampleManifest)
  })

  it("fails when encoder extension is not registered", async () => {
    const env = environment("test")
    await expect(
      env.encode(sampleManifest).uses("@ecp/format-toon").process()
    ).rejects.toThrow(/not registered/)
  })

  it("encodes TOON when extension is registered", async () => {
    await registerFormatToonExtension()
    const env = environment("test").withExtensions([
      extension("@ecp/format-toon").with({}),
    ])
    const encoded = await env
      .encode(sampleManifest)
      .uses("@ecp/format-toon")
      .to("@ecp.workflow")
      .process()
    expect(encoded.format).toBe("toon")
    expect(encoded.success).toBe(true)
    expect(String(encoded.result)).toContain("schema: @ecp.workflow")
    expect(String(encoded.result)).toContain("steps[")
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
        hook("step:before", async () => {
          events.push("step:before")
        }),
      ])
      .build()

    const env = environment("test").withExtensions([
      extension("@ecp/test").with({}),
      extension(spy).with({}),
      extension("@ecp/format-toon").with({}),
    ])

    const toon = await env.encode(sampleManifest).uses("@ecp/format-toon").process()
    expect(toon.success).toBe(true)
    await env.decode(toon.result).uses("@ecp/format-toon").process()

    expect(events).not.toContain("run:before")
    expect(events).not.toContain("step:before")
  })
})

describe("env.init", () => {
  it("initializes an Ecp operational instance", async () => {
    await registerNodeRuntime()
    await registerTestExtension()
    const env = environment("test")
      .withRuntime(runtime(NODE_RUNTIME_ID))
      .withExtensions([extension("@ecp/test").with({})])
    const ecp = await env.init()
    expect(ecp.encode).toBeTypeOf("function")
    expect(ecp.decode).toBeTypeOf("function")
    expect(ecp.patch).toBeTypeOf("function")
    expect(ecp.terminate).toBeTypeOf("function")
    await ecp.terminate()
  })
})
