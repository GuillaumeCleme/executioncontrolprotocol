import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { BrowserAuthoringService, installBrowserWorkflowShim, type BrowserOperationalEcp } from "@ecp/browser"
import type { Ecp } from "@ecp/core"
import type { EnvironmentDescriptor, ValidationResult, WorkflowManifest } from "@ecp/types"
import { compileWorkflowSource } from "@ecp/core/browser"
import { ChatPanel } from "./components/ChatPanel.js"
import { CodeSidebar } from "./components/CodeSidebar.js"
import { FirstRunModal } from "./components/FirstRunModal.js"
import { MermaidCanvas } from "./components/MermaidCanvas.js"
import { SplitPane } from "./components/SplitPane.js"
import { TopAppBar } from "./components/TopAppBar.js"
import { useChatHistory } from "./hooks/useChatHistory.js"
import { useSplitPane } from "./hooks/useSplitPane.js"
import { useWorkspaceLayout } from "./hooks/useWorkspaceLayout.js"
import { createDemoAppEnvironment } from "./lib/demo-environment.js"
import { environmentSourceFromDescriptor } from "./lib/environment-source.js"
import {
  providerCapabilityId,
  readStoredProviderMode,
  storeProviderMode,
  type ProviderMode,
} from "./lib/provider-mode.js"
import type { AppNavTab, CodeEditorTab, FormatTab } from "./types/workspace.js"

const EMPTY_MERMAID = "flowchart TD\n  empty[No workflow]"

export function App() {
  const layout = useWorkspaceLayout()
  const split = useSplitPane()
  const chat = useChatHistory()
  const [ecp, setEcp] = useState<Ecp | null>(null)
  const [providerMode, setProviderMode] = useState<ProviderMode>("demo")
  const [showModal, setShowModal] = useState(false)
  const [chromeAvailable, setChromeAvailable] = useState(false)
  const [manifest, setManifest] = useState<WorkflowManifest | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [descriptor, setDescriptor] = useState<EnvironmentDescriptor | null>(null)
  const [editorTab, setEditorTab] = useState<CodeEditorTab>("workflow")
  const [formatTab, setFormatTab] = useState<FormatTab>("fluent")
  const [activeNav, setActiveNav] = useState<AppNavTab>("editor")
  const [fluent, setFluent] = useState("// Fluent API will appear here")
  const [json, setJson] = useState("{}")
  const [toon, setToon] = useState("")
  const [patch, setPatch] = useState("")
  const [mermaid, setMermaid] = useState(EMPTY_MERMAID)
  const [prompt, setPrompt] = useState("")
  const [compileError, setCompileError] = useState<string | null>(null)
  const [runOutput, setRunOutput] = useState("")
  const [runBusy, setRunBusy] = useState(false)
  const compileTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const environmentSource = useMemo(
    () => environmentSourceFromDescriptor(descriptor),
    [descriptor]
  )

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
      else layout.openWorkspace()

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
        layout.openWorkspace()
      })()
    }, 400)
  }

  const onRun = async () => {
    if (!ecp || !manifest) return
    setRunBusy(true)
    setRunOutput("")
    setActiveNav("run")
    try {
      const result = await ecp.run(manifest)
      setRunOutput(JSON.stringify(result, null, 2))
      layout.openWorkspace()
    } catch (err) {
      setRunOutput(err instanceof Error ? err.message : String(err))
    } finally {
      setRunBusy(false)
    }
  }

  const onExecute = () => {
    void onRun()
  }

  const chatHero = !layout.workspaceOpen
  const hasWorkflow = manifest !== null

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {layout.workspaceOpen ? (
        <>
          <TopAppBar
            activeNav={activeNav}
            onNavChange={setActiveNav}
            onExecute={onExecute}
            executeDisabled={!ecp || !hasWorkflow}
            executeBusy={runBusy}
            onSettings={() => setShowModal(true)}
            validation={validation}
          />
          <main className="relative min-h-0 flex-1">
            <SplitPane
              leftWidth={split.leftWidth}
              leftCollapsed={layout.codeSidebarCollapsed}
              onDividerPointerDown={split.onPointerDown}
              left={
                <CodeSidebar
                  editorTab={editorTab}
                  onEditorTabChange={setEditorTab}
                  formatTab={formatTab}
                  onFormatTabChange={setFormatTab}
                  fluent={fluent}
                  json={json}
                  toon={toon}
                  patch={patch}
                  environmentSource={environmentSource}
                  compileError={compileError}
                  onFluentChange={onFluentChange}
                  collapsed={layout.codeSidebarCollapsed}
                  onToggleCollapse={layout.toggleCodeSidebar}
                />
              }
              right={
                <MermaidCanvas
                  mermaid={mermaid}
                  activeNav={activeNav}
                  validation={validation}
                  runOutput={runOutput}
                  runBusy={runBusy}
                  onRun={onRun}
                  hasWorkflow={hasWorkflow}
                />
              }
            />
          </main>
        </>
      ) : (
        <main className="node-canvas relative min-h-0 flex-1" />
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

      {showModal ? <FirstRunModal chromeAvailable={chromeAvailable} onComplete={onProviderComplete} /> : null}
    </div>
  )
}
