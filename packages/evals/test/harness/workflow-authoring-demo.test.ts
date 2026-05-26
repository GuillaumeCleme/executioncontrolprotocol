import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { environment, extension, harness, runtime, registerCoreFormats, registerTestExtension } from "@ecp/core"
import { registerNodeRuntime, NODE_RUNTIME_ID } from "@ecp/node"
import { registerDemoExtension } from "@ecp/demo"
import { registerFormatToonExtension } from "@ecp/format-toon"
import type { HarnessInvokeResult, WorkflowManifest } from "@ecp/types"
import {
  EVALS_WORKFLOW_AUTHORING_CAPABILITY,
  registerEvalHarnesses,
} from "@ecp/evals"
import { assertHarnessInvokeSuccess } from "./assert-harness-result.js"

const fixtureDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../fixtures")

async function createEvalAuthoringDemoEnv() {
  await registerCoreFormats()
  registerEvalHarnesses()
  await registerNodeRuntime()
  await registerTestExtension()
  await registerDemoExtension()
  await registerFormatToonExtension()

  return environment("evals-harness-authoring-demo")
    .withRuntime(runtime(NODE_RUNTIME_ID))
    .withExtensions([
      extension("@ecp/format-toon").with({}),
      extension("@ecp/test").with({}),
      extension("@ecp/demo").with({}),
    ])
    .withHarnesses([
      harness("@ecp/evals-workflow-authoring")
        .uses("@ecp/demo.generate")
        .with({
          output: { schema: "@ecp.workflow", format: "@ecp/format-toon", validate: true },
        }),
    ])
}

describe("evals-workflow-authoring harness (demo provider)", () => {
  it("creates a workflow via demo provider", async () => {
    const env = await createEvalAuthoringDemoEnv()
    const ecp = await env.init()
    const result = await ecp
      .invoke(EVALS_WORKFLOW_AUTHORING_CAPABILITY)
      .with({ request: "Create an echo workflow" })
      .process()

    assertHarnessInvokeSuccess(result)
    const artifact = (result.result as HarnessInvokeResult<WorkflowManifest>).artifact
    expect(artifact.workflow?.id).toBe("demo-generated")
    await ecp.terminate()
  })

  it("patches a workflow via demo provider", async () => {
    const env = await createEvalAuthoringDemoEnv()
    const ecp = await env.init()
    const manifest = JSON.parse(
      readFileSync(path.join(fixtureDir, "echo-workflow.json"), "utf8")
    ) as WorkflowManifest

    const result = await ecp
      .invoke(EVALS_WORKFLOW_AUTHORING_CAPABILITY)
      .with({ request: "Patch the echo step input value.", manifest })
      .process()

    assertHarnessInvokeSuccess(result)
    const harnessOutput = result.result as HarnessInvokeResult<WorkflowManifest>
    expect(harnessOutput.artifact.schema).toBe("@ecp.workflow")
    const echoStep = harnessOutput.artifact.steps?.find((s) => s.id === "echo")
    expect(echoStep?.input).toEqual({ value: "patched" })
    expect(harnessOutput.trace.decodeSucceeded).toBe(true)
    await ecp.terminate()
  })
})
