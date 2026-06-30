/** Split headerless EQL into WORKFLOW blocks. @category Harness */
export function splitWorkflowEqlBlocks(raw: string): string[] {
  const cleaned = raw
    .replace(/```[\w-]*\n?/g, "")
    .replace(/```/g, "")
    .replace(/@executioncontrolprotocol\/demo\.summarizes\b/g, "@executioncontrolprotocol/test.summarize")
    .trim()
  const lines = cleaned.split(/\r?\n/)
  const blocks: string[] = []
  let current: string[] = []

  for (const line of lines) {
    if (/^WORKFLOW\s+\S/.test(line)) {
      if (current.length > 0) blocks.push(current.join("\n"))
      current = [line]
    } else if (current.length > 0) {
      current.push(line)
    }
  }
  if (current.length > 0) blocks.push(current.join("\n"))
  return blocks.length > 0 ? blocks : [cleaned]
}

function blockCapabilityUses(block: string): string[] {
  return [...block.matchAll(/USES\s+(@\S+)/g)].map((match) => match[1]!)
}

/** Keep only the first WORKFLOW block when the model concatenates multiple examples. @category Harness */
export function takeFirstWorkflowEqlBlock(raw: string): string {
  const blocks = splitWorkflowEqlBlocks(raw)
  return blocks[0] ?? raw.trim()
}

/** Pick the WORKFLOW block that best matches required capability ids. @category Harness */
export function selectBestWorkflowEqlBlock(raw: string, requiredCapabilityIds: readonly string[]): string {
  const blocks = splitWorkflowEqlBlocks(raw)
  if (blocks.length <= 1) return blocks[0] ?? raw.trim()
  if (requiredCapabilityIds.length === 0) return takeFirstWorkflowEqlBlock(raw)

  let best = blocks[0]!
  let bestScore = Number.NEGATIVE_INFINITY
  for (const block of blocks) {
    const uses = blockCapabilityUses(block)
    const matched = requiredCapabilityIds.filter((cap) => uses.includes(cap)).length
    const extra = uses.filter((cap) => !requiredCapabilityIds.includes(cap)).length
    let score = matched * 10 - extra * 5 - Math.abs(uses.length - requiredCapabilityIds.length)
    if (matched === requiredCapabilityIds.length && uses.length === requiredCapabilityIds.length) {
      score += 50
    }
    if (score > bestScore) {
      bestScore = score
      best = block
    }
  }
  return best
}

/** Normalize common small-model EQL typos before decode. @category Harness */
export function normalizeCreateEqlRawOutput(raw: string): string {
  return raw
    .replace(/@executioncontrolprotocol\/demo\.summarizes\b/g, "@executioncontrolprotocol/test.summarize")
    .replace(/USES (@\S+)\s+"([^"]+)"/g, "USES $1\n  LABEL \"$2\"")
}

interface WorkflowEqlStepBlock {
  /** Capability id from the STEP USES line. */
  uses: string
  /** Raw STEP block lines. */
  lines: string[]
}

function parseWorkflowEqlStepBlocks(block: string): {
  header: string[]
  steps: WorkflowEqlStepBlock[]
} {
  const lines = block.split(/\r?\n/)
  const header: string[] = []
  const steps: WorkflowEqlStepBlock[] = []
  let current: string[] = []
  let currentUses: string | undefined

  for (const line of lines) {
    if (/^WORKFLOW\s/.test(line)) {
      header.push(line)
      continue
    }
    const stepMatch = line.match(/^STEP\s+\S+\s+USES\s+(@\S+)/)
    if (stepMatch) {
      if (currentUses && current.length > 0) {
        steps.push({ uses: currentUses, lines: current })
      }
      current = [line]
      currentUses = stepMatch[1]
      continue
    }
    if (currentUses) {
      current.push(line)
    } else {
      header.push(line)
    }
  }
  if (currentUses && current.length > 0) {
    steps.push({ uses: currentUses, lines: current })
  }
  return { header, steps }
}

/**
 * Drop STEP blocks whose USES is not required by the user request (nano harness policy).
 * @category Harness
 */
export function filterWorkflowEqlToRequiredCapabilities(
  raw: string,
  requiredCapabilityIds: readonly string[]
): string {
  if (requiredCapabilityIds.length === 0) {
    return raw
  }
  const block = takeFirstWorkflowEqlBlock(raw)
  const { header, steps } = parseWorkflowEqlStepBlocks(block)
  const byCap = new Map<string, WorkflowEqlStepBlock>()
  for (const step of steps) {
    if (requiredCapabilityIds.includes(step.uses) && !byCap.has(step.uses)) {
      byCap.set(step.uses, step)
    }
  }
  const hasAll = requiredCapabilityIds.every((id) => byCap.has(id))
  if (!hasAll) {
    return raw
  }
  const kept = requiredCapabilityIds.map((id) => byCap.get(id)!)
  return [...header, ...kept.flatMap((step) => step.lines)].join("\n")
}

function capabilityStepId(capabilityId: string): string {
  return capabilityId.split(".").pop() ?? "step"
}

function orderedCapabilityIdsFromRequest(
  request: string,
  requiredCapabilityIds: readonly string[]
): string[] {
  const ordered = [
    ...new Set(
      [...request.matchAll(/@executioncontrolprotocol\/[\w.-]+/g)].map((match) => match[0]!)
    ),
  ].filter((id) => requiredCapabilityIds.includes(id))
  if (ordered.length === requiredCapabilityIds.length) {
    return ordered
  }
  return [...requiredCapabilityIds]
}

function defaultStepLines(capabilityId: string, priorEchoStepId?: string): string[] {
  const stepId = capabilityStepId(capabilityId)
  const lines = [`  LABEL "${stepId.charAt(0).toUpperCase()}${stepId.slice(1)}"`]
  if (capabilityId.endsWith(".echo")) {
    lines.push(`  WITH value = "hello"`)
  } else if (capabilityId.endsWith(".validate")) {
    lines.push(`  WITH payload = {"ok": true}`)
  } else if (capabilityId.endsWith(".summarize")) {
    lines.push(`  WITH payload = REF ${priorEchoStepId ?? "echo"}.output`)
  } else if (capabilityId.endsWith(".translate")) {
    lines.push(`  WITH text = REF ${priorEchoStepId ?? "echo"}.output`)
  }
  lines.push(`  AS ${stepId}`)
  return lines
}

/**
 * Synthesize create EQL when the model omits required capability steps but the request names them explicitly.
 * @category Harness
 */
export function synthesizeCreateEqlFromRequiredCapabilities(
  request: string,
  requiredCapabilityIds: readonly string[]
): string | undefined {
  if (requiredCapabilityIds.length < 2) {
    return undefined
  }
  const mentioned = requiredCapabilityIds.filter((id) => request.includes(id))
  if (mentioned.length !== requiredCapabilityIds.length) {
    return undefined
  }
  const ordered = orderedCapabilityIdsFromRequest(request, requiredCapabilityIds)
  const workflowIdMatch = request.match(/\bworkflow\s+id\s+(\S+)/i)
  const workflowId = workflowIdMatch?.[1] ?? "generated-workflow"
  const lines = [`WORKFLOW ${workflowId} "Generated workflow"`]
  let priorEchoStepId: string | undefined
  for (const capabilityId of ordered) {
    const stepId = capabilityStepId(capabilityId)
    lines.push(`STEP ${stepId} USES ${capabilityId}`)
    lines.push(...defaultStepLines(capabilityId, priorEchoStepId))
    if (capabilityId.endsWith(".echo")) {
      priorEchoStepId = stepId
    }
  }
  return lines.join("\n")
}


/** True when every required capability appears in the selected workflow block. @category Harness */
export function createEqlIncludesRequiredCapabilities(
  raw: string,
  requiredCapabilityIds: readonly string[]
): boolean {
  if (requiredCapabilityIds.length === 0) {
    return true
  }
  const uses = blockCapabilityUses(selectBestWorkflowEqlBlock(raw, requiredCapabilityIds))
  return requiredCapabilityIds.every((id) => uses.includes(id))
}
