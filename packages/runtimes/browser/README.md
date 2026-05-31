# @ecp/browser

**Browser runtime host** for ECP: in-browser executor, registry extensions, session/local config, and helpers to initialize `Ecp` in a web page.

This is **not** the browser demo application. UI, provider picker, layout, and demo-only persistence belong in [`apps/browser-demo`](../../apps/browser-demo/).

## What belongs here

| In `@ecp/browser` | In `apps/browser-demo` (or your app) |
| ----------------- | ------------------------------------- |
| `@ecp/browser` runtime executor | React/Vite shell, chat layout, panels |
| `@ecp/browser-registry` (`globalThis.ecp`, freeze) | First-run modal, provider mode UI |
| `@ecp/browser-session-config` (in-memory API keys) | `localStorage` for **provider choice** (not secrets) |
| `createEcp()`, `installBrowserWorkflowShim()` | Monaco, Mermaid viewer, CSS |
| `registerBrowserDefaults()` — registers extensions on the catalog | Which capability id to pass to authoring (e.g. `@ecp/openai.generateText`) |

**Do not add demo-app UI types here** (e.g. hardcoded `ProviderMode` unions, demo localStorage keys). Those stay in the demo app—see `apps/browser-demo/src/lib/provider-mode.ts`.

## Reference bindings (optional)

These are **convenience** exports for the demo doc and tests, not requirements for every browser app:

- **`createBrowserDemoEnvironment()`** — pre-bound environment (browser runtime, format extensions, registry-control, session config). Your app can call `environment(id).withRuntime(...).withExtensions([...])` instead.
- **`BrowserAuthoringService`** — chat-driven create/patch orchestration on `Ecp`. The **caller** supplies `providerCapabilityId`; the service does not pick a provider mode.

## Typical usage

```ts
import { registerBrowserDefaults, environment, createEcp } from "@ecp/browser"
import { workflow, step } from "@ecp/core"

await registerBrowserDefaults()
const env = (await environment("my-app"))
  .withExtensions([/* your bindings */])
const ecp = await createEcp(env, { exposeGlobal: true })

await ecp.run(workflow("Hello").run([step("@ecp/test.echo", "E").with({ value: 1 }).as("out")]).toManifest())
```

## Compile-on-edit in the browser

Use **`@ecp/core/browser`** for `compileWorkflowSource` with `resolveImports: "browser-global"`, and call **`installBrowserWorkflowShim()`** before compile so Fluent source can use `@ecp/browser` imports or the injected shim.

Fluent emission for browser panels uses `ecp.encode(manifest).as("fluent").with({ target: "browser", importFrom: "@ecp/browser" })`.

**Compile-on-edit:** `compileWorkflowSource({ resolveImports: "browser-global" })` strips `@ecp/browser` imports and injects `globalThis.__ecpWorkflowShim` (call `installBrowserWorkflowShim()` first). The import is for authoring ergonomics, not a real browser bundle dependency.

**Monaco:** the demo app registers ambient types for `@ecp/browser` so the editor does not show TS2792; that is separate from the esbuild-wasm compile path.

## Dependencies

`@ecp/browser` depends on `@ecp/core` only for runtime mechanics. Extension packages (`@ecp/format-toon`, `@ecp/demo`, providers, etc.) are registered by `registerBrowserDefaults()` for the **reference** demo environment; production browser apps should register only what they need.

## Tests

```sh
npm run test:browser:install   # once
npm run test:browser
```

See [AGENTS.md](../../AGENTS.md) and [docs/ecp-browser-demo.md](../../docs/ecp-browser-demo.md) for the full demo story (app + runtime).
