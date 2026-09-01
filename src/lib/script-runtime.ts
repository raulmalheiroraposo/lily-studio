import type { EventBinding, ProjectFile } from "./types";
import { logEvent } from "./log-store";

function getScriptExports(code: string): Record<string, unknown> {
  try {
    const names = Array.from(
      code.matchAll(/(?:^|\n)\s*(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)/g)
    ).map((m) => m[1]);
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      "exports",
      `${code}\n;` +
        names
          .map((n) => `try { exports[${JSON.stringify(n)}] = ${n}; } catch(e){}`)
          .join("\n") +
        `\nreturn exports;`
    );
    const exp: Record<string, unknown> = {};
    fn(exp);
    return exp;
  } catch (err) {
    console.error("[script-runtime] erro ao carregar script:", err);
    return {};
  }
}

export function listScriptFunctions(code: string): string[] {
  const exp = getScriptExports(code);
  return Object.keys(exp).filter((k) => typeof exp[k] === "function");
}

/** Finds a function by name across the project scripts, falling back to globals. */
export function resolveScriptFunction(
  files: ProjectFile[],
  name: string
): ((...args: unknown[]) => unknown) | null {
  for (const file of files) {
    if (file.type !== "script" || !file.code) continue;
    const fn = getScriptExports(file.code)[name];
    if (typeof fn === "function") return fn as (...args: unknown[]) => unknown;
  }
  const g = (globalThis as unknown as Record<string, unknown>)[name];
  return typeof g === "function" ? (g as (...args: unknown[]) => unknown) : null;
}

export async function runBinding(
  binding: EventBinding,
  files: ProjectFile[],
  eventArg: unknown
): Promise<void> {
  try {
    if (binding.kind === "url") {
      const started = performance.now();
      logEvent({
        level: "info",
        source: binding.event,
        message: `${binding.method} ${binding.url}`,
      });
      const res = await fetch(binding.url, { method: binding.method });
      const ms = Math.round(performance.now() - started);
      logEvent({
        level: res.ok ? "success" : "error",
        source: binding.event,
        message: `${res.status} ${res.statusText || ""} · ${binding.method} ${binding.url}`,
        detail: `${ms} ms`,
      });
      return;
    }
    const script = files.find((f) => f.id === binding.scriptId && f.type === "script");
    if (!script?.code) {
      logEvent({ level: "warn", source: binding.event, message: "Script não encontrado" });
      return;
    }
    const exp = getScriptExports(script.code);
    const fn = exp[binding.functionName];
    if (typeof fn !== "function") {
      logEvent({
        level: "warn",
        source: binding.event,
        message: `Função ${binding.functionName} não encontrada em ${script.name}`,
      });
      return;
    }
    const started = performance.now();
    const result = await (fn as (arg: unknown) => unknown)(eventArg);
    logEvent({
      level: "success",
      source: binding.event,
      message: `${script.name} :: ${binding.functionName}()`,
      detail:
        `${Math.round(performance.now() - started)} ms` +
        (result === undefined ? "" : ` · retorno: ${String(result).slice(0, 120)}`),
    });
  } catch (err) {
    logEvent({
      level: "error",
      source: binding.event,
      message: err instanceof Error ? err.message : String(err),
      detail: err instanceof Error ? err.stack?.split("\n").slice(0, 3).join("\n") : undefined,
    });
  }
}