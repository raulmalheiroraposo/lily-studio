import { useMemo, useState } from "react";
import {
  FileCode, FileText, ScrollText, Plus, Trash2, Pencil, Check, Folder, FolderOpen,
  FolderPlus, ChevronRight, ChevronDown, FolderInput,
} from "lucide-react";
import { useProject } from "@/lib/project-store";
import type { ProjectFile } from "@/lib/types";
import { folderOf, normalizeFolder } from "@/lib/folders";

const icons = { page: FileText, component: FileCode, script: ScrollText };

type Node = { name: string; path: string; children: Map<string, Node>; files: ProjectFile[] };

function buildTree(files: ProjectFile[], folders: string[]): Node {
  const root: Node = { name: "", path: "", children: new Map(), files: [] };
  const ensure = (path: string) => {
    let n = root;
    for (const part of path.split("/").filter(Boolean)) {
      const p = n.path ? `${n.path}/${part}` : part;
      if (!n.children.has(part)) n.children.set(part, { name: part, path: p, children: new Map(), files: [] });
      n = n.children.get(part)!;
    }
    return n;
  };
  for (const f of folders) ensure(f);
  for (const f of files) ensure(folderOf(f)).files.push(f);
  return root;
}

export function FileTree() {
  const files = useProject((s) => s.files);
  const storedFolders = useProject((s) => s.folders);
  const folders = useMemo(() => storedFolders ?? [], [storedFolders]);
  const activeFileId = useProject((s) => s.activeFileId);
  const setActiveFile = useProject((s) => s.setActiveFile);
  const createFile = useProject((s) => s.createFile);
  const deleteFile = useProject((s) => s.deleteFile);
  const renameFile = useProject((s) => s.renameFile);
  const moveFile = useProject((s) => s.moveFile);
  const addFolder = useProject((s) => s.addFolder);
  const removeFolder = useProject((s) => s.removeFolder);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [filter, setFilter] = useState("");
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [dragId, setDragId] = useState<string | null>(null);

  const q = filter.trim().toLowerCase();
  const tree = useMemo(
    () => buildTree(files.filter((f) => f.name.toLowerCase().includes(q)), q ? [] : folders),
    [files, folders, q]
  );

  const newFolder = (parent: string) => {
    const name = prompt("Nome da nova pasta:");
    if (!name) return;
    const path = normalizeFolder(parent ? `${parent}/${name}` : name);
    if (path) addFolder(path);
  };
  const newFile = (parent: string) => {
    const t = prompt("Tipo do arquivo: 1 = Página HTML, 2 = Componente React, 3 = Script", "1");
    const type = t === "2" ? "component" : t === "3" ? "script" : t === "1" ? "page" : null;
    if (type) createFile(type, undefined, parent);
  };
  const move = (f: ProjectFile) => {
    const dest = prompt("Mover para a pasta (ex.: paginas/blog). Vazio = raiz:", folderOf(f));
    if (dest !== null) moveFile(f.id, normalizeFolder(dest));
  };

  const renderFile = (f: ProjectFile, depth: number) => {
    const Icon = icons[f.type];
    const pad = { paddingLeft: 8 + depth * 12 };
    if (editing?.id === f.id) {
      const commit = () => {
        if (editing.name.trim()) renameFile(f.id, editing.name.trim());
        setEditing(null);
      };
      return (
        <div key={f.id} className="flex items-center gap-1 py-1 pr-1" style={pad}>
          <input
            autoFocus
            value={editing.name}
            onChange={(e) => setEditing({ id: f.id, name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(null);
            }}
            className="flex-1 rounded border border-primary bg-input px-1.5 py-0.5 text-xs"
          />
          <button onClick={commit} className="text-primary" title="Salvar nome">
            <Check className="h-3 w-3" />
          </button>
        </div>
      );
    }
    return (
      <div
        key={f.id}
        draggable
        onDragStart={() => setDragId(f.id)}
        onDragEnd={() => setDragId(null)}
        style={pad}
        className={`group flex cursor-pointer items-center gap-1.5 rounded py-1 pr-1 text-xs ${
          f.id === activeFileId ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
        }`}
        onClick={() => setActiveFile(f.id)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditing({ id: f.id, name: f.name });
        }}
        title="Clique para abrir, duplo clique para renomear, arraste para outra pasta"
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 truncate">{f.name}</span>
        <button onClick={(e) => { e.stopPropagation(); move(f); }} title="Mover para pasta" className="opacity-0 hover:text-foreground group-hover:opacity-100">
          <FolderInput className="h-3 w-3" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setEditing({ id: f.id, name: f.name }); }} title="Renomear" className="opacity-0 hover:text-foreground group-hover:opacity-100">
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); if (confirm(`Excluir ${f.name}?`)) deleteFile(f.id); }}
          title="Excluir"
          className="opacity-0 hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    );
  };

  const renderNode = (n: Node, depth: number): React.ReactNode => {
    const isOpen = !closed[n.path];
    const drop = {
      onDragOver: (e: React.DragEvent) => dragId && e.preventDefault(),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragId) moveFile(dragId, n.path);
        setDragId(null);
      },
    };
    const children = (
      <>
        {[...n.children.values()].sort((a, b) => a.name.localeCompare(b.name)).map((c) => renderNode(c, n.path ? depth + 1 : depth))}
        {[...n.files].sort((a, b) => a.name.localeCompare(b.name)).map((f) => renderFile(f, n.path ? depth + 1 : depth))}
      </>
    );
    if (!n.path) return <div {...drop} className="min-h-[60px] space-y-0.5">{children}</div>;
    return (
      <div key={n.path} {...drop}>
        <div
          className="group flex cursor-pointer items-center gap-1 rounded py-1 pr-1 text-xs text-foreground hover:bg-accent/50"
          style={{ paddingLeft: 4 + depth * 12 }}
          onClick={() => setClosed((c) => ({ ...c, [n.path]: isOpen }))}
        >
          {isOpen ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
          {isOpen ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" /> : <Folder className="h-3.5 w-3.5 shrink-0 text-primary" />}
          <span className="flex-1 truncate font-medium">{n.name}</span>
          <button onClick={(e) => { e.stopPropagation(); newFile(n.path); }} title="Novo arquivo nesta pasta" className="opacity-0 group-hover:opacity-100">
            <Plus className="h-3 w-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); newFolder(n.path); }} title="Nova subpasta" className="opacity-0 group-hover:opacity-100">
            <FolderPlus className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Excluir a pasta ${n.path}? Os arquivos voltam para a pasta padrão.`)) removeFolder(n.path);
            }}
            title="Excluir pasta"
            className="opacity-0 hover:text-destructive group-hover:opacity-100"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
        {isOpen && children}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar arquivos..."
          className="min-w-0 flex-1 rounded border border-border bg-input px-2 py-1 text-xs"
        />
        <button onClick={() => newFile("")} title="Novo arquivo" className="rounded border border-border p-1 hover:bg-accent">
          <Plus className="h-3 w-3" />
        </button>
        <button onClick={() => newFolder("")} title="Nova pasta" className="rounded border border-border p-1 hover:bg-accent">
          <FolderPlus className="h-3 w-3" />
        </button>
      </div>
      {renderNode(tree, 0)}
      {files.length === 0 && <div className="px-2 py-1 text-xs italic text-muted-foreground/60">vazio</div>}
    </div>
  );
}
