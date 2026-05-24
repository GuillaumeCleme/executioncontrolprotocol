import { describe, expect, it } from "vitest"
import { workflow, step } from "@ecp/core"
import { initEncodingTestEcp } from "../../../core/test/helpers.js"
import { extension } from "@ecp/core"
import { workflowToMermaid } from "../src/workflow-to-mermaid.js"
import { registerFormatMermaidExtension } from "../src/index.js"

describe("@ecp/format-mermaid", () => {
  it("encodes workflow to mermaid flowchart", async () => {
    await registerFormatMermaidExtension()
    const ecp = await initEncodingTestEcp([extension("@ecp/format-mermaid").with({})])
    const manifest = workflow("Demo")
      .run([step("@ecp/test.echo", "Echo").with({ value: "x" }).as("echo")])
      .toManifest()
    const encoded = await ecp.encode(manifest).uses("@ecp/format-mermaid").process()
    expect(encoded.success).toBe(true)
    expect(String(encoded.result)).toContain("flowchart TD")
    expect(String(encoded.result)).toContain("Echo")
    await ecp.terminate()
  })

  it("supports flowchart direction via encode with()", async () => {
    await registerFormatMermaidExtension()
    const ecp = await initEncodingTestEcp([extension("@ecp/format-mermaid").with({})])
    const manifest = workflow("Demo")
      .run([step("@ecp/test.echo", "Echo").with({ value: "x" }).as("echo")])
      .toManifest()
    const encoded = await ecp
      .encode(manifest)
      .uses("@ecp/format-mermaid")
      .with({ direction: "LR" })
      .process()
    expect(encoded.success).toBe(true)
    expect(String(encoded.result)).toMatch(/^flowchart LR/m)
    await ecp.terminate()
  })

  it("renders steps without explicit type field (compact TOON decode)", () => {
    const source = workflowToMermaid({
      schema: "@ecp.workflow",
      version: "1.0",
      workflow: { id: "demo-generated" },
      steps: [{ id: "echo", uses: "@ecp/test.echo", label: "Demo Echo", as: "echo" }],
    })
    expect(source).toContain("Demo Echo")
    expect(source).not.toContain('no steps')
  })
})
