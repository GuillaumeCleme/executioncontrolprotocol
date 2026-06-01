import { prepareBrowserWorkflowSource } from "./prepare-browser-source.js"

/** Whether filename indicates TypeScript. */
export function isTypeScriptFile(filename: string): boolean {
  return /\.tsx?$/i.test(filename)
}

let esbuildInitialized = false

async function ensureEsbuildWasm(): Promise<typeof import("esbuild-wasm")> {
  let esbuild: typeof import("esbuild-wasm")
  try {
    esbuild = await import("esbuild-wasm")
  } catch {
    throw new Error(
      "esbuild-wasm is required to compile TypeScript workflow sources in the browser. " +
        "Run: npm install esbuild-wasm"
    )
  }
  if (!esbuildInitialized) {
    await esbuild.initialize({
      wasmURL: "https://unpkg.com/esbuild-wasm@0.25.0/esbuild.wasm",
    })
    esbuildInitialized = true
  }
  return esbuild
}

/** Transpile TS to ESM using esbuild-wasm. */
export async function transpileWorkflowSource(
  source: string,
  filename: string
): Promise<string> {
  if (!isTypeScriptFile(filename)) return source

  const esbuild = await ensureEsbuildWasm()
  const result = await esbuild.transform(source, {
    loader: filename.endsWith(".tsx") ? "tsx" : "ts",
    format: "esm",
    target: "es2022",
  })
  return result.code
}

/** Browser compile path: prepare globals shim then transpile. */
export async function bundleWorkflowSource(
  source: string,
  filename: string,
  _resolveDir: string,
  resolveImports?: "browser-global"
): Promise<string> {
  const prepared =
    resolveImports === "browser-global" ? prepareBrowserWorkflowSource(source) : source
  return transpileWorkflowSource(prepared, filename)
}
