import { describe, it } from "vitest"
import { createHarnessMatrixEnvironment } from "../../src/environments/create-harness-matrix-environment.js"
import { EVAL_SUITE_VALUES } from "../../src/fixtures/eval-case-schema.js"
import { loadEvalCasesBrowser } from "../../src/fixtures/load-eval-cases.browser.js"
import { runEvalCase } from "../../src/fixtures/run-eval-case.browser.js"
import { chromeNanoEvalReady } from "../../src/helpers/chrome-ai.js"
import { CHROME_NANO_EVAL } from "../../src/profiles/chrome-nano.js"
import { setActiveEvalProvider } from "../../src/profiles/eval-provider-context.js"

setActiveEvalProvider(CHROME_NANO_EVAL)

const readiness = await chromeNanoEvalReady()
const cases = loadEvalCasesBrowser({ suite: EVAL_SUITE_VALUES.ASSISTANT })

describe.skipIf(!readiness.ready)(`matrix assistant (${CHROME_NANO_EVAL.id})`, () => {
  it.each(cases)("$id: $title", async (caseRow) => {
    const env = await createHarnessMatrixEnvironment(CHROME_NANO_EVAL)
    const ecp = await env.init()
    try {
      await runEvalCase(ecp, env, caseRow)
    } finally {
      await ecp.terminate()
    }
  })
})
