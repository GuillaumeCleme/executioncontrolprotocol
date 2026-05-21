import { describe, expect, it } from "vitest"
import { workflow, step } from "../src/index.js"
import { createTestEnvironment } from "./helpers.js"

describe("node runtime", () => {
  it("runs echo workflow", async () => {
    const env = createTestEnvironment("test", "Test")
    const manifest = workflow("Echo run")
      .run([step("@ecp/test.echo", "Echo").with({ value: "hello" }).as("echo")])
      .toManifest()

    const result = await env.run(manifest)
    expect(result.run.status).toBe("completed")
    expect(result.state?.echo).toEqual({ echo: "hello" })
  })
})
