import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import type { Ecp } from "@ecp/core"
import type { EcpEncodeInput, WorkflowManifest } from "@ecp/types"
import { ECP_FORMATS } from "@ecp/types"
import { createServer } from "node:http"

/** Options for MCP server creation. @category MCP */
export interface CreateEcpMcpServerOptions {
  /** Initialized operational ECP instance. */
  ecp: Ecp
  name?: string
  version?: string
}

const runs = new Map<string, import("@ecp/types").RunResult>()

/**
 * Create an MCP server exposing ECP operational APIs.
 * @category MCP
 */
export function createEcpMcpServer(options: CreateEcpMcpServerOptions): McpServer {
  const { ecp } = options
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
          text: JSON.stringify(await ecp.describe(query), null, 2),
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
            await ecp.search(query, searchOpts as import("@ecp/types").SearchOptions),
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
            await ecp.validate(workflow as unknown as WorkflowManifest),
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
      const result = await ecp.run(workflow as unknown as WorkflowManifest, {
        input,
        dryRun,
      })
      runs.set(result.run.id, result)
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      }
    }
  )

  const formatSchema = z.enum(["json", "toon", "fluent"])

  server.tool(
    "ecp.encode",
    {
      source: z.union([z.record(z.unknown()), z.string()]),
      format: formatSchema.optional(),
      compact: z.boolean().optional(),
    },
    async ({ source, format, compact }) => {
      let op = ecp.encode(source as EcpEncodeInput["source"])
      if (format === "toon") op = op.uses("@ecp/format-toon")
      else if (format === "fluent") op = op.uses("@ecp/format-fluent")
      else op = op.uses("@ecp/format-json")
      if (compact) op = op.compact()
      const encoded = await op.process()
      return {
        content: [{ type: "text", text: JSON.stringify(encoded, null, 2) }],
      }
    }
  )

  server.tool(
    "ecp.decode",
    {
      content: z.union([z.record(z.unknown()), z.string()]),
      format: z.enum(["json", "toon"]).optional(),
      strict: z.boolean().optional(),
      targetSchema: z.string().optional(),
    },
    async ({ content, format, strict, targetSchema }) => {
      let op = ecp.decode(content)
      if (format === "toon") op = op.uses("@ecp/format-toon")
      else op = op.uses("@ecp/format-json")
      if (strict) op = op.strict()
      if (targetSchema) op = op.to(targetSchema as "@ecp.workflow")
      else if (!format || format === ECP_FORMATS.JSON) op = op.to("@ecp.workflow")
      const decoded = await op.process()
      return {
        content: [{ type: "text", text: JSON.stringify(decoded, null, 2) }],
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
  environment: import("@ecp/core").Environment
  name?: string
  version?: string
}): Promise<void> {
  const ecp = await options.environment.init()
  const server = createEcpMcpServer({ ecp, name: options.name, version: options.version })
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

/** Serve MCP over HTTP (minimal JSON-RPC bridge). @category MCP */
export async function serveHttp(options: {
  environment: import("@ecp/core").Environment
  port?: number
  name?: string
  version?: string
}): Promise<void> {
  const ecp = await options.environment.init()
  const server = createEcpMcpServer({ ecp, name: options.name, version: options.version })
  const port = options.port ?? 8787
  const transport = new StdioServerTransport()
  await server.connect(transport)
  createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" })
    res.end("ECP MCP HTTP transport: use stdio for full protocol in v1")
  }).listen(port)
}
