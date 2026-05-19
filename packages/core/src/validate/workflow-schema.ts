import { z } from "zod"
import { LATEST_ECP_VERSION } from "@ecp/types"

/** Zod schema for workflow manifest validation. @category Validation */
export const workflowManifestSchema = z.object({
  schema: z.literal("@ecp.workflow"),
  version: z.string(),
  workflow: z.object({
    id: z.string().min(1),
    label: z.string().optional(),
  }),
  steps: z.array(z.record(z.unknown())).min(0),
})

/** Empty validation result template. */
export function emptyValidationResult(valid: boolean): import("@ecp/types").ValidationResult {
  return {
    schema: "@ecp.validation.result",
    version: LATEST_ECP_VERSION,
    valid,
    errors: [],
    warnings: [],
  }
}
