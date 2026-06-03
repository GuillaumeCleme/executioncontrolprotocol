import { describe, expect, it } from "vitest"
import { isEnvironmentQuestion } from "../../src/harness/authoring/environment-question.js"
import { buildAssistantSafeReply } from "../../src/harness/authoring/safe-reply.js"

describe("isEnvironmentQuestion", () => {
  it("detects capability and identity questions", () => {
    expect(isEnvironmentQuestion("What can you do?")).toBe(true)
    expect(isEnvironmentQuestion("What extensions are available?")).toBe(true)
    expect(isEnvironmentQuestion("List supported capabilities")).toBe(true)
  })

  it("returns false for workflow requests", () => {
    expect(isEnvironmentQuestion("Create a new echo workflow")).toBe(false)
  })
})

describe("buildAssistantSafeReply", () => {
  it("returns a valid harness reply document", () => {
    const reply = buildAssistantSafeReply()
    expect(reply.schema).toBe("@ecp.harness.reply")
    expect(reply.answer.length).toBeGreaterThan(10)
  })
})
