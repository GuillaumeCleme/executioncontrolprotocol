import { defineExtension, globalRegistry } from "@ecp/core"

/** Stub @ecp/storage extension. @category Extensions */
export const storageExtension = defineExtension("@ecp", "storage")
  .withConfig({})
  .withCapabilities([])
  .build()

export function registerStorageExtension(): void {
  if (!globalRegistry.getExtension("@ecp/storage")) {
    globalRegistry.registerExtension(storageExtension)
  }
}
