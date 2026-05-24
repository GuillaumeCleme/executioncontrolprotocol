import { useCallback, useMemo, useState } from "react"
import type { ChatPanelState } from "../types/workspace.js"

function openPanelCount(codeOpen: boolean, workflowOpen: boolean, environmentOpen: boolean): number {
  return [codeOpen, workflowOpen, environmentOpen].filter(Boolean).length
}

/** Manage workspace layout and chat dock state. */
export function useWorkspaceLayout() {
  const [chat, setChat] = useState<ChatPanelState>("expanded")
  const [codeOpen, setCodeOpen] = useState(false)
  const [workflowOpen, setWorkflowOpen] = useState(false)
  const [environmentOpen, setEnvironmentOpen] = useState(false)

  const workspace = useMemo(() => {
    const count = openPanelCount(codeOpen, workflowOpen, environmentOpen)
    if (count === 0) return "empty"
    if (count === 1) return "panels-1"
    if (count === 2) return "panels-2"
    return "panels-3"
  }, [codeOpen, workflowOpen, environmentOpen])

  const snapChatForWorkspace = useCallback(() => {
    setChat((current) => (current === "expanded" ? "compact" : current))
  }, [])

  const openWorkflow = useCallback(() => {
    setWorkflowOpen(true)
    snapChatForWorkspace()
  }, [snapChatForWorkspace])

  const openCode = useCallback(() => {
    setCodeOpen(true)
    snapChatForWorkspace()
  }, [snapChatForWorkspace])

  const openEnvironment = useCallback(() => {
    setEnvironmentOpen(true)
    snapChatForWorkspace()
  }, [snapChatForWorkspace])

  const closeWorkflow = useCallback(() => {
    setWorkflowOpen(false)
    if (!codeOpen && !environmentOpen) setChat("expanded")
  }, [codeOpen, environmentOpen])

  const closeCode = useCallback(() => {
    setCodeOpen(false)
    if (!workflowOpen && !environmentOpen) setChat("expanded")
  }, [workflowOpen, environmentOpen])

  const closeEnvironment = useCallback(() => {
    setEnvironmentOpen(false)
    if (!codeOpen && !workflowOpen) setChat("expanded")
  }, [codeOpen, workflowOpen])

  const onFirstWorkflow = useCallback(() => {
    setWorkflowOpen(true)
    setChat("compact")
  }, [])

  return {
    workspace,
    chat,
    setChat,
    codeOpen,
    workflowOpen,
    environmentOpen,
    openWorkflow,
    openCode,
    openEnvironment,
    closeWorkflow,
    closeCode,
    closeEnvironment,
    onFirstWorkflow,
  }
}
