import { createBrowserDemoEnvironment, createEcp, registerBrowserDefaults } from "@ecp/browser"
import { extension, registerTestExtension, type Ecp } from "@ecp/core"
import type { EnvironmentDescriptor } from "@ecp/types"

/** Build the browser demo app environment with workflow capabilities bound. */
export async function createDemoAppEnvironment(): Promise<{
  ecp: Ecp
  descriptor: EnvironmentDescriptor
}> {
  await registerBrowserDefaults()
  await registerTestExtension()
  const env = createBrowserDemoEnvironment("browser-demo-app").withExtensions([
    extension("@ecp/test").with({}),
  ])
  const ecp = await createEcp(env, { exposeGlobal: true })
  const descriptor = await ecp.describe()
  return { ecp, descriptor }
}
