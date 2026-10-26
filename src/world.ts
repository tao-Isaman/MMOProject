// The current map's walkable bounds and solid footprints, in sim centimetres. A map (src/maps.ts)
// sets them with setMap(); everything that moves or plans a path reads them from here.

import { mapX, mapY } from "./projection";
import type { Vec2 } from "./types";

export const SPAWN = { x: 0, y: 0 };
export const BOUNDS = { minX: -100, maxX: 100, minY: -100, maxY: 100 };

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
export type SolidSpec = CircleSolid | BoxSpec;

export const SOLIDS: Solid[] = [];

// Solids sorted into square buckets, so a big town only tests the few around a point.
const BUCKET = 800;
let buckets = new Map<number, Solid[]>();
const bucketKey = (i: number, j: number) => i * 100003 + j;

// Make `specs` the solids of the map, `bounds` its walkable rectangle and `spawn` where a
// character appears.
export function setMap(specs: SolidSpec[], bounds: typeof BOUNDS, spawn: Vec2): void {
  SOLIDS.length = 0;
  for (const s of specs) {
    if ("r" in s) SOLIDS.push(s);
    else {
      const a = (s.rot * Math.PI) / 180;
      SOLIDS.push({ ...s, cos: Math.cos(a), sin: Math.sin(a) });
    }
  }
  Object.assign(BOUNDS, bounds);
  Object.assign(SPAWN, spawn);
  buckets = new Map();
  for (const s of SOLIDS) {
    const reach = "r" in s ? s.r : Math.hypot(s.w, s.d) / 2;
    for (let i = Math.floor((s.x - reach) / BUCKET); i <= Math.floor((s.x + reach) / BUCKET); i++)
      for (let j = Math.floor((s.y - reach) / BUCKET); j <= Math.floor((s.y + reach) / BUCKET); j++) {
        const k = bucketKey(i, j);
        const list = buckets.get(k);
        if (list) list.push(s);
        else buckets.set(k, [s]);
      }
  }
  GW = Math.ceil((BOUNDS.maxX - BOUNDS.minX) / CELL);
  GH = Math.ceil((BOUNDS.maxY - BOUNDS.minY) / CELL);
  blockedFor.clear();
}

// The solids that may touch a circle of radius r at p.
function near(p: Vec2, r: number): Solid[] {
  const i0 = Math.floor((p.x - r) / BUCKET), i1 = Math.floor((p.x + r) / BUCKET);
  const j0 = Math.floor((p.y - r) / BUCKET), j1 = Math.floor((p.y + r) / BUCKET);
  if (i0 === i1 && j0 === j1) return buckets.get(bucketKey(i0, j0)) ?? [];
  const out = new Set<Solid>();
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (const s of buckets.get(bucketKey(i, j)) ?? []) out.add(s);
  return [...out];
}

// Push a circle of radius r at p = {x, y} out of every solid and back inside the bounds.
// Resolving overlaps (rather than rejecting the move) lets the player slide along walls.
export function resolve(p: Vec2, r: number): void {
  const around = near(p, r + 40);
  for (let pass = 0; pass < 3; pass++) {
    for (const s of around) {
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
let GW = 1, GH = 1;
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

// The kinds of solid a shot (an arrow, a bullet, a spell) can't go through: walls and buildings.
// It flies over everything else: the cliffs between one level of the ground and the next, the
// banks of water, trees, rocks, fences, stalls.
const SHOT_PROOF = new Set(["wall", "building", "house", "shed", "shops", "palace", "temple", "tower", "gate", "mill", "igloo", "aqueduct"]);

// Whether a point is inside solid s.
function inside(p: Vec2, s: Solid): boolean {
  if ("r" in s) return Math.hypot(p.x - s.x, p.y - s.y) < s.r;
  const rx = p.x - s.x, ry = p.y - s.y;
  return Math.abs(rx * s.cos + ry * s.sin) < s.w / 2 && Math.abs(-rx * s.sin + ry * s.cos) < s.d / 2;
}

// Whether a shot from a to b would get there: no wall or building in the way (a cliff, up or
// down, is no matter: what is above or below it is shot at as if the ground were flat).
export function clearShot(a: Vec2, b: Vec2): boolean {
  const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.ceil(d / 15);
  for (let k = 1; k < n; k++) {
    const p = { x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n };
    if (near(p, 0).some((s) => SHOT_PROOF.has(s.kind) && inside(p, s))) return false;
  }
  return true;
}

// Where to walk to get within `keep` cm of `to` coming from `from`: that far short of it on the
// straight line between (or `from` itself, already that close). A shooter heads there and not
// to the target itself, which may stand up on a ledge with the way up round by a ramp far off.
export function shortOf(from: Vec2, to: Vec2, keep: number): Vec2 {
  const dx = from.x - to.x, dy = from.y - to.y, d = Math.hypot(dx, dy);
  return d <= keep ? { x: from.x, y: from.y } : { x: to.x + (dx / d) * keep, y: to.y + (dy / d) * keep };
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
  // (float64: in float32 a long path's cost rounds when stored, and the same step keeps
  // looking like an improvement for ever)
  const cost = new Float64Array(GW * GH).fill(Infinity), came = new Int32Array(GW * GH).fill(-1);
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
    return top;
  };
  cost[start] = 0;
  push(h(start), start);
  while (heap.length) {
    const [f, c] = pop();
    if (c === goal) break;
    if (f > cost[c] + h(c) + 1e-6) continue; // a stale entry: this cell was reached cheaper since
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
