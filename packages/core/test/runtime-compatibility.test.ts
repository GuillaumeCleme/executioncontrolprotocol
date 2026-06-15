import { describe, expect, it, beforeEach } from "vitest"
import { defineExtension, capabilityFor, globalRegistry, catalogExtension } from "@executioncontextprotocol/core"
import { z } from "zod"
import { validateEnvironmentWithWorkflow } from "../src/validate/environment.js"
import type { EnvironmentDescriptor, WorkflowManifest } from "@executioncontextprotocol/types"

const nodeOnlyExtension = defineExtension("@executioncontextprotocol", "test-node-only")
  .withSupportedRuntimes(["@executioncontextprotocol/node"])
  .withCapabilities([
    capabilityFor("@executioncontextprotocol/test-node-only", "echo")
      .withInput(z.object({}))
      .withOutput(z.object({}))
      .withHandler(async () => ({})),
  ])
  .build()

catalogExtension(nodeOnlyExtension)

const workflow: WorkflowManifest = {
  schema: "@ecp.workflow",
  version: "1.0",
  workflow: { id: "t", label: "t" },
  run: [
    {
      type: "step",
      id: "s1",
      capability: "@executioncontextprotocol/test-node-only.echo",
      as: "out",
    },
  ],
}

const descriptor = (runtimeId: string): EnvironmentDescriptor => ({
  schema: "@ecp.environment.describe",
  version: "1.0",
  environment: { id: "test" },
  runtime: { id: runtimeId, features: {} },
  extensions: [
    {
      id: "@executioncontextprotocol/test-node-only",
      order: 0,
      capabilities: ["@executioncontextprotocol/test-node-only.echo"],
      supportedRuntimes: ["@executioncontextprotocol/node"],
    },
  ],
  capabilities: [
    {
      id: "@executioncontextprotocol/test-node-only.echo",
      extension: "@executioncontextprotocol/test-node-only",
    },
  ],
  policies: [],
})

describe("runtime compatibility", () => {
  beforeEach(async () => {
    if (!globalRegistry.getExtension("@executioncontextprotocol/test-node-only")) {
      await globalRegistry.registerExtension(nodeOnlyExtension)
    }
  })

  it("denies node-only extension on browser runtime", () => {
    const result = validateEnvironmentWithWorkflow(workflow, descriptor("@executioncontextprotocol/browser"), {
      runtime: { id: "@executioncontextprotocol/browser", config: {} },
      extensions: [{ id: "@executioncontextprotocol/test-node-only", config: {}, order: 0 }],
      policies: [],
      harnesses: [],
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.code === "UNSUPPORTED_RUNTIME_EXTENSION")).toBe(true)
  })

  it("allows node-only extension on node runtime", () => {
    const result = validateEnvironmentWithWorkflow(workflow, descriptor("@executioncontextprotocol/node"), {
      runtime: { id: "@executioncontextprotocol/node", config: {} },
      extensions: [{ id: "@executioncontextprotocol/test-node-only", config: {}, order: 0 }],
      policies: [],
      harnesses: [],
    })
    expect(result.errors.some((e) => e.code === "UNSUPPORTED_RUNTIME_EXTENSION")).toBe(false)
  })
})
