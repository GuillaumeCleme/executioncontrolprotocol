import { describe, expect, it } from "vitest"
import { stripHarnessTypeScriptOutput } from "../../src/encoding/strip-harness-typescript-output.js"

describe("stripHarnessTypeScriptOutput", () => {
  it("removes a lone leading typescript line", () => {
    const raw = `typescript
import { workflow, step } from "@executioncontextprotocol/core"

export default workflow("Echo").run([])`
    expect(stripHarnessTypeScriptOutput(raw)).toMatch(/^import \{ workflow/)
    expect(stripHarnessTypeScriptOutput(raw)).not.toMatch(/^typescript/m)
  })

  it("strips ```typescript fences", () => {
    const raw = "```typescript\nimport { workflow } from \"@executioncontextprotocol/core\"\n```"
    expect(stripHarnessTypeScriptOutput(raw)).toBe('import { workflow } from "@executioncontextprotocol/core"')
  })

  it("fixes trailing ]);): typo", () => {
    const raw = `import { workflow, step } from "@executioncontextprotocol/core"
export default workflow("W").run([step("@executioncontextprotocol/demo.echo", "E").as("e")]);):`
    expect(stripHarnessTypeScriptOutput(raw).endsWith("]);")).toBe(true)
  })
})
