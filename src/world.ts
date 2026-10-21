// The courtyard: walkable bounds and solid footprints. Footprints are taken from the Oriverse
// world (oriverse/frieren/courtyard.weave in the-hero-fighter), in sim centimetres.

import { mapX, mapY } from "./projection";
import type { Vec2 } from "./types";

export const SPAWN = { x: 1000, y: 250 };
export const BOUNDS = { minX: 60, maxX: 2650, minY: -760, maxY: 2050 };

// box: centre, w along local X, d along local Y, rot = degrees about Z (counter-clockwise).
// circle: centre, r.
interface CircleSolid {
  kind: string;
  x: number;
  y: number;
  r: number;
}
interface BoxSpec {
  kind: string;
  x: number;
  y: number;
  w: number;
  d: number;
  rot: number;
}
interface BoxSolid extends BoxSpec {
  cos: number;
  sin: number;
}
export type Solid = CircleSolid | BoxSolid;

const SPECS: (CircleSolid | BoxSpec)[] = [
  { kind: "house", x: 1910, y: 1440, w: 810, d: 910, rot: 0 },
  { kind: "well", x: 1100, y: 820, w: 190, d: 190, rot: 8 },
  { kind: "box", x: 792, y: 771, w: 156, d: 116, rot: -10 },   // cart
  { kind: "box", x: 1864, y: 178, w: 50, d: 170, rot: 24 },    // bench
  { kind: "box", x: 2051, y: -22, w: 50, d: 170, rot: 20 },    // bench
  { kind: "box", x: 1070, y: -470, w: 56, d: 56, rot: 8 },     // crates
  { kind: "box", x: 1100, y: -540, w: 56, d: 56, rot: -12 },
  { kind: "box", x: 1642, y: 965, w: 56, d: 56, rot: 0 },
  { kind: "box", x: 1735, y: 950, w: 56, d: 56, rot: 15 },
  { kind: "box", x: 854, y: -689, w: 150, d: 14, rot: 48 },    // fence
  { kind: "post", x: 978, y: -416, r: 12 },
  { kind: "tree", x: 1000, y: -600, r: 50 },
  { kind: "tree", x: 960, y: 1020, r: 35 },
  { kind: "tree", x: 2380, y: 120, r: 45 },
  { kind: "hedge", x: 2050, y: 680, r: 110 },
  { kind: "hedge", x: 1960, y: 440, r: 110 },
  { kind: "hedge", x: 2120, y: 240, r: 110 },
  { kind: "bush", x: 919, y: -570, r: 45 },
  { kind: "bush", x: 968, y: -684, r: 45 },
  { kind: "bush", x: 422, y: 265, r: 45 },
  { kind: "bush", x: 488, y: -75, r: 45 },
  { kind: "bush", x: 433, y: -195, r: 45 },
  { kind: "bush", x: 668, y: 806, r: 45 },
  { kind: "rock", x: 948, y: -452, r: 25 },
  { kind: "rock", x: 427, y: 56, r: 25 },
  { kind: "rock", x: 612, y: 731, r: 25 },
  { kind: "npc", x: 900, y: 690, r: 26 },      // the merchant (src/shop.ts)
];

export const SOLIDS: Solid[] = SPECS.map((s) => {
  if ("r" in s) return s;
  const a = (s.rot * Math.PI) / 180;
  return { ...s, cos: Math.cos(a), sin: Math.sin(a) };
});

// Push a circle of radius r at p = {x, y} out of every solid and back inside the bounds.
// Resolving overlaps (rather than rejecting the move) lets the player slide along walls.
export function resolve(p: Vec2, r: number): void {
  for (let pass = 0; pass < 3; pass++) {
    for (const s of SOLIDS) {
      if ("r" in s) {
        const dx = p.x - s.x, dy = p.y - s.y;
        const min = s.r + r, d2 = dx * dx + dy * dy;
        if (d2 < min * min) {
          const d = Math.sqrt(d2) || 1e-6;
          p.x = s.x + (dx / d) * min;
          p.y = s.y + (dy / d) * min;
        }
        continue;
      }
      // into the box's frame
      const rx = p.x - s.x, ry = p.y - s.y;
      const lx = rx * s.cos + ry * s.sin, ly = -rx * s.sin + ry * s.cos;
      const hw = s.w / 2, hd = s.d / 2;
      const cx = Math.max(-hw, Math.min(hw, lx)), cy = Math.max(-hd, Math.min(hd, ly));
      const nx = lx - cx, ny = ly - cy;
      const d2 = nx * nx + ny * ny;
      if (d2 >= r * r) continue;
      let ox: number, oy: number;
      if (d2 > 1e-9) {
        const d = Math.sqrt(d2);
        ox = cx + (nx / d) * r;
        oy = cy + (ny / d) * r;
      } else {
        // centre is inside the box: leave by the nearest face
        const px = hw - Math.abs(lx), py = hd - Math.abs(ly);
        if (px < py) { ox = Math.sign(lx || 1) * (hw + r); oy = ly; }
        else { ox = lx; oy = Math.sign(ly || 1) * (hd + r); }
      }
      p.x = s.x + ox * s.cos - oy * s.sin;
      p.y = s.y + ox * s.sin + oy * s.cos;
    }
  }
  p.x = Math.max(BOUNDS.minX + r, Math.min(BOUNDS.maxX - r, p.x));
  p.y = Math.max(BOUNDS.minY + r, Math.min(BOUNDS.maxY - r, p.y));
}

// ---- paths around the solids (the bot walks these) ----
const CELL = 40; // cm
const GW = Math.ceil((BOUNDS.maxX - BOUNDS.minX) / CELL), GH = Math.ceil((BOUNDS.maxY - BOUNDS.minY) / CELL);
const blockedFor = new Map<number, Uint8Array>();

// Whether a circle of radius r at p overlaps a solid or the edge.
export function blocked(p: Vec2, r: number): boolean {
  const q = { x: p.x, y: p.y };
  resolve(q, r);
  return Math.abs(q.x - p.x) + Math.abs(q.y - p.y) > 0.5;
}

function grid(r: number): Uint8Array {
  let g = blockedFor.get(r);
  if (!g) {
    g = new Uint8Array(GW * GH);
    for (let j = 0; j < GH; j++)
      for (let i = 0; i < GW; i++) g[j * GW + i] = blocked(cellCentre(i, j), r + 4) ? 1 : 0;
    blockedFor.set(r, g);
  }
  return g;
}

const cellCentre = (i: number, j: number): Vec2 => ({ x: BOUNDS.minX + (i + 0.5) * CELL, y: BOUNDS.minY + (j + 0.5) * CELL });
const cellOf = (p: Vec2): [number, number] => [
  Math.max(0, Math.min(GW - 1, Math.floor((p.x - BOUNDS.minX) / CELL))),
  Math.max(0, Math.min(GH - 1, Math.floor((p.y - BOUNDS.minY) / CELL))),
];

// The open cell nearest to cell (i, j), searching outwards ring by ring.
function nearestOpen(g: Uint8Array, i: number, j: number): number {
  for (let ring = 0; ring < 12; ring++) {
    for (let dj = -ring; dj <= ring; dj++)
      for (let di = -ring; di <= ring; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== ring) continue;
        const x = i + di, y = j + dj;
        if (x >= 0 && y >= 0 && x < GW && y < GH && !g[y * GW + x]) return y * GW + x;
      }
  }
  return -1;
}

// Whether a circle of radius r can walk straight from a to b.
export function clearLine(a: Vec2, b: Vec2, r: number): boolean {
  const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.ceil(d / 15);
  for (let k = 1; k <= n; k++) {
    const f = k / n;
    if (blocked({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }, r)) return false;
  }
  return true;
}

// Waypoints (not including `from`) for a circle of radius r to walk to `to`, going around the
// solids; ends at the open point nearest `to`. Null when there is no way.
export function findPath(from: Vec2, to: Vec2, r: number): Vec2[] | null {
  if (clearLine(from, to, r)) return [to];
  const g = grid(r);
  const [si, sj] = cellOf(from), [ti, tj] = cellOf(to);
  const start = g[sj * GW + si] ? nearestOpen(g, si, sj) : sj * GW + si;
  const goal = g[tj * GW + ti] ? nearestOpen(g, ti, tj) : tj * GW + ti;
  if (start < 0 || goal < 0) return null;
  const gi = goal % GW, gj = (goal / GW) | 0;
  const cost = new Float32Array(GW * GH).fill(Infinity), came = new Int32Array(GW * GH).fill(-1);
  const h = (c: number) => {
    const dx = Math.abs((c % GW) - gi), dy = Math.abs(((c / GW) | 0) - gj);
    return Math.max(dx, dy) + 0.414 * Math.min(dx, dy);
  };
  // binary heap of [f, cell]
  const heap: [number, number][] = [];
  const push = (f: number, c: number) => {
    heap.push([f, c]);
    for (let k = heap.length - 1; k > 0;) {
      const p = (k - 1) >> 1;
      if (heap[p][0] <= heap[k][0]) break;
      [heap[p], heap[k]] = [heap[k], heap[p]];
      k = p;
    }
  };
  const pop = () => {
    const top = heap[0], end = heap.pop()!;
    if (heap.length) {
      heap[0] = end;
      for (let k = 0; ;) {
        const l = 2 * k + 1, rr = l + 1;
        let m = k;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (rr < heap.length && heap[rr][0] < heap[m][0]) m = rr;
        if (m === k) break;
        [heap[m], heap[k]] = [heap[k], heap[m]];
        k = m;
      }
    }
    return top[1];
  };
  cost[start] = 0;
  push(h(start), start);
  while (heap.length) {
    const c = pop();
    if (c === goal) break;
    const ci = c % GW, cj = (c / GW) | 0;
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const x = ci + di, y = cj + dj;
        if (x < 0 || y < 0 || x >= GW || y >= GH) continue;
        const n = y * GW + x;
        // no cutting corners past a blocked cell
        if (g[n] || (di && dj && (g[cj * GW + x] || g[y * GW + ci]))) continue;
        const step = cost[c] + (di && dj ? 1.414 : 1);
        if (step < cost[n]) {
          cost[n] = step;
          came[n] = c;
          push(step + h(n), n);
        }
      }
  }
  if (came[goal] < 0 && goal !== start) return null;
  const cells: Vec2[] = [];
  for (let c = goal; c !== start && c >= 0; c = came[c]) cells.push(cellCentre(c % GW, (c / GW) | 0));
  cells.reverse();
  if (!g[tj * GW + ti]) cells[cells.length - 1] = to;
  // drop the waypoints a straight walk can skip
  const out: Vec2[] = [];
  let at = from;
  for (let k = 0; k < cells.length;) {
    let far = k;
    while (far + 1 < cells.length && clearLine(at, cells[far + 1], r)) far++;
    out.push(cells[far]);
    at = cells[far];
    k = far + 1;
  }
  return out;
}

function boxCorners(s: BoxSolid): [number, number][] {
  const hw = s.w / 2, hd = s.d / 2;
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([lx, ly]) => [
    s.x + lx * s.cos - ly * s.sin,
    s.y + lx * s.sin + ly * s.cos,
  ]);
}

// Collision outlines for the `?debug` overlay, in map pixels.
export type DebugShape = { circle: [number, number, number] } | { poly: [number, number][] };

export function debugShapes(): DebugShape[] {
  return SOLIDS.map((s): DebugShape =>
    "r" in s
      ? { circle: [mapX(s.x, s.y), mapY(s.x, s.y), s.r] }
      : { poly: boxCorners(s).map(([x, y]) => [mapX(x, y), mapY(x, y)]) },
  );
}
