import type { Ecp, Environment } from "@ecp/core"
import type { HarnessCapabilityId } from "@ecp/types"
import {
  EVAL_HARNESS_NAMES,
  isFlowEvalCase,
  type EvalCase,
  type FlowEvalCase,
  type SingleEvalCase,
} from "./eval-case-schema.js"
import {
  assertDeterministic,
  assertJudge,
  isJudgeOnly,
  resolveEvalModel,
} from "./assertions.js"
import {
  loadHarnessRunFixture,
  loadWorkflowFixture,
  resolveSingleEvalCaseInput,
} from "./load-eval-cases.js"
import {
  EVALS_INTENT_CLASSIFICATION_CAPABILITY,
  EVALS_WORKFLOW_ASSISTANT_CAPABILITY,
  EVALS_WORKFLOW_AUTHORING_CAPABILITY,
} from "../harnesses/harness-ids.js"
import { MATRIX_EVAL_EXTENSION_IDS } from "../harness-eval-config.js"
import type { DeterministicAssertion } from "./eval-case-schema.js"

function withInvokeSuccessAssertion(
  assertions: DeterministicAssertion[]
): DeterministicAssertion[] {
  if (assertions.some((a) => a.kind === "invokeSuccess")) {
    return assertions
  }
  return [{ kind: "invokeSuccess" }, ...assertions]
}

const HARNESS_CAPABILITY: Record<string, HarnessCapabilityId> = {
  [EVAL_HARNESS_NAMES.WORKFLOW_AUTHORING]: EVALS_WORKFLOW_AUTHORING_CAPABILITY,
  [EVAL_HARNESS_NAMES.INTENT_CLASSIFICATION]: EVALS_INTENT_CLASSIFICATION_CAPABILITY,
  [EVAL_HARNESS_NAMES.WORKFLOW_ASSISTANT]: EVALS_WORKFLOW_ASSISTANT_CAPABILITY,
}

function resolveStepInput(input: Record<string, unknown>): Record<string, unknown> {
  const resolved = { ...input }
  if (typeof resolved.manifestRef === "string") {
    resolved.manifest = loadWorkflowFixture(resolved.manifestRef)
    delete resolved.manifestRef
  }
  if (typeof resolved.runContextFixture === "string") {
    resolved.runContext = loadHarnessRunFixture(resolved.runContextFixture)
    delete resolved.runContextFixture
  }
  return resolved
}

/**
 * Execute a single-harness eval case against an initialized environment.
 * @category Evals
 */
export async function runSingleEvalCase(
  ecp: Ecp,
  env: Environment,
  caseRow: SingleEvalCase
): Promise<void> {
  const capabilityId = HARNESS_CAPABILITY[caseRow.harness]
  const input = resolveSingleEvalCaseInput(caseRow)
  input.model = resolveEvalModel(caseRow)

  const result = await ecp.invoke(capabilityId).with(input).process()
  const judge = caseRow.assertions.judge

  const deterministic = withInvokeSuccessAssertion(caseRow.assertions.deterministic)
  if (!isJudgeOnly(judge)) {
    const harnessOutput = await assertDeterministic(caseRow, result, deterministic, {
      ecp,
      env,
      descriptorExtensionIds: MATRIX_EVAL_EXTENSION_IDS as unknown as string[],
    })
    await assertJudge(caseRow, harnessOutput, judge, ecp)
  } else {
    if (!result.success) {
      throw new Error(`[${caseRow.id}] invoke failed in judge-only mode`)
    }
    await assertJudge(caseRow, result.result as never, judge, ecp)
  }
}

/**
 * Execute a multi-step flow eval case.
 * @category Evals
 */
export async function runFlowEvalCase(
  ecp: Ecp,
  env: Environment,
  caseRow: FlowEvalCase
): Promise<void> {
  const model = resolveEvalModel(caseRow)
  for (let i = 0; i < caseRow.steps.length; i++) {
    const step = caseRow.steps[i]
    const capabilityId = HARNESS_CAPABILITY[step.harness]
    const input = resolveStepInput(step.input)
    input.model = model
    const result = await ecp.invoke(capabilityId).with(input).process()
    const judge = step.assertions.judge
    const deterministic = withInvokeSuccessAssertion(step.assertions.deterministic)
    if (!isJudgeOnly(judge)) {
      const harnessOutput = await assertDeterministic(
        caseRow,
        result,
        deterministic,
        {
          ecp,
          env,
          descriptorExtensionIds: MATRIX_EVAL_EXTENSION_IDS as unknown as string[],
          stepIndex: i,
        }
      )
      await assertJudge(caseRow, harnessOutput, judge, ecp, i)
    } else {
      if (!result.success) {
        throw new Error(`[${caseRow.id}] step ${i} invoke failed`)
      }
      await assertJudge(caseRow, result.result as never, judge, ecp, i)
    }
  }
}

/**
 * Execute any eval case (single or flow).
 * @category Evals
 */
export async function runEvalCase(
  ecp: Ecp,
  env: Environment,
  caseRow: EvalCase
): Promise<void> {
  if (isFlowEvalCase(caseRow)) {
    await runFlowEvalCase(ecp, env, caseRow)
    return
  }
  await runSingleEvalCase(ecp, env, caseRow)
}
