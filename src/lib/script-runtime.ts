import type { EventBinding, ProjectFile } from "./types";

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

export async function runBinding(
  binding: EventBinding,
  files: ProjectFile[],
  eventArg: unknown
): Promise<void> {
  try {
    if (binding.kind === "url") {
      const res = await fetch(binding.url, { method: binding.method });
      console.log(`[evento] ${binding.event} → ${binding.method} ${binding.url} → ${res.status}`);
      return;
    }
    const script = files.find((f) => f.id === binding.scriptId && f.type === "script");
    if (!script?.code) {
      console.warn("[evento] script não encontrado", binding);
      return;
    }
    const exp = getScriptExports(script.code);
    const fn = exp[binding.functionName];
    if (typeof fn !== "function") {
      console.warn(`[evento] função ${binding.functionName} não encontrada em ${script.name}`);
      return;
    }
    await (fn as (arg: unknown) => unknown)(eventArg);
  } catch (err) {
    console.error("[evento] erro:", err);
  }
}