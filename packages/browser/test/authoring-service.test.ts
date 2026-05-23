import { describe, expect, it } from "vitest"
import { registerTestExtension } from "@ecp/core"
import {
  BrowserAuthoringService,
  createBrowserDemoEnvironment,
  createEcp,
  registerBrowserDefaults,
} from "../src/index.js"

describe("BrowserAuthoringService", () => {
  it("creates workflow via demo provider invoke", async () => {
    await registerBrowserDefaults()
    const env = createBrowserDemoEnvironment("authoring-test")
    await registerTestExtension(env.getRegistry())
    const ecp = await createEcp(env)
    const service = new BrowserAuthoringService(ecp)
    const result = await service.createWorkflow({
      userRequest: "echo demo workflow",
      providerCapabilityId: "@ecp/demo.generateText",
    })
    expect(result.manifest.schema).toBe("@ecp.workflow")
    expect(result.panels.fluent).toContain("workflow")
    expect(result.panels.toon.length).toBeGreaterThan(0)
    await ecp.terminate()
  })
})
