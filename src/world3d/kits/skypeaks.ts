// ยอดเขาฟ้าและแสงเหนือ (skypeaks): the kit of the high places at the top of the world. On the
// royal peaks (สันเขาหลวง), the knife-edge ridge east of the old mine: granite crags and tors
// with snow on their ledges, cornices the wind has carved, the stone shelter where travellers
// rest on the way up, the kingdom's boundary pillar crowned in gold, a stone arch bridge over a
// cleft in the ridge, an iron chain along the cliff path, the mountain gate the kings built where
// the ridge road begins, and the great nest of the crag rocs. On the sky dragon's summit
// (ยอดเขามังกรฟ้า): the round dais where the dragon crowned the first king, its throne stone and
// blue-fire braziers, the standing stones round it carved with glowing runes and the trilithon
// that is their gate, pillars split and blackened by lightning, the dragon's nest of boulders and
// charred trunks heaped with its hoard, the bones of a dragon long dead, and the sea of clouds
// the summit stands in. On the aurora field (ทุ่งแสงเหนือ) at the north end of the world: the
// astronomer's ruined observatory with its broken dome and great brass telescope, an armillary
// sphere and a tablet of the stars, pipes of ice that whistle in the wind (and one great organ of
// them), and the aurora itself: streaks of its green and violet light lying on the snow and
// curtains of it hanging in the air.
//
// Everything is built from code in centimetres, Z up; each item stands on z = 0, centred on its
// footprint, its front facing -X. Masonry gets world-aligned texture coordinates so its courses
// stay level; the aurora is unlit light (a material of its own, colours and see-through at each
// corner). The fields also take the aurora's ribbons and curtains whole (auroraRibbon,
// auroraCurtain), laid over their own ground.

import * as THREE from "three";
import { merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, beamBetween, cylinderBetween, cylinderAt, sphereCenter, torus, rock, noise3 } from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial } from "../textures";
import type { Recipe } from "../textures";
import { coverTop } from "../nature";
import { limb, lump } from "../trees";
import type { Kit, Put } from "./types";
import type { SolidSpec } from "../../world";

// ---- the kit's own colours ----
const MATS: Record<string, Recipe> = {
  // the peaks' rock
  Skypeaks_Granite: { map: "crag", tint: "#a3a9b3", bump: 3 },
  Skypeaks_GraniteDark: { map: "crag", tint: "#6c727d", bump: 3 },
  Skypeaks_Slate: { map: "crag", tint: "#87909d", bump: 2 },
  Skypeaks_CliffPeak: { map: "crag", tint: "#9ca4b0", bump: 3.5 },  // the ridge's and the summit's cliffs
  Skypeaks_CliffNorth: { map: "crag", tint: "#79818d", bump: 3.5 }, // the aurora field's sea cliffs
  Skypeaks_SeaNorth: { tint: "#1f4459", rough: 0.06, opacity: 0.95 }, // the cold northern sea
  Skypeaks_Lichen: { map: "felt", tint: "#a5a679", rough: 1 },
  // the kingdom's masonry
  Skypeaks_Stone: { map: "stone", tint: "#e7e3d9", bump: 2 },
  Skypeaks_StoneWorn: { map: "stone", tint: "#c2bdb1", bump: 2.2 },
  Skypeaks_StoneDark: { map: "stone", tint: "#8f8c86", bump: 2.2 },
  Skypeaks_Carving: { map: "stone", tint: "#77746f", bump: 1.5 },
  Skypeaks_Paving: { map: "cobble", tint: "#bab5ab", bump: 2 },
  Skypeaks_RoofBlue: { map: "tiles", tint: "#3d64aa", bump: 2.5 },
  Skypeaks_Timber: { map: "wood", tint: "#6b4b32", bump: 1.2 },
  Skypeaks_Banner: { map: "fabric", tint: "#2b52a3", rough: 0.95 },
  Skypeaks_Gold: { map: "metal", tint: "#dbb04a", rough: 0.32, metal: 0.7 },
  Skypeaks_Iron: { map: "metal", tint: "#41444a", rough: 0.55, metal: 0.45 },
  Skypeaks_Ember: { tint: "#ffb366", glow: "#ff7a20", glowI: 1.8 },
  Skypeaks_Dark: { tint: "#1c1d22", rough: 1 },
  // the summit
  Skypeaks_Rune: { tint: "#c6ecff", glow: "#62c2ff", glowI: 1.2 },
  Skypeaks_BlueFire: { tint: "#dff4ff", glow: "#7cc8ff", glowI: 2, opacity: 0.88 },
  Skypeaks_Scorch: { map: "crag", tint: "#353234", bump: 3 },
  Skypeaks_Soot: { map: "felt", tint: "#3d3937", rough: 1 },
  Skypeaks_Bolt: { tint: "#eef8ff", glow: "#94d6ff", glowI: 1.8 },
  Skypeaks_Fulgurite: { tint: "#a7c6d4", rough: 0.1, metal: 0.2, opacity: 0.85 },
  Skypeaks_Bone: { map: "plaster", tint: "#ece4d0", rough: 0.85 },
  Skypeaks_BoneOld: { map: "plaster", tint: "#cabd9d", rough: 0.9 },
  Skypeaks_Coins: { map: "metal", tint: "#ecc04c", rough: 0.26, metal: 0.75, glow: "#8a5a10", glowI: 0.4 },
  Skypeaks_Chest: { map: "wood", tint: "#5c3b25", bump: 1.2 },
  Skypeaks_Ruby: { tint: "#ff4d6d", glow: "#b81d3a", glowI: 0.9, rough: 0.1 },
  Skypeaks_Sapphire: { tint: "#5aa0ff", glow: "#1f5ad0", glowI: 0.9, rough: 0.1 },
  Skypeaks_Char: { map: "bark", tint: "#2c2623", bump: 2 },
  Skypeaks_Shell: { map: "plaster", tint: "#d4e6ef", rough: 0.5 },
  Skypeaks_Cloud: { tint: "#fbfdff", rough: 1, glow: "#e2ebf6", glowI: 0.38 },
  Skypeaks_CloudShade: { tint: "#e6ecf4", rough: 1, glow: "#cbd8e8", glowI: 0.3 },
  Skypeaks_Mist: { tint: "#ffffff", rough: 1, opacity: 0.45, glow: "#e8f0fa", glowI: 0.35 },
  // the roc's nest
  Skypeaks_Twig: { map: "bark", tint: "#6f5944", bump: 2 },
  Skypeaks_TwigPale: { map: "bark", tint: "#9c8b75", bump: 2 },
  Skypeaks_NestLining: { map: "felt", tint: "#8d7b64", rough: 1 },
  Skypeaks_Feather: { map: "felt", tint: "#7b6551", rough: 1 },
  Skypeaks_FeatherTip: { map: "felt", tint: "#ebe5d9", rough: 1 },
  Skypeaks_Egg: { map: "plaster", tint: "#e6decb", rough: 0.7 },
  Skypeaks_EggSpot: { tint: "#6b5745", rough: 0.9 },
  // the far north
  Skypeaks_Ice: { map: "ice", tint: "#d5f2fb", rough: 0.08, opacity: 0.88, glow: "#86d8ff", glowI: 0.2 },
  Skypeaks_IceDeep: { map: "ice", tint: "#8dcbe6", rough: 0.1, opacity: 0.92, glow: "#4aa8e0", glowI: 0.22 },
  Skypeaks_IceGreen: { map: "ice", tint: "#c9ffe5", rough: 0.08, opacity: 0.88, glow: "#3ff0a0", glowI: 0.5 },
  Skypeaks_IceViolet: { map: "ice", tint: "#e7d6ff", rough: 0.08, opacity: 0.88, glow: "#a070ff", glowI: 0.5 },
  Skypeaks_IceHole: { tint: "#1d3b53", rough: 0.4 },
  Skypeaks_Copper: { map: "metal", tint: "#5f9d87", rough: 0.55, metal: 0.35 },
  Skypeaks_Brass: { map: "metal", tint: "#c99b48", rough: 0.35, metal: 0.65 },
  Skypeaks_Lens: { tint: "#a9dcff", rough: 0.05, glow: "#78c0ff", glowI: 0.7 },
  Skypeaks_Star: { tint: "#fff6c8", glow: "#ffe080", glowI: 1.6 },
  Skypeaks_Globe: { map: "plaster", tint: "#2f4f8c", rough: 0.6 },
};
for (const [name, recipe] of Object.entries(MATS)) defineMaterial(name, recipe);

type P2 = [number, number];
const RAD = Math.PI / 180;

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// ================================================================== geometry helpers

// Texture coordinates in metres from the position, across each face's normal (masonry courses
// stay level, snow and ice tile evenly whatever their shape).
function worldUv(geo: THREE.BufferGeometry): void {
  const pos = geo.getAttribute("position"), nor = geo.getAttribute("normal");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i)), nz = Math.abs(nor.getZ(i));
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const [u, v] = nz >= nx && nz >= ny ? [x, y] : nx >= ny ? [y, z] : [x, z];
    uv[i * 2] = u / 100;
    uv[i * 2 + 1] = v / 100;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}
function reuv(g: Geo): Geo {
  return g.map((p) => {
    const geo = p.geo.clone();
    if (!geo.getAttribute("normal")) geo.computeVertexNormals();
    worldUv(geo);
    return { geo, mat: p.mat };
  });
}
const sbox = (size: V3, center: V3, mat: string, bevel = 0): Geo => reuv(box(size, center, mat, bevel));
const sboxAt = (size: V3, bottom: V3, mat: string, bevel = 0): Geo => reuv(boxAt(size, bottom, mat, bevel));
// a block turned `turn` degrees about Z (and tipped `tip` about Y) round its own middle, set at `at`
const block = (size: V3, at: V3, turn: number, mat: string, bevel = 3, tip = 0): Geo => translate(rotateZ(rotateY(sbox(size, [0, 0, 0], mat, bevel), tip), turn), at);
function geoOf(geo: THREE.BufferGeometry, mat: string, uvWorld = true): Geo {
  geo.computeVertexNormals();
  if (uvWorld) worldUv(geo);
  return [{ geo, mat }];
}
const cone = (r: number, h: number, at: V3, mat: string, segs = 6): Geo => cylinderAt({ rBot: r, rTop: 0.5, height: h, segments: segs, bottom: at }, mat);

// Snow lying on whatever faces up.
const snowOn = (g: Geo, amount = 0.45, thick = 4, seed = 1): Geo => coverTop(g, "Snow", { amount, thick, seed, ragged: 0.4, grain: 30 });

// A rock of the peaks with snow on its upper faces (`cover` 0..1).
function crag(size: V3, seed: number, o: { at?: V3; turn?: number; mat?: string; rough?: number; flat?: boolean; cover?: number; tip?: number } = {}): Geo {
  const body = rock(size, o.rough ?? 0.42, seed, o.mat ?? "Skypeaks_Granite", o.flat ?? false);
  const cover = o.cover ?? 0.45;
  let g = cover > 0 ? merge(body, snowOn(body, cover, 3 + size[2] * 0.02, seed)) : body;
  if (o.tip) g = rotateY(g, o.tip);
  if (o.turn) g = rotateZ(g, o.turn);
  return o.at ? translate(g, o.at) : g;
}

// A soft low mound of snow lx by ly, h high: a lumpy dome, smooth-shaded.
function mound(lx: number, ly: number, h: number, seed: number, at: V3 = [0, 0, 0], turn = 0, mat = "Snow"): Geo {
  const rnd = seeded(seed);
  const geo = new THREE.SphereGeometry(1, 16, 7, 0, Math.PI * 2, 0, Math.PI / 2);
  const P = geo.getAttribute("position");
  const bumps = Array.from({ length: 5 }, () => [rnd() * Math.PI * 2, 0.08 + rnd() * 0.14, 1 + Math.floor(rnd() * 3)]);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), ang = Math.atan2(z, x);
    let r = 1;
    for (const [ph, amp, k] of bumps) r += amp * Math.sin(ang * k + ph);
    P.setXYZ(i, (x * r * lx) / 2, (-z * r * ly) / 2, y ** 0.8 * h * (0.85 + 0.15 * r) - 2);
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

// A smooth surface through rows of points (an indexed grid), both sides with their own normals.
function sheet(rows: V3[][], mat: string): Geo {
  const nr = rows.length, nc = rows[0].length, pos: number[] = [], idx: number[] = [];
  for (const side of [0, 1]) {
    const base = side * nr * nc;
    for (const row of rows) for (const p of row) pos.push(...p);
    for (let i = 0; i + 1 < nr; i++)
      for (let j = 0; j + 1 < nc; j++) {
        const a = base + i * nc + j, b = a + 1, c = a + nc + 1, d = a + nc;
        if (side === 0) idx.push(a, b, c, a, c, d);
        else idx.push(a, c, b, a, d, c);
      }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const uv = new Float32Array((pos.length / 3) * 2);
  for (let k = 0; k < pos.length / 3; k++) {
    uv[k * 2] = (pos[k * 3] + pos[k * 3 + 2] * 0.3) / 100;
    uv[k * 2 + 1] = pos[k * 3 + 1] / 100;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return [{ geo, mat }];
}

// An outline extruded from z0 to z1 (a flat plate: scorched ground, a cloth).
function slab(pts: P2[], z0: number, z1: number, mat: string, at: P2 = [0, 0]): Geo {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x + at[0], y + at[1])));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: z1 - z0, bevelEnabled: false, curveSegments: 1 });
  geo.translate(0, 0, z0);
  return geoOf(geo.toNonIndexed(), mat);
}
// An irregular outline round the origin, rx by ry, n points.
function blob(rx: number, ry: number, seed: number, n = 24, wob = 0.14): P2[] {
  const rnd = seeded(seed), ph = rnd() * 6.28, ph2 = rnd() * 6.28;
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, k = 1 + wob * (0.6 * Math.sin(a * 3 + ph) + 0.4 * Math.sin(a * 5 + ph2)) + (rnd() - 0.5) * wob * 0.4;
    return [Math.cos(a) * rx * k, Math.sin(a) * ry * k] as P2;
  });
}

// A chain or rope sagging from a to b (sag cm at its middle), as n straight pieces.
function sagLine(a: V3, b: V3, sag: number, n: number): V3[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - sag * 4 * t * (1 - t)] as V3;
  });
}
const line = (pts: V3[], r: number, mat: string, segs = 5): Geo => merge(...pts.slice(1).map((p, i) => cylinderBetween(pts[i], p, r, segs, mat)));

// Icicles hanging along an edge from a to b.
function icicles(a: V3, b: V3, seed: number, step = 22, maxLen = 45, mat = "Skypeaks_Ice"): Geo {
  const rnd = seeded(seed), out: Geo[] = [], L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  for (let d = step / 2; d < L; d += step * (0.7 + rnd() * 0.6)) {
    const t = d / L, len = maxLen * (0.25 + rnd() * 0.75);
    if (rnd() < 0.25) continue;
    const p: V3 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    out.push(cylinderAt({ rBot: 0.6, rTop: 3 + len * 0.06, height: len, segments: 5, bottom: [p[0], p[1], p[2] - len] }, mat));
  }
  return merge(...out);
}

// A hip roof hx by hy (half sizes) rising h, its faces in a grid (so snow can lie on part of
// them): U along the eaves, V up the slope, in metres.
function hipRoof(hx: number, hy: number, h: number, mat: string, n = 6): Geo {
  const rx = Math.max(0, hx - hy);
  const A: V3 = [-hx, -hy, 0], B: V3 = [hx, -hy, 0], C: V3 = [hx, hy, 0], D: V3 = [-hx, hy, 0], R1: V3 = [-rx, 0, h], R2: V3 = [rx, 0, h];
  const pos: number[] = [], uv: number[] = [];
  // a face from eave p0 -> p1 up to ridge q1 <- q0 (q0 above p0's end, q1 above p1's)
  const face = (p0: V3, p1: V3, q1: V3, q0: V3) => {
    const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const at = (u: number, v: number) => lerp(lerp(p0, p1, u), lerp(q0, q1, u), v);
    const eave = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), slope = Math.hypot(h, hy);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const c = [at(i / n, j / n), at((i + 1) / n, j / n), at((i + 1) / n, (j + 1) / n), at(i / n, (j + 1) / n)];
        const t = [[i / n, j / n], [(i + 1) / n, j / n], [(i + 1) / n, (j + 1) / n], [i / n, (j + 1) / n]];
        for (const k of [0, 1, 2, 0, 2, 3]) {
          pos.push(...c[k]);
          uv.push((t[k][0] * eave) / 100, (t[k][1] * slope) / 100);
        }
      }
  };
  face(A, B, R2, R1);
  face(C, D, R1, R2);
  face(D, A, R1, R1);
  face(B, C, R2, R2);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return [{ geo, mat }];
}

// A thing standing in turn round a circle: f(angle) gives its Geo at the origin facing out (+X).
const ringOf = (n: number, r: number, z: number, f: (a: number, k: number) => Geo, phase = 0): Geo =>
  merge(...Array.from({ length: n }, (_, k) => {
    const a = phase + (k / n) * Math.PI * 2;
    return translate(rotateZ(f(a, k), a / RAD), [Math.cos(a) * r, Math.sin(a) * r, z]);
  }));

// An iron brazier on three legs, its bowl burning (`fire` the flame's material).
function brazier(at: V3, fire = "Skypeaks_Ember", s = 1): Geo {
  const g: Geo[] = [];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    g.push(cylinderBetween([Math.cos(a) * 34 * s, Math.sin(a) * 34 * s, 0], [Math.cos(a) * 16 * s, Math.sin(a) * 16 * s, 70 * s], 3 * s, 5, "Skypeaks_Iron"));
  }
  g.push(cylinderAt({ rBot: 16 * s, rTop: 34 * s, height: 24 * s, segments: 10, bottom: [0, 0, 66 * s] }, "Skypeaks_Iron"));
  g.push(torus(34 * s, 2.5 * s, 14, 5, "Skypeaks_Iron").map((p) => ({ geo: p.geo.clone().translate(0, 0, 90 * s), mat: p.mat })));
  g.push(translate(scale(sphereCenter(26 * s, [0, 0, 0], fire, 8), [1, 1, 0.5]), [0, 0, 88 * s]));
  for (let k = 0; k < 3; k++) g.push(cone(10 * s, 34 * s, [Math.cos(k * 2.1) * 9 * s, Math.sin(k * 2.1) * 9 * s, 92 * s], fire, 5));
  return translate(merge(...g), at);
}

// ================================================================== the peaks: rock and snow

// A great boulder of the peaks, snow on its shoulders, two smaller ones fallen beside it.
function peakBoulder(): Geo {
  return merge(
    crag([320, 270, 240], 3101),
    crag([140, 120, 92], 3102, { at: [-150, 140, 0], turn: 30, cover: 0.55 }),
    crag([100, 90, 62], 3103, { at: [130, -165, 0], mat: "Skypeaks_GraniteDark", cover: 0.4 }),
    mound(240, 130, 34, 3104, [-160, -60, 0], 20),
    mound(170, 110, 26, 3105, [150, 110, 0], -30),
  );
}

// Angular blocks broken off the crags by the frost, one shard leaning tall among them.
function cragCluster(): Geo {
  return merge(
    crag([150, 130, 330], 3111, { at: [40, 20, 0], tip: 9, cover: 0.3 }),
    crag([230, 190, 170], 3112, { at: [-120, -100, 0], turn: -20 }),
    crag([170, 140, 120], 3113, { at: [-60, 170, 0], turn: 60, mat: "Skypeaks_GraniteDark" }),
    crag([240, 170, 70], 3114, { at: [170, -150, 0], flat: true, turn: 40, mat: "Skypeaks_Slate", cover: 0.6 }),
    crag([80, 70, 50], 3115, { at: [-230, 40, 0], cover: 0.5 }),
    crag([70, 60, 42], 3116, { at: [200, 160, 0], cover: 0.5 }),
    mound(280, 150, 32, 3117, [-40, -30, 0], 70),
  );
}

// A tor: blocks of granite stacked by the frost one on another, snow on each ledge (4 m).
function frostTor(): Geo {
  return merge(
    crag([280, 230, 150], 3121, { cover: 0.55 }),
    crag([230, 190, 140], 3122, { at: [15, -10, 128], turn: 25, cover: 0.55 }),
    crag([170, 150, 120], 3123, { at: [-10, 10, 250], turn: -15, cover: 0.6 }),
    crag([100, 90, 70], 3124, { at: [5, 0, 352], turn: 40, cover: 0.7 }),
    crag([170, 70, 190], 3125, { at: [-120, 140, 0], turn: 20, tip: -12, mat: "Skypeaks_Slate", cover: 0.3 }),
    crag([90, 80, 55], 3126, { at: [170, 120, 0], cover: 0.5 }),
    mound(320, 200, 30, 3127, [0, 0, 0], 10),
  );
}

// A cornice of wind-packed snow (7.6 m along Y): the long windward slope on +X rippled by the
// wind, the crest curling over into a lip above the steep lee side.
function snowCornice(): Geo {
  const L = 760, NY = 26, rows: V3[][] = [];
  const prof: P2[] = [[300, -4], [220, 0.2], [140, 0.48], [60, 0.8], [0, 0.97], [-40, 1], [-80, 0.97], [-104, 0.86], [-84, 0.7], [-62, 0.56], [-88, 0.32], [-140, 0.1], [-178, -4]];
  for (let j = 0; j <= NY; j++) {
    const t = j / NY, y = -L / 2 + L * t, H = 120 * Math.sin(Math.PI * t) ** 0.7 * (0.88 + 0.12 * Math.sin(t * 9));
    const w = 0.55 + 0.45 * Math.sin(Math.PI * t);
    rows.push(prof.map(([x, f], i) => {
      let z = i === 0 || i === prof.length - 1 ? -4 : f * H;
      if (x > 20 && i > 0) z += 3.5 * Math.sin(x / 15 + y / 70) * (H / 120);
      return [x * w, y + 14 * Math.sin(x / 90 + t * 3), z] as V3;
    }));
  }
  return sheet(rows, "Snow");
}

// ================================================================== the royal peaks: the ridge road

// The stone shelter where travellers rest on the way up (7 x 6 m): white stone columns on a
// plinth, a timber frame and a blue tiled hip roof under snow, benches round a brazier, a board
// with the king's crest over the way in (-X), drifts against its feet.
export const PAVILION_SOLIDS: SolidSpec[] = [
  { kind: "post", x: -280, y: -240, r: 36 }, { kind: "post", x: -280, y: 240, r: 36 },
  { kind: "post", x: 280, y: -240, r: 36 }, { kind: "post", x: 280, y: 240, r: 36 },
  { kind: "wall", x: 280, y: 0, w: 46, d: 460, rot: 0 },
  { kind: "post", x: 0, y: 0, r: 42 },
];
function restPavilion(): Geo {
  const S = "Skypeaks_Stone", W = "Skypeaks_StoneWorn", T = "Skypeaks_Timber", g: Geo[] = [];
  const X = 320, Y = 280, F = 52;
  g.push(sboxAt([2 * X + 50, 2 * Y + 50, 40], [0, 0, 0], W, 5));
  g.push(sboxAt([2 * X + 10, 2 * Y + 10, 12], [0, 0, 40], S, 3));
  for (let k = -2; k <= 2; k++) g.push(sboxAt([2 * X, 3, 1], [0, k * 110, F], "Skypeaks_StoneDark"));
  g.push(sboxAt([48, 270, 28], [-X - 49, 0, 0], W, 3), sboxAt([42, 270, 14], [-X - 92, 0, 0], W, 3));
  // the columns: base, shaft, capital
  const C: P2[] = [[-X + 40, -Y + 40], [-X + 40, Y - 40], [X - 40, -Y + 40], [X - 40, Y - 40]];
  for (const [cx, cy] of C) g.push(sboxAt([66, 66, 18], [cx, cy, F], W, 3), sboxAt([46, 46, 252], [cx, cy, F + 18], S, 4), sboxAt([68, 68, 20], [cx, cy, F + 270], W, 3));
  const top = F + 290;
  // the timber frame on the columns, its beam ends standing out
  for (const sy of [-1, 1]) g.push(sboxAt([2 * X + 60, 32, 36], [0, sy * (Y - 40), top], T, 2));
  for (const sx of [-1, 1]) g.push(sboxAt([32, 2 * Y + 40, 30], [sx * (X - 40), 0, top + 36], T, 2));
  for (let k = -3; k <= 3; k++) for (const sx of [-1, 1]) g.push(sboxAt([120, 14, 16], [sx * (X + 20), k * 76, top + 66], T, 1));
  for (let k = -3; k <= 3; k++) for (const sy of [-1, 1]) g.push(sboxAt([14, 120, 16], [k * 86, sy * (Y + 20), top + 66], T, 1));
  // the roof under its snow, the eave board, a gilt finial
  const rz = top + 82, roofH = 240;
  const roof = translate(hipRoof(X + 120, Y + 120, roofH, "Skypeaks_RoofBlue", 20), [0, 0, rz]);
  g.push(roof, coverTop(roof, "Snow", { thick: 7, seed: 3131, grain: 60, where: (x, y, z) => z > rz + roofH * (0.3 + 0.22 * noise3(x / 90, y / 90, 0, 3131)) }));
  g.push(sboxAt([2 * X + 250, 2 * Y + 250, 12], [0, 0, rz - 12], T, 3));
  g.push(sboxAt([2 * X + 262, 2 * Y + 262, 4], [0, 0, rz - 4], "Skypeaks_Gold"));
  g.push(cylinderAt({ rBot: 16, rTop: 9, height: 46, segments: 8, bottom: [0, 0, rz + roofH - 8] }, "Skypeaks_Gold"), sphereCenter(15, [0, 0, rz + roofH + 50], "Skypeaks_Gold", 10));
  g.push(icicles([-X - 120, -Y - 125, rz - 12], [X + 120, -Y - 125, rz - 12], 3132), icicles([-X - 125, Y + 120, rz - 12], [-X - 125, -Y - 120, rz - 12], 3133));
  // the back wall and the benches round three sides
  g.push(sboxAt([36, 2 * Y - 120, 112], [X - 40, 0, F], W, 3), sboxAt([46, 2 * Y - 110, 10], [X - 40, 0, F + 112], S, 2));
  for (const sy of [-1, 1]) {
    g.push(sboxAt([2 * X - 240, 48, 9], [-10, sy * (Y - 92), F + 40], T, 2));
    for (const x of [-200, 180]) g.push(sboxAt([34, 40, 40], [x, sy * (Y - 92), F], W, 2));
  }
  g.push(sboxAt([48, 2 * Y - 260, 9], [X - 98, 0, F + 40], T, 2));
  for (const y of [-110, 110]) g.push(sboxAt([40, 34, 40], [X - 98, y, F], W, 2));
  g.push(brazier([0, 0, F]));
  // the board with the crest over the way in
  g.push(sboxAt([10, 170, 50], [-X + 30, 0, top - 56], T, 2), cylinderBetween([-X + 24, 0, top - 31], [-X + 20, 0, top - 31], 18, 14, "Skypeaks_Gold"));
  for (const y of [-55, 55]) g.push(sboxAt([4, 8, 26], [-X + 23, y, top - 44], "Skypeaks_Gold"));
  for (const y of [-70, 70]) g.push(cylinderBetween([-X + 30, y, top - 6], [-X + 30, y, top], 1.5, 4, "Skypeaks_Iron"));
  // snow drifted against the plinth and on the steps
  g.push(mound(260, 120, 34, 3134, [X + 40, -Y + 40, 0], 30), mound(300, 110, 30, 3135, [80, Y + 50, 0], 0), mound(160, 90, 22, 3136, [-X - 70, Y - 40, 0], 60));
  g.push(snowOn(merge(sboxAt([2 * X + 50, 2 * Y + 50, 40], [0, 0, 0], W, 5)), 0.3, 4, 3137));
  return merge(...g);
}

// The kingdom's boundary pillar (6.5 m): a shaft of white stone on a stepped plinth, the die
// below it carved with the edict in gilt lines on each face, the king's medallion high on each
// face, a gilded crown on top; four bollards round it hung with chain.
export const PILLAR_SOLIDS: SolidSpec[] = [{ kind: "post", x: 0, y: 0, r: 135 }];
function boundaryPillar(): Geo {
  const S = "Skypeaks_Stone", W = "Skypeaks_StoneWorn", Gd = "Skypeaks_Gold", g: Geo[] = [];
  g.push(sboxAt([270, 270, 30], [0, 0, 0], W, 4), sboxAt([216, 216, 30], [0, 0, 30], W, 4), sboxAt([166, 166, 30], [0, 0, 60], S, 3));
  g.push(sboxAt([136, 136, 120], [0, 0, 90], S, 4), sboxAt([150, 150, 16], [0, 0, 210], W, 3));
  // the shaft, bands round it, the cornice and the drum the crown sits on
  g.push(sboxAt([96, 96, 390], [0, 0, 226], S, 6));
  for (const z of [330, 470]) g.push(sboxAt([104, 104, 12], [0, 0, z], W, 2));
  g.push(sboxAt([124, 124, 20], [0, 0, 616], W, 3), sboxAt([140, 140, 16], [0, 0, 636], S, 3));
  g.push(cylinderAt({ radius: 46, height: 22, segments: 16, bottom: [0, 0, 652] }, W));
  // each face: the edict's panel on the die, the medallion on the shaft
  for (let k = 0; k < 4; k++) {
    const face: Geo[] = [
      sboxAt([4, 100, 84], [-68, 0, 108], "Skypeaks_Carving"),
      ...[0, 1, 2, 3, 4].map((i) => sboxAt([3, 70 - (i % 2) * 18, 5], [-70.5, (i % 2) * -9, 120 + i * 14], Gd)),
      cylinderBetween([-48, 0, 545], [-53, 0, 545], 30, 18, Gd),
      cylinderBetween([-53, 0, 545], [-55, 0, 545], 20, 18, "Skypeaks_Banner"),
      sboxAt([3, 22, 12], [-56, 0, 540], Gd),
      ...[-8, 0, 8].map((y) => cone(3.5, 9, [-56, y, 551], Gd, 4)),
      sboxAt([3, 60, 4], [-49.5, 0, 420], "Skypeaks_Carving"),
      sboxAt([3, 4, 60], [-49.5, 0, 392], "Skypeaks_Carving"),
    ];
    g.push(rotateZ(merge(...face), k * 90));
  }
  // the crown: a band with points and pearls over a cap of blue velvet, an orb and cross on top
  const cz = 674;
  g.push(cylinderAt({ rBot: 40, rTop: 44, height: 24, segments: 16, bottom: [0, 0, cz] }, Gd));
  g.push(translate(scale(sphereCenter(38, [0, 0, 0], "Skypeaks_Banner", 12), [1, 1, 0.75]), [0, 0, cz + 22]));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    g.push(cone(9, k % 2 ? 22 : 34, [Math.cos(a) * 40, Math.sin(a) * 40, cz + 22], Gd, 4), sphereCenter(5, [Math.cos(a) * 40, Math.sin(a) * 40, cz + (k % 2 ? 46 : 58)], k % 2 ? "Skypeaks_Ruby" : "Skypeaks_Sapphire", 6));
  }
  g.push(sphereCenter(11, [0, 0, cz + 60], Gd, 10), sboxAt([5, 5, 26], [0, 0, cz + 68], Gd), sboxAt([5, 18, 5], [0, 0, cz + 84], Gd));
  // the bollards and chain
  const B: P2[] = [[-175, -175], [175, -175], [175, 175], [-175, 175]];
  for (const [bx, by] of B) g.push(sboxAt([26, 26, 70], [bx, by, 0], W, 3), cone(17, 16, [bx, by, 70], W, 4), sphereCenter(6, [bx, by, 88], "Skypeaks_Iron", 6));
  for (let k = 0; k < 4; k++) {
    const a = B[k], b = B[(k + 1) % 4];
    g.push(line(sagLine([a[0], a[1], 62], [b[0], b[1], 62], 22, 10), 2.2, "Skypeaks_Iron", 4));
  }
  const body = merge(...g);
  return merge(body, snowOn(body, 0.32, 4, 3141), mound(240, 130, 26, 3142, [130, -120, 0], 40), mound(200, 120, 22, 3143, [-120, 150, 0], 0));
}

// A stone arch bridge over a cleft in the ridge (15 m along X, 3.8 m wide): a paved deck the
// ground's own height between parapets, one arch of dressed voussoirs springing 4.6 m down from
// buttresses against the cleft's walls (which stand 6.5 m apart), spandrels filled in, posts with
// iron lanterns at its ends, icicles under it.
export const CHASM_BRIDGE_SOLIDS: SolidSpec[] = [
  { kind: "rail", x: 0, y: -173, w: 1500, d: 34, rot: 0 },
  { kind: "rail", x: 0, y: 173, w: 1500, d: 34, rot: 0 },
];
function chasmBridge(): Geo {
  const L = 1500, Wd = 380, S = "Skypeaks_Stone", W = "Skypeaks_StoneWorn", D = "Skypeaks_StoneDark", g: Geo[] = [];
  g.push(sboxAt([L, Wd, 46], [0, 0, -42], W, 4));
  g.push(sboxAt([L - 30, Wd - 76, 5], [0, 0, 3], "Skypeaks_Paving"));
  for (const sy of [-1, 1]) {
    g.push(sboxAt([L, 34, 64], [0, sy * (Wd / 2 - 17), 4], S, 3), sboxAt([L + 12, 46, 12], [0, sy * (Wd / 2 - 17), 68], W, 3));
    for (const sx of [-1, 1]) {
      const x = sx * (L / 2 - 10);
      g.push(sboxAt([58, 58, 116], [x, sy * (Wd / 2 - 17), 0], S, 4), cone(42, 26, [x, sy * (Wd / 2 - 17), 116], W, 4));
      // the lantern on its iron arm
      g.push(cylinderBetween([x, sy * (Wd / 2 - 17), 142], [x, sy * (Wd / 2 - 17), 168], 3, 5, "Skypeaks_Iron"));
      g.push(sboxAt([20, 20, 26], [x, sy * (Wd / 2 - 17), 168], "Skypeaks_Iron"), sboxAt([14, 14, 18], [x, sy * (Wd / 2 - 17), 172], "Skypeaks_Ember"), cone(15, 12, [x, sy * (Wd / 2 - 17), 194], "Skypeaks_Iron", 4));
    }
  }
  // the arch: a circle through the springings (+-span, zs) and the crown (0, zs + rise)
  const span = 300, zs = -460, rise = 405, Rr = (span * span + rise * rise) / (2 * rise), cz = zs + rise - Rr;
  const a0 = Math.asin(span / Rr), N = 17, Wa = Wd - 40;
  for (let k = 0; k < N; k++) {
    const a = -a0 + ((k + 0.5) / N) * 2 * a0, x = Math.sin(a) * (Rr + 32), z = cz + Math.cos(a) * (Rr + 32);
    g.push(translate(rotateY(sbox([(2 * a0 * (Rr + 32)) / N - 4, Wa, 64], [0, 0, 0], k === (N - 1) / 2 ? S : k % 2 ? W : D, 3), a / RAD), [x, 0, z]));
  }
  // the spandrels between the arch and the deck, the buttresses at its feet
  for (let x = -span - 30; x <= span + 30; x += 60) {
    const s = Math.min(1, Math.abs(x) / Rr), zt = cz + Math.cos(Math.asin(Math.min(0.999, Math.abs(x) / (Rr + 64)))) * (Rr + 64) - 6;
    if (zt < -48 && s < 1) g.push(sboxAt([62, Wa - 10, -42 - zt], [x, 0, zt], x % 120 ? W : D, 2));
  }
  for (const sx of [-1, 1]) g.push(sboxAt([140, Wa + 20, 420], [sx * (span + 40), 0, -880], D, 6), sboxAt([120, Wa + 30, 30], [sx * (span + 40), 0, -470], W, 3));
  g.push(icicles([-span + 40, -Wa / 2 - 2, -48], [span - 40, -Wa / 2 - 2, -48], 3151, 26, 60), icicles([-span + 40, Wa / 2 + 2, -48], [span - 40, Wa / 2 + 2, -48], 3152, 26, 60));
  const top = merge(...g);
  return merge(top, snowOn(top.slice(2).filter((p) => p.mat !== "Skypeaks_Paving"), 0.35, 4, 3153), mound(260, 130, 24, 3154, [-L / 2 + 110, Wd / 2 + 80, 0], 0), mound(220, 120, 20, 3155, [L / 2 - 90, -Wd / 2 - 70, 0], 20));
}

// The mountain gate where the kings' ridge road begins (8.4 m across, 7 m tall): two piers of
// white stone, an arch with the crowned keystone between them, a crenellated top, royal banners
// hanging on both faces, torches in iron baskets. The road runs through it along X.
export const RIDGE_GATE_SOLIDS: SolidSpec[] = [
  { kind: "wall", x: 0, y: -350, w: 190, d: 170, rot: 0 },
  { kind: "wall", x: 0, y: 350, w: 190, d: 170, rot: 0 },
];
function ridgeGate(): Geo {
  const S = "Skypeaks_Stone", W = "Skypeaks_StoneWorn", D = "Skypeaks_StoneDark", g: Geo[] = [];
  const Py = 350, Pw = 160, Pd = 180, zW = 640, top = zW + 80;
  for (const sy of [-1, 1]) {
    g.push(sboxAt([Pd + 30, Pw + 30, 40], [0, sy * Py, 0], W, 4), sboxAt([Pd, Pw, zW - 30], [0, sy * Py, 40], S, 5));
    for (const z of [160, 300]) g.push(sboxAt([Pd + 10, Pw + 10, 14], [0, sy * Py, z], W, 2));
    // banners on both faces, torches
    for (const fx of [-1, 1]) {
      const x = fx * (Pd / 2 + 4);
      g.push(cylinderBetween([x + fx * 6, sy * Py - 70, 420], [x + fx * 6, sy * Py + 70, 420], 4, 6, "Skypeaks_Iron"));
      const cloth: V3[][] = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8, z = 416 - t * 300, tail = t > 0.82 ? (t - 0.82) / 0.18 : 0;
        cloth.push([-1, -0.5, 0, 0.5, 1].map((u) => [x + fx * (8 + 3 * Math.sin(t * 5 + u)), sy * Py + u * 60, z + tail * 60 * (1 - Math.abs(u))] as V3));
      }
      g.push(sheet(cloth, "Skypeaks_Banner"));
      g.push(sboxAt([3, 120, 10], [x + fx * 9, sy * Py, 330], "Skypeaks_Gold"), cylinderBetween([x + fx * 10, sy * Py, 375], [x + fx * 11, sy * Py, 375], 22, 14, "Skypeaks_Gold"));
      g.push(cylinderBetween([x, sy * (Py - Pw / 2 + 10), 250], [x + fx * 40, sy * (Py - Pw / 2 + 10), 268], 3, 5, "Skypeaks_Iron"));
      g.push(brazier([x + fx * 44, sy * (Py - Pw / 2 + 10), 238], "Skypeaks_Ember", 0.4));
    }
  }
  // the arch over the way (the piers' inner faces 540 apart), springing inside the piers
  const r = Py - Pw / 2, N = 13, zc = 300, ro = r + 60;
  for (let k = 0; k < N; k++) {
    const a = ((k + 0.5) / N) * Math.PI, y = -Math.cos(a) * (r + 30), z = zc + Math.sin(a) * (r + 30);
    g.push(translate(rotateX(sbox([Pd - 6, (Math.PI * (r + 30)) / N - 4, 60], [0, 0, 0], k === (N - 1) / 2 ? S : k % 2 ? W : D, 3), 90 - a / RAD), [0, y, z]));
  }
  // the spandrels between the arch and the wall over it
  for (let y = -r + 22; y < r; y += 44) {
    const ze = zc + Math.sqrt(Math.max(0, ro * ro - y * y)) - 8;
    if (ze < zW) g.push(sboxAt([Pd - 20, 46, zW - ze], [0, y, ze], S, 2));
  }
  // the wall over the arch, the cornice, the merlons
  g.push(sboxAt([Pd - 20, 2 * Py + Pw, top - zW + 10], [0, 0, zW - 10], S, 4));
  g.push(sboxAt([Pd + 20, 2 * Py + Pw + 30, 22], [0, 0, top], W, 3));
  for (let k = -4; k <= 4; k++) g.push(sboxAt([Pd, 62, 58], [0, k * 98, top + 22], k % 2 ? W : S, 4));
  // the keystone's crest on both faces
  for (const fx of [-1, 1]) {
    g.push(cylinderBetween([fx * (Pd / 2 - 6), 0, zW + 34], [fx * (Pd / 2 + 6), 0, zW + 34], 34, 18, "Skypeaks_Gold"));
    g.push(cylinderBetween([fx * (Pd / 2 + 6), 0, zW + 34], [fx * (Pd / 2 + 9), 0, zW + 34], 24, 18, "Skypeaks_Banner"));
    for (const y of [-12, 0, 12]) g.push(cone(5, 16, [fx * (Pd / 2 + 10), y, zW + 42], "Skypeaks_Gold", 4));
  }
  const body = merge(...g);
  return merge(body, snowOn(body.filter((p) => p.mat !== "Skypeaks_Banner"), 0.4, 6, 3161), icicles([-Pd / 2 - 10, -Py - Pw / 2, top - 2], [-Pd / 2 - 10, Py + Pw / 2, top - 2], 3162), mound(260, 140, 30, 3163, [0, -Py - 180, 0], 90), mound(240, 130, 26, 3164, [40, Py + 170, 0], 90));
}

// A length of chain along the cliff path (4 m along Y): stone posts at both ends with iron caps,
// two chains sagging between them. Pieces join end to end.
function cliffRail(): Geo {
  const g: Geo[] = [];
  for (const y of [-200, 200]) g.push(sboxAt([24, 24, 92], [0, y, 0], "Skypeaks_StoneWorn", 3), cone(18, 12, [0, y, 92], "Skypeaks_Iron", 4), torus(6, 1.6, 8, 4, "Skypeaks_Iron").map((p) => ({ geo: p.geo.clone().rotateX(Math.PI / 2).translate(-13, y, 80), mat: p.mat })));
  g.push(line(sagLine([-12, -200, 80], [-12, 200, 80], 20, 12), 2, "Skypeaks_Iron", 4), line(sagLine([-12, -200, 44], [-12, 200, 44], 14, 12), 2, "Skypeaks_Iron", 4));
  const body = merge(...g);
  return merge(body, snowOn(body, 0.5, 4, 3171), mound(90, 70, 14, 3172, [10, -200, 0]), mound(90, 70, 14, 3173, [10, 200, 0]));
}

// The nest of the crag rocs (7.5 m across): branches whole trees long woven round on a shelf of
// rock, lined with feathers, three great speckled eggs in it, bones of the cattle they carried
// up, cast feathers round it, snow on its rim.
export const NEST_ROC_SOLIDS: SolidSpec[] = [{ kind: "rock", x: 0, y: 0, r: 360 }];
function rocNest(): Geo {
  const rnd = seeded(3181), g: Geo[] = [];
  g.push(crag([760, 660, 80], 3182, { flat: true, cover: 0.2, mat: "Skypeaks_GraniteDark" }));
  // the woven rim: branches laid round, crossing
  const sticks: Geo[] = [];
  for (let k = 0; k < 64; k++) {
    const a = (k / 64) * Math.PI * 2 + rnd() * 0.2, r = 240 + rnd() * 90, da = 0.35 + rnd() * 0.3, z0 = 60 + rnd() * 110, z1 = 60 + rnd() * 110;
    const p0: V3 = [Math.cos(a - da) * r, Math.sin(a - da) * r, z0], p1: V3 = [Math.cos(a + da) * (r + (rnd() - 0.5) * 60), Math.sin(a + da) * (r + (rnd() - 0.5) * 60), z1];
    const m: V3 = [(p0[0] + p1[0]) / 2 * 1.05, (p0[1] + p1[1]) / 2 * 1.05, (z0 + z1) / 2 + 10];
    sticks.push(limb([p0, m, p1], 5 + rnd() * 6, 3, rnd() < 0.6 ? "Skypeaks_Twig" : "Skypeaks_TwigPale", { seg: 5, maxRings: 4 }));
  }
  // and some sticking out
  for (let k = 0; k < 14; k++) {
    const a = rnd() * Math.PI * 2, r0 = 230 + rnd() * 60, r1 = r0 + 140 + rnd() * 120;
    sticks.push(limb([[Math.cos(a) * r0, Math.sin(a) * r0, 90 + rnd() * 60], [Math.cos(a + 0.1) * r1, Math.sin(a + 0.1) * r1, 60 + rnd() * 90]], 5, 2, "Skypeaks_TwigPale", { seg: 4, maxRings: 3 }));
  }
  g.push(...sticks);
  g.push(lump([0, 0, 70], [300, 280, 95], 3183, "Skypeaks_Twig", 2, 0.1, 80));
  g.push(lump([0, 0, 120], [230, 215, 48], 3184, "Skypeaks_NestLining", 2, 0.08, 60));
  // the eggs
  for (const [x, y, t] of [[-40, -50, 20], [60, 30, -15], [-30, 80, 40]]) {
    const egg = translate(rotateY(scale(sphereCenter(1, [0, 0, 0], "Skypeaks_Egg", 12), [36, 34, 48]), t), [x, y, 182]);
    g.push(egg);
    for (let i = 0; i < 9; i++) {
      const u = rnd() * Math.PI * 2, v = (rnd() - 0.3) * 1.2;
      g.push(translate(scale(sphereCenter(4 + rnd() * 3, [0, 0, 0], "Skypeaks_EggSpot", 5), [1, 1, 0.4]), [x + Math.cos(u) * Math.cos(v) * 34, y + Math.sin(u) * Math.cos(v) * 32, 182 + Math.sin(v) * 45]));
    }
  }
  // bones of their prey and cast feathers
  g.push(translate(rotateZ(cowSkull(), 30), [210, -210, 150]));
  for (let k = 0; k < 6; k++) g.push(limb([[-180 + k * 22, 200, 150], [-200 + k * 22, 250, 175], [-220 + k * 22, 300, 140]], 5, 3, "Skypeaks_Bone", { seg: 5, maxRings: 4 }));
  for (let k = 0; k < 11; k++) {
    const a = rnd() * Math.PI * 2, r = 280 + rnd() * 160;
    g.push(translate(rotateZ(feather(70 + rnd() * 50), a / RAD + 90), [Math.cos(a) * r, Math.sin(a) * r, r > 350 ? 4 : 160]));
  }
  const rim = merge(...sticks);
  g.push(coverTop(rim, "Snow", { amount: 0.2, thick: 3, seed: 3185, patches: 0.4, grain: 40 }), mound(300, 160, 30, 3186, [-300, 260, 0], 30));
  return merge(...g);
}
// A cast feather of a roc (along X): a quill, the vane in two halves, a pale tip.
function feather(len: number): Geo {
  return merge(
    cylinderBetween([-len / 2, 0, 2], [len / 2, 0, 2], 1.6, 4, "Skypeaks_BoneOld"),
    translate(scale(sphereCenter(1, [0, 0, 0], "Skypeaks_Feather", 8), [len * 0.42, len * 0.11, 1.5]), [len * 0.02, 0, 2]),
    translate(scale(sphereCenter(1, [0, 0, 0], "Skypeaks_FeatherTip", 6), [len * 0.12, len * 0.09, 1.6]), [len * 0.38, 0, 2.3]),
  );
}
// An ox's skull (along X, the muzzle to -X), horns sweeping out.
function cowSkull(): Geo {
  const B = "Skypeaks_Bone";
  return merge(
    translate(scale(sphereCenter(1, [0, 0, 0], B, 10), [34, 22, 18]), [0, 0, 18]),
    translate(scale(sphereCenter(1, [0, 0, 0], B, 8), [26, 13, 11]), [-40, 0, 13]),
    sphereCenter(5, [-10, -13, 24], "Skypeaks_Dark", 6), sphereCenter(5, [-10, 13, 24], "Skypeaks_Dark", 6),
    limb([[12, -14, 30], [18, -45, 40], [6, -70, 58]], 5, 1.5, B, { seg: 5, maxRings: 4 }),
    limb([[12, 14, 30], [18, 45, 40], [6, 70, 58]], 5, 1.5, B, { seg: 5, maxRings: 4 }),
  );
}

// ================================================================== the sky dragon's summit

// The coronation dais (12 m across): three round tiers of white stone, an inlaid sun of gold on
// the top with the dragon's mark in its heart, the throne stone at the back (+X) with wings of
// stone spread behind it and a crown of gold over it, braziers of blue fire to either side;
// cracks, and snow lying on the tiers' rims.
export const DAIS_SOLIDS: SolidSpec[] = [
  { kind: "wall", x: 300, y: 0, w: 120, d: 200, rot: 0 },
  { kind: "post", x: 270, y: -190, r: 40 }, { kind: "post", x: 270, y: 190, r: 40 },
];
function coronationDais(): Geo {
  const S = "Skypeaks_Stone", W = "Skypeaks_StoneWorn", Gd = "Skypeaks_Gold", g: Geo[] = [];
  const tiers: P2[] = [[600, 12], [490, 12], [380, 12]];
  let z = 0;
  tiers.forEach(([r, h], i) => {
    g.push(reuv(cylinderAt({ radius: r, height: h - 2, segments: 36, bottom: [0, 0, z] }, i ? W : "Skypeaks_StoneDark")));
    g.push(reuv(cylinderAt({ radius: r - 4, height: 2, segments: 36, bottom: [0, 0, z + h - 2] }, i === 2 ? "Skypeaks_Paving" : S)));
    // rune slots round the riser
    g.push(ringOf(Math.round(r / 30), r + 1, z + 3, () => sboxAt([3, 16, 5], [0, 0, 0], "Skypeaks_Rune"), 0.1));
    z += h;
  });
  // the gold sun inlaid in the top, the dragon's mark at its heart
  const flat = (geo: Geo, zz: number) => geo.map((p) => ({ geo: p.geo.clone().scale(1, 1, 0.35).translate(0, 0, zz), mat: p.mat }));
  g.push(flat(torus(320, 6, 48, 4, Gd), z + 1.5), flat(torus(196, 5, 40, 4, Gd), z + 1.5), flat(torus(84, 4, 24, 4, Gd), z + 1.5));
  g.push(ringOf(16, 258, z, (_a, k) => sboxAt([k % 2 ? 80 : 118, k % 2 ? 8 : 12, 2.5], [0, 0, 0], Gd)));
  g.push(cylinderAt({ radius: 84, height: 2, segments: 24, bottom: [0, 0, z] }, "Skypeaks_Banner"));
  for (let k = 0; k < 3; k++) g.push(rotateZ(merge(sboxAt([118, 8, 3], [0, 0, z], "Skypeaks_Rune"), cone(10, 3.5, [60, 0, z], "Skypeaks_Rune", 3)), k * 120 + 30));
  // cracks across the top
  const rnd = seeded(3201);
  for (let k = 0; k < 7; k++) {
    const a = rnd() * Math.PI * 2, r0 = 120 + rnd() * 220;
    g.push(translate(rotateZ(sboxAt([60 + rnd() * 90, 2.5, 1.2], [0, 0, z], "Skypeaks_Dark"), a / RAD + 70 + rnd() * 40), [Math.cos(a) * r0, Math.sin(a) * r0, 0]));
  }
  // the throne at the back
  const tx = 280, from = g.length;
  g.push(sboxAt([130, 170, 50], [tx - 20, 0, z], S, 5), sboxAt([116, 150, 12], [tx - 24, 0, z + 50], "Skypeaks_Banner", 3));
  g.push(sboxAt([48, 190, 290], [tx + 40, 0, z], S, 5), sboxAt([54, 200, 22], [tx + 40, 0, z + 290], W, 3));
  for (const sy of [-1, 1]) {
    g.push(sboxAt([110, 26, 70], [tx - 25, sy * 92, z + 50], W, 4), sphereCenter(13, [tx - 78, sy * 92, z + 124], Gd, 8));
    // the wings of stone behind the back: feathers of stone fanning out and down from its top
    for (let i = 0; i < 5; i++) {
      const len = 230 - i * 22;
      g.push(translate(rotateX(sboxAt([34 - i * 2, len, 26], [0, sy * len / 2, -13], i % 2 ? W : S, 4), sy * (8 + i * 17)), [tx + 52 + i * 3, sy * 80, z + 286 - i * 18]));
    }
  }
  // the crown over the back of the throne
  const crz = z + 312;
  g.push(cylinderAt({ rBot: 34, rTop: 38, height: 20, segments: 14, bottom: [tx + 40, 0, crz] }, Gd));
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    g.push(cone(8, k % 2 ? 18 : 28, [tx + 40 + Math.cos(a) * 34, Math.sin(a) * 34, crz + 18], Gd, 4));
  }
  g.push(sphereCenter(10, [tx + 40, 0, crz + 30], "Skypeaks_Sapphire", 8));
  // the dragon's mark carved on the back's front, filled with light
  g.push(sboxAt([3, 8, 120], [tx + 14.5, 0, z + 120], "Skypeaks_Rune"));
  for (const sy of [-1, 1]) for (let i = 0; i < 3; i++) g.push(translate(rotateX(sboxAt([3, 52 - i * 10, 6], [0, 0, 0], "Skypeaks_Rune"), sy * (30 + i * 18)), [tx + 14.5, sy * 26, z + 200 - i * 30]));
  // braziers of blue fire
  for (const sy of [-1, 1]) g.push(sboxAt([60, 60, 40], [tx - 10, sy * 190, z], W, 4), brazier([tx - 10, sy * 190, z + 40], "Skypeaks_BlueFire", 0.9));
  const throne = merge(...g.slice(from));
  return merge(...g, snowOn(throne.filter((p) => p.mat === S || p.mat === W), 0.25, 3, 3202), mound(300, 120, 20, 3203, [-520, -380, 0], 40), mound(260, 110, 18, 3204, [480, 420, 0], -30), mound(220, 100, 16, 3205, [-200, 610, 0], 0), mound(180, 90, 30, 3206, [-430, 330, 0], 70));
}

// A rough-dressed slab standing on end, W x D at its foot, H tall, tapering, its faces a little
// uneven; `runes` carved on its front (-X) face and filled with light.
function standingSlab(Wd: number, D: number, H: number, seed: number, runes: boolean, mat = "Skypeaks_Granite", lichen = true): Geo {
  const geo = new THREE.BoxGeometry(D, Wd, H, 2, 3, 9).toNonIndexed();
  geo.translate(0, 0, H / 2);
  const p = geo.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = z / H, k = 1 - 0.22 * t - (t > 0.9 ? (t - 0.9) * 2.2 : 0);
    const n = noise3(x / 60, y / 60, z / 80, seed) - 0.5;
    p.setXYZ(i, x * k + (x < 0 ? 0 : n * 10), y * k + n * 10, z + (t > 0.95 ? n * 20 : 0));
  }
  const g: Geo[] = [geoOf(geo, mat)];
  if (runes) {
    const rnd = seeded(seed + 7);
    for (let r = 0; r < 7; r++) {
      const z = H * 0.2 + r * H * 0.085, half = (Wd / 2) * (1 - 0.22 * (z / H)) - 16;
      const x = (-D / 2) * (1 - 0.22 * (z / H)) - 1.2;
      for (let c = -1; c <= 1; c++) {
        if (rnd() < 0.25) continue;
        const y = c * half * 0.55, kind = Math.floor(rnd() * 3);
        if (kind === 0) g.push(sboxAt([3, 6, 22], [x, y, z], "Skypeaks_Rune"));
        else if (kind === 1) g.push(translate(rotateX(sboxAt([3, 5, 24], [0, 0, -12], "Skypeaks_Rune"), 35), [x, y, z + 12]), translate(rotateX(sboxAt([3, 5, 24], [0, 0, -12], "Skypeaks_Rune"), -35), [x, y, z + 12]));
        else g.push(sboxAt([3, 18, 5], [x, y, z + 8], "Skypeaks_Rune"), sboxAt([3, 5, 20], [x, y - 7, z], "Skypeaks_Rune"));
      }
    }
  }
  const body = merge(...g);
  return merge(body, lichen ? coverTop(g[0], "Skypeaks_Lichen", { thick: 1.2, seed: seed + 3, patches: 0.22, grain: 22, where: (_x, _y, z, nz) => nz > -0.3 && nz < 0.6 && z < H * 0.7 }) : [], snowOn(g[0], 0.3, 5, seed + 5));
}

// A standing stone of the ring round the dais (4.8 m), runes of light carved up its face.
function ringStone(): Geo {
  return merge(standingSlab(130, 78, 480, 3211, true), mound(200, 140, 26, 3212, [30, 0, 0], 0), crag([70, 60, 40], 3213, { at: [70, -90, 0], cover: 0.5 }));
}

// The ring's gate: two stones and a lintel across them (6.6 m across, 5.6 m tall), the lintel
// carved with the dragon's runes on its outer face (-X).
export const TRILITHON_SOLIDS: SolidSpec[] = [{ kind: "post", x: 0, y: -235, r: 75 }, { kind: "post", x: 0, y: 235, r: 75 }];
function trilithon(): Geo {
  const g: Geo[] = [standingSlab(120, 86, 480, 3221, true), standingSlab(120, 86, 470, 3222, true)];
  g[0] = translate(g[0], [0, -235, 0]);
  g[1] = translate(g[1], [0, 235, 0]);
  const lintel = reuv(box([96, 660, 86], [0, 0, 512], "Skypeaks_Granite", 10));
  g.push(lintel, coverTop(lintel, "Snow", { amount: 0.55, thick: 6, seed: 3223 }));
  for (let k = -5; k <= 5; k++) if (k) g.push(sboxAt([3, 20, k % 2 ? 40 : 18], [-49.5, k * 52, 492], "Skypeaks_Rune"));
  g.push(sboxAt([3, 560, 5], [-49.5, 0, 540], "Skypeaks_Rune"));
  g.push(mound(260, 160, 28, 3224, [20, -235, 0], 0), mound(240, 160, 26, 3225, [20, 235, 0], 0));
  return merge(...g);
}

// A pillar of stone the lightning has split and burnt black (5 m): its two halves leaning apart,
// cracks in it still glowing, its top shattered over the ground, a ring of scorched snow and
// tubes of lightning glass round its foot.
function struckPillar(): Geo {
  const rnd = seeded(3231), g: Geo[] = [];
  g.push(slab(blob(260, 230, 3232, 22, 0.22), 0, 1.5, "Skypeaks_Soot"));
  for (const sx of [-1, 1]) {
    const half = standingSlab(110, 46, sx < 0 ? 470 : 410, 3233 + sx, false, "Skypeaks_Scorch", false);
    g.push(translate(rotateY(half, sx * 4), [sx * 30, 0, 0]));
  }
  // the bolt's path down both faces
  for (const fx of [-1, 1]) {
    let p: V3 = [fx * 54, (rnd() - 0.5) * 30, 420];
    while (p[2] > 30) {
      const q: V3 = [fx * (52 + rnd() * 6), Math.max(-45, Math.min(45, p[1] + (rnd() - 0.5) * 50)), p[2] - 30 - rnd() * 40];
      g.push(beamBetween(p, q, 4, 4, "Skypeaks_Bolt"));
      p = q;
    }
  }
  for (const fy of [-1, 1]) {
    let p: V3 = [(rnd() - 0.5) * 40, fy * 57, 440];
    while (p[2] > 40) {
      const q: V3 = [Math.max(-70, Math.min(70, p[0] + (rnd() - 0.5) * 60)), fy * (55 + rnd() * 4), p[2] - 30 - rnd() * 40];
      g.push(beamBetween(p, q, 5, 5, "Skypeaks_Bolt"));
      p = q;
    }
  }
  // fallen fragments, fulgurites
  for (let k = 0; k < 7; k++) {
    const a = rnd() * Math.PI * 2, d = 120 + rnd() * 140;
    g.push(crag([50 + rnd() * 50, 40 + rnd() * 40, 30 + rnd() * 30], 3240 + k, { at: [Math.cos(a) * d, Math.sin(a) * d, 0], turn: rnd() * 360, mat: "Skypeaks_Scorch", cover: 0.15 }));
  }
  for (let k = 0; k < 5; k++) {
    const a = rnd() * Math.PI * 2, d0 = 70 + rnd() * 40, d1 = d0 + 80 + rnd() * 90;
    g.push(limb([[Math.cos(a) * d0, Math.sin(a) * d0, 3], [Math.cos(a + 0.2) * (d0 + d1) / 2, Math.sin(a + 0.2) * (d0 + d1) / 2, 6], [Math.cos(a) * d1, Math.sin(a) * d1, 2]], 4.5, 2, "Skypeaks_Fulgurite", { seg: 5, maxRings: 4 }));
  }
  return merge(...g);
}

// The dragon's nest (13 m across): a ring of boulders and charred trunks round a floor burnt
// black, open on its -X side, the hoard heaped inside it: gold coins in drifts, chests, goblets,
// a crown, swords and shields of those who came for it, gems, bones, and the shell of the egg
// the young dragons hatched from.
export const NEST_DRAGON_SOLIDS: SolidSpec[] = [
  ...Array.from({ length: 13 }, (_, k) => {
    const a = Math.PI * 1.2 + (k / 12) * Math.PI * 1.6;
    return { kind: "rock", x: Math.cos(a) * 580, y: Math.sin(a) * 580, r: 140 };
  }),
  { kind: "rock", x: 60, y: 0, r: 230 },
  { kind: "rock", x: 220, y: -260, r: 110 },
  { kind: "rock", x: 200, y: 280, r: 120 },
];
function dragonNest(): Geo {
  const rnd = seeded(3251), g: Geo[] = [];
  g.push(slab(blob(560, 540, 3252, 30, 0.08), 0, 2, "Skypeaks_Soot"));
  // the ring of boulders, the mouth to -X left open
  for (let k = 0; k <= 16; k++) {
    const a = Math.PI * 1.2 + (k / 16) * Math.PI * 1.6, r = 560 + rnd() * 80, s = 0.7 + rnd() * 0.5;
    g.push(crag([220 * s, 190 * s, 150 * s], 3253 + k, { at: [Math.cos(a) * r, Math.sin(a) * r, 0], turn: rnd() * 360, mat: k % 3 ? "Skypeaks_Granite" : "Skypeaks_Scorch", cover: 0.18 }));
  }
  // charred trunks dragged across the rim
  for (let k = 0; k < 7; k++) {
    const a = Math.PI * 1.3 + (k / 6) * Math.PI * 1.4 + rnd() * 0.2, r0 = 470, r1 = 700;
    g.push(limb([[Math.cos(a - 0.15) * r0, Math.sin(a - 0.15) * r0, 30 + rnd() * 50], [Math.cos(a) * (r0 + r1) / 2, Math.sin(a) * (r0 + r1) / 2, 90 + rnd() * 50], [Math.cos(a + 0.2) * r1, Math.sin(a + 0.2) * r1, 20]], 16 + rnd() * 8, 9, "Skypeaks_Char", { seg: 7, maxRings: 6, gnarl: 0.6, seed: 3270 + k }));
  }
  // the hoard: drifts of coin with the treasures in them
  g.push(lump([60, 0, 0], [260, 220, 70], 3281, "Skypeaks_Coins", 2, 0.12, 50), lump([220, -260, 0], [130, 110, 45], 3282, "Skypeaks_Coins", 1, 0.12, 50), lump([200, 280, 0], [150, 120, 50], 3283, "Skypeaks_Coins", 1, 0.12, 50));
  for (let k = 0; k < 70; k++) {
    const a = rnd() * Math.PI * 2, d = 120 + rnd() * 380;
    g.push(translate(rotateY(cylinderAt({ radius: 7, height: 1.6, segments: 8, bottom: [0, 0, 0] }, "Skypeaks_Coins"), (rnd() - 0.5) * 40), [60 + Math.cos(a) * d, Math.sin(a) * d * 0.9, 2]));
  }
  for (const [hx, hy, rx, ry, hz, n] of [[60, 0, 260, 220, 70, 50], [220, -260, 130, 110, 45, 14], [200, 280, 150, 120, 50, 16]]) {
    for (let k = 0; k < n; k++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 0.85, x = Math.cos(a) * d, y = Math.sin(a) * d, zz = hz * Math.sqrt(Math.max(0, 1 - d * d)) * 0.9;
      g.push(translate(rotateY(rotateX(cylinderAt({ radius: 7, height: 1.6, segments: 8, bottom: [0, 0, 0] }, "Skypeaks_Coins"), (rnd() - 0.5) * 50), (rnd() - 0.5) * 50), [hx + x * rx, hy + y * ry, zz]));
    }
  }
  g.push(translate(rotateZ(chest(true), 200), [-80, -180, 20]), translate(rotateZ(rotateY(chest(false), 12), 40), [260, 100, 40]), translate(rotateZ(chest(false), -70), [-60, 250, 6]));
  g.push(translate(crown(), [70, -20, 66]), goblet([-10, 120, 40]), goblet([160, -120, 50]), goblet([300, -300, 26]));
  for (const [x, y, t, h] of [[0, -60, 20, 30], [150, 60, -25, 160], [260, -220, 30, 250], [120, 300, -15, 90]]) g.push(translate(rotateZ(rotateY(sword(), t), h), [x, y, 40]));
  for (const [x, y, h] of [[-150, 80, 30], [330, 220, 200], [120, -330, 120]]) g.push(translate(rotateZ(shield(), h), [x, y, 0]));
  for (let k = 0; k < 14; k++) {
    const a = rnd() * Math.PI * 2, d = 60 + rnd() * 240;
    g.push(sphereCenter(5 + rnd() * 4, [60 + Math.cos(a) * d, Math.sin(a) * d, 44 + rnd() * 16], k % 2 ? "Skypeaks_Ruby" : "Skypeaks_Sapphire", 5));
  }
  // the hatched egg's shell, bones of those who came for the hoard
  const shell = new THREE.SphereGeometry(80, 14, 10, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55);
  g.push(translate(rotateY(geoOf(shell.toNonIndexed().rotateX(Math.PI / 2), "Skypeaks_Shell", false), 14), [-250, 140, 74]));
  for (let k = 0; k < 4; k++) {
    const sh = new THREE.SphereGeometry(80, 6, 4, rnd() * 6, 0.9, 0.3 + rnd(), 0.7);
    g.push(translate(geoOf(sh.toNonIndexed().rotateX(Math.PI / 2), "Skypeaks_Shell", false), [-280 + k * 70, -40 + rnd() * 80, -50]));
  }
  g.push(translate(rotateZ(cowSkull(), 140), [-300, -260, 0]));
  for (let k = 0; k < 5; k++) g.push(limb([[-360 + k * 30, 320, 0], [-370 + k * 30, 360, 30], [-380 + k * 30, 400, 0]], 6, 3, "Skypeaks_BoneOld", { seg: 5, maxRings: 4 }));
  const rim = merge(...g.slice(1, 18));
  g.push(snowOn(rim, 0.25, 4, 3290), mound(320, 160, 30, 3291, [-650, 420, 0], 30), mound(300, 150, 26, 3292, [600, -500, 0], -40));
  return merge(...g);
}
function chest(open: boolean): Geo {
  const g: Geo[] = [sboxAt([90, 60, 50], [0, 0, 0], "Skypeaks_Chest", 2)];
  for (const x of [-34, 34]) g.push(sboxAt([8, 62, 52], [x, 0, -1], "Skypeaks_Gold"));
  if (open) g.push(translate(rotateY(merge(sboxAt([90, 60, 14], [0, 0, 0], "Skypeaks_Chest", 2), sboxAt([8, 62, 15], [-34, 0, 0], "Skypeaks_Gold"), sboxAt([8, 62, 15], [34, 0, 0], "Skypeaks_Gold")), -100, [0, 30, 0]), [0, 0, 50]), lump([0, 0, 40], [42, 26, 18], 3295, "Skypeaks_Coins", 1, 0.1, 40));
  else g.push(sboxAt([92, 62, 16], [0, 0, 50], "Skypeaks_Chest", 4), sboxAt([12, 6, 14], [0, -32, 40], "Skypeaks_Gold"));
  return translate(merge(...g), [0, 0, 0]);
}
function crown(): Geo {
  const g: Geo[] = [cylinderAt({ rBot: 20, rTop: 23, height: 13, segments: 12, bottom: [0, 0, 0] }, "Skypeaks_Gold")];
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    g.push(cone(5, 14, [Math.cos(a) * 21, Math.sin(a) * 21, 12], "Skypeaks_Gold", 4), sphereCenter(3, [Math.cos(a) * 21, Math.sin(a) * 21, 27], "Skypeaks_Ruby", 5));
  }
  return rotateY(merge(...g), 18);
}
function goblet(at: V3): Geo {
  return translate(merge(
    cylinderAt({ radius: 9, height: 2, segments: 10, bottom: [0, 0, 0] }, "Skypeaks_Gold"),
    cylinderAt({ radius: 2.5, height: 14, segments: 6, bottom: [0, 0, 2] }, "Skypeaks_Gold"),
    cylinderAt({ rBot: 3, rTop: 10, height: 14, segments: 10, bottom: [0, 0, 15] }, "Skypeaks_Gold"),
  ), at);
}
function sword(): Geo {
  return merge(
    sboxAt([3, 9, 110], [0, 0, 0], "Skypeaks_Iron"), sboxAt([6, 34, 5], [0, 0, 110], "Skypeaks_Gold"),
    cylinderAt({ radius: 3, height: 22, segments: 6, bottom: [0, 0, 115] }, "Skypeaks_Chest"), sphereCenter(5, [0, 0, 140], "Skypeaks_Gold", 6),
  );
}
function shield(): Geo {
  return translate(rotateY(merge(
    cylinderAt({ radius: 42, height: 6, segments: 14, bottom: [0, 0, 0] }, "Skypeaks_Banner"),
    torus(42, 3, 16, 4, "Skypeaks_Gold").map((p) => ({ geo: p.geo.clone().translate(0, 0, 6), mat: p.mat })),
    sphereCenter(10, [0, 0, 6], "Skypeaks_Gold", 8),
  ), -70), [0, 0, 40]);
}

// The bones of a dragon long dead (16 m from snout to tail, 13 m across its wings), lying in
// the snow: the horned skull, the spine curving away, the ribs arching over, the wings' long
// bones and fingers spread on the ground, snow drifted over half of it.
function dragonSkeleton(): Geo {
  const B = "Skypeaks_Bone", O = "Skypeaks_BoneOld", g: Geo[] = [];
  const spine = new THREE.CatmullRomCurve3([[-560, 0, 70], [-380, 50, 75], [-120, 30, 80], [150, -60, 60], [420, -40, 40], [650, 90, 26], [880, 160, 14]].map((p) => new THREE.Vector3(...p)));
  // vertebrae along it
  for (let k = 0; k <= 46; k++) {
    const t = k / 46, p = spine.getPointAt(t), d = spine.getTangentAt(t), s = 1 - t * 0.7;
    g.push(translate(rotateZ(merge(sbox([22 * s + 6, 30 * s + 8, 26 * s + 8], [0, 0, 0], k % 2 ? B : O, 4), sbox([8, 6, 30 * s], [0, 0, 22 * s], O, 2)), (Math.atan2(d.y, d.x)) / RAD), [p.x, p.y, p.z]));
  }
  // ribs over the chest
  for (let k = 0; k < 11; k++) {
    const t = 0.1 + k * 0.032, p = spine.getPointAt(t), d = spine.getTangentAt(t), nx = -d.y, ny = d.x, reach = 190 - Math.abs(k - 4) * 14;
    for (const s of [-1, 1]) g.push(limb([[p.x, p.y, p.z], [p.x + nx * s * reach * 0.7, p.y + ny * s * reach * 0.7, p.z + 70], [p.x + nx * s * reach, p.y + ny * s * reach, p.z - 10], [p.x + nx * s * reach * 0.9 + d.x * 20, p.y + ny * s * reach * 0.9 + d.y * 20, 0]], 7, 4, k % 2 ? B : O, { seg: 5, maxRings: 7 }));
  }
  // the skull: the long snout, the jaw fallen open, the horns swept back, teeth
  const hx = -560, hy = 0;
  g.push(limb([[hx + 40, hy, 80], [hx - 80, hy - 10, 74], [hx - 210, hy - 20, 52]], 46, 18, B, { seg: 9, maxRings: 6 }));
  g.push(translate(scale(sphereCenter(1, [0, 0, 0], B, 10), [70, 60, 50]), [hx + 30, hy, 80]));
  g.push(limb([[hx + 20, hy + 20, 34], [hx - 100, hy + 40, 14], [hx - 200, hy + 30, 6]], 16, 9, O, { seg: 6, maxRings: 5 }));
  for (const s of [-1, 1]) {
    g.push(sphereCenter(15, [hx - 10, hy + s * 40, 96], "Skypeaks_Dark", 8));
    g.push(limb([[hx + 40, hy + s * 30, 120], [hx + 140, hy + s * 70, 170], [hx + 230, hy + s * 60, 150], [hx + 280, hy + s * 30, 110]], 13, 2.5, O, { seg: 6, maxRings: 7 }));
    for (let i = 0; i < 6; i++) g.push(cone(4, 16, [hx - 90 - i * 22, hy + s * (24 - i * 2), 34], B, 4));
  }
  // the wings: arm bones out from the shoulders, fingers fanning along the ground
  const sh = spine.getPointAt(0.12);
  for (const s of [-1, 1]) {
    const elbow: V3 = [sh.x - 60, sh.y + s * 300, 30], wrist: V3 = [sh.x + 120, sh.y + s * 520, 16];
    g.push(limb([[sh.x, sh.y + s * 40, sh.z], elbow], 13, 9, B, { seg: 7, maxRings: 4 }), limb([elbow, wrist], 10, 7, O, { seg: 7, maxRings: 4 }));
    for (let i = 0; i < 4; i++) {
      const a = Math.atan2(s * 1, 0.2) + s * (0.2 + i * 0.28), len = 380 - i * 50;
      g.push(limb([wrist, [wrist[0] + Math.cos(a - s * 0.9) * len * 0.5, wrist[1] + Math.sin(a - s * 0.9) * len * 0.5, 10], [wrist[0] + Math.cos(a - s * 1.2) * len, wrist[1] + Math.sin(a - s * 1.2) * len, 3]], 6, 2, B, { seg: 5, maxRings: 5 }));
    }
  }
  // a leg's bones and a claw
  g.push(limb([[300, -120, 40], [360, -260, 20], [330, -360, 6]], 11, 7, O, { seg: 6, maxRings: 4 }));
  for (let i = 0; i < 3; i++) g.push(limb([[330, -360, 6], [300 + i * 20, -410, 12], [290 + i * 26, -440, 2]], 4, 1.2, B, { seg: 5, maxRings: 3 }));
  // snow drifted over its hind half and against the ribs
  g.push(mound(520, 300, 60, 3301, [560, 60, 0], 20), mound(360, 220, 44, 3302, [180, -180, 0], -10), mound(300, 200, 36, 3303, [-200, 240, 0], 30), mound(260, 160, 30, 3304, [-700, -200, 0], 0));
  return merge(...g);
}

// A heap of treasure the dragon let fall (2.4 m across): a drift of coin, a chest burst open, a
// goblet, a sword stuck in, a shield, gems.
function treasurePile(): Geo {
  const rnd = seeded(3311), g: Geo[] = [lump([0, 0, 0], [110, 90, 42], 3312, "Skypeaks_Coins", 2, 0.12, 40), translate(rotateZ(chest(true), 30), [70, 60, 6])];
  for (let k = 0; k < 24; k++) {
    const a = rnd() * Math.PI * 2, d = 90 + rnd() * 70;
    g.push(translate(rotateY(cylinderAt({ radius: 7, height: 1.6, segments: 8, bottom: [0, 0, 0] }, "Skypeaks_Coins"), (rnd() - 0.5) * 30), [Math.cos(a) * d, Math.sin(a) * d, 1]));
  }
  g.push(goblet([-60, -40, 24]), translate(rotateY(sword(), 18), [-10, 20, 20]), translate(rotateZ(shield(), 250), [-110, 50, 0]));
  for (let k = 0; k < 6; k++) g.push(sphereCenter(5, [(rnd() - 0.5) * 120, (rnd() - 0.5) * 100, 30 + rnd() * 12], k % 2 ? "Skypeaks_Ruby" : "Skypeaks_Sapphire", 5));
  return merge(...g, mound(220, 120, 18, 3313, [40, -90, 0], 0));
}

// A bank of the cloud sea (15 x 10 m, 3 m high): soft heaps of cloud, flat beneath.
function cloudBank(): Geo {
  const rnd = seeded(3321), g: Geo[] = [];
  for (let k = 0; k < 13; k++) {
    const x = (rnd() - 0.5) * 1100, y = (rnd() - 0.5) * 650, f = 1 - Math.hypot(x / 700, y / 450) * 0.5;
    g.push(lump([x, y, 0], [(220 + rnd() * 200) * f, (180 + rnd() * 150) * f, (110 + rnd() * 160) * f], 3322 + k, k % 4 ? "Skypeaks_Cloud" : "Skypeaks_CloudShade", 1, 0.12, 200));
  }
  return merge(...g);
}
// A thin drift of mist (9 m), see-through, lying low.
function cloudWisp(): Geo {
  const rnd = seeded(3341), g: Geo[] = [];
  for (let k = 0; k < 6; k++) g.push(lump([(k - 2.5) * 150 + (rnd() - 0.5) * 60, (rnd() - 0.5) * 160, 0], [200 + rnd() * 80, 140 + rnd() * 60, 50 + rnd() * 40], 3342 + k, "Skypeaks_Mist", 1, 0.12, 200));
  return merge(...g);
}

// ================================================================== the aurora field

// The astronomer's observatory, fallen into ruin (10 m across, 12 m to its dome's highest rib):
// a round tower of dressed stone, whole at the back (+X) and broken down at the front, its door
// and its windows framed in pale stone; the dome's copper ribs standing over the whole side, a
// few panels still on them; the great brass telescope still on its pier inside, pointing out
// through the break at the sky; fallen blocks, snow inside and round it.
export const OBSERVATORY_SOLIDS: SolidSpec[] = [{ kind: "tower", x: 0, y: 0, r: 410 }];
function observatoryRuin(): Geo {
  const rnd = seeded(3351), W = "Skypeaks_StoneWorn", S = "Skypeaks_Stone", D = "Skypeaks_StoneDark", g: Geo[] = [];
  const R = 345, N = 22, T = 72;
  // the wall's height round it: whole over the back two thirds, broken down toward the front
  const height = (a: number) => {
    const t = Math.min(1, Math.max(0, ((Math.cos(a) + 1) / 2 + (Math.sin(a) > 0 ? 0.15 : 0) - 0.15) / 0.55));
    return 250 + 610 * t * t * (3 - 2 * t);
  };
  g.push(reuv(cylinderAt({ radius: R + 50, height: 30, segments: 28, bottom: [0, 0, 0] }, D)));
  g.push(reuv(cylinderAt({ radius: R - 10, height: 6, segments: 28, bottom: [0, 0, 26] }, "Skypeaks_Paving")));
  for (let k = 0; k < N; k++) {
    const a = ((k + 0.5) / N) * Math.PI * 2, door = Math.abs(Math.cos(a) + 1) < 0.06 && Math.abs(Math.sin(a)) < 0.2;
    const h = height(a) + (height(a) < 820 ? (rnd() - 0.5) * 120 : 0), w = (2 * Math.PI * R) / N + 8;
    const seg = (z0: number, z1: number, mat = W) => translate(rotateZ(sboxAt([T, w, z1 - z0], [0, 0, z0], mat, 2), a / RAD), [Math.cos(a) * R, Math.sin(a) * R, 0]);
    if (door) {
      g.push(seg(270, h));
      continue;
    }
    g.push(seg(30, h));
    for (const z of [300, 600]) if (h > z + 30) g.push(translate(rotateZ(sboxAt([T + 14, w, 18], [0, 0, z], S, 2), a / RAD), [Math.cos(a) * R, Math.sin(a) * R, 0]));
    // a window in every third piece where the wall still stands high enough
    if (k % 3 === 1 && h > 560) {
      const wz = 380;
      g.push(translate(rotateZ(merge(sboxAt([4, 46, 120], [-T / 2 - 1, 0, wz], "Skypeaks_Dark"), sboxAt([8, 66, 12], [-T / 2 - 2, 0, wz - 12], S, 2), sboxAt([8, 12, 132], [-T / 2 - 2, -29, wz - 12], S, 2), sboxAt([8, 12, 132], [-T / 2 - 2, 29, wz - 12], S, 2), cylinderBetween([-T / 2 - 2, 0, wz + 120], [-T / 2 - 6, 0, wz + 120], 30, 10, S)), a / RAD + 180), [Math.cos(a) * R, Math.sin(a) * R, 0]));
    }
  }
  // the door at -X: jambs, a lintel, the arch over it, a step
  g.push(sboxAt([T + 20, 26, 240], [-R, -70, 30], S, 3), sboxAt([T + 20, 26, 240], [-R, 70, 30], S, 3), sboxAt([T + 26, 170, 30], [-R, 0, 270], S, 3), sboxAt([60, 160, 16], [-R - 70, 0, 0], W, 3));
  // a ring of corbels inside under where the floor of the dome room was
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    if (height(a) > 640) g.push(translate(rotateZ(sboxAt([40, 30, 24], [-T / 2 - 18, 0, 600], S, 2), a / RAD + 180), [Math.cos(a) * R, Math.sin(a) * R, 0]));
  }
  // the dome's ribs over the whole side, panels still on two bays
  const top = 860, ribs = 10, Rd = R + 6;
  const ribPts = (a: number, upto = 1): V3[] => Array.from({ length: 7 }, (_, i) => {
    const t = (i / 6) * upto * (Math.PI / 2);
    return [Math.cos(a) * Rd * Math.cos(t), Math.sin(a) * Rd * Math.cos(t), top + Rd * 0.9 * Math.sin(t)] as V3;
  });
  for (let k = 0; k < ribs; k++) {
    const a = -Math.PI * 0.36 + (k / (ribs - 1)) * Math.PI * 0.72;
    g.push(limb(ribPts(a, k % 4 === 2 ? 0.55 : 0.94), 7, 6, "Skypeaks_Copper", { seg: 5, maxRings: 7 }));
  }
  g.push(geoOf(new THREE.TorusGeometry(Rd, 6, 5, 24, Math.PI * 0.8).rotateZ(-Math.PI * 0.4).translate(0, 0, top).toNonIndexed(), "Skypeaks_Copper", false));
  for (const [a0, a1] of [[-0.28, -0.1], [0.05, 0.24]]) {
    const rows: V3[][] = [];
    for (let i = 0; i <= 4; i++) {
      const t = (i / 4) * 0.6 * (Math.PI / 2);
      rows.push([0, 1, 2, 3].map((j) => {
        const a = (a0 + ((a1 - a0) * j) / 3) * Math.PI;
        return [Math.cos(a) * Rd * Math.cos(t), Math.sin(a) * Rd * Math.cos(t), top + Rd * 0.9 * Math.sin(t)] as V3;
      }));
    }
    g.push(sheet(rows, "Skypeaks_Copper"));
  }
  // the telescope on its pier, pointing out through the break
  g.push(reuv(cylinderAt({ rBot: 60, rTop: 48, height: 360, segments: 10, bottom: [60, 0, 30] }, D)), sboxAt([110, 110, 20], [60, 0, 390], S, 3));
  g.push(cylinderBetween([60, -40, 410], [60, -40, 470], 6, 6, "Skypeaks_Brass"), cylinderBetween([60, 40, 410], [60, 40, 470], 6, 6, "Skypeaks_Brass"));
  const e: V3 = [180, 10, 400], o: V3 = [-330, -60, 720];
  g.push(cylinderBetween(e, o, 34, 14, "Skypeaks_Brass", 46));
  for (const t of [0.15, 0.5, 0.85]) g.push(cylinderBetween([e[0] + (o[0] - e[0]) * t, e[1] + (o[1] - e[1]) * t, e[2] + (o[2] - e[2]) * t], [e[0] + (o[0] - e[0]) * (t + 0.03), e[1] + (o[1] - e[1]) * (t + 0.03), e[2] + (o[2] - e[2]) * (t + 0.03)], 40 + t * 12, 14, "Skypeaks_Gold"));
  g.push(cylinderBetween(o, [o[0] - 24, o[1] - 3, o[2] + 15], 47, 14, "Skypeaks_Lens"), cylinderBetween(e, [e[0] + 40, e[1] + 2, e[2] - 25], 10, 8, "Skypeaks_Brass"));
  // fallen blocks spilt out of the break, snow inside and round it
  for (let k = 0; k < 30; k++) {
    const a = Math.PI + (rnd() - 0.5) * 2.2, d = R + 60 + rnd() * 380;
    g.push(block([50 + rnd() * 40, 40 + rnd() * 30, 30 + rnd() * 20], [Math.cos(a) * d, Math.sin(a) * d, 12], rnd() * 360, rnd() < 0.7 ? W : D, 3, (rnd() - 0.5) * 30));
  }
  const walls = merge(...g);
  return merge(walls, snowOn(walls.filter((p) => p.mat === W || p.mat === S || p.mat === D), 0.4, 6, 3352), mound(400, 260, 50, 3353, [80, 80, 30], 20), mound(320, 200, 36, 3354, [-560, 300, 0], 40), mound(360, 220, 40, 3355, [300, -440, 0], -20), mound(300, 180, 30, 3356, [-200, -480, 0], 0));
}

// An armillary sphere of brass on a stone pedestal (3.9 m): the meridian ring, the horizon ring
// on its four legs, the equator's and the ecliptic's rings, the polar axis through a small blue
// globe; one ring has fallen and lies in the snow.
function armillary(): Geo {
  const S = "Skypeaks_Stone", W = "Skypeaks_StoneWorn", Bz = "Skypeaks_Brass", g: Geo[] = [];
  g.push(sboxAt([130, 130, 22], [0, 0, 0], W, 4), sboxAt([84, 84, 112], [0, 0, 22], S, 4), sboxAt([104, 104, 16], [0, 0, 134], W, 3));
  for (let k = 0; k < 4; k++) g.push(rotateZ(sboxAt([3, 54, 70], [-43.5, 0, 42], "Skypeaks_Carving"), k * 90));
  const c: V3 = [0, 0, 280];
  const ring = (r: number, tube: number, ax: number, ay: number, az = 0) => torus(r, tube, 40, 5, Bz).map((p) => ({ geo: p.geo.clone().rotateX(ax * RAD).rotateY(ay * RAD).rotateZ(az * RAD).translate(...c), mat: p.mat }));
  g.push(ring(118, 4, 90, 0, 0), ring(128, 4.5, 0, 0, 0), ring(108, 3.5, 0, 33, 0), ring(104, 3, 0, 33 + 23.4, 30));
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    g.push(cylinderBetween([Math.cos(a) * 46, Math.sin(a) * 46, 150], [Math.cos(a) * 125, Math.sin(a) * 125, 280], 4, 6, Bz));
  }
  g.push(cylinderBetween([Math.sin(-33 * RAD) * 150, 0, 280 + Math.cos(-33 * RAD) * 150], [-Math.sin(-33 * RAD) * 150, 0, 280 - Math.cos(-33 * RAD) * 150], 2.5, 6, Bz));
  g.push(sphereCenter(26, c, "Skypeaks_Globe", 12), sphereCenter(7, [Math.sin(-33 * RAD) * 154, 0, 280 + Math.cos(-33 * RAD) * 154], "Skypeaks_Gold", 6));
  // the fallen ring
  const fallen = new THREE.TorusGeometry(98, 3, 5, 30, Math.PI * 1.3);
  g.push(translate(rotateX(geoOf(fallen.toNonIndexed(), Bz, false), 78), [150, 120, 20]));
  const body = merge(...g);
  return merge(body, snowOn(body.filter((p) => p.mat === S || p.mat === W), 0.4, 4, 3361), mound(220, 150, 22, 3362, [60, 100, 0], 30));
}

// A tablet of the stars (2.2 m): a slab of dark stone leaning back on its base, the
// constellations carved in it, their stars set in glowing studs, joined by lines of gold.
function starTablet(): Geo {
  const rnd = seeded(3371), g: Geo[] = [];
  g.push(sboxAt([90, 230, 36], [0, 0, 0], "Skypeaks_StoneWorn", 4));
  const face: Geo[] = [sboxAt([26, 210, 150], [0, 0, 0], "Skypeaks_StoneDark", 4)];
  for (let c = 0; c < 4; c++) {
    const cy = -70 + c * 46 + (rnd() - 0.5) * 20, cz = 30 + rnd() * 90, n = 3 + Math.floor(rnd() * 3), pts: V3[] = [];
    for (let i = 0; i < n; i++) pts.push([-14, cy + (rnd() - 0.5) * 60, Math.max(14, Math.min(136, cz + (rnd() - 0.5) * 70))]);
    for (let i = 1; i < n; i++) face.push(beamBetween(pts[i - 1], pts[i], 1.5, 1.2, "Skypeaks_Gold"));
    for (const p of pts) face.push(sphereCenter(3.2 + rnd() * 2, p, "Skypeaks_Star", 5));
  }
  face.push(torus(40, 1.2, 24, 3, "Skypeaks_Gold").map((p) => ({ geo: p.geo.clone().rotateY(Math.PI / 2).translate(-14, 70, 104), mat: p.mat })));
  g.push(translate(rotateY(merge(...face), -16), [6, 0, 36]));
  const body = merge(...g);
  return merge(body, snowOn(body, 0.35, 3, 3372), mound(200, 120, 18, 3373, [40, 60, 0], 10));
}

// Pipes of ice the wind whistles in (2.6 m across, to 3.8 m): hollow columns of clear ice at
// a lean, dark holes in their tops and sides where the wind gets in, a drift round their feet.
function icePipe(r: number, h: number, mat: string, seed: number): Geo {
  const rnd = seeded(seed), g: Geo[] = [cylinderAt({ rBot: r * 1.08, rTop: r * 0.86, height: h, segments: 10, bottom: [0, 0, 0] }, mat)];
  g.push(cylinderAt({ radius: r * 0.6, height: 2, segments: 10, bottom: [0, 0, h - 1] }, "Skypeaks_IceHole"));
  for (let i = 0; i < 2 + Math.floor(rnd() * 2); i++) {
    const a = rnd() * Math.PI * 2, z = h * (0.3 + rnd() * 0.55), rr = r * (1.08 - 0.22 * (z / h));
    g.push(translate(rotateZ(scale(sphereCenter(1, [0, 0, 0], "Skypeaks_IceHole", 6), [2, r * 0.22, r * 0.34]), a / RAD), [Math.cos(a) * rr, Math.sin(a) * rr, z]));
  }
  g.push(cylinderAt({ radius: r * 1.02, height: 4, segments: 10, bottom: [0, 0, h * 0.4] }, "Skypeaks_IceDeep"));
  return merge(...g);
}
function singingIce(): Geo {
  const rnd = seeded(3381), g: Geo[] = [];
  for (let k = 0; k < 9; k++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 110, h = 110 + rnd() * 270, r = 14 + rnd() * 20;
    g.push(translate(rotateY(rotateZ(icePipe(r, h, k % 4 ? "Skypeaks_Ice" : "Skypeaks_IceDeep", 3382 + k), rnd() * 360), (rnd() - 0.5) * 16), [Math.cos(a) * d, Math.sin(a) * d, -4]));
  }
  for (let k = 0; k < 6; k++) {
    const a = rnd() * Math.PI * 2, d = 90 + rnd() * 70;
    g.push(translate(rotateY(cone(8 + rnd() * 6, 30 + rnd() * 40, [0, 0, 0], "Skypeaks_Ice", 5), (rnd() - 0.5) * 50), [Math.cos(a) * d, Math.sin(a) * d, -2]));
  }
  return merge(...g, mound(260, 220, 40, 3399, [0, 0, 0], 0));
}
// The great ice organ (10 m across, 9.5 m tall): pipes of ice in a curve, the tallest in the
// middle, some touched green and violet by the aurora's light, on a heaved-up base of blue ice.
export const ORGAN_SOLIDS: SolidSpec[] = [{ kind: "crystal", x: 30, y: 0, r: 330 }, { kind: "crystal", x: 0, y: -360, r: 160 }, { kind: "crystal", x: 0, y: 360, r: 160 }];
function iceOrgan(): Geo {
  const rnd = seeded(3401), g: Geo[] = [lump([0, 0, 0], [380, 520, 90], 3402, "Skypeaks_IceDeep", 2, 0.14, 120)];
  const N = 17;
  for (let k = 0; k < N; k++) {
    const t = k / (N - 1), y = -480 + t * 960, x = 90 * Math.sin(t * Math.PI) - 20 + (k % 2) * 40, mid = Math.sin(t * Math.PI);
    const h = 240 + 700 * mid ** 1.5 * (0.85 + rnd() * 0.3), r = 20 + 40 * mid * (0.8 + rnd() * 0.4);
    const mat = k % 5 === 2 ? "Skypeaks_IceGreen" : k % 5 === 4 ? "Skypeaks_IceViolet" : k % 3 ? "Skypeaks_Ice" : "Skypeaks_IceDeep";
    g.push(translate(rotateY(icePipe(r, h, mat, 3410 + k), (rnd() - 0.5) * 8), [x, y, 40]));
  }
  for (let k = 0; k < 10; k++) {
    const y = (rnd() - 0.5) * 900, x = -150 - rnd() * 120;
    g.push(translate(icePipe(10 + rnd() * 12, 60 + rnd() * 120, "Skypeaks_Ice", 3430 + k), [x, y, 10]));
  }
  g.push(icicles([60, -300, 300], [60, 300, 300], 3440, 30, 80));
  return merge(...g, mound(420, 300, 50, 3441, [-200, -260, 0], 20), mound(380, 260, 46, 3442, [-180, 300, 0], -20), snowOn(g[0], 0.4, 6, 3443));
}

// ---- the aurora's light: unlit, coloured and see-through at each corner ----
let auroraMat: THREE.MeshBasicMaterial | null = null;
function auroraMaterial(): THREE.MeshBasicMaterial {
  return (auroraMat ??= new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
}
const GREEN = new THREE.Color("#46ffa6"), CYAN = new THREE.Color("#4fe8ff"), VIOLET = new THREE.Color("#b46cff");
// the aurora's colour at u (0 green .. 1 violet, through a little cyan)
function auroraColour(u: number, out = new THREE.Color()): THREE.Color {
  return u < 0.45 ? out.copy(GREEN).lerp(CYAN, u / 0.45 * 0.5) : out.copy(CYAN).lerp(GREEN, 0.5).lerp(VIOLET, (u - 0.45) / 0.55);
}
// A mesh of the aurora's light from a grid of points (Z up), each with its colour place u and
// how much it shows (alpha); in three.js's terms (Y up) for a scene or a kit item.
function auroraMesh(rows: { p: V3; u: number; a: number }[][]): THREE.Mesh {
  const nr = rows.length, nc = rows[0].length, pos: number[] = [], col: number[] = [], idx: number[] = [], c = new THREE.Color();
  for (const row of rows)
    for (const v of row) {
      pos.push(v.p[0], v.p[2], -v.p[1]);
      auroraColour(v.u, c);
      col.push(c.r, c.g, c.b, v.a);
    }
  for (let i = 0; i + 1 < nr; i++)
    for (let j = 0; j + 1 < nc; j++) {
      const a = i * nc + j;
      idx.push(a, a + 1, a + nc + 1, a, a + nc + 1, a + nc);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 4));
  geo.setIndex(idx);
  const m = new THREE.Mesh(geo, auroraMaterial());
  m.renderOrder = 2;
  return m;
}
type XY = [number, number];
// A streak of the aurora's light lying on the ground along a line (world cm), `width` across at
// its widest, tapering to nothing at both ends and fading at its sides, its colour running from
// green to violet along it; `h` the ground's height. For a field's scenery.
export function auroraRibbon(pts: XY[], width: number, h: (x: number, y: number) => number, o: { strength?: number; u0?: number; u1?: number; lift?: number } = {}): THREE.Mesh {
  const rows: { p: V3; u: number; a: number }[][] = [], k = o.strength ?? 0.42, n = pts.length;
  const across = [-1, -0.55, 0, 0.55, 1];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, t = i / (n - 1);
    const w = (width / 2) * Math.pow(Math.sin(Math.PI * t), 0.6) * (0.8 + 0.2 * Math.sin(t * 17));
    const u = (o.u0 ?? 0) + ((o.u1 ?? 1) - (o.u0 ?? 0)) * t;
    rows.push(across.map((s) => {
      const x = p[0] - ((b[1] - a[1]) / L) * s * w, y = p[1] + ((b[0] - a[0]) / L) * s * w;
      const fade = (1 - s * s) * Math.pow(Math.sin(Math.PI * t), 0.5) * (0.75 + 0.25 * Math.sin(t * 31 + s * 2));
      return { p: [x, y, h(x, y) + (o.lift ?? 4)] as V3, u: Math.min(1, Math.max(0, u + s * 0.12)), a: k * fade };
    }));
  });
  return auroraMesh(rows);
}
// A curtain of the aurora hanging in the air along a line (world cm), from `z0` over the ground
// up to `z0 + tall`: bright green along its hem, going violet and fading out up its height, rays
// running up it, faded at its ends. For a field's scenery or a kit item.
export function auroraCurtain(pts: XY[], tall: number, z0: number, h: (x: number, y: number) => number = () => 0, strength = 0.5): THREE.Mesh {
  const rows: { p: V3; u: number; a: number }[][] = [], NZ = 8, n = pts.length;
  for (let i = 0; i <= NZ; i++) {
    const v = i / NZ;
    rows.push(pts.map((p, j) => {
      const t = j / (n - 1), ends = Math.pow(Math.sin(Math.PI * t), 0.7), rays = 0.55 + 0.45 * Math.pow(Math.sin(t * 61 + Math.sin(t * 13) * 2), 2);
      const hem = 12 * Math.sin(t * 29) + 8 * Math.sin(t * 71);
      const a = strength * ends * rays * (v < 0.12 ? v / 0.12 : Math.pow(1 - (v - 0.12) / 0.88, 1.4));
      return { p: [p[0], p[1], h(p[0], p[1]) + z0 + hem * (1 - v) + v * tall] as V3, u: Math.min(1, v * 1.15), a };
    }));
  }
  return auroraMesh(rows);
}
// the kit's own: a streak 14 m long on flat ground, and a curtain 16 m long
function auroraStreak(): THREE.Object3D {
  const pts: XY[] = Array.from({ length: 40 }, (_, i) => {
    const x = -700 + (1400 * i) / 39;
    return [x, 110 * Math.sin(x / 260) + 40 * Math.sin(x / 90)] as XY;
  });
  const g = new THREE.Group();
  g.add(auroraRibbon(pts, 300, () => 0, { strength: 0.5 }));
  return g;
}
function auroraVeil(): THREE.Object3D {
  const pts: XY[] = Array.from({ length: 70 }, (_, i) => {
    const x = -800 + (1600 * i) / 69;
    return [x, 160 * Math.sin(x / 300) + 50 * Math.sin(x / 97)] as XY;
  });
  const g = new THREE.Group();
  g.add(auroraCurtain(pts, 900, 260));
  return g;
}

// ================================================================== the kit

function sample(put: Put): void {
  // the sea of clouds along -Y below the cliff path, the chain along its edge
  for (const [x, y, h, s] of [[-1400, -2900, 0, 1], [600, -3100, 70, 1.2], [1900, -2700, 140, 0.8], [-200, -2500, 30, 0.6]]) put("cloud_bank", [x, y, -12], h, s);
  for (let k = 0; k < 7; k++) put("cliff_rail", [-1200 + k * 400, -1850, 0], 90);
  put("cloud_wisp", [1500, -1500, 20], 20, 0.8);
  // the ridge road: the mountain gate, the shelter, the boundary pillar
  put("ridge_gate", [-1700, -900, 0], 0, 0.9);
  put("rest_pavilion", [-1500, 900, 0], 90);
  put("boundary_pillar", [-300, -700, 0], 0);
  put("peak_boulder", [-2000, 1900, 0], 30);
  put("frost_tor", [-500, 1900, 0], 0, 0.9);
  put("crag_cluster", [200, 500, 0], 120);
  put("snow_cornice", [-2000, -1700, 0], 0, 0.9);
  put("roc_nest", [1400, 1900, 0], 30, 0.7);
  // the summit: the dais in its ring of stones, the struck pillar, the bones, the hoard
  put("coronation_dais", [900, -300, 0], 0, 0.6);
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + 0.4;
    if (Math.cos(a) < -0.6) continue;
    put("ring_stone", [900 + Math.cos(a) * 640, -300 + Math.sin(a) * 640, 0], (a * 180) / Math.PI + 180, 0.6);
  }
  put("ring_trilithon", [260, -300, 0], 0, 0.6);
  put("struck_pillar", [2000, -400, 0], 40, 0.8);
  put("dragon_skeleton", [1700, 700, 0], 160, 0.5);
  put("treasure_pile", [2000, 1200, 0], 30);
  // the far north: the observatory, the armillary and the tablet, the singing ice, the aurora
  put("observatory_ruin", [-200, 1300, 0], 200, 0.55);
  put("armillary", [300, 1500, 0], 0, 0.8);
  put("star_tablet", [-800, 1200, 0], 20, 0.8);
  put("singing_ice", [500, 2000, 0], 0);
  put("ice_organ", [2000, 100, 0], 180, 0.5);
  put("aurora_streak", [-600, 300, 0], 20);
  put("aurora_veil", [400, 700, 0], 10, 0.8);
  for (const [x, y, s] of [[-2050, 400, 0.8], [-900, 2050, 0.7], [2100, 2050, 0.75], [-2000, -300, 0.6]]) put("flora:SnowPineSmall", [x, y, 0], x, s);
}

export const KIT: Kit = {
  id: "skypeaks",
  name: "ยอดเขาฟ้าและแสงเหนือ",
  region: "ยอดเทือกเขาหลวงและสุดขอบเหนือ",
  desc: "สันเขาคมกับหินผาและสันหิมะลมปั้น ศาลาพักทางขึ้นเขา เสาหินหลักเขตอาณาจักร สะพานหินข้ามเหว รังนกรอค ยอดเขามังกรฟ้ากับแท่นพิธีราชาภิเษกในวงหินตั้ง เสาหินถูกฟ้าผ่า รังมังกรกับกองสมบัติ ทะเลเมฆ และทุ่งแสงเหนือที่มีซากหอดูดาว แท่งน้ำแข็งร้องเพลง กับริ้วแสงเหนือบนหิมะ",
  ground: "snow",
  sea: true,
  items: [
    { id: "peak_boulder", name: "หินผาคลุมหิมะ", make: peakBoulder, tags: ["decor"] },
    { id: "crag_cluster", name: "กองหินผาแตก", make: cragCluster, tags: ["decor"] },
    { id: "frost_tor", name: "ชะง่อนหินซ้อน", make: frostTor, tags: ["decor", "landmark"] },
    { id: "snow_cornice", name: "สันหิมะลมปั้น", make: snowCornice, tags: ["ground"] },
    { id: "rest_pavilion", name: "ศาลาพักทางขึ้นเขา", make: restPavilion, tags: ["building", "landmark"] },
    { id: "boundary_pillar", name: "เสาหินหลักเขตอาณาจักร", make: boundaryPillar, tags: ["landmark"] },
    { id: "chasm_bridge", name: "สะพานหินข้ามเหว (15 ม.)", make: chasmBridge, tags: ["bridge", "landmark"] },
    { id: "ridge_gate", name: "ซุ้มประตูหินสันเขา", make: ridgeGate, tags: ["gate", "landmark"] },
    { id: "cliff_rail", name: "ราวโซ่เลียบหน้าผา (4 ม.)", make: cliffRail, tags: ["fence"] },
    { id: "roc_nest", name: "รังนกรอคยักษ์", make: rocNest, tags: ["landmark", "decor"] },
    { id: "coronation_dais", name: "แท่นพิธีราชาภิเษก", make: coronationDais, tags: ["landmark", "magic"] },
    { id: "ring_stone", name: "หินตั้งวงพิธี", make: ringStone, tags: ["decor", "magic"] },
    { id: "ring_trilithon", name: "ซุ้มหินตั้งประตูวงพิธี", make: trilithon, tags: ["gate", "magic"] },
    { id: "struck_pillar", name: "เสาหินถูกฟ้าผ่า", make: struckPillar, tags: ["decor", "magic"] },
    { id: "dragon_nest", name: "รังมังกรกับกองสมบัติ", make: dragonNest, tags: ["landmark"] },
    { id: "dragon_skeleton", name: "โครงกระดูกมังกร", make: dragonSkeleton, tags: ["decor", "landmark"] },
    { id: "treasure_pile", name: "กองสมบัติระยิบ", make: treasurePile, tags: ["decor"] },
    { id: "cloud_bank", name: "ทะเลเมฆ", make: cloudBank, tags: ["ground", "decor"] },
    { id: "cloud_wisp", name: "เมฆหมอกบาง", make: cloudWisp, tags: ["ground", "decor"] },
    { id: "observatory_ruin", name: "ซากหอดูดาว", make: observatoryRuin, tags: ["landmark", "building"] },
    { id: "armillary", name: "ทรงกลมดาราศาสตร์", make: armillary, tags: ["decor", "magic"] },
    { id: "star_tablet", name: "แผ่นศิลาแผนที่ดาว", make: starTablet, tags: ["decor"] },
    { id: "singing_ice", name: "แท่งน้ำแข็งร้องเพลง", make: singingIce, tags: ["decor"] },
    { id: "ice_organ", name: "ดงแท่งน้ำแข็งยักษ์ร้องเพลง", make: iceOrgan, tags: ["landmark"] },
    { id: "aurora_streak", name: "ริ้วแสงเหนือบนหิมะ", make: auroraStreak, tags: ["ground", "magic"] },
    { id: "aurora_veil", name: "ม่านแสงเหนือ", make: auroraVeil, tags: ["magic"] },
  ],
  sample,
};
