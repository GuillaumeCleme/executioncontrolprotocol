import { describe, expect, it } from "vitest"
import { workflow, step, extension, registerTestExtension } from "@ecp/core"
import { environment } from "../src/index.js"

describe("@ecp/browser runtime", () => {
  it("runs echo workflow", async () => {
    registerTestExtension()
    const env = environment("browser-test").withExtensions([extension("@ecp/test").with({})])
    const manifest = workflow("Browser Echo")
      .run([step("@ecp/test.echo", "Echo").with({ value: "hello browser" }).as("echo")])
      .toManifest()
    const result = await env.run(manifest)
    expect(result.run.status).toBe("completed")
    expect(result.state.echo).toEqual({ echo: "hello browser" })
  })
})
