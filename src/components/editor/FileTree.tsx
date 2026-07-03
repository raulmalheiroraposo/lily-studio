import { FileCode, FileText, Workflow, Plus, Trash2 } from "lucide-react";
import { useProject } from "@/lib/project-store";
import type { ProjectFile } from "@/lib/types";

const icons = {
  page: FileText,
  component: FileCode,
  action: Workflow,
};

export function FileTree() {
  const files = useProject((s) => s.files);
  const activeFileId = useProject((s) => s.activeFileId);
  const setActiveFile = useProject((s) => s.setActiveFile);
  const createFile = useProject((s) => s.createFile);
  const deleteFile = useProject((s) => s.deleteFile);

  const groups: { key: ProjectFile["type"]; label: string }[] = [
    { key: "page", label: "Páginas HTML" },
    { key: "component", label: "Componentes React" },
    { key: "action", label: "Ações (Fluxos)" },
  ];

  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.key}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {g.label}
            </span>
            <button
              onClick={() => createFile(g.key)}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              title={`Novo ${g.label}`}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-0.5">
            {files.filter((f) => f.type === g.key).map((f) => {
              const Icon = icons[f.type];
              const active = f.id === activeFileId;
              return (
                <div
                  key={f.id}
                  className={`group flex items-center gap-1.5 rounded px-2 py-1 text-xs cursor-pointer ${
                    active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
                  }`}
                  onClick={() => setActiveFile(f.id)}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 truncate">{f.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Excluir ${f.name}?`)) deleteFile(f.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
            {files.filter((f) => f.type === g.key).length === 0 && (
              <div className="px-2 py-1 text-xs italic text-muted-foreground/60">vazio</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}