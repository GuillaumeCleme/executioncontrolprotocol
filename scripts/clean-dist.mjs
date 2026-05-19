import { rmSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (name === "dist" || name === "node_modules" || name.endsWith(".tsbuildinfo")) {
        if (name === "dist" || name.endsWith(".tsbuildinfo")) rmSync(p, { recursive: true, force: true })
      } else {
        walk(p)
      }
    }
  }
}

walk(join(root, "packages"))
