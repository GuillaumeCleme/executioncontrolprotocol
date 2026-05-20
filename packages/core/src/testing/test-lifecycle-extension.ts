import type { LifecycleEvent } from "@ecp/types"
import { defineExtension } from "../definitions/extension.js"
import { capabilityFor } from "../definitions/capability.js"
import { hook } from "../definitions/hook.js"
import { globalRegistry } from "../registry/registry.js"
import { z } from "zod"

/** Recorded extension lifecycle hook events (reset via `resetLifecycleSpy()`). */
export const lifecycleSpyEvents: LifecycleEvent[] = []

/** Capability invocation count for spy capabilities. */
export let capabilityInvokeCount = 0

/** Reset spy state between tests. */
export function resetLifecycleSpy(): void {
  lifecycleSpyEvents.length = 0
  capabilityInvokeCount = 0
}

function spyHook(event: LifecycleEvent) {
  return hook(event, async () => {
    lifecycleSpyEvents.push(event)
  })
}

const lifecycleSpyExtension = defineExtension("@ecp", "lifecycle-spy")
  .withConfig({})
  .withCapabilities([
    capabilityFor("@ecp/lifecycle-spy", "echo")
      .withInput(z.object({ value: z.unknown().optional() }))
      .withOutput(z.object({ echo: z.unknown() }))
      .withHandler(async (input) => {
        capabilityInvokeCount++
        return { echo: (input as { value?: unknown }).value ?? "hi" }
      }),
    capabilityFor("@ecp/lifecycle-spy", "throw")
      .withInput(z.object({}))
      .withOutput(z.object({}))
      .withHandler(async () => {
        capabilityInvokeCount++
        throw new Error("capability failed")
      }),
    capabilityFor("@ecp/lifecycle-spy", "merge-state")
      .withInput(z.object({ target: z.unknown() }))
      .withOutput(z.object({ ok: z.boolean() }))
      .withHandler(async (input, ctx) => {
        capabilityInvokeCount++
        const handle = (input as { target: import("@ecp/types").StoreStateHandle<Record<string, unknown>> })
          .target
        await ctx.store.merge(handle, { merged: true })
        return { ok: true }
      }),
  ])
  .withHooks([
    spyHook("step:before"),
    spyHook("step:started"),
    spyHook("step:completed"),
    spyHook("step:failed"),
    spyHook("step:finally"),
  ])
  .build()

/** Register lifecycle spy extension on global registry. */
export function registerLifecycleSpyExtension(): void {
  if (!globalRegistry.getExtension("@ecp/lifecycle-spy")) {
    globalRegistry.registerExtension(lifecycleSpyExtension)
  }
}
