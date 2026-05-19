import type { CommitMode } from "@ecp/types"
import type { PendingMutation } from "@ecp/types"

function setAtPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".")
  let cur: Record<string, unknown> = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]!
    if (!(p in cur) || typeof cur[p] !== "object" || cur[p] === null) cur[p] = {}
    cur = cur[p] as Record<string, unknown>
  }
  cur[parts[parts.length - 1]!] = value
}

function getAtPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".")
  let cur: unknown = obj
  for (const p of parts) {
    if (cur === null || cur === undefined || typeof cur !== "object") return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur
}

/** Apply staged mutations and step output commit. */
export function commitTransaction(options: {
  state: Record<string, unknown>
  mutations: PendingMutation[]
  output: unknown
  commitAs?: string
  commitMode?: CommitMode
}): void {
  const { state, mutations, output, commitAs, commitMode = "create" } = options

  for (const m of mutations) {
    if (m.op === "merge" && typeof m.value === "object") {
      const existing = getAtPath(state, m.path)
      setAtPath(state, m.path, {
        ...(typeof existing === "object" && existing !== null ? existing : {}),
        ...(m.value as object),
      })
    } else if (m.op === "append") {
      const existing = getAtPath(state, m.path)
      const arr = Array.isArray(existing) ? [...existing] : []
      arr.push(m.value)
      setAtPath(state, m.path, arr)
    } else {
      setAtPath(state, m.path, m.value)
    }
  }

  if (!commitAs) return

  const existing = state[commitAs]
  if (commitMode === "create" && existing !== undefined) {
    throw new Error(`State key '${commitAs}' already exists (mode: create)`)
  }
  if (commitMode === "merge" && typeof output === "object" && output !== null) {
    state[commitAs] = {
      ...(typeof existing === "object" && existing !== null ? existing : {}),
      ...output,
    }
  } else if (commitMode === "append") {
    const arr = Array.isArray(existing) ? [...existing] : []
    arr.push(output)
    state[commitAs] = arr
  } else {
    state[commitAs] = output
  }
}
