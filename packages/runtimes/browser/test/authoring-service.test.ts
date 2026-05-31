import { describe, expect, it } from "vitest"
import { registerTestExtension, workflow, step } from "@ecp/core"
import {
  BrowserAuthoringService,
  HARNESS_TASKS,
  WORKFLOW_AUTHORING_CAPABILITY,
  createBrowserDemoEnvironment,
  createEcp,
  registerBrowserDefaults,
} from "../src/index.js"
import type { HarnessInvokeResult, WorkflowManifest } from "@ecp/types"

async function authoringEcp() {
  await registerBrowserDefaults()
  await registerTestExtension()
  const env = createBrowserDemoEnvironment("authoring-test")
  env.addExtensionBinding("@ecp/test", {})
  return createEcp(env)
}

describe("BrowserAuthoringService", () => {
  it("creates workflow via workflow-authoring harness", async () => {
    const ecp = await authoringEcp()
    const invoked = await ecp
      .invoke(WORKFLOW_AUTHORING_CAPABILITY)
      .uses("@ecp/demo.generate")
      .with({ task: HARNESS_TASKS.WORKFLOW_AUTHORING, request: "echo demo workflow" })
      .process()
    expect(invoked.success).toBe(true)
    const harnessResult = invoked.result as HarnessInvokeResult<WorkflowManifest>
    expect(harnessResult.artifact.schema).toBe("@ecp.workflow")

    const service = new BrowserAuthoringService(ecp)
    const panels = await service.encodePanels(harnessResult.artifact)
    expect(panels.fluent).toContain("workflow")
    expect(panels.toon.length).toBeGreaterThan(0)
    expect(panels.mermaid).toContain("flowchart LR")
    expect(panels.mermaid).not.toContain("no steps")
    expect(panels.mermaid).toContain("Demo Echo")
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
    const invoked = await ecp
      .invoke(WORKFLOW_AUTHORING_CAPABILITY)
      .uses("@ecp/demo.generate")
      .with({ task: HARNESS_TASKS.WORKFLOW_AUTHORING, request: "demo" })
      .process()
    const harnessResult = invoked.result as HarnessInvokeResult<WorkflowManifest>
    const panels = await service.encodePanels(
      harnessResult.artifact,
      "steps[echo].input:\n  value: patched"
    )
    expect(panels.patch).toContain("steps[echo]")
    await ecp.terminate()
  })
})
