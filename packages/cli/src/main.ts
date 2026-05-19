import {
  compileWorkflowSource,
  loadEnvironmentModule,
  loadWorkflowFile,
  loadWorkflowJson,
} from "@ecp/core"
import { serveStdio, serveHttp } from "@ecp/mcp"
import { readFile, writeFile } from "node:fs/promises"

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    printHelp()
    process.exit(1)
  }

  const cmd = args[0]
  const rest = args.slice(1)

  try {
    switch (cmd) {
      case "compile":
        await cmdCompile(rest)
        break
      case "validate":
        await cmdValidate(rest)
        break
      case "describe":
        await cmdDescribe(rest)
        break
      case "search":
        await cmdSearch(rest)
        break
      case "run":
        await cmdRun(rest)
        break
      case "mcp":
        await cmdMcp(rest)
        break
      default:
        console.error(`Unknown command: ${cmd}`)
        printHelp()
        process.exit(1)
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

function printHelp(): void {
  console.log(`ecp compile <workflow.ts|js> [-o file]
ecp validate <workflow.json> --env <environment.ts>
ecp validate --source <workflow.ts|js> --env <environment.ts>
ecp describe --env <environment.ts> [--query file.json]
ecp search <query> --env <environment.ts>
ecp run <workflow.json> --env <environment.ts> [--input file.json]
ecp mcp serve --env <environment.ts> --transport stdio|http [--port N]`)
}

function flag(rest: string[], name: string): string | undefined {
  const i = rest.indexOf(name)
  if (i === -1) return undefined
  return rest[i + 1]
}

async function cmdCompile(rest: string[]): Promise<void> {
  const positional = rest.filter((a) => !a.startsWith("-"))
  const input = positional[0]
  if (!input) throw new Error("compile requires a workflow file path")
  const out = flag(rest, "-o") ?? flag(rest, "--output")
  const source = await readFile(input, "utf8")
  const result = await compileWorkflowSource({ source, filename: input })
  if (!result.ok) {
    console.log(JSON.stringify(result, null, 2))
    process.exit(1)
  }
  const json = JSON.stringify(result.manifest, null, 2)
  if (out) await writeFile(out, json, "utf8")
  else console.log(json)
}

async function cmdValidate(rest: string[]): Promise<void> {
  const envPath = flag(rest, "--env")
  if (!envPath) throw new Error("validate requires --env")
  const env = await loadEnvironmentModule(envPath)
  const sourcePath = flag(rest, "--source")
  const positional = rest.filter((a) => !a.startsWith("-") && a !== envPath && a !== sourcePath)
  let workflow
  if (sourcePath) {
    const source = await readFile(sourcePath, "utf8")
    const compiled = await compileWorkflowSource({ source, filename: sourcePath })
    if (!compiled.manifest) {
      console.log(JSON.stringify(compiled.validation ?? compiled, null, 2))
      process.exit(1)
    }
    workflow = compiled.manifest
  } else {
    const wfPath = positional[0]
    if (!wfPath) throw new Error("validate requires workflow.json or --source")
    workflow = wfPath.endsWith(".json")
      ? await loadWorkflowJson(wfPath)
      : await loadWorkflowFile(wfPath)
  }
  const result = await env.validate(workflow)
  console.log(JSON.stringify(result, null, 2))
  if (!result.valid) process.exit(1)
}

async function cmdDescribe(rest: string[]): Promise<void> {
  const envPath = flag(rest, "--env")
  if (!envPath) throw new Error("describe requires --env")
  const env = await loadEnvironmentModule(envPath)
  const queryPath = flag(rest, "--query")
  const query = queryPath
    ? (JSON.parse(await readFile(queryPath, "utf8")) as import("@ecp/types").DescribeQuery)
    : undefined
  console.log(JSON.stringify(await env.describe(query), null, 2))
}

async function cmdSearch(rest: string[]): Promise<void> {
  const envPath = flag(rest, "--env")
  if (!envPath) throw new Error("search requires --env")
  const positional = rest.filter((a) => !a.startsWith("-") && a !== envPath)
  const query = positional.join(" ")
  if (!query) throw new Error("search requires a query string")
  const env = await loadEnvironmentModule(envPath)
  console.log(JSON.stringify(await env.search(query), null, 2))
}

async function cmdRun(rest: string[]): Promise<void> {
  const envPath = flag(rest, "--env")
  if (!envPath) throw new Error("run requires --env")
  const positional = rest.filter((a) => !a.startsWith("-") && a !== envPath)
  const wfPath = positional[0]
  if (!wfPath) throw new Error("run requires workflow.json")
  const inputPath = flag(rest, "--input")
  const input = inputPath
    ? (JSON.parse(await readFile(inputPath, "utf8")) as Record<string, unknown>)
    : undefined
  const env = await loadEnvironmentModule(envPath)
  const workflow = await loadWorkflowJson(wfPath)
  const result = await env.run(workflow, { input })
  console.log(JSON.stringify(result, null, 2))
}

async function cmdMcp(rest: string[]): Promise<void> {
  if (rest[0] !== "serve") throw new Error("usage: ecp mcp serve ...")
  const envPath = flag(rest, "--env")
  if (!envPath) throw new Error("mcp serve requires --env")
  const transport = flag(rest, "--transport") ?? "stdio"
  const port = Number(flag(rest, "--port") ?? "8787")
  const env = await loadEnvironmentModule(envPath)
  if (transport === "http") await serveHttp({ environment: env, port })
  else await serveStdio({ environment: env })
}

void main()
