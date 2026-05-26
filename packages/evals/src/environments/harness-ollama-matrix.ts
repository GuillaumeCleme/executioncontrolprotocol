import {
  environment,
  harness,
  runtime,
  registerCoreFormats,
  registerTestExtension,
} from "@ecp/core"
import { registerDemoExtension } from "@ecp/demo"
import { registerEvalHarnesses } from "../harnesses/register.js"
import {
  EVALS_INTENT_CLASSIFICATION_ID,
  EVALS_WORKFLOW_ASSISTANT_ID,
  EVALS_WORKFLOW_AUTHORING_ID,
} from "../harnesses/harness-ids.js"
import { registerNodeRuntime, NODE_RUNTIME_ID } from "@ecp/node"
import { registerOllamaExtension } from "@ecp/extension-ollama"
import { registerFormatToonExtension } from "@ecp/format-toon"
import {
  MATRIX_ASSISTANT_HARNESS_CONFIG,
  MATRIX_INTENT_HARNESS_CONFIG,
  MATRIX_EVAL_HARNESS_CONFIG,
} from "../harness-eval-config.js"
import { matrixExtensionBindings, ollamaEvalExtensionBinding } from "./shared-eval-extensions.js"
import { OLLAMA_GEMMA_1B_EVAL } from "../profiles/ollama-gemma.js"

/**
 * Full matrix harness eval environment (Ollama + formatters + test + demo stubs).
 * @category Evals
 */
export async function createHarnessOllamaMatrixEnvironment() {
  const { providerId } = OLLAMA_GEMMA_1B_EVAL

  await registerCoreFormats()
  registerEvalHarnesses()
  await registerNodeRuntime()
  await registerOllamaExtension()
  await registerFormatToonExtension()
  await registerTestExtension()
  await registerDemoExtension()

  return environment("harness-ollama-matrix-eval", "Harness Ollama Matrix Eval")
    .withRuntime(runtime(NODE_RUNTIME_ID))
    .withExtensions([ollamaEvalExtensionBinding(), ...matrixExtensionBindings()])
    .withHarnesses([
      harness(EVALS_WORKFLOW_AUTHORING_ID)
        .uses(`${providerId}.generate`)
        .with({ ...MATRIX_EVAL_HARNESS_CONFIG }),
      harness(EVALS_INTENT_CLASSIFICATION_ID)
        .uses(`${providerId}.generate`)
        .with({ ...MATRIX_INTENT_HARNESS_CONFIG }),
      harness(EVALS_WORKFLOW_ASSISTANT_ID)
        .uses(`${providerId}.generate`)
        .with({ ...MATRIX_ASSISTANT_HARNESS_CONFIG }),
    ])
}
