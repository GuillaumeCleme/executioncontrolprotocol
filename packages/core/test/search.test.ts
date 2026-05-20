import { describe, expect, it, beforeEach } from "vitest"
import { environment, extension, runtime, registerTestExtension } from "../src/index.js"
import { LOCAL_RUNTIME_ID } from "../src/runtime/builtin-local.js"

describe("environment.search", () => {
  beforeEach(() => {
    registerTestExtension()
  })

  it("ranks multi-token queries", async () => {
    const env = environment("s")
      .withRuntime(runtime(LOCAL_RUNTIME_ID))
      .withExtensions([extension("@ecp/test", "T").with({})])

    const result = await env.search("test echo")
    expect(result.results.length).toBeGreaterThan(0)
    expect(result.results[0]?.id).toBe("@ecp/test.echo")
    expect(result.results[0]?.score).toBeGreaterThan(0)
  })

  it("includes schemas when requested", async () => {
    const env = environment("s")
      .withRuntime(runtime(LOCAL_RUNTIME_ID))
      .withExtensions([extension("@ecp/test", "T").with({})])

    const result = await env.search("echo", {
      include: ["inputSchema"],
    })
    expect(result.results[0]?.inputSchema).toBeDefined()
  })
})
