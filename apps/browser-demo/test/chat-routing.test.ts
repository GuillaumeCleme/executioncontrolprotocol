import { describe, expect, it } from "vitest"
import { looksLikeWorkflowRequest } from "../src/lib/chat-routing.js"

describe("looksLikeWorkflowRequest", () => {
  it("detects explicit workflow creation", () => {
    expect(looksLikeWorkflowRequest("create a demo echo workflow")).toBe(true)
    expect(looksLikeWorkflowRequest("build a workflow with echo step")).toBe(true)
  })

  it("does not treat general questions as workflow requests", () => {
    expect(looksLikeWorkflowRequest("What is a workflow?")).toBe(false)
    expect(looksLikeWorkflowRequest("How does validation work?")).toBe(false)
  })
})
