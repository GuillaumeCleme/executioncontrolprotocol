import { z } from "zod"

/** Chat / routing intent values. @category Harness */
export const ECP_INTENT_VALUES = {
  FAQ: "faq",
  WORKFLOW_CREATE: "workflow-create",
  WORKFLOW_PATCH: "workflow-patch",
  GENERAL: "general",
} as const

/** Intent literal union. @category Harness */
export type EcpIntentValue = (typeof ECP_INTENT_VALUES)[keyof typeof ECP_INTENT_VALUES]

/** Intent classification document schema id. @category Harness */
export const ECP_INTENT_SCHEMA = "@ecp.intent" as const

/** Classified user intent. @category Harness */
export const ecpIntentSchema = z.object({
  schema: z.literal(ECP_INTENT_SCHEMA),
  /** Classified routing intent. */
  intent: z.enum([
    ECP_INTENT_VALUES.FAQ,
    ECP_INTENT_VALUES.WORKFLOW_CREATE,
    ECP_INTENT_VALUES.WORKFLOW_PATCH,
    ECP_INTENT_VALUES.GENERAL,
  ]),
})

/** Classified user intent type. @category Harness */
export type EcpIntent = z.infer<typeof ecpIntentSchema>
