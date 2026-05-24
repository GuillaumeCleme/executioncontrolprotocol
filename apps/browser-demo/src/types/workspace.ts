/** Workspace panel layout for browser demo. */
export type WorkspaceLayout = "empty" | "workflow-full" | "code-full" | "split-code-workflow"

/** Bottom-docked chat panel height mode. */
export type ChatPanelState = "expanded" | "compact" | "collapsed"

/** Code panel tab ids. */
export type CodeTab = "fluent" | "json" | "toon" | "patch"

/** Workflow panel tab ids. */
export type WorkflowTab = "graph" | "validation" | "capabilities" | "run"

/** Chat message in history. */
export interface ChatMessage {
  id: string
  role: "user" | "agent"
  text: string
}
