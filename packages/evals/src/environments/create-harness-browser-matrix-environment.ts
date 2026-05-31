import { harness } from "@ecp/core"
import { createBrowserDemoEnvironment, registerBrowserDefaults } from "@ecp/browser"
import { registerTestExtension } from "@ecp/core"
import { EVALS_HARNESS_ID } from "@ecp/harnesses-evals"
import { EVAL_MATRIX_HARNESS_BINDING } from "../harness-eval-config.js"
import type { EvalProviderProfile } from "../profiles/eval-provider.js"

async function registerBrowserMatrixEval(): Promise<void> {
  await registerBrowserDefaults()
  await registerTestExtension()
}

/**
 * Matrix harness eval environment for browser providers (e.g. Chrome Nano).
 * Same harness binding as Node matrix; no Node-only extension imports.
 * @category Evals
 */
export async function createHarnessBrowserMatrixEnvironment(provider: EvalProviderProfile) {
  if (provider.runtime !== "browser") {
    throw new Error(
      `createHarnessBrowserMatrixEnvironment expects runtime "browser", got ${provider.runtime}`
    )
  }
  await registerBrowserMatrixEval()
  const env = createBrowserDemoEnvironment(`harness-${provider.id}-matrix-eval`)
  env.withHarnesses([
    harness(EVALS_HARNESS_ID)
      .uses(provider.generateCapability)
      .with({ ...EVAL_MATRIX_HARNESS_BINDING }),
  ])
  env.addExtensionBinding("@ecp/test", {})
  env.addExtensionBinding("@ecp/format-json", {})
  return env
}
