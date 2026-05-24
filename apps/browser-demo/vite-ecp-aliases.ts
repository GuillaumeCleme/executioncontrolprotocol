import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

/** Resolve monorepo @ecp/* packages to TypeScript source (same as Vitest). */
export const ecpWorkspaceAliases: Record<string, string> = {
  "@ecp/types": path.resolve(repoRoot, "packages/types/src/index.ts"),
  "@ecp/core/compile": path.resolve(repoRoot, "packages/core/src/compile/entry.ts"),
  "@ecp/core/loaders": path.resolve(repoRoot, "packages/core/src/loaders/index.ts"),
  "@ecp/core/browser": path.resolve(repoRoot, "packages/core/src/browser.ts"),
  "@ecp/core": path.resolve(repoRoot, "packages/core/src/index.ts"),
  "@ecp/policies": path.resolve(repoRoot, "packages/policies/src/index.ts"),
  "@ecp/node": path.resolve(repoRoot, "packages/node/src/index.ts"),
  "@ecp/browser": path.resolve(repoRoot, "packages/browser/src/index.ts"),
  "@ecp/format-toon": path.resolve(repoRoot, "packages/extensions/format-toon/src/index.ts"),
  "@ecp/format-mermaid": path.resolve(repoRoot, "packages/extensions/format-mermaid/src/index.ts"),
  "@ecp/demo": path.resolve(repoRoot, "packages/extensions/demo/src/index.ts"),
  "@ecp/chrome-ai": path.resolve(repoRoot, "packages/extensions/chrome-ai/src/index.ts"),
  "@ecp/extension-openai": path.resolve(repoRoot, "packages/extensions/openai/src/index.ts"),
  "@ecp/claude": path.resolve(repoRoot, "packages/extensions/claude/src/index.ts"),
}
