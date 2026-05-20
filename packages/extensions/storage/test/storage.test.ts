import { describe, expect, it, beforeEach } from "vitest"
import { registerStorageExtension, storageExtension } from "../src/index.js"
import { globalRegistry } from "@ecp/core"

describe("@ecp/storage", () => {
  beforeEach(() => {
    registerStorageExtension()
  })

  it("read/write round-trip", async () => {
    const ext = globalRegistry.getExtension("@ecp/storage")
    expect(ext).toBe(storageExtension)
    const write = ext?.capabilities.find((c) => c.id === "@ecp/storage.write")
    const read = ext?.capabilities.find((c) => c.id === "@ecp/storage.read")
    const ctx = { extensionConfig: {}, usage: { increment: () => undefined } }
    await write?.handler({ key: "a", value: { x: 1 } }, ctx as never)
    const out = await read?.handler({ key: "a" }, ctx as never)
    expect((out as { value: { x: number } }).value).toEqual({ x: 1 })
  })
})
