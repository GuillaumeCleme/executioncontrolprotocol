import type { RunResult, WorkflowManifest } from "@executioncontextprotocol/types"
import {
  harnessRunContextSchema,
  runResultSchema,
  toHarnessRunContext,
  type HarnessRunContext,
} from "@executioncontextprotocol/types"
import {
  evalCaseSchema,
  type EvalCase,
  type EvalSuite,
  type SingleEvalCase,
} from "./eval-case-schema.js"
import type { LoadEvalCasesOptions } from "./load-eval-cases-options.js"

const caseModules = import.meta.glob("../../fixtures/cases/*.cases.json", {
  eager: true,
  import: "default",
}) as Record<string, EvalCase[] | { cases: EvalCase[] }>

const workflowModules = import.meta.glob("../../fixtures/workflows/*.json", {
  eager: true,
  import: "default",
}) as Record<string, WorkflowManifest>

const runModules = import.meta.glob("../../fixtures/runs/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>

function globKeySuffix(path: string): string {
  const normalized = path.replace(/\\/g, "/")
  const fixturesIdx = normalized.indexOf("/fixtures/")
  return fixturesIdx >= 0 ? normalized.slice(fixturesIdx + "/fixtures/".length) : normalized
}

function workflowFixtureMap(): Map<string, WorkflowManifest> {
  const map = new Map<string, WorkflowManifest>()
  for (const [key, value] of Object.entries(workflowModules)) {
    map.set(globKeySuffix(key), value)
  }
  return map
}

function runFixtureMap(): Map<string, unknown> {
  const map = new Map<string, unknown>()
  for (const [key, value] of Object.entries(runModules)) {
    map.set(globKeySuffix(key), value)
  }
  return map
}

const WORKFLOW_FIXTURES = workflowFixtureMap()
const RUN_FIXTURES = runFixtureMap()

function parseCasesRaw(raw: unknown, fileLabel: string): EvalCase[] {
  const rows = Array.isArray(raw)
    ? raw
    : raw !== null && typeof raw === "object" && "cases" in raw
      ? (raw as { cases: unknown[] }).cases
      : null
  if (!Array.isArray(rows)) {
    throw new Error(`${fileLabel}: expected a JSON array or { "cases": [...] }`)
  }
  return rows.map((row, index) => {
    const parsed = evalCaseSchema.safeParse(row)
    if (!parsed.success) {
      throw new Error(
        `${fileLabel}[${index}]: ${parsed.error.issues.map((i) => i.message).join("; ")}`
      )
    }
    return parsed.data
  })
}

/**
 * Load eval cases from bundled fixtures (browser Vitest — no node:fs).
 * @category Evals
 */
export function loadEvalCasesBrowser(options: LoadEvalCasesOptions = {}): EvalCase[] {
  let cases: EvalCase[] = []
  for (const [filePath, raw] of Object.entries(caseModules)) {
    cases = cases.concat(parseCasesRaw(raw, globKeySuffix(filePath)))
  }
  cases.sort((a, b) => a.id.localeCompare(b.id))

  if (options.suite) {
    cases = cases.filter((c) => c.suite === options.suite)
  }
  if (options.excludeSkipped !== false) {
    cases = cases.filter((c) => !c.skip)
  }
  return cases
}

/**
 * Load a workflow manifest fixture (browser bundle).
 * @category Evals
 */
export function loadWorkflowFixtureBrowser(relativePath: string): WorkflowManifest {
  const key = relativePath.startsWith("workflows/")
    ? relativePath
    : `workflows/${relativePath}`
  const manifest = WORKFLOW_FIXTURES.get(key)
  if (!manifest) {
    throw new Error(`Workflow fixture not found: ${key}`)
  }
  return manifest
}

function loadHarnessRunFixtureBrowser(relativePath: string): HarnessRunContext {
  const key = relativePath.startsWith("runs/") ? relativePath : `runs/${relativePath}`
  const raw = RUN_FIXTURES.get(key)
  if (raw === undefined) {
    throw new Error(`Run fixture not found: ${key}`)
  }
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
  throw new Error(`${key}: expected HarnessRunContext or @ecp.run.result document`)
}

/** Resolve manifest/run fixture refs for browser eval invokes. @category Evals */
export function resolveEvalInvokeInputBrowser(
  input: Record<string, unknown>
): Record<string, unknown> {
  const resolved = { ...input }
  const manifestRef = resolved.manifestRef
  if (typeof manifestRef === "string") {
    resolved.manifest = loadWorkflowFixtureBrowser(manifestRef)
    delete resolved.manifestRef
  }
  const runContextFixture = resolved.runContextFixture
  if (typeof runContextFixture === "string") {
    resolved.runContext = loadHarnessRunFixtureBrowser(runContextFixture)
    delete resolved.runContextFixture
  }
  return resolved
}

/** Resolve invoke input for a single eval case (browser bundle). @category Evals */
export function resolveSingleEvalCaseInputBrowser(
  caseRow: SingleEvalCase
): Record<string, unknown> {
  const input = resolveEvalInvokeInputBrowser(caseRow.input)
  if (caseRow.baselineWorkflow) {
    input.manifest = loadWorkflowFixtureBrowser(caseRow.baselineWorkflow)
  }
  return input
}

/** Count matrix cases from browser bundle. @category Evals */
export function countBrowserEvalCases(): number {
  return loadEvalCasesBrowser({ excludeSkipped: true }).length
}

/** Re-export suite type helper for browser tests. @category Evals */
export type { EvalSuite }
