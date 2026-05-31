import { useCallback, useState } from "react"
import type { AssistantMode } from "../lib/provider-mode.js"
import type { ChatMessage } from "../types/workspace.js"

let messageCounter = 0

function nextId(): string {
  messageCounter += 1
  return `msg-${messageCounter}`
}

const GUIDED_WELCOME =
  "Welcome to the ECP Graph Editor. I am your guided assistant (offline). Ask about workflows, the environment, Mermaid graphs, or validation. When you are ready to generate a workflow, say something like: create a demo echo workflow."

const AUTHORING_WELCOME =
  "Describe a workflow to create, or ask for changes once one exists."

/** Chat history and status helpers. */
export function useChatHistory(initialMode: AssistantMode = "authoring") {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nextId(),
      role: "agent",
      text: initialMode === "guided" ? GUIDED_WELCOME : AUTHORING_WELCOME,
    },
  ])
  const [status, setStatus] = useState("Ready")

  const appendUser = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text }])
  }, [])

  const appendAgent = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "agent", text, variant: "normal" }])
  }, [])

  const appendAgentError = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "agent", text, variant: "error" }])
  }, [])

  const setGuidedWelcome = useCallback(() => {
    setMessages([{ id: nextId(), role: "agent", text: GUIDED_WELCOME }])
  }, [])

  return { messages, status, setStatus, appendUser, appendAgent, appendAgentError, setGuidedWelcome }
}
