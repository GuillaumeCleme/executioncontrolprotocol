import { describe, expect, it } from "vitest"
import { extension } from "../../src/bindings/extension.js"
import { harness } from "../../src/bindings/harness.js"
import { environment } from "../../src/environment/environment.js"
import { runtime } from "../../src/bindings/runtime.js"
import { registerNodeRuntime, NODE_RUNTIME_ID } from "@ecp/node"
import { registerTestExtension } from "../../src/testing/test-extension.js"
import { registerDemoExtension } from "@ecp/demo"
import { registerCoreFormats } from "../../src/formats/register-core-formats.js"
import { registerStandardHarnesses } from "../../src/harness/register-standard-harnesses.js"
import {
  ECP_INTENT_VALUES,
  harnessCapabilityId,
  type EcpIntent,
  type HarnessInvokeResult,
} from "@ecp/types"

describe("intent-classification harness", () => {
  it("classifies workflow-create intent via demo provider and JSON output", async () => {
    await registerCoreFormats()
    registerStandardHarnesses()
    await registerNodeRuntime()
    await registerTestExtension()
    await registerDemoExtension()

    const env = environment("harness-intent")
      .withRuntime(runtime(NODE_RUNTIME_ID))
      .withExtensions([extension("@ecp/test").with({}), extension("@ecp/demo").with({})])
      .withHarnesses([
        harness("@ecp/intent-classification")
          .uses("@ecp/demo.generate")
          .with({
            output: { schema: "@ecp.intent", format: "@ecp/format-json", validate: true },
          }),
      ])

    const ecp = await env.init()
    const result = await ecp
      .invoke(harnessCapabilityId("@ecp/intent-classification"))
      .with({ message: "Create a new workflow that sends a summary email." })
      .process()

    expect(result.success).toBe(true)
    const harnessResult = result.result as HarnessInvokeResult<EcpIntent>
    expect(harnessResult.artifact.schema).toBe("@ecp.intent")
    expect(Object.values(ECP_INTENT_VALUES)).toContain(harnessResult.artifact.intent)
    expect(harnessResult.artifact.intent).toBe(ECP_INTENT_VALUES.WORKFLOW_CREATE)
    expect(harnessResult.trace.outputFormat).toBe("@ecp/format-json")
    expect(harnessResult.trace.decodeSucceeded).toBe(true)
    await ecp.terminate()
  })

  it("classifies workflow-patch intent via demo provider", async () => {
    await registerCoreFormats()
    registerStandardHarnesses()
    await registerNodeRuntime()
    await registerTestExtension()
    await registerDemoExtension()

    const env = environment("harness-intent-patch")
      .withRuntime(runtime(NODE_RUNTIME_ID))
      .withExtensions([extension("@ecp/test").with({}), extension("@ecp/demo").with({})])
      .withHarnesses([
        harness("@ecp/intent-classification")
          .uses("@ecp/demo.generate")
          .with({
            output: { schema: "@ecp.intent", format: "@ecp/format-json", validate: true },
          }),
      ])

    const ecp = await env.init()
    const result = await ecp
      .invoke(harnessCapabilityId("@ecp/intent-classification"))
      .with({ message: "Update the echo step to use value world." })
      .process()

    expect(result.success).toBe(true)
    const harnessResult = result.result as HarnessInvokeResult<EcpIntent>
    expect(harnessResult.artifact.intent).toBe(ECP_INTENT_VALUES.WORKFLOW_PATCH)
    await ecp.terminate()
  })
})
