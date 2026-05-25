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
 * Workflow authoring harness eval environment (Ollama + Gemma 1B, TOON output).
 * Model and base URL are pinned in {@link OLLAMA_GEMMA_1B_EVAL}.
 * @category Evals
 */
export async function createHarnessOllamaWorkflowEnvironment() {
  const { baseURL, model, providerId } = OLLAMA_GEMMA_1B_EVAL

  await registerCoreFormats()
  registerStandardHarnesses()
  await registerNodeRuntime()
  await registerOllamaExtension()
  await registerFormatToonExtension()
  await registerTestExtension()

  return environment("harness-ollama-workflow-eval", "Harness Ollama Workflow Eval")
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
    ])
}
