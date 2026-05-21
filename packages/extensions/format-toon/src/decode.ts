import {
  ECP_ENCODING_ERROR_CODES,
  LATEST_ECP_VERSION,
} from "@ecp/types"
import type { DecodeResult, EcpDecodeInput, WorkflowManifest } from "@ecp/types"
import { EcpError, validateWorkflow, type UtilityCapabilityContext } from "@ecp/core"
import { parseToonWorkflow } from "./parser.js"

/**
 * Decode TOON text to workflow manifest.
 * @category Encoding
 */
export function decodeToonToWorkflow(
  input: EcpDecodeInput,
  _ctx: UtilityCapabilityContext
): DecodeResult<WorkflowManifest> {
  const target = input.targetSchema ?? "@ecp.workflow"

  if (target !== "@ecp.workflow") {
    throw new EcpError(ECP_ENCODING_ERROR_CODES.FORMAT_UNSUPPORTED_TARGET_SCHEMA, {
      message: "TOON decoder only supports @ecp.workflow.",
    })
  }

  const content = String(input.content)
  let document: WorkflowManifest
  try {
    document = parseToonWorkflow(content)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new EcpError(ECP_ENCODING_ERROR_CODES.FORMAT_DECODE_FAILED, {
      message: `TOON parse failed: ${message}`,
    })
  }

  const validation = validateWorkflow(document)

  if (!validation.valid && input.options?.strict) {
    throw new EcpError(ECP_ENCODING_ERROR_CODES.FORMAT_DECODE_FAILED, {
      message: "TOON decoded into an invalid workflow manifest.",
      diagnostics: validation.errors,
    })
  }

  return {
    schema: "@ecp.decoded",
    version: LATEST_ECP_VERSION,
    targetSchema: "@ecp.workflow",
    document,
    diagnostics: [...validation.errors, ...validation.warnings],
  }
}
