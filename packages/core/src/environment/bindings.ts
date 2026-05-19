import type { EnvValue, NamespacedId } from "@ecp/types"
import type { HookDefinition } from "../definitions/types.js"

/** Resolved runtime binding. */
export interface ResolvedRuntimeBinding {
  id: NamespacedId
  label?: string
  config: Record<string, unknown>
}

/** Resolved extension binding. */
export interface ResolvedExtensionBinding {
  id: NamespacedId
  label?: string
  order: number
  config: Record<string, unknown>
}

/** Resolved policy binding. */
export interface ResolvedPolicyBinding {
  id: NamespacedId
  label?: string
  order: number
  config: Record<string, unknown>
}

/** All resolved bindings for execution. */
export interface ResolvedBindings {
  runtime: ResolvedRuntimeBinding
  extensions: ResolvedExtensionBinding[]
  policies: ResolvedPolicyBinding[]
  extensionHooks: HookDefinition[]
  policyHooks: Array<{ hook: HookDefinition; config: Record<string, unknown> }>
}

/** Resolve $env in config at environment bind time. */
export function resolveEnvConfig(
  config: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(config)) {
    out[k] = resolveEnvValue(v)
  }
  return out
}

function resolveEnvValue(v: unknown): unknown {
  if (v !== null && typeof v === "object" && "$env" in v) {
    const e = v as EnvValue
    const val = process.env[e.$env]
    if (val === undefined) {
      if (e.optional) return e.fallback
      throw new Error(`Environment variable ${e.$env} is not set`)
    }
    return val
  }
  if (Array.isArray(v)) return v.map(resolveEnvValue)
  if (v !== null && typeof v === "object") {
    const o: Record<string, unknown> = {}
    for (const [k, c] of Object.entries(v)) o[k] = resolveEnvValue(c)
    return o
  }
  return v
}
