# AGENTS.md

## ECP Fluent API monorepo (`@ecp/*`)

| Path | Purpose |
| ---- | ------- |
| `packages/types/` | Protocol types (`@ecp/types`) |
| `packages/core/` | Fluent API, environment, local runtime (`@ecp/core`) |
| `packages/core/src/browser.ts` | Browser authoring: compile + validate + builders |
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
npm run check    # build + lint + test:unit + test:integration + test:e2e
npm run test:unit
```

### CLI

```sh
ecp compile examples/01-echo/workflow.ts -o /tmp/workflow.json
ecp validate /tmp/workflow.json --env examples/01-echo/environment.ts
ecp run /tmp/workflow.json --env examples/01-echo/environment.ts
ecp describe --env examples/01-echo/environment.ts
ecp search "echo" --env examples/01-echo/environment.ts
ecp mcp serve --env examples/01-echo/environment.ts --transport stdio
```

### Fluent API quickstart

```ts
import { workflow, step, ref, environment, extension, runtime } from "@ecp/core"
import { registerTestExtension } from "@ecp/core"
import { LOCAL_RUNTIME_ID } from "@ecp/core"

registerTestExtension()
const manifest = workflow("My flow")
  .run([step("@ecp/test.echo", "Echo").with({ value: "hi" }).as("echo")])
  .toManifest()

const env = environment("dev")
  .withRuntime(runtime(LOCAL_RUNTIME_ID))
  .withExtensions([extension("@ecp/test").with({})])

await env.run(manifest)
```

### Browser

```ts
import { compileAndValidateWorkflowSource, workflow, step } from "@ecp/core/browser"
```

Build order: `tsc -b tsconfig.build.json` (types → core → … → cli).
