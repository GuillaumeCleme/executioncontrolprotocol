import { describe, expect, it } from "vitest"
import { useWorkspaceLayout } from "../src/hooks/useWorkspaceLayout.js"

describe("useWorkspaceLayout", () => {
  it("exports hook function", () => {
    expect(typeof useWorkspaceLayout).toBe("function")
  })
})
