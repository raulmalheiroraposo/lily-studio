import { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import {
  EDITOR_LANGUAGES,
  EDITOR_THEMES,
  MonacoCodeEditor,
  type EditorLanguage,
  type EditorTheme,
} from "./MonacoCodeEditor";

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
  lang?: EditorLanguage;
  onClose: () => void;
  onSave: (v: string) => void;
}) {
  const [code, setCode] = useState(value);
  const [language, setLanguage] = useState<EditorLanguage>(lang);
  const [theme, setTheme] = useState<EditorTheme>("vs-dark");
  useEffect(() => setCode(value), [value, open]);
  useEffect(() => setLanguage(lang), [lang, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-3 sm:p-6">
      <div className="flex h-[80vh] w-[min(1000px,95vw)] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2">
          <div className="min-w-0 truncate text-sm font-semibold">{title}</div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Linguagem do editor"
              value={language}
              onChange={(event) => setLanguage(event.target.value as EditorLanguage)}
              className="rounded border border-border bg-input px-2 py-1 text-xs"
            >
              {EDITOR_LANGUAGES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select
              aria-label="Tema do editor"
              value={theme}
              onChange={(event) => setTheme(event.target.value as EditorTheme)}
              className="rounded border border-border bg-input px-2 py-1 text-xs"
            >
              {EDITOR_THEMES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
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
        <div className="min-h-0 flex-1">
          <MonacoCodeEditor value={code} language={language} theme={theme} onChange={setCode} />
        </div>
      </div>
    </div>
  );
}