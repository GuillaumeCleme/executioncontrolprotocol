/**
 * Node host conveniences: file loaders and workflow compile (native esbuild).
 * Import from `@ecp/core/node` in Node runtimes; browser apps use `@ecp/core/browser`.
 * @packageDocumentation
 */

export * from "./loaders/index.js"
export {
  compileWorkflowSource,
  compileAndValidateWorkflowSource,
  extractWorkflowFromModule,
  type CompileWorkflowResult,
  type CompileWorkflowSourceOptions,
  type CompileDiagnostic,
} from "./compile/entry.js"
