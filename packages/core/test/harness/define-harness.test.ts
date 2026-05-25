import { describe, expect, it } from "vitest"
import { z } from "zod"
import { ECP_MODEL_GENERATE_INTERFACE } from "@ecp/types"
import {
  defineHarness,
  isHarnessDefinition,
  resolveHarnessRef,
} from "../../src/harness/define-harness.js"
import { catalogHarness } from "../../src/harness/harness-catalog.js"
import {
  registerStandardHarnesses,
  resetStandardHarnessesRegistrationForTests,
} from "../../src/harness/register-standard-harnesses.js"

describe("defineHarness", () => {
  it("requires a handler before build()", () => {
    expect(() =>
      defineHarness("@ecp", "incomplete")
        .withConfig(z.object({}))
        .usesProviderInterface(ECP_MODEL_GENERATE_INTERFACE)
        .build()
    ).toThrow("requires .withHandler()")
  })

  it("builds a harness definition with handler", () => {
    const def = defineHarness("@ecp", "sample")
      .withInput(z.object({ value: z.string() }))
      .usesProviderInterface(ECP_MODEL_GENERATE_INTERFACE)
      .withHandler(async (input) => input)
      .build()

    expect(def.id).toBe("@ecp/sample")
    expect(isHarnessDefinition(def)).toBe(true)
    expect(isHarnessDefinition({ id: "@ecp/x" })).toBe(false)
  })

  it("resolves harness refs from catalog", () => {
    resetStandardHarnessesRegistrationForTests()
    registerStandardHarnesses()
    expect(resolveHarnessRef("@ecp/workflow-authoring")?.id).toBe("@ecp/workflow-authoring")
    expect(resolveHarnessRef("@ecp/missing")).toBeUndefined()
  })

  it("resolves inline harness definitions", () => {
    const inline = defineHarness("@ecp", "inline")
      .usesProviderInterface(ECP_MODEL_GENERATE_INTERFACE)
      .withHandler(async () => ({}))
      .build()
    catalogHarness(inline)
    expect(resolveHarnessRef(inline)?.id).toBe("@ecp/inline")
  })

  it("allows resetting standard harness registration for tests", () => {
    resetStandardHarnessesRegistrationForTests()
    registerStandardHarnesses()
    registerStandardHarnesses()
    expect(resolveHarnessRef("@ecp/workflow-authoring")).toBeDefined()
  })
})
