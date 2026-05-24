# @ecp/browser-demo

Reference **browser demo application** (Vite + React): chat-first UX, workflow/code panels, Mermaid graph viewer, and first-run provider selection.

This app is **separate** from [`@ecp/browser`](../../packages/browser/README.md), which is the reusable browser **runtime host**.

## Package boundaries

| Layer | Path | Responsibility |
| ----- | ---- | ---------------- |
| Runtime host | `packages/browser` | `Ecp` in browser, registry, session config, `createEcp`, optional reference env |
| Demo app | `apps/browser-demo` | UI, provider picker, layout state, demo localStorage keys |
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

`npm run check` typechecks this app via `npm run typecheck:browser-demo` (project TSC). `npm run dev` does not — use typecheck before shipping UI changes.

Open the URL Vite prints (default `http://localhost:5173`).

**Fluent editor:** Monaco is isolated to `FluentWorkflowEditor` with a virtual `file:///ecp-workflow/workflow.ts` URI (not app paths like `CodePanel.tsx`). In-editor TypeScript validation is off; the red banner above the editor comes from `compileWorkflowSource` (esbuild-wasm + shim).

## Spec

Behavior and milestones: [docs/ecp-browser-demo.md](../../docs/ecp-browser-demo.md).
