import {
  environment,
  extension,
  harness,
  runtime,
  registerCoreFormats,
  registerStandardHarnesses,
  registerTestExtension,
} from "@ecp/core"
import { registerNodeRuntime, NODE_RUNTIME_ID } from "@ecp/node"
import { registerOllamaExtension } from "@ecp/extension-ollama"
import { registerFormatToonExtension } from "@ecp/format-toon"
import { OLLAMA_GEMMA_1B_EVAL } from "../profiles/ollama-gemma.js"

/**
 * Combined harness eval environment (workflow + intent) using the Gemma 1B profile.
 * Prefer {@link createHarnessOllamaWorkflowEnvironment} or {@link createHarnessOllamaIntentEnvironment} for eval sets.
 * @category Evals
 */
export async function createHarnessOllamaEnvironment() {
  const { baseURL, model, providerId } = OLLAMA_GEMMA_1B_EVAL

  await registerCoreFormats()
  registerStandardHarnesses()
  await registerNodeRuntime()
  await registerOllamaExtension()
  await registerFormatToonExtension()
  await registerTestExtension()

  return environment("harness-ollama-eval", "Harness Ollama Eval")
    .withRuntime(runtime(NODE_RUNTIME_ID))
    .withExtensions([
      extension(providerId).with({ baseURL, defaultModel: model }),
      extension("@ecp/format-toon").with({}),
      extension("@ecp/test").with({}),
    ])
    .withHarnesses([
      harness("@ecp/workflow-authoring")
        .uses(`${providerId}.generate`)
        .with({
          output: { schema: "@ecp.workflow", format: "@ecp/format-toon", validate: true },
          context: { includeEnvironmentDescriptor: true, descriptorFormat: "@ecp/format-toon" },
        }),
      harness("@ecp/intent-classification")
        .uses(`${providerId}.generate`)
        .with({
          output: { schema: "@ecp.intent", format: "@ecp/format-json", validate: true },
        }),
    ])
}

export { createHarnessOllamaWorkflowEnvironment } from "./harness-ollama-workflow.js"
export { createHarnessOllamaIntentEnvironment } from "./harness-ollama-intent.js"
