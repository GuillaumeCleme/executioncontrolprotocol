# @ecp/node

**Node.js runtime host** for ECP: Node executor, process-env and secrets extensions, and re-exports of Node-only compile from `@ecp/core`.

## vs `@ecp/core`

| Package | Role |
| ------- | ---- |
| `@ecp/core` | Runtime-agnostic API and in-memory engine |
| `@ecp/node` | Node host: `@ecp/node` runtime, `process.env`, secrets, `compileWorkflowSource` via `@ecp/core/compile` |

Node apps and the CLI compose environments with `@ecp/node`; they import compile/loaders from `@ecp/core/compile` or `@ecp/core/node`, not from the core main barrel.

## Typical usage

```ts
import { environment, extension, workflow, step } from "@ecp/node"
import "@ecp/core/testing"

const env = (await environment("dev")).withExtensions([
  extension("@ecp/test").with({}),
])
const ecp = await env.init()
await ecp.run(
  workflow("Echo")
    .run([step("@ecp/test.echo", "Echo").with({ value: "hi" }).as("out")])
    .toManifest()
)
```

## Related

- [`@ecp/core`](../core/README.md) — core API and subpaths
- [`@ecp/cli`](../cli/) — `ecp run`, `ecp compile`, etc. (uses `@ecp/core/loaders` + `@ecp/core/compile`)

See [AGENTS.md](../../AGENTS.md) for CLI commands and extension catalog rules.
