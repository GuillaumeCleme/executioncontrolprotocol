import { defineExtension, hook, globalRegistry, type EnvironmentConfigResolver } from "@ecp/core"
import { z } from "zod"
import type { LifecycleContext } from "@ecp/core"

const EXT_ID = "@ecp/secrets"

/** Secrets provider interface. @category Extensions */
export interface SecretsProvider {
  id: string
  get(name: string, options?: { namespace?: string }): Promise<string | undefined>
}

const memoryStore = new Map<string, string>()

/** In-memory secrets provider for tests. @category Extensions */
export const memorySecretsProvider: SecretsProvider = {
  id: "memory",
  async get(name, options) {
    const key = options?.namespace ? `${options.namespace}:${name}` : name
    return memoryStore.get(key)
  },
}

/** Set a value in the memory secrets provider (tests). */
export function setMemorySecret(
  name: string,
  value: string,
  namespace = "ecp"
): void {
  memoryStore.set(`${namespace}:${name}`, value)
}

let activeProvider: SecretsProvider = memorySecretsProvider

/** Replace the active secrets provider (e.g. OS/keytar). */
export function setSecretsProvider(provider: SecretsProvider): void {
  activeProvider = provider
}

function attachSecretsResolver(ctx: LifecycleContext): void {
  const host = ctx.environment
  if (!host) return
  const cfg = (ctx as LifecycleContext & { extensionConfig?: Record<string, unknown> })
    .extensionConfig ?? {}
  const allowed = (cfg.allowedKeys as string[] | undefined) ?? ["*"]
  const denied = (cfg.deniedKeys as string[] | undefined) ?? []
  const namespace = (cfg.namespace as string | undefined) ?? "ecp"

  const resolver: EnvironmentConfigResolver = {
    id: EXT_ID,
    async resolve(name: string) {
      if (denied.includes(name)) return undefined
      if (!allowed.includes("*") && !allowed.includes(name)) return undefined
      return activeProvider.get(name, { namespace })
    },
  }
  host.registerConfigResolver(resolver)
}

/** OS / configured secrets extension. @category Extensions */
export const secretsExtension = defineExtension("@ecp", "secrets")
  .withConfig({
    provider: z.string().default("memory"),
    namespace: z.string().default("ecp"),
    allowedKeys: z.array(z.string()).default(["*"]),
    deniedKeys: z.array(z.string()).default([]),
  })
  .withHooks([
    hook("environment:configuring", attachSecretsResolver),
    hook("environment:terminate", () => undefined),
  ])
  .build()

/** Register `@ecp/secrets`. */
export async function registerSecretsExtension(registry = globalRegistry): Promise<void> {
  if (!registry.getExtension(EXT_ID)) {
    await registry.registerExtension(secretsExtension)
  }
}
