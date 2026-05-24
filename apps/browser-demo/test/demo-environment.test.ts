import { describe, expect, it } from "vitest"
import { createDemoAppEnvironment } from "../src/lib/demo-environment.js"

describe("createDemoAppEnvironment", () => {
  it("binds @ecp/test so @ecp/test.echo appears in describe()", async () => {
    const { descriptor } = await createDemoAppEnvironment()
    const ids = descriptor.capabilities.map((c) => c.id)
    expect(ids).toContain("@ecp/test.echo")
    expect(descriptor.extensions.some((e) => e.id === "@ecp/test")).toBe(true)
  })
})
