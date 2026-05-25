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
| Workflow operations | `createHarnessOllamaWorkflowEnvironment()` | `@ecp/workflow-authoring` | `@ecp/format-toon` |
| Intent routing | `createHarnessOllamaIntentEnvironment()` | `@ecp/intent-classification` | `@ecp/format-json` |
| Combined (both) | `createHarnessOllamaEnvironment()` | both | TOON + JSON |

Tests live under [`test/harness/*.eval.test.ts`](test/harness/).

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

const EVAL_TIMEOUT_MS = 120_000
const readiness = await ollamaEvalReady()

describe.skipIf(!readiness.ready)(
  `my scenario (${readiness.profileId} ${readiness.model})`,
  () => {
    it(
      "does something assertable",
      async () => {
        const env = await createHarnessOllamaWorkflowEnvironment()
        const ecp = await env.init()

        const result = await ecp
          .invoke(harnessCapabilityId("@ecp/workflow-authoring"))
          .with({
            request: "Natural language request for the model.",
            model: OLLAMA_GEMMA_1B_EVAL.model,
          })
          .process()

        assertHarnessInvokeSuccess(result)
        const out = harnessResult(result)
        expect(out.artifact.schema).toBe("@ecp.workflow")
        await ecp.terminate()
      },
      EVAL_TIMEOUT_MS
    )
  }
)
```

Reuse [`assert-harness-result.ts`](test/harness/assert-harness-result.ts) for consistent failure messages (`diagnostics`, validation errors).

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
