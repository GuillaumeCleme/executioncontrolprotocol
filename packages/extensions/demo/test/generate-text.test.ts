import { describe, expect, it } from "vitest"
import { environment, extension, registerTestExtension, runtime } from "@ecp/core"
import { NODE_RUNTIME_ID, registerNodeRuntime } from "@ecp/node"
import { registerDemoExtension } from "../src/index.js"
import { registerFormatToonExtension } from "@ecp/format-toon"

describe("@ecp/demo generateText TOON", () => {
  it("returns workflow TOON with uses (not capabilityId)", async () => {
    await registerNodeRuntime()
    await registerDemoExtension()
    await registerTestExtension()
    await registerFormatToonExtension()

    const env = environment("demo-test")
      .withRuntime(runtime(NODE_RUNTIME_ID))
      .withExtensions([
        extension("@ecp/demo").with({}),
        extension("@ecp/format-toon").with({}),
        extension("@ecp/test").with({}),
      ])
    const ecp = await env.init()

    const generated = await ecp
      .invoke("@ecp/demo.generateText")
      .with({ prompt: "build me a workflow" })
      .process()
    expect(generated.success).toBe(true)

    const text =
      typeof generated.result === "object" &&
      generated.result !== null &&
      "text" in generated.result
        ? String((generated.result as { text: string }).text)
        : String(generated.result)
    expect(text).toContain("uses")
    expect(text).not.toContain("capabilityId")

    const decoded = await ecp
      .decode(text)
      .uses("@ecp/format-toon")
      .to("@ecp.workflow")
      .with({ headers: false, compact: true })
      .process()
    expect(decoded.success).toBe(true)

    const manifest = decoded.result as { steps: Array<{ uses?: string }> }
    expect(manifest.steps[0]?.uses).toBe("@ecp/test.echo")

    const validation = await ecp.validate(manifest as never)
    expect(validation.valid).toBe(true)
  })
})
