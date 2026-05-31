import { describe, expect, it } from "vitest"
import { globalRegistry } from "@ecp/core"
import { formatEqlExtension, registerFormatEqlExtension } from "../src/index.js"

describe("registerFormatEqlExtension", () => {
  it("catalogs encode and decode capabilities", () => {
    expect(formatEqlExtension.id).toBe("@ecp/format-eql")
    const caps = formatEqlExtension.capabilities.map((c) => c.id)
    expect(caps).toContain("@ecp/format-eql.encode")
    expect(caps).toContain("@ecp/format-eql.decode")
  })

  it("registers on the global registry", async () => {
    await registerFormatEqlExtension()
    expect(globalRegistry.getExtension("@ecp/format-eql")).toBeDefined()
    await registerFormatEqlExtension()
  })
})
