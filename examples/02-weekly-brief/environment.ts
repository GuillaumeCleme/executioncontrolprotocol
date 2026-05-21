import { environment, extension, env } from "@ecp/node"
import { registerMemoryExtension } from "@ecp/extension-memory"
import { registerOpenaiExtension } from "@ecp/extension-openai"
import { registerSlackExtension } from "@ecp/extension-slack"

registerMemoryExtension()
registerOpenaiExtension()
registerSlackExtension()

export default environment("weekly-brief", "Weekly brief")
  .withExtensions([
    extension("@ecp/memory", "Memory").with({
      hydrateModels: true,
      collections: ["leadership"],
    }),
    extension("@ecp/openai", "OpenAI").with({
      apiKey: env("OPENAI_API_KEY", { optional: true }),
      defaultModel: "gpt-4o-mini",
    }),
    extension("@ecp/slack", "Slack").with({
      botToken: env("SLACK_BOT_TOKEN", { optional: true }),
    }),
  ])
