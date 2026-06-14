import { environment as coreEnvironment, runtime } from "@executioncontextprotocol/core"
import type { Environment } from "@executioncontextprotocol/core"
import { registerStandardPolicies } from "@executioncontextprotocol/policies"
import { NODE_RUNTIME_ID, registerNodeRuntime } from "./runtime/builtin-node.js"
import { registerProcessEnvExtension } from "./extensions/process-env.js"
import { registerSecretsExtension } from "./extensions/secrets.js"

/** Register Node runtime and standard Node extensions. */
export async function registerNodeDefaults(): Promise<void> {
  await registerNodeRuntime()
  await registerProcessEnvExtension()
  await registerSecretsExtension()
  await registerStandardPolicies()
}

/**
 * Create a Node environment with `@executioncontextprotocol/node` runtime pre-bound.
 * @category Environment
 */
export async function environment(id: string, label?: string): Promise<Environment> {
  await registerNodeDefaults()
  return coreEnvironment(id, label).withRuntime(runtime(NODE_RUNTIME_ID, "Node Runtime"))
}
