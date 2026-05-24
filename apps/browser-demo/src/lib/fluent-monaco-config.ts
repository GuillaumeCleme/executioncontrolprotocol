import type { Monaco } from "@monaco-editor/react"

/** Ambient types for browser Fluent source (`import from "@ecp/browser"`). Compile strips these imports. */
export const FLUENT_BROWSER_MODULE_LIB = `declare module "@ecp/browser" {
  export function workflow(label: string): WorkflowBuilder
  export function step(ref: string | undefined, label?: string): StepBuilder
  export function ref(key: string): unknown
  export function state(key: string): unknown
  export function env(key: string): unknown
  export function expr(source: string): unknown
  export function parallel(steps: unknown[]): unknown
  export function branch(branches: unknown[][]): unknown
  export function loop(body: unknown): unknown

  interface WorkflowBuilder {
    id(id: string): WorkflowBuilder
    run(nodes: unknown[]): WorkflowBuilder
  }

  interface StepBuilder {
    id(id: string): StepBuilder
    as(key: string): StepBuilder
    with(input: Record<string, unknown>): StepBuilder
    when(condition: unknown): StepBuilder
  }
}
`

/** Virtual URI for Fluent workflow source — must not overlap app source paths (e.g. CodePanel.tsx). */
export const FLUENT_EDITOR_PATH = "file:///ecp-workflow/workflow.ts"

let fluentMonacoConfigured = false

/** Register virtual @ecp/browser types so Monaco does not report TS2792 on generated Fluent source. */
export function configureFluentMonaco(monaco: Monaco): void {
  if (fluentMonacoConfigured) return
  fluentMonacoConfigured = true

  const defaults = monaco.languages.typescript.typescriptDefaults
  defaults.setCompilerOptions({
    ...defaults.getCompilerOptions(),
    target: monaco.languages.typescript.ScriptTarget.ES2022,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeNext,
    allowNonTsExtensions: true,
    noEmit: true,
    strict: false,
  })
  defaults.addExtraLib(FLUENT_BROWSER_MODULE_LIB, "file:///node_modules/@types/ecp-browser/index.d.ts")
  // Fluent compile rewrites imports via globalThis.__ecpWorkflowShim; Monaco must not typecheck app React sources.
  defaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
    noSuggestionDiagnostics: true,
  })
}
