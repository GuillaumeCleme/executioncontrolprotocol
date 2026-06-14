import { environment, extension, env } from "@executioncontextprotocol/node"
import { registerMemoryExtension } from "@executioncontextprotocol/extension-memory"
import { registerOpenaiExtension } from "@executioncontextprotocol/extension-openai"
import { registerSlackExtension } from "@executioncontextprotocol/extension-slack"

registerMemoryExtension()
registerOpenaiExtension()
registerSlackExtension()

export default environment("weekly-brief", "Weekly brief")
  .withExtensions([
    extension("@executioncontextprotocol/memory", "Memory").with({
      hydrateModels: true,
      collections: ["leadership"],
    }),
    extension("@executioncontextprotocol/openai", "OpenAI").with({
      apiKey: env("OPENAI_API_KEY", { optional: true }),
      defaultModel: "gpt-4o-mini",
    }),
    extension("@executioncontextprotocol/slack", "Slack").with({
      botToken: env("SLACK_BOT_TOKEN", { optional: true }),
    }),
  ])
