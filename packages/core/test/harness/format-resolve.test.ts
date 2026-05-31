import { describe, expect, it } from "vitest"
import { ECP_CORE_FORMATTER_IDS } from "@ecp/types"
import { catalogExtension } from "../../src/registry/extension-catalog.js"
import { formatToonExtension } from "@ecp/format-toon"
import {
  inferResponseFormatFromFormatter,
  isCoreFormatterId,
  isFormatterRegistered,
  normalizeFormatId,
} from "../../src/harness/format-resolve.js"

describe("format-resolve", () => {
  it("identifies core formatter ids", () => {
    expect(isCoreFormatterId(ECP_CORE_FORMATTER_IDS.JSON)).toBe(true)
    expect(isCoreFormatterId(ECP_CORE_FORMATTER_IDS.FLUENT)).toBe(true)
    expect(isCoreFormatterId("@ecp/format-toon")).toBe(false)
  })

  it("normalizes format ids", () => {
    expect(normalizeFormatId("format-json")).toBe("@ecp/format-json")
  })

  it("infers response format hints from formatter ids", () => {
    expect(inferResponseFormatFromFormatter("@ecp/format-json")).toBe("json")
    expect(inferResponseFormatFromFormatter("@ecp/format-toon")).toBe("toon")
    expect(inferResponseFormatFromFormatter("@ecp/format-fluent")).toBe("text")
    expect(inferResponseFormatFromFormatter("@ecp/unknown-format")).toBe("text")
  })

  it("reports formatter registration for core and cataloged extensions", () => {
    expect(isFormatterRegistered("@ecp/format-json")).toBe(true)
    expect(isFormatterRegistered("@ecp/format-fluent")).toBe(true)
    expect(isFormatterRegistered("@ecp/format-unknown")).toBe(false)

    catalogExtension(formatToonExtension)
    expect(isFormatterRegistered("@ecp/format-toon")).toBe(true)
  })
})
