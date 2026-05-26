import { loadHarnessPromptFixture } from "./load-harness-prompt.js"
import { formatSchemaExampleJson } from "./load-schema-example.js"

/**
 * Build repair-line text for a failed model attempt (valid JSON example + prose).
 * @category Harness
 */
export function buildRepairHint(fixtureId: string): string {
  const fixture = loadHarnessPromptFixture(fixtureId)
  const exampleJson = formatSchemaExampleJson(fixture.outputSchema)
  const parts = [
    fixture.repairHint ?? "Return corrected JSON only.",
    `Example shape: ${exampleJson}`,
  ]
  if (fixture.allowedValues) {
    for (const [field, values] of Object.entries(fixture.allowedValues)) {
      parts.push(`${field} must be one of: ${values.join(", ")}`)
    }
  }
  return parts.join(" ")
}
