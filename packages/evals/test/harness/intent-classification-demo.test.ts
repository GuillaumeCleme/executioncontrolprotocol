import { describe, it } from "vitest"
import { environment, extension, harness, runtime, registerCoreFormats } from "@executioncontrolprotocol/core"
import { registerNodeRuntime, NODE_RUNTIME_ID } from "@executioncontrolprotocol/node"
import { registerDemoExtension } from "@executioncontrolprotocol/demo"
import { registerFormatEqlExtension } from "@executioncontrolprotocol/format-eql"
import { ECP_INTENT_VALUES } from "@executioncontrolprotocol/types"
import {
  HARNESS_TASKS,
  BROWSER_NANO_HARNESS_CAPABILITY,
  BROWSER_NANO_HARNESS_ID,
  registerBrowserNanoHarnesses,
} from "@executioncontrolprotocol/evals"
import { expectHarnessIntent } from "./assert-harness-result.js"

async function createEvalIntentDemoEnv() {
  await registerCoreFormats()
  registerBrowserNanoHarnesses()
  await registerNodeRuntime()
  await registerDemoExtension()
  await registerFormatEqlExtension()

  return environment("evals-harness-intent-demo")
    .withRuntime(runtime(NODE_RUNTIME_ID))
    .withExtensions([
      extension("@executioncontrolprotocol/format-eql").with({}),
      extension("@executioncontrolprotocol/demo").with({}),
    ])
    .withHarnesses([
      harness(BROWSER_NANO_HARNESS_ID)
        .uses("@executioncontrolprotocol/demo.generate")
        .with({
          output: { schema: "@executioncontrolprotocol.intent", format: "@executioncontrolprotocol/format-eql", validate: true },
        }),
    ])
}

describe("evals-intent-classification harness (demo provider)", () => {
  it("classifies workflow-create intent", async () => {
    const env = await createEvalIntentDemoEnv()
    const ecp = await env.init()
    const result = await ecp
      .invoke(BROWSER_NANO_HARNESS_CAPABILITY)
      .with({
        task: HARNESS_TASKS.INTENT_CLASSIFICATION,
        message: "Create a new workflow that sends email",
      })
      .process()

    expectHarnessIntent(result, ECP_INTENT_VALUES.WORKFLOW_CREATE)
    await ecp.terminate()
  })

  it("classifies workflow-patch intent", async () => {
    const env = await createEvalIntentDemoEnv()
    const ecp = await env.init()
    const result = await ecp
      .invoke(BROWSER_NANO_HARNESS_CAPABILITY)
      .with({
        task: HARNESS_TASKS.INTENT_CLASSIFICATION,
        message: "Update the echo step label",
      })
      .process()

    expectHarnessIntent(result, ECP_INTENT_VALUES.WORKFLOW_PATCH)
    await ecp.terminate()
  })
})
