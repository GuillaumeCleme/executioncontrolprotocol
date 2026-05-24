/** Provider mode for the browser demo app UI. */
export type ProviderMode = "chrome-ai" | "openai" | "claude" | "demo"

const PROVIDER_CAPABILITY: Record<ProviderMode, string> = {
  "chrome-ai": "@ecp/chrome-ai.generateText",
  openai: "@ecp/openai.generateText",
  claude: "@ecp/claude.generateText",
  demo: "@ecp/demo.generateText",
}

/** Map demo provider mode to a generateText capability id. */
export function providerCapabilityId(mode: ProviderMode): string {
  return PROVIDER_CAPABILITY[mode]
}

/** localStorage key for persisted provider mode (not API keys). */
export const PROVIDER_MODE_STORAGE_KEY = "ecp:browser-demo:provider-mode"

/** Read persisted provider mode for this demo app. */
export function readStoredProviderMode(): ProviderMode | null {
  if (typeof localStorage === "undefined") return null
  const raw = localStorage.getItem(PROVIDER_MODE_STORAGE_KEY)
  if (raw === "chrome-ai" || raw === "openai" || raw === "claude" || raw === "demo") return raw
  return null
}

/** Persist provider mode for this demo app (session keys are never stored). */
export function storeProviderMode(mode: ProviderMode): void {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(PROVIDER_MODE_STORAGE_KEY, mode)
}
