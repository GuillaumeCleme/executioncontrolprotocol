import type { HarnessId, NamespacedId } from "@ecp/types"
import { ECP_MODEL_GENERATE_INTERFACE } from "@ecp/types"
import type { z } from "zod"
import { getCatalogedHarness } from "./harness-catalog.js"
import type { HarnessDefinition, HarnessHandler } from "./types.js"

function toHarnessId(namespace: string, name: string): HarnessId {
  const ns = namespace.startsWith("@") ? namespace : `@${namespace}`
  return `${ns}/${name}` as HarnessId
}

/** Fluent harness definition builder. @category Harness */
export class HarnessDefinitionBuilder {
  private configSchema?: z.ZodType<unknown>
  private inputSchema?: z.ZodType<unknown>
  private outputSchema?: z.ZodType<unknown>
  private providerInterface: typeof ECP_MODEL_GENERATE_INTERFACE = ECP_MODEL_GENERATE_INTERFACE
  private handler?: HarnessHandler

  constructor(
    private readonly namespace: string,
    private readonly name: string
  ) {}

  /** Environment binding config schema. */
  withConfig(schema: z.ZodType<unknown>): this {
    this.configSchema = schema
    return this
  }

  /** Invoke input schema. */
  withInput(schema: z.ZodType<unknown>): this {
    this.inputSchema = schema
    return this
  }

  /** Invoke output schema. */
  withOutput(schema: z.ZodType<unknown>): this {
    this.outputSchema = schema
    return this
  }

  /** Required provider interface tag. */
  usesProviderInterface(iface: typeof ECP_MODEL_GENERATE_INTERFACE): this {
    this.providerInterface = iface
    return this
  }

  /** Harness evaluate handler. */
  withHandler(handler: HarnessHandler): this {
    this.handler = handler
    return this
  }

  /** Build harness definition. */
  build(): HarnessDefinition {
    if (!this.handler) {
      throw new Error(`Harness ${toHarnessId(this.namespace, this.name)} requires .withHandler()`)
    }
    const id = toHarnessId(this.namespace, this.name)
    return {
      id,
      namespace: this.namespace,
      name: this.name,
      configSchema: this.configSchema,
      inputSchema: this.inputSchema,
      outputSchema: this.outputSchema,
      providerInterface: this.providerInterface,
      handler: this.handler,
    }
  }
}

/**
 * Define a catalog harness.
 * @category Harness
 */
export function defineHarness(namespace: string, name: string): HarnessDefinitionBuilder {
  return new HarnessDefinitionBuilder(namespace, name)
}

/** Type guard for inline harness definition. @category Harness */
export function isHarnessDefinition(ref: unknown): ref is HarnessDefinition {
  return (
    typeof ref === "object" &&
    ref !== null &&
    "id" in ref &&
    "handler" in ref &&
    typeof (ref as HarnessDefinition).handler === "function"
  )
}

/** Resolve harness ref to definition. @category Harness */
export function resolveHarnessRef(ref: NamespacedId | HarnessDefinition | string): HarnessDefinition | undefined {
  if (isHarnessDefinition(ref)) return ref
  return getCatalogedHarness(ref)
}
