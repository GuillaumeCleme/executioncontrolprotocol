import { useEffect, useId, useState } from "react"
import { renderMermaidDiagram } from "../lib/mermaid-render.js"

/** Props for {@link MermaidDiagramViewer}. */
export interface MermaidDiagramViewerProps {
  /** Mermaid flowchart source from @ecp/format-mermaid. */
  source: string
  /** Shown when source is empty. */
  emptyMessage?: string
}

/** Render a Mermaid diagram (not raw source). */
export function MermaidDiagramViewer({
  source,
  emptyMessage = "Generate a workflow to see the graph.",
}: MermaidDiagramViewerProps) {
  const baseId = useId().replace(/:/g, "")
  const [svg, setSvg] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [showSource, setShowSource] = useState(false)

  useEffect(() => {
    if (!source.trim() || source.includes("empty[No workflow]")) {
      setSvg("")
      setError(null)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const html = await renderMermaidDiagram(source, `mmd-${baseId}-${Date.now()}`)
        if (!cancelled) {
          setSvg(html)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setSvg("")
          setError(err instanceof Error ? err.message : String(err))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [source, baseId])

  if (!source.trim() || source.includes("empty[No workflow]")) {
    return <p className="panel-empty">{emptyMessage}</p>
  }

  if (error) {
    return (
      <div className="mermaid-viewer mermaid-viewer--error">
        <p className="panel-error">{error}</p>
        <button type="button" className="link-btn" onClick={() => setShowSource((v) => !v)}>
          {showSource ? "Hide source" : "View source"}
        </button>
        {showSource ? <pre className="mermaid-source">{source}</pre> : null}
      </div>
    )
  }

  if (!svg) {
    return <p className="panel-empty">Rendering diagram...</p>
  }

  return (
    <div className="mermaid-viewer">
      <div className="mermaid-viewer__diagram" dangerouslySetInnerHTML={{ __html: svg }} />
      <button type="button" className="link-btn" onClick={() => setShowSource((v) => !v)}>
        {showSource ? "Hide source" : "View source"}
      </button>
      {showSource ? <pre className="mermaid-source">{source}</pre> : null}
    </div>
  )
}
