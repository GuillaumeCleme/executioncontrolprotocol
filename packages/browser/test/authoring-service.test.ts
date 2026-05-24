import { describe, expect, it } from "vitest"
import { extension, registerTestExtension, workflow, step } from "@ecp/core"
import {
  BrowserAuthoringService,
  createBrowserDemoEnvironment,
  createEcp,
  registerBrowserDefaults,
} from "../src/index.js"

async function authoringEcp() {
  await registerBrowserDefaults()
  await registerTestExtension()
  const env = createBrowserDemoEnvironment("authoring-test").withExtensions([
    extension("@ecp/test").with({}),
  ])
  return createEcp(env)
}

describe("BrowserAuthoringService", () => {
  it("creates workflow via demo provider invoke", async () => {
    const ecp = await authoringEcp()
    const service = new BrowserAuthoringService(ecp)
    const result = await service.createWorkflow({
      userRequest: "echo demo workflow",
      providerCapabilityId: "@ecp/demo.generateText",
    })
    expect(result.manifest.schema).toBe("@ecp.workflow")
    expect(result.panels.fluent).toContain("workflow")
    expect(result.panels.toon.length).toBeGreaterThan(0)
    expect(result.panels.mermaid).toContain("flowchart LR")
    expect(result.panels.mermaid).not.toContain("no steps")
    expect(result.panels.mermaid).toContain("Demo Echo")
    await ecp.terminate()
  })

  it("encodePanels derives mermaid from manifest only (not from toon)", async () => {
    const ecp = await authoringEcp()
    const service = new BrowserAuthoringService(ecp)
    const manifest = workflow("Graph test")
      .run([step("@ecp/test.echo", "Echo step").with({ value: 1 }).as("echo")])
      .toManifest()
    const panels = await service.encodePanels(manifest)
    expect(panels.mermaid).toContain("Echo step")
    expect(panels.mermaid).not.toContain("no steps")
    expect(panels.mermaid).toContain("root --> s0")
    expect(panels.toon.length).toBeGreaterThan(0)
    expect(panels.json).toContain('"Echo step"')
    await ecp.terminate()
  })

  it("encodePanels includes patch TOON when provided", async () => {
    const ecp = await authoringEcp()
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
