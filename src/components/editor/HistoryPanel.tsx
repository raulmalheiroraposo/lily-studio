import { History, Undo2, Redo2 } from "lucide-react";
import { useProject } from "@/lib/project-store";

export function HistoryPanel() {
  const past = useProject((s) => s.past);
  const future = useProject((s) => s.future);
  const undo = useProject((s) => s.undo);
  const redo = useProject((s) => s.redo);
  const restore = useProject((s) => s.restoreHistory);
  const lastSavedAt = useProject((s) => s.lastSavedAt);

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          disabled={past.length === 0}
          className="flex flex-1 items-center justify-center gap-1 rounded border border-border py-1 hover:bg-accent disabled:opacity-40"
        >
          <Undo2 className="h-3 w-3" /> Desfazer
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          className="flex flex-1 items-center justify-center gap-1 rounded border border-border py-1 hover:bg-accent disabled:opacity-40"
        >
          <Redo2 className="h-3 w-3" /> Refazer
        </button>
      </div>
      <div className="text-[10px] text-muted-foreground">
        {lastSavedAt
          ? `Salvo automaticamente às ${new Date(lastSavedAt).toLocaleTimeString("pt-BR")}`
          : "Nenhuma alteração salva ainda"}
      </div>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        <History className="h-3 w-3" /> Histórico
      </div>
      <div className="space-y-0.5">
        {past.length === 0 && (
          <div className="italic text-muted-foreground/60">Sem alterações registradas.</div>
        )}
        {past
          .map((h, i) => ({ h, i }))
          .reverse()
          .map(({ h, i }) => (
            <button
              key={`${h.at}-${i}`}
              onClick={() => restore(i)}
              title="Restaurar este ponto"
              className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <span className="truncate">{h.label}</span>
              <span className="ml-2 shrink-0 text-[10px]">
                {new Date(h.at).toLocaleTimeString("pt-BR")}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}