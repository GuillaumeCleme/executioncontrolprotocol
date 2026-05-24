import type { ValidationResult } from "@ecp/types"
import type { WorkflowTab } from "../types/workspace.js"
import { MermaidDiagramViewer } from "./MermaidDiagramViewer.js"

/** Props for {@link WorkflowPanel}. */
export interface WorkflowPanelProps {
  tab: WorkflowTab
  onTabChange: (tab: WorkflowTab) => void
  mermaid: string
  validation: ValidationResult | null
  runOutput: string
  runBusy: boolean
  onRun: () => void
  onClose: () => void
}

const TABS: WorkflowTab[] = ["graph", "validation", "run"]

/** Workflow visualization and runtime panel. */
export function WorkflowPanel({
  tab,
  onTabChange,
  mermaid,
  validation,
  runOutput,
  runBusy,
  onRun,
  onClose,
}: WorkflowPanelProps) {
  return (
    <section className="workspace-panel workspace-panel--workflow">
      <header className="panel-header">
        <span>Workflow</span>
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
      <div className="panel-body">
        {tab === "graph" ? <MermaidDiagramViewer source={mermaid} /> : null}
        {tab === "validation" ? <ValidationView validation={validation} /> : null}
        {tab === "run" ? (
          <div className="run-panel">
            <button type="button" disabled={runBusy} onClick={onRun}>
              {runBusy ? "Running..." : "Run workflow"}
            </button>
            <pre className="panel-pre">{runOutput || "Run output will appear here."}</pre>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function ValidationView({ validation }: { validation: ValidationResult | null }) {
  if (!validation) return <p className="panel-empty">No validation result yet.</p>
  if (validation.valid) return <p className="panel-ok">Workflow is valid.</p>
  return (
    <ul className="validation-list">
      {[...validation.errors, ...validation.warnings].map((issue, i) => (
        <li key={`${issue.code}-${i}`}>
          <strong>{issue.severity}</strong> [{issue.code}] {issue.message}
          {issue.path ? ` (${issue.path})` : ""}
        </li>
      ))}
    </ul>
  )
}
