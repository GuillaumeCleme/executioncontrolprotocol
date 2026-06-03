# @ecp/harnesses-browser

Single catalog harness **`@ecp/harness-browser`** used by the browser demo and `@ecp/evals` matrix tests.

## Invoke

```ts
import { BROWSER_HARNESS_CAPABILITY, HARNESS_TASKS } from "@ecp/harnesses-browser"

await ecp.invoke(BROWSER_HARNESS_CAPABILITY).with({
  task: HARNESS_TASKS.WORKFLOW_ASSISTANT,
  message: "What is ECP?",
})
```

Tasks:

| Task | Role |
| ---- | ---- |
| `workflow-authoring` | Create or patch `@ecp.workflow` via EQL |
| `intent-classification` | Route user messages (`faq`, `general`, `workflow-create`, `workflow-patch`) |
| `workflow-assistant` | Unified assistant: ECP FAQ, identity, environment/capability help, run-aware Q&A (`@ecp.harness.reply`) |

Reusable harness authoring helpers live in **`@ecp/core`** (summaries, repair formatting, normalization). This package adds product routing and workflow-specific capability hints.

## Profiles

- **`matrix`** (default) — Ollama/Chrome eval binding (EQL output, repair loop, identity primer on assistant/intent).
- **`browser-demo`** — same matrix harness config; provider swapped per invoke in the demo app.

## Browser demo

Guided and authoring chat routes non-workflow messages to `workflow-assistant` (model answers). Workflow-like requests use `workflow-authoring`. The chat header shows registered capability ids from `ecp.describe()`.
