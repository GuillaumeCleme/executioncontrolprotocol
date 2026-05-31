/** Mermaid flowchart direction (first line: `flowchart <direction>`). @category Encoding */
export type MermaidFlowchartDirection = "TD" | "LR" | "RL" | "BT"

/** Options for `@ecp/format-mermaid` encode (via `ecp.encode(...).uses("@ecp/format-mermaid").with({...})`). @category Encoding */
export interface MermaidEncodeOptions {
  /** Flowchart direction. Default `TD`. Use `LR` for left-to-right. */
  direction?: MermaidFlowchartDirection
}

/** Resolve Mermaid header line from encode options. @category Encoding */
export function mermaidFlowchartHeader(options?: MermaidEncodeOptions): string {
  const direction = options?.direction ?? "TD"
  return `flowchart ${direction}`
}
