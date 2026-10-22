// Trees and bushes after the courtyard's #tree recipes: a trunk through its trunk points, a
// branch into every crown ellipsoid with a few twigs, and the crowns filled with leaf cards
// painted with the LeafClump texture. The cards' normals point out of their crown so a crown
// shades like one soft ball; they sway a little in the wind (a shader tweak).

import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cylinderBetween, merge, toThree } from "./geo";
import type { Geo, V3 } from "./geo";
import { material, leafClump, LEAVES, flowerCell } from "./textures";

export interface TreeSpec {
  seed: number;
  trunkHeight: number;
  trunkRadius: number;
  trunkPoints?: V3[];   // bends of the trunk below its top
  crowns: [number, number, number, number, number, number][]; // centre x y z, radii x y z
  leafSize: number;
  density?: number;     // leaf cards per crown surface, relative
  twigs?: number;
  leaf?: string;        // palette in LEAVES (default green)
  bark?: string;        // trunk material (default BarkWarm)
}

// The recipes from courtyard.weave.
export const TREES: Record<string, TreeSpec> = {
  BigOak: {
    seed: 5, trunkHeight: 230, trunkRadius: 48, leafSize: 120, twigs: 5,
    trunkPoints: [[40, -30, 120], [100, -80, 230]],
    crowns: [[270, -170, 420, 300, 360, 200], [250, -580, 400, 240, 240, 170], [130, 80, 420, 200, 200, 170], [300, -220, 610, 260, 300, 150]],
  },
  RoundTree: {
    seed: 12, trunkHeight: 300, trunkRadius: 26, leafSize: 110, twigs: 4,
    crowns: [[0, 0, 520, 320, 300, 240], [120, -90, 640, 240, 220, 180]],
  },
  SmallTree: {
    seed: 21, trunkHeight: 170, trunkRadius: 16, leafSize: 80, twigs: 4,
    crowns: [[0, 0, 300, 170, 160, 150]],
  },
  Bush: {
    seed: 3, trunkHeight: 10, trunkRadius: 4, leafSize: 30, density: 1.6, twigs: 0,
    crowns: [[0, 0, 32, 38, 38, 28]],
  },

  // ---- other lands (town kits) ----
  Cherry: {
    seed: 31, trunkHeight: 190, trunkRadius: 20, leafSize: 70, twigs: 5, leaf: "blossom",
    trunkPoints: [[20, 10, 110], [40, -10, 190]],
    crowns: [[60, 0, 330, 230, 200, 120], [-90, 60, 300, 150, 140, 100], [110, -110, 290, 140, 130, 90]],
  },
  Birch: {
    seed: 37, trunkHeight: 420, trunkRadius: 13, leafSize: 60, twigs: 3, leaf: "birch", bark: "BarkBirch",
    crowns: [[0, 0, 470, 120, 110, 170], [30, -20, 600, 80, 80, 90]],
  },
  JungleTree: {
    seed: 43, trunkHeight: 520, trunkRadius: 30, leafSize: 130, twigs: 6, leaf: "jungle", density: 1.3,
    trunkPoints: [[-20, 10, 300], [10, 0, 520]],
    crowns: [[0, 0, 640, 340, 320, 150], [-180, 80, 560, 200, 180, 110], [190, -60, 580, 200, 190, 110]],
  },
  FrostOak: {
    seed: 47, trunkHeight: 230, trunkRadius: 40, leafSize: 110, twigs: 5, leaf: "frost",
    trunkPoints: [[30, -20, 120], [60, -40, 230]],
    crowns: [[150, -90, 400, 260, 280, 170], [-40, 60, 380, 190, 190, 140]],
  },
  AutumnTree: {
    seed: 53, trunkHeight: 280, trunkRadius: 24, leafSize: 100, twigs: 4, leaf: "autumn",
    crowns: [[0, 0, 470, 280, 260, 210], [90, -60, 600, 200, 190, 150]],
  },
  JungleBush: {
    seed: 59, trunkHeight: 10, trunkRadius: 4, leafSize: 45, density: 1.5, twigs: 0, leaf: "jungle",
    crowns: [[0, 0, 45, 60, 60, 40]],
  },
};

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

export const wind = { value: 0 };
const leafMats = new Map<string, [THREE.MeshStandardMaterial, THREE.MeshDepthMaterial]>();

// Leaf cards that sway in the wind, painted with `canvas` (one material per texture key).
export function leafMaterials(key = "green", canvas?: () => HTMLCanvasElement): [THREE.MeshStandardMaterial, THREE.MeshDepthMaterial] {
  let pair = leafMats.get(key);
  if (!pair) {
    const tex = new THREE.CanvasTexture(canvas ? canvas() : leafClump(LEAVES[key] ?? LEAVES.green));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const leafMat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.85, vertexColors: true });
    leafMat.onBeforeCompile = (shader) => {
      shader.uniforms.uWind = wind;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uWind;")
        .replace("#include <begin_vertex>", `#include <begin_vertex>
          float sway = clamp(position.y / 300.0, 0.0, 1.5);
          transformed.x += sin(uWind * 1.3 + position.x * 0.011 + position.z * 0.007) * 3.5 * sway;
          transformed.z += cos(uWind * 1.1 + position.z * 0.012) * 3.0 * sway;`);
    };
    pair = [leafMat, new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.45 })];
    leafMats.set(key, pair);
  }
  return pair;
}

// Leaf cards in a crown: random points through the ellipsoid (more near its skin), each a
// square card turned at random, its normal pointing out of the crown.
export function leaves(spec: Pick<TreeSpec, "crowns" | "leafSize" | "density">, rnd: () => number): THREE.BufferGeometry {
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], col: number[] = [];
  const q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3();
  for (const [cx, cy, cz, rx, ry, rz] of spec.crowns) {
    // roughly the ellipsoid's surface over a card's area, twice over
    const p = 1.6, area = 4 * Math.PI * (((rx * ry) ** p + (rx * rz) ** p + (ry * rz) ** p) / 3) ** (1 / p);
    const count = Math.round((area / spec.leafSize ** 2) * 3.4 * (spec.density ?? 1));
    for (let i = 0; i < count; i++) {
      // a direction, and a depth biased toward the outside
      const z = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - z * z);
      const dir = new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), z);
      const depth = 0.45 + 0.55 * Math.sqrt(rnd());
      const c = new THREE.Vector3(cx + dir.x * rx * depth, cy + dir.y * ry * depth, cz + dir.z * rz * depth);
      const size = spec.leafSize * (0.6 + rnd() * 0.45);
      q.setFromEuler(e.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI));
      const n = new THREE.Vector3(dir.x / rx, dir.y / ry, dir.z / rz).normalize().lerp(new THREE.Vector3(0, 0, 1), 0.25).normalize();
      const shade = 0.75 + 0.25 * depth + (rnd() - 0.5) * 0.12;
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
      for (const [sx, sy] of corners) {
        v.set((sx * size) / 2, (sy * size) / 2, 0).applyQuaternion(q).add(c);
        pos.push(v.x, v.y, v.z);
        nor.push(n.x, n.y, n.z);
        uv.push((sx + 1) / 2, (sy + 1) / 2);
        col.push(shade, shade, shade);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  // Z up -> Y up
  geo.applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1));
  return geo;
}

// The trunk through its bend points to the top, a limb to each crown and some twigs.
function wood(spec: TreeSpec, rnd: () => number): Geo {
  const path: V3[] = [[0, 0, 0], ...(spec.trunkPoints ?? []), ...(spec.trunkPoints?.length ? [] : [[0, 0, spec.trunkHeight] as V3])];
  const parts: Geo[] = [];
  const r0 = spec.trunkRadius, bark = spec.bark ?? "BarkWarm";
  for (let i = 0; i < path.length - 1; i++) {
    const t0 = i / (path.length - 1), t1 = (i + 1) / (path.length - 1);
    parts.push(cylinderBetween(path[i], path[i + 1], r0 * (1 - 0.35 * t0), 10, bark, r0 * (1 - 0.35 * t1)));
  }
  // a root flare
  parts.push(cylinderBetween([0, 0, 0], [0, 0, Math.min(35, spec.trunkHeight)], r0 * 1.3, 10, bark, r0 * 0.98));
  const top = path[path.length - 1];
  for (const [cx, cy, cz] of spec.crowns) {
    const end: V3 = [top[0] + (cx - top[0]) * 0.75, top[1] + (cy - top[1]) * 0.75, top[2] + (cz - top[2]) * 0.7];
    parts.push(cylinderBetween(top, end, r0 * 0.55, 8, bark, r0 * 0.22));
    for (let t = 0; t < (spec.twigs ?? 0); t++) {
      const a = rnd() * Math.PI * 2, l = 0.4 + rnd() * 0.5;
      const tip: V3 = [end[0] + Math.cos(a) * 140 * l, end[1] + Math.sin(a) * 140 * l, end[2] + 40 + rnd() * 80];
      parts.push(cylinderBetween(end, tip, r0 * 0.2, 6, bark, r0 * 0.06));
    }
  }
  return merge(...parts);
}

// ---- bushes: leafy lobes ----
// A bush is a few overlapping lobes (ellipsoids). Each has a lumpy dark core of leaves, so no
// light shows through its middle, and is clad in leaf cards that lean out of it: darker
// underneath and low down, sunlit on top, a few sticking out past the core to give it a leafy
// edge; twigs where it meets the ground, flowers or berries on top if it has any. Everything is
// a Geo of shared materials (the cards are alpha-cut, see textures.ts), so kits can build bushes
// into their own pieces (hedges, planters, flower beds) and they instance like any prop.

// Leaf cards gathered by material, handed over as a Geo (Z up, cm). Each card carries the
// lighting normal it is given: the card materials light both faces by it.
export class Cards {
  private by = new Map<string, { pos: number[]; nor: number[]; uv: number[] }>();
  // a box the cards must keep inside (a piece's footprint): a card poking out is shrunk to fit
  // about its centre (or dropped when that leaves too little of it)
  clip: { min: V3; max: V3 } | null = null;
  // A card on `c` (its middle, or with `base` its bottom edge) spanning w along `right` and h
  // along `up` (unit vectors), showing the texture rectangle `uv` = [u0, v0, u1, v1].
  add(mat: string, c: V3, right: THREE.Vector3, up: THREE.Vector3, w: number, h: number, n: THREE.Vector3, uv: [number, number, number, number] = [0, 0, 1, 1], base = false): void {
    if (this.clip) {
      let k = 1;
      for (const [sx, sz] of [[-1, 0], [1, 0], [-1, 1], [1, 1], [-1, -1], [1, -1]]) {
        if (base && sz < 0) continue;
        const off = [right.x * sx * (w / 2) + up.x * sz * (base ? h : h / 2), right.y * sx * (w / 2) + up.y * sz * (base ? h : h / 2), right.z * sx * (w / 2) + up.z * sz * (base ? h : h / 2)];
        for (let a = 0; a < 3; a++) {
          if (c[a] < this.clip.min[a] || c[a] > this.clip.max[a]) return;
          if (off[a] > 0.01) k = Math.min(k, (this.clip.max[a] - c[a]) / off[a]);
          if (off[a] < -0.01) k = Math.min(k, (this.clip.min[a] - c[a]) / off[a]);
        }
      }
      if (k < 0.45) return;
      w *= k;
      h *= k;
    }
    let b = this.by.get(mat);
    if (!b) this.by.set(mat, (b = { pos: [], nor: [], uv: [] }));
    const lo = base ? 0 : -h / 2, hi = base ? h : h / 2;
    const corner = (sx: number, sz: number): number[] => [
      c[0] + right.x * sx * (w / 2) + up.x * sz, c[1] + right.y * sx * (w / 2) + up.y * sz, c[2] + right.z * sx * (w / 2) + up.z * sz];
    const [u0, v0, u1, v1] = uv;
    const p00 = corner(-1, lo), p10 = corner(1, lo), p11 = corner(1, hi), p01 = corner(-1, hi);
    b.pos.push(...p00, ...p10, ...p11, ...p00, ...p11, ...p01);
    b.uv.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1);
    for (let i = 0; i < 6; i++) b.nor.push(n.x, n.y, n.z);
  }
  // a card centred on c, facing `face`, turned `spin` about it, w x h
  facing(mat: string, c: V3, face: THREE.Vector3, spin: number, w: number, h: number, n: THREE.Vector3, uv?: [number, number, number, number]): void {
    const f = face.clone().normalize();
    const ref = Math.abs(f.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
    const right = new THREE.Vector3().crossVectors(ref, f).normalize().applyAxisAngle(f, spin);
    const up = new THREE.Vector3().crossVectors(f, right).normalize();
    this.add(mat, c, right, up, w, h, n, uv);
  }
  get count(): number {
    let n = 0;
    for (const b of this.by.values()) n += b.pos.length / 18;
    return n;
  }
  geo(): Geo {
    const out: Geo = [];
    for (const [mat, b] of this.by) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(b.pos, 3));
      geo.setAttribute("normal", new THREE.Float32BufferAttribute(b.nor, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(b.uv, 2));
      out.push({ geo, mat });
    }
    return out;
  }
}

// A lumpy ball of leaves: an icosphere pushed in and out by a few waves, `r` its radii, never
// below the ground. Texture coordinates in metres across its faces (for the foliage map).
export function lump(c: V3, r: V3, seed: number, mat: string, detail = 1, amp = 0.14): Geo {
  const rnd = seeded(seed);
  const ico = new THREE.IcosahedronGeometry(1, detail);
  ico.deleteAttribute("uv");
  ico.deleteAttribute("normal");
  const geo = mergeVertices(ico);
  const waves = Array.from({ length: 4 }, () => ({ k: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize().multiplyScalar(3 + rnd() * 3), p: rnd() * 6.28 }));
  const pos = geo.getAttribute("position") as THREE.BufferAttribute, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const d = 1 + amp * waves.reduce((t, w) => t + Math.sin(v.dot(w.k) + w.p), 0) / 2;
    pos.setXYZ(i, c[0] + v.x * r[0] * d, c[1] + v.y * r[1] * d, Math.max(0, c[2] + v.z * r[2] * d));
  }
  geo.computeVertexNormals();
  const flat = geo.toNonIndexed();
  const p = flat.getAttribute("position"), n = flat.getAttribute("normal"), uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const [a, b] = az >= ax && az >= ay ? [p.getX(i), p.getY(i)] : ax >= ay ? [p.getY(i), p.getZ(i)] : [p.getX(i), p.getZ(i)];
    uv[i * 2] = a / 70;
    uv[i * 2 + 1] = b / 70;
  }
  flat.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return [{ geo: flat, mat }];
}

export type Lobe = [number, number, number, number, number, number]; // centre x y z, radii x y z
export interface ShrubLook {
  core: string;  // the dark leafy mass inside (a "foliage" material)
  dark: string;  // leaf cards in shade
  mid: string;
  light: string; // ... and in the sun
}
export const SHRUB_GREEN: ShrubLook = { core: "FoliageCore", dark: "LeafCardDark", mid: "LeafCard", light: "LeafCardLight" };
export const SHRUB_JUNGLE: ShrubLook = { core: "JungleCore", dark: "JungleLeafDark", mid: "JungleLeaf", light: "JungleLeafLight" };
export interface ShrubSpec {
  seed: number;
  lobes: Lobe[];
  leaf: number;          // leaf card size (cm)
  look?: ShrubLook;
  density?: number;      // cards per lobe skin, relative (1)
  core?: number;         // the core's size relative to its lobe (0.8); 0: none (a sparse scrub)
  coreDetail?: number;   // its icosphere's detail (0 for small lobes, 1 for big ones)
  ragged?: number;       // how far the cards lean and stick out (0 clipped .. 1 wild; 0.5)
  sun?: number;          // shifts every card toward the light (+) or the shade (-) (0)
  stems?: { mat: string; r: number; n?: number }; // twigs from the ground into the lobes
  flowers?: { mat?: string; cells: number[]; n: number; size: number; up?: number };
  cards?: Cards;         // add the cards to these (the caller makes the Geo) instead
}
export function shrub(spec: ShrubSpec): Geo {
  const look = spec.look ?? SHRUB_GREEN, rnd = seeded(spec.seed), lobes = spec.lobes;
  const own = !spec.cards, cards = spec.cards ?? new Cards();
  const core = spec.core ?? 0.8, ragged = spec.ragged ?? 0.5, dens = spec.density ?? 1;
  const top = Math.max(...lobes.map((l) => l[2] + l[5])), bottom = Math.max(0, Math.min(...lobes.map((l) => l[2] - l[5])));
  const mid = new THREE.Vector3(...lobes.reduce((t, l) => [t[0] + l[0] / lobes.length, t[1] + l[1] / lobes.length, (bottom + top) / 2], [0, 0, 0] as number[]));
  const parts: Geo[] = [];
  const inside = (p: THREE.Vector3, skip: number, k: number) =>
    lobes.some((l, j) => j !== skip && ((p.x - l[0]) / l[3]) ** 2 + ((p.y - l[1]) / l[4]) ** 2 + ((p.z - l[2]) / l[5]) ** 2 < k * k);
  const randDir = () => {
    const z = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - z * z);
    return new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), z);
  };
  const UP = new THREE.Vector3(0, 0, 1);
  lobes.forEach(([cx, cy, cz, rx, ry, rz], li) => {
    if (core > 0) parts.push(lump([cx, cy, cz], [rx * core, ry * core, rz * core], spec.seed * 13 + li * 7, look.core, spec.coreDetail ?? (Math.max(rx, ry, rz) * core > 30 ? 1 : 0)));
    const p = 1.6, area = 4 * Math.PI * (((rx * ry) ** p + (rx * rz) ** p + (ry * rz) ** p) / 3) ** (1 / p);
    const count = Math.round((area / spec.leaf ** 2) * 4.5 * dens);
    for (let i = 0; i < count; i++) {
      const d = randDir();
      if (d.z < -0.3 && rnd() < 0.75) continue; // the underside hardly shows
      const out = 0.93 + ragged * 0.2 * rnd();
      const c = new THREE.Vector3(cx + d.x * rx * out, cy + d.y * ry * out, Math.max(4, cz + d.z * rz * out));
      if (inside(c, li, 0.9)) continue;
      const en = new THREE.Vector3(d.x / rx, d.y / ry, d.z / rz).normalize();
      const face = en.clone().addScaledVector(randDir(), 0.25 + ragged * 0.75).normalize();
      const size = spec.leaf * (0.78 + rnd() * 0.44);
      const away = c.clone().sub(mid).setZ(0).normalize();
      const ln = en.clone().multiplyScalar(0.7).addScaledVector(away, 0.2).addScaledVector(UP, 0.6).normalize();
      const h = (c.z - bottom) / Math.max(1, top - bottom);
      const sun = 0.42 * (en.z * 0.5 + 0.5) + 0.38 * h + 0.12 * Math.max(0, away.dot(en)) + 0.26 * (rnd() - 0.5) + (spec.sun ?? 0);
      cards.facing(sun < 0.4 ? look.dark : sun < 0.66 ? look.mid : look.light, [c.x, c.y, c.z], face, rnd() * Math.PI * 2, size, size, ln);
    }
  });
  if (spec.stems) {
    const n = spec.stems.n ?? lobes.length + 2;
    for (let i = 0; i < n; i++) {
      const l = lobes[i % lobes.length], a = rnd() * Math.PI * 2, r0 = spec.stems.r;
      const foot: V3 = [mid.x + Math.cos(a) * r0 * 2, mid.y + Math.sin(a) * r0 * 2, 0];
      const end: V3 = [l[0] + (rnd() - 0.5) * l[3] * 0.6, l[1] + (rnd() - 0.5) * l[4] * 0.6, l[2] - l[5] * 0.1];
      parts.push(cylinderBetween(foot, end, r0, 5, spec.stems.mat, r0 * 0.45));
    }
  }
  if (spec.flowers) {
    const f = spec.flowers, weights = lobes.map((l) => l[3] * l[4]), total = weights.reduce((t, w) => t + w, 0);
    for (let i = 0, tries = 0; i < f.n && tries < f.n * 6; tries++) {
      let pick = rnd() * total, li = 0;
      while (pick > weights[li] && li < lobes.length - 1) pick -= weights[li++];
      const [cx, cy, cz, rx, ry, rz] = lobes[li];
      const d = randDir();
      d.z = Math.abs(d.z) * 0.85 + 0.15;
      d.normalize();
      const c = new THREE.Vector3(cx + d.x * rx * 1.02, cy + d.y * ry * 1.02, cz + d.z * rz * 1.02);
      if (inside(c, li, 0.97)) continue;
      const en = new THREE.Vector3(d.x / rx, d.y / ry, d.z / rz).normalize();
      const face = en.clone().addScaledVector(UP, f.up ?? 0.6).addScaledVector(randDir(), 0.25).normalize();
      const size = f.size * (0.8 + rnd() * 0.4);
      cards.facing(f.mat ?? "FlowerCards", [c.x, c.y, c.z], face, rnd() * Math.PI * 2, size, size, en.clone().add(UP).normalize(), flowerCell(f.cells[Math.floor(rnd() * f.cells.length)]));
      i++;
    }
  }
  return own ? merge(...parts, cards.geo()) : merge(...parts);
}

// The plain bushes of the flora kit (same footprints as the leaf-crown bushes they replace).
export const SHRUBS: Record<string, ShrubSpec> = {
  Bush: {
    seed: 3, leaf: 21, ragged: 0.55, stems: { mat: "BarkWarm", r: 2.2, n: 5 },
    lobes: [[0, 0, 30, 25, 25, 24], [3, -2, 48, 18, 17, 14], [20, 3, 22, 19, 18, 18], [3, 19, 21, 18, 17, 17], [-18, 10, 23, 20, 19, 18], [-16, -12, 20, 18, 18, 17], [6, -18, 22, 19, 18, 17]],
  },
  JungleBush: {
    seed: 59, leaf: 40, look: SHRUB_JUNGLE, ragged: 0.7, density: 1.1, stems: { mat: "BarkWarm", r: 3, n: 6 },
    lobes: [[0, 0, 44, 46, 44, 34], [30, -26, 32, 32, 29, 27], [-32, 22, 30, 30, 29, 25], [-14, -32, 28, 27, 25, 23], [22, 30, 30, 27, 25, 23], [4, 6, 68, 29, 27, 21]],
  },
};

const built = new Map<string, THREE.Group>();

// A tree of a recipe (shared geometry; each call gives a new group to place).
export function tree(name: string): THREE.Group {
  let g = built.get(name);
  if (!g && SHRUBS[name]) built.set(name, (g = toThree(shrub(SHRUBS[name]), material)));
  if (!g) {
    const spec = TREES[name], rnd = seeded(spec.seed);
    g = spec.trunkHeight > 20 ? toThree(wood(spec, rnd), material) : new THREE.Group();
    const [mat, depth] = leafMaterials(spec.leaf);
    const crown = new THREE.Mesh(leaves(spec, rnd), mat);
    crown.customDepthMaterial = depth;
    crown.castShadow = true;
    crown.receiveShadow = true;
    crown.name = "crown";
    g.add(crown);
    built.set(name, g);
  }
  return g.clone();
}
