// Trees after the courtyard's #tree recipes: a trunk through its trunk points, a branch into
// every crown ellipsoid with a few twigs, and the crowns filled with leaf cards painted with the
// LeafClump texture. The cards' normals point out of their crown so a crown shades like one soft
// ball; they sway a little in the wind (a shader tweak). Bushes (SHRUBS, and `shrub` for the
// kits' own) are built differently, as lobes of leaf sprays round leafy cores: see below.

import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cylinderBetween, merge, toThree } from "./geo";
import type { Geo, V3 } from "./geo";
import { material, leafClump, LEAVES, flowerCell, canopyCard } from "./textures";
import type { CanopyCard } from "./textures";

export interface TreeSpec {
  seed: number;
  trunkHeight: number;
  trunkRadius: number;
  trunkPoints?: V3[];   // bends of the trunk below its top
  crowns: [number, number, number, number, number, number][]; // centre x y z, radii x y z
  leafSize: number;
  density?: number;     // leaf cards per crown surface, relative
  twigs?: number;
  leaf?: string;        // palette (default green): green, blossom, birch, jungle, autumn, frost
  bark?: string;        // trunk material (default BarkWarm)
  card?: number;        // leaf card size of the new crowns (default 0.55 leafSize)
  cards?: number;       // their density (1)
  lobes?: number;       // lobes round each crown (4)
  foliage?: Partial<FoliageSpec>;
}

// The recipes from courtyard.weave.
export const TREES: Record<string, TreeSpec> = {
  BigOak: {
    seed: 5, trunkHeight: 230, trunkRadius: 48, leafSize: 120, twigs: 5,
    trunkPoints: [[40, -30, 120], [100, -80, 230]],
    crowns: [[270, -170, 420, 300, 360, 200], [250, -580, 400, 240, 240, 170], [130, 80, 420, 200, 200, 170], [300, -220, 610, 260, 300, 150]],
  },
  RoundTree: {
    seed: 12, trunkHeight: 300, trunkRadius: 26, leafSize: 110, twigs: 4, cards: 0.88,
    crowns: [[0, 0, 520, 320, 300, 240], [120, -90, 640, 240, 220, 180]],
  },
  SmallTree: {
    seed: 21, trunkHeight: 170, trunkRadius: 16, leafSize: 80, twigs: 4, card: 48,
    crowns: [[0, 0, 300, 170, 160, 150]],
  },
  // (Bush and JungleBush are listed here for their names; SHRUBS below builds them)
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
    seed: 37, trunkHeight: 420, trunkRadius: 13, leafSize: 60, twigs: 3, leaf: "birch", bark: "BarkBirch", lobes: 4, cards: 0.66,
    foliage: { core: 0.62, hang: 0.5, ragged: 0.75 },
    crowns: [[0, 0, 520, 122, 112, 200], [36, -28, 640, 70, 68, 76], [-46, 36, 430, 78, 74, 86]],
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
    seed: 53, trunkHeight: 280, trunkRadius: 24, leafSize: 100, twigs: 4, leaf: "autumn", cards: 0.86,
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

// ---- trees: bent, tapering limbs and crowns of leafy lobes ----
// Every tree is wood (a trunk and limbs as smooth tubes along curves, twigs reaching into the
// crown) and a crown of overlapping leafy lobes: a lumpy leafy core in each (so no sky shows
// through its middle) clad in alpha-cut leaf cards, darker underneath and in shade, sunlit on
// top. The cards are one mesh per card texture, tinted card by card by a vertex colour (so every
// palette shares one material per texture) and swaying in the wind.

export type RGB = [number, number, number];

// A limb: a tube along a smooth curve through `pts`, its radius running from r0 to r1, its
// texture coordinates in metres around and along it (the way the bark's furrows run).
export interface LimbOpts {
  seg?: number;   // sides (by default from r0)
  step?: number;  // cm between rings (by default about 2.2 r0, at least 22)
  taper?: number; // the radius runs r0 -> r1 as t^taper (1)
  flare?: number; // the foot swells by this much of r0 (a root flare)...
  roots?: number; // ... in this many root lobes
  gnarl?: number; // bumps along the bark (0..1)
  dome?: boolean; // close the tip with a rounded cap (cactus arms)
  maxRings?: number;
  seed?: number;
}
export function limb(pts: V3[], r0: number, r1: number, mat: string, o: LimbOpts = {}): Geo {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "centripetal");
  const L = curve.getLength();
  const seg = o.seg ?? (r0 > 22 ? 10 : r0 > 9 ? 8 : r0 > 3.5 ? 6 : 4);
  const rings = Math.max(pts.length - 1, Math.min(o.maxRings ?? 30, Math.ceil(L / (o.step ?? Math.max(22, r0 * 2.2)))));
  const frames = curve.computeFrenetFrames(rings, false);
  const rnd = seeded(o.seed ?? 1), ph = rnd() * 6.28, ph2 = rnd() * 6.28;
  const repU = Math.max(1, Math.round((2 * Math.PI * r0) / 100));
  type Ring = { p: THREE.Vector3; n: THREE.Vector3; b: THREE.Vector3; t: THREE.Vector3; r: number; s: number; tip: number };
  const list: Ring[] = [];
  for (let i = 0; i <= rings; i++) {
    const u = i / rings;
    list.push({ p: curve.getPointAt(u), n: frames.normals[i], b: frames.binormals[i], t: frames.tangents[i], r: r0 + (r1 - r0) * Math.pow(u, o.taper ?? 1), s: u * L, tip: 0 });
  }
  if (o.dome) {
    const e = list[rings];
    for (const phi of [0.55, 1.0, 1.38]) list.push({ ...e, p: e.p.clone().addScaledVector(e.t, e.r * Math.sin(phi)), r: e.r * Math.cos(phi), s: e.s + e.r * Math.sin(phi), tip: Math.sin(phi) });
  }
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  const dir = new THREE.Vector3();
  for (const R of list) {
    for (let j = 0; j <= seg; j++) {
      const a = (j / seg) * Math.PI * 2;
      let r = R.r;
      if (o.flare) {
        const e = Math.exp(-R.s / (r0 * 1.1)), lobe = o.roots ? Math.max(0, Math.cos(o.roots * a + ph)) ** 2 : 0.5;
        r *= 1 + o.flare * e * (0.35 + 1.1 * lobe);
      }
      if (o.gnarl) r *= 1 + o.gnarl * (0.08 * Math.sin(3 * a + R.s * 0.045 + ph) + 0.05 * Math.sin(5 * a - R.s * 0.03 + ph2));
      dir.copy(R.n).multiplyScalar(Math.cos(a)).addScaledVector(R.b, Math.sin(a));
      pos.push(R.p.x + dir.x * r, R.p.y + dir.y * r, R.p.z + dir.z * r);
      const k = Math.sqrt(1 - R.tip * R.tip);
      nor.push(dir.x * k + R.t.x * R.tip, dir.y * k + R.t.y * R.tip, dir.z * k + R.t.z * R.tip);
      uv.push((j / seg) * repU, R.s / 100);
    }
  }
  for (let i = 0; i + 1 < list.length; i++)
    for (let j = 0; j < seg; j++) {
      const a = i * (seg + 1) + j, b = a + seg + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return [{ geo, mat }];
}

// A point along a smooth curve through `pts` (t 0..1 by length).
export function along(pts: V3[], t: number): V3 {
  const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "centripetal");
  return c.getPointAt(Math.max(0, Math.min(1, t))).toArray() as V3;
}

// The leaf cards of a tree (or a palm's fronds, a fir's boughs): quads with a lighting normal and
// a colour each, Z up, cm. `mesh` turns them into one swaying mesh of a card texture.
export class LeafCards {
  pos: number[] = [];
  nor: number[] = [];
  uv: number[] = [];
  col: number[] = [];
  // a box the cards keep inside (an item's footprint): a card poking out is shrunk about its
  // centre to fit, or dropped when that leaves too little of it
  clip: { min: V3; max: V3 } | null = null;
  // a quad through four corners (p00 p10 p11 p01), with their texture coordinates
  quad(p: THREE.Vector3[], uv: number[][], n: THREE.Vector3 | THREE.Vector3[], col: THREE.Color | THREE.Color[]): void {
    for (const k of [0, 1, 2, 0, 2, 3]) {
      this.pos.push(p[k].x, p[k].y, p[k].z);
      this.uv.push(uv[k][0], uv[k][1]);
      const nn = Array.isArray(n) ? n[k] : n, cc = Array.isArray(col) ? col[k] : col;
      this.nor.push(nn.x, nn.y, nn.z);
      this.col.push(cc.r, cc.g, cc.b);
    }
  }
  // a card centred on c spanning w along `right` and h along `up`
  add(c: V3, right: THREE.Vector3, up: THREE.Vector3, w: number, h: number, n: THREE.Vector3, col: THREE.Color, uv: [number, number, number, number] = [0, 0, 1, 1]): void {
    if (this.clip) {
      let k = 1;
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const off = [right.x * sx * (w / 2) + up.x * sz * (h / 2), right.y * sx * (w / 2) + up.y * sz * (h / 2), right.z * sx * (w / 2) + up.z * sz * (h / 2)];
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
    const C = new THREE.Vector3(...c), r = right.clone().multiplyScalar(w / 2), u = up.clone().multiplyScalar(h / 2);
    const [u0, v0, u1, v1] = uv;
    this.quad([C.clone().sub(r).sub(u), C.clone().add(r).sub(u), C.clone().add(r).add(u), C.clone().sub(r).add(u)], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], n, col);
  }
  // a card centred on c, facing `face`, turned `spin` about it
  facing(c: V3, face: THREE.Vector3, spin: number, w: number, h: number, n: THREE.Vector3, col: THREE.Color, uv?: [number, number, number, number]): void {
    const f = face.clone().normalize();
    const ref = Math.abs(f.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
    const right = new THREE.Vector3().crossVectors(ref, f).normalize().applyAxisAngle(f, spin);
    const up = new THREE.Vector3().crossVectors(f, right).normalize();
    this.add(c, right, up, w, h, n, col, uv);
  }
  get count(): number {
    return this.pos.length / 18;
  }
  mesh(kind: CanopyCard): THREE.Mesh {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(this.nor, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    geo.applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1)); // Z up -> Y up
    const m = new THREE.Mesh(geo, canopyMaterial(kind));
    m.castShadow = true;
    m.receiveShadow = true;
    m.name = "crown";
    return m;
  }
}

// The shared, swaying material of a card texture (vertex colours tint each card; both faces lit
// by the normal the card was given, so a crown shades like one soft mass).
const canopyMats = new Map<CanopyCard, THREE.MeshStandardMaterial>();
const CARD_NORMAL = THREE.ShaderChunk.normal_fragment_begin.replace("normal *= faceDirection;", "");
export function canopyMaterial(kind: CanopyCard): THREE.MeshStandardMaterial {
  let m = canopyMats.get(kind);
  if (!m) {
    const tex = new THREE.CanvasTexture(canopyCard(kind));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    m = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.82, vertexColors: true });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uWind = wind;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uWind;")
        .replace("#include <begin_vertex>", `#include <begin_vertex>
          float sway = clamp(position.y / 350.0, 0.0, 1.5);
          transformed.x += sin(uWind * 1.3 + position.x * 0.011 + position.z * 0.007) * 3.5 * sway;
          transformed.z += cos(uWind * 1.1 + position.z * 0.012) * 3.0 * sway;`);
      shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_begin>", CARD_NORMAL);
    };
    canopyMats.set(kind, m);
  }
  return m;
}

// A crown's colours: its card texture, the cards' tint from shade to sun (sRGB), the core's
// material. `boost` lifts the tints to make up for the texture's own grey (1.6; 1 for a card
// painted in colour, whose tints are then shades).
export interface CanopyLook { card: CanopyCard; dark: RGB; mid: RGB; light: RGB; core?: string; boost?: number }
export const CANOPY: Record<string, CanopyLook> = {
  green: { card: "canopy", dark: [48, 96, 38], mid: [84, 140, 54], light: [150, 196, 80], core: "CanopyCore" },
  round: { card: "canopy", dark: [54, 104, 40], mid: [96, 152, 58], light: [168, 206, 90], core: "CanopyCore" },
  deep: { card: "glossy", dark: [26, 74, 34], mid: [54, 118, 50], light: [112, 170, 70], core: "CanopyCoreDeep" },
  birch: { card: "fine", dark: [96, 132, 44], mid: [146, 178, 62], light: [210, 222, 108], core: "CanopyCoreBirch" },
  autumn: { card: "maple", dark: [150, 62, 28], mid: [214, 116, 40], light: [248, 184, 74], core: "CanopyCoreAutumn" },
  crimson: { card: "maple", dark: [126, 26, 24], mid: [186, 46, 32], light: [240, 100, 54], core: "CanopyCoreRed" },
  frost: { card: "canopy", dark: [74, 112, 100], mid: [124, 164, 152], light: [206, 230, 224], core: "CanopyCoreFrost" },
  blossom: { card: "blossom", dark: [176, 160, 166], mid: [222, 210, 214], light: [255, 252, 252], core: "CanopyCoreBlossom", boost: 1 },
  acacia: { card: "fine", dark: [92, 112, 48], mid: [136, 150, 72], light: [192, 198, 112], core: "CanopyCoreOlive" },
  savanna: { card: "canopy", dark: [60, 100, 36], mid: [100, 144, 56], light: [162, 192, 88], core: "CanopyCore" },
  mangrove: { card: "glossy", dark: [30, 80, 36], mid: [62, 122, 52], light: [116, 166, 68], core: "CanopyCoreDeep" },
  vine: { card: "canopy", dark: [36, 92, 30], mid: [70, 136, 48], light: [124, 184, 66], core: "CanopyCoreDeep" },
  bamboo: { card: "lance", dark: [62, 108, 40], mid: [100, 150, 56], light: [156, 200, 84] },
};
const _c = new THREE.Color();
// The tint at `sun` (0 shade .. 1 sunlit), as a linear vertex colour.
export function canopyTint(look: CanopyLook, sun: number, out = new THREE.Color()): THREE.Color {
  const t = Math.max(0, Math.min(1, sun));
  const [a, b, k] = t < 0.5 ? [look.dark, look.mid, t / 0.5] : [look.mid, look.light, (t - 0.5) / 0.5];
  _c.setRGB((a[0] + (b[0] - a[0]) * k) / 255, (a[1] + (b[1] - a[1]) * k) / 255, (a[2] + (b[2] - a[2]) * k) / 255, THREE.SRGBColorSpace);
  const boost = look.boost ?? 1.6;
  return out.setRGB(_c.r * boost, _c.g * boost, _c.b * boost);
}

// Leafy lobes: a lumpy core in each lobe (when the look has one) and cards on its skin, leaning
// out of it, the ones underneath mostly left out. The cores come back as a Geo; the cards go
// into `cards`.
export interface FoliageSpec {
  seed: number;
  lobes: Lobe[];
  leaf: number;         // card size (cm)
  look: CanopyLook;
  density?: number;     // cards per lobe skin, relative (1)
  core?: number;        // the cores' size relative to their lobes (0.8; 0 none)
  ragged?: number;      // how far the cards lean and stick out (0.5)
  sun?: number;         // shifts every card toward the light (+) or the shade (-)
  flat?: number;        // how much the cards turn to face up (0.3): fuller seen from above
  under?: number;       // the share of downward cards kept (0.3)
  hang?: number;        // cards hang below the lobes (a weeping crown, the bamboo's leaves)
  mid?: V3;             // the crown's middle (by default the lobes')
  details?: number[];   // each lobe's core detail (by default 1 for big lobes, 0 for small)
}
export function foliage(spec: FoliageSpec, cards: LeafCards): Geo {
  const rnd = seeded(spec.seed), lobes = spec.lobes, look = spec.look;
  const core = look.core ? spec.core ?? 0.8 : 0, ragged = spec.ragged ?? 0.5, dens = spec.density ?? 1;
  const top = Math.max(...lobes.map((l) => l[2] + l[5])), bottom = Math.max(0, Math.min(...lobes.map((l) => l[2] - l[5])));
  const mid = new THREE.Vector3(...(spec.mid ?? (lobes.reduce((t, l) => [t[0] + l[0] / lobes.length, t[1] + l[1] / lobes.length, (bottom + top) / 2], [0, 0, 0]) as V3)));
  const parts: Geo[] = [];
  const inside = (p: THREE.Vector3, skip: number, k: number) =>
    lobes.some((l, j) => j !== skip && ((p.x - l[0]) / l[3]) ** 2 + ((p.y - l[1]) / l[4]) ** 2 + ((p.z - l[2]) / l[5]) ** 2 < k * k);
  const randDir = () => {
    const z = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - z * z);
    return new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), z);
  };
  const UP = new THREE.Vector3(0, 0, 1), col = new THREE.Color();
  lobes.forEach(([cx, cy, cz, rx, ry, rz], li) => {
    const big = Math.max(rx, ry, rz);
    if (core > 0) parts.push(lump([cx, cy, cz], [rx * core, ry * core, rz * core], spec.seed * 13 + li * 7, look.core!, spec.details?.[li] ?? (big * core > 55 ? 1 : 0), 0.16, Math.max(70, spec.leaf * 2.2)));
    const p = 1.6, area = 4 * Math.PI * (((rx * ry) ** p + (rx * rz) ** p + (ry * rz) ** p) / 3) ** (1 / p);
    const count = Math.round((area / spec.leaf ** 2) * 2.7 * dens);
    for (let i = 0; i < count; i++) {
      const d = randDir();
      if (d.z < -0.25 && rnd() > (spec.under ?? 0.3)) continue;
      const out = 0.9 + ragged * 0.24 * rnd();
      const c = new THREE.Vector3(cx + d.x * rx * out, cy + d.y * ry * out, cz + d.z * rz * out);
      if (inside(c, li, 0.88)) continue;
      const en = new THREE.Vector3(d.x / rx, d.y / ry, d.z / rz).normalize();
      const size = spec.leaf * (0.75 + rnd() * 0.5);
      if (spec.hang) c.z -= spec.hang * size * (0.3 + 0.7 * rnd()) * Math.max(0, 1 - en.z);
      const face = en.clone().addScaledVector(randDir(), 0.3 + ragged * 0.6).addScaledVector(UP, spec.flat ?? 0.3).normalize();
      const away = c.clone().sub(mid).setZ(0);
      if (away.lengthSq() > 1) away.normalize();
      const ln = en.clone().multiplyScalar(0.55).addScaledVector(away, 0.25).addScaledVector(UP, 0.55).normalize();
      const h = (c.z - bottom) / Math.max(1, top - bottom);
      const sun = 0.42 * (en.z * 0.5 + 0.5) + 0.36 * h + 0.14 * Math.max(0, away.dot(en)) + 0.26 * (rnd() - 0.5) + (spec.sun ?? 0);
      cards.facing([c.x, c.y, c.z], face, rnd() * Math.PI * 2, size, size, ln, canopyTint(look, sun, col));
    }
  });
  return merge(...parts);
}

// A tree with a crown: a trunk through `trunk` (from its foot), running on up into the crown
// most nearly above it; a limb arching out to each other crown, with twigs into it; each crown
// a few leafy lobes (a big one in its middle, smaller ones round its skin).
export interface CrownSpec {
  seed: number;
  trunk: V3[];         // the trunk's path, from the foot (0, 0, 0)
  radius: number;      // the trunk's radius at the foot (the flare comes on top)
  crowns: Lobe[];      // the masses of leaves
  leaf: number;        // card size (cm)
  look: CanopyLook;
  bark?: string;       // (BarkWarm)
  density?: number;
  lobes?: number;      // lobes round each crown's skin (5)
  twigs?: number;      // twigs into each crown (3)
  flare?: number;      // root flare (0.35)
  roots?: number;      // root lobes (5)
  gnarl?: number;
  limb?: number;       // limb radius relative to the trunk's (0.5)
  leader?: boolean;    // the trunk runs on into the crown above it (true)
  topR?: number;       // the trunk's radius where it ends, relative to its foot (0.22 with a leader, else 0.5)
  clip?: { min: V3; max: V3 };
  foliage?: Partial<FoliageSpec>;
}
export function crownTree(spec: CrownSpec): { wood: Geo; cards: LeafCards; lobes: Lobe[] } {
  const rnd = seeded(spec.seed * 7 + 3), bark = spec.bark ?? "BarkWarm", R = spec.radius;
  const parts: Geo[] = [];
  const top = spec.trunk[spec.trunk.length - 1];
  const size = (c: Lobe) => c[3] * c[4] * c[5];
  const biggest = Math.max(...spec.crowns.map(size));
  // the crown the trunk runs on into: the one most nearly above its top
  let lead = -1;
  if (spec.leader !== false) {
    let best = 0.75;
    spec.crowns.forEach((c, i) => {
      const off = Math.hypot(c[0] - top[0], c[1] - top[1]) / Math.max(c[3], c[4]);
      if (c[2] > top[2] && off < best) [best, lead] = [off, i];
    });
  }
  const path = [...spec.trunk];
  if (lead >= 0) {
    const c = spec.crowns[lead];
    path.push([c[0] + (top[0] - c[0]) * 0.25, c[1] + (top[1] - c[1]) * 0.25, c[2] - c[5] * 0.1]);
  }
  const rTop = R * (spec.topR ?? (lead >= 0 ? 0.2 : 0.5));
  parts.push(limb(path, R, rTop, bark, { flare: spec.flare ?? 0.35, roots: spec.roots ?? 5, gnarl: spec.gnarl ?? 0.4, seed: spec.seed, taper: 0.75, seg: R > 30 ? 10 : R > 12 ? 8 : 6, step: Math.max(40, R * 2.4), maxRings: 12 }));
  const trunkCurve = new THREE.CatmullRomCurve3(path.map((p) => new THREE.Vector3(...p)), false, "centripetal");
  const samples = Array.from({ length: 41 }, (_, i) => trunkCurve.getPointAt(i / 40));
  const twigInto = (from: THREE.Vector3, r: number, c: Lobe, n: number) => {
    for (let k = 0; k < n; k++) {
      const a = rnd() * Math.PI * 2, e = -0.1 + rnd() * 0.8;
      const tip: V3 = [c[0] + Math.cos(a) * Math.cos(e) * c[3] * 0.72, c[1] + Math.sin(a) * Math.cos(e) * c[4] * 0.72, c[2] + Math.sin(e) * c[5] * 0.6];
      const m: V3 = [(from.x + tip[0]) / 2, (from.y + tip[1]) / 2, (from.z + tip[2]) / 2 + 12];
      parts.push(limb([from.toArray() as V3, m, tip], r, Math.max(0.8, r * 0.25), bark, { seg: r > 6 ? 5 : 4, maxRings: 3 }));
    }
  };
  spec.crowns.forEach((c, i) => {
    const nt = Math.min(spec.twigs ?? 2, 2);
    if (i === lead) {
      twigInto(trunkCurve.getPointAt(0.97), rTop * 1.1, c, nt);
      return;
    }
    // start on the trunk a little below the crown's underside, not below two thirds of the top
    const want = Math.min(top[2] + (lead >= 0 ? (path[path.length - 1][2] - top[2]) * 0.5 : 0), Math.max(top[2] * 0.66, c[2] - c[5] * 0.7));
    let si = 0;
    samples.forEach((p, k) => {
      if (Math.abs(p.z - want) < Math.abs(samples[si].z - want)) si = k;
    });
    const u = si / 40, start = samples[si];
    const rAt = R + (rTop - R) * Math.pow(u, 0.75);
    const end: V3 = [c[0] + (start.x - c[0]) * 0.25, c[1] + (start.y - c[1]) * 0.25, c[2] - c[5] * 0.2];
    const d = Math.hypot(end[0] - start.x, end[1] - start.y, end[2] - start.z);
    const m: V3 = [(start.x + end[0]) / 2 + (rnd() - 0.5) * d * 0.15, (start.y + end[1]) / 2 + (rnd() - 0.5) * d * 0.15, (start.z + end[2]) / 2 + d * 0.12];
    const rl = Math.min(rAt * 0.8, R * (spec.limb ?? 0.5) * Math.max(0.55, Math.sqrt(size(c) / biggest)));
    const pts: V3[] = [start.toArray() as V3, m, end];
    parts.push(limb(pts, rl, rl * 0.3, bark, { seed: spec.seed + i, gnarl: 0.3, seg: rl > 14 ? 7 : rl > 6 ? 6 : 5, step: Math.max(40, rl * 3), maxRings: 7 }));
    twigInto(new THREE.Vector3(...along(pts, 0.75)), rl * 0.45, c, nt);
  });
  // the leafy lobes
  const lobes: Lobe[] = [], details: number[] = [];
  for (const [cx, cy, cz, rx, ry, rz] of spec.crowns) {
    lobes.push([cx, cy, cz, rx * 0.8, ry * 0.8, rz * 0.82]);
    details.push(Math.max(rx, ry, rz) > 120 ? 1 : 0);
    const n = spec.lobes ?? 4, a0 = rnd() * 6.28;
    for (let k = 0; k < n; k++) {
      const a = a0 + (k / n) * Math.PI * 2 + (rnd() - 0.5) * 0.7, e = -0.3 + rnd() * 1.05, s = 0.46 + rnd() * 0.12;
      const dx = Math.cos(a) * Math.cos(e), dy = Math.sin(a) * Math.cos(e), dz = Math.sin(e);
      lobes.push([cx + dx * rx * (1 - s) * 0.95, cy + dy * ry * (1 - s) * 0.95, cz + dz * rz * (1 - s) * 0.95, rx * s, ry * s, rz * s]);
      details.push(0);
    }
  }
  const cards = new LeafCards();
  cards.clip = spec.clip ?? null;
  parts.push(foliage({ seed: spec.seed * 3 + 1, lobes, details, leaf: spec.leaf, look: spec.look, density: spec.density, ...spec.foliage }, cards));
  return { wood: merge(...parts), cards, lobes };
}

// A finished tree: its wood and leafy cores in the shared materials, its cards one mesh.
export function treeObject(wood: Geo, ...cards: [LeafCards, CanopyCard][]): THREE.Group {
  const g = toThree(wood, material);
  for (const [c, kind] of cards) if (c.count) g.add(c.mesh(kind));
  return g;
}
export function crownTreeObject(spec: CrownSpec): THREE.Group {
  const t = crownTree(spec);
  return treeObject(t.wood, [t.cards, spec.look.card]);
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
export function lump(c: V3, r: V3, seed: number, mat: string, detail = 1, amp = 0.14, uvScale = 70): Geo {
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
  // texture coordinates projected along each face's own main axis (all three corners alike, so
  // no face is smeared across two projections)
  const p = flat.getAttribute("position"), uv = new Float32Array(p.count * 2);
  const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), fn = new THREE.Vector3();
  for (let f = 0; f < p.count; f += 3) {
    A.fromBufferAttribute(p, f);
    B.fromBufferAttribute(p, f + 1);
    C.fromBufferAttribute(p, f + 2);
    fn.crossVectors(B.sub(A), C.sub(A));
    const ax = Math.abs(fn.x), ay = Math.abs(fn.y), az = Math.abs(fn.z);
    for (let i = f; i < f + 3; i++) {
      const [a, b] = az >= ax && az >= ay ? [p.getX(i), p.getY(i)] : ax >= ay ? [p.getY(i), p.getZ(i)] : [p.getX(i), p.getZ(i)];
      uv[i * 2] = a / uvScale;
      uv[i * 2 + 1] = b / uvScale;
    }
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

// The palette names of TREES -> CANOPY looks.
const LOOK_OF: Record<string, string> = { green: "green", blossom: "blossom", birch: "birch", jungle: "deep", autumn: "autumn", frost: "frost" };
// A recipe as a crown tree.
export function treeCrown(spec: TreeSpec): CrownSpec {
  return {
    seed: spec.seed, trunk: [[0, 0, 0], ...(spec.trunkPoints?.length ? spec.trunkPoints : [[0, 0, spec.trunkHeight] as V3])], radius: spec.trunkRadius,
    crowns: spec.crowns, leaf: spec.card ?? spec.leafSize * 0.55, look: CANOPY[LOOK_OF[spec.leaf ?? "green"] ?? "green"], bark: spec.bark,
    density: spec.cards, twigs: spec.twigs, lobes: spec.lobes, foliage: spec.foliage,
  };
}

// A tree of a recipe (shared geometry; each call gives a new group to place).
export function tree(name: string): THREE.Group {
  let g = built.get(name);
  if (!g && SHRUBS[name]) built.set(name, (g = toThree(shrub(SHRUBS[name]), material)));
  if (!g) built.set(name, (g = crownTreeObject(treeCrown(TREES[name]))));
  return g.clone();
}
