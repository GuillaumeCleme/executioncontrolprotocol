import { ECP_CORE_FORMATTER_IDS, type NamespacedId } from "@ecp/types"
import { getCatalogedExtension, normalizeExtensionId } from "../registry/extension-catalog.js"

/** Core formatter ids that do not require environment binding. @category Harness */
export const CORE_FORMATTER_IDS = new Set<string>([
  ECP_CORE_FORMATTER_IDS.JSON,
  ECP_CORE_FORMATTER_IDS.FLUENT,
])

/**
 * Whether a formatter id is core-cataloged (always available).
 * @category Harness
 */
export function isCoreFormatterId(formatId: string): boolean {
  return CORE_FORMATTER_IDS.has(normalizeExtensionId(formatId))
}

/**
 * Normalize harness config format field to extension id.
 * @category Harness
 */
export function normalizeFormatId(format: string): NamespacedId {
  return normalizeExtensionId(format)
}

/**
 * Whether formatter is registered in catalog or core set.
 * @category Harness
 */
export function isFormatterRegistered(formatId: string): boolean {
  const normalized = normalizeFormatId(formatId)
  if (isCoreFormatterId(normalized)) return true
  return getCatalogedExtension(normalized) !== undefined
}

/**
 * Infer model response format hint from formatter id.
 * @category Harness
 */
export function inferResponseFormatFromFormatter(
  formatId: string
): "text" | "json" | "toon" | "eql" | undefined {
  const id = normalizeFormatId(formatId)
  if (id === ECP_CORE_FORMATTER_IDS.JSON) return "json"
  if (id === "@ecp/format-toon") return "toon"
  if (id === "@ecp/format-eql") return "eql"
  return "text"
}
