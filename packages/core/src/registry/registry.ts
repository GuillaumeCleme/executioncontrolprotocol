import type { CapabilityId, NamespacedId } from "@ecp/types"
import type {
  CapabilityDefinition,
  ExtensionDefinition,
  PolicyDefinition,
  RuntimeDefinition,
} from "../definitions/types.js"
import { RegistryFrozenError } from "./errors.js"

/** Guard invoked before registry registration. @category Runtime */
export type RegistryRegistrationGuard = (
  kind: "runtime" | "extension" | "policy",
  id: string
) => void

/**
 * Global definition registry.
 * @category Runtime
 */
export class Registry {
  private runtimes = new Map<string, RuntimeDefinition>()
  private extensions = new Map<string, ExtensionDefinition>()
  private policies = new Map<string, PolicyDefinition>()
  private capabilities = new Map<string, CapabilityDefinition>()
  private frozen = false
  private freezeReason?: string
  private guard?: RegistryRegistrationGuard

  /** Attach a guard checked before each registration. */
  setRegistrationGuard(guard: RegistryRegistrationGuard | undefined): void {
    this.guard = guard
  }

  /** Lock registry; further registrations throw {@link RegistryFrozenError}. */
  freeze(reason?: string): void {
    this.frozen = true
    this.freezeReason = reason
  }

  /** Whether the registry accepts new registrations. */
  isFrozen(): boolean {
    return this.frozen
  }

  /** Last freeze reason if frozen. */
  getFreezeReason(): string | undefined {
    return this.freezeReason
  }

  private assertCanRegister(kind: "runtime" | "extension" | "policy", id: string): void {
    if (this.frozen) {
      throw new RegistryFrozenError(this.freezeReason)
    }
    this.guard?.(kind, id)
  }

  /** Register a runtime definition. */
  registerRuntime(def: RuntimeDefinition): void {
    this.assertCanRegister("runtime", def.id)
    this.runtimes.set(def.id, def)
  }

  /** Register an extension and its capabilities. */
  registerExtension(def: ExtensionDefinition): void {
    this.assertCanRegister("extension", def.id)
    this.extensions.set(def.id, def)
    for (const cap of def.capabilities) {
      this.capabilities.set(cap.id, cap)
    }
  }

  /** Register a policy definition. */
  registerPolicy(def: PolicyDefinition): void {
    this.assertCanRegister("policy", def.id)
    this.policies.set(def.id, def)
  }

  getRuntime(id: string): RuntimeDefinition | undefined {
    return this.runtimes.get(id)
  }

  getExtension(id: string): ExtensionDefinition | undefined {
    return this.extensions.get(id)
  }

  getPolicy(id: string): PolicyDefinition | undefined {
    return this.policies.get(id)
  }

  getCapability(id: string): CapabilityDefinition | undefined {
    return this.capabilities.get(id)
  }

  listCapabilities(): CapabilityDefinition[] {
    return [...this.capabilities.values()]
  }

  listExtensions(): ExtensionDefinition[] {
    return [...this.extensions.values()]
  }

  listPolicies(): PolicyDefinition[] {
    return [...this.policies.values()]
  }

  resolveCapability(ref: CapabilityId | string): CapabilityDefinition | undefined {
    return this.capabilities.get(ref)
  }

  resolveNamespacedId(ref: NamespacedId | string): NamespacedId {
    return ref as NamespacedId
  }
}

/** Shared default registry. @category Runtime */
export const globalRegistry = new Registry()
