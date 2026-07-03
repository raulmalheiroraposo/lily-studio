import { Rnd } from "react-rnd";
import { useState } from "react";
import { Code2, Trash2 } from "lucide-react";
import { useProject } from "@/lib/project-store";
import { BlockRenderer } from "@/components/blocks/HtmlBlock";
import { CodeEditorModal } from "./CodeEditorModal";

export function Canvas() {
  const activeFile = useProject((s) =>
    s.activeFileId ? s.files.find((f) => f.id === s.activeFileId) : null
  );
  const selectedBlockId = useProject((s) => s.selectedBlockId);
  const selectBlock = useProject((s) => s.selectBlock);
  const updateBlock = useProject((s) => s.updateBlock);
  const removeBlock = useProject((s) => s.removeBlock);
  const [codeModal, setCodeModal] = useState<{ id: string; code: string } | null>(null);

  if (!activeFile) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Selecione ou crie um arquivo na aba de arquivos à esquerda.
      </div>
    );
  }
  if (activeFile.type === "action") {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Este arquivo é uma <b className="mx-1 text-foreground">Ação</b>. Abra o painel de fluxo abaixo para editar.
      </div>
    );
  }

  return (
    <div
      className="relative h-full w-full overflow-auto"
      style={{ backgroundColor: "var(--canvas)", backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
      onClick={() => selectBlock(null)}
    >
      <div className="relative mx-auto my-8 min-h-[900px] w-[min(1100px,95%)] rounded-lg border border-border bg-background shadow-xl">
        {activeFile.blocks?.map((block) => {
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
                <BlockRenderer block={block} />
                {selected && (
                  <div className="absolute -top-8 left-0 flex items-center gap-1 rounded-md border border-border bg-card px-1.5 py-1 text-xs shadow">
                    <span className="px-1 text-[10px] uppercase text-muted-foreground">{block.kind}</span>
                    {block.kind === "react" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCodeModal({ id: block.id, code: block.code ?? "" });
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
          if (codeModal) updateBlock(codeModal.id, { code: v });
        }}
      />
    </div>
  );
}