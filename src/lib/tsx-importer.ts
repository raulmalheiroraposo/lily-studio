import type { Block } from "./types";
import { parsePageHtml } from "./html-importer";

const camelToKebab = (k: string) => k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** Best-effort conversion of a `style={{...}}` object literal into CSS text. */
function objectLiteralToCss(literal: string): string {
  try {
    return Object.entries(JSON.parse(literal) as Record<string, unknown>)
      .map(([k, v]) => `${camelToKebab(k)}:${String(v)}`)
      .join(";");
  } catch {
    return literal
      .replace(/^\{|\}$/g, "")
      .split(",")
      .map((pair) => {
        const i = pair.indexOf(":");
        if (i < 0) return "";
        const key = pair.slice(0, i).trim().replace(/^['"]|['"]$/g, "");
        const val = pair.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
        return key && val ? `${camelToKebab(key)}:${val}` : "";
      })
      .filter(Boolean)
      .join(";");
  }
}

/** Turns generated/hand-written JSX into HTML that the block parser understands. */
export function jsxToHtml(source: string): string {
  let out = source;
  out = out.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "");
  out = out.replace(/dangerouslySetInnerHTML=\{\{[\s\S]*?\}\}/g, "");
  out = out.replace(/style=\{(\{[\s\S]*?\})\}/g, (_, lit: string) => `style="${objectLiteralToCss(lit).replace(/"/g, "&quot;")}"`);
  out = out.replace(/([A-Za-z_:][-\w:.]*)=\{(["'])([\s\S]*?)\2\}/g, (_, name: string, __, val: string) => `${name}="${val.replace(/"/g, "&quot;")}"`);
  out = out.replace(/([A-Za-z_:][-\w:.]*)=\{([^{}"']*?)\}/g, (_, name: string, val: string) => `${name}="${String(val).trim()}"`);
  out = out.replace(/\{["'`]([^"'`]*)["'`]\}/g, "$1");
  return out;
}

export function parseComponentTsx(source: string, blocks: Block[]) {
  return parsePageHtml(jsxToHtml(source), blocks);
}
