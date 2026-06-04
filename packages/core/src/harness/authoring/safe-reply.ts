import { ECP_HARNESS_REPLY_SCHEMA, type HarnessReply } from "@ecp/types"

/** Shared redirect phrase for safe-reply and out-of-scope assistant answers. @category Harness */
export const HARNESS_ASSISTANT_SCOPE_REDIRECT_PHRASE =
  "workflows, ECP, or available capabilities"

/** Default safe reply when assistant decode/repair fails. @category Harness */
export const HARNESS_ASSISTANT_SAFE_REPLY_MESSAGE =
  `I could not answer that cleanly — try rephrasing or ask about ${HARNESS_ASSISTANT_SCOPE_REDIRECT_PHRASE}.`

/** Model-facing default for off-topic, unknowable, or gibberish user messages. @category Harness */
export const HARNESS_ASSISTANT_OUT_OF_SCOPE_ANSWER =
  `I cannot help with that — ask about ${HARNESS_ASSISTANT_SCOPE_REDIRECT_PHRASE}.`

const HARNESS_SCOPE_REDIRECT_TOKENS = ["ecp", "workflow", "capabilit", "scope", "rephras"] as const

/**
 * True when the assistant answer redirects the user toward ECP harness scope.
 * @category Harness
 */
export function answerRedirectsToHarnessScope(answer: string): boolean {
  const lower = answer.toLowerCase()
  return HARNESS_SCOPE_REDIRECT_TOKENS.some((token) => lower.includes(token))
}

/**
 * Minimal valid harness reply for graceful assistant fallback.
 * @category Harness
 */
export function buildAssistantSafeReply(message?: string): HarnessReply {
  return {
    schema: ECP_HARNESS_REPLY_SCHEMA,
    answer: message ?? HARNESS_ASSISTANT_SAFE_REPLY_MESSAGE,
  }
}
