// The southern jungle and the coast round the port of Yodia (the fields ป่าดิบแดนใต้ and
// ชายฝั่งป่าชายเลน): rainforest floor (mossy boulders, fallen trunks, rotting stumps, giant and tree
// ferns, elephant ears, reeds round the mud pools), a giant strangler fig hung with aerial roots
// and lianas, the overgrown ruins of an old laterite-and-sandstone city (a stepped temple with a
// collapsing prang and naga stairs, a great carved stone face, a gate, broken walls and
// columns), the ways through it (a plank bridge over a stream, an explorers' camp, trail signs);
// and the coast: mangroves on prop roots, nipa palms, boardwalks over the shallows, a junk
// wrecked on the beach, flotsam, fish-trap stakes, a sea stack and an old beacon tower.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front facing -X.
// The plants are leaf cards and fronds like the shared trees' (src/world3d/trees.ts, flora.ts),
// swaying in the same wind.

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, sphereCenter, torus, gableRoof, gableWall, rock, toThree,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial, material } from "../textures";
import { shrub, SHRUB_JUNGLE, limb, foliage, crownLobes, LeafCards, CANOPY, frond, canopyTint } from "../trees";
import type { CanopyLook, FoliageSpec } from "../trees";
import { fallenTrunk, stumpOf, coverTop, endGrain } from "../nature";
import { solid } from "./types";
import type { Kit, Put } from "./types";

// ---------- the jungle's own colours ----------
defineMaterial("Jungle_Moss", { map: "felt", tint: "#5a8a32", rough: 1 });
defineMaterial("Jungle_MossDark", { map: "felt", tint: "#3d6528", rough: 1 });
defineMaterial("Jungle_Laterite", { map: "stone", tint: "#a87056", bump: 2.5 }); // red laterite blocks
defineMaterial("Jungle_LateriteDark", { map: "stone", tint: "#86594a", bump: 2.5 });
defineMaterial("Jungle_RuinStone", { map: "sandstone", tint: "#aaa58a", bump: 2 }); // weathered sandstone
defineMaterial("Jungle_RuinGreen", { map: "stone", tint: "#8d9a72", bump: 2 }); // lichened carving
defineMaterial("Jungle_Dark", { tint: "#1d1b16", rough: 1 }); // doorways, hollows
defineMaterial("Jungle_Root", { map: "bark", tint: "#a09178", bump: 3 }); // pale fig roots
defineMaterial("Jungle_BarkPale", { map: "bark", tint: "#b3a68c", bump: 3 }); // rainforest giants
defineMaterial("Jungle_Vine", { map: "bark", tint: "#5b6431", bump: 1.5 }); // lianas
defineMaterial("Jungle_FernTrunk", { map: "bark", tint: "#4f3e2d", bump: 3 });
defineMaterial("Jungle_Rot", { map: "wood", tint: "#6c5139", bump: 1.5 }); // rotten heartwood
defineMaterial("Jungle_Fungus", { map: "felt", tint: "#e39e44", rough: 0.8 });
defineMaterial("Jungle_FungusPale", { map: "felt", tint: "#efe0bc", rough: 0.8 });
defineMaterial("Jungle_Leaf", { map: "felt", tint: "#3c8a2c", rough: 0.5 }); // big glossy leaves
defineMaterial("Jungle_LeafPale", { map: "felt", tint: "#86bd52", rough: 0.6 });
defineMaterial("Jungle_Stem", { map: "felt", tint: "#6a983a", rough: 0.8 });
defineMaterial("Jungle_Reed", { map: "felt", tint: "#86a24a", rough: 0.9 });
defineMaterial("Jungle_ReedDry", { map: "felt", tint: "#bba86a", rough: 0.9 });
defineMaterial("Jungle_Cattail", { map: "felt", tint: "#6b4428", rough: 1 });
defineMaterial("Jungle_Mud", { tint: "#5d4a2f", rough: 0.22, opacity: 0.97 }); // mud pools (a water sheet)
defineMaterial("Jungle_CliffMoss", { map: "crag", tint: "#7f8a68", bump: 4 }); // jungle cliffs (the fields' rock faces)
defineMaterial("Jungle_Stream", { tint: "#3f6b5a", rough: 0.08, opacity: 0.9 }); // jungle streams (a water sheet)
defineMaterial("Jungle_Brackish", { tint: "#52806c", rough: 0.08, opacity: 0.9 }); // mangrove lagoons (a water sheet)
defineMaterial("Jungle_MudBank", { map: "adobe", tint: "#6f5739", bump: 1 });
defineMaterial("Jungle_Sand", { map: "snow", tint: "#e8d4a2", rough: 0.95 });
defineMaterial("Jungle_Driftwood", { map: "wood", tint: "#bdb3a2", bump: 1.5 });
defineMaterial("Jungle_MangroveBark", { map: "bark", tint: "#6f604e", bump: 2.5 });
defineMaterial("Jungle_Hull", { map: "wood", tint: "#5f4b39", bump: 1.5 });
defineMaterial("Jungle_HullPale", { map: "wood", tint: "#8d7c66", bump: 1.5 });
defineMaterial("Jungle_Barnacle", { map: "stone", tint: "#d3ccb9", bump: 2 });
defineMaterial("Jungle_Weed", { map: "felt", tint: "#4f6630", rough: 1 });
defineMaterial("Jungle_Canvas", { map: "fabric", tint: "#c0ae80", rough: 1 });
defineMaterial("Jungle_SailRag", { map: "fabric", tint: "#bfae8a", rough: 1 });
defineMaterial("Jungle_Net", { map: "fabric", tint: "#5b6f57", rough: 1, opacity: 0.8 });
defineMaterial("Jungle_SeaRock", { map: "crag", tint: "#8a8276", bump: 4 }); // natural rock (not masonry)
defineMaterial("Jungle_Rock", { map: "crag", tint: "#aaa392", bump: 4 });
defineMaterial("Jungle_RockMoss", { map: "crag", tint: "#949e7c", bump: 4 });
defineMaterial("Jungle_Ember", { tint: "#ff7a2a", rough: 1, glow: "#ff5a10", glowI: 1.3 });

// ---------- helpers ----------
const D = 180 / Math.PI;
type Crown = [number, number, number, number, number, number];
const ZUP = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const polar = (a: number, r: number, z: number): V3 => [Math.cos(a) * r, Math.sin(a) * r, z];

// meshes of a Geo plus any leaf or frond meshes
function group(geo: Geo, ...extra: (THREE.Object3D | null)[]): THREE.Group {
  const g = toThree(geo, material);
  for (const e of extra) if (e) g.add(e);
  return g;
}

// leafy crowns (trees.ts foliage): each crown a big lobe and a few smaller ones round its skin,
// lumpy leafy cores inside, the cards one swaying mesh; `clip` keeps them in the item's box
interface Canopy { core: Geo; mesh: THREE.Mesh | null }
function canopy(crowns: Crown[], leaf: number, seed: number, look: CanopyLook, o: Partial<FoliageSpec> = {}, clip?: { min: V3; max: V3 }): Canopy {
  const cards = new LeafCards();
  cards.clip = clip ?? null;
  const { lobes, details } = crownLobes(crowns, seeded(seed));
  const core = foliage({ seed, lobes, details, leaf, look, ...o }, cards);
  return { core, mesh: cards.count ? cards.mesh(look.card) : null };
}
// leaves along the lianas: a few heart-shaped leaves hanging off the vine at each point
function vineLeaves(crowns: Crown[], seed: number, clip?: { min: V3; max: V3 }): THREE.Mesh | null {
  if (!crowns.length) return null;
  const cards = new LeafCards(), rnd = seeded(seed), UP = new THREE.Vector3(0, 0, 1);
  cards.clip = clip ?? null;
  for (const [cx, cy, cz, r] of crowns) {
    const n = 4 + Math.floor(rnd() * 3);
    for (let k = 0; k < n; k++) {
      const a = rnd() * Math.PI * 2, droop = 0.5 + rnd() * 0.7, L = r * (1.9 + rnd() * 0.8);
      const out = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
      const dir = out.clone().multiplyScalar(Math.cos(droop)).addScaledVector(UP, -Math.sin(droop)); // stalk -> tip
      const across = new THREE.Vector3(-Math.sin(a), Math.cos(a), 0).applyAxisAngle(dir, (rnd() - 0.5) * 0.8);
      const at = new THREE.Vector3(cx, cy, cz + (rnd() - 0.5) * r).addScaledVector(dir, L * 0.5 + 2);
      const sun = 0.15 + 0.5 * rnd();
      cards.add(at.toArray() as V3, dir, across, L, L * 0.72, out.clone().multiplyScalar(0.5).addScaledVector(UP, 0.8).normalize(), canopyTint(CANOPY.vine, sun));
    }
  }
  return cards.count ? cards.mesh("heart") : null;
}

// Fronds: leaf strips from `at` heading `yaw`, rising at `lift` (radians) and bending down by
// `droop` along their length, their halves folded down from the rib (trees.ts frond).
interface Frond { at: V3; yaw: number; lift: number; droop: number; len: number; wid: number; segs?: number; shade?: number }
const FROND_COLOURS: Record<string, [RGB3, RGB3]> = {
  jungleFern: [[34, 84, 34], [108, 176, 64]],
  jungleFernDry: [[96, 72, 40], [172, 142, 88]],
  frond: [[64, 104, 44], [150, 196, 84]],
};
type RGB3 = [number, number, number];
const lin = ([r, g, b]: RGB3, k: number) => new THREE.Color().setRGB((r * k) / 255, (g * k) / 255, (b * k) / 255, THREE.SRGBColorSpace).multiplyScalar(1.6);
function frondMesh(list: Frond[], key: string): THREE.Mesh | null {
  if (!list.length) return null;
  const cards = new LeafCards(), [c0, c1] = FROND_COLOURS[key] ?? FROND_COLOURS.frond;
  for (const f of list) {
    const k = f.shade ?? 1;
    frond(cards, { at: f.at, yaw: f.yaw, lift: f.lift, droop: f.droop, len: f.len, w: f.wid / 2, fold: 0.38, segs: f.segs ?? 6, base: lin(c0, k), tip: lin(c1, k) });
  }
  return cards.mesh("frond");
}
const fernMesh = (list: Frond[]) => frondMesh(list, "jungleFern");
// a clump of `n` fern fronds round a point
function fernClump(out: Frond[], at: V3, n: number, len: number, seed: number, o: { lift?: number; droop?: number; wid?: number } = {}): void {
  const rnd = seeded(seed);
  for (let i = 0; i < n; i++)
    out.push({ at, yaw: (i / n) * Math.PI * 2 + rnd() * 0.7, lift: (o.lift ?? 1.15) + (rnd() - 0.5) * 0.35, droop: o.droop ?? 1.9,
      len: len * (0.8 + rnd() * 0.35), wid: o.wid ?? len * 0.32, shade: 0.78 + rnd() * 0.22 });
}

// a smooth tapering tube through points (roots, lianas, limbs)
function tube(pts: V3[], r0: number, r1: number, mat: string, seg = 6): Geo {
  return limb(pts, r0, r1, mat, { seg, gnarl: r0 > 8 ? 0.4 : 0, seed: Math.round(pts[0][0] * 3 + pts[0][2]), step: Math.max(30, r0 * 3), maxRings: Math.round((pts.length - 1) * 1.5) + 1 });
}
// points along a line from a to b that sags `sag` in the middle
function sagPts(a: V3, b: V3, sag: number, n = 6): V3[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, p = lerp3(a, b, t);
    return [p[0], p[1], p[2] - sag * 4 * t * (1 - t)] as V3;
  });
}
// points along a quadratic curve a -> b bending toward c
function bend(a: V3, c: V3, b: V3, n = 6): V3[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1], u * u * a[2] + 2 * u * t * c[2] + t * t * b[2]] as V3;
  });
}
// A liana: a thin stem through points with leaf clumps along it (crowns for vineLeaves).
function liana(pts: V3[], r: number, geo: Geo[], crowns: Crown[], every = 2, leafR = 20): void {
  geo.push(tube(pts, r, r * 0.7, "Jungle_Vine", 5));
  for (let i = 1; i < pts.length; i += every) crowns.push([pts[i][0], pts[i][1], pts[i][2], leafR, leafR, leafR * 1.3]);
}
// A flat outline (in x, z) given thickness along y: wedges, buttress roots, pediments, a nose.
function slab(outline: [number, number][], thick: number, mat: string): Geo {
  const shape = new THREE.Shape(outline.map(([a, b]) => new THREE.Vector2(a, b)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: 3 });
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 100, uv.getY(i) / 100);
  geo.translate(0, 0, -thick / 2);
  geo.rotateX(Math.PI / 2);
  geo.clearGroups();
  return [{ geo: geo.index ? geo.toNonIndexed() : geo, mat }];
}
// A double-sided cloth over four corners, bulged most in its middle (sails, tarps, rags).
function cloth(bl: V3, br: V3, tl: V3, tr: V3, bulge: V3, mat: string, nu = 5, nv = 4, ragged = 0): Geo {
  const B = new THREE.Vector3(...bulge);
  const rnd = seeded(nu * 31 + nv * 7 + Math.round(bl[0] + br[2]));
  const P = (u: number, v: number): THREE.Vector3 => {
    const b = new THREE.Vector3(...lerp3(bl, br, u)), t = new THREE.Vector3(...lerp3(tl, tr, u));
    return b.lerp(t, v).addScaledVector(B, Math.sin(Math.PI * u) * Math.sin(Math.PI * v));
  };
  const w = Math.hypot(br[0] - bl[0], br[1] - bl[1], br[2] - bl[2]), h = Math.hypot(tl[0] - bl[0], tl[1] - bl[1], tl[2] - bl[2]);
  const pos: number[] = [], uv: number[] = [];
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nv; j++) {
      if (ragged && j === 0 && rnd() < ragged) continue; // torn away along the bottom edge
      const q = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => ({ p: P(a / nu, b / nv), u: ((a / nu) * w) / 100, v: ((b / nv) * h) / 100 }));
      for (const k of [0, 1, 2, 0, 2, 3, 0, 2, 1, 0, 3, 2]) {
        pos.push(q[k].p.x, q[k].p.y, q[k].p.z);
        uv.push(q[k].u, q[k].v);
      }
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return [{ geo, mat }];
}
// A rock with a cap of moss over its top: the same rock a little narrower and raised, so the moss
// shows only over its shoulders.
function mossy(size: V3, rough: number, seed: number, mat = "Jungle_RockMoss", moss = "Jungle_Moss", lift = 0.08): Geo {
  const g = rock(size, rough, seed, mat);
  return merge(g, coverTop(g, moss, { amount: 0.3 + lift * 2.5, thick: 2 + size[2] * 0.012, seed, grain: Math.max(20, size[0] * 0.2) }));
}
// a lumpy cushion of moss lying on a surface at p, about sx by sy across (half sizes), sz thick:
// three soft blobs run together
function pillow(p: V3, sx: number, sy: number, sz = 10, mat = "Jungle_Moss"): Geo {
  const rnd = seeded((Math.abs(Math.round(p[0] * 7 + p[1] * 3 + p[2])) % 997) + 1), g: Geo[] = [];
  for (let k = 0; k < 3; k++) {
    const c: V3 = [p[0] + (rnd() - 0.5) * sx * 0.7, p[1] + (rnd() - 0.5) * sy * 0.7, p[2] - sz * 0.25];
    g.push(translate(scale(sphereCenter(1, [0, 0, 0], k === 1 ? "Jungle_MossDark" : mat, 10), [sx * (0.6 + rnd() * 0.25), sy * (0.6 + rnd() * 0.25), sz * (0.8 + rnd() * 0.5)]), c));
  }
  return merge(...g);
}
// bracket fungi stepping up a trunk's side at `p`, facing `yaw` (radians)
function brackets(p: V3, yaw: number, n = 3, r = 12, mat = "Jungle_Fungus"): Geo {
  const g: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const rr = r * (1 - i * 0.18), q: V3 = [p[0] + Math.cos(yaw) * rr * 0.4, p[1] + Math.sin(yaw) * rr * 0.4 + (i % 2 ? 8 : -6), p[2] + i * 13];
    g.push(translate(scale(cylinderAt({ radius: 1, height: 1, segments: 10, bottom: [0, 0, 0] }, mat), [rr, rr * 1.15, 4]), q));
  }
  return merge(...g);
}
// a squared stone or laterite block, a little out of true
function block(size: V3, at: V3, mat: string, yaw = 0, tilt = 0): Geo {
  return translate(rotateZ(rotateY(boxAt(size, [0, 0, 0], mat, 3), tilt), yaw), at);
}
// a box between two corners given in any order
const bb = (a: V3, b: V3, mat: string, bevel = 0): Geo =>
  boxBounds([Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2])], [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])], mat, bevel);
// A square with stepped-in corners (the redented plan of a Khmer tower), half-size s, the corners
// stepped in by r, from z0 up h.
function redent(s: number, r: number, z0: number, h: number, mat: string): Geo {
  return merge(
    boxBounds([-s, -s + r, z0], [s, s - r, z0 + h], mat, 2),
    boxBounds([-s + r, -s, z0], [s - r, s, z0 + h], mat, 2),
    boxBounds([-s + r / 2, -s + r / 2, z0], [s - r / 2, s - r / 2, z0 + h], mat, 2),
  );
}
// A run of masonry along Y from y0 to y1, x0..x1 deep, courses `ch` high in running bond; the
// number of courses standing at each block from `high(y)` (ruins); mats in turn.
function masonry(x0: number, x1: number, y0: number, y1: number, z0: number, ch: number, high: (y: number) => number, mats: string[], seed: number, len = 110): Geo {
  const rnd = seeded(seed), g: Geo[] = [];
  for (let c = 0; ; c++) {
    let y = y0, any = false;
    const first = c % 2 ? len * 0.5 : len;
    for (let k = 0; y < y1 - 1; k++) {
      const l = Math.min(k === 0 ? first : len * (0.8 + rnd() * 0.4), y1 - y), mid = y + l / 2;
      if (c < high(mid)) {
        const jx = (rnd() - 0.5) * 6;
        g.push(boxBounds([x0 + jx, y + 1.5, z0 + c * ch], [x1 + jx, y + l - 1.5, z0 + (c + 1) * ch - 1], mats[(c + k) % mats.length], 3));
        any = true;
      }
      y += l;
    }
    if (!any || c > 40) break;
  }
  return merge(...g);
}

// ================= the forest floor =================

// a boulder with moss over its top, smaller stones and ferns at its foot (3.2 m)
function boulderMossy(): THREE.Object3D {
  const fr: Frond[] = [];
  fernClump(fr, [-150, 70, 0], 6, 75, 3);
  fernClump(fr, [110, -150, 0], 5, 60, 4);
  return group(merge(
    mossy([320, 270, 210], 0.45, 31),
    translate(mossy([150, 125, 95], 0.5, 32, "Jungle_Rock"), [-175, 95, 0]),
    translate(rock([95, 80, 60], 0.5, 33, "Jungle_RockMoss"), [150, -105, 0]),
    translate(rock([55, 48, 32], 0.5, 34, "Jungle_Rock"), [-110, -150, 0]),
  ), fernMesh(fr));
}

// a cluster of rocks of three sizes with pebbles (4 m)
function rockCluster(): THREE.Object3D {
  const fr: Frond[] = [];
  fernClump(fr, [60, 150, 0], 5, 55, 9, { lift: 0.9 });
  return group(merge(
    mossy([230, 200, 170], 0.5, 41, "Jungle_Rock"),
    translate(mossy([170, 150, 120], 0.5, 42), [120, -150, 0]),
    translate(rock([120, 100, 85], 0.55, 43, "Jungle_Rock"), [-150, 110, 0]),
    translate(rock([70, 60, 45], 0.5, 44, "Jungle_RockMoss"), [-130, -110, 0]),
    translate(rock([45, 40, 26], 0.5, 45, "Jungle_Rock", true), [200, 60, 0]),
    translate(rock([36, 30, 22], 0.5, 46, "Jungle_RockMoss", true), [-60, 190, 0]),
    translate(rock([30, 26, 18], 0.5, 47, "Jungle_Rock", true), [10, -220, 0]),
  ), fernMesh(fr));
}

// a great fallen trunk along Y (6.6 m): its root plate torn up at one end, the other broken
// off; moss on its back, bracket fungi, a stub of branch, ferns rooted on it
const ROT_END = endGrain("#9a7650");
function fallenLog(): THREE.Object3D {
  const g: Geo[] = [], fr: Frond[] = [];
  g.push(fallenTrunk({ seed: 61, len: 600, r: 48, bark: "BarkWarm", wood: ROT_END, roots: { soil: "Jungle_MudBank", cover: "Jungle_Moss" }, broken: true, stubs: 3, moss: "Jungle_Moss", mossAmount: 0.5 }));
  // a stone caught in the root plate, fungi down its front, ferns on its back and at its end
  g.push(translate(rock([50, 40, 40], 0.4, 62, "Jungle_Rock"), [40, -326, 70]));
  g.push(brackets([-50, -150, 30], Math.PI, 3, 13), brackets([-48, 40, 26], Math.PI, 2, 11), brackets([48, 160, 30], 0, 3, 12, "Jungle_FungusPale"));
  fernClump(fr, [0, -60, 90], 5, 70, 63, { lift: 1.0 });
  fernClump(fr, [-60, 260, 0], 5, 60, 64);
  return group(merge(...g), fernMesh(fr));
}

// a rotten stump on buttress roots with a broken, hollow top (1.4 m)
function stump(): THREE.Object3D {
  const g: Geo[] = [], fr: Frond[] = [];
  g.push(stumpOf({ seed: 71, r: 52, h: 92, bark: "BarkWarm", wood: ROT_END, broken: true, roots: 5, moss: "Jungle_Moss", mossAmount: 0.45 }));
  // the hollow inside the broken top
  g.push(translate(scale(sphereCenter(1, [0, 0, 0], "Jungle_Dark", 10), [30, 30, 8]), [0, 0, 84]));
  g.push(pillow([-20, 70, 4], 40, 30, 10));
  g.push(brackets([-56, -10, 26], Math.PI, 3, 14), brackets([10, -58, 40], -Math.PI / 2, 2, 11, "Jungle_FungusPale"));
  fernClump(fr, [70, -50, 0], 4, 55, 72);
  return group(merge(...g), fernMesh(fr));
}

// a giant fern: a crown of arching fronds round a few fiddleheads (3.4 m across)
function giantFern(): THREE.Object3D {
  const fr: Frond[] = [];
  fernClump(fr, [0, 0, 16], 14, 175, 81, { lift: 1.25, droop: 2.0, wid: 54 });
  const g: Geo[] = [sphereCenter(20, [0, 0, 10], "Jungle_MossDark", 8)];
  for (let i = 0; i < 3; i++) {
    const a = i * 2.2, p: V3 = [Math.cos(a) * 10, Math.sin(a) * 10, 0];
    const top: V3 = [p[0] * 2, p[1] * 2, 60 + i * 12];
    g.push(cylinderBetween(p, top, 2.6, 5, "Jungle_Stem"), translate(rotateX(torus(6, 2.6, 8, 4, "Jungle_Stem"), 90), [top[0], top[1], top[2] + 6]));
  }
  return group(merge(...g), fernMesh(fr));
}

// a tree fern: a shaggy trunk, a skirt of dead fronds, a crown of living ones (4.4 m)
function treeFern(): THREE.Object3D {
  const g: Geo[] = [], fr: Frond[] = [], dry: Frond[] = [], rnd = seeded(91);
  const trunk: V3[] = [[0, 0, 0], [8, 4, 110], [22, 0, 230], [28, -8, 330]];
  g.push(tube(trunk, 22, 15, "Jungle_FernTrunk", 8));
  for (let i = 1; i < 9; i++) {
    const t = i / 9, p = lerp3(trunk[Math.floor(t * 3)], trunk[Math.floor(t * 3) + 1], (t * 3) % 1);
    g.push(translate(torus(20 - t * 6, 4, 9, 4, "Jungle_FernTrunk"), p));
  }
  const top: V3 = [28, -8, 336];
  for (let i = 0; i < 13; i++) fr.push({ at: top, yaw: (i / 13) * Math.PI * 2 + rnd() * 0.4, lift: 0.75 + rnd() * 0.3, droop: 2.0, len: 200 + rnd() * 50, wid: 62, shade: 0.8 + rnd() * 0.2 });
  for (let i = 0; i < 9; i++) dry.push({ at: [top[0], top[1], top[2] - 20], yaw: (i / 9) * Math.PI * 2 + rnd(), lift: -1.0 - rnd() * 0.3, droop: 0.2, len: 120 + rnd() * 30, wid: 34, shade: 0.8 + rnd() * 0.2 });
  for (let i = 0; i < 4; i++) {
    const a = i * 1.6;
    g.push(translate(rotateZ(rotateX(torus(7, 2.8, 8, 4, "Jungle_Stem"), 90), a * D), [top[0] + Math.cos(a) * 8, top[1] + Math.sin(a) * 8, top[2] + 14]));
  }
  fernClump(fr, [0, 0, 0], 5, 70, 92, { lift: 0.9 });
  return group(merge(...g), fernMesh(fr), frondMesh(dry, "jungleFernDry"));
}

// elephant ears: big heart-shaped leaves on long stalks (2.4 m), each blade a cupped card bent
// down along its length
function elephantEar(): THREE.Object3D {
  const g: Geo[] = [], rnd = seeded(101), cards = new LeafCards();
  const UP = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rnd() * 0.5, r = 45 + rnd() * 45, z = 85 + rnd() * 75, L = 85 + rnd() * 45, W = L * 0.68;
    const tip: V3 = [Math.cos(a) * r, Math.sin(a) * r, z];
    g.push(tube([[Math.cos(a) * 6, Math.sin(a) * 6, 0], [Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3, z * 0.7], tip], 4, 2.6, "Jungle_Stem", 5));
    const pitch = ((28 + rnd() * 26) * Math.PI) / 180, out = new THREE.Vector3(Math.cos(a), Math.sin(a), 0), side = new THREE.Vector3(-Math.sin(a), Math.cos(a), 0);
    const dir = (p: number) => out.clone().multiplyScalar(Math.cos(p)).addScaledVector(UP, -Math.sin(p));
    const p0 = new THREE.Vector3(...tip), p1 = p0.clone().addScaledVector(dir(pitch - 0.25), L * 0.5), p2 = p1.clone().addScaledVector(dir(pitch + 0.35), L * 0.5);
    const rib = [p0, p1, p2], cup = W * 0.12;
    const edge = (p: THREE.Vector3, k: number, sd: number) => p.clone().addScaledVector(side, sd * W * 0.5 * k).addScaledVector(UP, -cup * k);
    const n = out.clone().multiplyScalar(0.3).addScaledVector(UP, 0.95).normalize();
    const pale = i % 3 === 0, base = new THREE.Color().setRGB(pale ? 0.17 : 0.06, pale ? 0.32 : 0.2, pale ? 0.07 : 0.04), tipC = new THREE.Color().setRGB(pale ? 0.3 : 0.12, pale ? 0.48 : 0.34, pale ? 0.12 : 0.07);
    const ks = [0.75, 1, 0.55];
    for (let k = 0; k < 2; k++) {
      const u0 = k / 2, u1 = (k + 1) / 2, c0 = base.clone().lerp(tipC, u0), c1 = base.clone().lerp(tipC, u1);
      cards.quad([rib[k], rib[k + 1], edge(rib[k + 1], ks[k + 1], 1), edge(rib[k], ks[k], 1)], [[u0, 0.5], [u1, 0.5], [u1, 1], [u0, 1]], n, [c0, c1, c1, c0]);
      cards.quad([edge(rib[k], ks[k], -1), edge(rib[k + 1], ks[k + 1], -1), rib[k + 1], rib[k]], [[u0, 0], [u1, 0], [u1, 0.5], [u0, 0.5]], n, [c0, c1, c1, c0]);
    }
  }
  g.push(sphereCenter(14, [0, 0, 4], "Jungle_Stem", 8));
  return group(merge(...g), cards.mesh("heart"));
}

// a tuft of reeds and cattails for the edge of a pool (2 m)
function reeds(): Geo {
  const g: Geo[] = [], rnd = seeded(111);
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 70, x = Math.cos(a) * d, y = Math.sin(a) * d;
    const h = 100 + rnd() * 110, lean = 0.12 + rnd() * 0.3;
    g.push(cylinderBetween([x, y, -12], [x + Math.cos(a) * h * lean, y + Math.sin(a) * h * lean, h], 2.4, 3, rnd() < 0.3 ? "Jungle_ReedDry" : "Jungle_Reed", 0.4));
  }
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 50, x = Math.cos(a) * d, y = Math.sin(a) * d, h = 130 + rnd() * 60;
    const top: V3 = [x + Math.cos(a) * 12, y + Math.sin(a) * 12, h];
    g.push(cylinderBetween([x, y, -12], top, 1.6, 4, "Jungle_Reed", 1.2));
    g.push(cylinderBetween([top[0], top[1], top[2] - 30], [top[0], top[1], top[2] - 4], 4.5, 6, "Jungle_Cattail", 4));
  }
  return merge(...g);
}

// A giant strangler fig (landmark, 14 m tall): plank buttresses, a trunk of twisted stems, wide
// limbs hung with aerial roots and lianas, a dark spreading crown.
function stranglerFig(): THREE.Object3D {
  const g: Geo[] = [], vineC: Crown[] = [], fr: Frond[] = [], rnd = seeded(121);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 360 + rnd() * 25, L = 300 + rnd() * 160, H = 230 + rnd() * 90;
    g.push(rotateZ(translate(slab([[0, 0], [0, H], [L * 0.18, H * 0.62], [L * 0.45, H * 0.26], [L, 0]], 26, "Jungle_Root"), [40, 0, -4]), a));
  }
  g.push(limb([[0, 0, 0], [6, -4, 400], [0, 0, 790]], 92, 62, "Jungle_Root", { seg: 12, flare: 0.25, roots: 8, gnarl: 1, seed: 121, step: 90 }));
  for (let k = 0; k < 6; k++) {
    const a0 = (k / 6) * Math.PI * 2, pts: V3[] = [];
    for (let i = 0; i <= 7; i++) {
      const t = i / 7, a = a0 + t * 1.6;
      pts.push([Math.cos(a) * (82 - t * 22), Math.sin(a) * (82 - t * 22), t * 820]);
    }
    g.push(tube(pts, 30, 20, "Jungle_Root", 8));
  }
  // limbs, each hung with aerial roots, some reaching the ground
  const crowns: Crown[] = [[0, 0, 1180, 430, 420, 170]];
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.4 + rnd() * 0.4, R = 420 + rnd() * 140;
    const base = polar(a, 40, 760 + rnd() * 60), mid = polar(a + 0.15, R * 0.55, 930 + rnd() * 50), tip = polar(a + 0.25, R, 1000 + rnd() * 80);
    g.push(tube([base, mid, tip], 26, 9, "Jungle_Root", 7));
    crowns.push([tip[0], tip[1], tip[2] + 60, 250, 240, 130]);
    for (let j = 0; j < 4; j++) {
      const p = lerp3(mid, tip, j / 3), reach = rnd() < 0.45 ? -6 : p[2] * (0.25 + rnd() * 0.4);
      g.push(tube([p, [p[0] + (rnd() - 0.5) * 30, p[1] + (rnd() - 0.5) * 30, (p[2] + reach) / 2], [p[0] + (rnd() - 0.5) * 40, p[1] + (rnd() - 0.5) * 40, reach]], 6, 3, "Jungle_Root", 5));
    }
    // a liana looping down from the limb to the ground
    if (k % 2 === 0) {
      const foot = polar(a + 0.5, R * 0.9, 0);
      liana(bend(tip, [(tip[0] + foot[0]) / 2, (tip[1] + foot[1]) / 2, tip[2] * 0.2], foot, 7), 5, g, vineC);
    }
  }
  for (const [x, y, s] of [[180, 120, 52], [-160, -170, 53], [120, -210, 54]]) g.push(translate(mossy([90, 80, 60], 0.5, s), [x, y, 0]));
  fernClump(fr, [-230, 90, 0], 7, 110, 125);
  fernClump(fr, [200, -220, 0], 6, 95, 126);
  fernClump(fr, [40, 260, 0], 6, 100, 127);
  const can = canopy(crowns, 84, 128, CANOPY.deep, { density: 1.05 }, { min: [-732, -793, 0], max: [782, 702, 1452] });
  return group(merge(...g, can.core), can.mesh, vineLeaves(vineC, 129), fernMesh(fr));
}

// A rainforest giant draped in lianas (11 m): plank buttresses, a tall pale trunk with a liana
// twisting up it, high limbs with bird's-nest ferns, loops of liana hanging from them to the
// ground, a broad crown.
function vineTree(): THREE.Object3D {
  const g: Geo[] = [], vineC: Crown[] = [], fr: Frond[] = [], rnd = seeded(301);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * 360 + rnd() * 30, L = 150 + rnd() * 90, H = 150 + rnd() * 60;
    g.push(rotateZ(translate(slab([[0, 0], [0, H], [L * 0.25, H * 0.45], [L, 0]], 16, "Jungle_BarkPale"), [26, 0, -4]), a));
  }
  const top: V3 = [24, -10, 820];
  g.push(tube([[0, 0, 0], [8, -4, 400], top], 40, 26, "Jungle_BarkPale", 10));
  // a liana twisting up the trunk
  const helix: V3[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16, a = t * Math.PI * 5, r = 42 - t * 14;
    helix.push([Math.cos(a) * r + t * 24, Math.sin(a) * r - t * 10, t * 780]);
  }
  liana(helix, 4, g, vineC, 2, 18);
  const crowns: Crown[] = [[top[0], top[1], 1080, 360, 340, 140]];
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.5, R = 260 + rnd() * 90;
    const base: V3 = [top[0] * 0.9, top[1] * 0.9, 740 + k * 25], tip = polar(a, R, 960 + rnd() * 60);
    g.push(tube([base, [tip[0] * 0.5, tip[1] * 0.5, (base[2] + tip[2]) / 2 + 30], tip], 16, 6, "Jungle_BarkPale", 7));
    crowns.push([tip[0], tip[1], tip[2] + 50, 260, 240, 115]);
    fernClump(fr, [tip[0] * 0.45, tip[1] * 0.45, (base[2] + tip[2]) / 2 + 40], 7, 55, 302 + k, { lift: 0.7, droop: 1.6, wid: 22 });
    // lianas: one hanging in a loop, one down to the ground
    const foot = polar(a + 0.4, R * 1.15, -4);
    liana(bend(tip, [(tip[0] + foot[0]) / 2 + 30, (tip[1] + foot[1]) / 2, tip[2] * 0.25], foot, 8), 4, g, vineC, 2, 20);
    const next = polar(a + Math.PI / 2, R * 0.8, 920);
    liana(sagPts(lerp3(base, tip, 0.6), next, 260 + rnd() * 150, 8), 3, g, vineC, 2, 18);
  }
  fernClump(fr, [-90, 60, 0], 6, 90, 308);
  const can = canopy(crowns, 78, 309, CANOPY.deep, {}, { min: [-546, -560, 0], max: [536, 535, 1297] });
  return group(merge(...g, can.core), can.mesh, vineLeaves(vineC, 310), fernMesh(fr));
}

// ================= the ruins =================

// The porch of a tower face (facing -X, its doorway open or a false door), for the body at half
// size s from z0.
function porch(s: number, z0: number, open: boolean): Geo {
  const x = -s - 80;
  const flame = rotateZ(slab([[-100, 0], [100, 0], [80, 50], [44, 92], [14, 132], [0, 156], [-14, 132], [-44, 92], [-80, 50]], 16, "Jungle_RuinGreen"), 90);
  return merge(
    boxBounds([x, -96, z0], [-s + 10, 96, z0 + 262], "Jungle_RuinStone", 2.5),
    boxBounds([x - 10, -106, z0 + 262], [-s + 10, 106, z0 + 280], "Jungle_RuinGreen", 2),
    translate(flame, [x - 2, 0, z0 + 280]),
    boxBounds([x - 3, -50, z0], [x + 8, 50, z0 + 210], open ? "Jungle_Dark" : "Jungle_RuinGreen"),
    boxBounds([x - 12, -90, z0 + 208], [x + 2, 90, z0 + 240], "Jungle_RuinGreen", 2),
    cylinderAt({ radius: 9, height: 206, segments: 8, bottom: [x - 7, -64, z0] }, "Jungle_RuinGreen"),
    cylinderAt({ radius: 9, height: 206, segments: 8, bottom: [x - 7, 64, z0] }, "Jungle_RuinGreen"),
    boxBounds([x - 2, -100, z0 - 2], [-s, 100, z0 + 12], "Jungle_RuinGreen", 2),
  );
}
// a little corner shrine tower, standing or fallen into rubble
function shrine(fallen: boolean, seed: number): Geo {
  if (fallen)
    return merge(
      boxBounds([-55, -55, 0], [55, 55, 34], "Jungle_RuinStone", 2.5), translate(rock([110, 100, 70], 0.6, seed, "Jungle_RuinStone"), [0, 0, 30]),
      block([44, 32, 30], [60, 40, 0], "Jungle_RuinStone", 30, 8), block([40, 30, 26], [-50, 70, 0], "Jungle_RuinGreen", -20, -10),
    );
  return merge(
    boxBounds([-55, -55, 0], [55, 55, 34], "Jungle_RuinStone", 2.5),
    redent(42, 12, 34, 120, "Jungle_RuinStone"), redent(48, 12, 154, 12, "Jungle_RuinGreen"),
    redent(34, 10, 166, 46, "Jungle_RuinStone"), redent(26, 8, 212, 36, "Jungle_RuinStone"),
    cylinderAt({ rBot: 18, rTop: 3, height: 50, segments: 8, bottom: [0, 0, 248] }, "Jungle_RuinGreen"),
    boxBounds([-46, -24, 34], [-40, 24, 124], "Jungle_Dark"),
  );
}
// A naga balustrade along the side of a stair from foot `a` up to `b`, its seven... five-headed
// hood rearing at the foot, facing -X.
function naga(a: V3, b: V3): Geo {
  const g: Geo[] = [tube([a, lerp3(a, b, 0.5), b], 14, 12, "Jungle_RuinGreen", 8)];
  for (const t of [0.15, 0.4, 0.65, 0.9]) {
    const p = lerp3(a, b, t);
    g.push(boxAt([22, 22, p[2] - 14], [p[0], p[1], 0], "Jungle_RuinStone", 2));
  }
  const neck: V3 = [a[0] - 30, a[1], a[2] + 70];
  g.push(tube([[a[0] + 10, a[1], a[2] - 4], [a[0] - 20, a[1], a[2] + 20], neck], 15, 13, "Jungle_RuinGreen", 8));
  const fan: [number, number][] = [];
  for (let i = 0; i <= 8; i++) fan.push([Math.cos((i / 8) * Math.PI) * 60, Math.sin((i / 8) * Math.PI) * 60 * 1.1]);
  g.push(translate(rotateZ(slab(fan, 14, "Jungle_RuinStone"), 90), [neck[0] + 6, neck[1], neck[2] - 20]));
  for (let i = 0; i < 5; i++) {
    const t = Math.PI * (0.15 + 0.175 * i), hp: V3 = [neck[0] - 6, neck[1] + Math.cos(t) * 52, neck[2] - 20 + Math.sin(t) * 58];
    g.push(sphereCenter(11, hp, "Jungle_RuinGreen", 8), cylinderBetween(hp, [hp[0] - 22, hp[1], hp[2] - 5], 8, 6, "Jungle_RuinGreen", 5));
  }
  return merge(...g);
}

// A temple mountain lost in the jungle (landmark, 15 x 16 m, 13 m to the tree on top): three
// laterite terraces, a stair up the front between naga balustrades, a sandstone prang with a
// doorway and three false doors, its top fallen in and a fig growing out of it whose roots grip
// one corner down to the ground; corner shrines (one fallen), rubble, moss, ferns and vines.
function ruinTemple(): THREE.Object3D {
  const g: Geo[] = [], vineC: Crown[] = [], fr: Frond[] = [], rnd = seeded(141);
  const tiers: [number, number, number][] = [[640, 0, 110], [510, 122, 110], [385, 244, 106]];
  for (const [s, z0, h] of tiers) {
    // a skin of blocks round each terrace (front and back full width, the sides between them)
    const run = (seed: number, y0: number, y1: number) => masonry(-s, -s + 40, y0, y1, z0, h / 2, () => 2, ["Jungle_Laterite", "Jungle_LateriteDark", "Jungle_Laterite"], seed, 160);
    g.push(run(140 + s, -s, s), rotateZ(run(141 + s, -s, s), 180), rotateZ(run(142 + s, -s + 42, s - 42), 90), rotateZ(run(143 + s, -s + 42, s - 42), 270));
    g.push(boxBounds([-s + 30, -s + 30, z0], [s - 30, s - 30, z0 + h], "Jungle_LateriteDark"));
    g.push(boxBounds([-s - 12, -s - 12, z0 + h - 6], [s + 12, s + 12, z0 + h + 12], "Jungle_RuinStone", 3));
  }
  const TOP = 362;
  // the front stair between naga balustrades
  const n = 12, rise = TOP / n, run = 38;
  for (let i = 0; i < n; i++) g.push(boxBounds([-395 - (i + 1) * run, -140, 0], [-395 - i * run, 140, TOP - i * rise], i % 3 ? "Jungle_RuinStone" : "Jungle_RuinGreen", 2));
  const foot = -395 - n * run;
  for (const s of [-1, 1]) {
    g.push(translate(slab([[foot, 0], [-395, 0], [-395, TOP + 30], [foot, 64]], 34, "Jungle_RuinStone"), [0, s * 157, 0]));
    g.push(naga([foot + 14, s * 157, 78], [-400, s * 157, TOP + 44]));
  }
  // the prang
  g.push(redent(245, 52, TOP, 58, "Jungle_RuinStone"), redent(256, 52, TOP + 52, 14, "Jungle_RuinGreen"));
  const B = TOP + 66;
  g.push(redent(198, 42, B, 330, "Jungle_RuinStone"));
  for (const z of [B + 110, B + 220]) g.push(redent(201, 42, z, 8, "Jungle_RuinGreen"));
  for (const h of [0, 90, 180, 270]) g.push(rotateZ(porch(198, B, h === 0), h));
  const tierS = [176, 142, 112];
  tierS.forEach((s, k) => {
    const z0 = B + 330 + k * 98;
    g.push(redent(s + 14, 34, z0, 14, "Jungle_RuinGreen"));
    if (k < 2) g.push(redent(s, 30, z0 + 14, 84, "Jungle_RuinStone"));
    else for (let j = 0; j < 7; j++) g.push(block([60, 50, 40 + rnd() * 50], [(rnd() - 0.5) * 160, (rnd() - 0.5) * 160, z0 + 14], "Jungle_RuinStone", rnd() * 40, (rnd() - 0.5) * 12));
    if (k < 2)
      for (const [cx, cy] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]])
        g.push(translate(rotateZ(cylinderAt({ rBot: 20, rTop: 2, height: 46, segments: 4, bottom: [0, 0, 0] }, "Jungle_RuinGreen"), 45), [cx * (s + 4), cy * (s + 4), z0 + 98]));
  });
  const crest = B + 330 + 2 * 98 + 14;
  g.push(translate(rock([200, 180, 90], 0.6, 142, "Jungle_RuinStone"), [-20, -30, crest]));
  // corner shrines on the second terrace; the +X +Y one fallen
  for (const [cx, cy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) g.push(translate(shrine(cx > 0 && cy > 0, 143), [cx * 452, cy * 452, 244]));
  // the fig on top and its roots down the +X +Y corner to the ground
  const crown = crest + 60;
  g.push(tube([[40, 60, crest - 20], [60, 90, crest + 60], [80, 110, crest + 150]], 26, 16, "Jungle_Root", 8));
  const roots: V3[][] = [
    [[60, 80, crest], [200, 200, B + 330], [205, 205, B + 140], [262, 262, TOP + 20], [395, 395, TOP + 14], [520, 520, 248], [650, 650, 124], [720, 700, -4]],
    [[30, 100, crest], [120, 205, B + 300], [130, 210, B + 60], [180, 400, TOP + 16], [260, 520, 250], [340, 650, 126], [380, 730, -4]],
    [[100, 40, crest], [205, 120, B + 280], [210, 140, B + 40], [400, 200, TOP + 14], [520, 270, 248], [650, 330, 124], [740, 360, -4]],
  ];
  roots.forEach((r, i) => g.push(tube(r, 20 - i * 3, 9, "Jungle_Root", 7)));
  for (const r of [[[180, 380, TOP + 10], [180, 520, 200], [170, 600, 0]], [[380, 160, TOP + 10], [520, 150, 200], [600, 140, 0]]] as V3[][]) g.push(tube(r, 9, 5, "Jungle_Root", 6));
  // rubble at the foot, more where the corner shrine fell
  for (let i = 0; i < 18; i++) {
    const a = rnd() * Math.PI * 2, d = 700 + rnd() * 110, near = i < 6;
    const x = near ? 560 + rnd() * 160 : Math.cos(a) * d, y = near ? 560 + rnd() * 160 : Math.sin(a) * d;
    if (x < -560 && Math.abs(y) < 260) continue;
    g.push(block([40 + rnd() * 40, 30 + rnd() * 30, 24 + rnd() * 24], [x, y, -3], rnd() < 0.5 ? "Jungle_Laterite" : "Jungle_RuinStone", rnd() * 90, (rnd() - 0.5) * 20));
  }
  g.push(translate(rock([180, 150, 80], 0.6, 144, "Jungle_Laterite"), [600, 660, 0]), translate(rock([130, 120, 60], 0.6, 145, "Jungle_LateriteDark"), [680, 480, 0]));
  // moss along the copings and on the stair
  for (let i = 0; i < 22; i++) {
    const [s, z0, h] = tiers[i % 3], side = Math.floor(rnd() * 4), t = (rnd() - 0.5) * 2 * s;
    const [x, y] = side === 0 ? [-s, t] : side === 1 ? [s, t] : side === 2 ? [t, -s] : [t, s];
    if (x < -s + 1 && Math.abs(y) < 180) continue;
    g.push(pillow([x, y, z0 + h + 12], side < 2 ? 30 : 60, side < 2 ? 60 : 30, 9));
  }
  // vines over the terrace fronts, lianas from the fig, ferns on the terraces
  for (const [x, y, z, len] of [[-397, -300, TOP + 10, 210], [-397, 280, TOP + 10, 260], [-522, -420, 248, 190], [-522, 380, 248, 220], [-652, -560, 124, 120], [397, -200, TOP + 10, 250], [-150, -397, TOP + 10, 240], [200, 397, TOP + 10, 200]] as [number, number, number, number][]) {
    const out = Math.abs(x) > Math.abs(y) ? [Math.sign(x) * 14, 0] : [0, Math.sign(y) * 14];
    liana([[x, y, z], [x + out[0], y + out[1], z - len * 0.5], [x + out[0] * 1.6, y + out[1] * 1.6, z - len]], 3, g, vineC, 1, 18);
  }
  liana(bend([140, 60, crown + 40], [380, -100, crown - 200], [520, -430, 248], 7), 4, g, vineC);
  for (const [x, y, z, s] of [[-470, -470, 122, 2], [460, -300, 244, 3], [-300, 460, 244, 4], [560, -560, 0, 5], [-700, 520, 0, 6], [300, -460, 122, 7], [-580, -330, 122, 8]] as [number, number, number, number][])
    fernClump(fr, [x, y, z], 6, 85, 150 + s);
  const can = canopy([[80, 110, crown + 130, 260, 240, 110], [-60, 170, crown + 80, 160, 150, 80], [190, -10, crown + 90, 160, 140, 80]], 66, 146, CANOPY.deep);
  return group(merge(...g, can.core), can.mesh, vineLeaves(vineC, 147), fernMesh(fr));
}

// A great carved stone face (landmark, 4 x 4 m, 6 m tall): blocks stacked into a serene head
// with closed eyes, a crown above, sunk to the chin in the forest floor; a fig root down one side.
function stoneFace(): THREE.Object3D {
  const g: Geo[] = [], vineC: Crown[] = [], fr: Frond[] = [], rnd = seeded(161);
  // the head: four courses of blocks
  const course = (z0: number, h: number, half: number, k: number) => {
    const mats = ["Jungle_RuinStone", "Jungle_RuinGreen"];
    for (let j = 0; j < 3; j++) {
      const y0 = -half + (2 * half * j) / 3, y1 = -half + (2 * half * (j + 1)) / 3;
      g.push(boxBounds([-140 + (rnd() - 0.5) * 6, y0 + 1.5, z0], [140, y1 - 1.5, z0 + h - 1.5], mats[(j + k) % 2], 3));
    }
  };
  course(0, 100, 175, 0);
  course(100, 110, 150, 1);
  course(210, 110, 150, 0);
  course(320, 100, 145, 1);
  // the face (on -X): a jewelled band over the brow, arched brows, closed eyes as dark curves
  // under heavy lids, a broad nose, full lips in a calm smile
  g.push(bb([-160, -146, 330], [-136, 146, 372], "Jungle_RuinGreen", 3));
  for (let i = -3; i <= 3; i++) g.push(sphereCenter(8, [-162, i * 38, 351], "Jungle_RuinStone", 6));
  const curve = (y0: number, y1: number, z: number, dip: number, x: number, r: number, mat: string): Geo => {
    const pts: V3[] = [0, 0.25, 0.5, 0.75, 1].map((t) => [x, y0 + (y1 - y0) * t, z - dip * Math.sin(Math.PI * t)]);
    return tube(pts, r, r, mat, 6);
  };
  for (const s of [-1, 1]) {
    g.push(curve(s * 22, s * 116, 318, -10, -146, 7, "Jungle_RuinStone"));
    g.push(curve(s * 28, s * 106, 288, -6, -144, 11, "Jungle_RuinStone"));
    g.push(curve(s * 30, s * 104, 272, 9, -151, 4.5, "Jungle_Dark"));
    // long-lobed ears
    g.push(bb([-40, s * 150, 150], [30, s * 176, 320], "Jungle_RuinStone", 3));
    g.push(bb([-30, s * 152, 100], [16, s * 172, 160], "Jungle_RuinGreen", 3));
  }
  g.push(slab([[-140, 180], [-202, 184], [-198, 200], [-156, 298], [-140, 298]], 66, "Jungle_RuinStone"));
  for (const s of [-1, 1]) g.push(sphereCenter(13, [-176, s * 32, 194], "Jungle_RuinStone", 8), sphereCenter(6, [-196, s * 16, 188], "Jungle_Dark", 6));
  g.push(curve(-56, 56, 170, 6, -150, 9, "Jungle_RuinStone"), curve(-40, 40, 146, 4, -148, 11, "Jungle_RuinStone"));
  g.push(curve(-62, 62, 162, 10, -158, 3.5, "Jungle_Dark"), translate(scale(sphereCenter(1, [0, 0, 0], "Jungle_RuinStone", 10), [14, 44, 26]), [-140, 0, 120]));
  // the crown: three tiers and a lotus bud, one corner broken off
  g.push(redent(150, 30, 420, 40, "Jungle_RuinStone"), redent(120, 26, 460, 50, "Jungle_RuinGreen"), redent(86, 20, 510, 44, "Jungle_RuinStone"));
  g.push(cylinderAt({ rBot: 46, rTop: 30, height: 30, segments: 10, bottom: [0, 0, 554] }, "Jungle_RuinGreen"), sphereCenter(30, [0, 0, 596], "Jungle_RuinStone", 10), cylinderAt({ rBot: 20, rTop: 2, height: 40, segments: 8, bottom: [0, 0, 616] }, "Jungle_RuinStone"));
  g.push(block([60, 50, 40], [-230, 200, 0], "Jungle_RuinStone", 25, 12), block([50, 44, 34], [180, -220, 0], "Jungle_RuinGreen", -30, -8), translate(rock([120, 100, 50], 0.5, 162, "Jungle_RuinStone"), [140, 230, 0]));
  // moss on the crown and shoulders, a root down the right side, a vine over the brow
  g.push(pillow([0, 0, 470], 120, 110, 12), pillow([60, -120, 420], 60, 40, 10), pillow([40, 150, 320], 40, 30, 10));
  g.push(tube([[60, 40, 640], [90, 130, 520], [60, 160, 430], [20, 168, 300], [-20, 200, 120], [-30, 260, -4]], 14, 7, "Jungle_Root", 7));
  g.push(tube([[60, 100, 560], [120, 152, 420], [130, 170, 200], [150, 240, -4]], 9, 5, "Jungle_Root", 6));
  liana([[-100, -150, 420], [-150, -156, 360], [-152, -150, 300], [-146, -160, 230]], 3, g, vineC, 1, 16);
  liana([[-120, 140, 410], [-150, 148, 340], [-146, 152, 260]], 3, g, vineC, 1, 14);
  fernClump(fr, [-200, -150, 0], 6, 90, 163);
  fernClump(fr, [-80, 210, 0], 5, 80, 164);
  fernClump(fr, [40, -40, 556], 4, 50, 165, { lift: 0.9 });
  return group(merge(...g), vineLeaves(vineC, 166), fernMesh(fr));
}

// a broken laterite wall, 6 m along Y (tiles end to end), 1.2 m thick, up to 2.6 m high
function ruinWall(): THREE.Object3D {
  const g: Geo[] = [], vineC: Crown[] = [], fr: Frond[] = [], rnd = seeded(171);
  const high = (y: number) => (Math.abs(y) > 240 ? 4 : y < -60 ? 5 : y < 40 ? 4 : y < 140 ? 1 : 2);
  g.push(masonry(-60, 60, -300, 300, 0, 50, high, ["Jungle_Laterite", "Jungle_LateriteDark", "Jungle_Laterite", "Jungle_RuinStone"], 172));
  g.push(boxBounds([-66, -240, 250], [66, -60, 266], "Jungle_RuinStone", 3));
  for (let i = 0; i < 9; i++) {
    const s = rnd() < 0.5 ? -1 : 1;
    g.push(block([50 + rnd() * 50, 40 + rnd() * 30, 30 + rnd() * 20], [s * (100 + rnd() * 70), -40 + rnd() * 250, -3], i % 3 ? "Jungle_Laterite" : "Jungle_RuinStone", rnd() * 90, (rnd() - 0.5) * 24));
  }
  g.push(pillow([-10, -170, 268], 44, 60, 9), pillow([10, 220, 202], 40, 44, 8), pillow([0, 110, 52], 36, 30, 7), pillow([-14, -10, 202], 34, 40, 7));
  liana([[-62, -200, 266], [-74, -190, 170], [-70, -205, 70]], 3, g, vineC, 1, 18);
  liana([[-62, -110, 260], [-72, -100, 150], [-68, -112, 60]], 3, g, vineC, 1, 17);
  liana([[62, 220, 200], [74, 230, 110], [70, 215, 30]], 3, g, vineC, 1, 17);
  fernClump(fr, [-110, 60, 0], 6, 80, 173);
  fernClump(fr, [0, 100, 52], 4, 55, 174, { lift: 0.9 });
  return group(merge(...g), vineLeaves(vineC, 175), fernMesh(fr));
}

// columns of a fallen gallery: one whole, one snapped, one lying in drums, a lintel slab (5 m)
function ruinPillars(): THREE.Object3D {
  const g: Geo[] = [], vineC: Crown[] = [], fr: Frond[] = [];
  const column = (x: number, y: number, h: number, capital: boolean) => {
    g.push(boxAt([76, 76, 28], [x, y, 0], "Jungle_RuinStone", 3), boxAt([62, 62, 12], [x, y, 28], "Jungle_RuinGreen", 2));
    g.push(translate(rotateZ(cylinderAt({ radius: 27, height: h, segments: 8, bottom: [0, 0, 40] }, "Jungle_RuinStone"), 22.5), [x, y, 0]));
    for (const z of [80, 40 + h * 0.6]) g.push(translate(torus(27, 4, 8, 4, "Jungle_RuinGreen"), [x, y, z]));
    if (capital) g.push(boxAt([70, 70, 16], [x, y, 40 + h], "Jungle_RuinGreen", 2), boxAt([86, 86, 22], [x, y, 56 + h], "Jungle_RuinStone", 3));
    else for (let i = 0; i < 6; i++) g.push(translate(rotateZ(boxAt([14, 22, 8 + ((i * 7) % 5) * 7], [22, 0, 38 + h], "Jungle_RuinStone"), i * 60 + 10), [x, y, 0]));
  };
  column(-60, -150, 260, true);
  column(80, 60, 150, false);
  for (const [y, l, r] of [[170, 70, 4], [240, 68, -3], [330, 80, 6]] as [number, number, number][]) g.push(rotateZ(cylinderBetween([-120, y - l / 2, 27], [-120, y + l / 2, 27], 27, 8, "Jungle_RuinStone"), r, [-120, y, 0]));
  g.push(rotateY(boxBounds([60, -120, 0], [210, -40, 34], "Jungle_RuinStone", 3), -24, [210, -80, 0]));
  g.push(translate(rotateX(rock([70, 60, 50], 0.4, 181, "Jungle_RuinGreen"), 0), [140, 180, 0]));
  g.push(pillow([-60, -150, 102 + 260 - 20], 40, 40, 8), pillow([-120, 240, 52], 40, 60, 8), pillow([80, 60, 200], 30, 30, 8));
  liana([[-44, -126, 320], [-28, -120, 220], [-36, -128, 110], [-30, -122, 30]], 3, g, vineC, 1, 17);
  fernClump(fr, [20, -40, 0], 6, 80, 182);
  fernClump(fr, [-210, 120, 0], 5, 70, 183);
  return group(merge(...g), vineLeaves(vineC, 184), fernMesh(fr));
}

// A ruined gate (gopura) of laterite and sandstone, its passage 3 m wide along X: piers of
// blocks, a carved lintel, a stepped crown half fallen, a fig on top gripping it with its roots.
function ruinGate(): THREE.Object3D {
  const g: Geo[] = [], vineC: Crown[] = [], fr: Frond[] = [], rnd = seeded(191);
  for (const s of [-1, 1]) {
    const y0 = s * 150, y1 = s * 280;
    g.push(masonry(-130, 130, Math.min(y0, y1), Math.max(y0, y1), 0, 60, () => 7, ["Jungle_Laterite", "Jungle_LateriteDark", "Jungle_Laterite"], 192 + s, 70));
    g.push(boxBounds([-125, Math.min(y0, y1) + 5, 0], [125, Math.max(y0, y1) - 5, 420], "Jungle_LateriteDark"));
    for (const x of [-138, 138]) g.push(cylinderAt({ radius: 11, height: 300, segments: 8, bottom: [x, s * 162, 0] }, "Jungle_RuinGreen"));
  }
  g.push(boxBounds([-145, -292, 420], [145, 292, 486], "Jungle_RuinStone", 3));
  for (const x of [-150, 150]) g.push(boxBounds([x - 6, -150, 428], [x + 6, 150, 478], "Jungle_RuinGreen", 2));
  // the crown: steps over the lintel, the +Y half fallen
  g.push(boxBounds([-120, -230, 486], [120, 230, 556], "Jungle_RuinStone", 3));
  g.push(boxBounds([-100, -180, 556], [100, 40, 616], "Jungle_RuinStone", 3), boxBounds([-80, -120, 616], [80, -10, 660], "Jungle_RuinGreen", 3));
  for (const x of [-124, 124]) g.push(translate(rotateZ(slab([[-140, 0], [140, 0], [100, 60], [50, 110], [0, 150], [-50, 110], [-100, 60]], 12, "Jungle_RuinGreen"), 90), [x, -40, 486]));
  for (let i = 0; i < 10; i++) g.push(block([50 + rnd() * 30, 40 + rnd() * 20, 30 + rnd() * 20], [(rnd() - 0.5) * 300, 300 + rnd() * 160, -3], i % 2 ? "Jungle_RuinStone" : "Jungle_Laterite", rnd() * 90, (rnd() - 0.5) * 20));
  g.push(translate(rock([150, 120, 70], 0.6, 193, "Jungle_RuinStone"), [40, 380, 0]), translate(rock([90, 70, 50], 0.6, 194, "Jungle_RuinStone"), [40, 120, 556]));
  // the fig on top: roots down the back and the +Y pier
  const top: V3 = [40, 80, 560];
  g.push(tube([[40, 80, 540], [50, 100, 640], [60, 120, 720]], 20, 13, "Jungle_Root", 8));
  g.push(tube([top, [130, 140, 520], [140, 200, 440], [134, 250, 300], [140, 270, 150], [190, 280, -4]], 15, 8, "Jungle_Root", 7));
  g.push(tube([top, [110, 20, 500], [128, -40, 420], [136, -10, 300], [180, 40, 100], [260, 60, -4]], 12, 6, "Jungle_Root", 6));
  g.push(tube([top, [20, 220, 500], [10, 290, 420], [-60, 296, 300], [-130, 300, 100], [-180, 330, -4]], 13, 7, "Jungle_Root", 6));
  for (const y of [-260, -190, -100, 40, 130]) liana([[-146, y, 420], [-158, y + 6, 330], [-152, y - 4, 250 + rnd() * 60]], 3, g, vineC, 1, 16);
  fernClump(fr, [-60, -230, 556], 5, 60, 195, { lift: 0.9 });
  fernClump(fr, [-200, -340, 0], 6, 85, 196);
  fernClump(fr, [180, 330, 0], 6, 80, 197);
  const can = canopy([[60, 120, 820, 220, 200, 110], [-40, 30, 780, 120, 110, 70]], 60, 198, CANOPY.deep);
  return group(merge(...g, can.core), can.mesh, vineLeaves(vineC, 199), fernMesh(fr));
}

// ================= ways through =================

// A plank bridge over a stream, 10.4 m along X (the way across), 3.4 m wide; the deck sits just
// above the banks on two log stringers, a trestle in the middle, posts with bamboo and rope rails.
function plankBridge(): Geo {
  const g: Geo[] = [], rnd = seeded(201);
  for (const s of [-1, 1]) g.push(cylinderBetween([-520, s * 128, -8], [520, s * 128, -8], 16, 8, "BarkWarm", 15));
  const mats = ["WoodGrey", "WoodWarm", "WoodGrey", "WoodShade"];
  for (let i = 0; i < 40; i++) {
    const x = -507 + i * 26, len = 330 + (rnd() - 0.5) * 24;
    g.push(rotateZ(boxAt([23, len, 6], [x, (rnd() - 0.5) * 8, 4], mats[i % 4], 1), (rnd() - 0.5) * 4, [x, 0, 0]));
  }
  for (const x of [-480, 0, 480])
    for (const s of [-1, 1]) {
      g.push(cylinderAt({ rBot: 10, rTop: 8, height: 210, segments: 8, bottom: [x, s * 176, -100] }, "BarkWarm"));
      g.push(beamBetween([x, s * 128, 0], [x, s * 176, 0], 10, 10, "WoodDark"));
    }
  for (const s of [-1, 1]) {
    g.push(cylinderBetween([-490, s * 176, 98], [490, s * 176, 98], 5, 6, "BambooDry"));
    for (const [a, b] of [[-480, 0], [0, 480]]) {
      const pts = sagPts([a, s * 176, 62], [b, s * 176, 62], 14, 6);
      for (let i = 0; i < 6; i++) g.push(cylinderBetween(pts[i], pts[i + 1], 1.8, 4, "RopeTan"));
    }
  }
  // the trestle under the middle, down into the water
  g.push(beamBetween([0, -176, -90], [0, 176, -14], 10, 12, "WoodDark"), beamBetween([0, 176, -90], [0, -176, -14], 10, 12, "WoodDark"), boxBounds([-8, -190, -20], [8, 190, -6], "WoodDark"));
  // stones under the ends
  for (const x of [-530, 530]) for (const s of [-1, 1]) g.push(translate(rock([70, 60, 30], 0.4, 202 + x / 10 + s, "Jungle_RockMoss", true), [x, s * 140, -6]));
  return merge(...g);
}

// An explorers' camp: a ridge tent, a tarp over a map table, a campfire with a pot on a tripod,
// seat logs, crates, a pack and a lantern pole (6.6 x 6 m).
function explorerCamp(): THREE.Object3D {
  const g: Geo[] = [];
  // the ridge tent, open to -X
  g.push(gableRoof([320, 270, 3], [150, 140, 0], 168, 0, "Jungle_Canvas"), gableWall(310, 135, 0, 168, "Jungle_Canvas"));
  g.push(cylinderAt({ radius: 4, height: 176, segments: 6, bottom: [-10, 140, 0] }, "WoodShade"), cylinderAt({ radius: 4, height: 176, segments: 6, bottom: [310, 140, 0] }, "WoodShade"));
  g.push(cylinderBetween([-16, 140, 172], [316, 140, 172], 3.5, 6, "WoodShade"));
  for (const s of [-1, 1]) {
    g.push(cylinderBetween([-6, 140 + s * 20, 150], [-6, 140 + s * 128, 8], 7, 6, "Jungle_Canvas"));
    g.push(cylinderBetween([-10, 140, 170], [-70, 140 + s * 90, 0], 1, 4, "RopeTan"), cylinderAt({ radius: 2.5, height: 12, segments: 4, bottom: [-70, 140 + s * 90, 0] }, "WoodPale"));
  }
  g.push(boxBounds([0, 30, 0], [300, 250, 2], "FabricGreen"), cylinderBetween([60, 90, 14], [250, 90, 14], 14, 8, "FabricNavy"), boxAt([60, 40, 26], [40, 200, 2], "FabricRed", 2));
  // the tarp shelter and the map table
  for (const [x, y, h] of [[-300, -280, 220], [-300, -40, 220], [-60, -280, 168], [-60, -40, 168]] as [number, number, number][]) {
    g.push(cylinderAt({ radius: 4.5, height: h + 4, segments: 6, bottom: [x, y, 0] }, "BambooDry"));
    g.push(cylinderBetween([x, y, h], [x + (x < -100 ? -50 : 50), y + (y < -100 ? -40 : 40), 0], 0.9, 4, "RopeTan"));
  }
  g.push(cloth([-312, -292, 222], [-312, -28, 222], [-48, -292, 166], [-48, -28, 166], [0, 0, -14], "FabricGreen", 4, 4));
  g.push(boxAt([130, 74, 5], [-190, -160, 74], "WoodWarm", 1.5));
  for (const s of [-1, 1]) {
    g.push(beamBetween([-240, -160 + s * 30, 0], [-140, -160 - s * 30, 74], 4, 4, "WoodDark"), beamBetween([-140, -160 + s * 30, 0], [-240, -160 - s * 30, 74], 4, 4, "WoodDark"));
  }
  g.push(translate(rotateZ(boxAt([66, 46, 0.8], [0, 0, 0], "FabricSand"), 8), [-196, -168, 79]));
  g.push(cylinderAt({ radius: 6, height: 16, segments: 6, bottom: [-150, -136, 79] }, "IronDark"), cylinderAt({ radius: 4.5, height: 10, segments: 6, bottom: [-150, -136, 82] }, "LanternGlow"));
  g.push(cylinderAt({ radius: 18, height: 42, segments: 8, bottom: [-110, -190, 0] }, "WoodShade"));
  // the campfire, its pot on a tripod, logs to sit on
  const F: V3 = [-200, 170, 0];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.push(translate(rock([24, 22, 16], 0.4, 212 + i, "Jungle_Rock"), [F[0] + Math.cos(a) * 46, F[1] + Math.sin(a) * 46, 0]));
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI + 0.3;
    g.push(cylinderBetween([F[0] + Math.cos(a) * 34, F[1] + Math.sin(a) * 34, 6], [F[0] - Math.cos(a) * 34, F[1] - Math.sin(a) * 34, 12], 5, 6, i % 2 ? "WoodDark" : "BarkWarm"));
  }
  g.push(sphereCenter(10, [F[0], F[1], 8], "Jungle_Ember", 6), cylinderAt({ rBot: 14, rTop: 1, height: 30, segments: 6, bottom: [F[0], F[1], 8] }, "FireGlow"));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    g.push(cylinderBetween([F[0] + Math.cos(a) * 70, F[1] + Math.sin(a) * 70, 0], [F[0], F[1], 150], 2.6, 5, "BambooDry"));
  }
  g.push(cylinderBetween([F[0], F[1], 150], [F[0], F[1], 92], 0.8, 4, "IronDark"), cylinderAt({ rBot: 15, rTop: 18, height: 24, segments: 10, bottom: [F[0], F[1], 68] }, "IronDark"));
  g.push(cylinderBetween([F[0] - 120, F[1] - 60, 18], [F[0] - 110, F[1] + 80, 18], 18, 8, "BarkWarm"), cylinderBetween([F[0] + 60, F[1] + 120, 16], [F[0] + 150, F[1] + 30, 16], 16, 8, "BarkWarm"));
  // crates, a sack, a pack, a coil of rope and the lantern pole
  const crate = (s: number): Geo => merge(boxAt([s, s, s], [0, 0, 0], "WoodWarm", 1.5), boxAt([s + 2, 8, s + 2], [0, -s / 2 + 3, -1], "WoodShade"), boxAt([s + 2, 8, s + 2], [0, s / 2 - 3, -1], "WoodShade"));
  g.push(translate(rotateZ(crate(60), 12), [180, -150, 0]), translate(rotateZ(crate(50), -20), [250, -90, 0]), translate(rotateZ(crate(44), 40), [196, -142, 60]));
  g.push(translate(scale(sphereCenter(1, [0, 0, 0], "FabricSand", 8), [30, 24, 26]), [260, -200, 24]));
  g.push(boxAt([40, 26, 54], [120, -230, 0], "FabricNavy", 4), cylinderBetween([120, -248, 60], [120, -212, 60], 12, 8, "FabricRed"));
  for (let i = 0; i < 3; i++) g.push(translate(torus(20 - i * 3, 3, 10, 4, "RopeTan"), [60, -250, 3 + i * 5.4]));
  g.push(cylinderAt({ radius: 5, height: 250, segments: 6, bottom: [-320, 60, 0] }, "BambooDry"), beamBetween([-320, 60, 240], [-350, 60, 240], 4, 4, "WoodDark"));
  g.push(cylinderAt({ radius: 9, height: 20, segments: 6, bottom: [-350, 60, 200] }, "IronDark"), cylinderAt({ radius: 7, height: 14, segments: 6, bottom: [-350, 60, 203] }, "LanternGlow"), cylinderBetween([-350, 60, 220], [-350, 60, 240], 0.8, 4, "IronDark"));
  // an axe in a chopping block
  g.push(cylinderAt({ radius: 24, height: 40, segments: 10, bottom: [100, 240, 0] }, "BarkWarm"), cylinderAt({ radius: 21, height: 2, segments: 10, bottom: [100, 240, 40] }, "WoodPale"));
  g.push(beamBetween([100, 240, 46], [100 + 50 * Math.cos(0.4), 240 + 50 * Math.sin(0.4), 84], 4, 5, "WoodWarm"), boxAt([4, 16, 14], [100, 236, 38], "IronLight"));
  for (let i = 0; i < 5; i++) g.push(cylinderBetween([60 + i * 9, 300, 6 + (i % 2) * 10], [60 + i * 9, 360, 6 + (i % 2) * 10], 6, 6, "BarkWarm"));
  return group(merge(...g));
}

// A trail sign: a post with arrow boards three ways, a lantern, a red cloth, a cairn (2.6 m)
function trailSign(): Geo {
  const g: Geo[] = [
    boxAt([18, 18, 250], [0, 0, 0], "WoodDark", 2),
    rotateZ(cylinderAt({ rBot: 14, rTop: 1, height: 22, segments: 4, bottom: [0, 0, 250] }, "WoodShade"), 45),
  ];
  const arrow = (z: number, yaw: number, len: number, mat: string): Geo =>
    rotateZ(merge(
      boxBounds([-3, 8, z], [3, len, z + 26], mat, 1),
      translate(rotateX(cylinderAt({ rBot: 20, rTop: 0.5, height: 26, segments: 3, bottom: [0, 0, 0] }, mat), -90), [0, len, z + 13]),
      boxBounds([-4, 14, z + 10], [4, len - 6, z + 12], "WoodPale"),
    ), yaw);
  g.push(arrow(200, 0, 100, "WoodWarm"), arrow(166, 150, 90, "WoodPale"), arrow(130, -80, 84, "WoodWarm"));
  g.push(beamBetween([0, 0, 236], [-40, 0, 236], 5, 5, "WoodShade"), cylinderBetween([-40, 0, 236], [-40, 0, 220], 0.8, 4, "IronDark"));
  g.push(cylinderAt({ radius: 9, height: 22, segments: 6, bottom: [-40, 0, 198] }, "IronDark"), cylinderAt({ radius: 7, height: 15, segments: 6, bottom: [-40, 0, 201] }, "LanternGlow"));
  g.push(boxAt([3, 10, 44], [-11, 4, 186], "FabricRed"), boxAt([3, 8, 30], [-11, -6, 192], "FabricRed"));
  g.push(pillow([0, 0, 252], 14, 14, 6));
  for (const [x, y, s, z] of [[30, 30, 40, 0], [-34, 26, 34, 0], [26, -36, 36, 0], [10, 20, 26, 22], [-20, -30, 30, 0]] as [number, number, number, number][]) g.push(translate(rock([s, s * 0.9, s * 0.7], 0.4, x + y + 300, "Jungle_Rock"), [x, y, z]));
  return merge(...g);
}

// ================= the coast =================

// A mangrove on prop roots (6.4 m): roots arching out from a trunk raised on them into the
// water, drop roots from its limbs, pencil roots poking up round it, a rounded crown.
function mangrove(): THREE.Object3D {
  const g: Geo[] = [], rnd = seeded(221);
  const T: V3 = [10, -5, 340];
  g.push(tube([[0, 0, 120], [4, -2, 230], T], 20, 15, "Jungle_MangroveBark", 9));
  const limbs: V3[] = [[-120, 70, 480], [130, 90, 500], [20, -130, 490], [-60, -60, 540]];
  for (const l of limbs) g.push(tube([T, lerp3(T, l, 0.5).map((v, i) => (i === 2 ? v + 30 : v)) as V3, l], 11, 5, "Jungle_MangroveBark", 6));
  for (let i = 0; i < 13; i++) {
    const a = (i / 13) * Math.PI * 2 + rnd() * 0.3, z0 = 120 + rnd() * 110, R = 170 + rnd() * 120;
    const p0 = polar(a, 14, z0), p1 = polar(a, R * 0.45, z0 + 20 + rnd() * 30), p2 = polar(a + 0.1, R, -30);
    g.push(tube(bend(p0, p1, p2, 5), 7, 4, "Jungle_MangroveBark", 6));
    if (i % 3 === 0) g.push(tube(bend(bend(p0, p1, p2, 5)[2], polar(a - 0.3, R * 0.75, 70), polar(a - 0.4, R * 1.15, -30), 4), 4.5, 3, "Jungle_MangroveBark", 5));
  }
  for (const l of limbs.slice(0, 3)) g.push(tube([[l[0] * 0.8, l[1] * 0.8, l[2] - 30], [l[0] * 0.85, l[1] * 0.85, l[2] * 0.5], [l[0] * 0.9, l[1] * 0.9, -30]], 4, 3, "Jungle_MangroveBark", 5));
  for (let i = 0; i < 18; i++) {
    const a = rnd() * Math.PI * 2, d = 120 + rnd() * 200;
    g.push(cylinderAt({ rBot: 2.6, rTop: 0.8, height: 30 + rnd() * 26, segments: 4, bottom: [Math.cos(a) * d, Math.sin(a) * d, -20] }, "Jungle_MangroveBark"));
  }
  const crowns: Crown[] = limbs.map(([x, y, z]) => [x * 1.1, y * 1.1, z + 40, 190, 175, 105]);
  crowns.push([0, 0, 600, 220, 210, 100]);
  const can = canopy(crowns, 58, 222, CANOPY.mangrove, { density: 1.05 }, { min: [-346, -371, 0], max: [367, 308, 777] });
  return group(merge(...g, can.core), can.mesh);
}

// a clump of nipa palm: long fronds straight up out of the mud, a fruit head in the middle (5 m)
function nipaPalm(): THREE.Object3D {
  const fr: Frond[] = [], g: Geo[] = [], rnd = seeded(231);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + rnd() * 0.4, base = polar(a, 14, 30);
    fr.push({ at: base, yaw: a, lift: 1.25 + rnd() * 0.2, droop: 1.15, len: 380 + rnd() * 90, wid: 74, segs: 8, shade: 0.8 + rnd() * 0.2 });
    g.push(cylinderBetween(polar(a, 6, -20), base, 8, 6, "Jungle_Stem", 6));
  }
  for (let i = 0; i < 14; i++) {
    const a = i * 2.4, r = 10 + (i % 3) * 4;
    g.push(sphereCenter(7, [24 + Math.cos(a) * r, 8 + Math.sin(a) * r, 34 + (i % 4) * 5], "Jungle_Cattail", 6));
  }
  g.push(cylinderBetween([0, 0, 0], [24, 8, 34], 3, 5, "Jungle_Stem"));
  return group(merge(...g), frondMesh(fr, "frond"));
}

// A boardwalk over the mangrove shallows, 4 m along Y (tiles end to end), 2.2 m wide: the deck
// just above the water on bearers and posts, bamboo top rails and a rope rail below.
function boardwalk(): Geo {
  const g: Geo[] = [], rnd = seeded(241);
  const mats = ["WoodGrey", "WoodGrey", "WoodWarm", "WoodShade"];
  for (let i = 0; i < 16; i++) {
    const y = -200 + 25 * (i + 0.5);
    g.push(rotateZ(boxAt([206 + (rnd() - 0.5) * 12, 23, 5], [(rnd() - 0.5) * 6, y, 7], mats[(i * 3) % 4], 1), (rnd() - 0.5) * 3, [0, y, 0]));
  }
  for (const s of [-1, 1]) g.push(boxBounds([s * 80 - 8, -200, -8], [s * 80 + 8, 200, 7], "WoodDark"));
  for (const y of [-120, 120]) {
    g.push(boxBounds([-112, y - 8, -10], [112, y + 8, 4], "WoodDark"));
    for (const s of [-1, 1]) {
      g.push(cylinderAt({ rBot: 8, rTop: 7, height: 210, segments: 8, bottom: [s * 110, y, -110] }, "Jungle_MangroveBark"));
      g.push(cylinderAt({ radius: 9, height: 14, segments: 8, bottom: [s * 110, y, -40] }, "Jungle_Barnacle"));
    }
  }
  for (const s of [-1, 1]) {
    g.push(cylinderBetween([s * 110, -200, 96], [s * 110, 200, 96], 4.5, 6, "BambooDry"));
    for (const [a, b] of [[-200, -120], [-120, 120], [120, 200]]) {
      const pts = sagPts([s * 110, a, 56], [s * 110, b, 56], (b - a) / 30, 4);
      for (let i = 0; i < 4; i++) g.push(cylinderBetween(pts[i], pts[i + 1], 1.6, 4, "RopeTan"));
    }
  }
  return merge(...g);
}

// A junk wrecked on the beach (landmark, 17 x 7 m): lying on its side with its deck toward the
// front (-X), planks sprung to show the ribs, its mainmast snapped, a rag of sail, barnacles and
// weed along the keel; sand drifted against it.
function shipwreck(): THREE.Object3D {
  const g: Geo[] = [], hull: Geo[] = [], rnd = seeded(251);
  const DP = 320, L = 860;
  const beam = (x: number) => 290 * Math.pow(Math.max(0.02, 1 - Math.pow(Math.abs(x) / L, 2.2)), 0.55);
  const rail = (x: number) => DP + 70 * Math.pow(x / L, 2);
  // a point on the hull: station x, side s, t from keel (0) to rail (1)
  const at = (x: number, s: number, t: number): V3 => [x, s * beam(x) * Math.sin((t * Math.PI) / 2), rail(x) * (1 - Math.cos((t * Math.PI) / 2))];
  const xs: number[] = [];
  for (let x = -800; x <= 780; x += 105) xs.push(x);
  // ribs
  for (const x of xs)
    for (const s of [-1, 1]) {
      const pts = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => at(x, s, t));
      hull.push(tube(pts, 8, 7, "Jungle_Hull", 5));
    }
  // planking, sprung in a hole on the +Y side (the side that lies down toward the front)
  const rows = 10;
  for (const s of [-1, 1])
    for (let r = 0; r < rows; r++) {
      const t = (r + 0.5) / rows;
      for (let i = 0; i + 1 < xs.length; i++) {
        const hole = s > 0 && r >= 4 && i >= 3 && i <= 9 && !(r === 4 && i % 3 === 0);
        if (hole || (s < 0 && rnd() < 0.06) || (s > 0 && r > 7 && rnd() < 0.3)) continue;
        const a = at(xs[i] - 2, s, t), b = at(xs[i + 1] + 2, s, t);
        hull.push(beamBetween(a, b, 34, 6, r < 3 ? "Jungle_HullPale" : r % 3 === 1 ? "Jungle_Hull" : "WoodDark"));
      }
    }
  // keel, stem and sternpost, the transom
  hull.push(boxBounds([-820, -12, -16], [800, 12, 12], "WoodDark"));
  hull.push(tube([[-800, 0, 0], [-880, 0, 140], [-900, 0, 300], [-905, 0, rail(-860) + 40]], 16, 12, "WoodDark", 6));
  hull.push(boxBounds([780, -beam(780) - 6, 0], [800, beam(780) + 6, rail(780) + 40], "Jungle_Hull", 2));
  hull.push(boxBounds([790, -30, 60], [812, 30, 260], "WoodDark"));
  // the deck, broken through in the middle, and the stern cabin
  for (let x = -700; x < 760; x += 32) {
    if (x > -260 && x < 160) continue;
    const w = beam(x) * 0.96, z = rail(x) - 36;
    hull.push(boxBounds([x, -w, z - 6], [x + 28, w * (x > 300 ? 1 : 0.6 + rnd() * 0.4), z], x % 64 ? "Jungle_HullPale" : "Jungle_Hull"));
  }
  for (const x of [-260, 160]) hull.push(boxBounds([x - 8, -beam(x), rail(x) - 50], [x + 8, beam(x), rail(x) - 36], "WoodDark"));
  const cz = rail(600) - 36;
  hull.push(boxBounds([520, -170, cz], [760, -150, cz + 190], "Jungle_Hull"), boxBounds([520, -170, cz], [540, 170, cz + 190], "Jungle_Hull"), boxBounds([740, -170, cz], [760, 170, cz + 190], "Jungle_Hull"));
  hull.push(boxBounds([518, -80, cz + 60], [522, -20, cz + 120], "Jungle_Dark"), boxBounds([600, -172, cz + 70], [660, -168, cz + 120], "Jungle_Dark"));
  for (let i = 0; i < 8; i++) if (i !== 3 && i !== 6) hull.push(boxBounds([510 + i * 32, -186, cz + 186], [538 + i * 32, 60 + (i % 3) * 30, cz + 196], "WoodDark"));
  // the snapped mainmast and the foremast stump, a rag of sail, rigging trailing
  const mz = rail(-80) - 36;
  hull.push(cylinderAt({ rBot: 22, rTop: 19, height: 330, segments: 10, bottom: [-80, 0, mz - 200] }, "Jungle_HullPale"));
  for (let i = 0; i < 6; i++) hull.push(translate(rotateZ(boxAt([10, 16, 20 + ((i * 7) % 4) * 14], [17, 0, mz + 128], "Jungle_HullPale"), i * 60), [-80, 0, 0]));
  hull.push(cylinderAt({ rBot: 17, rTop: 15, height: 200, segments: 10, bottom: [-560, 0, rail(-560) - 160] }, "Jungle_HullPale"));
  hull.push(cloth([-80, 10, mz + 120], [-80, 160, mz + 100], [-60, 30, mz + 20], [-40, 230, mz - 10], [30, 20, -10], "Jungle_SailRag", 4, 4, 0.5));
  for (const [a, b] of [[[-80, 0, mz + 110], [-300, -beam(-300), rail(-300)]], [[-80, 0, mz + 100], [140, -beam(140), rail(140)]], [[-560, 0, rail(-560) + 30], [-700, beam(-700), rail(-700)]]] as [V3, V3][])
    for (const [p, q] of sagPts(a, b, 30, 5).map((p, i, arr) => [p, arr[i + 1]] as [V3, V3]).slice(0, 5)) hull.push(cylinderBetween(p, q, 1.6, 4, "RopeTan"));
  // barnacles and weed along the bottom
  for (let i = 0; i < 40; i++) {
    const x = -760 + rnd() * 1500, s = rnd() < 0.7 ? -1 : 1, p = at(x, s, 0.05 + rnd() * 0.3);
    hull.push(sphereCenter(5 + rnd() * 5, p, "Jungle_Barnacle", 5));
    if (i % 4 === 0) hull.push(tube([p, [p[0] + 4, p[1] + s * 10, p[2] - 25], [p[0], p[1] + s * 14, p[2] - 50]], 3, 1.5, "Jungle_Weed", 4));
  }
  // lie her over: the deck tilted toward the front, then the length along Y, sunk in the sand
  g.push(translate(rotateZ(rotateX(merge(...hull), -28), 90), [0, 0, -46]));
  // the broken top of the mast on the sand, its yard and a sand drift against the hull
  g.push(cylinderBetween([-420, -260, 16], [-760, 420, 14], 17, 10, "Jungle_HullPale", 14));
  g.push(cylinderBetween([-560, 30, 12], [-700, 260, 40], 9, 8, "Jungle_HullPale"), cylinderBetween([-520, 140, 10], [-720, 20, 10], 9, 8, "Jungle_HullPale"));
  g.push(cloth([-520, 140, 6], [-720, 20, 6], [-640, 220, 2], [-800, 120, 4], [0, 0, 16], "Jungle_SailRag", 4, 3, 0.3));
  g.push(translate(rock([520, 260, 80], 0.3, 252, "Jungle_Sand", true), [-200, -150, -6]), translate(rock([420, 240, 70], 0.3, 253, "Jungle_Sand", true), [-160, 420, -6]), translate(rock([380, 200, 60], 0.3, 254, "Jungle_Sand", true), [250, 80, -6]));
  return group(merge(...g));
}

// flotsam and jetsam on the sand: planks, a stove-in barrel, a crate, rope, a bleached log, a
// small anchor (5 m)
function wreckDebris(): Geo {
  const g: Geo[] = [], rnd = seeded(261);
  for (let i = 0; i < 7; i++) g.push(block([150 + rnd() * 120, 22, 5], [(rnd() - 0.5) * 380, (rnd() - 0.5) * 300, 0], i % 2 ? "Jungle_HullPale" : "Jungle_Driftwood", rnd() * 180, (rnd() - 0.5) * 6));
  // a barrel stove in on its side
  const bx = 120, by = -90;
  for (let i = 0; i < 12; i++) {
    if (i === 2 || i === 3) continue;
    const a = (i / 12) * Math.PI * 2;
    g.push(beamBetween([bx - 42, by + Math.cos(a) * 30, 30 + Math.sin(a) * 30], [bx + 42, by + Math.cos(a) * 30, 30 + Math.sin(a) * 30], 15, 4, "WoodWarm"));
  }
  for (const x of [-30, 30]) g.push(translate(rotateY(torus(31, 2.2, 12, 4, "IronDark"), 90), [bx + x, by, 30]));
  g.push(block([60, 60, 56], [-140, 120, -18], "WoodWarm", 30, 18));
  for (let i = 0; i < 3; i++) g.push(translate(torus(22 - i * 3.5, 3.2, 10, 4, "RopeTan"), [40, 130, 2 + i * 5.6]));
  g.push(cylinderBetween([-240, -160, 22], [60, -230, 18], 24, 8, "Jungle_Driftwood", 18), cylinderBetween([-120, -190, 30], [-170, -270, 70], 7, 6, "Jungle_Driftwood", 3), cylinderBetween([-20, -210, 30], [10, -150, 66], 6, 6, "Jungle_Driftwood", 2));
  g.push(cylinderBetween([170, 150, 8], [250, 40, 8], 5, 6, "IronDark"), translate(rotateX(torus(14, 3, 10, 4, "IronDark"), 90), [258, 30, 14]));
  g.push(tube(bend([170, 150, 8], [150, 210, 8], [200, 240, 8], 3), 4, 4, "IronDark", 5), tube(bend([170, 150, 8], [220, 130, 8], [240, 180, 8], 3), 4, 4, "IronDark", 5));
  g.push(translate(rock([90, 70, 30], 0.4, 262, "Jungle_Sand", true), [-60, 40, -4]), sphereCenter(8, [-30, -40, 6], "Jungle_Barnacle", 6));
  return merge(...g);
}

// A sea stack: a pillar of rock standing in the sea, banded, weed and barnacles at the water,
// bushes on its top (landmark, 6 m across, 8.6 m tall above the water)
function seaStack(): THREE.Object3D {
  const g: Geo[] = [
    translate(rock([640, 560, 320], 0.45, 271, "Jungle_SeaRock"), [0, 0, -120]),
    translate(rock([500, 440, 380], 0.5, 272, "Jungle_SeaRock"), [30, -20, 120]),
    translate(rock([400, 360, 320], 0.5, 273, "Jungle_Rock"), [-20, 30, 420]),
    translate(mossy([340, 300, 160], 0.45, 274, "Jungle_SeaRock"), [10, 10, 680]),
    translate(rock([180, 150, 140], 0.5, 275, "Jungle_SeaRock"), [-300, 180, -40]),
    translate(rock([140, 120, 90], 0.5, 276, "Jungle_Rock"), [280, -220, -40]),
  ];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2, r = 270 + ((i * 7) % 5) * 12;
    g.push(sphereCenter(9 + (i % 3) * 3, [Math.cos(a) * r, Math.sin(a) * r * 0.9, -4 + (i % 4) * 6], i % 3 ? "Jungle_Barnacle" : "Jungle_Weed", 5));
  }
  g.push(shrub({ seed: 277, leaf: 48, look: SHRUB_JUNGLE, ragged: 0.7, lobes: [[0, 0, 860, 90, 80, 44], [60, 30, 850, 60, 56, 38], [-50, -40, 848, 62, 56, 36], [-90, 60, 832, 62, 60, 36], [90, -40, 840, 66, 60, 36], [20, -10, 890, 60, 54, 32]] }));
  return group(merge(...g));
}

// Fish-trap stakes (a V of bamboo with nets between, a pen at its apex, 8.4 m along X): the
// stakes go down into the shallows.
function fishStakes(): Geo {
  const g: Geo[] = [], rnd = seeded(281);
  const apex: V3 = [320, 0, 0];
  for (const s of [-1, 1]) {
    const mouth: V3 = [-420, s * 280, 0];
    const n = 17;
    for (let i = 0; i <= n; i++) {
      const p = lerp3(mouth, apex, i / n), h = 130 + rnd() * 60;
      g.push(cylinderAt({ rBot: 5, rTop: 4, height: h + 90, segments: 6, bottom: [p[0], p[1], -90] }, i % 3 ? "BambooDry" : "Bamboo"));
    }
    g.push(beamBetween([mouth[0], mouth[1], -10], [apex[0] - 60, s * 50, -10], 1.2, 120, "Jungle_Net"));
    g.push(cylinderBetween([mouth[0], mouth[1], 112], [apex[0] - 60, s * 50, 112], 1.6, 4, "RopeTan"));
  }
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    g.push(cylinderAt({ rBot: 5, rTop: 4, height: 260 + rnd() * 40, segments: 6, bottom: [apex[0] + 80 + Math.cos(a) * 90, Math.sin(a) * 90, -90] }, "BambooDry"));
  }
  g.push(translate(scale(torus(90, 1.2, 14, 3, "Jungle_Net"), [1, 1, 50]), [apex[0] + 80, 0, 50]));
  // a little bamboo platform with a basket and a coil of rope
  g.push(boxBounds([apex[0] + 30, -60, 120], [apex[0] + 130, 60, 128], "BambooDry"));
  for (let i = 0; i < 6; i++) g.push(cylinderBetween([apex[0] + 30 + i * 20, -60, 130], [apex[0] + 30 + i * 20, 60, 130], 3.5, 6, "Bamboo"));
  g.push(cylinderAt({ rBot: 16, rTop: 22, height: 26, segments: 10, bottom: [apex[0] + 70, -20, 132] }, "BambooDry"), translate(torus(16, 3, 10, 4, "RopeTan"), [apex[0] + 100, 30, 134]));
  return merge(...g);
}

// An old beacon tower on the headland (landmark, 4.6 m across, 9 m to its flag): a round stone
// tower in courses, its parapet half fallen, slit windows, a door, an iron fire basket still
// smouldering on top, rubble and moss at its foot.
function beaconRuin(): THREE.Object3D {
  const g: Geo[] = [], vineC: Crown[] = [], fr: Frond[] = [], rnd = seeded(291);
  const H = 600, R0 = 190, R1 = 160;
  const rAt = (z: number) => R0 + ((R1 - R0) * z) / H;
  g.push(cylinderAt({ rBot: 215, rTop: 200, height: 40, segments: 14, bottom: [0, 0, 0] }, "StoneDark"));
  for (let c = 0; c < 10; c++) {
    const z = 40 + c * 56, r = rAt(z) + (c % 2 ? 2 : -2);
    g.push(cylinderAt({ rBot: r, rTop: rAt(z + 56), height: 56, segments: 14, bottom: [0, 0, z] }, c % 3 === 1 ? "StoneDark" : "StoneGrey"));
  }
  // the broken top: a ring of parapet blocks, missing over the back
  const top = 40 + 10 * 56;
  g.push(cylinderAt({ radius: R1 + 14, height: 16, segments: 14, bottom: [0, 0, top] }, "StoneGrey"));
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * 360;
    if (a > 30 && a < 130) continue;
    const h = a > 140 && a < 200 ? 40 : 90 + (i % 2) * 10;
    g.push(rotateZ(boxAt([36, 52, h], [R1 + 2, 0, top + 16], i % 2 ? "StoneGrey" : "StoneDark", 3), a));
  }
  for (let i = 0; i < 5; i++) g.push(block([50, 40, 30], [Math.cos(1.4 + i * 0.3) * (R0 + 60 + i * 20), Math.sin(1.4 + i * 0.3) * (R0 + 60 + i * 20), -3], "StoneGrey", rnd() * 90, (rnd() - 0.5) * 20));
  // the door and slit windows
  g.push(boxBounds([-R0 - 10, -50, 40], [-R0 + 20, 50, 250], "StoneLight", 3), boxBounds([-R0 - 14, -38, 40], [-R0 + 10, 38, 230], "Jungle_Dark"));
  g.push(rotateZ(boxAt([8, 70, 180], [-R0 - 30, 46, 40], "WoodDark", 1.5), 18, [-R0 - 30, 46, 40]));
  for (const [a, z] of [[0, 330], [90, 420], [200, 360], [270, 300], [140, 470]]) g.push(rotateZ(boxBounds([-rAt(z) - 4, -9, z], [-rAt(z) + 8, 9, z + 54], "Jungle_Dark"), a));
  // the fire basket on its post
  const P = top + 16;
  g.push(cylinderAt({ radius: 9, height: 110, segments: 8, bottom: [0, 0, P] }, "IronDark"));
  for (const z of [P + 100, P + 150]) g.push(translate(torus(54 + (z - P - 100) * 0.3, 3, 12, 4, "IronDark"), [0, 0, z]));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.push(cylinderBetween([Math.cos(a) * 20, Math.sin(a) * 20, P + 100], [Math.cos(a) * 70, Math.sin(a) * 70, P + 170], 2.4, 4, "IronDark"));
  }
  g.push(cylinderAt({ rBot: 24, rTop: 50, height: 10, segments: 10, bottom: [0, 0, P + 98] }, "IronDark"));
  for (let i = 0; i < 6; i++) g.push(sphereCenter(12, [Math.cos(i) * 22, Math.sin(i) * 22, P + 112], i % 2 ? "Jungle_Ember" : "WoodDark", 6));
  g.push(cylinderAt({ rBot: 28, rTop: 2, height: 36, segments: 6, bottom: [0, 0, P + 112] }, "FireGlow"));
  // a flag pole with a tattered red pennant
  g.push(cylinderAt({ radius: 4, height: 260, segments: 6, bottom: [-110, -90, top + 16] }, "WoodDark"));
  g.push(cloth([-110, -90, top + 200], [-110, -90 - 110, top + 210], [-110, -90, top + 270], [-110, -90 - 140, top + 262], [10, 0, 0], "FabricRed", 4, 2, 0.4));
  // moss, a vine, ferns, rubble at the foot
  g.push(pillow([0, 0, top + 18], 120, 110, 6), pillow([R0, 40, 44], 50, 60, 10), pillow([-60, R0, 44], 60, 40, 10));
  liana([[150, -40, top], [170, -60, 400], [190, -40, 220], [200, -50, 40]], 4, g, vineC, 1, 20);
  for (let i = 0; i < 7; i++) {
    const a = rnd() * Math.PI * 2, d = R0 + 50 + rnd() * 80;
    g.push(translate(rock([40 + rnd() * 50, 40 + rnd() * 40, 30 + rnd() * 30], 0.5, 292 + i, "Jungle_Rock"), [Math.cos(a) * d, Math.sin(a) * d, 0]));
  }
  fernClump(fr, [140, 200, 0], 5, 70, 299);
  return group(merge(...g), vineLeaves(vineC, 300), fernMesh(fr));
}

// ================= the sample: where the jungle meets the sea =================
function disc(r: number, rx: number, mat: string): THREE.Mesh {
  const shape = new THREE.Shape();
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2, k = 1 + 0.12 * Math.sin(a * 3) + 0.08 * Math.cos(a * 5);
    if (i === 0) shape.moveTo(Math.cos(a) * r * k, Math.sin(a) * rx * k);
    else shape.lineTo(Math.cos(a) * r * k, Math.sin(a) * rx * k);
  }
  const geo = new THREE.ShapeGeometry(shape);
  geo.applyMatrix4(ZUP);
  const m = new THREE.Mesh(geo, material(mat));
  m.receiveShadow = true;
  return m;
}
function sample(put: Put): void {
  // the beach: a band of sand along the sea (-Y), ragged on its landward side
  const beach = new THREE.Shape();
  beach.moveTo(-2600, -2260);
  for (let x = -2600; x <= 2600; x += 200) beach.lineTo(x, -1250 - 140 * Math.sin(x / 330) - 80 * Math.cos(x / 170));
  beach.lineTo(2600, -2260);
  beach.lineTo(-2600, -2260);
  const sand = new THREE.Mesh(new THREE.ShapeGeometry(beach).applyMatrix4(ZUP), material("Jungle_Sand"));
  sand.receiveShadow = true;
  put(sand, [0, 0, 1.5]);
  // the ruins in the forest: the gate, walls either side, the face, the columns
  put("ruin_gate", [900, 800, 0], 0);
  for (const y of [1380, 1980]) put("ruin_wall", [900, y, 0], 0);
  put("ruin_wall", [900, 220, 0], 0);
  put("stone_face", [1650, 1500, 0], -140);
  put("ruin_pillars", [1700, 200, 0], 30);
  put("strangler_fig", [-1300, 1500, 0], 20);
  put("vine_tree", [-650, 1750, 0], 60);
  put("vine_tree", [2000, 2050, 0], 200, 0.9);
  put("trail_sign", [100, 200, 0], -30);
  put("explorer_camp", [-1350, 150, 0], 70);
  // a mud pool with reeds, a log, a stump, flat stones
  put(disc(330, 240, "Jungle_Mud"), [-150, 1250, 3]);
  for (const [x, y, s] of [[-450, 1150, 1], [150, 1420, 0.8], [-300, 1500, 0.9], [120, 1080, 0.7]]) put("reeds", [x, y, 0], x, s);
  put("rock_cluster", [-80, 850, 0], 20, 0.7);
  put("fallen_log", [300, 1900, 0], 75);
  put("stump", [-650, 650, 0], 0);
  put("boulder_mossy", [-2000, 800, 0], 40);
  put("rock_cluster", [500, -600, 0], 10);
  for (const [x, y, h] of [[-700, 1900, 0], [400, 1100, 50], [-1800, 2000, 100], [1500, 900, 160], [-200, 400, 200], [1200, -300, 20]]) put("giant_fern", [x, y, 0], h, 0.9);
  for (const [x, y] of [[-900, 1000], [2000, 600], [-400, 2000]]) put("tree_fern", [x, y, 0], x);
  for (const [x, y] of [[500, 600], [-1000, 600], [1900, 1950]]) put("elephant_ear", [x, y, 0], y);
  // the coast: mangroves in the water, a boardwalk out over it, nipa palms; the wreck on the sand
  for (const [x, y, h, s] of [[-1900, -2300, 0, 1], [-1300, -2500, 60, 0.9], [-2100, -1900, 120, 0.85], [-700, -2450, 200, 0.8]]) put("mangrove", [x, y, 0], h, s);
  for (const y of [-1700, -2100, -2500, -2900]) put("boardwalk", [-1000, y, 0], 0);
  for (const [x, y] of [[-1600, -1750], [-500, -2250], [-2200, -2600]]) put("nipa_palm", [x, y, 0], x);
  put("shipwreck", [800, -2050, 0], -95);
  put("wreck_debris", [-200, -1800, 0], 30);
  put("fish_stakes", [1600, -3100, 0], 90);
  put("sea_stack", [-300, -3700, 0], 30);
  put("beacon_ruin", [1850, -1450, 0], 200);
  put("rock_cluster", [2150, -2150, 0], 70);
  put("rock_cluster", [1400, -2300, 0], 0, 0.8);
  // trees: rainforest inland, palms along the beach
  const trees: [string, number, number, number][] = [
    ["JungleTree", -2100, 2100, 1], ["JungleTree", -500, 2150, 1.1], ["JungleTree", 400, 2200, 0.9], ["JungleTree", 1400, 2150, 1],
    ["JungleTree", 2150, 1300, 1.1], ["JungleTree", -2150, 1300, 0.9], ["JungleTree", -1700, 500, 1], ["JungleTree", 2200, 200, 0.9],
    ["JungleTree", 1100, 1500, 0.85], ["Bamboo", -2200, 300, 1], ["Bamboo", 1300, 2200, 1], ["Bamboo", 2150, -600, 0.9],
    ["PalmBent", 200, -1500, 1], ["PalmBent", -400, -1350, 0.9], ["Palm", 1400, -1300, 1], ["PalmTall", 2100, -1100, 1], ["PalmBent", -1300, -1400, 1],
    ["JungleBush", -800, 300, 1], ["JungleBush", 300, 300, 1], ["JungleBush", -1900, -100, 1.2], ["JungleBush", 600, 2000, 1.1], ["JungleBush", 1800, 2200, 1],
    ["JungleBush", -1100, 2100, 1.2], ["JungleBush", 1500, -500, 1], ["JungleBush", -300, 1700, 0.9], ["JungleBush", 2000, 1600, 1],
  ];
  for (const [k, x, y, s] of trees) put(`flora:${k}`, [x, y, 0], x + y, s);
}

export const KIT: Kit = {
  id: "jungle",
  name: "ป่าดิบและชายฝั่ง",
  region: "แดนใต้ รอบเมืองท่าโยเดีย",
  desc: "ป่าดิบทึบ เถาวัลย์ เฟิร์นยักษ์ บ่อโคลน ซากปราสาทหินที่รากไทรรัดไว้ ป่าชายเลน หาดทราย และซากเรือเกยตื้น",
  ground: "jungle",
  sea: true,
  items: [
    { id: "boulder_mossy", name: "หินใหญ่มอสเกาะ", make: boulderMossy, tags: ["rock", "decor"] },
    { id: "rock_cluster", name: "กองหินคละขนาด", make: rockCluster, tags: ["rock", "decor"] },
    { id: "fallen_log", name: "ขอนไม้ล้มมอสเกาะ", make: fallenLog, tags: ["log", "decor"] },
    { id: "stump", name: "ตอไม้ผุ", make: stump, tags: ["log", "decor"] },
    { id: "giant_fern", name: "เฟิร์นยักษ์", make: giantFern, tags: ["plant"] },
    { id: "tree_fern", name: "เฟิร์นต้น", make: treeFern, tags: ["plant"] },
    { id: "elephant_ear", name: "บอนใบใหญ่", make: elephantEar, tags: ["plant"] },
    { id: "reeds", name: "กอกกริมบ่อ", make: () => solid(reeds()), tags: ["plant", "ground"] },
    { id: "strangler_fig", name: "ไทรยักษ์รากห้อย", make: stranglerFig, tags: ["landmark", "plant"] },
    { id: "vine_tree", name: "ต้นยางเถาวัลย์พัน", make: vineTree, tags: ["plant"] },
    { id: "ruin_temple", name: "ปราสาทหินร้างกลางป่า", make: ruinTemple, tags: ["landmark", "ruin"] },
    { id: "stone_face", name: "เศียรหินโบราณ", make: stoneFace, tags: ["landmark", "ruin"] },
    { id: "ruin_wall", name: "กำแพงศิลาแลงพัง (6 ม.)", make: ruinWall, tags: ["wall", "ruin"] },
    { id: "ruin_pillars", name: "เสาหินหักโค่น", make: ruinPillars, tags: ["ruin", "decor"] },
    { id: "ruin_gate", name: "ซุ้มประตูหินร้าง", make: ruinGate, tags: ["gate", "ruin"] },
    { id: "plank_bridge", name: "สะพานไม้ข้ามลำธาร", make: () => solid(plankBridge()), tags: ["ground", "bridge"] },
    { id: "explorer_camp", name: "ค่ายพักนักสำรวจ", make: explorerCamp, tags: ["camp", "decor"] },
    { id: "trail_sign", name: "ป้ายบอกทางในป่า", make: () => solid(trailSign()), tags: ["decor", "sign"] },
    { id: "mangrove", name: "ต้นโกงกาง", make: mangrove, tags: ["plant"] },
    { id: "nipa_palm", name: "กอต้นจาก", make: nipaPalm, tags: ["plant"] },
    { id: "boardwalk", name: "สะพานไม้ป่าชายเลน (4 ม.)", make: () => solid(boardwalk()), tags: ["ground", "dock"] },
    { id: "shipwreck", name: "ซากเรือสำเภาเกยตื้น", make: shipwreck, tags: ["landmark", "wreck"] },
    { id: "wreck_debris", name: "เศษซากเรือริมหาด", make: () => solid(wreckDebris()), tags: ["decor", "ground"] },
    { id: "sea_stack", name: "เกาะหินโผล่ทะเล", make: seaStack, tags: ["landmark", "rock"] },
    { id: "fish_stakes", name: "โพงพางดักปลา", make: () => solid(fishStakes()), tags: ["dock", "decor"] },
    { id: "beacon_ruin", name: "หอไฟเก่าบนแหลม", make: beaconRuin, tags: ["landmark", "tower", "light"] },
  ],
  sample,
};
