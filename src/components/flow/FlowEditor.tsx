import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Play, Plus, Trash2, Code2 } from "lucide-react";
import { useProject } from "@/lib/project-store";
import type { ActionNodeKind, FlowNodeData } from "@/lib/types";
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

function NodeShell({ data, kind, children }: { data: FlowNodeData; kind: ActionNodeKind; children?: React.ReactNode }) {
  return (
    <div className={`min-w-[160px] rounded-md border-2 px-3 py-2 shadow-sm ${kindStyles[kind]}`}>
      {kind !== "start" && <Handle type="target" position={Position.Left} />}
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{kind}</div>
      <div className="text-sm font-semibold">{data.label}</div>
      {children}
      {kind !== "end" && kind !== "control" && <Handle type="source" position={Position.Right} />}
      {kind === "control" && (
        <>
          <Handle id="true" type="source" position={Position.Right} style={{ top: "35%" }} />
          <Handle id="false" type="source" position={Position.Right} style={{ top: "70%" }} />
        </>
      )}
    </div>
  );
}

const nodeTypes = {
  start: ({ data }: { data: FlowNodeData }) => <NodeShell data={data} kind="start" />,
  end: ({ data }: { data: FlowNodeData }) => <NodeShell data={data} kind="end" />,
  function: ({ data }: { data: FlowNodeData }) => (
    <NodeShell data={data} kind="function">
      <div className="mt-1 line-clamp-2 font-mono text-[10px] opacity-70">{data.code?.slice(0, 60)}</div>
    </NodeShell>
  ),
  http: ({ data }: { data: FlowNodeData }) => (
    <NodeShell data={data} kind="http">
      <div className="mt-1 font-mono text-[10px] opacity-80">
        {data.method} {data.url}
      </div>
    </NodeShell>
  ),
  loop: ({ data }: { data: FlowNodeData }) => (
    <NodeShell data={data} kind="loop">
      <div className="mt-1 text-[10px] opacity-80">×{data.iterations}</div>
    </NodeShell>
  ),
  control: ({ data }: { data: FlowNodeData }) => (
    <NodeShell data={data} kind="control">
      <div className="mt-1 font-mono text-[10px] opacity-80">if ({data.condition})</div>
      <div className="mt-1 flex justify-between text-[9px] opacity-70">
        <span>true ↗</span>
        <span>false ↘</span>
      </div>
    </NodeShell>
  ),
};

export function FlowEditor() {
  const flow = useProject((s) => {
    if (s.activeFlowId) return s.flows.find((f) => f.id === s.activeFlowId);
    const file = s.activeFileId ? s.files.find((f) => f.id === s.activeFileId) : null;
    if (file?.flowId) return s.flows.find((f) => f.id === file.flowId);
    return s.flows[0];
  });
  const flows = useProject((s) => s.flows);
  const setActiveFlow = useProject((s) => s.setActiveFlow);
  const setFlowNodes = useProject((s) => s.setFlowNodes);
  const setFlowEdges = useProject((s) => s.setFlowEdges);
  const addFlowNode = useProject((s) => s.addFlowNode);
  const removeFlowNode = useProject((s) => s.removeFlowNode);
  const updateFlowNodeData = useProject((s) => s.updateFlowNodeData);
  const createFlow = useProject((s) => s.createFlow);
  const updateFlow = useProject((s) => s.updateFlow);

  const [selected, setSelected] = useState<string | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [log, setLog] = useState<RunLog>([]);

  const selectedNode = useMemo(
    () => flow?.nodes.find((n) => n.id === selected) ?? null,
    [flow, selected]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!flow) return;
      const updated = applyNodeChanges(changes, flow.nodes as unknown as Node[]) as unknown as typeof flow.nodes;
      setFlowNodes(flow.id, updated);
    },
    [flow, setFlowNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!flow) return;
      const updated = applyEdgeChanges(changes, flow.edges as unknown as Edge[]) as unknown as typeof flow.edges;
      setFlowEdges(flow.id, updated);
    },
    [flow, setFlowEdges]
  );
  const onConnect = useCallback(
    (conn: Connection) => {
      if (!flow) return;
      const updated = addEdge(conn, flow.edges as unknown as Edge[]) as unknown as typeof flow.edges;
      setFlowEdges(flow.id, updated);
    },
    [flow, setFlowEdges]
  );

  if (!flow) {
    return (
      <div className="flex h-full items-center justify-center gap-3 text-sm text-muted-foreground">
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

  const addKind = (k: ActionNodeKind) => addFlowNode(flow.id, k);

  return (
    <div className="flex h-full">
      <div className="flex w-48 flex-col border-r border-border bg-[color:var(--panel)] p-2 text-xs">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Fluxos</span>
          <button onClick={() => createFlow()} className="rounded p-1 hover:bg-accent">
            <Plus className="h-3 w-3" />
          </button>
        </div>
        <div className="mb-3 space-y-0.5">
          {flows.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFlow(f.id)}
              className={`block w-full truncate rounded px-2 py-1 text-left ${
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
        <div className="space-y-1">
          {(["function", "http", "loop", "control", "end"] as ActionNodeKind[]).map((k) => (
            <button
              key={k}
              onClick={() => addKind(k)}
              className="w-full rounded border border-border bg-card px-2 py-1 text-left hover:border-primary hover:bg-accent"
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

      <div className="relative flex-1" style={{ height: "100%" }}>
        <ReactFlow
          nodes={flow.nodes as unknown as Node[]}
          edges={flow.edges as unknown as Edge[]}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, n) => setSelected(n.id)}
          onPaneClick={() => setSelected(null)}
          nodeTypes={nodeTypes as never}
          fitView
          colorMode="dark"
        >
          <Background gap={16} />
          <Controls />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </div>

      {selectedNode && (
        <div className="w-72 border-l border-border bg-[color:var(--panel)] p-3 text-xs">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">{selectedNode.data.kind}</div>
              <div className="text-sm font-semibold">Propriedades</div>
            </div>
            {selectedNode.data.kind !== "start" && selectedNode.data.kind !== "end" && (
              <button
                onClick={() => {
                  removeFlowNode(flow.id, selectedNode.id);
                  setSelected(null);
                }}
                className="rounded p-1 text-destructive hover:bg-accent"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <label className="mb-2 block">
            <span className="mb-1 block text-[10px] uppercase text-muted-foreground">Rótulo</span>
            <input
              value={selectedNode.data.label}
              onChange={(e) => updateFlowNodeData(flow.id, selectedNode.id, { label: e.target.value })}
              className="w-full rounded border border-border bg-input px-2 py-1"
            />
          </label>
          {selectedNode.data.kind === "function" && (
            <button
              onClick={() => setCodeOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded border border-primary bg-primary/10 py-2 text-xs font-medium text-primary hover:bg-primary/20"
            >
              <Code2 className="h-3.5 w-3.5" /> Editar código
            </button>
          )}
          {selectedNode.data.kind === "http" && (
            <>
              <label className="mb-2 block">
                <span className="mb-1 block text-[10px] uppercase text-muted-foreground">URL</span>
                <input
                  value={selectedNode.data.url ?? ""}
                  onChange={(e) => updateFlowNodeData(flow.id, selectedNode.id, { url: e.target.value })}
                  className="w-full rounded border border-border bg-input px-2 py-1"
                />
              </label>
              <label className="mb-2 block">
                <span className="mb-1 block text-[10px] uppercase text-muted-foreground">Método</span>
                <select
                  value={selectedNode.data.method ?? "GET"}
                  onChange={(e) => updateFlowNodeData(flow.id, selectedNode.id, { method: e.target.value as FlowNodeData["method"] })}
                  className="w-full rounded border border-border bg-input px-2 py-1"
                >
                  {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          {selectedNode.data.kind === "loop" && (
            <label className="mb-2 block">
              <span className="mb-1 block text-[10px] uppercase text-muted-foreground">Iterações</span>
              <input
                type="number"
                value={selectedNode.data.iterations ?? 1}
                onChange={(e) => updateFlowNodeData(flow.id, selectedNode.id, { iterations: parseInt(e.target.value) || 1 })}
                className="w-full rounded border border-border bg-input px-2 py-1"
              />
            </label>
          )}
          {selectedNode.data.kind === "control" && (
            <label className="mb-2 block">
              <span className="mb-1 block text-[10px] uppercase text-muted-foreground">Condição (JS)</span>
              <input
                value={selectedNode.data.condition ?? ""}
                onChange={(e) => updateFlowNodeData(flow.id, selectedNode.id, { condition: e.target.value })}
                className="w-full rounded border border-border bg-input px-2 py-1 font-mono"
              />
            </label>
          )}

          <CodeEditorModal
            open={codeOpen}
            title={`Código — ${selectedNode.data.label}`}
            value={selectedNode.data.code ?? ""}
            lang="javascript"
            onClose={() => setCodeOpen(false)}
            onSave={(v) => updateFlowNodeData(flow.id, selectedNode.id, { code: v })}
          />
        </div>
      )}
    </div>
  );
}