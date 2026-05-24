import type { ChatPanelState } from "../types/workspace.js"
import type { ChatMessage } from "../types/workspace.js"

const CHAT_HEIGHT: Record<ChatPanelState, string> = {
  expanded: "min(68vh, 720px)",
  compact: "280px",
  collapsed: "72px",
}

/** Props for {@link ChatPanel}. */
export interface ChatPanelProps {
  chat: ChatPanelState
  onChatChange: (state: ChatPanelState) => void
  messages: ChatMessage[]
  status: string
  prompt: string
  onPromptChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  hero?: boolean
}

/** Bottom-docked chat panel. */
export function ChatPanel({
  chat,
  onChatChange,
  messages,
  status,
  prompt,
  onPromptChange,
  onSubmit,
  disabled,
  hero = false,
}: ChatPanelProps) {
  const visibleMessages = chat === "collapsed" ? messages.slice(-1) : messages.slice(-8)

  return (
    <section
      className={`chat-panel chat-panel--${chat}${hero ? " chat-panel--hero" : ""}`}
      style={{ height: CHAT_HEIGHT[chat] }}
    >
      <header className="chat-panel__header">
        <span className="chat-panel__title">{hero ? "ECP Browser Demo" : "Chat"}</span>
        <span className="chat-panel__status">{status}</span>
        <div className="chat-panel__controls">
          <button type="button" onClick={() => onChatChange("expanded")} aria-pressed={chat === "expanded"}>
            Expand
          </button>
          <button type="button" onClick={() => onChatChange("compact")} aria-pressed={chat === "compact"}>
            Compact
          </button>
          <button type="button" onClick={() => onChatChange("collapsed")} aria-pressed={chat === "collapsed"}>
            Collapse
          </button>
        </div>
      </header>
      {chat !== "collapsed" ? (
        <div className="chat-panel__history">
          {visibleMessages.map((m) => (
            <div key={m.id} className={`chat-msg chat-msg--${m.role}`}>
              <strong>{m.role === "user" ? "You" : "Agent"}:</strong> {m.text}
            </div>
          ))}
        </div>
      ) : null}
      <div className="chat-panel__input-row">
        <input
          value={prompt}
          disabled={disabled}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe a workflow or change..."
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit()
          }}
        />
        <button type="button" disabled={disabled} onClick={onSubmit}>
          Send
        </button>
      </div>
    </section>
  )
}
