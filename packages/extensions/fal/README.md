# @executioncontextprotocol/extension-fal

FAL model provider extension for ECP. Invokes any FAL endpoint from workflows with env/secrets auth and standard `$ref` chaining.

## Binding

```ts
import "@executioncontextprotocol/extension-fal"
import { environment, extension, env, secrets } from "@executioncontextprotocol/node"

export default environment("fal-demo")
  .withExtensions([
    extension("@executioncontextprotocol/secrets").with({}),
    extension("@executioncontextprotocol/fal").with({
      apiKey: secrets("fal/api-key"), // or env("FAL_KEY")
      defaultMode: "subscribe",
    }),
  ])
```

## Capability: `@executioncontextprotocol/fal.generate`

**Input:** `{ endpoint?, input, mode?, logs? }` — `endpoint` can default from extension config.

**Output:** `{ data, requestId? }` — `data` holds the FAL model response (images, video URLs, etc.).

## Chaining

Reference prior step output fields with `ref()`:

```ts
step("@executioncontextprotocol/fal.generate", "Upscale")
  .with({
    endpoint: "fal-ai/clarity-upscaler",
    input: { image_url: ref("base.data.images.0.url") },
  })
  .as("upscaled")
```

See `examples/03-fal-chain/` for a full workflow.
