# @executioncontextprotocol/node

**Node.js runtime host** for ECP: Node executor, process-env and secrets extensions, and re-exports of Node-only compile from `@executioncontextprotocol/core`.

## vs `@executioncontextprotocol/core`

| Package | Role |
| ------- | ---- |
| `@executioncontextprotocol/core` | Runtime-agnostic API and in-memory engine |
| `@executioncontextprotocol/node` | Node host: `@executioncontextprotocol/node` runtime, `process.env`, secrets, `compileWorkflowSource` via `@executioncontextprotocol/core/compile` |

Node apps and the CLI compose environments with `@executioncontextprotocol/node`; they import compile/loaders from `@executioncontextprotocol/core/compile` or `@executioncontextprotocol/core/node`, not from the core main barrel.

## Typical usage

```ts
import { environment, extension, workflow, step } from "@executioncontextprotocol/node"
import "@executioncontextprotocol/demo"

const env = (await environment("dev")).withExtensions([
  extension("@executioncontextprotocol/demo").with({}),
])
const ecp = await env.init()
await ecp.run(
  workflow("Echo")
    .run([step("@executioncontextprotocol/demo.echo", "Echo").with({ value: "hi" }).as("out")])
    .toManifest()
)
```

## Related

- [`@executioncontextprotocol/core`](../core/README.md) — core API and subpaths
- [`@executioncontextprotocol/cli`](../cli/) — `ecp run`, `ecp compile`, etc. (uses `@executioncontextprotocol/core/loaders` + `@executioncontextprotocol/core/compile`)

See [AGENTS.md](../../AGENTS.md) for CLI commands and extension catalog rules.
