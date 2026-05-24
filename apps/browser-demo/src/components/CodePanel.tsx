import { FluentWorkflowEditor } from "./FluentWorkflowEditor.js"
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
  const readOnlyValue = tab === "json" ? json : tab === "toon" ? toon : tab === "patch" ? patch : ""

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
      <div className="code-editor-host">
        {tab === "fluent" ? (
          <FluentWorkflowEditor value={fluent} onChange={onFluentChange} />
        ) : (
          <pre className="panel-pre code-readonly">{readOnlyValue}</pre>
        )}
      </div>
    </section>
  )
}
