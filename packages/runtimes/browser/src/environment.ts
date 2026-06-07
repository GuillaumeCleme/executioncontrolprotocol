import {
  environment as coreEnvironment,
  extension,
  harness,
  runtime,
  policy,
  env,
  Registry,
  globalRegistry,
} from "@ecp/core"
import type { Environment } from "@ecp/core"
import { registerStandardPolicies } from "@ecp/policies"
import { BROWSER_RUNTIME_ID, registerBrowserRuntime } from "./runtime/builtin-browser.js"
import { registerBrowserRegistryExtension } from "./extensions/browser-registry.js"
import { registerBrowserSessionConfigExtension } from "./extensions/browser-session-config.js"
import { registerBrowserLocalConfigExtension } from "./extensions/browser-local-config.js"
import { registerBrowserGuideExtension } from "./extensions/browser-guide.js"
import { registerFormatEqlExtension } from "@ecp/format-eql"
import { registerFormatToonExtension } from "@ecp/format-toon"
import { registerFormatMermaidExtension } from "@ecp/format-mermaid"
import { registerDemoExtension } from "@ecp/demo"
import { registerChromeAiExtension } from "@ecp/chrome-ai"
import { registerOpenaiExtension } from "@ecp/extension-openai"
import { registerClaudeExtension } from "@ecp/claude"
import {
  BROWSER_NANO_HARNESS_ID,
  HARNESS_BROWSER_NANO_DEMO_BINDING,
  registerBrowserNanoHarnesses,
} from "@ecp/harnesses-browser-nano"
import "@ecp/format-eql"
import "@ecp/format-toon"
import "@ecp/format-mermaid"
import "@ecp/demo"
import "@ecp/chrome-ai"
import "@ecp/extension-openai"
import "@ecp/claude"

/** Register browser runtime and standard browser extensions. */
export async function registerBrowserDefaults(registry: Registry = globalRegistry): Promise<void> {
  await registerBrowserRuntime(registry)
  await registerBrowserRegistryExtension(registry)
  await registerBrowserSessionConfigExtension(registry)
  await registerBrowserLocalConfigExtension(registry)
  await registerBrowserGuideExtension(registry)
  await registerFormatEqlExtension(registry)
  await registerFormatToonExtension(registry)
  await registerFormatMermaidExtension(registry)
  await registerDemoExtension(registry)
  await registerChromeAiExtension(registry)
  await registerOpenaiExtension(registry)
  await registerClaudeExtension(registry)
  await registerStandardPolicies(registry)
  registerBrowserNanoHarnesses()
}

/**
 * Browser demo environment with registry-control and browser-registry defaults.
 * @category Environment
 */
export function createBrowserDemoEnvironment(
  id: string,
  label?: string,
  registry: Registry = globalRegistry
): Environment {
  return coreEnvironment(id, label, registry)
    .withRuntime(runtime(BROWSER_RUNTIME_ID, "Browser Runtime"))
    .withExtensions([
      extension("@ecp/format-eql").with({}),
      extension("@ecp/format-toon").with({}),
      extension("@ecp/format-mermaid").with({}),
      extension("@ecp/format-json").with({}),
      extension("@ecp/demo").with({}),
      extension("@ecp/chrome-ai").with({}),
      extension("@ecp/test").with({}),
      extension("@ecp/openai").with({
        apiKey: env("OPENAI_API_KEY", { optional: true }),
      }),
      extension("@ecp/claude").with({
        apiKey: env("ANTHROPIC_API_KEY", { optional: true }),
      }),
      extension("@ecp/browser-registry").with({
        freezeOn: "environment:beforeRun",
        autoBindRegisteredExtensions: true,
        exposeGlobal: true,
        globalName: "ecp",
      }),
      extension("@ecp/browser-session-config").with({ persist: false }),
      extension("@ecp/browser-local-config").with({}),
      extension("@ecp/browser").with({}),
    ])
    .withHarnesses([
      harness(BROWSER_NANO_HARNESS_ID, "Harness")
        .uses("@ecp/demo.generate")
        .with({ ...HARNESS_BROWSER_NANO_DEMO_BINDING }),
    ])
    .withPolicies([
      policy("@ecp/registry-control").with({
        allowedExtensionNamespaces: [
          "@ecp/demo",
          "@ecp/chrome-ai",
          "@ecp/openai",
          "@ecp/claude",
          "@ecp/browser",
          "@customer/*",
          "@ecp/test",
        ],
        deniedExtensionNamespaces: [],
        allowDynamicExtensionRegistration: true,
        allowAutoBind: true,
      }),
    ])
}

/**
 * Create a browser environment with `@ecp/browser` runtime pre-bound.
 * @category Environment
 */
export async function environment(id: string, label?: string): Promise<Environment> {
  await registerBrowserDefaults()
  return createBrowserDemoEnvironment(id, label)
}
