import { LATEST_ECP_VERSION } from "@ecp/types"
import type {
  CapabilityDescription,
  DescribeQuery,
  EnvironmentDescriptor,
  ExtensionDescription,
} from "@ecp/types"
import type { Registry } from "../registry/registry.js"
import type { EnvironmentManifest } from "@ecp/types"

function fuzzyMatch(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

function pickFields<T extends object>(
  obj: T,
  include?: string[]
): Partial<T> {
  if (!include || include.length === 0) return obj
  const out: Partial<T> = {}
  for (const key of include) {
    if (key in obj) (out as Record<string, unknown>)[key] = obj[key as keyof T]
  }
  return out
}

/** Build environment descriptor from registry + bindings. */
export async function buildDescriptor(
  registry: Registry,
  manifest: EnvironmentManifest,
  query?: DescribeQuery
): Promise<EnvironmentDescriptor> {

  const caps: CapabilityDescription[] = []
  for (const extBinding of manifest.extensions ?? []) {
    const def = registry.getExtension(String(extBinding.id))
    if (!def) continue
    for (const cap of def.capabilities) {
      let include = true
      if (query?.capabilities?.match) {
        const mode = query.capabilities.mode ?? "fuzzy"
        const match = query.capabilities.match
        const text = `${cap.id} ${cap.name}`
        include =
          mode === "exact"
            ? cap.id === match
            : fuzzyMatch(text, match)
      }
      if (!include) continue
      const desc: CapabilityDescription = {
        id: cap.id,
        label: cap.name,
        extension: def.id,
        inputSchema: cap.inputSchema,
        outputSchema: cap.outputSchema,
      }
      caps.push(
        pickFields(desc, query?.capabilities?.include) as CapabilityDescription
      )
    }
  }

  const limit = query?.capabilities?.limit ?? caps.length
  const extensions: ExtensionDescription[] = (manifest.extensions ?? []).map(
    (e, i) => ({
      id: String(e.id),
      label: e.label,
      order: e.order ?? i,
      capabilities: registry.getExtension(String(e.id))?.capabilities.map((c) => c.id) ?? [],
    })
  )

  return {
    schema: "@ecp.environment.describe",
    version: LATEST_ECP_VERSION,
    environment: manifest.environment,
    runtime: {
      id: String(manifest.runtime?.id ?? "@ecp/local"),
      label: manifest.runtime?.label,
      features: {
        loops: true,
        parallel: true,
        branches: true,
        pauses: true,
        cancellation: true,
      },
    },
    extensions,
    capabilities: caps.slice(0, limit),
    policies: (manifest.policies ?? []).map((p) => {
      const def = registry.getPolicy(String(p.id))
      return {
        id: String(p.id),
        label: p.label,
        summary: def?.name,
        config: p.config,
        configSchema: def?.configSchema,
      }
    }),
  }
}
