import {
  ECP_ENCODING_ERROR_CODES,
  ECP_FORMATS,
  LATEST_ECP_VERSION,
} from "@ecp/types"
import type { EcpEncodeInput, EncodedArtifact, WorkflowManifest } from "@ecp/types"
import { EcpError, validateWorkflow } from "@ecp/core"
import type { UtilityCapabilityContext } from "@ecp/core"
import { serializeWorkflowManifestToToon } from "./serializer.js"

/**
 * Encode workflow manifest to TOON.
 * @category Encoding
 */
export function encodeWorkflowToToon(
  input: EcpEncodeInput,
  _ctx: UtilityCapabilityContext
): EncodedArtifact<string> {
  if (input.sourceSchema && input.sourceSchema !== "@ecp.workflow") {
    throw new EcpError(ECP_ENCODING_ERROR_CODES.FORMAT_UNSUPPORTED_SOURCE_SCHEMA, {
      message: "TOON encoder only supports @ecp.workflow.",
    })
  }

  const manifest = input.source as WorkflowManifest
  const validation = validateWorkflow(manifest)
  if (!validation.valid) {
    throw new EcpError(ECP_ENCODING_ERROR_CODES.FORMAT_ENCODE_FAILED, {
      message: `Invalid workflow manifest: ${validation.errors.map((e) => e.message).join("; ")}`,
      diagnostics: validation.errors,
    })
  }
  const content = serializeWorkflowManifestToToon(manifest, {
    compact: input.options?.compact ?? false,
  })

  return {
    schema: "@ecp.encoded",
    version: LATEST_ECP_VERSION,
    format: ECP_FORMATS.TOON,
    mediaType: "text/ecp-toon",
    sourceSchema: "@ecp.workflow",
    content,
    diagnostics: [],
  }
}
