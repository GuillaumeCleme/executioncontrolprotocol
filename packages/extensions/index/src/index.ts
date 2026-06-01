export { registerMemoryExtension, memoryExtension } from "@ecp/extension-memory"
export { registerOpenaiExtension, openaiExtension } from "@ecp/extension-openai"
export { registerOllamaExtension, ollamaExtension } from "@ecp/extension-ollama"
export { registerSlackExtension, slackExtension } from "@ecp/extension-slack"
export { registerStorageExtension, storageExtension } from "@ecp/extension-storage"
export { registerTelemetryExtension, telemetryExtension } from "@ecp/extension-telemetry"
export { registerFormatToonExtension, formatToonExtension } from "@ecp/format-toon"
export { registerFormatEqlExtension, formatEqlExtension } from "@ecp/format-eql"
export { registerFormatMermaidExtension, formatMermaidExtension } from "@ecp/format-mermaid"
export { registerDemoExtension, demoExtension } from "@ecp/demo"

import { registerMemoryExtension } from "@ecp/extension-memory"
import { registerOpenaiExtension } from "@ecp/extension-openai"
import { registerOllamaExtension } from "@ecp/extension-ollama"
import { registerSlackExtension } from "@ecp/extension-slack"
import { registerStorageExtension } from "@ecp/extension-storage"
import { registerTelemetryExtension } from "@ecp/extension-telemetry"
import { registerFormatToonExtension } from "@ecp/format-toon"
import { registerFormatEqlExtension } from "@ecp/format-eql"
import { registerFormatMermaidExtension } from "@ecp/format-mermaid"
import { registerDemoExtension } from "@ecp/demo"

/** Namespaced ids registered by {@link registerAllExtensions}. */
export const BUNDLED_EXTENSION_IDS = [
  "@ecp/memory",
  "@ecp/openai",
  "@ecp/ollama",
  "@ecp/slack",
  "@ecp/storage",
  "@ecp/telemetry",
  "@ecp/format-toon",
  "@ecp/format-eql",
  "@ecp/format-mermaid",
  "@ecp/demo",
] as const

/**
 * Register all bundled first-party extensions on the global registry.
 *
 * This bundle is host-agnostic and dependency-light: it includes the standard
 * capability extensions (memory, storage, slack, telemetry), the local/remote
 * model providers that do not pull heavy SDKs (openai, ollama), the format
 * extensions used by harness encode/decode (toon, eql, mermaid), and the demo
 * stub provider.
 *
 * Intentionally excluded (register them explicitly when needed):
 * - `@ecp/chrome-ai` — browser-only (Chrome on-device `LanguageModel` API).
 * - `@ecp/claude` — requires the Anthropic provider configuration/credentials.
 *
 * @category Extensions
 */
export async function registerAllExtensions(): Promise<void> {
  await registerMemoryExtension()
  await registerOpenaiExtension()
  await registerOllamaExtension()
  await registerSlackExtension()
  await registerStorageExtension()
  await registerTelemetryExtension()
  await registerFormatToonExtension()
  await registerFormatEqlExtension()
  await registerFormatMermaidExtension()
  await registerDemoExtension()
}
