export { registerMemoryExtension, memoryExtension } from "@executioncontrolprotocol/extension-memory"
export { registerOpenaiExtension, openaiExtension } from "@executioncontrolprotocol/extension-openai"
export { registerOllamaExtension, ollamaExtension } from "@executioncontrolprotocol/extension-ollama"
export { registerSlackExtension, slackExtension } from "@executioncontrolprotocol/extension-slack"
export { registerStorageExtension, storageExtension } from "@executioncontrolprotocol/extension-storage"
export { registerTelemetryExtension, telemetryExtension } from "@executioncontrolprotocol/extension-telemetry"
export { registerFormatToonExtension, formatToonExtension } from "@executioncontrolprotocol/format-toon"
export { registerFormatEqlExtension, formatEqlExtension } from "@executioncontrolprotocol/format-eql"
export { registerFormatMermaidExtension, formatMermaidExtension } from "@executioncontrolprotocol/format-mermaid"
export { registerDemoExtension, demoExtension } from "@executioncontrolprotocol/demo"

import { registerMemoryExtension } from "@executioncontrolprotocol/extension-memory"
import { registerOpenaiExtension } from "@executioncontrolprotocol/extension-openai"
import { registerOllamaExtension } from "@executioncontrolprotocol/extension-ollama"
import { registerSlackExtension } from "@executioncontrolprotocol/extension-slack"
import { registerStorageExtension } from "@executioncontrolprotocol/extension-storage"
import { registerTelemetryExtension } from "@executioncontrolprotocol/extension-telemetry"
import { registerFormatToonExtension } from "@executioncontrolprotocol/format-toon"
import { registerFormatEqlExtension } from "@executioncontrolprotocol/format-eql"
import { registerFormatMermaidExtension } from "@executioncontrolprotocol/format-mermaid"
import { registerDemoExtension } from "@executioncontrolprotocol/demo"

/** Namespaced ids registered by {@link registerAllExtensions}. */
export const BUNDLED_EXTENSION_IDS = [
  "@executioncontrolprotocol/memory",
  "@executioncontrolprotocol/openai",
  "@executioncontrolprotocol/ollama",
  "@executioncontrolprotocol/slack",
  "@executioncontrolprotocol/storage",
  "@executioncontrolprotocol/telemetry",
  "@executioncontrolprotocol/format-toon",
  "@executioncontrolprotocol/format-eql",
  "@executioncontrolprotocol/format-mermaid",
  "@executioncontrolprotocol/demo",
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
 * - `@executioncontrolprotocol/chrome-ai` — browser-only (Chrome on-device `LanguageModel` API).
 * - `@executioncontrolprotocol/claude` — requires the Anthropic provider configuration/credentials.
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
