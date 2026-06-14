import { describe, it } from "vitest"
import {
  BROWSER_CODING_HARNESS_CAPABILITY,
  createHarnessOllamaCodingMatrixEnvironment,
  isFlowEvalCase,
  loadEvalCases,
  logEvalCaseTiming,
  ollamaQwenEvalReady,
  OLLAMA_QWEN_CODER_15B_EVAL,
  runEvalCase,
  setActiveEvalProvider,
} from "@executioncontextprotocol/evals"

setActiveEvalProvider(OLLAMA_QWEN_CODER_15B_EVAL)

/** Cases that timed out or failed in recent coding matrix runs. */
const DEBUG_CASE_IDS = [
  "asst-01",
  "asst-06",
  "asst-09",
  "asst-10",
  "asst-12",
  "asst-13",
  "asst-14",
  "asst-15",
  "asst-16",
  "wf-patch-01",
] as const

const readiness = await ollamaQwenEvalReady()
const cases = loadEvalCases().filter(
  (row) => !isFlowEvalCase(row) && DEBUG_CASE_IDS.includes(row.id as (typeof DEBUG_CASE_IDS)[number])
)

describe.skipIf(!readiness.ready)(
  `matrix coding debug (${readiness.profileId} ${readiness.model})`,
  { timeout: 600_000 },
  () => {
    it.each(cases)("$id: $title", async (caseRow) => {
      const caseStarted = performance.now()
      const envStarted = performance.now()
      const env = await createHarnessOllamaCodingMatrixEnvironment()
      const envCreateMs = performance.now() - envStarted
      const initStarted = performance.now()
      const ecp = await env.init()
      const envInitMs = performance.now() - initStarted
      try {
        await runEvalCase(ecp, env, caseRow, {
          harnessCapability: BROWSER_CODING_HARNESS_CAPABILITY,
        })
      } finally {
        logEvalCaseTiming(`${caseRow.id} (env)`, {
          envCreateMs,
          envInitMs,
          caseTotalWithEnvMs: performance.now() - caseStarted,
        })
        await ecp.terminate()
      }
    })
  }
)
