// Natural props shared by the field kits: fallen trunks with a torn-up root plate or a splintered
// end, stumps on spreading roots with a ringed saw cut or a broken crown of splinters, bare trees,
// and a cover of moss, snow, sand or ash settled on whatever faces up (rocks too: geo.ts rock).
// A kit gives the materials; Z up, centimetres, standing on z = 0 like every kit item.
//
// The bark is ridged and coloured by the light it gets (dark underneath and at the foot, paler on
// top, grey-green lichen here and there); fallen trunks have patches where the bark has peeled off
// the pale wood; a saw cut keeps its rim of bark and dries into cracks; pebbles lie at the foot.

import * as THREE from "three";
import { merge, noise3, sphereCenter, translate, scale, rock, paint } from "./geo";
import type { Geo, V3 } from "./geo";
import { limb, grow, lump } from "./trees";
import { defineMaterial } from "./textures";

function rng(seed: number): () => number {
  let s = (Math.imul(seed + 1, 2654435761) >>> 0) || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

// The end-grain material of a wood colour: rings, pith and cracks (textures.ts endgrain), the
// whole map across one cut face.
export function endGrain(tint: string): string {
  const name = `EndGrain_${tint.replace("#", "")}`;
  defineMaterial(name, { map: "endgrain", tint, bump: 1.2 });
  return name;
}

// ---- a cover on what faces up ----
// Moss, snow, sand or ash on the faces of `g` that look up: `amount` 0..1 how far down the sides
// it reaches (ragged at its edge), `thick` cm it stands proud of the surface. Its corners move
// along the surface's smoothed normal, so the patch stays whole.
// `patches` (0..1) keeps only that share of it, in clumps (moss along a log's back).
// `where(x, y, z, nz)` picks the faces instead (bark peeled off in patches, not only on top).
// The cover is lighter and darker in soft patches, and thinner (darker) at its edge.
export function coverTop(g: Geo, mat: string, o: { amount?: number; thick?: number; seed?: number; ragged?: number; grain?: number; patches?: number; where?: (x: number, y: number, z: number, nz: number) => boolean } = {}): Geo {
  const amount = o.amount ?? 0.5, thick = o.thick ?? 2, seed = o.seed ?? 1, ragged = o.ragged ?? 0.32, grain = o.grain ?? 38;
  const out: number[] = [], normals: number[] = [], colours: number[] = [];
  const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), N = new THREE.Vector3(), E = new THREE.Vector3();
  const key = (v: THREE.Vector3) => `${Math.round(v.x * 4)},${Math.round(v.y * 4)},${Math.round(v.z * 4)}`;
  for (const part of g) {
    const pos = part.geo.getAttribute("position"), idx = part.geo.index, nor = part.geo.getAttribute("normal");
    const tris = (idx ? idx.count : pos.count) / 3;
    const corner = (t: number, k: number) => (idx ? idx.getX(t * 3 + k) : t * 3 + k);
    // smoothed normals by position, from every face of the part
    const smooth = new Map<string, THREE.Vector3>();
    const faces: { i: number[]; n: THREE.Vector3 }[] = [];
    for (let t = 0; t < tris; t++) {
      const i = [corner(t, 0), corner(t, 1), corner(t, 2)];
      A.fromBufferAttribute(pos, i[0]);
      B.fromBufferAttribute(pos, i[1]);
      C.fromBufferAttribute(pos, i[2]);
      const n = new THREE.Vector3().subVectors(B, A).cross(E.subVectors(C, A));
      if (n.lengthSq() < 1e-9) continue;
      n.normalize();
      // the way the surface faces (the mesh's own normals say outward)
      if (nor) {
        N.fromBufferAttribute(nor, i[0]).add(E.fromBufferAttribute(nor, i[1])).add(E.fromBufferAttribute(nor, i[2]));
        if (N.dot(n) < 0) {
          n.negate();
          [i[1], i[2]] = [i[2], i[1]];
        }
      }
      faces.push({ i, n });
      for (const v of i) {
        A.fromBufferAttribute(pos, v);
        const k = key(A), s = smooth.get(k);
        if (s) s.add(n);
        else smooth.set(k, n.clone());
      }
    }
    for (const f of faces) {
      A.fromBufferAttribute(pos, f.i[0]);
      B.fromBufferAttribute(pos, f.i[1]);
      C.fromBufferAttribute(pos, f.i[2]);
      const cx = (A.x + B.x + C.x) / 3, cy = (A.y + B.y + C.y) / 3, cz = (A.z + B.z + C.z) / 3;
      const edge = 1 - amount * 1.15 + ragged * (noise3(cx / grain, cy / grain, cz / grain, seed) - 0.5) * 2;
      if (o.where ? !o.where(cx, cy, cz, f.n.z) : f.n.z < edge) continue;
      if (o.patches !== undefined && noise3(cx / (grain * 1.6) + 11, cy / (grain * 1.6), cz / (grain * 1.6), seed + 1) < 1 - o.patches) continue;
      const shade = (0.8 + 0.4 * noise3(cx / (grain * 0.5), cy / (grain * 0.5), cz / (grain * 0.5), seed + 3)) * (o.where ? 1 : Math.min(1, 0.74 + (f.n.z - edge) * 1.6));
      for (const v of f.i) {
        colours.push(shade, shade, shade);
        A.fromBufferAttribute(pos, v);
        const s = smooth.get(key(A))!.clone().normalize();
        // a cushion, thicker in clumps (the same at a shared corner, so it stays whole)
        const t = thick * (0.55 + 0.9 * noise3(A.x / (grain * 0.35), A.y / (grain * 0.35), A.z / (grain * 0.35), seed + 7));
        out.push(A.x + s.x * t * 0.6, A.y + s.y * t * 0.6, A.z + s.z * t * 0.6 + t * 0.5);
        // soft-shaded, a blanket over the facets
        const up = s.clone().add(new THREE.Vector3(0, 0, 0.6)).normalize();
        normals.push(up.x, up.y, up.z);
      }
    }
  }
  if (!out.length) return [];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  const uv = new Float32Array((out.length / 3) * 2);
  for (let i = 0; i < out.length / 3; i++) {
    uv[i * 2] = out[i * 3] / 100;
    uv[i * 2 + 1] = out[i * 3 + 1] / 100;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));
  return [{ geo, mat }];
}

// ---- bark ----
// Bark in ridges: every other corner round each ring of a limb (trees.ts: rings of seg + 1
// corners) sinks `depth` of the way to the ring's middle; the normals are made again, the two
// corners on the seam sharing one.
function flute(g: Geo, seg: number, depth: number): void {
  const geo = g[0].geo, pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const rings = pos.count / (seg + 1), p = new THREE.Vector3(), c = new THREE.Vector3();
  for (let k = 0; k < rings; k++) {
    c.set(0, 0, 0);
    for (let j = 0; j < seg; j++) c.add(p.fromBufferAttribute(pos, k * (seg + 1) + j));
    c.multiplyScalar(1 / seg);
    for (let j = 1; j < seg; j += 2) {
      p.fromBufferAttribute(pos, k * (seg + 1) + j).lerp(c, depth);
      pos.setXYZ(k * (seg + 1) + j, p.x, p.y, p.z);
    }
  }
  geo.computeVertexNormals();
  const nor = geo.getAttribute("normal") as THREE.BufferAttribute, n = new THREE.Vector3(), m = new THREE.Vector3();
  for (let k = 0; k < rings; k++) {
    const a = k * (seg + 1), b = a + seg;
    n.fromBufferAttribute(nor, a).add(m.fromBufferAttribute(nor, b)).normalize();
    nor.setXYZ(a, n.x, n.y, n.z);
    nor.setXYZ(b, n.x, n.y, n.z);
  }
}
// Bark coloured by the light it gets: darker underneath and toward the ground (`low` cm and
// below), paler up to `high`, blotches, and grey-green lichen here and there.
function barkShade(g: Geo, seed: number, low: number, high: number): Geo {
  return paint(g, (p, n) => {
    const h = Math.min(1, Math.max(0, (p.z - low) / Math.max(1, high - low)));
    const v = 0.7 + 0.2 * h + 0.13 * n.z + (noise3(p.x / 55, p.y / 55, p.z / 55, seed) - 0.5) * 0.18;
    const lichen = n.z > -0.2 && noise3(p.x / 26 + 5, p.y / 26, p.z / 26, seed + 2) > 0.7;
    return lichen ? [v * 1.12, v * 1.16, v * 1.04] : [v, v * 0.98, v * 0.95];
  });
}

// Pebbles at the foot of something: `n` little stones round an ellipse (rx, ry) about `at`.
export const PEBBLE = "Nature_Pebble";
defineMaterial(PEBBLE, { map: "crag", tint: "#9c978c", bump: 2 });
export function pebbles(seed: number, at: [number, number], rx: number, ry: number, n: number, size = 14, mat = PEBBLE): Geo {
  const rnd = rng(seed), out: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, d = 1 + rnd() * 0.45, sz = size * (0.5 + rnd());
    out.push(translate(rock([sz, sz * (0.7 + rnd() * 0.3), sz * 0.6], 0.4, seed * 13 + i, mat, true, 0), [at[0] + Math.cos(a) * rx * d, at[1] + Math.sin(a) * ry * d, -sz * 0.12]));
  }
  return merge(...out);
}

// ---- the ends of a limb ----
// The first or last ring of a limb (trees.ts: rings of seg + 1 corners, in order).
interface Ring {
  pts: THREE.Vector3[];
  c: THREE.Vector3; // its middle
  n: THREE.Vector3; // out of the limb
  r: number;
}
function ringOf(g: Geo, seg: number, which: "start" | "end"): Ring {
  const pos = g[0].geo.getAttribute("position");
  const rings = pos.count / (seg + 1);
  const at = (k: number) => Array.from({ length: seg }, (_, j) => new THREE.Vector3().fromBufferAttribute(pos, k * (seg + 1) + j));
  const mid = (ps: THREE.Vector3[]) => ps.reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(1 / ps.length);
  const k = which === "start" ? 0 : rings - 1, k2 = which === "start" ? 1 : rings - 2;
  const pts = at(k), c = mid(pts), n = c.clone().sub(mid(at(k2))).normalize();
  return { pts, c, n, r: Math.max(...pts.map((p) => p.distanceTo(c))) };
}
// Move the corners of a limb's end ring (a slanted saw cut, a jagged break).
function editRing(g: Geo, seg: number, which: "start" | "end", fn: (p: THREE.Vector3, j: number) => void): void {
  const pos = g[0].geo.getAttribute("position") as THREE.BufferAttribute;
  const rings = pos.count / (seg + 1), k = which === "start" ? 0 : rings - 1, p = new THREE.Vector3();
  for (let j = 0; j <= seg; j++) {
    p.fromBufferAttribute(pos, k * (seg + 1) + j);
    fn(p, j % seg);
    pos.setXYZ(k * (seg + 1) + j, p.x, p.y, p.z);
  }
  pos.needsUpdate = true;
}
// A cut face closing a ring: a fan from its middle (pushed out by `bulge`), the end-grain map
// across it.
function capRing(ring: Ring, mat: string, bulge = 0): Geo {
  const c = ring.c.clone().addScaledVector(ring.n, bulge);
  const u = ring.pts[0].clone().sub(ring.c).normalize(), v = new THREE.Vector3().crossVectors(ring.n, u);
  const pos: number[] = [], uv: number[] = [];
  const uvOf = (p: THREE.Vector3) => [0.5 + p.clone().sub(ring.c).dot(u) / (2 * ring.r), 0.5 + p.clone().sub(ring.c).dot(v) / (2 * ring.r)];
  const E = new THREE.Vector3(), F = new THREE.Vector3();
  for (let j = 0; j < ring.pts.length; j++) {
    let a = ring.pts[j], b = ring.pts[(j + 1) % ring.pts.length];
    if (E.subVectors(a, c).cross(F.subVectors(b, c)).dot(ring.n) < 0) [a, b] = [b, a];
    for (const p of [c, a, b]) {
      pos.push(p.x, p.y, p.z);
      uv.push(...(p === c ? [0.5, 0.5] : uvOf(p)));
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return [{ geo, mat }];
}
// A saw cut with its rim of bark: the bark a band round the edge (`bark` of the radius), the
// end grain inside it, and a few dark drying cracks running out from near the heart.
export const CRACK = "Nature_Crack";
defineMaterial(CRACK, { tint: "#2a2016", rough: 1 });
function cutWithBark(ring: Ring, wood: string, bark: string, bulge: number, seed: number, cracks = 3): Geo {
  const k = 0.86, inner: Ring = { ...ring, pts: ring.pts.map((p) => ring.c.clone().lerp(p, k).addScaledVector(ring.n, bulge * 0.3)), r: ring.r * k };
  const pos: number[] = [], E = new THREE.Vector3(), F = new THREE.Vector3();
  for (let j = 0; j < ring.pts.length; j++) {
    const j2 = (j + 1) % ring.pts.length;
    let quad = [ring.pts[j], ring.pts[j2], inner.pts[j2], inner.pts[j]];
    if (E.subVectors(quad[1], quad[0]).cross(F.subVectors(quad[3], quad[0])).dot(ring.n) < 0) quad = [quad[0], quad[3], quad[2], quad[1]];
    for (const p of [quad[0], quad[1], quad[2], quad[0], quad[2], quad[3]]) pos.push(p.x, p.y, p.z);
  }
  const band = new THREE.BufferGeometry();
  band.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  band.computeVertexNormals();
  const out: Geo[] = [[{ geo: band, mat: bark }], capRing(inner, wood, bulge)];
  // the cracks: thin dark wedges, wide at the rim
  const rnd = rng(seed), u = ring.pts[0].clone().sub(ring.c).normalize(), v = new THREE.Vector3().crossVectors(ring.n, u);
  const lift = ring.n.clone().multiplyScalar(0.6 + bulge * 0.5), cp: number[] = [];
  for (let i = 0; i < cracks; i++) {
    const a = rnd() * Math.PI * 2, dir = u.clone().multiplyScalar(Math.cos(a)).addScaledVector(v, Math.sin(a)), side = new THREE.Vector3().crossVectors(ring.n, dir);
    const a0 = ring.c.clone().addScaledVector(dir, ring.r * (0.35 + rnd() * 0.2)).add(lift);
    const tip = ring.c.clone().addScaledVector(dir, inner.r * (0.9 + rnd() * 0.08)).add(lift), w = ring.r * (0.012 + rnd() * 0.01);
    let tri = [a0, tip.clone().addScaledVector(side, w), tip.clone().addScaledVector(side, -w)];
    if (E.subVectors(tri[1], tri[0]).cross(F.subVectors(tri[2], tri[0])).dot(ring.n) < 0) tri = [tri[0], tri[2], tri[1]];
    for (const p of tri) cp.push(p.x, p.y, p.z);
  }
  if (cp.length) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(cp, 3));
    g.computeVertexNormals();
    out.push([{ geo: g, mat: CRACK }]);
  }
  return merge(...out);
}

// Splinters standing out of a broken end: thin tapered shards, pale wood inside, bark outside.
function splinters(ring: Ring, o: { bark: string; wood: string; seed: number; n?: number; len?: number }): Geo {
  const rnd = rng(o.seed), out: Geo[] = [];
  const u = ring.pts[0].clone().sub(ring.c).normalize(), v = new THREE.Vector3().crossVectors(ring.n, u);
  const n = o.n ?? 9, len = o.len ?? 1;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + rnd() * 0.5, d = 0.35 + rnd() * 0.55;
    const side = u.clone().multiplyScalar(Math.cos(a)).addScaledVector(v, Math.sin(a));
    const base = ring.c.clone().addScaledVector(side, ring.r * d).addScaledVector(ring.n, -ring.r * 0.06);
    const L = ring.r * len * (0.3 + rnd() * 1.0);
    const tip = base.clone().addScaledVector(ring.n, L).addScaledVector(side, ring.r * (0.05 + rnd() * 0.15));
    const mid = base.clone().lerp(tip, 0.5).addScaledVector(side, ring.r * 0.04);
    out.push(limb([base.toArray() as V3, mid.toArray() as V3, tip.toArray() as V3], ring.r * (0.14 + rnd() * 0.12), 0.4, d > 0.75 ? o.bark : o.wood, { seg: 4, maxRings: 2, seed: o.seed + k }));
  }
  return merge(...out);
}

// A cut face on a limb's end (seg: the limb's sides), or a broken end with splinters, for kits
// that shape their own trunks.
export function endOf(g: Geo, seg: number, which: "start" | "end", o: { wood: string; bark?: string; broken?: boolean; seed?: number }): Geo {
  const ring = ringOf(g, seg, which);
  if (!o.broken) return capRing(ring, o.wood, ring.r * 0.02);
  return merge(capRing(ring, o.wood, -ring.r * 0.15), splinters(ring, { bark: o.bark ?? o.wood, wood: o.wood, seed: o.seed ?? 1 }));
}

// Earth on a torn-up root plate, and bark bleached grey by the sun.
export const SOIL = "Nature_Soil";
defineMaterial(SOIL, { map: "felt", tint: "#6b5139", rough: 1, bump: 1.5 });
export const BLEACHED = "Nature_BarkBleached";
defineMaterial(BLEACHED, { map: "bark", tint: "#b8aa92", bump: 2.5 });
// the bare wood where the bark has come away
export const PEELED = "Nature_PeeledWood";
defineMaterial(PEELED, { map: "wood", tint: "#c9a878", bump: 1.2 });

// ---- a fallen trunk ----
export interface TrunkSpec {
  seed: number;
  len: number;          // along Y, centred on the origin
  r: number;            // radius at the root end
  bark: string;
  wood: string;         // end grain (endGrain(tint)) and splinters
  roots?: { soil: string; cover?: string }; // torn-up root plate at -Y (else a saw cut)
  broken?: boolean;     // the +Y end snapped off (else a saw cut)
  stubs?: number;       // branch stubs
  moss?: string;
  mossAmount?: number;
  snow?: string;
  fungus?: string;      // bracket fungi along one side
  bow?: number;         // how far it bends (cm, sideways)
  peeled?: number;      // the share of the bark come away in patches (0.08; 0 for none)
  pebbles?: boolean;    // stones at its sides (yes)
}
export function fallenTrunk(s: TrunkSpec): Geo {
  const rnd = rng(s.seed), seg = s.r > 30 ? 14 : 12, out: Geo[] = [];
  const n = 6, bow = s.bow ?? s.len * 0.04;
  const pts: V3[] = Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1), y = -s.len / 2 + t * s.len;
    return [Math.sin(t * Math.PI) * bow + (rnd() - 0.5) * s.r * 0.15, y, s.r * (0.86 - 0.12 * t) - Math.sin(t * Math.PI) * s.r * 0.05];
  });
  const r1 = s.r * 0.8;
  const tube = limb(pts, s.r, r1, s.bark, { seg, gnarl: 0.7, seed: s.seed, step: s.r * 0.9, maxRings: 26 });
  flute(tube, seg, 0.07);
  barkShade(tube, s.seed, 0, s.r * 2);
  out.push(tube);
  const start = ringOf(tube, seg, "start"), end = ringOf(tube, seg, "end");
  // the root end
  if (s.roots) {
    const c = start.c;
    out.push(capRing(start, s.roots.soil, -s.r * 0.1));
    const plate = lump([c.x, c.y - s.r * 0.3, c.z + s.r * 0.25], [s.r * 2.3, s.r * 0.5, s.r * 2.1], s.seed + 3, s.roots.soil, 1, 0.24);
    out.push(plate);
    if (s.roots.cover) out.push(coverTop(plate, s.roots.cover, { amount: 0.35, thick: 2, seed: s.seed + 4 }));
    const k = 13;
    for (let i = 0; i < k; i++) {
      const a = (i / k) * Math.PI * 2 + rnd() * 0.3, L = 2.1 + rnd() * 0.9;
      const p0: V3 = [c.x + Math.cos(a) * s.r * 0.55, c.y - s.r * 0.2, c.z + Math.sin(a) * s.r * 0.55];
      const p1: V3 = [c.x + Math.cos(a) * s.r * 1.5, c.y - s.r * (0.45 + rnd() * 0.2), c.z + Math.sin(a) * s.r * 1.4];
      const p2: V3 = [c.x + Math.cos(a + 0.15) * s.r * L, c.y - s.r * (0.5 + rnd() * 0.6), Math.max(-8, c.z + Math.sin(a + 0.15) * s.r * L * 0.95)];
      out.push(barkShade(limb([p0, p1, p2], s.r * (0.2 + rnd() * 0.12), s.r * 0.04, s.bark, { seg: 6, maxRings: 5, gnarl: 0.6, seed: s.seed + 20 + i }), s.seed + i, -10, s.r * 2));
    }
  } else out.push(capRing(start, s.wood, s.r * 0.02));
  // the far end
  if (s.broken) out.push(capRing(end, s.wood, -end.r * 0.15), splinters(end, { bark: s.bark, wood: s.wood, seed: s.seed + 7 }));
  else out.push(capRing(end, s.wood, end.r * 0.02));
  // branch stubs: sawn, or snapped short
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const stubs: Geo[] = [];
  for (let i = 0; i < (s.stubs ?? 3); i++) {
    const t = 0.25 + rnd() * 0.6, c = curve.getPointAt(t), rr = s.r + (r1 - s.r) * t;
    const a = (rnd() < 0.5 ? -1 : 1) * (0.7 + rnd() * 0.7), side = Math.sin(a), up = Math.cos(a);
    const dir = new THREE.Vector3(side, (rnd() - 0.5) * 0.8, up).normalize();
    const base = c.clone().addScaledVector(dir, rr * 0.7), L = rr * (0.4 + rnd() * 0.5);
    const tip = base.clone().addScaledVector(dir, L).add(new THREE.Vector3(0, (rnd() - 0.5) * L * 0.3, L * 0.1));
    const br = rr * (0.26 + rnd() * 0.1), st = barkShade(limb([base.toArray() as V3, base.clone().lerp(tip, 0.5).toArray() as V3, tip.toArray() as V3], br, br * 0.8, s.bark, { seg: 7, maxRings: 3, gnarl: 0.4, seed: s.seed + 40 + i }), s.seed + 40 + i, 0, s.r * 2);
    stubs.push(st);
    const tipRing = ringOf(st, 7, "end");
    if (rnd() < 0.5) stubs.push(capRing(tipRing, s.wood, br * 0.05));
    else stubs.push(capRing(tipRing, s.wood, -br * 0.2), splinters(tipRing, { bark: s.bark, wood: s.wood, seed: s.seed + 60 + i, n: 4, len: 1.4 }));
  }
  out.push(...stubs);
  if (s.moss) out.push(coverTop([tube[0], ...stubs.filter((g) => g[0].mat === s.bark).map((g) => g[0])], s.moss, { amount: s.mossAmount ?? 0.35, thick: 1.4 + s.r * 0.03, seed: s.seed + 5, grain: 26, ragged: 0.4, patches: 0.5 }));
  if (s.snow) out.push(coverTop([tube[0], ...stubs.filter((g) => g[0].mat === s.bark).map((g) => g[0])], s.snow, { amount: 0.6, thick: s.r * 0.22, seed: s.seed + 6, ragged: 0.1 }));
  // patches of bark come away from the bare wood, on the sides and the top
  const peeled = s.peeled ?? 0.08, pr = s.r * 1.2;
  if (peeled > 0 && !s.snow)
    out.push(coverTop(tube, PEELED, { thick: 0.8, seed: s.seed + 8, where: (x, y, z, nz) => nz > -0.3 && noise3(x / pr, y / pr + 3, z / pr, s.seed + 8) > 1 - peeled * 1.6 }));
  // bracket fungi in a tier up the side, paler at their growing rims
  if (s.fungus) {
    for (let i = 0; i < 5; i++) {
      const t = 0.3 + i * 0.09 + rnd() * 0.03, c = curve.getPointAt(t), rr = (s.r + (r1 - s.r) * t) * 1.02;
      const f = s.r * (0.32 - i * 0.03);
      const shelf = paint(scale(sphereCenter(1, [0, 0, 0], s.fungus, 10), [f * 0.9, f, f * 0.22]), (p) => {
        const rim = Math.min(1, Math.hypot(p.x / (f * 0.9), p.y / f)) ** 3;
        return [0.72 + 0.5 * rim, 0.72 + 0.46 * rim, 0.7 + 0.4 * rim];
      });
      out.push(translate(shelf, [c.x - rr * 0.92, c.y + (i % 2 ? 1 : -1) * f * 0.4, c.z + (i - 2) * f * 0.35]));
    }
  }
  if (s.pebbles ?? true) out.push(pebbles(s.seed + 90, [0, 0], s.r * 1.6, s.len * 0.42, 4 + Math.round(s.len / 160), Math.max(10, s.r * 0.32)));
  return merge(...out);
}

// ---- a stump ----
export interface StumpSpec {
  seed: number;
  r: number;
  h: number;
  bark: string;
  wood: string;
  broken?: boolean;   // a jagged crown of splinters (else a saw cut)
  slant?: number;     // the saw cut's slope (0..0.3)
  roots?: number;
  moss?: string;
  mossAmount?: number;
  snow?: string;      // a pillow of snow on the cut, snow on the roots
}
export function stumpOf(s: StumpSpec): Geo {
  const rnd = rng(s.seed), seg = 14, out: Geo[] = [], roots = s.roots ?? 5;
  const trunk = limb([[0, 0, -10], [(rnd() - 0.5) * s.r * 0.1, (rnd() - 0.5) * s.r * 0.1, s.h * 0.5], [0, 0, s.h]], s.r * 1.04, s.r, s.bark, { seg, flare: 0.75, roots, gnarl: 0.7, seed: s.seed, step: s.r * 0.45, maxRings: 10 });
  if (s.broken) {
    const jag = Array.from({ length: seg }, (_, j) => s.r * (0.1 + 0.38 * Math.abs(Math.sin(j * 1.7 + s.seed)) * rnd()));
    editRing(trunk, seg, "end", (p, j) => (p.z += jag[j]));
  }
  else {
    const sl = s.slant ?? 0.12, a = rnd() * Math.PI * 2;
    editRing(trunk, seg, "end", (p) => (p.z += (p.x * Math.cos(a) + p.y * Math.sin(a)) * sl));
  }
  flute(trunk, seg, 0.06);
  barkShade(trunk, s.seed, 0, s.h * 1.1);
  out.push(trunk);
  const top = ringOf(trunk, seg, "end");
  top.n.set(0, 0, 1);
  if (s.broken) out.push(capRing(top, s.wood, -s.r * 0.12), splinters(top, { bark: s.bark, wood: s.wood, seed: s.seed + 3, n: 6, len: 0.5 }));
  else out.push(cutWithBark(top, s.wood, s.bark, s.r * 0.02, s.seed + 4, s.snow ? 0 : 3));
  const rootGeo: Geo[] = [];
  for (let i = 0; i < roots; i++) {
    const a = ((i + rnd() * 0.4) / roots) * Math.PI * 2, L = 2.4 + rnd() * 0.8;
    const bend = (rnd() - 0.5) * 0.5;
    rootGeo.push(limb([
      [Math.cos(a) * s.r * 0.45, Math.sin(a) * s.r * 0.45, s.h * 0.42],
      [Math.cos(a) * s.r * 1.15, Math.sin(a) * s.r * 1.15, s.h * 0.2],
      [Math.cos(a + bend * 0.5) * s.r * 1.75, Math.sin(a + bend * 0.5) * s.r * 1.75, s.h * 0.05],
      [Math.cos(a + bend) * s.r * L, Math.sin(a + bend) * s.r * L, -16],
    ], s.r * (0.42 + rnd() * 0.08), s.r * 0.1, s.bark, { seg: 8, maxRings: 8, gnarl: 0.8, seed: s.seed + 10 + i }).map((p) => ({ geo: p.geo.scale(1, 1, 0.72), mat: p.mat })));
  }
  for (const g of rootGeo) barkShade(g, s.seed + 11, -12, s.h * 1.1);
  out.push(...rootGeo);
  out.push(pebbles(s.seed + 90, [0, 0], s.r * 2.2, s.r * 2.2, 5, Math.max(10, s.r * 0.3)));
  if (s.moss) out.push(coverTop([trunk[0]], s.moss, { amount: s.mossAmount ?? 0.4, thick: 1.6, seed: s.seed + 5, grain: 22 }));
  if (s.snow) {
    out.push(coverTop(rootGeo.map((g) => g[0]), s.snow, { amount: 0.6, thick: 5, seed: s.seed + 6, ragged: 0.1 }));
    out.push(lump([top.c.x, top.c.y, top.c.z - s.r * 0.05], [s.r * 0.98, s.r * 0.98, s.r * 0.34], s.seed + 7, s.snow, 1, 0.08));
  }
  return merge(...out);
}

// ---- a bare tree ----
export interface SnagSpec {
  seed: number;
  h: number;          // about how tall
  r: number;          // trunk radius
  bark: string;
  wood?: string;      // for a snapped top and sawn stubs (end grain)
  lean?: number;      // 0..0.4
  spread?: number;    // how wide the limbs splay (0.85)
  rise?: number;      // pulls the limbs up (+) or droops them (-)
  depth?: number;     // forks (3)
  snapped?: boolean;  // the leader broken off, a side limb carrying on
  roots?: number;
  hollow?: string;    // a dark knot hole (material)
  cover?: { mat: string; amount?: number; thick?: number }; // snow or ash along the limbs
}
export function snag(s: SnagSpec): Geo {
  const rnd = rng(s.seed), out: Geo[] = [], lean = s.lean ?? 0.12, la = rnd() * Math.PI * 2;
  const dir: V3 = [Math.cos(la) * lean, Math.sin(la) * lean, 1];
  const wood = grow({
    mat: s.bark, seed: s.seed, at: [0, 0, -8], dir, len: s.h * 0.44, r: s.r, depth: s.depth ?? 4,
    spread: s.spread ?? 0.8, shrink: 0.64, thin: 0.8, flare: 0.8, roots: s.roots ?? 5, gnarl: 0.9, tipR: 0.12, rise: s.rise ?? 0.15,
    kids: (d) => (d >= 3 ? 3 : 2),
  });
  barkShade(wood, s.seed, 0, s.h * 0.6);
  out.push(wood);
  // the snapped leader: a short jagged spike up the middle
  if (s.snapped && s.wood) {
    const top: V3 = [dir[0] * s.h * 0.44, dir[1] * s.h * 0.44, s.h * 0.44 - 8];
    const spike = limb([top, [top[0] + dir[0] * 30, top[1] + dir[1] * 30, top[2] + s.h * 0.08], [top[0] + dir[0] * 50, top[1] + dir[1] * 50, top[2] + s.h * 0.14]], s.r * 0.66, s.r * 0.6, s.bark, { seg: 10, maxRings: 3, gnarl: 0.6, seed: s.seed + 2 });
    out.push(spike);
    const ring = ringOf(spike, 10, "end");
    out.push(capRing(ring, s.wood, -ring.r * 0.2), splinters(ring, { bark: s.bark, wood: s.wood, seed: s.seed + 3, n: 8, len: 1.2 }));
  }
  // surface roots gripping the ground
  const roots: Geo[] = [];
  for (let i = 0; i < (s.roots ?? 5); i++) {
    const a = ((i + rnd() * 0.4) / (s.roots ?? 5)) * Math.PI * 2, L = 2.6 + rnd();
    roots.push(limb([
      [Math.cos(a) * s.r * 0.4, Math.sin(a) * s.r * 0.4, s.r * 0.9],
      [Math.cos(a) * s.r * 1.4, Math.sin(a) * s.r * 1.4, s.r * 0.3],
      [Math.cos(a + 0.12) * s.r * L, Math.sin(a + 0.12) * s.r * L, -8],
    ], s.r * 0.42, s.r * 0.08, s.bark, { seg: 7, maxRings: 5, gnarl: 0.6, seed: s.seed + 30 + i }));
  }
  for (const g of roots) barkShade(g, s.seed + 31, -8, s.h * 0.6);
  out.push(...roots);
  // sawn-off or snapped stubs low on the trunk, and a knot hole
  if (s.wood) {
    for (let i = 0; i < 2; i++) {
      const a = la + Math.PI * (0.6 + i * 0.9), z = s.h * (0.16 + i * 0.12);
      const base: V3 = [Math.cos(a) * s.r * 0.7 + dir[0] * z, Math.sin(a) * s.r * 0.7 + dir[1] * z, z];
      const tip: V3 = [base[0] + Math.cos(a) * s.r * 0.9, base[1] + Math.sin(a) * s.r * 0.9, base[2] + s.r * 0.3];
      const st = limb([base, [(base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2, (base[2] + tip[2]) / 2], tip], s.r * 0.3, s.r * 0.26, s.bark, { seg: 7, maxRings: 2, seed: s.seed + 50 + i });
      out.push(st, capRing(ringOf(st, 7, "end"), s.wood, s.r * 0.02));
    }
  }
  if (s.hollow) {
    const a = la + Math.PI, z = s.h * 0.24;
    out.push(translate(scale(sphereCenter(1, [0, 0, 0], s.hollow, 10), [s.r * 0.24, s.r * 0.24, s.r * 0.42]), [Math.cos(a) * s.r * 0.86 + dir[0] * z, Math.sin(a) * s.r * 0.86 + dir[1] * z, z]));
  }
  if (s.cover) out.push(coverTop([...wood, ...roots.map((g) => g[0])], s.cover.mat, { amount: s.cover.amount ?? 0.5, thick: s.cover.thick ?? 3, seed: s.seed + 9, ragged: 0.12 }));
  return merge(...out);
}
