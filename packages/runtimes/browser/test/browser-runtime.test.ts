import { describe, expect, it } from "vitest"
import { workflow, step } from "@executioncontextprotocol/core"
import { createBrowserTestEnvironment } from "./helpers.js"
import { registerRuntimeConformanceTests } from "../../../core/test/runtime-conformance.js"

registerRuntimeConformanceTests("@executioncontextprotocol/browser", () => createBrowserTestEnvironment("browser-conformance"))

describe("@executioncontextprotocol/browser runtime", () => {
  it("runs echo workflow", async () => {
    const env = await createBrowserTestEnvironment("browser-test")
    const manifest = workflow("Browser Echo")
      .run([step("@executioncontextprotocol/demo.echo", "Echo").with({ value: "hello browser" }).as("echo")])
      .toManifest()
    const ecp = await env.init()
    const result = await ecp.run(manifest)
    expect(result.run.status).toBe("completed")
    expect(result.state.echo).toEqual({ echo: "hello browser" })
  })
})
