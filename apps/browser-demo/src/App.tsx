import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { BrowserAuthoringService, installBrowserWorkflowShim, type BrowserOperationalEcp } from "@ecp/browser"
import type { Ecp } from "@ecp/core"
import type { EnvironmentDescriptor, ValidationResult, WorkflowManifest } from "@ecp/types"
import { compileWorkflowSource } from "@ecp/core/browser"
import { ChatPanel } from "./components/ChatPanel.js"
import { ChromeInstallDialog } from "./components/ChromeInstallDialog.js"
import { ChromeInstallToast } from "./components/ChromeInstallToast.js"
import { CodeSidebar } from "./components/CodeSidebar.js"
import { FirstRunModal } from "./components/FirstRunModal.js"
import { MermaidCanvas } from "./components/MermaidCanvas.js"
import { SplitPane } from "./components/SplitPane.js"
import { TopAppBar } from "./components/TopAppBar.js"
import { useChatHistory } from "./hooks/useChatHistory.js"
import { useChromeModelInstall } from "./hooks/useChromeModelInstall.js"
import { useSplitPane } from "./hooks/useSplitPane.js"
import { useWorkspaceLayout } from "./hooks/useWorkspaceLayout.js"
import { looksLikeWorkflowRequest } from "./lib/chat-routing.js"
import { createDemoAppEnvironment } from "./lib/demo-environment.js"
import { environmentSourceFromDescriptor } from "./lib/environment-source.js"
import {
  GUIDE_CHAT_CAPABILITY,
  providerCapabilityId,
  readStoredProviderMode,
  storeProviderMode,
  type AssistantMode,
  type ChromeInstallUi,
  type ProviderMode,
} from "./lib/provider-mode.js"
import type { AppNavTab, CodeEditorTab, FormatTab } from "./types/workspace.js"

const EMPTY_MERMAID = "flowchart TD\n  empty[No workflow]"

export function App() {
  const layout = useWorkspaceLayout()
  const split = useSplitPane()
  const [assistantMode, setAssistantMode] = useState<AssistantMode>("authoring")
  const chat = useChatHistory(assistantMode)
  const [ecp, setEcp] = useState<Ecp | null>(null)
  const [providerMode, setProviderMode] = useState<ProviderMode>("demo")
  const [showProviderModal, setShowProviderModal] = useState(false)
  const [chromeSupported, setChromeSupported] = useState(false)
  const [chromeReady, setChromeReady] = useState(false)
  const [chromeInstallUi, setChromeInstallUi] = useState<ChromeInstallUi>("idle")
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
  const ecpRef = useRef<Ecp | null>(null)

  const environmentSource = useMemo(
    () => environmentSourceFromDescriptor(descriptor),
    [descriptor]
  )

  const reloadEcp = useCallback(async () => {
    if (ecpRef.current) {
      await ecpRef.current.terminate()
    }
    const { ecp: operational, descriptor: desc } = await createDemoAppEnvironment()
    ecpRef.current = operational
    setEcp(operational)
    setDescriptor(desc)
    return operational
  }, [])

  const upgradeToChromeAi = useCallback(async () => {
    await reloadEcp()
    storeProviderMode("chrome-ai")
    setProviderMode("chrome-ai")
    setAssistantMode("authoring")
    setChromeReady(true)
    setChromeInstallUi("done")
    chat.appendAgent("Chrome AI is ready. Authoring now uses the on-device model.")
    chat.setStatus("Ready (chrome-ai).")
  }, [reloadEcp, chat])

  const chromeInstall = useChromeModelInstall(() => {
    void upgradeToChromeAi()
  })

  const beginChromeInstall = useCallback(
    async (surface: "dialog" | "toast") => {
      if (!ecp) return
      setChromeInstallUi(surface)
      setShowProviderModal(false)
      await chromeInstall.startInstall(ecp)
    },
    [ecp, chromeInstall]
  )

  useEffect(() => {
    installBrowserWorkflowShim()
    void (async () => {
      const { ecp: operational, descriptor: desc } = await createDemoAppEnvironment()
      ecpRef.current = operational
      setEcp(operational)
      setDescriptor(desc)

      const avail = await operational.invoke("@ecp/chrome-ai.checkAvailability").with({}).process()
      const result =
        avail.success && typeof avail.result === "object" && avail.result !== null
          ? (avail.result as { available: boolean; supported?: boolean; status?: string })
          : { available: false, supported: false }

      const supported = result.supported ?? result.status !== "unsupported"
      const ready = Boolean(result.available)
      setChromeSupported(supported)
      setChromeReady(ready)

      const stored = readStoredProviderMode()
      if (stored) {
        setProviderMode(stored)
        setAssistantMode("authoring")
        chat.setStatus(`Ready (${stored}).`)
        if (stored === "chrome-ai" && supported && !ready) {
          setChromeInstallUi("toast")
          await chromeInstall.startInstall(operational)
        }
      } else {
        setShowProviderModal(true)
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
    setAssistantMode("authoring")
    setShowProviderModal(false)
    chat.setStatus(`Ready (${mode}).`)
  }

  const onExplore = () => {
    setAssistantMode("guided")
    setProviderMode("demo")
    setShowProviderModal(false)
    chat.setGuidedWelcome()
    chat.setStatus("Guided mode — explore the editor.")
  }

  const onChromeInstallFromModal = () => {
    setAssistantMode("guided")
    setProviderMode("demo")
    chat.setGuidedWelcome()
    chat.setStatus("Installing Chrome AI...")
    void beginChromeInstall("dialog")
  }

  const runAuthoring = async (userRequest: string, cap: string) => {
    if (!ecp) return
    const service = new BrowserAuthoringService(ecp as BrowserOperationalEcp)
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
  }

  const onSubmit = async () => {
    if (!ecp || !prompt.trim()) return
    const userRequest = prompt.trim()
    chat.appendUser(userRequest)
    chat.setStatus("Thinking...")
    setPrompt("")

    try {
      if (assistantMode === "guided" && !looksLikeWorkflowRequest(userRequest)) {
        const guide = await ecp.invoke(GUIDE_CHAT_CAPABILITY).with({ message: userRequest }).process()
        if (!guide.success || !guide.result) {
          throw new Error(guide.diagnostics.map((d) => d.message).join("; ") || "Guide chat failed")
        }
        const text = String((guide.result as { text: string }).text)
        chat.appendAgent(text)
        chat.setStatus("Guided mode")
        return
      }

      chat.setStatus("Generating...")
      const cap =
        assistantMode === "guided"
          ? providerCapabilityId("demo")
          : providerCapabilityId(providerMode)
      await runAuthoring(userRequest, cap)
      if (assistantMode === "guided" && looksLikeWorkflowRequest(userRequest)) {
        setAssistantMode("authoring")
      }
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

  const chatBlocked = showProviderModal && chromeInstallUi === "dialog"
  const chatHero = !layout.workspaceOpen
  const hasWorkflow = manifest !== null
  const showInstallToast =
    chromeInstallUi === "toast" &&
    chromeInstall.installState.phase !== "ready" &&
    chromeInstall.installState.phase !== "idle"

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {layout.workspaceOpen ? (
        <>
          <TopAppBar
            activeNav={activeNav}
            onNavChange={setActiveNav}
            onExecute={() => void onRun()}
            executeDisabled={!ecp || !hasWorkflow}
            executeBusy={runBusy}
            onSettings={() => setShowProviderModal(true)}
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
        disabled={!ecp || chatBlocked}
        hero={chatHero}
      />

      {showProviderModal ? (
        <FirstRunModal
          chromeSupported={chromeSupported}
          chromeReady={chromeReady}
          onExplore={onExplore}
          onComplete={onProviderComplete}
          onChromeInstall={onChromeInstallFromModal}
        />
      ) : null}

      {chromeInstallUi === "dialog" ? (
        <ChromeInstallDialog
          state={chromeInstall.installState}
          onContinueInBackground={() => setChromeInstallUi("toast")}
          onCancel={() => {
            setChromeInstallUi("idle")
            chromeInstall.stopPolling()
            setShowProviderModal(true)
          }}
        />
      ) : null}

      <ChromeInstallToast state={chromeInstall.installState} visible={showInstallToast} />
    </div>
  )
}
