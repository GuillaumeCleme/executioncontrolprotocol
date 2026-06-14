import { describe, expect, it } from "vitest"
import { ECP_CORE_FORMATTER_IDS } from "@executioncontextprotocol/types"
import { catalogExtension } from "../../src/registry/extension-catalog.js"
import { formatToonExtension } from "@executioncontextprotocol/format-toon"
import {
  HARNESS_OUTPUT_FORMAT_TYPESCRIPT,
  inferResponseFormatFromFormatter,
  isCoreFormatterId,
  isFormatterRegistered,
  normalizeFormatId,
} from "../../src/harness/format-resolve.js"

describe("format-resolve", () => {
  it("identifies core formatter ids", () => {
    expect(isCoreFormatterId(ECP_CORE_FORMATTER_IDS.JSON)).toBe(true)
    expect(isCoreFormatterId(ECP_CORE_FORMATTER_IDS.FLUENT)).toBe(true)
    expect(isCoreFormatterId("@executioncontextprotocol/format-toon")).toBe(false)
  })

  it("normalizes format ids", () => {
    expect(normalizeFormatId("format-json")).toBe("@executioncontextprotocol/format-json")
  })

  it("infers response format hints from formatter ids", () => {
    expect(inferResponseFormatFromFormatter("@executioncontextprotocol/format-json")).toBe("json")
    expect(inferResponseFormatFromFormatter("@executioncontextprotocol/format-toon")).toBe("toon")
    expect(inferResponseFormatFromFormatter("@executioncontextprotocol/format-fluent")).toBe("text")
    expect(inferResponseFormatFromFormatter("@executioncontextprotocol/unknown-format")).toBe("text")
    expect(inferResponseFormatFromFormatter(HARNESS_OUTPUT_FORMAT_TYPESCRIPT)).toBe("text")
  })

  it("reports formatter registration for core and cataloged extensions", () => {
    expect(isFormatterRegistered("@executioncontextprotocol/format-json")).toBe(true)
    expect(isFormatterRegistered("@executioncontextprotocol/format-fluent")).toBe(true)
    expect(isFormatterRegistered("@executioncontextprotocol/format-unknown")).toBe(false)

    catalogExtension(formatToonExtension)
    expect(isFormatterRegistered("@executioncontextprotocol/format-toon")).toBe(true)
  })
})
