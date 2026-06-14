import { describe, expect, it, vi, beforeEach } from "vitest"
import { registerOpenaiExtension } from "../src/index.js"
import { globalRegistry } from "@executioncontextprotocol/core"

describe("@executioncontextprotocol/openai.evaluate", () => {
  beforeEach(() => {
    registerOpenaiExtension()
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"approved":false,"feedback":"needs work"}' } }],
        }),
      }))
    )
    process.env.OPENAI_API_KEY = "test-key"
  })

  it("parses evaluation JSON from API", async () => {
    const ext = globalRegistry.getExtension("@executioncontextprotocol/openai")
    const evaluate = ext?.capabilities.find((c) => c.id === "@executioncontextprotocol/openai.evaluate")
    const result = await evaluate?.handler(
      { artifact: {}, goal: "quality" },
      { usage: { increment: () => undefined } } as never
    )
    expect(result).toEqual({ approved: false, feedback: "needs work" })
  })
})
