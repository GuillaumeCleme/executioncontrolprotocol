/**
 * Baked Ollama + Gemma profile for harness evals (no env overrides).
 * @category Evals
 */
export const OLLAMA_GEMMA_1B_EVAL = {
  /** Profile id for logging and readiness messages. */
  id: "ollama-gemma-1b",
  /** Ollama provider extension id. */
  providerId: "@ecp/ollama",
  /** Default local Ollama API URL. */
  baseURL: "http://localhost:11434",
  /** Pinned model for workflow and intent harness evals. */
  model: "gemma3:1b",
  /**
   * Ollama chat context window (num_ctx). Matrix prompts are kept compact via plain-text
   * capability lists; encoded TOON descriptors are omitted in eval harness config.
   */
  numCtx: 8192,
} as const

/** @category Evals */
export type OllamaGemmaEvalProfile = typeof OLLAMA_GEMMA_1B_EVAL
