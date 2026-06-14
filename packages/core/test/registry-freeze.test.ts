import { describe, expect, it } from "vitest"
import { Registry, RegistryFrozenError } from "../src/registry/registry.js"
import { defineExtension } from "../src/definitions/extension.js"

describe("Registry freeze", () => {
  it("prevents registration after freeze", async () => {
    const reg = new Registry()
    const ext = defineExtension("@executioncontextprotocol", "demo").withConfig({}).build()
    reg.freeze("test")
    await expect(reg.registerExtension(ext)).rejects.toThrow(RegistryFrozenError)
  })

  it("runs registration guard before freeze check", async () => {
    const reg = new Registry()
    reg.setRegistrationGuard((request) => {
      if (request.id === "@executioncontextprotocol/blocked") throw new Error("denied")
    })
    const ext = defineExtension("@executioncontextprotocol", "blocked").withConfig({}).build()
    await expect(reg.registerExtension(ext)).rejects.toThrow("denied")
  })
})
