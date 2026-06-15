import { workflow, step, ref } from "@executioncontextprotocol/core"

export default workflow("FAL image chain")
  .run([
    step("@executioncontextprotocol/fal.generate", "Generate base image")
      .with({
        endpoint: "fal-ai/flux/schnell",
        input: { prompt: "a sunset over mountains" },
      })
      .as("base"),

    step("@executioncontextprotocol/fal.generate", "Upscale image")
      .with({
        endpoint: "fal-ai/clarity-upscaler",
        input: { image_url: ref("base.data.images.0.url") },
      })
      .as("upscaled"),
  ])
