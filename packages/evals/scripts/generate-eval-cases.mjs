import { writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../fixtures/cases")
const matrixExt = ["@ecp/format-toon", "@ecp/format-json", "@ecp/test", "@ecp/demo"]
const baseDet = [
  { kind: "invokeSuccess" },
  { kind: "artifactSchema", value: "@ecp.workflow" },
  { kind: "validationValid" },
  { kind: "descriptorListsExtensions", ids: matrixExt },
]

function writeSuite(name, cases) {
  writeFileSync(path.join(root, `${name}.cases.json`), JSON.stringify({ cases }, null, 2) + "\n")
}

const creates = [
  ["wf-create-01", "Minimal echo", "Create a minimal @ecp.workflow with one step id echo using @ecp/test.echo and input value hello.", [{ kind: "stepUses", capabilityId: "@ecp/test.echo" }, { kind: "stepCount", exact: 1 }]],
  ["wf-create-02", "Echo plus summarize", "Create a workflow with echo (@ecp/test.echo) then summarize (@ecp/demo.summarize) passing echo output.", [{ kind: "stepCount", min: 2 }, { kind: "stepUses", capabilityId: "@ecp/demo.summarize" }]],
  ["wf-create-03", "Validate then echo", "Build a workflow: first @ecp/demo.validate then @ecp/test.echo.", [{ kind: "stepUses", capabilityId: "@ecp/demo.validate" }]],
  ["wf-create-04", "Notify step", "Create workflow with @ecp/test.echo and a final @ecp/demo.notify step.", [{ kind: "stepUses", capabilityId: "@ecp/demo.notify" }]],
  ["wf-create-05", "Translate branch", "Create a two-step workflow using @ecp/test.echo and @ecp/demo.translate.", [{ kind: "stepUses", capabilityId: "@ecp/demo.translate" }]],
  ["wf-create-06", "Spanish label", "Crea un flujo con un paso echo usando @ecp/test.echo.", [{ kind: "stepUses", capabilityId: "@ecp/test.echo" }]],
  ["wf-create-07", "French label", "Créez un workflow avec une étape @ecp/test.echo.", [{ kind: "stepUses", capabilityId: "@ecp/test.echo" }]],
  ["wf-create-08", "German label", "Erstelle einen Workflow mit @ecp/test.echo.", [{ kind: "stepUses", capabilityId: "@ecp/test.echo" }]],
  ["wf-create-09", "Triple steps", "Create a 3-step workflow using @ecp/demo.validate, @ecp/test.echo, and @ecp/demo.summarize.", [{ kind: "stepCount", min: 3 }]],
  ["wf-create-10", "Workflow id minimal-echo", "Create workflow id minimal-echo with one @ecp/test.echo step labeled Runner.", [{ kind: "stepUses", capabilityId: "@ecp/test.echo" }]],
  ["wf-create-11", "Quality judge", "Design a clear production workflow using @ecp/test.echo for ingestion.", [], { enabled: true, goal: "Workflow is coherent and references echo capability", requireApproved: true }],
  ["wf-create-12", "Descriptor caps", "List capabilities then create echo-only workflow with @ecp/test.echo.", [{ kind: "descriptorListsCapabilities", ids: ["@ecp/test.echo", "@ecp/demo.summarize"] }]],
].map(([id, title, request, extra, judge]) => ({
  id,
  suite: "workflow-create",
  title,
  harness: "workflow-authoring",
  model: "default",
  input: { request },
  assertions: { deterministic: [...baseDet, ...extra], judge: judge ?? { enabled: false } },
}))

const patches = [
  ["wf-patch-01", "Label change", "Change the echo step label to Patched Echo.", "workflows/echo-workflow.json", [{ kind: "stepLabel", stepId: "echo", value: "Patched Echo" }]],
  ["wf-patch-02", "Input value", "Set echo input value to world.", "workflows/echo-workflow.json", []],
  ["wf-patch-03", "Add summarize", "Add a summarize step after echo using @ecp/demo.summarize.", "workflows/echo-workflow.json", [{ kind: "stepCount", min: 2 }]],
  ["wf-patch-04", "Remove notify", "Remove the notify step from the workflow.", "workflows/multi-cap-workflow.json", [{ kind: "stepRemoved", stepId: "notify" }]],
  ["wf-patch-05", "Workflow label", "Change workflow label to Updated Chain.", "workflows/two-step-chain.json", []],
  ["wf-patch-06", "Step config", "Change summarize step label to Short Summary.", "workflows/two-step-chain.json", [{ kind: "stepLabel", stepId: "summarize", value: "Short Summary" }]],
  ["wf-patch-07", "Ref chain", "Ensure summarize input references echo output via $ref.", "workflows/two-step-chain.json", [{ kind: "inputRefPresent", stepId: "summarize" }]],
  ["wf-patch-08", "Add validate", "Insert a validate step before echo using @ecp/demo.validate.", "workflows/echo-workflow.json", [{ kind: "stepUses", capabilityId: "@ecp/demo.validate" }]],
  ["wf-patch-09", "Combined", "Add translate after echo and remove summarize if present.", "workflows/two-step-chain.json", []],
  ["wf-patch-10", "Patch judge", "Improve echo label to be user friendly.", "workflows/echo-workflow.json", [], { enabled: true, goal: "Patch is minimal and correct", requireApproved: true }],
  ["wf-patch-11", "Translate label", "Rename echo label to Translated Output.", "workflows/echo-workflow.json", []],
  ["wf-patch-12", "Notify payload", "Update notify step to run after echo in multi-cap workflow.", "workflows/multi-cap-workflow.json", []],
].map(([id, title, request, baseline, extra, judge]) => ({
  id,
  suite: "workflow-patch",
  title,
  harness: "workflow-authoring",
  model: "default",
  baselineWorkflow: baseline,
  input: { request },
  assertions: {
    deterministic: [
      { kind: "invokeSuccess" },
      { kind: "artifactSchema", value: "@ecp.workflow" },
      { kind: "validationValid" },
      ...extra,
    ],
    judge: judge ?? { enabled: false },
  },
}))

const intents = [
  ["intent-01", "Salutation", "Hello there!", "general", false],
  ["intent-02", "FAQ", "What is ECP?", "faq", false],
  ["intent-03", "Create", "Create a new workflow that sends a summary email.", "workflow-create", true],
  ["intent-04", "Patch", "Update the echo step to use value world.", "workflow-patch", false],
  ["intent-05", "Capabilities", "What extensions are available in this environment?", "general", true],
  ["intent-06", "Error symptom", "My workflow failed on the echo step with an error.", "workflow-patch", true],
  ["intent-07", "Bonjour", "Bonjour!", "general", false],
  ["intent-08", "Hola create", "Crea un flujo nuevo con echo.", "workflow-create", true],
  ["intent-09", "General chat", "Tell me a joke.", "general", true],
  ["intent-10", "Patch config", "Change the workflow step configuration for summarize.", "workflow-patch", false],
  ["intent-11", "FAQ how", "How does workflow patching work?", "faq", true],
  ["intent-12", "Build", "Build a pipeline with echo and notify.", "workflow-create", true],
].map(([id, title, message, intent, judge]) => ({
  id,
  suite: "intent",
  title,
  harness: "intent-classification",
  model: "default",
  input: { message },
  assertions: {
    deterministic: [
      { kind: "invokeSuccess" },
      { kind: "intent", value: intent },
      { kind: "descriptorListsExtensions", ids: matrixExt },
    ],
    judge: judge
      ? { enabled: true, goal: `Intent should be ${intent}`, requireApproved: true }
      : { enabled: false },
  },
}))

const assistants = [
  ["asst-01", "Failed echo", "Why did step echo fail?", "runs/failed-echo-step.json", [{ kind: "answerContains", text: "echo" }], true],
  ["asst-02", "Failed status", "What is the run status?", "runs/failed-echo-step.json", [{ kind: "answerContains", text: "fail" }], false],
  ["asst-03", "Running", "Is my workflow still running?", "runs/running-pending.json", [{ kind: "answerContains", text: "start" }], false],
  ["asst-04", "Extensions", "What plugins and extensions can you use?", null, [{ kind: "answerContains", text: "ecp" }], true],
  ["asst-05", "Steps", "What steps are in the workflow?", "runs/failed-echo-step.json", [], false],
  ["asst-06", "Fix suggest", "How can I fix the echo error?", "runs/failed-echo-step.json", [{ kind: "citationStepId", value: "echo" }], true],
  ["asst-07", "Output", "What did the echo step produce?", "runs/completed-with-refs.json", [], false],
  ["asst-08", "Tone judge", "Explain the failure politely.", "runs/failed-echo-step.json", [], { enabled: true, goal: "Professional helpful tone", rubric: "Accurate and actionable", requireApproved: true }],
  ["asst-09", "Confirm patch", "Should we patch step echo input?", "runs/failed-echo-step.json", [], true],
  ["asst-10", "Capabilities list", "List supported step capabilities.", null, [{ kind: "answerContains", text: "test.echo" }], true],
].map(([id, title, message, runFixture, extra, judge]) => ({
  id,
  suite: "assistant",
  title,
  harness: "workflow-assistant",
  model: "default",
  input: {
    message,
    ...(runFixture ? { runContextFixture: runFixture } : {}),
  },
  assertions: {
    deterministic: [
      { kind: "invokeSuccess" },
      { kind: "replySchema" },
      ...extra,
    ],
    judge: typeof judge === "object" ? judge : judge ? { enabled: true, goal: title, requireApproved: true } : { enabled: false },
  },
}))

const flows = [
  {
    id: "flow-01",
    suite: "flow",
    title: "Troubleshoot then patch",
    model: "default",
    steps: [
      {
        harness: "intent-classification",
        input: { message: "The workflow failed on echo, help me fix it." },
        assertions: { deterministic: [{ kind: "intent", value: "workflow-patch" }], judge: { enabled: false } },
      },
      {
        harness: "workflow-authoring",
        input: {
          request: "Set echo input value to recovered.",
          manifestRef: "workflows/echo-workflow.json",
        },
        assertions: { deterministic: [{ kind: "validationValid" }], judge: { enabled: false } },
      },
      {
        harness: "workflow-assistant",
        input: {
          message: "Confirm the fix applies to step echo?",
          runContextFixture: "runs/failed-echo-step.json",
        },
        assertions: {
          deterministic: [{ kind: "replySchema" }],
          judge: { enabled: true, goal: "Confirms echo step", requireApproved: true },
        },
      },
    ],
  },
  {
    id: "flow-02",
    suite: "flow",
    title: "Create routing",
    model: "default",
    steps: [
      {
        harness: "intent-classification",
        input: { message: "I need a new workflow with echo and summarize." },
        assertions: { deterministic: [{ kind: "intent", value: "workflow-create" }], judge: { enabled: false } },
      },
      {
        harness: "workflow-authoring",
        input: {
          request: "Create echo then @ecp/demo.summarize workflow.",
        },
        assertions: { deterministic: [{ kind: "artifactSchema", value: "@ecp.workflow" }], judge: { enabled: false } },
      },
    ],
  },
  {
    id: "flow-03",
    suite: "flow",
    title: "FAQ then general",
    model: "default",
    steps: [
      {
        harness: "intent-classification",
        input: { message: "How does patching work?" },
        assertions: { deterministic: [{ kind: "intent", value: "faq" }], judge: { enabled: false } },
      },
      {
        harness: "intent-classification",
        input: { message: "Thanks!" },
        assertions: { deterministic: [{ kind: "intent", value: "general" }], judge: { enabled: false } },
      },
    ],
  },
  {
    id: "flow-04",
    suite: "flow",
    title: "Patch chain refs",
    model: "default",
    steps: [
      {
        harness: "workflow-authoring",
        input: {
          request: "Ensure summarize uses $ref to echo output.",
          manifestRef: "workflows/two-step-chain.json",
        },
        assertions: { deterministic: [{ kind: "inputRefPresent", stepId: "summarize" }], judge: { enabled: false } },
      },
      {
        harness: "workflow-assistant",
        input: {
          message: "Did the chain run complete?",
          runContextFixture: "runs/completed-with-refs.json",
        },
        assertions: { deterministic: [{ kind: "replySchema" }], judge: { enabled: true, goal: "Mentions completed run", requireApproved: true } },
      },
    ],
  },
  {
    id: "flow-05",
    suite: "flow",
    title: "Salutation to create",
    model: "default",
    steps: [
      {
        harness: "intent-classification",
        input: { message: "Hi!" },
        assertions: { deterministic: [{ kind: "intent", value: "general" }], judge: { enabled: false } },
      },
      {
        harness: "intent-classification",
        input: { message: "Actually create an echo workflow." },
        assertions: { deterministic: [{ kind: "intent", value: "workflow-create" }], judge: { enabled: false } },
      },
      {
        harness: "workflow-authoring",
        input: { request: "Create minimal @ecp/test.echo workflow." },
        assertions: { deterministic: [{ kind: "stepUses", capabilityId: "@ecp/test.echo" }], judge: { enabled: false } },
      },
    ],
  },
  {
    id: "flow-06",
    suite: "flow",
    title: "Error explain and patch",
    model: "default",
    steps: [
      {
        harness: "workflow-assistant",
        input: {
          message: "What error occurred?",
          runContextFixture: "runs/failed-echo-step.json",
        },
        assertions: {
          deterministic: [{ kind: "answerContains", text: "error" }],
          judge: { enabled: true, goal: "Describes echo failure", requireApproved: true },
        },
      },
      {
        harness: "workflow-authoring",
        input: {
          request: "Fix echo input to hello.",
          manifestRef: "workflows/echo-workflow.json",
        },
        assertions: { deterministic: [{ kind: "validationValid" }], judge: { enabled: false } },
      },
      {
        harness: "workflow-assistant",
        input: {
          message: "Where should the fix be applied?",
          runContextFixture: "runs/failed-echo-step.json",
        },
        assertions: {
          deterministic: [{ kind: "citationStepId", value: "echo" }],
          judge: { enabled: true, goal: "Points to echo step", requireApproved: true },
        },
      },
    ],
  },
]

writeSuite("workflow-create", creates)
writeSuite("workflow-patch", patches)
writeSuite("intent", intents)
writeSuite("assistant", assistants)
writeSuite("flow", flows)
console.log("Wrote", creates.length + patches.length + intents.length + assistants.length + flows.length, "cases")
