import { harnessCapabilityId, type HarnessId } from "@ecp/types"

/** Eval workflow authoring harness id. @category Evals */
export const EVALS_WORKFLOW_AUTHORING_ID = "@ecp/evals-workflow-authoring" as HarnessId

/** Eval intent classification harness id. @category Evals */
export const EVALS_INTENT_CLASSIFICATION_ID = "@ecp/evals-intent-classification" as HarnessId

/** Evaluate capability for eval workflow authoring. @category Evals */
export const EVALS_WORKFLOW_AUTHORING_CAPABILITY = harnessCapabilityId(EVALS_WORKFLOW_AUTHORING_ID)

/** Evaluate capability for eval intent classification. @category Evals */
export const EVALS_INTENT_CLASSIFICATION_CAPABILITY = harnessCapabilityId(EVALS_INTENT_CLASSIFICATION_ID)
