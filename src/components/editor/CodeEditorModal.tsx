import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { X, Save } from "lucide-react";

type Lang = "javascript" | "typescript" | "html" | "css" | "json";

export function CodeEditorModal({
  open,
  title,
  value,
  lang = "typescript",
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  value: string;
  lang?: Lang;
  onClose: () => void;
  onSave: (v: string) => void;
}) {
  const [code, setCode] = useState(value);
  useEffect(() => setCode(value), [value, open]);

  if (!open) return null;
  const ext =
    lang === "html"
      ? [html()]
      : lang === "css"
      ? [css()]
      : lang === "json"
      ? [json()]
      : [javascript({ jsx: true, typescript: lang === "typescript" })];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="flex h-[80vh] w-[min(1000px,95vw)] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div className="text-sm font-semibold">{title}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSave(code);
                onClose();
              }}
              className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              <Save className="h-3.5 w-3.5" /> Salvar
            </button>
            <button
              onClick={onClose}
              className="rounded p-1.5 text-muted-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <CodeMirror
            value={code}
            height="100%"
            theme="dark"
            extensions={ext}
            onChange={setCode}
            basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }}
            style={{ height: "100%", fontSize: 13 }}
          />
        </div>
      </div>
    </div>
  );
}