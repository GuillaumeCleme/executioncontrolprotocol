import { ECP_INTENT_SCHEMA, type EcpIntent } from "@executioncontrolprotocol/types"
import type { EqlIntentDoc } from "./ast.js"

export function intentFromEql(doc: EqlIntentDoc): EcpIntent {
  return {
    schema: ECP_INTENT_SCHEMA,
    intent: doc.intent as EcpIntent["intent"],
  }
}
