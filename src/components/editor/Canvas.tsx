import { Rnd } from "react-rnd";
import { useCallback, useState } from "react";
import { Code2, Trash2 } from "lucide-react";
import { useProject } from "@/lib/project-store";
import { BlockRenderer } from "@/components/blocks/HtmlBlock";
import { CodeEditorModal } from "./CodeEditorModal";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { runBinding } from "@/lib/script-runtime";
import { ReactBlock } from "@/components/blocks/ReactBlock";

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
  const [codeModal, setCodeModal] = useState<{ id: string; code: string } | null>(null);

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

  if (!activeFile) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Selecione ou crie um arquivo na aba de arquivos à esquerda.
      </div>
    );
  }
  if (activeFile.type === "component" && typeof activeFile.code === "string") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border bg-[color:var(--panel)] px-3 py-2 text-xs">
          <div className="font-semibold">
            Componente React:&nbsp;<span className="font-mono text-primary">{activeFile.name}</span>
          </div>
          <div className="text-muted-foreground">
            Use <code>export default function</code> — o preview ao lado atualiza em tempo real.
          </div>
        </div>
        <div className="flex min-h-0 flex-1">
          <div className="min-h-0 min-w-0 flex-1 overflow-auto border-r border-border">
            <CodeMirror
              value={activeFile.code ?? ""}
              height="100%"
              theme="dark"
              extensions={[javascript({ jsx: true, typescript: true })]}
              onChange={(v) => updateFileCode(activeFile.id, v)}
              basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true }}
              style={{ height: "100%", fontSize: 13 }}
            />
          </div>
          <div className="min-h-0 w-1/2 overflow-auto bg-background p-3">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              Preview ao vivo
            </div>
            <ReactBlock code={activeFile.code ?? ""} />
          </div>
        </div>
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

  return (
    <div
      className="relative h-full w-full overflow-auto"
      style={{ backgroundColor: "var(--canvas)", backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
      onClick={() => !preview && selectBlock(null)}
    >
      <div className="relative mx-auto my-8 min-h-[900px] w-[min(1100px,95%)] rounded-lg border border-border bg-background shadow-xl">
        {preview
          ? activeFile.blocks?.map((block) => (
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
                <BlockRenderer block={block} eventHandlers={buildHandlers(block)} resolvedCode={resolveCode(block)} />
              </div>
            ))
          : activeFile.blocks?.map((block) => {
          const selected = block.id === selectedBlockId;
          return (
            <Rnd
              key={block.id}
              size={{ width: block.w, height: block.h }}
              position={{ x: block.x, y: block.y }}
              bounds="parent"
              onDragStop={(_, d) => updateBlock(block.id, { x: d.x, y: d.y })}
              onResizeStop={(_, __, ref, ___, position) =>
                updateBlock(block.id, {
                  w: parseInt(ref.style.width),
                  h: parseInt(ref.style.height),
                  x: position.x,
                  y: position.y,
                })
              }
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                selectBlock(block.id);
              }}
              className={selected ? "outline outline-2 outline-primary" : "outline outline-1 outline-transparent hover:outline-primary/40"}
            >
              <div className="relative h-full w-full">
                <BlockRenderer block={block} resolvedCode={resolveCode(block)} />
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
        {(activeFile.blocks?.length ?? 0) === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Arraste componentes da paleta à esquerda para começar.
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
          const target = activeFile.blocks?.find((b) => b.id === codeModal.id);
          if (target?.sourceFileId) updateFileCode(target.sourceFileId, v);
          else updateBlock(codeModal.id, { code: v });
        }}
      />
    </div>
  );
}