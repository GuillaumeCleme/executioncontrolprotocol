# @ecp/harnesses-browser

Single catalog harness **`@ecp/harness-browser`** used by the browser demo and `@ecp/evals` matrix tests.

## Invoke

```ts
import { BROWSER_HARNESS_CAPABILITY, HARNESS_TASKS } from "@ecp/harnesses-browser"

await ecp.invoke(BROWSER_HARNESS_CAPABILITY).with({
  task: HARNESS_TASKS.WORKFLOW_AUTHORING,
  request: "Create an echo workflow",
})
```

Tasks: `workflow-authoring`, `intent-classification`, `workflow-assistant`.

## Profiles

- **`matrix`** (default) — Ollama eval binding (`@ecp/format-json` workflow output, full repair loop).
- **`browser-demo`** — set `harnessProfile: "browser-demo"` on the env harness binding (TOON workflow output for the demo UI).

`@ecp/harnesses-evals` re-exports this package for backward compatibility (`EVALS_HARNESS_*` aliases).
