import type { CapabilityId, NamespacedId } from "@ecp/types"
import type {
  CapabilityDefinition,
  ExtensionDefinition,
  PolicyDefinition,
  RuntimeDefinition,
} from "../definitions/types.js"

/**
 * Global definition registry.
 * @category Runtime
 */
export class Registry {
  private runtimes = new Map<string, RuntimeDefinition>()
  private extensions = new Map<string, ExtensionDefinition>()
  private policies = new Map<string, PolicyDefinition>()
  private capabilities = new Map<string, CapabilityDefinition>()

  /** Register a runtime definition. */
  registerRuntime(def: RuntimeDefinition): void {
    this.runtimes.set(def.id, def)
  }

  /** Register an extension and its capabilities. */
  registerExtension(def: ExtensionDefinition): void {
    this.extensions.set(def.id, def)
    for (const cap of def.capabilities) {
      this.capabilities.set(cap.id, cap)
    }
  }

  /** Register a policy definition. */
  registerPolicy(def: PolicyDefinition): void {
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
