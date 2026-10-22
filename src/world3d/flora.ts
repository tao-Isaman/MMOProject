// Plants of the other lands that the crown trees (trees.ts) don't cover: palms (drooping fronds
// on a ringed trunk), firs as tiers of needle boughs (with or without snow), bamboo and cacti;
// and `plant(name)`, one place to get any tree or plant.
//
// Like everything in src/world3d these are built from code at start-up, in centimetres with
// Z up; each name is built once and cloned.

import * as THREE from "three";
import { merge, sphereCenter, toThree } from "./geo";
import type { Geo, V3 } from "./geo";
import { material, flowerCell, FLOWER_CELLS } from "./textures";
import { tree, TREES, limb, along, LeafCards, foliage, CANOPY, treeObject, Cards, frond } from "./trees";
import type { Lobe } from "./trees";

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
const UP = new THREE.Vector3(0, 0, 1);
const lin = (r: number, g: number, b: number, k = 1.6) => new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace).multiplyScalar(k);

// ---- palm: a leaning ringed trunk swelling at the foot, a crown of arching fronds that droop
// at the tips (young ones rising in the middle, old ones lower, a few dead ones hanging), a
// cluster of coconuts under them ----
function palm(seed: number, height: number, lean: number, fronds: number): THREE.Group {
  const rnd = seeded(seed);
  const at = (t: number): V3 => [lean * height * 0.01 * t * t * 1.6, 0, height * t]; // bends away along +X, more near the top
  const parts: Geo[] = [limb([0, 0.25, 0.5, 0.75, 1].map(at), 17, 11, "BarkPalm", { seg: 8, step: 55, flare: 0.5, seed, maxRings: 14 })];
  const top = new THREE.Vector3(...at(1)), axis = new THREE.Vector3(lean * height * 0.01 * 3.2, 0, height).normalize();
  // the crown's head and the coconuts
  parts.push(limb([top.clone().addScaledVector(axis, -16).toArray() as V3, top.clone().addScaledVector(axis, 10).toArray() as V3], 12.5, 10, "BarkPalm", { seg: 8, dome: true }));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + rnd();
    parts.push(sphereCenter(8.5, [top.x + Math.cos(a) * 14, top.y + Math.sin(a) * 14, top.z - 14 - (i % 2) * 7], "Palm_Coconut", 6));
  }
  const cards = new LeafCards();
  const head = top.clone().addScaledVector(axis, 4);
  for (let f = 0; f < fronds; f++) {
    const yaw = (f / fronds) * Math.PI * 2 + rnd() * 0.45, young = f % 3 === 0;
    const lift = young ? 0.62 + rnd() * 0.25 : f % 3 === 1 ? 0.38 + rnd() * 0.2 : 0.1 + rnd() * 0.2;
    const shade = young ? 1.04 : f % 3 === 1 ? 0.94 : 0.84;
    frond(cards, {
      at: head.clone().add(new THREE.Vector3(Math.cos(yaw) * 5, Math.sin(yaw) * 5, 0)).toArray() as V3,
      yaw, lift, droop: (young ? 1.45 : 1.8) + rnd() * 0.3, len: height * 0.35 * (0.88 + rnd() * 0.24), w: 42 + rnd() * 8, fold: 0.34 + rnd() * 0.16, segs: 7,
      base: lin(84 * shade, 120 * shade, 50 * shade), tip: lin(160 * shade, 204 * shade, 90 * shade), twist: (rnd() - 0.5) * 0.6,
    });
  }
  for (let f = 0; f < 3; f++) {
    const yaw = rnd() * Math.PI * 2;
    frond(cards, {
      at: head.clone().add(new THREE.Vector3(Math.cos(yaw) * 6, Math.sin(yaw) * 6, -10)).toArray() as V3,
      yaw, lift: -0.9 - rnd() * 0.3, droop: 0.5, len: height * 0.26, w: 22, fold: 1.0, segs: 4,
      base: lin(110, 84, 46), tip: lin(168, 136, 80),
    });
  }
  return treeObject(merge(...parts), [cards, "frond"]);
}

// ---- firs: a straight trunk carrying tier on tier of drooping boughs, each a spray of needles
// (a card bent along its length), round a dark needly core; the tiers narrow to a leader at the
// top. Snowy firs droop more and their sprays carry snow. ----
function pine(seed: number, height: number, snowy: boolean): THREE.Group {
  const rnd = seeded(seed);
  const maxR = height * 0.3, base = height * 0.15;
  const parts: Geo[] = [
    limb([[0, 0, 0], [3, 2, height * 0.5], [0, 0, height * 0.97]], height * 0.032, height * 0.005, "BarkWarm", { seg: 7, step: height * 0.1, flare: 0.6, roots: 4, seed, gnarl: 0.4, taper: 0.8 }),
    // the core: dark needles inside the tiers, so no sky shows through the middle
    limb([[0, 0, base + height * 0.04], [0, 0, height * 0.9]], maxR * 0.4, height * 0.01, snowy ? "CanopyCoreFirSnow" : "CanopyCoreFir", { seg: 9, step: height * 0.16, gnarl: 1, seed: seed + 1 }),
  ];
  const cards = new LeafCards(), col = new THREE.Color();
  const shade = (v: number) => col.setRGB(v, v, v, THREE.SRGBColorSpace).clone();
  const tiers = Math.round(7 + height / 170);
  // a bough from the trunk at height z heading yaw, `len` long and `w` wide, drooping by `droop`
  const bough = (z: number, yaw: number, len: number, w: number, droop: number, v0: number, v1: number) => {
    const dir = new THREE.Vector3(Math.cos(yaw), Math.sin(yaw), 0), side = new THREE.Vector3(-Math.sin(yaw), Math.cos(yaw), 0);
    const segs = 3, pts: THREE.Vector3[] = [new THREE.Vector3(0, 0, z).addScaledVector(dir, len * 0.06)];
    for (let k = 1; k <= segs; k++) {
      const ang = 0.12 - droop * ((k - 0.5) / segs) ** 1.2;
      pts.push(pts[k - 1].clone().addScaledVector(dir, (len / segs) * Math.cos(ang)).add(new THREE.Vector3(0, 0, (len / segs) * Math.sin(ang))));
    }
    const roll = (rnd() - 0.5) * 0.4;
    const s = side.clone().applyAxisAngle(dir, roll).multiplyScalar(w / 2);
    const n = dir.clone().multiplyScalar(0.45).addScaledVector(UP, 0.9).normalize();
    for (let k = 0; k < segs; k++) {
      const u0 = k / segs, u1 = (k + 1) / segs, c0 = shade(v0 + (v1 - v0) * u0), c1 = shade(v0 + (v1 - v0) * u1);
      cards.quad([pts[k].clone().sub(s), pts[k + 1].clone().sub(s), pts[k + 1].clone().add(s), pts[k].clone().add(s)], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]], n, [c0, c1, c1, c0]);
    }
  };
  for (let w = 0; w < tiers; w++) {
    const t = w / (tiers - 1); // 0 bottom .. 1 top
    const z = base + (height * 0.9 - base) * Math.pow(t, 0.92);
    const R = maxR * Math.pow(1 - t, 0.9) + height * 0.045;
    const n = Math.max(5, Math.round(8 - 3 * t)), twist = rnd() * Math.PI * 2;
    const droop = (snowy ? 0.75 : 0.55) * (1 - 0.45 * t) + (rnd() - 0.5) * 0.1;
    const light = 0.72 + 0.22 * t;
    for (let b = 0; b < n; b++) {
      const yaw = twist + (b / n) * Math.PI * 2 + (rnd() - 0.5) * 0.35;
      const len = R * (0.92 + rnd() * 0.2), wid = Math.min(len * 0.75, ((2 * Math.PI * R) / n) * 1.05);
      bough(z, yaw, len, wid, droop, 0.5 * light, light + 0.08);
      // a shorter bough above, between these two, to fill the tier out
      bough(z + R * 0.12, yaw + Math.PI / n, len * 0.68, wid * 0.8, droop * 0.9, 0.55 * light, light + 0.12);
    }
  }
  // the leader: two crossed sprays standing up at the top
  const top = new THREE.Vector3(0, 0, height * 0.97);
  for (const a of [0, Math.PI / 2]) cards.add(top.toArray() as V3, UP, new THREE.Vector3(Math.cos(a), Math.sin(a), 0), height * 0.13, height * 0.07, new THREE.Vector3(Math.cos(a + 1), Math.sin(a + 1), 0.8).normalize(), shade(1));
  return treeObject(merge(...parts), [cards, snowy ? "boughSnow" : "bough"]);
}

// ---- bamboo: a clump of canes arching out a little, sprays of narrow leaves hanging from
// their upper thirds ----
function bamboo(seed: number, canes: number): THREE.Group {
  const rnd = seeded(seed);
  const parts: Geo[] = [], lobes: Lobe[] = [];
  for (let i = 0; i < canes; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 55;
    const x = Math.cos(a) * d, y = Math.sin(a) * d, h = 480 + rnd() * 320, r = 3.5 + rnd() * 2.5;
    const tip: V3 = [x + Math.cos(a) * 30 + (rnd() - 0.5) * 50, y + Math.sin(a) * 30 + (rnd() - 0.5) * 50, h];
    const pts: V3[] = [[x, y, 0], [x + (tip[0] - x) * 0.3, y + (tip[1] - y) * 0.3, h * 0.5], tip];
    parts.push(limb(pts, r, r * 0.7, i % 3 ? "Bamboo" : "BambooDry", { seg: 5, step: 200 }));
    for (const t of [0.5, 0.63, 0.76, 0.88, 0.98]) {
      const p = along(pts, t);
      lobes.push([p[0] + (rnd() - 0.5) * 40, p[1] + (rnd() - 0.5) * 40, p[2], 50 + rnd() * 22, 50 + rnd() * 22, 36 + rnd() * 10]);
    }
  }
  const cards = new LeafCards();
  parts.push(foliage({ seed: seed + 5, lobes, leaf: 52, look: CANOPY.bamboo, density: 0.95, hang: 0.6, flat: 0, ragged: 0.9, under: 0.7 }, cards));
  return treeObject(merge(...parts), [cards, "lance"]);
}

// ---- cacti: smooth ribbed columns with rounded tips ----
function cactus(seed: number, tall: boolean): THREE.Group {
  const rnd = seeded(seed);
  if (!tall) {
    // a round barrel cactus, deep ribs, a few pink flowers on top
    const prof: THREE.Vector2[] = [];
    for (let k = 0; k <= 6; k++) {
      const a = (k / 6) * Math.PI * 0.95;
      prof.push(new THREE.Vector2(Math.max(0.5, Math.sin(a) * 28), 22 - Math.cos(a) * 24));
    }
    const geo = new THREE.LatheGeometry(prof, 16);
    geo.rotateX(Math.PI / 2);
    const pos = geo.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), a = Math.atan2(y, x), f = 0.9 + 0.1 * Math.abs(Math.cos(a * 6));
      pos.setXYZ(i, x * f, y * f, Math.max(0, pos.getZ(i) * 0.95));
    }
    geo.computeVertexNormals();
    const uv = geo.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * 0.6);
    const flowers = new Cards();
    for (const [a, c] of [[0, FLOWER_CELLS.cosmosPink], [1.6, FLOWER_CELLS.rosePink]] as const)
      flowers.facing("FlowerCards", [Math.cos(a) * 4, Math.sin(a) * 4, 45], new THREE.Vector3(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 1), a, 16, 16, UP, flowerCell(c));
    return toThree(merge([{ geo, mat: "CactusGreen" }], flowers.geo()), material);
  }
  const h = 230 + rnd() * 80, r = 20;
  const parts: Geo[] = [limb([[0, 0, 0], [2, 1, h * 0.5], [0, 0, h - r]], r * 1.06, r, "CactusGreen", { seg: 10, step: 70, dome: true, flare: 0.12 })];
  for (const side of [1, -1]) {
    if (side < 0 && rnd() < 0.3) continue;
    const z = h * (0.35 + rnd() * 0.25), out = 45 + rnd() * 15, up = 50 + rnd() * 50, ra = r * 0.62;
    parts.push(limb([[0, 0, z], [side * out * 0.55, 0, z + 2], [side * out, 0, z + 22], [side * out, 0, z + 8 + up]], ra, ra * 0.94, "CactusGreen", { seg: 8, step: 22, dome: true, maxRings: 9 }));
  }
  return toThree(merge(...parts), material);
}

// ---- every plant by name ----
const MAKERS: Record<string, () => THREE.Object3D> = {
  Palm: () => palm(3, 620, 10, 13),
  PalmTall: () => palm(5, 820, 16, 14),
  PalmBent: () => palm(9, 560, 30, 12),
  Pine: () => pine(4, 700, false),
  PineSmall: () => pine(8, 420, false),
  SnowPine: () => pine(6, 720, true),
  SnowPineSmall: () => pine(10, 400, true),
  Bamboo: () => bamboo(12, 9),
  Cactus: () => cactus(14, true),
  CactusRound: () => cactus(16, false),
};
for (const name of Object.keys(TREES)) MAKERS[name] = () => tree(name);

export const PLANTS = Object.keys(MAKERS);

const built = new Map<string, THREE.Object3D>();
export function plant(name: string): THREE.Object3D {
  let p = built.get(name);
  if (!p) {
    const make = MAKERS[name];
    if (!make) throw new Error(`no plant called ${name}`);
    built.set(name, (p = make()));
  }
  return p.clone();
}
