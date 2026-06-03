import { ECP_HARNESS_REPLY_SCHEMA, type HarnessReply } from "@ecp/types"

/** Default safe reply when assistant decode/repair fails. @category Harness */
export const HARNESS_ASSISTANT_SAFE_REPLY_MESSAGE =
  "I could not answer that cleanly — try rephrasing or ask about workflows, ECP, or available capabilities."

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
