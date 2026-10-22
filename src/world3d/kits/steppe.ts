// The steppe (ทุ่งสเตปป์): the cold north-east grassland round the clan town of Trunrada. Wide
// dry grass in golden tufts and silver feather grass, grey granite boulders capped with lichen,
// wind-bent dead trees, horse bones; the herders' things (rail corrals, troughs, a well sweep,
// hay, signposts hung with blue scarves); an abandoned horse ranch's barn; the old peoples'
// stone idols, burial mounds and the great ruined henge; a plank bridge for the canyon river,
// a beacon tower and sea stacks for the North Sea cliffs.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front facing -X.
// SHAPES gives the solids of the pieces you walk into or through (gates, the henge, the
// bridge), in the item's own frame, for `put(ref, at, h, { solid: SHAPES[id] })`.

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, box, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, sphereCenter, torus, gableWall, rock,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial, FLOWER_CELLS } from "../textures";
import { Cards, shrub } from "../trees";
import type { Lobe, ShrubLook } from "../trees";
import type { SolidSpec } from "../../world";
import type { Paved, Poly } from "../paved";
import type { FieldBuilder } from "../field";
import { protoOf, solidsOf } from "../town";
import { solid } from "./types";
import type { Kit, KitItem, Put } from "./types";
import { KIT as TRUNRADA } from "./trunrada";

// ---- the steppe's own colours ----
defineMaterial("Steppe_Grass", { map: "felt", tint: "#c7b064", rough: 1 });
defineMaterial("Steppe_GrassGreen", { map: "felt", tint: "#8f9a4a", rough: 1 });
defineMaterial("Steppe_GrassDark", { map: "felt", tint: "#6d7a3c", rough: 1 });
defineMaterial("Steppe_Plume", { map: "felt", tint: "#ece4cc", rough: 1 });
defineMaterial("Steppe_Turf", { map: "felt", tint: "#a6a35e", rough: 1, bump: 2 });
defineMaterial("Steppe_Earth", { map: "adobe", tint: "#9c8462", bump: 1.2 });
defineMaterial("Steppe_Rock", { map: "crag", tint: "#b0aa9c", bump: 3 });
defineMaterial("Steppe_RockDark", { map: "crag", tint: "#8f897e", bump: 3 });
defineMaterial("Steppe_RockLichen", { map: "crag", tint: "#a9aa84", bump: 3 });
defineMaterial("Steppe_RockMoss", { map: "crag", tint: "#8f9866", bump: 3 });
defineMaterial("Steppe_Fieldstone", { map: "stone", tint: "#9f9686", bump: 2.5 });
defineMaterial("Steppe_Megalith", { map: "adobe", tint: "#a6a296", bump: 2.5 });
defineMaterial("Steppe_MegalithDark", { map: "adobe", tint: "#86837a", bump: 2.5 });
defineMaterial("Steppe_SeaRock", { map: "crag", tint: "#8e877c", bump: 4 });
defineMaterial("Steppe_Guano", { map: "felt", tint: "#e9e6dc", rough: 1 });
defineMaterial("Steppe_Lichen", { map: "felt", tint: "#a3a47c", rough: 1 });
defineMaterial("Steppe_LichenOrange", { map: "felt", tint: "#b39066", rough: 1 });
defineMaterial("Steppe_Moss", { map: "felt", tint: "#7a8450", rough: 1 });
defineMaterial("Steppe_Trodden", { map: "plaster", tint: "#a39a6c", rough: 1, bump: 0.5 });
defineMaterial("Steppe_Rawhide", { map: "felt", tint: "#5e4632", rough: 0.8 });
defineMaterial("Steppe_WoodOld", { map: "wood", tint: "#a09382", bump: 1.4 });
defineMaterial("Steppe_WoodGrey", { map: "wood", tint: "#b5ad9f", bump: 1.4 });
defineMaterial("Steppe_WoodBleached", { map: "bark", tint: "#c3b8a6", bump: 2.5 });
defineMaterial("Steppe_Bark", { map: "bark", tint: "#6c5945", bump: 2.5 });
defineMaterial("Steppe_Shingle", { map: "shingles", tint: "#7d7466", bump: 2.5 });
defineMaterial("Steppe_Bone", { map: "felt", tint: "#e9e0c8", rough: 0.85 });
defineMaterial("Steppe_Hay", { map: "thatch", tint: "#d9bf6c", bump: 2 });
defineMaterial("Steppe_HayOld", { map: "thatch", tint: "#ae9a62", bump: 2 });
defineMaterial("Steppe_Sage", { map: "felt", tint: "#94a07a", rough: 1 });
defineMaterial("Steppe_SageDark", { map: "felt", tint: "#6a7a4c", rough: 1 });
defineMaterial("Steppe_Bloom", { map: "felt", tint: "#e6c443", rough: 0.9 });
// the sage scrub: small grey-green leaves round a leafy core
defineMaterial("Steppe_SageCore", { map: "foliage", tint: "#6e7c52", rough: 1, bump: 1.5 });
defineMaterial("Steppe_SageCardDark", { card: "leaves", tint: "#6c7c50", rough: 0.95 });
defineMaterial("Steppe_SageCard", { card: "leaves", tint: "#8a9a68", rough: 0.9 });
defineMaterial("Steppe_SageCardLight", { card: "leaves", tint: "#b2bc8a", rough: 0.85 });
defineMaterial("Steppe_Shadow", { tint: "#231c16", rough: 1 });
defineMaterial("Steppe_Paint", { map: "wood", tint: "#3e2d22", bump: 0.6 });
defineMaterial("Steppe_Rune", { tint: "#9fe8ff", rough: 0.4, glow: "#36b9ff", glowI: 1.2 });
defineMaterial("Steppe_Water", { tint: "#36586a", rough: 0.08 });

// ---- helpers ----
function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// boxBounds with its two corners in any order
function bb(a: V3, b: V3, mat: string, bevel = 0): Geo {
  return boxBounds(
    [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2])],
    [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])],
    mat, bevel,
  );
}

// n copies of g turned evenly about Z, the first at `start` degrees
function around(g: Geo, n: number, start = 0): Geo {
  return merge(...Array.from({ length: n }, (_, i) => rotateZ(g, start + (i * 360) / n)));
}

const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// A flat triangle seen from both sides.
function tri(a: V3, b: V3, c: V3, mat: string): Geo {
  const p = [...a, ...b, ...c, ...a, ...c, ...b];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(p), 3));
  geo.computeVertexNormals();
  const span = [0, 1, 2].map((i) => Math.max(a[i], b[i], c[i]) - Math.min(a[i], b[i], c[i]));
  const [u, v] = [0, 1, 2].sort((i, j) => span[j] - span[i]);
  const uv = new Float32Array(12);
  for (let i = 0; i < 6; i++) {
    uv[i * 2] = p[i * 3 + u] / 100;
    uv[i * 2 + 1] = p[i * 3 + v] / 100;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return [{ geo, mat }];
}

// A squashed sphere (foliage, moss pads, straw), centred on `at`.
function blob(at: V3, r: [number, number, number], mat: string, seg = 8): Geo {
  return scale(sphereCenter(1, [0, 0, 0], mat, seg), r).map((p) => ({ geo: p.geo.clone().translate(at[0], at[1], at[2]), mat: p.mat }));
}

// A rock with a cap of lichen or moss on whatever faces up: the same rock again, a hair
// narrower and lifted, shows only where the surface looks at the sky.
function mossRock(size: V3, rough: number, seed: number, mat: string, cap = "Steppe_RockLichen", flat = false, lift = 0): Geo {
  const l = lift || Math.max(2.5, size[2] * 0.035);
  return merge(
    rock(size, rough, seed, mat, flat),
    translate(scale(rock(size, rough, seed, cap, flat), [flat ? 0.93 : 0.965, flat ? 0.93 : 0.965, 1]), [size[0] * 0.05, -size[1] * 0.03, l]),
  );
}

// A tuft of grass blades fanning out from `at`, about 45-100 cm tall at s = 1.
function tuft(at: V3, s: number, seed: number, mats: string[] = ["Steppe_Grass", "Steppe_GrassGreen", "Steppe_Grass"], n = 9): Geo {
  const rnd = seeded(seed);
  const parts: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * 360, d = rnd() * 12 * s, h = (45 + rnd() * 55) * s, lean = 6 + rnd() * 26;
    const blade = cylinderAt({ rBot: 2.6 * s, rTop: 0, height: h, segments: 3, bottom: [0, 0, -2] }, mats[i % mats.length]);
    const r = (a * Math.PI) / 180;
    parts.push(translate(rotateZ(rotateY(blade, lean), a), [at[0] + Math.cos(r) * d, at[1] + Math.sin(r) * d, at[2]]));
  }
  return merge(...parts);
}

// A log from a to b with pale sawn ends.
function log(a: V3, b: V3, r: number, mat = "Steppe_Bark", end = "Steppe_WoodGrey", seg = 8): Geo {
  const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const k = 1.5 / Math.hypot(d[0], d[1], d[2]);
  return merge(
    cylinderBetween(a, b, r, seg, mat),
    cylinderBetween(b, [b[0] + d[0] * k, b[1] + d[1] * k, b[2] + d[2] * k], r * 0.8, seg, end),
    cylinderBetween(a, [a[0] - d[0] * k, a[1] - d[1] * k, a[2] - d[2] * k], r * 0.8, seg, end),
  );
}

// A limb through a list of points, its radius tapering from r0 to r1, with a ball at each joint.
function limb(pts: V3[], r0: number, r1: number, mat: string, seg = 7): Geo {
  const parts: Geo[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const ra = r0 + ((r1 - r0) * i) / (pts.length - 1), rb = r0 + ((r1 - r0) * (i + 1)) / (pts.length - 1);
    parts.push(cylinderBetween(pts[i], pts[i + 1], ra, seg, mat, rb));
    if (i > 0) parts.push(sphereCenter(ra, pts[i], mat, seg));
  }
  return merge(...parts);
}

// A horse skull looking -X, its back of the head at the origin (about 60 cm long).
function horseSkull(mat = "Steppe_Bone"): Geo {
  return merge(
    box([26, 24, 22], [0, 0, 11], mat, 6),
    beamBetween([-8, 0, 12], [-56, 0, 6], 15, 13, mat),
    box([12, 13, 10], [-56, 0, 5], mat, 3),
    box([3, 7, 6], [-14, -9.5, 15], "Steppe_Shadow"),
    box([3, 7, 6], [-14, 9.5, 15], "Steppe_Shadow"),
    box([6, 3, 3], [-58, -3, 9], "Steppe_Shadow"),
    box([6, 3, 3], [-58, 3, 9], "Steppe_Shadow"),
    beamBetween([-6, -10, 2], [-46, -6, -1], 4, 5, mat),
    beamBetween([-6, 10, 2], [-46, 6, -1], 4, 5, mat),
  );
}

// Flames standing on `at`.
function flame(at: V3, s = 1): Geo {
  const tongue = (r: number, h: number, mat: string, tilt: number, turn: number, off: number): Geo =>
    rotateZ(translate(rotateY(cylinderAt({ rBot: r, rTop: 0, height: h, segments: 6, bottom: [0, 0, 0] }, mat), tilt), [off, 0, 0]), turn);
  const f = merge(
    tongue(22, 86, "FireGlow", 0, 0, 0),
    tongue(14, 58, "LanternGlow", 18, 20, 12),
    tongue(13, 50, "FireGlow", 20, 140, 12),
    tongue(12, 46, "LanternGlow", 16, 260, 10),
  );
  return translate(scale(f, [s, s, s]), at);
}

// A spoked cart wheel, its axle along Y through the origin.
function wheel(r: number, spokes = 8, mat = "Steppe_WoodOld"): Geo {
  const spoke = cylinderBetween([0, 0, -r + 3], [0, 0, r - 3], 2.8, 6, mat);
  return merge(
    rotateX(torus(r, 6, 18, 5, mat), 90),
    rotateX(torus(r + 5, 3, 18, 4, "IronDark"), 90),
    ...Array.from({ length: spokes / 2 }, (_, i) => rotateY(spoke, (i * 360) / spokes)),
    rotateX(cylinderAt({ radius: r * 0.2, height: 24, segments: 10, bottom: [0, 0, -12] }, "WoodDark"), 90),
  );
}

// Runes: glowing strokes on a face looking along X at x, `count` glyphs gh tall in a row along
// +Y centred on y0 (or stacked upward when vertical), starting at z0.
const GLYPHS: [number, number, number, number][][] = [
  [[0, 0, 0, 1], [0, 0.75, 0.45, 1], [0, 0.45, 0.45, 0.72]],
  [[0, 0, 0, 1], [0, 0.62, 0.42, 1], [0, 0.62, -0.42, 1]],
  [[0, 0, 0, 1], [0, 1, 0.4, 0.68], [0, 1, -0.4, 0.68]],
  [[-0.4, 0, 0.4, 1], [0.4, 0, -0.4, 1]],
  [[-0.28, 0, -0.28, 1], [0.28, 0, 0.28, 1], [-0.28, 1, 0.28, 0.5], [0.28, 1, -0.28, 0.5]],
  [[0, 0, 0, 1], [0, 1, 0.4, 0.75], [0.4, 0.75, 0, 0.5], [0, 0.5, 0.42, 0]],
  [[0, 0, 0, 1], [-0.35, 0.3, 0.35, 0.7]],
];
function runes(x: number, y0: number, z0: number, gh: number, count: number, seed: number, vertical: boolean): Geo {
  const out: Geo[] = [];
  for (let i = 0; i < count; i++) {
    const g = GLYPHS[(((Math.round(seed) + i * 5) % GLYPHS.length) + GLYPHS.length) % GLYPHS.length];
    const cy = vertical ? y0 : y0 + (i - (count - 1) / 2) * gh * 0.95, cz = vertical ? z0 + i * gh * 1.4 : z0;
    for (const [u0, v0, u1, v1] of g) {
      const a: V3 = [x, cy + u0 * gh * 0.6, cz + v0 * gh], b: V3 = [x, cy + u1 * gh * 0.6, cz + v1 * gh];
      out.push(Math.abs(a[1] - b[1]) < 0.01
        ? bb([x - 1, a[1] - 2.2, Math.min(a[2], b[2]) - 1], [x + 1, a[1] + 2.2, Math.max(a[2], b[2]) + 1], "Steppe_Rune")
        : beamBetween(a, b, 2, 4.4, "Steppe_Rune"));
    }
  }
  return merge(...out);
}

// A great hewn stone: a bevelled block t (X) by w (Y) by h, lichen pads on its top and sides.
function megalith(t: number, w: number, h: number, seed: number, mat = "Steppe_Megalith"): Geo {
  const rnd = seeded(seed);
  const parts: Geo[] = [
    box([t, w, h + 20], [0, 0, (h - 20) / 2], mat, Math.min(14, t * 0.14)),
    blob([(rnd() - 0.5) * t * 0.2, (rnd() - 0.5) * w * 0.3, h - 2], [t * 0.2, w * 0.18, 4], rnd() < 0.5 ? "Steppe_Lichen" : "Steppe_LichenOrange", 7),
  ];
  for (let i = 0; i < 4; i++) {
    const s = i % 2 ? -1 : 1, y = (rnd() - 0.5) * w * 0.6, z = 30 + rnd() * h * 0.6, r = 8 + rnd() * 10;
    parts.push(blob([s * (t / 2), y, z], [2.4, r, r * 1.2], i === 2 ? "Steppe_LichenOrange" : "Steppe_Lichen", 8));
  }
  return merge(...parts);
}

// ================= natural pieces =================

// A big granite boulder with lichen on top, two smaller stones and grass at its foot (2.8 m).
function boulder(): Geo {
  return merge(
    mossRock([270, 225, 195], 0.5, 11, "Steppe_Rock"),
    translate(mossRock([115, 95, 75], 0.5, 12, "Steppe_RockDark", "Steppe_RockMoss"), [125, 92, 0]),
    translate(rock([62, 50, 36], 0.5, 13, "Steppe_Rock"), [-125, -88, 0]),
    translate(rock([42, 34, 24], 0.4, 14, "Steppe_RockDark"), [-70, 128, 0]),
    tuft([-110, 40, 0], 0.8, 15), tuft([60, -120, 0], 0.7, 16), tuft([150, 10, 0], 0.6, 17),
  );
}

// A low flat slab of rock in the grass, with pebbles (3.3 m).
function boulderFlat(): Geo {
  return merge(
    mossRock([330, 245, 90], 0.35, 21, "Steppe_Rock", "Steppe_RockLichen", true),
    translate(rotateZ(mossRock([120, 90, 50], 0.4, 22, "Steppe_RockDark", "Steppe_RockMoss", true), 30), [150, -110, 0]),
    translate(rock([40, 32, 20], 0.4, 23, "Steppe_Rock"), [-170, 60, 0]),
    translate(rock([30, 26, 16], 0.4, 24, "Steppe_RockDark"), [-150, -90, 0]),
    tuft([-60, 130, 0], 0.7, 25), tuft([100, 120, 0], 0.6, 26),
  );
}

// A tumble of rocks of every size (4.2 m).
function rockCluster(): Geo {
  return merge(
    mossRock([190, 160, 150], 0.5, 31, "Steppe_Rock"),
    translate(mossRock([150, 135, 110], 0.5, 32, "Steppe_RockDark", "Steppe_RockMoss"), [-130, 110, 0]),
    translate(mossRock([120, 100, 85], 0.5, 33, "Steppe_Rock"), [110, 120, 0]),
    translate(rotateZ(mossRock([170, 110, 60], 0.4, 34, "Steppe_Rock", "Steppe_RockLichen", true), 40), [70, -140, 0]),
    translate(rock([70, 60, 45], 0.5, 35, "Steppe_RockDark"), [-150, -90, 0]),
    translate(rock([50, 44, 30], 0.5, 36, "Steppe_Rock"), [-40, -190, 0]),
    translate(rock([40, 36, 26], 0.5, 37, "Steppe_RockDark"), [190, 10, 0]),
    tuft([-60, -40, 0], 0.8, 38), tuft([0, 200, 0], 0.7, 39), tuft([-200, 20, 0], 0.6, 40),
  );
}

// A granite tor: weathered blocks piled one on another (4.4 m tall).
function rockSpire(): Geo {
  return merge(
    mossRock([290, 255, 160], 0.35, 41, "Steppe_Rock"),
    translate(rotateZ(mossRock([235, 205, 130], 0.35, 42, "Steppe_RockDark"), 25), [10, -8, 118]),
    translate(rotateZ(mossRock([185, 165, 120], 0.35, 43, "Steppe_Rock"), -15), [-12, 10, 220]),
    translate(rotateZ(mossRock([130, 110, 85], 0.4, 44, "Steppe_RockDark", "Steppe_RockLichen"), 40), [8, 4, 318]),
    translate(rock([90, 70, 60], 0.5, 45, "Steppe_Rock"), [160, -110, 0]),
    translate(rock([60, 50, 40], 0.5, 46, "Steppe_RockDark"), [-150, 120, 0]),
    tuft([-150, -60, 0], 0.8, 47), tuft([120, 140, 0], 0.7, 48),
  );
}

// Feather grass: a golden clump with silver plumes nodding out of it (about 1.2 m).
function grassTuft(): Geo {
  const rnd = seeded(51);
  const parts: Geo[] = [
    blob([0, 0, 0], [26, 24, 12], "Steppe_GrassDark", 7),
    tuft([0, 0, 0], 1.15, 52, ["Steppe_Grass", "Steppe_GrassGreen", "Steppe_Grass", "Steppe_GrassDark"], 26),
  ];
  for (let i = 0; i < 7; i++) {
    const a = rnd() * 360, r = (a * Math.PI) / 180, h = 95 + rnd() * 40, lean = 22 + rnd() * 26;
    const plume = merge(
      cylinderAt({ rBot: 1.4, rTop: 1, height: h * 0.55, segments: 3, bottom: [0, 0, 0] }, "Steppe_Grass"),
      cylinderAt({ rBot: 3.6, rTop: 0, height: h * 0.5, segments: 4, bottom: [0, 0, h * 0.5] }, "Steppe_Plume"),
    );
    parts.push(translate(rotateZ(rotateY(plume, lean), a), [Math.cos(r) * 6, Math.sin(r) * 6, 0]));
  }
  return merge(...parts);
}

// A steppe shrub: woody stems under grey-green sage clumps with a few yellow pea flowers (1.8 m).
const SAGE: ShrubLook = { core: "Steppe_SageCore", dark: "Steppe_SageCardDark", mid: "Steppe_SageCard", light: "Steppe_SageCardLight" };
// Sagebrush: grey-green lobes of small leaves on woody stems, dotted with yellow flowers, grass
// at its foot (the cards keep to the footprint of the old round scrub).
function scrub(): Geo {
  const rnd = seeded(61);
  const parts: Geo[] = [];
  const tips: V3[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rnd() * 0.6, d = 35 + rnd() * 30, z = 45 + rnd() * 40;
    const tip: V3 = [Math.cos(a) * d, Math.sin(a) * d, z];
    tips.push(tip);
    parts.push(cylinderBetween([Math.cos(a) * 6, Math.sin(a) * 6, 0], tip, 4, 5, "Steppe_Bark", 2));
  }
  tips.push([0, 0, 95]);
  const lobes: Lobe[] = [], lo: V3 = [1e9, 1e9, 0], hi: V3 = [-1e9, -1e9, 0];
  tips.forEach((t) => {
    const r = 34 + rnd() * 18;
    for (let k = 0; k < 3; k++) rnd();
    lobes.push([t[0], t[1], t[2] + 4, r * 0.92, r * 0.84, r * 0.6]);
    lo[0] = Math.min(lo[0], t[0] - r * 0.95); lo[1] = Math.min(lo[1], t[1] - r * 0.86);
    hi[0] = Math.max(hi[0], t[0] + r * 0.95); hi[1] = Math.max(hi[1], t[1] + r * 0.86); hi[2] = Math.max(hi[2], t[2] + 4 + r * 0.62 + 6);
  });
  const cards = new Cards();
  cards.clip = { min: lo, max: hi };
  parts.push(shrub({ seed: 67, lobes, leaf: 20, look: SAGE, ragged: 0.55, core: 0.8, cards, flowers: { cells: [FLOWER_CELLS.tinyYellow], n: 14, size: 15 } }));
  parts.push(tuft([60, -50, 0], 0.6, 62), tuft([-55, 60, 0], 0.6, 63));
  return merge(...parts, cards.geo());
}

// A dead tree bent by the wind: a bleached, twisted trunk leaning +X, bare limbs (4.6 m).
function deadTree(): Geo {
  const W = "Steppe_WoodBleached";
  const trunk: V3[] = [[0, 0, 0], [6, 4, 110], [34, 10, 210], [86, 2, 300], [150, -12, 372], [205, -20, 410]];
  return merge(
    cylinderAt({ rBot: 48, rTop: 28, height: 46, segments: 8, bottom: [0, 0, -4] }, W),
    ...[0, 1, 2, 3, 4].map((k) => rotateZ(beamBetween([10, 0, 30], [58, 0, -6], 16, 14, W), k * 72 + 20)),
    limb(trunk, 28, 6, W, 8),
    limb([[34, 10, 210], [-20, 50, 300], [-70, 62, 368], [-92, 80, 392]], 11, 3, W),
    limb([[-20, 50, 300], [10, 100, 350], [20, 128, 380]], 6, 2.5, W, 6),
    limb([[86, 2, 300], [80, 80, 380], [100, 110, 430]], 9, 3, W),
    limb([[86, 2, 300], [140, -70, 330], [190, -110, 330]], 8, 3, W),
    limb([[150, -12, 372], [160, 40, 430], [190, 50, 470]], 6, 2.5, W, 6),
    limb([[20, 8, 160], [-40, -40, 200], [-60, -50, 215]], 7, 3, W, 6),
    // a split in the trunk and a hollow
    box([4, 14, 50], [-27, 0, 70], "Steppe_Shadow"),
    tuft([-60, 30, 0], 0.8, 71), tuft([40, -60, 0], 0.7, 72), tuft([60, 60, 0], 0.6, 73),
    translate(rock([50, 40, 26], 0.5, 74, "Steppe_Rock"), [-70, -50, 0]),
  );
}

// A fallen log, weathered grey, one end snapped (4.6 m along Y).
function fallenLog(): Geo {
  const rnd = seeded(81);
  const parts: Geo[] = [
    cylinderBetween([0, -220, 24], [0, 200, 22], 27, 9, "Steppe_Bark"),
    cylinderBetween([0, -220, 24], [0, -222, 24], 22, 9, "Steppe_WoodGrey"),
    rotateY(cylinderAt({ rBot: 34, rTop: 22, height: 26, segments: 9, bottom: [0, 0, -13] }, "Steppe_Bark"), 90).map((p) => ({ geo: p.geo.clone().translate(0, -235, 24), mat: p.mat })),
  ];
  // the snapped end: splinters
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    parts.push(cylinderBetween([Math.cos(a) * 14, 196, 22 + Math.sin(a) * 14], [Math.cos(a) * 10, 222 + rnd() * 30, 22 + Math.sin(a) * 10], 6, 4, "Steppe_WoodBleached", 0.5));
  }
  // root plate at the -Y end
  for (let k = 0; k < 5; k++) parts.push(rotateX(beamBetween([0, 0, 0], [Math.cos(k * 1.26) * 60, -30, Math.sin(k * 1.26) * 60], 10, 9, "Steppe_Bark"), 0).map((p) => ({ geo: p.geo.clone().translate(0, -240, 26), mat: p.mat })));
  // stubs of branches and moss
  parts.push(cylinderBetween([10, -60, 40], [40, -40, 80], 7, 6, "Steppe_Bark", 4), cylinderBetween([-12, 80, 36], [-50, 100, 50], 6, 6, "Steppe_Bark", 3));
  parts.push(blob([0, -100, 48], [22, 40, 6], "Steppe_Moss"), blob([4, 60, 47], [18, 30, 5], "Steppe_Lichen"));
  parts.push(tuft([-45, -150, 0], 0.7, 82), tuft([45, 20, 0], 0.7, 83), tuft([-40, 140, 0], 0.6, 84));
  return merge(...parts);
}

// A horse's bones bleaching in the grass: skull, spine, ribs, a leg bone (2.3 m).
function bones(): Geo {
  const B = "Steppe_Bone";
  const parts: Geo[] = [translate(rotateZ(horseSkull(), -20), [-80, 20, 0])];
  for (let i = 0; i < 9; i++) parts.push(box([10, 9, 8], [-30 + i * 13, 0, 22 - Math.abs(i - 4) * 1.2], B, 2.5));
  for (let i = 0; i < 7; i++) {
    const x = -16 + i * 13, s = i % 2 ? 1 : -1;
    for (const side of [-1, 1]) {
      if (i === 5 && side > 0) continue;
      parts.push(limb([[x, 0, 20], [x + 2, side * 28, 24], [x + 4, side * 48, 12], [x + 5, side * 54, 0]], 2.6, 1.8, B, 4));
    }
    if (s > 0) parts.push(box([5, 6, 5], [x, 0, 28], B, 1.5));
  }
  parts.push(box([30, 40, 9], [110, 0, 6], B, 3));
  parts.push(limb([[60, 60, 4], [130, 85, 4]], 4, 3.5, B, 6), sphereCenter(6, [60, 60, 5], B, 6), sphereCenter(5.5, [130, 85, 5], B, 6));
  parts.push(limb([[20, -70, 4], [90, -90, 4]], 3.5, 3, B, 6), sphereCenter(5.5, [20, -70, 5], B, 6));
  parts.push(tuft([30, 40, 0], 0.6, 91), tuft([-20, -50, 0], 0.5, 92), tuft([120, -40, 0], 0.5, 93));
  return merge(...parts);
}

// A sea stack: a tall pillar of layered rock standing in the surf, white with the birds (9 m).
function seaStack(): Geo {
  return merge(
    translate(rock([560, 470, 320], 0.3, 101, "Steppe_SeaRock"), [0, 0, -90]),
    translate(rotateZ(rock([440, 380, 330], 0.3, 102, "Steppe_SeaRock"), 20), [20, -10, 150]),
    translate(rotateZ(rock([360, 300, 300], 0.3, 103, "Steppe_SeaRock"), -15), [-10, 14, 390]),
    translate(rotateZ(mossRock([270, 230, 200], 0.35, 104, "Steppe_SeaRock", "Steppe_Guano", false, 9), 30), [10, 0, 620]),
    translate(rock([170, 140, 110], 0.4, 105, "Steppe_SeaRock"), [260, 160, -50]),
    translate(rock([120, 100, 80], 0.4, 106, "Steppe_SeaRock"), [-250, -170, -40]),
    translate(rock([90, 80, 60], 0.4, 107, "Steppe_SeaRock"), [-200, 230, -40]),
  );
}

// ================= the herders' things =================

// A horse corral's rail fence, 6 m along Y (tiles end to end); split rails on the -X face of
// round posts every 2 m, lashed with rawhide. `broken`: a post leaning, rails down.
function corralFence(broken: boolean): Geo {
  const W = "Steppe_WoodOld", G = "Steppe_WoodGrey";
  const parts: Geo[] = [];
  const post = (y: number): Geo => merge(
    cylinderAt({ radius: 9.5, height: 172, segments: 8, bottom: [0, y, -12] }, W),
    cylinderAt({ rBot: 9.5, rTop: 5, height: 8, segments: 8, bottom: [0, y, 160] }, G),
  );
  const rails = [48, 92, 136];
  const lash = (y: number, z: number): Geo => bb([-21, y - 6, z - 4], [9.5, y + 6, z + 4], "Steppe_Rawhide");
  for (const y of [-200, 0, 200]) {
    if (broken && y === 0) {
      parts.push(rotateX(post(0), -18, [0, 0, 0]));
      continue;
    }
    parts.push(post(y));
  }
  rails.forEach((z, i) => {
    const m = i === 1 ? G : W;
    if (!broken) {
      parts.push(bb([-19, -300, z - 7], [-9, 300, z + 7], m, 2));
      for (const y of [-200, 0, 200]) parts.push(lash(y, z));
      return;
    }
    if (i === 0) {
      parts.push(bb([-19, -300, z - 7], [-9, 300, z + 7], m, 2));
      for (const y of [-200, 200]) parts.push(lash(y, z));
    } else if (i === 1) {
      // snapped by the leaning post: one end down in the grass
      parts.push(bb([-19, -300, z - 7], [-9, -40, z + 7], m, 2), lash(-200, z));
      parts.push(beamBetween([-16, 30, 4], [-14, 290, z], 10, 14, m), lash(200, z));
    } else {
      parts.push(bb([-19, 60, z - 7], [-9, 300, z + 7], m, 2), lash(200, z));
      parts.push(beamBetween([-60, -260, 5], [-40, -20, 9], 10, 14, m));
    }
  });
  if (broken) parts.push(tuft([-30, -110, 0], 0.9, 111), tuft([20, 90, 0], 1, 112), tuft([-40, 240, 0], 0.8, 113));
  parts.push(tuft([10, -200, 0], 0.6, 114), tuft([10, 200, 0], 0.55, 115));
  return merge(...parts);
}

// The corral's gateway, 4 m between its posts along Y: tall posts under a crossbeam with a horse
// skull and blue scarves, one leaf swung open inward (+X), the other gone.
function corralGate(): Geo {
  const W = "Steppe_WoodOld", D = "WoodDark";
  const parts: Geo[] = [];
  for (const s of [-1, 1]) {
    parts.push(cylinderAt({ radius: 14, height: 300, segments: 8, bottom: [0, s * 205, -12] }, W));
    parts.push(cylinderAt({ rBot: 14, rTop: 6, height: 12, segments: 8, bottom: [0, s * 205, 288] }, "Steppe_WoodGrey"));
    parts.push(translate(rock([44, 40, 26], 0.5, 120 + s, "Steppe_Rock"), [24, s * 230, 0]));
    parts.push(beamBetween([0, s * 205, 238], [0, s * 160, 276], 9, 10, D));
  }
  parts.push(bb([-12, -265, 268], [12, 265, 290], W, 3));
  parts.push(translate(horseSkull(), [-12, 0, 290]));
  // scarves tied to the beam
  const cloth = ["FabricBlue", "FabricWhite", "FabricBlue", "FabricGold"];
  [-120, -50, 40, 110].forEach((y, i) => parts.push(beamBetween([-14, y, 272], [-18, y + 8, 196 + (i % 2) * 22], 1.5, 12, cloth[i])));
  // the open leaf: frame, rails and a brace, hinged on the +Y post
  const L = 186;
  const leaf = merge(
    bb([-5, -14, 14], [5, 0, 150], D, 1.5),
    bb([-5, -L, 14], [5, -L + 12, 140], D, 1.5),
    ...[26, 78, 130].map((z) => bb([-4, -L, z - 6], [4, 0, z + 6], W, 1.5)),
    beamBetween([0, -L + 10, 24], [0, -14, 132], 6, 9, W),
  );
  parts.push(translate(rotateZ(leaf, 72), [8, 190, 0]));
  for (const z of [36, 128]) parts.push(bb([-4, 186, z - 4], [16, 196, z + 4], "IronDark"));
  // the lost leaf's hinges left on the -Y post
  for (const z of [36, 128]) parts.push(bb([-4, -196, z - 4], [16, -186, z + 4], "IronDark"));
  parts.push(tuft([-20, -240, 0], 0.8, 125), tuft([-10, 245, 0], 0.7, 126));
  return merge(...parts);
}

// A plank water trough on trestles with a bucket (3 m along Y).
function waterTrough(): Geo {
  const W = "Steppe_WoodOld", D = "WoodDark";
  const parts: Geo[] = [
    bb([-34, -150, 26], [34, 150, 34], W, 1.5),
    bb([-34, -150, 34], [-26, 150, 72], W, 1.5),
    bb([26, -150, 34], [34, 150, 72], W, 1.5),
    bb([-34, -150, 34], [34, -142, 72], W, 1.5),
    bb([-34, 142, 34], [34, 150, 72], W, 1.5),
    bb([-26, -142, 34], [26, 142, 62], "Steppe_Water"),
  ];
  for (const y of [-112, 112]) {
    parts.push(bb([-40, y - 4, 64], [40, y + 4, 76], "IronDark"));
    for (const s of [-1, 1]) parts.push(beamBetween([s * 46, y, 0], [-s * 12, y, 30], 9, 9, D));
    parts.push(bb([-40, y - 5, 18], [40, y + 5, 26], D));
  }
  // a bucket at the end and a puddle of trampled mud
  parts.push(translate(merge(
    cylinderAt({ rBot: 15, rTop: 18, height: 32, segments: 10, bottom: [0, 0, 0] }, W),
    cylinderAt({ radius: 18.5, height: 3, segments: 10, bottom: [0, 0, 24] }, "IronDark"),
    cylinderAt({ radius: 16, height: 1, segments: 10, bottom: [0, 0, 28] }, "Steppe_Water"),
    beamBetween([-17, 0, 32], [0, 0, 50], 2, 2, "IronDark"), beamBetween([17, 0, 32], [0, 0, 50], 2, 2, "IronDark"),
  ), [-60, 186, 0]));
  parts.push(bb([-80, -170, 0], [80, 170, 1.2], "Steppe_Earth"));
  parts.push(tuft([60, -160, 0], 0.6, 131), tuft([-60, -170, 0], 0.5, 132));
  return merge(...parts);
}

// A well sweep: a stone well curb, a forked post with a long pole pivoting on it, a lashed stone
// counterweight at the low end and a bucket hanging over the well from the high end (8.5 m).
function wellSweep(): Geo {
  const W = "Steppe_WoodOld";
  const wx = -345, px = 25, cx = 390;
  const C: V3 = [cx, 0, 140], T: V3 = [wx, 0, 640];
  const t = (px - cx) / (wx - cx), pivot = lerp3(C, T, t);
  const parts: Geo[] = [
    // the curb: fieldstone, a timber collar, dark water inside
    rotateZ(cylinderAt({ radius: 82, height: 74, segments: 12, bottom: [wx, 0, 0] }, "Steppe_Fieldstone"), 0),
    cylinderAt({ radius: 70, height: 2, segments: 12, bottom: [wx, 0, 66] }, "Steppe_Shadow"),
  ];
  for (const s of [-1, 1]) {
    parts.push(bb([wx - 92, s * 66 - 8, 74], [wx + 92, s * 66 + 8, 88], W, 2));
    parts.push(bb([wx + s * 66 - 8, -92, 74], [wx + s * 66 + 8, 92, 86], W, 2));
  }
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    parts.push(translate(rock([34, 28, 22], 0.4, 140 + i, i % 2 ? "Steppe_Rock" : "Steppe_RockDark"), [wx + Math.cos(a) * 92, Math.sin(a) * 92, 0]));
  }
  // the forked post, braced with stones
  parts.push(cylinderAt({ rBot: 17, rTop: 13, height: pivot[2] - 30, segments: 8, bottom: [px, 0, -10] }, W));
  for (const s of [-1, 1]) parts.push(cylinderBetween([px, s * 6, pivot[2] - 50], [px, s * 16, pivot[2] + 26], 8, 6, W, 6));
  parts.push(cylinderBetween([px, -26, pivot[2]], [px, 26, pivot[2]], 4, 6, "IronDark"));
  for (let i = 0; i < 5; i++) parts.push(translate(rock([36, 30, 26], 0.4, 150 + i, "Steppe_Rock"), [px + Math.cos(i * 1.3) * 34, Math.sin(i * 1.3) * 34, 0]));
  // the sweep pole and its counterweight
  parts.push(cylinderBetween(C, T, 9, 7, W, 5));
  parts.push(translate(rock([62, 52, 50], 0.4, 160, "Steppe_RockDark"), [cx + 6, 0, C[2] - 52]));
  parts.push(translate(rock([46, 40, 36], 0.4, 161, "Steppe_Rock"), [cx - 18, 10, C[2] - 30]));
  for (const dz of [-20, -40]) parts.push(translate(torus(30, 2.4, 10, 4, "RopeTan"), [cx, 0, C[2] + dz]));
  parts.push(cylinderBetween([cx, 0, C[2]], [cx, 0, C[2] - 30], 3, 5, "RopeTan"));
  // the hanging pole and bucket over the well
  parts.push(cylinderBetween([wx, 0, T[2] - 6], [wx, 0, 150], 3.6, 6, W));
  parts.push(translate(torus(6, 1.5, 8, 4, "IronDark"), [wx, 0, T[2] - 4]));
  parts.push(merge(
    cylinderAt({ rBot: 16, rTop: 20, height: 30, segments: 10, bottom: [wx, 0, 116] }, W),
    cylinderAt({ radius: 20.5, height: 4, segments: 10, bottom: [wx, 0, 120] }, "IronDark"),
    cylinderAt({ radius: 20.5, height: 4, segments: 10, bottom: [wx, 0, 140] }, "IronDark"),
    beamBetween([wx, -20, 146], [wx, 0, 156], 2, 2, "IronDark"), beamBetween([wx, 20, 146], [wx, 0, 156], 2, 2, "IronDark"),
  ));
  // a log trough beside the well and trampled earth
  parts.push(merge(
    cylinderBetween([wx + 120, 130, 22], [wx - 120, 130, 22], 24, 9, "Steppe_Bark"),
    bb([wx - 112, 114, 30], [wx + 112, 146, 47], "Steppe_Water"),
  ));
  parts.push(rotateZ(cylinderAt({ radius: 175, height: 1.2, segments: 14, bottom: [wx, 0, 0] }, "Steppe_Earth"), 0));
  parts.push(tuft([px + 60, 50, 0], 0.7, 162), tuft([cx + 60, -50, 0], 0.7, 163), tuft([-80, -70, 0], 0.6, 164));
  return merge(...parts);
}

// Rectangular hay bales stacked three, two, one, with a fallen one and loose straw (3 m).
function hayBales(): Geo {
  const H = "Steppe_Hay";
  const bale = (x: number, y: number, z: number, turn: number, tilt = 0, mat = H): Geo => translate(rotateY(rotateZ(merge(
    box([104, 56, 50], [0, 0, 25], mat, 7),
    box([4, 58, 52], [-26, 0, 25], "RopeTan"),
    box([4, 58, 52], [26, 0, 25], "RopeTan"),
  ), turn), tilt), [x, y, z]);
  const parts: Geo[] = [];
  for (const x of [-56, 56]) for (const y of [-60, 0, 60]) parts.push(bale(x, y, 0, 90 + (x + y) * 0.03));
  for (const x of [-56, 56]) for (const y of [-30, 30]) parts.push(bale(x * 0.95, y, 50, 90 + y * 0.05));
  parts.push(bale(0, 0, 100, 4));
  parts.push(bale(-150, 70, 0, 30, 0, "Steppe_HayOld"), bale(-140, -100, 0, -60, 0));
  const rnd = seeded(161);
  for (let i = 0; i < 16; i++) {
    const x = -200 + rnd() * 380, y = (rnd() < 0.5 ? -1 : 1) * (100 + rnd() * 70);
    parts.push(translate(rotateZ(bb([-24, -2, 0], [24, 2, 1.6], i % 3 ? H : "Steppe_HayOld"), rnd() * 180), [x, y, 0.4 + (i % 4) * 0.4]));
  }
  parts.push(cylinderBetween([-90, -40, 110], [-180, -60, 10], 2.5, 5, "WoodPale"));
  parts.push(merge(
    cylinderBetween([-178, -64, 8], [-182, -80, 4], 1.5, 4, "IronLight"),
    cylinderBetween([-178, -64, 8], [-190, -72, 4], 1.5, 4, "IronLight"),
  ));
  return merge(...parts);
}

// A signpost on a little cairn: three arrow boards painted with clan marks, a horse skull on
// top, blue and white scarves (3.9 m).
function signpost(): Geo {
  const W = "Steppe_WoodOld";
  const rnd = seeded(171);
  const parts: Geo[] = [
    cylinderAt({ rBot: 62, rTop: 26, height: 58, segments: 9, bottom: [0, 0, 0] }, "Steppe_RockDark"),
    cylinderAt({ radius: 9, height: 370, segments: 8, bottom: [0, 0, 0] }, W),
  ];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * 360 + rnd() * 20, z = i < 6 ? 6 : 34;
    parts.push(rotateZ(translate(rock([42, 36, 30], 0.45, 172 + i, i % 3 ? "Steppe_Rock" : "Steppe_RockDark"), [i < 6 ? 56 : 34, 0, z - 4]), a));
  }
  const arrow = (len: number): Geo => merge(
    bb([-3, 10, -13], [3, len, 13], W, 1.5),
    rotateX(box([6, 18.4, 18.4], [0, len, 0], W), 45, [0, len, 0]),
    bb([-4, 24, -2], [4, len - 12, 2], "Steppe_Paint"),
    bb([-4, 30, -9], [4, 36, 9], "Steppe_Paint"),
    bb([-4, len - 34, -9], [4, len - 28, 9], "Steppe_Paint"),
    bb([-9, 4, -8], [9, 14, 8], "Trunrada_Leather"),
  );
  parts.push(translate(rotateZ(arrow(120), -90), [0, 0, 300]));
  parts.push(translate(rotateZ(arrow(105), 60), [0, 0, 258]));
  parts.push(translate(rotateZ(arrow(110), 165), [0, 0, 216]));
  parts.push(translate(horseSkull(), [4, 0, 370]));
  parts.push(translate(torus(10.5, 2.4, 8, 4, "FabricBlue"), [0, 0, 334]));
  parts.push(beamBetween([-8, 0, 334], [-14, -18, 262], 1.5, 13, "FabricBlue"), beamBetween([6, 6, 333], [16, 22, 276], 1.5, 11, "FabricWhite"));
  parts.push(tuft([-50, 40, 0], 0.7, 181), tuft([40, -50, 0], 0.6, 182));
  return merge(...parts);
}

// ================= the old peoples' stones =================

// A balbal: a stone idol of a warrior, his face to -X, a cup held at his belt, a blue scarf
// round his neck and offerings of stones at his feet (2.4 m).
function stoneIdol(): Geo {
  const M = "Steppe_Megalith", R = "Steppe_MegalithDark";
  const fx = -29;
  const parts: Geo[] = [
    box([56, 74, 186], [0, 0, 78], M, 9),
    box([58, 76, 7], [0, 0, 160], R, 2),
    box([52, 64, 78], [0, 0, 202], M, 15),
    blob([0, 0, 240], [22, 26, 5], "Steppe_Lichen"),
    // the face
    box([8, 48, 8], [fx - 1, 0, 216], R, 2.5),
    box([3, 11, 4], [fx - 1, -12, 208], "Steppe_Shadow"),
    box([3, 11, 4], [fx - 1, 12, 208], "Steppe_Shadow"),
    box([10, 12, 22], [fx - 3, 0, 197], M, 3),
    beamBetween([fx - 4, -3, 186], [fx - 3, -20, 176], 5, 5, R),
    beamBetween([fx - 4, 3, 186], [fx - 3, 20, 176], 5, 5, R),
    box([3, 14, 3], [fx - 1, 0, 178], "Steppe_Shadow"),
    // the arms in relief: the right across the belly holding the cup, the left down to the belt
    beamBetween([fx, -32, 150], [fx - 2, -30, 104], 8, 13, R),
    beamBetween([fx - 2, -30, 104], [fx - 3, -2, 100], 8, 12, R),
    cylinderAt({ rBot: 7, rTop: 10, height: 16, segments: 8, bottom: [fx - 7, 2, 102] }, R),
    beamBetween([fx, 32, 150], [fx - 2, 32, 96], 8, 13, R),
    // belt and a dagger hanging from it
    box([60, 78, 8], [0, 0, 86], R, 2),
    beamBetween([fx - 2, 24, 84], [fx - 3, 28, 44], 4, 7, R),
    // lichen down the sides
    blob([28, 20, 120], [3, 14, 18], "Steppe_Lichen"), blob([-6, -38, 60], [12, 3, 14], "Steppe_LichenOrange"),
    // the scarf
    translate(scale(torus(38, 3, 12, 4, "FabricBlue"), [0.8, 1, 1]), [0, 0, 164]),
    beamBetween([fx - 4, -10, 162], [fx - 6, -16, 112], 1.5, 12, "FabricBlue"),
  ];
  const idol = rotateY(merge(...parts), -3);
  const base: Geo[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * 360 + 10;
    base.push(rotateZ(translate(rock([34, 30, 22], 0.45, 190 + i, i % 2 ? "Steppe_Rock" : "Steppe_RockDark"), [52, 0, -2]), a));
  }
  base.push(translate(rock([24, 20, 14], 0.4, 199, "StoneWhite"), [-62, -16, 0]), translate(rock([20, 18, 12], 0.4, 200, "Steppe_Rock"), [-66, 20, 0]));
  base.push(tuft([30, 50, 0], 0.7, 201), tuft([30, -55, 0], 0.6, 202));
  return merge(idol, ...base);
}

// A kurgan: an old chieftain's grassed burial mound in a ring of kerb stones, a cairn and a
// stone idol on its top looking -X, an offering slab at its foot (12 m).
function kurgan(): Geo {
  const R = 560, H = 340, z0 = -40;
  const zOn = (r: number) => z0 + H * Math.sqrt(Math.max(0, 1 - (r / R) ** 2));
  const rnd = seeded(211);
  const parts: Geo[] = [blob([0, 0, z0], [R, R, H], "Steppe_Turf", 16)];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2 + rnd() * 0.05, r = R + 40;
    parts.push(translate(rotateZ(rock([66 + rnd() * 30, 50, 46 + rnd() * 30], 0.4, 212 + i, i % 3 ? "Steppe_Rock" : "Steppe_RockDark"), (a * 180) / Math.PI), [Math.cos(a) * r, Math.sin(a) * r, -4]));
  }
  for (let i = 0; i < 18; i++) {
    const a = rnd() * Math.PI * 2, r = 100 + rnd() * (R - 160);
    parts.push(tuft([Math.cos(a) * r, Math.sin(a) * r, zOn(r) - 4], 0.9, 240 + i));
  }
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2, r = 160 + rnd() * (R - 240);
    parts.push(translate(rotateZ(rock([50 + rnd() * 30, 40, 26], 0.45, 300 + i, i % 2 ? "Steppe_Rock" : "Steppe_RockDark"), rnd() * 180), [Math.cos(a) * r, Math.sin(a) * r, zOn(r) - 10]));
  }
  // the cairn on the top and the idol before it
  const top = zOn(0);
  parts.push(cylinderAt({ rBot: 90, rTop: 30, height: 70, segments: 9, bottom: [40, 0, top - 18] }, "Steppe_RockDark"));
  for (let i = 0; i < 9; i++) parts.push(rotateZ(translate(rock([40, 36, 30], 0.45, 260 + i, i % 2 ? "Steppe_Rock" : "Steppe_RockDark"), [80, 0, top - 14]), (i / 9) * 360).map((p) => ({ geo: p.geo.clone().translate(40 - 80 * 0, 0, 0), mat: p.mat })));
  parts.push(translate(rock([50, 44, 40], 0.4, 270, "Steppe_Rock"), [40, 0, top + 40]));
  parts.push(cylinderAt({ rBot: 5, rTop: 3, height: 230, segments: 6, bottom: [40, 0, top] }, "BarkBirch"));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    parts.push(cylinderBetween([40, 0, top + 120], [40 + Math.cos(a) * 46, Math.sin(a) * 46, top + 210], 2.4, 5, "BarkBirch", 1.2));
    parts.push(beamBetween([40 + Math.cos(a) * 36, Math.sin(a) * 36, top + 190], [40 + Math.cos(a) * 40, Math.sin(a) * 40 - 30, top + 120], 1.5, 12, i % 2 ? "FabricWhite" : "FabricBlue"));
  }
  parts.push(translate(stoneIdol(), [-90, 0, zOn(90) - 8]));
  // the offering slab and the path up from it
  parts.push(translate(rotateZ(rock([150, 110, 40], 0.3, 280, "Steppe_Megalith", true), 90), [-R - 120, 0, 0]));
  parts.push(translate(horseSkull(), [-R - 110, -20, 22]), translate(rock([22, 20, 14], 0.4, 281, "StoneWhite"), [-R - 130, 34, 20]));
  for (let i = 0; i < 4; i++) parts.push(translate(rock([60, 46, 14], 0.3, 290 + i, "Steppe_Rock", true), [-R + 40 + i * 70, (i % 2 ? 1 : -1) * 10, zOn(R - 40 - i * 70) - 6]));
  return merge(...parts);
}

// A trilithon: two great uprights and a lintel across them, faint runes on the lintel's front;
// the way through runs along X between the uprights (5.7 m tall).
function trilithon(): Geo {
  return merge(
    translate(rotateX(megalith(100, 96, 470, 301), 1.5), [0, -152, 0]),
    translate(rotateX(megalith(100, 96, 470, 302), -1.5), [0, 152, 0]),
    box([112, 430, 92], [0, 0, 512], "Steppe_Megalith", 12),
    blob([10, -60, 557], [26, 44, 4], "Steppe_Lichen"),
    blob([-10, 120, 557], [20, 28, 3], "Steppe_LichenOrange"),
    runes(-56.5, 0, 488, 20, 6, 3, false),
    translate(rock([60, 50, 34], 0.45, 303, "Steppe_Rock"), [70, -220, 0]),
    translate(rock([40, 34, 24], 0.45, 304, "Steppe_RockDark"), [-60, 215, 0]),
    tuft([60, 210, 0], 0.7, 305), tuft([-60, -215, 0], 0.7, 306),
  );
}

// A standing stone toppled and broken: its stump still upright, two pieces in the grass (5 m).
function fallenMenhir(): Geo {
  const M = "Steppe_Megalith";
  return merge(
    box([92, 118, 130], [-200, 0, 55], M, 12),
    ...[[-210, -30], [-190, 20], [-215, 35]].map(([x, y], i) => cylinderAt({ rBot: 26, rTop: 2, height: 34 - i * 6, segments: 4, bottom: [x, y, 112] }, M)),
    translate(rotateZ(rotateY(box([300, 112, 90], [0, 0, 0], M, 12), 4), 6), [20, 0, 34]),
    blob([40, 10, 80], [46, 22, 4], "Steppe_Lichen"),
    translate(rotateZ(rotateY(merge(box([150, 100, 84], [0, 0, 0], M, 12), rotateX(box([60, 70, 70], [80, 0, 0], M, 9), 45, [80, 0, 0])), -6), 28), [260, 50, 30]),
    blob([250, 50, 73], [26, 16, 3], "Steppe_LichenOrange"),
    runes(-246.5, 0, 40, 18, 2, 5, true),
    translate(rock([40, 34, 24], 0.45, 311, "Steppe_Rock"), [150, -90, 0]),
    translate(rock([30, 24, 18], 0.45, 312, "Steppe_MegalithDark"), [130, 100, 0]),
    tuft([-120, 80, 0], 0.8, 313), tuft([100, -80, 0], 0.7, 314), tuft([-250, -80, 0], 0.7, 315),
  );
}

// ---- the great henge (landmark): an outer ring of sixteen uprights under lintels, broken in
// places, a horseshoe of three great trilithons opening to -X round a rune-cut altar stone, a
// low earth bank round it all and the heel stone out before the way in (25 m) ----
const HENGE_R = 880, HENGE_N = 16;
const HENGE_GONE = [5, 11, 12];            // uprights gone from the outer ring
const HENGE_FALLEN = 11;                    // ... this one lies in the grass outside
const HENGE_LEAN = 3;                       // ... this one leans out
const HENGE_LINTELS = [0, 1, 2, 6, 7, 13, 14, 15]; // lintels still up (k joins k and k + 1)
const henge = {
  ring: (k: number): number => ((k + 0.5) / HENGE_N) * 360,
  great: [0, 60, -60],    // the great trilithons' bearings, at radius 470
};
function greatHenge(): Geo {
  const parts: Geo[] = [
    translate(scale(torus(1150, 70, 40, 6, "Steppe_Turf"), [1, 1, 0.45]), [0, 0, -6]),
    cylinderAt({ radius: 1040, height: 2, segments: 40, bottom: [0, 0, 0] }, "Steppe_Trodden"),
  ];
  const upright = (k: number): Geo => megalith(96, 118, 420, 400 + k);
  for (let k = 0; k < HENGE_N; k++) {
    const deg = henge.ring(k);
    if (HENGE_GONE.includes(k)) continue;
    let g = upright(k);
    if (k === HENGE_LEAN) g = rotateY(g, 12);
    parts.push(rotateZ(translate(g, [HENGE_R, 0, 0]), deg));
  }
  // the fallen upright lying outward, broken lintels on the ground
  parts.push(rotateZ(translate(rotateY(box([96, 118, 420], [0, 0, 0], "Steppe_Megalith", 12), 84), [HENGE_R + 260, 0, 40]), henge.ring(HENGE_FALLEN)));
  const chord = 2 * HENGE_R * Math.sin(Math.PI / HENGE_N);
  for (const k of HENGE_LINTELS) {
    const deg = henge.ring(k) + 180 / HENGE_N;
    parts.push(rotateZ(box([90, chord + 30, 66], [HENGE_R * Math.cos(Math.PI / HENGE_N), 0, 453], "Steppe_Megalith", 10), deg));
    if (k % 3 === 0) parts.push(rotateZ(blob([HENGE_R * Math.cos(Math.PI / HENGE_N), (k % 2) * 40 - 20, 485], [22, 34, 3], "Steppe_Lichen"), deg));
  }
  for (const [deg, r, turn] of [[henge.ring(4) + 11, HENGE_R + 140, 30], [henge.ring(10) + 12, HENGE_R - 160, -50], [henge.ring(12) + 10, HENGE_R + 120, 80]])
    parts.push(rotateZ(translate(rotateZ(box([90, chord, 66], [0, 0, 26], "Steppe_Megalith", 10), turn), [r, 0, 0]), deg));
  // the great trilithons, their fronts to the centre
  henge.great.forEach((deg, i) => {
    const tall = i === 0 ? 1.15 : 1;
    const g = merge(
      translate(megalith(110, 110, 520 * tall, 420 + i), [0, -150, 0]),
      translate(megalith(110, 110, 520 * tall, 430 + i), [0, 150, 0]),
      i === 2 ? translate(rotateZ(box([110, 430, 96], [0, 0, 48], "Steppe_Megalith", 12), 20), [-260, 40, -8]) : box([118, 440, 96], [0, 0, 520 * tall + 48], "Steppe_Megalith", 12),
      runes(-55.6, -150, 120, 26, 4, i * 2 + 1, true),
      runes(-55.6, 150, 120, 26, 4, i * 2 + 4, true),
    );
    parts.push(rotateZ(translate(g, [470, 0, 0]), deg));
  });
  // the altar stone at the centre, cut with glowing runes, a bronze bowl of fire on it
  parts.push(box([150, 300, 64], [40, 0, 28], "Steppe_MegalithDark", 10));
  [-90, 0, 90].forEach((y, i) => parts.push(rotateY(runes(0, y, 0, 22, 1, 2 + i * 2, false), -90).map((p) => ({ geo: p.geo.clone().translate(40, 0, 60.5), mat: p.mat }))));
  parts.push(cylinderAt({ rBot: 16, rTop: 30, height: 18, segments: 12, bottom: [40, -110, 60] }, "Bronze"), flame([40, -110, 70], 0.55));
  parts.push(translate(rotateZ(rock([60, 50, 30], 0.3, 440, "StoneWhite", true), 20), [-80, 70, 0]));
  // the heel stone out before the way in, and two rows of small stones along the avenue
  parts.push(translate(rotateY(megalith(130, 150, 360, 450), -8), [-1250, 360, 0]));
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) parts.push(translate(rock([60, 50, 50], 0.45, 460 + i * 2 + (s > 0 ? 1 : 0), "Steppe_Rock"), [-1060 - i * 75, s * 230, 0]));
  // tufts along the bank
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.2;
    parts.push(tuft([Math.cos(a) * 1150, Math.sin(a) * 1150, 14], 0.8, 470 + i));
  }
  return merge(...parts);
}

// The henge's solids: each standing stone, the altar, the fallen stones (item frame).
function hengeShapes(): SolidSpec[] {
  const out: SolidSpec[] = [];
  const at = (r: number, deg: number) => [r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180)];
  for (let k = 0; k < HENGE_N; k++) {
    if (HENGE_GONE.includes(k)) continue;
    const deg = henge.ring(k), [x, y] = at(HENGE_R + (k === HENGE_LEAN ? 40 : 0), deg);
    out.push({ kind: "stone", x, y, w: 104, d: 126, rot: deg });
  }
  {
    const deg = henge.ring(HENGE_FALLEN), [x, y] = at(HENGE_R + 260, deg);
    out.push({ kind: "stone", x, y, w: 430, d: 120, rot: deg });
  }
  henge.great.forEach((deg) => {
    for (const s of [-1, 1]) {
      const r = (deg * Math.PI) / 180;
      out.push({ kind: "stone", x: 470 * Math.cos(r) - s * 150 * Math.sin(r), y: 470 * Math.sin(r) + s * 150 * Math.cos(r), w: 118, d: 118, rot: deg });
    }
  });
  out.push({ kind: "stone", x: 40, y: 0, w: 160, d: 310, rot: 0 });
  out.push({ kind: "stone", x: -1250, y: 360, w: 140, d: 160, rot: 0 });
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) out.push({ kind: "stone", x: -1060 - i * 75, y: s * 230, r: 30 });
  return out;
}

// ---- the barn of the abandoned horse ranch (landmark): board-and-batten walls weathered grey
// on a fieldstone plinth, the big doors on the -X gable end (one swung open, one hanging), a
// hay loft door and hoist beam above, a shingle roof with a hole fallen in over the rafters,
// boarded windows, a loft and hay inside, a cart wheel and fallen boards outside (13 x 9 m) ----
function barnRuin(): Geo {
  const X = 650, Y = 450, zb = 40, zt = 400, roofH = 330, ov = 50, th = 16;
  const Wd = "Steppe_WoodOld", Gr = "Steppe_WoodGrey", D = "WoodDark";
  const parts: Geo[] = [
    bb([-X - 20, -Y - 20, 0], [X + 20, Y + 20, zb], "Steppe_Fieldstone", 5),
    bb([-X + 10, -Y + 10, zb], [X - 10, Y - 10, zb + 3], "Steppe_Earth"),
  ];
  // walls: the long sides, the back, the front either side of the doors (14 cm boards)
  const dW = 190; // half the door opening
  for (const s of [-1, 1]) parts.push(bb([-X, s * Y - 7, zb], [X, s * Y + 7, zt], Wd));
  parts.push(bb([X - 7, -Y, zb], [X + 7, Y, zt], Wd));
  for (const s of [-1, 1]) parts.push(bb([-X - 7, s * dW, zb], [-X + 7, s * Y, zt], Wd));
  parts.push(bb([-X - 7, -dW, zt - 30], [-X + 7, dW, zt], Wd));
  // battens on the outside every 55 cm, corner posts, a girt and the wall plates
  for (let y = -Y + 30; y < Y; y += 55) {
    if (Math.abs(y) > dW + 8) parts.push(bb([-X - 11, y - 3, zb], [-X - 7, y + 3, zt], Gr));
    parts.push(bb([X + 7, y - 3, zb], [X + 11, y + 3, zt], Gr));
  }
  for (let x = -X + 30; x < X; x += 55) for (const s of [-1, 1]) parts.push(bb([x - 3, s * (Y + 7), zb], [x + 3, s * (Y + 11), zt], Gr));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) parts.push(bb([sx * X - 14, sy * Y - 14, zb - 4], [sx * X + 14, sy * Y + 14, zt + 6], D, 2));
  for (const s of [-1, 1]) parts.push(bb([-X - 12, s * (Y + 4) - 9, zt - 14], [X + 12, s * (Y + 4) + 9, zt + 4], D, 2));
  // missing boards (dark gaps) and boarded-up windows along the sides
  for (const [x, s, h] of [[-300, 1, 160], [-270, 1, 120], [180, -1, 200], [420, 1, 90], [-480, -1, 140]] as [number, number, number][])
    parts.push(bb([x - 12, s * (Y + 7.5) - 1, zb + 20], [x + 12, s * (Y + 7.5) + 1, zb + 20 + h], "Steppe_Shadow"));
  for (const s of [-1, 1]) for (const x of [-380, 0, 380]) {
    const y = s * (Y + 8);
    parts.push(bb([x - 50, y - 1.5, 200], [x + 50, y + 1.5, 290], "Steppe_Shadow"));
    parts.push(bb([x - 60, y - 4, 190], [x + 60, y + 4, 200], D), bb([x - 60, y - 4, 290], [x + 60, y + 4, 300], D));
    parts.push(bb([x - 60, y - 4, 190], [x - 50, y + 4, 300], D), bb([x + 50, y - 4, 190], [x + 60, y + 4, 300], D));
    if (x !== 0) parts.push(translate(rotateY(bb([-56, -3, -7], [56, 3, 7], Gr), x > 0 ? 18 : -14), [x, y + s * 4, 245]));
    else parts.push(translate(rotateY(bb([-4, -3, -46], [4, 3, 46], Gr), 12), [x - 70, y + s * 5, 238]));
  }
  // the roof: two slopes, the -Y one with a hole showing the rafters
  const ang = Math.atan2(roofH, Y), slope = (Y + ov) / Math.cos(ang);
  const panel = (x0: number, x1: number, side: 1 | -1, f0: number, f1: number): Geo =>
    translate(rotateX(box([x1 - x0, (f1 - f0) * slope, th], [(x0 + x1) / 2, side * slope * (f0 + f1) / 2, th / 2], "Steppe_Shingle"), (-side * ang * 180) / Math.PI), [0, 0, zt + roofH]);
  const RX = X + ov;
  parts.push(panel(-RX, RX, 1, 0, 1));
  parts.push(panel(-RX, -120, -1, 0, 1), panel(330, RX, -1, 0, 1));
  parts.push(panel(-120, 330, -1, 0, 0.16), panel(-120, 60, -1, 0.72, 1), panel(60, 330, -1, 0.86, 1));
  // rafters under the roof every 60 cm, seen through the hole; a broken one hanging in
  const onSlope = (side: number, f: number, below: number): [number, number] => {
    const d = f * slope;
    return [side * d * Math.cos(ang), zt + roofH - d * Math.sin(ang) - below];
  };
  for (let x = -RX + 40; x < RX; x += 60) {
    const [y0, z0] = onSlope(-1, 0, 6), [y1, z1] = onSlope(-1, 0.96, 6);
    if (x > -100 && x < 120 && x > 40) {
      const [ym, zm] = onSlope(-1, 0.45, 6);
      parts.push(beamBetween([x, y0, z0], [x, ym, zm], 10, 12, D), beamBetween([x, ym, zm], [x + 20, ym - 40, zm - 150], 10, 12, D));
      continue;
    }
    parts.push(beamBetween([x, y0, z0], [x, y1, z1], 10, 12, D));
  }
  for (const f of [0.3, 0.6]) {
    const [y, z] = onSlope(-1, f, 14);
    parts.push(beamBetween([-RX + 30, y, z], [RX - 30, y, z], 8, 8, D));
  }
  parts.push(cylinderBetween([-RX - 10, 0, zt + roofH + 4], [RX + 10, 0, zt + roofH + 4], 12, 8, D));
  parts.push(gableWall(-X, Y, zt, roofH - 4, Wd), gableWall(X, Y, zt, roofH - 4, Wd));
  // bargeboards
  for (const ex of [-1, 1]) for (const s of [-1, 1]) {
    const [y0, z0] = onSlope(s, 1, -th), [y1, z1] = onSlope(s, 0, -th);
    parts.push(beamBetween([ex * (RX + 3), y0, z0], [ex * (RX + 3), y1, z1], 7, 22, D));
  }
  // the front: door frame, a leaf swung open and a leaf hanging askew, the loft door and hoist
  parts.push(bb([-X - 16, -dW - 16, zb], [-X + 4, -dW, zt - 30], D, 2), bb([-X - 16, dW, zb], [-X + 4, dW + 16, zt - 30], D, 2));
  parts.push(bb([-X - 18, -dW - 30, zt - 46], [-X + 4, dW + 30, zt - 26], D, 2));
  const doorLeaf = merge(
    bb([-5, 0, 0], [5, dW - 4, zt - zb - 50], Gr),
    ...[30, 150, 280].map((z) => bb([-9, 4, z], [-5, dW - 8, z + 18], D)),
    beamBetween([-8, 10, 40], [-8, dW - 14, 290], 4, 16, D),
  );
  parts.push(translate(rotateZ(doorLeaf, -105), [-X - 8, dW, zb + 4]));
  parts.push(translate(rotateX(rotateZ(doorLeaf, 180), -9), [-X - 14, -2, zb + 18]));
  parts.push(bb([-X - 8, -dW + 4, zb + 3], [-X + 640, dW - 4, zb + 4], "Steppe_Earth"));
  const zl = zt + 50;
  parts.push(bb([-X - 9, -70, zl], [-X - 6, 70, zl + 140], "Steppe_Shadow"));
  parts.push(bb([-X - 14, -82, zl - 10], [-X - 4, 82, zl], D), bb([-X - 14, -82, zl + 140], [-X - 4, 82, zl + 150], D));
  parts.push(bb([-X - 14, -82, zl], [-X - 4, -70, zl + 140], D), bb([-X - 14, 70, zl], [-X - 4, 82, zl + 140], D));
  parts.push(translate(rotateZ(bb([-4, -70, 0], [4, 0, 136], Gr), -120), [-X - 10, 70, zl + 2]));
  parts.push(bb([-X - 130, -11, zt + roofH - 40], [-X + 20, 11, zt + roofH - 18], D, 2));
  parts.push(translate(rotateX(torus(12, 3, 10, 4, "IronDark"), 90), [-X - 115, 0, zt + roofH - 56]));
  parts.push(cylinderBetween([-X - 115, 0, zt + roofH - 66], [-X - 115, 0, zt + 40], 1.6, 4, "RopeTan"));
  parts.push(translate(rotateX(torus(8, 2, 8, 4, "IronDark"), 90), [-X - 115, 0, zt + 32]));
  // inside: the loft over the back half, a ladder, hay
  parts.push(bb([X - 380, -Y + 8, 300], [X - 8, Y - 8, 312], Gr));
  parts.push(bb([X - 384, -Y + 8, 286], [X - 372, Y - 8, 300], D));
  for (const y of [-200, 0, 200]) parts.push(cylinderAt({ radius: 11, height: 260, segments: 8, bottom: [X - 378, y, zb] }, "Steppe_Bark"));
  for (const s of [-1, 1]) parts.push(beamBetween([X - 470, 120 + s * 26, zb], [X - 386, 120 + s * 26, 320], 6, 6, D));
  for (let i = 1; i < 8; i++) {
    const p = lerp3([X - 470, 0, zb], [X - 386, 0, 320], i / 8);
    parts.push(cylinderBetween([p[0], 94, p[2]], [p[0], 146, p[2]], 2.5, 5, D));
  }
  parts.push(blob([X - 200, -100, 312], [150, 200, 70], "Steppe_HayOld", 10), blob([X - 160, 180, 312], [110, 120, 50], "Steppe_Hay", 9));
  parts.push(blob([-200, -260, zb], [150, 120, 70], "Steppe_HayOld", 9), blob([-60, 300, zb], [100, 90, 40], "Steppe_Hay", 8));
  // outside: a cart wheel against the wall, fallen boards, a barrel, weeds along the walls
  parts.push(translate(rotateX(wheel(62), 14), [-200, Y + 30, 62]));
  for (const [x, y, t] of [[-760, 260, 20], [-800, 300, -10], [-740, -330, 60], [120, -Y - 120, 80], [160, -Y - 90, 95]] as [number, number, number][])
    parts.push(translate(rotateZ(bb([-110, -10, 0], [110, 10, 5], Gr), t), [x, y, 0]));
  parts.push(merge(
    cylinderAt({ rBot: 27, rTop: 30, height: 40, segments: 10, bottom: [-X - 60, -Y + 40, 0] }, Wd),
    cylinderAt({ rBot: 30, rTop: 27, height: 40, segments: 10, bottom: [-X - 60, -Y + 40, 40] }, Wd),
    cylinderAt({ radius: 30.5, height: 5, segments: 10, bottom: [-X - 60, -Y + 40, 14] }, "IronDark"),
    cylinderAt({ radius: 30.5, height: 5, segments: 10, bottom: [-X - 60, -Y + 40, 62] }, "IronDark"),
  ));
  const rnd = seeded(331);
  for (let i = 0; i < 16; i++) {
    const side = i % 4, t = rnd();
    const p: V3 = side === 0 ? [-X + 60 + t * (2 * X - 120), -Y - 30, 0] : side === 1 ? [-X + 60 + t * (2 * X - 120), Y + 30, 0]
      : side === 2 ? [X + 30, -Y + 60 + t * (2 * Y - 120), 0] : [-X - 30, (t < 0.5 ? -1 : 1) * (dW + 60 + rnd() * 150), 0];
    parts.push(tuft(p, 0.8 + rnd() * 0.4, 340 + i));
  }
  return merge(...parts);
}

// A field wall of dry stone, 4 m along Y (tiles end to end), tumbled down in the middle with
// its stones in the grass.
function ruinedWall(): Geo {
  const rnd = seeded(351);
  const height = (y: number) => (y < -60 ? 125 : y < 80 ? 125 - ((y + 60) / 140) * 80 : 45 + ((y - 80) / 120) * 50);
  const parts: Geo[] = [];
  for (let z = 0, c = 0; z < 130; z += 26, c++) {
    let y = -200 + (c % 2 ? 22 : 0);
    while (y < 200) {
      const len = Math.min(200 - y, 44 + rnd() * 30);
      if (len > 14 && z + 26 <= height(y + len / 2) + 6) {
        const mat = rnd() < 0.25 ? "Steppe_RockDark" : rnd() < 0.5 ? "Steppe_Rock" : "Steppe_Fieldstone";
        parts.push(translate(rotateZ(box([54 - c * 3, len - 3, 25], [0, 0, 12.5], mat, 5), (rnd() - 0.5) * 6), [(rnd() - 0.5) * 6, y + len / 2, z]));
      }
      y += len;
    }
  }
  for (let y = -190; y < 200; y += 50) {
    const h = height(y);
    if (h > 90) parts.push(translate(rotateZ(rock([60, 46, 22], 0.3, 360 + Math.round(y), "Steppe_Rock", true), 90), [0, y, Math.floor(h / 26) * 26 - 4]));
  }
  for (let i = 0; i < 7; i++) parts.push(translate(rock([44, 36, 26], 0.45, 380 + i, i % 2 ? "Steppe_Rock" : "Steppe_Fieldstone"), [(i % 2 ? 1 : -1) * (50 + rnd() * 50), -20 + i * 26, 0]));
  parts.push(blob([0, -150, 126], [24, 40, 4], "Steppe_Lichen"), blob([0, 150, 72], [20, 30, 4], "Steppe_Moss"));
  parts.push(tuft([-40, -120, 0], 0.7, 390), tuft([40, 160, 0], 0.7, 391), tuft([45, -40, 0], 0.6, 392));
  return merge(...parts);
}

// A plank bridge for the canyon river, 11 m along X and 4 m across: planks on three stringers,
// two trestles standing in the water, rails both sides, fieldstone abutments at the ends. Its
// deck lies a hand above the ground (walk straight over it); SHAPES has its rails.
function plankBridge(): Geo {
  const L = 550, B = 195, W = "Steppe_WoodOld", G = "Steppe_WoodGrey", D = "WoodDark";
  const rnd = seeded(401);
  const parts: Geo[] = [];
  for (const ex of [-1, 1]) {
    parts.push(bb([ex * (L - 120), -B - 40, -60], [ex * (L + 10), B + 40, 2], "Steppe_Fieldstone", 4));
    for (const s of [-1, 1]) parts.push(translate(rock([70, 60, 50], 0.4, 402 + ex + s, "Steppe_Rock"), [ex * (L - 60), s * (B + 70), -10]));
  }
  for (const y of [-150, 0, 150]) parts.push(bb([-L + 20, y - 11, -28], [L - 20, y + 11, 1], D, 2));
  for (let x = -L + 14; x < L - 10; x += 29) {
    if (Math.abs(x - 120) < 14) continue;
    parts.push(translate(rotateZ(bb([-13, -B - 4, 0], [13, B + 4, 8], rnd() < 0.3 ? G : W, 1.5), (rnd() - 0.5) * 2), [x, 0, (rnd() - 0.5) * 1.2]));
  }
  for (const x of [-200, 200]) {
    for (const y of [-160, -55, 55, 160]) parts.push(cylinderAt({ radius: 11, height: 140, segments: 8, bottom: [x, y, -140] }, D));
    parts.push(bb([x - 9, -B, -40], [x + 9, B, -26], D));
    parts.push(beamBetween([x, -160, -120], [x, 160, -32], 7, 9, D));
  }
  for (const s of [-1, 1]) {
    const y = s * (B + 2);
    for (let x = -L + 40; x <= L - 40; x += 210) {
      parts.push(cylinderAt({ radius: 8, height: 112, segments: 8, bottom: [x, y, 0] }, W));
      parts.push(beamBetween([x, y, 4], [x, y + s * 40, -14], 7, 7, D));
    }
    parts.push(bb([-L + 30, y - 6, 104], [L - 30, y + 6, 116], W, 2));
    parts.push(bb([-L + 30, y - 4, 56], [L - 30, y + 4, 64], G, 1.5));
    parts.push(beamBetween([-L - 40, y + s * 50, 0], [-L + 40, y, 110], 9, 9, W), beamBetween([L + 40, y + s * 50, 0], [L - 40, y, 110], 9, 9, W));
  }
  parts.push(translate(merge(cylinderAt({ radius: 16, height: 12, segments: 8, bottom: [0, 0, 0] }, "RopeTan"), cylinderAt({ radius: 9, height: 13, segments: 8, bottom: [0, 0, 0] }, "Steppe_Shadow")), [-L + 70, B - 30, 8]));
  return merge(...parts);
}

// A beacon tower on the cliffs: a tapering fieldstone tower, a door at its foot, slits, a
// crenellated top round an iron fire basket burning, a flag; a woodpile and a lean-to shed of
// firewood against it (9 m).
function beaconTower(): Geo {
  const S = "Steppe_Fieldstone", D = "WoodDark";
  const rb = 245, rt = 210, z0 = 40, h = 620, zt = z0 + h, c15 = Math.cos(Math.PI / 12);
  const ring12 = (rB: number, rT: number, height: number, z: number, mat: string): Geo =>
    rotateZ(cylinderAt({ rBot: rB, rTop: rT, height, segments: 12, bottom: [0, 0, z] }, mat), 15);
  const rAt = (z: number) => rb + ((rt - rb) * (z - z0)) / h;
  const lean = (Math.atan2(rb - rt, h) * 180) / Math.PI;
  const onFace = (g: Geo, deg: number, z: number): Geo => rotateZ(translate(rotateY(g, lean), [-rAt(z) * c15, 0, z]), deg - 180);
  const parts: Geo[] = [
    ring12(285, 285, z0, 0, "Steppe_RockDark"),
    ring12(rb, rt, h, z0, S),
    ring12(rAt(260) + 6, rAt(274) + 6, 14, 260, "Steppe_RockDark"),
    ring12(rAt(480) + 6, rAt(494) + 6, 14, 480, "Steppe_RockDark"),
    ring12(rt + 26, rt + 26, 34, zt, "Steppe_RockDark"),
    ring12(rt + 14, rt + 14, 6, zt + 34, "Steppe_Earth"),
  ];
  // corbels under the parapet
  parts.push(around(box([40, 30, 34], [rt + 10, 0, zt - 16], "Steppe_RockDark", 4), 12, 0));
  // merlons
  for (let k = 0; k < 12; k++) {
    if (k % 2) continue;
    parts.push(rotateZ(box([34, 2 * (rt + 26) * Math.sin(Math.PI / 12) - 4, 62], [(rt + 12) * c15, 0, zt + 34 + 31], S, 4), k * 30));
  }
  parts.push(around(box([30, 50, 26], [(rt + 12) * c15, 0, zt + 34 + 13], S, 3), 6, 30));
  // the door and slits
  parts.push(onFace(merge(
    bb([-14, -62, 0], [6, 62, 250], "Steppe_RockDark", 3),
    bb([-6, -48, 0], [2, 48, 212], "DoorWood", 1),
    bb([-9, -46, 50], [-6, 46, 62], "IronDark"), bb([-9, -46, 160], [-6, 46, 172], "IronDark"),
    rotateY(torus(7, 1.6, 8, 4, "IronDark"), 90).map((p) => ({ geo: p.geo.clone().translate(-9, 26, 110), mat: p.mat })),
  ), 180, z0));
  parts.push(bb([-rb - 70, -90, 0], [-rb + 10, 90, 22], "Steppe_RockDark", 3), bb([-rb - 40, -80, 22], [-rb + 10, 80, z0], "Steppe_RockDark", 3));
  for (const [deg, z] of [[90, 300], [270, 300], [0, 380], [180, 440], [60, 520], [300, 520]] as [number, number][])
    parts.push(onFace(merge(bb([-6, -14, 0], [4, 14, 74], "Steppe_RockDark", 2), bb([-8, -5, 8], [-5, 5, 66], "Steppe_Shadow")), deg, z));
  // the fire basket
  const zf = zt + 40;
  parts.push(rotateZ(cylinderAt({ rBot: 60, rTop: 46, height: 40, segments: 8, bottom: [0, 0, zf - 4] }, "Steppe_RockDark"), 22.5));
  parts.push(cylinderAt({ rBot: 40, rTop: 70, height: 46, segments: 10, bottom: [0, 0, zf + 36] }, "IronDark"));
  parts.push(around(beamBetween([70, 0, zf + 82], [80, 0, zf + 124], 4, 4, "IronDark"), 8));
  parts.push(translate(torus(80, 3, 14, 4, "IronDark"), [0, 0, zf + 124]));
  for (let i = 0; i < 5; i++) parts.push(rotateZ(cylinderBetween([-50, 0, zf + 84], [50, 0, zf + 96], 9, 6, "Steppe_Bark"), i * 36));
  parts.push(flame([0, 0, zf + 90], 1.3), flame([30, 20, zf + 86], 0.7), flame([-28, -18, zf + 86], 0.75));
  // the flag
  parts.push(cylinderAt({ radius: 5, height: 300, segments: 6, bottom: [120, 120, zt + 34] }, D));
  parts.push(sphereCenter(8, [120, 120, zt + 338], "GoldTrim", 8));
  parts.push(bb([118, 125, zt + 220], [122, 245, zt + 320], "FabricBlue"), bb([117, 125, zt + 312], [123, 245, zt + 320], "FabricWhite"));
  parts.push(tri([120, 245, zt + 220], [120, 245, zt + 320], [120, 280, zt + 270], "FabricBlue"));
  // a woodpile and a lean-to shed against the +Y side
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4 - i; j++) {
    const z = 11 + i * 19, x = -90 + j * 22 + i * 11;
    parts.push(log([x, -rb - 20, z], [x, -rb - 120, z], 10.5, "Steppe_Bark", "WoodPale"));
  }
  const sx = 0, sy = rb + 40;
  for (const x of [sx - 140, sx + 140]) parts.push(cylinderAt({ radius: 9, height: 170, segments: 8, bottom: [x, sy + 110, 0] }, D));
  parts.push(translate(rotateX(box([340, 190, 12], [0, 0, 0], "Steppe_Shingle"), 22), [sx, sy + 70, 210]));
  for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) parts.push(log([sx - 120 + j * 46, sy + 30, 12 + i * 20], [sx - 120 + j * 46, sy + 120, 12 + i * 20], 10, "Steppe_Bark", "WoodPale"));
  parts.push(tuft([-rb - 60, 140, 0], 0.8, 411), tuft([rb + 40, -100, 0], 0.8, 412), tuft([60, -rb - 50, 0], 0.7, 413));
  return merge(...parts);
}

// ================= helpers for the steppe's fields =================
type XY = [number, number];

// a smooth line through the points (Catmull-Rom), a point every ~step cm
export function smooth(pts: XY[], step = 200): XY[] {
  const out: XY[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const n = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// a strip `width` across along a polyline
export function band(pts: XY[], width: number): Poly {
  const left: XY[] = [], right: XY[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    left.push([pts[i][0] + (nx * width) / 2, pts[i][1] + (ny * width) / 2]);
    right.push([pts[i][0] - (nx * width) / 2, pts[i][1] - (ny * width) / 2]);
  }
  return [...left, ...right.reverse()];
}

// an ellipse as a polygon, a little wobbly
export function ellipse(c: XY, rx: number, ry: number, n = 24, wob = 0.06, seed = 1): Poly {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, w = 1 + wob * Math.sin(a * 3 + seed) + wob * 0.6 * Math.cos(a * 5 + seed * 2);
    return [c[0] + Math.cos(a) * rx * w, c[1] + Math.sin(a) * ry * w] as XY;
  });
}

// A plateau's outline cut into short sides near the walkable box (each side is one cliff solid,
// and the monsters keep clear of a solid by half its length), long ones far out in the rim.
export function densify(poly: XY[], max = 260, bound = 5500): XY[] {
  const out: XY[] = [];
  const far = (x: number, y: number) => Math.max(Math.abs(x) - bound, Math.abs(y) - bound, 0);
  const cut = (a: XY, b: XY) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const m: XY = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (len <= max || far(m[0], m[1]) > len / 2 + 700) {
      out.push(a);
      return;
    }
    cut(a, m);
    cut(m, b);
  };
  for (let i = 0; i < poly.length; i++) cut(poly[i], poly[(i + 1) % poly.length]);
  return out;
}

// A run of corral fence from a to b in 6 m pieces, the pieces' fronts (-X) away from `inner`,
// with a corral gate (4.1 m) at each fraction along it in `gates` and broken pieces at the
// indices in `broken`.
export function fenceRun(f: FieldBuilder, a: XY, b: XY, inner: XY, o: { gates?: number[]; broken?: number[] } = {}): void {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
  let h = (Math.atan2(-ux, uy) * 180) / Math.PI;
  const mid: XY = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const fx = -Math.cos((h * Math.PI) / 180), fy = -Math.sin((h * Math.PI) / 180);
  if (fx * (inner[0] - mid[0]) + fy * (inner[1] - mid[1]) > 0) h += 180;
  const spans: [number, number][] = [];
  let from = 0;
  for (const g of (o.gates ?? []).map((t) => t * L).sort((p, q) => p - q)) {
    spans.push([from, g - 205]);
    f.put("steppe:corral_gate", [a[0] + ux * g, a[1] + uy * g], h, { solid: SHAPES.corral_gate });
    from = g + 205;
  }
  spans.push([from, L]);
  let k = 0;
  for (const [s0, s1] of spans) {
    if (s1 - s0 < 60) continue;
    const n = Math.max(1, Math.round((s1 - s0) / 600)), len = (s1 - s0) / n;
    for (let i = 0; i < n; i++, k++) {
      const c = s0 + len * (i + 0.5);
      f.put((o.broken ?? []).includes(k) ? "steppe:corral_fence_broken" : "steppe:corral_fence", [a[0] + ux * c, a[1] + uy * c], h, { sy: len / 600 });
    }
  }
}

// A field's own check (for building it, not the game): pieces standing across a cliff edge,
// solids on a track or in another piece's solids.
export function fieldReport(f: FieldBuilder, ground: Paved): string[] {
  const out: string[] = [];
  const r0 = (v: number) => Math.round(v);
  const all: { i: number; ref: string; s: SolidSpec }[] = [];
  f.puts.forEach((pl, i) => {
    const proto = protoOf(pl.ref, pl.colours);
    const ft = proto.foot;
    const half = (Math.max(ft.x1 - ft.x0, (ft.y1 - ft.y0) * pl.sy) * pl.s) / 2;
    if (pl.solid === "none" || proto.kit === "flora") return;
    if (!f.level(pl.x, pl.y, Math.min(half, 260) * 0.8)) out.push(`not level: ${pl.ref} @${r0(pl.x)},${r0(pl.y)}`);
    for (const s of solidsOf(pl, proto)) {
      if (ground.kind(s.x, s.y) === 1) out.push(`on track: ${pl.ref} @${r0(s.x)},${r0(s.y)}`);
      all.push({ i, ref: pl.ref, s });
    }
  });
  const rad = (s: SolidSpec) => ("r" in s ? s.r : Math.min(s.w, s.d) / 2);
  for (let a = 0; a < all.length; a++)
    for (let b = a + 1; b < all.length; b++) {
      const A = all[a], B = all[b];
      if (A.i === B.i || A.ref.includes("fence") || B.ref.includes("fence") || A.ref.includes("gate") || B.ref.includes("gate")) continue;
      if (Math.hypot(A.s.x - B.s.x, A.s.y - B.s.y) < (rad(A.s) + rad(B.s)) * 0.8) out.push(`overlap: ${A.ref} @${r0(A.s.x)},${r0(A.s.y)} / ${B.ref} @${r0(B.s.x)},${r0(B.s.y)}`);
    }
  // why grid points get no monster: off level ground, on a track or water, near a solid
  const why = { ok: 0, kind: 0, level: 0, near: 0 };
  const solids: SolidSpec[] = [...f.extra, ...f.terrain.solids(), ...all.map((a) => a.s)];
  for (let x = -5100; x < 5100; x += 600)
    for (let y = -5100; y < 5100; y += 600) {
      if (ground.kind(x, y) !== 0) why.kind++;
      else if (!f.terrain.level(x, y, 200)) why.level++;
      else if (solids.some((sp) => Math.hypot(sp.x - x, sp.y - y) < ("r" in sp ? sp.r : Math.hypot(sp.w, sp.d) / 2) + 180)) why.near++;
      else why.ok++;
    }
  out.push(`grid points: ${JSON.stringify(why)}`);
  out.push(`placements ${f.puts.length}, piece solids ${all.length}, extra ${f.extra.length}, spots ${f.spots.length}`);
  return out;
}

// ---- the solids of the pieces you walk into or through (item frame) ----
export const SHAPES: Record<string, SolidSpec[]> = {
  corral_gate: [{ kind: "post", x: 0, y: -205, r: 22 }, { kind: "post", x: 0, y: 205, r: 22 }, { kind: "post", x: 60, y: 140, r: 30 }],
  well_sweep: [{ kind: "well", x: -345, y: 0, r: 95 }, { kind: "post", x: 25, y: 0, r: 28 }, { kind: "post", x: 390, y: 0, r: 40 }],
  barn_ruin: [{ kind: "building", x: 0, y: 0, w: 1340, d: 940, rot: 0 }, { kind: "box", x: -740, y: 250, w: 80, d: 120, rot: 0 }],
  trilithon: [{ kind: "stone", x: 0, y: -152, w: 108, d: 104, rot: 0 }, { kind: "stone", x: 0, y: 152, w: 108, d: 104, rot: 0 }],
  great_henge: hengeShapes(),
  plank_bridge: [{ kind: "rail", x: 0, y: -205, w: 1100, d: 24, rot: 0 }, { kind: "rail", x: 0, y: 205, w: 1100, d: 24, rot: 0 }],
  kurgan: [{ kind: "landmark", x: 0, y: 0, r: 620 }, { kind: "stone", x: -680, y: 0, w: 150, d: 120, rot: 0 }],
  signpost: [{ kind: "post", x: 0, y: 0, r: 50 }],
  beacon_tower: [{ kind: "tower", x: 0, y: 0, r: 290 }, { kind: "box", x: 0, y: 360, w: 340, d: 170, rot: 0 }, { kind: "box", x: -40, y: -320, w: 120, d: 120, rot: 0 }],
  dead_tree: [{ kind: "tree", x: 0, y: 0, r: 40 }],
  boulder: [{ kind: "rock", x: 0, y: 0, r: 125 }, { kind: "rock", x: 125, y: 92, r: 50 }],
  rock_spire: [{ kind: "rock", x: 0, y: 0, r: 140 }],
  sea_stack: [{ kind: "rock", x: 0, y: 0, r: 270 }],
};

// ---- the sample: a corner of the steppe by a herders' camp ----
function sample(put: Put): void {
  const made = new Map<string, THREE.Object3D>();
  const tr = (id: string, at: V3, h = 0, s = 1) => {
    let o = made.get(id);
    if (!o) {
      const item = TRUNRADA.items.find((i) => i.id === id);
      if (!item) return;
      const m = item.make();
      made.set(id, (o = m instanceof THREE.Object3D ? m : solid(m)));
    }
    put(o.clone(), at, h, s);
  };
  // the kurgan on the rise behind, its idols in a row facing the way you come
  put("kurgan", [1250, 900, 0], 0);
  for (const [y, h] of [[-250, 6], [20, -4], [290, 10]] as [number, number][]) put("stone_idol", [400, 1000 + y, 0], h);
  // the corral of the old ranch with its gate, trough and barn
  for (const y of [-600, 0, 600]) put("corral_fence", [-300, -1200 + y, 0], 0);
  put("corral_fence", [900, -1500, 0], 180);
  put("corral_fence_broken", [900, -900, 0], 180);
  for (const x of [-100, 500]) put("corral_fence", [x + 100, -2120, 0], 90);
  put("corral_gate", [700, -680, 0], 90);
  put("water_trough", [300, -1300, 0], 0);
  tr("horse_grazing", [450, -1700, 0], 30);
  tr("horse", [120, -1050, 0], 200);
  put("barn_ruin", [-1500, -1500, 0], 90);
  // the herders' camp round the well
  tr("yurt_small", [-1350, 1450, 0], -20);
  tr("campfire", [-700, 1050, 0], 0);
  tr("drying_rack", [-1250, 600, 0], 70);
  tr("cart", [-500, 1700, 0], 40);
  put("well_sweep", [-150, 400, 0], 75);
  put("hay_bales", [-1700, 300, 0], 10);
  put("signpost", [-600, -150, 0], 0);
  // the old stones and the land itself
  put("trilithon", [1700, -300, 0], 90);
  put("fallen_menhir", [1350, 250, 0], 30);
  put("boulder", [-1900, -400, 0], 20);
  put("rock_cluster", [1900, 1950, 0], 60);
  put("rock_spire", [1900, -1900, 0], 0);
  put("boulder_flat", [-200, 1900, 0], 30);
  put("dead_tree", [-1800, 1950, 0], 120);
  put("fallen_log", [-950, -500, 0], 30);
  put("bones", [600, 300, 0], 40);
  put("ruined_wall", [2000, -900, 0], 0);
  put("scrub", [-300, -600, 0], 0);
  put("scrub", [1000, 1900, 0], 50, 0.8);
  put("scrub", [-2000, 900, 0], 120, 1.1);
  const rnd = seeded(500);
  for (let i = 0; i < 70; i++) {
    const x = -2100 + rnd() * 4200, y = -2100 + rnd() * 4200;
    if (Math.hypot(x - 1250, y - 900) < 750 || (x > -2000 && x < -900 && y < -900)) continue;
    put("grass_tuft", [x, y, 0], rnd() * 360, 0.7 + rnd() * 0.6);
  }
  put("flora:Birch", [-2100, 2100, 0], 0, 1.1);
  put("flora:Birch", [-2000, 1600, 0], 60, 0.9);
  put("flora:PineSmall", [2100, 900, 0], 0, 1);
}

const items: KitItem[] = [
  { id: "boulder", name: "หินแกรนิตก้อนใหญ่", make: boulder, tags: ["rock", "decor"] },
  { id: "boulder_flat", name: "หินแผ่นแบน", make: boulderFlat, tags: ["rock", "decor"] },
  { id: "rock_cluster", name: "กองหินระเกะระกะ", make: rockCluster, tags: ["rock", "decor"] },
  { id: "rock_spire", name: "หินผาซ้อนชั้น", make: rockSpire, tags: ["rock", "landmark"] },
  { id: "grass_tuft", name: "กอหญ้าขนนก", make: grassTuft, tags: ["ground", "plant"] },
  { id: "scrub", name: "พุ่มไม้สเตปป์", make: scrub, tags: ["plant"] },
  { id: "dead_tree", name: "ต้นไม้ตายลู่ลม", make: deadTree, tags: ["plant", "decor"] },
  { id: "fallen_log", name: "ขอนไม้ล้ม", make: fallenLog, tags: ["log", "decor"] },
  { id: "bones", name: "โครงกระดูกม้า", make: bones, tags: ["ground", "decor"] },
  { id: "sea_stack", name: "เสาหินกลางทะเล", make: seaStack, tags: ["rock", "decor"] },
  { id: "corral_fence", name: "รั้วคอกม้า (6 ม.)", make: () => corralFence(false), tags: ["wall", "fence"] },
  { id: "corral_fence_broken", name: "รั้วคอกพัง (6 ม.)", make: () => corralFence(true), tags: ["wall", "fence"] },
  { id: "corral_gate", name: "ประตูคอกม้า (4 ม.)", make: corralGate, tags: ["gate", "fence"] },
  { id: "water_trough", name: "รางน้ำม้า", make: waterTrough, tags: ["decor"] },
  { id: "well_sweep", name: "บ่อน้ำคันโยก", make: wellSweep, tags: ["decor"] },
  { id: "hay_bales", name: "กองฟางอัดก้อน", make: hayBales, tags: ["decor"] },
  { id: "signpost", name: "ป้ายบอกทางผูกผ้า", make: signpost, tags: ["decor", "sign"] },
  { id: "barn_ruin", name: "โรงนาร้าง", make: barnRuin, tags: ["building", "landmark"] },
  { id: "stone_idol", name: "ตุ๊กตาหินโบราณ", make: stoneIdol, tags: ["decor", "magic"] },
  { id: "kurgan", name: "เนินสุสานโบราณ", make: kurgan, tags: ["landmark"] },
  { id: "trilithon", name: "ซุ้มหินโบราณ", make: trilithon, tags: ["landmark", "magic"] },
  { id: "fallen_menhir", name: "หินตั้งล้มแตก", make: fallenMenhir, tags: ["decor"] },
  { id: "great_henge", name: "วงหินมหึมาโบราณ", make: greatHenge, tags: ["landmark", "magic"] },
  { id: "ruined_wall", name: "กำแพงหินพัง (4 ม.)", make: ruinedWall, tags: ["wall"] },
  { id: "plank_bridge", name: "สะพานไม้ข้ามลำธาร", make: plankBridge, tags: ["ground", "bridge"] },
  { id: "beacon_tower", name: "หอไฟสัญญาณริมผา", make: beaconTower, tags: ["tower", "landmark"] },
];

export const KIT: Kit = {
  id: "steppe",
  name: "ทุ่งสเตปป์",
  region: "ตะวันออกเฉียงเหนือ",
  desc: "ทุ่งหญ้าแห้งกว้างสุดตา หินแกรนิตคลุมไลเคน คอกม้าร้าง บ่อน้ำคันโยก ตุ๊กตาหินกับเนินสุสาน และวงหินมหึมาของคนโบราณ",
  ground: "steppe",
  items,
  sample,
};
