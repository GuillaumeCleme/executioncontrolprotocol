import type { CapabilityId, NamespacedId } from "./schema.js"
import type { UsageSummary } from "./invoke.js"
import type { ValidationResult } from "./validation.js"

/** Reserved capability name for harness invocation. @category Harness */
export const ECP_HARNESS_CAPABILITY_NAME = "evaluate" as const

/** Harness validation error codes. @category Harness */
export const ECP_HARNESS_ERROR_CODES = {
  UNKNOWN_HARNESS: "UNKNOWN_HARNESS",
  UNKNOWN_HARNESS_PROVIDER: "UNKNOWN_HARNESS_PROVIDER",
  UNKNOWN_OUTPUT_FORMAT: "UNKNOWN_OUTPUT_FORMAT",
  HARNESS_PROVIDER_CONTRACT_MISMATCH: "HARNESS_PROVIDER_CONTRACT_MISMATCH",
  HARNESS_NOT_BOUND: "HARNESS_NOT_BOUND",
  HARNESS_EVALUATE_FAILED: "HARNESS_EVALUATE_FAILED",
} as const

/** Harness validation error code union. @category Harness */
export type EcpHarnessErrorCode =
  (typeof ECP_HARNESS_ERROR_CODES)[keyof typeof ECP_HARNESS_ERROR_CODES]

/** Core-cataloged formatter extension ids. @category Harness */
export const ECP_CORE_FORMATTER_IDS = {
  JSON: "@ecp/format-json",
  FLUENT: "@ecp/format-fluent",
} as const

/** Harness namespaced id. @category Harness */
export type HarnessId = NamespacedId

/** Harness evaluate capability id. @category Harness */
export type HarnessCapabilityId = `${HarnessId}.${typeof ECP_HARNESS_CAPABILITY_NAME}`

/** Build harness evaluate capability id. @category Harness */
export function harnessCapabilityId(harnessId: HarnessId | string): HarnessCapabilityId {
  const id = harnessId.startsWith("@") ? harnessId : (`@ecp/${harnessId}` as NamespacedId)
  return `${id}.${ECP_HARNESS_CAPABILITY_NAME}` as HarnessCapabilityId
}

/** Trace metadata from a harness run. @category Harness */
export interface HarnessTrace {
  /** Harness id. */
  harness: HarnessId
  /** Provider capability used. */
  provider: CapabilityId
  /** Model id if provided. */
  model?: string
  /** Target output schema. */
  outputSchema?: string
  /** Formatter extension id. */
  outputFormat?: string
  /** Whether decode succeeded. */
  decodeSucceeded?: boolean
  /** Whether validation succeeded. */
  validationSucceeded?: boolean
  /** Prompt sent to model when traced. */
  prompt?: string
  /** Raw model output when traced. */
  rawOutput?: string
}

/** Standard harness evaluate result envelope. @category Harness */
export interface HarnessInvokeResult<TArtifact = unknown> {
  /** Parsed artifact after decode (and optional patch). */
  artifact: TArtifact
  /** Raw model text before decode. */
  raw: string
  /** Validation result when enabled. */
  validation?: ValidationResult
  /** Execution trace. */
  trace: HarnessTrace
  /** Provider usage summary. */
  usage?: UsageSummary
}
