# @ecp/types

Protocol types, constants, and generated JSON Schema (`npm run generate:schema` from repo root).

Shared by all `@ecp/*` packages. No runtime or host dependencies.

`@ecp/types` is the primary dependency for anyone who wants to **build on ECP**:
extensions, runtimes, harnesses, CLIs, UIs, and external tooling should import
the canonical types from here instead of re-defining protocol shapes.

Guidelines:

- Prefer `@ecp/types` schema constants/unions (e.g. `@ecp.workflow`, `@ecp.patch`)
  over repeating string literals.
- Keep this package dependency-light so it can be installed broadly.
- Treat types as the “public contract” for third-party extension authors.
