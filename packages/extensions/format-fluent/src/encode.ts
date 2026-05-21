import {
  ECP_ENCODING_ERROR_CODES,
  ECP_FORMATS,
  LATEST_ECP_VERSION,
} from "@ecp/types"
import type { EcpEncodeInput, EncodedArtifact, WorkflowManifest } from "@ecp/types"
import { EcpError, validateWorkflow, type UtilityCapabilityContext } from "@ecp/core"
import { renderWorkflowManifestToFluent } from "./render-workflow.js"

/**
 * Encode workflow manifest to Fluent API source.
 * @category Encoding
 */
export function encodeWorkflowToFluent(
  input: EcpEncodeInput,
  _ctx: UtilityCapabilityContext
): EncodedArtifact<string> {
  if (input.sourceSchema && input.sourceSchema !== "@ecp.workflow") {
    throw new EcpError(ECP_ENCODING_ERROR_CODES.FORMAT_UNSUPPORTED_SOURCE_SCHEMA, {
      message: "Fluent encoder only supports @ecp.workflow.",
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

  const content = renderWorkflowManifestToFluent(manifest, {
    compact: input.options?.compact ?? false,
  })

  return {
    schema: "@ecp.encoded",
    version: LATEST_ECP_VERSION,
    format: ECP_FORMATS.FLUENT,
    mediaType: "text/typescript",
    sourceSchema: "@ecp.workflow",
    content,
    diagnostics: [],
  }
}
