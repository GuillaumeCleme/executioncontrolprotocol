import { describe, expect, it } from "vitest"
import { compileWorkflowSource } from "../src/compile/index.js"
import { extension } from "../src/index.js"
import { environment } from "@ecp/node"
import { registerMemoryExtension } from "@ecp/extension-memory"
import { registerOpenaiExtension } from "@ecp/extension-openai"
import { registerSlackExtension } from "@ecp/extension-slack"

const WEEKLY_WORKFLOW = `
import { workflow, step, ref } from "@ecp/core"
export default workflow("Weekly leadership brief")
  .run([
    step("@ecp/memory.search", "Collect Weekly Signals")
      .with({ query: "important risks and decisions this week", since: "7d" })
      .as("signals"),
    step("@ecp/openai.generate", "Generate Executive Brief")
      .with({ prompt: "Create a concise leadership brief.", context: ref("signals.results") })
      .as("brief"),
    step("@ecp/slack.send", "Send Brief to Slack")
      .with({ message: ref("brief.content") }),
  ])
`

describe("examples/02-weekly-brief", () => {
  it("workflow compiles against registered extensions", async () => {
    registerMemoryExtension()
    registerOpenaiExtension()
    registerSlackExtension()

    const env = environment("weekly-brief", "Weekly brief").withExtensions([
        extension("@ecp/memory", "Memory").with({ hydrateModels: true, collections: ["leadership"] }),
        extension("@ecp/openai", "OpenAI").with({ defaultModel: "gpt-4o-mini" }),
        extension("@ecp/slack", "Slack").with({}),
      ])

    const compiled = await compileWorkflowSource({
      source: WEEKLY_WORKFLOW,
      filename: "workflow.ts",
    })
    expect(compiled.ok).toBe(true)
    expect(compiled.manifest?.steps).toHaveLength(3)

    const desc = await env.describe()
    expect(desc.capabilities.some((c) => c.id === "@ecp/memory.search")).toBe(true)
    expect(desc.capabilities.some((c) => c.id === "@ecp/openai.generate")).toBe(true)
  })
})
