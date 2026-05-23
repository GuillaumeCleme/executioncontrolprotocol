import { describe, expect, it } from "vitest"
import { hook, defineExtension } from "../src/index.js"
import { extension, runtime } from "../src/index.js"
import { NODE_RUNTIME_ID, registerNodeRuntime } from "@ecp/node"
import { environment } from "../src/environment/environment.js"
import { globalRegistry } from "../src/registry/registry.js"

const events: string[] = []

const spyExt = defineExtension("@ecp", "env-spy")
  .withConfig({})
  .withHooks([
    hook("environment:created", async (ctx) => {
      events.push(ctx.event)
    }),
    hook("environment:configuring", async (ctx) => {
      events.push(ctx.event)
    }),
    hook("environment:ready", async (ctx) => {
      events.push(ctx.event)
    }),
    hook("environment:beforeRun", async (ctx) => {
      events.push(ctx.event)
    }),
    hook("environment:terminate", async (ctx) => {
      events.push(ctx.event)
    }),
  ])
  .build()

describe("environment lifecycle", () => {
  it("emits discovery events on describe and run events on run", async () => {
    events.length = 0
    await registerNodeRuntime()
    if (!globalRegistry.getExtension("@ecp/env-spy")) {
      await globalRegistry.registerExtension(spyExt)
    }
    const env = environment("evt")
      .withRuntime(runtime(NODE_RUNTIME_ID))
      .withExtensions([extension("@ecp/env-spy").with({})])

    await env.describe()
    expect(events).toContain("environment:created")
    expect(events).toContain("environment:configuring")
    expect(events).not.toContain("environment:ready")

    events.length = 0
    await env.run({
      schema: "@ecp.workflow",
      version: "1.0.0",
      workflow: { id: "empty" },
      steps: [],
    })
    expect(events).toContain("environment:ready")
    expect(events).toContain("environment:beforeRun")

    events.length = 0
    await env.dispose()
    expect(events).toContain("environment:terminate")
  })
})
