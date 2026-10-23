// ป่าโบราณและภูผาตะวันตก (westmount): the mountains between Noa and Suzhou, for three fields.
// The ancient forest west of Noa (ป่าโบราณ): colossal elder trees on plank buttresses with
// roots snaking out over the moss, their canopies far overhead hung with lichen; fallen giants
// with their root plates torn out of the ground, glowing mushrooms, mounds of thick moss, a
// mossy stone shrine of the Noa era, standing stones gripped by roots, a log bridge over the
// stream and banks of mist for the hollows. The western pass (ช่องเขาตะวันตก): the old frontier
// gatehouse across the road, one tower still standing and one fallen in, its broken curtain
// walls; a rope bridge hung with prayer flags over a gorge whose rock walls drop out of sight;
// wind-bent pines, rockfalls, prayer cairns. The karst country (ภูผาหินปูน): fluted limestone
// spires with green on every ledge, a red pavilion with a sweeping green roof for a cliff top
// and the stone stairs up to it, a stone slab bridge, bamboo rafts and lotus for the river.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front facing -X.
// The leaves are cards that sway in the shared wind (src/world3d/trees.ts). The mist is
// see-through and casts no shadow. The gorge wall stands 7.7 m tall from z = 0 like any item;
// a field sets it down into the gorge (z -764) so its lip meets the ground.

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, sphereCenter, rock, toThree, noise3,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial, material } from "../textures";
import type { Recipe } from "../textures";
import { limb, grow, along, foliage, crownLobes, LeafCards, CANOPY, frond, lump } from "../trees";
import type { CanopyLook, FoliageSpec, Lobe } from "../trees";
import { fallenTrunk, coverTop, endGrain, endOf } from "../nature";
import type { Kit, Put } from "./types";
import type { SolidSpec } from "../../world";

// ---------- materials ----------
const MATS: Record<string, Recipe> = {
  // the forest
  Westmount_Bark: { map: "bark", tint: "#7b6b56", bump: 3.5 },        // elder bark, grey-brown, deep furrows
  Westmount_BarkOld: { map: "bark", tint: "#8a8270", bump: 3.5 },     // the hollow giant, paler with age
  Westmount_Moss: { map: "felt", tint: "#5f8f34", rough: 1, bump: 1.5 },
  Westmount_MossBark: { map: "felt", tint: "#46672c", rough: 1, bump: 1.5 },
  Westmount_MossThick: { map: "foliage", tint: "#6b9a3a", rough: 1, bump: 2 },
  Westmount_MossDeep: { map: "foliage", tint: "#4a7a30", rough: 1, bump: 2 },
  Westmount_Lichen: { map: "felt", tint: "#a9b48c", rough: 1 },       // beard lichen hanging from the limbs
  Westmount_Hollow: { tint: "#14110c", rough: 1 },
  Westmount_Soil: { map: "felt", tint: "#5b4430", rough: 1, bump: 1.5 },
  Westmount_CanopyCore: { map: "foliage", tint: "#3f7434", rough: 0.95, bump: 1.5 },
  Westmount_GlowCap: { tint: "#86f4e2", rough: 0.4, glow: "#22d8c0", glowI: 1.5 },
  Westmount_GlowCapBlue: { tint: "#a8bfff", rough: 0.4, glow: "#5578ff", glowI: 1.4 },
  Westmount_GlowGill: { tint: "#d8fff4", rough: 0.6, glow: "#7cf0d8", glowI: 0.9 },
  Westmount_GlowStem: { map: "felt", tint: "#dfe9d6", rough: 0.8, glow: "#86d8c4", glowI: 0.3 },
  Westmount_Spore: { tint: "#c8fff0", rough: 1, glow: "#7dffe0", glowI: 2 },
  Westmount_ShrineStone: { map: "stone", tint: "#9ea791", bump: 2.2 }, // the grey-green stone of old Noa
  Westmount_ShrineDark: { map: "stone", tint: "#7c846f", bump: 2.2 },
  Westmount_ShrineCarved: { map: "marble", tint: "#b9bba4", rough: 0.7 },
  Westmount_MossTile: { map: "tiles", tint: "#7d8b63", bump: 2.5 },
  Westmount_Rune: { tint: "#c4f7da", rough: 0.5, glow: "#4fe09a", glowI: 1.1 },
  Westmount_Menhir: { map: "crag", tint: "#8f9283", bump: 3.5 },
  Westmount_Vine: { map: "bark", tint: "#56602f", bump: 1.5 },
  Westmount_Log: { map: "bark", tint: "#6c5741", bump: 3 },
  Westmount_Hewn: { map: "wood", tint: "#9d7b54", bump: 1.2 },
  // the pass
  Westmount_Granite: { map: "crag", tint: "#a19d93", bump: 4 },
  Westmount_GraniteDark: { map: "crag", tint: "#77736c", bump: 4 },
  Westmount_LichenPale: { map: "felt", tint: "#a9a98a", rough: 1 },
  Westmount_FortMoss: { map: "felt", tint: "#7d8660", rough: 1, bump: 1 },
  Westmount_FortStone: { map: "stone", tint: "#aaa392", bump: 2 },
  Westmount_FortDark: { map: "stone", tint: "#86806f", bump: 2 },
  Westmount_GateWood: { map: "wood", tint: "#5d4733", bump: 1.4 },
  Westmount_Banner: { map: "fabric", tint: "#7e2c26", rough: 1 },
  Westmount_Dark: { tint: "#1c1a18", rough: 1 },
  Westmount_Chasm: { map: "crag", tint: "#85817a", bump: 4 },
  Westmount_ChasmDeep: { map: "crag", tint: "#56534f", bump: 4 },
  Westmount_PineBark: { map: "bark", tint: "#6e4c35", bump: 3 },
  Westmount_PineCore: { map: "foliage", tint: "#2d5236", rough: 1, bump: 1.5 },
  Westmount_Plank: { map: "wood", tint: "#8a7258", bump: 1.2 },
  // the karst
  Westmount_Limestone: { map: "crag", tint: "#c6c2b2", bump: 4 },
  Westmount_LimeStain: { map: "crag", tint: "#8f8c80", bump: 4 },
  Westmount_StairStone: { map: "stone", tint: "#bdb8a6", bump: 2 },
  Westmount_StairDark: { map: "stone", tint: "#958f7e", bump: 2 },
  Westmount_GreenTile: { map: "tiles", tint: "#3f7d5c", bump: 2.5, rough: 0.5 },
  Westmount_RidgeTile: { map: "tiles", tint: "#2f5c46", bump: 2, rough: 0.5 },
  Westmount_Lacquer: { map: "plaster", tint: "#b23328", rough: 0.45 },
  Westmount_Teal: { map: "plaster", tint: "#2f7f86", rough: 0.5 },   // painted brackets and fretwork
  Westmount_LanternRed: { tint: "#e0402c", rough: 0.6, glow: "#ff5a2a", glowI: 0.9 },
  Westmount_LotusPad: { map: "felt", tint: "#4f9440", rough: 0.55 },
  Westmount_LotusPadPale: { map: "felt", tint: "#7fb35a", rough: 0.55 },
  Westmount_Petal: { map: "felt", tint: "#f5b3c8", rough: 0.6 },
  Westmount_PetalDeep: { map: "felt", tint: "#e0789c", rough: 0.6 },
  Westmount_Seedpod: { map: "felt", tint: "#d9c860", rough: 0.7 },
  Westmount_RaftCloth: { map: "fabric", tint: "#cdbb8c", rough: 1 },
  // the fields' water and cliffs
  Westmount_Stream: { tint: "#4b9488", rough: 0.06, opacity: 0.78 },
  Westmount_River: { tint: "#4f8f6c", rough: 0.07, opacity: 0.9 },
  Westmount_Torrent: { tint: "#3b5f66", rough: 0.12, opacity: 0.96, glow: "#20343a", glowI: 0.3 },
  Westmount_CliffMoss: { map: "crag", tint: "#8a947a", bump: 4 },
  Westmount_CliffGranite: { map: "crag", tint: "#948f86", bump: 4 },
  Westmount_CliffLime: { map: "crag", tint: "#c9c5b6", bump: 4 },
};
for (const [name, recipe] of Object.entries(MATS)) defineMaterial(name, recipe);
const WOOD_END = endGrain("#b89068");

// ---------- helpers ----------
const D = Math.PI / 180;
type XZ = [number, number];

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const polar = (a: number, r: number, z: number): V3 => [Math.cos(a) * r, Math.sin(a) * r, z];
const lin = (r: number, g: number, b: number, k = 1.6) => new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace).multiplyScalar(k);

// texture coordinates of an extruded or lathed shape (made in cm) into metres
function metres(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 100, uv.getY(i) / 100);
  return geo;
}
function ellipsoid(r: V3, c: V3, mat: string, seg = 10): Geo {
  return translate(scale(sphereCenter(1, [0, 0, 0], mat, seg), r), c);
}
// A profile in the (x, z) plane, `thick` across along Y (centred).
function slab(pts: XZ[], thick: number, mat: string, bevel = 0): Geo {
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 6 });
  geo.applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, -1, thick / 2, 0, 1, 0, 0, 0, 0, 0, 1));
  return [{ geo: metres(geo), mat }];
}
// A shape in the (y, z) plane (a wall seen from the front), from x0 back to x1.
function prism(shape: THREE.Shape, x0: number, x1: number, mat: string): Geo {
  const geo = new THREE.ExtrudeGeometry(shape, { depth: x1 - x0, bevelEnabled: false, curveSegments: 10 });
  geo.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, x0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  return [{ geo: metres(geo), mat }];
}
const shapeOf = (pts: XZ[]): THREE.Shape => new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v)));
// A solid of revolution about Z through a profile of (radius, z), at `at`.
function lathe(prof: XZ[], seg: number, mat: string, at: V3 = [0, 0, 0]): Geo {
  const geo = new THREE.LatheGeometry(prof.map(([r, z]) => new THREE.Vector2(Math.max(0.01, r), z)), seg).rotateX(Math.PI / 2);
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2, uv.getY(i));
  geo.translate(...at);
  return [{ geo, mat }];
}
// every corner pushed in or out along its own direction from the axis by smooth noise (weathered stone)
function weather(g: Geo, amp: number, grain: number, seed: number): Geo {
  return g.map(({ geo, mat }) => {
    const out = geo.clone(), p = out.getAttribute("position");
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), r = Math.hypot(x, y) || 1;
      const n = (noise3(x / grain, y / grain, z / grain, seed) - 0.5) * 2 * amp;
      p.setXYZ(i, x + (x / r) * n, y + (y / r) * n, z);
    }
    out.computeVertexNormals();
    return { geo: out, mat };
  });
}
// meshes of a Geo plus the leaf or frond meshes
function group(geo: Geo, ...extra: (THREE.Object3D | null)[]): THREE.Group {
  const g = toThree(geo, material);
  for (const e of extra) if (e) g.add(e);
  return g;
}
// leafy crowns: each a big lobe and smaller ones round its skin, leafy cores inside, the cards
// one swaying mesh
function canopy(crowns: Lobe[], leaf: number, seed: number, look: CanopyLook, o: Partial<FoliageSpec> = {}, n = 4): { core: Geo; mesh: THREE.Mesh | null } {
  const cards = new LeafCards();
  const { lobes, details } = crownLobes(crowns, seeded(seed), n);
  const core = foliage({ seed, lobes, details, leaf, look, ...o }, cards);
  return { core, mesh: cards.count ? cards.mesh(look.card) : null };
}
// fern clumps: fronds arching out of a point
function ferns(list: { at: V3; n: number; len: number; seed: number }[]): THREE.Mesh | null {
  const cards = new LeafCards();
  for (const f of list) {
    const rnd = seeded(f.seed);
    for (let k = 0; k < f.n; k++) {
      const shade = 0.8 + rnd() * 0.3;
      frond(cards, {
        at: f.at, yaw: (k / f.n) * Math.PI * 2 + rnd() * 0.5, lift: 0.7 + rnd() * 0.4, droop: 1.3 + rnd() * 0.5,
        len: f.len * (0.75 + rnd() * 0.4), w: f.len * 0.2, fold: 0.42, segs: 5,
        base: lin(34 * shade, 84 * shade, 36 * shade), tip: lin(116 * shade, 172 * shade, 72 * shade), twist: (rnd() - 0.5) * 0.4,
      });
    }
  }
  return cards.count ? cards.mesh("frond") : null;
}
// a rope sagging from a to b, as n straight pieces
function sagLine(a: V3, b: V3, sag: number, n: number): V3[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - sag * 4 * t * (1 - t)] as V3;
  });
}
function rope(pts: V3[], r: number, mat = "RopeTan"): Geo {
  return merge(...pts.slice(1).map((p, i) => cylinderBetween(pts[i], p, r, 4, mat)));
}
// prayer flags hanging under a rope every `gap` cm, in the five colours
const FLAG_COLOURS = ["FabricBlue", "FabricWhite", "FabricRed", "FabricGreen", "FabricGold"];
function flags(pts: V3[], gap: number, size: number, seed: number): Geo {
  const out: Geo[] = [], rnd = seeded(seed);
  let k = Math.floor(rnd() * 5), carry = gap / 2;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const head = Math.atan2(b[1] - a[1], b[0] - a[0]) / D;
    for (let s = carry; s < L; s += gap) {
      const p = lerp3(a, b, s / L);
      const f = rotateZ(boxAt([1.2, size * 0.8, size], [0, 0, -size - 1], FLAG_COLOURS[k++ % 5]), head - 90 + (rnd() - 0.5) * 20);
      out.push(translate(rotateX(f, (rnd() - 0.5) * 16), p));
      carry = s + gap - L;
    }
  }
  return merge(...out);
}

// ---------- the canopies' colours ----------
const ELDER: CanopyLook = { card: "canopy", dark: [30, 66, 36], mid: [58, 106, 50], light: [118, 160, 72], core: "Westmount_CanopyCore" };
const PINE: CanopyLook = { card: "fine", dark: [26, 56, 38], mid: [44, 88, 52], light: [92, 136, 76], core: "Westmount_PineCore" };
const KARST_GREEN: CanopyLook = CANOPY.vine;

// =================================== the forest ===================================

// A colossal elder tree: a trunk two to five metres through on plank buttresses that run out
// into roots snaking over the ground, massive limbs from the fork, each with a side branch, a
// cumulus of crowns far overhead (bigger every way than flora's BigOak), beard lichen hanging
// from the limbs, moss on every upper face, glowing brackets on the bark. The old one is shorter
// and wider, with a dark hollow at its foot (on its front), dead limbs and more moss.
interface ElderSpec { seed: number; r: number; fork: number; lean: [number, number]; limbs: number; reach: number; crown: number; leaf: number; hollow?: boolean; dead?: number; bark: string }
function elderTree(s: ElderSpec): THREE.Group {
  const rnd = seeded(s.seed), wood: Geo[] = [], extra: Geo[] = [], crowns: Lobe[] = [];
  const F: V3 = [s.lean[0], s.lean[1], s.fork];
  const trunk = limb([[0, 0, -30], [F[0] * 0.12, F[1] * 0.12, s.fork * 0.3], [F[0] * 0.55, F[1] * 0.55, s.fork * 0.7], F, [F[0] * 1.1, F[1] * 1.1, s.fork + 320]],
    s.r, s.r * 0.48, s.bark, { seg: 16, flare: 0.5, roots: 8, gnarl: 1, seed: s.seed, step: 100, maxRings: 18, taper: 0.7 });
  wood.push(trunk);
  // the buttresses, each running on into a root over the ground
  const nb = 7;
  for (let i = 0; i < nb; i++) {
    const a = ((i + rnd() * 0.5) / nb) * Math.PI * 2;
    if (s.hollow && Math.cos(a) < -0.8) continue; // (the hollow's mouth stays open)
    const L = s.r * (2.3 + rnd() * 1.3), H = s.r * (1.8 + rnd() * 0.9), t = s.r * 0.2;
    const prof: XZ[] = [[0, -15], [0, H], [L * 0.1, H * 0.8], [L * 0.26, H * 0.47], [L * 0.5, H * 0.21], [L * 0.78, H * 0.07], [L, -15]];
    // thick where it leaves the trunk, thin at its tip, bowed a little to one side
    const bow = (rnd() - 0.5) * t * 2.2;
    const plank = slab(prof, t, s.bark, 4).map(({ geo, mat }) => {
      const p = geo.getAttribute("position");
      for (let k = 0; k < p.count; k++) {
        const u = Math.max(0, Math.min(1, p.getX(k) / L));
        p.setY(k, p.getY(k) * (1.5 - 1.1 * u) + Math.sin(u * Math.PI) * bow);
      }
      geo.computeVertexNormals();
      return { geo, mat };
    });
    wood.push(rotateZ(translate(plank, [s.r * 0.5, 0, 0]), a / D));
    const ex = s.r * 0.5 + L, bend = (rnd() - 0.5) * 0.7;
    wood.push(limb([polar(a, ex - 60, 16), polar(a + bend * 0.2, ex + 120, 6), polar(a + bend * 0.6, ex + 300 + rnd() * 160, -2), polar(a + bend, ex + 480 + rnd() * 220, -12)],
      t * 0.62, t * 0.14, s.bark, { seg: 7, maxRings: 9, gnarl: 0.8, seed: s.seed + 20 + i }));
  }
  // the limbs from the fork, a side branch on each, and their crowns
  for (let k = 0; k < s.limbs; k++) {
    const a = ((k + rnd() * 0.4) / s.limbs) * Math.PI * 2 + 0.3, R = s.reach * (0.78 + rnd() * 0.35);
    const z0 = s.fork - 60 - rnd() * 200;
    const base: V3 = [F[0] + Math.cos(a) * s.r * 0.2, F[1] + Math.sin(a) * s.r * 0.2, z0];
    const tip: V3 = [F[0] + Math.cos(a) * R, F[1] + Math.sin(a) * R, s.crown + (rnd() - 0.5) * 140];
    const mid: V3 = [F[0] + Math.cos(a + 0.14) * R * 0.45, F[1] + Math.sin(a + 0.14) * R * 0.45, z0 + (tip[2] - z0) * 0.42 + 70];
    const pts = [base, mid, tip], dead = k < (s.dead ?? 0);
    wood.push(limb(pts, s.r * 0.36, s.r * 0.1, s.bark, { seg: 10, gnarl: 0.7, step: 80, maxRings: 10, seed: s.seed + 40 + k }));
    if (dead) wood.push(grow({ mat: s.bark, seed: s.seed + 60 + k, at: tip, dir: [Math.cos(a) * 0.6, Math.sin(a) * 0.6, 1], len: 260, r: s.r * 0.1, depth: 2, spread: 0.7, tipR: 0.2 }));
    else crowns.push([tip[0], tip[1], tip[2] + 110, 420 + rnd() * 120, 400 + rnd() * 120, 150 + rnd() * 40]);
    const sp = along(pts, 0.55), sa = a + (rnd() < 0.5 ? -1 : 1) * (0.65 + rnd() * 0.3), sr = R * 0.5;
    const stip: V3 = [sp[0] + Math.cos(sa) * sr, sp[1] + Math.sin(sa) * sr, Math.max(sp[2] + 120, s.crown - 120 + rnd() * 120)];
    wood.push(limb([sp, [(sp[0] + stip[0]) / 2, (sp[1] + stip[1]) / 2, (sp[2] + stip[2]) / 2 + 40], stip], s.r * 0.15, s.r * 0.05, s.bark, { seg: 7, maxRings: 6, gnarl: 0.5, seed: s.seed + 80 + k }));
    if (!dead || k === 0) crowns.push([stip[0], stip[1], stip[2] + 60, 290 + rnd() * 60, 280 + rnd() * 60, 115]);
    // beard lichen hanging under the limb
    for (let j = 0; j < 4; j++) {
      const p = along(pts, 0.3 + j * 0.17 + rnd() * 0.05), L = 110 + rnd() * 190, rr = s.r * (0.3 - j * 0.04);
      extra.push(cylinderAt({ rBot: 1.5, rTop: 7 + rnd() * 4, height: L, segments: 5, bottom: [p[0] + (rnd() - 0.5) * 20, p[1] + (rnd() - 0.5) * 20, p[2] - rr - L + 6] }, "Westmount_Lichen"));
    }
  }
  crowns.push([F[0] * 1.15, F[1] * 1.15, s.crown + 260, s.reach * 0.62, s.reach * 0.58, 190]);
  // moss on the upper faces of the trunk, buttresses and limbs
  const moss = coverTop(wood.flat().filter((p) => p.mat === s.bark), "Westmount_MossBark", { amount: s.hollow ? 0.45 : 0.32, thick: 3.5, seed: s.seed + 3, grain: 55, ragged: 0.45, patches: 0.8 });
  // glowing bracket fungi up the trunk
  for (let i = 0; i < 6; i++) {
    const b = rnd() * Math.PI * 2, z = 150 + rnd() * 450, rr = s.r * (1.04 - 0.25 * (z / s.fork)) - 6;
    const at = polar(b, rr, z);
    for (let j = 0; j < 3; j++)
      extra.push(translate(rotateZ(ellipsoid([24 - j * 5, 30 - j * 6, 5], [0, 0, 0], j % 2 ? "Westmount_GlowCapBlue" : "Westmount_GlowCap", 9), b / D), [at[0] + Math.cos(b) * 8, at[1] + Math.sin(b) * 8, at[2] + j * 22]));
  }
  // the hollow at its foot, framed by a lip of bark
  if (s.hollow) {
    const xr = -s.r * 1.18;
    extra.push(ellipsoid([s.r * 0.32, s.r * 0.42, 190], [xr, 0, 120], "Westmount_Hollow", 12));
    const lip: V3[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = -Math.PI * 0.05 + (i / 12) * Math.PI * 1.1;
      lip.push([xr - s.r * 0.22 + Math.sin(t) * 12, Math.cos(t) * s.r * 0.46, 20 + Math.sin(t) * 260]);
    }
    wood.push(limb(lip, 22, 16, s.bark, { seg: 8, maxRings: 14, gnarl: 0.6, seed: s.seed + 9 }));
    for (const [y, h, c] of [[-40, 34, 16], [10, 52, 22], [55, 26, 12]] as const) extra.push(shroom([xr - s.r * 0.12, y, 0], h, c, [6, 0], y > 0 ? "Westmount_GlowCap" : "Westmount_GlowCapBlue", s.seed + y));
  }
  const can = canopy(crowns, s.leaf, s.seed + 5, ELDER, { density: 0.95, ragged: 0.6, sun: -0.05 });
  const fern = ferns([0, 1, 2, 3].map((i) => ({ at: polar(i * 1.7 + 0.4, s.r * 1.25, 0), n: 7, len: 95, seed: s.seed + 100 + i })));
  return group(merge(...wood, moss, ...extra, can.core), can.mesh, fern);
}

// a mushroom: a stem leaning by `lean`, a domed glowing cap with pale gills under it
function shroom(at: V3, h: number, cap: number, lean: [number, number], mat: string, seed: number): Geo {
  const rnd = seeded(seed), top: V3 = [at[0] + lean[0], at[1] + lean[1], at[2] + h];
  const stem = limb([at, [at[0] + lean[0] * 0.35, at[1] + lean[1] * 0.35, at[2] + h * 0.5], top], cap * 0.24, cap * 0.17, "Westmount_GlowStem", { seg: 7, maxRings: 4, flare: 0.35 });
  const dome = 0.45 + rnd() * 0.25;
  const capG = lathe([[0, cap * dome], [cap * 0.45, cap * dome * 0.92], [cap * 0.8, cap * dome * 0.6], [cap, cap * 0.12], [cap * 0.94, -cap * 0.02]], 12, mat, [top[0], top[1], top[2] - cap * 0.1]);
  const gill = lathe([[cap * 0.94, -cap * 0.02], [cap * 0.5, cap * 0.02], [cap * 0.2, cap * 0.06]], 12, "Westmount_GlowGill", [top[0], top[1], top[2] - cap * 0.1]);
  return merge(stem, capG, gill);
}

// A cluster of glowing mushrooms (3 m across) on a mossy hummock: two tall ones, a few middling,
// many small, in teal and blue, spores floating over them.
function glowMushrooms(): THREE.Group {
  const rnd = seeded(211), g: Geo[] = [lump([0, 0, -12], [150, 120, 34], 212, "Westmount_MossThick", 1, 0.2)];
  const list: [number, number, number, number][] = [[-30, 20, 125, 48], [50, -40, 98, 40], [-90, -60, 62, 28], [90, 60, 55, 24], [10, 100, 44, 20], [-120, 70, 36, 16], [130, -10, 30, 14]];
  for (let i = 0; i < 9; i++) list.push([(rnd() - 0.5) * 300, (rnd() - 0.5) * 240, 14 + rnd() * 16, 6 + rnd() * 7]);
  list.forEach(([x, y, h, c], i) => g.push(shroom([x, y, Math.max(0, 22 - Math.hypot(x / 150, y / 120) * 22)], h, c, [(rnd() - 0.5) * h * 0.25, (rnd() - 0.5) * h * 0.25], i % 3 === 1 ? "Westmount_GlowCapBlue" : "Westmount_GlowCap", 220 + i)));
  for (let i = 0; i < 14; i++) g.push(sphereCenter(1.6 + rnd() * 1.4, [(rnd() - 0.5) * 260, (rnd() - 0.5) * 220, 40 + rnd() * 130], "Westmount_Spore", 4));
  g.push(translate(rock([60, 46, 30], 0.4, 213, "Westmount_Menhir"), [120, -80, 0]));
  return group(merge(...g), ferns([{ at: [-150, -40, 4], n: 6, len: 70, seed: 214 }, { at: [140, 90, 4], n: 5, len: 60, seed: 215 }]));
}

// A mound of thick moss (4 m) over buried stones: a cushion of moss, the stones' backs showing
// through it, ferns and a few small glowing caps.
function mossMound(): THREE.Group {
  const g: Geo[] = [lump([0, 0, -20], [200, 150, 75], 231, "Westmount_MossThick", 2, 0.2), lump([120, 90, -10], [100, 80, 45], 232, "Westmount_MossDeep", 1, 0.2)];
  for (const [x, y, s, seed] of [[-130, -60, 70, 233], [60, -110, 54, 234], [-40, 120, 46, 235]] as const) {
    const r = translate(rock([s * 1.4, s * 1.1, s], 0.45, seed, "Westmount_Menhir"), [x, y, 0]);
    g.push(r, coverTop(r, "Westmount_Moss", { amount: 0.6, thick: 2.5, seed }));
  }
  for (const [x, y, h, c, i] of [[30, 40, 22, 9, 0], [50, 58, 15, 6, 1], [-80, 70, 18, 8, 2]]) g.push(shroom([x, y, 50], h, c, [2, 1], i === 1 ? "Westmount_GlowCapBlue" : "Westmount_GlowCap", 236 + i));
  return group(merge(...g), ferns([{ at: [-170, 40, 10], n: 7, len: 80, seed: 237 }, { at: [150, -60, 10], n: 6, len: 70, seed: 238 }, { at: [0, -150, 0], n: 5, len: 60, seed: 239 }]));
}

// A fallen giant (19 m): an elder trunk three metres through lying where it fell, its root plate
// torn out of the ground standing on edge at one end, its crown snapped off at the other, moss
// down its back, glowing brackets along its side, ferns and a sapling growing out of it.
function fallenGiant(): THREE.Group {
  const trunk = fallenTrunk({ seed: 71, len: 1800, r: 140, bark: "Westmount_Bark", wood: WOOD_END, roots: { soil: "Westmount_Soil", cover: "Westmount_Moss" }, broken: true, stubs: 5, moss: "Westmount_MossThick", mossAmount: 0.6, fungus: "Westmount_GlowCap", bow: 70 });
  const g: Geo[] = [trunk];
  // a broken limb lying beside it
  g.push(limb([[180, 200, 20], [330, 420, 40], [380, 760, 30]], 42, 18, "Westmount_Bark", { seg: 8, maxRings: 7, gnarl: 0.6, seed: 72 }));
  g.push(coverTop(g[1], "Westmount_Moss", { amount: 0.5, thick: 2, seed: 73 }));
  // a sapling rooted in the rotting back
  g.push(limb([[-10, 300, 260], [0, 310, 330], [12, 300, 400]], 6, 3, "Westmount_Bark", { seg: 5, maxRings: 3 }));
  const sap = canopy([[12, 300, 430, 70, 66, 50]], 34, 74, ELDER, { density: 1 });
  for (const [x, y, h, c, i] of [[-150, -100, 40, 18, 0], [-150, -60, 28, 12, 1], [160, 500, 36, 16, 2], [-150, 520, 24, 10, 3]]) g.push(shroom([x, y, 0], h, c, [0, 0], i % 2 ? "Westmount_GlowCapBlue" : "Westmount_GlowCap", 75 + i));
  const fern = ferns([{ at: [-170, 200, 0], n: 7, len: 90, seed: 76 }, { at: [170, -300, 0], n: 6, len: 80, seed: 77 }, { at: [0, 600, 250], n: 5, len: 60, seed: 78 }]);
  // centred on its footprint, the card meshes moved with it (they are Y up: world y is -z)
  const all = merge(...g, sap.core), b = new THREE.Box3();
  for (const p of all) {
    p.geo.computeBoundingBox();
    b.union(p.geo.boundingBox!);
  }
  const cx = (b.min.x + b.max.x) / 2, cy = (b.min.y + b.max.y) / 2;
  for (const m of [sap.mesh, fern]) m?.position.set(-cx, 0, cy);
  return group(translate(all, [-cx, -cy, 0]), sap.mesh, fern);
}

// A shrine of the Noa era (7.6 x 6 m, 6 m): three worn steps, four columns before a little cella
// with a dark doorway and a rune stone glowing inside, a pediment with the sun disc of old Noa,
// a roof of mossy tiles; moss over every ledge, ivy hanging off the cornice, the roots of a
// giant draped over its side, braziers with rune crystals, a fallen column by the steps.
function noaShrine(): THREE.Group {
  const S = "Westmount_ShrineStone", SD = "Westmount_ShrineDark", C = "Westmount_ShrineCarved", g: Geo[] = [];
  const top: Geo[] = [];
  top.push(boxBounds([-380, -300, -20], [380, 300, 25], SD, 3), boxBounds([-350, -270, 25], [350, 270, 50], S, 3), boxBounds([-320, -240, 50], [320, 240, 75], S, 3));
  // the columns before the cella
  const column = (x: number, y: number): Geo => merge(
    boxAt([64, 64, 16], [x, y, 75], SD, 2),
    lathe([[30, 0], [27, 8], [26, 12]], 14, C, [x, y, 91]),
    weather(cylinderAt({ rBot: 25, rTop: 22, height: 262, segments: 14, bottom: [x, y, 99] }, S), 1.5, 30, Math.round(x + y)),
    lathe([[22, 0], [26, 6], [31, 14]], 14, C, [x, y, 361]),
  );
  for (const y of [-195, -65, 65, 195]) g.push(column(-250, y));
  top.push(boxAt([70, 70, 12], [-250, -195, 375], C, 2), boxAt([70, 70, 12], [-250, -65, 375], C, 2), boxAt([70, 70, 12], [-250, 65, 375], C, 2), boxAt([70, 70, 12], [-250, 195, 375], C, 2));
  // the cella: walls with a doorway in the front
  const front = shapeOf([[-205, 75], [-70, 75], [-70, 300], [70, 300], [70, 75], [205, 75], [205, 387], [-205, 387]]);
  g.push(prism(front, -150, -110, S));
  g.push(boxBounds([-110, -205, 75], [290, -165, 387], S), boxBounds([-110, 165, 75], [290, 205, 387], S), boxBounds([250, -165, 75], [290, 165, 387], S));
  g.push(boxBounds([-158, -82, 296], [-104, 82, 318], C, 2), boxBounds([-150, -70, 75], [-110, 70, 80], SD));
  g.push(boxBounds([-108, -165, 76], [250, 165, 78], "Westmount_Hollow"));
  // the rune stone inside
  g.push(boxBounds([150, -45, 75], [200, 45, 245], SD, 3), boxBounds([147, -30, 120], [150, 30, 210], "Westmount_Rune"));
  // entablature, cornice, the roof and its pediments
  top.push(boxBounds([-300, -228, 387], [300, 228, 427], C, 2), boxBounds([-312, -240, 427], [312, 240, 442], S, 2));
  const roof = gableRoof2();
  top.push(roof);
  g.push(gableWallBoth(-305, 232, 442, 128, S), gableWallBoth(305, 232, 442, 128, S));
  g.push(translate(rotateY(cylinderAt({ radius: 34, height: 6, segments: 16, bottom: [0, 0, 0] }, "Westmount_Rune"), -90), [-308, 0, 492]));
  for (let k = 0; k < 8; k++) g.push(translate(rotateX(boxAt([3, 7, 18], [0, 0, 38], C), k * 45), [-307, 0, 492]));
  // braziers with rune crystals before the steps
  for (const y of [-250, 250]) {
    g.push(boxAt([56, 56, 20], [-440, y, 0], SD, 2), weather(cylinderAt({ rBot: 18, rTop: 15, height: 100, segments: 10, bottom: [-440, y, 20] }, S), 1.2, 20, 5));
    g.push(lathe([[16, 0], [30, 14], [36, 30], [32, 32]], 12, C, [-440, y, 120]));
    g.push(translate(rotateZ(cylinderAt({ rBot: 10, rTop: 0.5, height: 38, segments: 6, bottom: [0, 0, 0] }, "Westmount_Rune"), 15), [-440, y, 138]));
  }
  // a fallen column by the steps: drums and its capital
  g.push(translate(rotateX(cylinderAt({ radius: 24, height: 90, segments: 14, bottom: [0, 0, -45] }, S), 90), [-60, -390, 24]));
  g.push(translate(rotateZ(rotateX(cylinderAt({ radius: 24, height: 80, segments: 14, bottom: [0, 0, -40] }, S), 90), 28), [70, -420, 24]));
  g.push(translate(rotateY(boxAt([66, 66, 28], [0, 0, -14], C, 2), 18), [190, -380, 24]));
  // the roots of a giant draped over the side and the steps
  const roots: Geo[] = [
    limb([[520, 380, -10], [350, 300, 250], [270, 262, 440], [120, 258, 478], [-80, 262, 460], [-280, 268, 420], [-340, 290, 250], [-420, 320, 40], [-520, 380, -12]], 20, 9, "Westmount_Bark", { seg: 8, maxRings: 22, gnarl: 0.7, seed: 241 }),
    limb([[480, 420, -8], [300, 315, 30], [100, 300, 34], [-120, 310, 28], [-300, 330, 10], [-460, 400, -10]], 16, 7, "Westmount_Bark", { seg: 7, maxRings: 16, gnarl: 0.7, seed: 242 }),
    limb([[560, 300, -10], [330, 230, 300], [280, 160, 470], [200, 60, 545], [120, 20, 575]], 13, 5, "Westmount_Bark", { seg: 7, maxRings: 14, gnarl: 0.6, seed: 243 }),
  ];
  g.push(...roots, coverTop(roots.flat(), "Westmount_Moss", { amount: 0.4, thick: 2, seed: 244, patches: 0.7 }));
  // ivy hanging off the cornice
  const rnd = seeded(245);
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1, x = -280 + rnd() * 560, L = 60 + rnd() * 150;
    g.push(cylinderAt({ rBot: 2, rTop: 5, height: L, segments: 4, bottom: [x, side * 243, 440 - L] }, "Westmount_Vine"));
  }
  g.push(...top, coverTop(merge(...top), "Westmount_MossThick", { amount: 0.55, thick: 3, seed: 246, grain: 50, ragged: 0.5, patches: 0.75 }));
  return group(merge(...g), ferns([{ at: [-360, -320, 0], n: 7, len: 90, seed: 247 }, { at: [330, -330, 0], n: 6, len: 80, seed: 248 }, { at: [380, 280, 0], n: 7, len: 100, seed: 249 }]));
}
// the shrine's roof: two slopes from a ridge along X, eaves over the cornice
function gableRoof2(): Geo {
  const sy = 500, roofH = 128, over = 24, th = 16, len = 680;
  const ang = Math.atan2(roofH, sy / 2), slope = (sy / 2 + over) / Math.cos(ang);
  const side = (k: 1 | -1): Geo => rotateX(box([len, slope, th], [0, (k * slope) / 2, th / 2], "Westmount_MossTile"), (-k * ang) / D);
  return translate(merge(side(1), side(-1), boxAt([len + 10, 26, 18], [0, 0, -4], "Westmount_ShrineDark", 3)), [0, 0, 442 + roofH]);
}
// a gable's triangle, both faces
function gableWallBoth(x: number, half: number, z0: number, h: number, mat: string): Geo {
  return slab([[-half, 0], [half, 0], [0, h]], 14, mat).map(({ geo, mat: m }) => ({ geo: geo.clone().applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2)).translate(x, 0, z0), mat: m }));
}

// A standing stone gripped by roots (4.5 m): a weathered menhir with a column of faintly glowing
// runes on its face, a little tree rooted on its top whose roots wind down round it and spread
// over the ground; moss on its shoulders.
function rootStone(): THREE.Group {
  const H = 390, hx = 62, hy = 44, taper = 0.28;
  const stone = weather(scale(cylinderAt({ rBot: 1, rTop: 1 - taper, height: H, segments: 12, bottom: [0, 0, -10] }, "Westmount_Menhir"), [hx, hy, 1]), 6, 45, 251);
  const g: Geo[] = [stone, ellipsoid([hx * (1 - taper) * 1.02, hy * (1 - taper) * 1.02, 26], [0, 0, H - 14], "Westmount_Menhir", 12)];
  g.push(coverTop(merge(...g), "Westmount_Moss", { amount: 0.55, thick: 3, seed: 252, patches: 0.8 }));
  // the runes down its face (-X)
  const rnd = seeded(253);
  for (let k = 0; k < 6; k++) {
    const z = 110 + k * 38, x = -hx * (1 - (taper * (z + 10)) / H) - 3;
    g.push(boxAt([3, 4, 22], [x, -8 + rnd() * 6, z], "Westmount_Rune"), boxAt([3, 16, 4], [x, 0, z + (rnd() < 0.5 ? 4 : 16)], "Westmount_Rune"));
    if (rnd() < 0.6) g.push(boxAt([3, 4, 14], [x, 8, z + 4], "Westmount_Rune"));
  }
  // roots from the top winding down round it and out over the ground
  const roots: Geo[] = [];
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2 + rnd() * 0.4, turn = (rnd() < 0.5 ? -1 : 1) * (0.8 + rnd() * 0.9), r0 = 15 - i * 1.2, pts: V3[] = [[Math.cos(a0) * 12, Math.sin(a0) * 12, H + 14]];
    for (let k = 1; k <= 7; k++) {
      const t = k / 7, z = H * (1 - t) + 4, a = a0 + turn * t, f = 1 - (taper * (z + 10)) / H;
      pts.push([Math.cos(a) * (hx * f + r0 * 0.6), Math.sin(a) * (hy * f + r0 * 0.6), z]);
    }
    const a = a0 + turn, far = 150 + rnd() * 160;
    pts.push([Math.cos(a + turn * 0.2) * (hx + far * 0.5), Math.sin(a + turn * 0.2) * (hy + far * 0.5), -2], [Math.cos(a + turn * 0.3) * (hx + far), Math.sin(a + turn * 0.3) * (hy + far), -12]);
    roots.push(limb(pts, r0, 3, "Westmount_Bark", { seg: 7, maxRings: 20, gnarl: 0.7, seed: 254 + i }));
  }
  g.push(...roots, limb([[0, 0, H], [6, 4, H + 60], [-4, 6, H + 120]], 14, 6, "Westmount_Bark", { seg: 8, maxRings: 4, flare: 0.6, roots: 4, seed: 260 }));
  const can = canopy([[0, 0, H + 170, 130, 120, 95], [60, -40, H + 130, 80, 70, 60]], 48, 261, ELDER, { density: 1.1 });
  return group(merge(...g, can.core), can.mesh);
}

// A log bridge over the stream (10 m, along X): three great logs side by side hewn flat on top,
// the deck at ground height, sitting low in the water; a rail of poles on forked posts each side,
// stones heaped at both ends, moss along the logs.
function logBridge(): THREE.Group {
  const L = 1000, g: Geo[] = [], logs: Geo[] = [];
  for (const [y, r, seed] of [[-80, 36, 1], [0, 40, 2], [80, 35, 3]] as const) {
    const log = limb([[-L / 2, y, -r + 4], [0, y + (seed - 2) * 6, -r + 7], [L / 2, y, -r + 4]], r, r * 0.9, "Westmount_Log", { seg: 10, gnarl: 0.5, seed: 270 + seed, step: 90 });
    logs.push(log);
    g.push(log, endOf(log, 10, "start", { wood: WOOD_END }), endOf(log, 10, "end", { wood: WOOD_END, broken: seed === 2, seed: 273 }));
    g.push(boxBounds([-L / 2 + 30, y - r * 0.7, -2], [L / 2 - 30, y + r * 0.7, 6], "Westmount_Hewn", 1.5));
  }
  g.push(coverTop(logs.flat(), "Westmount_Moss", { amount: 0.25, thick: 2, seed: 274, patches: 0.5 }));
  // forked posts and rails
  for (const s of [-1, 1]) {
    const y = s * 128;
    for (let x = -420; x <= 420; x += 210) {
      g.push(cylinderBetween([x, y, -40], [x + 4, y, 100], 7, 6, "Westmount_Log"), cylinderBetween([x + 4, y, 92], [x + 18, y + s * 8, 116], 4, 5, "Westmount_Log"));
    }
    g.push(cylinderBetween([-440, y, 98], [440, y, 98], 6, 6, "Westmount_Log"), cylinderBetween([-430, y, 52], [430, y, 50], 4, 5, "Westmount_Log"));
  }
  for (const sx of [-1, 1])
    for (const [y, sz, seed] of [[-150, 70, 275], [150, 60, 276], [-60, 46, 277], [90, 40, 278]] as const) {
      const r = translate(rock([sz * 1.3, sz * 1.1, sz * 0.8], 0.45, seed + sx, "Westmount_Menhir"), [sx * (L / 2 + 20), y, -14]);
      g.push(r, coverTop(r, "Westmount_Moss", { amount: 0.55, thick: 2, seed }));
    }
  return group(merge(...g), ferns([{ at: [-540, 200, 0], n: 6, len: 70, seed: 279 }, { at: [540, -210, 0], n: 6, len: 70, seed: 280 }]));
}

// A bank of mist (14 x 6 m, about 2 m deep): soft puffs lying low, see-through, no shadow; for the
// hollows of the forest and round the karst towers.
function mistBank(): THREE.Group {
  const rnd = seeded(291), parts: Geo[] = [];
  for (let i = 0; i < 10; i++) {
    const x = (rnd() - 0.5) * 1100, y = (rnd() - 0.5) * 420, rx = 160 + rnd() * 200, ry = 120 + rnd() * 140;
    parts.push(ellipsoid([rx, ry, 45 + rnd() * 50], [x, y, 20 + rnd() * 80], "mist", 12));
  }
  for (let i = 0; i < 3; i++) parts.push(ellipsoid([240 + rnd() * 150, 160 + rnd() * 80, 30], [(rnd() - 0.5) * 900, (rnd() - 0.5) * 300, 150 + rnd() * 50], "mist", 10));
  const mat = new THREE.MeshStandardMaterial({ color: "#e6eee8", transparent: true, opacity: 0.14, roughness: 1, depthWrite: false, emissive: new THREE.Color("#a7b7ae"), emissiveIntensity: 0.35 });
  const g = toThree(merge(...parts), () => mat);
  g.traverse((o) => {
    o.castShadow = false;
    o.receiveShadow = false;
  });
  return g;
}

// =================================== the pass ===================================

// The old frontier gatehouse (21 x 8 m, 12.8 m at its tower): a gate block over an arched way
// through (4.4 m wide) with voussoirs, a raised rusted portcullis, one gate leaf hanging askew and
// one fallen; the west tower whole (battered base, arrow slits, machicolated parapet, a torn
// banner on its pole), the east tower fallen in to a jagged shell with its rubble spilled out
// round it and beams sticking out of the broken walls.
export const FORT_SOLIDS: SolidSpec[] = [
  { kind: "wall", x: 0, y: 650, w: 760, d: 700, rot: 0 },
  { kind: "wall", x: 0, y: -650, w: 760, d: 700, rot: 0 },
  { kind: "wall", x: 0, y: 270, w: 780, d: 110, rot: 0 },
  { kind: "wall", x: 0, y: -270, w: 780, d: 110, rot: 0 },
  { kind: "rock", x: -470, y: -740, r: 150 },
  { kind: "rock", x: -450, y: -470, r: 110 },
  { kind: "rock", x: 440, y: -820, r: 140 },
  { kind: "rock", x: 60, y: -1060, r: 150 },
];
function frontierFort(): Geo {
  const ST = "Westmount_FortStone", SD = "Westmount_FortDark", g: Geo[] = [];
  // the gate block and its way through
  g.push(prism(shapeOf([[-330, 0], [-220, 0], [-220, 380]]).absarc(0, 380, 220, Math.PI, 0, true).lineTo(220, 0).lineTo(330, 0).lineTo(330, 860).lineTo(-330, 860).lineTo(-330, 0) as THREE.Shape, -380, 380, ST));
  const band = (r0: number, r1: number, x0: number, x1: number): Geo => {
    const s = new THREE.Shape();
    s.moveTo(-r1, 380);
    s.absarc(0, 380, r1, Math.PI, 0, true);
    s.lineTo(r0, 380);
    s.absarc(0, 380, r0, 0, Math.PI, false);
    s.lineTo(-r1, 380);
    return prism(s, x0, x1, SD);
  };
  g.push(band(218, 268, -392, -378), band(218, 268, 378, 392));
  g.push(boxBounds([-396, -24, 588], [-376, 24, 660], SD, 2), boxBounds([376, -24, 588], [396, 24, 660], SD, 2));
  for (const x of [-392, 378]) g.push(boxBounds([x, -340, 0], [x + 14, -218, 60], SD), boxBounds([x, 218, 0], [x + 14, 340, 60], SD));
  g.push(boxBounds([-392, -342, 760], [392, 342, 784], SD, 2));
  // the raised portcullis
  for (let y = -200; y <= 200; y += 40) g.push(cylinderBetween([-240, y, 540], [-240, y, 632], 3, 5, "IronDark"));
  for (const z of [552, 590]) g.push(cylinderBetween([-240, -210, z], [-240, 210, z], 2.5, 5, "IronDark"));
  // the gate leaves: one hanging askew on the inside, one fallen flat
  g.push(translate(rotateZ(merge(boxBounds([0, -4, 20], [200, 10, 340], "Westmount_GateWood", 2), boxBounds([10, -10, 80], [190, -4, 96], "IronDark"), boxBounds([10, -10, 250], [190, -4, 266], "IronDark")), 112), [330, 214, 0]));
  g.push(translate(rotateZ(merge(boxBounds([0, 0, 0], [320, 200, 12], "Westmount_GateWood", 2), boxBounds([30, 10, 12], [46, 190, 16], "IronDark"), boxBounds([260, 10, 12], [276, 190, 16], "IronDark")), -24), [400, -180, 0]));
  // crenels along the gate block, broken toward the fallen tower
  const merlons = (x0: number, x1: number, y0: number, y1: number, z: number, skip: (y: number) => boolean): void => {
    for (let y = y0 + 35; y < y1 - 20; y += 110) if (!skip(y)) g.push(boxBounds([x0, y - 30, z], [x1, y + 30, z + 72], ST, 2));
  };
  g.push(boxBounds([-392, -330, 860], [-350, 330, 900], ST, 2), boxBounds([350, -330, 860], [392, 330, 900], ST, 2));
  merlons(-392, -352, -330, 330, 900, (y) => y < -180);
  merlons(352, 392, -330, 330, 900, (y) => y < -60);
  // the west tower (+Y): whole
  const T = { y0: 330, y1: 970, x0: -360, x1: 360, h: 1120 };
  g.push(boxBounds([T.x0 - 30, T.y0 - 10, 0], [T.x1 + 30, T.y1 + 30, 70], SD, 3));
  g.push(prism(shapeOf([[T.y0, 70], [T.y1 + 30, 70], [T.y1, 220], [T.y0, 220]]), T.x0 - 30, T.x1 + 30, SD));
  g.push(boxBounds([T.x0, T.y0, 220], [T.x1, T.y1, T.h], ST, 2));
  g.push(boxBounds([T.x0 - 8, T.y0, 560], [T.x1 + 8, T.y1 + 8, 584], SD, 2));
  for (let y = T.y0 + 40; y < T.y1; y += 75) for (const x of [T.x0 - 22, T.x1 + 22]) g.push(boxAt([30, 28, 40], [x, y, T.h - 40], SD, 2));
  for (let x = T.x0 + 40; x < T.x1; x += 75) g.push(boxAt([28, 30, 40], [x, T.y1 + 22, T.h - 40], SD, 2));
  g.push(boxBounds([T.x0 - 36, T.y0 - 6, T.h], [T.x1 + 36, T.y1 + 36, T.h + 70], ST, 2));
  for (let y = T.y0 + 30; y < T.y1 + 20; y += 104) for (const x of [T.x0 - 36, T.x1 + 6]) g.push(boxBounds([x, y, T.h + 70], [x + 30, y + 58, T.h + 150], ST, 2));
  for (let x = T.x0 - 6; x < T.x1; x += 104) g.push(boxBounds([x, T.y1 + 6, T.h + 70], [x + 58, T.y1 + 36, T.h + 150], ST, 2));
  for (const [x, y, z] of [[T.x0 - 2, 520, 360], [T.x0 - 2, 780, 360], [T.x0 - 2, 650, 760], [T.x1 - 6, 650, 420]] as const) g.push(boxBounds([x - 4, y - 7, z], [x + 8, y + 7, z + 110], "Westmount_Dark"));
  for (const [x, z] of [[-150, 400], [150, 800]] as const) g.push(boxBounds([x - 7, T.y1 - 4, z], [x + 7, T.y1 + 8, z + 110], "Westmount_Dark"));
  // its pole and torn banner
  g.push(cylinderAt({ radius: 7, height: 420, segments: 8, bottom: [200, 800, T.h + 70] }, "Westmount_GateWood"), sphereCenter(12, [200, 800, T.h + 496], "Bronze", 8));
  const banner = [[0, 0], [0, 260], [-40, 240], [-20, 180], [-55, 120], [-30, 70], [-60, 0]] as XZ[];
  g.push(translate(rotateZ(slab(banner.map(([a, b]) => [b, -a] as XZ), 3, "Westmount_Banner"), 90), [200, 806, T.h + 470 - 60]));
  g.push(translate(rotateY(slab(banner, 3, "Westmount_Banner"), 0), [200, 812, T.h + 220]));
  // the east tower (-Y): fallen in, a shell with jagged tops
  const E = { y0: -970, y1: -330, x0: -360, x1: 360, t: 90 };
  g.push(boxBounds([E.x0 - 30, E.y0 - 30, 0], [E.x1 + 30, E.y1 + 10, 70], SD, 3));
  const jag = (n: number, lo: number, hi: number, seed: number) => {
    const r = seeded(seed);
    return Array.from({ length: n }, () => lo + r() * (hi - lo));
  };
  // walls facing ±X (shapes across y) and ±Y (profiles along x)
  for (const [x0, x1, seed, lo, hi] of [[E.x0, E.x0 + E.t, 411, 260, 560], [E.x1 - E.t, E.x1, 412, 420, 820]] as const) {
    const n = 7, hs = jag(n, lo, hi, seed), pts: XZ[] = [[E.y0, 70], [E.y1, 70]];
    for (let i = 0; i < n; i++) pts.push([E.y1 - ((i + 0.5) / n) * (E.y1 - E.y0) + (i % 2 ? 20 : -20), hs[i]]);
    g.push(prism(shapeOf(pts), x0, x1, ST));
  }
  {
    const n = 7, hs = jag(n, 200, 640, 413), pts: XZ[] = [[E.x1, 70], [E.x0, 70]];
    for (let i = 0; i < n; i++) pts.push([E.x0 + ((i + 0.5) / n) * (E.x1 - E.x0), hs[i] + (i > 4 ? 180 : 0)]);
    g.push(translate(slab(pts.map(([x, z]) => [x, z] as XZ).reverse(), E.t, ST), [0, E.y0 + E.t / 2, 0]));
  }
  g.push(boxBounds([E.x0, E.y0 + 160, 300], [E.x0 + E.t + 4, E.y0 + 174, 400], "Westmount_Dark"));
  // its rubble: inside, spilled out before it and round its far side; fallen blocks
  const rubble = (c: V3, rx: number, ry: number, n: number, seed: number) => {
    const r = seeded(seed);
    g.push(translate(scale(rock([2, 2, 1.1], 0.5, seed, "Westmount_Rubble2"), [rx * 0.55, ry * 0.55, Math.min(rx, ry) * 0.5]), c));
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()), sz = 30 + r() * 45;
      const at: V3 = [c[0] + Math.cos(a) * rx * d, c[1] + Math.sin(a) * ry * d, c[2]];
      if (r() < 0.55) g.push(translate(rotateZ(rotateY(boxAt([sz * 1.6, sz, sz * 0.8], [0, 0, -sz * 0.2], r() < 0.5 ? ST : SD, 3), (r() - 0.5) * 40), r() * 180), at));
      else g.push(translate(rock([sz * 1.5, sz * 1.2, sz], 0.4, seed + i, "Westmount_Granite"), at));
    }
  };
  rubble([0, -650, 70], 230, 220, 10, 421);
  rubble([-470, -740, 0], 190, 250, 12, 422);
  rubble([-450, -440, 0], 120, 110, 6, 423);
  rubble([440, -820, 0], 170, 200, 10, 424);
  rubble([60, -1060, 0], 230, 130, 9, 425);
  rubble([-460, 150, 0], 70, 90, 4, 426);
  // beams sticking out of the broken walls
  for (const [a, b] of [[[-300, -500, 520], [-120, -620, 380]], [[260, -880, 640], [80, -760, 420]], [[300, -400, 460], [80, -560, 120]]] as [V3, V3][]) g.push(beamBetween(a, b, 18, 16, "Westmount_GateWood"));
  // weeds and lichen over the ruin's ledges
  g.push(coverTop(merge(...g).filter((p) => p.mat === ST || p.mat === SD), "Westmount_FortMoss", { amount: 0.25, thick: 1.5, seed: 430, patches: 0.35 }));
  return merge(...g);
}
defineMaterial("Westmount_Rubble2", { map: "stone", tint: "#9a9384", bump: 2.5 });

// A stretch of the fort's curtain wall (8 m along Y, 2 m thick), ruined: a battered foot, the
// wall-walk's crenels left on one end, the top broken down toward the other, blocks and rubble
// fallen at both feet. Pieces join end to end along Y (both ends stand full height).
function fortWall(): Geo {
  const ST = "Westmount_FortStone", SD = "Westmount_FortDark", g: Geo[] = [];
  const top: XZ[] = [[400, 560], [250, 560], [140, 540], [60, 470], [-20, 380], [-90, 400], [-170, 470], [-260, 520], [-330, 560], [-400, 560]];
  g.push(prism(shapeOf([[-400, 0], [400, 0], ...top]), -100, 100, ST));
  g.push(boxBounds([-122, -400, 0], [122, 400, 40], SD, 3), prism(shapeOf([[-400, 40], [400, 40], [400, 110], [-400, 110]]), -112, 112, SD));
  for (const y of [-370, -260, 250, 360]) g.push(boxBounds([-104, y - 32, 560], [-64, y + 32, 632], ST, 2), boxBounds([64, y - 32, 560], [104, y + 32, 632], ST, 2));
  g.push(boxBounds([-104, -400, 450], [-96, 400, 462], SD));
  g.push(boxBounds([-106, 180, 260], [-98, 194, 360], "Westmount_Dark"));
  const rnd = seeded(441);
  for (const s of [-1, 1])
    for (let i = 0; i < 7; i++) {
      const y = -260 + rnd() * 420, x = s * (150 + rnd() * 110), sz = 30 + rnd() * 40;
      if (rnd() < 0.5) g.push(translate(rotateZ(rotateY(boxAt([sz * 1.6, sz, sz * 0.8], [0, 0, -sz * 0.2], rnd() < 0.5 ? ST : SD, 3), (rnd() - 0.5) * 30), rnd() * 180), [x, y, 0]));
      else g.push(translate(rock([sz * 1.5, sz * 1.2, sz], 0.4, 442 + i + s * 10, "Westmount_Granite"), [x, y, 0]));
    }
  g.push(translate(scale(rock([2, 2, 1], 0.5, 450, "Westmount_Rubble2"), [90, 160, 60]), [-150, 20, 0]), translate(scale(rock([2, 2, 1], 0.5, 451, "Westmount_Rubble2"), [80, 140, 50]), [150, -40, 0]));
  g.push(coverTop(merge(...g), "Westmount_FortMoss", { amount: 0.25, thick: 1.5, seed: 452, patches: 0.4 }));
  return merge(...g);
}

// A rope bridge over the gorge (15.2 m of deck along X, 19 m with its anchors): planks on two
// stringers sagging a hand's breadth, posts on stone footings with guy ropes to stakes, handrail
// ropes with hangers, prayer flags strung along the top ropes, two planks gone.
export const BRIDGE_SOLIDS: SolidSpec[] = [
  { kind: "rail", x: 0, y: -128, w: 1560, d: 18, rot: 0 },
  { kind: "rail", x: 0, y: 128, w: 1560, d: 18, rot: 0 },
];
function gorgeBridge(): Geo {
  const L = 1520, W = 220, half = L / 2, rnd = seeded(461), g: Geo[] = [];
  const sag = (x: number) => -7 * (1 - (x / half) ** 2);
  let i = 0;
  for (let x = -half + 16; x <= half - 16; x += 31, i++) {
    if (i === 19 || i === 31) continue;
    g.push(translate(rotateZ(box([25, W + (rnd() - 0.5) * 16, 5], [0, 0, -2.5], rnd() < 0.5 ? "Westmount_Plank" : "WoodGrey", 1), (rnd() - 0.5) * 6), [x, (rnd() - 0.5) * 6, sag(x)]));
  }
  for (const y of [-W / 2 + 22, W / 2 - 22])
    for (let k = 0; k < 10; k++) {
      const a = -half + (L * k) / 10, b = -half + (L * (k + 1)) / 10;
      g.push(beamBetween([a, y, sag(a) - 10], [b, y, sag(b) - 10], 12, 10, "WoodDark"));
    }
  let seed = 470;
  for (const sx of [-1, 1]) {
    const x = sx * (half + 15);
    for (const sy of [-1, 1]) {
      const y = sy * (W / 2 + 18);
      g.push(cylinderAt({ rBot: 15, rTop: 12, height: 250, segments: 8, bottom: [x, y, -20] }, "Westmount_Log"));
      g.push(translate(rock([90, 80, 46], 0.45, seed++, "Westmount_GraniteDark"), [x, y, -10]));
      const sk: V3 = [x + sx * 150, y + sy * 40, 0];
      g.push(cylinderBetween([x, y, 212], [sk[0], sk[1], 22], 2.5, 4, "RopeTan"), cylinderBetween([sk[0] - sx * 8, sk[1], -10], [sk[0] + sx * 6, sk[1], 34], 5, 5, "WoodDark"));
      g.push(translate(rock([60, 50, 30], 0.4, seed++, "Westmount_Granite"), [sk[0] + sx * 20, sk[1], 0]));
    }
    g.push(beamBetween([x, -W / 2 - 36, 205], [x, W / 2 + 36, 205], 15, 15, "WoodDark"));
  }
  for (const sy of [-1, 1]) {
    const y = sy * (W / 2 + 18);
    const high = sagLine([-half - 15, y, 198], [half + 15, y, 198], 60, 24), mid = sagLine([-half - 15, y, 105], [half + 15, y, 105], 40, 24);
    g.push(rope(high, 3.2), rope(mid, 2.4), flags(high, 46, 22, 480 + sy));
    for (let k = 1; k < 24; k++) {
      const p = high[k];
      g.push(cylinderBetween(p, [p[0], y * 0.93, sag(p[0]) + 1], 1.4, 3, "RopeTan"));
    }
  }
  return merge(...g);
}

// A wall of the gorge (6 m along Y, 7.7 m tall), its face to -X: rock in bulging bands, darker
// and wetter low down, ledges jutting from it, a rocky lip along its top. It stands on z = 0 like
// any item; a field sets it down into the gorge so the lip meets the ground at the gorge's edge.
export const CHASM_DEPTH = 764;
function chasmWall(): Geo {
  const Hh = CHASM_DEPTH + 6, NY = 13, NZ = 12, Y0 = -330, Y1 = 330, rows: V3[][] = [];
  for (let i = 0; i <= NZ; i++) {
    const z = Hh * (1 - i / NZ), row: V3[] = [];
    for (let j = 0; j <= NY; j++) {
      const y = Y0 + ((Y1 - Y0) * j) / NY;
      const n = noise3(y / 140, z / 110, 3.3, 481) - 0.5, band = Math.sin(z / 95 + noise3(y / 300, 0, z / 300, 482) * 3);
      const x = i === 0 ? -14 : -40 * n - 18 * band + (i / NZ) * 30 - 20;
      row.push([x, y, z]);
    }
    rows.push(row);
  }
  const face = (i0: number, i1: number, mat: string): Geo => {
    const pos: number[] = [];
    for (let i = i0; i < i1; i++)
      for (let j = 0; j < NY; j++) {
        const a = rows[i][j], b = rows[i][j + 1], c = rows[i + 1][j + 1], d = rows[i + 1][j];
        pos.push(...a, ...c, ...d, ...a, ...b, ...c);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    const uv: number[] = [];
    for (let k = 0; k < pos.length; k += 3) uv.push(pos[k + 1] / 100, pos[k + 2] / 100);
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    return [{ geo, mat }];
  };
  const g: Geo[] = [face(0, 6, "Westmount_Chasm"), face(6, NZ, "Westmount_ChasmDeep")];
  // the lip: rock over the ground's edge, stones along it
  g.push(boxBounds([-16, Y0, Hh - 26], [70, Y1, Hh], "Westmount_Chasm", 4));
  const rnd = seeded(483);
  for (let k = 0; k < 5; k++) g.push(translate(rock([70 + rnd() * 50, 60 + rnd() * 40, 34 + rnd() * 20], 0.45, 484 + k, "Westmount_Granite"), [20 + rnd() * 30, Y0 + 60 + k * 125, Hh - 14]));
  for (let k = 0; k < 4; k++) g.push(translate(rock([110, 160, 60], 0.5, 490 + k, "Westmount_ChasmDeep", true), [-40, Y0 + 90 + k * 160, Hh * (0.25 + rnd() * 0.5)]));
  return merge(...g);
}

// A wind-bent pine (7 m): a trunk leaning away from the wind (to +X), its limbs swept the same
// way, the needles in flat pads like a mountain pine's; roots gripping the rock.
function windPine(seed: number, h: number): THREE.Group {
  const rnd = seeded(seed), pts: V3[] = [[0, 0, -10], [-10, 4, h * 0.2], [h * 0.1, 12, h * 0.45], [h * 0.26, -8, h * 0.68], [h * 0.42, 4, h * 0.84]];
  const wood: Geo[] = [limb(pts, h * 0.035, h * 0.008, "Westmount_PineBark", { seg: 9, flare: 0.6, roots: 4, gnarl: 0.8, seed, step: 50, maxRings: 14 })];
  const pads: Lobe[] = [];
  for (let k = 0; k < 6; k++) {
    const t = 0.42 + k * 0.1, p = along(pts, Math.min(0.98, t)), side = k % 2 ? 1 : -1;
    const len = h * (0.34 - k * 0.025) * (0.85 + rnd() * 0.3);
    const tip: V3 = [p[0] + len * 0.85, p[1] + side * len * (0.35 + rnd() * 0.25), p[2] + len * 0.05 - 20];
    wood.push(limb([p, [(p[0] + tip[0]) / 2, (p[1] + tip[1]) / 2, (p[2] + tip[2]) / 2 + 18], tip], h * 0.012, h * 0.003, "Westmount_PineBark", { seg: 6, maxRings: 5, gnarl: 0.5 }));
    pads.push([tip[0] - len * 0.15, tip[1], tip[2] + 14, len * 0.6, len * 0.5, 24 + rnd() * 6]);
  }
  pads.push([pts[4][0] + 40, pts[4][1], pts[4][2] + 24, h * 0.22, h * 0.18, 28]);
  for (let i = 0; i < 4; i++) {
    const a = i * 1.6 + rnd();
    wood.push(limb([polar(a, h * 0.02, h * 0.02), polar(a + 0.2, h * 0.08, 4), polar(a + 0.4, h * 0.16, -10)], h * 0.014, h * 0.003, "Westmount_PineBark", { seg: 5, maxRings: 4 }));
  }
  const can = canopy(pads, 32, seed + 1, PINE, { flat: 0.92, density: 1.3, core: 0.85, ragged: 0.2 }, 2);
  return group(merge(...wood, can.core), can.mesh);
}

// A prayer cairn (1.9 m, its flags reaching 9 m across): flat stones stacked in a cone, carved
// mani stones leaning at its foot, a pole from its top with a long streamer, strings of prayer
// flags from the pole out to stones in four directions.
function prayerCairn(): Geo {
  const g: Geo[] = [], rnd = seeded(501);
  let z = 0;
  for (let k = 0; k < 9; k++) {
    const r = 120 - k * 11, h = 20 + rnd() * 6;
    g.push(translate(rotateZ(rock([r * 2, r * 1.8, h * 1.6], 0.25, 502 + k, k % 3 ? "Westmount_Granite" : "Westmount_GraniteDark", true), rnd() * 180), [(rnd() - 0.5) * 10, (rnd() - 0.5) * 10, z]));
    z += h * 0.8;
  }
  g.push(coverTop(merge(...g), "Westmount_LichenPale", { amount: 0.5, thick: 1.2, seed: 511, patches: 0.5 }));
  for (const [a, w] of [[180, 70], [210, 54], [150, 60], [20, 64]] as const) {
    const r = a * D, stone = merge(boxAt([10, w, w * 0.8], [0, 0, 0], "Westmount_ShrineCarved", 3));
    for (let k = 0; k < 3; k++) stone.push(...boxAt([2, w * 0.7, 3], [-6, 0, w * 0.2 + k * w * 0.18], "Westmount_Teal"));
    g.push(translate(rotateZ(rotateY(stone, -14), a), [Math.cos(r) * 135, Math.sin(r) * 135, 0]));
  }
  const top: V3 = [0, 0, 440];
  g.push(cylinderAt({ radius: 5, height: 440 - z + 30, segments: 6, bottom: [0, 0, z - 30] }, "WoodDark"), sphereCenter(8, [0, 0, 446], "GoldTrim", 8));
  g.push(translate(rotateZ(boxAt([2, 18, 150], [0, 0, -150], "FabricGold"), 30), [8, 0, 430]));
  for (const a of [35, 125, 215, 305]) {
    const r = a * D, d = 360 + rnd() * 90, end: V3 = [Math.cos(r) * d, Math.sin(r) * d, 46];
    const line = sagLine(top, end, 40, 10);
    g.push(rope(line, 1.2, "RopeTan"), flags(line, 40, 22, 520 + a));
    g.push(translate(rock([60, 50, 40], 0.4, 530 + a, "Westmount_Granite"), [end[0], end[1], 0]), cylinderAt({ radius: 4, height: 50, segments: 5, bottom: end.map((v, i) => (i === 2 ? 0 : v)) as V3 }, "WoodDark"));
  }
  return merge(...g);
}

// A rockfall (9 m across): a house-sized granite block fallen from the walls above with the
// smaller ones that came down with it, lichen in patches over them.
function rockfall(): Geo {
  const g: Geo[] = [];
  const add = (size: V3, at: V3, seed: number, mat: string, turn: number) => g.push(translate(rotateZ(rock(size, 0.35, seed, mat), turn), at));
  add([440, 380, 320], [0, 0, -30], 551, "Westmount_Granite", 20);
  add([270, 230, 210], [270, -300, -15], 552, "Westmount_GraniteDark", 70);
  add([250, 270, 190], [-260, 260, -15], 553, "Westmount_Granite", 140);
  add([210, 180, 160], [-300, -220, -10], 554, "Westmount_GraniteDark", 10);
  const rnd = seeded(555);
  for (let i = 0; i < 12; i++) {
    const a = rnd() * Math.PI * 2, d = 250 + rnd() * 230, s = 50 + rnd() * 80;
    add([s * 1.4, s * 1.1, s], [Math.cos(a) * d, Math.sin(a) * d * 0.8, -5], 560 + i, rnd() < 0.5 ? "Westmount_Granite" : "Westmount_GraniteDark", rnd() * 180);
  }
  for (let i = 0; i < 10; i++) add([30 + rnd() * 30, 26 + rnd() * 20, 16], [(rnd() - 0.5) * 900, (rnd() - 0.5) * 700, 0], 580 + i, "Westmount_Granite", rnd() * 180);
  g.push(coverTop(merge(...g), "Westmount_LichenPale", { amount: 0.42, thick: 1.4, seed: 590, patches: 0.55 }));
  return merge(...g);
}

// =================================== the karst ===================================

// A limestone spire (6 m across, 15 m tall): a fluted sugarloaf of pale rock, bulging low and
// narrowing to a rounded head, dark streaks running down it, green on its ledges and a cap of it
// on top; its foot goes down into the water when it stands in the river.
function karstSpire(): THREE.Group {
  const H = 1500, NA = 22, rnd = seeded(601);
  const prof = (z: number) => {
    const t = z / H;
    return 300 * (1 + 0.12 * Math.sin(t * Math.PI * 1.2) - 0.42 * t * t) * (t > 0.86 ? Math.sqrt(Math.max(0, 1 - ((t - 0.86) / 0.14) ** 2)) : 1);
  };
  const rings: V3[][] = [];
  const zs: number[] = [-80];
  for (let z = 0; z < H * 0.86; z += 60) zs.push(z);
  for (let k = 0; k <= 6; k++) zs.push(H * (0.86 + 0.14 * Math.sin((k / 6) * Math.PI * 0.5)));
  for (const z of zs) {
    const ring: V3[] = [];
    for (let j = 0; j <= NA; j++) {
      const a = (j / NA) * Math.PI * 2, n = noise3(Math.cos(a) * 2, Math.sin(a) * 2, z / 160, 602);
      const flute = 1 - 0.09 * Math.abs(Math.sin(a * 4 + z / 400)) - 0.12 * (n - 0.5) - 0.05 * Math.max(0, Math.sin(z / 70));
      const r = prof(Math.max(0, z)) * flute;
      ring.push([Math.cos(a) * r, Math.sin(a) * r * 0.86, z]);
    }
    rings.push(ring);
  }
  const pos: Record<string, number[]> = { Westmount_Limestone: [], Westmount_LimeStain: [] };
  const streak = (j: number) => noise3(j * 0.7, 1.5, 0, 603) > 0.62;
  for (let i = 0; i + 1 < rings.length; i++)
    for (let j = 0; j < NA; j++) {
      const a = rings[i][j], b = rings[i][j + 1], c = rings[i + 1][j + 1], d = rings[i + 1][j];
      const m = streak(j) && i > 2 && rnd() < 0.85 ? "Westmount_LimeStain" : "Westmount_Limestone";
      pos[m].push(...a, ...b, ...c, ...a, ...c, ...d);
    }
  const top = rings[rings.length - 1][0];
  const g: Geo = Object.entries(pos).map(([mat, p]) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    const uv: number[] = [];
    for (let k = 0; k < p.length; k += 3) uv.push((Math.atan2(p[k + 1], p[k]) / Math.PI) * 4, p[k + 2] / 100);
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    return { geo, mat };
  });
  // green on the ledges and a cap of it on top
  const lobes: Lobe[] = [[0, 0, top[2] - 30, 150, 130, 90]];
  for (let k = 0; k < 9; k++) {
    const z = 250 + rnd() * 1050, a = rnd() * Math.PI * 2, r = prof(z) * 0.95;
    lobes.push([Math.cos(a) * r, Math.sin(a) * r * 0.86, z, 70 + rnd() * 50, 60 + rnd() * 40, 40 + rnd() * 20]);
  }
  const can = canopy(lobes, 48, 604, KARST_GREEN, { density: 1.1 }, 2);
  return group(merge(g, can.core), can.mesh);
}

// A swept roof of n sides over a ring of columns: concave slopes, the corners curling up at the
// eaves, the underside painted; ridges down each corner with a curl at the end.
function sweptRoof(n: number, rE: number, rT: number, h: number, lift: number, z0: number, rot: number): Geo {
  const U = 8, V = 6, ridges: Geo[] = [];
  const E = (2 * rE * Math.sin(Math.PI / n)) / 100, S = Math.hypot(rE - rT, h) / 100; // an eave's length, a slope's (m)
  type Buf = { pos: number[]; uv: number[] };
  const top: Buf = { pos: [], uv: [] }, under: Buf = { pos: [], uv: [] }, fascia: Buf = { pos: [], uv: [] };
  const P = (k: number, u: number, v: number, dz = 0): V3 => {
    const a0 = rot + (k / n) * Math.PI * 2, a1 = rot + ((k + 1) / n) * Math.PI * 2;
    const ex = Math.cos(a0) * rE + (Math.cos(a1) - Math.cos(a0)) * rE * u, ey = Math.sin(a0) * rE + (Math.sin(a1) - Math.sin(a0)) * rE * u;
    const tx = Math.cos(a0) * rT + (Math.cos(a1) - Math.cos(a0)) * rT * u, ty = Math.sin(a0) * rT + (Math.sin(a1) - Math.sin(a0)) * rT * u;
    const corner = Math.abs(2 * u - 1) ** 4, out = 1 + 0.1 * corner * (1 - v) ** 2;
    return [(ex + (tx - ex) * v) * out, (ey + (ty - ey) * v) * out, z0 + h * Math.pow(v, 1.7) + lift * corner * Math.pow(1 - v, 2.2) + dz];
  };
  // a quad of the grid (u0..u1, v0..v1) on face k; its texture runs along the eave (U) and up the slope (V)
  const quad = (b: Buf, k: number, u0: number, u1: number, v0: number, v1: number, dz0: number, dz1: number, flip: boolean, vScale = S) => {
    const c: [number, number, number][] = [[u0, v0, dz0], [u1, v0, dz0], [u1, v1, dz1], [u0, v1, dz1]];
    for (const q of flip ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3]) {
      const [u, v, dz] = c[q];
      b.pos.push(...P(k, u, v, dz));
      b.uv.push((k + u) * E * (1 - v * 0.6), v * vScale + (dz ? 0.1 : 0));
    }
  };
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < U; i++)
      for (let j = 0; j < V; j++) {
        const u0 = i / U, u1 = (i + 1) / U, v0 = j / V, v1 = (j + 1) / V;
        quad(top, k, u0, u1, v0, v1, 0, 0, false);
        quad(under, k, u0, u1, v0, v1, -12, -12, true);
      }
    for (let i = 0; i < U; i++) quad(fascia, k, i / U, (i + 1) / U, 0, 0, -12, 0, false, 0);
    const ridge: V3[] = [];
    for (let j = V; j >= 0; j--) ridge.push(P(k, 0, j / V, 8));
    const e = ridge[ridge.length - 1], dir = [e[0] / Math.hypot(e[0], e[1]), e[1] / Math.hypot(e[0], e[1])];
    ridge.push([e[0] + dir[0] * 30, e[1] + dir[1] * 30, e[2] + 22]);
    ridges.push(limb(ridge, 9, 6, "Westmount_RidgeTile", { seg: 6, maxRings: 14 }));
    ridges.push(sphereCenter(8, [e[0] + dir[0] * 34, e[1] + dir[1] * 34, e[2] + 30], "GoldTrim", 6));
  }
  const mk = (b: Buf, mat: string): Geo => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(b.pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(b.uv, 2));
    geo.computeVertexNormals();
    return [{ geo, mat }];
  };
  return merge(mk(top, "Westmount_GreenTile"), mk(under, "Westmount_Lacquer"), mk(fascia, "WoodRed"), ...ridges);
}

// A pavilion for a cliff top (7.6 m across, 7 m tall): a six-sided stone platform with steps at
// its front, six red columns, seats with leaning rails between them (all but the front), painted
// beams, fretwork and brackets under a swept roof of green glazed tiles with a gilded finial,
// red lanterns at the corners, a name board, a stone table and stools.
function cliffPavilion(): Geo {
  const g: Geo[] = [], R = 280, rot = Math.PI / 6;
  g.push(rotateZ(cylinderAt({ radius: 390, height: 30, segments: 6, bottom: [0, 0, -10] }, "Westmount_StairDark"), 30));
  g.push(rotateZ(cylinderAt({ radius: 355, height: 35, segments: 6, bottom: [0, 0, 20] }, "Westmount_StairStone"), 30));
  g.push(boxBounds([-400, -110, -10], [-330, 110, 10], "Westmount_StairStone", 2), boxBounds([-370, -110, 10], [-310, 110, 30], "Westmount_StairStone", 2));
  const corner = (k: number): V3 => polar(rot + (k / 6) * Math.PI * 2, R, 55);
  for (let k = 0; k < 6; k++) {
    const c = corner(k);
    g.push(lathe([[22, 0], [20, 10], [16, 18]], 10, "Westmount_StairDark", c), cylinderAt({ radius: 13, height: 300, segments: 10, bottom: [c[0], c[1], 70] }, "Westmount_Lacquer"));
    // brackets on the column head
    g.push(boxAt([34, 34, 14], [c[0], c[1], 360], "Westmount_Teal", 2), boxAt([46, 46, 12], [c[0], c[1], 374], "GoldTrim", 2));
  }
  for (let k = 0; k < 6; k++) {
    const a = corner(k), b = corner((k + 1) % 6);
    g.push(beamBetween([a[0], a[1], 340], [b[0], b[1], 340], 18, 28, "Westmount_Lacquer"), beamBetween([a[0], a[1], 316], [b[0], b[1], 316], 10, 8, "Westmount_Teal"));
    // fretwork under the beam
    for (let t = 0.1; t < 0.95; t += 0.2) {
      const p = lerp3(a, b, t), q = lerp3(a, b, t + 0.1);
      g.push(beamBetween([p[0], p[1], 300], [q[0], q[1], 300], 5, 5, "GoldTrim"), cylinderBetween([p[0], p[1], 290], [p[0], p[1], 312], 2.5, 4, "GoldTrim"));
    }
    const mid = lerp3(a, b, 0.5);
    if (mid[0] < -150) {
      // the front: open, a name board under the beam
      g.push(boxAt([6, 120, 46], [mid[0] - 14, mid[1], 352], "LacquerBlack", 1.5), boxAt([3, 128, 4], [mid[0] - 18, mid[1], 350], "GoldTrim"), boxAt([3, 128, 4], [mid[0] - 18, mid[1], 396], "GoldTrim"));
      for (let k2 = 0; k2 < 3; k2++) g.push(boxAt([2, 14, 22], [mid[0] - 18, mid[1] - 30 + k2 * 30, 362], "GoldTrim"));
      continue;
    }
    // a seat with a leaning rail (the goose-neck seat)
    const out = [mid[0] / Math.hypot(mid[0], mid[1]), mid[1] / Math.hypot(mid[0], mid[1])];
    g.push(beamBetween([a[0], a[1], 105], [b[0], b[1], 105], 34, 8, "Westmount_Lacquer"));
    g.push(beamBetween([a[0], a[1], 70], [b[0], b[1], 70], 10, 34, "Westmount_Lacquer"));
    g.push(beamBetween([a[0] + out[0] * 22, a[1] + out[1] * 22, 172], [b[0] + out[0] * 22, b[1] + out[1] * 22, 172], 8, 8, "Westmount_Lacquer"));
    for (let t = 0.12; t < 0.95; t += 0.11) {
      const p = lerp3(a, b, t);
      g.push(cylinderBetween([p[0], p[1], 109], [p[0] + out[0] * 22, p[1] + out[1] * 22, 170], 2.5, 4, "Westmount_Lacquer"));
    }
  }
  g.push(sweptRoof(6, 450, 50, 250, 70, 392, rot));
  g.push(lathe([[30, 0], [22, 20], [10, 30], [20, 48], [24, 64], [14, 84], [4, 96], [1, 120]], 10, "GoldTrim", [0, 0, 630]));
  // lanterns at the eave corners
  for (let k = 0; k < 6; k++) {
    const a = rot + (k / 6) * Math.PI * 2, p = polar(a, 490, 0);
    g.push(cylinderBetween([p[0], p[1], 455], [p[0], p[1], 410], 1.2, 3, "RopeTan"), ellipsoid([17, 17, 21], [p[0], p[1], 390], "Westmount_LanternRed", 10));
    g.push(cylinderAt({ radius: 10, height: 5, segments: 8, bottom: [p[0], p[1], 408] }, "GoldTrim"), cylinderAt({ radius: 9, height: 5, segments: 8, bottom: [p[0], p[1], 366] }, "GoldTrim"), cylinderAt({ rBot: 1, rTop: 3, height: 22, segments: 4, bottom: [p[0], p[1], 344] }, "FabricRed"));
  }
  // a stone table and stools
  g.push(lathe([[26, 0], [16, 10], [12, 60], [44, 66], [46, 74], [0, 76]], 10, "Westmount_StairStone", [30, 0, 55]));
  for (const a of [0.5, 2.2, 3.8, 5.3]) g.push(lathe([[16, 0], [20, 22], [17, 42], [0, 44]], 8, "Westmount_StairStone", [30 + Math.cos(a) * 80, Math.sin(a) * 80, 55]));
  return merge(...g);
}

// Stone stairs up a cliff (12 m of run along X, climbing 4 m from the foot at -X to the top at
// +X), for a straight ramp of the same slope at least 4.2 m wide: thirty steps between stringers,
// balustrades of posts with lotus heads, rails and panels, moss on the treads.
function stoneStairs(): Geo {
  const g: Geo[] = [], run = 1200, rise = 400, n = 30, W = 180, k = rise / run, tr = run / n, rnd = seeded(621);
  const zAt = (x: number) => x * k;
  for (let i = 0; i < n; i++) {
    const x0 = -run / 2 + i * tr, x1 = x0 + tr, top = zAt(x1) + 3;
    g.push(boxBounds([x0, -W, zAt(x0) - 70], [x1 + 6, W, top], rnd() < 0.3 ? "Westmount_StairDark" : "Westmount_StairStone", 2));
    if (rnd() < 0.3) g.push(ellipsoid([14, 30 + rnd() * 30, 3], [x1 - 10, (rnd() - 0.5) * 260, top], "Westmount_Moss", 6));
  }
  for (const s of [-1, 1]) {
    const y = s * (W + 16);
    for (let j = 0; j < 8; j++) {
      const xa = -run / 2 + (j * run) / 8, xb = xa + run / 8;
      g.push(beamBetween([xa, y, zAt(xa) - 20], [xb + 4, y, zAt(xb + 4) - 20], 36, 90, "Westmount_StairDark"));
    }
    for (let x = -run / 2; x <= run / 2 + 1; x += 150) {
      const z = zAt(x) + 25;
      g.push(boxAt([22, 22, 92], [x, y, z - 6], "Westmount_StairStone", 2), lathe([[12, 0], [14, 6], [10, 16], [3, 24], [0, 26]], 8, "Westmount_StairStone", [x, y, z + 86]));
      if (x + 150 <= run / 2 + 1) {
        const x2 = x + 150;
        g.push(beamBetween([x + 11, y, zAt(x + 11) + 95], [x2 - 11, y, zAt(x2 - 11) + 95], 12, 12, "Westmount_StairStone"));
        g.push(beamBetween([x + 11, y, zAt(x + 11) + 52], [x2 - 11, y, zAt(x2 - 11) + 52], 7, 44, "Westmount_StairStone"));
      }
    }
  }
  return merge(...g);
}

// A stone slab bridge (11 m along X, 3 m wide): four spans of long slabs on piers with pointed
// cutwaters, low posts with lotus heads and rails along both sides, abutments of big blocks; the
// deck a hand above the ground, the piers down in the water.
export const SLAB_BRIDGE_SOLIDS: SolidSpec[] = [
  { kind: "rail", x: 0, y: -152, w: 1120, d: 22, rot: 0 },
  { kind: "rail", x: 0, y: 152, w: 1120, d: 22, rot: 0 },
];
function slabBridge(): Geo {
  const g: Geo[] = [], rnd = seeded(631), L = 1100;
  for (const x of [-275, 0, 275]) {
    g.push(boxBounds([x - 36, -150, -140], [x + 36, 150, -4], "Westmount_StairDark", 3));
    for (const s of [-1, 1]) g.push(translate(rotateZ(boxAt([52, 52, 136], [0, 0, -140], "Westmount_StairDark", 2), 45), [x, s * 160, 0]));
  }
  for (let sp = 0; sp < 4; sp++) {
    const x0 = -L / 2 + sp * 275 - 6, x1 = x0 + 287;
    for (const y of [-100, 0, 100]) g.push(boxBounds([x0, y - 49, -4], [x1, y + 49, 12 + rnd() * 2], rnd() < 0.35 ? "Westmount_StairDark" : "Westmount_StairStone", 2));
  }
  for (const sx of [-1, 1]) {
    g.push(boxBounds([sx > 0 ? L / 2 - 10 : -L / 2 - 110, -190, -140], [sx > 0 ? L / 2 + 110 : -L / 2 + 10, 190, 6], "Westmount_StairDark", 3));
    for (const sy of [-1, 1]) g.push(translate(rock([110, 90, 50], 0.4, 640 + sx + sy * 3, "Westmount_Limestone"), [sx * (L / 2 + 90), sy * 230, -10]));
  }
  for (const s of [-1, 1]) {
    const y = s * 152;
    for (let x = -L / 2; x <= L / 2 + 1; x += 137.5) {
      const end = Math.abs(x) > L / 2 - 1;
      g.push(boxAt([end ? 30 : 20, end ? 30 : 20, end ? 90 : 66], [x, y, 10], "Westmount_StairStone", 2), lathe([[11, 0], [13, 6], [9, 14], [0, 22]], 8, "Westmount_StairStone", [x, y, end ? 100 : 76]));
      if (x + 137.5 <= L / 2 + 1) g.push(boxBounds([x + 10, y - 6, 54], [x + 127.5, y + 6, 66], "Westmount_StairStone", 1.5), boxBounds([x + 10, y - 4, 10], [x + 127.5, y + 4, 22], "Westmount_StairStone", 1));
    }
  }
  return merge(...g);
}

// A bamboo raft (6.2 m along X): a dozen poles lashed side by side, their bows curving up at the
// front (-X), cross-bars bound with rope, two bamboo chairs under an arched canopy, a lantern at
// the bow and the long punting pole along one side. It floats: its poles sit half in the water.
function bambooRaft(): Geo {
  const g: Geo[] = [], L = 620;
  for (let i = 0; i < 12; i++) {
    const y = -82 + i * 15;
    g.push(limb([[-L / 2, y, 14], [-L / 2 + 60, y, 2], [-L / 2 + 160, y, -4], [L / 2, y, -5]], 7.2, 6.4, i % 3 ? "Bamboo" : "BambooDry", { seg: 7, step: 60, maxRings: 12 }));
  }
  for (const x of [-200, -60, 80, 220]) {
    g.push(cylinderBetween([x, -95, 4], [x, 95, 4], 5, 6, "BambooDry"));
    for (const y of [-75, -15, 45]) g.push(cylinderAt({ radius: 8, height: 4, segments: 6, bottom: [x, y, 1] }, "RopeTan"));
  }
  // two chairs and the canopy over them
  for (const x of [-40, 60]) {
    g.push(boxBounds([x - 24, -40, 4], [x + 24, 40, 40], "BambooDry", 2), boxBounds([x + 20, -40, 40], [x + 26, 40, 92], "Bamboo", 1.5));
    for (const y of [-40, 40]) g.push(cylinderBetween([x - 24, y, 40], [x - 24, y, 62], 2.5, 5, "Bamboo"), cylinderBetween([x - 24, y, 62], [x + 24, y, 62], 2.5, 5, "Bamboo"));
  }
  const hoops: V3[][] = [];
  for (const x of [-60, 20, 100]) {
    const arc: V3[] = [];
    for (let k = 0; k <= 8; k++) {
      const a = (k / 8) * Math.PI;
      arc.push([x, -88 * Math.cos(a), 40 + 85 * Math.sin(a)]);
    }
    hoops.push(arc);
    g.push(limb(arc, 3, 3, "Bamboo", { seg: 5, maxRings: 10 }));
    for (const y of [-88, 88]) g.push(cylinderBetween([x, y, 2], [x, y, 42], 3, 5, "Bamboo"));
  }
  const pos: number[] = [];
  for (let k = 0; k < 8; k++)
    for (let h = 0; h + 1 < hoops.length; h++) {
      const a = hoops[h][k], b = hoops[h + 1][k], c = hoops[h + 1][k + 1], d = hoops[h][k + 1];
      const up = (p: V3): V3 => [p[0], p[1] * 1.04, p[2] + 3];
      pos.push(...up(a), ...up(b), ...up(c), ...up(a), ...up(c), ...up(d));
    }
  const cover = new THREE.BufferGeometry();
  cover.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  cover.setAttribute("uv", new THREE.Float32BufferAttribute(pos.flatMap((_, i) => (i % 3 === 0 ? [pos[i] / 100, pos[i + 1] / 100 + pos[i + 2] / 100] : [])), 2));
  cover.computeVertexNormals();
  g.push([{ geo: cover, mat: "Westmount_RaftCloth" }]);
  // the bow lantern and the punting pole
  g.push(cylinderBetween([-L / 2 + 40, 0, 4], [-L / 2 + 40, 0, 130], 2.5, 5, "Bamboo"), ellipsoid([12, 12, 15], [-L / 2 + 40, 0, 118], "Westmount_LanternRed", 8));
  g.push(cylinderBetween([-L / 2 + 20, 70, 12], [L / 2 + 120, 64, 8], 3, 6, "BambooDry"));
  return merge(...g);
}

// Lotus in the water (9 x 7 m): pads floating on the surface (the fields' water lies 12-14 cm
// down), others held up on stalks and cupped, pink flowers open and in bud, seed heads. No solid.
function lotusPond(): Geo {
  const g: Geo[] = [], rnd = seeded(651);
  for (let i = 0; i < 34; i++) {
    const x = (rnd() - 0.5) * 860, y = (rnd() - 0.5) * 640, r = 28 + rnd() * 30;
    const pad = cylinderAt({ radius: r, height: 1.5, segments: 12, bottom: [0, 0, 0] }, rnd() < 0.3 ? "Westmount_LotusPadPale" : "Westmount_LotusPad");
    g.push(translate(rotateZ(pad, rnd() * 360), [x, y, -11.5]));
  }
  for (let i = 0; i < 12; i++) {
    const x = (rnd() - 0.5) * 760, y = (rnd() - 0.5) * 560, h = 40 + rnd() * 50, r = 30 + rnd() * 20, lean: V3 = [(rnd() - 0.5) * 20, (rnd() - 0.5) * 20, 0];
    g.push(cylinderBetween([x, y, -14], [x + lean[0], y + lean[1], h], 1.8, 4, "Westmount_LotusPad"));
    g.push(translate(rotateY(cylinderAt({ rBot: 4, rTop: r, height: 14, segments: 10, bottom: [0, 0, -12] }, "Westmount_LotusPad"), (rnd() - 0.5) * 30), [x + lean[0], y + lean[1], h]));
  }
  for (let i = 0; i < 11; i++) {
    const x = (rnd() - 0.5) * 760, y = (rnd() - 0.5) * 560, h = 55 + rnd() * 50, top: V3 = [x, y, h];
    g.push(cylinderBetween([x, y, -14], top, 1.5, 4, "Westmount_LotusPad"));
    if (i % 4 === 3) {
      g.push(ellipsoid([9, 9, 16], [x, y, h + 12], "Westmount_PetalDeep", 8));
      continue;
    }
    if (i % 5 === 4) {
      g.push(cylinderAt({ rBot: 5, rTop: 10, height: 8, segments: 10, bottom: top }, "Westmount_Seedpod"));
      continue;
    }
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * 360 + (k % 2) * 22, inner = k % 2 === 1;
      const petal = rotateY(ellipsoid([5, 9, 18], [0, 0, 16], inner ? "Westmount_Petal" : "Westmount_PetalDeep", 6), inner ? 22 : 44);
      g.push(translate(rotateZ(petal, a), top));
    }
    g.push(cylinderAt({ rBot: 5, rTop: 6, height: 6, segments: 8, bottom: [x, y, h + 4] }, "Westmount_Seedpod"));
  }
  return merge(...g);
}

// =================================== the kit ===================================

export const KIT: Kit = {
  id: "westmount",
  name: "ป่าโบราณและภูผาตะวันตก",
  region: "ระหว่างโนอากับซูโจว",
  desc: "ป่าโบราณต้นไม้ยักษ์ มอสและเห็ดเรืองแสง ช่องเขาตะวันตกกับด่านชายแดนเก่าและสะพานเชือก ภูผาหินปูนกับศาลาบนผาและแพไม้ไผ่",
  ground: "moss",
  items: [
    // the forest
    { id: "elder_tree", name: "ต้นไม้ยักษ์พันปี", make: () => elderTree({ seed: 11, r: 190, fork: 1150, lean: [60, -40], limbs: 5, reach: 720, crown: 1550, leaf: 128, bark: "Westmount_Bark" }), tags: ["landmark", "plant"] },
    { id: "elder_tree_old", name: "ต้นไม้ยักษ์โพรงกลวง", make: () => elderTree({ seed: 23, r: 230, fork: 820, lean: [-50, 60], limbs: 5, reach: 640, crown: 1180, leaf: 120, hollow: true, dead: 1, bark: "Westmount_BarkOld" }), tags: ["landmark", "plant"] },
    { id: "fallen_giant", name: "ซากต้นไม้ยักษ์ล้ม", make: fallenGiant, tags: ["log", "decor"] },
    { id: "glow_mushrooms", name: "กลุ่มเห็ดเรืองแสง", make: glowMushrooms, tags: ["decor", "magic"] },
    { id: "moss_mound", name: "เนินมอสหนา", make: mossMound, tags: ["decor"] },
    { id: "noa_shrine", name: "ศาลหินยุคโนอา", make: noaShrine, tags: ["landmark"] },
    { id: "root_stone", name: "หินตั้งรากไม้รัด", make: rootStone, tags: ["stone", "magic"] },
    { id: "log_bridge", name: "สะพานซุงข้ามลำธาร (10 ม.)", make: logBridge, tags: ["ground", "bridge"] },
    { id: "mist_bank", name: "ม่านหมอก", make: mistBank, tags: ["ground", "decor"] },
    // the pass
    { id: "frontier_fort", name: "ด่านชายแดนเก่า", make: frontierFort, tags: ["landmark", "defence", "gate"] },
    { id: "fort_wall", name: "กำแพงด่านพัง (8 ม.)", make: fortWall, tags: ["wall", "defence"] },
    { id: "gorge_bridge", name: "สะพานเชือกข้ามหุบเหว (15 ม.)", make: gorgeBridge, tags: ["ground", "bridge"] },
    { id: "chasm_wall", name: "ผนังหุบเหว (6 ม.)", make: chasmWall, tags: ["ground"] },
    { id: "wind_pine", name: "สนลู่ลม", make: () => windPine(661, 720), tags: ["plant"] },
    { id: "prayer_cairn", name: "กองหินมนต์ธงสวด", make: prayerCairn, tags: ["stone", "decor"] },
    { id: "rockfall", name: "กองหินถล่ม", make: rockfall, tags: ["rock"] },
    // the karst
    { id: "karst_spire", name: "แท่งหินปูน", make: karstSpire, tags: ["rock", "landmark"] },
    { id: "cliff_pavilion", name: "ศาลาริมผา", make: cliffPavilion, tags: ["landmark", "building"] },
    { id: "stone_stairs", name: "บันไดหินขึ้นผา (12 ม. สูง 4 ม.)", make: stoneStairs, tags: ["ground", "stairs"] },
    { id: "slab_bridge", name: "สะพานแผ่นหิน (11 ม.)", make: slabBridge, tags: ["ground", "bridge"] },
    { id: "bamboo_raft", name: "แพไม้ไผ่", make: bambooRaft, tags: ["boat"] },
    { id: "lotus_pond", name: "กอบัวในน้ำ", make: lotusPond, tags: ["ground", "plant"] },
  ],
  sample(put: Put) {
    // a corner of the ancient forest: the shrine under the giants, the stream's log bridge, the
    // standing stones, mushrooms and moss; at its east edge the way climbs to the pass: a ruined
    // wall, a cairn, wind-bent pines; and a limestone spire with its pavilion beyond
    put("elder_tree", [-900, 900, 0], 0);
    put("elder_tree_old", [1200, 1500, 0], 160);
    put("noa_shrine", [-300, -100, 0], 0);
    put("fallen_giant", [900, -300, 0], 75);
    put("log_bridge", [-1600, -1100, 0], 90);
    put("glow_mushrooms", [-1500, 0, 0], 0);
    put("glow_mushrooms", [400, -1000, 0], 90, 0.8);
    put("moss_mound", [-1700, 1600, 0], 30);
    put("moss_mound", [1600, -100, 0], 120, 0.8);
    put("mist_bank", [-200, 1700, 0], 10);
    put("mist_bank", [-1200, -1600, 0], -20, 0.8);
    put("flora:BigOak", [-1900, 500, 0], 40);
    put("plains:fern_clump", [-700, -700, 0], 0);
    put("fort_wall", [1700, -1900, 0], 90);
    put("prayer_cairn", [700, -1700, 0], 30);
    put("wind_pine", [1900, -1300, 0], 180, 0.9);
    put("rockfall", [-300, -1800, 0], 40, 0.6);
    put("karst_spire", [2000, 900, 0], 0, 0.7);
    put("glow_mushrooms", [-600, 1900, 0], 200, 0.7);
    put("jungle:giant_fern", [-200, 700, 0], 30);
    put("jungle:tree_fern", [1500, 600, 0], 0);
    for (const [x, y, h, s] of [[-2000, -400, 0, 1.2], [1900, 1900, 40, 1.1], [-1900, 2000, 80, 1.3], [300, 2100, 20, 1]] as const) put("flora:BigOak", [x, y, 0], h, s);
    for (const [x, y, h] of [[-2100, -1900, 0], [600, -2100, 50], [2100, -300, 90]] as const) put("flora:RoundTree", [x, y, 0], h, 1.1);
    for (const [x, y] of [[-1200, 300], [-600, -900], [200, -600], [1000, 200], [-1700, 900], [-300, 1300], [800, 1500], [1300, -1300], [-2000, 1400], [1700, 1300], [-800, -1700], [0, -1400]] as const) put("plains:fern_clump", [x, y, 0], x + y, 1.2);
    for (const [x, y] of [[-1300, -600], [500, 1000], [1200, 1100], [-2100, 300]] as const) put("jungle:giant_fern", [x, y, 0], x);
    for (const [x, y, h] of [[-1000, -1500, 20], [1500, 1700, 120], [-1800, -300, 70]] as const) put("moss_mound", [x, y, 0], h, 0.8);
    for (const [x, y, h] of [[1100, -700, 0], [-2100, 1300, 90], [200, -2000, 40]] as const) put("plains:stump", [x, y, 0], h);
    for (const [x, y, h] of [[900, 1800, 0], [-1500, -2000, 60], [2000, 400, 120]] as const) put("plains:boulder", [x, y, 0], h, 0.8);
    put("wind_pine", [1200, -2100, 0], 170, 0.8);
    put("glow_mushrooms", [1300, 300, 0], 60, 0.8);
    for (let k = 0; k < 4; k++) put("root_stone", [600 + Math.cos(k * 1.4) * 450, 600 + Math.sin(k * 1.4) * 450, 0], k * 70, 0.6);
  },
};

// ---- helpers the westmount fields share (world cm, north +X, west +Y) ----
export type XY = [number, number];

// A Catmull-Rom curve through the points, `per` steps a span.
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
// A strip `w` wide along a polyline, as a polygon.
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
// A wobbly ellipse.
export function blob(c: XY, rx: number, ry: number, seed: number, n = 22): XY[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, k = 1 + 0.08 * Math.sin(a * 3 + seed) + 0.05 * Math.cos(a * 5 + seed * 2);
    return [c[0] + Math.cos(a) * rx * k, c[1] + Math.sin(a) * ry * k] as XY;
  });
}
export function inPoly(poly: XY[], x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// How far a point is from a polyline.
export function toLine(p: XY, pts: XY[]): number {
  let d = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - ax) * (bx - ax) + (p[1] - ay) * (by - ay)) / L2));
    d = Math.min(d, Math.hypot(ax + (bx - ax) * t - p[0], ay + (by - ay) * t - p[1]));
  }
  return d;
}
// The point of a polyline nearest a guess, and its direction there.
export function nearestOn(line: XY[], guess: XY): { at: XY; dir: XY } {
  let best = { d: Infinity, at: guess, dir: [1, 0] as XY };
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1], [bx, by] = line[i], L = Math.hypot(bx - ax, by - ay) || 1;
    const t = Math.max(0, Math.min(1, ((guess[0] - ax) * (bx - ax) + (guess[1] - ay) * (by - ay)) / (L * L)));
    const p: XY = [ax + (bx - ax) * t, ay + (by - ay) * t], d = Math.hypot(p[0] - guess[0], p[1] - guess[1]);
    if (d < best.d) best = { d, at: p, dir: [(bx - ax) / L, (by - ay) / L] };
  }
  return { at: best.at, dir: best.dir };
}
// A polyline with a stretch `half` either side of each cut taken out (where a bridge crosses).
export function pieces(pts: XY[], cuts: XY[], half: number): XY[][] {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const at = (s: number): XY => {
    let i = 1;
    while (i < pts.length - 1 && cum[i] < s) i++;
    const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
  };
  const proj = (p: XY): number => {
    let best = 0, bd = Infinity;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = cum[i] - cum[i - 1] || 1;
      const t = Math.max(0, Math.min(1, ((p[0] - ax) * (bx - ax) + (p[1] - ay) * (by - ay)) / (L * L)));
      const d = Math.hypot(ax + (bx - ax) * t - p[0], ay + (by - ay) * t - p[1]);
      if (d < bd) [bd, best] = [d, cum[i - 1] + t * L];
    }
    return best;
  };
  const L = cum[cum.length - 1], keep: [number, number][] = [];
  let from = 0;
  for (const s of cuts.map(proj).sort((a, b) => a - b)) {
    if (s - half > from) keep.push([from, s - half]);
    from = s + half;
  }
  if (from < L) keep.push([from, L]);
  return keep.map(([a, b]) => [at(a), ...pts.filter((_, i) => cum[i] > a && cum[i] < b), at(b)]);
}
// A polygon with no side longer than `max` (each cliff side is its own short solid, so the
// monsters' spots near it are not crowded out).
export function dense(poly: XY[], max = 600): XY[] {
  const out: XY[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / max));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}
// The heading that turns an item's front (-X) toward world direction (dx, dy), and the one that
// turns its +X (a bridge's or a stair's run) along it.
export const towards = (dx: number, dy: number): number => (Math.atan2(-dy, -dx) * 180) / Math.PI;
export const runAlong = (dx: number, dy: number): number => (Math.atan2(dy, dx) * 180) / Math.PI;
// A ramp from the middle of a plateau's edge a -> b, `len` out from it on the side away from
// `inside` (a point on the plateau).
export function rampOff(a: XY, b: XY, inside: XY, len: number, width: number, straight = false): { top: XY; bottom: XY; width: number; straight?: boolean } {
  const top: XY = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
  if (nx * (inside[0] - top[0]) + ny * (inside[1] - top[1]) > 0) [nx, ny] = [-nx, -ny];
  return { top, bottom: [top[0] + nx * len, top[1] + ny * len], width, ...(straight ? { straight } : {}) };
}
// A point `d` beyond b on the line from a.
export const beyond = (a: XY, b: XY, d: number): XY => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [b[0] + ((b[0] - a[0]) / L) * d, b[1] + ((b[1] - a[1]) / L) * d];
};
// A flat sheet over a polygon at height z (water following a stream's own course, so it never
// shows in a hollow beside it), as a mesh in the ground's terms (Y up), its texture in metres.
export function sheet(poly: XY[], z: number, mat: string): THREE.Mesh {
  const geo = new THREE.ShapeGeometry(new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x, y))));
  const P = geo.getAttribute("position"), uv = new Float32Array(P.count * 2);
  for (let i = 0; i < P.count; i++) {
    uv[i * 2] = P.getX(i) / 300;
    uv[i * 2 + 1] = P.getY(i) / 300;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, z, 0, -1, 0, 0, 0, 0, 0, 1));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material(mat));
  m.receiveShadow = true;
  return m;
}
