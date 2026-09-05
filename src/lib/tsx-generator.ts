/**
 * Converts the visual blocks of a React component file into TSX source code,
 * so the visual editor and the component's code stay in sync.
 */
import type { Block } from "./types";
import { chartSourceOf } from "./chart-data";

const styleLiteral = (style: Record<string, unknown>) => JSON.stringify(style ?? {});

function attrsLiteral(attrs: Record<string, string>) {
  return Object.entries(attrs ?? {})
    // Blank values mean the attribute is not set, so it is not emitted.
    .filter(([, v]) => String(v).trim() !== "")
    .map(([k, v]) =>
      // Values kept as `{expr}` are JSX expressions (handlers, refs, numbers).
      /^\{[\s\S]*\}$/.test(v) ? ` ${k}=${v}` : ` ${k}={${JSON.stringify(v)}}`
    )
    .join("");
}

/**
 * Merges the attributes written by hand (which keep their source order) with the
 * defaults the generator provides, so an edited attribute overrides the default
 * instead of being emitted twice.
 */
function mergeAttrs(
  defaults: Record<string, unknown>,
  attrs: Record<string, string> = {}
): Record<string, string> {
  const out: Record<string, string> = { ...attrs };
  for (const [k, v] of Object.entries(defaults)) {
    if (v === undefined || v === null || v === "") continue;
    if (!(k in out)) out[k] = String(v);
  }
  return out;
}

function inner(block: Block, tags: Record<string, string> = {}): string {
  const st = { width: "100%", height: "100%", ...(block.style ?? {}) };
  const own = block.attrs ?? {};
  const a = attrsLiteral(own);
  const text = block.text ?? "";
  switch (block.kind) {
    case "heading":
      return `<h2 style={${styleLiteral(st)}}${a}>${text}</h2>`;
    case "paragraph":
      return `<p style={${styleLiteral(st)}}${a}>${text}</p>`;
    case "button":
      return `<button style={${styleLiteral({ borderRadius: "6px", fontWeight: "600", ...st })}}${attrsLiteral(
        mergeAttrs({ type: "button" }, own)
      )}>${text}</button>`;
    case "input":
      return `<input style={${styleLiteral({ borderRadius: "6px", padding: "0 10px", ...st })}}${attrsLiteral(
        mergeAttrs({ placeholder: block.props.placeholder }, own)
      )} />`;
    case "image":
      return `<img style={${styleLiteral({ objectFit: "cover", borderRadius: "6px", ...st })}}${attrsLiteral(
        mergeAttrs({ src: block.props.src, alt: block.props.alt }, own)
      )} />`;
    case "link":
      return `<a style={${styleLiteral(block.style ?? {})}}${attrsLiteral(
        mergeAttrs({ href: block.props.href ?? "#" }, own)
      )}>${text}</a>`;
    case "chart-bar":
    case "chart-line":
    case "chart-pie": {
      const chart = chartSourceOf(block);
      return `<div style={${styleLiteral(st)}}${a}><FluxoChart kind={${JSON.stringify(
        block.kind
      )}} data-source={${JSON.stringify(chart.source)}} data-name-key={${JSON.stringify(
        chart.nameKey
      )}} data-value-key={${JSON.stringify(chart.valueKey)}} /></div>`;
    }

    case "react": {
      // Nested React components live in their own .tsx file and are reused here
      // through their tag (e.g. `<Contador />`).
      const tag = block.sourceFileId ? tags[block.sourceFileId] : undefined;
      if (tag) return `<div style={${styleLiteral(st)}}${a}><${tag} /></div>`;
      return `<div style={${styleLiteral(st)}}${a}>{/* bloco React sem arquivo vinculado */}</div>`;
    }

    default:
      return `<div style={${styleLiteral({ borderRadius: "6px", ...st })}}${a}>${text}</div>`;
  }
}

export type TsxShell = {
  /** Imports and anything declared before the component. */
  head: string;
  /** Hooks/statements inside the component before its `return`. */
  prelude: string;
  /** Anything declared after the component. */
  tail: string;
  name?: string;
};

/**
 * Splits existing component source so hand-written logic (hooks, helpers,
 * imports) survives regeneration from the visual blocks.
 */
export function extractTsxShell(source: string): TsxShell {
  const empty: TsxShell = { head: "", prelude: "", tail: "" };
  if (!source?.trim()) return empty;
  const decl =
    /(?:export\s+default\s+)?function\s+([A-Za-z0-9_$]+)\s*\([^)]*\)\s*\{/.exec(source);
  if (!decl) return empty;
  const bodyStart = decl.index + decl[0].length;
  // Match the component's closing brace.
  let depth = 1;
  let i = bodyStart;
  while (i < source.length && depth > 0) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    i++;
  }
  const body = source.slice(bodyStart, i - 1);
  const retIdx = body.search(/\n\s*return\s*\(/);
  const prelude = retIdx >= 0 ? body.slice(0, retIdx) : "";
  return {
    head: source.slice(0, decl.index).trimEnd(),
    prelude: prelude.replace(/^\s*\n/, "").trimEnd(),
    tail: source.slice(i).trim(),
    name: decl[1],
  };
}

/** Builds a `export default function` component from positioned blocks. */
export function blocksToTsx(
  componentName: string,
  blocks: Block[],
  previousCode?: string,
  /** Map of component fileId -> JSX tag, for nested React components. */
  componentTags: Record<string, string> = {}
): string {
  const safeName = (componentName.replace(/\.[jt]sx?$/i, "").replace(/[^A-Za-z0-9_]/g, "") || "Componente")
    .replace(/^[0-9]/, "C$&");
  const shell = extractTsxShell(previousCode ?? "");
  const minHeight = Math.max(200, ...blocks.map((b) => b.y + b.h + 24));
  const children = blocks
    .map(
      (b) =>
        `      <div data-block-id={${JSON.stringify(b.id)}} style={${styleLiteral({
          position: "absolute",
          left: `${b.x}px`,
          top: `${b.y}px`,
          width: `${b.w}px`,
          height: `${b.h}px`,
        })}}>\n        ${inner(b, componentTags)}\n      </div>`
    )
    .join("\n");
  // Imports for every nested component actually used by the blocks.
  const usedTags = Array.from(
    new Set(
      blocks
        .filter((b) => b.kind === "react" && b.sourceFileId)
        .map((b) => componentTags[b.sourceFileId as string])
        .filter((t): t is string => !!t)
    )
  );
  const headBase = shell.head;
  const imports = usedTags
    .filter((t) => !new RegExp(`import\\s+${t}\\b`).test(headBase))
    .map((t) => `import ${t} from "./${t}";`)
    .join("\n");
  const headParts = [imports, headBase].filter(Boolean).join("\n");
  const head = headParts ? `${headParts}\n\n` : "";
  const prelude = shell.prelude ? `${shell.prelude}\n\n` : "";
  const tail = shell.tail ? `\n${shell.tail}\n` : "";

  return `${head}export default function ${shell.name || safeName}() {
${prelude}
  return (
    <div style={${styleLiteral({ position: "relative", width: "100%", minHeight: `${minHeight}px` })}}>
${children || "      {/* Arraste componentes da paleta para montar este componente. */}"}
    </div>
  );
}
${tail}`;
}
