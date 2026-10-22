// Ground that is not flat: hills (smooth rises you can walk over), plateaus (raised ground with
// a rock face round the edge you cannot climb) and ramps (the ways up a plateau). In the
// level's own coordinates (centimetres, before TOWN_SCALE), Z up.
//
// A plateau's outline is not taken as drawn: its corners are rounded off and its edges made to
// wander a little (all but where a ramp meets it), and that outline is the one everything uses.
// Seen from the side a cliff is, from the top: the grass rolling over at the lip, a rock face
// leaning back a little (in bulging bands), and a slope of scree at its foot running out into the
// ground below. A ramp is an earth causeway eased in at both ends, its sides falling away as
// steep banks.
//
// `height` is exact (built into the ground mesh and used to stand every piece on the ground);
// the game reads a grid of it (`sampler`) every frame. Down a rock face it is the straight line
// from the top of the face to its foot, which is what the ground mesh draws there (its points are
// moved onto those two lines: `place`), and the rock face (a mesh, with boulders and stones heaped
// at its foot) bulges out in front of it. Solids run along the cliffs, from just inside the edge to
// the foot of the face, so nobody walks off or up them (or into the rock); a ramp leaves its
// stretch of edge open and is walled along its sides.

import * as THREE from "three";
import type { SolidSpec } from "../world";
import type { Poly } from "./paved";
import { material } from "./textures";
import { rock } from "./geo";

type XY = [number, number];

export interface Hill {
  x: number;
  y: number;
  r: number; // where it meets the flat
  h: number; // its top (negative: a hollow)
}

export interface Ramp {
  top: XY;    // on the plateau's edge
  bottom: XY; // out on the ground below
  width: number;
}

export interface Plateau {
  poly: Poly;
  h: number;        // its flat top
  ramps?: Ramp[];
}

export interface TerrainSpec {
  hills?: Hill[];
  plateaus?: Plateau[]; // a plateau inside another is a higher step on it
  rock?: string;        // the cliff faces' material
  detail?: number;      // the cliffs are worked in full within this far of the origin, each way (default 7700)
}

// ---- small helpers ----
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
// value noise round a closed outline L long, about `wave` from bump to bump: the same at s and s + L
function noiseL(s: number, L: number, wave: number, off: number): number {
  const P = Math.max(2, Math.round(L / wave)), x = (s / L) * P, i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const a = ((i % P) + P) % P, b = (a + 1) % P;
  return hash(a + off * 101) * (1 - u) + hash(b + off * 101) * u;
}
// a ramp's height along it: eased in at the top and out at the foot, not quite flat at either
const ease = (t: number) => t + 0.6 * (t * t * (3 - 2 * t) - t);

// ---- the shape of a cliff, by how far it drops ----
const LIP_W = 160;   // the grass starts to roll over this far in from the edge
const BANK = 1.5;    // a ramp's banks: down this much for each cm out
const STEP = 40;     // the working spacing of an outline
const FINE = 80;     // the outline's points near the playing area
const COARSE = 320;  // and far out
const faceW = (d: number) => 18 + 0.13 * d;              // how far out the face's foot is from its top
const screeH = (d: number) => Math.min(55, 0.12 * d);    // how high the scree heaps against it
const screeW = (d: number) => Math.min(320, 100 + 0.3 * d); // and how far out it runs
const lipDrop = (d: number) => Math.min(26, 0.065 * d);  // how far the grass rolls down at the edge

// A plateau's outline as built: points (closed), their outward normals, which are on a cliff (not
// in a ramp's mouth) and the cliff's measures there, with lookups to find the edge near a point.
interface Edge {
  p: Plateau;
  h: number;
  n: number;
  x: Float64Array;
  y: Float64Array;
  nx: Float64Array;
  ny: Float64Array;
  s: Float64Array;    // distance along the outline
  L: number;          // and all the way round
  wall: Uint8Array;   // 1: on a cliff
  drop: Float32Array; // how far the cliff drops
  wf: Float32Array;   // its face's reach out
  ah: Float32Array;   // its scree's height
  wa: Float32Array;   // and reach
  lip: Float32Array;  // how far its grass rolls down at the edge
  x0: number; x1: number; y0: number; y1: number;
  reach: number;      // the furthest from the outline that it shapes the ground
  rows: Map<number, number[]>; // segments by row (for inside tests)
  grid: Map<number, number[]>; // segments within reach of each cell (for nearest)
}
const ROW = 100, CELL = 200;
const key = (i: number, j: number) => (i + 50000) * 100000 + (j + 50000);

function inside(e: Edge, x: number, y: number): boolean {
  if (x < e.x0 || x > e.x1 || y < e.y0 || y > e.y1) return false;
  const list = e.rows.get(Math.floor(y / ROW));
  if (!list) return false;
  let c = false;
  const X = e.x, Y = e.y, n = e.n;
  for (const i of list) {
    const j = i + 1 === n ? 0 : i + 1, yi = Y[i], yj = Y[j];
    if ((yi > y) !== (yj > y) && x < ((X[j] - X[i]) * (y - yi)) / (yj - yi) + X[i]) c = !c;
  }
  return c;
}

// the nearest point of an edge's outline (within its reach): segment i -> j, t along it, d away
const Q = { i: 0, j: 0, t: 0, d: 0 };
function nearest(e: Edge, x: number, y: number): boolean {
  const list = e.grid.get(key(Math.floor(x / CELL), Math.floor(y / CELL)));
  if (!list) return false;
  let best = Infinity;
  const X = e.x, Y = e.y, n = e.n;
  for (const i of list) {
    const j = i + 1 === n ? 0 : i + 1, ax = X[i], ay = Y[i], dx = X[j] - ax, dy = Y[j] - ay;
    let t = ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = ax + dx * t - x, py = ay + dy * t - y, d2 = px * px + py * py;
    if (d2 < best) {
      best = d2;
      Q.i = i;
      Q.j = j;
      Q.t = t;
    }
  }
  Q.d = Math.sqrt(best);
  return true;
}

// a closed polygon as points `step` apart
function resample(poly: Poly, step: number): XY[] {
  const n = poly.length;
  let L = 0;
  for (let i = 0; i < n; i++) L += Math.hypot(poly[(i + 1) % n][0] - poly[i][0], poly[(i + 1) % n][1] - poly[i][1]);
  const m = Math.max(12, Math.round(L / step)), h = L / m, out: XY[] = [];
  let i = 0, into = 0; // segment, distance along it
  for (let k = 0; k < m; k++) {
    const want = k * h;
    let segLen = Math.hypot(poly[(i + 1) % n][0] - poly[i][0], poly[(i + 1) % n][1] - poly[i][1]);
    while (want - into > segLen && i < n - 1) {
      into += segLen;
      i++;
      segLen = Math.hypot(poly[(i + 1) % n][0] - poly[i][0], poly[(i + 1) % n][1] - poly[i][1]);
    }
    const t = segLen > 0 ? clamp((want - into) / segLen, 0, 1) : 0, a = poly[i], b = poly[(i + 1) % n];
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}

// outward normals of a closed polyline (ccw: the inside on the left)
function normals(px: ArrayLike<number>, py: ArrayLike<number>, n: number, ccw: boolean): [Float64Array, Float64Array] {
  const nx = new Float64Array(n), ny = new Float64Array(n), sgn = ccw ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const a = (i + n - 1) % n, b = (i + 1) % n, dx = px[b] - px[a], dy = py[b] - py[a], L = Math.hypot(dx, dy) || 1;
    nx[i] = (sgn * dy) / L;
    ny[i] = (-sgn * dx) / L;
  }
  return [nx, ny];
}
function ccwOf(px: ArrayLike<number>, py: ArrayLike<number>, n: number): boolean {
  let a = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += px[i] * py[j] - px[j] * py[i];
  }
  return a > 0;
}

// The rock faces' own texture (grey, for the cliff's tint to colour; it tiles): level beds of
// stone in different shades with a thin shadowed line at each bedding plane and a lit lip under
// it, sparse cracks down through a bed, fine grain. V runs up the face (world height).
let strataMap: THREE.CanvasTexture | null = null;
function strata(): THREE.CanvasTexture {
  if (strataMap) return strataMap;
  const N = 256, BEDS = 6;
  // value noise that tiles every `p` lattice cells
  const pn = (x: number, y: number, p: number, seed: number) => {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const h = (a: number, b: number) => hash((((a % p) + p) % p) * 57.31 + (((b % p) + p) % p) * 113.7 + seed * 7.13);
    return lerp(lerp(h(i, j), h(i + 1, j), ux), lerp(h(i, j + 1), h(i + 1, j + 1), ux), uy);
  };
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d")!, img = g.createImageData(N, N);
  // the beds' tops, unevenly spaced round the tile
  const tops: number[] = [];
  for (let k = 0; k < BEDS; k++) tops.push((k + (hash(k * 2.3 + 1) - 0.5) * 0.6) / BEDS);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const u = x / N, v = y / N;
      // the beds wave a little along the face
      const vv = (((v + (pn(u * 3, 0.5, 3, 1) - 0.5) * 0.08 + (pn(u * 8, v * 2, 8, 2) - 0.5) * 0.025) % 1) + 1) % 1;
      let bed = BEDS - 1;
      for (let k = 0; k < BEDS; k++) if (vv >= tops[k]) bed = k;
      const top = tops[bed], next = bed + 1 < BEDS ? tops[bed + 1] : tops[0] + 1, vb = vv < top ? vv + 1 : vv;
      const f = (vb - top) / (next - top), dv = (vb - top) * N; // through the bed, and px below its top
      let t = 0.7 + 0.22 * hash(bed * 3.7 + 11);
      const line = 0.45 + 0.5 * hash(bed * 4.9 + 2); // how strong this bedding plane shows
      t *= dv < 2.2 ? 1 - 0.42 * line : dv < 5 ? 1 + 0.12 * line : 1 - 0.12 * smoothstep(0.4, 1, f);
      // a few cracks down part of a bed
      const k = 1 + Math.floor(hash(bed * 5.1 + 3) * 3);
      const cu = u * k + hash(bed * 9.7) * 5 + (f - 0.5) * 0.08 * (hash(bed + 0.3) - 0.5) + (pn(v * 24, bed, 24, 3) - 0.5) * 0.05;
      if (Math.abs((cu % 1) - 0.5) < 0.012 && pn(u * k * 3, f * 2 + bed * 4, k * 3, 4) > 0.55) t *= 0.72;
      // weathering: stains running down, and grain
      t *= 0.9 + 0.16 * pn(u * 20, v * 2.5, 20, 7);
      t *= 0.88 + 0.16 * pn(u * 32, v * 32, 32, 5) + 0.07 * pn(u * 96, v * 96, 96, 6);
      const gr = Math.max(0, Math.min(255, Math.round(t * 255)));
      img.data.set([gr, gr, gr, 255], (y * N + x) * 4);
    }
  g.putImageData(img, 0, 0);
  strataMap = new THREE.CanvasTexture(c);
  strataMap.wrapS = strataMap.wrapT = THREE.RepeatWrapping;
  strataMap.anisotropy = 4;
  strataMap.colorSpace = THREE.SRGBColorSpace;
  return strataMap;
}

// what a ramp needs at hand
interface RampRec {
  r: Ramp;
  e: Edge;        // its plateau's outline
  ux: number; uy: number; len: number;
  back: number;   // how far (along it, 0..1) it reaches back behind its top
  level: number | null; // a level way (a bridge) onto ground this high, not down a slope
  bank: number;   // how far out its banks can reach
}

// the colour a cliff's rock takes where it faces up (moss, snow, sun-bleached), from how far up
// it starts to, and how much
function capOf(rockName: string): { c: [number, number, number]; from: number; to: number; k: number } {
  if (/snow|glacier|ice/i.test(rockName)) return { c: [1.45, 1.48, 1.55], from: 0.25, to: 0.7, k: 0.92 };
  if (/sand|red/i.test(rockName)) return { c: [1.12, 1.06, 0.95], from: 0.45, to: 0.9, k: 0.55 };
  if (/basalt|dark/i.test(rockName)) return { c: [0.95, 0.9, 0.95], from: 0.45, to: 0.9, k: 0.5 };
  return { c: [0.78, 1.0, 0.6], from: 0.45, to: 0.9, k: 0.65 };
}

export class Terrain {
  spec: TerrainSpec;
  private edges: Edge[] = [];
  private ramps: RampRec[] = [];
  private near: Uint8Array;
  private ins: Uint8Array;
  private detail: number;

  constructor(spec: TerrainSpec) {
    this.spec = spec;
    this.detail = spec.detail ?? 7700;
    const ps = spec.plateaus ?? [];
    ps.forEach((p, k) => this.edges.push(this.outline(p, k)));
    this.near = new Uint8Array(this.edges.length);
    this.ins = new Uint8Array(this.edges.length);
    const deep = (spec.hills ?? []).reduce((t, h) => t + Math.max(0, -h.h), 0);
    for (const e of this.edges)
      for (const r of e.p.ramps ?? []) {
        const len = Math.hypot(r.bottom[0] - r.top[0], r.bottom[1] - r.top[1]) || 1;
        // onto ground as high as its top: a level way across (a bridge), not a slope down
        let level: number | null = null;
        for (const o of this.edges) if (o !== e && Math.abs(o.h - e.h) <= 30 && inside(o, r.bottom[0], r.bottom[1])) level = o.h;
        this.ramps.push({ r, e, ux: (r.bottom[0] - r.top[0]) / len, uy: (r.bottom[1] - r.top[1]) / len, len, back: Math.min(0.15, 90 / len), level, bank: level === null ? (e.h + deep) / BANK + 20 : 0 });
      }
    for (const e of this.edges) this.measure(e);
  }

  private inDetail(x: number, y: number): boolean {
    return Math.abs(x) < this.detail && Math.abs(y) < this.detail;
  }

  // A plateau's outline: its polygon at even spacing, the corners rounded (smoothed along it),
  // wandering a little out and in, except about its ramps' tops; then in fewer points far out,
  // and cut where each ramp's mouth begins and ends.
  private outline(p: Plateau, k: number): Edge {
    const pts = resample(p.poly, STEP), n = pts.length;
    let L = 0;
    for (let i = 0; i < n; i++) L += Math.hypot(pts[(i + 1) % n][0] - pts[i][0], pts[(i + 1) % n][1] - pts[i][1]);
    const h = L / n;
    // keep the shape as drawn about each ramp's top
    const w = new Float64Array(n).fill(1);
    for (const r of p.ramps ?? []) {
      let kb = 0, db = Infinity;
      for (let i = 0; i < n; i++) {
        const d = Math.hypot(pts[i][0] - r.top[0], pts[i][1] - r.top[1]);
        if (d < db) [db, kb] = [d, i];
      }
      if (db > 200) continue;
      const hw = r.width / 2 + 40;
      for (let i = 0; i < n; i++) {
        const di = Math.abs(i - kb), ds = Math.min(di, n - di) * h;
        w[i] *= smoothstep(hw + 60, hw + 420, ds);
      }
    }
    // round the corners: a gaussian along the outline
    const sig = clamp(L / 28, 70, 250), R = Math.ceil((3 * sig) / h);
    const ker: number[] = [];
    let ks = 0;
    for (let j = -R; j <= R; j++) ks += ker[j + R] = Math.exp(-((j * h) ** 2) / (2 * sig * sig));
    const sx = new Float64Array(n), sy = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let ax = 0, ay = 0;
      for (let j = -R; j <= R; j++) {
        const q = pts[(((i + j) % n) + n) % n];
        ax += q[0] * ker[j + R];
        ay += q[1] * ker[j + R];
      }
      sx[i] = pts[i][0] + w[i] * (ax / ks - pts[i][0]);
      sy[i] = pts[i][1] + w[i] * (ay / ks - pts[i][1]);
    }
    // wander out and in (waves that fit round the outline a whole number of times)
    const ccw = ccwOf(sx, sy, n);
    const [nx0, ny0] = normals(sx, sy, n, ccw);
    const size = clamp(L / 7000, 0.4, 1);
    const waves = [[2600, 50], [1500, 32], [950, 18], [560, 10], [300, 5]].map(([len, amp], j) => ({ k: Math.max(1, Math.round(L / len)), amp: amp * size, ph: hash(k * 13.7 + j * 3.1) * Math.PI * 2 }));
    for (let i = 0; i < n; i++) {
      const s = (i / n) * Math.PI * 2;
      let o = 0;
      for (const wv of waves) o += wv.amp * Math.sin(wv.k * s + wv.ph);
      sx[i] += nx0[i] * o * w[i];
      sy[i] += ny0[i] * o * w[i];
    }
    // fewer points far out
    const vx: number[] = [], vy: number[] = [];
    let acc = Infinity;
    for (let i = 0; i < n; i++) {
      const step = this.inDetail(sx[i], sy[i]) ? FINE : COARSE;
      if (acc >= step - 1) {
        vx.push(sx[i]);
        vy.push(sy[i]);
        acc = 0;
      }
      acc += Math.hypot(sx[(i + 1) % n] - sx[i], sy[(i + 1) % n] - sy[i]);
    }
    // each ramp's mouth: where the outline is within its width, cut exactly at its sides
    let m = vx.length;
    const gap = new Uint8Array(m);
    const cuts: { after: number; f: number; x: number; y: number }[] = [];
    for (const r of p.ramps ?? []) {
      const len = Math.hypot(r.bottom[0] - r.top[0], r.bottom[1] - r.top[1]) || 1, ux = (r.bottom[0] - r.top[0]) / len, uy = (r.bottom[1] - r.top[1]) / len;
      const side = (i: number) => Math.abs(-(vx[i] - r.top[0]) * uy + (vy[i] - r.top[1]) * ux);
      let kb = 0, db = Infinity;
      for (let i = 0; i < m; i++) {
        const d = Math.hypot(vx[i] - r.top[0], vy[i] - r.top[1]);
        if (d < db) [db, kb] = [d, i];
      }
      const hw = r.width / 2;
      if (db > 150 || side(kb) >= hw) continue;
      let a = kb, b = kb;
      const close = (i: number) => side(i) < hw && Math.hypot(vx[i] - r.top[0], vy[i] - r.top[1]) < r.width * 1.5;
      for (let s = 0; s < m && close((b + 1) % m); s++) b = (b + 1) % m;
      for (let s = 0; s < m && close((a + m - 1) % m); s++) a = (a + m - 1) % m;
      for (let i = a; ; i = (i + 1) % m) {
        gap[i] = 1;
        if (i === b) break;
      }
      const cut = (i: number, j: number) => {
        const si = side(i), sj = side(j), f = clamp((hw - si) / (sj - si || 1), 0, 1);
        return { x: vx[i] + (vx[j] - vx[i]) * f, y: vy[i] + (vy[j] - vy[i]) * f, f };
      };
      const fb = cut(b, (b + 1) % m), fa = cut(a, (a + m - 1) % m);
      cuts.push({ after: b, f: fb.f, x: fb.x, y: fb.y });
      cuts.push({ after: (a + m - 1) % m, f: 1 - fa.f, x: fa.x, y: fa.y });
    }
    const X: number[] = [], Y: number[] = [], W: number[] = [];
    for (let i = 0; i < m; i++) {
      X.push(vx[i]);
      Y.push(vy[i]);
      W.push(gap[i] ? 0 : 1);
      for (const c of cuts.filter((c) => c.after === i).sort((a, b) => a.f - b.f)) {
        X.push(c.x);
        Y.push(c.y);
        W.push(1);
      }
    }
    m = X.length;
    const ex = Float64Array.from(X), ey = Float64Array.from(Y);
    const [nx, ny] = normals(ex, ey, m, ccwOf(ex, ey, m));
    const s = new Float64Array(m);
    for (let i = 1; i < m; i++) s[i] = s[i - 1] + Math.hypot(ex[i] - ex[i - 1], ey[i] - ey[i - 1]);
    const e: Edge = {
      p, h: p.h, n: m, x: ex, y: ey, nx, ny, s, L: s[m - 1] + Math.hypot(ex[0] - ex[m - 1], ey[0] - ey[m - 1]), wall: Uint8Array.from(W),
      drop: new Float32Array(m), wf: new Float32Array(m), ah: new Float32Array(m), wa: new Float32Array(m), lip: new Float32Array(m),
      x0: Math.min(...X), x1: Math.max(...X), y0: Math.min(...Y), y1: Math.max(...Y), reach: LIP_W, rows: new Map(), grid: new Map(),
    };
    for (let i = 0; i < m; i++) {
      const j = (i + 1) % m;
      for (let r = Math.floor(Math.min(ey[i], ey[j]) / ROW); r <= Math.floor(Math.max(ey[i], ey[j]) / ROW); r++) {
        const list = e.rows.get(r);
        if (list) list.push(i);
        else e.rows.set(r, [i]);
      }
    }
    return e;
  }

  // How far each cliff drops (to the ground just out from it), the measures of its face and
  // scree from that, and the lookup of the outline's segments near each cell.
  private measure(e: Edge): void {
    let reach = LIP_W;
    for (let i = 0; i < e.n; i++) {
      if (!e.wall[i]) continue;
      const d = Math.max(0, e.h - this.core(e.x[i] + e.nx[i] * 120, e.y[i] + e.ny[i] * 120, false));
      const s = e.s[i], L = e.L, o = e.h * 0.37;
      e.drop[i] = d;
      e.wf[i] = faceW(d) * (0.8 + 0.4 * noiseL(s, L, 600, o));
      e.ah[i] = screeH(d) * (0.65 + 0.7 * noiseL(s, L, 430, o + 1));
      e.wa[i] = screeW(d) * (0.8 + 0.4 * noiseL(s, L, 520, o + 2));
      e.lip[i] = lipDrop(d);
      reach = Math.max(reach, e.wf[i] + e.wa[i]);
    }
    e.reach = Math.max(reach, 240) + 20; // (and at least as far as the ground's points are drawn onto the cliff: `place`)
    for (let i = 0; i < e.n; i++) {
      const j = (i + 1) % e.n;
      const i0 = Math.floor((Math.min(e.x[i], e.x[j]) - e.reach) / CELL), i1 = Math.floor((Math.max(e.x[i], e.x[j]) + e.reach) / CELL);
      const j0 = Math.floor((Math.min(e.y[i], e.y[j]) - e.reach) / CELL), j1 = Math.floor((Math.max(e.y[i], e.y[j]) + e.reach) / CELL);
      for (let a = i0; a <= i1; a++)
        for (let b = j0; b <= j1; b++) {
          const k = key(a, b), list = e.grid.get(k);
          if (list) list.push(i);
          else e.grid.set(k, [i]);
        }
    }
  }

  // the ground without plateaus: the hills
  base(x: number, y: number): number {
    let h = 0;
    for (const hl of this.spec.hills ?? []) {
      const d = Math.hypot(x - hl.x, y - hl.y);
      if (d < hl.r) h += hl.h * 0.5 * (1 + Math.cos((Math.PI * d) / hl.r));
    }
    return h;
  }

  // the ground under a plateau's ramp, off the plateau (a lower plateau or the hills)
  private below(x: number, y: number, e: Edge): number {
    let best: number | null = null;
    for (const o of this.edges) if (o !== e && o.h < e.h && (best === null || o.h > best) && inside(o, x, y)) best = o.h;
    return best ?? this.base(x, y);
  }

  // the ramps over ground `h`: each from its plateau's top down to whatever is at its foot,
  // banks falling away either side
  private ramped(x: number, y: number, h: number): number {
    for (const R of this.ramps) {
      const dx = x - R.r.top[0], dy = y - R.r.top[1];
      const a = (dx * R.ux + dy * R.uy) / R.len;
      if (a < -R.back || a > 1) continue;
      const over = Math.abs(-dx * R.uy + dy * R.ux) - R.r.width / 2;
      if (over > R.bank) continue;
      const t = Math.max(0, a);
      let v: number;
      if (R.level !== null) {
        if (over > 0) continue;
        v = R.e.h + (R.level - R.e.h) * t;
      } else {
        v = R.e.h + (this.below(x, y, R.e) - R.e.h) * ease(t);
        if (over > 0) v -= over * BANK;
      }
      if (v > h) h = v;
    }
    return h;
  }

  // the ground before the cliffs shape it: the highest plateau over a point (its grass rolling
  // over at the edges when `lip`), else the hills; and the ramps
  private core(x: number, y: number, lip: boolean): number {
    const es = this.edges;
    let top = -1;
    for (let k = 0; k < es.length; k++) {
      const e = es[k];
      const near = x > e.x0 - e.reach && x < e.x1 + e.reach && y > e.y0 - e.reach && y < e.y1 + e.reach;
      this.near[k] = near ? 1 : 0;
      this.ins[k] = near && inside(e, x, y) ? 1 : 0;
      if (this.ins[k] && (top < 0 || e.h > es[top].h)) top = k;
    }
    let h: number;
    if (top >= 0) {
      const e = es[top];
      h = e.h;
      if (lip && nearest(e, x, y) && Q.d < LIP_W && e.wall[Q.i] && e.wall[Q.j]) {
        const f = 1 - Q.d / LIP_W;
        h -= lerp(e.lip[Q.i], e.lip[Q.j], Q.t) * f * f;
      }
    } else h = this.base(x, y);
    return this.ramped(x, y, h);
  }

  height(x: number, y: number): number {
    const core = this.core(x, y, true);
    let h = core;
    // down each cliff near by (whose plateau the point is off): its face, then its scree
    const es = this.edges;
    for (let k = 0; k < es.length; k++) {
      const e = es[k];
      if (!this.near[k] || this.ins[k] || e.h <= core || !nearest(e, x, y)) continue;
      const i = Q.i, j = Q.j, t = Q.t, d = Q.d;
      if (!e.wall[i] || !e.wall[j]) continue;
      const wf = lerp(e.wf[i], e.wf[j], t), ah = lerp(e.ah[i], e.ah[j], t);
      let v: number;
      if (d < wf) {
        const top = e.h - lerp(e.lip[i], e.lip[j], t);
        v = top + (core + ah - top) * (d / wf);
      } else {
        const wa = lerp(e.wa[i], e.wa[j], t);
        if (d >= wf + wa) continue;
        const f = 1 - (d - wf) / wa;
        v = core + ah * f * f;
      }
      if (v > h) h = v;
    }
    return h;
  }

  // Where the ground mesh's point at (x, y) goes (the mesh's squares are `cell` across): onto the
  // top or the foot of a rock face when it is close to either (so the grass ends cleanly at the
  // edge and the face hides the slope between), onto the edge of a ramp's way when close to it;
  // and how much it is scree (0..1, the ground there takes a stony tint).
  place(x: number, y: number, cell: number): [number, number, number, number] {
    const es = this.edges;
    let best = Infinity, tx = x, ty = y, onTop = false;
    for (const e of es) {
      if (x < e.x0 - e.reach || x > e.x1 + e.reach || y < e.y0 - e.reach || y > e.y1 + e.reach || !nearest(e, x, y)) continue;
      const { i, j, t, d } = Q;
      if (!e.wall[i] || !e.wall[j]) continue;
      const wf = lerp(e.wf[i], e.wf[j], t);
      // the points this close to the top go onto it, those this close to the foot onto that,
      // those between (a face wider than the grid) stay on the straight line down; wide enough
      // that no edge of the grid jumps from the top past the foot (or from the flat top past
      // the edge onto the foot), which would show in front of the face
      const topMax = Math.min(wf / 2, 0.6 * cell), footMin = Math.max(wf / 2, wf - 0.6 * cell);
      const topMin = -Math.max(0.6 * cell, 1.45 * cell - topMax), footMax = Math.max(wf + 0.85 * cell, topMax + 1.45 * cell);
      if (d > footMax) continue;
      const sd = inside(e, x, y) ? -d : d;
      if (sd < topMin) continue;
      const qx = lerp(e.x[i], e.x[j], t), qy = lerp(e.y[i], e.y[j], t);
      let px: number, py: number, moved: number, top = false;
      if (sd < topMax) {
        [px, py, moved, top] = [qx, qy, Math.abs(sd), true];
      } else if (sd >= footMin) {
        let nx = lerp(e.nx[i], e.nx[j], t), ny = lerp(e.ny[i], e.ny[j], t);
        const nl = Math.hypot(nx, ny) || 1;
        nx /= nl;
        ny /= nl;
        [px, py, moved] = [qx + nx * wf, qy + ny * wf, Math.abs(wf - sd)];
      } else [px, py, moved] = [x, y, 0];
      // (not a cliff buried under higher ground)
      if (moved < best && this.core(qx, qy, false) <= e.h + 1) [best, tx, ty, onTop] = [moved, px, py, top];
    }
    if (best === Infinity)
      for (const R of this.ramps) {
        if (R.level !== null) continue;
        const dx = x - R.r.top[0], dy = y - R.r.top[1];
        const a = (dx * R.ux + dy * R.uy) / R.len;
        if (a < 0 || a > 1) continue;
        const sd = -dx * R.uy + dy * R.ux, off = Math.abs(sd) - R.r.width / 2;
        if (Math.abs(off) > 0.5 * cell) continue;
        const k = Math.sign(sd) * off;
        tx = x + R.uy * k;
        ty = y - R.ux * k;
        break;
      }
    return [tx, ty, this.height(tx, ty), onTop ? 0 : this.scree(tx, ty)];
  }

  // how much the ground at a point is a cliff's scree: all of it at the foot of the face, less
  // further out, more where it heaps higher
  private scree(x: number, y: number): number {
    let w = 0;
    for (const e of this.edges) {
      if (x < e.x0 - e.reach || x > e.x1 + e.reach || y < e.y0 - e.reach || y > e.y1 + e.reach || !nearest(e, x, y)) continue;
      const { i, j, t, d } = Q;
      if (!e.wall[i] || !e.wall[j]) continue;
      const wf = lerp(e.wf[i], e.wf[j], t), wa = lerp(e.wa[i], e.wa[j], t);
      if (d >= wf + wa || inside(e, x, y)) continue;
      const f = d <= wf ? 1 : 1 - (d - wf) / wa;
      w = Math.max(w, Math.pow(f, 1.3) * clamp(lerp(e.ah[i], e.ah[j], t) / 30, 0, 1));
    }
    return w;
  }

  // whether a point is on ground walled in by cliffs with no way up (the highest plateau
  // under it, or one it stands in, has no ramp)
  walledOff(x: number, y: number): boolean {
    return this.edges.some((e) => !e.p.ramps?.length && inside(e, x, y));
  }

  // the highest the ground goes (or a little over)
  top(): number {
    const hills = (this.spec.hills ?? []).reduce((t, h) => t + Math.max(0, h.h), 0);
    return Math.max(0, ...(this.spec.plateaus ?? []).map((p) => p.h)) + hills;
  }

  // whether the ground within r of (x, y) is level enough to stand a thing on (no cliff, no
  // ramp): no more than a gentle slope across it
  level(x: number, y: number, r: number): boolean {
    // not on a ramp (or its walls)
    for (const R of this.ramps) {
      const dx = x - R.r.top[0], dy = y - R.r.top[1];
      const t = (dx * R.ux + dy * R.uy) / R.len, side = Math.abs(-dx * R.uy + dy * R.ux);
      if (t > -r / R.len && t < 1 + r / R.len && side < R.r.width / 2 + 70 + r) return false;
    }
    const h = this.height(x, y);
    return [[r, 0], [-r, 0], [0, r], [0, -r], [r * 0.7, r * 0.7], [-r * 0.7, -r * 0.7], [r * 0.7, -r * 0.7], [-r * 0.7, r * 0.7]]
      .every(([dx, dy]) => Math.abs(this.height(x + dx, y + dy) - h) < 25 + r * 0.25);
  }

  // the stretches of an edge's outline where `ok` holds for every point, as runs of point
  // indices (a whole loop ends on its first point again)
  private runs(e: Edge, ok: (i: number) => boolean): number[][] {
    const n = e.n, out: number[][] = [];
    let start = -1;
    for (let i = 0; i < n; i++) if (!ok(i)) start = i;
    if (start < 0) return [[...Array.from({ length: n }, (_, i) => i), 0]];
    let run: number[] = [];
    for (let s = 1; s <= n; s++) {
      const i = (start + s) % n;
      if (ok(i)) run.push(i);
      else {
        if (run.length > 1) out.push(run);
        run = [];
      }
    }
    if (run.length > 1) out.push(run);
    return out;
  }

  // The cliffs: each stretch of outline that is a rock face, with its top and outward side.
  cliffs(): { a: XY; b: XY; top: number; out: XY; plateau: Plateau }[] {
    const out: { a: XY; b: XY; top: number; out: XY; plateau: Plateau }[] = [];
    for (const e of this.edges)
      for (const run of this.runs(e, (i) => e.wall[i] === 1)) {
        const a = run[0], b = run[run.length - 1], m = run[run.length >> 1];
        out.push({ a: [e.x[a], e.y[a]], b: [e.x[b], e.y[b]], top: e.h, out: [e.nx[m], e.ny[m]], plateau: e.p });
      }
    return out;
  }

  // Solids along the cliffs (from just inside the edge out to the foot of the face, in straight
  // pieces that keep within a few cm of the outline), and along both sides of every ramp.
  solids(): SolidSpec[] {
    const out: SolidSpec[] = [];
    const box = (ax: number, ay: number, bx: number, by: number, inner: number, outer: number, nx: number, ny: number, extend: number) => {
      const len = Math.hypot(bx - ax, by - ay);
      if (len < 10) return;
      const c = (outer - inner) / 2;
      out.push({ kind: "cliff", x: (ax + bx) / 2 + nx * (inner + c), y: (ay + by) / 2 + ny * (inner + c), w: len + extend, d: outer - inner, rot: (Math.atan2(by - ay, bx - ax) * 180) / Math.PI });
    };
    for (const e of this.edges) {
      const ccw = ccwOf(e.x, e.y, e.n), sgn = ccw ? 1 : -1;
      for (const run of this.runs(e, (i) => e.wall[i] === 1)) {
        // simplify: keep a point where the outline strays more than 14 cm from the straight line
        const keep = new Uint8Array(run.length);
        keep[0] = keep[run.length - 1] = 1;
        const stack: [number, number][] = [[0, run.length - 1]];
        while (stack.length) {
          const [a, b] = stack.pop()!;
          const ax = e.x[run[a]], ay = e.y[run[a]], dx = e.x[run[b]] - ax, dy = e.y[run[b]] - ay, L = Math.hypot(dx, dy);
          let far = -1, fd = 14;
          for (let k = a + 1; k < b; k++) {
            const px = e.x[run[k]] - ax, py = e.y[run[k]] - ay;
            const d = L > 1 ? Math.abs(px * dy - py * dx) / L : Math.hypot(px, py);
            if (d > fd) [fd, far] = [d, k];
          }
          if (far < 0 && L > 1200 && b - a > 1) far = (a + b) >> 1; // (no very long pieces)
          if (far >= 0) {
            keep[far] = 1;
            stack.push([a, far], [far, b]);
          }
        }
        let prev = 0;
        for (let k = 1; k < run.length; k++) {
          if (!keep[k]) continue;
          const ia = run[prev], ib = run[k];
          let wf = 0;
          for (let q = prev; q <= k; q++) wf = Math.max(wf, e.wf[run[q]]);
          const dx = e.x[ib] - e.x[ia], dy = e.y[ib] - e.y[ia], L = Math.hypot(dx, dy) || 1;
          box(e.x[ia], e.y[ia], e.x[ib], e.y[ib], -35, Math.max(35, wf + 10), (sgn * dy) / L, (-sgn * dx) / L, 20);
          prev = k;
        }
      }
    }
    for (const R of this.ramps)
      for (const s of [-1, 1]) {
        const ox = -R.uy * s * (R.r.width / 2 + 35), oy = R.ux * s * (R.r.width / 2 + 35);
        const [tx, ty] = R.r.top;
        // the side walls stop short of the foot, where the ramp meets the ground
        box(tx + ox, ty + oy, tx + R.ux * R.len * 0.8 + ox, ty + R.uy * R.len * 0.8 + oy, -35, 35, 0, 0, 0);
      }
    return out;
  }

  // The rock faces: down every cliff from its top to its foot in bands that bulge out and pull
  // in, leaning back a little; the scree's boulders and stones at the foot.
  faces(): THREE.Mesh {
    const pos: number[] = [], uv: number[] = [], shade: number[] = [], idx: number[] = [];
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const cap = capOf(this.spec.rock ?? "CliffRock");
    const vert = (x: number, y: number, z: number, u: number, v: number, sh: number) => {
      pos.push(x, z, -y);
      uv.push(u, v);
      shade.push(sh);
      return pos.length / 3 - 1;
    };
    const stones: { x: number; y: number; s: number; detail: number }[] = []; // (detail -1: a small flat stone)
    for (const e of this.edges) {
      for (const run of this.runs(e, (i) => e.wall[i] === 1 && e.drop[i] >= 6)) {
        const fine = run.some((i) => this.inDetail(e.x[i], e.y[i]));
        const maxDrop = Math.max(...run.map((i) => e.drop[i]));
        const bands = fine ? clamp(Math.round(maxDrop / 170), 1, 3) : 1, rows = bands * 2 + 1;
        const first = pos.length / 3;
        let sAcc = 0, nextStone = 120 + rnd() * 200, su = e.s[run[0]];
        const L = e.L, o = e.h * 0.37;
        for (let c = 0; c < run.length; c++) {
          const i = run[c], s = e.s[i]; // (s for the shape, the same all round; su for the texture)
          if (c > 0) su += Math.hypot(e.x[i] - e.x[run[c - 1]], e.y[i] - e.y[run[c - 1]]);
          const x = e.x[i], y = e.y[i], nx = e.nx[i], ny = e.ny[i], wf = e.wf[i];
          const top = e.h - e.lip[i];
          const foot = Math.min(top, this.height(x + nx * wf, y + ny * wf));
          const dh = top - foot;
          // the bands' seams (wavering), the bulges between them
          const us: number[] = [0];
          for (let b = 1; b < bands; b++) us.push(b / bands + (noiseL(s, L, 520, o + 3 + b) - 0.5) * (0.32 / bands));
          us.push(1);
          const B = Math.min(48, 8 + 0.12 * dh) * (0.55 + 0.7 * noiseL(s, L, 700, o + 9));
          for (let r = 0; r < rows; r++) {
            const b = r >> 1, seam = r % 2 === 0;
            let u: number, off: number, z: number, sh: number;
            if (r === 0) [u, off, z] = [0, 0, top];
            else if (r === rows - 1) [u, off, z] = [1, wf + 8, foot - 10];
            else {
              u = seam ? us[b] : (us[b] + us[b + 1]) / 2 + (noiseL(s, L, 330, o + 13 + b) - 0.5) * (0.12 / bands);
              const block = 0.35 + 0.65 * smoothstep(0.2, 0.8, noiseL(s, L, 210, o + 19 + b));
              const bulge = seam ? 10 + 0.12 * B * noiseL(s, L, 150, o + 29 + b) : 10 + B * block * (1 - 0.6 * smoothstep(0.6, 1, u));
              off = u * wf + Math.min(bulge, (1 - u) * wf + 10);
              z = top - dh * u;
            }
            // darker down the face and in the seams, each band its own shade
            sh = (1.1 - 0.36 * Math.pow(u, 1.4)) * (0.88 + 0.2 * noiseL(s, L, 1100, o + 37 + b)) * (seam && r > 0 && r < rows - 1 ? 0.74 : 1);
            vert(x + nx * off, y + ny * off, z, su / 400, z / 330, r === 0 ? -sh : sh); // (negative: the very top, capped)
          }
          // boulders and stones heaped at the foot, more where the scree is high
          sAcc = c > 0 ? sAcc + Math.hypot(x - e.x[run[c - 1]], y - e.y[run[c - 1]]) : 0;
          if (fine && dh > 40 && sAcc >= nextStone && this.inDetail(x, y)) {
            nextStone = sAcc + (260 + rnd() * 380) * (1.3 - Math.min(1, e.ah[i] / 45) * 0.5);
            const S = clamp(0.16 * dh + 20, 28, 95) * (0.7 + rnd() * 0.5);
            const along = (rnd() - 0.5) * 60, lx = -ny, ly = nx;
            const d0 = wf + S * (-0.15 + 0.25 * rnd()); // (into the face's foot, not out where people walk)
            stones.push({ x: x + nx * d0 + lx * along, y: y + ny * d0 + ly * along, s: S, detail: S > 50 && rnd() < 0.35 ? 1 : 0 });
            for (let q = 0, nq = rnd() < 0.45 ? 2 : 1; q < nq; q++) {
              const d1 = wf + S * 0.3 + rnd() * (e.wa[i] * 0.6), a1 = along + (rnd() - 0.5) * 2.4 * S;
              stones.push({ x: x + nx * d1 + lx * a1, y: y + ny * d1 + ly * a1, s: S * (0.25 + rnd() * 0.25), detail: -1 });
            }
          }
        }
        // a heap of boulders where the face meets a ramp's bank (each end of a run that is not a loop)
        if (fine && run[0] !== run[run.length - 1])
          for (const c of [Math.min(2, run.length - 1), Math.max(0, run.length - 3)]) {
            const i = run[c], x = e.x[i], y = e.y[i], nx = e.nx[i], ny = e.ny[i], wf = e.wf[i];
            if (!this.inDetail(x, y) || e.drop[i] < 60) continue;
            const S = clamp(0.14 * e.drop[i] + 25, 35, 90);
            for (let q = 0; q < 3; q++) {
              const d = wf * (0.7 + 0.5 * rnd()), a = (rnd() - 0.5) * 120;
              stones.push({ x: x + nx * d - ny * a, y: y + ny * d + nx * a, s: S * (q ? 0.45 + 0.3 * rnd() : 1), detail: q ? -1 : 1 });
            }
          }
        // the faces between columns, wound to face out
        const cols = run.length;
        const p = (c: number, r: number) => first + c * rows + r;
        const P = (k: number) => new THREE.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
        const mid = run[cols >> 1];
        const ref = new THREE.Vector3(e.nx[mid], 0, -e.ny[mid]);
        const c0 = Math.max(0, (cols >> 1) - 1);
        const nrm = new THREE.Vector3().crossVectors(P(p(c0, 1)).sub(P(p(c0, 0))), P(p(c0 + 1, 0)).sub(P(p(c0, 0))));
        const flip = nrm.dot(ref) < 0;
        for (let c = 0; c + 1 < cols; c++)
          for (let r = 0; r + 1 < rows; r++) {
            const a = p(c, r), b = p(c, r + 1), cc = p(c + 1, r), d = p(c + 1, r + 1);
            if (flip) idx.push(a, cc, b, b, cc, d);
            else idx.push(a, b, cc, b, d, cc);
          }
      }
    }
    // the stones: rough rocks half sunk in the scree
    let k = 0;
    for (const st of stones) {
      const big = st.detail >= 0;
      const sz = big ? [st.s * (0.9 + rnd() * 0.5), st.s * (0.8 + rnd() * 0.4), st.s * (0.55 + rnd() * 0.35)] : [st.s * (0.9 + rnd() * 0.4), st.s * (0.8 + rnd() * 0.4), st.s * (0.5 + rnd() * 0.3)];
      const g = rock(sz as [number, number, number], big ? 0.45 : 0.5, 31 + k++ * 7, "x", !big, Math.max(0, st.detail))[0].geo;
      const a = rnd() * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      const z0 = this.height(st.x, st.y) - sz[2] * 0.3;
      const gp = g.getAttribute("position"), gu = g.getAttribute("uv");
      const base = pos.length / 3;
      for (let v = 0; v < gp.count; v++) {
        const lx = gp.getX(v), ly = gp.getY(v), lz = gp.getZ(v);
        const wx = st.x + lx * ca - ly * sa, wy = st.y + lx * sa + ly * ca, wz = z0 + lz;
        pos.push(wx, wz, -wy);
        uv.push(gu.getX(v), gu.getY(v));
        shade.push(0.72 + 0.3 * clamp(lz / sz[2], 0, 1));
      }
      for (let v = 0; v < gp.count; v++) idx.push(base + v);
      g.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    // colours: the shade, and the cap's colour where the rock faces up (and along the very top)
    const nor = geo.getAttribute("normal"), col = new Float32Array(shade.length * 3);
    for (let v = 0; v < shade.length; v++) {
      const sh = Math.abs(shade[v]), up = nor.getY(v);
      const m = Math.max(shade[v] < 0 ? cap.k * 0.9 : 0, smoothstep(cap.from, cap.to, up) * cap.k);
      for (let c = 0; c < 3; c++) col[v * 3 + c] = sh * lerp(1, cap.c[c], m);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = material(this.spec.rock ?? "CliffRock").clone();
    mat.side = THREE.DoubleSide;
    mat.vertexColors = true;
    mat.map = strata();
    if (mat.bumpMap) mat.bumpMap = mat.map;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // A grid of heights over a box for the game to read every frame: bilinear between cells.
  // `k` scales it to the world (TOWN_SCALE): the returned function takes world centimetres;
  // its `max` is the highest it goes.
  sampler(box: { minX: number; maxX: number; minY: number; maxY: number }, k: number, cell = 25): ((x: number, y: number) => number) & { max: number } {
    const W = Math.ceil((box.maxX - box.minX) / cell) + 2, H = Math.ceil((box.maxY - box.minY) / cell) + 2;
    const g = new Float32Array(W * H);
    let max = 0;
    for (let j = 0; j < H; j++)
      for (let i = 0; i < W; i++) max = Math.max(max, (g[j * W + i] = this.height(box.minX + i * cell, box.minY + j * cell)));
    const at = (wx: number, wy: number) => {
      const fx = (wx / k - box.minX) / cell, fy = (wy / k - box.minY) / cell;
      const i = Math.max(0, Math.min(W - 2, Math.floor(fx))), j = Math.max(0, Math.min(H - 2, Math.floor(fy)));
      const u = Math.max(0, Math.min(1, fx - i)), v = Math.max(0, Math.min(1, fy - j));
      const a = g[j * W + i], b = g[j * W + i + 1], c = g[(j + 1) * W + i], d = g[(j + 1) * W + i + 1];
      return k * (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v);
    };
    return Object.assign(at, { max: max * k });
  }
}
