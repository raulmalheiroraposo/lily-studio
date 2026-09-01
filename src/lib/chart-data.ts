import type { Block, ProjectFile } from "./types";
import { resolveScriptFunction } from "./script-runtime";

export type ChartPoint = { name: string; value: number };

export const DEFAULT_CHART_DATA: ChartPoint[] = [
  { name: "Jan", value: 40 },
  { name: "Fev", value: 30 },
  { name: "Mar", value: 55 },
  { name: "Abr", value: 25 },
  { name: "Mai", value: 70 },
];

/** Reads the data source declared on a chart block (prop or attribute). */
export function chartSourceOf(block: Block) {
  const raw =
    (block.props?.dataSource as string | undefined) ??
    block.attrs?.["data-source"] ??
    block.attrs?.["data-chart-source"] ??
    "";
  return {
    source: String(raw ?? "").trim(),
    nameKey: String(block.props?.nameKey ?? block.attrs?.["data-name-key"] ?? "name"),
    valueKey: String(block.props?.valueKey ?? block.attrs?.["data-value-key"] ?? "value"),
  };
}

/** Turns any array/object payload into `{ name, value }` points. */
export function normalizeChartData(raw: unknown, nameKey = "name", valueKey = "value"): ChartPoint[] {
  let data: unknown = raw;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    const nested = Object.values(obj).find((v) => Array.isArray(v));
    if (nested) data = nested;
    else
      return Object.entries(obj).map(([k, v]) => ({ name: k, value: Number(v) || 0 }));
  }
  if (!Array.isArray(data)) return [];
  return data.map((item, i) => {
    if (typeof item === "number") return { name: String(i + 1), value: item };
    const o = (item ?? {}) as Record<string, unknown>;
    const name = o[nameKey] ?? o.name ?? o.label ?? o.x ?? String(i + 1);
    const value = Number(o[valueKey] ?? o.value ?? o.y ?? 0);
    return { name: String(name), value: Number.isFinite(value) ? value : 0 };
  });
}

/**
 * Resolves a chart data source: inline JSON, a URL (site or API) or the name of
 * a function declared in one of the project scripts (or on `window`).
 */
export async function resolveChartData(
  source: string,
  files: ProjectFile[],
  nameKey = "name",
  valueKey = "value"
): Promise<ChartPoint[]> {
  const src = source.trim();
  if (!src) return DEFAULT_CHART_DATA;
  if (src.startsWith("[") || src.startsWith("{")) {
    return normalizeChartData(JSON.parse(src), nameKey, valueKey);
  }
  if (/^(https?:)?\/\//.test(src) || src.startsWith("/")) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText || ""} · ${src}`);
    return normalizeChartData(await res.json(), nameKey, valueKey);
  }
  const fn = resolveScriptFunction(files, src.replace(/\(\s*\)$/, ""));
  if (!fn) throw new Error(`Fonte de dados não reconhecida: ${src}`);
  return normalizeChartData(await fn(), nameKey, valueKey);
}
