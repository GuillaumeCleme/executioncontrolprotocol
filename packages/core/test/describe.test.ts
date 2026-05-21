import { describe, expect, it, beforeEach } from "vitest"
import { extension, policy } from "../src/index.js"
import { registerStandardPolicies } from "@ecp/policies"
import { createTestEnvironment } from "./helpers.js"

describe("environment.describe", () => {
  beforeEach(async () => {
    await registerStandardPolicies()
  })

  it("filters capabilities by match and include", async () => {
    const env = (await createTestEnvironment("d", "D")).withExtensions([
      extension("@ecp/test", "T").with({}),
    ])
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
    const env = (await createTestEnvironment("d")).withExtensions([
      extension("@ecp/test", "T").with({}),
    ])
      .withPolicies([policy("@ecp/budget", "B").with({ maxModelCalls: 1 })])

    const desc = await env.describe({
      policies: { match: "budget", include: ["id", "summary"] },
    })
    expect(desc.policies.length).toBeGreaterThan(0)
    expect(desc.policies[0]?.id).toBe("@ecp/budget")
  })
})
