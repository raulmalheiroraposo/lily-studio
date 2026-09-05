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
    // Encoded JSX expression attribute: restore original name + `{expr}` value.
    if (attr.name.startsWith("data-jsxattr-")) {
      const decoded = decodeURIComponent(attr.value);
      const eq = decoded.indexOf("=");
      if (eq > 0) attrs[decoded.slice(0, eq)] = `{${decoded.slice(eq + 1)}}`;
      continue;
    }
    attrs[attr.name] = attr.value;
  }
  const props: Record<string, string | number | boolean> = {};
  for (const key of knownProps) {
    if (attrs[key] !== undefined) {
      props[key] = attrs[key];
      delete attrs[key];
    }
  }
  // Drop only the attributes the generator itself always emits.
  if (inner.tagName === "IMG" && attrs.loading === "lazy") delete attrs.loading;
  if (inner.tagName === "BUTTON" && attrs.type === "button") delete attrs.type;
  if (inner.tagName === "INPUT" && attrs.type === "text") delete attrs.type;
  return { text, style, attrs, props };
}

const PROPS_BY_KIND: Record<string, string[]> = {
  input: ["placeholder"],
  image: ["src", "alt"],
  link: ["href"],
};

function blockFromElement(inner: HTMLElement, layout: { x: number; y: number; w: number; h: number }): Block {
  const reactFile = inner.getAttribute("data-react-file");
  const kind = reactFile ? "react" : KIND_BY_TAG[inner.tagName] ?? "div";
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
    text: kind === "input" || kind === "image" || kind === "react" ? undefined : text,
    events: [],
    ...(reactFile ? { sourceFileId: reactFile } : {}),
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
      // Charts inside React components render through a `<FluxoChart />`
      // placeholder: keep its data source in sync with the block props.
      if (block.kind.startsWith("chart-")) {
        const holder = inner.matches("[data-source]")
          ? inner
          : (inner.querySelector("[data-source]") as HTMLElement | null);
        if (holder) {
          patch.props = {
            ...patch.props,
            dataSource: holder.getAttribute("data-source") ?? "",
            nameKey: holder.getAttribute("data-name-key") || "name",
            valueKey: holder.getAttribute("data-value-key") || "value",
          };
        }
      }
    }

    patches[block.id] = patch;
  }

  // New hand-written tags: walk the whole document, skipping known block
  // subtrees, so elements written anywhere (nested included) become blocks.
  const fresh: HTMLElement[] = [];
  const collect = (parent: HTMLElement) => {
    for (const child of Array.from(parent.children) as HTMLElement[]) {
      if (isIgnored(child)) continue;
      if (child.hasAttribute("data-block-id")) continue;
      if (child.querySelector("[data-block-id]")) {
        collect(child);
        continue;
      }
      fresh.push(child);
    }
  };
  collect(doc.body);

  let nextY = Math.max(0, ...blocks.map((b) => b.y + b.h + 16), 24);
  const emit = (el: HTMLElement) => {
    const cs = parseStyleAttr(el.getAttribute("style") ?? "");
    const positioned = cs.position === "absolute";
    // A wrapper written like the generated markup: use its single child as content.
    const onlyChild = el.children.length === 1 ? (el.firstElementChild as HTMLElement) : null;
    const inner = positioned && onlyChild ? onlyChild : el;
    const layout = {
      x: px(cs.left) ?? 24,
      y: px(cs.top) ?? nextY,
      w: px(cs.width) ?? 240,
      h: px(cs.height) ?? 60,
    };
    if (!positioned) nextY = layout.y + layout.h + 16;
    const children = Array.from(inner.children).filter(
      (c) => !isIgnored(c) && !(c as HTMLElement).hasAttribute("data-block-id")
    ) as HTMLElement[];
    const block = blockFromElement(inner, layout);
    // Containers with nested markup: flatten children into their own blocks.
    if (children.length > 0) block.text = undefined;
    added.push(block);
    for (const child of children) emit(child);
  };
  for (const el of fresh) emit(el);

  const nextBlocks = blocks
    .filter((b) => !removedIds.includes(b.id))
    .map((b) => ({ ...b, ...patches[b.id] }))
    .concat(added);

  return { patches, removedIds, added, blocks: nextBlocks };
}
