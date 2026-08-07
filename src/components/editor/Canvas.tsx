import { Rnd } from "react-rnd";
import { useCallback, useEffect, useRef, useState } from "react";
import { Code2, Trash2 } from "lucide-react";
import { useProject } from "@/lib/project-store";
import { BlockRenderer } from "@/components/blocks/HtmlBlock";
import { CodeEditorModal } from "./CodeEditorModal";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { runBinding } from "@/lib/script-runtime";
import { ReactBlock } from "@/components/blocks/ReactBlock";
import { blocksToTsx } from "@/lib/tsx-generator";
import { parseComponentTsx } from "@/lib/tsx-importer";
import type { Block } from "@/lib/types";
import { snapRect, snapResize, type Guides } from "@/lib/snap";

export function Canvas({ preview }: { preview: boolean }) {
  const activeFile = useProject((s) =>
    s.activeFileId ? s.files.find((f) => f.id === s.activeFileId) : null
  );
  const files = useProject((s) => s.files);
  const selectedBlockId = useProject((s) => s.selectedBlockId);
  const selectBlock = useProject((s) => s.selectBlock);
  const updateBlock = useProject((s) => s.updateBlock);
  const removeBlock = useProject((s) => s.removeBlock);
  const updateFileCode = useProject((s) => s.updateFileCode);
  const setGeneratedCode = useProject((s) => s.setGeneratedCode);
  const setBlocks = useProject((s) => s.setBlocks);
  const [codeModal, setCodeModal] = useState<{ id: string; code: string } | null>(null);
  const [tsxOpen, setTsxOpen] = useState(false);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [surfaceSize, setSurfaceSize] = useState({ w: 1100, h: 900 });
  const [guides, setGuides] = useState<Guides | null>(null);
  const [live, setLive] = useState<{ id: string; x: number; y: number; w: number; h: number } | null>(
    null
  );

  useEffect(() => {
    const el = surfaceRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      setSurfaceSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSurfaceSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [activeFile?.id]);

  const resolveCode = useCallback(
    (block: { code?: string; sourceFileId?: string }) =>
      block.sourceFileId
        ? files.find((f) => f.id === block.sourceFileId)?.code ?? ""
        : block.code ?? "",
    [files]
  );

  const buildHandlers = useCallback(
    (block: { events: { event: string }[] }) => {
      const map: Record<string, (e: unknown) => void> = {};
      for (const ev of block.events) {
        const prev = map[ev.event];
        map[ev.event] = (e) => {
          prev?.(e);
          void runBinding(ev as never, files, e);
        };
      }
      return map;
    },
    [files]
  );

  // Keeps a component file's TSX code in sync with its visual blocks.
  const isComponent = activeFile?.type === "component";
  const blocks = activeFile?.blocks ?? [];
  const signature = isComponent ? JSON.stringify(blocks) : "";
  const lastSignature = useRef<string>("");
  useEffect(() => {
    if (!isComponent || !activeFile || blocks.length === 0) return;
    if (lastSignature.current === signature) return;
    lastSignature.current = signature;
    setGeneratedCode(activeFile.id, blocksToTsx(activeFile.name, blocks));
  }, [isComponent, signature, activeFile, blocks, setGeneratedCode]);

  if (!activeFile) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Selecione ou crie um arquivo na aba de arquivos à esquerda.
      </div>
    );
  }

  if (activeFile.type === "script") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border bg-[color:var(--panel)] px-3 py-2 text-xs">
          <div className="font-semibold">
            Editando script:&nbsp;<span className="font-mono text-primary">{activeFile.name}</span>
          </div>
          <div className="text-muted-foreground">
            Declare funções (<code>function nome()</code> / <code>const nome = () =&gt; …</code>) — elas ficam disponíveis nos eventos.
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <CodeMirror
            value={activeFile.code ?? ""}
            height="100%"
            theme="dark"
            extensions={[javascript({ jsx: false, typescript: false })]}
            onChange={(v) => updateFileCode(activeFile.id, v)}
            basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }}
            style={{ height: "100%", fontSize: 13 }}
          />
        </div>
      </div>
    );
  }

  const renderBlock = (block: Block) => (
    <BlockRenderer
      block={block}
      eventHandlers={preview ? buildHandlers(block) : undefined}
      resolvedCode={resolveCode(block)}
    />
  );

  const surface = (
    <div
      className="relative h-full w-full overflow-auto"
      style={{
        backgroundColor: "var(--canvas)",
        backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
      onClick={() => !preview && selectBlock(null)}
    >
      <div
        ref={surfaceRef}
        className="relative mx-auto my-4 min-h-[600px] w-[min(1100px,96%)] rounded-lg border border-border bg-background shadow-xl sm:my-8 sm:min-h-[900px]"
      >
        {preview
          ? blocks.map((block) => (
              <div
                key={block.id}
                style={{
                  position: "absolute",
                  left: block.x,
                  top: block.y,
                  width: block.w,
                  height: block.h,
                }}
              >
                {renderBlock(block)}
              </div>
            ))
          : blocks.map((block) => {
              const selected = block.id === selectedBlockId;
              const l = live?.id === block.id ? live : null;
              return (
                <Rnd
                  key={block.id}
                  size={{ width: l?.w ?? block.w, height: l?.h ?? block.h }}
                  position={{ x: l?.x ?? block.x, y: l?.y ?? block.y }}
                  bounds="parent"
                  onDrag={(_, d) => {
                    const s = snapRect(
                      { x: d.x, y: d.y, w: block.w, h: block.h },
                      blocks,
                      block.id,
                      surfaceSize
                    );
                    setGuides(s.guides);
                    setLive({ id: block.id, x: s.x, y: s.y, w: block.w, h: block.h });
                  }}
                  onDragStop={(_, d) => {
                    const s = snapRect(
                      { x: d.x, y: d.y, w: block.w, h: block.h },
                      blocks,
                      block.id,
                      surfaceSize
                    );
                    setGuides(null);
                    setLive(null);
                    updateBlock(block.id, { x: s.x, y: s.y });
                  }}
                  onResize={(_, __, ref, ___, position) => {
                    const s = snapResize(
                      {
                        x: position.x,
                        y: position.y,
                        w: parseInt(ref.style.width),
                        h: parseInt(ref.style.height),
                      },
                      blocks,
                      block.id,
                      surfaceSize
                    );
                    setGuides(s.guides);
                    setLive({ id: block.id, ...s.rect });
                  }}
                  onResizeStop={(_, __, ref, ___, position) => {
                    const s = snapResize(
                      {
                        x: position.x,
                        y: position.y,
                        w: parseInt(ref.style.width),
                        h: parseInt(ref.style.height),
                      },
                      blocks,
                      block.id,
                      surfaceSize
                    );
                    setGuides(null);
                    setLive(null);
                    updateBlock(block.id, { ...s.rect });
                  }}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    selectBlock(block.id);
                  }}
                  className={
                    selected
                      ? "outline outline-2 outline-primary"
                      : "outline outline-1 outline-transparent hover:outline-primary/40"
                  }
                >
                  <div className="relative h-full w-full">
                    {renderBlock(block)}
                    {selected && (
                      <div className="absolute -top-8 left-0 flex items-center gap-1 rounded-md border border-border bg-card px-1.5 py-1 text-xs shadow">
                        <span className="px-1 text-[10px] uppercase text-muted-foreground">{block.kind}</span>
                        {block.kind === "react" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCodeModal({ id: block.id, code: resolveCode(block) });
                            }}
                            title="Editar código"
                            className="rounded p-1 hover:bg-accent"
                          >
                            <Code2 className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBlock(block.id);
                          }}
                          title="Excluir"
                          className="rounded p-1 text-destructive hover:bg-accent"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </Rnd>
              );
            })}
        {guides && !preview && (
          <div className="pointer-events-none absolute inset-0 z-50">
            {guides.x.map((x, i) => (
              <div
                key={`gx-${i}`}
                className="absolute top-0 bottom-0 w-px bg-primary/80"
                style={{ left: x }}
              />
            ))}
            {guides.y.map((y, i) => (
              <div
                key={`gy-${i}`}
                className="absolute right-0 left-0 h-px bg-primary/80"
                style={{ top: y }}
              />
            ))}
          </div>
        )}
        {blocks.length === 0 && !preview && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Arraste componentes da paleta à esquerda para começar.
          </div>
        )}
        {blocks.length === 0 && preview && isComponent && (
          <div className="absolute inset-0 p-4">
            <ReactBlock code={activeFile.code ?? ""} />
          </div>
        )}
      </div>

      <CodeEditorModal
        open={!!codeModal}
        title="Editar componente React"
        value={codeModal?.code ?? ""}
        lang="typescript"
        onClose={() => setCodeModal(null)}
        onSave={(v) => {
          if (!codeModal) return;
          const target = blocks.find((b) => b.id === codeModal.id);
          if (target?.sourceFileId) updateFileCode(target.sourceFileId, v);
          else updateBlock(codeModal.id, { code: v });
        }}
      />
    </div>
  );

  if (!isComponent) return surface;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-[color:var(--panel)] px-3 py-2 text-xs">
        <div className="font-semibold">
          Componente React:&nbsp;<span className="font-mono text-primary">{activeFile.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {preview
              ? "Preview do componente"
              : "Arraste componentes da paleta — o TSX é gerado automaticamente"}
          </span>
          <button
            onClick={() => setTsxOpen(true)}
            className="flex items-center gap-1 rounded border border-border px-2 py-1 hover:bg-accent"
          >
            <Code2 className="h-3 w-3" /> Código TSX
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">{surface}</div>
      <CodeEditorModal
        open={tsxOpen}
        title={`Código TSX — ${activeFile.name}`}
        value={activeFile.code ?? ""}
        lang="typescript"
        onClose={() => setTsxOpen(false)}
        onSave={(v) => {
          updateFileCode(activeFile.id, v);
          // Reflects hand-written TSX back into the visual blocks.
          if ((activeFile.blocks ?? []).length === 0) return;
          const parsed = parseComponentTsx(v, activeFile.blocks ?? []);
          lastSignature.current = "";
          setBlocks(activeFile.id, parsed.blocks);
        }}
      />
    </div>
  );
}
