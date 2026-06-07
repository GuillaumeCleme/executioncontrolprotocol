# @ecp/runtime-temporal

> **Pre-release scaffold.** This package exposes a typed Temporal runtime
> definition and executor contract, but **durable execution is not implemented
> yet.** Binding this runtime and running a workflow throws a descriptive error.
> Use [`@ecp/node`](../node/README.md) for local execution today.

## What is real

- `temporalRuntimeDefinition` — a real `defineRuntime("@ecp", "temporal")` with a
  config schema (`taskQueue`, `durablePauses`).
- `TemporalRuntimeExecutor` — implements the `RuntimeExecutor` contract from
  `@ecp/core`.
- `registerTemporalRuntime(registry?)` — idempotent registration on a registry.
- `TEMPORAL_RUNTIME_ID` (`@ecp/temporal`).

## What is not implemented

- Durable orchestration, activities, signals/updates, pause/resume, and
  policy-constrained retries. `TemporalRuntimeExecutor.execute()` rejects with a
  clear "not yet implemented" error.

## Usage (when implemented)

```ts
import { environment, runtime } from "@ecp/node"
import { temporalRuntimeDefinition, registerTemporalRuntime } from "@ecp/runtime-temporal"

await registerTemporalRuntime()

const env = environment("production").withRuntime(
  runtime("@ecp/temporal", "Temporal Runtime").with({
    taskQueue: "ecp-runtime",
    durablePauses: true,
  })
)
```

See [`ecp-overhaul.md`](../../../ecp-overhaul.md) section 17 for the intended
Temporal responsibilities.
