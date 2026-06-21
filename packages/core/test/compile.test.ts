import { describe, expect, it } from "vitest"
import { compileWorkflowSource, compileAndValidateWorkflowSource } from "../src/compile/index.js"
import { registerDemoExtension } from "@executioncontextprotocol/demo"
import { extension } from "../src/index.js"
import { createTestEnvironment } from "./helpers.js"

const SAMPLE_TS = `
import { workflow, step } from "@executioncontextprotocol/core"
export default workflow("Compiled")
  .run([step("@executioncontextprotocol/demo.echo", "E").with({ value: 1 }).as("out")])
`

describe("compileWorkflowSource", () => {
  it("compiles TypeScript workflow source", async () => {
    await registerDemoExtension()
    const result = await compileWorkflowSource({
      source: SAMPLE_TS,
      filename: "workflow.ts",
    })
    expect(result.ok).toBe(true)
    expect(result.manifest?.schema).toBe("@ecp.workflow")
    expect(result.manifest?.steps[0]?.as).toBe("out")
  })

  it("validates against environment descriptor", async () => {
    const env = (await createTestEnvironment("t")).withExtensions([extension("@executioncontextprotocol/demo").with({})])
    const ecp = await env.init()
    const descriptor = await ecp.describe()
    const result = await compileAndValidateWorkflowSource({
      source: SAMPLE_TS,
      filename: "workflow.ts",
      descriptor,
    })
    expect(result.ok).toBe(true)
  })
})
