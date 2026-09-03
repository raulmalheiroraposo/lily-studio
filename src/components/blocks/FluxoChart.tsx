import { ChartBlock } from "./ChartBlock";

type ChartKind = "chart-bar" | "chart-line" | "chart-pie";

/**
 * Chart element used inside compiled React components (TSX blocks).
 * Accepts the data source through props/attributes so charts placed in a React
 * component behave exactly like charts placed directly on an HTML page.
 */
export function FluxoChart(props: Record<string, unknown>) {
  const kind = (String(props.kind ?? props["data-chart"] ?? "chart-bar") as ChartKind) || "chart-bar";
  const source = String(props.source ?? props["data-source"] ?? props.dataSource ?? "");
  const nameKey = String(props.nameKey ?? props["data-name-key"] ?? "name");
  const valueKey = String(props.valueKey ?? props["data-value-key"] ?? "value");
  const style = (props.style as React.CSSProperties | undefined) ?? {};
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--card)",
        borderRadius: 8,
        padding: 8,
        ...style,
      }}
    >
      <ChartBlock kind={kind} source={source} nameKey={nameKey} valueKey={valueKey} />
    </div>
  );
}

export default FluxoChart;
