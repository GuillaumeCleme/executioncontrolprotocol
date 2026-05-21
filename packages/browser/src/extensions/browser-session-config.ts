import {
  defineExtension,
  hook,
  globalRegistry,
  boolean,
  type EnvironmentConfigResolver,
  type LifecycleContext,
} from "@ecp/core"

const EXT_ID = "@ecp/browser-session-config"

const sessionValues = new Map<string, unknown>()

/** In-memory session config controller. @category Extensions */
export interface BrowserSessionConfigController {
  set(name: string, value: unknown): void
  get(name: string): unknown
  has(name: string): boolean
  delete(name: string): void
  clear(): void
}

/** Create a session config controller (tests / host apps). */
export function createBrowserSessionConfig(): BrowserSessionConfigController {
  const local = new Map<string, unknown>()
  return {
    set: (n, v) => local.set(n, v),
    get: (n) => local.get(n),
    has: (n) => local.has(n),
    delete: (n) => local.delete(n),
    clear: () => local.clear(),
  }
}

function attachSessionResolver(ctx: LifecycleContext): void {
  const host = ctx.environment
  if (!host) return
  const cfg = (ctx as LifecycleContext & { extensionConfig?: Record<string, unknown> })
    .extensionConfig ?? {}
  if (cfg.persist === true) {
    throw new Error("browser-session-config persist:true is not supported")
  }
  const allowSecrets = cfg.allowSecrets !== false

  const resolver: EnvironmentConfigResolver = {
    id: EXT_ID,
    resolve(name: string) {
      if (!allowSecrets && looksSecret(name)) return undefined
      return sessionValues.get(name)
    },
  }
  host.registerConfigResolver(resolver)
}

function clearSession(_ctx: LifecycleContext): void {
  sessionValues.clear()
}

function looksSecret(name: string): boolean {
  const u = name.toUpperCase()
  return (
    u.includes("SECRET") ||
    u.includes("TOKEN") ||
    u.includes("PASSWORD") ||
    u.includes("API_KEY")
  )
}

/** Set session value for active environments using default store. */
export function setBrowserSessionValue(name: string, value: unknown): void {
  sessionValues.set(name, value)
}

/** Browser session-only config extension. @category Extensions */
export const browserSessionConfigExtension = defineExtension("@ecp", "browser-session-config")
  .withConfig({
    allowSecrets: boolean().default(true),
    persist: boolean().default(false),
  })
  .withHooks([
    hook("environment:configuring", attachSessionResolver),
    hook("environment:shutdown", clearSession),
  ])
  .build()

/** Register `@ecp/browser-session-config`. */
export async function registerBrowserSessionConfigExtension(
  registry = globalRegistry
): Promise<void> {
  if (!registry.getExtension(EXT_ID)) {
    await registry.registerExtension(browserSessionConfigExtension)
  }
}
