# @ecp/harnesses-evals

**Private** package: Ollama/matrix eval harness definitions and eval-only helpers (JSON repair, capability hints, presentation).

- **Exports (main):** `registerEvalHarnesses()`, eval harness ids and capability ids
- **Does not export:** harness definition objects from the package entry

`@ecp/evals` depends on this package for environments and fixtures; it re-exports capability ids only, not registration.

Subpath exports (`./repair-workflow-json`, etc.) exist for unit tests in `@ecp/evals`.
