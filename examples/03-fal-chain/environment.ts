import "@executioncontextprotocol/extension-fal"
import { environment, extension, env } from "@executioncontextprotocol/node"
import { registerFalExtension } from "@executioncontextprotocol/extension-fal"

registerFalExtension()

export default environment("fal-chain", "FAL image chain")
  .withExtensions([
    extension("@executioncontextprotocol/fal", "FAL").with({
      apiKey: env("FAL_KEY", { optional: true }),
      defaultMode: "subscribe",
    }),
  ])
