# @ecp/browser-demo

Reference **browser demo application** (Vite + React): chat-first UX, workflow/code panels, Mermaid graph viewer, and first-run provider selection.

This app is **separate** from [`@ecp/browser`](../../packages/runtimes/browser/README.md), which is the reusable browser **runtime host**.

## Package boundaries

| Layer | Path | Responsibility |
| ----- | ---- | ---------------- |
| Runtime host | `packages/runtimes/browser` | `Ecp` in browser, registry, session config, `createEcp`, optional reference env |
| Demo app | `apps/browser-demo` | UI: **Code** / **Workflow** / **Environment** panels; provider picker in first-run modal |
| Core | `packages/core` | Fluent API, encode/decode/patch; `@ecp/core/browser` for browser compile |
| Extensions | `packages/extensions/*` | TOON, Mermaid, demo provider, OpenAI, Claude, Chrome AI |

**Demo-only code lives here**, not in `@ecp/browser`:

- `src/lib/provider-mode.ts` — `ProviderMode`, capability mapping, persisted provider choice
- `src/components/*` — chat shell, panels, first-run modal, Mermaid viewer
- `src/hooks/*` — workspace layout and chat history

The app passes `providerCapabilityId` into `BrowserAuthoringService`; the runtime package does not choose a provider.

## Run locally

From repo root:

```sh
npm install
npm run build
npm run dev:browser-demo
```

Chat routes every message through `@ecp/harness-browser-nano`: **`intent-classification`** first, then **`workflow-authoring`** or **`workflow-assistant`** from the classified intent. The demo uses the same harness binding as eval matrix tests (`HARNESS_NANO_BINDING` / EQL outputs); only the provider id is swapped at invoke (e.g. `@ecp/chrome-ai.generate`).

```sh
npm run build:browser-demo
```

Open the URL Vite prints (default `http://localhost:5173`).

**Panel encoding:** all Code/Workflow views fan out from the canonical **`@ecp.workflow` manifest** (JSON). Mermaid uses `.with({ direction: "LR" })` on `@ecp/format-mermaid` encode (default is `TD`).

## GitHub Pages

Live demo: [https://guillaumecleme.github.io/executioncontrolprotocol/](https://guillaumecleme.github.io/executioncontrolprotocol/)

Deploys automatically on every push to **`main`** via [`.github/workflows/pages-browser-demo.yml`](../../.github/workflows/pages-browser-demo.yml). One-time setup: GitHub repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Local Pages build (same asset paths as CI):

```sh
GITHUB_PAGES=true GITHUB_REPOSITORY=GuillaumeCleme/executioncontrolprotocol npm run build:browser-demo:pages
```

First-run provider modal: **Chrome built-in AI** and **Demo mode** are selectable; OpenAI and Claude are marked **coming soon**.

## Spec

Behavior and milestones: [docs/ecp-browser-demo.md](../../docs/ecp-browser-demo.md).
