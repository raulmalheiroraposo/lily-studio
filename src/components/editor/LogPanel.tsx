import { Trash2, Terminal } from "lucide-react";
import { useLogs } from "@/lib/log-store";

const colors: Record<string, string> = {
  info: "text-muted-foreground",
  success: "text-primary",
  warn: "text-yellow-500",
  error: "text-destructive",
};

export function LogPanel() {
  const entries = useLogs((s) => s.entries);
  const clear = useLogs((s) => s.clear);

  return (
    <div className="flex h-56 shrink-0 flex-col border-t border-border bg-[color:var(--panel)]">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-xs">
        <div className="flex items-center gap-1.5 font-semibold">
          <Terminal className="h-3.5 w-3.5" /> Logs do Preview
          <span className="text-muted-foreground">({entries.length})</span>
        </div>
        <button
          onClick={clear}
          className="flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px] hover:bg-accent"
        >
          <Trash2 className="h-3 w-3" /> Limpar
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2 font-mono text-[11px]">
        {entries.length === 0 && (
          <div className="px-1 py-2 italic text-muted-foreground">
            Interaja com os componentes: requisições de URL, chamadas de função e erros aparecem aqui.
          </div>
        )}
        {entries
          .slice()
          .reverse()
          .map((e) => (
            <div key={e.id} className="flex gap-2 border-b border-border/40 px-1 py-1">
              <span className="text-muted-foreground">
                {new Date(e.at).toLocaleTimeString("pt-BR")}
              </span>
              <span className={`w-16 shrink-0 uppercase ${colors[e.level]}`}>{e.level}</span>
              <span className="w-24 shrink-0 truncate text-primary">{e.source}</span>
              <span className="flex-1 break-all">
                {e.message}
                {e.detail && <span className="ml-2 text-muted-foreground">{e.detail}</span>}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}