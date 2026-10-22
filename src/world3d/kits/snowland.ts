// เทือกเขาหิมะ (the snowland field kit): the snowy mountains of the north between the royal
// castle and the port of Iceberg. Granite boulders under caps of snow, fallen pines with their
// root plates torn up, stumps, frosted shrubs, dry grass poking through the drifts, glowing ice
// crystals and a giant ice spire in the pass, a frozen waterfall, a rope bridge over the gorge,
// trail signs and cairns, a mountain shrine and a ruined watchtower over the foothills, a
// woodcutters' log pile and a hunter's lean-to, and on the ice fields by the North Sea an
// abandoned explorers' camp (tents, flag, cold campfire, supply sled, an ice-fishing hole) and
// their ship frozen fast in the pack ice.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front facing -X.

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, box, beamBetween,
  cylinderBetween, cylinderAt, sphereCenter, gableRoof, gableWall, rock,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial, FLOWER_CELLS } from "../textures";
import { Cards, shrub, lump, limb } from "../trees";
import type { Lobe, ShrubLook } from "../trees";
import type { Kit } from "./types";

// ---- the kit's own materials ----
defineMaterial("Snowland_Granite", { map: "crag", tint: "#a3a8b0", bump: 3 });
defineMaterial("Snowland_GraniteDark", { map: "crag", tint: "#757a84", bump: 3 });
defineMaterial("Snowland_Slate", { map: "crag", tint: "#87909c", bump: 2 });
defineMaterial("Snowland_Bark", { map: "bark", tint: "#5f4634", bump: 2.5 });
defineMaterial("Snowland_DeadWood", { map: "bark", tint: "#857a6e", bump: 2 });
defineMaterial("Snowland_LogEnd", { map: "adobe", tint: "#d2ab7a", bump: 0.8 });
defineMaterial("Snowland_Char", { map: "bark", tint: "#2f2825", bump: 2, rough: 1 });
defineMaterial("Snowland_Ash", { map: "felt", tint: "#625d59", rough: 1 });
defineMaterial("Snowland_Earth", { map: "adobe", tint: "#5e4a3a", bump: 1.5 });
defineMaterial("Snowland_DryGrass", { map: "thatch", tint: "#c9ad68", rough: 1 });
defineMaterial("Snowland_DryGrassDark", { map: "thatch", tint: "#93804c", rough: 1 });
defineMaterial("Snowland_FrostLeaf", { map: "felt", tint: "#6f9087", rough: 0.95 });
// the frosted shrub: blue-green leaf sprays round a leafy core, snow lying on top
defineMaterial("Snowland_FrostCore", { map: "foliage", tint: "#5d8076", rough: 0.95, bump: 1.5 });
defineMaterial("Snowland_FrostCardDark", { card: "leaves", tint: "#5f857a", rough: 0.85 });
defineMaterial("Snowland_FrostCard", { card: "leaves", tint: "#86aa9e", rough: 0.8 });
defineMaterial("Snowland_FrostCardLight", { card: "leaves", tint: "#bcd6cf", rough: 0.75 });
defineMaterial("Snowland_SnowCard", { card: "leaves", tint: "#f6f9ff", rough: 0.8 });
defineMaterial("Snowland_Frost", { map: "snow", tint: "#e1ebf6", rough: 0.85 });
defineMaterial("Snowland_Ice", { map: "ice", tint: "#cfeaf6", rough: 0.12, opacity: 0.9 });
defineMaterial("Snowland_IceDeep", { map: "ice", tint: "#8ec8e4", rough: 0.15 });
defineMaterial("Snowland_Crystal", { map: "ice", tint: "#bdeeff", rough: 0.08, glow: "#49c2ff", glowI: 0.55, opacity: 0.9 });
defineMaterial("Snowland_CrystalCore", { tint: "#e8fbff", rough: 0.1, glow: "#7fdcff", glowI: 1.2 });
defineMaterial("Snowland_Canvas", { map: "fabric", tint: "#ddd2b6", rough: 0.95 });
defineMaterial("Snowland_CanvasDark", { map: "fabric", tint: "#9e8d6c", rough: 0.95 });
defineMaterial("Snowland_Hide", { map: "felt", tint: "#8a6544", rough: 1 });
defineMaterial("Snowland_Fur", { map: "felt", tint: "#d8d1c4", rough: 1 });
defineMaterial("Snowland_Hull", { map: "wood", tint: "#5d5047", bump: 1.4 });
defineMaterial("Snowland_HullPale", { map: "wood", tint: "#8f8172", bump: 1.2 });
defineMaterial("Snowland_PaintRed", { map: "plaster", tint: "#8e2f27", rough: 0.8 });
defineMaterial("Snowland_Dark", { tint: "#1d1b1e", rough: 1 });
defineMaterial("Snowland_DarkWater", { tint: "#15303f", rough: 0.05 });
defineMaterial("Snowland_Fish", { map: "metal", tint: "#a9b9c2", rough: 0.4, metal: 0.3 });
// for the fields: the frozen lake's surface and an ice-blue cliff
defineMaterial("Snowland_LakeIce", { map: "ice", tint: "#b9def0", rough: 0.2 });
defineMaterial("Snowland_PondWater", { tint: "#3a6a80", rough: 0.06, opacity: 0.93 });
defineMaterial("Snowland_RiverWater", { tint: "#2c5d74", rough: 0.05, opacity: 0.95 });
defineMaterial("Snowland_SeaCold", { tint: "#2a5a72", rough: 0.07, opacity: 0.94 });
defineMaterial("Snowland_GlacierCliff", { map: "crag", tint: "#b4c9d8", bump: 3 });

const DEG = 180 / Math.PI;

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// ---- shared pieces ----

// Snow lying on the upward faces of a shape: a copy of every face that looks up more than
// `minUp`, lifted a little off it (the faceted look of the rocks it lies on).
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
      // each corner moves out along the mean of its snowy faces, so the snow has no cracks
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

// A rock with snow lying on its upper faces (`cover`: how much of it, 0..1).
function snowRock(size: V3, rough: number, seed: number, o: { mat?: string; flat?: boolean; cover?: number; at?: V3; turn?: number } = {}): Geo {
  const body = rock(size, rough, seed, o.mat ?? "Snowland_Granite", o.flat ?? false);
  const cover = o.cover ?? 0.4;
  let g = cover > 0 ? merge(body, snowFacets(body, 0.95 - cover)) : body;
  if (o.turn) g = rotateZ(g, o.turn);
  return o.at ? translate(g, o.at) : g;
}

// A soft low mound of snow lx by ly, h high, lying at `at`: a lumpy dome, smooth-shaded.
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

// Centre a Geo on its footprint (x, y), leaving z alone.
function centre(g: Geo): Geo {
  const b = new THREE.Box3();
  for (const p of g) {
    p.geo.computeBoundingBox();
    b.union(p.geo.boundingBox!);
  }
  return translate(g, [-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0]);
}

// A flattened ball (snow clumps, foliage).
const blob = (r: number, at: V3, mat: string, sz = 0.45, segs = 9): Geo => translate(scale(sphereCenter(r, [0, 0, 0], mat, segs), [1, 1, sz]), at);

// A triangle seen from both sides.
function tri(a: V3, b: V3, c: V3, mat: string): Geo {
  const geo = new THREE.BufferGeometry();
  const pts = [a, b, c, a, c, b];
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts.flat(), 3));
  geo.computeVertexNormals();
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(pts.flatMap((p) => [(p[0] + p[1]) / 100, p[2] / 100]), 2));
  return [{ geo, mat }];
}

// A surface through rows of points, seen from both sides (a hull's planking, a deck).
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

// A rope sagging from a to b (sag cm at its middle), as n straight pieces.
function sagLine(a: V3, b: V3, sag: number, n: number): V3[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - sag * 4 * t * (1 - t)] as V3;
  });
}
function rope(pts: V3[], r: number, mat = "RopeTan"): Geo {
  return merge(...pts.slice(1).map((p, i) => cylinderBetween(pts[i], p, r, 4, mat)));
}

// A round log from a to b with pale sawn ends.
function log(a: V3, b: V3, r: number, segs = 9): Geo {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize().multiplyScalar(1.5);
  return merge(
    cylinderBetween(a, b, r, segs, "Snowland_Bark"),
    cylinderBetween(b, [b[0] + d.x, b[1] + d.y, b[2] + d.z], r - 2.5, segs, "Snowland_LogEnd"),
    cylinderBetween([a[0] - d.x, a[1] - d.y, a[2] - d.z], a, r - 2.5, segs, "Snowland_LogEnd"),
  );
}

// A six-sided ice crystal h tall, r across, leaning `tilt` degrees toward heading `dir`.
function crystal(h: number, r: number, at: V3, tilt: number, dir: number, mat = "Snowland_Crystal"): Geo {
  const g = merge(
    cylinderAt({ radius: r, height: h * 0.74 + 20, segments: 6, bottom: [0, 0, -20] }, mat),
    cylinderAt({ rBot: r, rTop: r * 0.06, height: h * 0.26, segments: 6, bottom: [0, 0, h * 0.74] }, mat),
  );
  return translate(rotateZ(rotateY(g, tilt), dir), at);
}

// Icicles hanging under the line a-b.
function icicles(a: V3, b: V3, seed: number, step = 24, maxLen = 50, mat = "Snowland_Ice"): Geo {
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

// A small wooden crate with a dark frame, snow on its lid.
function crate(s: number, at: V3, turn = 0, snow = true): Geo {
  const parts: Geo[] = [box([s, s, s], [0, 0, s / 2], "WoodWarm", 2)];
  for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) parts.push(box([7, 7, s + 1], [(x * (s - 6)) / 2, (y * (s - 6)) / 2, s / 2], "WoodDark", 1));
  parts.push(box([s + 1, 6, 6], [0, 0, s * 0.5], "WoodDark"), box([6, s + 1, 6], [0, 0, s * 0.5], "WoodDark"));
  if (snow) parts.push(blob(s * 0.48, [2, -2, s], "Snow", 0.22, 8));
  return translate(rotateZ(merge(...parts), turn), at);
}

// A barrel of staves with iron hoops.
function barrel(at: V3, h = 80, r = 28): Geo {
  return translate(merge(
    cylinderAt({ rBot: r * 0.88, rTop: r, height: h / 2, segments: 12, bottom: [0, 0, 0] }, "WoodShade"),
    cylinderAt({ rBot: r, rTop: r * 0.88, height: h / 2, segments: 12, bottom: [0, 0, h / 2] }, "WoodShade"),
    cylinderAt({ radius: r * 0.95, height: 5, segments: 12, bottom: [0, 0, h * 0.12] }, "IronDark"),
    cylinderAt({ radius: r * 0.95, height: 5, segments: 12, bottom: [0, 0, h * 0.82] }, "IronDark"),
    cylinderAt({ radius: r * 0.82, height: 4, segments: 12, bottom: [0, 0, h - 2] }, "Snow"),
  ), at);
}

// ---- natural pieces ----

function snowBoulder(): Geo {
  return merge(
    snowRock([270, 230, 200], 0.42, 3),
    snowRock([110, 95, 72], 0.5, 8, { at: [-105, 125, 0], turn: 30, cover: 0.5 }),
    snowRock([80, 70, 50], 0.5, 13, { at: [80, -135, 0], cover: 0.5, mat: "Snowland_GraniteDark" }),
    mound(200, 110, 32, 5, [-125, -40, 0], 20),
    mound(160, 100, 26, 6, [115, 85, 0], -30),
  );
}

function rockCluster(): Geo {
  return merge(
    snowRock([250, 210, 230], 0.45, 17, { at: [40, 30, 0], turn: 15 }),
    snowRock([180, 150, 150], 0.5, 19, { at: [-110, -120, 0], turn: -20 }),
    snowRock([150, 130, 115], 0.5, 23, { at: [-70, 150, 0], turn: 60, mat: "Snowland_GraniteDark" }),
    snowRock([220, 160, 70], 0.4, 29, { at: [160, -150, 0], flat: true, turn: 40, mat: "Snowland_Slate" }),
    snowRock([70, 60, 45], 0.5, 31, { at: [-200, 30, 0], cover: 0.5 }),
    snowRock([60, 55, 40], 0.5, 37, { at: [190, 150, 0], cover: 0.5 }),
    mound(260, 140, 36, 41, [-30, -20, 0], 70),
  );
}

function flatSlabs(): Geo {
  return merge(
    snowRock([340, 250, 80], 0.32, 43, { flat: true, mat: "Snowland_Slate", cover: 0.12, turn: 10 }),
    translate(rotateY(snowRock([230, 170, 62], 0.3, 47, { flat: true, mat: "Snowland_Slate", cover: 0.1 }), -9), [-70, 150, 22]),
    snowRock([150, 120, 42], 0.35, 53, { at: [135, -145, 0], flat: true, mat: "Snowland_GraniteDark", turn: -25, cover: 0.15 }),
    mound(140, 90, 18, 59, [-160, -110, 0], 15),
  );
}

function snowDrift(): Geo {
  return merge(
    mound(460, 250, 80, 61),
    mound(300, 190, 58, 67, [140, 120, 0], 25),
    mound(240, 160, 44, 71, [-170, -80, 0], -15, "Snowland_Frost"),
    mound(140, 90, 30, 72, [-40, 140, 0], 60),
  );
}

// Thin patches of snow for the grass where the snow begins (a ground piece: walked over).
function snowPatch(): Geo {
  return merge(
    mound(520, 380, 9, 73, [0, 0, -2]),
    mound(300, 250, 8, 79, [230, 170, -2], 30),
    mound(260, 190, 7, 83, [-240, -160, -2], -20, "Snowland_Frost"),
    mound(160, 120, 7, 84, [180, -190, -2], 50),
  );
}

// A pine blown down: its root plate torn up at one end, the trunk snapped at the other, snow
// along its top and drifted against it. It lies along Y (across the view).
function fallenLog(): Geo {
  const r = 30, z = 27, x0 = -250, x1 = 250, rnd = seeded(7);
  const parts: Geo[] = [cylinderBetween([x0, 0, z], [x1, 0, z + 3], r, 10, "Snowland_Bark")];
  // the snapped end: splinters
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rnd() * 0.4, rr = r * (0.3 + rnd() * 0.55);
    const s: V3 = [x1 - 10, Math.cos(a) * rr, z + 3 + Math.sin(a) * rr];
    parts.push(cylinderBetween(s, [x1 + 18 + rnd() * 50, s[1] * 1.15, s[2] + (rnd() - 0.4) * 12], 7 + rnd() * 4, 4, "Snowland_DeadWood", 0.5));
  }
  parts.push(cylinderBetween([x1 - 2, 0, z + 3], [x1 + 4, 0, z + 3], r - 4, 10, "Snowland_LogEnd"));
  // the root plate: a disc of earth standing on edge, roots reaching out of it
  parts.push(translate(rotateY(cylinderAt({ radius: 88, height: 26, segments: 11, bottom: [0, 0, -13] }, "Snowland_Earth"), 90), [x0 - 16, 0, z + 28]));
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + rnd() * 0.3;
    const e: V3 = [x0 - 36 - rnd() * 30, Math.cos(a) * (100 + rnd() * 30), z + 30 + Math.sin(a) * (95 + rnd() * 25)];
    parts.push(limb([[x0 - 20, Math.cos(a) * 40, z + 28 + Math.sin(a) * 40], [(x0 - 20 + e[0]) / 2 - 6, (Math.cos(a) * 40 + e[1]) / 2, (z + 28 + Math.sin(a) * 40 + e[2]) / 2 - 8], e], 8, 2.5, "Snowland_Bark", { seg: 5, maxRings: 3 }));
  }
  parts.push(blob(62, [x0 - 22, 0, z + 112], "Snow", 0.3), blob(40, [x0 - 30, -50, z + 95], "Snow", 0.3));
  // branch stubs
  parts.push(
    limb([[-80, 10, z + 20], [-98, 28, z + 52], [-110, 50, z + 78]], 7, 2.5, "Snowland_Bark", { seg: 5, maxRings: 3 }),
    limb([[60, -15, z + 18], [80, -36, z + 42], [92, -62, z + 62]], 6, 2, "Snowland_Bark", { seg: 5, maxRings: 3 }),
    limb([[150, 20, z - 8], [172, 48, z - 10], [195, 75, 2]], 6, 2, "Snowland_Bark", { seg: 5, maxRings: 3 }),
    limb([[-170, -15, z + 22], [-182, -26, z + 46], [-190, -40, z + 66]], 5, 1.5, "Snowland_DeadWood", { seg: 5, maxRings: 3 }),
  );
  // snow along the top and drifted against its side
  parts.push(translate(scale(cylinderBetween([x0 + 25, 0, 0], [x1 - 25, 0, 3], 24, 8, "Snow"), [1, 1, 0.42]), [0, 0, z + r - 5]));
  parts.push(mound(330, 90, 32, 89, [-10, 48, 0]), mound(180, 70, 20, 90, [60, -42, 0]));
  return rotateZ(merge(...parts), 90);
}

function snowyStump(): Geo {
  const parts: Geo[] = [
    cylinderAt({ rBot: 44, rTop: 37, height: 66, segments: 10, bottom: [0, 0, 0] }, "Snowland_Bark"),
    cylinderAt({ radius: 35, height: 3, segments: 10, bottom: [0, 0, 64] }, "Snowland_LogEnd"),
    cylinderAt({ rBot: 32, rTop: 27, height: 8, segments: 10, bottom: [4, -4, 66] }, "Snow"),
    blob(25, [4, -4, 74], "Snow", 0.4),
    mound(170, 130, 22, 97, [12, 22, 0], 40),
  ];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    parts.push(limb([[Math.cos(a) * 26, Math.sin(a) * 26, 28], [Math.cos(a) * 52, Math.sin(a) * 52, 8], [Math.cos(a + 0.1) * 80, Math.sin(a + 0.1) * 80, -4]], 13, 5, "Snowland_Bark", { seg: 6, maxRings: 4, gnarl: 0.5 }));
  }
  // a woodcutter's axe left in it
  parts.push(translate(merge(
    cylinderBetween([0, 0, 0], [-52, 4, 58], 3.5, 6, "WoodWarm"),
    box([24, 4, 15], [4, 0, -2], "IronLight", 1),
  ), [-14, 8, 68]));
  return merge(...parts);
}

// A frosted shrub on a drift: blue-green lobes of leaves on bare stems, each under a soft cap of
// snow with white sprays where it thins out over the leaves, bare twigs poking out, a few red
// berries left by the birds.
const FROST: ShrubLook = { core: "Snowland_FrostCore", dark: "Snowland_FrostCardDark", mid: "Snowland_FrostCard", light: "Snowland_FrostCardLight" };
function frostShrub(): Geo {
  const rnd = seeded(101), r2 = seeded(107), parts: Geo[] = [mound(160, 140, 20, 104)];
  const lobes: Lobe[] = [], cards = new Cards(), up = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + rnd() * 0.5, d = 25 + rnd() * 42, h = 55 + rnd() * 55;
    const tip: V3 = [Math.cos(a) * d, Math.sin(a) * d, h];
    parts.push(cylinderBetween([Math.cos(a) * 5, Math.sin(a) * 5, 0], tip, 3.5, 5, "Snowland_DeadWood", 1.5));
    const r = 26 + rnd() * 14;
    lobes.push([tip[0], tip[1], tip[2], r, r * 0.95, r * 0.72]);
    // the snow cap, and white sprays round its edge
    parts.push(lump([tip[0] + 2, tip[1] - 2, tip[2] + r * 0.44], [r * 0.7, r * 0.66, r * 0.24], 300 + i, "Snow", 1, 0.22));
    for (let k = 0; k < 5; k++) {
      const b = r2() * Math.PI * 2, e = 0.5 + r2() * 0.35;
      const dir = new THREE.Vector3(Math.cos(b) * Math.cos(e), Math.sin(b) * Math.cos(e), Math.sin(e));
      cards.facing("Snowland_SnowCard", [tip[0] + dir.x * r * 0.92, tip[1] + dir.y * r * 0.9, tip[2] + dir.z * r * 0.7], dir.clone().add(up), r2() * 6.28, 18 + r2() * 8, 18 + r2() * 8, up);
    }
    // bare twigs poking out
    const out: V3 = [Math.cos(a + 0.3) * (d + 45), Math.sin(a + 0.3) * (d + 45), h + 20 + rnd() * 25];
    parts.push(cylinderBetween(tip, out, 1.8, 4, "Snowland_DeadWood", 0.6));
  }
  parts.push(shrub({ seed: 103, lobes, leaf: 21, look: FROST, ragged: 0.45, core: 0.8, cards, flowers: { cells: [FLOWER_CELLS.berries], n: 6, size: 11, up: 0.3 } }));
  return merge(...parts, cards.geo());
}

function dryGrass(): Geo {
  const rnd = seeded(113), parts: Geo[] = [];
  const tufts: [number, number, number][] = [[0, 0, 1], [-50, 58, 0.8], [55, -42, 0.75], [-35, -62, 0.6], [62, 55, 0.65], [-70, -5, 0.55]];
  for (const [cx, cy, k] of tufts)
    for (let i = 0; i < 15; i++) {
      const a = rnd() * Math.PI * 2, lean = 8 + rnd() * 30, h = (45 + rnd() * 45) * k;
      const blade = cylinderAt({ rBot: 2.6, rTop: 0.3, height: h, segments: 3, bottom: [0, 0, 0] }, rnd() < 0.6 ? "Snowland_DryGrass" : "Snowland_DryGrassDark");
      parts.push(translate(rotateZ(rotateY(blade, lean), a * DEG), [cx + Math.cos(a) * 7 * rnd(), cy + Math.sin(a) * 7 * rnd(), -2]));
    }
  return merge(...parts);
}

function deadBranches(): Geo {
  const rnd = seeded(127), parts: Geo[] = [mound(230, 170, 30, 131), mound(120, 90, 18, 133, [90, -90, 0])];
  const branch = (a: V3, dir: THREE.Vector3, len: number, r: number, depth: number): void => {
    const b: V3 = [a[0] + dir.x * len, a[1] + dir.y * len, a[2] + dir.z * len];
    const m: V3 = [(a[0] + b[0]) / 2 + (rnd() - 0.5) * len * 0.15, (a[1] + b[1]) / 2 + (rnd() - 0.5) * len * 0.15, (a[2] + b[2]) / 2];
    parts.push(limb([a, m, b], r, r * 0.62, "Snowland_DeadWood", { seg: 5, maxRings: 3, gnarl: 0.5 }));
    if (depth <= 0) return;
    for (const s of [-1, 1]) {
      const axis = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5)).normalize();
      branch(b, dir.clone().applyAxisAngle(axis, s * (0.35 + rnd() * 0.35)).normalize(), len * (0.55 + rnd() * 0.2), r * 0.62, depth - 1);
    }
  };
  branch([-20, 10, 0], new THREE.Vector3(0.2, 0.1, 1).normalize(), 70, 7, 2);
  branch([40, -30, 0], new THREE.Vector3(-0.3, -0.4, 1).normalize(), 55, 6, 2);
  branch([-60, -50, 0], new THREE.Vector3(-0.5, 0.2, 0.8).normalize(), 45, 5, 1);
  // twigs lying on the snow
  parts.push(
    limb([[60, 60, 8], [104, 46, 7], [150, 20, 4]], 4, 2.5, "Snowland_DeadWood", { seg: 5, maxRings: 3 }),
    limb([[110, 40, 6], [118, 60, 7], [130, 80, 6]], 2, 1, "Snowland_DeadWood", { seg: 4, maxRings: 2 }),
    limb([[-120, 40, 6], [-94, 80, 9], [-60, 110, 10]], 3.5, 2, "Snowland_DeadWood", { seg: 5, maxRings: 3 }),
  );
  return merge(...parts);
}

function iceCrystals(): Geo {
  return merge(
    rock([170, 150, 50], 0.4, 137, "Snowland_IceDeep", true),
    crystal(230, 30, [0, 0, 10], 4, 0),
    crystal(165, 22, [30, 35, 5], 24, 40),
    crystal(140, 20, [-30, 30, 5], 28, 140),
    crystal(120, 18, [-25, -35, 5], 30, 220),
    crystal(95, 15, [35, -30, 5], 34, 310),
    crystal(70, 12, [70, 5, 0], 48, 0),
    crystal(60, 11, [-65, -5, 0], 50, 180),
    crystal(40, 9, [-85, 60, 0], 40, 130),
    crystal(35, 8, [80, -75, 0], 42, 300),
    mound(230, 200, 26, 139, [0, 0, 0], 20),
  );
}

// The giant ice crystal of the pass: a rock knoll split by a spire of glowing ice twice a man's
// height and more, with a cold light at its heart, lesser crystals round it.
function iceSpire(): Geo {
  return merge(
    snowRock([560, 500, 170], 0.4, 149, { mat: "Snowland_GraniteDark", cover: 0.35 }),
    snowRock([220, 190, 110], 0.5, 151, { at: [-260, 170, 0], cover: 0.45 }),
    snowRock([180, 160, 90], 0.5, 157, { at: [240, -210, 0], cover: 0.45, mat: "Snowland_Slate" }),
    crystal(700, 30, [0, 0, 140], 3, 20, "Snowland_CrystalCore"),
    crystal(820, 72, [0, 0, 120], 3, 20),
    crystal(470, 48, [60, 70, 120], 16, 50),
    crystal(420, 44, [-70, 50, 120], 18, 150),
    crystal(360, 40, [-50, -70, 110], 20, 230),
    crystal(300, 36, [80, -60, 110], 22, 320),
    crystal(200, 26, [150, 60, 80], 36, 20),
    crystal(170, 22, [-150, -40, 80], 38, 200),
    crystal(120, 16, [-230, -150, 0], 30, 210),
    crystal(90, 13, [-200, -190, 0], 40, 250),
    crystal(110, 15, [260, 120, 0], 28, 30),
    crystal(70, 11, [200, 200, 0], 42, 80),
    crystal(80, 12, [-60, 270, 0], 35, 100),
    mound(300, 160, 30, 158, [-200, -60, 0], 30),
    mound(260, 150, 26, 159, [180, 140, 0], -40),
  );
}

// A waterfall frozen solid down a rock wall: columns of ice from the lip bulging out to a mound at
// its foot and a frozen plunge pool in front. Its back (+X) goes against a cliff.
function frozenFalls(): Geo {
  const rnd = seeded(163), parts: Geo[] = [
    box([200, 640, 650], [110, 0, 325], "Snowland_GraniteDark", 30),
    snowRock([300, 300, 720], 0.3, 167, { at: [120, 290, 0], cover: 0.18 }),
    snowRock([300, 280, 660], 0.3, 173, { at: [130, -300, 0], cover: 0.18 }),
    snowRock([280, 620, 150], 0.35, 179, { at: [110, 0, 590], cover: 0.55, flat: true }),
  ];
  const out = (z: number) => 6 - 115 * (1 - z / 660) ** 1.8; // the curtain's front at height z
  for (let y = -230; y <= 230; y += 19) {
    const top = 640 - Math.abs(y) * 0.28 - rnd() * 50, r = 13 + rnd() * 9, mid = 260 + rnd() * 80;
    const mat = rnd() < 0.3 ? "Snowland_IceDeep" : "Snowland_Ice";
    const m: V3 = [out(mid) - 4, y + (rnd() - 0.5) * 8, mid];
    parts.push(cylinderBetween([out(top) + 4, y, top], m, r * 0.6, 6, mat, r));
    parts.push(cylinderBetween(m, [out(0) - 8, y * 1.15, -5], r, 6, mat, r * 1.5));
  }
  // icicles hanging from the lip either side of the falls
  parts.push(icicles([0, -320, 600], [0, -250, 610], 165, 18, 90), icicles([0, 250, 610], [0, 320, 600], 166, 18, 90));
  // the frozen mound at the foot, the plunge pool, a rim of snow
  parts.push(rock([220, 540, 110], 0.35, 181, "Snowland_Ice", true));
  parts.push(translate(scale(cylinderAt({ radius: 100, height: 8, segments: 14, bottom: [0, 0, 0] }, "Snowland_IceDeep"), [1.5, 2.5, 1]), [-210, 0, 0]));
  parts.push(mound(130, 180, 30, 183, [-250, 260, 0], 20), mound(120, 160, 26, 184, [-260, -250, 0], -20), mound(90, 120, 20, 185, [-370, 60, 0]));
  parts.push(snowRock([90, 80, 60], 0.5, 186, { at: [-330, -150, 0], cover: 0.5 }), snowRock([70, 60, 45], 0.5, 187, { at: [-350, 170, 0], cover: 0.5 }));
  return merge(...parts);
}

// ---- set pieces ----

// A rope bridge 14.6 m across (along X): planks on two stringers, posts on stone footings at each
// end with guy ropes back to stakes, sagging handrail ropes with hangers, snow on the planks and
// icicles under them. It is walked on: the deck's top is at z = 0 at the ends.
function ropeBridge(): Geo {
  const L = 1460, W = 250, half = L / 2, rnd = seeded(191);
  const sag = (x: number) => -6 * (1 - (x / half) ** 2);
  const parts: Geo[] = [];
  for (let x = -half + 18; x <= half - 18; x += 31) {
    const w = W + (rnd() - 0.5) * 18;
    parts.push(translate(rotateZ(box([25, w, 5], [0, 0, -2.5], rnd() < 0.5 ? "WoodGrey" : "Snowland_HullPale", 1), (rnd() - 0.5) * 5), [x, (rnd() - 0.5) * 6, sag(x)]));
    if (rnd() < 0.3) parts.push(box([20, 40 + rnd() * 60, 3], [x, (rnd() - 0.5) * 150, sag(x) + 1], "Snow", 1));
  }
  for (const y of [-W / 2 + 20, W / 2 - 20]) {
    for (let i = 0; i < 10; i++) {
      const a = -half + (L * i) / 10, b = -half + (L * (i + 1)) / 10;
      parts.push(beamBetween([a, y, sag(a) - 10], [b, y, sag(b) - 10], 12, 10, "WoodDark"));
    }
    parts.push(icicles([-half + 120, y, sag(-half + 120) - 15], [half - 120, y, sag(half - 120) - 15], 193 + y, 34, 40));
  }
  let seed = 200;
  for (const sx of [-1, 1]) {
    const x = sx * (half + 15);
    for (const sy of [-1, 1]) {
      const y = sy * (W / 2 + 18);
      parts.push(cylinderAt({ rBot: 15, rTop: 12, height: 250, segments: 8, bottom: [x, y, -20] }, "Snowland_Bark"));
      parts.push(cylinderAt({ rBot: 13, rTop: 9, height: 8, segments: 8, bottom: [x, y, 230] }, "Snow"));
      parts.push(snowRock([80, 70, 42], 0.45, seed++, { at: [x, y, -10], mat: "Snowland_GraniteDark", cover: 0.45 }));
      // a guy rope from the post top back to a stake
      const sk: V3 = [x + sx * 115, y + sy * 35, 0];
      parts.push(cylinderBetween([x, y, 212], [sk[0], sk[1], 22], 2.5, 4, "RopeTan"));
      parts.push(cylinderBetween([sk[0] - sx * 8, sk[1], -10], [sk[0] + sx * 6, sk[1], 32], 5, 5, "WoodDark", 4));
      parts.push(mound(70, 50, 14, seed++, [sk[0], sk[1], 0]));
    }
    parts.push(beamBetween([x, -W / 2 - 36, 205], [x, W / 2 + 36, 205], 15, 15, "WoodDark"));
    parts.push(box([24, W + 50, 6], [x, 0, 216], "Snow", 2));
  }
  for (const sy of [-1, 1]) {
    const y = sy * (W / 2 + 18);
    const high = sagLine([-half - 15, y, 198], [half + 15, y, 198], 70, 24);
    const mid = sagLine([-half - 15, y, 105], [half + 15, y, 105], 45, 24);
    parts.push(rope(high, 3.2), rope(mid, 2.4));
    for (let i = 1; i < 24; i++) {
      const p = high[i];
      parts.push(cylinderBetween(p, [p[0], y * 0.93, sag(p[0]) + 1], 1.4, 3, "RopeTan"));
    }
  }
  return merge(...parts);
}

// A trail sign: a post with arrow boards pointing the ways, a red trail band, a lantern.
function trailSign(): Geo {
  const arrow = (len: number, z: number, turn: number, mat: string): Geo => translate(rotateZ(merge(
    box([5, len, 24], [0, len / 2 - 10, 0], mat, 1.5),
    translate(rotateX(box([5, 17, 17], [0, 0, 0], mat, 1), 45), [0, len - 10, 0]),
    box([7, len - 18, 4], [0, len / 2 - 14, 14], "Snow", 1.5),
  ), turn), [-10, 0, z]);
  return merge(
    box([15, 15, 255], [0, 0, 122], "WoodDark", 2),
    box([16, 16, 18], [0, 0, 205], "Snowland_PaintRed", 1),
    rotateZ(cylinderAt({ rBot: 13, rTop: 0, height: 14, segments: 4, bottom: [0, 0, 250] }, "Snow"), 45),
    arrow(105, 180, 0, "WoodPale"),
    arrow(95, 150, 180, "WoodWarm"),
    arrow(85, 122, 25, "WoodPale"),
    // a lantern on a bracket
    beamBetween([0, 0, 238], [-46, 0, 238], 5, 5, "IronDark"),
    cylinderBetween([-44, 0, 238], [-44, 0, 222], 0.8, 4, "IronDark"),
    box([16, 16, 20], [-44, 0, 212], "IronDark", 1),
    box([12, 18, 13], [-44, 0, 212], "LanternGlow"),
    box([18, 12, 13], [-44, 0, 212], "LanternGlow"),
    rotateZ(cylinderAt({ rBot: 12, rTop: 2, height: 8, segments: 4, bottom: [-44, 0, 222] }, "IronDark"), 45),
    snowRock([60, 52, 38], 0.5, 211, { at: [10, 25, 0], mat: "Snowland_GraniteDark" }),
    snowRock([50, 44, 30], 0.5, 212, { at: [-8, -26, 0] }),
    snowRock([40, 36, 26], 0.5, 214, { at: [24, -14, 0], mat: "Snowland_Slate" }),
    mound(130, 110, 18, 215),
  );
}

// A trail cairn: flat stones stacked, a marker stick with a red ribbon on top.
function cairn(): Geo {
  const parts: Geo[] = [];
  let z = -3;
  const stones: [number, number, number][] = [[95, 84, 36], [78, 68, 32], [64, 58, 30], [52, 46, 27], [40, 36, 24], [28, 25, 20]];
  stones.forEach(([sx, sy, sz], i) => {
    parts.push(translate(rotateZ(rock([sx, sy, sz], 0.32, 221 + i * 3, i % 2 ? "Snowland_Slate" : "Snowland_Granite", true), i * 37), [i % 2 ? 4 : -3, (i % 3) - 1, z]));
    z += sz * 0.75 * 0.86;
  });
  parts.push(blob(15, [0, 0, z + 3], "Snow", 0.45, 8));
  parts.push(cylinderBetween([2, 0, z - 8], [5, 3, z + 62], 2.5, 5, "Snowland_DeadWood", 1.5));
  parts.push(translate(rotateZ(box([2, 32, 7], [0, 16, 0], "FabricRed"), -25), [5, 3, z + 52]));
  parts.push(translate(rotateZ(box([2, 22, 6], [0, 11, 0], "FabricRed"), -45), [5, 3, z + 46]));
  parts.push(snowRock([36, 30, 22], 0.5, 241, { at: [52, 30, 0], cover: 0.5 }), snowRock([30, 26, 18], 0.5, 243, { at: [-46, -38, 0], cover: 0.5 }));
  parts.push(mound(150, 130, 16, 245));
  return merge(...parts);
}

// A mountain shrine: a little gable-fronted shrine of red posts on a stone plinth, a stele and an
// altar with a glowing crystal inside, stone lanterns either side of the steps, prayer flags
// strung from its gable to two poles.
function mountainShrine(): Geo {
  const parts: Geo[] = [
    box([500, 440, 40], [0, 0, 20], "StoneGrey", 4),
    box([400, 340, 34], [30, 0, 57], "StoneLight", 3),
    box([34, 190, 20], [-267, 0, 10], "StoneGrey", 2),
    box([30, 170, 17], [-155, 0, 48], "StoneLight", 2),
  ];
  const F = 74, x0 = -110, x1 = 150, hy = 112;
  for (const x of [x0, x1]) for (const y of [-hy, hy]) parts.push(box([18, 18, 222], [x, y, F + 111], "WoodRed", 2), box([26, 26, 12], [x, y, F + 6], "StoneDark", 2));
  // walls: the back, and low panels with a lattice above along the sides
  parts.push(box([10, 2 * hy, 210], [x1 + 4, 0, F + 105], "WoodDark", 1));
  for (const y of [-hy, hy]) {
    parts.push(box([x1 - x0, 8, 90], [(x0 + x1) / 2, y, F + 45], "WoodDark", 1));
    for (let x = x0 + 30; x < x1; x += 30) parts.push(box([5, 6, 110], [x, y, F + 145], "WoodShade"));
    parts.push(box([x1 - x0, 7, 6], [(x0 + x1) / 2, y, F + 200], "WoodShade"));
  }
  // beams and the roof, snow on it, the gables closed
  for (const y of [-hy, hy]) parts.push(box([x1 - x0 + 40, 16, 18], [(x0 + x1) / 2, y, F + 222], "WoodRed", 2));
  for (const x of [x0, x1]) parts.push(box([16, 2 * hy + 40, 18], [x, 0, F + 222], "WoodRed", 2));
  const RZ = F + 231, RH = 105, cx = (x0 + x1) / 2;
  parts.push(gableRoof([x1 - x0 + 40, 2 * hy, 14], [cx, 0, RZ], RH, 46, "RoofSlate"));
  const a = Math.atan2(RH, hy);
  parts.push(gableRoof([x1 - x0 + 30, 2 * hy, 10], [cx, 0, RZ + 14 / Math.cos(a)], RH, 34, "Snow"));
  parts.push(icicles([x0 - 40, -hy - 40, RZ - 2], [x1 + 40, -hy - 40, RZ - 2], 251, 22, 40));
  parts.push(icicles([x0 - 40, hy + 40, RZ - 2], [x1 + 40, hy + 40, RZ - 2], 252, 22, 40));
  for (const x of [x0 - 20, x1 + 20]) parts.push(gableWall(x, hy, RZ, RH, "WoodDark"));
  parts.push(translate(rotateY(cylinderAt({ radius: 24, height: 4, segments: 12, bottom: [0, 0, 0] }, "GoldTrim"), -90), [x0 - 24, 0, RZ + 42]));
  // inside: the stele, the altar, the crystal and offerings
  parts.push(box([34, 70, 130], [x1 - 30, 0, F + 65], "Snowland_Granite", 4), cylinderBetween([x1 - 30, -35, F + 130], [x1 - 30, 35, F + 130], 17, 10, "Snowland_Granite"));
  parts.push(box([60, 130, 62], [x1 - 85, 0, F + 31], "StoneLight", 3), box([66, 136, 6], [x1 - 85, 0, F + 64], "WoodRed", 1));
  parts.push(crystal(50, 9, [x1 - 85, 0, F + 66], 0, 0, "Snowland_CrystalCore"), crystal(34, 7, [x1 - 85, 22, F + 66], 15, 90), crystal(30, 6, [x1 - 85, -20, F + 66], 15, 270));
  for (const y of [-48, 48]) parts.push(cylinderAt({ rBot: 7, rTop: 10, height: 7, segments: 10, bottom: [x1 - 90, y, F + 67] }, "GoldTrim"), cylinderAt({ radius: 2.5, height: 12, segments: 6, bottom: [x1 - 75, y * 0.6, F + 67] }, "LanternGlow"));
  // stone lanterns either side of the steps
  for (const y of [-165, 165]) {
    const X = -215, Z = 40;
    parts.push(box([42, 42, 12], [X, y, Z + 6], "StoneDark", 2), box([18, 18, 70], [X, y, Z + 47], "StoneGrey", 2), box([40, 40, 8], [X, y, Z + 86], "StoneDark", 2));
    parts.push(box([32, 32, 30], [X, y, Z + 105], "StoneLight", 2), box([36, 20, 18], [X, y, Z + 105], "LanternGlow"), box([20, 36, 18], [X, y, Z + 105], "LanternGlow"));
    parts.push(translate(rotateZ(cylinderAt({ rBot: 34, rTop: 4, height: 24, segments: 4, bottom: [0, 0, Z + 120] }, "StoneDark"), 45), [X, y, 0]));
    parts.push(blob(20, [X, y, Z + 136], "Snow", 0.4, 8));
  }
  // prayer flags from the gable to two poles
  const COLS = ["FabricBlue", "FabricWhite", "FabricRed", "FabricGreen", "FabricGold"];
  for (const sy of [-1, 1]) {
    const pole: V3 = [-300, sy * 250, 0];
    parts.push(cylinderAt({ rBot: 6, rTop: 4, height: 330, segments: 6, bottom: pole }, "WoodDark"), blob(9, [pole[0], pole[1], 332], "Snow", 0.5, 6));
    const line = sagLine([x0 - 22, 0, RZ + RH - 8], [pole[0], pole[1], 322], 40, 12);
    parts.push(rope(line, 1.2));
    for (let i = 1; i < 12; i++) {
      const p = line[i], q = line[i + 1];
      const ang = Math.atan2(q[1] - p[1], q[0] - p[0]) * DEG;
      parts.push(translate(rotateZ(box([16, 2, 22], [0, 0, -12], COLS[i % 5]), ang), p));
    }
  }
  parts.push(mound(200, 120, 30, 255, [180, 220, 0], 10), mound(220, 130, 34, 256, [200, -230, 0], -10), mound(150, 100, 22, 257, [-200, 240, 0]));
  return merge(...parts);
}

// The ruin of an old round watchtower of the kingdom's border: its back still stands tall with
// arrow slits and a tattered banner, its front has fallen into a breach full of rubble.
function watchRuin(): Geo {
  const R = 300, T = 70, N = 18, rnd = seeded(229), parts: Geo[] = [];
  const seg = ((2 * Math.PI * R) / N) * 1.05;
  const at = (g: Geo, a: number) => translate(rotateZ(g, a * DEG), [Math.cos(a) * R, Math.sin(a) * R, 0]);
  let back = 0;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, f = Math.cos(a); // 1 at the back (+X), -1 at the front
    if (f < -0.86) continue; // the breach
    let h = 240 + 460 * Math.max(0, (f + 0.25) / 1.25) ** 1.4 + (rnd() - 0.5) * 110;
    if (f < -0.45) h = 80 + rnd() * 90;
    back = Math.max(back, h);
    parts.push(at(box([T + 26, seg, 46], [0, 0, 23], "StoneDark", 3), a));
    parts.push(at(box([T, seg, h], [0, 0, h / 2], "StoneGrey", 3), a));
    if (h > 340) parts.push(at(box([T + 14, seg, 16], [0, 0, 320], "StoneDark", 2), a));
    if (h > 470 && i % 2 === 0) parts.push(at(box([T + 4, 14, 70], [0, 0, h - 150], "Snowland_Dark"), a));
    let top = h;
    if (rnd() < 0.6) {
      const bh = 25 + rnd() * 25;
      parts.push(at(box([T - 6, seg * 0.45, bh], [0, (rnd() - 0.5) * seg * 0.4, h + bh / 2], "StoneGrey", 3), a));
      parts.push(at(box([T, seg * 0.42, 8], [0, 0, h + bh + 3], "Snow", 3), a));
    }
    parts.push(at(box([T + 6, seg * 0.92, 10], [0, 0, top + 4], "Snow", 4), a));
  }
  // the banner on the tallest part at the back
  parts.push(cylinderAt({ radius: 5, height: 230, segments: 6, bottom: [R, 0, back - 40] }, "WoodDark"));
  for (let i = 0; i < 3; i++) parts.push(beamBetween([R + 4 + i * 2, i * 38, back + 150], [R + 4 + (i + 1) * 2, (i + 1) * 38, back + 150 - (i === 2 ? 6 : 0)], 2.5, 70 - i * 12, "FabricRed"));
  parts.push(beamBetween([R + 4, 0, back + 175], [R + 8, 110, back + 175], 3, 10, "GoldTrim"));
  // rubble: blocks spilled out of the breach and round the foot, a heap inside, snow over it
  for (let i = 0; i < 16; i++) {
    const a = Math.PI + (rnd() - 0.5) * (i < 9 ? 1.4 : 5), d = R + (i < 9 ? -60 + rnd() * 220 : 60 + rnd() * 150);
    const s = 34 + rnd() * 36;
    parts.push(translate(rotateZ(rotateY(box([s * 1.4, s, s * 0.8], [0, 0, s * 0.3], "StoneGrey", 3), (rnd() - 0.5) * 30), rnd() * 180), [Math.cos(a) * d, Math.sin(a) * d, 0]));
  }
  parts.push(snowRock([300, 260, 120], 0.45, 233, { at: [-40, 0, 0], mat: "StoneGrey", cover: 0.4 }));
  parts.push(translate(rotateY(rotateZ(box([T, seg * 2.2, 230], [0, 0, 0], "StoneGrey", 3), 70), 74), [-R - 170, -230, 30]));
  parts.push(cylinderAt({ radius: R - T / 2, height: 4, segments: 18, bottom: [0, 0, 0] }, "Snow"));
  parts.push(mound(260, 140, 40, 235, [R + 90, 150, 0], 70), mound(240, 130, 36, 236, [140, -R - 70, 0], 10), mound(220, 120, 32, 237, [-R - 80, 220, 0], -30));
  // a few steps of the old stair round the inside
  for (let i = 0; i < 5; i++) {
    const a = 0.3 + i * 0.22;
    parts.push(translate(rotateZ(box([60, 90, 30 + i * 32], [0, 0, (30 + i * 32) / 2], "StoneDark", 2), a * DEG), [Math.cos(a) * (R - T / 2 - 45), Math.sin(a) * (R - T / 2 - 45), 0]));
  }
  return merge(...parts);
}

// The woodcutters' log pile: sawn pine logs stacked between stakes, their ends to the front (-X),
// a chopping block with an axe and a sawhorse beside it.
function logPile(): Geo {
  const rnd = seeded(261), r = 21, L = 280, parts: Geo[] = [];
  [5, 4, 3, 2].forEach((n, k) => {
    for (let i = 0; i < n; i++) {
      const y = (i - (n - 1) / 2) * r * 2.04 + (rnd() - 0.5) * 4, z = r + k * r * 1.76, rr = r - rnd() * 3;
      parts.push(log([-L / 2 + rnd() * 12, y, z], [L / 2 - rnd() * 12, y, z], rr));
    }
  });
  for (const y of [-128, 128]) for (const x of [-90, 90]) parts.push(cylinderBetween([x, y, -10], [x, y * 1.06, 150], 6, 6, "Snowland_Bark", 5));
  parts.push(translate(scale(cylinderBetween([-L / 2 + 10, 0, 0], [L / 2 - 10, 0, 0], 40, 10, "Snow"), [1, 1, 0.3]), [0, 0, r + 3 * r * 1.76 + r - 6]));
  for (let k = 0; k < 4; k++) parts.push(translate(scale(cylinderBetween([-L / 2 + 20, 0, 0], [L / 2 - 20, 0, 0], 16, 8, "Snow"), [1, 1, 0.3]), [0, (k % 2 ? 1 : -1) * (40 + k * 18), r + (3 - k) * r * 1.4 + r]));
  // chopping block and axe, split wood
  parts.push(cylinderAt({ rBot: 30, rTop: 27, height: 50, segments: 10, bottom: [-200, 140, 0] }, "Snowland_Bark"), cylinderAt({ radius: 26, height: 2, segments: 10, bottom: [-200, 140, 49] }, "Snowland_LogEnd"));
  parts.push(translate(merge(cylinderBetween([0, 0, 0], [-10, 50, 50], 3, 6, "WoodWarm"), box([4, 22, 14], [0, -4, -2], "IronLight", 1)), [-200, 130, 52]));
  for (let i = 0; i < 4; i++) parts.push(translate(rotateZ(box([40, 12, 10], [0, 0, 5], "Snowland_LogEnd", 2), i * 50 + 10), [-250 + i * 18, 200 - i * 12, 0]));
  // sawhorse with a log on it
  for (const x of [-235, -165]) for (const s of [-1, 1]) parts.push(cylinderBetween([x, -150 + s * 35, 0], [x, -150 - s * 10, 75], 4, 5, "WoodShade"));
  parts.push(log([-275, -155, 78], [-125, -150, 78], 15));
  parts.push(mound(200, 90, 26, 263, [40, -170, 0], 0), mound(170, 80, 22, 264, [70, 170, 0], 10));
  return merge(...parts);
}

// A hunter's lean-to: a pole frame roofed with hides and pine boughs sloping back to the snow,
// a fur bedroll inside, a drying rack with a pelt and a small fire ring at its open front.
function leanTo(): Geo {
  const H = 195, back = 250, front = -90, half = 175, parts: Geo[] = [];
  for (const y of [-half, half]) {
    parts.push(cylinderBetween([front, y, -10], [front, y, H + 6], 9, 7, "Snowland_Bark", 7));
    parts.push(cylinderBetween([front, y, H - 12], [front - 12, y + 8, H + 26], 4, 5, "Snowland_Bark", 3));
  }
  parts.push(cylinderBetween([front, -half - 32, H + 2], [front, half + 32, H + 2], 8, 7, "Snowland_Bark"));
  for (const y of [-half, -60, 60, half]) parts.push(cylinderBetween([front - 18, y, H + 8], [back + 10, y, -6], 5, 6, "Snowland_Bark"));
  const slope = Math.hypot(back - front + 10, H + 10), ang = Math.atan2(H + 10, back - front + 10) * DEG;
  const slab = (th: number, off: number, mat: string, inset: number, along = 0) =>
    translate(rotateY(box([slope + 10 - inset, half * 2 + 30 - inset * 2, th], [slope / 2 + along, 0, off + th / 2], mat, 2), ang), [front - 12, 0, H + 14]);
  // pine boughs laid over the rafters, two hides over them, snow on top leaving the edges green
  parts.push(slab(6, 0, "PineNeedle", 0), slab(4, 6, "Snowland_Hide", 150, -10), slab(8, 9, "Snow", 46, 22));
  for (const y of [-150, -50, 50, 150]) parts.push(translate(rotateY(box([slope + 30, 34, 8], [slope / 2 - 10, 0, 3], "PineNeedle", 3), ang), [front - 12, y + (y > 0 ? 8 : -8), H + 12]));
  // the +Y end closed with boughs
  parts.push(tri([front, half + 2, H], [back + 8, half + 2, 0], [front, half + 2, 0], "PineNeedle"));
  // inside: a fur bedroll and a pack
  parts.push(box([170, 70, 20], [60, -50, 10], "Snowland_Fur", 8), cylinderBetween([-20, -86, 22], [-20, -14, 22], 18, 10, "Snowland_Hide"));
  parts.push(box([40, 34, 50], [60, 90, 25], "Snowland_Hide", 6), box([42, 36, 8], [60, 90, 50], "Snowland_CanvasDark", 2));
  // the fire ring at its front
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    parts.push(snowRock([26, 22, 18], 0.5, 271 + i, { at: [-230 + Math.cos(a) * 46, Math.sin(a) * 46, 0], mat: "Snowland_GraniteDark", cover: 0.3 }));
  }
  parts.push(cylinderAt({ radius: 38, height: 3, segments: 10, bottom: [-230, 0, 0] }, "Snowland_Ash"));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    parts.push(cylinderBetween([-230 + Math.cos(a) * 32, Math.sin(a) * 32, 3], [-230, 0, 26], 5, 5, "Snowland_Char", 3));
  }
  // a drying rack with a pelt
  for (const x of [-170, -40]) parts.push(cylinderBetween([x, -half - 80, -8], [x, -half - 80, 170], 5, 6, "Snowland_Bark", 4));
  parts.push(cylinderBetween([-185, -half - 80, 165], [-25, -half - 80, 165], 4, 6, "Snowland_Bark"));
  parts.push(box([80, 4, 100], [-105, -half - 80, 108], "Snowland_Hide", 2), box([60, 5, 30], [-105, -half - 80, 160], "Snowland_Fur", 2));
  parts.push(mound(260, 150, 40, 281, [back + 60, 0, 0], 90), mound(140, 90, 24, 282, [front - 30, half + 60, 0]));
  return merge(...parts);
}

// An explorer's ridge tent: canvas over a ridge pole, its door flaps tied back at the front (-X),
// guy ropes to pegs, snow on its roof and drifted against its windward side, a lantern on a stake.
function explorerTent(): Geo {
  const L = 300, H = 185, hw = 135, parts: Geo[] = [
    gableRoof([L, hw * 2, 4], [0, 0, 0], H, 0, "Snowland_Canvas"),
    gableWall(L / 2, hw, 0, H, "Snowland_CanvasDark"),
    gableWall(-L / 2 + 16, hw - 12, 0, H - 14, "Snowland_Dark"),
    tri([-L / 2, 0, H], [-L / 2, hw, 0], [-L / 2 - 40, hw * 0.42, 0], "Snowland_CanvasDark"),
    tri([-L / 2, 0, H], [-L / 2, -hw, 0], [-L / 2 - 30, -hw * 0.5, 0], "Snowland_CanvasDark"),
    gableRoof([L - 20, hw, 5], [0, 0, H / 2 + 4], H / 2, 0, "Snow"),
    cylinderBetween([-L / 2 - 14, 0, H + 2], [L / 2 + 14, 0, H + 2], 4, 6, "WoodDark"),
    cylinderAt({ radius: 4, height: H + 6, segments: 6, bottom: [-L / 2 - 4, 0, 0] }, "WoodDark"),
    cylinderAt({ radius: 4, height: H + 6, segments: 6, bottom: [L / 2 + 4, 0, 0] }, "WoodDark"),
  ];
  const peg = (p: V3): Geo => merge(box([6, 6, 22], [p[0], p[1], 6], "WoodDark", 1));
  for (const sx of [-1, 1]) {
    const p: V3 = [sx * (L / 2 + 95), 0, 0];
    parts.push(cylinderBetween([sx * (L / 2 + 10), 0, H + 2], [p[0], p[1], 14], 1.5, 3, "RopeTan"), peg(p));
    for (const sy of [-1, 1]) {
      const q: V3 = [sx * 95, sy * (hw + 75), 0];
      parts.push(cylinderBetween([sx * 95, sy * hw * 0.55, H * 0.45], [q[0], q[1], 12], 1.4, 3, "RopeTan"), peg(q));
    }
  }
  parts.push(mound(L + 60, 110, 62, 291, [10, hw + 10, 0]));
  parts.push(mound(120, 70, 18, 292, [-30, -hw - 30, 0], 10));
  // a lantern on a stake and a crate by the door
  parts.push(cylinderAt({ radius: 3, height: 120, segments: 5, bottom: [-L / 2 - 50, -hw + 10, 0] }, "WoodDark"));
  parts.push(box([14, 14, 18], [-L / 2 - 50, -hw + 10, 126], "IronDark", 1), box([10, 16, 12], [-L / 2 - 50, -hw + 10, 126], "LanternGlow"), box([16, 10, 12], [-L / 2 - 50, -hw + 10, 126], "LanternGlow"));
  parts.push(crate(46, [-L / 2 - 40, hw - 10, 0], 15));
  return merge(...parts);
}

// The expedition's flag: a tall pole on a cairn, guyed to three pegs, a tattered navy flag with a
// gold band at the hoist and a gold star, flying west (+Y).
function expeditionFlag(): Geo {
  const H = 520, parts: Geo[] = [
    cylinderAt({ rBot: 7, rTop: 5, height: H + 10, segments: 8, bottom: [0, 0, -10] }, "WoodDark"),
    sphereCenter(9, [0, 0, H + 4], "GoldTrim", 8),
  ];
  const zc = H - 70, pts: [number, number][] = [[0, 0], [7, 40], [-6, 80], [6, 118]];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const dx = bx - ax, dy = by - ay, k = 6 / Math.hypot(dx, dy);
    parts.push(beamBetween([ax - dx * k, ay - dy * k, zc - i * 2], [bx + dx * k, by + dy * k, zc - (i + 1) * 2], 2.5, 96, "FabricNavy"));
    if (i === 0) parts.push(beamBetween([ax, ay + 10, zc], [ax + dx * 0.4, ay + dy * 0.4 + 10, zc - 1], 3.2, 96, "FabricGold"));
  }
  // its frayed end: tails of different lengths
  for (let k = 0; k < 3; k++) parts.push(beamBetween([6, 114, zc - 6 + 32 - k * 32], [-2 + k * 4, 150 + (k === 1 ? 26 : 6), zc - 6 + 28 - k * 34], 2.5, 28, "FabricNavy"));
  parts.push(translate(rotateX(box([8, 20, 20], [0, 0, 0], "FabricGold"), 45), [0, 70, zc - 2]));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5, p: V3 = [Math.cos(a) * 160, Math.sin(a) * 160, 0];
    parts.push(cylinderBetween([0, 0, H * 0.62], [p[0], p[1], 12], 1.6, 3, "RopeTan"), box([7, 7, 26], [p[0], p[1], 8], "WoodDark", 1));
  }
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    parts.push(snowRock([44, 38, 34], 0.5, 301 + i, { at: [Math.cos(a) * 30, Math.sin(a) * 30, 0], mat: i % 2 ? "Snowland_Slate" : "Snowland_Granite", cover: 0.45 }));
  }
  parts.push(snowRock([40, 34, 28], 0.5, 309, { at: [0, 0, 28], cover: 0.5 }), mound(150, 120, 18, 311));
  return merge(...parts);
}

// A campfire gone cold: a ring of stones round the ash and charred logs, a tripod with a kettle,
// a log to sit on, snow drifting over half of it.
function coldCampfire(): Geo {
  const parts: Geo[] = [cylinderAt({ radius: 50, height: 4, segments: 12, bottom: [0, 0, 0] }, "Snowland_Ash")];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    parts.push(snowRock([30, 26, 22], 0.5, 321 + i, { at: [Math.cos(a) * 62, Math.sin(a) * 62, 0], cover: 0.35, mat: "Snowland_GraniteDark" }));
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.2;
    parts.push(cylinderBetween([Math.cos(a) * 42, Math.sin(a) * 42, 4], [Math.cos(a) * -6, Math.sin(a) * -6, 20 + (i % 2) * 9], 6, 6, "Snowland_Char", 4));
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3;
    parts.push(cylinderBetween([Math.cos(a) * 88, Math.sin(a) * 88, -5], [0, 0, 158], 3.5, 5, "Snowland_DeadWood"));
  }
  parts.push(cylinderBetween([0, 0, 156], [0, 0, 98], 0.8, 4, "IronDark"));
  parts.push(blob(19, [0, 0, 82], "IronDark", 0.8, 10), cylinderAt({ radius: 9, height: 6, segments: 8, bottom: [0, 0, 95] }, "IronDark"));
  parts.push(cylinderBetween([14, 0, 82], [30, 0, 94], 3, 5, "IronDark", 1.5), blob(9, [0, 0, 101], "Snow", 0.4, 6));
  parts.push(log([140, -85, 18], [148, 85, 18], 18), translate(scale(cylinderBetween([144, -70, 0], [148, 70, 0], 14, 8, "Snow"), [1, 1, 0.4]), [0, 0, 34]));
  parts.push(mound(130, 80, 16, 331, [-35, 72, 0], 20), mound(90, 60, 12, 332, [50, -80, 0]));
  return merge(...parts);
}

// The explorers' supply sled, left behind half buried: crates, a barrel and a roped-down tarp,
// a shovel standing in the drift and a pick leaning on it.
function supplyCache(): Geo {
  const parts: Geo[] = [];
  for (const y of [-58, 58]) {
    parts.push(beamBetween([-150, y, 5], [135, y, 5], 6, 8, "WoodDark"), beamBetween([-150, y, 5], [-182, y, 26], 6, 8, "WoodDark"), beamBetween([-182, y, 26], [-176, y, 52], 6, 8, "WoodDark"));
    for (const x of [-120, -40, 40, 115]) parts.push(beamBetween([x, y, 7], [x, y, 32], 5, 5, "WoodShade"));
    parts.push(beamBetween([-170, y, 52], [-120, y, 34], 4, 4, "WoodShade"));
  }
  parts.push(box([270, 128, 5], [-10, 0, 34], "WoodGrey", 1));
  parts.push(crate(62, [-90, -25, 36], 5), crate(52, [-85, 38, 36], -8), crate(42, [-88, 30, 88], 20));
  parts.push(barrel([0, -30, 36], 76, 26));
  // the tarp over the back of the load, roped down, snow on it
  parts.push(box([110, 136, 60], [75, 0, 66], "Snowland_CanvasDark", 14), blob(56, [75, 0, 96], "Snow", 0.3));
  for (const x of [50, 100]) parts.push(beamBetween([x, -70, 50], [x, -68, 97], 2, 2, "RopeTan"), beamBetween([x, -68, 97], [x, 68, 97], 2, 2, "RopeTan"), beamBetween([x, 68, 97], [x, 70, 50], 2, 2, "RopeTan"));
  // drifted against its south side
  parts.push(mound(340, 120, 48, 341, [10, -95, 0]), mound(180, 90, 26, 342, [-40, 100, 0]));
  // a shovel in the snow, a pick leaning on the sled
  parts.push(cylinderBetween([60, 120, 0], [66, 118, 120], 3, 6, "WoodWarm"), box([22, 4, 30], [59, 120, -4], "IronLight", 1), box([16, 4, 4], [66, 118, 122], "WoodWarm"));
  parts.push(cylinderBetween([150, 40, 0], [130, 30, 92], 3, 6, "WoodWarm"), translate(rotateY(box([60, 5, 6], [0, 0, 0], "IronDark", 1), 15), [130, 30, 92]));
  return merge(...parts);
}

// The explorers' ship, frozen fast in the pack ice and listing: a broken stern, a snapped
// mainmast lying across the deck, the foremast standing with rags of sail on its yard, icicles
// along its rails, snow on its deck, ice heaved up against its sides. Bow to the front (-X).
function frozenWreck(): Geo {
  const L = 1400, B = 460, N = 16, M = 10, rnd = seeded(351);
  const sta = (i: number) => {
    const t = i / N, x = -L / 2 + L * t;
    const b = (B / 2) * Math.sqrt(Math.max(0, 1 - ((t - 0.6) / 0.6) ** 2));
    const keel = t < 0.2 ? 170 * (1 - t / 0.2) ** 1.6 : 0;
    const gun = 300 + 120 * (1 - t) ** 5 + 60 * t ** 4;
    return { x, b, keel, gun };
  };
  const rows: V3[][] = [], deck: V3[][] = [];
  const last = N - 2;
  for (let i = 0; i <= last; i++) {
    const s = sta(i), row: V3[] = [];
    for (let j = 0; j <= M; j++) {
      const phi = -Math.PI / 2 + (Math.PI * j) / M;
      row.push([s.x, s.b * Math.sin(phi), s.gun - (s.gun - s.keel) * Math.cos(phi) ** 0.55]);
    }
    rows.push(row);
    deck.push([[s.x, s.b * 0.96, s.gun - 30], [s.x, -s.b * 0.96, s.gun - 30]]);
  }
  const ship: Geo[] = [loft(rows, "Snowland_Hull"), loft(deck.slice(1), "Snowland_HullPale")];
  // rails, a faded red wale, icicles under the rails
  for (const j of [0, M]) {
    for (let i = 0; i < last; i++) {
      const a = rows[i][j], b = rows[i + 1][j];
      ship.push(beamBetween([a[0], a[1], a[2] + 6], [b[0], b[1], b[2] + 6], 12, 14, "WoodDark"));
      const wa = rows[i][j === 0 ? 2 : M - 2], wb = rows[i + 1][j === 0 ? 2 : M - 2];
      const k = j === 0 ? -1 : 1;
      ship.push(beamBetween([wa[0], wa[1] + k * 4, wa[2]], [wb[0], wb[1] + k * 4, wb[2]], 8, 22, "Snowland_PaintRed"));
      ship.push(icicles([a[0], a[1] + (j === 0 ? -5 : 5), a[2] - 2], [b[0], b[1] + (j === 0 ? -5 : 5), b[2] - 2], 360 + i + j, 26, 55));
    }
  }
  // the broken stern: the hold dark inside, plank ends sticking out
  const end = rows[last], es = sta(last);
  const hub: V3 = [es.x, 0, (es.gun + es.keel) / 2];
  for (let j = 0; j < M; j++) ship.push(tri(end[j], end[j + 1], hub, "Snowland_Dark"));
  for (let j = 1; j < M; j += 1) {
    if (rnd() < 0.35) continue;
    const p = end[j], len = 40 + rnd() * 110;
    ship.push(beamBetween([p[0] - 30, p[1] * 0.98, p[2]], [p[0] + len, p[1] * (1.02 + rnd() * 0.08), p[2] + (rnd() - 0.5) * 30], 6, 20, "Snowland_Hull"));
  }
  // bowsprit and masts
  const bow = sta(0);
  ship.push(cylinderBetween([-L / 2 + 60, 0, bow.gun - 30], [-L / 2 - 250, 0, bow.gun + 70], 10, 7, "WoodDark", 6));
  const fx = -330, fd = sta(Math.round(((fx + L / 2) / L) * N)).gun - 30;
  ship.push(cylinderAt({ rBot: 16, rTop: 10, height: 820, segments: 8, bottom: [fx, 0, fd - 100] }, "WoodDark"));
  ship.push(cylinderBetween([fx + 6, -230, fd + 560], [fx - 6, 230, fd + 590], 7, 6, "WoodDark", 6));
  for (const [y, len] of [[-170, 170], [-60, 240], [60, 120], [170, 200]] as [number, number][]) {
    const z0 = fd + 568 + ((y + 230) / 460) * 30;
    ship.push(beamBetween([fx + 2, y - 30, z0], [fx + 2, y + 30, z0], 3, 8, "Snowland_Canvas"));
    ship.push(translate(rotateX(box([3, 52, len], [0, 0, -len / 2], "Snowland_Canvas"), (rnd() - 0.5) * 16), [fx + 4, y, z0]));
  }
  const mx = 200, md = sta(Math.round(((mx + L / 2) / L) * N)).gun - 30;
  ship.push(cylinderAt({ rBot: 18, rTop: 15, height: 520, segments: 8, bottom: [mx, 0, md - 100] }, "WoodDark"));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ship.push(cylinderBetween([mx + Math.cos(a) * 8, Math.sin(a) * 8, md + 410], [mx + Math.cos(a) * 12, Math.sin(a) * 12, md + 440 + rnd() * 50], 6, 4, "WoodDark", 0.5));
  }
  ship.push(cylinderBetween([mx + 60, 40, md + 30], [mx + 600, -330, md - 210], 14, 8, "WoodDark", 10));
  // rigging
  const ftop: V3 = [fx, 0, fd + 700];
  ship.push(rope([ftop, [-L / 2 - 240, 0, bow.gun + 72]], 1.6));
  for (const k of [0, M]) for (const dx of [-60, 0, 60]) {
    const st = sta(Math.round(((fx + dx + L / 2) / L) * N)), y = (k === 0 ? -1 : 1) * st.b;
    ship.push(rope([[fx, 0, fd + 560], [fx + dx, y, st.gun]], 1.2));
  }
  ship.push(rope(sagLine(ftop, [mx, 0, md + 420], 90, 6), 1.3));
  // a deckhouse between the masts, a hatch, snow lying on the deck
  const dh = sta(Math.round(((-60 + L / 2) / L) * N)).gun - 30;
  ship.push(box([150, 190, 140], [-60, 0, dh + 70], "Snowland_HullPale", 3));
  for (const y of [-95, 95]) for (const x of [-135, 15]) ship.push(box([12, 12, 142], [x, y, dh + 71], "WoodDark", 1));
  ship.push(box([6, 60, 110], [-137, 0, dh + 55], "DoorWood", 1), box([6, 44, 30], [-137, 60, dh + 95], "Snowland_Dark"));
  ship.push(gableRoof([170, 190, 10], [-60, 0, dh + 140], 50, 18, "Snowland_Hull"), gableRoof([160, 190, 9], [-60, 0, dh + 152], 50, 12, "Snow"));
  for (const x of [-145, 25]) ship.push(gableWall(x, 95, dh + 140, 50, "Snowland_HullPale"));
  ship.push(icicles([-150, -113, dh + 138], [30, -113, dh + 138], 345, 20, 40), icicles([-150, 113, dh + 138], [30, 113, dh + 138], 346, 20, 40));
  const hd = sta(Math.round(((-480 + L / 2) / L) * N)).gun - 30;
  ship.push(box([110, 110, 22], [-480, 0, hd + 11], "WoodDark", 2), box([96, 96, 4], [-480, 0, hd + 22], "Snowland_HullPale"), box([70, 60, 6], [-470, 10, hd + 26], "Snow", 3));
  for (const [x, y, s] of [[-570, 30, 0.6], [-380, 60, 0.8], [-300, -80, 0.9], [130, 70, 1], [260, -60, 0.9], [420, 40, 1.1], [520, -50, 0.7], [-200, 110, 0.6]] as [number, number, number][]) {
    const st = sta(Math.round(((x + L / 2) / L) * N));
    ship.push(mound(200 * s, 120 * s, 16 * s, Math.round(370 + x), [x, y, st.gun - 34], rnd() * 60));
  }
  // listing to starboard, bow raised, sunk deep in the ice
  const listed = translate(rotateY(rotateX(merge(...ship), 11), -3), [0, 0, -120]);
  const ice: Geo[] = [
    // the snow bank it is frozen into, plates of bare blue ice round it, drifts banked up its sides
    mound(1650, 760, 50, 382, [40, 0, 0], 3),
    mound(700, 420, 22, 383, [-760, -280, 0], 20, "Snowland_IceDeep"),
    mound(620, 380, 20, 384, [700, 300, 0], -15, "Snowland_IceDeep"),
    mound(420, 300, 18, 385, [-300, 420, 0], 5, "Snowland_IceDeep"),
  ];
  for (let i = 0; i < 7; i++) {
    const x = -560 + i * 180;
    const st = sta(Math.min(last, Math.max(0, Math.round(((x + L / 2) / L) * N))));
    for (const side of [-1, 1]) ice.push(mound(260 + rnd() * 80, 150, 100 + rnd() * 60 + (side < 0 ? 30 : 0), 386 + i * 2 + side, [x, side * (st.b * 0.9 + 30), 0], rnd() * 30));
  }
  // slabs of ice heaved up against both sides
  for (let i = 0; i < 12; i++) {
    const side = i % 2 ? 1 : -1, x = -560 + i * 100 + rnd() * 40;
    const st = sta(Math.min(last, Math.max(0, Math.round(((x + L / 2) / L) * N))));
    const s = 90 + rnd() * 90;
    ice.push(translate(rotateZ(rotateX(box([s * 1.2, 22, s], [0, 0, s / 2 - 10], rnd() < 0.5 ? "Snowland_IceDeep" : "Snowland_Ice", 4), side * (25 + rnd() * 25)), (rnd() - 0.5) * 30), [x, side * (st.b * 0.95 + 70 + rnd() * 40), 30]));
  }
  ice.push(snowRock([140, 120, 90], 0.5, 391, { at: [-820, 300, 0], mat: "Snowland_IceDeep", cover: 0.4 }), snowRock([120, 110, 70], 0.5, 392, { at: [760, -330, 0], mat: "Snowland_IceDeep", cover: 0.4 }));
  return merge(listed, ...ice);
}

// A hole cut in the lake ice for fishing: dark water, a rim of broken ice, a rod on a forked
// stick with its line down the hole, a bucket with a frozen fish, a stool.
function iceHole(): Geo {
  const rnd = seeded(401), parts: Geo[] = [cylinderAt({ radius: 44, height: 3, segments: 14, bottom: [0, 0, 0] }, "Snowland_DarkWater")];
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + rnd() * 0.2;
    parts.push(translate(rotateZ(rotateY(box([22 + rnd() * 14, 16 + rnd() * 8, 8], [0, 0, 3], "Snowland_Ice", 2), (rnd() - 0.5) * 20), a * DEG + 90), [Math.cos(a) * 54, Math.sin(a) * 54, 0]));
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.6;
    parts.push(mound(70, 40, 10, 403 + i, [Math.cos(a) * 88, Math.sin(a) * 88, 0], a * DEG + 90));
  }
  parts.push(cylinderBetween([-80, 46, -4], [-74, 46, 44], 2.5, 5, "Snowland_DeadWood"), cylinderBetween([-74, 46, 40], [-70, 56, 54], 1.8, 4, "Snowland_DeadWood"), cylinderBetween([-74, 46, 40], [-80, 36, 52], 1.8, 4, "Snowland_DeadWood"));
  parts.push(cylinderBetween([-120, 50, 6], [18, 14, 72], 1.6, 4, "WoodWarm", 1));
  parts.push(cylinderBetween([18, 14, 72], [6, 6, 1], 0.4, 3, "IronLight"));
  parts.push(cylinderAt({ rBot: 13, rTop: 16, height: 26, segments: 10, bottom: [40, -80, 0] }, "WoodGrey"), cylinderAt({ radius: 15, height: 2, segments: 10, bottom: [40, -80, 26] }, "IronDark"));
  parts.push(translate(rotateY(scale(sphereCenter(10, [0, 0, 0], "Snowland_Fish", 8), [2.4, 0.6, 1]), 60), [40, -80, 34]));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    parts.push(cylinderBetween([-60 + Math.cos(a) * 16, -70 + Math.sin(a) * 16, 0], [-60, -70, 36], 2.5, 5, "WoodShade"));
  }
  parts.push(cylinderAt({ radius: 18, height: 4, segments: 10, bottom: [-60, -70, 36] }, "WoodWarm"));
  return merge(...parts);
}

export const KIT: Kit = {
  id: "snowland",
  name: "เทือกเขาหิมะ",
  region: "แดนเหนือ ระหว่างปราสาทหลวงกับเมืองท่าไอซ์เบิร์ก",
  desc: "เนินสนหิมะ ช่องเขาน้ำแข็งกับสะพานเชือกข้ามหุบเหว ผลึกน้ำแข็งเรืองแสง ทุ่งน้ำแข็งริมทะเลเหนือ และค่ายนักสำรวจที่ถูกทิ้งร้าง",
  ground: "snow",
  sea: true,
  items: [
    { id: "snow_boulder", name: "หินใหญ่คลุมหิมะ", make: () => centre(snowBoulder()), tags: ["rock"] },
    { id: "rock_cluster", name: "กองหินหิมะ", make: () => centre(rockCluster()), tags: ["rock"] },
    { id: "flat_slabs", name: "หินแผ่นโผล่หิมะ", make: () => centre(flatSlabs()), tags: ["rock"] },
    { id: "snow_drift", name: "กองหิมะ", make: () => centre(snowDrift()), tags: ["ground", "decor"] },
    { id: "snow_patch", name: "หย่อมหิมะบนหญ้า", make: () => centre(snowPatch()), tags: ["ground"] },
    { id: "fallen_log", name: "ต้นสนล้ม", make: fallenLog, tags: ["log", "decor"] },
    { id: "snowy_stump", name: "ตอไม้คลุมหิมะ", make: () => centre(snowyStump()), tags: ["decor"] },
    { id: "frost_shrub", name: "พุ่มไม้น้ำค้างแข็ง", make: () => centre(frostShrub()), tags: ["plant"] },
    { id: "dry_grass", name: "กอหญ้าแห้ง", make: () => centre(dryGrass()), tags: ["ground", "plant"] },
    { id: "dead_branches", name: "กิ่งไม้แห้งโผล่หิมะ", make: () => centre(deadBranches()), tags: ["ground", "decor"] },
    { id: "ice_crystals", name: "กลุ่มผลึกน้ำแข็ง", make: () => centre(iceCrystals()), tags: ["magic", "decor"] },
    { id: "ice_spire", name: "เสาผลึกน้ำแข็งยักษ์", make: () => centre(iceSpire()), tags: ["landmark", "magic"] },
    { id: "frozen_falls", name: "น้ำตกน้ำแข็ง", make: frozenFalls, tags: ["landmark"] },
    { id: "rope_bridge", name: "สะพานเชือก (14.6 ม.)", make: ropeBridge, tags: ["bridge"] },
    { id: "trail_sign", name: "ป้ายบอกทาง", make: () => centre(trailSign()), tags: ["sign", "light"] },
    { id: "cairn", name: "กองหินบอกทาง", make: () => centre(cairn()), tags: ["sign"] },
    { id: "mountain_shrine", name: "ศาลเจ้าภูเขา", make: () => centre(mountainShrine()), tags: ["landmark", "magic"] },
    { id: "watch_ruin", name: "ซากหอสังเกตการณ์", make: watchRuin, tags: ["landmark", "defence"] },
    { id: "log_pile", name: "กองซุงคนตัดไม้", make: () => centre(logPile()), tags: ["decor"] },
    { id: "lean_to", name: "เพิงพักนักล่า", make: leanTo, tags: ["camp"] },
    { id: "explorer_tent", name: "เต็นท์นักสำรวจ", make: () => centre(explorerTent()), tags: ["camp"] },
    { id: "expedition_flag", name: "ธงคณะสำรวจ", make: () => centre(expeditionFlag()), tags: ["camp", "decor"] },
    { id: "cold_campfire", name: "กองไฟมอด", make: () => centre(coldCampfire()), tags: ["camp", "decor"] },
    { id: "supply_cache", name: "เลื่อนเสบียงทิ้งร้าง", make: () => centre(supplyCache()), tags: ["camp", "decor"] },
    { id: "frozen_wreck", name: "ซากเรือติดน้ำแข็ง", make: frozenWreck, tags: ["landmark", "wreck"] },
    { id: "ice_hole", name: "หลุมตกปลาน้ำแข็ง", make: () => centre(iceHole()), tags: ["ground", "camp"] },
  ],
  // A corner of the north: a pine slope with rocks and a woodcutters' corner, the giant ice
  // crystal, the shrine, the old tower, and down by the North Sea (-Y) the explorers' camp and
  // their ship frozen into the ice at the shore.
  sample(put) {
    // the shore: the wreck in the ice, drifts along the beach
    put("frozen_wreck", [-500, -2700, -30], 12);
    for (const [x, y, h] of [[-1900, -2050, 10], [600, -2100, -20], [1600, -2000, 30], [-1100, -1950, 80]]) put("snow_drift", [x, y, 0], h);
    put("rock_cluster", [1900, -2150, 0], 40);
    // the explorers' camp
    put("explorer_tent", [-1300, -900, 0], 20);
    put("explorer_tent", [-650, -1250, 0], -15);
    put("explorer_tent", [-1700, -1500, 0], 60);
    put("expedition_flag", [-1050, -1550, 0], 0);
    put("cold_campfire", [-1100, -1180, 0], 0);
    put("supply_cache", [-300, -800, 0], 200);
    put("ice_hole", [300, -1300, 0], 0);
    put("cairn", [400, -500, 0], 0);
    // the trail up from the shore
    put("trail_sign", [-200, 200, 0], 30);
    put("cairn", [-700, 700, 0], 0);
    put("cairn", [700, 900, 0], 0);
    // the giant crystal and lesser ones, the shrine
    put("ice_spire", [1300, 300, 0], 0);
    put("ice_crystals", [1900, -400, 0], 40);
    put("ice_crystals", [600, -150, 0], 160, 0.7);
    put("mountain_shrine", [1500, 1700, 0], -90);
    // the old tower on the slope and the frozen falls
    put("watch_ruin", [-1600, 1500, 0], 20);
    put("frozen_falls", [1950, -1000, 0], 0);
    // woodcutters and a hunter on the pine slope
    put("log_pile", [300, 1500, 0], 0);
    put("snowy_stump", [-50, 1250, 0], 0);
    put("snowy_stump", [650, 1100, 0], 0);
    put("lean_to", [-1900, 300, 0], 10);
    put("fallen_log", [-1000, 300, 0], 20);
    put("rope_bridge", [2000, 900, 0], 90, 0.6);
    // rocks, shrubs, grass and branches scattered
    put("snow_boulder", [-200, -300, 0], 30);
    put("flat_slabs", [900, -900, 0], 0);
    put("rock_cluster", [-2100, -600, 0], 0);
    put("snow_boulder", [2100, 2000, 0], 0);
    for (const [x, y] of [[-600, 0], [200, 600], [1000, 1100], [-1300, 900], [1600, -1200], [-300, -1700]]) put("frost_shrub", [x, y, 0], x);
    for (const [x, y] of [[-900, -500], [100, -900], [900, 400], [-1500, 200], [1300, -700]]) put("dry_grass", [x, y, 0], y);
    for (const [x, y] of [[-400, 1000], [1900, 1300], [-2000, 1000]]) put("dead_branches", [x, y, 0], x);
    put("snow_patch", [800, -600, 0], 0);
    put("snow_drift", [-800, 1500, 0], 30);
    // trees: pines up the slope, a few frost oaks and birches
    for (const [x, y, s] of [[-2200, 2200, 1.1], [-1000, 2300, 1], [200, 2250, 1.2], [1000, 2200, 0.9], [2200, 2300, 1.1], [-2300, 1500, 1], [2300, 1600, 1], [-500, 1700, 0.9], [900, 1800, 1], [-2300, 600, 0.9], [2300, 500, 1]])
      put("flora:SnowPine", [x, y, 0], x, s);
    for (const [x, y] of [[-1200, 1900], [400, 1900], [1700, 2250], [-1700, 2300], [100, 1000], [-2200, -200], [2250, -900]]) put("flora:SnowPineSmall", [x, y, 0], y);
    put("flora:FrostOak", [-300, 500, 0], 40, 0.8);
    put("flora:Birch", [1100, -300, 0], 0, 0.8);
    put("flora:Birch", [-1600, -300, 0], 0, 0.75);
  },
};

// ---- helpers the snowland fields share (world cm, north +X, west +Y) ----
export type XY = [number, number];

// A polyline rounded off (Chaikin's corner cutting), its ends kept.
export function smooth(pts: XY[], rounds = 2): XY[] {
  let p = pts;
  for (let k = 0; k < rounds; k++) {
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

// A band `width` across along a polyline (a track), as a polygon.
export function band(pts: XY[], width: number): XY[] {
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

// A rough round outline (a pond, a lake) of radii rx, ry about c, wobbling by `wob`.
export function blobPoly(c: XY, rx: number, ry: number, seed: number, wob = 0.12, n = 28): XY[] {
  const rnd = seeded(seed);
  const k = Array.from({ length: 4 }, () => [rnd() * Math.PI * 2, rnd() * wob, 2 + Math.floor(rnd() * 3)]);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    let r = 1;
    for (const [ph, amp, f] of k) r += amp * Math.sin(a * f + ph);
    return [c[0] + Math.cos(a) * rx * r, c[1] + Math.sin(a) * ry * r] as XY;
  });
}

// Whether a point lies inside a polygon.
export function inPoly(poly: XY[], x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// The heading that turns an item's front (-X) toward world direction (dx, dy).
export const towards = (dx: number, dy: number): number => (Math.atan2(-dy, -dx) * 180) / Math.PI;

// A mesh in the ground's own terms (Y up) for a flat sheet over a polygon at height z, its
// texture in metres: a frozen lake, ice at a pond's edge.
export function flatSheet(poly: XY[], z: number, mat: THREE.Material): THREE.Mesh {
  const shape = new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ShapeGeometry(shape);
  const P = geo.getAttribute("position"), uv = new Float32Array(P.count * 2);
  for (let i = 0; i < P.count; i++) {
    uv[i * 2] = P.getX(i) / 300;
    uv[i * 2 + 1] = P.getY(i) / 300;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  // shape (x, y) is the world's (x, y): into three.js (x, z, -y)
  geo.applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1));
  geo.translate(0, z, 0);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = true;
  return m;
}

// A plateau outline with its long edges cut into short straight pieces (the same shape): each
// piece of cliff becomes its own short solid, so the monsters' spots (which keep clear of every
// solid by half its length) are not crowded out by one long edge. Edges near the walkable box
// `near` get pieces of `step`, the far ones longer pieces.
export function densify(poly: XY[], near: (x: number, y: number) => boolean, step = 500, far = 1800): XY[] {
  const out: XY[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let close = false;
    for (let t = 0; t <= 1; t += 0.05) if (near(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) close = true;
    const n = Math.max(1, Math.ceil(L / (close ? step : far)));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}
