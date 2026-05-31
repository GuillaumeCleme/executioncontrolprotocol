import { InMemoryRuntimeExecutor } from "@ecp/core"
import type { RunResult, WorkflowManifest } from "@ecp/types"
import type { RuntimeExecutionContext, RuntimeExecutor } from "@ecp/core"

/** Browser runtime executor (delegates to in-memory engine). @category Runtime */
export class BrowserRuntimeExecutor implements RuntimeExecutor {
  private readonly inner = new InMemoryRuntimeExecutor()

  execute(
    manifest: WorkflowManifest,
    context: RuntimeExecutionContext
  ): Promise<RunResult> {
    const maxConcurrency =
      context.maxConcurrency ??
      (context.bindings.runtime.config.maxConcurrency as number | undefined) ??
      4
    return this.inner.execute(manifest, { ...context, maxConcurrency })
  }
}
