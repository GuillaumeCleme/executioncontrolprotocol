import {
  capabilityFor,
  defineExtension,
  ecpDecodeInputSchema,
  ecpDecodeResultSchema,
  ecpEncodeInputSchema,
  ecpEncodeResultSchema,
} from "@executioncontextprotocol/core"
import { decodeFromEql } from "./decode/decode-eql.js"
import { encodeToEql } from "./encode/encode-eql.js"

/** EQL format extension definition. @category Extensions */
export const formatEqlExtension = defineExtension("@executioncontextprotocol", "format-eql")
  .withCapabilities([
    capabilityFor("@executioncontextprotocol/format-eql", "encode")
      .withInput(ecpEncodeInputSchema)
      .withOutput(ecpEncodeResultSchema)
      .withHandler((input, ctx) => encodeToEql(input as import("./schemas.js").EqlEncodeInput, ctx as never)),

    capabilityFor("@executioncontextprotocol/format-eql", "decode")
      .withInput(ecpDecodeInputSchema)
      .withOutput(ecpDecodeResultSchema)
      .withHandler((input, ctx) => decodeFromEql(input as import("./schemas.js").EqlDecodeInput, ctx as never)),
  ])
  .build()
