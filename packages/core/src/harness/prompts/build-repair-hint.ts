import { loadHarnessPromptFixture } from "./load-harness-prompt.js"
import { formatSchemaExampleEql, formatSchemaExampleJson } from "./load-schema-example.js"

function formatRepairExample(outputSchema: string, eql: boolean): string {
  if (eql && outputSchema === "@executioncontrolprotocol.patch") {
    return "PATCH WORKFLOW <workflow-id> then only required UPDATE/ADD/DELETE/MOVE lines with real step ids."
  }
  return eql ? formatSchemaExampleEql(outputSchema) : formatSchemaExampleJson(outputSchema)
}

/**
 * Build repair-line text for a failed model attempt (valid example + prose).
 * @category Harness
 */
export function buildRepairHint(fixtureId: string): string {
  const fixture = loadHarnessPromptFixture(fixtureId)
  const eql = fixture.promptFormat !== "json"
  const parts = [
    fixture.repairHint ??
      (eql ? "Return corrected EQL only." : "Return corrected JSON only."),
  ]
  if (eql && fixture.outputSchema !== "@executioncontrolprotocol.patch") {
    const example = formatRepairExample(fixture.outputSchema, eql)
    parts.push(`Example shape:\n${example}`)
  }
  return parts.join(" ")
}
