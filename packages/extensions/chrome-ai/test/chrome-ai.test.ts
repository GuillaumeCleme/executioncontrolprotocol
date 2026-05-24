import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { globalRegistry } from "@ecp/core"
import { chromeAiExtension, registerChromeAiExtension } from "../src/index.js"

describe("@ecp/chrome-ai", () => {
  const originalLanguageModel = (globalThis as { LanguageModel?: unknown }).LanguageModel

  beforeEach(async () => {
    await registerChromeAiExtension()
  })

  afterEach(() => {
    if (originalLanguageModel === undefined) {
      delete (globalThis as { LanguageModel?: unknown }).LanguageModel
    } else {
      ;(globalThis as { LanguageModel?: unknown }).LanguageModel = originalLanguageModel
    }
  })

  it("checkAvailability returns unsupported when LanguageModel is missing", async () => {
    delete (globalThis as { LanguageModel?: unknown }).LanguageModel
    const cap = chromeAiExtension.capabilities.find((c) => c.id === "@ecp/chrome-ai.checkAvailability")
    expect(cap?.handler).toBeDefined()
    const result = await cap!.handler!({}, {} as never)
    expect(result).toEqual({ available: false, status: "unsupported" })
  })

  it("checkAvailability returns available when LanguageModel reports available", async () => {
    ;(globalThis as { LanguageModel?: unknown }).LanguageModel = {
      availability: vi.fn().mockResolvedValue("available"),
    }
    const cap = chromeAiExtension.capabilities.find((c) => c.id === "@ecp/chrome-ai.checkAvailability")
    const result = await cap!.handler!({}, {} as never)
    expect(result).toEqual({ available: true, status: "available" })
  })

  it("generateText returns text from LanguageModel session", async () => {
    ;(globalThis as { LanguageModel?: unknown }).LanguageModel = {
      create: vi.fn().mockResolvedValue({
        prompt: vi.fn().mockResolvedValue({ text: "hello from chrome" }),
      }),
    }
    const cap = chromeAiExtension.capabilities.find((c) => c.id === "@ecp/chrome-ai.generateText")
    const result = await cap!.handler!(
      { prompt: "hi", system: "be brief" },
      { usage: { increment: vi.fn() } } as never
    )
    expect(result).toEqual({ text: "hello from chrome" })
  })

  it("registers on global registry once", async () => {
    expect(globalRegistry.getExtension("@ecp/chrome-ai")).toBeDefined()
  })
})
