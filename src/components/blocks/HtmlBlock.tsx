import type { Block } from "@/lib/types";
import { ChartBlock } from "./ChartBlock";
import { ReactBlock } from "./ReactBlock";

export function BlockRenderer({
  block,
  eventHandlers,
}: {
  block: Block;
  eventHandlers?: Record<string, (e: unknown) => void>;
}) {
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    ...(block.style as React.CSSProperties),
  };
  const attrs = block.attrs ?? {};
  const handlers = eventHandlers ?? {};
  switch (block.kind) {
    case "heading":
      return <h2 style={style} {...attrs} {...handlers}>{block.text}</h2>;
    case "paragraph":
      return <p style={style} {...attrs} {...handlers}>{block.text}</p>;
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
          {...attrs}
          {...handlers}
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
          {...attrs}
          {...handlers}
        />
      );
    case "image":
      return (
        <img
          src={block.props.src as string}
          alt={block.props.alt as string}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6, ...(block.style as React.CSSProperties) }}
          {...attrs}
          {...handlers}
        />
      );
    case "link":
      return (
        <a
          href={block.props.href as string}
          style={{ color: "var(--primary)", ...(block.style as React.CSSProperties) }}
          {...attrs}
          {...handlers}
        >
          {block.text}
        </a>
      );
    case "chart-bar":
    case "chart-line":
    case "chart-pie":
      return (
        <div
          style={{ width: "100%", height: "100%", background: "var(--card)", borderRadius: 8, padding: 8 }}
          {...attrs}
          {...handlers}
        >
          <ChartBlock kind={block.kind} />
        </div>
      );
    case "react":
      return <ReactBlock code={block.code ?? ""} />;
    case "section":
    case "div":
    default:
      return (
        <div
          style={{ width: "100%", height: "100%", borderRadius: 6, ...(block.style as React.CSSProperties) }}
          {...attrs}
          {...handlers}
        >
          {block.text}
        </div>
      );
  }
}