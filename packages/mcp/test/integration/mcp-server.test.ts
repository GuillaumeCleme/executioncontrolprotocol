import { describe, expect, it } from "vitest"
import { createEcpMcpServer } from "../../src/index.js"
import {
  extension,
  workflow,
  step,
  registerTestExtension,
  normalizeWorkflowManifest,
} from "@ecp/core"
import { environment } from "@ecp/node"
import { registerFormatToonExtension } from "@ecp/format-toon"

describe("createEcpMcpServer", () => {
  it("creates server with tools registered", async () => {
    await registerTestExtension()
    const env = (await environment("mcp-test")).withExtensions([extension("@ecp/test").with({})])
    const ecp = await env.init()
    const server = createEcpMcpServer({ ecp })
    expect(server).toBeDefined()
    await ecp.terminate()
  })

  it("describe via ecp matches MCP data path", async () => {
    await registerTestExtension()
    const env = (await environment("mcp-test")).withExtensions([extension("@ecp/test", "T").with({})])
    const ecp = await env.init()
    const descriptor = await ecp.describe({
      capabilities: { match: "echo", limit: 1 },
    })
    expect(descriptor.capabilities.some((c) => c.id.includes("echo"))).toBe(true)
    const manifest = workflow("W")
      .run([step("@ecp/test.echo", "E").with({ value: "x" }).as("o")])
      .toManifest()
    const validation = await ecp.validate(manifest)
    expect(validation.valid).toBe(true)
    await ecp.terminate()
  })

  it("encode and decode TOON via ecp", async () => {
    await registerTestExtension()
    await registerFormatToonExtension()
    const env = (await environment("mcp-enc")).withExtensions([
      extension("@ecp/format-toon").with({}),
    ])
    const ecp = await env.init()
    const manifest = workflow("W")
      .run([step("@ecp/test.echo", "E").with({ value: "x" }).as("o")])
      .toManifest()
    const encoded = await ecp.encode(manifest).uses("@ecp/format-toon").process()
    const decoded = await ecp.decode(encoded.result).uses("@ecp/format-toon").process()
    expect(normalizeWorkflowManifest(decoded.result as import("@ecp/types").WorkflowManifest)).toEqual(
      normalizeWorkflowManifest(manifest)
    )
    const server = createEcpMcpServer({ ecp })
    expect(server).toBeDefined()
    await ecp.terminate()
  })
})
