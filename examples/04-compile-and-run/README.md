# Compile and run (dual mode)

## TypeScript fluent API (in process)

```ts
import { workflow, step, environment, extension } from "@ecp/core"
import { registerTestExtension } from "@ecp/core"

registerTestExtension()
const manifest = workflow("Demo").run([...]).toManifest()
const env = environment("dev").withExtensions([...])
await env.run(manifest)
```

## Compile to JSON

```bash
ecp compile ../01-echo/workflow.ts -o dist/workflow.json
ecp compile ../01-echo/workflow.js -o dist/workflow-js.json
```

## Validate and run JSON

```bash
ecp validate dist/workflow.json --env ../01-echo/environment.ts
ecp run dist/workflow.json --env ../01-echo/environment.ts
```

## MCP

```bash
ecp mcp serve --env ../01-echo/environment.ts --transport stdio
```
