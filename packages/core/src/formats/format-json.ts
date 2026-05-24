import { capabilityFor, defineExtension } from "../definitions/index.js"
import {
  ecpDecodeInputSchema,
  ecpDecodeResultSchema,
  ecpEncodeInputSchema,
  ecpEncodeResultSchema,
} from "../encoding/schemas.js"
import { decodeJson, encodeJson } from "../encoding/json-codec.js"
import type { EcpDecodeInput, EcpEncodeInput, EcpSchema } from "@ecp/types"
import { ecpIntentSchema } from "@ecp/types"
import { validateWorkflow } from "../validate/workflow.js"
import { ecpPatchDocumentSchema } from "../patch/patch-document.js"
import { emptyValidationResult } from "../validate/workflow-schema.js"
import { zodIssuesToValidationIssues } from "../validate/zod-mapper.js"

function validateDecodedDocument(
  document: unknown,
  targetSchema?: EcpSchema
): import("@ecp/types").ValidationResult {
  if (targetSchema === "@ecp.workflow") {
    return validateWorkflow(document as import("@ecp/types").WorkflowManifest)
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
export const formatJsonExtension = defineExtension("@ecp", "format-json")
  .withCapabilities([
    capabilityFor("@ecp/format-json", "encode")
      .withInput(ecpEncodeInputSchema)
      .withOutput(ecpEncodeResultSchema)
      .withHandler((input) =>
        encodeJson((input as EcpEncodeInput).source, {
          ...(input as EcpEncodeInput).options,
          sourceSchema: (input as EcpEncodeInput).sourceSchema,
          sourceVersion: (input as EcpEncodeInput).sourceVersion,
        })
      ),
    capabilityFor("@ecp/format-json", "decode")
      .withInput(ecpDecodeInputSchema)
      .withOutput(ecpDecodeResultSchema)
      .withHandler((input) => {
        const decoded = input as EcpDecodeInput
        const target = decoded.targetSchema
        const validation = target
          ? validateDecodedDocument(
              typeof decoded.input === "string" ? JSON.parse(decoded.input) : decoded.input,
              target
            )
          : emptyValidationResult(true)
        return decodeJson(decoded.input, {
          targetSchema: target,
          targetVersion: decoded.targetVersion,
          validation,
          ...decoded.options,
        })
      }),
  ])
  .build()
