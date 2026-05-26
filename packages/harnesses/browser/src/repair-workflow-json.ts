/**
 * Repair common 1B workflow JSON mistakes before decode (eval harness internal).
 * @category Evals
 */
export function repairWorkflowJsonSyntax(raw: string): string {
  let next = raw.trim()

  // Strip trailing stray ] brackets that 1B models append after the root object
  // (model thinks the workflow is inside an outer array).
  // Pattern: one or more ] after the last } at end of string.
  next = next.replace(/(\})\s*\]+\s*$/, '$1')

  // If JSON is still invalid due to an unclosed root object, try adding one }
  try {
    JSON.parse(next)
  } catch {
    const withClose = next + '}'
    try {
      JSON.parse(withClose)
      next = withClose // exactly one } was missing at the end
    } catch {
      // Not a simple single-brace close — fall through to deeper repair
    }
  }

  next = hoistWorkflowStepsInRawJson(next)

  // Fix "as" field that the model places AFTER the step's closing brace (floating-as):
  //   {"id":"echo","input":{...}},"as":"echo"},{"type":"step"
  // → {"id":"echo","input":{...},"as":"echo"},{"type":"step"
  //
  // Uses depth-tracking to reliably detect the floating "as" at array level,
  // regardless of input nesting depth ($ref inputs have legitimate nested "}}")
  //
  // SAFETY: Only apply when JSON.parse already fails.
  try {
    JSON.parse(next)
  } catch {
    const fixed = fixFloatingAsInSteps(next)
    if (fixed !== next) next = fixed
  }

  // Fix missing "as" field when step closes directly into next step (no as at all):
  //   {"id":"echo","input":{"value":"hello"}},{"type":"step"  →  adds ,"as":"echo"
  // Safe for $ref inputs: [^}]* stops at first "}", so it won't match nested $ref.
  next = next.replace(
    /"id":"([^"]+)"([\s\S]*?"input":\{[^}]*\})\},\s*\{"type":"step"/g,
    '"id":"$1"$2,"as":"$1"},\{"type":"step"'
  )

  next = next.replace(/\]\s*\)\s*\}\s*\)\s*$/g, "]}")
  next = next.replace(/"steps":\s*\[[^\]]*],\s*"steps":/g, '"steps":')
  // Remove stray " that the 1B model inserts after } and before , (e.g. `}","steps":`)
  next = next.replace(/\}"\s*,/g, '},')
  return next
}

/**
 * Depth-tracking repair: find "as":"value" that appears as an invalid array element
 * between step objects in the "steps" array, and move it back inside the preceding step.
 * @internal
 */
function fixFloatingAsInSteps(raw: string): string {
  return fixFloatingAsInArray(raw, '"steps":[')
}

/**
 * Depth-tracking repair for any JSON array identified by the given string marker.
 * Finds "as":"value" appearing as an invalid array element and moves it inside the
 * preceding step object.
 * @internal
 */
function fixFloatingAsInArray(raw: string, marker: string): string {
  const stepsIdx = raw.indexOf(marker)
  if (stepsIdx < 0) return raw

  const arrayOpen = stepsIdx + marker.length - 1 // position of '['
  let i = arrayOpen + 1
  let result = raw.slice(0, i)

  let depth = 0
  let inString = false
  let escape = false

  while (i < raw.length) {
    const ch = raw[i]

    if (escape) { escape = false; result += ch; i++; continue }
    if (inString) {
      if (ch === '\\') { escape = true; result += ch; i++; continue }
      if (ch === '"') inString = false
      result += ch; i++; continue
    }
    if (ch === '"') { inString = true; result += ch; i++; continue }
    if (ch === '{') { depth++; result += ch; i++; continue }
    if (ch === '}') {
      depth--
      if (depth < 0) { result += raw.slice(i); return result }
      result += ch; i++; continue
    }
    if (ch === ']' && depth === 0) { result += raw.slice(i); return result }

    // At depth === 0 (between step objects), look for floating "as":"value"}
    if (ch === ',' && depth === 0) {
      const rest = raw.slice(i + 1)
      const trimmed = rest.trimStart()
      const leadingWs = rest.length - trimmed.length
      const floatMatch = trimmed.match(/^"as"\s*:\s*"([^"]*)"\s*\}/)
      if (floatMatch) {
        // Remove the premature "}" we just emitted (last char of result)
        result = result.slice(0, -1)
        // Inject "as" back inside the preceding step and restore its proper close
        result += `,"as":"${floatMatch[1]}"}`
        // Advance past the floating ,"as":"value"} in the source
        i += 1 + leadingWs + floatMatch[0].length
        continue
      }
    }

    result += ch; i++
  }

  return result
}

/**
 * Repair common 1B patch JSON mistakes (floating "as", stray step objects appended
 * after patches array, etc.) before decode.
 * @category Evals
 */
export function repairPatchJsonSyntax(raw: string): string {
  let next = raw.trim()

  // Fix floating "as" inside "value":[...] arrays of a patch document.
  // Only applies when JSON is already invalid (same safety guard as workflow repair).
  try {
    JSON.parse(next)
  } catch {
    const fixed = fixFloatingAsInArray(next, '"value":[')
    if (fixed !== next) next = fixed
  }

  // Strip stray ) that the 1B model inserts between ] and } (e.g., ]})} → ]}}).
  // Model sometimes wraps the entire document in a function-call-like construct.
  try {
    JSON.parse(next)
  } catch {
    const stripped = next.replace(/\)\s*\}/g, '}')
    try {
      JSON.parse(stripped)
      next = stripped
    } catch { /* fall through */ }
  }

  // Remove stray " between } and , (same as workflow repair)
  next = next.replace(/\}"\s*,/g, '},')

  return next
}

/**
 * Hoist steps nested under workflow into top-level steps array.
 * @category Evals
 */
export function hoistWorkflowStepsInRawJson(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed.includes('"workflow"') || !trimmed.includes('"steps"')) {
    return raw
  }
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>
    const workflow = parsed.workflow
    if (
      workflow !== null &&
      typeof workflow === "object" &&
      !Array.isArray(workflow) &&
      Array.isArray((workflow as Record<string, unknown>).steps) &&
      parsed.steps === undefined
    ) {
      const wf = workflow as Record<string, unknown>
      const { steps, ...rest } = wf
      return JSON.stringify({ ...parsed, workflow: rest, steps })
    }
  } catch {
    // fall through to regex hoist
  }

  const match = trimmed.match(
    /"workflow"\s*:\s*\{("id"\s*:\s*"[^"]*"(?:\s*,\s*"label"\s*:\s*"[^"]*")?)\s*,\s*"steps"\s*:\s*(\[[\s\S]*\])\s*\}\s*,\s*"steps"\s*:/
  )
  if (match) {
    return trimmed
  }

  const nested = trimmed.match(
    /"workflow"\s*:\s*\{("id"\s*:\s*"[^"]*"(?:\s*,\s*"label"\s*:\s*"[^"]*")?)\s*,\s*"steps"\s*:\s*(\[[\s\S]*?\])\s*\}/
  )
  if (nested) {
    const wfMeta = `{${nested[1]}}`
    const stepsArray = nested[2]
    const withoutNested = trimmed.replace(nested[0], `"workflow":${wfMeta}`)
    if (!withoutNested.includes('"steps":')) {
      return withoutNested.replace(
        `"workflow":${wfMeta}`,
        `"workflow":${wfMeta},"steps":${stepsArray}`
      )
    }
  }

  return raw
}
