import { describe, expect, it, vi, beforeEach } from "vitest"
import { registerOpenaiExtension } from "../src/index.js"
import { globalRegistry } from "@executioncontrolprotocol/core"

describe("@executioncontrolprotocol/openai.evaluate", () => {
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
    const ext = globalRegistry.getExtension("@executioncontrolprotocol/openai")
    const evaluate = ext?.capabilities.find((c) => c.id === "@executioncontrolprotocol/openai.evaluate")
    const result = await evaluate?.handler(
      { artifact: {}, goal: "quality" },
      { usage: { increment: () => undefined } } as never
    )
    expect(result).toEqual({ approved: false, feedback: "needs work" })
  })
})
