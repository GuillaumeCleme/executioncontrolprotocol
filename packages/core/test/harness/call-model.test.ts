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
    step: { id: "step", capabilityId: "@ecp/demo.generate" },
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    usage: createUsageLedger(),
    capabilities: { call: handler },
  }
}

describe("callModelGenerate", () => {
  it("rejects non-generate provider capabilities", async () => {
    const ctx = mockContext(async () => ({ text: "ok" }))
    await expect(
      callModelGenerate("@ecp/demo.generateText", { prompt: "hi" }, ctx)
    ).rejects.toThrow('must use capability name "generate"')
  })

  it("extracts text from text and content response shapes", async () => {
    const ctxText = mockContext(async () => ({ text: "from-text" }))
    const textResult = await callModelGenerate(
      "@ecp/demo.generate",
      { prompt: "hi" },
      ctxText
    )
    expect(textResult.text).toBe("from-text")

    const ctxContent = mockContext(async () => ({ content: "from-content" }))
    const contentResult = await callModelGenerate(
      "@ecp/demo.generate",
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
      "@ecp/demo.generate",
      { prompt: "Classify this message." },
      ctx,
      "@ecp/format-json"
    )
    expect(capturedPrompt).toContain("JSON")

    await callModelGenerate(
      "@ecp/demo.generate",
      { prompt: "Return a workflow." },
      ctx,
      "@ecp/format-toon"
    )
    expect(capturedPrompt.toLowerCase()).toContain("toon")
  })

  it("coerces primitive handler output to string", async () => {
    const ctx = mockContext(async () => 42)
    const result = await callModelGenerate(
      "@ecp/demo.generate",
      { prompt: "hi", responseFormat: "text" },
      ctx
    )
    expect(result.text).toBe("42")
  })
})
