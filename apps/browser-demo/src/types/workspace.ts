/** Workspace panel layout (open panel count). */
export type WorkspaceLayout = "empty" | "panels-1" | "panels-2" | "panels-3"

/** Bottom-docked chat panel height mode. */
export type ChatPanelState = "expanded" | "compact" | "collapsed"

/** Code panel tab ids. */
export type CodeTab = "fluent" | "json" | "toon" | "patch"

/** Workflow panel tab ids. */
export type WorkflowTab = "graph" | "validation" | "run"

/** Environment panel tab ids. */
export type EnvironmentTab = "overview" | "extensions" | "capabilities"

/** Chat message in history. */
export interface ChatMessage {
  id: string
  role: "user" | "agent"
  text: string
}
