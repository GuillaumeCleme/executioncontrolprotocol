import { describe, expect, it, beforeAll } from "vitest"
import { z } from "zod"
import {
  ECP_HARNESS_ERROR_CODES,
  ECP_INVOKE_ERROR_CODES,
  ECP_MODEL_GENERATE_INTERFACE,
  harnessCapabilityId,
} from "@ecp/types"
import { extension } from "../../src/bindings/extension.js"
import { harness } from "../../src/bindings/harness.js"
import { environment } from "../../src/environment/environment.js"
import { runtime } from "../../src/bindings/runtime.js"
import { defineHarness } from "../../src/harness/define-harness.js"
import { catalogHarness } from "../../src/harness/harness-catalog.js"
import { executeHarnessInvoke } from "../../src/harness/execute-harness.js"
import { registerStandardHarnesses } from "../../src/harness/register-standard-harnesses.js"
import { registerCoreFormats } from "../../src/formats/register-core-formats.js"
import { registerNodeRuntime, NODE_RUNTIME_ID } from "@ecp/node"
import { registerTestExtension } from "../../src/testing/test-extension.js"
import { registerDemoExtension } from "@ecp/demo"
import { registerFormatToonExtension } from "@ecp/format-toon"

const THROWING_HARNESS_ID = "@ecp/harness-throw-test" as const
const BAD_OUTPUT_HARNESS_ID = "@ecp/harness-bad-output-test" as const

describe("executeHarnessInvoke", () => {
  beforeAll(async () => {
    await registerCoreFormats()
    registerStandardHarnesses()
    catalogHarness(
      defineHarness("@ecp", "harness-throw-test")
        .withInput(z.object({ request: z.string() }))
        .withOutput(
          z.object({
            artifact: z.unknown(),
            raw: z.string(),
            trace: z.record(z.unknown()),
          })
        )
        .usesProviderInterface(ECP_MODEL_GENERATE_INTERFACE)
        .withHandler(async () => {
          throw new Error("handler failed intentionally")
        })
        .build()
    )
    catalogHarness(
      defineHarness("@ecp", "harness-bad-output-test")
        .withInput(z.object({ request: z.string() }))
        .withOutput(
          z.object({
            artifact: z.string(),
            raw: z.string(),
            trace: z.record(z.unknown()),
          })
        )
        .usesProviderInterface(ECP_MODEL_GENERATE_INTERFACE)
        .withHandler(async () => ({
          artifact: 123,
          raw: "bad",
          trace: {},
        }))
        .build()
    )
    await registerNodeRuntime()
    await registerTestExtension()
    await registerDemoExtension()
    await registerFormatToonExtension()
  })

  async function demoHarnessEnv(withHarness = true) {
    let builder = environment("execute-harness-test")
      .withRuntime(runtime(NODE_RUNTIME_ID))
      .withExtensions([
        extension("@ecp/format-toon").with({}),
        extension("@ecp/test").with({}),
        extension("@ecp/demo").with({}),
      ])
    if (withHarness) {
      builder = builder.withHarnesses([
        harness("@ecp/workflow-authoring")
          .uses("@ecp/demo.generate")
          .with({
            output: { schema: "@ecp.workflow", format: "@ecp/format-toon", validate: true },
          }),
        harness(THROWING_HARNESS_ID).uses("@ecp/demo.generate").with({}),
        harness(BAD_OUTPUT_HARNESS_ID).uses("@ecp/demo.generate").with({}),
      ])
    }
    const ecp = await builder.init()
    return { env: builder, ecp }
  }

  it("rejects non-harness capability ids", async () => {
    const { env, ecp } = await demoHarnessEnv()
    const result = await executeHarnessInvoke(
      env,
      "@ecp/demo.generate" as "@ecp/workflow-authoring.evaluate",
      { request: "x" }
    )
    expect(result.success).toBe(false)
    expect(result.diagnostics[0]?.code).toBe(ECP_INVOKE_ERROR_CODES.CAPABILITY_NOT_FOUND)
    await ecp.terminate()
  })

  it("reports unbound harness", async () => {
    const { env, ecp } = await demoHarnessEnv(false)
    const result = await executeHarnessInvoke(env, harnessCapabilityId("@ecp/workflow-authoring"), {
      request: "Create workflow",
    })
    expect(result.success).toBe(false)
    expect(result.diagnostics[0]?.code).toBe(ECP_HARNESS_ERROR_CODES.HARNESS_NOT_BOUND)
    await ecp.terminate()
  })

  it("reports invalid harness input", async () => {
    const { env, ecp } = await demoHarnessEnv()
    const result = await executeHarnessInvoke(env, harnessCapabilityId("@ecp/workflow-authoring"), {})
    expect(result.success).toBe(false)
    expect(result.diagnostics[0]?.code).toBe(ECP_INVOKE_ERROR_CODES.INVOKE_INPUT_INVALID)
    await ecp.terminate()
  })

  it("reports handler failures", async () => {
    const { env, ecp } = await demoHarnessEnv()
    const result = await executeHarnessInvoke(env, harnessCapabilityId(THROWING_HARNESS_ID), {
      request: "fail",
    })
    expect(result.success).toBe(false)
    expect(result.diagnostics[0]?.code).toBe(ECP_HARNESS_ERROR_CODES.HARNESS_EVALUATE_FAILED)
    expect(result.diagnostics[0]?.message).toContain("handler failed intentionally")
    await ecp.terminate()
  })

  it("reports invalid harness output", async () => {
    const { env, ecp } = await demoHarnessEnv()
    const result = await executeHarnessInvoke(env, harnessCapabilityId(BAD_OUTPUT_HARNESS_ID), {
      request: "bad output",
    })
    expect(result.success).toBe(false)
    expect(result.diagnostics[0]?.code).toBe(ECP_INVOKE_ERROR_CODES.INVOKE_OUTPUT_INVALID)
    await ecp.terminate()
  })

  it("reports unknown catalog harness", async () => {
    const { env, ecp } = await demoHarnessEnv()
    const result = await executeHarnessInvoke(
      env,
      harnessCapabilityId("@ecp/not-registered"),
      { request: "x" }
    )
    expect(result.success).toBe(false)
    expect(result.diagnostics[0]?.code).toBe(ECP_HARNESS_ERROR_CODES.UNKNOWN_HARNESS)
    await ecp.terminate()
  })
})
