import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Download, Upload, Layers, Workflow as WorkflowIcon, LayoutGrid, Play, Pencil } from "lucide-react";
import { ComponentPalette } from "@/components/editor/ComponentPalette";
import { FileTree } from "@/components/editor/FileTree";
import { Canvas } from "@/components/editor/Canvas";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { useProject } from "@/lib/project-store";

export const Route = createFileRoute("/")({
  component: EditorPage,
});

function EditorPage() {
  const [leftTab, setLeftTab] = useState<"palette" | "files">("files");
  const [preview, setPreview] = useState(false);
  const activeFile = useProject((s) =>
    s.activeFileId ? s.files.find((f) => f.id === s.activeFileId) : null
  );
  const exportProject = useProject((s) => s.exportProject);
  const importProject = useProject((s) => s.importProject);

  const doExport = () => {
    const data = JSON.stringify(exportProject(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "projeto-nocode.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const doImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const data = JSON.parse(await file.text());
      importProject(data);
    };
    input.click();
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-[color:var(--panel)] px-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded bg-primary text-primary-foreground">
              <WorkflowIcon className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-bold tracking-tight">FluxoStudio</span>
          </div>
          {activeFile && (
            <div className="rounded border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">
              {activeFile.name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview((v) => !v)}
            className={`flex items-center gap-1 rounded border px-2 py-1 text-xs ${
              preview
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-accent"
            }`}
          >
            {preview ? <Pencil className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {preview ? "Editar" : "Preview"}
          </button>
          <button
            onClick={doImport}
            className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent"
          >
            <Upload className="h-3 w-3" /> Importar
          </button>
          <button
            onClick={doExport}
            className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent"
          >
            <Download className="h-3 w-3" /> Salvar/Exportar
          </button>
          <Link
            to="/manual"
            className="flex items-center gap-1 rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
          >
            <BookOpen className="h-3 w-3" /> Manual
          </Link>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Left */}
        <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-[color:var(--panel)]">
          <div className="flex border-b border-border text-xs">
            {(["files", "palette"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setLeftTab(t)}
                className={`flex flex-1 items-center justify-center gap-1 py-2 ${
                  leftTab === t
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "files" ? <Layers className="h-3 w-3" /> : <LayoutGrid className="h-3 w-3" />}
                {t === "files" ? "Arquivos" : "Componentes"}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-3">
            {leftTab === "files" ? <FileTree /> : <ComponentPalette />}
          </div>
        </aside>

        {/* Center: canvas + flow */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <Canvas preview={preview} />
          </div>
        </main>

        {/* Right */}
        <aside className="w-72 shrink-0 border-l border-border bg-[color:var(--panel)]">
          <PropertiesPanel />
        </aside>
      </div>
    </div>
  );
}
