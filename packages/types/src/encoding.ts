import type { EcpSchema } from "./schema.js"
import type { EcpVersion } from "./version.js"
import type { ValidationIssue } from "./validation.js"

/** Reserved capability names for format extensions. @category Encoding */
export const ECP_FORMAT_CAPABILITY_NAMES = {
  ENCODE: "encode",
  DECODE: "decode",
} as const

/** Known format identifiers. @category Encoding */
export const ECP_FORMATS = {
  JSON: "json",
  TOON: "toon",
  FLUENT: "fluent",
} as const

/** Encoding error codes. @category Encoding */
export const ECP_ENCODING_ERROR_CODES = {
  FORMAT_EXTENSION_NOT_FOUND: "FORMAT_EXTENSION_NOT_FOUND",
  FORMAT_ENCODER_NOT_FOUND: "FORMAT_ENCODER_NOT_FOUND",
  FORMAT_DECODER_NOT_FOUND: "FORMAT_DECODER_NOT_FOUND",
  FORMAT_ENCODER_INVALID_CONTRACT: "FORMAT_ENCODER_INVALID_CONTRACT",
  FORMAT_DECODER_INVALID_CONTRACT: "FORMAT_DECODER_INVALID_CONTRACT",
  FORMAT_ENCODE_FAILED: "FORMAT_ENCODE_FAILED",
  FORMAT_DECODE_FAILED: "FORMAT_DECODE_FAILED",
  FORMAT_UNSUPPORTED_SOURCE_SCHEMA: "FORMAT_UNSUPPORTED_SOURCE_SCHEMA",
  FORMAT_UNSUPPORTED_TARGET_SCHEMA: "FORMAT_UNSUPPORTED_TARGET_SCHEMA",
} as const

/** Encoding error code union. @category Encoding */
export type EcpEncodingErrorCode =
  (typeof ECP_ENCODING_ERROR_CODES)[keyof typeof ECP_ENCODING_ERROR_CODES]

/** Encoded artifact from `env.encode().process()`. @category Encoding */
export interface EncodedArtifact<T = unknown> {
  /** Schema discriminator. */
  schema: "@ecp.encoded"
  /** Protocol version. */
  version: EcpVersion
  /** Format identifier (e.g. `json`, `toon`, `fluent`). */
  format: string
  /** Optional MIME type. */
  mediaType?: string
  /** Source document schema when known. */
  sourceSchema?: EcpSchema
  /** Encoded payload. */
  content: T
  /** Non-fatal issues from the encoder. */
  diagnostics?: ValidationIssue[]
}

/** Decode result from `env.decode().process()`. @category Encoding */
export interface DecodeResult<T = unknown> {
  /** Schema discriminator. */
  schema: "@ecp.decoded"
  /** Protocol version. */
  version: EcpVersion
  /** Target document schema when known. */
  targetSchema?: EcpSchema
  /** Decoded document. */
  document: T
  /** Validation or parse diagnostics. */
  diagnostics?: ValidationIssue[]
}

/** Concrete encoded artifact for schema generation. @category Encoding */
export type EncodedArtifactDocument = EncodedArtifact<unknown>

/** Concrete decode result for schema generation. @category Encoding */
export type DecodeResultDocument = DecodeResult<unknown>

/** Input to `{extensionId}.encode` capabilities. @category Encoding */
export interface EcpEncodeInput {
  /** Source document to encode. */
  source: unknown
  /** Source schema when known. */
  sourceSchema?: EcpSchema
  /** Target format hint. */
  format?: string
  /** Encoder options. */
  options?: {
    /** Compact output (format-specific). */
    compact?: boolean
    /** Fields to include when supported. */
    include?: string[]
    /** Return shape for JSON codec. */
    as?: "object" | "string"
  }
}

/** Input to `{extensionId}.decode` capabilities. @category Encoding */
export interface EcpDecodeInput {
  /** Encoded content to decode. */
  content: unknown
  /** Source format hint. */
  format?: string
  /** Expected target schema. */
  targetSchema?: EcpSchema
  /** Decoder options. */
  options?: {
    /** Fail when decoded document is invalid. */
    strict?: boolean
  }
}
