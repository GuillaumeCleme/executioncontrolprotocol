import { describe, expect, it } from "vitest"
import { countOllamaEvalCases, loadEvalCases, MATRIX_EVAL_EXTENSION_IDS } from "@executioncontrolprotocol/evals"

describe("eval matrix fixtures", () => {
  it("loads at least 50 Ollama eval cases", () => {
    expect(countOllamaEvalCases()).toBeGreaterThanOrEqual(50)
  })

  it("matrix extension binding list has four extensions", () => {
    expect(MATRIX_EVAL_EXTENSION_IDS).toEqual([
      "@executioncontrolprotocol/format-toon",
      "@executioncontrolprotocol/format-eql",
      "@executioncontrolprotocol/format-json",
      "@executioncontrolprotocol/test",
    ])
  })

  it("assigns unique case ids", () => {
    const cases = loadEvalCases({ excludeSkipped: false })
    const ids = cases.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
