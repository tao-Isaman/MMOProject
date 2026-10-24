// ที่ราบสูงลมแรงและหินลอย (the eastheights field kit): the high country north of the eastern
// border, for three fields.
//   - The windswept heights: grassland up on the heights where the wind off the northern sea lays
//     the grass over all one way; granite boulders and tors crusted with lichen, rocks the wind
//     has carved into mushrooms and arches, low heather and pines grown crooked downwind; the
//     great passage barrow of the old horse lords in its kerb of carved stones, the warrior's
//     face carved into a standing block, the nomads' ovoo heaped with stones and blue scarves,
//     their black tents of yak hair and their strings of prayer flags.
//   - The storm cape: the broken signal tower on the point, the iron masts that draw the
//     lightning down, a brig broken in two on the rocks, trees split by lightning.
//   - The floating rocks: islands of earth the demon gate's magic tore up out of the plain and
//     left hanging in the air, their roots trailing; boulders hovering in a cluster; the ring of
//     old stones that circles a rune-cut pillar; the raw hollows they were torn from; and the
//     camp of Kradia's mages who came to watch: their pavilion and their scrying engine.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front facing -X.
// The wind blows toward -X in every piece (grass, heather, trees, scarves and flags all lean or
// stream that way): place them with about the same heading and a field leans as one. The
// floating pieces hang in the air over their footprint and the ground under them stays open:
// give them solids of their own. A few pieces keep their heart at the origin rather than their
// footprint's middle, for the solids round them: the barrow's mound (its passage runs out 10 m to
// the front), the signal tower (its rubble heaped to +X), the wreck (its two halves either side of
// x = 0) and the split tree's trunk; the crooked pine's trunk stands at (170, 0).

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, sphereCenter, torus, rock, noise3,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial } from "../textures";
import { shrub, limb } from "../trees";
import type { Lobe, ShrubLook } from "../trees";
import { coverTop, pebbles } from "../nature";
import type { Kit } from "./types";

// ---- materials ----
// the heights: granite and its lichens, the wind-cut stone in its beds, grass, heather, pines
defineMaterial("Eastheights_Granite", { map: "crag", tint: "#a6a399", bump: 3 });
defineMaterial("Eastheights_GraniteDark", { map: "crag", tint: "#77746d", bump: 3 });
defineMaterial("Eastheights_LichenGold", { map: "felt", tint: "#b8a253", rough: 1 });
defineMaterial("Eastheights_LichenRust", { map: "felt", tint: "#a66d45", rough: 1 });
defineMaterial("Eastheights_LichenGrey", { map: "felt", tint: "#bfc3ad", rough: 1 });
defineMaterial("Eastheights_Windstone", { map: "crag", tint: "#c9b596", bump: 2.5 });
defineMaterial("Eastheights_WindstoneDark", { map: "crag", tint: "#a08a72", bump: 2.5 });
defineMaterial("Eastheights_Grass", { tint: "#a1a457", rough: 0.9 });
defineMaterial("Eastheights_GrassDry", { tint: "#cbb97c", rough: 0.9 });
defineMaterial("Eastheights_GrassDark", { tint: "#6a7a3c", rough: 0.95 });
defineMaterial("Eastheights_Turf", { map: "felt", tint: "#7f8c48", rough: 1 });
defineMaterial("Eastheights_TurfDark", { map: "felt", tint: "#5a6634", rough: 1 });
defineMaterial("Eastheights_HeatherCore", { map: "foliage", tint: "#8e7088", rough: 1, bump: 1.5 });
defineMaterial("Eastheights_HeatherDark", { card: "tuft", tint: "#7a7a48", rough: 0.9 });
defineMaterial("Eastheights_Heather", { card: "tuft", tint: "#b277a8", rough: 0.85 });
defineMaterial("Eastheights_HeatherLight", { card: "tuft", tint: "#e2acd6", rough: 0.8 });
defineMaterial("Eastheights_PineCore", { map: "foliage", tint: "#2f4b35", rough: 0.95, bump: 1.5 });
defineMaterial("Eastheights_PineDark", { card: "needles", tint: "#35573d", rough: 0.9 });
defineMaterial("Eastheights_Pine", { card: "needles", tint: "#527b53", rough: 0.85 });
defineMaterial("Eastheights_PineLight", { card: "needles", tint: "#8eab76", rough: 0.8 });
defineMaterial("Eastheights_Bark", { map: "bark", tint: "#6a5545", bump: 2.5 });
defineMaterial("Eastheights_BarkBleached", { map: "bark", tint: "#b5ad9f", bump: 2.5 });
defineMaterial("Eastheights_Charred", { map: "bark", tint: "#2c2624", bump: 2 });
defineMaterial("Eastheights_Dark", { tint: "#141211", rough: 1 });
// the old peoples' stones and the nomads' things
defineMaterial("Eastheights_Megalith", { map: "crag", tint: "#9d988c", bump: 2.5 });
defineMaterial("Eastheights_MegalithDark", { map: "crag", tint: "#858077", bump: 2.5 });
defineMaterial("Eastheights_Carving", { map: "crag", tint: "#5e5a53", bump: 2 });
defineMaterial("Eastheights_Bone", { map: "marble", tint: "#e2d8c0", rough: 0.75 });
defineMaterial("Eastheights_ScarfBlue", { map: "fabric", tint: "#3f7cca", rough: 0.9 });
defineMaterial("Eastheights_ScarfWhite", { map: "fabric", tint: "#f1ede2", rough: 0.9 });
defineMaterial("Eastheights_FlagRed", { map: "fabric", tint: "#c4412f", rough: 0.9 });
defineMaterial("Eastheights_FlagGreen", { map: "fabric", tint: "#3f8a4a", rough: 0.9 });
defineMaterial("Eastheights_FlagYellow", { map: "fabric", tint: "#e2ba3c", rough: 0.9 });
defineMaterial("Eastheights_Tassel", { map: "felt", tint: "#c8302a", rough: 1 });
defineMaterial("Eastheights_YakFelt", { map: "felt", tint: "#332c26", rough: 1 });
defineMaterial("Eastheights_YakStripe", { map: "felt", tint: "#75634f", rough: 1 });
defineMaterial("Eastheights_Dung", { map: "adobe", tint: "#73604a", bump: 1.5 });
defineMaterial("Eastheights_Pole", { map: "wood", tint: "#7d6650", bump: 1.3 });
defineMaterial("Eastheights_Rope", { map: "fabric", tint: "#a89272", rough: 1 });
defineMaterial("Eastheights_Smoke", { tint: "#b8b4ae", rough: 1, opacity: 0.3 });
// the storm cape: the tower's stone and soot, iron, copper, the arc, the wreck
defineMaterial("Eastheights_TowerStone", { map: "stone", tint: "#a59f93", bump: 2.2 });
defineMaterial("Eastheights_TowerDark", { map: "stone", tint: "#726d64", bump: 2.2 });
defineMaterial("Eastheights_Iron", { map: "metal", tint: "#3e3f44", rough: 0.6, metal: 0.45 });
defineMaterial("Eastheights_Rust", { map: "metal", tint: "#7a4a30", rough: 0.75, metal: 0.3 });
defineMaterial("Eastheights_Copper", { map: "metal", tint: "#bb7442", rough: 0.4, metal: 0.7 });
defineMaterial("Eastheights_Verdigris", { map: "metal", tint: "#5f9e88", rough: 0.6, metal: 0.3 });
defineMaterial("Eastheights_Arc", { tint: "#e6f3ff", rough: 0.4, glow: "#8cc8ff", glowI: 2.4 });
defineMaterial("Eastheights_Fulgurite", { tint: "#46524f", rough: 0.3, glow: "#3a8cff", glowI: 0.5 });
defineMaterial("Eastheights_Scorch", { map: "felt", tint: "#3b322d", rough: 1, opacity: 0.62 });
defineMaterial("Eastheights_HullTar", { map: "wood", tint: "#4d3e32", bump: 1.3 });
defineMaterial("Eastheights_HullPaint", { map: "wood", tint: "#7c3326", bump: 1.2 });
defineMaterial("Eastheights_Plank", { map: "wood", tint: "#8a7a66", bump: 1.3 });
defineMaterial("Eastheights_Sail", { map: "fabric", tint: "#cdbf9f", rough: 1 });
defineMaterial("Eastheights_Barnacle", { map: "stone", tint: "#d5cfc2", bump: 2 });
defineMaterial("Eastheights_Weed", { map: "felt", tint: "#4a5426", rough: 0.6 });
// the floating rocks: torn earth, roots, the rift's violet glow, the rune pillar, Kradia's camp
defineMaterial("Eastheights_Soil", { map: "adobe", tint: "#7c5e45", bump: 1.6 });
defineMaterial("Eastheights_SoilDark", { map: "adobe", tint: "#4d3b2d", bump: 1.6 });
defineMaterial("Eastheights_Root", { map: "bark", tint: "#5e4a3a", bump: 2 });
defineMaterial("Eastheights_FloatRock", { map: "crag", tint: "#908899", bump: 3 });
defineMaterial("Eastheights_Rift", { tint: "#e8ccff", rough: 0.3, glow: "#a050ff", glowI: 1.8 });
defineMaterial("Eastheights_RiftSoft", { tint: "#c49cff", rough: 0.8, glow: "#7a2cff", glowI: 0.9, opacity: 0.4 });
defineMaterial("Eastheights_RuneStone", { map: "crag", tint: "#555062", bump: 3 });
defineMaterial("Eastheights_Canvas", { map: "fabric", tint: "#30418a", rough: 0.95 });
defineMaterial("Eastheights_CanvasTrim", { map: "fabric", tint: "#6c40a2", rough: 0.95 });
defineMaterial("Eastheights_Brass", { map: "metal", tint: "#c9a24a", rough: 0.35, metal: 0.8 });
defineMaterial("Eastheights_Paper", { map: "paper", tint: "#efe5c8", rough: 0.9 });
defineMaterial("Eastheights_Glass", { tint: "#9ec4e8", rough: 0.1, glow: "#9ec4e8", glowI: 0.3 });
// for the fields: the cliffs of the heights, the cape and the torn plain; the seas
defineMaterial("Eastheights_CliffHeath", { map: "crag", tint: "#a39e92", bump: 4 });
defineMaterial("Eastheights_CliffStorm", { map: "crag", tint: "#85858a", bump: 4 });
defineMaterial("Eastheights_CliffRift", { map: "crag", tint: "#9a8e88", bump: 4 });
defineMaterial("Eastheights_StormSea", { tint: "#285a73", rough: 0.08, opacity: 0.93 });

const TAU = Math.PI * 2;
const DEG = 180 / Math.PI;

// ---- helpers ----
function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
// a Geo moved so its footprint is centred on x, y = 0 (z left alone)
function centre(g: Geo): Geo {
  const b = new THREE.Box3();
  for (const p of g) {
    p.geo.computeBoundingBox();
    b.union(p.geo.boundingBox!);
  }
  return translate(g, [-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0]);
}
// a squashed sphere (radii x y z) at c
const ellipsoid = (r: V3, c: V3, mat: string, seg = 10): Geo => translate(scale(sphereCenter(1, [0, 0, 0], mat, seg), r), c);
// a rock moved into place
const stone = (size: V3, rough: number, seed: number, mat: string, at: V3, turn = 0, flat = false): Geo => translate(rotateZ(rock(size, rough, seed, mat, flat), turn), at);
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
function faceNormal(a: V3, b: V3, c: V3): V3 {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  return norm([uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]);
}
// a turned shape round Z: a profile of [radius, z] points from the bottom up
function lathe(profile: [number, number][], segs: number, mat: string): Geo {
  const geo = new THREE.LatheGeometry(profile.map(([r, z]) => new THREE.Vector2(r, z)), segs);
  geo.rotateX(Math.PI / 2);
  return [{ geo, mat }];
}
// Shade the corners of a Geo (times the colours it already has): fn gets each corner's place
// and normal and gives a factor (or one per channel).
function shade(g: Geo, fn: (p: THREE.Vector3, n: THREE.Vector3) => number | [number, number, number]): Geo {
  const p = new THREE.Vector3(), n = new THREE.Vector3();
  for (const part of g) {
    const geo = part.geo;
    if (!geo.getAttribute("normal")) geo.computeVertexNormals();
    const pos = geo.getAttribute("position"), nor = geo.getAttribute("normal");
    let col = geo.getAttribute("color") as THREE.BufferAttribute | undefined;
    if (!col) {
      col = new THREE.BufferAttribute(new Float32Array(pos.count * 3).fill(1), 3);
      geo.setAttribute("color", col);
    }
    for (let i = 0; i < pos.count; i++) {
      const f = fn(p.fromBufferAttribute(pos, i), n.fromBufferAttribute(nor, i));
      const [r, gr, b] = typeof f === "number" ? [f, f, f] : f;
      col.setXYZ(i, col.getX(i) * r, col.getY(i) * gr, col.getZ(i) * b);
    }
  }
  return g;
}
// The beds of a sedimentary stone: bands of lighter and darker along its height, wavering.
const beds = (g: Geo, period: number, seed: number, k = 0.24): Geo =>
  shade(g, (p) => {
    const w = Math.sin(((p.z + (noise3(p.x / 90, p.y / 90, 0, seed) - 0.5) * period * 0.8) / period) * TAU);
    const v = 1 - k * (0.5 + 0.5 * w);
    return [v * 1.02, v, v * 0.97];
  });
// The foot of a thing darkened where it meets the ground (up to `h`).
const footShade = (g: Geo, h: number, k = 0.4): Geo => shade(g, (p) => 1 - k * Math.max(0, 1 - p.z / h));

// Triangles gathered by material with their own lighting normals and corner shades (cloth, grass
// blades, a hull's skin, an island's turf), handed over as a Geo; texture coordinates in metres.
class Sheet {
  private by = new Map<string, { p: number[]; n: number[]; c: number[] }>();
  private bucket(mat: string) {
    let b = this.by.get(mat);
    if (!b) this.by.set(mat, (b = { p: [], n: [], c: [] }));
    return b;
  }
  // a triangle (corner shades s); `n` one lighting normal for it (else its own); `two` adds the
  // back face
  tri(mat: string, a: V3, b: V3, c: V3, s: [number, number, number] = [1, 1, 1], n: V3 | null = null, two = false): void {
    const B = this.bucket(mat), fn = n ?? faceNormal(a, b, c);
    B.p.push(...a, ...b, ...c);
    for (let k = 0; k < 3; k++) B.n.push(...fn);
    B.c.push(s[0], s[0], s[0], s[1], s[1], s[1], s[2], s[2], s[2]);
    if (two) {
      const bn: V3 = n ?? [-fn[0], -fn[1], -fn[2]];
      B.p.push(...a, ...c, ...b);
      for (let k = 0; k < 3; k++) B.n.push(...bn);
      B.c.push(s[0], s[0], s[0], s[2], s[2], s[2], s[1], s[1], s[1]);
    }
  }
  quad(mat: string, a: V3, b: V3, c: V3, d: V3, s: [number, number, number, number] = [1, 1, 1, 1], n: V3 | null = null, two = false): void {
    this.tri(mat, a, b, c, [s[0], s[1], s[2]], n, two);
    this.tri(mat, a, c, d, [s[0], s[2], s[3]], n, two);
  }
  geo(): Geo {
    const out: Geo = [];
    for (const [mat, b] of this.by) {
      if (!b.p.length) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(b.p, 3));
      geo.setAttribute("normal", new THREE.Float32BufferAttribute(b.n, 3));
      geo.setAttribute("color", new THREE.Float32BufferAttribute(b.c, 3));
      const uv: number[] = [];
      for (let i = 0; i < b.p.length; i += 3) uv.push((b.p[i] + b.p[i + 1] * 0.4) / 100, (b.p[i + 2] + b.p[i + 1] * 0.6) / 100);
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      out.push({ geo, mat });
    }
    return out;
  }
}

// Grass blades laid over by the wind: n of them rising from points in the ellipse rx x ry about
// `at` (only its outer part, from `ring` of the way out), h0..h1 long, bowing toward -X by `lean`
// (0 upright .. 1 lying flat), each a tapering strip in two bends, lit from above, dark at the
// foot. `floor` lifts each blade's foot onto a surface.
const GRASS = ["Eastheights_Grass", "Eastheights_GrassDry", "Eastheights_Grass", "Eastheights_GrassDark"];
function blades(sh: Sheet, seed: number, n: number, o: { rx: number; ry: number; h0: number; h1: number; lean: number; mats?: string[]; at?: V3; w?: number; ring?: number; spread?: number; floor?: (x: number, y: number) => number; keep?: (x: number, y: number) => boolean }): void {
  const rnd = seeded(seed), mats = o.mats ?? GRASS, at = o.at ?? [0, 0, 0], w = o.w ?? 6, spread = o.spread ?? 0.5, ring = o.ring ?? 0;
  for (let i = 0, tries = 0; i < n && tries < n * 4; tries++) {
    const a = rnd() * TAU, d = Math.sqrt(ring * ring + rnd() * (1 - ring * ring));
    const x0 = at[0] + Math.cos(a) * o.rx * d, y0 = at[1] + Math.sin(a) * o.ry * d;
    if (o.keep && !o.keep(x0, y0)) continue;
    i++;
    const z0 = at[2] + (o.floor ? o.floor(x0, y0) : 0) - 2;
    const h = o.h0 + rnd() * (o.h1 - o.h0), l = Math.min(1, o.lean * (0.7 + rnd() * 0.6)), dir = Math.PI + (rnd() - 0.5) * spread;
    const dx = Math.cos(dir), dy = Math.sin(dir);
    const p1: V3 = [x0 + dx * h * l * 0.3, y0 + dy * h * l * 0.3, z0 + h * (0.55 - 0.1 * l)];
    const p2: V3 = [x0 + dx * h * l, y0 + dy * h * l, z0 + h * (1 - 0.75 * l)];
    const ww = w * (0.7 + rnd() * 0.6), sx = (-dy * ww) / 2, sy = (dx * ww) / 2;
    const m = mats[Math.floor(rnd() * mats.length)], up = norm([dx * 0.25, dy * 0.25, 1]);
    const l1: V3 = [p1[0] - sx * 0.6, p1[1] - sy * 0.6, p1[2]], r1: V3 = [p1[0] + sx * 0.6, p1[1] + sy * 0.6, p1[2]];
    sh.quad(m, [x0 - sx, y0 - sy, z0], [x0 + sx, y0 + sy, z0], r1, l1, [0.5, 0.5, 0.85, 0.85], up, true);
    sh.tri(m, l1, r1, p2, [0.85, 0.85, 1.1], up, true);
  }
}
// A strip of cloth streaming from `from` toward -X (a scarf, a ribbon): `len` long, `w` wide,
// falling `drop` over its length, fluttering in `segs` folds; across its width along `across`.
function streamer(sh: Sheet, mat: string, from: V3, len: number, w: number, drop: number, seed: number, segs = 4, across: V3 = [0, 1, 0]): void {
  const rnd = seeded(seed), dir = Math.PI + (rnd() - 0.5) * 0.5;
  let prev: [V3, V3] | null = null;
  for (let k = 0; k <= segs; k++) {
    const t = k / segs, f = Math.sin(t * Math.PI * 2 + seed) * 8 * t;
    const c: V3 = [from[0] + Math.cos(dir) * len * t, from[1] + Math.sin(dir) * len * t + f, from[2] - drop * t * t];
    const ww = (w * (1 - 0.35 * t)) / 2;
    const e: [V3, V3] = [[c[0] - across[0] * ww, c[1] - across[1] * ww, c[2] - across[2] * ww], [c[0] + across[0] * ww, c[1] + across[1] * ww, c[2] + across[2] * ww]];
    if (prev) sh.quad(mat, prev[0], prev[1], e[1], e[0], [0.85, 0.85, 1, 1], null, true);
    prev = e;
  }
}
// a turned bowl (offerings), r across, at `at`
const bowl = (r: number, at: V3, mat = "Eastheights_Pole"): Geo =>
  translate(lathe([[r * 0.45, 0], [r * 0.6, 2], [r * 0.9, r * 0.35], [r, r * 0.55], [r * 0.92, r * 0.56], [r * 0.5, r * 0.2]], 10, mat), at);
// a rope along points
function rope(pts: V3[], r = 1.4, mat = "Eastheights_Rope"): Geo {
  const out: Geo[] = [];
  for (let i = 0; i + 1 < pts.length; i++) out.push(cylinderBetween(pts[i], pts[i + 1], r, 4, mat));
  return merge(...out);
}
// points along a rope sagging `sag` between a and b
function sagging(a: V3, b: V3, sag: number, n: number): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - sag * 4 * t * (1 - t)]);
  }
  return out;
}
// a glowing shard (two cones base to base) from a toward b
function shard(a: V3, b: V3, r: number, mat = "Eastheights_Rift"): Geo {
  const m: V3 = [a[0] + (b[0] - a[0]) * 0.35, a[1] + (b[1] - a[1]) * 0.35, a[2] + (b[2] - a[2]) * 0.35];
  return merge(cylinderBetween(a, m, 0.01, 5, mat, r), cylinderBetween(m, b, r, 5, mat, 0.01));
}

// Spots of lichen (or barnacles) crusting a rock: n little flat rosettes on faces that look up at
// least `minUp`, each lying on its face, r0..r1 across.
function lichenSpots(g: Geo, seed: number, n: number, mat: string, r0 = 6, r1 = 16, minUp = 0.25): Geo {
  const rnd = seeded(seed), faces: { c: THREE.Vector3; n: THREE.Vector3 }[] = [];
  const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), E = new THREE.Vector3(), F = new THREE.Vector3();
  for (const part of g) {
    const geo = part.geo.index ? part.geo.toNonIndexed() : part.geo, pos = geo.getAttribute("position");
    for (let i = 0; i + 2 < pos.count; i += 3) {
      A.fromBufferAttribute(pos, i);
      B.fromBufferAttribute(pos, i + 1);
      C.fromBufferAttribute(pos, i + 2);
      const nn = new THREE.Vector3().crossVectors(E.subVectors(B, A), F.subVectors(C, A));
      if (nn.lengthSq() < 4) continue;
      nn.normalize();
      if (nn.z >= minUp) faces.push({ c: A.clone().add(B).add(C).multiplyScalar(1 / 3), n: nn });
    }
  }
  const out: Geo[] = [], Z = new THREE.Vector3(0, 0, 1);
  for (let k = 0; k < n && faces.length; k++) {
    // each a little cluster of crusts run together
    const f = faces[Math.floor(rnd() * faces.length)], r = r0 + rnd() * (r1 - r0);
    const q = new THREE.Quaternion().setFromUnitVectors(Z, f.n);
    for (let j = 0; j < 3; j++) {
      const off = new THREE.Vector3((rnd() - 0.5) * r * 1.4, (rnd() - 0.5) * r * 1.4, 0).applyQuaternion(q), rr = r * (0.35 + rnd() * 0.4);
      const m = new THREE.Matrix4().compose(f.c.clone().add(off).addScaledVector(f.n, 0.8), q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(Z, rnd() * 3)), new THREE.Vector3(rr, rr * (0.5 + rnd() * 0.4), 1));
      out.push(sphereCenter(1, [0, 0, 0], mat, 6).map((p) => ({ geo: p.geo.clone().applyMatrix4(m), mat: p.mat })));
    }
  }
  return merge(...out);
}

// A ragged patch lying flat on the ground (scorched turf, raw soil): rx x ry about `at`, darkest in
// its middle, fading at its ragged edge.
function scorchPatch(rx: number, ry: number, seed: number, at: [number, number] = [0, 0], mat = "Eastheights_Scorch", z = 1.5): Geo {
  const sh = new Sheet(), n = 14, rnd = seeded(seed), up: V3 = [0, 0, 1];
  const rim = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * TAU, k = 0.75 + rnd() * 0.4;
    return [at[0] + Math.cos(a) * rx * k, at[1] + Math.sin(a) * ry * k, z] as V3;
  });
  const mid = rim.map(([x, y]): V3 => [at[0] + (x - at[0]) * 0.55, at[1] + (y - at[1]) * 0.55, z + 0.3]);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    sh.tri(mat, [at[0], at[1], z + 0.4], mid[i], mid[j], [0.8, 0.9, 0.9], up);
    sh.quad(mat, mid[i], rim[i], rim[j], mid[j], [0.9, 1.35, 1.35, 0.9], up);
  }
  return sh.geo();
}

// =================================== the heights ===================================

// A granite boulder of the heights (2.6 x 2 m, 1.9 m high): split by frost into big flat faces,
// crusted with gold and rust lichen, a stone broken off it at its side, pebbles and a skirt of
// wind-laid grass round its foot.
function heathBoulder(): Geo {
  const b = rock([260, 200, 190], 0.32, 4101, "Eastheights_Granite");
  const sh = new Sheet();
  blades(sh, 4107, 46, { rx: 165, ry: 135, h0: 30, h1: 62, lean: 0.6, ring: 0.62 });
  return merge(
    b,
    lichenSpots(b, 3, 12, "Eastheights_LichenGold"),
    lichenSpots(b, 7, 6, "Eastheights_LichenRust"),
    stone([90, 70, 55], 0.35, 4103, "Eastheights_GraniteDark", [-150, 75, 0], 20),
    pebbles(4105, [0, 0], 150, 120, 7, 16),
    sh.geo(),
  );
}

// Bedrock breaking through the turf (4.2 x 3.2 m, 0.8 m): a low shelf of flat slabs with lichen
// on them, boulders and stones round it, grass in the joints.
function rockScatter(): Geo {
  const slabs = merge(
    stone([230, 150, 54], 0.25, 4201, "Eastheights_Granite", [0, 0, -8], 15, true),
    stone([160, 115, 44], 0.25, 4202, "Eastheights_Granite", [-130, 95, -6], 40, true),
    stone([130, 95, 38], 0.25, 4203, "Eastheights_GraniteDark", [120, -85, -6], -20, true),
  );
  const sh = new Sheet();
  blades(sh, 4209, 40, { rx: 210, ry: 160, h0: 25, h1: 55, lean: 0.6, keep: (x, y) => Math.hypot(x / 1.3, y) > 90 });
  return merge(
    slabs,
    lichenSpots(slabs, 11, 10, "Eastheights_LichenGold"),
    lichenSpots(slabs, 13, 8, "Eastheights_LichenGrey"),
    stone([115, 95, 85], 0.35, 4205, "Eastheights_GraniteDark", [60, 125, 0], 0),
    stone([70, 60, 55], 0.35, 4206, "Eastheights_Granite", [-175, -65, 0], 50),
    stone([50, 45, 36], 0.4, 4207, "Eastheights_Granite", [185, 60, 0], 10),
    pebbles(4208, [0, 0], 190, 140, 8, 14),
    sh.geo(),
  );
}

// A tor (3.6 x 3 m, 3.8 m high): granite weathered into rounded slabs piled on each other, the
// joints opened by frost, a rocking stone on the top; lichen over it, blocks fallen at its foot,
// grass round it.
function graniteTor(): Geo {
  const layers: [V3, V3, number, boolean][] = [
    [[330, 270, 120], [0, 0, -12], 0, true],
    [[280, 225, 112], [22, -14, 68], 12, true],
    [[235, 195, 110], [-14, 18, 140], -8, true],
    [[175, 150, 100], [10, 2, 212], 25, true],
    [[140, 112, 92], [-8, 8, 282], -15, false],
  ];
  const pile = merge(...layers.map(([s, at, turn, flat], i) => stone(s, 0.22, 4301 + i, i % 2 ? "Eastheights_Granite" : "Eastheights_GraniteDark", at, turn, flat)));
  const fallen = merge(
    stone([150, 120, 100], 0.3, 4311, "Eastheights_Granite", [-190, -125, 0], 30),
    stone([120, 100, 80], 0.3, 4312, "Eastheights_GraniteDark", [170, 135, 0], -20),
    stone([180, 120, 40], 0.25, 4313, "Eastheights_Granite", [60, -195, -4], 70, true),
  );
  const sh = new Sheet();
  blades(sh, 4315, 50, { rx: 250, ry: 215, h0: 30, h1: 60, lean: 0.6, ring: 0.6 });
  return merge(
    pile, fallen,
    lichenSpots(pile, 17, 12, "Eastheights_LichenGold"),
    lichenSpots(pile, 19, 8, "Eastheights_LichenGrey"),
    lichenSpots(fallen, 23, 10, "Eastheights_LichenRust"),
    pebbles(4317, [0, 0], 210, 180, 9, 18),
    sh.geo(),
  );
}

// Grass laid over by the wind (1.3 x 0.9 m, 0.6 m): long blades bowing toward -X from a dark
// tussock, green at the foot and bleached to straw at the tips.
function bentGrass(): Geo {
  const sh = new Sheet();
  blades(sh, 4401, 44, { rx: 38, ry: 32, h0: 55, h1: 100, lean: 0.75, at: [30, 0, 0] });
  return merge(ellipsoid([34, 28, 11], [34, 0, 0], "Eastheights_TurfDark", 7), sh.geo());
}

// A cushion of heather (1.7 x 1.1 m, 0.5 m): low wiry clumps pressed flat by the wind and combed
// out downwind (-X), lilac and purple in flower over dark green, short grass at its edge.
const HEATHER: ShrubLook = { core: "Eastheights_HeatherCore", dark: "Eastheights_HeatherDark", mid: "Eastheights_Heather", light: "Eastheights_HeatherLight" };
function heather(): Geo {
  const rnd = seeded(4501), lobes: Lobe[] = [];
  for (let i = 0; i < 5; i++) {
    const a = rnd() * TAU, d = i ? 22 + rnd() * 26 : 0;
    lobes.push([Math.cos(a) * d * 1.4 + 15, Math.sin(a) * d, 17 + rnd() * 7, 40 + rnd() * 12, 32 + rnd() * 9, 19 + rnd() * 5]);
  }
  lobes.push([-50, 4, 12, 38, 25, 13]);
  const sh = new Sheet();
  blades(sh, 4503, 16, { rx: 90, ry: 60, h0: 25, h1: 45, lean: 0.6, ring: 0.75 });
  return merge(shrub({ seed: 4505, lobes, leaf: 17, look: HEATHER, ragged: 0.45, core: 0.8, density: 0.62, sun: 0.12, stems: { mat: "Eastheights_Bark", r: 1.6, n: 4 } }), sh.geo());
}

// A pine grown crooked in the wind (4.9 x 2.6 m, 4.2 m high): its trunk bowed downwind (-X), the
// live branches all streaming out on the lee side in a flat-topped flag of needles, the windward
// side bare but for dead stubs bleached grey, its roots gripping a rock. The trunk's foot is at
// (170, 0).
const PINE: ShrubLook = { core: "Eastheights_PineCore", dark: "Eastheights_PineDark", mid: "Eastheights_Pine", light: "Eastheights_PineLight" };
function bentTreeGeo(seed = 4601): Geo {
  const rnd = seeded(seed), parts: Geo[] = [];
  const trunk: V3[] = [[0, 0, 0], [-18, 4, 85], [-62, 8, 180], [-140, 2, 262], [-235, -6, 318], [-320, -4, 342]];
  parts.push(limb(trunk, 24, 6, "Eastheights_Bark", { flare: 0.55, roots: 4, gnarl: 0.55, seed, taper: 0.8 }));
  const on = (t: number): V3 => {
    const c = new THREE.CatmullRomCurve3(trunk.map((p) => new THREE.Vector3(...p)), false, "centripetal").getPointAt(t);
    return [c.x, c.y, c.z];
  };
  // the branches, all to the lee
  for (const [t, side, len] of [[0.42, 1, 170], [0.55, -1, 190], [0.68, 1, 160], [0.8, -1, 140], [0.5, 0.2, 120]] as [number, number, number][]) {
    const p = on(t);
    parts.push(limb([p, [p[0] - len * 0.45, p[1] + side * len * 0.35, p[2] + 18], [p[0] - len, p[1] + side * len * 0.5, p[2] + 6 + rnd() * 14]], 7, 1.6, "Eastheights_Bark", { seed: seed + t * 100 }));
  }
  // dead stubs on the windward side
  for (const [t, side] of [[0.35, 1], [0.48, -1], [0.62, 0.4], [0.74, -0.6]] as [number, number][]) {
    const p = on(t);
    parts.push(limb([p, [p[0] + 30 + rnd() * 20, p[1] + side * 25, p[2] + 12], [p[0] + 60 + rnd() * 25, p[1] + side * 40, p[2] + 6]], 4, 1, "Eastheights_BarkBleached", { seed: seed + 300 + t * 100 }));
  }
  // the roots over a rock on the windward side
  parts.push(stone([90, 80, 50], 0.35, seed + 7, "Eastheights_GraniteDark", [55, 25, -6], 30));
  for (const a of [0.3, 1.4, 2.6, 4.4]) parts.push(limb([[0, 0, 12], [Math.cos(a) * 50, Math.sin(a) * 50, 10], [Math.cos(a) * 90, Math.sin(a) * 90, -2]], 6, 2, "Eastheights_Bark", { seed: seed + a * 10 }));
  // the flag of needles
  const lobes: Lobe[] = [
    [-120, 28, 252, 105, 78, 40], [-205, -36, 300, 118, 84, 42], [-300, 8, 342, 98, 70, 36],
    [-62, -28, 205, 78, 58, 32], [-185, 58, 228, 78, 54, 30], [-330, -40, 318, 70, 50, 28],
  ];
  parts.push(shrub({ seed: seed + 9, lobes, leaf: 30, look: PINE, ragged: 0.5, core: 0.78, density: 0.42 }));
  return translate(merge(...parts), [170, 0, 0]);
}

// ---- the wind-cut rocks ----
// A mushroom rock (4.2 x 3.4 m, 4.1 m high): a cap of hard stone the wind has left standing on a
// waist of softer beds it has worn away, banded buff and rust; slabs and grit fallen round its
// foot, lichen on the cap.
function windRockMushroom(): Geo {
  const W = "Eastheights_Windstone", WD = "Eastheights_WindstoneDark";
  const stem = beds(merge(
    stone([310, 265, 120], 0.25, 4701, W, [0, 0, -12], 0, true),
    stone([175, 150, 150], 0.3, 4702, W, [12, 0, 58], 20),
    stone([112, 100, 120], 0.25, 4703, W, [0, 6, 186], 50),
  ), 26, 3, 0.3);
  const cap = beds(rotateY(stone([430, 340, 150], 0.25, 4704, WD, [-20, 0, 0], 10, true), 6), 20, 5, 0.2);
  const capAt = translate(cap, [0, 0, 286]);
  const sh = new Sheet();
  blades(sh, 4709, 34, { rx: 240, ry: 210, h0: 25, h1: 50, lean: 0.6, ring: 0.65 });
  return merge(
    stem, capAt,
    lichenSpots(capAt, 29, 12, "Eastheights_LichenGold"),
    stone([120, 90, 40], 0.3, 4705, W, [-200, 90, -4], 30, true),
    stone([90, 70, 34], 0.3, 4706, WD, [150, -150, -4], 70, true),
    stone([70, 60, 50], 0.35, 4707, W, [-120, -170, 0], 10),
    pebbles(4708, [0, 0], 220, 190, 10, 15, "Eastheights_Windstone"),
    sh.geo(),
  );
}

// A wind-cut arch (7.4 x 3 m, 4.9 m high): two legs of banded stone and the span the wind has
// hollowed out under, open along X so a way runs through it; scree and slabs at its feet.
function windRockArch(): Geo {
  const W = "Eastheights_Windstone", WD = "Eastheights_WindstoneDark";
  const leg = (s: number, seed: number): Geo => merge(
    stone([215, 180, 175], 0.28, seed, W, [10, s * 255, 0], 10),
    stone([175, 150, 150], 0.28, seed + 1, W, [-6, s * 245, 140], -15),
    stone([185, 165, 140], 0.25, seed + 2, WD, [4, s * 220, 262], 25),
  );
  const span = merge(
    stone([215, 560, 150], 0.2, 4721, WD, [0, 0, 340], 0),
    stone([150, 190, 120], 0.25, 4722, W, [0, -150, 300], 20),
    stone([150, 190, 120], 0.25, 4723, W, [0, 150, 300], -20),
  );
  const all = beds(merge(leg(-1, 4711), leg(1, 4715), span), 24, 9, 0.28);
  const sh = new Sheet();
  blades(sh, 4729, 40, { rx: 360, ry: 200, h0: 25, h1: 50, lean: 0.6, keep: (x, y) => Math.abs(y) > 140 || Math.abs(x) > 140 });
  return merge(
    all,
    lichenSpots(span, 31, 10, "Eastheights_LichenGold"),
    stone([110, 80, 36], 0.3, 4725, W, [-170, 360, -4], 20, true),
    stone([80, 70, 50], 0.35, 4726, WD, [160, -380, 0], 60),
    pebbles(4727, [0, -250], 160, 120, 6, 15, W),
    pebbles(4728, [0, 250], 160, 120, 6, 15, W),
    sh.geo(),
  );
}

// ---- the old peoples' and the nomads' things ----
// The great barrow of the horse lords (16 x 15 m, 4.6 m high): a round mound of turf in a kerb of
// great stones, some cut with spirals; a passage of standing stones roofed with capstones runs
// out of it to the front (-X), its mouth dark between two portal stones under a lintel, a
// forecourt of flags and two guardian stones before it; on the top a broken stela with a blue
// scarf round it and a heap of offering stones; the grass on it laid over by the wind.
function burialMound(): Geo {
  const R = 680, H = 430, rnd = seeded(4801), parts: Geo[] = [], sh = new Sheet();
  const M = "Eastheights_Megalith", MD = "Eastheights_MegalithDark";
  const hAt = (r: number) => (r >= R ? 0 : H * Math.pow(Math.cos(((r / R) * Math.PI) / 2), 0.85));
  // the mound
  const prof: [number, number][] = [];
  for (let i = 0; i <= 14; i++) {
    const r = R + 30 - ((R + 30) * i) / 14;
    prof.push([Math.max(0.01, r), r > R ? 0 : hAt(r)]);
  }
  const mound = lathe(prof, 28, "Eastheights_Turf");
  shade(mound, (p) => {
    const r = Math.hypot(p.x, p.y);
    return (0.82 + 0.18 * Math.min(1, p.z / 140)) * (0.9 + 0.2 * noise3(p.x / 160, p.y / 160, 0, 3)) * (r > R - 40 ? 0.85 : 1);
  });
  parts.push(mound);
  // the kerb (open where the passage comes out)
  const N = 30;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU + 0.05;
    if (Math.abs(((a - Math.PI + TAU) % TAU) - 0) < 0.14 || Math.abs(((a - Math.PI + TAU) % TAU) - TAU) < 0.14) continue;
    const r = R + 25, at: V3 = [Math.cos(a) * r, Math.sin(a) * r, -6];
    const s = 0.85 + rnd() * 0.3;
    parts.push(translate(rotateZ(rock([62 * s, 135 * s, 96 * s], 0.22, 4810 + i, i % 3 ? M : MD), a * DEG), at));
    if (i % 4 === 1) {
      // a spiral cut on its outer face
      const sp: Geo[] = [];
      for (let k = 0; k < 3; k++) sp.push(translate(rotateY(torus(9 + k * 7, 1.6, 14, 4, "Eastheights_Carving"), 90), [0, 0, 0]));
      parts.push(translate(rotateZ(merge(...sp), a * DEG), [Math.cos(a) * (r + 30 * s), Math.sin(a) * (r + 30 * s), 48 * s]));
    }
  }
  // the passage: two rows of orthostats roofed with capstones, from inside the mound out to the
  // portal; its inside dark
  const X0 = -R + 140, X1 = -R - 300;
  parts.push(boxBounds([X1 + 10, -62, 0], [X0, 62, 172], "Eastheights_Dark"));
  for (let k = 0; k < 4; k++) {
    const x = X0 - 40 - k * 112;
    for (const s of [-1, 1]) parts.push(translate(rotateZ(rock([105, 40, 185], 0.18, 4850 + k * 2 + (s > 0 ? 1 : 0), k % 2 ? M : MD), 90), [x, s * 86, -8]));
    parts.push(stone([120, 240, 46], 0.2, 4860 + k, MD, [x, 0, 166], 5 * (k - 1.5), true));
  }
  // turf over the inner capstones, grassing over into the mound
  parts.push(ellipsoid([170, 160, 40], [-R + 60, 0, 178], "Eastheights_Turf", 10));
  // the portal: two tall stones and a lintel, the forecourt's flags and its guardians
  for (const s of [-1, 1]) parts.push(translate(rotateZ(rock([62, 50, 240], 0.15, 4870 + (s > 0 ? 1 : 0), M), 0), [X1 - 20, s * 98, -8]));
  parts.push(stone([84, 300, 62], 0.15, 4872, MD, [X1 - 20, 0, 222], 0, true));
  for (let k = 0; k < 7; k++) {
    const a = Math.PI + (k - 3) * 0.32, r = 160 + rnd() * 120;
    parts.push(stone([110 + rnd() * 40, 80 + rnd() * 30, 22], 0.2, 4880 + k, "Eastheights_Granite", [X1 - 60 + Math.cos(a) * r, Math.sin(a) * r * 1.2, -6], rnd() * 90, true));
  }
  for (const s of [-1, 1]) parts.push(translate(rotateZ(rock([70, 58, 260], 0.18, 4890 + (s > 0 ? 1 : 0), M), 20 * s), [X1 - 300, s * 280, -8]));
  // on the top: the broken stela, its scarf, a heap of offering stones
  const stelaUp = translate(rotateY(merge(boxAt([42, 54, 150], [0, 0, 0], M, 6)), 5), [30, 0, H - 14]);
  parts.push(stelaUp, translate(rotateY(rotateZ(boxAt([38, 52, 44], [0, 0, 0], M, 5), 20), 70), [-60, 40, H - 30]));
  parts.push(boxAt([46, 58, 10], [32, 0, H + 96], "Eastheights_ScarfBlue", 2));
  streamer(sh, "Eastheights_ScarfBlue", [8, -10, H + 100], 110, 16, 60, 4895);
  streamer(sh, "Eastheights_ScarfWhite", [8, 14, H + 96], 90, 13, 50, 4896);
  for (let k = 0; k < 12; k++) {
    const a = rnd() * TAU, d = 40 + rnd() * 50;
    parts.push(stone([26 + rnd() * 18, 22 + rnd() * 14, 18 + rnd() * 10], 0.4, 4900 + k, k % 2 ? "Eastheights_Granite" : M, [30 + Math.cos(a) * d, Math.sin(a) * d, hAt(d) - 8 + (k > 8 ? 14 : 0)], rnd() * 90));
  }
  parts.push(bowl(16, [X1 - 80, 40, 0], "Eastheights_Brass"));
  // the wind-laid grass on the mound and round the kerb
  blades(sh, 4920, 260, { rx: R - 30, ry: R - 30, h0: 30, h1: 58, lean: 0.7, floor: (x, y) => hAt(Math.hypot(x, y)) + 1, keep: (x, y) => !(x < -R + 260 && Math.abs(y) < 160) && Math.hypot(x - 30, y) > 110 });
  blades(sh, 4921, 70, { rx: R + 140, ry: R + 140, h0: 30, h1: 60, lean: 0.65, ring: 0.93, keep: (x, y) => !(x < 0 && Math.abs(y) < 220) });
  parts.push(sh.geo());
  return merge(...parts);
}

// The warrior's face (2.6 x 2.2 m, 4.1 m high): a standing block of granite with the face of a
// helmeted warrior carved on its front (-X) in deep relief: the helmet's peak, crest and cheek
// guards, a heavy brow over deep eyes, the nose, a drooping moustache and a square beard; below,
// his hands crossed on a sword and his belt; runes cut down its sides. The wind has worn it soft
// and lichen grows over the helmet; a blue scarf hangs from its shoulder; stones, a bowl and a
// yak's horns lie at its foot as offerings.
function warriorStone(): Geo {
  const M = "Eastheights_Megalith", MD = "Eastheights_MegalithDark", C = "Eastheights_Carving";
  const D = 112, W = 152, HB = 352, F = -D / 2, parts: Geo[] = [], sh = new Sheet(), rnd = seeded(5001);
  const block = merge(boxAt([D, W, HB], [0, 0, -10], M, 16), ellipsoid([D / 2, W / 2, 46], [0, 0, HB - 18], M, 12));
  footShade(block, 90, 0.35);
  parts.push(block);
  const relief: Geo[] = [];
  // the helmet: its peak, crest, rim and cheek guards
  for (const s of [-1, 1]) relief.push(beamBetween([F - 6, s * 64, 284], [F - 6, 0, 336], 12, 11, M));
  relief.push(beamBetween([F - 9, 0, 286], [F - 6, 0, 334], 8, 8, MD));
  relief.push(box([14, 140, 15], [F - 7, 0, 288], MD, 3));
  for (const s of [-1, 1]) relief.push(box([12, 22, 74], [F - 7, s * 60, 246], MD, 3));
  // the face: brow, deep eyes, nose, moustache, mouth, beard
  relief.push(box([18, 102, 17], [F - 9, 0, 270], M, 4));
  for (const s of [-1, 1]) {
    relief.push(ellipsoid([5, 17, 10], [F - 2, s * 23, 252], C, 8));
    relief.push(ellipsoid([4, 9, 6], [F - 5, s * 23, 252], M, 8));
    relief.push(translate(rotateX(ellipsoid([11, 31, 8], [0, 0, 0], M, 8), s * -22), [F - 11, s * 24, 207]));
  }
  relief.push(translate(rotateY(boxAt([20, 20, 46], [0, 0, 0], M, 4), -8), [F - 10, 0, 206]));
  for (const s of [-1, 1]) relief.push(sphereCenter(3, [F - 19, s * 6, 209], C, 5));
  relief.push(box([4, 34, 4], [F - 4, 0, 198], C));
  relief.push(box([15, 72, 44], [F - 8, 0, 172], M, 5));
  for (const y of [-24, -8, 8, 24]) relief.push(box([4, 3, 36], [F - 16, y, 170], C));
  // the hands crossed on the sword, the belt
  for (const s of [-1, 1]) {
    relief.push(beamBetween([F - 6, s * 68, 148], [F - 11, -s * 12, 110], 19, 15, M));
    relief.push(ellipsoid([10, 15, 11], [F - 13, -s * 12, 108], M, 8));
  }
  relief.push(box([9, 9, 30], [F - 15, 0, 124], MD, 2), box([9, 54, 9], [F - 15, 0, 98], MD, 2));
  relief.push(box([7, 15, 104], [F - 12, 0, 40], M, 2), box([3, 3, 90], [F - 16, 0, 42], C));
  relief.push(box([10, 154, 14], [F - 4, 0, 132], MD, 3), box([9, 22, 19], [F - 10, 0, 132], MD, 2));
  const reliefG = merge(...relief);
  parts.push(reliefG);
  // runes down the sides
  for (const s of [-1, 1])
    for (let k = 0; k < 8; k++) {
      const z = 60 + k * 30, y = s * (W / 2 + 1);
      parts.push(box([3, 4, 18], [-10 + (k % 2) * 16, y, z], C), box([16, 4, 3], [0, y, z + (k % 3) * 6 - 6], C));
      if (k % 2) parts.push(beamBetween([-14, y, z - 8], [10, y, z + 8], 3, 4, C));
    }
  // weathering: lichen over the helmet and the top
  parts.push(lichenSpots(merge(block, reliefG), 37, 12, "Eastheights_LichenGold"));
  parts.push(lichenSpots(block, 41, 5, "Eastheights_LichenGrey"));
  // packing stones round its foot
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * TAU + rnd() * 0.3, r = 120 + rnd() * 30;
    if (Math.cos(a) < -0.8) continue;
    parts.push(stone([56 + rnd() * 30, 46 + rnd() * 20, 34 + rnd() * 16], 0.35, 5010 + k, k % 2 ? "Eastheights_Granite" : MD, [Math.cos(a) * r * 0.75, Math.sin(a) * r, -4], rnd() * 90));
  }
  // the offerings before it: stones, a bowl, the horns of a yak, a scarf on the shoulder
  for (let k = 0; k < 7; k++) parts.push(stone([18 + rnd() * 12, 16 + rnd() * 10, 14], 0.4, 5030 + k, "Eastheights_Granite", [F - 70 + rnd() * 40, -50 + rnd() * 100, -2], rnd() * 90));
  parts.push(bowl(15, [F - 55, 55, 0], "Eastheights_Brass"), bowl(12, [F - 80, -20, 0]));
  parts.push(ellipsoid([22, 16, 12], [F - 95, -70, 8], "Eastheights_Bone", 8));
  for (const s of [-1, 1]) parts.push(limb([[F - 95, -70 + s * 12, 12], [F - 92, -70 + s * 48, 26], [F - 105, -70 + s * 62, 52], [F - 120, -70 + s * 52, 66]], 5.5, 1.2, "Eastheights_Bone", { seed: 5040 + s }));
  parts.push(boxAt([D + 8, 24, 12], [0, W / 2 - 20, HB - 70], "Eastheights_ScarfBlue", 2));
  streamer(sh, "Eastheights_ScarfBlue", [F - 2, W / 2 - 14, HB - 60], 120, 15, 150, 5051, 5, [0, 1, 0.2]);
  streamer(sh, "Eastheights_ScarfWhite", [F - 2, W / 2 - 28, HB - 64], 90, 12, 110, 5052, 4, [0, 1, 0.2]);
  blades(sh, 5060, 50, { rx: 200, ry: 190, h0: 28, h1: 55, lean: 0.6, ring: 0.62, keep: (x, y) => !(x < -90 && Math.abs(y) < 110) });
  parts.push(sh.geo());
  return merge(...parts);
}

// The nomads' shrine, an ovoo (9.6 x 9.6 m with its ropes; the cairn 3.8 m across, 4.3 m to the
// top of its pole): a cone of stones every traveller has added to, a sheaf of poles and
// branches standing out of its top hung with blue and white scarves streaming downwind (-X), a
// yak's skull with its horns on the stones, offering bowls on a flat stone before it; ropes of
// prayer flags run from the tallest pole down to stakes in the turf all round.
const FLAGS = ["Eastheights_ScarfBlue", "Eastheights_ScarfWhite", "Eastheights_FlagRed", "Eastheights_FlagGreen", "Eastheights_FlagYellow"];
function flagString(sh: Sheet, pts: V3[], seed: number, w = 20, h = 24): void {
  const rnd = seeded(seed);
  let k = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, uz = (b[2] - a[2]) / L;
    for (let t = 6; t + w < L; t += w + 6) {
      const p: V3 = [a[0] + ux * t, a[1] + uy * t, a[2] + uz * t], q: V3 = [p[0] + ux * w, p[1] + uy * w, p[2] + uz * w];
      const blow = 9 + rnd() * 9;
      sh.quad(FLAGS[k++ % FLAGS.length], p, q, [q[0] - blow, q[1], q[2] - h], [p[0] - blow * 0.9, p[1], p[2] - h - 1], [1, 1, 0.82, 0.82], null, true);
    }
  }
}
function nomadShrine(): Geo {
  const rnd = seeded(5101), parts: Geo[] = [], sh = new Sheet();
  // the cairn: a cone of rubble clad in stones
  parts.push(shade(lathe([[190, 0], [175, 40], [140, 100], [95, 160], [50, 205], [10, 225]], 14, "Eastheights_GraniteDark"), (p) => 0.75 + 0.25 * noise3(p.x / 30, p.y / 30, p.z / 30, 5)));
  const rings: [number, number, number][] = [[178, 18, 16], [150, 70, 13], [112, 125, 10], [70, 175, 7], [32, 210, 4]];
  rings.forEach(([r, z, n], j) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + j * 0.4 + rnd() * 0.2, s = 46 + rnd() * 26 - j * 4;
      parts.push(stone([s, s * 0.8, s * 0.65], 0.4, 5110 + j * 20 + i, rnd() < 0.35 ? "Eastheights_Granite" : rnd() < 0.5 ? "Eastheights_Megalith" : "Eastheights_GraniteDark", [Math.cos(a) * r, Math.sin(a) * r, z - s * 0.3], rnd() * 180));
    }
  });
  // the poles and branches, wrapped and hung with scarves
  const TOP: V3 = [0, 0, 430];
  parts.push(cylinderBetween([0, 0, 150], TOP, 5.5, 6, "Eastheights_Pole", 4));
  for (const a of [0, 120, 240]) parts.push(cylinderBetween([0, 0, TOP[2] - 4], [Math.cos(a / DEG) * 10, Math.sin(a / DEG) * 10, TOP[2] + 36], 1.4, 4, "Eastheights_Iron"));
  parts.push(sphereCenter(4, [0, 0, TOP[2] + 2], "Eastheights_Brass", 6));
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * TAU + rnd() * 0.3, h = 150 + rnd() * 120, r = 55 + rnd() * 50;
    const tip: V3 = [Math.cos(a) * r, Math.sin(a) * r, 200 + h * 0.75];
    parts.push(cylinderBetween([Math.cos(a) * 20, Math.sin(a) * 20, 190], tip, 3, 5, i % 3 ? "Eastheights_Pole" : "Eastheights_BarkBleached", 1.5));
    streamer(sh, i % 4 === 3 ? "Eastheights_ScarfWhite" : i % 5 === 2 ? "Eastheights_FlagYellow" : "Eastheights_ScarfBlue", tip, 70 + rnd() * 70, 11, 40 + rnd() * 30, 5150 + i, 4, norm([Math.sin(a), -Math.cos(a), 0.3]));
  }
  for (let k = 0; k < 4; k++) streamer(sh, k % 2 ? "Eastheights_ScarfWhite" : "Eastheights_ScarfBlue", [0, (k - 1.5) * 4, 330 + k * 22], 120, 14, 60, 5170 + k, 5);
  for (let k = 0; k < 3; k++) parts.push(boxAt([14, 14, 10], [0, 0, 300 + k * 30], "Eastheights_ScarfBlue", 2));
  // the yak's skull with its horns, on the stones toward the front
  parts.push(ellipsoid([24, 16, 14], [-96, -52, 150], "Eastheights_Bone", 8));
  for (const s of [-1, 1]) parts.push(limb([[-92, -52 + s * 12, 158], [-86, -52 + s * 46, 172], [-98, -52 + s * 64, 200], [-112, -52 + s * 56, 214]], 5.5, 1.2, "Eastheights_Bone", { seed: 5180 + s }));
  // the offering stone before it, bowls on it
  parts.push(stone([110, 80, 40], 0.2, 5185, "Eastheights_Megalith", [-245, 0, -4], 0, true));
  parts.push(bowl(12, [-245, -20, 26], "Eastheights_Brass"), bowl(10, [-235, 22, 26]), bowl(9, [-262, 6, 26], "Eastheights_Brass"));
  // the ropes of flags to the stakes all round
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU + 0.5, r = 460 + rnd() * 30, stake: V3 = [Math.cos(a) * r, Math.sin(a) * r, 0];
    parts.push(cylinderBetween(stake, [stake[0], stake[1], 60], 3, 5, "Eastheights_Pole"));
    for (let j = 0; j < 4; j++) parts.push(stone([22, 18, 16], 0.4, 5190 + k * 4 + j, "Eastheights_Granite", [stake[0] + Math.cos(j * 1.6) * 16, stake[1] + Math.sin(j * 1.6) * 16, -2], j * 40));
    const pts = sagging([0, 0, TOP[2] - 20], [stake[0], stake[1], 58], 30, 10);
    parts.push(rope(pts, 0.9));
    flagString(sh, pts, 5200 + k, 16, 20);
  }
  blades(sh, 5220, 60, { rx: 300, ry: 300, h0: 28, h1: 55, lean: 0.6, ring: 0.68, keep: (x, y) => !(x < -170 && Math.abs(y) < 90) });
  parts.push(sh.geo());
  return merge(...parts);
}

// A herder's tent of black yak hair (6.4 x 5 m, 9.6 x 9 m with its ropes, 2.7 m to the ridge
// poles): the woven cloth pitched low and wide over two poles, a slit along its ridge for the
// smoke, the front (-X) thrown open on the dark inside; ropes run from its eaves up over little
// props and down to pegs all round. Behind it a crescent wall of dried dung cakes breaks the
// wind; a churn, a stack of cakes and a saddle bag by the door, smoke from the slit.
function herderTent(): Geo {
  const sh = new Sheet(), parts: Geo[] = [], F = "Eastheights_YakFelt", S = "Eastheights_YakStripe";
  const X = 300, Y = 235, ZR = 238, ZE = 118, SL = 16;
  // the roof's two slopes, sagging between the ropes
  const xs = [-X, -X / 2, 0, X / 2, X];
  for (const s of [-1, 1])
    for (let i = 0; i + 1 < xs.length; i++) {
      const a = xs[i], b = xs[i + 1], m = (a + b) / 2;
      const r0: V3 = [a, s * SL, ZR], r1: V3 = [b, s * SL, ZR], e0: V3 = [a, s * Y, ZE], e1: V3 = [b, s * Y, ZE];
      const mid: V3 = [m, s * (Y * 0.55), ZE + (ZR - ZE) * 0.42 - 10];
      const rm: V3 = [m, s * SL, ZR - 6], em: V3 = [m, s * Y, ZE - 8];
      const q = (p: V3[], sd: number[]) => (s > 0 ? sh.quad(F, p[0], p[1], p[2], p[3], [sd[0], sd[1], sd[2], sd[3]]) : sh.quad(F, p[0], p[3], p[2], p[1], [sd[0], sd[3], sd[2], sd[1]]));
      // (each span in four: ridge to the sag in the middle to the eave)
      q([r0, rm, mid, [a, s * Y * 0.55, ZE + (ZR - ZE) * 0.45]], [1, 0.95, 0.85, 0.9]);
      q([rm, r1, [b, s * Y * 0.55, ZE + (ZR - ZE) * 0.45], mid], [0.95, 1, 0.9, 0.85]);
      q([[a, s * Y * 0.55, ZE + (ZR - ZE) * 0.45], mid, em, e0], [0.9, 0.85, 0.75, 0.8]);
      q([mid, [b, s * Y * 0.55, ZE + (ZR - ZE) * 0.45], e1, em], [0.85, 0.9, 0.8, 0.75]);
    }
  // the seams of lighter yarn down the slopes
  for (const s of [-1, 1])
    for (let x = -X + 40; x < X; x += 75) sh.quad(S, [x - 4, s * SL, ZR + 1.5], [x + 4, s * SL, ZR + 1.5], [x + 4, s * Y, ZE + 1.5], [x - 4, s * Y, ZE + 1.5], [1, 1, 0.9, 0.9], [0, s * 0.45, 0.9], true);
  // the hipped ends: the back closed, the front open
  for (const [x, out] of [[X, 1], [-X, -1]] as [number, number][]) {
    const tip: V3 = [x + out * 70, 0, ZE + 8];
    sh.tri(F, [x, SL, ZR], [x, -SL, ZR], tip, [0.9, 0.9, 0.8], null, true);
    for (const s of [-1, 1]) sh.tri(F, [x, s * SL, ZR], tip, [x, s * Y, ZE], [0.95, 0.85, 0.8], null, true);
  }
  // the walls hanging from the eaves (open at the front)
  for (const s of [-1, 1]) for (let i = 0; i + 1 < xs.length; i++) sh.quad(F, [xs[i], s * Y, ZE], [xs[i + 1], s * Y, ZE], [xs[i + 1], s * (Y + 14), 2], [xs[i], s * (Y + 14), 2], [0.8, 0.8, 0.55, 0.55], null, true);
  for (const s of [-1, 1]) sh.quad(F, [X, s * Y, ZE], [X + 70, 0, ZE + 8], [X + 84, 0, 2], [X + 10, s * (Y + 14), 2], [0.8, 0.8, 0.55, 0.55], null, true);
  // the front flaps thrown back, the dark inside
  for (const s of [-1, 1]) sh.quad(F, [-X, s * 60, ZE + 4], [-X, s * Y, ZE], [-X - 30, s * (Y + 40), 2], [-X - 60, s * 80, 2], [0.85, 0.8, 0.6, 0.6], null, true);
  parts.push(boxBounds([-X + 10, -Y + 15, 0], [X - 10, Y - 15, ZE + 40], "Eastheights_Dark"));
  parts.push(boxBounds([-X + 8, -60, 0], [-X + 14, 60, ZE + 50], "Eastheights_Dark"));
  // the ridge poles showing in the slit, a pole each end standing through it
  parts.push(beamBetween([-X, 0, ZR - 6], [X, 0, ZR - 6], 9, 9, "Eastheights_Pole"));
  for (const x of [-X + 70, X - 70]) parts.push(cylinderBetween([x, 0, 0], [x, 0, ZR + 30], 5, 6, "Eastheights_Pole"));
  // the ropes: from the eaves up over props and down to pegs
  const ropes: [V3, V3][] = [];
  for (const s of [-1, 1]) for (const x of xs) ropes.push([[x, s * Y, ZE], [x * 1.08, s * 1, 0]]);
  for (const [x, out] of [[X, 1], [-X, -1]] as [number, number][]) ropes.push([[x + out * 70, 0, ZE + 8], [out, 0, 0]]);
  for (const [e, d] of ropes) {
    const dir = norm([d[0] === 0 ? 0 : d[0] * (Math.abs(d[1]) > 0 ? 0.25 : 1), d[1], 0]);
    const prop: V3 = [e[0] + dir[0] * 150, e[1] + dir[1] * 150, ZE + 95], peg: V3 = [e[0] + dir[0] * 330, e[1] + dir[1] * 330, 4];
    parts.push(cylinderBetween([prop[0], prop[1], 0], prop, 2.6, 5, "Eastheights_Pole"));
    parts.push(rope([e, prop, peg], 1.1));
    parts.push(cylinderBetween([peg[0], peg[1], -4], [peg[0] - dir[0] * 6, peg[1] - dir[1] * 6, 22], 2.4, 4, "Eastheights_Pole"));
  }
  // the dung wall behind, a crescent round the back
  for (let k = 0; k < 11; k++) {
    const a = -1.15 + (k / 10) * 2.3, r = 470;
    parts.push(translate(rotateZ(boxAt([44, 68, 70 + (k % 3) * 8], [0, 0, 0], "Eastheights_Dung", 6), a * DEG), [Math.cos(a) * r, Math.sin(a) * r * 1.05, 0]));
    for (let j = 0; j < 2; j++) parts.push(translate(cylinderAt({ radius: 15, height: 5, segments: 7, bottom: [0, 0, 0] }, "Eastheights_Dung"), [Math.cos(a) * r + (j - 0.5) * 12, Math.sin(a) * r * 1.05 + (j - 0.5) * 20, 72 + (k % 3) * 8]));
  }
  // by the door: a churn, a stack of cakes, a saddle bag; smoke from the slit
  parts.push(cylinderAt({ rBot: 17, rTop: 15, height: 92, segments: 9, bottom: [-X - 40, 150, 0] }, "Eastheights_Pole"));
  for (const z of [14, 78]) parts.push(translate(torus(17, 2, 10, 4, "Eastheights_Iron"), [-X - 40, 150, z]));
  parts.push(cylinderBetween([-X - 40, 150, 80], [-X - 40, 150, 130], 2, 4, "Eastheights_Pole"));
  for (let j = 0; j < 6; j++) parts.push(cylinderAt({ radius: 16, height: 5, segments: 7, bottom: [-X - 60, -170, j * 5] }, "Eastheights_Dung"));
  parts.push(ellipsoid([28, 18, 16], [-X - 30, -120, 14], "Eastheights_Tassel", 8), ellipsoid([26, 16, 15], [-X - 30, -90, 14], "Eastheights_YakStripe", 8));
  for (let k = 0; k < 3; k++) parts.push(ellipsoid([30 + k * 14, 26 + k * 12, 18 + k * 8], [-40 - k * 40, -k * 8, ZR + 40 + k * 46], "Eastheights_Smoke", 8));
  return merge(...parts, sh.geo());
}

// A string of prayer flags (6 m along Y, 3 m high): a rope sagging between two poles, each held
// up in a heap of stones, square flags in blue, white, red, green and yellow hung all along it,
// blown out toward -X. Strings tile end to end along Y.
function prayerFlags(): Geo {
  const sh = new Sheet(), parts: Geo[] = [], rnd = seeded(5301);
  for (const y of [-300, 300]) {
    parts.push(cylinderBetween([0, y, -6], [0, y, 300], 4.5, 6, "Eastheights_Pole", 3.5), sphereCenter(6, [0, y, 302], "Eastheights_Brass", 6));
    for (let j = 0; j < 6; j++) parts.push(stone([26 + rnd() * 10, 22, 20], 0.4, 5310 + j + (y > 0 ? 10 : 0), "Eastheights_Granite", [Math.cos(j) * 20, y + Math.sin(j) * 20, -2 + (j > 3 ? 14 : 0)], j * 50));
    streamer(sh, "Eastheights_ScarfBlue", [0, y, 292], 80, 10, 40, 5320 + y);
  }
  const pts = sagging([0, -296, 288], [0, 296, 288], 55, 14);
  parts.push(rope(pts, 0.9));
  flagString(sh, pts, 5330, 24, 28);
  return merge(...parts, sh.geo());
}

// =================================== the storm cape ===================================

// The broken signal tower on the point (10 x 9 m with its rubble, 10.4 m high): a round tower of
// grey stone on a plinth, string courses round it, an arched door to the front (-X) with its
// door hanging, slit windows; the top broken off in a jagged ring, the whole seaward (+X) side of
// it fallen in a heap of blocks at its foot; soot streaked down it and the black scar where the
// lightning struck; charred beams sticking out of the top, the signal mast snapped and leaning
// with a rag of its flag, the iron fire basket thrown down among the rubble.
function signalTower(): Geo {
  const parts: Geo[] = [], rnd = seeded(5401), TS = "Eastheights_TowerStone", TD = "Eastheights_TowerDark";
  const R0 = 300, R1 = 272, HT = 740, rAt = (z: number) => R0 + ((R1 - R0) * z) / HT;
  parts.push(cylinderAt({ rBot: 345, rTop: 332, height: 60, segments: 16, bottom: [0, 0, -10] }, TD));
  const body = cylinderAt({ rBot: R0, rTop: R1, height: HT, segments: 18, bottom: [0, 0, 40] }, TS);
  // soot streaks down it, darker toward the top on the seaward side, and the lightning's scar
  shade(body, (p) => {
    const a = Math.atan2(p.y, p.x), streak = noise3(a * 3, p.z / 220, 0, 7);
    return Math.max(0.35, 1 - 0.55 * Math.max(0, streak - 0.45) * 2 * Math.min(1, p.z / 600) - 0.15 * Math.max(0, Math.cos(a)) * (p.z / 780));
  });
  parts.push(body);
  for (const z of [300, 560]) parts.push(translate(torus(rAt(z) + 4, 8, 22, 5, TD), [0, 0, z]));
  // the broken top: a ring of blocks, jagged, fallen away to seaward
  parts.push(cylinderAt({ radius: R1 - 34, height: 6, segments: 18, bottom: [0, 0, HT + 40] }, "Eastheights_Dark"));
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU, sea = Math.cos(a);
    const h = sea > 0.55 ? 0 : sea > 0.1 ? 20 + rnd() * 50 : 60 + rnd() * 200;
    if (h <= 0) continue;
    for (let z = 0; z < h; z += 52) {
      const hh = Math.min(52, h - z) - 2, w = 96 + rnd() * 16;
      parts.push(translate(rotateZ(boxAt([60, w, hh], [0, 0, 0], rnd() < 0.3 ? TD : TS, 4), a * DEG + (rnd() - 0.5) * 6), [Math.cos(a) * (R1 - 28), Math.sin(a) * (R1 - 28), HT + 40 + z]));
    }
  }
  // the door: jambs, an arch, the dark doorway, the door hanging off one hinge
  const DX = -R0 - 2;
  parts.push(boxBounds([DX - 4, -66, 40], [DX + 30, 66, 250], "Eastheights_Dark"));
  for (const s of [-1, 1]) parts.push(boxBounds([DX - 14, s * 66 - 14, 40], [DX + 16, s * 66 + 14, 250], TD, 3));
  parts.push(translate(rotateY(rotateX(torus(70, 14, 12, 5, TD), 90), 0), [DX - 2, 0, 250]));
  parts.push(translate(rotateZ(boxAt([8, 108, 196], [0, 54, 0], "Eastheights_Plank", 2), -38), [DX - 4, -58, 46]));
  for (const z of [90, 200]) parts.push(translate(rotateZ(box([10, 104, 7], [0, 54, 0], "Eastheights_Iron"), -38), [DX - 9, -58, 46 + z - 46]));
  parts.push(boxBounds([DX - 70, -90, -10], [DX + 4, 90, 40], TD, 3));
  // slit windows round it
  for (const [a, z] of [[150, 380], [210, 420], [100, 520], [260, 610], [180, 650], [40, 450]] as [number, number][]) {
    const r = rAt(z) + 1, c: V3 = [Math.cos(a / DEG) * r, Math.sin(a / DEG) * r, z];
    parts.push(translate(rotateZ(merge(box([12, 40, 92], [0, 0, 0], TD, 2), box([6, 16, 74], [-4, 0, 0], "Eastheights_Dark")), a + 180), c));
  }
  // the lightning's scar: a black zigzag down the landward side
  let p: V3 = [Math.cos(2.4) * (R1 + 1), Math.sin(2.4) * (R1 + 1), HT + 30];
  for (let k = 0; k < 9; k++) {
    const z = p[2] - 50 - rnd() * 40, a = 2.4 + (rnd() - 0.5) * 0.25 + (k % 2 ? 0.08 : -0.08), r = rAt(z) + 2;
    const q: V3 = [Math.cos(a) * r, Math.sin(a) * r, z];
    parts.push(beamBetween(p, q, 9 - k * 0.6, 4, "Eastheights_Dark"));
    p = q;
  }
  // charred beams out of the top, the snapped signal mast with its rag of flag
  for (const [a, tilt] of [[1.8, 20], [3.6, -10], [4.6, 30]] as [number, number][]) parts.push(beamBetween([Math.cos(a) * 150, Math.sin(a) * 150, HT + 20], [Math.cos(a) * (R1 + 90), Math.sin(a) * (R1 + 90), HT + 60 + tilt], 22, 20, "Eastheights_Charred"));
  const mast0: V3 = [-60, 30, HT + 20], mast1: V3 = [-260, 150, HT + 330];
  parts.push(cylinderBetween(mast0, mast1, 11, 7, "Eastheights_Charred", 8));
  parts.push(cylinderBetween([-200, 40, HT + 260], [-215, 260, HT + 270], 6, 5, "Eastheights_Pole"));
  const sh = new Sheet();
  sh.quad("Eastheights_FlagRed", [-262, 150, HT + 325], [-258, 152, HT + 270], [-330, 165, HT + 250], [-345, 160, HT + 300], [1, 0.9, 0.8, 0.9], null, true);
  sh.tri("Eastheights_FlagRed", [-330, 165, HT + 250], [-345, 160, HT + 300], [-380, 170, HT + 262], [0.8, 0.9, 0.8], null, true);
  parts.push(sh.geo());
  // the rubble heap to seaward, and the fire basket thrown down in it
  for (let k = 0; k < 24; k++) {
    const a = (rnd() - 0.5) * 1.9, r = R0 + 40 + rnd() * 300, s = 0.6 + rnd() * 0.6, z = Math.max(0, 140 - (r - R0) * 0.45) * rnd();
    parts.push(translate(rotateZ(rotateY(boxAt([58 * s, 92 * s, 50 * s], [0, 0, 0], rnd() < 0.3 ? TD : TS, 4), rnd() * 30), rnd() * 180), [Math.cos(a) * r, Math.sin(a) * r, z - 6]));
  }
  for (let k = 0; k < 6; k++) parts.push(stone([90, 80, 60], 0.35, 5450 + k, "Eastheights_GraniteDark", [Math.cos(k - 2.5) * (R0 + 120 + k * 30), Math.sin(k - 2.5) * (R0 + 120), -6], k * 40));
  const basket: Geo[] = [translate(torus(40, 3, 12, 4, "Eastheights_Rust"), [0, 0, 0]), translate(torus(30, 3, 12, 4, "Eastheights_Rust"), [0, 0, -60])];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU;
    basket.push(cylinderBetween([Math.cos(a) * 40, Math.sin(a) * 40, 0], [Math.cos(a) * 30, Math.sin(a) * 30, -60], 2.2, 4, "Eastheights_Rust"));
  }
  parts.push(translate(rotateY(merge(...basket), 100), [R0 + 200, -160, 40]));
  parts.push(scorchPatch(70, 55, 5460, [R0 + 230, -180]));
  return merge(...parts);
}

// A lightning mast (7.6 x 7.6 m with its stays, 11.6 m high): a tapering lattice of iron on a
// stepped octagonal plinth cut with warding runes, braced crosswise all the way up, crowned with
// a copper spike and three prongs where a blue-white corona crackles; chains to three anchor
// stones hold it against the gale, a copper cable runs down it into the ground; round its foot
// the turf is scorched black, glassy fulgurites branching through it.
function lightningRod(): Geo {
  const parts: Geo[] = [], rnd = seeded(5501), I = "Eastheights_Iron";
  parts.push(cylinderAt({ radius: 120, height: 50, segments: 8, bottom: [0, 0, -10] }, "Eastheights_TowerDark"));
  parts.push(cylinderAt({ rBot: 96, rTop: 90, height: 45, segments: 8, bottom: [0, 0, 40] }, "Eastheights_TowerStone"));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + TAU / 16, r = 93;
    parts.push(translate(rotateZ(merge(box([3, 14, 3], [0, 0, 70], "Eastheights_Fulgurite"), box([3, 3, 22], [0, k % 2 ? 4 : -4, 66], "Eastheights_Fulgurite")), a * DEG), [Math.cos(a) * r, Math.sin(a) * r, 0]));
  }
  // the lattice: four legs, rings and crosses
  const Z0 = 85, Z1 = 1000, legAt = (s: number, t: number, z: number): V3 => {
    const w = 62 + (14 - 62) * ((z - Z0) / (Z1 - Z0));
    return [s * w, t * w, z];
  };
  const corners: [number, number][] = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
  for (const [s, t] of corners) parts.push(cylinderBetween(legAt(s, t, Z0), legAt(s, t, Z1), 5.5, 6, I, 3.5));
  const levels = [Z0 + 40, 230, 370, 500, 620, 730, 830, 920, Z1];
  for (let i = 0; i < levels.length; i++)
    for (let c = 0; c < 4; c++) {
      const [s, t] = corners[c], [s2, t2] = corners[(c + 1) % 4];
      parts.push(cylinderBetween(legAt(s, t, levels[i]), legAt(s2, t2, levels[i]), 2.4, 4, I));
      if (i + 1 < levels.length) {
        parts.push(cylinderBetween(legAt(s, t, levels[i]), legAt(s2, t2, levels[i + 1]), 1.8, 4, I));
        parts.push(cylinderBetween(legAt(s2, t2, levels[i]), legAt(s, t, levels[i + 1]), 1.8, 4, I));
      }
    }
  // the crown: a copper collar, the spike, three prongs with balls, the corona
  parts.push(cylinderAt({ radius: 22, height: 26, segments: 8, bottom: [0, 0, Z1 - 6] }, "Eastheights_Copper"));
  parts.push(cylinderAt({ rBot: 9, rTop: 0.5, height: 150, segments: 8, bottom: [0, 0, Z1 + 20] }, "Eastheights_Copper"));
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * TAU, tip: V3 = [Math.cos(a) * 46, Math.sin(a) * 46, Z1 + 110];
    parts.push(cylinderBetween([0, 0, Z1 + 26], tip, 3.5, 5, "Eastheights_Verdigris", 2), sphereCenter(6, tip, "Eastheights_Copper", 7), sphereCenter(4.5, [tip[0], tip[1], tip[2] + 4], "Eastheights_Arc", 6));
  }
  parts.push(sphereCenter(7, [0, 0, Z1 + 172], "Eastheights_Arc", 8));
  for (let k = 0; k < 7; k++) {
    let p: V3 = [0, 0, Z1 + 170];
    const a = rnd() * TAU, up = 0.2 + rnd() * 0.8;
    for (let j = 0; j < 3; j++) {
      const q: V3 = [p[0] + Math.cos(a + (rnd() - 0.5)) * 18, p[1] + Math.sin(a + (rnd() - 0.5)) * 18, p[2] + (rnd() - 0.3) * 22 * up];
      parts.push(beamBetween(p, q, 1.6, 1.6, "Eastheights_Arc"));
      p = q;
    }
  }
  // the stays: chains to three anchor stones
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * TAU + 0.5, A: V3 = [Math.cos(a) * 360, Math.sin(a) * 360, 0];
    parts.push(stone([80, 70, 60], 0.3, 5510 + k, "Eastheights_GraniteDark", A, a * DEG));
    parts.push(translate(rotateX(torus(8, 2, 8, 4, I), 90), [A[0], A[1], 58]));
    const top: V3 = [Math.cos(a) * 30, Math.sin(a) * 30, 700];
    const pts = sagging(top, [A[0], A[1], 60], 25, 6);
    for (let i = 0; i + 1 < pts.length; i++) parts.push(cylinderBetween(pts[i], pts[i + 1], 1.6, 4, I));
  }
  // the copper cable down a leg into the ground
  parts.push(cylinderBetween([10, 10, Z1], legAt(1, 1, Z0 + 10), 1.6, 4, "Eastheights_Verdigris"), cylinderBetween(legAt(1, 1, Z0 + 10), [110, 110, 0], 1.6, 4, "Eastheights_Verdigris"));
  // the scorched ground and the fulgurites branching through it
  parts.push(scorchPatch(250, 230, 5520));
  for (let k = 0; k < 9; k++) {
    let p: V3 = [Math.cos(k * 0.7) * 120, Math.sin(k * 0.7) * 120, 2.5];
    const a0 = k * 0.7;
    for (let j = 0; j < 4; j++) {
      const a = a0 + (rnd() - 0.5) * 0.9, q: V3 = [p[0] + Math.cos(a) * (40 + rnd() * 30), p[1] + Math.sin(a) * (40 + rnd() * 30), 2.5];
      parts.push(beamBetween(p, q, 3.5 - j * 0.6, 2.4, "Eastheights_Fulgurite"));
      p = q;
    }
  }
  return merge(...parts);
}

// A brig broken in two on the rocks (17 x 8 m, 6 m high): her bow (-X) heeled hard over on one
// side, her stern on the other, the break between them open on her ribs and keel; the hull tarred
// dark with a red strake under the rail, barnacles and weed along her bottom; the foremast snapped
// to a stump, the mainmast down across the rocks with its yard and a torn sail, a hatch and a bit
// of her stern cabin; rocks round her.
function stormWreck(): Geo {
  const parts: Geo[] = [], rnd = seeded(5601);
  const L = 1500, B = 270, D = 300;
  const halfB = (x: number) => {
    const u = x / (L / 2);
    return B * (u < 0 ? Math.pow(Math.max(0, 1 - u * u), 0.55) : Math.pow(Math.max(0, 1 - Math.pow(u, 4)), 0.5) * 0.92 + 0.08 * (1 - u));
  };
  const sheer = (x: number) => 50 * Math.pow(x / (L / 2), 2) + (x < 0 ? 20 * (-x / (L / 2)) : 0);
  const NT = 7, sec = (x: number, t: number, side: number): V3 => {
    const b = halfB(x), q = (t * Math.PI) / 2;
    return [x, side * b * Math.pow(Math.sin(q), 0.7), sheer(x) - D * Math.cos(q) * (0.4 + 0.6 * b / B)];
  };
  // one half's skin from x0 to x1 (strakes ending raggedly toward the break at `brk`)
  const half = (x0: number, x1: number, brk: number, seed: number): Geo => {
    const sh = new Sheet(), r = seeded(seed), st = 75, xsH: number[] = [];
    for (let x = x0; x < x1 - 1; x += st) xsH.push(x);
    xsH.push(x1);
    const reach = Array.from({ length: NT }, () => r() * 2.2);
    for (let i = 0; i + 1 < xsH.length; i++) {
      const a = xsH[i], b = xsH[i + 1];
      for (let j = 0; j < NT; j++) {
        const fromBrk = Math.abs((a + b) / 2 - brk) / st;
        if (fromBrk < reach[j] && j > 0) continue;
        const mat = j >= NT - 2 ? "Eastheights_HullPaint" : "Eastheights_HullTar", s0 = j < 2 ? 0.7 : 1;
        for (const side of [-1, 1]) {
          const p = [sec(a, j / NT, side), sec(b, j / NT, side), sec(b, (j + 1) / NT, side), sec(a, (j + 1) / NT, side)];
          if (side > 0) sh.quad(mat, p[0], p[3], p[2], p[1], [s0, 1, 1, s0]);
          else sh.quad(mat, p[0], p[1], p[2], p[3], [s0, s0, 1, 1]);
        }
      }
    }
    const g = sh.geo();
    // barnacles and weed along her bottom: a darker, greener band
    shade(g, (p) => (p.z < -D * 0.45 ? [0.75, 0.8, 0.7] : 1));
    return g;
  };
  // ribs and keel in the break, the deck of each half, the rail
  const ribs = (xa: number, xb: number): Geo => {
    const out: Geo[] = [];
    for (let x = xa; x <= xb; x += 50) for (const side of [-1, 1]) out.push(limb(Array.from({ length: NT + 1 }, (_, j) => sec(x, j / NT, side)), 7, 5, "Eastheights_Plank", { seg: 5, maxRings: 7 }));
    out.push(beamBetween(sec(xa - 80, 0, 1), sec(xb + 80, 0, 1), 22, 24, "Eastheights_HullTar"));
    return merge(...out);
  };
  const deck = (xa: number, xb: number, holes: number[]): Geo => {
    const out: Geo[] = [];
    for (let x = xa; x < xb; x += 50) {
      if (holes.some((h) => Math.abs(h - x) < 60)) continue;
      const b = Math.min(halfB(x), halfB(x + 50)) * 0.96;
      out.push(boxBounds([x, -b, sheer(x + 25) - 22], [x + 48, b, sheer(x + 25) - 14], "Eastheights_Plank"));
    }
    return merge(...out);
  };
  const rail = (xa: number, xb: number): Geo => {
    const out: Geo[] = [];
    for (const side of [-1, 1]) for (let x = xa; x < xb; x += 75) out.push(beamBetween(sec(x, 1, side), sec(Math.min(xb, x + 75), 1, side), 10, 10, "Eastheights_HullTar"));
    return merge(...out);
  };
  // the bow: forward of the break, heeled over to port
  const bow = merge(
    half(-L / 2, -40, -40, 5611), ribs(-130, -40), deck(-L / 2 + 120, -60, [-400]), rail(-L / 2 + 30, -60),
    cylinderBetween([-L / 2 + 10, 0, sheer(-L / 2) + 10], [-L / 2 - 230, 0, sheer(-L / 2) + 120], 9, 7, "Eastheights_Plank", 5),
    cylinderBetween([-300, 0, sheer(-300) - 20], [-300, 0, sheer(-300) + 150], 18, 8, "Eastheights_Plank"),
    shard([-300, 0, sheer(-300) + 140], [-296, 6, sheer(-300) + 190], 14, "Eastheights_Plank"),
  );
  // the stern: aft of it, heeled the other way, her cabin and hatch
  const stern = merge(
    half(70, L / 2, 70, 5621), ribs(70, 170), deck(110, L / 2 - 40, [420]), rail(110, L / 2 - 20),
    boxBounds([L / 2 - 260, -halfB(L / 2 - 130) * 0.8, sheer(L / 2 - 130) - 16], [L / 2 - 40, halfB(L / 2 - 130) * 0.8, sheer(L / 2 - 130) + 130], "Eastheights_Plank", 3),
    boxBounds([L / 2 - 270, -halfB(L / 2 - 130) * 0.85, sheer(L / 2 - 130) + 128], [L / 2 - 30, halfB(L / 2 - 130) * 0.85, sheer(L / 2 - 130) + 140], "Eastheights_HullTar", 2),
    boxBounds([L / 2 - 272, -50, sheer(L / 2 - 130) + 20], [L / 2 - 266, 50, sheer(L / 2 - 130) + 90], "Eastheights_Dark"),
    boxBounds([240, -70, sheer(260) - 18], [380, 70, sheer(260) + 6], "Eastheights_HullTar", 2),
    boxBounds([250, -60, sheer(260) - 12], [370, 60, sheer(260) + 8], "Eastheights_Dark"),
  );
  parts.push(translate(rotateZ(rotateX(bow, -20), -7), [-70, -50, 175]));
  parts.push(translate(rotateZ(rotateX(stern, 14), 5), [70, 50, 150]));
  // the mainmast down across the rocks with its yard and a torn sail
  const m0: V3 = [160, 120, 120], m1: V3 = [520, 820, 30];
  parts.push(cylinderBetween(m0, m1, 15, 8, "Eastheights_Plank", 11));
  const yc: V3 = [380, 560, 70];
  parts.push(cylinderBetween([yc[0] - 300, yc[1] + 120, 40], [yc[0] + 300, yc[1] - 120, 90], 7, 6, "Eastheights_Plank"));
  const sh = new Sheet();
  sh.quad("Eastheights_Sail", [yc[0] - 280, yc[1] + 112, 40], [yc[0] + 200, yc[1] - 80, 80], [yc[0] + 160, yc[1] + 30, 6], [yc[0] - 250, yc[1] + 220, 6], [1, 1, 0.8, 0.8], null, true);
  sh.tri("Eastheights_Sail", [yc[0] + 200, yc[1] - 80, 80], [yc[0] + 290, yc[1] - 116, 90], [yc[0] + 220, yc[1] - 20, 30], [1, 1, 0.85], null, true);
  for (let k = 0; k < 4; k++) parts.push(cylinderBetween([yc[0] - 200 + k * 120, yc[1] + 80 - k * 48, 50], [yc[0] - 260 + k * 150, yc[1] + 260 - k * 40, 2], 1.2, 4, "Eastheights_Rope"));
  parts.push(sh.geo());
  // the rocks she struck, barnacled and weedy, timbers and a barrel thrown up
  for (let k = 0; k < 7; k++) {
    const a = rnd() * TAU, x = Math.cos(a) * (500 + rnd() * 300), y = Math.sin(a) * (260 + rnd() * 160), s = 0.7 + rnd() * 0.6;
    const r = stone([170 * s, 140 * s, 110 * s], 0.32, 5630 + k, "Eastheights_GraniteDark", [x, y, -10], rnd() * 180);
    parts.push(r, lichenSpots(r, 43 + k, 14, "Eastheights_Barnacle", 5, 12, -0.6));
  }
  for (let k = 0; k < 5; k++) parts.push(translate(rotateZ(boxAt([260 + rnd() * 120, 22, 12], [0, 0, 0], "Eastheights_Plank", 2), rnd() * 180), [-600 + rnd() * 1300, -500 + rnd() * 200 + (k % 2) * 900, 0]));
  parts.push(translate(rotateY(cylinderAt({ rBot: 30, rTop: 30, height: 80, segments: 9, bottom: [0, 0, -40] }, "Eastheights_Plank"), 90), [-500, 380, 30]));
  return merge(...parts);
}

// A tree split by lightning (3 x 2.6 m, 4.6 m high): a dead trunk torn open down its middle, the
// two halves splayed apart, bleached grey outside and charred black where they face each other;
// a broken limb or two, splinters at the tears, the turf burnt round its foot.
function struckTree(): Geo {
  const parts: Geo[] = [];
  const left = limb([[0, -8, 0], [-6, -30, 120], [-10, -70, 240], [-20, -96, 330], [-30, -110, 420]], 16, 5, "Eastheights_BarkBleached", { flare: 0.6, roots: 3, gnarl: 0.5, seed: 5701 });
  const right = limb([[0, 8, 0], [6, 34, 100], [18, 90, 190], [34, 150, 250]], 15, 6, "Eastheights_BarkBleached", { flare: 0.6, roots: 3, gnarl: 0.5, seed: 5702 });
  // the faces toward the split charred
  const char = (s: number) => (_p: THREE.Vector3, n: THREE.Vector3): [number, number, number] => (n.y * s > 0.25 ? [0.18, 0.16, 0.15] : n.y * s > 0 ? [0.55, 0.52, 0.5] : [1, 1, 1]);
  shade(left, char(1));
  shade(right, char(-1));
  parts.push(left, right);
  parts.push(limb([[-14, -80, 270], [-70, -60, 320], [-130, -70, 330]], 6, 2, "Eastheights_BarkBleached", { seed: 5703 }));
  parts.push(limb([[22, 110, 220], [70, 150, 290], [90, 200, 300]], 5, 2, "Eastheights_BarkBleached", { seed: 5704 }));
  for (let k = 0; k < 4; k++) parts.push(shard([-30 + k * 4, -110 + k * 6, 410], [-34 + k * 7, -114 + k * 7, 450 + k * 8], 4, "Eastheights_BarkBleached"));
  for (let k = 0; k < 3; k++) parts.push(shard([34 + k * 5, 148 - k * 8, 246], [40 + k * 6, 160 - k * 4, 278], 4, "Eastheights_Charred"));
  // the fallen top lying by it
  parts.push(limb([[90, -140, 8], [10, -220, 14], [-120, -260, 10]], 10, 4, "Eastheights_BarkBleached", { seed: 5705 }));
  parts.push(scorchPatch(120, 105, 5707));
  parts.push(pebbles(5706, [0, 0], 110, 100, 6, 14));
  return merge(...parts);
}

// =================================== the floating rocks ===================================

// An island of earth torn up out of the ground and hanging in the air: a cap of turf R across
// (wobbling round), its underside a cone of soil and stone `depth` deep in rough beds, boulders
// breaking out of it and roots trailing from it, glowing violet shards at its point; the rim of
// its turf `hover` above the ground. `top(x, y)` is the turf's height there.
function isle(seed: number, R: number, depth: number, hover: number): { geo: Geo; top: (x: number, y: number) => number } {
  const rnd = seeded(seed), parts: Geo[] = [];
  const rimR = (a: number) => R * (1 + 0.3 * (noise3(Math.cos(a) * 1.3 + 5, Math.sin(a) * 1.3, 0, seed) - 0.5) + 0.05 * Math.sin(5 * a + seed));
  const T = R * 0.09, NA = 24, NR = 4, NK = 7;
  const topZ = (t: number, a: number) => T * (1 - t * t) + 6 * (noise3(Math.cos(a) * t * 3, Math.sin(a) * t * 3, 1, seed) - 0.5);
  const top = new Sheet(), under = new Sheet();
  const P = (i: number, t: number): V3 => {
    const a = (i / NA) * TAU, r = rimR(a) * t;
    return [Math.cos(a) * r, Math.sin(a) * r, hover + topZ(t, a)];
  };
  for (let i = 0; i < NA; i++)
    for (let j = 0; j < NR; j++) {
      const t0 = j / NR, t1 = (j + 1) / NR, s0 = 0.95 + 0.1 * (1 - t0), s1 = 0.95 + 0.1 * (1 - t1);
      if (j === 0) top.tri("Eastheights_Turf", P(i, 0), P(i, t1), P(i + 1, t1), [s0, s1, s1]);
      else top.quad("Eastheights_Turf", P(i, t0), P(i, t1), P(i + 1, t1), P(i + 1, t0), [s0, s1, s1, s0]);
    }
  // the grass lip curling over the rim
  for (let i = 0; i < NA; i++) {
    const a0 = (i / NA) * TAU, a1 = ((i + 1) / NA) * TAU, r0 = rimR(a0), r1 = rimR(a1);
    top.quad("Eastheights_TurfDark", P(i, 1), [Math.cos(a0) * (r0 + 10), Math.sin(a0) * (r0 + 10), hover - 22], [Math.cos(a1) * (r1 + 10), Math.sin(a1) * (r1 + 10), hover - 22], P(i + 1, 1), [0.9, 0.6, 0.6, 0.9]);
  }
  // the underside: rings narrowing to the point, jagged
  const U = (i: number, k: number): V3 => {
    const a = (i / NA) * TAU, u = k / NK;
    if (k === NK) return [R * 0.05 * Math.cos(seed), R * 0.05 * Math.sin(seed), hover - depth];
    const j = k === 0 ? 1 : 1 + 0.32 * (noise3(Math.cos(a) * 2, Math.sin(a) * 2, u * 3, seed + 3) - 0.5);
    const r = (rimR(a) + 10) * Math.pow(1 - u, 0.75) * j;
    return [Math.cos(a) * r, Math.sin(a) * r, hover - 22 - (depth - 22) * Math.pow(u, 0.95) + (k ? (rnd() - 0.5) * 16 : 0)];
  };
  const ring: V3[][] = [];
  for (let k = 0; k <= NK; k++) ring.push(Array.from({ length: NA }, (_, i) => U(i, k)));
  for (let k = 0; k < NK; k++)
    for (let i = 0; i < NA; i++) {
      const a = ring[k][i], b = ring[k][(i + 1) % NA], c = ring[k + 1][(i + 1) % NA], d = ring[k + 1][i];
      const bed = (p: V3) => {
        const z = hover - p[2];
        return (0.72 + 0.2 * Math.sin(z / 19 + noise3(p[0] / 80, p[1] / 80, 0, seed) * 3)) * (1 - 0.3 * (z / depth));
      };
      const mat = k >= NK - 2 ? "Eastheights_FloatRock" : k % 3 === 2 ? "Eastheights_SoilDark" : "Eastheights_Soil";
      if (k === NK - 1) under.tri(mat, a, d, b, [bed(a), bed(d), bed(b)]);
      else under.quad(mat, a, d, c, b, [bed(a), bed(d), bed(c), bed(b)]);
    }
  parts.push(top.geo(), under.geo());
  // boulders breaking out of the underside, roots trailing from it
  for (let k = 0; k < Math.round(R / 70); k++) {
    const i = Math.floor(rnd() * NA), kk = 1 + Math.floor(rnd() * (NK - 3)), p = ring[kk][i], s = R * (0.16 + rnd() * 0.12);
    parts.push(stone([s, s * 0.85, s * 0.8], 0.35, seed + 20 + k, "Eastheights_FloatRock", [p[0] * 0.92, p[1] * 0.92, p[2] - s * 0.4], rnd() * 180));
  }
  for (let k = 0; k < Math.round(R / 30); k++) {
    const i = Math.floor(rnd() * NA), kk = Math.floor(rnd() * 3), p = ring[kk][i], len = 60 + rnd() * R * 0.5, a = rnd() * TAU;
    parts.push(limb([p, [p[0] + Math.cos(a) * 15, p[1] + Math.sin(a) * 15, p[2] - len * 0.4], [p[0] + Math.cos(a) * 30, p[1] + Math.sin(a) * 30, p[2] - len * 0.75], [p[0] + Math.cos(a) * 22, p[1] + Math.sin(a) * 22, p[2] - len]], 2.8, 0.6, "Eastheights_Root", { seg: 4, maxRings: 5 }));
  }
  // the violet shards at its point, crumbs falling away under it
  const tip = ring[NK][0];
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU + rnd(), l = 30 + rnd() * R * 0.15;
    parts.push(shard([tip[0], tip[1], tip[2] + 30], [tip[0] + Math.cos(a) * l * 0.6, tip[1] + Math.sin(a) * l * 0.6, tip[2] - l * 0.5 + 10], 7 + rnd() * 5));
  }
  parts.push(ellipsoid([R * 0.22, R * 0.22, R * 0.12], [tip[0], tip[1], tip[2] + 20], "Eastheights_RiftSoft", 9));
  for (let k = 0; k < 7; k++) {
    const a = rnd() * TAU, d = rnd() * R * 0.4, s = 6 + rnd() * 12;
    parts.push(stone([s, s, s * 0.8], 0.5, seed + 60 + k, k % 2 ? "Eastheights_Soil" : "Eastheights_FloatRock", [Math.cos(a) * d, Math.sin(a) * d, tip[2] - 40 - rnd() * (hover - depth) * 0.6], rnd() * 90));
  }
  const topAt = (x: number, y: number) => {
    const a = Math.atan2(y, x), t = Math.min(1, Math.hypot(x, y) / rimR(a));
    return hover + topZ(t, a);
  };
  return { geo: merge(...parts), top: topAt };
}

// A great floating island (7.8 x 7 m, 8.7 m high, its turf 7.6 m up): a crooked pine on it, rocks
// and grass laid over by the wind, its underside of soil and stone trailing roots, violet shards
// at its point.
function floatingIsle(): Geo {
  const { geo, top } = isle(5801, 360, 520, 760);
  const sh = new Sheet();
  blades(sh, 5803, 90, { rx: 330, ry: 300, h0: 26, h1: 50, lean: 0.65, floor: top, keep: (x, y) => Math.hypot(x - 60, y + 30) > 90 });
  return centre(merge(
    geo,
    translate(scale(bentTreeGeo(5805), [0.55, 0.55, 0.55]), [-30, -30, top(60, -30) - 4]),
    stone([110, 90, 70], 0.3, 5806, "Eastheights_Granite", [-170, 150, top(-170, 150) - 10], 30),
    stone([70, 60, 45], 0.35, 5807, "Eastheights_GraniteDark", [150, 170, top(150, 170) - 8], 70),
    sh.geo(),
  ));
}
// A small floating island (3.6 x 3.4 m, 6.9 m high, its turf 6.2 m up): a boulder and wind-laid
// grass on it, roots and a violet shard under it.
function floatingIsleSmall(): Geo {
  const { geo, top } = isle(5821, 170, 300, 620);
  const sh = new Sheet();
  blades(sh, 5823, 34, { rx: 150, ry: 140, h0: 24, h1: 46, lean: 0.65, floor: top });
  return centre(merge(geo, stone([80, 66, 60], 0.3, 5825, "Eastheights_Granite", [20, -10, top(20, -10) - 10], 10), sh.geo()));
}

// Boulders hanging in the air (5.2 x 4.6 m, 5.6 m high): six stones torn out of the ground,
// turned over so their turfed tops hang sideways and their broken undersides show, violet shards
// grown out of them and a glow under each, little stones circling them; the raw pits in the turf
// below where they came from.
function floatingStones(): Geo {
  const parts: Geo[] = [], rnd = seeded(5901), sh = new Sheet();
  const stones: [V3, number, number][] = [[[0, 0, 250], 150, 20], [[-130, 120, 110], 92, 140], [[140, -70, 390], 112, 70], [[100, 150, 300], 72, 210], [[-70, -150, 330], 64, 300], [[-170, -10, 470], 52, 40]];
  stones.forEach(([at, s, turn], i) => {
    const r = rotateZ(rotateX(rock([s, s * 0.85, s * 0.75], 0.32, 5910 + i, i % 2 ? "Eastheights_FloatRock" : "Eastheights_Granite"), 150 + i * 9), turn);
    const placed = translate(r, at);
    parts.push(placed, coverTop(placed, "Eastheights_TurfDark", { amount: 0.1, thick: 2, seed: 50 + i, patches: 0.6 }));
    parts.push(shard([at[0], at[1], at[2] - s * 0.3], [at[0] + (rnd() - 0.5) * 30, at[1] + (rnd() - 0.5) * 30, at[2] - s * 0.6 - 18], 5 + s * 0.04));
    parts.push(ellipsoid([s * 0.32, s * 0.32, s * 0.16], [at[0], at[1], at[2] - s * 0.3], "Eastheights_RiftSoft", 8));
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU + rnd(), d = s * 0.75 + 12;
      parts.push(stone([10, 9, 8], 0.5, 5930 + i * 4 + k, "Eastheights_FloatRock", [at[0] + Math.cos(a) * d, at[1] + Math.sin(a) * d, at[2] + (rnd() - 0.5) * s * 0.5], rnd() * 90));
    }
    // the pit it came from
    const px = at[0] * 0.8 + (rnd() - 0.5) * 30, py = at[1] * 0.8 + (rnd() - 0.5) * 30;
    parts.push(scorchPatch(s * 0.5, s * 0.4, 5940 + i, [px, py], "Eastheights_Soil"));
    parts.push(pebbles(5950 + i, [px, py], s * 0.55, s * 0.45, 5, 10, "Eastheights_Soil"));
  });
  blades(sh, 5970, 44, { rx: 280, ry: 260, h0: 22, h1: 45, lean: 0.6, ring: 0.5 });
  parts.push(sh.geo());
  return centre(merge(...parts));
}

// The ring of stones round the rune pillar (13.8 x 13.8 m, 9 m high): a round dais of three steps
// with a ring of violet runes glowing in it; on it a tall pillar of dark stone, tapering, cut with
// glowing runes up every face, a crystal hanging over its point; round it nine stones of the old
// circle torn from their sockets and circling it in the air on a tilted ring, a trail of pebbles
// behind each and a faint violet ring along their path; the empty sockets in the turf below.
function stoneRing(): Geo {
  const parts: Geo[] = [], rnd = seeded(6001), RS = "Eastheights_RuneStone";
  parts.push(cylinderAt({ radius: 470, height: 30, segments: 24, bottom: [0, 0, -6] }, "Eastheights_MegalithDark"));
  parts.push(cylinderAt({ radius: 395, height: 30, segments: 24, bottom: [0, 0, 24] }, "Eastheights_Megalith"));
  parts.push(cylinderAt({ radius: 315, height: 28, segments: 24, bottom: [0, 0, 54] }, "Eastheights_MegalithDark"));
  parts.push(translate(torus(255, 4, 40, 4, "Eastheights_Rift"), [0, 0, 83]));
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * TAU;
    parts.push(translate(rotateZ(merge(box([4, 22, 3], [0, 0, 83], "Eastheights_Rift"), box([14, 4, 3], [0, k % 2 ? 6 : -6, 83], "Eastheights_Rift")), a * DEG), [Math.cos(a) * 285, Math.sin(a) * 285, 0]));
  }
  // the pillar: a tapering square shaft, its cap, the crystal over it
  const Z0 = 82, HP = 650, r0 = 125, r1 = 78;
  parts.push(rotateZ(cylinderAt({ rBot: r0, rTop: r1, height: HP, segments: 4, bottom: [0, 0, Z0] }, RS), 45));
  parts.push(rotateZ(cylinderAt({ rBot: r1 + 4, rTop: 6, height: 80, segments: 4, bottom: [0, 0, Z0 + HP] }, RS), 45));
  parts.push(shard([0, 0, Z0 + HP + 110], [0, 0, Z0 + HP + 210], 18), shard([0, 0, Z0 + HP + 110], [0, 0, Z0 + HP + 80], 18));
  parts.push(ellipsoid([60, 60, 60], [0, 0, Z0 + HP + 140], "Eastheights_RiftSoft", 10));
  // its runes, a column up each face
  const faceAt = (z: number) => ((r0 + ((r1 - r0) * (z - Z0)) / HP) * Math.SQRT1_2);
  for (let f = 0; f < 4; f++) {
    const a = (f / 4) * TAU;
    for (let k = 0; k < 9; k++) {
      const z = Z0 + 70 + k * 62, d = faceAt(z) + 1.5;
      const g = merge(box([3, 26, 4], [0, 0, z], "Eastheights_Rift"), box([3, 4, 22], [0, k % 2 ? 9 : -9, z + 6], "Eastheights_Rift"), k % 3 ? box([3, 12, 4], [0, 4, z - 12], "Eastheights_Rift") : []);
      parts.push(translate(rotateZ(g, a * DEG), [Math.cos(a) * d, Math.sin(a) * d, 0]));
    }
    parts.push(translate(rotateZ(box([3, 5, 220], [0, 30, Z0 + 260], "Eastheights_Dark"), a * DEG), [Math.cos(a) * (faceAt(Z0 + 260) + 1), Math.sin(a) * (faceAt(Z0 + 260) + 1), 0]));
  }
  // the circling stones on their tilted ring
  const RR = 640, ZR = 340, TILT = 90;
  const zOn = (a: number) => ZR + TILT * Math.sin(a + 0.6);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + 0.2, at: V3 = [Math.cos(a) * RR, Math.sin(a) * RR, zOn(a)];
    const slab = rotateZ(rotateY(rock([66, 130, 175], 0.2, 6010 + i, i % 3 ? "Eastheights_Megalith" : "Eastheights_MegalithDark"), 8 + rnd() * 20), a * DEG + 90 + (rnd() - 0.5) * 30);
    const placed = translate(slab, [at[0], at[1], at[2] - 85]);
    parts.push(placed, lichenSpots(placed, 60 + i, 10, "Eastheights_LichenGold"));
    parts.push(ellipsoid([40, 40, 14], [at[0], at[1], at[2] - 95], "Eastheights_RiftSoft", 8));
    for (let k = 1; k <= 3; k++) {
      const b = a - k * 0.07, s = 14 - k * 3;
      parts.push(stone([s, s, s * 0.8], 0.5, 6030 + i * 3 + k, "Eastheights_Megalith", [Math.cos(b) * RR, Math.sin(b) * RR, zOn(b) - 60 + (rnd() - 0.5) * 30], rnd() * 90));
    }
    // its empty socket in the turf below
    const sx = Math.cos(a) * RR, sy = Math.sin(a) * RR;
    parts.push(translate(rotateZ(scorchPatch(42, 78, 6040 + i, [0, 0], "Eastheights_SoilDark"), a * DEG), [sx, sy, 0]));
    parts.push(pebbles(6050 + i, [sx, sy], 50, 50, 4, 12, "Eastheights_Soil"));
  }
  parts.push(translate(rotateZ(rotateX(torus(RR, 2.5, 64, 4, "Eastheights_RiftSoft"), (Math.atan2(TILT, RR) * 180) / Math.PI), -0.6 * DEG), [0, 0, ZR - 60]));
  const sh = new Sheet();
  blades(sh, 6070, 70, { rx: 690, ry: 690, h0: 24, h1: 48, lean: 0.6, ring: 0.72 });
  parts.push(sh.geo());
  return merge(...parts);
}

// A hollow torn out of the turf (3.6 x 3 m, ground): a pit of raw soil where a stone or a clod of
// earth was pulled up into the air, its rim heaped with torn earth and flaps of turf turned back,
// cut roots sticking out of its sides, stones and crumbs in it, a violet glint or two.
function tornHollow(): Geo {
  const parts: Geo[] = [], rnd = seeded(6101), sh = new Sheet(), RX = 150, RY = 120;
  parts.push(scorchPatch(RX * 1.05, RY * 1.05, 6105, [0, 0], "Eastheights_Soil", 2), scorchPatch(RX * 0.6, RY * 0.6, 6106, [10, -5], "Eastheights_SoilDark", 2.6));
  for (let k = 0; k < 13; k++) {
    if (rnd() < 0.25) continue;
    const a = (k / 13) * TAU + rnd() * 0.3, r = 0.95 + rnd() * 0.2, s = 40 + rnd() * 55, at: V3 = [Math.cos(a) * RX * r, Math.sin(a) * RY * r, -8];
    // a clod of torn earth, its turf still on top
    const clod = stone([s * 1.4, s * 0.8, s * 0.5], 0.45, 6110 + k, k % 3 ? "Eastheights_Soil" : "Eastheights_SoilDark", at, a * DEG + 90 + (rnd() - 0.5) * 40, true);
    parts.push(clod, translate(rotateZ(scale(sphereCenter(1, [0, 0, 0], "Eastheights_TurfDark", 6), [s * 0.42, s * 0.26, 2.5]), a * DEG + 90), [at[0] + Math.cos(a) * 10, at[1] + Math.sin(a) * 10, s * 0.3]));
    if (k % 2 === 0) {
      // a flap of turf turned back over the rim
      const c: V3 = [Math.cos(a) * (RX + 40), Math.sin(a) * (RY + 40), 10], w = 18 + rnd() * 16, u: V3 = [-Math.sin(a) * w, Math.cos(a) * w, 0], o: V3 = [Math.cos(a) * (30 + rnd() * 20), Math.sin(a) * (30 + rnd() * 20), -8];
      sh.quad("Eastheights_Turf", [c[0] - u[0], c[1] - u[1], c[2]], [c[0] + u[0], c[1] + u[1], c[2]], [c[0] + u[0] * 0.7 + o[0], c[1] + u[1] * 0.7 + o[1], c[2] + o[2]], [c[0] - u[0] * 0.8 + o[0], c[1] - u[1] * 0.8 + o[1], c[2] + o[2]], [1, 1, 0.8, 0.8], null, true);
    }
    if (k % 3 === 1) {
      const p: V3 = [Math.cos(a) * RX * 0.92, Math.sin(a) * RY * 0.92, 14];
      parts.push(limb([p, [p[0] * 0.85, p[1] * 0.85, 18], [p[0] * 0.72, p[1] * 0.72, 8]], 2.4, 0.8, "Eastheights_Root", { seg: 4, maxRings: 3 }));
    }
  }
  parts.push(pebbles(6130, [0, 0], RX * 0.55, RY * 0.55, 8, 13, "Eastheights_Soil"));
  parts.push(shard([20, -10, 2], [26, -6, 26], 5), shard([-40, 30, 2], [-50, 34, 18], 4));
  blades(sh, 6140, 36, { rx: RX + 90, ry: RY + 90, h0: 22, h1: 45, lean: 0.6, ring: 0.82 });
  parts.push(sh.geo());
  return merge(...parts);
}

// The pavilion of Kradia's watching mages (7.4 x 7.4 m with its ropes, 5.2 m to its crystal): a
// square tent of deep blue canvas, its roof a pyramid with brass on its hips and a violet valance
// of pennants round the eaves, a brass finial with a violet crystal; the front (-X) open, its
// flaps tied back on a table of charts and books and a scrying orb glowing on its stand; Kradia's
// eight-pointed star in brass on its sides; ropes to pegs at the corners.
function mageTent(): Geo {
  const parts: Geo[] = [], sh = new Sheet(), C = "Eastheights_Canvas", T = "Eastheights_CanvasTrim", B = "Eastheights_Brass";
  const H = 215, Wd = 215;
  // walls: back, sides, the front's two short returns
  parts.push(boxBounds([Wd - 4, -Wd, 0], [Wd, Wd, H], C));
  for (const s of [-1, 1]) {
    parts.push(boxBounds([-Wd, s > 0 ? Wd - 4 : -Wd, 0], [Wd, s > 0 ? Wd : -Wd + 4, H], C));
    parts.push(boxBounds([-Wd, s > 0 ? 120 : -Wd, 0], [-Wd + 4, s > 0 ? Wd : -120, H], C));
  }
  // the floor rug, the corner poles
  parts.push(boxBounds([-Wd + 10, -Wd + 10, 0], [Wd - 10, Wd - 10, 3], T));
  for (const [x, y] of [[Wd, Wd], [Wd, -Wd], [-Wd, Wd], [-Wd, -Wd]]) parts.push(cylinderBetween([x, y, 0], [x, y, H + 10], 4, 6, B));
  // the roof: a pyramid, brass on its hips, the finial and its crystal
  const RB = (Wd + 32) * Math.SQRT2, RH = 200;
  parts.push(rotateZ(cylinderAt({ rBot: RB, rTop: 10, height: RH, segments: 4, bottom: [0, 0, H] }, C), 45));
  for (const [x, y] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) parts.push(beamBetween([x * (Wd + 32), y * (Wd + 32), H], [0, 0, H + RH], 7, 7, B));
  parts.push(cylinderBetween([0, 0, H + RH - 10], [0, 0, H + RH + 60], 3.5, 6, B), sphereCenter(7, [0, 0, H + RH + 30], B, 7));
  parts.push(shard([0, 0, H + RH + 62], [0, 0, H + RH + 105], 11), shard([0, 0, H + RH + 62], [0, 0, H + RH + 50], 11));
  // the valance of pennants round the eaves
  for (let side = 0; side < 4; side++) {
    const a = (side / 4) * TAU, ux = -Math.sin(a), uy = Math.cos(a), ox = Math.cos(a) * (Wd + 34), oy = Math.sin(a) * (Wd + 34);
    for (let k = 0; k < 9; k++) {
      const t0 = -Wd - 30 + k * 54, t1 = t0 + 54, tm = (t0 + t1) / 2;
      sh.tri(T, [ox + ux * t0, oy + uy * t0, H + 2], [ox + ux * t1, oy + uy * t1, H + 2], [ox + ux * tm, oy + uy * tm, H - 38], [1, 1, 0.8], null, true);
    }
    parts.push(beamBetween([ox + ux * (-Wd - 32), oy + uy * (-Wd - 32), H + 4], [ox + ux * (Wd + 32), oy + uy * (Wd + 32), H + 4], 6, 6, B));
  }
  // the front flaps tied back, the ties
  for (const s of [-1, 1]) {
    sh.quad(C, [-Wd - 2, s * 120, H], [-Wd - 2, s * 30, H], [-Wd - 34, s * 150, 0], [-Wd - 30, s * 210, 0], [1, 0.95, 0.75, 0.8], null, true);
    parts.push(cylinderBetween([-Wd - 22, s * 140, 120], [-Wd - 6, s * 205, 120], 2, 4, "Eastheights_Rope"));
  }
  // inside: the table of charts and books, the orb on its stand, a stool
  parts.push(boxBounds([-40, -110, 82], [80, 110, 90], "Eastheights_Pole", 2));
  for (const [x, y] of [[-34, -100], [-34, 100], [74, -100], [74, 100]]) parts.push(boxBounds([x - 4, y - 4, 0], [x + 4, y + 4, 82], "Eastheights_Pole"));
  sh.quad("Eastheights_Paper", [-30, -90, 91], [40, -96, 91], [44, -10, 91], [-26, -4, 91], [1, 1, 1, 1], [0, 0, 1]);
  sh.quad("Eastheights_Paper", [-20, 20, 91.5], [50, 26, 91.5], [46, 90, 91.5], [-24, 84, 91.5], [1, 1, 1, 1], [0, 0, 1]);
  parts.push(boxBounds([50, 30, 90], [76, 70, 104], T, 1), boxBounds([52, -80, 90], [74, -40, 112], "Eastheights_Tassel", 1));
  parts.push(cylinderAt({ rBot: 14, rTop: 6, height: 26, segments: 8, bottom: [20, 0, 90] }, B), sphereCenter(15, [20, 0, 130], "Eastheights_Rift", 10));
  parts.push(cylinderAt({ radius: 22, height: 6, segments: 8, bottom: [-110, 60, 44] }, "Eastheights_Pole"));
  for (const k of [0, 1, 2]) parts.push(cylinderBetween([-110 + Math.cos(k * 2.1) * 18, 60 + Math.sin(k * 2.1) * 18, 0], [-110 + Math.cos(k * 2.1) * 10, 60 + Math.sin(k * 2.1) * 10, 44], 2.4, 4, "Eastheights_Pole"));
  // Kradia's star on both sides
  for (const s of [-1, 1])
    for (let k = 0; k < 4; k++) parts.push(translate(rotateX(box([3, 70, 9], [0, 0, 0], B), k * 45), [0, s * (Wd + 2), 120]));
  // ropes from the corners to pegs
  for (const [x, y] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const e: V3 = [x * (Wd + 32), y * (Wd + 32), H], peg: V3 = [x * (Wd + 170), y * (Wd + 170), 4];
    parts.push(rope([e, peg], 1.1), cylinderBetween([peg[0], peg[1], -4], [peg[0] - x * 5, peg[1] - y * 5, 22], 2.4, 4, "Eastheights_Pole"));
  }
  return merge(...parts, sh.geo());
}

// The mages' scrying engine (3.6 x 4 m, 3.3 m high): a long brass telescope on a timber tripod
// trained up at the floating rocks to the front (-X); beside it a brass armillary of three rings
// round a glowing violet orb on a stone pedestal; a folding desk of star charts weighted with
// stones, an ink pot, a stool, a crate of instruments.
function scryingEngine(): Geo {
  const parts: Geo[] = [], B = "Eastheights_Brass", sh = new Sheet();
  // the tripod and the telescope
  const head: V3 = [20, 0, 165];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * TAU + 0.3;
    parts.push(cylinderBetween([head[0] + Math.cos(a) * 95, head[1] + Math.sin(a) * 95, 0], head, 4, 6, "Eastheights_Pole", 3));
  }
  parts.push(sphereCenter(9, head, B, 8));
  const e0: V3 = [110, 0, 120], e1: V3 = [-150, 0, 300];
  parts.push(cylinderBetween(e0, [head[0], head[1], head[2] + 8], 10, 10, B, 12), cylinderBetween([head[0], head[1], head[2] + 8], e1, 12, 10, B, 16));
  for (const t of [0.2, 0.55, 0.9]) parts.push(translate(rotateY(torus(14, 2.2, 12, 4, "Eastheights_Pole"), -55), [e0[0] + (e1[0] - e0[0]) * t, 0, e0[2] + (e1[2] - e0[2]) * t + 4]));
  parts.push(translate(rotateY(cylinderAt({ radius: 15, height: 2, segments: 12, bottom: [0, 0, 0] }, "Eastheights_Glass"), -55), e1));
  parts.push(cylinderBetween(e0, [130, 0, 108], 5, 8, "Eastheights_Pole"));
  // the armillary on its pedestal
  const AC: V3 = [60, 150, 165];
  parts.push(cylinderAt({ rBot: 30, rTop: 24, height: 105, segments: 8, bottom: [AC[0], AC[1], 0] }, "Eastheights_Megalith"));
  parts.push(cylinderBetween([AC[0], AC[1], 105], [AC[0], AC[1], AC[2] - 46], 3, 6, B));
  for (const [rx, ry] of [[0, 0], [90, 0], [70, 40]]) parts.push(translate(rotateZ(rotateX(torus(46, 2.4, 22, 4, B), rx), ry), AC));
  parts.push(translate(rotateY(torus(46, 1.6, 22, 4, B), 23), AC));
  parts.push(sphereCenter(13, AC, "Eastheights_Rift", 10), ellipsoid([26, 26, 26], AC, "Eastheights_RiftSoft", 8));
  // the desk of charts, the stool, the crate
  parts.push(boxBounds([30, -210, 74], [120, -100, 80], "Eastheights_Pole", 1.5));
  for (const [x, y] of [[36, -204], [36, -106], [114, -204], [114, -106]]) parts.push(boxBounds([x - 3, y - 3, 0], [x + 3, y + 3, 74], "Eastheights_Pole"));
  sh.quad("Eastheights_Paper", [38, -200, 81], [104, -204, 81], [110, -150, 81], [42, -146, 81], [1, 1, 1, 1], [0, 0, 1]);
  sh.quad("Eastheights_Paper", [60, -140, 81.5], [114, -136, 81.5], [110, -104, 81.5], [58, -108, 81.5], [1, 1, 1, 1], [0, 0, 1]);
  parts.push(stone([12, 10, 8], 0.4, 6201, "Eastheights_Granite", [44, -196, 80]), stone([10, 9, 8], 0.4, 6202, "Eastheights_Granite", [104, -112, 80]));
  parts.push(cylinderAt({ radius: 5, height: 9, segments: 7, bottom: [94, -170, 80] }, "Eastheights_Dark"));
  parts.push(cylinderAt({ radius: 18, height: 5, segments: 8, bottom: [-30, -160, 42] }, "Eastheights_Pole"));
  for (const k of [0, 1, 2]) parts.push(cylinderBetween([-30 + Math.cos(k * 2.1) * 15, -160 + Math.sin(k * 2.1) * 15, 0], [-30 + Math.cos(k * 2.1) * 8, -160 + Math.sin(k * 2.1) * 8, 42], 2, 4, "Eastheights_Pole"));
  parts.push(boxAt([70, 50, 46], [160, -60, 0], "Eastheights_Pole", 3), boxAt([74, 54, 6], [160, -60, 46], "Eastheights_CanvasTrim", 2));
  return centre(merge(...parts, sh.geo()));
}

// ---- the kit ----
export const KIT: Kit = {
  id: "eastheights",
  name: "ที่ราบสูงลมแรงและหินลอย",
  region: "เหนือชายแดนตะวันออก",
  desc: "ที่ราบสูงที่ลมจากทะเลเหนือพัดจนหญ้าเอนทั้งทุ่ง หินลมกัดเซาะ สุสานโบราณของเจ้าม้า ศาลของคนเร่ร่อน แหลมพายุกับหอสัญญาณพังและเสาล่อฟ้า และทุ่งที่เวทประตูอสูรยกหินกับแผ่นดินขึ้นลอยกลางอากาศ",
  ground: "steppe",
  items: [
    { id: "heath_boulder", name: "หินแกรนิตไลเคน", make: heathBoulder, tags: ["rock"] },
    { id: "rock_scatter", name: "หินดานโผล่พ้นหญ้า", make: rockScatter, tags: ["rock"] },
    { id: "granite_tor", name: "หินซ้อนบนที่สูง", make: graniteTor, tags: ["rock", "landmark"] },
    { id: "bent_grass", name: "หญ้าลู่ลม", make: bentGrass, tags: ["ground", "plant"] },
    { id: "heather", name: "พุ่มเฮเธอร์ลู่ลม", make: heather, tags: ["plant"] },
    { id: "bent_pine", name: "ต้นสนเอนลม", make: () => bentTreeGeo(), tags: ["tree", "plant"] },
    { id: "wind_rock_mushroom", name: "หินเห็ดลมกัด", make: windRockMushroom, tags: ["rock", "landmark"] },
    { id: "wind_rock_arch", name: "หินโค้งลมกัด", make: windRockArch, tags: ["rock", "landmark"] },
    { id: "burial_mound", name: "เนินสุสานโบราณของเจ้าม้า", make: burialMound, tags: ["landmark"] },
    { id: "warrior_stone", name: "หินสลักหน้านักรบ", make: warriorStone, tags: ["landmark"] },
    { id: "nomad_shrine", name: "ศาลกองหินของคนเร่ร่อน", make: nomadShrine, tags: ["landmark", "decor"] },
    { id: "herder_tent", name: "กระโจมขนจามรี", make: herderTent, tags: ["building"] },
    { id: "prayer_flags", name: "ราวธงมนต์ (6 ม.)", make: prayerFlags, tags: ["decor"] },
    { id: "signal_tower", name: "หอส่งสัญญาณพัง", make: signalTower, tags: ["tower", "landmark"] },
    { id: "lightning_rod", name: "เสาล่อฟ้า", make: lightningRod, tags: ["tower", "landmark"] },
    { id: "storm_wreck", name: "ซากเรือแตกบนโขดหิน", make: stormWreck, tags: ["wreck", "landmark"] },
    { id: "struck_tree", name: "ต้นไม้ถูกฟ้าผ่า", make: struckTree, tags: ["tree", "decor"] },
    { id: "floating_isle", name: "เกาะดินลอยฟ้า", make: floatingIsle, tags: ["magic", "landmark"] },
    { id: "floating_isle_small", name: "เกาะดินลอยเล็ก", make: floatingIsleSmall, tags: ["magic"] },
    { id: "floating_stones", name: "หินลอยกลางอากาศ", make: floatingStones, tags: ["magic", "rock"] },
    { id: "stone_ring", name: "วงหินลอยรอบเสาหิน", make: stoneRing, tags: ["magic", "landmark"] },
    { id: "torn_hollow", name: "หลุมดินที่ถูกถอนขึ้นฟ้า", make: tornHollow, tags: ["ground"] },
    { id: "mage_tent", name: "กระโจมนักเวทคราเดีย", make: mageTent, tags: ["building", "magic"] },
    { id: "scrying_engine", name: "กล้องส่องหินลอย", make: scryingEngine, tags: ["magic", "decor"] },
  ],
  // A corner of the heights: the barrow with the warrior's face looking out before it, the
  // nomads' ovoo and a herder's tent with its flags, wind-cut rocks and a tor, crooked pines,
  // heather and grass all laid over toward -X; on the far side an island hangs over the hollow it
  // was torn from, stones circling in the air, and a lightning mast stands on the rise.
  sample(put) {
    put("burial_mound", [-700, 900, 0], 0);
    put("warrior_stone", [-1700, -100, 0], 0);
    put("nomad_shrine", [600, -700, 0], 0);
    put("herder_tent", [900, 1300, 0], 10);
    put("prayer_flags", [1700, 400, 0], 0, 0.9);
    put("granite_tor", [1800, -1500, 0], 40);
    put("wind_rock_mushroom", [-500, -1700, 0], 20);
    put("heath_boulder", [-1500, 1900, 0], 60);
    put("rock_scatter", [400, 300, 0], 10);
    put("floating_isle", [-1500, -1500, 0], 0);
    put("torn_hollow", [-1500, -1500, 0], 0, 1.8);
    put("floating_stones", [1000, -1900, 0], 0);
    put("lightning_rod", [1900, 1900, 0], 0, 0.8);
    put("bent_pine", [-300, 1950, 0], 0);
    put("bent_pine", [1900, -500, 0], 5, 0.85);
    put("struck_tree", [200, -1800, 0], 30);
    const rnd = seeded(77);
    for (let i = 0; i < 70; i++) {
      const x = (rnd() - 0.5) * 4000, y = (rnd() - 0.5) * 4000;
      put("bent_grass", [x, y, 0], (rnd() - 0.5) * 20, 0.8 + rnd() * 0.5);
    }
    for (let i = 0; i < 12; i++) put("heather", [(rnd() - 0.5) * 4000, (rnd() - 0.5) * 4000, 0], (rnd() - 0.5) * 20, 0.8 + rnd() * 0.4);
  },
};
