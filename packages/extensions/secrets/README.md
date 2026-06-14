# @executioncontextprotocol/secrets

OS secrets extension for ECP. Resolves `secrets("key")` / `{ "$secret": "key" }` environment bindings via the OS keychain (Windows Credential Manager, macOS Keychain, Linux where supported).

## Usage

```ts
import "@executioncontextprotocol/secrets"
import { environment, extension, secrets } from "@executioncontextprotocol/node"

const env = (await environment("demo")).withExtensions([
  extension("@executioncontextprotocol/secrets").with({}),
  extension("@executioncontextprotocol/openai").with({
    apiKey: secrets("openai/api-key"),
  }),
])
```

## CLI

Use `ecp config secrets add KEY` (interactive paste) or `ecp config secrets add KEY --value …` for non-interactive input. `get KEY`, `list`, and `remove KEY` manage stored keys.

## Tests

Unit tests use `setSecretsStore(memorySecretsStore)` to avoid touching the real keychain.
