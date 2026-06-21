import { describe, it } from "vitest"
import {
  createHarnessOllamaMatrixEnvironment,
  EVAL_SUITE_VALUES,
  loadEvalCases,
  ollamaEvalReady,
  runEvalCase,
} from "@executioncontrolprotocol/evals"

const readiness = await ollamaEvalReady()
const assistantCases = loadEvalCases({ suite: EVAL_SUITE_VALUES.ASSISTANT })
const flowCases = loadEvalCases({ suite: EVAL_SUITE_VALUES.FLOW })
const cases = [...assistantCases, ...flowCases]

describe.skipIf(!readiness.ready)(
  `matrix assistant and flow (${readiness.profileId} ${readiness.model})`,
  () => {
    it.each(cases)("$id: $title", async (caseRow) => {
      const env = await createHarnessOllamaMatrixEnvironment()
      const ecp = await env.init()
      try {
        await runEvalCase(ecp, env, caseRow)
      } finally {
        await ecp.terminate()
      }
    })
  }
)
