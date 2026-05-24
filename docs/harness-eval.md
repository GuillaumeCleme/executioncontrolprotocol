# Harness evaluation (local)

Harnesses orchestrate model calls, format decode, and validation. Use them for repeatable provider comparisons (demo, Ollama, Chrome AI, cloud APIs).

## Standard harnesses

| Harness | Capability | Purpose |
| ------- | ---------- | ------- |
| `@ecp/workflow-authoring` | `@ecp/workflow-authoring.evaluate` | Create/patch workflows via TOON |
| `@ecp/intent-classification` | `@ecp/intent-classification.evaluate` | Route chat (`faq`, `workflow-create`, `workflow-patch`, `general`) |

## Ollama example environment

See [`examples/harness-ollama/environment.ts`](../examples/harness-ollama/environment.ts).

```sh
npm run eval:harness
```

Requires Ollama at `OLLAMA_BASE_URL` (default `http://localhost:11434`) with `OLLAMA_MODEL` (default `gemma3:4b`). Tests skip when Ollama is unreachable.

## Invoke pattern

```ts
const result = await ecp
  .invoke("@ecp/workflow-authoring.evaluate")
  .uses("@ecp/ollama.generate")
  .with({ request: "Create an echo workflow" })
  .process()
```

Environment bindings supply default `.uses()`; invoke `.uses()` overrides for A/B tests or the browser demo provider picker.

## Core formatters

| Formatter | Id |
| --------- | -- |
| JSON | `@ecp/format-json` (core) |
| Fluent | `@ecp/format-fluent` (core) |
| TOON | `@ecp/format-toon` (extension) |

Encode/decode always require `.uses(formatterId)` — no `.as("fluent")` shorthand.

## Trace fields

Harness results include `trace` with `harness`, `provider`, `outputFormat`, `decodeSucceeded`, and optional `prompt` / `rawOutput` when enabled in harness config.
