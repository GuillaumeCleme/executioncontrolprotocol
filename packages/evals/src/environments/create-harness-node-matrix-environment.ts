import { environment, harness, runtime, registerCoreFormats } from "@executioncontextprotocol/core"
import { registerDemoExtension } from "@executioncontextprotocol/demo"
import { registerBrowserNanoHarnesses, BROWSER_NANO_HARNESS_ID } from "../harness-bindings.js"
import { registerNodeRuntime, NODE_RUNTIME_ID } from "@executioncontextprotocol/node"
import { registerOllamaExtension } from "@executioncontextprotocol/extension-ollama"
import { registerFormatEqlExtension } from "@executioncontextprotocol/format-eql"
import { registerFormatToonExtension } from "@executioncontextprotocol/format-toon"
import { HARNESS_NANO_BINDING } from "../harness-eval-config.js"
import type { EvalProviderProfile } from "../profiles/eval-provider.js"
import { matrixExtensionBindings, providerExtensionBinding } from "./shared-eval-extensions.js"

async function registerNodeMatrixEval(provider: EvalProviderProfile): Promise<void> {
  await registerCoreFormats()
  registerBrowserNanoHarnesses()
  await registerNodeRuntime()
  if (provider.providerId === "@executioncontextprotocol/ollama") {
    await registerOllamaExtension()
  }
  await registerFormatEqlExtension()
  await registerFormatToonExtension()
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
      harness(BROWSER_NANO_HARNESS_ID)
        .uses(provider.generateCapability)
        .with({ ...HARNESS_NANO_BINDING }),
    ])
}
