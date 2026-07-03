import type { Block } from "@/lib/types";
import { ChartBlock } from "./ChartBlock";
import { ReactBlock } from "./ReactBlock";

export function BlockRenderer({ block }: { block: Block }) {
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    ...(block.style as React.CSSProperties),
  };
  switch (block.kind) {
    case "heading":
      return <h2 style={style}>{block.text}</h2>;
    case "paragraph":
      return <p style={style}>{block.text}</p>;
    case "button":
      return (
        <button
          type="button"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 6,
            background: "var(--primary)",
            color: "var(--primary-foreground)",
            fontWeight: 600,
            ...(block.style as React.CSSProperties),
          }}
        >
          {block.text}
        </button>
      );
    case "input":
      return (
        <input
          placeholder={block.props.placeholder as string}
          style={{
            width: "100%",
            height: "100%",
            padding: "0 10px",
            borderRadius: 6,
            background: "var(--input)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            ...(block.style as React.CSSProperties),
          }}
        />
      );
    case "image":
      return (
        <img
          src={block.props.src as string}
          alt={block.props.alt as string}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6, ...(block.style as React.CSSProperties) }}
        />
      );
    case "link":
      return (
        <a href={block.props.href as string} style={{ color: "var(--primary)", ...(block.style as React.CSSProperties) }}>
          {block.text}
        </a>
      );
    case "chart-bar":
    case "chart-line":
    case "chart-pie":
      return (
        <div style={{ width: "100%", height: "100%", background: "var(--card)", borderRadius: 8, padding: 8 }}>
          <ChartBlock kind={block.kind} />
        </div>
      );
    case "react":
      return <ReactBlock code={block.code ?? ""} />;
    case "section":
    case "div":
    default:
      return (
        <div style={{ width: "100%", height: "100%", borderRadius: 6, ...(block.style as React.CSSProperties) }}>
          {block.text}
        </div>
      );
  }
}