import { extension } from "@executioncontextprotocol/core"
import { MATRIX_EVAL_EXTENSION_IDS } from "../harness-eval-config.js"
import type { EvalProviderProfile } from "../profiles/eval-provider.js"
import { OLLAMA_GEMMA_1B_EVAL } from "../profiles/ollama-gemma.js"

/**
 * Provider extension binding for eval environments.
 * @category Evals
 */
export function providerExtensionBinding(profile: EvalProviderProfile) {
  return extension(profile.providerId).with(profile.extensionBinding ?? {})
}

/**
 * Ollama provider binding for eval environments.
 * @category Evals
 */
export function ollamaEvalExtensionBinding() {
  return providerExtensionBinding(OLLAMA_GEMMA_1B_EVAL)
}

/**
 * Format + test extensions required for workflow authoring and intent descriptor context.
 * @category Evals
 */
export function evalOperationsExtensionBindings() {
  return [
    extension("@executioncontextprotocol/format-toon").with({}),
    extension("@executioncontextprotocol/format-eql").with({}),
    extension("@executioncontextprotocol/test").with({}),
  ]
}

/**
 * Matrix eval extension bindings (formatters, test, demo stubs) in descriptor order.
 * @category Evals
 */
export function matrixExtensionBindings() {
  return MATRIX_EVAL_EXTENSION_IDS.map((id) => extension(id).with({}))
}
