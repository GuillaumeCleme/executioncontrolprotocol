import { environment, extension } from "@executioncontrolprotocol/node"

import "@executioncontrolprotocol/demo"
import "@executioncontrolprotocol/format-toon"

export default (await environment("echo-dev", "Echo development")).withExtensions([
  extension("@executioncontrolprotocol/demo").with({}),
  extension("@executioncontrolprotocol/format-toon").with({}),
])
