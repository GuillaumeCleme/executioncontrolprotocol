import {
  environment,
  harness,
  runtime,
  registerCoreFormats,
  registerTestExtension,
} from "@ecp/core"
import { registerEvalHarnesses, EVALS_HARNESS_ID } from "@ecp/harnesses-evals"
import { registerNodeRuntime, NODE_RUNTIME_ID } from "@ecp/node"
import { registerOllamaExtension } from "@ecp/extension-ollama"
import { registerFormatEqlExtension } from "@ecp/format-eql"
import { registerFormatToonExtension } from "@ecp/format-toon"
import { EVAL_MATRIX_HARNESS_BINDING } from "../harness-eval-config.js"
import {
  evalOperationsExtensionBindings,
  ollamaEvalExtensionBinding,
} from "./shared-eval-extensions.js"
import { OLLAMA_GEMMA_1B_EVAL } from "../profiles/ollama-gemma.js"

/**
 * Combined harness eval environment (workflow + intent) using the Gemma 1B profile.
 * Prefer {@link createHarnessOllamaWorkflowEnvironment} or {@link createHarnessOllamaIntentEnvironment} for eval sets.
 * @category Evals
 */
export async function createHarnessOllamaEnvironment() {
  const { providerId } = OLLAMA_GEMMA_1B_EVAL

  await registerCoreFormats()
  registerEvalHarnesses()
  await registerNodeRuntime()
  await registerOllamaExtension()
  await registerFormatEqlExtension()
  await registerFormatToonExtension()
  await registerTestExtension()

  return environment("harness-ollama-eval", "Harness Ollama Eval")
    .withRuntime(runtime(NODE_RUNTIME_ID))
    .withExtensions([ollamaEvalExtensionBinding(), ...evalOperationsExtensionBindings()])
    .withHarnesses([
      harness(EVALS_HARNESS_ID)
        .uses(`${providerId}.generate`)
        .with({ ...EVAL_MATRIX_HARNESS_BINDING }),
    ])
}

export { createHarnessOllamaWorkflowEnvironment } from "./harness-ollama-workflow.js"
export { createHarnessOllamaIntentEnvironment } from "./harness-ollama-intent.js"

