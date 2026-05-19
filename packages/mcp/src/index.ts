import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import type { Environment } from "@ecp/core"
import type { WorkflowManifest } from "@ecp/types"
import { createServer } from "node:http"

/** Options for MCP server creation. @category MCP */
export interface CreateEcpMcpServerOptions {
  environment: Environment
  name?: string
  version?: string
}

const runs = new Map<string, import("@ecp/types").RunResult>()

/**
 * Create an MCP server exposing ECP environment APIs.
 * @category MCP
 */
export function createEcpMcpServer(options: CreateEcpMcpServerOptions): McpServer {
  const { environment } = options
  const server = new McpServer({
    name: options.name ?? "ecp",
    version: options.version ?? "1.0.0",
  })

  server.tool(
    "ecp.describe_environment",
    { query: z.record(z.unknown()).optional() },
    async ({ query }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(await environment.describe(query), null, 2),
        },
      ],
    })
  )

  server.tool(
    "ecp.search",
    { query: z.string(), options: z.record(z.unknown()).optional() },
    async ({ query, options: searchOpts }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            await environment.search(query, searchOpts as import("@ecp/types").SearchOptions),
            null,
            2
          ),
        },
      ],
    })
  )

  server.tool(
    "ecp.validate_workflow",
    { workflow: z.record(z.unknown()) },
    async ({ workflow }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            await environment.validate(workflow as unknown as WorkflowManifest),
            null,
            2
          ),
        },
      ],
    })
  )

  server.tool(
    "ecp.run_workflow",
    {
      workflow: z.record(z.unknown()),
      input: z.record(z.unknown()).optional(),
      dryRun: z.boolean().optional(),
    },
    async ({ workflow, input, dryRun }) => {
      const result = await environment.run(workflow as unknown as WorkflowManifest, {
        input,
        dryRun,
      })
      runs.set(result.run.id, result)
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      }
    }
  )

  server.tool(
    "ecp.get_run_status",
    { runId: z.string() },
    async ({ runId }) => {
      const result = runs.get(runId)
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result ?? { error: "Run not found" }, null, 2),
          },
        ],
      }
    }
  )

  return server
}

/** Serve MCP over stdio. @category MCP */
export async function serveStdio(options: {
  environment: Environment
  name?: string
  version?: string
}): Promise<void> {
  const server = createEcpMcpServer(options)
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

/** Serve MCP over HTTP (minimal JSON-RPC bridge). @category MCP */
export async function serveHttp(options: {
  environment: Environment
  port?: number
  name?: string
  version?: string
}): Promise<void> {
  const server = createEcpMcpServer(options)
  const port = options.port ?? 8787
  const transport = new StdioServerTransport()
  await server.connect(transport)
  createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" })
    res.end("ECP MCP HTTP transport: use stdio for full protocol in v1")
  }).listen(port)
}
