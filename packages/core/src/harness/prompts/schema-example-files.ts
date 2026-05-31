/** Schema id → fixture file names (shared by Node and browser loaders). @category Harness */
export const SCHEMA_EXAMPLE_FILES: Record<
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
