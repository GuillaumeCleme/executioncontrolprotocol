import MonacoEditor, { type EditorProps } from "@monaco-editor/react"
import type { ComponentType } from "react"
import { configureFluentMonaco, FLUENT_EDITOR_PATH } from "../lib/fluent-monaco-config.js"

/** React 19-compatible Monaco wrapper (upstream default export typing is incompatible). */
const Editor = MonacoEditor as ComponentType<EditorProps>

/** Props for {@link FluentWorkflowEditor}. */
export interface FluentWorkflowEditorProps {
  /** Fluent workflow TypeScript source. */
  value: string
  /** Called when the user edits source (debounced compile happens in the parent). */
  onChange?: (value: string | undefined) => void
}

/** Monaco editor for browser Fluent workflow source only (isolated virtual model URI). */
export function FluentWorkflowEditor({ value, onChange }: FluentWorkflowEditorProps) {
  return (
    <Editor
      height="100%"
      theme="vs-dark"
      defaultLanguage="typescript"
      language="typescript"
      path={FLUENT_EDITOR_PATH}
      value={value}
      beforeMount={configureFluentMonaco}
      onMount={(editor, monaco) => {
        configureFluentMonaco(monaco)
        const model = editor.getModel()
        if (model) {
          monaco.editor.setModelMarkers(model, "ecp", [])
        }
      }}
      onChange={onChange}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        renderValidationDecorations: "off",
        quickSuggestions: false,
        parameterHints: { enabled: false },
        suggestOnTriggerCharacters: false,
        wordBasedSuggestions: "off",
      }}
    />
  )
}
