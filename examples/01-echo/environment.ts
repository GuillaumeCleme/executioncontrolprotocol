import { environment, extension } from "@ecp/node"

import "@ecp/core/testing"
import "@ecp/format-toon"

export default (await environment("echo-dev", "Echo development")).withExtensions([
  extension("@ecp/test").with({}),
  extension("@ecp/format-toon").with({}),
])
