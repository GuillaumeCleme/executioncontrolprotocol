import { describe, it } from "vitest"
import { environment, extension, harness, runtime, registerCoreFormats } from "@executioncontextprotocol/core"
import { registerNodeRuntime, NODE_RUNTIME_ID } from "@executioncontextprotocol/node"
import { registerDemoExtension } from "@executioncontextprotocol/demo"
import { registerFormatEqlExtension } from "@executioncontextprotocol/format-eql"
import { ECP_INTENT_VALUES } from "@executioncontextprotocol/types"
import {
  HARNESS_TASKS,
  BROWSER_NANO_HARNESS_CAPABILITY,
  BROWSER_NANO_HARNESS_ID,
  registerBrowserNanoHarnesses,
} from "@executioncontextprotocol/evals"
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
      extension("@executioncontextprotocol/format-eql").with({}),
      extension("@executioncontextprotocol/demo").with({}),
    ])
    .withHarnesses([
      harness(BROWSER_NANO_HARNESS_ID)
        .uses("@executioncontextprotocol/demo.generate")
        .with({
          output: { schema: "@ecp.intent", format: "@executioncontextprotocol/format-eql", validate: true },
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
