import { describe, expect, it } from "vitest"
import { environment, extension, registerTestExtension, runtime } from "@executioncontextprotocol/core"
import { NODE_RUNTIME_ID, registerNodeRuntime } from "@executioncontextprotocol/node"
import { registerDemoExtension } from "../src/index.js"
import { registerFormatEqlExtension } from "@executioncontextprotocol/format-eql"

describe("@executioncontextprotocol/demo generateText EQL", () => {
  it("returns workflow EQL with USES (not capabilityId)", async () => {
    await registerNodeRuntime()
    await registerDemoExtension()
    await registerTestExtension()
    await registerFormatEqlExtension()

    const env = environment("demo-test")
      .withRuntime(runtime(NODE_RUNTIME_ID))
      .withExtensions([
        extension("@executioncontextprotocol/demo").with({}),
        extension("@executioncontextprotocol/format-eql").with({}),
        extension("@executioncontextprotocol/test").with({}),
      ])
    const ecp = await env.init()

    const generated = await ecp
      .invoke("@executioncontextprotocol/demo.generateText")
      .with({ prompt: "build me a workflow" })
      .process()
    expect(generated.success).toBe(true)

    const text =
      typeof generated.result === "object" &&
      generated.result !== null &&
      "text" in generated.result
        ? String((generated.result as { text: string }).text)
        : String(generated.result)
    expect(text).toContain("USES @executioncontextprotocol/test.echo")
    expect(text).not.toContain("capabilityId")

    const decoded = await ecp
      .decode(text)
      .uses("@executioncontextprotocol/format-eql")
      .to("@ecp.workflow")
      .with({ headers: false })
      .process()
    expect(decoded.success).toBe(true)

    const manifest = decoded.result as { steps: Array<{ uses?: string }> }
    expect(manifest.steps[0]?.uses).toBe("@executioncontextprotocol/test.echo")

    const validation = await ecp.validate(manifest as never)
    expect(validation.valid).toBe(true)
  })
})
