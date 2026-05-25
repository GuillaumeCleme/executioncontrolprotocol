import {
  environment,
  harness,
  runtime,
  registerCoreFormats,
  registerTestExtension,
} from "@ecp/core"
import { registerEvalHarnesses } from "../harnesses/register.js"
import {
  EVALS_INTENT_CLASSIFICATION_ID,
  EVALS_WORKFLOW_AUTHORING_ID,
} from "../harnesses/harness-ids.js"
import { registerNodeRuntime, NODE_RUNTIME_ID } from "@ecp/node"
import { registerOllamaExtension } from "@ecp/extension-ollama"
import { registerFormatToonExtension } from "@ecp/format-toon"
import {
  INTENT_EVAL_HARNESS_CONFIG,
  WORKFLOW_EVAL_HARNESS_CONFIG,
} from "../harness-eval-config.js"
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
  await registerFormatToonExtension()
  await registerTestExtension()

  return environment("harness-ollama-eval", "Harness Ollama Eval")
    .withRuntime(runtime(NODE_RUNTIME_ID))
    .withExtensions([ollamaEvalExtensionBinding(), ...evalOperationsExtensionBindings()])
    .withHarnesses([
      harness(EVALS_WORKFLOW_AUTHORING_ID)
        .uses(`${providerId}.generate`)
        .with({ ...WORKFLOW_EVAL_HARNESS_CONFIG }),
      harness(EVALS_INTENT_CLASSIFICATION_ID)
        .uses(`${providerId}.generate`)
        .with({ ...INTENT_EVAL_HARNESS_CONFIG }),
    ])
}

export { createHarnessOllamaWorkflowEnvironment } from "./harness-ollama-workflow.js"
export { createHarnessOllamaIntentEnvironment } from "./harness-ollama-intent.js"
