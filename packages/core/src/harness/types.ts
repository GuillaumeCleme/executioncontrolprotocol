import type { HarnessId } from "@ecp/types"
import { ECP_MODEL_GENERATE_INTERFACE } from "@ecp/types"
import type { z } from "zod"
import type { HarnessCapabilityContext } from "./context.js"

/** Harness handler function. @category Harness */
export type HarnessHandler = (
  input: unknown,
  ctx: HarnessCapabilityContext
) => Promise<unknown>

/** Registered harness definition. @category Harness */
export interface HarnessDefinition {
  /** Harness id (`@ecp/workflow-authoring`). */
  id: HarnessId
  /** Namespace segment. */
  namespace: string
  /** Short name segment. */
  name: string
  /** Environment binding config schema. */
  configSchema?: z.ZodType<unknown>
  /** Invoke input schema. */
  inputSchema?: z.ZodType<unknown>
  /** Invoke output schema. */
  outputSchema?: z.ZodType<unknown>
  /** Required provider interface tag. */
  providerInterface: typeof ECP_MODEL_GENERATE_INTERFACE
  /** Harness implementation. */
  handler: HarnessHandler
}
