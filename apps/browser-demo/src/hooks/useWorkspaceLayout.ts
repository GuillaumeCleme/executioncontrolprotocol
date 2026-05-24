import { useCallback, useState } from "react"
import type { ChatPanelState, WorkspaceLayout } from "../types/workspace.js"

/** Manage workspace layout and chat dock state. */
export function useWorkspaceLayout() {
  const [workspace, setWorkspace] = useState<WorkspaceLayout>("empty")
  const [chat, setChat] = useState<ChatPanelState>("expanded")
  const [codeOpen, setCodeOpen] = useState(false)
  const [workflowOpen, setWorkflowOpen] = useState(false)

  const snapChatForWorkspace = useCallback(() => {
    setChat((current) => (current === "expanded" ? "compact" : current))
  }, [])

  const openWorkflow = useCallback(() => {
    setWorkflowOpen(true)
    setWorkspace(codeOpen ? "split-code-workflow" : "workflow-full")
    snapChatForWorkspace()
  }, [codeOpen, snapChatForWorkspace])

  const openCode = useCallback(() => {
    setCodeOpen(true)
    setWorkspace(workflowOpen ? "split-code-workflow" : "code-full")
    snapChatForWorkspace()
  }, [workflowOpen, snapChatForWorkspace])

  const closeWorkflow = useCallback(() => {
    setWorkflowOpen(false)
    setWorkspace(codeOpen ? "code-full" : "empty")
    if (!codeOpen) setChat("expanded")
  }, [codeOpen])

  const closeCode = useCallback(() => {
    setCodeOpen(false)
    setWorkspace(workflowOpen ? "workflow-full" : "empty")
    if (!workflowOpen) setChat("expanded")
  }, [workflowOpen])

  const onFirstWorkflow = useCallback(() => {
    setWorkflowOpen(true)
    setWorkspace("workflow-full")
    setChat("compact")
  }, [])

  return {
    workspace,
    chat,
    setChat,
    codeOpen,
    workflowOpen,
    openWorkflow,
    openCode,
    closeWorkflow,
    closeCode,
    onFirstWorkflow,
  }
}
