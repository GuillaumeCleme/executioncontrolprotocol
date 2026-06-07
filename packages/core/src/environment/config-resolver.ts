import type { EnvValue } from "@ecp/types"

/** Resolves `env("KEY")` values for environment bindings. @category Environment */
export interface EnvironmentConfigResolver {
  /** Resolver identifier (e.g. extension id). */
  id: string
  /** Resolve a config key name to a value, or undefined if not handled. */
  resolve(name: string): Promise<unknown> | unknown
}

/** Options when resolving a single env key. @category Environment */
export interface ResolveEnvNameOptions {
  optional?: boolean
  fallback?: unknown
}

/**
 * Walk resolver chain for a config key name.
 * @category Environment
 */
export async function resolveConfigName(
  name: string,
  resolvers: EnvironmentConfigResolver[],
  options?: ResolveEnvNameOptions
): Promise<unknown> {
  for (const resolver of resolvers) {
    const value = await resolver.resolve(name)
    if (value !== undefined) return value
  }
  if (options?.optional) return options.fallback
  throw new Error(`Environment variable ${name} is not set`)
}

/**
 * Resolve `$env` placeholders in a config object using the resolver chain.
 * @category Environment
 */
export async function resolveEnvConfigAsync(
  config: Record<string, unknown>,
  resolvers: EnvironmentConfigResolver[]
): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(config)) {
    out[k] = await resolveEnvValueAsync(v, resolvers)
  }
  return out
}

async function resolveEnvValueAsync(
  v: unknown,
  resolvers: EnvironmentConfigResolver[]
): Promise<unknown> {
  if (v !== null && typeof v === "object" && "$env" in v) {
    const e = v as EnvValue
    return resolveConfigName(e.$env, resolvers, {
      optional: e.optional,
      fallback: e.fallback,
    })
  }
  if (Array.isArray(v)) {
    return Promise.all(v.map((item) => resolveEnvValueAsync(item, resolvers)))
  }
  if (v !== null && typeof v === "object") {
    const o: Record<string, unknown> = {}
    for (const [k, c] of Object.entries(v)) {
      o[k] = await resolveEnvValueAsync(c, resolvers)
    }
    return o
  }
  return v
}

/** Copy config for manifests without resolving secrets. @category Environment */
export function cloneConfigForManifest(
  config: Record<string, unknown>
): Record<string, unknown> {
  return structuredClone(config)
}
