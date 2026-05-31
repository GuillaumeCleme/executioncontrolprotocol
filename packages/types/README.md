# @ecp/types

Protocol types, constants, and generated JSON Schema (`npm run generate:schema` from repo root).

Shared by all `@ecp/*` packages. No runtime or host dependencies.

Extension and core packages should depend on `@ecp/types` for schema unions (`@ecp.workflow`, `@ecp.patch`, etc.) rather than duplicating string literals.
