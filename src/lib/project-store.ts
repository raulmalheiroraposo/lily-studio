import { create } from "zustand";
import { persist } from "zustand/middleware";
import { parseComponentTsx } from "./tsx-importer";
import { tagToFileId } from "./component-refs";
import type {
  Block,
  BlockKind,
  ProjectFile,
  ProjectState,
} from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Imports a component's source code into visual blocks so any code change
 * (file upload, new component, manual edit) shows up on the canvas.
 */
function blocksFromComponentCode(
  code: string,
  previous: Block[] = [],
  files: ProjectFile[] = []
): Block[] | null {
  if (typeof window === "undefined" || !code?.trim()) return null;
  try {
    const parsed = parseComponentTsx(code, previous, tagToFileId(files));
    return parsed.blocks.length ? parsed.blocks : null;
  } catch {
    return null;
  }
}

/** Applies the code + imported blocks to a component file. */
function withSyncedCode(file: ProjectFile, code: string, files: ProjectFile[] = []): ProjectFile {
  if (file.type !== "component") return { ...file, code };
  const blocks = blocksFromComponentCode(code, file.blocks ?? [], files);
  return { ...file, code, blocks: blocks ?? file.blocks ?? [] };
}

export const defaultComponentCode = `export default function Componente() {
  const [contador, setContador] = useState(0);
  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h3 style={{ margin: 0 }}>Componente React</h3>
      <p>Cliques: {contador}</p>
      <button onClick={() => setContador(contador + 1)}>Clique</button>
    </div>
  );
}
`;

function defaultBlockFor(kind: BlockKind): Block {
  const base: Block = {
    id: uid(),
    kind,
    x: 40,
    y: 40,
    w: 240,
    h: 120,
    props: {},
    style: {},
    attrs: {},
    events: [],
  };
  switch (kind) {
    case "heading":
      return { ...base, text: "Título", h: 60, style: { fontSize: "28px", fontWeight: "700" } };
    case "paragraph":
      return { ...base, text: "Um parágrafo editável.", h: 80 };
    case "button":
      return { ...base, text: "Botão", w: 140, h: 44 };
    case "input":
      return { ...base, props: { placeholder: "Digite..." }, w: 220, h: 40 };
    case "image":
      return {
        ...base,
        props: { src: "https://picsum.photos/400/240", alt: "imagem" },
        w: 320,
        h: 200,
      };
    case "link":
      return { ...base, text: "Link", props: { href: "#" }, w: 120, h: 32 };
    case "video":
      return {
        ...base,
        props: { src: "https://www.w3schools.com/html/mov_bbb.mp4", controls: "true" },
        w: 360,
        h: 220,
      };
    case "audio":
      return {
        ...base,
        props: { src: "https://www.w3schools.com/html/horse.mp3", controls: "true" },
        w: 320,
        h: 54,
      };
    case "canvas":
      return { ...base, w: 320, h: 200, style: { background: "#0f1626", borderRadius: "6px" } };
    case "table":
      return {
        ...base,
        w: 400,
        h: 160,
        props: { columns: "Coluna A,Coluna B", rows: 2 },
      };
    case "progress":
      return { ...base, props: { value: 60, max: 100 }, w: 260, h: 20 };

    case "chart-bar":
    case "chart-line":
    case "chart-pie":
      return {
        ...base,
        w: 360,
        h: 240,
        // Empty = demo data; accepts inline JSON, a URL or a script function name.
        props: { dataSource: "", nameKey: "name", valueKey: "value" },
      };
    case "react":
      return {
        ...base,
        w: 320,
        h: 160,
        code:
          "// Retorne JSX. Props disponíveis: none.\nreturn (\n  <div style={{padding:16}}>\n    <h3>Componente React</h3>\n    <p>Edite meu código!</p>\n  </div>\n);",
      };
    case "div":
    case "section":
    default:
      return { ...base, style: { background: "rgba(120,140,200,0.12)", border: "1px dashed #557" } };
  }
}

type Actions = {
  undo: () => void;
  redo: () => void;
  restoreHistory: (index: number) => void;
  createFile: (type: ProjectFile["type"], name?: string) => string;
  deleteFile: (id: string) => void;
  renameFile: (id: string, name: string) => void;
  setActiveFile: (id: string | null) => void;
  updateFileCode: (id: string, code: string) => void;
  /** Writes generated code without polluting the undo history. */
  setGeneratedCode: (id: string, code: string) => void;
  /** Replaces all blocks of a file (used when syncing source code back). */
  setBlocks: (fileId: string, blocks: Block[]) => void;
  addBlock: (kind: BlockKind) => void;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  removeBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;
  addEvent: (blockId: string, binding: import("./types").EventBinding) => void;
  removeEvent: (blockId: string, index: number) => void;
  importProject: (data: ProjectState) => void;
  exportProject: () => ProjectState;
  resetProject: () => void;
};

export type HistoryEntry = { label: string; at: number; files: ProjectFile[] };

/** Deterministic starter project so the editor never opens empty. */
function starterFiles(): ProjectFile[] {
  const block = (b: Partial<Block> & { id: string; kind: BlockKind }): Block => ({
    ...defaultBlockFor(b.kind),
    ...b,
  });
  return [
    {
      id: "seed-script",
      name: "acoes.js",
      type: "script",
      code:
        "// Funções disponíveis para os eventos dos componentes.\nfunction saudacao() {\n  alert('Olá do Lily Studio!');\n}\n\nfunction logarAgora() {\n  console.log('Clique em', new Date().toLocaleTimeString('pt-BR'));\n}\n",
    },
    {
      id: "seed-component",
      name: "Contador.tsx",
      type: "component",
      blocks: [],
      code: defaultComponentCode,
    },
    {
      id: "seed-page",
      name: "pagina-1.html",
      type: "page",
      blocks: [
        block({ id: "seed-b1", kind: "heading", x: 40, y: 32, w: 520, text: "Bem-vindo ao Lily Studio" }),
        block({
          id: "seed-b2",
          kind: "paragraph",
          x: 40,
          y: 100,
          w: 520,
          text: "Arraste componentes da paleta, edite propriedades, atributos e eventos à direita.",
        }),
        block({
          id: "seed-b3",
          kind: "button",
          x: 40,
          y: 196,
          text: "Clique aqui",
          events: [
            { event: "onClick", kind: "function", scriptId: "seed-script", functionName: "saudacao" },
          ],
        }),
        block({
          id: "seed-b4",
          kind: "react",
          x: 220,
          y: 196,
          w: 320,
          h: 180,
          sourceFileId: "seed-component",
        }),
        block({ id: "seed-b5", kind: "chart-bar", x: 40, y: 400 }),
      ],
    },
  ];
}

type Extra = {
  past: HistoryEntry[];
  future: HistoryEntry[];
  lastSavedAt: number | null;
};

const initial: ProjectState = {
  files: starterFiles(),
  activeFileId: "seed-page",
  selectedBlockId: null,
};

const initialExtra: Extra = { past: [], future: [], lastSavedAt: null };

export const useProject = create<ProjectState & Extra & Actions>()(
  persist(
    (set, get) => {
      /** Applies a mutation while recording the previous file tree in history. */
      const track = (
        label: string,
        producer: (s: ProjectState & Extra) => Partial<ProjectState>
      ) =>
        set((s) => ({
          ...producer(s),
          past: [...s.past, { label, at: Date.now(), files: s.files }].slice(-50),
          future: [],
          lastSavedAt: Date.now(),
        }));

      return {
      ...initial,
      ...initialExtra,

      undo: () =>
        set((s) => {
          const prev = s.past[s.past.length - 1];
          if (!prev) return s;
          return {
            files: prev.files,
            past: s.past.slice(0, -1),
            future: [{ label: prev.label, at: Date.now(), files: s.files }, ...s.future].slice(0, 50),
            selectedBlockId: null,
            lastSavedAt: Date.now(),
          };
        }),
      redo: () =>
        set((s) => {
          const next = s.future[0];
          if (!next) return s;
          return {
            files: next.files,
            past: [...s.past, { label: next.label, at: Date.now(), files: s.files }].slice(-50),
            future: s.future.slice(1),
            selectedBlockId: null,
            lastSavedAt: Date.now(),
          };
        }),
      restoreHistory: (index) =>
        set((s) => {
          const target = s.past[index];
          if (!target) return s;
          return {
            files: target.files,
            past: s.past.slice(0, index),
            future: [
              ...s.past.slice(index).map((h) => ({ ...h })).reverse(),
              ...s.future,
            ].slice(0, 50),
            selectedBlockId: null,
            lastSavedAt: Date.now(),
          };
        }),

      createFile: (type, name) => {
        const id = uid();
        const defaultName =
          name ??
          (type === "page"
            ? `pagina-${get().files.filter((f) => f.type === "page").length + 1}.html`
            : type === "component"
            ? `Componente${get().files.filter((f) => f.type === "component").length + 1}.tsx`
            : `script-${get().files.filter((f) => f.type === "script").length + 1}.js`);
        const file: ProjectFile =
          type === "script"
            ? {
                id,
                name: defaultName,
                type,
                code:
                  "// Defina funções aqui. Elas ficam disponíveis para os eventos dos componentes.\n// Exemplo:\nfunction saudacao() {\n  alert('Olá do script!');\n}\n",
              }
            : type === "component"
            ? withSyncedCode(
                { id, name: defaultName, type, blocks: [] },
                defaultComponentCode
              )
            : { id, name: defaultName, type, blocks: [] };
        track(`Criou ${defaultName}`, (s) => ({ files: [...s.files, file], activeFileId: id }));
        return id;
      },
      deleteFile: (id) =>
        track("Excluiu arquivo", (s) => ({
          files: s.files.filter((f) => f.id !== id),
          activeFileId: s.activeFileId === id ? null : s.activeFileId,
        })),
      renameFile: (id, name) =>
        track(`Renomeou para ${name}`, (s) => ({
          files: s.files.map((f) => (f.id === id ? { ...f, name } : f)),
        })),
      setActiveFile: (id) => set({ activeFileId: id, selectedBlockId: null }),
      updateFileCode: (id, code) =>
        track("Editou código", (s) => ({
          // Component files also import their code back into visual blocks.
          files: s.files.map((f) => (f.id === id ? withSyncedCode(f, code, s.files) : f)),
        })),
      setGeneratedCode: (id, code) =>
        set((s) => ({
          files: s.files.map((f) => (f.id === id ? { ...f, code } : f)),
        })),
      setBlocks: (fileId, blocks) =>
        track("Sincronizou código", (s) => ({
          files: s.files.map((f) => (f.id === fileId ? { ...f, blocks } : f)),
          selectedBlockId: blocks.some((b) => b.id === s.selectedBlockId) ? s.selectedBlockId : null,
        })),

      addBlock: (kind) => {
        const { activeFileId, files } = get();
        if (!activeFileId) return;
        const file = files.find((f) => f.id === activeFileId);
        if (!file || file.type === "script") return;
        const block = defaultBlockFor(kind);
        // A React component nested inside another React component gets its own
        // .tsx file, referenced by tag in the parent, so it can be reused.
        let extraFile: ProjectFile | null = null;
        if (kind === "react" && file.type === "component") {
          const id = uid();
          const name = `Componente${files.filter((f) => f.type === "component").length + 1}.tsx`;
          extraFile = withSyncedCode({ id, name, type: "component", blocks: [] }, defaultComponentCode, files);
          block.sourceFileId = id;
          block.code = undefined;
        }
        track(`Adicionou ${kind}`, (s) => ({
          files: [...s.files, ...(extraFile ? [extraFile] : [])].map((f) =>
            f.id === activeFileId ? { ...f, blocks: [...(f.blocks ?? []), block] } : f
          ),
          selectedBlockId: block.id,
        }));
      },
      updateBlock: (id, patch) =>
        track("Alterou componente", (s) => ({
          files: s.files.map((f) =>
            f.blocks
              ? { ...f, blocks: f.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) }
              : f
          ),
        })),
      removeBlock: (id) =>
        track("Removeu componente", (s) => ({
          files: s.files.map((f) =>
            f.blocks ? { ...f, blocks: f.blocks.filter((b) => b.id !== id) } : f
          ),
          selectedBlockId: s.selectedBlockId === id ? null : s.selectedBlockId,
        })),
      selectBlock: (id) => set({ selectedBlockId: id }),

      addEvent: (blockId, binding) =>
        track(`Vinculou ${binding.event}`, (s) => ({
          files: s.files.map((f) =>
            f.blocks
              ? {
                  ...f,
                  blocks: f.blocks.map((b) =>
                    b.id === blockId ? { ...b, events: [...b.events, binding] } : b
                  ),
                }
              : f
          ),
        })),
      removeEvent: (blockId, index) =>
        track("Removeu evento", (s) => ({
          files: s.files.map((f) =>
            f.blocks
              ? {
                  ...f,
                  blocks: f.blocks.map((b) =>
                    b.id === blockId
                      ? { ...b, events: b.events.filter((_, i) => i !== index) }
                      : b
                  ),
                }
              : f
          ),
        })),

      importProject: (data) =>
        set((s) => ({
          ...initial,
          ...data,
          past: [...s.past, { label: "Antes da importação", at: Date.now(), files: s.files }].slice(-50),
          future: [],
          lastSavedAt: Date.now(),
        })),
      exportProject: () => {
        const { files, activeFileId, selectedBlockId } = get();
        return { files, activeFileId, selectedBlockId };
      },
      resetProject: () => set({ ...initial, ...initialExtra }),
      };
    },
    {
      name: "nocode-project-v2",
      partialize: (s) => ({
        files: s.files,
        activeFileId: s.activeFileId,
        selectedBlockId: s.selectedBlockId,
        past: s.past.slice(-20),
        future: [],
        lastSavedAt: s.lastSavedAt,
      }),
    }
  )
);