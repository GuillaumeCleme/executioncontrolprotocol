import type { HarnessInvokeResult, InvokeResult, WorkflowManifest } from "@ecp/types"

/**
 * Fail with diagnostics when a harness invoke did not succeed.
 * @category Evals
 */
export function assertHarnessInvokeSuccess(result: InvokeResult): asserts result is InvokeResult & {
  success: true
  result: HarnessInvokeResult
} {
  if (result.success) return
  const messages = result.diagnostics.map((d) => d.message).join("; ")
  const validation = result.validation
    ? ` validation=${JSON.stringify(result.validation.errors)}`
    : ""
  throw new Error(`Harness invoke failed: ${messages}${validation}`)
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
 * Load echo workflow fixture for patch evals.
 * @category Evals
 */
export function loadEchoWorkflowFixture(): WorkflowManifest {
  return {
    schema: "@ecp.workflow",
    version: "1.0",
    workflow: { id: "echo-test", label: "Echo test" },
    steps: [
      {
        type: "step",
        id: "echo",
        label: "Echo",
        uses: "@ecp/test.echo",
        input: { value: "hello from fluent API" },
        as: "echo",
      },
    ],
  }
}
