import { describe, expect, it, vi } from "vitest"
import type { CapabilityContext } from "../../src/runtime/context.js"
import { callModelGenerate } from "../../src/harness/call-model.js"
import { createUsageLedger } from "../../src/runtime/context.js"

function mockContext(
  handler: (id: string, input: unknown) => Promise<unknown>
): CapabilityContext {
  return {
    store: {},
    state: {},
    run: { id: "run", input: {} },
    step: { id: "step", capabilityId: "@executioncontextprotocol/demo.generate" },
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    usage: createUsageLedger(),
    capabilities: { call: handler },
  }
}

describe("callModelGenerate", () => {
  it("rejects non-generate provider capabilities", async () => {
    const ctx = mockContext(async () => ({ text: "ok" }))
    await expect(
      callModelGenerate("@executioncontextprotocol/demo.generateText", { prompt: "hi" }, ctx)
    ).rejects.toThrow('must use capability name "generate"')
  })

  it("extracts text from text and content response shapes", async () => {
    const ctxText = mockContext(async () => ({ text: "from-text" }))
    const textResult = await callModelGenerate(
      "@executioncontextprotocol/demo.generate",
      { prompt: "hi" },
      ctxText
    )
    expect(textResult.text).toBe("from-text")

    const ctxContent = mockContext(async () => ({ content: "from-content" }))
    const contentResult = await callModelGenerate(
      "@executioncontextprotocol/demo.generate",
      { prompt: "hi" },
      ctxContent
    )
    expect(contentResult.text).toBe("from-content")
  })

  it("appends JSON and TOON suffixes when response format is inferred", async () => {
    let capturedPrompt = ""
    const ctx = mockContext(async (_id, input) => {
      capturedPrompt = (input as { prompt: string }).prompt
      return { text: "{}" }
    })

    await callModelGenerate(
      "@executioncontextprotocol/demo.generate",
      { prompt: "Classify this message." },
      ctx,
      "@executioncontextprotocol/format-json"
    )
    expect(capturedPrompt).toContain("JSON")

    await callModelGenerate(
      "@executioncontextprotocol/demo.generate",
      { prompt: "Return a workflow." },
      ctx,
      "@executioncontextprotocol/format-toon"
    )
    expect(capturedPrompt.toLowerCase()).toContain("toon")
  })

  it("accepts a bare string from the provider", async () => {
    const ctx = mockContext(async () => "plain-string")
    const result = await callModelGenerate(
      "@executioncontextprotocol/demo.generate",
      { prompt: "hi", responseFormat: "text" },
      ctx
    )
    expect(result.text).toBe("plain-string")
  })

  it("rejects unsupported provider output shapes", async () => {
    const ctx = mockContext(async () => 42)
    await expect(
      callModelGenerate("@executioncontextprotocol/demo.generate", { prompt: "hi", responseFormat: "text" }, ctx)
    ).rejects.toThrow(/unsupported generate output shape/)
  })
})
