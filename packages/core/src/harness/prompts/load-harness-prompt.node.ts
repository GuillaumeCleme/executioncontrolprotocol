import { readFileSync } from "node:fs"
import path from "node:path"
import {
  harnessPromptFixtureSchema,
  type HarnessPromptFixture,
} from "./harness-prompt-fixture-schema.js"
import { HARNESS_PROMPTS_DIR } from "./fixtures-root.js"

const cache = new Map<string, HarnessPromptFixture>()

/** Node-only harness prompt loader. @category Harness */
export function loadHarnessPromptFixtureNode(fixtureId: string): HarnessPromptFixture {
  const cached = cache.get(fixtureId)
  if (cached) return cached
  const full = path.join(HARNESS_PROMPTS_DIR, `${fixtureId}.prompt.json`)
  const raw = JSON.parse(readFileSync(full, "utf8")) as unknown
  const parsed = harnessPromptFixtureSchema.parse(raw)
  if (parsed.id !== fixtureId) {
    throw new Error(`Harness prompt fixture id mismatch: file ${fixtureId}, json id ${parsed.id}`)
  }
  cache.set(fixtureId, parsed)
  return parsed
}
