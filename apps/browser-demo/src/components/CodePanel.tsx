import Editor from "@monaco-editor/react"
import type { CodeTab } from "../types/workspace.js"

/** Props for {@link CodePanel}. */
export interface CodePanelProps {
  tab: CodeTab
  onTabChange: (tab: CodeTab) => void
  fluent: string
  json: string
  toon: string
  patch: string
  onFluentChange?: (value: string | undefined) => void
  compileError?: string | null
  onClose: () => void
}

const TABS: CodeTab[] = ["fluent", "json", "toon", "patch"]

/** Code editor panel (Fluent / JSON / TOON / Patch). */
export function CodePanel({
  tab,
  onTabChange,
  fluent,
  json,
  toon,
  patch,
  onFluentChange,
  compileError,
  onClose,
}: CodePanelProps) {
  const value = tab === "fluent" ? fluent : tab === "json" ? json : tab === "toon" ? toon : patch
  const language = tab === "fluent" ? "typescript" : "plaintext"
  const readOnly = tab !== "fluent"

  return (
    <section className="workspace-panel workspace-panel--code">
      <header className="panel-header">
        <span>Code</span>
        <nav className="tab-nav">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={tab === t ? "tab-nav__btn tab-nav__btn--active" : "tab-nav__btn"}
              onClick={() => onTabChange(t)}
            >
              {t}
            </button>
          ))}
        </nav>
        <button type="button" className="panel-close" onClick={onClose}>
          Close
        </button>
      </header>
      {compileError && tab === "fluent" ? (
        <p className="panel-error panel-error--inline">{compileError}</p>
      ) : null}
      <Editor
        height="100%"
        theme="vs-dark"
        language={language}
        value={value}
        onChange={tab === "fluent" ? onFluentChange : undefined}
        options={{ minimap: { enabled: false }, fontSize: 13, readOnly }}
      />
    </section>
  )
}
