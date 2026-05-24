import type { Ecp } from "@ecp/core"
import type { EcpPatchInput, ValidationResult, WorkflowManifest } from "@ecp/types"

/** UI-ready encoded panel outputs. @category Authoring */
export interface AuthoringPanels {
  /** Fluent API source. */
  fluent: string
  /** JSON manifest string. */
  json: string
  /** Compact TOON workflow. */
  toon: string
  /** Mermaid flowchart source. */
  mermaid: string
  /** Latest patch TOON (empty when none). */
  patch: string
}

/** Result of creating a workflow from a user prompt. @category Authoring */
export interface CreateWorkflowResult {
  /** Parsed workflow manifest. */
  manifest: WorkflowManifest
  /** Validation after decode/compile. */
  validation: ValidationResult
  /** Encoded panel content. */
  panels: AuthoringPanels
}

/** Result of patching a workflow from a user prompt. @category Authoring */
export interface PatchWorkflowResult {
  /** Patched manifest. */
  manifest: WorkflowManifest
  /** Validation of patched manifest. */
  validation: ValidationResult
  /** Encoded panel content. */
  panels: AuthoringPanels
  /** Raw patch TOON returned by the model. */
  patchToon: string
}

/**
 * Browser demo authoring orchestration on top of {@link Ecp}.
 * @category Authoring
 */
export class BrowserAuthoringService {
  constructor(private readonly ecp: Ecp) {}

  /**
   * Create a workflow from natural language using a model provider capability.
   * @category Authoring
   */
  async createWorkflow(input: {
    userRequest: string
    providerCapabilityId: string
  }): Promise<CreateWorkflowResult> {
    const descriptor = await this.ecp.describe()
    const descriptorToon = await this.ecp
      .encode(descriptor)
      .uses("@ecp/format-toon")
      .with({ headers: false, compact: true })
      .process()

    const generated = await this.ecp
      .invoke(input.providerCapabilityId)
      .with({
        prompt: [
          "Return only a compact TOON @ecp.workflow document for this request.",
          `User request: ${input.userRequest}`,
          "Environment descriptor (TOON):",
          String(descriptorToon.result ?? ""),
        ].join("\n"),
        system: "Return only ECP TOON workflow text. No markdown fences.",
      })
      .process()

    if (!generated.success || !generated.result) {
      throw new Error(
        generated.diagnostics.map((d) => d.message).join("; ") || "Model generation failed"
      )
    }

    const text =
      typeof generated.result === "object" && generated.result !== null && "text" in generated.result
        ? String((generated.result as { text: string }).text)
        : String(generated.result)

    const decoded = await this.ecp
      .decode(text)
      .uses("@ecp/format-toon")
      .to("@ecp.workflow")
      .with({ headers: false, compact: true })
      .process()

    if (!decoded.success || !decoded.result) {
      throw new Error(
        decoded.diagnostics.map((d) => d.message).join("; ") || "Failed to decode workflow TOON"
      )
    }

    const manifest = decoded.result as WorkflowManifest
    const validation = await this.ecp.validate(manifest)
    const panels = await this.encodePanels(manifest)
    return { manifest, validation, panels }
  }

  /**
   * Patch an existing workflow from natural language.
   * @category Authoring
   */
  async patchWorkflow(input: {
    userRequest: string
    manifest: WorkflowManifest
    providerCapabilityId: string
  }): Promise<PatchWorkflowResult> {
    const descriptor = await this.ecp.describe()
    const [descriptorToon, workflowToon] = await Promise.all([
      this.ecp
        .encode(descriptor)
        .uses("@ecp/format-toon")
        .with({ headers: false, compact: true })
        .process(),
      this.ecp
        .encode(input.manifest)
        .uses("@ecp/format-toon")
        .with({ headers: false, compact: true })
        .process(),
    ])

    const generated = await this.ecp
      .invoke(input.providerCapabilityId)
      .with({
        prompt: [
          "Return only compact TOON for schema @ecp.patch.",
          `User request: ${input.userRequest}`,
          "Environment descriptor (TOON):",
          String(descriptorToon.result ?? ""),
          "Current workflow (TOON):",
          String(workflowToon.result ?? ""),
        ].join("\n"),
        system: "Return only ECP TOON patch document. No markdown fences.",
      })
      .process()

    if (!generated.success || !generated.result) {
      throw new Error(
        generated.diagnostics.map((d) => d.message).join("; ") || "Model generation failed"
      )
    }

    const text =
      typeof generated.result === "object" && generated.result !== null && "text" in generated.result
        ? String((generated.result as { text: string }).text)
        : String(generated.result)

    const decodedPatch = await this.ecp
      .decode(text)
      .uses("@ecp/format-toon")
      .to("@ecp.patch")
      .with({ headers: false, compact: true })
      .process()

    if (!decodedPatch.success || !decodedPatch.result) {
      throw new Error(
        decodedPatch.diagnostics.map((d) => d.message).join("; ") ||
          "Failed to decode patch TOON"
      )
    }

    const patched = await this.ecp
      .patch(input.manifest)
      .with(decodedPatch.result as EcpPatchInput)
      .process()
    if (!patched.success || !patched.result) {
      throw new Error(
        patched.diagnostics?.map((d) => d.message).join("; ") || "Patch application failed"
      )
    }

    const manifest = patched.result as WorkflowManifest
    const validation = await this.ecp.validate(manifest)
    const panels = await this.encodePanels(manifest, text)
    return { manifest, validation, panels, patchToon: text }
  }

  /** Encode manifest into UI panel strings. @category Authoring */
  async encodePanels(manifest: WorkflowManifest, patchToon = ""): Promise<AuthoringPanels> {
    const [fluent, toon, mermaid] = await Promise.all([
      this.ecp.encode(manifest).as("fluent").with({ target: "browser", importFrom: "@ecp/browser" }).process(),
      this.ecp
        .encode(manifest)
        .uses("@ecp/format-toon")
        .with({ headers: false, compact: true })
        .process(),
      this.ecp.encode(manifest).uses("@ecp/format-mermaid").process(),
    ])

    return {
      fluent: String(fluent.result ?? ""),
      json: JSON.stringify(manifest, null, 2),
      toon: String(toon.result ?? ""),
      mermaid: String(mermaid.result ?? ""),
      patch: patchToon,
    }
  }
}
