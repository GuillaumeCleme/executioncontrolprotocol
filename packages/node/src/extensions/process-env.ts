import {
  defineExtension,
  hook,
  globalRegistry,
  type EnvironmentConfigResolver,
} from "@ecp/core"
import { array, string } from "@ecp/core"
import type { LifecycleContext } from "@ecp/core"

const EXT_ID = "@ecp/process-env"

function keyAllowed(name: string, allowed: string[], denied: string[]): boolean {
  if (denied.includes(name)) return false
  if (allowed.includes("*")) return true
  return allowed.includes(name)
}

function attachProcessEnvResolver(ctx: LifecycleContext): void {
  const host = ctx.environment
  if (!host) return
  const cfg = (ctx as LifecycleContext & { extensionConfig?: Record<string, unknown> })
    .extensionConfig ?? {}
  const allowed = (cfg.allowedKeys as string[] | undefined) ?? ["*"]
  const denied = (cfg.deniedKeys as string[] | undefined) ?? []
  const prefix = (cfg.prefix as string | undefined) ?? ""

  const resolver: EnvironmentConfigResolver = {
    id: EXT_ID,
    resolve(name: string) {
      if (!keyAllowed(name, allowed, denied)) return undefined
      const envKey = prefix ? `${prefix}${name}` : name
      return process.env[envKey]
    },
  }
  host.registerConfigResolver(resolver)
}

/** Process environment config extension. @category Extensions */
export const processEnvExtension = defineExtension("@ecp", "process-env")
  .withConfig({
    allowedKeys: array(string()).default(["*"]),
    deniedKeys: array(string()).default([]),
    prefix: string().optional(),
  })
  .withHooks([hook("environment:configuring", attachProcessEnvResolver)])
  .build()

/** Register `@ecp/process-env`. */
export async function registerProcessEnvExtension(registry = globalRegistry): Promise<void> {
  if (!registry.getExtension(EXT_ID)) {
    await registry.registerExtension(processEnvExtension)
  }
}
