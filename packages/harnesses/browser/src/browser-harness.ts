import {
  catalogHarness,
  defineHarness,
  type HarnessCapabilityContext,
} from "@ecp/core"
import {
  ECP_MODEL_GENERATE_INTERFACE,
  harnessEvaluateOutputSchema,
  type HarnessEvaluateOutput,
} from "@ecp/types"
import { z } from "zod"
import {
  getHarnessMatrixConfig,
  HARNESS_TASKS,
  type HarnessProfile,
  type HarnessTask,
} from "./harness-matrix-config.js"
import { invokeIntentClassification } from "./intent-classification.js"
import { invokeWorkflowAssistant } from "./workflow-assistant.js"
import { invokeWorkflowAuthoring } from "./workflow-authoring.js"

const harnessInputSchema = z.discriminatedUnion("task", [
  z.object({
    task: z.literal(HARNESS_TASKS.INTENT_CLASSIFICATION),
    message: z.string(),
    model: z.string().optional(),
  }),
  z.object({
    task: z.literal(HARNESS_TASKS.WORKFLOW_AUTHORING),
    request: z.string(),
    manifest: z.unknown().optional(),
    model: z.string().optional(),
  }),
  z.object({
    task: z.literal(HARNESS_TASKS.WORKFLOW_ASSISTANT),
    message: z.string(),
    runContext: z.unknown().optional(),
    model: z.string().optional(),
  }),
])

export type BrowserHarnessInput = z.infer<typeof harnessInputSchema>

const harnessBindingSchema = z
  .object({
    harnessProfile: z.enum(["matrix", "browser-demo"]).optional(),
    repair: z.record(z.string(), z.unknown()).optional(),
    trace: z.record(z.string(), z.unknown()).optional(),
    context: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough()

function handlerContextForTask(
  task: HarnessTask,
  ctx: HarnessCapabilityContext<Record<string, unknown>>
): HarnessCapabilityContext<Record<string, unknown>> {
  const profile = (ctx.config.harnessProfile as HarnessProfile | undefined) ?? "matrix"
  const taskConfig = getHarnessMatrixConfig(task, profile) as Record<
    string,
    Record<string, unknown>
  >
  const envConfig = ctx.config as Record<string, Record<string, unknown> | undefined>
  return {
    ...ctx,
    config: {
      ...taskConfig,
      ...ctx.config,
      harnessProfile: profile,
      repair: { ...taskConfig.repair, ...envConfig.repair },
      trace: { ...taskConfig.trace, ...envConfig.trace },
      context: { ...taskConfig.context, ...envConfig.context },
    },
  }
}

const browserHarnessDefinition = defineHarness("@ecp", "harness-browser")
  .withConfig(harnessBindingSchema)
  .withInput(harnessInputSchema)
  .withOutput(harnessEvaluateOutputSchema)
  .usesProviderInterface(ECP_MODEL_GENERATE_INTERFACE)
  .withHandler(async (input, ctx): Promise<HarnessEvaluateOutput> => {
    const taskCtx = handlerContextForTask(input.task, ctx)
    switch (input.task) {
      case HARNESS_TASKS.INTENT_CLASSIFICATION:
        return invokeIntentClassification(
          { message: input.message, model: input.model },
          taskCtx
        )
      case HARNESS_TASKS.WORKFLOW_AUTHORING:
        return invokeWorkflowAuthoring(
          { request: input.request, manifest: input.manifest, model: input.model },
          taskCtx
        )
      case HARNESS_TASKS.WORKFLOW_ASSISTANT:
        return invokeWorkflowAssistant(
          { message: input.message, runContext: input.runContext, model: input.model },
          taskCtx
        )
      default: {
        const _exhaustive: never = input
        throw new Error(`Unknown harness task: ${String(_exhaustive)}`)
      }
    }
  })
  .build()

/** Register the unified harness (`@ecp/harness-browser`). @category Harness */
export function registerBrowserHarness(): void {
  catalogHarness(browserHarnessDefinition)
}
