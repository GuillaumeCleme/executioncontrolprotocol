import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"
import { playwright } from "@vitest/browser-playwright"
import { browserPromptLoaderPlugin } from "./packages/runtimes/browser/test/vite-browser-prompts-plugin.js"

const repoRoot = path.dirname(fileURLToPath(import.meta.url))
const corePromptsDir = path.join(repoRoot, "packages/core/src/harness/prompts")
const promptLoaderStubDir = path.join(repoRoot, "packages/evals/test/stubs")
const browserPromptPlugins = [
  browserPromptLoaderPlugin({ corePromptsDir, stubDir: promptLoaderStubDir }),
]

export default defineConfig({
  resolve: {
    alias: {
      "@executioncontextprotocol/types": path.resolve(repoRoot, "packages/types/src/index.ts"),
      "@executioncontextprotocol/core/compile": path.resolve(repoRoot, "packages/core/src/compile/entry.ts"),
      "@executioncontextprotocol/core/loaders": path.resolve(repoRoot, "packages/core/src/loaders/index.ts"),
      "@executioncontextprotocol/core/browser": path.resolve(repoRoot, "packages/core/src/browser.ts"),
      "@executioncontextprotocol/core/environment": path.resolve(
        repoRoot,
        "packages/core/src/environment/environment.ts"
      ),
      "@executioncontextprotocol/core/environment/config-resolver": path.resolve(
        repoRoot,
        "packages/core/src/environment/config-resolver.ts"
      ),
      "@executioncontextprotocol/core/registry": path.resolve(repoRoot, "packages/core/src/registry/registry.ts"),
      "@executioncontextprotocol/core/registry/errors": path.resolve(
        repoRoot,
        "packages/core/src/registry/errors.ts"
      ),
      "@executioncontextprotocol/core/bindings/extension": path.resolve(
        repoRoot,
        "packages/core/src/bindings/extension.ts"
      ),
      "@executioncontextprotocol/core/bindings/runtime": path.resolve(
        repoRoot,
        "packages/core/src/bindings/runtime.ts"
      ),
      "@executioncontextprotocol/core/bindings/policy": path.resolve(
        repoRoot,
        "packages/core/src/bindings/policy.ts"
      ),
      "@executioncontextprotocol/core/config-schema": path.resolve(
        repoRoot,
        "packages/core/src/config-schema/index.ts"
      ),
      "@executioncontextprotocol/core/runtime/context": path.resolve(
        repoRoot,
        "packages/core/src/runtime/context.ts"
      ),
      "@executioncontextprotocol/core/runtime/in-memory-executor": path.resolve(
        repoRoot,
        "packages/core/src/runtime/in-memory-executor.ts"
      ),
      "@executioncontextprotocol/core/runtime/executor": path.resolve(
        repoRoot,
        "packages/core/src/runtime/executor.ts"
      ),
      "@executioncontextprotocol/core/definitions/types": path.resolve(
        repoRoot,
        "packages/core/src/definitions/types.ts"
      ),
      "@executioncontextprotocol/core": path.resolve(repoRoot, "packages/core/src/index.ts"),
      "@executioncontextprotocol/policies": path.resolve(repoRoot, "packages/policies/src/index.ts"),
      "@executioncontextprotocol/node": path.resolve(repoRoot, "packages/runtimes/node/src/index.ts"),
      "@executioncontextprotocol/browser": path.resolve(repoRoot, "packages/runtimes/browser/src/index.ts"),
      "@executioncontextprotocol/extension-memory": path.resolve(
        repoRoot,
        "packages/extensions/memory/src/index.ts"
      ),
      "@executioncontextprotocol/extension-openai": path.resolve(
        repoRoot,
        "packages/extensions/openai/src/index.ts"
      ),
      "@executioncontextprotocol/extension-slack": path.resolve(repoRoot, "packages/extensions/slack/src/index.ts"),
      "@executioncontextprotocol/format-toon": path.resolve(repoRoot, "packages/extensions/format-toon/src/index.ts"),
      "@executioncontextprotocol/format-mermaid": path.resolve(repoRoot, "packages/extensions/format-mermaid/src/index.ts"),
      "@executioncontextprotocol/format-eql": path.resolve(repoRoot, "packages/extensions/format-eql/src/index.ts"),
      "@executioncontextprotocol/demo": path.resolve(repoRoot, "packages/extensions/demo/src/index.ts"),
      "@executioncontextprotocol/chrome-ai": path.resolve(repoRoot, "packages/extensions/chrome-ai/src/index.ts"),
      "@executioncontextprotocol/claude": path.resolve(repoRoot, "packages/extensions/claude/src/index.ts"),
      "@executioncontextprotocol/extension-ollama": path.resolve(
        repoRoot,
        "packages/extensions/ollama/src/index.ts"
      ),
      "@executioncontextprotocol/extension-fal": path.resolve(
        repoRoot,
        "packages/extensions/fal/src/index.ts"
      ),
      "@executioncontextprotocol/extension-image-sharp": path.resolve(
        repoRoot,
        "packages/extensions/image-sharp/src/index.ts"
      ),
      "@executioncontextprotocol/evals": path.resolve(repoRoot, "packages/evals/src/index.ts"),
      "@executioncontextprotocol/harnesses-browser-nano": path.resolve(
        repoRoot,
        "packages/harnesses/browser-nano/src/index.ts"
      ),
      "@executioncontextprotocol/harnesses-browser-nano/request-capability-hints": path.resolve(
        repoRoot,
        "packages/harnesses/browser-nano/src/_internal/request-capability-hints.ts"
      ),
      "@executioncontextprotocol/harnesses-browser-coding": path.resolve(
        repoRoot,
        "packages/harnesses/browser-coding/src/index.ts"
      ),
    },
  },
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.ts", "packages/extensions/*/src/**/*.ts"],
      exclude: ["**/*.test.ts", "**/index.ts"],
      thresholds: {
        "packages/core/src/harness/**": { lines: 90, statements: 90 },
        "packages/core/src/validate/harness.ts": { lines: 90, statements: 90 },
        "packages/extensions/format-eql/src/**": { lines: 90, statements: 90 },
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: [
            "packages/types/**/*.test.ts",
            "packages/core/test/**/*.test.ts",
            "packages/policies/test/**/*.test.ts",
            "packages/cli/test/**/*.test.ts",
            "packages/mcp/**/*.test.ts",
            "packages/extensions/**/*.test.ts",
            "packages/harnesses/**/test/**/*.test.ts",
            "packages/runtimes/node/**/*.test.ts",
            "packages/runtimes/browser/test/*.test.ts",
          ],
        },
      },
      {
        extends: true,
        plugins: browserPromptPlugins,
        resolve: {
          alias: [
            {
              find: "@executioncontextprotocol/core",
              replacement: path.resolve(
                repoRoot,
                "packages/core/src/browser-runtime-entry.ts"
              ),
            },
            {
              find: "@executioncontextprotocol/core/browser",
              replacement: path.resolve(repoRoot, "packages/core/src/browser.ts"),
            },
          ],
        },
        test: {
          name: "browser",
          include: ["packages/runtimes/browser/test/browser/**/*.test.ts"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["packages/mcp/test/integration/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "eval",
          include: [
            "packages/evals/test/harness/**/*.test.ts",
            "packages/evals/test/fixtures/**/*.test.ts",
          ],
          testTimeout: 180_000,
          server: {
            deps: {
              inline: [
                "@executioncontextprotocol/harnesses-browser-coding",
                "@executioncontextprotocol/harnesses-browser-nano",
              ],
            },
          },
        },
      },
      {
        extends: true,
        plugins: browserPromptPlugins,
        resolve: {
          alias: [
            { find: "@executioncontextprotocol/core", replacement: path.resolve(repoRoot, "packages/core/src/index.ts") },
            {
              find: "@executioncontextprotocol/core/compile",
              replacement: path.resolve(repoRoot, "packages/core/src/compile/index.browser.ts"),
            },
            {
              find: "@executioncontextprotocol/core/loaders",
              replacement: path.resolve(repoRoot, "packages/evals/test/stubs/node-empty.ts"),
            },
            {
              find: "@executioncontextprotocol/node",
              replacement: path.resolve(repoRoot, "packages/evals/test/stubs/node-runtime-stub.ts"),
            },
            {
              find: "node:fs",
              replacement: path.resolve(repoRoot, "packages/evals/test/stubs/node-fs-stub.ts"),
            },
            {
              find: "node:fs/promises",
              replacement: path.resolve(repoRoot, "packages/evals/test/stubs/node-fs-stub.ts"),
            },
            {
              find: "node:path",
              replacement: path.resolve(repoRoot, "packages/evals/test/stubs/node-path-stub.ts"),
            },
            {
              find: "node:url",
              replacement: path.resolve(repoRoot, "packages/evals/test/stubs/node-url-stub.ts"),
            },
            {
              find: "node:os",
              replacement: path.resolve(repoRoot, "packages/evals/test/stubs/node-empty.ts"),
            },
            {
              find: "node:http",
              replacement: path.resolve(repoRoot, "packages/evals/test/stubs/node-empty.ts"),
            },
            {
              find: "node:child_process",
              replacement: path.resolve(repoRoot, "packages/evals/test/stubs/node-empty.ts"),
            },
            {
              find: "node:util",
              replacement: path.resolve(repoRoot, "packages/evals/test/stubs/node-empty.ts"),
            },
            {
              find: "@executioncontextprotocol/harnesses-browser-nano/request-capability-hints",
              replacement: path.resolve(
                repoRoot,
                "packages/harnesses/browser-nano/src/_internal/request-capability-hints.ts"
              ),
            },
          ],
        },
        test: {
          name: "eval-browser",
          include: ["packages/evals/test/browser/**/*.eval.test.ts"],
          testTimeout: 180_000,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium", channel: "chrome" }],
          },
        },
      },
      {
        extends: true,
        test: {
          name: "e2e",
          include: ["packages/extensions/ollama/test/e2e/**/*.test.ts"],
        },
      },
    ],
  },
})
