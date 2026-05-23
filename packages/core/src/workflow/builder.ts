import { LATEST_ECP_VERSION } from "@ecp/types"
import type { EnvironmentDescriptor, ValidationResult, WorkflowManifest, WorkflowNode } from "@ecp/types"
import { slugify } from "../util/slug.js"
import type { StepBuilder } from "../bindings/step.js"
import { validateWorkflow } from "../validate/workflow.js"
import { assignUniqueStepIds } from "./assign-unique-step-ids.js"

type NodeInput = StepBuilder | WorkflowNode

function toNode(n: NodeInput): WorkflowNode {
  return "toNode" in n ? n.toNode() : n
}

/** Fluent workflow builder. @category Workflow */
export class WorkflowBuilder {
  private nodes: WorkflowNode[] = []
  private workflowId?: string

  constructor(private readonly label: string) {}

  /** Add sequential steps or flow nodes. */
  run(nodes: NodeInput[]): this {
    this.nodes.push(...nodes.map(toNode))
    return this
  }

  /** Set workflow id override. */
  id(id: string): this {
    this.workflowId = id
    return this
  }

  /** Build manifest without validation. */
  compile(): WorkflowManifest {
    return this.toManifest()
  }

  /** Alias for compile(). */
  toManifest(): WorkflowManifest {
    return assignUniqueStepIds({
      schema: "@ecp.workflow",
      version: LATEST_ECP_VERSION,
      workflow: {
        id: this.workflowId ?? slugify(this.label),
        label: this.label,
      },
      steps: this.nodes,
    })
  }

  /** Validate against optional environment descriptor. */
  validate(descriptor?: EnvironmentDescriptor): ValidationResult {
    return validateWorkflow(this.toManifest(), descriptor)
  }

  /** Graph representation for visualization. */
  toGraph(): { nodes: WorkflowNode[]; label: string } {
    return { nodes: this.nodes, label: this.label }
  }
}

/**
 * Define a workflow.
 * @category Workflow
 */
export function workflow(label: string): WorkflowBuilder {
  return new WorkflowBuilder(label)
}
