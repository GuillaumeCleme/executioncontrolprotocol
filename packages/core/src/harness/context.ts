import type { CapabilityId, HarnessId } from "@ecp/types"
import type { Environment } from "../environment/environment.js"
import type { Ecp } from "../environment/ecp.js"
import type { CapabilityContext } from "../runtime/context.js"

/** Context passed to harness handlers during evaluate. @category Harness */
export interface HarnessCapabilityContext {
  /** Harness id. */
  harnessId: HarnessId
  /** Resolved provider capability id. */
  uses: CapabilityId
  /** Merged harness config from environment binding. */
  config: Record<string, unknown>
  /** Underlying capability context for nested calls. */
  capabilityContext: CapabilityContext
  /** Environment host. */
  environment: Environment
  /** Operational ECP facade. */
  ecp: Ecp
  /** Call another capability. */
  call: CapabilityContext["capabilities"]["call"]
}

/**
 * Build harness context for evaluate invocation.
 * @category Harness
 */
export function createHarnessCapabilityContext(
  harnessId: HarnessId,
  uses: CapabilityId,
  config: Record<string, unknown>,
  env: Environment,
  ecp: Ecp,
  capabilityContext: CapabilityContext
): HarnessCapabilityContext {
  return {
    harnessId,
    uses,
    config,
    capabilityContext,
    environment: env,
    ecp,
    call: capabilityContext.capabilities.call.bind(capabilityContext.capabilities),
  }
}
