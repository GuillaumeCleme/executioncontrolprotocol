import { createBrowserDemoEnvironment, createEcp, registerBrowserDefaults } from "@ecp/browser"
import { registerTestExtension, type Ecp } from "@ecp/core"
import type { EnvironmentDescriptor } from "@ecp/types"

/** Build the browser demo app environment with workflow capabilities bound. */
export async function createDemoAppEnvironment(): Promise<{
  ecp: Ecp
  descriptor: EnvironmentDescriptor
}> {
  await registerBrowserDefaults()
  await registerTestExtension()
  const env = createBrowserDemoEnvironment("browser-demo-app")
  env.addExtensionBinding("@ecp/test", {})
  const ecp = await createEcp(env, { exposeGlobal: true })
  const descriptor = await ecp.describe()
  return { ecp, descriptor }
}
