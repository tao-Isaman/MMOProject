// ทรุนราดา (Trunrada), the clan town of the cold north-eastern steppe: felt yurts with red
// lattice and painted doors, turf-roofed timber longhouses, a stone windmill on its mound,
// standing stones cut with glowing runes, cairns hung with blue scarves, a carved totem, horse
// gear and drying racks, all behind a palisade of sharpened logs.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front (door,
// sails, banner) facing -X.

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, cylinderCenter, sphereCenter, torus, gableRoof, gableWall, rock,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial } from "../textures";
import type { Kit, Put } from "./types";

// ---- the town's own colours ----
defineMaterial("Trunrada_Turf", { map: "thatch", tint: "#7f9b48", bump: 2.5 });
defineMaterial("Trunrada_Sod", { map: "felt", tint: "#5c4632", rough: 1, bump: 1.5 });
defineMaterial("Trunrada_Dirt", { map: "adobe", tint: "#a08260", bump: 1.2 });
defineMaterial("Trunrada_Log", { map: "bark", tint: "#9a7148", bump: 2.5 });
defineMaterial("Trunrada_Hide", { map: "felt", tint: "#b98c5c", rough: 1, bump: 1 });
defineMaterial("Trunrada_Leather", { map: "felt", tint: "#7a4426", rough: 0.7, bump: 1 });
defineMaterial("Trunrada_Fur", { map: "felt", tint: "#6f4e33", rough: 1, bump: 2 });
defineMaterial("Trunrada_FurGrey", { map: "felt", tint: "#a39d92", rough: 1, bump: 2 });
defineMaterial("Trunrada_FurDark", { map: "felt", tint: "#2f2a27", rough: 1, bump: 2 });
defineMaterial("Trunrada_Bone", { map: "felt", tint: "#ece2c8", rough: 0.8 });
defineMaterial("Trunrada_Hay", { map: "thatch", tint: "#dcc070", bump: 2 });
defineMaterial("Trunrada_Fish", { map: "metal", tint: "#aab5bb", rough: 0.4, metal: 0.35 });
defineMaterial("Trunrada_Ash", { map: "felt", tint: "#4a4541", rough: 1 });
defineMaterial("Trunrada_Lichen", { map: "felt", tint: "#94a05c", rough: 1 });
defineMaterial("Trunrada_Rune", { tint: "#8fe6ff", rough: 0.4, glow: "#2bb8ff", glowI: 1.7 });
defineMaterial("Trunrada_Monolith", { map: "adobe", tint: "#a9a69c", bump: 2.5 });
defineMaterial("Trunrada_MonolithDark", { map: "adobe", tint: "#8c897f", bump: 2.5 });
defineMaterial("Trunrada_PaintBlue", { map: "wood", tint: "#3e6c9a", bump: 1 });
defineMaterial("Trunrada_PaintYellow", { map: "wood", tint: "#dcaa3c", bump: 1 });
defineMaterial("Trunrada_PaintWhite", { map: "wood", tint: "#efe7d4", bump: 1 });
defineMaterial("Trunrada_FeltBlue", { map: "felt", tint: "#3b5d8c", rough: 1 });
defineMaterial("Trunrada_Shadow", { tint: "#2a2119", rough: 1 });
defineMaterial("Trunrada_Meat", { map: "felt", tint: "#8e4426", rough: 0.6 });

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

// A flat triangle seen from both sides (side walls under a lean-to roof, pennants, banner tails).
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

// A log from a to b, its sawn ends pale.
function log(a: V3, b: V3, r: number, mat = "Trunrada_Log", seg = 8): Geo {
  const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const k = 1.5 / Math.hypot(d[0], d[1], d[2]);
  return merge(
    cylinderBetween(a, b, r, seg, mat),
    cylinderBetween(b, [b[0] + d[0] * k, b[1] + d[1] * k, b[2] + d[2] * k], r * 0.8, seg, "WoodPale"),
    cylinderBetween(a, [a[0] - d[0] * k, a[1] - d[1] * k, a[2] - d[2] * k], r * 0.8, seg, "WoodPale"),
  );
}

// A sharpened palisade log standing on z0, h tall to where its point starts.
function stake(x: number, y: number, h: number, r: number, z0 = 0): Geo {
  return merge(
    cylinderAt({ radius: r, height: h + 12, segments: 8, bottom: [x, y, z0 - 12] }, "Trunrada_Log"),
    cylinderAt({ rBot: r, rTop: 1.2, height: r * 2.6, segments: 8, bottom: [x, y, z0 + h] }, "WoodPale"),
  );
}

// Flames: a tall tongue and three smaller ones leaning out, standing on `at`.
function flame(at: V3, s = 1): Geo {
  const tongue = (r: number, h: number, mat: string, tilt: number, turn: number, off: number): Geo =>
    rotateZ(translate(rotateY(cylinderAt({ rBot: r, rTop: 0, height: h, segments: 6, bottom: [0, 0, 0] }, mat), tilt), [off, 0, 0]), turn);
  const f = merge(
    tongue(20, 74, "FireGlow", 0, 0, 0),
    tongue(13, 50, "LanternGlow", 18, 20, 10),
    tongue(12, 44, "FireGlow", 20, 140, 10),
    tongue(11, 40, "LanternGlow", 16, 260, 9),
  );
  return translate(scale(f, [s, s, s]), at);
}

// A spoked wheel with an iron tyre; its axle along Y through the origin.
function wheel(r: number, spokes = 8, mat = "WoodShade"): Geo {
  const spoke = cylinderBetween([0, 0, -r + 3], [0, 0, r - 3], 2.8, 6, mat);
  return merge(
    rotateX(torus(r, 6, 18, 5, mat), 90),
    rotateX(torus(r + 5, 3, 18, 4, "IronDark"), 90),
    ...Array.from({ length: spokes / 2 }, (_, i) => rotateY(spoke, (i * 360) / spokes)),
    rotateX(cylinderCenter(r * 0.2, 24, 10, [0, 0, 0], "WoodDark"), 90),
    rotateX(cylinderCenter(r * 0.1, 30, 8, [0, 0, 0], "IronDark"), 90),
  );
}

// A window in a wall plane x = 0 facing -X: frame, blue panes, cross bars, sill, lintel and
// (optional) open shutters. The opening's bottom is at z = 0, centred on y = 0.
function win(w: number, h: number, shutter?: string, frame = "WoodDark"): Geo {
  const parts: Geo[] = [
    boxAt([10, w + 16, h + 16], [-4, 0, -8], frame, 1.5),
    boxAt([6, w, h], [-7, 0, 0], "GlassBlue"),
    boxAt([8, 5, h], [-8, 0, 0], frame),
    boxAt([8, w, 5], [-8, 0, h / 2 - 2.5], frame),
    boxAt([18, w + 30, 7], [-9, 0, -15], frame, 1.5),
    boxAt([14, w + 26, 10], [-6, 0, h + 8], frame, 1.5),
  ];
  if (shutter)
    for (const s of [-1, 1]) {
      const y = s * (w / 2 + 9 + w / 4);
      parts.push(boxAt([4, w / 2, h + 8], [-2.5, y, -4], shutter, 1));
      parts.push(beamBetween([-5, y - s * w * 0.18, h * 0.12], [-5, y + s * w * 0.18, h * 0.84], 2, 5, frame));
    }
  return merge(...parts);
}

// A plank door in a wall plane x = 0 facing -X, its sill at z = 0.
function door(w: number, h: number, leaf = "DoorWood", frame = "WoodDark"): Geo {
  return merge(
    boxAt([14, 14, h + 4], [-5, -w / 2 - 7, 0], frame, 2),
    boxAt([14, 14, h + 4], [-5, w / 2 + 7, 0], frame, 2),
    boxAt([18, w + 46, 18], [-7, 0, h + 2], frame, 2.5),
    boxAt([7, w, h], [-3, 0, 0], leaf, 1),
    boxAt([2.5, w - 12, 7], [-7.5, 0, h * 0.18], "IronDark"),
    boxAt([2.5, w - 12, 7], [-7.5, 0, h * 0.72], "IronDark"),
    translate(rotateY(torus(6, 1.4, 10, 4, "IronDark"), 90), [-9, w * 0.3, h * 0.47]),
  );
}

// A round shield facing -X, centred on the origin.
function shield(r: number, paint: string, stripe: string): Geo {
  return merge(
    rotateY(cylinderCenter(r, 5, 14, [0, 0, 0], paint), 90),
    box([2, r * 0.42, r * 1.9], [-3, 0, 0], stripe),
    rotateY(torus(r, 2.5, 14, 4, "IronDark"), 90),
    sphereCenter(r * 0.22, [-2, 0, 0], "IronLight", 8),
  );
}

// A small iron lantern standing on the origin (about 40 cm with its ring).
function lantern(): Geo {
  return merge(
    boxAt([20, 20, 3], [0, 0, 0], "IronDark", 0.8),
    boxAt([13, 13, 20], [0, 0, 3], "LanternGlow"),
    ...[[-8, -8], [8, -8], [-8, 8], [8, 8]].map(([x, y]) => boxAt([2.5, 2.5, 22], [x, y, 2], "IronDark")),
    rotateZ(cylinderAt({ rBot: 16, rTop: 3, height: 10, segments: 4, bottom: [0, 0, 24] }, "IronDark"), 45),
    translate(rotateX(torus(4, 1, 8, 4, "IronDark"), 90), [0, 0, 37]),
  );
}

// A carved horse head looking -X, its neck standing on the origin (about 60 cm tall).
function horseHead(mat: string): Geo {
  return merge(
    beamBetween([8, 0, 0], [-2, 0, 40], 14, 20, mat),
    beamBetween([4, 0, 40], [-30, 0, 24], 13, 17, mat),
    box([12, 12, 13], [-32, 0, 20], mat, 3),
    cylinderAt({ rBot: 3.5, rTop: 0.5, height: 12, segments: 4, bottom: [4, -4.5, 45] }, mat),
    cylinderAt({ rBot: 3.5, rTop: 0.5, height: 12, segments: 4, bottom: [4, 4.5, 45] }, mat),
    beamBetween([14, 0, 2], [9, 0, 44], 6, 7, "Trunrada_FurDark"),
    box([4, 14, 4], [-12, 0, 39], "WoodDark"),
  );
}

// A horned skull looking -X, centred on the origin (about 100 cm across the horns).
function skull(): Geo {
  const B = "Trunrada_Bone";
  const horn = (s: number): Geo => merge(
    cylinderBetween([0, s * 12, 10], [-4, s * 34, 16], 5, 6, B, 4),
    cylinderBetween([-4, s * 34, 16], [-8, s * 46, 34], 4, 6, B, 2.5),
    cylinderBetween([-8, s * 46, 34], [-6, s * 44, 48], 2.5, 6, B, 0.5),
  );
  return merge(
    box([26, 30, 26], [0, 0, 8], B, 6),
    box([30, 18, 16], [-22, 0, -6], B, 4),
    box([3, 8, 7], [-12.5, -8, 10], "Trunrada_Shadow"),
    box([3, 8, 7], [-12.5, 8, 10], "Trunrada_Shadow"),
    horn(1), horn(-1),
  );
}

// Antlers on a little plaque, facing -X, mounted at the origin (about 110 cm across).
function antlers(): Geo {
  const B = "Trunrada_Bone";
  const side = (s: number): Geo => merge(
    cylinderBetween([0, s * 6, 0], [-4, s * 34, 26], 3.2, 6, B, 2.6),
    cylinderBetween([-4, s * 34, 26], [-6, s * 44, 62], 2.6, 6, B, 1.6),
    cylinderBetween([-4, s * 26, 18], [-10, s * 22, 42], 2, 5, B, 0.8),
    cylinderBetween([-5, s * 38, 40], [-11, s * 30, 60], 1.8, 5, B, 0.6),
    cylinderBetween([-6, s * 44, 62], [-8, s * 56, 74], 1.6, 5, B, 0.5),
  );
  return merge(box([6, 24, 28], [2, 0, 0], "WoodDark", 2), sphereCenter(8, [-4, 0, 2], B, 8), side(1), side(-1));
}

// A hooped barrel standing on the origin.
function barrel(r = 30, h = 80): Geo {
  return merge(
    cylinderAt({ rBot: r * 0.88, rTop: r, height: h / 2, segments: 12, bottom: [0, 0, 0] }, "WoodWarm"),
    cylinderAt({ rBot: r, rTop: r * 0.88, height: h / 2, segments: 12, bottom: [0, 0, h / 2] }, "WoodWarm"),
    cylinderAt({ radius: r * 0.92 + 1, height: 5, segments: 12, bottom: [0, 0, h * 0.14] }, "IronDark"),
    cylinderAt({ radius: r * 0.94 + 1, height: 5, segments: 12, bottom: [0, 0, h * 0.78] }, "IronDark"),
    cylinderAt({ radius: r * 0.86, height: 1, segments: 12, bottom: [0, 0, h] }, "WoodShade"),
  );
}

// A tied grain sack sitting on `at`.
function sack(at: V3, turn = 0, s = 1): Geo {
  const g = merge(
    scale(sphereCenter(25, [0, 0, 0], "FabricSand", 10), [1.05, 0.85, 1.1]),
    cylinderAt({ rBot: 10, rTop: 6, height: 12, segments: 8, bottom: [0, 0, 22] }, "FabricSand"),
    translate(torus(8, 2, 8, 4, "RopeTan"), [0, 0, 25]),
  );
  return translate(rotateZ(scale(g, [s, s, s]), turn), [at[0], at[1], at[2] + 25 * s]);
}

// A hanging banner facing -X, hung from its top edge at the origin, w wide and h long: gold
// border, the clan sign (a ring round a diamond) and a forked tail.
function bannerCloth(w: number, h: number, cloth = "FabricRed", trim = "FabricGold"): Geo {
  const sz = -h * 0.36, f = -1.7;
  return merge(
    bb([-1.5, -w / 2, -h], [1.5, w / 2, 0], cloth),
    bb([-2.5, -w / 2 - 2, -9], [2.5, w / 2 + 2, 0], trim),
    bb([-2.2, -w / 2, -h + 4], [-1.4, -w / 2 + 6, -9], trim),
    bb([-2.2, w / 2 - 6, -h + 4], [-1.4, w / 2, -9], trim),
    translate(rotateY(torus(w * 0.24, 2.4, 14, 4, trim), 90), [-2, 0, sz]),
    rotateX(box([2, w * 0.2, w * 0.2], [-2.2, 0, sz], trim), 45, [-2.2, 0, sz]),
    tri([f, -w / 2, -h], [f, 0, -h], [f, -w / 4, -h - w * 0.4], cloth),
    tri([f, 0, -h], [f, w / 2, -h], [f, w / 4, -h - w * 0.4], cloth),
  );
}

// The head of a clan standard on a pole top at height z: a horsehair tassel under a gold disc
// and a three-pronged blade.
function spearTop(z: number): Geo {
  const blade = (r: number, h: number): Geo => scale(rotateZ(cylinderAt({ rBot: r, rTop: 0, height: h, segments: 4, bottom: [0, 0, 0] }, "IronLight"), 45), [0.4, 1, 1]);
  return merge(
    cylinderAt({ rBot: 24, rTop: 9, height: 44, segments: 10, bottom: [0, 0, z - 46] }, "Trunrada_FurDark"),
    cylinderAt({ radius: 16, height: 4, segments: 12, bottom: [0, 0, z - 4] }, "GoldTrim"),
    sphereCenter(7, [0, 0, z + 4], "GoldTrim", 8),
    box([6, 34, 6], [0, 0, z + 12], "IronLight"),
    translate(blade(9, 46), [0, 0, z + 10]),
    ...[-1, 1].map((s) => rotateX(translate(blade(6, 26), [0, s * 15, z + 12]), -s * 16, [0, s * 15, z + 12])),
  );
}

// Runes: glowing strokes on a face that looks along X at x, `count` glyphs gh tall, centred on
// y0, starting at z0 and stacked upward (or in a row along +Y when not vertical).
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
    const g = GLYPHS[(seed + i * 5) % GLYPHS.length];
    const cy = vertical ? y0 : y0 + (i - (count - 1) / 2) * gh * 0.95, cz = vertical ? z0 + i * gh * 1.4 : z0;
    for (const [u0, v0, u1, v1] of g) {
      const a: V3 = [x, cy + u0 * gh * 0.6, cz + v0 * gh], b: V3 = [x, cy + u1 * gh * 0.6, cz + v1 * gh];
      out.push(Math.abs(a[1] - b[1]) < 0.01
        ? bb([x - 1, a[1] - 2.2, Math.min(a[2], b[2]) - 1], [x + 1, a[1] + 2.2, Math.max(a[2], b[2]) + 1], "Trunrada_Rune")
        : beamBetween(a, b, 2, 4.4, "Trunrada_Rune"));
    }
  }
  return merge(...out);
}

// A rough-hewn standing stone: a bevelled slab t thick (X) and w wide (Y) with a pointed,
// slanting top, lichen, a little lean and (runeFace -1 / +1) runes on its -X or +X face.
function menhir(w: number, t: number, h: number, seed: number, runeFace = 0, mat = "Trunrada_Monolith"): Geo {
  const rnd = seeded(seed);
  const hb = h * 0.8;
  const parts: Geo[] = [
    box([t, w, hb + 10], [0, 0, (hb - 10) / 2], mat, 9),
    translate(rotateX(box([t - 4, w * 0.7, w * 0.7], [0, 0, 0], mat, 7), 45 + (rnd() - 0.5) * 24), [0, (rnd() - 0.5) * w * 0.16, hb - 4]),
  ];
  for (let i = 0; i < 5; i++) {
    const s = i % 2 ? -1 : 1, y = (rnd() - 0.5) * w * 0.6, z = 20 + rnd() * hb * 0.7, r = 7 + rnd() * 9;
    parts.push(scale(sphereCenter(1, [0, 0, 0], "Trunrada_Lichen", 8), [2, r, r * 1.2]).map((p) => ({ geo: p.geo.clone().translate(s * (t / 2), y, z), mat: p.mat })));
  }
  if (runeFace) parts.push(runes(runeFace * (t / 2 + 0.4), 0, hb * 0.2, Math.min(28, w * 0.26), 3, seed, true));
  parts.push(translate(rock([36, 30, 20], 0.45, seed + 7, "MossStone"), [t / 2 + 12, w * 0.3, -3]));
  parts.push(translate(rock([30, 26, 16], 0.45, seed + 9, "StoneGrey"), [-t / 2 - 10, -w * 0.32, -3]));
  return rotateX(rotateY(merge(...parts), (rnd() - 0.5) * 5), (rnd() - 0.5) * 5);
}

// ---- yurts ----
// A felt yurt on a timber floor: the red lattice showing under the rolled-up skirt, rope bands,
// a painted band of diamonds under the eaves, the felt roof with its cover ropes, the crown ring
// and a stove pipe; a painted double door on the -X face. The chief's is bigger, red and gold,
// with a canopy, two clan standards and a rug at the door.
function yurt(chief: boolean): Geo {
  const r = chief ? 470 : 300, wallH = chief ? 250 : 212, roofH = chief ? 225 : 150;
  const SEG = 16, TURN = 180 / SEG, C = Math.cos(Math.PI / SEG);
  const ap = r * C, face = 2 * r * Math.sin(Math.PI / SEG);
  const z0 = 14, zFelt = z0 + (chief ? 46 : 38), zTop = z0 + wallH, eave = r + 32, crownR = chief ? 76 : 54;
  const ring = (rad: number, h: number, z: number, mat: string, rTop = rad): Geo =>
    rotateZ(cylinderAt({ rBot: rad, rTop, height: h, segments: SEG, bottom: [0, 0, z] }, mat), TURN);
  const band = (rad: number, tube: number, z: number, mat: string): Geo => translate(rotateZ(torus(rad, tube, SEG, 6, mat), TURN), [0, 0, z]);
  // a copy on every face but the door's (built on the +X face)
  const faces = (g: Geo): Geo => merge(...Array.from({ length: SEG - 1 }, (_, i) => rotateZ(g, ((i + SEG / 2 + 1) * 360) / SEG)));

  const parts: Geo[] = [
    ring(r + 22, z0, 0, "WoodShade"),
    ring(r - 8, zFelt - z0 + 4, z0, "Trunrada_Shadow"),
    ring(r, zTop - zFelt, zFelt, "FeltCream"),
    band(r + 3, 7, zFelt + 2, "FeltCream"),
  ];
  const lat = (y0: number, za: number, y1: number, zb: number): Geo => beamBetween([ap - 1, y0, za], [ap - 1, y1, zb], 3.5, 4.5, "WoodRed");
  parts.push(faces(merge(
    lat(-face / 2, z0 + 2, 0, zFelt - 2), lat(0, z0 + 2, face / 2, zFelt - 2),
    lat(-face / 2, zFelt - 2, 0, z0 + 2), lat(0, zFelt - 2, face / 2, z0 + 2),
  )));
  // rope bands and the painted band
  const fz = (t: number) => zFelt + (zTop - zFelt) * t;
  parts.push(band(r + 1.5, 2.4, fz(0.28), "RopeTan"));
  if (chief) parts.push(band(r + 1.5, 2.4, fz(0.5), "RopeTan"));
  const bz = zTop - 54, bandMat = chief ? "FeltRed" : "Trunrada_FeltBlue", motif = chief ? "FabricGold" : "FeltCream";
  parts.push(ring(r + 1.2, 34, bz, bandMat), band(r + 2, 1.8, bz, motif), band(r + 2, 1.8, bz + 34, motif));
  const dx = (r + 1.2) * C + 1.2;
  parts.push(faces(rotateX(box([3, 14, 14], [dx, 0, bz + 17], motif), 45, [dx, 0, bz + 17])));

  // roof: felt cone, valance at the eave, cover ropes, crown ring and stove pipe
  const coneR = (t: number) => eave + (crownR - eave) * t;
  parts.push(ring(eave, roofH, zTop, "FeltCream", crownR));
  parts.push(ring(eave + 0.6, 20, zTop - 20, chief ? "FeltRed" : "FeltCream"));
  parts.push(band(eave + 1.2, 2.2, zTop - 20, chief ? "FabricGold" : "RopeTan"));
  if (chief) {
    parts.push(ring(coneR(0.4) + 2, roofH * 0.16, zTop + roofH * 0.4, "FeltRed", coneR(0.56) + 2));
    parts.push(band(coneR(0.4) + 2.5, 1.8, zTop + roofH * 0.4, "FabricGold"), band(coneR(0.56) + 2.5, 1.8, zTop + roofH * 0.56, "FabricGold"));
  }
  const onRoof = (t: number): V3 => [coneR(t) * C + 2.4, 0, zTop + roofH * t + 1.2];
  parts.push(around(beamBetween(onRoof(0.03), onRoof(0.96), 4.5, 3, "RopeTan"), 8));
  const zc = zTop + roofH;
  parts.push(band(crownR + 3, 9, zc + 1, "WoodRed"));
  parts.push(ring(crownR - 2, 3, zc, "Trunrada_Shadow"));
  parts.push(boxAt([crownR * 2 + 4, 7, 7], [0, 0, zc + 2], "WoodRed"), boxAt([7, crownR * 2 + 4, 7], [0, 0, zc + 2], "WoodRed"));
  const pipeH = chief ? 130 : 105, sp: V3 = [crownR * 0.45, crownR * 0.45, zc - 6];
  parts.push(cylinderAt({ radius: 8, height: pipeH, segments: 8, bottom: sp }, "IronDark"));
  parts.push(cylinderAt({ rBot: 17, rTop: 5, height: 12, segments: 8, bottom: [sp[0], sp[1], sp[2] + pipeH] }, "IronDark"));

  // the painted double door on the -X face
  const dW = chief ? 112 : 92, dH = chief ? 196 : 178, fx = -ap;
  parts.push(
    bb([fx - 13, -dW / 2 - 16, 0], [fx + 5, -dW / 2, z0 + dH], "LacquerRed", 2),
    bb([fx - 13, dW / 2, 0], [fx + 5, dW / 2 + 16, z0 + dH], "LacquerRed", 2),
    bb([fx - 16, -dW / 2 - 26, z0 + dH], [fx + 5, dW / 2 + 26, z0 + dH + 20], "LacquerRed", 2.5),
    bb([fx - 16, -dW / 2 - 10, 0], [fx + 5, dW / 2 + 10, z0], "WoodDark", 2),
  );
  for (const s of [-1, 1]) {
    const yc = (s * dW) / 4;
    parts.push(bb([fx - 7, yc - dW / 4 + 0.5, z0], [fx - 1, yc + dW / 4 - 0.5, z0 + dH], "WoodRed", 1));
    for (const t of [0.14, 0.86]) parts.push(bb([fx - 8.5, yc - dW / 4 + 8, z0 + dH * t - 2], [fx - 6.5, yc + dW / 4 - 8, z0 + dH * t + 2], "FabricGold"));
    parts.push(rotateX(box([2, dW * 0.2, dW * 0.2], [fx - 7.5, yc, z0 + dH * 0.5], "FabricGold"), 45, [fx - 7.5, yc, z0 + dH * 0.5]));
    parts.push(sphereCenter(3.2, [fx - 9, s * 7, z0 + dH * 0.5], "GoldTrim", 8));
  }
  parts.push(cylinderBetween([fx - 10, -dW / 2 - 8, z0 + dH + 29], [fx - 10, dW / 2 + 8, z0 + dH + 29], 8.5, 8, "FeltCream"));
  for (const s of [-1, 1]) parts.push(cylinderBetween([fx - 10, s * (dW / 2 - 6), z0 + dH + 18], [fx - 10, s * (dW / 2 - 6), z0 + dH + 40], 10, 8, "RopeTan"));

  if (chief) {
    // a red gateway before the door: posts, a crossbar with a short gold-fringed valance
    const cx = fx - 150, py = dW / 2 + 52;
    for (const s of [-1, 1]) {
      parts.push(cylinderAt({ radius: 7, height: 250, segments: 8, bottom: [cx, s * py, 0] }, "LacquerRed"));
      for (const z of [60, 210]) parts.push(cylinderAt({ radius: 8.5, height: 6, segments: 8, bottom: [cx, s * py, z] }, "GoldTrim"));
      parts.push(sphereCenter(9, [cx, s * py, 266], "GoldTrim", 8));
      // guy beams back to the wall
      parts.push(beamBetween([cx, s * py, 236], [fx - 6, s * (dW / 2 + 20), z0 + dH + 10], 6, 6, "LacquerRed"));
    }
    parts.push(bb([cx - 7, -py - 22, 240], [cx + 7, py + 22, 254], "LacquerRed", 2));
    parts.push(bb([cx - 9, -py + 8, 210], [cx - 6, py - 8, 240], "FeltRed"), bb([cx - 10, -py + 8, 204], [cx - 8, py - 8, 212], "FabricGold"));
    for (const y of [-40, 0, 40]) parts.push(rotateX(box([2, 12, 12], [cx - 10, y, 225], "FabricGold"), 45, [cx - 10, y, 225]));
    // two clan standards
    for (const s of [-1, 1]) {
      const bx = fx - 200, by = s * (py + 75);
      parts.push(translate(merge(
        cylinderAt({ rBot: 26, rTop: 20, height: 22, segments: 8, bottom: [0, 0, 0] }, "StoneGrey"),
        cylinderAt({ radius: 6, height: 560, segments: 8, bottom: [0, 0, 0] }, "WoodDark"),
        spearTop(560),
        bb([-4, 0, 466], [4, s * 92, 474], "WoodDark", 1.5),
        translate(bannerCloth(70, 230), [0, s * 48, 466]),
      ), [bx, by, 0]));
    }
    // a red rug at the door
    parts.push(bb([fx - 175, -dW / 2 - 40, 0], [fx - 18, dW / 2 + 40, 1.6], "FabricGold"), bb([fx - 170, -dW / 2 - 35, 0], [fx - 23, dW / 2 + 35, 2.4], "FeltRed"));
  } else {
    // a little woodpile against the +Y side
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3 - i; j++) {
      const y = r + 30 + j * 21 + i * 10.5, z = 10 + i * 18;
      parts.push(log([-55, y, z], [55, y, z], 10));
    }
  }
  return merge(...parts);
}

// ---- longhouse: timber staves on a stone plinth under a two-layer turf roof (ridge along X)
// with a turf ridge roll, eave logs and grass tufts; the door in the -X gable end under crossed
// dragon bargeboards and a horned skull, shields, shuttered windows down the sides, a woodpile ----
function longhouse(): Geo {
  const L = 690, W = 340, zb = 45, zt = 300, roofH = 330, ov = 50;
  const parts: Geo[] = [
    boxBounds([-L - 24, -W - 24, 0], [L + 24, W + 24, zb], "StoneGrey", 5),
    boxBounds([-L, -W, zb], [L, W, zt], "WoodWarm", 2),
  ];
  for (const x of [-575, -345, -115, 115, 345, 575]) for (const s of [-1, 1]) parts.push(boxAt([20, 12, zt - zb], [x, s * (W + 5), zb], "WoodDark", 2));
  for (const y of [-130, 130]) for (const s of [-1, 1]) parts.push(boxAt([12, 20, zt - zb], [s * (L + 5), y, zb], "WoodDark", 2));
  for (const s of [-1, 1]) {
    parts.push(boxAt([2 * L + 20, 16, 16], [0, s * (W + 7), zb], "WoodDark", 2), boxAt([2 * L + 20, 16, 18], [0, s * (W + 7), zt - 18], "WoodDark", 2));
    parts.push(boxAt([16, 2 * W + 20, 18], [s * (L + 7), 0, zt - 18], "WoodDark", 2));
    parts.push(bb([L - 1, s * 82, zb], [L + 15, s * (W + 10), zb + 16], "WoodDark", 2), bb([-L - 15, s * 82, zb], [-L + 1, s * (W + 10), zb + 16], "WoodDark", 2));
  }
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) parts.push(cylinderAt({ radius: 22, height: zt - zb + 20, segments: 10, bottom: [sx * L, sy * W, zb - 4] }, "Trunrada_Log"));

  // the roof: bark-and-sod under turf, a turf ridge roll, eave logs and tufts
  const a = Math.atan2(roofH, W), cosA = Math.cos(a), tanA = roofH / W, th = 42;
  const top = zt + roofH + th / cosA;
  parts.push(
    gableRoof([2 * L, 2 * W, 12], [0, 0, zt], roofH, ov, "Trunrada_Sod"),
    gableRoof([2 * L - 8, 2 * W, 30], [0, 0, zt + 12 / cosA], roofH, ov - 4, "Trunrada_Turf"),
    cylinderBetween([-L - ov + 8, 0, top - 24], [L + ov - 8, 0, top - 24], 32, 8, "Trunrada_Turf"),
    gableWall(-L, W, zt, roofH - 2, "WoodShade"),
    gableWall(L, W, zt, roofH - 2, "WoodShade"),
  );
  for (const s of [-1, 1]) {
    const d = W + ov - 28, z = zt + roofH - d * tanA + th / cosA + 2;
    parts.push(cylinderBetween([-L - ov + 4, s * d, z], [L + ov - 4, s * d, z], 9, 8, "Trunrada_Log"));
  }
  const rnd = seeded(21);
  for (let i = 0; i < 16; i++) {
    const s = i % 2 ? 1 : -1, d = 60 + rnd() * (W - 60), x = (rnd() - 0.5) * (2 * L - 120);
    const z = zt + roofH - d * tanA + th / cosA - 3;
    parts.push(scale(sphereCenter(1, [0, 0, 0], i % 3 ? "LeafGreen" : "PineNeedle", 8), [24 + rnd() * 18, 20 + rnd() * 10, 10]).map((p) => ({ geo: p.geo.clone().translate(x, s * d, z), mat: p.mat })));
  }
  // crossed bargeboards at the gable ends ending in dragon heads, a smoke hole under them
  const c = th / 2 / cosA;
  for (const ex of [-1, 1]) {
    const x = ex * (L + ov + 6);
    for (const s of [-1, 1]) {
      const zl = (y: number) => zt + roofH - s * y * tanA + c;
      const y0 = s * (W + ov + 8), y1 = -s * 92;
      const p0: V3 = [x, y0, zl(y0)], p1: V3 = [x, y1, zl(y1)];
      const tip: V3 = [x, y1 - s * 30, p1[2] + 2];
      parts.push(beamBetween(p0, p1, 9, 28, "WoodDark"), beamBetween(p1, tip, 10, 22, "WoodDark"));
      parts.push(box([12, 14, 12], [x, tip[1] - s * 4, tip[2] - 8], "WoodRed", 3), box([13, 5, 5], [x, p1[1] - s * 6, p1[2] + 8], "Trunrada_PaintYellow"));
    }
    parts.push(bb([ex * (L + 1), -34, zt + roofH - 120], [ex * (L + 5), 34, zt + roofH - 80], "Trunrada_Shadow"));
    parts.push(bb([ex * (L + 1), -42, zt + roofH - 128], [ex * (L + 8), 42, zt + roofH - 120], "WoodDark"));
  }
  parts.push(boxAt([56, 70, 46], [L * 0.4, 0, top - 30], "WoodDark", 2), gableRoof([66, 74, 6], [L * 0.4, 0, top + 16], 26, 8, "WoodShade"));

  // the front gable end: steps, door, carved lintel, shields and the skull
  parts.push(bb([-L - 70, -110, 0], [-L - 24, 110, 22], "StoneDark", 3));
  parts.push(translate(door(130, 215), [-L - 2, 0, zb]));
  parts.push(bb([-L - 22, -105, zb + 236], [-L - 12, 105, zb + 250], "WoodRed", 2));
  for (const y of [-80, -40, 0, 40, 80]) parts.push(rotateX(box([2, 7, 7], [-L - 23, y, zb + 243], "Trunrada_PaintYellow"), 45, [-L - 23, y, zb + 243]));
  for (const s of [-1, 1]) parts.push(translate(shield(40, s > 0 ? "WoodRed" : "Trunrada_PaintBlue", s > 0 ? "Trunrada_PaintYellow" : "FabricWhite"), [-L - 6, s * 232, zb + 130]));
  parts.push(translate(skull(), [-L - 16, 0, zt + 84]));
  // shuttered windows down both sides and one in the back
  for (const s of [-1, 1]) for (const x of [-460, -230, 230, 460]) parts.push(translate(rotateZ(win(60, 60, "Trunrada_PaintBlue"), -s * 90), [x, s * (W + 1), zb + 105]));
  parts.push(translate(rotateZ(win(60, 60, "Trunrada_PaintBlue"), 180), [L + 1, 0, zb + 105]));
  // woodpiles against the -Y side, their sawn ends to the front
  for (const x0 of [-520, -400]) for (let i = 0; i < 3; i++) for (let j = 0; j < 3 - i; j++) {
    const y = -W - 32 - j * 22 - i * 11, z = 11 + i * 19;
    parts.push(log([x0 - 45, y, z], [x0 + 45, y, z], 10.5));
  }
  return merge(...parts);
}

// ---- stone house: a fieldstone ground storey with quoins, a notched log upper storey, a thick
// thatch roof (ridge along X) with a horse-head gable finial, a door hood and antlers ----
function stoneHouse(): Geo {
  const X = 400, Y = 330, zs = 165, zt = 315, roofH = 290, ov = 55, th = 36;
  const a = Math.atan2(roofH, Y), cosA = Math.cos(a), tanA = roofH / Y;
  const top = zt + roofH + th / cosA;
  const parts: Geo[] = [
    boxBounds([-X - 14, -Y - 14, 0], [X + 14, Y + 14, 28], "StoneDark", 4),
    boxBounds([-X, -Y, 0], [X, Y, zs], "StoneGrey", 5),
    boxBounds([-X + 8, -Y + 8, zs], [X - 8, Y - 8, zt], "WoodShade"),
  ];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (let i = 0; i < 3; i++)
    parts.push(boxAt([34, 34, 42], [sx * (X - 14), sy * (Y - 14), 30 + i * 44], i % 2 ? "StoneLight" : "StoneDark", 4));
  // the log storey: courses along X on the side walls, along Y on the ends (half a log higher),
  // crossing at the corners; the front courses stop at the door
  for (let i = 0; i < 5; i++) {
    const z = zs + 15 + i * 30;
    for (const s of [-1, 1]) parts.push(log([-X - 28, s * (Y - 6), z], [X + 28, s * (Y - 6), z], 15));
    const ze = z + 15;
    parts.push(log([X - 6, -Y - 28, ze], [X - 6, Y + 28, ze], 15));
    if (ze < 270) for (const s of [-1, 1]) parts.push(log([-X + 6, s * 78, ze], [-X + 6, s * (Y + 28), ze], 15));
    else parts.push(log([-X + 6, -Y - 28, ze], [-X + 6, Y + 28, ze], 15));
  }
  // roof
  parts.push(gableRoof([2 * X, 2 * Y, th], [0, 0, zt], roofH, ov, "Thatch"));
  parts.push(gableWall(-X + 2, Y, zt, roofH - 2, "WoodShade"), gableWall(X - 2, Y, zt, roofH - 2, "WoodShade"));
  parts.push(cylinderBetween([-X - ov + 8, 0, top - 20], [X + ov - 8, 0, top - 20], 26, 8, "Thatch"));
  for (const x of [-X - ov + 60, -X / 2, 0, X / 2, X + ov - 60]) parts.push(translate(rotateY(torus(27, 2.5, 8, 4, "RopeTan"), 90), [x, 0, top - 20]));
  const c = th / 2 / cosA;
  for (const ex of [-1, 1]) {
    const x = ex * (X + ov + 4);
    for (const s of [-1, 1]) {
      const zl = (y: number) => zt + roofH - s * y * tanA + c;
      const y0 = s * (Y + ov + 6), y1 = -s * 20;
      parts.push(beamBetween([x, y0, zl(y0)], [x, y1, zl(y1)], 8, 26, "Trunrada_PaintWhite"));
    }
    parts.push(rotateZ(translate(horseHead("Trunrada_PaintWhite"), [-(X + ov + 6), 0, top - 14]), ex > 0 ? 180 : 0));
  }
  // door with step and hood, antlers on the gable, windows
  parts.push(bb([-X - 52, -95, 0], [-X - 10, 95, 28], "StoneDark", 3));
  parts.push(translate(door(118, 222), [-X - 2, 0, 28]));
  parts.push(gableRoof([84, 190, 10], [-X - 42, 0, 288], 42, 6, "Thatch"));
  for (const s of [-1, 1]) parts.push(beamBetween([-X - 2, s * 82, 246], [-X - 76, s * 82, 288], 8, 8, "WoodDark"));
  parts.push(translate(win(46, 46, "Trunrada_PaintBlue"), [-X + 1, 0, zt + 28]));
  parts.push(translate(antlers(), [-X - 4, 0, zt + 132]));
  for (const s of [-1, 1]) for (const x of [-200, 200]) parts.push(translate(rotateZ(win(56, 62, "Trunrada_PaintBlue"), -s * 90), [x, s * Y, 70]));
  for (const s of [-1, 1]) parts.push(translate(rotateZ(win(50, 50, "Trunrada_PaintBlue"), -s * 90), [0, s * (Y - 4), 205]));
  parts.push(translate(rotateZ(win(56, 62, "Trunrada_PaintBlue"), 180), [X, 0, 70]));
  // stone chimney through the +Y slope
  parts.push(boxAt([70, 76, 300], [230, 140, 380], "StoneDark", 3), boxAt([86, 92, 12], [230, 140, 680], "StoneGrey", 3));
  // a rain barrel by the front corner
  parts.push(translate(barrel(30, 82), [-X - 40, -Y + 40, 0]));
  return merge(...parts);
}

// ---- the great windmill (landmark): a stone mound with steps, a tapering stone tower and a
// weatherboarded timber smock with a gallery, a thatched cap, four lattice sails with cloth on
// the -X face, a tail pole down to a winding wheel, flour sacks and a spare millstone ----
function windmill(): Geo {
  const C8 = Math.cos(Math.PI / 8);
  const oct = (rb: number, rt: number, h: number, z: number, mat: string): Geo =>
    rotateZ(cylinderAt({ rBot: rb, rTop: rt, height: h, segments: 8, bottom: [0, 0, z] }, mat), 22.5);
  const r16 = (rb: number, rt: number, h: number, z: number, mat: string): Geo =>
    rotateZ(cylinderAt({ rBot: rb, rTop: rt, height: h, segments: 16, bottom: [0, 0, z] }, mat), 11.25);
  // place g (built facing -X in the plane x = 0) on the octagon face looking toward phi
  const onFace = (g: Geo, phi: number, z: number, ap: number, lean: number): Geo => rotateZ(translate(rotateY(g, lean), [-ap, 0, z]), phi - 180);
  const zs = 58, stoneH = 520, woodH = 470, zg = zs + stoneH, zc = zg + woodH;
  const stoneR = (z: number) => 340 - (40 * (z - zs)) / stoneH, woodR = (z: number) => 300 - (42 * (z - zg)) / woodH;
  const stoneLean = (Math.atan2(40, stoneH) * 180) / Math.PI, woodLean = (Math.atan2(42, woodH) * 180) / Math.PI;
  const parts: Geo[] = [
    r16(540, 540, 56, 0, "StoneGrey"),
    r16(528, 528, 2, 56, "Cobble"),
    bb([-628, -110, 0], [-525, 110, 19], "StoneDark", 3),
    bb([-594, -110, 19], [-525, 110, 38], "StoneDark", 3),
    bb([-560, -110, 38], [-525, 110, 57], "StoneDark", 3),
    oct(340, 300, stoneH, zs, "StoneGrey"),
    oct(312, 312, 22, zg - 10, "WoodDark"),
    oct(300, 258, woodH, zg, "WoodShade"),
  ];
  // corner battens on the smock
  parts.push(around(beamBetween([300, 0, zg + 6], [258, 0, zc], 12, 12, "WoodDark"), 8, 22.5));
  // the gallery: deck, brackets, posts and rails
  parts.push(oct(430, 430, 12, zg + 4, "WoodWarm"));
  parts.push(around(beamBetween([stoneR(zg - 160) * C8 - 4, 0, zg - 160], [400, 0, zg + 2], 11, 12, "WoodDark"), 8));
  const corner = (k: number, z: number): V3 => [418 * Math.cos(((22.5 + 45 * k) * Math.PI) / 180), 418 * Math.sin(((22.5 + 45 * k) * Math.PI) / 180), z];
  for (let k = 0; k < 8; k++) {
    parts.push(boxAt([10, 10, 100], corner(k, zg + 16), "WoodDark", 2));
    for (const z of [zg + 64, zg + 112]) parts.push(beamBetween(corner(k, z), corner(k + 1, z), 7, 8, "WoodWarm"));
  }
  // doors and windows
  parts.push(bb([-345, -100, zs], [-296, 100, zs + 262], "StoneDark", 4), bb([-356, -112, zs + 262], [-290, 112, zs + 276], "StoneGrey", 3));
  parts.push(translate(door(100, 214), [-345, 0, zs]));
  parts.push(onFace(door(80, 176), 180, zg + 16, woodR(zg + 16) * C8, woodLean));
  for (const phi of [135, 225, 90, 270]) parts.push(onFace(win(46, 62, undefined), phi, zs + 300, stoneR(zs + 300) * C8, stoneLean));
  for (const phi of [0, 90, 270]) parts.push(onFace(win(42, 56, "Trunrada_PaintBlue"), phi, zg + 230, woodR(zg + 230) * C8, woodLean));
  parts.push(onFace(win(36, 48, undefined), 180, zg + 300, woodR(zg + 300) * C8, woodLean));
  // the cap
  parts.push(r16(286, 286, 26, zc, "WoodDark"));
  parts.push(r16(304, 14, 300, zc + 26, "Thatch"));
  parts.push(translate(torus(250, 4, 16, 4, "RopeTan"), [0, 0, zc + 70]), translate(torus(160, 4, 16, 4, "RopeTan"), [0, 0, zc + 170]));
  parts.push(cylinderAt({ radius: 5, height: 130, segments: 6, bottom: [0, 0, zc + 300] }, "WoodDark"));
  parts.push(sphereCenter(14, [0, 0, zc + 330], "GoldTrim", 10));
  parts.push(bb([-50, -2, zc + 400], [50, 2, zc + 405], "IronDark"), tri([30, 0, zc + 395], [60, 0, zc + 395], [55, 0, zc + 425], "IronDark"), tri([-50, 0, zc + 396], [-30, 0, zc + 403], [-50, 0, zc + 410], "IronDark"));
  // windshaft, bearing and hub
  const hz = 1165, hx = -485;
  parts.push(cylinderBetween([-120, 0, hz - 12], [hx + 20, 0, hz], 17, 10, "WoodDark"));
  parts.push(boxAt([46, 76, 64], [-245, 0, hz - 50], "WoodDark", 3));
  parts.push(cylinderBetween([hx + 26, 0, hz], [hx - 18, 0, hz], 36, 10, "WoodDark"), cylinderBetween([hx - 18, 0, hz], [hx - 26, 0, hz], 22, 10, "IronDark"));
  // the sails
  const SL = 800, r0 = 120, SW = 175;
  const sail: Geo[] = [bb([-8, -9, -30], [8, 9, SL], "WoodDark", 2)];
  for (let z = r0; z <= SL - 6; z += 56) sail.push(bb([-4, 9, z - 3], [4, SW, z + 3], "WoodWarm"));
  sail.push(bb([-4, SW - 7, r0 - 3], [4, SW, SL], "WoodWarm"), bb([-3, SW * 0.5 - 3, r0], [3, SW * 0.5 + 3, SL], "WoodWarm"));
  sail.push(bb([-3, -42, r0], [3, -9, SL], "WoodWarm"));
  sail.push(bb([4, 12, r0 + 10], [6, SW - 8, SL - 140], "FabricWhite"));
  const sails = merge(...[0, 1, 2, 3].map((k) => rotateX(merge(...sail), 18 + 90 * k)));
  parts.push(translate(sails, [hx, 0, hz]));
  // the tail pole down to its winding wheel
  const tTop: V3 = [170, 0, zc + 40], tEnd: V3 = [820, 0, 150];
  parts.push(beamBetween(tTop, tEnd, 18, 18, "WoodDark"));
  for (const s of [-1, 1]) parts.push(beamBetween([100, s * 200, zc + 6], lerp3(tTop, tEnd, 0.45), 10, 10, "WoodDark"));
  parts.push(translate(wheel(60, 8), [836, 0, 68]), beamBetween([836, 0, 68], tEnd, 10, 10, "WoodDark"));
  // sacks and a spare millstone
  parts.push(sack([-420, 160, 58], 20), sack([-440, 210, 58], -30, 0.9), sack([-395, 215, 58], 70, 0.85), sack([-415, 185, 102], 10, 0.8));
  parts.push(rotateZ(translate(rotateY(merge(
    rotateY(cylinderCenter(55, 20, 14, [0, 0, 0], "StoneGrey"), 90),
    rotateY(cylinderCenter(12, 22, 8, [0, 0, 0], "Trunrada_Shadow"), 90),
  ), 12), [-568, 0, 55]), 30));
  return merge(...parts);
}

// ---- the ring of standing stones with its altar (landmark, magic): a trampled earth circle,
// eight stones and a trilithon cut with glowing runes, a two-step dais, a rune-cut altar with a
// fire bowl and a skull offering, flagstones from the entrance (-X) ----
function stoneCircle(): Geo {
  const parts: Geo[] = [
    cylinderAt({ radius: 720, height: 3, segments: 24, bottom: [0, 0, 0] }, "Trunrada_Dirt"),
    rotateZ(cylinderAt({ radius: 240, height: 22, segments: 12, bottom: [0, 0, 0] }, "StoneGrey"), 15),
    rotateZ(cylinderAt({ radius: 180, height: 20, segments: 12, bottom: [0, 0, 22] }, "StoneLight"), 15),
    boxAt([60, 36, 72], [0, -72, 42], "StoneDark", 6),
    boxAt([60, 36, 72], [0, 72, 42], "StoneDark", 6),
    boxAt([92, 230, 24], [0, 0, 114], "StoneGrey", 7),
    runes(-46.5, 0, 119, 13, 7, 2, false),
    cylinderAt({ rBot: 18, rTop: 30, height: 18, segments: 12, bottom: [0, 0, 138] }, "Bronze"),
    translate(torus(30, 3, 12, 4, "Bronze"), [0, 0, 156]),
    flame([0, 0, 146], 0.65),
    translate(skull(), [-8, 80, 150]),
  ];
  const ringR = 590;
  const at = (g: Geo, deg: number, r = ringR): Geo => rotateZ(translate(g, [r, 0, 0]), deg);
  [60, 100, 140, 220, 260, 300].forEach((deg, i) => parts.push(at(menhir(100 + (i % 3) * 14, 56, 290 + ((i * 37) % 60), 11 + i * 3, -1), deg)));
  for (const deg of [157, 203]) parts.push(at(menhir(120, 64, 360, deg, 1, "Trunrada_MonolithDark"), deg));
  // the trilithon at the back
  for (const s of [-1, 1]) parts.push(at(box([70, 80, 350], [0, s * 110, 165], "Trunrada_Monolith", 9), 0));
  parts.push(at(box([80, 330, 72], [0, 0, 375], "Trunrada_MonolithDark", 10), 0));
  parts.push(runes(ringR - 41, 0, 352, 22, 7, 1, false));
  for (const s of [-1, 1]) parts.push(runes(ringR - 35.6, s * 110, 120, 24, 3, 4 + s, true));
  // flagstones from the entrance to the dais
  for (let i = 0; i < 5; i++) parts.push(translate(rotateZ(rock([70, 56, 9], 0.25, 50 + i, "StoneGrey", true), i * 37), [-280 - i * 80, (i % 2 ? 1 : -1) * 14, 1]));
  // rocks scattered round the rim
  for (let i = 0; i < 10; i++) parts.push(at(rock([40, 34, 24], 0.45, 60 + i, i % 2 ? "MossStone" : "StoneGrey"), i * 36 + 18, 680));
  return merge(...parts);
}

// ---- stable: an open-fronted horse barn under a thatched lean-to roof sloping to the back,
// three stalls with hay racks, straw, buckets, a saddle on a divider and lanterns ----
function stable(): Geo {
  const D = 215, L = 450, zf = 330, zb = 230;
  const slope = (zf - zb) / (2 * D), ang = (Math.atan(slope) * 180) / Math.PI;
  const under = (x: number) => (zf + zb) / 2 - x * slope;
  const parts: Geo[] = [
    bb([-D, -L + 10, 0], [D, L - 10, 3], "Trunrada_Hay"),
    bb([D - 10, -L, 0], [D + 10, L, zb - 18], "WoodWarm", 2),
  ];
  for (const s of [-1, 1]) {
    parts.push(bb([-D, s * L - 10, 0], [D + 10, s * L + 10, zb - 18], "WoodWarm", 2));
    parts.push(tri([-D, s * L, zb - 18], [D, s * L, zb - 18], [-D, s * L, under(-D)], "WoodShade"), tri([D, s * L, zb - 18], [D, s * L, under(D)], [-D, s * L, under(-D)], "WoodShade"));
    parts.push(beamBetween([-D, s * (L + 8), under(-D) - 8], [D + 10, s * (L + 8), under(D + 10) - 8], 10, 14, "WoodDark"));
  }
  parts.push(boxAt([22, 2 * L + 30, 18], [D, 0, zb - 18], "WoodDark", 2));
  parts.push(boxAt([24, 2 * L + 30, 26], [-D, 0, zf - 26], "WoodDark", 2));
  for (const y of [-L, -150, 150, L]) parts.push(cylinderAt({ radius: 13, height: zf - 26, segments: 8, bottom: [-D, y, 0] }, "Trunrada_Log"));
  for (const y of [-300, 0, 300]) parts.push(beamBetween([-D - 30, y, under(-D - 30) - 8], [D + 20, y, under(D + 20) - 8], 10, 14, "WoodDark"));
  // the roof slab
  const x0 = -D - 50, x1 = D + 40, xc = (x0 + x1) / 2, len = (x1 - x0) / Math.cos(Math.atan(slope));
  parts.push(translate(rotateY(box([len, 2 * L + 80, 24], [0, 0, 0], "Thatch"), ang), [xc, 0, under(xc) + 12 / Math.cos(Math.atan(slope))]));
  // a thatch roll along the high front edge with a carved horse head on it
  const zFront = under(x0) + 24 / Math.cos(Math.atan(slope));
  parts.push(cylinderBetween([x0 + 10, -L - 42, zFront - 8], [x0 + 10, L + 42, zFront - 8], 17, 8, "Thatch"));
  for (const y of [-L + 10, -L / 2, 0, L / 2, L - 10]) parts.push(translate(rotateY(torus(17.5, 2, 8, 4, "RopeTan"), 90), [x0 + 10, y, zFront - 8]));
  parts.push(translate(scale(horseHead("Trunrada_PaintWhite"), [1.8, 1.8, 1.8]), [x0 + 20, 0, zFront]));
  // half doors: the -Y stall's shut, the +Y stall's swung open
  const halfDoor = (y0: number, y1: number): Geo => merge(
    bb([-D - 9, y0, 12], [-D - 2, y1, 132], "WoodShade", 1.5),
    beamBetween([-D - 11, y0 + Math.sign(y1 - y0) * 20, 28], [-D - 11, y1 - Math.sign(y1 - y0) * 20, 118], 3, 9, "WoodDark"),
    bb([-D - 12, y0, 24], [-D - 9, y0 + Math.sign(y1 - y0) * 60, 32], "IronDark"),
    bb([-D - 12, y0, 108], [-D - 9, y0 + Math.sign(y1 - y0) * 60, 116], "IronDark"),
  );
  parts.push(halfDoor(-L + 14, -164));
  parts.push(rotateZ(halfDoor(L - 14, 164), -70, [-D, L - 14, 0]));
  // rope coils and a bridle hung on the front posts
  for (const y of [-150, 150]) parts.push(translate(rotateY(torus(14, 2.4, 10, 4, "RopeTan"), 90), [-D - 16, y, 176]), translate(rotateY(torus(10, 1.8, 10, 4, "Trunrada_Leather"), 90), [-D - 16, y, 126]));
  // stalls
  for (const y of [-150, 150]) {
    parts.push(bb([-110, y - 5, 0], [D - 10, y + 5, 140], "WoodShade", 1.5));
    parts.push(cylinderAt({ radius: 9, height: 160, segments: 8, bottom: [-110, y, 0] }, "Trunrada_Log"));
    parts.push(cylinderBetween([-110, y, 146], [D - 10, y, 146], 6, 8, "Trunrada_Log"));
  }
  for (const y of [-300, 0, 300]) {
    for (let k = 0; k < 6; k++) parts.push(beamBetween([D - 10, y - 60 + k * 24, 118], [D - 62, y - 60 + k * 24, 192], 4, 4, "WoodDark"));
    parts.push(cylinderBetween([D - 62, y - 76, 192], [D - 62, y + 76, 192], 4, 6, "WoodDark"));
    parts.push(scale(sphereCenter(1, [0, 0, 0], "Trunrada_Hay", 10), [34, 70, 34]).map((p) => ({ geo: p.geo.clone().translate(D - 36, y, 176), mat: p.mat })));
    parts.push(scale(sphereCenter(1, [0, 0, 0], "Trunrada_Hay", 10), [60, 70, 18]).map((p) => ({ geo: p.geo.clone().translate(90, y - 20, 0), mat: p.mat })));
    parts.push(cylinderAt({ rBot: 14, rTop: 17, height: 26, segments: 10, bottom: [D - 50, y + 60, 3] }, "WoodWarm"), cylinderAt({ radius: 17.5, height: 3, segments: 10, bottom: [D - 50, y + 60, 22] }, "IronDark"));
  }
  // a saddle astride the near divider's rail
  const sx = -55, sy = -150, sz = 152;
  parts.push(
    bb([sx - 34, sy - 30, sz - 2], [sx + 34, sy + 30, sz + 3], "FeltRed"),
    bb([sx - 34, sy + 28, sz - 52], [sx + 34, sy + 31, sz + 3], "FeltRed"),
    bb([sx - 34, sy - 31, sz - 52], [sx + 34, sy - 28, sz + 3], "FeltRed"),
    box([52, 40, 14], [sx, sy, sz + 9], "Trunrada_Leather", 5),
    box([10, 30, 20], [sx - 24, sy, sz + 16], "Trunrada_Leather", 3),
    box([10, 34, 18], [sx + 24, sy, sz + 14], "Trunrada_Leather", 3),
  );
  for (const s of [-1, 1]) {
    parts.push(bb([sx - 14, sy + s * 31, sz - 40], [sx + 14, sy + s * 34, sz + 6], "Trunrada_Leather"));
    parts.push(bb([sx - 1.5, sy + s * 35, sz - 62], [sx + 1.5, sy + s * 37, sz - 38], "WoodDark"));
    parts.push(translate(rotateX(torus(6, 1.4, 8, 4, "IronDark"), 90), [sx, sy + s * 36, sz - 66]));
  }
  // horseshoe on the header and lanterns hanging from it
  parts.push(translate(rotateY(torus(10, 2.6, 12, 4, "IronDark"), 90), [-D - 14, 0, zf - 13]));
  for (const y of [-300, 300]) parts.push(translate(lantern(), [-D - 4, y, zf - 78]), bb([-D - 5, y - 1, zf - 42], [-D - 3, y + 1, zf - 26], "IronDark"));
  // a pitchfork leaning on the -Y corner post
  parts.push(cylinderBetween([-D - 40, -L + 30, 0], [-D - 14, -L + 16, 190], 2.5, 6, "WoodPale"));
  for (const d of [-8, 0, 8]) parts.push(cylinderBetween([-D - 40, -L + 30 + d, 0], [-D - 44, -L + 32 + d, -30], 1.2, 4, "IronDark"));
  return merge(...parts);
}

// ---- hitching rail with a water trough, a bucket and a coil of rope (about 3.6 m) ----
function hitchingPost(): Geo {
  const tx = -62, tl = 118, tw = 26;
  const parts: Geo[] = [
    log([0, -150, -5], [0, -150, 112], 10),
    log([0, 150, -5], [0, 150, 112], 10),
    log([0, -182, 100], [0, 182, 100], 7.5, "WoodShade"),
    bb([tx - tw, -tl, 18], [tx + tw, tl, 26], "WoodShade"),
    bb([tx - tw - 6, -tl - 6, 18], [tx - tw, tl + 6, 62], "WoodWarm", 1.5),
    bb([tx + tw, -tl - 6, 18], [tx + tw + 6, tl + 6, 62], "WoodWarm", 1.5),
    bb([tx - tw, -tl - 6, 18], [tx + tw, -tl, 62], "WoodWarm", 1.5),
    bb([tx - tw, tl, 18], [tx + tw, tl + 6, 62], "WoodWarm", 1.5),
    bb([tx - tw, -tl, 26], [tx + tw, tl, 54], "WaterDark"),
  ];
  for (const s of [-1, 1]) {
    parts.push(boxAt([76, 14, 18], [tx, s * (tl - 24), 0], "WoodDark", 2));
    for (const y of [-60, 60]) parts.push(bb([tx + s * (tw + 6), y - 3, 20], [tx + s * (tw + 8), y + 3, 62], "IronDark"));
  }
  for (const y of [-90, 0, 90]) parts.push(translate(rotateX(torus(7, 1.6, 10, 4, "IronDark"), 90), [0, y, 86]));
  parts.push(translate(merge(
    cylinderAt({ rBot: 15, rTop: 18, height: 30, segments: 10, bottom: [0, 0, 0] }, "WoodWarm"),
    cylinderAt({ radius: 18.5, height: 3, segments: 10, bottom: [0, 0, 24] }, "IronDark"),
    cylinderAt({ radius: 15, height: 1, segments: 10, bottom: [0, 0, 27] }, "WaterDark"),
  ), [-40, 175, 0]));
  for (let i = 0; i < 3; i++) parts.push(translate(torus(13, 2.4, 12, 4, "RopeTan"), [0, 150, 50 + i * 5]));
  return merge(...parts);
}

// ---- palisade: a 6 m run of sharpened logs along Y (tiles end to end), the outside facing -X;
// rails, braces and a lashing rope on the inside, rocks round the foot ----
function palisade(): Geo {
  const rnd = seeded(11), n = 19, step = 600 / n, r = 16.5;
  const parts: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const y = -300 + step * (i + 0.5), h = 292 + rnd() * 46;
    parts.push(rotateX(rotateY(stake(0, y, h, r), (rnd() - 0.5) * 3, [0, y, 0]), (rnd() - 0.5) * 2, [0, y, 0]));
  }
  for (const z of [90, 228]) parts.push(cylinderBetween([r + 8, -300, z], [r + 8, 300, z], 9, 8, "WoodShade"));
  parts.push(bb([-r - 2.5, -300, 246], [-r + 2, 300, 253], "RopeTan"));
  parts.push(bb([-r - 2.5, -300, 120], [-r + 2, 300, 127], "RopeTan"));
  for (const y of [-150, 150]) parts.push(beamBetween([128, y, -4], [r + 14, y, 228], 11, 11, "WoodShade"));
  for (let i = 0; i < 7; i++) parts.push(translate(rock([34, 28, 18], 0.45, 30 + i, i % 2 ? "MossStone" : "StoneGrey"), [(i % 2 ? -1 : 1) * 30, -260 + i * 86, -4]));
  return merge(...parts);
}

// ---- palisade gate (6 m, joins the palisade): two great sharpened posts, double doors of logs
// swung open inward (+X), a watch platform over the gateway with a parapet of stakes, a thatched
// roof, banners, torches, a horned skull on the lintel and a ladder inside ----
function palisadeGate(): Geo {
  const zp = 430;
  const parts: Geo[] = [];
  for (const s of [-1, 1]) {
    parts.push(cylinderAt({ radius: 27, height: 610, segments: 10, bottom: [0, s * 214, -10] }, "Trunrada_Log"));
    parts.push(cylinderAt({ rBot: 27, rTop: 2, height: 62, segments: 10, bottom: [0, s * 214, 600] }, "WoodPale"));
    parts.push(cylinderAt({ radius: 17, height: zp, segments: 8, bottom: [150, s * 214, 0] }, "Trunrada_Log"));
    for (const y of [252.6, 284.2]) parts.push(stake(0, s * y, y < 260 ? 330 : 312, 16.5));
    // torch on the outer face of the post
    parts.push(beamBetween([-24, s * 214, 300], [-48, s * 214, 334], 5, 5, "IronDark"), cylinderAt({ rBot: 5, rTop: 9, height: 16, segments: 8, bottom: [-50, s * 214, 330] }, "IronDark"));
    parts.push(flame([-50, s * 214, 344], 0.42));
  }
  // lintel beams and the platform
  parts.push(bb([-50, -250, zp - 34], [-20, 250, zp], "WoodDark", 3), bb([132, -250, zp - 28], [166, 250, zp], "WoodDark", 3));
  parts.push(bb([-72, -300, zp], [176, 300, zp + 12], "WoodWarm", 2));
  for (let i = 0; i < 25; i++) parts.push(stake(-60, -264 + i * 22, 98, 11, zp + 12));
  parts.push(bb([-68, -280, zp + 60], [-52, 280, zp + 70], "RopeTan"));
  for (const s of [-1, 1]) parts.push(bb([-58, s * 288, zp + 12], [172, s * 296, zp + 96], "WoodShade", 1.5), bb([-60, s * 286, zp + 96], [174, s * 298, zp + 104], "WoodDark", 1.5));
  // roof over the platform
  for (const x of [-42, 162]) for (const s of [-1, 1]) parts.push(boxAt([12, 12, 640 - zp - 12], [x, s * 270, zp + 12], "WoodDark", 2));
  parts.push(translate(rotateZ(merge(
    gableRoof([600, 250, 14], [0, 0, 640], 118, 32, "Thatch"),
    cylinderBetween([-326, 0, 766], [326, 0, 766], 15, 8, "Thatch"),
    ...[-250, -125, 0, 125, 250].map((x) => translate(rotateY(torus(15.5, 1.8, 8, 4, "RopeTan"), 90), [x, 0, 766])),
    gableWall(-298, 125, 640, 116, "WoodShade"),
    gableWall(298, 125, 640, 116, "WoodShade"),
    boxAt([600, 12, 12], [0, 102, 628], "WoodDark"),
    boxAt([600, 12, 12], [0, -102, 628], "WoodDark"),
  ), 90), [60, 0, 0]));
  // banners over the gateway, the skull on the lintel
  for (const s of [-1, 1]) parts.push(translate(bannerCloth(70, 170), [-75, s * 128, zp + 56]));
  parts.push(translate(skull(), [-62, 0, zp - 26]));
  // the doors, swung open inward
  for (const s of [-1, 1]) {
    const leaf: Geo[] = [];
    for (let i = 0; i < 8; i++) leaf.push(stake(0, -s * (12 + i * 23), 300, 11.5));
    for (const z of [60, 240]) leaf.push(bb([11, -s * 4, z], [22, -s * 188, z + 16], "WoodShade", 2));
    leaf.push(beamBetween([16, -s * 20, 76], [16, -s * 172, 240], 10, 12, "WoodShade"));
    for (const z of [68, 248]) leaf.push(translate(torus(13, 2.5, 8, 4, "IronDark"), [0, -s * 12, z]));
    parts.push(rotateZ(translate(merge(...leaf), [0, s * 192, 0]), s * 72, [0, s * 192, 0]));
  }
  // the ladder up to the platform
  for (const y of [240, 290]) parts.push(beamBetween([292, y, 0], [178, y, zp + 24], 7, 9, "WoodShade"));
  for (let i = 1; i < 13; i++) {
    const t = i / 13;
    parts.push(cylinderBetween([292 - 114 * t, 240, (zp + 24) * t], [292 - 114 * t, 290, (zp + 24) * t], 2.6, 6, "WoodDark"));
  }
  return merge(...parts);
}

// ---- watchtower: four leaning log legs on stone footings, cross braces, a platform with a
// planked parapet and shields, a pyramid thatch roof with a pennant, a bell and a ladder (-X) ----
function watchtower(): Geo {
  const P = (z: number) => 160 - (30 * z) / 900, zp = 600;
  const parts: Geo[] = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    parts.push(boxAt([56, 56, 28], [sx * 160, sy * 160, 0], "StoneGrey", 6));
    parts.push(cylinderBetween([sx * 160, sy * 160, 20], [sx * P(880), sy * P(880), 880], 16, 8, "Trunrada_Log"));
  }
  for (let k = 0; k < 4; k++) {
    const side: Geo[] = [];
    for (const [z0, z1] of [[50, 320], [320, 590]]) {
      side.push(beamBetween([-P(z0) - 14, -P(z0), z0], [-P(z1) - 14, P(z1), z1], 9, 9, "WoodShade"));
      side.push(beamBetween([-P(z0) - 14, P(z0), z0], [-P(z1) - 14, -P(z1), z1], 9, 9, "WoodShade"));
    }
    side.push(beamBetween([-P(320) - 12, -P(320) - 20, 320], [-P(320) - 12, P(320) + 20, 320], 12, 12, "WoodDark"));
    parts.push(rotateZ(merge(...side), k * 90));
  }
  // platform and parapet
  parts.push(bb([-205, -205, zp], [205, 205, zp + 14], "WoodWarm", 2));
  for (const x of [-150, -50, 50, 150]) parts.push(boxAt([12, 420, 16], [x, 0, zp - 16], "WoodDark"));
  const ph = zp + 14, pt = zp + 120;
  parts.push(bb([-205, -205, ph], [-197, -45, pt], "WoodShade", 1.5), bb([-205, 45, ph], [-197, 205, pt], "WoodShade", 1.5));
  parts.push(bb([197, -205, ph], [205, 205, pt], "WoodShade", 1.5));
  for (const s of [-1, 1]) parts.push(bb([-205, s * 197, ph], [205, s * 205, pt], "WoodShade", 1.5));
  parts.push(bb([-209, -209, pt], [-193, -45, pt + 10], "WoodDark", 2), bb([-209, 45, pt], [-193, 209, pt + 10], "WoodDark", 2));
  parts.push(bb([193, -209, pt], [209, 209, pt + 10], "WoodDark", 2));
  for (const s of [-1, 1]) parts.push(bb([-209, s * 193, pt], [209, s * 209, pt + 10], "WoodDark", 2));
  for (const s of [-1, 1]) parts.push(translate(shield(34, s > 0 ? "Trunrada_PaintBlue" : "WoodRed", s > 0 ? "FabricWhite" : "Trunrada_PaintYellow"), [-209, s * 125, zp + 68]));
  // roof
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) parts.push(boxAt([12, 12, 232], [sx * 190, sy * 190, ph], "WoodDark", 2));
  parts.push(rotateZ(cylinderAt({ rBot: 350, rTop: 344, height: 10, segments: 4, bottom: [0, 0, 844] }, "WoodDark"), 45));
  parts.push(rotateZ(cylinderAt({ rBot: 344, rTop: 6, height: 220, segments: 4, bottom: [0, 0, 854] }, "Thatch"), 45));
  parts.push(cylinderAt({ radius: 4, height: 170, segments: 6, bottom: [0, 0, 1040] }, "WoodDark"), sphereCenter(7, [0, 0, 1212], "GoldTrim", 8));
  parts.push(tri([0, 3, 1200], [0, 3, 1150], [0, 95, 1182], "FabricRed"));
  // bell under the roof
  parts.push(boxAt([12, 392, 12], [0, 0, 820], "WoodDark"));
  parts.push(bb([-1, -1, 800], [1, 1, 820], "RopeTan"), cylinderAt({ rBot: 20, rTop: 12, height: 26, segments: 10, bottom: [0, 0, 776] }, "Bronze"), sphereCenter(12, [0, 0, 802], "Bronze", 8));
  // ladder
  for (const s of [-1, 1]) parts.push(beamBetween([-300, s * 30, 0], [-208, s * 30, zp + 30], 7, 9, "WoodShade"));
  for (let i = 1; i < 18; i++) {
    const t = i / 18;
    parts.push(cylinderBetween([-300 + 92 * t, -30, (zp + 30) * t], [-300 + 92 * t, 30, (zp + 30) * t], 2.6, 6, "WoodDark"));
  }
  return merge(...parts);
}

// ---- totem pole: a bear, an owl and a sun carved and painted one above another under a
// spread-winged eagle, on a stone plinth ringed with rocks ----
function totem(): Geo {
  const R = 40, ap = R * Math.cos(Math.PI / 8);
  const oct = (r: number, h: number, z: number, mat: string): Geo => rotateZ(cylinderAt({ radius: r, height: h, segments: 8, bottom: [0, 0, z] }, mat), 22.5);
  const parts: Geo[] = [oct(66, 26, 0, "StoneGrey")];
  for (let i = 0; i < 8; i++) parts.push(rotateZ(translate(rock([34, 30, 22], 0.4, 40 + i, "MossStone"), [80, 0, -2]), i * 45 + 10));
  const tiers: [number, number, string][] = [[26, 150, "WoodWarm"], [186, 130, "Trunrada_PaintBlue"], [326, 100, "WoodRed"]];
  for (const [z, h, mat] of tiers) parts.push(oct(R, h, z, mat), oct(R + 5, 10, z, "WoodDark"));
  const f = -ap;
  // the bear
  let z0 = 26;
  for (const s of [-1, 1]) {
    parts.push(box([24, 16, 26], [0, s * (R + 4), z0 + 136], "WoodWarm", 4));
    parts.push(beamBetween([f - 3, s * 32, z0 + 122], [f - 3, s * 6, z0 + 112], 7, 7, "WoodDark"));
    parts.push(bb([f - 2, s * 8, z0 + 92], [f + 1, s * 26, z0 + 106], "Trunrada_Bone"), bb([f - 3.5, s * 13, z0 + 94], [f - 1.5, s * 21, z0 + 104], "WoodDark"));
    parts.push(box([16, 20, 18], [f - 4, s * 22, z0 + 14], "WoodDark", 4));
  }
  parts.push(box([18, 20, 22], [f - 6, 0, z0 + 76], "WoodDark", 5));
  parts.push(bb([f - 4, -24, z0 + 34], [f + 1, 24, z0 + 50], "WoodRed", 1.5));
  for (const y of [-15, -5, 5, 15]) parts.push(bb([f - 5, y - 3, z0 + 43], [f - 3.5, y + 3, z0 + 50], "Trunrada_Bone"));
  // the owl
  z0 = 186;
  for (const s of [-1, 1]) {
    parts.push(translate(rotateY(cylinderCenter(17, 4, 12, [0, 0, 0], "Trunrada_Bone"), 90), [f - 1, s * 17, z0 + 84]));
    parts.push(translate(rotateY(cylinderCenter(8, 4, 10, [0, 0, 0], "WoodDark"), 90), [f - 2.5, s * 17, z0 + 84]));
    parts.push(beamBetween([f - 2, s * 8, z0 + 106], [f - 2, s * 36, z0 + 124], 3, 8, "Trunrada_PaintYellow"));
    for (const dz of [0, 30]) parts.push(beamBetween([-12, s * (ap + 1), z0 + 90 - dz], [14, s * (ap + 1), z0 + 60 - dz], 2, 9, "Trunrada_PaintYellow"));
  }
  parts.push(beamBetween([f - 2, 0, z0 + 74], [f - 16, 0, z0 + 46], 14, 12, "Trunrada_PaintYellow"));
  // the sun
  z0 = 326;
  const sc: V3 = [f - 1, 0, z0 + 52];
  parts.push(translate(rotateY(cylinderCenter(30, 4, 14, [0, 0, 0], "Trunrada_PaintYellow"), 90), sc));
  for (let k = 0; k < 8; k++) parts.push(rotateX(bb([f - 2.5, -4, sc[2] + 34], [f + 0.5, 4, sc[2] + 46], "Trunrada_PaintYellow"), k * 45, [f, 0, sc[2]]));
  for (const s of [-1, 1]) parts.push(bb([f - 4, s * 7, sc[2] + 6], [f - 2.5, s * 15, sc[2] + 13], "WoodDark"));
  parts.push(bb([f - 4, -9, sc[2] - 14], [f - 2.5, 9, sc[2] - 9], "WoodRed"));
  // the eagle
  parts.push(rotateZ(cylinderAt({ rBot: 38, rTop: 28, height: 82, segments: 8, bottom: [0, 0, 426] }, "WoodDark"), 22.5));
  parts.push(box([44, 40, 40], [-8, 0, 528], "Trunrada_PaintWhite", 8));
  parts.push(beamBetween([-28, 0, 534], [-52, 0, 520], 14, 14, "Trunrada_PaintYellow"), beamBetween([-50, 0, 522], [-54, 0, 506], 9, 9, "Trunrada_PaintYellow"));
  for (const s of [-1, 1]) parts.push(bb([-31, s * 6, 530], [-29, s * 13, 538], "WoodDark"));
  parts.push(bb([-31, -18, 539], [-26, 18, 544], "WoodDark"));
  parts.push(rotateY(bb([16, -24, 436], [76, 24, 446], "WoodDark", 2), 14, [16, 0, 440]));
  for (const s of [-1, 1]) {
    parts.push(rotateX(merge(
      bb([-12, s * 26, 476], [10, s * 200, 500], "WoodDark", 3),
      bb([-10, s * 26, 452], [8, s * 176, 478], "Trunrada_PaintBlue", 3),
      bb([-8, s * 26, 428], [6, s * 150, 454], "WoodRed", 3),
      bb([-13, s * 180, 482], [-11, s * 196, 494], "Trunrada_PaintWhite"),
      bb([-11, s * 156, 458], [-9, s * 172, 470], "Trunrada_PaintWhite"),
    ), s * 16, [0, s * 26, 470]));
  }
  return merge(...parts);
}

// ---- small items ----

// A dressed standing stone cut with glowing runes on its -X face.
const standingStone = (): Geo => menhir(112, 62, 330, 7, -1);

// An ovoo: a cone of piled stones round a birch pole, a bundle of sticks hung with blue, white,
// gold, red and green scarves blowing in the wind, and a skull offering at its foot.
function cairn(): Geo {
  const rnd = seeded(31);
  const coneR = (z: number) => 125 - (85 * z) / 130;
  const parts: Geo[] = [cylinderAt({ rBot: 125, rTop: 40, height: 130, segments: 9, bottom: [0, 0, 0] }, "StoneGrey")];
  const layers: [number, number, number][] = [[0, 9, 1.05], [34, 7, 0.9], [66, 6, 0.78], [96, 4, 0.66]];
  layers.forEach(([z, n, s], li) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 360 + rnd() * 20 + li * 13;
      parts.push(rotateZ(translate(rock([52 * s, 44 * s, 38 * s], 0.45, 100 + li * 20 + i, rnd() < 0.3 ? "MossStone" : "StoneGrey"), [coneR(z + 10) - 2, 0, z - 6]), a));
    }
  });
  parts.push(translate(rock([60, 52, 40], 0.4, 141, "StoneGrey"), [0, 0, 112]));
  parts.push(cylinderAt({ rBot: 6, rTop: 4, height: 340, segments: 6, bottom: [0, 0, 0] }, "BarkBirch"));
  const tips: V3[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3, tip: V3 = [Math.cos(a) * 52, Math.sin(a) * 52, 290 + rnd() * 40];
    tips.push(tip);
    parts.push(cylinderBetween([0, 0, 150], tip, 2.6, 5, "BarkBirch", 1.4));
  }
  const cloth = ["FabricBlue", "FabricBlue", "FabricWhite", "FabricGold", "FabricBlue", "FabricRed", "FabricGreen"];
  tips.forEach((t, i) => {
    const p = lerp3([0, 0, 150], t, 0.8);
    const q: V3 = [p[0] + (rnd() - 0.5) * 30, p[1] - 70 - rnd() * 30, p[2] - 30 - rnd() * 30];
    parts.push(beamBetween(p, q, 1.5, 13, cloth[i]));
  });
  for (const z of [200, 236]) parts.push(beamBetween([0, 0, z], [10, -80, z - 34], 1.5, 12, z > 220 ? "FabricWhite" : "FabricBlue"));
  parts.push(translate(skull(), [-112, 10, 34]));
  return merge(...parts);
}

// A campfire: an ash bed in a stone ring, a teepee of logs, flames, a spit roast on forked
// sticks, four log seats (one with a grey fur on it) and a little stack of firewood.
function campfire(): Geo {
  const parts: Geo[] = [cylinderAt({ radius: 62, height: 3, segments: 12, bottom: [0, 0, 0] }, "Trunrada_Ash")];
  for (let i = 0; i < 11; i++) parts.push(rotateZ(translate(rock([30, 26, 20], 0.4, 70 + i, "StoneGrey"), [72, 0, -2]), (i * 360) / 11));
  for (let i = 0; i < 5; i++) parts.push(rotateZ(cylinderBetween([46, 0, 2], [6, 0, 64], 6, 6, i % 2 ? "WoodDark" : "Trunrada_Log"), i * 72 + 15));
  parts.push(flame([0, 0, 4], 1.05));
  for (let i = 0; i < 6; i++) parts.push(rotateZ(box([7, 7, 4], [30 + (i % 3) * 6, 0, 3], "FireGlow"), i * 61 + 20));
  for (const s of [-1, 1]) {
    parts.push(cylinderBetween([0, s * 78, -4], [0, s * 78, 100], 3.5, 6, "WoodDark"));
    parts.push(cylinderBetween([0, s * 78, 96], [-9, s * 78, 116], 2.6, 6, "WoodDark"), cylinderBetween([0, s * 78, 96], [9, s * 78, 116], 2.6, 6, "WoodDark"));
  }
  parts.push(cylinderBetween([0, -100, 108], [0, 96, 108], 2.2, 6, "WoodPale"), beamBetween([0, -100, 108], [-14, -104, 92], 3, 3, "WoodPale"));
  parts.push(scale(sphereCenter(1, [0, 0, 0], "Trunrada_Meat", 10), [15, 30, 13]).map((p) => ({ geo: p.geo.clone().translate(0, 0, 106), mat: p.mat })));
  [30, 120, 210, 300].forEach((deg, i) => {
    const seat = log([210, -75, 20], [210, 75, 20], 22);
    const extra = i === 1
      ? merge(bb([196, -40, 40], [238, 40, 45], "Trunrada_FurGrey", 2), bb([234, -38, 6], [240, 38, 44], "Trunrada_FurGrey", 1.5))
      : [];
    parts.push(rotateZ(merge(seat, extra), deg));
  });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3 - i; j++) {
    const y = -26 + j * 17 + i * 8.5, z = 7 + i * 13;
    parts.push(rotateZ(log([150, y, z], [205, y, z], 7.5), 75));
  }
  return merge(...parts);
}

// A drying rack of birch poles: a grey wolf pelt and a tanned hide draped over the top pole,
// fish hanging from the lower one and a hide laced into a frame leaning at the end.
function dryingRack(): Geo {
  const Y = 160;
  const parts: Geo[] = [];
  for (const s of [-1, 1]) {
    parts.push(cylinderBetween([-46, s * Y, -4], [8, s * Y, 222], 5, 6, "BarkBirch"), cylinderBetween([46, s * Y, -4], [-8, s * Y, 222], 5, 6, "BarkBirch"));
    parts.push(cylinderAt({ radius: 7, height: 10, segments: 6, bottom: [0, s * Y, 183] }, "RopeTan"));
  }
  parts.push(cylinderBetween([0, -Y - 34, 194], [0, Y + 34, 194], 4.5, 6, "BarkBirch"));
  parts.push(cylinderBetween([-19, -Y - 12, 110], [-19, Y + 12, 110], 3.5, 6, "WoodShade"));
  // pelts over the top pole (both sides of it)
  const drape = (y0: number, y1: number, mat: string, len: number): Geo => merge(
    rotateY(bb([-4, y0, 194 - len], [-1, y1, 196], mat), 9, [0, 0, 196]),
    rotateY(bb([1, y0, 194 - len * 0.8], [4, y1, 196], mat), -9, [0, 0, 196]),
    cylinderBetween([0, y0, 197], [0, y1, 197], 6, 6, mat),
  );
  parts.push(drape(-140, -64, "Trunrada_FurGrey", 120), drape(-52, 18, "Trunrada_Hide", 100));
  parts.push(beamBetween([-16, -140, 80], [-26, -150, 52], 2, 9, "Trunrada_FurGrey"), beamBetween([-16, -64, 80], [-26, -56, 52], 2, 9, "Trunrada_FurGrey"));
  // fish
  for (let i = 0; i < 5; i++) {
    const y = 44 + i * 24, top = 110 - 4;
    parts.push(bb([-19.6, y - 0.6, top - 14], [-18.4, y + 0.6, top], "RopeTan"));
    parts.push(rotateX(box([2, 10, 10], [-19, y, top - 16], "Trunrada_Fish"), 45, [-19, y, top - 16]));
    parts.push(scale(sphereCenter(1, [0, 0, 0], "Trunrada_Fish", 8), [3.5, 8, 22]).map((p) => ({ geo: p.geo.clone().translate(-19, y, top - 40), mat: p.mat })));
  }
  // a hide laced into a frame, leaning at the +Y end
  const frame: Geo[] = [
    cylinderBetween([0, -60, 0], [0, 60, 0], 3, 6, "BarkBirch"),
    cylinderBetween([0, -60, 130], [0, 60, 130], 3, 6, "BarkBirch"),
    cylinderBetween([0, -54, -6], [0, -54, 136], 3, 6, "BarkBirch"),
    cylinderBetween([0, 54, -6], [0, 54, 136], 3, 6, "BarkBirch"),
    bb([-1.5, -42, 12], [1.5, 42, 118], "Trunrada_Hide"),
  ];
  for (let i = 0; i < 5; i++) frame.push(beamBetween([0, -54, 20 + i * 24], [0, -42, 24 + i * 24], 1, 1, "RopeTan"), beamBetween([0, 54, 20 + i * 24], [0, 42, 24 + i * 24], 1, 1, "RopeTan"));
  parts.push(translate(rotateZ(rotateY(merge(...frame), -14), 90), [10, Y + 70, 4]));
  return merge(...parts);
}

// A haystack round a pole, tied down with ropes and hanging stones, two bales and a pitchfork.
function haystack(): Geo {
  const H = "Trunrada_Hay";
  const parts: Geo[] = [
    cylinderAt({ rBot: 125, rTop: 140, height: 90, segments: 12, bottom: [0, 0, 0] }, H),
    cylinderAt({ rBot: 140, rTop: 105, height: 70, segments: 12, bottom: [0, 0, 90] }, H),
    cylinderAt({ rBot: 105, rTop: 12, height: 130, segments: 12, bottom: [0, 0, 160] }, H),
    cylinderAt({ radius: 6, height: 340, segments: 6, bottom: [0, 0, 0] }, "WoodDark"),
  ];
  for (let k = 0; k < 4; k++) {
    const rope = merge(
      beamBetween([16, 0, 286], [108, 0, 162], 3, 3, "RopeTan"),
      beamBetween([108, 0, 162], [143, 0, 120], 3, 3, "RopeTan"),
      beamBetween([143, 0, 120], [146, 0, 62], 2.5, 2.5, "RopeTan"),
      translate(rock([22, 20, 22], 0.4, 150 + k, "StoneGrey"), [148, 0, 44]),
    );
    parts.push(rotateZ(rope, 45 + k * 90));
  }
  const bale = (x: number, y: number, z: number, turn: number): Geo => translate(rotateZ(merge(
    boxAt([96, 54, 48], [0, 0, 0], H, 6),
    boxAt([4, 56, 50], [-24, 0, -1], "RopeTan"),
    boxAt([4, 56, 50], [24, 0, -1], "RopeTan"),
  ), turn), [x, y, z]);
  parts.push(bale(-185, 90, 0, 80), bale(-180, -40, 0, 95), bale(-182, 25, 48, 88));
  parts.push(cylinderBetween([-100, -70, 120], [-205, -120, 236], 2.6, 6, "WoodPale"));
  return merge(...parts);
}

// A steppe cart with big spoked wheels, shafts to the front (-X), loaded with sacks, a rolled
// felt, a barrel and a bundle of furs.
function cart(): Geo {
  const zb = 92;
  const parts: Geo[] = [bb([-100, -62, zb], [100, 62, zb + 8], "WoodWarm", 1.5)];
  for (const s of [-1, 1]) {
    parts.push(bb([-104, s * 62 - 5, zb - 10], [110, s * 62 + 5, zb + 8], "WoodDark", 1.5));
    for (const x of [-90, -30, 30, 90]) parts.push(boxAt([7, 7, 52], [x, s * 64, zb + 4], "WoodDark"));
    parts.push(bb([-96, s * 64 - 4, zb + 44], [96, s * 64 + 4, zb + 52], "WoodWarm", 1.5), bb([-96, s * 64 - 3, zb + 22], [96, s * 64 + 3, zb + 28], "WoodWarm", 1));
    parts.push(translate(wheel(78, 10), [20, s * 84, 84]));
    parts.push(cylinderBetween([-100, s * 46, zb - 4], [-300, s * 52, 22], 4.5, 8, "WoodDark"));
  }
  parts.push(bb([96, -60, zb + 4], [102, 60, zb + 40], "WoodWarm", 1));
  parts.push(cylinderBetween([20, -98, 84], [20, 98, 84], 5, 8, "WoodDark"));
  parts.push(cylinderBetween([-286, -60, 26], [-286, 60, 26], 4, 8, "WoodDark"), cylinderBetween([-250, 0, 0], [-250, -48, 36], 3, 6, "WoodDark"));
  // load
  parts.push(sack([-50, -28, zb + 8], 15), sack([-60, 26, zb + 8], -20, 0.95), sack([-52, 0, zb + 48], 40, 0.85));
  parts.push(cylinderBetween([20, -58, zb + 30], [20, 58, zb + 30], 22, 10, "FeltCream"));
  for (const y of [-34, 34]) parts.push(cylinderBetween([20, y - 2, zb + 30], [20, y + 2, zb + 30], 23, 10, "RopeTan"));
  parts.push(translate(barrel(22, 56), [74, -30, zb + 8]), box([40, 52, 26], [72, 28, zb + 22], "Trunrada_Fur", 6), box([36, 46, 12], [70, 26, zb + 41], "Trunrada_FurGrey", 4));
  return merge(...parts);
}

// A clan standard: a stone base, a tall pole with a horsehair tassel and trident, and a red
// banner with the clan sign on a crossbar. Centred on its footprint (the pole sits off-centre).
function bannerPole(): Geo {
  const g = merge(
    rotateZ(cylinderAt({ rBot: 34, rTop: 26, height: 30, segments: 8, bottom: [0, 0, 0] }, "StoneGrey"), 22.5),
    cylinderAt({ radius: 7, height: 600, segments: 8, bottom: [0, 0, 0] }, "WoodDark"),
    ...[200, 420].map((z) => cylinderAt({ radius: 8.5, height: 6, segments: 8, bottom: [0, 0, z] }, "GoldTrim")),
    ...[0, 1, 2, 3, 4].map((i) => rotateZ(translate(rock([24, 20, 16], 0.45, 160 + i, "MossStone"), [42, 0, -2]), i * 72 + 20)),
    spearTop(600),
    bb([-5, -12, 528], [5, 140, 538], "WoodDark", 1.5),
    translate(bannerCloth(118, 300), [0, 72, 528]),
  );
  return translate(g, [0, -54, 0]);
}

// A fur trader's stall: striped felt awning on log posts, a counter piled with folded furs and
// a rug hanging from it, pelts on the back rail and a hanging sign.
function furStall(): Geo {
  const W = 180, D = 120;
  const parts: Geo[] = [];
  for (const s of [-1, 1]) {
    parts.push(cylinderAt({ radius: 8, height: 240, segments: 8, bottom: [-D, s * W, 0] }, "Trunrada_Log"));
    parts.push(cylinderAt({ radius: 8, height: 280, segments: 8, bottom: [D, s * W, 0] }, "Trunrada_Log"));
    parts.push(bb([-D - 6, s * W - 5, 228], [D + 6, s * W + 5, 238], "WoodDark", 1.5));
  }
  parts.push(bb([-D - 6, -W - 10, 232], [-D + 6, W + 10, 242], "WoodDark", 1.5), bb([D - 6, -W - 10, 272], [D + 6, W + 10, 282], "WoodDark", 1.5));
  // the awning
  const a: V3 = [D + 14, 0, 288], b: V3 = [-D - 34, 0, 238];
  const len = Math.hypot(a[0] - b[0], a[2] - b[2]), ang = (Math.atan2(a[2] - b[2], a[0] - b[0]) * 180) / Math.PI;
  for (let i = 0; i < 5; i++) {
    const w = (2 * W + 40) / 5, y = -W - 20 + w * (i + 0.5);
    parts.push(translate(rotateY(box([len, w, 4], [0, y, 0], i % 2 ? "FeltCream" : "FeltRed"), -ang), lerp3(a, b, 0.5)));
    parts.push(bb([b[0] - 2, y - w / 2 + 3, b[2] - 22], [b[0] + 1, y + w / 2 - 3, b[2] - 2], i % 2 ? "FeltRed" : "FeltCream"));
  }
  // counter, rug and furs
  parts.push(bb([-D - 6, -W + 14, 80], [-D + 56, W - 14, 90], "WoodWarm", 2));
  for (const s of [-1, 1]) parts.push(boxAt([10, 10, 80], [-D + 20, s * (W - 30), 0], "WoodDark", 1.5));
  parts.push(bb([-D - 9, -W + 30, 14], [-D - 6, W - 30, 90], "FabricGold"), bb([-D - 10, -W + 36, 18], [-D - 7, W - 36, 86], "FeltRed"));
  for (const y of [-80, 0, 80]) parts.push(rotateX(box([2, 16, 16], [-D - 10.5, y, 52], "FabricGold"), 45, [-D - 10.5, y, 52]));
  const furs = ["Trunrada_Fur", "Trunrada_FurGrey", "Trunrada_FurDark", "Trunrada_Hide", "FeltCream"];
  [-110, -40, 30, 100].forEach((y, i) => {
    for (let k = 0; k < 3 - (i % 2); k++) parts.push(rotateZ(box([48, 54, 9], [-D + 26, y, 95 + k * 9], furs[(i + k) % furs.length], 3), (k % 2 ? 6 : -5), [-D + 26, y, 0]));
  });
  // pelts on the back rail
  parts.push(cylinderBetween([D - 4, -W, 222], [D - 4, W, 222], 4, 6, "WoodDark"));
  [-120, -40, 40, 120].forEach((y, i) => {
    const m = furs[(i + 1) % 4];
    parts.push(translate(merge(
      bb([-1.5, -24, -96], [1.5, 24, -14], m),
      bb([-1.5, -9, -14], [1.5, 9, 0], m),
      ...[-1, 1].map((s) => beamBetween([0, s * 20, -20], [0, s * 40, -42], 2.5, 10, m)),
      ...[-1, 1].map((s) => beamBetween([0, s * 20, -88], [0, s * 36, -112], 2.5, 10, m)),
      beamBetween([0, 0, -94], [0, 6, -128], 2.5, 9, m),
    ), [D - 12, y, 220]));
  });
  // the hanging sign
  for (const s of [-1, 1]) parts.push(bb([-D - 36, s * 30 - 1, 200], [-D - 34, s * 30 + 1, 236], "RopeTan"));
  parts.push(bb([-D - 38, -42, 168], [-D - 32, 42, 202], "WoodWarm", 1.5), bb([-D - 40, -16, 174], [-D - 38, 16, 196], "Trunrada_Fur"));
  return merge(...parts);
}

// A brazier on a post: stone base, rope-wrapped post, an iron fire basket burning on top.
function brazierPost(): Geo {
  return merge(
    rotateZ(cylinderAt({ rBot: 30, rTop: 24, height: 24, segments: 8, bottom: [0, 0, 0] }, "StoneGrey"), 22.5),
    cylinderAt({ radius: 8, height: 270, segments: 8, bottom: [0, 0, 20] }, "WoodDark"),
    cylinderAt({ radius: 9.5, height: 12, segments: 8, bottom: [0, 0, 150] }, "RopeTan"),
    cylinderAt({ radius: 9.5, height: 12, segments: 8, bottom: [0, 0, 194] }, "RopeTan"),
    cylinderAt({ rBot: 10, rTop: 24, height: 16, segments: 10, bottom: [0, 0, 290] }, "IronDark"),
    around(beamBetween([20, 0, 298], [30, 0, 338], 3, 3, "IronDark"), 6),
    translate(torus(30, 2.2, 12, 4, "IronDark"), [0, 0, 338]),
    translate(torus(23, 2.2, 12, 4, "IronDark"), [0, 0, 306]),
    flame([0, 0, 300], 0.75),
  );
}

// A 4 m square of trampled earth with flat stones set in it (tiles edge to edge, 4 cm thick).
function pathTile(): Geo {
  const rnd = seeded(5);
  const parts: Geo[] = [boxAt([400, 400, 4], [0, 0, 0], "Trunrada_Dirt", 1.5)];
  const spots: [number, number, number][] = [];
  for (let i = 0; i < 120 && spots.length < 22; i++) {
    const x = -168 + rnd() * 336, y = -168 + rnd() * 336, r = 15 + rnd() * 16;
    if (spots.some(([a, b, rr]) => Math.hypot(a - x, b - y) < rr + r + 10)) continue;
    spots.push([x, y, r]);
  }
  spots.forEach(([x, y, r], i) => parts.push(translate(rotateZ(rock([r * 2, r * 1.6, 9], 0.3, 20 + i, i % 3 ? "StoneDark" : "CobbleDark", true), rnd() * 180), [x, y, 1])));
  return merge(...parts);
}

// ---- the sample: a camp-town clearing inside the palisade ----
function sample(put: Put): void {
  // the palisade along the far edge (its outside toward +X) with the gate in the middle
  for (const y of [-1800, -1200, -600, 600, 1200, 1800]) put("palisade", [1950, y, 0], 180);
  put("palisade_gate", [1950, 0, 0], 180);
  put("watchtower", [1520, 1880, 0], 0);
  // the road in from the gate to the plaza and on toward the front, lit by braziers
  for (const x of [1550, 1150, 750, 350]) put("path_tile", [x, 0, 0]);
  for (const x of [-50, -450]) for (const y of [-400, 0, 400]) put("path_tile", [x, y, 0]);
  for (const x of [-850, -1250, -1650, -2050]) put("path_tile", [x, 0, 0]);
  for (const s of [-1, 1]) {
    put("banner_pole", [1560, s * 330, 0], 0);
    put("brazier_post", [1700, s * 250, 0], 0);
    put("brazier_post", [180, s * 250, 0], 0);
    put("brazier_post", [-700, s * 260, 0], 0);
  }
  // the chief's yurt, the windmill on its mound, the plaza round the fire and the clan totem
  put("yurt_chief", [1000, 1000, 0], 0);
  put("windmill", [1100, -1450, 0], 0);
  put("campfire", [-250, 0, 0], 0);
  put("totem", [260, 470, 0], 0);
  put("cairn", [720, -430, 0], 0);
  put("standing_stone", [560, -760, 0], 20);
  put("standing_stone", [-1800, -400, 0], 10);
  // homes
  put("longhouse", [-1400, 1350, 0], 0);
  put("yurt_small", [-200, 1850, 0], -10);
  put("yurt_small", [560, 1930, 0], 15);
  put("yurt_small", [-1300, -620, 0], 40);
  put("stone_house", [-1450, -1650, 0], 0);
  // horses and hay
  put("stable", [100, -1750, 0], 0);
  put("hitching_post", [-330, -1980, 0], 0);
  put("hitching_post", [-1750, 720, 0], 90);
  put("haystack", [-430, -1450, 0], 0);
  put("haystack", [520, -1060, 0], 30);
  // the market corner and the day's work
  put("fur_stall", [-250, -950, 0], 0);
  put("cart", [-760, -1000, 0], 20);
  put("cart", [1380, 520, 0], 60);
  put("drying_rack", [-450, 1150, 0], 10);
  put("drying_rack", [-760, -430, 0], 90);
  put("drying_rack", [1640, 950, 0], 0);
  put("haystack", [1560, -650, 0], 0);
  put("campfire", [-1900, -950, 0], 25);
  put("common:crate", [-120, -1180, 0], 10);
  put("common:crate", [-60, -1140, 0], -20);
  put("common:crate", [-95, -1170, 58], 35);
  put("common:bench", [480, 620, 0], 90);
  // trees on the steppe: pines outside the palisade, birches, a frost oak and autumn trees inside
  const trees: [number, number, string, number][] = [
    [2300, -1900, "Pine", 1.2], [2350, -1100, "PineSmall", 1.1], [2280, -300, "Pine", 1.0], [2340, 500, "Pine", 1.25], [2300, 1300, "PineSmall", 1.0], [2350, 2050, "Pine", 1.1],
    [-1100, 2050, "Birch", 1.0], [950, 2130, "Birch", 1.05], [150, 1450, "AutumnTree", 0.9], [-2050, 2050, "FrostOak", 1.0], [-2150, 500, "Birch", 1.0],
    [-2100, -700, "AutumnTree", 1.0], [-2050, -1950, "Pine", 1.0], [-820, -2150, "Birch", 1.05], [600, -2150, "PineSmall", 1.0], [1500, -2150, "Birch", 0.95],
  ];
  trees.forEach(([x, y, kind, s]) => put(`flora:${kind}`, [x, y, 0], (x * 7) % 360, s));
  [[-2150, 250], [-2150, -300], [-550, 780], [-1650, -1180], [850, -650], [800, 1600], [-150, 1450], [1300, 300]].forEach(([x, y], i) => put("flora:Bush", [x, y, 0], i * 47, 0.8 + (i % 3) * 0.2));
  [[-1000, 420], [800, -260], [1700, -700], [-1900, 1900], [300, -560], [1200, 1650]].forEach(([x, y], i) => put("common:rock_small", [x, y, 0], i * 67, 1 + (i % 2) * 0.4));
}

export const KIT: Kit = {
  id: "trunrada",
  name: "ทรุนราดา",
  region: "ตะวันออกเฉียงเหนือ ทุ่งหญ้าสเตปป์อันหนาวเย็น",
  desc: "เมืองชายแดนของชนเผ่า กระโจมสักหลาดกับบ้านยาวหลังคาหญ้าหลังรั้วไม้แหลม กังหันลมบนเนิน หินตั้งโบราณ และวัฒนธรรมม้า",
  ground: "steppe",
  items: [
    { id: "yurt_chief", name: "กระโจมหัวหน้าเผ่า", make: () => yurt(true), tags: ["building", "landmark"] },
    { id: "yurt_small", name: "กระโจมเล็ก", make: () => yurt(false), tags: ["building"] },
    { id: "longhouse", name: "บ้านยาวหลังคาหญ้า", make: longhouse, tags: ["building"] },
    { id: "stone_house", name: "บ้านหินผนังซุง", make: stoneHouse, tags: ["building"] },
    { id: "windmill", name: "กังหันลมใหญ่", make: windmill, tags: ["landmark", "building"] },
    { id: "stone_circle", name: "วงหินตั้งและแท่นบูชา", make: stoneCircle, tags: ["landmark", "magic"] },
    { id: "stable", name: "คอกม้า", make: stable, tags: ["building"] },
    { id: "hitching_post", name: "ราวผูกม้ากับรางน้ำ", make: hitchingPost, tags: ["decor"] },
    { id: "palisade", name: "รั้วไม้แหลม (6 ม.)", make: palisade, tags: ["wall", "defence"] },
    { id: "palisade_gate", name: "ประตูค่ายพร้อมระเบียงเฝ้ายาม", make: palisadeGate, tags: ["gate", "defence"] },
    { id: "watchtower", name: "หอสังเกตการณ์", make: watchtower, tags: ["tower", "defence"] },
    { id: "totem", name: "เสาโทเทม", make: totem, tags: ["decor", "landmark"] },
    { id: "standing_stone", name: "หินตั้งจารึกอักษร", make: standingStone, tags: ["decor", "magic"] },
    { id: "cairn", name: "กองหินบูชาผูกผ้า", make: cairn, tags: ["decor"] },
    { id: "campfire", name: "กองไฟกับขอนนั่ง", make: campfire, tags: ["light", "decor"] },
    { id: "drying_rack", name: "ราวตากหนังและปลา", make: dryingRack, tags: ["decor"] },
    { id: "haystack", name: "กองฟาง", make: haystack, tags: ["decor"] },
    { id: "cart", name: "เกวียนล้อใหญ่", make: cart, tags: ["decor", "market"] },
    { id: "banner_pole", name: "เสาธงประจำเผ่า", make: bannerPole, tags: ["decor"] },
    { id: "fur_stall", name: "แผงขายขนสัตว์", make: furStall, tags: ["market"] },
    { id: "brazier_post", name: "เสาคบเพลิง", make: brazierPost, tags: ["light"] },
    { id: "path_tile", name: "ทางดินปูหิน (4 ม.)", make: pathTile, tags: ["ground"] },
  ],
  sample,
};
