import { harnessCapabilityId, type HarnessId } from "@ecp/types"

/** Browser workflow authoring harness id. @category Browser */
export const BROWSER_WORKFLOW_AUTHORING_ID = "@ecp/browser-workflow-authoring" as HarnessId

/** Browser intent classification harness id. @category Browser */
export const BROWSER_INTENT_CLASSIFICATION_ID = "@ecp/browser-intent-classification" as HarnessId

/** Evaluate capability for browser workflow authoring. @category Browser */
export const BROWSER_WORKFLOW_AUTHORING_CAPABILITY = harnessCapabilityId(
  BROWSER_WORKFLOW_AUTHORING_ID
)

/** Evaluate capability for browser intent classification. @category Browser */
export const BROWSER_INTENT_CLASSIFICATION_CAPABILITY = harnessCapabilityId(
  BROWSER_INTENT_CLASSIFICATION_ID
)
