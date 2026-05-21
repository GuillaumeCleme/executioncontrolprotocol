import { environment as nodeEnvironment } from "@ecp/node"
import { extension } from "../src/bindings/extension.js"
import { registerTestExtension } from "../src/testing/test-extension.js"

/** Test environment with `@ecp/node` runtime and test extension registered. */
export async function createTestEnvironment(id = "test", label?: string) {
  await registerTestExtension()
  const env = await nodeEnvironment(id, label)
  return env.withExtensions([extension("@ecp/test").with({})])
}
