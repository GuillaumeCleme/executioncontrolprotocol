import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const stub = join(dirname(fileURLToPath(import.meta.url)), "src/stubs/node-empty.ts")

const NODE_BUILTINS = [
  "node:fs",
  "node:fs/promises",
  "node:os",
  "node:path",
  "node:url",
  "node:http",
  "node:child_process",
  "node:util",
]

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  resolve: {
    alias: {
      esbuild: "esbuild-wasm",
      ...Object.fromEntries(NODE_BUILTINS.map((id) => [id, stub])),
    },
  },
  optimizeDeps: {
    exclude: ["@ecp/core", "@ecp/browser"],
  },
})
