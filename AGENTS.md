# AGENTS.md

## ECP Fluent API monorepo (`@ecp/*`)

| Path | Purpose |
| ---- | ------- |
| `packages/types/` | Protocol types (`@ecp/types`) |
| `packages/core/` | Fluent API, environment, in-memory engine (`@ecp/core`) |
| `packages/node/` | Node runtime (`@ecp/node`), process-env, secrets |
| `packages/browser/` | Browser runtime (`@ecp/browser`), registry, session config |
| `packages/core/src/browser.ts` | Browser authoring subset: compile + validate + builders |
| `packages/mcp/` | MCP adapter (`@ecp/mcp`) |
| `packages/cli/` | `ecp` CLI (`@ecp/cli`) |
| `packages/policies/` | Budget, approval, state-control (`@ecp/policies`) |
| `packages/extensions/*/` | First-party extensions |
| `archive/legacy-v0.5/` | Archived v0.5 Oclif CLI and snippets |
| `ecp-overhaul.md` | Implementation spec (source of truth) |

### Commands

```sh
npm install
npm run build
npm run generate:schema   # writes packages/types/dist/schemas/*.json
npm run check    # build + generate:schema + lint + test:unit + test:integration + test:e2e
npm run test:unit
```

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
