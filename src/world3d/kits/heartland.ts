// ทุ่งดอกไม้และไร่กังหันลม (heartland): the farmland west of Eden and down towards Venezia, for
// three fields.
// - The royal flower fields (ทุ่งดอกไม้หลวง) that grow for the palace and the cathedral: rows of
//   sunflowers, red poppies and white flowers on their beds of tilled earth; the royal apiary,
//   wooden hives in rows and the bee house where the king's honey is made, the beekeepers'
//   cottages and their honey stall, wild bees in an old stump; a little chapel in the fields.
// - The windmill fields (ทุ่งกังหันลม): a great tower mill whose sails turn all day and a wooden
//   post mill, the village's stone granary, its well, a hen house, wattle hurdles round the pens,
//   stooks of wheat on the stubble.
// - The lavender hills (ทุ่งลาเวนเดอร์): mounded rows of lavender, the perfume distillery with its
//   copper still under a lean-to, racks of bundles drying, the cart that brings the flowers in.
// And what lies about all three: a great boulder in the grass, stones heaped at a field's corner,
// wild roses, poppies and lavender growing wild.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front to -X. The
// beds and rows tile end to end along their own Y (their length in the name). The two windmills'
// sails turn (a material that spins them about the windshaft with the wind's clock).

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, sphereCenter, torus, gableRoof, gableWall, rock, toThree,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial, material, FLOWER_CELLS } from "../textures";
import type { Recipe } from "../textures";
import { coverTop, stumpOf, endGrain } from "../nature";
import { lump, shrub, wind, SHRUB_GREEN } from "../trees";
import type { ShrubLook, Lobe } from "../trees";
import { solid } from "./types";
import type { Kit, KitItem, Put } from "./types";

// ---- materials ----
const MATS: Record<string, Recipe> = {
  // field stone and dressed stone, limewash and the ochre render of the south
  Heartland_Stone: { map: "crag", tint: "#b3ab98", bump: 3 },
  Heartland_StoneDark: { map: "crag", tint: "#8c8576", bump: 3 },
  Heartland_StonePale: { map: "stone", tint: "#ddd5c1", bump: 2 },
  Heartland_Masonry: { map: "stone", tint: "#c8bea6", bump: 2 },
  Heartland_MasonryDark: { map: "stone", tint: "#a09680", bump: 2 },
  Heartland_Render: { map: "plaster", tint: "#f4efe3", bump: 0.6 },
  Heartland_RenderOchre: { map: "plaster", tint: "#e8c48c", bump: 0.6 },
  Heartland_Brick: { map: "brick", tint: "#b4694a", bump: 1.5 },
  // timber: framing, planks, grey old wood, the post mill's tarred boards, painted shutters
  Heartland_Timber: { map: "wood", tint: "#5a3b26", bump: 1.2 },
  Heartland_Plank: { map: "wood", tint: "#a37b50", bump: 1.2 },
  Heartland_OldWood: { map: "wood", tint: "#8b7a66", bump: 1.4 },
  Heartland_Boards: { map: "wood", tint: "#ece6d6", bump: 0.9 },
  Heartland_Shutter: { map: "wood", tint: "#7f98a8", bump: 1 },
  Heartland_ShutterGreen: { map: "wood", tint: "#6f8f62", bump: 1 },
  // roofs
  Heartland_RoofTile: { map: "tiles", tint: "#c46a46", bump: 2.5 },
  Heartland_RoofTileOld: { map: "tiles", tint: "#a8664c", bump: 2.5 },
  Heartland_Shingle: { map: "shingles", tint: "#7a6452", bump: 2.5 },
  Heartland_Thatch: { map: "thatch", tint: "#c4a45f", bump: 2 },
  Heartland_ThatchDark: { map: "thatch", tint: "#987d45", bump: 2 },
  Heartland_ChapelRoof: { map: "tiles", tint: "#4d79b6", bump: 2.5 },
  // the hives, painted, and their zinc roofs; straw skeps, comb and honey, the bees
  Heartland_Hive: { map: "wood", tint: "#efe9d9", bump: 0.8 },
  Heartland_HiveBlue: { map: "wood", tint: "#8db2d2", bump: 0.8 },
  Heartland_HiveYellow: { map: "wood", tint: "#e9c75c", bump: 0.8 },
  Heartland_HiveGreen: { map: "wood", tint: "#9dc08b", bump: 0.8 },
  Heartland_HiveRose: { map: "wood", tint: "#dca39b", bump: 0.8 },
  Heartland_HiveRoof: { map: "metal", tint: "#a3abad", rough: 0.5, metal: 0.4 },
  Heartland_Skep: { map: "thatch", tint: "#d3af63", bump: 2 },
  Heartland_Comb: { map: "felt", tint: "#e2a832", rough: 0.4, bump: 1.5 },
  Heartland_Honey: { tint: "#e39a1d", rough: 0.15, opacity: 0.9, glow: "#b86a08", glowI: 0.3 },
  Heartland_Bee: { map: "felt", tint: "#f2b81e", rough: 0.6 },
  Heartland_BeeDark: { tint: "#241a12", rough: 0.6 },
  Heartland_Wing: { tint: "#eef6ff", rough: 0.2, opacity: 0.55 },
  // metal and glass: the still's copper, the gilt of the royal crest, bottles
  Heartland_Copper: { map: "metal", tint: "#cc7c48", rough: 0.32, metal: 0.75 },
  Heartland_CopperDark: { map: "metal", tint: "#8c5032", rough: 0.45, metal: 0.6 },
  Heartland_Gilt: { map: "metal", tint: "#dab14a", rough: 0.32, metal: 0.65 },
  Heartland_Bottle: { tint: "#9c86c8", rough: 0.12, opacity: 0.7 },
  Heartland_Wire: { tint: "#a6acaf", rough: 0.5, metal: 0.3, opacity: 0.4 },
  // cloth: sails and the awning's stripes, the crest's field
  Heartland_Sail: { map: "fabric", tint: "#efe5cf", rough: 1 },
  Heartland_Awning: { map: "fabric", tint: "#f2eddd", rough: 0.95 },
  Heartland_AwningGold: { map: "fabric", tint: "#e6b83c", rough: 0.95 },
  Heartland_Royal: { map: "fabric", tint: "#2f5aa6", rough: 0.9 },
  // earth, hay and straw
  Heartland_Soil: { map: "felt", tint: "#7c5b3c", rough: 1, bump: 1.5 },
  Heartland_SoilDry: { map: "felt", tint: "#a08566", rough: 1, bump: 1.5 },
  Heartland_Hay: { map: "thatch", tint: "#dcbd6c", bump: 2 },
  Heartland_HayDark: { map: "thatch", tint: "#b39446", bump: 2 },
  Heartland_Sack: { map: "fabric", tint: "#d8c79f", rough: 1 },
  // the sunflowers
  Heartland_Stem: { map: "felt", tint: "#5d8a32", rough: 0.9 },
  Heartland_SunLeaf: { map: "felt", tint: "#4c8530", rough: 0.85 },
  Heartland_SunPetal: { map: "felt", tint: "#f7c31d", rough: 0.8 },
  Heartland_SunPetalDeep: { map: "felt", tint: "#eb9b14", rough: 0.8 },
  Heartland_SunDisc: { map: "felt", tint: "#4a2c16", rough: 0.9, bump: 2 },
  // lavender: cut bundles, and the bushes' silver-green tufts
  Heartland_Lavender: { map: "felt", tint: "#8c6cbc", rough: 0.9, bump: 1.2 },
  Heartland_LavenderDark: { map: "felt", tint: "#634890", rough: 0.9, bump: 1.2 },
  Heartland_LavStem: { map: "felt", tint: "#8a9476", rough: 0.9 },
  Heartland_LavCore: { map: "foliage", tint: "#6b785f", rough: 1, bump: 1.5 },
  Heartland_LavDark: { card: "tuft", tint: "#66745d", rough: 0.9 },
  Heartland_LavMid: { card: "tuft", tint: "#8c997b", rough: 0.85 },
  Heartland_LavLight: { card: "tuft", tint: "#b2bc9b", rough: 0.8 },
  // the flower beds' leaves, and the meadow's tufts
  Heartland_BedCore: { map: "foliage", tint: "#4c7a33", rough: 1, bump: 1.5 },
  Heartland_BedDark: { card: "leaves", tint: "#447231", rough: 0.85 },
  Heartland_BedMid: { card: "leaves", tint: "#5d923f", rough: 0.8 },
  Heartland_BedLight: { card: "leaves", tint: "#86b759", rough: 0.75 },
  // hens and the rooster
  Heartland_Hen: { map: "felt", tint: "#a8582c", rough: 1, bump: 1.5 },
  Heartland_HenWhite: { map: "felt", tint: "#efe8da", rough: 1, bump: 1.5 },
  Heartland_Rooster: { map: "felt", tint: "#b8461f", rough: 0.9, bump: 1.5 },
  Heartland_TailGreen: { map: "felt", tint: "#2e5a3c", rough: 0.5 },
  Heartland_CombRed: { map: "felt", tint: "#d0301f", rough: 0.7 },
  Heartland_Beak: { map: "felt", tint: "#e3b04a", rough: 0.7 },
  // what grows on the stone
  Heartland_Lichen: { map: "felt", tint: "#c3b973", rough: 1 },
  Heartland_Moss: { map: "felt", tint: "#6c8a3c", rough: 1, bump: 1.5 },
  Heartland_Dark: { tint: "#1e1a16", rough: 1 },
  Heartland_Water: { tint: "#4f8ea6", rough: 0.08, opacity: 0.9 },
  Heartland_Fire: { tint: "#ff9a3c", rough: 1, glow: "#ff6a1a", glowI: 1.8 },
};
for (const [name, recipe] of Object.entries(MATS)) defineMaterial(name, recipe);

const LAV: ShrubLook = { core: "Heartland_LavCore", dark: "Heartland_LavDark", mid: "Heartland_LavMid", light: "Heartland_LavLight" };
const BED: ShrubLook = { core: "Heartland_BedCore", dark: "Heartland_BedDark", mid: "Heartland_BedMid", light: "Heartland_BedLight" };
const TUFT: ShrubLook = { core: "FoliageCore", dark: "TuftCardDark", mid: "TuftCard", light: "TuftCard" };
const F = FLOWER_CELLS;

// ---- helpers ----
const D = Math.PI / 180;
function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
// A flat triangle seen from both sides.
function tri(a: V3, b: V3, c: V3, mat: string): Geo {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([...a, ...b, ...c, ...a, ...c, ...b]), 3));
  geo.computeVertexNormals();
  const ab = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), ac = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
  geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 0, ab / 100, 0, 0, ac / 100, 0, 0, 0, ac / 100, ab / 100, 0]), 2));
  return [{ geo, mat }];
}
const quad = (a: V3, b: V3, c: V3, d: V3, mat: string): Geo => merge(tri(a, b, c, mat), tri(a, c, d, mat));
// the footprint's middle onto the origin
function centre(g: Geo): Geo {
  const b = new THREE.Box3();
  for (const p of g) {
    p.geo.computeBoundingBox();
    b.union(p.geo.boundingBox!);
  }
  return translate(g, [-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0]);
}
// World-aligned texture coordinates (metres / s): courses of stone and boards stay level.
function wuv(g: Geo, s = 1): Geo {
  return g.map(({ geo, mat }) => {
    const out = geo.clone();
    const pos = out.getAttribute("position"), nor = out.getAttribute("normal");
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i)), nz = Math.abs(nor.getZ(i));
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const side = nz < nx || nz < ny;
      const [u, v] = side ? (nx >= ny ? [y, z] : [x, z]) : [x, y];
      uv[i * 2] = u / (100 * s);
      uv[i * 2 + 1] = v / (100 * s);
    }
    out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    return { geo: out, mat };
  });
}
// A polygon (along the wall, up) extruded through a -X facing wall from x0 to x0 + depth.
function panelX(pts: [number, number][], x0: number, depth: number, mat: string): Geo {
  const s = new THREE.Shape();
  pts.forEach(([a, b], i) => (i ? s.lineTo(a, b) : s.moveTo(a, b)));
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 8 });
  g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, x0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  const geo = g.index ? g.toNonIndexed() : g;
  geo.clearGroups();
  return wuv([{ geo, mat }]);
}
// an arch's outline: from (-hw, 0) up to the springing, round over, down to (hw, 0)
const archPts = (hw: number, spring: number, n = 10): [number, number][] => [
  [-hw, 0], [hw, 0], [hw, spring],
  ...Array.from({ length: n - 1 }, (_, i) => [hw * Math.cos(((i + 1) / n) * Math.PI), spring + hw * Math.sin(((i + 1) / n) * Math.PI)] as [number, number]),
  [-hw, spring],
];
// A window in a -X facing wall, its sill at z = 0: glass in a frame with a cross bar, a stone sill
// and lintel, shutters open either side if asked.
function windowX(w: number, h: number, o: { shutters?: string; frame?: string; sill?: string; arch?: boolean; box?: boolean } = {}): Geo {
  const hw = w / 2, fr = o.frame ?? "Heartland_Timber", st = o.sill ?? "Heartland_StonePale";
  const out: Geo[] = [];
  if (o.arch) {
    const spring = h - hw;
    out.push(panelX(archPts(hw, spring), -3, 5, "GlassBlue"));
    out.push(panelX(archPts(hw + 8, spring), -1, 3, st));
    out.push(boxBounds([-7, -2, 0], [-3, 2, h - 4], fr), boxBounds([-7, -hw, spring - 2], [-3, hw, spring + 2], fr));
    out.push(boxBounds([-14, -hw - 12, -10], [2, hw + 12, 0], st, 2));
    return merge(...out);
  }
  out.push(boxBounds([-4, -hw, 0], [2, hw, h], "GlassBlue"));
  out.push(boxBounds([-8, -hw - 6, -2], [0, -hw, h + 2], fr), boxBounds([-8, hw, -2], [0, hw + 6, h + 2], fr), boxBounds([-8, -hw, h], [0, hw, h + 6], fr));
  out.push(boxBounds([-7, -2, 0], [-4, 2, h], fr), boxBounds([-7, -hw, h * 0.55 - 2], [-4, hw, h * 0.55 + 2], fr));
  out.push(boxBounds([-15, -hw - 12, -10], [2, hw + 12, -1], st, 2), boxBounds([-11, -hw - 14, h + 5], [2, hw + 14, h + 18], st, 2));
  if (o.shutters)
    for (const s of [-1, 1]) {
      const a = s * (hw + 8), b = s * (hw + 8 + hw);
      out.push(boxBounds([-7, Math.min(a, b), 0], [-3, Math.max(a, b), h], o.shutters, 1));
      for (const z of [h * 0.2, h * 0.75]) out.push(boxBounds([-9, Math.min(a, b) + 3, z], [-7, Math.max(a, b) - 3, z + 5], o.shutters));
    }
  // a box of flowers on the sill
  if (o.box) {
    out.push(boxBounds([-30, -hw - 4, -22], [-8, hw + 4, -8], "Heartland_Plank", 1.5));
    out.push(shrub({ seed: Math.round(w * 7 + h), lobes: [[-19, -hw * 0.5, -4, 13, hw * 0.55, 9], [-19, hw * 0.5, -4, 13, hw * 0.55, 9]], leaf: 10, look: BED, core: 0.7, density: 0.6, flowers: { cells: [F.roseRed, F.pansy, F.marigold], n: 18, size: 9, up: 0.6 } }));
  }
  return merge(...out);
}
// A plank door in a -X facing wall (bottom at z = 0) in a frame, its head square or round.
function doorX(w: number, h: number, o: { arch?: boolean; frame?: string; wood?: string } = {}): Geo {
  const hw = w / 2, fr = o.frame ?? "Heartland_StonePale", spring = o.arch ? h - hw : h;
  const out: Geo[] = [panelX(o.arch ? archPts(hw, spring) : [[-hw, 0], [hw, 0], [hw, h], [-hw, h]], -5, 4, o.wood ?? "DoorWood")];
  for (let y = -hw + 14; y < hw - 4; y += 16) out.push(boxBounds([-6, y - 0.8, 2], [-5, y + 0.8, spring - 4], "WoodDark"));
  for (const z of [h * 0.18, spring * 0.78]) out.push(boxBounds([-8, -hw + 4, z], [-5, hw - 4, z + 6], "IronDark"));
  if (o.arch) out.push(panelX(archPts(hw + 14, spring), -2, 4, fr).map((p) => p), boxBounds([-10, -hw - 14, 0], [0, -hw, spring], fr, 2), boxBounds([-10, hw, 0], [0, hw + 14, spring], fr, 2));
  else out.push(boxBounds([-12, -hw - 14, h], [3, hw + 14, h + 18], fr, 2), boxBounds([-10, -hw - 12, 0], [2, -hw, h], fr, 2), boxBounds([-10, hw, 0], [2, hw + 12, h], fr, 2));
  out.push(translate(rotateY(cylinderBetween([0, 0, 0], [0, 0, 1], 5, 8, "IronDark"), 90), [-9, hw * 0.6, h * 0.45]));
  return merge(...out);
}
// Half-timbering on a -X facing wall from y0 to y1, z0 to z1: posts, rails and braces standing
// proud of the render.
function timbersX(x: number, y0: number, y1: number, z0: number, z1: number, step: number, skip: (y: number, z: number) => boolean = () => false): Geo {
  const out: Geo[] = [], T = "Heartland_Timber";
  const n = Math.max(1, Math.round((y1 - y0) / step)), dy = (y1 - y0) / n, mid = (z0 + z1) / 2;
  out.push(boxBounds([x - 8, y0, z0], [x + 1, y1, z0 + 14], T, 1.5), boxBounds([x - 8, y0, z1 - 14], [x + 1, y1, z1], T, 1.5));
  for (let i = 0; i <= n; i++) {
    const y = y0 + i * dy;
    if (!skip(y, mid)) out.push(boxBounds([x - 8, y - 7, z0], [x + 1, y + 7, z1], T, 1.5));
  }
  for (let i = 0; i < n; i++) {
    const ya = y0 + i * dy, yb = ya + dy, yc = (ya + yb) / 2;
    if (skip(yc, mid)) continue;
    out.push(boxBounds([x - 7, ya, mid - 6], [x, yb, mid + 6], T, 1));
    out.push(i % 2 ? beamBetween([x - 4, ya + 6, z0 + 14], [x - 4, yb - 6, mid - 6], 9, 7, T) : beamBetween([x - 4, ya + 6, mid - 6], [x - 4, yb - 6, z0 + 14], 9, 7, T));
  }
  return merge(...out);
}
// A gable roof whose ridge runs along Y (its eaves over the front and back), sx deep, sy long.
const roofY = (sx: number, sy: number, th: number, z: number, rise: number, over: number, mat: string): Geo => rotateZ(gableRoof([sy, sx, th], [0, 0, z], rise, over, mat), 90);
// and the triangles closing it at y = ±sy/2
const gablesY = (sx: number, sy: number, z: number, rise: number, mat: string): Geo => merge(rotateZ(gableWall(-sy / 2, sx / 2, z, rise, mat), 90), rotateZ(gableWall(sy / 2, sx / 2, z, rise, mat), 90));
// The top half of a barrel lying along X from x0 to x1 (a boat cap, a curved roof): ry across,
// rz high, its flat underside at z; the half discs closing its ends.
function halfBarrel(x0: number, x1: number, ry: number, rz: number, z: number, mat: string): Geo {
  const L = x1 - x0, g = new THREE.CylinderGeometry(1, 1, L, 14, 1, false, -Math.PI / 2, Math.PI);
  const uv = g.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * Math.PI * (ry + rz)) / 200, (uv.getY(i) * L) / 100);
  // three's axis (its Y) along X, the half it keeps (+Z) up
  g.applyMatrix4(new THREE.Matrix4().set(0, 1, 0, (x0 + x1) / 2, -ry, 0, 0, 0, 0, 0, rz, z, 0, 0, 0, 1));
  return [{ geo: g, mat }];
}
// Moss on the stonework's faces that look up.
const mossed = (g: Geo, seed: number, amount = 0.14): Geo => merge(g, coverTop(g.filter((p) => /Heartland_(Stone|Masonry)/.test(p.mat)), "Heartland_Moss", { amount, thick: 1.4, seed, grain: 30, patches: 0.45 }));
// a straw skep: coiled straw in rings, a dome, its little door
function skep(r = 26, h = 44): Geo {
  const out: Geo[] = [cylinderAt({ rBot: r, rTop: r * 0.82, height: h * 0.55, segments: 12, bottom: [0, 0, 0] }, "Heartland_Skep")];
  out.push(translate(scale(sphereCenter(1, [0, 0, 0], "Heartland_Skep", 12), [r * 0.82, r * 0.82, h * 0.48]), [0, 0, h * 0.55]));
  for (let k = 0; k < 5; k++) {
    const z = 5 + k * (h * 0.19), rr = k < 3 ? r - k * (r * 0.06) : r * 0.82 * Math.cos(((k - 2) * 0.28 * Math.PI) / 1.1);
    out.push(translate(torus(rr + 0.6, 2.2, 14, 4, "Heartland_HayDark"), [0, 0, z]));
  }
  out.push(boxBounds([-r - 1, -5, 0], [-r + 6, 5, 7], "Heartland_Dark"));
  return merge(...out);
}
// A bee: a striped body, a dark head, two wings; about the size of a sparrow, so it reads.
function bee(at: V3, yaw: number): Geo {
  const b: Geo[] = [
    translate(scale(sphereCenter(1, [0, 0, 0], "Heartland_Bee", 6), [3.4, 2.4, 2.3]), [0, 0, 0]),
    translate(scale(sphereCenter(1, [0, 0, 0], "Heartland_BeeDark", 6), [0.9, 2.5, 2.4]), [0.6, 0, 0]),
    translate(scale(sphereCenter(1, [0, 0, 0], "Heartland_BeeDark", 6), [0.8, 2.3, 2.2]), [2.2, 0, 0]),
    sphereCenter(1.7, [-3.6, 0, 0.3], "Heartland_BeeDark", 6),
    tri([0, 0, 1.8], [2.5, 5.2, 4.5], [-1.5, 4.5, 3.5], "Heartland_Wing"),
    tri([0, 0, 1.8], [2.5, -5.2, 4.5], [-1.5, -4.5, 3.5], "Heartland_Wing"),
  ];
  return translate(rotateZ(merge(...b), yaw), at);
}
// A row of lobes along Y from -L/2 to L/2 (a planted row), each a little different.
function rowLobes(L: number, step: number, x: number, z: number, r: [number, number, number], rnd: () => number): Lobe[] {
  const out: Lobe[] = [];
  for (let y = -L / 2 + step / 2; y < L / 2; y += step) out.push([x + (rnd() - 0.5) * 8, y + (rnd() - 0.5) * 10, z, r[0] * (0.9 + rnd() * 0.2), r[1] * (0.9 + rnd() * 0.2), r[2] * (0.85 + rnd() * 0.3)]);
  return out;
}

// ---- the turning sails ----
// Sails spin about the windshaft: the sails' own geometry is built round their hub with the
// shaft along X, and this material turns every vertex (and normal) about X by the wind's clock
// before the piece is placed, each windmill a little out of step with the next (by where it
// stands). The shadows turn with them (the same in a depth material).
const SPIN_SPEED = 0.55; // radians a second
const SPIN_HEAD = `
uniform float uWind;
vec3 heartlandSpin(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }
float heartlandAngle() {
#ifdef USE_INSTANCING
  return uWind * ${SPIN_SPEED.toFixed(3)} + instanceMatrix[3].x * 0.0021 + instanceMatrix[3].z * 0.0013;
#else
  return uWind * ${SPIN_SPEED.toFixed(3)};
#endif
}`;
const spinMats = new Map<string, THREE.Material>();
function spinMaterial(name: string): THREE.Material {
  let m = spinMats.get(name);
  if (m) return m;
  const base = material(name).clone();
  base.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = wind;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${SPIN_HEAD}`)
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nobjectNormal = heartlandSpin(objectNormal, heartlandAngle());")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed = heartlandSpin(transformed, heartlandAngle());");
  };
  base.customProgramCacheKey = () => "heartland-spin";
  spinMats.set(name, (m = base));
  return m;
}
let spinDepth: THREE.MeshDepthMaterial | null = null;
function spinDepthMaterial(): THREE.MeshDepthMaterial {
  if (spinDepth) return spinDepth;
  const d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  d.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = wind;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${SPIN_HEAD}`)
      .replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed = heartlandSpin(transformed, heartlandAngle());");
  };
  d.customProgramCacheKey = () => "heartland-spin-depth";
  return (spinDepth = d);
}
// A windmill: its body (a Geo) and its sails (a Geo round their hub, the shaft along X), the
// sails set turning at `hub`.
function withSails(body: Geo, sails: Geo, hub: V3): THREE.Group {
  const g = new THREE.Group();
  g.add(solid(body));
  const s = toThree(sails, spinMaterial);
  s.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) mesh.customDepthMaterial = spinDepthMaterial();
  });
  // (Z up, cm -> the scene's Y up)
  s.position.set(hub[0], hub[2], -hub[1]);
  g.add(s);
  return g;
}
// Four common sails round a hub at the origin, the shaft along X (they face -X): each a lattice
// of bars between two whips, canvas spread over it, `R` from the hub to the tips.
function commonSails(R: number, w: number, r0: number): Geo {
  const out: Geo[] = [];
  // the stocks through the hub, the boss
  out.push(cylinderBetween([12, 0, 0], [-34, 0, 0], 30, 10, "Heartland_Timber"), cylinderBetween([-34, 0, 0], [-46, 0, 0], 18, 8, "IronDark"));
  for (let k = 0; k < 4; k++) {
    const one: Geo[] = [];
    // the whip up the middle, from the hub to the tip
    one.push(boxBounds([-30, -7, 0], [-16, 7, R], "Heartland_Timber", 1.5));
    // the lattice on the leading side: hemlath, bars, the heel
    one.push(boxBounds([-28, w - 5, r0], [-22, w + 1, R - 10], "Heartland_Plank", 1));
    one.push(boxBounds([-28, -w * 0.32 - 4, r0], [-22, -w * 0.32 + 2, R - 10], "Heartland_Plank", 1));
    for (let z = r0; z <= R - 10; z += 44) one.push(boxBounds([-29, -w * 0.32, z - 2.5], [-21, w, z + 2.5], "Heartland_Plank", 0.8));
    // the canvas spread behind the bars, a little bellied
    const zs = [r0 + 10, (r0 + R) / 2, R - 20];
    one.push(quad([-20, -w * 0.3, zs[0]], [-20, w - 4, zs[0]], [-14, w - 6, zs[1]], [-14, -w * 0.3, zs[1]], "Heartland_Sail"));
    one.push(quad([-14, -w * 0.3, zs[1]], [-14, w - 6, zs[1]], [-20, w - 4, zs[2]], [-20, -w * 0.3, zs[2]], "Heartland_Sail"));
    // the reefing cord along the edge
    one.push(cylinderBetween([-20, w - 2, r0], [-20, w - 2, R - 20], 0.9, 3, "RopeTan"));
    out.push(rotateX(merge(...one), k * 90 + 15));
  }
  return merge(...out);
}

// =============================== the natural pieces ===============================

// หินใหญ่กลางทุ่ง: a granite boulder left standing in the grass (about 3 m across, 1.7 m high), a
// smaller one leaning on it, lichen over the top, grass and flowers round its foot.
function meadowBoulder(): Geo {
  const big = rock([290, 230, 175], 0.32, 41, "Heartland_Stone");
  const out: Geo[] = [big, translate(rock([140, 115, 85], 0.36, 43, "Heartland_StoneDark"), [125, 115, 0]), translate(rock([70, 60, 40], 0.4, 47, "Heartland_Stone"), [-150, -70, 0])];
  out.push(coverTop(big, "Heartland_Moss", { amount: 0.12, thick: 1.2, seed: 5, patches: 0.3, grain: 22 }));
  out.push(shrub({
    seed: 13, leaf: 16, look: TUFT, core: 0, ragged: 0.8, density: 0.8,
    lobes: [[-140, 40, 12, 40, 55, 16], [40, -125, 12, 55, 40, 14], [160, 20, 10, 38, 40, 12], [-60, 130, 10, 45, 35, 12]],
    flowers: { cells: [F.daisy, F.buttercup, F.forgetMeNot], n: 18, size: 12, up: 0.8 },
  }));
  return merge(...out);
}

// กองหินเก็บจากไร่: the stones picked off a field over the years, heaped at its corner (about 2.4
// m across), nettles and poppies coming up through them.
function fieldStones(): Geo {
  const rnd = seeded(51), out: Geo[] = [];
  const mats = ["Heartland_Stone", "Heartland_Stone", "Heartland_StoneDark", "Heartland_StonePale"];
  // the bottom course out wide, then smaller stones heaped up the middle
  for (let i = 0; i < 24; i++) {
    const up = i / 24, a = rnd() * Math.PI * 2, d = (1 - up) * 85 * Math.sqrt(0.35 + rnd() * 0.65), s = 46 + rnd() * 26 - up * 14;
    out.push(translate(rotateZ(rock([s * 1.2, s, s * 0.8], 0.25, 60 + i, mats[i % 4], false, 1), rnd() * 360), [Math.cos(a) * d * 1.3, Math.sin(a) * d, up * 70 - 6]));
  }
  out.push(shrub({
    seed: 53, leaf: 15, look: TUFT, core: 0, ragged: 0.9, density: 0.9,
    lobes: [[-120, -30, 14, 30, 45, 22], [90, 80, 12, 35, 40, 18], [20, -110, 12, 40, 30, 16]],
    flowers: { cells: [F.roseRed, F.roseRed, F.daisy], n: 16, size: 13, up: 0.8 },
  }));
  return merge(...out);
}

// ตอไม้รังผึ้งป่า: an old oak stump, hollow, where wild bees have built: comb hanging out of the
// split in its side, honey run down the bark, bees about it.
function beeStump(): Geo {
  const out: Geo[] = [stumpOf({ seed: 71, r: 48, h: 110, bark: "BarkWarm", wood: endGrain("#c7a06a"), broken: true, roots: 6, moss: "Heartland_Moss", mossAmount: 0.3 })];
  // the split: a dark hollow on its front, the comb in tiers inside it
  out.push(translate(scale(sphereCenter(1, [0, 0, 0], "Heartland_Dark", 10), [16, 22, 34]), [-40, 0, 58]));
  for (let k = 0; k < 4; k++) out.push(translate(rotateZ(scale(sphereCenter(1, [0, 0, 0], "Heartland_Comb", 8), [3, 8 + k, 16 - k * 2]), (k - 1.5) * 10), [-48 + k * 2, -12 + k * 8, 56 - k * 4]));
  // honey run down the bark below it
  for (const y of [-6, 6]) out.push(cylinderBetween([-50, y, 40], [-52, y + 2, 14], 2.2, 5, "Heartland_Honey", 1.2));
  const rnd = seeded(73);
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2, d = 40 + rnd() * 50;
    out.push(bee([-60 + Math.cos(a) * d * 0.6, Math.sin(a) * d, 50 + rnd() * 80], rnd() * 360));
  }
  out.push(shrub({ seed: 75, leaf: 15, look: TUFT, core: 0, ragged: 0.8, density: 0.8, lobes: [[-90, -60, 10, 40, 40, 14], [70, 80, 10, 40, 40, 14]], flowers: { cells: [F.daisy, F.tinyYellow], n: 12, size: 11, up: 0.8 } }));
  return merge(...out);
}

// พุ่มกุหลาบป่า: a wild rose (a dog rose) sprawling 2 m across, thick with pink and white flowers.
function flowerBush(): Geo {
  return shrub({
    seed: 81, leaf: 17, look: SHRUB_GREEN, ragged: 0.6, density: 0.9, core: 0.78, stems: { mat: "BarkWarm", r: 2.5, n: 6 },
    lobes: [[0, 0, 52, 62, 56, 46], [48, 30, 40, 44, 40, 36], [-46, 34, 42, 46, 40, 38], [16, -52, 38, 42, 38, 34], [-30, -40, 34, 40, 36, 30], [6, 8, 92, 40, 36, 26]],
    flowers: { cells: [F.rosePink, F.rosePink, F.blossom, F.cosmosPink], n: 90, size: 13, up: 0.6 },
  });
}

// ดงป๊อปปี้ป่า: wild poppies, cornflowers and daisies in the grass, a clump about 1.4 m across.
function poppyPatch(): Geo {
  return shrub({
    seed: 91, leaf: 15, look: TUFT, core: 0, ragged: 0.95, density: 0.85,
    lobes: [[0, 0, 16, 50, 46, 20], [44, 30, 12, 34, 30, 15], [-40, 36, 12, 32, 30, 14], [12, -46, 12, 34, 28, 14]],
    flowers: { cells: [F.roseRed, F.roseRed, F.roseRed, F.forgetMeNot, F.daisy], n: 44, size: 14, up: 0.85 },
  });
}

// กอลาเวนเดอร์ป่า: one wild lavender bush, a silver-green cushion bristling with purple spikes.
function lavenderClump(): Geo {
  return shrub({
    seed: 95, leaf: 13, look: LAV, core: 0.8, ragged: 0.5, density: 0.6,
    lobes: [[0, 0, 26, 40, 38, 26], [24, 16, 20, 26, 24, 20], [-22, 18, 20, 26, 24, 20], [6, -24, 20, 26, 22, 18]],
    flowers: { cells: [F.lavender, F.lavender, F.wisteria], n: 60, size: 22, up: 0.95 },
  });
}

// =============================== the flower fields ===============================

// One sunflower: a stem from `foot` up to its head at `h`, leaves in pairs, the head (a dark disc
// in two rings of petals) turned toward -X and lifted to the sky.
function sunflower(foot: V3, h: number, r: number, yaw: number, rnd: () => number): Geo {
  const out: Geo[] = [];
  const lean: V3 = [(rnd() - 0.5) * 18 - 8, (rnd() - 0.5) * 18, 0];
  const top: V3 = [foot[0] + lean[0], foot[1] + lean[1], h];
  out.push(cylinderBetween(foot, [top[0], top[1], h - r * 0.4], 2.6, 5, "Heartland_Stem", 1.8));
  // leaves: broad, drooping, in turn up the stem
  for (let k = 0; k < 4; k++) {
    const t = 0.25 + k * 0.17, a = (yaw + k * 137) * D, L = 34 - k * 5, W = 17 - k * 2;
    const b: V3 = [foot[0] + lean[0] * t, foot[1] + lean[1] * t, h * t];
    const tip: V3 = [b[0] + Math.cos(a) * L, b[1] + Math.sin(a) * L, b[2] - 8];
    const mid: V3 = [b[0] + Math.cos(a) * L * 0.5, b[1] + Math.sin(a) * L * 0.5, b[2] + 4];
    const side: V3 = [-Math.sin(a) * W * 0.5, Math.cos(a) * W * 0.5, 0];
    out.push(quad(b, [mid[0] + side[0], mid[1] + side[1], mid[2]], tip, [mid[0] - side[0], mid[1] - side[1], mid[2]], "Heartland_SunLeaf"));
  }
  // the head, built facing +Z then turned to face its way
  const head: Geo[] = [
    cylinderAt({ rBot: r * 0.6, rTop: r * 0.5, height: 6, segments: 10, bottom: [0, 0, -1] }, "Heartland_SunDisc"),
    cylinderAt({ rBot: r * 0.5, rTop: r * 0.12, height: 3, segments: 10, bottom: [0, 0, 5] }, "Heartland_SunDisc"),
    cylinderAt({ rBot: r * 0.3, rTop: r * 0.6, height: 8, segments: 8, bottom: [0, 0, -9] }, "Heartland_Stem"),
  ];
  const ring = (n: number, r0: number, r1: number, z: number, off: number, mat: string) => {
    for (let i = 0; i < n; i++) {
      const a0 = ((i + off) / n) * Math.PI * 2, a1 = ((i + 0.5 + off) / n) * Math.PI * 2, a2 = ((i + 1 + off) / n) * Math.PI * 2;
      head.push(tri([Math.cos(a0) * r0, Math.sin(a0) * r0, z], [Math.cos(a1) * r1, Math.sin(a1) * r1, z + 3], [Math.cos(a2) * r0, Math.sin(a2) * r0, z], mat));
    }
  };
  ring(12, r * 0.5, r * 1.08, 1.5, 0, "Heartland_SunPetal");
  ring(12, r * 0.5, r * 0.94, 0.5, 0.5, "Heartland_SunPetalDeep");
  // (lifted to the sky more than turned to the front: from above, a field of them reads yellow)
  const tilt = -(18 + rnd() * 22);
  out.push(translate(rotateZ(rotateY(merge(...head), tilt), (rnd() - 0.5) * 40), top));
  return merge(...out);
}
// แถวทานตะวัน: a row of sunflowers 8 m long, two staggered lines of them, taller than a man,
// their great heads all turned the same way (up, and to the front, -X).
function sunflowerRow(): Geo {
  const rnd = seeded(101), out: Geo[] = [];
  for (let y = -380, k = 0; y <= 380; y += 26, k++) {
    const x = (k % 2 ? 18 : -18) + (rnd() - 0.5) * 10;
    out.push(sunflower([x, y + (rnd() - 0.5) * 8, 0], 165 + rnd() * 70, 22 + rnd() * 7, rnd() * 360, rnd));
  }
  return merge(...out);
}

// A flower bed 8 m long along Y and 2.6 m across: three rows of plants on raked earth, each row
// a band of leafy clumps under its flowers.
function bed(seed: number, cells: number[], n: number, size: number, h: number): Geo {
  const rnd = seeded(seed), out: Geo[] = [boxAt([250, 800, 10], [0, 0, -4], "Heartland_Soil", 4)];
  // the furrows between the rows
  for (const x of [-42, 42]) out.push(boxBounds([x - 6, -396, 5], [x + 6, 396, 7], "Heartland_SoilDry", 2));
  for (const x of [-84, 0, 84])
    out.push(shrub({ seed: seed + x + 100, leaf: 17, look: BED, core: 0.92, coreDetail: 0, ragged: 0.6, density: 0.3, lobes: rowLobes(780, 95, x, h * 0.5, [40, 58, h * 0.5], rnd), flowers: { cells, n, size, up: 1.4 } }));
  return merge(...out);
}
// แปลงป๊อปปี้: a bed of red poppies.
const poppyBed = (): Geo => bed(111, [F.roseRed, F.roseRed, F.roseRed, F.tulips], 210, 18, 34);
// แปลงดอกไม้ขาว: a bed of white flowers (daisies and white blossom) for the cathedral's altars.
const whiteBed = (): Geo => bed(121, [F.daisy, F.daisy, F.blossom], 210, 18, 38);

// แถวลาเวนเดอร์: a row of lavender 8 m long, cushion after cushion on a ridge of dry earth.
function lavenderRow(): Geo {
  const rnd = seeded(131), out: Geo[] = [translate(scale(cylinderBetween([0, -400, 0], [0, 400, 0], 55, 8, "Heartland_SoilDry"), [1, 1, 0.25]), [0, 0, 0])];
  const lobes: Lobe[] = [];
  for (let y = -360; y <= 360; y += 80) lobes.push([(rnd() - 0.5) * 8, y + (rnd() - 0.5) * 8, 34, 46 + rnd() * 6, 42 + rnd() * 4, 34 + rnd() * 6]);
  out.push(shrub({ seed: 133, leaf: 15, look: LAV, core: 0.85, coreDetail: 0, ragged: 0.5, density: 0.36, lobes, flowers: { cells: [F.lavender, F.lavender, F.lavender, F.wisteria], n: 340, size: 24, up: 0.95 } }));
  return merge(...out);
}

// รังผึ้งไม้: a wooden hive on its stand: two boxes (the brood and the honey above it) under a zinc
// roof, the entrance slot over its landing board, bees coming and going. Painted white (the
// fields put them in other colours).
function beehive(): Geo {
  const H = "Heartland_Hive", out: Geo[] = [];
  for (const [x, y] of [[-22, -22], [-22, 22], [22, -22], [22, 22]] as [number, number][]) out.push(boxAt([7, 7, 34], [x, y, 0], "Heartland_OldWood", 1));
  out.push(boxAt([66, 66, 6], [0, 0, 32], "Heartland_OldWood", 1.5));
  out.push(boxBounds([-28, -28, 38], [28, 28, 46], H, 1.5));
  out.push(boxBounds([-46, -20, 39], [-28, 20, 42], H, 1));
  out.push(boxBounds([-27, -27, 46], [27, 27, 86], H, 1.5), boxBounds([-26, -26, 86], [26, 26, 88], "Heartland_Dark"), boxBounds([-27, -27, 88], [27, 27, 112], H, 1.5));
  out.push(boxBounds([-28.5, -16, 46], [-26, 16, 51], "Heartland_Dark"));
  // the hand holds in the sides
  for (const s of [-1, 1]) for (const z of [70, 102]) out.push(boxBounds([-10, s * 27 - 1.5, z], [10, s * 27 + 1.5, z + 4], "Heartland_Dark"));
  // the roof: a gable of zinc, its ends closed
  out.push(boxBounds([-30, -30, 112], [30, 30, 116], H, 1));
  out.push(gableRoof([66, 64, 3], [0, 0, 116], 16, 4, "Heartland_HiveRoof"), gableWall(-31, 30, 116, 16, H), gableWall(31, 30, 116, 16, H));
  out.push(bee([-58, -10, 58], 20), bee([-72, 12, 76], -40), bee([-44, 22, 92], 150), bee([-90, -14, 64], 70));
  return merge(...out);
}

// โรงรังผึ้งหลวง: the royal bee house, 6.4 m long, open on its front: the hives on two shelves
// inside, each with a painted front and its own landing board; the king's crest on the gable
// end, boxes of flowers along the plinth, skeps and the smoker on a bench by its end.
function beeHouse(): Geo {
  const X = 150, Y = 320, Z0 = 40, H = 270, out: Geo[] = [];
  out.push(mossed(boxBounds([-X - 10, -Y - 10, 0], [X + 10, Y + 10, Z0], "Heartland_Masonry", 3), 3, 0.1));
  // the back and the ends: limewash in a frame of timber
  out.push(boxBounds([X - 24, -Y, Z0], [X, Y, H], "Heartland_Render"), rotateZ(timbersX(-X, -Y, Y, Z0, H, 130), 180));
  for (const s of [-1, 1]) {
    out.push(boxBounds([-X, s < 0 ? -Y : Y - 20, Z0], [X, s < 0 ? -Y + 20 : Y, H], "Heartland_Render"));
    out.push(rotateZ(timbersX(-Y, -X, X, Z0, H, 100), s * 90));
  }
  // the open front: posts, a beam
  for (const y of [-Y + 10, -105, 105, Y - 10]) out.push(boxBounds([-X - 4, y - 9, Z0], [-X + 14, y + 9, H], "Heartland_Timber", 2));
  out.push(boxBounds([-X - 6, -Y, H - 26], [-X + 16, Y, H], "Heartland_Timber", 2));
  // the shelves and the hives on them, fronts painted in turn
  const paints = ["Heartland_HiveBlue", "Heartland_HiveYellow", "Heartland_Hive", "Heartland_HiveGreen", "Heartland_HiveRose"];
  for (const [k, z] of [[0, Z0 + 40], [1, Z0 + 130]] as [number, number][]) {
    out.push(boxBounds([-X + 4, -Y + 20, z - 10], [X - 30, Y - 20, z], "Heartland_Plank", 1.5));
    for (let i = 0; i < 6; i++) {
      const y = -Y + 70 + i * 100, p = paints[(i + k * 2) % paints.length];
      out.push(boxBounds([-X + 30, y - 38, z], [-X + 100, y + 38, z + 62], "Heartland_OldWood", 1.5));
      out.push(boxBounds([-X + 24, y - 40, z], [-X + 30, y + 40, z + 64], p, 1));
      // a painted door on the front, its slot and landing board
      out.push(boxBounds([-X + 22, y - 18, z + 26], [-X + 24, y + 18, z + 54], k ? "Heartland_HiveYellow" : "Heartland_Hive"));
      out.push(boxBounds([-X + 21, y - 12, z + 4], [-X + 24, y + 12, z + 9], "Heartland_Dark"), boxBounds([-X + 6, y - 14, z + 2], [-X + 24, y + 14, z + 4], p));
    }
  }
  // the roof: tiles over the eaves front and back
  out.push(roofY(2 * X, 2 * Y + 40, 12, H, 130, 46, "Heartland_RoofTile"), gablesY(2 * X, 2 * Y, H, 130, "Heartland_Render"));
  for (const s of [-1, 1]) out.push(boxBounds([-X, s * Y - 9, H - 4], [X, s * Y + 9, H + 12], "Heartland_Timber", 2));
  out.push(cylinderBetween([0, -Y - 50, H + 130], [0, Y + 50, H + 130], 9, 8, "Heartland_RoofTileOld"));
  // the crest on the front, over the middle: a blue shield, a gilt crown and a bee
  const cx = -X - 30, cz = H + 4;
  for (const s of [-1, 1]) out.push(boxBounds([cx + 2, s * 40 - 4, H - 30], [cx + 10, s * 40 + 4, cz + 10], "Heartland_Timber"));
  out.push(boxBounds([cx - 2, -54, cz - 10], [cx + 6, 54, cz + 62], "Heartland_Timber", 2), boxBounds([cx - 4, -46, cz - 4], [cx, 46, cz + 56], "Heartland_Royal"));
  out.push(boxBounds([cx - 7, -26, cz + 30], [cx - 3, 26, cz + 38], "Heartland_Gilt"));
  for (const y of [-24, -12, 0, 12, 24]) out.push(cylinderAt({ rBot: 4, rTop: 0.5, height: y === 0 ? 18 : 12, segments: 4, bottom: [cx - 5, y, cz + 38] }, "Heartland_Gilt"));
  out.push(translate(scale(sphereCenter(1, [0, 0, 0], "Heartland_Bee", 8), [3, 9, 6]), [cx - 5, 0, cz + 14]));
  for (const z of [cz + 10, cz + 18]) out.push(boxBounds([cx - 8, -9, z], [cx - 6, 9, z + 3], "Heartland_BeeDark"));
  // boxes of flowers along the plinth's front
  for (const y of [-212, 0, 212]) {
    out.push(boxBounds([-X - 50, y - 70, 0], [-X - 14, y + 70, 30], "Heartland_Plank", 2));
    out.push(shrub({ seed: 141 + y + 300, lobes: [[-X - 32, y - 35, 34, 18, 34, 14], [-X - 32, y + 35, 34, 18, 34, 14]], leaf: 12, look: BED, core: 0.7, density: 0.6, flowers: { cells: [F.marigold, F.cosmosPink, F.daisy], n: 22, size: 11, up: 0.7 } }));
  }
  // a bench by the end: skeps and the smoker
  out.push(boxBounds([-60, Y + 30, 40], [60, Y + 80, 46], "Heartland_Plank", 1.5));
  for (const x of [-48, 48]) out.push(boxBounds([x - 5, Y + 34, 0], [x + 5, Y + 76, 40], "Heartland_OldWood", 1));
  out.push(translate(skep(22, 38), [-26, Y + 55, 46]), translate(skep(20, 34), [24, Y + 55, 46]));
  out.push(cylinderAt({ radius: 9, height: 22, segments: 8, bottom: [-70, Y + 110, 0] }, "Heartland_Copper"), cylinderAt({ rBot: 9, rTop: 3, height: 10, segments: 8, bottom: [-70, Y + 110, 22] }, "Heartland_Copper"));
  for (let i = 0; i < 10; i++) out.push(bee([-X - 40 - (i % 3) * 22, -Y + 60 + i * 60, 90 + (i % 4) * 40], i * 47));
  return centre(merge(...out));
}

// บ้านคนเลี้ยงผึ้ง: a beekeeper's cottage (7 m long), white walls in a frame of dark timber under a
// deep thatch, its door in the middle of the front under a little hood, windows with flower
// boxes, the chimney at one end; skeps on a shelf by the door and a sign of a hive hung out.
function beekeeperCottage(): Geo {
  const X = 250, Y = 350, Z0 = 36, H = 330, out: Geo[] = [];
  out.push(mossed(boxBounds([-X - 10, -Y - 10, 0], [X + 10, Y + 10, Z0], "Heartland_Masonry", 3), 7, 0.1));
  out.push(boxBounds([-X, -Y, Z0], [X, Y, H], "Heartland_Render"));
  const door = (y: number) => Math.abs(y + 40) < 80;
  const win = (y: number, z: number) => (Math.abs(y - 170) < 75 || Math.abs(y + 230) < 60) && z > 100;
  out.push(timbersX(-X, -Y, Y, Z0, H, 116, (y, z) => door(y) || win(y, z)));
  out.push(rotateZ(timbersX(-X, -Y, Y, Z0, H, 116), 180));
  for (const s of [-1, 1]) out.push(rotateZ(timbersX(-Y, -X, X, Z0, H, 125), s * 90));
  // the door under its hood, windows in the front and the ends
  out.push(translate(doorX(100, 215, { frame: "Heartland_Timber" }), [-X, -40, Z0]));
  out.push(translate(roofY(70, 170, 6, Z0 + 250, 30, 10, "Heartland_Shingle"), [-X - 32, -40, 0]));
  for (const s of [-1, 1]) out.push(beamBetween([-X - 2, -40 + s * 72, Z0 + 205], [-X - 58, -40 + s * 72, Z0 + 248], 8, 8, "Heartland_Timber"));
  out.push(translate(windowX(80, 90, { shutters: "Heartland_ShutterGreen", box: true }), [-X, 170, Z0 + 95]));
  out.push(translate(windowX(64, 80, { shutters: "Heartland_ShutterGreen", box: true }), [-X, -230, Z0 + 100]));
  out.push(translate(rotateZ(windowX(70, 84, { shutters: "Heartland_ShutterGreen" }), 90), [0, -Y, Z0 + 100]));
  out.push(translate(rotateZ(windowX(56, 70, {}), -90), [80, Y, Z0 + 110]));
  out.push(translate(rotateZ(windowX(80, 88, {}), 180), [X, 60, Z0 + 95]));
  // the thatch, deep and rounded at its ridge, the gables under it
  out.push(roofY(2 * X, 2 * Y + 30, 32, H - 26, 250, 56, "Heartland_Thatch"), gablesY(2 * X, 2 * Y, H, 222, "Heartland_Render"));
  out.push(cylinderBetween([0, -Y - 70, H + 222], [0, Y + 70, H + 222], 30, 10, "Heartland_ThatchDark"));
  for (const s of [-1, 1]) out.push(beamBetween([s * (X + 58), -Y - 64, H - 34], [s * (X + 58), Y + 64, H - 34], 14, 12, "Heartland_ThatchDark"));
  // the chimney at the +Y end
  out.push(wuv(boxBounds([60, Y - 40, 0], [140, Y + 34, H + 300], "Heartland_MasonryDark", 3), 1.2), boxBounds([54, Y - 46, H + 290], [146, Y + 40, H + 306], "Heartland_StonePale", 2));
  out.push(cylinderAt({ radius: 13, height: 26, segments: 8, bottom: [100, Y - 3, H + 306] }, "Heartland_Brick"));
  // skeps on a shelf beside the door, the sign on its bracket
  out.push(boxBounds([-X - 50, 30, 54], [-X - 4, 150, 60], "Heartland_Plank", 1.5));
  for (const y of [30, 150]) out.push(boxBounds([-X - 44, y - 4, 0], [-X - 10, y + 4, 54], "Heartland_OldWood", 1));
  out.push(translate(skep(20, 34), [-X - 27, 58, 60]), translate(skep(20, 34), [-X - 27, 120, 60]));
  out.push(boxBounds([-X - 70, -150, Z0 + 240], [-X, -144, Z0 + 246], "IronDark"), cylinderBetween([-X - 60, -147, Z0 + 240], [-X - 60, -147, Z0 + 228], 0.8, 3, "IronDark"));
  out.push(translate(skep(16, 28), [-X - 60, -147, Z0 + 196]));
  // a water butt, a stack of hive boxes waiting by the back
  out.push(cylinderAt({ rBot: 30, rTop: 33, height: 90, segments: 10, bottom: [-X - 40, -Y + 50, 0] }, "Heartland_OldWood"));
  for (const z of [14, 74]) out.push(translate(cylinderAt({ radius: 34, height: 5, segments: 10, bottom: [0, 0, 0] }, "IronDark"), [-X - 40, -Y + 50, z]));
  for (let k = 0; k < 3; k++) out.push(boxBounds([X + 20, -120 + k * 4, k * 34], [X + 76, -64 + k * 4, k * 34 + 32], k === 1 ? "Heartland_HiveBlue" : "Heartland_Hive", 1.5));
  return centre(mossed(merge(...out), 9, 0.08));
}

// โบสถ์น้อยกลางทุ่ง: the little chapel in the fields (9 x 5.6 m), white walls and Eden's blue roof,
// buttresses down its sides, an arched door under a round window in the front gable and a bell
// in a stone bell-cote over it; steps up to the door, a cross on the bell-cote.
function fieldChapel(): Geo {
  const X = 450, Y = 280, Z0 = 34, H = 520, RISE = 290, out: Geo[] = [];
  out.push(boxBounds([-X - 14, -Y - 14, 0], [X + 14, Y + 14, Z0], "Heartland_StonePale", 3));
  out.push(wuv(boxBounds([-X, -Y, Z0], [X, Y, H], "Heartland_Render"), 1.4));
  out.push(gableWall(-X, Y, H, RISE, "Heartland_Render"), gableWall(X, Y, H, RISE, "Heartland_Render"));
  // the front gable built up as a thicker wall to carry the bell-cote, coped in stone
  const cope = (s: 1 | -1) => beamBetween([-X - 6, s * (Y + 16), H - 4], [-X - 6, 0, H + RISE + 6], 30, 22, "Heartland_StonePale");
  out.push(cope(1), cope(-1));
  // quoins and buttresses
  for (const sx of [-1, 1])
    for (const sy of [-1, 1])
      for (let z = Z0, k = 0; z < H - 20; z += 38, k++) {
        const lx = k % 2 ? 26 : 46, ly = k % 2 ? 46 : 26;
        out.push(boxBounds([sx > 0 ? sx * X - lx : -X - 3, sy > 0 ? sy * Y - ly : -Y - 3, z], [sx > 0 ? X + 3 : -X + lx, sy > 0 ? Y + 3 : -Y + ly, z + 36], "Heartland_StonePale", 2));
      }
  for (const x of [-150, 150])
    for (const s of [-1, 1]) {
      const y0 = s * Y, y1 = s * (Y + 60);
      out.push(boxBounds([x - 26, Math.min(y0, y1), Z0], [x + 26, Math.max(y0, y1), 300], "Heartland_StonePale", 2));
      out.push(translate(rotateX(boxBounds([-26, -30, 0], [26, 30, 120], "Heartland_StonePale", 2), s * 28), [x, s * (Y + 24), 280]));
    }
  // the door, steps up to it, the round window over it
  out.push(translate(doorX(130, 270, { arch: true, frame: "Heartland_StonePale", wood: "DoorWood" }), [-X, 0, Z0]));
  for (let i = 0; i < 3; i++) out.push(boxBounds([-X - 30 - (3 - i) * 26, -110, 0], [-X, 110, (i + 1) * 12], "Heartland_StonePale", 2));
  const rose: V3 = [-X - 4, 0, H + 70];
  out.push(translate(rotateY(cylinderAt({ radius: 58, height: 6, segments: 16, bottom: [0, 0, 0] }, "GlassBlue"), -90), rose));
  out.push(translate(rotateY(torus(62, 9, 18, 6, "Heartland_StonePale"), 90), rose));
  for (let k = 0; k < 6; k++) out.push(translate(rotateX(boxBounds([-3, -2.5, -56], [3, 2.5, 56], "Heartland_StonePale"), k * 30), rose));
  // tall arched windows down both sides, a round one in the back gable
  for (const x of [-300, 0, 300])
    for (const s of [-1, 1]) out.push(translate(rotateZ(windowX(70, 200, { arch: true, frame: "Heartland_StonePale" }), -s * 90), [x, s * Y, Z0 + 140]));
  out.push(translate(rotateY(cylinderAt({ radius: 40, height: 6, segments: 14, bottom: [0, 0, 0] }, "GlassBlue"), 90), [X + 4, 0, H + 60]), translate(rotateY(torus(44, 7, 16, 5, "Heartland_StonePale"), 90), [X + 4, 0, H + 60]));
  // the roof: Eden's blue tiles, a stone ridge
  out.push(gableRoof([2 * X + 20, 2 * Y, 20], [0, 0, H], RISE, 34, "Heartland_ChapelRoof"));
  out.push(cylinderBetween([-X + 30, 0, H + RISE + 12], [X + 30, 0, H + RISE + 12], 11, 8, "Heartland_StonePale"));
  // the bell-cote: two piers and an arch over the front gable's peak, the bell hung in it, a
  // little pitched cap and the cross
  const bz = H + RISE - 20, bx = -X - 6;
  for (const s of [-1, 1]) out.push(boxBounds([bx - 22, s * 58 - 16, bz], [bx + 22, s * 58 + 16, bz + 170], "Heartland_StonePale", 2));
  out.push(boxBounds([bx - 24, -76, bz + 150], [bx + 24, 76, bz + 176], "Heartland_StonePale", 2));
  out.push(translate(gableRoof([60, 170, 6], [0, 0, 0], 46, 6, "Heartland_ChapelRoof"), [bx, 0, bz + 176]), gableWall(bx - 26, 76, bz + 176, 40, "Heartland_StonePale"), gableWall(bx + 26, 76, bz + 176, 40, "Heartland_StonePale"));
  out.push(boxBounds([bx - 4, -42, bz + 128], [bx + 4, 42, bz + 136], "Heartland_Timber"));
  out.push(cylinderAt({ rBot: 26, rTop: 14, height: 34, segments: 12, bottom: [bx, 0, bz + 92] }, "Bronze"), translate(scale(sphereCenter(14, [0, 0, 0], "Bronze", 10), [1, 1, 0.6]), [bx, 0, bz + 126]));
  out.push(translate(torus(26, 3, 12, 4, "Bronze"), [bx, 0, bz + 92]));
  out.push(boxBounds([bx - 4, -4, bz + 222], [bx + 4, 4, bz + 290], "Heartland_Gilt"), boxBounds([bx - 4, -22, bz + 262], [bx + 4, 22, bz + 270], "Heartland_Gilt"));
  // lanterns by the door, rose bushes at the corners
  for (const s of [-1, 1]) {
    out.push(boxBounds([-X - 14, s * 110 - 4, Z0 + 230], [-X, s * 110 + 4, Z0 + 236], "IronDark"), boxAt([16, 16, 26], [-X - 12, s * 110, Z0 + 200], "LanternGlow", 1));
    out.push(translate(scale(flowerBush(), [0.6, 0.6, 0.6]), [-X - 70, s * (Y - 40), 0]));
  }
  return mossed(merge(...out), 21, 0.08);
}

// แผงน้ำผึ้ง: the beekeepers' honey stall: a counter of jars of honey in three shades, comb in its
// frames, a skep, under a striped awning; crates and a barrel of mead underneath.
function honeyStall(): Geo {
  const out: Geo[] = [], rnd = seeded(161);
  out.push(boxBounds([-50, -130, 0], [50, 130, 86], "Heartland_Plank", 2), boxBounds([-58, -136, 86], [56, 136, 94], "Heartland_OldWood", 2));
  out.push(boxBounds([-52, -110, 20], [-50, 110, 70], "Heartland_HiveYellow"));
  for (const [x, y] of [[-56, -132], [-56, 132], [46, -132], [46, 132]] as [number, number][]) out.push(boxAt([9, 9, x < 0 ? 210 : 250], [x, y, 0], "Heartland_Timber", 1.5));
  // the awning: stripes of white and gold, sloping down to the front
  for (let i = 0; i < 9; i++) {
    const y0 = -150 + i * 33.3;
    out.push(quad([60, y0, 252], [60, y0 + 33.3, 252], [-90, y0 + 33.3, 205], [-90, y0, 205], i % 2 ? "Heartland_AwningGold" : "Heartland_Awning"));
  }
  for (let i = 0; i < 9; i++) out.push(quad([-90, -150 + i * 33.3, 205], [-90, -150 + (i + 1) * 33.3, 205], [-92, -150 + (i + 1) * 33.3, 186], [-92, -150 + i * 33.3, 186], i % 2 ? "Heartland_Awning" : "Heartland_AwningGold"));
  // jars of honey in rows, their lids tied with cloth
  for (let r = 0; r < 3; r++)
    for (let i = 0; i < 7; i++) {
      const x = -36 + r * 22, y = -105 + i * 30 + (rnd() - 0.5) * 4, h = 16 + (r === 2 ? 4 : 0);
      out.push(cylinderAt({ radius: 7, height: h, segments: 8, bottom: [x, y, 94] }, "Heartland_Honey"), cylinderAt({ rBot: 8, rTop: 6, height: 4, segments: 8, bottom: [x, y, 94 + h] }, i % 2 ? "Heartland_AwningGold" : "FabricRed"));
    }
  // comb in its frame, a skep, a little sign of a bee
  out.push(translate(rotateY(merge(boxBounds([-2, -24, 0], [2, 24, 30], "Heartland_Plank"), boxBounds([-1, -21, 3], [1, 21, 27], "Heartland_Comb")), -12), [30, 80, 96]));
  out.push(translate(skep(16, 28), [24, -90, 94]));
  out.push(boxBounds([-60, -40, 214], [-56, 40, 244], "Heartland_Plank", 1), translate(scale(sphereCenter(1, [0, 0, 0], "Heartland_Bee", 8), [2, 14, 8]), [-61, 0, 229]));
  // underneath and beside: crates, a barrel
  out.push(boxAt([50, 60, 40], [-80, 160, 0], "Heartland_Plank", 2), boxAt([46, 54, 36], [-80, 160, 40], "Heartland_OldWood", 2));
  out.push(cylinderAt({ rBot: 26, rTop: 28, height: 70, segments: 10, bottom: [20, 170, 0] }, "Heartland_OldWood"), translate(torus(28, 2, 10, 3, "IronDark"), [20, 170, 12]), translate(torus(28, 2, 10, 3, "IronDark"), [20, 170, 58]));
  return centre(merge(...out));
}

// =============================== the windmill fields ===============================

// กังหันลมใหญ่: the great tower mill (to its cap 13 m), white walls over a stone foot, a gallery
// round it where the miller sets the sails, a cap of shingles turned into the wind with its tail
// pole down to the gallery, four common sails 15 m across that turn all day. Sacks of flour, a
// spare millstone and a cart wheel round its door.
function greatWindmill(): THREE.Object3D {
  const RB = 330, RT = 235, Z0 = 40, TH = 1080, out: Geo[] = [];
  const r = (z: number) => RB + ((RT - RB) * (z - Z0)) / TH;
  const lean = (Math.atan2(RB - RT, TH) * 180) / Math.PI;
  out.push(cylinderAt({ radius: RB + 40, height: Z0, segments: 18, bottom: [0, 0, 0] }, "Heartland_MasonryDark"));
  out.push(wuv(cylinderAt({ rBot: RB + 6, rTop: r(Z0 + 160) + 6, height: 160, segments: 18, bottom: [0, 0, Z0] }, "Heartland_Masonry"), 1.2));
  out.push(wuv(cylinderAt({ rBot: r(Z0 + 160), rTop: RT, height: TH - 160, segments: 18, bottom: [0, 0, Z0 + 160] }, "Heartland_Render"), 1.4));
  for (const z of [Z0 + 160, Z0 + 700]) out.push(cylinderAt({ rBot: r(z) + 10, rTop: r(z + 18) + 10, height: 18, segments: 18, bottom: [0, 0, z] }, "Heartland_StonePale"));
  // the door over its steps, windows up the tower
  out.push(translate(doorX(110, 220, { arch: true, frame: "Heartland_StonePale" }), [-RB - 4, 0, Z0]));
  for (let i = 0; i < 3; i++) out.push(boxBounds([-RB - 40 - (2 - i) * 28, -90, 0], [-RB + 20, 90, Z0 * (i + 1) / 3 + 0.1], "Heartland_StonePale", 2));
  for (const [a, z] of [[0, 560], [140, 430], [220, 620], [90, 840], [270, 900], [180, 980]] as [number, number][])
    out.push(rotateZ(translate(rotateY(windowX(50, 70, { frame: "Heartland_Timber" }), lean), [-r(z) + 3, 0, z]), a));
  // the gallery: a deck of planks on struts, a railing round it
  const GZ = 300, GR = 470;
  out.push(translate(cylinderAt({ radius: GR, height: 12, segments: 24, bottom: [0, 0, 0] }, "Heartland_Plank"), [0, 0, GZ]));
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    out.push(beamBetween([c * (r(GZ - 140) - 4), s * (r(GZ - 140) - 4), GZ - 140], [c * (GR - 30), s * (GR - 30), GZ], 12, 12, "Heartland_Timber"));
    out.push(beamBetween([c * r(GZ), s * r(GZ), GZ + 4], [c * (GR - 4), s * (GR - 4), GZ + 4], 10, 14, "Heartland_Timber"));
    out.push(cylinderAt({ radius: 4, height: 100, segments: 5, bottom: [c * (GR - 8), s * (GR - 8), GZ + 12] }, "Heartland_Timber"));
  }
  out.push(translate(torus(GR - 8, 4, 28, 4, "Heartland_Timber"), [0, 0, GZ + 110]), translate(torus(GR - 8, 2.5, 28, 3, "Heartland_Timber"), [0, 0, GZ + 60]));
  // the cap: a curb, the boat-shaped cap of shingles, its ridge, the tail pole
  const ZC = Z0 + TH;
  out.push(cylinderAt({ radius: RT + 26, height: 30, segments: 18, bottom: [0, 0, ZC - 6] }, "Heartland_Timber"));
  out.push(halfBarrel(-RT - 70, RT + 90, RT + 22, 210, ZC + 24, "Heartland_Shingle"), boxBounds([-RT - 70, -RT - 22, ZC + 16], [RT + 90, RT + 22, ZC + 26], "Heartland_Boards"));
  out.push(cylinderBetween([-RT - 80, 0, ZC + 234], [RT + 100, 0, ZC + 234], 8, 6, "Heartland_Timber"));
  out.push(cylinderAt({ radius: 5, height: 60, segments: 6, bottom: [RT + 60, 0, ZC + 228] }, "Heartland_Timber"), sphereCenter(11, [RT + 60, 0, ZC + 294], "Heartland_Gilt", 8));
  out.push(beamBetween([RT + 40, 0, ZC + 60], [GR + 120, 0, GZ + 120], 16, 16, "Heartland_Timber"), beamBetween([RT + 20, 30, ZC + 80], [GR + 110, 6, GZ + 130], 9, 9, "Heartland_Timber"), beamBetween([RT + 20, -30, ZC + 80], [GR + 110, -6, GZ + 130], 9, 9, "Heartland_Timber"));
  // the windshaft out of the cap's front
  const HZ = ZC + 150, HX = -RT - 150;
  out.push(cylinderBetween([-RT + 30, 0, HZ - 10], [HX + 10, 0, HZ], 24, 10, "Heartland_Timber"));
  // round its door: sacks of flour, a spare millstone, a cart wheel
  for (const [x, y, rz] of [[-RB - 20, 150, 10], [-RB - 10, 210, -20], [-RB - 64, 175, 40]] as [number, number, number][])
    out.push(translate(rotateZ(lump([0, 0, 28], [30, 22, 30], 170 - x, "Heartland_Sack", 1, 0.12), rz), [x, y, 0]));
  out.push(translate(rotateZ(rotateY(cylinderAt({ radius: 70, height: 22, segments: 16, bottom: [0, 0, -11] }, "Heartland_StoneDark"), 72), 30), [-RB + 40, -RB + 30, 68]));
  out.push(translate(rotateZ(rotateY(merge(torus(55, 5, 16, 5, "Heartland_Timber"), ...Array.from({ length: 6 }, (_, k) => rotateZ(boxBounds([-2.5, -55, -2.5], [2.5, 55, 2.5], "Heartland_Timber"), k * 30))), 80), 120), [-RB + 10, RB - 70, 56]));
  return withSails(mossed(merge(...out), 31, 0.06), commonSails(760, 170, 140), [HX, 0, HZ]);
}

// กังหันลมไม้: a post mill: the whole white-boarded body (4 x 3.2 m) turns on one great post set in
// a trestle on brick piers, a ladder and the tail pole behind it, its four sails on the front.
function postMill(): THREE.Object3D {
  const out: Geo[] = [], T = "Heartland_Timber";
  // the trestle: crossed beams on four piers, quarter-bars up to the post
  for (const [x, y] of [[-230, 0], [230, 0], [0, -230], [0, 230]] as [number, number][]) out.push(boxAt([56, 56, 60], [x, y, 0], "Heartland_Brick", 2));
  out.push(boxBounds([-250, -18, 60], [250, 18, 94], T, 2), boxBounds([-18, -250, 94], [18, 250, 128], T, 2));
  for (const [x, y] of [[-220, 0], [220, 0], [0, -220], [0, 220]] as [number, number][]) out.push(beamBetween([x, y, x ? 94 : 128], [x * 0.12, y * 0.12, 330], 18, 18, T));
  out.push(boxBounds([-24, -24, 60], [24, 24, 380], T, 3));
  // the body: boarded, its crown tree across the post, a roof curved over it
  const BX = 200, BY = 160, B0 = 360, B1 = 860;
  out.push(boxBounds([-BX + 30, -BY + 10, B0 - 20], [BX - 30, BY - 10, B0], T, 2));
  out.push(wuv(boxBounds([-BX, -BY, B0], [BX, BY, B1], "Heartland_Boards"), 0.8));
  for (let z = B0 + 24; z < B1; z += 24) for (const s of [-1, 1]) out.push(boxBounds([-BX - 1, s * BY - 1, z - 2], [BX + 1, s * BY + 1, z], "Heartland_OldWood"));
  for (const [x, y] of [[-BX, -BY], [-BX, BY], [BX, -BY], [BX, BY]] as [number, number][]) out.push(boxBounds([x - 7, y - 7, B0], [x + 7, y + 7, B1], T, 1.5));
  out.push(halfBarrel(-BX - 30, BX + 30, BY + 14, 110, B1 - 4, "Heartland_Shingle"));
  // windows on the front and sides, the door at the back over the ladder
  out.push(translate(windowX(44, 50, {}), [-BX, 0, B0 + 230]));
  for (const s of [-1, 1]) out.push(translate(rotateZ(windowX(44, 50, {}), s * 90), [40, s * BY, B0 + 160]));
  out.push(translate(rotateZ(doorX(80, 180, { frame: T, wood: "Heartland_OldWood" }), 180), [BX, 0, B0 + 70]));
  // the ladder down to the ground behind, its rails meeting the tail pole and the wheel at its foot
  const L0: V3 = [BX + 380, 0, 0], L1: V3 = [BX + 10, 0, B0 + 70];
  for (const s of [-1, 1]) out.push(beamBetween([L0[0], s * 46, 0], [L1[0], s * 46, L1[2]], 10, 14, T));
  for (let i = 1; i < 14; i++) {
    const t = i / 14;
    out.push(cylinderBetween([L0[0] + (L1[0] - L0[0]) * t, -46, (L1[2] * t)], [L0[0] + (L1[0] - L0[0]) * t, 46, L1[2] * t], 3, 5, T));
  }
  out.push(beamBetween([BX - 10, 0, B0 + 20], [BX + 470, 0, 40], 18, 18, T));
  out.push(translate(rotateZ(rotateY(merge(torus(36, 4, 14, 4, T), ...Array.from({ length: 4 }, (_, k) => rotateZ(boxBounds([-2, -36, -2], [2, 36, 2], T), k * 45))), 90), 0), [BX + 470, 0, 38]));
  // the windshaft out of the front
  const HZ = B0 + 360, HX = -BX - 70;
  out.push(cylinderBetween([-BX + 30, 0, HZ - 14], [HX + 8, 0, HZ], 20, 10, T));
  return withSails(merge(...out), commonSails(540, 130, 100), [HX, 0, HZ]);
}

// ยุ้งฉางหิน: the village's stone granary (8 x 5.4 m): coursed stone, a great arched cart door on
// its front, slit vents, a tiled roof with a hoist door over the cart door and its beam, a sack
// hanging from the rope; a stone step up, sacks by the door.
function stoneGranary(): Geo {
  const X = 270, Y = 400, Z0 = 30, H = 450, out: Geo[] = [];
  out.push(boxBounds([-X - 12, -Y - 12, 0], [X + 12, Y + 12, Z0], "Heartland_MasonryDark", 3));
  out.push(wuv(boxBounds([-X, -Y, Z0], [X, Y, H], "Heartland_Masonry"), 1.3));
  for (const sx of [-1, 1])
    for (const sy of [-1, 1])
      for (let z = Z0, k = 0; z < H - 20; z += 40, k++) {
        const lx = k % 2 ? 28 : 50, ly = k % 2 ? 50 : 28;
        out.push(boxBounds([sx > 0 ? X - lx : -X - 3, sy > 0 ? Y - ly : -Y - 3, z], [sx > 0 ? X + 3 : -X + lx, sy > 0 ? Y + 3 : -Y + ly, z + 38], "Heartland_StonePale", 2.5));
      }
  // the cart door: an arch of stone voussoirs, plank leaves
  out.push(translate(doorX(240, 330, { arch: true, frame: "Heartland_StonePale", wood: "Heartland_Plank" }), [-X, 0, Z0]));
  out.push(boxBounds([-X - 60, -150, 0], [-X, 150, Z0], "Heartland_StonePale", 2));
  // slit vents down the front and the ends
  for (const y of [-280, -190, 190, 280]) out.push(boxBounds([-X - 2, y - 7, Z0 + 150], [-X + 4, y + 7, Z0 + 260], "Heartland_Dark"), boxBounds([-X - 6, y - 16, Z0 + 140], [-X + 2, y + 16, Z0 + 150], "Heartland_StonePale", 1));
  for (const s of [-1, 1]) for (const x of [-120, 0, 120]) out.push(boxBounds([x - 7, s * Y - 3, Z0 + 170], [x + 7, s * Y + 3, Z0 + 270], "Heartland_Dark"));
  // the roof and its gables, a hoist door in a little gable over the cart door, the beam
  out.push(roofY(2 * X, 2 * Y + 20, 14, H, 230, 40, "Heartland_RoofTileOld"), gablesY(2 * X, 2 * Y, H, 230, "Heartland_Masonry"));
  out.push(cylinderBetween([0, -Y - 50, H + 236], [0, Y + 50, H + 236], 10, 8, "Heartland_RoofTileOld"));
  out.push(boxBounds([-X - 10, -80, H - 70], [-X + 120, 80, H + 90], "Heartland_Masonry"), translate(gableRoof([150, 200, 8], [0, 0, 0], 70, 16, "Heartland_RoofTileOld"), [-X + 50, 0, H + 90]), gableWall(-X - 10, 80, H + 90, 70, "Heartland_Masonry"));
  out.push(translate(doorX(100, 120, { frame: "Heartland_StonePale", wood: "Heartland_Plank" }), [-X - 10, 0, H - 50]));
  out.push(beamBetween([-X + 40, 0, H + 100], [-X - 110, 0, H + 100], 16, 16, "Heartland_Timber"));
  out.push(translate(rotateX(torus(12, 3, 10, 4, "IronDark"), 90), [-X - 96, 0, H + 86]), cylinderBetween([-X - 96, 0, H + 80], [-X - 96, 0, 200], 1.5, 4, "RopeTan"));
  out.push(translate(lump([0, 0, 0], [26, 22, 34], 191, "Heartland_Sack", 1, 0.12), [-X - 96, 0, 170]));
  // sacks by the door
  for (const [x, y] of [[-X - 50, -190], [-X - 40, -240], [-X - 80, -215]] as [number, number][]) out.push(translate(lump([0, 0, 30], [28, 22, 30], 193 - y, "Heartland_Sack", 1, 0.12), [x, y, 0]));
  return mossed(merge(...out), 41, 0.12);
}

// บ่อน้ำหมู่บ้าน: the village well: a round curb of stone, a windlass between two posts under a
// little roof of shingles, a bucket on its rope and one on the curb, a stone trough beside it.
function villageWell(): Geo {
  const out: Geo[] = [];
  out.push(wuv(cylinderAt({ rBot: 96, rTop: 92, height: 82, segments: 16, bottom: [0, 0, 0] }, "Heartland_Masonry"), 1.1), translate(torus(90, 10, 18, 6, "Heartland_StonePale"), [0, 0, 84]));
  out.push(cylinderAt({ radius: 80, height: 2, segments: 16, bottom: [0, 0, 56] }, "Heartland_Water"));
  for (const s of [-1, 1]) out.push(boxAt([16, 16, 250], [0, s * 104, 0], "Heartland_Timber", 2), beamBetween([0, s * 104, 120], [0, s * 150, 0], 10, 10, "Heartland_Timber"));
  // the windlass, its crank, the rope and bucket
  out.push(cylinderBetween([0, -100, 168], [0, 100, 168], 12, 10, "Heartland_OldWood"), translate(rotateX(torus(12.5, 2, 10, 3, "RopeTan"), 90), [0, -20, 168]), translate(rotateX(torus(12.5, 2, 10, 3, "RopeTan"), 90), [0, -10, 168]));
  out.push(cylinderBetween([0, -100, 168], [0, -126, 168], 3, 5, "IronDark"), cylinderBetween([0, -126, 168], [0, -126, 140], 2.5, 5, "IronDark"), cylinderBetween([0, -126, 140], [0, -142, 140], 4, 6, "Heartland_Timber"));
  out.push(cylinderBetween([0, -15, 156], [0, -15, 110], 1.2, 4, "RopeTan"), cylinderAt({ rBot: 13, rTop: 16, height: 26, segments: 10, bottom: [0, -15, 84] }, "Heartland_OldWood"), translate(torus(15, 1.5, 10, 3, "IronDark"), [0, -15, 106]));
  out.push(cylinderAt({ rBot: 13, rTop: 16, height: 26, segments: 10, bottom: [-70, 50, 94] }, "Heartland_OldWood"));
  // the roof
  out.push(roofY(150, 270, 6, 250, 70, 16, "Heartland_Shingle"), gablesY(150, 220, 250, 70, "Heartland_Timber"), boxBounds([-8, -112, 240], [8, 112, 252], "Heartland_Timber"));
  // the trough
  out.push(boxBounds([-60, 140, 0], [60, 220, 50], "Heartland_StonePale", 3), boxBounds([-50, 150, 36], [50, 210, 47], "Heartland_Water"));
  return mossed(merge(...out), 51, 0.12);
}

// A hen: a round body, her tail up, a little head with its red comb; or a rooster, bigger and
// redder, his tail a sweep of dark green.
function hen(at: V3, yaw: number, kind: "red" | "white" | "rooster", seed: number): Geo {
  const coat = kind === "white" ? "Heartland_HenWhite" : kind === "rooster" ? "Heartland_Rooster" : "Heartland_Hen", k = kind === "rooster" ? 1.3 : 1;
  const g: Geo[] = [
    lump([0, 0, 22 * k], [17 * k, 12 * k, 13 * k], seed, coat, 1, 0.1, 20),
    lump([-14 * k, 0, 36 * k], [7 * k, 6 * k, 8 * k], seed + 1, coat, 0, 0.1, 20),
    cylinderBetween([-19 * k, 0, 36 * k], [-27 * k, 0, 34 * k], 2.4 * k, 4, "Heartland_Beak", 0.3),
    translate(scale(sphereCenter(1, [0, 0, 0], "Heartland_CombRed", 6), [5 * k, 1.5 * k, 4 * k]), [-14 * k, 0, 44 * k]),
    translate(scale(sphereCenter(1, [0, 0, 0], "Heartland_CombRed", 6), [1.8 * k, 1.5 * k, 3 * k]), [-19 * k, 0, 30 * k]),
  ];
  for (const s of [-1, 1]) g.push(cylinderBetween([2 * k, s * 5 * k, 12 * k], [3 * k, s * 6 * k, 0], 1.2 * k, 4, "Heartland_Beak"));
  if (kind === "rooster") {
    for (let i = 0; i < 5; i++) g.push(cylinderBetween([14 * k, (i - 2) * 2.5, 28 * k], [24 * k + i * 2, (i - 2) * 4, (50 - i * 6) * k], 3.2 - i * 0.3, 5, i % 2 ? "Heartland_TailGreen" : "Heartland_Rooster", 1));
    for (let i = 0; i < 3; i++) g.push(cylinderBetween([22 * k, (i - 1) * 3, 44 * k], [34 * k, (i - 1) * 5, 30 * k - i * 4], 2.4, 5, "Heartland_TailGreen", 0.8));
  } else g.push(translate(scale(sphereCenter(1, [0, 0, 0], coat, 6), [6, 7, 9]), [16, 0, 32]));
  return translate(rotateZ(merge(...g), yaw), at);
}
// เล้าไก่: the hen house: a boarded coop on legs under a sloping roof, the pop hole and its ramp, a
// nest box on its side; a run of wire in front of it; three hens, and the rooster crowing on top.
function chickenCoop(): Geo {
  const out: Geo[] = [], T = "Heartland_Timber";
  const X0 = 40, X1 = 220, Y = 110, Z0 = 50, ZF = 160, ZB = 200;
  for (const [x, y] of [[X0 + 8, -Y + 8], [X0 + 8, Y - 8], [X1 - 8, -Y + 8], [X1 - 8, Y - 8]] as [number, number][]) out.push(boxAt([12, 12, Z0], [x, y, 0], T, 1));
  out.push(wuv(boxBounds([X0, -Y, Z0], [X1, Y, ZF], "Heartland_Plank"), 0.8));
  out.push(quad([X0, -Y, ZF], [X1, -Y, ZF], [X1, -Y, ZB], [X0, -Y, ZF], "Heartland_Plank"), quad([X0, Y, ZF], [X1, Y, ZF], [X1, Y, ZB], [X0, Y, ZF], "Heartland_Plank"), boxBounds([X1 - 6, -Y, ZF], [X1, Y, ZB], "Heartland_Plank"));
  const pitch = (Math.atan2(ZB - ZF, X1 - X0) * 180) / Math.PI;
  out.push(translate(rotateY(boxBounds([-(X1 - X0) / 2 - 24, -Y - 18, 0], [(X1 - X0) / 2 + 16, Y + 18, 6], "Heartland_Shingle", 1.5), -pitch), [(X0 + X1) / 2, 0, (ZF + ZB) / 2 + 2]));
  for (const [x, y] of [[X0, -Y], [X0, Y], [X1, -Y], [X1, Y]] as [number, number][]) out.push(boxBounds([x - 5, y - 5, Z0], [x + 5, y + 5, x === X0 ? ZF : ZB], T, 1));
  // the pop hole and its ramp down to the run
  out.push(boxBounds([X0 - 2, -20, Z0 + 4], [X0 + 2, 20, Z0 + 44], "Heartland_Dark"), boxBounds([X0 - 4, -26, Z0 + 44], [X0 + 2, 26, Z0 + 50], T));
  const r0: V3 = [X0 - 4, 0, Z0 + 4], r1: V3 = [X0 - 120, 0, 0];
  out.push(beamBetween(r0, r1, 3, 40, "Heartland_Plank"));
  for (let i = 1; i < 7; i++) out.push(box([4, 40, 3], [r0[0] + (r1[0] - r0[0]) * (i / 7), 0, r0[2] + (r1[2] - r0[2]) * (i / 7) + 3], T));
  // the nest box on the +Y side, its lid
  out.push(boxBounds([X0 + 40, Y, Z0 + 10], [X1 - 40, Y + 46, Z0 + 70], "Heartland_Plank", 1.5), translate(rotateX(boxBounds([X0 + 34, -2, 0], [X1 - 34, 54, 5], "Heartland_Shingle", 1), -14), [0, Y - 4, Z0 + 80]));
  // the run: posts, a top rail, wire panels round three sides, a gate
  const RX0 = -230, RY = 140;
  for (const [x, y] of [[RX0, -RY], [RX0, 0], [RX0, RY], [-90, -RY], [-90, RY], [X0, -RY], [X0, RY]] as [number, number][]) out.push(boxAt([9, 9, 120], [x, y, 0], T, 1));
  out.push(boxBounds([RX0 - 4, -RY - 4, 116], [RX0 + 4, RY + 4, 122], T), boxBounds([RX0, -RY - 4, 116], [X0, -RY + 4, 122], T), boxBounds([RX0, RY - 4, 116], [X0, RY + 4, 122], T));
  out.push(quad([RX0, -RY, 0], [RX0, RY, 0], [RX0, RY, 116], [RX0, -RY, 116], "Heartland_Wire"));
  for (const s of [-1, 1]) out.push(quad([RX0, s * RY, 0], [X0, s * RY, 0], [X0, s * RY, 116], [RX0, s * RY, 116], "Heartland_Wire"));
  for (const y of [-RY, RY]) out.push(boxBounds([RX0 - 2, y - 2, 4], [X0, y + 2, 8], T));
  // a trough of grain, the water dish, the birds
  out.push(boxBounds([-150, -60, 0], [-130, 40, 14], "Heartland_Plank"), boxBounds([-148, -58, 10], [-132, 38, 13], "Heartland_Hay"), cylinderAt({ radius: 16, height: 6, segments: 10, bottom: [-60, 80, 0] }, "Heartland_StonePale"));
  out.push(hen([-170, 60, 0], 30, "red", 201), hen([-110, -90, 0], -60, "white", 203), hen([-40, 20, 0], 150, "red", 207), hen([(X0 + X1) / 2 + 10, 0, ZF + (ZB - ZF) * 0.4 + 4], 20, "rooster", 209));
  return centre(merge(...out));
}

// รั้วไม้สาน: a wattle hurdle 4 m long along Y: hazel rods woven in and out of stakes; pieces join
// end to end round pens and along field edges.
function wattleFence(): Geo {
  const rnd = seeded(221), out: Geo[] = [], N = 9, L = 400;
  const ys = Array.from({ length: N }, (_, i) => -L / 2 + (i * L) / (N - 1));
  for (const [i, y] of ys.entries()) {
    const h = 112 + rnd() * 16 + (i === 0 || i === N - 1 ? 8 : 0);
    out.push(cylinderBetween([(rnd() - 0.5) * 4, y, -6], [(rnd() - 0.5) * 6, y + (rnd() - 0.5) * 4, h], 3.6, 6, "Heartland_OldWood", 2.6));
  }
  for (let r = 0; r < 8; r++) {
    const z = 18 + r * 11.5;
    for (let i = 0; i + 1 < N; i++) {
      const sa = (i + r) % 2 ? 1 : -1;
      out.push(cylinderBetween([sa * 4.5, ys[i] - (i === 0 ? 4 : 0), z + (rnd() - 0.5) * 2], [-sa * 4.5, ys[i + 1] + (i + 1 === N - 1 ? 4 : 0), z + (rnd() - 0.5) * 2], 2.1, 5, r % 3 ? "Heartland_Plank" : "Heartland_OldWood"));
    }
  }
  // the top binding: a twist of rods along the stakes' heads
  for (let i = 0; i + 1 < N; i++) out.push(cylinderBetween([0, ys[i], 112], [0, ys[i + 1], 113], 2.6, 5, "Heartland_OldWood"));
  return merge(...out);
}

// ฟ่อนข้าวบนตอซัง: a field of wheat cut (8 x 6 m, like the standing wheat beside it): the
// stubble in rows, and stooks on it: sheaves stood up in eights and tens, leaning together to dry,
// each tied round its waist, the ears at the top.
function wheatStooks(): Geo {
  const rnd = seeded(231), out: Geo[] = [boxAt([800, 600, 6], [0, 0, -2], "Heartland_HayDark", 3)];
  for (let y = -270; y <= 270; y += 45) out.push(boxBounds([-392, y - 10, 3], [392, y + 10, 8], "Heartland_Hay", 2));
  const sheaf = (foot: V3, top: V3, seed: number): Geo => {
    const g: Geo[] = [cylinderBetween(foot, top, 13, 7, "Heartland_Hay", 8)];
    const mid: V3 = [foot[0] + (top[0] - foot[0]) * 0.4, foot[1] + (top[1] - foot[1]) * 0.4, foot[2] + (top[2] - foot[2]) * 0.4];
    g.push(cylinderBetween([mid[0], mid[1], mid[2] - 3], [mid[0], mid[1], mid[2] + 3], 11.5, 7, "Heartland_HayDark"));
    const dir: V3 = [top[0] - foot[0], top[1] - foot[1], top[2] - foot[2]], L = Math.hypot(...dir);
    g.push(lump([top[0] + (dir[0] / L) * 10, top[1] + (dir[1] / L) * 10, top[2] + 8], [15, 15, 20], seed, "Heartland_HayDark", 0, 0.25, 20));
    return merge(...g);
  };
  const stook = (c: V3, n: number, yaw: number, seed: number) => {
    const g: Geo[] = [];
    for (let i = 0; i < n; i++) {
      const row = i % 2 ? 1 : -1, along = (Math.floor(i / 2) - (n / 2 - 1) / 2) * 24;
      g.push(sheaf([row * 26, along, 0], [row * 7, along * 0.85, 108 + rnd() * 12], seed + i));
    }
    out.push(translate(rotateZ(merge(...g), yaw), c));
  };
  stook([-230, -150, 6], 10, 20, 233);
  stook([60, 140, 6], 8, -40, 241);
  stook([250, -130, 6], 10, 75, 251);
  stook([-120, 190, 6], 8, 110, 257);
  // loose straw lying about
  for (let i = 0; i < 12; i++) out.push(translate(rotateZ(scale(cylinderBetween([-30, 0, 2], [30, 0, 2], 3, 4, "Heartland_Hay"), [1, 1, 0.5]), rnd() * 360), [(rnd() - 0.5) * 700, (rnd() - 0.5) * 500, 6]));
  return merge(...out);
}

// =============================== the lavender hills ===============================

// โรงกลั่นน้ำหอม: the perfume distillery: a house of ochre render and stone quoins under old
// tiles (8 x 6 m), its brick chimney stack, blue-grey shutters; beside it an open shed on posts
// over the copper still: the onion-domed pot on its brick furnace (the fire glowing), the swan's
// neck to the condenser tub, a jar filling under the spout; barrels, bottles, crates of lavender.
function distillery(): Geo {
  const out: Geo[] = [];
  // the house: from y -500 to 100 (its own frame), the shed beside it to y 520
  const X = 300, Y0 = -500, Y1 = 100, Z0 = 34, H = 440;
  out.push(boxBounds([-X - 12, Y0 - 12, 0], [X + 12, Y1 + 12, Z0], "Heartland_MasonryDark", 3));
  out.push(wuv(boxBounds([-X, Y0, Z0], [X, Y1, H], "Heartland_RenderOchre"), 1.3));
  for (const sx of [-1, 1])
    for (const yc of [Y0, Y1])
      for (let z = Z0, k = 0; z < H - 20; z += 38, k++) {
        const lx = k % 2 ? 26 : 46, ly = k % 2 ? 46 : 26, sy = yc === Y1 ? 1 : -1;
        out.push(boxBounds([sx > 0 ? X - lx : -X - 3, sy > 0 ? yc - ly : yc - 3, z], [sx > 0 ? X + 3 : -X + lx, sy > 0 ? yc + 3 : yc + ly, z + 36], "Heartland_StonePale", 2));
      }
  out.push(translate(doorX(150, 250, { arch: true, frame: "Heartland_StonePale", wood: "Heartland_Shutter" }), [-X, -200, Z0]));
  for (const y of [-400, 0]) out.push(translate(windowX(76, 100, { shutters: "Heartland_Shutter", frame: "Heartland_StonePale" }), [-X, y, Z0 + 110]));
  out.push(translate(windowX(64, 70, { shutters: "Heartland_Shutter", frame: "Heartland_StonePale" }), [-X, -200, Z0 + 320]));
  out.push(translate(rotateZ(windowX(70, 90, { shutters: "Heartland_Shutter", frame: "Heartland_StonePale" }), 90), [0, Y0, Z0 + 120]));
  out.push(translate(rotateZ(windowX(70, 90, { frame: "Heartland_StonePale" }), 180), [X, -200, Z0 + 120]));
  out.push(translate(roofY(2 * X, Y1 - Y0 + 30, 14, H, 200, 40, "Heartland_RoofTileOld"), [0, (Y0 + Y1) / 2, 0]), translate(gablesY(2 * X, Y1 - Y0, H, 200, "Heartland_RenderOchre"), [0, (Y0 + Y1) / 2, 0]));
  out.push(cylinderBetween([0, Y0 - 40, H + 206], [0, Y1 + 40, H + 206], 10, 8, "Heartland_RoofTileOld"));
  // the sign over the door: a board with a sprig of lavender
  out.push(boxBounds([-X - 8, -290, Z0 + 270], [-X - 2, -110, Z0 + 310], "Heartland_Plank", 1), boxBounds([-X - 10, -260, Z0 + 286], [-X - 8, -140, Z0 + 294], "Heartland_LavStem"));
  for (let i = 0; i < 5; i++) out.push(boxBounds([-X - 11, -250 + i * 25, Z0 + 290], [-X - 9, -238 + i * 25, Z0 + 304], "Heartland_Lavender"));
  // the chimney stack at the shed's end of the house, tall over the still's furnace
  const CY = Y1 - 50;
  out.push(wuv(boxBounds([60, CY - 60, 0], [170, CY + 50, 980], "Heartland_Brick"), 1), boxBounds([52, CY - 68, 980], [178, CY + 58, 1000], "Heartland_StonePale", 2));
  // the shed: posts, a lean-to roof off the house wall
  const SY0 = Y1, SY1 = 520;
  for (const x of [-X + 10, 0, X - 10]) out.push(boxAt([18, 18, 300], [x, SY1 - 10, 0], "Heartland_Timber", 2));
  out.push(boxBounds([-X, SY1 - 20, 290], [X, SY1, 310], "Heartland_Timber", 2));
  const slope = (Math.atan2(380 - 310, SY1 - SY0) * 180) / Math.PI;
  out.push(translate(rotateX(boxBounds([-X - 30, -(SY1 - SY0) / 2 - 10, 0], [X + 30, (SY1 - SY0) / 2 + 40, 8], "Heartland_RoofTile", 1.5), -slope), [0, (SY0 + SY1) / 2, 345]));
  out.push(boxBounds([-X + 20, SY0, 0], [X - 20, SY1, 4], "Heartland_StonePale", 1));
  // the still: the furnace of brick, its fire, the pot and its onion dome
  const P: V3 = [80, 300, 0];
  out.push(wuv(boxBounds([P[0] - 80, P[1] - 80, 0], [P[0] + 80, P[1] + 80, 110], "Heartland_Brick"), 1), boxBounds([P[0] - 82, P[1] - 82, 108], [P[0] + 82, P[1] + 82, 118], "Heartland_StonePale", 2));
  out.push(boxBounds([P[0] - 84, P[1] - 26, 10], [P[0] - 78, P[1] + 26, 60], "Heartland_Fire"));
  out.push(cylinderAt({ rBot: 62, rTop: 70, height: 70, segments: 14, bottom: [P[0], P[1], 118] }, "Heartland_Copper"));
  out.push(translate(scale(sphereCenter(1, [0, 0, 0], "Heartland_Copper", 14), [72, 72, 60]), [P[0], P[1], 188]), cylinderAt({ rBot: 26, rTop: 8, height: 60, segments: 12, bottom: [P[0], P[1], 236] }, "Heartland_Copper"));
  out.push(translate(torus(70, 4, 16, 4, "Heartland_CopperDark"), [P[0], P[1], 188]), translate(torus(64, 3, 16, 4, "Heartland_CopperDark"), [P[0], P[1], 130]));
  // the swan's neck over to the condenser tub, the coil's spout and the jar under it
  const C: V3 = [-150, 330, 0];
  const neck: V3[] = [[P[0], P[1], 294], [P[0] - 40, P[1] + 6, 300], [P[0] - 110, P[1] + 14, 284], [C[0] + 40, C[1], 230], [C[0] + 10, C[1], 196]];
  for (let i = 0; i + 1 < neck.length; i++) out.push(cylinderBetween(neck[i], neck[i + 1], 8 - i * 1.2, 8, "Heartland_Copper", 8 - (i + 1) * 1.2));
  out.push(cylinderAt({ rBot: 54, rTop: 58, height: 180, segments: 14, bottom: C }, "Heartland_OldWood"));
  for (const z of [20, 90, 160]) out.push(translate(torus(57, 3, 14, 4, "IronDark"), [C[0], C[1], z]));
  out.push(cylinderAt({ radius: 50, height: 2, segments: 14, bottom: [C[0], C[1], 176] }, "Heartland_Water"));
  out.push(cylinderBetween([C[0] - 50, C[1] - 20, 40], [C[0] - 76, C[1] - 20, 34], 3, 6, "Heartland_Copper"));
  out.push(cylinderAt({ rBot: 14, rTop: 9, height: 30, segments: 10, bottom: [C[0] - 80, C[1] - 20, 0] }, "Heartland_Bottle"));
  // the firewood, barrels, crates of cut lavender, bottles on a shelf
  for (let i = 0; i < 4; i++) for (let j = 0; j < 5 - i; j++) out.push(cylinderBetween([P[0] + 110, P[1] - 80 + j * 30 + i * 15, 12 + i * 20], [P[0] + 200, P[1] - 80 + j * 30 + i * 15, 12 + i * 20], 10, 6, "Heartland_OldWood"));
  for (const [x, y] of [[-240, 180], [-240, 250], [-180, 455]] as [number, number][]) {
    out.push(cylinderAt({ rBot: 30, rTop: 33, height: 84, segments: 10, bottom: [x, y, 0] }, "Heartland_Plank"));
    for (const z of [12, 70]) out.push(translate(torus(33, 2, 10, 3, "IronDark"), [x, y, z]));
  }
  for (const [x, y, z] of [[-60, 470, 0], [20, 470, 0], [-20, 470, 44]] as V3[]) {
    out.push(boxBounds([x - 36, y - 26, z], [x + 36, y + 26, z + 40], "Heartland_Plank", 1.5));
    for (let k = 0; k < 5; k++) out.push(cylinderBetween([x - 30, y - 18 + k * 9, z + 38], [x + 34, y - 18 + k * 9, z + 44], 4.5, 5, k % 2 ? "Heartland_Lavender" : "Heartland_LavenderDark"));
  }
  out.push(boxBounds([X - 40, Y1 + 10, 120], [X - 10, Y1 + 200, 126], "Heartland_Plank"));
  for (let i = 0; i < 7; i++) out.push(cylinderAt({ radius: 5, height: 18, segments: 6, bottom: [X - 25, Y1 + 24 + i * 25, 126] }, "Heartland_Bottle"));
  return centre(mossed(merge(...out), 61, 0.08));
}

// เกวียนขนดอกไม้: the cart that brings the flowers in: two big wheels, a bed of planks heaped with
// bundles of lavender and a basket of sunflower heads, its shafts propped on a stick.
function flowerCart(): Geo {
  const out: Geo[] = [], rnd = seeded(251), T = "Heartland_Plank";
  out.push(boxBounds([-120, -75, 64], [120, 75, 74], T, 1.5));
  for (const s of [-1, 1]) out.push(boxBounds([-120, s * 75 - 3, 74], [120, s * 75 + 3, 110], T, 1), boxBounds([-120, s * 75 - 4, 106], [120, s * 75 + 4, 112], "Heartland_Timber", 1));
  out.push(boxBounds([114, -75, 74], [120, 75, 110], T, 1));
  for (const x of [-110, -40, 40, 110]) for (const s of [-1, 1]) out.push(boxBounds([x - 4, s * 75 - 5, 64], [x + 4, s * 75 + 5, 114], "Heartland_Timber"));
  // wheels: rim, spokes, hub, on their axle
  out.push(cylinderBetween([10, -96, 60], [10, 96, 60], 5, 6, "IronDark"));
  for (const s of [-1, 1]) {
    const w: Geo[] = [torus(58, 5, 18, 5, "Heartland_Timber"), translate(torus(58, 2, 18, 3, "IronDark"), [0, 0, 0])];
    for (let k = 0; k < 6; k++) w.push(rotateZ(boxBounds([-2.5, -56, -2.5], [2.5, 56, 2.5], "Heartland_Timber"), k * 30));
    w.push(cylinderAt({ radius: 10, height: 16, segments: 8, bottom: [0, 0, -8] }, "Heartland_Timber"));
    out.push(translate(rotateX(merge(...w), 90), [10, s * 88, 60]));
  }
  // the shafts out to the front, resting on a prop
  for (const s of [-1, 1]) out.push(beamBetween([-110, s * 55, 68], [-310, s * 48, 40], 9, 9, "Heartland_Timber"));
  out.push(cylinderBetween([-290, 0, 0], [-292, 0, 44], 4, 5, "Heartland_OldWood"), beamBetween([-292, -50, 44], [-292, 50, 44], 6, 6, "Heartland_OldWood"));
  // the load: bundles of lavender laid crosswise, heads all one way, tied with twine
  for (let layer = 0; layer < 3; layer++)
    for (let i = 0; i < 9 - layer * 2; i++) {
      const x = -96 + (i + layer) * 22 + (rnd() - 0.5) * 6, z = 84 + layer * 15, flip = (i + layer) % 2 ? 1 : -1;
      out.push(cylinderBetween([x, -flip * 64, z], [x, flip * 10, z + 2], 7, 6, "Heartland_LavStem", 8));
      out.push(cylinderBetween([x, flip * 10, z + 2], [x + (rnd() - 0.5) * 6, flip * 64, z + 4], 10, 6, layer % 2 ? "Heartland_LavenderDark" : "Heartland_Lavender", 6));
      out.push(translate(rotateX(torus(7.5, 1.2, 6, 3, "RopeTan"), 90), [x, -flip * 20, z]));
    }
  // a basket of sunflower heads at the back
  out.push(cylinderAt({ rBot: 26, rTop: 32, height: 34, segments: 10, bottom: [80, 30, 74] }, "Heartland_Skep"));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    out.push(translate(rotateY(merge(cylinderAt({ radius: 12, height: 3, segments: 10, bottom: [0, 0, 0] }, "Heartland_SunDisc"), cylinderAt({ rBot: 19, rTop: 13, height: 1.5, segments: 12, bottom: [0, 0, -0.5] }, "Heartland_SunPetal")), -20 + i * 10), [80 + Math.cos(a) * 14, 30 + Math.sin(a) * 14, 108 + i * 2]));
  }
  return centre(merge(...out));
}

// ราวตากดอกลาเวนเดอร์: a drying rack: a frame of poles under a little roof of shingles, bundles of
// lavender hung head down in rows from its rails; a basket of cut stems beneath.
function dryingRack(): Geo {
  const out: Geo[] = [], rnd = seeded(261), T = "Heartland_Timber";
  const X = 70, Y = 170, H = 230;
  for (const [x, y] of [[-X, -Y], [-X, Y], [X, -Y], [X, Y]] as [number, number][]) out.push(cylinderBetween([x, y, -6], [x * 0.96, y, H], 6, 6, T, 5));
  for (const x of [-X, X]) out.push(beamBetween([x, -Y - 20, H - 6], [x, Y + 20, H - 6], 10, 12, T));
  for (const y of [-Y, 0, Y]) out.push(beamBetween([-X - 10, y, H + 4], [X + 10, y, H + 4], 8, 8, T));
  out.push(roofY(2 * X + 20, 2 * Y + 60, 6, H + 10, 46, 12, "Heartland_Shingle"));
  // the rails the bundles hang from, the bundles in rows on them
  for (const [k, z] of [[0, H - 40], [1, H - 100]] as [number, number][]) {
    for (const x of [-X + 6, X - 6]) out.push(cylinderBetween([x, -Y, z], [x, Y, z], 3, 5, "Heartland_OldWood"));
    for (const x of [-X + 6, X - 6])
      for (let y = -Y + 24 + k * 12; y < Y - 10; y += 26) {
        const len = 34 + rnd() * 10;
        out.push(cylinderBetween([x, y, z], [x, y, z - 4], 2, 4, "RopeTan"));
        out.push(cylinderBetween([x, y, z - 4], [x, y, z - 4 - len * 0.45], 3.5, 5, "Heartland_LavStem", 5));
        out.push(cylinderBetween([x, y, z - 4 - len * 0.45], [x + (rnd() - 0.5) * 3, y, z - 4 - len], 7, 6, rnd() < 0.5 ? "Heartland_Lavender" : "Heartland_LavenderDark", 4));
      }
  }
  out.push(cylinderAt({ rBot: 26, rTop: 32, height: 36, segments: 10, bottom: [0, -40, 0] }, "Heartland_Skep"));
  for (let i = 0; i < 7; i++) out.push(cylinderBetween([(rnd() - 0.5) * 30, -40 + (rnd() - 0.5) * 30, 20], [(rnd() - 0.5) * 50, -40 + (rnd() - 0.5) * 50, 58], 3, 4, "Heartland_LavenderDark", 5));
  return merge(...out);
}

// ---- the sample: where the flower fields run up to the windmill country and the lavender ----
function sample(put: Put): void {
  const rnd = seeded(301);
  // the beds of the royal flower fields across the south-west
  for (let i = 0; i < 4; i++) put("sunflower_row", [-1900 + i * 140, 900, 0], 0);
  put("poppy_bed", [-1250, 900, 0], 0);
  put("white_bed", [-900, 900, 0], 0);
  put("poppy_bed", [-550, 900, 0], 0);
  // the apiary: hives in a row before the bee house, the beekeeper's cottage and stall
  put("bee_house", [700, 1650, 0], 90);
  for (let i = 0; i < 5; i++) put("beehive", [100 + i * 160, 1150, 0], -90 + (rnd() - 0.5) * 10);
  put("beekeeper_cottage", [1700, 1600, 0], 180);
  put("honey_stall", [1300, 700, 0], 120);
  put("bee_stump", [-300, 1800, 0], 40);
  // the chapel among the fields, roses round it
  put("field_chapel", [-1300, -300, 0], 0);
  put("flower_bush", [-1950, 300, 0], 0);
  put("flower_bush", [-600, -900, 0], 60);
  // the windmills behind, the granary, the well, the hens, the stooks
  put("great_windmill", [1300, -1300, 0], 0, 0.85);
  put("post_mill", [-200, -1600, 0], 30, 0.9);
  put("stone_granary", [400, -500, 0], 90);
  put("village_well", [500, 450, 0], 0);
  put("chicken_coop", [-200, 300, 0], -30);
  for (let i = 0; i < 4; i++) put("wattle_fence", [-650, -500 + i * 400, 0], 0);
  put("wheat_stooks", [1700, -100, 0], 0);
  // the lavender and its distillery on the east side
  for (let i = 0; i < 5; i++) put("lavender_row", [2000, -1300 + i * 130, 0], 90, 0.75);
  put("distillery", [2000, 900, 0], 180, 0.8);
  put("drying_rack", [1400, 150, 0], 90);
  put("flower_cart", [900, -100, 0], -60);
  // the field's edges: a boulder, stones heaped, wild flowers
  put("meadow_boulder", [-1800, -1700, 0], 30);
  put("field_stones", [-1700, 1900, 0], 0);
  for (let i = 0; i < 6; i++) put("poppy_patch", [-2000 + rnd() * 3200, -2000 + rnd() * 600, 0], rnd() * 360, 0.8 + rnd() * 0.4);
  for (let i = 0; i < 5; i++) put("lavender_clump", [1500 + rnd() * 700, -2100 + rnd() * 600, 0], rnd() * 360);
  put("flora:BigOak", [-2000, -900, 0], 20, 0.9);
  put("flora:RoundTree", [2100, 1900, 0], 60, 0.8);
  put("westfarm:cypress", [1100, 1900, 0], 0);
}

const items: KitItem[] = [
  { id: "meadow_boulder", name: "หินใหญ่กลางทุ่ง", make: meadowBoulder, tags: ["rock", "decor"] },
  { id: "field_stones", name: "กองหินเก็บจากไร่", make: fieldStones, tags: ["rock", "decor"] },
  { id: "bee_stump", name: "ตอไม้รังผึ้งป่า", make: beeStump, tags: ["decor", "plant"] },
  { id: "flower_bush", name: "พุ่มกุหลาบป่า", make: flowerBush, tags: ["plant"] },
  { id: "poppy_patch", name: "ดงป๊อปปี้ป่า", make: poppyPatch, tags: ["ground", "plant"] },
  { id: "lavender_clump", name: "กอลาเวนเดอร์ป่า", make: lavenderClump, tags: ["ground", "plant"] },
  { id: "sunflower_row", name: "แถวทานตะวัน (8 ม.)", make: sunflowerRow, tags: ["crop", "plant"] },
  { id: "poppy_bed", name: "แปลงป๊อปปี้ (8 ม.)", make: poppyBed, tags: ["crop", "plant"] },
  { id: "white_bed", name: "แปลงดอกไม้ขาว (8 ม.)", make: whiteBed, tags: ["crop", "plant"] },
  { id: "lavender_row", name: "แถวลาเวนเดอร์ (8 ม.)", make: lavenderRow, tags: ["crop", "plant"] },
  { id: "beehive", name: "รังผึ้งไม้", make: beehive, tags: ["decor"] },
  { id: "bee_house", name: "โรงรังผึ้งหลวง", make: beeHouse, tags: ["building", "landmark"] },
  { id: "beekeeper_cottage", name: "บ้านคนเลี้ยงผึ้ง", make: beekeeperCottage, tags: ["building"] },
  { id: "field_chapel", name: "โบสถ์น้อยกลางทุ่ง", make: fieldChapel, tags: ["building", "landmark"] },
  { id: "honey_stall", name: "แผงน้ำผึ้ง", make: honeyStall, tags: ["market"] },
  { id: "great_windmill", name: "กังหันลมใหญ่", make: greatWindmill, tags: ["landmark", "building"] },
  { id: "post_mill", name: "กังหันลมไม้", make: postMill, tags: ["building"] },
  { id: "stone_granary", name: "ยุ้งฉางหิน", make: stoneGranary, tags: ["building"] },
  { id: "village_well", name: "บ่อน้ำหมู่บ้าน", make: villageWell, tags: ["decor"] },
  { id: "chicken_coop", name: "เล้าไก่", make: chickenCoop, tags: ["building", "animal"] },
  { id: "wattle_fence", name: "รั้วไม้สาน (4 ม.)", make: wattleFence, tags: ["fence"] },
  { id: "wheat_stooks", name: "ฟ่อนข้าวบนตอซัง (8x6 ม.)", make: wheatStooks, tags: ["crop", "ground"] },
  { id: "distillery", name: "โรงกลั่นน้ำหอม", make: distillery, tags: ["building", "landmark"] },
  { id: "flower_cart", name: "เกวียนขนดอกไม้", make: flowerCart, tags: ["decor", "market"] },
  { id: "drying_rack", name: "ราวตากดอกลาเวนเดอร์", make: dryingRack, tags: ["decor"] },
];

export const KIT: Kit = {
  id: "heartland",
  name: "ทุ่งดอกไม้และไร่กังหันลม",
  region: "รอบอีเดนไปทางตะวันตก",
  desc: "แถวทานตะวัน ป๊อปปี้และดอกไม้ขาวของทุ่งดอกไม้หลวง สวนผึ้งหลวงกับโรงรังผึ้ง โบสถ์น้อยกลางทุ่ง กังหันลมใหญ่ที่ใบพัดหมุนอยู่ ยุ้งฉางหิน บ่อน้ำหมู่บ้าน แถวลาเวนเดอร์กับโรงกลั่นน้ำหอม",
  ground: "grass",
  items,
  sample,
};
