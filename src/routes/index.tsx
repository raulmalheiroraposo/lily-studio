import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Download, Upload, Layers, Workflow as WorkflowIcon, LayoutGrid, Play, Pencil, FileArchive, History, Undo2, Redo2, ExternalLink, Code2, FileIcon, FolderOpen, Save, SaveAll, Server, Smartphone, ChevronDown } from "lucide-react";
import { ComponentPalette } from "@/components/editor/ComponentPalette";
import { FileTree } from "@/components/editor/FileTree";
import { Canvas } from "@/components/editor/Canvas";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { HistoryPanel } from "@/components/editor/HistoryPanel";
import { LogPanel } from "@/components/editor/LogPanel";
import { CodeEditorModal } from "@/components/editor/CodeEditorModal";
import { exportProjectZip } from "@/lib/export-zip";
import { openFiles, openFolder, saveAll, saveAs } from "@/lib/local-fs";
import { startLocalServer, buildMobileApp } from "@/lib/deploy";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuShortcut, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      { title: "Lily Studio — Editor visual no-code React" },
      {
        name: "description",
        content:
          "Monte páginas HTML e componentes React arrastando blocos, edite propriedades, atributos, eventos e scripts com realce de sintaxe.",
      },
      { property: "og:title", content: "Lily Studio — Editor visual no-code React" },
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
  const run = async (fn: () => Promise<string | number | void>, ok?: (r: never) => string) => {
    try {
      const r = await fn();
      const msg = ok ? ok(r as never) : typeof r === "string" ? r : "";
      if (msg) toast(msg);
    } catch (e) {
      toast.error(`Erro: ${(e as Error).message}`);
    }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "s") { e.preventDefault(); void run(e.shiftKey ? saveAs : saveAll); }
      else if (k === "o") { e.preventDefault(); void run(openFiles, (n: number) => (n ? `${n} arquivo(s) aberto(s).` : "")); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <span className="text-sm font-bold tracking-tight">Lily Studio</span>
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
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent">
              <FileIcon className="h-3 w-3" /> Arquivo <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onSelect={() => void run(openFiles, (n: number) => (n ? `${n} arquivo(s) aberto(s).` : ""))}>
                <Upload className="h-3.5 w-3.5" /> Abrir... <DropdownMenuShortcut>Ctrl+O</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void run(openFolder, (n: number) => (n ? `${n} arquivo(s) carregado(s) da pasta.` : ""))}>
                <FolderOpen className="h-3.5 w-3.5" /> Abrir Pasta...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void run(saveAll)}>
                <SaveAll className="h-3.5 w-3.5" /> Salvar <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void run(saveAs)}>
                <Save className="h-3.5 w-3.5" /> Salvar Como... <DropdownMenuShortcut>Ctrl+Shift+S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={doImport}>
                <Upload className="h-3.5 w-3.5" /> Importar Projeto
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={doExport}>
                <Download className="h-3.5 w-3.5" /> Exportar Projeto
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={doExportZip}>
                <FileArchive className="h-3.5 w-3.5" /> Baixar ZIP
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => void run(() => startLocalServer(exportProject()))}
            title="Iniciar o site gerado em um servidor local"
            className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent"
          >
            <Server className="h-3 w-3" /> Servidor local
          </button>
          <button
            onClick={() => {
              const name = prompt("Nome do aplicativo:", "Meu App Lily");
              if (name) void run(() => buildMobileApp(exportProject(), name), () => "Projeto do app móvel baixado. Veja o LEIA-ME.md dentro do ZIP.");
            }}
            title="Transformar o site em aplicativo para celular"
            className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent"
          >
            <Smartphone className="h-3 w-3" /> App móvel
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
      <ResizablePanelGroup
        orientation={isMobile ? "vertical" : "horizontal"}
        className="min-h-0 flex-1"
      >
        {/* Left */}
        <ResizablePanel defaultSize={isMobile ? 25 : 17} minSize={10}>
        <aside className="flex h-full min-h-0 flex-col border-border bg-[color:var(--panel)]">
          <div className="flex shrink-0 border-b border-border text-xs">
            {(["files", "palette", "history"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setLeftTab(t)}
                className={`flex min-w-0 flex-1 items-center justify-center gap-1 truncate py-2 ${
                  leftTab === t
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "files" ? (
                  <Layers className="h-3 w-3 shrink-0" />
                ) : t === "palette" ? (
                  <LayoutGrid className="h-3 w-3 shrink-0" />
                ) : (
                  <History className="h-3 w-3 shrink-0" />
                )}
                <span className="truncate">
                  {t === "files" ? "Arquivos" : t === "palette" ? "Componentes" : "Histórico"}
                </span>
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            {leftTab === "files" ? <FileTree /> : leftTab === "palette" ? <ComponentPalette /> : <HistoryPanel />}
          </div>
        </aside>
        </ResizablePanel>
        <ResizableHandle withHandle />

        {/* Center: canvas + logs */}
        <ResizablePanel defaultSize={isMobile ? 50 : 60} minSize={20}>
          <ResizablePanelGroup orientation="vertical" className="h-full">
            <ResizablePanel defaultSize={preview ? 70 : 100} minSize={20}>
              <main className="h-full min-h-0 min-w-0">
                <Canvas preview={preview} />
              </main>
            </ResizablePanel>
            {preview && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={30} minSize={10}>
                  <div className="h-full min-h-0 overflow-hidden">
                    <LogPanel />
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle />

        {/* Right */}
        <ResizablePanel defaultSize={isMobile ? 25 : 23} minSize={10}>
          <aside className="h-full min-h-0 overflow-auto border-border bg-[color:var(--panel)]">
            <PropertiesPanel />
          </aside>
        </ResizablePanel>
      </ResizablePanelGroup>

      <Toaster />
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
