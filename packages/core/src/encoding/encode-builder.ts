import type { EncodedArtifact, NamespacedId } from "@ecp/types"
import type { Environment } from "../environment/environment.js"
import { encodeJson, getEcpSchema } from "./json-codec.js"
import { invokeEncodeCapability } from "./invoke-utility.js"
import { resolveEncoder } from "./resolve.js"
import { createUtilityCapabilityContext } from "./utility-context.js"

/** Fluent builder for `env.encode()`. @category Encoding */
export interface EncodeOperationBuilder {
  /** Select format extension (e.g. `@ecp/format-toon`). */
  uses(extensionId: NamespacedId | string): this
  /** Alias for format id string. */
  as(format: string): this
  /** Request compact output. */
  compact(enabled?: boolean): this
  /** Return string content for JSON codec. */
  asString(): this
  /** Return object content for JSON codec. */
  asObject(): this
  /** Fields to include when supported. */
  include(fields: string[]): this
  /** Run encode operation. */
  process(): Promise<EncodedArtifact>
}

interface EncodeState {
  source: unknown
  extensionId?: string
  format?: string
  compact?: boolean
  as?: "object" | "string"
  include?: string[]
}

/**
 * Create encode operation builder.
 * @category Encoding
 */
export function createEncodeBuilder(
  env: Environment,
  source: unknown
): EncodeOperationBuilder {
  const state: EncodeState = { source }

  const builder: EncodeOperationBuilder = {
    uses(extensionId: NamespacedId | string) {
      state.extensionId = String(extensionId)
      return builder
    },
    as(format: string) {
      state.format = format
      return builder
    },
    compact(enabled = true) {
      state.compact = enabled
      return builder
    },
    asString() {
      state.as = "string"
      return builder
    },
    asObject() {
      state.as = "object"
      return builder
    },
    include(fields: string[]) {
      state.include = fields
      return builder
    },
    async process(): Promise<EncodedArtifact> {
      const sourceSchema = getEcpSchema(state.source)
      const ctx = createUtilityCapabilityContext(
        env.getEnvId(),
        env.getEnvLabel(),
        env.getRegistry()
      )

      if (!state.extensionId) {
        return encodeJson(state.source, {
          compact: state.compact,
          as: state.as,
          sourceSchema,
        })
      }

      const cap = resolveEncoder(env.getRegistry(), state.extensionId)
      const result = await invokeEncodeCapability(
        cap,
        {
          source: state.source,
          sourceSchema,
          format: state.format,
          options: {
            compact: state.compact,
            include: state.include,
            as: state.as,
          },
        },
        ctx
      )
      return result as EncodedArtifact
    },
  }

  return builder
}
