import { useCallback, useEffect, useState } from "react"
import Editor from "@monaco-editor/react"
import {
  BrowserAuthoringService,
  createBrowserDemoEnvironment,
  createEcp,
  registerBrowserDefaults,
  type BrowserOperationalEcp,
} from "@ecp/browser"
import type { WorkflowManifest } from "@ecp/types"
import { compileWorkflowSource } from "@ecp/core/browser"

type CodeTab = "fluent" | "json" | "toon" | "mermaid"

export function App() {
  const [ecp, setEcp] = useState<BrowserOperationalEcp | null>(null)
  const [manifest, setManifest] = useState<WorkflowManifest | null>(null)
  const [codeTab, setCodeTab] = useState<CodeTab>("fluent")
  const [fluent, setFluent] = useState("// Fluent API will appear here")
  const [json, setJson] = useState("{}")
  const [toon, setToon] = useState("")
  const [mermaid, setMermaid] = useState("flowchart TD\n  empty[No workflow]")
  const [prompt, setPrompt] = useState("")
  const [status, setStatus] = useState("Initializing ECP...")

  useEffect(() => {
    void (async () => {
      await registerBrowserDefaults()
      const env = createBrowserDemoEnvironment("browser-demo-app")
      const operational = await createEcp(env, { exposeGlobal: true })
      setEcp(operational)
      setStatus("Ready. Ask for a workflow in demo mode.")
    })()
  }, [])

  const refreshPanels = useCallback(
    async (nextManifest: WorkflowManifest) => {
      if (!ecp) return
      const service = new BrowserAuthoringService(ecp)
      const panels = await service.encodePanels(nextManifest)
      setManifest(nextManifest)
      setFluent(panels.fluent)
      setJson(panels.json)
      setToon(panels.toon)
      setMermaid(panels.mermaid)
    },
    [ecp]
  )

  const onSubmit = async () => {
    if (!ecp || !prompt.trim()) return
    setStatus("Generating...")
    try {
      const service = new BrowserAuthoringService(ecp)
      const result = manifest
        ? await service.patchWorkflow({
            userRequest: prompt,
            manifest,
            providerCapabilityId: "@ecp/demo.generateText",
          })
        : await service.createWorkflow({
            userRequest: prompt,
            providerCapabilityId: "@ecp/demo.generateText",
          })
      setManifest(result.manifest)
      setFluent(result.panels.fluent)
      setJson(result.panels.json)
      setToon(result.panels.toon)
      setMermaid(result.panels.mermaid)
      setStatus(result.validation.valid ? "Updated workflow." : "Workflow has validation issues.")
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err))
    }
  }

  const onFluentChange = async (value: string | undefined) => {
    const source = value ?? ""
    setFluent(source)
    const compiled = await compileWorkflowSource({ source, filename: "workflow.ts" })
    if (!compiled.ok || !compiled.manifest || !ecp) return
    await refreshPanels(compiled.manifest)
  }

  const editorValue =
    codeTab === "fluent" ? fluent : codeTab === "json" ? json : codeTab === "toon" ? toon : mermaid

  const editorLanguage =
    codeTab === "fluent" ? "typescript" : codeTab === "mermaid" ? "markdown" : "plaintext"

  return (
    <>
      <div className="workspace">
        <section className="panel">
          <header>
            Code
            {(["fluent", "json", "toon", "mermaid"] as CodeTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                style={{
                  marginLeft: 8,
                  opacity: codeTab === tab ? 1 : 0.5,
                  background: "transparent",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                }}
                onClick={() => setCodeTab(tab)}
              >
                {tab}
              </button>
            ))}
          </header>
          <Editor
            height="100%"
            theme="vs-dark"
            language={editorLanguage}
            value={editorValue}
            onChange={codeTab === "fluent" ? onFluentChange : undefined}
            options={{ minimap: { enabled: false }, fontSize: 13 }}
          />
        </section>
        <section className="panel">
          <header>Workflow graph</header>
          <pre style={{ padding: 12, margin: 0, overflow: "auto" }}>{mermaid}</pre>
        </section>
      </div>
      <p className="status">{status}</p>
      <div className="chat-dock">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe a workflow or change..."
          onKeyDown={(e) => {
            if (e.key === "Enter") void onSubmit()
          }}
        />
        <button type="button" onClick={() => void onSubmit()}>
          Send
        </button>
      </div>
    </>
  )
}
