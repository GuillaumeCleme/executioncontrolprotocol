import { describe, expect, it } from "vitest"
import { ECP_INTENT_VALUES, harnessCapabilityId, type EcpIntent } from "@ecp/types"
import {
  OLLAMA_GEMMA_1B_EVAL,
  createHarnessOllamaIntentEnvironment,
  ollamaEvalReady,
} from "@ecp/evals"
import { assertHarnessInvokeSuccess, harnessResult } from "./assert-harness-result.js"

const EVAL_TIMEOUT_MS = 120_000

const readiness = await ollamaEvalReady()

describe.skipIf(!readiness.ready)(
  `intent-classification harness (${readiness.profileId} ${readiness.model})`,
  () => {
  it(
    "classifies workflow-create intent with JSON output",
    async () => {
      const env = await createHarnessOllamaIntentEnvironment()
      const ecp = await env.init()

      const result = await ecp
        .invoke(harnessCapabilityId("@ecp/intent-classification"))
        .with({
          message: "Create a new workflow that sends a summary email.",
          model: OLLAMA_GEMMA_1B_EVAL.model,
        })
        .process()

      assertHarnessInvokeSuccess(result)
      const harnessOutput = harnessResult<EcpIntent>(result)
      expect(harnessOutput.artifact.schema).toBe("@ecp.intent")
      expect(harnessOutput.artifact.intent).toBe(ECP_INTENT_VALUES.WORKFLOW_CREATE)
      expect(harnessOutput.trace.outputFormat).toBe("@ecp/format-json")
      expect(harnessOutput.trace.decodeSucceeded).toBe(true)

      await ecp.terminate()
    },
    EVAL_TIMEOUT_MS
  )

  it(
    "classifies workflow-patch intent with JSON output",
    async () => {
      const env = await createHarnessOllamaIntentEnvironment()
      const ecp = await env.init()

      const result = await ecp
        .invoke(harnessCapabilityId("@ecp/intent-classification"))
        .with({
          message: "Update the echo step to use value world.",
          model: OLLAMA_GEMMA_1B_EVAL.model,
        })
        .process()

      assertHarnessInvokeSuccess(result)
      const harnessOutput = harnessResult<EcpIntent>(result)
      expect(harnessOutput.artifact.intent).toBe(ECP_INTENT_VALUES.WORKFLOW_PATCH)

      await ecp.terminate()
    },
    EVAL_TIMEOUT_MS
  )
})
