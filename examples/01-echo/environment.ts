import { environment, extension, runtime } from "@ecp/core"
import { registerTestExtension } from "@ecp/core"
import { LOCAL_RUNTIME_ID } from "@ecp/core"

registerTestExtension()

export default environment("echo-dev", "Echo development")
  .withRuntime(runtime(LOCAL_RUNTIME_ID, "Local"))
  .withExtensions([extension("@ecp/test", "Test").with({})])
