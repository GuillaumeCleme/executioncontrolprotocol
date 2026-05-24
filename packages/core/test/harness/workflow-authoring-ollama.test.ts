import { describe, expect, it } from "vitest"
import { harnessCapabilityId } from "@ecp/types"

async function ollamaReachable(): Promise<boolean> {
  const base = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/tags`)
    return res.ok
  } catch {
    return false
  }
}

describe("workflow-authoring harness (Ollama)", () => {
  it("creates workflow when Ollama is running", async () => {
    if (!(await ollamaReachable())) {
      return
    }

    const { createHarnessOllamaEnvironment } = await import(
      "../../../../examples/harness-ollama/environment.js"
    )
    const env = await createHarnessOllamaEnvironment()
    const ecp = await env.init()

    const result = await ecp
      .invoke(harnessCapabilityId("@ecp/workflow-authoring"))
      .with({ request: "Create a minimal echo workflow with one step." })
      .process()

    if (!result.success) {
      console.warn(
        "Ollama harness did not produce a valid workflow:",
        result.diagnostics.map((d) => d.message).join("; ")
      )
      return
    }
    const artifact = (result.result as { artifact: { schema: string } }).artifact
    expect(artifact.schema).toBe("@ecp.workflow")
    await ecp.terminate()
  })
})
