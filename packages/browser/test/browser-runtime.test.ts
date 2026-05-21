import { describe, expect, it } from "vitest"
import { workflow, step, extension, registerTestExtension } from "@ecp/core"
import { createBrowserTestEnvironment } from "./helpers.js"
import { registerRuntimeConformanceTests } from "../../core/test/runtime-conformance.js"

registerRuntimeConformanceTests("@ecp/browser", () => createBrowserTestEnvironment("browser-conformance"))

describe("@ecp/browser runtime", () => {
  it("runs echo workflow", async () => {
    await registerTestExtension()
    const env = (await createBrowserTestEnvironment("browser-test")).withExtensions([
      extension("@ecp/test").with({}),
    ])
    const manifest = workflow("Browser Echo")
      .run([step("@ecp/test.echo", "Echo").with({ value: "hello browser" }).as("echo")])
      .toManifest()
    const result = await env.run(manifest)
    expect(result.run.status).toBe("completed")
    expect(result.state.echo).toEqual({ echo: "hello browser" })
  })
})
