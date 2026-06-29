import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import type { RunResult, WorkflowManifest } from "@executioncontrolprotocol/types"
import {
  harnessRunContextSchema,
  runResultSchema,
  toHarnessRunContext,
  type HarnessRunContext,
} from "@executioncontrolprotocol/types"
import {
  evalCaseSchema,
  EVAL_SUITE_VALUES,
  type EvalCase,
  type EvalSuite,
  type SingleEvalCase,
} from "./eval-case-schema.js"
import type { LoadEvalCasesOptions } from "./load-eval-cases-options.js"
import { EVAL_CASES_DIR, resolveEvalFixturePath } from "./fixtures-root.js"

const CASE_FILE_SUFFIX = ".cases.json"

/** Options for loading eval cases. @category Evals */
export type { LoadEvalCasesOptions } from "./load-eval-cases-options.js"

function parseCasesFile(filePath: string): EvalCase[] {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as unknown
  const rows = Array.isArray(raw)
    ? raw
    : raw !== null && typeof raw === "object" && "cases" in raw
      ? (raw as { cases: unknown[] }).cases
      : null
  if (!Array.isArray(rows)) {
    throw new Error(`${filePath}: expected a JSON array or { "cases": [...] }`)
  }
  return rows.map((row, index) => {
    const parsed = evalCaseSchema.safeParse(row)
    if (!parsed.success) {
      throw new Error(
        `${filePath}[${index}]: ${parsed.error.issues.map((i) => i.message).join("; ")}`
      )
    }
    return parsed.data
  })
}

/**
 * Load all eval cases from `fixtures/cases/*.cases.json`.
 * @category Evals
 */
export function loadEvalCases(options: LoadEvalCasesOptions = {}): EvalCase[] {
  const files = readdirSync(EVAL_CASES_DIR)
    .filter((name) => name.endsWith(CASE_FILE_SUFFIX))
    .sort()

  let cases: EvalCase[] = []
  for (const file of files) {
    const filePath = path.join(EVAL_CASES_DIR, file)
    cases = cases.concat(parseCasesFile(filePath))
  }

  if (options.suite) {
    cases = cases.filter((c) => c.suite === options.suite)
  }
  if (options.excludeSkipped !== false) {
    cases = cases.filter((c) => !c.skip)
  }
  return cases
}

/**
 * Load a workflow manifest fixture relative to `fixtures/workflows/`.
 * @category Evals
 */
export function loadWorkflowFixture(relativePath: string): WorkflowManifest {
  const full = resolveEvalFixturePath(relativePath.startsWith("workflows/")
    ? relativePath
    : `workflows/${relativePath}`)
  return JSON.parse(readFileSync(full, "utf8")) as WorkflowManifest
}

/**
 * Load run context from `fixtures/runs/` or a full HarnessRunContext JSON file.
 * @category Evals
 */
export function loadHarnessRunFixture(relativePath: string): HarnessRunContext {
  const full = resolveEvalFixturePath(
    relativePath.startsWith("runs/") ? relativePath : `runs/${relativePath}`
  )
  const raw = JSON.parse(readFileSync(full, "utf8")) as unknown
  const asContext = harnessRunContextSchema.safeParse(raw)
  if (asContext.success) {
    return toHarnessRunContext(
      asContext.data.run as RunResult,
      asContext.data.workflow as WorkflowManifest | undefined
    )
  }
  const asRun = runResultSchema.safeParse(raw)
  if (asRun.success) {
    return toHarnessRunContext(asRun.data as RunResult)
  }
  throw new Error(`${full}: expected HarnessRunContext or @executioncontrolprotocol.run.result document`)
}

/**
 * Resolve manifest/run fixture refs in harness invoke input.
 * @category Evals
 */
export function resolveEvalInvokeInput(input: Record<string, unknown>): Record<string, unknown> {
  const resolved = { ...input }
  const manifestRef = resolved.manifestRef
  if (typeof manifestRef === "string") {
    resolved.manifest = loadWorkflowFixture(manifestRef)
    delete resolved.manifestRef
  }
  const runContextFixture = resolved.runContextFixture
  if (typeof runContextFixture === "string") {
    resolved.runContext = loadHarnessRunFixture(runContextFixture)
    delete resolved.runContextFixture
  }
  return resolved
}

/**
 * Resolve invoke input for a single eval case (manifest/run fixture refs).
 * @category Evals
 */
export function resolveSingleEvalCaseInput(caseRow: SingleEvalCase): Record<string, unknown> {
  const input = resolveEvalInvokeInput(caseRow.input)
  if (caseRow.baselineWorkflow) {
    input.manifest = loadWorkflowFixture(caseRow.baselineWorkflow)
  }
  return input
}

/** Count Ollama matrix cases (excludes skipped). @category Evals */
export function countOllamaEvalCases(): number {
  return loadEvalCases({ excludeSkipped: true }).length
}

/** Suite file name helper. @category Evals */
export const EVAL_SUITE_FILE_NAMES: Record<EvalSuite, string> = {
  [EVAL_SUITE_VALUES.WORKFLOW_CREATE]: "workflow-create.cases.json",
  [EVAL_SUITE_VALUES.WORKFLOW_PATCH]: "workflow-patch.cases.json",
  [EVAL_SUITE_VALUES.INTENT]: "intent.cases.json",
  [EVAL_SUITE_VALUES.ASSISTANT]: "assistant.cases.json",
  [EVAL_SUITE_VALUES.FLOW]: "flow.cases.json",
  [EVAL_SUITE_VALUES.CHAT]: "chat.cases.json",
}
