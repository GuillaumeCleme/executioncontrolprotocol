import type { CapabilityId, CommitMode, InputValue } from "@ecp/types"
import type { ExprValue } from "@ecp/types"
import type { StepNode } from "@ecp/types"
import { slugify } from "../util/slug.js"

/** Commit options for `.as()`. */
export interface AsOptions {
  mode?: CommitMode
}

/** Fluent step builder. @category Workflow */
export class StepBuilder {
  private input: Record<string, InputValue> = {}
  private commitAs?: string
  private commitMode?: CommitMode
  private whenExpr?: ExprValue
  private stepId?: string

  constructor(
    private readonly uses: CapabilityId | string,
    readonly label?: string
  ) {}

  /** Set step input. */
  with(input: Record<string, InputValue>): this {
    this.input = { ...this.input, ...input }
    return this
  }

  /** Conditional execution. */
  when(condition: ExprValue): this {
    this.whenExpr = condition
    return this
  }

  /** Commit output to workflow state. */
  as(key: string, options?: AsOptions): this {
    this.commitAs = key
    if (options?.mode) this.commitMode = options.mode
    return this
  }

  /** Override step id. */
  id(id: string): this {
    this.stepId = id
    return this
  }

  /** Serialize to manifest step node. */
  toNode(): StepNode {
    const id = this.stepId ?? slugify(this.label ?? String(this.uses))
    return {
      type: "step",
      id,
      ...(this.label ? { label: this.label } : {}),
      uses: this.uses,
      ...(Object.keys(this.input).length > 0 ? { input: this.input } : {}),
      ...(this.commitAs ? { commitAs: this.commitAs } : {}),
      ...(this.commitMode ? { commitMode: this.commitMode } : {}),
      ...(this.whenExpr ? { when: this.whenExpr } : {}),
    }
  }
}

/**
 * Define a workflow step.
 * @category Workflow
 */
export function step(
  ref: CapabilityId | string,
  label?: string
): StepBuilder {
  return new StepBuilder(ref, label)
}
