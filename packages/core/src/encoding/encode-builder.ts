import type { EncodeResult, EcpFormatOptions, EcpSchema, EcpVersion, NamespacedId } from "@ecp/types"
import { ECP_FORMATS, LATEST_ECP_VERSION } from "@ecp/types"
import type { Environment } from "../environment/environment.js"
import { encodeFluent } from "../fluent/encode-fluent.js"
import { encodeJson, encodeFailure, getEcpSchema } from "./json-codec.js"
import { invokeEncodeCapability } from "./invoke-utility.js"
import { resolveEncoder } from "./resolve.js"
import { createUtilityCapabilityContext } from "./utility-context.js"
import { validateWorkflow } from "../validate/workflow.js"

/** Fluent builder for `ecp.encode()`. @category Encoding */
export interface EncodeOperationBuilder {
  uses(extensionId: NamespacedId | string): this
  as(format: string): this
  to(schema: EcpSchema, version?: EcpVersion): this
  with(options: EcpFormatOptions): this
  compact(enabled?: boolean): this
  asString(): this
  asObject(): this
  include(fields: string[]): this
  process<T = unknown>(): Promise<EncodeResult<T>>
}

interface EncodeState {
  source: unknown
  extensionId?: string
  format?: string
  targetSchema?: EcpSchema
  targetVersion?: EcpVersion
  options: EcpFormatOptions
}

/**
 * Create encode operation builder.
 * @category Encoding
 */
export function createEncodeBuilder(
  env: Environment,
  source: unknown
): EncodeOperationBuilder {
  const state: EncodeState = { source, options: {} }

  const builder: EncodeOperationBuilder = {
    uses(extensionId: NamespacedId | string) {
      state.extensionId = String(extensionId)
      return builder
    },
    as(format: string) {
      state.format = format
      return builder
    },
    to(schema: EcpSchema, version?: EcpVersion) {
      state.targetSchema = schema
      state.targetVersion = version ?? LATEST_ECP_VERSION
      return builder
    },
    with(options: EcpFormatOptions) {
      state.options = { ...state.options, ...options }
      return builder
    },
    compact(enabled = true) {
      state.options.compact = enabled
      return builder
    },
    asString() {
      state.options.as = "string"
      return builder
    },
    asObject() {
      state.options.as = "object"
      return builder
    },
    include(fields: string[]) {
      state.options.include = fields
      return builder
    },
    async process<T = unknown>(): Promise<EncodeResult<T>> {
      await env.ensureBoundExtensionsRegistered()

      const sourceSchema = state.targetSchema ?? getEcpSchema(state.source)
      const ctx = createUtilityCapabilityContext(
        env.getEnvId(),
        env.getEnvLabel(),
        env.getRegistry()
      )

      if (sourceSchema === "@ecp.workflow") {
        const validation = validateWorkflow(
          state.source as import("@ecp/types").WorkflowManifest
        )
        if (!validation.valid) {
          return encodeFailure({
            format: state.format ?? "json",
            sourceSchema,
            validation,
            diagnostics: [...validation.errors, ...validation.warnings],
          }) as EncodeResult<T>
        }
      }

      if (state.format === ECP_FORMATS.FLUENT) {
        return encodeFluent(state.source, {
          ...state.options,
          sourceSchema,
          sourceVersion: state.targetVersion,
        }) as EncodeResult<T>
      }

      if (!state.extensionId) {
        return encodeJson(state.source, {
          ...state.options,
          sourceSchema,
          sourceVersion: state.targetVersion,
        }) as EncodeResult<T>
      }

      const cap = resolveEncoder(env.getRegistry(), state.extensionId)
      const result = await invokeEncodeCapability(
        cap,
        {
          source: state.source,
          sourceSchema,
          sourceVersion: state.targetVersion,
          format: state.format,
          options: state.options,
        },
        ctx
      )
      return result as EncodeResult<T>
    },
  }

  return builder
}
