import { createOsSecretsStore } from "@executioncontextprotocol/secrets"

/** OS keychain store for CLI secret commands. */
export function getCliSecretsStore() {
  return createOsSecretsStore()
}
