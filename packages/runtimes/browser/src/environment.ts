import {
  environment as coreEnvironment,
  extension,
  harness,
  runtime,
  policy,
  env,
  Registry,
  globalRegistry,
} from "@executioncontextprotocol/core"
import type { Environment } from "@executioncontextprotocol/core"
import { registerStandardPolicies } from "@executioncontextprotocol/policies"
import { BROWSER_RUNTIME_ID, registerBrowserRuntime } from "./runtime/builtin-browser.js"
import { registerBrowserRegistryExtension } from "./extensions/browser-registry.js"
import { registerBrowserSessionConfigExtension } from "./extensions/browser-session-config.js"
import { registerBrowserLocalConfigExtension } from "./extensions/browser-local-config.js"
import { registerBrowserGuideExtension } from "./extensions/browser-guide.js"
import { registerFormatEqlExtension } from "@executioncontextprotocol/format-eql"
import { registerFormatToonExtension } from "@executioncontextprotocol/format-toon"
import { registerFormatMermaidExtension } from "@executioncontextprotocol/format-mermaid"
import { registerDemoExtension } from "@executioncontextprotocol/demo"
import { registerChromeAiExtension } from "@executioncontextprotocol/chrome-ai"
import { registerOpenaiExtension } from "@executioncontextprotocol/extension-openai"
import { registerClaudeExtension } from "@executioncontextprotocol/claude"
import {
  BROWSER_NANO_HARNESS_ID,
  HARNESS_BROWSER_NANO_DEMO_BINDING,
  registerBrowserNanoHarnesses,
} from "@executioncontextprotocol/harnesses-browser-nano"
import "@executioncontextprotocol/format-eql"
import "@executioncontextprotocol/format-toon"
import "@executioncontextprotocol/format-mermaid"
import "@executioncontextprotocol/demo"
import "@executioncontextprotocol/chrome-ai"
import "@executioncontextprotocol/extension-openai"
import "@executioncontextprotocol/claude"

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
      extension("@executioncontextprotocol/format-eql").with({}),
      extension("@executioncontextprotocol/format-toon").with({}),
      extension("@executioncontextprotocol/format-mermaid").with({}),
      extension("@executioncontextprotocol/format-json").with({}),
      extension("@executioncontextprotocol/demo").with({}),
      extension("@executioncontextprotocol/chrome-ai").with({}),
      extension("@executioncontextprotocol/test").with({}),
      extension("@executioncontextprotocol/openai").with({
        apiKey: env("OPENAI_API_KEY", { optional: true }),
      }),
      extension("@executioncontextprotocol/claude").with({
        apiKey: env("ANTHROPIC_API_KEY", { optional: true }),
      }),
      extension("@executioncontextprotocol/browser-registry").with({
        freezeOn: "environment:beforeRun",
        autoBindRegisteredExtensions: true,
        exposeGlobal: true,
        globalName: "ecp",
      }),
      extension("@executioncontextprotocol/browser-session-config").with({ persist: false }),
      extension("@executioncontextprotocol/browser-local-config").with({}),
      extension("@executioncontextprotocol/browser").with({}),
    ])
    .withHarnesses([
      harness(BROWSER_NANO_HARNESS_ID, "Harness")
        .uses("@executioncontextprotocol/demo.generate")
        .with({ ...HARNESS_BROWSER_NANO_DEMO_BINDING }),
    ])
    .withPolicies([
      policy("@executioncontextprotocol/registry-control").with({
        allowedExtensionNamespaces: [
          "@executioncontextprotocol/demo",
          "@executioncontextprotocol/chrome-ai",
          "@executioncontextprotocol/openai",
          "@executioncontextprotocol/claude",
          "@executioncontextprotocol/browser",
          "@customer/*",
          "@executioncontextprotocol/test",
        ],
        deniedExtensionNamespaces: [],
        allowDynamicExtensionRegistration: true,
        allowAutoBind: true,
      }),
    ])
}

/**
 * Create a browser environment with `@executioncontextprotocol/browser` runtime pre-bound.
 * @category Environment
 */
export async function environment(id: string, label?: string): Promise<Environment> {
  await registerBrowserDefaults()
  return createBrowserDemoEnvironment(id, label)
}
