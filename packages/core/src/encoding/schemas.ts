import { z } from "zod"
import { LATEST_ECP_VERSION } from "@ecp/types"

/** Zod schema for encode capability input. @category Encoding */
export const ecpEncodeInputSchema = z.object({
  source: z.unknown(),
  sourceSchema: z.string().optional(),
  format: z.string().optional(),
  options: z
    .object({
      compact: z.boolean().optional(),
      include: z.array(z.string()).optional(),
      as: z.enum(["object", "string"]).optional(),
    })
    .optional(),
})

/** Zod schema for decode capability input. @category Encoding */
export const ecpDecodeInputSchema = z.object({
  content: z.unknown(),
  format: z.string().optional(),
  targetSchema: z.string().optional(),
  options: z
    .object({
      strict: z.boolean().optional(),
    })
    .optional(),
})

const validationIssueSchema = z.object({
  severity: z.enum(["error", "warning", "info"]),
  message: z.string(),
  path: z.string().optional(),
  code: z.string().optional(),
})

/** Zod schema for encoded artifact output. @category Encoding */
export const ecpEncodedArtifactSchema = z.object({
  schema: z.literal("@ecp.encoded"),
  version: z.string(),
  format: z.string(),
  mediaType: z.string().optional(),
  sourceSchema: z.string().optional(),
  content: z.unknown(),
  diagnostics: z.array(validationIssueSchema).optional(),
})

/** Zod schema for decode result output. @category Encoding */
export const ecpDecodeResultSchema = z.object({
  schema: z.literal("@ecp.decoded"),
  version: z.string(),
  targetSchema: z.string().optional(),
  document: z.unknown(),
  diagnostics: z.array(validationIssueSchema).optional(),
})

/** Default encoded artifact version field. @category Encoding */
export const ENCODED_VERSION = LATEST_ECP_VERSION
