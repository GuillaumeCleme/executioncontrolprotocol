import {
  environment,
  harness,
  runtime,
  registerCoreFormats,
  registerTestExtension,
} from "@ecp/core"
import { registerEvalHarnesses, EVALS_HARNESS_ID } from "../harness-bindings.js"
import { registerNodeRuntime, NODE_RUNTIME_ID } from "@ecp/node"
import { registerOllamaExtension } from "@ecp/extension-ollama"
import { registerFormatEqlExtension } from "@ecp/format-eql"
import { registerFormatToonExtension } from "@ecp/format-toon"
import { WORKFLOW_EVAL_HARNESS_CONFIG } from "../harness-eval-config.js"
import {
  evalOperationsExtensionBindings,
  ollamaEvalExtensionBinding,
} from "./shared-eval-extensions.js"
import { OLLAMA_GEMMA_1B_EVAL } from "../profiles/ollama-gemma.js"

/**
 * Workflow authoring harness eval environment (Ollama + Gemma 1B, JSON workflow/patch output).
 * @category Evals
 */
export async function createHarnessOllamaWorkflowEnvironment() {
  const { providerId } = OLLAMA_GEMMA_1B_EVAL

  await registerCoreFormats()
  registerEvalHarnesses()
  await registerNodeRuntime()
  await registerOllamaExtension()
  await registerFormatEqlExtension()
  await registerFormatToonExtension()
  await registerTestExtension()

  return environment("harness-ollama-workflow-eval", "Harness Ollama Workflow Eval")
    .withRuntime(runtime(NODE_RUNTIME_ID))
    .withExtensions([ollamaEvalExtensionBinding(), ...evalOperationsExtensionBindings()])
    .withHarnesses([
      harness(EVALS_HARNESS_ID)
        .uses(`${providerId}.generate`)
        .with({ ...WORKFLOW_EVAL_HARNESS_CONFIG }),
    ])
}

