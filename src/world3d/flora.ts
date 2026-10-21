// Plants of the other lands that the leaf-card trees (trees.ts) don't cover: palms, pines (with
// or without snow), bamboo and cacti; and `plant(name)`, one place to get any tree or plant.
//
// Like everything in src/world3d these are built from code at start-up, in centimetres with
// Z up; each name is built once and cloned.

import * as THREE from "three";
import { merge, cylinderAt, cylinderBetween, sphereCenter, scale, toThree } from "./geo";
import type { Geo, V3 } from "./geo";
import { material, frondTexture, needleTexture, LEAVES, leafClump } from "./textures";
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

// ---- pines: a straight trunk with whorls of drooping boughs, each bough carrying sprays of
// needles (cards, like the other trees' leaves) around a dark core that gives the tree its mass.
// Snowy pines droop more and their sprays carry clumps of snow.
function pine(seed: number, height: number, snowy: boolean): THREE.Group {
  const rnd = seeded(seed);
  const maxR = height * 0.3, base = height * 0.16;
  const parts: Geo[] = [
    cylinderBetween([0, 0, 0], [0, 0, height * 0.96], height * 0.03, 8, "BarkWarm", height * 0.006),
    cylinderBetween([0, 0, 0], [0, 0, height * 0.06], height * 0.045, 8, "BarkWarm", height * 0.03),
    // the core: a dark cone inside the boughs, so no sky shows through the middle
    cylinderAt({ rBot: maxR * 0.38, rTop: maxR * 0.03, height: height * 0.68, segments: 10, bottom: [0, 0, base + height * 0.04] }, "PineCore"),
  ];
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], col: number[] = [];
  const card = (c: THREE.Vector3, along: THREE.Vector3, across: THREE.Vector3, len: number, wid: number, n: THREE.Vector3, shade: number) => {
    const a = along.clone().multiplyScalar(len / 2), b = across.clone().multiplyScalar(wid / 2);
    const p00 = c.clone().sub(a).sub(b), p10 = c.clone().add(a).sub(b), p11 = c.clone().add(a).add(b), p01 = c.clone().sub(a).add(b);
    for (const [p, u, v] of [[p00, 0, 0], [p10, 1, 0], [p11, 1, 1], [p00, 0, 0], [p11, 1, 1], [p01, 0, 1]] as [THREE.Vector3, number, number][]) {
      pos.push(p.x, p.y, p.z);
      nor.push(n.x, n.y, n.z);
      uv.push(u, v);
      col.push(shade, shade, shade);
    }
  };
  const whorls = Math.round(9 + height / 160);
  for (let w = 0; w < whorls; w++) {
    const t = w / (whorls - 1); // 0 bottom .. 1 top
    const z = base + (height * 0.93 - base) * t;
    const len = maxR * (1 - t) ** 0.85 + height * 0.035;
    const boughs = Math.max(4, Math.round(7 - 3 * t));
    const twist = rnd() * Math.PI * 2;
    for (let b = 0; b < boughs; b++) {
      const yaw = twist + (b / boughs) * Math.PI * 2 + (rnd() - 0.5) * 0.5;
      const droop = (snowy ? 0.32 : 0.2) * (1 - t * 0.7) + (rnd() - 0.5) * 0.1;
      const out = new THREE.Vector3(Math.cos(yaw), Math.sin(yaw), 0);
      const dir = out.clone().multiplyScalar(Math.cos(droop)).add(new THREE.Vector3(0, 0, -Math.sin(droop))).normalize();
      const l = len * (0.85 + rnd() * 0.3);
      const root = new THREE.Vector3(0, 0, z), tip = root.clone().addScaledVector(dir, l);
      if (t < 0.85) parts.push(cylinderBetween(root.toArray() as V3, tip.toArray() as V3, height * 0.006 + 1, 5, "BarkWarm", 0.8));
      // sprays along the bough, flat-ish and facing up, each turned a little; every other one
      // rolled steeply so the bough has some thickness from the side
      const sprays = Math.max(3, Math.round(l / 32));
      for (let k = 0; k < sprays; k++) {
        const s = 0.25 + 0.75 * ((k + 0.5) / sprays);
        const c = root.clone().addScaledVector(dir, l * s).add(new THREE.Vector3(0, 0, (rnd() - 0.3) * 10));
        const cl = Math.min(190, Math.max(70, l * 0.75)) * (0.85 + rnd() * 0.3);
        const spin = (rnd() - 0.5) * 0.7, roll = k % 2 ? (rnd() - 0.5) * 0.7 : (rnd() < 0.5 ? -1 : 1) * (0.7 + rnd() * 0.5);
        const along = dir.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), spin);
        const across = new THREE.Vector3(0, 0, 1).cross(along).normalize().applyAxisAngle(along, roll);
        const n = out.clone().multiplyScalar(0.55).add(new THREE.Vector3(0, 0, 0.85)).normalize();
        const shade = (0.62 + 0.38 * s) * (0.88 + 0.12 * t) * (0.92 + rnd() * 0.12);
        card(c, along, across, cl, cl * 0.62, n, shade);
      }
    }
  }
  // the leader: two crossed sprays standing up at the top
  const top = new THREE.Vector3(0, 0, height * 0.97), upDir = new THREE.Vector3(0, 0, 1);
  for (const a of [0, Math.PI / 2]) card(top, upDir, new THREE.Vector3(Math.cos(a), Math.sin(a), 0), height * 0.14, height * 0.07, new THREE.Vector3(Math.cos(a + 1), Math.sin(a + 1), 0.6).normalize(), 1);

  const group = toThree(merge(...parts), material);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  group.add(swaying(geo, snowy ? "needleSnow" : "needle", () => needleTexture(snowy)));
  return group;
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
