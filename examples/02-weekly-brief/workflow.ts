import { workflow, step, ref } from "@executioncontextprotocol/core"

export default workflow("Weekly leadership brief")
  .run([
    step("@executioncontextprotocol/memory.search", "Collect Weekly Signals")
      .with({ query: "important risks and decisions this week", since: "7d" })
      .as("signals"),

    step("@executioncontextprotocol/openai.generate", "Generate Executive Brief")
      .with({
        prompt: "Create a concise leadership brief.",
        context: ref("signals.results"),
      })
      .as("brief"),

    step("@executioncontextprotocol/slack.send", "Send Brief to Slack")
      .with({ message: ref("brief.content") }),
  ])
