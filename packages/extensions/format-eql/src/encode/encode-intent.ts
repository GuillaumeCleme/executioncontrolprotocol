import type { EcpIntent } from "@executioncontrolprotocol/types"
import type { EcpFormatOptions } from "@executioncontrolprotocol/types"
import type { EqlFormatOptions } from "../schemas.js"
import { EqlWriter } from "./writer.js"

export function encodeIntentToEql(
  intent: EcpIntent,
  options?: EcpFormatOptions & EqlFormatOptions,
  includeHeader = true
): string {
  const writer = new EqlWriter(options)
  if (includeHeader) {
    writer.writeln("ECP @executioncontrolprotocol.intent 1.0")
  }
  writer.writeln(`INTENT ${intent.intent}`)
  return writer.toString()
}
