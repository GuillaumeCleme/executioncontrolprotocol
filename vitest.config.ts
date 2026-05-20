import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const repoRoot = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@ecp/types": path.resolve(repoRoot, "packages/types/src/index.ts"),
      "@ecp/core": path.resolve(repoRoot, "packages/core/src/index.ts"),
      "@ecp/policies": path.resolve(repoRoot, "packages/policies/src/index.ts"),
      "@ecp/extension-memory": path.resolve(
        repoRoot,
        "packages/extensions/memory/src/index.ts"
      ),
      "@ecp/extension-openai": path.resolve(
        repoRoot,
        "packages/extensions/openai/src/index.ts"
      ),
      "@ecp/extension-slack": path.resolve(repoRoot, "packages/extensions/slack/src/index.ts"),
    },
  },
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.ts", "packages/extensions/*/src/**/*.ts"],
      exclude: ["**/*.test.ts", "**/index.ts"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: [
            "packages/types/**/*.test.ts",
            "packages/core/test/**/*.test.ts",
            "packages/policies/**/*.test.ts",
            "packages/cli/test/**/*.test.ts",
            "packages/mcp/**/*.test.ts",
            "packages/extensions/**/*.test.ts",
          ],
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
          name: "e2e",
          include: ["packages/extensions/ollama/test/e2e/**/*.test.ts"],
        },
      },
    ],
  },
})
