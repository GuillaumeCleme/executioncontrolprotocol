import { environment as coreEnvironment, runtime } from "@ecp/core"
import type { Environment } from "@ecp/core"
import { registerStandardPolicies } from "@ecp/policies"
import { NODE_RUNTIME_ID, registerNodeRuntime } from "./runtime/builtin-node.js"
import { registerProcessEnvExtension } from "./extensions/process-env.js"
import { registerSecretsExtension } from "./extensions/secrets.js"

/** Register Node runtime and standard Node extensions. */
export function registerNodeDefaults(): void {
  registerNodeRuntime()
  registerProcessEnvExtension()
  registerSecretsExtension()
  registerStandardPolicies()
}

/**
 * Create a Node environment with `@ecp/node` runtime pre-bound.
 * @category Environment
 */
export function environment(id: string, label?: string): Environment {
  registerNodeDefaults()
  return coreEnvironment(id, label).withRuntime(
    runtime(NODE_RUNTIME_ID, "Node Runtime")
  )
}
