import type { InputValue } from "@ecp/types"

/** Track which helpers are required. @category Encoding */
export interface ImportNeeds {
  workflow: boolean
  step: boolean
  ref: boolean
  state: boolean
  expr: boolean
  loop: boolean
  parallel: boolean
  branch: boolean
}

export function createImportNeeds(): ImportNeeds {
  return {
    workflow: true,
    step: true,
    ref: false,
    state: false,
    expr: false,
    loop: false,
    parallel: false,
    branch: false,
  }
}

/**
 * Render input value to TypeScript expression.
 * @category Encoding
 */
export function renderInputValue(value: InputValue, needs: ImportNeeds): string {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    if ("$ref" in value) {
      needs.ref = true
      const path = (value as { $ref: string }).$ref.replace(/^state\./, "")
      return `ref(${JSON.stringify(path)})`
    }
    if ("$state" in value) {
      needs.state = true
      return `state(${JSON.stringify((value as { $state: string }).$state)})`
    }
    const entries = Object.entries(value).map(
      ([k, v]) => `${JSON.stringify(k)}: ${renderInputValue(v as InputValue, needs)}`
    )
    return `{ ${entries.join(", ")} }`
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => renderInputValue(v as InputValue, needs)).join(", ")}]`
  }
  return JSON.stringify(value)
}
