import {
  capabilityFor,
  defineExtension,
  ecpDecodeInputSchema,
  ecpDecodeResultSchema,
  ecpEncodeInputSchema,
  ecpEncodeResultSchema,
} from "@ecp/core"
import { decodeFromToon } from "./decode.js"
import { encodeToToon } from "./encode.js"

/** TOON format extension definition. @category Extensions */
export const formatToonExtension = defineExtension("@ecp", "format-toon")
  .withCapabilities([
    capabilityFor("@ecp/format-toon", "encode")
      .withInput(ecpEncodeInputSchema)
      .withOutput(ecpEncodeResultSchema)
      .withHandler((input, ctx) => encodeToToon(input as import("@ecp/types").EcpEncodeInput, ctx as never)),

    capabilityFor("@ecp/format-toon", "decode")
      .withInput(ecpDecodeInputSchema)
      .withOutput(ecpDecodeResultSchema)
      .withHandler((input, ctx) => decodeFromToon(input as import("@ecp/types").EcpDecodeInput, ctx as never)),
  ])
  .build()
