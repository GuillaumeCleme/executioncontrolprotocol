import { environment as nodeEnvironment } from "@ecp/node"
import { extension } from "../src/bindings/extension.js"
import { registerTestExtension } from "../src/testing/test-extension.js"

/** Test environment with `@ecp/node` runtime and test extension registered. */
export function createTestEnvironment(id = "test", label?: string) {
  registerTestExtension()
  return nodeEnvironment(id, label).withExtensions([extension("@ecp/test").with({})])
}
