# @ecp/evals

Private workspace package for **harness eval tests**: real model providers, strict assertions, optional local Ollama.

Eval configuration is **baked into source** (model id, base URL, harness bindings)—not driven by `OLLAMA_MODEL` / `OLLAMA_BASE_URL` environment variables.

## Pinned profile (default)

| Field | Value |
| ----- | ----- |
| Profile id | `ollama-gemma-1b` |
| Provider | `@ecp/ollama` |
| Base URL | `http://localhost:11434` |
| Model | `gemma3:1b` |

Defined in [`src/profiles/ollama-gemma.ts`](src/profiles/ollama-gemma.ts) as `OLLAMA_GEMMA_1B_EVAL`.

## Run evals

```sh
ollama pull gemma3:1b
npm run eval:harness
```

From the repo root. Tests **skip** when Ollama is down or the model is not pulled; when Ollama is up, failures are real regressions.

Run one eval file:

```sh
npx vitest run --project eval packages/evals/test/harness/workflow-authoring.eval.test.ts
```

## Eval sets

| Eval set | Environment factory | Harness | Encoding |
| -------- | ------------------- | ------- | -------- |
| Workflow operations | `createHarnessOllamaWorkflowEnvironment()` | `@ecp/evals-workflow-authoring` | `@ecp/format-json` (descriptor still TOON) |
| Intent routing | `createHarnessOllamaIntentEnvironment()` | `@ecp/evals-intent-classification` | `@ecp/format-json` |
| Combined (both) | `createHarnessOllamaEnvironment()` | both | JSON output + TOON descriptor |

### Extension alignment

Workflow and intent eval environments bind the **same operational extensions** so prompts and environment descriptors stay consistent:

| Extension | Why |
| --------- | --- |
| `@ecp/ollama` | Model provider (`gemma3:1b`) |
| `@ecp/format-toon` | Environment descriptor encoding for harness context |
| `@ecp/test` | `@ecp/test.echo` appears in the descriptor and workflow eval prompts |

`@ecp/format-json` (intent output) is a **core** formatter—registered via `registerCoreFormats()`, not a separate binding.

Harness config lives in [`src/harness-eval-config.ts`](src/harness-eval-config.ts). Intent evals set `includeEnvironmentDescriptor: true` so the model sees available capabilities before classifying.

Tests live under [`test/harness/*.eval.test.ts`](test/harness/).

## Traceability when a model fails

Harness results include a `trace` object when invoke succeeds. Eval tests enable full trace via `EVAL_HARNESS_TRACE` (`includePrompt`, `includeRawOutput`, `includeValidation`).

| Failure stage | What you see |
| ------------- | ------------ |
| **Invoke failed** (`success: false`) | `assertHarnessInvokeSuccess` prints `formatInvokeFailure(result)` — diagnostics codes/messages. Decode errors from the harness include `rawModelOutput:` in the diagnostic text. |
| **Wrong artifact** (invoke succeeded) | Use `expect(..., harnessTraceHint(harnessOutput))` or `expectHarnessIntent(result, intent)` — Vitest shows prompt, raw model text, validation errors, provider, and model. |
| **Manual inspection** | `formatHarnessTrace(harnessOutput)` in [`test/harness/assert-harness-result.ts`](test/harness/assert-harness-result.ts) |

Example on assertion mismatch:

```ts
import { expectHarnessIntent, harnessTraceHint } from "./assert-harness-result.js"

const output = expectHarnessIntent(result, ECP_INTENT_VALUES.WORKFLOW_CREATE)
// or
expect(got.intent, harnessTraceHint(harnessOutput)).toBe(ECP_INTENT_VALUES.WORKFLOW_PATCH)
```

Typical failure stages for intent evals:

1. **Model** — malformed JSON in `trace.rawOutput` (fences, truncated JSON, wrong keys). Repair retries strip fences and pass decode errors back to the model.
2. **Decode** — `@ecp/format-json` rejects output; error message includes field paths (not bare `Required`) and `rawModelOutput`.
3. **Validation** — decoded JSON missing `@ecp.intent` schema or invalid `intent` enum (`trace.validation`).

### Repair loop (model learns from failures)

Core collectors (`collectDecodeFeedback`, `collectPatchFeedback`, `collectValidationFeedback`) produce `HarnessOperationFeedback` with paths and codes. Eval harnesses format that into repair prompts via `formatFeedbackForModel` in `packages/evals/src/harnesses/presentation.ts`.

Harness config supports `repair` (enabled in eval via `EVAL_HARNESS_REPAIR`):

| Setting | Eval default | Effect |
| ------- | ------------ | ------ |
| `enabled` | `true` | Retry after decode, patch, or validation failures |
| `maxAttempts` | `2` | Up to 3 total model calls (initial + 2 repairs) |
| `includeValidationErrors` | `true` | Next prompt includes `path: message [CODE]` details |

On retry, the model sees lines like:

```text
Previous attempt failed. Fix these issues and return corrected output only:
schema: Required [INVALID_TYPE]; patches: Required [INVALID_TYPE]
Patch document must include: schema @ecp.patch, version, targetSchema @ecp.workflow, patches array...
```

Inspect the repair prompt in `trace.prompt` on the final successful or failed attempt.

Run a single eval with verbose Vitest output:

```sh
npx vitest run --project eval packages/evals/test/harness/intent-classification.eval.test.ts --reporter=verbose
```

## Creating a new eval case

### 1. Choose an eval set

- **Workflow create/patch** → use `createHarnessOllamaWorkflowEnvironment()` and workflow fixtures under [`fixtures/`](fixtures/).
- **Intent classification** → use `createHarnessOllamaIntentEnvironment()`.
- **New provider or model** → add a profile in `src/profiles/` and a matching `src/environments/` factory (do not rely on env vars).

### 2. Add a fixture (optional)

```text
packages/evals/fixtures/my-workflow.json
```

Use for patch evals or golden baselines.

### 3. Add a test file

Create `packages/evals/test/harness/my-scenario.eval.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { harnessCapabilityId } from "@ecp/types"
import {
  OLLAMA_GEMMA_1B_EVAL,
  createHarnessOllamaWorkflowEnvironment,
  ollamaEvalReady,
} from "@ecp/evals"
import { assertHarnessInvokeSuccess, harnessResult } from "./assert-harness-result.js"

const readiness = await ollamaEvalReady()

describe.skipIf(!readiness.ready)(
  `my scenario (${readiness.profileId} ${readiness.model})`,
  () => {
    it("does something assertable", async () => {
        const env = await createHarnessOllamaWorkflowEnvironment()
        const ecp = await env.init()

        const result = await ecp
          .invoke(EVALS_WORKFLOW_AUTHORING_CAPABILITY)
          .with({
            request: "Natural language request for the model.",
            model: OLLAMA_GEMMA_1B_EVAL.model,
          })
          .process()

        assertHarnessInvokeSuccess(result)
        const out = harnessResult(result)
        expect(out.artifact.schema).toBe("@ecp.workflow")
        await ecp.terminate()
    })
  }
)
```

Eval tests use a **120s** default timeout on the Vitest `eval` project (`testTimeout` in [`vitest.config.ts`](../../vitest.config.ts)).

Reuse [`assert-harness-result.ts`](test/harness/assert-harness-result.ts) for `assertHarnessInvokeSuccess`, `harnessTraceHint`, and `expectHarnessIntent`.

### 4. Assert narrowly

Prefer checks the model can reliably satisfy:

- `result.success`, `artifact.schema`, `validation.valid`
- `trace.decodeSucceeded`, `trace.outputFormat`
- Concrete workflow fields (step count, label, input value) for patch cases

### 5. Fast offline tests stay in `@ecp/core`

Deterministic harness behavior (demo provider, mocks) belongs in `packages/core/test/harness/` and runs in `npm run test:unit`. Reserve `@ecp/evals` for real model scrutiny.

## Changing the pinned model

Edit [`src/profiles/ollama-gemma.ts`](src/profiles/ollama-gemma.ts) and update environment factories if bindings change. Re-run `ollama pull <new-tag>` locally and align CI model pull in [`.github/workflows/evals.yml`](../../.github/workflows/evals.yml).

## More documentation

See [Harness evaluation](../../docs/harness-eval.md) in `docs/`.
