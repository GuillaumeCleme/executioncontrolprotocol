# @ecp/core

Runtime-agnostic ECP core: fluent workflow API, environment builder, registry, in-memory executor, encode/decode/patch/invoke, and Fluent rendering.

**This package has no Node or browser I/O on its main entry.** Host-specific compile and file loading live on subpaths (see below).

## Main entry (`@ecp/core`)

Use for:

- Building environments: `environment()`, `extension()`, `runtime()`, `policy()`
- Operational APIs on **`Ecp`** after `await env.init()`: `run`, `encode`, `decode`, `patch`, `validate`, `describe`, `search`, `invoke`, `terminate`
- Workflow authoring: `workflow()`, `step()`, `parallel()`, etc.
- Fluent output: `ecp.encode(manifest).as("fluent")` (no `@ecp/format-fluent` extension)

Do **not** import Node built-ins from the main barrel. Bundlers (Vite, etc.) should resolve only `@ecp/core` for browser apps.

## Host subpaths

| Subpath | Host | Purpose |
| ------- | ---- | ------- |
| `@ecp/core/node` | Node | Re-exports `@ecp/core/loaders` + `@ecp/core/compile` |
| `@ecp/core/compile` | Node | Native esbuild compile, temp-file module eval |
| `@ecp/core/loaders` | Node | File I/O for CLI and Node apps |
| `@ecp/core/browser` | Browser | Authoring subset: builders, validate, Fluent encode, **browser-safe** `compileWorkflowSource` (esbuild-wasm + `globalThis.__ecpWorkflowShim`) |

CLI and `@ecp/node` import `@ecp/core/compile` and `@ecp/core/loaders` directly—not the main barrel.

## Environment vs Ecp

| `Environment` (builder) | `Ecp` (after `init()`) |
| ----------------------- | ---------------------- |
| `withRuntime`, `withExtensions`, `withPolicies` | `run`, `encode`, `decode`, `patch`, `validate`, `invoke` |
| `init()` | `describe`, `search`, `terminate` |

## Related packages

- **`@ecp/node`** — Node runtime, process env, secrets, re-exports Node compile
- **`@ecp/browser`** — Browser runtime, registry, session config (not the demo app)
- **`@ecp/types`** — Protocol types and JSON Schema outputs

See [AGENTS.md](../../AGENTS.md) for monorepo commands and extension rules.
