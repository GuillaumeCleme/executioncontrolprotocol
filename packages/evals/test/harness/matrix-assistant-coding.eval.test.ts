import { describe, it } from "vitest"
import {
  BROWSER_CODING_HARNESS_CAPABILITY,
  createHarnessOllamaCodingMatrixEnvironment,
  EVAL_SUITE_VALUES,
  loadEvalCases,
  ollamaQwenEvalReady,
  OLLAMA_QWEN_CODER_15B_EVAL,
  runEvalCase,
  setActiveEvalProvider,
} from "@executioncontrolprotocol/evals"

setActiveEvalProvider(OLLAMA_QWEN_CODER_15B_EVAL)

const readiness = await ollamaQwenEvalReady()
const cases = loadEvalCases({ suite: EVAL_SUITE_VALUES.ASSISTANT })

describe.skipIf(!readiness.ready)(
  `matrix assistant coding (${readiness.profileId} ${readiness.model})`,
  () => {
    it.each(cases)("$id: $title", async (caseRow) => {
      const env = await createHarnessOllamaCodingMatrixEnvironment()
      const ecp = await env.init()
      try {
        await runEvalCase(ecp, env, caseRow, {
          harnessCapability: BROWSER_CODING_HARNESS_CAPABILITY,
        })
      } finally {
        await ecp.terminate()
      }
    })
  }
)
