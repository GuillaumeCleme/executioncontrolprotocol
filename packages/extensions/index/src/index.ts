export { registerMemoryExtension, memoryExtension } from "@ecp/extension-memory"
export { registerOpenaiExtension, openaiExtension } from "@ecp/extension-openai"
export { registerOllamaExtension, ollamaExtension } from "@ecp/extension-ollama"
export { registerSlackExtension, slackExtension } from "@ecp/extension-slack"
export { registerStorageExtension, storageExtension } from "@ecp/extension-storage"
export { registerTelemetryExtension, telemetryExtension } from "@ecp/extension-telemetry"

import { registerMemoryExtension } from "@ecp/extension-memory"
import { registerOpenaiExtension } from "@ecp/extension-openai"
import { registerOllamaExtension } from "@ecp/extension-ollama"
import { registerSlackExtension } from "@ecp/extension-slack"
import { registerStorageExtension } from "@ecp/extension-storage"
import { registerTelemetryExtension } from "@ecp/extension-telemetry"

/** Register all bundled extensions. */
export function registerAllExtensions(): void {
  registerMemoryExtension()
  registerOpenaiExtension()
  registerOllamaExtension()
  registerSlackExtension()
  registerStorageExtension()
  registerTelemetryExtension()
}
