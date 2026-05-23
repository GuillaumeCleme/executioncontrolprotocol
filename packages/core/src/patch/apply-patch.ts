import {
  ECP_PATCH_ERROR_CODES,
  LATEST_ECP_VERSION,
  type AppliedPatchEntry,
  type EcpSchema,
  type PatchResult,
  type ValidationIssue,
  type WorkflowManifest,
} from "@ecp/types"
import cloneDeep from "lodash/cloneDeep.js"
import get from "lodash/get.js"
import merge from "lodash/merge.js"
import set from "lodash/set.js"
import { validateWorkflow } from "../validate/workflow.js"
import { buildStepIndex } from "./step-index.js"
import { normalizePatchInput, validatePatchDocument } from "./normalize-input.js"
import { resolveEcpPatchPath } from "./resolve-path.js"
import type { EcpPatchInput } from "@ecp/types"

function emptyDiagnostics(): ValidationIssue[] {
  return []
}

/**
 * Apply a patch to a workflow manifest (canonical JSON only).
 * @category Patch
 */
export function applyPatch<T extends WorkflowManifest>(
  document: T,
  input: EcpPatchInput,
  targetSchema: EcpSchema = "@ecp.workflow"
): PatchResult<T> {
  const diagnostics = emptyDiagnostics()
  const patch = normalizePatchInput(input, targetSchema)

  const patchValidation = validatePatchDocument(patch)
  if (!patchValidation.valid) {
    return {
      schema: "@ecp.patch.result",
      version: LATEST_ECP_VERSION,
      success: false,
      targetSchema,
      patch,
      applied: [],
      diagnostics: patchValidation.errors.map((message) => ({
        severity: "error",
        message,
        code: ECP_PATCH_ERROR_CODES.PATCH_INVALID_DOCUMENT,
      })),
    }
  }

  const index = buildStepIndex(document)
  if (index.duplicates.length > 0) {
    return {
      schema: "@ecp.patch.result",
      version: LATEST_ECP_VERSION,
      success: false,
      targetSchema,
      patch,
      applied: [],
      diagnostics: index.duplicates.map((id) => ({
        severity: "error",
        code: ECP_PATCH_ERROR_CODES.DUPLICATE_STEP_ID,
        message: `Duplicate step id: ${id}`,
      })),
    }
  }

  const nextDocument = cloneDeep(document) as T
  const applied: AppliedPatchEntry[] = []

  for (const entry of patch.patches) {
    const resolved = resolveEcpPatchPath(document, entry.path)
    if (!resolved.ok) {
      applied.push({
        path: entry.path,
        mode: entry.mode ?? "merge",
        success: false,
        diagnostics: [
          {
            severity: "error",
            code: resolved.code,
            message: resolved.message,
          },
        ],
      })
      diagnostics.push({
        severity: "error",
        code: resolved.code,
        message: resolved.message,
        path: entry.path,
      })
      continue
    }

    const mode = entry.mode ?? "merge"
    const currentValue = get(nextDocument, resolved.lodashPath)
    const nextValue =
      mode === "replace"
        ? entry.value
        : merge(cloneDeep(currentValue ?? {}), entry.value as object)

    try {
      set(nextDocument, resolved.lodashPath, nextValue)
      applied.push({ path: entry.path, mode, success: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      applied.push({
        path: entry.path,
        mode,
        success: false,
        diagnostics: [
          {
            severity: "error",
            code: ECP_PATCH_ERROR_CODES.PATCH_APPLY_FAILED,
            message,
          },
        ],
      })
      diagnostics.push({
        severity: "error",
        code: ECP_PATCH_ERROR_CODES.PATCH_APPLY_FAILED,
        message,
        path: entry.path,
      })
    }
  }

  const validation = validateWorkflow(nextDocument)
  const success = diagnostics.length === 0 && validation.valid

  return {
    schema: "@ecp.patch.result",
    version: LATEST_ECP_VERSION,
    success,
    targetSchema,
    result: nextDocument,
    patch,
    applied,
    validation,
    diagnostics: [...diagnostics, ...validation.errors, ...validation.warnings],
  }
}
