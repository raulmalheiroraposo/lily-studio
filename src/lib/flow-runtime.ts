import type { Flow } from "./types";

export type RunLog = { nodeId: string; label: string; message: string; level: "info" | "error" }[];

export async function runFlow(flow: Flow, initialCtx: Record<string, unknown> = {}) {
  const log: RunLog = [];
  let ctx: Record<string, unknown> = { ...initialCtx };
  const nodeById = new Map(flow.nodes.map((n) => [n.id, n]));
  const nextOf = (id: string, handle?: string) =>
    flow.edges
      .filter((e) => e.source === id && (!handle || e.sourceHandle === handle))
      .map((e) => e.target);

  const start = flow.nodes.find((n) => n.data.kind === "start");
  if (!start) {
    log.push({ nodeId: "-", label: "-", message: "Fluxo sem nó Início", level: "error" });
    return { ctx, log };
  }

  const queue: string[] = nextOf(start.id);
  const visited = new Set<string>();
  let safety = 200;

  while (queue.length && safety-- > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = nodeById.get(id);
    if (!node) continue;
    const { data } = node;
    try {
      if (data.kind === "end") {
        log.push({ nodeId: id, label: data.label, message: "Fim", level: "info" });
        break;
      } else if (data.kind === "function") {
        // eslint-disable-next-line no-new-func
        const fn = new Function("ctx", data.code ?? "return ctx;");
        const result = await fn(ctx);
        if (result && typeof result === "object") ctx = result as typeof ctx;
        log.push({ nodeId: id, label: data.label, message: `função executada`, level: "info" });
      } else if (data.kind === "http") {
        const res = await fetch(data.url ?? "", { method: data.method ?? "GET" });
        const text = await res.text();
        (ctx as Record<string, unknown>).lastResponse = text.slice(0, 200);
        log.push({
          nodeId: id,
          label: data.label,
          message: `${data.method} ${data.url} → ${res.status}`,
          level: res.ok ? "info" : "error",
        });
      } else if (data.kind === "loop") {
        const iters = data.iterations ?? 1;
        log.push({ nodeId: id, label: data.label, message: `laço ×${iters}`, level: "info" });
      } else if (data.kind === "control") {
        // eslint-disable-next-line no-new-func
        const cond = new Function("ctx", `return (${data.condition ?? "true"});`);
        const truthy = !!cond(ctx);
        log.push({
          nodeId: id,
          label: data.label,
          message: `condição: ${truthy}`,
          level: "info",
        });
        queue.push(...nextOf(id, truthy ? "true" : "false"));
        continue;
      }
      queue.push(...nextOf(id));
    } catch (err) {
      log.push({
        nodeId: id,
        label: data.label,
        message: `erro: ${(err as Error).message}`,
        level: "error",
      });
    }
  }
  return { ctx, log };
}