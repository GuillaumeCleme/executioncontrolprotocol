import { environment, extension } from "@ecp/node"
import { registerTestExtension } from "@ecp/core"

await registerTestExtension()

export default (await environment("echo-dev", "Echo development")).withExtensions([
  extension("@ecp/test", "Test").with({}),
])
