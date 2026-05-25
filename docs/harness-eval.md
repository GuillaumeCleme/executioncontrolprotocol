# Harness evaluation (local)

Harnesses orchestrate model calls, format decode, and validation. Use them for repeatable provider comparisons (demo, Ollama, Chrome AI, cloud APIs).

## Standard harnesses

| Harness | Capability | Purpose |
| ------- | ---------- | ------- |
| `@ecp/evals-workflow-authoring` | `@ecp/evals-workflow-authoring.evaluate` | Create/patch workflows via JSON (Ollama evals; descriptor still TOON) |
| `@ecp/evals-intent-classification` | `@ecp/evals-intent-classification.evaluate` | Route chat (`faq`, `workflow-create`, `workflow-patch`, `general`) |

## `@ecp/evals` package

Harness eval tests live in [`packages/evals/`](../packages/evals/). See [`packages/evals/README.md`](../packages/evals/README.md) for the full guide to **creating new eval cases**.

### Pinned Ollama profile (no env overrides)

Eval model and URL are defined in code, not `OLLAMA_MODEL` / `OLLAMA_BASE_URL`:

| Setting | Baked value |
| ------- | ----------- |
| Profile | `ollama-gemma-1b` (`OLLAMA_GEMMA_1B_EVAL`) |
| Base URL | `http://localhost:11434` |
| Model | `gemma3:1b` |
| Provider | `@ecp/ollama.generate` |

Source: [`packages/evals/src/profiles/ollama-gemma.ts`](../packages/evals/src/profiles/ollama-gemma.ts).

### Run

```sh
ollama pull gemma3:1b
npm run eval:harness
```

Tests **skip** when Ollama or `gemma3:1b` is unavailable. When Ollama is up, failures are real assertion failures.

### Eval sets

| Eval set | Factory | Tests |
| -------- | ------- | ----- |
| **Workflow operations** | `createHarnessOllamaWorkflowEnvironment()` | [`workflow-authoring.eval.test.ts`](../packages/evals/test/harness/workflow-authoring.eval.test.ts) |
| **Intent routing** | `createHarnessOllamaIntentEnvironment()` | [`intent-classification.eval.test.ts`](../packages/evals/test/harness/intent-classification.eval.test.ts) |

| Scenario | Harness | Encoding |
| -------- | ------- | -------- |
| Create workflow | `@ecp/evals-workflow-authoring.evaluate` | `@ecp/format-json` |
| Patch workflow | `@ecp/evals-workflow-authoring.evaluate` | `@ecp/format-json` + `@ecp.patch` |
| Intent create | `@ecp/evals-intent-classification.evaluate` | `@ecp/format-json` |
| Intent patch | `@ecp/evals-intent-classification.evaluate` | `@ecp/format-json` |

Workflow environment: [`packages/evals/src/environments/harness-ollama-workflow.ts`](../packages/evals/src/environments/harness-ollama-workflow.ts).

[`examples/harness-ollama/environment.ts`](../examples/harness-ollama/environment.ts) re-exports `createHarnessOllamaEnvironment()` (combined workflow + intent).

Intent eval environments bind `@ecp/format-toon` and `@ecp/test` (same as workflow) and include the environment descriptor in the harness prompt. See [packages/evals/README.md](../packages/evals/README.md#traceability-when-a-model-fails).

## Traceability

When an eval fails, use harness `trace` and eval helpers:

- **Invoke failed:** `assertHarnessInvokeSuccess` prints diagnostics; decode failures include `rawModelOutput` in the message.
- **Wrong intent/artifact:** `expectHarnessIntent()` or `expect(..., harnessTraceHint(output))` — see [`assert-harness-result.ts`](../packages/evals/test/harness/assert-harness-result.ts).

## Creating new eval cases

1. **Pick an eval set** — workflow vs intent (or add a new profile under `packages/evals/src/profiles/`).
2. **Add a fixture** under `packages/evals/fixtures/` when patching or comparing baselines.
3. **Add** `packages/evals/test/harness/<name>.eval.test.ts` using `describe.skipIf(!readiness.ready)` and `ollamaEvalReady()`.
4. **Use the matching environment factory** and pass `model: OLLAMA_GEMMA_1B_EVAL.model` on harness invoke input when you want the profile model on each call.
5. **Assert narrowly** — schema, validation, decode trace, and concrete artifact fields.
6. **Keep fast tests in core** — `packages/core/test/harness/` with `@ecp/demo.generate` runs in every `npm run check`.

Example skeleton:

```ts
import { harnessCapabilityId } from "@ecp/types"
import {
  OLLAMA_GEMMA_1B_EVAL,
  createHarnessOllamaWorkflowEnvironment,
  ollamaEvalReady,
} from "@ecp/evals"
import { assertHarnessInvokeSuccess, harnessResult } from "./assert-harness-result.js"

const readiness = await ollamaEvalReady()
describe.skipIf(!readiness.ready)("my eval", () => {
  it("...", async () => {
    const ecp = await (await createHarnessOllamaWorkflowEnvironment()).init()
    const result = await ecp
      .invoke(EVALS_WORKFLOW_AUTHORING_CAPABILITY)
      .with({ request: "...", model: OLLAMA_GEMMA_1B_EVAL.model })
      .process()
    assertHarnessInvokeSuccess(result)
    await ecp.terminate()
  }, 120_000)
})
```

### Adding a new profile (e.g. another model)

1. Add `packages/evals/src/profiles/<name>.ts` with `baseURL`, `model`, `providerId`.
2. Add `packages/evals/src/environments/harness-<name>.ts` binding extensions and harnesses.
3. Export from [`packages/evals/src/index.ts`](../packages/evals/src/index.ts).
4. Point new eval tests at `ollamaEvalReady(yourProfile)` and your factory.

## Invoke pattern

```ts
const result = await ecp
  .invoke("@ecp/evals-workflow-authoring.evaluate")
  .with({
    request: "Create an echo workflow",
    model: "gemma3:1b",
  })
  .process()
```

Environment bindings already set `defaultModel` on `@ecp/ollama`; invoke `model` reinforces the pinned tag per call.

## Core formatters

| Formatter | Id |
| --------- | -- |
| JSON | `@ecp/format-json` (core) |
| Fluent | `@ecp/format-fluent` (core) |
| TOON | `@ecp/format-toon` (extension) |

Encode/decode always require `.uses(formatterId)` — no `.as("fluent")` shorthand.

## Trace fields

Harness results include `trace` with `harness`, `provider`, `outputFormat`, `decodeSucceeded`, and optional `prompt` / `rawOutput` when enabled in harness config.

## CI

Scheduled workflow [`.github/workflows/evals.yml`](../.github/workflows/evals.yml) pulls `gemma3:1b` (by default) and runs `npm run eval:harness` after CLI evals. The harness eval profile matches that model tag in source.
