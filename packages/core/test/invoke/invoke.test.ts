import { describe, expect, it } from "vitest"
import {
  hook,
  defineExtension,
  definePolicy,
  capabilityFor,
  policy,
} from "../../src/index.js"
import { z } from "zod"
import { createTestEnvironment } from "../helpers.js"
import { globalRegistry } from "../../src/registry/registry.js"

describe("ecp.invoke", () => {
  it("invokes a registered capability with validated input and output", async () => {
    const echo = defineExtension("@executioncontextprotocol", "invoke-echo")
      .withCapabilities([
        capabilityFor("@executioncontextprotocol/invoke-echo", "ping")
          .withInput(z.object({ message: z.string() }))
          .withOutput(z.object({ text: z.string() }))
          .withHandler(async (input) => ({ text: input.message })),
      ])
      .build()

    const ecp = await (await createTestEnvironment("invoke-test")).init()
    await ecp.getRegistry().registerExtension(echo)
    const result = await ecp.invoke("@executioncontextprotocol/invoke-echo.ping").with({ message: "hi" }).process()
    expect(result.success).toBe(true)
    expect(result.result).toEqual({ text: "hi" })
    await ecp.terminate()
  })

  it("returns failure when capability is missing", async () => {
    const ecp = await (await createTestEnvironment("invoke-missing")).init()
    const result = await ecp.invoke("@executioncontextprotocol/missing.cap").with({}).process()
    expect(result.success).toBe(false)
    expect(result.diagnostics[0]?.code).toBe("CAPABILITY_NOT_FOUND")
    await ecp.terminate()
  })

  it("does not emit run lifecycle hooks", async () => {
    const events: string[] = []
    const spy = defineExtension("@executioncontextprotocol", "invoke-spy")
      .withHooks([
        hook("run:before", async () => {
          events.push("run:before")
        }),
      ])
      .withCapabilities([
        capabilityFor("@executioncontextprotocol/invoke-spy", "noop")
          .withInput(z.object({}))
          .withOutput(z.object({ ok: z.boolean() }))
          .withHandler(async () => ({ ok: true })),
      ])
      .build()

    const ecp = await (await createTestEnvironment("invoke-spy")).init()
    await ecp.getRegistry().registerExtension(spy)
    await ecp.invoke("@executioncontextprotocol/invoke-spy.noop").with({}).process()
    expect(events).not.toContain("run:before")
    await ecp.terminate()
  })

  it("policy denies invoke", async () => {
    const denyPolicy = definePolicy("@executioncontextprotocol", "invoke-scope-deny")
      .withHooks([
        hook("policy:pre", (ctx) => {
          if (ctx.scope === "invoke") {
            return { type: "deny", reason: "invoke blocked" }
          }
          return { type: "allow" }
        }),
      ])
      .build()
    await globalRegistry.registerPolicy(denyPolicy)

    const env = (await createTestEnvironment("invoke-deny-test")).withPolicies([
      policy("@executioncontextprotocol/invoke-scope-deny").with({}),
    ])
    const ecp = await env.init()
    const result = await ecp.invoke("@executioncontextprotocol/demo.echo").with({ value: "x" }).process()
    expect(result.success).toBe(false)
    expect(result.diagnostics[0]?.code).toBe("INVOKE_DENIED")
    await ecp.terminate()
  })
})
