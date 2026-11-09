import type { Rect } from './image.js';

export interface DiffRegion extends Rect {
  /** Differing pixels inside this region. */
  pixels: number;
}

/**
 * Groups differing pixels into rectangular regions a reviewer can look at one by one.
 *
 * Pixels closer than `mergeDistance` belong to the same region, so a changed word is one region
 * rather than hundreds of glyph fragments. To stay O(pixels), the mask is bucketed into
 * `mergeDistance`-sized cells; occupied cells are joined with 8-connectivity (union-find), and each
 * group's exact pixel bounds are then taken from the pixels it contains.
 *
 * Regions are returned largest first. Beyond `maxRegions` the smallest are merged into the last one
 * so the report stays readable even for a full-page change.
 */
export function clusterRegions(
  mask: Uint8Array,
  width: number,
  height: number,
  options: { mergeDistance?: number; maxRegions?: number } = {},
): DiffRegion[] {
  const cell = Math.max(1, Math.round(options.mergeDistance ?? 12));
  const maxRegions = Math.max(1, options.maxRegions ?? 20);
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);

  const occupied = new Uint8Array(cols * rows);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    const cellRow = Math.floor(y / cell) * cols;
    for (let x = 0; x < width; x++) {
      if (mask[rowOffset + x] === 1) occupied[cellRow + Math.floor(x / cell)] = 1;
    }
  }

  const parent = new Int32Array(cols * rows).fill(-1);
  const find = (i: number): number => {
    let root = i;
    while ((parent[root] ?? -1) !== root) root = parent[root] ?? root;
    // Path compression keeps later lookups near O(1).
    let node = i;
    while (node !== root) {
      const next = parent[node] ?? root;
      parent[node] = root;
      node = next;
    }
    return root;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb);
  };

  for (let i = 0; i < occupied.length; i++) if (occupied[i] === 1) parent[i] = i;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (occupied[i] !== 1) continue;
      // Looking back at already-visited neighbours covers all 8 directions once.
      for (const [dr, dc] of [
        [0, -1],
        [-1, -1],
        [-1, 0],
        [-1, 1],
      ] as const) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nc >= 0 && nc < cols && occupied[nr * cols + nc] === 1) union(i, nr * cols + nc);
      }
    }
  }

  const boxes = new Map<number, { x0: number; y0: number; x1: number; y1: number; pixels: number }>();
  for (let y = 0; y < height; y++) {
    const cellRow = Math.floor(y / cell) * cols;
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] !== 1) continue;
      const root = find(cellRow + Math.floor(x / cell));
      const box = boxes.get(root);
      if (box) {
        if (x < box.x0) box.x0 = x;
        if (x > box.x1) box.x1 = x;
        if (y > box.y1) box.y1 = y;
        box.pixels++;
      } else {
        boxes.set(root, { x0: x, y0: y, x1: x, y1: y, pixels: 1 });
      }
    }
  }

  const regions = [...boxes.values()]
    .map((b) => ({ x: b.x0, y: b.y0, width: b.x1 - b.x0 + 1, height: b.y1 - b.y0 + 1, pixels: b.pixels }))
    .sort((a, b) => b.pixels - a.pixels || a.y - b.y || a.x - b.x);

  if (regions.length <= maxRegions) return regions;
  const kept = regions.slice(0, maxRegions - 1);
  const rest = regions.slice(maxRegions - 1);
  kept.push(mergeRects(rest));
  return kept;
}

function mergeRects(regions: readonly DiffRegion[]): DiffRegion {
  const x0 = Math.min(...regions.map((r) => r.x));
  const y0 = Math.min(...regions.map((r) => r.y));
  const x1 = Math.max(...regions.map((r) => r.x + r.width));
  const y1 = Math.max(...regions.map((r) => r.y + r.height));
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0, pixels: regions.reduce((s, r) => s + r.pixels, 0) };
}
