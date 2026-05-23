/** Whether filename indicates TypeScript. */
export function isTypeScriptFile(filename: string): boolean {
  return /\.tsx?$/i.test(filename)
}

/** Transpile TS to ESM using esbuild-wasm. */
export async function transpileWorkflowSource(
  source: string,
  filename: string
): Promise<string> {
  if (!isTypeScriptFile(filename)) return source

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

/** Browser compile path: transpile only (no Node bundling). */
export async function bundleWorkflowSource(
  source: string,
  filename: string,
  _resolveDir: string
): Promise<string> {
  return transpileWorkflowSource(source, filename)
}
