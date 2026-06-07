import { expect } from "vitest"
import type { EcpIntentValue, HarnessInvokeResult, InvokeResult } from "@ecp/types"
import { formatHarnessTrace, formatInvokeFailure } from "../../src/fixtures/harness-trace-format.js"

export { formatHarnessTrace, formatInvokeFailure } from "../../src/fixtures/harness-trace-format.js"

/**
 * Fail with diagnostics when a harness invoke did not succeed.
 * @category Evals
 */
export function assertHarnessInvokeSuccess(result: InvokeResult): asserts result is InvokeResult & {
  success: true
  result: HarnessInvokeResult
} {
  if (result.success) return
  throw new Error(`Harness invoke failed:\n${formatInvokeFailure(result)}`)
}

/**
 * Extract harness result envelope after a successful invoke.
 * @category Evals
 */
export function harnessResult<T>(result: InvokeResult): HarnessInvokeResult<T> {
  assertHarnessInvokeSuccess(result)
  return result.result as HarnessInvokeResult<T>
}

/**
 * Vitest-friendly hint appended to `expect(..., hint)` when an artifact assertion fails.
 * @category Evals
 */
export function harnessTraceHint(harnessOutput: HarnessInvokeResult): string {
  return `\n--- harness trace ---\n${formatHarnessTrace(harnessOutput)}`
}

/**
 * Assert classified intent with full trace on mismatch.
 * @category Evals
 */
export function expectHarnessIntent(
  result: InvokeResult,
  expected: EcpIntentValue
): HarnessInvokeResult<{ schema: "@ecp.intent"; intent: EcpIntentValue }> {
  const harnessOutput = harnessResult<{ schema: "@ecp.intent"; intent: EcpIntentValue }>(result)
  expect(harnessOutput.artifact.intent, harnessTraceHint(harnessOutput)).toBe(expected)
  return harnessOutput
}
