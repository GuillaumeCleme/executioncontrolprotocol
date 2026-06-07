import { ECP_HARNESS_REPLY_SCHEMA, ECP_INTENT_SCHEMA } from "@ecp/types"

const INTENT_TEMPLATE = `import type { EcpIntent } from "@ecp/types"

export const intent: EcpIntent = {
  schema: "@ecp.intent",
  intent: "faq",
}`

const REPLY_TEMPLATE = `import type { HarnessReply } from "@ecp/types"

export const reply: HarnessReply = {
  schema: "@ecp.harness.reply",
  answer: "Your answer here.",
}`

const WORKFLOW_TEMPLATE = `import { workflow, step, ref } from "@ecp/core"

export default workflow("Example")
  .id("example-wf")
  .run([
    step("@ecp/test.echo", "Echo").id("echo").with({ value: "hello" }).as("echo"),
  ])`

/**
 * Minimal TypeScript output template for a harness output schema.
 * @category Harness
 */
export function typescriptTemplateForOutputSchema(outputSchema: string): string {
  if (outputSchema === ECP_INTENT_SCHEMA) return INTENT_TEMPLATE
  if (outputSchema === ECP_HARNESS_REPLY_SCHEMA) return REPLY_TEMPLATE
  if (outputSchema === "@ecp.workflow") return WORKFLOW_TEMPLATE
  return `// Export a valid ${outputSchema} document from this module`
}

/**
 * Instructions for TypeScript-only harness model output.
 * @category Harness
 */
export function typescriptPrimerForOutputSchema(outputSchema: string): string {
  const workflowApi =
    outputSchema === "@ecp.workflow"
      ? [
          "Allowed @ecp/core imports: workflow, step, ref, branch, parallel, loop.",
          "Use .id(\"stepId\") on steps when ids must stay stable across edits.",
          "Never output the word typescript on its own line before imports.",
        ]
      : []
  return [
    "Reply with TypeScript source only.",
    "No markdown fences. No JSON-only blobs. No prose outside code.",
    `Output must satisfy schema ${outputSchema}.`,
    ...workflowApi,
    "Template:",
    typescriptTemplateForOutputSchema(outputSchema),
  ].join("\n")
}
