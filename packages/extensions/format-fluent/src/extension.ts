import {
  capabilityFor,
  defineExtension,
  ecpEncodedArtifactSchema,
  ecpEncodeInputSchema,
} from "@ecp/core"
import { encodeWorkflowToFluent } from "./encode.js"

/** Fluent format extension definition. @category Extensions */
export const formatFluentExtension = defineExtension("@ecp", "format-fluent")
  .withCapabilities([
    capabilityFor("@ecp/format-fluent", "encode")
      .withInput(ecpEncodeInputSchema)
      .withOutput(ecpEncodedArtifactSchema)
      .withHandler((input, ctx) =>
        encodeWorkflowToFluent(input as import("@ecp/types").EcpEncodeInput, ctx as never)
      ),
  ])
  .build()
