import { describe, expect, it, beforeEach } from "vitest"
import { globalRegistry } from "@executioncontextprotocol/core"
import { registerSlackExtension, slackExtension } from "../src/index.js"

describe("@executioncontextprotocol/slack", () => {
  beforeEach(async () => {
    await registerSlackExtension()
  })

  it("registers the extension and exposes the send capability", () => {
    const ext = globalRegistry.getExtension("@executioncontextprotocol/slack")
    expect(ext).toBe(slackExtension)
    expect(ext?.capabilities.map((c) => c.id)).toContain("@executioncontextprotocol/slack.send")
  })

  it("send returns an acknowledgement with a timestamp", async () => {
    const send = slackExtension.capabilities.find((c) => c.id === "@executioncontextprotocol/slack.send")
    const ctx = { extensionConfig: {}, usage: { increment: () => undefined } }
    const out = (await send?.handler(
      { message: "hello", channel: "#general" },
      ctx as never
    )) as { ok: boolean; ts?: string }
    expect(out.ok).toBe(true)
    expect(typeof out.ts).toBe("string")
  })

  it("validates send input against the capability schema", () => {
    const send = slackExtension.capabilities.find((c) => c.id === "@executioncontextprotocol/slack.send")
    const parsed = send?.inputSchema?.safeParse({ message: "hi" })
    expect(parsed?.success).toBe(true)
  })
})
