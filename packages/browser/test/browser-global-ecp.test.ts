import { describe, expect, it } from "vitest"
import { defineExtension, RegistryFrozenError } from "@ecp/core"
import { z } from "zod"
import { capabilityFor } from "@ecp/core"
import { createBrowserTestEnvironment } from "./helpers.js"

describe("globalThis.ecp", () => {
  it("exposes registerExtension and freeze helpers only", async () => {
    const env = await createBrowserTestEnvironment("global-api")
    await env.describe()
    const ecp = (globalThis as Record<string, unknown>).ecp as Record<string, unknown>
    expect(ecp).toBeDefined()
    expect(typeof ecp.registerExtension).toBe("function")
    expect(typeof ecp.freezeRegistry).toBe("function")
    expect(typeof ecp.isRegistryFrozen).toBe("function")
    expect(ecp.registerPolicy).toBeUndefined()
    expect(ecp.registerRuntime).toBeUndefined()
  })

  it("removes global on shutdown", async () => {
    const env = await createBrowserTestEnvironment("global-shutdown")
    await env.describe()
    expect((globalThis as Record<string, unknown>).ecp).toBeDefined()
    await env.dispose()
    expect((globalThis as Record<string, unknown>).ecp).toBeUndefined()
  })

  it("freezes via freezeRegistry and blocks further registration", async () => {
    const env = await createBrowserTestEnvironment("global-freeze")
    await env.describe()
    const ecp = (globalThis as {
      ecp?: {
        registerExtension: (d: ReturnType<typeof defineExtension>) => Promise<void>
        freezeRegistry: (r?: string) => void
      }
    }).ecp
    ecp!.freezeRegistry("test")
    const lateExt = defineExtension("@customer", "late")
      .withCapabilities([
        capabilityFor("@customer/late", "x")
          .withInput(z.object({}))
          .withOutput(z.object({ ok: z.boolean() }))
          .withHandler(async () => ({ ok: true })),
      ])
      .build()
    await expect(ecp!.registerExtension(lateExt)).rejects.toThrow(RegistryFrozenError)
  })
})
