import { environment, extension } from "@ecp/node"
import { registerTestExtension } from "@ecp/core"

registerTestExtension()

export default environment("echo-dev", "Echo development").withExtensions([
  extension("@ecp/test", "Test").with({}),
])
