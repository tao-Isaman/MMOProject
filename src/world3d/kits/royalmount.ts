// เทือกเขาหลวง (the royalmount field kit): the king's mountains round the royal palace, for the
// royal hunting forest, the valley of the frozen falls and the dynasty's old silver mine.
//
// The hunting forest: the king's log hunting lodge with antlers on its gable and blue banners on
// its porch, a timber game-watching tower, the gateway of antlers over the bridle path, the stone
// dais where the huntsman's great horn is blown, hay racks for the deer, archery butts, deadfall
// in the snow, red-twigged dogwood and junipers. The frozen falls: a great waterfall frozen in
// columns down a cliff, pillars of frozen spray, a hot spring steaming in its terraces, the
// hermit's stone hut, a natural bridge of ice over a stream, plates of shore ice. The old mine:
// rails and a cart stuck on them, the timber headframe over a shaft, the ruined smelter, the
// royal adit sealed with a grille behind the rockfall, crystals of ore breaking out of the rock,
// spoil heaps, granite seamed with silver. A crowned waystone marks the ways out.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front facing -X.

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, sphereCenter, torus, gableRoof, gableWall, rock,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial } from "../textures";
import { Cards, shrub } from "../trees";
import type { Lobe, ShrubLook } from "../trees";
import { fallenTrunk, stumpOf, endGrain } from "../nature";
import type { Kit } from "./types";

// ---- the kit's own materials ----
defineMaterial("Royalmount_Granite", { map: "crag", tint: "#a0a5ae", bump: 3 });
defineMaterial("Royalmount_GraniteDark", { map: "crag", tint: "#6c717b", bump: 3 });
defineMaterial("Royalmount_Silver", { map: "metal", tint: "#e3e9f0", rough: 0.22, metal: 0.85 });
defineMaterial("Royalmount_SilverVein", { map: "metal", tint: "#e8f0f8", rough: 0.2, metal: 0.6, glow: "#b9dcff", glowI: 0.35 });
defineMaterial("Royalmount_Crystal", { map: "ice", tint: "#cbe8ff", rough: 0.08, glow: "#5cb2ff", glowI: 0.55, opacity: 0.9 });
defineMaterial("Royalmount_CrystalCore", { tint: "#eef8ff", rough: 0.1, glow: "#9cd6ff", glowI: 1.1 });
defineMaterial("Royalmount_Rust", { map: "metal", tint: "#7d4c30", rough: 0.75, metal: 0.35 });
defineMaterial("Royalmount_Iron", { map: "metal", tint: "#3d3e44", rough: 0.6, metal: 0.45 });
defineMaterial("Royalmount_Timber", { map: "wood", tint: "#6f5843", bump: 1.4 });
defineMaterial("Royalmount_TimberDark", { map: "wood", tint: "#4b3b2d", bump: 1.4 });
defineMaterial("Royalmount_Plank", { map: "wood", tint: "#9a7a58", bump: 1.2 });
defineMaterial("Royalmount_Log", { map: "bark", tint: "#6b4d36", bump: 2.5 });
const LOG_END = endGrain("#c9a273");
defineMaterial("Royalmount_Spoil", { map: "crag", tint: "#857d74", bump: 2.5 });
defineMaterial("Royalmount_Slag", { map: "crag", tint: "#45403f", rough: 0.35, metal: 0.25, bump: 2 });
defineMaterial("Royalmount_Soot", { map: "stone", tint: "#77706a", bump: 2 });
defineMaterial("Royalmount_Brick", { map: "brick", tint: "#8e5b47", bump: 1.5 });
defineMaterial("Royalmount_Ashlar", { map: "stone", tint: "#c3beb3", bump: 2 });
defineMaterial("Royalmount_Ice", { map: "ice", tint: "#d6eef9", rough: 0.12, opacity: 0.9 });
defineMaterial("Royalmount_IceDeep", { map: "ice", tint: "#8cc7e5", rough: 0.15 });
defineMaterial("Royalmount_IceGlow", { map: "ice", tint: "#bfe8ff", rough: 0.1, glow: "#79cdff", glowI: 0.28, opacity: 0.9 });
defineMaterial("Royalmount_HotWater", { tint: "#4db3ad", rough: 0.05, opacity: 0.93 });
defineMaterial("Royalmount_Travertine", { map: "sandstone", tint: "#e9dabb", bump: 1.5 });
defineMaterial("Royalmount_Ochre", { map: "adobe", tint: "#c27b3d", bump: 1 });
defineMaterial("Royalmount_Steam", { tint: "#f6f9fc", rough: 1, opacity: 0.3 });
defineMaterial("Royalmount_Smoke", { tint: "#a4a8ae", rough: 1, opacity: 0.32 });
defineMaterial("Royalmount_RoyalBlue", { map: "fabric", tint: "#2e509f", rough: 0.95 });
defineMaterial("Royalmount_RoyalPaint", { map: "plaster", tint: "#2c4d96", rough: 0.6 });
defineMaterial("Royalmount_Antler", { map: "adobe", tint: "#e6dbc4", bump: 1.2 });
defineMaterial("Royalmount_Hay", { map: "thatch", tint: "#c9ae6b", rough: 1 });
defineMaterial("Royalmount_Straw", { map: "thatch", tint: "#dcc27c", rough: 1 });
defineMaterial("Royalmount_PaintRed", { map: "plaster", tint: "#a6382d", rough: 0.85 });
defineMaterial("Royalmount_PaintWhite", { map: "plaster", tint: "#efe9dc", rough: 0.85 });
defineMaterial("Royalmount_RedTwig", { map: "bark", tint: "#a23526", bump: 1.5 });
defineMaterial("Royalmount_JuniperCore", { map: "foliage", tint: "#2b4a3a", rough: 0.95, bump: 1.5 });
defineMaterial("Royalmount_JuniperDark", { card: "needles", tint: "#2e5242", rough: 0.9 });
defineMaterial("Royalmount_Juniper", { card: "needles", tint: "#466f59", rough: 0.85 });
defineMaterial("Royalmount_JuniperLight", { card: "needles", tint: "#7aa38b", rough: 0.8 });
defineMaterial("Royalmount_Dark", { tint: "#141215", rough: 1 });
defineMaterial("Royalmount_Hide", { map: "felt", tint: "#8a6748", rough: 1 });
defineMaterial("Royalmount_Earth", { map: "adobe", tint: "#5d4a3b", bump: 1.5 });
defineMaterial("Royalmount_Coal", { map: "crag", tint: "#25221f", rough: 1, bump: 2 });
defineMaterial("Royalmount_DryLeaf", { map: "felt", tint: "#8a6a3e", rough: 1 });
// for the fields: their cliffs, the frozen lake, cold water, the sea under the mine
defineMaterial("Royalmount_CliffGranite", { map: "crag", tint: "#a3a9b3", bump: 3 });
defineMaterial("Royalmount_CliffDark", { map: "crag", tint: "#8a8f99", bump: 3 });
defineMaterial("Royalmount_LakeIce", { map: "ice", tint: "#c5e3f1", rough: 0.18 });
defineMaterial("Royalmount_ColdWater", { tint: "#26505f", rough: 0.05, opacity: 0.94 });
defineMaterial("Royalmount_NorthSea", { tint: "#1e4458", rough: 0.06, opacity: 0.95 });

const DEG = 180 / Math.PI;

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// ---- shared pieces ----

// Centre a Geo on its footprint (x, y), leaving z alone.
function centre(g: Geo): Geo {
  const b = new THREE.Box3();
  for (const p of g) {
    p.geo.computeBoundingBox();
    b.union(p.geo.boundingBox!);
  }
  return translate(g, [-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0]);
}

// A flattened ball (a snow clump, a puff of steam).
const blob = (r: number, at: V3, mat: string, sz = 0.45, segs = 9): Geo => translate(scale(sphereCenter(r, [0, 0, 0], mat, segs), [1, 1, sz]), at);

// Snow lying on the upward faces of a shape: a copy of every face that looks up more than
// `minUp`, lifted a little off it.
function snowFacets(g: Geo, minUp = 0.55, lift = 2.5, mat = "Snow"): Geo {
  const tris: THREE.Vector3[][] = [];
  const normals = new Map<string, THREE.Vector3>();
  const key = (v: THREE.Vector3) => `${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}`;
  for (const p of g) {
    const src = p.geo.index ? p.geo.toNonIndexed() : p.geo, P = src.getAttribute("position");
    for (let i = 0; i + 2 < P.count; i += 3) {
      const t = [0, 1, 2].map((k) => new THREE.Vector3().fromBufferAttribute(P, i + k));
      const n = new THREE.Vector3().subVectors(t[1], t[0]).cross(new THREE.Vector3().subVectors(t[2], t[0])).normalize();
      if (n.z < minUp) continue;
      tris.push(t);
      for (const v of t) {
        const m = normals.get(key(v));
        if (m) m.add(n);
        else normals.set(key(v), n.clone());
      }
    }
  }
  const pos: number[] = [];
  for (const t of tris)
    for (const v of t) {
      const n = normals.get(key(v))!.clone().normalize();
      pos.push(v.x + n.x * lift, v.y + n.y * lift, v.z + n.z * lift + 1);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(pos.flatMap((v, i) => (i % 3 === 2 ? [] : [v / 100])), 2));
  return [{ geo, mat }];
}

// Seams of another material through a rock: every facet whose middle lies within `w` of one of a
// few wavy planes across it takes `mat` (silver in the granite).
function veined(g: Geo, mat: string, seed: number, n = 3, w = 9): Geo {
  const rnd = seeded(seed);
  const planes = Array.from({ length: n }, () => {
    const a = rnd() * Math.PI, tilt = (rnd() - 0.5) * 1.2;
    return { n: new THREE.Vector3(Math.cos(a), Math.sin(a), tilt).normalize(), d: (rnd() - 0.5) * 60, k: 0.02 + rnd() * 0.02, amp: 10 + rnd() * 14 };
  });
  const out: Geo = [];
  for (const part of g) {
    const src = part.geo.index ? part.geo.toNonIndexed() : part.geo, P = src.getAttribute("position");
    const keep: number[] = [], vein: number[] = [];
    for (let t = 0; t + 2 < P.count; t += 3) {
      const c = new THREE.Vector3((P.getX(t) + P.getX(t + 1) + P.getX(t + 2)) / 3, (P.getY(t) + P.getY(t + 1) + P.getY(t + 2)) / 3, (P.getZ(t) + P.getZ(t + 1) + P.getZ(t + 2)) / 3);
      const hit = planes.some((p) => Math.abs(c.dot(p.n) - p.d - p.amp * Math.sin((c.x + c.y) * p.k + c.z * p.k * 0.7)) < w);
      (hit ? vein : keep).push(t, t + 1, t + 2);
    }
    const pick = (idx: number[]) => {
      const geo = new THREE.BufferGeometry();
      for (const name of Object.keys(src.attributes)) {
        const a = src.getAttribute(name) as THREE.BufferAttribute, arr = new Float32Array(idx.length * a.itemSize);
        idx.forEach((i, j) => {
          for (let k = 0; k < a.itemSize; k++) arr[j * a.itemSize + k] = a.array[i * a.itemSize + k] as number;
        });
        geo.setAttribute(name, new THREE.BufferAttribute(arr, a.itemSize));
      }
      return geo;
    };
    if (keep.length) out.push({ geo: pick(keep), mat: part.mat });
    if (vein.length) out.push({ geo: pick(vein), mat });
  }
  return out;
}

// A rock with snow lying on its upper faces (`cover`: how much of it, 0..1).
function frostRock(size: V3, rough: number, seed: number, o: { mat?: string; flat?: boolean; cover?: number; at?: V3; turn?: number; coat?: string } = {}): Geo {
  const body = rock(size, rough, seed, o.mat ?? "Royalmount_Granite", o.flat ?? false);
  const cover = o.cover ?? 0.4;
  let g = cover > 0 ? merge(body, snowFacets(body, 0.95 - cover, 2.5, o.coat ?? "Snow")) : body;
  if (o.turn) g = rotateZ(g, o.turn);
  return o.at ? translate(g, o.at) : g;
}

// A soft low mound lx by ly, h high, lying at `at`: a lumpy dome, smooth-shaded.
function mound(lx: number, ly: number, h: number, seed: number, at: V3 = [0, 0, 0], turn = 0, mat = "Snow"): Geo {
  const rnd = seeded(seed);
  const geo = new THREE.SphereGeometry(1, 16, 7, 0, Math.PI * 2, 0, Math.PI / 2);
  const P = geo.getAttribute("position");
  const bumps = Array.from({ length: 5 }, () => [rnd() * Math.PI * 2, 0.08 + rnd() * 0.14, 1 + Math.floor(rnd() * 3)]);
  for (let i = 0; i < P.count; i++) {
    // three.js builds it round +Y: x, z across, y up
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), ang = Math.atan2(z, x);
    let r = 1;
    for (const [ph, amp, k] of bumps) r += amp * Math.sin(ang * k + ph);
    const up = y ** 0.8;
    P.setXYZ(i, (x * r * lx) / 2, (-z * r * ly) / 2, up * h * (0.85 + 0.15 * r) - 2);
  }
  geo.computeVertexNormals();
  const flat = geo.toNonIndexed();
  const F = flat.getAttribute("position"), uv = new Float32Array(F.count * 2);
  for (let i = 0; i < F.count; i++) {
    uv[i * 2] = F.getX(i) / 100;
    uv[i * 2 + 1] = F.getY(i) / 100;
  }
  flat.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return translate(rotateZ([{ geo: flat, mat }], turn), at);
}

// Icicles hanging under the line a-b.
function icicles(a: V3, b: V3, seed: number, step = 22, maxLen = 50, mat = "Royalmount_Ice"): Geo {
  const rnd = seeded(seed), parts: Geo[] = [];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  for (let t = step * 0.5; t < len - 6; t += step * (0.7 + rnd() * 0.6)) {
    if (rnd() < 0.3) continue;
    const f = t / len, L = 10 + rnd() * rnd() * maxLen;
    const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, z = a[2] + (b[2] - a[2]) * f;
    parts.push(cylinderAt({ rBot: 0.5, rTop: 2.5 + rnd() * 2.5, height: L, segments: 5, bottom: [x, y, z - L + 1] }, mat));
  }
  return merge(...parts);
}

// A rope through points; a line sagging from a to b.
function rope(pts: V3[], r: number, mat = "RopeTan"): Geo {
  return merge(...pts.slice(1).map((p, i) => cylinderBetween(pts[i], p, r, 4, mat)));
}
function sagLine(a: V3, b: V3, sag: number, n: number): V3[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - sag * 4 * t * (1 - t)] as V3;
  });
}

// A rough round outline of radii rx, ry, wobbling by `wob`.
function blobOutline(rx: number, ry: number, seed: number, wob = 0.18, n = 14): [number, number][] {
  const rnd = seeded(seed);
  const k = Array.from({ length: 3 }, () => [rnd() * Math.PI * 2, rnd() * wob, 2 + Math.floor(rnd() * 3)]);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.25;
    let r = 1 - wob * 0.3 + rnd() * wob * 0.6;
    for (const [ph, amp, f] of k) r += amp * Math.sin(a * f + ph);
    return [Math.cos(a) * rx * r, Math.sin(a) * ry * r];
  });
}

// The faces of an extrusion apart: its caps and its sides.
function groupsOf(geo: THREE.BufferGeometry): THREE.BufferGeometry[] {
  const g = geo.index ? geo.toNonIndexed() : geo;
  return g.groups.map((gr) => {
    const out = new THREE.BufferGeometry();
    for (const name of ["position", "normal", "uv"]) {
      const a = g.getAttribute(name) as THREE.BufferAttribute;
      out.setAttribute(name, new THREE.BufferAttribute((a.array as Float32Array).slice(gr.start * a.itemSize, (gr.start + gr.count) * a.itemSize), a.itemSize));
    }
    return out;
  });
}
const uvScale = (geo: THREE.BufferGeometry, k: number) => {
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, uv.getY(i) * k);
  return geo;
};

// A slab over a plan outline from z0 up to z1 (its top and its sides in their own materials), its
// edges a little rounded off when `soft`.
function slab(outline: [number, number][], z0: number, z1: number, top: string, side = top, soft = 0): Geo {
  const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  const b = Math.min(soft, (z1 - z0) * 0.4);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.5, z1 - z0 - 2 * b), bevelEnabled: b > 0.3, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: 4 });
  geo.translate(0, 0, z0 + b);
  const [caps, sides] = groupsOf(geo);
  return [{ geo: uvScale(caps, 0.01), mat: top }, { geo: uvScale(sides, 0.01), mat: side }];
}
const shift = (o: [number, number][], dx: number, dy: number, k = 1): [number, number][] => o.map(([x, y]) => [x * k + dx, y * k + dy]);

// Logs laid one on another along a wall from a to b, the ends sticking out past the corners;
// `gaps` leaves openings [from, to] (cm along the wall) between heights z0..z1.
function logWall(a: [number, number], b: [number, number], z0: number, n: number, seed: number, gaps: [number, number, number, number][] = []): Geo {
  const rnd = seeded(seed), parts: Geo[] = [], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
  for (let i = 0; i < n; i++) {
    const r = 13 + rnd() * 2, z = z0 + i * 24 + r;
    const cut = gaps.filter(([, , g0, g1]) => z > g0 && z < g1).map(([s0, s1]) => [s0, s1] as [number, number]);
    let from = -26;
    for (const [s0, s1] of [...cut, [L + 26, L + 26] as [number, number]]) {
      if (s0 - from > 20) {
        const p: V3 = [a[0] + ux * from, a[1] + uy * from, z], q: V3 = [a[0] + ux * s0, a[1] + uy * s0, z];
        parts.push(cylinderBetween(p, q, r, 8, "Royalmount_Log"));
        // the sawn ends that show past the corners
        if (from < 0) parts.push(cylinderBetween([p[0] - ux * 1, p[1] - uy * 1, z], [p[0] + ux * 0.5, p[1] + uy * 0.5, z], r - 1.5, 8, LOG_END));
        if (s0 > L) parts.push(cylinderBetween([q[0] - ux * 0.5, q[1] - uy * 0.5, z], [q[0] + ux * 1, q[1] + uy * 1, z], r - 1.5, 8, LOG_END));
      }
      from = s1;
    }
  }
  return merge(...parts);
}

// A glazed window in a wall facing `n` (unit, in the plan) at (x, y), its sill at z: a frame, a
// pane with a glazing bar, a shutter open each side.
function glazed(x: number, y: number, z: number, n: [number, number], w = 70, h = 80, shutter = "Royalmount_RoyalPaint"): Geo {
  const deg = Math.atan2(n[1], n[0]) * DEG;
  const local = merge(
    boxBounds([-6, -w / 2 - 9, -10], [8, w / 2 + 9, 0], "Royalmount_Plank", 1.5),
    boxBounds([-6, -w / 2 - 9, h], [6, w / 2 + 9, h + 10], "Royalmount_Plank", 1.5),
    boxBounds([-6, -w / 2 - 9, 0], [6, -w / 2, h], "Royalmount_Plank", 1.5),
    boxBounds([-6, w / 2, 0], [6, w / 2 + 9, h], "Royalmount_Plank", 1.5),
    boxBounds([-2, -w / 2, 0], [2, w / 2, h], "GlassBlue"),
    boxBounds([-4, -2, 0], [4, 2, h], "Royalmount_Plank"),
    boxBounds([-4, -w / 2, h / 2 - 2], [4, w / 2, h / 2 + 2], "Royalmount_Plank"),
    translate(rotateZ(boxBounds([0, 0, 0], [4, w / 2, h], shutter, 1), -75), [6, w / 2 + 8, 0]),
    translate(rotateZ(boxBounds([0, -w / 2, 0], [4, 0, h], shutter, 1), 75), [6, -w / 2 - 8, 0]),
    blob(w * 0.42, [8, 0, h + 12], "Snow", 0.25, 8),
  );
  return translate(rotateZ(local, deg), [x, y, z]);
}

// One antler: a beam from `base` sweeping out to the side `side` (+1 toward +Y), up and a little
// forward (-X), points rising off it; `s` its size (1: a big stag's, about 90 cm).
function antler(base: V3, side: number, s: number, seed: number, mat = "Royalmount_Antler"): Geo {
  const rnd = seeded(seed), parts: Geo[] = [], pts: V3[] = [], n = 7;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([base[0] - s * (4 + 20 * Math.sin(t * Math.PI)), base[1] + side * s * (8 + 52 * Math.sin(t * Math.PI * 0.6) - 10 * t * t), base[2] + s * (4 + 82 * t)]);
  }
  for (let i = 0; i < n; i++) parts.push(cylinderBetween(pts[i], pts[i + 1], s * (4.4 - (2.8 * i) / n), 6, mat, s * (4.4 - (2.8 * (i + 1)) / n)));
  parts.push(translate(scale(sphereCenter(s * 6.4, [0, 0, 0], mat, 7), [1, 1, 0.6]), pts[0]));
  for (const k of [1, 3, 5, 6]) {
    const p = pts[k], len = s * (20 + rnd() * 14) * (k === 1 ? 1.25 : 1);
    const d: V3 = [-0.55 - rnd() * 0.2, side * (rnd() - 0.3) * 0.4, 0.78];
    parts.push(cylinderBetween(p, [p[0] + d[0] * len, p[1] + d[1] * len, p[2] + d[2] * len], s * 2.6, 5, mat, s * 0.6));
  }
  return merge(...parts);
}
// A stag's skull with its antlers (a trophy), at `at` facing -X.
function trophy(at: V3, s: number, seed: number): Geo {
  return merge(
    translate(scale(sphereCenter(11 * s, [0, 0, 0], "Royalmount_Antler", 8), [1.25, 0.8, 0.75]), [at[0] - 4 * s, at[1], at[2]]),
    translate(rotateY(cylinderAt({ rBot: 7 * s, rTop: 4 * s, height: 22 * s, segments: 7, bottom: [0, 0, 0] }, "Royalmount_Antler"), -100), [at[0] - 10 * s, at[1], at[2] - 2 * s]),
    sphereCenter(2.4 * s, [at[0] - 12 * s, at[1] - 6 * s, at[2] + 3 * s], "Royalmount_Dark", 5),
    sphereCenter(2.4 * s, [at[0] - 12 * s, at[1] + 6 * s, at[2] + 3 * s], "Royalmount_Dark", 5),
    antler([at[0], at[1] - 6 * s, at[2] + 6 * s], -1, s, seed),
    antler([at[0], at[1] + 6 * s, at[2] + 6 * s], 1, s, seed + 1),
  );
}

// The royal crest on a shield, flat against a wall facing -X at `at` (its middle), `w` across: a
// blue field in a gold rim with the gold crown on it.
function crest(at: V3, w: number): Geo {
  const h = w * 1.1, parts: Geo[] = [
    box([4, w, h * 0.72], [0, 0, h * 0.14], "Royalmount_RoyalPaint", 1),
    translate(rotateX(box([4, w * 0.7, w * 0.7], [0, 0, 0], "Royalmount_RoyalPaint", 1), 45), [0, 0, -h * 0.2]),
    box([5, w + 6, 5], [-1, 0, h * 0.5], "GoldTrim"),
    box([5, 5, h * 0.72], [-1, -w / 2 - 1, h * 0.14], "GoldTrim"),
    box([5, 5, h * 0.72], [-1, w / 2 + 1, h * 0.14], "GoldTrim"),
    // the crown: a band and three points with pearls
    box([3, w * 0.56, w * 0.12], [-3, 0, h * 0.02], "GoldTrim", 0.5),
  ];
  for (const k of [-1, 0, 1]) {
    const y = k * w * 0.2, t = k === 0 ? 0.3 : 0.22;
    parts.push(translate(cylinderAt({ rBot: w * 0.07, rTop: 0, height: w * t, segments: 4, bottom: [0, 0, 0] }, "GoldTrim"), [-3, y, h * 0.02 + w * 0.06]));
    parts.push(sphereCenter(w * 0.035, [-3, y, h * 0.02 + w * (0.06 + t)], "Royalmount_PaintWhite", 6));
  }
  return translate(merge(...parts), at);
}

// A royal banner hanging from (x, y, z): blue cloth with a gold edge and the crest, a fringe.
function banner(at: V3, w = 60, h = 170, turn = 0): Geo {
  const parts: Geo[] = [
    boxBounds([-2, -w / 2, -h], [2, w / 2, 0], "Royalmount_RoyalBlue"),
    boxBounds([-3, -w / 2 - 2, -h], [3, -w / 2 + 3, 0], "FabricGold"),
    boxBounds([-3, w / 2 - 3, -h], [3, w / 2 + 2, 0], "FabricGold"),
    translate(rotateX(box([3, w * 0.72, w * 0.72], [0, 0, 0], "Royalmount_RoyalBlue"), 45), [0, 0, -h]),
    cylinderBetween([0, -w / 2 - 8, 2], [0, w / 2 + 8, 2], 2.5, 6, "Royalmount_TimberDark"),
    crest([-4, 0, -h * 0.42], w * 0.55),
  ];
  return translate(rotateZ(merge(...parts), turn), at);
}

// A hexagonal crystal `len` long and `r` thick from `base` along `dir`, its point a pyramid.
function crystal(base: V3, dir: V3, len: number, r: number, mat = "Royalmount_Crystal"): Geo {
  const L = Math.hypot(dir[0], dir[1], dir[2]) || 1, d: V3 = [dir[0] / L, dir[1] / L, dir[2] / L];
  const body = len * 0.78, p1: V3 = [base[0] + d[0] * body, base[1] + d[1] * body, base[2] + d[2] * body];
  return merge(
    cylinderBetween(base, p1, r, 6, mat, r * 0.92),
    cylinderBetween(p1, [base[0] + d[0] * len, base[1] + d[1] * len, base[2] + d[2] * len], r * 0.92, 6, mat, 0.5),
  );
}
// A cluster of crystals bursting from `at` round the direction `dir`.
function crystalCluster(at: V3, dir: V3, n: number, size: number, seed: number): Geo {
  const rnd = seeded(seed), parts: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const d: V3 = [dir[0] + (rnd() - 0.5) * 0.9, dir[1] + (rnd() - 0.5) * 0.9, dir[2] + (rnd() - 0.5) * 0.6];
    const len = size * (0.45 + rnd() * 0.75) * (i === 0 ? 1.3 : 1), r = len * (0.13 + rnd() * 0.05);
    parts.push(crystal([at[0] + (rnd() - 0.5) * size * 0.3, at[1] + (rnd() - 0.5) * size * 0.3, at[2] + (rnd() - 0.5) * size * 0.2], d, len, r, i % 4 === 3 ? "Royalmount_CrystalCore" : "Royalmount_Crystal"));
  }
  return merge(...parts);
}

// Steam (or smoke) rising from `at`: puffs growing and thinning as they go up.
function plume(at: V3, n: number, r: number, seed: number, mat = "Royalmount_Steam", rise = 34, drift: [number, number] = [0, 0]): Geo {
  const rnd = seeded(seed), parts: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const k = i / Math.max(1, n - 1), rr = r * (0.7 + k * 0.9) * (0.85 + rnd() * 0.3);
    parts.push(blob(rr, [at[0] + drift[0] * k + (rnd() - 0.5) * r * 0.6, at[1] + drift[1] * k + (rnd() - 0.5) * r * 0.6, at[2] + i * rise + rnd() * rise * 0.4], mat, 0.75, 8));
  }
  return merge(...parts);
}

// ======================================================================================
// ---- the natural pieces ----

// A granite boulder seamed with silver, snow on its top. About 2.6 x 2.1 m.
function silverBoulder(): Geo {
  const body = rock([260, 210, 170], 0.32, 11, "Royalmount_Granite");
  const small = translate(rock([110, 90, 70], 0.4, 13, "Royalmount_GraniteDark"), [130, 90, 0]);
  const g = merge(veined(body, "Royalmount_SilverVein", 15, 4, 13), veined(small, "Royalmount_SilverVein", 17, 2, 10));
  return merge(g, snowFacets(merge(body, small), 0.86), mound(220, 150, 20, 19, [-90, -60, 0], 30), mound(140, 110, 14, 20, [110, -90, 0], -20));
}

// A crag hung with icicles: a tall rock with a ledge jutting out over its front, ice glazing the
// face beneath it and icicles along its lip, snow on top. About 3.4 x 2.8 m, 3.4 m high.
function icicleCrag(): Geo {
  const rnd = seeded(31), parts: Geo[] = [];
  const body = rock([300, 260, 300], 0.3, 33, "Royalmount_GraniteDark");
  const ledge = translate(rock([260, 300, 90], 0.25, 35, "Royalmount_Granite", true), [-60, 10, 250]);
  parts.push(body, ledge, snowFacets(merge(body, ledge), 0.6));
  // the glaze down the front: lumps of ice running down under the ledge
  for (let i = 0; i < 7; i++) {
    const y = -110 + i * 36 + (rnd() - 0.5) * 20, len = 120 + rnd() * 120;
    parts.push(cylinderBetween([-150, y, 270], [-128 - rnd() * 20, y + (rnd() - 0.5) * 20, 270 - len], 10 + rnd() * 6, 6, rnd() < 0.4 ? "Royalmount_IceDeep" : "Royalmount_Ice", 14 + rnd() * 8));
  }
  parts.push(icicles([-178, -150, 262], [-178, 160, 262], 37, 14, 90));
  parts.push(translate(rock([120, 220, 60], 0.35, 39, "Royalmount_Ice", true), [-170, 0, 0]));
  parts.push(frostRock([90, 80, 60], 0.45, 41, { at: [-150, 170, 0], cover: 0.5 }), frostRock([70, 60, 45], 0.45, 42, { at: [-60, -170, 0], cover: 0.5 }));
  parts.push(mound(260, 180, 30, 43, [-200, 80, 0], 20), mound(200, 160, 24, 44, [120, -150, 0], -10));
  return centre(merge(...parts));
}

// Deadfall: three spruces come down across each other in the snow, their root plates torn up,
// broken branches round them. About 7 x 4.4 m.
function deadfall(): Geo {
  const rnd = seeded(51), parts: Geo[] = [];
  const t1 = fallenTrunk({ seed: 52, len: 620, r: 26, bark: "Royalmount_Log", wood: LOG_END, roots: { soil: "Royalmount_Earth", cover: "Snow" }, broken: true, stubs: 6, bow: 20 });
  const t2 = fallenTrunk({ seed: 53, len: 480, r: 20, bark: "Royalmount_Log", wood: LOG_END, broken: true, stubs: 4, snow: "Snow", bow: 14 });
  const t3 = fallenTrunk({ seed: 54, len: 380, r: 16, bark: "Royalmount_Log", wood: LOG_END, stubs: 3 });
  parts.push(rotateZ(t1, 78), translate(rotateZ(t2, 112), [-40, 60, 34]), translate(rotateZ(t3, 30), [90, -40, 0]));
  // broken branches with their twigs
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2, d = 80 + rnd() * 220, p: V3 = [Math.cos(a) * d * 1.3, Math.sin(a) * d * 0.7, 0];
    const len = 60 + rnd() * 90, b = rnd() * Math.PI * 2;
    const q: V3 = [p[0] + Math.cos(b) * len, p[1] + Math.sin(b) * len, 8 + rnd() * 30];
    parts.push(cylinderBetween(p, q, 3.5, 5, "Royalmount_Log", 1.5));
    parts.push(cylinderBetween(q, [q[0] + (rnd() - 0.5) * 50, q[1] + (rnd() - 0.5) * 50, q[2] + 10 + rnd() * 30], 1.6, 4, "Royalmount_Log", 0.6));
  }
  parts.push(mound(420, 200, 34, 57, [-60, 30, 0], 70), mound(260, 160, 26, 58, [180, -120, 0], 20), mound(220, 150, 22, 59, [-260, -60, 0], -30));
  return centre(merge(...parts));
}

// Red-twigged dogwood: a clump of bare red stems standing out of a snow mound, a few dry leaves
// still clinging. About 1.7 m across, 1.5 m high.
function redOsier(): Geo {
  const rnd = seeded(61), parts: Geo[] = [mound(170, 150, 26, 63)];
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 30, lean = 0.15 + rnd() * 0.45, h = 80 + rnd() * 70;
    const p0: V3 = [Math.cos(a) * d, Math.sin(a) * d, 0];
    const p1: V3 = [p0[0] + Math.cos(a) * lean * h * 0.5, p0[1] + Math.sin(a) * lean * h * 0.5, h * 0.55];
    const p2: V3 = [p0[0] + Math.cos(a + (rnd() - 0.5) * 0.4) * lean * h * 1.1, p0[1] + Math.sin(a + (rnd() - 0.5) * 0.4) * lean * h * 1.1, h];
    parts.push(cylinderBetween(p0, p1, 2.2, 5, "Royalmount_RedTwig", 1.6), cylinderBetween(p1, p2, 1.6, 4, "Royalmount_RedTwig", 0.6));
    if (rnd() < 0.5) parts.push(cylinderBetween(p1, [p1[0] + (rnd() - 0.5) * 40, p1[1] + (rnd() - 0.5) * 40, p1[2] + 20 + rnd() * 25], 1.1, 4, "Royalmount_RedTwig", 0.5));
    if (rnd() < 0.25) parts.push(translate(rotateZ(box([1, 8, 5], [0, 0, 0], "Royalmount_DryLeaf"), rnd() * 180), p2));
  }
  return merge(...parts);
}

// A juniper sprawled low over the snow: dark needles in tufts, snow lying on its top. About 2.4 x
// 1.9 m, 0.9 m high.
function snowJuniper(): Geo {
  const rnd = seeded(71), cards = new Cards(), lobes: Lobe[] = [], parts: Geo[] = [mound(260, 210, 18, 73)];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + rnd() * 0.4, d = i === 0 ? 0 : 45 + rnd() * 25, r = 52 + rnd() * 14;
    lobes.push([Math.cos(a) * d * 1.25, Math.sin(a) * d, r * 0.5 + (i === 0 ? 20 : 0), r, r * 0.95, r * 0.55]);
  }
  const look: ShrubLook = { core: "Royalmount_JuniperCore", dark: "Royalmount_JuniperDark", mid: "Royalmount_Juniper", light: "Royalmount_JuniperLight" };
  parts.push(shrub({ seed: 75, lobes, leaf: 20, look, ragged: 0.4, core: 0.85, cards, stems: { mat: "Royalmount_Log", r: 3, n: 5 } }));
  // snow caps on the upper lobes
  for (const [x, y, z, rx, , rz] of lobes) if (z > 30) parts.push(blob(rx * 0.62, [x + 3, y - 2, z + rz * 0.6], "Snow", 0.3, 8));
  return merge(...parts, cards.geo());
}

// Plates of shore ice: broken slabs pushed up against each other at the water's edge, snow
// blown over them (ground: walked round, not over). About 4.4 x 3.2 m.
function iceShelf(): Geo {
  const rnd = seeded(81), parts: Geo[] = [];
  for (let i = 0; i < 9; i++) {
    const at: [number, number] = [(rnd() - 0.5) * 360, (rnd() - 0.5) * 240], r = 50 + rnd() * 70;
    const tilt = (rnd() - 0.5) * 30, turn = rnd() * 180;
    const plate = slab(blobOutline(r * 1.3, r, 83 + i, 0.2, 9), 0, 8 + rnd() * 8, rnd() < 0.35 ? "Royalmount_IceDeep" : "Royalmount_Ice", "Royalmount_IceDeep");
    parts.push(translate(rotateZ(rotateY(plate, tilt), turn), [at[0], at[1], Math.abs(tilt) * 1.2]));
  }
  for (let i = 0; i < 4; i++) parts.push(mound(80 + rnd() * 60, 50 + rnd() * 40, 10, 91 + i, [(rnd() - 0.5) * 300, (rnd() - 0.5) * 200, 4], rnd() * 180));
  return centre(merge(...parts));
}

// A crowned waystone of the royal roads: a granite post on two steps, the crest on its front,
// a gilt crown on its head, arrow boards and a lantern on an iron arm. About 1.2 m, 2.9 m high.
function royalWaystone(): Geo {
  const parts: Geo[] = [
    boxBounds([-50, -50, -10], [50, 50, 16], "Royalmount_Ashlar", 3),
    boxBounds([-38, -38, 16], [38, 38, 36], "Royalmount_Ashlar", 3),
    boxBounds([-21, -21, 36], [21, 21, 230], "Royalmount_Granite", 3),
    boxBounds([-26, -26, 222], [26, 26, 238], "Royalmount_Ashlar", 2),
    crest([-23, 0, 175], 30),
    // the crown on its head
    cylinderAt({ radius: 15, height: 8, segments: 12, bottom: [0, 0, 238] }, "GoldTrim"),
    blob(14, [0, 0, 249], "Royalmount_RoyalBlue", 0.6, 8),
  ];
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2, p: V3 = [Math.cos(a) * 14, Math.sin(a) * 14, 246];
    parts.push(cylinderAt({ rBot: 4.5, rTop: 0, height: 12, segments: 4, bottom: p }, "GoldTrim"), sphereCenter(2.2, [p[0], p[1], 259], "Royalmount_PaintWhite", 5));
  }
  parts.push(sphereCenter(4, [0, 0, 262], "GoldTrim", 6));
  // arrow boards on the sides, pointing the ways
  for (const [s, z, len] of [[1, 140, 70], [-1, 118, 60]] as [number, number, number][]) {
    parts.push(translate(merge(box([4, len, 18], [0, s * (len / 2 + 21), 0], "Royalmount_Plank", 1.5), translate(rotateX(box([4, 13, 13], [0, 0, 0], "Royalmount_Plank", 1), 45), [0, s * (len + 21), 0]), box([5, len - 14, 3], [0, s * (len / 2 + 18), 10], "Snow", 1)), [0, 0, z]));
  }
  // the lantern
  parts.push(beamBetween([-21, 0, 212], [-62, 0, 212], 5, 5, "Royalmount_Iron"), cylinderBetween([-60, 0, 212], [-60, 0, 198], 0.8, 4, "Royalmount_Iron"));
  parts.push(boxBounds([-70, -9, 166], [-50, 9, 196], "Royalmount_Iron", 1), boxBounds([-68, -7, 169], [-52, 7, 193], "LanternGlow"));
  parts.push(rotateZ(cylinderAt({ rBot: 13, rTop: 2, height: 9, segments: 4, bottom: [-60, 0, 196] }, "Royalmount_Iron"), 45));
  parts.push(blob(30, [0, 0, 36], "Snow", 0.25, 8), mound(150, 140, 16, 97));
  return merge(...parts);
}

// ======================================================================================
// ---- the royal hunting forest ----

// The king's hunting lodge: a log hall on a stone footing under a steep roof, its gable to the
// front over a deep porch (the trophy of a great stag on the gable, royal banners hung from the
// porch beam), a fieldstone chimney up one side with smoke rising, glazed windows with blue
// shutters, firewood stacked at the back, snow on the roof and banked round the walls. About
// 11 x 8.6 m, 6.4 m high.
function huntingLodge(): Geo {
  const rnd = seeded(301), X = 420, Y = 330, n = 10, parts: Geo[] = [];
  const top = 50 + n * 24 + 10;
  parts.push(boxBounds([-X - 22, -Y - 22, -12], [X + 22, Y + 22, 50], "StoneGrey", 4));
  // the walls: the door and two windows in front, two windows down each side but the chimney's
  parts.push(logWall([-X, -Y], [-X, Y], 50, n, 303, [[Y - 75, Y + 75, 50, 272], [Y - 255, Y - 165, 128, 228], [Y + 165, Y + 255, 128, 228]]));
  parts.push(logWall([X, -Y], [X, Y], 50, n, 305, [[Y - 45, Y + 45, 128, 228]]));
  parts.push(logWall([-X, -Y], [X, -Y], 50, n, 307, [[X - 250, X - 170, 128, 228], [X + 170, X + 250, 128, 228]]));
  parts.push(logWall([-X, Y], [X, Y], 50, n, 309, [[X - 250, X - 170, 128, 228]]));
  for (const y of [-210, 210]) parts.push(glazed(-X - 8, y, 134, [-1, 0], 72, 86));
  parts.push(glazed(X + 8, 0, 134, [1, 0], 72, 86));
  for (const x of [-210, 210]) parts.push(glazed(x, -Y - 8, 134, [0, -1], 72, 86));
  parts.push(glazed(-210, Y + 8, 134, [0, 1], 72, 86));
  // the door: a frame, two leaves of planks with iron straps, a lantern beside it
  parts.push(boxBounds([-X - 16, -82, 50], [-X - 4, -70, 280], "Royalmount_TimberDark", 2), boxBounds([-X - 16, 70, 50], [-X - 4, 82, 280], "Royalmount_TimberDark", 2), boxBounds([-X - 18, -90, 268], [-X - 2, 90, 290], "Royalmount_TimberDark", 2));
  for (let k = -3; k <= 2; k++) parts.push(boxBounds([-X - 12, k * 23 + 1, 52], [-X - 6, k * 23 + 22, 266], "DoorWood"));
  for (const z of [90, 220]) parts.push(boxBounds([-X - 15, -66, z], [-X - 11, 66, z + 7], "Royalmount_Iron"));
  parts.push(sphereCenter(4, [-X - 15, -12, 160], "Royalmount_Iron", 6), sphereCenter(4, [-X - 15, 12, 160], "Royalmount_Iron", 6));
  parts.push(cylinderBetween([-X - 6, 112, 235], [-X - 40, 112, 235], 2, 4, "Royalmount_Iron"), boxBounds([-X - 52, 100, 190], [-X - 28, 124, 226], "Royalmount_Iron", 1), boxBounds([-X - 49, 103, 194], [-X - 31, 121, 222], "LanternGlow"));
  // the roof, carried on over the porch; snow on it, icicles under its eaves
  const RH = 270, PX = 190, half = Y + 22;
  parts.push(gableRoof([2 * X + PX, 2 * half, 14], [-PX / 2, 0, top], RH, 55, "RoofSlate"));
  // (the snow lies on the upper two thirds of each slope: the same slope, a smaller roof higher up)
  parts.push(gableRoof([2 * X + PX + 6, 2 * half * 0.66, 10], [-PX / 2, 0, top + 13 + RH * 0.34], RH * 0.66, 49, "Snow"));
  parts.push(gableWall(-X - 6, half, top, RH, "Royalmount_Plank"), gableWall(X + 6, half, top, RH, "Royalmount_Plank"));
  // (the boards of the gables, upright)
  for (const x of [-X - 9, X + 9]) for (let y = -half + 30; y < half - 20; y += 34) parts.push(boxBounds([x - 2, y - 2, top], [x + 2, y + 2, top + RH * (1 - Math.abs(y) / half) - 6], "Royalmount_TimberDark"));
  const ez = top - (55 * RH) / half;
  for (const s of [-1, 1]) parts.push(icicles([-X - PX - 50, s * (half + 50), ez + 6], [X + 50, s * (half + 50), ez + 6], 311 + s, 18, 60));
  // the porch: a floor of boards, steps down, posts to a tie beam, a king post and struts, the
  // trophy on the gable over it, banners hung from the beam, a bench
  const fx = -X - PX + 15;
  parts.push(boxBounds([-X - PX, -Y, 30], [-X, Y, 48], "Royalmount_Plank", 2));
  for (const [dx, h] of [[-26, 30], [-52, 14]] as [number, number][]) parts.push(boxBounds([-X - PX + dx, -110, -6], [-X - PX + dx + 26, 110, h], "StoneGrey", 3));
  for (const y of [-Y + 16, -110, 110, Y - 16]) parts.push(boxAt([24, 24, top - 48], [fx, y, 48], "Royalmount_TimberDark", 3), boxAt([34, 34, 14], [fx, y, 34], "StoneGrey", 2));
  parts.push(beamBetween([fx, -half - 30, top + 6], [fx, half + 30, top + 6], 28, 30, "Royalmount_TimberDark"));
  parts.push(boxAt([22, 22, RH - 30], [fx, 0, top + 20], "Royalmount_TimberDark", 2));
  for (const s of [-1, 1]) parts.push(beamBetween([fx, 0, top + 120], [fx, s * 200, top + 20], 16, 16, "Royalmount_TimberDark"));
  for (const s of [-1, 1]) parts.push(beamBetween([fx, s * (Y - 16), top - 70], [fx, s * (Y - 110), top], 14, 14, "Royalmount_TimberDark"));
  parts.push(trophy([fx - 16, 0, top + 128], 1.15, 315));
  parts.push(crest([-X - 14, 0, top + 70], 52));
  for (const y of [-200, 200]) parts.push(banner([fx - 16, y, top - 8], 58, 175));
  parts.push(boxBounds([-X - 60, -Y + 40, 82], [-X - 20, -Y + 200, 90], "Royalmount_Plank", 2));
  for (const y of [-Y + 50, -Y + 190]) parts.push(boxBounds([-X - 56, y - 4, 48], [-X - 24, y + 4, 82], "Royalmount_TimberDark"));
  // the chimney of fieldstone up the +Y side, smoke from it
  const cx = 150, cw = 120, cy = Y + 22;
  parts.push(boxAt([cw, 90, top + 140], [cx, cy + 45, -12], "StoneGrey", 4), boxAt([cw - 30, 70, RH + 150], [cx, cy + 45, top + 120], "StoneGrey", 4));
  parts.push(boxAt([cw - 14, 84, 16], [cx, cy + 45, top + RH + 262], "StoneDark", 3), blob(44, [cx, cy + 45, top + RH + 280], "Snow", 0.3, 8));
  for (let i = 0; i < 6; i++) parts.push(frostRock([30 + rnd() * 16, 26, 22], 0.4, 317 + i, { mat: "Royalmount_Granite", at: [cx - 70 + rnd() * 140, cy + 90 + rnd() * 10, rnd() * 260], cover: 0 }));
  parts.push(plume([cx, cy + 45, top + RH + 300], 5, 34, 323, "Royalmount_Smoke", 46, [40, 60]));
  // firewood under a lean-to at the back
  for (let r = 0; r < 4; r++)
    for (let k = 0; k < 9; k++) {
      const y = -220 + k * 30 + (r % 2) * 14, z = 16 + r * 26;
      parts.push(cylinderBetween([X + 30, y, z], [X + 110, y + (rnd() - 0.5) * 6, z], 12, 7, "Royalmount_Log"), cylinderBetween([X + 110, y, z], [X + 111, y, z], 10, 7, LOG_END));
    }
  parts.push(translate(rotateY(boxBounds([0, -250, 0], [130, 250, 8], "RoofSlate", 2), 16), [X + 15, 0, 150]), translate(rotateY(boxBounds([0, -246, 8], [126, 246, 16], "Snow", 3), 16), [X + 15, 0, 150]));
  // snow banked against the walls
  parts.push(mound(320, 120, 50, 325, [60, Y + 140, 0], 0), mound(360, 130, 44, 326, [-60, -Y - 70, 0], 0), mound(240, 150, 40, 327, [X + 190, -150, 0], 80), mound(200, 120, 30, 328, [-X - PX - 120, -Y + 40, 0], 70), mound(180, 110, 28, 329, [-X - PX - 110, Y - 30, 0], 110));
  return translate(merge(...parts), [45, 0, 0]);
}

// A game-watching tower of the royal hunt: four log legs splayed on stone footings, braced in
// crosses, a ladder up the front, and on top a hide of boards with an open band to watch from
// under a pyramid roof. About 3.4 x 3.4 m, 9.8 m high.
function gameTower(): Geo {
  const parts: Geo[] = [], H = 600, B = 155, T = 118, rnd = seeded(331);
  const leg = (sx: number, sy: number, z: number): V3 => {
    const k = (z + 10) / (H + 170), r = B + (T - B) * k;
    return [sx * r, sy * r, z];
  };
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    parts.push(cylinderBetween(leg(sx, sy, -10), leg(sx, sy, H + 160), 13, 8, "Royalmount_Log", 11));
    parts.push(frostRock([62, 58, 30], 0.4, 333 + sx + 2 * sy + 3, { at: [sx * B, sy * B, -6], cover: 0.4 }));
  }
  // cross braces on every side, two storeys of them, and girts at each level
  const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (let c = 0; c < 4; c++) {
    const [ax, ay] = corners[c], [bx, by] = corners[(c + 1) % 4];
    for (const [z0, z1] of [[40, 300], [300, H - 10]]) {
      parts.push(beamBetween(leg(ax, ay, z0), leg(bx, by, z1), 9, 12, "Royalmount_Timber"));
      if (!(ax === -1 && bx === -1)) parts.push(beamBetween(leg(bx, by, z0), leg(ax, ay, z1), 9, 12, "Royalmount_Timber"));
    }
    for (const z of [300, H - 10]) parts.push(beamBetween(leg(ax, ay, z), leg(bx, by, z), 12, 14, "Royalmount_TimberDark"));
  }
  // the floor, the hide's walls (an open band to watch through), corner posts, the roof
  const P = T + 30;
  parts.push(boxBounds([-P, -P, H], [P, P, H + 14], "Royalmount_Plank", 2));
  for (const [s, axis] of [[-1, 0], [1, 0], [-1, 1], [1, 1]] as [number, number][]) {
    for (let k = -P + 10; k < P - 4; k += 24) {
      const lo: V3 = axis === 0 ? [s * P - 3, k, H + 14] : [k, s * P - 3, H + 14];
      const hi: V3 = axis === 0 ? [s * P + 3, k + 22, H + 104] : [k + 22, s * P + 3, H + 104];
      // (a hatch's gap in the front boards by the ladder)
      if (axis === 0 && s === -1 && k > -40 && k < 40) continue;
      parts.push(boxBounds(lo, hi, rnd() < 0.5 ? "Royalmount_Plank" : "WoodGrey"));
    }
    const a: V3 = axis === 0 ? [s * P - 4, -P, H + 150] : [-P, s * P - 4, H + 150], b: V3 = axis === 0 ? [s * P + 4, P, H + 172] : [P, s * P + 4, H + 172];
    parts.push(boxBounds(a, b, "Royalmount_Timber", 1.5));
  }
  for (const [sx, sy] of corners) parts.push(boxAt([16, 16, 172], [sx * (P - 8), sy * (P - 8), H + 14], "Royalmount_TimberDark", 2));
  parts.push(rotateZ(cylinderAt({ rBot: (P + 60) * Math.SQRT2, rTop: 0, height: 150, segments: 4, bottom: [0, 0, H + 172] }, "RoofSlate"), 45));
  parts.push(rotateZ(cylinderAt({ rBot: (P - 10) * Math.SQRT2 * 0.62, rTop: 0, height: 150 * 0.6, segments: 4, bottom: [0, 0, H + 172 + 150 * 0.4 + 4] }, "Snow"), 45));
  parts.push(cylinderAt({ radius: 4, height: 60, segments: 6, bottom: [0, 0, H + 315] }, "Royalmount_TimberDark"), translate(rotateZ(box([2, 50, 30], [0, 25, 0], "Royalmount_RoyalBlue"), -20), [0, 0, H + 360]));
  for (const s of [-1, 1]) parts.push(icicles([-P - 58, s * (P + 58), H + 170], [P + 58, s * (P + 58), H + 170], 337 + s, 20, 45));
  // the ladder up the front to the hatch
  for (const s of [-1, 1]) parts.push(cylinderBetween([-B - 70, s * 28, -4], [-P - 6, s * 28, H + 60], 4.5, 6, "Royalmount_Timber"));
  for (let k = 1; k < 18; k++) {
    const t = k / 18, x = -B - 70 + (-P - 6 + B + 70) * t, z = -4 + (H + 64) * t;
    parts.push(cylinderBetween([x, -28, z], [x, 28, z], 2.8, 5, "Royalmount_Plank"));
  }
  parts.push(mound(260, 220, 26, 339, [20, 40, 0], 30), mound(120, 100, 18, 340, [-B - 90, 60, 0]));
  return merge(...parts);
}

// The gateway of the royal hunt over the bridle path (the way through runs along X): two great
// log posts on stone footings, a crossbeam carrying a stag's antlers, the crest on a board hung
// under it, more antlers bound to each post, lanterns, blue pennants. About 1.3 x 7.6 m across,
// 6.2 m high.
function antlerArch(): Geo {
  const parts: Geo[] = [], W = 310, Hh = 430, rnd = seeded(351);
  for (const s of [-1, 1]) {
    const y = s * W;
    parts.push(frostRock([95, 95, 70], 0.3, 353 + s, { at: [0, y, -10], cover: 0.45 }));
    parts.push(cylinderBetween([0, y, 0], [0, y, Hh + 40], 22, 10, "Royalmount_Log", 19));
    parts.push(cylinderBetween([0, y, Hh + 40], [0, y, Hh + 44], 17, 10, LOG_END));
    // iron bands, the antlers bound high on the post, a lantern on a hook
    for (const z of [90, Hh - 60]) parts.push(cylinderAt({ radius: 22.5, height: 7, segments: 10, bottom: [0, y, z] }, "Royalmount_Iron"));
    parts.push(antler([-18, y - s * 8, Hh - 140], -1, 0.62, 355 + s), antler([-18, y + s * 8, Hh - 140], 1, 0.62, 357 + s));
    parts.push(translate(scale(sphereCenter(9, [0, 0, 0], "Royalmount_Antler", 7), [1.2, 0.8, 0.7]), [-22, y, Hh - 136]));
    parts.push(beamBetween([-20, y - s * 30, 300], [-60, y - s * 30, 300], 5, 5, "Royalmount_Iron"));
    parts.push(boxBounds([-72, y - s * 30 - 11, 248], [-48, y - s * 30 + 11, 286], "Royalmount_Iron", 1), boxBounds([-69, y - s * 30 - 8, 252], [-51, y - s * 30 + 8, 282], "LanternGlow"));
    parts.push(rotateZ(cylinderAt({ rBot: 15, rTop: 2, height: 10, segments: 4, bottom: [-60, y - s * 30, 286] }, "Royalmount_Iron"), 45));
    // braces from the post to the beam
    parts.push(beamBetween([0, y, Hh - 110], [0, y - s * 110, Hh - 5], 14, 14, "Royalmount_Timber"));
    // a pennant from the beam's end
    parts.push(translate(merge(boxBounds([-2, -22, -150], [2, 22, 0], "Royalmount_RoyalBlue"), translate(rotateX(box([3, 31, 31], [0, 0, 0], "Royalmount_RoyalBlue"), 45), [0, 0, -150]), boxBounds([-3, -22, -8], [3, 22, 0], "FabricGold")), [0, y + s * 60, Hh + 10]));
  }
  // the crossbeams, snow on the top one
  parts.push(cylinderBetween([0, -W - 90, Hh + 18], [0, W + 90, Hh + 18], 20, 10, "Royalmount_Log"));
  for (const s of [-1, 1]) parts.push(cylinderBetween([0, s * (W + 90), Hh + 18], [0, s * (W + 92), Hh + 18], 17, 10, LOG_END));
  parts.push(translate(scale(cylinderBetween([0, -W - 80, 0], [0, W + 80, 0], 16, 8, "Snow"), [1, 1, 0.5]), [0, 0, Hh + 36]));
  parts.push(beamBetween([0, -W, Hh - 70], [0, W, Hh - 70], 16, 18, "Royalmount_TimberDark"));
  // the board with the crest, hung on chains under the top beam
  parts.push(boxBounds([-6, -95, Hh - 200], [6, 95, Hh - 110], "Royalmount_Plank", 2), boxBounds([-8, -100, Hh - 205], [-5, 100, Hh - 198], "GoldTrim"), boxBounds([-8, -100, Hh - 112], [-5, 100, Hh - 105], "GoldTrim"));
  parts.push(crest([-10, 0, Hh - 160], 40));
  for (const s of [-1, 1]) parts.push(cylinderBetween([0, s * 80, Hh - 110], [0, s * 80, Hh - 62], 1.5, 4, "Royalmount_Iron"));
  // the great antlers on the top beam: a skull and a rack spreading wide
  parts.push(trophy([-10, 0, Hh + 40], 2.3, 361));
  // stones and snow at the feet
  for (let i = 0; i < 6; i++) {
    const s = i % 2 ? 1 : -1;
    parts.push(frostRock([36 + rnd() * 20, 30, 22], 0.45, 363 + i, { at: [(rnd() - 0.5) * 120, s * (W + 60 + rnd() * 60), 0], cover: 0.5 }));
  }
  parts.push(mound(200, 160, 28, 371, [20, -W - 40, 0], 0), mound(200, 160, 28, 372, [20, W + 40, 0], 0));
  return merge(...parts);
}

// The horn dais: a round stone platform of two steps where the royal huntsman blows the great horn
// to start the hunt; the horn rests on a carved stand, two banner poles behind, a brazier at the
// side, steps up at the front. About 5.2 m across.
function hornPlatform(): Geo {
  const parts: Geo[] = [], rnd = seeded(381);
  parts.push(cylinderAt({ radius: 240, height: 34, segments: 20, bottom: [0, 0, -10] }, "Royalmount_Ashlar"));
  parts.push(cylinderAt({ radius: 200, height: 34, segments: 20, bottom: [0, 0, 24] }, "Royalmount_Ashlar"));
  parts.push(cylinderAt({ radius: 203, height: 6, segments: 20, bottom: [0, 0, 56] }, "Royalmount_Granite"));
  // steps up at the front
  for (const [x, z] of [[-262, 14], [-232, 34]] as [number, number][]) parts.push(boxBounds([x - 26, -80, -10], [x + 26, 80, z], "Royalmount_Ashlar", 3));
  // the stand: a stone pedestal, a fork of dark wood, the horn lying in it
  parts.push(boxBounds([-20, -26, 62], [20, 26, 150], "Royalmount_Granite", 3), boxBounds([-26, -32, 140], [26, 32, 156], "Royalmount_Ashlar", 2));
  for (const s of [-1, 1]) parts.push(cylinderBetween([0, s * 12, 156], [0, s * 36, 196], 4, 6, "Royalmount_TimberDark"));
  // the great horn: a curl of brass growing to a flared bell, banded in gold
  const horn: V3[] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14, a = Math.PI * (0.15 + 1.55 * t), R = 46 + 16 * t;
    horn.push([Math.cos(a) * R * 0.25 - 8, 50 - Math.cos(a) * 4 - 100 * t, 190 + Math.sin(a) * R * 0.75]);
  }
  for (let i = 0; i < 14; i++) parts.push(cylinderBetween(horn[i], horn[i + 1], 2.5 + i * 0.75, 8, "Bronze", 2.5 + (i + 1) * 0.75));
  const end = horn[14], prev = horn[13], d: V3 = [end[0] - prev[0], end[1] - prev[1], end[2] - prev[2]], dl = Math.hypot(...d);
  parts.push(cylinderBetween(end, [end[0] + (d[0] / dl) * 26, end[1] + (d[1] / dl) * 26, end[2] + (d[2] / dl) * 26], 13, 12, "Bronze", 30));
  for (const k of [3, 8, 13]) parts.push(cylinderBetween(horn[k], horn[k + 1], 3.8 + k * 0.75, 8, "GoldTrim", 3.8 + (k + 1) * 0.75));
  parts.push(sphereCenter(4, horn[0], "GoldTrim", 6));
  // the banner poles behind, a brazier with its coals at the side
  for (const s of [-1, 1]) {
    parts.push(cylinderAt({ radius: 6, height: 380, segments: 8, bottom: [120, s * 110, 56] }, "Royalmount_TimberDark"), sphereCenter(8, [120, s * 110, 440], "GoldTrim", 6));
    parts.push(banner([110, s * 110, 410], 56, 190));
  }
  const bz: V3 = [40, -150, 62];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    parts.push(cylinderBetween([bz[0] + Math.cos(a) * 30, bz[1] + Math.sin(a) * 30, bz[2]], [bz[0] + Math.cos(a) * 14, bz[1] + Math.sin(a) * 14, bz[2] + 90], 2.5, 5, "Royalmount_Iron"));
  }
  parts.push(cylinderAt({ rBot: 18, rTop: 32, height: 22, segments: 10, bottom: [bz[0], bz[1], bz[2] + 86] }, "Royalmount_Iron"), blob(26, [bz[0], bz[1], bz[2] + 106], "Royalmount_Coal", 0.35, 8));
  parts.push(blob(18, [bz[0], bz[1], bz[2] + 110], "FireGlow", 0.5, 8));
  // snow lying on the steps' edges, round the foot
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rnd() * 0.4;
    if (Math.cos(a) < -0.7) continue;
    parts.push(mound(110, 70, 16, 383 + i, [Math.cos(a) * 250, Math.sin(a) * 250, 0], (a * DEG) + 90));
  }
  parts.push(blob(60, [140, 120, 58], "Snow", 0.16, 8), blob(50, [80, -60, 58], "Snow", 0.14, 8));
  return merge(...parts);
}

// A hay rack for the deer in winter: slatted sides in a V between two A-frames, a little shingled
// roof over it, hay pulled out and fallen round it, a trough below, a salt lick on a stump
// beside. About 3 x 1.8 m, 2.3 m high.
function deerFeeder(): Geo {
  const parts: Geo[] = [], L = 110, rnd = seeded(391);
  for (const y of [-L, L]) {
    for (const s of [-1, 1]) parts.push(beamBetween([s * 70, y, -5], [s * 10, y, 200], 10, 10, "Royalmount_Timber"));
    parts.push(beamBetween([-55, y, 50], [55, y, 50], 8, 8, "Royalmount_Timber"));
  }
  parts.push(beamBetween([0, -L - 20, 196], [0, L + 20, 196], 10, 10, "Royalmount_TimberDark"));
  // the V of slats and the hay in it
  for (const s of [-1, 1]) for (let y = -L + 10; y <= L - 10; y += 22) parts.push(beamBetween([s * 8, y, 70], [s * 52, y, 170], 3, 4, "Royalmount_Plank"));
  parts.push(translate(scale(cylinderBetween([0, -L + 8, 0], [0, L - 8, 0], 40, 8, "Royalmount_Hay"), [1, 1, 0.8]), [0, 0, 140]));
  for (let i = 0; i < 10; i++) parts.push(translate(rotateZ(rotateY(box([60, 3, 2], [0, 0, 0], "Royalmount_Hay"), (rnd() - 0.5) * 60), rnd() * 180), [(rnd() - 0.5) * 70, (rnd() - 0.5) * 200, 160 + rnd() * 20]));
  // the roof
  parts.push(rotateZ(gableRoof([2 * L + 30, 110, 6], [0, 0, 196], 64, 22, "RoofSlate"), 90));
  parts.push(rotateZ(gableRoof([2 * L + 30, 110 * 0.6, 5], [0, 0, 202 + 64 * 0.4], 64 * 0.6, 20, "Snow"), 90));
  // the trough below, hay fallen round it
  parts.push(boxBounds([-40, -L + 10, 10], [40, L - 10, 40], "Royalmount_Plank", 2), boxBounds([-34, -L + 16, 30], [34, L - 16, 42], "Royalmount_Hay"));
  for (let i = 0; i < 6; i++) parts.push(blob(30 + rnd() * 18, [(rnd() - 0.5) * 180, (rnd() - 0.5) * 260, 0], "Royalmount_Hay", 0.25, 7));
  // a salt lick on a stump
  parts.push(translate(merge(stumpOf({ seed: 393, h: 55, r: 22, bark: "Royalmount_Log", wood: LOG_END, roots: 4 }), boxBounds([-14, -14, 55], [14, 14, 75], "Royalmount_PaintWhite", 3)), [0, L + 90, 0]));
  parts.push(mound(260, 200, 20, 395, [0, 0, 0], 0));
  return centre(merge(...parts));
}

// Archery butts of the royal hunt: two straw bosses painted in rings on wooden easels, arrows in
// them, a bale of straw and a rack of spare arrows. About 4 x 2 m.
function archeryButts(): Geo {
  const parts: Geo[] = [], rnd = seeded(401);
  for (const [y, s] of [[-110, 1], [120, 0.85]] as [number, number][]) {
    const c: V3 = [0, y, 100 * s + 20];
    // the easel: two legs in front, one behind
    for (const k of [-1, 1]) parts.push(cylinderBetween([-30, y + k * 50 * s, -4], [10, y + k * 30 * s, c[2] + 60 * s], 4, 6, "Royalmount_Timber"));
    parts.push(cylinderBetween([90, y, -4], [10, y, c[2] + 50 * s], 4, 6, "Royalmount_Timber"));
    // the boss, tilted back a little, its painted rings
    const boss = merge(
      rotateY(cylinderAt({ radius: 62 * s, height: 26, segments: 16, bottom: [0, 0, -13] }, "Royalmount_Straw"), 90),
      ...([[62, "Royalmount_PaintWhite"], [48, "Royalmount_PaintRed"], [34, "Royalmount_RoyalPaint"], [20, "Royalmount_PaintWhite"], [9, "GoldTrim"]] as [number, string][]).map(([r, m], i) => rotateY(cylinderAt({ radius: r * s, height: 1, segments: 16, bottom: [0, 0, 13 + i * 0.3] }, m), -90)),
    );
    parts.push(translate(rotateY(boss, -12), [c[0] + 5, c[1], c[2]]));
    for (let i = 0; i < 4; i++) {
      const a = rnd() * Math.PI * 2, d = rnd() * 40 * s, p: V3 = [c[0] - 8, c[1] + Math.cos(a) * d, c[2] + Math.sin(a) * d];
      parts.push(cylinderBetween(p, [p[0] - 60, p[1] + (rnd() - 0.5) * 10, p[2] + 6], 0.9, 4, "Royalmount_Plank"), translate(box([6, 1, 6], [0, 0, 0], "FabricWhite"), [p[0] - 56, p[1], p[2] + 6]));
    }
  }
  parts.push(boxBounds([-50, 240, 0], [50, 330, 60], "Royalmount_Straw", 4), boxBounds([-52, 238, 26], [52, 332, 30], "RopeTan"));
  parts.push(boxBounds([-20, -280, 0], [20, -220, 90], "Royalmount_Plank", 2));
  for (let i = 0; i < 6; i++) parts.push(cylinderBetween([0, -270 + i * 9, 10], [-6, -270 + i * 9, 140], 0.9, 4, "Royalmount_Plank"), translate(box([1, 1, 10], [0, 0, 0], "FabricWhite"), [-6, -270 + i * 9, 136]));
  parts.push(mound(200, 380, 18, 403, [10, 0, 0], 0));
  return centre(merge(...parts));
}

// ======================================================================================
// ---- the valley of the frozen falls ----

// The great frozen falls: the waterfall stopped in columns of ice from the lip of a 9 m cliff,
// bulging out toward its foot, frozen spray in lumps down its face, a mound of ice where it
// meets the ground and the frozen plunge pool before it. Its back (+X) goes against the cliff.
// About 11 m across, 9.2 m high.
function greatIcefall(): Geo {
  const rnd = seeded(411), W = 480, Hh = 900, parts: Geo[] = [];
  parts.push(box([200, 2 * W + 260, Hh + 60], [140, 0, (Hh + 60) / 2 - 30], "Royalmount_GraniteDark", 30));
  const out = (z: number) => 20 - 250 * (1 - z / Hh) ** 1.7;
  for (let y = -W; y <= W; y += 23) {
    const e = Math.abs(y) / W, top = Hh - e * e * 170 - rnd() * 60, r = 14 + rnd() * 12, mid = top * 0.45 + rnd() * 120;
    const mat = rnd() < 0.3 ? "Royalmount_IceDeep" : rnd() < 0.5 ? "Royalmount_IceGlow" : "Royalmount_Ice";
    parts.push(cylinderBetween([out(top) + 6, y, top], [out(mid) - 4, y + (rnd() - 0.5) * 10, mid], r * 0.55, 6, mat, r));
    parts.push(cylinderBetween([out(mid) - 4, y, mid], [out(0) - 10, y * 1.08, -5], r, 6, mat, r * 1.6));
  }
  // frozen spray in lumps down its face
  for (let i = 0; i < 10; i++) {
    const z = 120 + rnd() * 620, y = (rnd() - 0.5) * W * 1.6, r = 26 + rnd() * 22;
    parts.push(translate(scale(sphereCenter(r, [0, 0, 0], rnd() < 0.5 ? "Royalmount_Ice" : "Royalmount_IceDeep", 8), [0.45, 1.3, 2.2]), [out(z) - 14, y, z]));
  }
  // the lip: snow-capped rocks either side, icicles off them
  for (const s of [-1, 1]) {
    parts.push(frostRock([300, 280, 300], 0.3, 413 + s, { mat: "Royalmount_GraniteDark", at: [90, s * (W + 150), Hh - 240], cover: 0.5 }));
    parts.push(icicles([-40, s * W, Hh - 10], [-40, s * (W + 260), Hh - 40], 415 + s, 16, 120));
  }
  parts.push(translate(rock([320, 2 * W + 240, 110], 0.25, 417, "Snow", true), [80, 0, Hh - 40]));
  // the mound of ice at its foot, the plunge pool frozen before it, snow round about
  parts.push(translate(rock([360, 2 * W + 180, 200], 0.35, 419, "Royalmount_Ice", true), [-170, 0, -10]));
  parts.push(slab(shift(blobOutline(380, W + 240, 421, 0.12, 18), -480, 0), -2, 6, "Royalmount_IceDeep", "Royalmount_Ice"));
  for (let i = 0; i < 6; i++) parts.push(crystal([-200 - rnd() * 360, (rnd() - 0.5) * 2 * W, 0], [(rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.3, 1], 60 + rnd() * 120, 14 + rnd() * 8, "Royalmount_Ice"));
  parts.push(mound(300, 240, 50, 423, [-300, W + 260, 0], 20), mound(320, 260, 54, 424, [-280, -W - 260, 0], -20), mound(200, 160, 30, 425, [-760, W - 40, 0]));
  return merge(...parts);
}

// Pillars of ice: spray from the falls frozen into columns standing out of the snow, lumpy and
// clear, snow on their heads, ice heaped round their feet. About 4 m across, up to 5.6 m high.
function iceColumns(): Geo {
  const rnd = seeded(431), parts: Geo[] = [];
  const cols: [number, number, number, number][] = [[0, 0, 560, 62], [140, 110, 400, 46], [-120, 140, 300, 40], [90, -150, 240, 36], [-150, -90, 170, 30], [210, -20, 130, 26]];
  for (const [x, y, h, r] of cols) {
    // a column narrowing to its head with a kink in it, drips of ice down its sides, its foot
    // spread in a skirt
    const mid: V3 = [x + (rnd() - 0.5) * 30, y + (rnd() - 0.5) * 30, h * (0.45 + rnd() * 0.15)], top: V3 = [x + (rnd() - 0.5) * 40, y + (rnd() - 0.5) * 40, h];
    parts.push(cylinderBetween([x, y, -6], mid, r, 8, "Royalmount_IceGlow", r * 0.78));
    parts.push(cylinderBetween(mid, top, r * 0.78, 8, "Royalmount_IceGlow", r * 0.3));
    parts.push(translate(scale(sphereCenter(r * 0.78, [0, 0, 0], "Royalmount_IceGlow", 8), [1, 1, 0.5]), mid));
    parts.push(cylinderAt({ rBot: r * 1.7, rTop: r * 0.9, height: r * 0.9, segments: 8, bottom: [x, y, -4] }, "Royalmount_IceDeep"));
    for (let k = 0; k < 4; k++) {
      const a = rnd() * Math.PI * 2, z0 = h * (0.3 + rnd() * 0.5), len = 40 + rnd() * 90, rr = r * (0.25 + rnd() * 0.15);
      const at: V3 = [x + (top[0] - x) * (z0 / h) + Math.cos(a) * r * 0.75, y + (top[1] - y) * (z0 / h) + Math.sin(a) * r * 0.75, z0];
      parts.push(cylinderBetween(at, [at[0] + Math.cos(a) * 8, at[1] + Math.sin(a) * 8, z0 - len], rr, 6, "Royalmount_Ice", 1));
    }
    parts.push(blob(r * 0.42, [top[0], top[1], h - 6], "Snow", 0.6, 8));
  }
  parts.push(translate(rock([420, 360, 70], 0.4, 437, "Royalmount_Ice", true), [20, 0, -8]));
  parts.push(mound(480, 420, 34, 439, [0, 0, 0], 20));
  return centre(merge(...parts));
}

// A hot spring: turquoise water steaming in a pool rimmed with mineral crust, terraces of pale
// travertine stepping down from it stained ochre where it overflows, the snow melted back round
// it, stones, a wooden dipper on a post. About 6.4 x 5.2 m.
function hotSpring(): Geo {
  const rnd = seeded(441), parts: Geo[] = [];
  const pool = blobOutline(240, 180, 443, 0.12, 18);
  parts.push(slab(blobOutline(330, 270, 445, 0.12, 18), -6, 8, "Royalmount_Travertine", "Royalmount_Ochre", 2));
  parts.push(slab(shift(blobOutline(220, 150, 447, 0.15, 14), -170, 60), -6, 16, "Royalmount_Ochre", "Royalmount_Travertine", 2));
  parts.push(slab(shift(pool, 0, 0, 1.06), 8, 14, "Royalmount_Ochre", "Royalmount_Ochre", 2));
  parts.push(slab(pool, 2, 18, "Royalmount_HotWater"));
  // the rim of crusted stones round the water
  pool.forEach(([x, y], i) => {
    if (i % 2) return;
    parts.push(frostRock([46 + rnd() * 30, 38 + rnd() * 20, 26 + rnd() * 16], 0.4, 449 + i, { mat: rnd() < 0.5 ? "Royalmount_Travertine" : "Royalmount_Ochre", at: [x * 1.12, y * 1.12, 8], cover: 0 }));
  });
  // little cascades of crust down the terrace front
  for (let i = 0; i < 4; i++) parts.push(translate(rock([80, 60, 30], 0.35, 461 + i, "Royalmount_Ochre", true), [-260 + rnd() * 40, -120 + i * 70, 0]));
  // steam rising off the water
  parts.push(plume([-40, 20, 40], 6, 60, 465, "Royalmount_Steam", 40, [30, 40]), plume([90, -60, 34], 5, 48, 466, "Royalmount_Steam", 38, [20, -30]), plume([-120, -90, 30], 4, 42, 467, "Royalmount_Steam", 36));
  // the dipper on its post, a pair of boots left by the edge
  parts.push(cylinderAt({ radius: 6, height: 140, segments: 6, bottom: [200, 220, 0] }, "Royalmount_Timber"), cylinderBetween([200, 220, 130], [200, 180, 100], 2, 5, "Royalmount_Plank"), cylinderAt({ rBot: 8, rTop: 11, height: 10, segments: 8, bottom: [200, 175, 90] }, "Royalmount_Plank"));
  for (const y of [150, 172]) parts.push(boxBounds([250, y - 8, 0], [280, y + 8, 30], "Royalmount_Hide", 2), boxBounds([234, y - 8, 0], [252, y + 8, 12], "Royalmount_Hide", 2));
  // the snow kept back from the warm ground
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rnd() * 0.3;
    parts.push(mound(150 + rnd() * 80, 90 + rnd() * 40, 24 + rnd() * 14, 471 + i, [Math.cos(a) * 380, Math.sin(a) * 310, 0], a * DEG + 90));
  }
  return merge(...parts);
}

// The hermit's stone hut: rough walls of fieldstone under a turf-and-slate roof deep in snow, a
// low door hung with a hide, a shuttered window, a chimney smoking; his firewood under the eave,
// a bench by the door, a tower of prayer stones, a lantern on a post. About 7 x 5.6 m.
function hermitHut(): Geo {
  const rnd = seeded(481), X = 240, Y = 190, Hw = 220, parts: Geo[] = [];
  // the walls: rubble masonry, quoins of bigger stones at the corners
  parts.push(boxBounds([-X, -Y, -10], [X, Y, Hw], "StoneGrey", 6));
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]])
    for (let z = 0; z < Hw - 20; z += 48) parts.push(boxAt([58, 58, 44], [sx * (X - 22), sy * (Y - 22), z], (z / 48) % 2 ? "Royalmount_Granite" : "StoneDark", 4));
  for (let i = 0; i < 18; i++) {
    const side = Math.floor(rnd() * 4), z = 20 + rnd() * (Hw - 40);
    const at: V3 = side === 0 ? [-X - 2, (rnd() - 0.5) * 2 * (Y - 60), z] : side === 1 ? [X + 2, (rnd() - 0.5) * 2 * (Y - 60), z] : [(rnd() - 0.5) * 2 * (X - 60), side === 2 ? -Y - 2 : Y + 2, z];
    parts.push(translate(box([side < 2 ? 6 : 30 + rnd() * 30, side < 2 ? 30 + rnd() * 30 : 6, 14 + rnd() * 12], [0, 0, 0], rnd() < 0.5 ? "StoneDark" : "Royalmount_Granite", 2), at));
  }
  // the door: a low dark doorway, a hide curtain, a lintel stone
  parts.push(boxBounds([-X - 4, -110, 0], [-X + 6, -10, 180], "Royalmount_Dark"));
  parts.push(translate(rotateX(box([5, 92, 170], [0, 0, 0], "Royalmount_Hide", 1.5), 3), [-X - 8, -64, 92]));
  parts.push(boxBounds([-X - 14, -130, 180], [-X + 10, 10, 208], "Royalmount_Granite", 3));
  // the window with its shutter
  parts.push(boxBounds([-40, Y - 4, 110], [40, Y + 6, 170], "Royalmount_Dark"), boxBounds([-48, Y + 4, 102], [48, Y + 10, 110], "Royalmount_Granite", 1));
  parts.push(translate(rotateZ(boxBounds([0, 0, 0], [80, 5, 62], "Royalmount_Plank", 1), 70), [-40, Y + 8, 108]));
  // the roof: a slate gable under turf and snow
  const RH = 160, half = Y + 20;
  parts.push(gableRoof([2 * X + 30, 2 * half, 14], [0, 0, Hw], RH, 45, "RoofSlate"));
  parts.push(gableRoof([2 * X + 30, 2 * half, 18], [0, 0, Hw + 14], RH, 38, "Snow"));
  parts.push(gableWall(-X, half, Hw, RH, "StoneGrey"), gableWall(X, half, Hw, RH, "StoneGrey"));
  const ez = Hw - (45 * RH) / half;
  for (const s of [-1, 1]) parts.push(icicles([-X - 60, s * (half + 40), ez + 8], [X + 60, s * (half + 40), ez + 8], 483 + s, 18, 45));
  // the chimney at the back, smoke from it
  parts.push(boxAt([80, 76, Hw + RH + 50], [X - 40, Y - 70, -10], "StoneDark", 4), boxAt([92, 88, 12], [X - 40, Y - 70, Hw + RH + 38], "Royalmount_Granite", 3));
  parts.push(plume([X - 40, Y - 70, Hw + RH + 70], 5, 30, 485, "Royalmount_Smoke", 40, [60, 40]));
  // firewood under the eave on the -Y side, a chopping block with the axe in it
  for (let r = 0; r < 3; r++)
    for (let k = 0; k < 8; k++) {
      const x = -180 + k * 30 + (r % 2) * 14, z = 14 + r * 25;
      parts.push(cylinderBetween([x, -Y - 20, z], [x + (rnd() - 0.5) * 6, -Y - 100, z], 11, 7, "Royalmount_Log"), cylinderBetween([x, -Y - 100, z], [x, -Y - 101, z], 9.5, 7, LOG_END));
    }
  parts.push(translate(stumpOf({ seed: 487, h: 46, r: 22, bark: "Royalmount_Log", wood: LOG_END, roots: 3 }), [-X - 120, -Y - 90, 0]));
  parts.push(cylinderBetween([-X - 120, -Y - 90, 46], [-X - 150, -Y - 70, 110], 2.5, 5, "Royalmount_Timber"), translate(rotateZ(rotateY(boxBounds([-2, -12, -8], [2, 12, 8], "Royalmount_Iron"), 20), 30), [-X - 122, -Y - 88, 52]));
  // the bench by the door, the prayer stones, the lantern post
  parts.push(boxBounds([-X - 60, 30, 40], [-X - 20, 170, 48], "Royalmount_Plank", 2));
  for (const y of [45, 155]) parts.push(boxBounds([-X - 56, y - 6, 0], [-X - 24, y + 6, 40], "Royalmount_Granite", 2));
  let z = 0;
  for (let k = 0; k < 7; k++) {
    const s = 40 - k * 4.8, hh = 12 + rnd() * 6;
    parts.push(translate(rotateZ(rock([s * 1.4, s, hh], 0.3, 491 + k, k % 2 ? "Royalmount_Granite" : "StoneDark", true), rnd() * 180), [-X - 200, Y + 60, z]));
    z += hh * 0.85;
  }
  parts.push(cylinderAt({ radius: 6, height: 200, segments: 6, bottom: [-X - 150, -40, 0] }, "Royalmount_TimberDark"), beamBetween([-X - 150, -40, 190], [-X - 185, -40, 190], 4, 4, "Royalmount_Iron"));
  // a line of prayer flags from the gable to a pole by the stones
  parts.push(cylinderAt({ radius: 5, height: 300, segments: 6, bottom: [-X - 260, Y + 140, 0] }, "Royalmount_TimberDark"));
  const flags = sagLine([-X - 4, 0, Hw + RH - 30], [-X - 260, Y + 140, 290], 40, 9), cloth = ["FabricRed", "FabricWhite", "FabricBlue", "FabricGold", "FabricGreen"];
  parts.push(rope(flags, 0.9));
  const fa = Math.atan2(Y + 140, -256) * DEG;
  for (let k = 1; k < 9; k++) parts.push(translate(rotateZ(box([22, 2, 26], [0, 0, -14], cloth[k % 5]), fa), flags[k]));
  parts.push(boxBounds([-X - 196, -51, 150], [-X - 174, -29, 180], "Royalmount_Iron", 1), boxBounds([-X - 193, -48, 153], [-X - 177, -32, 177], "LanternGlow"));
  parts.push(mound(260, 140, 50, 497, [40, Y + 90, 0], 0), mound(220, 120, 44, 498, [X + 90, -60, 0], 90), mound(180, 120, 30, 499, [-X - 230, -Y + 20, 0], 60));
  return centre(merge(...parts));
}

// A bridge of ice over a stream (it is walked over along X): a span of old ice and packed snow
// laid across from bank to bank, its underside arched and hung with icicles down to the water,
// lumpy ridges of ice along its sides for a parapet, ice heaped at each end. Its deck is at
// z = 0..14. About 11.6 x 3.6 m.
function iceBridge(): Geo {
  const rnd = seeded(511), L = 520, W = 150, parts: Geo[] = [];
  // the deck: a slab of ice with snow packed on it, a little crowned in the middle
  const deck: [number, number][] = [];
  for (let i = 0; i <= 12; i++) deck.push([-L + (2 * L * i) / 12, -W - 10 * Math.sin((i / 12) * Math.PI) + (rnd() - 0.5) * 16]);
  for (let i = 12; i >= 0; i--) deck.push([-L + (2 * L * i) / 12, W + 10 * Math.sin((i / 12) * Math.PI) + (rnd() - 0.5) * 16]);
  parts.push(slab(deck, -16, 6, "Royalmount_Ice", "Royalmount_IceDeep", 3));
  parts.push(slab(deck.map(([x, y]) => [x * 0.97, y * 0.82] as [number, number]), 6, 12, "Snow", "Snow", 2));
  // the arch beneath: a curved belly of ice from bank to bank
  for (let i = 0; i < 10; i++) {
    const x0 = -L + (2 * L * i) / 10, x1 = -L + (2 * L * (i + 1)) / 10, d = (x: number) => -16 - 70 * (1 - (x / L) ** 2) * 0.2 - 60 * (Math.abs(x) / L) ** 3;
    parts.push(beamBetween([x0, 0, d(x0) + 4], [x1, 0, d(x1) + 4], 2 * W - 30, 26, "Royalmount_IceDeep"));
  }
  for (const s of [-1, 1]) {
    parts.push(icicles([-L + 120, s * (W - 10), -18], [L - 120, s * (W - 10), -18], 513 + s, 14, 70));
    // the parapet ridges of heaved ice
    for (let k = 0; k < 9; k++) {
      const x = -L + 60 + k * ((2 * L - 120) / 8);
      parts.push(translate(rock([120 + rnd() * 50, 46, 34 + rnd() * 26], 0.4, 517 + k + (s > 0 ? 20 : 0), rnd() < 0.5 ? "Royalmount_Ice" : "Royalmount_IceDeep", true), [x, s * (W + 6), 4]));
    }
  }
  // ice heaped at both ends, where it grips the banks
  for (const s of [-1, 1]) {
    parts.push(translate(rock([180, 2 * W + 120, 60], 0.35, 541 + s, "Royalmount_Ice", true), [s * (L + 40), 0, -30]));
    parts.push(mound(200, 2 * W + 160, 30, 543 + s, [s * (L + 70), 0, -6]));
  }
  return merge(...parts);
}

// ======================================================================================
// ---- the old royal mine ----

// A straight run of mine rails 4 m long (along X; runs join end to end): sleepers in a bed of
// gravel, two rusted rails on their chairs, snow lying between.
function mineRails(): Geo {
  const rnd = seeded(551), parts: Geo[] = [box([400, 150, 4], [0, 0, 0], "Royalmount_Spoil", 1)];
  for (let x = -175; x <= 175; x += 50) parts.push(translate(rotateZ(boxBounds([-11, -68, 2], [11, 68, 10], rnd() < 0.3 ? "WoodGrey" : "Royalmount_TimberDark", 1.5), (rnd() - 0.5) * 4), [x, 0, 0]));
  for (const y of [-42, 42]) {
    parts.push(boxBounds([-200, y - 3.5, 13], [200, y + 3.5, 20], "Royalmount_Rust"), boxBounds([-200, y - 6, 10], [200, y + 6, 13], "Royalmount_Rust"));
    for (let x = -175; x <= 175; x += 50) parts.push(boxBounds([x - 6, y - 9, 10], [x + 6, y + 9, 15], "Royalmount_Iron"));
  }
  for (let i = 0; i < 4; i++) parts.push(blob(30 + rnd() * 20, [-160 + i * 105 + rnd() * 30, (rnd() - 0.5) * 40, 6], "Snow", 0.2, 7));
  return merge(...parts);
}

// A mine cart left standing on its rails: a riveted iron tub on four wheels, half full of ore
// with silver glinting in it, a lamp hung on its side, its coupling chain trailing; on a 4 m run
// of rails. About 4 x 1.5 m, 1.5 m high.
function minecart(): Geo {
  const rnd = seeded(571), parts: Geo[] = [mineRails()];
  const z0 = 34, H = 80, LX = 85, LY = 55;
  // the tub, its sides splayed out a little
  const side = (len: number, at: V3, rot: number, lean: number) => translate(rotateZ(rotateX(boxBounds([-len, -3, 0], [len, 3, H], "Royalmount_Rust"), lean), rot), at);
  parts.push(boxBounds([-LX + 6, -LY + 6, z0], [LX - 6, LY - 6, z0 + 8], "Royalmount_Rust"));
  parts.push(side(LX, [0, -LY, z0], 0, 10), side(LX, [0, LY, z0], 0, -10), side(LY, [-LX, 0, z0], 90, -10), side(LY, [LX, 0, z0], 90, 10));
  const rim = H + 2, sp = Math.tan(10 / DEG) * H;
  for (const s of [-1, 1]) {
    parts.push(boxBounds([-LX - sp - 4, s * (LY + sp) - 5, z0 + rim - 6], [LX + sp + 4, s * (LY + sp) + 5, z0 + rim + 2], "Royalmount_Iron"));
    parts.push(boxBounds([s * (LX + sp) - 5, -LY - sp - 4, z0 + rim - 6], [s * (LX + sp) + 5, LY + sp + 4, z0 + rim + 2], "Royalmount_Iron"));
    for (const x of [-50, 0, 50]) parts.push(boxBounds([x - 4, s * (LY + 6) - 2, z0 + 4], [x + 4, s * (LY + 6) + 2, z0 + H - 4], "Royalmount_Iron"));
  }
  // the ore heaped in it, silver in the lumps
  for (let i = 0; i < 14; i++) {
    const at: V3 = [(rnd() - 0.5) * 140, (rnd() - 0.5) * 90, z0 + H - 30 + rnd() * 18];
    parts.push(translate(rock([26 + rnd() * 20, 22 + rnd() * 16, 18 + rnd() * 10], 0.45, 573 + i, rnd() < 0.3 ? "Royalmount_Granite" : "Royalmount_Spoil"), at));
    if (rnd() < 0.55) parts.push(translate(rotateZ(box([7, 5, 4], [0, 0, 0], "Royalmount_Silver", 1), rnd() * 180), [at[0] + 3, at[1], at[2] + 14]));
  }
  // the wheels on their axles, the frame under the tub
  for (const x of [-52, 52]) {
    parts.push(cylinderBetween([x, -LY - 2, 30], [x, LY + 2, 30], 3.5, 6, "Royalmount_Iron"));
    for (const s of [-1, 1]) {
      parts.push(translate(rotateX(cylinderAt({ radius: 18, height: 7, segments: 12, bottom: [0, 0, -3.5] }, "Royalmount_Iron"), 90), [x, s * 42, 30]));
      parts.push(translate(rotateX(cylinderAt({ radius: 21, height: 2.5, segments: 12, bottom: [0, 0, -1] }, "Royalmount_Rust"), 90), [x, s * 37, 30]));
      parts.push(boxBounds([x - 9, s * 50 - 5, 22], [x + 9, s * 50 + 5, 40], "Royalmount_Iron"));
    }
  }
  for (const s of [-1, 1]) parts.push(boxBounds([-LX - 10, s * 46 - 5, z0 - 8], [LX + 10, s * 46 + 5, z0], "Royalmount_TimberDark"));
  // the couplings, a trailing chain, the lamp
  for (const s of [-1, 1]) parts.push(boxBounds([s * (LX + 4), -6, z0 - 4], [s * (LX + 24), 6, z0 + 6], "Royalmount_Iron"));
  for (let k = 0; k < 5; k++) parts.push(translate(rotateX(torus(5, 1.4, 8, 4, "Royalmount_Iron"), k % 2 ? 90 : 0), [LX + 30 + k * 8, 0, z0 - 2 - k * 6]));
  parts.push(cylinderBetween([-LX - sp - 2, 0, z0 + H - 8], [-LX - sp - 22, 0, z0 + H - 8], 1.5, 4, "Royalmount_Iron"), boxBounds([-LX - sp - 32, -9, z0 + H - 52], [-LX - sp - 14, 9, z0 + H - 16], "Royalmount_Iron", 1), boxBounds([-LX - sp - 30, -7, z0 + H - 48], [-LX - sp - 16, 7, z0 + H - 20], "GlassBlue"));
  parts.push(blob(22, [-40, 20, z0 + H + 2], "Snow", 0.3, 8), blob(18, [50, -20, z0 + H], "Snow", 0.3, 8));
  return merge(...parts);
}

// The headframe over the old shaft: a tower of squared timbers braced in crosses with back-stays
// to the ground, the sheave wheel turning on top, the cable down into the shaft (a skip hung
// in it) and back to the winding drum in its shed; the shaft's collar of beams railed round, a
// ladder up to the platform, a bell. About 10 x 4 m, 10.4 m high.
function headframe(): Geo {
  const rnd = seeded(591), parts: Geo[] = [], H = 860, B = 150, T = 72;
  // the shaft: a black square hole in a collar of beams, rails round three sides
  parts.push(boxBounds([-115, -115, -60], [115, 115, 1], "Royalmount_Dark"));
  for (const s of [-1, 1]) {
    parts.push(boxBounds([-150, s * 115 - (s > 0 ? 0 : 35), -6], [150, s * 115 + (s > 0 ? 35 : 0), 26], "Royalmount_TimberDark", 3));
    parts.push(boxBounds([s * 115 - (s > 0 ? 0 : 35), -115, -6], [s * 115 + (s > 0 ? 35 : 0), 115, 22], "Royalmount_TimberDark", 3));
  }
  for (const [a, b] of [[[-150, -150], [150, -150]], [[150, -150], [150, 150]], [[150, 150], [-150, 150]]] as [[number, number], [number, number]][]) {
    for (const t of [0, 0.5, 1]) parts.push(boxAt([10, 10, 105], [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 22], "Royalmount_Timber", 1.5));
    parts.push(beamBetween([a[0], a[1], 120], [b[0], b[1], 120], 8, 8, "Royalmount_Timber"), beamBetween([a[0], a[1], 70], [b[0], b[1], 70], 6, 6, "Royalmount_Timber"));
  }
  // the tower's four legs, tapering, girts and crosses on each side
  const leg = (sx: number, sy: number, z: number): V3 => {
    const k = z / H, r = B + (T - B) * k;
    return [sx * r, sy * r, z];
  };
  const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [sx, sy] of corners) parts.push(beamBetween(leg(sx, sy, -10), leg(sx, sy, H + 10), 26, 26, "Royalmount_Timber"));
  for (let c = 0; c < 4; c++) {
    const [ax, ay] = corners[c], [bx, by] = corners[(c + 1) % 4];
    const levels = [130, 380, 620, H];
    for (const z of levels) parts.push(beamBetween(leg(ax, ay, z), leg(bx, by, z), 16, 18, "Royalmount_TimberDark"));
    if (c === 3) continue; // the front (-X) left open over the shaft's landing
    for (let i = 0; i + 1 < levels.length; i++) {
      parts.push(beamBetween(leg(ax, ay, levels[i]), leg(bx, by, levels[i + 1]), 11, 12, "Royalmount_Timber"));
      parts.push(beamBetween(leg(bx, by, levels[i]), leg(ax, ay, levels[i + 1]), 11, 12, "Royalmount_Timber"));
    }
  }
  // the back-stays down to the ground behind, braced to the tower
  for (const s of [-1, 1]) {
    parts.push(beamBetween([T, s * T, H - 20], [560, s * 120, -10], 24, 24, "Royalmount_Timber"));
    parts.push(boxAt([60, 60, 30], [560, s * 120, -10], "StoneGrey", 3));
    parts.push(beamBetween(leg(1, s, 380), [330, s * 100, 320], 14, 14, "Royalmount_TimberDark"));
  }
  parts.push(beamBetween([330, -100, 320], [330, 100, 320], 14, 14, "Royalmount_TimberDark"));
  // the platform at the top, its rail, the sheave wheel on its bearings
  parts.push(boxBounds([-T - 30, -T - 30, H + 10], [T + 30, T + 30, H + 24], "Royalmount_Plank", 2));
  for (const [sx, sy] of corners) parts.push(boxAt([8, 8, 90], [sx * (T + 24), sy * (T + 24), H + 24], "Royalmount_Timber", 1));
  for (let c = 0; c < 4; c++) {
    const [ax, ay] = corners[c], [bx, by] = corners[(c + 1) % 4];
    parts.push(beamBetween([ax * (T + 24), ay * (T + 24), H + 110], [bx * (T + 24), by * (T + 24), H + 110], 6, 6, "Royalmount_Timber"));
  }
  const W: V3 = [30, 0, H + 120], R = 92;
  for (const s of [-1, 1]) parts.push(boxAt([30, 20, 96], [W[0], s * 34, H + 24], "Royalmount_TimberDark", 2));
  parts.push(cylinderBetween([W[0], -40, W[2]], [W[0], 40, W[2]], 6, 8, "Royalmount_Iron"));
  for (const s of [-1, 1]) parts.push(translate(rotateX(torus(R, 5, 24, 6, "Royalmount_Rust"), 90), [W[0], s * 9, W[2]]));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    parts.push(cylinderBetween([W[0], 0, W[2]], [W[0] + Math.cos(a) * R, 0, W[2] + Math.sin(a) * R], 2.6, 4, "Royalmount_Iron"));
  }
  parts.push(cylinderBetween([W[0], -12, W[2]], [W[0], 12, W[2]], 16, 10, "Royalmount_Iron"));
  // the cable: down into the shaft to the skip, and back over the wheel to the drum
  parts.push(cylinderBetween([W[0] - R, 0, W[2]], [W[0] - R, 0, 150], 1.6, 4, "Royalmount_Iron"));
  parts.push(boxBounds([W[0] - R - 40, -40, 30], [W[0] - R + 40, 40, 130], "Royalmount_Rust", 2), boxBounds([W[0] - R - 36, -36, 126], [W[0] - R + 36, 36, 134], "Royalmount_Spoil"));
  parts.push(cylinderBetween([W[0] - R, 0, 150], [W[0] - R - 30, 0, 132], 1.2, 4, "Royalmount_Iron"), cylinderBetween([W[0] - R, 0, 150], [W[0] - R + 30, 0, 132], 1.2, 4, "Royalmount_Iron"));
  parts.push(cylinderBetween([W[0] + 20, 0, W[2] + R - 4], [700, 0, 110], 1.6, 4, "Royalmount_Iron"));
  // the winding shed: a drum on its frame under a lean-to roof
  parts.push(boxBounds([620, -150, -6], [860, 150, 20], "StoneGrey", 3));
  for (const [x, y] of [[640, -130], [640, 130], [840, -130], [840, 130]] as [number, number][]) parts.push(boxAt([18, 18, x < 700 ? 250 : 200], [x, y, 20], "Royalmount_TimberDark", 2));
  parts.push(translate(rotateY(boxBounds([-10, -170, 0], [250, 170, 10], "RoofSlate", 2), 11), [630, 0, 270]), translate(rotateY(boxBounds([-6, -166, 10], [246, 166, 18], "Snow", 3), 11), [630, 0, 270]));
  for (let x = 850, y = -130; y <= 130; y += 26) parts.push(boxBounds([x - 3, y, 20], [x + 3, y + 22, 200], rnd() < 0.5 ? "WoodGrey" : "Royalmount_Plank"));
  parts.push(cylinderBetween([730, -90, 110], [730, 90, 110], 40, 12, "Royalmount_Timber"));
  for (const s of [-1, 1]) parts.push(cylinderBetween([730, s * 90, 110], [730, s * 96, 110], 52, 12, "Royalmount_Iron"), boxBounds([715, s * 108 - 6, 20], [745, s * 108 + 6, 120], "Royalmount_TimberDark"));
  parts.push(translate(rotateY(cylinderAt({ rBot: 20, rTop: 14, height: 30, segments: 10, bottom: [0, 0, 0] }, "Bronze"), 0), [-T - 24, T + 24, H + 60]));
  // a ladder up the back-left leg
  for (const s of [-1, 1]) parts.push(cylinderBetween([-B - 40, B - 40 + s * 24, 0], [-T - 36, T - 40 + s * 24, H + 20], 3.5, 5, "Royalmount_Timber"));
  for (let k = 1; k < 26; k++) {
    const t = k / 26, x = -B - 40 + (B - T + 4) * t, y0 = B - 40 + (T - B) * t, z = (H + 20) * t;
    parts.push(cylinderBetween([x, y0 - 24, z], [x, y0 + 24, z], 2.2, 4, "Royalmount_Plank"));
  }
  parts.push(mound(260, 160, 30, 593, [400, -10, 0], 0), mound(200, 140, 24, 594, [-220, -160, 0], 30));
  return centre(merge(...parts));
}

// The smelter where the crown's silver was won, in ruins: the square stone furnace stack in
// courses, its top broken, the tap arch dark at its foot; the casting shed before it with its
// walls fallen to stumps and a few roof beams still across; ingot moulds, an anvil, the bellows
// rotting, a heap of black glassy slag and one of charcoal. About 11 x 9 m, 7.6 m high.
function smelterRuin(): Geo {
  const rnd = seeded(611), parts: Geo[] = [];
  // the stack: courses stepping in, the corners dressed, iron ties
  const courses: [number, number][] = [[440, 130], [400, 130], [360, 130], [320, 130], [280, 120]];
  let z = -10;
  courses.forEach(([w, h], i) => {
    if (i < 4) parts.push(boxAt([w, w, h], [80, 0, z], "Royalmount_Soot", 6));
    else {
      // the top course broken: three walls of it left, one corner gone
      parts.push(boxAt([w, 50, h], [80, -w / 2 + 25, z], "Royalmount_Soot", 4), boxAt([50, w - 100, h * 0.6], [80 + w / 2 - 25, 50, z], "Royalmount_Soot", 4), boxAt([w * 0.5, 50, h * 0.8], [80 - w * 0.25, w / 2 - 25, z], "Royalmount_Soot", 4));
      parts.push(boxAt([w - 100, w - 100, 6], [80, 0, z], "Royalmount_Coal"));
    }
    if (i < 4) for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) parts.push(boxAt([30, 30, h - 10], [80 + sx * (w / 2 - 12), sy * (w / 2 - 12), z + 5], "Royalmount_Ashlar", 3));
    if (i < 4) parts.push(boxAt([w + 6, w + 6, 8], [80, 0, z + h - 12], "Royalmount_Iron"));
    z += h;
  });
  // the tap arch at the foot of the front, a brick surround, the channel out of it
  parts.push(boxBounds([-142, -60, -10], [-120, 60, 120], "Royalmount_Dark"));
  parts.push(translate(rotateY(cylinderAt({ radius: 60, height: 22, segments: 12, bottom: [0, 0, -11] }, "Royalmount_Dark"), 90), [-131, 0, 120]));
  for (let k = 0; k <= 8; k++) {
    const a = (k / 8) * Math.PI, at: V3 = [-146, Math.cos(a) * 74, 120 + Math.sin(a) * 74];
    parts.push(translate(rotateX(box([12, 18, 26], [0, 0, 0], "Royalmount_Brick", 1), -(a * DEG - 90)), at));
  }
  for (const s of [-1, 1]) parts.push(boxBounds([-150, s * 62 - (s > 0 ? 0 : 22), -10], [-140, s * 62 + (s > 0 ? 22 : 0), 120], "Royalmount_Brick", 1));
  parts.push(boxBounds([-420, -30, -6], [-150, 30, 4], "Royalmount_Slag"), boxBounds([-420, -38, -6], [-150, -30, 10], "Royalmount_Ashlar"), boxBounds([-420, 30, -6], [-150, 38, 10], "Royalmount_Ashlar"));
  // the casting shed's walls, fallen to stumps of different heights
  const wall = (a: [number, number], b: [number, number], hs: number[]) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = hs.length, rot = Math.atan2(b[1] - a[1], b[0] - a[0]) * DEG;
    hs.forEach((h, i) => {
      if (h <= 0) return;
      const t = (i + 0.5) / n, at: V3 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, -10];
      parts.push(translate(rotateZ(boxAt([L / n + 2, 50, h], [0, 0, 0], "StoneGrey", 5), rot), at));
      parts.push(translate(rotateZ(boxAt([L / n * 0.6, 54, 14], [(rnd() - 0.5) * 20, 0, h - 10], "Royalmount_Granite", 3), rot), at));
    });
  };
  wall([-600, -360], [-150, -360], [260, 300, 180, 90, 0, 140]);
  wall([-600, -360], [-600, 360], [240, 130, 0, 60, 200, 280]);
  wall([-600, 360], [-280, 360], [220, 160, 70, 0]);
  // the roof beams still across, one fallen
  for (const [y, fall] of [[-250, 0], [-60, 0], [130, 1]] as [number, number][]) {
    if (fall) parts.push(beamBetween([-590, y, 10], [-170, y + 60, 160], 22, 22, "Royalmount_TimberDark"));
    else parts.push(beamBetween([-600, y, 300], [-160, y, 420], 22, 22, "Royalmount_TimberDark"));
  }
  parts.push(beamBetween([-420, -360, 290], [-420, 140, 310], 16, 16, "Royalmount_TimberDark"));
  for (let i = 0; i < 4; i++) parts.push(translate(rotateZ(rotateY(boxBounds([-60, -40, 0], [60, 40, 5], "RoofSlate"), 8 + rnd() * 20), rnd() * 180), [-480 + rnd() * 240, -240 + rnd() * 400, 2]));
  // the moulds in a row, the anvil on its block, the bellows
  for (let k = 0; k < 5; k++) {
    const x = -520 + k * 70;
    parts.push(boxBounds([x - 26, -260, -2], [x + 26, -200, 14], "Royalmount_Iron", 1), boxBounds([x - 20, -254, 10], [x + 20, -206, 15], "Royalmount_Dark"));
    if (k % 2 === 0) parts.push(boxBounds([x - 17, -248, 10], [x + 17, -212, 18], "Royalmount_Silver", 1));
  }
  parts.push(boxBounds([-420, 180, -6], [-360, 240, 60], "Royalmount_TimberDark", 3), boxBounds([-430, 190, 60], [-350, 230, 76], "Royalmount_Iron", 2), translate(rotateY(cylinderAt({ rBot: 14, rTop: 2, height: 30, segments: 6, bottom: [0, 0, 0] }, "Royalmount_Iron"), -90), [-430, 210, 70]));
  parts.push(translate(rotateZ(merge(boxBounds([0, -50, 0], [160, 50, 14], "Royalmount_TimberDark", 2), translate(rotateY(boxBounds([0, -50, 0], [160, 50, 10], "Royalmount_TimberDark", 2), -18), [0, 0, 14]), translate(rotateY(boxBounds([0, -46, -30], [150, 46, 30], "Royalmount_Hide", 6), -9), [10, 0, 20])), 10), [-140, 200, 0]));
  // the slag heap and the charcoal
  parts.push(mound(320, 240, 70, 613, [140, 400, 0], 30, "Royalmount_Slag"));
  for (let i = 0; i < 12; i++) parts.push(translate(rock([24 + rnd() * 30, 20 + rnd() * 24, 14 + rnd() * 14], 0.5, 615 + i, "Royalmount_Slag"), [140 + (rnd() - 0.5) * 360, 400 + (rnd() - 0.5) * 280, 20 + rnd() * 30]));
  parts.push(mound(200, 160, 44, 631, [380, -200, 0], 0, "Royalmount_Coal"));
  // fallen blocks round the stack, snow lying in drifts and on the courses
  for (let i = 0; i < 8; i++) parts.push(translate(rotateZ(rotateX(boxAt([60, 40, 34], [0, 0, 0], "Royalmount_Soot", 4), (rnd() - 0.5) * 30), rnd() * 180), [80 + (rnd() < 0.5 ? -1 : 1) * (240 + rnd() * 120), (rnd() - 0.5) * 500, -4]));
  z = -10;
  courses.slice(0, 4).forEach(([w, h], i) => {
    z += h;
    if (i < 3) parts.push(boxAt([w - 20, 20, 8], [80, -w / 2 + 2, z - 2], "Snow", 3), boxAt([20, w - 40, 8], [80 + w / 2 - 2, 0, z - 2], "Snow", 3));
  });
  parts.push(mound(340, 160, 60, 633, [-380, -470, 0], 0), mound(300, 200, 50, 634, [420, 120, 0], 80), mound(260, 160, 40, 635, [-700, 120, 0], 90));
  return centre(merge(...parts));
}

// The royal adit, sealed: the grand portal of dressed stone into the mountain (the crest on its
// keystone), rock fallen in behind it filling the tunnel, an iron grille across it chained and
// locked, a warning board nailed to the bars, timber props snapped inside, the rails running out
// of it. Its back (+X) goes against a cliff. About 9 x 7.6 m, 6.6 m high.
function sealedAdit(): Geo {
  const rnd = seeded(651), Wd = 230, Spr = 280, parts: Geo[] = [];
  // the rock round it
  parts.push(frostRock([460, 340, 660], 0.3, 653, { mat: "Royalmount_GraniteDark", at: [130, Wd + 230, -20], cover: 0.3 }));
  parts.push(frostRock([440, 340, 600], 0.3, 655, { mat: "Royalmount_GraniteDark", at: [140, -Wd - 230, -20], cover: 0.3 }));
  parts.push(frostRock([420, 2 * Wd + 520, 300], 0.28, 657, { mat: "Royalmount_Granite", at: [150, 0, Spr + Wd - 40], cover: 0.55, flat: true }));
  parts.push(boxBounds([-20, -Wd - 60, -10], [320, Wd + 60, Spr + Wd + 40], "Royalmount_Dark"));
  // the piers and the arch of dressed stone, the keystone with the crest
  for (const s of [-1, 1]) {
    parts.push(boxBounds([-60, s * Wd - (s > 0 ? 0 : 80), -10], [40, s * Wd + (s > 0 ? 80 : 0), Spr], "Royalmount_Ashlar", 4));
    parts.push(boxBounds([-70, s * Wd - (s > 0 ? -2 : 92), -10], [50, s * Wd + (s > 0 ? 92 : -2), 30], "Royalmount_Granite", 3));
    parts.push(boxBounds([-68, s * Wd - (s > 0 ? -2 : 90), Spr - 26], [48, s * Wd + (s > 0 ? 90 : -2), Spr], "Royalmount_Granite", 3));
  }
  const N = 13;
  for (let k = 0; k < N; k++) {
    const a = ((k + 0.5) / N) * Math.PI, r = Wd + 40, key = k === (N - 1) / 2;
    const at: V3 = [-10, Math.cos(a) * r, Spr + Math.sin(a) * r];
    parts.push(translate(rotateX(box([100, key ? 70 : 58, key ? 110 : 84], [0, 0, 0], key ? "Royalmount_Granite" : "Royalmount_Ashlar", 3), -(a * DEG - 90)), at));
  }
  parts.push(crest([-64, 0, Spr + Wd + 30], 54));
  parts.push(boxBounds([-70, -Wd - 120, Spr + Wd + 80], [50, Wd + 120, Spr + Wd + 110], "Royalmount_Granite", 3));
  parts.push(icicles([-72, -Wd - 110, Spr + Wd + 78], [-72, Wd + 110, Spr + Wd + 78], 659, 15, 70));
  // the rockfall filling the tunnel behind the grille
  for (let i = 0; i < 16; i++) {
    const y = (rnd() - 0.5) * 2 * Wd * 0.9, zz = rnd() * (Spr + Math.sqrt(Math.max(0, Wd * Wd - y * y)) * 0.9 - 40);
    parts.push(translate(rock([70 + rnd() * 60, 60 + rnd() * 50, 50 + rnd() * 40], 0.4, 661 + i, rnd() < 0.5 ? "Royalmount_Granite" : "Royalmount_Spoil"), [30 + rnd() * 80, y, zz]));
  }
  for (const s of [-1, 1]) parts.push(beamBetween([20, s * (Wd - 30), 0], [60, s * 40, Spr + 60], 18, 18, "Royalmount_TimberDark"));
  parts.push(beamBetween([20, -Wd + 20, Spr + 30], [60, Wd - 60, Spr - 40], 18, 18, "Royalmount_TimberDark"));
  // the grille: bars to the arch, cross bars, the chain and lock
  for (let y = -Wd + 14; y <= Wd - 14; y += 24) {
    const top = Spr + Math.sqrt(Math.max(0, Wd * Wd - y * y)) - 6;
    parts.push(cylinderBetween([-30, y, -6], [-30, y, top], 2.6, 6, "Royalmount_Iron"));
    parts.push(rotateZ(cylinderAt({ rBot: 4, rTop: 0, height: 10, segments: 4, bottom: [-30, y, top] }, "Royalmount_Iron"), 0));
  }
  for (const zz of [40, 180, Spr + 60]) {
    const half = zz > Spr ? Math.sqrt(Math.max(0, Wd * Wd - (zz - Spr) ** 2)) - 10 : Wd - 6;
    parts.push(boxBounds([-36, -half, zz - 5], [-26, half, zz + 5], "Royalmount_Iron"));
  }
  for (let k = 0; k < 9; k++) parts.push(translate(rotateX(torus(7, 2, 8, 4, "Royalmount_Iron"), k % 2 ? 0 : 90), [-40, -40 + k * 10, 150 + Math.sin(k * 0.7) * 8]));
  parts.push(boxBounds([-50, 46, 120], [-36, 70, 146], "Royalmount_Rust", 2), translate(rotateY(torus(8, 2.4, 8, 4, "Royalmount_Iron"), 90), [-44, 58, 152]));
  // the warning board, slanted across the bars
  parts.push(translate(rotateX(merge(boxBounds([-4, -110, -22], [4, 110, 22], "Royalmount_Plank", 1.5), boxBounds([-6, -100, 4], [-4, 100, 12], "Royalmount_PaintRed"), boxBounds([-6, -100, -14], [-4, 100, -6], "Royalmount_PaintRed")), 8), [-40, -40, 230]));
  // the rails running out, stones spilled, snow
  for (let x = 0; x > -440; x -= 50) parts.push(boxBounds([x - 12, -66, -2], [x + 12, 66, 7], "Royalmount_TimberDark", 1.5));
  for (const y of [-42, 42]) parts.push(boxBounds([-450, y - 3.5, 7], [10, y + 3.5, 15], "Royalmount_Rust"));
  for (let i = 0; i < 7; i++) parts.push(frostRock([34 + rnd() * 30, 30 + rnd() * 20, 24], 0.5, 681 + i, { mat: "Royalmount_Spoil", at: [-80 - rnd() * 300, (rnd() < 0.5 ? -1 : 1) * (90 + rnd() * 160), 0], cover: 0.3 }));
  parts.push(mound(260, 160, 34, 691, [-200, Wd + 140, 0], 30), mound(240, 160, 30, 692, [-180, -Wd - 150, 0], -20));
  return merge(...parts);
}

// A seam of ore breaking out of the rock: a dark crag split open, crystals of pale blue bursting
// from its faces and glowing, silver threading the stone, shards fallen at its foot. About 3.4 x
// 2.8 m, 2.9 m high.
function oreCrystals(): Geo {
  const rnd = seeded(701), parts: Geo[] = [];
  const crag = rock([300, 240, 250], 0.32, 703, "Royalmount_Granite");
  const side = translate(rock([150, 130, 120], 0.4, 705, "Royalmount_GraniteDark"), [90, -110, 0]);
  parts.push(veined(crag, "Royalmount_SilverVein", 707, 3, 9), veined(side, "Royalmount_SilverVein", 709, 2, 8), snowFacets(merge(crag, side), 0.9));
  parts.push(crystalCluster([-100, 30, 120], [-1, 0.2, 0.6], 8, 170, 711), crystalCluster([-40, -80, 180], [-0.5, -0.7, 0.8], 6, 130, 713), crystalCluster([30, 90, 170], [0.1, 1, 0.7], 6, 120, 715), crystalCluster([-120, -60, 30], [-1, -0.3, 0.3], 5, 90, 717), crystalCluster([20, 0, 230], [0, 0, 1], 5, 110, 718));
  for (let i = 0; i < 7; i++) {
    const a = rnd() * Math.PI * 2, d = 160 + rnd() * 70;
    parts.push(crystal([Math.cos(a) * d * 1.1 - 40, Math.sin(a) * d, -2], [(rnd() - 0.5), (rnd() - 0.5), 0.35], 22 + rnd() * 26, 5 + rnd() * 3, rnd() < 0.3 ? "Royalmount_CrystalCore" : "Royalmount_Crystal"));
  }
  parts.push(mound(300, 200, 22, 719, [-120, 60, 0], 20), mound(180, 140, 18, 720, [110, 120, 0], -30));
  return centre(merge(...parts));
}

// A heap of spoil from the diggings: grey waste rock tipped in a long mound, bigger lumps rolled
// to its foot, a few broken timbers in it, a barrow left on its side, snow on its top. About 5.6
// x 4.4 m, 1.7 m high.
function spoilHeap(): Geo {
  const rnd = seeded(731), parts: Geo[] = [], LX = 460, LY = 360, H = 170;
  // the heap's core: a big rough lump of waste, broader than high
  const core = rock([LX, LY, H], 0.45, 733, "Royalmount_Spoil", true);
  parts.push(core);
  // (about how high the heap is at a point)
  const zAt = (x: number, y: number) => H * 0.8 * Math.max(0, 1 - Math.hypot((2 * x) / LX, (2 * y) / LY)) ** 0.8;
  // the rubble lying all over it, bigger lumps rolled down to its foot
  for (let i = 0; i < 52; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (i < 38 ? 0.9 : 1.2), x = Math.cos(a) * (LX / 2) * d, y = Math.sin(a) * (LY / 2) * d;
    const big = i >= 38 ? 1.6 : 1, sz: V3 = [(24 + rnd() * 30) * big, (20 + rnd() * 24) * big, (16 + rnd() * 16) * big];
    parts.push(frostRock(sz, 0.5, 735 + i, { mat: rnd() < 0.25 ? "Royalmount_Granite" : rnd() < 0.5 ? "Royalmount_GraniteDark" : "Royalmount_Spoil", at: [x, y, zAt(x, y) - sz[2] * 0.3], cover: rnd() < 0.3 ? 0.35 : 0, turn: rnd() * 180 }));
  }
  for (let i = 0; i < 5; i++) parts.push(blob(40 + rnd() * 30, [(rnd() - 0.5) * LX * 0.6, (rnd() - 0.5) * LY * 0.6, H * 0.5 + rnd() * 30], "Snow", 0.25, 8));
  for (let i = 0; i < 3; i++) {
    const a = rnd() * Math.PI;
    parts.push(beamBetween([Math.cos(a) * 160, Math.sin(a) * 100, 30 + rnd() * 30], [Math.cos(a + 0.5) * 60, Math.sin(a + 0.5) * 40, 90 + rnd() * 30], 14, 14, "Royalmount_TimberDark"));
  }
  // the barrow on its side
  const barrow = merge(
    boxBounds([-50, -32, 0], [50, 32, 6], "Royalmount_Plank", 1),
    translate(rotateY(boxBounds([-3, -34, 0], [3, 34, 34], "Royalmount_Plank"), 20), [-50, 0, 0]),
    translate(rotateY(boxBounds([-3, -34, 0], [3, 34, 34], "Royalmount_Plank"), -20), [50, 0, 0]),
    ...[-1, 1].map((s) => translate(rotateX(boxBounds([-50, -3, 0], [50, 3, 34], "Royalmount_Plank"), s * 15), [0, s * 32, 0])),
    ...[-1, 1].map((s) => cylinderBetween([40, s * 26, -4], [140, s * 30, -14], 3, 5, "Royalmount_Timber")),
    translate(rotateX(torus(20, 4, 12, 5, "Royalmount_Iron"), 90), [-70, 0, -10]),
  );
  parts.push(translate(rotateX(barrow, 80), [-300, 200, 40]));
  parts.push(mound(200, 120, 20, 761, [230, -170, 0], 40));
  return centre(merge(...parts));
}

export const KIT: Kit = {
  id: "royalmount",
  name: "เทือกเขาหลวง",
  region: "รอบพระราชวังหลวง",
  desc: "ป่าล่าสัตว์หลวงกับกระท่อมล่าสัตว์ หอดูสัตว์ และซุ้มเขากวาง หุบน้ำตกเยือกแข็งกับเสาน้ำแข็ง บ่อน้ำพุร้อน และกระท่อมหินของฤๅษี เหมืองเงินหลวงเก่ากับรางรถเหมือง หอกว้าน โรงหลอมพัง และปากอุโมงค์ที่ถูกปิด",
  ground: "snow",
  items: [
    { id: "silver_boulder", name: "หินแกรนิตสายแร่เงิน", make: () => centre(silverBoulder()), tags: ["rock"] },
    { id: "icicle_crag", name: "โขดหินน้ำแข็งย้อย", make: icicleCrag, tags: ["rock"] },
    { id: "deadfall", name: "กองสนล้มทับกัน", make: deadfall, tags: ["log", "decor"] },
    { id: "red_osier", name: "พุ่มกิ่งแดงในหิมะ", make: redOsier, tags: ["plant"] },
    { id: "snow_juniper", name: "พุ่มจูนิเปอร์หิมะ", make: snowJuniper, tags: ["plant"] },
    { id: "ice_shelf", name: "แผ่นน้ำแข็งริมฝั่ง", make: iceShelf, tags: ["ground"] },
    { id: "royal_waystone", name: "หลักบอกทางหลวง", make: royalWaystone, tags: ["sign", "light"] },
    { id: "hunting_lodge", name: "กระท่อมล่าสัตว์หลวง", make: huntingLodge, tags: ["building", "landmark"] },
    { id: "game_tower", name: "หอดูสัตว์ไม้", make: gameTower, tags: ["tower", "landmark"] },
    { id: "antler_arch", name: "ซุ้มประตูเขากวาง", make: antlerArch, tags: ["gate", "landmark"] },
    { id: "horn_platform", name: "แท่นเป่าแตรล่าสัตว์", make: hornPlatform, tags: ["landmark"] },
    { id: "deer_feeder", name: "รางหญ้าให้กวาง", make: deerFeeder, tags: ["decor"] },
    { id: "archery_butts", name: "เป้าซ้อมยิงธนู", make: archeryButts, tags: ["decor"] },
    { id: "great_icefall", name: "น้ำตกน้ำแข็งใหญ่", make: greatIcefall, tags: ["landmark"] },
    { id: "ice_columns", name: "เสาน้ำแข็ง", make: iceColumns, tags: ["landmark", "magic"] },
    { id: "hot_spring", name: "บ่อน้ำพุร้อน", make: hotSpring, tags: ["water", "landmark"] },
    { id: "hermit_hut", name: "กระท่อมหินของฤๅษี", make: hermitHut, tags: ["building"] },
    { id: "ice_bridge", name: "สะพานน้ำแข็ง (10.4 ม.)", make: iceBridge, tags: ["bridge", "landmark"] },
    { id: "mine_rails", name: "รางรถเหมือง (4 ม.)", make: mineRails, tags: ["ground"] },
    { id: "minecart", name: "รถเหมืองค้างบนราง", make: minecart, tags: ["decor"] },
    { id: "headframe", name: "โครงหอกว้านไม้", make: headframe, tags: ["tower", "landmark"] },
    { id: "smelter_ruin", name: "โรงหลอมพัง", make: smelterRuin, tags: ["building", "landmark"] },
    { id: "sealed_adit", name: "ปากอุโมงค์หลวงที่ถูกปิด", make: sealedAdit, tags: ["landmark"] },
    { id: "ore_crystals", name: "ผลึกแร่โผล่ผนังหิน", make: oreCrystals, tags: ["rock", "magic"] },
    { id: "spoil_heap", name: "กองหินขุด", make: spoilHeap, tags: ["rock"] },
  ],
  // A corner of the king's mountains: the hunting lodge by the bridle path under the antler gate,
  // the game tower and the horn dais on a rise, deer feeders and the butts; the frozen falls
  // against the mountain (+X) with ice columns, the hot spring and the hermit's hut, a stream
  // crossed by the ice bridge; and the old mine in the south (-X): rails, the cart, the
  // headframe, the sealed adit, spoil and crystals.
  sample(put) {
    // the bridle path's corner: the gate, the lodge, a waystone
    put("antler_arch", [-200, 1900, 0], 0);
    put("hunting_lodge", [800, 1250, 0], 90);
    put("royal_waystone", [-500, 1300, 0], -30);
    put("archery_butts", [1300, 2000, 0], 200, 0.8);
    put("deer_feeder", [-800, 2000, 0], 20);
    put("game_tower", [1900, 400, 0], 30);
    put("horn_platform", [1100, -200, 0], 180);
    // the frozen falls at the mountain's foot, their stream with the ice bridge
    put("great_icefall", [2050, -1500, 0], 0, 0.75);
    put("ice_columns", [1200, -1700, 0], 0, 0.8);
    put("hot_spring", [300, -1300, 0], 30);
    put("hermit_hut", [-600, -1900, 0], 60);
    put("ice_bridge", [-200, 300, 0], 90, 0.6);
    put("ice_shelf", [300, 500, 0], 0);
    // the mine in the south
    put("sealed_adit", [-1100, -500, 0], 0, 0.7);
    for (let k = 0; k < 4; k++) put("mine_rails", [-1650, 400 + k * 400, 0], 90);
    put("minecart", [-1650, -1100, 0], 90);
    put("headframe", [-1700, 1300, 0], 180, 0.7);
    put("spoil_heap", [-2000, -1700, 0], 30);
    put("ore_crystals", [-1050, 800, 0], 140);
    // the land
    put("silver_boulder", [-200, -800, 0], 40);
    put("icicle_crag", [2000, 1600, 0], 180);
    put("deadfall", [300, 2050, 0], 10);
    for (const [x, y] of [[-300, 900], [700, -600], [1600, 1400], [-900, 300], [2100, -300]]) put("red_osier", [x, y, 0], x);
    for (const [x, y] of [[100, 900], [1500, -800], [-400, -1200], [600, 300]]) put("snow_juniper", [x, y, 0], y);
    for (const [x, y, s] of [[2200, 2200, 1.1], [1700, 2300, 1], [-1300, 2200, 1.2], [-2100, 2100, 1], [2300, 900, 1], [-200, -2200, 1], [900, -2300, 1.1]]) put("flora:SnowPine", [x, y, 0], x, s);
    for (const [x, y] of [[-1000, 1600], [300, -500], [-2200, 1000], [1700, -2200]]) put("flora:SnowPineSmall", [x, y, 0], y);
  },
};
