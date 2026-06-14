import { describe, expect, it } from "vitest"
import { env } from "@executioncontextprotocol/core"
import { setBrowserSessionValue } from "../src/extensions/browser-session-config.js"
import { resolveEnvConfigAsync } from "@executioncontextprotocol/core"

describe("@executioncontextprotocol/browser-session-config", () => {
  it("resolves session values in memory", async () => {
    setBrowserSessionValue("OPENAI_API_KEY", "user-key")
    const config = await resolveEnvConfigAsync(
      { key: env("OPENAI_API_KEY") },
      [
        {
          id: "@executioncontextprotocol/browser-session-config",
          resolve(name) {
            return name === "OPENAI_API_KEY" ? "user-key" : undefined
          },
        },
      ]
    )
    expect(config.key).toBe("user-key")
  })
})
