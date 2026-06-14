import {
  capabilityFor,
  defineExtension,
  ecpDecodeInputSchema,
  ecpDecodeResultSchema,
  ecpEncodeInputSchema,
  ecpEncodeResultSchema,
} from "@executioncontextprotocol/core"
import { decodeFromToon } from "./decode.js"
import { encodeToToon } from "./encode.js"

/** TOON format extension definition. @category Extensions */
export const formatToonExtension = defineExtension("@executioncontextprotocol", "format-toon")
  .withCapabilities([
    capabilityFor("@executioncontextprotocol/format-toon", "encode")
      .withInput(ecpEncodeInputSchema)
      .withOutput(ecpEncodeResultSchema)
      .withHandler((input, ctx) => encodeToToon(input as import("@executioncontextprotocol/types").EcpEncodeInput, ctx as never)),

    capabilityFor("@executioncontextprotocol/format-toon", "decode")
      .withInput(ecpDecodeInputSchema)
      .withOutput(ecpDecodeResultSchema)
      .withHandler((input, ctx) => decodeFromToon(input as import("@executioncontextprotocol/types").EcpDecodeInput, ctx as never)),
  ])
  .build()
