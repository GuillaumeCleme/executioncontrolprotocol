import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"
import { playwright } from "@vitest/browser-playwright"
import { browserPromptLoaderPlugin } from "./apps/browser-demo/vite-browser-prompts-plugin.js"

const repoRoot = path.dirname(fileURLToPath(import.meta.url))
const corePromptsDir = path.join(repoRoot, "packages/core/src/harness/prompts")
const promptLoaderStubDir = path.join(repoRoot, "apps/browser-demo/src/stubs")
const browserPromptPlugins = [
  browserPromptLoaderPlugin({ corePromptsDir, stubDir: promptLoaderStubDir }),
]

export default defineConfig({
  resolve: {
    alias: {
      "@ecp/types": path.resolve(repoRoot, "packages/types/src/index.ts"),
      "@ecp/core/compile": path.resolve(repoRoot, "packages/core/src/compile/entry.ts"),
      "@ecp/core/loaders": path.resolve(repoRoot, "packages/core/src/loaders/index.ts"),
      "@ecp/core/browser": path.resolve(repoRoot, "packages/core/src/browser.ts"),
      "@ecp/core/environment": path.resolve(
        repoRoot,
        "packages/core/src/environment/environment.ts"
      ),
      "@ecp/core/environment/config-resolver": path.resolve(
        repoRoot,
        "packages/core/src/environment/config-resolver.ts"
      ),
      "@ecp/core/registry": path.resolve(repoRoot, "packages/core/src/registry/registry.ts"),
      "@ecp/core/registry/errors": path.resolve(
        repoRoot,
        "packages/core/src/registry/errors.ts"
      ),
      "@ecp/core/bindings/extension": path.resolve(
        repoRoot,
        "packages/core/src/bindings/extension.ts"
      ),
      "@ecp/core/bindings/runtime": path.resolve(
        repoRoot,
        "packages/core/src/bindings/runtime.ts"
      ),
      "@ecp/core/bindings/policy": path.resolve(
        repoRoot,
        "packages/core/src/bindings/policy.ts"
      ),
      "@ecp/core/config-schema": path.resolve(
        repoRoot,
        "packages/core/src/config-schema/index.ts"
      ),
      "@ecp/core/runtime/context": path.resolve(
        repoRoot,
        "packages/core/src/runtime/context.ts"
      ),
      "@ecp/core/runtime/in-memory-executor": path.resolve(
        repoRoot,
        "packages/core/src/runtime/in-memory-executor.ts"
      ),
      "@ecp/core/runtime/executor": path.resolve(
        repoRoot,
        "packages/core/src/runtime/executor.ts"
      ),
      "@ecp/core/definitions/types": path.resolve(
        repoRoot,
        "packages/core/src/definitions/types.ts"
      ),
      "@ecp/core": path.resolve(repoRoot, "packages/core/src/index.ts"),
      "@ecp/policies": path.resolve(repoRoot, "packages/policies/src/index.ts"),
      "@ecp/node": path.resolve(repoRoot, "packages/runtimes/node/src/index.ts"),
      "@ecp/browser": path.resolve(repoRoot, "packages/runtimes/browser/src/index.ts"),
      "@ecp/extension-memory": path.resolve(
        repoRoot,
        "packages/extensions/memory/src/index.ts"
      ),
      "@ecp/extension-openai": path.resolve(
        repoRoot,
        "packages/extensions/openai/src/index.ts"
      ),
      "@ecp/extension-slack": path.resolve(repoRoot, "packages/extensions/slack/src/index.ts"),
      "@ecp/format-toon": path.resolve(repoRoot, "packages/extensions/format-toon/src/index.ts"),
      "@ecp/format-mermaid": path.resolve(repoRoot, "packages/extensions/format-mermaid/src/index.ts"),
      "@ecp/format-eql": path.resolve(repoRoot, "packages/extensions/format-eql/src/index.ts"),
      "@ecp/demo": path.resolve(repoRoot, "packages/extensions/demo/src/index.ts"),
      "@ecp/chrome-ai": path.resolve(repoRoot, "packages/extensions/chrome-ai/src/index.ts"),
      "@ecp/claude": path.resolve(repoRoot, "packages/extensions/claude/src/index.ts"),
      "@ecp/extension-ollama": path.resolve(
        repoRoot,
        "packages/extensions/ollama/src/index.ts"
      ),
      "@ecp/evals": path.resolve(repoRoot, "packages/evals/src/index.ts"),
      "@ecp/harnesses-browser": path.resolve(
        repoRoot,
        "packages/harnesses/browser/src/index.ts"
      ),
      "@ecp/harnesses-browser/repair-workflow-json": path.resolve(
        repoRoot,
        "packages/harnesses/browser/src/repair-workflow-json.ts"
      ),
      "@ecp/harnesses-browser/presentation": path.resolve(
        repoRoot,
        "packages/harnesses/browser/src/presentation.ts"
      ),
      "@ecp/harnesses-browser/normalize-workflow-output": path.resolve(
        repoRoot,
        "packages/harnesses/browser/src/normalize-workflow-output.ts"
      ),
      "@ecp/harnesses-browser/request-capability-hints": path.resolve(
        repoRoot,
        "packages/harnesses/browser/src/_internal/request-capability-hints.ts"
      ),
      "@ecp/harnesses-browser/summarize-environment": path.resolve(
        repoRoot,
        "packages/harnesses/browser/src/_internal/summarize-environment.ts"
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
            "packages/runtimes/node/**/*.test.ts",
            "packages/runtimes/browser/test/*.test.ts",
            "apps/browser-demo/test/**/*.test.ts",
          ],
        },
      },
      {
        extends: true,
        plugins: browserPromptPlugins,
        resolve: {
          alias: [
            {
              find: "@ecp/core",
              replacement: path.resolve(
                repoRoot,
                "packages/core/src/browser-runtime-entry.ts"
              ),
            },
            {
              find: "@ecp/core/browser",
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
        resolve: {
          alias: {
            "@ecp/harnesses-browser/presentation": path.resolve(
              repoRoot,
              "packages/harnesses/browser/src/presentation.ts"
            ),
            "@ecp/harnesses-browser/normalize-workflow-output": path.resolve(
              repoRoot,
              "packages/harnesses/browser/src/normalize-workflow-output.ts"
            ),
            "@ecp/harnesses-browser/repair-workflow-json": path.resolve(
              repoRoot,
              "packages/harnesses/browser/src/repair-workflow-json.ts"
            ),
            "@ecp/harnesses-browser/request-capability-hints": path.resolve(
              repoRoot,
              "packages/harnesses/browser/src/_internal/request-capability-hints.ts"
            ),
            "@ecp/harnesses-browser/summarize-environment": path.resolve(
              repoRoot,
              "packages/harnesses/browser/src/_internal/summarize-environment.ts"
            ),
          },
        },
        test: {
          name: "eval",
          include: [
            "packages/evals/test/harness/**/*.test.ts",
            "packages/evals/test/fixtures/**/*.test.ts",
          ],
          testTimeout: 180_000,
        },
      },
      {
        extends: true,
        plugins: browserPromptPlugins,
        resolve: {
          alias: [
            { find: "@ecp/core", replacement: path.resolve(repoRoot, "packages/core/src/index.ts") },
            {
              find: "@ecp/core/compile",
              replacement: path.resolve(repoRoot, "packages/core/src/compile/index.browser.ts"),
            },
            {
              find: "@ecp/core/loaders",
              replacement: path.resolve(repoRoot, "packages/evals/test/stubs/node-empty.ts"),
            },
            {
              find: "@ecp/node",
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
              find: "@ecp/harnesses-browser/presentation",
              replacement: path.resolve(
                repoRoot,
                "packages/harnesses/browser/src/presentation.ts"
              ),
            },
            {
              find: "@ecp/harnesses-browser/normalize-workflow-output",
              replacement: path.resolve(
                repoRoot,
                "packages/harnesses/browser/src/normalize-workflow-output.ts"
              ),
            },
            {
              find: "@ecp/harnesses-browser/repair-workflow-json",
              replacement: path.resolve(
                repoRoot,
                "packages/harnesses/browser/src/repair-workflow-json.ts"
              ),
            },
            {
              find: "@ecp/harnesses-browser/request-capability-hints",
              replacement: path.resolve(
                repoRoot,
                "packages/harnesses/browser/src/_internal/request-capability-hints.ts"
              ),
            },
            {
              find: "@ecp/harnesses-browser/summarize-environment",
              replacement: path.resolve(
                repoRoot,
                "packages/harnesses/browser/src/_internal/summarize-environment.ts"
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
