import type { DecodeResult, EcpSchema, NamespacedId } from "@ecp/types"
import { ECP_ENCODING_ERROR_CODES } from "@ecp/types"
import type { Environment } from "../environment/environment.js"
import { decodeJson } from "./json-codec.js"
import { EcpError } from "./errors.js"
import { invokeDecodeCapability } from "./invoke-utility.js"
import { resolveDecoder } from "./resolve.js"
import { createUtilityCapabilityContext } from "./utility-context.js"
import { validateWorkflow } from "../validate/workflow.js"

/** Fluent builder for `env.decode()`. @category Encoding */
export interface DecodeOperationBuilder {
  /** Select format extension. */
  uses(extensionId: NamespacedId | string): this
  /** Source format hint. */
  from(format: string): this
  /** Expected target schema. */
  to(targetSchema: EcpSchema): this
  /** Fail when decoded document is invalid. */
  strict(enabled?: boolean): this
  /** Run decode operation. */
  process<T = unknown>(): Promise<DecodeResult<T>>
}

interface DecodeState {
  content: unknown
  extensionId?: string
  format?: string
  targetSchema?: EcpSchema
  strict?: boolean
}

/**
 * Create decode operation builder.
 * @category Encoding
 */
export function createDecodeBuilder(
  env: Environment,
  content: unknown
): DecodeOperationBuilder {
  const state: DecodeState = { content }

  const builder: DecodeOperationBuilder = {
    uses(extensionId: NamespacedId | string) {
      state.extensionId = String(extensionId)
      return builder
    },
    from(format: string) {
      state.format = format
      return builder
    },
    to(targetSchema: EcpSchema) {
      state.targetSchema = targetSchema
      return builder
    },
    strict(enabled = true) {
      state.strict = enabled
      return builder
    },
    async process<T = unknown>(): Promise<DecodeResult<T>> {
      const ctx = createUtilityCapabilityContext(
        env.getEnvId(),
        env.getEnvLabel(),
        env.getRegistry()
      )

      let result: DecodeResult<T>

      if (!state.extensionId) {
        result = decodeJson<T>(state.content, {
          targetSchema: state.targetSchema ?? "@ecp.workflow",
        }) as DecodeResult<T>
      } else {
        const cap = resolveDecoder(env.getRegistry(), state.extensionId)
        const raw = await invokeDecodeCapability(
          cap,
          {
            content: state.content,
            format: state.format,
            targetSchema: state.targetSchema,
            options: { strict: state.strict },
          },
          ctx
        )
        result = raw as DecodeResult<T>
      }

      const target = state.targetSchema ?? result.targetSchema ?? "@ecp.workflow"
      if (target === "@ecp.workflow" && result.document) {
        const validation = validateWorkflow(
          result.document as unknown as import("@ecp/types").WorkflowManifest
        )
        result = {
          ...result,
          diagnostics: [...(result.diagnostics ?? []), ...validation.errors, ...validation.warnings],
        }
        if (state.strict && !validation.valid) {
          throw new EcpError(ECP_ENCODING_ERROR_CODES.FORMAT_DECODE_FAILED, {
            message: "Decoded document is not a valid workflow manifest.",
            diagnostics: validation.errors,
          })
        }
      }

      return result
    },
  }

  return builder
}
