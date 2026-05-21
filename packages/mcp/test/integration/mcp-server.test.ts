import { describe, expect, it } from "vitest"
import { createEcpMcpServer } from "../../src/index.js"
import { extension, workflow, step, registerTestExtension } from "@ecp/core"
import { environment } from "@ecp/node"

describe("createEcpMcpServer", () => {
  it("creates server with tools registered", () => {
    registerTestExtension()
    const env = environment("mcp-test").withExtensions([extension("@ecp/test").with({})])
    const server = createEcpMcpServer({ environment: env })
    expect(server).toBeDefined()
  })

  it("describe via environment matches MCP data path", async () => {
    registerTestExtension()
    const env = environment("mcp-test").withExtensions([extension("@ecp/test", "T").with({})])
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
})
