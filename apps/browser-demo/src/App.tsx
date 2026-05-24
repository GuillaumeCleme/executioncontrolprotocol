import { useCallback, useEffect, useRef, useState } from "react"
import { BrowserAuthoringService, installBrowserWorkflowShim, type BrowserOperationalEcp } from "@ecp/browser"
import type { Ecp } from "@ecp/core"
import type { EnvironmentDescriptor, ValidationResult, WorkflowManifest } from "@ecp/types"
import { compileWorkflowSource } from "@ecp/core/browser"
import { ChatPanel } from "./components/ChatPanel.js"
import { CodePanel } from "./components/CodePanel.js"
import { EnvironmentPanel } from "./components/EnvironmentPanel.js"
import { FirstRunModal } from "./components/FirstRunModal.js"
import { WorkflowPanel } from "./components/WorkflowPanel.js"
import { useChatHistory } from "./hooks/useChatHistory.js"
import { useWorkspaceLayout } from "./hooks/useWorkspaceLayout.js"
import { createDemoAppEnvironment } from "./lib/demo-environment.js"
import {
  providerCapabilityId,
  readStoredProviderMode,
  storeProviderMode,
  type ProviderMode,
} from "./lib/provider-mode.js"
import type { CodeTab, EnvironmentTab, WorkflowTab } from "./types/workspace.js"

const EMPTY_MERMAID = "flowchart TD\n  empty[No workflow]"

export function App() {
  const layout = useWorkspaceLayout()
  const chat = useChatHistory()
  const [ecp, setEcp] = useState<Ecp | null>(null)
  const [providerMode, setProviderMode] = useState<ProviderMode>("demo")
  const [showModal, setShowModal] = useState(false)
  const [chromeAvailable, setChromeAvailable] = useState(false)
  const [manifest, setManifest] = useState<WorkflowManifest | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [descriptor, setDescriptor] = useState<EnvironmentDescriptor | null>(null)
  const [codeTab, setCodeTab] = useState<CodeTab>("fluent")
  const [workflowTab, setWorkflowTab] = useState<WorkflowTab>("graph")
  const [environmentTab, setEnvironmentTab] = useState<EnvironmentTab>("capabilities")
  const [fluent, setFluent] = useState("// Fluent API will appear here")
  const [json, setJson] = useState("{}")
  const [toon, setToon] = useState("")
  const [patch, setPatch] = useState("")
  const [mermaid, setMermaid] = useState(EMPTY_MERMAID)
  const [prompt, setPrompt] = useState("")
  const [compileError, setCompileError] = useState<string | null>(null)
  const [runOutput, setRunOutput] = useState("")
  const [runBusy, setRunBusy] = useState(false)
  const [describeBusy, setDescribeBusy] = useState(false)
  const compileTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refreshDescriptor = useCallback(async (operational: Ecp) => {
    setDescribeBusy(true)
    try {
      setDescriptor(await operational.describe())
    } finally {
      setDescribeBusy(false)
    }
  }, [])

  useEffect(() => {
    installBrowserWorkflowShim()
    void (async () => {
      const { ecp: operational, descriptor: desc } = await createDemoAppEnvironment()
      setEcp(operational)
      setDescriptor(desc)

      const avail = await operational
        .invoke("@ecp/chrome-ai.checkAvailability")
        .with({})
        .process()
      const chromeOk =
        avail.success &&
        typeof avail.result === "object" &&
        avail.result !== null &&
        "available" in avail.result &&
        Boolean((avail.result as { available: boolean }).available)
      setChromeAvailable(chromeOk)

      const stored = readStoredProviderMode()
      if (stored) {
        setProviderMode(stored)
        chat.setStatus(`Ready (${stored}).`)
      } else {
        setShowModal(true)
      }
    })()
  }, [])

  const applyPanels = useCallback(
    async (nextManifest: WorkflowManifest, patchToon = "") => {
      if (!ecp) return
      const service = new BrowserAuthoringService(ecp as BrowserOperationalEcp)
      const panels = await service.encodePanels(nextManifest, patchToon)
      setManifest(nextManifest)
      setFluent(panels.fluent)
      setJson(panels.json)
      setToon(panels.toon)
      setMermaid(panels.mermaid || EMPTY_MERMAID)
      setPatch(panels.patch)
      const val = await ecp.validate(nextManifest)
      setValidation(val)
    },
    [ecp]
  )

  const onProviderComplete = (mode: ProviderMode) => {
    storeProviderMode(mode)
    setProviderMode(mode)
    setShowModal(false)
    chat.setStatus(`Ready (${mode}).`)
  }

  const onSubmit = async () => {
    if (!ecp || !prompt.trim()) return
    const userRequest = prompt.trim()
    chat.appendUser(userRequest)
    chat.setStatus("Generating...")
    setPrompt("")
    try {
      const service = new BrowserAuthoringService(ecp as BrowserOperationalEcp)
      const cap = providerCapabilityId(providerMode)
      const result = manifest
        ? await service.patchWorkflow({ userRequest, manifest, providerCapabilityId: cap })
        : await service.createWorkflow({ userRequest, providerCapabilityId: cap })

      const hadWorkflow = manifest !== null
      setManifest(result.manifest)
      setFluent(result.panels.fluent)
      setJson(result.panels.json)
      setToon(result.panels.toon)
      setMermaid(result.panels.mermaid || EMPTY_MERMAID)
      setPatch(result.panels.patch)
      setValidation(result.validation)

      if (!hadWorkflow) layout.onFirstWorkflow()
      else layout.openWorkflow()

      const msg = result.validation.valid ? "Updated workflow." : "Workflow has validation issues."
      chat.setStatus(msg)
      chat.appendAgent(msg)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      chat.setStatus(msg)
      chat.appendAgent(msg)
    }
  }

  const onFluentChange = (value: string | undefined) => {
    const source = value ?? ""
    setFluent(source)
    if (compileTimer.current) clearTimeout(compileTimer.current)
    compileTimer.current = setTimeout(() => {
      void (async () => {
        const compiled = await compileWorkflowSource({
          source,
          filename: "workflow.ts",
          resolveImports: "browser-global",
        })
        if (!compiled.ok || !compiled.manifest || !ecp) {
          setCompileError(compiled.compileErrors?.map((e) => e.message).join("; ") ?? "Compile failed")
          return
        }
        setCompileError(null)
        await applyPanels(compiled.manifest)
        layout.openWorkflow()
      })()
    }, 400)
  }

  const onRun = async () => {
    if (!ecp || !manifest) return
    setRunBusy(true)
    setRunOutput("")
    try {
      const result = await ecp.run(manifest)
      setRunOutput(JSON.stringify(result, null, 2))
      setWorkflowTab("run")
      layout.openWorkflow()
    } catch (err) {
      setRunOutput(err instanceof Error ? err.message : String(err))
    } finally {
      setRunBusy(false)
    }
  }

  const workspaceVisible = layout.workspace !== "empty"
  const chatHero = !workspaceVisible

  return (
    <div className={`app-shell app-shell--chat-${layout.chat}`}>
      {workspaceVisible ? (
        <main className={`workspace workspace--${layout.workspace}`}>
          {layout.codeOpen ? (
            <CodePanel
              tab={codeTab}
              onTabChange={setCodeTab}
              fluent={fluent}
              json={json}
              toon={toon}
              patch={patch}
              compileError={compileError}
              onFluentChange={onFluentChange}
              onClose={layout.closeCode}
            />
          ) : (
            <button type="button" className="workspace-reveal workspace-reveal--code" onClick={layout.openCode}>
              Code
            </button>
          )}
          {layout.workflowOpen ? (
            <WorkflowPanel
              tab={workflowTab}
              onTabChange={setWorkflowTab}
              mermaid={mermaid}
              validation={validation}
              runOutput={runOutput}
              runBusy={runBusy}
              onRun={onRun}
              onClose={layout.closeWorkflow}
            />
          ) : (
            <button
              type="button"
              className="workspace-reveal workspace-reveal--workflow"
              onClick={layout.openWorkflow}
            >
              Workflow
            </button>
          )}
          {layout.environmentOpen ? (
            <EnvironmentPanel
              tab={environmentTab}
              onTabChange={setEnvironmentTab}
              descriptor={descriptor}
              providerMode={providerMode}
              refreshBusy={describeBusy}
              onRefresh={() => {
                if (ecp) void refreshDescriptor(ecp)
              }}
              onClose={layout.closeEnvironment}
            />
          ) : (
            <button
              type="button"
              className="workspace-reveal workspace-reveal--environment"
              onClick={layout.openEnvironment}
            >
              Environment
            </button>
          )}
        </main>
      ) : (
        <div className="canvas-empty" />
      )}

      <ChatPanel
        chat={layout.chat}
        onChatChange={layout.setChat}
        messages={chat.messages}
        status={chat.status}
        prompt={prompt}
        onPromptChange={setPrompt}
        onSubmit={() => void onSubmit()}
        disabled={!ecp || showModal}
        hero={chatHero}
      />

      {!workspaceVisible && manifest ? (
        <div className="launch-actions">
          <button type="button" onClick={layout.openWorkflow}>
            Workflow
          </button>
          <button type="button" onClick={layout.openCode}>
            Code
          </button>
          <button type="button" onClick={layout.openEnvironment}>
            Environment
          </button>
        </div>
      ) : null}

      {showModal ? <FirstRunModal chromeAvailable={chromeAvailable} onComplete={onProviderComplete} /> : null}
    </div>
  )
}
