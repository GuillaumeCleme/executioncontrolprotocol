import { describe, expect, it } from "vitest"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const CORE_SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src")

const FORBIDDEN = [
  "from \"fs\"",
  "from 'fs'",
  "from \"path\"",
  "from 'path'",
  "from \"os\"",
  "from 'os'",
  "from \"node:fs\"",
  "from 'node:fs'",
  "keytar",
  "@modelcontextprotocol",
  "@temporalio",
  "@oclif",
]

async function listTsFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) files.push(...(await listTsFiles(full)))
    else if (e.name.endsWith(".ts") && !e.name.endsWith(".test.ts")) files.push(full)
  }
  return files
}

describe("@ecp/core package boundary", () => {
  it("does not import Node, browser, CLI, MCP, or Temporal-only modules", async () => {
    const files = await listTsFiles(CORE_SRC)
    const violations: string[] = []
    for (const file of files) {
      const text = await readFile(file, "utf8")
      for (const mod of FORBIDDEN) {
        if (text.includes(mod)) {
          violations.push(`${path.relative(CORE_SRC, file)}: ${mod}`)
        }
      }
    }
    expect(violations).toEqual([])
  })
})
