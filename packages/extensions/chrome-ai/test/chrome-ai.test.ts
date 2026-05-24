import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { globalRegistry } from "@ecp/core"
import {
  chromeAiExtension,
  getModelInstallState,
  readAvailability,
  registerChromeAiExtension,
  resetModelInstallState,
  startModelDownload,
} from "../src/index.js"

describe("@ecp/chrome-ai", () => {
  const originalLanguageModel = (globalThis as { LanguageModel?: unknown }).LanguageModel

  beforeEach(async () => {
    resetModelInstallState()
    await registerChromeAiExtension()
  })

  afterEach(() => {
    resetModelInstallState()
    if (originalLanguageModel === undefined) {
      delete (globalThis as { LanguageModel?: unknown }).LanguageModel
    } else {
      ;(globalThis as { LanguageModel?: unknown }).LanguageModel = originalLanguageModel
    }
  })

  it("checkAvailability returns unsupported when LanguageModel is missing", async () => {
    delete (globalThis as { LanguageModel?: unknown }).LanguageModel
    const cap = chromeAiExtension.capabilities.find((c) => c.id === "@ecp/chrome-ai.checkAvailability")
    const result = await cap!.handler!({}, {} as never)
    expect(result).toEqual({ available: false, supported: false, status: "unsupported" })
  })

  it("checkAvailability returns supported when downloadable", async () => {
    ;(globalThis as { LanguageModel?: unknown }).LanguageModel = {
      availability: vi.fn().mockResolvedValue("downloadable"),
    }
    const cap = chromeAiExtension.capabilities.find((c) => c.id === "@ecp/chrome-ai.checkAvailability")
    const result = await cap!.handler!({}, {} as never)
    expect(result).toEqual({ available: false, supported: true, status: "downloadable" })
  })

  it("checkAvailability returns available when LanguageModel reports available", async () => {
    ;(globalThis as { LanguageModel?: unknown }).LanguageModel = {
      availability: vi.fn().mockResolvedValue("available"),
    }
    const cap = chromeAiExtension.capabilities.find((c) => c.id === "@ecp/chrome-ai.checkAvailability")
    const result = await cap!.handler!({}, {} as never)
    expect(result).toEqual({ available: true, supported: true, status: "available" })
  })

  it("startModelDownload reports progress and becomes ready", async () => {
    const availability = vi
      .fn()
      .mockResolvedValueOnce("downloadable")
      .mockResolvedValue("available")
    ;(globalThis as { LanguageModel?: unknown }).LanguageModel = {
      availability,
      create: vi.fn().mockImplementation(async ({ monitor }) => {
        monitor?.({
          addEventListener: (_type: string, fn: (e: { loaded: number; total: number }) => void) => {
            fn({ loaded: 50, total: 100 })
            fn({ loaded: 100, total: 100 })
          },
        })
        return { prompt: vi.fn().mockResolvedValue({ text: "ok" }) }
      }),
    }

    const started = await startModelDownload()
    expect(started.started).toBe(true)

    await vi.waitFor(() => getModelInstallState().phase === "ready", { timeout: 2000 })
    expect(getModelInstallState()).toMatchObject({ phase: "ready", status: "available" })
  })

  it("getModelInstallState capability returns snapshot", async () => {
    ;(globalThis as { LanguageModel?: unknown }).LanguageModel = {
      availability: vi.fn().mockResolvedValue("available"),
    }
    await startModelDownload()
    const cap = chromeAiExtension.capabilities.find((c) => c.id === "@ecp/chrome-ai.getModelInstallState")
    const result = await cap!.handler!({}, {} as never)
    expect(result).toMatchObject({ phase: "ready" })
  })

  it("generateText returns text from LanguageModel session", async () => {
    ;(globalThis as { LanguageModel?: unknown }).LanguageModel = {
      availability: vi.fn().mockResolvedValue("available"),
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

  it("generateText throws when model not ready", async () => {
    ;(globalThis as { LanguageModel?: unknown }).LanguageModel = {
      availability: vi.fn().mockResolvedValue("downloadable"),
    }
    const cap = chromeAiExtension.capabilities.find((c) => c.id === "@ecp/chrome-ai.generateText")
    await expect(cap!.handler!({ prompt: "hi" }, {} as never)).rejects.toThrow(/downloading/i)
  })

  it("readAvailability maps unknown status to unsupported", async () => {
    ;(globalThis as { LanguageModel?: unknown }).LanguageModel = {
      availability: vi.fn().mockResolvedValue("weird"),
    }
    const result = await readAvailability()
    expect(result.status).toBe("unsupported")
  })

  it("registers on global registry once", async () => {
    expect(globalRegistry.getExtension("@ecp/chrome-ai")).toBeDefined()
  })
})
