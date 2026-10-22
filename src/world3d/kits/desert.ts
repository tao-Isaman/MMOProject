// ทะเลทราย (the desert fields' kit): the land south of Eden, where the savanna dries into desert
// round the caravan town of Bahamas. Tall golden grass and lone flat-topped acacias, a giant
// baobab, dead trees and thorn scrub; sandstone boulders, hoodoos, buttes and a great natural
// rock arch; dune ridges, bleached bones, a wrecked caravan cart; a waystation and signposts on
// the cart track; and the ruins of an older people half under the sand: wall runs, columns,
// a city gate of two pylons, a colossal head and a temple.
//
// Everything is built from code in centimetres, Z up; each item stands on z = 0, centred on its
// footprint, its front facing -X. Masonry and rock get world-aligned texture coordinates so the
// sandstone's courses stay level; the grass and reeds are crossed cards that sway in the wind.

import * as THREE from "three";
import { merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween, cylinderBetween, cylinderAt, sphereCenter, torus, rock } from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial, FLOWER_CELLS } from "../textures";
import { wind, shrub, limb, foliage, crownLobes, LeafCards, CANOPY, treeObject } from "../trees";
import type { ShrubLook, Lobe } from "../trees";
import type { Kit, Put } from "./types";

// ---- the desert's own colours ----
defineMaterial("Desert_Rock", { map: "crag", tint: "#dc9c66", bump: 3 });
defineMaterial("Desert_RockPale", { map: "crag", tint: "#eecb96", bump: 3 });
defineMaterial("Desert_RockRed", { map: "crag", tint: "#c47450", bump: 3 });
defineMaterial("Desert_RockGrey", { map: "crag", tint: "#b8aa96", bump: 3 });
defineMaterial("Desert_Statue", { map: "plaster", tint: "#ecd2a0", bump: 1 });
defineMaterial("Desert_StatueDark", { map: "plaster", tint: "#d5ad76", bump: 1 });
defineMaterial("Desert_Sand", { map: "felt", tint: "#f8dba2", rough: 1 });
defineMaterial("Desert_SandDark", { map: "felt", tint: "#eccb92", rough: 1 });
defineMaterial("Desert_DeadWood", { map: "wood", tint: "#b5a68e", bump: 1.5 });
defineMaterial("Desert_DarkWood", { map: "bark", tint: "#5e4a38", bump: 2 });
defineMaterial("Desert_WoodEnd", { map: "wood", tint: "#d8c49c", bump: 1 });
defineMaterial("Desert_AcaciaBark", { map: "bark", tint: "#6b5642", bump: 3 });
defineMaterial("Desert_BaobabBark", { map: "bark", tint: "#a69482", bump: 3 });
defineMaterial("Desert_Bone", { map: "plaster", tint: "#efe5cd", rough: 0.8 });
defineMaterial("Desert_Ruin", { map: "sandstone", tint: "#dcb47c", bump: 1.8 });
defineMaterial("Desert_RuinDark", { map: "sandstone", tint: "#bb8e5c", bump: 1.8 });
defineMaterial("Desert_RuinPale", { map: "sandstone", tint: "#efd7a8", bump: 1.5 });
defineMaterial("Desert_Fluted", { map: "ribs", tint: "#e2bd88", rough: 0.9 });
defineMaterial("Desert_Paving", { map: "stone", tint: "#e6cc9c", bump: 1.5 });
defineMaterial("Desert_Turquoise", { map: "plaster", tint: "#4a9d96", rough: 0.7 }); // faded paint and inlay
defineMaterial("Desert_Ochre", { map: "plaster", tint: "#c4823c", rough: 0.8 });
defineMaterial("Desert_Gold", { map: "metal", tint: "#c99a3c", rough: 0.45, metal: 0.6 });
defineMaterial("Desert_Shadow", { tint: "#2e2219", rough: 1 });
defineMaterial("Desert_Adobe", { map: "adobe", tint: "#d9a46c", bump: 1 });
defineMaterial("Desert_AdobeDark", { map: "adobe", tint: "#b98454", bump: 1 });
defineMaterial("Desert_Thatch", { map: "thatch", tint: "#c9a45c", bump: 2 });
defineMaterial("Desert_Canvas", { map: "fabric", tint: "#ddc9a0", rough: 0.95 });
defineMaterial("Desert_Clay", { map: "plaster", tint: "#b86d40", rough: 0.85 });
defineMaterial("Desert_Wicker", { map: "thatch", tint: "#b8925a", bump: 1.5 });
defineMaterial("Desert_Water", { tint: "#3a8a90", rough: 0.08, opacity: 0.9 });

type P2 = [number, number];

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// ---- geometry helpers ----
// Texture coordinates in metres from the position, across each face's normal: walls keep their
// courses level (V = z) and neighbouring blocks line up.
function worldUv(geo: THREE.BufferGeometry): void {
  const pos = geo.getAttribute("position"), nor = geo.getAttribute("normal");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i)), nz = Math.abs(nor.getZ(i));
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const [u, v] = nz >= nx && nz >= ny ? [x, y] : nx >= ny ? [y, z] : [x, z];
    uv[i * 2] = u / 100;
    uv[i * 2 + 1] = v / 100;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}
function reuv(g: Geo): Geo {
  return g.map((p) => {
    const geo = p.geo.clone();
    worldUv(geo);
    return { geo, mat: p.mat };
  });
}
const sboxB = (min: V3, max: V3, mat: string, bevel = 0): Geo => reuv(boxBounds(min, max, mat, bevel));
const sbox = (size: V3, center: V3, mat: string, bevel = 0): Geo => reuv(box(size, center, mat, bevel));

// A rock of geo.ts turned and moved (sandstone courses run level across it).
const R = (size: V3, seed: number, at: V3, rot = 0, mat = "Desert_Rock", rough = 0.35, flat = false): Geo =>
  translate(rotateZ(reuv(rock(size, rough, seed, mat, flat)), rot), at);

// A drift of sand (or anything) rising h above `at`, rx by ry across where it meets the ground:
// a bell, its toe running out gently into the ground.
function cap(rx: number, ry: number, h: number, at: V3, mat = "Desert_Sand", segs = 16): Geo {
  const prof: P2[] = [[1.08, -0.05]];
  for (let i = 8; i >= 0; i--) {
    const t = i / 8;
    prof.push([t, (1 - t * t) ** 2]);
  }
  const geo = new THREE.LatheGeometry(prof.map(([r, z]) => new THREE.Vector2(r, z)), segs);
  geo.rotateX(Math.PI / 2);
  geo.scale(rx, ry, h);
  geo.translate(...at);
  geo.computeVertexNormals();
  const g = geo.toNonIndexed();
  worldUv(g);
  return [{ geo: g, mat }];
}

// A crescent dune (a barchan): the long windward slope on its outer side (-X), a steep slip
// face inside the crescent, the horns trailing downwind (+X); the crest is `H` high.
function dune(Rc: number, thm: number, H: number, Ww: number, Wl: number, mat: string): Geo {
  const nt = 18, nd = 12;
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= nt; i++) {
    const th = -thm + (2 * thm * i) / nt, k = Math.cos(((th / thm) * Math.PI) / 2);
    const cx = Rc * (1 - Math.cos(th)), cy = Rc * Math.sin(th), nx = -Math.cos(th), ny = Math.sin(th);
    const hh = H * Math.pow(Math.max(0, k), 1.2), ww = Ww * (0.45 + 0.55 * k), wl = Wl * (0.5 + 0.5 * k);
    for (let j = 0; j <= nd; j++) {
      const d = -wl + ((ww + wl) * j) / nd;
      let z = d >= 0 ? hh * Math.pow(1 - d / ww, 1.6) : hh * Math.pow(1 + d / wl, 0.6);
      if (j === 0 || j === nd) z = -6;
      pos.push(cx + nx * d, cy + ny * d, Math.max(-6, z));
    }
  }
  for (let i = 0; i < nt; i++)
    for (let j = 0; j < nd; j++) {
      const a = i * (nd + 1) + j, b = a + nd + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const g = geo.toNonIndexed();
  worldUv(g);
  return [{ geo: g, mat }];
}

// Sand piled against a wall from a to b (its foot on z = at), running out `W` from it on the
// side `out` (a unit vector), `H` high at the wall and tapering at both ends.
function wallDrift(a: P2, b: P2, out: P2, W: number, H: number, mat = "Desert_Sand", z0 = 0): Geo {
  const nu = 14, nd = 8, L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= nu; i++) {
    const u = i / nu, hh = H * Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + u * 0.84)), 0.5);
    const reach = W * (0.55 + 0.45 * Math.sin(Math.PI * u)) * (1 + 0.12 * Math.sin(u * 17 + L));
    // the ends run out a little past a and b
    const ex = (u - 0.5) * 0.18 * L;
    const px = a[0] + (b[0] - a[0]) * u, py = a[1] + (b[1] - a[1]) * u;
    for (let j = 0; j <= nd; j++) {
      const d = -40 + ((reach + 40) * j) / nd, t = Math.max(0, d) / reach;
      const z = j === nd ? -6 : z0 + hh * Math.pow(1 - t, 1.7) * (1 - 0.15 * Math.sin(j * 1.3 + i));
      const k = d / L;
      pos.push(px + out[0] * d + ((b[0] - a[0]) / L) * ex * k * 2, py + out[1] * d + ((b[1] - a[1]) / L) * ex * k * 2, z);
    }
  }
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nd; j++) {
      const p0 = i * (nd + 1) + j, p1 = p0 + nd + 1;
      // wind so the faces look up, whichever side `out` is on
      const cross = (b[0] - a[0]) * out[1] - (b[1] - a[1]) * out[0];
      if (cross > 0) idx.push(p0, p1, p0 + 1, p0 + 1, p1, p1 + 1);
      else idx.push(p0, p0 + 1, p1, p0 + 1, p1 + 1, p1);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const g = geo.toNonIndexed();
  worldUv(g);
  return [{ geo: g, mat }];
}

// A 2D outline extruded `depth`: "yz" = outline (y, z) extruded along +X from x = at; "xz" =
// outline (x, z) along +Y from y = at. A bevel rounds the edges (the outline stays where it is).
function prism(outer: P2[], depth: number, plane: "yz" | "xz", at: number, mat: string, bevel = 0): Geo {
  const shape = new THREE.Shape(outer.map(([a, b]) => new THREE.Vector2(a, b)));
  const geo = new THREE.ExtrudeGeometry(shape, bevel > 0
    ? { depth: depth - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 2, curveSegments: 1 }
    : { depth, bevelEnabled: false, curveSegments: 1 });
  geo.translate(0, 0, bevel);
  const m = new THREE.Matrix4();
  if (plane === "yz") m.set(0, 0, 1, at, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1);
  else m.set(1, 0, 0, 0, 0, 0, -1, at + depth, 0, 1, 0, 0, 0, 0, 0, 1);
  geo.applyMatrix4(m);
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.clearGroups();
  g.computeVertexNormals();
  worldUv(g);
  return [{ geo: g, mat }];
}

// A profile of [radius, height] points from the bottom up, turned round Z; `wob` pushes the
// radius in and out round the axis (a trunk or a rock that is not a perfect cylinder).
function lathe(profile: P2[], segs: number, mat: string, bottom: V3 = [0, 0, 0], wob?: (a: number, z: number) => number, flat = false): Geo {
  const geo = new THREE.LatheGeometry(profile.map(([r, z]) => new THREE.Vector2(r, z)), segs);
  let len = 0;
  for (let i = 1; i < profile.length; i++) len += Math.hypot(profile[i][0] - profile[i - 1][0], profile[i][1] - profile[i - 1][1]);
  const rmax = Math.max(...profile.map((p) => p[0]));
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * 2 * Math.PI * rmax) / 100, (uv.getY(i) * len) / 100);
  geo.rotateX(Math.PI / 2);
  if (wob) {
    const pos = geo.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), f = wob(Math.atan2(y, x), z);
      pos.setXYZ(i, x * f, y * f, z);
    }
  }
  geo.translate(...bottom);
  let g: THREE.BufferGeometry;
  if (flat) {
    g = geo.toNonIndexed();
    g.computeVertexNormals();
  } else {
    geo.computeVertexNormals();
    g = geo.toNonIndexed();
  }
  return [{ geo: g, mat }];
}

// A block whose top is smaller than its foot (bx by at the bottom, tx ty at the top, the top's
// centre moved by sx sy): pylons, plinths, a snout.
function frustum(bx: number, by: number, tx: number, ty: number, h: number, bottom: V3, mat: string, sx = 0, sy = 0): Geo {
  const [cx, cy, cz] = bottom;
  const b: P2[] = [[-bx / 2, -by / 2], [bx / 2, -by / 2], [bx / 2, by / 2], [-bx / 2, by / 2]];
  const t: P2[] = [[-tx / 2, -ty / 2], [tx / 2, -ty / 2], [tx / 2, ty / 2], [-tx / 2, ty / 2]];
  const P = (i: number, top: boolean): V3 => (top ? [cx + sx + t[i][0], cy + sy + t[i][1], cz + h] : [cx + b[i][0], cy + b[i][1], cz]);
  const pos: number[] = [];
  const quad = (a: V3, bb: V3, c: V3, d: V3) => pos.push(...a, ...bb, ...c, ...a, ...c, ...d);
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    quad(P(i, false), P(j, false), P(j, true), P(i, true));
  }
  quad(P(0, true), P(1, true), P(2, true), P(3, true));
  quad(P(3, false), P(2, false), P(1, false), P(0, false));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  worldUv(geo);
  return [{ geo, mat }];
}

// A flat polygon seen from both sides (torn canvas, a rag).
function sheet(pts: V3[], mat: string): Geo {
  const pos: number[] = [];
  for (let i = 1; i + 1 < pts.length; i++) {
    const a = pts[0], b = pts[i], c = pts[i + 1];
    pos.push(...a, ...b, ...c, ...a, ...c, ...b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  worldUv(geo);
  return [{ geo, mat }];
}

// ---- plants: leaf-card crowns (trees.ts) and crossed cards of grass blades ----
const ZUP_TO_YUP = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
// Blades of grass (or reeds) painted on a transparent canvas, roots along the bottom.
function bladeCanvas(dark: number[], light: number[], count: number, seed: number, heads: "seed" | "cattail" | "none"): HTMLCanvasElement {
  const W = 128, H = 256;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const rnd = seeded(seed);
  const rgb = (a: number[], k = 1) => `rgb(${a.map((v) => Math.min(255, Math.round(v * k))).join(",")})`;
  for (let i = 0; i < count; i++) {
    const x0 = W * (0.12 + 0.76 * rnd()), len = H * (0.45 + 0.53 * rnd()), lean = (rnd() - 0.5) * W * 0.55, w = 2 + rnd() * 3;
    const t = rnd(), col = dark.map((d, j) => d + (light[j] - d) * (0.2 + 0.8 * t));
    const grad = g.createLinearGradient(0, H, 0, H - len);
    grad.addColorStop(0, rgb(col, 0.55));
    grad.addColorStop(0.55, rgb(col, 0.92));
    grad.addColorStop(1, rgb(col, 1.08));
    g.fillStyle = grad;
    const tx = x0 + lean, ty = H - len;
    g.beginPath();
    g.moveTo(x0 - w, H);
    g.quadraticCurveTo(x0 - w * 0.5 + lean * 0.2, H - len * 0.5, tx, ty);
    g.quadraticCurveTo(x0 + w * 0.5 + lean * 0.2, H - len * 0.5, x0 + w, H);
    g.closePath();
    g.fill();
    const ang = Math.atan2(lean, len);
    if (heads === "seed" && rnd() < 0.55) {
      g.fillStyle = rgb(light, 1.12);
      g.beginPath();
      g.ellipse(x0 + lean * 0.9, H - len * 0.9, 2.6, 11, ang, 0, Math.PI * 2);
      g.fill();
    }
    if (heads === "cattail" && rnd() < 0.3) {
      g.fillStyle = "rgb(96,62,36)";
      g.beginPath();
      g.ellipse(x0 + lean * 0.78, H - len * 0.78, 4.2, 14, ang, 0, Math.PI * 2);
      g.fill();
    }
  }
  return c;
}

// Grass cards: drawn from the front only, each card twice (one for each side) so both sides
// are lit as the ground is; they sway in the same wind as the trees.
const grassMats = new Map<string, [THREE.MeshStandardMaterial, THREE.MeshDepthMaterial]>();
function grassMaterial(key: string, canvas: () => HTMLCanvasElement): [THREE.MeshStandardMaterial, THREE.MeshDepthMaterial] {
  let pair = grassMats.get(key);
  if (!pair) {
    const tex = new THREE.CanvasTexture(canvas());
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.4, side: THREE.FrontSide, roughness: 0.92, vertexColors: true });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uWind = wind;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uWind;")
        .replace("#include <begin_vertex>", `#include <begin_vertex>
          float sway = clamp(position.y / 120.0, 0.0, 1.6);
          transformed.x += sin(uWind * 1.7 + position.x * 0.02 + position.z * 0.013) * 4.0 * sway;
          transformed.z += cos(uWind * 1.3 + position.z * 0.02) * 3.0 * sway;`);
    };
    pair = [mat, new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.4 })];
    grassMats.set(key, pair);
  }
  return pair;
}

interface Card { c: V3; w: number; h: number; yaw: number; shade: number; tilt?: number }
function cardMesh(cards: Card[], key: string, canvas: () => HTMLCanvasElement): THREE.Mesh {
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], col: number[] = [];
  for (const k of cards) {
    const dx = Math.cos(k.yaw), dy = Math.sin(k.yaw), nx = -dy, ny = dx, t = k.tilt ?? 0;
    const b0: V3 = [k.c[0] - (dx * k.w) / 2, k.c[1] - (dy * k.w) / 2, k.c[2]];
    const b1: V3 = [k.c[0] + (dx * k.w) / 2, k.c[1] + (dy * k.w) / 2, k.c[2]];
    const t0: V3 = [b0[0] + nx * t, b0[1] + ny * t, b0[2] + k.h];
    const t1: V3 = [b1[0] + nx * t, b1[1] + ny * t, b1[2] + k.h];
    const verts: [V3, number, number][] = [[b0, 0, 0], [b1, 1, 0], [t1, 1, 1], [b0, 0, 0], [t1, 1, 1], [t0, 0, 1]];
    for (const s of [1, -1]) {
      const n = new THREE.Vector3(nx * s * 0.35, ny * s * 0.35, 1).normalize();
      const order = s > 0 ? [0, 2, 1, 3, 5, 4] : [0, 1, 2, 3, 4, 5];
      for (const o of order) {
        const [p, u, v] = verts[o];
        pos.push(...p);
        nor.push(n.x, n.y, n.z);
        uv.push(u, v);
        const sh = k.shade * (0.72 + 0.28 * v);
        col.push(sh, sh, sh);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.applyMatrix4(ZUP_TO_YUP);
  const [mat, depth] = grassMaterial(key, canvas);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.customDepthMaterial = depth;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
const GOLD = () => bladeCanvas([150, 112, 44], [238, 206, 122], 46, 61, "seed");
const STRAW = () => bladeCanvas([118, 116, 48], [206, 196, 104], 42, 67, "seed");
const REED = () => bladeCanvas([58, 96, 38], [150, 180, 82], 30, 71, "cattail");

// a tuft: cards crossed round a point
function tuftCards(at: V3, w: number, h: number, n: number, rnd: () => number): Card[] {
  const out: Card[] = [];
  const a0 = rnd() * Math.PI;
  for (let i = 0; i < n; i++) {
    out.push({ c: [at[0] + (rnd() - 0.5) * 16, at[1] + (rnd() - 0.5) * 16, at[2]], w: w * (0.85 + rnd() * 0.3), h: h * (0.8 + rnd() * 0.35), yaw: a0 + (i / n) * Math.PI, shade: 0.86 + rnd() * 0.16, tilt: (rnd() - 0.5) * 20 });
  }
  return out;
}

// ======================================================================================
// rocks
// ======================================================================================

// หินทรายก้อนใหญ่: a big weathered sandstone boulder with smaller ones fallen against it.
function boulderBig(): Geo {
  return merge(
    R([400, 330, 290], 11, [0, 0, 0], 12),
    R([260, 220, 200], 13, [-120, 170, 0], -25, "Desert_RockRed"),
    R([220, 180, 140], 17, [130, -180, 0], 40, "Desert_RockPale"),
    R([120, 100, 70], 19, [-230, -120, 0], 10),
    R([90, 80, 50], 23, [200, 170, 0], 70, "Desert_RockRed"),
    R([300, 250, 90], 29, [30, -10, 240], 30, "Desert_RockPale", 0.3, true),
  );
}

// หินแผ่นแบน: low flat slabs of layered rock, one over the other.
function boulderFlat(): Geo {
  return merge(
    R([470, 340, 120], 31, [0, 0, 0], 8, "Desert_RockPale", 0.3, true),
    R([300, 240, 100], 37, [60, -40, 52], -20, "Desert_Rock", 0.3, true),
    R([150, 120, 70], 41, [-230, 150, 0], 30, "Desert_RockRed", 0.4, true),
    R([90, 80, 40], 43, [210, 170, 0], 0, "Desert_Rock", 0.4, true),
  );
}

// กองหินแตก: a scatter of broken rocks of every size.
function rockCluster(): Geo {
  return merge(
    R([210, 180, 170], 47, [0, 0, 0], 0),
    R([160, 140, 120], 53, [150, 120, 0], 35, "Desert_RockRed"),
    R([140, 120, 90], 59, [-140, 110, 0], -20, "Desert_RockPale"),
    R([120, 100, 110], 61, [-80, -150, 0], 60),
    R([90, 80, 60], 67, [170, -110, 0], 10, "Desert_RockGrey"),
    R([70, 60, 40], 71, [-230, -30, 0], 0, "Desert_RockRed"),
    R([60, 50, 36], 73, [60, 230, 0], 0, "Desert_RockPale"),
    R([50, 40, 30], 79, [250, 20, 0], 0),
  );
}

// เสาหินรูปเห็ด: a hoodoo, a pillar of soft banded rock worn thin under a hard cap stone.
function hoodoo(): Geo {
  const wob = (a: number, z: number) => 1 + 0.1 * Math.sin(3 * a + z * 0.01) + 0.06 * Math.sin(5 * a + 1.3);
  return merge(
    lathe([[160, -10], [150, 40], [128, 120], [118, 150]], 9, "Desert_RockRed", [0, 0, 0], wob, true),
    lathe([[118, 150], [125, 190], [98, 260], [92, 300]], 9, "Desert_Rock", [0, 0, 0], wob, true),
    lathe([[92, 300], [102, 330], [70, 400], [62, 452], [0, 452]], 9, "Desert_RockPale", [0, 0, 0], wob, true),
    R([300, 260, 120], 83, [10, -10, 430], 20, "Desert_RockGrey", 0.25, true),
    R([150, 120, 80], 89, [-150, 90, 0], 10, "Desert_RockRed"),
    R([100, 90, 60], 97, [130, -130, 0], 40, "Desert_Rock"),
    R([60, 50, 36], 101, [40, 170, 0], 0, "Desert_RockGrey"),
  );
}

// ซุ้มหินโค้งใหญ่: a great natural arch of red sandstone that the wind has cut through; you walk
// under it along X. Its feet stand at y = -560 .. -300 and 300 .. 560.
function rockArchBig(): Geo {
  const out: P2[] = [[-760, 0], [-735, 260], [-705, 520], [-650, 730], [-520, 850], [-300, 905], [-40, 920], [230, 900], [460, 840], [615, 715], [690, 520], [722, 260], [760, 0],
    [330, 0], [325, 240], [300, 440], [235, 590], [110, 670], [-40, 690], [-180, 660], [-280, 580], [-330, 430], [-345, 220], [-350, 0]];
  return merge(
    prism(out, 360, "yz", -180, "Desert_Rock", 40),
    // banded courses on the faces
    prism([[-745, 120], [-720, 300], [-330, 300], [-345, 120]], 384, "yz", -192, "Desert_RockRed", 16),
    prism([[322, 120], [310, 300], [705, 300], [730, 120]], 384, "yz", -192, "Desert_RockRed", 16),
    prism([[-560, 780], [-290, 850], [-40, 865], [220, 850], [480, 785], [445, 745], [220, 805], [-40, 818], [-280, 805], [-525, 745]], 380, "yz", -190, "Desert_RockPale", 14),
    // a lumpy top and buttresses of fallen rock round the feet
    R([300, 460, 110], 103, [0, -140, 850], 0, "Desert_RockPale", 0.3, true),
    R([240, 280, 100], 107, [20, 330, 780], 20, "Desert_Rock", 0.3, true),
    R([420, 360, 300], 109, [-40, -620, 0], 15, "Desert_RockRed"),
    R([380, 330, 260], 113, [50, 620, 0], -10, "Desert_Rock"),
    R([200, 180, 140], 127, [-260, -470, 0], 30, "Desert_RockPale"),
    R([220, 200, 120], 131, [240, 470, 0], 0, "Desert_RockRed"),
    R([150, 130, 90], 137, [230, -520, 0], 60),
    R([120, 100, 70], 139, [-250, 520, 0], 20, "Desert_RockGrey"),
    R([80, 70, 50], 149, [-330, -390, 0], 0, "Desert_RockRed"),
    R([70, 60, 40], 151, [330, 380, 0], 0),
  );
}

// ภูหินยอดตัด: a butte, a tower of banded rock with a flat top standing on its own talus.
function butte(): Geo {
  const wob = (a: number, z: number) => 1 + 0.11 * Math.sin(3 * a + 0.5) + 0.07 * Math.sin(7 * a + z * 0.004) + 0.04 * Math.sin(11 * a);
  return merge(
    lathe([[560, -10], [500, 60], [420, 150], [370, 190]], 13, "Desert_RockPale", [0, 0, 0], wob, true),
    lathe([[370, 190], [380, 230], [350, 360], [362, 400]], 13, "Desert_RockRed", [0, 0, 0], wob, true),
    lathe([[362, 400], [345, 430], [335, 560], [350, 600]], 13, "Desert_Rock", [0, 0, 0], wob, true),
    lathe([[350, 600], [330, 640], [320, 760], [330, 790], [300, 805], [0, 812]], 13, "Desert_RockRed", [0, 0, 0], wob, true),
    R([260, 220, 70], 157, [60, -40, 790], 10, "Desert_RockPale", 0.3, true),
    R([260, 230, 220], 163, [-420, -200, 0], 0, "Desert_Rock"),
    R([220, 200, 160], 167, [380, 330, 0], 30, "Desert_RockRed"),
    R([180, 150, 120], 173, [-200, 460, 0], 20, "Desert_RockPale"),
    R([140, 120, 90], 179, [460, -300, 0], 0, "Desert_Rock"),
    R([90, 80, 60], 181, [-560, 160, 0], 0, "Desert_RockRed"),
  );
}

// ======================================================================================
// trees, scrub and grass
// ======================================================================================

// ต้นอะคาเซียยอดแบน: the savanna's lone tree: a leaning trunk that forks into spreading limbs
// under a flat umbrella of small leaves.
function acacia(): THREE.Group {
  const B = "Desert_AcaciaBark", rnd = seeded(5);
  const fork: V3 = [34, 14, 270];
  const ends: V3[] = [[-200, 100, 500], [235, -70, 525], [60, 230, 515], [110, -235, 490], [-95, -150, 535], [-60, 170, 545]];
  const parts: Geo[] = [limb([[0, 0, 0], [12, 4, 100], [24, 10, 190], fork], 30, 17, B, { flare: 0.55, roots: 4, gnarl: 0.6, seed: 5, seg: 8 })];
  const lobes: Lobe[] = [[20, 0, 598, 190, 172, 34]];
  for (const e of ends) {
    // each limb climbs steeply out of the fork, then leans out flat under the canopy
    const m: V3 = [fork[0] + (e[0] - fork[0]) * 0.38, fork[1] + (e[1] - fork[1]) * 0.38, fork[2] + (e[2] - fork[2]) * 0.72];
    parts.push(limb([fork, m, e], 13, 5.5, B, { gnarl: 0.5, seed: e[0], seg: 6, maxRings: 6 }));
    for (let t = 0; t < 2; t++) {
      const a = Math.atan2(e[1], e[0]) + (t ? 0.7 : -0.7) + (rnd() - 0.5) * 0.4, l = 70 + rnd() * 30;
      parts.push(limb([e, [e[0] + Math.cos(a) * l * 0.5, e[1] + Math.sin(a) * l * 0.5, e[2] + 30], [e[0] + Math.cos(a) * l, e[1] + Math.sin(a) * l, e[2] + 48]], 5, 1.2, B, { seg: 4, maxRings: 3 }));
    }
    lobes.push([e[0] * 1.22, e[1] * 1.22, e[2] + 52, 150, 136, 30]);
  }
  // the flat-topped crown: thin pancakes of fine leaflets, their cards turned up to the sky
  const cards = new LeafCards();
  cards.clip = { min: [-424, -450, 0], max: [474, 437, 667] };
  const pads = crownLobes(lobes, rnd, 3).lobes;
  parts.push(foliage({ seed: 7, lobes: pads, leaf: 46, look: CANOPY.acacia, flat: 1.1, core: 0, under: 0.35, ragged: 0.55, density: 1.45 }, cards));
  return treeObject(merge(...parts), [cards, "fine"]);
}

// ต้นเบาบับยักษ์: a giant baobab, the savanna's landmark: a bottle of a trunk and a crown of
// stubby limbs with tufts of leaves.
function baobab(): THREE.Group {
  const B = "Desert_BaobabBark";
  const wob = (a: number, z: number) => 1 + 0.07 * Math.sin(3 * a + 0.4) + 0.05 * Math.sin(5 * a + 1 + z * 0.003) + 0.03 * Math.sin(9 * a);
  const parts: Geo[] = [lathe([[200, -10], [212, 40], [222, 150], [214, 270], [188, 390], [150, 490], [118, 570], [102, 630], [0, 640]], 14, B, [0, 0, 0], wob)];
  const rnd = seeded(11);
  // roots spreading from the foot into the ground
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    parts.push(limb([[Math.cos(a) * 160, Math.sin(a) * 160, 64], [Math.cos(a + 0.05) * 236, Math.sin(a + 0.05) * 236, 18], [Math.cos(a + 0.1) * 288, Math.sin(a + 0.1) * 288, -8]], 38, 12, B, { seg: 7, gnarl: 0.5, seed: 20 + i }));
  }
  const lobes: Lobe[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + rnd() * 0.4, r1 = 250 + rnd() * 70, up = 760 + rnd() * 80;
    const base: V3 = [Math.cos(a) * 50, Math.sin(a) * 50, 590];
    const end: V3 = [Math.cos(a) * r1, Math.sin(a) * r1, up];
    const m: V3 = [Math.cos(a) * r1 * 0.45, Math.sin(a) * r1 * 0.45, 600 + (up - 600) * 0.7];
    parts.push(limb([base, m, end], 36, 16, B, { seg: 8, gnarl: 0.6, seed: 30 + i }));
    for (const side of [-1, 1]) {
      const b = a + side * 0.45, r2 = r1 + 90 + rnd() * 60;
      const tip: V3 = [Math.cos(b) * r2, Math.sin(b) * r2, up + 70 + rnd() * 70];
      parts.push(limb([end, [(end[0] + tip[0]) / 2, (end[1] + tip[1]) / 2, (end[2] + tip[2]) / 2 + 10], tip], 15, 4.5, B, { seg: 6, maxRings: 4 }));
      lobes.push([tip[0], tip[1], tip[2] + 30, 112, 102, 60]);
    }
  }
  const cards = new LeafCards();
  cards.clip = { min: [-512, -498, 0], max: [553, 503, 1117] };
  const tufts = crownLobes(lobes, rnd, 3);
  parts.push(foliage({ seed: 13, lobes: tufts.lobes, leaf: 54, look: CANOPY.savanna, core: 0.75, details: tufts.lobes.map(() => 0), density: 0.85, flat: 0.5 }, cards));
  return treeObject(merge(...parts), [cards, "canopy"]);
}

// ต้นไม้ยืนตาย: a dead tree, bleached and twisted, its branches snapped short.
function deadTree(): Geo {
  const W = "Desert_DeadWood";
  const parts: Geo[] = [
    limb([[0, 0, 0], [15, -5, 120], [-10, 12, 235], [6, 0, 340]], 24, 6, W, { flare: 0.6, roots: 5, gnarl: 0.8, seed: 3, seg: 7, taper: 0.8, grainU: true, step: 45 }),
    limb([[13, -4, 112], [70, -38, 170], [115, -65, 225], [150, -60, 300]], 9, 1.5, W, { gnarl: 0.5, seed: 4, grainU: true, seg: 5, maxRings: 4 }),
    limb([[-8, 11, 228], [-70, 45, 280], [-125, 75, 320], [-160, 40, 385]], 8, 1.2, W, { gnarl: 0.5, seed: 5, grainU: true, seg: 5, maxRings: 4 }),
    limb([[-80, 48, 280], [-96, 92, 310], [-110, 130, 330]], 3, 1.2, W, { seg: 4, grainU: true, maxRings: 2 }),
    limb([[4, 4, 300], [40, 52, 352], [85, 95, 410]], 6, 2, W, { seg: 4, grainU: true, maxRings: 3 }),
    limb([[-6, 8, 190], [18, 70, 225], [45, 125, 250]], 6, 3.5, W, { seg: 4, grainU: true, maxRings: 3 }),
    limb([[10, -2, 270], [-14, -48, 300], [-40, -90, 330]], 4, 1.5, W, { seg: 4, grainU: true, maxRings: 2 }),
  ];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4;
    parts.push(limb([[Math.cos(a) * 8, Math.sin(a) * 8, 26], [Math.cos(a) * 34, Math.sin(a) * 34, 6], [Math.cos(a + 0.12) * 58, Math.sin(a + 0.12) * 58, -6]], 11, 5, W, { seg: 4, maxRings: 3, grainU: true }));
  }
  return merge(...parts);
}

// พุ่มหนามแห้ง: a thorn scrub, olive-grey and thin over a tangle of dark twigs (the twigs show
// through the gaps), a few small orange flowers.
defineMaterial("Desert_ScrubCore", { map: "foliage", tint: "#6a6638", rough: 1, bump: 1.5 });
defineMaterial("Desert_ScrubCardDark", { card: "leaves", tint: "#6e6a3a", rough: 0.95 });
defineMaterial("Desert_ScrubCard", { card: "leaves", tint: "#9c9858", rough: 0.9 });
defineMaterial("Desert_ScrubCardLight", { card: "leaves", tint: "#c8c084", rough: 0.85 });
const THORN: ShrubLook = { core: "Desert_ScrubCore", dark: "Desert_ScrubCardDark", mid: "Desert_ScrubCard", light: "Desert_ScrubCardLight" };
function dryBush(): Geo {
  const rnd = seeded(17);
  const twigs: Geo[] = [];
  for (let i = 0; i < 11; i++) {
    const a = rnd() * Math.PI * 2, r = 30 + rnd() * 60;
    twigs.push(cylinderBetween([Math.cos(a) * 8, Math.sin(a) * 8, 0], [Math.cos(a) * r, Math.sin(a) * r, 50 + rnd() * 50], 3.5, 5, "Desert_DarkWood", 1.2));
  }
  return merge(...twigs, shrub({
    seed: 19, leaf: 26, look: THORN, ragged: 0.85, density: 0.75, core: 0.55,
    lobes: [[0, 0, 64, 62, 58, 40], [42, -30, 48, 46, 44, 32], [-38, 32, 44, 44, 42, 30], [30, 36, 54, 40, 38, 28], [-34, -34, 52, 40, 38, 28], [6, 4, 86, 38, 36, 24]],
    flowers: { cells: [FLOWER_CELLS.tinyOrange], n: 6, size: 14 },
  }));
}

// ขอนไม้ล้ม: a fallen trunk gone grey, its root plate up on one end and the other end splintered.
function fallenLog(): Geo {
  const W = "Desert_DeadWood";
  const rnd = seeded(23);
  const parts: Geo[] = [
    limb([[0, -150, 31], [4, 0, 30], [6, 155, 26]], 32, 26, W, { seg: 10, grainU: true, gnarl: 0.4, seed: 23 }),
    translate(rotateX(cylinderAt({ radius: 55, height: 24, segments: 9, bottom: [0, 0, 0] }, "Desert_DarkWood"), 90), [0, -150, 40]),
    cylinderBetween([6, 154, 26], [6, 157, 26], 23, 10, "Desert_WoodEnd"),
    limb([[8, -40, 50], [34, -30, 84], [60, -15, 108]], 8, 4, W, { seg: 6, maxRings: 3, grainU: true }),
    limb([[-18, 60, 44], [-50, 78, 58], [-80, 92, 66]], 7, 3, W, { seg: 6, maxRings: 3, grainU: true }),
  ];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    parts.push(cylinderBetween([0, -172, 40], [Math.cos(a) * 85, -186 - rnd() * 20, Math.max(-6, 40 + Math.sin(a) * 85)], 8, 5, "Desert_DarkWood", 3));
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    parts.push(cylinderBetween([6 + Math.cos(a) * 16, 150, 26 + Math.sin(a) * 16], [6 + Math.cos(a) * 12, 172 + rnd() * 26, 26 + Math.sin(a) * 12], 7, 4, W, 1));
  }
  return merge(...parts);
}

// ตอไม้แห้ง: a dead stump with a jagged broken top and roots gripping the ground.
function stump(): Geo {
  const W = "Desert_DeadWood";
  const rnd = seeded(29);
  const parts: Geo[] = [
    cylinderAt({ rBot: 42, rTop: 35, height: 58, segments: 10, bottom: [0, 0, 0] }, W),
    cylinderAt({ radius: 31, height: 3, segments: 10, bottom: [0, 0, 56] }, "Desert_WoodEnd"),
  ];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rnd() * 0.4;
    parts.push(cylinderBetween([Math.cos(a) * 27, Math.sin(a) * 27, 52], [Math.cos(a) * 23, Math.sin(a) * 23, 72 + rnd() * 40], 9, 5, W, 1.5));
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    parts.push(limb([[Math.cos(a) * 26, Math.sin(a) * 26, 24], [Math.cos(a) * 54, Math.sin(a) * 54, 6], [Math.cos(a + 0.1) * 85, Math.sin(a + 0.1) * 85, -6]], 13, 5, W, { seg: 6, maxRings: 4, gnarl: 0.6, grainU: true }));
  }
  return merge(...parts);
}

// กอหญ้าสูง: a tuft of tall golden savanna grass.
function grassTuft(): THREE.Object3D {
  const g = new THREE.Group();
  g.add(cardMesh(tuftCards([0, 0, -2], 150, 125, 5, seeded(31)), "desert_gold", GOLD));
  return g;
}

// ดงหญ้าสะวันนา: a patch of tall grass, golden with greener tufts among it.
function grassPatch(): THREE.Object3D {
  const rnd = seeded(37);
  const gold: Card[] = [], straw: Card[] = [];
  for (let i = 0; i < 13; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd());
    const at: V3 = [Math.cos(a) * d * 170, Math.sin(a) * d * 140, -2];
    (i % 3 ? gold : straw).push(...tuftCards(at, 120 + rnd() * 50, 95 + rnd() * 45, 3, rnd));
  }
  const g = new THREE.Group();
  g.add(cardMesh(gold, "desert_gold", GOLD), cardMesh(straw, "desert_straw", STRAW));
  return g;
}

// กอกกริมน้ำ: a clump of reeds and bulrushes for the oasis shore.
function reeds(): THREE.Object3D {
  const rnd = seeded(41);
  const cards: Card[] = [];
  for (let i = 0; i < 6; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd());
    cards.push(...tuftCards([Math.cos(a) * d * 80, Math.sin(a) * d * 80, -2], 110, 170 + rnd() * 50, 3, rnd));
  }
  const g = new THREE.Group();
  g.add(cardMesh(cards, "desert_reed", REED));
  return g;
}

// ======================================================================================
// sand, bones and wrecks
// ======================================================================================

// สันเนินทราย: a crescent dune, its horns trailing downwind (+X), a low drift beside it.
function duneRidge(): Geo {
  return merge(dune(470, 1.0, 175, 330, 140, "Desert_Sand"), cap(160, 200, 40, [-260, 120, 0], "Desert_SandDark"));
}

// โครงกระดูกสัตว์: the bleached skeleton of a great horned beast, half in the sand.
function bones(): Geo {
  const B = "Desert_Bone";
  const parts: Geo[] = [
    // the skull, its horns sweeping back
    scale(sphereCenter(30, [0, 0, 0], B, 10), [1.1, 1.25, 0.85], [0, 0, 0]).map((p) => ({ geo: p.geo.translate(0, -150, 24), mat: p.mat })),
    frustum(46, 50, 30, 30, 70, [0, -175, 10], B, 0, -60),
    sphereCenter(7, [-17, -168, 30], "Desert_Shadow", 6),
    sphereCenter(7, [17, -168, 30], "Desert_Shadow", 6),
  ];
  for (const s of [-1, 1]) {
    parts.push(cylinderBetween([s * 24, -140, 38], [s * 70, -132, 52], 8, 6, B, 6));
    parts.push(cylinderBetween([s * 70, -132, 52], [s * 95, -112, 82], 6, 6, B, 4));
    parts.push(cylinderBetween([s * 95, -112, 82], [s * 92, -90, 112], 4, 5, B, 1.5));
  }
  // the lower jaw, fallen aside
  parts.push(translate(rotateZ(frustum(40, 14, 30, 10, 12, [0, 0, 0], B, 0, 0), 30), [55, -210, 0]));
  // the spine and the ribs standing up out of the sand
  for (let i = 0; i < 13; i++) {
    const y = -105 + i * 22, x = Math.sin(i * 0.35) * 10;
    parts.push(box([16, 14, 12], [x, y, 9], B, 2));
    if (i >= 1 && i <= 8) {
      for (const s of [-1, 1]) {
        if (s > 0 && i === 6) continue; // a broken rib
        const pts: V3[] = [];
        for (let k = 0; k <= 4; k++) {
          const a = (k / 4) * (Math.PI * 0.62);
          pts.push([x + s * (14 + Math.sin(a) * 52), y + k * 3, 12 + Math.sin(a * 1.6) * 52 - k * 6]);
        }
        for (let k = 0; k < 4; k++) parts.push(beamBetween(pts[k], pts[k + 1], 5, 4, B));
      }
    }
  }
  // the pelvis and a few long bones
  parts.push(box([60, 34, 20], [8, 190, 12], B, 4));
  parts.push(cylinderBetween([60, 150, 6], [105, 225, 6], 5, 6, B, 5), sphereCenter(8, [60, 150, 6], B, 6), sphereCenter(8, [105, 225, 6], B, 6));
  parts.push(cylinderBetween([-70, 80, 5], [-125, 30, 5], 5, 6, B, 5), sphereCenter(7, [-70, 80, 5], B, 6), sphereCenter(7, [-125, 30, 5], B, 6));
  parts.push(cap(90, 70, 16, [-10, 120, 0]), cap(70, 60, 12, [40, -60, 0]));
  return merge(...parts);
}

// a clay jar (lathe)
function jar(at: V3, s = 1, mat = "Desert_Clay"): Geo {
  return lathe([[0, 0], [16 * s, 0], [26 * s, 18 * s], [30 * s, 42 * s], [24 * s, 66 * s], [13 * s, 78 * s], [15 * s, 88 * s], [12 * s, 90 * s], [0, 90 * s]], 12, mat, at);
}

// a wooden crate with darker frame boards
function crate(at: V3, sz = 60, rot = 0): Geo {
  const h = sz / 2;
  return translate(rotateZ(merge(
    boxAt([sz, sz, sz], [0, 0, 0], "WoodWarm", 2),
    box([sz + 2, 8, 8], [0, -h + 3, 4], "WoodDark"), box([sz + 2, 8, 8], [0, h - 3, 4], "WoodDark"),
    box([sz + 2, 8, 8], [0, -h + 3, sz - 4], "WoodDark"), box([sz + 2, 8, 8], [0, h - 3, sz - 4], "WoodDark"),
    box([8, sz + 2, 8], [-h + 3, 0, sz - 4], "WoodDark"), box([8, sz + 2, 8], [h - 3, 0, sz - 4], "WoodDark"),
  ), rot), at);
}

// a spoked cart wheel standing in the plane XZ (axle along Y), its hub at the origin
function wheel(r: number, mat = "WoodDark"): Geo {
  const parts: Geo[] = [rotateX(torus(r, 5, 16, 6, mat), 90), cylinderBetween([0, -9, 0], [0, 9, 0], 9, 8, "WoodShade")];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    parts.push(beamBetween([0, 0, 0], [Math.cos(a) * r, 0, Math.sin(a) * r], 4, 4, mat));
  }
  return merge(...parts);
}

// ซากเกวียนคาราวาน: a wrecked caravan wagon tipped on its broken side in the sand: snapped
// shafts, the canopy hoops bare but for a rag of canvas, a wheel lying off, its load spilled.
function cartWreck(): Geo {
  const W = "WoodWarm", WD = "WoodDark", P = "Desert_DeadWood";
  const body: Geo[] = [];
  for (let i = 0; i < 6; i++) if (i !== 3) body.push(box([i === 5 ? 250 : 340, 24, 8], [i === 5 ? 45 : 0, -70 + i * 28, 52], P, 1));
  body.push(box([330, 10, 10], [0, -40, 44], WD), box([330, 10, 10], [0, 40, 44], WD));
  body.push(box([340, 6, 36], [0, -83, 74], P, 1), box([200, 6, 36], [70, 83, 74], P, 1));
  body.push(translate(rotateX(box([120, 6, 30], [0, 0, 0], P, 1), 40), [-110, 92, 52]));
  body.push(box([6, 166, 36], [168, 0, 74], WD, 1));
  // the canopy hoops, one snapped
  for (const [x, whole] of [[-120, true], [0, true], [120, false]] as [number, boolean][]) {
    const n = whole ? 8 : 4;
    for (let k = 0; k < n; k++) {
      const a0 = (k / 8) * Math.PI, a1 = ((k + 1) / 8) * Math.PI;
      body.push(beamBetween([x, -83 * Math.cos(a0), 90 + 85 * Math.sin(a0)], [x, -83 * Math.cos(a1), 90 + 85 * Math.sin(a1)], 5, 5, WD));
    }
  }
  // a rag of canvas still on the back hoops
  const rag: V3[] = [];
  for (let k = 0; k <= 5; k++) {
    const a = (k / 8) * Math.PI;
    rag.push([0, -83 * Math.cos(a), 90 + 85 * Math.sin(a)]);
  }
  for (let k = 5; k >= 0; k--) {
    const a = (k / 8) * Math.PI;
    rag.push([120 - (k % 2) * 30, -83 * Math.cos(a), 90 + 85 * Math.sin(a) - (k % 2) * 20]);
  }
  body.push(sheet(rag, "Desert_Canvas"));
  // the axle, one wheel still on
  body.push(cylinderBetween([110, -90, 42], [110, 95, 42], 5, 6, WD), translate(wheel(58), [110, 100, 42]));
  // shafts at the front, one snapped
  body.push(beamBetween([-170, -40, 46], [-330, -45, 40], 8, 8, W), beamBetween([-170, 40, 46], [-250, 46, 44], 8, 8, W));
  // the wagon has tipped onto its broken side
  const parts: Geo[] = [translate(rotateX(merge(...body), -11, [0, -90, 0]), [0, 0, -16])];
  parts.push(translate(rotateY(wheel(58), 88), [-40, -215, 7]));
  parts.push(beamBetween([-260, 60, 4], [-360, 120, 4], 8, 8, W));
  parts.push(crate([230, 150, 0], 58, 25), translate(rotateY(crate([0, 0, 0], 50, 0), 30), [260, 30, 6]));
  parts.push(translate(rotateY(jar([0, 0, 0], 0.9), 95), [175, -160, 26]));
  parts.push(cylinderBetween([-80, 170, 16], [60, 185, 16], 16, 10, "FeltRed"));
  parts.push(cap(200, 80, 42, [20, -125, 0]), cap(110, 90, 30, [250, 80, 0]));
  return merge(...parts);
}

// ======================================================================================
// the cart track: waystation and signposts
// ======================================================================================

// ศาลาพักกองคาราวาน: a waystation on the cart track: a flat-roofed adobe hut with beam ends
// through its walls, a reed-mat porch on poles, water jars, a trough and a hitching rail out
// front, firewood along one side and a ladder up the back to the roof.
function waystation(): Geo {
  const A = "Desert_Adobe", AD = "Desert_AdobeDark", W = "WoodWarm", WD = "WoodDark", P = "Desert_DeadWood";
  const parts: Geo[] = [
    sboxB([-10, -250, 0], [470, 250, 30], "Desert_RuinDark", 4),
    sboxB([0, -240, 30], [460, 240, 300], A, 6),
    sboxB([-8, -248, 296], [468, 248, 316], AD, 3),
    sboxB([-8, -248, 316], [468, -232, 350], A, 3), sboxB([-8, 232, 316], [468, 248, 350], A, 3), sboxB([452, -232, 316], [468, 232, 350], A, 3),
    sboxB([-8, -232, 316], [8, -22, 350], A, 3), sboxB([-8, 22, 316], [8, 232, 350], A, 3),
    box([46, 12, 7], [-30, 0, 320], WD),
  ];
  // beam ends through the walls
  for (let x = 40; x <= 420; x += 76) for (const s of [-1, 1]) parts.push(cylinderBetween([x, s * 236, 272], [x, s * 268, 270], 8, 7, WD, 7));
  // the door: a dark doorway, its frame and a plank door ajar
  parts.push(boxBounds([-3, -60, 30], [2, 60, 245], "Desert_Shadow"));
  parts.push(boxBounds([-12, -78, 30], [4, -60, 262], W, 2), boxBounds([-12, 60, 30], [4, 78, 262], W, 2), boxBounds([-16, -92, 245], [6, 92, 268], WD, 2));
  parts.push(rotateZ(merge(boxBounds([-8, -52, 34], [0, 58, 240], "DoorWood", 1), box([4, 100, 10], [-10, 3, 80], WD), box([4, 100, 10], [-10, 3, 195], WD)), -60, [-4, 58, 0]));
  // windows with wooden grilles on the sides and the back
  const win = (): Geo => merge(
    box([80, 4, 70], [0, 0, 185], "Desert_Shadow"),
    box([96, 8, 10], [0, 0, 147], W), box([96, 8, 10], [0, 0, 223], W), box([10, 8, 80], [-45, 0, 185], W), box([10, 8, 80], [45, 0, 185], W),
    box([5, 6, 70], [-20, 0, 185], WD), box([5, 6, 70], [0, 0, 185], WD), box([5, 6, 70], [20, 0, 185], WD),
  );
  parts.push(translate(win(), [230, -242, 0]), translate(win(), [230, 242, 0]), translate(rotateZ(win(), 90), [462, -110, 0]));
  // the porch: two poles, a beam, rafters to the wall and a reed mat roof sloping to the front
  for (const s of [-1, 1]) parts.push(cylinderAt({ radius: 11, height: 256, segments: 8, bottom: [-300, s * 270, 0] }, P), cylinderAt({ radius: 15, height: 14, segments: 8, bottom: [-300, s * 270, 0] }, "Desert_RuinDark"));
  parts.push(box([16, 600, 16], [-300, 0, 258], WD), box([14, 520, 14], [-8, 0, 276], WD));
  for (let y = -260; y <= 260; y += 65) parts.push(beamBetween([-322, y, 268], [-4, y, 284], 8, 8, P));
  parts.push(translate(rotateY(box([344, 616, 7], [0, 0, 0], "Desert_Thatch"), -2.8), [-166, 0, 293]));
  parts.push(box([12, 616, 16], [-336, 0, 283], "Desert_Thatch"));
  // under the porch: a bench, water jars, a lantern, the sign
  parts.push(boxBounds([-62, 80, 40], [-20, 230, 48], W, 1), boxAt([30, 8, 40], [-41, 92, 0], WD), boxAt([30, 8, 40], [-41, 218, 0], WD));
  parts.push(jar([-60, -150, 0]), jar([-42, -198, 0], 0.8), jar([-100, -192, 0], 1.1, "Desert_Ochre"));
  parts.push(box([2, 2, 26], [-300, -150, 237], "IronDark"), box([16, 16, 24], [-300, -150, 212], "LanternGlow"), cylinderAt({ rBot: 13, rTop: 2, height: 10, segments: 4, bottom: [-300, -150, 224] }, "IronDark"));
  parts.push(box([6, 150, 42], [-306, 60, 228], W, 1), cylinderBetween([-309, 60, 230], [-311, 60, 230], 13, 12, "Desert_Turquoise"), box([7, 150, 6], [-307, 60, 212], "FabricRed"));
  // out front: a stone trough and a hitching rail
  parts.push(sboxB([-470, -390, 0], [-250, -310, 20], "Desert_RuinDark", 2));
  parts.push(sboxB([-470, -390, 20], [-250, -382, 56], "Desert_RuinDark", 2), sboxB([-470, -318, 20], [-250, -310, 56], "Desert_RuinDark", 2));
  parts.push(sboxB([-470, -382, 20], [-462, -318, 56], "Desert_RuinDark", 2), sboxB([-258, -382, 20], [-250, -318, 56], "Desert_RuinDark", 2));
  parts.push(boxBounds([-462, -382, 20], [-258, -318, 46], "Desert_Water"));
  for (const y of [130, 350]) parts.push(cylinderAt({ radius: 9, height: 112, segments: 7, bottom: [-420, y, 0] }, P));
  parts.push(beamBetween([-420, 110, 100], [-420, 370, 100], 10, 10, P), translate(rotateX(torus(14, 2.5, 10, 5, "RopeTan"), 90), [-420, 200, 86]));
  // the back: a ladder to the roof
  for (const y of [-70, 10]) parts.push(beamBetween([505, y, 0], [466, y, 345], 8, 6, P));
  for (let k = 1; k <= 7; k++) {
    const t = k / 8;
    parts.push(beamBetween([505 - 39 * t, -70, 345 * t], [505 - 39 * t, 10, 345 * t], 4, 4, P));
  }
  // firewood stacked along the west side, sacks along the east
  for (let row = 0; row < 3; row++)
    for (let k = 0; k < 4 - row; k++) parts.push(cylinderBetween([120, 262 + k * 21 + row * 10, 10 + row * 18], [360, 262 + k * 21 + row * 10, 10 + row * 18], 10, 7, "Desert_DarkWood"));
  parts.push(boxAt([10, 60, 70], [114, 300, 0], WD), boxAt([10, 60, 70], [366, 300, 0], WD));
  for (const [x, y, r] of [[110, -278, 0], [170, -284, 20], [140, -270, 40]] as V3[]) parts.push(translate(scale(sphereCenter(28, [0, 0, 0], "FabricSand", 8), [1, 0.8, 1.2]), [x, y, 30 + r]));
  // on the roof: a rolled rug and a basket
  parts.push(cylinderBetween([300, -120, 330], [300, 120, 330], 16, 10, "FabricRed"), cylinderAt({ rBot: 22, rTop: 28, height: 34, segments: 10, bottom: [150, 130, 316] }, "Desert_Wicker"));
  return merge(...parts);
}

// ป้ายบอกทาง: a signpost of three arrow boards on a pole, set in a cairn of stones, a rag
// tied on top for luck.
function signpost(): Geo {
  const P = "Desert_DeadWood";
  const arrow = (len: number, z: number, yaw: number, paint: string): Geo => rotateZ(merge(
    box([len, 5, 26], [len / 2 + 6, 0, z], "WoodWarm", 1),
    translate(rotateY(box([19, 5, 19], [0, 0, 0], "WoodWarm", 1), 45), [len + 6, 0, z]),
    box([len * 0.7, 6, 5], [len * 0.45 + 6, 0, z + 2], paint),
  ), yaw);
  return merge(
    boxAt([14, 14, 280], [0, 0, 0], P, 2),
    cylinderAt({ rBot: 12, rTop: 1, height: 14, segments: 4, bottom: [0, 0, 280] }, P),
    arrow(110, 240, 90, "Desert_Turquoise"),
    arrow(100, 205, -90, "FabricRed"),
    arrow(90, 170, 180, "Desert_Ochre"),
    sheet([[8, -2, 268], [8, 18, 262], [10, 30, 230], [8, 22, 236], [8, 8, 252]], "FabricRed"),
    R([80, 70, 40], 191, [0, 0, 0], 0, "Desert_RockGrey"),
    R([50, 46, 34], 193, [-40, 30, 0], 20, "Desert_Rock"),
    R([46, 40, 30], 197, [36, -32, 0], 50, "Desert_RockPale"),
    R([36, 34, 26], 199, [10, 8, 30], 0, "Desert_RockGrey"),
  );
}

// ======================================================================================
// the ruins of the old city
// ======================================================================================

// กำแพงโบราณพัง (6 ม.): a run of ancient sandstone wall, 6 m along Y, its top broken into steps,
// blocks fallen at its foot and sand drifted against it. Tiles end to end along Y.
function ruinWall(): Geo {
  const rnd = seeded(211);
  const parts: Geo[] = [];
  const L = 600, T = 100, C = 50;
  const prof: P2[] = [[-300, 4], [-180, 7], [-60, 6], [60, 3], [180, 5], [300, 3]];
  const courses = (y: number) => {
    for (let i = 0; i + 1 < prof.length; i++) if (y <= prof[i + 1][0]) return prof[i][1] + ((prof[i + 1][1] - prof[i][1]) * (y - prof[i][0])) / (prof[i + 1][0] - prof[i][0]);
    return prof[prof.length - 1][1];
  };
  const mats = ["Desert_Ruin", "Desert_Ruin", "Desert_RuinDark", "Desert_RuinPale"];
  for (let k = 0; k < 7; k++) {
    let y = -L / 2 - (k % 2 ? 60 : 0);
    while (y < L / 2) {
      const len = 100 + Math.floor(rnd() * 3) * 25;
      const y0 = Math.max(-L / 2, y), y1 = Math.min(L / 2, y + len);
      y += len;
      if (y1 - y0 < 30 || k + 0.5 > courses((y0 + y1) / 2)) continue;
      const top = k + 1.5 > courses((y0 + y1) / 2);
      const m = mats[Math.floor(rnd() * mats.length)];
      let g = sbox([T - rnd() * 8, y1 - y0 - 4, C - 3], [(rnd() - 0.5) * 6, (y0 + y1) / 2, k * C + C / 2], m, 4);
      if (top && rnd() < 0.5) g = rotateZ(g, (rnd() - 0.5) * 8, [0, (y0 + y1) / 2, 0]);
      parts.push(g);
    }
  }
  // glyphs carved on a few blocks, both faces
  for (const s of [-1, 1]) for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) parts.push(box([4, 22, 18], [s * 51, -230 + c * 40, 80 + r * 34], "Desert_RuinDark"));
  // a coping stone where it still stands full height
  parts.push(sbox([T + 20, 200, 18], [0, -170, 7 * C + 9], "Desert_RuinPale", 3));
  // fallen blocks and sand at its foot
  parts.push(translate(rotateY(sbox([90, 120, 46], [0, 0, 0], "Desert_Ruin", 4), 14), [-120, 60, 20]));
  parts.push(translate(rotateZ(sbox([80, 110, 46], [0, 0, 23], "Desert_RuinDark", 4), 30), [-110, 230, 0]));
  parts.push(translate(rotateZ(sbox([90, 100, 46], [0, 0, 23], "Desert_Ruin", 4), -20), [125, -60, 0]));
  parts.push(translate(rotateY(sbox([70, 90, 44], [0, 0, 0], "Desert_RuinPale", 4), -18), [115, 200, 18]));
  parts.push(wallDrift([-50, -300], [-50, 260], [-1, 0], 170, 70), wallDrift([50, -240], [50, 300], [1, 0], 190, 95, "Desert_SandDark"));
  return merge(...parts);
}

// a column of the old city: plinth, moulded base, fluted drums and a capital (or broken off at
// `h` above the plinth with a jagged top)
function column(at: V3, h: number, whole: boolean, seed: number): Geo {
  const [x, y, z] = at;
  const rnd = seeded(seed);
  const parts: Geo[] = [
    sboxB([x - 66, y - 66, z], [x + 66, y + 66, z + 34], "Desert_RuinDark", 4),
    cylinderAt({ rBot: 60, rTop: 56, height: 14, segments: 16, bottom: [x, y, z + 34] }, "Desert_Ruin"),
    cylinderAt({ rBot: 54, rTop: 50, height: 10, segments: 16, bottom: [x, y, z + 48] }, "Desert_RuinPale"),
  ];
  const drum = 92, n = Math.ceil(h / drum);
  for (let i = 0; i < n; i++) {
    const hh = Math.min(drum, h - i * drum), r0 = 47 - (i * drum * 6) / 480, r1 = 47 - ((i * drum + hh) * 6) / 480;
    const dx = (rnd() - 0.5) * (whole ? 1 : 4), dy = (rnd() - 0.5) * (whole ? 1 : 4);
    parts.push(cylinderAt({ rBot: r0, rTop: r1, height: hh - 1, segments: 16, bottom: [x + dx, y + dy, z + 58 + i * drum] }, "Desert_Fluted"));
  }
  const top = z + 58 + h;
  if (whole) {
    parts.push(cylinderAt({ rBot: 42, rTop: 62, height: 30, segments: 16, bottom: [x, y, top] }, "Desert_Ruin"));
    parts.push(sboxB([x - 70, y - 70, top + 30], [x + 70, y + 70, top + 52], "Desert_RuinPale", 3));
  } else {
    parts.push(R([84, 80, 34], seed + 3, [x, y, top - 14], rnd() * 90, "Desert_Ruin", 0.5));
    parts.push(R([46, 40, 30], seed + 5, [x + 14, y - 10, top + 2], 0, "Desert_RuinPale", 0.5));
  }
  return merge(...parts);
}

// เสาหินโบราณ: a column of the old city still standing, broken off near the top.
function ruinColumn(): Geo {
  return merge(
    column([0, 0, 0], 340, false, 221),
    R([70, 60, 40], 227, [100, -80, 0], 30, "Desert_Ruin", 0.5),
    R([50, 46, 30], 229, [-90, 70, 0], 0, "Desert_RuinPale", 0.5),
    cap(110, 100, 26, [10, 0, 0]),
  );
}

// a fallen capital: echinus and abacus lying on their side
function fallenCapital(at: V3, yaw: number): Geo {
  const g = merge(cylinderAt({ rBot: 42, rTop: 62, height: 30, segments: 16, bottom: [0, 0, 0] }, "Desert_Ruin"), sboxB([-70, -70, 30], [70, 70, 52], "Desert_RuinPale", 3));
  return translate(rotateZ(rotateY(g, 96), yaw), at);
}

// เสาโบราณล้ม: a column fallen in its drums along Y, its capital rolled off the end.
function columnFallen(): Geo {
  const F = "Desert_Fluted";
  return merge(
    sboxB([-66, -360, 0], [66, -228, 34], "Desert_RuinDark", 4),
    cylinderAt({ rBot: 58, rTop: 54, height: 14, segments: 16, bottom: [0, -294, 34] }, "Desert_Ruin"),
    cylinderAt({ rBot: 47, rTop: 46, height: 44, segments: 16, bottom: [0, -294, 48] }, F),
    R([84, 80, 30], 233, [0, -294, 82], 0, "Desert_Ruin", 0.5),
    cylinderBetween([-6, -205, 41], [4, -118, 41], 47, 16, F, 46),
    cylinderBetween([12, -108, 40], [-4, -20, 40], 46, 16, F, 45),
    cylinderBetween([-14, -8, 39], [10, 78, 39], 45, 16, F, 44),
    cylinderBetween([22, 96, 38], [36, 180, 38], 44, 16, F, 43),
    fallenCapital([40, 262, 70], 12),
    R([60, 50, 30], 239, [-90, 60, 0], 0, "Desert_RuinPale", 0.5),
    R([46, 40, 26], 241, [100, -150, 0], 40, "Desert_Ruin", 0.5),
    cap(130, 160, 30, [-60, 40, 0]), cap(100, 120, 24, [80, 200, 0], "Desert_SandDark"),
  );
}

// a seated lion-sphinx on a pedestal guarding a stair, facing -X (its head broken off and lying
// beside it when `broken`)
function guardian(broken: boolean): Geo {
  const S = "Desert_StatueDark", SP = "Desert_Statue";
  const parts: Geo[] = [
    sboxB([-160, -66, 0], [160, 66, 70], "Desert_RuinDark", 3),
    sboxB([-170, -76, 70], [170, 76, 84], SP, 2),
    sboxB([10, -46, 84], [135, 46, 156], S, 14),
    sboxB([-85, -40, 84], [60, 40, 146], S, 10),
    sboxB([-155, -40, 84], [-75, -14, 104], S, 5),
    sboxB([-155, 14, 84], [-75, 40, 104], S, 5),
    sboxB([-115, -36, 100], [-40, 36, 196], S, 9),
    cylinderBetween([130, 40, 92], [60, 56, 88], 8, 6, S, 6),
  ];
  const head = merge(
    sboxB([-150, -30, 180], [-88, 30, 250], SP, 8),
    frustum(40, 86, 36, 64, 74, [-96, 0, 172], "Desert_Turquoise"),
    sboxB([-160, -7, 196], [-146, 7, 224], SP, 3),
    sboxB([-152, -26, 226], [-148, -10, 232], "Desert_Shadow"),
    sboxB([-152, 10, 226], [-148, 26, 232], "Desert_Shadow"),
    sboxB([-153, -36, 246], [-86, 36, 256], "Desert_Gold"),
  );
  if (!broken) parts.push(head);
  else parts.push(translate(rotateX(rotateZ(head, 60, [-110, 0, 180]), 80, [-110, 0, 180]), [-30, 190, -150]), R([50, 46, 30], 251, [-100, 0, 196], 0, S, 0.5));
  return merge(...parts);
}

// a winged sun disc carved over a doorway, on the plane x = x0 (facing -X)
function sunDisc(x0: number, z: number, span: number): Geo {
  const parts: Geo[] = [cylinderBetween([x0, 0, z], [x0 - 7, 0, z], 26, 14, "Desert_Gold")];
  for (const s of [-1, 1]) {
    parts.push(box([5, span, 9], [x0 - 2, s * (30 + span / 2), z + 10], "Desert_Turquoise"));
    parts.push(box([5, span * 0.8, 8], [x0 - 2, s * (30 + span * 0.4), z], "Desert_Turquoise"));
    parts.push(box([5, span * 0.55, 7], [x0 - 2, s * (30 + span * 0.28), z - 10], "Desert_Turquoise"));
  }
  return merge(...parts);
}

// วิหารโบราณครึ่งจม: the temple of the old city, half under the sand: a stepped podium and a
// front stair between two lion guardians (one headless), a portico of fluted columns under a
// broken architrave, the cella's thick walls with a great doorway, glyph columns and a winged
// sun disc; its back half has fallen in, the roof slabs tipped into the sand inside, and dunes
// bury its west side and back.
function templeRuin(): Geo {
  const S = "Desert_Ruin", SD = "Desert_RuinDark", SP = "Desert_RuinPale";
  const H0 = 160;
  const parts: Geo[] = [
    sboxB([-700, -900, 0], [700, 900, 55], SD, 4), sboxB([-660, -860, 55], [660, 860, 110], S, 4), sboxB([-620, -820, 110], [620, 820, H0], SD, 4),
    sboxB([-612, -812, H0], [612, 812, H0 + 2], "Desert_Paving"),
  ];
  // the stair and its cheek walls
  for (let i = 0; i < 6; i++) parts.push(sboxB([-880 + i * 30, -300, 0], [-640, 300, ((i + 1) * H0) / 6], SP, 2));
  for (const s of [-1, 1]) {
    parts.push(sboxB([-900, s > 0 ? 300 : -360, 0], [-760, s > 0 ? 360 : -300, 80], SD, 3));
    parts.push(sboxB([-760, s > 0 ? 300 : -360, 0], [-640, s > 0 ? 360 : -300, H0 + 30], SD, 3));
  }
  // the portico: four columns whole under the architrave, two broken
  for (const y of [-630, -380, -130, 130]) parts.push(column([-560, y, H0], 480, true, 300 + y));
  parts.push(column([-560, 380, H0], 230, false, 311), column([-560, 630, H0], 60, false, 313));
  const top = H0 + 58 + 480 + 52;
  parts.push(sboxB([-615, -700, top], [-505, 200, top + 80], S, 3));
  parts.push(sboxB([-618, -690, top + 26], [-613, 190, top + 50], "Desert_Turquoise"));
  for (let y = -660; y <= 160; y += 90) parts.push(sboxB([-620, y, top + 20], [-614, y + 30, top + 56], SP));
  parts.push(sboxB([-630, -720, top + 80], [-490, 215, top + 104], SP, 3));
  // the cella: thick walls round a dark doorway
  const T = top + 70; // the walls' top
  parts.push(sboxB([-420, -560, H0], [-330, -150, T], S), sboxB([-420, 150, H0], [-330, 560, T], S), sboxB([-420, -150, 560], [-330, 150, T], S));
  parts.push(sboxB([-330, -150, H0], [-100, 150, 560], "Desert_Shadow"));
  for (const s of [-1, 1]) parts.push(sboxB([-434, s > 0 ? 150 : -192, H0], [-418, s > 0 ? 192 : -150, 580], SP));
  parts.push(sboxB([-438, -205, 560], [-418, 205, 645], SP, 2), sunDisc(-438, 602, 120));
  for (const s of [-1, 1]) for (let c = 0; c < 3; c++) for (let r = 0; r < 9; r++) parts.push(box([4, 30, 24], [-422, s * (240 + c * 90) + ((r * 7) % 5) * 2, H0 + 110 + r * 40], SD));
  parts.push(sboxB([-330, -560, H0], [560, -470, T], S));
  parts.push(sboxB([-330, 470, H0], [100, 560, T], S), sboxB([100, 470, H0], [560, 560, 420], S), sboxB([100, 470, 420], [260, 560, 560], SD), sboxB([100, 470, 560], [170, 560, 650], S));
  parts.push(sboxB([470, -470, H0], [560, -100, T], S), sboxB([470, -100, H0], [560, 470, 480], S), sboxB([470, -100, 480], [560, 90, 570], SD));
  // the cornice on the walls that still stand full height, a painted band below it
  parts.push(sboxB([-440, -580, T], [-310, 580, T + 34], SP, 3), sboxB([-310, -580, T], [580, -450, T + 34], SP, 3), sboxB([-310, 450, T], [100, 580, T + 34], SP, 3), sboxB([450, -450, T], [580, -100, T + 34], SP, 3));
  parts.push(sboxB([-330, -563, T - 90], [560, -559, T - 70], "Desert_Turquoise"), sboxB([-330, 559, T - 90], [100, 563, T - 70], "Desert_Turquoise"));
  parts.push(sboxB([-423, -560, T - 90], [-419, -210, T - 70], "Desert_Turquoise"), sboxB([-423, 210, T - 90], [-419, 560, T - 70], "Desert_Turquoise"));
  // the roof over the front half; the back half fallen in
  parts.push(sboxB([-330, -470, T - 40], [100, 470, T], SD));
  parts.push(sboxB([-330, -470, H0], [470, 470, H0 + 4], "Desert_Paving"));
  parts.push(translate(rotateY(sbox([300, 380, 36], [0, 0, 0], SD, 3), 28), [270, -170, H0 + 110]));
  parts.push(translate(rotateZ(sbox([260, 300, 36], [0, 0, 18], SD, 3), 14), [330, 210, H0]));
  parts.push(translate(rotateX(sbox([200, 260, 34], [0, 0, 0], S, 3), -22), [150, -300, H0 + 80]));
  parts.push(cap(250, 260, 150, [330, 200, H0]));
  // the guardians either side of the stair
  parts.push(translate(guardian(false), [-990, -480, 0]), translate(guardian(true), [-990, 480, 0]));
  // fallen pieces in front
  parts.push(translate(rotateZ(sboxB([-55, -200, 0], [55, 200, 80], S, 3), 24), [-900, 760, 0]));
  parts.push(cylinderBetween([-860, -760, 40], [-780, -840, 40], 44, 16, "Desert_Fluted", 43), fallenCapital([-950, -900, 70], 40));
  parts.push(R([90, 80, 50], 261, [-780, 640, 0], 0, S, 0.5), R([70, 60, 40], 263, [-720, -620, 0], 30, SP, 0.5));
  // dunes over its west side and back, a drift at the east corner
  parts.push(
    wallDrift([-430, 565], [570, 565], [0, 1], 520, 310),
    wallDrift([-720, 905], [720, 905], [0, 1], 420, 150, "Desert_SandDark"),
    wallDrift([565, -580], [565, 580], [1, 0], 640, 390, "Desert_SandDark"),
    wallDrift([705, -900], [705, 900], [1, 0], 420, 190),
    wallDrift([465, -460], [465, 460], [-1, 0], 360, 330),
    wallDrift([-700, -905], [-200, -905], [0, -1], 300, 90, "Desert_SandDark"),
    cap(420, 300, 90, [-560, -1020, 0]),
  );
  return merge(...parts);
}

// เศียรเทพยักษ์: the colossal head of a fallen king's statue, sunk to the chin and tipped on its
// side: a striped headcloth with a cobra on the brow, a broken nose, a crack across the face.
function colossusHead(): Geo {
  const S = "Desert_StatueDark", SP = "Desert_Statue", SH = "Desert_Shadow", TQ = "Desert_Turquoise", G = "Desert_Gold";
  const head: Geo[] = [
    // the face: brow, eyes lined in kohl, the nose broken flat, the lips, the chin
    sboxB([-100, -112, -60], [110, 112, 285], SP, 30),
    sboxB([-114, -104, 214], [-92, 104, 234], SP, 8),
    frustum(54, 56, 26, 30, 104, [-118, 0, 104], SP, 22, 0),
    sboxB([-112, -52, 72], [-96, 52, 88], SP, 6),
    sboxB([-110, -44, 54], [-96, 44, 70], SP, 6),
    sboxB([-114, -48, 69], [-108, 48, 73], SH),
    sboxB([-112, -60, -20], [-90, 60, 50], SP, 12),
    // the headcloth: a gold band over the brow with the cobra, the cloth over the crown, the
    // tail gathered behind
    sboxB([-112, -122, 262], [-80, 122, 292], G, 4),
    cylinderBetween([-112, 0, 284], [-122, 0, 318], 9, 6, G, 6), sphereCenter(11, [-123, 0, 322], G, 8),
    frustum(250, 250, 210, 210, 70, [20, 0, 280], S, 16, 0),
    frustum(210, 210, 130, 150, 45, [36, 0, 350], S, 14, 0),
    sboxB([110, -86, -20], [196, 86, 300], S, 24),
    cylinderBetween([196, 0, 60], [222, 0, -40], 30, 8, TQ, 22),
  ];
  for (const s of [-1, 1]) {
    head.push(sboxB([-103, s * 56 - 38, 182], [-96, s * 56 + 38, 210], SH), sboxB([-104, s * 56 - 12, 186], [-100, s * 56 + 12, 206], "Desert_RuinDark"));
    head.push(sboxB([-106, s * 56 - 37, 206], [-98, s * 56 + 37, 213], "Desert_RuinDark"));
    head.push(sboxB([-104, s > 0 ? 88 : -118, 192], [-98, s > 0 ? 118 : -88, 198], SH));
    // a lappet down each side, flaring to the shoulder, in bands of stone and turquoise
    const n = 9, hh = 350 / n, w = (t: number) => 103 - 65 * t;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      head.push(frustum(190, w(t0), 190, w(t1), hh, [36, s * (112 + w(t0) / 2), -60 + i * hh], i % 2 ? TQ : SP, 0, (s * (w(t1) - w(t0))) / 2));
    }
    // stripes over the crown
    head.push(sboxB([-90, s * 40 - 7, 349], [150, s * 40 + 7, 353], TQ), sboxB([-80, s * 85 - 7, 336], [150, s * 85 + 7, 341], TQ));
  }
  // a crack across the face
  head.push(translate(rotateY(sbox([4, 10, 130], [0, 0, 0], SH), 25), [-101, 30, 150]), translate(rotateY(sbox([4, 8, 70], [0, 0, 0], SH), -30), [-101, 44, 64]));
  // fallen back so the face looks up at the sky, turned a little, sunk to the ears
  const tipped = translate(rotateZ(rotateX(rotateY(merge(...head), 42, [150, 0, -60]), 7), -16), [-40, 0, -150]);
  return merge(
    scale(tipped, [1.5, 1.5, 1.5]),
    cap(620, 600, 120, [180, 0, 0]),
    cap(420, 300, 80, [60, -380, 0], "Desert_SandDark"),
    cap(440, 320, 80, [200, 380, 0]),
    cap(300, 380, 40, [-300, 0, 0]),
    R([90, 80, 50], 271, [-360, 300, 0], 0, "Desert_Ruin", 0.5),
    R([60, 50, 36], 277, [280, -440, 0], 0, "Desert_RuinPale", 0.5),
  );
}

// ซุ้มประตูนครโบราณ: the gate of the old city: two battered pylons with flagpole slots, glyph
// columns and a cornice, a cracked lintel with the winged sun between them over a passage 3.8 m
// wide (you walk through along X); sand drifted against their outer sides.
function ruinGate(): Geo {
  const S = "Desert_Ruin", SD = "Desert_RuinDark", SP = "Desert_RuinPale";
  const parts: Geo[] = [];
  for (const s of [-1, 1]) {
    parts.push(frustum(260, 440, 260, 340, 720, [0, s * 410, 0], S, 0, s * -50));
    parts.push(sboxB([-140, s > 0 ? 190 : -620, 0], [140, s > 0 ? 620 : -190, 40], SD, 3));
    parts.push(sboxB([-142, s > 0 ? 186 : -552, 700], [142, s > 0 ? 552 : -186, 716], "Desert_Turquoise"));
    parts.push(sboxB([-150, s > 0 ? 178 : -562, 716], [150, s > 0 ? 562 : -178, 768], SP, 4));
    for (const dy of [-110, 110]) parts.push(box([6, 26, 560], [-131, s * 410 + dy - s * 30, 340], "Desert_Shadow"), box([6, 26, 560], [131, s * 410 + dy - s * 30, 340], "Desert_Shadow"));
    for (const fx of [-1, 1]) for (let c = 0; c < 2; c++) for (let r = 0; r < 8; r++) parts.push(box([4, 24, 22], [fx * 131, s * (380 + c * 40) - s * 30, 150 + r * 40], SD));
  }
  // the lintel, cracked through the middle, and the sun disc on both faces
  parts.push(sboxB([-112, -262, 560], [112, -6, 668], SP, 3));
  parts.push(translate(rotateX(sboxB([-112, 6, 560], [112, 262, 668], SP, 3), -3, [0, 262, 668]), [0, 0, -6]));
  parts.push(sunDisc(-114, 612, 100), rotateZ(sunDisc(-114, 612, 100), 180));
  parts.push(sboxB([-126, -280, 668], [126, 280, 700], S, 3));
  // sand and fallen blocks
  parts.push(wallDrift([-150, 615], [150, 615], [0, 1], 380, 260), wallDrift([150, -615], [-150, -615], [0, -1], 340, 210, "Desert_SandDark"));
  parts.push(wallDrift([-135, 200], [-135, 600], [-1, 0], 220, 110), wallDrift([135, -600], [135, -200], [1, 0], 200, 90, "Desert_SandDark"));
  parts.push(translate(rotateZ(sbox([90, 120, 50], [0, 0, 25], S, 4), 20), [-280, -320, 0]), translate(rotateZ(sbox([80, 90, 46], [0, 0, 23], SD, 4), -35), [260, 330, 0]));
  parts.push(R([70, 60, 40], 281, [-230, 300, 0], 0, SP, 0.5));
  return merge(...parts);
}

// ======================================================================================
// the kit
// ======================================================================================

export const KIT: Kit = {
  id: "desert",
  name: "ทะเลทราย",
  region: "ใต้อีเดนถึงบาฮามัส",
  desc: "ทุ่งสะวันนา ทรายปนหิน ซุ้มหินโค้ง ซากวิหารครึ่งจม โอเอซิส",
  ground: "sand",
  items: [
    { id: "boulder_big", name: "หินทรายก้อนใหญ่", make: boulderBig, tags: ["rock", "decor"] },
    { id: "boulder_flat", name: "หินแผ่นแบน", make: boulderFlat, tags: ["rock", "decor"] },
    { id: "rock_cluster", name: "กองหินแตก", make: rockCluster, tags: ["rock", "decor"] },
    { id: "hoodoo", name: "เสาหินรูปเห็ด", make: hoodoo, tags: ["rock", "landmark"] },
    { id: "rock_arch_big", name: "ซุ้มหินโค้งใหญ่", make: rockArchBig, tags: ["rock", "landmark"] },
    { id: "butte", name: "ภูหินยอดตัด", make: butte, tags: ["rock", "landmark"] },
    { id: "baobab", name: "ต้นเบาบับยักษ์", make: baobab, tags: ["plant", "landmark"] },
    { id: "acacia", name: "ต้นอะคาเซียยอดแบน", make: acacia, tags: ["plant"] },
    { id: "dead_tree", name: "ต้นไม้ยืนตาย", make: deadTree, tags: ["plant"] },
    { id: "dry_bush", name: "พุ่มหนามแห้ง", make: dryBush, tags: ["plant"] },
    { id: "grass_tuft", name: "กอหญ้าสูง", make: grassTuft, tags: ["ground", "plant"] },
    { id: "grass_patch", name: "ดงหญ้าสะวันนา", make: grassPatch, tags: ["ground", "plant"] },
    { id: "reeds", name: "กอกกริมน้ำ", make: reeds, tags: ["ground", "plant"] },
    { id: "fallen_log", name: "ขอนไม้ล้ม", make: fallenLog, tags: ["decor"] },
    { id: "stump", name: "ตอไม้แห้ง", make: stump, tags: ["decor"] },
    { id: "dune_ridge", name: "สันเนินทราย", make: duneRidge, tags: ["dune", "decor"] },
    { id: "bones", name: "โครงกระดูกสัตว์", make: bones, tags: ["decor"] },
    { id: "cart_wreck", name: "ซากเกวียนคาราวาน", make: cartWreck, tags: ["decor"] },
    { id: "waystation", name: "ศาลาพักกองคาราวาน", make: waystation, tags: ["building"] },
    { id: "signpost", name: "ป้ายบอกทาง", make: signpost, tags: ["decor"] },
    { id: "ruin_wall", name: "กำแพงโบราณพัง (6 ม.)", make: ruinWall, tags: ["wall", "ruin"] },
    { id: "ruin_column", name: "เสาหินโบราณ", make: ruinColumn, tags: ["ruin", "decor"] },
    { id: "column_fallen", name: "เสาโบราณล้ม", make: columnFallen, tags: ["ruin", "decor"] },
    { id: "ruin_gate", name: "ซุ้มประตูนครโบราณ", make: ruinGate, tags: ["gate", "ruin", "landmark"] },
    { id: "colossus_head", name: "เศียรเทพยักษ์", make: colossusHead, tags: ["landmark", "ruin"] },
    { id: "temple_ruin", name: "วิหารโบราณครึ่งจม", make: templeRuin, tags: ["landmark", "building", "ruin"] },
  ],
  // where the savanna gives out to the sand: the cart track past a waystation and a signpost,
  // acacias and grass on the east side; rocks, an arch and the old city's ruins to the west
  sample: (put: Put) => {
    put("waystation", [300, -800, 0], 0);
    put("signpost", [-700, -150, 0], 20);
    put("cart_wreck", [-900, 700, 0], 35);
    put("acacia", [1300, -1500, 0], 20);
    put("acacia", [-1200, -1700, 0], 140, 0.8);
    put("baobab", [-1500, -500, 0], 0, 0.9);
    put("dead_tree", [1500, 300, 0], 60);
    put("dry_bush", [-300, -1300, 0], 0);
    put("dry_bush", [700, 100, 0], 90, 0.8);
    put("fallen_log", [400, -1600, 0], 70);
    put("stump", [-400, -650, 0], 0);
    for (const [x, y, h] of [[1000, -700, 0], [-200, -1800, 40], [1700, -900, 80], [-900, -1100, 20], [500, -1250, 60], [-1800, -1600, 10], [1600, -1900, 30], [100, -300, 50]]) put("grass_patch", [x, y, 0], h);
    for (const [x, y] of [[-500, -1000], [800, -1500], [-1300, -900], [1200, -400], [-100, -900], [1800, -1300], [-1700, -1100], [600, -500]]) put("grass_tuft", [x, y, 0], x);
    put("rock_arch_big", [1100, 1300, 0], 20);
    put("hoodoo", [-200, 1800, 0], 0);
    put("boulder_big", [-1700, 1500, 0], 30);
    put("boulder_flat", [1800, 100, 0], 0);
    put("rock_cluster", [400, 600, 0], 10);
    put("bones", [-150, 750, 0], 20);
    put("ruin_column", [-1600, 500, 0], 0);
    put("column_fallen", [-1200, 900, 0], 80);
    put("ruin_wall", [-500, 1250, 0], 90);
    put("colossus_head", [1900, 1900, 0], 210);
    put("dune_ridge", [-1900, 1900, 0], 30);
    put("flora:Cactus", [700, 1700, 0], 0);
    put("flora:CactusRound", [900, 1850, 0], 0);
    put("flora:Cactus", [-1000, 1700, 0], 50, 0.8);
    put("flora:PalmBent", [-1900, 700, 0], 160);
    put("reeds", [-1750, 850, 0], 0);
    put("ruin_column", [-700, 1900, 0], 40, 0.9);
    put("boulder_flat", [-300, 200, 0], 70);
    put("rock_cluster", [1700, 1000, 0], 40);
    put("stump", [1100, 500, 0], 0);
    put("dry_bush", [-1500, 1100, 0], 30);
    put("flora:CactusRound", [100, 1300, 0], 0);
    put("flora:Cactus", [1800, 600, 0], 0, 0.7);
    for (const [x, y] of [[-200, 1000], [300, 1100], [-1100, 300], [1500, 700], [600, 300]]) put("grass_tuft", [x, y, 0], y, 0.7);
  },
};
