/** Whether filename indicates TypeScript. */
export function isTypeScriptFile(filename: string): boolean {
  return /\.tsx?$/i.test(filename)
}

async function loadEsbuild(): Promise<typeof import("esbuild")> {
  try {
    return await import("esbuild")
  } catch {
    throw new Error(
      "esbuild is required to compile TypeScript workflow sources. Run: npm install esbuild"
    )
  }
}

/** Transpile TS to ESM using esbuild (Node host). */
export async function transpileWorkflowSource(
  source: string,
  filename: string
): Promise<string> {
  if (!isTypeScriptFile(filename)) return source

  const esbuild = await loadEsbuild()
  const result = await esbuild.transform(source, {
    loader: filename.endsWith(".tsx") ? "tsx" : "ts",
    format: "esm",
    target: "es2022",
  })
  return result.code
}

/**
 * Bundle workflow module with dependencies (Node host).
 * Resolves `@ecp/core` and extension imports.
 */
export async function bundleWorkflowSource(
  source: string,
  filename: string,
  resolveDir: string
): Promise<string> {
  const { dirname, join } = await import("node:path")
  const { fileURLToPath } = await import("node:url")
  const esbuild = await loadEsbuild()
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..")
  const loader = filename.endsWith(".tsx")
    ? "tsx"
    : filename.endsWith(".ts")
      ? "ts"
      : "js"
  const result = await esbuild.build({
    stdin: {
      contents: source,
      loader,
      resolveDir,
      sourcefile: filename,
    },
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    packages: "bundle",
    alias: {
      "@ecp/core/compile": join(repoRoot, "packages/core/dist/compile/entry.js"),
      "@ecp/core/loaders": join(repoRoot, "packages/core/dist/loaders/index.js"),
      "@ecp/core/browser": join(repoRoot, "packages/core/dist/browser.js"),
      "@ecp/core": join(repoRoot, "packages/core/dist/index.js"),
      "@ecp/core/testing": join(repoRoot, "packages/core/dist/testing/index.js"),
      "@ecp/node": join(repoRoot, "packages/runtimes/node/dist/index.js"),
      "@ecp/browser": join(repoRoot, "packages/runtimes/browser/dist/index.js"),
      "@ecp/types": join(repoRoot, "packages/types/dist/index.js"),
      "@ecp/policies": join(repoRoot, "packages/policies/dist/index.js"),
      "@ecp/format-toon": join(repoRoot, "packages/extensions/format-toon/dist/index.js"),
    },
  })
  const file = result.outputFiles[0]
  if (!file) throw new Error("esbuild produced no output")
  return file.text
}
