import { extension } from "@ecp/core"
import { OLLAMA_GEMMA_1B_EVAL } from "../profiles/ollama-gemma.js"

/**
 * Ollama provider binding for eval environments.
 * @category Evals
 */
export function ollamaEvalExtensionBinding() {
  const { baseURL, model, providerId } = OLLAMA_GEMMA_1B_EVAL
  return extension(providerId).with({ baseURL, defaultModel: model })
}

/**
 * Format + test extensions required for workflow authoring and intent descriptor context.
 * @category Evals
 */
export function evalOperationsExtensionBindings() {
  return [extension("@ecp/format-toon").with({}), extension("@ecp/test").with({})]
}
