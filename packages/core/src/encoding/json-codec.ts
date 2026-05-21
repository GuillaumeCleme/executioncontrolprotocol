import { LATEST_ECP_VERSION, ECP_FORMATS } from "@ecp/types"
import type { DecodeResult, EcpSchema, EncodedArtifact } from "@ecp/types"

/** Options for JSON encode. @category Encoding */
export interface EncodeJsonOptions {
  /** Compact JSON (no pretty-print). */
  compact?: boolean
  /** Return string content instead of object. */
  as?: "object" | "string"
  /** Known source schema. */
  sourceSchema?: EcpSchema
}

/** Options for JSON decode. @category Encoding */
export interface DecodeJsonOptions {
  /** Expected target schema. */
  targetSchema?: EcpSchema
}

/**
 * Infer ECP schema from a document object.
 * @category Encoding
 */
export function getEcpSchema(value: unknown): EcpSchema | undefined {
  if (value !== null && typeof value === "object" && "schema" in value) {
    const s = (value as { schema: unknown }).schema
    if (typeof s === "string") return s as EcpSchema
  }
  return undefined
}

/**
 * Encode a document as canonical JSON.
 * @category Encoding
 */
export function encodeJson(input: unknown, options: EncodeJsonOptions = {}): EncodedArtifact {
  const sourceSchema = options.sourceSchema ?? getEcpSchema(input)
  const compact = options.compact ?? false

  if (options.as === "string") {
    return {
      schema: "@ecp.encoded",
      version: LATEST_ECP_VERSION,
      format: ECP_FORMATS.JSON,
      mediaType: "application/ecp+json",
      sourceSchema,
      content: JSON.stringify(input, null, compact ? 0 : 2),
    }
  }

  return {
    schema: "@ecp.encoded",
    version: LATEST_ECP_VERSION,
    format: ECP_FORMATS.JSON,
    mediaType: "application/ecp+json",
    sourceSchema,
    content: input,
  }
}

/**
 * Decode JSON text or object to a document.
 * @category Encoding
 */
export function decodeJson<T = unknown>(
  input: unknown,
  options: DecodeJsonOptions = {}
): DecodeResult<T> {
  const document =
    typeof input === "string" ? (JSON.parse(input) as T) : (input as T)

  return {
    schema: "@ecp.decoded",
    version: LATEST_ECP_VERSION,
    targetSchema: options.targetSchema ?? getEcpSchema(document),
    document,
    diagnostics: [],
  }
}
