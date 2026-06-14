# @executioncontextprotocol/extensions

Optional convenience bundle that registers the **host-agnostic, dependency-light**
first-party extensions in one call.

```ts
import { registerAllExtensions } from "@executioncontextprotocol/extensions"

await registerAllExtensions()
```

## What `registerAllExtensions()` registers

| Extension | Purpose |
| --------- | ------- |
| `@executioncontextprotocol/memory` | Memory capabilities + lifecycle hooks |
| `@executioncontextprotocol/storage` | Key/value storage capabilities |
| `@executioncontextprotocol/slack` | Slack send capability |
| `@executioncontextprotocol/telemetry` | Lifecycle telemetry hooks |
| `@executioncontextprotocol/openai` | OpenAI model provider |
| `@executioncontextprotocol/ollama` | Local Ollama model provider |
| `@executioncontextprotocol/format-toon` | TOON encode/decode |
| `@executioncontextprotocol/format-eql` | EQL encode/decode (harness output) |
| `@executioncontextprotocol/format-mermaid` | Mermaid encode (workflow graph) |
| `@executioncontextprotocol/demo` | Offline deterministic demo provider/ops |

The exact set is exported as `BUNDLED_EXTENSION_IDS`.

## Intentionally excluded

These are **not** registered by `registerAllExtensions()` because they are
host-specific or require credentials. Register them explicitly when needed:

| Extension | Why excluded |
| --------- | ------------ |
| `@executioncontextprotocol/chrome-ai` | Browser-only (Chrome on-device `LanguageModel` API) |
| `@executioncontextprotocol/claude` | Requires Anthropic provider configuration/credentials |

```ts
import { registerChromeAiExtension } from "@executioncontextprotocol/chrome-ai"
await registerChromeAiExtension()
```

This mirrors the spec guidance that the convenience bundle should avoid forcing
heavy or host-specific transitive dependencies.
