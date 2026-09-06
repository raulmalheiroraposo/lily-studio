import type { Block } from "./types";

/** Reads the columns/rows configuration of a `table` block. */
export function tableConfig(block: Block) {
  const columns = String(block.props?.columns ?? "Coluna A,Coluna B")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const rows = Math.max(1, Number(block.props?.rows ?? 2) || 2);
  return { columns: columns.length ? columns : ["Coluna A", "Coluna B"], rows };
}
