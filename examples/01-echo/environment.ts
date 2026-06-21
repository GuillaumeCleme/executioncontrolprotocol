import { environment, extension } from "@executioncontextprotocol/node"

import "@executioncontextprotocol/demo"
import "@executioncontextprotocol/format-toon"

export default (await environment("echo-dev", "Echo development")).withExtensions([
  extension("@executioncontextprotocol/demo").with({}),
  extension("@executioncontextprotocol/format-toon").with({}),
])
