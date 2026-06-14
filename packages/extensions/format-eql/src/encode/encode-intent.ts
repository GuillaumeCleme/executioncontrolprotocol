import type { EcpIntent } from "@executioncontextprotocol/types"
import type { EcpFormatOptions } from "@executioncontextprotocol/types"
import type { EqlFormatOptions } from "../schemas.js"
import { EqlWriter } from "./writer.js"

export function encodeIntentToEql(
  intent: EcpIntent,
  options?: EcpFormatOptions & EqlFormatOptions,
  includeHeader = true
): string {
  const writer = new EqlWriter(options)
  if (includeHeader) {
    writer.writeln("ECP @ecp.intent 1.0")
  }
  writer.writeln(`INTENT ${intent.intent}`)
  return writer.toString()
}
