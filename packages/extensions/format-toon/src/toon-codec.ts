import { encode as toonEncode, decode as toonDecode } from "@toon-format/toon"

/** Options for encoding a document to TOON. @category Encoding */
export interface EncodeDocumentToToonOptions {
  /** When true, omit indentation (single-line friendly). */
  compact?: boolean
}

/**
 * Encode any JSON-compatible document with `@toon-format/toon`.
 * @category Encoding
 */
export function encodeDocumentToToon(
  document: unknown,
  options: EncodeDocumentToToonOptions = {}
): string {
  return toonEncode(document, {
    indent: options.compact ? 0 : 2,
  })
}

/** Options for decoding TOON text. @category Encoding */
export interface DecodeDocumentFromToonOptions {
  /** Pass through to the TOON decoder (array length checks, etc.). */
  strict?: boolean
}

/**
 * Decode TOON text to a JSON-compatible value with `@toon-format/toon`.
 * @category Encoding
 */
export function decodeDocumentFromToon(
  text: string,
  options: DecodeDocumentFromToonOptions = {}
): unknown {
  return toonDecode(text, {
    strict: options.strict ?? true,
  })
}
