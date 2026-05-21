import { describe, expect, it } from "vitest"
import {
  extension,
  defineExtension,
  capabilityFor,
  RegistryFrozenError,
} from "@ecp/core"
import { environment } from "../src/index.js"
import { z } from "zod"
import { registerBrowserDefaults } from "../src/environment.js"

describe("@ecp/browser-registry", () => {
  it("freezes registry on first run", async () => {
    registerBrowserDefaults()
    const customerExt = defineExtension("@customer", "demo")
      .withCapabilities([
        capabilityFor("@customer/demo", "echo")
          .withInput(z.object({}))
          .withOutput(z.object({ ok: z.boolean() }))
          .withHandler(async () => ({ ok: true })),
      ])
      .build()

    const env = environment("reg-test").withExtensions([
      extension("@ecp/browser-registry").with({
        freezeOnFirstRun: true,
        autoBindRegisteredExtensions: true,
        allowedNamespaces: ["@customer/*"],
      }),
    ])

    await env.ensureReady()
    env.getRegistry().registerExtension(customerExt)
    env.addExtensionBinding("@customer/demo", {})

    const desc = await env.describe()
    expect(desc.capabilities.some((c) => c.id === "@customer/demo.echo")).toBe(true)

    await env.run({
      schema: "@ecp.workflow",
      version: "1.0.0",
      workflow: { id: "empty" },
      steps: [],
    })

    expect(() => env.getRegistry().registerExtension(customerExt)).toThrow(RegistryFrozenError)
  })
})
