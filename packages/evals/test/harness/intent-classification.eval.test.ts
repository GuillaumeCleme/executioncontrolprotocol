import { describe, expect, it } from "vitest"
import { ECP_INTENT_VALUES } from "@ecp/types"
import {
  EVALS_INTENT_CLASSIFICATION_CAPABILITY,
  INTENT_EVAL_EXTENSIONS,
  OLLAMA_GEMMA_1B_EVAL,
  createHarnessOllamaIntentEnvironment,
  ollamaEvalReady,
} from "@ecp/evals"
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
      expect(capabilityIds).toContain("@ecp/test.echo")
      await ecp.terminate()
    })

    it("classifies workflow-create intent with JSON output", async () => {
      const env = await createHarnessOllamaIntentEnvironment()
      const ecp = await env.init()

      const result = await ecp
        .invoke(EVALS_INTENT_CLASSIFICATION_CAPABILITY)
        .with({
          message: "Create a new workflow that sends a summary email.",
          model: OLLAMA_GEMMA_1B_EVAL.model,
        })
        .process()

      const harnessOutput = expectHarnessIntent(result, ECP_INTENT_VALUES.WORKFLOW_CREATE)
      expect(harnessOutput.trace.outputFormat, harnessTraceHint(harnessOutput)).toBe(
        "@ecp/format-json"
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
        .invoke(EVALS_INTENT_CLASSIFICATION_CAPABILITY)
        .with({
          message: "Update the echo step to use value world.",
          model: OLLAMA_GEMMA_1B_EVAL.model,
        })
        .process()

      expectHarnessIntent(result, ECP_INTENT_VALUES.WORKFLOW_PATCH)

      await ecp.terminate()
    })
  }
)
