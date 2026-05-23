import { describe, expect, it } from "vitest"
import { workflow, step, registerTestExtension } from "@ecp/core"
import { createBrowserDemoEnvironment, createEcp, registerBrowserDefaults } from "../src/index.js"

describe("createEcp", () => {
  it("returns operational ecp with encode fluent without fluent extension", async () => {
    await registerBrowserDefaults()
    const env = createBrowserDemoEnvironment("create-ecp-test")
    await registerTestExtension(env.getRegistry())
    const ecp = await createEcp(env)
    const manifest = workflow("W")
      .run([step("@ecp/test.echo", "E").with({ value: "x" }).as("o")])
      .toManifest()
    const fluent = await ecp.encode(manifest).as("fluent").process()
    expect(fluent.success).toBe(true)
    expect(String(fluent.result)).toContain("export default workflow")
    await ecp.terminate()
  })
})
