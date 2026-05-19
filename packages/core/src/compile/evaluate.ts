import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import type { WorkflowManifest } from "@ecp/types"
import type { WorkflowBuilder } from "../workflow/builder.js"

const WORKFLOW_EXPORT_NAMES = ["default", "workflow", "defaultWorkflow", "manifest"]

/** Extract workflow builder or manifest from evaluated module exports. */
export function extractWorkflowFromModule(
  mod: Record<string, unknown>
): WorkflowManifest {
  for (const name of WORKFLOW_EXPORT_NAMES) {
    const exp = mod[name]
    if (!exp) continue
    const value = typeof exp === "function" ? (exp as () => unknown)() : exp
    if (value && typeof value === "object") {
      if ("toManifest" in value && typeof (value as WorkflowBuilder).toManifest === "function") {
        return (value as WorkflowBuilder).toManifest()
      }
      if ("schema" in value && (value as WorkflowManifest).schema === "@ecp.workflow") {
        return value as WorkflowManifest
      }
    }
  }
  throw new Error(
    "Module must export a workflow builder or @ecp.workflow manifest (default, workflow, or defaultWorkflow)"
  )
}

/** Evaluate ESM code in a temp file (Node ESM loader). */
export async function evaluateWorkflowModule(
  code: string,
  _filename = "workflow.js"
): Promise<WorkflowManifest> {
  const dir = await mkdtemp(join(tmpdir(), "ecp-compile-"))
  const file = join(dir, "workflow.mjs")
  try {
    await writeFile(file, code, "utf8")
    const mod = (await import(pathToFileURL(file).href)) as Record<string, unknown>
    return extractWorkflowFromModule(mod)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
