import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Block,
  BlockKind,
  Flow,
  FlowEdge,
  FlowNode,
  ProjectFile,
  ProjectState,
} from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

function makeStartFlow(name: string): Flow {
  return {
    id: uid(),
    name,
    nodes: [
      {
        id: "start",
        type: "start",
        position: { x: 50, y: 100 },
        data: { label: "Início", kind: "start" },
      },
      {
        id: "end",
        type: "end",
        position: { x: 400, y: 100 },
        data: { label: "Fim", kind: "end" },
      },
    ],
    edges: [],
  };
}

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
  addBlock: (kind: BlockKind) => void;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  removeBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;
  addEvent: (blockId: string, event: string, flowId: string) => void;
  removeEvent: (blockId: string, index: number) => void;
  createFlow: (name?: string) => string;
  deleteFlow: (id: string) => void;
  setActiveFlow: (id: string | null) => void;
  updateFlow: (id: string, patch: Partial<Flow>) => void;
  setFlowNodes: (id: string, nodes: FlowNode[]) => void;
  setFlowEdges: (id: string, edges: FlowEdge[]) => void;
  updateFlowNodeData: (flowId: string, nodeId: string, patch: Partial<FlowNode["data"]>) => void;
  addFlowNode: (flowId: string, kind: FlowNode["data"]["kind"]) => void;
  removeFlowNode: (flowId: string, nodeId: string) => void;
  importProject: (data: ProjectState) => void;
  exportProject: () => ProjectState;
  resetProject: () => void;
};

const initial: ProjectState = {
  files: [],
  flows: [],
  activeFileId: null,
  selectedBlockId: null,
  activeFlowId: null,
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
            : `acao-${get().files.filter((f) => f.type === "action").length + 1}.ts`);
        const file: ProjectFile =
          type === "action"
            ? (() => {
                const flow = makeStartFlow(defaultName);
                set((s) => ({ flows: [...s.flows, flow] }));
                return {
                  id,
                  name: defaultName,
                  type,
                  flowId: flow.id,
                  code: "// Ação vinculada ao fluxo. Edite o fluxograma para definir a sequência.\n",
                };
              })()
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

      addBlock: (kind) => {
        const { activeFileId, files } = get();
        if (!activeFileId) return;
        const file = files.find((f) => f.id === activeFileId);
        if (!file || file.type === "action") return;
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

      addEvent: (blockId, event, flowId) =>
        set((s) => ({
          files: s.files.map((f) =>
            f.blocks
              ? {
                  ...f,
                  blocks: f.blocks.map((b) =>
                    b.id === blockId ? { ...b, events: [...b.events, { event, flowId }] } : b
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

      createFlow: (name) => {
        const flow = makeStartFlow(name ?? `Fluxo ${get().flows.length + 1}`);
        set((s) => ({ flows: [...s.flows, flow], activeFlowId: flow.id }));
        return flow.id;
      },
      deleteFlow: (id) =>
        set((s) => ({
          flows: s.flows.filter((f) => f.id !== id),
          activeFlowId: s.activeFlowId === id ? null : s.activeFlowId,
        })),
      setActiveFlow: (id) => set({ activeFlowId: id }),
      updateFlow: (id, patch) =>
        set((s) => ({ flows: s.flows.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
      setFlowNodes: (id, nodes) =>
        set((s) => ({ flows: s.flows.map((f) => (f.id === id ? { ...f, nodes } : f)) })),
      setFlowEdges: (id, edges) =>
        set((s) => ({ flows: s.flows.map((f) => (f.id === id ? { ...f, edges } : f)) })),
      updateFlowNodeData: (flowId, nodeId, patch) =>
        set((s) => ({
          flows: s.flows.map((f) =>
            f.id === flowId
              ? {
                  ...f,
                  nodes: f.nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n
                  ),
                }
              : f
          ),
        })),
      addFlowNode: (flowId, kind) => {
        const id = uid();
        const labels: Record<string, string> = {
          function: "Função",
          http: "HTTP",
          loop: "Laço",
          control: "Se/Então",
          start: "Início",
          end: "Fim",
        };
        const node: FlowNode = {
          id,
          type: kind,
          position: { x: 200 + Math.random() * 200, y: 200 + Math.random() * 100 },
          data: {
            label: labels[kind] ?? kind,
            kind,
            code: kind === "function" ? "// código da função\nreturn ctx;" : undefined,
            url: kind === "http" ? "https://api.example.com/data" : undefined,
            method: kind === "http" ? "GET" : undefined,
            condition: kind === "control" ? "ctx.value > 0" : undefined,
            iterations: kind === "loop" ? 3 : undefined,
          },
        };
        set((s) => ({
          flows: s.flows.map((f) => (f.id === flowId ? { ...f, nodes: [...f.nodes, node] } : f)),
        }));
      },
      removeFlowNode: (flowId, nodeId) =>
        set((s) => ({
          flows: s.flows.map((f) =>
            f.id === flowId
              ? {
                  ...f,
                  nodes: f.nodes.filter((n) => n.id !== nodeId),
                  edges: f.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
                }
              : f
          ),
        })),

      importProject: (data) => set({ ...initial, ...data }),
      exportProject: () => {
        const { files, flows, activeFileId, selectedBlockId, activeFlowId } = get();
        return { files, flows, activeFileId, selectedBlockId, activeFlowId };
      },
      resetProject: () => set(initial),
    }),
    { name: "nocode-project-v1" }
  )
);