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
    const server = createEcpMcpServer({ environment: env })
    expect(server).toBeDefined()
  })

  it("describe via environment matches MCP data path", async () => {
    await registerTestExtension()
    const env = (await environment("mcp-test")).withExtensions([extension("@ecp/test", "T").with({})])
    const descriptor = await env.describe({
      capabilities: { match: "echo", limit: 1 },
    })
    expect(descriptor.capabilities.some((c) => c.id.includes("echo"))).toBe(true)
    const manifest = workflow("W")
      .run([step("@ecp/test.echo", "E").with({ value: "x" }).as("o")])
      .toManifest()
    const validation = await env.validate(manifest)
    expect(validation.valid).toBe(true)
  })

  it("encode and decode TOON via environment", async () => {
    await registerTestExtension()
    await registerFormatToonExtension()
    const env = (await environment("mcp-enc")).withExtensions([
      extension("@ecp/format-toon").with({}),
    ])
    const manifest = workflow("W")
      .run([step("@ecp/test.echo", "E").with({ value: "x" }).as("o")])
      .toManifest()
    const encoded = await env.encode(manifest).uses("@ecp/format-toon").process()
    const decoded = await env.decode(encoded.content).uses("@ecp/format-toon").process()
    expect(normalizeWorkflowManifest(decoded.document)).toEqual(
      normalizeWorkflowManifest(manifest)
    )
    const server = createEcpMcpServer({ environment: env })
    expect(server).toBeDefined()
  })
})
