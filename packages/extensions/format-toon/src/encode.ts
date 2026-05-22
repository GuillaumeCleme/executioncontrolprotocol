import {
  ECP_ENCODING_ERROR_CODES,
  ECP_FORMATS,
  LATEST_ECP_VERSION,
} from "@ecp/types"
import type { EcpEncodeInput, EncodedArtifact } from "@ecp/types"
import { EcpError, type UtilityCapabilityContext } from "@ecp/core"
import { getEcpSchema } from "./schema.js"
import { encodeDocumentToToon } from "./toon-codec.js"
import { validateEcpDocument, validationToDiagnostics } from "./validate-document.js"

/**
 * Encode an ECP document to TOON via `@toon-format/toon` (schema-agnostic).
 * Known schemas are validated; diagnostics are attached without rejecting unknown types.
 * @category Encoding
 */
export function encodeToToon(
  input: EcpEncodeInput,
  _ctx: UtilityCapabilityContext
): EncodedArtifact<string> {
  const sourceSchema = input.sourceSchema ?? getEcpSchema(input.source)
  const validation = validateEcpDocument(input.source, sourceSchema)

  try {
    const content = encodeDocumentToToon(input.source, {
      compact: input.options?.compact ?? false,
    })

    return {
      schema: "@ecp.encoded",
      version: LATEST_ECP_VERSION,
      format: ECP_FORMATS.TOON,
      mediaType: "text/ecp-toon",
      sourceSchema,
      content,
      diagnostics: validationToDiagnostics(validation),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new EcpError(ECP_ENCODING_ERROR_CODES.FORMAT_ENCODE_FAILED, {
      message: `TOON encode failed: ${message}`,
    })
  }
}

/** @deprecated Use {@link encodeToToon}. @category Encoding */
export const encodeWorkflowToToon = encodeToToon
