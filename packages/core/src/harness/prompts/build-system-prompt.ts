import { loadHarnessPromptFixture } from "./load-harness-prompt.js"
import { formatSchemaExampleEql, formatSchemaExampleJson } from "./load-schema-example.js"
import type { HarnessPromptFixture } from "./harness-prompt-fixture-schema.js"
import { HARNESS_PROMPT_FIXTURE_IDS } from "./harness-prompt-fixture-schema.js"
import { eqlPrimerForOutputSchema } from "./eql-primer.js"
import { ECP_ASSISTANT_IDENTITY_PRIMER } from "./identity-primer.js"

function usesEql(fixture: HarnessPromptFixture): boolean {
  return fixture.promptFormat !== "json"
}

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
  const eql = usesEql(fixture)
  const lines: string[] = [
    eql ? "Additional examples (message -> EQL output):" : "Examples (message -> JSON output):",
  ]
  for (const shot of fixture.fewShots) {
    lines.push(`User: ${shot.message}`)
    if (typeof shot.output === "string") {
      lines.push(`Output:\n${shot.output.trimEnd()}`)
    } else {
      lines.push(`Output: ${JSON.stringify(shot.output)}`)
    }
  }
  return lines
}

/**
 * Build the system prompt string for a harness prompt fixture.
 * @category Harness
 */
export function buildSystemPrompt(fixtureId: string): string {
  const fixture = loadHarnessPromptFixture(fixtureId)
  const eql = usesEql(fixture)
  const example = eql
    ? formatSchemaExampleEql(fixture.outputSchema)
    : formatSchemaExampleJson(fixture.outputSchema)

  const identityBlock = fixture.identity ? [ECP_ASSISTANT_IDENTITY_PRIMER] : []

  const sections = eql
    ? [
        ...identityBlock,
        eqlPrimerForOutputSchema(fixture.outputSchema),
        fixture.outputSchema === "@ecp.patch"
          ? undefined
          : `Operation syntax sample (${fixture.outputSchema}):\n${example}`,
        ...formatFewShots(fixture),
        [fixture.role, fixture.task].filter(Boolean).join("\n"),
        ...formatAllowedValues(fixture),
        ...formatDefinitions(fixture),
        "Reply with SQL-like EQL only. No markdown fences. No header line.",
      ].filter((s): s is string => s !== undefined && s.length > 0)
    : [
        ...identityBlock,
        fixture.role,
        fixture.task,
        `Output schema: ${fixture.outputSchema}`,
        `Example output (copy this shape exactly): ${example}`,
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
