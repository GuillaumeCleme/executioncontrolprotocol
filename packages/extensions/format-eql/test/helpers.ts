import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { UtilityCapabilityContext } from "@ecp/core"
import type {
  EcpPatchDocument,
  EnvironmentDescriptor,
  EnvironmentManifest,
  WorkflowManifest,
} from "@ecp/types"
import { decodeFromEql } from "../src/decode/decode-eql.js"
import { encodeToEql } from "../src/encode/encode-eql.js"
import type { EqlDecodeInput, EqlEncodeInput } from "../src/schemas.js"

const testDir = dirname(fileURLToPath(import.meta.url))

export const testCtx = {} as UtilityCapabilityContext

export function loadWorkflowFixture(name: string): WorkflowManifest {
  const path = join(testDir, "fixtures", "workflows", `${name}.json`)
  return JSON.parse(readFileSync(path, "utf8")) as WorkflowManifest
}

export function loadPatchFixture(name: string): EcpPatchDocument {
  const path = join(testDir, "fixtures", "patches", `${name}.json`)
  return JSON.parse(readFileSync(path, "utf8")) as EcpPatchDocument
}

export function encodeWorkflow(
  manifest: WorkflowManifest,
  options?: EqlEncodeInput["options"]
) {
  return encodeToEql(
    { source: manifest, sourceSchema: "@ecp.workflow", options },
    testCtx
  )
}

export function decodeWorkflow(text: string, options?: EqlDecodeInput["options"]) {
  return decodeFromEql(
    {
      input: text,
      targetSchema: "@ecp.workflow",
      options,
    },
    testCtx
  )
}

export function encodePatch(patch: EcpPatchDocument, options?: EqlEncodeInput["options"]) {
  return encodeToEql(
    { source: patch, sourceSchema: "@ecp.patch", options },
    testCtx
  )
}

export function decodePatch(text: string, options?: EqlDecodeInput["options"]) {
  return decodeFromEql(
    {
      input: text,
      targetSchema: "@ecp.patch",
      options,
    },
    testCtx
  )
}

export function encodeEnvironment(
  manifest: EnvironmentManifest,
  options?: EqlEncodeInput["options"]
) {
  return encodeToEql(
    { source: manifest, sourceSchema: "@ecp.environment", options },
    testCtx
  )
}

export function decodeEnvironment(text: string, options?: EqlDecodeInput["options"]) {
  return decodeFromEql(
    {
      input: text,
      targetSchema: "@ecp.environment",
      options,
    },
    testCtx
  )
}

export function encodeDescribe(
  descriptor: EnvironmentDescriptor,
  options?: EqlEncodeInput["options"]
) {
  return encodeToEql(
    { source: descriptor, sourceSchema: "@ecp.environment.describe", options },
    testCtx
  )
}

export function decodeDescribe(text: string, options?: EqlDecodeInput["options"]) {
  return decodeFromEql(
    {
      input: text,
      targetSchema: "@ecp.environment.describe",
      options,
    },
    testCtx
  )
}
