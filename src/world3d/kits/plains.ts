// ทุ่งราบภาคกลาง (the central plains): the open country round the capital Eden, for its fields
// (the great western wood, the royal road, the pine forest by the river): mossy boulders and
// rock clusters, fallen oaks and old stumps, ferns, tall grass and reeds; a wooden bridge over
// the streams, an old forest shrine and a hunter's lodge in the wood; wheat fields with rail
// fences, hay bales and a scarecrow, a water mill, the soldiers' checkpoint, milestones and
// signposts along the royal road and, at its end, the royal castle's shut gatehouse and its
// keep; log piles, a sawing yard, a waterfall and rapids for the pine forest by the river.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front to -X.
// The plants (ferns, grass, reeds, wheat) are cards that sway in the wind. The waterfall, the
// rapids and the mill's wheel reach below z = 0 into a river (the fields' water sits at -14).

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, sphereCenter, torus, gableRoof, gableWall, rock,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial, frondTexture } from "../textures";
import type { Recipe } from "../textures";
import { wind } from "../trees";
import { solid } from "./types";
import type { Kit, Put } from "./types";

// ---- materials ----
const MATS: Record<string, Recipe> = {
  Plains_Boulder: { map: "crag", tint: "#aaa596", bump: 3 },
  Plains_RockDark: { map: "crag", tint: "#7a776e", bump: 3, rough: 0.6 },
  Plains_RockGrey: { map: "crag", tint: "#bdbab2", bump: 3 },
  Plains_Moss: { map: "felt", tint: "#5f8233", rough: 1, bump: 1.5 },
  Plains_Bark: { map: "bark", tint: "#6c5038", bump: 3 },
  Plains_BarkPine: { map: "bark", tint: "#7b5236", bump: 3 },
  Plains_LogEnd: { map: "wood", tint: "#d9b47e", bump: 1 },
  Plains_Heart: { map: "wood", tint: "#a26e3c", bump: 1 },
  Plains_Soil: { map: "felt", tint: "#694c33", rough: 1, bump: 1.5 },
  Plains_Hay: { map: "thatch", tint: "#ddbd63", bump: 2 },
  Plains_HayDark: { map: "thatch", tint: "#b8963f", bump: 2 },
  Plains_Shingle: { map: "shingles", tint: "#7c5a3d", bump: 2.5 },
  Plains_MossTile: { map: "tiles", tint: "#7f8f5e", bump: 2.5 },
  Plains_ShrineStone: { map: "stone", tint: "#c4c1ae", bump: 2 },
  Plains_Plaster: { map: "plaster", tint: "#f3ead6", bump: 0.6 },
  Plains_Timber: { map: "wood", tint: "#5b3c25", bump: 1.2 },
  Plains_Plank: { map: "wood", tint: "#9a7048", bump: 1.2 },
  Plains_PaintWhite: { map: "plaster", tint: "#f6f3ea", bump: 0.3, rough: 0.7 },
  Plains_RoyalBlue: { map: "fabric", tint: "#2f58a8", rough: 0.95 },
  Plains_Dark: { tint: "#1e1f24", rough: 1 },
  Plains_Water: { tint: "#8fd0ea", rough: 0.05, opacity: 0.7, glow: "#4b9cc8", glowI: 0.18 },
  Plains_Foam: { tint: "#f4fbff", rough: 0.5, opacity: 0.9, glow: "#d8f2ff", glowI: 0.3 },
  Plains_Mist: { tint: "#f4fbff", rough: 1, opacity: 0.25 },
  Plains_Spirit: { tint: "#c4ffe0", rough: 0.2, glow: "#4dffa6", glowI: 1.5, opacity: 0.92 },
  Plains_Mushroom: { map: "plaster", tint: "#c9432f", rough: 0.55 },
  Plains_MushroomPale: { map: "plaster", tint: "#efe4ca", rough: 0.7 },
  Plains_Fungus: { map: "felt", tint: "#c5925a", rough: 0.8 },
  Plains_Hide: { map: "felt", tint: "#a77d55", rough: 1 },
  Plains_Bone: { map: "felt", tint: "#ece0c4", rough: 0.8 },
  Plains_Sawdust: { map: "felt", tint: "#e2c48e", rough: 1 },
  Plains_Chips: { map: "felt", tint: "#b99a68", rough: 1 },
  Plains_FieldSoil: { map: "thatch", tint: "#a98a52", bump: 1.5 },
  Plains_Stubble: { map: "thatch", tint: "#c9a660", bump: 1.5 },
  Plains_Straw: { map: "thatch", tint: "#d6b45a", bump: 1.5 },
  Plains_Flour: { map: "fabric", tint: "#ece2c9", rough: 1 },
  Plains_Dirt: { map: "felt", tint: "#a98458", rough: 1 },
};
for (const [name, recipe] of Object.entries(MATS)) defineMaterial(name, recipe);

// ---- helpers ----
const D = Math.PI / 180;

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// World-aligned texture coordinates (metres / s): masonry courses stay level across boxes.
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

// Moves a Geo so its footprint is centred on the origin.
function centred(g: Geo): Geo {
  const b = new THREE.Box3();
  for (const p of g) {
    p.geo.computeBoundingBox();
    b.union(p.geo.boundingBox!);
  }
  return translate(g, [-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0]);
}

// Outlines in a -X facing wall's plane: (shape x, shape y) = (world y, world z).
function rectShape(hw: number, top: number, bottom = 0): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-hw, bottom);
  s.lineTo(hw, bottom);
  s.lineTo(hw, top);
  s.lineTo(-hw, top);
  s.lineTo(-hw, bottom);
  return s;
}
function archShape(hw: number, spring: number, bottom = 0): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-hw, bottom);
  s.lineTo(hw, bottom);
  s.lineTo(hw, spring);
  s.absarc(0, spring, hw, 0, Math.PI, false);
  s.lineTo(-hw, bottom);
  return s;
}
function shieldShape(s: number): THREE.Shape {
  const sh = new THREE.Shape();
  sh.moveTo(-s, s * 0.8);
  sh.lineTo(s, s * 0.8);
  sh.lineTo(s, 0);
  sh.quadraticCurveTo(s, -s * 0.8, 0, -s * 1.25);
  sh.quadraticCurveTo(-s, -s * 0.8, -s, 0);
  sh.lineTo(-s, s * 0.8);
  return sh;
}
function crownShape(s: number): THREE.Shape {
  const c = new THREE.Shape();
  const pts: [number, number][] = [[-s, -0.5 * s], [s, -0.5 * s], [s, 0.55 * s], [0.5 * s, 0.05 * s], [0, 0.7 * s], [-0.5 * s, 0.05 * s], [-s, 0.55 * s]];
  c.moveTo(...pts[0]);
  for (const p of pts.slice(1)) c.lineTo(...p);
  c.lineTo(...pts[0]);
  return c;
}
function tailShape(w: number, h: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, -h);
  s.lineTo(0, -h * 0.82);
  s.lineTo(-w / 2, -h);
  s.lineTo(-w / 2, 0);
  return s;
}
// A flat piece cut to a shape, facing -X, from x0 to x0 + depth.
function panel(shape: THREE.Shape, x0: number, depth: number, mat: string, seg = 6): Geo {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: seg });
  g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, x0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  const geo = g.index ? g.toNonIndexed() : g;
  geo.clearGroups();
  return wuv([{ geo, mat }]);
}
// Wedge stones round an arch in a -X facing wall: centre c, radius r, `n` stones.
function arcStones(c: V3, r: number, n: number, thick: number, depth: number, mat: string): Geo {
  const out: Geo[] = [];
  const step = 180 / n, chord = 2 * (r + thick) * Math.sin((step * D) / 2) * 1.04, rm = r + thick / 2;
  for (let i = 0; i < n; i++) {
    const a = (step * (i + 0.5)) * D;
    out.push(translate(rotateX(box([depth, chord, thick], [0, 0, 0], mat, 2), a / D - 90), [c[0], c[1] + rm * Math.cos(a), c[2] + rm * Math.sin(a)]));
  }
  return merge(...out);
}

// A log from a to b with its sawn ends showing (pale wood and a darker heart).
function log(a: V3, b: V3, r: number, bark = "Plains_Bark", seg = 9): Geo {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
  const at = (p: V3, k: number): V3 => [p[0] + d.x * k, p[1] + d.y * k, p[2] + d.z * k];
  return merge(
    cylinderBetween(a, b, r, seg, bark),
    cylinderBetween(at(a, -1.5), at(a, 1), r * 0.86, seg, "Plains_LogEnd"),
    cylinderBetween(at(b, -1), at(b, 1.5), r * 0.86, seg, "Plains_LogEnd"),
    cylinderBetween(at(a, -2), at(a, 0), r * 0.3, 6, "Plains_Heart"),
    cylinderBetween(at(b, 0), at(b, 2), r * 0.3, 6, "Plains_Heart"),
  );
}

// A rock, mossy on top when asked (the same rock a little narrower and taller pokes through
// its top as a cap of moss).
function stone(size: V3, seed: number, o: { mat?: string; flat?: boolean; moss?: number; rough?: number } = {}): Geo {
  const r = o.rough ?? 0.38;
  const g = rock(size, r, seed, o.mat ?? "Plains_Boulder", o.flat);
  if (!o.moss) return g;
  return merge(g, scale(rock(size, r, seed, "Plains_Moss", o.flat), [0.93, 0.93, 1 + 0.035 * o.moss]));
}

function mushroom(x: number, y: number, h: number, r: number, red = true): Geo {
  const out: Geo[] = [
    cylinderAt({ rBot: r * 0.34, rTop: r * 0.26, height: h + 2, segments: 6, bottom: [x, y, -2] }, "Plains_MushroomPale"),
    translate(scale(sphereCenter(r, [0, 0, 0], red ? "Plains_Mushroom" : "Plains_Fungus", 8), [1, 1, 0.55]), [x, y, h]),
  ];
  if (red) for (let i = 0; i < 4; i++) out.push(sphereCenter(r * 0.15, [x + Math.cos(i * 1.7) * r * 0.55, y + Math.sin(i * 1.7) * r * 0.55, h + r * 0.42], "Plains_MushroomPale", 4));
  return merge(...out);
}

// A crystal shard (a stretched double pyramid) standing at (x, y, z).
function shard(x: number, y: number, z: number, h: number, mat: string, tilt = 0): Geo {
  const g = merge(
    cylinderAt({ rBot: h * 0.05, rTop: h * 0.2, height: h * 0.65, segments: 5, bottom: [0, 0, 0] }, mat),
    cylinderAt({ rBot: h * 0.2, rTop: 0.5, height: h * 0.35, segments: 5, bottom: [0, 0, h * 0.65] }, mat),
  );
  return translate(rotateY(g, tilt), [x, y, z]);
}

// A lantern on an iron bracket out from a -X facing wall (bracket at z = 0).
function wallLantern(glow = "LanternGlow"): Geo {
  return merge(
    beamBetween([2, 0, 0], [-42, 0, 0], 4, 5, "IronDark"),
    beamBetween([2, 0, -28], [-26, 0, -2], 3, 3, "IronDark"),
    boxAt([14, 14, 22], [-38, 0, -42], glow),
    rotateZ(cylinderAt({ rBot: 14, rTop: 2, height: 13, segments: 4, bottom: [-38, 0, -20] }, "IronDark"), 45, [-38, 0, 0]),
    rotateZ(cylinderAt({ rBot: 10, rTop: 12, height: 4, segments: 4, bottom: [-38, 0, -46] }, "IronDark"), 45, [-38, 0, 0]),
    ...[[-7, -7], [7, -7], [-7, 7], [7, 7]].map(([x, y]) => boxAt([2.5, 2.5, 22], [-38 + x, y, -42], "IronDark")),
  );
}

// A window facing -X, the bottom of the glass at z = 0: frame, glass, bars, sill, lintel,
// shutters in `shutters` if given.
function windowGeo(w: number, h: number, o: { arch?: boolean; frame?: string; shutters?: string; glass?: string } = {}): Geo {
  const hw = w / 2, fm = o.frame ?? "Plains_Timber", spring = o.arch ? h - hw : h;
  const out: Geo[] = [
    panel(o.arch ? archShape(hw + 10, spring, -6) : rectShape(hw + 10, h + 6, -6), -8, 10, fm),
    panel(o.arch ? archShape(hw, spring) : rectShape(hw, h), -10, 2, o.glass ?? "GlassBlue"),
    boxBounds([-12, -2, 0], [-10, 2, h - 2], fm),
    boxBounds([-12, -hw, spring * 0.55 - 2], [-10, hw, spring * 0.55 + 2], fm),
    boxBounds([-16, -hw - 14, -14], [2, hw + 14, -4], fm, 2),
  ];
  if (!o.arch) out.push(boxBounds([-13, -hw - 14, h + 6], [2, hw + 14, h + 18], fm, 2));
  if (o.shutters)
    for (const sy of [-1, 1]) {
      const a = sy * (hw + 12), b = sy * (hw + 12 + hw * 0.95);
      out.push(boxBounds([-7, Math.min(a, b), 0], [-2, Math.max(a, b), spring], o.shutters));
      for (const z of [spring * 0.18, spring * 0.76]) out.push(boxBounds([-9, Math.min(a, b) + 3, z], [-7, Math.max(a, b) - 3, z + 6], o.shutters));
    }
  return merge(...out);
}

// A plank door facing -X (bottom at z = 0) in a frame, with iron straps and a ring.
function doorGeo(w: number, h: number, o: { arch?: boolean; frame?: string; double?: boolean } = {}): Geo {
  const hw = w / 2, fm = o.frame ?? "Plains_Timber", spring = o.arch ? h - hw : h;
  const out: Geo[] = [
    panel(o.arch ? archShape(hw + 14, spring) : rectShape(hw + 14, h + 10), -8, 10, fm),
    panel(o.arch ? archShape(hw, spring) : rectShape(hw, h), -11, 3, "DoorWood"),
  ];
  for (let y = -hw + 14; y < hw; y += 18) out.push(boxBounds([-12, y - 0.8, 2], [-11, y + 0.8, spring - 4], "WoodDark"));
  for (const z of [h * 0.16, spring * 0.78]) out.push(boxBounds([-14, -hw + 4, z], [-11, hw - 4, z + 7], "IronDark"));
  if (o.double) out.push(boxBounds([-13, -1.5, 0], [-11, 1.5, h - 2], "WoodDark"));
  out.push(translate(rotateY(torus(6, 1.4, 10, 4, "IronDark"), 90), [-14, o.double ? -12 : hw * 0.55, h * 0.45]));
  if (o.double) out.push(translate(rotateY(torus(6, 1.4, 10, 4, "IronDark"), 90), [-14, 12, h * 0.45]));
  return merge(...out);
}

// A hanging banner facing -X from a gold rod at z = 0: royal blue, a swallowtail, gold trim and
// a crown.
function banner(w: number, h: number, field = "Plains_RoyalBlue"): Geo {
  return merge(
    cylinderBetween([-8, -w / 2 - 10, 0], [-8, w / 2 + 10, 0], 3, 6, "GoldTrim"),
    sphereCenter(5, [-8, -w / 2 - 12, 0], "GoldTrim", 6),
    sphereCenter(5, [-8, w / 2 + 12, 0], "GoldTrim", 6),
    panel(tailShape(w, h), -6, 2, field),
    panel(rectShape(w / 2, -h * 0.14 + 3, -h * 0.14 - 3), -7, 1, "GoldTrim"),
    translate(panel(crownShape(w * 0.24), -7.5, 1, "GoldTrim"), [0, 0, -h * 0.42]),
  );
}

// Merlons along a run from a to b (on the top of a parapet at z), `depth` thick.
function merlons(a: [number, number], b: [number, number], z: number, depth: number, mat = "StoneWhite", pitch = 100, h = 70): Geo {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / pitch));
  const rot = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI, out: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    out.push(translate(rotateZ(box([pitch * 0.58, depth, h], [0, 0, h / 2], mat, 2), rot), [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, z]));
  }
  return merge(...out);
}

// A round tower in white stone, a corbelled crenellated top and a tall blue cone with a gold
// finial and a pennant.
function roundTower(r: number, h: number, roofH: number, o: { slits?: number[]; windows?: number[] } = {}): Geo {
  const ring = (rr: number, hh: number, z: number, mat: string, rTop = rr) => rotateZ(cylinderAt({ rBot: rr, rTop, height: hh, segments: 16, bottom: [0, 0, z] }, mat), 11.25);
  const top = h + 150 + roofH;
  const out: Geo[] = [
    ring(r + 40, 120, 0, "StoneGrey", r + 8),
    wuv(ring(r, h - 120, 120, "StoneWhite"), 1.4),
    ring(r + 6, 14, Math.round(h * 0.5), "StoneLight"),
    ring(r + 30, 150, h, "StoneWhite"),
    ring(r + 36, 12, h + 138, "StoneLight"),
    ring(r + 70, roofH, h + 150, "RoofBlue", 4),
    ring(r + 74, 8, h + 146, "StoneBlueDark"),
    cylinderBetween([0, 0, top - 30], [0, 0, top + 150], 3.5, 6, "IronDark"),
    sphereCenter(13, [0, 0, top + 4], "GoldTrim", 8),
    sphereCenter(6, [0, 0, top + 152], "GoldTrim", 6),
  ];
  // a pennant
  const pen = new THREE.Shape();
  pen.moveTo(0, 0);
  pen.lineTo(150, -18);
  pen.lineTo(0, -40);
  pen.lineTo(0, 0);
  out.push(translate(panel(pen, -1, 2, "Plains_RoyalBlue"), [0, 0, top + 140]));
  for (let i = 0; i < 16; i++)
    out.push(rotateZ(merge(boxBounds([r - 4, -13, h - 60], [r + 30, 13, h], "StoneLight", 1.5), boxBounds([r - 4, -9, h - 92], [r + 14, 9, h - 60], "StoneLight", 1.5)), i * 22.5));
  for (const a of o.windows ?? [0, 90, 180, 270]) out.push(translate(rotateZ(translate(windowGeo(44, 78, { arch: true, frame: "StoneLight" }), [-(r + 28), 0, h + 34]), a - 180), [0, 0, 0]));
  for (const a of o.slits ?? []) {
    for (const z of [h * 0.25, h * 0.62]) out.push(rotateZ(merge(boxBounds([-r - 8, -16, z - 8], [-r + 6, 16, z + 108], "StoneLight"), boxBounds([-r - 10, -5, z], [-r + 4, 5, z + 100], "Plains_Dark")), a - 180));
  }
  return merge(...out);
}

// ---- cards: plants as textured cards that sway in the wind ----
const ZUP_TO_YUP = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
const cardMats = new Map<string, [THREE.MeshStandardMaterial, THREE.MeshDepthMaterial]>();
// One material per texture: see-through round the painted shapes, both faces lit alike (the
// cards' normals lean up, so a field of them shades like the ground), swaying from the top.
function cardMaterial(key: string, draw: () => HTMLCanvasElement): [THREE.MeshStandardMaterial, THREE.MeshDepthMaterial] {
  let pair = cardMats.get(key);
  if (pair) return pair;
  const tex = new THREE.CanvasTexture(draw());
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.42, side: THREE.DoubleSide, roughness: 0.9, vertexColors: true });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = wind;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uWind;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        float sway = clamp(position.y / 160.0, 0.0, 1.5);
        transformed.x += sin(uWind * 1.6 + position.x * 0.013 + position.z * 0.009) * 4.0 * sway;
        transformed.z += cos(uWind * 1.3 + position.z * 0.014) * 3.0 * sway;`);
    shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\n#ifdef DOUBLE_SIDED\nnormal *= faceDirection;\n#endif");
  };
  pair = [mat, new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.42 })];
  cardMats.set(key, pair);
  return pair;
}

class Cards {
  pos: number[] = [];
  nor: number[] = [];
  uv: number[] = [];
  col: number[] = [];
  // corners a (u0, v0), b (u1, v0), c (u1, v1), d (u0, v1), each with its shade
  quad(a: V3, b: V3, c: V3, d: V3, [u0, u1, v0, v1]: [number, number, number, number], n: V3, s: [number, number, number, number]): void {
    const P = [a, b, c, a, c, d], U = [[u0, v0], [u1, v0], [u1, v1], [u0, v0], [u1, v1], [u0, v1]], S = [s[0], s[1], s[2], s[0], s[2], s[3]];
    for (let i = 0; i < 6; i++) {
      this.pos.push(...P[i]);
      this.nor.push(...n);
      this.uv.push(U[i][0], U[i][1]);
      this.col.push(S[i], S[i], S[i]);
    }
  }
  // An upright card: its bottom middle at `at`, spanning along `yaw` (degrees), leaning `lean`
  // degrees to one side; darker at its foot.
  stand(at: V3, yaw: number, w: number, h: number, o: { lean?: number; flip?: boolean; shade?: number } = {}): void {
    const c = Math.cos(yaw * D), s = Math.sin(yaw * D), l = (o.lean ?? 0) * D, k = o.shade ?? 1;
    const tx = -s * Math.sin(l) * h, ty = c * Math.sin(l) * h, tz = Math.cos(l) * h;
    const a: V3 = [at[0] - (c * w) / 2, at[1] - (s * w) / 2, at[2]], b: V3 = [at[0] + (c * w) / 2, at[1] + (s * w) / 2, at[2]];
    const n = new THREE.Vector3(-s * 0.25, c * 0.25, 1).normalize();
    this.quad(a, b, [b[0] + tx, b[1] + ty, b[2] + tz], [a[0] + tx, a[1] + ty, a[2] + tz], o.flip ? [1, 0, 0, 1] : [0, 1, 0, 1], [n.x, n.y, n.z], [0.58 * k, 0.58 * k, 1.05 * k, 1.05 * k]);
  }
  // A frond along the points `pts` (its rib), `w` wide, lying across horizontally.
  frond(pts: V3[], w: number, shade = 1): void {
    const n = pts.length - 1;
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[i + 1];
      const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1;
      const px = -dy / L, py = dx / L;
      const w0 = (w / 2) * (i === 0 ? 0.55 : 1), w1 = (w / 2) * (i === n - 1 ? 0.7 : 1);
      const nr = new THREE.Vector3(dx * 0.2 / L, dy * 0.2 / L, 1).normalize();
      const s0 = (0.62 + (0.4 * i) / n) * shade, s1 = (0.62 + (0.4 * (i + 1)) / n) * shade;
      this.quad([p[0] - px * w0, p[1] - py * w0, p[2]], [q[0] - px * w1, q[1] - py * w1, q[2]], [q[0] + px * w1, q[1] + py * w1, q[2]], [p[0] + px * w0, p[1] + py * w0, p[2]],
        [i / n, (i + 1) / n, 0, 1], [nr.x, nr.y, nr.z], [s0, s1, s1, s0]);
    }
  }
  mesh(key: string, draw: () => HTMLCanvasElement): THREE.Mesh {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(this.nor, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    geo.applyMatrix4(ZUP_TO_YUP);
    const [mat, depth] = cardMaterial(key, draw);
    const m = new THREE.Mesh(geo, mat);
    m.customDepthMaterial = depth;
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
}

function withCards(g: Geo | null, ...meshes: THREE.Mesh[]): THREE.Group {
  const grp = g ? solid(g) : new THREE.Group();
  for (const m of meshes) grp.add(m);
  return grp;
}

// ---- the cards' pictures (canvas, the plant's foot along the bottom edge) ----
function paint(w: number, h: number, seed: number, draw: (g: CanvasRenderingContext2D, rnd: () => number) => void): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!, seeded(seed));
  return c;
}
const mix = (a: number[], b: number[], t: number) => `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(",")})`;
function blade(g: CanvasRenderingContext2D, x: number, base: number, len: number, bend: number, w: number, colour: string): void {
  g.fillStyle = colour;
  g.beginPath();
  g.moveTo(x - w / 2, base);
  g.quadraticCurveTo(x - w * 0.3 + bend * 0.25, base - len * 0.55, x + bend, base - len);
  g.quadraticCurveTo(x + w * 0.3 + bend * 0.25, base - len * 0.55, x + w / 2, base);
  g.closePath();
  g.fill();
}
function grassCanvas(): HTMLCanvasElement {
  return paint(128, 128, 5, (g, rnd) => {
    for (let i = 0; i < 70; i++) blade(g, 4 + rnd() * 120, 129, 128 * (0.3 + rnd() * 0.66), (rnd() - 0.5) * 44, 4.5 + rnd() * 4, mix([40, 92, 28], [150, 206, 84], 0.2 + rnd() * 0.8));
    for (let i = 0; i < 4; i++) {
      const x = 12 + rnd() * 104, y = 8 + rnd() * 26;
      g.strokeStyle = "rgb(118,140,66)";
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(x, 128);
      g.quadraticCurveTo(x + 4, y + 40, x, y + 6);
      g.stroke();
      g.fillStyle = mix([176, 168, 96], [214, 200, 140], rnd());
      g.beginPath();
      g.ellipse(x, y, 3.5, 9, 0, 0, Math.PI * 2);
      g.fill();
    }
  });
}
function wheatCanvas(): HTMLCanvasElement {
  return paint(128, 128, 9, (g, rnd) => {
    for (let i = 0; i < 18; i++) blade(g, 6 + rnd() * 116, 129, 46 + rnd() * 44, (rnd() - 0.5) * 50, 6, mix([150, 142, 62], [210, 194, 104], rnd()));
    for (let i = 0; i < 15; i++) {
      const x = 8 + (i / 14) * 112 + (rnd() - 0.5) * 6, top = 8 + rnd() * 26, lean = (rnd() - 0.5) * 14;
      g.strokeStyle = mix([182, 142, 62], [226, 194, 110], rnd());
      g.lineWidth = 3.2;
      g.beginPath();
      g.moveTo(x, 128);
      g.quadraticCurveTo(x, top + 50, x + lean, top + 28);
      g.stroke();
      const ex = x + lean, col = mix([204, 156, 58], [248, 216, 122], rnd());
      g.fillStyle = col;
      for (let k = 0; k < 6; k++) {
        const y = top + 28 - k * 4.6;
        g.beginPath();
        g.ellipse(ex - 2.8, y, 3.4, 5, -0.35, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.ellipse(ex + 2.8, y - 2, 3.4, 5, 0.35, 0, Math.PI * 2);
        g.fill();
      }
      g.strokeStyle = "rgba(240,214,140,0.95)";
      g.lineWidth = 1.2;
      for (let k = 0; k < 5; k++) {
        g.beginPath();
        g.moveTo(ex + (k - 2) * 1.6, top + 4);
        g.lineTo(ex + (k - 2) * 3.6, top - 8);
        g.stroke();
      }
    }
  });
}
function reedCanvas(): HTMLCanvasElement {
  return paint(128, 256, 13, (g, rnd) => {
    for (let i = 0; i < 24; i++) blade(g, 6 + rnd() * 116, 257, 256 * (0.4 + rnd() * 0.52), (rnd() - 0.5) * 60, 6 + rnd() * 3, mix([50, 98, 42], [150, 186, 92], rnd()));
    for (let i = 0; i < 5; i++) {
      const x = 14 + rnd() * 100, top = 10 + rnd() * 40;
      g.strokeStyle = "rgb(96,120,58)";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x, 256);
      g.lineTo(x, top);
      g.stroke();
      g.fillStyle = mix([88, 54, 30], [128, 82, 46], rnd());
      g.beginPath();
      g.ellipse(x, top + 30, 5.5, 18, 0, 0, Math.PI * 2);
      g.fill();
    }
  });
}
const fernCanvas = () => frondTexture([28, 88, 30], [118, 188, 68]);

// ================================================================================== items

// ---- stones ----
function boulder(): Geo {
  return merge(
    stone([310, 260, 220], 7, { moss: 1 }),
    translate(rotateZ(stone([150, 120, 110], 11, { moss: 1 }), 30), [-130, 140, 0]),
    translate(stone([80, 70, 46], 15, { mat: "Plains_RockDark" }), [-165, -110, 0]),
    translate(stone([60, 50, 30], 18), [150, -150, 0]),
    translate(stone([46, 40, 24], 19, { mat: "Plains_RockGrey" }), [-60, -180, 0]),
  );
}

function rockCluster(): Geo {
  return merge(
    stone([230, 200, 170], 21, { moss: 1 }),
    translate(rotateZ(stone([200, 160, 120], 22), 40), [60, -170, 0]),
    translate(rotateZ(stone([150, 130, 95], 23, { moss: 1.4 }), -20), [-130, 110, 0]),
    translate(stone([100, 80, 55], 24, { mat: "Plains_RockDark" }), [-170, -110, 0]),
    translate(stone([170, 130, 45], 25, { flat: true, mat: "Plains_RockGrey" }), [140, 140, 0]),
    translate(stone([60, 50, 34], 26), [-20, 220, 0]),
    translate(stone([50, 44, 28], 27, { mat: "Plains_RockDark" }), [210, -20, 0]),
  );
}

function flatRock(): Geo {
  return merge(
    stone([380, 290, 70], 31, { flat: true, moss: 0.6 }),
    translate(rotateZ(stone([230, 180, 52], 32, { flat: true, mat: "Plains_RockGrey" }), 25), [70, -50, 16]),
    translate(stone([130, 100, 40], 33, { flat: true }), [-190, 130, 0]),
    translate(stone([50, 40, 26], 34, { mat: "Plains_RockDark" }), [-200, -110, 0]),
    translate(stone([38, 30, 20], 35), [170, 150, 0]),
    translate(stone([34, 28, 16], 36, { mat: "Plains_RockGrey" }), [-140, -150, 0]),
  );
}

// ---- wood on the forest floor ----
function fallenLog(): Geo {
  const out: Geo[] = [
    cylinderBetween([0, -280, 40], [0, 300, 34], 44, 10, "Plains_Bark", 37),
    cylinderBetween([0, 298, 34], [0, 304, 34], 31, 10, "Plains_LogEnd"),
    cylinderBetween([0, 303, 34], [0, 305, 34], 9, 6, "Plains_Heart"),
    // moss along its top
    scale(cylinderBetween([0, -230, 40], [0, 210, 35], 44, 10, "Plains_Moss", 38), [0.8, 1, 1.09], [0, 0, 37]),
    // the root plate, torn up with its earth
    cylinderBetween([0, -334, 72], [0, -292, 68], 122, 12, "Plains_Soil", 110),
    scale(cylinderBetween([0, -300, 72], [0, -286, 68], 112, 12, "Plains_Moss", 100), [1, 1, 1], [0, 0, 0]),
  ];
  const rnd = seeded(41);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3, L = 100 + rnd() * 50;
    const end: V3 = [Math.cos(a) * L, -320 - rnd() * 30, Math.max(-6, 70 + Math.sin(a) * L)];
    out.push(cylinderBetween([Math.cos(a) * 60, -318, 70 + Math.sin(a) * 60], end, 10, 5, "Plains_Bark", 3));
  }
  // branch stubs and a broken limb on the ground
  out.push(cylinderBetween([-20, -60, 66], [-80, -100, 132], 13, 7, "Plains_Bark", 8));
  out.push(cylinderBetween([-80, -100, 131], [-82, -101, 134], 7, 7, "Plains_LogEnd"));
  out.push(cylinderBetween([22, 110, 62], [70, 140, 100], 11, 7, "Plains_Bark", 7));
  out.push(cylinderBetween([30, 150, 30], [160, 240, 16], 15, 7, "Plains_Bark", 8));
  out.push(cylinderBetween([150, 232, 18], [190, 310, 34], 7, 5, "Plains_Bark", 3));
  out.push(cylinderBetween([110, 200, 22], [170, 180, 50], 6, 5, "Plains_Bark", 2));
  // bracket fungi and mushrooms
  for (const [y, z] of [[-150, 40], [-122, 56], [-96, 34], [60, 30]]) out.push(translate(scale(sphereCenter(17, [0, 0, 0], "Plains_Fungus", 8), [0.75, 1, 0.26]), [-44, y, z]));
  out.push(mushroom(-62, 160, 16, 11), mushroom(-74, 186, 11, 8), mushroom(-50, 205, 8, 6), mushroom(58, -200, 14, 10, false), mushroom(70, -176, 10, 7, false));
  return centred(merge(...out));
}

function stump(): Geo {
  const out: Geo[] = [
    cylinderBetween([0, 0, -4], [0, 0, 66], 46, 11, "Plains_Bark", 41),
    cylinderAt({ radius: 37, height: 3, segments: 11, bottom: [0, 0, 64] }, "Plains_LogEnd"),
    cylinderAt({ radius: 9, height: 1, segments: 8, bottom: [0, 0, 66.5] }, "Plains_Heart"),
    // moss up one side
    translate(scale(cylinderBetween([0, 0, -4], [0, 0, 44], 46, 11, "Plains_Moss", 43), [0.9, 0.75, 1]), [-10, 0, 0]),
  ];
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 + 15) * D;
    out.push(cylinderBetween([Math.cos(a) * 26, Math.sin(a) * 26, 36], [Math.cos(a) * 92, Math.sin(a) * 92, -8], 18, 7, "Plains_Bark", 6));
  }
  out.push(mushroom(-58, 40, 12, 9, false), mushroom(-48, 60, 9, 6, false), mushroom(40, -62, 14, 9));
  return merge(...out);
}

// ---- plants (cards) ----
function fernClump(): THREE.Object3D {
  const c = new Cards(), rnd = seeded(43);
  for (let i = 0; i < 13; i++) {
    const a = i * 2.4 + rnd() * 0.4, L = 85 + rnd() * 50, up = 46 + rnd() * 34, dx = Math.cos(a), dy = Math.sin(a);
    c.frond([[dx * 6, dy * 6, 3], [dx * L * 0.4, dy * L * 0.4, up], [dx * L * 0.76, dy * L * 0.76, up * 0.82], [dx * L, dy * L, up * 0.4]], 30 + rnd() * 10, 0.9 + rnd() * 0.15);
  }
  // young fronds standing up in the middle
  for (let i = 0; i < 4; i++) {
    const a = i * 1.6, dx = Math.cos(a), dy = Math.sin(a);
    c.frond([[0, 0, 2], [dx * 12, dy * 12, 50], [dx * 28, dy * 28, 80]], 22, 1.05);
  }
  return withCards(null, c.mesh("plains_fern", fernCanvas));
}

function tallGrass(): THREE.Object3D {
  const c = new Cards(), rnd = seeded(51);
  for (let i = 0; i < 3; i++) c.stand([0, 0, -2], i * 60 + 10, 120, 80 + rnd() * 18, { lean: rnd() * 10 - 5, flip: i === 1 });
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + rnd() * 0.5, r = 42 + rnd() * 26, at: V3 = [Math.cos(a) * r, Math.sin(a) * r, -2];
    c.stand(at, rnd() * 180, 74, 50 + rnd() * 24, { lean: (rnd() - 0.5) * 16 });
    c.stand(at, rnd() * 180 + 90, 64, 44 + rnd() * 20, { lean: (rnd() - 0.5) * 16, flip: true });
  }
  return withCards(null, c.mesh("plains_grass", grassCanvas));
}

function reeds(): THREE.Object3D {
  const c = new Cards(), rnd = seeded(53);
  for (let i = 0; i < 8; i++) {
    const a = i * 2.2, r = i ? 26 + rnd() * 50 : 0, at: V3 = [Math.cos(a) * r, Math.sin(a) * r, -6];
    const h = 130 + rnd() * 60;
    c.stand(at, rnd() * 180, 62 + rnd() * 20, h, { lean: (rnd() - 0.5) * 14 });
    c.stand(at, rnd() * 180 + 90, 56, h * 0.88, { lean: (rnd() - 0.5) * 14, flip: true });
  }
  return withCards(null, c.mesh("plains_reed", reedCanvas));
}

// ---- the wood's set pieces ----
// A plank bridge over a stream, walked along X: stone abutments at both banks, beams, a trestle
// either side of the middle, planks across and railings. 9.2 m long, the deck 3.5 m wide and
// only 13 cm above the ground so people walk over it.
function woodBridge(): Geo {
  const L = 460, W = 175, out: Geo[] = [], rnd = seeded(61);
  for (const s of [-1, 1]) {
    out.push(wuv(boxBounds([s < 0 ? -L - 70 : L - 110, -W - 45, -80], [s < 0 ? -L + 110 : L + 70, W + 45, 4], "StoneGrey", 3), 1.2));
    out.push(translate(stone([110, 90, 70], 63 + s, { moss: 1 }), [s * (L - 10), -W - 70, -10]), translate(stone([90, 80, 60], 66 + s, { moss: 1 }), [s * (L + 10), W + 70, -10]));
  }
  for (const y of [-W + 25, 0, W - 25]) out.push(boxBounds([-L, y - 12, -16], [L, y + 12, 6], "WoodShade", 2));
  for (const x of [-170, 170]) {
    for (const y of [-W + 25, W - 25]) out.push(boxAt([22, 22, 110], [x, y, -126], "Plains_Timber", 2));
    out.push(boxBounds([x - 12, -W, -36], [x + 12, W, -16], "Plains_Timber", 2));
    out.push(beamBetween([x, -W + 25, -110], [x, W - 25, -40], 8, 10, "Plains_Timber"));
  }
  for (let x = -L + 15; x < L; x += 31) {
    const j = (rnd() - 0.5) * 12;
    out.push(boxBounds([x - 14, -W + j * 0.5, 6], [x + 14, W + j, 13 + rnd() * 1.5], rnd() < 0.5 ? "WoodWarm" : "Plains_Plank", 1.5));
  }
  for (const s of [-1, 1]) {
    out.push(boxBounds([-L, s * W - 10, 12], [L, s * W + 10, 24], "WoodShade", 2));
    const xs = [-L + 40, -L + 200, -80, 80, L - 200, L - 40];
    for (const x of xs) out.push(boxAt([13, 13, 96], [x, s * W, 18], "Plains_Timber", 2.5), boxAt([17, 17, 6], [x, s * W, 114], "WoodShade", 2));
    out.push(beamBetween([-L + 40, s * W, 104], [L - 40, s * W, 104], 11, 10, "WoodWarm"));
    out.push(beamBetween([-L + 40, s * W, 62], [L - 40, s * W, 62], 8, 8, "WoodWarm"));
    // the ends flare out to the banks
    for (const e of [-1, 1]) out.push(beamBetween([e * (L - 40), s * W, 104], [e * (L + 50), s * (W + 40), 40], 10, 9, "WoodWarm"), boxAt([14, 14, 50], [e * (L + 52), s * (W + 42), 0], "Plains_Timber", 2.5));
  }
  return merge(...out);
}

// An old shrine of the forest spirits on a mossy two-step platform: a little stone temple with
// a glowing spirit light on its altar, a ring of old pillars (two broken), the front pair joined
// by a lintel, stone lanterns lit green, glowing shards in the grass. About 9 x 9 m.
function forestShrine(): Geo {
  const S = "Plains_ShrineStone", out: Geo[] = [];
  out.push(wuv(merge(
    boxBounds([-440, -440, -10], [440, 440, 20], "MossStone", 4),
    boxBounds([-300, -330, 20], [400, 330, 44], "StoneGrey", 3),
    boxBounds([-480, -150, -10], [-440, 150, 8], "StoneGrey", 3),
    boxBounds([-330, -120, 20], [-300, 120, 32], "StoneGrey", 2),
  ), 1.2));
  // moss creeping over the corners
  for (const [x, y] of [[-430, -430], [430, -430], [430, 430], [-430, 430], [0, 435], [200, -436]]) out.push(translate(scale(sphereCenter(70, [0, 0, 0], "Plains_Moss", 8), [1, 1, 0.3]), [x, y, 14]));
  // the little temple, open to the front
  out.push(wuv(merge(
    boxBounds([60, -168, 44], [392, 168, 70], S, 3),
    boxBounds([350, -150, 70], [380, 150, 292], S),
    boxBounds([90, -150, 70], [380, -122, 292], S),
    boxBounds([90, 122, 70], [380, 150, 292], S),
    boxBounds([74, -166, 292], [394, 166, 318], "StoneLight", 2),
  ), 1));
  for (const y of [-104, 104])
    out.push(
      boxAt([46, 46, 14], [96, y, 70], "StoneLight", 2),
      cylinderAt({ rBot: 17, rTop: 14, height: 196, segments: 10, bottom: [96, y, 84] }, S),
      boxAt([44, 44, 14], [96, y, 278], "StoneLight", 2),
    );
  out.push(gableRoof([340, 336, 16], [234, 0, 318], 118, 26, "Plains_MossTile"));
  out.push(gableWall(76, 166, 318, 116, S), gableWall(392, 166, 318, 116, S));
  out.push(cylinderBetween([40, 0, 438], [428, 0, 438], 8, 6, "StoneLight"));
  out.push(translate(rotateY(torus(22, 4, 12, 4, "Plains_Spirit"), 90), [72, 0, 362]));
  // the altar and the spirit light on it, offerings at its foot
  out.push(
    boxBounds([238, -64, 70], [332, 64, 150], "StoneLight", 3),
    cylinderAt({ rBot: 26, rTop: 18, height: 26, segments: 10, bottom: [285, 0, 150] }, S),
    sphereCenter(24, [285, 0, 200], "Plains_Spirit", 12),
    shard(250, -45, 150, 30, "Plains_Spirit", 10), shard(255, 48, 150, 24, "Plains_Spirit", -12),
    cylinderAt({ rBot: 14, rTop: 20, height: 10, segments: 10, bottom: [200, -40, 70] }, "Bronze"),
    sphereCenter(8, [200, -40, 82], "Plains_Mushroom", 6), sphereCenter(7, [196, -30, 80], "Plains_Fungus", 6),
    cylinderAt({ rBot: 14, rTop: 20, height: 10, segments: 10, bottom: [200, 40, 70] }, "Bronze"),
  );
  // the ring of old pillars round it, the front pair joined by a lintel
  const C: [number, number] = [40, 0], R = 380;
  const at = (deg: number): [number, number] => [C[0] + R * Math.cos(deg * D), C[1] + R * Math.sin(deg * D)];
  for (const [deg, h] of [[60, 280], [118, 150], [150, 280], [210, 280], [242, 280], [300, 120]] as [number, number][]) {
    const [x, y] = at(deg);
    out.push(boxAt([66, 66, 24], [x, y, 18], "MossStone", 3), cylinderAt({ radius: 22, height: h, segments: 10, bottom: [x, y, 42] }, S));
    out.push(translate(cylinderAt({ radius: 22.5, height: h * 0.45, segments: 10, bottom: [x, y, 42] }, "Plains_Moss"), [-3, 3, 0]));
    if (h > 200) out.push(boxAt([62, 62, 20], [x, y, 42 + h], "MossStone", 3));
    else out.push(translate(rotateY(cylinderAt({ radius: 22, height: 22, segments: 10, bottom: [0, 0, 0] }, S), 20), [x, y, 36 + h]));
  }
  {
    const [x1, y1] = at(150), [x2, y2] = at(210);
    out.push(beamBetween([x1, y1, 352], [x2, y2, 352], 40, 34, "MossStone"));
    out.push(beamBetween([x1 + 4, y1 - 30, 385], [x2 + 4, y2 + 30, 385], 48, 18, "Plains_ShrineStone"));
    // a rope with paper charms under the lintel
    for (let i = 0; i <= 6; i++) {
      const t = i / 6, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t, z = 320 - Math.sin(t * Math.PI) * 26;
      if (i < 6) out.push(cylinderBetween([x, y, z], [x1 + (x2 - x1) * (t + 1 / 6), y1 + (y2 - y1) * (t + 1 / 6), 320 - Math.sin((t + 1 / 6) * Math.PI) * 26], 3, 5, "RopeTan"));
      if (i > 0 && i < 6) out.push(boxBounds([x - 1, y - 6, z - 34], [x + 1, y + 6, z - 2], "FabricWhite"));
    }
  }
  // a fallen drum from the broken pillar
  { const [x, y] = at(300); out.push(translate(rotateZ(cylinderBetween([0, -60, 22], [0, 60, 22], 22, 10, S), 30), [x - 60, y - 70, 18])); }
  // stone lanterns at the steps, lit green
  for (const s of [-1, 1]) {
    const x = -400, y = s * 250;
    out.push(
      boxAt([54, 54, 18], [x, y, 18], "MossStone", 3),
      cylinderAt({ rBot: 13, rTop: 10, height: 86, segments: 8, bottom: [x, y, 36] }, S),
      boxAt([44, 44, 10], [x, y, 122], S, 2),
      boxAt([28, 28, 30], [x, y, 132], "Plains_Spirit"),
      rotateZ(cylinderAt({ rBot: 42, rTop: 4, height: 34, segments: 4, bottom: [x, y, 162] }, "MossStone"), 45, [x, y, 0]),
      sphereCenter(7, [x, y, 200], S, 6),
    );
    for (const [dx, dy] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) out.push(boxAt([5, 5, 30], [x + dx, y + dy, 132], S));
  }
  // spirit shards in the grass round it
  for (const [x, y, h, t] of [[-470, -330, 40, 12], [-455, -300, 28, -20], [300, -470, 46, 8], [470, 260, 36, -10], [440, 290, 24, 25], [-200, 470, 30, 15]]) out.push(shard(x, y, -6, h, "Plains_Spirit", t));
  return merge(...out);
}

// A hunter's log lodge: a stone footing, notched log walls, a shingled roof with its gable to
// the front over a plank porch, antlers on the gable, a stone chimney, firewood under the
// eaves and a hide stretched to dry beside it.
function hunterLodge(): Geo {
  const out: Geo[] = [], X0 = -200, X1 = 330, Y = 300, rnd = seeded(71);
  out.push(wuv(boxBounds([X0 - 12, -Y - 12, -10], [X1 + 12, Y + 12, 45], "StoneGrey", 3), 1.1));
  for (let k = 0; k < 8; k++) {
    const z = 45 + 16 + k * 30, r = 16 + rnd() * 2;
    out.push(log([X0, -Y - 26, z], [X0, Y + 26, z], r, "Plains_Bark"));
    out.push(log([X1, -Y - 26, z], [X1, Y + 26, z], r, "Plains_Bark"));
    out.push(log([X0 - 26, -Y, z + 15], [X1 + 26, -Y, z + 15], r, "Plains_Bark"));
    out.push(log([X0 - 26, Y, z + 15], [X1 + 26, Y, z + 15], r, "Plains_Bark"));
  }
  // the roof: its gable to the front, reaching over the porch
  const RZ = 300, RH = 230;
  out.push(gableRoof([730, 600, 20], [-5, 0, RZ], RH, 46, "Plains_Shingle"));
  out.push(cylinderBetween([-420, 0, RZ + RH + 16], [420, 0, RZ + RH + 16], 10, 6, "WoodShade"));
  for (const x of [X0 - 4, X1 + 4]) {
    out.push(gableWall(x, Y + 10, RZ, RH - 8, "WoodShade"));
    for (let y = -Y + 30; y < Y; y += 34) out.push(boxBounds([x - (x < 0 ? 4 : -1), y - 3, RZ], [x + (x < 0 ? -1 : 4), y + 3, RZ + (RH - 8) * (1 - Math.abs(y) / (Y + 10))], "Plains_Timber"));
  }
  // barge boards along the front gable's edges
  for (const s of [-1, 1]) out.push(beamBetween([-372, 0, RZ + RH + 12], [-372, s * (Y + 46), RZ - 26], 8, 18, "Plains_Timber"));
  // the porch: plank deck on posts, a rail either side of the steps
  out.push(boxBounds([-345, -Y + 10, 28], [X0 - 16, Y - 10, 42], "Plains_Plank", 1.5));
  for (let x = -335; x < X0 - 20; x += 32) out.push(boxBounds([x, -Y + 12, 42], [x + 1.5, Y - 12, 43], "WoodDark"));
  for (const y of [-Y + 24, -110, 110, Y - 24]) out.push(boxAt([18, 18, RZ - 30], [-332, y, 0], "Plains_Timber", 2));
  out.push(boxBounds([-342, -Y + 10, RZ - 34], [-322, Y - 10, RZ - 10], "Plains_Timber", 2));
  for (const s of [-1, 1]) {
    out.push(beamBetween([-332, s * 110, 120], [-332, s * (Y - 24), 120], 10, 10, "WoodWarm"));
    out.push(beamBetween([-332, s * (Y - 24), 120], [X0 - 16, s * (Y - 24), 120], 10, 10, "WoodWarm"));
    for (let y = 140; y < Y - 30; y += 40) out.push(boxAt([6, 6, 76], [-332, s * y, 42], "WoodWarm"));
  }
  out.push(boxBounds([-385, -100, 0], [-345, 100, 16], "StoneGrey", 2), boxBounds([-365, -100, 16], [-345, 100, 30], "StoneGrey", 2));
  // the door and the windows on the logs
  out.push(translate(doorGeo(110, 200), [X0 - 18, 0, 45]));
  for (const y of [-190, 190]) out.push(translate(windowGeo(70, 76, { shutters: "WoodRed" }), [X0 - 18, y, 140]));
  for (const x of [-60, 180]) {
    out.push(translate(rotateZ(windowGeo(70, 76, { shutters: "WoodRed" }), 90), [x, -Y - 18, 140]));
    out.push(translate(rotateZ(windowGeo(70, 76, { shutters: "WoodRed" }), -90), [x, Y + 18, 140]));
  }
  // antlers on the gable, a lantern by the door, a bench on the porch
  {
    const z = RZ + 120, x = -380;
    out.push(boxBounds([x - 6, -26, z - 20], [x + 4, 26, z + 18], "WoodDark", 2), sphereCenter(13, [x - 8, 0, z], "Plains_Bone", 8));
    for (const s of [-1, 1]) {
      const p: V3 = [x - 10, s * 12, z + 8], q: V3 = [x - 22, s * 62, z + 70];
      out.push(cylinderBetween(p, q, 4.5, 6, "Plains_Bone", 3));
      out.push(cylinderBetween([x - 14, s * 30, z + 30], [x - 30, s * 22, z + 70], 3, 5, "Plains_Bone", 2));
      out.push(cylinderBetween([x - 19, s * 50, z + 52], [x - 34, s * 72, z + 90], 3, 5, "Plains_Bone", 2));
      out.push(cylinderBetween(q, [x - 20, s * 90, z + 96], 3, 5, "Plains_Bone", 1.5));
    }
  }
  out.push(translate(wallLantern(), [X0 - 18, -85, 230]));
  out.push(boxBounds([-300, 130, 42], [-260, 260, 88], "WoodWarm", 2), boxBounds([-302, 128, 88], [-258, 262, 94], "WoodShade", 2));
  // the chimney on the north side
  out.push(wuv(merge(boxBounds([40, Y + 20, -10], [150, Y + 96, 420], "StoneGrey", 3), boxBounds([52, Y + 30, 420], [138, Y + 86, 600], "StoneGrey", 3)), 1));
  out.push(boxBounds([46, Y + 24, 600], [144, Y + 92, 614], "StoneDark", 2));
  // firewood stacked under the south eave
  for (let k = 0; k < 4; k++)
    for (let i = 0; i < 9; i++) {
      const x = -150 + i * 46 + (k % 2) * 20, z = 8 + k * 22;
      out.push(log([x, -Y - 40, z], [x, -Y - 110, z + (rnd() - 0.5) * 3], 10 + rnd() * 2, "Plains_Bark", 6));
    }
  // a hide stretched to dry on a frame
  out.push(boxAt([12, 12, 210], [230, -Y - 140, 0], "Plains_Timber"), boxAt([12, 12, 210], [370, -Y - 140, 0], "Plains_Timber"));
  out.push(beamBetween([224, -Y - 140, 200], [376, -Y - 140, 200], 10, 10, "WoodShade"));
  out.push(boxBounds([246, -Y - 142, 60], [354, -Y - 138, 190], "Plains_Hide"));
  for (const [x, z] of [[246, 190], [354, 190], [246, 60], [354, 60]]) out.push(cylinderBetween([x, -Y - 140, z], [x < 300 ? 236 : 364, -Y - 140, z > 100 ? 200 : 40], 1.5, 4, "RopeTan"));
  return centred(merge(...out));
}

// ---- the royal road's farmland ----
function wheatField(): THREE.Object3D {
  const out: Geo[] = [boxAt([800, 600, 9], [0, 0, -3], "Plains_FieldSoil", 3)];
  const c = new Cards(), rnd = seeded(81);
  for (let y = -270; y <= 270; y += 45) {
    out.push(boxBounds([-392, y - 11, 5], [392, y + 11, 11], "Plains_Stubble", 2));
    for (let x = -370; x <= 370; x += 40) {
      const px = x + (rnd() - 0.5) * 16, py = y + (rnd() - 0.5) * 10, h = 86 + rnd() * 24, yaw = rnd() * 180;
      c.stand([px, py, 6], yaw, 54, h, { lean: (rnd() - 0.5) * 12, flip: rnd() < 0.5 });
      c.stand([px, py, 6], yaw + 90, 50, h * 0.95, { lean: (rnd() < 0.5 ? -1 : 1) * (22 + rnd() * 26), flip: rnd() < 0.5 });
    }
  }
  return withCards(merge(...out), c.mesh("plains_wheat", wheatCanvas));
}

// A split-rail fence, 4 m along Y: posts at both ends and the middle (pieces join end to end).
function railFence(): Geo {
  const out: Geo[] = [], rnd = seeded(83);
  for (const y of [-196, 0, 196]) {
    const h = 112 + rnd() * 12;
    out.push(rotateX(boxAt([14, 14, h + 14], [0, y, -14], "Plains_Timber", 3), (rnd() - 0.5) * 5, [0, y, 0]));
    out.push(rotateZ(cylinderAt({ rBot: 10, rTop: 2, height: 8, segments: 4, bottom: [0, y, h] }, "Plains_Timber"), 45, [0, y, 0]));
  }
  out.push(cylinderBetween([0, -205, 46], [0, 205, 42], 6.5, 6, "WoodWarm"));
  out.push(cylinderBetween([0, -205, 90], [0, 205, 94], 6.5, 6, "WoodWarm"));
  for (const y of [-196, 0, 196]) for (const z of [44, 92]) out.push(translate(rotateX(torus(9, 2, 8, 3, "RopeTan"), 90), [0, y, z]));
  return merge(...out);
}

function hayBales(): Geo {
  const round = (len: number, r: number): Geo => merge(
    cylinderBetween([-len / 2, 0, r - 2], [len / 2, 0, r - 2], r, 16, "Plains_Hay"),
    ...[-1, 1].flatMap((s) => [
      cylinderBetween([(s * len) / 2, 0, r - 2], [(s * len) / 2 + s * 1.5, 0, r - 2], r * 0.94, 16, "Plains_HayDark"),
      translate(rotateY(torus(r * 0.62, 3.5, 16, 4, "Plains_Hay"), 90), [(s * len) / 2 + s * 1, 0, r - 2]),
      translate(rotateY(torus(r * 0.3, 3, 12, 4, "Plains_Hay"), 90), [(s * len) / 2 + s * 1, 0, r - 2]),
    ]),
    ...[-0.25, 0.25].map((t) => translate(rotateY(torus(r + 0.5, 1.6, 16, 3, "RopeTan"), 90), [t * len, 0, r - 2])),
  );
  const square = (x: number, y: number, z: number, rz: number): Geo => translate(rotateZ(merge(
    boxAt([118, 58, 50], [0, 0, 0], "Plains_Hay", 5),
    boxBounds([-30, -30, -1], [-27, 30, 51], "RopeTan"), boxBounds([27, -30, -1], [30, 30, 51], "RopeTan"),
  ), rz), [x, y, z]);
  return centred(merge(
    translate(rotateZ(round(130, 76), 20), [-60, -110, 0]),
    translate(rotateZ(round(120, 70), -35), [110, 40, 0]),
    square(-90, 110, 0, 5), square(-80, 172, 0, -4), square(-86, 140, 50, 92),
    translate(scale(sphereCenter(70, [0, 0, 0], "Plains_Hay", 10), [1.2, 1, 0.42]), [60, 200, 0]),
    // a pitchfork in the loose hay
    cylinderBetween([40, 190, 10], [10, 240, 170], 3, 6, "WoodWarm"),
    beamBetween([44, 184, 14], [52, 172, 22], 26, 3, "IronDark"),
  ));
}

function scarecrow(): Geo {
  const out: Geo[] = [
    boxAt([9, 9, 230], [0, 0, -10], "Plains_Timber", 2),
    beamBetween([0, -76, 150], [0, 76, 150], 8, 8, "Plains_Timber"),
    // a patched shirt stuffed with straw, a rope belt
    boxAt([36, 56, 66], [0, 0, 104], "FabricRed", 6),
    boxBounds([-19, -12, 140], [-17.5, 4, 156], "FabricBlue"),
    boxAt([38, 58, 6], [0, 0, 110], "RopeTan", 2),
    beamBetween([0, -28, 150], [0, -70, 146], 22, 22, "FabricRed"),
    beamBetween([0, 28, 150], [0, 70, 146], 22, 22, "FabricRed"),
    // a sack head with a stitched face and a straw hat
    sphereCenter(23, [0, 0, 196], "FeltCream", 10),
    boxBounds([-24, -9, 199], [-20, -4, 205], "Plains_Dark"), boxBounds([-24, 4, 199], [-20, 9, 205], "Plains_Dark"),
    boxBounds([-23, -8, 186], [-19, 8, 188], "Plains_Dark"),
    cylinderAt({ radius: 40, height: 4, segments: 14, bottom: [0, 0, 210] }, "Plains_Straw"),
    cylinderAt({ rBot: 22, rTop: 16, height: 24, segments: 12, bottom: [0, 0, 213] }, "Plains_Straw"),
    cylinderAt({ radius: 22.5, height: 5, segments: 12, bottom: [0, 0, 215] }, "FabricRed"),
  ];
  // straw sticking out of the cuffs, the hem and the neck
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) out.push(cylinderBetween([0, s * 70, 146], [(i - 1.5) * 6, s * 88, 140 - i * 4], 2, 4, "Plains_Straw", 0.5));
  for (let i = 0; i < 8; i++) out.push(cylinderBetween([0, -24 + i * 7, 106], [(i % 2) * 6 - 3, -26 + i * 7.5, 88], 2.5, 4, "Plains_Straw", 0.5));
  // a crow on its arm
  const crow = merge(
    scale(sphereCenter(9, [0, 0, 0], "Plains_Dark", 8), [1, 1.5, 1]),
    sphereCenter(6, [0, -12, 7], "Plains_Dark", 6),
    translate(rotateX(cylinderAt({ rBot: 2.5, rTop: 0.3, height: 8, segments: 4, bottom: [0, 0, 0] }, "GoldTrim"), 90), [0, -17, 7]),
    beamBetween([0, 10, 2], [0, 22, 8], 10, 2, "Plains_Dark"),
  );
  out.push(translate(crow, [0, 56, 165]));
  return merge(...out);
}

// A water mill: a stone ground floor, a half-timbered upper floor under a thatched roof, the
// big overshot wheel on its +Y side (its bottom 30 cm under the water) fed by a wooden flume,
// a hoist over the front door, flour sacks and a spare millstone.
function waterMill(): Geo {
  const out: Geo[] = [];
  const X = 330, Y0 = -380, Y1 = 160, G = 280, E = 520;
  out.push(wuv(merge(
    boxBounds([-X - 15, Y0 - 15, -10], [X + 15, Y1 + 15, 40], "StoneGrey", 3),
    boxBounds([-X, Y0, 40], [X, Y1, G], "Plains_ShrineStone"),
  ), 1.2));
  for (const [x, y] of [[-X, Y0], [X, Y0], [-X, Y1], [X, Y1]])
    for (let z = 40; z < G - 20; z += 60) out.push(boxBounds([x - 8 - (z % 120 ? 10 : 0) * Math.sign(x) * 0, y - 8, z], [x + 8, y + 8, z + 34], "StoneLight", 2));
  // the half-timbered floor above
  out.push(boxBounds([-X + 10, Y0 + 10, G], [X - 10, Y1 - 10, E], "Plains_Plaster"));
  const T = "Plains_Timber";
  out.push(boxBounds([-X + 4, Y0 + 4, G], [X - 4, Y1 - 4, G + 18], T, 2), boxBounds([-X + 4, Y0 + 4, E - 16], [X - 4, Y1 - 4, E], T, 2));
  const frame = (a: [number, number], b: [number, number], outx: number, outy: number) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 120);
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = a[0] + (b[0] - a[0]) * t + outx * 3, y = a[1] + (b[1] - a[1]) * t + outy * 3;
      out.push(box([outx ? 6 : 14, outy ? 6 : 14, E - G - 30], [x, y, (G + E) / 2], T));
    }
    for (const t of [0.5 / n, 1 - 0.5 / n]) {
      const x = a[0] + (b[0] - a[0]) * t + outx * 4, y = a[1] + (b[1] - a[1]) * t + outy * 4, dx = ((b[0] - a[0]) / n) * 0.45, dy = ((b[1] - a[1]) / n) * 0.45;
      out.push(beamBetween([x - dx, y - dy, G + 20], [x + dx, y + dy, E - 18], 10, 6, T));
    }
  };
  frame([-X + 10, Y0 + 10], [-X + 10, Y1 - 10], -1, 0);
  frame([X - 10, Y0 + 10], [X - 10, Y1 - 10], 1, 0);
  frame([-X + 10, Y0 + 10], [X - 10, Y0 + 10], 0, -1);
  frame([-X + 10, Y1 - 10], [X - 10, Y1 - 10], 0, 1);
  // the thatched roof (ridge along X), its gables plastered and framed
  const RH = 270, YC = (Y0 + Y1) / 2, HY = (Y1 - Y0) / 2;
  out.push(translate(gableRoof([2 * X + 10, Y1 - Y0, 34], [0, 0, E], RH, 50, "Thatch"), [0, YC, 0]));
  out.push(translate(gableRoof([2 * X + 30, 60, 10], [0, 0, E + RH - 12], 26, 4, "Plains_HayDark"), [0, YC, 0]));
  for (const x of [-X + 10, X - 10]) {
    out.push(translate(gableWall(x, HY - 10, E, RH - 6, "Plains_Plaster"), [0, YC, 0]));
    for (const dy of [-120, 0, 120]) out.push(boxBounds([x - 4, YC + dy - 7, E], [x + 4, YC + dy + 7, E + (RH - 10) * (1 - Math.abs(dy) / HY)], T));
  }
  // the chimney at the back
  out.push(wuv(boxBounds([X - 120, Y0 + 40, E], [X - 40, Y0 + 120, E + RH + 60], "StoneGrey", 3)), boxBounds([X - 126, Y0 + 34, E + RH + 60], [X - 34, Y0 + 126, E + RH + 72], "StoneDark", 2));
  // the front: a wide door, windows, the hoist and its sack
  out.push(translate(doorGeo(170, 230, { double: true }), [-X, -110, 40]));
  out.push(boxBounds([-X - 70, -230, -10], [-X, 10, 24], "StoneGrey", 2), boxBounds([-X - 40, -220, 24], [-X, 0, 40], "StoneGrey", 2));
  for (const y of [-300, 80]) out.push(translate(windowGeo(60, 70, { shutters: "WoodRed" }), [-X, y, 120]));
  for (const y of [-280, -110, 60]) out.push(translate(windowGeo(70, 90, { shutters: "WoodRed" }), [-X + 6, y, 340]));
  for (const x of [-200, 0, 200]) out.push(translate(rotateZ(windowGeo(70, 90, { shutters: "WoodRed" }), 90), [x, Y0 + 6, 340]));
  for (const x of [-200, 180]) out.push(translate(rotateZ(windowGeo(60, 70), 90), [x, Y0, 120]));
  out.push(beamBetween([-X + 40, YC, E + 150], [-X - 90, YC, E + 150], 18, 18, T));
  out.push(translate(rotateX(torus(14, 4, 12, 4, "IronDark"), 90), [-X - 70, YC, E + 128]));
  out.push(cylinderBetween([-X - 84, YC, E + 128], [-X - 84, YC, 330], 1.8, 4, "RopeTan"));
  out.push(translate(scale(sphereCenter(26, [0, 0, 0], "Plains_Flour", 8), [0.8, 0.8, 1.2]), [-X - 84, YC, 300]));
  // flour sacks and a spare millstone by the door
  for (const [x, y, z] of [[-X - 50, -270, 0], [-X - 60, -320, 0], [-X - 46, -296, 40]]) out.push(translate(scale(sphereCenter(30, [0, 0, 0], "Plains_Flour", 8), [0.8, 1, 0.75]), [x, y, z + 22]), cylinderAt({ rBot: 8, rTop: 4, height: 12, segments: 6, bottom: [x, y, z + 42] }, "RopeTan"));
  out.push(translate(rotateY(merge(cylinderAt({ radius: 64, height: 22, segments: 16, bottom: [0, 0, 0] }, "StoneGrey"), cylinderAt({ radius: 14, height: 23, segments: 8, bottom: [0, 0, 0] }, "Plains_Dark")), 72), [-X - 14, 200 - 330, 64]));
  // the wheel on the +Y side, its axle through the wall
  const WY = 250, WZ = 190, WR = 220;
  for (const y of [WY - 40, WY + 40]) {
    out.push(translate(rotateX(torus(WR, 7, 28, 5, "WoodShade"), 90), [0, y, WZ]));
    out.push(translate(rotateX(torus(WR - 60, 5, 24, 4, "WoodShade"), 90), [0, y, WZ]));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      out.push(beamBetween([0, y, WZ], [Math.cos(a) * (WR - 4), y, WZ + Math.sin(a) * (WR - 4)], 9, 9, "WoodWarm"));
    }
  }
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    out.push(beamBetween([Math.cos(a) * (WR - 62), WY, WZ + Math.sin(a) * (WR - 62)], [Math.cos(a) * (WR + 8), WY, WZ + Math.sin(a) * (WR + 8)], 88, 5, "Plains_Plank"));
  }
  out.push(cylinderBetween([0, WY - 52, WZ], [0, WY + 52, WZ], 28, 10, "WoodDark"), cylinderBetween([0, Y1 - 10, WZ], [0, WY + 62, WZ], 10, 8, "IronDark"));
  out.push(boxBounds([-40, Y1, WZ - 40], [40, Y1 + 30, WZ + 40], "StoneLight", 2));
  // the flume bringing water over the wheel's top
  const FZ = 452;
  out.push(beamBetween([X + 20, WY, FZ + 16], [-10, WY, FZ], 84, 8, "WoodShade"));
  for (const s of [-1, 1]) out.push(beamBetween([X + 20, WY + s * 40, FZ + 34], [-10, WY + s * 40, FZ + 18], 6, 34, "WoodShade"));
  out.push(beamBetween([X + 20, WY, FZ + 24], [-6, WY, FZ + 8], 72, 4, "Plains_Water"));
  for (const x of [X - 30, 140]) {
    for (const s of [-1, 1]) out.push(boxBounds([x - 8, WY + s * 46 - 8, -40], [x + 8, WY + s * 46 + 8, FZ + 10 + (x - 140) * 0.05], T));
    out.push(boxBounds([x - 9, WY - 56, FZ - 10], [x + 9, WY + 56, FZ + 6], T));
  }
  // the water falling off the flume onto the paddles, and the splash below
  out.push(beamBetween([-14, WY, FZ + 4], [-70, WY, WZ + 150], 64, 6, "Plains_Water"));
  out.push(beamBetween([-70, WY, WZ + 150], [-150, WY, WZ + 30], 60, 6, "Plains_Water"));
  for (const [x, y, r] of [[-200, WY - 30, 50], [-150, WY + 50, 40], [-240, WY + 30, 34], [120, WY, 46]]) out.push(translate(scale(sphereCenter(r, [0, 0, 0], "Plains_Foam", 8), [1.2, 1, 0.22]), [x, y, -10]));
  return centred(merge(...out));
}

// ---- soldiers on the road ----
// The checkpoint across the royal road: two square stone towers with blue roofs either side of
// a 5.6 m passage along X, a timbered gallery over it hung with royal banners, a striped
// barrier raised by the -Y tower, lanterns, a rack of spears and a bench behind.
function checkpointGate(): Geo {
  const out: Geo[] = [], HW = 280, TY = 430, TH = 640;
  for (const s of [-1, 1]) {
    const cy = s * TY;
    out.push(wuv(merge(
      boxBounds([-162, cy - 162, -10], [162, cy + 162, 60], "StoneGrey", 3),
      boxBounds([-150, cy - 150, 60], [150, cy + 150, TH], "StoneLight"),
      boxBounds([-158, cy - 158, 360], [158, cy + 158, 376], "StoneWhite", 2),
      boxBounds([-166, cy - 166, TH - 20], [166, cy + 166, TH + 36], "StoneWhite", 2),
    ), 1.3));
    for (let i = 0; i < 8; i++) for (const sx of [-1, 1]) out.push(boxBounds([sx * 150 - (sx > 0 ? 0 : 14), cy - 140 + i * 40, TH - 52], [sx * 150 + (sx > 0 ? 14 : 0), cy - 128 + i * 40, TH - 20], "StoneLight", 1.5));
    for (const [a, b] of [[[-160, cy - 160], [160, cy - 160]], [[160, cy - 160], [160, cy + 160]], [[160, cy + 160], [-160, cy + 160]], [[-160, cy + 160], [-160, cy - 160]]] as [[number, number], [number, number]][]) out.push(merlons(a, b, TH + 36, 22, "StoneWhite", 80, 60));
    out.push(rotateZ(cylinderAt({ rBot: 190, rTop: 4, height: 260, segments: 4, bottom: [0, cy, TH + 30] }, "RoofBlue"), 45, [0, cy, 0]));
    out.push(cylinderBetween([0, cy, TH + 280], [0, cy, TH + 360], 3, 6, "IronDark"), sphereCenter(11, [0, cy, TH + 290], "GoldTrim", 8));
    // slits front and back, a door onto the passage, a lantern either side of the passage
    for (const x of [-150, 150]) for (const z of [180, 440]) out.push(translate(rotateZ(merge(boxBounds([-8, -16, -8], [6, 16, 108], "StoneWhite"), boxBounds([-10, -5, 0], [4, 5, 100], "Plains_Dark")), x < 0 ? 0 : 180), [x, cy, z]));
    out.push(translate(rotateZ(doorGeo(100, 200, { arch: true, frame: "StoneWhite" }), s < 0 ? -90 : 90), [40, cy - s * 150, 60]));
    out.push(translate(wallLantern(), [-150, cy - s * 110, 330]));
    out.push(translate(rotateZ(wallLantern(), 180), [150, cy - s * 110, 330]));
  }
  // the gallery over the passage
  const GZ = 470;
  out.push(boxBounds([-130, -HW, GZ], [130, HW, GZ + 30], "WoodShade", 2));
  out.push(boxBounds([-118, -HW, GZ + 30], [118, HW, GZ + 170], "Plains_Plaster"));
  for (const x of [-120, 120]) {
    for (let y = -HW + 10; y <= HW - 10; y += 93) out.push(box([6, 12, 140], [x + Math.sign(x) * 2, y, GZ + 100], "Plains_Timber"));
    out.push(boxBounds([x - 4, -HW, GZ + 160], [x + 4, HW, GZ + 172], "Plains_Timber"));
    for (const y of [-140, 140]) out.push(translate(rotateZ(windowGeo(48, 56), x < 0 ? 0 : 180), [x, y, GZ + 60]));
    out.push(translate(rotateZ(banner(130, 200), x < 0 ? 0 : 180), [x + Math.sign(x) * 4, 0, GZ + 16]));
  }
  out.push(rotateZ(gableRoof([2 * HW + 40, 250, 16], [0, 0, GZ + 170], 110, 22, "RoofBlue"), 90));
  for (const s of [-1, 1]) {
    out.push(beamBetween([-110, s * HW, 360], [-110, s * (HW - 110), GZ], 14, 14, "Plains_Timber"));
    out.push(beamBetween([110, s * HW, 360], [110, s * (HW - 110), GZ], 14, 14, "Plains_Timber"));
  }
  // the barrier, raised, its counterweight down by the -Y tower
  const PX = -232, PY = -HW - 10;
  out.push(boxAt([26, 26, 120], [PX, PY, 0], "Plains_Timber", 2), boxAt([34, 34, 10], [PX, PY, 120], "IronDark", 2));
  const ang = 76 * D, len = 560;
  for (let i = 0; i < 7; i++) {
    const t0 = i / 7, t1 = (i + 1) / 7;
    out.push(beamBetween([PX, PY + 20 + Math.cos(ang) * len * t0, 120 + Math.sin(ang) * len * t0], [PX, PY + 20 + Math.cos(ang) * len * t1, 120 + Math.sin(ang) * len * t1], 14, 14, i % 2 ? "Plains_PaintWhite" : "WoodRed"));
  }
  out.push(boxBounds([PX - 20, PY - 80, 70], [PX + 20, PY - 20, 120], "StoneGrey", 2));
  out.push(boxAt([18, 18, 100], [PX, HW + 10, 0], "Plains_Timber", 2), boxAt([30, 10, 20], [PX, HW + 10, 100], "IronDark"));
  // a rack of spears and shields by the +Y tower, barrels by the -Y tower, a bench behind
  {
    const x = -232, y0 = HW + 70;
    out.push(boxAt([12, 12, 170], [x, y0, 0], "Plains_Timber"), boxAt([12, 12, 170], [x, y0 + 150, 0], "Plains_Timber"));
    out.push(beamBetween([x, y0 - 6, 150], [x, y0 + 156, 150], 10, 10, "WoodShade"), beamBetween([x, y0 - 6, 40], [x, y0 + 156, 40], 10, 10, "WoodShade"));
    for (let i = 0; i < 4; i++) {
      const y = y0 + 25 + i * 34;
      out.push(cylinderBetween([x + 6, y, 0], [x - 8, y, 230], 2.5, 5, "WoodWarm"), cylinderAt({ rBot: 5, rTop: 0.5, height: 26, segments: 4, bottom: [x - 8, y, 228] }, "IronLight"));
    }
    for (const y of [y0 + 40, y0 + 112]) out.push(translate(rotateY(merge(cylinderAt({ radius: 34, height: 5, segments: 14, bottom: [0, 0, 0] }, "Plains_RoyalBlue"), torus(34, 3, 14, 4, "GoldTrim"), sphereCenter(8, [0, 0, 5], "GoldTrim", 6)), -90), [x - 12, y, 80]));
  }
  for (const [y, z] of [[-HW - 100, 0], [-HW - 160, 0], [-HW - 130, 80]])
    out.push(cylinderAt({ rBot: 30, rTop: 32, height: 80, segments: 12, bottom: [-210, y, z] }, "WoodWarm"), translate(torus(32, 2.5, 12, 3, "IronDark"), [-210, y, z + 18]), translate(torus(32, 2.5, 12, 3, "IronDark"), [-210, y, z + 62]));
  out.push(boxBounds([190, -560, 0], [236, -320, 44], "WoodWarm", 2), boxBounds([186, -564, 44], [240, -316, 50], "WoodShade", 2));
  return merge(...out);
}

// A timber watchtower: four leaning log legs braced crosswise, a platform at 6.4 m with a plank
// parapet, a shingled pyramid roof on corner posts, a ladder up the front and a flag on top.
function watchtower(): Geo {
  const out: Geo[] = [], B = 140, T = 104, PZ = 640;
  const leg = (sx: number, sy: number): [V3, V3] => [[sx * B, sy * B, -10], [sx * T, sy * T, PZ]];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const [a, b] = leg(sx, sy);
    out.push(cylinderBetween(a, b, 14, 8, "Plains_Bark", 12), boxAt([46, 46, 16], [a[0], a[1], -6], "StoneGrey", 3));
  }
  const at = (sx: number, sy: number, z: number): V3 => {
    const t = (z + 10) / (PZ + 10), r = B + (T - B) * t;
    return [sx * r, sy * r, z];
  };
  for (const [z0, z1] of [[40, 330], [330, 620]])
    for (const [s1, s2] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]] as [[number, number], [number, number]][]) {
      out.push(cylinderBetween(at(s1[0], s1[1], z0), at(s2[0], s2[1], z1), 6, 6, "WoodWarm"));
      out.push(cylinderBetween(at(s2[0], s2[1], z0), at(s1[0], s1[1], z1), 6, 6, "WoodWarm"));
      out.push(cylinderBetween(at(s1[0], s1[1], z1), at(s2[0], s2[1], z1), 8, 6, "WoodShade"));
    }
  // the platform and its parapet
  out.push(boxAt([300, 300, 14], [0, 0, PZ], "Plains_Plank", 2), boxAt([316, 316, 10], [0, 0, PZ - 10], "WoodShade", 2));
  for (const s of [-1, 1]) {
    out.push(boxBounds([-150, s * 150 - 5, PZ + 14], [150, s * 150 + 5, PZ + 110], "Plains_Plank"));
    out.push(boxBounds([s * 150 - 5, -150, PZ + 14], [s * 150 + 5, 150, PZ + 110], "Plains_Plank"));
    out.push(boxBounds([-158, s * 150 - 8, PZ + 104], [158, s * 150 + 8, PZ + 116], "WoodShade", 2));
    out.push(boxBounds([s * 150 - 8, -158, PZ + 104], [s * 150 + 8, 158, PZ + 116], "WoodShade", 2));
  }
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) out.push(boxAt([14, 14, 240], [sx * 142, sy * 142, PZ + 14], "Plains_Timber", 2));
  out.push(rotateZ(cylinderAt({ rBot: 250, rTop: 6, height: 170, segments: 4, bottom: [0, 0, PZ + 250] }, "Plains_Shingle"), 45));
  out.push(cylinderBetween([0, 0, PZ + 400], [0, 0, PZ + 540], 3, 6, "WoodShade"));
  const flag = new THREE.Shape();
  flag.moveTo(0, 0);
  flag.lineTo(110, 0);
  flag.lineTo(90, -30);
  flag.lineTo(110, -60);
  flag.lineTo(0, -60);
  flag.lineTo(0, 0);
  out.push(translate(panel(flag, -1, 2, "Plains_RoyalBlue"), [0, 0, PZ + 535]));
  // the ladder up the front (-X) through a hatch
  for (const s of [-1, 1]) out.push(beamBetween([-B - 70, s * 32, 0], [-T - 6, s * 32, PZ + 10], 8, 8, "WoodWarm"));
  for (let i = 1; i < 18; i++) {
    const t = i / 18;
    out.push(cylinderBetween([-B - 70 + (B + 70 - T - 6) * t, -32, PZ * t + 5 * t], [-B - 70 + (B + 70 - T - 6) * t, 32, PZ * t + 5 * t], 3, 5, "WoodShade"));
  }
  return centred(merge(...out));
}

function milestone(): Geo {
  return merge(
    boxAt([86, 74, 14], [0, 0, -4], "StoneGrey", 3),
    boxAt([40, 56, 86], [0, 0, 10], "StoneLight", 3),
    cylinderBetween([-20, 0, 96], [20, 0, 96], 28, 12, "StoneLight"),
    panel(rectShape(20, 66, 26), -21.5, 2, "StoneWhite"),
    translate(panel(crownShape(13), -23, 1.5, "GoldTrim"), [0, 0, 98]),
    boxBounds([-23, -14, 50], [-22, 14, 54], "Plains_Dark"), boxBounds([-23, -10, 40], [-22, 10, 44], "Plains_Dark"),
    translate(stone([40, 34, 20], 91, { moss: 1 }), [10, 36, -2]),
  );
}

// A signpost at a way out: a post on a stone footing, three arrow boards (to -X, -Y and +Y),
// a little roof and a lantern.
function signpost(): Geo {
  const out: Geo[] = [
    translate(stone([90, 80, 34], 93, { moss: 0.6 }), [0, 0, -6]),
    boxAt([16, 16, 300], [0, 0, 0], "Plains_Timber", 3),
    rotateZ(gableRoof([46, 40, 6], [0, 0, 300], 22, 6, "Plains_Shingle"), 0),
    gableWall(-20, 20, 300, 20, "WoodShade"), gableWall(20, 20, 300, 20, "WoodShade"),
  ];
  const arrow = (len: number, h: number): Geo => {
    const s = new THREE.Shape();
    s.moveTo(0, -h / 2);
    s.lineTo(len - h * 0.6, -h / 2);
    s.lineTo(len, 0);
    s.lineTo(len - h * 0.6, h / 2);
    s.lineTo(0, h / 2);
    s.lineTo(0, -h / 2);
    // shape x along world y, so this points +Y; drawn 4 cm thick, centred on x = 0
    return merge(panel(s, -2.5, 5, "Plains_Plank"), translate(panel(s, -3.5, 1, "WoodShade"), [0, 0, 0]));
  };
  out.push(translate(arrow(110, 30), [0, 6, 250]));
  out.push(translate(rotateZ(arrow(100, 28), 180), [0, -6, 212]));
  out.push(translate(rotateZ(arrow(96, 28), 90), [-6, 0, 172]));
  for (const [y, z] of [[60, 250], [-55, 212]]) out.push(boxBounds([-4, y - 30, z - 5], [4, y + 30, z - 2], "Plains_PaintWhite"), boxBounds([-4, y - 30, z + 2], [4, y + 30, z + 5], "Plains_PaintWhite"));
  out.push(translate(rotateZ(wallLantern(), 0), [-8, 0, 140]));
  return merge(...out);
}

// ---- the royal castle at the road's end ----
// Its gatehouse, shut: a white stone gate block with the doors closed behind the lowered
// portcullis, the arms of the king above, banners from the parapet, two great round towers with
// blue cones. About 20 m along Y, the front to -X.
function castleGatehouse(): Geo {
  const out: Geo[] = [], HX = 350, HY = 480, TOP = 1250, AW = 240, SP = 420;
  // the solid block behind the gate's recess, the piers and the wall over the arch
  const mason: Geo[] = [
    boxBounds([-HX + 70, -HY, 0], [HX, HY, TOP], "StoneWhite"),
    boxBounds([-HX, -HY, 0], [-HX + 70, -AW, TOP], "StoneWhite"),
    boxBounds([-HX, AW, 0], [-HX + 70, HY, TOP], "StoneWhite"),
    boxBounds([-HX, -AW, SP + AW], [-HX + 70, AW, TOP], "StoneWhite"),
  ];
  for (let y0 = -AW; y0 < AW; y0 += 20) {
    const m = Math.max(Math.abs(y0), Math.abs(y0 + 20));
    mason.push(boxBounds([-HX, y0, SP + Math.sqrt(Math.max(0, (AW + 24) ** 2 - m * m))], [-HX + 70, y0 + 20, SP + AW + 2], "StoneWhite"));
  }
  out.push(wuv(merge(...mason), 1.4));
  out.push(
    boxBounds([-HX - 20, -HY - 20, -10], [HX + 20, HY + 20, 110], "StoneGrey", 3),
    arcStones([-HX + 34, 0, SP], AW, 13, 52, 76, "StoneLight"),
    boxBounds([-HX - 10, -HY - 4, 760], [-HX + 6, HY + 4, 780], "StoneLight", 2),
  );
  // the doors, shut, studded and banded
  out.push(panel(archShape(AW, SP), -HX + 66, 4, "DoorWood"));
  for (let y = -AW + 20; y < AW; y += 24) out.push(boxBounds([-HX + 64, y - 1, 0], [-HX + 66, y + 1, SP + Math.sqrt(Math.max(0, AW * AW - y * y)) - 6], "WoodDark"));
  for (const z of [60, 200, 340, 480]) {
    const half = z <= SP ? AW - 4 : Math.sqrt(AW * AW - (z - SP) ** 2) - 4;
    out.push(boxBounds([-HX + 60, -half, z], [-HX + 64, half, z + 16], "IronDark"));
    for (let y = -half + 16; y < half; y += 36) out.push(sphereCenter(4, [-HX + 59, y, z + 8], "IronLight", 5));
  }
  out.push(boxBounds([-HX + 60, -2, 0], [-HX + 64, 2, SP + AW - 6], "IronDark"));
  for (const s of [-1, 1]) out.push(translate(rotateY(torus(14, 3, 12, 4, "GoldTrim"), 90), [-HX + 56, s * 30, 230]));
  // the portcullis, down
  const XP = -HX + 26;
  for (let y = -AW + 22; y < AW; y += 44) {
    const top = SP + Math.sqrt(Math.max(0, AW * AW - y * y));
    out.push(boxBounds([XP - 5, y - 5, 0], [XP + 5, y + 5, top + 30], "IronDark"));
    out.push(cylinderAt({ rBot: 1, rTop: 7, height: 26, segments: 4, bottom: [XP, y, -18] }, "IronDark"));
  }
  for (let z = 60; z < SP + AW - 10; z += 62) {
    const half = z <= SP ? AW : Math.sqrt(AW * AW - (z - SP) ** 2);
    out.push(boxBounds([XP - 4, -half, z], [XP + 4, half, z + 8], "IronDark"));
  }
  // the king's arms over the arch, windows above, banners from the parapet
  const arms = merge(
    panel(shieldShape(90), -6, 6, "GoldTrim"),
    panel(shieldShape(80), -8, 2, "Plains_RoyalBlue"),
    panel(crownShape(46), -9, 1, "GoldTrim", 2),
    translate(panel(crownShape(58), -8, 8, "GoldTrim"), [0, 0, 126]),
  );
  out.push(translate(arms, [-HX, 0, 860]));
  for (const y of [-330, 330]) out.push(translate(windowGeo(60, 120, { arch: true, frame: "StoneLight", glass: "GlassBlue" }), [-HX, y, 840]));
  for (const y of [-330, 330]) out.push(translate(banner(150, 420), [-HX - 4, y, TOP - 30]));
  // machicolations, the parapet and merlons along front and back
  for (const x of [-HX, HX]) {
    const sx = Math.sign(x);
    out.push(boxBounds([x - (sx < 0 ? 40 : 0), -HY, TOP - 60], [x + (sx > 0 ? 40 : 0), HY, TOP + 70], "StoneWhite", 2));
    for (let y = -HY + 30; y < HY; y += 60) out.push(boxBounds([x - (sx < 0 ? 40 : 0), y - 14, TOP - 120], [x + (sx > 0 ? 40 : 0), y + 14, TOP - 60], "StoneLight", 1.5));
    out.push(merlons([x + sx * 20, -HY], [x + sx * 20, HY], TOP + 70, 40, "StoneWhite", 100, 80));
  }
  out.push(boxBounds([-HX + 20, -HY, TOP], [HX - 20, HY, TOP + 6], "Cobble"));
  // lanterns either side of the gate
  for (const s of [-1, 1]) out.push(translate(wallLantern(), [-HX, s * 320, 420]));
  // the two great towers
  for (const s of [-1, 1]) out.push(translate(roundTower(290, 1500, 880, { slits: [180, s * 90, 0], windows: [180, s * 90, 0, s * 135] }), [-60, s * 760, 0]));
  return merge(...out);
}

// The keep of the royal castle, seen over its wall: a great square block with corbelled
// battlements and rows of arched windows, round turrets at its corners and a tall central
// tower, all under blue cones with gold finials; a lower hall in front. About 21 x 16 m, 43 m
// to the top of the spire.
function castleKeep(): Geo {
  const out: Geo[] = [], H = 1800, HX = 700, HY = 700;
  out.push(wuv(merge(
    boxBounds([-HX - 30, -HY - 30, -10], [HX + 30, HY + 30, 140], "StoneGrey", 3),
    boxBounds([-HX, -HY, 140], [HX, HY, H], "StoneWhite"),
    boxBounds([-HX - 30, -HY - 30, H], [HX + 30, HY + 30, H + 110], "StoneWhite", 2),
  ), 1.6));
  for (const z of [640, 1230]) out.push(boxBounds([-HX - 8, -HY - 8, z], [HX + 8, HY + 8, z + 18], "StoneLight", 2));
  for (const [a, b] of [[[-HX - 15, -HY - 15], [HX + 15, -HY - 15]], [[HX + 15, -HY - 15], [HX + 15, HY + 15]], [[HX + 15, HY + 15], [-HX - 15, HY + 15]], [[-HX - 15, HY + 15], [-HX - 15, -HY - 15]]] as [[number, number], [number, number]][]) out.push(merlons(a, b, H + 110, 30, "StoneWhite", 110, 80));
  // windows on every face
  for (const face of [0, 90, 180, 270])
    for (const z of [760, 1340])
      for (const u of [-420, -140, 140, 420]) out.push(rotateZ(translate(windowGeo(70, 150, { arch: true, frame: "StoneLight" }), [-HX, u, z]), face));
  // corner turrets and the great tower
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) out.push(translate(roundTower(200, 2200, 820, { windows: [sx < 0 ? 180 : 0, sy < 0 ? -90 : 90] }), [sx * HX, sy * HY, 0]));
  out.push(translate(roundTower(400, 3000, 1200, { windows: [180, 90, 0, 270, 135, 225, 45, 315] }), [80, 0, 0]));
  // the hall in front, its gable to the front with a great window, a door
  const FX0 = -HX - 420, FX1 = -HX + 10, FY = 420, FH = 1000;
  out.push(wuv(merge(boxBounds([FX0 - 20, -FY - 20, -10], [FX1, FY + 20, 120], "StoneGrey", 3), boxBounds([FX0, -FY, 120], [FX1, FY, FH], "StoneWhite")), 1.6));
  out.push(gableRoof([FX1 - FX0 + 60, 2 * FY, 26], [(FX0 + FX1) / 2, 0, FH], 520, 40, "RoofBlue"));
  out.push(gableWall(FX0, FY, FH, 516, "StoneWhite"));
  out.push(translate(windowGeo(200, 360, { arch: true, frame: "GoldTrim" }), [FX0, 0, 520]));
  out.push(translate(doorGeo(200, 330, { arch: true, frame: "StoneLight", double: true }), [FX0, 0, 120]));
  for (const y of [-280, 280]) out.push(translate(windowGeo(80, 200, { arch: true, frame: "StoneLight" }), [FX0, y, 500]), translate(banner(140, 360), [FX0 - 4, y, 450]));
  for (const s of [-1, 1]) for (const x of [FX0 + 100, FX0 + 300]) out.push(translate(rotateZ(windowGeo(80, 200, { arch: true, frame: "StoneLight" }), s * 90), [x, s * FY, 500]));
  return centred(merge(...out));
}

// ---- the lumberjacks' camp ----
function logPile(): Geo {
  const out: Geo[] = [], rnd = seeded(101);
  const rows = [5, 4, 3, 2];
  rows.forEach((n, k) => {
    for (let i = 0; i < n; i++) {
      const y = (i - (n - 1) / 2) * 62, z = 30 + k * 53, r = 28 + rnd() * 5, dx = (rnd() - 0.5) * 30, L = 210 + rnd() * 30;
      out.push(log([dx - L, y, z], [dx + L, y, z], r, "Plains_BarkPine"));
    }
  });
  for (const x of [-150, 150]) for (const s of [-1, 1]) out.push(cylinderBetween([x, s * 168, -10], [x + 4, s * 182, 200], 8, 6, "Plains_Bark", 7));
  out.push(cylinderBetween([-150, -182, 150], [-150, 182, 150], 2, 4, "RopeTan"), cylinderBetween([150, -182, 150], [150, 182, 150], 2, 4, "RopeTan"));
  // chocks and an axe on top
  out.push(boxBounds([-240, -200, 0], [-200, 200, 14], "WoodShade", 2), boxBounds([200, -200, 0], [240, 200, 14], "WoodShade", 2));
  out.push(cylinderBetween([-40, 20, 222], [60, 30, 214], 3, 6, "WoodWarm"), boxBounds([-48, 14, 210], [-32, 34, 234], "IronLight", 1));
  return merge(...out);
}

function lumberCamp(): Geo {
  const out: Geo[] = [], rnd = seeded(103);
  out.push(translate(scale(cylinderAt({ radius: 105, height: 1.5, segments: 12, bottom: [0, 0, 0] }, "Plains_Chips"), [1.5, 1, 1]), [0, 0, -0.5]));
  // the sawhorse, a log on it and a two-man saw part way through
  for (const x of [-110, 110]) {
    out.push(beamBetween([x, -56, -4], [x, 30, 112], 10, 10, "WoodWarm"));
    out.push(beamBetween([x, 56, -4], [x, -30, 112], 10, 10, "WoodWarm"));
  }
  out.push(beamBetween([-110, 0, 54], [110, 0, 54], 8, 8, "WoodShade"));
  out.push(log([-200, 0, 100], [210, 0, 104], 26, "Plains_BarkPine"));
  out.push(boxBounds([58, -96, 84], [60, 96, 110], "IronLight"));
  for (const s of [-1, 1]) out.push(cylinderBetween([59, s * 96, 82], [59, s * 100, 128], 3, 6, "WoodWarm"), cylinderBetween([59, s * 96, 124], [59, s * 112, 124], 3.5, 6, "WoodWarm"));
  // the chopping block with its axe, split wood beside it
  out.push(cylinderAt({ radius: 32, height: 52, segments: 10, bottom: [-150, 180, 0] }, "Plains_BarkPine"), cylinderAt({ radius: 28, height: 2, segments: 10, bottom: [-150, 180, 51] }, "Plains_LogEnd"));
  out.push(cylinderBetween([-146, 182, 60], [-110, 214, 124], 3, 6, "WoodWarm"), boxBounds([-160, 168, 48], [-136, 196, 64], "IronLight", 1.5));
  for (let k = 0; k < 3; k++) for (let i = 0; i < 6; i++) {
    const y = 120 + i * 24 + (k % 2) * 10, z = 8 + k * 16;
    out.push(translate(rotateZ(rotateY(box([62, 16, 15], [0, 0, 0], i % 2 ? "Plains_LogEnd" : "Plains_Sawdust", 2), (rnd() - 0.5) * 6), (rnd() - 0.5) * 8), [100, y, z]));
  }
  for (let i = 0; i < 6; i++) out.push(translate(rotateZ(box([40, 12, 10], [0, 0, 5], "Plains_LogEnd", 2), rnd() * 180), [-90 + rnd() * 140, 110 + rnd() * 60, 0]));
  // a tool rack at the back: an axe, a bow saw, a coil of rope
  const RX = 240;
  out.push(boxAt([12, 12, 190], [RX, -110, 0], "Plains_Timber"), boxAt([12, 12, 190], [RX, 60, 0], "Plains_Timber"), beamBetween([RX, -116, 180], [RX, 66, 180], 10, 10, "WoodShade"));
  out.push(cylinderBetween([RX - 8, -70, 176], [RX - 8, -70, 80], 3, 6, "WoodWarm"), boxBounds([RX - 12, -84, 80], [RX - 4, -60, 100], "IronLight"));
  out.push(translate(rotateY(merge(torus(36, 2.5, 14, 3, "WoodWarm"), boxBounds([-36, -1, -1], [36, 1, 1], "IronLight")), 90), [RX - 10, 10, 130]));
  out.push(translate(rotateY(torus(16, 4, 12, 4, "RopeTan"), 90), [RX - 10, -20, 140]));
  return centred(merge(...out));
}

// ---- water ----
// A sheet of falling water along Y from y0 to y1 through the profile points (x, z), both faces,
// a little ragged.
function waterSheet(profile: [number, number][], y0: number, y1: number, cols: number, mat: string, seed: number, wob = 5): Geo {
  const rnd = seeded(seed), rows = profile.length;
  const pts: V3[][] = profile.map(([x, z], i) => Array.from({ length: cols + 1 }, (_, j) => [x + (i && i < rows - 1 ? (rnd() - 0.5) * wob * 2 : 0), y0 + ((y1 - y0) * j) / cols, z] as V3));
  const pos: number[] = [];
  const tri = (a: V3, b: V3, c: V3) => pos.push(...a, ...b, ...c, ...a, ...c, ...b);
  for (let i = 0; i + 1 < rows; i++)
    for (let j = 0; j < cols; j++) {
      tri(pts[i][j], pts[i + 1][j], pts[i + 1][j + 1]);
      tri(pts[i][j], pts[i + 1][j + 1], pts[i][j + 1]);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return wuv([{ geo, mat }]);
}

// A waterfall off a 5 m cliff: the river runs over the plateau (from +X), over the lip at x = 150
// and falls clear of the rock face into a foaming pool round x = 0 (on the low ground, at the
// water's level) in mist; rocks at both sides, top and bottom. Stand it with its +X into the
// plateau, the lip on the plateau's edge.
function waterfall(): Geo {
  const H = 500, LIP = 150, W = 210, out: Geo[] = [];
  // on top: the river's last run to the lip, banked with rocks
  out.push(boxBounds([LIP - 2, -W, H - 4], [LIP + 760, W, H + 4], "Plains_Water"));
  out.push(cylinderBetween([LIP + 4, -W, H + 4], [LIP + 4, W, H + 4], 9, 6, "Plains_Foam"));
  for (let i = 0; i < 6; i++)
    for (const s of [-1, 1]) out.push(translate(stone([150 + (i % 3) * 30, 110, 70 + (i % 2) * 40], 120 + i * 2 + s, { moss: 1, mat: "Plains_RockDark" }), [LIP + 40 + i * 130, s * (W + 40), H - 20]));
  // the falling sheet, clear of the rock face (which leans out about a metre at its foot)
  const prof: [number, number][] = [[LIP + 4, H + 4], [LIP - 22, H - 30], [LIP - 48, H * 0.76], [LIP - 76, H * 0.52], [LIP - 104, H * 0.28], [LIP - 136, H * 0.08], [LIP - 152, -12]];
  out.push(waterSheet(prof, -W + 6, W - 6, 10, "Plains_Water", 131, 6));
  const rnd = seeded(133);
  for (let i = 0; i < 9; i++) {
    const y = -W + 30 + rnd() * (2 * W - 60), w = 14 + rnd() * 26;
    out.push(waterSheet(prof.map(([x, z]) => [x - 4, z]), y - w / 2, y + w / 2, 1, "Plains_Foam", 140 + i, 4));
  }
  // the pool: foam, spray and mist
  for (let i = 0; i < 12; i++) {
    const a = rnd() * Math.PI - Math.PI / 2, r = 40 + rnd() * 120;
    out.push(translate(scale(sphereCenter(36 + rnd() * 40, [0, 0, 0], "Plains_Foam", 8), [1.2, 1, 0.24]), [LIP - 170 - Math.cos(a) * r * 0.6, Math.sin(a) * (W + 20) * 0.9, -9]));
  }
  for (const [x, y, z, r] of [[-30, -60, 60, 90], [-10, 80, 90, 80], [-80, 10, 40, 110]]) out.push(sphereCenter(r, [x, y, z], "Plains_Mist", 10));
  // rocks at the foot, either side
  for (const s of [-1, 1]) {
    out.push(translate(stone([200, 170, 160], 150 + s, { moss: 1, mat: "Plains_RockDark" }), [60, s * (W + 70), -20]));
    out.push(translate(stone([120, 110, 80], 153 + s, { mat: "Plains_RockDark" }), [-90, s * (W + 40), -30]));
    out.push(translate(stone([80, 70, 50], 156 + s, { mat: "Plains_Boulder" }), [-200, s * (W - 20), -30]));
  }
  return merge(...out);
}

// Rapids: dark wet rocks standing out of a river (their feet under the water) with white water
// streaming past them toward -X.
function rapids(): Geo {
  const out: Geo[] = [], rnd = seeded(161);
  const rocks: [number, number, number, number][] = [[0, 0, 150, 90], [120, -110, 110, 70], [-110, 100, 120, 60], [160, 120, 90, 50], [-160, -90, 80, 44], [40, 190, 70, 40], [-20, -200, 90, 46]];
  for (const [x, y, s, h] of rocks) {
    out.push(translate(rotateZ(stone([s, s * 0.8, h + 34], 170 + Math.round(x + y) % 40, { mat: "Plains_RockDark", moss: h > 60 ? 0.6 : 0 }), rnd() * 180), [x, y, -34]));
    // white water piled on the upstream side and trailing off downstream
    out.push(translate(scale(sphereCenter(s * 0.5, [0, 0, 0], "Plains_Foam", 8), [0.6, 1.1, 0.16]), [x + s * 0.42, y, -9]));
    for (let k = 1; k <= 3; k++) out.push(translate(scale(sphereCenter(s * 0.34, [0, 0, 0], "Plains_Foam", 8), [1.6, 0.5, 0.12]), [x - s * 0.4 - k * 60, y + (rnd() - 0.5) * 30, -10]));
  }
  for (let i = 0; i < 8; i++) out.push(translate(scale(sphereCenter(30 + rnd() * 30, [0, 0, 0], "Plains_Foam", 6), [2.4, 0.4, 0.1]), [-260 + rnd() * 500, -220 + rnd() * 440, -11]));
  return merge(...out);
}

// ================================================================================== sample
// A corner of the plains north of Eden: the royal road through wheat fields to the castle's
// shut gate, the checkpoint and its watchtower, a stream with the water mill, rapids and a
// plank bridge, the edge of the great oak wood with its rocks, fallen log and ferns, and the
// lumberjacks' yard.
function strip(len: number, w: number, mat: string): THREE.Object3D {
  return solid(boxAt([len, w, 3], [0, 0, -1], mat));
}
function stream(pts: [number, number][], w: number): THREE.Object3D {
  const out: Geo[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    out.push(beamBetween([ax, ay, 1], [bx, by, 1], w, 2, "Plains_Water"), sphereCenter(w / 2, [bx, by, -w / 2 + 2], "Plains_Water", 12));
  }
  return solid(merge(...out));
}
function sample(put: Put): void {
  // the royal road north to the castle, a lane off it east to the mill
  put(strip(4800, 520, "Cobble"), [100, 0, 0], 0);
  put(strip(1700, 300, "Plains_Dirt"), [-500, -1050, 0], 90);
  // the castle's shut gate at the road's end, its keep behind
  put("castle_keep", [3150, 0, 0], 0, 0.7);
  put("castle_gatehouse", [2000, 0, 0], 0);
  // the checkpoint and its watchtower, milestones and a signpost
  put("checkpoint_gate", [300, 0, 0], 0);
  put("watchtower", [450, -1000, 0], 90);
  put("milestone", [-1100, 420, 0], 90);
  put("milestone", [1300, 420, 0], 90);
  put("signpost", [-1700, -420, 0], -30);
  // wheat fields west of the road, fenced, a scarecrow, hay
  for (const [x, y] of [[-1700, 1000], [-850, 1000], [-1700, 1700], [-850, 1700]]) put("wheat_field", [x, y, 0], 0);
  for (let x = -2000; x < -400; x += 400) put("rail_fence", [x + 200, 560, 0], 90);
  put("scarecrow", [-1275, 1350, 0], 180);
  put("hay_bales", [-300, 1350, 0], 30);
  put("wheat_field", [-1500, -900, 0], 90);
  put("hay_bales", [-2100, -1500, 0], -60);
  // the stream down the east side, the mill on it, a bridge, rapids, reeds
  put(stream([[2600, -2050], [1400, -1900], [200, -2050], [-1000, -1850], [-2600, -2000]], 520), [0, 0, 0]);
  put("water_mill", [-500, -1550, 0], 180);
  put("wood_bridge", [-1500, -1880, 0], 90);
  put("rapids", [900, -1950, 0], 0);
  for (const [x, y] of [[-1050, -1550], [-2100, -1580], [1500, -1600], [500, -1650], [2200, -1700]] as [number, number][]) put("reeds", [x, y, 0], x);
  put("flat_rock", [1800, -1580, 0], 20);
  // the edge of the great wood in the west, rocks and a fallen oak under it
  for (const [x, y, k, sc] of [[-2100, 2400, "BigOak", 1], [-1300, 2500, "RoundTree", 0.9], [-400, 2350, "BigOak", 1.1], [500, 2500, "BigOak", 0.95], [1400, 2400, "RoundTree", 1], [2200, 2300, "BigOak", 0.9], [-2100, 2000, "SmallTree", 0.9], [200, 2050, "SmallTree", 1], [1000, 2150, "Birch", 1]] as [number, number, string, number][])
    put(`flora:${k}`, [x, y, 0], x * 0.1, sc);
  put("boulder", [-200, 1900, 0], 20);
  put("rock_cluster", [1700, 1850, 0], -30);
  put("fallen_log", [-1300, 2150, 0], 75);
  put("stump", [700, 1750, 0], 0);
  for (const [x, y] of [[-850, 2100], [-1700, 2200], [900, 1950], [1500, 2250], [-200, 2200], [2300, 2000]] as [number, number][]) put("fern_clump", [x, y, 0], x);
  for (const [x, y] of [[-300, 800], [600, 900], [1600, 700], [-2200, 400], [1600, -900], [-600, -500], [1200, -1300]] as [number, number][]) put("tall_grass", [x, y, 0], y);
  // the lumberjacks' yard by the wood
  put("log_pile", [1700, 1250, 0], 90);
  put("lumber_camp", [900, 1200, 0], 180);
}

export const KIT: Kit = {
  id: "plains",
  name: "ทุ่งราบภาคกลาง",
  region: "ป่าและทุ่งรอบอีเดน",
  desc: "ป่าโอ๊ก ทุ่งข้าวสาลี ลำธาร ถนนหลวง ป่าสนริมแม่น้ำ",
  ground: "grass",
  items: [
    { id: "boulder", name: "หินก้อนใหญ่มีมอส", make: boulder, tags: ["rock", "decor"] },
    { id: "rock_cluster", name: "กองหินกลางป่า", make: rockCluster, tags: ["rock", "decor"] },
    { id: "flat_rock", name: "หินแผ่นริมลำธาร", make: flatRock, tags: ["rock", "decor"] },
    { id: "fallen_log", name: "ขอนโอ๊กล้ม", make: fallenLog, tags: ["log", "decor"] },
    { id: "stump", name: "ตอไม้เก่า", make: stump, tags: ["log", "decor"] },
    { id: "fern_clump", name: "ดงเฟิร์น", make: fernClump, tags: ["ground", "plant"] },
    { id: "tall_grass", name: "กอหญ้าสูง", make: tallGrass, tags: ["ground", "plant"] },
    { id: "reeds", name: "กอกกริมน้ำ", make: reeds, tags: ["ground", "plant"] },
    { id: "wood_bridge", name: "สะพานไม้ข้ามลำธาร (9 ม.)", make: woodBridge, tags: ["ground", "bridge"] },
    { id: "forest_shrine", name: "ศาลเจ้าป่าโบราณ", make: forestShrine, tags: ["landmark", "magic"] },
    { id: "hunter_lodge", name: "กระท่อมนายพราน", make: hunterLodge, tags: ["building"] },
    { id: "wheat_field", name: "แปลงข้าวสาลี (8x6 ม.)", make: wheatField, tags: ["farm", "plant"] },
    { id: "rail_fence", name: "รั้วไม้ทุ่งนา (4 ม.)", make: railFence, tags: ["fence", "wall"] },
    { id: "hay_bales", name: "กองฟางมัด", make: hayBales, tags: ["farm", "decor"] },
    { id: "scarecrow", name: "หุ่นไล่กา", make: scarecrow, tags: ["farm", "decor"] },
    { id: "water_mill", name: "โรงสีน้ำ", make: waterMill, tags: ["building", "landmark"] },
    { id: "checkpoint_gate", name: "ด่านตรวจถนนหลวง", make: checkpointGate, tags: ["gate", "defence", "landmark"] },
    { id: "watchtower", name: "หอสังเกตการณ์ไม้", make: watchtower, tags: ["tower", "defence"] },
    { id: "milestone", name: "หลักหินถนนหลวง", make: milestone, tags: ["decor"] },
    { id: "signpost", name: "ป้ายบอกทาง", make: signpost, tags: ["decor", "sign"] },
    { id: "castle_gatehouse", name: "ประตูปราสาทหลวง (ปิด)", make: castleGatehouse, tags: ["gate", "landmark", "defence"] },
    { id: "castle_keep", name: "หอหลักปราสาทหลวง", make: castleKeep, tags: ["landmark", "building"] },
    { id: "log_pile", name: "กองซุงสน", make: logPile, tags: ["log", "decor"] },
    { id: "lumber_camp", name: "ลานเลื่อยไม้", make: lumberCamp, tags: ["camp", "decor"] },
    { id: "waterfall", name: "น้ำตกหน้าผา (5 ม.)", make: waterfall, tags: ["water", "landmark"] },
    { id: "rapids", name: "แก่งหินกลางน้ำ", make: rapids, tags: ["water", "decor"] },
  ],
  sample,
};
