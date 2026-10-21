// Plants of the other lands that the leaf-card trees (trees.ts) don't cover: palms, pines (with
// or without snow), bamboo and cacti; and `plant(name)`, one place to get any tree or plant.
//
// Like everything in src/world3d these are built from code at start-up, in centimetres with
// Z up; each name is built once and cloned.

import * as THREE from "three";
import { merge, cylinderAt, cylinderBetween, sphereCenter, scale, toThree, rotateZ } from "./geo";
import type { Geo, V3 } from "./geo";
import { material, frondTexture, LEAVES, leafClump } from "./textures";
import { tree, TREES, leafMaterials, leaves } from "./trees";

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

const ZUP_TO_YUP = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);

// zUp: the geometry is still in Oriverse axes (trees.leaves() hands it over already turned)
function swaying(geo: THREE.BufferGeometry, key: string, canvas?: () => HTMLCanvasElement, zUp = true): THREE.Mesh {
  if (zUp) geo.applyMatrix4(ZUP_TO_YUP);
  const [mat, depth] = leafMaterials(key, canvas);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.customDepthMaterial = depth;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ---- palm: a leaning, ringed trunk and drooping fronds ----
function palm(seed: number, height: number, lean: number, fronds: number): THREE.Group {
  const rnd = seeded(seed);
  const parts: Geo[] = [];
  const n = 8;
  const at = (t: number): V3 => {
    // bends away along +X, more near the top
    const x = lean * height * 0.01 * t * t * 1.6;
    return [x, 0, height * t];
  };
  for (let i = 0; i < n; i++) {
    const a = at(i / n), b = at((i + 1) / n), r = 16 - 6 * (i / n);
    parts.push(cylinderBetween(a, b, r, 8, i % 2 ? "BarkPalm" : "WoodPale", r - 0.8));
  }
  const top = at(1);
  parts.push(sphereCenter(18, top, "BarkPalm", 8));
  // coconuts
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + rnd();
    parts.push(sphereCenter(9, [top[0] + Math.cos(a) * 16, top[1] + Math.sin(a) * 16, top[2] - 12], "WoodDark", 8));
  }
  const group = toThree(merge(...parts), material);

  // fronds: strips of quads from the crown, rising then drooping
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], col: number[] = [];
  const segs = 7, len = height * 0.42, wid = 70;
  for (let f = 0; f < fronds; f++) {
    const yaw = (f / fronds) * Math.PI * 2 + rnd() * 0.4;
    const lift = 0.7 - rnd() * 0.4;
    const dir = new THREE.Vector3(Math.cos(yaw), Math.sin(yaw), 0), side = new THREE.Vector3(-Math.sin(yaw), Math.cos(yaw), 0);
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= segs; k++) {
      const t = k / segs, ang = lift - t * 1.9; // elevation drops along the frond
      const p = k === 0 ? new THREE.Vector3(...top) : pts[k - 1].clone().add(dir.clone().multiplyScalar((len / segs) * Math.cos(ang))).add(new THREE.Vector3(0, 0, (len / segs) * Math.sin(ang)));
      pts.push(p);
    }
    const shade = 0.8 + rnd() * 0.2;
    for (let k = 0; k < segs; k++) {
      const w0 = (wid / 2) * Math.sin(((k + 0.3) / segs) * Math.PI * 0.95 + 0.1), w1 = (wid / 2) * Math.sin(((k + 1.3) / segs) * Math.PI * 0.95 + 0.1);
      const a0 = pts[k].clone().addScaledVector(side, -w0), a1 = pts[k].clone().addScaledVector(side, w0);
      const b0 = pts[k + 1].clone().addScaledVector(side, -w1), b1 = pts[k + 1].clone().addScaledVector(side, w1);
      const u0 = k / segs, u1 = (k + 1) / segs;
      for (const [p, u, v] of [[a0, u0, 0], [b0, u1, 0], [b1, u1, 1], [a0, u0, 0], [b1, u1, 1], [a1, u0, 1]] as [THREE.Vector3, number, number][]) {
        pos.push(p.x, p.y, p.z);
        nor.push(0, 0, 1);
        uv.push(u, v);
        col.push(shade, shade, shade);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  group.add(swaying(geo, "frond", () => frondTexture()));
  return group;
}

// ---- pines: stacked cones on a short trunk; snowy ones wear a white cap on each tier ----
function pine(seed: number, height: number, snowy: boolean): THREE.Group {
  const rnd = seeded(seed);
  const parts: Geo[] = [cylinderAt({ rBot: height * 0.035, rTop: height * 0.02, height: height * 0.35, segments: 8, bottom: [0, 0, 0] }, "BarkWarm")];
  const tiers = 5;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const r = height * (0.3 - 0.21 * t) * (0.92 + rnd() * 0.16);
    const h = height * 0.32;
    const z = height * (0.2 + 0.15 * i);
    const cone = rotateZ(cylinderAt({ rBot: r, rTop: r * 0.06, height: h, segments: 9, bottom: [0, 0, z] }, "PineNeedle"), rnd() * 40);
    parts.push(cone);
    if (snowy) {
      // a thinner cone just above the tier's upper half: snow lying on the branches
      const cap = cylinderAt({ rBot: r * 0.78, rTop: r * 0.05, height: h * 0.62, segments: 9, bottom: [0, 0, z + h * 0.4] }, "Snow");
      parts.push(scale(rotateZ(cap, rnd() * 40), [1, 1, 1.02], [0, 0, z + h * 0.4]));
    }
  }
  return toThree(merge(...parts), material);
}

// ---- bamboo: a clump of canes with narrow leaves near the top ----
function bamboo(seed: number, canes: number): THREE.Group {
  const rnd = seeded(seed);
  const parts: Geo[] = [];
  const crowns: [number, number, number, number, number, number][] = [];
  for (let i = 0; i < canes; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 55;
    const x = Math.cos(a) * d, y = Math.sin(a) * d, h = 480 + rnd() * 320, r = 3.5 + rnd() * 2.5;
    const tip: V3 = [x + (rnd() - 0.5) * 70, y + (rnd() - 0.5) * 70, h];
    parts.push(cylinderBetween([x, y, 0], tip, r, 7, i % 3 ? "Bamboo" : "BambooDry", r * 0.75));
    crowns.push([tip[0], tip[1], h * 0.86, 70, 70, h * 0.13]);
  }
  const group = toThree(merge(...parts), material);
  group.add(swaying(leaves({ crowns, leafSize: 45, density: 0.9 }, rnd), "bamboo", () => leafClump(LEAVES.bamboo), false));
  return group;
}

// ---- cacti ----
function cactus(seed: number, tall: boolean): THREE.Group {
  const rnd = seeded(seed);
  if (!tall) {
    // a round barrel cactus
    const body = scale(sphereCenter(28, [0, 0, 22], "CactusGreen", 12), [1, 1, 0.9], [0, 0, 0]);
    const flower = sphereCenter(5, [0, 0, 45], "FabricRed", 6);
    return toThree(merge(body, flower), material);
  }
  const h = 230 + rnd() * 80, r = 20;
  const parts: Geo[] = [cylinderAt({ radius: r, height: h, segments: 10, bottom: [0, 0, 0] }, "CactusGreen"), sphereCenter(r, [0, 0, h], "CactusGreen", 10)];
  for (const side of [1, -1]) {
    if (side < 0 && rnd() < 0.3) continue;
    const z = h * (0.35 + rnd() * 0.25), out = 45 + rnd() * 15, up = 50 + rnd() * 50;
    const a: V3 = [0, 0, z], b: V3 = [side * out, 0, z + 8], c: V3 = [side * out, 0, z + 8 + up];
    parts.push(cylinderBetween(a, b, r * 0.62, 8, "CactusGreen"), sphereCenter(r * 0.62, b, "CactusGreen", 8), cylinderBetween(b, c, r * 0.62, 8, "CactusGreen"), sphereCenter(r * 0.62, c, "CactusGreen", 8));
  }
  return toThree(merge(...parts), material);
}

// ---- every plant by name ----
const MAKERS: Record<string, () => THREE.Object3D> = {
  Palm: () => palm(3, 620, 10, 9),
  PalmTall: () => palm(5, 820, 16, 10),
  PalmBent: () => palm(9, 560, 30, 8),
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
