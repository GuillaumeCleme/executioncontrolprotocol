import { describe, expect, it } from "vitest"
import {
  extension,
  defineExtension,
  capabilityFor,
  RegistryFrozenError,
  policy,
} from "@ecp/core"
import { z } from "zod"
import { createBrowserTestEnvironment } from "./helpers.js"

describe("@ecp/browser-registry", () => {
  it("freezes registry on first run", async () => {
    const customerExt = defineExtension("@customer", "demo")
      .withCapabilities([
        capabilityFor("@customer/demo", "echo")
          .withInput(z.object({}))
          .withOutput(z.object({ ok: z.boolean() }))
          .withHandler(async () => ({ ok: true })),
      ])
      .build()

    const env = (await createBrowserTestEnvironment("reg-test")).withExtensions([
      extension("@ecp/browser-registry").with({
        freezeOnFirstRun: true,
        autoBindRegisteredExtensions: true,
        exposeGlobal: true,
        globalName: "ecp",
      }),
      extension("@ecp/browser-session-config").with({ persist: false }),
      extension("@ecp/browser-local-config").with({}),
    ])

    await env.describe()
    const ecp = (globalThis as { ecp?: { registerExtension: (d: typeof customerExt) => Promise<void> } })
      .ecp
    expect(ecp).toBeDefined()
    await ecp!.registerExtension(customerExt)

    const desc = await env.describe()
    expect(desc.capabilities.some((c) => c.id === "@customer/demo.echo")).toBe(true)

    await env.run({
      schema: "@ecp.workflow",
      version: "1.0.0",
      workflow: { id: "empty" },
      steps: [],
    })

    await expect(env.getRegistry().registerExtension(customerExt)).rejects.toThrow(
      RegistryFrozenError
    )
  })

  it("denies registration outside allowed namespace via registry-control", async () => {
    const env = (await createBrowserTestEnvironment("deny-test")).withPolicies([
      policy("@ecp/registry-control").with({
        allowedExtensionNamespaces: ["@customer/*"],
        deniedExtensionNamespaces: [],
      }),
    ])

    await env.describe()

    const ecpExt = defineExtension("@ecp", "blocked")
      .withConfig({})
      .build()

    await expect(
      env.getRegistry().registerExtension(ecpExt, { source: { type: "direct-registry" } })
    ).rejects.toThrow(/not allowed|denied/i)
  })
})
