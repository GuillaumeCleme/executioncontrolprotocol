import { environment, extension } from "@executioncontextprotocol/node"

import "@executioncontextprotocol/core/testing"
import "@executioncontextprotocol/format-toon"

export default (await environment("echo-dev", "Echo development")).withExtensions([
  extension("@executioncontextprotocol/test").with({}),
  extension("@executioncontextprotocol/format-toon").with({}),
])
