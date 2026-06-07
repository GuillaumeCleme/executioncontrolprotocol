import { workflow, step, ref } from "@ecp/core"

export default workflow("Weekly leadership brief")
  .run([
    step("@ecp/memory.search", "Collect Weekly Signals")
      .with({ query: "important risks and decisions this week", since: "7d" })
      .as("signals"),

    step("@ecp/openai.generate", "Generate Executive Brief")
      .with({
        prompt: "Create a concise leadership brief.",
        context: ref("signals.results"),
      })
      .as("brief"),

    step("@ecp/slack.send", "Send Brief to Slack")
      .with({ message: ref("brief.content") }),
  ])
