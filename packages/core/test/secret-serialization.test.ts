import { describe, expect, it } from "vitest"
import { extension, env as envRef } from "../src/index.js"
import { createTestEnvironment } from "./helpers.js"
import { setMemorySecret } from "@executioncontextprotocol/node"

describe("secret serialization", () => {
  it("does not embed resolved secrets in environment manifest", async () => {
    setMemorySecret("API_KEY", "super-secret-value")
    const env = (await createTestEnvironment("secret-test")).withExtensions([
      extension("@executioncontextprotocol/secrets").with({ provider: "memory" }),
      extension("@executioncontextprotocol/test").with({ token: envRef("API_KEY") }),
    ])
    await env.init()
    const manifest = env.compile()
    const json = JSON.stringify(manifest)
    expect(json).not.toContain("super-secret-value")
    expect(json).toContain("$env")
  })
})
