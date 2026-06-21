import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import type { EnvironmentDescriptor, EnvironmentManifest } from "@executioncontextprotocol/types"
import { decodeFromEql } from "../src/decode/decode-eql.js"
import { encodeToEql } from "../src/encode/encode-eql.js"
import { testCtx } from "./helpers.js"

const testDir = dirname(fileURLToPath(import.meta.url))

function loadEnvironmentFixture(name: string): EnvironmentManifest {
  const path = join(testDir, "fixtures", "environments", `${name}.json`)
  return JSON.parse(readFileSync(path, "utf8")) as EnvironmentManifest
}

function loadDescribeFixture(name: string): EnvironmentDescriptor {
  const path = join(testDir, "fixtures", "environments", `${name}.json`)
  return JSON.parse(readFileSync(path, "utf8")) as EnvironmentDescriptor
}

describe("EQL environment manifest", () => {
  it("round-trips @ecp.environment", () => {
    const manifest = loadEnvironmentFixture("test-env")
    const encoded = encodeToEql(
      { source: manifest, sourceSchema: "@ecp.environment" },
      testCtx
    )
    expect(encoded.success).toBe(true)
    expect(encoded.result).toContain("ENVIRONMENT test-env")
    expect(encoded.result).toContain("EXTENSION @executioncontextprotocol/demo ORDER 0")

    const decoded = decodeFromEql(
      { input: encoded.result, targetSchema: "@ecp.environment" },
      testCtx
    )
    expect(decoded.success).toBe(true)
    expect(decoded.result).toEqual(manifest)
  })

  it("omits header when options.headers is false", () => {
    const manifest = loadEnvironmentFixture("test-env")
    const encoded = encodeToEql(
      {
        source: manifest,
        sourceSchema: "@ecp.environment",
        options: { headers: false },
      },
      testCtx
    )
    expect(encoded.result).not.toMatch(/^ECP /m)

    const decoded = decodeFromEql(
      {
        input: encoded.result,
        targetSchema: "@ecp.environment",
        options: { headers: false },
      },
      testCtx
    )
    expect(decoded.success).toBe(true)
    expect(decoded.result).toEqual(manifest)
  })
})

describe("EQL environment describe", () => {
  it("round-trips @ecp.environment.describe with type annotations", () => {
    const descriptor = loadDescribeFixture("discovery-describe")
    const encoded = encodeToEql(
      { source: descriptor, sourceSchema: "@ecp.environment.describe" },
      testCtx
    )
    expect(encoded.success).toBe(true)
    expect(encoded.result).toContain("CAPABILITY @executioncontextprotocol/demo.echo")
    expect(encoded.result).toMatch(/WITH value:string!/)
    expect(encoded.result).toMatch(/WITH query:string!/)

    const decoded = decodeFromEql(
      { input: encoded.result, targetSchema: "@ecp.environment.describe" },
      testCtx
    )
    expect(decoded.success).toBe(true)
    expect(decoded.result).toEqual(descriptor)
  })

  it("parses describe document starting with CAPABILITY per spec", () => {
    const text = `ECP @ecp.environment.describe 1.0
CAPABILITY @executioncontextprotocol/openai.generate
  LABEL "Generate Text"
  WITH prompt:string!
  OUT content:string`
    const decoded = decodeFromEql(
      { input: text, targetSchema: "@ecp.environment.describe" },
      testCtx
    )
    expect(decoded.success).toBe(true)
    const result = decoded.result as EnvironmentDescriptor
    expect(result.capabilities[0]?.id).toBe("@executioncontextprotocol/openai.generate")
    expect(result.capabilities[0]?.inputSchema).toEqual({ prompt: "string!" })
    expect(result.capabilities[0]?.outputSchema).toEqual({ content: "string" })
  })
})
