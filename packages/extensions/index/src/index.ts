export { registerMemoryExtension, memoryExtension } from "@ecp/extension-memory"
export { registerOpenaiExtension, openaiExtension } from "@ecp/extension-openai"
export { registerOllamaExtension, ollamaExtension } from "@ecp/extension-ollama"
export { registerSlackExtension, slackExtension } from "@ecp/extension-slack"
export { registerStorageExtension, storageExtension } from "@ecp/extension-storage"
export { registerTelemetryExtension, telemetryExtension } from "@ecp/extension-telemetry"
export { registerFormatToonExtension, formatToonExtension } from "@ecp/format-toon"
export { registerFormatFluentExtension, formatFluentExtension } from "@ecp/format-fluent"

import { registerMemoryExtension } from "@ecp/extension-memory"
import { registerOpenaiExtension } from "@ecp/extension-openai"
import { registerOllamaExtension } from "@ecp/extension-ollama"
import { registerSlackExtension } from "@ecp/extension-slack"
import { registerStorageExtension } from "@ecp/extension-storage"
import { registerTelemetryExtension } from "@ecp/extension-telemetry"
import { registerFormatToonExtension } from "@ecp/format-toon"
import { registerFormatFluentExtension } from "@ecp/format-fluent"

/** Register all bundled extensions. */
export async function registerAllExtensions(): Promise<void> {
  await registerMemoryExtension()
  await registerOpenaiExtension()
  await registerOllamaExtension()
  await registerSlackExtension()
  await registerStorageExtension()
  await registerTelemetryExtension()
  await registerFormatToonExtension()
  await registerFormatFluentExtension()
}
