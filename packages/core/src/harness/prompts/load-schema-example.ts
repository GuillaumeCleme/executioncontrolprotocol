import { readFileSync } from "node:fs"
import path from "node:path"
import { SCHEMA_EXAMPLES_DIR } from "./fixtures-root.js"

const SCHEMA_EXAMPLE_FILES: Record<
  string,
  { json: string; eql: string; repairNeutralEql?: string }
> = {
  "@ecp.intent": { json: "intent.output.json", eql: "intent.output.eql" },
  "@ecp.workflow": { json: "workflow.output.json", eql: "workflow.output.eql" },
  "@ecp.patch": {
    json: "patch.output.json",
    eql: "patch.output.eql",
    repairNeutralEql: "patch.repair-neutral.eql",
  },
  "@ecp.harness.reply": { json: "harness-reply.output.json", eql: "harness-reply.output.eql" },
}

/**
 * Load a valid JSON output example for an ECP schema id (not harness-specific).
 * @category Harness
 */
export function loadSchemaExample(outputSchema: string): Record<string, unknown> {
  const fileName = SCHEMA_EXAMPLE_FILES[outputSchema]?.json
  if (!fileName) {
    throw new Error(`No schema example fixture for output schema: ${outputSchema}`)
  }
  const full = path.join(SCHEMA_EXAMPLES_DIR, fileName)
  return JSON.parse(readFileSync(full, "utf8")) as Record<string, unknown>
}

/**
 * Load a headerless EQL example for an ECP schema id.
 * @category Harness
 */
export function loadSchemaExampleEql(outputSchema: string): string {
  const fileName = SCHEMA_EXAMPLE_FILES[outputSchema]?.eql
  if (!fileName) {
    throw new Error(`No EQL schema example fixture for output schema: ${outputSchema}`)
  }
  const full = path.join(SCHEMA_EXAMPLES_DIR, fileName)
  return readFileSync(full, "utf8").trimEnd()
}

/**
 * Serialize a schema example as a single-line JSON string for prompts.
 * @category Harness
 */
export function formatSchemaExampleJson(outputSchema: string): string {
  return JSON.stringify(loadSchemaExample(outputSchema))
}

/**
 * Headerless EQL example text for prompts.
 * @category Harness
 */
export function formatSchemaExampleEql(outputSchema: string): string {
  return loadSchemaExampleEql(outputSchema)
}

/**
 * Neutral repair EQL example (fictional ids — for repair hints only).
 * @category Harness
 */
export function loadRepairNeutralExampleEql(outputSchema: string): string {
  const fileName =
    SCHEMA_EXAMPLE_FILES[outputSchema]?.repairNeutralEql ??
    SCHEMA_EXAMPLE_FILES[outputSchema]?.eql
  if (!fileName) {
    throw new Error(`No EQL repair example fixture for output schema: ${outputSchema}`)
  }
  const full = path.join(SCHEMA_EXAMPLES_DIR, fileName)
  return readFileSync(full, "utf8").trimEnd()
}
