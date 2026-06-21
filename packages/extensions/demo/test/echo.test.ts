import { describe, expect, it } from "vitest"
import { environment, extension, runtime, workflow, step } from "@executioncontrolprotocol/core"
import { NODE_RUNTIME_ID, registerNodeRuntime } from "@executioncontrolprotocol/node"
import { registerDemoExtension } from "../src/index.js"

describe("@executioncontrolprotocol/demo.echo", () => {
  it("echoes input value with default fallback", async () => {
    await registerNodeRuntime()
    await registerDemoExtension()

    const env = environment("demo-echo-test")
      .withRuntime(runtime(NODE_RUNTIME_ID))
      .withExtensions([extension("@executioncontrolprotocol/demo").with({})])
    const ecp = await env.init()

    const invoked = await ecp
      .invoke("@executioncontrolprotocol/demo.echo")
      .with({ value: "hello" })
      .process()
    expect(invoked.success).toBe(true)
    expect(invoked.result).toEqual({ echo: "hello" })

    const manifest = workflow("Echo")
      .run([step("@executioncontrolprotocol/demo.echo", "Echo").with({ value: "run" }).as("echo")])
      .toManifest()
    const run = await ecp.run(manifest)
    expect(run.run.status).toBe("completed")
    expect(run.state.echo).toEqual({ echo: "run" })

    await ecp.terminate()
  })
})
