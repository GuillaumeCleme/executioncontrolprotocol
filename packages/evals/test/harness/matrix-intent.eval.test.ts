import { describe, it } from "vitest"
import {
  createHarnessOllamaMatrixEnvironment,
  EVAL_SUITE_VALUES,
  loadEvalCases,
  ollamaEvalReady,
  runEvalCase,
} from "@executioncontrolprotocol/evals"

const readiness = await ollamaEvalReady()
const cases = loadEvalCases({ suite: EVAL_SUITE_VALUES.INTENT })

describe.skipIf(!readiness.ready)(
  `matrix intent (${readiness.profileId} ${readiness.model})`,
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
