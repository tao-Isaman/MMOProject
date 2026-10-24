// ป่าดึกดำบรรพ์และป่าศักดิ์สิทธิ์ (oldgrowth): the oldest woods of the west and the south, for
// four fields. The primeval forest north of the western pass (ป่าดึกดำบรรพ์): cycads taller than
// a house, beds of ferns, mossy giants bigger than the ancient forest's with moss hanging off them
// in curtains, fallen trunks and rotted stumps, the three-toed tracks of something enormous pressed
// into the mud, a nest of great speckled eggs, the skeleton of a long-necked giant turned to stone,
// and a waterfall pouring off the sea cliffs into the western sea. The sunken temple woods by the
// sea south of the lagoon (ป่าวิหารจม): banyans on pillars of their own aerial roots, an old
// sanctuary tower that a banyan has swallowed, a great stone face gripped by roots, the pillars of
// a flooded court, a stone barge with a naga prow stranded in the shallows, glowing mushrooms, an
// arch of roots to walk under. The sacred banyan woods west of Yodia (ป่าไทรศักดิ์สิทธิ์), where
// the first kings were mourned: the sacred banyan wound in silk and hung with cloths, offerings at
// its foot, brick chedis the roots are swallowing, white elephants in gold, floating lanterns.
// And the first tree (ป่าต้นไม้แรก): the first tree of the world, its bark and leaves glowing gold
// and its roots arching out over the ground so high one walks beneath them, golden mist in the
// hollows and fireflies by the thousand.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front facing -X.
// The leaves and fronds are cards that sway in the shared wind (src/world3d/trees.ts). Mist and
// fireflies are see-through and cast no shadow. The sea falls, the flooded pillars, the stone
// barge and the floating lanterns have their z = 0 at the water's surface (a field sets them down
// to the water sheet).

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds,
  cylinderBetween, cylinderAt, sphereCenter, rock, toThree, noise3,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial, material } from "../textures";
import type { Recipe } from "../textures";
import { limb, along, foliage, crownLobes, LeafCards, frond, lump } from "../trees";
import type { CanopyLook, FoliageSpec, Lobe } from "../trees";
import { fallenTrunk, stumpOf, coverTop, endGrain, SOIL } from "../nature";
import type { Kit, Put } from "./types";

// ---------- materials ----------
const MATS: Record<string, Recipe> = {
  // the primeval forest
  Oldgrowth_Bark: { map: "bark", tint: "#6c5d48", bump: 3.5 },
  Oldgrowth_BarkPale: { map: "bark", tint: "#968b76", bump: 3 },       // banyan grey
  Oldgrowth_Root: { map: "bark", tint: "#827763", bump: 3 },
  Oldgrowth_Moss: { map: "felt", tint: "#5c8a32", rough: 1, bump: 1.5 },
  Oldgrowth_MossDeep: { map: "felt", tint: "#41692a", rough: 1, bump: 1.5 },
  Oldgrowth_MossThick: { map: "foliage", tint: "#6b9b3b", rough: 1, bump: 2 },
  Oldgrowth_Beard: { map: "felt", tint: "#94a86c", rough: 1 },          // moss hanging in curtains
  Oldgrowth_Canopy: { map: "foliage", tint: "#447a36", rough: 0.95, bump: 1.5 },
  Oldgrowth_CycadBark: { map: "palmBark", tint: "#8a7451", bump: 3 },   // the bases of fallen fronds
  Oldgrowth_CycadScale: { map: "bark", tint: "#a48c5c", bump: 2 },
  Oldgrowth_Cone: { map: "ribs", tint: "#c8922e", rough: 0.7 },
  Oldgrowth_Rock: { map: "crag", tint: "#8c907c", bump: 4 },
  Oldgrowth_RockDark: { map: "crag", tint: "#686d5f", bump: 4 },
  Oldgrowth_Mud: { map: "felt", tint: "#5f4b36", rough: 1, bump: 1.5 },
  Oldgrowth_MudWet: { tint: "#46574a", rough: 0.1 },                    // rainwater standing in the prints
  Oldgrowth_Twig: { map: "bark", tint: "#7a6244", bump: 2 },
  Oldgrowth_Straw: { map: "thatch", tint: "#9c8152", bump: 1.5 },
  Oldgrowth_Egg: { map: "plaster", tint: "#ece2c8", rough: 0.6 },
  Oldgrowth_EggSpot: { tint: "#7a5a3a", rough: 0.8 },
  Oldgrowth_EggInner: { tint: "#d6c39a", rough: 0.9 },
  Oldgrowth_Fossil: { map: "stone", tint: "#cfc09e", bump: 2.5 },       // bone turned to stone
  Oldgrowth_FossilDark: { map: "stone", tint: "#9d8d6e", bump: 2.5 },
  Oldgrowth_Matrix: { map: "crag", tint: "#a39985", bump: 4 },          // the rock bed it lies in
  Oldgrowth_Falls: { tint: "#d4ecf0", rough: 0.15, opacity: 0.84, glow: "#6f8f99", glowI: 0.25 },
  Oldgrowth_Foam: { tint: "#f4fbff", rough: 0.6, glow: "#9fb4bc", glowI: 0.3 },
  Oldgrowth_Stream: { tint: "#5a8c86", rough: 0.07, opacity: 0.9 },
  Oldgrowth_Sea: { tint: "#2b6582", rough: 0.08, opacity: 0.92 },
  Oldgrowth_CliffMoss: { map: "crag", tint: "#7f8b6c", bump: 4 },      // the fields' cliffs
  Oldgrowth_CliffTemple: { map: "crag", tint: "#8c8a74", bump: 4 },
  // the sunken temple
  Oldgrowth_Temple: { map: "sandstone", tint: "#a6a189", bump: 2 },
  Oldgrowth_TempleDark: { map: "sandstone", tint: "#7c7965", bump: 2 },
  Oldgrowth_Laterite: { map: "stone", tint: "#9a6f54", bump: 2.5 },
  Oldgrowth_Carved: { map: "marble", tint: "#bcb494", rough: 0.75 },
  Oldgrowth_Shadow: { tint: "#191a14", rough: 1 },
  Oldgrowth_Brackish: { tint: "#4a6954", rough: 0.08, opacity: 0.9 },
  Oldgrowth_GlowCap: { tint: "#8ef7d2", rough: 0.4, glow: "#2be0a8", glowI: 1.5 },
  Oldgrowth_GlowCapBlue: { tint: "#9fd8ff", rough: 0.4, glow: "#3f9cff", glowI: 1.4 },
  Oldgrowth_GlowGill: { tint: "#e0fff2", rough: 0.6, glow: "#7cf0c8", glowI: 0.9 },
  Oldgrowth_GlowStem: { map: "felt", tint: "#e2eedc", rough: 0.8, glow: "#7fd8bf", glowI: 0.35 },
  Oldgrowth_Spore: { tint: "#c8fff0", rough: 1, glow: "#7dffd8", glowI: 2 },
  // the sacred banyan
  Oldgrowth_WhiteStone: { map: "marble", tint: "#f0ebde", rough: 0.6 },
  Oldgrowth_Plinth: { map: "stone", tint: "#b6b09e", bump: 2 },
  Oldgrowth_Brick: { map: "brick", tint: "#a07e66", bump: 1.8 },
  Oldgrowth_BrickDark: { map: "brick", tint: "#7a6050", bump: 1.8 },
  Oldgrowth_Stucco: { map: "plaster", tint: "#cdc4ae", bump: 1 },
  Oldgrowth_SilkPink: { map: "fabric", tint: "#e98aa9", rough: 0.9 },
  Oldgrowth_SilkSaffron: { map: "fabric", tint: "#f0a23a", rough: 0.9 },
  Oldgrowth_SilkGreen: { map: "fabric", tint: "#4fa36a", rough: 0.9 },
  Oldgrowth_Marigold: { map: "felt", tint: "#f2a21e", rough: 0.9 },
  Oldgrowth_Jasmine: { map: "felt", tint: "#f7f3e6", rough: 0.9 },
  Oldgrowth_BananaLeaf: { map: "felt", tint: "#4f8f36", rough: 0.6 },
  Oldgrowth_Petal: { map: "felt", tint: "#f2bfd0", rough: 0.6 },
  Oldgrowth_RedDrink: { tint: "#d8202a", rough: 0.15 },
  Oldgrowth_Flame: { tint: "#ffd27a", rough: 1, glow: "#ffae3a", glowI: 2.2 },
  Oldgrowth_Gold: { map: "metal", tint: "#f2c24a", rough: 0.45, metal: 0.25, glow: "#4a3000", glowI: 0.3 },
  Oldgrowth_Candle: { tint: "#f4ecd4", rough: 0.7, glow: "#ffcf80", glowI: 0.3 },
  // the first tree
  Oldgrowth_GoldBark: { map: "bark", tint: "#b39554", bump: 3, glow: "#5a3c0c", glowI: 0.55 },
  Oldgrowth_GoldVein: { tint: "#ffd27a", rough: 0.5, glow: "#ff9e1f", glowI: 1.5 },
  Oldgrowth_GoldCore: { map: "foliage", tint: "#e9b84a", rough: 0.9, bump: 1.5, glow: "#d08a10", glowI: 0.75 },
  Oldgrowth_Firefly: { tint: "#fff3a6", rough: 1, glow: "#ffd23f", glowI: 3 },
};
for (const [name, recipe] of Object.entries(MATS)) defineMaterial(name, recipe);
const WOOD_END = endGrain("#a98962");

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
// A solid of revolution about Z through a profile of (radius, z), at `at`.
function lathe(prof: XZ[], seg: number, mat: string, at: V3 = [0, 0, 0]): Geo {
  const geo = new THREE.LatheGeometry(prof.map(([r, z]) => new THREE.Vector2(Math.max(0.01, r), z)), seg).rotateX(Math.PI / 2);
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2, uv.getY(i));
  geo.translate(...at);
  return [{ geo, mat }];
}
// meshes of a Geo plus the leaf or frond meshes
function group(geo: Geo, ...extra: (THREE.Object3D | null)[]): THREE.Group {
  const g = toThree(geo, material);
  for (const e of extra) if (e) g.add(e);
  return g;
}
// nothing in it casts or takes a shadow (mist, fireflies, glows)
function noShadow<T extends THREE.Object3D>(o: T): T {
  o.traverse((c) => {
    c.castShadow = false;
    c.receiveShadow = false;
  });
  return o;
}
// leafy crowns: each a big lobe and smaller ones round its skin, leafy cores inside, the cards
// one swaying mesh (glowing, for the first tree, when `glow` is given)
function canopy(crowns: Lobe[], leaf: number, seed: number, look: CanopyLook, o: Partial<FoliageSpec> = {}, n = 4, glow?: [string, number]): { core: Geo; mesh: THREE.Mesh | null } {
  const cards = new LeafCards();
  const { lobes, details } = crownLobes(crowns, seeded(seed), n);
  const core = foliage({ seed, lobes, details, leaf, look, ...o }, cards);
  const mesh = cards.count ? cards.mesh(look.card) : null;
  if (mesh && glow) glowCards(mesh, glow[0], glow[1]);
  return { core, mesh };
}
// a card mesh's material made to glow (its own copy, keeping the shared sway)
function glowCards(mesh: THREE.Mesh, colour: string, k: number): void {
  const base = mesh.material as THREE.MeshStandardMaterial, m = base.clone();
  m.onBeforeCompile = base.onBeforeCompile;
  m.emissive = new THREE.Color(colour);
  m.emissiveIntensity = k;
  m.emissiveMap = base.map;
  mesh.material = m;
}
// fern clumps: fronds arching out of a point
function ferns(list: { at: V3; n: number; len: number; seed: number; dark?: number }[]): THREE.Mesh | null {
  const cards = new LeafCards();
  for (const f of list) {
    const rnd = seeded(f.seed), dk = f.dark ?? 1;
    for (let k = 0; k < f.n; k++) {
      const shade = (0.8 + rnd() * 0.3) * dk;
      frond(cards, {
        at: f.at, yaw: (k / f.n) * Math.PI * 2 + rnd() * 0.5, lift: 0.7 + rnd() * 0.4, droop: 1.3 + rnd() * 0.5,
        len: f.len * (0.75 + rnd() * 0.4), w: f.len * 0.2, fold: 0.42, segs: 5,
        base: lin(34 * shade, 84 * shade, 36 * shade), tip: lin(116 * shade, 172 * shade, 72 * shade), twist: (rnd() - 0.5) * 0.4,
      });
    }
  }
  return cards.count ? cards.mesh("frond") : null;
}
// a mushroom: a stem leaning by `lean`, a cap (a dome, or a tall bell when `bell`) with gills
function shroom(at: V3, h: number, cap: number, lean: [number, number], mat: string, seed: number, bell = false): Geo {
  const rnd = seeded(seed), top: V3 = [at[0] + lean[0], at[1] + lean[1], at[2] + h];
  const stem = limb([at, [at[0] + lean[0] * 0.35, at[1] + lean[1] * 0.35, at[2] + h * 0.5], top], cap * (bell ? 0.18 : 0.24), cap * (bell ? 0.12 : 0.17), "Oldgrowth_GlowStem", { seg: 7, maxRings: 5, flare: 0.35 });
  const dome = bell ? 1.1 + rnd() * 0.4 : 0.45 + rnd() * 0.25;
  const prof: XZ[] = bell
    ? [[0, cap * dome], [cap * 0.25, cap * dome * 0.95], [cap * 0.55, cap * dome * 0.65], [cap * 0.85, cap * 0.25], [cap, -cap * 0.05], [cap * 0.95, -cap * 0.1]]
    : [[0, cap * dome], [cap * 0.45, cap * dome * 0.92], [cap * 0.8, cap * dome * 0.6], [cap, cap * 0.12], [cap * 0.94, -cap * 0.02]];
  const capG = lathe(prof, 12, mat, [top[0], top[1], top[2] - cap * 0.1]);
  const gill = lathe([[cap * 0.94, -cap * 0.05], [cap * 0.5, cap * 0.02], [cap * 0.2, cap * 0.06]], 12, "Oldgrowth_GlowGill", [top[0], top[1], top[2] - cap * 0.1]);
  return merge(stem, capG, gill);
}
// a mossy rock: the stone with moss over its top
function mossRock(size: V3, seed: number, at: V3, amount = 0.6, mat = "Oldgrowth_Rock", flat = false): Geo {
  const r = translate(rock(size, 0.45, seed, mat, flat), at);
  return merge(r, coverTop(r, "Oldgrowth_Moss", { amount, thick: 3, seed, patches: 0.85 }));
}
// a sheet of falling water: a profile of (x, z) from the lip down, across from y0 to y1 in `cols`
// columns, rippling a little (its own seed)
function fallSheet(prof: XZ[], y0: number, y1: number, cols: number, mat: string, seed: number, wob = 5): Geo {
  const pos: number[] = [], idx: number[] = [], rows = prof.length;
  for (let i = 0; i < rows; i++)
    for (let j = 0; j <= cols; j++) {
      const y = y0 + ((y1 - y0) * j) / cols, w = (noise3(j * 0.7, i * 0.5, 0, seed) - 0.5) * 2 * wob * (i / rows + 0.3);
      pos.push(prof[i][0] + w, y, prof[i][1]);
    }
  for (let i = 0; i + 1 < rows; i++)
    for (let j = 0; j < cols; j++) {
      const a = i * (cols + 1) + j, b = a + 1, c = a + cols + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  const flat = geo.toNonIndexed();
  flat.computeVertexNormals();
  // both faces: a second copy turned round
  const back = flat.clone(), bp = back.getAttribute("position");
  for (let i = 0; i < bp.count; i += 3) {
    const x = bp.getX(i + 1), y = bp.getY(i + 1), z = bp.getZ(i + 1);
    bp.setXYZ(i + 1, bp.getX(i + 2), bp.getY(i + 2), bp.getZ(i + 2));
    bp.setXYZ(i + 2, x, y, z);
  }
  back.computeVertexNormals();
  return [{ geo: flat, mat }, { geo: back, mat }];
}
// a soft see-through puff material (mist, spray), and a glow (a halo on water)
function mistMat(colour: string, glow: string, glowI: number, opacity: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: colour, transparent: true, opacity, roughness: 1, depthWrite: false, emissive: new THREE.Color(glow), emissiveIntensity: glowI });
}
let haloTex: THREE.CanvasTexture | null = null;
function haloMat(colour: string, opacity: number): THREE.MeshBasicMaterial {
  if (!haloTex) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const x = c.getContext("2d")!, gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.35, "rgba(255,255,255,0.45)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = gr;
    x.fillRect(0, 0, 64, 64);
    haloTex = new THREE.CanvasTexture(c);
  }
  return new THREE.MeshBasicMaterial({ color: colour, map: haloTex, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
}
// puffs of a see-through material as one group (no shadows)
function puffs(list: { r: V3; c: V3 }[], mat: THREE.Material, seg = 10): THREE.Group {
  return noShadow(toThree(merge(...list.map((p) => ellipsoid(p.r, p.c, "puff", seg))), () => mat));
}
// A root draped over a stepped square mass: from `start` on the trunk out along bearing `a`,
// down over each step (half-width, top, bottom) just clear of its face, and out over the ground.
function drape(start: V3, a: number, steps: [number, number, number][], out: number, seed: number): V3[] {
  const rnd = seeded(seed), c = Math.cos(a), s = Math.sin(a), k = 1 / Math.max(Math.abs(c), Math.abs(s));
  const pts: V3[] = [start];
  for (const [half, top, bottom] of steps) {
    const d = half * k + 8 + rnd() * 6;
    pts.push([c * d, s * d, top + 4], [c * (d + 2), s * (d + 2), (top + bottom) / 2]);
  }
  const last = steps[steps.length - 1][0] * k;
  pts.push([c * (last + out * 0.45), s * (last + out * 0.45), 4], [c * (last + out), s * (last + out), -14]);
  return pts;
}

// ---------- the canopies' colours ----------
const PRIMEVAL: CanopyLook = { card: "canopy", dark: [30, 66, 32], mid: [60, 112, 48], light: [124, 168, 70], core: "Oldgrowth_Canopy" };
const BANYAN: CanopyLook = { card: "glossy", dark: [28, 72, 34], mid: [56, 112, 48], light: [114, 164, 68], core: "CanopyCoreDeep" };
const GOLD: CanopyLook = { card: "canopy", dark: [170, 112, 28], mid: [226, 172, 58], light: [255, 226, 118], core: "Oldgrowth_GoldCore", boost: 1.35 };

// =================================== the primeval forest ===================================

// A giant cycad (7 m): a thick trunk clad in the diamond-shaped bases of its fallen fronds,
// forked into two heads; each head a ring of long stiff fronds arching out round a golden cone,
// young ones standing up in the middle, the old ones under them hanging dead and brown.
function cycad(): THREE.Group {
  const rnd = seeded(31), g: Geo[] = [], cards = new LeafCards();
  g.push(limb([[0, 0, -20], [8, -6, 170], [20, -12, 360], [26, -10, 470]], 60, 44, "Oldgrowth_CycadBark", { seg: 12, flare: 0.35, roots: 6, gnarl: 0.4, seed: 31, step: 55, maxRings: 12 }));
  g.push(limb([[12, -6, 220], [56, 34, 286], [96, 82, 346], [104, 96, 392]], 36, 30, "Oldgrowth_CycadBark", { seg: 10, gnarl: 0.3, seed: 32, step: 45, maxRings: 8 }));
  const heads: { at: V3; r: number; n: number; len: number }[] = [{ at: [26, -10, 470], r: 44, n: 22, len: 330 }, { at: [104, 96, 392], r: 30, n: 16, len: 250 }];
  for (const h of heads) {
    const [x, y, z] = h.at;
    // the collar of scales the fronds rise from, the cone in their middle
    g.push(lathe([[h.r * 0.95, -14], [h.r * 1.3, 4], [h.r * 1.2, 22], [h.r * 0.8, 34], [h.r * 0.4, 40]], 12, "Oldgrowth_CycadScale", h.at));
    const cr = h.r * 0.55;
    g.push(lathe([[0, 20], [cr * 0.8, 26], [cr, 52], [cr * 0.92, 88], [cr * 0.6, 116], [0, 132]], 12, "Oldgrowth_Cone", h.at));
    for (let k = 0; k < h.n; k++) {
      const yaw = (k / h.n) * Math.PI * 2 + rnd() * 0.3, sh = 0.85 + rnd() * 0.25;
      frond(cards, {
        at: [x + Math.cos(yaw) * h.r * 0.8, y + Math.sin(yaw) * h.r * 0.8, z + 26], yaw, lift: 1.0 + rnd() * 0.35, droop: 0.95 + rnd() * 0.4,
        len: h.len * (0.82 + rnd() * 0.3), w: h.len * 0.13, fold: 0.3, segs: 7, base: lin(38 * sh, 80 * sh, 32 * sh), tip: lin(92 * sh, 140 * sh, 54 * sh), twist: (rnd() - 0.5) * 0.3,
      });
    }
    for (let k = 0; k < 5; k++)
      frond(cards, { at: [x, y, z + 50], yaw: rnd() * Math.PI * 2, lift: 1.35, droop: 0.45, len: h.len * 0.5, w: h.len * 0.09, fold: 0.5, segs: 5, base: lin(84, 150, 60), tip: lin(160, 204, 96) });
    for (let k = 0; k < 7; k++) {
      const yaw = (k / 7) * Math.PI * 2 + rnd();
      frond(cards, { at: [x + Math.cos(yaw) * h.r, y + Math.sin(yaw) * h.r, z + 4], yaw, lift: -0.25, droop: 0.9, len: h.len * 0.62, w: h.len * 0.1, fold: 0.6, segs: 5, base: lin(118, 92, 52), tip: lin(146, 116, 64) });
    }
  }
  for (let i = 0; i < 3; i++) g.push(mossRock([70 + i * 14, 56, 40], 33 + i, polar(i * 2.2 + 0.5, 120, 0), 0.5));
  return group(merge(...g), cards.mesh("frond"), ferns([{ at: [-90, 60, 0], n: 7, len: 90, seed: 36 }, { at: [80, -100, 0], n: 6, len: 80, seed: 37 }]));
}

// A bed of ferns (5 x 4 m): clumps of every size over a cushion of moss, two tree ferns on short
// scaly trunks standing over them, a mossy stone.
function fernBed(): THREE.Group {
  const rnd = seeded(41), g: Geo[] = [lump([0, 0, -32], [250, 190, 42], 41, "Oldgrowth_MossDeep", 1, 0.18)];
  const list: { at: V3; n: number; len: number; seed: number; dark?: number }[] = [];
  for (let i = 0; i < 11; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd());
    list.push({ at: [Math.cos(a) * d * 230, Math.sin(a) * d * 170, 6], n: 6 + Math.floor(rnd() * 4), len: 80 + rnd() * 90, seed: 410 + i, dark: 0.85 + rnd() * 0.3 });
  }
  for (const [x, y, h, seed] of [[-110, 70, 170, 42], [130, -50, 120, 43]] as const) {
    g.push(limb([[x, y, -5], [x + 6, y - 4, h * 0.5], [x + 12, y, h]], 15, 11, "Oldgrowth_CycadBark", { seg: 8, flare: 0.4, roots: 4, seed, maxRings: 5 }));
    list.push({ at: [x + 12, y, h], n: 12, len: 170, seed: seed + 400 });
  }
  g.push(mossRock([80, 64, 46], 44, [60, 120, 0]));
  return group(merge(...g), ferns(list));
}

// A colossal tree (the primeval forest's mossy giant, or the first tree in gold): a trunk several
// metres through on plank buttresses that run out into roots over the ground, massive limbs from
// the fork with a side branch each, a cumulus of crowns far overhead; moss on the upper faces of
// everything, moss hanging from the limbs in curtains, ferns growing in the crooks.
interface GiantSpec {
  seed: number; r: number; fork: number; lean: [number, number]; limbs: number; reach: number; crown: number; leaf: number;
  bark: string; moss: string; mossAmount: number; beard: number; beardMat: string; look: CanopyLook; epiphytes: boolean; glow?: [string, number];
}
function giantTree(s: GiantSpec): { wood: Geo; extra: Geo; core: Geo; mesh: THREE.Mesh | null; fern: THREE.Mesh | null } {
  const rnd = seeded(s.seed), wood: Geo[] = [], extra: Geo[] = [], crowns: Lobe[] = [], epi: { at: V3; n: number; len: number; seed: number }[] = [];
  const F: V3 = [s.lean[0], s.lean[1], s.fork];
  wood.push(limb([[0, 0, -30], [F[0] * 0.12, F[1] * 0.12, s.fork * 0.3], [F[0] * 0.55, F[1] * 0.55, s.fork * 0.7], F, [F[0] * 1.1, F[1] * 1.1, s.fork + 340]],
    s.r, s.r * 0.5, s.bark, { seg: 16, flare: 0.55, roots: 9, gnarl: 1, seed: s.seed, step: 100, maxRings: 20, taper: 0.7 }));
  // the buttresses, each running on into a root over the ground
  const nb = 8;
  for (let i = 0; i < nb; i++) {
    const a = ((i + rnd() * 0.5) / nb) * Math.PI * 2;
    const L = s.r * (1.5 + rnd() * 0.8), H = s.r * (1.6 + rnd() * 0.8), t = s.r * 0.22;
    const prof: XZ[] = [[0, -15], [0, H], [L * 0.1, H * 0.8], [L * 0.26, H * 0.47], [L * 0.5, H * 0.21], [L * 0.78, H * 0.07], [L, -15]];
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
    wood.push(limb([polar(a, ex - 60, 18), polar(a + bend * 0.2, ex + 90, 8), polar(a + bend * 0.6, ex + 200 + rnd() * 90, -2), polar(a + bend, ex + 300 + rnd() * 120, -12)],
      t * 0.66, t * 0.2, s.bark, { seg: 7, maxRings: 7, gnarl: 0.8, seed: s.seed + 20 + i }));
  }
  // the limbs from the fork, a side branch on each, and their crowns
  for (let k = 0; k < s.limbs; k++) {
    const a = ((k + rnd() * 0.4) / s.limbs) * Math.PI * 2 + 0.3, R = s.reach * (0.78 + rnd() * 0.35);
    const z0 = s.fork - 60 - rnd() * 220;
    const base: V3 = [F[0] + Math.cos(a) * s.r * 0.2, F[1] + Math.sin(a) * s.r * 0.2, z0];
    const tip: V3 = [F[0] + Math.cos(a) * R, F[1] + Math.sin(a) * R, s.crown + (rnd() - 0.5) * 160];
    const mid: V3 = [F[0] + Math.cos(a + 0.14) * R * 0.45, F[1] + Math.sin(a + 0.14) * R * 0.45, z0 + (tip[2] - z0) * 0.4 + 80];
    const pts = [base, mid, tip];
    wood.push(limb(pts, s.r * 0.36, s.r * 0.1, s.bark, { seg: 10, gnarl: 0.7, step: 80, maxRings: 10, seed: s.seed + 40 + k }));
    crowns.push([tip[0], tip[1], tip[2] + 120, s.reach * 0.48 + rnd() * 120, s.reach * 0.46 + rnd() * 120, s.reach * 0.17 + rnd() * 40]);
    const sp = along(pts, 0.55), sa = a + (rnd() < 0.5 ? -1 : 1) * (0.65 + rnd() * 0.3), sr = R * 0.5;
    const stip: V3 = [sp[0] + Math.cos(sa) * sr, sp[1] + Math.sin(sa) * sr, Math.max(sp[2] + 120, s.crown - 140 + rnd() * 120)];
    wood.push(limb([sp, [(sp[0] + stip[0]) / 2, (sp[1] + stip[1]) / 2, (sp[2] + stip[2]) / 2 + 40], stip], s.r * 0.15, s.r * 0.05, s.bark, { seg: 7, maxRings: 6, gnarl: 0.5, seed: s.seed + 80 + k }));
    crowns.push([stip[0], stip[1], stip[2] + 70, s.reach * 0.33 + rnd() * 60, s.reach * 0.32 + rnd() * 60, s.reach * 0.13]);
    // moss hanging in curtains under the limb, ferns in its crook
    for (let j = 0; j < s.beard; j++) {
      const p = along(pts, 0.2 + (j / s.beard) * 0.7 + rnd() * 0.04), L = 120 + rnd() * 260, rr = s.r * (0.32 - 0.2 * (j / s.beard));
      extra.push(cylinderAt({ rBot: 1.5, rTop: 8 + rnd() * 6, height: L, segments: 5, bottom: [p[0] + (rnd() - 0.5) * 26, p[1] + (rnd() - 0.5) * 26, p[2] - rr - L + 8] }, s.beardMat));
    }
    if (s.epiphytes) epi.push({ at: [mid[0], mid[1], mid[2] + s.r * 0.3], n: 7, len: 110, seed: s.seed + 140 + k });
  }
  crowns.push([F[0] * 1.15, F[1] * 1.15, s.crown + 300, s.reach * 0.66, s.reach * 0.62, s.reach * 0.22]);
  const moss = coverTop(wood.flat().filter((p) => p.mat === s.bark), s.moss, { amount: s.mossAmount, thick: 4, seed: s.seed + 3, grain: 60, ragged: 0.45, patches: 0.85 });
  const can = canopy(crowns, s.leaf, s.seed + 5, s.look, { density: 0.95, ragged: 0.6, sun: -0.05 }, 4, s.glow);
  for (let i = 0; i < 4; i++) epi.push({ at: polar(i * 1.7 + 0.4, s.r * 1.3, 0), n: 8, len: 120, seed: s.seed + 100 + i });
  return { wood: merge(...wood, moss), extra: merge(...extra), core: can.core, mesh: can.mesh, fern: ferns(epi) };
}
function mossGiant(): THREE.Group {
  const t = giantTree({
    seed: 21, r: 240, fork: 1050, lean: [60, -40], limbs: 6, reach: 760, crown: 1600, leaf: 130, bark: "Oldgrowth_Bark", moss: "Oldgrowth_MossThick", mossAmount: 0.5,
    beard: 7, beardMat: "Oldgrowth_Beard", look: PRIMEVAL, epiphytes: true,
  });
  return group(merge(t.wood, t.extra, t.core), t.mesh, t.fern);
}

// Mossy boulders (4.5 m): a heap of big rounded stones furred with moss, ferns in the gaps.
function mossBoulders(): THREE.Group {
  const g: Geo[] = [];
  for (const [x, y, sx, sy, sz, seed] of [[0, 0, 230, 190, 170, 101], [150, 130, 150, 130, 110, 102], [-160, 90, 120, 110, 80, 103], [110, -170, 130, 110, 90, 104], [-120, -150, 80, 70, 50, 105]] as const)
    g.push(translate(rock([sx, sy, sz], 0.45, seed, "Oldgrowth_Rock"), [x, y, -12]), coverTop(translate(rock([sx, sy, sz], 0.45, seed, "Oldgrowth_Rock"), [x, y, -12]), "Oldgrowth_MossDeep", { amount: 0.42, thick: 3, seed, patches: 0.6 }));
  return group(merge(...g), ferns([{ at: [-200, 0, 0], n: 7, len: 100, seed: 106 }, { at: [30, 200, 0], n: 6, len: 90, seed: 107 }, { at: [220, -60, 0], n: 6, len: 80, seed: 108 }]));
}

// Mossy slabs (4 m): flat stones lying in the moss, low enough to step over.
function mossSlabs(): Geo {
  const g: Geo[] = [];
  for (const [x, y, sx, sy, sz, seed] of [[-40, 20, 220, 170, 34, 112], [140, -90, 130, 110, 26, 113], [-150, -110, 110, 90, 22, 114], [120, 120, 90, 70, 20, 115], [-170, 130, 70, 60, 16, 116]] as const)
    g.push(mossRock([sx, sy, sz], seed, [x, y, -6], 0.45, "Oldgrowth_Rock", true));
  return merge(...g);
}

// A fallen giant (16 m): a mossy trunk two and a half metres through lying where it fell, its root
// plate torn up on edge at one end and its top snapped off at the other, glowing brackets along
// its side, ferns and a sapling growing out of its back.
function fallenMossGiant(): THREE.Group {
  const trunk = fallenTrunk({ seed: 51, len: 1500, r: 125, bark: "Oldgrowth_Bark", wood: WOOD_END, roots: { soil: SOIL, cover: "Oldgrowth_Moss" }, broken: true, stubs: 4, moss: "Oldgrowth_MossThick", mossAmount: 0.7, fungus: "Oldgrowth_GlowCap", bow: 60 });
  const g: Geo[] = [trunk];
  g.push(limb([[-10, 260, 230], [0, 270, 300], [12, 262, 370]], 6, 3, "Oldgrowth_Bark", { seg: 5, maxRings: 3 }));
  const sap = canopy([[12, 262, 400, 70, 66, 50]], 34, 52, PRIMEVAL, { density: 1 });
  for (const [x, y, h, c, i] of [[-140, -80, 40, 18, 0], [-150, -40, 28, 12, 1], [150, 420, 36, 16, 2]]) g.push(shroom([x, y, 0], h, c, [0, 0], i % 2 ? "Oldgrowth_GlowCapBlue" : "Oldgrowth_GlowCap", 53 + i));
  const fern = ferns([{ at: [-170, 200, 0], n: 7, len: 100, seed: 54 }, { at: [170, -300, 0], n: 6, len: 90, seed: 55 }, { at: [0, -100, 240], n: 5, len: 70, seed: 56 }, { at: [160, 560, 0], n: 6, len: 90, seed: 57 }]);
  const all = merge(...g, sap.core), b = new THREE.Box3();
  for (const p of all) {
    p.geo.computeBoundingBox();
    b.union(p.geo.boundingBox!);
  }
  const cx = (b.min.x + b.max.x) / 2, cy = (b.min.y + b.max.y) / 2;
  for (const m of [sap.mesh, fern]) m?.position.set(-cx, 0, cy);
  return group(translate(all, [-cx, -cy, 0]), sap.mesh, fern);
}

// A giant's stump (5 m across its roots, 3 m tall): the jagged top of a trunk three metres through
// that broke off long ago, rotted and mossy, a sapling rooted in its top, glowing caps round its foot.
function giantStump(): THREE.Group {
  const g: Geo[] = [stumpOf({ seed: 61, r: 160, h: 290, bark: "Oldgrowth_Bark", wood: WOOD_END, broken: true, roots: 7, moss: "Oldgrowth_MossThick", mossAmount: 0.6 })];
  g.push(limb([[20, 10, 250], [26, 6, 340], [16, 12, 430]], 8, 3, "Oldgrowth_Bark", { seg: 5, maxRings: 4 }));
  const sap = canopy([[16, 12, 470, 90, 84, 62]], 38, 62, PRIMEVAL, { density: 1 });
  for (const [x, y, h, c, i] of [[-200, 40, 44, 20, 0], [-180, 90, 30, 13, 1], [150, -190, 38, 17, 2], [190, 150, 24, 11, 3]]) g.push(shroom([x, y, 0], h, c, [4, 2], i % 2 ? "Oldgrowth_GlowCapBlue" : "Oldgrowth_GlowCap", 63 + i));
  return group(merge(...g, sap.core), sap.mesh, ferns([{ at: [-230, -120, 0], n: 7, len: 100, seed: 67 }, { at: [220, 40, 0], n: 6, len: 90, seed: 68 }]));
}

// The tracks of something enormous (11 m): six three-toed prints a metre and a half long pressed
// into the mud one before the other along +Y, rainwater standing in them, ferns trodden flat beside
// them and a branch snapped under foot. Lies flat on the ground (no higher than 8 cm).
function dinoTracks(): THREE.Group {
  const rnd = seeded(71), g: Geo[] = [];
  // a pad pressed into the mud: its floor, the water standing in it, the rim squeezed up round it
  const pad = (x: number, y: number, rx: number, ry: number, a: number) => {
    const at = (geo: Geo) => translate(rotateZ(geo, a / D), [x, y, 0]);
    g.push(at(scale(cylinderAt({ radius: 1, height: 1.5, segments: 14, bottom: [0, 0, 0] }, "Oldgrowth_Mud"), [rx * 1.05, ry * 1.05, 1])));
    g.push(at(scale(cylinderAt({ radius: 1, height: 1, segments: 14, bottom: [0, 0, 1.5] }, "Oldgrowth_MudWet"), [rx * 0.86, ry * 0.86, 1])));
    g.push(at(scale(lathe([[0.82, 0], [0.95, 6], [1.08, 7], [1.3, 0]], 14, "Oldgrowth_Mud"), [rx, ry, 1])));
  };
  // a print, toes toward `a`
  const print = (x: number, y: number, a: number) => {
    const c = Math.cos(a), s = Math.sin(a);
    pad(x, y, 34, 30, a);
    for (const t of [-0.52, 0, 0.52]) {
      const ta = a + t, d = t === 0 ? 76 : 68;
      pad(x + Math.cos(ta) * d, y + Math.sin(ta) * d, 46, 15, ta);
      g.push(translate(rotateZ(rotateY(cylinderAt({ rBot: 7, rTop: 0.5, height: 22, segments: 4, bottom: [0, 0, 0] }, "Oldgrowth_MudWet"), 90), ta / D), [x + Math.cos(ta) * (d + 50), y + Math.sin(ta) * (d + 50), 2]));
    }
    // mud thrown up behind the heel
    g.push(translate(scale(sphereCenter(1, [0, 0, 0], "Oldgrowth_Mud", 8), [30, 40, 6]), [x - c * 50, y - s * 50, 0]));
  };
  for (let i = 0; i < 6; i++) print((i % 2 ? 1 : -1) * 48 + (rnd() - 0.5) * 16, -500 + i * 200, Math.PI / 2 + (i % 2 ? -0.12 : 0.12) + (rnd() - 0.5) * 0.1);
  // a branch snapped under foot, stones pushed aside
  g.push(limb([[-150, -180, 6], [-60, -120, 10], [30, -60, 8]], 9, 5, "Oldgrowth_Twig", { seg: 6, maxRings: 4, seed: 72 }));
  g.push(limb([[40, -40, 8], [110, 20, 6], [190, 30, 4]], 7, 3, "Oldgrowth_Twig", { seg: 5, maxRings: 4, seed: 73 }));
  for (const [x, y, sz, seed] of [[160, 300, 34, 74], [-170, 110, 28, 75], [150, -420, 40, 76]] as const) g.push(mossRock([sz * 1.3, sz, sz * 0.6], seed, [x, y, -4], 0.4));
  // ferns trodden flat beside the prints
  const cards = new LeafCards();
  for (let i = 0; i < 9; i++) {
    const y = -560 + rnd() * 1120, x = (rnd() < 0.5 ? -1 : 1) * (150 + rnd() * 90), sh = 0.8 + rnd() * 0.3;
    frond(cards, { at: [x, y, 3], yaw: rnd() * Math.PI * 2, lift: 0.05, droop: 0.1, len: 80 + rnd() * 50, w: 18, fold: 0.15, segs: 4, base: lin(48 * sh, 88 * sh, 40 * sh), tip: lin(110 * sh, 150 * sh, 66 * sh) });
  }
  return group(merge(...g), cards.mesh("frond"), ferns([{ at: [-200, 520, 0], n: 7, len: 90, seed: 77 }, { at: [210, -560, 0], n: 6, len: 80, seed: 78 }]));
}

// A nest of great eggs (4.5 m): a mound of earth ringed with sticks, straw and torn fern, six eggs
// half a metre long, cream speckled brown, in its hollow, and the broken shell of one that hatched.
function eggNest(): THREE.Group {
  const rnd = seeded(81), g: Geo[] = [];
  g.push(lump([0, 0, -40], [190, 175, 70], 81, "Oldgrowth_Mud", 1, 0.12));
  // the rim: a ring of heaped earth, sticks woven round it in layers, torn fern laid over it
  g.push(scale(lathe([[95, 0], [130, 30], [170, 58], [210, 60], [245, 32], [265, 0]], 20, "Oldgrowth_Mud"), [1, 0.94, 1]));
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, r = 140 + rnd() * 110, t = a + Math.PI / 2 + (rnd() - 0.5) * 0.7, L = 60 + rnd() * 100;
    const z = 40 + (1 - Math.abs(r - 195) / 60) * 26 + rnd() * 10;
    const c: V3 = [Math.cos(a) * r, Math.sin(a) * r * 0.94, z];
    g.push(cylinderBetween([c[0] - (Math.cos(t) * L) / 2, c[1] - (Math.sin(t) * L) / 2, c[2] - 6 + rnd() * 12], [c[0] + (Math.cos(t) * L) / 2, c[1] + (Math.sin(t) * L) / 2, c[2] - 6 + rnd() * 12], 2 + rnd() * 3, 5, i % 4 ? "Oldgrowth_Twig" : "Oldgrowth_Bark"));
  }
  const fronds = new LeafCards();
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rnd() * 0.3, sh = 0.7 + rnd() * 0.4, dry = i % 3 === 0;
    frond(fronds, { at: [Math.cos(a) * 120, Math.sin(a) * 112, 58], yaw: a + (rnd() - 0.5) * 0.6, lift: 0.25, droop: 0.6, len: 110 + rnd() * 50, w: 22, fold: 0.3, segs: 4, base: dry ? lin(120, 98, 56) : lin(48 * sh, 90 * sh, 40 * sh), tip: dry ? lin(150, 120, 70) : lin(110 * sh, 150 * sh, 66 * sh) });
  }
  // the eggs, speckled
  const eggs: [number, number, number, number][] = [[-50, -40, 10, 0], [40, -60, -14, 1], [70, 30, 8, 2], [-20, 50, -6, 3], [-80, 20, 16, 4], [10, -5, 0, 5]];
  for (const [x, y, tilt, i] of eggs) {
    const c: V3 = [x, y, 56 + (i === 5 ? 16 : 0)];
    const egg: Geo[] = [ellipsoid([30, 30, 44], [0, 0, 0], "Oldgrowth_Egg", 12)];
    for (let k = 0; k < 16; k++) {
      const z = (rnd() - 0.4) * 1.6, a = rnd() * Math.PI * 2, rr = Math.sqrt(Math.max(0, 1 - z * z * 0.39));
      egg.push(sphereCenter(2 + rnd() * 2.5, [Math.cos(a) * 30 * rr, Math.sin(a) * 30 * rr, z * 28], "Oldgrowth_EggSpot", 4));
    }
    g.push(translate(rotateY(rotateZ(merge(...egg), rnd() * 360), tilt), c));
  }
  // the hatched one: the lower half of its shell, jagged, the pieces of the top lying by it
  const shell: XZ[] = [[1, -44], [18, -38], [28, -18], [31, 4], [29, 14], [26, 4], [25, -16], [16, -34], [1, -38]];
  g.push(translate(rotateY(lathe(shell, 12, "Oldgrowth_Egg"), 12), [130, -110, 44]));
  g.push(translate(sphereCenter(23, [0, 0, 0], "Oldgrowth_EggInner", 8), [130, -110, 38]));
  for (let k = 0; k < 6; k++) g.push(translate(rotateY(rotateZ(box([22 + rnd() * 10, 16 + rnd() * 8, 2.5], [0, 0, 0], "Oldgrowth_Egg"), rnd() * 360), (rnd() - 0.5) * 50), [170 + rnd() * 70, -150 + rnd() * 100, 44 + rnd() * 10]));
  return group(merge(...g), fronds.mesh("frond"), ferns([{ at: [-250, 150, 0], n: 6, len: 90, seed: 95 }, { at: [230, 180, 0], n: 5, len: 80, seed: 96 }, { at: [-60, -280, 0], n: 5, len: 70, seed: 97 }]));
}

// The skeleton of a long-necked giant turned to stone (19 m): it lies belly down where it died,
// weathering out of a bed of rock; the spine runs from the tail's tip over the hips and the back
// (2.9 m up) to the neck, which arches up and comes down to the skull resting on the ground; its
// ribs arch out either side down into the rock like the beams of a hall, a few broken; the legs
// folded under it, moss on the bones and ferns growing up between the ribs.
function stoneSkeleton(): THREE.Group {
  const rnd = seeded(91), g: Geo[] = [], bones: Geo[] = [], B = "Oldgrowth_Fossil", BD = "Oldgrowth_FossilDark";
  g.push(translate(rock([1400, 640, 60], 0.35, 91, "Oldgrowth_Matrix", true), [0, -60, -14]));
  for (const [x, y, s, seed] of [[-200, 560, 130, 92], [190, -420, 110, 93], [-40, 760, 90, 94], [230, 300, 100, 95], [-250, -760, 120, 96], [200, -900, 80, 97]] as const)
    g.push(translate(rock([s * 1.5, s * 1.2, s * 0.55], 0.5, seed, "Oldgrowth_Matrix"), [x, y, -8]));
  const SPINE: V3[] = [[40, 860, 30], [24, 660, 92], [0, 430, 200], [0, 230, 280], [0, 0, 292], [-10, -230, 266], [-20, -420, 252], [-60, -600, 330], [-120, -770, 342], [-180, -900, 236], [-212, -966, 110]];
  const curve = new THREE.CatmullRomCurve3(SPINE.map((p) => new THREE.Vector3(...p)), false, "centripetal");
  const N = 46;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), p = curve.getPointAt(t), tan = curve.getTangentAt(t);
    const s = t < 0.36 ? 0.3 + 0.7 * Math.sin(((t / 0.36) * Math.PI) / 2) : t < 0.6 ? 1 : 1 - (0.5 * (t - 0.6)) / 0.4;
    const v = merge(
      ellipsoid([13 * s + 5, 14 * s + 4, 12 * s + 5], [0, 0, 0], B, 8),
      boxAt([6 * s + 2, 9 * s + 3, 46 * s], [0, 0, 6], BD, 1),
      box([48 * s + 6, 6 * s + 2, 7 * s + 2], [0, 0, 4], B),
    );
    const pitch = Math.atan2(tan.z, Math.hypot(tan.x, tan.y)) / D, yaw = Math.atan2(-tan.x, tan.y) / D;
    bones.push(translate(rotateZ(rotateX(v, pitch), yaw), [p.x, p.y, p.z]));
  }
  // the ribs, arching out from the back either side down into the rock
  for (let k = 0; k < 12; k++) {
    const t = 0.38 + (k / 11) * 0.22, p = curve.getPointAt(t), len = 0.75 + 0.25 * Math.sin((k / 11) * Math.PI);
    for (const sd of [-1, 1]) {
      const broken = rnd() < 0.18, w = 270 * len;
      const pts: V3[] = [[p.x + sd * 16, p.y, p.z - 8], [p.x + sd * w * 0.55, p.y + 12, p.z - 4], [p.x + sd * w * 0.92, p.y + 24, p.z * 0.55], [p.x + sd * w, p.y + 30, 16], [p.x + sd * w * 0.98, p.y + 32, -14]];
      bones.push(limb(broken ? pts.slice(0, 3) : pts, 11, broken ? 7 : 5, B, { seg: 6, maxRings: 8, seed: 98 + k * 2 + (sd > 0 ? 1 : 0) }));
    }
  }
  // two ribs fallen out, lying on the rock
  bones.push(limb([[-330, 120, 6], [-380, 0, 18], [-360, -140, 8]], 9, 5, B, { seg: 6, maxRings: 5 }), limb([[330, -200, 6], [390, -80, 16], [420, 60, 6]], 9, 5, B, { seg: 6, maxRings: 5 }));
  // the hips and hind legs, folded under; the shoulders and forelegs
  for (const sd of [-1, 1]) {
    bones.push(translate(rotateY(ellipsoid([10, 78, 58], [0, 0, 0], BD, 10), sd * 20), [sd * 72, 300, 212]));
    bones.push(limb([[sd * 70, 300, 196], [sd * 120, 350, 120], [sd * 160, 390, 54]], 24, 19, B, { seg: 8, maxRings: 4 }), sphereCenter(26, [sd * 160, 390, 50], B, 8));
    bones.push(limb([[sd * 160, 390, 50], [sd * 170, 300, 26], [sd * 172, 220, 14]], 17, 14, B, { seg: 8, maxRings: 4 }));
    for (let j = 0; j < 3; j++) bones.push(cylinderBetween([sd * 172, 220, 14], [sd * (180 + (j - 1) * 26), 150, 6], 6, 5, BD));
    bones.push(translate(rotateY(ellipsoid([9, 62, 84], [0, 0, 0], BD, 10), sd * -24), [sd * 80, -300, 196]));
    bones.push(limb([[sd * 82, -330, 174], [sd * 120, -370, 110], [sd * 150, -410, 44]], 20, 16, B, { seg: 8, maxRings: 4 }), sphereCenter(22, [sd * 150, -410, 42], B, 8));
    bones.push(limb([[sd * 150, -410, 42], [sd * 150, -330, 22], [sd * 142, -240, 12]], 15, 12, B, { seg: 8, maxRings: 4 }));
  }
  // the skull resting on the ground: its long snout, the dark sockets, the jaw and its peg teeth
  const sk: Geo[] = [ellipsoid([46, 58, 38], [0, 0, 0], B, 12), ellipsoid([30, 62, 24], [0, -66, -10], B, 10), ellipsoid([26, 74, 10], [0, -44, -30], BD, 10)];
  for (const sd of [-1, 1]) sk.push(sphereCenter(13, [sd * 34, -6, 10], "Oldgrowth_Shadow", 8), sphereCenter(7, [sd * 16, -116, -4], "Oldgrowth_Shadow", 6));
  for (let k = 0; k < 9; k++) for (const sd of [-1, 1]) sk.push(cylinderAt({ rBot: 3.2, rTop: 1, height: 12, segments: 4, bottom: [sd * (20 - k * 0.9), -40 - k * 9, -30] }, "Oldgrowth_Egg"));
  bones.push(translate(rotateZ(merge(...sk), -14), [-236, -1010, 46]));
  g.push(...bones, coverTop(merge(...bones.slice(0, -1)), "Oldgrowth_MossDeep", { amount: 0.22, thick: 2, seed: 99, grain: 40, patches: 0.4 }));
  return group(merge(...g), ferns([{ at: [-60, 100, 0], n: 7, len: 110, seed: 120 }, { at: [70, -150, 0], n: 6, len: 100, seed: 121 }, { at: [-120, 420, 0], n: 6, len: 90, seed: 122 }, { at: [260, -620, 0], n: 6, len: 90, seed: 123 }, { at: [-280, 40, 0], n: 5, len: 80, seed: 124 }]));
}

// Falls into the sea (6.6 m): a stream runs over the top of a sea cliff (from +X) between banks of
// mossy rocks, pours over the lip at x = 160 in a broad sheet with a thinner one beside it, and
// falls clear of the rock into the sea, where it foams in a white pool among rocks under a
// drifting spray. z = 0 is the sea's surface; the lip stands 6.6 m over it. Stand it with +X into
// the cliff top, the lip on the cliff's edge.
export const FALLS_H = 660;
function seaFalls(): THREE.Group {
  const H = FALLS_H, LIP = 160, W = 190, rnd = seeded(131), g: Geo[] = [];
  // the stream's last run to the lip, banked with rocks
  g.push(boxBounds([LIP - 4, -W, H - 6], [LIP + 900, W, H + 3], "Oldgrowth_Stream"));
  g.push(cylinderBetween([LIP + 2, -W + 10, H + 3], [LIP + 2, W - 10, H + 3], 10, 6, "Oldgrowth_Foam"));
  for (let i = 0; i < 7; i++)
    for (const sd of [-1, 1]) g.push(mossRock([150 + (i % 3) * 30, 120, 70 + (i % 2) * 40], 132 + i * 2 + (sd > 0 ? 1 : 0), [LIP + 60 + i * 130, sd * (W + 50), H - 24], 0.6, "Oldgrowth_RockDark"));
  // the sheets, falling clear of the face
  const prof: XZ[] = [[LIP + 4, H + 3], [LIP - 24, H - 34], [LIP - 52, H * 0.77], [LIP - 82, H * 0.54], [LIP - 112, H * 0.31], [LIP - 140, H * 0.11], [LIP - 160, -8]];
  g.push(fallSheet(prof, -W + 14, W - 60, 12, "Oldgrowth_Falls", 133, 7));
  g.push(fallSheet(prof.map(([x, z]) => [x + 6, z] as XZ), W - 46, W - 14, 3, "Oldgrowth_Falls", 134, 4));
  for (let i = 0; i < 12; i++) {
    const y = -W + 24 + rnd() * (2 * W - 50), w = 10 + rnd() * 24;
    g.push(fallSheet(prof.map(([x, z]) => [x - 5, z] as XZ), y - w / 2, y + w / 2, 1, "Oldgrowth_Foam", 140 + i, 5).slice(0, 1));
  }
  // the pool at the foot: foam on the water, rocks either side, a stack standing off it
  for (let i = 0; i < 16; i++) {
    const a = rnd() * Math.PI - Math.PI / 2, r = 40 + rnd() * 160;
    g.push(translate(scale(sphereCenter(36 + rnd() * 44, [0, 0, 0], "Oldgrowth_Foam", 8), [1.3, 1, 0.2]), [LIP - 190 - Math.cos(a) * r * 0.7, Math.sin(a) * (W + 40) * 0.95, 0]));
  }
  for (const sd of [-1, 1]) {
    g.push(mossRock([220, 190, 200], 150 + sd, [40, sd * (W + 110), -30], 0.4, "Oldgrowth_RockDark"));
    g.push(mossRock([130, 120, 90], 153 + sd, [-120, sd * (W + 60), -30], 0.3, "Oldgrowth_RockDark"));
    g.push(translate(rock([90, 80, 50], 0.5, 156 + sd, "Oldgrowth_RockDark"), [-260, sd * (W - 30), -24]));
  }
  const spray = puffs([[-60, -40, 80, 120], [-30, 90, 120, 100], [-120, 10, 50, 140], [-20, -150, 40, 90], [20, 30, 260, 90]].map(([x, y, z, r]) => ({ r: [r * 1.2, r, r * 0.8] as V3, c: [x, y, z] as V3 })), mistMat("#f0f6f8", "#c9d6da", 0.4, 0.22));
  return group(merge(...g), spray);
}

// =================================== the sunken temple ===================================

// A banyan (the sunken woods' tree, and the sacred one): a short massive trunk of stems grown
// together, limbs reaching out level from its top, prop roots dropped from them standing like
// pillars, strands of aerial root hanging from them (some down to the ground), and a broad, flat,
// glossy crown.
interface BanyanSpec { seed: number; r: number; h: number; limbs: number; reach: number; props: number; strands: number; leaf: number; crown: number; bark: string }
function banyanTree(s: BanyanSpec): { wood: Geo; extra: Geo; core: Geo; mesh: THREE.Mesh | null; limbs: V3[][]; props: V3[] } {
  const rnd = seeded(s.seed), wood: Geo[] = [], extra: Geo[] = [], crowns: Lobe[] = [], limbs: V3[][] = [], props: V3[] = [];
  wood.push(limb([[0, 0, -20], [10, -5, s.h * 0.4], [20, -10, s.h * 0.8], [24, -8, s.h + 40]], s.r, s.r * 0.62, s.bark, { seg: 14, flare: 0.6, roots: 8, gnarl: 1, seed: s.seed, step: 70, maxRings: 14 }));
  // stems wound round the trunk and grown into it
  for (let k = 0; k < 5; k++) {
    const a0 = (k / 5) * Math.PI * 2 + rnd() * 0.4, turn = (rnd() < 0.5 ? -1 : 1) * (0.8 + rnd() * 0.6), pts: V3[] = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push(polar(a0 + turn * t, s.r * (0.9 - 0.25 * t) + 6, -10 + t * (s.h * 0.92)));
    }
    wood.push(limb(pts, s.r * 0.34, s.r * 0.22, s.bark, { seg: 8, gnarl: 0.7, seed: s.seed + 10 + k, maxRings: 12 }));
  }
  for (let k = 0; k < s.limbs; k++) {
    const a = ((k + rnd() * 0.5) / s.limbs) * Math.PI * 2, R = s.reach * (0.75 + rnd() * 0.35), z0 = s.h * (0.78 + rnd() * 0.2);
    const pts: V3[] = [polar(a, s.r * 0.3, z0), polar(a + 0.08, R * 0.5, z0 + 70 + rnd() * 50), polar(a + 0.16, R, z0 + 60 + rnd() * 90)];
    limbs.push(pts);
    wood.push(limb(pts, s.r * 0.4, s.r * 0.11, s.bark, { seg: 9, gnarl: 0.6, seed: s.seed + 30 + k, step: 70, maxRings: 9 }));
    crowns.push([pts[2][0], pts[2][1], pts[2][2] + s.crown * 0.35, s.reach * 0.42 + rnd() * 60, s.reach * 0.4 + rnd() * 60, s.crown * 0.42]);
    // prop roots dropped from the limb, standing like pillars
    for (let j = 0; j < s.props; j++) {
      const p = along(pts, 0.4 + (j / Math.max(1, s.props)) * 0.5 + rnd() * 0.08), dx = (rnd() - 0.5) * 30, dy = (rnd() - 0.5) * 30;
      const rr = s.r * (0.2 + rnd() * 0.08);
      wood.push(limb([[p[0] + dx, p[1] + dy, -15], [p[0] + dx * 0.6, p[1] + dy * 0.6, p[2] * 0.45], [p[0], p[1], p[2] - 10]], rr, rr * 0.55, s.bark, { seg: 7, flare: 0.5, roots: 4, gnarl: 0.5, seed: s.seed + 60 + k * 5 + j, maxRings: 6 }));
      props.push([p[0] + dx, p[1] + dy, rr]);
    }
    // strands of aerial root hanging from it
    for (let j = 0; j < s.strands; j++) {
      const p = along(pts, 0.3 + rnd() * 0.68), down = rnd() < 0.22, L = down ? p[2] + 10 : 90 + rnd() * 260;
      extra.push(cylinderAt({ rBot: down ? 2.6 : 1.2, rTop: down ? 5 : 3, height: L, segments: 4, bottom: [p[0] + (rnd() - 0.5) * 30, p[1] + (rnd() - 0.5) * 30, p[2] - L - 4] }, s.bark));
    }
  }
  crowns.push([10, -10, s.h + s.crown * 0.75, s.reach * 0.7, s.reach * 0.68, s.crown * 0.5]);
  const can = canopy(crowns, s.leaf, s.seed + 5, BANYAN, { density: 1, ragged: 0.55, flat: 0.45 });
  return { wood: merge(...wood), extra: merge(...extra), core: can.core, mesh: can.mesh, limbs, props };
}
function banyan(): THREE.Group {
  const t = banyanTree({ seed: 201, r: 72, h: 560, limbs: 6, reach: 760, props: 2, strands: 7, leaf: 96, crown: 300, bark: "Oldgrowth_BarkPale" });
  const moss = coverTop(t.wood, "Oldgrowth_Moss", { amount: 0.28, thick: 2.5, seed: 202, grain: 50, patches: 0.6 });
  return group(merge(t.wood, moss, t.extra, t.core), t.mesh, ferns([{ at: [-120, 90, 0], n: 7, len: 90, seed: 203 }, { at: [110, -120, 0], n: 6, len: 80, seed: 204 }]));
}

// The swallowed sanctuary (15 x 13 m, 12.5 m at its tower): a temple tower of the old kingdom on
// three terraces of laterite faced in sandstone, stairs up its front between naga balustrades, a
// porch with a dark doorway, false doors on its other sides, the tower over it rising in five
// redented tiers to a lotus bud; its upper tiers slumped, blocks fallen on the terraces. A banyan
// has taken root on its back: the trunk climbs the tower and spreads its crown over it, and its
// roots pour down over the walls and terraces into the ground.
function banyanTemple(): THREE.Group {
  const T = "Oldgrowth_Temple", TD = "Oldgrowth_TempleDark", C = "Oldgrowth_Carved", L = "Oldgrowth_Laterite", rnd = seeded(211);
  const stone: Geo[] = [], g: Geo[] = [];
  const tiers: [number, number, number][] = [[650, 0, 70], [560, 70, 140], [470, 140, 200]];
  for (const [h, z0, z1] of tiers) stone.push(boxBounds([-h, -h, z0 ? z0 : -20], [h, h, z1 - 10], z0 ? T : L, 4), boxBounds([-h - 8, -h - 8, z1 - 12], [h + 8, h + 8, z1], C, 2));
  // the stairs up the front, between naga balustrades
  for (let i = 0; i < 8; i++) stone.push(boxBounds([-770 + i * 37, -130, -10], [-470, 130, (i + 1) * 25], i % 2 ? T : TD, 2));
  for (const sd of [-1, 1]) {
    stone.push(translate(rotateY(boxAt([330, 36, 34], [0, 0, 0], C, 3), -30), [-620, sd * 150, 100]));
    // the naga's hood at the foot of the balustrade, five heads fanned
    for (let k = 0; k < 5; k++) {
      const a = (k - 2) * 0.32;
      stone.push(translate(rotateX(scale(sphereCenter(1, [0, 0, 0], C, 8), [10, 16, 22]), (a * 40)), [-800, sd * 150 + Math.sin(a) * 36, 58 + Math.cos(a) * 30]));
    }
    stone.push(boxBounds([-820, sd * 150 - 26, -10], [-770, sd * 150 + 26, 40], TD, 3));
  }
  // the sanctuary: walls, corner pilasters, base moulding and cornice
  const S = 260;
  stone.push(boxBounds([-S, -S, 200], [S, S, 560], T, 3), boxBounds([-S - 14, -S - 14, 200], [S + 14, S + 14, 232], C, 2), boxBounds([-S - 16, -S - 16, 540], [S + 16, S + 16, 572], C, 2));
  for (const [x, y] of [[-S, -S], [-S, S], [S, -S], [S, S]]) stone.push(boxBounds([x - 24, y - 24, 232], [x + 24, y + 24, 540], TD, 2));
  // the porch and its doorway (front), false doors on the other three sides
  stone.push(boxBounds([-S - 70, -120, 200], [-S, 120, 520], T, 3), boxBounds([-S - 82, -132, 506], [-S + 4, 132, 532], C, 2));
  stone.push(translate(slab([[-130, 0], [130, 0], [0, 110]], 24, C).map(({ geo, mat }) => ({ geo: geo.clone().applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2)), mat })), [-S - 70, 0, 532]));
  stone.push(boxBounds([-S - 74, -58, 200], [-S - 66, 58, 440], "Oldgrowth_Shadow"));
  for (const sd of [-1, 1]) stone.push(cylinderAt({ radius: 11, height: 240, segments: 8, bottom: [-S - 78, sd * 72, 200] }, C));
  stone.push(boxBounds([-S - 84, -90, 440], [-S - 66, 90, 474], C, 2));
  for (let r = 1; r < 4; r++) {
    const fd: Geo[] = [boxBounds([-S - 12, -80, 232], [-S, 80, 470], C, 2), boxBounds([-S - 16, -56, 250], [-S - 10, 56, 430], TD, 1)];
    for (let k = 0; k < 4; k++) fd.push(boxBounds([-S - 18, -48, 270 + k * 40], [-S - 15, 48, 276 + k * 40], C));
    stone.push(rotateZ(merge(...fd), r * 90));
  }
  // the tower: five redented tiers, slumping toward the back, a lotus bud on top
  const tower: Geo[] = [];
  for (let i = 0; i < 5; i++) {
    const z0 = 572 + i * 92, h = 230 * (1 - i * 0.15), rd = h * 0.22;
    tower.push(boxBounds([-h, -h + rd, z0], [h, h - rd, z0 + 78], i % 2 ? TD : T, 2), boxBounds([-h + rd, -h, z0], [h - rd, h, z0 + 78], i % 2 ? TD : T, 2));
    tower.push(boxBounds([-h - 8, -h + rd - 8, z0 + 70], [h + 8, h - rd + 8, z0 + 86], C, 2));
    for (const [x, y] of [[-h, -h], [-h, h], [h, -h], [h, h]]) tower.push(cylinderAt({ rBot: 20, rTop: 1, height: 56, segments: 4, bottom: [x * 0.92, y * 0.92, z0 + 84] }, C));
  }
  tower.push(lathe([[66, 0], [74, 30], [62, 80], [36, 128], [8, 150], [0, 152]], 10, T, [0, 0, 1032]));
  tower.push(cylinderAt({ rBot: 5, rTop: 1, height: 60, segments: 6, bottom: [0, 0, 1182] }, TD));
  stone.push(rotateX(merge(...tower), 3, [0, 0, 572]));
  // blocks fallen from it onto the terraces and the ground
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI / 2 + (rnd() - 0.5) * 2.2, r = 320 + rnd() * 380, z = r < 470 ? 200 : r < 560 ? 140 : r < 650 ? 70 : 0;
    stone.push(translate(rotateZ(rotateY(boxAt([60 + rnd() * 40, 40 + rnd() * 30, 30 + rnd() * 20], [0, 0, 0], rnd() < 0.5 ? T : TD, 3), (rnd() - 0.5) * 30), rnd() * 360), [Math.cos(a) * r + 200, Math.sin(a) * r, z - 4]));
  }
  g.push(...stone, coverTop(merge(...stone), "Oldgrowth_MossDeep", { amount: 0.3, thick: 3, seed: 212, grain: 40, ragged: 0.5, patches: 0.28 }));
  // the banyan on its back: the trunk up the tower's back corner, the crown over it, the roots
  const roots: Geo[] = [], R = "Oldgrowth_Root";
  const TRUNK: V3[] = [[300, -300, 180], [300, -290, 500], [310, -300, 800], [360, -340, 1100], [420, -380, 1300]];
  roots.push(limb(TRUNK, 70, 40, R, { seg: 10, flare: 0.5, roots: 5, gnarl: 1, seed: 213, maxRings: 14 }));
  const steps: [number, number, number][] = [[S + 16, 572, 200], [470, 200, 140], [560, 140, 70], [650, 70, 0]];
  for (let k = 0; k < 11; k++) {
    const a = -Math.PI * 0.62 + (k / 10) * Math.PI * 1.12 + (rnd() - 0.5) * 0.15, z = 600 + rnd() * 420;
    const start = along(TRUNK, (z - 180) / 1080);
    roots.push(limb(drape(start, a, steps, 180 + rnd() * 220, 214 + k), 22 - (k % 3) * 4, 9, R, { seg: 7, gnarl: 0.7, seed: 230 + k, maxRings: 22 }));
  }
  for (let k = 0; k < 8; k++) {
    const p: V3 = [140 + (rnd() - 0.5) * 120, -120 + (rnd() - 0.5) * 120, 900 + rnd() * 300], L = 200 + rnd() * 300;
    roots.push(cylinderAt({ rBot: 2, rTop: 5, height: L, segments: 4, bottom: [p[0], p[1], p[2] - L] }, R));
  }
  const can = canopy([[420, -380, 1520, 520, 500, 210], [80, -620, 1380, 330, 320, 150], [640, 60, 1420, 340, 330, 150], [700, -760, 1300, 300, 280, 130]], 92, 215, BANYAN, { density: 1, flat: 0.45 });
  return group(merge(...g, ...roots, coverTop(roots[0], "Oldgrowth_Moss", { amount: 0.3, thick: 2, seed: 216 }), can.core), can.mesh, ferns([{ at: [-700, 420, 0], n: 7, len: 100, seed: 217 }, { at: [600, -700, 0], n: 7, len: 100, seed: 218 }, { at: [-480, -480, 200], n: 5, len: 70, seed: 219 }]));
}

// A great stone face (4.4 m square, 7 m to its crown; the fig over it to 11 m): a tower on two
// steps with a calm face carved on each of its four sides, eyes half closed and the lips curving
// in a smile, a jewelled band over the brow and a crown of lotus tiers; a strangler fig has taken
// root on its top and its roots grip the corners and cross one face.
function rootFace(): THREE.Group {
  const T = "Oldgrowth_Temple", TD = "Oldgrowth_TempleDark", C = "Oldgrowth_Carved", SH = "Oldgrowth_Shadow", rnd = seeded(241);
  const stone: Geo[] = [boxBounds([-220, -220, -20], [220, 220, 40], "Oldgrowth_Laterite", 4), boxBounds([-190, -190, 40], [190, 190, 80], TD, 3)];
  const W = 150;
  stone.push(boxBounds([-W, -W, 80], [W, W, 560], TD, 3));
  // the face on the front (the same on each side): a paler panel, the brows, lids closed over
  // dark slits, a broad nose, the full lips curving up at the corners, a jewelled band, long ears
  const face: Geo = [
    boxBounds([-W - 5, -132, 170], [-W, 132, 522], C, 2),
    rotateX(box([16, 84, 14], [0, 0, 0], C, 3), 10, [0, 0, 0]).map((p) => ({ geo: p.geo.clone().translate(-W - 12, -54, 452), mat: p.mat })),
    rotateX(box([16, 84, 14], [0, 0, 0], C, 3), -10, [0, 0, 0]).map((p) => ({ geo: p.geo.clone().translate(-W - 12, 54, 452), mat: p.mat })),
    box([5, 66, 6], [-W - 14, -54, 418], SH), box([5, 66, 6], [-W - 14, 54, 418], SH),
    ellipsoid([12, 40, 15], [-W - 6, -54, 428], C, 10), ellipsoid([12, 40, 15], [-W - 6, 54, 428], C, 10),
    ellipsoid([12, 58, 58], [-W - 3, -84, 356], C, 10), ellipsoid([12, 58, 58], [-W - 3, 84, 356], C, 10),
    translate(slab([[0, 330], [0, 432], [-42, 350], [-38, 330]], 60, C), [-W - 4, 0, 0]),
    sphereCenter(8, [-W - 38, -15, 337], SH, 6), sphereCenter(8, [-W - 38, 15, 337], SH, 6),
    ellipsoid([15, 70, 13], [-W - 8, 0, 302], C, 10), ellipsoid([15, 58, 14], [-W - 7, 0, 276], C, 10),
    box([5, 88, 5], [-W - 20, 0, 290], SH),
    rotateX(box([5, 22, 5], [0, 0, 0], SH), -28).map((p) => ({ geo: p.geo.clone().translate(-W - 19, -50, 296), mat: p.mat })),
    rotateX(box([5, 22, 5], [0, 0, 0], SH), 28).map((p) => ({ geo: p.geo.clone().translate(-W - 19, 50, 296), mat: p.mat })),
    ellipsoid([13, 48, 28], [-W - 5, 0, 240], C, 10),
    boxBounds([-W - 20, -134, 480], [-W, 134, 518], C, 3),
    boxBounds([-W - 12, -150, 300], [-W + 30, -134, 460], C, 2), boxBounds([-W - 12, 134, 300], [-W + 30, 150, 460], C, 2),
  ].flat();
  for (const y of [-96, -48, 0, 48, 96]) face.push(...sphereCenter(11, [-W - 22, y, 499], "Oldgrowth_Laterite", 6));
  for (let r = 0; r < 4; r++) stone.push(rotateZ(face, r * 90));
  // the crown: a band, lotus tiers, a bud
  stone.push(boxBounds([-W - 10, -W - 10, 556], [W + 10, W + 10, 580], C, 2));
  stone.push(lathe([[150, 580], [140, 610], [118, 616], [112, 650], [92, 656], [86, 690], [62, 696], [56, 730], [30, 760], [0, 772]], 8, T));
  // the fig: its trunk on the crown, roots gripping the corners and one across the front face
  const roots: Geo[] = [], R = "Oldgrowth_Root";
  roots.push(limb([[20, -10, 700], [60, -60, 880], [110, -110, 1080]], 42, 26, R, { seg: 9, flare: 0.8, roots: 5, gnarl: 1, seed: 242, maxRings: 8 }));
  const steps: [number, number, number][] = [[W + 12, 580, 80], [190, 80, 40], [220, 40, 0]];
  for (let k = 0; k < 8; k++) {
    const a = Math.PI / 4 + Math.floor(k / 2) * (Math.PI / 2) + (k % 2 ? 0.12 : -0.12) + (rnd() - 0.5) * 0.06;
    roots.push(limb(drape([20 + Math.cos(a) * 60, -10 + Math.sin(a) * 60, 720], a, steps, 160 + rnd() * 140, 243 + k), 16 - (k % 2) * 4, 7, R, { seg: 7, gnarl: 0.7, seed: 250 + k, maxRings: 18 }));
  }
  roots.push(limb([[-120, -W - 6, 600], [-W - 8, -90, 520], [-W - 14, -20, 440], [-W - 12, 60, 360], [-W - 8, 130, 260], [-W - 6, W + 10, 120], [-190, 200, 50], [-300, 260, -14]], 13, 7, R, { seg: 7, gnarl: 0.6, seed: 258, maxRings: 20 }));
  const can = canopy([[120, -120, 1220, 300, 290, 140], [260, 120, 1120, 190, 180, 100], [-60, -280, 1100, 180, 170, 90]], 80, 259, BANYAN, { density: 1, flat: 0.4 });
  return group(merge(...stone, coverTop(merge(...stone), "Oldgrowth_MossDeep", { amount: 0.32, thick: 3, seed: 260, patches: 0.5 }), ...roots, can.core), can.mesh, ferns([{ at: [-260, -200, 0], n: 7, len: 90, seed: 261 }, { at: [250, 230, 0], n: 6, len: 90, seed: 262 }]));
}

// The flooded colonnade (9.4 m along Y): five square pillars of the court's gallery standing in
// the water on their bases, two still carrying a carved lintel, one carrying the end of a lintel
// that has slid down into the water, two broken off; drums and blocks fallen round their feet, the
// paving just under the surface, a root wound round one. z = 0 is the water's surface.
function sunkenPillars(): THREE.Group {
  const T = "Oldgrowth_Temple", TD = "Oldgrowth_TempleDark", C = "Oldgrowth_Carved", rnd = seeded(271), g: Geo[] = [];
  for (let k = 0; k < 9; k++) g.push(boxBounds([-130 + (k % 3) * 90 - 44, -480 + Math.floor(k / 3) * 330, -24 + rnd() * 4], [-130 + (k % 3) * 90 + 42, -480 + Math.floor(k / 3) * 330 + 300, -12 + rnd() * 6], rnd() < 0.5 ? TD : C, 3));
  const H = [380, 380, 250, 150, 380], YS = [-440, -220, 0, 220, 440];
  YS.forEach((y, i) => {
    g.push(boxBounds([-38, y - 38, -60], [38, y + 38, -10], "Oldgrowth_Laterite", 3));
    g.push(boxBounds([-24, y - 24, -12], [24, y + 24, H[i]], i % 2 ? T : TD, 2));
    if (H[i] > 300) g.push(boxBounds([-32, y - 32, H[i]], [32, y + 32, H[i] + 22], C, 2));
    else for (let k = 0; k < 3; k++) g.push(translate(rotateZ(boxAt([26, 20, 14 + rnd() * 18], [0, 0, 0], i % 2 ? T : TD, 2), rnd() * 90), [(rnd() - 0.5) * 20, y + (rnd() - 0.5) * 20, H[i] - 6]));
  });
  g.push(boxBounds([-34, -470, 402], [34, -190, 452], C, 3));
  for (const y of [-400, -330, -260]) g.push(boxBounds([-36, y - 20, 412], [-33, y + 20, 442], "Oldgrowth_Laterite"));
  g.push(translate(rotateX(boxBounds([-34, -480, -25], [34, 0, 25], C, 3), 56), [0, 440, 398]));
  for (const [x, y, a, r] of [[90, 120, 70, 26], [-110, -60, 20, 24], [70, -330, 120, 22]] as const)
    g.push(translate(rotateZ(rotateY(cylinderAt({ radius: r, height: 90, segments: 10, bottom: [0, 0, -45] }, TD), 90), a), [x, y, -8]));
  for (let i = 0; i < 6; i++) g.push(translate(rotateZ(rotateY(boxAt([50 + rnd() * 30, 36, 30], [0, 0, 0], rnd() < 0.5 ? T : TD, 3), (rnd() - 0.5) * 40), rnd() * 360), [(rnd() - 0.5) * 300, -480 + rnd() * 960, -20]));
  const root = limb([[30, -260, 410], [36, -210, 300], [-30, -200, 220], [-24, -250, 120], [30, -230, 40], [60, -150, -20]], 9, 5, "Oldgrowth_Root", { seg: 6, gnarl: 0.6, maxRings: 14, seed: 272 });
  return group(merge(...g, root, coverTop(merge(...g), "Oldgrowth_MossDeep", { amount: 0.32, thick: 2.5, seed: 273, patches: 0.5 })));
}

// A stone barge (9.6 m along Y): a royal barge carved whole in stone, stranded in the shallows and
// listing, its prow a fan of five naga heads, its stern curled up, a little pavilion on its deck
// half fallen in, moss on everything and a crack down its side. z = 0 is the water's surface.
function stoneBoat(): THREE.Group {
  const T = "Oldgrowth_Temple", TD = "Oldgrowth_TempleDark", C = "Oldgrowth_Carved", rnd = seeded(281), g: Geo[] = [];
  const hull = slab([[-420, -70], [400, -70], [460, 30], [478, 140], [430, 132], [392, 56], [-392, 56], [-450, 150], [-492, 230], [-470, 30]], 250, T, 3).map(({ geo, mat }) => {
    const p = geo.getAttribute("position");
    for (let k = 0; k < p.count; k++) {
      const u = Math.min(1, Math.abs(p.getX(k)) / 500);
      p.setY(k, p.getY(k) * (1 - 0.72 * Math.pow(u, 2.4)) * (p.getZ(k) < 0 ? 0.82 + 0.18 * ((p.getZ(k) + 70) / 70) : 1));
    }
    geo.computeVertexNormals();
    return { geo, mat };
  });
  g.push(hull, boxBounds([-380, -96, 50], [380, 96, 62], TD, 2));
  for (const sd of [-1, 1]) {
    g.push(boxBounds([-380, sd * 100 - 8, 56], [380, sd * 100 + 8, 76], C, 2));
    for (let k = 0; k < 9; k++) g.push(boxBounds([-340 + k * 85, sd * 118 - 3, -10], [-300 + k * 85, sd * 118 + 3, 36], C, 1));
  }
  // the naga prow
  for (let k = 0; k < 5; k++) {
    const y = (k - 2) * 34, top: V3 = [-540 - Math.abs(k - 2) * 6, y * 1.3, 300 - Math.abs(k - 2) * 22];
    g.push(limb([[-470, y * 0.3, 190], [-500, y * 0.8, 250], top], 16, 11, C, { seg: 7, maxRings: 5 }));
    g.push(translate(scale(sphereCenter(1, [0, 0, 0], C, 8), [10, 22, 30]), [top[0] + 6, top[1], top[2] + 6]));
    g.push(ellipsoid([22, 12, 10], [top[0] - 14, top[1], top[2] + 24], C, 8), sphereCenter(3, [top[0] - 28, top[1] - 6, top[2] + 28], "Oldgrowth_Shadow", 4), sphereCenter(3, [top[0] - 28, top[1] + 6, top[2] + 28], "Oldgrowth_Shadow", 4));
  }
  g.push(limb([[460, 0, 130], [520, 0, 210], [500, 0, 280], [460, 0, 266], [470, 0, 230]], 18, 8, C, { seg: 7, maxRings: 10 }));
  // the pavilion on the deck, one post broken and its roof slipped
  for (const [x, y, h] of [[-120, -62, 170], [-120, 62, 170], [120, -62, 100], [120, 62, 170]] as const) g.push(boxBounds([x - 10, y - 10, 62], [x + 10, y + 10, 62 + h], TD, 2));
  const roof = merge(rotateZ(cylinderAt({ rBot: 210, rTop: 30, height: 80, segments: 4, bottom: [0, 0, 232] }, T), 45), rotateZ(cylinderAt({ rBot: 110, rTop: 20, height: 60, segments: 4, bottom: [0, 0, 300] }, TD), 45), cylinderAt({ rBot: 16, rTop: 1, height: 90, segments: 6, bottom: [0, 0, 350] }, C));
  g.push(rotateY(roof, 9, [-120, 0, 232]));
  g.push(boxBounds([-240, 70, 40], [240, 74, 52], "Oldgrowth_Shadow"));
  const boat = rotateZ(rotateX(merge(...g), -6), 90);
  return group(merge(boat, coverTop(boat, "Oldgrowth_MossDeep", { amount: 0.3, thick: 2.5, seed: 282, patches: 0.45 }), ...[0, 1, 2].map((i) => translate(rock([90, 70, 50], 0.5, 283 + i, "Oldgrowth_RockDark"), [(rnd() - 0.5) * 300, (rnd() - 0.5) * 900, -30]))));
}

// Glowing mushrooms (4 m): tall slender caps like bells, two metres high, in sea green and blue on
// a mossy mound crossed by roots, small ones round them, spores floating over them.
function glowShrooms(): THREE.Group {
  const rnd = seeded(291), g: Geo[] = [lump([0, 0, -26], [180, 150, 56], 291, "Oldgrowth_MossDeep", 1, 0.2)];
  g.push(limb([[-200, -80, -10], [-60, -40, 26], [80, -60, 20], [210, -10, -10]], 14, 7, "Oldgrowth_Root", { seg: 7, gnarl: 0.6, maxRings: 8 }));
  g.push(limb([[-150, 150, -10], [-40, 60, 24], [40, 140, 18], [120, 200, -10]], 11, 6, "Oldgrowth_Root", { seg: 6, gnarl: 0.6, maxRings: 8 }));
  const tall: [number, number, number, number][] = [[-40, 20, 210, 52], [60, -50, 165, 44], [-90, -70, 122, 36], [100, 60, 140, 40], [20, 110, 95, 30]];
  tall.forEach(([x, y, h, c], i) => g.push(shroom([x, y, 22], h, c, [(rnd() - 0.5) * h * 0.2, (rnd() - 0.5) * h * 0.2], i % 2 ? "Oldgrowth_GlowCapBlue" : "Oldgrowth_GlowCap", 292 + i, true)));
  for (let i = 0; i < 12; i++) g.push(shroom([(rnd() - 0.5) * 320, (rnd() - 0.5) * 260, 10], 14 + rnd() * 16, 6 + rnd() * 7, [0, 0], i % 3 ? "Oldgrowth_GlowCap" : "Oldgrowth_GlowCapBlue", 300 + i));
  for (let i = 0; i < 18; i++) g.push(sphereCenter(1.6 + rnd() * 1.4, [(rnd() - 0.5) * 280, (rnd() - 0.5) * 240, 60 + rnd() * 200], "Oldgrowth_Spore", 4));
  return group(merge(...g), ferns([{ at: [-170, -30, 6], n: 6, len: 80, seed: 320 }, { at: [160, 100, 6], n: 5, len: 70, seed: 321 }]));
}

// An arch of roots (5.6 m clear between its feet, 3.9 m clear under it; the way runs through
// along X): seven great roots spring from twisted masses on either side and arch over, strands
// hanging from them above head height, moss along their backs and leaves on top.
function rootArch(): THREE.Group {
  const R = "Oldgrowth_Root", rnd = seeded(331), g: Geo[] = [];
  for (let k = 0; k < 7; k++) {
    const x0 = -270 + k * 90 + (rnd() - 0.5) * 40, x1 = x0 + (rnd() - 0.5) * 160, ya = 340 + rnd() * 180, yb = 340 + rnd() * 180, top = 470 + rnd() * 90;
    const pts: V3[] = [[x0, -ya - 130, -14], [x0, -ya, 150], [x0 * 0.92, -ya * 0.78, 360], [(x0 + x1) / 2, -ya * 0.3, top], [(x0 + x1) / 2, yb * 0.3, top - 10], [x1 * 0.92, yb * 0.78, 350], [x1, yb, 140], [x1, yb + 130, -14]];
    g.push(limb(pts, 27 - (k % 3) * 4, 17, R, { seg: 8, gnarl: 0.8, seed: 332 + k, maxRings: 24 }));
  }
  for (const sd of [-1, 1])
    for (let k = 0; k < 5; k++) {
      const a0 = rnd() * Math.PI * 2, cx = -200 + k * 100, pts: V3[] = [];
      for (let i = 0; i <= 6; i++) pts.push([cx + Math.cos(a0 + i * 0.8) * 30, sd * (430 + Math.sin(a0 + i * 0.8) * 30), -14 + i * 60]);
      g.push(limb(pts, 20, 12, R, { seg: 7, flare: 0.5, roots: 3, gnarl: 0.7, seed: 350 + k + (sd > 0 ? 10 : 0), maxRings: 10 }));
    }
  for (let k = 0; k < 16; k++) {
    const x = -260 + rnd() * 520, y = (rnd() - 0.5) * 520, L = 50 + rnd() * 90, top = 460 - Math.abs(y) * 0.2;
    g.push(cylinderAt({ rBot: 1.4, rTop: 3.5, height: L, segments: 4, bottom: [x, y, top - L] }, R));
  }
  const can = canopy([[0, 0, 600, 360, 400, 110], [-200, -380, 480, 200, 200, 110], [180, 400, 470, 200, 190, 100]], 70, 360, BANYAN, { density: 1, flat: 0.5 });
  return group(merge(...g, coverTop(merge(...g), "Oldgrowth_Moss", { amount: 0.35, thick: 2.5, seed: 361, patches: 0.7 }), can.core), can.mesh, ferns([{ at: [-200, -560, 0], n: 7, len: 90, seed: 362 }, { at: [200, 560, 0], n: 7, len: 90, seed: 363 }, { at: [0, -470, 0], n: 5, len: 70, seed: 364 }]));
}

// =================================== the sacred banyan ===================================

// garlands: a ring of little flowers, marigold with a band of jasmine, lying or hanging
function garland(c: V3, r: number, tilt: number, n = 18): Geo {
  const out: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, p: V3 = [Math.cos(a) * r, Math.sin(a) * r, 0];
    out.push(sphereCenter(r * 0.17 + 1.5, p, i % 6 === 0 ? "Oldgrowth_Jasmine" : "Oldgrowth_Marigold", 5));
  }
  return translate(rotateY(merge(...out), tilt), c);
}
// a little elephant (an offering): body, head, trunk, ears, legs; `s` its height in cm
function figurine(s: number, mat: string): Geo {
  const k = s / 40;
  return scale(merge(
    ellipsoid([16, 10, 11], [2, 0, 22], mat, 8), ellipsoid([8, 8, 9], [-15, 0, 28], mat, 8),
    limb([[-21, 0, 26], [-25, 0, 16], [-23, 0, 6]], 3, 1.6, mat, { seg: 5, maxRings: 3 }),
    ellipsoid([2, 7, 7], [-12, -8, 29], mat, 6), ellipsoid([2, 7, 7], [-12, 8, 29], mat, 6),
    ...[[-8, -6], [-8, 6], [12, -6], [12, 6]].map(([x, y]) => cylinderAt({ radius: 3.4, height: 16, segments: 6, bottom: [x, y, 0] }, mat)),
  ), [k, k, k]);
}

// The sacred banyan (24 m across its crown, 14 m tall): the greatest of the banyans, its trunk of
// many stems wound in silk of three colours (pink, saffron, green), knotted, the ends hanging; prop
// roots standing round it like the pillars of a hall, cloths of every colour tied to them and
// hanging in strips from its low limbs; garlands, candles and little elephants left at its foot.
function sacredBanyan(): THREE.Group {
  const rnd = seeded(401), t = banyanTree({ seed: 401, r: 150, h: 860, limbs: 8, reach: 1050, props: 2, strands: 8, leaf: 120, crown: 380, bark: "Oldgrowth_BarkPale" });
  const g: Geo[] = [t.wood, t.extra, coverTop(t.wood, "Oldgrowth_Moss", { amount: 0.25, thick: 3, seed: 402, grain: 60, patches: 0.55 })];
  // the silk wound round the trunk (over the stems: 1.12 of its radius), knotted on the front
  const SILK = ["Oldgrowth_SilkPink", "Oldgrowth_SilkSaffron", "Oldgrowth_SilkGreen"];
  SILK.forEach((m, i) => {
    const z0 = 110 + i * 46, r = 150 * 1.18 + 14 - i * 4;
    g.push(lathe([[r - 3, z0], [r + 3, z0 + 4], [r + 4, z0 + 38], [r - 2, z0 + 42]], 24, m));
    g.push(translate(rotateY(boxAt([3, 26, 70 + i * 20], [0, 0, -70 - i * 20], m), -8 + i * 6), [-r - 4, -30 + i * 30, z0 + 20]));
  });
  g.push(ellipsoid([12, 26, 20], [-150 * 1.18 - 18, 0, 160], "Oldgrowth_SilkPink", 8));
  // cloths tied round the prop roots and hanging in strips from the limbs
  const CLOTH = [...SILK, "FabricRed", "FabricWhite", "FabricGold", "FabricBlue"];
  t.props.forEach(([x, y, r], i) => {
    if (i % 2) return;
    const m = CLOTH[i % CLOTH.length];
    g.push(lathe([[r + 2, 140], [r + 5, 144], [r + 5, 170], [r + 2, 174]], 10, m, [x, y, 0]));
  });
  for (const pts of t.limbs)
    for (let j = 0; j < 5; j++) {
      const p = along(pts, 0.25 + j * 0.15 + rnd() * 0.05), L = 60 + rnd() * 90, m = CLOTH[Math.floor(rnd() * CLOTH.length)];
      g.push(translate(rotateZ(boxAt([2, 12 + rnd() * 8, L], [0, 0, -L], m), rnd() * 180), [p[0], p[1], p[2] - 20]));
    }
  // at its foot (the front): garlands on the roots, candles, little elephants
  for (const [x, y, s, m] of [[-300, -70, 34, "Oldgrowth_WhiteStone"], [-290, 60, 26, "Oldgrowth_TempleDark"], [-330, 140, 40, "Oldgrowth_WhiteStone"], [-320, -170, 22, "Oldgrowth_WhiteStone"], [-270, 230, 30, "Oldgrowth_TempleDark"]] as const)
    g.push(translate(rotateZ(figurine(s, m), (rnd() - 0.5) * 30), [x, y, 0]));
  for (const [x, y] of [[-250, -10], [-262, 110], [-240, -120]] as const) {
    g.push(cylinderAt({ radius: 3, height: 22, segments: 6, bottom: [x, y, 0] }, "Oldgrowth_Candle"), ellipsoid([3, 3, 5], [x, y, 27], "Oldgrowth_Flame", 6));
  }
  for (let i = 0; i < 6; i++) g.push(garland([-200 + rnd() * 30, -150 + i * 60, 20 + rnd() * 40], 16, 60 + rnd() * 30));
  const fern = ferns([{ at: [300, 280, 0], n: 6, len: 90, seed: 403 }, { at: [260, -320, 0], n: 6, len: 90, seed: 404 }]);
  return group(merge(...g, t.core), t.mesh, fern);
}

// A chedi in the roots (5.2 m square, 9 m; the banyan out of it to 12 m): a bell-shaped chedi of
// old brick, its stucco mostly fallen away, on three square steps and round lotus mouldings,
// the box and the ringed spire over the bell; a banyan has seeded on its shoulder and its roots
// close round the bell and run down the steps; a crack down the bell, brick fallen at its foot.
function rootChedi(): THREE.Group {
  const B = "Oldgrowth_Brick", BD = "Oldgrowth_BrickDark", S = "Oldgrowth_Stucco", rnd = seeded(421), stone: Geo[] = [];
  for (const [h, z0, z1, m] of [[260, -20, 40, BD], [225, 40, 80, B], [195, 80, 110, B]] as const) stone.push(boxBounds([-h, -h, z0], [h, h, z1], m, 3));
  stone.push(lathe([[180, 110], [184, 118], [170, 128], [172, 138], [158, 148], [156, 165]], 16, S));
  const BELL: XZ[] = [[156, 165], [168, 200], [174, 260], [170, 320], [152, 380], [120, 430], [82, 464], [40, 482], [0, 486]];
  stone.push(lathe(BELL, 16, B));
  stone.push(boxBounds([-62, -62, 478], [62, 62, 540], S, 2), boxBounds([-72, -72, 536], [72, 72, 548], B, 2));
  for (let i = 0; i < 8; i++) {
    const z = 548 + i * 34, r = 46 - i * 4.5;
    stone.push(lathe([[r, z], [r + 7, z + 10], [r + 7, z + 22], [r, z + 34]], 12, i % 2 ? S : B));
  }
  stone.push(cylinderAt({ rBot: 10, rTop: 1, height: 90, segments: 8, bottom: [0, 0, 820] }, "Bronze"));
  // the stucco left in patches on the bell, the crack, the bricks fallen
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2, z = 190 + rnd() * 220, rb = 166 - Math.max(0, z - 300) * 0.35;
    stone.push(translate(rotateZ(boxAt([4, 40 + rnd() * 40, 30 + rnd() * 40], [0, 0, 0], S), a / D), [Math.cos(a) * (rb + 2), Math.sin(a) * (rb + 2), z]));
  }
  stone.push(translate(rotateZ(boxAt([6, 10, 260], [0, 0, 0], "Oldgrowth_Shadow"), -30), [-150, 70, 190]));
  for (let i = 0; i < 16; i++) stone.push(translate(rotateZ(boxAt([28, 14, 9], [0, 0, 0], rnd() < 0.5 ? B : BD), rnd() * 180), [-240 + rnd() * 480 - 40, (rnd() < 0.5 ? -1 : 1) * (270 + rnd() * 90), -2]));
  // the banyan: out of the bell's shoulder, its roots closing round the bell and down the steps
  const R = "Oldgrowth_Root", roots: Geo[] = [];
  roots.push(limb([[110, -90, 380], [120, -100, 560], [100, -80, 760], [80, -60, 880]], 34, 20, R, { seg: 8, flare: 0.8, roots: 4, gnarl: 1, seed: 422, maxRings: 9 }));
  const rb = (z: number) => {
    for (let i = 1; i < BELL.length; i++) if (z <= BELL[i][1]) return BELL[i - 1][0] + ((BELL[i][0] - BELL[i - 1][0]) * (z - BELL[i - 1][1])) / (BELL[i][1] - BELL[i - 1][1]);
    return 0;
  };
  for (let k = 0; k < 9; k++) {
    const a0 = -Math.PI / 4 + (k / 9) * Math.PI * 1.7, turn = (rnd() - 0.5) * 0.8, pts: V3[] = [];
    for (let i = 0; i <= 6; i++) {
      const z = 420 - i * 45, a = a0 + turn * (i / 6), r = rb(z) + 9;
      pts.push(polar(a, r, z));
    }
    const a = a0 + turn, k1 = 1 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
    pts.push(polar(a, 186, 140), polar(a, 205 * k1, 112), polar(a, 230 * k1, 82), polar(a, 266 * k1, 42), polar(a, 330 * k1, 4), polar(a + 0.1, 420 * k1, -14));
    roots.push(limb(pts, 15 - (k % 3) * 3, 7, R, { seg: 7, gnarl: 0.7, seed: 430 + k, maxRings: 20 }));
  }
  const can = canopy([[100, -80, 1020, 440, 420, 190], [-160, 100, 940, 240, 230, 120], [300, 120, 900, 220, 210, 110]], 84, 440, BANYAN, { density: 1, flat: 0.4 });
  return group(merge(...stone, coverTop(merge(...stone), "Oldgrowth_MossDeep", { amount: 0.32, thick: 3, seed: 441, patches: 0.5 }), ...roots, can.core), can.mesh, ferns([{ at: [-300, -260, 0], n: 6, len: 90, seed: 442 }, { at: [290, 300, 0], n: 6, len: 80, seed: 443 }]));
}

// A white elephant (4.6 x 2.2 m plinth, 4 m tall): the royal white elephant in white stone on a
// plinth with a band of lotus petals, its trunk curled and its tusks up, wearing a caparison of
// red and gold hung with golden tassels, a gold plate on its brow and a crown, bells round its
// neck. It faces -X; a pair of them stand mirrored either side of the way.
function whiteElephant(): Geo {
  const W = "Oldgrowth_WhiteStone", P = "Oldgrowth_Plinth", g: Geo[] = [];
  g.push(boxBounds([-235, -112, -10], [235, 112, 40], P, 3), boxBounds([-220, -100, 40], [220, 100, 70], P, 2));
  for (let i = 0; i < 26; i++) {
    const t = i / 26, onX = i % 13 < 7, s = i < 13 ? -1 : 1;
    const p: V3 = onX ? [-220 + (i % 13) * 73, s * 104, 74] : [s * 224, -100 + ((i % 13) - 7) * 33, 74];
    g.push(translate(scale(sphereCenter(1, [0, 0, 0], "Oldgrowth_Carved", 6), [onX ? 18 : 6, onX ? 6 : 16, 12]), p));
    void t;
  }
  g.push(boxBounds([-224, -104, 70], [224, 104, 84], W, 2));
  for (const [x, y] of [[-95, -50], [-95, 50], [105, -50], [105, 50]] as const) {
    g.push(cylinderAt({ rBot: 31, rTop: 28, height: 20, segments: 12, bottom: [x, y, 84] }, W));
    g.push(limb([[x, y, 100], [x + 4, y, 150], [x, y, 205]], 27, 30, W, { seg: 10, maxRings: 4 }));
    for (const dy of [-14, 0, 14]) g.push(ellipsoid([5, 6, 6], [x - 28, y + dy, 92], "Oldgrowth_Egg", 6));
  }
  g.push(ellipsoid([152, 88, 94], [15, 0, 252], W, 14));
  g.push(ellipsoid([64, 66, 72], [-150, 0, 292], W, 12), sphereCenter(30, [-164, -22, 344], W, 10), sphereCenter(30, [-164, 22, 344], W, 10));
  for (const sd of [-1, 1]) {
    g.push(translate(rotateZ(ellipsoid([8, 54, 58], [0, 0, 0], W, 10), sd * 32), [-116, sd * 66, 292]));
    g.push(limb([[-198, sd * 28, 236], [-236, sd * 36, 206], [-272, sd * 40, 222]], 9, 4, "Oldgrowth_Egg", { seg: 6, maxRings: 4 }));
    g.push(sphereCenter(5.5, [-204, sd * 44, 306], "Oldgrowth_Shadow", 6));
  }
  g.push(limb([[-205, 0, 268], [-226, 0, 206], [-232, 0, 146], [-220, 0, 104], [-198, 0, 104], [-196, 0, 124]], 21, 8, W, { seg: 9, maxRings: 12 }));
  g.push(limb([[164, 0, 262], [176, 0, 200], [180, 0, 148]], 5, 3, W, { seg: 5, maxRings: 3 }), ellipsoid([6, 6, 12], [180, 0, 140], W, 6));
  // the caparison: a red cloth draped over its back (strips following the body's curve), gold
  // edging along its hem, golden tassels hanging from it
  const GD = "Oldgrowth_Gold", N = 10;
  for (let k = 0; k < N; k++) {
    const t0 = -1.25 + (k / N) * 2.5, t1 = -1.25 + ((k + 1) / N) * 2.5, tm = (t0 + t1) / 2;
    const y0 = Math.sin(t0) * 94, z0 = 252 + Math.cos(t0) * 100, y1 = Math.sin(t1) * 94, z1 = 252 + Math.cos(t1) * 100;
    const w = Math.hypot(y1 - y0, z1 - z0) + 2, ang = (Math.atan2(z1 - z0, y1 - y0) * 180) / Math.PI;
    g.push(translate(rotateX(box([150, w, 4], [0, 0, 0], "FabricRed"), ang), [20, (y0 + y1) / 2, (z0 + z1) / 2]));
    if (Math.abs(tm) < 0.3) g.push(translate(rotateX(box([130, w, 5], [0, 0, 0], GD), ang), [20, (y0 + y1) / 2, (z0 + z1) / 2 + 1.5]));
  }
  for (const sd of [-1, 1]) {
    const yh = Math.sin(1.25) * 94 * sd, zh = 252 + Math.cos(1.25) * 100;
    g.push(cylinderBetween([-56, yh + sd * 2, zh], [96, yh + sd * 2, zh], 4, 6, GD));
    for (let k = 0; k < 7; k++) {
      const x = -48 + k * 23;
      g.push(cylinderBetween([x, yh + sd * 3, zh], [x, yh + sd * 5, zh - 26], 1.6, 4, GD), sphereCenter(4.5, [x, yh + sd * 5, zh - 28], GD, 6), cylinderAt({ rBot: 4.5, rTop: 1.5, height: 14, segments: 6, bottom: [x, yh + sd * 5, zh - 46] }, "FabricRed"));
    }
  }
  // the brow plate, the crown, bells round its neck
  g.push(translate(rotateY(rotateX(box([3, 34, 34], [0, 0, 0], GD), 45), -20), [-212, 0, 322]));
  g.push(cylinderAt({ rBot: 20, rTop: 2, height: 56, segments: 8, bottom: [-160, 0, 356] }, GD), cylinderAt({ radius: 22, height: 8, segments: 10, bottom: [-160, 0, 352] }, GD));
  for (let k = 0; k < 11; k++) {
    const a = -Math.PI * 0.85 + (k / 10) * Math.PI * 1.7;
    g.push(sphereCenter(6, [-110 + Math.cos(a) * 8, Math.sin(a) * 76, 262 + Math.cos(a) * 70], GD, 6));
  }
  return merge(...g);
}

// Floating lanterns (4 x 4 m): seven little rafts of banana leaf folded into points round a lotus
// of pink petals, a candle burning in each with incense, a glow on the water round it.
// z = 0 is the water's surface.
function lanternFloat(): THREE.Group {
  const rnd = seeded(461), g: Geo[] = [], spots: [number, number][] = [[-80, -60], [60, 40], [-20, 150], [150, -120], [-160, 100], [120, 180], [30, -180]];
  for (const [x, y] of spots) {
    const k: Geo[] = [cylinderAt({ radius: 24, height: 7, segments: 12, bottom: [0, 0, -3] }, "Oldgrowth_BananaLeaf")];
    for (let i = 0; i < 8; i++) k.push(translate(rotateZ(rotateY(cylinderAt({ rBot: 7, rTop: 0.5, height: 15, segments: 3, bottom: [0, 0, 0] }, "Oldgrowth_BananaLeaf"), 30), (i / 8) * 360), polar((i / 8) * Math.PI * 2, 20, 2)));
    for (let i = 0; i < 10; i++) k.push(translate(rotateZ(rotateY(ellipsoid([4, 8, 12], [0, 0, 10], i % 2 ? "Oldgrowth_Petal" : "Oldgrowth_Jasmine", 6), 22), (i / 10) * 360), polar((i / 10) * Math.PI * 2, 11, 4)));
    k.push(cylinderAt({ radius: 2.4, height: 16, segments: 6, bottom: [0, 0, 4] }, "Oldgrowth_Candle"), ellipsoid([2.6, 2.6, 4.6], [0, 0, 24.5], "Oldgrowth_Flame", 6));
    for (const a of [0.4, 0.6, 0.8]) k.push(cylinderBetween([3, 2, 6], [3 + Math.cos(a * 8) * 8, 2 + Math.sin(a * 8) * 8, 30], 0.6, 3, "Oldgrowth_Twig"), sphereCenter(1, [3 + Math.cos(a * 8) * 8, 2 + Math.sin(a * 8) * 8, 30.5], "Oldgrowth_Flame", 3));
    k.push(sphereCenter(4, [8, -8, 8], "Oldgrowth_Marigold", 5));
    g.push(translate(rotateZ(merge(...k), rnd() * 360), [x, y, 0]));
  }
  const halo = noShadow(toThree(merge(...spots.map(([x, y]) => cylinderAt({ radius: 70, height: 0.5, segments: 16, bottom: [x, y, 1] }, "halo"))), () => haloMat("#ffb35a", 0.55)));
  return group(merge(...g), halo);
}

// An offering table (2.4 x 1.6 m): a stone table under the trees heaped with what people bring:
// garlands of marigold and jasmine, candles, an urn of incense, trays of fruit on banana leaf,
// red drinks with straws, little elephants on it and before it; a pole with a flag and cloth of
// three colours tied round it.
function offeringShrine(): Geo {
  const S = "Oldgrowth_Plinth", rnd = seeded(471), g: Geo[] = [];
  g.push(boxBounds([-80, -110, -10], [80, 110, 10], S, 2), boxBounds([-60, -90, 10], [-30, -60, 72], S, 2), boxBounds([-60, 60, 10], [-30, 90, 72], S, 2), boxBounds([30, -90, 10], [60, -60, 72], S, 2), boxBounds([30, 60, 10], [60, 90, 72], S, 2));
  g.push(boxBounds([-72, -104, 72], [72, 104, 84], S, 2), boxBounds([-74, -60, 84], [74, 60, 85], "FabricRed"), boxBounds([-75, -60, 40], [-74, 60, 85], "FabricRed"));
  for (const [x, y] of [[-40, -70], [-40, 70], [30, -80], [30, 80]] as const) g.push(cylinderAt({ radius: 2.6, height: 18, segments: 6, bottom: [x, y, 84] }, "Oldgrowth_Candle"), ellipsoid([2.8, 2.8, 4.8], [x, y, 107], "Oldgrowth_Flame", 6));
  g.push(lathe([[16, 0], [22, 8], [20, 22], [24, 26], [22, 28]], 12, "Bronze", [10, 0, 84]));
  for (let i = 0; i < 7; i++) {
    const tip: V3 = [10 + (rnd() - 0.5) * 20, (rnd() - 0.5) * 20, 150 + rnd() * 20];
    g.push(cylinderBetween([10, 0, 100], tip, 0.8, 3, "Oldgrowth_Twig"), sphereCenter(1.2, tip, "Oldgrowth_Flame", 3));
  }
  for (const [x, y] of [[-30, -30], [40, 40]] as const) {
    g.push(cylinderAt({ radius: 22, height: 3, segments: 10, bottom: [x, y, 84] }, "Oldgrowth_BananaLeaf"));
    for (let i = 0; i < 6; i++) g.push(sphereCenter(5 + rnd() * 3, [x + (rnd() - 0.5) * 22, y + (rnd() - 0.5) * 22, 92], i % 2 ? "Oldgrowth_Marigold" : "Oldgrowth_SilkGreen", 6));
  }
  for (const [x, y] of [[-52, 10], [-56, 30], [-50, -20]] as const) g.push(cylinderAt({ radius: 3.4, height: 20, segments: 8, bottom: [x, y, 84] }, "Oldgrowth_RedDrink"), cylinderBetween([x, y, 102], [x + 3, y + 2, 116], 0.6, 3, "FabricWhite"));
  g.push(garland([-20, -60, 86], 18, 8), garland([0, 70, 86], 16, -6), garland([-74, 0, 70], 22, 80));
  for (const [x, y, s, m] of [[0, 20, 22, "Oldgrowth_WhiteStone"], [-120, -60, 34, "Oldgrowth_WhiteStone"], [-130, 50, 28, "Oldgrowth_TempleDark"], [-110, 130, 20, "Oldgrowth_WhiteStone"], [-140, -140, 24, "Oldgrowth_TempleDark"]] as const)
    g.push(translate(figurine(s, m), [x, y, x === 0 ? 84 : 0]));
  g.push(cylinderAt({ radius: 3.5, height: 260, segments: 6, bottom: [60, -150, 0] }, "Oldgrowth_Twig"), boxBounds([61, -152, 196], [63, -112, 256], "Oldgrowth_SilkSaffron"));
  ["Oldgrowth_SilkPink", "Oldgrowth_SilkSaffron", "Oldgrowth_SilkGreen"].forEach((m, i) => g.push(cylinderAt({ radius: 5.5, height: 12, segments: 8, bottom: [60, -150, 80 + i * 12] }, m)));
  return merge(...g);
}

// =================================== the first tree ===================================

// The first tree's nine root arches: the bearing each leaves the trunk on, how far out its foot is,
// how high it rises (a field keeps its feet solid, the ground under the arches open).
export const FIRST_ROOTS: { a: number; out: number; hz: number; z0: number }[] = (() => {
  const rnd = seeded(502);
  return Array.from({ length: 9 }, (_, k) => ({ a: (k / 9) * Math.PI * 2 + rnd() * 0.3, out: 1400 + rnd() * 320, hz: 540 + rnd() * 140, z0: 300 + rnd() * 180 }));
})();

// The first tree (30 m across its crown, 39 m tall): a trunk nine metres through of stems wound
// round one another, its bark gold and glowing in its grooves; nine great roots leave it high up
// and arch out over the ground to fifteen metres and more, so high one walks beneath them; massive
// limbs and a crown of golden leaves that shine, golden strands hanging from it, motes of light
// drifting under it.
function firstTree(): THREE.Group {
  const rnd = seeded(501), GB = "Oldgrowth_GoldBark", GV = "Oldgrowth_GoldVein", wood: Geo[] = [], glow: Geo[] = [], crowns: Lobe[] = [];
  const R = 430, FORK = 1900, CROWN = 3100, REACH = 1150;
  wood.push(limb([[0, 0, -40], [20, -10, 500], [40, -20, 1000], [50, -10, FORK], [60, 0, FORK + 450]], R, R * 0.55, GB, { seg: 18, flare: 0.35, roots: 10, gnarl: 1, seed: 501, step: 110, maxRings: 22, taper: 0.7 }));
  for (let k = 0; k < 6; k++) {
    const a0 = (k / 6) * Math.PI * 2, stem: V3[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, a = a0 + t * 1.3, r = R * 0.86 * (1 - 0.36 * t);
      stem.push(polar(a, r, -30 + t * (FORK + 260)));
    }
    wood.push(limb(stem, R * 0.3, R * 0.17, GB, { seg: 10, gnarl: 0.8, seed: 510 + k, maxRings: 16 }));
  }
  // the root arches, each with a smaller root spreading from its foot and a glowing vein along its back
  for (const { a, out, hz, z0 } of FIRST_ROOTS) {
    const k = FIRST_ROOTS.findIndex((r) => r.a === a);
    const pts: V3[] = [polar(a, R * 0.7, z0), polar(a + 0.04, R + 260, hz + 130), polar(a + 0.08, R + 620, hz + 60), polar(a + 0.12, out - 320, hz * 0.72), polar(a + 0.14, out - 70, 170), polar(a + 0.15, out + 80, -20)];
    wood.push(limb(pts, 130, 62, GB, { seg: 12, gnarl: 0.8, seed: 520 + k, step: 90, maxRings: 22 }));
    wood.push(limb([polar(a + 0.14, out - 60, 60), polar(a + 0.24, out + 120, 2), polar(a + 0.32, out + 300, -15)], 52, 12, GB, { seg: 8, gnarl: 0.6, seed: 530 + k, maxRings: 6 }));
    wood.push(limb([polar(a + 0.12, out - 40, 50), polar(a + 0.02, out + 140, 0), polar(a - 0.06, out + 280, -15)], 44, 10, GB, { seg: 8, gnarl: 0.6, seed: 535 + k, maxRings: 6 }));
    const lift = [124, 112, 98, 86, 72, 58];
    glow.push(limb(pts.slice(0, 5).map((p, i) => [p[0], p[1], p[2] + lift[i] * 0.9] as V3), 6, 4, GV, { seg: 5, maxRings: 20 }));
  }
  // the limbs and the crown
  for (let k = 0; k < 7; k++) {
    const a = ((k + rnd() * 0.4) / 7) * Math.PI * 2 + 0.2, Rr = REACH * (0.8 + rnd() * 0.3), z0 = FORK - 80 + rnd() * 300;
    const pts: V3[] = [polar(a, R * 0.25, z0), polar(a + 0.12, Rr * 0.45, z0 + (CROWN - z0) * 0.45 + 90), polar(a + 0.2, Rr, CROWN + (rnd() - 0.5) * 200)];
    wood.push(limb(pts, R * 0.34, R * 0.09, GB, { seg: 10, gnarl: 0.7, step: 90, maxRings: 10, seed: 540 + k }));
    crowns.push([pts[2][0], pts[2][1], pts[2][2] + 160, 500 + rnd() * 100, 480 + rnd() * 100, 260]);
    const sp = along(pts, 0.55), sa = a + (rnd() < 0.5 ? -1 : 1) * 0.7, stip: V3 = [sp[0] + Math.cos(sa) * Rr * 0.5, sp[1] + Math.sin(sa) * Rr * 0.5, CROWN - 100 + rnd() * 150];
    wood.push(limb([sp, lerp3(sp, stip, 0.5), stip], R * 0.13, R * 0.04, GB, { seg: 7, maxRings: 6, seed: 550 + k }));
    crowns.push([stip[0], stip[1], stip[2] + 90, 340, 320, 180]);
    for (let j = 0; j < 6; j++) {
      const p = along(pts, 0.3 + j * 0.11), L = 180 + rnd() * 380;
      glow.push(cylinderAt({ rBot: 1.5, rTop: 4, height: L, segments: 4, bottom: [p[0] + (rnd() - 0.5) * 40, p[1] + (rnd() - 0.5) * 40, p[2] - 40 - L] }, GV));
    }
  }
  crowns.push([40, 0, CROWN + 420, 860, 830, 400]);
  const can = canopy(crowns, 190, 560, GOLD, { density: 0.9, ragged: 0.6, sun: 0.1 }, 4, ["#ffb83a", 0.55]);
  // motes of light drifting in and under the crown
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, r = 300 + Math.sqrt(rnd()) * 1500, z = 300 + rnd() * 3000;
    glow.push(sphereCenter(3 + rnd() * 4, polar(a, r, z), "Oldgrowth_Firefly", 4));
  }
  const moss = coverTop(wood.flat().filter((p) => p.mat === GB), "Oldgrowth_MossThick", { amount: 0.22, thick: 4, seed: 570, grain: 80, patches: 0.5 });
  const lights = noShadow(toThree(merge(...glow), material));
  return group(merge(...wood, moss, can.core), can.mesh, lights, ferns([0, 1, 2, 3, 4].map((i) => ({ at: polar(i * 1.26 + 0.3, R * 1.45, 0), n: 8, len: 140, seed: 580 + i }))));
}

// Golden mist (16 x 7 m, about 2 m deep): soft puffs lying low in a hollow, see-through and
// shining gold, no shadow.
function goldMist(): THREE.Group {
  const rnd = seeded(601), list: { r: V3; c: V3 }[] = [];
  for (let i = 0; i < 12; i++) list.push({ r: [180 + rnd() * 220, 130 + rnd() * 150, 45 + rnd() * 50], c: [(rnd() - 0.5) * 1300, (rnd() - 0.5) * 480, 20 + rnd() * 80] });
  for (let i = 0; i < 4; i++) list.push({ r: [260 + rnd() * 160, 170 + rnd() * 80, 30], c: [(rnd() - 0.5) * 1000, (rnd() - 0.5) * 340, 150 + rnd() * 50] });
  return puffs(list, mistMat("#ffe9b0", "#e0a840", 0.55, 0.16), 12);
}

// A swarm of golden fireflies (4 m, 1-3.2 m up): hundreds of motes of light gathered in the shape
// of a butterfly's wings, stragglers drifting round it.
function fireflySwarm(): THREE.Group {
  const rnd = seeded(611), g: Geo[] = [];
  for (let i = 0; i < 150; i++) {
    const wing = i % 2 ? 1 : -1, t = rnd() * Math.PI * 2, rr = Math.sqrt(rnd());
    const lobe = rnd() < 0.6 ? [70, 110, 50] : [-60, 80, 40];
    const y = wing * (30 + Math.abs(Math.cos(t)) * lobe[1] * rr), z = 200 + lobe[0] * 0.6 + Math.sin(t) * lobe[2] * rr * 1.2;
    g.push(sphereCenter(2.4 + rnd() * 2.2, [(rnd() - 0.5) * 40, y, z], "Oldgrowth_Firefly", 4));
  }
  for (let i = 0; i < 40; i++) g.push(sphereCenter(2 + rnd() * 2, [(rnd() - 0.5) * 380, (rnd() - 0.5) * 380, 100 + rnd() * 220], "Oldgrowth_Firefly", 4));
  const halo = toThree(merge(sphereCenter(1, [0, 0, 0], "halo", 10).map((p) => ({ geo: p.geo.scale(60, 190, 110).translate(0, 0, 230), mat: p.mat }))), () => mistMat("#fff0b0", "#ffc840", 1, 0.08));
  return noShadow(group(merge(...g), halo));
}

// =================================== the kit ===================================

export const KIT: Kit = {
  id: "oldgrowth",
  name: "ป่าดึกดำบรรพ์และป่าศักดิ์สิทธิ์",
  region: "ป่าเก่าแก่ทางตะวันตกและใต้",
  desc: "ปรงยักษ์ ดงเฟิร์น ต้นไม้มอสยักษ์ รอยเท้าและรังไข่สัตว์ยักษ์ โครงกระดูกหิน น้ำตกลงทะเล · ไทรรากอากาศ วิหารที่ไทรกลืน ใบหน้าหินรากรัด เสาวิหารจมน้ำ เรือหินโบราณ เห็ดเรืองแสง ซุ้มราก · ไทรศักดิ์สิทธิ์พันผ้าแพร เจดีย์ในราก ช้างเผือก กระทงลอยโคม · ต้นไม้แรกเรืองแสงทอง หมอกทอง หิ่งห้อย",
  ground: "moss",
  sea: true,
  items: [
    // the primeval forest
    { id: "cycad", name: "ปรงยักษ์", make: cycad, tags: ["plant"] },
    { id: "fern_bed", name: "ดงเฟิร์นดึกดำบรรพ์", make: fernBed, tags: ["plant"] },
    { id: "moss_giant", name: "ต้นไม้มอสยักษ์", make: mossGiant, tags: ["landmark", "plant"] },
    { id: "moss_boulders", name: "กองหินมอส", make: mossBoulders, tags: ["rock"] },
    { id: "moss_slabs", name: "แผ่นหินมอส", make: mossSlabs, tags: ["rock", "ground"] },
    { id: "fallen_moss_giant", name: "ซากต้นไม้มอสยักษ์ล้ม", make: fallenMossGiant, tags: ["log", "decor"] },
    { id: "giant_stump", name: "ตอไม้ยักษ์ผุ", make: giantStump, tags: ["log", "decor"] },
    { id: "dino_tracks", name: "รอยเท้าสัตว์ยักษ์", make: dinoTracks, tags: ["ground", "decor"] },
    { id: "egg_nest", name: "รังไข่ยักษ์", make: eggNest, tags: ["decor", "landmark"] },
    { id: "stone_skeleton", name: "โครงกระดูกกลายเป็นหิน", make: stoneSkeleton, tags: ["landmark"] },
    { id: "sea_falls", name: "น้ำตกลงทะเล (6.6 ม.)", make: seaFalls, tags: ["water", "landmark"] },
    // the sunken temple
    { id: "banyan", name: "ต้นไทรรากอากาศ", make: banyan, tags: ["plant"] },
    { id: "banyan_temple", name: "วิหารที่ไทรกลืน", make: banyanTemple, tags: ["landmark", "ruin"] },
    { id: "root_face", name: "ใบหน้าหินรากรัด", make: rootFace, tags: ["landmark", "ruin"] },
    { id: "sunken_pillars", name: "เสาวิหารจมน้ำ (9 ม.)", make: sunkenPillars, tags: ["ruin"] },
    { id: "stone_boat", name: "เรือหินโบราณ", make: stoneBoat, tags: ["ruin", "boat"] },
    { id: "glow_shrooms", name: "เห็ดเรืองแสงต้นสูง", make: glowShrooms, tags: ["plant", "light", "magic"] },
    { id: "root_arch", name: "ซุ้มรากไม้", make: rootArch, tags: ["gate", "plant"] },
    // the sacred banyan
    { id: "sacred_banyan", name: "ไทรยักษ์ศักดิ์สิทธิ์", make: sacredBanyan, tags: ["landmark", "plant"] },
    { id: "root_chedi", name: "เจดีย์ในรากไทร", make: rootChedi, tags: ["landmark", "ruin"] },
    { id: "white_elephant", name: "รูปปั้นช้างเผือก", make: whiteElephant, tags: ["landmark", "decor"] },
    { id: "lantern_float", name: "กระทงลอยโคม", make: lanternFloat, tags: ["light", "decor", "ground"] },
    { id: "offering_shrine", name: "โต๊ะของเซ่นไหว้", make: offeringShrine, tags: ["decor", "magic"] },
    // the first tree
    { id: "first_tree", name: "ต้นไม้แรกของโลก", make: firstTree, tags: ["landmark", "plant", "light"] },
    { id: "gold_mist", name: "ทะเลหมอกทอง", make: goldMist, tags: ["ground", "decor"] },
    { id: "firefly_swarm", name: "ฝูงหิ่งห้อยทอง", make: fireflySwarm, tags: ["light", "decor"] },
  ],
  sample(put: Put) {
    // a corner where the old woods meet: the primeval forest's cycads, ferns and mossy stones and
    // the nest by a giant's tracks (west); the sacred banyan's court with its white elephants, an
    // offering table and a chedi in the roots (east); an arch of roots between them; a flooded
    // colonnade, the stone barge and floating lanterns at the water's edge (south, -Y)
    put("sacred_banyan", [600, -300, 0], 0, 0.8);
    put("white_elephant", [-1100, -450, 0], 0, 0.9);
    put("white_elephant", [-1100, 450, 0], 0, 0.9);
    put("offering_shrine", [-250, -300, 0], 0);
    put("root_chedi", [1500, -1500, 0], 20, 0.9);
    put("root_arch", [-500, 900, 0], 90, 0.9);
    put("cycad", [-1300, 1700, 0], 30);
    put("cycad", [300, 1900, 0], 140, 0.8);
    put("fern_bed", [-400, 1700, 0], 10);
    put("fern_bed", [1200, 1400, 0], 80, 0.9);
    put("egg_nest", [900, 700, 0], 0, 0.8);
    put("dino_tracks", [-1700, 600, 0], 20, 0.8);
    put("moss_boulders", [1900, 400, 0], 40, 0.8);
    put("moss_slabs", [-1900, -600, 0], 0);
    put("giant_stump", [1900, 1900, 0], 0, 0.8);
    put("glow_shrooms", [-1800, -1500, 0], 30);
    put("banyan", [-1500, -1100, 0], 0, 0.7);
    put("gold_mist", [200, 400, 0], 10, 0.6);
    put("firefly_swarm", [-700, 0, 0], 0);
    put("sunken_pillars", [-1200, -2700, -12], 90);
    put("stone_boat", [600, -2900, -12], 80, 0.8);
    put("lantern_float", [-100, -2600, -12], 0);
    put("lantern_float", [1500, -2500, -12], 60);
    for (const [x, y, s] of [[-2000, 1500, 0.9], [2100, -400, 0.8], [-300, 2100, 1]] as const) put("jungle:giant_fern", [x, y, 0], x, s);
    for (const [x, y] of [[2100, 1100], [-2000, 2000]] as const) put("flora:JungleTree", [x, y, 0], x);
  },
};

// ---- for the fields: the sea's water sheet, reaching `under` cm in under the land all along the
// shore so no gap shows at the water's edge (world cm, north +X, west +Y; a mesh in the ground's
// terms, Y up). `shore` runs along the coast, `closing` the corners that close it round the sea.
type XY2 = [number, number];
function inPoly2(poly: XY2[], x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
export function seaSheet(shore: XY2[], closing: XY2[], under: number, z: number, mat: string): THREE.Mesh {
  const sea = [...shore, ...closing];
  const moved = shore.map(([x, y], i): XY2 => {
    const a = shore[Math.max(0, i - 1)], b = shore[Math.min(shore.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    if (inPoly2(sea, x + nx * 60, y + ny * 60)) [nx, ny] = [-nx, -ny];
    return [x + nx * under, y + ny * under];
  });
  const geo = new THREE.ShapeGeometry(new THREE.Shape([...moved, ...closing].map(([x, y]) => new THREE.Vector2(x, y))));
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
