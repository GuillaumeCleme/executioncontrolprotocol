import { describe, expect, it } from "vitest"
import { environment, extension, workflow, step, runtime } from "../src/index.js"
import { registerTestExtension } from "../src/testing/test-extension.js"
import { LOCAL_RUNTIME_ID } from "../src/runtime/builtin-local.js"

describe("local runtime", () => {
  it("runs echo workflow", async () => {
    registerTestExtension()
    const env = environment("test", "Test")
      .withRuntime(runtime(LOCAL_RUNTIME_ID))
      .withExtensions([extension("@ecp/test", "Test Ext").with({})])

    const manifest = workflow("Echo run")
      .run([step("@ecp/test.echo", "Echo").with({ value: "hello" }).as("echo")])
      .toManifest()

    const result = await env.run(manifest)
    expect(result.run.status).toBe("completed")
    expect(result.state?.echo).toEqual({ echo: "hello" })
  })
})
