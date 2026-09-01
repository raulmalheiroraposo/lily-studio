import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { useProject } from "@/lib/project-store";
import {
  DEFAULT_CHART_DATA,
  chartSourceOf,
  resolveChartData,
  type ChartPoint,
} from "@/lib/chart-data";
import type { Block } from "@/lib/types";

const colors = ["#5da8ff", "#b48cff", "#66d9c2", "#ffb861", "#ff7d9c"];

export function ChartBlock({
  kind,
  block,
}: {
  kind: "chart-bar" | "chart-line" | "chart-pie";
  block?: Block;
}) {
  const files = useProject((s) => s.files);
  const cfg = block
    ? chartSourceOf(block)
    : { source: "", nameKey: "name", valueKey: "value" };
  const [data, setData] = useState<ChartPoint[]>(DEFAULT_CHART_DATA);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    resolveChartData(cfg.source, files, cfg.nameKey, cfg.valueKey)
      .then((points) => {
        if (alive) setData(points.length ? points : DEFAULT_CHART_DATA);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : String(err));
        setData(DEFAULT_CHART_DATA);
      });
    return () => {
      alive = false;
    };
  }, [cfg.source, cfg.nameKey, cfg.valueKey, files]);

  return (
    <div className="relative h-full w-full">
      {error && (
        <div className="absolute right-1 top-1 z-10 max-w-full truncate rounded bg-destructive/20 px-1 text-[10px] text-destructive">
          {error}
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        {kind === "chart-bar" ? (
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#888" fontSize={10} />
            <YAxis stroke="#888" fontSize={10} />
            <Tooltip />
            <Bar dataKey="value" fill="#5da8ff" />
          </BarChart>
        ) : kind === "chart-line" ? (
          <LineChart data={data}>
            <XAxis dataKey="name" stroke="#888" fontSize={10} />
            <YAxis stroke="#888" fontSize={10} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#5da8ff" strokeWidth={2} />
          </LineChart>
        ) : (
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={70} label>
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
