import { ECP_FORMATS } from "@ecp/types"

/** CLI `--format` values. */
export type CliFormat = "json" | "toon" | "fluent"

const FORMAT_EXTENSION: Record<CliFormat, string | undefined> = {
  json: undefined,
  toon: "@ecp/format-toon",
  fluent: undefined,
}

/**
 * Map CLI format flag to extension id for `ecp.encode().uses(...)`.
 * @category CLI
 */
export function formatToExtensionId(format: CliFormat): string | undefined {
  return FORMAT_EXTENSION[format]
}

/**
 * Parse and validate CLI format flag.
 * @category CLI
 */
export function parseCliFormat(value: string | undefined): CliFormat {
  const f = (value ?? ECP_FORMATS.JSON) as CliFormat
  if (f !== "json" && f !== "toon" && f !== "fluent") {
    throw new Error(`Unknown format "${value}". Use json, toon, or fluent.`)
  }
  return f
}
