// ชายแดนตะวันออก (the eastern frontier): the fields round Kradia, the fortress city that holds
// the demons back. Three lands in one kit:
//   - the border woods: red-leaved forest (crimson maples, red bushes, fallen leaves), mossy
//     boulders, fallen logs, and the patrol outposts of Kradia's army (palisades, a gate, a
//     watchtower, tents, a campfire, signposts);
//   - the old battlefield: wrecked catapults, rows of stakes, a ruined stone tower, rubble,
//     scorched ground, swords and broken shields left where they fell;
//   - the demon lands past it: dark glowing crystals, twisted dead trees, the bones of great
//     beasts, glowing cracks in the earth, and the demon gate itself.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, front towards -X.
// The palisade is 400 cm long along Y and tiles end to end; the stake row too.
// Items that are trees (red_maple, red_bush, dead_tree) should be placed with a trunk solid of
// their own (the automatic box covers the whole crown); the outpost gate with a post solid either
// side of its 400 cm passage (posts at y = +-250).

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, cylinderCenter, sphereCenter, torus, gableWall, rock,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial, leafClump } from "../textures";
import type { LeafPalette } from "../textures";
import { leafMaterials, shrub, crownTreeObject, CANOPY } from "../trees";
import type { ShrubLook } from "../trees";
import { fallenTrunk, stumpOf, snag, coverTop, endGrain } from "../nature";
import { solid } from "./types";
import type { Kit, Put } from "./types";

defineMaterial("Frontier_Rock", { map: "crag", tint: "#948a7c", bump: 3 });
defineMaterial("Frontier_RockMoss", { map: "crag", tint: "#7d8763", bump: 3 });
defineMaterial("Frontier_Moss", { map: "felt", tint: "#5f7a3a", rough: 1 });
defineMaterial("Frontier_Obsidian", { map: "crag", tint: "#3b3046", rough: 0.55, bump: 3 });
defineMaterial("Frontier_Earth", { map: "adobe", tint: "#6f5a45", bump: 1.5 });
defineMaterial("Frontier_Log", { map: "bark", tint: "#6d4c35", bump: 3 });
defineMaterial("Frontier_Charred", { map: "bark", tint: "#342d29", bump: 2 });
defineMaterial("Frontier_DeadBark", { map: "bark", tint: "#3d3239", bump: 3 });
defineMaterial("Frontier_Bone", { map: "marble", tint: "#ddd2b6", rough: 0.75 });
defineMaterial("Frontier_Canvas", { map: "fabric", tint: "#dcd0b2", rough: 0.95 });
defineMaterial("Frontier_Purple", { map: "fabric", tint: "#5d3684", rough: 0.9 });
defineMaterial("Frontier_Shadow", { tint: "#1b1519", rough: 1 });
defineMaterial("Frontier_Ash", { map: "felt", tint: "#221e1c", rough: 1 });
defineMaterial("Frontier_Soot", { map: "felt", tint: "#3c3632", rough: 1 });
defineMaterial("Frontier_Ember", { tint: "#ff8a3a", rough: 1, glow: "#ff4a12", glowI: 1.8 });
defineMaterial("Frontier_Flame", { tint: "#ffb04a", rough: 1, glow: "#ff6a1a", glowI: 2 });
defineMaterial("Frontier_DryGrass", { map: "felt", tint: "#b49c5e", rough: 1 });
defineMaterial("Frontier_RustGrass", { map: "felt", tint: "#a05c35", rough: 1 });
defineMaterial("Frontier_DarkCrystal", { tint: "#4b2672", rough: 0.15, glow: "#6a1cc0", glowI: 0.9, opacity: 0.94 });
defineMaterial("Frontier_CrystalCore", { tint: "#e98cff", rough: 0.2, glow: "#c42cff", glowI: 1.8 });
defineMaterial("Frontier_Abyss", { tint: "#7c2ad6", rough: 0.6, glow: "#8a14f0", glowI: 1.25 });
defineMaterial("Frontier_Vortex", { tint: "#6c2aa8", rough: 0.3, glow: "#7b2cff", glowI: 1.5, opacity: 0.92 });
defineMaterial("Frontier_Hellfire", { tint: "#e88bff", rough: 1, glow: "#b62cff", glowI: 2.2 });
defineMaterial("Frontier_Blight", { map: "felt", tint: "#2a2131", rough: 1 });
defineMaterial("Frontier_BlightEdge", { map: "felt", tint: "#43354a", rough: 1 });
defineMaterial("Frontier_Rust", { map: "metal", tint: "#6e4a36", rough: 0.7, metal: 0.3 });
// cliff faces for the fields: earthworks of the battle lines, the demon lands' black rock
defineMaterial("Frontier_CliffEarth", { map: "crag", tint: "#8c7259", bump: 4 });
defineMaterial("Frontier_CliffDark", { map: "crag", tint: "#4a3d54", bump: 4 });
// the floor of a chasm, far below: dark, glowing faintly (its bright seam is Frontier_Abyss)
defineMaterial("Frontier_AbyssDeep", { tint: "#2c0e40", rough: 0.8, glow: "#4a0e96", glowI: 0.9 });

const DEG = 180 / Math.PI;
const TAU = Math.PI * 2;

// ---- helpers ----

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

// Flat shading (each triangle its own normal): crisp crystal facets.
function facet(g: Geo): Geo {
  return g.map((p) => {
    const geo = p.geo.clone();
    geo.computeVertexNormals();
    return { geo, mat: p.mat };
  });
}

// A disc in the plane x = c[0] (axis along X): shields, a portal.
const disk = (r: number, t: number, c: V3, mat: string, seg = 16): Geo => translate(rotateY(cylinderCenter(r, t, seg, [0, 0, 0], mat), 90), c);
// A ring standing in the plane x = c[0].
const ringX = (r: number, tube: number, c: V3, mat: string, seg = 24): Geo => translate(rotateY(torus(r, tube, seg, 6, mat), 90), c);

// A six-sided crystal standing on `bottom`: a short point, the prism, a long point.
function crystal(r: number, h: number, bottom: V3, mat = "Frontier_DarkCrystal", seg = 6): Geo {
  const [x, y, z] = bottom, lo = h * 0.22, mid = h * 0.42;
  return facet(merge(
    cylinderAt({ rBot: 0.5, rTop: r, height: lo, segments: seg, bottom: [x, y, z] }, mat),
    cylinderAt({ rBot: r, rTop: r * 0.92, height: mid, segments: seg, bottom: [x, y, z + lo] }, mat),
    cylinderAt({ rBot: r * 0.92, rTop: 0.5, height: h - lo - mid, segments: seg, bottom: [x, y, z + lo + mid] }, mat),
  ));
}
// A crystal tilted about its foot (tilt away from the axis, then turned about Z), set at `at`.
const shard = (r: number, h: number, at: V3, tilt: number, turn: number, mat = "Frontier_DarkCrystal"): Geo =>
  translate(rotateZ(rotateY(crystal(r, h, [0, 0, -h * 0.12], mat), tilt), turn), at);

// A cone (a spike, a flame, a sharpened tip) from `base` along `dir`, `len` long.
const spike = (base: V3, dir: V3, len: number, r: number, mat: string, seg = 6): Geo =>
  cylinderBetween(base, add(base, mul(norm(dir), len)), r, seg, mat, 0.4);

// A bent limb through points, its radius running from r0 to r1, knuckles at the bends.
function limb(pts: V3[], r0: number, r1: number, mat: string, seg = 7, knuckles = true): Geo {
  const out: Geo[] = [];
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const ra = r0 + (r1 - r0) * (i / n), rb = r0 + (r1 - r0) * ((i + 1) / n);
    out.push(cylinderBetween(pts[i], pts[i + 1], ra, seg, mat, rb));
    if (knuckles && i > 0) out.push(sphereCenter(ra * 1.02, pts[i], mat, seg));
  }
  return merge(...out);
}

// A flat surface from triangles (x y z flattened), texture in metres over x, y; `twoSided`
// adds the back faces (thin cloth seen from both sides).
function tris(pos: number[], mat: string, twoSided = false): Geo {
  const all = [...pos];
  if (twoSided) for (let i = 0; i < pos.length; i += 9) all.push(pos[i], pos[i + 1], pos[i + 2], pos[i + 6], pos[i + 7], pos[i + 8], pos[i + 3], pos[i + 4], pos[i + 5]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(all, 3));
  geo.computeVertexNormals();
  const uv: number[] = [];
  for (let i = 0; i < all.length; i += 3) uv.push((all[i] + all[i + 1] * 0.3) / 100, (all[i + 2] + all[i + 1] * 0.7) / 100);
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return [{ geo, mat }];
}

// An irregular flat patch lying at height z (ground decals: scorch, blight), its rim jittered.
function blob(r: number, jit: number, seed: number, z: number, mat: string, o: { n?: number; sx?: number; sy?: number; at?: [number, number] } = {}): Geo {
  const rr = seeded(seed), n = o.n ?? 22, sx = o.sx ?? 1, sy = o.sy ?? 1, [cx, cy] = o.at ?? [0, 0];
  const k0 = Array.from({ length: n }, () => 1 + (rr() - 0.5) * jit);
  const k = k0.map((v, i) => (k0[(i + n - 1) % n] + 2 * v + k0[(i + 1) % n]) / 4);
  const rim = k.map((f, i): [number, number] => [cx + Math.cos((i / n) * TAU) * r * f * sx, cy + Math.sin((i / n) * TAU) * r * f * sy]);
  const pos: number[] = [];
  for (let i = 0; i < n; i++) {
    const [ax, ay] = rim[i], [bx, by] = rim[(i + 1) % n];
    pos.push(cx, cy, z, ax, ay, z, bx, by, z);
  }
  return tris(pos, mat);
}

// A ribbon between two edges (lists of points, the left edge on the left of the way along).
function ribbon(left: V3[], right: V3[], mat: string): Geo {
  const pos: number[] = [];
  for (let i = 0; i + 1 < left.length; i++) {
    const [a, b, c, d] = [right[i], right[i + 1], left[i + 1], left[i]];
    pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  }
  return tris(pos, mat);
}

// ---- small pieces used by the bigger ones ----

function sword(len = 90): Geo {
  return merge(
    scale(cylinderAt({ rBot: 0.5, rTop: 4, height: 10, segments: 4, bottom: [0, 0, 0] }, "IronLight"), [0.3, 0.9, 1]),
    boxAt([2, 7, len], [0, 0, 10], "IronLight"),
    boxAt([5, 30, 5], [0, 0, 10 + len], "IronDark", 1),
    cylinderAt({ radius: 2.5, height: 18, segments: 6, bottom: [0, 0, 15 + len] }, "WoodDark"),
    sphereCenter(4, [0, 0, 35 + len], "IronDark", 6),
  );
}
function spear(len = 230, broken = false): Geo {
  return merge(
    cylinderAt({ radius: 2.5, height: len, segments: 6, bottom: [0, 0, 0] }, "WoodPale"),
    broken ? [] : facet(cylinderAt({ rBot: 5, rTop: 0.5, height: 30, segments: 4, bottom: [0, 0, len] }, "IronLight")),
  );
}
// A round shield facing -X: painted face, iron rim and boss.
function roundShield(r: number, c: V3, face = "Frontier_Purple"): Geo {
  return merge(
    disk(r, 5, c, face, 14),
    ringX(r, 2.6, c, "IronDark", 16),
    sphereCenter(r * 0.22, [c[0] - 3, c[1], c[2]], "IronLight", 8),
  );
}
// A banner of Kradia's purple hanging from `top` on the plane x = top[0], ragged at the foot.
function banner(w: number, h: number, top: V3, torn = 0): Geo {
  const [x, y, z] = top, rr = seeded(Math.round(w + h + torn * 7));
  const strips: Geo[] = [];
  const n = 4;
  for (let i = 0; i < n; i++) {
    const sw = w / n, yy = y - w / 2 + sw * (i + 0.5), hh = h * (1 - torn * (0.15 + rr() * 0.4));
    strips.push(boxAt([3, sw + 0.5, hh], [x, yy, z - hh], "Frontier_Purple"));
  }
  return merge(
    ...strips,
    boxAt([4, 6, h * 0.8], [x - 0.6, y - w / 2 + 6, z - h * 0.8], "GoldTrim"),
    boxAt([4, 6, h * 0.8], [x - 0.6, y + w / 2 - 6, z - h * 0.8], "GoldTrim"),
    boxAt([4, w, 6], [x - 0.6, y, z - 22], "GoldTrim"),
    translate(rotateX(box([5, w * 0.3, w * 0.3], [0, 0, 0], "GoldTrim"), 45), [x - 0.8, y, z - h * 0.42]),
    translate(rotateX(box([6, w * 0.16, w * 0.16], [0, 0, 0], "Kradia_Rune"), 45), [x - 1.6, y, z - h * 0.42]),
    cylinderBetween([x, y - w / 2 - 10, z + 3], [x, y + w / 2 + 10, z + 3], 3, 6, "WoodDark"),
  );
}
// Flames: a few cones standing on `at`.
function flames(at: V3, size: number, mat = "Frontier_Flame", core = "Frontier_Ember"): Geo {
  const f = (r: number, h: number, dx: number, dy: number, tilt: number, turn: number, m: string) =>
    translate(rotateZ(rotateY(facet(cylinderAt({ rBot: r, rTop: 0.5, height: h, segments: 7, bottom: [0, 0, 0] }, m)), tilt), turn), [at[0] + dx, at[1] + dy, at[2]]);
  const s = size;
  return merge(
    f(0.42 * s, 1.0 * s, 0, 0, 0, 0, mat),
    f(0.26 * s, 0.7 * s, 0.22 * s, 0.1 * s, 16, 20, mat),
    f(0.24 * s, 0.62 * s, -0.2 * s, -0.16 * s, 18, 210, mat),
    f(0.2 * s, 0.55 * s, -0.06 * s, 0.24 * s, 14, 120, core),
    f(0.18 * s, 0.48 * s, 0.16 * s, -0.24 * s, 18, 300, core),
  );
}

// ---- the woods ----

// Leaf palettes: deep crimson maples, a scarlet highlight, the fallen leaves.
const LITTER: LeafPalette = { dark: [112, 30, 20], light: [232, 128, 48], leaves: 9 };

// The crimson maple of the border woods: a leaning trunk and a broad layered crown of deep
// red leaves, scarlet and orange where the sun catches it; about 9 m tall and 8 m across.
function redMaple(): THREE.Object3D {
  return crownTreeObject({
    seed: 83, trunk: [[0, 0, 0], [25, -10, 160], [55, -30, 320]], radius: 30, bark: "Frontier_Log", leaf: 58, look: CANOPY.crimson,
    crowns: [[40, -20, 560, 330, 300, 190], [160, -150, 700, 230, 210, 150], [-150, 120, 640, 220, 200, 140], [60, 170, 480, 190, 170, 120], [-20, -160, 760, 150, 140, 100]],
    density: 0.92, clip: { min: [-438, -398, 0], max: [421, 370, 902] },
  });
}

// A low bush of red leaves, about 2.4 m across: overlapping lobes of scarlet sprays over a dark
// red core, deep crimson underneath, orange where the sun catches the top, on a few dark stems.
defineMaterial("Frontier_RedCore", { map: "foliage", tint: "#8a2a1c", rough: 0.95, bump: 1.5 });
defineMaterial("Frontier_RedCardDark", { card: "leaves", tint: "#9a2c1e", rough: 0.85 });
defineMaterial("Frontier_RedCard", { card: "leaves", tint: "#d04a26", rough: 0.8 });
defineMaterial("Frontier_RedCardLight", { card: "leaves", tint: "#f88a40", rough: 0.75 });
const RED_BUSH: ShrubLook = { core: "Frontier_RedCore", dark: "Frontier_RedCardDark", mid: "Frontier_RedCard", light: "Frontier_RedCardLight" };
function redBush(): Geo {
  return shrub({
    seed: 89, leaf: 34, look: RED_BUSH, ragged: 0.6, stems: { mat: "WoodDark", r: 4, n: 6 },
    lobes: [[0, 0, 84, 76, 68, 52], [52, 18, 62, 54, 50, 44], [-44, 40, 58, 52, 48, 42], [-40, -40, 60, 52, 46, 42], [62, -55, 56, 56, 50, 42], [-55, 62, 52, 54, 48, 38], [12, -8, 116, 48, 44, 32]],
  });
}

// Fallen leaves: leaf-clump cards lying on the ground in a patch about 4 m across.
function leafLitter(): THREE.Object3D {
  const rr = seeded(71);
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], col: number[] = [];
  for (let i = 0; i < 48; i++) {
    const a = rr() * TAU, d = Math.sqrt(rr()) * 175, cx = Math.cos(a) * d * 1.1, cy = Math.sin(a) * d * 0.9;
    const size = 40 + rr() * 34, rot = rr() * TAU, z = 1.4 + i * 0.05, tx = (rr() - 0.5) * 0.08, ty = (rr() - 0.5) * 0.08;
    const shade = 0.72 + rr() * 0.35;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) {
      const lx = (sx * size) / 2, ly = (sy * size) / 2;
      const x = cx + lx * Math.cos(rot) - ly * Math.sin(rot), y = cy + lx * Math.sin(rot) + ly * Math.cos(rot);
      pos.push(x, z + (x - cx) * tx + (y - cy) * ty, -y); // Y up already
      nor.push(0, 1, 0);
      uv.push((sx + 1) / 2, (sy + 1) / 2);
      col.push(shade, shade * 0.95, shade * 0.9);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  const [mat] = leafMaterials("frontier_litter", () => leafClump(LITTER));
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = true;
  const g = new THREE.Group();
  g.add(m);
  return g;
}

// A big boulder with a mossy top, a smaller one leaning on it and pebbles; about 3.4 x 2.8 m.
function boulder(): Geo {
  const big = rock([300, 250, 230], 0.34, 3, "Frontier_Rock");
  return merge(
    big,
    coverTop(big, "Frontier_Moss", { amount: 0.3, thick: 3, seed: 3, grain: 50 }),
    translate(rotateY(rock([140, 120, 120], 0.4, 7, "Frontier_Rock"), -14), [-150, 70, 0]),
    translate(rock([60, 50, 36], 0.4, 9, "Frontier_Rock"), [-130, -110, 0]),
    translate(rock([40, 36, 26], 0.4, 11, "Frontier_RockMoss"), [120, -120, 0]),
    translate(rock([34, 30, 22], 0.4, 13, "Frontier_Rock"), [-175, -40, 0]),
  );
}

// A cluster of rocks: a standing slab, two big stones and smaller ones; about 4.6 x 3.6 m.
function rockCluster(): Geo {
  return merge(
    translate(rotateY(rock([150, 110, 300], 0.28, 21, "Frontier_Rock"), 6), [40, 30, 0]),
    translate(rock([200, 170, 150], 0.34, 22, "Frontier_RockMoss"), [-90, -80, 0]),
    translate(rock([170, 150, 120], 0.36, 23, "Frontier_Rock"), [110, -120, 0]),
    translate(rock([110, 100, 80], 0.4, 24, "Frontier_Rock"), [-150, 110, 0]),
    translate(rock([70, 60, 46], 0.4, 25, "Frontier_RockMoss"), [-200, -10, 0]),
    translate(rock([50, 46, 34], 0.4, 26, "Frontier_Rock"), [190, 60, 0]),
    translate(rock([40, 36, 26], 0.4, 27, "Frontier_Rock"), [20, 170, 0]),
  );
}

// Flat slabs of rock, one overlapping another like a low ledge; about 4.4 x 3.2 m.
function flatRocks(): Geo {
  return merge(
    translate(rock([300, 220, 90], 0.22, 31, "Frontier_Rock", true), [30, -20, 0]),
    translate(rotateZ(rock([210, 160, 70], 0.26, 32, "Frontier_RockMoss", true), 30), [-120, 90, 12]),
    translate(rock([150, 120, 50], 0.26, 33, "Frontier_Rock", true), [140, 110, 0]),
    translate(rock([60, 50, 30], 0.4, 34, "Frontier_Rock"), [-170, -100, 0]),
  );
}

// A fallen log along Y (4.8 m) with its root plate torn up at one end, a broken end at the
// other, branch stubs, moss and red-capped mushrooms.
const LOG_END = endGrain("#dcc196");
function fallenLog(): Geo {
  const out: Geo[] = [fallenTrunk({ seed: 42, len: 480, r: 36, bark: "Frontier_Log", wood: LOG_END, roots: { soil: "Frontier_Earth", cover: "Frontier_Moss" }, broken: true, stubs: 3, moss: "Frontier_Moss", mossAmount: 0.25 })];
  // mushrooms by the log
  for (const [x, y, s] of [[-50, -60, 1], [-56, -36, 0.7], [52, 40, 0.85], [58, 64, 0.6], [-50, 150, 0.9]] as [number, number, number][]) {
    out.push(
      cylinderAt({ radius: 3 * s, height: 14 * s, segments: 6, bottom: [x, y, 0] }, "Frontier_Bone"),
      translate(scale(sphereCenter(10 * s, [0, 0, 0], "FabricRed", 8), [1, 1, 0.55]), [x, y, 14 * s]),
      sphereCenter(1.8 * s, [x - 6 * s, y, 18 * s], "FabricWhite", 4),
    );
  }
  return merge(...out);
}

// A stump with spreading roots, rings on the cut, a woodcutter's axe left in it.
function stump(): Geo {
  const out: Geo[] = [stumpOf({ seed: 14, r: 37, h: 62, bark: "Frontier_Log", wood: LOG_END, roots: 6, slant: 0.05 })];
  // the axe: haft leaning back, the head bitten into the cut
  const axe = merge(
    cylinderBetween([0, 0, 0], [0, 0, 78], 2.6, 6, "WoodPale"),
    boxAt([4, 22, 14], [0, 6, -4], "IronDark", 1),
    boxAt([5, 6, 18], [0, 18, -6], "IronLight"),
  );
  out.push(translate(rotateX(axe, 50), [-6, -8, 62]));
  return merge(...out);
}

// Dry grass: blades in tan and rust leaning out of a clump, about 1 m across.
function grassTuft(): Geo {
  const rr = seeded(55), out: Geo[] = [];
  for (let i = 0; i < 22; i++) {
    const a = rr() * TAU, d = rr() * 22, h = 45 + rr() * 45, tilt = 10 + rr() * 30;
    const blade = cylinderAt({ rBot: 3.2, rTop: 0.3, height: h, segments: 3, bottom: [0, 0, 0] }, i % 3 ? "Frontier_DryGrass" : "Frontier_RustGrass");
    out.push(translate(rotateZ(rotateY(blade, tilt), a * DEG), [Math.cos(a) * d, Math.sin(a) * d, 0]));
  }
  return merge(...out);
}

// ---- the patrol outposts ----

// A palisade of sharpened logs, 400 cm along Y; the camp side (+X) has two rails and props.
function palisade(): Geo {
  const rr = seeded(5), out: Geo[] = [];
  for (let i = 0; i < 9; i++) {
    const y = -200 + 22 + i * 44.5, h = 250 + rr() * 40, r = 20 + rr() * 2.5, x = (rr() - 0.5) * 6;
    out.push(
      cylinderAt({ radius: r, height: h, segments: 8, bottom: [x, y, -10] }, i % 3 === 1 ? "WoodShade" : "Frontier_Log"),
      cylinderAt({ rBot: r, rTop: 1, height: 40, segments: 8, bottom: [x, y, h - 10] }, "WoodPale"),
    );
  }
  for (const z of [70, 200]) out.push(
    beamBetween([30, -200, z], [30, 200, z], 12, 14, "WoodDark"),
    beamBetween([-21, -200, z + 4], [-21, 200, z + 4], 3, 7, "RopeTan"),
  );
  for (const y of [-130, 130]) out.push(
    beamBetween([170, y, 0], [38, y, 190], 12, 12, "WoodShade"),
    boxAt([30, 30, 12], [170, y, 0], "Frontier_Rock", 2),
  );
  return merge(...out);
}

// The outpost gate: two great posts either side of a 400 cm passage (posts at y = +-250),
// a covered lintel with Kradia's sign, banners, and the gate leaves swung open inward (+X).
function outpostGate(): Geo {
  const out: Geo[] = [];
  for (const s of [-1, 1]) {
    out.push(
      cylinderAt({ radius: 30, height: 470, segments: 10, bottom: [0, s * 250, 0] }, "Frontier_Log"),
      cylinderAt({ rBot: 30, rTop: 2, height: 50, segments: 10, bottom: [0, s * 250, 470] }, "WoodPale"),
      boxAt([80, 80, 30], [0, s * 250, 0], "Frontier_Rock", 3),
      ...[120, 330].map((z) => cylinderAt({ radius: 32, height: 8, segments: 10, bottom: [0, s * 250, z] }, "IronDark")),
      banner(80, 230, [-33, s * 250, 420], 0.3),
      // the leaf, open inward: a frame faced with planks on the passage side, hinged at the post
      translate(merge(
        boxAt([196, 16, 246], [108, 0, 12], "WoodShade", 1),
        ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => boxAt([23, 6, 254], [22 + i * 24.5, -s * 10, 8], i % 2 ? "Frontier_Log" : "WoodShade")),
        beamBetween([12, -s * 14, 40], [204, -s * 14, 40], 6, 14, "WoodDark"),
        beamBetween([12, -s * 14, 220], [204, -s * 14, 220], 6, 14, "WoodDark"),
        beamBetween([18, -s * 14, 50], [198, -s * 14, 212], 6, 12, "WoodDark"),
        boxAt([12, 4, 12], [190, -s * 16, 120], "IronDark"),
      ), [16, s * 212, 0]),
    );
  }
  out.push(
    beamBetween([0, -300, 400], [0, 300, 400], 26, 30, "WoodDark"),
    beamBetween([0, -290, 440], [0, 290, 440], 20, 20, "WoodShade"),
    // a little shingled roof over the lintel
    roofOver(),
    // the sign: Kradia's purple board with a gold border and a crystal sigil
    boxAt([8, 230, 66], [-18, 0, 318], "Frontier_Purple", 2),
    boxAt([6, 240, 6], [-20, 0, 380], "GoldTrim"),
    boxAt([6, 240, 6], [-20, 0, 318], "GoldTrim"),
    translate(rotateX(box([5, 36, 36], [0, 0, 0], "GoldTrim"), 45), [-24, 0, 351]),
    translate(rotateX(box([6, 18, 18], [0, 0, 0], "Kradia_Rune"), 45), [-26, 0, 351]),
    beamBetween([-18, -90, 384], [-18, -90, 410], 3, 3, "IronDark"),
    beamBetween([-18, 90, 384], [-18, 90, 410], 3, 3, "IronDark"),
  );
  return merge(...out);
}
// The lintel's roof: two slopes along Y, ridge along Y, eaves out front and back.
function roofOver(): Geo {
  const slab = (s: number) => translate(rotateY(box([110, 680, 7], [0, 0, 0], "RoofSlate"), s * 24), [s * 48, 0, 476]);
  return merge(slab(-1), slab(1), boxAt([14, 690, 14], [0, 0, 492], "WoodDark", 2));
}

// The watchtower: four log legs braced in X, a plank platform at 6.2 m with a railing and
// parapet boards, a slate pyramid roof with a pennant, a ladder up the front (-X), a brazier,
// a bell and Kradia's banner.
function watchtower(): Geo {
  const B = 180, T = 130, TOP = 870, P = 620;
  const half = (z: number) => B - ((B - T) * z) / TOP;
  const out: Geo[] = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    out.push(
      cylinderBetween([sx * B, sy * B, 0], [sx * T, sy * T, TOP], 16, 8, "Frontier_Log", 13),
      boxAt([64, 64, 26], [sx * B, sy * B, 0], "Frontier_Rock", 3),
    );
  }
  // braces: X on every side in two storeys, and girts
  const side = (f: (t: number, z: number) => V3) => {
    for (const [z0, z1] of [[40, 300], [300, 580]]) {
      out.push(beamBetween(f(-1, z0), f(1, z1), 9, 11, "WoodShade"), beamBetween(f(1, z0), f(-1, z1), 9, 11, "WoodShade"));
    }
    for (const z of [300, 590]) out.push(beamBetween(f(-1, z), f(1, z), 11, 13, "WoodDark"));
  };
  for (const s of [-1, 1]) {
    side((t, z) => [s * (half(z) + 4), t * half(z), z]);
    side((t, z) => [t * half(z), s * (half(z) + 4), z]);
  }
  // the platform: joists and planks, overhanging the legs
  out.push(boxAt([380, 380, 14], [0, 0, P - 14], "WoodDark", 2));
  for (let i = 0; i < 8; i++) out.push(boxAt([46, 376, 8], [-163 + i * 46.5, 0, P], i % 3 === 1 ? "WoodPale" : "WoodWarm", 1));
  // railing posts, rails and parapet boards (open at the ladder head on -X)
  const R = 182;
  for (const [x, y] of [[-R, -R], [-R, R], [R, -R], [R, R], [0, -R], [0, R], [R, 0], [-R, -60], [-R, 60]] as [number, number][]) out.push(boxAt([11, 11, 130], [x, y, P + 8], "WoodDark", 1.5));
  for (const s of [-1, 1]) {
    out.push(
      boxAt([370, 6, 66], [0, s * R, P + 10], "WoodShade", 1),
      beamBetween([-R, s * R, P + 132], [R, s * R, P + 132], 9, 9, "WoodDark"),
      boxAt([6, 370, 66], [R, 0, P + 10], "WoodShade", 1),
    );
    out.push(boxAt([6, 120, 66], [-R, s * 122, P + 10], "WoodShade", 1), beamBetween([-R, s * 60, P + 132], [-R, s * R, P + 132], 9, 9, "WoodDark"));
  }
  out.push(beamBetween([R, -R, P + 132], [R, R, P + 132], 9, 9, "WoodDark"));
  // the roof
  out.push(
    boxAt([300, 300, 8], [0, 0, TOP - 8], "WoodDark", 1),
    rotateZ(cylinderAt({ rBot: 275, rTop: 6, height: 200, segments: 4, bottom: [0, 0, TOP] }, "RoofSlate"), 45),
    rotateZ(cylinderAt({ rBot: 281, rTop: 271, height: 10, segments: 4, bottom: [0, 0, TOP - 4] }, "WoodDark"), 45),
    cylinderAt({ radius: 4, height: 120, segments: 6, bottom: [0, 0, TOP + 180] }, "WoodDark"),
    boxAt([3, 60, 34], [0, 32, TOP + 262], "Frontier_Purple"),
    sphereCenter(7, [0, 0, TOP + 302], "GoldTrim", 8),
    // the bell under the roof
    cylinderAt({ rBot: 26, rTop: 14, height: 34, segments: 10, bottom: [0, 0, TOP - 70] }, "Bronze"),
    cylinderAt({ radius: 2, height: 30, segments: 4, bottom: [0, 0, TOP - 36] }, "IronDark"),
  );
  // the ladder up the front
  const l0: V3 = [-264, 0, 0], l1: V3 = [-186, 0, P + 6];
  for (const y of [-32, 32]) out.push(cylinderBetween([l0[0], y, 0], [l1[0], y, l1[2] + 80], 5, 6, "WoodShade"));
  for (let k = 1; k * 34 < P; k++) {
    const t = (k * 34) / l1[2];
    out.push(cylinderBetween([l0[0] + (l1[0] - l0[0]) * t, -32, k * 34], [l0[0] + (l1[0] - l0[0]) * t, 32, k * 34], 3, 5, "WoodWarm"));
  }
  // a brazier on the platform, the banner down the front
  out.push(
    cylinderAt({ radius: 5, height: 70, segments: 6, bottom: [120, 120, P + 8] }, "IronDark"),
    cylinderAt({ rBot: 14, rTop: 30, height: 22, segments: 10, bottom: [120, 120, P + 76] }, "IronDark"),
    flames([120, 120, P + 92], 40),
    banner(76, 190, [-R - 6, 120, P + 72], 0.15),
  );
  return merge(...out);
}

// An army tent: a canvas ridge tent 380 long (door at -X) and 330 wide, a purple hem, the door
// flaps rolled back, poles, a pennant and guy ropes to pegs.
function armyTent(): Geo {
  const L = 380, W = 330, H = 236, hx = L / 2, hw = W / 2;
  const a = Math.atan2(H, hw), slope = Math.hypot(H, hw);
  const out: Geo[] = [];
  for (const s of [-1, 1]) {
    // each slope hangs from the ridge out to its foot
    const slab = rotateX(box([L, slope + 14, 4], [0, (s * (slope + 14)) / 2, 0], "Frontier_Canvas"), -s * a * DEG);
    out.push(translate(slab, [0, 0, H]));
    const hem = rotateX(box([L + 2, 30, 5], [0, (s * (slope - 10)), 0], "Frontier_Purple"), -s * a * DEG);
    out.push(translate(hem, [0, 0, H]));
  }
  // the back gable, closed
  out.push(gableWall(hx - 1, hw + 4, 0, H, "Frontier_Canvas"));
  // the front: canvas either side of a door, the dark inside behind it, rolled flaps
  const f = -hx + 1, D = 74, DH = 176;
  out.push(tris([
    f, -hw - 4, 0, f, -D, 0, f, 0, DH,
    f, -hw - 4, 0, f, 0, DH, f, 0, H,
    f, D, 0, f, hw + 4, 0, f, 0, H,
    f, D, 0, f, 0, H, f, 0, DH,
  ], "Frontier_Canvas", true));
  out.push(
    gableWall(-hx + 60, hw - 20, 0, H - 30, "Frontier_Shadow"),
    cylinderBetween([f - 4, -D, 2], [f - 4, -8, DH - 6], 8, 6, "Frontier_Canvas"),
    cylinderBetween([f - 4, D, 2], [f - 4, 8, DH - 6], 8, 6, "Frontier_Canvas"),
    boxAt([L - 20, W - 60, 3], [10, 0, 0], "FeltCream"),
  );
  // poles, ridge and pennant
  for (const x of [-hx - 4, hx + 4]) out.push(cylinderAt({ radius: 5, height: H + 40, segments: 6, bottom: [x, 0, 0] }, "WoodDark"));
  out.push(
    cylinderBetween([-hx - 10, 0, H + 3], [hx + 10, 0, H + 3], 5, 6, "WoodDark"),
    boxAt([3, 46, 28], [-hx - 4, 25, H + 10], "Frontier_Purple"),
    sphereCenter(6, [-hx - 4, 0, H + 44], "GoldTrim", 6),
  );
  // guy ropes and pegs
  for (const [x0, y0, x1, y1, z] of [[-hx - 4, 0, -hx - 110, 0, H + 34], [hx + 4, 0, hx + 110, 0, H + 34],
    [-hx + 40, -hw, -hx + 40, -hw - 70, 30], [hx - 40, -hw, hx - 40, -hw - 70, 30], [-hx + 40, hw, -hx + 40, hw + 70, 30], [hx - 40, hw, hx - 40, hw + 70, 30]] as number[][]) {
    out.push(beamBetween([x0, y0, z], [x1, y1, 8], 1.6, 1.6, "RopeTan"), boxAt([6, 6, 18], [x1, y1, 0], "WoodShade"));
  }
  return merge(...out);
}

// A campfire: a ring of stones, crossed logs and flames, a tripod with a pot, log seats.
function campfire(): Geo {
  const out: Geo[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    out.push(translate(rock([30, 26, 22], 0.4, 60 + i, "Frontier_Rock"), [Math.cos(a) * 64, Math.sin(a) * 64, 0]));
  }
  out.push(cylinderAt({ radius: 52, height: 3, segments: 12, bottom: [0, 0, 0] }, "Frontier_Ash"));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + 0.3;
    out.push(cylinderBetween([Math.cos(a) * 46, Math.sin(a) * 46, 6], [Math.cos(a) * 6, Math.sin(a) * 6, 48], 7, 6, i % 2 ? "Frontier_Log" : "Frontier_Charred", 5));
  }
  out.push(
    ...[[14, 8], [-12, 14], [-6, -16], [16, -10], [0, 0]].map(([x, y]) => sphereCenter(8, [x, y, 6], "Frontier_Ember", 6)),
    flames([0, 0, 4], 62),
  );
  // the tripod and pot
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.5;
    out.push(cylinderBetween([Math.cos(a) * 92, Math.sin(a) * 92, 0], [0, 0, 172], 3.2, 6, "WoodDark"));
  }
  out.push(
    beamBetween([0, 0, 170], [0, 0, 112], 1.5, 1.5, "IronDark"),
    translate(scale(sphereCenter(24, [0, 0, 0], "IronDark", 10), [1, 1, 0.8]), [0, 0, 96]),
    cylinderAt({ radius: 20, height: 4, segments: 10, bottom: [0, 0, 110] }, "IronDark"),
    cylinderAt({ radius: 18, height: 2, segments: 10, bottom: [0, 0, 112] }, "Frontier_Earth"),
  );
  // two logs to sit on
  out.push(
    cylinderBetween([-150, -70, 22], [-150, 80, 22], 22, 10, "Frontier_Log"),
    translate(rotateX(cylinderCenter(20, 2, 10, [0, 0, 0], "WoodPale"), 90), [-150, -71, 22]),
    cylinderBetween([60, 160, 20], [-80, 160, 20], 20, 10, "Frontier_Log"),
  );
  return merge(...out);
}

// A signpost of the patrols: a square post on a stone footing, arrow boards pointing the
// three ways (-Y, +Y and -X), a little shingled cap and a purple ribbon.
function signpost(): Geo {
  const arrow = (len: number, z: number, dir: number, mat: string): Geo => {
    const b = merge(
      boxAt([6, len, 26], [0, len / 2, z], mat, 1),
      translate(rotateX(box([6, 19, 19], [0, 0, 0], mat, 1), 45), [0, len, z + 13]),
      boxAt([7, len - 30, 3], [0, len / 2 - 6, z + 6], "Frontier_Shadow"),
      boxAt([7, len - 40, 3], [0, len / 2 - 10, z + 16], "Frontier_Shadow"),
    );
    return rotateZ(b, dir);
  };
  return merge(
    boxAt([60, 60, 22], [0, 0, 0], "Frontier_Rock", 3),
    boxAt([16, 16, 300], [0, 0, 18], "WoodShade", 1.5),
    arrow(120, 238, 180, "WoodWarm"),
    arrow(110, 200, 0, "WoodPale"),
    arrow(100, 162, -90, "WoodWarm"),
    rotateZ(cylinderAt({ rBot: 30, rTop: 2, height: 24, segments: 4, bottom: [0, 0, 318] }, "RoofSlate"), 45),
    boxAt([4, 18, 70], [-10, 0, 258], "Frontier_Purple"),
    boxAt([5, 20, 5], [-10, 0, 286], "GoldTrim"),
    cylinderAt({ radius: 3, height: 4, segments: 6, bottom: [-9, 0, 140] }, "IronDark"),
  );
}

// ---- the old battlefield ----

// A wrecked stone-thrower: the chassis slumped on a broken wheel, one wheel lying beside it,
// an upright snapped, the arm broken with its far half on the ground, charred beams, spent
// stones and arrows stuck in the wood.
function catapultWreck(): Geo {
  const body: Geo[] = [];
  for (const y of [-80, 80]) body.push(boxBounds([-180, y - 12, 34], [180, y + 12, 62], y > 0 ? "Frontier_Charred" : "WoodDark", 2));
  for (const x of [-160, 0, 150]) body.push(boxBounds([x - 12, -92, 46], [x + 12, 92, 66], x === 0 ? "Frontier_Charred" : "WoodWarm", 2));
  const wheel = merge(
    rotateX(cylinderCenter(42, 12, 14, [0, 0, 0], "WoodWarm"), 90),
    rotateX(torus(42, 4, 16, 6, "IronDark"), 90),
    rotateX(cylinderCenter(9, 20, 8, [0, 0, 0], "IronDark"), 90),
  );
  body.push(cylinderBetween([-120, -112, 46], [-120, 112, 46], 5, 8, "IronDark"), cylinderBetween([120, -112, 46], [120, 40, 46], 5, 8, "IronDark"));
  body.push(translate(wheel, [-120, -104, 46]), translate(wheel, [-120, 104, 46]), translate(wheel, [120, -104, 46]));
  // the uprights: one whole, one snapped
  body.push(
    boxBounds([-62, -82, 62], [-42, -62, 236], "WoodDark", 2),
    beamBetween([-168, -72, 62], [-54, -72, 200], 10, 10, "WoodDark"),
    beamBetween([40, -72, 62], [-50, -72, 200], 10, 10, "WoodDark"),
    boxBounds([-62, 62, 62], [-42, 82, 140], "Frontier_Charred", 2),
    translate(rotateY(boxBounds([-8, -8, 0], [8, 8, 26], "Frontier_Charred"), 18), [-48, 70, 140]),
    translate(rotateY(boxBounds([-6, -6, 0], [6, 6, 18], "Frontier_Charred"), -22), [-58, 74, 138]),
    beamBetween([-168, 72, 62], [-110, 72, 130], 10, 10, "Frontier_Charred"),
    cylinderBetween([60, -68, 72], [60, 68, 72], 20, 10, "RopeTan"),
    // the arm's stump, broken off
    beamBetween([50, 0, 68], [140, 0, 110], 16, 16, "WoodWarm"),
    translate(rotateY(boxBounds([-6, -7, 0], [6, 7, 30], "WoodPale"), -40), [140, 0, 104]),
  );
  // slumped towards the broken wheel (+X +Y corner)
  const out: Geo[] = [rotateX(rotateY(merge(...body), 7, [-180, 0, 0]), -8, [0, -110, 0])];
  // the stop bar fallen across, the arm's far half and its cup on the ground
  out.push(
    beamBetween([-60, -100, 230], [-210, 130, 14], 14, 14, "WoodWarm"),
    beamBetween([-90, 190, 16], [130, 230, 16], 16, 16, "Frontier_Charred"),
    translate(rotateY(boxBounds([-6, -7, 0], [6, 7, 26], "WoodPale"), 70), [130, 230, 10]),
    cylinderAt({ rBot: 16, rTop: 30, height: 18, segments: 10, bottom: [-110, 186, 4] }, "WoodDark"),
    translate(rotateX(merge(
      rotateX(cylinderCenter(42, 12, 14, [0, 0, 0], "WoodWarm"), 90),
      rotateX(torus(42, 4, 16, 6, "IronDark"), 90),
    ), 90), [210, 140, 7]),
    translate(rotateX(wheel, -18), [130, 116, 42]),
  );
  // spent stones, arrows
  for (const [x, y, r] of [[-250, -60, 24], [-200, -170, 20], [240, -150, 22], [-110, 186, 22]] as V3[]) out.push(sphereCenter(r, [x, y, r * 0.85], "StoneGrey", 8));
  const arrow = (at: V3, tilt: number, turn: number) => translate(rotateZ(rotateY(merge(
    cylinderAt({ radius: 1.4, height: 70, segments: 4, bottom: [0, 0, 0] }, "WoodPale"),
    boxAt([1, 8, 14], [0, 0, 54], "FabricWhite"), boxAt([8, 1, 14], [0, 0, 54], "FabricWhite"),
  ), tilt), turn), at);
  out.push(arrow([-20, -80, 64], 40, 30), arrow([100, -82, 58], 50, 150), arrow([-170, 0, 62], 30, 200), arrow([60, 210, 20], 55, 80));
  return merge(...out);
}

// A row of sharpened stakes, 400 cm along Y, leaning out towards -X from an earth bank and
// lashed to a log; one stake snapped.
function stakeRow(): Geo {
  const out: Geo[] = [
    translate(rock([150, 440, 60], 0.18, 71, "Frontier_Earth", true), [10, 0, 0]),
    cylinderBetween([-22, -205, 58], [-22, 205, 58], 12, 8, "Frontier_Log"),
  ];
  const rr = seeded(73);
  for (let i = 0; i < 8; i++) {
    const y = -175 + i * 50, len = i === 5 ? 90 : 170 + rr() * 30, tilt = -(32 + rr() * 8);
    const stake = merge(
      cylinderAt({ radius: 8, height: len, segments: 6, bottom: [0, 0, 0] }, i % 3 === 2 ? "Frontier_Charred" : "WoodShade"),
      i === 5
        ? translate(rotateY(boxBounds([-4, -4, 0], [4, 4, 22], "WoodPale"), 25), [0, 0, len - 4])
        : cylinderAt({ rBot: 8, rTop: 0.6, height: 30, segments: 6, bottom: [0, 0, len] }, "WoodPale"),
    );
    out.push(translate(rotateZ(rotateY(stake, tilt), (rr() - 0.5) * 8), [30, y, 6]));
    out.push(cylinderAt({ radius: 9.4, height: 6, segments: 6, bottom: [-22 + 0, y, 52] }, "RopeTan"));
  }
  return merge(...out);
}

// The ruined tower: a round stone tower broken open, tall at the back (+X +Y), low on the
// east side (-Y), a door with a lintel at the front (-X), arrow slits, charred beams, rubble
// spilling out and a torn banner; about 7.5 m across and 9 m at its highest.
function ruinedTower(): Geo {
  const R0 = 300, R1 = 228, rm = (R0 + R1) / 2, n = 16, C = 44, chord = (TAU * rm) / n;
  const rr = seeded(17);
  const bump = (a: number, at: number, w: number) => {
    const d = Math.abs(((a - at + 540) % 360) - 180);
    return d < w ? Math.cos((Math.PI / 2) * (d / w)) : 0;
  };
  const jag = Array.from({ length: n * 2 }, () => rr() * 80);
  const height = (a: number, i: number) => 170 + 720 * bump(a, 70, 115) + 330 * bump(a, 185, 60) + jag[i];
  const out: Geo[] = [];
  const mats = ["StoneGrey", "StoneGrey", "StoneDark", "MossStone", "StoneGrey", "StoneBlueDark"];
  for (let c = 0; c < 22; c++) {
    const z = c * C;
    for (let i = 0; i < n; i++) {
      const a = ((i + 0.5 + (c % 2) * 0.5) / n) * 360;
      const H = height(a, (i * 2 + (c % 2)) % (n * 2));
      if (z + C > H + 10) continue;
      const door = Math.abs(((a - 180 + 540) % 360) - 180) < 22 && z < 250;
      const slit = (c === 8 || c === 9 || c === 15 || c === 16) && (i + (c > 12 ? 2 : 0)) % 5 === 1;
      if (door || slit) continue;
      const k = Math.floor(rr() * mats.length);
      const mat = z + C > H - 50 && a > 20 && a < 140 && rr() < 0.4 ? "Frontier_Soot" : c < 3 && rr() < 0.5 ? "MossStone" : mats[k];
      out.push(rotateZ(box([R0 - R1 - rr() * 8, chord - 3, C - 3], [rm, 0, z + C / 2], mat, 2), a));
    }
  }
  // plinth, the door's lintel and step, the floor inside
  out.push(
    cylinderAt({ radius: R0 + 14, height: 22, segments: 24, bottom: [0, 0, -6] }, "StoneDark"),
    boxAt([R0 - R1 + 20, 200, 40], [-rm, 0, 250], "StoneBlueDark", 3),
    boxAt([60, 140, 14], [-R0 - 20, 0, 0], "StoneGrey", 2),
    cylinderAt({ radius: R1 + 2, height: 24, segments: 20, bottom: [0, 0, 0] }, "Frontier_Earth"),
  );
  // charred beams of the fallen floor inside, one sticking out over the low side
  out.push(
    beamBetween([200, 120, 560], [-60, 180, 300], 22, 22, "Frontier_Charred"),
    beamBetween([150, -40, 24], [-120, 120, 230], 20, 20, "Frontier_Charred"),
    beamBetween([120, -200, 40], [40, -360, 170], 18, 18, "Frontier_Charred"),
    beamBetween([-80, 80, 24], [100, -60, 24], 22, 22, "Frontier_Charred"),
  );
  // rubble spilling out of the low side and inside
  for (let i = 0; i < 18; i++) {
    const a = (220 + rr() * 110) * (Math.PI / 180), d = i < 12 ? R0 + 20 + rr() * 200 : rr() * 180;
    const s = 0.6 + rr() * 0.6;
    out.push(translate(rotateZ(rotateX(box([60 * s, 90 * s, 40 * s], [0, 0, 0], rr() < 0.3 ? "StoneDark" : "StoneGrey", 2), (rr() - 0.5) * 50), rr() * 180), [Math.cos(a) * d, Math.sin(a) * d, 14 * s + (i >= 12 ? 24 : 0)]));
  }
  // the torn banner on the tall side, facing out the front over the door
  out.push(banner(110, 300, [-R0 - 4, 0, 560], 0.5), beamBetween([-R0 + 10, -70, 566], [-R0 + 10, 70, 566], 6, 6, "IronDark"));
  return merge(...out);
}

// A pile of fallen dressed stones, a broken beam and a rock; about 3.4 x 2.6 m.
function rubblePile(): Geo {
  const rr = seeded(91), out: Geo[] = [];
  for (let i = 0; i < 13; i++) {
    const a = rr() * TAU, d = Math.sqrt(rr()) * 120, s = 0.6 + rr() * 0.6, z = i > 9 ? 36 : 0;
    out.push(translate(rotateZ(rotateY(box([90 * s, 60 * s, 44 * s], [0, 0, 0], ["StoneGrey", "StoneDark", "StoneBlueDark", "MossStone"][i % 4], 2), (rr() - 0.5) * 40), rr() * 180), [Math.cos(a) * d * 1.2, Math.sin(a) * d, 18 * s + z]));
  }
  out.push(
    beamBetween([-160, -60, 10], [100, 90, 60], 20, 20, "Frontier_Charred"),
    translate(rock([90, 80, 60], 0.4, 92, "Frontier_Rock"), [120, -80, 0]),
  );
  return merge(...out);
}

// Scorched ground: a ragged black burn about 4.6 m across with a sooty rim, ash, charred sticks
// and a few embers still glowing. (Lies on the ground: put it on level ground.)
function scorchMark(): Geo {
  const rr = seeded(97), out: Geo[] = [
    blob(230, 0.7, 98, 1.2, "Frontier_Soot", { sx: 1.1, n: 32 }),
    blob(160, 0.7, 99, 2.2, "Frontier_Ash", { sx: 1.05, at: [10, -10], n: 30 }),
    blob(60, 0.6, 100, 3.0, "Frontier_Soot", { at: [-60, 50] }),
    blob(90, 0.8, 101, 1.6, "Frontier_Ash", { at: [150, 140], n: 16 }),
    blob(70, 0.8, 102, 1.6, "Frontier_Ash", { at: [-170, -120], n: 16 }),
  ];
  for (let i = 0; i < 6; i++) {
    const a = rr() * TAU, d = rr() * 120, l = 40 + rr() * 50, b = rr() * TAU;
    out.push(cylinderBetween([Math.cos(a) * d, Math.sin(a) * d, 5], [Math.cos(a) * d + Math.cos(b) * l, Math.sin(a) * d + Math.sin(b) * l, 5], 4, 5, "Frontier_Charred"));
  }
  for (let i = 0; i < 12; i++) {
    const a = rr() * TAU, d = rr() * 140;
    out.push(boxAt([5 + rr() * 5, 5 + rr() * 5, 3], [Math.cos(a) * d, Math.sin(a) * d, 2.5], "Frontier_Ember"));
  }
  return merge(...out);
}

// What the battle left: a low mound with swords driven into it, a broken spear, a shield and a
// helmet, and a torn banner on a snapped pole leaning over it all.
function battleRelics(): Geo {
  return merge(
    translate(rock([220, 170, 50], 0.2, 111, "Frontier_Earth", true), [0, 0, 0]),
    translate(rotateY(rotateZ(sword(92), 20), -12), [-20, -30, 28]),
    translate(rotateY(rotateZ(sword(84), -30), 16), [30, 40, 26]),
    translate(rotateX(rotateZ(sword(80), 80), 22), [-30, 60, 20]),
    translate(rotateY(spear(150, true), 64), [-120, -70, 10]),
    translate(rotateY(roundShield(36, [0, 0, 0], "Frontier_Purple"), -68), [-70, 50, 30]),
    // the helmet: a cap, a brim and a nasal
    translate(merge(
      scale(sphereCenter(18, [0, 0, 0], "IronLight", 10), [1, 1, 0.9]),
      cylinderAt({ radius: 19, height: 4, segments: 10, bottom: [0, 0, -2] }, "IronDark"),
      boxAt([3, 4, 18], [-19, 0, -12], "IronDark"),
    ), [60, -60, 24]),
    // the banner pole, snapped and leaning
    translate(rotateY(merge(
      cylinderAt({ radius: 5, height: 300, segments: 6, bottom: [0, 0, 0] }, "WoodDark"),
      translate(rotateY(boxBounds([-4, -4, 0], [4, 4, 16], "WoodPale"), 20), [0, 0, 298]),
      rotateZ(banner(80, 170, [0, 0, 280], 0.7), 90),
    ), 14), [40, 10, 22]),
  );
}

// ---- the demon lands ----

// Dark crystals: a tall glowing crystal over a cluster of smaller ones on black rock, a bright
// core in each; about 3.6 m across and 4.8 m tall.
function darkCrystal(): Geo {
  return merge(
    translate(rock([240, 200, 70], 0.4, 121, "Frontier_Obsidian"), [0, 0, -6]),
    translate(rock([110, 90, 60], 0.4, 122, "Frontier_Obsidian"), [120, -100, 0]),
    translate(rock([90, 80, 50], 0.4, 123, "Frontier_Obsidian"), [-120, 90, 0]),
    shard(56, 470, [10, 0, 40], 6, 30),
    shard(18, 240, [10, 0, 60], 6, 30, "Frontier_CrystalCore"),
    shard(36, 280, [-70, -50, 30], 26, 220),
    shard(32, 250, [70, 70, 30], 30, 50),
    shard(26, 190, [90, -90, 30], 38, 320),
    shard(22, 150, [-90, 90, 24], 40, 140),
    shard(14, 90, [-130, -20, 8], 46, 180, "Frontier_CrystalCore"),
    shard(16, 110, [140, 20, 8], 44, 10),
    shard(10, 60, [-40, 140, 4], 50, 100, "Frontier_CrystalCore"),
    shard(12, 70, [30, -150, 4], 50, 280),
  );
}

// A twisted dead tree: a black trunk that winds up and splits into clawing branches, roots
// gripping the ground; about 6.5 m tall.
function deadTree(): Geo {
  return snag({ seed: 172, h: 660, r: 34, bark: "Frontier_DeadBark", wood: endGrain("#a39486"), roots: 6, lean: 0.18, hollow: "Frontier_Shadow" });
}

// The bones of a great beast lying on its back: the spine along X, ribs curling up and in like
// claws, the horned skull at -X, a thigh bone and smaller bones about; about 7 x 4.4 m.
function beastBones(): Geo {
  const out: Geo[] = [];
  // the spine: vertebrae with their spurs
  for (let i = 0; i < 11; i++) {
    const x = -170 + i * 50, s = 1 - i * 0.045;
    out.push(
      translate(rotateZ(box([30 * s, 46 * s, 30 * s], [0, 0, 0], "Frontier_Bone", 5), (i % 2) * 8), [x, 0, 16 * s]),
      cylinderBetween([x, 0, 10], [x, 0, -10], 14 * s, 6, "Frontier_Bone"),
    );
  }
  // ribs: pairs curling up out of the ground and in over the spine
  for (let i = 0; i < 6; i++) {
    const x = -120 + i * 62, s = 1.08 - i * 0.1;
    for (const side of [-1, 1]) {
      const p = (y: number, z: number, dx = 0): V3 => [x + dx, side * y * s, z * s];
      out.push(limb([p(30, 20), p(120, 70, 6), p(175, 170, 12), p(170, 270, 16), p(120, 350, 20), p(55, 385, 22)], 13 * s, 4, "Frontier_Bone", 6));
    }
  }
  // the skull, half sunk: a long wedge of a head with heavy brows, deep sockets, fangs and
  // horns sweeping back
  out.push(
    translate(scale(sphereCenter(1, [0, 0, 0], "Frontier_Bone", 10), [100, 72, 58]), [-290, 0, 28]),
    translate(rotateY(rotateZ(scale(cylinderAt({ rBot: 62, rTop: 26, height: 190, segments: 4, bottom: [0, 0, 0] }, "Frontier_Bone"), [1, 0.8, 1]), 45), -96), [-320, 0, 40]),
    ...[-1, 1].map((s) => translate(rotateZ(rotateX(box([70, 34, 22], [0, 0, 0], "Frontier_Bone", 5), -s * 18), s * 14), [-340, s * 38, 76])),
    ...[-1, 1].map((s) => translate(scale(sphereCenter(1, [0, 0, 0], "Frontier_Shadow", 8), [16, 18, 12]), [-366, s * 38, 60])),
    ...[-1, 1].map((s) => translate(scale(sphereCenter(1, [0, 0, 0], "Frontier_Shadow", 6), [8, 6, 5]), [-486, s * 10, 44])),
    ...[-1, 1].map((s) => limb([[-280, s * 50, 72], [-250, s * 110, 130], [-190, s * 150, 170], [-120, s * 146, 192], [-80, s * 118, 200]], 20, 2, "Frontier_Bone", 7)),
    ...[-1, 1].map((s) => spike([-430, s * 30, 30], [-0.15, s * 0.1, -1], 36, 6, "Frontier_Bone", 5)),
  );
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) out.push(spike([-470 + i * 22, s * (18 + i * 3), 26], [0, 0, -1], 16, 4, "Frontier_Bone", 4));
  // the lower jaw lying apart (two arms in a V with teeth), a thigh bone, small bones
  const jawArm = (s: number) => merge(
    beamBetween([0, 0, 10], [170, s * 70, 10], 16, 18, "Frontier_Bone"),
    ...[0, 1, 2, 3].map((k) => spike([20 + k * 30, s * (8 + k * 12.4), 18], [0, 0, 1], 18, 4, "Frontier_Bone", 4)),
  );
  out.push(
    translate(rotateZ(merge(jawArm(-1), jawArm(1), sphereCenter(12, [0, 0, 10], "Frontier_Bone", 8)), 200), [-330, 190, 0]),
    limb([[260, -150, 14], [420, -110, 14]], 14, 12, "Frontier_Bone", 7, false),
    sphereCenter(24, [255, -152, 18], "Frontier_Bone", 8), sphereCenter(22, [425, -108, 18], "Frontier_Bone", 8),
    limb([[200, 170, 8], [280, 200, 8]], 7, 6, "Frontier_Bone", 6, false),
    limb([[330, 120, 7], [360, 190, 7]], 6, 5, "Frontier_Bone", 6, false),
  );
  return merge(...out);
}

// A crack in the earth glowing from below: a jagged rift about 6.6 m long along Y with dark
// lips, two side cracks, black chips along it and sparks hanging over it. (Lies on the ground:
// put it on level ground.)
function glowCrack(): Geo {
  const rr = seeded(141), out: Geo[] = [];
  const rift = (pts: [number, number][], wmax: number) => {
    const n = pts.length;
    const inL: V3[] = [], inR: V3[] = [], lipL: V3[] = [], lipR: V3[] = [], outL: V3[] = [], outR: V3[] = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      const t = i / (n - 1), w = 3 + wmax * Math.pow(Math.sin(Math.PI * t), 0.8) * (0.75 + rr() * 0.5), lip = 10 + w * 0.5;
      const [x, y] = pts[i];
      inL.push([x + nx * w / 2, y + ny * w / 2, 1.4]);
      inR.push([x - nx * w / 2, y - ny * w / 2, 1.4]);
      lipL.push([x + nx * (w / 2 + 2), y + ny * (w / 2 + 2), 4.5]);
      lipR.push([x - nx * (w / 2 + 2), y - ny * (w / 2 + 2), 4.5]);
      outL.push([x + nx * (w / 2 + lip), y + ny * (w / 2 + lip), 0.8]);
      outR.push([x - nx * (w / 2 + lip), y - ny * (w / 2 + lip), 0.8]);
    }
    out.push(ribbon(inL, inR, "Frontier_Abyss"));
    out.push(ribbon(outL, lipL, "Frontier_Obsidian"), ribbon(lipR, outR, "Frontier_Obsidian"));
    out.push(ribbon(lipL, inL, "Frontier_Shadow"), ribbon(inR, lipR, "Frontier_Shadow"));
  };
  const main: [number, number][] = [];
  for (let i = 0; i <= 14; i++) main.push([Math.sin(i * 0.9) * 26 + (rr() - 0.5) * 30, -330 + i * (660 / 14)]);
  rift(main, 38);
  const branch = (from: [number, number], ang: number, len: number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 6; i++) pts.push([from[0] + Math.cos(ang) * len * (i / 6) + (rr() - 0.5) * 16, from[1] + Math.sin(ang) * len * (i / 6) + (rr() - 0.5) * 16]);
    rift(pts, 16);
  };
  branch(main[5], 2.4, 190);
  branch(main[10], -0.7, 160);
  for (let i = 0; i < 10; i++) {
    const p = main[1 + Math.floor(rr() * 13)], side = rr() < 0.5 ? -1 : 1;
    out.push(translate(rock([26 + rr() * 20, 22 + rr() * 16, 18 + rr() * 14], 0.5, 150 + i, "Frontier_Obsidian"), [p[0] + side * (44 + rr() * 30), p[1] + (rr() - 0.5) * 40, 0]));
  }
  for (let i = 0; i < 9; i++) {
    const p = main[2 + Math.floor(rr() * 11)];
    out.push(facet(translate(sphereCenter(3 + rr() * 3, [0, 0, 0], "Frontier_CrystalCore", 4), [p[0] + (rr() - 0.5) * 30, p[1] + (rr() - 0.5) * 40, 20 + rr() * 90])));
  }
  return merge(...out);
}

// The demon gate: a stepped black dais, two horned pillars banded with glowing runes, a pointed
// arch of spiked stones with a demon's skull for a keystone, and between the pillars a swirling
// portal; an altar with a crystal before it and braziers of purple fire. Faces -X; about
// 9 x 14 m and 15 m tall.
function demonGate(): Geo {
  const out: Geo[] = [];
  const OB = "Frontier_Obsidian";
  // the dais: three steps, glowing seams on the risers
  out.push(
    boxAt([900, 1300, 30], [0, 0, 0], OB, 4),
    boxAt([800, 1200, 30], [40, 0, 30], OB, 4),
    boxAt([700, 1100, 30], [90, 0, 60], OB, 4),
    boxAt([4, 1000, 4], [-452, 0, 12], "Frontier_Abyss"),
    boxAt([4, 900, 4], [-362, 0, 42], "Frontier_Abyss"),
    boxAt([4, 800, 4], [-262, 0, 72], "Frontier_Abyss"),
  );
  // the pillars
  const PX = 150, PY = 430, ZB = 90;
  for (const s of [-1, 1]) {
    const y = s * PY;
    out.push(
      boxAt([270, 270, 80], [PX, y, ZB], OB, 6),
      boxAt([230, 230, 20], [PX, y, ZB + 80], "StoneBlueDark", 3),
      facet(cylinderAt({ rBot: 108, rTop: 80, height: 640, segments: 6, bottom: [PX, y, ZB + 100] }, OB)),
      ...[260, 470, 650].map((z) => facet(cylinderAt({ rBot: 108 - (28 * (z - 100)) / 640 + 5, rTop: 108 - (28 * (z - 100)) / 640 + 3, height: 14, segments: 6, bottom: [PX, y, ZB + z] }, "Frontier_Abyss"))),
      boxAt([240, 240, 60], [PX, y, ZB + 740], OB, 5),
      boxAt([200, 200, 24], [PX, y, ZB + 800], "StoneBlueDark", 3),
      // spikes out of the pillar's sides and front
      spike([PX - 60, y + s * 60, ZB + 330], [-0.5, s, 0.5], 140, 22, OB, 5),
      spike([PX - 60, y + s * 50, ZB + 560], [-0.4, s, 0.7], 120, 18, OB, 5),
      spike([PX - 90, y, ZB + 420], [-1, 0, 0.35], 90, 16, OB, 5),
      spike([PX + 70, y + s * 50, ZB + 200], [0.6, s, 0.2], 110, 20, OB, 5),
      // the great horn sweeping up and out from the top
      limb([[PX, y, ZB + 820], [PX - 20, y + s * 90, ZB + 900], [PX - 10, y + s * 210, ZB + 1010], [PX + 20, y + s * 280, ZB + 1160], [PX + 40, y + s * 270, ZB + 1300]], 46, 3, OB, 8),
      // a crystal on the capital's front corner
      shard(18, 120, [PX - 100, y - s * 40, ZB + 824], 20, s > 0 ? 200 : 160),
    );
  }
  // the pointed arch: two arcs of spiked stones from the capitals to the apex
  const ZS = ZB + 824, c = 150, Rr = PY + c, th1 = Math.acos(c / Rr);
  const N = 6;
  for (const s of [-1, 1]) {
    for (let i = 0; i < N; i++) {
      const t0 = (i / N) * th1, t1 = ((i + 1) / N) * th1, tm = (t0 + t1) / 2, chord = 2 * Rr * Math.sin((t1 - t0) / 2) + 2;
      const blk = rotateX(box([150, 110, chord], [0, 0, 0], i % 2 ? OB : "StoneBlueDark", 4), (s > 0 ? tm : Math.PI - tm) * DEG);
      out.push(translate(blk, [PX, -s * c + s * Rr * Math.cos(tm), ZS + Rr * Math.sin(tm)]));
      const ro = Rr + 55, dirY = s * Math.cos(tm), dirZ = Math.sin(tm);
      out.push(spike([PX, -s * c + s * ro * Math.cos(tm), ZS + ro * Math.sin(tm)], [0, dirY, dirZ], 80 + (i % 2) * 40, 18, OB, 5));
      out.push(boxAt([4, 8, chord * 0.6], [PX - 77, -s * c + s * (Rr - 30) * Math.cos(tm), ZS + (Rr - 30) * Math.sin(tm) - chord * 0.3], "Frontier_Abyss"));
    }
  }
  // the keystone: a demon's skull with glowing eyes and horns
  const K: V3 = [PX - 30, 0, ZS + Rr * Math.sin(th1) + 40];
  out.push(
    translate(scale(sphereCenter(1, [0, 0, 0], "Frontier_Bone", 10), [80, 92, 96]), K),
    boxAt([70, 110, 50], [K[0] - 30, 0, K[2] - 110], "Frontier_Bone", 6),
    ...[-1, 1].map((s) => sphereCenter(20, [K[0] - 70, s * 34, K[2] - 6], "Frontier_Abyss", 8)),
    ...[-1, 1].map((s) => limb([[K[0], s * 70, K[2] + 40], [K[0] - 20, s * 140, K[2] + 110], [K[0] + 10, s * 170, K[2] + 200], [K[0] + 40, s * 150, K[2] + 260]], 22, 2, "Frontier_Bone", 7)),
    ...[-36, -12, 12, 36].map((y) => spike([K[0] - 62, y, K[2] - 80], [-0.2, 0, -1], 34, 7, "Frontier_Bone", 5)),
  );
  // the portal: a swirling disc in the passage, rings and a spiral of light
  const V: V3 = [PX, 0, ZB + 520];
  out.push(
    disk(318, 6, V, "Frontier_Vortex", 28),
    ringX(320, 12, [PX - 2, 0, V[2]], "Frontier_Abyss", 32),
    ringX(240, 5, [PX - 5, 0, V[2]], "Frontier_CrystalCore", 28),
    ringX(160, 4, [PX - 7, 0, V[2]], "Frontier_Abyss", 24),
    ringX(84, 4, [PX - 9, 0, V[2]], "Frontier_CrystalCore", 20),
    facet(translate(sphereCenter(36, [0, 0, 0], "Frontier_CrystalCore", 8), [PX - 10, 0, V[2]])),
  );
  for (let k = 0; k < 40; k++) {
    for (const arm of [0, Math.PI]) {
      const a = k * 0.36 + arm, r = 40 + k * 6.6;
      out.push(translate(rotateX(box([3, 34, 9], [0, 0, 0], k % 3 ? "Frontier_Abyss" : "Frontier_CrystalCore"), (a + Math.PI / 2) * DEG), [PX - 6, r * Math.cos(a), V[2] + r * Math.sin(a)]));
    }
  }
  // crystals floating about the portal
  for (const [x, y, z, h, tilt, turn] of [[60, -300, 1050, 90, 30, 40], [40, 290, 980, 110, -24, 160], [-40, -210, 260, 70, 40, 250], [-20, 230, 300, 80, -30, 300], [20, 0, 1180, 70, 0, 0]]) {
    out.push(shard(14, h, [x, y, z], tilt, turn, "Frontier_DarkCrystal"));
  }
  // the altar before the portal
  out.push(
    boxAt([170, 300, 60], [-130, 0, ZB], OB, 5),
    boxAt([200, 330, 26], [-130, 0, ZB + 60], "StoneBlueDark", 4),
    ...[-90, -30, 30, 90].map((y) => boxAt([4, 16, 34], [-217, y, ZB + 14], "Frontier_Abyss")),
    shard(26, 130, [-130, 0, ZB + 92], 0, 0, "Frontier_CrystalCore"),
    shard(16, 70, [-110, -60, ZB + 86], 26, 300, "Frontier_DarkCrystal"),
    shard(14, 60, [-150, 60, ZB + 86], 28, 120, "Frontier_DarkCrystal"),
    ...[-120, 120].map((y) => merge(
      cylinderAt({ radius: 8, height: 26, segments: 8, bottom: [-130, y, ZB + 86] }, "Frontier_Bone"),
      flames([-130, y, ZB + 112], 18, "Frontier_Hellfire", "Frontier_CrystalCore"),
    )),
  );
  // braziers of purple fire on the second step
  for (const s of [-1, 1]) {
    const B: V3 = [-300, s * 510, 60];
    out.push(
      boxAt([70, 70, 20], B, OB, 3),
      cylinderAt({ rBot: 14, rTop: 10, height: 110, segments: 6, bottom: [B[0], B[1], B[2] + 20] }, OB),
      cylinderAt({ rBot: 20, rTop: 46, height: 30, segments: 6, bottom: [B[0], B[1], B[2] + 130] }, OB),
      ...[0, 1, 2, 3, 4, 5].map((k) => spike([B[0] + 44 * Math.cos((k * TAU) / 6), B[1] + 44 * Math.sin((k * TAU) / 6), B[2] + 156], [Math.cos((k * TAU) / 6) * 0.4, Math.sin((k * TAU) / 6) * 0.4, 1], 34, 6, OB, 4)),
      flames([B[0], B[1], B[2] + 150], 64, "Frontier_Hellfire", "Frontier_CrystalCore"),
    );
  }
  return merge(...out);
}

// ---- the kit ----

export const KIT: Kit = {
  id: "frontier",
  name: "ชายแดนและดินแดนอสูร",
  region: "ชายแดนตะวันออก",
  desc: "ป่าใบแดงของหน่วยลาดตระเวนคราเดีย สนามรบเก่าที่ยังมีซากเครื่องยิงหินกับหอคอยพัง และดินแดนอสูรสีม่วงดำ ผลึกมืด รอยแยกเรืองแสง ประตูอสูร",
  ground: "moss",
  items: [
    // the woods
    { id: "red_maple", name: "ต้นเมเปิลแดง", make: redMaple, tags: ["tree", "plant"] },
    { id: "red_bush", name: "พุ่มใบแดง", make: redBush, tags: ["plant", "decor"] },
    { id: "leaf_litter", name: "ใบไม้แดงร่วง", make: leafLitter, tags: ["ground"] },
    { id: "boulder", name: "หินก้อนใหญ่", make: boulder, tags: ["rock", "decor"] },
    { id: "rock_cluster", name: "กลุ่มหิน", make: rockCluster, tags: ["rock", "decor"] },
    { id: "flat_rocks", name: "แผ่นหินแบน", make: flatRocks, tags: ["rock", "decor"] },
    { id: "fallen_log", name: "ขอนไม้ล้ม", make: fallenLog, tags: ["log", "decor"] },
    { id: "stump", name: "ตอไม้กับขวาน", make: stump, tags: ["decor"] },
    { id: "grass_tuft", name: "กอหญ้าแห้ง", make: grassTuft, tags: ["ground", "plant"] },
    // the patrol outposts
    { id: "palisade", name: "รั้วไม้ปลายแหลม (4 ม.)", make: palisade, tags: ["wall", "defence"] },
    { id: "outpost_gate", name: "ประตูค่ายลาดตระเวน", make: outpostGate, tags: ["gate", "defence"] },
    { id: "watchtower", name: "หอสังเกตการณ์", make: watchtower, tags: ["tower", "landmark", "defence"] },
    { id: "army_tent", name: "เต็นท์ทหาร", make: armyTent, tags: ["building", "camp"] },
    { id: "campfire", name: "กองไฟค่าย", make: campfire, tags: ["light", "camp"] },
    { id: "signpost", name: "ป้ายบอกทางชายแดน", make: signpost, tags: ["decor"] },
    // the old battlefield
    { id: "catapult_wreck", name: "ซากเครื่องยิงหิน", make: catapultWreck, tags: ["ruin", "decor"] },
    { id: "stake_row", name: "แนวขวากไม้ (4 ม.)", make: stakeRow, tags: ["defence", "wall"] },
    { id: "ruined_tower", name: "ซากหอคอยหิน", make: ruinedTower, tags: ["landmark", "ruin"] },
    { id: "rubble_pile", name: "กองซากหิน", make: rubblePile, tags: ["ruin", "decor"] },
    { id: "scorch_mark", name: "รอยไหม้บนดิน", make: scorchMark, tags: ["ground"] },
    { id: "battle_relics", name: "ซากอาวุธสนามรบ", make: battleRelics, tags: ["ruin", "decor"] },
    // the demon lands
    { id: "dark_crystal", name: "ผลึกมืด", make: darkCrystal, tags: ["crystal", "magic"] },
    { id: "dead_tree", name: "ต้นไม้ตายบิดเบี้ยว", make: deadTree, tags: ["tree", "plant"] },
    { id: "beast_bones", name: "ซากกระดูกอสูร", make: beastBones, tags: ["ruin", "decor"] },
    { id: "glow_crack", name: "รอยแยกเรืองแสง", make: glowCrack, tags: ["ground", "magic"] },
    { id: "demon_gate", name: "ประตูอสูร", make: demonGate, tags: ["landmark", "magic"] },
  ],
  sample,
};

// The same piece with some materials swapped (as the fields' colourways do), for the sample.
function tinted(make: () => Geo, swap: Record<string, string>): THREE.Object3D {
  return solid(make().map((p) => ({ geo: p.geo, mat: swap[p.mat] ?? p.mat })));
}
export const BLIGHT = { Frontier_Ash: "Frontier_Blight", Frontier_Soot: "Frontier_BlightEdge", Frontier_Ember: "Frontier_Abyss", Frontier_Charred: "Frontier_DeadBark" };
export const DARK_ROCK = { Frontier_Rock: "Frontier_Obsidian", Frontier_RockMoss: "Frontier_Obsidian", Frontier_Earth: "Frontier_Blight" };

// A corner of the frontier, from the woods (near, -X) to the demon lands (far, +X): a patrol
// outpost in the red woods on the west (+Y), the old battlefield in the middle with the ruined
// tower and the stake lines facing east, and at the back right the blighted ground with
// crystals, bones, a glowing rift and the demon gate.
function sample(put: Put): void {
  // ---- the outpost in the woods (near left): a palisade with a gate, tower, tents, fire ----
  put("outpost_gate", [-900, 1150, 0], 0);
  for (const y of [1600, 2000, 700]) put("palisade", [-900, y, 0], 0);
  for (const x of [-1100, -1500, -1900]) put("palisade", [x, 500, 0], 90);
  put("watchtower", [-1450, 1900, 0], 0);
  put("army_tent", [-1800, 950, 0], 180);
  put("army_tent", [-1800, 1450, 0], 180);
  put("campfire", [-1300, 1200, 0], 0);
  put("signpost", [-620, 820, 0], 0);
  put("stump", [-680, 1550, 0], 30);
  put("leaf_litter", [-450, 1900, 0], 0);
  put("leaf_litter", [-2000, 250, 0], 60);
  put("leaf_litter", [-600, 300, 0], 140);
  put("leaf_litter", [-150, 1350, 0], 220);
  put("red_maple", [-300, 2050, 0], 0);
  put("red_maple", [-2100, 2100, 0], 120, 0.9);
  put("flora:AutumnTree", [-2100, 1700, 0], 40, 0.9);
  put("red_maple", [-2100, 50, 0], 200, 0.85);
  put("red_maple", [-600, 100, 0], 60, 0.8);
  put("flora:AutumnTree", [100, 2050, 0], 300, 0.85);
  put("red_bush", [-450, 1650, 0], 0);
  put("red_bush", [-1300, 250, 0], 90, 0.8);
  put("red_bush", [-150, 700, 0], 30, 0.7);
  put("fallen_log", [-420, 1150, 0], 20);
  put("boulder", [-150, 1650, 0], 40);
  put("grass_tuft", [-700, 450, 0], 0);
  put("grass_tuft", [-560, 2150, 0], 60);
  put("grass_tuft", [-1150, 750, 0], 20);
  // ---- the old battlefield (near right and middle): stake lines facing east ----
  put("stake_row", [-1500, -650, 0], 90);
  put("stake_row", [-1100, -720, 0], 95);
  put("stake_row", [-700, -640, 0], 86);
  put("stake_row", [-300, -700, 0], 92);
  put("catapult_wreck", [-900, -1500, 0], 200);
  put("scorch_mark", [-1000, -1100, 0], 0);
  put("scorch_mark", [-1750, -1650, 0], 70);
  put("scorch_mark", [-200, -1300, 0], 140, 0.8);
  put("battle_relics", [-1700, -250, 0], 0);
  put("rubble_pile", [-1900, -1100, 0], 30);
  put("grass_tuft", [-1300, -1900, 0], 0);
  put("grass_tuft", [-500, -300, 0], 40);
  put("grass_tuft", [-2000, -200, 0], 70);
  put("grass_tuft", [-1400, -1300, 0], 10);
  put("ruined_tower", [450, 900, 0], 0);
  put("rubble_pile", [700, 200, 0], 120);
  put("flat_rocks", [-100, 300, 0], 30);
  put("rock_cluster", [1000, 1900, 0], 0);
  put("flora:AutumnTree", [1100, 1350, 0], 0, 0.8);
  put("red_bush", [-50, 1950, 0], 200, 0.8);
  put("grass_tuft", [200, 300, 0], 0);
  put("grass_tuft", [1300, 900, 0], 50);
  put("leaf_litter", [800, 1500, 0], 10);
  // ---- the blight and the demon lands (far right) ----
  for (const [x, y, s, h] of [[700, -900, 1.4, 0], [1300, -400, 1.6, 50], [1650, -1300, 1.9, 100], [1000, -1700, 1.5, 150], [1900, -500, 1.4, 20],
    [400, -1500, 1.1, 80], [1700, 200, 1.2, 120], [1200, -1100, 1.6, 200], [2000, -1900, 1.4, 30], [600, -2050, 1.0, 260], [200, -600, 0.8, 300]] as number[][]) {
    put(tinted(scorchMark, BLIGHT), [x, y, 0.4 + (x % 7) * 0.05], h, s);
  }
  put("demon_gate", [1550, -1300, 0], 0, 0.72);
  put("dark_crystal", [650, -450, 0], 0);
  put("dark_crystal", [1950, 350, 0], 100, 0.7);
  put("dark_crystal", [700, -1800, 0], 200, 0.55);
  put("dead_tree", [250, -1050, 0], 0);
  put("dead_tree", [2000, -2050, 0], 120, 0.8);
  put("dead_tree", [1150, 250, 0], 240, 0.7);
  put("beast_bones", [850, -100, 0], 60, 0.8);
  put("glow_crack", [1150, -650, 0], 70);
  put("glow_crack", [400, -1300, 0], 10, 0.7);
  put(tinted(boulder, DARK_ROCK), [350, -2050, 0], 0, 0.8);
  put(tinted(rockCluster, DARK_ROCK), [2050, -900, 0], 60, 0.7);
}

// ---- layout helpers for the frontier's fields (field_border_woods, field_border_line,
// field_demon_land): world cm, north +X, west +Y ----
export type XY = [number, number];

// A polyline rounded off (Chaikin's corner cutting), its ends kept.
export function chaikin(pts: XY[], n = 2): XY[] {
  let p = pts;
  for (let k = 0; k < n; k++) {
    const q: XY[] = [p[0]];
    for (let i = 0; i + 1 < p.length; i++) {
      const [ax, ay] = p[i], [bx, by] = p[i + 1];
      q.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
    }
    q.push(p[p.length - 1]);
    p = q;
  }
  return p;
}

// A strip `width` across along a polyline (a track), as one polygon; `wobble` widens and narrows
// it a little along the way.
export function bandPoly(pts: XY[], width: number, wobble = 0): XY[] {
  const left: XY[] = [], right: XY[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const w = (width + wobble * Math.sin(i * 1.7) * Math.cos(i * 0.6)) / 2;
    left.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
    right.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
  }
  return [...left, ...right.reverse()];
}

// How far a point lies from a polyline.
export function distToPath(pts: XY[], x: number, y: number): number {
  let best = Infinity;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2));
    best = Math.min(best, Math.hypot(ax + dx * t - x, ay + dy * t - y));
  }
  return best;
}

export function insidePoly(poly: XY[], x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// A ramp off a plateau edge: its top at `t` along the edge a -> b (0..1), running `len` out
// from the edge (away from `inside`, a point on the plateau), `width` across.
export function rampOff(a: XY, b: XY, t: number, len: number, width: number, inside: XY): { top: XY; bottom: XY; width: number } {
  const top: XY = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
  if ((inside[0] - top[0]) * nx + (inside[1] - top[1]) * ny > 0) [nx, ny] = [-nx, -ny];
  return { top, bottom: [top[0] + nx * len, top[1] + ny * len], width };
}

// Whether a point is on (or within `margin` of) any ramp.
export function nearRamp(ramps: { top: XY; bottom: XY; width: number }[], x: number, y: number, margin = 150): boolean {
  return ramps.some((r) => distToPath([r.top, r.bottom], x, y) < r.width / 2 + margin);
}

// A polygon with its long edges cut into pieces no longer than `max` (the cliffs' solids are
// one per edge, and a long one would keep the monsters off a wide circle round its middle).
export function subdiv(poly: XY[], max = 600): XY[] {
  const out: XY[] = [];
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / max));
    for (let k = 0; k < n; k++) out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
  }
  return out;
}
