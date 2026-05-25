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
import { OLLAMA_GEMMA_1B_EVAL } from "../profiles/ollama-gemma.js"

/**
 * Intent classification harness eval environment (Ollama + Gemma 1B, JSON output).
 * Model and base URL are pinned in {@link OLLAMA_GEMMA_1B_EVAL}.
 * @category Evals
 */
export async function createHarnessOllamaIntentEnvironment() {
  const { baseURL, model, providerId } = OLLAMA_GEMMA_1B_EVAL

  await registerCoreFormats()
  registerStandardHarnesses()
  await registerNodeRuntime()
  await registerOllamaExtension()
  await registerTestExtension()

  return environment("harness-ollama-intent-eval", "Harness Ollama Intent Eval")
    .withRuntime(runtime(NODE_RUNTIME_ID))
    .withExtensions([
      extension(providerId).with({ baseURL, defaultModel: model }),
      extension("@ecp/test").with({}),
    ])
    .withHarnesses([
      harness("@ecp/intent-classification")
        .uses(`${providerId}.generate`)
        .with({
          output: { schema: "@ecp.intent", format: "@ecp/format-json", validate: true },
        }),
    ])
}
