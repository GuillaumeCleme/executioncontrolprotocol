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
    expect(harnessEvaluateCapabilityId(TEST_MINIMAL_HARNESS_ID)).toBe(
      "@ecp/test-minimal-harness.evaluate"
    )
    expect(harnessIdFromCapabilityId("@ecp/test-minimal-harness.evaluate")).toBe(
      TEST_MINIMAL_HARNESS_ID
    )
    expect(isHarnessCapabilityId("@ecp/test-minimal-harness.evaluate")).toBe(true)
    expect(isHarnessCapabilityId("@ecp/demo.generate")).toBe(false)
  })

  it("lists cataloged harness ids after registration", () => {
    registerTestMinimalHarness()
    const ids = listCatalogedHarnessIds()
    expect(ids).toContain(TEST_MINIMAL_HARNESS_ID)
  })
})
