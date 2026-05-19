import { environment, extension, runtime, env } from "@ecp/core"
import { LOCAL_RUNTIME_ID } from "@ecp/core"
import { registerMemoryExtension } from "@ecp/extension-memory"
import { registerOpenaiExtension } from "@ecp/extension-openai"
import { registerSlackExtension } from "@ecp/extension-slack"

registerMemoryExtension()
registerOpenaiExtension()
registerSlackExtension()

export default environment("weekly-brief", "Weekly brief")
  .withRuntime(runtime(LOCAL_RUNTIME_ID))
  .withExtensions([
    extension("@ecp/memory", "Memory").with({
      hydrateModels: true,
      collections: ["leadership"],
    }),
    extension("@ecp/openai", "OpenAI").with({
      apiKey: env("OPENAI_API_KEY"),
      defaultModel: "gpt-4o-mini",
    }),
    extension("@ecp/slack", "Slack").with({
      botToken: env("SLACK_BOT_TOKEN", { optional: true }),
    }),
  ])
