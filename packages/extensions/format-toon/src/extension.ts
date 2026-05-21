import {
  capabilityFor,
  defineExtension,
  ecpDecodeInputSchema,
  ecpDecodeResultSchema,
  ecpEncodedArtifactSchema,
  ecpEncodeInputSchema,
} from "@ecp/core"
import { decodeToonToWorkflow } from "./decode.js"
import { encodeWorkflowToToon } from "./encode.js"

/** TOON format extension definition. @category Extensions */
export const formatToonExtension = defineExtension("@ecp", "format-toon")
  .withCapabilities([
    capabilityFor("@ecp/format-toon", "encode")
      .withInput(ecpEncodeInputSchema)
      .withOutput(ecpEncodedArtifactSchema)
      .withHandler((input, ctx) => encodeWorkflowToToon(input as import("@ecp/types").EcpEncodeInput, ctx as never)),

    capabilityFor("@ecp/format-toon", "decode")
      .withInput(ecpDecodeInputSchema)
      .withOutput(ecpDecodeResultSchema)
      .withHandler((input, ctx) => decodeToonToWorkflow(input as import("@ecp/types").EcpDecodeInput, ctx as never)),
  ])
  .build()
