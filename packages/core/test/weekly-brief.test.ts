import { describe, expect, it } from "vitest"
import { compileWorkflowSource } from "../src/compile/index.js"
import { extension } from "../src/index.js"
import { environment } from "@executioncontextprotocol/node"
import { registerMemoryExtension } from "@executioncontextprotocol/extension-memory"
import { registerOpenaiExtension } from "@executioncontextprotocol/extension-openai"
import { registerSlackExtension } from "@executioncontextprotocol/extension-slack"

const WEEKLY_WORKFLOW = `
import { workflow, step, ref } from "@executioncontextprotocol/core"
export default workflow("Weekly leadership brief")
  .run([
    step("@executioncontextprotocol/memory.search", "Collect Weekly Signals")
      .with({ query: "important risks and decisions this week", since: "7d" })
      .as("signals"),
    step("@executioncontextprotocol/openai.generate", "Generate Executive Brief")
      .with({ prompt: "Create a concise leadership brief.", context: ref("signals.results") })
      .as("brief"),
    step("@executioncontextprotocol/slack.send", "Send Brief to Slack")
      .with({ message: ref("brief.content") }),
  ])
`

describe("examples/02-weekly-brief", () => {
  it("workflow compiles against registered extensions", async () => {
    await registerMemoryExtension()
    await registerOpenaiExtension()
    await registerSlackExtension()

    const env = (await environment("weekly-brief", "Weekly brief")).withExtensions([
        extension("@executioncontextprotocol/memory", "Memory").with({ hydrateModels: true, collections: ["leadership"] }),
        extension("@executioncontextprotocol/openai", "OpenAI").with({ defaultModel: "gpt-4o-mini" }),
        extension("@executioncontextprotocol/slack", "Slack").with({}),
      ])

    const compiled = await compileWorkflowSource({
      source: WEEKLY_WORKFLOW,
      filename: "workflow.ts",
    })
    expect(compiled.ok).toBe(true)
    expect(compiled.manifest?.steps).toHaveLength(3)

    const ecp = await env.init()
    const desc = await ecp.describe()
    expect(desc.capabilities.some((c) => c.id === "@executioncontextprotocol/memory.search")).toBe(true)
    expect(desc.capabilities.some((c) => c.id === "@executioncontextprotocol/openai.generate")).toBe(true)
  })
})
