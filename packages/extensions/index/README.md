# @ecp/extensions

Optional convenience bundle that registers the **host-agnostic, dependency-light**
first-party extensions in one call.

```ts
import { registerAllExtensions } from "@ecp/extensions"

await registerAllExtensions()
```

## What `registerAllExtensions()` registers

| Extension | Purpose |
| --------- | ------- |
| `@ecp/memory` | Memory capabilities + lifecycle hooks |
| `@ecp/storage` | Key/value storage capabilities |
| `@ecp/slack` | Slack send capability |
| `@ecp/telemetry` | Lifecycle telemetry hooks |
| `@ecp/openai` | OpenAI model provider |
| `@ecp/ollama` | Local Ollama model provider |
| `@ecp/format-toon` | TOON encode/decode |
| `@ecp/format-eql` | EQL encode/decode (harness output) |
| `@ecp/format-mermaid` | Mermaid encode (workflow graph) |
| `@ecp/demo` | Offline deterministic demo provider/ops |

The exact set is exported as `BUNDLED_EXTENSION_IDS`.

## Intentionally excluded

These are **not** registered by `registerAllExtensions()` because they are
host-specific or require credentials. Register them explicitly when needed:

| Extension | Why excluded |
| --------- | ------------ |
| `@ecp/chrome-ai` | Browser-only (Chrome on-device `LanguageModel` API) |
| `@ecp/claude` | Requires Anthropic provider configuration/credentials |

```ts
import { registerChromeAiExtension } from "@ecp/chrome-ai"
await registerChromeAiExtension()
```

This mirrors the spec guidance that the convenience bundle should avoid forcing
heavy or host-specific transitive dependencies.
