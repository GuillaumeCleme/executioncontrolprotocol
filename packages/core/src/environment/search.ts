import { LATEST_ECP_VERSION } from "@ecp/types"
import type { EnvironmentDescriptor, SearchOptions, SearchResult } from "@ecp/types"

/** Fuzzy search over environment capabilities. */
export function searchCapabilities(
  query: string,
  descriptor: EnvironmentDescriptor,
  options?: SearchOptions
): SearchResult {
  const q = query.toLowerCase()
  const types = options?.types ?? ["capability"]
  const results: SearchResult["results"] = []

  if (types.includes("capability")) {
    for (const cap of descriptor.capabilities) {
      const text = `${cap.id} ${cap.label ?? ""}`.toLowerCase()
      const score = text.includes(q) ? 0.9 : 0
      if (score > 0) {
        results.push({
          type: "capability",
          id: cap.id,
          label: cap.label,
          score,
          reason: `Matches query '${query}'`,
        })
      }
    }
  }

  results.sort((a, b) => b.score - a.score)
  const limit = options?.limit ?? 5

  return {
    schema: "@ecp.environment.search",
    version: LATEST_ECP_VERSION,
    results: results.slice(0, limit),
  }
}
