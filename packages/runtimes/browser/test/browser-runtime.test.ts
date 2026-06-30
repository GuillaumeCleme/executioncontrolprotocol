import { describe, expect, it, vi } from "vitest"
import { workflow, step, registerTestExtension } from "@executioncontrolprotocol/core"
import { createBrowserTestEnvironment } from "./helpers.js"
import { registerRuntimeConformanceTests } from "../../../core/test/runtime-conformance.js"

registerRuntimeConformanceTests("@executioncontrolprotocol/browser", () => createBrowserTestEnvironment("browser-conformance"))

describe("@executioncontrolprotocol/browser runtime", () => {
  it("runs echo workflow", async () => {
    await registerTestExtension()
    const env = await createBrowserTestEnvironment("browser-test")
    env.addExtensionBinding("@executioncontrolprotocol/test", {})
    const manifest = workflow("Browser Echo")
      .run([step("@executioncontrolprotocol/test.echo", "Echo").with({ value: "hello browser" }).as("echo")])
      .toManifest()
    const ecp = await env.init()
    const result = await ecp.run(manifest)
    expect(result.run.status).toBe("completed")
    expect(result.state.echo).toEqual({ echo: "hello browser" })
  })

  it("runs chrome-ai.generate workflow step with vanilla prompt (no harness)", async () => {
    const originalLanguageModel = (globalThis as { LanguageModel?: unknown }).LanguageModel
    const promptMock = vi.fn().mockResolvedValue("short summary")
    ;(globalThis as { LanguageModel?: unknown }).LanguageModel = {
      availability: vi.fn().mockResolvedValue("available"),
      create: vi.fn().mockResolvedValue({ prompt: promptMock }),
    }

    try {
      await registerTestExtension()
      const env = await createBrowserTestEnvironment("browser-chrome-generate")
      env.addExtensionBinding("@executioncontrolprotocol/test", {})
      const manifest = workflow("Chrome Summarize")
        .run([
          step("@executioncontrolprotocol/chrome-ai.generate", "Summarize")
            .with({ prompt: "Summarize: hello" })
            .as("summary"),
        ])
        .toManifest()
      const ecp = await env.init()
      const result = await ecp.run(manifest)
      expect(result.run.status).toBe("completed")
      expect(promptMock).toHaveBeenCalledWith("Summarize: hello")
      expect(promptMock.mock.calls[0]?.[0]).not.toMatch(/EQL/i)
      expect(result.state.summary).toEqual({ text: "short summary" })
    } finally {
      if (originalLanguageModel === undefined) {
        delete (globalThis as { LanguageModel?: unknown }).LanguageModel
      } else {
        ;(globalThis as { LanguageModel?: unknown }).LanguageModel = originalLanguageModel
      }
    }
  })
})
