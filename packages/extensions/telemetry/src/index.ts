import { defineExtension, hook, globalRegistry, catalogExtension } from "@executioncontextprotocol/core"

/** @executioncontextprotocol/telemetry extension. @category Extensions */
export const telemetryExtension = defineExtension("@executioncontextprotocol", "telemetry")
  .withConfig({})
  .withCapabilities([])
  .withHooks([
    hook("run:started", async () => undefined),
    hook("step:completed", async () => undefined),
    hook("step:failed", async () => undefined),
    hook("run:finally", async () => undefined),
  ])
  .build()

catalogExtension(telemetryExtension)

export async function registerTelemetryExtension(): Promise<void> {
  if (!globalRegistry.getExtension("@executioncontextprotocol/telemetry")) {
    await globalRegistry.registerExtension(telemetryExtension)
  }
}

export default telemetryExtension
