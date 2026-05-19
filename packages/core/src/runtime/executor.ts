import type { RunResult, WorkflowManifest } from "@ecp/types"

/** Runtime execution context. @category Runtime */
export interface RuntimeExecutionContext {
  runId: string
  input: Record<string, unknown>
  registry: import("../registry/registry.js").Registry
  bindings: import("../environment/bindings.js").ResolvedBindings
}

/** Runtime executor interface. @category Runtime */
export interface RuntimeExecutor {
  execute(
    manifest: WorkflowManifest,
    context: RuntimeExecutionContext
  ): Promise<RunResult>
}
