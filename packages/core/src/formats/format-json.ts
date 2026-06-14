import { capabilityFor, defineExtension } from "../definitions/index.js"
import {
  ecpDecodeInputSchema,
  ecpDecodeResultSchema,
  ecpEncodeInputSchema,
  ecpEncodeResultSchema,
} from "../encoding/schemas.js"
import { decodeJson, encodeJson } from "../encoding/json-codec.js"
import type { EcpDecodeInput, EcpEncodeInput, EcpSchema } from "@executioncontextprotocol/types"
import { ecpIntentSchema } from "@executioncontextprotocol/types"
import { validateWorkflow } from "../validate/workflow.js"
import { ecpPatchDocumentSchema } from "../patch/patch-document.js"
import { emptyValidationResult } from "../validate/workflow-schema.js"
import { zodIssuesToValidationIssues } from "../validate/zod-mapper.js"

function validateDecodedDocument(
  document: unknown,
  targetSchema?: EcpSchema
): import("@executioncontextprotocol/types").ValidationResult {
  if (targetSchema === "@ecp.workflow") {
    return validateWorkflow(document as import("@executioncontextprotocol/types").WorkflowManifest)
  }
  if (targetSchema === "@ecp.patch") {
    const parsed = ecpPatchDocumentSchema.safeParse(document)
    if (parsed.success) return emptyValidationResult(true)
    const result = emptyValidationResult(false)
    result.errors.push(...zodIssuesToValidationIssues(parsed.error.issues))
    return result
  }
  if (targetSchema === "@ecp.intent") {
    const parsed = ecpIntentSchema.safeParse(document)
    if (parsed.success) return emptyValidationResult(true)
    const result = emptyValidationResult(false)
    result.errors.push(...zodIssuesToValidationIssues(parsed.error.issues))
    return result
  }
  return emptyValidationResult(true)
}

/** Core JSON format extension. @category Formats */
export const formatJsonExtension = defineExtension("@executioncontextprotocol", "format-json")
  .withCapabilities([
    capabilityFor("@executioncontextprotocol/format-json", "encode")
      .withInput(ecpEncodeInputSchema)
      .withOutput(ecpEncodeResultSchema)
      .withHandler((input) =>
        encodeJson((input as EcpEncodeInput).source, {
          ...(input as EcpEncodeInput).options,
          sourceSchema: (input as EcpEncodeInput).sourceSchema,
          sourceVersion: (input as EcpEncodeInput).sourceVersion,
        })
      ),
    capabilityFor("@executioncontextprotocol/format-json", "decode")
      .withInput(ecpDecodeInputSchema)
      .withOutput(ecpDecodeResultSchema)
      .withHandler((input) => {
        const decoded = input as EcpDecodeInput
        const target = decoded.targetSchema
        const parsed = decodeJson(decoded.input, {
          targetSchema: target,
          targetVersion: decoded.targetVersion,
          ...decoded.options,
        })
        if (!parsed.success || parsed.result === undefined) {
          return parsed
        }
        const validation = target
          ? validateDecodedDocument(parsed.result, target)
          : emptyValidationResult(true)
        const success = validation.valid
        return {
          ...parsed,
          validation,
          success,
          diagnostics: [
            ...parsed.diagnostics,
            ...validation.errors,
            ...validation.warnings,
          ],
        }
      }),
  ])
  .build()
