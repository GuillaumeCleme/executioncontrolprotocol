import { describe, expect, it } from "vitest"
import { createHarnessMatrixEnvironment } from "../../src/environments/create-harness-matrix-environment.js"
import { MATRIX_EVAL_EXTENSION_IDS } from "../../src/harness-eval-config.js"
import { chromeNanoEvalReady } from "../../src/helpers/chrome-ai.js"
import { CHROME_NANO_EVAL } from "../../src/profiles/chrome-nano.js"

const readiness = await chromeNanoEvalReady()

describe.skipIf(!readiness.ready)("matrix descriptor order (chrome-nano)", () => {
  it("lists extensions in binding order", async () => {
    const env = await createHarnessMatrixEnvironment(CHROME_NANO_EVAL)
    const ecp = await env.init()
    const descriptor = await ecp.describe()
    const extensionIds = descriptor.extensions?.map((e) => e.id) ?? []
    const matrixIds = [...MATRIX_EVAL_EXTENSION_IDS]
    for (let i = 0; i < matrixIds.length; i++) {
      expect(extensionIds, `matrix extension ${matrixIds[i]} order`).toContain(matrixIds[i])
      const idx = extensionIds.indexOf(matrixIds[i])
      const prevIdx =
        i === 0 ? -1 : extensionIds.indexOf(matrixIds[i - 1] as (typeof matrixIds)[number])
      expect(idx).toBeGreaterThan(prevIdx)
    }
    await ecp.terminate()
  })
})
