import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Download, Upload, Layers, Workflow as WorkflowIcon, LayoutGrid, Play, Pencil, FileArchive, History, Undo2, Redo2, ExternalLink, Code2 } from "lucide-react";
import { ComponentPalette } from "@/components/editor/ComponentPalette";
import { FileTree } from "@/components/editor/FileTree";
import { Canvas } from "@/components/editor/Canvas";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { HistoryPanel } from "@/components/editor/HistoryPanel";
import { LogPanel } from "@/components/editor/LogPanel";
import { CodeEditorModal } from "@/components/editor/CodeEditorModal";
import { exportProjectZip } from "@/lib/export-zip";
import { buildPageHtml } from "@/lib/site-builder";
import { parsePageHtml } from "@/lib/html-importer";
import { useProject } from "@/lib/project-store";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FluxoStudio — Editor visual no-code React" },
      {
        name: "description",
        content:
          "Monte páginas HTML e componentes React arrastando blocos, edite propriedades, atributos, eventos e scripts com realce de sintaxe.",
      },
      { property: "og:title", content: "FluxoStudio — Editor visual no-code React" },
      {
        property: "og:description",
        content:
          "Monte páginas HTML e componentes React arrastando blocos, edite propriedades, atributos, eventos e scripts com realce de sintaxe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditorPage,
});

function EditorPage() {
  const [leftTab, setLeftTab] = useState<"palette" | "files" | "history">("files");
  const [preview, setPreview] = useState(false);
  const [htmlOpen, setHtmlOpen] = useState(false);
  const files = useProject((s) => s.files);
  const activeFile = useProject((s) =>
    s.activeFileId ? s.files.find((f) => f.id === s.activeFileId) : null
  );
  const setBlocks = useProject((s) => s.setBlocks);
  const exportProject = useProject((s) => s.exportProject);
  const importProject = useProject((s) => s.importProject);
  const undo = useProject((s) => s.undo);
  const redo = useProject((s) => s.redo);
  const lastSavedAt = useProject((s) => s.lastSavedAt);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isMobile = useIsMobile();

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
  const doExportZip = () => void exportProjectZip(exportProject());

  const pages = files.filter((f) => f.type === "page");
  const activePage = activeFile?.type === "page" ? activeFile : null;
  const pageHtml = activePage ? buildPageHtml(activePage, files, { pages, vendorLocal: false }) : "";

  const saveHtml = (source: string) => {
    if (!activePage) return;
    const { blocks } = parsePageHtml(source, activePage.blocks ?? []);
    setBlocks(activePage.id, blocks);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-[color:var(--panel)] px-3 py-1.5 md:h-11 md:flex-nowrap md:py-0">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded bg-primary text-primary-foreground">
              <WorkflowIcon className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-bold tracking-tight">FluxoStudio</span>
          </div>
          {activeFile && (
            <div className="max-w-[40vw] truncate rounded border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">
              {activeFile.name}
            </div>
          )}
          <span className="hidden text-[11px] text-muted-foreground sm:inline">
            {mounted && lastSavedAt
              ? `salvo ${new Date(lastSavedAt).toLocaleTimeString("pt-BR")}`
              : "autosave ativo"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={undo}
            title="Desfazer"
            className="rounded border border-border p-1 hover:bg-accent"
          >
            <Undo2 className="h-3 w-3" />
          </button>
          <button
            onClick={redo}
            title="Refazer"
            className="rounded border border-border p-1 hover:bg-accent"
          >
            <Redo2 className="h-3 w-3" />
          </button>
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
          <button
            onClick={doExportZip}
            className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent"
          >
            <FileArchive className="h-3 w-3" /> Baixar ZIP
          </button>
          {activePage && (
            <button
              onClick={() => setHtmlOpen(true)}
              title="Editar o código HTML da página ativa"
              className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent"
            >
              <Code2 className="h-3 w-3" /> Código HTML
            </button>
          )}
          <a
            href="/site"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent"
          >
            <ExternalLink className="h-3 w-3" /> Abrir site
          </a>
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
            {(["files", "palette", "history"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setLeftTab(t)}
                className={`flex flex-1 items-center justify-center gap-1 py-2 ${
                  leftTab === t
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "files" ? (
                  <Layers className="h-3 w-3" />
                ) : t === "palette" ? (
                  <LayoutGrid className="h-3 w-3" />
                ) : (
                  <History className="h-3 w-3" />
                )}
                {t === "files" ? "Arquivos" : t === "palette" ? "Componentes" : "Histórico"}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-3">
            {leftTab === "files" ? <FileTree /> : leftTab === "palette" ? <ComponentPalette /> : <HistoryPanel />}
          </div>
        </aside>

        {/* Center: canvas + flow */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <Canvas preview={preview} />
          </div>
          {preview && <LogPanel />}
        </main>

        {/* Right */}
        <aside className="w-72 shrink-0 border-l border-border bg-[color:var(--panel)]">
          <PropertiesPanel />
        </aside>
      </div>

      <CodeEditorModal
        open={htmlOpen}
        title={`Código HTML — ${activePage?.name ?? ""}`}
        value={pageHtml}
        lang="html"
        onClose={() => setHtmlOpen(false)}
        onSave={saveHtml}
      />
    </div>
  );
}
