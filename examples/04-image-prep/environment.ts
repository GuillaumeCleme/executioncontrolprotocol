import "@executioncontextprotocol/extension-image-sharp"
import { environment, extension, policy } from "@executioncontextprotocol/node"
import { registerImageSharpExtension } from "@executioncontextprotocol/extension-image-sharp"
import { registerImagePolicy } from "@executioncontextprotocol/policies"

registerImageSharpExtension()
registerImagePolicy()

export default environment("image-prep", "Image prep")
  .withExtensions([
    extension("@executioncontextprotocol/image-sharp", "Sharp").with({
      limits: {
        allowRemoteUrls: false,
      },
      defaults: {
        format: "webp",
        quality: 84,
        stripMetadata: true,
      },
    }),
  ])
  .withPolicies([
    policy("@executioncontextprotocol/image-policy", "Image policy").with({
      allowedInputKinds: ["file", "artifact", "buffer"],
      allowedOutputFormats: ["webp", "png", "jpeg"],
      maxImageRefsPerStep: 8,
      denyRawOutput: true,
    }),
  ])
