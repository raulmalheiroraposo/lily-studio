import { useMemo, useState } from "react";
import { Trash2, Plus, Code2 } from "lucide-react";
import { useProject } from "@/lib/project-store";
import { CodeEditorModal } from "./CodeEditorModal";
import { listScriptFunctions } from "@/lib/script-runtime";
import type { EventBinding } from "@/lib/types";

const EVENTS = ["onClick", "onChange", "onMouseEnter", "onMouseLeave", "onFocus", "onBlur", "onSubmit", "onLoad"];
const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

export function PropertiesPanel() {
  const block = useProject((s) => {
    const file = s.activeFileId ? s.files.find((f) => f.id === s.activeFileId) : null;
    return file?.blocks?.find((b) => b.id === s.selectedBlockId) ?? null;
  });
  const scripts = useProject((s) => s.files.filter((f) => f.type === "script"));
  const updateBlock = useProject((s) => s.updateBlock);
  const addEvent = useProject((s) => s.addEvent);
  const removeEvent = useProject((s) => s.removeEvent);

  const [tab, setTab] = useState<"props" | "attrs" | "style" | "events">("props");
  const [codeOpen, setCodeOpen] = useState(false);

  // Add-attribute form
  const [newAttrKey, setNewAttrKey] = useState("");
  const [newAttrVal, setNewAttrVal] = useState("");

  // Add-event form
  const [newEventName, setNewEventName] = useState("onClick");
  const [newEventKind, setNewEventKind] = useState<"function" | "url">("function");
  const [newScriptId, setNewScriptId] = useState("");
  const [newFn, setNewFn] = useState("");
  const [newUrl, setNewUrl] = useState("https://api.example.com/data");
  const [newMethod, setNewMethod] = useState<(typeof METHODS)[number]>("GET");

  const availableFns = useMemo(() => {
    const s = scripts.find((f) => f.id === newScriptId);
    return s ? listScriptFunctions(s.code ?? "") : [];
  }, [scripts, newScriptId]);

  if (!block) {
    return (
      <div className="p-4 text-xs text-muted-foreground">
        Selecione um componente no canvas para editar suas propriedades, atributos, estilos e eventos.
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
        {(["props", "attrs", "style", "events"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 ${
              tab === t ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "props" ? "Props" : t === "attrs" ? "Attrs" : t === "style" ? "Estilo" : "Eventos"}
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

        {tab === "attrs" && (
          <>
            <div className="text-[11px] text-muted-foreground">
              Atributos HTML dinâmicos aplicados diretamente à tag do componente (ex.: <code>id</code>, <code>data-*</code>, <code>aria-*</code>, <code>title</code>).
            </div>
            <div className="space-y-1">
              {Object.entries(block.attrs ?? {}).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <input
                    value={k}
                    onChange={(e) => {
                      const next = { ...block.attrs };
                      delete next[k];
                      next[e.target.value] = v;
                      updateBlock(block.id, { attrs: next });
                    }}
                    className="w-1/3 rounded border border-border bg-input px-2 py-1 font-mono"
                  />
                  <input
                    value={v}
                    onChange={(e) => updateBlock(block.id, { attrs: { ...block.attrs, [k]: e.target.value } })}
                    className="flex-1 rounded border border-border bg-input px-2 py-1"
                  />
                  <button
                    onClick={() => {
                      const next = { ...block.attrs };
                      delete next[k];
                      updateBlock(block.id, { attrs: next });
                    }}
                    className="text-destructive hover:opacity-80"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {Object.keys(block.attrs ?? {}).length === 0 && (
                <div className="italic text-muted-foreground">Nenhum atributo dinâmico.</div>
              )}
            </div>
            <div className="mt-2 space-y-2 rounded border border-dashed border-border p-2">
              <div className="text-[10px] uppercase text-muted-foreground">Novo atributo</div>
              <input
                placeholder="nome (ex: data-id)"
                value={newAttrKey}
                onChange={(e) => setNewAttrKey(e.target.value)}
                className="w-full rounded border border-border bg-input px-2 py-1 font-mono"
              />
              <input
                placeholder="valor"
                value={newAttrVal}
                onChange={(e) => setNewAttrVal(e.target.value)}
                className="w-full rounded border border-border bg-input px-2 py-1"
              />
              <button
                disabled={!newAttrKey.trim()}
                onClick={() => {
                  updateBlock(block.id, {
                    attrs: { ...(block.attrs ?? {}), [newAttrKey.trim()]: newAttrVal },
                  });
                  setNewAttrKey("");
                  setNewAttrVal("");
                }}
                className="flex w-full items-center justify-center gap-1 rounded bg-primary py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
              >
                <Plus className="h-3 w-3" /> Adicionar atributo
              </button>
            </div>
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
              {block.events.map((ev, i) => (
                <div key={i} className="flex items-center gap-2 rounded border border-border bg-card px-2 py-1.5">
                  <span className="font-mono text-primary">{ev.event}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="flex-1 truncate">
                    {ev.kind === "function"
                      ? `${scripts.find((s) => s.id === ev.scriptId)?.name ?? "?"} :: ${ev.functionName}()`
                      : `${ev.method} ${ev.url}`}
                  </span>
                  <button onClick={() => removeEvent(block.id, i)} className="text-destructive hover:opacity-80">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2 rounded border border-dashed border-border p-2">
              <div className="text-[10px] uppercase text-muted-foreground">Novo vínculo</div>
              <select
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                className="w-full rounded border border-border bg-input px-2 py-1"
              >
                {EVENTS.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
              <div className="flex gap-1 rounded border border-border bg-input p-0.5">
                {(["function", "url"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setNewEventKind(k)}
                    className={`flex-1 rounded px-2 py-1 ${
                      newEventKind === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {k === "function" ? "Função de script" : "URL"}
                  </button>
                ))}
              </div>
              {newEventKind === "function" ? (
                <>
                  <select
                    value={newScriptId}
                    onChange={(e) => {
                      setNewScriptId(e.target.value);
                      setNewFn("");
                    }}
                    className="w-full rounded border border-border bg-input px-2 py-1"
                  >
                    <option value="">— escolha um script —</option>
                    {scripts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newFn}
                    onChange={(e) => setNewFn(e.target.value)}
                    disabled={!newScriptId}
                    className="w-full rounded border border-border bg-input px-2 py-1 disabled:opacity-40"
                  >
                    <option value="">— escolha uma função —</option>
                    {availableFns.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={!newScriptId || !newFn}
                    onClick={() => {
                      const binding: EventBinding = {
                        event: newEventName,
                        kind: "function",
                        scriptId: newScriptId,
                        functionName: newFn,
                      };
                      addEvent(block.id, binding);
                      setNewFn("");
                    }}
                    className="w-full rounded bg-primary py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
                  >
                    Vincular função
                  </button>
                </>
              ) : (
                <>
                  <div className="flex gap-2">
                    <select
                      value={newMethod}
                      onChange={(e) => setNewMethod(e.target.value as (typeof METHODS)[number])}
                      className="rounded border border-border bg-input px-2 py-1"
                    >
                      {METHODS.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="flex-1 rounded border border-border bg-input px-2 py-1"
                    />
                  </div>
                  <button
                    disabled={!newUrl}
                    onClick={() => {
                      addEvent(block.id, {
                        event: newEventName,
                        kind: "url",
                        url: newUrl,
                        method: newMethod,
                      });
                    }}
                    className="w-full rounded bg-primary py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
                  >
                    Vincular URL
                  </button>
                </>
              )}
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