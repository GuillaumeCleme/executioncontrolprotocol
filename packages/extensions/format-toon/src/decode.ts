import {
  ECP_ENCODING_ERROR_CODES,
  LATEST_ECP_VERSION,
} from "@ecp/types"
import type { DecodeResult, EcpDecodeInput, EcpSchema } from "@ecp/types"
import { EcpError, type UtilityCapabilityContext } from "@ecp/core"
import { getEcpSchema } from "./schema.js"
import { decodeDocumentFromToon } from "./toon-codec.js"
import { validateEcpDocument, validationToDiagnostics } from "./validate-document.js"

/**
 * Decode TOON text to an ECP document via `@toon-format/toon` (schema-agnostic).
 * Known schemas are validated; `strict` fails only when validation does not pass.
 * @category Encoding
 */
export function decodeFromToon(
  input: EcpDecodeInput,
  _ctx: UtilityCapabilityContext
): DecodeResult {
  const content = String(input.content)
  let document: unknown

  try {
    document = decodeDocumentFromToon(content, {
      strict: input.options?.strict ?? true,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new EcpError(ECP_ENCODING_ERROR_CODES.FORMAT_DECODE_FAILED, {
      message: `TOON decode failed: ${message}`,
    })
  }

  const targetSchema: EcpSchema | undefined =
    input.targetSchema ?? getEcpSchema(document)

  const validation = validateEcpDocument(document, targetSchema)
  const diagnostics = validationToDiagnostics(validation)

  if (input.options?.strict && !validation.valid) {
    throw new EcpError(ECP_ENCODING_ERROR_CODES.FORMAT_DECODE_FAILED, {
      message: `Decoded document failed validation for ${targetSchema ?? "unknown schema"}.`,
      diagnostics: validation.errors,
    })
  }

  return {
    schema: "@ecp.decoded",
    version: LATEST_ECP_VERSION,
    targetSchema,
    document,
    diagnostics,
  }
}

/** @deprecated Use {@link decodeFromToon}. @category Encoding */
export const decodeToonToWorkflow = decodeFromToon
