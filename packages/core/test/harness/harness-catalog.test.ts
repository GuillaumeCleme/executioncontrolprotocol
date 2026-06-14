import { describe, expect, it, beforeEach } from "vitest"
import {
  harnessEvaluateCapabilityId,
  harnessIdFromCapabilityId,
  isHarnessCapabilityId,
  listCatalogedHarnessIds,
  normalizeHarnessId,
} from "../../src/harness/harness-catalog.js"
import {
  registerTestMinimalHarness,
  resetTestMinimalHarnessRegistrationForTests,
  TEST_MINIMAL_HARNESS_ID,
} from "../../src/harness/definitions/test-minimal-harness.js"
import { resetHarnessCatalogForTests } from "../../src/harness/harness-catalog.js"

describe("harness catalog", () => {
  beforeEach(() => {
    resetHarnessCatalogForTests()
    resetTestMinimalHarnessRegistrationForTests()
  })

  it("normalizes harness ids", () => {
    expect(normalizeHarnessId(TEST_MINIMAL_HARNESS_ID)).toBe(TEST_MINIMAL_HARNESS_ID)
    expect(normalizeHarnessId("test-minimal-harness")).toBe(TEST_MINIMAL_HARNESS_ID)
  })

  it("builds evaluate capability ids", () => {
    registerTestMinimalHarness()
    expect(harnessEvaluateCapabilityId(TEST_MINIMAL_HARNESS_ID)).toBe(
      "@executioncontextprotocol/test-minimal-harness.evaluate"
    )
    expect(harnessIdFromCapabilityId("@executioncontextprotocol/test-minimal-harness.evaluate")).toBe(
      TEST_MINIMAL_HARNESS_ID
    )
    expect(isHarnessCapabilityId("@executioncontextprotocol/test-minimal-harness.evaluate")).toBe(true)
    expect(isHarnessCapabilityId("@executioncontextprotocol/demo.generate")).toBe(false)
    expect(isHarnessCapabilityId("@executioncontextprotocol/ollama.evaluate")).toBe(false)
  })

  it("lists cataloged harness ids after registration", () => {
    registerTestMinimalHarness()
    const ids = listCatalogedHarnessIds()
    expect(ids).toContain(TEST_MINIMAL_HARNESS_ID)
  })
})
