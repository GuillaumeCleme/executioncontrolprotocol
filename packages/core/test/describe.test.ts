import { describe, expect, it, beforeEach } from "vitest"
import { environment, extension, runtime, policy, registerTestExtension } from "../src/index.js"
import { LOCAL_RUNTIME_ID } from "../src/runtime/builtin-local.js"
import { registerStandardPolicies } from "@ecp/policies"

describe("environment.describe", () => {
  beforeEach(() => {
    registerTestExtension()
    registerStandardPolicies()
  })

  it("filters capabilities by match and include", async () => {
    const env = environment("d", "D")
      .withRuntime(runtime(LOCAL_RUNTIME_ID))
      .withExtensions([extension("@ecp/test", "T").with({})])
      .withPolicies([policy("@ecp/budget", "B").with({})])

    const desc = await env.describe({
      capabilities: {
        match: "echo",
        include: ["id", "label"],
        limit: 1,
      },
    })
    expect(desc.capabilities).toHaveLength(1)
    expect(desc.capabilities[0]?.id).toBe("@ecp/test.echo")
    expect(desc.capabilities[0]).not.toHaveProperty("inputSchema")
  })

  it("filters policies section", async () => {
    const env = environment("d")
      .withRuntime(runtime(LOCAL_RUNTIME_ID))
      .withExtensions([extension("@ecp/test", "T").with({})])
      .withPolicies([policy("@ecp/budget", "B").with({ maxModelCalls: 1 })])

    const desc = await env.describe({
      policies: { match: "budget", include: ["id", "summary"] },
    })
    expect(desc.policies.length).toBeGreaterThan(0)
    expect(desc.policies[0]?.id).toBe("@ecp/budget")
  })
})
