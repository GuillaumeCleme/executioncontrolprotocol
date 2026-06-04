# @ecp/harnesses-browser-nano

**Browser Nano** harness — catalog id **`@ecp/harness-browser-nano`**. Tuned for on-device and small (~1B) models: short EQL replies, compact context, repair loop, identity primer.

Used by the browser demo (all provider modes today) and `@ecp/evals` matrix tests (Ollama gemma3:1b, Chrome Nano).

For stronger cloud models, add a separate harness package (e.g. `@ecp/harnesses-browser-nano-standard`) with its own prompts and output shaping.

## Invoke

```ts
import { BROWSER_NANO_HARNESS_CAPABILITY, HARNESS_TASKS } from "@ecp/harnesses-browser-nano"

await ecp.invoke(BROWSER_NANO_HARNESS_CAPABILITY).with({
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

Reusable harness authoring helpers live in **`@ecp/core`**. This package adds product routing and workflow-specific capability hints.

## Profiles

- **`nano`** (default) — eval matrix binding (EQL output, repair loop, identity primer on assistant/intent).
- **`browser-demo`** — same nano config; provider swapped per invoke in the demo app.
