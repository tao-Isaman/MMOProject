// Ground that is not flat: hills (smooth rises you can walk over), plateaus (raised ground with
// a rock face round the edge you cannot climb) and ramps (the ways up a plateau). In the
// level's own coordinates (centimetres, before TOWN_SCALE), Z up.
//
// `height` is exact (built into the ground mesh and used to stand every piece on the ground);
// the game reads a grid of it (`sampler`) every frame. The cliffs come out as rock faces (a
// mesh) and as thin solids along the edges, so nobody walks off or up them; a ramp leaves its
// stretch of edge open and is walled along its sides.

import * as THREE from "three";
import type { SolidSpec } from "../world";
import type { Poly } from "./paved";
import { material } from "./textures";

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
}

function inside(poly: Poly, x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// where along a -> b (0..1) and how far to the side of it a point lies
function along(a: XY, b: XY, x: number, y: number): { t: number; side: number; len: number } {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
  const t = ((x - a[0]) * dx + (y - a[1]) * dy) / (len * len);
  const side = (-(x - a[0]) * dy + (y - a[1]) * dx) / len;
  return { t, side, len };
}

export class Terrain {
  spec: TerrainSpec;

  constructor(spec: TerrainSpec) {
    this.spec = spec;
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

  // the height of the plateaus round a point, ignoring their ramps (null: none)
  private plateauAt(x: number, y: number): number | null {
    let best: number | null = null;
    for (const p of this.spec.plateaus ?? []) if (inside(p.poly, x, y) && (best === null || p.h > best)) best = p.h;
    return best;
  }

  height(x: number, y: number): number {
    const t = this.plateauAt(x, y);
    let h = t ?? this.base(x, y);
    // ramps: from the plateau's top down to whatever is at their foot
    for (const p of this.spec.plateaus ?? [])
      for (const r of p.ramps ?? []) {
        const a = along(r.top, r.bottom, x, y);
        if (a.t < 0 || a.t > 1 || Math.abs(a.side) > r.width / 2) continue;
        const foot = this.below(r.bottom[0], r.bottom[1], p);
        const v = p.h + (foot - p.h) * a.t;
        if (a.t > 0.02 || t === null) h = Math.max(t === null ? -Infinity : h, v);
        if (t === null) h = Math.max(this.base(x, y), v);
      }
    return h;
  }

  // whether a point is on ground walled in by cliffs with no way up (the highest plateau
  // under it, or one it stands in, has no ramp)
  walledOff(x: number, y: number): boolean {
    return (this.spec.plateaus ?? []).some((p) => !p.ramps?.length && inside(p.poly, x, y));
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
    for (const p of this.spec.plateaus ?? [])
      for (const rp of p.ramps ?? []) {
        const a = along(rp.top, rp.bottom, x, y);
        if (a.t > -r / a.len && a.t < 1 + r / a.len && Math.abs(a.side) < rp.width / 2 + 70 + r) return false;
      }
    const h = this.height(x, y);
    return [[r, 0], [-r, 0], [0, r], [0, -r], [r * 0.7, r * 0.7], [-r * 0.7, -r * 0.7], [r * 0.7, -r * 0.7], [-r * 0.7, r * 0.7]]
      .every(([dx, dy]) => Math.abs(this.height(x + dx, y + dy) - h) < 25 + r * 0.25);
  }

  // the ground under a plateau's edge, outside it (a lower plateau or the hills)
  private below(x: number, y: number, p: Plateau): number {
    let best: number | null = null;
    for (const q of this.spec.plateaus ?? []) if (q !== p && q.h < p.h && inside(q.poly, x, y) && (best === null || q.h > best)) best = q.h;
    return best ?? this.base(x, y);
  }

  // The edges that are cliffs (not where a ramp goes up), each with its top and the ground
  // below it, and the outward normal.
  cliffs(): { a: XY; b: XY; top: number; out: XY; plateau: Plateau }[] {
    const out: { a: XY; b: XY; top: number; out: XY; plateau: Plateau }[] = [];
    for (const p of this.spec.plateaus ?? []) {
      const n = p.poly.length;
      for (let i = 0; i < n; i++) {
        const a = p.poly[i], b = p.poly[(i + 1) % n];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (len < 1) continue;
        const ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len;
        // the outward side: the normal whose point is not inside
        let nx = -uy, ny = ux;
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        if (inside(p.poly, mx + nx * 20, my + ny * 20)) {
          nx = -nx;
          ny = -ny;
        }
        // cut out where the ramps cross this edge
        const gaps: [number, number][] = [];
        for (const r of p.ramps ?? []) {
          const s = (r.top[0] - a[0]) * ux + (r.top[1] - a[1]) * uy;
          const off = Math.abs(-(r.top[0] - a[0]) * uy + (r.top[1] - a[1]) * ux);
          if (off < 60 && s > -r.width / 2 && s < len + r.width / 2) gaps.push([s - r.width / 2, s + r.width / 2]);
        }
        gaps.sort((g, h) => g[0] - h[0]);
        let from = 0;
        for (const [g0, g1] of [...gaps, [len, len] as [number, number]]) {
          const s0 = from, s1 = Math.min(len, g0);
          if (s1 - s0 > 10) out.push({ a: [a[0] + ux * s0, a[1] + uy * s0], b: [a[0] + ux * s1, a[1] + uy * s1], top: p.h, out: [nx, ny], plateau: p });
          from = Math.max(from, g1);
        }
      }
    }
    return out;
  }

  // Thin solids along the cliffs, and along both sides of every ramp.
  solids(): SolidSpec[] {
    const out: SolidSpec[] = [];
    const wall = (a: XY, b: XY) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 10) return;
      out.push({ kind: "cliff", x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, w: len, d: 70, rot: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI });
    };
    for (const c of this.cliffs()) wall(c.a, c.b);
    for (const p of this.spec.plateaus ?? [])
      for (const r of p.ramps ?? []) {
        const { len } = along(r.top, r.bottom, 0, 0);
        const ux = (r.bottom[0] - r.top[0]) / len, uy = (r.bottom[1] - r.top[1]) / len;
        for (const s of [-1, 1]) {
          const ox = -uy * s * (r.width / 2 + 35), oy = ux * s * (r.width / 2 + 35);
          // the side walls stop short of the foot, where the ramp meets the ground
          wall([r.top[0] + ox, r.top[1] + oy], [r.top[0] + ux * len * 0.8 + ox, r.top[1] + uy * len * 0.8 + oy]);
        }
      }
    return out;
  }

  // The rock faces: a strip down every cliff from its top to the ground below, a little
  // ragged and leaning out at the foot (it hides the ground mesh's slope at the edge), and
  // down both sides of every ramp.
  faces(): THREE.Mesh {
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const strip = (a: XY, b: XY, top: (x: number, y: number) => number, foot: (x: number, y: number) => number, out: XY) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const n = Math.max(1, Math.round(len / 90));
      const base = pos.length / 3;
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
        const j = i === 0 || i === n ? 0 : (rnd() - 0.5) * 50;
        const ht = top(x, y), hf = foot(x + out[0] * 80, y + out[1] * 80) - 25;
        const lean = 45 + Math.max(0, ht - hf) * 0.12;
        // top edge on the line, a ragged middle, the foot leaning out
        const mid = (ht + hf) / 2;
        pos.push(x, ht, -y);
        pos.push(x + out[0] * (lean * 0.45 + j * 0.4), mid + j * 0.3, -(y + out[1] * (lean * 0.45 + j * 0.4)));
        pos.push(x + out[0] * lean, hf, -(y + out[1] * lean));
        const u = (t * len) / 300;
        uv.push(u, ht / 300, u, mid / 300, u, hf / 300);
      }
      for (let i = 0; i < n; i++) {
        const k = base + i * 3;
        for (const [p, q] of [[0, 1], [1, 2]]) {
          idx.push(k + p, k + q, k + 3 + p);
          idx.push(k + q, k + 3 + q, k + 3 + p);
        }
      }
    };
    for (const c of this.cliffs()) strip(c.a, c.b, () => c.top, (x, y) => this.height(x, y), c.out);
    for (const p of this.spec.plateaus ?? [])
      for (const r of p.ramps ?? []) {
        const { len } = along(r.top, r.bottom, 0, 0);
        const ux = (r.bottom[0] - r.top[0]) / len, uy = (r.bottom[1] - r.top[1]) / len;
        for (const s of [-1, 1]) {
          const nx = -uy * s, ny = ux * s, ox = nx * (r.width / 2), oy = ny * (r.width / 2);
          const a: XY = [r.top[0] + ox, r.top[1] + oy], b: XY = [r.bottom[0] + ox, r.bottom[1] + oy];
          // its top follows the ramp down; mind the winding so the face looks out
          const pts: [XY, XY] = s > 0 ? [a, b] : [a, b];
          strip(pts[0], pts[1], (x, y) => this.height(x - nx * 30, y - ny * 30), (x, y) => this.base(x, y), [nx, ny]);
        }
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mat = material(this.spec.rock ?? "CliffRock").clone();
    mat.side = THREE.DoubleSide;
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
