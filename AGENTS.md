# AGENTS.md

## ECP Fluent API monorepo (`@ecp/*`)

| Path | Purpose |
| ---- | ------- |
| `packages/types/` | Protocol types (`@ecp/types`) — [README](packages/types/README.md) |
| `packages/core/` | Fluent API, environment, in-memory engine (`@ecp/core`) — [README](packages/core/README.md) |
| `packages/runtimes/node/` | Node runtime host (`@ecp/node`) — [README](packages/runtimes/node/README.md) |
| `packages/runtimes/browser/` | Browser runtime host (`@ecp/browser`) — [README](packages/runtimes/browser/README.md) |
| `packages/runtimes/temporal/` | Temporal runtime adapter stub (`@ecp/runtime-temporal`) |
| `apps/browser-demo/` | Reference browser demo app (UI only) — [README](apps/browser-demo/README.md) |
| `packages/mcp/` | MCP adapter (`@ecp/mcp`) |
| `packages/cli/` | `ecp` CLI (`@ecp/cli`) |
| `packages/policies/` | Budget, approval, state-control (`@ecp/policies`) |
| `packages/evals/` | Harness/provider eval tests (`@ecp/evals`, private); pinned `gemma3:1b` @ `localhost:11434` — see [packages/evals/README.md](packages/evals/README.md) |
| `packages/harnesses/browser-nano/` | Browser Nano harness (`@ecp/harnesses-browser-nano`) — small-model demo + eval matrix |
| `packages/harnesses/browser-coding/` | Browser Coding harness (`@ecp/harnesses-browser-coding`) — TypeScript/Fluent surface; Qwen 4B eval matrix |
| `packages/extensions/*/` | First-party extensions |
| `archive/legacy-v0.5/` | Archived v0.5 Oclif CLI and snippets |
| `ecp-overhaul.md` | Implementation spec (source of truth) |

### Package boundaries

**Core is runtime-agnostic.** The main `@ecp/core` barrel has no Node or browser I/O. Host-specific code is on subpaths:

| Subpath | Host |
| ------- | ---- |
| `@ecp/core/node` | Node convenience re-export (loaders + compile) |
| `@ecp/core/compile` | Node esbuild compile |
| `@ecp/core/loaders` | Node file I/O (CLI) |
| `@ecp/core/browser` | Browser authoring + esbuild-wasm compile |

**Hosts wrap core; extensions never import hosts.** `@ecp/node` and `@ecp/browser` bind runtimes and config extensions. Extension packages under `packages/extensions/` depend on `@ecp/types` + `@ecp/core` only.

**Browser runtime vs browser demo app:**

| `@ecp/browser` (runtime) | `apps/browser-demo` (app) |
| ------------------------ | ------------------------- |
| Executor, registry, session config, `createEcp`, workflow shim | React/Vite UI, chat layout, panels, Mermaid viewer |
| Optional reference helpers: `createBrowserDemoEnvironment`, `BrowserAuthoringService` | Demo-only: `provider-mode.ts`, first-run modal, localStorage for provider choice |
| Caller supplies `providerCapabilityId` to authoring | App maps user provider pick → capability id |

Do not add demo UI types (e.g. `ProviderMode`) to `@ecp/browser`; keep them in the demo app.

**Operational APIs live on `Ecp` after `init()`**, not on the `Environment` builder (`run`, `encode`, `decode`, `patch`, `validate`, `describe`, `search`, `invoke`, `terminate`).

**Fluent rendering is in core** — `ecp.encode(...).as("fluent")`; there is no `@ecp/format-fluent` extension.

### Commands

```sh
npm install
npm run build
npm run generate:schema   # writes packages/types/dist/schemas/*.json
npm run check    # build + generate:schema + lint + build:browser-demo + test:unit + test:integration + test:e2e
npm run test:unit
npm run test:eval      # harness evals (Ollama gemma3:1b; skips when unavailable)
npm run eval:harness   # alias for test:eval
```

Harness eval profile is baked in `packages/evals/src/profiles/ollama-gemma.ts` (not `OLLAMA_MODEL` env).

### CLI

Oclif v4 (`@oclif/core`). Commands live in `packages/cli/src/commands/`; build with `npm run build` before `npm link` or tests.

```sh
ecp run examples/01-echo/workflow.ts --env examples/01-echo/environment.ts
ecp validate examples/01-echo/workflow.ts --env examples/01-echo/environment.ts
ecp compile examples/01-echo/workflow.ts -o /tmp/workflow.json
ecp describe --env examples/01-echo/environment.ts
ecp search "echo" --env examples/01-echo/environment.ts
ecp encode workflow.json --format toon --env examples/01-echo/environment.ts -o workflow.toon
ecp decode workflow.toon --format toon --env examples/01-echo/environment.ts -o workflow.json
ecp encode workflow.json --format fluent --env examples/01-echo/environment.ts -o workflow.generated.ts
ecp run --help
```

### Operational instance (`env.init()`)

`await env.init()` returns an **`Ecp`** instance for all operational APIs: `run`, `encode`, `decode`, `patch`, `validate`, `describe`, `search`, and `invoke` (when implemented). Lifecycle: `environment:configuring` → bind extensions → `environment:ready`. Call `ecp.terminate()` to emit `environment:terminate`.

### Environment encoding, decoding, and patch

Utility operations do not emit run/step lifecycle hooks.

- Results use **`@ecp.encode.result`** / **`@ecp.decode.result`** / **`@ecp.patch.result`** with `success`, **`.result`**, `validation`, and `diagnostics` (not `.content` / `.document`).
- `ecp.encode(source).uses("@ecp/format-toon").to("@ecp.workflow").with({ headers: false }).process()`
- `ecp.decode(input).uses("@ecp/format-toon").to("@ecp.patch").process()` — decode input field is **`input`** in `EcpDecodeInput` payloads to extensions.
- `ecp.patch(manifest).with(patchDocOrShorthand).process()` — patch paths use **`steps[<stepId>].field`** (globally unique step IDs; `WorkflowBuilder.toManifest()` assigns unique IDs).
- Omit `.uses(...)` for canonical JSON passthrough.
- **Fluent authoring (core):** `workflow(...).toManifest()` / `compileWorkflowSource` (Fluent/TS → manifest); `renderWorkflowToFluent` / `workflow(...).toFluentSource()` / `ecp.encode(...).as("fluent")` (manifest → Fluent source). No `@ecp/format-fluent` extension.
- **TOON (extension):** `@ecp/format-toon` via `.uses("@ecp/format-toon")`; `headers` / `compact` options; validates workflow, environment, `@ecp.patch`.
- MCP tools: `ecp.encode`, `ecp.decode` on `createEcpMcpServer`

### Extension catalog and binding

Extension packages call `catalogExtension(def)` at module load. **Examples use string bindings:** `extension("@ecp/format-toon").with({})` after `import "@ecp/format-toon"` (catalog lookup). For the in-repo stub, `import "@ecp/core/testing"` then `extension("@ecp/test").with({})`.

`ensureBoundExtensionsRegistered()` runs automatically before `encode`, `decode`, `describe`, and `run` — no separate `await register*()` in environment modules when the package catalogs on import.

### Extension authoring (third-party parity)

Built-in packages under `packages/extensions/` follow the same rules as external extension authors. See [`.cursor/rules/extensions.mdc`](.cursor/rules/extensions.mdc).

| Do | Don't |
| ---- | ----- |
| Depend on `@ecp/types` + `@ecp/core` (+ focused third-party libs) | Import `@ecp/node`, `@ecp/browser`, `@ecp/cli`, or `@ecp/mcp` from an extension package |
| `catalogExtension(def)` on package load; optional `register*Extension(registry?)` | Call `describe()` / `run()` or require a host runtime inside extension tests |
| Test with document **fixtures** and `environment()` from `@ecp/core` for encode/decode | Pull in `nodeEnvironment()` to build discovery payloads |

**Apps and examples** compose extensions in `environment.ts` using `@ecp/node` or `@ecp/browser` — that host layer is separate from extension package code.

Local dev: `npm start -w @ecp/cli` (runs `bin/dev.js` after build).

### Fluent API quickstart

```ts
import { workflow, step } from "@ecp/core"
import { environment, extension } from "@ecp/node"
import "@ecp/core/testing"

const manifest = workflow("My flow")
  .run([step("@ecp/test.echo", "Echo").with({ value: "hi" }).as("echo")])
  .toManifest()
// Manifest steps use the same verbs as the fluent API: `.as("echo")` → `as: "echo"`; optional `{ mode }` → `mode: "create" | ...`

const env = (await environment("dev")).withExtensions([extension("@ecp/test").with({})])
const ecp = await env.init()
await ecp.run(manifest)
```

### Browser

Local demo: `npm run dev:browser-demo` (see [apps/browser-demo/README.md](apps/browser-demo/README.md)). Spec: [docs/ecp-browser-demo.md](docs/ecp-browser-demo.md).

**Browser demo chat:** FAQ and assistant replies must come from the bound model provider via `@ecp/harness-browser-nano` (`workflow-assistant` task). Do not route user-facing chat through template capabilities (`@ecp/browser.guideChat`) or other non-model stand-ins. Browser demo and eval matrix share **`HARNESS_NANO_BINDING`** (EQL outputs for intent, workflow, and assistant); only the provider (`.uses(...)` at invoke) differs in the demo app.

**Mechanism vs policy:** `@ecp/browser-registry` handles freeze, `globalThis.ecp`, and auto-bind. **`@ecp/registry-control`** (bound as a policy) authorizes dynamic extension registration via `policy:pre` and `registryRequest` on the policy context.

```ts
import { environment, workflow, step, extension, policy } from "@ecp/browser"

const env = await environment("demo") // binds registry-control + browser-registry (global `ecp`)

const ecp = await env.init()
await globalThis.ecp.registerExtension(customerExtension)

await ecp.run(workflow)
```

**Lifecycle:** `init()` emits `environment:created`, `environment:configuring`, and `environment:ready`. `run()` emits `environment:beforeRun`. Registry freeze is configured with **`freezeOn`**: `"environment:ready"` | `"environment:beforeRun"` | `"manual"` (default in demo: `"environment:beforeRun"`).

**Tests:**

```sh
npm run test:browser:install   # once per machine
npm run test:browser           # Vitest browser project (Chromium); separate from test:unit
```

CI runs the `browser` job in `.github/workflows/ci-pipeline.yml` (not part of `npm run check`).

Build order: `tsc -b tsconfig.build.json` (types → core → … → cli).

### Harness authoring surface

Reusable harness helpers are exported from `@ecp/core`: `defineHarness`, `runModelRepairLoop`, `buildSystemPrompt`, `summarizeEnvironmentDescriptor`, `formatStructuredRepairForModel`, `buildAssistantSafeReply`, etc. Shared task input Zod schemas live in `@ecp/types` (`HARNESS_TASK_IDS`, `harnessWorkflowAssistantInputSchema`, …).

| Harness | Package | Id | Model surface | Eval profile |
| ------- | ------- | -- | ------------- | ------------ |
| Browser Nano | `@ecp/harnesses-browser-nano` | `@ecp/harness-browser-nano` | EQL | `ollama-gemma-1b` (`gemma3:1b`) — demo + `npm run eval:matrix` |
| Browser Coding | `@ecp/harnesses-browser-coding` | `@ecp/harness-browser-coding` | TypeScript (Fluent + typed intent/reply) | `ollama-qwen-coder-1.5b` (`qwen2.5-coder:1.5b`) — `npm run eval:matrix:coding` only |

`compileHarnessArtifactSource` in `@ecp/core/compile` evaluates intent/reply TS modules. Workflow create/patch use `compileWorkflowSource`. The **`workflow-assistant`** task is the unified assistant (ECP FAQ, identity, environment help, run Q&A). Optional `identity: true` on prompt fixtures prepends `ECP_ASSISTANT_IDENTITY_PRIMER`.

### Harness eval integrity

- Do not delete, skip, or weaken **valid** failing matrix/smoke eval tests to green CI.
- Do not fail-open quality gates (`@ecp/ollama.evaluate` judge, schema validation) on errors.
- Triage harness prompts vs model vs fixture before changing assertions. Harness prompts: `packages/core/fixtures/harness-prompts/`; eval inputs: `packages/evals/fixtures/cases/`.
