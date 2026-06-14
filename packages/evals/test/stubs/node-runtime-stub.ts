/** Stub @executioncontextprotocol/node for Vitest browser eval (Node runtime not used). */
export const NODE_RUNTIME_ID = "@executioncontextprotocol/node"

export async function registerNodeRuntime(): Promise<void> {
  throw new Error("@executioncontextprotocol/node is not available in browser eval runtime")
}
