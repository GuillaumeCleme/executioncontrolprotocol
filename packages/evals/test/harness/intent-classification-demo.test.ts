import { describe, it } from "vitest"
import { environment, extension, harness, runtime, registerCoreFormats } from "@ecp/core"
import { registerNodeRuntime, NODE_RUNTIME_ID } from "@ecp/node"
import { registerDemoExtension } from "@ecp/demo"
import { ECP_INTENT_VALUES } from "@ecp/types"
import { EVALS_HARNESS_CAPABILITY } from "@ecp/evals"
import {
  EVAL_HARNESS_TASKS,
  EVALS_HARNESS_ID,
  registerEvalHarnesses,
} from "@ecp/harnesses-evals"
import { expectHarnessIntent } from "./assert-harness-result.js"

async function createEvalIntentDemoEnv() {
  await registerCoreFormats()
  registerEvalHarnesses()
  await registerNodeRuntime()
  await registerDemoExtension()

  return environment("evals-harness-intent-demo")
    .withRuntime(runtime(NODE_RUNTIME_ID))
    .withExtensions([extension("@ecp/demo").with({})])
    .withHarnesses([
      harness(EVALS_HARNESS_ID)
        .uses("@ecp/demo.generate")
        .with({
          output: { schema: "@ecp.intent", format: "@ecp/format-json", validate: true },
        }),
    ])
}

describe("evals-intent-classification harness (demo provider)", () => {
  it("classifies workflow-create intent", async () => {
    const env = await createEvalIntentDemoEnv()
    const ecp = await env.init()
    const result = await ecp
      .invoke(EVALS_HARNESS_CAPABILITY)
      .with({
        task: EVAL_HARNESS_TASKS.INTENT_CLASSIFICATION,
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
      .invoke(EVALS_HARNESS_CAPABILITY)
      .with({
        task: EVAL_HARNESS_TASKS.INTENT_CLASSIFICATION,
        message: "Update the echo step label",
      })
      .process()

    expectHarnessIntent(result, ECP_INTENT_VALUES.WORKFLOW_PATCH)
    await ecp.terminate()
  })
})
