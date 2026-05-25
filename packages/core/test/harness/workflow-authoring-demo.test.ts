import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
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
import { harnessCapabilityId, type HarnessInvokeResult, type WorkflowManifest } from "@ecp/types"

const fixtureDir = path.dirname(fileURLToPath(import.meta.url))

async function createAuthoringEnv() {
  await registerCoreFormats()
  registerStandardHarnesses()
  await registerNodeRuntime()
  await registerTestExtension()
  await registerDemoExtension()
  await registerFormatToonExtension()

  return environment("harness-authoring")
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
}

describe("workflow-authoring harness", () => {
  it("creates a workflow via demo provider", async () => {
    const env = await createAuthoringEnv()
    const ecp = await env.init()
    const result = await ecp
      .invoke(harnessCapabilityId("@ecp/workflow-authoring"))
      .with({ request: "Create an echo workflow" })
      .process()

    expect(result.success).toBe(true)
    const artifact = (result.result as HarnessInvokeResult<WorkflowManifest>).artifact
    expect(artifact.workflow?.id).toBe("demo-generated")
    await ecp.terminate()
  })

  it("patches a workflow via demo provider", async () => {
    const env = await createAuthoringEnv()
    const ecp = await env.init()
    const manifest = JSON.parse(
      readFileSync(path.join(fixtureDir, "fixtures/echo-workflow.json"), "utf8")
    ) as WorkflowManifest

    const result = await ecp
      .invoke(harnessCapabilityId("@ecp/workflow-authoring"))
      .with({ request: "Patch the echo step input value.", manifest })
      .process()

    expect(result.success).toBe(true)
    const harnessResult = result.result as HarnessInvokeResult<WorkflowManifest>
    expect(harnessResult.artifact.schema).toBe("@ecp.workflow")
    const echoStep = harnessResult.artifact.steps?.find((s) => s.id === "echo")
    expect(echoStep?.input).toEqual({ value: "patched" })
    expect(harnessResult.trace.decodeSucceeded).toBe(true)
    await ecp.terminate()
  })
})
