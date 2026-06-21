import { loadHarnessPromptFixture } from "./load-harness-prompt.js"
import {
  formatSchemaExampleEql,
  formatSchemaExampleJson,
} from "./load-schema-example.js"

function formatRepairExample(outputSchema: string, eql: boolean): string {
  if (eql && outputSchema === "@executioncontrolprotocol.patch") {
    return "Use PATCH WORKFLOW with the workflow id from the user prompt, then only the UPDATE, DELETE, or ADD operations required by the request."
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
  const example = formatRepairExample(fixture.outputSchema, eql)
  const parts = [
    fixture.repairHint ??
      (eql ? "Return corrected EQL only." : "Return corrected JSON only."),
    eql ? `Example shape:\n${example}` : `Example shape: ${example}`,
  ]
  if (fixture.allowedValues) {
    for (const [field, values] of Object.entries(fixture.allowedValues)) {
      parts.push(`${field} must be one of: ${values.join(", ")}`)
    }
  }
  return parts.join(" ")
}
