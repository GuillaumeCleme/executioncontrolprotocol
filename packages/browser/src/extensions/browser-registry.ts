import {
  defineExtension,
  hook,
  globalRegistry,
  boolean,
  array,
  string,
  matchesAnyNamespace,
  RegistryRegistrationDeniedError,
  type EnvironmentLifecycleHost,
} from "@ecp/core"
import type { ExtensionDefinition, LifecycleContext, PolicyDefinition, RuntimeDefinition } from "@ecp/core"

const EXT_ID = "@ecp/browser-registry"

type RegistryApi = {
  registerExtension(def: ExtensionDefinition): void
  registerPolicy(def: PolicyDefinition): void
  registerRuntime(def: RuntimeDefinition): void
  freeze(reason?: string): void
  isFrozen(): boolean
}

let activeHost: EnvironmentLifecycleHost | undefined
let globalApi: RegistryApi | undefined

function guardForConfig(
  cfg: Record<string, unknown>
): (kind: "runtime" | "extension" | "policy", id: string) => void {
  const allowed = (cfg.allowedNamespaces as string[] | undefined) ?? ["@ecp/demo", "@customer/*"]
  const denied = (cfg.deniedNamespaces as string[] | undefined) ?? []
  return (_kind, id) => {
    if (matchesAnyNamespace(id, denied)) {
      throw new RegistryRegistrationDeniedError(id)
    }
    if (!matchesAnyNamespace(id, allowed)) {
      throw new RegistryRegistrationDeniedError(id, `Namespace not allowed: ${id}`)
    }
  }
}

function attachBrowserRegistry(ctx: LifecycleContext): void {
  const host = ctx.environment
  if (!host) return
  activeHost = host
  const cfg = (ctx as LifecycleContext & { extensionConfig?: Record<string, unknown> })
    .extensionConfig ?? {}
  const registry = host.getRegistry()
  const allowReg = cfg.allowRuntimeRegistration !== false

  if (cfg.frozen === true) {
    registry.freeze("frozen:true")
  }

  registry.setRegistrationGuard(guardForConfig(cfg))

  if (cfg.exposeGlobal === true && typeof globalThis !== "undefined") {
    const globalName = (cfg.globalName as string | undefined) ?? "ECP"
    const api: RegistryApi = {
      registerExtension(def) {
        if (!allowReg) throw new Error("Runtime registration disabled")
        registry.registerExtension(def)
        if (cfg.autoBindRegisteredExtensions) {
          host.addExtensionBinding?.(def.id, {})
        }
      },
      registerPolicy(def) {
        if (!allowReg) throw new Error("Runtime registration disabled")
        registry.registerPolicy(def)
      },
      registerRuntime(def) {
        if (!allowReg) throw new Error("Runtime registration disabled")
        registry.registerRuntime(def)
      },
      freeze: (r) => registry.freeze(r),
      isFrozen: () => registry.isFrozen(),
    }
    globalApi = api
    ;(globalThis as Record<string, unknown>)[globalName] = api
  }
}

function maybeFreezeOnReady(ctx: LifecycleContext): void {
  const cfg = (ctx as LifecycleContext & { extensionConfig?: Record<string, unknown> })
    .extensionConfig ?? {}
  const registry = ctx.environment?.getRegistry()
  if (!registry) return
  if (cfg.frozen === true || cfg.freezeOnReady === true) {
    registry.freeze("freezeOnReady")
  }
}

function maybeFreezeOnFirstRun(ctx: LifecycleContext): void {
  const cfg = (ctx as LifecycleContext & { extensionConfig?: Record<string, unknown> })
    .extensionConfig ?? {}
  const registry = ctx.environment?.getRegistry()
  if (!registry) return
  if (cfg.freezeOnFirstRun === true) {
    registry.freeze("freezeOnFirstRun")
  }
}

function detachBrowserRegistry(ctx: LifecycleContext): void {
  const cfg = (ctx as LifecycleContext & { extensionConfig?: Record<string, unknown> })
    .extensionConfig ?? {}
  if (cfg.exposeGlobal === true && typeof globalThis !== "undefined") {
    const globalName = (cfg.globalName as string | undefined) ?? "ECP"
    delete (globalThis as Record<string, unknown>)[globalName]
  }
  ctx.environment?.getRegistry().setRegistrationGuard(undefined)
  activeHost = undefined
  globalApi = undefined
}

/** Expose browser global registry API when configured. */
export function exposeBrowserRegistry(): RegistryApi | undefined {
  return globalApi
}

/** Hook-only dynamic registry extension for browser. @category Extensions */
export const browserRegistryExtension = defineExtension("@ecp", "browser-registry")
  .withConfig({
    frozen: boolean().default(false),
    freezeOnReady: boolean().default(false),
    freezeOnFirstRun: boolean().default(true),
    allowRuntimeRegistration: boolean().default(true),
    autoBindRegisteredExtensions: boolean().default(false),
    exposeGlobal: boolean().default(false),
    globalName: string().default("ECP"),
    allowedNamespaces: array(string()).default(["@ecp/demo", "@customer/*"]),
    deniedNamespaces: array(string()).default([]),
  })
  .withHooks([
    hook("environment:configuring", attachBrowserRegistry),
    hook("environment:ready", maybeFreezeOnReady),
    hook("environment:beforeRun", maybeFreezeOnFirstRun),
    hook("environment:shutdown", detachBrowserRegistry),
  ])
  .build()

/** Register `@ecp/browser-registry`. */
export function registerBrowserRegistryExtension(registry = globalRegistry): void {
  if (!registry.getExtension(EXT_ID)) {
    registry.registerExtension(browserRegistryExtension)
  }
}

/** Active environment host when registry extension is attached. */
export function getActiveBrowserEnvironmentHost(): EnvironmentLifecycleHost | undefined {
  return activeHost
}
