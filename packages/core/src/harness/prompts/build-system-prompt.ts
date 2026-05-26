import { loadHarnessPromptFixture } from "./load-harness-prompt.js"
import { formatSchemaExampleJson } from "./load-schema-example.js"
import type { HarnessPromptFixture } from "./harness-prompt-fixture-schema.js"
import { HARNESS_PROMPT_FIXTURE_IDS } from "./harness-prompt-fixture-schema.js"

function formatAllowedValues(fixture: HarnessPromptFixture): string[] {
  if (!fixture.allowedValues) return []
  const lines: string[] = ["Allowed values:"]
  for (const [field, values] of Object.entries(fixture.allowedValues)) {
    lines.push(`- ${field}: ${values.join(", ")}`)
  }
  return lines
}

function formatDefinitions(fixture: HarnessPromptFixture): string[] {
  if (!fixture.definitions?.length) return []
  const lines: string[] = ["Intent definitions:"]
  for (const def of fixture.definitions) {
    lines.push(`- ${def.intent}: ${def.when}`)
  }
  return lines
}

function formatFewShots(fixture: HarnessPromptFixture): string[] {
  if (!fixture.fewShots?.length) return []
  const lines: string[] = ["Examples (message -> JSON output):"]
  for (const shot of fixture.fewShots) {
    lines.push(`User: ${shot.message}`)
    lines.push(`Output: ${JSON.stringify(shot.output)}`)
  }
  return lines
}

/**
 * Build the system prompt string for a harness prompt fixture.
 * @category Harness
 */
export function buildSystemPrompt(fixtureId: string): string {
  const fixture = loadHarnessPromptFixture(fixtureId)
  const exampleJson = formatSchemaExampleJson(fixture.outputSchema)
  const sections = [
    fixture.role,
    fixture.task,
    `Output schema: ${fixture.outputSchema}`,
    `Example output (copy this shape exactly): ${exampleJson}`,
    ...formatAllowedValues(fixture),
    ...formatDefinitions(fixture),
    ...formatFewShots(fixture),
    "Reply with JSON only. No markdown fences.",
  ]
  return sections.filter((s) => s.length > 0).join("\n\n")
}

/**
 * System prompt for workflow authoring create path.
 * @category Harness
 */
export function buildWorkflowCreateSystemPrompt(): string {
  return buildSystemPrompt(HARNESS_PROMPT_FIXTURE_IDS.WORKFLOW_AUTHORING_CREATE)
}

/**
 * System prompt for workflow authoring patch path.
 * @category Harness
 */
export function buildWorkflowPatchSystemPrompt(): string {
  return buildSystemPrompt(HARNESS_PROMPT_FIXTURE_IDS.WORKFLOW_AUTHORING_PATCH)
}
