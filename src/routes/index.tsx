import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  BookOpen,
  Download,
  Upload,
  Layers,
  Workflow as WorkflowIcon,
  LayoutGrid,
  Settings2,
  Menu,
  X,
} from "lucide-react";
import { ComponentPalette } from "@/components/editor/ComponentPalette";
import { FileTree } from "@/components/editor/FileTree";
import { Canvas } from "@/components/editor/Canvas";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { FlowEditor } from "@/components/flow/FlowEditor";
import { useProject } from "@/lib/project-store";

export const Route = createFileRoute("/")({
  component: EditorPage,
});

function EditorPage() {
  const [leftTab, setLeftTab] = useState<"palette" | "files">("files");
  const [bottomOpen, setBottomOpen] = useState(true);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
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
      <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border bg-[color:var(--panel)] px-2 sm:px-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={() => setLeftOpen((v) => !v)}
            className="rounded p-1.5 text-muted-foreground hover:bg-accent md:hidden"
            aria-label="Alternar painel esquerdo"
          >
            {leftOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded bg-primary text-primary-foreground">
              <WorkflowIcon className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-bold tracking-tight">FluxoStudio</span>
          </div>
          {activeFile && (
            <div className="hidden max-w-[40vw] truncate rounded border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground sm:block">
              {activeFile.name}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={doImport}
            className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent"
            title="Importar projeto"
          >
            <Upload className="h-3 w-3" /> <span className="hidden sm:inline">Importar</span>
          </button>
          <button
            onClick={doExport}
            className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent"
            title="Salvar/Exportar projeto"
          >
            <Download className="h-3 w-3" /> <span className="hidden sm:inline">Salvar</span>
          </button>
          <Link
            to="/manual"
            className="flex items-center gap-1 rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
          >
            <BookOpen className="h-3 w-3" /> <span className="hidden sm:inline">Manual</span>
          </Link>
          <button
            onClick={() => setRightOpen((v) => !v)}
            className="rounded p-1.5 text-muted-foreground hover:bg-accent md:hidden"
            aria-label="Alternar painel direito"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="relative flex min-h-0 flex-1">
        {/* Left */}
        <aside
          className={`${
            leftOpen ? "flex" : "hidden"
          } absolute inset-y-0 left-0 z-30 w-64 flex-col border-r border-border bg-[color:var(--panel)] shadow-lg md:static md:z-auto md:flex md:shadow-none`}
        >
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
        {leftOpen && (
          <button
            aria-label="Fechar painel"
            className="absolute inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setLeftOpen(false)}
          />
        )}

        {/* Center: canvas + flow */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <Canvas />
          </div>
          <div
            className="shrink-0 border-t border-border bg-[color:var(--panel)]"
            style={{ height: bottomOpen ? "45vh" : 32 }}
          >
            <div className="flex h-8 items-center justify-between border-b border-border px-3 text-xs">
              <div className="flex items-center gap-2 font-semibold">
                <WorkflowIcon className="h-3.5 w-3.5 text-primary" />
                Editor de Fluxo
              </div>
              <button
                onClick={() => setBottomOpen((v) => !v)}
                className="rounded px-2 py-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {bottomOpen ? "Recolher" : "Expandir"}
              </button>
            </div>
            {bottomOpen && (
              <div style={{ height: "calc(45vh - 32px)" }}>
                <FlowEditor />
              </div>
            )}
          </div>
        </main>

        {/* Right */}
        <aside
          className={`${
            rightOpen ? "flex" : "hidden"
          } absolute inset-y-0 right-0 z-30 w-72 flex-col border-l border-border bg-[color:var(--panel)] shadow-lg md:static md:z-auto md:flex md:shadow-none`}
        >
          <PropertiesPanel />
        </aside>
        {rightOpen && (
          <button
            aria-label="Fechar painel"
            className="absolute inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setRightOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
