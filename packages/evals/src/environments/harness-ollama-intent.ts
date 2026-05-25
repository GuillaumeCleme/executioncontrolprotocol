import {
  environment,
  harness,
  runtime,
  registerCoreFormats,
  registerTestExtension,
} from "@ecp/core"
import { registerEvalHarnesses } from "../harnesses/register.js"
import { EVALS_INTENT_CLASSIFICATION_ID } from "../harnesses/harness-ids.js"
import { registerNodeRuntime, NODE_RUNTIME_ID } from "@ecp/node"
import { registerOllamaExtension } from "@ecp/extension-ollama"
import { registerFormatToonExtension } from "@ecp/format-toon"
import { INTENT_EVAL_HARNESS_CONFIG } from "../harness-eval-config.js"
import {
  evalOperationsExtensionBindings,
  ollamaEvalExtensionBinding,
} from "./shared-eval-extensions.js"
import { OLLAMA_GEMMA_1B_EVAL } from "../profiles/ollama-gemma.js"

/**
 * Intent classification harness eval environment (Ollama + Gemma 1B, JSON output).
 * Binds the same operational extensions as workflow evals so the environment descriptor
 * matches capabilities referenced in eval prompts (`@ecp/test.echo`, TOON descriptor).
 * @category Evals
 */
export async function createHarnessOllamaIntentEnvironment() {
  const { providerId } = OLLAMA_GEMMA_1B_EVAL

  await registerCoreFormats()
  registerEvalHarnesses()
  await registerNodeRuntime()
  await registerOllamaExtension()
  await registerFormatToonExtension()
  await registerTestExtension()

  return environment("harness-ollama-intent-eval", "Harness Ollama Intent Eval")
    .withRuntime(runtime(NODE_RUNTIME_ID))
    .withExtensions([ollamaEvalExtensionBinding(), ...evalOperationsExtensionBindings()])
    .withHarnesses([
      harness(EVALS_INTENT_CLASSIFICATION_ID)
        .uses(`${providerId}.generate`)
        .with({ ...INTENT_EVAL_HARNESS_CONFIG }),
    ])
}
