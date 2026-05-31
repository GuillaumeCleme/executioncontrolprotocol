import {
  catalogExtension,
  capabilityFor,
  defineExtension,
  globalRegistry,
  type Registry,
} from "@ecp/core"
import { z } from "zod"

const GuideChatInput = z.object({
  message: z.string(),
})

const GuideChatOutput = z.object({
  text: z.string(),
})

function guideReply(message: string): string {
  const lower = message.toLowerCase()

  if (
    lower.includes("create") &&
    (lower.includes("workflow") || lower.includes("echo") || lower.includes("build"))
  ) {
    return [
      "To generate a workflow in the editor, switch to authoring mode or ask explicitly, for example:",
      '"Create a demo echo workflow."',
      "That will produce Fluent source, a Mermaid graph, and validation results in the panels.",
    ].join(" ")
  }

  if (lower.includes("workflow") || lower.includes("fluent") || lower.includes("step")) {
    return [
      "Workflows in ECP are built from steps bound to capabilities.",
      "The left **Workflow** tab shows Fluent API source; edits compile into a manifest.",
      "The right canvas shows a Mermaid graph of the same workflow.",
      "Try: create a demo echo workflow, then open the Code sidebar to explore Fluent, JSON, and TOON.",
    ].join(" ")
  }

  if (lower.includes("environment") || lower.includes("extension") || lower.includes("capabilit")) {
    return [
      "The **Environment** tab lists extensions bound to this session (for example @ecp/test).",
      "Capabilities come from those bindings and appear in describe() output.",
      "The demo binds @ecp/test so @ecp/test.echo is available for workflow steps.",
    ].join(" ")
  }

  if (lower.includes("mermaid") || lower.includes("graph") || lower.includes("diagram")) {
    return [
      "The graph panel renders Mermaid from your workflow manifest via @ecp/format-mermaid.",
      "It updates when you chat-generate a workflow or edit Fluent source.",
    ].join(" ")
  }

  if (lower.includes("valid")) {
    return [
      "Use the **Validation** item in the top bar to see schema and binding diagnostics.",
      "Invalid workflows still appear in the editor so you can fix them.",
    ].join(" ")
  }

  if (lower.includes("run") || lower.includes("execut")) {
    return [
      "Click **Execute** in the top bar to run the current workflow against bound capabilities.",
      "Run output appears in the Run output overlay.",
    ].join(" ")
  }

  if (lower.includes("chrome") || lower.includes("model") || lower.includes("ai")) {
    return [
      "Chrome built-in AI (Gemini Nano) runs on-device after a one-time download.",
      "Choose it in provider settings; a toast shows install progress while you explore.",
      "Until it is ready, I can answer questions in this guided mode using offline help text.",
    ].join(" ")
  }

  return [
    "Welcome to the ECP Graph Editor. I am in **guided mode** (offline help).",
    "You can explore the layout, edit Fluent when a workflow exists, and read the Mermaid graph.",
    "Ask about workflows, environment, validation, or Chrome AI.",
    'To generate a workflow, say something like: "Create a demo echo workflow."',
  ].join(" ")
}

/** Browser guided onboarding chat (no external model). @category Extensions */
export const browserGuideExtension = defineExtension("@ecp", "browser")
  .withCapabilities([
    capabilityFor("@ecp/browser", "guideChat")
      .withInput(GuideChatInput)
      .withOutput(GuideChatOutput)
      .withHandler(async (raw) => {
        const input = raw as z.infer<typeof GuideChatInput>
        return { text: guideReply(input.message) }
      }),
  ])
  .build()

catalogExtension(browserGuideExtension)

/** Register browser guide extension. @category Extensions */
export async function registerBrowserGuideExtension(registry: Registry = globalRegistry): Promise<void> {
  if (!registry.getExtension("@ecp/browser")) {
    await registry.registerExtension(browserGuideExtension)
  }
}
