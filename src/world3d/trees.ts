// Trees and bushes after the courtyard's #tree recipes: a trunk through its trunk points, a
// branch into every crown ellipsoid with a few twigs, and the crowns filled with leaf cards
// painted with the LeafClump texture. The cards' normals point out of their crown so a crown
// shades like one soft ball; they sway a little in the wind (a shader tweak).

import * as THREE from "three";
import { cylinderBetween, merge, toThree } from "./geo";
import type { Geo, V3 } from "./geo";
import { material, leafClump } from "./textures";

export interface TreeSpec {
  seed: number;
  trunkHeight: number;
  trunkRadius: number;
  trunkPoints?: V3[];   // bends of the trunk below its top
  crowns: [number, number, number, number, number, number][]; // centre x y z, radii x y z
  leafSize: number;
  density?: number;     // leaf cards per crown surface, relative
  twigs?: number;
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
};

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

let leafMat: THREE.MeshStandardMaterial | null = null;
let leafDepth: THREE.MeshDepthMaterial | null = null;
export const wind = { value: 0 };

function leafMaterials(): [THREE.MeshStandardMaterial, THREE.MeshDepthMaterial] {
  if (!leafMat) {
    const tex = new THREE.CanvasTexture(leafClump());
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    leafMat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.85, vertexColors: true });
    leafMat.onBeforeCompile = (shader) => {
      shader.uniforms.uWind = wind;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uWind;")
        .replace("#include <begin_vertex>", `#include <begin_vertex>
          float sway = clamp(position.y / 300.0, 0.0, 1.5);
          transformed.x += sin(uWind * 1.3 + position.x * 0.011 + position.z * 0.007) * 3.5 * sway;
          transformed.z += cos(uWind * 1.1 + position.z * 0.012) * 3.0 * sway;`);
    };
    leafDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.45 });
  }
  return [leafMat, leafDepth!];
}

// Leaf cards in a crown: random points through the ellipsoid (more near its skin), each a
// square card turned at random, its normal pointing out of the crown.
function leaves(spec: TreeSpec, rnd: () => number): THREE.BufferGeometry {
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
  const r0 = spec.trunkRadius;
  for (let i = 0; i < path.length - 1; i++) {
    const t0 = i / (path.length - 1), t1 = (i + 1) / (path.length - 1);
    parts.push(cylinderBetween(path[i], path[i + 1], r0 * (1 - 0.35 * t0), 10, "BarkWarm", r0 * (1 - 0.35 * t1)));
  }
  // a root flare
  parts.push(cylinderBetween([0, 0, 0], [0, 0, Math.min(35, spec.trunkHeight)], r0 * 1.3, 10, "BarkWarm", r0 * 0.98));
  const top = path[path.length - 1];
  for (const [cx, cy, cz] of spec.crowns) {
    const end: V3 = [top[0] + (cx - top[0]) * 0.75, top[1] + (cy - top[1]) * 0.75, top[2] + (cz - top[2]) * 0.7];
    parts.push(cylinderBetween(top, end, r0 * 0.55, 8, "BarkWarm", r0 * 0.22));
    for (let t = 0; t < (spec.twigs ?? 0); t++) {
      const a = rnd() * Math.PI * 2, l = 0.4 + rnd() * 0.5;
      const tip: V3 = [end[0] + Math.cos(a) * 140 * l, end[1] + Math.sin(a) * 140 * l, end[2] + 40 + rnd() * 80];
      parts.push(cylinderBetween(end, tip, r0 * 0.2, 6, "BarkWarm", r0 * 0.06));
    }
  }
  return merge(...parts);
}

const built = new Map<string, THREE.Group>();

// A tree of a recipe (shared geometry; each call gives a new group to place).
export function tree(name: string): THREE.Group {
  let g = built.get(name);
  if (!g) {
    const spec = TREES[name], rnd = seeded(spec.seed);
    g = spec.trunkHeight > 20 ? toThree(wood(spec, rnd), material) : new THREE.Group();
    const [mat, depth] = leafMaterials();
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
