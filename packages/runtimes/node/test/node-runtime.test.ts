import { describe, expect, it } from "vitest"
import { workflow, step, extension, env, registerTestExtension } from "@executioncontextprotocol/core"
import { environment, setMemorySecret, registerNodeDefaults } from "../src/index.js"
import { resolveEnvConfigAsync } from "@executioncontextprotocol/core"
import { registerRuntimeConformanceTests } from "../../../core/test/runtime-conformance.js"
import { createTestEnvironment } from "../../../core/test/helpers.js"

registerRuntimeConformanceTests("@executioncontextprotocol/node", () => createTestEnvironment("node-conformance"))

describe("@executioncontextprotocol/node runtime", () => {
  it("runs echo workflow", async () => {
    await registerTestExtension()
    const env = (await environment("node-test")).withExtensions([extension("@executioncontextprotocol/test").with({})])
    const manifest = workflow("Echo")
      .run([step("@executioncontextprotocol/test.echo", "Echo").with({ value: "hi" }).as("echo")])
      .toManifest()
    const ecp = await env.init()
    const result = await ecp.run(manifest)
    expect(result.run.status).toBe("completed")
    expect(result.state.echo).toEqual({ echo: "hi" })
  })
})

describe("@executioncontextprotocol/process-env and secrets", () => {
  it("process env resolver reads process.env", async () => {
    process.env.ECP_TEST_KEY = "from-process"
    await registerNodeDefaults()
    const config = await resolveEnvConfigAsync(
      { v: env("ECP_TEST_KEY") },
      [
        {
          id: "@executioncontextprotocol/process-env",
          resolve(name) {
            const allowed = ["ECP_TEST_KEY"]
            if (!allowed.includes(name)) return undefined
            return process.env[name]
          },
        },
      ]
    )
    expect(config.v).toBe("from-process")
    delete process.env.ECP_TEST_KEY
  })

  it("secrets resolver wins when listed first", async () => {
    setMemorySecret("SHARED_KEY", "from-secrets")
    process.env.SHARED_KEY = "from-process"
    const config = await resolveEnvConfigAsync(
      { v: env("SHARED_KEY") },
      [
        {
          id: "@executioncontextprotocol/secrets",
          async resolve(name) {
            return name === "SHARED_KEY" ? "from-secrets" : undefined
          },
        },
        {
          id: "@executioncontextprotocol/process-env",
          resolve(name) {
            return process.env[name]
          },
        },
      ]
    )
    expect(config.v).toBe("from-secrets")
    delete process.env.SHARED_KEY
  })
})
