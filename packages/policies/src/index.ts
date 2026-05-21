import type { PolicyContext } from "@ecp/core"
import type { PolicyDecision } from "@ecp/types"
import { definePolicy, hook, globalRegistry } from "@ecp/core"
import { boolean, number } from "@ecp/core"
import { z } from "zod"
import { registerRegistryControlPolicy } from "./registry-control.js"

type PolicyHookFn = (
  ctx: PolicyContext & { config: Record<string, unknown> }
) => PolicyDecision | void | Promise<PolicyDecision | void>

function policyHook(
  event: import("@ecp/types").PolicyLifecycleEvent,
  fn: PolicyHookFn
) {
  return hook(event, (lifecycleCtx) =>
    fn(lifecycleCtx as unknown as PolicyContext & { config: Record<string, unknown> })
  )
}

/** @ecp/budget policy definition. @category Policies */
export const budgetPolicy = definePolicy("@ecp", "budget")
  .withConfig({
    maxCostUsd: number().optional(),
    maxModelCalls: number().optional(),
    maxRetries: number().optional(),
    maxTokens: number().optional(),
  })
  .withHooks([
    policyHook("policy:pre", (ctx) => {
      const max = ctx.config.maxModelCalls as number | undefined
      if (max !== undefined && ctx.usage.modelCalls >= max) {
        return { type: "deny", reason: "Max model calls exceeded", code: "BUDGET_MODEL_CALLS" }
      }
      return { type: "allow" }
    }),
    policyHook("policy:post", (ctx) => {
      const max = ctx.config.maxModelCalls as number | undefined
      if (max !== undefined && ctx.usage.modelCalls > max) {
        return { type: "deny", reason: "Model call budget exceeded" }
      }
      return { type: "allow" }
    }),
    policyHook("policy:finally", () => undefined),
  ])
  .build()

/** @ecp/approval policy. @category Policies */
export const approvalPolicy = definePolicy("@ecp", "approval")
  .withConfig({
    requireApprovalFor: z.array(z.string()).default([]),
  })
  .withHooks([
    policyHook("policy:pre", (ctx) => {
      const list = (ctx.config.requireApprovalFor as string[]) ?? []
      if (list.includes(ctx.step.capabilityId)) {
        return { type: "pause", reason: "Approval required" }
      }
      return { type: "allow" }
    }),
  ])
  .build()

/** @ecp/state-control policy. @category Policies */
export const stateControlPolicy = definePolicy("@ecp", "state-control")
  .withConfig({
    allowedMutablePaths: z.array(z.string()).optional(),
    deniedMutablePaths: z.array(z.string()).optional(),
    allowedMutationOps: z
      .array(z.enum(["set", "replace", "merge", "append"]))
      .optional(),
    requireReason: boolean().optional(),
    maxMutationsPerStep: number().optional(),
  })
  .withHooks([
    policyHook("policy:pre", (ctx) => {
      const allowed = ctx.config.allowedMutablePaths as string[] | undefined
      if (allowed && ctx.mutableStateHandles) {
        for (const h of ctx.mutableStateHandles) {
          const path = typeof h === "string" ? h : h.path
          if (!allowed.some((a) => path.startsWith(a))) {
            return { type: "deny", reason: `Mutable path not allowed: ${path}` }
          }
        }
      }
      return { type: "allow" }
    }),
    policyHook("policy:post", (ctx) => {
      const max = ctx.config.maxMutationsPerStep as number | undefined
      if (max !== undefined && (ctx.pendingMutations?.length ?? 0) > max) {
        return { type: "deny", reason: "Too many mutations in step" }
      }
      return { type: "allow" }
    }),
  ])
  .build()

export {
  registryControlPolicy,
  registerRegistryControlPolicy,
  REGISTRY_CONTROL_POLICY_ID,
  type RegistryControlPolicyConfig,
} from "./registry-control.js"

/** Register all standard policies. @category Policies */
export async function registerStandardPolicies(registry = globalRegistry): Promise<void> {
  if (!registry.getPolicy("@ecp/budget")) {
    await registry.registerPolicy(budgetPolicy)
  }
  if (!registry.getPolicy("@ecp/approval")) {
    await registry.registerPolicy(approvalPolicy)
  }
  if (!registry.getPolicy("@ecp/state-control")) {
    await registry.registerPolicy(stateControlPolicy)
  }
  await registerRegistryControlPolicy(registry)
}
