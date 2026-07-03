import { useState } from "react";
import { Trash2, Plus, Code2 } from "lucide-react";
import { useProject } from "@/lib/project-store";
import { CodeEditorModal } from "./CodeEditorModal";

const EVENTS = ["onClick", "onChange", "onMouseEnter", "onMouseLeave", "onFocus", "onBlur", "onSubmit", "onLoad"];

export function PropertiesPanel() {
  const block = useProject((s) => {
    const file = s.activeFileId ? s.files.find((f) => f.id === s.activeFileId) : null;
    return file?.blocks?.find((b) => b.id === s.selectedBlockId) ?? null;
  });
  const flows = useProject((s) => s.flows);
  const updateBlock = useProject((s) => s.updateBlock);
  const addEvent = useProject((s) => s.addEvent);
  const removeEvent = useProject((s) => s.removeEvent);
  const createFlow = useProject((s) => s.createFlow);

  const [tab, setTab] = useState<"props" | "events" | "style">("props");
  const [codeOpen, setCodeOpen] = useState(false);
  const [newEvent, setNewEvent] = useState("onClick");
  const [newFlow, setNewFlow] = useState("");

  if (!block) {
    return (
      <div className="p-4 text-xs text-muted-foreground">
        Selecione um componente no canvas para editar suas propriedades, estilos e eventos.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3 py-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Selecionado</div>
        <div className="text-sm font-semibold">{block.kind}</div>
      </div>
      <div className="flex border-b border-border text-xs">
        {(["props", "style", "events"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 ${
              tab === t ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "props" ? "Props" : t === "style" ? "Estilo" : "Eventos"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3 text-xs">
        {tab === "props" && (
          <>
            {"text" in block && block.text !== undefined && (
              <Field label="Texto">
                <input
                  value={block.text ?? ""}
                  onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                  className="w-full rounded border border-border bg-input px-2 py-1"
                />
              </Field>
            )}
            {Object.entries(block.props).map(([k, v]) => (
              <Field key={k} label={k}>
                <input
                  value={String(v)}
                  onChange={(e) => updateBlock(block.id, { props: { ...block.props, [k]: e.target.value } })}
                  className="w-full rounded border border-border bg-input px-2 py-1"
                />
              </Field>
            ))}
            <Field label="Largura × Altura">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={block.w}
                  onChange={(e) => updateBlock(block.id, { w: parseInt(e.target.value) || 0 })}
                  className="w-full rounded border border-border bg-input px-2 py-1"
                />
                <input
                  type="number"
                  value={block.h}
                  onChange={(e) => updateBlock(block.id, { h: parseInt(e.target.value) || 0 })}
                  className="w-full rounded border border-border bg-input px-2 py-1"
                />
              </div>
            </Field>
            {block.kind === "react" && (
              <button
                onClick={() => setCodeOpen(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded border border-primary bg-primary/10 py-2 text-xs font-medium text-primary hover:bg-primary/20"
              >
                <Code2 className="h-3.5 w-3.5" /> Editar código-fonte
              </button>
            )}
          </>
        )}

        {tab === "style" && (
          <>
            {["background", "color", "border", "borderRadius", "padding", "fontSize", "fontWeight", "textAlign"].map((k) => (
              <Field key={k} label={k}>
                <input
                  value={block.style[k] ?? ""}
                  onChange={(e) => updateBlock(block.id, { style: { ...block.style, [k]: e.target.value } })}
                  className="w-full rounded border border-border bg-input px-2 py-1"
                />
              </Field>
            ))}
          </>
        )}

        {tab === "events" && (
          <>
            <div className="space-y-1">
              {block.events.length === 0 && (
                <div className="italic text-muted-foreground">Nenhum evento vinculado.</div>
              )}
              {block.events.map((ev, i) => {
                const flow = flows.find((f) => f.id === ev.flowId);
                return (
                  <div key={i} className="flex items-center gap-2 rounded border border-border bg-card px-2 py-1.5">
                    <span className="font-mono text-primary">{ev.event}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="flex-1 truncate">{flow?.name ?? "(fluxo removido)"}</span>
                    <button onClick={() => removeEvent(block.id, i)} className="text-destructive hover:opacity-80">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 space-y-2 rounded border border-dashed border-border p-2">
              <div className="text-[10px] uppercase text-muted-foreground">Novo vínculo</div>
              <select
                value={newEvent}
                onChange={(e) => setNewEvent(e.target.value)}
                className="w-full rounded border border-border bg-input px-2 py-1"
              >
                {EVENTS.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
              <select
                value={newFlow}
                onChange={(e) => setNewFlow(e.target.value)}
                className="w-full rounded border border-border bg-input px-2 py-1"
              >
                <option value="">— escolha um fluxo —</option>
                {flows.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  disabled={!newFlow}
                  onClick={() => {
                    addEvent(block.id, newEvent, newFlow);
                    setNewFlow("");
                  }}
                  className="flex-1 rounded bg-primary py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
                >
                  Vincular
                </button>
                <button
                  onClick={() => {
                    const id = createFlow();
                    addEvent(block.id, newEvent, id);
                  }}
                  className="flex items-center gap-1 rounded border border-border px-2 py-1.5 text-xs hover:bg-accent"
                >
                  <Plus className="h-3 w-3" /> novo fluxo
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <CodeEditorModal
        open={codeOpen}
        title={`Código de ${block.kind}`}
        value={block.code ?? ""}
        lang="typescript"
        onClose={() => setCodeOpen(false)}
        onSave={(v) => updateBlock(block.id, { code: v })}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}