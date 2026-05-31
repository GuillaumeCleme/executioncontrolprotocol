import { environment, harness, runtime, registerCoreFormats, registerTestExtension } from "@ecp/core"
import { registerDemoExtension } from "@ecp/demo"
import { registerEvalHarnesses, EVALS_HARNESS_ID } from "@ecp/harnesses-evals"
import { registerNodeRuntime, NODE_RUNTIME_ID } from "@ecp/node"
import { registerOllamaExtension } from "@ecp/extension-ollama"
import { registerFormatEqlExtension } from "@ecp/format-eql"
import { registerFormatToonExtension } from "@ecp/format-toon"
import { EVAL_MATRIX_HARNESS_BINDING } from "../harness-eval-config.js"
import type { EvalProviderProfile } from "../profiles/eval-provider.js"
import { matrixExtensionBindings, providerExtensionBinding } from "./shared-eval-extensions.js"

async function registerNodeMatrixEval(provider: EvalProviderProfile): Promise<void> {
  await registerCoreFormats()
  registerEvalHarnesses()
  await registerNodeRuntime()
  if (provider.providerId === "@ecp/ollama") {
    await registerOllamaExtension()
  }
  await registerFormatEqlExtension()
  await registerFormatToonExtension()
  await registerTestExtension()
  await registerDemoExtension()
}

/**
 * Matrix harness eval environment for Node providers (e.g. Ollama).
 * @category Evals
 */
export async function createHarnessNodeMatrixEnvironment(provider: EvalProviderProfile) {
  if (provider.runtime !== "node") {
    throw new Error(
      `createHarnessNodeMatrixEnvironment expects runtime "node", got ${provider.runtime}`
    )
  }
  await registerNodeMatrixEval(provider)
  return environment(`harness-${provider.id}-matrix-eval`, `Harness ${provider.id} Matrix Eval`)
    .withRuntime(runtime(NODE_RUNTIME_ID))
    .withExtensions([providerExtensionBinding(provider), ...matrixExtensionBindings()])
    .withHarnesses([
      harness(EVALS_HARNESS_ID)
        .uses(provider.generateCapability)
        .with({ ...EVAL_MATRIX_HARNESS_BINDING }),
    ])
}
