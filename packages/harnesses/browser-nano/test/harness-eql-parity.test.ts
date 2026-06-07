import { describe, expect, it, beforeAll } from "vitest"
import {
  catalogExtension,
  capabilityFor,
  defineExtension,
  environment,
  extension,
  harness,
  registerCoreFormats,
} from "@ecp/core"
import { registerTestExtension } from "../../../core/src/testing/test-extension.js"
import {
  BROWSER_NANO_HARNESS_CAPABILITY,
  HARNESS_BROWSER_NANO_DEMO_BINDING,
  HARNESS_NANO_BINDING,
  registerBrowserNanoHarnesses,
  resetBrowserNanoHarnessRegistrationForTests,
} from "@ecp/harnesses-browser-nano"
import { registerFormatEqlExtension } from "@ecp/format-eql"
import { registerNodeRuntime, runtime, NODE_RUNTIME_ID } from "@ecp/node"
import {
  ECP_HARNESS_REPLY_SCHEMA,
  modelGenerateInputSchema,
  modelGenerateOutputSchema,
} from "@ecp/types"

const eqlAssistantExtension = defineExtension("@ecp", "eql-assistant-gen")
  .withConfig({})
  .withCapabilities([
    capabilityFor("@ecp/eql-assistant-gen", "generate")
      .withInput(modelGenerateInputSchema)
      .withOutput(modelGenerateOutputSchema)
      .withHandler(async () => ({
        text: 'REPLY\n  ANSWER "I build and patch ECP workflows, answer ECP questions, and explain capabilities registered in this environment."',
      })),
  ])
  .build()

describe("browser nano harness EQL parity (eval binding = demo binding)", () => {
  beforeAll(async () => {
    await registerCoreFormats()
    await registerFormatEqlExtension()
    await registerNodeRuntime()
    await registerTestExtension()
    catalogExtension(eqlAssistantExtension)
    resetBrowserNanoHarnessRegistrationForTests()
    registerBrowserNanoHarnesses()
  })

  it("HARNESS_BROWSER_NANO_DEMO_BINDING is the same object as HARNESS_NANO_BINDING", () => {
    expect(HARNESS_BROWSER_NANO_DEMO_BINDING).toBe(HARNESS_NANO_BINDING)
  })

  it("decodes EQL assistant output with the demo binding", async () => {
    const env = environment("workflow-assistant-eql-parity-test")
      .withRuntime(runtime(NODE_RUNTIME_ID))
      .withExtensions([
        extension("@ecp/format-eql").with({}),
        extension("@ecp/test").with({}),
        extension("@ecp/eql-assistant-gen").with({}),
      ])
      .withHarnesses([
        harness("@ecp/harness-browser-nano")
          .uses("@ecp/eql-assistant-gen.generate")
          .with({ ...HARNESS_BROWSER_NANO_DEMO_BINDING }),
      ])

    const ecp = await env.init()
    try {
      const result = await ecp
        .invoke(BROWSER_NANO_HARNESS_CAPABILITY)
        .with({
          task: "workflow-assistant",
          message: "What can you do?",
        })
        .process()

      expect(result.success).toBe(true)
      const output = result.result as { artifact: { schema: string; answer: string } }
      expect(output.artifact.schema).toBe(ECP_HARNESS_REPLY_SCHEMA)
      expect(output.artifact.answer).toContain("workflows")
    } finally {
      await ecp.terminate()
    }
  })
})
