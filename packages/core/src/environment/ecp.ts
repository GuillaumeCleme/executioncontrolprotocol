import type {
  DescribeQuery,
  EnvironmentDescriptor,
  SearchOptions,
  SearchResult,
  ValidationResult,
  WorkflowManifest,
} from "@ecp/types"
import type { Registry } from "../registry/registry.js"
import type { Environment } from "./environment.js"
import type { DecodeOperationBuilder } from "../encoding/decode-builder.js"
import type { EncodeOperationBuilder } from "../encoding/encode-builder.js"
import type { PatchOperationBuilder } from "../patch/patch-builder.js"

/**
 * Initialized operational ECP instance (returned from {@link Environment.init}).
 * @category Environment
 */
export interface Ecp {
  /** Environment id. */
  id: string
  /** Optional label. */
  label?: string
  /** Environment discovery descriptor. */
  describe(query?: DescribeQuery): Promise<EnvironmentDescriptor>
  /** Search capabilities and policies. */
  search(query: string, options?: SearchOptions): Promise<SearchResult>
  /** Encode a document via format extensions or JSON. */
  encode(input: unknown): EncodeOperationBuilder
  /** Decode encoded content via format extensions or JSON. */
  decode(input: unknown): DecodeOperationBuilder
  /** Apply a canonical JSON patch to a document. */
  patch<T = unknown>(document: T): PatchOperationBuilder<T>
  /** Validate a workflow manifest. */
  validate(workflow: WorkflowManifest): Promise<ValidationResult>
  /** Underlying registry. */
  getRegistry(): Registry
  /** Terminate the environment and release resources. */
  terminate(): Promise<void>
}

/**
 * Operational facade over a prepared {@link Environment}.
 * @category Environment
 */
export class EcpImpl implements Ecp {
  constructor(private readonly env: Environment) {}

  get id(): string {
    return this.env.getEnvId()
  }

  get label(): string | undefined {
    return this.env.getEnvLabel()
  }

  describe(query?: DescribeQuery): Promise<EnvironmentDescriptor> {
    return this.env.describe(query)
  }

  search(query: string, options?: SearchOptions): Promise<SearchResult> {
    return this.env.search(query, options)
  }

  encode(input: unknown): EncodeOperationBuilder {
    return this.env.encode(input)
  }

  decode(input: unknown): DecodeOperationBuilder {
    return this.env.decode(input)
  }

  patch<T = unknown>(document: T): PatchOperationBuilder<T> {
    return this.env.patch(document)
  }

  validate(workflow: WorkflowManifest): Promise<ValidationResult> {
    return this.env.validate(workflow)
  }

  getRegistry(): Registry {
    return this.env.getRegistry()
  }

  terminate(): Promise<void> {
    return this.env.dispose()
  }
}
