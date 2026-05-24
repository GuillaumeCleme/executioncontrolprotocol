import { describe, expect, it, vi, afterEach } from "vitest"
import { claudeExtension, registerClaudeExtension } from "../src/index.js"

describe("@ecp/claude", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("generateText returns text from Messages API", async () => {
    await registerClaudeExtension()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ type: "text", text: "claude reply" }],
        }),
      })
    )
    const cap = claudeExtension.capabilities.find((c) => c.id === "@ecp/claude.generateText")
    const result = await cap!.handler!(
      { prompt: "hello" },
      {
        extensionConfig: { apiKey: "test-key" },
        usage: { increment: vi.fn() },
      } as never
    )
    expect(result).toEqual({ text: "claude reply" })
  })

  it("generateText fails without api key", async () => {
    const cap = claudeExtension.capabilities.find((c) => c.id === "@ecp/claude.generateText")
    await expect(
      cap!.handler!({ prompt: "hello" }, { extensionConfig: {}, usage: { increment: vi.fn() } } as never)
    ).rejects.toThrow("Claude API key required")
  })
})
