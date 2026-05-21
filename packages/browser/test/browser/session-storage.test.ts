import { describe, expect, it } from "vitest"
import { createBrowserDemoEnvironment, registerBrowserDefaults } from "../../src/environment.js"
import { setBrowserSessionValue } from "../../src/extensions/browser-session-config.js"

describe("@ecp/browser-session-config in browser", () => {
  it("reads values from localStorage via session config", async () => {
    localStorage.clear()
    localStorage.setItem("ecp:session:demoKey", JSON.stringify("from-storage"))
    setBrowserSessionValue("demoKey", "from-storage")

    await registerBrowserDefaults()
    const env = createBrowserDemoEnvironment("session-browser")
    await env.describe()
    const desc = await env.describe({
      extensions: { match: "browser-session" },
    })
    expect(desc.extensions.some((e) => e.id === "@ecp/browser-session-config")).toBe(true)
    expect(localStorage.getItem("ecp:session:demoKey")).toBeTruthy()
  })
})
