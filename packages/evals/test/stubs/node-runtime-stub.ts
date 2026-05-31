/** Stub @ecp/node for Vitest browser eval (Node runtime not used). */
export const NODE_RUNTIME_ID = "@ecp/node"

export async function registerNodeRuntime(): Promise<void> {
  throw new Error("@ecp/node is not available in browser eval runtime")
}
