import { environment, harness, runtime, registerCoreFormats, registerTestExtension } from "@executioncontextprotocol/core"
import { registerDemoExtension } from "@executioncontextprotocol/demo"
import {
  registerBrowserCodingHarnesses,
  BROWSER_CODING_HARNESS_ID,
  HARNESS_CODING_BINDING,
} from "../harness-coding-bindings.js"
import { registerNodeRuntime, NODE_RUNTIME_ID } from "@executioncontextprotocol/node"
import { registerOllamaExtension } from "@executioncontextprotocol/extension-ollama"
import { registerFormatToonExtension } from "@executioncontextprotocol/format-toon"
import type { EvalProviderProfile } from "../profiles/eval-provider.js"
import { matrixExtensionBindings, providerExtensionBinding } from "./shared-eval-extensions.js"

async function registerNodeCodingMatrixEval(provider: EvalProviderProfile): Promise<void> {
  await registerCoreFormats()
  registerBrowserCodingHarnesses()
  await registerNodeRuntime()
  if (provider.providerId === "@executioncontextprotocol/ollama") {
    await registerOllamaExtension()
  }
  await registerFormatToonExtension()
  await registerTestExtension()
  await registerDemoExtension()
}

/**
 * Matrix harness eval environment for Node providers with Browser Coding harness.
 * @category Evals
 */
export async function createHarnessNodeCodingMatrixEnvironment(provider: EvalProviderProfile) {
  if (provider.runtime !== "node") {
    throw new Error(
      `createHarnessNodeCodingMatrixEnvironment expects runtime "node", got ${provider.runtime}`
    )
  }
  await registerNodeCodingMatrixEval(provider)
  return environment(
    `harness-${provider.id}-coding-matrix-eval`,
    `Harness ${provider.id} Coding Matrix Eval`
  )
    .withRuntime(runtime(NODE_RUNTIME_ID))
    .withExtensions([providerExtensionBinding(provider), ...matrixExtensionBindings()])
    .withHarnesses([
      harness(BROWSER_CODING_HARNESS_ID)
        .uses(provider.generateCapability)
        .with({ ...HARNESS_CODING_BINDING }),
    ])
}
