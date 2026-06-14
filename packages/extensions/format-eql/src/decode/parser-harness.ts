import type { ValidationIssue } from "@executioncontextprotocol/types"
import type { EqlHeader, EqlIntentDoc, EqlReplyCitation, EqlReplyDoc, ParsedLine } from "./ast.js"
import { eqlSyntaxIssue } from "./diagnostics.js"
import { parseLiteral } from "./values.js"

function upper(tokens: string[]): string[] {
  return tokens.map((t) => t.toUpperCase())
}

export function parseIntentDocument(
  row: ParsedLine,
  header: EqlHeader | undefined,
  issues: ValidationIssue[]
): EqlIntentDoc | undefined {
  const t = upper(row.tokens)
  if (t[0] !== "INTENT" || !row.tokens[1]) {
    issues.push(eqlSyntaxIssue(row.line, "INTENT requires a value"))
    return undefined
  }
  return {
    kind: "intent",
    header,
    intent: row.tokens[1]!,
  }
}

function parseReplyBody(
  lines: ParsedLine[],
  startIndex: number,
  baseIndent: number,
  issues: ValidationIssue[]
): { answer?: string; citations: EqlReplyCitation[]; nextIndex: number } {
  let answer: string | undefined
  const citations: EqlReplyCitation[] = []
  let i = startIndex
  while (i < lines.length) {
    const row = lines[i]!
    if (row.indent <= baseIndent && i > startIndex) break
    const t = upper(row.tokens)
    if (t[0] === "ANSWER") {
      const answerText = row.text.replace(/^\s*ANSWER\s+/i, "").trim()
      const normalized = answerText.replace(/^\u201C|\u201D$/g, '"')
      const lit = parseLiteral(normalized, row.line)
      if (lit.value !== undefined) answer = String(lit.value)
      else if (
        lit.issues.some((i) => i.message.includes("Unsupported literal")) ||
        (!normalized.startsWith('"') && !normalized.startsWith("'"))
      ) {
        answer = answerText.replace(/^["'\u201C\u201D]|["'\u201C\u201D]$/g, "")
      } else {
        issues.push(...lit.issues)
      }
    } else if (t[0] === "CITATION" && row.tokens[1]) {
      const citation: EqlReplyCitation = { kind: row.tokens[1]!.toLowerCase() }
      const rest = row.tokens.slice(2)
      const quoted = rest.filter((t) => t.startsWith('"') || t.startsWith("'"))
      const unquoted = rest.filter((t) => !t.startsWith('"') && !t.startsWith("'"))
      if (unquoted[0]) citation.id = unquoted[0]
      if (quoted.length > 0) {
        const lit = parseLiteral(quoted.join(" "), row.line)
        if (lit.value !== undefined) citation.detail = String(lit.value)
      }
      citations.push(citation)
    }
    i++
  }
  return { answer, citations, nextIndex: i }
}

export function parseReplyDocument(
  lines: ParsedLine[],
  startIndex: number,
  header: EqlHeader | undefined,
  issues: ValidationIssue[]
): EqlReplyDoc | undefined {
  const row = lines[startIndex]
  if (!row || upper(row.tokens)[0] !== "REPLY") {
    issues.push(eqlSyntaxIssue(row?.line ?? 1, "Expected REPLY"))
    return undefined
  }

  let answer: string | undefined
  let citations: EqlReplyCitation[] = []

  const body = parseReplyBody(lines, startIndex + 1, row.indent, issues)
  if (body.answer !== undefined) answer = body.answer
  citations = body.citations

  if (!answer) {
    issues.push(eqlSyntaxIssue(row.line, "REPLY requires ANSWER"))
    return undefined
  }

  return {
    kind: "reply",
    header,
    answer,
    citations,
  }
}
