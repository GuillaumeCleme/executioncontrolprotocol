import { harnessCapabilityId, type HarnessCapabilityId, type HarnessId } from "@ecp/types"

/** Unified harness id (browser demo + eval matrix; routes by input `task`). @category Harness */
export const BROWSER_HARNESS_ID = "@ecp/harness-browser" as HarnessId

/** Evaluate capability for all harness tasks. @category Harness */
export const BROWSER_HARNESS_CAPABILITY: HarnessCapabilityId =
  harnessCapabilityId(BROWSER_HARNESS_ID)

/** @deprecated Use {@link BROWSER_HARNESS_ID} */
export const EVALS_HARNESS_ID = BROWSER_HARNESS_ID

/** @deprecated Use {@link BROWSER_HARNESS_CAPABILITY} */
export const EVALS_HARNESS_CAPABILITY = BROWSER_HARNESS_CAPABILITY
