import {
  defineExtension,
  hook,
  globalRegistry,
  array,
  string,
  type EnvironmentConfigResolver,
  type LifecycleContext,
} from "@ecp/core"

const EXT_ID = "@ecp/browser-local-config"

const DEFAULT_DENIED = [
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "SLACK_BOT_TOKEN",
  "TOKEN",
  "SECRET",
  "PASSWORD",
]

function isDeniedKey(name: string, denied: string[]): boolean {
  const u = name.toUpperCase()
  return denied.some((d) => u.includes(d.toUpperCase()))
}

function attachLocalConfigResolver(ctx: LifecycleContext): void {
  const host = ctx.environment
  if (!host) return
  const cfg = (ctx as LifecycleContext & { extensionConfig?: Record<string, unknown> })
    .extensionConfig ?? {}
  const prefix = (cfg.prefix as string | undefined) ?? "ecp:"
  const allowed = (cfg.allowedKeys as string[] | undefined) ?? []
  const denied = (cfg.deniedKeys as string[] | undefined) ?? DEFAULT_DENIED

  const resolver: EnvironmentConfigResolver = {
    id: EXT_ID,
    resolve(name: string) {
      if (isDeniedKey(name, denied)) {
        throw new Error(`browser-local-config refuses secret-like key: ${name}`)
      }
      if (!allowed.includes(name)) return undefined
      if (typeof localStorage === "undefined") return undefined
      const raw = localStorage.getItem(`${prefix}${name}`)
      if (raw === null) return undefined
      try {
        return JSON.parse(raw) as unknown
      } catch {
        return raw
      }
    },
  }
  host.registerConfigResolver(resolver)
}

/** Browser localStorage config extension (non-secret keys only). @category Extensions */
export const browserLocalConfigExtension = defineExtension("@ecp", "browser-local-config")
  .withConfig({
    prefix: string().default("ecp:"),
    allowedKeys: array(string()).default([]),
    deniedKeys: array(string()).default(DEFAULT_DENIED),
  })
  .withHooks([hook("environment:configuring", attachLocalConfigResolver)])
  .build()

/** Register `@ecp/browser-local-config`. */
export async function registerBrowserLocalConfigExtension(
  registry = globalRegistry
): Promise<void> {
  if (!registry.getExtension(EXT_ID)) {
    await registry.registerExtension(browserLocalConfigExtension)
  }
}
