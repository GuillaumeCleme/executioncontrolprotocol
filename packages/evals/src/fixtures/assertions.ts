import { expect } from "vitest"
import type { Ecp, Environment } from "@ecp/core"
import {
  ECP_HARNESS_REPLY_SCHEMA,
  ECP_INTENT_SCHEMA,
  type EcpIntentValue,
  type HarnessInvokeResult,
  type HarnessReply,
  type InvokeResult,
  type StepNode,
  type WorkflowManifest,
} from "@ecp/types"
import { OLLAMA_GEMMA_1B_EVAL } from "../profiles/ollama-gemma.js"
import type { DeterministicAssertion, EvalCase, JudgeAssertion } from "./eval-case-schema.js"
import { isFlowEvalCase } from "./eval-case-schema.js"
import {
  isEvalDebugEnabled,
  logEvalAssertionMismatch,
} from "./eval-debug.js"
import { formatInvokeFailure } from "./harness-trace-format.js"

function caseLabel(caseRow: EvalCase, stepIndex?: number): string {
  return stepIndex === undefined ? `[${caseRow.id}]` : `[${caseRow.id} step ${stepIndex}]`
}

function formatInvokeFailureDetails(result: InvokeResult): string {
  if (isEvalDebugEnabled()) {
    return ` (${formatInvokeFailure(result)})`
  }
  const parts: string[] = []
  if (result.diagnostics?.length) {
    parts.push(
      `diagnostics: ${result.diagnostics.map((d) => (d.path ? `${d.path}: ` : "") + d.message).join("; ")}`
    )
  }
  if (!result.success && result.result !== undefined) {
    const harness = result.result as HarnessInvokeResult
    if (harness.trace?.rawOutput) {
      parts.push(`rawOutput: ${String(harness.trace.rawOutput).slice(0, 500)}`)
    }
    const validationErrors = harness.validation?.errors
    if (validationErrors?.length) {
      parts.push(
        `validation: ${validationErrors.map((e) => (e.path ? `${e.path}: ` : "") + e.message).join("; ")}`
      )
    }
  }
  return parts.length > 0 ? ` (${parts.join(" | ")})` : ""
}

function findStep(workflow: WorkflowManifest, stepId: string): StepNode | undefined {
  const node = workflow.steps?.find((s) => s.type === "step" && s.id === stepId)
  return node?.type === "step" ? node : undefined
}

/**
 * Run deterministic assertions against a harness invoke result.
 * @category Evals
 */
export async function assertDeterministic(
  caseRow: EvalCase,
  result: InvokeResult,
  assertions: DeterministicAssertion[],
  options: {
    ecp: Ecp
    env: Environment
    descriptorExtensionIds?: string[]
    descriptorCapabilityIds?: string[]
    stepIndex?: number
  }
): Promise<HarnessInvokeResult> {
  const label = caseLabel(caseRow, options.stepIndex)

  const debugDescribeOpts = {
    stepIndex: options.stepIndex,
    descriptorExtensionIds: options.descriptorExtensionIds,
    descriptorCapabilityIds: options.descriptorCapabilityIds,
    describeExtensions: async () =>
      (await options.ecp.describe()).extensions?.map((e) => e.id) ?? [],
    describeCapabilities: async () =>
      (await options.ecp.describe()).capabilities?.map((c) => c.id) ?? [],
  }

  for (const assertion of assertions) {
    const harnessOutputForDebug = result.success
      ? (result.result as HarnessInvokeResult)
      : (result.result as HarnessInvokeResult | undefined)

    try {
    if (assertion.kind === "invokeSuccess") {
      expect(
        result.success,
        `${label} invoke should succeed${formatInvokeFailureDetails(result)}`
      ).toBe(true)
      continue
    }
    if (!result.success) {
      throw new Error(`${label} expected success before ${assertion.kind}`)
    }
    const harnessOutput = result.result as HarnessInvokeResult

    switch (assertion.kind) {
      case "artifactSchema":
        expect(
          (harnessOutput.artifact as { schema?: string })?.schema,
          `${label} artifact schema`
        ).toBe(assertion.value)
        break
      case "validationValid":
        expect(harnessOutput.validation?.valid ?? true, `${label} validation`).toBe(true)
        break
      case "intent": {
        const artifact = harnessOutput.artifact as { schema?: string; intent?: EcpIntentValue }
        expect(artifact.schema, `${label} intent schema`).toBe(ECP_INTENT_SCHEMA)
        expect(artifact.intent, `${label} intent value`).toBe(assertion.value)
        break
      }
      case "replySchema": {
        const artifact = harnessOutput.artifact as HarnessReply
        expect(artifact.schema, `${label} reply schema`).toBe(ECP_HARNESS_REPLY_SCHEMA)
        break
      }
      case "stepUses": {
        const wf = harnessOutput.artifact as WorkflowManifest
        const uses =
          wf.steps
            ?.map((s) => ("uses" in s && typeof s.uses === "string" ? s.uses : undefined))
            .filter((u): u is string => u !== undefined) ?? []
        expect(uses, `${label} step uses`).toContain(assertion.capabilityId)
        break
      }
      case "stepCount": {
        const wf = harnessOutput.artifact as WorkflowManifest
        const count = wf.steps?.length ?? 0
        if (assertion.exact !== undefined) {
          expect(count, `${label} step count`).toBe(assertion.exact)
        } else {
          expect(count, `${label} step count`).toBeGreaterThanOrEqual(assertion.min ?? 1)
        }
        break
      }
      case "stepLabel": {
        const wf = harnessOutput.artifact as WorkflowManifest
        const step = findStep(wf, assertion.stepId)
        expect(step?.label, `${label} step label`).toBe(assertion.value)
        break
      }
      case "workflowLabel": {
        const wf = harnessOutput.artifact as WorkflowManifest
        expect(wf.workflow?.label, `${label} workflow label`).toBe(assertion.value)
        break
      }
      case "stepRemoved": {
        const wf = harnessOutput.artifact as WorkflowManifest
        const step = wf.steps?.find((s) => s.type === "step" && s.id === assertion.stepId)
        expect(step, `${label} removed step`).toBeUndefined()
        break
      }
      case "inputRefPresent": {
        const wf = harnessOutput.artifact as WorkflowManifest
        const step = findStep(wf, assertion.stepId)
        const input = step?.input as Record<string, unknown> | undefined
        const hasRef =
          input !== undefined &&
          Object.values(input).some(
            (v) => v !== null && typeof v === "object" && "$ref" in (v as object)
          )
        expect(hasRef, `${label} input $ref`).toBe(true)
        break
      }
      case "stepOrder": {
        const wf = harnessOutput.artifact as WorkflowManifest
        const order =
          wf.steps
            ?.filter((s) => s.type === "step" || s.type === undefined)
            .map((s) => s.id) ?? []
        expect(order, `${label} step order`).toEqual(assertion.stepIds)
        break
      }
      case "citationStepId": {
        const artifact = harnessOutput.artifact as HarnessReply
        const cited = artifact.citations?.some(
          (c) => c.kind === "step" && c.id === assertion.value
        )
        expect(cited || artifact.answer.includes(assertion.value), `${label} citation`).toBe(true)
        break
      }
      case "answerContains": {
        const artifact = harnessOutput.artifact as HarnessReply
        expect(artifact.answer.toLowerCase(), `${label} answer text`).toContain(
          assertion.text.toLowerCase()
        )
        break
      }
      case "descriptorListsExtensions": {
        const ids =
          options.descriptorExtensionIds ??
          (await options.ecp.describe()).extensions?.map((e) => e.id) ??
          []
        for (const id of assertion.ids) {
          expect(ids, `${label} descriptor extensions`).toContain(id)
        }
        break
      }
      case "descriptorListsCapabilities": {
        const ids =
          options.descriptorCapabilityIds ??
          (await options.ecp.describe()).capabilities?.map((c) => c.id) ??
          []
        for (const id of assertion.ids) {
          expect(ids, `${label} descriptor capabilities`).toContain(id)
        }
        break
      }
      default:
        break
    }
    } catch (e) {
      await logEvalAssertionMismatch(caseRow, assertion, harnessOutputForDebug, {
        ...debugDescribeOpts,
        errorMessage: e instanceof Error ? e.message : String(e),
      })
      throw e
    }
  }

  if (!result.success) {
    throw new Error(`${label} invoke failed`)
  }
  return result.result as HarnessInvokeResult
}

/**
 * Run LLM judge via @ecp/ollama.evaluate when enabled.
 * @category Evals
 */
export async function assertJudge(
  caseRow: EvalCase,
  harnessOutput: HarnessInvokeResult,
  judge: JudgeAssertion,
  ecp: Ecp,
  stepIndex?: number
): Promise<void> {
  if (!judge.enabled) return
  const label = caseLabel(caseRow, stepIndex)
  let approved = false
  let judgeDetail = ""
  try {
    const evalInvoke = await ecp
      .invoke("@ecp/ollama.evaluate")
      .with({
        artifact: harnessOutput.artifact,
        goal: judge.goal ?? `Eval case ${caseRow.id}`,
        criteria: judge.rubric,
      })
      .process()
    if (!evalInvoke.success) {
      const diag = evalInvoke.diagnostics?.map((d) => d.message).join("; ")
      judgeDetail = diag || "evaluate invoke failed"
    } else {
      approved = (evalInvoke.result as { approved?: boolean }).approved ?? false
      if (!approved) {
        judgeDetail = "evaluate returned approved=false"
      }
    }
  } catch (err) {
    judgeDetail = err instanceof Error ? err.message : String(err)
  }
  if (judge.requireApproved) {
    expect(
      approved,
      judgeDetail ? `${label} judge approved (${judgeDetail})` : `${label} judge approved`
    ).toBe(true)
  }
}

/** Whether judge-only mode skips deterministic checks. @category Evals */
export function isJudgeOnly(judge: JudgeAssertion): boolean {
  return judge.enabled === true && judge.only === true
}

/** @category Evals */
export function assertNotFlowCase(caseRow: EvalCase): asserts caseRow is Exclude<EvalCase, { suite: "flow" }> {
  if (isFlowEvalCase(caseRow)) {
    throw new Error(`Expected single-harness case, got flow: ${caseRow.id}`)
  }
}

/** Resolve model id for invoke. @category Evals */
export function resolveEvalModel(caseRow: EvalCase): string {
  return caseRow.model === "default" || caseRow.model === undefined
    ? OLLAMA_GEMMA_1B_EVAL.model
    : caseRow.model
}
