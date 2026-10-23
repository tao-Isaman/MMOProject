// The far west (เนินเขาและนาขั้นบันได): three fields at the western end of the continent, and
// what they are built from beyond the shared kits.
// - The highland downs west of Highland Hill: broad round hills under a thin snow, dry-stone walls
//   running over them, the old stone circle on the highest down (snow on the stones' heads,
//   lichen on their sides), a shepherd's bothy with a roped thatch, a walled fold for the shaggy
//   highland cattle, heather and gorse, lone pines bent by the wind.
// - The rice terraces south of Suzhou: flooded paddies stepping down the hillsides (each piece a
//   sheet of still water in its earth bund, young rice in rows), stone steps up the terraces,
//   farmhouses with white walls and grey tiled roofs that turn up at the corners, water buffalo
//   and their bamboo pen, straw-caped scarecrows, the bamboo water wheel and its channels, the
//   village's little shrine to the earth god.
// - The west cape, where the land runs out into a wild sea: the sea dragon's shrine (a stone gate
//   with dragons coiled up its pillars, an altar where a stone dragon guards a glowing pearl), a
//   great carrack broken on the reef, the beacons that failed to warn it, black storm rocks and
//   the spray breaking over them.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front facing -X
// (the trees on their trunk's foot, leaning toward +X). Pieces that tile: the dry-stone wall
// (3 m along Y), the paddy (5.6 x 4.8 m, its bunds on every side) and the bamboo channel (4 m
// along Y).

import * as THREE from "three";
import { merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween, cylinderBetween, cylinderAt, sphereCenter, torus, rock } from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial, FLOWER_CELLS } from "../textures";
import { Cards, shrub, limb, lump, LeafCards, treeObject } from "../trees";
import type { ShrubLook } from "../trees";
import { coverTop } from "../nature";
import type { Kit } from "./types";

// ---- the far west's own colours ----
// the downs: field stone, megaliths, lichen, turf, peat, hay; the cattle
defineMaterial("Westhills_Fieldstone", { map: "stone", tint: "#9d988c", bump: 2.5 });
defineMaterial("Westhills_FieldstoneDark", { map: "stone", tint: "#7d796f", bump: 2.5 });
defineMaterial("Westhills_Rubble", { map: "crag", tint: "#a39d90", bump: 3 });
defineMaterial("Westhills_Megalith", { map: "crag", tint: "#aaa598", bump: 3.5 });
defineMaterial("Westhills_MegalithDark", { map: "crag", tint: "#878278", bump: 3.5 });
defineMaterial("Westhills_Lichen", { map: "felt", tint: "#b9b58b", rough: 1 });
defineMaterial("Westhills_LichenGold", { map: "felt", tint: "#c4a466", rough: 1 });
defineMaterial("Westhills_Turf", { map: "thatch", tint: "#7a7244", bump: 2 });
defineMaterial("Westhills_TurfGreen", { map: "felt", tint: "#6f7d45", rough: 1, bump: 1.5 });
defineMaterial("Westhills_Peat", { map: "felt", tint: "#4d3b2d", rough: 1, bump: 1.5 });
defineMaterial("Westhills_Hay", { map: "thatch", tint: "#cfb46a", bump: 2 });
defineMaterial("Westhills_WoodOld", { map: "wood", tint: "#8c7c68", bump: 1.4 });
defineMaterial("Westhills_Dark", { tint: "#1f1a16", rough: 1 });
defineMaterial("Westhills_Smoke", { tint: "#c9c6c2", rough: 1, opacity: 0.35 });
defineMaterial("Westhills_CowCoat", { map: "felt", tint: "#b8642d", rough: 1, bump: 2.5 });
defineMaterial("Westhills_CowCoatDark", { map: "felt", tint: "#8e4a22", rough: 1, bump: 2.5 });
defineMaterial("Westhills_CowCoatLight", { map: "felt", tint: "#d39253", rough: 1, bump: 2.5 });
defineMaterial("Westhills_Horn", { map: "felt", tint: "#e4d6b6", rough: 0.55 });
defineMaterial("Westhills_HornTip", { map: "felt", tint: "#3b322b", rough: 0.5 });
defineMaterial("Westhills_Muzzle", { map: "felt", tint: "#3a2f2a", rough: 0.7 });
defineMaterial("Westhills_Eye", { tint: "#120e0c", rough: 0.25 });
// heather and gorse
defineMaterial("Westhills_HeatherCore", { map: "foliage", tint: "#4c3843", rough: 1, bump: 1.5 });
defineMaterial("Westhills_HeatherDark", { card: "tuft", tint: "#5f4458", rough: 0.9 });
defineMaterial("Westhills_HeatherMid", { card: "tuft", tint: "#87597e", rough: 0.85 });
defineMaterial("Westhills_HeatherLight", { card: "tuft", tint: "#b07ca8", rough: 0.8 });
defineMaterial("Westhills_GorseCore", { map: "foliage", tint: "#2d4526", rough: 1, bump: 1.5 });
defineMaterial("Westhills_GorseDark", { card: "needles", tint: "#2f4f29", rough: 0.9 });
defineMaterial("Westhills_GorseMid", { card: "needles", tint: "#466d33", rough: 0.85 });
defineMaterial("Westhills_GorseLight", { card: "needles", tint: "#6a9346", rough: 0.8 });
// the pines
defineMaterial("Westhills_PineBark", { map: "bark", tint: "#6b5141", bump: 3 });
defineMaterial("Westhills_PineBarkRed", { map: "bark", tint: "#a5653f", bump: 2.5 });
defineMaterial("Westhills_DeadWood", { map: "bark", tint: "#b3a690", bump: 2.5 });
// the terraces: paddy water, bunds, rice; the farmhouses, the shrine, the buffalo
defineMaterial("Westhills_PaddyWater", { tint: "#7ea4a6", rough: 0.12 });
defineMaterial("Westhills_Bund", { map: "adobe", tint: "#8b6d49", bump: 1.2 });
defineMaterial("Westhills_BundGrass", { map: "felt", tint: "#7f9c43", rough: 1 });
defineMaterial("Westhills_RiceCard", { card: "tuft", tint: "#97c656", rough: 0.8 });
defineMaterial("Westhills_RiceCardDark", { card: "tuft", tint: "#6fa03e", rough: 0.85 });
defineMaterial("Westhills_Whitewash", { map: "plaster", tint: "#efebe1", bump: 0.6 });
defineMaterial("Westhills_GreyBrick", { map: "brick", tint: "#8f8c87", bump: 1.5 });
defineMaterial("Westhills_TileGrey", { map: "tiles", tint: "#585c63", bump: 2.5 });
defineMaterial("Westhills_RidgeTile", { map: "plaster", tint: "#45484e", rough: 0.6, bump: 0.8 });
defineMaterial("Westhills_TileGreen", { map: "tiles", tint: "#4f7d5d", bump: 2.5, rough: 0.6 });
defineMaterial("Westhills_RidgeGreen", { map: "plaster", tint: "#3e6a4c", rough: 0.5, bump: 0.8 });
defineMaterial("Westhills_RedPaper", { map: "paper", tint: "#c43a2f", rough: 0.9 });
defineMaterial("Westhills_Lantern", { map: "paper", tint: "#d8402f", rough: 0.8, glow: "#ff5a2a", glowI: 0.6 });
defineMaterial("Westhills_Corn", { map: "felt", tint: "#e4b33c", rough: 0.9 });
defineMaterial("Westhills_Chili", { map: "felt", tint: "#b8322a", rough: 0.7 });
defineMaterial("Westhills_Fruit", { map: "felt", tint: "#e8862e", rough: 0.6 });
defineMaterial("Westhills_Skin", { map: "plaster", tint: "#e9c9a4", rough: 0.8 });
defineMaterial("Westhills_Incense", { tint: "#ff9a5a", rough: 1, glow: "#ff5a1a", glowI: 1.6 });
defineMaterial("Westhills_Straw", { map: "thatch", tint: "#c9ab63", bump: 2 });
defineMaterial("Westhills_StrawDark", { map: "thatch", tint: "#9c8349", bump: 2 });
defineMaterial("Westhills_ClothFaded", { map: "fabric", tint: "#6d87a2", rough: 0.95 });
defineMaterial("Westhills_Weave", { map: "thatch", tint: "#b39a63", bump: 1.5 });
defineMaterial("Westhills_Water", { tint: "#9ccbd8", rough: 0.08, opacity: 0.72 });
defineMaterial("Westhills_Mud", { map: "adobe", tint: "#6e5a43", bump: 1.2 });
defineMaterial("Westhills_MudWater", { tint: "#5b4936", rough: 0.15 });
defineMaterial("Westhills_BuffaloHide", { map: "felt", tint: "#56545b", rough: 0.85, bump: 1.5 });
defineMaterial("Westhills_BuffaloDark", { map: "felt", tint: "#3b393f", rough: 0.85, bump: 1.5 });
defineMaterial("Westhills_BuffaloHorn", { map: "bark", tint: "#4b4540", rough: 0.6, bump: 1.5 });
// the cape: the dragon's stone, its pearl and ghost fire; the wreck; the sea rocks and the spray
defineMaterial("Westhills_DragonStone", { map: "stone", tint: "#7d8883", bump: 2.5 });
defineMaterial("Westhills_DragonStoneDark", { map: "stone", tint: "#5a6461", bump: 2.5 });
defineMaterial("Westhills_DragonScale", { map: "crag", tint: "#617469", bump: 3 });
defineMaterial("Westhills_StoneTile", { map: "tiles", tint: "#646e6b", bump: 2.5 });
defineMaterial("Westhills_SeaMoss", { map: "felt", tint: "#4f6c4b", rough: 1 });
defineMaterial("Westhills_Pearl", { tint: "#c4f6ee", rough: 0.2, glow: "#5fe2d2", glowI: 1.6 });
defineMaterial("Westhills_GhostFire", { tint: "#a8f2ff", rough: 1, glow: "#3fd2ff", glowI: 2, opacity: 0.85 });
defineMaterial("Westhills_EyeGlow", { tint: "#ffd27a", rough: 0.3, glow: "#ffb030", glowI: 1.4 });
defineMaterial("Westhills_Ribbon", { map: "fabric", tint: "#a8312a", rough: 0.95 });
defineMaterial("Westhills_WreckWood", { map: "wood", tint: "#715f4c", bump: 1.6 });
defineMaterial("Westhills_WreckDark", { map: "wood", tint: "#463a2f", bump: 1.6 });
defineMaterial("Westhills_WreckPale", { map: "wood", tint: "#9b8c78", bump: 1.6 });
defineMaterial("Westhills_Sail", { map: "fabric", tint: "#cbbd9c", rough: 1 });
defineMaterial("Westhills_Barnacle", { map: "felt", tint: "#a3a092", rough: 1, bump: 2 });
defineMaterial("Westhills_Weed", { map: "felt", tint: "#3f5b33", rough: 0.8 });
defineMaterial("Westhills_BeaconStone", { map: "stone", tint: "#aba79c", bump: 2.5 });
defineMaterial("Westhills_Soot", { map: "felt", tint: "#2f2b29", rough: 1 });
defineMaterial("Westhills_SeaRock", { map: "crag", tint: "#5e6264", bump: 4 });
defineMaterial("Westhills_SeaRockWet", { map: "crag", tint: "#3c4043", rough: 0.4, bump: 4 });
defineMaterial("Westhills_Guano", { map: "felt", tint: "#e6e4da", rough: 1 });
defineMaterial("Westhills_Foam", { tint: "#f2f7f8", rough: 0.85, opacity: 0.88 });
defineMaterial("Westhills_Spray", { tint: "#e6f1f5", rough: 0.9, opacity: 0.42 });
// for the fields: the stormy sea, the cold tarn, the terraces' earthen banks
defineMaterial("Westhills_StormSea", { tint: "#2a5262", rough: 0.1, opacity: 0.93 });
defineMaterial("Westhills_TarnWater", { tint: "#36515b", rough: 0.08 });
defineMaterial("Westhills_TarnIce", { map: "ice", tint: "#d3e6ee", rough: 0.2, opacity: 0.9 });
defineMaterial("Westhills_TerraceBank", { map: "crag", tint: "#8f8a64", bump: 3 });
defineMaterial("Westhills_Stream", { tint: "#5d8d94", rough: 0.1, opacity: 0.92 });
defineMaterial("Westhills_CapeCliff", { map: "crag", tint: "#77756f", bump: 4 });

// ---- helpers ----
function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
const UP: V3 = [0, 0, 1];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => mul(a, 1 / (len(a) || 1));
const rad = (d: number) => (d * Math.PI) / 180;

// boxBounds with its corners in any order
function bb(a: V3, b: V3, mat: string, bevel = 0): Geo {
  return boxBounds([Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2])], [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])], mat, bevel);
}
// an ellipsoid of radii r about c
const ellipsoid = (r: V3, c: V3, mat: string, segs = 10): Geo => translate(scale(sphereCenter(1, [0, 0, 0], mat, segs), r), c);
// the same piece moved to its footprint's middle (x, y), left standing where it stands
function centre(g: Geo): Geo {
  const b = new THREE.Box3();
  for (const p of g) {
    p.geo.computeBoundingBox();
    b.union(p.geo.boundingBox!);
  }
  return translate(g, [-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0]);
}

// A grid of points (rows x cols) into triangles with smooth normals, each wound to face along
// `hint` (a direction, or a function of the triangle's middle).
type Hint = V3 | ((c: V3) => V3);
function surface(P: V3[][], UV: [number, number][][], mat: string, hint: Hint): Geo {
  const rows = P.length, cols = P[0].length;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) {
      pos.push(...P[i][j]);
      uv.push(...UV[i][j]);
    }
  for (let i = 0; i < rows - 1; i++)
    for (let j = 0; j < cols - 1; j++) {
      const a = i * cols + j, b = a + cols, c = b + 1, d = a + 1;
      for (const [p, q, r] of [[a, b, c], [a, c, d]]) {
        const A = P[Math.floor(p / cols)][p % cols], B = P[Math.floor(q / cols)][q % cols], C = P[Math.floor(r / cols)][r % cols];
        const n = cross(sub(B, A), sub(C, A));
        if (len(n) < 1e-6) continue;
        const h = typeof hint === "function" ? hint(mul(add(add(A, B), C), 1 / 3)) : hint;
        if (dot(n, h) >= 0) idx.push(p, q, r);
        else idx.push(p, r, q);
      }
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const nor = geo.getAttribute("normal");
  for (let i = 0; i < nor.count; i++)
    if (Math.abs(nor.getX(i)) + Math.abs(nor.getY(i)) + Math.abs(nor.getZ(i)) < 1e-4) {
      const h = norm(typeof hint === "function" ? hint([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]) : hint);
      nor.setXYZ(i, h[0], h[1], h[2]);
    }
  return [{ geo, mat }];
}

// A flat polygon fanned from `c`, facing along `hint`.
function fan(c: V3, ring: V3[], mat: string, hint: V3, uvOf: (p: V3) => [number, number], closed = false): Geo {
  const pos: number[] = [], uv: number[] = [];
  const n = ring.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const B = ring[i], C = ring[(i + 1) % n];
    const nn = cross(sub(B, c), sub(C, c));
    if (len(nn) < 1e-6) continue;
    for (const p of dot(nn, hint) >= 0 ? [c, B, C] : [c, C, B]) {
      pos.push(...p);
      uv.push(...uvOf(p));
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return [{ geo, mat }];
}

// A flat triangle seen from both sides (torn sails, tatters).
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

// An outline in the XZ plane (x, z) pushed out along Y from y0 to y1, flat shaded, its texture in
// metres across each face.
function prism(outline: [number, number][], y0: number, y1: number, mat: string): Geo {
  const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, z)));
  let geo: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false, curveSegments: 2 });
  geo.rotateX(Math.PI / 2); // shape y -> z, the extrusion toward -y
  geo.translate(0, y1, 0);
  geo = geo.index ? geo.toNonIndexed() : geo;
  geo.deleteAttribute("normal");
  geo.computeVertexNormals();
  const P = geo.getAttribute("position"), N = geo.getAttribute("normal"), uv = new Float32Array(P.count * 2);
  for (let i = 0; i < P.count; i++) {
    const ax = Math.abs(N.getX(i)), ay = Math.abs(N.getY(i)), az = Math.abs(N.getZ(i));
    const [u, v] = ax >= ay && ax >= az ? [P.getY(i), P.getZ(i)] : ay >= az ? [P.getX(i), P.getZ(i)] : [P.getY(i), P.getX(i)];
    uv[i * 2] = u / 100;
    uv[i * 2 + 1] = v / 100;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return [{ geo, mat }];
}

// A rectangular section (w across, h up) swept along a path: curved beams, verges, rails.
function sweep(path: V3[], w: number, h: number, mat: string): Geo {
  const n = path.length;
  const T = path.map((_, i) => norm(sub(path[Math.min(n - 1, i + 1)], path[Math.max(0, i - 1)])));
  const S = T.map((t) => {
    let s = cross(t, UP);
    if (len(s) < 1e-4) s = cross(t, [0, 1, 0]);
    return norm(s);
  });
  const N = T.map((t, i) => cross(S[i], t));
  const L: number[] = [0];
  for (let i = 1; i < n; i++) L.push(L[i - 1] + len(sub(path[i], path[i - 1])));
  const C = (i: number, a: number, b: number): V3 => add(path[i], add(mul(S[i], (a * w) / 2), mul(N[i], (b * h) / 2)));
  const nearest = (c: V3): V3 => {
    let best = path[0], bd = Infinity;
    for (const p of path) {
      const d = len(sub(c, p));
      if (d < bd) [best, bd] = [p, d];
    }
    return sub(c, best);
  };
  const out: Geo[] = [];
  for (const [a0, b0, a1, b1, span] of [[-1, -1, 1, -1, w], [1, -1, 1, 1, h], [1, 1, -1, 1, w], [-1, 1, -1, -1, h]]) {
    const P = path.map((_, i): V3[] => [C(i, a0, b0), C(i, a1, b1)]);
    const UV = L.map((l): [number, number][] => [[l / 100, 0], [l / 100, span / 100]]);
    out.push(surface(P, UV, mat, nearest));
  }
  for (const [i, s] of [[0, -1], [n - 1, 1]]) {
    const ring = [C(i, -1, -1), C(i, 1, -1), C(i, 1, 1), C(i, -1, 1)];
    out.push(fan(path[i], ring, mat, mul(T[i], s), (p) => [dot(p, S[i]) / 100, dot(p, N[i]) / 100], true));
  }
  return merge(...out);
}

// A solid of revolution about +Z from a (radius, height) profile.
function lathe(prof: [number, number][], segs: number, mat: string, at: V3 = [0, 0, 0]): Geo {
  const geo = new THREE.LatheGeometry(prof.map(([r, z]) => new THREE.Vector2(r, z)), segs);
  geo.rotateX(Math.PI / 2);
  const rmax = Math.max(...prof.map((p) => p[0]));
  let plen = 0;
  for (let i = 1; i < prof.length; i++) plen += Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]);
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * Math.PI * 2 * rmax) / 100, (uv.getY(i) * plen) / 100);
  geo.translate(...at);
  return [{ geo, mat }];
}

// ---- a Chinese roof: ridge along Y ----
// Each slope curves (flat at the eave, steep at the ridge); the eaves turn up and out toward the
// corners. hx, hy: the eaves' half extent across and along the ridge; z: the eave's height; h: the
// rise to the ridge. The gable ends are filled (`gable`) between the walls (`wall`: their half
// extent across, `wallY` where the gables stand) and the roof's underside.
interface RoofSpec {
  hx: number; hy: number; z: number; h: number;
  tile: string; ridge: string; under?: string; edge?: string;
  gable?: string; wall?: number; wallY?: number; wallZ?: number;
  th?: number; curve?: number; lift?: number; flare?: number; reach?: number;
  curls?: boolean; pearl?: string;
}
function cnRoof(r: RoofSpec): Geo {
  const th = r.th ?? 16, curve = r.curve ?? 1.7, lift = r.lift ?? 34, flare = r.flare ?? 18, reach = r.reach ?? Math.min(r.hx, r.hy) * 0.95;
  const under = r.under ?? "WoodDark", edge = r.edge ?? "WoodDark";
  const turn = (t: number, d: number) => {
    const a = Math.max(0, 1 - d / reach);
    return a * a * (1 - t) * (1 - t);
  };
  const P = (sx: number, t: number, s: number): V3 => {
    const w = turn(t, (1 - Math.abs(s)) * r.hy), sg = Math.sign(s);
    return [sx * r.hx * (1 - t) + sx * flare * w, s * r.hy + sg * flare * 0.7 * w, r.z + r.h * Math.pow(t, curve) + lift * w];
  };
  const nt = 8, ns = 14;
  const ts = Array.from({ length: nt + 1 }, (_, k) => Math.pow(k / nt, 1.15));
  const ss = Array.from({ length: ns + 1 }, (_, j) => {
    const u = -1 + (2 * j) / ns;
    return Math.sign(u) * (1 - Math.pow(1 - Math.abs(u), 1.6));
  });
  const out: Geo[] = [];
  const down: V3 = [0, 0, -th];
  for (const sx of [-1, 1]) {
    const top = ts.map((t) => ss.map((s) => P(sx, t, s)));
    const vl = top.map(() => ss.map(() => 0));
    for (let i = ts.length - 2; i >= 0; i--) for (let j = 0; j < ss.length; j++) vl[i][j] = vl[i + 1][j] + len(sub(top[i + 1][j], top[i][j]));
    out.push(surface(top, top.map((row, i) => row.map((p, j): [number, number] => [(p[1] / 100) * 0.75, vl[i][j] / 100])), r.tile, UP));
    const bot = top.map((row) => row.map((p) => add(p, down)));
    out.push(surface(bot, top.map((row, i) => row.map((p, j): [number, number] => [vl[i][j] / 100, p[1] / 100])), under, [0, 0, -1]));
    // the eave's edge and the verges
    out.push(surface([top[0], bot[0]], [top[0].map((p): [number, number] => [p[1] / 100, 0]), top[0].map((p): [number, number] => [p[1] / 100, th / 100])], edge, [sx, 0, 0]));
    for (const j of [0, ss.length - 1]) {
      const a = top.map((row) => row[j]), b = bot.map((row) => row[j]);
      out.push(surface([a, b], [a.map((p): [number, number] => [p[0] / 100, 0]), a.map((p): [number, number] => [p[0] / 100, th / 100])], edge, [0, j === 0 ? -1 : 1, 0]));
    }
    // tiled verge ridges down each gable edge, and a little horn at each corner
    for (const sy of [-1, 1]) {
      const k = 1 - 10 / r.hy;
      out.push(sweep(ts.map((t) => add(P(sx, t, sy * k), [0, 0, 6])), 13, 11, r.ridge));
      const c = P(sx, 0, sy);
      out.push(limb([add(P(sx, 0.06, sy * 0.9), [0, 0, 4]), add(c, [sx * 4, sy * 4, 8]), add(c, [sx * 12, sy * 12, 30])], 7, 2.2, r.ridge, { seg: 5 }));
    }
  }
  // the ridge, its ends curling up
  const zr = r.z + r.h;
  out.push(bb([-13, -r.hy + 8, zr - 10], [13, r.hy - 8, zr + 14], r.ridge, 3));
  if (r.curls !== false)
    for (const sy of [-1, 1])
      out.push(limb([[0, sy * (r.hy - 26), zr + 6], [0, sy * (r.hy + 2), zr + 18], [0, sy * (r.hy + 12), zr + 42], [0, sy * (r.hy - 4), zr + 60]], 10, 3.5, r.ridge, { seg: 6 }));
  if (r.pearl) out.push(sphereCenter(16, [0, 0, zr + 30], r.pearl, 10), cylinderAt({ rBot: 10, rTop: 6, height: 16, segments: 8, bottom: [0, 0, zr + 6] }, r.ridge));
  // the gables, between the walls' top and the roof's underside
  if (r.gable) {
    const wall = r.wall ?? r.hx * 0.8, zb = r.wallZ ?? r.z;
    for (const sy of [-1, 1]) {
      const yg = sy * (r.wallY ?? r.hy * 0.85);
      const half: [number, number][] = [];
      for (let k = 0; k <= 16; k++) {
        const t = k / 16, p = P(-1, t, (sy * (r.wallY ?? r.hy * 0.85)) / r.hy);
        if (-p[0] <= wall) half.push([p[0], Math.max(zb, p[2] - th - 2)]);
      }
      const ring: V3[] = [[-wall, yg, zb], ...half.map(([x, z]): V3 => [x, yg, z]), ...half.slice(0, -1).reverse().map(([x, z]): V3 => [-x, yg, z]), [wall, yg, zb]];
      out.push(fan([0, yg, zb], ring, r.gable, [0, sy, 0], (p) => [p[0] / 100, p[2] / 100]));
    }
  }
  return merge(...out);
}

// ================================================================================================
// ---- the highland downs ----
// ================================================================================================

// A dry-stone wall `L` long along Y and `H` high: a battered core of field stone sunk 45 cm into
// the ground (so it never floats where the hill falls away under one end), stones standing proud
// of both faces, and the coping on top (stones on edge, leaning this way and that), snow on them.
function stoneWall(L: number, H: number, seed: number, snow = true): Geo {
  const rnd = seeded(seed), P: Geo[] = [];
  const bw = 37, tw = 25;
  P.push(prism([[-bw, -45], [bw, -45], [tw, H], [-tw, H]], -L / 2 - 5, L / 2 + 5, "Westhills_Fieldstone"));
  for (const s of [-1, 1])
    for (let k = 0; k < Math.round(L / 26); k++) {
      const y = -L / 2 + 18 + rnd() * (L - 36), z = 6 + rnd() * (H - 28);
      const xf = bw + ((tw - bw) * z) / H;
      const w = 24 + rnd() * 34, h = 13 + rnd() * 14;
      P.push(translate(rotateX(box([10, w, h], [0, 0, 0], rnd() < 0.45 ? "Westhills_FieldstoneDark" : "Westhills_Rubble", 3.5), (rnd() - 0.5) * 16), [s * (xf + 1.5), y, z]));
    }
  // a through-stone or two, poking out of both faces
  for (let k = 0; k < Math.max(1, Math.round(L / 220)); k++) {
    const y = -L / 2 + 60 + rnd() * (L - 120), z = H * (0.35 + rnd() * 0.2);
    P.push(bb([-bw - 8, y - 15, z], [bw + 8, y + 15, z + 16], "Westhills_FieldstoneDark", 3));
  }
  const cope: Geo[] = [];
  for (let y = -L / 2 + 9; y < L / 2 - 6; y += 18 + rnd() * 6) {
    const h = 20 + rnd() * 12, t = 10 + rnd() * 5;
    cope.push(translate(rotateX(box([2 * tw + 8, t, h], [0, 0, h / 2 - 5], rnd() < 0.5 ? "Westhills_FieldstoneDark" : "Westhills_Fieldstone", 3), (rnd() - 0.5) * 18), [(rnd() - 0.5) * 4, y, H]));
  }
  P.push(...cope);
  if (snow) P.push(coverTop(merge(...cope), "Snow", { amount: 0.42, thick: 3.5, seed, ragged: 0.2 }));
  return merge(...P);
}

// The stone circle: thirteen standing stones round a ring 11 m across, a gap at the front (-X)
// between two taller portal stones, a trilithon at the back, one stone fallen and one broken; the
// recumbent altar stone in the middle; a heel stone out before the entrance; a low turf bank all
// round. Snow lies on their heads, lichen on their sides.
interface Stone { x: number; y: number; a: number; w: number; d: number; h: number; seed: number; tilt: number; mat: string }
const CIRCLE_R = 540;
const RING: Stone[] = (() => {
  const rnd = seeded(907), out: Stone[] = [];
  for (let i = 0; i < 15; i++) {
    const deg = 180 + 12 + (i * (360 - 24)) / 14; // from just past the entrance round to just before it
    const a = rad(deg), portal = i === 0 || i === 14, back = i === 7;
    if (back) continue; // the trilithon stands there
    const h = portal ? 330 : 210 + rnd() * 100;
    out.push({ x: Math.cos(a) * CIRCLE_R, y: Math.sin(a) * CIRCLE_R, a: deg, w: 82 + rnd() * 38, d: 46 + rnd() * 16, h, seed: 911 + i * 13, tilt: (rnd() - 0.5) * 7, mat: rnd() < 0.35 ? "Westhills_MegalithDark" : "Westhills_Megalith" });
  }
  return out;
})();
// where the circle's stones stand (x, y, solid radius), for the fields
export const CIRCLE_STONES: [number, number, number][] = [
  ...RING.map((s): [number, number, number] => [s.x, s.y, Math.max(s.w, s.d) * 0.55]),
  [CIRCLE_R, -95, 60], [CIRCLE_R, 95, 60], // the trilithon
  [0, 0, 120], // the altar
  [-CIRCLE_R - 300, 40, 55], // the heel stone
];
// A standing stone: a slab w wide, d thick and about h tall, its outline worn irregular (broad at
// the foot, its head rounded off to one side), its faces split along the grain, sunk 20 cm.
function slab(w: number, d: number, h: number, seed: number, mat: string): Geo {
  const rnd = seeded(seed), hw = w / 2;
  const lean = (rnd() - 0.5) * 0.3;
  const out: [number, number][] = [[-hw * 1.05, -20], [hw * 1.05, -20], [hw * (0.92 + rnd() * 0.08), h * 0.35], [hw * (0.8 + rnd() * 0.12), h * (0.7 + rnd() * 0.08)],
    [hw * (0.45 + lean), h * (0.93 + rnd() * 0.05)], [hw * lean * 0.5, h], [-hw * (0.45 - lean), h * (0.9 + rnd() * 0.06)], [-hw * (0.82 + rnd() * 0.1), h * (0.66 + rnd() * 0.1)], [-hw * (0.95 + rnd() * 0.05), h * 0.3]];
  const g = prism(out, -d / 2, d / 2, mat);
  // a flake standing proud of one face
  const chip = translate(prism([[-hw * 0.4, h * 0.45], [hw * 0.3, h * 0.5], [hw * 0.1, h * 0.85], [-hw * 0.35, h * 0.8]], -4, 4, mat), [(rnd() - 0.5) * hw * 0.4, d / 2 - 1, 0]);
  return merge(g, chip);
}
function stoneCircle(): Geo {
  const P: Geo[] = [];
  const cover = (g: Geo, seed: number) => merge(g, coverTop(g, "Snow", { amount: 0.18, thick: 4, seed, ragged: 0.25 }), coverTop(g, "Westhills_Lichen", { amount: 0.95, thick: 1.2, seed: seed + 1, patches: 0.4 }), coverTop(g, "Westhills_LichenGold", { amount: 0.95, thick: 1.4, seed: seed + 2, patches: 0.18 }));
  const stand = (s: Stone, g: Geo) => translate(rotateZ(rotateY(g, s.tilt), s.a + 90), [s.x, s.y, 0]);
  for (const s of RING) P.push(stand(s, cover(slab(s.w, s.d, s.h, s.seed, s.mat), s.seed)));
  // the trilithon at the back: two uprights and a lintel
  for (const y of [-95, 95]) P.push(translate(rotateZ(cover(slab(66, 56, 335, 990 + y, "Westhills_Megalith"), 991 + y), 90), [CIRCLE_R, y, 0]));
  const lintel = translate(rotateZ(rock([290, 70, 60], 0.15, 997, "Westhills_MegalithDark", true), 90), [CIRCLE_R, 0, 300]);
  P.push(lintel, coverTop(lintel, "Snow", { amount: 0.5, thick: 4, seed: 998 }));
  // one fallen outside the ring, one broken off short
  const fallen = translate(rotateZ(rotateY(rock([90, 52, 260], 0.22, 1003, "Westhills_Megalith"), 90), 25), [Math.cos(rad(115)) * 780, Math.sin(rad(115)) * 780, 30]);
  P.push(fallen, coverTop(fallen, "Snow", { amount: 0.4, thick: 3, seed: 1004 }), coverTop(fallen, "Westhills_LichenGold", { amount: 0.6, thick: 1.4, seed: 1005, patches: 0.4 }));
  P.push(translate(cover(slab(95, 60, 110, 1007, "Westhills_MegalithDark"), 1008), [Math.cos(rad(250)) * (CIRCLE_R + 90), Math.sin(rad(250)) * (CIRCLE_R + 90), 0]));
  // the altar: a long stone on two low ones, offerings of pebbles and a ring of small stones
  for (const y of [-70, 70]) P.push(translate(rock([60, 50, 50], 0.25, 1011 + y, "Westhills_MegalithDark"), [0, y, -6]));
  const altar = translate(rock([110, 230, 60], 0.14, 1017, "Westhills_Megalith", true), [0, 0, 32]);
  P.push(altar, coverTop(altar, "Snow", { amount: 0.4, thick: 3, seed: 1018 }));
  const rnd = seeded(1021);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    P.push(translate(rock([26 + rnd() * 14, 22 + rnd() * 12, 18 + rnd() * 8], 0.3, 1030 + i, "Westhills_Rubble"), [Math.cos(a) * 230, Math.sin(a) * 230, -3]));
  }
  for (let i = 0; i < 5; i++) P.push(sphereCenter(5 + rnd() * 3, [-20 + rnd() * 40, -60 + rnd() * 120, 70], i % 2 ? "StoneWhite" : "Westhills_Lichen", 6));
  // the heel stone
  P.push(translate(rotateY(cover(slab(84, 60, 250, 1041, "Westhills_MegalithDark"), 1042), -9), [-CIRCLE_R - 300, 40, 0]));
  return merge(...P);
}

// A dry-stone wall, 3 m along Y (tiles end to end), 1 m high.
const drystoneWall = (): Geo => stoneWall(300, 98, 1101);

// The shepherd's bothy: a low hut of rubble stone, its thatch held down by ropes weighted with
// stones over the ridge (snow on it), stone gables, a chimney at the +Y end with a thread of
// smoke; a plank door and a little window at the front (-X), a peat stack, a water butt, a log
// to sit on, the shepherd's crook against the wall.
function shepherdBothy(): Geo {
  const P: Geo[] = [];
  const hx = 220, hy = 310, zw = 210, rh = 190, ov = 40;
  const S = "Westhills_Fieldstone", D = "Westhills_FieldstoneDark";
  P.push(bb([-hx - 14, -hy - 14, -20], [hx + 14, hy + 14, 18], D, 4));
  P.push(bb([-hx, -hy, 0], [hx, hy, zw], S, 4));
  // quoins and a few bigger stones in the walls
  const rnd = seeded(1201);
  for (const x of [-hx, hx])
    for (const y of [-hy, hy])
      for (let z = 10, i = 0; z < zw - 20; z += 42, i++) P.push(box([i % 2 ? 34 : 26, i % 2 ? 26 : 34, 34], [x + Math.sign(x) * 3, y + Math.sign(y) * 3, z + 17], D, 3));
  for (let k = 0; k < 26; k++) {
    const side = k % 4, z = 20 + rnd() * (zw - 50), t = (rnd() - 0.5) * 2;
    const at: V3 = side < 2 ? [side ? hx + 2 : -hx - 2, t * (hy - 40), z] : [t * (hx - 40), side === 2 ? -hy - 2 : hy + 2, z];
    P.push(box(side < 2 ? [8, 30 + rnd() * 30, 16 + rnd() * 10] : [30 + rnd() * 30, 8, 16 + rnd() * 10], at, rnd() < 0.5 ? D : "Westhills_Rubble", 3));
  }
  // the gables
  for (const s of [-1, 1]) P.push(prism([[-hx, zw - 2], [hx, zw - 2], [0, zw + rh * 0.95]], s > 0 ? hy - 46 : -hy, s > 0 ? hy : -hy + 46, S));
  // the thatch, its rolled ridge, the snow on it
  const roof = rotateZ(merge(...[-1, 1].map((s) => {
    const ang = Math.atan2(rh, hx), slope = (hx + ov) / Math.cos(ang);
    return translate(rotateX(box([2 * hy + 30, slope, 30], [0, (s * slope) / 2, 15], "Westhills_Turf", 6), (-s * ang * 180) / Math.PI), [0, 0, zw + rh]);
  })), 90);
  P.push(roof, coverTop(roof, "Snow", { amount: 0.75, thick: 5, seed: 1203, ragged: 0.45, patches: 0.55 }));
  P.push(cylinderBetween([0, -hy - 20, zw + rh + 26], [0, hy + 20, zw + rh + 26], 22, 8, "Westhills_Turf"));
  // ropes over the ridge, a stone hanging at each end
  const surf = (x: number) => zw + rh * (1 - Math.abs(x) / hx) + 30 / Math.cos(Math.atan2(rh, hx)) + 2;
  for (let y = -hy + 40; y <= hy - 40; y += 96) {
    const pts: V3[] = [[-hx - ov + 6, y, surf(hx + ov - 6)], [-hx * 0.5, y, surf(hx * 0.5)], [0, y, surf(0) + 14], [hx * 0.5, y, surf(hx * 0.5)], [hx + ov - 6, y, surf(hx + ov - 6)]];
    for (let i = 0; i + 1 < pts.length; i++) P.push(cylinderBetween(pts[i], pts[i + 1], 2.2, 5, "RopeTan"));
    for (const s of [-1, 1]) {
      const e: V3 = [s * (hx + ov - 6), y, surf(hx + ov - 6)];
      P.push(cylinderBetween(e, [e[0] + s * 4, y, e[2] - 50], 2, 5, "RopeTan"), translate(rock([30, 26, 26], 0.3, 1210 + y, "Westhills_FieldstoneDark"), [e[0] + s * 6, y, e[2] - 72]));
    }
  }
  // the chimney on the +Y gable, its smoke
  P.push(bb([-36, hy - 60, zw + 120], [36, hy + 4, zw + rh + 90], D, 3), bb([-44, hy - 68, zw + rh + 90], [44, hy + 12, zw + rh + 102], S, 3));
  P.push(cylinderAt({ radius: 13, height: 16, segments: 8, bottom: [0, hy - 28, zw + rh + 102] }, "Westhills_Dark"));
  for (const [dx, dy, dz, r] of [[0, 0, 140, 20], [10, 8, 175, 26], [24, 20, 214, 32], [44, 34, 258, 38]] as const) P.push(ellipsoid([r, r * 0.9, r * 0.8], [dx, hy - 28 + dy, zw + rh + dz], "Westhills_Smoke", 8));
  // the door, its lintel stone and frame; the window and its shutter
  P.push(bb([-hx - 6, -60, 0], [-hx + 4, 60, 170], "Westhills_WoodOld"), bb([-hx - 9, -50, 4], [-hx - 3, 50, 164], "DoorWood", 1));
  for (const z of [30, 140]) P.push(bb([-hx - 12, -46, z], [-hx - 8, 46, z + 9], "IronDark"));
  P.push(bb([-hx - 14, -80, 168], [-hx + 6, 80, 196], D, 3));
  P.push(bb([-hx - 5, 130, 110], [-hx + 3, 196, 160], "GlassBlue"), bb([-hx - 8, 124, 104], [-hx - 2, 202, 112], "Westhills_WoodOld"), bb([-hx - 8, 124, 158], [-hx - 2, 202, 166], "Westhills_WoodOld"));
  P.push(translate(rotateZ(bb([-3, 0, 108], [3, 62, 162], "Westhills_WoodOld"), -40), [-hx - 6, 202, 0]));
  P.push(bb([hx - 3, -160, 110], [hx + 5, -110, 150], "Westhills_Dark"), bb([hx + 2, -168, 104], [hx + 7, -102, 110], "Westhills_WoodOld"));
  P.push(bb([-hx - 40, -70, 0], [-hx - 2, 70, 10], D, 2));
  // the peat stack by the -Y end: bricks of peat, a thatch cap
  const peat: Geo[] = [];
  for (let z = 0, row = 0; row < 6; row++, z += 18) {
    const n = 6 - row;
    for (let i = 0; i < n; i++) peat.push(box([34, 22, 16], [-60 + i * 22 - n * 11 + 66, -hy - 80, z + 8], "Westhills_Peat", 2));
  }
  P.push(...peat, translate(scale(sphereCenter(1, [0, 0, 0], "Westhills_Turf", 8), [80, 40, 22]), [-24, -hy - 80, 108]));
  // a water butt, a log seat, the crook
  P.push(cylinderAt({ rBot: 30, rTop: 33, height: 80, segments: 12, bottom: [-hx - 50, 220, 0] }, "Westhills_WoodOld"), cylinderAt({ radius: 31, height: 4, segments: 12, bottom: [-hx - 50, 220, 74] }, "Westhills_TarnWater"));
  for (const z of [16, 64]) P.push(translate(torus(32, 2.5, 14, 4, "IronDark"), [-hx - 50, 220, z]));
  P.push(cylinderBetween([-hx - 46, -160, 22], [-hx - 46, -30, 22], 20, 8, "Westhills_PineBark"));
  P.push(cylinderBetween([-hx - 6, 90, 0], [-hx - 18, 100, 160], 2.5, 5, "Westhills_WoodOld"), limb([[-hx - 18, 100, 160], [-hx - 22, 102, 176], [-hx - 14, 104, 184], [-hx - 8, 104, 176]], 2.5, 2, "Westhills_WoodOld", { seg: 5 }));
  return centre(merge(...P));
}

// The cattle fold: dry-stone walls round a yard 8.6 x 6.8 m, a wide gap at the front (-X) between
// two gateposts with the five-bar gate swung open, a hay rack and a stone trough with a skin of
// ice, a lean-to of turf against the back wall, straw on the trodden ground.
function cattlePen(): Geo {
  const P: Geo[] = [];
  const hx = 430, hy = 340, H = 100, gap = 130;
  P.push(translate(stoneWall(2 * hy + 70, H, 1301), [hx, 0, 0]));
  for (const s of [-1, 1]) P.push(translate(rotateZ(stoneWall(2 * hx + 70, H, 1303 + s), 90), [0, s * hy, 0]));
  for (const s of [-1, 1]) P.push(translate(stoneWall(hy - gap, H, 1307 + s), [-hx, s * (gap + (hy - gap) / 2), 0]));
  // gateposts and the gate, open into the yard
  for (const s of [-1, 1]) P.push(bb([-hx - 24, s * gap - 22, -20], [-hx + 24, s * gap + 22, 140], "Westhills_FieldstoneDark", 4), bb([-hx - 28, s * gap - 26, 140], [-hx + 28, s * gap + 26, 152], "Westhills_Fieldstone", 3));
  const gate: Geo[] = [];
  const W = "Westhills_WoodOld";
  for (const y of [8, 240]) gate.push(bb([-6, y - 7, 10], [6, y + 7, 128], W, 1));
  for (let k = 0; k < 5; k++) gate.push(bb([-4, 4, 20 + k * 25], [4, 244, 30 + k * 25], W, 1));
  gate.push(beamBetween([0, 12, 22], [0, 236, 122], 6, 9, W));
  for (const z of [30, 118]) gate.push(bb([-6, -4, z], [6, 14, z + 6], "IronDark"));
  P.push(translate(rotateZ(merge(...gate), -70), [-hx + 26, -gap, 0]));
  // the hay rack
  const rack: Geo[] = [];
  for (const x of [-60, 60]) for (const y of [-90, 90]) rack.push(cylinderBetween([x, y, 0], [x * 1.25, y, 150], 5, 6, W));
  for (const s of [-1, 1]) rack.push(cylinderBetween([s * 75, -100, 150], [s * 75, 100, 150], 5, 6, W), cylinderBetween([s * 20, -100, 70], [s * 20, 100, 70], 5, 6, W));
  for (let y = -84; y <= 84; y += 21) for (const s of [-1, 1]) rack.push(cylinderBetween([s * 18, y, 70], [s * 72, y, 150], 2.4, 5, W));
  rack.push(translate(lump([0, 0, 0], [60, 95, 40], 1311, "Westhills_Hay", 1, 0.2), [0, 0, 140]));
  P.push(translate(merge(...rack), [120, -40, 0]));
  // the trough
  P.push(bb([-170, 160, 0], [-30, 230, 50], "Westhills_FieldstoneDark", 4), bb([-160, 170, 48], [-40, 220, 51], "Westhills_TarnIce"));
  // the lean-to against the back wall
  for (const y of [-280, -60]) P.push(cylinderBetween([250, y, 0], [250, y, 165], 7, 6, W));
  const lean = merge(beamBetween([255, -300, 168], [255, -40, 168], 10, 12, W), translate(rotateY(bb([0, -310, 0], [200, -30, 26], "Westhills_Turf", 5), -18), [236, 0, 160]));
  P.push(lean, coverTop(lean, "Snow", { amount: 0.7, thick: 5, seed: 1315 }));
  // straw and hay on the ground
  const rnd = seeded(1317);
  for (let k = 0; k < 7; k++) P.push(translate(scale(sphereCenter(1, [0, 0, 0], k % 2 ? "Westhills_Hay" : "Westhills_StrawDark", 8), [50 + rnd() * 50, 40 + rnd() * 40, 6]), [-280 + rnd() * 600, -260 + rnd() * 500, 0]));
  return merge(...P);
}

// A four-legged beast (the cattle, the buffalo): a heavy body of three masses, the neck and head
// forward (-X), legs, a tail. The coat's materials, its horns and how shaggy it is are the
// caller's.
interface Beast {
  len: number; h: number; seed: number;
  coat: string; dark: string; light: string; leg: string; hoof: string; muzzle: string;
  headZ: number; headX: number; shag: number;
  horns: (head: V3) => Geo;
  extra?: (head: V3) => Geo;
}
function beast(b: Beast): Geo {
  const P: Geo[] = [], L = b.len, H = b.h, rnd = seeded(b.seed);
  const body = merge(
    lump([0, 0, H * 0.66], [L * 0.36, L * 0.19, H * 0.27], b.seed, b.coat, 1, 0.1 + b.shag),
    lump([-L * 0.2, 0, H * 0.7], [L * 0.2, L * 0.2, H * 0.31], b.seed + 1, b.coat, 1, 0.1 + b.shag),
    lump([L * 0.24, 0, H * 0.67], [L * 0.18, L * 0.18, H * 0.27], b.seed + 2, b.coat, 1, 0.1 + b.shag),
  );
  P.push(body);
  // legs: coat above, bare below, hooves
  for (const [x, y] of [[-L * 0.25, -L * 0.1], [-L * 0.25, L * 0.1], [L * 0.27, -L * 0.095], [L * 0.27, L * 0.095]]) {
    P.push(limb([[x, y, H * 0.6], [x + 2, y, H * 0.32], [x, y, 9]], L * 0.055, L * 0.034, b.leg, { seg: 7 }));
    P.push(lump([x, y, H * 0.42], [L * 0.07, L * 0.065, H * 0.17], b.seed + 5 + Math.round(x + y), b.coat, 0, 0.12 + b.shag));
    P.push(cylinderAt({ rBot: L * 0.036, rTop: L * 0.032, height: 10, segments: 7, bottom: [x, y, 0] }, b.hoof));
  }
  // the neck and head
  const head: V3 = [b.headX, 0, b.headZ];
  P.push(lump([-L * 0.38, 0, (H * 0.72 + b.headZ) / 2 + 6], [L * 0.14, L * 0.13, H * 0.2], b.seed + 3, b.coat, 1, 0.1 + b.shag));
  P.push(lump(head, [L * 0.12, L * 0.085, H * 0.12], b.seed + 4, b.coat, 1, 0.08));
  P.push(ellipsoid([L * 0.06, L * 0.065, H * 0.08], add(head, [-L * 0.1, 0, -H * 0.05]), b.muzzle, 10));
  for (const s of [-1, 1]) {
    P.push(sphereCenter(L * 0.013, add(head, [-L * 0.15, s * L * 0.025, -H * 0.04]), "Westhills_Eye", 6));
    P.push(sphereCenter(L * 0.016, add(head, [-L * 0.04, s * L * 0.072, H * 0.03]), "Westhills_Eye", 6));
    P.push(ellipsoid([L * 0.035, L * 0.06, H * 0.03], add(head, [L * 0.02, s * L * 0.11, H * 0.05]), b.dark, 8));
  }
  P.push(b.horns(head));
  // the tail and its tuft
  P.push(limb([[L * 0.42, 0, H * 0.8], [L * 0.47, 2, H * 0.6], [L * 0.46, 3, H * 0.32]], L * 0.018, L * 0.012, b.dark, { seg: 5 }), lump([L * 0.46, 3, H * 0.27], [L * 0.03, L * 0.03, H * 0.07], b.seed + 9, b.dark, 0, 0.2));
  // the shaggy ones: the coat hanging in a fringe under the belly
  if (b.shag > 0.05)
    for (const s of [-1, 1])
      for (let k = 0; k < 9; k++) {
        const x = -L * 0.3 + (k / 8) * L * 0.6, y = s * L * (0.15 + rnd() * 0.02);
        P.push(cylinderAt({ rBot: L * 0.035, rTop: L * 0.012, height: H * (0.16 + rnd() * 0.07), segments: 5, bottom: [x, y, H * 0.42] }, k % 2 ? b.dark : b.coat).map((p) => ({ geo: p.geo.rotateX(Math.PI).translate(0, 2 * y, 2 * H * 0.42 + H * 0.1), mat: p.mat })));
      }
  if (b.extra) P.push(b.extra(head));
  return merge(...P);
}

// A highland cow: shaggy ginger coat (a dusting of snow along her back), a fringe over her eyes,
// long pale horns sweeping out and up.
function highlandCow(): Geo {
  const L = 220, H = 140;
  const g = beast({
    len: L, h: H, seed: 1401, coat: "Westhills_CowCoat", dark: "Westhills_CowCoatDark", light: "Westhills_CowCoatLight", leg: "Westhills_CowCoatDark",
    hoof: "Westhills_Muzzle", muzzle: "Westhills_Muzzle", headX: -L * 0.5, headZ: H * 0.68, shag: 0.14,
    horns: (h) => merge(...[-1, 1].map((s) => merge(
      limb([add(h, [L * 0.02, s * L * 0.05, H * 0.08]), add(h, [L * 0.0, s * L * 0.17, H * 0.1]), add(h, [-L * 0.04, s * L * 0.26, H * 0.2]), add(h, [-L * 0.02, s * L * 0.3, H * 0.32])], 6.5, 2.4, "Westhills_Horn", { seg: 7 }),
      limb([add(h, [-L * 0.03, s * L * 0.28, H * 0.27]), add(h, [-L * 0.02, s * L * 0.3, H * 0.32]), add(h, [-L * 0.005, s * L * 0.305, H * 0.37])], 2.6, 0.6, "Westhills_HornTip", { seg: 5 }),
    ))),
    extra: (h) => {
      // the fringe: locks hanging forward over the eyes
      const rnd = seeded(1407), out: Geo[] = [];
      for (let k = 0; k < 11; k++) {
        const y = (k / 10 - 0.5) * L * 0.14, base = add(h, [-L * 0.06, y, H * 0.12]);
        out.push(limb([base, add(base, [-L * 0.05, y * 0.2, -H * 0.02]), add(base, [-L * 0.085 - rnd() * 6, y * 0.35, -H * (0.1 + rnd() * 0.05)])], 5.5, 1.2, k % 3 ? "Westhills_CowCoatLight" : "Westhills_CowCoat", { seg: 5 }));
      }
      return merge(...out);
    },
  });
  // snow settled along the back
  return merge(g, coverTop([g[0], g[1], g[2]], "Snow", { amount: 0.16, thick: 2.5, seed: 1409, patches: 0.6 }));
}

// Heather: a low cushion of purple, a hand high, spreading wide.
const HEATHER: ShrubLook = { core: "Westhills_HeatherCore", dark: "Westhills_HeatherDark", mid: "Westhills_HeatherMid", light: "Westhills_HeatherLight" };
function heather(): Geo {
  const cards = new Cards();
  const lobes: [number, number, number, number, number, number][] = [[0, 0, 16, 44, 36, 18], [40, 22, 12, 32, 30, 15], [-34, 28, 13, 34, 28, 16], [12, -40, 12, 32, 28, 14], [-30, -28, 11, 28, 26, 13], [58, -22, 9, 24, 22, 11]];
  const g = shrub({ seed: 1501, lobes, leaf: 13, look: HEATHER, ragged: 0.5, core: 0.75, cards, flowers: { cells: [FLOWER_CELLS.lavender, FLOWER_CELLS.wisteria, FLOWER_CELLS.lavender], n: 46, size: 12, up: 0.9 } });
  return centre(merge(g, cards.geo()));
}

// Gorse: a prickly mound, dark needled green, thick with yellow flowers.
const GORSE: ShrubLook = { core: "Westhills_GorseCore", dark: "Westhills_GorseDark", mid: "Westhills_GorseMid", light: "Westhills_GorseLight" };
function gorse(): Geo {
  const cards = new Cards();
  const lobes: [number, number, number, number, number, number][] = [[0, 0, 52, 58, 52, 46], [44, 26, 42, 40, 36, 36], [-40, 30, 46, 40, 38, 38], [20, -44, 40, 36, 34, 34], [-32, -34, 38, 34, 32, 32], [6, 6, 86, 34, 32, 24]];
  const g = shrub({ seed: 1511, lobes, leaf: 17, look: GORSE, ragged: 0.75, density: 1.1, core: 0.8, cards, stems: { mat: "Westhills_PineBark", r: 3, n: 6 }, flowers: { cells: [FLOWER_CELLS.tinyYellow, FLOWER_CELLS.buttercup, FLOWER_CELLS.tinyYellow], n: 95, size: 13, up: 0.5 } });
  return centre(merge(g, cards.geo()));
}

// A pine the wind has bent: its trunk leaning away (+X) and bare on the windward side, its
// needles in flat pads swept downwind, a dead limb or two. About 6 m.
function bough(cards: LeafCards, at: V3, yaw: number, L: number, w: number, droop: number, v0: number, v1: number, rnd: () => number): void {
  const col = new THREE.Color(), shade = (v: number) => col.setRGB(v, v, v, THREE.SRGBColorSpace).clone();
  const dir = new THREE.Vector3(Math.cos(yaw), Math.sin(yaw), 0), side = new THREE.Vector3(-Math.sin(yaw), Math.cos(yaw), 0);
  const segs = 3, pts: THREE.Vector3[] = [new THREE.Vector3(...at)];
  for (let k = 1; k <= segs; k++) {
    const ang = 0.1 - droop * ((k - 0.5) / segs) ** 1.2;
    pts.push(pts[k - 1].clone().addScaledVector(dir, (L / segs) * Math.cos(ang)).add(new THREE.Vector3(0, 0, (L / segs) * Math.sin(ang))));
  }
  const s = side.clone().applyAxisAngle(dir, (rnd() - 0.5) * 0.4).multiplyScalar(w / 2);
  const n = dir.clone().multiplyScalar(0.4).add(new THREE.Vector3(0, 0, 0.9)).normalize();
  for (let k = 0; k < segs; k++) {
    const u0 = k / segs, u1 = (k + 1) / segs, c0 = shade(v0 + (v1 - v0) * u0), c1 = shade(v0 + (v1 - v0) * u1);
    cards.quad([pts[k].clone().sub(s), pts[k + 1].clone().sub(s), pts[k + 1].clone().add(s), pts[k].clone().add(s)], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]], n, [c0, c1, c1, c0]);
  }
}
function raggedPine(): THREE.Object3D {
  const rnd = seeded(1601);
  const trunk: V3[] = [[0, 0, -10], [14, 3, 130], [58, 8, 260], [130, 4, 380], [215, -8, 480], [280, -14, 545]];
  const parts: Geo[] = [
    limb(trunk.slice(0, 4), 25, 15, "Westhills_PineBark", { seg: 9, flare: 0.65, roots: 4, gnarl: 0.7, seed: 1601, taper: 0.8 }),
    limb(trunk.slice(2), 16, 5, "Westhills_PineBarkRed", { seg: 8, gnarl: 0.5, seed: 1602, taper: 0.9 }),
  ];
  const cards = new LeafCards();
  // the pads of needles: on limbs swept downwind (+X) and to the sides, flat on top
  const pads: [number, number, number, number][] = [[300, -10, 560, 125], [240, 85, 500, 110], [205, -105, 470, 105], [345, 70, 515, 95], [130, 50, 400, 90], [255, -70, 430, 90], [165, -30, 520, 85]];
  const along = (t: number): V3 => {
    const i = Math.min(trunk.length - 2, Math.floor(t * (trunk.length - 1))), f = t * (trunk.length - 1) - i;
    return add(trunk[i], mul(sub(trunk[i + 1], trunk[i]), f));
  };
  pads.forEach(([x, y, z, r], k) => {
    // from the trunk below the pad out to it
    let best = 0, bd = Infinity;
    for (let t = 0.3; t <= 1; t += 0.05) {
      const p = along(t), d = Math.hypot(p[0] - x, p[1] - y, p[2] - z + 60);
      if (d < bd) [best, bd] = [t, d];
    }
    const from = along(best);
    parts.push(limb([from, [(from[0] + x) / 2, (from[1] + y) / 2, (from[2] + z) / 2 + 10], [x - r * 0.2, y, z - 6]], 6.5, 2.5, "Westhills_PineBarkRed", { seg: 5, maxRings: 4 }));
    parts.push(lump([x, y, z - 4], [r * 0.6, r * 0.55, r * 0.2], 1610 + k, "CanopyCoreFir", 0, 0.12));
    const n = 8, tw = rnd() * Math.PI * 2;
    for (let b = 0; b < n; b++) {
      const yaw = tw + (b / n) * Math.PI * 2, downwind = Math.cos(yaw) > 0 ? 1.2 : 0.75;
      bough(cards, [x, y, z], yaw, r * (0.8 + rnd() * 0.3) * downwind, r * 0.7, 0.35, 0.42, 0.78, rnd);
    }
    for (let b = 0; b < 4; b++) bough(cards, [x + 10, y, z + r * 0.12], tw + b * 1.6, r * 0.55, r * 0.5, 0.25, 0.55, 0.92, rnd);
  });
  // dead limbs on the windward side
  for (const [t, y, l] of [[0.45, 30, 120], [0.62, -40, 100], [0.3, -20, 80]] as const) {
    const p = along(t);
    parts.push(limb([p, add(p, [-l * 0.5, y * 0.6, 14]), add(p, [-l, y, 4])], 5, 1.2, "Westhills_DeadWood", { seg: 5, maxRings: 4 }));
  }
  return treeObject(merge(...parts), [cards, "bough"]);
}

// ================================================================================================
// ---- the rice terraces ----
// ================================================================================================

// A paddy, 5.6 m across (X) by 4.8 m along (Y): a sheet of still water held in a low earth bund
// on every side (the bunds of two paddies side by side make one), young rice in rows. Laid edge
// to edge along a terrace, it floods the whole step.
export const PADDY = { x: 560, y: 480 };
function paddy(): Geo {
  const P: Geo[] = [], hx = PADDY.x / 2, hy = PADDY.y / 2, bw = 24, bh = 17;
  P.push(bb([-hx + 4, -hy + 4, -6], [hx - 4, hy - 4, 5], "Westhills_PaddyWater"));
  // the bunds, grass along their tops
  for (const s of [-1, 1]) {
    P.push(bb([-hx, s * hy - (s > 0 ? bw : 0), -8], [hx, s * hy + (s < 0 ? bw : 0), bh], "Westhills_Bund", 6));
    P.push(bb([s * hx - (s > 0 ? bw : 0), -hy, -8], [s * hx + (s < 0 ? bw : 0), hy, bh], "Westhills_Bund", 6));
    P.push(bb([-hx + 4, s * (hy - bw / 2) - 7, bh - 2], [hx - 4, s * (hy - bw / 2) + 7, bh + 1.5], "Westhills_BundGrass"));
    P.push(bb([s * (hx - bw / 2) - 7, -hy + 4, bh - 2], [s * (hx - bw / 2) + 7, hy - 4, bh + 1.5], "Westhills_BundGrass"));
  }
  // the rice: tufts in rows, a few missing
  const cards = new Cards(), rnd = seeded(1701);
  const right = new THREE.Vector3(), up = new THREE.Vector3(0, 0, 1), n = new THREE.Vector3(0, 0, 1);
  for (let x = -hx + bw + 22; x <= hx - bw - 18; x += 40)
    for (let y = -hy + bw + 18; y <= hy - bw - 14; y += 36) {
      if (rnd() < 0.06) continue;
      const a = rnd() * Math.PI, h = 30 + rnd() * 14, w = 24 + rnd() * 8, mat = rnd() < 0.35 ? "Westhills_RiceCardDark" : "Westhills_RiceCard";
      const c: V3 = [x + (rnd() - 0.5) * 6, y + (rnd() - 0.5) * 6, 2];
      for (const da of [0, Math.PI / 2]) {
        right.set(Math.cos(a + da), Math.sin(a + da), 0);
        n.set(-Math.sin(a + da) * 0.3, Math.cos(a + da) * 0.3, 1).normalize();
        cards.add(mat, c, right, up, w, h, n, [0, 0, 1, 1], true);
      }
    }
  return merge(...P, cards.geo());
}

// Stone steps up a terrace: 6 m long rising 2 m toward +X, 4 m wide. Lay it on a straight ramp
// of the same rise, centred on the ramp's middle, its foot (-X) at the ramp's foot.
export const STAIRS = { run: 600, rise: 200, width: 400 };
function terraceStairs(): Geo {
  const P: Geo[] = [], rnd = seeded(1751), { run, rise } = STAIRS, n = 12, W = STAIRS.width / 2, k = rise / run, tr = run / n;
  const zAt = (x: number) => x * k;
  for (let i = 0; i < n; i++) {
    const x0 = -run / 2 + i * tr, x1 = x0 + tr, top = zAt(x1) + 3;
    const split = (rnd() - 0.5) * 180;
    P.push(bb([x0, -W + 26, zAt(x0) - 40], [x1 + 6, split - 1, top + (rnd() - 0.5) * 2], rnd() < 0.3 ? "Westhills_FieldstoneDark" : "StoneGrey", 2.5));
    P.push(bb([x0, split + 1, zAt(x0) - 40], [x1 + 6, W - 26, top + (rnd() - 0.5) * 2], rnd() < 0.3 ? "Westhills_FieldstoneDark" : "StoneGrey", 2.5));
  }
  // kerbs of rough stone up either side, grass tufts and moss along them
  for (const s of [-1, 1])
    for (let j = 0; j < 6; j++) {
      const xa = -run / 2 + (j * run) / 6, xb = xa + run / 6;
      P.push(bb([xa, s * W - 30, zAt(xa) - 40], [xb + 4, s * W, zAt(xb) + 22], j % 2 ? "Westhills_FieldstoneDark" : "Westhills_Fieldstone", 4));
      P.push(ellipsoid([44, 14, 5], [xa + 50, s * (W - 14), zAt(xb) + 21], "Westhills_BundGrass", 6));
    }
  return merge(...P);
}

// A farmhouse of the terraces: white walls on a grey brick skirting, dark timber posts and beams,
// a grey tiled roof whose eaves turn up at the corners; double doors with red couplets and a red
// lantern, paper lattice windows; a kitchen lean-to with its chimney at the +Y end; strings of
// corn and chillies drying, baskets, a bench, a hoe.
function farmHouse(): Geo {
  const P: Geo[] = [];
  const hx = 280, hy = 430, z1 = 34, zw = 330;
  const D = "WoodDark", Wh = "Westhills_Whitewash";
  P.push(bb([-hx - 26, -hy - 26, -16], [hx + 26, hy + 26, z1], "StoneGrey", 4));
  P.push(bb([-hx - 52, -90, -16], [-hx - 24, 90, 18], "StoneGrey", 3));
  P.push(bb([-hx, -hy, z1], [hx, hy, zw], Wh));
  P.push(bb([-hx - 4, -hy - 4, z1], [hx + 4, hy + 4, z1 + 70], "Westhills_GreyBrick"));
  // the timber frame
  for (const x of [-hx, hx]) for (const y of [-hy, -hy / 3, hy / 3, hy]) P.push(boxAt([24, 24, zw - z1 + 6], [x + (x < 0 ? -2 : 2), y, z1], D, 2));
  P.push(bb([-hx - 8, -hy - 8, zw - 26], [hx + 8, hy + 8, zw + 4], D, 2));
  P.push(bb([-hx - 7, -hy, z1 + 150], [-hx + 4, hy, z1 + 162], D));
  // the doors: frame, two leaves with studs, a sill; red couplets and the lintel scroll
  P.push(bb([-hx - 8, -76, z1], [-hx + 2, 76, z1 + 236], D), bb([-hx - 12, -70, z1 + 4], [-hx - 6, -2, z1 + 226], "DoorWood", 1), bb([-hx - 12, 2, z1 + 4], [-hx - 6, 70, z1 + 226], "DoorWood", 1));
  for (const y of [-36, 36]) for (const z of [60, 130, 200]) P.push(sphereCenter(2.4, [-hx - 13, y, z1 + z], "Bronze", 5));
  for (const y of [-10, 10]) P.push(cylinderAt({ radius: 5, height: 3, segments: 8, bottom: [0, 0, 0] }, "Bronze").map((p) => ({ geo: p.geo.rotateY(Math.PI / 2).translate(-hx - 14, y, z1 + 130), mat: p.mat })));
  for (const y of [-96, 96]) P.push(bb([-hx - 6, y - 12, z1 + 40], [-hx - 2, y + 12, z1 + 210], "Westhills_RedPaper"));
  P.push(bb([-hx - 6, -60, z1 + 246], [-hx - 2, 60, z1 + 276], "Westhills_RedPaper"), bb([-hx - 7, -46, z1 + 254], [-hx - 6.5, 46, z1 + 268], "GoldTrim"));
  // lattice windows either side
  for (const yc of [-270, 270]) {
    const y0 = yc - 70, y1 = yc + 70, za = z1 + 110, zb = z1 + 220;
    P.push(bb([-hx - 3, y0, za], [-hx + 2, y1, zb], "PaperShoji"));
    P.push(bb([-hx - 9, y0 - 10, za - 10], [-hx - 1, y1 + 10, za], D), bb([-hx - 9, y0 - 10, zb], [-hx - 1, y1 + 10, zb + 10], D));
    P.push(bb([-hx - 9, y0 - 10, za], [-hx - 1, y0, zb], D), bb([-hx - 9, y1, za], [-hx - 1, y1 + 10, zb], D));
    for (let y = y0 + 18; y < y1 - 4; y += 18) P.push(bb([-hx - 7, y - 1.6, za], [-hx - 3, y + 1.6, zb], D));
    for (let z = za + 18; z < zb - 4; z += 18) P.push(bb([-hx - 7, y0, z - 1.6], [-hx - 3, y1, z + 1.6], D));
  }
  // a window at the back too
  P.push(bb([hx - 2, -60, z1 + 120], [hx + 3, 60, z1 + 210], "PaperShoji"), bb([hx + 1, -70, z1 + 112], [hx + 8, 70, z1 + 120], D), bb([hx + 1, -70, z1 + 210], [hx + 8, 70, z1 + 218], D));
  for (let y = -48; y <= 48; y += 16) P.push(bb([hx + 3, y - 1.6, z1 + 120], [hx + 7, y + 1.6, z1 + 210], D));
  // the roof
  P.push(cnRoof({ hx: hx + 95, hy: hy + 80, z: zw - 14, h: 230, tile: "Westhills_TileGrey", ridge: "Westhills_RidgeTile", edge: D, gable: Wh, wall: hx + 2, wallY: hy + 2, wallZ: zw - 4, lift: 38, flare: 22 }));
  // the kitchen lean-to at +Y and its chimney
  const ky0 = hy, ky1 = hy + 210, kx = 200;
  P.push(bb([-kx - 14, ky0, -16], [kx + 14, ky1 + 16, z1], "StoneGrey", 3), bb([-kx, ky0, z1], [kx, ky1, 240], Wh), bb([-kx - 4, ky0, z1], [kx + 4, ky1 + 4, z1 + 60], "Westhills_GreyBrick"));
  for (const x of [-kx, kx]) P.push(boxAt([20, 20, 240 - z1], [x, ky1 - 2, z1], D, 2));
  const lean = translate(rotateX(bb([-kx - 60, -6, -8], [kx + 60, 270, 10], "Westhills_TileGrey"), -16), [0, ky0 - 20, 292]);
  P.push(lean, beamBetween([-kx - 60, ky1 + 46, 222], [kx + 60, ky1 + 46, 222], 12, 14, D));
  P.push(bb([-kx - 4, ky0 + 60, z1 + 30], [-kx + 2, ky0 + 150, z1 + 140], "Westhills_Dark"), bb([-kx - 8, ky0 + 52, z1 + 22], [-kx - 2, ky0 + 158, z1 + 30], D), bb([-kx - 8, ky0 + 52, z1 + 140], [-kx - 2, ky0 + 158, z1 + 148], D));
  P.push(bb([90, ky1 - 70, z1], [150, ky1 - 10, 400], "Westhills_GreyBrick"), bb([82, ky1 - 78, 400], [158, ky1 - 2, 412], "StoneGrey", 2), bb([96, ky1 - 64, 412], [144, ky1 - 16, 430], "Westhills_RidgeTile", 2));
  // drying corn and chillies hung under the eaves, the lantern
  for (const [y, mat] of [[-180, "Westhills_Corn"], [-150, "Westhills_Chili"], [170, "Westhills_Corn"]] as const) {
    P.push(cylinderBetween([-hx - 24, y, zw - 10], [-hx - 24, y, zw - 40], 1.2, 4, "RopeTan"));
    for (let k = 0; k < 6; k++) P.push(ellipsoid(mat === "Westhills_Corn" ? [6, 6, 13] : [3.5, 3.5, 10], [-hx - 24 + (k % 2 ? 4 : -4), y + (k % 3 - 1) * 5, zw - 50 - k * 17], mat, 6));
  }
  P.push(cylinderBetween([-hx - 46, 120, zw - 6], [-hx - 46, 120, zw - 30], 1, 4, "IronDark"), ellipsoid([22, 22, 26], [-hx - 46, 120, zw - 58], "Westhills_Lantern", 10), cylinderAt({ radius: 12, height: 6, segments: 8, bottom: [-hx - 46, 120, zw - 36] }, "GoldTrim"), cylinderAt({ radius: 12, height: 6, segments: 8, bottom: [-hx - 46, 120, zw - 86] }, "GoldTrim"));
  for (let k = 0; k < 5; k++) P.push(cylinderBetween([-hx - 46 + (k - 2) * 3, 120, zw - 86], [-hx - 46 + (k - 2) * 4, 120, zw - 104], 0.8, 3, "Westhills_RedPaper"));
  // the bench, baskets, the hoe
  P.push(bb([-hx - 70, -230, 40], [-hx - 36, -120, 46], "WoodWarm", 1));
  for (const y of [-220, -130]) P.push(bb([-hx - 66, y - 3, 0], [-hx - 40, y + 3, 40], "WoodWarm"));
  for (const [x, y, r] of [[-hx - 60, 200, 30], [-hx - 50, 262, 24]] as const) P.push(lathe([[r * 0.7, 0], [r, r * 0.6], [r * 1.05, r * 1.1], [r * 0.96, r * 1.14]], 10, "BambooDry", [x, y, 0]));
  P.push(cylinderBetween([-hx - 8, -350, 0], [-hx - 30, -330, 170], 2.4, 5, "WoodWarm"), bb([-hx - 14, -352, 0], [-hx - 6, -338, 26], "IronDark"));
  return centre(merge(...P));
}

// A water buffalo: slate-grey, heavy-shouldered, head low and forward, wide horns swept back in
// crescents; mud dried on its legs.
function waterBuffalo(): Geo {
  const L = 250, H = 150;
  return beast({
    len: L, h: H, seed: 1801, coat: "Westhills_BuffaloHide", dark: "Westhills_BuffaloDark", light: "Westhills_BuffaloHide", leg: "Westhills_Mud",
    hoof: "Westhills_BuffaloDark", muzzle: "Westhills_BuffaloDark", headX: -L * 0.53, headZ: H * 0.6, shag: 0,
    horns: (h) => merge(...[-1, 1].map((s) => limb([
      add(h, [L * 0.02, s * L * 0.04, H * 0.1]), add(h, [L * 0.03, s * L * 0.16, H * 0.15]), add(h, [L * 0.1, s * L * 0.24, H * 0.18]),
      add(h, [L * 0.19, s * L * 0.22, H * 0.2]), add(h, [L * 0.23, s * L * 0.13, H * 0.23]),
    ], 9, 2, "Westhills_BuffaloHorn", { seg: 7, gnarl: 0.4 }))),
  });
}

// The buffalo pen: a fence of bamboo rails round a yard, the front (-X) left open with its rails
// slid aside; a thatched shelter at the back, a mud wallow, a hollow-log trough, straw.
function buffaloPen(): Geo {
  const P: Geo[] = [];
  const hx = 400, hy = 320, B = "Bamboo", BD = "BambooDry";
  const post = (x: number, y: number) => P.push(cylinderAt({ rBot: 7, rTop: 6, height: 150, segments: 7, bottom: [x, y, -10] }, BD), cylinderAt({ radius: 7.5, height: 3, segments: 7, bottom: [x, y, 40] }, "RopeTan"), cylinderAt({ radius: 7.5, height: 3, segments: 7, bottom: [x, y, 100] }, "RopeTan"));
  const rails = (a: V3, b: V3) => {
    for (const z of [42, 102]) P.push(cylinderBetween([a[0], a[1], z], [b[0], b[1], z], 4.5, 6, B));
  };
  const corners: V3[] = [[-hx, -hy, 0], [hx, -hy, 0], [hx, hy, 0], [-hx, hy, 0]];
  for (let i = 0; i < 3; i++) {
    const a = corners[i], b = corners[i + 1], n = Math.round(len(sub(b, a)) / 200);
    for (let k = 0; k <= n; k++) post(a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n);
    rails(a, b);
  }
  // the front: posts either side of the opening, the rails slid back to one side
  for (const y of [-hy + 160, hy - 160]) post(-hx, y);
  rails([-hx, -hy, 0], [-hx, -hy + 160, 0]);
  rails([-hx, hy - 160, 0], [-hx, hy, 0]);
  P.push(cylinderBetween([-hx - 14, hy - 150, 42], [-hx - 14, hy + 120, 46], 4.5, 6, B), cylinderBetween([-hx - 20, hy - 140, 8], [-hx - 30, hy + 150, 12], 4.5, 6, B));
  // the shelter
  for (const x of [170, 360]) for (const y of [-280, -40]) P.push(cylinderAt({ radius: 8, height: 220, segments: 7, bottom: [x, y, 0] }, BD));
  for (const s of [-1, 1]) P.push(beamBetween([265, -160, 284], [265 + s * 140, -160, 202], 390, 12, "Thatch"));
  P.push(beamBetween([265, -360, 292], [265, 40, 292], 14, 14, BD));
  for (const s of [-1, 1]) P.push(beamBetween([170 - 4, s < 0 ? -280 : -40, 220], [360 + 4, s < 0 ? -280 : -40, 220], 9, 9, BD));
  // the wallow, the trough, straw
  P.push(translate(scale(cylinderAt({ radius: 1, height: 1, segments: 16, bottom: [0, 0, 0] }, "Westhills_MudWater"), [190, 150, 3]), [-150, 140, 0]));
  P.push(translate(scale(torus(1, 0.18, 16, 5, "Westhills_Mud"), [200, 160, 40]), [-150, 140, 2]));
  const trough = merge(cylinderBetween([60, 180, 24], [260, 180, 24], 24, 10, "Westhills_WoodOld"), bb([66, 164, 30], [254, 196, 49], "Westhills_PaddyWater"));
  P.push(trough);
  const rnd = seeded(1811);
  for (let k = 0; k < 6; k++) P.push(translate(scale(sphereCenter(1, [0, 0, 0], k % 2 ? "Westhills_Straw" : "Westhills_StrawDark", 8), [50 + rnd() * 40, 40 + rnd() * 30, 7]), [100 + rnd() * 240, -260 + rnd() * 200, 0]));
  return merge(...P);
}

// A scarecrow of the paddies: a bamboo cross, a straw rain cape, a broad conical hat, a faded
// blue jacket on the arms, red rags flapping, a gourd hung from one hand.
function riceScarecrow(): Geo {
  const P: Geo[] = [];
  P.push(cylinderAt({ rBot: 4, rTop: 3.5, height: 200, segments: 6, bottom: [0, 0, -20] }, "BambooDry"));
  P.push(cylinderBetween([0, -78, 140], [0, 78, 140], 3, 6, "BambooDry"));
  // the cape of straw, layered
  P.push(lathe([[8, 168], [26, 156], [42, 112], [50, 76], [44, 74], [36, 108], [20, 150], [6, 162]], 10, "Westhills_Straw", [0, 0, 0]));
  P.push(lathe([[20, 128], [40, 100], [48, 66], [40, 64], [32, 98], [16, 124]], 10, "Westhills_StrawDark", [0, 0, 0]));
  // the jacket on the arms
  for (const s of [-1, 1]) P.push(cylinderBetween([0, s * 18, 142], [0, s * 64, 138], 10, 7, "Westhills_ClothFaded", 8), bb([-1, s * 64 - 2, 120], [1, s * 64 + 2, 140], "Westhills_Straw"));
  P.push(lathe([[12, 112], [16, 140], [12, 150], [6, 152]], 8, "Westhills_ClothFaded", [0, 0, 0]));
  // the head: a sack face, the hat
  P.push(sphereCenter(13, [0, 0, 172], "FabricSand", 8));
  for (const y of [-5, 5]) P.push(sphereCenter(1.8, [-12, y, 175], "Westhills_Eye", 5));
  P.push(lathe([[66, 0], [58, 4], [34, 14], [10, 28], [0, 32]], 14, "Westhills_Straw", [0, 0, 178]));
  P.push(cylinderAt({ radius: 34, height: 3, segments: 14, bottom: [0, 0, 186] }, "Westhills_StrawDark"));
  // rags and the gourd
  for (const [y, z, a] of [[70, 138, 10], [-66, 136, -15], [30, 146, 5]] as const) P.push(translate(rotateX(bb([-1, -4, -36], [1, 4, 0], "Westhills_Ribbon"), a), [0, y, z]));
  P.push(cylinderBetween([0, -76, 138], [0, -76, 112], 0.8, 4, "RopeTan"), sphereCenter(9, [0, -76, 102], "Westhills_Fruit", 8), sphereCenter(6, [0, -76, 114], "Westhills_Fruit", 8));
  return merge(...P);
}

// The bamboo water wheel: a wheel 7 m across turning in the stream (its axle along Y, the water
// flowing along X under it), paddles of woven bamboo, tubes lashed round its rim that fill at the
// bottom and pour into a trough at the top; the trough carries the water off along +Y to the
// channels. Stone piers on the banks, A-frames of thick bamboo carrying the axle.
export const WHEEL = { r: 260, troughZ: 530, troughY: 260 };
function bambooWaterwheel(): Geo {
  const P: Geo[] = [], R = WHEEL.r, zc = 230, B = "Bamboo", BD = "BambooDry";
  // the piers and the frames
  for (const s of [-1, 1]) {
    P.push(bb([-110, s * 120 - 40, -60], [110, s * 120 + 40, 40], "StoneGrey", 5));
    P.push(cylinderBetween([-100, s * 120, 30], [0, s * 120, zc + 20], 11, 8, BD), cylinderBetween([100, s * 120, 30], [0, s * 120, zc + 20], 11, 8, BD));
    P.push(cylinderBetween([-60, s * 120, 130], [60, s * 120, 130], 7, 6, BD));
    for (const z of [128, zc + 6]) P.push(cylinderAt({ radius: 13, height: 6, segments: 8, bottom: [0, 0, 0] }, "RopeTan").map((p) => ({ geo: p.geo.rotateX(Math.PI / 2).translate(z === 128 ? -60 : 0, s * 120 + 3, z), mat: p.mat })));
  }
  P.push(cylinderBetween([0, -150, zc], [0, 150, zc], 12, 10, "WoodDark"));
  // the wheel: two rims, spokes, paddles, tubes
  const wheel: Geo[] = [];
  for (const y of [-34, 34]) {
    wheel.push(rotateX(torus(R, 6, 28, 5, B), 90).map((p) => ({ geo: p.geo.translate(0, y, 0), mat: p.mat })));
    wheel.push(rotateX(torus(R * 0.62, 4, 22, 5, BD), 90).map((p) => ({ geo: p.geo.translate(0, y, 0), mat: p.mat })));
  }
  const n = 16;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    for (const y of [-34, 34]) wheel.push(cylinderBetween([c * 14, y * 0.5, s * 14], [c * R, y, s * R], 3.2, 5, B));
    // a paddle between the rims, and a tube lashed on it
    const pa = a + Math.PI / n;
    const pc = Math.cos(pa), ps = Math.sin(pa);
    wheel.push(translate(rotateY(bb([-4, -36, 0], [4, 36, 40], "Westhills_Weave"), (-pa * 180) / Math.PI + 90), [pc * R, 0, ps * R]));
    const t0: V3 = [pc * (R + 4) - ps * 10, 0, ps * (R + 4) + pc * 10], t1: V3 = [pc * (R + 4) + ps * 50, 0, ps * (R + 4) - pc * 50];
    wheel.push(cylinderBetween(add(t0, [0, 46, 0]), add(t1, [0, 46, 0]), 6, 7, BD));
  }
  P.push(...wheel.map((g) => translate(g, [0, 0, zc])));
  // the trough at the top, the water pouring in, the channel off along +Y
  P.push(cylinderBetween([-30, 62, zc + R + 40], [-30, 262, zc + R + 40], 13, 10, B), bb([-38, 64, zc + R + 46], [-22, 260, zc + R + 50], "Westhills_Water"));
  for (const y of [70, 240]) P.push(cylinderBetween([-70, y, zc + R + 26], [-70, y, -30], 5, 6, BD), cylinderBetween([10, y, zc + R + 26], [10, y, -30], 5, 6, BD), cylinderBetween([-74, y, zc + R + 24], [14, y, zc + R + 24], 4, 6, BD));
  P.push(ellipsoid([10, 12, 40], [-26, 64, zc + R + 14], "Westhills_Water", 8));
  // where it dips into the stream: foam
  P.push(translate(scale(torus(80, 26, 14, 5, "Westhills_Foam"), [1.2, 0.8, 0.25]), [0, 0, -12]));
  return merge(...P);
}

// A bamboo channel, 4 m along Y: a split cane on crossed trestles, water running in it.
// Its trestles' legs run on 4 m down into the ground, so a run of channel can be lifted (placed
// with a z offset) to carry the water over lower ground and still stand on its legs.
export const CHANNEL_Z = 120;
function bambooChannel(): Geo {
  const P: Geo[] = [], z = CHANNEL_Z;
  P.push(cylinderBetween([0, -202, z], [0, 202, z], 9, 8, "Bamboo"), bb([-5, -200, z + 5], [5, 200, z + 8.5], "Westhills_Water"));
  for (const y of [-120, 0, 120]) P.push(cylinderAt({ radius: 10, height: 3, segments: 8, bottom: [0, 0, 0] }, "BambooDry").map((p) => ({ geo: p.geo.rotateX(Math.PI / 2).translate(0, y + 1.5, z), mat: p.mat })));
  for (const y of [-160, 160]) {
    for (const s of [-1, 1]) P.push(cylinderBetween([s * 24, y, -420], [s * 20, y, z + 26], 4, 6, "BambooDry"));
    P.push(cylinderBetween([-30, y, z - 10], [30, y, z - 10], 3.5, 6, "BambooDry"));
    for (let k = 0; k < 4; k++) {
      const zt = z - 10 - k * 125, zb = zt - 125;
      P.push(cylinderBetween([-24, y, zt], [24, y, zb], 2.6, 5, "BambooDry"), cylinderBetween([-24, y, zb], [24, y, zb], 2.6, 5, "BambooDry"));
    }
    P.push(cylinderAt({ radius: 6, height: 4, segments: 6, bottom: [0, y, z - 14] }, "RopeTan"));
  }
  return merge(...P);
}

// The village shrine to the earth god: a little hall on a stone platform (grey brick walls, red
// columns, a green glazed roof with a pearl on its ridge), the god seated inside behind his altar
// of fruit, red lanterns, couplet boards; a bronze censer before the steps, incense smouldering.
function villageShrine(): Geo {
  const P: Geo[] = [];
  const R = "LacquerRed", zp = 46, zt = 262;
  P.push(bb([-170, -150, -16], [170, 150, zp], "StoneGrey", 4), bb([-150, -130, zp], [150, 130, zp + 4], "Westhills_GreyBrick"));
  for (let k = 0; k < 2; k++) P.push(bb([-170 - (k + 1) * 26, -90, -16], [-170 - k * 26, 90, zp - (k + 1) * 16], "StoneGrey", 3));
  // walls (back and sides) of grey brick, the red columns and beams
  P.push(bb([70, -120, zp], [100, 120, zt], "Westhills_GreyBrick"));
  for (const s of [-1, 1]) P.push(bb([-60, s * 120 - 14, zp], [100, s * 120 + 14, zt], "Westhills_GreyBrick"));
  for (const s of [-1, 1]) P.push(cylinderAt({ radius: 11, height: zt - zp, segments: 10, bottom: [-80, s * 100, zp] }, R), cylinderAt({ radius: 16, height: 14, segments: 10, bottom: [-80, s * 100, zp] }, "StoneGrey"));
  P.push(bb([-94, -130, zt - 30], [-66, 130, zt], R), bb([-95, -100, zt - 22], [-93, 100, zt - 8], "GoldTrim"));
  P.push(bb([-80, -130, zt], [100, 130, zt + 10], R));
  // couplet boards on the columns
  for (const s of [-1, 1]) P.push(bb([-94, s * 100 - 8, zp + 40], [-90, s * 100 + 8, zp + 180], "LacquerRed"), bb([-95, s * 100 - 5, zp + 50], [-94, s * 100 + 5, zp + 170], "GoldTrim"));
  // the altar, the god, the offerings
  P.push(bb([-30, -70, zp], [30, 70, zp + 70], R, 2), bb([-36, -76, zp + 70], [36, 76, zp + 78], "WoodDark", 1));
  P.push(bb([40, -40, zp], [70, 40, zp + 90], "StoneGrey", 2));
  P.push(lathe([[30, 0], [32, 30], [26, 60], [16, 78], [10, 84]], 10, "FabricGold", [55, 0, zp + 90]));
  P.push(sphereCenter(15, [52, 0, zp + 188], "Westhills_Skin", 10), ellipsoid([10, 12, 14], [42, 0, zp + 168], "StoneWhite", 8));
  P.push(lathe([[16, 0], [17, 10], [13, 18], [0, 20]], 10, "LacquerBlack", [52, 0, zp + 198]), bb([48, -24, zp + 204], [56, 24, zp + 208], "LacquerBlack"));
  for (const s of [-1, 1]) P.push(limb([[55, s * 26, zp + 150], [40, s * 30, zp + 120], [30, s * 14, zp + 108]], 6, 5, "FabricGold", { seg: 6 }));
  for (const [y, k] of [[-40, 3], [0, 4], [40, 3]] as const) {
    P.push(cylinderAt({ rBot: 10, rTop: 16, height: 6, segments: 10, bottom: [-10, y, zp + 78] }, "StoneWhite"));
    for (let i = 0; i < k; i++) P.push(sphereCenter(5.5, [-10 + (i - 1) * 6, y + (i % 2) * 5, zp + 90 + (i > 2 ? 8 : 0)], "Westhills_Fruit", 6));
  }
  for (const y of [-58, 58]) P.push(cylinderAt({ radius: 5, height: 22, segments: 6, bottom: [0, y, zp + 78] }, "Westhills_RedPaper"), sphereCenter(3, [0, y, zp + 102], "Westhills_Incense", 5));
  // the roof
  P.push(cnRoof({ hx: 170, hy: 175, z: zt + 6, h: 120, tile: "Westhills_TileGreen", ridge: "Westhills_RidgeGreen", edge: R, under: R, lift: 26, flare: 14, th: 12, pearl: "Westhills_Pearl", gable: "LacquerRed", wall: 100, wallY: 134, wallZ: zt + 10 }));
  // the lanterns
  for (const y of [-60, 60]) {
    P.push(cylinderBetween([-92, y, zt - 30], [-92, y, zt - 44], 1, 4, "IronDark"), ellipsoid([16, 16, 20], [-92, y, zt - 64], "Westhills_Lantern", 10));
    P.push(cylinderAt({ radius: 9, height: 4, segments: 8, bottom: [-92, y, zt - 48] }, "GoldTrim"), cylinderAt({ radius: 9, height: 4, segments: 8, bottom: [-92, y, zt - 86] }, "GoldTrim"));
    P.push(cylinderBetween([-92, y, zt - 86], [-92, y, zt - 104], 1.5, 4, "Westhills_RedPaper"));
  }
  // the censer before the steps, its incense
  P.push(bb([-262, -26, -16], [-218, 26, 30], "StoneGrey", 3));
  P.push(lathe([[16, 0], [24, 8], [26, 26], [22, 30], [24, 32], [20, 32]], 12, "Bronze", [-240, 0, 30]));
  for (const a of [0, 120, 240]) P.push(cylinderBetween([-240 + Math.cos(rad(a)) * 18, Math.sin(rad(a)) * 18, 34], [-240 + Math.cos(rad(a)) * 22, Math.sin(rad(a)) * 22, 30], 3, 5, "Bronze"));
  for (const s of [-1, 1]) P.push(torus(6, 2, 8, 4, "Bronze").map((p) => ({ geo: p.geo.rotateX(Math.PI / 2).translate(-240, s * 27, 58), mat: p.mat })));
  for (let k = 0; k < 5; k++) {
    const y = (k - 2) * 5, h = 30 + (k % 2) * 6;
    P.push(cylinderBetween([-240 + (k % 2 ? 3 : -3), y, 58], [-240 + (k % 2 ? 4 : -4), y, 58 + h], 0.8, 3, "Westhills_RedPaper"), sphereCenter(1.6, [-240 + (k % 2 ? 4 : -4), y, 58 + h], "Westhills_Incense", 4));
  }
  P.push(ellipsoid([10, 10, 30], [-238, 4, 128], "Westhills_Smoke", 6));
  return centre(merge(...P));
}

// ================================================================================================
// ---- the west cape ----
// ================================================================================================

// A dragon: a scaled body along `path` (from the tail's tip to the neck), its back spined, two
// clawed forelegs, the head at `head` looking along `look`, horns, whiskers, a mane; eyes aglow.
function dragon(path: V3[], r0: number, r1: number, head: V3, look: V3, seed: number, legsAt: number[] = [0.7, 0.45]): Geo {
  const P: Geo[] = [], rnd = seeded(seed), S = "Westhills_DragonScale", St = "Westhills_DragonStone";
  const curve = new THREE.CatmullRomCurve3([...path, head].map((p) => new THREE.Vector3(...p)), false, "centripetal");
  P.push(limb([...path, head], r1, r0, S, { seg: 9, maxRings: 40, gnarl: 0.3, seed, taper: 0.6 }));
  // spines along the back
  for (let t = 0.08; t < 0.94; t += 0.045) {
    const p = curve.getPointAt(t), tan = curve.getTangentAt(t);
    const side = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 0, 1));
    if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
    const up = new THREE.Vector3().crossVectors(side.normalize(), tan).normalize();
    const r = r1 + (r0 - r1) * Math.pow(t, 0.6), k = 0.6 + 0.4 * Math.sin(t * Math.PI);
    const base = p.clone().addScaledVector(up, r * 0.8), tip = base.clone().addScaledVector(up, r * 0.9 * k).addScaledVector(tan, -r * 0.5);
    P.push(cylinderBetween(base.toArray() as V3, tip.toArray() as V3, r * 0.32 * k, 4, St, 0.5));
  }
  // forelegs: thigh, shin, three claws gripping
  for (const t of legsAt) {
    const p = curve.getPointAt(t), tan = curve.getTangentAt(t);
    const side = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 0, 1)).normalize();
    for (const s of [-1, 1]) {
      const sh = p.clone().addScaledVector(side, s * r0 * 0.9), knee = sh.clone().addScaledVector(side, s * r0 * 0.9).add(new THREE.Vector3(0, 0, -r0 * 0.6)), paw = knee.clone().add(new THREE.Vector3(0, 0, -r0 * 1.1)).addScaledVector(tan, r0 * 0.6);
      P.push(limb([sh.toArray() as V3, knee.toArray() as V3, paw.toArray() as V3], r0 * 0.42, r0 * 0.26, S, { seg: 6 }));
      for (let c = -1; c <= 1; c++) {
        const d = tan.clone().multiplyScalar(0.8).addScaledVector(side, c * 0.5 * s).normalize();
        P.push(cylinderBetween(paw.toArray() as V3, paw.clone().addScaledVector(d, r0 * 0.7).add(new THREE.Vector3(0, 0, -r0 * 0.3)).toArray() as V3, r0 * 0.12, 4, "Westhills_HornTip", 0.5));
      }
    }
  }
  // the head
  const L = norm(look), side = norm(cross(L, UP)), up = cross(side, L);
  const at = (f: number, s: number, u: number): V3 => add(head, add(add(mul(L, f), mul(side, s)), mul(up, u)));
  const hr = r0 * 1.15;
  P.push(lump(at(hr * 0.2, 0, 0), [hr * 1.1, hr * 0.95, hr * 0.95], seed + 1, S, 1, 0.12));
  P.push(sweep([at(hr * 0.6, 0, hr * 0.25), at(hr * 1.6, 0, hr * 0.2), at(hr * 2.4, 0, hr * 0.05)], hr * 1.1, hr * 0.6, St));
  P.push(sweep([at(hr * 0.5, 0, -hr * 0.35), at(hr * 1.4, 0, -hr * 0.7), at(hr * 2.0, 0, -hr * 0.9)], hr * 0.9, hr * 0.32, St));
  for (const s of [-1, 1]) {
    P.push(sphereCenter(hr * 0.2, at(hr * 1.0, s * hr * 0.5, hr * 0.5), "Westhills_EyeGlow", 6));
    P.push(ellipsoid([hr * 0.3, hr * 0.2, hr * 0.12], at(hr * 1.0, s * hr * 0.52, hr * 0.68), St, 6));
    // horns swept back, whiskers trailing, the mane
    P.push(limb([at(hr * 0.4, s * hr * 0.4, hr * 0.7), at(-hr * 0.6, s * hr * 0.7, hr * 1.3), at(-hr * 1.6, s * hr * 0.8, hr * 1.5)], hr * 0.2, hr * 0.06, "Westhills_HornTip", { seg: 5 }));
    P.push(limb([at(hr * 2.2, s * hr * 0.3, hr * 0.0), at(hr * 2.4, s * hr * 1.0, -hr * 0.3), at(hr * 1.8, s * hr * 1.6, -hr * 0.9), at(hr * 1.2, s * hr * 1.8, -hr * 1.6)], hr * 0.07, hr * 0.03, St, { seg: 4 }));
    for (let k = 0; k < 4; k++) P.push(cylinderBetween(at(-hr * 0.2 - k * hr * 0.25, s * hr * 0.5, hr * 0.2), at(-hr * 1.0 - k * hr * 0.35, s * hr * (1.0 + rnd() * 0.3), hr * (0.4 - k * 0.15)), hr * 0.18, 4, S, hr * 0.02));
    // teeth
    for (let k = 0; k < 3; k++) P.push(cylinderBetween(at(hr * (1.4 + k * 0.3), s * hr * 0.35, -hr * 0.05), at(hr * (1.45 + k * 0.3), s * hr * 0.35, -hr * 0.32), hr * 0.07, 4, "StoneWhite", 0.5));
  }
  return merge(...P);
}

// The dragon gate: a stone gateway 6 m wide on the way to the sea dragon's altar; square pillars on
// plinths with drum stones, a lintel with a carved frieze and a name board, a stone roof; a dragon
// coiled up each pillar, its head reaching out over the way in (-X). Sea moss in the crevices,
// red ribbons tied on by the last pilgrims.
export const GATE_PILLARS: [number, number, number][] = [[0, -330, 70], [0, 330, 70]];
function dragonGate(): Geo {
  const P: Geo[] = [], St = "Westhills_DragonStone", Dk = "Westhills_DragonStoneDark";
  const stone: Geo[] = [];
  for (const s of [-1, 1]) {
    const y = s * 330;
    stone.push(bb([-80, y - 80, -20], [80, y + 80, 60], Dk, 5), bb([-46, y - 46, 60], [46, y + 46, 620], St, 5));
    stone.push(bb([-56, y - 56, 560], [56, y + 56, 590], Dk, 4));
    // drum stones either side of each pillar's foot
    for (const sx of [-1, 1]) {
      stone.push(translate(rotateX(cylinderAt({ radius: 46, height: 34, segments: 14, bottom: [0, 0, -17] }, St), 90), [sx * 145, y, 112]));
      stone.push(translate(rotateX(torus(38, 5, 14, 4, Dk), 90), [sx * 145, y + 18, 112]), translate(rotateX(torus(38, 5, 14, 4, Dk), 90), [sx * 145, y - 18, 112]));
      stone.push(bb([sx * 145 - 44, y - 26, -16], [sx * 145 + 44, y + 26, 66], Dk, 3));
    }
  }
  // the lintels, the frieze between them, the name board
  stone.push(bb([-60, -440, 590], [60, 440, 660], St, 5), bb([-44, -380, 470], [44, 380, 500], St, 4));
  stone.push(bb([-30, -290, 500], [30, 290, 590], Dk, 3));
  for (let k = -4; k <= 4; k++) if (Math.abs(k) > 1) stone.push(translate(rotateX(torus(22, 5, 12, 4, St), 90), [-32, k * 62, 545]));
  stone.push(bb([-40, -100, 506], [-30, 100, 584], "LacquerBlack", 2), bb([-42, -92, 514], [-40, 92, 576], "GoldTrim"));
  P.push(...stone);
  P.push(coverTop(merge(...stone), "Westhills_SeaMoss", { amount: 0.5, thick: 1.6, seed: 1901, patches: 0.45 }));
  // the stone roof, the pearl on its ridge
  P.push(cnRoof({ hx: 120, hy: 480, z: 660, h: 100, tile: "Westhills_StoneTile", ridge: Dk, edge: Dk, under: Dk, lift: 30, flare: 16, th: 14, pearl: "Westhills_Pearl" }));
  // the dragons: coiled twice round each pillar, heads out over the way
  for (const s of [-1, 1]) {
    const y = s * 330, path: V3[] = [];
    for (let k = 0; k <= 28; k++) {
      const t = k / 28, a = rad(s * 90 + s * 650 * t), r = 72 + 5 * Math.sin(t * 9);
      path.push([Math.cos(a) * r, y + Math.sin(a) * r, 80 + t * 440]);
    }
    const last = path[path.length - 1];
    path.push([last[0] - 50, y - s * 50, 560], [-110, y - s * 70, 600]);
    P.push(dragon(path, 19, 4, [-160, y - s * 90, 610], [-1, -s * 0.35, -0.15], 1911 + s, [0.82, 0.55]));
  }
  // red ribbons tied round the pillars
  for (const s of [-1, 1])
    for (const [dz, dy] of [[0, -12], [14, 10], [6, 30]] as const) P.push(translate(rotateY(bb([-1, -5, -60], [1, 5, 0], "Westhills_Ribbon"), 8 + dz), [-48, s * 330 + dy, 330 + dz]));
  return merge(...P);
}

// The altar of the sea dragon: a round stone terrace in two tiers (steps up from the front, -X;
// its balustrade broken here and there), and on it the stone dragon coiled about a pillar of rock
// holding the glowing pearl out over the altar table; ghost fires burning blue in two braziers,
// offerings, incense.
function dragonAltar(): Geo {
  const P: Geo[] = [], St = "Westhills_DragonStone", Dk = "Westhills_DragonStoneDark";
  const base: Geo[] = [];
  const oct = (r: number, h: number, z: number, mat: string) => rotateZ(cylinderAt({ radius: r, height: h, segments: 8, bottom: [0, 0, z] }, mat), 22.5);
  base.push(oct(470, 66, -16, Dk), oct(452, 4, 50, St), oct(330, 44, 50, St));
  const a0 = 470 * Math.cos(rad(22.5)), a1 = 330 * Math.cos(rad(22.5));
  for (let k = 0; k < 3; k++) base.push(bb([-a0 - (k + 1) * 30, -120, -16], [-a0 - k * 30 + 2, 120, 50 - (k + 1) * 16], Dk, 3));
  for (let k = 0; k < 2; k++) base.push(bb([-a1 - (k + 1) * 30, -90, 46], [-a1 - k * 30 + 2, 90, 94 - (k + 1) * 16], St, 3));
  // the balustrade round the lower tier, broken in places, open at the steps
  const rnd = seeded(2001);
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), r = 410;
    if (c < -0.93) continue;
    const broken = k % 7 === 3, h = broken ? 30 + rnd() * 20 : 70;
    base.push(bb([c * r - 9, s * r - 9, 50], [c * r + 9, s * r + 9, 50 + h], St, 2), ...(broken ? [] : [sphereCenter(11, [c * r, s * r, 50 + h + 8], St, 6)]));
    const a2 = ((k + 1) / 24) * Math.PI * 2, c2 = Math.cos(a2), s2 = Math.sin(a2);
    if (!broken && (k + 1) % 7 !== 3 && c2 > -0.93) base.push(beamBetween([c * r, s * r, 50 + 52], [c2 * r, s2 * r, 50 + 52], 10, 12, St));
  }
  P.push(...base, coverTop(merge(...base), "Westhills_SeaMoss", { amount: 0.45, thick: 1.5, seed: 2003, patches: 0.4 }));
  // the rock pillar and the dragon coiled about it
  const zt = 94;
  const pillar = translate(rock([150, 140, 300], 0.25, 2011, "Westhills_SeaRock"), [40, 0, zt - 10]);
  P.push(pillar, coverTop(pillar, "Westhills_SeaMoss", { amount: 0.5, thick: 2, seed: 2012, patches: 0.5 }));
  const path: V3[] = [[120, 120, zt + 4], [150, 20, zt + 6]];
  for (let k = 0; k <= 22; k++) {
    const t = k / 22, a = rad(-30 + 560 * t), r = 100 - 30 * t;
    path.push([40 + Math.cos(a) * r, Math.sin(a) * r, zt + 30 + t * 250]);
  }
  path.push([-20, -40, zt + 330]);
  P.push(dragon(path, 24, 5, [-80, -30, zt + 360], [-1, 0.25, -0.35], 2021, [0.88, 0.6]));
  // the pearl held out over the altar
  P.push(sphereCenter(30, [-110, -10, zt + 230], "Westhills_Pearl", 14));
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    P.push(cylinderBetween([-110 + Math.cos(a) * 26, -10 + Math.sin(a) * 26, zt + 230 + 16], [-110 + Math.cos(a) * 40, -10 + Math.sin(a) * 40, zt + 230 + 50], 3, 4, "Westhills_Pearl", 0.5));
  }
  // the altar table and the offerings
  P.push(bb([-250, -90, zt], [-170, 90, zt + 70], Dk, 3), bb([-262, -102, zt + 70], [-158, 102, zt + 82], St, 3));
  P.push(lathe([[16, 0], [22, 8], [24, 22], [20, 26]], 12, "Bronze", [-210, 0, zt + 82]));
  for (let k = 0; k < 5; k++) P.push(cylinderBetween([-210 + (k - 2) * 4, (k % 2) * 4, zt + 104], [-210 + (k - 2) * 5, (k % 2) * 5, zt + 140], 0.8, 3, "Westhills_RedPaper"), sphereCenter(1.6, [-210 + (k - 2) * 5, (k % 2) * 5, zt + 140], "Westhills_Incense", 4));
  for (const y of [-60, 60]) P.push(cylinderAt({ rBot: 14, rTop: 20, height: 8, segments: 10, bottom: [-205, y, zt + 82] }, "StoneWhite"), sphereCenter(7, [-205, y, zt + 96], "Westhills_Pearl", 6), sphereCenter(6, [-200, y + 8, zt + 94], "Westhills_Fruit", 6));
  // the braziers, ghost fire in them
  for (const s of [-1, 1]) {
    const c: V3 = [-190, s * 190, zt];
    for (const a of [0, 120, 240]) P.push(cylinderBetween(add(c, [Math.cos(rad(a)) * 34, Math.sin(rad(a)) * 34, 0]), add(c, [Math.cos(rad(a)) * 16, Math.sin(rad(a)) * 16, 90]), 4, 5, "Bronze"));
    P.push(lathe([[12, 0], [36, 14], [42, 34], [38, 36]], 12, "Bronze", add(c, [0, 0, 84])));
    P.push(lathe([[30, 0], [26, 24], [14, 52], [4, 74], [0, 80]], 8, "Westhills_GhostFire", add(c, [0, 0, 110])), lathe([[16, 0], [10, 30], [0, 50]], 8, "Westhills_GhostFire", add(c, [8, 6, 150])));
  }
  return merge(...P);
}

// A great carrack broken on the reef: the bow half driven up onto the rocks and listing hard, its
// foremast snapped, ribs bared where the hull tore open; the stern half with its high castle torn
// away and sunk a little apart, the mizzen still standing with a torn sail; the mainmast fallen
// across into the sea, rigging trailing; weed and barnacles along the waterline. About 24 m.
function hullHalf(t0: number, t1: number, holes: (t: number, u: number, sx: number) => boolean): Geo {
  const LEN = 2200, B = 330, out: Geo[] = [];
  const beam = (t: number) => B * (t < 0.45 ? Math.pow(Math.max(0, 1 - ((0.45 - t) / 0.45) ** 2), 0.6) * 0.92 + 0.08 : 1 - 0.4 * ((t - 0.45) / 0.55) ** 2);
  const keel = (t: number) => 40 * Math.pow(Math.abs(t - 0.45) / 0.55, 3);
  const deck = (t: number) => 430 + (t > 0.72 ? 200 * Math.pow((t - 0.72) / 0.28, 1.4) : 0) + (t < 0.16 ? 110 * Math.pow((0.16 - t) / 0.16, 2) : 0);
  const at = (t: number, u: number, sx: number): V3 => {
    const b = beam(t), zk = keel(t), zd = deck(t);
    return [sx * b * Math.sin(Math.min(1, u * 1.55) * (Math.PI / 2)) * (1 - 0.06 * u), -LEN / 2 + t * LEN, zk + (zd - zk) * u];
  };
  const NT = Math.max(3, Math.round((t1 - t0) * 22)), NU = 8;
  const ts = Array.from({ length: NT + 1 }, (_, i) => t0 + ((t1 - t0) * i) / NT), us = Array.from({ length: NU + 1 }, (_, j) => j / NU);
  for (const sx of [-1, 1]) {
    // the planking, in bands so a hole can be left out; weed below the waterline
    for (let i = 0; i < NT; i++)
      for (let j = 0; j < NU; j++) {
        if (holes(ts[i], us[j], sx)) continue;
        const quad = [[at(ts[i], us[j], sx), at(ts[i], us[j + 1], sx)], [at(ts[i + 1], us[j], sx), at(ts[i + 1], us[j + 1], sx)]];
        const uv = quad.map((row) => row.map((p): [number, number] => [p[1] / 100, p[2] / 100]));
        out.push(surface(quad, uv, us[j] < 0.25 ? "Westhills_Barnacle" : j % 3 === 2 ? "Westhills_WreckDark" : "Westhills_WreckWood", [sx, 0, -0.3]));
        out.push(surface(quad, uv, "Westhills_WreckDark", [-sx, 0, 0.3]));
      }
    // wales along the hull
    for (const u of [0.55, 0.86]) out.push(limb(ts.map((t): V3 => { const p = at(t, u, sx); return [p[0] * 1.03, p[1], p[2]]; }), 7, 7, "Westhills_WreckDark", { seg: 5 }));
    // weed hanging at the waterline
    for (let i = 0; i <= NT; i += 1) out.push(ellipsoid([6, 22, 16], add(at(ts[i], 0.24, sx), [sx * 4, 0, -10]), "Westhills_Weed", 5));
  }
  // ribs where the planks are gone
  for (let i = 0; i <= NT; i++)
    for (const sx of [-1, 1]) {
      if (!us.some((u) => holes(ts[i], u, sx))) continue;
      out.push(limb(us.map((u) => at(ts[i], u, sx)), 9, 7, "Westhills_WreckPale", { seg: 5 }));
    }
  // the deck, its broken edge, the rail
  const dk: V3[][] = [ts.map((t) => add(at(t, 0.96, -1), [6, 0, -14])), ts.map((t) => add(at(t, 0.96, 1), [-6, 0, -14]))];
  out.push(surface(dk, dk.map((row) => row.map((p): [number, number] => [p[1] / 100, p[0] / 100])), "Westhills_WreckPale", UP));
  for (const sx of [-1, 1]) for (let i = 0; i <= NT; i++) out.push(cylinderBetween(at(ts[i], 1, sx), add(at(ts[i], 1, sx), [0, 0, 60]), 4, 5, "Westhills_WreckDark"));
  for (const sx of [-1, 1]) out.push(limb(ts.map((t) => add(at(t, 1, sx), [0, 0, 60])), 5, 5, "Westhills_WreckDark", { seg: 5 }));
  // splintered planks sticking out where the hull broke in two
  const rnd = seeded(Math.round(t0 * 1000 + t1 * 100) + 2051);
  for (const [tb, dir] of [[t0, -1], [t1, 1]] as const) {
    if (tb < 0.01 || tb > 0.99) continue;
    for (const sx of [-1, 1])
      for (let j = 0; j < NU; j++) {
        if (rnd() < 0.3) continue;
        const p = at(tb, (j + 0.5) / NU, sx), l = 40 + rnd() * 140;
        out.push(translate(rotateX(rotateZ(bb([-2.5, 0, -9], [2.5, dir * l, 9], j % 3 === 2 ? "Westhills_WreckDark" : "Westhills_WreckWood"), (rnd() - 0.5) * 30), (rnd() - 0.5) * 40), p));
      }
  }
  // the transom at the stern, the stem post at the bow
  if (t1 > 0.99) {
    const ring: V3[] = [...us.map((u) => at(1, u, -1)), ...[...us].reverse().map((u) => at(1, u, 1))];
    out.push(fan(add(at(1, 0.5, 1), [-at(1, 0.5, 1)[0], 0, 0]), ring, "Westhills_WreckDark", [0, 1, 0], (p) => [p[0] / 100, p[2] / 100], true));
  }
  if (t0 < 0.01) out.push(limb([at(0, 0, 1), add(at(0, 0.6, 1), [0, -30, 0]), add(at(0, 1, 1), [0, -70, 90])].map((p): V3 => [0, p[1], p[2]]), 16, 12, "Westhills_WreckDark", { seg: 6 }));
  return merge(...out);
}
function greatWreck(): Geo {
  const P: Geo[] = [], W = "Westhills_WreckWood", Dk = "Westhills_WreckDark";
  // the bow half: torn open amidships on the starboard side
  const bow: Geo[] = [hullHalf(0, 0.55, (t, u, sx) => sx > 0 && t > 0.36 && u > 0.2 && u < 0.85 + (t - 0.36))];
  bow.push(cylinderBetween([0, -1000, 560], [0, -1420, 740], 16, 8, Dk));
  bow.push(cylinderBetween([0, -620, 400], [0, -620, 1000], 18, 9, W), cylinderBetween([0, -620, 1000], [6, -616, 1060], 15, 6, "Westhills_WreckPale", 8));
  bow.push(cylinderBetween([-4, -620, 900], [10, -380, 760], 9, 6, W));
  for (const sx of [-1, 1]) bow.push(cylinderBetween([0, -620, 980], [sx * 300, -600, 520], 1.6, 4, "RopeTan"), cylinderBetween([0, -1300, 630], [sx * 200, -1000, 500], 1.4, 4, "RopeTan"));
  // the forecastle
  bow.push(bb([-165, -950, 440], [165, -760, 610], W), bb([-175, -960, 606], [175, -750, 620], Dk));
  for (let y = -930; y <= -790; y += 46) for (const sx of [-1, 1]) bow.push(bb([sx * 166 - 4, y - 7, 540], [sx * 166 + 4, y + 7, 580], "Westhills_Dark"));
  P.push(translate(rotateY(rotateX(merge(...bow), -6), -17), [-20, 120, -70]));
  // the stern half, apart and lower, its castle broken
  const stern: Geo[] = [hullHalf(0.55, 1, (t, u, sx) => sx < 0 && t < 0.7 && u > 0.35)];
  stern.push(bb([-220, 650, 600], [220, 1080, 800], W), bb([-230, 640, 796], [230, 1090, 812], Dk));
  for (let y = 690; y <= 1030; y += 60) stern.push(bb([-226, y - 12, 680], [-216, y + 12, 740], "Westhills_Dark"), bb([216, y - 12, 680], [226, y + 12, 740], "Westhills_Dark"));
  for (let x = -150; x <= 150; x += 75) stern.push(bb([x - 16, 1078, 660], [x + 16, 1086, 760], "Westhills_Dark"), bb([x - 22, 1080, 652], [x + 22, 1090, 662], Dk));
  stern.push(cylinderBetween([0, 760, 800], [0, 760, 1500], 15, 8, W), cylinderBetween([-220, 760, 1380], [220, 760, 1420], 7, 6, Dk));
  // the torn sail hanging from the mizzen yard
  const sail: [V3, V3, V3][] = [
    [[-200, 768, 1385], [40, 768, 1408], [-150, 790, 1160]], [[40, 768, 1408], [-60, 790, 1200], [-150, 790, 1160]], [[40, 768, 1408], [180, 770, 1416], [60, 785, 1240]],
    [[180, 770, 1416], [140, 786, 1300], [60, 785, 1240]], [[-60, 790, 1200], [-150, 790, 1160], [-110, 800, 1070]], [[40, 768, 1408], [60, 785, 1240], [-60, 790, 1200]],
  ];
  for (const [a, b, c] of sail) stern.push(tri(a, b, c, "Westhills_Sail"));
  for (const sx of [-1, 1]) stern.push(cylinderBetween([0, 760, 1480], [sx * 300, 700, 820], 1.6, 4, "RopeTan"));
  stern.push(cylinderBetween([0, 1010, 812], [0, 1010, 900], 4, 6, "IronDark"), lathe([[14, 0], [18, 14], [16, 34], [6, 44], [0, 46]], 8, "Westhills_Soot", [0, 1010, 900]));
  P.push(translate(rotateZ(rotateY(rotateX(merge(...stern), 3), 12), 14), [140, 380, -150]));
  // the mainmast fallen across into the sea, its yard and rigging trailing
  P.push(cylinderBetween([60, -110, 380], [980, 380, -60], 17, 8, W), cylinderBetween([780, 110, 60], [700, 520, -20], 8, 6, Dk));
  for (const [a, b] of [[[300, 20, 260], [520, -280, -40]], [[600, 180, 120], [820, -120, -40]], [[700, 240, 80], [1000, 200, -40]]] as [V3, V3][]) P.push(cylinderBetween(a, b, 1.6, 4, "RopeTan"));
  P.push(tri([700, 120, 60], [880, 260, -20], [640, 380, -20], "Westhills_Sail"), tri([700, 120, 60], [640, 380, -20], [560, 200, 30], "Westhills_Sail"));
  // the reef under the bow, cargo and planks strewn
  for (const [x, y, s, seed] of [[-180, -760, 260, 2101], [200, -420, 200, 2103], [-260, -150, 180, 2105], [120, -1180, 170, 2107], [-60, 520, 150, 2109]] as const) {
    const r = rock([s * 1.4, s, s * 0.8], 0.35, seed, "Westhills_SeaRockWet");
    P.push(translate(r, [x, y, -90]), translate(coverTop(r, "Westhills_Weed", { amount: 0.3, thick: 2, seed, patches: 0.5 }), [x, y, -90]));
  }
  for (const [x, y, a] of [[-420, -300, 20], [-380, 200, 70], [420, -700, -30]] as const) P.push(translate(rotateZ(bb([-20, -110, 0], [20, 110, 10], "Westhills_WreckPale", 2), a), [x, y, -6]));
  for (const [x, y] of [[-430, -40], [-470, 60], [380, 100], [-390, -520]] as const) P.push(cylinderAt({ rBot: 26, rTop: 30, height: 64, segments: 10, bottom: [x, y, -14] }, W), torus(28, 3, 10, 4, "IronDark").map((p) => ({ geo: p.geo.translate(x, y, 20), mat: p.mat })));
  // a cask on its side and a burst crate of cargo by the hole
  P.push(translate(rotateY(cylinderAt({ rBot: 28, rTop: 28, height: 70, segments: 10, bottom: [0, 0, -35] }, W), 90), [330, -120, 20]));
  P.push(translate(rotateZ(bb([-45, -45, -10], [45, 45, 70], "Westhills_WreckPale", 2), 30), [420, -360, 0]), sphereCenter(14, [460, -300, 6], "Westhills_Fruit", 6), sphereCenter(12, [470, -330, 4], "FabricRed", 6));
  return centre(merge(...P));
}

// A broken beacon tower: a round tower of pale stone, its top torn away so the wall stands high on
// one side and low on the other; the iron fire basket hanging over the break, soot down the wall,
// a door and slit windows, the fallen stones heaped at its foot, the copper dome of its lantern
// lying in the grass.
function brokenBeacon(): Geo {
  const P: Geo[] = [], S = "Westhills_BeaconStone", D = "StoneDark", rnd = seeded(2201);
  const R0 = 175, R1 = 150, zSolid = 330, segs = 16;
  P.push(cylinderAt({ rBot: R0 + 18, rTop: R0 + 10, height: 46, segments: segs, bottom: [0, 0, -20] }, D));
  P.push(cylinderAt({ rBot: R0, rTop: R0 - (R0 - R1) * (zSolid / 680), height: zSolid, segments: segs, bottom: [0, 0, 20] }, S));
  P.push(cylinderAt({ radius: R0 - 6, height: 18, segments: segs, bottom: [0, 0, 240] }, D));
  // above, the wall in blocks round the ring, high toward +X, low toward -X, ragged
  for (let k = 0; k < segs; k++) {
    const a = ((k + 0.5) / segs) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const top = zSolid + 20 + 330 * Math.pow(0.5 + 0.5 * c, 1.6) + (rnd() - 0.5) * 60;
    const r = R0 - (R0 - R1) * 0.6, chord = (2 * Math.PI * r) / segs + 4;
    if (top < zSolid + 40) continue;
    for (let z = zSolid + 20, i = 0; z < top; i++) {
      const h = Math.min(top - z, 34 + rnd() * 10);
      P.push(translate(rotateZ(box([40, chord - (i % 2 ? 6 : 0), h - 2], [0, 0, h / 2], i % 3 ? S : D, 3), (a * 180) / Math.PI), [c * (r - 20), s * (r - 20), z]));
      z += h;
    }
  }
  // the floor at the break, the stair's head, the fire basket hanging askew
  P.push(cylinderAt({ radius: R1 - 18, height: 10, segments: segs, bottom: [0, 0, zSolid + 14] }, D));
  const basket: Geo[] = [torus(60, 4, 14, 4, "IronDark"), translate(torus(42, 4, 12, 4, "IronDark"), [0, 0, -44])];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    basket.push(cylinderBetween([Math.cos(a) * 60, Math.sin(a) * 60, 0], [Math.cos(a) * 42, Math.sin(a) * 42, -44], 3, 4, "IronDark"));
  }
  basket.push(lump([0, 0, -30], [40, 40, 16], 2205, "Westhills_Soot", 0, 0.2));
  P.push(translate(rotateY(rotateX(merge(...basket), 28), -20), [70, 30, 690]));
  P.push(cylinderBetween([30, -40, 640], [60, 0, 700], 5, 5, "IronDark"));
  // soot streaked down the high side
  for (let k = 0; k < 5; k++) {
    const a = rad(-30 + k * 15), c = Math.cos(a), s = Math.sin(a), r = R0 - 4;
    P.push(translate(rotateZ(ellipsoid([5, 22, 70 + rnd() * 60], [0, 0, 0], "Westhills_Soot", 6), (a * 180) / Math.PI), [c * r, s * r, 520 - k * 18]));
  }
  // the door and its frame, slit windows
  P.push(bb([-R0 - 8, -48, 26], [-R0 + 20, 48, 210], "Westhills_Dark"), bb([-R0 - 14, -64, 26], [-R0 + 4, -48, 230], D, 2), bb([-R0 - 14, 48, 26], [-R0 + 4, 64, 230], D, 2), bb([-R0 - 16, -70, 210], [-R0 + 4, 70, 244], D, 3));
  for (const [ad, z] of [[160, 300], [90, 420], [20, 520], [-70, 200]] as const) {
    const a = rad(ad), c = Math.cos(a), s = Math.sin(a), r = R0 - (R0 - R1) * (z / 680);
    P.push(translate(rotateZ(bb([-6, -9, -34], [6, 9, 34], "Westhills_Dark"), ad), [c * (r - 2), s * (r - 2), z]));
  }
  // the fallen stones and the lantern's dome
  for (let k = 0; k < 12; k++) {
    const a = rad(150 + rnd() * 80), d = R0 + 40 + rnd() * 160;
    P.push(translate(rotateZ(box([38 + rnd() * 20, 30 + rnd() * 16, 26 + rnd() * 12], [0, 0, 12], k % 3 ? S : D, 4), rnd() * 90), [Math.cos(a) * d, Math.sin(a) * d, -4 + (k % 4) * 8]));
  }
  const dome = translate(rotateY(lathe([[92, 0], [88, 20], [70, 50], [40, 70], [10, 78], [0, 80]], 12, "CopperGreen"), 70), [-60, -R0 - 140, 50]);
  P.push(dome);
  for (let k = 0; k < 6; k++) P.push(cylinderBetween([-60 + (k - 3) * 12, -R0 - 120, 4], [-40 + (k - 3) * 18, -R0 - 40, 50 + k * 8], 2.5, 4, "IronDark"));
  return merge(...P, coverTop(merge(...P.slice(0, 3)), "Westhills_Lichen", { amount: 0.4, thick: 1.5, seed: 2207, patches: 0.4 }));
}

// Spray off the rocks: a sheet of foam on the sea and plumes of spray thrown up, drops flying.
// It stands with its foam at the sea's surface (sink it 12 cm when the ground there is the sea's).
function seaSpray(): Geo {
  const P: Geo[] = [], rnd = seeded(2301);
  for (let k = 0; k < 7; k++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 140;
    P.push(ellipsoid([70 + rnd() * 70, 50 + rnd() * 60, 6], [Math.cos(a) * d, Math.sin(a) * d, 2], "Westhills_Foam", 8));
  }
  for (const [x, y, s] of [[0, 0, 1], [70, 60, 0.75], [-60, 40, 0.6]] as const) {
    P.push(ellipsoid([50 * s, 46 * s, 60 * s], [x, y, 40 * s], "Westhills_Foam", 8));
    P.push(ellipsoid([80 * s, 70 * s, 90 * s], [x + 10, y, 130 * s], "Westhills_Spray", 9), ellipsoid([90 * s, 80 * s, 80 * s], [x + 30, y - 10, 230 * s], "Westhills_Spray", 9));
    P.push(ellipsoid([60 * s, 60 * s, 50 * s], [x + 50, y - 10, 310 * s], "Westhills_Spray", 8));
    for (let k = 0; k < 8; k++) P.push(sphereCenter(5 + rnd() * 6, [x + (rnd() - 0.3) * 160 * s, y + (rnd() - 0.5) * 140 * s, (120 + rnd() * 220) * s], "Westhills_Foam", 5));
  }
  return merge(...P);
}

// Storm rocks: black rocks the sea breaks over, jagged on top, wet and weedy at their foot, white
// with the birds' leavings above; a ring of foam where they meet the water. They stand on the sea
// bed (their foot 1.2 m under the item's base), so they rise out of the sea or off a shore alike.
function stormRocks(): Geo {
  const P: Geo[] = [];
  for (const [x, y, w, d, h, seed, a] of [[0, 0, 260, 200, 420, 2401, 0], [150, 110, 190, 150, 260, 2403, 40], [-140, 90, 150, 120, 200, 2405, 70], [60, -150, 130, 110, 150, 2407, 20], [-110, -120, 110, 90, 110, 2409, 60]] as const) {
    const base = translate(rotateZ(rock([w * 1.25, d * 1.25, 180], 0.4, seed + 50, "Westhills_SeaRockWet"), a), [x, y, -120]);
    const top = translate(rotateZ(rock([w, d, h], 0.48, seed, "Westhills_SeaRock"), a), [x, y, -110]);
    P.push(base, top, coverTop(base, "Westhills_Weed", { amount: 0.4, thick: 2, seed, patches: 0.6 }), coverTop(top, "Westhills_Guano", { amount: 0.22, thick: 1.5, seed: seed + 1, patches: 0.5 }));
  }
  P.push(translate(scale(torus(210, 40, 18, 5, "Westhills_Foam"), [1, 0.85, 0.2]), [10, -10, -11]));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    P.push(ellipsoid([60, 40, 12], [Math.cos(a) * 250, Math.sin(a) * 200, -8], "Westhills_Foam", 7));
  }
  return merge(...P);
}

export const KIT: Kit = {
  id: "westhills",
  name: "เนินเขาและนาขั้นบันได",
  region: "ตะวันตกสุดของทวีป",
  desc: "เนินลอนคลื่นใต้หิมะบางกับวงหินโบราณ นาขั้นบันไดน้ำขังกับกังหันน้ำไม้ไผ่ และแหลมสุดทวีปที่ศาลมังกรทะเลเฝ้าซากเรือใหญ่",
  ground: "grass",
  sea: true,
  items: [
    { id: "stone_circle", name: "วงหินบนเนิน", make: stoneCircle, tags: ["landmark", "magic"] },
    { id: "drystone_wall", name: "กำแพงหินแห้ง (3 ม.)", make: drystoneWall, tags: ["wall"] },
    { id: "shepherd_bothy", name: "กระท่อมคนเลี้ยงสัตว์", make: shepherdBothy, tags: ["building"] },
    { id: "cattle_pen", name: "คอกวัวกำแพงหิน", make: cattlePen, tags: ["fence", "farm"] },
    { id: "highland_cow", name: "วัวขนยาวไฮแลนด์", make: highlandCow, tags: ["animal"] },
    { id: "heather", name: "พุ่มเฮเทอร์", make: heather, tags: ["plant", "ground"] },
    { id: "gorse", name: "พุ่มกอร์สดอกเหลือง", make: gorse, tags: ["plant"] },
    { id: "ragged_pine", name: "ต้นสนลู่ลม", make: raggedPine, tags: ["plant", "tree"] },
    { id: "paddy", name: "นาข้าวน้ำขัง (5.6x4.8 ม.)", make: paddy, tags: ["ground", "farm"] },
    { id: "terrace_stairs", name: "บันไดหินขึ้นนา (6 ม. สูง 2 ม.)", make: terraceStairs, tags: ["ground", "stairs"] },
    { id: "farm_house", name: "บ้านชาวนาหลังคางอน", make: farmHouse, tags: ["building"] },
    { id: "water_buffalo", name: "ควาย", make: waterBuffalo, tags: ["animal"] },
    { id: "buffalo_pen", name: "คอกควายรั้วไผ่", make: buffaloPen, tags: ["fence", "farm"] },
    { id: "rice_scarecrow", name: "หุ่นไล่กาหมวกงอบ", make: riceScarecrow, tags: ["decor", "farm"] },
    { id: "bamboo_waterwheel", name: "กังหันน้ำไม้ไผ่", make: bambooWaterwheel, tags: ["landmark", "farm"] },
    { id: "bamboo_channel", name: "รางน้ำไม้ไผ่ (4 ม.)", make: bambooChannel, tags: ["farm"] },
    { id: "village_shrine", name: "ศาลเจ้าที่ประจำหมู่บ้าน", make: villageShrine, tags: ["shrine", "landmark"] },
    { id: "dragon_gate", name: "ซุ้มประตูมังกรทะเล", make: dragonGate, tags: ["gate", "landmark"] },
    { id: "dragon_altar", name: "แท่นบูชามังกรทะเล", make: dragonAltar, tags: ["landmark", "magic"] },
    { id: "great_wreck", name: "ซากเรือใหญ่บนแนวหิน", make: greatWreck, tags: ["wreck", "landmark"] },
    { id: "broken_beacon", name: "หอไฟสัญญาณพัง", make: brokenBeacon, tags: ["tower", "ruin"] },
    { id: "sea_spray", name: "ละอองคลื่นซัดหิน", make: seaSpray, tags: ["decor", "ground"] },
    { id: "storm_rocks", name: "โขดหินรับพายุ", make: stormRocks, tags: ["rock"] },
  ],
  // A corner of each of the three fields, side by side down to the sea (-Y): the stone circle on
  // the downs with its walls, the bothy and the fold of cattle; paddies and a farmhouse, the
  // buffalo, the water wheel and its channel, the village shrine; on the shore the dragon gate and
  // altar, a broken beacon, and out on the reef the wreck among storm rocks and spray.
  sample(put) {
    // the downs (north, +X)
    put("stone_circle", [1250, 1150, 0], 0, 0.8);
    for (let y = -1950; y <= 1950; y += 300) if (y < 200 || y > 600) put("drystone_wall", [2050, y, 0], 0);
    for (let x = 1100; x <= 1900; x += 300) put("drystone_wall", [x, 200, 0], 90);
    put("shepherd_bothy", [1500, -400, 0], 0);
    put("cattle_pen", [1500, -1500, 0], 0, 0.85);
    put("highland_cow", [1450, -1450, 0], 30);
    put("highland_cow", [1620, -1650, 0], 160);
    put("highland_cow", [700, -900, 0], -60);
    for (const [x, y] of [[300, 1600], [800, 400], [1900, 700], [500, -300], [900, -1900], [200, 900]]) put("heather", [x, y, 0], x);
    for (const [x, y] of [[600, 1900], [400, 500], [1000, -1300], [1950, -700]]) put("gorse", [x, y, 0], y);
    put("ragged_pine", [500, 1100, 0], 200);
    put("ragged_pine", [1900, 1800, 0], 160, 0.8);
    // the terraces (west, +Y)
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) put("paddy", [-300 - i * 560, 500 + j * 480, 0], 0);
    put("rice_scarecrow", [-860, 980, 0], -20);
    put("farm_house", [-900, 1880, 0], 0, 0.85);
    put("village_shrine", [-1800, 2000, 0], -90, 0.9);
    put("water_buffalo", [-150, 1500, 0], -30);
    put("buffalo_pen", [-1800, -100, 0], 0, 0.8);
    put("water_buffalo", [-1800, 0, 0], 20);
    put("bamboo_waterwheel", [-200, -100, 0], 90, 0.8);
    put("bamboo_channel", [-200, 230, 0], 0);
    put("flora:Bamboo", [-200, 2000, 0], 0);
    put("flora:Bamboo", [400, 1800, 0], 40, 0.8);
    // the cape (south, -Y, by the sea)
    put("dragon_gate", [-600, -1200, 0], 0, 0.75);
    put("dragon_altar", [-1500, -1500, 0], 0, 0.7);
    put("broken_beacon", [400, -1700, 0], 0, 0.8);
    put("great_wreck", [-400, -3600, 0], 70, 0.7);
    put("storm_rocks", [-1700, -2700, 0], 0);
    put("storm_rocks", [1200, -2600, 0], 70, 0.8);
    put("sea_spray", [-1500, -2450, -12], 0);
    put("sea_spray", [1000, -2400, -12], 90, 0.8);
    put("sea_spray", [-900, -2350, -12], 40, 0.7);
    put("ragged_pine", [-100, -1900, 0], -90, 0.9);
  },
};
