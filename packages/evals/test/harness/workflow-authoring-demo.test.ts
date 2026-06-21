import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { environment, extension, harness, runtime, registerCoreFormats } from "@executioncontrolprotocol/core"
import { registerNodeRuntime, NODE_RUNTIME_ID } from "@executioncontrolprotocol/node"
import { registerDemoExtension } from "@executioncontrolprotocol/demo"
import { registerFormatEqlExtension } from "@executioncontrolprotocol/format-eql"
import { registerFormatToonExtension } from "@executioncontrolprotocol/format-toon"
import type { HarnessInvokeResult, WorkflowManifest } from "@executioncontrolprotocol/types"
import {
  HARNESS_TASKS,
  BROWSER_NANO_HARNESS_CAPABILITY,
  BROWSER_NANO_HARNESS_ID,
  registerBrowserNanoHarnesses,
} from "@executioncontrolprotocol/evals"
import { assertHarnessInvokeSuccess } from "./assert-harness-result.js"

const fixtureDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../fixtures")

async function createEvalAuthoringDemoEnv() {
  await registerCoreFormats()
  registerBrowserNanoHarnesses()
  await registerNodeRuntime()
  await registerDemoExtension()
  await registerFormatEqlExtension()
  await registerFormatToonExtension()

  return environment("evals-harness-authoring-demo")
    .withRuntime(runtime(NODE_RUNTIME_ID))
    .withExtensions([
      extension("@executioncontrolprotocol/format-eql").with({}),
      extension("@executioncontrolprotocol/format-toon").with({}),
      extension("@executioncontrolprotocol/demo").with({}),
      extension("@executioncontrolprotocol/demo").with({}),
    ])
    .withHarnesses([
      harness(BROWSER_NANO_HARNESS_ID)
        .uses("@executioncontrolprotocol/demo.generate")
        .with({
          output: { schema: "@executioncontrolprotocol.workflow", format: "@executioncontrolprotocol/format-eql", validate: true },
        }),
    ])
}

describe("evals-workflow-authoring harness (demo provider)", () => {
  it("creates a workflow via demo provider", async () => {
    const env = await createEvalAuthoringDemoEnv()
    const ecp = await env.init()
    const result = await ecp
      .invoke(BROWSER_NANO_HARNESS_CAPABILITY)
      .with({ task: HARNESS_TASKS.WORKFLOW_AUTHORING, request: "Create an echo workflow" })
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
      .invoke(BROWSER_NANO_HARNESS_CAPABILITY)
      .with({
        task: HARNESS_TASKS.WORKFLOW_AUTHORING,
        request: "Patch the echo step input value.",
        manifest,
      })
      .process()

    assertHarnessInvokeSuccess(result)
    const harnessOutput = result.result as HarnessInvokeResult<WorkflowManifest>
    expect(harnessOutput.artifact.schema).toBe("@executioncontrolprotocol.workflow")
    const echoStep = harnessOutput.artifact.steps?.find((s) => s.id === "echo")
    expect(echoStep?.input).toEqual({ value: "patched" })
    expect(harnessOutput.trace.decodeSucceeded).toBe(true)
    await ecp.terminate()
  })
})
