import type { Ecp, Environment } from "@ecp/core"
import type { HarnessCapabilityId } from "@ecp/types"
import {
  EVAL_HARNESS_NAMES,
  isFlowEvalCase,
  type DeterministicAssertion,
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
  resolveEvalInvokeInputBrowser,
  resolveSingleEvalCaseInputBrowser,
} from "./load-eval-cases.browser.js"
import {
  evalDebugContextFromCase,
  isEvalDebugEnabled,
  logEvalCaseContext,
  logEvalCaseInvoke,
} from "./eval-debug.js"
import {
  EVAL_HARNESS_TASKS,
  EVALS_HARNESS_CAPABILITY,
  type EvalHarnessTask,
} from "@ecp/harnesses-evals"
import { MATRIX_EVAL_EXTENSION_IDS } from "../harness-eval-config.js"

function withInvokeSuccessAssertion(
  assertions: DeterministicAssertion[]
): DeterministicAssertion[] {
  if (assertions.some((a) => a.kind === "invokeSuccess")) {
    return assertions
  }
  return [{ kind: "invokeSuccess" }, ...assertions]
}

const HARNESS_TASK_BY_CASE_NAME: Record<string, EvalHarnessTask> = {
  [EVAL_HARNESS_NAMES.WORKFLOW_AUTHORING]: EVAL_HARNESS_TASKS.WORKFLOW_AUTHORING,
  [EVAL_HARNESS_NAMES.INTENT_CLASSIFICATION]: EVAL_HARNESS_TASKS.INTENT_CLASSIFICATION,
  [EVAL_HARNESS_NAMES.WORKFLOW_ASSISTANT]: EVAL_HARNESS_TASKS.WORKFLOW_ASSISTANT,
}

function withHarnessTask(
  harnessName: string,
  input: Record<string, unknown>
): Record<string, unknown> {
  const task = HARNESS_TASK_BY_CASE_NAME[harnessName]
  if (!task) {
    throw new Error(`Unknown eval harness name: ${harnessName}`)
  }
  return { task, ...input }
}

/** Execute a single-harness eval case (browser Vitest — bundled fixtures). @category Evals */
export async function runSingleEvalCase(
  ecp: Ecp,
  env: Environment,
  caseRow: SingleEvalCase
): Promise<void> {
  const input = resolveSingleEvalCaseInputBrowser(caseRow)
  const model = resolveEvalModel(caseRow)
  if (model !== undefined) {
    input.model = model
  }

  const deterministic = withInvokeSuccessAssertion(caseRow.assertions.deterministic)
  const debugCtx = evalDebugContextFromCase(
    caseRow,
    withHarnessTask(caseRow.harness, input) as Record<string, unknown>
  )

  if (isEvalDebugEnabled()) {
    logEvalCaseContext({ ...debugCtx, assertions: deterministic })
  }

  const result = await ecp
    .invoke(EVALS_HARNESS_CAPABILITY as HarnessCapabilityId)
    .with(withHarnessTask(caseRow.harness, input))
    .process()

  if (isEvalDebugEnabled()) {
    logEvalCaseInvoke({ ...debugCtx, assertions: deterministic }, result)
  }

  const judge = caseRow.assertions.judge

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

/** Execute a multi-step flow eval case (browser Vitest). @category Evals */
export async function runFlowEvalCase(
  ecp: Ecp,
  env: Environment,
  caseRow: FlowEvalCase
): Promise<void> {
  const model = resolveEvalModel(caseRow)

  for (let i = 0; i < caseRow.steps.length; i++) {
    const step = caseRow.steps[i]
    const input = resolveEvalInvokeInputBrowser(step.input)
    if (model !== undefined) {
      input.model = model
    }

    const deterministic = withInvokeSuccessAssertion(step.assertions.deterministic)
    const debugCtx = evalDebugContextFromCase(
      caseRow,
      withHarnessTask(step.harness, input) as Record<string, unknown>,
      i
    )

    if (isEvalDebugEnabled()) {
      logEvalCaseContext({ ...debugCtx, assertions: deterministic })
    }

    const result = await ecp
      .invoke(EVALS_HARNESS_CAPABILITY as HarnessCapabilityId)
      .with(withHarnessTask(step.harness, input))
      .process()

    if (isEvalDebugEnabled()) {
      logEvalCaseInvoke({ ...debugCtx, assertions: deterministic }, result)
    }

    const judge = step.assertions.judge

    if (!isJudgeOnly(judge)) {
      const harnessOutput = await assertDeterministic(caseRow, result, deterministic, {
        ecp,
        env,
        descriptorExtensionIds: MATRIX_EVAL_EXTENSION_IDS as unknown as string[],
        stepIndex: i,
      })
      await assertJudge(caseRow, harnessOutput, judge, ecp, i)
    } else {
      if (!result.success) {
        throw new Error(`[${caseRow.id}] step ${i} invoke failed`)
      }
      await assertJudge(caseRow, result.result as never, judge, ecp, i)
    }
  }
}

/** Execute any eval case (browser Vitest). @category Evals */
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
