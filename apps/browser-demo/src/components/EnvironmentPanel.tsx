import type { EnvironmentDescriptor } from "@ecp/types"
import type { EnvironmentTab } from "../types/workspace.js"
import type { ProviderMode } from "../lib/provider-mode.js"

/** Props for {@link EnvironmentPanel}. */
export interface EnvironmentPanelProps {
  tab: EnvironmentTab
  onTabChange: (tab: EnvironmentTab) => void
  descriptor: EnvironmentDescriptor | null
  providerMode: ProviderMode
  onRefresh: () => void
  refreshBusy: boolean
  onClose: () => void
}

const TABS: EnvironmentTab[] = ["overview", "extensions", "capabilities"]

/** Environment bindings, runtime, and registered capabilities (separate from workflow). */
export function EnvironmentPanel({
  tab,
  onTabChange,
  descriptor,
  providerMode,
  onRefresh,
  refreshBusy,
  onClose,
}: EnvironmentPanelProps) {
  return (
    <section className="workspace-panel workspace-panel--environment">
      <header className="panel-header">
        <span>Environment</span>
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
      <div className="panel-body panel-body--with-footer">
        {!descriptor ? (
          <p className="panel-empty">Environment not loaded.</p>
        ) : tab === "overview" ? (
          <OverviewView descriptor={descriptor} providerMode={providerMode} />
        ) : tab === "extensions" ? (
          <ExtensionsView descriptor={descriptor} />
        ) : (
          <CapabilitiesView descriptor={descriptor} />
        )}
        <footer className="panel-footer">
          <button type="button" className="panel-refresh" disabled={refreshBusy} onClick={onRefresh}>
            {refreshBusy ? "Refreshing..." : "Refresh describe()"}
          </button>
        </footer>
      </div>
    </section>
  )
}

function OverviewView({
  descriptor,
  providerMode,
}: {
  descriptor: EnvironmentDescriptor
  providerMode: ProviderMode
}) {
  return (
    <dl className="env-overview">
      <div>
        <dt>Environment</dt>
        <dd>{descriptor.environment.label ?? descriptor.environment.id}</dd>
      </div>
      <div>
        <dt>Runtime</dt>
        <dd>{descriptor.runtime.label ?? descriptor.runtime.id}</dd>
      </div>
      <div>
        <dt>Authoring provider</dt>
        <dd>{providerMode}</dd>
      </div>
      <div>
        <dt>Bound extensions</dt>
        <dd>{descriptor.extensions.length}</dd>
      </div>
      <div>
        <dt>Capabilities</dt>
        <dd>{descriptor.capabilities.length}</dd>
      </div>
      <div>
        <dt>Policies</dt>
        <dd>{descriptor.policies.length}</dd>
      </div>
    </dl>
  )
}

function ExtensionsView({ descriptor }: { descriptor: EnvironmentDescriptor }) {
  if (descriptor.extensions.length === 0) {
    return <p className="panel-empty">No extensions bound.</p>
  }
  return (
    <ul className="env-list">
      {descriptor.extensions.map((ext) => (
        <li key={ext.id}>
          <strong>{ext.id}</strong>
          {ext.label ? ` — ${ext.label}` : ""}
          <span className="env-list__meta">{ext.capabilities.length} capabilities</span>
        </li>
      ))}
    </ul>
  )
}

function CapabilitiesView({ descriptor }: { descriptor: EnvironmentDescriptor }) {
  if (descriptor.capabilities.length === 0) {
    return (
      <p className="panel-empty">No capabilities in environment describe(). Bind extensions first.</p>
    )
  }
  return (
    <ul className="env-list env-list--caps">
      {descriptor.capabilities.map((cap) => (
        <li key={cap.id}>
          <code>{cap.id}</code>
          {cap.label ? <span>{cap.label}</span> : null}
          <span className="env-list__meta">{cap.extension}</span>
        </li>
      ))}
    </ul>
  )
}
