import type { Block } from "./types";

function parseStyleAttr(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of css.split(";")) {
    const i = part.indexOf(":");
    if (i < 0) continue;
    const key = part.slice(0, i).trim();
    const val = part.slice(i + 1).trim();
    if (!key || !val) continue;
    out[key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = val;
  }
  return out;
}

const LAYOUT_KEYS = new Set([
  "width",
  "height",
  "position",
  "left",
  "top",
  "objectFit",
  "boxSizing",
  "cursor",
  "overflow",
]);

const px = (v?: string) => {
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? Math.round(n) : undefined;
};

/**
 * Reads back the HTML produced by buildPageHtml and returns a patch per block id:
 * position/size (from the wrapper), plus text, inline style and dynamic attrs
 * (from the inner element). Blocks removed from the HTML are reported separately.
 */
export function parsePageHtml(
  htmlSource: string,
  blocks: Block[]
): { patches: Record<string, Partial<Block>>; removedIds: string[] } {
  const doc = new DOMParser().parseFromString(htmlSource, "text/html");
  const patches: Record<string, Partial<Block>> = {};
  const removedIds: string[] = [];

  for (const block of blocks) {
    const wrapper = doc.querySelector(`[data-block-id="${block.id}"]`);
    if (!wrapper) {
      removedIds.push(block.id);
      continue;
    }
    const patch: Partial<Block> = {};
    const ws = parseStyleAttr(wrapper.getAttribute("style") ?? "");
    const x = px(ws.left);
    const y = px(ws.top);
    const w = px(ws.width);
    const h = px(ws.height);
    if (x !== undefined) patch.x = x;
    if (y !== undefined) patch.y = y;
    if (w !== undefined) patch.w = w;
    if (h !== undefined) patch.h = h;

    const inner = wrapper.firstElementChild as HTMLElement | null;
    if (inner && block.kind !== "react") {
      const text = (inner.textContent ?? "").trim();
      if (block.text !== undefined && text !== block.text) patch.text = text;

      const style: Record<string, string> = {};
      for (const [k, v] of Object.entries(parseStyleAttr(inner.getAttribute("style") ?? ""))) {
        if (!LAYOUT_KEYS.has(k)) style[k] = v;
      }
      patch.style = style;

      const attrs: Record<string, string> = {};
      for (const attr of Array.from(inner.attributes)) {
        if (attr.name === "style" || attr.name.startsWith("data-react")) continue;
        attrs[attr.name] = attr.value;
      }
      const props: Record<string, string | number | boolean> = { ...block.props };
      for (const key of Object.keys(block.props)) {
        if (attrs[key] !== undefined) {
          props[key] = attrs[key];
          delete attrs[key];
        }
      }
      if (inner.tagName === "INPUT" || inner.tagName === "IMG" || inner.tagName === "A") {
        delete attrs.type;
        delete attrs.loading;
      }
      patch.props = props;
      patch.attrs = attrs;
    }
    patches[block.id] = patch;
  }

  return { patches, removedIds };
}
