import { describe, expect, it, beforeEach } from "vitest"
import { extension, browser } from "../src/index.js"
import { createTestEnvironment } from "./helpers.js"
import {
  createMemoryVaultStorage,
  resetBrowserSecretsVault,
  setBrowserSecret,
  setBrowserSecretsStorage,
  setupBrowserVault,
} from "@executioncontextprotocol/browser-secrets"

describe("browser secret serialization", () => {
  beforeEach(() => {
    resetBrowserSecretsVault()
    setBrowserSecretsStorage(createMemoryVaultStorage())
  })

  it("does not embed resolved browser secrets in environment manifest", async () => {
    await setupBrowserVault("test-passphrase")
    await setBrowserSecret("API_KEY", "super-browser-secret")
    const env = (await createTestEnvironment("browser-secret-test")).withExtensions([
      extension("@executioncontextprotocol/browser-secrets").with({}),
      extension("@executioncontextprotocol/demo").with({ token: browser("API_KEY") }),
    ])
    await env.init()
    const manifest = env.compile()
    const json = JSON.stringify(manifest)
    expect(json).not.toContain("super-browser-secret")
    expect(json).toContain("$browser")
  })
})
