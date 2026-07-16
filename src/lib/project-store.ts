import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Block,
  BlockKind,
  ProjectFile,
  ProjectState,
} from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

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
    case "chart-bar":
    case "chart-line":
    case "chart-pie":
      return { ...base, w: 360, h: 240 };
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
  createFile: (type: ProjectFile["type"], name?: string) => string;
  deleteFile: (id: string) => void;
  renameFile: (id: string, name: string) => void;
  setActiveFile: (id: string | null) => void;
  updateFileCode: (id: string, code: string) => void;
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

const initial: ProjectState = {
  files: [],
  activeFileId: null,
  selectedBlockId: null,
};

export const useProject = create<ProjectState & Actions>()(
  persist(
    (set, get) => ({
      ...initial,

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
            : { id, name: defaultName, type, blocks: [] };
        set((s) => ({ files: [...s.files, file], activeFileId: id }));
        return id;
      },
      deleteFile: (id) =>
        set((s) => ({
          files: s.files.filter((f) => f.id !== id),
          activeFileId: s.activeFileId === id ? null : s.activeFileId,
        })),
      renameFile: (id, name) =>
        set((s) => ({ files: s.files.map((f) => (f.id === id ? { ...f, name } : f)) })),
      setActiveFile: (id) => set({ activeFileId: id, selectedBlockId: null }),
      updateFileCode: (id, code) =>
        set((s) => ({ files: s.files.map((f) => (f.id === id ? { ...f, code } : f)) })),

      addBlock: (kind) => {
        const { activeFileId, files } = get();
        if (!activeFileId) return;
        const file = files.find((f) => f.id === activeFileId);
        if (!file || file.type === "script") return;
        const block = defaultBlockFor(kind);
        set((s) => ({
          files: s.files.map((f) =>
            f.id === activeFileId ? { ...f, blocks: [...(f.blocks ?? []), block] } : f
          ),
          selectedBlockId: block.id,
        }));
      },
      updateBlock: (id, patch) =>
        set((s) => ({
          files: s.files.map((f) =>
            f.blocks
              ? { ...f, blocks: f.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) }
              : f
          ),
        })),
      removeBlock: (id) =>
        set((s) => ({
          files: s.files.map((f) =>
            f.blocks ? { ...f, blocks: f.blocks.filter((b) => b.id !== id) } : f
          ),
          selectedBlockId: s.selectedBlockId === id ? null : s.selectedBlockId,
        })),
      selectBlock: (id) => set({ selectedBlockId: id }),

      addEvent: (blockId, binding) =>
        set((s) => ({
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
        set((s) => ({
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

      importProject: (data) => set({ ...initial, ...data }),
      exportProject: () => {
        const { files, activeFileId, selectedBlockId } = get();
        return { files, activeFileId, selectedBlockId };
      },
      resetProject: () => set(initial),
    }),
    { name: "nocode-project-v2" }
  )
);