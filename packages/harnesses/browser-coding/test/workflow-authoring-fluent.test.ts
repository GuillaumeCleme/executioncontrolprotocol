import { describe, expect, it } from "vitest"
import { compileWorkflowSource } from "@executioncontextprotocol/core/compile"
import { renderWorkflowToFluent } from "@executioncontextprotocol/core"
import { registerDemoExtension } from "@executioncontextprotocol/demo"

const SAMPLE = `
import { workflow, step } from "@executioncontextprotocol/core"
export default workflow("Patch target")
  .run([step("@executioncontextprotocol/demo.echo", "Echo").with({ value: "hi" }).as("echo")])
`

describe("Browser Coding workflow Fluent compile", () => {
  it("compiles model-style Fluent output", async () => {
    await registerDemoExtension()
    const result = await compileWorkflowSource({ source: SAMPLE, filename: "workflow.ts" })
    expect(result.ok).toBe(true)
    expect(result.manifest?.steps[0]?.as).toBe("echo")
  })

  it("renders baseline Fluent for patch prompts", async () => {
    await registerDemoExtension()
    const compiled = await compileWorkflowSource({ source: SAMPLE, filename: "workflow.ts" })
    expect(compiled.manifest).toBeDefined()
    const fluent = renderWorkflowToFluent(compiled.manifest!)
    expect(fluent).toContain("export default workflow")
    expect(fluent).toContain("@executioncontextprotocol/demo.echo")
  })
})
