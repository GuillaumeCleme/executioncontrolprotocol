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

  it("encodePanels includes patch TOON when provided", async () => {
    await registerBrowserDefaults()
    const env = createBrowserDemoEnvironment("authoring-patch")
    await registerTestExtension(env.getRegistry())
    const ecp = await createEcp(env)
    const service = new BrowserAuthoringService(ecp)
    const created = await service.createWorkflow({
      userRequest: "demo",
      providerCapabilityId: "@ecp/demo.generateText",
    })
    const panels = await service.encodePanels(created.manifest, "steps[echo].input:\n  value: patched")
    expect(panels.patch).toContain("steps[echo]")
    await ecp.terminate()
  })
})
