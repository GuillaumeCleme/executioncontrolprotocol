import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import type { HarnessInvokeResult, WorkflowManifest } from "@executioncontextprotocol/types"
import {
  BROWSER_NANO_HARNESS_CAPABILITY,
  OLLAMA_GEMMA_1B_EVAL,
  createHarnessOllamaWorkflowEnvironment,
  ollamaEvalReady,
} from "@executioncontextprotocol/evals"
import { HARNESS_TASKS } from "@executioncontextprotocol/evals"
import { assertHarnessInvokeSuccess, harnessResult, harnessTraceHint } from "./assert-harness-result.js"

const fixtureDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../fixtures")

const readiness = await ollamaEvalReady()

describe.skipIf(!readiness.ready)(
  `workflow-authoring harness (${readiness.profileId} ${readiness.model})`,
  () => {
    it("creates a valid @ecp.workflow in JSON", async () => {
      const env = await createHarnessOllamaWorkflowEnvironment()
      const ecp = await env.init()

      const result = await ecp
        .invoke(BROWSER_NANO_HARNESS_CAPABILITY)
        .with({
          task: HARNESS_TASKS.WORKFLOW_AUTHORING,
          request:
            "Create a minimal echo workflow with one step using @executioncontextprotocol/demo.echo and input value hello.",
          model: OLLAMA_GEMMA_1B_EVAL.model,
        })
        .process()

      assertHarnessInvokeSuccess(result)
      const harnessOutput = harnessResult<WorkflowManifest>(result)
      expect(harnessOutput.artifact.schema, harnessTraceHint(harnessOutput)).toBe("@ecp.workflow")
      expect(harnessOutput.artifact.steps?.length ?? 0).toBeGreaterThanOrEqual(1)
      expect(harnessOutput.trace.decodeSucceeded).toBe(true)
      expect(harnessOutput.trace.outputFormat).toBe("@executioncontextprotocol/format-eql")
      expect(harnessOutput.validation?.valid ?? true).toBe(true)

      await ecp.terminate()
    })

    it("patches an existing workflow via @ecp.patch in JSON", async () => {
      const manifest = JSON.parse(
        readFileSync(path.join(fixtureDir, "workflows/echo-workflow.json"), "utf8")
      ) as WorkflowManifest

      const env = await createHarnessOllamaWorkflowEnvironment()
      const ecp = await env.init()

      const result = await ecp
        .invoke(BROWSER_NANO_HARNESS_CAPABILITY)
        .with({
          task: HARNESS_TASKS.WORKFLOW_AUTHORING,
          request: "Change the echo step label to Patched Echo.",
          manifest,
          model: OLLAMA_GEMMA_1B_EVAL.model,
        })
        .process()

      assertHarnessInvokeSuccess(result)
      const harnessOutput = result.result as HarnessInvokeResult<WorkflowManifest>
      expect(harnessOutput.artifact.schema).toBe("@ecp.workflow")
      const echoStep = harnessOutput.artifact.steps?.find((s) => s.id === "echo")
      expect(echoStep?.label).toBe("Patched Echo")
      expect(harnessOutput.validation?.valid ?? true).toBe(true)

      await ecp.terminate()
    })
  }
)
