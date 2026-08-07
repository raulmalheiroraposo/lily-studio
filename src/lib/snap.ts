import type { Block } from "./types";

export const SNAP_THRESHOLD = 6;
export const GRID = 20;

export type Guides = { x: number[]; y: number[] };

type Rect = { x: number; y: number; w: number; h: number };

function candidates(blocks: Block[], skipId: string, size: { w: number; h: number }) {
  const xs: number[] = [0, size.w / 2, size.w];
  const ys: number[] = [0, size.h / 2, size.h];
  for (const b of blocks) {
    if (b.id === skipId) continue;
    xs.push(b.x, b.x + b.w / 2, b.x + b.w);
    ys.push(b.y, b.y + b.h / 2, b.y + b.h);
  }
  return { xs, ys };
}

function nearest(value: number, list: number[]) {
  let best: number | null = null;
  let dist = SNAP_THRESHOLD + 1;
  for (const c of list) {
    const d = Math.abs(c - value);
    if (d < dist) {
      dist = d;
      best = c;
    }
  }
  return best === null || dist > SNAP_THRESHOLD ? null : best;
}

/** Snaps a moving rect to sibling edges/centers, canvas bounds and the grid. */
export function snapRect(
  rect: Rect,
  blocks: Block[],
  skipId: string,
  size: { w: number; h: number }
): { x: number; y: number; guides: Guides } {
  const { xs, ys } = candidates(blocks, skipId, size);
  const guides: Guides = { x: [], y: [] };
  let x: number;
  let y: number;

  const xEdges: [number, number][] = [
    [rect.x, 0],
    [rect.x + rect.w / 2, rect.w / 2],
    [rect.x + rect.w, rect.w],
  ];
  let bestX: { pos: number; guide: number; dist: number } | null = null;
  for (const [edge, offset] of xEdges) {
    const hit = nearest(edge, xs);
    if (hit === null) continue;
    const dist = Math.abs(hit - edge);
    if (!bestX || dist < bestX.dist) bestX = { pos: hit - offset, guide: hit, dist };
  }
  if (bestX) {
    x = bestX.pos;
    guides.x.push(bestX.guide);
  } else {
    x = Math.round(rect.x / GRID) * GRID;
  }

  const yEdges: [number, number][] = [
    [rect.y, 0],
    [rect.y + rect.h / 2, rect.h / 2],
    [rect.y + rect.h, rect.h],
  ];
  let bestY: { pos: number; guide: number; dist: number } | null = null;
  for (const [edge, offset] of yEdges) {
    const hit = nearest(edge, ys);
    if (hit === null) continue;
    const dist = Math.abs(hit - edge);
    if (!bestY || dist < bestY.dist) bestY = { pos: hit - offset, guide: hit, dist };
  }
  if (bestY) {
    y = bestY.pos;
    guides.y.push(bestY.guide);
  } else {
    y = Math.round(rect.y / GRID) * GRID;
  }

  return { x: Math.max(0, x), y: Math.max(0, y), guides };
}

/** Snaps the moving edges of a resize to sibling edges/centers. */
export function snapResize(
  rect: Rect,
  blocks: Block[],
  skipId: string,
  size: { w: number; h: number }
): { rect: Rect; guides: Guides } {
  const { xs, ys } = candidates(blocks, skipId, size);
  const guides: Guides = { x: [], y: [] };
  const out = { ...rect };

  const right = nearest(rect.x + rect.w, xs);
  if (right !== null) {
    out.w = Math.max(20, right - rect.x);
    guides.x.push(right);
  }
  const bottom = nearest(rect.y + rect.h, ys);
  if (bottom !== null) {
    out.h = Math.max(20, bottom - rect.y);
    guides.y.push(bottom);
  }
  const left = nearest(rect.x, xs);
  if (left !== null) guides.x.push(left);
  const top = nearest(rect.y, ys);
  if (top !== null) guides.y.push(top);

  return { rect: out, guides };
}