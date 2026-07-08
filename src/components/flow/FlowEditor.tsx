import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Drawflow from "drawflow";
import "drawflow/dist/drawflow.min.css";
import { Play, Plus, Trash2, Code2 } from "lucide-react";
import { useProject } from "@/lib/project-store";
import type { ActionNodeKind, Flow, FlowEdge, FlowNode, FlowNodeData } from "@/lib/types";
import { runFlow, type RunLog } from "@/lib/flow-runtime";
import { CodeEditorModal } from "@/components/editor/CodeEditorModal";

const kindStyles: Record<ActionNodeKind, string> = {
  start: "bg-emerald-600/20 border-emerald-500 text-emerald-100",
  end: "bg-rose-600/20 border-rose-500 text-rose-100",
  function: "bg-sky-600/20 border-sky-500 text-sky-100",
  http: "bg-violet-600/20 border-violet-500 text-violet-100",
  loop: "bg-amber-600/20 border-amber-500 text-amber-100",
  control: "bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-100",
};

const kindIO: Record<ActionNodeKind, { in: number; out: number }> = {
  start: { in: 0, out: 1 },
  end: { in: 1, out: 0 },
  function: { in: 1, out: 1 },
  http: { in: 1, out: 1 },
  loop: { in: 1, out: 1 },
  control: { in: 1, out: 2 },
};

function renderNodeHtml(data: FlowNodeData): string {
  const kind = data.kind;
  const cls = kindStyles[kind];
  const extra =
    kind === "function"
      ? `<div class="mt-1 line-clamp-2 font-mono text-[10px] opacity-70">${escapeHtml((data.code ?? "").slice(0, 60))}</div>`
      : kind === "http"
      ? `<div class="mt-1 font-mono text-[10px] opacity-80">${escapeHtml(data.method ?? "GET")} ${escapeHtml(data.url ?? "")}</div>`
      : kind === "loop"
      ? `<div class="mt-1 text-[10px] opacity-80">×${data.iterations ?? 1}</div>`
      : kind === "control"
      ? `<div class="mt-1 font-mono text-[10px] opacity-80">if (${escapeHtml(data.condition ?? "")})</div><div class="mt-1 flex justify-between text-[9px] opacity-70"><span>true ↗</span><span>false ↘</span></div>`
      : "";
  return `<div class="fd-node min-w-[160px] rounded-md border-2 px-3 py-2 shadow-sm ${cls}">
    <div class="text-[10px] font-bold uppercase tracking-wider opacity-80">${kind}</div>
    <div class="text-sm font-semibold">${escapeHtml(data.label)}</div>
    ${extra}
  </div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type DrawflowExport = {
  drawflow: {
    Home: {
      data: Record<
        string,
        {
          id: number;
          name: string;
          data: FlowNodeData;
          class: string;
          html: string;
          pos_x: number;
          pos_y: number;
      inputs: Record<string, { connections: { node: string; input?: string }[] }>;
          outputs: Record<string, { connections: { node: string; output: string }[] }>;
        }
      >;
    };
  };
};

function exportToFlowShape(data: DrawflowExport): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const home = data?.drawflow?.Home?.data ?? {};
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  for (const [id, n] of Object.entries(home)) {
    nodes.push({
      id: String(id),
      type: n.data.kind,
      position: { x: n.pos_x, y: n.pos_y },
      data: n.data,
    });
    for (const [outKey, out] of Object.entries(n.outputs ?? {})) {
      const handle = outKey === "output_2" ? "false" : outKey === "output_1" && n.data.kind === "control" ? "true" : undefined;
      for (const c of out.connections ?? []) {
        edges.push({
          id: `${id}-${outKey}-${c.node}`,
          source: String(id),
          target: String(c.node),
          sourceHandle: handle,
        });
      }
    }
  }
  return { nodes, edges };
}

export function FlowEditor() {
  const flow = useProject((s) => {
    if (s.activeFlowId) return s.flows.find((f) => f.id === s.activeFlowId);
    const file = s.activeFileId ? s.files.find((f) => f.id === s.activeFileId) : null;
    if (file?.flowId) return s.flows.find((f) => f.id === file.flowId);
    return s.flows[0];
  });
  const flows = useProject((s) => s.flows);
  const setActiveFlow = useProject((s) => s.setActiveFlow);
  const createFlow = useProject((s) => s.createFlow);
  const updateFlow = useProject((s) => s.updateFlow);

  const [selected, setSelected] = useState<string | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [log, setLog] = useState<RunLog>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Drawflow | null>(null);
  const loadedFlowIdRef = useRef<string | null>(null);

  const persist = useCallback(() => {
    const ed = editorRef.current;
    const fid = loadedFlowIdRef.current;
    if (!ed || !fid) return;
    const data = ed.export() as unknown as DrawflowExport;
    const { nodes, edges } = exportToFlowShape(data);
    updateFlow(fid, { drawflow: data, nodes, edges });
  }, [updateFlow]);

  // Init Drawflow once
  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;
    const editor = new Drawflow(containerRef.current);
    editor.reroute = true;
    editor.reroute_fix_curvature = true;
    editor.start();
    editorRef.current = editor;
    editor.on("nodeSelected", (id) => setSelected(String(id)));
    editor.on("nodeUnselected", () => setSelected(null));
    editor.on("nodeRemoved", () => {
      setSelected(null);
      persist();
    });
    editor.on("nodeMoved", persist);
    editor.on("connectionCreated", persist);
    editor.on("connectionRemoved", persist);
    return () => {
      editor.clear();
      editorRef.current = null;
    };
  }, [persist]);

  // Load flow into Drawflow when active flow changes
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed || !flow) return;
    if (loadedFlowIdRef.current === flow.id) return;
    loadedFlowIdRef.current = flow.id;
    ed.clear();
    if (flow.drawflow) {
      try {
        ed.import(flow.drawflow as never);
        return;
      } catch {
        // fallthrough to rebuild
      }
    }
    // Build from nodes/edges
    const idMap = new Map<string, number>();
    for (const n of flow.nodes) {
      const io = kindIO[n.data.kind];
      const dfid = ed.addNode(
        n.data.kind,
        io.in,
        io.out,
        n.position.x,
        n.position.y,
        n.data.kind,
        n.data,
        renderNodeHtml(n.data),
        false as never,
      ) as unknown as number;
      idMap.set(n.id, dfid);
    }
    for (const e of flow.edges) {
      const s = idMap.get(e.source);
      const t = idMap.get(e.target);
      if (s == null || t == null) continue;
      const outIdx = e.sourceHandle === "false" ? 2 : 1;
      try {
        ed.addConnection(s, t, `output_${outIdx}`, "input_1");
      } catch {
        /* ignore */
      }
    }
    persist();
  }, [flow, persist]);

  const selectedFlowNode = useMemo(() => {
    if (!flow || !selected) return null;
    return flow.nodes.find((n) => n.id === selected) ?? null;
  }, [flow, selected]);

  const updateSelectedData = (patch: Partial<FlowNodeData>) => {
    const ed = editorRef.current;
    if (!ed || !selected) return;
    const idNum = Number(selected);
    const existing = ed.getNodeFromId(idNum) as unknown as { data: FlowNodeData };
    const newData = { ...existing.data, ...patch };
    ed.updateNodeDataFromId(idNum, newData as never);
    // Re-render html
    const el = containerRef.current?.querySelector(`#node-${idNum} .drawflow_content_node`);
    if (el) el.innerHTML = renderNodeHtml(newData);
    persist();
  };

  const addKind = (kind: ActionNodeKind) => {
    const ed = editorRef.current;
    if (!ed) return;
    const io = kindIO[kind];
    const labels: Record<ActionNodeKind, string> = {
      start: "Início",
      end: "Fim",
      function: "Função",
      http: "HTTP",
      loop: "Laço",
      control: "Se/Então",
    };
    const data: FlowNodeData = {
      label: labels[kind],
      kind,
      code: kind === "function" ? "// código da função\nreturn ctx;" : undefined,
      url: kind === "http" ? "https://api.example.com/data" : undefined,
      method: kind === "http" ? "GET" : undefined,
      condition: kind === "control" ? "ctx.value > 0" : undefined,
      iterations: kind === "loop" ? 3 : undefined,
    };
    ed.addNode(
      kind,
      io.in,
      io.out,
      150 + Math.random() * 200,
      100 + Math.random() * 200,
      kind,
      data,
      renderNodeHtml(data),
      false as never,
    );
    persist();
  };

  const removeSelected = () => {
    const ed = editorRef.current;
    if (!ed || !selected) return;
    ed.removeNodeId(`node-${selected}`);
  };

  if (!flow) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center text-sm text-muted-foreground">
        <span>Nenhum fluxo ainda.</span>
        <button
          onClick={() => createFlow()}
          className="flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          <Plus className="h-3 w-3" /> Criar fluxo
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <div className="flex w-full shrink-0 flex-col border-b border-border bg-[color:var(--panel)] p-2 text-xs md:w-48 md:border-b-0 md:border-r">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Fluxos</span>
          <button onClick={() => createFlow()} className="rounded p-1 hover:bg-accent">
            <Plus className="h-3 w-3" />
          </button>
        </div>
        <div className="mb-3 flex flex-wrap gap-1 md:block md:space-y-0.5">
          {flows.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFlow(f.id)}
              className={`truncate rounded px-2 py-1 text-left md:block md:w-full ${
                f.id === flow.id ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
        <input
          value={flow.name}
          onChange={(e) => updateFlow(flow.id, { name: e.target.value })}
          className="mb-3 w-full rounded border border-border bg-input px-2 py-1"
        />
        <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Adicionar nó</div>
        <div className="flex flex-wrap gap-1 md:block md:space-y-1">
          {(["function", "http", "loop", "control", "end"] as ActionNodeKind[]).map((k) => (
            <button
              key={k}
              onClick={() => addKind(k)}
              className="rounded border border-border bg-card px-2 py-1 text-left hover:border-primary hover:bg-accent md:w-full"
            >
              + {k}
            </button>
          ))}
        </div>
        <button
          onClick={async () => {
            const result = await runFlow(flow);
            setLog(result.log);
          }}
          className="mt-3 flex items-center justify-center gap-1.5 rounded bg-emerald-600 py-2 text-xs font-medium text-white hover:opacity-90"
        >
          <Play className="h-3.5 w-3.5" /> Executar
        </button>
        {log.length > 0 && (
          <div className="mt-2 max-h-40 overflow-auto rounded border border-border bg-background p-2 font-mono text-[10px]">
            {log.map((l, i) => (
              <div key={i} className={l.level === "error" ? "text-destructive" : "text-foreground/80"}>
                • {l.label}: {l.message}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="relative min-h-[240px] flex-1">
        <div ref={containerRef} className="drawflow-host h-full w-full" />
      </div>

      {selectedFlowNode && (
        <div className="w-full shrink-0 border-t border-border bg-[color:var(--panel)] p-3 text-xs md:w-72 md:border-l md:border-t-0">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">{selectedFlowNode.data.kind}</div>
              <div className="text-sm font-semibold">Propriedades</div>
            </div>
            {selectedFlowNode.data.kind !== "start" && (
              <button
                onClick={removeSelected}
                className="rounded p-1 text-destructive hover:bg-accent"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <label className="mb-2 block">
            <span className="mb-1 block text-[10px] uppercase text-muted-foreground">Rótulo</span>
            <input
              value={selectedFlowNode.data.label}
              onChange={(e) => updateSelectedData({ label: e.target.value })}
              className="w-full rounded border border-border bg-input px-2 py-1"
            />
          </label>
          {selectedFlowNode.data.kind === "function" && (
            <button
              onClick={() => setCodeOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded border border-primary bg-primary/10 py-2 text-xs font-medium text-primary hover:bg-primary/20"
            >
              <Code2 className="h-3.5 w-3.5" /> Editar código
            </button>
          )}
          {selectedFlowNode.data.kind === "http" && (
            <>
              <label className="mb-2 block">
                <span className="mb-1 block text-[10px] uppercase text-muted-foreground">URL</span>
                <input
                  value={selectedFlowNode.data.url ?? ""}
                  onChange={(e) => updateSelectedData({ url: e.target.value })}
                  className="w-full rounded border border-border bg-input px-2 py-1"
                />
              </label>
              <label className="mb-2 block">
                <span className="mb-1 block text-[10px] uppercase text-muted-foreground">Método</span>
                <select
                  value={selectedFlowNode.data.method ?? "GET"}
                  onChange={(e) => updateSelectedData({ method: e.target.value as FlowNodeData["method"] })}
                  className="w-full rounded border border-border bg-input px-2 py-1"
                >
                  {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          {selectedFlowNode.data.kind === "loop" && (
            <label className="mb-2 block">
              <span className="mb-1 block text-[10px] uppercase text-muted-foreground">Iterações</span>
              <input
                type="number"
                value={selectedFlowNode.data.iterations ?? 1}
                onChange={(e) => updateSelectedData({ iterations: parseInt(e.target.value) || 1 })}
                className="w-full rounded border border-border bg-input px-2 py-1"
              />
            </label>
          )}
          {selectedFlowNode.data.kind === "control" && (
            <label className="mb-2 block">
              <span className="mb-1 block text-[10px] uppercase text-muted-foreground">Condição (JS)</span>
              <input
                value={selectedFlowNode.data.condition ?? ""}
                onChange={(e) => updateSelectedData({ condition: e.target.value })}
                className="w-full rounded border border-border bg-input px-2 py-1 font-mono"
              />
            </label>
          )}

          <CodeEditorModal
            open={codeOpen}
            title={`Código — ${selectedFlowNode.data.label}`}
            value={selectedFlowNode.data.code ?? ""}
            lang="javascript"
            onClose={() => setCodeOpen(false)}
            onSave={(v) => updateSelectedData({ code: v })}
          />
        </div>
      )}
    </div>
  );
}