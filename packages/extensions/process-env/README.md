# @executioncontextprotocol/process-env

Resolves `env("KEY")` / `{ "$env": "KEY" }` environment bindings from `process.env`.

```ts
import "@executioncontextprotocol/process-env"
import { environment, extension, env } from "@executioncontextprotocol/node"

const envBuilder = (await environment("demo")).withExtensions([
  extension("@executioncontextprotocol/process-env").with({}),
])
```
