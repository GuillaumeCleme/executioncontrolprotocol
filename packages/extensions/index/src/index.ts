export { registerMemoryExtension, memoryExtension } from "@executioncontextprotocol/extension-memory"
export { registerOpenaiExtension, openaiExtension } from "@executioncontextprotocol/extension-openai"
export { registerOllamaExtension, ollamaExtension } from "@executioncontextprotocol/extension-ollama"
export { registerSlackExtension, slackExtension } from "@executioncontextprotocol/extension-slack"
export { registerStorageExtension, storageExtension } from "@executioncontextprotocol/extension-storage"
export { registerTelemetryExtension, telemetryExtension } from "@executioncontextprotocol/extension-telemetry"
export { registerFormatToonExtension, formatToonExtension } from "@executioncontextprotocol/format-toon"
export { registerFormatEqlExtension, formatEqlExtension } from "@executioncontextprotocol/format-eql"
export { registerFormatMermaidExtension, formatMermaidExtension } from "@executioncontextprotocol/format-mermaid"
export { registerDemoExtension, demoExtension } from "@executioncontextprotocol/demo"

import { registerMemoryExtension } from "@executioncontextprotocol/extension-memory"
import { registerOpenaiExtension } from "@executioncontextprotocol/extension-openai"
import { registerOllamaExtension } from "@executioncontextprotocol/extension-ollama"
import { registerSlackExtension } from "@executioncontextprotocol/extension-slack"
import { registerStorageExtension } from "@executioncontextprotocol/extension-storage"
import { registerTelemetryExtension } from "@executioncontextprotocol/extension-telemetry"
import { registerFormatToonExtension } from "@executioncontextprotocol/format-toon"
import { registerFormatEqlExtension } from "@executioncontextprotocol/format-eql"
import { registerFormatMermaidExtension } from "@executioncontextprotocol/format-mermaid"
import { registerDemoExtension } from "@executioncontextprotocol/demo"

/** Namespaced ids registered by {@link registerAllExtensions}. */
export const BUNDLED_EXTENSION_IDS = [
  "@executioncontextprotocol/memory",
  "@executioncontextprotocol/openai",
  "@executioncontextprotocol/ollama",
  "@executioncontextprotocol/slack",
  "@executioncontextprotocol/storage",
  "@executioncontextprotocol/telemetry",
  "@executioncontextprotocol/format-toon",
  "@executioncontextprotocol/format-eql",
  "@executioncontextprotocol/format-mermaid",
  "@executioncontextprotocol/demo",
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
 * - `@executioncontextprotocol/chrome-ai` — browser-only (Chrome on-device `LanguageModel` API).
 * - `@executioncontextprotocol/claude` — requires the Anthropic provider configuration/credentials.
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
