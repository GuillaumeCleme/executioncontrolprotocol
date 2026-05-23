import { describe, expect, it } from "vitest"
import { hook, defineExtension, capabilityFor } from "../../src/index.js"
import { z } from "zod"
import { initTestEcp } from "../helpers.js"

describe("ecp.invoke", () => {
  it("invokes a registered capability with validated input and output", async () => {
    const echo = defineExtension("@ecp", "invoke-echo")
      .withCapabilities([
        capabilityFor("@ecp/invoke-echo", "ping")
          .withInput(z.object({ message: z.string() }))
          .withOutput(z.object({ text: z.string() }))
          .withHandler(async (input) => ({ text: input.message })),
      ])
      .build()

    const ecp = await initTestEcp("invoke-test")
    await ecp.getRegistry().registerExtension(echo)
    const result = await ecp.invoke("@ecp/invoke-echo.ping").with({ message: "hi" }).process()
    expect(result.success).toBe(true)
    expect(result.result).toEqual({ text: "hi" })
    await ecp.terminate()
  })

  it("returns failure when capability is missing", async () => {
    const ecp = await initTestEcp("invoke-missing")
    const result = await ecp.invoke("@ecp/missing.cap").with({}).process()
    expect(result.success).toBe(false)
    expect(result.diagnostics[0]?.code).toBe("CAPABILITY_NOT_FOUND")
    await ecp.terminate()
  })

  it("does not emit run lifecycle hooks", async () => {
    const events: string[] = []
    const spy = defineExtension("@ecp", "invoke-spy")
      .withHooks([
        hook("run:before", async () => {
          events.push("run:before")
        }),
      ])
      .withCapabilities([
        capabilityFor("@ecp/invoke-spy", "noop")
          .withInput(z.object({}))
          .withOutput(z.object({ ok: z.boolean() }))
          .withHandler(async () => ({ ok: true })),
      ])
      .build()

    const ecp = await initTestEcp("invoke-spy")
    await ecp.getRegistry().registerExtension(spy)
    await ecp.invoke("@ecp/invoke-spy.noop").with({}).process()
    expect(events).not.toContain("run:before")
    await ecp.terminate()
  })
})
