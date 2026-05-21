import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/** Whether filename indicates TypeScript. */
export function isTypeScriptFile(filename: string): boolean {
  return /\.tsx?$/i.test(filename)
}

function isBrowser(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as { window?: unknown }).window !== "undefined"
  )
}

/** Transpile TS to ESM using esbuild-wasm (browser) or transform (Node). */
export async function transpileWorkflowSource(
  source: string,
  filename: string
): Promise<string> {
  if (!isTypeScriptFile(filename)) return source

  if (isBrowser()) {
    const esbuild = await import("esbuild-wasm")
    await esbuild.initialize({
      wasmURL: "https://unpkg.com/esbuild-wasm@0.25.0/esbuild.wasm",
    })
    const result = await esbuild.transform(source, {
      loader: filename.endsWith(".tsx") ? "tsx" : "ts",
      format: "esm",
      target: "es2022",
    })
    return result.code
  }

  const esbuild = await import("esbuild")
  const result = await esbuild.transform(source, {
    loader: filename.endsWith(".tsx") ? "tsx" : "ts",
    format: "esm",
    target: "es2022",
  })
  return result.code
}

/**
 * Bundle workflow module with dependencies (Node only).
 * Resolves `@ecp/core` and extension imports.
 */
export async function bundleWorkflowSource(
  source: string,
  filename: string,
  resolveDir: string
): Promise<string> {
  if (isBrowser()) {
    return transpileWorkflowSource(source, filename)
  }

  const esbuild = await import("esbuild")
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
      "@ecp/core": join(repoRoot, "packages/core/dist/index.js"),
      "@ecp/node": join(repoRoot, "packages/node/dist/index.js"),
      "@ecp/browser": join(repoRoot, "packages/browser/dist/index.js"),
      "@ecp/types": join(repoRoot, "packages/types/dist/index.js"),
      "@ecp/policies": join(repoRoot, "packages/policies/dist/index.js"),
    },
  })
  const file = result.outputFiles[0]
  if (!file) throw new Error("esbuild produced no output")
  return file.text
}
