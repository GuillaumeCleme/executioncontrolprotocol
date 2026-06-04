import { describe, expect, it, beforeAll } from "vitest"
import {
  catalogExtension,
  capabilityFor,
  defineExtension,
  environment,
  extension,
  harness,
  HARNESS_ASSISTANT_SCOPE_REDIRECT_PHRASE,
  registerCoreFormats,
} from "@ecp/core"
import { registerTestExtension } from "../../../core/src/testing/test-extension.js"
import {
  BROWSER_HARNESS_CAPABILITY,
  registerBrowserHarnesses,
  resetHarnessRegistrationForTests,
} from "@ecp/harnesses-browser"
import { registerFormatEqlExtension } from "@ecp/format-eql"
import { registerNodeRuntime, runtime, NODE_RUNTIME_ID } from "@ecp/node"
import {
  ECP_HARNESS_REPLY_SCHEMA,
  modelGenerateInputSchema,
  modelGenerateOutputSchema,
} from "@ecp/types"

const invalidGenExtension = defineExtension("@ecp", "invalid-gen")
  .withConfig({})
  .withCapabilities([
    capabilityFor("@ecp/invalid-gen", "generate")
      .withInput(modelGenerateInputSchema)
      .withOutput(modelGenerateOutputSchema)
      .withHandler(async () => ({ text: "NOT VALID EQL AT ALL" })),
  ])
  .build()

describe("workflow-assistant safe reply fallback", () => {
  beforeAll(async () => {
    await registerCoreFormats()
    await registerFormatEqlExtension()
    await registerNodeRuntime()
    await registerTestExtension()
    catalogExtension(invalidGenExtension)
    resetHarnessRegistrationForTests()
    registerBrowserHarnesses()
  })

  it("returns safe reply when decode/repair fails", async () => {
    const env = environment("workflow-assistant-safe-reply-test")
      .withRuntime(runtime(NODE_RUNTIME_ID))
      .withExtensions([
        extension("@ecp/format-eql").with({}),
        extension("@ecp/test").with({}),
        extension("@ecp/invalid-gen").with({}),
      ])
      .withHarnesses([
        harness("@ecp/harness-browser")
          .uses("@ecp/invalid-gen.generate")
          .with({ repair: { maxAttempts: 0 } }),
      ])

    const ecp = await env.init()
    try {
      const result = await ecp
        .invoke(BROWSER_HARNESS_CAPABILITY)
        .with({
          task: "workflow-assistant",
          message: "Tell me a joke.",
        })
        .process()

      expect(result.success).toBe(true)
      const output = result.result as { artifact: { schema: string; answer: string } }
      expect(output.artifact.schema).toBe(ECP_HARNESS_REPLY_SCHEMA)
      expect(output.artifact.answer).toContain(HARNESS_ASSISTANT_SCOPE_REDIRECT_PHRASE)
    } finally {
      await ecp.terminate()
    }
  })
})
