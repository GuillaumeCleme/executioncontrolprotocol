import { describe, expect, it } from "vitest"
import {
  createHarnessOllamaMatrixEnvironment,
  MATRIX_EVAL_EXTENSION_IDS,
  ollamaEvalReady,
} from "@executioncontrolprotocol/evals"

const readiness = await ollamaEvalReady()

describe.skipIf(!readiness.ready)("matrix descriptor order", () => {
  it("lists extensions in binding order", async () => {
    const env = await createHarnessOllamaMatrixEnvironment()
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
