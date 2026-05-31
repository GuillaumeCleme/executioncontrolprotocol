import type { Ecp } from "@ecp/core"
import { normalizeWorkflowManifest } from "@ecp/core"
import type { WorkflowManifest } from "@ecp/types"
import type { AuthoringPanels } from "./browser-authoring-service.js"

/** Minimal ECP surface for panel encoding. @category Authoring */
export type BrowserPanelsEcp = Pick<Ecp, "encode">

/**
 * Encode canonical workflow manifest into independent panel views.
 * @category Authoring
 */
export async function encodeAuthoringPanels(
  ecp: BrowserPanelsEcp,
  manifest: WorkflowManifest,
  patchToon = ""
): Promise<AuthoringPanels> {
  const canonical = normalizeWorkflowManifest(manifest)

  const [fluent, toon, mermaid] = await Promise.all([
    ecp
      .encode(canonical)
      .uses("@ecp/format-fluent")
      .with({ target: "browser", importFrom: "@ecp/browser" })
      .process(),
    ecp.encode(canonical).uses("@ecp/format-toon").with({ headers: false, compact: true }).process(),
    ecp.encode(canonical).uses("@ecp/format-mermaid").with({ direction: "LR" }).process(),
  ])

  return {
    fluent: String(fluent.result ?? ""),
    json: JSON.stringify(canonical, null, 2),
    toon: String(toon.result ?? ""),
    mermaid: String(mermaid.result ?? ""),
    patch: patchToon,
  }
}
