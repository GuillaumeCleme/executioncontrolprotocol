import { capabilityFor, defineExtension } from "../definitions/index.js"
import { ecpEncodeInputSchema, ecpEncodeResultSchema } from "../encoding/schemas.js"
import { encodeFluent } from "../fluent/encode-fluent.js"
import type { EcpEncodeInput } from "@ecp/types"

/** Core Fluent format extension (encode only in v1). @category Formats */
export const formatFluentExtension = defineExtension("@ecp", "format-fluent")
  .withCapabilities([
    capabilityFor("@ecp/format-fluent", "encode")
      .withInput(ecpEncodeInputSchema)
      .withOutput(ecpEncodeResultSchema)
      .withHandler((input) =>
        encodeFluent((input as EcpEncodeInput).source, {
          ...(input as EcpEncodeInput).options,
          sourceSchema: (input as EcpEncodeInput).sourceSchema,
          sourceVersion: (input as EcpEncodeInput).sourceVersion,
        })
      ),
  ])
  .build()
