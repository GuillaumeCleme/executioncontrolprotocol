import { describe, expect, it } from "vitest"
import { ECP_INTENT_VALUES } from "@executioncontrolprotocol/types"
import {
  BROWSER_NANO_HARNESS_CAPABILITY,
  INTENT_EVAL_EXTENSIONS,
  OLLAMA_GEMMA_1B_EVAL,
  createHarnessOllamaIntentEnvironment,
  ollamaEvalReady,
} from "@executioncontrolprotocol/evals"
import { HARNESS_TASKS } from "@executioncontrolprotocol/evals"
import { expectHarnessIntent, harnessTraceHint } from "./assert-harness-result.js"

const readiness = await ollamaEvalReady()

describe.skipIf(!readiness.ready)(
  `intent-classification harness (${readiness.profileId} ${readiness.model})`,
  () => {
    it(`binds eval extensions: ${INTENT_EVAL_EXTENSIONS.join(", ")}`, async () => {
      const env = await createHarnessOllamaIntentEnvironment()
      const ecp = await env.init()
      const descriptor = await ecp.describe()
      const capabilityIds = descriptor.capabilities?.map((c) => c.id) ?? []
      expect(capabilityIds).toContain("@executioncontrolprotocol/demo.echo")
      await ecp.terminate()
    })

    it("classifies workflow-create intent with JSON output", async () => {
      const env = await createHarnessOllamaIntentEnvironment()
      const ecp = await env.init()

      const result = await ecp
        .invoke(BROWSER_NANO_HARNESS_CAPABILITY)
        .with({
          task: HARNESS_TASKS.INTENT_CLASSIFICATION,
          message: "Create a new workflow that sends a summary email.",
          model: OLLAMA_GEMMA_1B_EVAL.model,
        })
        .process()

      const harnessOutput = expectHarnessIntent(result, ECP_INTENT_VALUES.WORKFLOW_CREATE)
      expect(harnessOutput.trace.outputFormat, harnessTraceHint(harnessOutput)).toBe(
        "@executioncontrolprotocol/format-eql"
      )
      expect(harnessOutput.trace.prompt, harnessTraceHint(harnessOutput)).toContain(
        "Environment capabilities"
      )

      await ecp.terminate()
    })

    it("classifies workflow-patch intent with JSON output", async () => {
      const env = await createHarnessOllamaIntentEnvironment()
      const ecp = await env.init()

      const result = await ecp
        .invoke(BROWSER_NANO_HARNESS_CAPABILITY)
        .with({
          task: HARNESS_TASKS.INTENT_CLASSIFICATION,
          message: "Update the echo step to use value world.",
          model: OLLAMA_GEMMA_1B_EVAL.model,
        })
        .process()

      expectHarnessIntent(result, ECP_INTENT_VALUES.WORKFLOW_PATCH)

      await ecp.terminate()
    })
  }
)
