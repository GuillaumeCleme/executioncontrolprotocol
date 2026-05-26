import { readFileSync } from "node:fs"
import path from "node:path"
import { SCHEMA_EXAMPLES_DIR } from "./fixtures-root.js"

const SCHEMA_EXAMPLE_FILES: Record<string, string> = {
  "@ecp.intent": "intent.output.json",
  "@ecp.workflow": "workflow.output.json",
  "@ecp.patch": "patch.output.json",
  "@ecp.harness.reply": "harness-reply.output.json",
}

/**
 * Load a valid JSON output example for an ECP schema id (not harness-specific).
 * @category Harness
 */
export function loadSchemaExample(outputSchema: string): Record<string, unknown> {
  const fileName = SCHEMA_EXAMPLE_FILES[outputSchema]
  if (!fileName) {
    throw new Error(`No schema example fixture for output schema: ${outputSchema}`)
  }
  const full = path.join(SCHEMA_EXAMPLES_DIR, fileName)
  return JSON.parse(readFileSync(full, "utf8")) as Record<string, unknown>
}

/**
 * Serialize a schema example as a single-line JSON string for prompts.
 * @category Harness
 */
export function formatSchemaExampleJson(outputSchema: string): string {
  return JSON.stringify(loadSchemaExample(outputSchema))
}
