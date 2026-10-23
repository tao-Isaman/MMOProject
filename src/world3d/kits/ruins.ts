// ซากโบราณแดนใต้ตะวันตก (ruins): the kit of the three old lands south-east of Venezia, older
// than the kingdom. The ancient plain is a city of marble and travertine gone back to grass: a
// colossus toppled on its face (its helmeted head and its body with one arm lie apart), colonnades,
// a lone broken arch, a triumphal arch half fallen over the old road, an amphitheatre sunk in its
// bank of earth, temples on raised platforms with their stairs, wild olives. The lagoon marsh has
// cattails, drowned trees hung with moss, boardwalks of rotten planks, a ruined stilt house, a
// round shrine sinking into the mud, will-o'-wisps and banks of poison mist. The royal necropolis
// has the guardian statues of its avenue, the great mausoleum on its stepped roof, house tombs,
// sarcophagi, obelisks, a sealed tomb gate, braziers of ghost-fire, and roots of the southern
// jungle gripping the fallen stones.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front facing -X
// (the stairs are the one exception: built about their middle, to lie on a straight ramp).

import * as THREE from "three";
import { merge, translate, rotateX, rotateY, rotateZ, box, boxBounds, beamBetween, cylinderBetween, cylinderAt, sphereCenter, torus, gableRoof, gableWall, rock, toThree } from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial, material } from "../textures";
import { limb, grow, crownTree, treeObject, LeafCards, CANOPY, canopyTint } from "../trees";
import type { CanopyLook } from "../trees";
import { solid } from "./types";
import type { Kit, Put } from "./types";

// ---------- the old lands' own colours ----------
// the plain: weathered marble, travertine, gilding worn thin, lichen, the grass grown over
defineMaterial("Ruins_Marble", { map: "marble", tint: "#e4ddcd", rough: 0.6, bump: 1 });
defineMaterial("Ruins_MarbleOld", { map: "marble", tint: "#c8bea8", rough: 0.7, bump: 1.5 }); // stained by rain
defineMaterial("Ruins_MarbleCut", { map: "marble", tint: "#f4efe4", rough: 0.55 }); // a fresh break
defineMaterial("Ruins_Fluted", { map: "ribs", tint: "#ddd5c3", rough: 0.6, bump: 2 }); // fluted shafts
defineMaterial("Ruins_Travertine", { map: "sandstone", tint: "#d8caa9", bump: 2 });
defineMaterial("Ruins_TravertineMid", { map: "sandstone", tint: "#c6b693", bump: 2 });
defineMaterial("Ruins_TravertineDark", { map: "stone", tint: "#a3967b", bump: 2 });
defineMaterial("Ruins_GoldDull", { map: "metal", tint: "#a98c4a", rough: 0.5, metal: 0.6 });
defineMaterial("Ruins_Lichen", { map: "felt", tint: "#97a35e", rough: 1 });
defineMaterial("Ruins_LichenGold", { map: "felt", tint: "#c7a650", rough: 1 });
defineMaterial("Ruins_Shadow", { tint: "#1d1a17", rough: 1 });
defineMaterial("Ruins_Turf", { map: "felt", tint: "#72a844", rough: 1 });
defineMaterial("Ruins_ArenaSand", { map: "snow", tint: "#d6c49a", rough: 0.95 });
defineMaterial("Ruins_OliveBark", { map: "bark", tint: "#8b8270", bump: 3 });
defineMaterial("Ruins_OliveCore", { map: "foliage", tint: "#9ba67c", rough: 0.95, bump: 1.5 });
defineMaterial("Ruins_CliffPale", { map: "crag", tint: "#b6aa90", bump: 4 }); // the plain's cliffs
// the marsh: peat, reeds, drowned wood, slime, the wisps' light, the mist (see mistMaterial)
defineMaterial("Ruins_MarshWater", { tint: "#3d5a47", rough: 0.1, opacity: 0.92 }); // a water sheet
defineMaterial("Ruins_Peat", { map: "adobe", tint: "#4b4231", bump: 1 });
defineMaterial("Ruins_Reed", { map: "felt", tint: "#7f9446", rough: 0.9 });
defineMaterial("Ruins_ReedDry", { map: "felt", tint: "#b4a36b", rough: 0.9 });
defineMaterial("Ruins_Cattail", { map: "felt", tint: "#5b3a22", rough: 1 });
defineMaterial("Ruins_DeadBark", { map: "bark", tint: "#777162", bump: 3 });
defineMaterial("Ruins_HangMoss", { map: "felt", tint: "#8f9872", rough: 1 });
defineMaterial("Ruins_WetWood", { map: "wood", tint: "#6b604f", bump: 1.5 });
defineMaterial("Ruins_RotWood", { map: "wood", tint: "#4c4337", bump: 1.5 });
defineMaterial("Ruins_RotThatch", { map: "thatch", tint: "#7f744d", bump: 2 });
defineMaterial("Ruins_Algae", { map: "felt", tint: "#5a7a38", rough: 1 });
defineMaterial("Ruins_ShrineStone", { map: "stone", tint: "#8e9487", bump: 2 });
defineMaterial("Ruins_Wisp", { tint: "#d4fff1", rough: 1, glow: "#6dffd0", glowI: 2.4, opacity: 0.92 });
defineMaterial("Ruins_WispHalo", { tint: "#7dffcf", rough: 1, glow: "#3dffb4", glowI: 2, opacity: 0.16 });
defineMaterial("Ruins_CliffPeat", { map: "crag", tint: "#7d7a62", bump: 4 }); // the marsh's banks
// the necropolis: dark tomb stone, grey granite, ghost-fire, the violet of the seals, roots
defineMaterial("Ruins_Basalt", { map: "stone", tint: "#5f5d64", bump: 2 });
defineMaterial("Ruins_Granite", { map: "stone", tint: "#8f8b84", bump: 2 });
defineMaterial("Ruins_GraniteFluted", { map: "ribs", tint: "#8a867f", rough: 0.8, bump: 2 });
defineMaterial("Ruins_GraniteMoss", { map: "stone", tint: "#7d896f", bump: 2 });
defineMaterial("Ruins_TombWhite", { map: "marble", tint: "#cdc5b4", rough: 0.7, bump: 1 });
defineMaterial("Ruins_GhostFire", { tint: "#a6ffd6", rough: 1, glow: "#2dff9e", glowI: 2.2, opacity: 0.88 });
defineMaterial("Ruins_GhostCore", { tint: "#f0fff8", rough: 1, glow: "#b8ffe4", glowI: 2.6 });
defineMaterial("Ruins_Seal", { tint: "#9b7bff", rough: 0.4, glow: "#6a3dff", glowI: 1.6 });
defineMaterial("Ruins_Root", { map: "bark", tint: "#8b7a5e", bump: 3 });
defineMaterial("Ruins_Vine", { map: "bark", tint: "#56622f", bump: 1.5 });
defineMaterial("Ruins_CliffDark", { map: "crag", tint: "#7a776f", bump: 4 }); // the necropolis's cliffs

// ---------- helpers ----------
const RAD = Math.PI / 180;
type YZ = [number, number];

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
const bb = (min: V3, max: V3, mat: string, bevel = 0): Geo => boxBounds(min, max, mat, bevel);

// an ellipsoid of radii r about c (its poles on Z)
function ellipsoid(r: V3, c: V3, mat: string, seg = 10): Geo {
  const geo = new THREE.SphereGeometry(1, seg, Math.max(4, Math.round(seg * 0.6)));
  geo.rotateX(Math.PI / 2);
  geo.scale(r[0], r[1], r[2]);
  const R = (r[0] + r[1]) / 2, uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * Math.PI * 2 * R) / 100, (uv.getY(i) * Math.PI * r[2]) / 100);
  geo.translate(...c);
  return [{ geo, mat }];
}

// a turned shape about Z through `at`: its profile [radius, z] from the bottom up
function lathe(prof: YZ[], seg: number, mat: string, at: V3 = [0, 0, 0]): Geo {
  const geo = new THREE.LatheGeometry(prof.map(([r, z]) => new THREE.Vector2(Math.max(0.01, r), z)), seg);
  geo.rotateX(Math.PI / 2);
  let L = 0;
  for (let i = 1; i < prof.length; i++) L += Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]);
  const rMax = Math.max(...prof.map((p) => p[0])), uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * Math.PI * 2 * rMax) / 100, (uv.getY(i) * L) / 100);
  geo.translate(...at);
  return [{ geo, mat }];
}

// A curved block: the ring between radii r0 and r1 about Z, from angle a0 to a1 (radians, a0 <
// a1), z0 to z1, in n facets; its ends closed when `caps`, its underside when `under`.
function sector(r0: number, r1: number, z0: number, z1: number, a0: number, a1: number, n: number, mat: string, caps = true, under = false): Geo {
  const pos: number[] = [], uv: number[] = [];
  const P = (r: number, a: number, z: number): V3 => [r * Math.cos(a), r * Math.sin(a), z];
  const quad = (q: V3[], t: YZ[]) => {
    for (const k of [0, 1, 2, 0, 2, 3]) {
      pos.push(...q[k]);
      uv.push(t[k][0] / 100, t[k][1] / 100);
    }
  };
  const flat = (q: V3[]) => quad(q, q.map((p) => [p[0], p[1]] as YZ));
  for (let i = 0; i < n; i++) {
    const t0 = a0 + ((a1 - a0) * i) / n, t1 = a0 + ((a1 - a0) * (i + 1)) / n;
    flat([P(r0, t0, z1), P(r1, t0, z1), P(r1, t1, z1), P(r0, t1, z1)]);
    if (under) flat([P(r0, t1, z0), P(r1, t1, z0), P(r1, t0, z0), P(r0, t0, z0)]);
    quad([P(r1, t0, z0), P(r1, t1, z0), P(r1, t1, z1), P(r1, t0, z1)], [[r1 * t0, z0], [r1 * t1, z0], [r1 * t1, z1], [r1 * t0, z1]]);
    quad([P(r0, t1, z0), P(r0, t0, z0), P(r0, t0, z1), P(r0, t1, z1)], [[r0 * t1, z0], [r0 * t0, z0], [r0 * t0, z1], [r0 * t1, z1]]);
  }
  if (caps) {
    quad([P(r0, a0, z0), P(r1, a0, z0), P(r1, a0, z1), P(r0, a0, z1)], [[r0, z0], [r1, z0], [r1, z1], [r0, z1]]);
    quad([P(r1, a1, z0), P(r0, a1, z0), P(r0, a1, z1), P(r1, a1, z1)], [[r1, z0], [r0, z0], [r0, z1], [r1, z1]]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return [{ geo, mat }];
}

// A slab from an outline in the plane of Y and Z (points [y, z]) running from x0 to x1: arched
// walls, pediments, broken tops.
function prismYZ(pts: YZ[], x0: number, x1: number, mat: string): Geo {
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([y, z]) => new THREE.Vector2(y, z))), { depth: x1 - x0, bevelEnabled: false, curveSegments: 1 });
  geo.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, x0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 100, uv.getY(i) / 100);
  return [{ geo, mat }];
}
// the same in the plane of X and Z (points [x, z]), from y0 to y1
function prismXZ(pts: YZ[], y0: number, y1: number, mat: string): Geo {
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z))), { depth: y1 - y0, bevelEnabled: false, curveSegments: 1 });
  geo.applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, -1, y1, 0, 1, 0, 0, 0, 0, 0, 1));
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 100, uv.getY(i) / 100);
  return [{ geo, mat }];
}
// points round a circle of radius R about (cy, zs) in the plane of Y and Z, from angle `from` to
// `to` (radians: 0 along +Y, PI/2 straight up)
function arcPts(cy: number, zs: number, R: number, from: number, to: number, n = 14): YZ[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / n;
    return [cy + R * Math.cos(a), zs + R * Math.sin(a)] as YZ;
  });
}
// The voussoirs of an arch in the plane of Y and Z about (cy, zs): the opening r across, the ring
// `ring` deep, `depth` thick along X (a little proud of the wall it is set in); pieces `from`..`to`
// of n (counted from the -Y springing), the keystone a little bigger.
function voussoirs(cy: number, zs: number, r: number, ring: number, depth: number, mat: string, o: { n?: number; from?: number; to?: number; key?: string; alt?: string } = {}): Geo {
  const n = o.n ?? 9, out: Geo[] = [];
  for (let k = o.from ?? 0; k < (o.to ?? n); k++) {
    const a0 = -Math.PI / 2 + (Math.PI * k) / n, a1 = -Math.PI / 2 + (Math.PI * (k + 1)) / n;
    const key = k === (n - 1) / 2, d = depth / 2 + (key ? 7 : 2);
    out.push(sector(r, r + ring + (key ? 16 : k % 2 ? 6 : 0), -d, d, a0, a1, 2, key && o.key ? o.key : k % 2 && o.alt ? o.alt : mat, true, true));
  }
  // (sector's plane of X and Y turned up into Y and Z: x -> z, z -> -x)
  return translate(rotateY(merge(...out), -90), [0, cy, zs]);
}

// the bounding box of a Geo
function bounds(g: Geo): THREE.Box3 {
  const b = new THREE.Box3();
  for (const p of g) {
    p.geo.computeBoundingBox();
    b.union(p.geo.boundingBox!);
  }
  return b;
}
// moved so its footprint is centred on the origin (and, with `sink`, its lowest point that far
// below the ground)
function centre(g: Geo, sink?: number): Geo {
  const b = bounds(g);
  return translate(g, [-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, sink === undefined ? 0 : -b.min.z - sink]);
}
// a broken piece of stone lying about
const chunk = (size: V3, seed: number, at: V3, mat: string): Geo => translate(rock(size, 0.35, seed, mat), at);
// a crust of lichen on a top
const lichen = (r: number, at: V3, mat = "Ruins_Lichen", spin = 0): Geo => rotateZ(ellipsoid([r, r * 0.65, 3], [0, 0, 0], mat, 8), spin).map((p) => ({ geo: p.geo.clone().translate(...at), mat: p.mat }));
// meshes that cast no shadow (lights, mist)
function unshadowed(o: THREE.Object3D, mats?: THREE.Material[]): THREE.Object3D {
  o.traverse((m) => {
    const mesh = m as THREE.Mesh;
    if (mesh.isMesh && (!mats || mats.includes(mesh.material as THREE.Material))) mesh.castShadow = false;
  });
  return o;
}
const GLOWS = () => ["Ruins_GhostFire", "Ruins_GhostCore", "Ruins_Wisp", "Ruins_WispHalo", "Ruins_Seal"].map((n) => material(n));

// A column on `at`, h tall overall, its shaft r across at the foot: a square plinth, an Attic
// base, a fluted shaft tapering a little, an Ionic capital (its volutes to the front and back,
// the abacus on top). `cut`: the shaft broken off at this height, a raw break and no capital.
function column(at: V3, h: number, r: number, o: { cut?: number; seed?: number; mat?: string; shaft?: string } = {}): Geo {
  const M = o.mat ?? "Ruins_Marble", P: Geo[] = [];
  const pl = r * 0.3, baseH = r * 0.55, capH = r * 0.85;
  P.push(bb([-1.45 * r, -1.45 * r, 0], [1.45 * r, 1.45 * r, pl], M, 2));
  P.push(lathe([[1.38 * r, 0], [1.38 * r, 0.12 * r], [1.22 * r, 0.24 * r], [1.08 * r, 0.27 * r], [1.15 * r, 0.38 * r], [1.03 * r, baseH]], 16, M, [0, 0, pl]));
  const s0 = pl + baseH, sTop = h - capH, top = o.cut !== undefined ? Math.min(o.cut, sTop) : sTop;
  const rt = r - (0.14 * r * (top - s0)) / (sTop - s0);
  P.push(cylinderAt({ rBot: r, rTop: rt, height: top - s0, segments: 16, bottom: [0, 0, s0] }, o.shaft ?? "Ruins_Fluted"));
  if (o.cut !== undefined) {
    const rnd = seeded(o.seed ?? 7);
    P.push(rotateY(cylinderAt({ radius: rt * 0.97, height: 6, segments: 16, bottom: [0, 0, top - 4] }, "Ruins_MarbleCut"), 7 + rnd() * 9, [0, 0, top]));
    P.push(translate(rock([rt * 1.1, rt * 0.75, rt * 0.9], 0.4, (o.seed ?? 7) + 3, "Ruins_MarbleCut"), [rt * 0.25, (rnd() - 0.5) * rt * 0.4, top - 2]));
  } else {
    P.push(lathe([[rt, 0], [rt * 1.12, capH * 0.16], [rt * 1.26, capH * 0.36], [rt * 1.28, capH * 0.44]], 16, M, [0, 0, sTop]));
    const zv = sTop + capH * 0.5;
    P.push(bb([-1.05 * rt, -1.12 * rt, zv - 0.1 * rt], [1.05 * rt, 1.12 * rt, zv + 0.32 * rt], M));
    for (const s of [-1, 1]) {
      P.push(cylinderBetween([-1.06 * rt, s * 1.1 * rt, zv], [1.06 * rt, s * 1.1 * rt, zv], 0.34 * rt, 10, M));
      for (const fx of [-1, 1]) P.push(translate(rotateY(torus(0.18 * rt, 0.07 * rt, 10, 4, "Ruins_MarbleOld"), 90), [fx * 1.07 * rt, s * 1.1 * rt, zv]));
    }
    P.push(bb([-1.32 * rt, -1.32 * rt, h - capH * 0.24], [1.32 * rt, 1.32 * rt, h], M, 2));
  }
  return translate(merge(...P), at);
}

// =====================================================================================
// THE ANCIENT PLAIN
// =====================================================================================

// เศียรรูปปั้นยักษ์: the colossus's head (5.6 x 4.4 m, 3 m high), fallen on its cheek and half
// sunk in the grass, its blank eyes and broken face turned up to the sky; a crested helmet pushed
// back on it, a band of gilding still on the brim, curls under the rim, the neck a raw break.
function colossusHead(): Geo {
  const M = "Ruins_Marble", O = "Ruins_MarbleOld", H: Geo[] = [], rnd = seeded(11);
  // upright first, chin over the origin and the face to -X; laid down below
  H.push(ellipsoid([165, 140, 170], [15, 0, 250], M, 14));
  H.push(ellipsoid([125, 118, 150], [-45, 0, 185], M, 12));
  H.push(ellipsoid([110, 112, 82], [-70, 0, 105], M, 12));
  H.push(ellipsoid([48, 58, 46], [-142, 0, 80], M, 10));
  for (const s of [-1, 1]) {
    H.push(ellipsoid([46, 52, 52], [-126, s * 70, 172], M, 10));
    H.push(ellipsoid([20, 40, 23], [-155, s * 50, 222], "Ruins_Shadow", 10));
    H.push(ellipsoid([13, 27, 14], [-162, s * 50, 220], O, 10));
    H.push(ellipsoid([12, 34, 6], [-165, s * 50, 236], M, 8));
    H.push(ellipsoid([24, 14, 42], [22, s * 136, 200], M, 8));
    H.push(ellipsoid([16, 18, 12], [-186, s * 15, 150], M, 8));
  }
  H.push(box([40, 214, 26], [-156, 0, 254], M, 10));
  H.push(beamBetween([-170, 0, 244], [-212, 0, 160], 44, 36, M));
  H.push(ellipsoid([26, 30, 20], [-206, 0, 156], "Ruins_MarbleCut", 8)); // the nose's tip broken
  H.push(ellipsoid([15, 40, 10], [-167, 0, 127], M, 8), ellipsoid([15, 33, 11], [-162, 0, 110], M, 8), box([4, 58, 3], [-175, 0, 119], "Ruins_Shadow"));
  // the helmet, its gilded brim and its crest
  H.push(ellipsoid([178, 152, 122], [32, 0, 300], O, 14));
  H.push(box([30, 248, 20], [-120, 0, 300], "Ruins_MarbleOld", 7));
  for (let i = 0; i < 9; i++) {
    const a = -0.9 + (1.8 * i) / 8;
    H.push(translate(rotateY(box([48, 34, 92], [0, 0, 0], O, 7), a / RAD), [32 + Math.sin(a) * 160, 0, 300 + Math.cos(a) * 110 + 40]));
  }
  // curls under the rim at the back and the sides
  for (let row = 0; row < 2; row++)
    for (let k = 0; k < 13; k++) {
      const a = (-105 + (210 * k) / 12) * RAD;
      H.push(sphereCenter(23, [20 + Math.cos(a) * (150 - row * 8), Math.sin(a) * (134 - row * 6), 190 - row * 30], k % 2 ? M : O, 7));
    }
  // the neck, broken off
  H.push(cylinderBetween([5, 0, -60], [5, 0, 70], 95, 12, M), cylinderAt({ radius: 92, height: 4, segments: 12, bottom: [5, 0, -63] }, "Ruins_MarbleCut"));
  // lichen on the crown
  for (let i = 0; i < 6; i++) {
    const a = rnd() * Math.PI * 2;
    H.push(lichen(26 + rnd() * 20, [32 + Math.cos(a) * 120, Math.sin(a) * 100, 395], i % 3 ? "Ruins_Lichen" : "Ruins_LichenGold", a));
  }
  // laid on its right cheek, the face tipped up, sunk to the ear
  const head = centre(rotateZ(rotateY(rotateX(merge(...H), 90), 26), -12), 75);
  // grass heaped against it, chips of marble about
  const P: Geo[] = [head];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rnd() * 0.4;
    P.push(rotateZ(ellipsoid([110 + rnd() * 40, 55, 20], [0, 0, -10], "Ruins_Turf", 10), a / RAD + 90).map((p) => ({ geo: p.geo.clone().translate(Math.cos(a) * 250, Math.sin(a) * 220, 0), mat: p.mat })));
  }
  for (let i = 0; i < 6; i++) {
    const a = rnd() * Math.PI * 2;
    P.push(chunk([40 + rnd() * 40, 34 + rnd() * 30, 26 + rnd() * 20], 20 + i, [Math.cos(a) * 330, Math.sin(a) * 290, -4], i % 2 ? "Ruins_Marble" : "Ruins_MarbleOld"));
  }
  return merge(...P);
}

// ร่างรูปปั้นยักษ์ล้ม: the colossus's body (10 x 9 m) on its back in the grass: the muscled
// cuirass with a gilded gorgon, leather strips at the waist, the neck and the thighs broken off,
// one arm torn away at the shoulder, the other flung out with the hand open, fingers curled.
function colossusBody(): Geo {
  const M = "Ruins_Marble", O = "Ruins_MarbleOld", C = "Ruins_MarbleCut", P: Geo[] = [], rnd = seeded(13);
  // laid along Y, the neck at -Y, the front up; the ground at z = 0 cuts it about the middle
  P.push(ellipsoid([190, 210, 100], [0, -90, 40], O, 14), ellipsoid([165, 160, 92], [0, 120, 30], O, 14));
  for (const s of [-1, 1]) {
    P.push(ellipsoid([78, 66, 40], [s * 82, -150, 110], O, 10));
    for (let row = 0; row < 3; row++) P.push(ellipsoid([34, 30, 16], [s * 40, 10 + row * 58, 104 - row * 6], O, 8));
  }
  P.push(lathe([[0, 0], [34, 0], [37, 6], [30, 12], [0, 15]], 14, "Ruins_GoldDull", [0, -120, 136]));
  // the belt round the waist, the leather strips below it
  P.push(scaleZ(cylinderBetween([0, 205, 30], [0, 245, 30], 168, 16, "Ruins_GoldDull"), 96 / 168, 30));
  for (let i = 0; i < 9; i++) {
    const a = (12 + (156 * i) / 8) * RAD;
    P.push(translate(rotateY(box([12, 96, 40], [0, 0, 0], i % 2 ? O : "Ruins_TravertineMid", 3), -a / RAD), [160 * Math.cos(a), 300, 30 + 92 * Math.sin(a)]));
  }
  // the neck and the thighs, broken
  P.push(cylinderBetween([0, -300, 45], [0, -420, 45], 82, 12, M), cylinderBetween([0, -418, 45], [0, -424, 45], 80, 12, C));
  for (const s of [-1, 1]) P.push(cylinderBetween([s * 80, 300, 25], [s * 95, 500, 15], 92, 12, M, 86), cylinderBetween([s * 95, 498, 15], [s * 95.5, 505, 15], 84, 12, C));
  // the shoulders; the left arm gone, the right flung out with its hand open
  for (const s of [-1, 1]) P.push(sphereCenter(86, [s * 205, -235, 35], M, 12));
  P.push(cylinderBetween([-205, -235, 35], [-300, -210, 12], 72, 10, M), cylinderBetween([-298, -210.5, 13], [-305, -209, 10], 70, 10, C));
  P.push(cylinderBetween([205, -235, 35], [420, -140, 8], 72, 12, M, 62), sphereCenter(62, [420, -140, 8], M, 10));
  P.push(cylinderBetween([420, -140, 8], [590, -290, 6], 60, 12, M, 47), sphereCenter(46, [590, -290, 6], M, 10));
  const dir: V3 = [0.75, -0.66, 0], side: V3 = [0.66, 0.75, 0], at = (d: number, w: number, z: number): V3 => [645 + dir[0] * d + side[0] * w, -337 + dir[1] * d + side[1] * w, z];
  P.push(translate(rotateZ(box([120, 108, 36], [0, 0, 0], M, 10), -41.4), at(0, 0, 8)));
  for (const [w, len] of [[-38, 1], [-13, 1.1], [12, 1.05], [36, 0.85]]) {
    P.push(limb([at(50, w, 12), at(50 + 36 * len, w, 30), at(50 + 46 * len, w, 64), at(50 + 30 * len, w, 92)], 15, 11, M, { seg: 7, seed: 14 }));
  }
  P.push(limb([at(-10, -52, 12), at(10, -95, 24), at(40, -110, 50), at(62, -100, 66)], 18, 12, M, { seg: 7, seed: 15 }));
  // grass along its sides, lichen on the breastplate, chips about
  for (let i = 0; i < 10; i++) {
    const s = i % 2 ? 1 : -1, y = -380 + (i >> 1) * 190;
    P.push(ellipsoid([60 + rnd() * 30, 120 + rnd() * 40, 26], [s * (185 - Math.abs(y - 0) * 0.05), y, -4], "Ruins_Turf", 10));
  }
  for (let i = 0; i < 5; i++) P.push(lichen(24 + rnd() * 18, [(rnd() - 0.5) * 220, -200 + rnd() * 360, 132 - Math.abs(rnd() - 0.5) * 20], i % 2 ? "Ruins_Lichen" : "Ruins_LichenGold", rnd() * 6));
  for (let i = 0; i < 5; i++) P.push(chunk([40 + rnd() * 50, 30 + rnd() * 40, 26 + rnd() * 20], 30 + i, [-420 + rnd() * 900, -520 + rnd() * 1100, -4], i % 2 ? "Ruins_Marble" : "Ruins_MarbleOld"));
  return centre(merge(...P));
}
// ฐานรูปปั้นยักษ์: the pedestal the colossus stood on (5.4 x 4 m, 4.7 m tall): a plinth of
// travertine faced in marble, mouldings, a worn dedication; on it the two great feet in sandals,
// one a step ahead, the legs broken off above the ankle and below the knee; stone heaped round.
function colossusFeet(): Geo {
  const P: Geo[] = [], M = "Ruins_Marble", O = "Ruins_MarbleOld", rnd = seeded(15);
  P.push(bb([-270, -200, 0], [270, 200, 30], "Ruins_TravertineDark", 3), bb([-250, -180, 30], [250, 180, 60], O, 3));
  P.push(bb([-230, -160, 60], [230, 160, 220], "Ruins_Travertine", 3), bb([-246, -176, 220], [246, 176, 246], O, 3));
  P.push(bb([-233, -110, 100], [-229, 110, 196], M));
  for (let row = 0; row < 3; row++)
    for (let c = 0; c < 9; c++) if (rnd() > 0.15) P.push(bb([-235, -96 + c * 22, 170 - row * 28], [-232, -86 + c * 22 + rnd() * 6, 186 - row * 28], "Ruins_TravertineDark"));
  for (const s of [-1, 1]) {
    const y = s * 82, f = s > 0 ? -24 : 12, leg = s > 0 ? 470 : 370;
    P.push(bb([-160 + f, y - 54, 246], [110 + f, y + 54, 262], "Ruins_TravertineMid", 3));
    P.push(ellipsoid([138, 50, 46], [-22 + f, y, 266], M, 12));
    for (let k = -2; k <= 2; k++) P.push(ellipsoid([22, 10, 14], [-150 + f + Math.abs(k) * 7, y + k * 17, 268], M, 6));
    P.push(ellipsoid([62, 52, 62], [64 + f, y, 302], M, 10));
    for (const x of [-60, 10]) P.push(bb([x + f - 6, y - 50, 276], [x + f + 6, y + 50, 300], "Ruins_TravertineMid", 2));
    P.push(cylinderBetween([66 + f, y, 300], [76 + f, y, leg], 50, 12, M, 44));
    P.push(rotateY(cylinderAt({ radius: 43, height: 6, segments: 12, bottom: [76 + f, y, leg - 4] }, "Ruins_MarbleCut"), s * 9, [76 + f, y, leg]));
  }
  for (let i = 0; i < 7; i++) {
    const a = rnd() * Math.PI * 2;
    P.push(chunk([50 + rnd() * 60, 40 + rnd() * 50, 30 + rnd() * 30], 16 + i, [Math.cos(a) * (300 + rnd() * 60), Math.sin(a) * (240 + rnd() * 60), -4], i % 2 ? M : "Ruins_Travertine"));
  }
  for (let i = 0; i < 4; i++) P.push(lichen(20 + rnd() * 14, [(rnd() - 0.5) * 380, (rnd() - 0.5) * 260, 247], i % 2 ? "Ruins_Lichen" : "Ruins_LichenGold", rnd() * 6));
  return merge(...P);
}

// squash along Z about height z
function scaleZ(g: Geo, k: number, z: number): Geo {
  return g.map((p) => ({ geo: p.geo.clone().translate(0, 0, -z).scale(1, 1, k).translate(0, 0, z), mat: p.mat }));
}

// แนวเสาโบราณ (8 ม.): a colonnade 8 m along Y (pieces join end to end): a stylobate of two steps,
// four Ionic columns 5.6 m tall carrying their architrave, frieze and cornice over three bays; the
// fourth has broken off and lies in drums behind the row (+X), the beam it held fallen beside it.
function colonnade(): Geo {
  const P: Geo[] = [], rnd = seeded(31), M = "Ruins_Marble", O = "Ruins_MarbleOld";
  for (let i = 0; i < 5; i++) {
    const y0 = -400 + i * 160, dz = (rnd() - 0.5) * 4;
    P.push(bb([-115, y0 + 1, 0], [115, y0 + 159, 22 + dz], "Ruins_TravertineDark", 3));
    P.push(bb([-82, y0 + 1, 22 + dz], [82, y0 + 159, 44 + dz], i % 2 ? "Ruins_Travertine" : "Ruins_TravertineMid", 3));
  }
  const H = 560, Z = 44;
  for (const y of [-300, -100, 100]) P.push(column([0, y, Z], H, 30));
  P.push(column([0, 300, Z], H, 30, { cut: 210, seed: 33 }));
  const t = Z + H;
  P.push(bb([-36, -400, t], [36, -100, t + 46], M, 2), bb([-36, -100, t], [36, 160, t + 46], O, 2));
  P.push(bb([-32, -400, t + 46], [32, 160, t + 86], "Ruins_TravertineMid", 1));
  for (let y = -380; y < 150; y += 70) P.push(bb([-34, y, t + 48], [34, y + 26, t + 86], M));
  P.push(bb([-46, -400, t + 86], [46, 150, t + 102], M, 2));
  P.push(translate(rotateX(bb([-46, 0, -8], [46, 40, 8], "Ruins_MarbleCut", 2), 14), [0, 156, t + 92]));
  // the fallen column: its drums lying behind the row, its capital upside down, the beam
  const drums: [V3, V3][] = [[[150, 250, 27], [160, 325, 27]], [[190, 345, 26], [225, 410, 26]], [[255, 270, 25], [330, 300, 25]]];
  for (const [a, b] of drums) P.push(cylinderBetween(a, b, 27, 16, "Ruins_Fluted"), cylinderBetween(a, [a[0] + (b[0] - a[0]) * 0.03, a[1] + (b[1] - a[1]) * 0.03, a[2]], 26, 16, "Ruins_MarbleCut"));
  P.push(translate(rotateX(column([0, 0, 0], 60, 30).filter((_, i) => i > 2), 180), [260, 120, 64]));
  P.push(translate(rotateZ(rotateY(bb([-36, -130, 0], [36, 130, 46], O, 2), 9), 24), [180, 0, 0]));
  for (let i = 0; i < 4; i++) P.push(lichen(22 + rnd() * 16, [(rnd() - 0.5) * 50, -380 + rnd() * 500, t + 103], i % 2 ? "Ruins_Lichen" : "Ruins_LichenGold", rnd() * 6));
  for (let i = 0; i < 3; i++) P.push(chunk([30 + rnd() * 30, 26, 20], 40 + i, [-160 - rnd() * 60, -300 + rnd() * 600, -2], O));
  return merge(...P);
}

// ซุ้มโค้งหักพัง: a lone arch of travertine (6.8 m along Y, 1.4 m deep; you walk through it along
// X): two piers in courses, the arch springing at 3.8 m. The east (+Y) pier has broken down and
// the arch with it past the keystone; what stands of the west half hangs over the gap, its fallen
// stones in the grass.
function brokenArch(): Geo {
  const P: Geo[] = [], rnd = seeded(41), T = "Ruins_Travertine", TD = "Ruins_TravertineDark", D = 140;
  const zs = 380, r = 200, ring = 52, R = r + ring;
  // the piers in courses, the east one broken off in steps
  for (const s of [-1, 1]) {
    P.push(bb([-D / 2 - 14, s > 0 ? 200 : -350, 0], [D / 2 + 14, s > 0 ? 350 : -200, 34], TD, 3));
    const top = s > 0 ? 250 : zs;
    for (let z = 34; z < top - 1; z += 46) P.push(bb([-D / 2, s > 0 ? 200 : -340, z], [D / 2, s > 0 ? 340 : -200, Math.min(top, z + 46)], (z / 46) % 2 < 1 ? T : "Ruins_TravertineMid", 3));
    if (s < 0) P.push(bb([-D / 2 - 10, -346, zs - 24], [D / 2 + 10, -196, zs], "Ruins_Marble", 2)); // impost
  }
  P.push(bb([-D / 2, 216, 250], [D / 2, 300, 296], "Ruins_TravertineMid", 3), bb([-D / 2 + 20, 236, 296], [D / 2 - 10, 280, 322], T, 3));
  // the ring as far as the keystone, the wall over the west half, its top broken
  P.push(voussoirs(0, zs, r, ring, D, T, { n: 9, from: 0, to: 5, alt: "Ruins_TravertineMid", key: "Ruins_Marble" }));
  const brk = Math.atan2(zs + R, 0);
  P.push(prismYZ([[-340, zs], [-340, zs + 210], [-280, zs + 228], [-200, zs + 214], [-130, zs + 246], [-60, zs + 236], [-10, zs + 262], [10, zs + R + 2], ...arcPts(0, zs, R - 1, brk, Math.PI, 12).slice(1), [-R, zs]], -D / 2, D / 2, T));
  P.push(bb([-D / 2 - 8, -350, zs + 200], [D / 2 + 8, -180, zs + 218], "Ruins_Marble", 2));
  // the fallen voussoirs and blocks
  for (let i = 0; i < 5; i++) {
    const g = sector(r, R, -D / 2, D / 2, 0, Math.PI / 9, 2, i % 2 ? T : "Ruins_TravertineMid", true, true);
    P.push(translate(rotateZ(rotateX(g, 90 + rnd() * 40), rnd() * 360), [-150 + rnd() * 340, 330 + rnd() * 260, -r - 10]));
  }
  for (let i = 0; i < 4; i++) P.push(translate(rotateZ(bb([-40, -60, 0], [40, 60, 44], i % 2 ? T : TD, 3), rnd() * 180), [-200 + rnd() * 400, 260 + rnd() * 300, -2]));
  for (let i = 0; i < 3; i++) P.push(lichen(20 + rnd() * 12, [(rnd() - 0.5) * 60, -320 + rnd() * 100, zs + 218 + 2], "Ruins_Lichen", rnd() * 6));
  return merge(...P);
}

// ประตูชัยพัง: the triumphal arch over the old road (landmark, 17 m along Y, 4.6 m deep, 14 m
// tall): a great central passage (5.2 m wide, walk through along X) and two small side ones, four
// engaged columns a face on pedestals, reliefs over the side arches, roundels in the spandrels,
// the entablature and an attic with its dedication. The east (+Y) end has fallen in: its outer
// pier broken down, the attic and the cornice gone over it in a ragged slope, the rubble heaped at
// its foot and choking the east passage. On the attic a bronze chariot's plinth, a wheel left on it.
function triumphalArch(): Geo {
  const T = "Ruins_Travertine", TM = "Ruins_TravertineMid", TD = "Ruins_TravertineDark", M = "Ruins_Marble", O = "Ruins_MarbleOld";
  const P: Geo[] = [], rnd = seeded(61);
  const X0 = -230, X1 = 230, CR = 260, CZ = 620, CRING = 46, SR = 90, SZ = 380, SRING = 30, SY = 610, ENT = 1000, ATT = 1110, TOP = 1420;
  const CRo = CR + CRING, SRo = SR + SRING, sb = SZ + Math.sqrt(SRo * SRo - SR * SR);
  // the plinth under each pier, the piers
  for (const [a, b] of [[-840, -700], [-520, -260], [260, 520], [700, 840]]) P.push(bb([X0 - 24, a, 0], [X1 + 24, b, 90], TD, 4));
  P.push(bb([X0, -820, 90], [X1, -700, ENT], T, 2), bb([X0, 700, 90], [X1, 820, 700], T, 2));
  P.push(prismYZ([[700, 700], [820, 700], [820, 740], [780, 770], [740, 760], [700, 790]], X0, X1, T));
  for (const s of [-1, 1]) P.push(bb([X0, s > 0 ? 260 : -520, 90], [X1, s > 0 ? 520 : -260, CZ], T, 2));
  // the central arch and the wall over it, its east shoulder broken
  P.push(voussoirs(0, CZ, CR, CRING, X1 - X0, M, { n: 11, alt: O, key: O }));
  P.push(prismYZ([[CRo, CZ], [520, CZ], [520, 880], [450, 930], [380, 990], [300, ENT], [-520, ENT], [-520, CZ], [-CRo, CZ], ...arcPts(0, CZ, CRo - 1, Math.PI, 0, 18).slice(1, -1)], X0, X1, T));
  // the side arches and the walls over them
  for (const s of [-1, 1]) {
    P.push(voussoirs(s * SY, SZ, SR, SRING, X1 - X0, M, { n: 7, alt: O }));
    const top: YZ[] = s < 0 ? [[-520, ENT], [-700, ENT]] : [[700, 790], [640, 830], [580, 860], [520, 880]];
    const yA = s < 0 ? -520 : 700, yB = s < 0 ? -700 : 520; // the right then the left edge, seen along +X
    const ang = Math.acos(SR / SRo);
    P.push(prismYZ([[yA, sb], ...top.map((p) => p), [yB, sb], ...arcPts(s * SY, SZ, SRo - 1, Math.PI - ang, ang, 10).slice(1, -1)].map(([y, z]) => [y, z] as YZ), X0, X1, T));
    // impost mouldings in the passages
    for (const fx of [-1, 1]) P.push(bb([X0, s * SY + fx * SR - (fx > 0 ? 0 : 4), SZ - 16], [X1, s * SY + fx * SR + (fx > 0 ? 4 : 0), SZ], M));
  }
  for (const fy of [-1, 1]) P.push(bb([X0, fy * CR - (fy > 0 ? 0 : 6), CZ - 22], [X1, fy * CR + (fy > 0 ? 6 : 0), CZ], M));
  // the entablature, broken off over the east side passage
  P.push(bb([X0 - 10, -840, ENT], [X1 + 10, 560, ENT + 45], M), bb([X0 - 6, -840, ENT + 45], [X1 + 6, 560, ENT + 85], O), bb([X0 - 26, -850, ENT + 85], [X1 + 26, 535, ATT], M, 3));
  P.push(translate(rotateX(bb([X0 - 26, 0, -12], [X1 + 26, 50, 12], "Ruins_MarbleCut", 2), 18), [0, 530, ENT + 96]));
  // the attic, its east end broken down in a ragged slope, the inscription on both faces
  P.push(prismYZ([[-820, ATT], [-820, TOP], [100, TOP], [140, TOP - 40], [190, TOP - 80], [230, TOP - 170], [290, TOP - 210], [330, TOP - 260], [360, ATT]], X0 + 20, X1 - 20, T));
  P.push(bb([X0 + 10, -830, TOP], [X1 - 10, 100, TOP + 26], M, 2));
  for (const fx of [-1, 1]) {
    const x = fx < 0 ? X0 + 20 : X1 - 20;
    P.push(bb([x - (fx < 0 ? 6 : -0) - (fx > 0 ? 0 : 0), -560, 1160], [x + (fx > 0 ? 6 : 0), 60, 1370], O));
    for (let row = 0; row < 3; row++)
      for (let c = 0; c < 15; c++) {
        if ((row === 2 && c > 11) || rnd() < 0.12) continue;
        const y = -535 + c * 38, w = 12 + rnd() * 10, z = 1300 - row * 62;
        P.push(bb([x + fx * 6 - 1.5, y, z - 26], [x + fx * 6 + 1.5, y + w, z], "Ruins_TravertineDark"));
      }
  }
  // the engaged columns on their pedestals, the entablature breaking forward over them
  for (const y of [-760, -390, 390, 760])
    for (const fx of [-1, 1]) {
      const x = fx < 0 ? X0 - 14 : X1 + 14, broken = y === 760;
      P.push(bb([fx < 0 ? X0 - 62 : X1, y - 56, 90], [fx < 0 ? X0 : X1 + 62, y + 56, 250], TM, 3));
      P.push(column([x, y, 250], ENT - 250, 31, broken ? { cut: 260 + (fx > 0 ? 120 : 0), seed: 63 + fx } : {}));
      if (!broken) P.push(bb([fx < 0 ? X0 - 52 : X1, y - 46, ENT], [fx < 0 ? X0 : X1 + 52, y + 46, ENT + 85], O, 1), bb([fx < 0 ? X0 - 70 : X1, y - 56, ENT + 85], [fx < 0 ? X0 : X1 + 70, y + 56, ATT], M, 2));
    }
  // reliefs over the side arches: a framed panel, a procession of figures
  for (const s of [-1, 1])
    for (const fx of [-1, 1]) {
      const x = fx < 0 ? X0 : X1, zTop = s < 0 ? 900 : 780;
      P.push(bb([x - (fx < 0 ? 5 : 0), s * SY - 80, 540], [x + (fx > 0 ? 5 : 0), s * SY + 80, zTop], O));
      for (let k = 0; k < 4; k++) P.push(ellipsoid([8, 13, 44], [x + fx * 8, s * SY - 55 + k * 36, 620], M, 8), sphereCenter(11, [x + fx * 8, s * SY - 55 + k * 36, 676], M, 7));
    }
  // roundels in the spandrels of the central arch (the west ones; the east wall is broken there)
  for (const fx of [-1, 1]) {
    const x = fx < 0 ? X0 - 4 : X1 + 4;
    P.push(translate(rotateY(torus(62, 8, 16, 6, M), 90), [x, -405, 860]), cylinderBetween([x - 3, -405, 860], [x + 3, -405, 860], 56, 16, O));
  }
  // the chariot's plinth on the attic, a bronze wheel and two horses' hooves left on it
  P.push(bb([-150, -620, TOP + 26], [150, -160, TOP + 86], TM, 3));
  P.push(translate(rotateX(torus(70, 7, 16, 6, "CopperGreen"), 82), [-40, -280, TOP + 150]));
  for (const [x, y] of [[-60, -520], [40, -500], [-30, -420]]) P.push(cylinderAt({ rBot: 16, rTop: 12, height: 70, segments: 8, bottom: [x, y, TOP + 86] }, "CopperGreen"));
  // cracks, lichen, the rubble heaped at the east end and in the east passage
  for (const fx of [-1, 1]) {
    const x = fx < 0 ? X0 - 1 : X1 + 1;
    P.push(translate(rotateX(bb([-1, -2, -90], [1, 2, 90], "Ruins_Shadow"), 24), [x, 470, 760]), translate(rotateX(bb([-1, -2, -60], [1, 2, 60], "Ruins_Shadow"), -30), [x, -640, 420]));
  }
  for (let i = 0; i < 8; i++) P.push(lichen(30 + rnd() * 20, [(rnd() - 0.5) * 300, -780 + rnd() * 860, TOP + 27], i % 2 ? "Ruins_Lichen" : "Ruins_LichenGold", rnd() * 6));
  for (let i = 0; i < 16; i++) {
    const y = 560 + rnd() * 480, x = (rnd() - 0.5) * (y < 700 ? 300 : 700);
    if (rnd() < 0.5) P.push(translate(rotateZ(rotateY(bb([-50, -70, 0], [50, 70, 50], i % 3 ? T : TM, 3), (rnd() - 0.5) * 30), rnd() * 180), [x, y, -6]));
    else P.push(chunk([70 + rnd() * 70, 60 + rnd() * 50, 40 + rnd() * 50], 70 + i, [x, y, -6], i % 3 ? T : M));
  }
  P.push(chunk([200, 160, 150], 91, [0, 610, -10], TM), chunk([130, 120, 110], 92, [60, 640, 100], T));
  return merge(...P);
}

// โรงละครกลางแจ้ง: the amphitheatre (landmark, 28 m across): a horseshoe of seven tiers of seats
// over an arena of sand behind a podium wall, stairs up through the tiers, a gallery wall round
// the top with two storeys of arches on its outer face; its mouth (to -X) once closed by the stage
// building, of which a platform and a few columns stand. The north-west stretch (+X+Y) has fallen
// in. It is meant to sit in a ring of rising ground, its outer wall half buried.
function amphitheatre(): Geo {
  const T = "Ruins_Travertine", TM = "Ruins_TravertineMid", TD = "Ruins_TravertineDark", M = "Ruins_Marble", P: Geo[] = [], rnd = seeded(71);
  const A0 = -130 * RAD, A1 = 130 * RAD, W = 13, TIERS = 7, R0 = 660, STEP = 90, PZ = 140, RISE = 46;
  const wa = (k: number) => A0 + ((A1 - A0) * k) / W;
  const fallen = (k: number) => k >= 8 && k <= 10;
  P.push(cylinderAt({ radius: 600, height: 4, segments: 32, bottom: [0, 0, 0] }, "Ruins_ArenaSand"));
  P.push(sector(600, 662, 0, PZ, A0, A1, 30, TD), sector(594, 668, PZ, PZ + 12, A0, A1, 30, M));
  // the tiers: each wedge's height, the equal runs built as one block
  const h: number[][] = [];
  for (let k = 0; k < W; k++) {
    h.push([]);
    for (let i = 0; i < TIERS; i++) {
      let top = PZ + (i + 1) * RISE;
      if (fallen(k) && i >= 3) top = k === 9 && i >= 5 ? 0 : PZ + 3 * RISE + Math.round(rnd() * 2) * 22;
      h[k].push(top);
    }
  }
  for (let i = 0; i < TIERS; i++) {
    let k0 = 0;
    for (let k = 1; k <= W; k++) {
      if (k < W && h[k][i] === h[k0][i]) continue;
      if (h[k0][i] > 0) P.push(sector(R0 + i * STEP, R0 + i * STEP + STEP + 8, 0, h[k0][i], wa(k0), wa(k), (k - k0) * 3, i % 2 ? T : TM));
      k0 = k;
    }
  }
  // the stairs up through the tiers, at every third wedge
  for (const k of [0, 3, 6, 12, 13]) {
    const a = wa(k) / RAD;
    for (let i = 0; i < TIERS; i++) P.push(rotateZ(bb([R0 + i * STEP + 44, -34, 0], [R0 + i * STEP + STEP, 34, PZ + (i + 1) * RISE + 22], M), a));
  }
  // the gallery wall round the top, low and ragged where it has fallen; its cornice
  const wallH = (k: number) => (fallen(k) ? [380, 260, 300][k - 8] : 700);
  let k0 = 0;
  for (let k = 1; k <= W; k++) {
    if (k < W && wallH(k) === wallH(k0)) continue;
    P.push(sector(1290, 1370, 0, wallH(k0), wa(k0), wa(k), (k - k0) * 3, T));
    if (!fallen(k0)) P.push(sector(1282, 1384, wallH(k0), wallH(k0) + 18, wa(k0), wa(k), (k - k0) * 3, M));
    k0 = k;
  }
  // the arches on its outer face, two storeys, and the pilasters between them
  const opening = (z0: number, z1: number) => prismYZ([[-62, z0], [62, z0], [62, z1 - 62], ...arcPts(0, z1 - 62, 62, 0, Math.PI, 8).slice(1)], 1373, 1376, "Ruins_Shadow");
  for (let d = -125; d <= 125; d += 10) {
    const a = d * RAD, k = Math.min(W - 1, Math.floor((a - A0) / ((A1 - A0) / W))), top = wallH(k);
    for (const [z0, z1] of [[70, 330], [390, 600]]) if (z1 < top - 20) P.push(rotateZ(opening(z0, z1), d));
    if (d < 125) P.push(rotateZ(bb([1366, -16, 0], [1384, 16, Math.min(top, 700)], TM), d + 5));
  }
  // the ends of the horseshoe, the stage platform and what stands of its colonnade
  for (const a of [A0, A1]) P.push(rotateZ(bb([600, -60, 0], [1390, 60, 620], TD, 3), a / RAD), rotateZ(bb([600, -66, 620], [1396, 66, 640], M, 2), a / RAD));
  P.push(bb([-800, -420, 0], [-650, 420, 110], TD, 3), bb([-806, -426, 110], [-644, 426, 124], M, 2));
  for (const [y, cut] of [[-330, undefined], [-110, 200], [110, undefined], [330, 120]] as [number, number | undefined][]) P.push(column([-725, y, 124], 480, 26, cut ? { cut, seed: 72 + y } : {}));
  P.push(bb([-760, -360, 604], [-690, 140, 640], M, 2));
  // fallen stone in the broken stretch and on the arena floor
  for (let i = 0; i < 12; i++) {
    const a = (wa(8) + rnd() * (wa(11) - wa(8))), r = 900 + rnd() * 600;
    P.push(rnd() < 0.5 ? translate(rotateZ(bb([-50, -60, 0], [50, 60, 44], i % 2 ? T : TM, 3), rnd() * 180), [Math.cos(a) * r, Math.sin(a) * r, PZ + 3 * RISE * (r < 1290 ? 1 : 0) - 4]) : chunk([90, 70, 60], 100 + i, [Math.cos(a) * r, Math.sin(a) * r, (r < 1290 ? PZ + 3 * RISE : 0) - 6], T));
  }
  for (let i = 0; i < 4; i++) {
    const a = rnd() * Math.PI * 2, r = 200 + rnd() * 300;
    P.push(chunk([60, 50, 40], 120 + i, [Math.cos(a) * r, Math.sin(a) * r, 0], i % 2 ? T : M));
  }
  return merge(...P);
}

// ซากวิหารบนฐานสูง: a temple's ruin to stand on a raised platform (landmark, 15 m along Y, 10.4 m
// deep): three steps, the front row of six Ionic columns 6.4 m tall (the north two broken), the
// side and back rows mostly fallen to stumps, the entablature over the front's west four
// columns, the west half of the pediment with its figures, the cella's walls broken off, the cult
// statue fallen from its base, drums and blocks lying about.
function templeFront(): Geo {
  const P: Geo[] = [], rnd = seeded(81), M = "Ruins_Marble", O = "Ruins_MarbleOld";
  for (let i = 0; i < 3; i++) {
    const e = 520 - i * 40, w = 760 - i * 40, n = 8 - i;
    for (let j = 0; j < n; j++) {
      const y0 = -w + (2 * w * j) / n, y1 = -w + (2 * w * (j + 1)) / n;
      P.push(bb([-e, y0 + 1, i * 30], [e, y1 - 1, i * 30 + 30 + (rnd() - 0.5) * 3], i === 0 ? "Ruins_TravertineDark" : j % 2 ? O : M, 3));
    }
  }
  const Z = 90, H = 640, R = 34;
  const cols: [number, number, number | undefined][] = [
    [-400, -625, undefined], [-400, -375, undefined], [-400, -125, undefined], [-400, 125, undefined], [-400, 375, 330], [-400, 625, 150],
    [-150, -625, undefined], [100, -625, undefined], [350, -625, 260], [-150, 625, 120], [100, 625, 90], [350, 625, 200],
    [350, -375, undefined], [350, -125, 180], [350, 125, 60], [350, 375, 140],
  ];
  cols.forEach(([x, y, cut], i) => P.push(column([x, y, Z], H, R, cut !== undefined ? { cut, seed: 82 + i } : {})));
  // the entablature over the front's west four, a run of it over the west side
  const t = Z + H;
  P.push(bb([-440, -700, t], [-360, 200, t + 52], M, 2));
  for (let y = -700, k = 0; y < 200; y += 45, k++) P.push(bb([-438, y, t + 52], [-362, Math.min(200, y + 45), t + 102], k % 2 ? O : "Ruins_TravertineMid"));
  P.push(bb([-462, -722, t + 102], [-350, 212, t + 124], M, 2));
  P.push(bb([-360, -662, t], [140, -588, t + 52], M, 2), bb([-360, -666, t + 52], [140, -584, t + 102], O), bb([-350, -684, t + 102], [140, -566, t + 124], M, 2));
  // the west half of the pediment, broken at the apex; its figures
  const pz = t + 124;
  P.push(prismYZ([[-700, pz], [-700, pz + 8], [-60, pz + 212], [-24, pz + 150], [26, pz + 112], [58, pz + 40], [92, pz]], -436, -380, O));
  P.push(beamBetween([-412, -738, pz - 4], [-412, -40, pz + 222], 116, 22, M));
  P.push(ellipsoid([22, 100, 30], [-438, -540, pz + 36], M, 10), ellipsoid([20, 32, 76], [-440, -300, pz + 82], M, 10), sphereCenter(20, [-442, -300, pz + 170], M, 8), ellipsoid([20, 60, 44], [-438, -150, pz + 70], M, 10));
  // the cella's walls, broken off ragged; its door in the west wall
  const wallSeg = (a: [number, number], b: [number, number], hs: number[]) => {
    const n = hs.length;
    for (let i = 0; i < n; i++) {
      const p0 = [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n], p1 = [a[0] + ((b[0] - a[0]) * (i + 1)) / n, a[1] + ((b[1] - a[1]) * (i + 1)) / n];
      if (hs[i] <= 0) continue;
      P.push(bb([Math.min(p0[0], p1[0]) - 25, Math.min(p0[1], p1[1]) - 25, Z], [Math.max(p0[0], p1[0]) + 25, Math.max(p0[1], p1[1]) + 25, Z + hs[i]], i % 2 ? "Ruins_Travertine" : "Ruins_TravertineMid", 3));
    }
  };
  wallSeg([-220, -330], [-220, -90], [320, 280, 240]);
  wallSeg([-220, 90], [-220, 330], [180, 120, 60]);
  wallSeg([-195, -330], [300, -330], [300, 330, 260, 290, 200, 120]);
  wallSeg([-195, 330], [300, 330], [90, 40, 0, 70, 130, 60]);
  wallSeg([300, -305], [300, 305], [180, 220, 140, 90, 0, 60]);
  P.push(bb([-232, -102, Z], [-208, -86, Z + 330], M), bb([-232, 86, Z], [-208, 102, Z + 200], M));
  // the cult statue's base, the statue fallen across the floor
  P.push(bb([170, -100, Z], [280, 100, Z + 120], O, 3), bb([164, -106, Z + 120], [286, 106, Z + 134], M, 2));
  P.push(ellipsoid([44, 140, 40], [40, 20, Z + 30], M, 12), sphereCenter(32, [30, 190, Z + 28], M, 10), ellipsoid([30, 40, 30], [50, -150, Z + 24], "Ruins_MarbleCut", 8));
  // drums and blocks fallen on the stylobate and off it
  const drums: [V3, V3][] = [[[-260, 470, Z + 31], [-170, 520, Z + 31]], [[-60, 560, Z + 31], [20, 500, Z + 31]], [[160, 480, Z + 30], [200, 560, Z + 30]], [[-300, 860, 31], [-200, 900, 31]], [[100, 870, 30], [180, 840, 30]], [[600, -300, 30], [610, -210, 30]]];
  for (const [a, b] of drums) P.push(cylinderBetween(a, b, 31, 16, "Ruins_Fluted"));
  P.push(translate(rotateZ(bb([-40, -120, 0], [40, 120, 50], O, 2), 30), [-600, 300, -2]), translate(rotateZ(rotateY(bb([-40, -110, 0], [40, 110, 46], M, 2), 6), -20), [640, 400, -2]));
  for (let i = 0; i < 6; i++) P.push(lichen(24 + rnd() * 18, [-480 + rnd() * 960, -700 + rnd() * 1400, 92], i % 2 ? "Ruins_Lichen" : "Ruins_LichenGold", rnd() * 6));
  return merge(...P);
}

// บันไดหินขึ้นฐานวิหาร (9 ม. สูง 3 ม.): marble stairs for a straight ramp of 9 m rising 3 m (4.4 m
// wide), climbing toward +X and built about their middle (z = 0 there, -1.5 m at the foot): twenty
// steps, some cracked, between cheek walls that step up with them, a plinth with an urn at the foot
// of each.
function templeStairs(): Geo {
  const P: Geo[] = [], rnd = seeded(91);
  const run = 900, rise = 300, n = 20, W = 176, k = rise / run, tr = run / n, zAt = (x: number) => x * k;
  for (let i = 0; i < n; i++) {
    const x0 = -run / 2 + i * tr, x1 = x0 + tr, top = zAt(x1) + 1, mat = rnd() < 0.3 ? "Ruins_MarbleOld" : "Ruins_Marble";
    if (rnd() < 0.25) {
      const s = (rnd() - 0.5) * 200;
      P.push(bb([x0, -W, zAt(x0) - 40], [x1 + 5, s - 1, top], mat, 2), rotateX(bb([x0, s + 1, zAt(x0) - 40], [x1 + 5, W, top - 3], "Ruins_MarbleOld", 2), (rnd() - 0.5) * 2, [x0, s, top]));
    } else P.push(bb([x0, -W, zAt(x0) - 40], [x1 + 5, W, top], mat, 2));
    if (rnd() < 0.3) P.push(lichen(14 + rnd() * 10, [x1 - 10, (rnd() - 0.5) * 300, top], "Ruins_Lichen", rnd() * 6));
  }
  for (const s of [-1, 1]) {
    for (let j = 0; j < 5; j++) {
      const xa = -run / 2 + (j * run) / 5, xb = xa + run / 5;
      P.push(bb([xa, s > 0 ? W : -W - 44, zAt(xa) - 40], [xb + 2, s > 0 ? W + 44 : -W, zAt(xb) + 34], "Ruins_TravertineMid", 3));
    }
    const zb = zAt(-run / 2);
    P.push(bb([-run / 2 - 20, s > 0 ? W - 4 : -W - 48, zb - 40], [-run / 2 + 64, s > 0 ? W + 48 : -W + 4, zb + 120], "Ruins_Travertine", 3));
    P.push(lathe([[16, 0], [26, 10], [30, 30], [20, 52], [24, 60], [0, 62]], 10, "Ruins_MarbleOld", [-run / 2 + 22, s * (W + 22), zb + 120]));
  }
  return merge(...P);
}

// ต้นมะกอกป่า: a wild olive (4.6 m tall, 6 m across): a squat trunk split in two and twisted, low
// spreading boughs, a broad crown of small silvery leaves.
const OLIVE: CanopyLook = { card: "fine", dark: [106, 120, 90], mid: [158, 172, 132], light: [216, 224, 186], core: "Ruins_OliveCore" };
function oliveTree(): THREE.Object3D {
  const t = crownTree({
    seed: 73, trunk: [[0, 0, 0], [26, -14, 70], [-8, 10, 140], [16, 2, 200]], radius: 30, leaf: 44, look: OLIVE, bark: "Ruins_OliveBark",
    crowns: [[20, -20, 300, 205, 190, 95], [-135, 95, 255, 130, 120, 80], [135, 125, 250, 125, 115, 75], [-55, -175, 240, 115, 105, 70]],
    gnarl: 1.3, flare: 0.6, roots: 5, twigs: 2, limb: 0.55, density: 1.1,
  });
  const second = limb([[12, 20, 0], [-22, 32, 60], [-30, 8, 120], [-70, 50, 195]], 19, 9, "Ruins_OliveBark", { gnarl: 1.2, flare: 0.5, roots: 3, seed: 74, seg: 8 });
  return treeObject(merge(t.wood, second), [t.cards, OLIVE.card]);
}

// =====================================================================================
// THE LAGOON MARSH
// =====================================================================================

// กอธูปฤาษี: a clump of cattails (2.6 m), standing out of the water or the mud: strap leaves arching
// out, stems with brown cigar heads and a spike over each, a few broken and bent.
function cattails(): Geo {
  const g: Geo[] = [], rnd = seeded(141);
  for (let i = 0; i < 42; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 85, x = Math.cos(a) * d, y = Math.sin(a) * d;
    const h = 130 + rnd() * 100, lean = 0.15 + rnd() * 0.35, mid: V3 = [x + Math.cos(a) * h * lean * 0.3, y + Math.sin(a) * h * lean * 0.3, h * 0.55];
    const mat = rnd() < 0.25 ? "Ruins_ReedDry" : "Ruins_Reed";
    g.push(cylinderBetween([x, y, -14], mid, 3.4, 3, mat, 2.6), cylinderBetween(mid, [x + Math.cos(a) * h * lean, y + Math.sin(a) * h * lean, h], 2.6, 3, mat, 0.3));
  }
  for (let i = 0; i < 15; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 60, x = Math.cos(a) * d, y = Math.sin(a) * d, h = 190 + rnd() * 70;
    const bent = i % 6 === 5, top: V3 = bent ? [x + Math.cos(a) * 90, y + Math.sin(a) * 90, h * 0.6] : [x + Math.cos(a) * 14, y + Math.sin(a) * 14, h];
    g.push(cylinderBetween([x, y, -14], top, 1.7, 4, "Ruins_Reed", 1.3));
    const dir = [top[0] - x, top[1] - y, top[2] + 14], L = Math.hypot(dir[0], dir[1], dir[2]), u = dir.map((v) => v / L);
    const head = (d0: number, d1: number): [V3, V3] => [[top[0] - u[0] * d0, top[1] - u[1] * d0, top[2] - u[2] * d0], [top[0] - u[0] * d1, top[1] - u[1] * d1, top[2] - u[2] * d1]];
    const [h0, h1] = head(44, 8);
    g.push(cylinderBetween(h0, h1, 5.5, 6, "Ruins_Cattail", 5), sphereCenter(5, h1, "Ruins_Cattail", 5), cylinderBetween(top, [top[0] + u[0] * 22, top[1] + u[1] * 22, top[2] + u[2] * 22], 0.9, 3, "Ruins_ReedDry", 0.3));
  }
  return merge(...g);
}

// ต้นไม้จมน้ำตาย: a drowned tree (7 m): a dead trunk on a swollen buttressed foot, bare grey boughs
// hung with strands of moss, the knees of its roots standing out of the water round it.
function drownedTree(): Geo {
  const tips: { p: V3; d: V3; r: number }[] = [], rnd = seeded(151);
  const P: Geo[] = [grow({ mat: "Ruins_DeadBark", seed: 151, at: [0, 0, -20], dir: [0.1, 0.05, 1], len: 300, r: 32, depth: 3, spread: 0.72, shrink: 0.66, rise: 0.22, flare: 1.4, roots: 6, gnarl: 0.9, tips, tipR: 0.1 })];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rnd() * 0.4, d = 100 + rnd() * 90, h = 25 + rnd() * 45;
    P.push(cylinderAt({ rBot: 11, rTop: 3.5, height: h, segments: 6, bottom: [Math.cos(a) * d, Math.sin(a) * d, -16] }, "Ruins_DeadBark"));
  }
  for (const t of tips) {
    if (t.p[2] < 220) continue;
    for (let k = 0; k < 2; k++) {
      const L = 50 + rnd() * 120, x = t.p[0] + (rnd() - 0.5) * 24, y = t.p[1] + (rnd() - 0.5) * 24, z = t.p[2] - rnd() * 20;
      P.push(cylinderBetween([x, y, z], [x + (rnd() - 0.5) * 12, y + (rnd() - 0.5) * 12, z - L], 4.5, 4, "Ruins_HangMoss", 1.2));
    }
  }
  return merge(...P);
}

// ทางเดินไม้กระดานกลางบึง (4 ม.): a boardwalk of rotten planks 4 m along Y (pieces join end to end),
// 2 m wide: the deck a hand above the water on bearers and posts, one plank gone and one snapped,
// slime on the posts at the waterline, a sagging rope rail along the east side.
function marshBoardwalk(): Geo {
  const P: Geo[] = [], rnd = seeded(161), mats = ["Ruins_WetWood", "WoodGrey", "Ruins_WetWood", "Ruins_RotWood"];
  for (let i = 0; i < 17; i++) {
    const y = -200 + (400 / 17) * (i + 0.5);
    if (i === 11) continue;
    const snapped = i === 5, len = snapped ? 120 : 190 + (rnd() - 0.5) * 14, off = snapped ? -35 : (rnd() - 0.5) * 8;
    const plank = bb([off - len / 2, y - 10.5, 10], [off + len / 2, y + 10.5, 15], mats[(i * 3) % 4], 1);
    P.push(rotateZ(snapped ? rotateY(plank, -4, [off + len / 2, y, 12]) : plank, (rnd() - 0.5) * 4, [0, y, 0]));
  }
  for (const s of [-1, 1]) P.push(bb([s * 68 - 7, -200, 0], [s * 68 + 7, 200, 10], "Ruins_RotWood"));
  for (const y of [-150, 150]) {
    P.push(bb([-100, y - 7, -4], [100, y + 7, 6], "Ruins_RotWood"));
    for (const s of [-1, 1]) {
      P.push(cylinderAt({ rBot: 8, rTop: 7, height: s > 0 ? 190 : 125, segments: 7, bottom: [s * 98, y, -90] }, "Ruins_RotWood"));
      P.push(cylinderAt({ radius: 9.5, height: 12, segments: 7, bottom: [s * 98, y, -18] }, "Ruins_Algae"));
    }
  }
  const rope: V3[] = [];
  for (let i = 0; i <= 12; i++) {
    const y = -200 + (400 * i) / 12, t = (y + 150) / 300;
    rope.push([98, y, 88 - (t > 0 && t < 1 ? Math.sin(Math.PI * t) * 20 : Math.sin(Math.PI * Math.abs(t < 0 ? t : t - 1) * 3) * 5)]);
  }
  for (let i = 0; i < 12; i++) P.push(cylinderBetween(rope[i], rope[i + 1], 1.6, 4, "RopeTan"));
  return merge(...P);
}

// ซากเรือนใต้ถุนสูง: a stilt house fallen to ruin over the water (6.6 x 5.6 m, 5.8 m tall): nine
// stilts (the north-east one snapped, so that corner of the floor sags), the floor with a hole in
// it, the back wall of boards and half of the north one, the rest gone to the frame; the ridge
// pole and rafters with rotten thatch left on the west slope; a ladder, a fish trap, boards in the
// water.
function stiltRuin(): Geo {
  const P: Geo[] = [], rnd = seeded(201), Wd = "Ruins_WetWood", Rt = "Ruins_RotWood", FL = 200;
  const sag = (x: number, y: number) => (x > 0 && y > 0 ? (x / 270) * (y / 220) * 70 : 0);
  for (const x of [-270, 0, 270])
    for (const y of [-220, 0, 220]) {
      if (x === 270 && y === 220) {
        P.push(cylinderAt({ radius: 11, height: 185, segments: 7, bottom: [x, y, -60] }, Rt), rotateY(cylinderAt({ radius: 10, height: 10, segments: 7, bottom: [x, y, 120] }, "Ruins_WetWood"), 20, [x, y, 125]));
        P.push(cylinderBetween([x + 50, y + 70, -8], [x + 210, y + 140, 2], 10, 7, Rt));
      } else P.push(cylinderAt({ rBot: 12, rTop: 10, height: FL - sag(x, y) + 60 - 14, segments: 7, bottom: [x, y, -60] }, Rt));
      P.push(cylinderAt({ radius: 13, height: 12, segments: 7, bottom: [x, y, -18] }, "Ruins_Algae"));
    }
  for (const x of [-270, 0, 270]) P.push(beamBetween([x, -262, FL - 8], [x, 262, FL - sag(x, 262) - 8], 16, 16, Wd));
  for (let i = 0; i < 20; i++) {
    const y = -240 + i * 25.3;
    const x1 = i >= 12 && i <= 15 ? 30 - (i - 12) * 40 : 305;
    if (i === 7) continue;
    P.push(beamBetween([-305, y, FL - sag(-305, y) + 2], [x1, y, FL - sag(x1, y) + 2], 24, 5, i % 3 ? Wd : "WoodGrey"));
  }
  // corner and door posts, the plates along the top of the walls
  const WH = 230;
  for (const [x, y] of [[-290, -245], [-290, 245], [290, -245], [290, 245], [-290, -55], [-290, 55]]) P.push(cylinderAt({ radius: 8, height: WH, segments: 6, bottom: [x, y, FL - sag(x, y)] }, Wd));
  P.push(beamBetween([-290, -245, FL + WH], [290, -245, FL + WH], 12, 12, Wd), beamBetween([290, -245, FL + WH], [290, 245, FL + WH - 40], 12, 12, Wd));
  P.push(beamBetween([-290, -55, FL + 200], [-290, 55, FL + 200], 10, 14, Wd));
  // the back wall of boards, ragged at the top; half the north wall
  for (let y = -236; y < 240; y += 24) {
    if (rnd() < 0.15) continue;
    const base = FL - sag(290, y), h = 170 + rnd() * 50 - Math.max(0, y) * 0.15;
    P.push(bb([287, y, base], [293, y + 22, base + h], rnd() < 0.3 ? "WoodGrey" : Wd));
  }
  for (let x = -280; x < 60; x += 24) {
    if (rnd() < 0.2) continue;
    const h = 140 + rnd() * 70;
    P.push(bb([x, 242, FL], [x + 22, 248, FL + h], rnd() < 0.3 ? "WoodGrey" : Rt));
  }
  for (let i = 0; i < 4; i++) P.push(translate(rotateZ(bb([-10, -90, 0], [10, 90, 4], "WoodGrey"), rnd() * 180), [100 + rnd() * 120, 80 + rnd() * 120, FL - 30 + rnd() * 10]));
  // the roof: the ridge pole drooping at its broken north end, rafters, thatch on the west slope
  const RZ = FL + 380, EZ = FL + WH;
  P.push(beamBetween([0, -300, RZ], [0, 120, RZ], 14, 14, Wd), beamBetween([0, 120, RZ], [30, 300, RZ - 150], 12, 12, Wd));
  for (const y of [-280, -180, -80, 20, 120]) {
    P.push(beamBetween([-330, y, EZ - 20], [0, y, RZ + 4], 9, 9, Wd));
    if (y < 100) P.push(beamBetween([330, y, EZ - 20 - (y > 0 ? 20 : 0)], [0, y, RZ + 4], 9, 9, y === -80 ? Rt : Wd));
  }
  const ang = (Math.atan2(RZ - EZ + 20, 330) * 180) / Math.PI, slope = Math.hypot(330, RZ - EZ + 20);
  P.push(translate(rotateY(box([slope + 30, 340, 16], [0, 0, 0], "Ruins_RotThatch"), -ang), [-165, -130, (RZ + EZ - 20) / 2 + 12]));
  P.push(translate(rotateY(box([slope * 0.55, 150, 14], [0, 0, 0], "Ruins_RotThatch"), -ang - 6), [-230, 90, EZ + 30]));
  P.push(translate(rotateY(box([slope * 0.5, 160, 14], [0, 0, 0], "Ruins_RotThatch"), ang), [180, -200, EZ + 45]));
  // the ladder, a fish trap under the eaves, boards and a basket in the water
  for (const s of [-1, 1]) P.push(cylinderBetween([-400, s * 32, -10], [-312, s * 32, FL + 40], 4.5, 6, Wd));
  for (let i = 1; i < 8; i++) {
    const t = i / 8;
    P.push(cylinderBetween([-400 + 88 * t, -32, -10 + (FL + 50) * t], [-400 + 88 * t, 32, -10 + (FL + 50) * t], 3, 5, Rt));
  }
  P.push(cylinderAt({ rBot: 26, rTop: 8, height: 70, segments: 8, bottom: [-320, 150, FL + 100] }, "BambooDry"), cylinderBetween([-320, 150, FL + 170], [-320, 150, EZ - 10], 1.2, 3, "RopeTan"));
  for (let i = 0; i < 4; i++) P.push(translate(rotateZ(bb([-110, -11, -4], [110, 11, 2], i % 2 ? "WoodGrey" : Rt), rnd() * 180), [-200 + rnd() * 450, -340 + rnd() * 120, -8]));
  return centre(merge(...P));
}

// ศาลจมบึง: a round shrine sinking into the marsh (6 m across, 5.6 m tall): a stepped drum, six
// columns (two broken) under a ring and a dome, an urn on a pedestal inside with a pale light
// burning in it; the whole of it leaning, slime at the waterline, mud heaped round its foot.
function sunkenShrine(): Geo {
  const P: Geo[] = [], S = "Ruins_ShrineStone";
  P.push(lathe([[290, -80], [290, -10], [262, -10], [262, 15], [236, 15], [236, 40], [0, 40]], 22, S));
  for (let k = 0; k < 6; k++) {
    const a = (k * 60 + 30) * RAD, cut = k === 1 ? 140 : k === 4 ? 230 : undefined;
    P.push(column([Math.cos(a) * 196, Math.sin(a) * 196, 40], 300, 18, { mat: S, shaft: S, ...(cut ? { cut, seed: 172 + k } : {}) }));
  }
  P.push(lathe([[172, 340], [228, 340], [236, 352], [236, 378], [172, 381]], 22, S));
  P.push(lathe([[0, 381], [172, 381]], 22, "Ruins_Shadow"));
  P.push(lathe([[206, 378], [200, 420], [180, 460], [142, 495], [90, 520], [0, 530]], 18, "Ruins_GraniteMoss"));
  P.push(lathe([[22, 528], [16, 548], [24, 560], [6, 590], [0, 596]], 8, "Ruins_GoldDull"));
  P.push(bb([-38, -38, 40], [38, 38, 130], S, 3), lathe([[14, 0], [26, 14], [28, 34], [16, 50], [22, 58], [0, 60]], 10, "Ruins_GoldDull", [0, 0, 130]), sphereCenter(15, [0, 0, 200], "Ruins_Wisp", 8), sphereCenter(32, [0, 0, 200], "Ruins_WispHalo", 10));
  P.push(lathe([[298, -24], [296, -2], [292, 8]], 22, "Ruins_Algae"));
  for (let k = 0; k < 5; k++) P.push(lichen(30, [Math.cos(k * 1.3) * 120, Math.sin(k * 1.3) * 120, 500 - k * 6], "Ruins_Algae", k));
  const leaning = rotateY(rotateX(merge(...P), 6), -5);
  return merge(leaning, ellipsoid([350, 330, 34], [0, 0, -14], "Ruins_Peat", 16), ellipsoid([150, 110, 18], [-260, 120, -2], "Ruins_Algae", 10));
}

// แสงผีพราย: will-o'-wisps: three pale green lights hanging over the water (0.9 to 2.2 m up), each a
// bright heart in a faint halo with a trail of motes.
function wispLights(): THREE.Object3D {
  const P: Geo[] = [];
  for (const [x, y, z, s] of [[0, 0, 150, 1], [80, -60, 95, 0.75], [-70, 50, 215, 0.6]]) {
    P.push(sphereCenter(12 * s, [x, y, z], "Ruins_Wisp", 8), sphereCenter(23 * s, [x, y, z], "Ruins_WispHalo", 10));
    for (let k = 1; k <= 4; k++) P.push(sphereCenter((5 - k) * s * 0.9, [x - k * 10 * s, y + k * 4 * s, z - k * 7 * s], "Ruins_Wisp", 5));
  }
  const o = unshadowed(solid(merge(...P)));
  o.traverse((m) => (m.receiveShadow = false));
  return o;
}

// หมอกพิษ: a bank of poison mist lying on the marsh (10 x 9 m): soft blobs of sickly green, see-
// through, not writing depth, so they lie over whatever is in them.
const mistMats = new Map<string, THREE.Material>();
function mistMaterial(name: string): THREE.Material {
  let m = mistMats.get(name);
  if (!m) {
    const deep = name === "Ruins_MistDense";
    m = new THREE.MeshLambertMaterial({ color: deep ? "#86a463" : "#acc683", emissive: deep ? "#25350f" : "#2d3f16", transparent: true, opacity: deep ? 0.24 : 0.16, depthWrite: false });
    mistMats.set(name, m);
  }
  return m;
}
function poisonMist(): THREE.Object3D {
  const P: Geo[] = [], rnd = seeded(191);
  for (let i = 0; i < 8; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 260;
    P.push(ellipsoid([220 + rnd() * 160, 180 + rnd() * 140, 45 + rnd() * 35], [Math.cos(a) * d, Math.sin(a) * d, 40 + rnd() * 60], i % 3 ? "Ruins_Mist" : "Ruins_MistDense", 12));
  }
  const g = toThree(merge(...P), mistMaterial);
  g.traverse((o) => {
    o.castShadow = false;
    o.receiveShadow = false;
    o.renderOrder = 2;
  });
  return g;
}

// =====================================================================================
// THE ROYAL NECROPOLIS
// =====================================================================================

// รูปปั้นทหารเฝ้าสุสาน: a guardian of the kings' tombs (4.6 m): an armoured warrior in a long mail
// skirt and cloak, his gauntlets folded on the pommel of a greatsword standing point down before
// him, a tall-crested helm whose eye slit burns with ghost-light; on a plinth with an inscription.
function guardianStatue(): Geo {
  const P: Geo[] = [], G = "Ruins_Granite", B = "Ruins_Basalt", rnd = seeded(211);
  P.push(bb([-85, -85, 0], [85, 85, 22], B, 3), bb([-72, -72, 22], [72, 72, 100], G, 3), bb([-80, -80, 100], [80, 80, 112], B, 3));
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) P.push(bb([-74, -44 + c * 15, 46 + r * 15], [-72, -35 + c * 15, 55 + r * 15], "Ruins_Shadow"));
  const Z = 112;
  for (const s of [-1, 1]) P.push(bb([-54, s * 24 - 13, Z], [-6, s * 24 + 13, Z + 16], B, 4));
  P.push(lathe([[47, 0], [50, 14], [45, 60], [40, 110], [36, 142]], 14, G, [0, 0, Z + 4]));
  for (let k = 0; k < 8; k++) P.push(translate(rotateZ(bb([46, -3, 0], [50, 3, 120], B), k * 45 + 22), [0, 0, Z + 10]));
  P.push(ellipsoid([36, 46, 62], [0, 0, Z + 190], G, 12), ellipsoid([31, 42, 44], [-9, 0, Z + 200], B, 12));
  P.push(lathe([[41, 0], [43, 8], [41, 16]], 14, "Ruins_GoldDull", [0, 0, Z + 140]));
  for (const s of [-1, 1]) {
    P.push(ellipsoid([28, 27, 22], [2, s * 46, Z + 232], B, 10));
    P.push(limb([[0, s * 48, Z + 228], [-14, s * 52, Z + 186], [-36, s * 34, Z + 162], [-50, s * 12, Z + 158]], 13, 10, G, { seg: 8, seed: 212 }));
    P.push(ellipsoid([13, 12, 11], [-52, s * 9, Z + 157], B, 8));
  }
  P.push(bb([-60, -6, Z], [-52, 6, Z + 138], "IronLight"), bb([-62, -28, Z + 138], [-50, 28, Z + 146], "Ruins_GoldDull", 1));
  P.push(cylinderBetween([-56, 0, Z + 146], [-56, 0, Z + 168], 4, 6, "Ruins_RotWood"), sphereCenter(7, [-56, 0, Z + 174], "Ruins_GoldDull", 8));
  P.push(cylinderAt({ radius: 13, height: 22, segments: 8, bottom: [0, 0, Z + 248] }, G));
  P.push(ellipsoid([27, 25, 30], [0, 0, Z + 288], B, 12), bb([-29, -18, Z + 262], [-20, 18, Z + 297], B, 3), bb([-30.5, -15, Z + 282], [-28, 15, Z + 287], "Ruins_Shadow"));
  for (const s of [-1, 1]) P.push(sphereCenter(3.4, [-30, s * 7, Z + 284.5], "Ruins_GhostCore", 6));
  for (let i = 0; i < 9; i++) {
    const a = -1.05 + (2.1 * i) / 8;
    P.push(translate(rotateY(box([16, 7, 38], [0, 0, 0], G, 2), a / RAD), [Math.sin(a) * 30, 0, Z + 288 + Math.cos(a) * 30 + 14]));
  }
  P.push(ellipsoid([14, 58, 118], [32, 0, Z + 120], G, 12), ellipsoid([10, 40, 90], [38, 0, Z + 80], B, 10));
  for (let i = 0; i < 4; i++) P.push(lichen(14 + rnd() * 10, [(rnd() - 0.5) * 40, (rnd() - 0.5) * 100, i < 2 ? Z + 250 : 113], i % 2 ? "Ruins_Lichen" : "Ruins_LichenGold", rnd() * 6));
  return merge(...P);
}

// the bowl of a brazier of ghost-fire on its pedestal (2.4 m), shared by the brazier and the
// mausoleum
function brazierGeo(): Geo {
  const P: Geo[] = [];
  P.push(bb([-42, -42, 0], [42, 42, 18], "Ruins_Basalt", 3));
  P.push(lathe([[30, 18], [22, 30], [16, 60], [15, 100], [22, 112], [28, 118]], 10, "Ruins_Granite"));
  P.push(lathe([[12, 118], [36, 124], [52, 140], [58, 156], [54, 158], [48, 146], [10, 136]], 14, "CopperGreen"));
  for (let k = 0; k < 3; k++) {
    const a = (k * 120 + 30) * RAD;
    P.push(cylinderBetween([Math.cos(a) * 20, Math.sin(a) * 20, 104], [Math.cos(a) * 50, Math.sin(a) * 50, 150], 3.5, 6, "CopperGreen"));
  }
  // tongues of flame curling up out of the bowl, a white heart, a faint halo, sparks
  for (let k = 0; k < 7; k++) {
    const a = k * 0.9, d = k ? 26 : 0, h = k ? 50 + (k % 3) * 22 : 110, ox = Math.cos(a) * d, oy = Math.sin(a) * d, sw = k % 2 ? 1 : -1;
    const tx = -Math.sin(a) * 12 * sw, ty = Math.cos(a) * 12 * sw;
    P.push(limb([[ox, oy, 136], [ox * 0.8 + tx, oy * 0.8 + ty, 136 + h * 0.4], [ox * 0.5 - tx, oy * 0.5 - ty, 136 + h * 0.75], [ox * 0.4 + tx * 0.6, oy * 0.4 + ty * 0.6, 136 + h]], k ? 15 : 22, 0.6, "Ruins_GhostFire", { seg: 6, maxRings: 6, taper: 0.8 }));
  }
  P.push(limb([[0, 0, 136], [6, -4, 170], [-4, 3, 196]], 12, 0.5, "Ruins_GhostCore", { seg: 6, maxRings: 4 }));
  P.push(sphereCenter(52, [0, 0, 180], "Ruins_WispHalo", 10));
  for (const [x, y, z] of [[10, 14, 260], [-16, 4, 282], [6, -12, 302], [-4, 18, 324]]) P.push(sphereCenter(3, [x, y, z], "Ruins_GhostCore", 4));
  return merge(...P);
}
// กระถางไฟวิญญาณ: a brazier of ghost-fire: a granite pedestal, a bronze bowl gone green, pale green
// flames with a white heart, sparks rising.
const ghostBrazier = (): THREE.Object3D => unshadowed(solid(brazierGeo()), GLOWS());

// มหาสุสานหลวง: the great mausoleum of the first kings (landmark, 17.6 x 16 m, 17 m tall): two
// steps and a podium with a stair up its front, the chamber of dark stone with granite pilasters, a
// portico of four columns and a pediment with a winged disc, bronze doors sealed with violet
// light, a frieze with roundels, a roof of six steps rising to a plinth where an urn of ghost-fire
// burns; braziers at the podium's front corners, pinnacles at the roof's.
function mausoleum(): THREE.Object3D {
  const P: Geo[] = [], B = "Ruins_Basalt", G = "Ruins_Granite", rnd = seeded(221);
  P.push(bb([-800, -800, 0], [800, 800, 40], B, 4), bb([-760, -760, 40], [760, 760, 80], G, 4));
  P.push(bb([-700, -700, 80], [700, 700, 300], G, 3), bb([-716, -716, 300], [716, 716, 330], B, 3));
  for (let i = 0; i < 8; i++) P.push(bb([-940 + i * 30, -260, 0], [-700, 260, ((i + 1) * 330) / 8], i % 2 ? G : "Ruins_GraniteMoss", 2));
  for (const s of [-1, 1]) P.push(prismXZ([[-960, 0], [-700, 0], [-700, 360], [-760, 360], [-960, 70]], s > 0 ? 260 : -310, s > 0 ? 310 : -260, B));
  // the chamber, its pilasters, the frieze with roundels, the cornice
  const cx0 = -440, cx1 = 560, cy = 560;
  P.push(bb([cx0, -cy, 330], [cx1, cy, 1000], B, 3));
  for (let x = cx0 + 90; x < cx1; x += 210)
    for (const s of [-1, 1]) P.push(bb([x - 28, s > 0 ? cy - 2 : -cy - 16, 330], [x + 28, s > 0 ? cy + 16 : -cy + 2, 1000], G, 2));
  for (let y = -480; y <= 480; y += 240) P.push(bb([cx1 - 2, y - 28, 330], [cx1 + 16, y + 28, 1000], G, 2));
  P.push(bb([cx0 - 10, -cy - 20, 1000], [cx1 + 20, cy + 20, 1080], G, 2));
  for (let x = cx0 + 90; x < cx1; x += 210) for (const s of [-1, 1]) P.push(cylinderBetween([x, s * (cy + 20), 1040], [x, s * (cy + 26), 1040], 24, 12, "Ruins_GoldDull"));
  P.push(bb([cx0 - 30, -cy - 40, 1080], [cx1 + 40, cy + 40, 1120], B, 3));
  // the portico, its entablature and pediment with a winged disc
  for (const y of [-420, -150, 150, 420]) P.push(column([-620, y, 330], 640, 38, { mat: G, shaft: "Ruins_GraniteFluted" }));
  P.push(bb([-680, -580, 970], [cx0, 580, 1080], G, 2), bb([-704, -600, 1080], [cx0, 600, 1120], B, 3));
  P.push(prismYZ([[-580, 1120], [580, 1120], [0, 1370]], -690, -650, G));
  for (const s of [-1, 1]) P.push(beamBetween([-680, s * 610, 1112], [-680, 0, 1392], 76, 22, B));
  P.push(cylinderBetween([-694, 0, 1210], [-690, 0, 1210], 36, 14, "Ruins_GoldDull"));
  for (const s of [-1, 1]) P.push(prismYZ([[s * 34, 1222], [s * 200, 1250], [s * 180, 1232], [s * 196, 1222], [s * 170, 1204], [s * 34, 1196]].map(([y, z]) => [y, z] as YZ), -696, -690, "Ruins_GoldDull"));
  // the sealed door
  P.push(bb([cx0 - 30, -192, 330], [cx0 + 5, -150, 850], G, 2), bb([cx0 - 30, 150, 330], [cx0 + 5, 192, 850], G, 2), bb([cx0 - 36, -214, 850], [cx0 + 5, 214, 912], G, 2));
  P.push(bb([cx0 - 14, -150, 330], [cx0, -2, 850], "CopperGreen"), bb([cx0 - 14, 2, 330], [cx0, 150, 850], "CopperGreen"));
  for (const z of [420, 620, 780]) P.push(bb([cx0 - 18, -150, z], [cx0 - 13, 150, z + 16], "IronDark"));
  for (let z = 360; z < 840; z += 60) for (const y of [-120, -40, 40, 120]) P.push(sphereCenter(4, [cx0 - 15, y, z], "Ruins_GoldDull", 5));
  P.push(cylinderBetween([cx0 - 26, 0, 590], [cx0 - 17, 0, 590], 48, 18, "Ruins_Seal"), translate(rotateY(torus(55, 5, 18, 6, "Ruins_GoldDull"), 90), [cx0 - 22, 0, 590]));
  // the stepped roof, the plinth and urn of ghost-fire on top, pinnacles at its corners
  for (let k = 0; k < 6; k++) {
    const hx0 = -470 + k * 70, hx1 = 580 - k * 70, hy = 600 - k * 75, z = 1120 + k * 55;
    P.push(bb([hx0, -hy, z], [hx1, hy, z + 55], k % 2 ? B : G, 3));
  }
  for (const [x, y] of [[-430, -560], [-430, 560], [540, -560], [540, 560]]) P.push(translate(rotateZ(cylinderAt({ rBot: 30, rTop: 0, height: 170, segments: 4, bottom: [0, 0, 0] }, G), 45), [x, y, 1175]));
  P.push(bb([-60, -100, 1450], [170, 100, 1560], B, 3), bb([-70, -110, 1560], [180, 110, 1574], G, 2));
  P.push(translate(brazierGeo().filter((p) => p.mat !== "Ruins_Basalt" && p.mat !== "Ruins_Granite"), [55, 0, 1460]));
  for (const s of [-1, 1]) P.push(translate(brazierGeo(), [-640, s * 630, 330]));
  // moss creeping up the walls' foot, lichen on the steps
  for (let i = 0; i < 10; i++) P.push(lichen(30 + rnd() * 20, [-700 + rnd() * 1400, -700 + rnd() * 1400, 331], i % 2 ? "Ruins_Lichen" : "Ruins_LichenGold", rnd() * 6));
  for (const s of [-1, 1]) for (let x = cx0 + 40; x < cx1; x += 170 + rnd() * 80) P.push(ellipsoid([50 + rnd() * 40, 6, 40 + rnd() * 50], [x, s * (cy + 2), 340], "Ruins_GraniteMoss", 8));
  return unshadowed(solid(centre(merge(...P))), GLOWS());
}

// สุสานหิน: a house tomb (3.2 x 2.4 m, 2.7 m tall): a plinth, walls of grey granite with corner
// pilasters, a gabled roof of dark slabs with acroteria, the door sealed with a carved slab under
// an inscription.
function stoneTomb(): Geo {
  const P: Geo[] = [], G = "Ruins_Granite", B = "Ruins_Basalt", rnd = seeded(231);
  P.push(bb([-165, -125, 0], [165, 125, 30], B, 3), bb([-140, -100, 30], [140, 100, 190], G, 2));
  for (const [x, y] of [[-140, -100], [-140, 100], [140, -100], [140, 100]]) P.push(bb([x - 14, y - 14, 30], [x + 14, y + 14, 190], "Ruins_TombWhite", 2));
  P.push(bb([-152, -112, 190], [152, 112, 206], B, 2));
  P.push(gableRoof([300, 224, 16], [0, 0, 206], 64, 10, B));
  for (const x of [-150, 150]) P.push(gableWall(x, 112, 206, 62, G));
  for (const x of [-158, 158]) P.push(translate(rotateY(box([10, 26, 26], [0, 0, 0], G, 2), 45), [x, 0, 274]), bb([x - 8, -128, 200], [x + 8, -108, 226], G), bb([x - 8, 108, 200], [x + 8, 128, 226], G));
  P.push(bb([-143, -44, 30], [-140, 44, 156], "Ruins_Shadow"), bb([-148, -40, 34], [-141, 40, 152], "Ruins_TombWhite", 2));
  for (const z of [64, 98, 132]) P.push(bb([-149, -30, z], [-147, 30, z + 3], "Ruins_Shadow"));
  P.push(bb([-144, -56, 160], [-140, 56, 184], "Ruins_TombWhite"));
  for (let c = 0; c < 7; c++) P.push(bb([-145, -48 + c * 14, 168], [-144, -40 + c * 14, 176], "Ruins_Shadow"));
  for (let i = 0; i < 4; i++) P.push(lichen(16 + rnd() * 10, [(rnd() - 0.5) * 220, (rnd() - 0.5) * 120, 31], i % 2 ? "Ruins_Lichen" : "Ruins_LichenGold", rnd() * 6));
  P.push(chunk([36, 30, 22], 233, [130, 150, 0], B));
  return merge(...P);
}

// โลงศพหิน: a sarcophagus (2.8 x 1.4 m): a stained marble chest carved with garlands and rosettes on
// a low base, its gabled lid with corner acroteria pushed askew, the dark inside showing.
function sarcophagus(): Geo {
  const P: Geo[] = [], W = "Ruins_TombWhite", rnd = seeded(241);
  P.push(bb([-142, -72, 0], [142, 72, 20], "Ruins_Basalt", 3));
  P.push(bb([-125, -60, 20], [125, -48, 110], W, 2), bb([-125, 48, 20], [125, 60, 110], W, 2), bb([-125, -60, 20], [-113, 60, 110], W, 2), bb([113, -60, 20], [125, 60, 110], W, 2));
  P.push(bb([-113, -48, 20], [113, 48, 80], "Ruins_Shadow"));
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const y0 = s * 61, xc = -80 + k * 80;
      for (let j = 0; j <= 6; j++) {
        const t = j / 6, x = xc - 32 + 64 * t, z = 86 - Math.sin(Math.PI * t) * 26;
        P.push(sphereCenter(6.5, [x, y0, z], "Ruins_MarbleOld", 6));
      }
      P.push(cylinderBetween([xc, y0 - s * 1, 58], [xc, y0 + s * 3, 58], 9, 10, "Ruins_MarbleOld"));
    }
  }
  const lid = merge(gableRoof([262, 132, 12], [0, 0, 0], 26, 3, "Ruins_Granite"), gableWall(-131, 66, 0, 26, "Ruins_Granite"), gableWall(131, 66, 0, 26, "Ruins_Granite"), bb([-131, -66, -6], [131, 66, 0], "Ruins_Granite"));
  for (const [x, y] of [[-128, -64], [-128, 64], [128, -64], [128, 64]]) lid.push(...bb([x - 9, y - 9, 0], [x + 9, y + 9, 22], "Ruins_Granite", 2));
  P.push(translate(rotateZ(lid, 7), [24, 14, 116]));
  for (let i = 0; i < 3; i++) P.push(lichen(14 + rnd() * 8, [(rnd() - 0.5) * 200, (rnd() - 0.5) * 80, 21], "Ruins_Lichen", rnd() * 6));
  return merge(...P);
}

// เสาโอเบลิสก์: an obelisk of dark stone (8.4 m) on a stepped base, columns of carved signs up its
// faces, a band of glyphs glowing ghost-green round the pedestal, a pyramidion of dull gold.
function obelisk(): Geo {
  const P: Geo[] = [], B = "Ruins_Basalt", G = "Ruins_Granite", rnd = seeded(251);
  P.push(bb([-110, -110, 0], [110, 110, 30], G, 3), bb([-90, -90, 30], [90, 90, 70], B, 3), bb([-66, -66, 70], [66, 66, 190], G, 3), bb([-74, -74, 190], [74, 74, 206], B, 2));
  const Z0 = 206, HS = 560, w0 = 46, w1 = 30;
  P.push(rotateZ(cylinderAt({ rBot: w0 * Math.SQRT2, rTop: w1 * Math.SQRT2, height: HS, segments: 4, bottom: [0, 0, Z0] }, B), 45));
  P.push(rotateZ(cylinderAt({ rBot: w1 * Math.SQRT2, rTop: 0, height: 62, segments: 4, bottom: [0, 0, Z0 + HS] }, "Ruins_GoldDull"), 45));
  const tilt = (Math.atan2(w0 - w1, HS) * 180) / Math.PI;
  for (let r = 0; r < 4; r++) {
    const face: Geo[] = [];
    for (let i = 0; i < 14; i++) {
      const z = Z0 + HS - 50 - i * 34, half = w0 - ((w0 - w1) * (z - Z0)) / HS, w = 8 + rnd() * 14, h = 8 + rnd() * 16;
      face.push(translate(rotateY(bb([-1, -w / 2, -h / 2], [1, w / 2, h / 2], "Ruins_Shadow"), tilt), [-half - 0.3, (rnd() - 0.5) * 14, z]));
    }
    for (let c = 0; c < 5; c++) face.push(bb([-67.5, -48 + c * 22, 120], [-66, -38 + c * 22, 140], "Ruins_GhostFire"));
    P.push(rotateZ(merge(...face), 90 * r));
  }
  for (let i = 0; i < 3; i++) P.push(lichen(18 + rnd() * 10, [(rnd() - 0.5) * 150, (rnd() - 0.5) * 150, 31], "Ruins_Lichen", rnd() * 6));
  return merge(...P);
}

// ประตูสุสานผนึก: a sealed tomb gate cut in the rock (8.8 m along Y, 7 m tall), to stand against a
// cliff: a broad face crowned with stepped merlons, a portal of two pillars and a lintel with a
// winged disc, two stone leaves banded in bronze and chained shut, a seal of violet light across
// them, niches with mourning figures either side, steps before it and rubble at its foot.
function tombGate(): THREE.Object3D {
  const P: Geo[] = [], B = "Ruins_Basalt", G = "Ruins_Granite", rnd = seeded(261);
  P.push(bb([-40, -420, 0], [160, 420, 600], B, 3), bb([-60, -440, 0], [180, 440, 40], G, 3), bb([-56, -432, 560], [172, 432, 600], G, 3));
  for (let i = -3; i <= 3; i++) {
    const y = i * 120;
    P.push(bb([-30, y - 42, 600], [150, y + 42, 650], B, 3), bb([-20, y - 26, 650], [140, y + 26, 692], B, 3));
  }
  for (const s of [-1, 1]) {
    P.push(bb([-110, s * 160 - 40, 40], [-40, s * 160 + 40, 470], G, 3), bb([-118, s * 160 - 48, 40], [-40, s * 160 + 48, 72], B, 3), bb([-122, s * 160 - 50, 470], [-40, s * 160 + 50, 500], B, 3));
    // a niche with a mourning figure in it
    P.push(bb([-42, s * 310 - 52, 110], [-38, s * 310 + 52, 420], "Ruins_Shadow"), bb([-56, s * 310 - 62, 96], [-40, s * 310 + 62, 112], G, 2));
    P.push(lathe([[26, 0], [24, 120], [18, 200], [12, 220]], 10, G, [-60, s * 310, 112]), sphereCenter(15, [-62, s * 310, 345], G, 8), ellipsoid([14, 22, 60], [-60, s * 310, 300], G, 8));
  }
  P.push(bb([-126, -232, 500], [-40, 232, 580], G, 3));
  P.push(cylinderBetween([-130, 0, 540], [-125, 0, 540], 30, 16, "Ruins_GoldDull"));
  for (const s of [-1, 1]) P.push(translate(rotateX(box([4, 120, 16], [0, 0, 0], "Ruins_GoldDull"), s * 9), [-128, s * 92, 545]));
  // the doorway: the dark behind, two leaves, bronze bands, the seal and the chains
  P.push(bb([-41, -120, 40], [-20, 120, 470], "Ruins_Shadow"));
  P.push(bb([-62, -118, 40], [-44, -2, 466], B, 2), bb([-62, 2, 40], [-44, 118, 466], B, 2));
  for (const z of [110, 250, 390]) P.push(bb([-66, -118, z], [-61, 118, z + 18], "Bronze"));
  P.push(cylinderBetween([-74, 0, 260], [-64, 0, 260], 46, 18, "Ruins_Seal"), translate(rotateY(torus(52, 5, 18, 6, "Ruins_GoldDull"), 90), [-70, 0, 260]));
  for (const s of [-1, 1]) {
    const a: V3 = [-114, s * 160, 330], b: V3 = [-76, s * 50, 262], pts: V3[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - Math.sin(Math.PI * t) * 34]);
    }
    for (let i = 0; i < 10; i++) P.push(cylinderBetween(pts[i], pts[i + 1], 2.6, 5, "IronDark"), sphereCenter(4.5, pts[i + 1], "IronDark", 5));
    P.push(translate(rotateY(torus(9, 2.5, 10, 4, "IronDark"), 90), [-114, s * 160, 336]));
  }
  // the steps, rubble and moss at the foot
  P.push(bb([-170, -262, 0], [-40, 262, 22], G, 3), bb([-232, -242, 0], [-170, 242, 11], B, 3));
  for (let i = 0; i < 6; i++) P.push(chunk([50 + rnd() * 60, 40 + rnd() * 50, 30 + rnd() * 40], 262 + i, [-120 - rnd() * 140, (rnd() < 0.5 ? -1 : 1) * (300 + rnd() * 140), -4], i % 2 ? B : G));
  for (let i = 0; i < 6; i++) P.push(ellipsoid([40 + rnd() * 30, 30, 12 + rnd() * 10], [-48, -400 + rnd() * 800, 30 + rnd() * 10], "Ruins_GraniteMoss", 8));
  return unshadowed(solid(centre(merge(...P))), GLOWS());
}

// รากไม้ชอนไชซากหิน: the roots of a jungle fig gripping a fallen tomb block (3.8 x 3 m): the fig's
// buttressed foot on the +X side (plant a tree there), roots snaking over the stone and down into
// the ground beyond it, lianas looped over it with heart-shaped leaves.
function rootTangle(): THREE.Object3D {
  const P: Geo[] = [], rnd = seeded(271);
  P.push(rotateY(rotateX(bb([-130, -75, -30], [130, 75, 85], "Ruins_Granite", 4), 4), -5));
  P.push(cylinderBetween([-138, 0, 34], [-130, 0, 34], 24, 12, "Ruins_TombWhite"));
  P.push(translate(rotateZ(rotateY(bb([-50, -40, 0], [50, 40, 45], "Ruins_GraniteMoss", 4), 12), 30), [-60, 140, -8]));
  P.push(limb([[210, 0, -10], [206, 4, 60], [200, 0, 140]], 46, 34, "Ruins_Root", { flare: 1.2, roots: 6, gnarl: 1, seed: 272 }));
  const roots: V3[][] = [
    [[185, -20, 70], [120, -30, 100], [40, -40, 104], [-60, -30, 98], [-125, -40, 72], [-160, -50, 10], [-175, -55, -15]],
    [[185, 20, 80], [110, 30, 104], [20, 40, 106], [-80, 50, 96], [-140, 70, 40], [-170, 80, -12]],
    [[190, -40, 30], [150, -95, 34], [60, -100, 44], [-20, -104, 34], [-80, -112, 0], [-100, -115, -15]],
    [[190, 40, 40], [140, 100, 26], [60, 112, 18], [0, 150, 0], [-20, 170, -15]],
    [[180, 0, 110], [100, 0, 112], [0, -5, 106], [-90, 0, 96], [-150, 5, 50], [-180, 10, -12]],
  ];
  roots.forEach((pts, i) => P.push(limb(pts, 15 - i * 1.5, 5, "Ruins_Root", { gnarl: 0.8, seed: 280 + i })));
  const vines: V3[][] = [
    [[198, 12, 150], [120, 60, 124], [30, 72, 110], [-60, 80, 100], [-130, 92, 62], [-150, 100, 0]],
    [[196, -12, 142], [80, -70, 116], [-20, -82, 104], [-110, -74, 76], [-140, -80, 10]],
  ];
  const cards = new LeafCards(), UP = new THREE.Vector3(0, 0, 1);
  vines.forEach((pts, i) => {
    P.push(limb(pts, 3.5, 2.2, "Ruins_Vine", { seg: 5, seed: 290 + i }));
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    for (let k = 0; k < 18; k++) {
      const p = curve.getPointAt((k + 0.5) / 18), a = rnd() * Math.PI * 2, L = 16 + rnd() * 10;
      const out = new THREE.Vector3(Math.cos(a), Math.sin(a), 0.4).normalize();
      cards.facing([p.x + out.x * 8, p.y + out.y * 8, p.z + 4], out.clone().addScaledVector(UP, 1.2).normalize(), rnd() * 6.28, L, L, UP, canopyTint(CANOPY.vine, 0.25 + rnd() * 0.6));
    }
  });
  const g = toThree(merge(...P), material);
  if (cards.count) g.add(cards.mesh("heart"));
  return g;
}

// ---------- shapes the old lands' fields share (world cm, north +X, west +Y) ----------
export type XY = [number, number];

// a Catmull-Rom curve through the points, `per` steps a span
export function smooth(pts: XY[], per = 4): XY[] {
  const out: XY[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const c = (j: 0 | 1) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
      out.push([c(0), c(1)]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// a strip `w` wide along a polyline
export function band(pts: XY[], w: number): XY[] {
  const left: XY[] = [], right: XY[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    left.push([pts[i][0] + (nx * w) / 2, pts[i][1] + (ny * w) / 2]);
    right.push([pts[i][0] - (nx * w) / 2, pts[i][1] - (ny * w) / 2]);
  }
  return [...left, ...right.reverse()];
}
// a wobbly ellipse of radii rx (along X) and ry about (cx, cy)
export function blob(cx: number, cy: number, rx: number, ry: number, seed: number, n = 24): XY[] {
  const out: XY[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, k = 1 + 0.09 * Math.sin(a * 3 + seed) + 0.06 * Math.cos(a * 5 + seed * 2);
    out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return out;
}
// the sharp corners of a plateau's outline cut off (a turn over `maxTurn` degrees becomes two),
// so the rock faces of its edges meet cleanly
export function bevel(poly: XY[], maxTurn = 35, cut = 260): XY[] {
  const out: XY[] = [], n = poly.length;
  for (let i = 0; i < n; i++) {
    const p = poly[(i + n - 1) % n], c = poly[i], q = poly[(i + 1) % n];
    const ax = c[0] - p[0], ay = c[1] - p[1], bx = q[0] - c[0], by = q[1] - c[1], la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    const turn = (Math.acos(Math.max(-1, Math.min(1, (ax * bx + ay * by) / (la * lb)))) * 180) / Math.PI;
    if (turn <= maxTurn) {
      out.push(c);
      continue;
    }
    const d = Math.min(cut, la * 0.3, lb * 0.3);
    out.push([c[0] - (ax / la) * d, c[1] - (ay / la) * d], [c[0] + (bx / lb) * d, c[1] + (by / lb) * d]);
  }
  return out;
}
export function inPoly(poly: XY[], x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// a point `d` along a polyline and the line's direction there
export function along(pts: XY[], d: number): { p: XY; dir: XY } {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
    if (d <= L || i + 2 === pts.length) {
      const t = Math.min(1, d / (L || 1));
      return { p: [ax + (bx - ax) * t, ay + (by - ay) * t], dir: [(bx - ax) / (L || 1), (by - ay) / (L || 1)] };
    }
    d -= L;
  }
  return { p: pts[0], dir: [1, 0] };
}
export const lengthOf = (pts: XY[]): number => pts.slice(1).reduce((t, p, i) => t + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
// how far a point is from a polyline
export function distTo(pts: XY[], x: number, y: number): number {
  let best = Infinity;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(ax + dx * t - x, ay + dy * t - y));
  }
  return best;
}
// the heading that turns an item's front (-X) toward world direction (dx, dy)
export const towards = (dx: number, dy: number): number => (Math.atan2(-dy, -dx) * 180) / Math.PI;
// the heading that lays an item's own X axis along world direction (dx, dy)
export const alongDir = (dx: number, dy: number): number => (Math.atan2(dy, dx) * 180) / Math.PI;
// A ramp off edge i of a plateau's outline as drawn (from point i to i + 1), `t` along it: its top
// on the edge, its foot `len` out from it.
export function rampOff(poly: XY[], i: number, t: number, len: number, width: number, straight = false): { top: XY; bottom: XY; width: number; straight: boolean } {
  const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const top: XY = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
  if (inPoly(poly, top[0] + nx * 60, top[1] + ny * 60)) [nx, ny] = [-nx, -ny];
  return { top, bottom: [top[0] + nx * len, top[1] + ny * len], width, straight };
}

// ---------- the sample: where the plain's ruins (north and west) meet the necropolis (south-east),
// a corner of the marsh to the south-west ----------
function sample(put: Put): void {
  // the plain: a colonnade along an old street, the colossus fallen in the grass, a broken arch,
  // olives
  put("colonnade", [1300, 900, 0], 0);
  put("colonnade", [1300, 1700, 0], 0);
  put("colossus_body", [-200, 1300, 0], 20);
  put("colossus_head", [-1150, 450, 0], -30);
  put("broken_arch", [600, 100, 0], 0);
  put("olive_tree", [-1400, 1700, 0], 0);
  put("olive_tree", [300, 1900, 0], 140, 0.85);
  put("olive_tree", [1800, -100, 0], 60, 0.9);
  // the necropolis: guardians lining the way to a tomb, obelisks, braziers, sarcophagi, the
  // jungle's roots
  for (const x of [-500, 300]) for (const s of [-1, 1]) put("guardian_statue", [x, -700 + s * 330, 0], s > 0 ? 90 : -90);
  put("tomb_gate", [1500, -1100, 0], 0);
  put("stone_tomb", [-400, -1700, 0], 90);
  put("stone_tomb", [400, -1750, 0], 90);
  put("sarcophagus", [-1100, -400, 0], 20);
  put("sarcophagus", [-1100, -1000, 0], -10);
  put("obelisk", [900, -300, 0], 0);
  put("ghost_brazier", [900, -800, 0], 0);
  put("ghost_brazier", [900, -1400, 0], 0);
  put("root_tangle", [-200, -1300, 0], 180);
  put("flora:JungleTree", [-430, -1300, 0], 30, 0.9);
  put("flora:JungleBush", [100, -1100, 0], 0);
  put("flora:JungleBush", [1900, -1600, 0], 0);
  // the marsh's edge: a drowned tree, cattails, a wisp, mist
  put("drowned_tree", [-1500, -1500, 0], 0);
  put("cattails", [-1800, -1100, 0], 0);
  put("cattails", [-1200, -1800, 0], 70, 0.8);
  put("wisp_lights", [-1500, -900, 0], 0);
  put("poison_mist", [-1500, -1500, 0], 0);
  put("common:rock_small", [-1700, 300, 0], 0);
}

export const KIT: Kit = {
  id: "ruins",
  name: "ซากโบราณแดนใต้ตะวันตก",
  region: "รอบเวนิชเซีย ทางตะวันออกเฉียงใต้",
  desc: "ซากนครที่เก่ากว่าอาณาจักร รูปปั้นยักษ์ล้ม แนวเสา ประตูชัย โรงละครกลางแจ้ง บึงลากูนหมอกพิษ และสุสานหลวงที่ป่าแดนใต้กำลังกลืน",
  ground: "grass",
  items: [
    { id: "colossus_head", name: "เศียรรูปปั้นยักษ์", make: colossusHead, tags: ["landmark", "ruin"] },
    { id: "colossus_body", name: "ร่างรูปปั้นยักษ์ล้ม", make: colossusBody, tags: ["landmark", "ruin"] },
    { id: "colossus_feet", name: "ฐานรูปปั้นยักษ์", make: colossusFeet, tags: ["landmark", "ruin"] },
    { id: "colonnade", name: "แนวเสาโบราณ (8 ม.)", make: colonnade, tags: ["ruin", "wall"] },
    { id: "broken_arch", name: "ซุ้มโค้งหักพัง", make: brokenArch, tags: ["ruin", "gate"] },
    { id: "triumphal_arch", name: "ประตูชัยพัง", make: triumphalArch, tags: ["landmark", "gate"] },
    { id: "amphitheatre", name: "โรงละครกลางแจ้ง", make: amphitheatre, tags: ["landmark", "ruin"] },
    { id: "temple_front", name: "ซากวิหารบนฐานสูง", make: templeFront, tags: ["landmark", "ruin"] },
    { id: "temple_stairs", name: "บันไดหินขึ้นฐานวิหาร (9 ม. สูง 3 ม.)", make: templeStairs, tags: ["ground", "stairs"] },
    { id: "olive_tree", name: "ต้นมะกอกป่า", make: oliveTree, tags: ["plant"] },
    { id: "cattails", name: "กอธูปฤาษี", make: cattails, tags: ["plant", "ground"] },
    { id: "drowned_tree", name: "ต้นไม้จมน้ำตาย", make: drownedTree, tags: ["plant"] },
    { id: "marsh_boardwalk", name: "ทางเดินไม้กลางบึง (4 ม.)", make: marshBoardwalk, tags: ["ground", "dock"] },
    { id: "stilt_ruin", name: "ซากเรือนใต้ถุนสูง", make: stiltRuin, tags: ["ruin", "building"] },
    { id: "sunken_shrine", name: "ศาลจมบึง", make: sunkenShrine, tags: ["landmark", "shrine"] },
    { id: "wisp_lights", name: "แสงผีพราย", make: wispLights, tags: ["light", "magic", "ground"] },
    { id: "poison_mist", name: "หมอกพิษ", make: poisonMist, tags: ["ground", "magic"] },
    { id: "guardian_statue", name: "รูปปั้นทหารเฝ้าสุสาน", make: guardianStatue, tags: ["statue", "decor"] },
    { id: "mausoleum", name: "มหาสุสานหลวง", make: mausoleum, tags: ["landmark", "building"] },
    { id: "stone_tomb", name: "สุสานหิน", make: stoneTomb, tags: ["building", "ruin"] },
    { id: "sarcophagus", name: "โลงศพหิน", make: sarcophagus, tags: ["decor", "ruin"] },
    { id: "obelisk", name: "เสาโอเบลิสก์", make: obelisk, tags: ["landmark", "decor"] },
    { id: "tomb_gate", name: "ประตูสุสานผนึก", make: tombGate, tags: ["gate", "landmark"] },
    { id: "ghost_brazier", name: "กระถางไฟวิญญาณ", make: ghostBrazier, tags: ["light", "magic"] },
    { id: "root_tangle", name: "รากไม้ชอนไชซากหิน", make: rootTangle, tags: ["plant", "ruin"] },
  ],
  sample,
};
