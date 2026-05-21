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
ecp run --help
```

Local dev: `npm start -w @ecp/cli` (runs `bin/dev.js` after build).

### Fluent API quickstart

```ts
import { workflow, step, ref, environment, extension, runtime } from "@ecp/core"
import { workflow, step, environment, extension } from "@ecp/node"

const manifest = workflow("My flow")
  .run([step("@ecp/test.echo", "Echo").with({ value: "hi" }).as("echo")])
  .toManifest()

const env = environment("dev").withExtensions([extension("@ecp/test").with({})])
await env.run(manifest)
```

### Browser

```ts
import { compileAndValidateWorkflowSource, workflow, step, environment } from "@ecp/browser"
```

Build order: `tsc -b tsconfig.build.json` (types → core → … → cli).
