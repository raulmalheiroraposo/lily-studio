/**
 * Converts the visual blocks of a React component file into TSX source code,
 * so the visual editor and the component's code stay in sync.
 */
import type { Block } from "./types";
import { chartSvg } from "./site-builder";

const styleLiteral = (style: Record<string, unknown>) => JSON.stringify(style ?? {});

function attrsLiteral(attrs: Record<string, string>) {
  return Object.entries(attrs ?? {})
    .map(([k, v]) => ` ${k}={${JSON.stringify(v)}}`)
    .join("");
}

function inner(block: Block): string {
  const st = { width: "100%", height: "100%", ...(block.style ?? {}) };
  const a = attrsLiteral(block.attrs ?? {});
  const text = block.text ?? "";
  switch (block.kind) {
    case "heading":
      return `<h2 style={${styleLiteral(st)}}${a}>${text}</h2>`;
    case "paragraph":
      return `<p style={${styleLiteral(st)}}${a}>${text}</p>`;
    case "button":
      return `<button type="button" style={${styleLiteral({ borderRadius: "6px", fontWeight: "600", ...st })}}${a}>${text}</button>`;
    case "input":
      return `<input placeholder={${JSON.stringify(String(block.props.placeholder ?? ""))}} style={${styleLiteral({ borderRadius: "6px", padding: "0 10px", ...st })}}${a} />`;
    case "image":
      return `<img src={${JSON.stringify(String(block.props.src ?? ""))}} alt={${JSON.stringify(String(block.props.alt ?? ""))}} style={${styleLiteral({ objectFit: "cover", borderRadius: "6px", ...st })}}${a} />`;
    case "link":
      return `<a href={${JSON.stringify(String(block.props.href ?? "#"))}} style={${styleLiteral(block.style ?? {})}}${a}>${text}</a>`;
    case "chart-bar":
    case "chart-line":
    case "chart-pie":
      return `<div style={${styleLiteral(st)}}${a} dangerouslySetInnerHTML={{ __html: ${JSON.stringify(
        chartSvg(block.kind, block.w, block.h)
      )} }} />`;
    case "react":
      return `<div style={${styleLiteral(st)}}${a}>{/* bloco React aninhado: edite pelo painel de propriedades */}</div>`;
    default:
      return `<div style={${styleLiteral({ borderRadius: "6px", ...st })}}${a}>${text}</div>`;
  }
}

/** Builds a `export default function` component from positioned blocks. */
export function blocksToTsx(componentName: string, blocks: Block[]): string {
  const safeName = (componentName.replace(/\.[jt]sx?$/i, "").replace(/[^A-Za-z0-9_]/g, "") || "Componente")
    .replace(/^[0-9]/, "C$&");
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
        })}}>\n        ${inner(b)}\n      </div>`
    )
    .join("\n");
  return `export default function ${safeName}() {
  return (
    <div style={${styleLiteral({ position: "relative", width: "100%", minHeight: `${minHeight}px` })}}>
${children || "      {/* Arraste componentes da paleta para montar este componente. */}"}
    </div>
  );
}
`;
}
