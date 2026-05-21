import { describe, expect, it } from "vitest"
import { Registry, RegistryFrozenError } from "../src/registry/registry.js"
import { defineExtension } from "../src/definitions/extension.js"

describe("Registry freeze", () => {
  it("prevents registration after freeze", () => {
    const reg = new Registry()
    const ext = defineExtension("@ecp", "demo").withConfig({}).build()
    reg.freeze("test")
    expect(() => reg.registerExtension(ext)).toThrow(RegistryFrozenError)
  })

  it("runs registration guard before freeze check", () => {
    const reg = new Registry()
    reg.setRegistrationGuard((_k, id) => {
      if (id === "@ecp/blocked") throw new Error("denied")
    })
    const ext = defineExtension("@ecp", "blocked").withConfig({}).build()
    expect(() => reg.registerExtension(ext)).toThrow("denied")
  })
})
