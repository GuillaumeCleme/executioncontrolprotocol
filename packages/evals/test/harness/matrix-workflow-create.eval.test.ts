import { describe, it } from "vitest"
import {
  createHarnessOllamaMatrixEnvironment,
  EVAL_SUITE_VALUES,
  loadEvalCases,
  ollamaEvalReady,
  runEvalCase,
} from "@executioncontextprotocol/evals"

const readiness = await ollamaEvalReady()
const cases = loadEvalCases({ suite: EVAL_SUITE_VALUES.WORKFLOW_CREATE })

describe.skipIf(!readiness.ready)(
  `matrix workflow-create (${readiness.profileId} ${readiness.model})`,
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
