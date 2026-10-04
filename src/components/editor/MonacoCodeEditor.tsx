import { lazy, Suspense } from "react";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

export type EditorLanguage = "typescript" | "javascript" | "html" | "css" | "json";
export type EditorTheme = "vs-dark" | "light" | "hc-black";

export const EDITOR_LANGUAGES: { value: EditorLanguage; label: string }[] = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
];

export const EDITOR_THEMES: { value: EditorTheme; label: string }[] = [
  { value: "vs-dark", label: "Escuro" },
  { value: "light", label: "Claro" },
  { value: "hc-black", label: "Alto contraste" },
];

export function languageFromName(name: string): EditorLanguage {
  const lower = name.toLowerCase();
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".js") || lower.endsWith(".jsx") || lower.endsWith(".mjs")) return "javascript";
  return "typescript";
}

export function MonacoCodeEditor({
  value,
  language,
  theme,
  onChange,
}: {
  value: string;
  language: EditorLanguage;
  theme: EditorTheme;
  onChange: (value: string) => void;
}) {
  return (
    <Suspense
      fallback={
        <div className="grid h-full place-items-center bg-card text-xs text-muted-foreground">
          Carregando editor…
        </div>
      }
    >
      <MonacoEditor
        height="100%"
        value={value}
        language={language}
        theme={theme}
        onChange={(next) => onChange(next ?? "")}
        options={{
          automaticLayout: true,
          minimap: { enabled: true },
          fontSize: 13,
          folding: true,
          lineNumbers: "on",
          renderWhitespace: "selection",
          scrollBeyondLastLine: false,
          tabSize: 2,
          wordWrap: "on",
        }}
      />
    </Suspense>
  );
}