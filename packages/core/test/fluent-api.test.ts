import { describe, expect, it } from "vitest"
import {
  workflow,
  step,
  ref,
  state,
  env,
  expr,
  parallel,
  branch,
  loop,
  extension,
  runtime,
  policy,
  environment,
  defineExtension,
  defineRuntime,
  definePolicy,
  capability,
  capabilityFor,
  hook,
  WorkflowBuilder,
} from "../src/index.js"
import { LOCAL_RUNTIME_ID, localRuntimeDefinition } from "../src/runtime/builtin-local.js"

describe("fluent API surface", () => {
  it("workflow builder chains", () => {
    const b = workflow("W")
    expect(typeof b.run).toBe("function")
    expect(typeof b.id).toBe("function")
    expect(typeof b.compile).toBe("function")
    expect(typeof b.toManifest).toBe("function")
    expect(typeof b.validate).toBe("function")
    expect(typeof b.toGraph).toBe("function")
    expect(b).toBeInstanceOf(WorkflowBuilder)
    const m = b.run([step("@ecp/test.echo", "S").with({ x: 1 }).as("k")]).toManifest()
    expect(m.schema).toBe("@ecp.workflow")
  })

  it("step builder chains", () => {
    const s = step("@ecp/test.echo", "Label")
    expect(typeof s.with).toBe("function")
    expect(typeof s.when).toBe("function")
    expect(typeof s.as).toBe("function")
    expect(typeof s.id).toBe("function")
    expect(typeof s.toNode).toBe("function")
    expect(s.toNode().type).toBe("step")
  })

  it("binding builders chain", () => {
    const e = extension("@ecp/test", "E").with({ a: 1 })
    expect(typeof e.with).toBe("function")
    expect(e.getConfig()).toEqual({ a: 1 })

    const r = runtime(LOCAL_RUNTIME_ID, "R").with({})
    expect(typeof r.with).toBe("function")

    const p = policy("@ecp/budget", "P").with({ maxModelCalls: 1 })
    expect(typeof p.with).toBe("function")
  })

  it("definition builders exist", () => {
    const ext = defineExtension("@ecp", "x")
    expect(typeof ext.withConfig).toBe("function")
    expect(typeof ext.withCapabilities).toBe("function")
    expect(typeof ext.build).toBe("function")

    const rt = defineRuntime("@ecp", "x")
    expect(typeof rt.withExecutor).toBe("function")

    const pol = definePolicy("@ecp", "x")
    expect(typeof pol.withHooks).toBe("function")

    expect(typeof capability("c").withHandler).toBe("function")
    expect(typeof capabilityFor("@ecp/x" as never, "c").withInput).toBe("function")
    expect(hook("run:before", async () => undefined).event).toBe("run:before")
  })

  it("value helpers", () => {
    expect(ref("a").$ref).toBe("state.a")
    expect(state("b").path).toBe("b")
    expect(env("KEY").$env).toBe("KEY")
    expect(expr.eq("x", 1)).toEqual({ eq: ["x", 1] })
    expect(expr.neq("x", 1)).toEqual({ neq: ["x", 1] })
  })

  it("flow helpers produce node types", () => {
    expect(parallel([[step("@ecp/test.echo", "A")]]).type).toBe("parallel")
    expect(branch([step("@ecp/test.echo", "A")]).type).toBe("branch")
    expect(loop({ label: "L" }, [step("@ecp/test.echo", "A")]).type).toBe("loop")
  })

  it("environment builder chains", () => {
    const envBuilder = environment("id", "label")
    expect(typeof envBuilder.withRuntime).toBe("function")
    expect(typeof envBuilder.withExtensions).toBe("function")
    expect(typeof envBuilder.withPolicies).toBe("function")
    expect(typeof envBuilder.compile).toBe("function")
    expect(typeof envBuilder.validate).toBe("function")
    expect(typeof envBuilder.describe).toBe("function")
    expect(typeof envBuilder.search).toBe("function")
    expect(typeof envBuilder.run).toBe("function")
    expect(typeof envBuilder.getRegistry).toBe("function")
  })

  it("runtime definition uses withExecutor terminator", () => {
    expect(localRuntimeDefinition.executor).toBeDefined()
    expect(defineRuntime("@ecp", "x").withConfig({}).withExecutor(localRuntimeDefinition.executor).id).toBe(
      "@ecp/x"
    )
  })
})
