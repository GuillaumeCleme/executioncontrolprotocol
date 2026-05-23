import { describe, expect, it } from "vitest"
import { environment, extension, testExtension, getCatalogedExtension } from "../src/index.js"
import { formatToonExtension } from "@ecp/format-toon"
import "@ecp/format-toon"
import { initEncodingTestEcp } from "./helpers.js"

describe("extension catalog", () => {
  it("resolves cataloged extension by string id", () => {
    expect(getCatalogedExtension("@ecp/format-toon")).toBe(formatToonExtension)
  })

  it("registers bound extensions on encode without prior registerFormatToonExtension", async () => {
    const ecp = await initEncodingTestEcp([extension("@ecp/format-toon").with({})])

    const manifest = {
      schema: "@ecp.workflow" as const,
      version: "1.0" as const,
      workflow: { id: "w" },
      steps: [],
    }

    const encoded = await ecp.encode(manifest).uses("@ecp/format-toon").process()
    await ecp.terminate()
    expect(encoded.format).toBe("toon")
  })

  it("registers inline extension definition binding", async () => {
    const env = environment("inline-test").withExtensions([
      extension(testExtension).with({}),
    ])

    await env.ensureBoundExtensionsRegistered()
    expect(env.getRegistry().getExtension("@ecp/test")).toBeDefined()
  })
})
