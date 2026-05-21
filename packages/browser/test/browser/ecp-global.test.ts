import { describe, expect, it } from "vitest"
import { defineExtension, capabilityFor } from "@ecp/core"
import { z } from "zod"
import { createBrowserDemoEnvironment, registerBrowserDefaults } from "../../src/environment.js"

const customerExt = defineExtension("@customer", "browser-only")
  .withCapabilities([
    capabilityFor("@customer/browser-only", "ping")
      .withInput(z.object({}))
      .withOutput(z.object({ ok: z.boolean() }))
      .withHandler(async () => ({ ok: true })),
  ])
  .build()

describe("globalThis.ecp in real browser", () => {
  it("registers extension via window.ecp", async () => {
    await registerBrowserDefaults()
    const env = createBrowserDemoEnvironment("real-browser-global")
    await env.describe()
    const ecp = (globalThis as {
      ecp?: { registerExtension: (d: typeof customerExt) => Promise<void> }
    }).ecp
    expect(ecp).toBeDefined()
    await ecp!.registerExtension(customerExt)
    const desc = await env.describe()
    expect(desc.capabilities.some((c) => c.id === "@customer/browser-only.ping")).toBe(true)
  })
})
