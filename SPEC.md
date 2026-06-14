# Spec: Execution Control Protocol (ECP) — v1 (current)

This repository currently implements ECP as a **TypeScript-first workflow authoring
and execution protocol**.

**Source of truth:** [`ecp-overhaul.md`](ecp-overhaul.md) (implementation spec)  
**Monorepo guide:** [`AGENTS.md`](AGENTS.md)  
**Types:** [`packages/types`](packages/types) (`@executioncontextprotocol/types`)

> **Rule 1:** Workflows are portable execution graphs. Environments execute workflows.

------------------------------------------------------------------------

## Relationship to MCP

- **MCP** standardizes tool discovery + invocation.
- **ECP** standardizes how workflows run in governed environments that bind tools,
  models, policies, and runtimes together.

ECP does not redefine tool calling; it **hosts** and **governs** it via runtimes,
extensions, and policies.

------------------------------------------------------------------------

## Core object model (v1)

ECP v1 separates **definitions** from **bindings**, and **environments** from
**workflows**:

- **Definitions**: runtimes, extensions, policies, capabilities, hooks
- **Bindings**: configured instances of definitions inside an environment
- **Workflow**: portable execution graph (`@ecp.workflow`, version `"1.0"`)
- **Environment**: configured container that executes workflows (`@ecp.environment`, version `"1.0"`)
- **Run**: execution of a workflow inside an environment (`@ecp.run.*`)

In the fluent API:

- **Definition**: `defineExtension(...)`, `defineRuntime(...)`, `definePolicy(...)`
- **Binding**: `extension("@executioncontextprotocol/x").with({ ... })`, `runtime(...)`, `policy(...)`
- **Invocation**: `step("@executioncontextprotocol/x.do").with(input).as("key")`

------------------------------------------------------------------------

## Workflow manifests

A workflow manifest is the canonical serialized artifact.

- **Schema**: `@ecp.workflow`
- **Version**: `"1.0"`
- **Content**: steps (including `parallel` / `branch` / `loop`) and optional flow conditions

Workflows do **not** contain:

- runtime configuration
- extension configuration
- policy configuration
- secrets
- host wiring

Workflows are authored in TypeScript via `@executioncontextprotocol/core` but compile to JSON for
portability and deterministic review.

------------------------------------------------------------------------

## Environments (bindings + governance)

An environment binds the non-portable parts:

- **runtime**: execution engine + lifecycle emission
- **extensions**: capabilities and lifecycle hooks
- **policies**: governance (`policy:pre` / `policy:post` / `policy:finally`)

Environments are responsible for:

- capability registration + resolution
- validation (`environment.validate(workflow)`)
- discovery (`environment.describe()` / `environment.search()`)
- execution (`environment.run(workflow)`)

Operational APIs live on `Ecp` after `await env.init()`.

------------------------------------------------------------------------

## Policies

Policies are **first-class** and govern execution:

- `policy:pre`: allow/deny/pause/modify before step execution
- `policy:post`: validate outputs + staged mutations
- `policy:finally`: cleanup, usage reporting, audit finalization

This repository includes `@executioncontextprotocol/policies` for standard budget/approval/state-control
policies.

------------------------------------------------------------------------

## Extensions

Extensions are the primary way to add capabilities and hooks.

Key rules:

- extensions depend on `@executioncontextprotocol/types` + `@executioncontextprotocol/core` only
- extensions must not import host runtimes (`@executioncontextprotocol/node`, `@executioncontextprotocol/browser`, CLI, MCP)
- first-party extensions under `packages/extensions/*` follow the same rules as
  third-party extensions (“dogfooding”)

------------------------------------------------------------------------

## Runtimes

Runtimes are host-specific adapters that wrap core:

- `@executioncontextprotocol/node`: Node runtime host (file I/O via `@executioncontextprotocol/core/loaders`, compile via `@executioncontextprotocol/core/compile`)
- `@executioncontextprotocol/browser`: Browser runtime host (registry/session config; not the demo UI)
- `@executioncontextprotocol/runtime-temporal`: Temporal adapter stub

Core remains runtime-agnostic; host code lives on subpaths or host packages.

------------------------------------------------------------------------

## Harnesses vs evals

- **Harnesses** define how we invoke models/providers to author, repair, validate,
  and assist with ECP artifacts. Harnesses do not own fixture sets.
- **Evals** contain fixture-driven tests for harness behavior across provider
  profiles (e.g. pinned Ollama model, Chrome Nano).

------------------------------------------------------------------------

## CLI and MCP adapter

- **CLI** (`@executioncontextprotocol/cli`): compile, validate, describe, search, run, serve MCP.
- **MCP adapter** (`@executioncontextprotocol/mcp`): exposes environment APIs as MCP tools/resources/prompts
  for agent integration.

------------------------------------------------------------------------

## Legacy spec note

Earlier iterations used **Context YAML** manifests and “plugins” terminology. That
legacy implementation and documentation is archived under
[`archive/legacy-v0.5/`](archive/legacy-v0.5/).
