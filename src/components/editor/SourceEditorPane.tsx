import { useEffect, useState, type ReactNode } from "react";
import { Save, X } from "lucide-react";
import {
  EDITOR_LANGUAGES,
  EDITOR_THEMES,
  MonacoCodeEditor,
  type EditorLanguage,
  type EditorTheme,
} from "./MonacoCodeEditor";

let lastTheme: EditorTheme = "vs-dark";

/** Editor de código único (scripts, estilos, páginas e componentes) com a mesma barra e interface. */
export function SourceEditorPane({
  title,
  value,
  language: initialLanguage,
  onChange,
  onSave,
  onClose,
  extra,
}: {
  title: ReactNode;
  value: string;
  language: EditorLanguage;
  /** Salvamento contínuo (scripts/CSS). */
  onChange?: (v: string) => void;
  /** Salvamento explícito (código fonte de páginas/componentes). */
  onSave?: (v: string) => void;
  onClose?: () => void;
  extra?: ReactNode;
}) {
  const [language, setLanguage] = useState<EditorLanguage>(initialLanguage);
  const [theme, setThemeState] = useState<EditorTheme>(lastTheme);
  const [draft, setDraft] = useState(value);
  useEffect(() => setLanguage(initialLanguage), [initialLanguage]);
  useEffect(() => setDraft(value), [value]);
  const setTheme = (t: EditorTheme) => {
    lastTheme = t;
    setThemeState(t);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-[color:var(--panel)] px-3 py-2 text-xs">
        <div className="min-w-0 truncate font-semibold">{title}</div>
        <div className="flex flex-wrap items-center gap-2">
          {extra}
          <select
            aria-label="Linguagem do editor"
            value={language}
            onChange={(e) => setLanguage(e.target.value as EditorLanguage)}
            className="rounded border border-border bg-input px-2 py-1"
          >
            {EDITOR_LANGUAGES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            aria-label="Tema do editor"
            value={theme}
            onChange={(e) => setTheme(e.target.value as EditorTheme)}
            className="rounded border border-border bg-input px-2 py-1"
          >
            {EDITOR_THEMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {onSave && (
            <button
              onClick={() => onSave(draft)}
              className="flex items-center gap-1 rounded bg-primary px-2 py-1 font-medium text-primary-foreground hover:opacity-90"
            >
              <Save className="h-3 w-3" /> Salvar
            </button>
          )}
          {onClose && (
            <button onClick={onClose} title="Voltar ao canvas" className="flex items-center gap-1 rounded border border-border px-2 py-1 hover:bg-accent">
              <X className="h-3 w-3" /> Fechar
            </button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <MonacoCodeEditor
          value={draft}
          language={language}
          theme={theme}
          onChange={(v) => {
            setDraft(v);
            onChange?.(v);
          }}
        />
      </div>
    </div>
  );
}
