import { describe, expect, it } from "vitest"
import { env } from "../src/index.js"
import { resolveEnvConfigAsync } from "../src/environment/config-resolver.js"

describe("env resolution chain", () => {
  it("resolves via resolver order", async () => {
    const config = await resolveEnvConfigAsync(
      { apiKey: env("OPENAI_API_KEY") },
      [
        { id: "first", resolve: () => undefined },
        { id: "second", resolve: (name) => (name === "OPENAI_API_KEY" ? "secret" : undefined) },
      ]
    )
    expect(config.apiKey).toBe("secret")
  })

  it("uses optional fallback when unresolved", async () => {
    const config = await resolveEnvConfigAsync(
      { x: env("MISSING", { optional: true, fallback: "fb" }) },
      []
    )
    expect(config.x).toBe("fb")
  })

  it("throws when required env missing", async () => {
    await expect(
      resolveEnvConfigAsync({ x: env("REQUIRED") }, [])
    ).rejects.toThrow("REQUIRED")
  })
})
