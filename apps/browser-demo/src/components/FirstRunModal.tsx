import { useState } from "react"
import { setBrowserSessionValue } from "@ecp/browser"
import type { ProviderMode } from "../lib/provider-mode.js"

/** Props for {@link FirstRunModal}. */
export interface FirstRunModalProps {
  chromeAvailable: boolean
  onComplete: (mode: ProviderMode) => void
}

/** First-run provider selection modal. */
export function FirstRunModal({ chromeAvailable, onComplete }: FirstRunModalProps) {
  const [mode, setMode] = useState<ProviderMode>(chromeAvailable ? "chrome-ai" : "demo")
  const [openaiKey, setOpenaiKey] = useState("")
  const [anthropicKey, setAnthropicKey] = useState("")

  const submit = () => {
    if (mode === "openai" && openaiKey.trim()) {
      setBrowserSessionValue("OPENAI_API_KEY", openaiKey.trim())
    }
    if (mode === "claude" && anthropicKey.trim()) {
      setBrowserSessionValue("ANTHROPIC_API_KEY", anthropicKey.trim())
    }
    onComplete(mode)
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="first-run-title">
      <div className="modal-card">
        <h2 id="first-run-title">Choose a model provider</h2>
        <p className="modal-sub">API keys stay in memory for this session only.</p>
        <div className="provider-options">
          <label>
            <input
              type="radio"
              name="provider"
              checked={mode === "chrome-ai"}
              disabled={!chromeAvailable}
              onChange={() => setMode("chrome-ai")}
            />
            Chrome built-in AI {!chromeAvailable ? "(unavailable)" : ""}
          </label>
          <label>
            <input type="radio" name="provider" checked={mode === "openai"} onChange={() => setMode("openai")} />
            OpenAI
          </label>
          <label>
            <input type="radio" name="provider" checked={mode === "claude"} onChange={() => setMode("claude")} />
            Claude
          </label>
          <label>
            <input type="radio" name="provider" checked={mode === "demo"} onChange={() => setMode("demo")} />
            Demo mode (offline)
          </label>
        </div>
        {mode === "openai" ? (
          <input
            type="password"
            placeholder="OpenAI API key"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
          />
        ) : null}
        {mode === "claude" ? (
          <input
            type="password"
            placeholder="Anthropic API key"
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
          />
        ) : null}
        <button type="button" className="modal-primary" onClick={submit}>
          Continue
        </button>
      </div>
    </div>
  )
}
