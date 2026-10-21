// ไอซ์เบิร์ก (Iceberg): the snow town of the far north and its cold harbour. Log and fieldstone
// houses under steep roofs heavy with snow, warm lit windows and glowing chimneys, the great
// timber hall with its dragon-headed gables, a frozen fountain and an ice bear, and a harbour of
// stone quays, snowy piers, fishing boats and drifting ice.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front facing -X.

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, sphereCenter, torus, gableWall, rock,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial } from "../textures";
import type { Kit } from "./types";

// ---- the town's own materials ----
defineMaterial("Iceberg_Log", { map: "bark", tint: "#5f4632", bump: 1.6 });
defineMaterial("Iceberg_LogEnd", { map: "adobe", tint: "#c9a274", bump: 0.8 });
defineMaterial("Iceberg_Firewood", { map: "wood", tint: "#a17a52", bump: 1 });
defineMaterial("Iceberg_Shingle", { map: "shingles", tint: "#5a4838", bump: 2.5 });
defineMaterial("Iceberg_TrimWhite", { map: "wood", tint: "#ebe5d8", bump: 0.8 });
defineMaterial("Iceberg_GreyShade", { map: "wood", tint: "#625c54", bump: 1 });
defineMaterial("Iceberg_PaintBlue", { map: "plaster", tint: "#34557f", rough: 0.7 });
defineMaterial("Iceberg_Fur", { map: "felt", tint: "#7d5a3c", rough: 1 });
defineMaterial("Iceberg_FurGrey", { map: "felt", tint: "#a39d94", rough: 1 });
defineMaterial("Iceberg_FurDark", { map: "felt", tint: "#4b3a2d", rough: 1 });
defineMaterial("Iceberg_Leather", { map: "felt", tint: "#6e4229", rough: 0.8 });
defineMaterial("Iceberg_Carrot", { map: "plaster", tint: "#ee7a2a", rough: 0.7 });
defineMaterial("Iceberg_Coal", { map: "metal", tint: "#2a2725", rough: 0.9 });
defineMaterial("Iceberg_Dark", { tint: "#1e1a1a", rough: 1 });
defineMaterial("Iceberg_PackedSnow", { map: "snow", tint: "#d9e2ec", rough: 0.85 });
defineMaterial("Iceberg_SnowBlock", { map: "snow", tint: "#dfe8f3", rough: 0.8 });
defineMaterial("Iceberg_Flag", { map: "stone", tint: "#9aa3ad", bump: 2 });
defineMaterial("Iceberg_Slate", { map: "adobe", tint: "#9ea7b1", bump: 1.2 });
defineMaterial("Iceberg_SlatePale", { map: "adobe", tint: "#c3c6c4", bump: 1.2 });
defineMaterial("Iceberg_Glacier", { map: "ice", tint: "#e2f3fb", rough: 0.35 });
defineMaterial("Iceberg_GlacierDeep", { map: "ice", tint: "#8fcbe6", rough: 0.3 });
defineMaterial("Iceberg_SculptIce", { map: "ice", tint: "#c4e8f8", rough: 0.12, metal: 0.1, glow: "#58b9e6", glowI: 0.22 });
defineMaterial("Iceberg_Fish", { map: "metal", tint: "#a9b9c2", rough: 0.4, metal: 0.3 });
defineMaterial("Iceberg_Staves", { map: "ribs", tint: "#93683f", rough: 0.85 });

const DEG = 180 / Math.PI;
const RAD = Math.PI / 180;

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// Something built facing -X at the origin, turned to face `side` and moved to `at`.
type Side = "-x" | "+x" | "-y" | "+y";
const TURN: Record<Side, number> = { "-x": 0, "-y": 90, "+x": 180, "+y": 270 };
const facing = (g: Geo, side: Side, at: V3): Geo => translate(rotateZ(g, TURN[side]), at);

// Centre a Geo on its footprint (x, y), leaving z alone.
function centre(g: Geo): Geo {
  const b = new THREE.Box3();
  for (const p of g) {
    p.geo.computeBoundingBox();
    b.union(p.geo.boundingBox!);
  }
  return translate(g, [-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0]);
}

// A surface through rows of points (rows[i][j]) seen from both sides: a boat's planking.
function loft(rows: V3[][], mat: string): Geo {
  const pos: number[] = [];
  for (let i = 0; i + 1 < rows.length; i++)
    for (let j = 0; j + 1 < rows[i].length; j++) {
      const a = rows[i][j], b = rows[i][j + 1], c = rows[i + 1][j + 1], d = rows[i + 1][j];
      pos.push(...a, ...b, ...c, ...a, ...c, ...d, ...a, ...c, ...b, ...a, ...d, ...c);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  const p = geo.getAttribute("position"), uv = new Float32Array(p.count * 2);
  for (let k = 0; k < p.count; k++) {
    uv[k * 2] = p.getX(k) / 100;
    uv[k * 2 + 1] = (p.getZ(k) + Math.abs(p.getY(k))) / 100;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return [{ geo, mat }];
}

// ---- shared pieces ----

// A drift of snow: a long low dome lx by ly, h high, lying on the ground at c.
const drift = (c: V3, lx: number, ly: number, h: number): Geo => scale(sphereCenter(50, c, "Snow", 10), [lx / 100, ly / 100, h / 50], c);

// A round log from a to b with pale cut ends.
function log(a: V3, b: V3, r: number, segs = 8): Geo {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize().multiplyScalar(1.5);
  return merge(
    cylinderBetween(a, b, r, segs, "Iceberg_Log"),
    cylinderBetween(b, [b[0] + d.x, b[1] + d.y, b[2] + d.z], r - 2.5, segs, "Iceberg_LogEnd"),
    cylinderBetween([a[0] - d.x, a[1] - d.y, a[2] - d.z], a, r - 2.5, segs, "Iceberg_LogEnd"),
  );
}

// Icicles hanging from the line a-b (an eave, a rim), of random lengths with gaps.
function icicles(a: V3, b: V3, seed: number, step = 26, maxLen = 48): Geo {
  const rnd = seeded(seed), parts: Geo[] = [];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  for (let t = step * 0.6; t < len - 8; t += step * (0.7 + rnd() * 0.6)) {
    if (rnd() < 0.28) continue;
    const f = t / len, L = 10 + rnd() * rnd() * maxLen;
    const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, z = a[2] + (b[2] - a[2]) * f;
    parts.push(cylinderAt({ rBot: 0.5, rTop: 3 + rnd() * 2.5, height: L, segments: 5, bottom: [x, y, z - L + 1] }, "IceBlue"));
  }
  return merge(...parts);
}

// A steep gable roof over sx x sy (ridge along X, gables at +-X) on walls whose tops are at z:
// two slabs with barge boards, snow lying from the ridge down `snow` of each slope and ending in
// a rounded lip, a snow ridge, and icicles along both eaves.
interface RoofOpts {
  sx: number; sy: number; h: number; z: number; mat: string;
  over?: number; gableOver?: number; th?: number; snow?: number; snowTh?: number; icicles?: boolean; seed?: number; barge?: string;
}
function snowRoof(o: RoofOpts): Geo {
  const th = o.th ?? 20, over = o.over ?? 40, gov = o.gableOver ?? over, sn = o.snowTh ?? 16;
  const a = Math.atan2(o.h, o.sy / 2), deg = a * DEG;
  const slope = (o.sy / 2 + over) / Math.cos(a), len = o.sx + 2 * gov, sl = slope * (o.snow ?? 0.64);
  const barge = o.barge ?? "WoodDark", rnd = seeded((o.seed ?? 5) * 3 + 1), tn = sn - 3;
  const parts: Geo[] = [];
  for (const s of [1, -1] as const) {
    // tongues of snow sliding further down past the even cover, so its edge is ragged
    const tongues: Geo[] = [];
    for (let x = -len / 2 + 10 + rnd() * 40; x < len / 2 - 50; x += 30 + rnd() * 110) {
      const w = Math.min(50 + rnd() * 120, len / 2 - 8 - x), cx = x + w / 2;
      const ext = Math.min(slope - sl - 6, slope * (0.04 + rnd() * 0.13) + 8);
      tongues.push(scale(sphereCenter(w / 2, [cx, s * sl, th], "Snow", 8), [1, ext / (w / 2), (tn * 0.8) / (w / 2)], [cx, s * sl, th]));
      x += w * 0.6;
    }
    parts.push(rotateX(merge(
      box([len, slope, th], [0, (s * slope) / 2, th / 2], o.mat, 2),
      box([8, slope + 4, th + 10], [len / 2 + 4, (s * slope) / 2, th / 2 + 1], barge, 1.5),
      box([8, slope + 4, th + 10], [-len / 2 - 4, (s * slope) / 2, th / 2 + 1], barge, 1.5),
      box([len - 4, sl, sn], [0, (s * sl) / 2, th + sn / 2 - 1], "Snow", Math.min(5, sn / 3)),
      cylinderBetween([-len / 2 + 2, s * sl, th + sn * 0.35], [len / 2 - 2, s * sl, th + sn * 0.35], sn * 0.6, 7, "Snow"),
      ...tongues,
    ), -s * deg));
    if (o.icicles !== false) {
      const ey = s * slope * Math.cos(a), ez = -slope * Math.sin(a);
      parts.push(icicles([-len / 2 + 4, ey, ez], [len / 2 - 4, ey, ez], (o.seed ?? 5) + (s > 0 ? 0 : 50)));
    }
  }
  const t = th + sn;
  const rz = t * Math.cos(a) * 0.7;
  parts.push(cylinderBetween([-len / 2 + 2, 0, rz], [len / 2 - 2, 0, rz], t * Math.sin(a) * 0.8 + 3, 8, "Snow"));
  return translate(merge(...parts), [0, 0, o.z + o.h]);
}

// The board-and-batten triangle closing a gable at x under a roof of half-width `half` rising
// h from z0; `out` is the side it faces.
function gableBoards(x: number, half: number, z0: number, h: number, out: 1 | -1, boards = "WoodDark", batten = "WoodShade"): Geo {
  const parts: Geo[] = [gableWall(x, half, z0, h, boards)];
  for (let y = -half + 34; y <= half - 34; y += 38) {
    const top = h * (1 - (Math.abs(y) + 4) / half) - 4;
    if (top > 16) parts.push(boxAt([4, 7, top], [x + out * 2, y, z0], batten));
  }
  return merge(...parts);
}

// A warm lit window facing -X: w x h of glowing panes (bottom at z = 0, centred on y = 0) behind
// cross mullions in a frame, a sill and a lintel both carrying snow, and shutters if a colour is
// given. Its back is at x = 0, to sit on a wall face.
function litWindow(w: number, h: number, frame = "Iceberg_TrimWhite", shutter = ""): Geo {
  const fb = 9;
  const parts: Geo[] = [
    boxAt([4, w, h], [-4, 0, 0], "LanternGlow"),
    boxAt([10, fb, h + 2 * fb], [-5, -(w + fb) / 2, -fb], frame),
    boxAt([10, fb, h + 2 * fb], [-5, (w + fb) / 2, -fb], frame),
    boxAt([10, w, fb], [-5, 0, h], frame),
    boxAt([10, w, fb], [-5, 0, -fb], frame),
    boxAt([3, 5, h], [-7.5, 0, 0], frame),
    boxAt([3, w, 5], [-7.5, 0, h * 0.58], frame),
    boxAt([20, w + 34, 8], [-10, 0, -fb - 8], frame, 1.5),
    box([15, w + 28, 8], [-12, 0, -8], "Snow", 3),
    boxAt([16, w + 36, 10], [-8, 0, h + fb], frame, 1.5),
    box([13, w + 32, 8], [-9, 0, h + fb + 13], "Snow", 3),
  ];
  if (shutter) {
    const sw = w / 2 + 4;
    for (const s of [1, -1]) {
      const y = s * (w / 2 + fb + sw / 2 + 1);
      parts.push(
        boxAt([4, sw, h + 10], [-2, y, -5], shutter, 1),
        boxAt([3, sw - 6, 7], [-5.5, y, h * 0.12], shutter),
        boxAt([3, sw - 6, 7], [-5.5, y, h * 0.8], shutter),
        beamBetween([-5.5, y - (s * sw) / 3, h * 0.14 + 6], [-5.5, y + (s * sw) / 3, h * 0.8 - 2], 3, 6, shutter),
      );
    }
  }
  return merge(...parts);
}

// A planked door facing -X with posts, a lintel carrying snow, iron straps and a ring; bottom at
// z = 0, centred on y = 0, back at x = 0.
function plankDoor(w: number, h: number, frame = "WoodShade", leaf = "DoorWood"): Geo {
  return merge(
    boxAt([7, w, h], [-3.5, 0, 0], leaf, 1),
    boxAt([14, 14, h + 4], [-7, -(w / 2 + 7), 0], frame, 2),
    boxAt([14, 14, h + 4], [-7, w / 2 + 7, 0], frame, 2),
    boxAt([20, w + 46, 18], [-10, 0, h + 4], frame, 3),
    box([16, w + 40, 9], [-11, 0, h + 24], "Snow", 3.5),
    ...[0.16, 0.52, 0.86].map((t) => boxAt([2, w * 0.82, 7], [-8, -w * 0.07, h * t], "IronDark")),
    translate(rotateY(torus(7, 1.6, 10, 4, "IronDark"), 90), [-9, w * 0.3, h * 0.46]),
  );
}

// A door under a round stone arch, facing -X: an opening w wide with straight jambs up to hs.
function archDoor(w: number, hs: number, stone = "StoneBlueDark"): Geo {
  const R = w / 2, ra = R + 13, parts: Geo[] = [
    boxAt([6, w, hs], [-3, 0, 0], "DoorWood", 1),
    cylinderBetween([-5, 0, hs], [0, 0, hs], R, 12, "DoorWood"),
    ...[0.2, 0.62].map((t) => boxAt([2, w * 0.84, 7], [-7, 0, hs * t], "IronDark")),
    translate(rotateY(torus(6, 1.5, 10, 4, "IronDark"), 90), [-8, R * 0.5, hs * 0.5]),
  ];
  for (const s of [1, -1]) for (let k = 0; k < 3; k++) parts.push(boxAt([14, 26, hs / 3 - 3], [-7, s * (R + 13), (k * hs) / 3], stone, 2));
  for (let k = 0; k < 9; k++) {
    const t = ((k + 0.5) * 180) / 9;
    const key = k === 4 ? 34 : 26;
    parts.push(translate(rotateX(box([16, (Math.PI * ra) / 9 - 3, key], [0, 0, 0], stone, 2), t - 90), [-8, ra * Math.cos(t * RAD), hs + ra * Math.sin(t * RAD)]));
  }
  return merge(...parts);
}

// A square stone chimney stack s across from z0 to z1 with a cap band, a rim and embers glowing
// in its mouth.
function chimneyStack(s: number, z0: number, z1: number, mat = "StoneGrey"): Geo {
  const h = s / 2, t = 9;
  return merge(
    boxBounds([-h, -h, z0], [h, h, z1], mat, 3),
    boxBounds([-h - 6, -h - 6, z1 - 36], [h + 6, h + 6, z1 - 22], "StoneBlueDark", 2),
    box([s + 2, s + 2, 8], [0, 0, z1 - 18], "Snow", 3),
    boxBounds([-h - 3, -h - 3, z1], [h + 3, -h + t, z1 + 14], "StoneBlueDark"),
    boxBounds([-h - 3, h - t, z1], [h + 3, h + 3, z1 + 14], "StoneBlueDark"),
    boxBounds([-h - 3, -h + t, z1], [-h + t, h - t, z1 + 14], "StoneBlueDark"),
    boxBounds([h - t, -h + t, z1], [h + 3, h - t, z1 + 14], "StoneBlueDark"),
    boxBounds([-h + t, -h + t, z1 - 2], [h - t, h - t, z1 + 4], "FireGlow"),
  );
}

// A small iron lantern with glowing glass and a snowy cap, 48 tall, standing on z = 0.
function lanternBox(): Geo {
  return merge(
    boxAt([22, 22, 4], [0, 0, 0], "IronDark"),
    boxAt([16, 16, 26], [0, 0, 4], "LanternGlow"),
    ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => boxAt([3, 3, 26], [a * 9, b * 9, 4], "IronDark")),
    rotateZ(cylinderAt({ rBot: 16.5, rTop: 3, height: 13, segments: 4, bottom: [0, 0, 30] }, "IronDark"), 45),
    rotateZ(cylinderAt({ rBot: 12, rTop: 2, height: 10, segments: 4, bottom: [0, 0, 36] }, "Snow"), 45),
    cylinderAt({ radius: 3, height: 5, segments: 6, bottom: [0, 0, 43] }, "IronDark"),
  );
}

// A lantern on an iron bracket, facing -X, its back plate at x = 0 from z = 0 to 34.
function wallLantern(): Geo {
  return merge(
    boxAt([4, 12, 34], [-2, 0, 0], "IronDark"),
    beamBetween([-2, 0, 30], [-40, 0, 30], 4, 4, "IronDark"),
    beamBetween([-2, 0, 6], [-28, 0, 28], 3, 3, "IronDark"),
    cylinderBetween([-36, 0, 16], [-36, 0, 30], 1.2, 4, "IronDark"),
    translate(scale(lanternBox(), [0.8, 0.8, 0.8]), [-36, 0, -22]),
  );
}

// A round shield facing -X, its back at x = 0.
function shield(k: number): Geo {
  const paint = ["FabricRed", "Iceberg_PaintBlue", "FabricGold", "FabricWhite"][k % 4];
  const band = ["FabricWhite", "FabricGold", "Iceberg_PaintBlue", "FabricRed"][k % 4];
  return merge(
    cylinderBetween([-5, 0, 0], [0, 0, 0], 44, 12, paint),
    rotateX(box([2, 84, 14], [-5.5, 0, 0], band), 45 + (k % 2) * 90),
    translate(rotateY(torus(44, 3, 12, 4, "IronDark"), 90), [-3, 0, 0]),
    sphereCenter(10, [-6, 0, 0], "IronLight", 8),
  );
}

// A carved dragon head looking along -Y (its neck at the origin).
function dragonHead(mat = "WoodRed"): Geo {
  return merge(
    box([16, 42, 30], [0, -16, 4], mat, 3),
    box([13, 44, 16], [0, -52, 2], mat, 3),
    rotateX(box([10, 36, 7], [0, -46, -12], mat, 2), 16, [0, -26, -9]),
    box([4, 16, 4], [0, -70, -8], "FabricRed"),
    sphereCenter(5, [8, -26, 12], "GoldTrim", 6),
    sphereCenter(5, [-8, -26, 12], "GoldTrim", 6),
    beamBetween([0, -6, 16], [0, 22, 42], 7, 9, "GoldTrim"),
    beamBetween([0, 22, 42], [0, 42, 34], 6, 8, "GoldTrim"),
    beamBetween([0, -30, 14], [0, -14, 30], 5, 6, "GoldTrim"),
  );
}

// Crossed barge boards on a gable at x = gx (roof of half-width `half` + `over` eaves, its ridge
// at `ridge`, slabs `th` thick) running past the ridge into two dragon heads.
function dragonGable(gx: number, half: number, over: number, ridge: number, h: number, th: number, ext: number, sc: number): Geo {
  const a = Math.atan2(h, half), ca = Math.cos(a), sa = Math.sin(a);
  const slope = (half + over) / ca, off = th + 10 * sc, parts: Geo[] = [];
  for (const s of [1, -1] as const) {
    const at = (t: number): V3 => [gx + s * 6 * sc, s * (t * ca + off * sa), ridge - t * sa + off * ca];
    const end = at(-ext);
    parts.push(beamBetween(at(slope - 8), end, 12 * sc, 40 * sc, "WoodRed"));
    parts.push(beamBetween(at(slope - 8), end, 13 * sc, 6 * sc, "GoldTrim"));
    parts.push(translate(rotateZ(rotateX(scale(dragonHead(), [sc, sc, sc]), -24), s > 0 ? 0 : 180), end));
  }
  return merge(...parts);
}

// A hide hanging flat in the YZ plane, its top at z = 0, facing -X.
function pelt(mat: string): Geo {
  const leg = (y: number, z: number, ang: number) => translate(rotateX(box([3, 12, 30], [0, 0, 0], mat, 1), ang), [0, y, z]);
  return merge(
    box([4, 54, 76], [0, 0, -52], mat, 1.5),
    box([4, 30, 22], [0, 0, -10], mat, 1.5),
    leg(30, -24, -42), leg(-30, -24, 42), leg(30, -84, 42), leg(-30, -84, -42),
    box([3, 10, 26], [0, 0, -98], mat, 1),
  );
}

// A fish hanging head down (body along Z, centred at the origin).
function fish(): Geo {
  return merge(
    scale(sphereCenter(17, [0, 0, 0], "Iceberg_Fish", 8), [0.38, 0.18, 1]),
    translate(rotateY(box([3, 2, 12], [0, 0, 0], "Iceberg_Fish"), 35), [3, 0, 20]),
    translate(rotateY(box([3, 2, 12], [0, 0, 0], "Iceberg_Fish"), -35), [-3, 0, 20]),
    cylinderBetween([0, 0, 22], [0, 0, 36], 0.8, 4, "RopeTan"),
  );
}

// A barrel of staves with iron hoops, 86 tall.
function barrel(snow = true): Geo {
  return merge(
    cylinderAt({ rBot: 28, rTop: 33, height: 42, segments: 12, bottom: [0, 0, 0] }, "Iceberg_Staves"),
    cylinderAt({ rBot: 33, rTop: 28, height: 42, segments: 12, bottom: [0, 0, 42] }, "Iceberg_Staves"),
    translate(torus(29.5, 2.2, 12, 4, "IronDark"), [0, 0, 8]),
    translate(torus(29.5, 2.2, 12, 4, "IronDark"), [0, 0, 76]),
    translate(torus(33.3, 2.2, 12, 4, "IronDark"), [0, 0, 42]),
    cylinderAt({ radius: 27, height: 2, segments: 12, bottom: [0, 0, 84] }, "WoodDark"),
    snow ? scale(sphereCenter(28, [0, 0, 86], "Snow", 10), [1, 1, 0.3], [0, 0, 86]) : [],
  );
}

// A crate s across with corner posts and rails, a cap of snow on top.
function snowyCrate(s: number, wood = "WoodGrey", frame = "WoodDark", snow = true): Geo {
  const h = s / 2 - 3.5, parts: Geo[] = [boxAt([s - 4, s - 4, s - 4], [0, 0, 2], wood, 1)];
  for (const a of [1, -1]) for (const b of [1, -1]) parts.push(boxAt([7, 7, s], [a * h, b * h, 0], frame, 1));
  for (const z of [0, s - 7]) for (const a of [1, -1]) parts.push(boxAt([s, 7, 7], [0, a * h, z], frame), boxAt([7, s, 7], [a * h, 0, z], frame));
  if (snow) parts.push(box([s - 4, s - 4, 9], [0, 0, s + 3], "Snow", 3.5));
  return merge(...parts);
}

// ---- buildings ----

// A log house of dark round logs on a stone footing, its steep gable to the front: a door under
// a little snowy canopy, lit windows with red shutters and white frames, a stone chimney.
function timberHouse(): Geo {
  const X = 350, Y = 300, z0 = 45, r = 13, d = 26, top = 345, trim = "Iceberg_TrimWhite";
  const parts: Geo[] = [
    boxBounds([-372, -330, 0], [372, 330, z0], "StoneBlueDark", 4),
    boxBounds([-X, -Y, z0], [X, Y, top], "WoodDark"),
    boxBounds([-X - 14, -Y - 15, top - 14], [X + 14, Y + 15, top + 4], "WoodShade", 2),
  ];
  for (let i = 0; i < 11; i++) {
    const zs = z0 + r + i * d, zg = z0 + d + i * d;
    for (const s of [1, -1]) {
      parts.push(log([-X - 25, s * Y, zs], [X + 25, s * Y, zs], r));
      parts.push(log([s * X, -Y - 25, zg], [s * X, Y + 25, zg], r));
    }
  }
  parts.push(snowRoof({ sx: 2 * X, sy: 2 * (Y + 15), h: 400, z: top + 4, over: 46, gableOver: 50, th: 22, mat: "Iceberg_Shingle", snow: 0.66, seed: 3 }));
  parts.push(gableBoards(-X - 15, Y + 15, top + 4, 396, -1), gableBoards(X + 15, Y + 15, top + 4, 396, 1));
  // the front: door under a canopy, steps, a window and a wall lantern
  parts.push(facing(plankDoor(110, 225), "-x", [-X - 11, -115, z0]));
  parts.push(facing(litWindow(80, 96, trim, "WoodRed"), "-x", [-X - 11, 135, z0 + 92]));
  parts.push(facing(wallLantern(), "-x", [-X - 11, 18, z0 + 168]));
  const cx = -X - 13 - 60;
  parts.push(translate(merge(
    snowRoof({ sx: 120, sy: 190, h: 72, z: 0, over: 12, gableOver: 8, th: 10, mat: "Iceberg_Shingle", snow: 0.66, snowTh: 10, seed: 13 }),
    gableBoards(-60, 95, 0, 70, -1),
  ), [cx, -115, z0 + 255]));
  for (const s of [1, -1]) {
    parts.push(boxBounds([cx - 62, -115 + s * 95 - 5, z0 + 246], [-X - 13, -115 + s * 95 + 5, z0 + 256], "WoodDark"));
    parts.push(beamBetween([-X - 13, -115 + s * 88, z0 + 170], [cx - 40, -115 + s * 88, z0 + 250], 8, 8, "WoodDark"));
  }
  parts.push(boxBounds([-440, -195, 0], [-372, -35, 15], "StoneGrey", 3), boxBounds([-406, -190, 15], [-372, -40, 30], "StoneGrey", 3));
  // the gable windows
  parts.push(facing(litWindow(62, 74, trim), "-x", [-X - 16, 0, top + 100]), facing(litWindow(62, 74, trim), "+x", [X + 16, 0, top + 100]));
  // the sides and back
  for (const s of [1, -1]) for (const x of [-170, 150]) parts.push(facing(litWindow(80, 96, trim, "WoodRed"), s < 0 ? "-y" : "+y", [x, s * (Y + 11), z0 + 92]));
  parts.push(facing(litWindow(80, 96, trim, "WoodRed"), "+x", [X + 11, 0, z0 + 92]));
  parts.push(translate(chimneyStack(66, 280, 840), [140, 95, 0]));
  // snow drifted against the walls
  for (const s of [1, -1]) parts.push(drift([0, s * 348, 0], 780, 64, 28));
  parts.push(drift([394, 0, 0], 60, 660, 26), drift([-394, 190, 0], 56, 190, 22));
  return centre(merge(...parts));
}

// A fieldstone cottage, its ridge along Y: an arched door and lit windows with blue shutters on
// the long front, quoined corners, a slate roof under snow and a big stone chimney on one gable.
function stoneCottage(): Geo {
  const X = 290, Y = 360, top = 290;
  const parts: Geo[] = [
    boxBounds([-X - 12, -Y - 12, 0], [X + 12, Y + 12, 40], "StoneBlueDark", 3),
    boxBounds([-X, -Y, 0], [X, Y, top], "StoneGrey", 4),
  ];
  for (const sx of [1, -1]) for (const sy of [1, -1]) for (let i = 0; i < 6; i++) {
    const lx = i % 2 ? 50 : 30, ly = i % 2 ? 30 : 50;
    parts.push(boxAt([lx, ly, 38], [sx * (X - lx / 2 + 4), sy * (Y - ly / 2 + 4), 44 + i * 41], "StoneBlueDark", 3));
  }
  // fieldstones standing out of the walls
  const stone = (seed: number): Geo => rotateY(rock([24, 36, 12], 0.35, seed, seed % 3 ? "StoneDark" : "StoneBlueDark"), -90);
  const spots: [Side, number, number][] = [
    ["-x", -290, 90], ["-x", -250, 230], ["-x", 10, 70], ["-x", -10, 250], ["-x", 280, 210], ["-x", 300, 75],
    ["+x", -300, 120], ["+x", 0, 90], ["+x", 0, 245], ["+x", 300, 210], ["+x", -260, 260],
    ["-y", -200, 80], ["-y", -220, 230], ["-y", 210, 150], ["-y", 180, 262], ["+y", -210, 100], ["+y", 200, 220], ["+y", -185, 250],
  ];
  spots.forEach(([side, u, z], i) => {
    const at: V3 = side === "-x" ? [-X + 3, u, z] : side === "+x" ? [X - 3, u, z] : side === "-y" ? [u, -Y + 3, z] : [u, Y - 3, z];
    parts.push(facing(stone(5 + i * 7), side, at));
  });
  // roof and stone gables
  parts.push(rotateZ(merge(
    snowRoof({ sx: 2 * Y, sy: 2 * X, h: 370, z: top, over: 44, gableOver: 36, th: 22, mat: "RoofSlate", snow: 0.66, seed: 19 }),
    gableWall(Y, X, top, 366, "StoneGrey"), gableWall(-Y, X, top, 366, "StoneGrey"),
  ), 90));
  // a dormer on the front slope
  parts.push(
    boxBounds([-205, -75, 400], [-30, 75, 540], "WoodDark"),
    boxBounds([-209, -79, 400], [-201, -71, 544], "WoodShade"), boxBounds([-209, 71, 400], [-201, 79, 544], "WoodShade"),
    translate(snowRoof({ sx: 175, sy: 158, h: 78, z: 540, over: 14, gableOver: 12, th: 12, snowTh: 10, mat: "RoofSlate", snow: 0.7, seed: 23 }), [-117.5, 0, 0]),
    gableBoards(-205, 79, 540, 75, -1),
    facing(litWindow(54, 62, "Iceberg_TrimWhite"), "-x", [-206, 0, 446]),
  );
  // door, windows, lantern
  parts.push(facing(archDoor(110, 150), "-x", [-X - 12, -140, 0]));
  parts.push(boxBounds([-X - 50, -215, 0], [-X - 12, -65, 10], "StoneGrey", 2));
  parts.push(facing(litWindow(78, 88, "WoodDark", "Iceberg_PaintBlue"), "-x", [-X - 1, 130, 115]));
  parts.push(facing(wallLantern(), "-x", [-X - 1, -30, 190]));
  for (const y of [-150, 150]) parts.push(facing(litWindow(78, 88, "WoodDark", "Iceberg_PaintBlue"), "+x", [X + 1, y, 115]));
  parts.push(facing(litWindow(70, 80, "WoodDark", "Iceberg_PaintBlue"), "-y", [0, -Y - 1, 115]));
  parts.push(facing(litWindow(54, 62, "WoodDark"), "-y", [0, -Y - 1, top + 92]));
  // the chimney on the +Y gable
  parts.push(
    boxBounds([-88, Y, 0], [88, Y + 98, 40], "StoneBlueDark", 3),
    boxBounds([-78, Y, 40], [78, Y + 90, 330], "StoneGrey", 4),
    box([164, 96, 12], [0, Y + 45, 334], "Snow", 5),
    translate(chimneyStack(84, 330, 770), [0, Y + 44, 0]),
  );
  // drifts
  parts.push(drift([X + 32, 0, 0], 62, 700, 28), drift([0, -Y - 32, 0], 620, 58, 26), drift([-X - 32, 255, 0], 56, 200, 24));
  return centre(merge(...parts));
}

// The great hall (the landmark): a timber longhouse 18 m long on a stone footing. Stave walls
// between carved posts hung with shields, small lit windows, a steep snowy roof whose gables end
// in crossed boards and dragon heads, a smoke louvre glowing on the ridge, and a pillared porch
// with a carved portal, braziers and banners at the front.
function greatHall(): Geo {
  const X = 900, Y = 500, z0 = 60, top = 470, parts: Geo[] = [];
  parts.push(boxBounds([-X - 30, -Y - 30, 0], [X + 30, Y + 30, z0], "StoneBlueDark", 5));
  for (const s of [1, -1]) {
    parts.push(boxBounds([-X - 24, s * Y - 24, z0], [X + 24, s * Y + 24, z0 + 20], "WoodShade", 2));
    parts.push(boxBounds([s * X - 24, -Y, z0], [s * X + 24, Y, z0 + 20], "WoodShade", 2));
  }
  const post = (x: number, y: number): Geo => boxBounds([x - 22, y - 22, z0], [x + 22, y + 22, top + 12], "WoodShade", 3);
  const sideX = Array.from({ length: 9 }, (_, i) => -X + i * 225);
  for (const s of [1, -1]) {
    for (const x of sideX) parts.push(post(x, s * Y));
    for (const y of [-330, -150, 150, 330]) parts.push(post(s * X, y));
    for (let i = 0; i < 8; i++) parts.push(boxBounds([sideX[i] + 22, s * Y - 10, z0], [sideX[i + 1] - 22, s * Y + 10, top], "WoodDark"));
    for (const [a, b] of [[-478, -352], [-308, -172], [172, 308], [352, 478]]) parts.push(boxBounds([s * X - 10, a, z0], [s * X + 10, b, top], "WoodDark"));
    parts.push(boxBounds([-X - 26, s * Y - 26, top], [X + 26, s * Y + 26, top + 22], "WoodShade", 2));
    parts.push(boxBounds([s * X - 26, -Y, top], [s * X + 26, Y, top + 22], "WoodShade", 2));
    // windows between the posts, shields on them
    for (let i = 0; i < 8; i++) parts.push(facing(litWindow(60, 74, "WoodShade"), s > 0 ? "+y" : "-y", [sideX[i] + 112.5, s * (Y + 10), z0 + 215]));
    for (let i = 1; i < 8; i++) parts.push(facing(shield(i + (s > 0 ? 1 : 0)), s > 0 ? "+y" : "-y", [sideX[i], s * (Y + 22), z0 + 150]));
    // drifts along the long walls
    parts.push(drift([60, s * (Y + 58), 0], 1640, 76, 34));
  }
  parts.push(boxBounds([X - 10, -128, z0], [X + 10, 128, top], "WoodDark"));
  parts.push(boxBounds([-X - 10, -128, z0 + 280], [-X + 10, 128, top], "WoodDark"));
  // roof, gables, dragons
  const roofZ = top + 22, rise = 640, ridge = roofZ + rise;
  parts.push(snowRoof({ sx: 2 * X, sy: 2 * (Y + 26), h: rise, z: roofZ, over: 75, gableOver: 70, th: 26, mat: "Iceberg_Shingle", snow: 0.66, snowTh: 20, seed: 29, barge: "WoodRed" }));
  for (const s of [1, -1] as const) {
    parts.push(gableBoards(s * (X + 26), Y + 26, roofZ, rise - 8, s));
    parts.push(dragonGable(s * (X + 88), Y + 26, 75, ridge, rise, 26, 230, 1.5));
    // round gable window
    const gx = s * (X + 28), gz = top + 400;
    parts.push(
      cylinderBetween([gx, 0, gz], [gx + s * 4, 0, gz], 48, 12, "LanternGlow"),
      translate(rotateY(torus(50, 6, 12, 5, "WoodRed"), 90), [gx + s * 5, 0, gz]),
      beamBetween([gx + s * 6, 0, gz - 48], [gx + s * 6, 0, gz + 48], 5, 5, "WoodRed"),
      beamBetween([gx + s * 6, -48, gz], [gx + s * 6, 48, gz], 5, 5, "WoodRed"),
    );
  }
  // the smoke louvre on the ridge, the hearth glowing under it
  parts.push(boxBounds([-150, -34, ridge + 32], [150, 34, ridge + 62], "FireGlow"));
  for (const x of [-150, 150]) for (const y of [-52, 52]) parts.push(boxBounds([x - 7, y - 7, ridge + 10], [x + 7, y + 7, ridge + 64], "WoodDark"));
  parts.push(snowRoof({ sx: 300, sy: 120, h: 60, z: ridge + 62, over: 16, gableOver: 12, th: 10, snowTh: 10, mat: "Iceberg_Shingle", snow: 0.66, icicles: false, seed: 43 }));
  parts.push(gableWall(-150, 60, ridge + 62, 56, "WoodDark"), gableWall(150, 60, ridge + 62, 56, "WoodDark"));
  // the porch
  const p1 = -X - 320, p0 = -X - 22;
  parts.push(boxBounds([p1 - 20, -260, 0], [p0, 260, z0], "StoneBlueDark", 4));
  for (let k = 0; k < 3; k++) parts.push(boxBounds([p1 - 20 - 34 * (3 - k), -210, 20 * k], [p1 - 20, 210, 20 * (k + 1)], "StoneGrey", 3));
  for (const y of [-205, 205]) {
    for (const x of [p1 + 20, p0 - 24]) {
      parts.push(cylinderAt({ radius: 30, height: 16, segments: 8, bottom: [x, y, z0] }, "StoneGrey"));
      parts.push(cylinderAt({ radius: 22, height: 314, segments: 8, bottom: [x, y, z0 + 16] }, "WoodShade"));
      for (const z of [z0 + 80, z0 + 260]) parts.push(cylinderAt({ radius: 25, height: 10, segments: 8, bottom: [x, y, z] }, "GoldTrim"));
      parts.push(boxAt([56, 56, 18], [x, y, z0 + 312], "WoodRed", 3));
    }
    parts.push(boxBounds([p1 + 10, y - 4, z0 + 86], [p0 - 30, y + 4, z0 + 96], "WoodShade"));
    for (let x = p1 + 70; x < p0 - 50; x += 50) parts.push(boxBounds([x - 4, y - 4, z0], [x + 4, y + 4, z0 + 86], "WoodShade"));
    parts.push(boxBounds([p1 - 2, y - 14, z0 + 330], [p0, y + 14, z0 + 352], "WoodShade", 2));
  }
  parts.push(boxBounds([p1 - 4, -232, z0 + 330], [p1 + 28, 232, z0 + 352], "WoodShade", 2));
  const psx = p0 + 60 - p1, pcx = (p1 + p0 + 60) / 2, pz = z0 + 352, prise = 330;
  parts.push(translate(merge(
    snowRoof({ sx: psx, sy: 440, h: prise, z: pz, over: 40, gableOver: 22, th: 18, mat: "Iceberg_Shingle", snow: 0.66, seed: 37, barge: "WoodRed" }),
    gableBoards(-psx / 2, 220, pz, prise - 6, -1, "WoodDark", "WoodRed"),
  ), [pcx, 0, 0]));
  parts.push(dragonGable(p1 - 22 - 18, 220, 40, pz + prise, prise, 18, 140, 1.05));
  parts.push(
    cylinderBetween([p1 - 4, 0, pz + 120], [p1 - 1, 0, pz + 120], 34, 12, "GoldTrim"),
    translate(rotateY(torus(44, 4, 12, 4, "WoodRed"), 90), [p1 - 3, 0, pz + 120]),
  );
  // the carved portal
  const portal: Geo[] = [
    boxAt([8, 116, 280], [-4, -59, 0], "DoorWood", 1.5),
    boxAt([8, 116, 280], [-4, 59, 0], "DoorWood", 1.5),
    boxAt([20, 22, 290], [-10, -129, 0], "WoodRed", 2),
    boxAt([20, 22, 290], [-10, 129, 0], "WoodRed", 2),
    boxAt([26, 290, 26], [-13, 0, 280], "WoodRed", 3),
    cylinderBetween([-6, 0, 306], [0, 0, 306], 106, 16, "WoodDark"),
    sphereCenter(16, [-8, 0, 360], "GoldTrim", 8),
  ];
  for (const z of [40, 140, 240]) for (const y of [-59, 59]) portal.push(boxAt([3, 100, 9], [-9.5, y, z], "IronDark"));
  for (const y of [-14, 14]) portal.push(translate(rotateY(torus(9, 2, 10, 4, "IronDark"), 90), [-10, y, 130]));
  for (let k = 0; k < 10; k++) {
    const t0 = k * 18 * RAD, t1 = (k + 1) * 18 * RAD;
    portal.push(beamBetween([-8, 108 * Math.cos(t0), 306 + 108 * Math.sin(t0)], [-8, 108 * Math.cos(t1), 306 + 108 * Math.sin(t1)], 6, 9, "GoldTrim"));
  }
  parts.push(translate(merge(...portal), [-X - 10, 0, z0]));
  // braziers by the steps and banners on the front posts
  for (const y of [-275, 275]) parts.push(translate(brazier(), [p1 - 80, y, 0]));
  for (const y of [-330, 330]) {
    parts.push(boxAt([3, 74, 210], [-X - 24, y, z0 + 110], "FabricRed"));
    parts.push(boxAt([3, 76, 10], [-X - 25, y, z0 + 300], "GoldTrim"), boxAt([3, 76, 8], [-X - 25, y, z0 + 126], "GoldTrim"));
    parts.push(translate(rotateX(box([3, 52, 52], [0, 0, 0], "FabricRed"), 45), [-X - 24, y, z0 + 110]));
    parts.push(translate(snowflake(20), [-X - 26, y, z0 + 220]));
  }
  return centre(merge(...parts));
}

// An iron brazier on three legs with a fire in its bowl.
function brazier(): Geo {
  const legs = [0, 120, 240].map((t) => {
    const c = Math.cos(t * RAD), s = Math.sin(t * RAD);
    return beamBetween([c * 34, s * 34, 0], [c * 18, s * 18, 82], 5, 5, "IronDark");
  });
  return merge(
    ...legs,
    cylinderAt({ rBot: 16, rTop: 32, height: 24, segments: 10, bottom: [0, 0, 80] }, "IronDark"),
    translate(torus(32, 3, 10, 4, "IronDark"), [0, 0, 104]),
    cylinderAt({ radius: 29, height: 3, segments: 10, bottom: [0, 0, 103] }, "FireGlow"),
    cylinderAt({ rBot: 22, rTop: 0, height: 62, segments: 6, bottom: [0, 0, 104] }, "FireGlow"),
    cylinderAt({ rBot: 13, rTop: 0, height: 44, segments: 6, bottom: [10, 6, 104] }, "LanternGlow"),
    cylinderAt({ rBot: 12, rTop: 0, height: 40, segments: 6, bottom: [-10, -8, 104] }, "FireGlow"),
  );
}

// A six-armed snowflake in the YZ plane (an emblem), centred at the origin.
function snowflake(r: number, mat = "GoldTrim"): Geo {
  const parts: Geo[] = [];
  for (let k = 0; k < 6; k++) {
    const t = k * 60 * RAD, c = Math.cos(t), s = Math.sin(t);
    parts.push(beamBetween([0, 0, 0], [0, c * r, s * r], 3, 3.5, mat));
    for (const b of [-1, 1]) {
      const t2 = t + b * 45 * RAD, f = 0.55;
      parts.push(beamBetween([0, c * r * f, s * r * f], [0, c * r * f + Math.cos(t2) * r * 0.34, s * r * f + Math.sin(t2) * r * 0.34], 2.5, 3, mat));
    }
  }
  return merge(...parts);
}

// A fisherman's hut of weathered boards on short stilts by the shore: a front deck, a door and a
// lit window, nets hung on the wall, oars, a stove pipe, and a rack of fish drying beside it.
function fisherHut(): Geo {
  const X = 180, Y = 160, fl = 50, top = 280, parts: Geo[] = [];
  for (const x of [-X + 12, X - 12]) for (const y of [-Y + 12, Y - 12]) parts.push(cylinderAt({ radius: 11, height: fl - 14, segments: 6, bottom: [x, y, 0] }, "WoodDark"));
  for (const y of [-130, 130]) parts.push(cylinderAt({ radius: 9, height: fl - 14, segments: 6, bottom: [-298, y, 0] }, "WoodDark"));
  parts.push(boxBounds([-X - 12, -Y - 12, fl - 14], [X + 12, Y + 12, fl], "WoodGrey", 1.5));
  for (const y of [-136, 136]) parts.push(boxBounds([-312, y - 7, fl - 20], [-X - 12, y + 7, fl - 6], "WoodDark"));
  for (let i = 0; i < 4; i++) parts.push(boxAt([25, 300, 6], [-298 + i * 28, 0, fl - 6], "WoodGrey", 1));
  // walls with lap boards, corner posts
  parts.push(boxBounds([-X, -Y, fl], [X, Y, top], "WoodGrey"));
  for (let z = fl + 22; z < top - 6; z += 22) {
    parts.push(boxBounds([-X - 2.5, -Y, z], [-X, Y, z + 3], "Iceberg_GreyShade"), boxBounds([X, -Y, z], [X + 2.5, Y, z + 3], "Iceberg_GreyShade"));
    parts.push(boxBounds([-X, -Y - 2.5, z], [X, -Y, z + 3], "Iceberg_GreyShade"), boxBounds([-X, Y, z], [X, Y + 2.5, z + 3], "Iceberg_GreyShade"));
  }
  for (const sx of [1, -1]) for (const sy of [1, -1]) parts.push(boxBounds([sx * X - 8, sy * Y - 8, fl], [sx * X + 8, sy * Y + 8, top + 6], "WoodDark", 1.5));
  parts.push(snowRoof({ sx: 2 * X, sy: 2 * Y + 16, h: 220, z: top + 6, over: 40, gableOver: 38, th: 16, mat: "Iceberg_Shingle", snow: 0.66, seed: 41 }));
  parts.push(gableBoards(-X - 9, Y + 8, top + 6, 214, -1, "WoodGrey", "WoodDark"), gableBoards(X + 9, Y + 8, top + 6, 214, 1, "WoodGrey", "WoodDark"));
  // front
  parts.push(facing(plankDoor(88, 190, "WoodDark"), "-x", [-X - 2, 50, fl]));
  parts.push(facing(litWindow(54, 58, "Iceberg_TrimWhite", "Iceberg_PaintBlue"), "-x", [-X - 2, -88, fl + 100]));
  parts.push(facing(wallLantern(), "-x", [-X - 2, -15, fl + 150]));
  parts.push(boxAt([5, 90, 40], [-X - 12, 0, top + 40], "WoodPale", 1.5), translate(rotateY(scale(fish(), [1.6, 1.6, 1.6]), 90), [-X - 18, 0, top + 60]));
  parts.push(facing(litWindow(54, 58, "Iceberg_TrimWhite", "Iceberg_PaintBlue"), "+y", [40, Y + 2, fl + 100]));
  parts.push(facing(litWindow(54, 58, "Iceberg_TrimWhite"), "+x", [X + 2, -40, fl + 100]));
  // stove pipe through the roof
  parts.push(cylinderAt({ radius: 10, height: 290, segments: 8, bottom: [90, -90, top] }, "IronDark"),
    cylinderAt({ radius: 16, height: 6, segments: 8, bottom: [90, -90, top + 290] }, "IronDark"),
    cylinderAt({ radius: 7, height: 3, segments: 8, bottom: [90, -90, top + 288] }, "FireGlow"));
  // a net drying on the -Y wall, with floats
  parts.push(boxBounds([-120, -Y - 6, fl + 60], [120, -Y - 3, fl + 190], "RopeTan"));
  parts.push(beamBetween([-130, -Y - 8, fl + 192], [130, -Y - 8, fl + 192], 5, 5, "WoodDark"));
  for (let i = 0; i < 7; i++) parts.push(sphereCenter(6, [-105 + i * 35, -Y - 9, fl + 186], i % 2 ? "FabricRed" : "WoodPale", 6));
  // oars leaning on the back wall, a barrel and a crate on the deck
  for (const y of [-60, -20]) parts.push(beamBetween([X + 34, y, 0], [X + 6, y + 14, 250], 5, 5, "WoodPale"), translate(rotateY(boxAt([4, 18, 60], [0, 0, 0], "WoodPale", 1), -6), [X + 33, y, 2]));
  parts.push(translate(scale(barrel(), [0.7, 0.7, 0.7]), [-280, 105, fl]), translate(snowyCrate(46), [-282, -100, fl]));
  // the fish rack beside the hut
  const rack: Geo[] = [cylinderBetween([-150, 0, 186], [150, 0, 186], 4, 6, "WoodGrey")];
  for (const x of [-130, 130]) rack.push(beamBetween([x, -45, 0], [x, 0, 192], 8, 8, "WoodGrey"), beamBetween([x, 45, 0], [x, 0, 192], 8, 8, "WoodGrey"));
  for (let i = 0; i < 7; i++) rack.push(translate(fish(), [-100 + i * 33, 0, 148]));
  rack.push(box([300, 9, 6], [0, 0, 192], "Snow", 2.5));
  parts.push(translate(merge(...rack), [0, Y + 90, 0]));
  parts.push(drift([X + 42, 0, 0], 58, 420, 24));
  return centre(merge(...parts));
}

// A smithy: an open-fronted timber shed on a cobbled floor, its back and one side in stone; a
// stone forge with glowing coals under a hood and chimney by the front corner, an anvil on a
// stump, a quench trough, bellows, a grindstone, tools on the wall, a hanging sign and a rack of
// swords for sale outside.
function smithy(): Geo {
  const X = 300, Y = 280, top = 320, parts: Geo[] = [];
  parts.push(boxBounds([-X - 25, -Y - 25, 0], [X + 25, Y + 25, 10], "CobbleDark", 2));
  parts.push(boxBounds([X - 36, -Y - 18, 10], [X + 18, Y + 18, top + 6], "StoneGrey", 4));
  parts.push(boxBounds([-X, -Y - 14, 10], [X - 36, -Y + 6, 90], "StoneGrey", 3));
  parts.push(boxBounds([-X, -Y - 10, 90], [X - 36, -Y + 6, top], "WoodDark"));
  parts.push(boxBounds([40, Y - 14, 10], [X - 36, Y + 10, 110], "StoneGrey", 3));
  const post = (x: number, y: number) => boxBounds([x - 15, y - 15, 10], [x + 15, y + 15, top], "WoodShade", 2);
  parts.push(post(-X, -Y), post(-X, Y), post(40, Y), post(40, -Y));
  for (const s of [1, -1]) {
    parts.push(boxBounds([-X - 16, s * Y - 16, top - 22], [X - 30, s * Y + 16, top + 6], "WoodShade", 2));
    parts.push(beamBetween([-X, s * (Y - 10), top - 100], [-X, s * (Y - 95), top - 24], 12, 12, "WoodShade"));
  }
  parts.push(beamBetween([40, Y - 10, top - 90], [-40, Y - 10, top - 22], 12, 12, "WoodShade"));
  parts.push(boxBounds([-X - 18, -Y - 16, top - 26], [-X + 16, Y + 16, top + 6], "WoodShade", 2));
  parts.push(translate(snowRoof({ sx: 2 * X + 20, sy: 2 * Y + 32, h: 300, z: top + 6, over: 42, gableOver: 40, th: 18, mat: "Iceberg_Shingle", snow: 0.66, seed: 51 }), [8, 0, 0]));
  parts.push(gableBoards(-X - 18, Y + 16, top + 6, 294, -1), gableWall(X + 18, Y + 16, top + 6, 294, "StoneGrey"));
  parts.push(facing(litWindow(70, 70), "-y", [150, -Y - 10, 130]));
  // the forge in the front corner, against the stone side
  const fy = -Y + 68;
  parts.push(
    boxBounds([-272, -Y + 6, 10], [-108, -Y + 130, 92], "StoneBlueDark", 4),
    boxBounds([-260, -Y + 18, 92], [-120, -Y + 118, 97], "Iceberg_Coal"),
    boxBounds([-246, -Y + 30, 95], [-134, -Y + 106, 101], "FireGlow"),
    translate(rotateZ(cylinderAt({ rBot: 118, rTop: 46, height: 110, segments: 4, bottom: [0, 0, 0] }, "StoneGrey"), 45), [-190, fy, 196]),
    boxBounds([-274, fy - 86, 188], [-106, fy + 86, 200], "StoneBlueDark", 2),
    translate(chimneyStack(70, 300, 690), [-190, fy - 6, 0]),
  );
  for (const [x, y] of [[-250, fy - 30], [-140, fy + 30], [-180, fy + 34], [-230, fy + 32], [-130, fy - 28]]) parts.push(sphereCenter(9, [x, y, 99], "Iceberg_Coal", 6));
  for (const [x, y, h, m] of [[-200, fy - 8, 46, "FireGlow"], [-172, fy + 12, 34, "LanternGlow"], [-222, fy + 14, 30, "FireGlow"], [-160, fy - 16, 26, "FireGlow"]] as const)
    parts.push(cylinderAt({ rBot: 12, rTop: 0, height: h, segments: 6, bottom: [x, y, 100] }, m));
  // bellows behind the forge
  parts.push(
    boxBounds([-90, -Y + 26, 10], [-80, -Y + 96, 64], "WoodDark"), boxBounds([10, -Y + 26, 10], [20, -Y + 96, 64], "WoodDark"),
    translate(rotateY(boxAt([116, 64, 5], [0, 0, 0], "WoodDark", 1), -6), [-36, -Y + 61, 64]),
    translate(rotateY(boxAt([100, 58, 14], [0, 0, 0], "Iceberg_Leather", 2), -3), [-30, -Y + 61, 69]),
    cylinderBetween([-96, -Y + 61, 72], [-114, -Y + 61, 84], 4, 6, "IronDark"),
  );
  // the anvil on its stump, a glowing billet and a hammer
  const ax = -170, ay = 70;
  parts.push(
    cylinderAt({ radius: 30, height: 48, segments: 9, bottom: [ax, ay, 10] }, "Iceberg_Log"),
    cylinderAt({ radius: 27, height: 2, segments: 9, bottom: [ax, ay, 58] }, "Iceberg_LogEnd"),
    boxAt([40, 30, 14], [ax, ay, 60], "IronDark", 1.5),
    boxAt([24, 20, 14], [ax, ay, 74], "IronDark"),
    boxAt([70, 26, 16], [ax, ay, 88], "IronDark", 1.5),
    cylinderBetween([ax - 35, ay, 97], [ax - 72, ay, 99], 8, 8, "IronDark", 1.5),
    boxAt([22, 6, 4], [ax + 10, ay + 4, 104], "FireGlow"),
    beamBetween([ax + 20, ay - 20, 106], [ax + 50, ay - 50, 106], 4, 4, "WoodPale"),
    box([10, 16, 9], [ax + 18, ay - 18, 108], "IronLight"),
  );
  // quench trough along the open side, a grindstone, a coal heap
  parts.push(boxBounds([-230, 165, 10], [-60, 235, 72], "WoodDark", 2), boxBounds([-220, 173, 62], [-70, 227, 68], "WaterDark"));
  for (const x of [-210, -80]) parts.push(boxBounds([x - 4, 163, 10], [x + 4, 237, 74], "IronDark"));
  parts.push(
    cylinderBetween([110, -130, 72], [110, -102, 72], 40, 12, "StoneGrey"),
    cylinderBetween([110, -150, 72], [110, -82, 72], 4, 6, "IronDark"),
    boxBounds([70, -150, 10], [150, -144, 76], "WoodDark"), boxBounds([70, -88, 10], [150, -82, 76], "WoodDark"),
    boxBounds([70, -150, 10], [80, -82, 20], "WoodDark"),
  );
  parts.push(translate(rock([110, 80, 46], 0.5, 5, "Iceberg_Coal"), [X - 130, Y - 90, 10]));
  // tools on the back wall
  parts.push(boxBounds([X - 42, -170, 200], [X - 36, 10, 208], "WoodDark"));
  for (let i = 0; i < 6; i++) {
    const y = -155 + i * 32;
    parts.push(beamBetween([X - 44, y, 204], [X - 44, y + (i % 2 ? 6 : -6), 130], 3, 3, i % 2 ? "IronDark" : "WoodShade"));
    if (i % 2 === 0) parts.push(box([6, 14, 10], [X - 44, y - 6, 128], "IronDark"));
  }
  // the hanging sign and a sword rack outside
  parts.push(
    beamBetween([-X, -Y, 266], [-X - 90, -Y, 266], 6, 6, "IronDark"),
    boxAt([5, 70, 46], [-X - 60, -Y, 202], "WoodPale", 1.5),
    boxAt([7, 40, 10], [-X - 60, -Y, 230], "IronDark"), boxAt([7, 16, 14], [-X - 60, -Y, 216], "IronDark"), boxAt([7, 30, 8], [-X - 60, -Y, 210], "IronDark"),
    cylinderBetween([-X - 78, -Y, 248], [-X - 78, -Y, 266], 1, 4, "IronDark"), cylinderBetween([-X - 42, -Y, 248], [-X - 42, -Y, 266], 1, 4, "IronDark"),
  );
  const rx = -X - 70, ry = 150;
  parts.push(boxBounds([rx - 5, ry - 70, 0], [rx + 5, ry - 62, 110], "WoodDark"), boxBounds([rx - 5, ry + 62, 0], [rx + 5, ry + 70, 110], "WoodDark"));
  parts.push(boxBounds([rx - 6, ry - 70, 96], [rx + 6, ry + 70, 104], "WoodDark"), box([10, 140, 6], [rx, ry, 107], "Snow", 2.5));
  for (let i = 0; i < 4; i++) {
    const y = ry - 45 + i * 30;
    parts.push(
      beamBetween([rx + 22, y, 2], [rx + 2, y, 92], 6, 1.6, "IronLight"),
      beamBetween([rx + 1, y - 9, 94], [rx + 1, y + 9, 94], 3, 3, "GoldTrim"),
      beamBetween([rx, y, 96], [rx - 4, y, 116], 3.5, 3.5, "Iceberg_Leather"),
    );
  }
  parts.push(drift([X + 48, 0, 0], 62, 620, 26), drift([40, -Y - 48, 0], 600, 58, 24));
  return centre(merge(...parts));
}

// A fur trader's stall: a counter draped with hides under a snowy lean-to roof, more hides on a
// rail behind, antlers over the sign, a lantern and a crate of goods.
function furStall(): Geo {
  const W = 175, parts: Geo[] = [];
  const furs = ["Iceberg_Fur", "Iceberg_FurGrey", "FeltCream", "Iceberg_FurDark"];
  for (const y of [-W, W]) {
    parts.push(boxBounds([-122, y - 7, 0], [-108, y + 7, 262], "WoodDark", 1.5));
    parts.push(boxBounds([108, y - 7, 0], [122, y + 7, 214], "WoodDark", 1.5));
    parts.push(boxBounds([-108, y - 5, 0], [108, y + 5, 105], "WoodDark"));
    parts.push(boxBounds([-122, y - 9, 205], [122, y + 9, 217], "WoodShade"));
  }
  parts.push(boxBounds([-150, -W + 7, 0], [-96, W - 7, 92], "WoodDark", 2));
  parts.push(boxBounds([-158, -W - 8, 92], [-88, W + 8, 100], "WoodPale", 2));
  // the roof: down from 262 at the front to 214 at the back
  const pitch = Math.atan2(48, 230) * DEG;
  const roof = merge(
    box([340, 2 * W + 50, 10], [0, 0, 0], "Iceberg_Shingle", 2),
    box([272, 2 * W + 40, 12], [30, 0, 10], "Snow", 5),
    cylinderBetween([-106, -W - 18, 10], [-106, W + 18, 10], 8, 7, "Snow"),
    ...[[-150, 26, 70], [-60, 18, 52], [80, 30, 80]].map(([y, e, w]) => scale(sphereCenter(w / 2, [-106, y, 5], "Snow", 8), [e / (w / 2), 1, 9 / (w / 2)], [-106, y, 5])),
  );
  parts.push(translate(rotateY(roof, pitch), [0, 0, 243]));
  const ex = -170 * Math.cos(pitch * RAD) - 5 * Math.sin(pitch * RAD), ez = 243 + 170 * Math.sin(pitch * RAD) - 5 * Math.cos(pitch * RAD);
  parts.push(icicles([ex, -W - 20, ez], [ex, W + 20, ez], 61, 24, 36));
  const fw = (2 * W + 40) / 9;
  for (let k = 0; k < 9; k++) parts.push(boxAt([3, fw - 3, 24], [ex + 8, -W - 20 + fw * (k + 0.5), ez - 22], k % 2 ? "FeltCream" : "FabricRed"));
  // hides on the counter and the rail
  for (let k = 0; k < 4; k++) {
    const y = -120 + 80 * k, m = furs[k];
    parts.push(box([62, 64, 4], [-124, y, 102], m, 1.5), box([4, 60, 56], [-160, y, 72], m, 1.5));
  }
  parts.push(beamBetween([95, -W + 6, 198], [95, W - 6, 198], 7, 7, "WoodDark"));
  for (let k = 0; k < 4; k++) parts.push(translate(pelt(furs[(k + 1) % 4]), [95, -105 + 70 * k, 194]));
  // folded furs on a low bench, a crate
  parts.push(boxBounds([-20, 40, 0], [60, 150, 40], "WoodShade", 1.5));
  for (let k = 0; k < 4; k++) parts.push(box([70, 96, 9], [20 + (k % 2) * 4, 95, 45 + k * 9], furs[(k + 2) % 4], 2));
  parts.push(translate(snowyCrate(52, "WoodPale", "WoodDark", false), [10, -110, 0]));
  // sign with antlers, a lantern
  parts.push(boxAt([6, 130, 40], [-150, 0, 284], "WoodPale", 2), translate(antlers(), [-150, 0, 330]));
  parts.push(boxAt([7, 92, 8], [-154, 0, 302], "Iceberg_FurDark"), boxAt([7, 70, 6], [-154, 0, 292], "Iceberg_FurDark"));
  parts.push(cylinderBetween([-135, W - 30, 236], [-135, W - 30, 262], 1, 4, "IronDark"), translate(scale(lanternBox(), [0.8, 0.8, 0.8]), [-135, W - 30, 198]));
  return centre(merge(...parts));
}

function antlers(): Geo {
  const side = (s: number): Geo => merge(
    cylinderBetween([0, s * 8, 0], [0, s * 30, 30], 3.5, 6, "WoodPale", 3),
    cylinderBetween([0, s * 30, 30], [0, s * 44, 70], 3, 6, "WoodPale", 2.2),
    cylinderBetween([0, s * 44, 70], [0, s * 40, 98], 2.2, 6, "WoodPale", 1),
    cylinderBetween([0, s * 30, 30], [-8, s * 18, 58], 2.2, 5, "WoodPale", 1),
    cylinderBetween([0, s * 40, 56], [-6, s * 62, 80], 2.2, 5, "WoodPale", 1),
  );
  return merge(side(1), side(-1), sphereCenter(9, [0, 0, 0], "WoodPale", 8));
}

// ---- defence ----

// A palisade of sharpened logs 8 m long (tiles end to end along Y), on a snow bank, rails and a
// rope binding on the inner side (+X), stakes slanting out at the front (-X).
function palisade(): Geo {
  const rnd = seeded(61), parts: Geo[] = [];
  parts.push(scale(cylinderBetween([10, -400, -20], [10, 400, -20], 60, 10, "Snow"), [1.35, 1, 0.6], [10, 0, 0]));
  const n = 26, pitch = 800 / n;
  for (let i = 0; i < n; i++) {
    const y = -400 + pitch * (i + 0.5), H = 320 + rnd() * 50;
    parts.push(cylinderAt({ radius: 15, height: H + 10, segments: 8, bottom: [rnd() * 4 - 2, y, -10] }, "Iceberg_Log"));
    parts.push(cylinderAt({ rBot: 15, rTop: 1.5, height: 38, segments: 8, bottom: [0, y, H] }, "Iceberg_LogEnd"));
  }
  for (const z of [80, 230]) {
    parts.push(boxBounds([16, -400, z], [36, 400, z + 22], "WoodDark"));
    parts.push(box([18, 800, 9], [26, 0, z + 25], "Snow", 3.5));
  }
  parts.push(boxAt([34, 800, 5], [0, 0, 282], "RopeTan"));
  for (let i = 0; i < 6; i++) {
    const y = -340 + i * 136;
    parts.push(cylinderBetween([-14, y, 10], [-110, y, 92], 6, 6, "Iceberg_Log", 1));
  }
  parts.push(icicles([28, -398, 80], [28, 398, 80], 63, 30, 30));
  return merge(...parts);
}

// The town gate, 10 m along Y: two stone-and-timber towers under snowy spires, joined by a roofed
// gallery over a 4.4 m opening with the town's snowflake plaque; its doors stand open inward.
function townGate(): Geo {
  const T = 140, cy = 360, parts: Geo[] = [];
  for (const s of [1, -1] as const) {
    const y = s * cy;
    parts.push(
      boxBounds([-T - 8, y - T - 8, 0], [T + 8, y + T + 8, 40], "StoneBlueDark", 3),
      boxBounds([-T, y - T, 40], [T, y + T, 230], "StoneGrey", 4),
      boxBounds([-T - 10, y - T - 10, 230], [T + 10, y + T + 10, 620], "WoodDark"),
      boxBounds([-T - 14, y - T - 14, 222], [T + 14, y + T + 14, 240], "WoodShade", 2),
      boxBounds([-T - 14, y - T - 14, 612], [T + 14, y + T + 14, 632], "WoodShade", 2),
    );
    for (const a of [1, -1]) for (const b of [1, -1]) parts.push(boxBounds([a * (T + 10) - 12, y + b * (T + 10) - 12, 230], [a * (T + 10) + 12, y + b * (T + 10) + 12, 620], "WoodShade", 2));
    for (const a of [-1, 0, 1]) parts.push(boxAt([18, 22, 26], [-T - 6, y + a * 90, 196], "WoodShade", 1.5), boxAt([22, 18, 26], [a * 90, y + s * (T + 6), 196], "WoodShade", 1.5));
    // spire roof with snow
    const rb = (T + 52) * Math.SQRT2, rh = 320;
    parts.push(rotateZ(cylinderAt({ rBot: rb, rTop: 4, height: rh, segments: 4, bottom: [0, y, 632] }, "Iceberg_Shingle"), 45, [0, y, 0]));
    parts.push(rotateZ(cylinderAt({ rBot: rb * 0.74, rTop: 2, height: rh * 0.74, segments: 4, bottom: [0, y, 632 + rh * 0.26 + 9] }, "Snow"), 45, [0, y, 0]));
    parts.push(icicles([-T - 52, y - T - 52, 632], [-T - 52, y + T + 52, 632], 70 + s, 26, 36));
    parts.push(icicles([T + 52, y - T - 52, 632], [T + 52, y + T + 52, 632], 72 + s, 26, 36));
    parts.push(cylinderAt({ radius: 3, height: 110, segments: 6, bottom: [0, y, 632 + rh - 6] }, "IronDark"));
    parts.push(boxAt([2, 46, 24], [0, y + 24, 632 + rh + 76], "FabricRed"));
    // windows, lanterns, a banner
    parts.push(facing(litWindow(28, 72, "WoodShade"), "-x", [-T - 10, y, 420]));
    parts.push(facing(litWindow(28, 72, "WoodShade"), s > 0 ? "+y" : "-y", [0, y + s * (T + 10), 420]));
    parts.push(facing(litWindow(28, 72, "WoodShade"), "+x", [T + 10, y, 420]));
    parts.push(facing(wallLantern(), "-x", [-T, y - s * 80, 170]));
    parts.push(boxAt([3, 80, 160], [-T - 13, y + s * 70, 300], "Iceberg_PaintBlue"), boxAt([3, 82, 8], [-T - 14, y + s * 70, 300], "FabricWhite"));
    parts.push(translate(snowflake(22, "FabricWhite"), [-T - 15, y + s * 70, 395]));
    parts.push(cylinderBetween([-T - 14, y + s * 70 - 46, 462], [-T - 14, y + s * 70 + 46, 462], 3, 6, "IronDark"));
    parts.push(drift([-T - 38, y, 0], 84, 330, 26));
    // knee braces under the gallery
    for (const x of [-110, 110]) parts.push(beamBetween([x, s * (cy - T), 300], [x, s * (cy - T - 80), 410], 14, 14, "WoodShade"));
  }
  // the gallery over the gate
  const gy = cy - T;
  parts.push(boxBounds([-130, -gy - 10, 395], [130, gy + 10, 452], "WoodShade", 3));
  parts.push(boxBounds([-122, -gy, 452], [-106, gy, 520], "WoodDark"), boxBounds([106, -gy, 452], [122, gy, 520], "WoodDark"));
  for (const x of [-114, 114]) for (const y of [-gy + 8, -75, 75, gy - 8]) parts.push(boxBounds([x - 8, y - 8, 452], [x + 8, y + 8, 590], "WoodShade", 1.5));
  parts.push(rotateZ(merge(
    snowRoof({ sx: 2 * gy, sy: 260, h: 130, z: 590, over: 34, gableOver: 0, th: 16, mat: "Iceberg_Shingle", snow: 0.66, seed: 77 }),
  ), 90));
  parts.push(boxAt([6, 190, 52], [-125, 0, 458], "WoodPale", 2), translate(snowflake(22), [-129, 0, 484]));
  // threshold, open doors
  parts.push(boxBounds([-150, -gy, 0], [150, gy, 3], "CobbleDark"));
  const leaf = merge(
    boxAt([10, 210, 360], [0, 105, 0], "DoorWood", 2),
    ...[40, 180, 320].map((z) => boxAt([3, 196, 10], [-6.5, 105, z], "IronDark")),
    beamBetween([-6.5, 18, 60], [-6.5, 192, 300], 3, 14, "WoodShade"),
  );
  parts.push(rotateZ(translate(leaf, [70, -gy, 0]), -76, [70, -gy, 0]));
  parts.push(rotateZ(translate(rotateZ(leaf, 180), [70, gy, 0]), 76, [70, gy, 0]));
  return merge(...parts);
}

// A round stone beacon tower by the harbour: a battered base, slit windows, a corbelled parapet
// with snow on its merlons, and a great fire burning in an iron bowl on top.
function beaconTower(): Geo {
  const R = 200, H = 820, parts: Geo[] = [];
  const ring = (rb: number, rt: number, h: number, z: number, mat: string, seg = 12) => rotateZ(cylinderAt({ rBot: rb, rTop: rt, height: h, segments: seg, bottom: [0, 0, z] }, mat), 15);
  parts.push(ring(248, 214, 130, 0, "StoneBlueDark"), ring(R, R, H - 130, 130, "StoneGrey"), ring(R + 8, R + 8, 16, 470, "StoneBlueDark"));
  for (let k = 0; k < 12; k++) {
    const t = k * 30 + 15;
    parts.push(rotateZ(boxAt([36, 28, 54], [R + 12, 0, H - 54], "StoneBlueDark", 2), t));
    parts.push(rotateZ(boxAt([30, 48, 54], [R + 16, 0, H + 56], "StoneGrey", 3), t));
    parts.push(rotateZ(box([30, 48, 10], [R + 16, 0, H + 114], "Snow", 4), t));
    parts.push(rotateZ(boxAt([26, 72, 30], [R + 16, 0, H + 26], "StoneGrey"), t + 15));
  }
  parts.push(ring(R + 32, R + 32, 26, H, "StoneGrey"), ring(R + 4, R + 4, 4, H + 26, "Snow"));
  for (let k = 0; k < 24; k++) {
    const t = (k * 15 + 7) * RAD, L = 14 + ((k * 37) % 11) * 4;
    parts.push(cylinderAt({ rBot: 0.6, rTop: 4.5, height: L, segments: 5, bottom: [Math.cos(t) * (R + 28), Math.sin(t) * (R + 28), H - L + 1] }, "IceBlue"));
  }
  // the beacon
  parts.push(
    cylinderAt({ radius: 70, height: 50, segments: 8, bottom: [0, 0, H + 26] }, "StoneBlueDark"),
    cylinderAt({ rBot: 45, rTop: 95, height: 45, segments: 10, bottom: [0, 0, H + 76] }, "IronDark"),
    translate(torus(95, 5, 10, 4, "IronDark"), [0, 0, H + 121]),
    cylinderAt({ radius: 88, height: 4, segments: 10, bottom: [0, 0, H + 120] }, "FireGlow"),
    cylinderAt({ rBot: 46, rTop: 0, height: 150, segments: 7, bottom: [0, 0, H + 122] }, "FireGlow"),
    cylinderAt({ rBot: 30, rTop: 0, height: 110, segments: 6, bottom: [0, 0, H + 122] }, "LanternGlow"),
  );
  for (let k = 0; k < 5; k++) {
    const t = k * 72 * RAD;
    parts.push(cylinderAt({ rBot: 26, rTop: 0, height: 70 + (k % 2) * 30, segments: 6, bottom: [Math.cos(t) * 48, Math.sin(t) * 48, H + 122] }, k % 2 ? "LanternGlow" : "FireGlow"));
  }
  // door, windows, steps, drift
  const ap = R * Math.cos(15 * RAD);
  parts.push(facing(archDoor(96, 150), "-x", [-ap - 4, 0, 30]));
  parts.push(boxBounds([-ap - 90, -80, 0], [-ap - 40, 80, 15], "StoneGrey", 3), boxBounds([-ap - 60, -80, 15], [-ap - 30, 80, 30], "StoneGrey", 3));
  for (const [ang, z] of [[0, 560], [90, 330], [90, 650], [180, 450], [270, 260], [270, 600]] as const) parts.push(rotateZ(facing(litWindow(22, 62, "StoneBlueDark"), "-x", [-ap + 4, 0, z]), -ang));
  parts.push(scale(torus(R + 52, 30, 14, 6, "Snow"), [1, 1, 0.5]));
  return merge(...parts);
}

// ---- harbour ----

// A segment of snowy pier 4 m long (tiles end to end along X, heading out to -X), 3 m wide: grey
// plank deck at z = 40 on log posts that go down into the water, snow along its edges.
function snowPier(): Geo {
  const rnd = seeded(71), parts: Geo[] = [];
  for (let i = 0; i < 13; i++) parts.push(boxAt([27, 300 - rnd() * 6, 7], [-200 + 15.4 + i * 30.77 + (rnd() - 0.5) * 2, (rnd() - 0.5) * 4, 33], "WoodGrey", 1.2));
  for (const y of [-125, 0, 125]) parts.push(boxBounds([-200, y - 8, 11], [200, y + 8, 33], "WoodDark"));
  for (const x of [-185, 15]) {
    parts.push(boxBounds([x - 11, -170, 9], [x + 11, 170, 33], "WoodDark", 2));
    for (const y of [-162, 162]) {
      parts.push(cylinderAt({ radius: 14, height: 300, segments: 8, bottom: [x, y, -240] }, "Iceberg_Log"));
      parts.push(scale(sphereCenter(15, [x, y, 60], "Snow", 8), [1, 1, 0.5], [x, y, 60]));
      parts.push(cylinderAt({ radius: 26, height: 6, segments: 8, bottom: [x, y, -15] }, "IceBlue"));
    }
  }
  for (const y of [-162, 162]) parts.push(beamBetween([-185, y, -160], [15, y, 0], 8, 10, "WoodDark"), beamBetween([15, y, -160], [-185, y, 0], 8, 10, "WoodDark"));
  for (const s of [1, -1]) {
    let x = -200;
    while (x < 190) {
      const len = 60 + rnd() * 110;
      const e = Math.min(200, x + len);
      if (rnd() < 0.75 && e - x > 30) parts.push(drift([(x + e) / 2, s * 130, 40], e - x, 34 + rnd() * 16, 7));
      x = e + 10 + rnd() * 40;
    }
  }
  parts.push(drift([-60, 60, 40], 80, 56, 6), drift([110, -40, 40], 46, 40, 5));
  parts.push(translate(torus(16, 4, 10, 5, "RopeTan"), [80, 95, 44]), translate(torus(12, 3.6, 10, 5, "RopeTan"), [80, 95, 50]));
  return merge(...parts);
}

// A stone quay 8 m long (tiles end to end along Y), its water face at -X dropping into the sea:
// a cobbled top, granite coping with icicles under it, an ice crust at the waterline, fenders,
// a bollard, a mooring ring and an iron ladder.
function harbourQuay(): Geo {
  const L = 400, rnd = seeded(73), parts: Geo[] = [];
  parts.push(boxBounds([-150, -L, -230], [150, L, 0], "StoneBlueDark"));
  parts.push(boxBounds([-120, -L, 0], [150, L, 8], "Iceberg_Flag"));
  for (let i = 0; i < 8; i++) parts.push(boxBounds([-162, -L + i * 100 + 1, -12], [-112, -L + (i + 1) * 100 - 1, 14], "StoneGrey", 3));
  parts.push(boxBounds([-158, -L, -150], [-148, L, -120], "StoneGrey"));
  // ice crust along the waterline
  let y = -L;
  while (y < L - 20) {
    const e = Math.min(L, y + 60 + rnd() * 120);
    parts.push(boxBounds([-158, y, -26], [-148, e, -6 + rnd() * 10], "IceBlue"));
    y = e + rnd() * 40;
  }
  parts.push(icicles([-158, -L + 6, -12], [-158, L - 6, -12], 74, 30, 36));
  // snow
  parts.push(box([60, 800, 10], [124, 0, 6], "Snow", 4));
  for (const [x, yy, w, d] of [[92, -250, 110, 120], [86, 190, 90, 80], [-80, -180, 60, 50]]) parts.push(drift([x, yy, 8], w, d, 8));
  // fittings
  for (const yy of [-300, 300]) parts.push(boxBounds([-174, yy - 12, -170], [-162, yy + 12, 12], "WoodGrey", 2));
  parts.push(
    cylinderAt({ radius: 15, height: 46, segments: 10, bottom: [-80, -150, 8] }, "IronDark"),
    cylinderAt({ radius: 19, height: 8, segments: 10, bottom: [-80, -150, 54] }, "IronDark"),
    scale(sphereCenter(17, [-80, -150, 62], "Snow", 8), [1, 1, 0.45], [-80, -150, 62]),
    translate(rotateY(torus(12, 2.6, 12, 4, "IronDark"), 90), [-165, 180, -40]),
    boxBounds([-164, 172, -30], [-162, 188, -20], "IronDark"),
  );
  for (const yy of [38, 82]) parts.push(cylinderBetween([-168, yy, -170], [-168, yy, 26], 2.5, 6, "IronDark"), beamBetween([-168, yy, 26], [-128, yy, 10], 4, 4, "IronDark"));
  for (let z = -150; z < 10; z += 30) parts.push(cylinderBetween([-168, 38, z], [-168, 82, z], 2, 5, "IronDark"));
  return merge(...parts);
}

// A clinker-built fishing boat (bow to -X), 7.5 m long: its keel at z = 0, waterline at about
// z = 40 (in the sea put it about 50 below the ground); red top strake, curled stems, a mast with
// a furled striped sail, thwarts and a fish crate under snow, oars and a lantern.
function fishingBoat(): Geo {
  const L = 340, W = 105, H = 80, n = 5, S = 14, sheer = 50, rake = 34;
  const at = (t: number, q: number): V3 => {
    const f = Math.pow(Math.sin((Math.PI / 2) * q), 0.7);
    const g = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), 2.2)), 0.55);
    return [t * (L + rake * q * q), W * g * f, H * q + sheer * t * t * Math.pow(q, 1.5)];
  };
  const parts: Geo[] = [];
  for (const s of [1, -1] as const) {
    const rows: V3[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: S + 1 }, (_, j) => {
      const p = at(-1 + (2 * j) / S, i / n);
      return [p[0], s * p[1], p[2]] as V3;
    }));
    parts.push(loft(rows.slice(0, n), "WoodDark"), loft(rows.slice(n - 1), "WoodRed"));
    for (let i = 1; i <= n; i++)
      for (let j = 0; j < S; j++) {
        const a = rows[i][j], b = rows[i][j + 1], top = i === n;
        parts.push(beamBetween([a[0], a[1] + s * 1.5, a[2] + (top ? 2 : 0)], [b[0], b[1] + s * 1.5, b[2] + (top ? 2 : 0)], top ? 9 : 3, top ? 8 : 4, top ? "WoodShade" : "WoodDark"));
      }
  }
  parts.push(beamBetween([-L, 0, -6], [L, 0, -6], 10, 12, "WoodDark"));
  // stems curling up at both ends
  for (const e of [-1, 1]) {
    const pts: V3[] = [0, 0.25, 0.5, 0.75, 1].map((q) => [e * (L + rake * q * q), 0, H * q + sheer * Math.pow(q, 1.5)]);
    const tx = e * (L + rake), tz = H + sheer;
    pts.push([tx + e * 16, 0, tz + 30], [tx + e * 8, 0, tz + 56], [tx - e * 8, 0, tz + 60], [tx - e * 14, 0, tz + 46]);
    for (let k = 0; k + 1 < pts.length; k++) parts.push(beamBetween(pts[k], pts[k + 1], 9, 12, "WoodDark"));
  }
  // snow in the bilge, thwarts with snow
  parts.push(translate(scale(sphereCenter(100, [0, 0, 0], "Snow", 10), [2.5, 0.6, 0.18]), [0, 0, 34]));
  for (const t of [-0.45, 0.05, 0.5]) {
    const p = at(t, 0.74);
    parts.push(boxAt([30, 2 * p[1] - 6, 5], [p[0], 0, p[2] - 4], "WoodShade", 1), box([26, 2 * p[1] - 22, 6], [p[0], 0, p[2] + 3], "Snow", 2.5));
  }
  // mast, yard and furled sail
  const mx = -50;
  parts.push(cylinderAt({ rBot: 9, rTop: 6, height: 440, segments: 8, bottom: [mx, 0, 0] }, "WoodShade"));
  parts.push(cylinderBetween([mx - 8, -175, 380], [mx - 8, 175, 380], 5, 6, "WoodShade"));
  for (let k = 0; k < 6; k++) {
    const y0 = -150 + k * 50, r = 15 - Math.abs(k - 2.5) * 1.6;
    parts.push(cylinderBetween([mx - 8, y0, 368], [mx - 8, y0 + 50, 368], r, 8, k % 2 ? "FabricWhite" : "FabricRed"));
  }
  parts.push(cylinderBetween([mx - 8, -130, 384], [mx - 8, 130, 384], 6, 6, "Snow"));
  const bow = at(-1, 1), stern = at(1, 1);
  parts.push(cylinderBetween([mx, 0, 432], [bow[0] + 8, 0, bow[2] + 6], 1.2, 4, "RopeTan"), cylinderBetween([mx, 0, 432], [stern[0] - 8, 0, stern[2] + 6], 1.2, 4, "RopeTan"));
  const side = at(-0.15, 1);
  for (const s of [1, -1]) parts.push(cylinderBetween([mx, 0, 420], [side[0], s * (side[1] - 2), side[2] + 4], 1.2, 4, "RopeTan"));
  // fish crate, lantern, oars, rope
  const c = at(0.3, 0.45);
  parts.push(translate(snowyCrate(50, "WoodGrey", "WoodDark", false), [c[0], 0, c[2] - 12]));
  for (let k = 0; k < 3; k++) parts.push(translate(rotateY(scale(fish(), [1.2, 1.2, 1.2]), 90), [c[0] - 4, -14 + k * 14, c[2] + 40]));
  const st = at(0.78, 0.8);
  parts.push(cylinderAt({ radius: 3, height: 80, segments: 6, bottom: [st[0], 0, st[2] - 10] }, "WoodShade"), translate(lanternBox(), [st[0], 0, st[2] + 70]));
  parts.push(beamBetween([-210, -55, 82], [150, 70, 84], 5, 5, "WoodPale"), translate(rotateZ(boxAt([60, 14, 3], [0, 0, 0], "WoodPale", 1), 19), [180, 80, 84]));
  const bw = at(-0.72, 0.6);
  parts.push(translate(torus(18, 4.5, 12, 5, "RopeTan"), [bw[0], 0, bw[2]]));
  return translate(merge(...parts), [0, 0, 12]);
}

// A small iceberg with floes around it, for the sea: put its base about 45 below the ground so
// the deep-blue ledge sits at the waterline.
function iceFloe(): Geo {
  const prism = (r0: number, r1: number, h: number, seg: number, at: V3, rot: number, mat = "Iceberg_Glacier"): Geo =>
    translate(rotateZ(cylinderAt({ rBot: r0, rTop: r1, height: h, segments: seg, bottom: [0, 0, 0] }, mat), rot), at);
  const tilt = (g: Geo, deg: number, at: V3): Geo => translate(rotateY(g, deg), at);
  return merge(
    prism(230, 214, 60, 7, [0, 0, 0], 10, "Iceberg_GlacierDeep"),
    prism(213, 207, 5, 7, [0, 0, 60], 10, "Snow"),
    prism(170, 118, 210, 6, [-10, 10, 60], 25),
    prism(124, 112, 14, 6, [-10, 10, 266], 25, "Snow"),
    tilt(prism(84, 6, 200, 5, [0, 0, 0], 0), 7, [30, -20, 250]),
    tilt(prism(62, 5, 140, 5, [0, 0, 0], 20), -12, [-70, 55, 245]),
    prism(118, 96, 140, 6, [140, 110, 50], 5),
    prism(100, 90, 12, 6, [140, 110, 188], 5, "Snow"),
    tilt(prism(26, 0, 90, 5, [0, 0, 0], 0, "IceBlue"), 30, [100, -120, 120]),
    tilt(prism(20, 0, 70, 5, [0, 0, 0], 30, "IceBlue"), -28, [-150, -60, 100]),
    prism(90, 82, 40, 6, [-310, 170, 0], 12), prism(80, 70, 6, 6, [-310, 170, 40], 12, "Snow"),
    prism(70, 64, 40, 5, [260, -250, 0], 40), prism(62, 54, 6, 5, [260, -250, 40], 40, "Snow"),
    prism(56, 50, 38, 6, [-230, -270, 0], 5), prism(48, 40, 6, 6, [-230, -270, 38], 5, "Snow"),
  );
}

// ---- plaza, decor and props ----

// A frozen fountain: an octagonal stone basin of blue ice, a column carrying a bowl whose
// overflow froze into a curtain of icicles, and a frozen jet of ice spikes on top.
function frozenFountain(): Geo {
  const rnd = seeded(81), parts: Geo[] = [];
  const oct = (r: number, h: number, z: number, mat: string, rTop = r): Geo => rotateZ(cylinderAt({ rBot: r, rTop, height: h, segments: 8, bottom: [0, 0, z] }, mat), 22.5);
  parts.push(oct(268, 14, 0, "StoneBlueDark"), oct(250, 10, 14, "StoneGrey"));
  parts.push(oct(212, 30, 24, "Iceberg_GlacierDeep"), oct(205, 6, 54, "IceBlue"));
  const R = 232, ap = R * Math.cos(Math.PI / 8), side = 2 * R * Math.sin(Math.PI / 8);
  for (let k = 0; k < 8; k++) {
    const t = k * 45;
    parts.push(rotateZ(boxAt([30, side + 12, 60], [ap - 15, 0, 24], "StoneGrey", 2), t));
    parts.push(rotateZ(boxAt([42, side + 16, 12], [ap - 14, 0, 84], "StoneWhite", 3), t));
    if (k % 3 !== 1) parts.push(rotateZ(box([32, side - 14 - rnd() * 30, 9], [ap - 16, (rnd() - 0.5) * 20, 98], "Snow", 3.5), t));
    parts.push(rotateZ(icicles([ap + 6, -side / 2 + 8, 84], [ap + 6, side / 2 - 8, 84], 90 + k, 22, 22), t));
  }
  // column and bowl
  parts.push(
    cylinderAt({ radius: 56, height: 22, segments: 8, bottom: [0, 0, 60] }, "StoneWhite"),
    cylinderAt({ rBot: 40, rTop: 30, height: 120, segments: 8, bottom: [0, 0, 82] }, "StoneGrey"),
    cylinderAt({ radius: 36, height: 12, segments: 8, bottom: [0, 0, 190] }, "StoneWhite"),
    cylinderAt({ rBot: 26, rTop: 100, height: 40, segments: 12, bottom: [0, 0, 198] }, "StoneWhite"),
    cylinderAt({ radius: 92, height: 6, segments: 12, bottom: [0, 0, 236] }, "IceBlue"),
    translate(scale(torus(97, 9, 14, 5, "Snow"), [1, 1, 0.55]), [0, 0, 240]),
  );
  for (let k = 0; k < 22; k++) {
    const t = (k * (360 / 22) + rnd() * 6) * RAD, L = 40 + rnd() * 110, r = 5 + rnd() * 5;
    parts.push(cylinderAt({ rBot: 1, rTop: r, height: L, segments: 5, bottom: [Math.cos(t) * 95, Math.sin(t) * 95, 238 - L] }, "IceBlue"));
  }
  for (let k = 0; k < 6; k++) {
    const t = (k * 60 + 20) * RAD;
    parts.push(scale(sphereCenter(26, [Math.cos(t) * 112, Math.sin(t) * 112, 58], "IceBlue", 8), [1, 1, 0.4], [Math.cos(t) * 112, Math.sin(t) * 112, 58]));
  }
  // the frozen jet
  parts.push(
    cylinderAt({ radius: 16, height: 50, segments: 8, bottom: [0, 0, 242] }, "StoneWhite"),
    cylinderAt({ rBot: 12, rTop: 44, height: 20, segments: 10, bottom: [0, 0, 292] }, "StoneWhite"),
    cylinderAt({ rBot: 18, rTop: 0, height: 140, segments: 6, bottom: [0, 0, 308] }, "IceBlue"),
    sphereCenter(13, [0, 0, 322], "CrystalBlue", 8),
  );
  for (let k = 0; k < 5; k++) parts.push(translate(rotateZ(rotateY(cylinderAt({ rBot: 11, rTop: 0, height: 70 + (k % 2) * 30, segments: 5, bottom: [0, 0, 0] }, "IceBlue"), 28), k * 72 + 10), [0, 0, 308]));
  for (let k = 0; k < 10; k++) {
    const t = k * 36 * RAD, L = 14 + rnd() * 30;
    parts.push(cylinderAt({ rBot: 0.6, rTop: 4, height: L, segments: 5, bottom: [Math.cos(t) * 42, Math.sin(t) * 42, 311 - L] }, "IceBlue"));
  }
  return merge(...parts);
}

// A bear carved from ice sitting on a stone plinth, with glinting eyes.
function iceSculpture(): Geo {
  const ice = "Iceberg_SculptIce", z = 60;
  const ell = (r: number, c: V3, s: V3, seg = 10): Geo => scale(sphereCenter(r, c, ice, seg), s, c);
  return merge(
    boxAt([150, 150, 50], [0, 0, 0], "StoneGrey", 4),
    boxAt([164, 164, 12], [0, 0, 50], "StoneWhite", 3),
    boxAt([136, 136, 6], [0, 0, 22], "StoneBlueDark"),
    box([150, 28, 8], [0, 66, 63], "Snow", 3), box([28, 110, 8], [66, -12, 63], "Snow", 3),
    ell(58, [14, 0, z + 72], [0.95, 0.92, 1.18]),
    ell(40, [22, 0, z + 34], [1.15, 1.25, 0.75]),
    ell(36, [-26, 0, z + 156], [1.05, 0.95, 0.92]),
    ell(19, [-58, 0, z + 148], [1.25, 0.9, 0.8]),
    sphereCenter(6, [-81, 0, z + 151], "Iceberg_GlacierDeep", 8),
    sphereCenter(10, [-22, 25, z + 186], ice, 8), sphereCenter(10, [-22, -25, z + 186], ice, 8),
    sphereCenter(4, [-58, 13, z + 166], "CrystalBlue", 6), sphereCenter(4, [-58, -13, z + 166], "CrystalBlue", 6),
    cylinderBetween([-24, 28, z + 100], [-50, 30, z + 12], 17, 8, ice, 14), cylinderBetween([-24, -28, z + 100], [-50, -30, z + 12], 17, 8, ice, 14),
    ell(17, [-56, 30, z + 10], [1.4, 1, 0.65], 8), ell(17, [-56, -30, z + 10], [1.4, 1, 0.65], 8),
    ell(20, [-18, 50, z + 12], [1.5, 0.8, 0.6], 8), ell(20, [-18, -50, z + 12], [1.5, 0.8, 0.6], 8),
    translate(rotateY(cylinderAt({ rBot: 10, rTop: 0, height: 44, segments: 5, bottom: [0, 0, 0] }, "IceBlue"), -18), [-62, 60, 60]),
    translate(rotateY(cylinderAt({ rBot: 8, rTop: 0, height: 32, segments: 5, bottom: [0, 0, 0] }, "IceBlue"), 22), [-50, 68, 60]),
    translate(rotateX(cylinderAt({ rBot: 9, rTop: 0, height: 38, segments: 5, bottom: [0, 0, 0] }, "IceBlue"), -20), [60, -62, 60]),
  );
}

// An igloo of snow blocks with an entrance tunnel to -X, lit ice windows and a lantern by the door.
function igloo(): Geo {
  const R = 170, bh = 32, parts: Geo[] = [sphereCenter(R - 22, [0, 0, 0], "Snow", 12)];
  for (let k = 0; k < 6; k++) {
    const phi = ((k + 0.5) * bh) / R, rho = R * Math.cos(phi), z = R * Math.sin(phi);
    const N = Math.max(6, Math.round((2 * Math.PI * rho) / 46)), len = (2 * Math.PI * rho) / N - 3;
    let lit = -1;
    for (let j = 0; j < N; j++) {
      const t = ((j + (k % 2) * 0.5) / N) * 360;
      if (k < 3 && Math.abs(t - 180) < 32) continue;
      let mat = (j + k) % 3 === 0 ? "Iceberg_SnowBlock" : "Snow";
      if (k === 1 && lit < 0 && t > 70) (lit = j), (mat = "LanternGlow");
      if (k === 1 && Math.abs(t - 290) < 360 / N / 2 + 0.1) mat = "LanternGlow";
      parts.push(rotateZ(translate(rotateY(box([28, len, bh - 3], [0, 0, 0], mat), -phi * DEG), [rho, 0, z]), t));
    }
  }
  parts.push(scale(sphereCenter(96, [0, 0, 148], "Iceberg_SnowBlock", 10), [1, 1, 0.42], [0, 0, 148]));
  // the tunnel
  const tx0 = -(R - 40), tx1 = -(R + 110);
  parts.push(cylinderBetween([tx0, 0, 0], [tx1, 0, 0], 80, 10, "Snow"));
  for (const xk of [-(R + 10), -(R + 58), -(R + 104)])
    for (let i = 0; i < 7; i++) {
      const t = (i + 0.5) * (180 / 7);
      parts.push(translate(rotateX(box([40, 34, 24], [0, 0, 0], i % 2 ? "Iceberg_SnowBlock" : "Snow"), t - 90), [xk, 82 * Math.cos(t * RAD), 82 * Math.sin(t * RAD)]));
    }
  parts.push(cylinderBetween([tx1 - 1.5, 0, 0], [tx1, 0, 0], 56, 12, "Iceberg_Dark"));
  parts.push(translate(scale(torus(R + 6, 26, 16, 6, "Snow"), [1, 1, 0.45]), [0, 0, 0]));
  parts.push(cylinderAt({ radius: 3, height: 150, segments: 6, bottom: [tx1 - 20, 100, 0] }, "WoodDark"),
    beamBetween([tx1 - 20, 100, 146], [tx1 - 44, 100, 146], 3, 3, "WoodDark"),
    translate(scale(lanternBox(), [0.8, 0.8, 0.8]), [tx1 - 42, 100, 104]));
  parts.push(translate(rotateY(boxAt([4, 14, 170], [0, 0, 0], "WoodPale", 1), -14), [tx1 - 20, -100, 0]), translate(rotateY(boxAt([4, 14, 170], [0, 0, 0], "WoodPale", 1), -10), [tx1 - 16, -120, 0]));
  return centre(merge(...parts));
}

// An iron lantern post on a stone block, its lantern hanging from a scrolled arm.
function lanternPost(): Geo {
  return merge(
    boxAt([46, 46, 28], [0, 0, 0], "StoneGrey", 3),
    box([40, 40, 8], [0, 0, 30], "Snow", 3),
    cylinderAt({ rBot: 9, rTop: 6, height: 250, segments: 8, bottom: [0, 0, 28] }, "IronDark"),
    translate(torus(8.5, 2.5, 8, 4, "IronDark"), [0, 0, 70]),
    translate(torus(6.5, 2.5, 8, 4, "IronDark"), [0, 0, 268]),
    cylinderAt({ radius: 9, height: 8, segments: 8, bottom: [0, 0, 276] }, "IronDark"),
    sphereCenter(8, [0, 0, 290], "IronDark", 8),
    sphereCenter(7, [0, 0, 296], "Snow", 8),
    ...[1, -1].map((s) => merge(
      beamBetween([0, 0, 272], [0, s * 64, 272], 5, 5, "IronDark"),
      beamBetween([0, 0, 236], [0, s * 44, 270], 4, 4, "IronDark"),
      translate(rotateZ(rotateX(torus(10, 2, 10, 4, "IronDark"), 90), 90), [0, s * 22, 254]),
      box([8, 62, 5], [0, s * 31, 277], "Snow", 2),
      cylinderBetween([0, s * 58, 256], [0, s * 58, 272], 1.2, 4, "IronDark"),
      translate(lanternBox(), [0, s * 58, 208]),
    )),
  );
}

// A sled with curled runners, loaded with snowy crates and rolled furs, its pull rope trailing.
function sled(): Geo {
  const parts: Geo[] = [];
  for (const s of [1, -1]) {
    const y = s * 46;
    parts.push(
      boxBounds([-95, y - 4, 0], [100, y + 4, 8], "WoodDark", 1),
      beamBetween([-95, y, 4], [-122, y, 22], 8, 8, "WoodDark"),
      beamBetween([-122, y, 22], [-126, y, 48], 8, 8, "WoodDark"),
      beamBetween([-126, y, 48], [-112, y, 60], 7, 7, "WoodDark"),
      boxBounds([-110, y - 4, 50], [96, y + 4, 58], "WoodShade", 1),
    );
    for (const x of [-70, 0, 70]) parts.push(boxBounds([x - 4, y - 4, 8], [x + 4, y + 4, 32], "WoodShade"));
    for (const x of [-60, 20, 90]) parts.push(boxBounds([x - 3, y - 3, 36], [x + 3, y + 3, 52], "WoodShade"));
  }
  for (let i = 0; i < 9; i++) parts.push(boxAt([18, 104, 4], [-80 + i * 20, 0, 32], "WoodShade", 1));
  parts.push(translate(snowyCrate(50), [-45, -10, 36]), translate(rotateZ(snowyCrate(38, "WoodPale"), 12), [-40, 6, 95]));
  parts.push(cylinderBetween([28, -44, 52], [28, 44, 52], 16, 8, "Iceberg_Fur"), cylinderBetween([62, -42, 52], [62, 42, 52], 15, 8, "Iceberg_FurGrey"));
  parts.push(cylinderBetween([45, -40, 76], [45, 40, 76], 14, 8, "FeltCream"));
  parts.push(boxBounds([40, -50, 34], [48, 50, 92], "RopeTan"));
  parts.push(beamBetween([-126, 0, 50], [-128, -40, 50], 2, 2, "RopeTan"), beamBetween([-126, 0, 50], [-128, 40, 50], 2, 2, "RopeTan"));
  parts.push(beamBetween([-127, 0, 50], [-175, 0, 3], 2.5, 2.5, "RopeTan"), beamBetween([-175, 0, 3], [-230, 26, 2], 2.5, 2.5, "RopeTan"));
  return centre(merge(...parts));
}

// A firewood rack: split logs stacked under a snowy lean-to roof, a chopping stump with an axe.
function woodpile(): Geo {
  const rnd = seeded(83), parts: Geo[] = [];
  parts.push(boxBounds([-48, -150, 0], [48, 150, 10], "WoodDark", 1));
  for (const y of [-145, 145]) parts.push(boxBounds([-54, y - 6, 0], [-42, y + 6, 202], "WoodDark", 1), boxBounds([42, y - 6, 0], [54, y + 6, 178], "WoodDark", 1));
  parts.push(boxBounds([40, -140, 10], [46, 140, 160], "WoodDark"));
  for (let k = 0; k < 7; k++) {
    const z = 10 + 11 + k * 19;
    for (let y = -128 + (k % 2) * 11; y <= 128; y += 22) {
      const j = (rnd() - 0.5) * 8;
      parts.push(cylinderBetween([-42 + j, y, z], [40 + j, y, z], 10.5, 6, (k + Math.round(y / 22)) % 3 ? "Iceberg_LogEnd" : "Iceberg_Firewood"));
    }
  }
  const pitch = Math.atan2(26, 100) * DEG;
  parts.push(translate(rotateY(merge(
    box([140, 320, 8], [0, 0, 0], "Iceberg_Shingle", 2),
    box([132, 312, 12], [0, 0, 9], "Snow", 5),
    cylinderBetween([-68, -158, 10], [-68, 158, 10], 7, 7, "Snow"),
  ), pitch), [0, 0, 194]));
  const fx = -72 * Math.cos(pitch * RAD), fz = 194 + 72 * Math.sin(pitch * RAD) - 4;
  parts.push(icicles([fx, -150, fz], [fx, 150, fz], 85, 24, 30));
  // chopping stump and axe, a few split logs
  parts.push(
    cylinderAt({ rBot: 30, rTop: 26, height: 46, segments: 9, bottom: [-110, 95, 0] }, "Iceberg_Log"),
    cylinderAt({ radius: 24, height: 2, segments: 9, bottom: [-110, 95, 46] }, "Iceberg_LogEnd"),
    beamBetween([-112, 98, 50], [-140, 70, 104], 4, 4, "WoodPale"),
    box([18, 4, 12], [-110, 100, 52], "IronLight"),
    cylinderBetween([-150, 20, 10], [-110, 0, 10], 10, 6, "Iceberg_LogEnd"),
    cylinderBetween([-100, -40, 10], [-130, -80, 10], 9, 6, "Iceberg_Firewood"),
    drift([72, 0, 0], 52, 330, 20),
  );
  return centre(merge(...parts));
}

// A snowman with coal eyes and buttons, a carrot nose, a red scarf, stick arms and a bucket hat.
function snowman(): Geo {
  const head = 188, mid = 128;
  return merge(
    scale(sphereCenter(80, [0, 0, 0], "Snow", 12), [1, 1, 0.22]),
    scale(sphereCenter(55, [0, 0, 50], "Snow", 12), [1, 1, 0.92], [0, 0, 50]),
    sphereCenter(40, [0, 0, mid], "Snow", 12),
    sphereCenter(29, [0, 0, head], "Snow", 12),
    sphereCenter(4.5, [-25, -10, head + 8], "Iceberg_Coal", 6), sphereCenter(4.5, [-25, 10, head + 8], "Iceberg_Coal", 6),
    ...[-12, -6, 0, 6, 12].map((y) => sphereCenter(2.8, [-24.5 + Math.abs(y) * 0.12, y, head - 12 + (y * y) / 40], "Iceberg_Coal", 5)),
    cylinderBetween([-27, 0, head], [-62, 0, head - 4], 5.5, 7, "Iceberg_Carrot", 0.6),
    ...[-18, 0, 18].map((dz) => sphereCenter(4.5, [-Math.sqrt(1600 - dz * dz) - 0.5, 0, mid + dz], "Iceberg_Coal", 6)),
    translate(scale(torus(30, 7.5, 14, 6, "FabricRed"), [1, 1, 0.8]), [0, 0, head - 26]),
    translate(rotateX(box([5, 14, 52], [0, 0, 0], "FabricRed", 1.5), 10), [-22, 22, head - 50]),
    translate(rotateY(cylinderAt({ rBot: 24, rTop: 19, height: 28, segments: 12, bottom: [0, 0, 0] }, "IronLight"), -12), [4, 0, head + 22]),
    beamBetween([0, -36, mid + 12], [-12, -92, mid + 50], 4, 4, "WoodDark"), beamBetween([-8, -74, mid + 38], [-10, -90, mid + 64], 3, 3, "WoodDark"),
    beamBetween([0, 36, mid + 12], [-6, 90, mid + 38], 4, 4, "WoodDark"), beamBetween([-4, 74, mid + 32], [-4, 96, mid + 22], 3, 3, "WoodDark"),
  );
}

// Barrels and crates by a wall, capped with snow, and a sack.
function snowyBarrels(): Geo {
  return centre(merge(
    translate(barrel(), [-50, 40, 0]),
    translate(barrel(), [24, 76, 0]),
    translate(rotateZ(snowyCrate(62), 8), [26, -40, 0]),
    translate(rotateZ(snowyCrate(40, "WoodPale"), -14), [-62, -58, 0]),
    translate(merge(
      scale(sphereCenter(26, [0, 0, 24], "FabricSand", 10), [1, 0.85, 0.92], [0, 0, 24]),
      cylinderAt({ rBot: 9, rTop: 5, height: 14, segments: 8, bottom: [0, 0, 44] }, "FabricSand"),
      translate(torus(7, 2, 8, 4, "RopeTan"), [0, 0, 50]),
    ), [-100, 0, 0]),
    drift([-20, 112, 0], 230, 74, 18),
  ));
}

// A 4 m square of packed snow with stone flags, some drifted over (tiles in both directions).
function snowPlaza(): Geo {
  const rnd = seeded(97), parts: Geo[] = [boxAt([400, 400, 2], [0, 0, 0], "Iceberg_PackedSnow")];
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const cx = -150 + i * 100 + (rnd() - 0.5) * 6, cy = -150 + j * 100 + (rnd() - 0.5) * 6;
      parts.push(boxAt([88 + rnd() * 6, 88 + rnd() * 6, 5], [cx, cy, 0], rnd() < 0.5 ? "Iceberg_SlatePale" : "Iceberg_Slate", 1.8));
    }
  for (const [x, y, w, d, r] of [[-120, 60, 130, 44, 15], [90, -130, 100, 40, -20], [150, 150, 60, 34, 40]])
    parts.push(translate(rotateZ(drift([0, 0, 3], w, d, 6), r), [x, y, 0]));
  return merge(...parts);
}

// A small log cabin of one room, its gable to the front: dark round logs on a low stone footing,
// a plank door and a lit window with blue shutters, a window in each side and the back, a steep
// snowy roof, a stone chimney, a wall lantern and firewood stacked along one side.
function logCabin(): Geo {
  const X = 200, Y = 175, z0 = 30, r = 12, d = 24, rows = 9, top = z0 + rows * d, trim = "Iceberg_TrimWhite";
  const parts: Geo[] = [
    boxBounds([-X - 18, -Y - 18, 0], [X + 18, Y + 18, z0], "StoneBlueDark", 3),
    boxBounds([-X, -Y, z0], [X, Y, top], "WoodDark"),
    boxBounds([-X - 12, -Y - 12, top - 12], [X + 12, Y + 12, top + 4], "WoodShade", 2),
  ];
  for (let i = 0; i < rows; i++) {
    const zs = z0 + r + i * d, zg = z0 + d + i * d;
    for (const s of [1, -1]) {
      parts.push(log([-X - 22, s * Y, zs], [X + 22, s * Y, zs], r));
      parts.push(log([s * X, -Y - 22, zg], [s * X, Y + 22, zg], r));
    }
  }
  parts.push(snowRoof({ sx: 2 * X, sy: 2 * (Y + 12), h: 250, z: top + 4, over: 38, gableOver: 40, th: 18, mat: "Iceberg_Shingle", snow: 0.66, seed: 101 }));
  parts.push(gableBoards(-X - 12, Y + 12, top + 4, 246, -1), gableBoards(X + 12, Y + 12, top + 4, 246, 1));
  // the front: door, steps, a shuttered window, a gable window
  parts.push(facing(plankDoor(86, 178), "-x", [-X - 11, -64, z0]));
  parts.push(boxBounds([-X - 48, -112, 0], [-X - 18, -16, 16], "StoneGrey", 3));
  parts.push(facing(litWindow(56, 66, trim, "Iceberg_PaintBlue"), "-x", [-X - 11, 94, z0 + 84]));
  parts.push(facing(litWindow(44, 50, trim), "-x", [-X - 16, 0, top + 66]));
  // the sides and back, a lantern by the front corner
  for (const s of [1, -1]) parts.push(facing(litWindow(56, 66, trim, "Iceberg_PaintBlue"), s < 0 ? "-y" : "+y", [-30, s * (Y + 11), z0 + 84]));
  parts.push(facing(litWindow(56, 66, trim), "+x", [X + 11, 30, z0 + 84]));
  parts.push(facing(wallLantern(), "-y", [-X + 34, -Y - 11, z0 + 150]));
  parts.push(translate(chimneyStack(50, top - 20, top + 290), [X - 70, -95, 0]));
  // firewood along the -Y wall, under snow
  for (let k = 0; k < 4; k++)
    for (let j = 0; j < 6 - k; j++) {
      const x = 60 + j * 21 + k * 10.5, z = 10 + k * 18;
      parts.push(cylinderBetween([x, -Y - 54, z], [x, -Y - 14, z], 9.5, 6, (j + k) % 3 ? "Iceberg_LogEnd" : "Iceberg_Firewood"));
    }
  parts.push(drift([112, -Y - 34, 74], 92, 46, 10));
  // snow drifted against the walls
  parts.push(drift([0, Y + 40, 0], 420, 56, 24), drift([X + 40, 0, 0], 52, 380, 22), drift([-X - 34, 110, 0], 46, 120, 18));
  return centre(merge(...parts));
}

// Barge boards crossing over a gable at x = gx and running on past the ridge into plain horns
// (a gable of half-width `half` + `over` eaves rising h to `ridge`, slabs `th` thick).
function gableHorns(gx: number, half: number, over: number, ridge: number, h: number, th: number, ext: number): Geo {
  const a = Math.atan2(h, half), ca = Math.cos(a), sa = Math.sin(a);
  const slope = (half + over) / ca, off = th + 8, parts: Geo[] = [];
  for (const s of [1, -1] as const) {
    const at = (t: number): V3 => [gx + s * 4, s * (t * ca + off * sa), ridge - t * sa + off * ca];
    parts.push(beamBetween(at(slope - 8), at(-ext), 10, 30, "WoodShade"));
    parts.push(beamBetween(at(-ext + 4), [at(-ext)[0], at(-ext)[1] + s * 14, at(-ext)[2] + 22], 9, 20, "WoodShade"));
  }
  return merge(...parts);
}

// A longhouse: a long log hall with its ridge along its length (Y) and its door in the long
// front (-X) under a gabled porch on posts, rows of lit windows with red shutters, crossed horns
// on both gables, a stone chimney and the snow heaped along its walls.
function longhouse(): Geo {
  const X = 300, Y = 600, z0 = 45, r = 13, d = 26, rows = 11, top = z0 + rows * d, trim = "Iceberg_TrimWhite";
  const parts: Geo[] = [
    boxBounds([-X - 24, -Y - 24, 0], [X + 24, Y + 24, z0], "StoneBlueDark", 4),
    boxBounds([-X, -Y, z0], [X, Y, top], "WoodDark"),
    boxBounds([-X - 14, -Y - 14, top - 14], [X + 14, Y + 14, top + 4], "WoodShade", 2),
  ];
  for (let i = 0; i < rows; i++) {
    const zs = z0 + r + i * d, zg = z0 + d + i * d;
    for (const s of [1, -1]) {
      parts.push(log([s * X, -Y - 25, zs], [s * X, Y + 25, zs], r));
      parts.push(log([-X - 25, s * Y, zg], [X + 25, s * Y, zg], r));
    }
  }
  // the roof, its ridge along Y: built along X and turned
  const rise = 390, half = X + 14;
  parts.push(rotateZ(merge(
    snowRoof({ sx: 2 * Y, sy: 2 * half, h: rise, z: top + 4, over: 44, gableOver: 40, th: 20, mat: "Iceberg_Shingle", snow: 0.66, seed: 111 }),
    gableBoards(Y + 14, half, top + 4, rise - 4, 1), gableBoards(-Y - 14, half, top + 4, rise - 4, -1),
    gableHorns(Y + 50, half, 44, top + 4 + rise, rise, 20, 70), gableHorns(-Y - 50, half, 44, top + 4 + rise, rise, 20, 70),
  ), 90));
  // the porch over the door
  const cx = -X - 13 - 85, pz = z0 + 250;
  parts.push(translate(merge(
    snowRoof({ sx: 170, sy: 250, h: 104, z: 0, over: 14, gableOver: 10, th: 12, mat: "Iceberg_Shingle", snow: 0.66, snowTh: 10, seed: 113 }),
    gableBoards(-85, 125, 0, 100, -1),
  ), [cx, 0, pz]));
  for (const s of [1, -1]) {
    parts.push(cylinderAt({ radius: 13, height: pz - 4, segments: 8, bottom: [cx - 70, s * 112, 0] }, "WoodShade"));
    parts.push(boxBounds([cx - 84, s * 112 - 9, pz - 12], [-X - 13, s * 112 + 9, pz], "WoodShade", 1.5));
    parts.push(beamBetween([cx - 70, s * 112, pz - 70], [cx - 20, s * 112, pz - 8], 8, 8, "WoodShade"));
  }
  parts.push(boxBounds([cx - 90, -126, 0], [-X - 24, 126, 14], "StoneGrey", 3));
  parts.push(facing(plankDoor(116, 214), "-x", [-X - 11, 0, z0]));
  for (const s of [1, -1]) parts.push(facing(wallLantern(), "-x", [-X - 11, s * 98, z0 + 160]));
  // windows along the front and back, in the gables
  for (const y of [-450, -250, 250, 450]) parts.push(facing(litWindow(70, 84, trim, "WoodRed"), "-x", [-X - 11, y, z0 + 95]));
  for (const y of [-400, -130, 130, 400]) parts.push(facing(litWindow(70, 84, trim, "WoodRed"), "+x", [X + 11, y, z0 + 95]));
  for (const s of [1, -1]) {
    parts.push(facing(litWindow(66, 80, trim, "WoodRed"), s > 0 ? "+y" : "-y", [0, s * (Y + 11), z0 + 95]));
    parts.push(facing(litWindow(50, 60, trim), s > 0 ? "+y" : "-y", [0, s * (Y + 16), top + 110]));
  }
  parts.push(translate(chimneyStack(70, top - 20, top + 470), [80, 330, 0]));
  // drifts
  for (const s of [1, -1]) parts.push(drift([s * (X + 40), s > 0 ? 0 : 330, 0], 62, s > 0 ? 1150 : 480, 26));
  parts.push(drift([0, Y + 40, 0], 560, 54, 24), drift([0, -Y - 40, 0], 560, 54, 24), drift([-X - 36, -400, 0], 50, 300, 20));
  return centre(merge(...parts));
}

// A watchtower for the palisade: a square log blockhouse on a stone footing carrying a lookout
// of grey lap boards jettied out on corbels, lit slits on every side, under a steep pyramid roof
// of snowy shingles with icicles and a banner on its pole; a door and a lantern at the foot.
function watchTower(): Geo {
  const S = 160, z0 = 50, r = 13, d = 26, rows = 15, top = z0 + rows * d, parts: Geo[] = [];
  parts.push(boxBounds([-S - 30, -S - 30, 0], [S + 30, S + 30, z0], "StoneBlueDark", 4));
  parts.push(boxBounds([-S, -S, z0], [S, S, top], "WoodDark"));
  for (let i = 0; i < rows; i++) {
    const za = z0 + r + i * d, zb = z0 + d + i * d;
    for (const s of [1, -1]) {
      parts.push(log([-S - 22, s * S, za], [S + 22, s * S, za], r));
      parts.push(log([s * S, -S - 22, zb], [s * S, S + 22, zb], r));
    }
  }
  // the lookout on corbels
  const L = S + 45, z1 = top + 12, z2 = z1 + 175;
  parts.push(boxBounds([-L - 8, -L - 8, top - 4], [L + 8, L + 8, z1], "WoodShade", 2));
  for (const k of [-100, 0, 100])
    for (const s of [1, -1]) {
      parts.push(beamBetween([s * (S + 4), k, top - 80], [s * (L + 2), k, top - 6], 14, 14, "WoodShade"));
      parts.push(beamBetween([k, s * (S + 4), top - 80], [k, s * (L + 2), top - 6], 14, 14, "WoodShade"));
    }
  parts.push(boxBounds([-L, -L, z1], [L, L, z2], "WoodGrey"));
  for (let z = z1 + 22; z < z2 - 6; z += 22) {
    parts.push(boxBounds([-L - 2.5, -L, z], [-L, L, z + 3], "Iceberg_GreyShade"), boxBounds([L, -L, z], [L + 2.5, L, z + 3], "Iceberg_GreyShade"));
    parts.push(boxBounds([-L, -L - 2.5, z], [L, -L, z + 3], "Iceberg_GreyShade"), boxBounds([-L, L, z], [L, L + 2.5, z + 3], "Iceberg_GreyShade"));
  }
  for (const a of [1, -1]) for (const b of [1, -1]) parts.push(boxBounds([a * L - 9, b * L - 9, z1], [a * L + 9, b * L + 9, z2 + 6], "WoodDark", 1.5));
  for (const side of ["-x", "+x", "-y", "+y"] as Side[])
    for (const k of [-75, 75]) {
      const at: V3 = side === "-x" ? [-L - 2, k, z1 + 62] : side === "+x" ? [L + 2, k, z1 + 62] : side === "-y" ? [k, -L - 2, z1 + 62] : [k, L + 2, z1 + 62];
      parts.push(facing(litWindow(24, 62, "WoodShade"), side, at));
    }
  // the pyramid roof with snow, icicles round its eaves, a banner pole
  const rb = (L + 50) * Math.SQRT2, rh = 330, e = L + 50;
  parts.push(rotateZ(cylinderAt({ rBot: rb, rTop: 4, height: rh, segments: 4, bottom: [0, 0, z2] }, "Iceberg_Shingle"), 45));
  parts.push(rotateZ(cylinderAt({ rBot: rb * 0.74, rTop: 2, height: rh * 0.74, segments: 4, bottom: [0, 0, z2 + rh * 0.26 + 9] }, "Snow"), 45));
  parts.push(icicles([-e, -e, z2], [-e, e, z2], 121, 26, 36), icicles([e, -e, z2], [e, e, z2], 122, 26, 36));
  parts.push(icicles([-e, -e, z2], [e, -e, z2], 123, 26, 36), icicles([-e, e, z2], [e, e, z2], 124, 26, 36));
  parts.push(cylinderAt({ radius: 3, height: 120, segments: 6, bottom: [0, 0, z2 + rh - 6] }, "IronDark"));
  parts.push(boxAt([2, 56, 30], [0, 30, z2 + rh + 80], "Iceberg_PaintBlue"), boxAt([2.5, 56, 5], [0, 30, z2 + rh + 104], "FabricWhite"));
  // the door at the foot, steps, a lantern, drifts
  parts.push(facing(plankDoor(90, 180), "-x", [-S - 12, 0, z0]));
  parts.push(boxBounds([-S - 66, -70, 0], [-S - 30, 70, 18], "StoneGrey", 3), boxBounds([-S - 46, -70, 18], [-S - 30, 70, 34], "StoneGrey", 3));
  parts.push(facing(wallLantern(), "-x", [-S - 12, 92, z0 + 150]));
  parts.push(drift([0, S + 48, 0], 380, 60, 26), drift([S + 48, 0, 0], 60, 380, 24), drift([0, -S - 48, 0], 380, 60, 24));
  return merge(...parts);
}

// ---- the kit ----
export const KIT: Kit = {
  id: "iceberg",
  name: "ไอซ์เบิร์ก",
  region: "แดนเหนือ",
  desc: "เมืองท่าแห่งหิมะที่หนาวตลอดปี บ้านไม้ซุงและบ้านหินหลังคาชันหิมะหนา หน้าต่างอบอุ่นด้วยแสงไฟ โถงใหญ่หัวมังกร น้ำพุน้ำแข็ง และท่าเรือที่มีน้ำแข็งลอย",
  ground: "snow",
  sea: true,
  items: [
    { id: "timber_house", name: "บ้านไม้หลังคาหิมะ", make: timberHouse, tags: ["building"] },
    { id: "stone_cottage", name: "กระท่อมหิน", make: stoneCottage, tags: ["building"] },
    { id: "great_hall", name: "โถงใหญ่", make: greatHall, tags: ["building", "landmark"] },
    { id: "fisher_hut", name: "กระท่อมชาวประมง", make: fisherHut, tags: ["building", "dock"] },
    { id: "smithy", name: "โรงตีเหล็ก", make: smithy, tags: ["building", "market"] },
    { id: "fur_stall", name: "แผงขายขนสัตว์", make: furStall, tags: ["market"] },
    { id: "palisade", name: "รั้วไม้ซุง (8 ม.)", make: palisade, tags: ["wall", "defence"] },
    { id: "town_gate", name: "ประตูเมือง", make: townGate, tags: ["gate", "defence"] },
    { id: "beacon_tower", name: "หอไฟสัญญาณ", make: beaconTower, tags: ["tower", "defence", "light"] },
    { id: "snow_pier", name: "ท่าเรือหิมะ (4 ม.)", make: snowPier, tags: ["dock"] },
    { id: "harbour_quay", name: "เขื่อนท่าเรือหิน (8 ม.)", make: harbourQuay, tags: ["dock", "wall"] },
    { id: "fishing_boat", name: "เรือประมง", make: fishingBoat, tags: ["boat"] },
    { id: "ice_floe", name: "ภูเขาน้ำแข็งลอย", make: iceFloe, tags: ["decor"] },
    { id: "frozen_fountain", name: "น้ำพุน้ำแข็ง", make: frozenFountain, tags: ["decor", "landmark"] },
    { id: "ice_sculpture", name: "รูปปั้นหมีน้ำแข็ง", make: iceSculpture, tags: ["decor"] },
    { id: "igloo", name: "อิกลู", make: igloo, tags: ["building"] },
    { id: "lantern_post", name: "เสาตะเกียง", make: lanternPost, tags: ["light"] },
    { id: "sled", name: "เลื่อนบรรทุกของ", make: sled, tags: ["decor", "market"] },
    { id: "woodpile", name: "กองฟืน", make: woodpile, tags: ["decor"] },
    { id: "snowman", name: "ตุ๊กตาหิมะ", make: snowman, tags: ["decor"] },
    { id: "snowy_barrels", name: "ถังและลังคลุมหิมะ", make: snowyBarrels, tags: ["decor"] },
    { id: "snow_plaza", name: "ลานหิมะปูหิน (4 ม.)", make: snowPlaza, tags: ["ground"] },
    { id: "log_cabin", name: "กระท่อมไม้ซุงหลังเล็ก", make: logCabin, tags: ["building"] },
    { id: "longhouse", name: "บ้านยาวไม้ซุง", make: longhouse, tags: ["building"] },
    { id: "watch_tower", name: "หอสังเกตการณ์ไม้ซุง", make: watchTower, tags: ["tower", "defence"] },
  ],
  sample(put) {
    // the square: packed snow and flags, the frozen fountain in the middle, benches
    for (let x = -1400; x <= -200; x += 400) for (let y = -1000; y <= 1000; y += 400) put("snow_plaza", [x, y, 0], ((x * 7 + y * 3) / 400) % 4 * 90);
    for (const y of [1400, 1800]) for (const x of [-1000, -600]) put("snow_plaza", [x, y, 0]);
    for (const y of [-1400, -1800]) put("snow_plaza", [-600, y, 0]);
    put("frozen_fountain", [-800, 0, 0]);
    put("common:bench", [-800, 520, 0], 270);
    put("common:bench", [-800, -520, 0], 90);
    put("common:bench", [-1330, 0, 0], 0);
    // the great hall at the head of the square, ice bears guarding its steps
    put("great_hall", [1150, 0, 0]);
    put("ice_sculpture", [-190, 440, 0], 0);
    put("ice_sculpture", [-190, -440, 0], 0);
    for (const [x, y] of [[-1550, 1150], [-1550, -1150], [-150, 1150], [-150, -1150], [-150, 800], [-150, -800]]) put("lantern_post", [x, y, 0], 0);
    put("lantern_post", [-1550, 0, 0], 0);
    // houses along the north side, the palisade and the gate behind them
    put("timber_house", [-1800, 1550, 0], 90);
    put("stone_cottage", [300, 1550, 0], 90);
    put("timber_house", [1350, 1550, 0], 90);
    put("woodpile", [-1260, 1700, 0], 0);
    put("snowy_barrels", [845, 1260, 0], 30);
    put("town_gate", [-800, 2150, 0], 270);
    for (const x of [-1700, 100, 900, 1700]) put("palisade", [x, 2150, 0], 270);
    // the near side: an igloo, a snowman, a sled
    put("igloo", [-1950, -850, 0], 340);
    put("snowman", [-1900, 250, 0], 200);
    put("sled", [-1900, 750, 0], 60);
    // the market by the harbour, the smithy
    put("fur_stall", [-1400, -1500, 0], 270);
    put("fur_stall", [-950, -1500, 0], 270);
    put("sled", [-200, -1600, 0], 160);
    put("snowy_barrels", [150, -1780, 0], 0);
    put("smithy", [1350, -1250, 0], 0);
    put("woodpile", [700, -1000, 0], 90);
    put("common:sign_post", [-1250, 1250, 0], 30);
    put("snowy_barrels", [-450, -1250, 0], 200);
    put("lantern_post", [-600, -1700, 0], 0);
    // the harbour: quay, pier, boats, the beacon, a fisherman's hut and drifting ice
    for (const x of [-2000, -1200, -400, 400, 1200, 2000]) put("harbour_quay", [x, -2100, 0], 90);
    for (const y of [-2450, -2850]) put("snow_pier", [-600, y, 0], 90);
    put("fishing_boat", [-230, -2720, -52], 90);
    put("fishing_boat", [800, -2620, -52], 62);
    put("beacon_tower", [-2000, -1700, 0], 0);
    put("fisher_hut", [2050, -1700, 0], 90);
    put("snowy_barrels", [-1100, -1960, 0], 90);
    for (const x of [-1600, -800, 700, 1500]) put("lantern_post", [x, -1990, 0], 0);
    put("ice_floe", [1900, -3050, -45], 20);
    put("ice_floe", [-1750, -2850, -27], 140, 0.6);
    put("ice_floe", [450, -3350, -20], 300, 0.45);
    put("ice_floe", [-900, -3300, -16], 200, 0.35);
    // trees
    for (const [x, y, s] of [[-2300, 2500, 1.1], [-1200, 2550, 1], [-300, 2450, 1.2], [700, 2500, 0.9], [1500, 2550, 1.1], [2300, 2450, 1]]) put("flora:SnowPine", [x, y, 0], x, s);
    for (const [x, y, s] of [[-2350, 600, 1], [-2300, 1250, 0.9], [2450, 900, 1], [2400, -400, 1.1], [-2350, -300, 0.8]]) put("flora:SnowPine", [x, y, 0], y, s);
    for (const [x, y] of [[-2150, 1000], [2400, 300], [-2250, -1250], [650, 1150], [-2050, 2000]]) put("flora:SnowPineSmall", [x, y, 0], x);
    put("flora:Birch", [-1150, 1250, 0], 30, 0.9);
    put("flora:Birch", [760, 950, 0], 120, 0.85);
    put("flora:FrostOak", [2350, -1100, 0], 60, 0.9);
    put("flora:FrostOak", [600, 1950, 0], 10, 0.7);
  },
};
