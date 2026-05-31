import type { Ecp } from "@ecp/core"

/**
 * Encode a plain object for inclusion in a harness user prompt.
 * @internal Eval harness only.
 */
export async function encodeForPrompt(
  ecp: Ecp,
  value: unknown,
  format: string
): Promise<string> {
  const encoded = await ecp
    .encode(value)
    .uses(format)
    .with({ headers: false, compact: true })
    .process()
  return String(encoded.result ?? "")
}
