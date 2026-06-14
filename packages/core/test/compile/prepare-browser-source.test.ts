import { describe, expect, it } from "vitest"
import { prepareBrowserWorkflowSource } from "../../src/compile/prepare-browser-source.js"

describe("prepareBrowserWorkflowSource", () => {
  it("strips @executioncontextprotocol/browser import and injects global shim", () => {
    const source = `import { workflow, step } from "@executioncontextprotocol/browser";
export default workflow("W").run([step("@executioncontextprotocol/test.echo", "E").with({ value: 1 }).as("o")]);`
    const prepared = prepareBrowserWorkflowSource(source)
    expect(prepared).toContain("globalThis.__ecpWorkflowShim")
    expect(prepared).not.toContain("@executioncontextprotocol/browser")
  })
})
