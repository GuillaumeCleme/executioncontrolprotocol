import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"
import { globalRegistry } from "@ecp/core"
import { registerOllamaExtension, ollamaExtension } from "../src/index.js"

type Handler = (input: unknown, ctx: unknown) => Promise<unknown>

function capability(id: string): Handler {
  const cap = ollamaExtension.capabilities.find((c) => c.id === id)
  if (!cap) throw new Error(`missing capability ${id}`)
  return cap.handler as Handler
}

function mockFetch(impl: () => { ok: boolean; status?: number; body?: unknown }) {
  const fn = vi.fn(async () => {
    const r = impl()
    return {
      ok: r.ok,
      status: r.status ?? (r.ok ? 200 : 500),
      json: async () => r.body,
    } as unknown as Response
  })
  vi.stubGlobal("fetch", fn)
  return fn
}

const ctx = {
  extensionConfig: { baseURL: "http://localhost:11434", defaultModel: "test-model" },
  usage: { increment: vi.fn() },
}

describe("@ecp/ollama", () => {
  beforeEach(async () => {
    await registerOllamaExtension()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it("registers the extension and exposes generate + evaluate", () => {
    const ext = globalRegistry.getExtension("@ecp/ollama")
    expect(ext).toBe(ollamaExtension)
    expect(ext?.capabilities.map((c) => c.id)).toEqual(
      expect.arrayContaining(["@ecp/ollama.generate", "@ecp/ollama.evaluate"])
    )
  })

  it("generate returns model text and records a model call", async () => {
    const fetchMock = mockFetch(() => ({ ok: true, body: { message: { content: "hi there" } } }))
    const out = (await capability("@ecp/ollama.generate")(
      { prompt: "say hi", model: "test-model" },
      ctx
    )) as { text: string }
    expect(out.text).toBe("hi there")
    expect(ctx.usage.increment).toHaveBeenCalledWith({ modelCalls: 1 })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it("generate throws on a non-ok API response", async () => {
    mockFetch(() => ({ ok: false, status: 503 }))
    await expect(
      capability("@ecp/ollama.generate")({ prompt: "x" }, ctx)
    ).rejects.toThrow(/Ollama API error: 503/)
  })

  it("evaluate parses an approval verdict from JSON output", async () => {
    mockFetch(() => ({
      ok: true,
      body: { message: { content: '{"approved":false,"feedback":"off-topic"}' } },
    }))
    const out = (await capability("@ecp/ollama.evaluate")(
      { artifact: { answer: "nope" }, goal: "be on topic" },
      ctx
    )) as { approved: boolean; feedback?: string }
    expect(out.approved).toBe(false)
    expect(out.feedback).toBe("off-topic")
  })

  it("evaluate fails open with a skip note when output has no JSON", async () => {
    mockFetch(() => ({ ok: true, body: { message: { content: "no json here" } } }))
    const out = (await capability("@ecp/ollama.evaluate")(
      { artifact: { answer: "x" } },
      ctx
    )) as { approved: boolean; feedback?: string }
    expect(out.approved).toBe(true)
    expect(out.feedback).toContain("skipped")
  })
})
