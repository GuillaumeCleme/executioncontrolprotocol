import { describe, expect, it } from "vitest"
import { extension } from "../../src/bindings/extension.js"
import { harness } from "../../src/bindings/harness.js"
import { environment } from "../../src/environment/environment.js"
import { runtime } from "../../src/bindings/runtime.js"
import { registerNodeRuntime, NODE_RUNTIME_ID } from "@ecp/node"
import { registerTestExtension } from "../../src/testing/test-extension.js"
import { registerDemoExtension } from "@ecp/demo"
import { registerFormatToonExtension } from "@ecp/format-toon"
import { registerCoreFormats } from "../../src/formats/register-core-formats.js"
import { registerStandardHarnesses } from "../../src/harness/register-standard-harnesses.js"
import { harnessCapabilityId } from "@ecp/types"

describe("workflow-authoring harness", () => {
  it("creates a workflow via demo provider", async () => {
    await registerCoreFormats()
    registerStandardHarnesses()
    await registerNodeRuntime()
    await registerTestExtension()
    await registerDemoExtension()
    await registerFormatToonExtension()

    const env = environment("harness-authoring")
      .withRuntime(runtime(NODE_RUNTIME_ID))
      .withExtensions([
        extension("@ecp/format-toon").with({}),
        extension("@ecp/test").with({}),
        extension("@ecp/demo").with({}),
      ])
      .withHarnesses([
        harness("@ecp/workflow-authoring")
          .uses("@ecp/demo.generate")
          .with({
            output: { schema: "@ecp.workflow", format: "@ecp/format-toon", validate: true },
          }),
      ])

    const ecp = await env.init()
    const result = await ecp
      .invoke(harnessCapabilityId("@ecp/workflow-authoring"))
      .with({ request: "Create an echo workflow" })
      .process()

    expect(result.success).toBe(true)
    const artifact = (result.result as { artifact: { workflow?: { id: string } } }).artifact
    expect(artifact.workflow?.id).toBe("demo-generated")
    await ecp.terminate()
  })
})
