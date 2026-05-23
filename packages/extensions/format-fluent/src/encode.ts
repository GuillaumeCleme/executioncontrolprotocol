import {
  ECP_ENCODING_ERROR_CODES,
  ECP_FORMATS,
  LATEST_ECP_VERSION,
} from "@ecp/types"
import type { EcpEncodeInput, EncodeResult, WorkflowManifest } from "@ecp/types"
import { encodeFailure, validateWorkflow, type UtilityCapabilityContext } from "@ecp/core"
import { renderWorkflowManifestToFluent } from "./render-workflow.js"

/**
 * Encode workflow manifest to Fluent API source.
 * @category Encoding
 */
export function encodeWorkflowToFluent(
  input: EcpEncodeInput,
  _ctx: UtilityCapabilityContext
): EncodeResult<string> {
  if (input.sourceSchema && input.sourceSchema !== "@ecp.workflow") {
    return encodeFailure({
      format: ECP_FORMATS.FLUENT,
      sourceSchema: input.sourceSchema,
      diagnostics: [
        {
          severity: "error",
          code: ECP_ENCODING_ERROR_CODES.FORMAT_UNSUPPORTED_SOURCE_SCHEMA,
          message: "Fluent encoder only supports @ecp.workflow.",
        },
      ],
    })
  }

  const manifest = input.source as WorkflowManifest
  const validation = validateWorkflow(manifest)
  if (!validation.valid) {
    return encodeFailure({
      format: ECP_FORMATS.FLUENT,
      sourceSchema: "@ecp.workflow",
      validation,
      diagnostics: [...validation.errors, ...validation.warnings],
    })
  }

  const content = renderWorkflowManifestToFluent(manifest, {
    compact: input.options?.compact ?? false,
  })

  return {
    schema: "@ecp.encode.result",
    version: LATEST_ECP_VERSION,
    success: true,
    format: ECP_FORMATS.FLUENT,
    mediaType: "text/typescript",
    sourceSchema: "@ecp.workflow",
    sourceVersion: input.sourceVersion,
    result: content,
    diagnostics: [],
  }
}
