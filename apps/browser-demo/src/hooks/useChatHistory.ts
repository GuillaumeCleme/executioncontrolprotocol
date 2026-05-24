import { useCallback, useState } from "react"
import type { ChatMessage } from "../types/workspace.js"

let messageCounter = 0

function nextId(): string {
  messageCounter += 1
  return `msg-${messageCounter}`
}

/** Chat history and status helpers. */
export function useChatHistory() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nextId(),
      role: "agent",
      text: "Describe a workflow to create, or ask for changes once one exists.",
    },
  ])
  const [status, setStatus] = useState("Ready")

  const appendUser = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text }])
  }, [])

  const appendAgent = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "agent", text }])
  }, [])

  return { messages, status, setStatus, appendUser, appendAgent }
}
