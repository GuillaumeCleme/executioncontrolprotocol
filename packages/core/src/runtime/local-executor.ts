import { LATEST_ECP_VERSION } from "@ecp/types"
import type {
  RunResult,
  StepNode,
  StepRunRecord,
  WorkflowManifest,
  WorkflowNode,
} from "@ecp/types"
import { randomUUID } from "node:crypto"
import type { RuntimeExecutor, RuntimeExecutionContext } from "./executor.js"
import {
  createConsoleLogger,
  createUsageLedger,
  type CapabilityContext,
  type PolicyContext,
} from "./context.js"
import { emitLifecycle } from "./lifecycle.js"
import { evaluatePolicies } from "./policy-engine.js"
import { resolveStepInput } from "./resolve-input.js"
import {
  collectStateHandles,
  createMutationBuffer,
  createTransactionalStore,
} from "./store.js"
import { commitTransaction } from "./commit.js"

function evalExpr(
  expr: import("@ecp/types").ExprValue | undefined,
  state: Record<string, unknown>
): boolean {
  if (!expr) return true
  if ("eq" in expr && Array.isArray(expr.eq)) {
    const [path, expected] = expr.eq
    const parts = String(path).split(".")
    let cur: unknown = state
    for (const p of parts) {
      if (cur && typeof cur === "object") cur = (cur as Record<string, unknown>)[p]
    }
    return cur === expected
  }
  return true
}

/** Local in-process runtime executor. @category Runtime */
export class LocalRuntimeExecutor implements RuntimeExecutor {
  async execute(
    manifest: WorkflowManifest,
    context: RuntimeExecutionContext
  ): Promise<RunResult> {
    const runId = randomUUID()
    const state: Record<string, unknown> = { ...context.input }
    const history: Record<string, StepRunRecord> = {}
    const usage = createUsageLedger()
    const logger = createConsoleLogger()
    const extensionHooks = context.bindings.extensionHooks

    await emitLifecycle("run:before", extensionHooks, {
      event: "run:before",
      workflow: manifest,
      run: { id: runId, input: context.input },
      state,
    })
    await emitLifecycle("run:started", extensionHooks, {
      event: "run:started",
      workflow: manifest,
      run: { id: runId, input: context.input },
      state,
    })

    try {
      await this.runNodes(manifest.steps, {
        manifest,
        runId,
        state,
        history,
        usage,
        logger,
        context,
        extensionHooks,
      })

      await emitLifecycle("run:completed", extensionHooks, {
        event: "run:completed",
        workflow: manifest,
        run: { id: runId, input: context.input },
        state,
      })

      return {
        schema: "@ecp.run.result",
        version: LATEST_ECP_VERSION,
        run: { id: runId, status: "completed" },
        state,
        history,
        usage: { ...usage },
      }
    } catch {
      await emitLifecycle("run:failed", extensionHooks, {
        event: "run:failed",
        workflow: manifest,
        run: { id: runId, input: context.input },
        state,
      })
      return {
        schema: "@ecp.run.result",
        version: LATEST_ECP_VERSION,
        run: { id: runId, status: "failed" },
        state,
        history,
        usage: { ...usage },
      }
    } finally {
      await emitLifecycle("run:finally", extensionHooks, {
        event: "run:finally",
        workflow: manifest,
        run: { id: runId, input: context.input },
        state,
      })
    }
  }

  private async runNodes(
    nodes: WorkflowNode[],
    ctx: {
      manifest: WorkflowManifest
      runId: string
      state: Record<string, unknown>
      history: Record<string, StepRunRecord>
      usage: ReturnType<typeof createUsageLedger>
      logger: ReturnType<typeof createConsoleLogger>
      context: RuntimeExecutionContext
      extensionHooks: import("../definitions/types.js").HookDefinition[]
    }
  ): Promise<void> {
    for (const node of nodes) {
      await this.runNode(node, ctx)
    }
  }

  private async runNode(
    node: WorkflowNode,
    ctx: {
      manifest: WorkflowManifest
      runId: string
      state: Record<string, unknown>
      history: Record<string, StepRunRecord>
      usage: ReturnType<typeof createUsageLedger>
      logger: ReturnType<typeof createConsoleLogger>
      context: RuntimeExecutionContext
      extensionHooks: import("../definitions/types.js").HookDefinition[]
    }
  ): Promise<void> {
    if (node.type === "parallel") {
      await Promise.all(
        node.branches.map((branch) => this.runNodes(branch, ctx))
      )
      return
    }
    if (node.type === "branch") {
      for (const b of node.branches) {
        if (evalExpr(b.when, ctx.state)) {
          await this.runNodes(b.steps, ctx)
          break
        }
      }
      return
    }
    if (node.type === "loop") {
      let rounds = 0
      while (!node.until || !evalExpr(node.until, ctx.state)) {
        if (node.maxRounds !== undefined && rounds >= node.maxRounds) break
        await this.runNodes(node.steps, ctx)
        rounds++
        if (node.until && evalExpr(node.until, ctx.state)) break
      }
      return
    }

    const step = node as StepNode
    if (step.when && !evalExpr(step.when, ctx.state)) return

    await this.executeStep(step, ctx)
  }

  private async executeStep(
    step: StepNode,
    ctx: {
      manifest: WorkflowManifest
      runId: string
      state: Record<string, unknown>
      history: Record<string, StepRunRecord>
      usage: ReturnType<typeof createUsageLedger>
      logger: ReturnType<typeof createConsoleLogger>
      context: RuntimeExecutionContext
      extensionHooks: import("../definitions/types.js").HookDefinition[]
    }
  ): Promise<void> {
    const cap = ctx.context.registry.getCapability(step.uses)
    if (!cap) {
      throw new Error(`Unknown capability: ${step.uses}`)
    }

    const stepCtx = {
      id: step.id,
      capabilityId: step.uses,
      label: step.label,
    }

    await emitLifecycle("step:before", ctx.extensionHooks, {
      event: "step:before",
      workflow: ctx.manifest,
      run: { id: ctx.runId, input: ctx.context.input },
      step: stepCtx,
      state: ctx.state,
    })

    const resolvedInput = resolveStepInput(step.input, ctx.state)
    const mutableHandles = collectStateHandles(resolvedInput)

    const policyCtxBase: Omit<PolicyContext, "output" | "pendingMutations" | "proposedState"> = {
      workflow: ctx.manifest,
      run: { id: ctx.runId, input: ctx.context.input },
      step: stepCtx,
      state: ctx.state,
      input: resolvedInput,
      mutableStateHandles: [...mutableHandles].map((p) => ({
        path: p,
        __brand: undefined,
      })),
      usage: ctx.usage,
    }

    const preDecision = await evaluatePolicies(
      "policy:pre",
      ctx.context.bindings.policyHooks,
      policyCtxBase as PolicyContext
    )
    if (preDecision.type === "deny") {
      ctx.history[step.id] = { status: "failed" }
      return
    }

    const buffer = createMutationBuffer(ctx.state, mutableHandles)
    const store = createTransactionalStore({
      state: ctx.state,
      buffer,
      allowedHandles: mutableHandles,
    })

    const extId = step.uses.replace(/\.[^.]+$/, "")
    const extBinding = ctx.context.bindings.extensions.find(
      (e) => e.id === extId
    )
    const capCtx: CapabilityContext & {
      extensionConfig?: Record<string, unknown>
    } = {
      store,
      state: ctx.state,
      run: { id: ctx.runId, input: ctx.context.input },
      step: stepCtx,
      logger: ctx.logger,
      usage: ctx.usage,
      extensionConfig: extBinding?.config,
      capabilities: {
        call: async (id, input) => {
          const c = ctx.context.registry.getCapability(id)
          if (!c) throw new Error(`Unknown capability: ${id}`)
          return c.handler(input, capCtx)
        },
      },
    }

    await emitLifecycle("step:started", ctx.extensionHooks, {
      event: "step:started",
      workflow: ctx.manifest,
      run: { id: ctx.runId, input: ctx.context.input },
      step: stepCtx,
      state: ctx.state,
    })

    let output: unknown
    try {
      output = await cap.handler(resolvedInput, capCtx)
    } catch {
      buffer.discard()
      ctx.history[step.id] = { status: "failed" }
      return
    }

    const proposedState = buffer.preview(ctx.state)
    const postDecision = await evaluatePolicies(
      "policy:post",
      ctx.context.bindings.policyHooks,
      {
        ...policyCtxBase,
        output,
        pendingMutations: buffer.pending(),
        proposedState,
      } as PolicyContext
    )

    if (postDecision.type === "deny" || postDecision.type === "pause") {
      buffer.discard()
      ctx.history[step.id] = {
        status: postDecision.type === "pause" ? "paused" : "failed",
        output,
      }
      return
    }

    commitTransaction({
      state: ctx.state,
      mutations: buffer.pending(),
      output,
      commitAs: step.commitAs,
      commitMode: step.commitMode,
    })

    ctx.history[step.id] = {
      status: "completed",
      output,
      committedAs: step.commitAs ?? null,
    }

    await emitLifecycle("step:completed", ctx.extensionHooks, {
      event: "step:completed",
      workflow: ctx.manifest,
      run: { id: ctx.runId, input: ctx.context.input },
      step: stepCtx,
      state: ctx.state,
    })

    await emitLifecycle("step:finally", ctx.extensionHooks, {
      event: "step:finally",
      workflow: ctx.manifest,
      run: { id: ctx.runId, input: ctx.context.input },
      step: stepCtx,
      state: ctx.state,
    })

    await evaluatePolicies(
      "policy:finally",
      ctx.context.bindings.policyHooks,
      {
        ...policyCtxBase,
        output,
      } as PolicyContext
    )
  }
}
