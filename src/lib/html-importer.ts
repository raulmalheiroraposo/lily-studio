import type { Block, BlockKind } from "./types";

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

const KIND_BY_TAG: Record<string, BlockKind> = {
  H1: "heading",
  H2: "heading",
  H3: "heading",
  H4: "heading",
  H5: "heading",
  H6: "heading",
  P: "paragraph",
  SPAN: "paragraph",
  BUTTON: "button",
  INPUT: "input",
  TEXTAREA: "input",
  IMG: "image",
  A: "link",
  SECTION: "section",
  DIV: "div",
};

const uid = () => Math.random().toString(36).slice(2, 10);

const IGNORED_IDS = new Set(["fs-log", "fs-log-toggle"]);

function isIgnored(el: Element) {
  const tag = el.tagName;
  return (
    tag === "SCRIPT" ||
    tag === "STYLE" ||
    tag === "NAV" ||
    tag === "TEMPLATE" ||
    IGNORED_IDS.has(el.id)
  );
}

/** Splits an element into content-related fields shared by patch/create paths. */
function readInner(inner: HTMLElement, knownProps: string[]) {
  const text = (inner.textContent ?? "").trim();
  const style: Record<string, string> = {};
  for (const [k, v] of Object.entries(parseStyleAttr(inner.getAttribute("style") ?? ""))) {
    if (!LAYOUT_KEYS.has(k)) style[k] = v;
  }
  const attrs: Record<string, string> = {};
  for (const attr of Array.from(inner.attributes)) {
    if (attr.name === "style" || attr.name.startsWith("data-react") || attr.name === "data-block-id") continue;
    attrs[attr.name] = attr.value;
  }
  const props: Record<string, string | number | boolean> = {};
  for (const key of knownProps) {
    if (attrs[key] !== undefined) {
      props[key] = attrs[key];
      delete attrs[key];
    }
  }
  if (inner.tagName === "INPUT" || inner.tagName === "IMG" || inner.tagName === "A") {
    delete attrs.type;
    delete attrs.loading;
  }
  return { text, style, attrs, props };
}

const PROPS_BY_KIND: Record<string, string[]> = {
  input: ["placeholder"],
  image: ["src", "alt"],
  link: ["href"],
};

function blockFromElement(inner: HTMLElement, layout: { x: number; y: number; w: number; h: number }): Block {
  const kind = KIND_BY_TAG[inner.tagName] ?? "div";
  const known = PROPS_BY_KIND[kind] ?? [];
  const { text, style, attrs, props } = readInner(inner, known);
  return {
    id: uid(),
    kind,
    x: layout.x,
    y: layout.y,
    w: layout.w,
    h: layout.h,
    props,
    style,
    attrs,
    text: kind === "input" || kind === "image" ? undefined : text,
    events: [],
  };
}

/**
 * Two-way sync between source code and blocks: existing blocks (matched by
 * data-block-id) get patched, blocks missing from the source are removed, and
 * brand-new tags written by hand become new blocks.
 */
export function parsePageHtml(
  htmlSource: string,
  blocks: Block[]
): { patches: Record<string, Partial<Block>>; removedIds: string[]; added: Block[]; blocks: Block[] } {
  const doc = new DOMParser().parseFromString(htmlSource, "text/html");
  const patches: Record<string, Partial<Block>> = {};
  const removedIds: string[] = [];
  const added: Block[] = [];

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
      const known = Object.keys(block.props);
      const read = readInner(inner, known.length ? known : PROPS_BY_KIND[block.kind] ?? []);
      if (block.text !== undefined && read.text !== block.text) patch.text = read.text;
      patch.style = read.style;
      patch.props = { ...block.props, ...read.props };
      patch.attrs = read.attrs;
    }
    patches[block.id] = patch;
  }

  // New hand-written tags: scan the container that holds the known wrappers.
  const anchor = doc.querySelector("[data-block-id]");
  const root = (anchor?.parentElement ?? doc.querySelector(".page") ?? doc.body) as HTMLElement;
  let nextY = Math.max(0, ...blocks.map((b) => b.y + b.h + 16), 24);
  for (const child of Array.from(root.children) as HTMLElement[]) {
    if (child.hasAttribute("data-block-id") || isIgnored(child)) continue;
    const cs = parseStyleAttr(child.getAttribute("style") ?? "");
    const positioned = cs.position === "absolute";
    const inner = positioned ? ((child.firstElementChild as HTMLElement | null) ?? child) : child;
    const layout = {
      x: px(cs.left) ?? 24,
      y: px(cs.top) ?? nextY,
      w: px(cs.width) ?? 240,
      h: px(cs.height) ?? 60,
    };
    const block = blockFromElement(inner, layout);
    if (!positioned) nextY = layout.y + layout.h + 16;
    added.push(block);
  }

  const nextBlocks = blocks
    .filter((b) => !removedIds.includes(b.id))
    .map((b) => ({ ...b, ...patches[b.id] }))
    .concat(added);

  return { patches, removedIds, added, blocks: nextBlocks };
}
