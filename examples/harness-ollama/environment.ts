import {
  environment,
  extension,
  harness,
  runtime,
  registerCoreFormats,
  registerStandardHarnesses,
} from "@ecp/core"
import { registerNodeRuntime, NODE_RUNTIME_ID } from "@ecp/node"
import { registerOllamaExtension } from "@ecp/extension-ollama"
import { registerFormatToonExtension } from "@ecp/format-toon"
import { registerTestExtension } from "@ecp/core"

/**
 * Local harness eval environment with Ollama provider.
 * @category Examples
 */
export async function createHarnessOllamaEnvironment() {
  await registerCoreFormats()
  registerStandardHarnesses()
  await registerNodeRuntime()
  await registerOllamaExtension()
  await registerFormatToonExtension()
  await registerTestExtension()

  return environment("local-authoring-test", "Local Authoring Test")
    .withRuntime(runtime(NODE_RUNTIME_ID))
    .withExtensions([
      extension("@ecp/ollama").with({
        baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
        defaultModel: process.env.OLLAMA_MODEL ?? "gemma3:4b",
      }),
      extension("@ecp/format-toon").with({}),
      extension("@ecp/test").with({}),
    ])
    .withHarnesses([
      harness("@ecp/workflow-authoring")
        .uses("@ecp/ollama.generate")
        .with({
          output: { schema: "@ecp.workflow", format: "@ecp/format-toon", validate: true },
          context: { includeEnvironmentDescriptor: true, descriptorFormat: "@ecp/format-toon" },
        }),
      harness("@ecp/intent-classification")
        .uses("@ecp/ollama.generate")
        .with({
          output: { schema: "@ecp.intent", format: "@ecp/format-json", validate: true },
        }),
    ])
}
