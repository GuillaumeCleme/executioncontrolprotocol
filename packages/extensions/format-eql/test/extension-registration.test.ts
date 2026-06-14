import { describe, expect, it } from "vitest"
import { globalRegistry } from "@executioncontextprotocol/core"
import { formatEqlExtension, registerFormatEqlExtension } from "../src/index.js"

describe("registerFormatEqlExtension", () => {
  it("catalogs encode and decode capabilities", () => {
    expect(formatEqlExtension.id).toBe("@executioncontextprotocol/format-eql")
    const caps = formatEqlExtension.capabilities.map((c) => c.id)
    expect(caps).toContain("@executioncontextprotocol/format-eql.encode")
    expect(caps).toContain("@executioncontextprotocol/format-eql.decode")
  })

  it("registers on the global registry", async () => {
    await registerFormatEqlExtension()
    expect(globalRegistry.getExtension("@executioncontextprotocol/format-eql")).toBeDefined()
    await registerFormatEqlExtension()
  })
})
