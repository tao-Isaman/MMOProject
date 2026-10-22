// อีเดน (Eden): the kingdom's capital and the starting city, on the central plains where the
// road runs down to the sea. Pale stone and white plaster under blue roofs: the city wall and
// its gate, townhouses and an inn, the great cathedral, the fountain plaza and its market, and a
// stone harbour with quays, a pier, boats and a lighthouse.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front to -X.
// Boats sit on their keel (place them about 40 cm down so they float); the quay, pier and
// lighthouse reach down into the water below z = 0.

import * as THREE from "three";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, array, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, sphereCenter, torus, gableRoof, gableWall, rock,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial, flowerCell, FLOWER_CELLS } from "../textures";
import type { Recipe } from "../textures";
import { Cards, shrub } from "../trees";
import type { Kit, Put } from "./types";

// ---- materials ----
const EDEN_MATS: Record<string, Recipe> = {
  Eden_Plaster: { map: "plaster", tint: "#f7f4ec", bump: 0.6 },
  Eden_PaintWhite: { map: "plaster", tint: "#fdfcf7", bump: 0.3, rough: 0.7 },
  Eden_PaintBlue: { map: "plaster", tint: "#3c69b2", bump: 0.4, rough: 0.7 },
  Eden_Shutter: { map: "wood", tint: "#3f6cb4", bump: 1 },
  Eden_Terracotta: { map: "plaster", tint: "#c66a3e", bump: 0.6 },
  Eden_Dark: { tint: "#22252d", rough: 1 },
  Eden_Water: { tint: "#62b4de", rough: 0.05, opacity: 0.86 },
  Eden_Spray: { tint: "#e4f5ff", rough: 0.1, opacity: 0.6, glow: "#a6dcff", glowI: 0.35 },
  Eden_GlassBlue: { tint: "#4a78d6", rough: 0.2, glow: "#2a4caa", glowI: 0.6 },
  Eden_GlassRed: { tint: "#d4485a", rough: 0.2, glow: "#a8283a", glowI: 0.6 },
  Eden_GlassGold: { tint: "#f2c450", rough: 0.2, glow: "#c88a20", glowI: 0.6 },
  Eden_LampGlass: { tint: "#fff3c4", rough: 0.1, glow: "#ffd27a", glowI: 1.1, opacity: 0.6 },
  Eden_Sail: { map: "fabric", tint: "#fbf7ec", rough: 0.95 },
  Eden_HullBlue: { map: "wood", tint: "#2f5c9c", bump: 1 },
  Eden_HullWhite: { map: "wood", tint: "#eee8dc", bump: 1 },
  Eden_Soil: { map: "felt", tint: "#5b4232", rough: 1 },
  Eden_FlowerRed: { map: "felt", tint: "#e23d55", rough: 0.9 },
  Eden_FlowerPink: { map: "felt", tint: "#f49ac1", rough: 0.9 },
  Eden_FlowerYellow: { map: "felt", tint: "#ffd64a", rough: 0.9 },
  Eden_FlowerWhite: { map: "felt", tint: "#fbf8f0", rough: 0.9 },
  Eden_FlowerViolet: { map: "felt", tint: "#9c6ad8", rough: 0.9 },
  Eden_Apple: { tint: "#cf3a2e", rough: 0.45 },
  Eden_Orange: { tint: "#f08a24", rough: 0.55 },
  Eden_Lemon: { tint: "#f4d742", rough: 0.55 },
  Eden_Pear: { tint: "#9cc443", rough: 0.55 },
  // the city quarter
  Eden_PlasterYellow: { map: "plaster", tint: "#f6e2a2", bump: 0.6 },
  Eden_PlasterRose: { map: "plaster", tint: "#f2cbc2", bump: 0.6 },
  Eden_Hedge: { map: "foliage", tint: "#6cae4c", rough: 0.95, bump: 1.5 },
  Eden_HedgeTop: { map: "foliage", tint: "#a0d468", rough: 0.9, bump: 1.5 },
  Eden_ShopGlass: { tint: "#d8eef8", rough: 0.05, opacity: 0.22 },
  Eden_PotionRed: { tint: "#ff5a78", rough: 0.15, glow: "#ff2f55", glowI: 0.9 },
  Eden_PotionBlue: { tint: "#5ab4ff", rough: 0.15, glow: "#2f84ff", glowI: 0.9 },
  Eden_PotionGreen: { tint: "#6af08e", rough: 0.15, glow: "#2cc85e", glowI: 0.9 },
  Eden_PotionViolet: { tint: "#c58aff", rough: 0.15, glow: "#9a4cff", glowI: 0.9 },
  Eden_PotionGold: { tint: "#ffd968", rough: 0.15, glow: "#ffaa22", glowI: 0.9 },
  Eden_Bread: { map: "felt", tint: "#c98944", rough: 0.75 },
  Eden_Chalk: { map: "felt", tint: "#2e3a34", rough: 0.95 },
  Eden_Parchment: { map: "paper", tint: "#f0e2bd", rough: 0.95 },
};
for (const [name, recipe] of Object.entries(EDEN_MATS)) defineMaterial(name, recipe);

// ---- helpers ----
const D = Math.PI / 180;

// World-aligned texture coordinates (metres / s): masonry courses stay level and run on across
// neighbouring boxes; `vertical` turns them (planks up a door).
function wuv(g: Geo, s = 1, vertical = false): Geo {
  return g.map(({ geo, mat }) => {
    const out = geo.clone();
    const pos = out.getAttribute("position"), nor = out.getAttribute("normal");
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i)), nz = Math.abs(nor.getZ(i));
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const side = nz < nx || nz < ny;
      let [u, v] = side ? (nx >= ny ? [y, z] : [x, z]) : [x, y];
      if (vertical && side) [u, v] = [v, u];
      uv[i * 2] = u / (100 * s);
      uv[i * 2 + 1] = v / (100 * s);
    }
    out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    return { geo: out, mat };
  });
}

// Put a piece built facing -X (its back on x = 0, centred on y = 0) onto one face of a box
// building: `d` from the centre to that wall, `u` along the wall, bottom at z.
type Face = "-x" | "+x" | "-y" | "+y";
function onFace(g: Geo, face: Face, d: number, u: number, z: number): Geo {
  if (face === "-x") return translate(g, [-d, u, z]);
  if (face === "+x") return translate(rotateZ(g, 180), [d, u, z]);
  if (face === "-y") return translate(rotateZ(g, 90), [u, -d, z]);
  return translate(rotateZ(g, -90), [u, d, z]);
}
// ... or onto a round tower: `r` out from its axis at `c`, facing the compass angle `deg` (0 = +X).
function onRound(g: Geo, r: number, deg: number, z: number, c: V3 = [0, 0, 0]): Geo {
  return translate(rotateZ(translate(g, [-r, 0, z]), deg - 180), c);
}
// A round (or polygonal) drum turned so a flat face looks along +X, -X, +Y and -Y.
function ring(r: number, h: number, z: number, mat: string, seg = 16, rTop = r): Geo {
  return rotateZ(cylinderAt({ rBot: r, rTop, height: h, segments: seg, bottom: [0, 0, z] }, mat), 180 / seg);
}

// Outlines in a wall's plane: (shape x, shape y) = (world y, world z).
function rectShape(hw: number, top: number, bottom = 0): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-hw, bottom);
  s.lineTo(hw, bottom);
  s.lineTo(hw, top);
  s.lineTo(-hw, top);
  s.lineTo(-hw, bottom);
  return s;
}
// Straight sides up to `spring`, then a round (or pointed, Gothic) head.
function archShape(hw: number, spring: number, pointed = false, bottom = 0): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-hw, bottom);
  s.lineTo(hw, bottom);
  s.lineTo(hw, spring);
  if (pointed) {
    s.absarc(-hw, spring, 2 * hw, 0, Math.PI / 3, false);
    s.absarc(hw, spring, 2 * hw, (2 * Math.PI) / 3, Math.PI, false);
  } else s.absarc(0, spring, hw, 0, Math.PI, false);
  s.lineTo(-hw, bottom);
  return s;
}
function circleShape(r: number, cy = 0, cz = 0): THREE.Shape {
  const s = new THREE.Shape();
  s.absarc(cy, cz, r, 0, Math.PI * 2, false);
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
// A flat piece cut to a shape, facing -X, from x0 to x0 + depth.
function panel(shape: THREE.Shape, x0: number, depth: number, mat: string, o: { s?: number; vertical?: boolean; seg?: number } = {}): Geo {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: o.seg ?? 6 });
  g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, x0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  const geo = g.index ? g.toNonIndexed() : g;
  geo.clearGroups();
  return wuv([{ geo, mat }], o.s ?? 1, o.vertical);
}
// A solid wrapped around some points (boat hulls, capes, sloped walls).
function hullGeo(pts: V3[], mat: string): Geo {
  return wuv([{ geo: new ConvexGeometry(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))), mat }]);
}
// A cloth triangle a-b-c bellied out by `bulge` in the middle, finished on both sides (sails, pennants).
function sheet(a: V3, b: V3, c: V3, bulge: number, mat: string, n = 4): Geo {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), C = new THREE.Vector3(...c);
  const nrm = new THREE.Vector3().subVectors(B, A).cross(new THREE.Vector3().subVectors(C, A)).normalize();
  const at = (i: number, j: number): THREE.Vector3 => {
    const u = i / n, v = j / n, w = 1 - u - v;
    return A.clone().multiplyScalar(w).addScaledVector(B, u).addScaledVector(C, v).addScaledVector(nrm, bulge * 27 * u * v * w);
  };
  const pos: number[] = [];
  const tri = (p: THREE.Vector3, q: THREE.Vector3, r: THREE.Vector3) => pos.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z, p.x, p.y, p.z, r.x, r.y, r.z, q.x, q.y, q.z);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n - i; j++) {
      tri(at(i, j), at(i + 1, j), at(i, j + 1));
      if (i + j < n - 1) tri(at(i + 1, j), at(i + 1, j + 1), at(i, j + 1));
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return wuv([{ geo, mat }]);
}
// Voussoirs: `n` wedge stones round an arc (degrees from +Y over the top) in a -X facing wall,
// centre c, from radius r out to r + thick, `depth` through the wall.
function arcStones(c: V3, r: number, a0: number, a1: number, n: number, thick: number, depth: number, mat: string, bevel = 2): Geo {
  const out: Geo[] = [];
  const step = (a1 - a0) / n, chord = 2 * (r + thick) * Math.sin((Math.abs(step) * D) / 2) * 1.04, rm = r + thick / 2;
  for (let i = 0; i < n; i++) {
    const a = (a0 + step * (i + 0.5)) * D;
    out.push(translate(rotateX(box([depth, chord, thick], [0, 0, 0], mat, bevel), a / D - 90), [c[0], c[1] + rm * Math.cos(a), c[2] + rm * Math.sin(a)]));
  }
  return merge(...out);
}

// ---- small parts ----
// Flowers are alpha-cut cards (src/world3d/trees.ts): strap leaves standing up in crossed cards,
// flower heads from the atlas (textures.ts: flowerAtlas) facing the sky over them.
const FC = FLOWER_CELLS;
// the old bloom colours in order: red, pink, yellow, white, violet
const BLOOM = [FC.roseRed, FC.cosmosPink, FC.buttercup, FC.daisy, FC.pansy];
const SKY = new THREE.Vector3(0, 0, 1);
function rng(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
// A clump of flowers standing on `at`: leaves w wide and h tall in two crossed cards, `heads`
// flower cards (of the atlas cells `cells`) over them, tipped a little toward `lean` (x, y).
function flowerClump(cards: Cards, at: V3, w: number, h: number, cells: number[], heads: number, rnd: () => number, lean: [number, number] = [0, 0]): void {
  const a0 = rnd() * Math.PI;
  for (let k = 0; k < 2; k++) {
    const a = a0 + (k * Math.PI) / 2 + (rnd() - 0.5) * 0.4;
    const right = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
    const up = new THREE.Vector3(lean[0] * 0.25 + (rnd() - 0.5) * 0.2, lean[1] * 0.25 + (rnd() - 0.5) * 0.2, 1).normalize();
    const n = new THREE.Vector3(lean[0] * 0.4, lean[1] * 0.4, 1).normalize();
    cards.add(k ? "TuftCard" : "TuftCardDark", at, right, up, w * (0.9 + rnd() * 0.2), h * (0.85 + rnd() * 0.3), n, [0, 0, 1, 1], true);
  }
  for (let i = 0; i < heads; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * w * 0.22, sz = w * (0.6 + rnd() * 0.25);
    const c: V3 = [at[0] + Math.cos(a) * d, at[1] + Math.sin(a) * d, at[2] + h * (0.66 + rnd() * 0.3)];
    const face = new THREE.Vector3(lean[0] * 0.6 + (rnd() - 0.5) * 0.6, lean[1] * 0.6 + (rnd() - 0.5) * 0.6, 1);
    cards.facing("FlowerCards", c, face, rnd() * Math.PI * 2, sz, sz, SKY, flowerCell(cells[Math.floor(rnd() * cells.length)]));
  }
}
// A row of flower clumps along Y, centred on the origin, sitting on z = 0, facing -X.
function blooms(len: number, n: number, seed: number, r = 7): Geo {
  const cards = new Cards(), rnd = rng(seed + 11);
  const main = BLOOM[seed % 5], alt = BLOOM[(seed + 3) % 5];
  for (let i = 0; i < n; i++) {
    const y = -len / 2 + (len * (i + 0.5)) / n;
    flowerClump(cards, [1, y + (rnd() - 0.5) * 3, 0], r * 3.6, r * 3, [i % 3 === 1 ? alt : main], 2, rnd, [-0.7, 0]);
  }
  return cards.geo();
}
// A single rose in a bud vase: two leaves and the flower card on top.
function vaseRose(at: V3): Geo {
  const cards = new Cards();
  for (const a of [0, Math.PI / 2]) cards.add("TuftCard", at, new THREE.Vector3(Math.cos(a), Math.sin(a), 0), SKY, 9, 9, SKY, [0, 0, 1, 1], true);
  cards.facing("FlowerCards", [at[0], at[1], at[2] + 8], new THREE.Vector3(0.3, 0.2, 1), 0.4, 12, 12, SKY, flowerCell(FC.roseRed));
  return cards.geo();
}
// A painted window box of flowers that hangs under a sill (its top at z = 0, facing -X).
function windowBox(w: number, seed: number): Geo {
  return merge(
    boxBounds([-30, -w / 2, -24], [-2, w / 2, 0], "Eden_Shutter"),
    translate(blooms(w - 8, Math.max(3, Math.round(w / 15)), seed, 6), [-16, 0, -2]),
  );
}

interface WinOpt { arch?: boolean; shutters?: boolean; flowers?: number; frame?: string; glass?: string }
// A window facing -X: stone surround, glass, white glazing bars, sill and a lintel with a
// keystone (or a round head); blue shutters and a flower box if asked. Bottom of the glass at z = 0.
function windowGeo(w: number, h: number, o: WinOpt = {}): Geo {
  const hw = w / 2, fm = o.frame ?? "StoneWhite", spring = o.arch ? h - hw : h;
  const out: Geo[] = [
    panel(o.arch ? archShape(hw + 12, spring, false, -6) : rectShape(hw + 12, h + 6, -6), -8, 10, fm),
    panel(o.arch ? archShape(hw, spring) : rectShape(hw, h), -10, 2, o.glass ?? "GlassBlue"),
    boxBounds([-12, -2, 0], [-10, 2, h - 2], "Eden_PaintWhite"),
    boxBounds([-12, -hw, (o.arch ? spring : h * 0.6) - 2], [-10, hw, (o.arch ? spring : h * 0.6) + 2], "Eden_PaintWhite"),
    boxBounds([-17, -hw - 16, -16], [2, hw + 16, -5], fm, 2),
  ];
  if (o.arch) out.push(boxBounds([-13, -8, h + 2], [2, 8, h + 22], fm));
  else out.push(boxBounds([-13, -hw - 16, h + 6], [2, hw + 16, h + 20], fm, 2), boxBounds([-15, -9, h + 2], [2, 9, h + 26], fm));
  if (o.shutters)
    for (const sy of [-1, 1]) {
      const a = sy * (hw + 14), b = sy * (hw + 14 + hw * 0.95), lo = Math.min(a, b), hi = Math.max(a, b);
      out.push(boxBounds([-7, lo, 0], [-2, hi, spring], "Eden_Shutter"));
      for (const z of [spring * 0.16, spring * 0.78]) out.push(boxBounds([-9, lo + 3, z], [-7, hi - 3, z + 6], "Eden_Shutter"));
    }
  if (o.flowers !== undefined) out.push(translate(windowBox(w + 18, o.flowers), [0, 0, -16]));
  return merge(...out);
}
// A slit window for the walls and towers (facing -X, bottom at z = 0).
function slitGeo(h = 100): Geo {
  return merge(
    panel(rectShape(17, h + 10, -10), -6, 8, "StoneLight"),
    panel(rectShape(5, h), -8, 2, "Eden_Dark"),
    panel(rectShape(14, h * 0.55 + 3, h * 0.55 - 3), -8, 2, "Eden_Dark"),
  );
}
// A door facing -X: stone frame, plank leaf (or two), iron straps, gold handles, a step.
function doorGeo(w: number, h: number, o: { arch?: boolean; double?: boolean; frame?: string; step?: boolean } = {}): Geo {
  const hw = w / 2, fm = o.frame ?? "StoneLight", spring = o.arch ? h - hw : h;
  const out: Geo[] = [
    panel(o.arch ? archShape(hw + 16, spring) : rectShape(hw + 16, h + 8), -8, 10, fm),
    panel(o.arch ? archShape(hw, spring) : rectShape(hw, h), -11, 3, "DoorWood", { vertical: true }),
  ];
  for (const z of [h * 0.18, spring * 0.74]) out.push(boxBounds([-13, -hw + 4, z], [-11, hw - 4, z + 7], "IronDark"));
  if (o.double) out.push(boxBounds([-12.5, -1.5, 0], [-11, 1.5, h - 2], "WoodDark"), sphereCenter(4, [-15, -9, h * 0.42], "GoldTrim", 6), sphereCenter(4, [-15, 9, h * 0.42], "GoldTrim", 6));
  else out.push(sphereCenter(4.5, [-15, hw * 0.6, h * 0.42], "GoldTrim", 6));
  if (o.arch) out.push(boxBounds([-12, -9, h + 4], [2, 9, h + 26], fm, 1.5));
  else out.push(boxBounds([-13, -hw - 22, h + 8], [2, hw + 22, h + 24], fm, 2));
  if (o.step !== false) out.push(boxBounds([-48, -hw - 24, 0], [2, hw + 24, 14], "StoneGrey", 2));
  return merge(...out);
}
// A Gothic lancet of stained glass facing -X: `h` up to the springing, the point above it.
function lancet(w: number, h: number, glass = "Eden_GlassBlue"): Geo {
  const hw = w / 2;
  const out: Geo[] = [
    panel(archShape(hw + 14, h, true, -10), -8, 10, "StoneLight"),
    panel(archShape(hw, h, true), -10, 2, glass),
    boxBounds([-18, -hw - 18, -18], [2, hw + 18, -6], "StoneLight", 2),
  ];
  if (glass !== "Eden_Dark") {
    out.push(panel(circleShape(hw * 0.45, 0, h + w * 0.32), -11, 1, "Eden_GlassRed"));
    out.push(boxBounds([-12, -2, 0], [-10, 2, h + w * 0.8], "Eden_Dark"));
    for (const t of [0.3, 0.62]) out.push(boxBounds([-12, -hw, h * t], [-10, hw, h * t + 4], "Eden_Dark"));
  } else for (let z = h * 0.25; z < h + w * 0.5; z += 26) out.push(boxBounds([-14, -hw, z], [-10, hw, z + 6], "WoodDark")); // louvres
  return merge(...out);
}
// A lantern standing on z = 0 (about 44 cm high).
function lantern(): Geo {
  return merge(
    rotateZ(cylinderAt({ rBot: 10, rTop: 12, height: 4, segments: 4, bottom: [0, 0, 0] }, "IronDark"), 45),
    boxAt([13, 13, 22], [0, 0, 4], "LanternGlow"),
    ...[[-7, -7], [7, -7], [-7, 7], [7, 7]].map(([x, y]) => boxAt([2.5, 2.5, 22], [x, y, 4], "IronDark")),
    rotateZ(cylinderAt({ rBot: 14, rTop: 2, height: 13, segments: 4, bottom: [0, 0, 26] }, "IronDark"), 45),
    sphereCenter(3, [0, 0, 41], "GoldTrim", 6),
  );
}
// A lantern on an iron bracket out from a -X facing wall (bracket at z = 0).
function wallLantern(): Geo {
  return merge(
    beamBetween([2, 0, 0], [-42, 0, 0], 4, 5, "IronDark"),
    beamBetween([2, 0, -28], [-26, 0, -2], 3, 3, "IronDark"),
    translate(lantern(), [-38, 0, -46]),
  );
}
// The arms of Eden: a gold crown on a white roundel ringed in gold, facing -X (both faces if twoSided).
function crest(r: number): Geo {
  return merge(
    panel(circleShape(r + 4), -1.5, 1.5, "GoldTrim"),
    panel(circleShape(r), -2.5, 1, "Eden_PaintWhite"),
    panel(crownShape(r * 0.62), -3.5, 1, "GoldTrim"),
  );
}
// A banner hanging from a rod at z = 0 in the plane x = 0: blue field, gold edges, a pointed
// tail reaching down to z = -h - w/2, the crest on both faces.
function bannerGeo(w: number, h: number, field = "FabricBlue"): Geo {
  const hw = w / 2, tail = w / Math.SQRT2, c = translate(crest(w * 0.26), [0, 0, -h * 0.45]);
  return merge(
    cylinderBetween([0, -hw - 12, 4], [0, hw + 12, 4], 2.5, 6, "WoodDark"),
    sphereCenter(4, [0, -hw - 13, 4], "GoldTrim", 6),
    sphereCenter(4, [0, hw + 13, 4], "GoldTrim", 6),
    boxBounds([-1.5, -hw, -h], [1.5, hw, 0], field),
    translate(rotateX(box([2.4, tail, tail], [0, 0, 0], field), 45), [0, 0, -h]),
    boxBounds([-2.2, -hw - 1, -h], [2.2, -hw + 5, 0], "GoldTrim"),
    boxBounds([-2.2, hw - 5, -h], [2.2, hw + 1, 0], "GoldTrim"),
    boxBounds([-2.2, -hw - 1, -16], [2.2, hw + 1, -9], "GoldTrim"),
    beamBetween([0, -hw, -h], [0, 0, -h - hw], 4.4, 6, "GoldTrim"),
    beamBetween([0, hw, -h], [0, 0, -h - hw], 4.4, 6, "GoldTrim"),
    c,
    rotateZ(c, 180),
  );
}
// A striped cloth awning out from a -X facing wall: its back edge at the origin, its front
// `depth` out and `drop` lower, scalloped flaps along the front (iron stays if `stays`).
function awning(width: number, depth: number, drop: number, a: string, b: string, stays = true): Geo {
  const n = Math.max(3, Math.round(width / 32)), sw = width / n, len = Math.hypot(depth, drop), ang = Math.atan2(drop, depth) / D;
  const out: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const y = -width / 2 + sw * (i + 0.5), m = i % 2 ? b : a;
    out.push(rotateY(box([len, sw, 3], [-len / 2, y, 0], m), -ang));
    out.push(box([3, sw, 18], [-depth - 1, y, -drop - 9], m));
    out.push(translate(rotateY(cylinderAt({ radius: sw / 2, height: 2.4, segments: 8, bottom: [0, 0, 0] }, m), 90), [-depth - 2.2, y, -drop - 18]));
  }
  if (stays) for (const s of [-1, 1]) out.push(cylinderBetween([0, s * (width / 2 - 6), -drop - 50], [-depth + 2, s * (width / 2 - 6), -drop], 1.5, 5, "IronDark"));
  return merge(...out);
}
function barrel(): Geo {
  return merge(
    cylinderAt({ rBot: 26, rTop: 30, height: 40, segments: 12, bottom: [0, 0, 0] }, "WoodWarm"),
    cylinderAt({ rBot: 30, rTop: 26, height: 40, segments: 12, bottom: [0, 0, 40] }, "WoodWarm"),
    cylinderAt({ radius: 27.5, height: 5, segments: 12, bottom: [0, 0, 8] }, "IronDark"),
    cylinderAt({ radius: 30.8, height: 5, segments: 12, bottom: [0, 0, 37] }, "IronDark"),
    cylinderAt({ radius: 27.5, height: 5, segments: 12, bottom: [0, 0, 67] }, "IronDark"),
    cylinderAt({ radius: 25, height: 1, segments: 12, bottom: [0, 0, 80] }, "WoodShade"),
  );
}
function bollard(): Geo {
  return merge(
    cylinderAt({ rBot: 17, rTop: 14, height: 46, segments: 10, bottom: [0, 0, 0] }, "IronDark"),
    cylinderAt({ radius: 20, height: 7, segments: 10, bottom: [0, 0, 46] }, "IronDark"),
    sphereCenter(13, [0, 0, 53], "IronDark", 8),
    translate(torus(18, 4, 14, 6, "RopeTan"), [0, 0, 12]),
    translate(torus(17.5, 4, 14, 6, "RopeTan"), [0, 0, 20]),
  );
}
// A blue roof's ridge tiles along X (or Y).
function ridge(a: V3, b: V3, r = 12): Geo {
  return cylinderBetween(a, b, r, 8, "StoneBlueDark");
}
// A stone chimney with a cap and two pots, standing from z0 (inside the roof) to `top`.
function chimney(x: number, y: number, z0: number, top: number): Geo {
  return merge(
    wuv(boxBounds([x - 45, y - 38, z0], [x + 45, y + 38, top], "StoneLight"), 1.1),
    boxBounds([x - 53, y - 46, top], [x + 53, y + 46, top + 16], "StoneGrey", 2),
    cylinderAt({ radius: 11, height: 26, segments: 8, bottom: [x - 18, y, top + 16] }, "Eden_Terracotta"),
    cylinderAt({ radius: 11, height: 20, segments: 8, bottom: [x + 18, y, top + 16] }, "Eden_Terracotta"),
  );
}
// Corner stones up the corners of a box building between z0 and z1, alternating long and short.
function quoins(hx: number, hy: number, z0: number, z1: number, corners: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]]): Geo {
  const out: Geo[] = [];
  for (const [cx, cy] of corners)
    for (let i = 0, z = z0; z + 40 <= z1; i++, z += 50) {
      const ax = i % 2 ? 28 : 46, ay = i % 2 ? 46 : 28, x = cx * hx, y = cy * hy;
      out.push(boxBounds([cx < 0 ? x - 3 : x - ax, cy < 0 ? y - 3 : y - ay, z], [cx < 0 ? x + ax : x + 3, cy < 0 ? y + ay : y + 3, z + 40], "StoneWhite"));
    }
  return merge(...out);
}
// A small gabled dormer facing -X on a roof: its front at x, window inside (`h` high to the eaves).
function dormer(x: number, y: number, z0: number, w: number, depth: number, h = 150): Geo {
  const hw = w / 2;
  return translate(merge(
    boxBounds([0, -hw, 0], [depth, hw, h], "Eden_Plaster"),
    gableRoof([depth + 10, w, 8], [depth / 2 - 5, 0, h], 60, 10, "RoofBlue"),
    gableWall(0, hw, h, 56, "Eden_Plaster"),
    onFace(windowGeo(w - 76, 70, { frame: "Eden_PaintWhite" }), "-x", 0, 0, Math.round((h - 70) / 2) + 4),
  ), [x, y, z0]);
}

// ---- the city wall ----
// An 800 cm wall segment along Y (tiles end to end): footing, crenellated parapet outside (-X)
// on corbels, a paved wall-walk, slits, buttresses and a banner outside, pilasters inside.
function cityWall(): Geo {
  const L = 400, out: Geo[] = [];
  const mason: Geo[] = [
    boxBounds([-150, -L, 0], [150, L, 90], "StoneGrey"),
    boxBounds([-130, -L, 90], [130, L, 650], "StoneWhite"),
    boxBounds([-146, -L, 650], [-82, L, 722], "StoneWhite"),
    boxBounds([92, -L, 650], [130, L, 704], "StoneWhite"),
  ];
  for (const y of [-280, 280])
    mason.push(boxBounds([-196, y - 40, 90], [-130, y + 40, 300], "StoneWhite"), boxBounds([-172, y - 34, 300], [-130, y + 34, 470], "StoneWhite"));
  out.push(wuv(merge(...mason), 1.4));
  out.push(
    boxBounds([-82, -L, 650], [92, L, 654], "Cobble"),
    boxBounds([-142, -L, 556], [-130, L, 570], "StoneLight"),
    boxBounds([130, -L, 556], [142, L, 570], "StoneLight"),
    boxBounds([88, -L, 704], [134, L, 712], "StoneLight"),
    boxBounds([-150, -L, 722], [-78, L, 728], "StoneLight"),
    array(boxBounds([-150, -L + 20, 728], [-78, -L + 80, 800], "StoneWhite", 2), 8, [0, 100, 0]),
    array(boxBounds([-162, -L + 35, 610], [-130, -L + 65, 650], "StoneLight", 1.5), 8, [0, 100, 0]),
    array(boxBounds([130, -320, 90], [146, -280, 556], "StoneLight"), 4, [0, 200, 0]),
  );
  for (const y of [-280, 280])
    out.push(
      translate(rotateY(box([82, 86, 14], [0, 0, 0], "StoneLight", 2), -32), [-160, y, 304]),
      translate(rotateY(box([52, 74, 12], [0, 0, 0], "StoneLight", 2), -32), [-148, y, 474]),
    );
  for (const y of [-150, 150]) out.push(onFace(slitGeo(), "-x", 130, y, 340));
  out.push(translate(bannerGeo(120, 300), [-166, 0, 600]));
  out.push(onFace(wallLantern(), "+x", 146, 0, 430));
  return merge(...out);
}

// A round tower with a corbelled upper storey and a tall conical blue roof, a gold finial and
// a pennant; slits facing `slits` (compass degrees).
function roundTower(r: number, h: number, roofH: number, slits: number[], windows = [0, 90, 180, 270]): Geo {
  const fr = (rr: number) => rr * Math.cos(Math.PI / 16);
  const top = h + 150 + roofH;
  const out: Geo[] = [
    ring(r + 40, 110, 0, "StoneGrey", 16, r + 10),
    ring(r, h - 110, 110, "StoneWhite"),
    ring(r + 7, 14, Math.round(h * 0.45), "StoneLight"),
    ring(r + 30, 150, h, "StoneWhite"),
    ring(r + 36, 12, h + 138, "StoneLight"),
    ring(r + 74, roofH, h + 150, "RoofBlue", 16, 3),
    ring(r + 78, 8, h + 146, "StoneBlueDark"),
    cylinderBetween([0, 0, top - 30], [0, 0, top + 140], 3, 6, "IronDark"),
    sphereCenter(11, [0, 0, top + 4], "GoldTrim", 8),
    sphereCenter(5, [0, 0, top + 142], "GoldTrim", 6),
    sheet([0, 0, top + 134], [0, 0, top + 86], [0, -120, top + 108], 6, "FabricBlue", 3),
  ];
  for (let i = 0; i < 16; i++)
    out.push(rotateZ(merge(boxBounds([r - 6, -12, h - 64], [r + 30, 12, h], "StoneLight", 1.5), boxBounds([r - 6, -9, h - 96], [r + 14, 9, h - 64], "StoneLight", 1.5)), i * 22.5));
  for (const a of windows) out.push(onRound(windowGeo(46, 80, { arch: true, frame: "StoneLight" }), fr(r + 30), a, h + 36));
  for (const a of slits) {
    out.push(onRound(slitGeo(90), fr(r), a, Math.round(h * 0.22)));
    out.push(onRound(slitGeo(90), fr(r), a + 22.5, Math.round(h * 0.62)));
  }
  return merge(...out);
}

function wallTower(): Geo {
  return roundTower(300, 1000, 680, [180, 135, 225, 90, 270]);
}

// The main gate: an arched passage through a crenellated gatehouse, a half-raised portcullis,
// the great doors open inside, the arms of Eden above the arch, round towers either side with
// long banners. 1440 cm along Y (the wall line), the outside to -X.
function cityGate(): Geo {
  const HX = 260, HY = 300, R = 180, SP = 380, TOP = 950, out: Geo[] = [];
  const mason: Geo[] = [
    boxBounds([-HX, -HY, 0], [HX, -R, TOP], "StoneWhite"),
    boxBounds([-HX, R, 0], [HX, HY, TOP], "StoneWhite"),
    boxBounds([-HX, -R, 610], [HX, R, TOP], "StoneWhite"),
    boxBounds([-HX - 18, -HY, TOP], [-HX + 50, HY, TOP + 70], "StoneWhite"),
    boxBounds([HX - 50, -HY, TOP], [HX + 18, HY, TOP + 70], "StoneWhite"),
  ];
  // the spandrels, in 20 cm slices down to the arch (the voussoirs cover the steps)
  for (let y0 = -R; y0 < R; y0 += 20) {
    const m = Math.max(Math.abs(y0), Math.abs(y0 + 20));
    mason.push(boxBounds([-HX, y0, SP + Math.sqrt(205 * 205 - m * m)], [HX, y0 + 20, 620], "StoneWhite"));
  }
  out.push(wuv(merge(...mason), 1.4));
  out.push(
    arcStones([0, 0, SP], R, 0, 180, 11, 56, 2 * HX + 14, "StoneLight"),
    boxBounds([-HX - 50, -R, 0], [HX + 50, R, 6], "Cobble"),
    boxBounds([-HX - 10, -HY - 10, 0], [HX + 10, -R, 60], "StoneGrey", 2),
    boxBounds([-HX - 10, R, 0], [HX + 10, HY + 10, 60], "StoneGrey", 2),
    boxBounds([-HX - 8, -HY, 660], [HX + 8, HY, 676], "StoneLight", 1.5),
    boxBounds([-HX + 50, -HY, TOP], [HX - 50, HY, TOP + 4], "Cobble"),
  );
  for (const s of [-1, 1]) {
    const xo = s < 0 ? -HX - 22 : HX - 54;
    out.push(boxBounds([xo, -HY, TOP + 70], [xo + 76, HY, TOP + 77], "StoneLight"));
    out.push(array(boxBounds([xo, -HY + 20, TOP + 77], [xo + 76, -HY + 80, TOP + 150], "StoneWhite", 2), 6, [0, 100, 0]));
    const xc = s < 0 ? -HX - 18 : HX;
    out.push(array(boxBounds([xc, -HY + 35, TOP - 60], [xc + 18, -HY + 65, TOP], "StoneLight", 1.5), 6, [0, 100, 0]));
  }
  // impost blocks at the springing
  for (const s of [-1, 1]) out.push(boxBounds([-HX - 6, s < 0 ? -R - 8 : R - 4, SP - 18], [HX + 6, s < 0 ? -R + 4 : R + 8, SP], "StoneLight", 1.5));
  // the arms of Eden over the arch, front and back
  const arms = merge(
    panel(shieldShape(68), -4, 4, "GoldTrim"),
    panel(shieldShape(60), -6, 2, "Eden_PaintBlue"),
    panel(crownShape(36), -7, 1, "GoldTrim", { seg: 2 }),
    translate(panel(crownShape(44), -6, 6, "GoldTrim"), [0, 0, 92]),
  );
  out.push(translate(arms, [-HX, 0, 770]), translate(rotateZ(arms, 180), [HX, 0, 770]));
  // the portcullis, half raised, just inside the front arch
  const XP = -HX + 34, ZB = 236;
  for (let y = -160; y <= 160; y += 40) {
    out.push(boxBounds([XP - 4, y - 4, ZB], [XP + 4, y + 4, SP + Math.sqrt(R * R - y * y) + 22], "IronDark"));
    out.push(cylinderAt({ rBot: 0.8, rTop: 6, height: 24, segments: 4, bottom: [XP, y, ZB - 24] }, "IronDark"));
  }
  for (let z = ZB + 26; z < SP + R - 10; z += 56) {
    const half = z <= SP ? R : Math.sqrt(R * R - (z - SP) ** 2);
    out.push(boxBounds([XP - 3, -half, z], [XP + 3, half, z + 7], "IronDark"));
  }
  // the great doors, open against the passage walls
  for (const s of [-1, 1]) {
    const y0 = s < 0 ? -R + 1 : R - 9;
    out.push(boxBounds([30, y0, 6], [200, y0 + 8, 380], "DoorWood"));
    for (const z of [70, 210, 330]) out.push(boxBounds([34, s < 0 ? y0 + 8 : y0 - 2, z], [196, s < 0 ? y0 + 10 : y0, z + 10], "IronDark"));
  }
  // flanking towers with long banners, lanterns either side of the arch
  for (const s of [-1, 1]) {
    out.push(translate(roundTower(230, 1150, 620, [180, s * 90, 0], [180, s * 90, 0]), [0, s * 490, 0]));
    out.push(translate(bannerGeo(110, 420), [-240, s * 490, 1080]));
    out.push(onFace(wallLantern(), "-x", HX, s * 240, 330), onFace(wallLantern(), "+x", HX, s * 240, 330));
  }
  return merge(...out);
}

// ---- houses ----
// A three-storey townhouse, 8.4 m wide: stone ground floor with an arched door and a shop
// window under a striped awning, white plaster storeys with blue shutters, a balcony and
// flower boxes, a blue roof (ridge along Y) with dormers and two chimneys.
function townhouse(): Geo {
  const HX = 330, HY = 420, G = 340, F2 = 660, E = 980, RH = 330, P = 4, out: Geo[] = [];
  const on = (g: Geo, face: Face, u: number, z: number) => out.push(onFace(g, face, (face.endsWith("x") ? HX : HY) - (z >= G ? P : 0), u, z));
  out.push(wuv(merge(boxBounds([-HX - 8, -HY - 8, 0], [HX + 8, HY + 8, 40], "StoneGrey"), boxBounds([-HX, -HY, 40], [HX, HY, G], "StoneLight")), 1.1));
  out.push(
    boxBounds([-HX + P, -HY + P, G], [HX - P, HY - P, E], "Eden_Plaster"),
    boxBounds([-HX - 10, -HY - 10, G - 6], [HX + 10, HY + 10, G + 12], "StoneWhite", 3),
    boxBounds([-HX - 1, -HY - 1, F2 - 6], [HX + 1, HY + 1, F2 + 6], "StoneWhite", 2),
    boxBounds([-HX - 12, -HY - 12, E - 24], [HX + 12, HY + 12, E + 2], "StoneWhite", 3),
    quoins(HX - P, HY - P, G + 16, E - 24),
  );
  // front (-X)
  on(doorGeo(130, 250, { arch: true }), "-x", -230, 0);
  on(windowGeo(200, 190, { arch: true }), "-x", 140, 70);
  out.push(translate(awning(250, 120, 55, "FabricBlue", "FabricWhite"), [-HX, 140, 326]));
  on(wallLantern(), "-x", -350, 290);
  on(windowGeo(90, 160, { shutters: true, flowers: 0 }), "-x", -250, G + 56);
  on(windowGeo(90, 160, { shutters: true, flowers: 0 }), "-x", 250, G + 56);
  on(windowGeo(100, 220, { arch: true }), "-x", 0, G + 44);
  on(windowGeo(90, 150, { shutters: true }), "-x", -250, F2 + 44);
  on(windowGeo(90, 150, { shutters: true, flowers: 1 }), "-x", 0, F2 + 44);
  on(windowGeo(90, 150, { shutters: true }), "-x", 250, F2 + 44);
  // the balcony
  const rail: Geo[] = [
    boxBounds([-80, -112, -14], [0, 112, 0], "StoneWhite", 2),
    boxBounds([-82, -112, 82], [-74, 112, 88], "IronDark"),
    array(boxAt([3, 3, 82], [-78, -100, 0], "IronDark"), 11, [0, 20, 0]),
  ];
  for (const s of [-1, 1]) {
    rail.push(boxBounds([-80, s * 112 - 3, 82], [0, s * 112 + 3, 88], "IronDark"), array(boxAt([3, 3, 82], [-62, s * 109, 0], "IronDark"), 3, [20, 0, 0]));
    rail.push(boxBounds([-60, s * 80 - 9, -50], [0, s * 80 + 9, -14], "StoneLight", 1.5));
    rail.push(cylinderAt({ rBot: 10, rTop: 13, height: 20, segments: 8, bottom: [-62, s * 95, 0] }, "Eden_Terracotta"), translate(blooms(22, 2, 2, 7), [-62, s * 95, 16]));
  }
  out.push(translate(merge(...rail), [-HX + P, 0, G + 44]));
  // back (+X)
  on(doorGeo(110, 230), "+x", -220, 0);
  on(windowGeo(110, 150), "+x", 160, 90);
  for (const z of [G + 56, F2 + 44]) for (const u of [-200, 200]) on(windowGeo(90, 150, { shutters: true }), "+x", u, z);
  // the ends (+-Y)
  for (const f of ["-y", "+y"] as const) {
    on(windowGeo(90, 140), f, 0, 110);
    on(windowGeo(80, 150, { shutters: true }), f, 0, G + 56);
    on(windowGeo(80, 140, { shutters: true, flowers: 3 }), f, 0, F2 + 44);
    out.push(onFace(merge(panel(circleShape(46, 0, 0), -6, 8, "StoneWhite"), panel(circleShape(34, 0, 0), -8, 2, "GlassBlue"), boxBounds([-10, -34, -2], [-8, 34, 2], "Eden_PaintWhite"), boxBounds([-10, -2, -34], [-8, 2, 34], "Eden_PaintWhite")), f, HY - P, 0, E + 120));
  }
  // roof
  out.push(rotateZ(gableRoof([2 * HY, 2 * HX, 24], [0, 0, E], RH, 34, "RoofBlue"), 90));
  out.push(ridge([0, -HY - 34, E + RH + 30], [0, HY + 34, E + RH + 30]));
  out.push(wuv(merge(rotateZ(gableWall(HY - P, HX - P, E, RH - 6, "Eden_Plaster"), 90), rotateZ(gableWall(-(HY - P), HX - P, E, RH - 6, "Eden_Plaster"), 90))));
  for (const y of [-HY - 31, HY + 31]) for (const s of [-1, 1]) out.push(beamBetween([s * (HX + 34), y, E - 44], [0, y, E + RH - 8], 6, 20, "Eden_PaintWhite"));
  const dorm = dormer(-250, 0, 1060, 150, 190);
  out.push(dorm, rotateZ(dorm, 180));
  out.push(chimney(130, 330, 1050, 1470), chimney(-150, -300, 1050, 1440));
  return merge(...out);
}

// A narrow, tall house (4.6 m wide) with its stepped... gable to the street: a shop front with
// an awning and a hanging key sign, two plaster storeys, a hoist beam in the gable.
function townhouseNarrow(): Geo {
  const HX = 340, HY = 230, G = 330, F2 = 640, E = 950, RH = 420, P = 4, out: Geo[] = [];
  const on = (g: Geo, face: Face, u: number, z: number) => out.push(onFace(g, face, (face.endsWith("x") ? HX : HY) - (z >= G ? P : 0), u, z));
  out.push(wuv(merge(boxBounds([-HX - 8, -HY - 8, 0], [HX + 8, HY + 8, 40], "StoneGrey"), boxBounds([-HX, -HY, 40], [HX, HY, G], "StoneLight")), 1.1));
  out.push(
    boxBounds([-HX + P, -HY + P, G], [HX - P, HY - P, E], "Eden_Plaster"),
    boxBounds([-HX - 10, -HY - 10, G - 6], [HX + 10, HY + 10, G + 12], "StoneWhite", 3),
    boxBounds([-HX - 1, -HY - 1, F2 - 6], [HX + 1, HY + 1, F2 + 6], "StoneWhite", 2),
    boxBounds([-HX - 6, -HY - 12, E - 22], [HX + 6, HY + 12, E + 2], "StoneWhite", 3),
    quoins(HX - P, HY - P, G + 16, E - 22),
  );
  // front: shop window, door, awning, sign
  on(windowGeo(200, 180), "-x", -60, 60);
  on(doorGeo(96, 240, { arch: true }), "-x", 150, 0);
  out.push(translate(awning(224, 90, 34, "FabricRed", "FabricWhite"), [-HX, -60, 304]));
  const sign = merge(
    beamBetween([0, 0, 0], [-110, 0, 0], 5, 5, "IronDark"),
    beamBetween([0, 0, -40], [-60, 0, -2], 3, 3, "IronDark"),
    cylinderBetween([-30, 0, 0], [-30, 0, -14], 1, 4, "IronDark"),
    cylinderBetween([-96, 0, 0], [-96, 0, -14], 1, 4, "IronDark"),
    boxBounds([-108, -3, -76], [-18, 3, -14], "WoodDark", 1.5),
    boxBounds([-104, -4, -72], [-22, 4, -18], "Eden_PaintBlue"),
  );
  const key = merge(torus(9, 2.5, 10, 4, "GoldTrim"), boxBounds([-1.5, 8, -2.5], [1.5, 40, 2.5], "GoldTrim"), boxBounds([-1.5, 28, -10], [1.5, 34, -2], "GoldTrim"), boxBounds([-1.5, 36, -10], [1.5, 40, -2], "GoldTrim"));
  const keyOn = translate(rotateZ(rotateX(key, 90), 90), [-63, 0, -45]);
  out.push(onFace(merge(sign, translate(keyOn, [0, -5, 0]), translate(keyOn, [0, 5, 0])), "-x", HX, 205, 300));
  // upper floors and the gable
  on(windowGeo(80, 160, { shutters: true, flowers: 2 }), "-x", -110, G + 50);
  on(windowGeo(80, 160, { shutters: true, flowers: 2 }), "-x", 110, G + 50);
  on(windowGeo(80, 150, { arch: true, flowers: 4 }), "-x", -110, F2 + 44);
  on(windowGeo(80, 150, { arch: true, flowers: 4 }), "-x", 110, F2 + 44);
  const oculus = merge(panel(circleShape(48), -6, 8, "StoneWhite"), panel(circleShape(36), -8, 2, "GlassBlue"), boxBounds([-10, -36, -2], [-8, 36, 2], "Eden_PaintWhite"), boxBounds([-10, -2, -36], [-8, 2, 36], "Eden_PaintWhite"));
  out.push(onFace(oculus, "-x", HX - P, 0, E + 130), onFace(oculus, "+x", HX - P, 0, E + 130));
  out.push(
    boxBounds([-HX - 70, -9, E + 270], [-HX + 10, 9, E + 288], "WoodDark", 1.5),
    translate(rotateX(torus(8, 2, 10, 4, "IronDark"), 90), [-HX - 56, 0, E + 260]),
    cylinderBetween([-HX - 56, 0, E + 252], [-HX - 56, 0, E + 120], 1.2, 4, "RopeTan"),
    boxBounds([-HX - 60, -4, E + 112], [-HX - 52, 4, E + 122], "IronDark"),
  );
  // back
  on(doorGeo(100, 230), "+x", 120, 0);
  on(windowGeo(90, 140), "+x", -90, 100);
  for (const z of [G + 50, F2 + 44]) for (const u of [-110, 110]) on(windowGeo(80, 150, { shutters: true }), "+x", u, z);
  // sides
  for (const f of ["-y", "+y"] as const) {
    on(windowGeo(70, 130), f, -120, 120);
    on(windowGeo(70, 140, { shutters: true }), f, 120, G + 56);
    on(windowGeo(70, 140, { flowers: 1 }), f, -120, F2 + 50);
  }
  // roof (ridge along X, the gable to the street)
  out.push(gableRoof([2 * HX, 2 * HY, 22], [0, 0, E], RH, 30, "RoofBlue"));
  out.push(ridge([-HX - 30, 0, E + RH + 40], [HX + 30, 0, E + RH + 40]));
  out.push(wuv(merge(gableWall(-(HX - P), HY - P, E, RH - 8, "Eden_Plaster"), gableWall(HX - P, HY - P, E, RH - 8, "Eden_Plaster"))));
  for (const x of [-HX - 27, HX + 27]) for (const s of [-1, 1]) out.push(beamBetween([x, s * (HY + 30), E - 70], [x, 0, E + RH - 6], 6, 24, "Eden_PaintWhite"));
  out.push(chimney(120, 150, 1000, 1440));
  return merge(...out);
}

// The inn by the harbour: a broad two-storey house with a gabled front bay, a porch over the
// double door, a hanging sign with a golden tankard, barrels and lanterns, a big end chimney.
function inn(): Geo {
  const HX = 420, HY = 500, G = 340, E = 700, RH = 380, P = 4, BX = HX + 60, BY = 200, out: Geo[] = [];
  const on = (g: Geo, face: Face, u: number, z: number) => out.push(onFace(g, face, (face.endsWith("x") ? HX : HY) - (z >= G ? P : 0), u, z));
  out.push(wuv(merge(
    boxBounds([-HX - 8, -HY - 8, 0], [HX + 8, HY + 8, 40], "StoneGrey"),
    boxBounds([-HX, -HY, 40], [HX, HY, G], "StoneLight"),
    boxBounds([-BX - 8, -BY - 8, 0], [-HX, BY + 8, 40], "StoneGrey"),
    boxBounds([-BX, -BY, 40], [-HX + 10, BY, G], "StoneLight"),
  ), 1.1));
  out.push(
    boxBounds([-HX + P, -HY + P, G], [HX - P, HY - P, E], "Eden_Plaster"),
    boxBounds([-BX + P, -BY + P, G], [-HX + 10, BY - P, E], "Eden_Plaster"),
    boxBounds([-HX - 10, -HY - 10, G - 6], [HX + 10, HY + 10, G + 12], "StoneWhite", 3),
    boxBounds([-BX - 10, -BY - 10, G - 6], [-HX, BY + 10, G + 12], "StoneWhite", 3),
    boxBounds([-HX - 12, -HY - 12, E - 24], [HX + 12, HY + 12, E + 2], "StoneWhite", 3),
    boxBounds([-BX - 12, -BY - 12, E - 24], [-HX, BY + 12, E + 2], "StoneWhite", 3),
    quoins(HX - P, HY - P, G + 16, E - 24),
    quoins(BX - P, BY - P, G + 16, E - 24, [[-1, -1], [-1, 1]]),
  );
  // the bay: double door under a porch, a window and a round window in its gable
  out.push(onFace(doorGeo(150, 260, { arch: true, double: true }), "-x", BX, 0, 0));
  out.push(onFace(windowGeo(120, 170, { arch: true, flowers: 0 }), "-x", BX - P, 0, G + 60));
  out.push(onFace(merge(panel(circleShape(40), -6, 8, "StoneWhite"), panel(circleShape(30), -8, 2, "GlassBlue"), boxBounds([-10, -30, -2], [-8, 30, 2], "Eden_PaintWhite")), "-x", BX - P, 0, E + 90));
  for (const s of [-1, 1]) {
    out.push(onFace(wallLantern(), "-x", BX, s * 150, 250));
    out.push(boxBounds([-BX - 157, s * 105 - 7, 0], [-BX - 143, s * 105 + 7, 300], "WoodDark", 1.5));
    out.push(boxBounds([-BX - 157, s * 105 - 7, 286], [-BX, s * 105 + 7, 300], "WoodDark", 1.5));
    out.push(beamBetween([-BX - 150, s * 105, 240], [-BX - 100, s * 105, 292], 6, 6, "WoodDark"));
    out.push(translate(barrel(), [-BX - 48, s * 172, 0]));
  }
  out.push(boxBounds([-BX - 160, -114, 292], [-BX - 140, 114, 306], "WoodDark", 1.5));
  out.push(gableRoof([150, 236, 8], [-BX - 77, 0, 304], 64, 12, "RoofBlue"));
  out.push(gableWall(-BX - 150, 118, 304, 60, "WoodPale"));
  out.push(translate(barrel(), [-BX - 30, 240, 0]));
  // main front windows
  for (const s of [-1, 1]) {
    on(windowGeo(130, 160, { arch: true, flowers: 1 }), "-x", s * 350, 90);
    on(windowGeo(90, 150, { shutters: true }), "-x", s * 350, G + 60);
  }
  // the hanging sign: a gold tankard on a blue board
  const tankard = merge(
    cylinderAt({ rBot: 13, rTop: 12, height: 30, segments: 10, bottom: [0, 0, 0] }, "GoldTrim"),
    translate(rotateX(torus(9, 2.5, 10, 4, "GoldTrim"), 90), [0, 14, 15]),
    sphereCenter(12, [0, 0, 32], "Eden_FlowerWhite", 8),
  );
  const sign = merge(
    beamBetween([0, 0, 0], [-140, 0, 0], 6, 6, "IronDark"),
    beamBetween([0, 0, -50], [-80, 0, -2], 3.5, 3.5, "IronDark"),
    sphereCenter(5, [-142, 0, 0], "GoldTrim", 6),
    cylinderBetween([-40, 0, 0], [-40, 0, -16], 1.2, 4, "IronDark"),
    cylinderBetween([-122, 0, 0], [-122, 0, -16], 1.2, 4, "IronDark"),
    boxBounds([-134, -3.5, -110], [-28, 3.5, -16], "WoodDark", 1.5),
    boxBounds([-130, -4.5, -106], [-32, 4.5, -20], "Eden_PaintBlue"),
    translate(tankard, [-81, -5, -82]),
    translate(rotateZ(tankard, 180), [-81, 5, -82]),
  );
  on(sign, "-x", -470, G + 70);
  // ends: windows, and a great chimney on the +Y end
  for (const s of [-1, 1]) {
    on(windowGeo(90, 140), "-y", s * 170, 100);
    on(windowGeo(90, 150, { shutters: true }), "-y", s * 170, G + 60);
    on(windowGeo(80, 140), "+y", s * 270, 100);
    on(windowGeo(80, 150, { shutters: true, flowers: 3 }), "+y", s * 270, G + 60);
  }
  out.push(wuv(merge(boxBounds([-90, HY - 10, 0], [90, HY + 70, E - 60], "StoneLight"), boxBounds([-58, HY, E - 60], [58, HY + 62, 1210], "StoneLight")), 1.1));
  out.push(
    boxBounds([-96, HY - 10, E - 66], [96, HY + 76, E - 54], "StoneGrey", 2),
    boxBounds([-66, HY - 8, 1210], [66, HY + 70, 1226], "StoneGrey", 2),
    cylinderAt({ radius: 12, height: 26, segments: 8, bottom: [-24, HY + 30, 1226] }, "Eden_Terracotta"),
    cylinderAt({ radius: 12, height: 22, segments: 8, bottom: [24, HY + 30, 1226] }, "Eden_Terracotta"),
    onFace(merge(panel(circleShape(36), -6, 8, "StoneWhite"), panel(circleShape(26), -8, 2, "GlassBlue")), "-y", HY - P, 0, E + 120),
  );
  // back
  on(doorGeo(110, 230), "+x", -300, 0);
  for (const u of [0, 300]) on(windowGeo(110, 150), "+x", u, 90);
  for (const u of [-300, 0, 300]) on(windowGeo(90, 150, { shutters: true }), "+x", u, G + 60);
  // roofs: the main one (ridge along Y) and the bay's gable (ridge along X)
  out.push(rotateZ(gableRoof([2 * HY, 2 * HX, 24], [0, 0, E], RH, 40, "RoofBlue"), 90));
  out.push(ridge([0, -HY - 40, E + RH + 28], [0, HY + 40, E + RH + 28]));
  out.push(wuv(merge(rotateZ(gableWall(HY - P, HX - P, E, RH - 6, "Eden_Plaster"), 90), rotateZ(gableWall(-(HY - P), HX - P, E, RH - 6, "Eden_Plaster"), 90))));
  out.push(gableRoof([BX - 100, 2 * BY, 22], [-(BX + 100) / 2, 0, E], 240, 30, "RoofBlue"));
  out.push(ridge([-BX - 30, 0, E + 270], [-110, 0, E + 270], 11));
  out.push(gableWall(-(BX - P), BY - P, E, 232, "Eden_Plaster"));
  for (const s of [-1, 1]) out.push(beamBetween([-BX - 26, s * (BY + 30), E - 40], [-BX - 26, 0, E + 236], 6, 22, "Eden_PaintWhite"));
  for (const s of [-1, 1]) {
    out.push(dormer(-340, s * 370, 780, 150, 220));
    out.push(rotateZ(dormer(-340, s * 250, 780, 150, 220), 180));
  }
  return merge(...out);
}

// ---- the cathedral ----
// The great cathedral of Eden, 23 x 13 m: a two-towered west front (to -X) with octagonal blue
// spires, a deep Gothic portal and a rose window; a nave of five bays with lancets, buttresses
// and pinnacles; a round apse to the east and a slender spire over the crossing.
function portal(): Geo {
  const hw = 110, sp = 300, BW = hw + 72, BT = Math.round(sp + 0.866 * 2 * (hw + 44) + 40), out: Geo[] = [];
  out.push(wuv(boxBounds([-60, -BW, 0], [2, BW, BT], "StoneWhite"), 1.3));
  out.push(boxBounds([-66, -BW - 4, BT - 10], [2, BW + 4, BT + 6], "StoneLight", 2));
  out.push(gableRoof([70, 2 * BW, 14], [-30, 0, BT + 6], 80, 8, "StoneLight"));
  out.push(wuv(gableWall(-60, BW, BT + 6, 76, "StoneWhite"), 1.3));
  out.push(boxBounds([-48, -6, BT + 80], [-36, 6, BT + 150], "GoldTrim"), boxBounds([-48, -26, BT + 118], [-36, 26, BT + 130], "GoldTrim"));
  const orders: [number, number, string][] = [[hw + 44, -64, "StoneLight"], [hw + 30, -68, "StoneWhite"], [hw + 16, -72, "StoneLight"]];
  for (const [w, x0, m] of orders) out.push(panel(archShape(w, sp, true), x0, 4, m));
  out.push(panel(archShape(hw, sp, true, sp - 4), -74, 2, "StoneGrey"));
  out.push(translate(crest(34), [-74, 0, sp + 82]));
  out.push(boxBounds([-80, -hw - 6, sp - 12], [-72, hw + 6, sp + 2], "StoneLight"));
  out.push(panel(rectShape(hw, sp - 12), -76, 4, "DoorWood", { vertical: true }));
  out.push(boxBounds([-78, -1.5, 0], [-76, 1.5, sp - 12], "WoodDark"));
  for (const z of [40, 140, 230]) out.push(boxBounds([-79, -hw + 6, z], [-76, -6, z + 9], "IronDark"), boxBounds([-79, 6, z], [-76, hw - 6, z + 9], "IronDark"));
  out.push(sphereCenter(5, [-80, -14, 130], "GoldTrim", 6), sphereCenter(5, [-80, 14, 130], "GoldTrim", 6));
  for (const s of [-1, 1]) out.push(onFace(wallLantern(), "-x", 0, s * (BW + 44), 330));
  return merge(...out);
}

function rose(R: number): Geo {
  const out: Geo[] = [
    panel(circleShape(R + 24), -10, 12, "StoneLight", { seg: 10 }),
    panel(circleShape(R), -12, 2, "Eden_GlassBlue", { seg: 10 }),
    panel(circleShape(R * 0.26), -13, 1, "Eden_GlassGold", { seg: 8 }),
    sphereCenter(R * 0.1, [-14, 0, 0], "StoneWhite", 8),
  ];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    out.push(panel(circleShape(R * 0.21, Math.cos(a) * R * 0.62, Math.sin(a) * R * 0.62), -13, 1, i % 2 ? "Eden_GlassRed" : "Eden_GlassGold"));
    out.push(rotateX(boxBounds([-16, -3, R * 0.26], [-12, 3, R], "StoneWhite"), i * 45 + 22.5));
  }
  return merge(...out);
}

function cathedral(): Geo {
  const S = 1.3, NY = 450, X0 = -700, X1 = 700, W = 1000, RH = 520, out: Geo[] = [];
  // nave
  out.push(wuv(merge(
    boxBounds([X0, -NY - 12, 0], [X1, NY + 12, 70], "StoneGrey"),
    boxBounds([X0, -NY, 70], [X1, NY, W], "StoneWhite"),
    gableWall(X1, NY, W, RH - 4, "StoneWhite"),
  ), S));
  out.push(
    boxBounds([X0, -NY - 10, 330], [X1, NY + 10, 346], "StoneLight"),
    boxBounds([X0, -NY - 18, W - 26], [X1 + 6, NY + 18, W + 2], "StoneLight", 3),
    gableRoof([X1 - X0, 2 * NY, 26], [0, 0, W], RH, 40, "RoofBlue"),
    ridge([X0, 0, W + RH + 34], [X1 + 40, 0, W + RH + 34], 14),
  );
  // the side bays (+Y), then the same turned half round for -Y
  const side: Geo[] = [];
  for (const x of [-560, -280, 0, 280, 560]) {
    side.push(wuv(merge(boxBounds([x - 34, NY, 0], [x + 34, NY + 160, 600], "StoneWhite"), boxBounds([x - 28, NY, 600], [x + 28, NY + 84, 880], "StoneWhite")), S));
    side.push(boxBounds([x - 42, NY, 0], [x + 42, NY + 172, 70], "StoneGrey", 2));
    side.push(translate(rotateX(box([64, 98, 14], [0, 0, 0], "StoneLight", 2), -30), [x, NY + 40, 892]));
    side.push(boxBounds([x - 38, NY + 84, 594], [x + 38, NY + 166, 606], "StoneLight", 2));
    side.push(boxBounds([x - 20, NY + 105, 606], [x + 20, NY + 145, 690], "StoneLight", 1.5));
    side.push(translate(rotateZ(cylinderAt({ rBot: 32, rTop: 1, height: 120, segments: 4, bottom: [0, 0, 690] }, "StoneWhite"), 45), [x, NY + 125, 0]));
    side.push(sphereCenter(6, [x, NY + 125, 812], "GoldTrim", 6));
  }
  for (const x of [-420, -140, 140, 420]) side.push(onFace(lancet(120, 400), "+y", NY, x, 400));
  const sides = merge(...side);
  out.push(sides, rotateZ(sides, 180));
  // apse
  const AR = 400, apse: Geo[] = [
    ring(AR + 12, 70, 0, "StoneGrey", 12),
    ring(AR, 830, 70, "StoneWhite", 12),
    ring(AR + 10, 16, 330, "StoneLight", 12),
    ring(AR + 18, 24, 880, "StoneLight", 12),
    ring(AR + 46, 400, 904, "RoofBlue", 12, 4),
    sphereCenter(12, [0, 0, 1306], "GoldTrim", 8),
  ];
  for (const a of [-60, 0, 60]) apse.push(onRound(lancet(100, 330), AR * Math.cos(15 * D), a, 400));
  for (const a of [-30, 30]) {
    const b = merge(
      boxBounds([AR - 20, -30, 0], [AR + 140, 30, 580], "StoneWhite"),
      boxBounds([AR - 20, -26, 580], [AR + 72, 26, 860], "StoneWhite"),
      boxBounds([AR + 66, -36, 574], [AR + 146, 36, 586], "StoneLight", 2),
      translate(rotateY(box([96, 58, 14], [0, 0, 0], "StoneLight", 2), 30), [AR + 30, 0, 870]),
      boxBounds([AR + 90, -18, 586], [AR + 126, 18, 660], "StoneLight", 1.5),
      translate(rotateZ(cylinderAt({ rBot: 30, rTop: 1, height: 110, segments: 4, bottom: [0, 0, 660] }, "StoneWhite"), 45), [AR + 108, 0, 0]),
    );
    apse.push(rotateZ(b, a));
  }
  out.push(translate(merge(...apse), [X1, 0, 0]));
  // the crossing spire
  const fl: Geo[] = [
    wuv(boxBounds([-62, -62, 1380], [62, 62, 1660], "StoneWhite"), S),
    boxBounds([-70, -70, 1650], [70, 70, 1672], "StoneLight", 2),
    ring(96, 560, 1672, "RoofBlue", 8, 3),
    sphereCenter(9, [0, 0, 2232], "GoldTrim", 8),
    boxBounds([-4, -4, 2236], [4, 4, 2320], "GoldTrim"),
    boxBounds([-4, -22, 2290], [4, 22, 2298], "GoldTrim"),
  ];
  for (const f of ["-x", "+x", "-y", "+y"] as const) fl.push(onFace(lancet(36, 120, "Eden_Dark"), f, 62, 0, 1480));
  out.push(translate(merge(...fl), [300, 0, 0]));
  // the west front between the towers
  const FX = -1000, FY = 310, FT = 1180, GH = 520;
  out.push(wuv(merge(
    boxBounds([FX, -FY, 0], [X0 + 10, FY, FT], "StoneWhite"),
    gableWall(FX, FY, FT, GH, "StoneWhite"),
    gableWall(X0 + 10, FY, FT, GH, "StoneWhite"),
  ), S));
  out.push(
    boxBounds([FX - 12, -FY, FT - 22], [X0 + 10, FY, FT + 4], "StoneLight", 2),
    gableRoof([X0 + 10 - FX, 2 * FY, 22], [(FX + X0 + 10) / 2, 0, FT + 4], GH - 4, 12, "StoneLight"),
    boxBounds([FX - 6, -FY, 640], [FX, FY, 656], "StoneLight"),
    translate(rose(170), [FX, 0, 960]),
    translate(portal(), [FX, 0, 54]),
    boxBounds([FX + 12, -7, FT + GH - 10], [FX + 30, 7, FT + GH + 130], "GoldTrim"),
    boxBounds([FX + 12, -40, FT + GH + 70], [FX + 30, 40, FT + GH + 84], "GoldTrim"),
  );
  for (const y of [-150, -75, 0, 75, 150]) {
    const niche = merge(
      panel(archShape(30, 90, false, -6), -6, 6, "StoneLight"),
      panel(archShape(22, 90), -7, 1, "Eden_Dark"),
      cylinderAt({ rBot: 12, rTop: 8, height: 72, segments: 8, bottom: [-16, 0, 4] }, "MarbleWhite"),
      sphereCenter(8, [-16, 0, 84], "MarbleWhite", 8),
      boxBounds([-26, -16, -4], [0, 16, 4], "StoneLight"),
    );
    out.push(translate(niche, [FX, y, FT + 30]));
  }
  for (let i = 0; i < 3; i++) out.push(boxBounds([-1170 + i * 35, -330, i * 18], [FX, 330, (i + 1) * 18], "StoneLight", 2));
  // the two towers
  for (const cy of [-480, 480]) {
    const x0 = -1030, x1 = -690, y0 = cy - 170, y1 = cy + 170, cx = -860, T = 1700, tw: Geo[] = [];
    const corners: [number, number][] = [[x0, y0], [x0, y1], [x1, y0], [x1, y1]];
    tw.push(wuv(merge(boxBounds([x0, y0, 0], [x1, y1, T], "StoneWhite"), ...corners.map(([x, y]) => boxBounds([x - 24, y - 24, 0], [x + 24, y + 24, 1100], "StoneWhite"))), S));
    tw.push(boxBounds([x0 - 34, y0 - 34, 0], [x1 + 34, y1 + 34, 80], "StoneGrey", 3));
    for (const z of [620, 1100, 1360]) tw.push(boxBounds([x0 - 10, y0 - 10, z], [x1 + 10, y1 + 10, z + 16], "StoneLight", 2));
    for (const [x, y] of corners) tw.push(translate(rotateZ(cylinderAt({ rBot: 40, rTop: 6, height: 70, segments: 4, bottom: [0, 0, 1100] }, "StoneLight"), 45), [x, y, 0]));
    tw.push(boxBounds([x0 - 18, y0 - 18, T - 14], [x1 + 18, y1 + 18, T + 22], "StoneLight", 3));
    const local: Geo[] = [];
    const outer = cy > 0 ? "+y" : "-y";
    for (const f of ["-x", "+x", "-y", "+y"] as const) for (const u of [-60, 60]) local.push(onFace(lancet(56, 150, "Eden_Dark"), f, 170, u, 1400));
    for (const f of ["-x", outer] as const) local.push(onFace(lancet(70, 240), f, 170, 0, 700));
    local.push(onFace(merge(
      panel(circleShape(70), -6, 8, "StoneLight", { seg: 8 }),
      panel(circleShape(60), -8, 2, "Eden_PaintWhite", { seg: 8 }),
      panel(circleShape(64), -7, 1, "GoldTrim", { seg: 8 }),
      boxBounds([-11, -3, -4], [-8, 3, 46], "Eden_Dark"),
      rotateX(boxBounds([-11, -3, -4], [-8, 3, 34], "Eden_Dark"), 120),
      ...Array.from({ length: 12 }, (_, i) => rotateX(boxBounds([-10, -3, 48], [-8, 3, 56], "GoldTrim"), i * 30)),
    ), "-x", 170, 0, 1230));
    for (const [x, y] of [[-170, -170], [-170, 170], [170, -170], [170, 170]]) {
      local.push(boxBounds([x - 20, y - 20, T + 22], [x + 20, y + 20, T + 110], "StoneWhite", 1.5));
      local.push(translate(rotateZ(cylinderAt({ rBot: 32, rTop: 1, height: 110, segments: 4, bottom: [0, 0, T + 110] }, "StoneWhite"), 45), [x, y, 0]));
      local.push(sphereCenter(6, [x, y, T + 222], "GoldTrim", 6));
    }
    local.push(ring(160, 26, T + 22, "StoneLight", 8), ring(150, 680, T + 48, "RoofBlue", 8, 3));
    const luc = merge(
      boxBounds([-150, -26, T + 60], [-92, 26, T + 140], "StoneWhite"),
      gableRoof([66, 60, 6], [-122, 0, T + 140], 34, 5, "RoofBlue"),
      gableWall(-150, 26, T + 140, 32, "StoneWhite"),
      panel(archShape(13, T + 112, false, T + 72), -152, 2, "Eden_Dark"),
    );
    for (const a of [0, 90, 180, 270]) local.push(rotateZ(luc, a));
    local.push(sphereCenter(12, [0, 0, T + 730], "GoldTrim", 8), boxBounds([-5, -5, T + 736], [5, 5, T + 840], "GoldTrim"), boxBounds([-5, -28, T + 800], [5, 28, T + 810], "GoldTrim"));
    tw.push(translate(merge(...local), [cx, cy, 0]));
    out.push(merge(...tw));
  }
  return merge(...out);
}

// ---- the plaza ----
// The tiered fountain at the heart of the city: an octagonal marble basin on two steps, two
// bowls spilling into each other and a maiden pouring water from an urn on top.
function fountain(): Geo {
  const out: Geo[] = [
    ring(340, 14, 0, "StoneGrey", 8),
    ring(314, 14, 14, "StoneLight", 8),
    ring(290, 50, 28, "MarbleWhite", 8),
    ring(296, 6, 66, "StoneLight", 8),
    ring(268, 2, 82, "Eden_Water", 8),
    ring(62, 14, 84, "StoneLight", 8),
    ring(50, 96, 84, "MarbleWhite", 8),
    cylinderAt({ rBot: 46, rTop: 150, height: 46, segments: 16, bottom: [0, 0, 176] }, "MarbleWhite"),
    translate(torus(150, 7, 24, 6, "MarbleWhite"), [0, 0, 222]),
    cylinderAt({ radius: 146, height: 2, segments: 16, bottom: [0, 0, 222] }, "Eden_Water"),
    ring(26, 90, 222, "MarbleWhite", 8),
    translate(torus(28, 5, 12, 5, "StoneLight"), [0, 0, 262]),
    cylinderAt({ rBot: 22, rTop: 82, height: 30, segments: 16, bottom: [0, 0, 308] }, "MarbleWhite"),
    translate(torus(82, 5, 20, 5, "MarbleWhite"), [0, 0, 338]),
    cylinderAt({ radius: 78, height: 2, segments: 16, bottom: [0, 0, 338] }, "Eden_Water"),
    ring(20, 14, 338, "MarbleWhite", 8),
    translate(torus(206, 7, 24, 5, "Eden_Spray"), [0, 0, 85]),
    translate(torus(124, 5, 20, 5, "Eden_Spray"), [0, 0, 225]),
  ];
  const rx = 290 * Math.cos(22.5 * D), ry = 290 * Math.sin(22.5 * D);
  for (let k = 0; k < 8; k++) out.push(rotateZ(boxBounds([rx - 30, -ry - 6, 78], [rx + 6, ry + 6, 94], "StoneLight", 2), k * 45));
  for (let k = 0; k < 8; k++) {
    const a = (k * 45 + 22.5) * D;
    out.push(cylinderBetween([86 * Math.cos(a), 86 * Math.sin(a), 336], [124 * Math.cos(a), 124 * Math.sin(a), 224], 3, 5, "Eden_Spray", 6));
  }
  for (let k = 0; k < 12; k++) {
    const a = k * 30 * D;
    out.push(cylinderBetween([156 * Math.cos(a), 156 * Math.sin(a), 220], [206 * Math.cos(a), 206 * Math.sin(a), 84], 4, 5, "Eden_Spray", 8));
  }
  // the maiden with her urn
  const Z = 352, M = "MarbleWhite";
  const urn = translate(rotateY(merge(sphereCenter(12, [0, 0, 0], M, 8), cylinderAt({ rBot: 6, rTop: 8, height: 12, segments: 8, bottom: [0, 0, 8] }, M)), -70), [-14, -10, Z + 100]);
  out.push(
    cylinderAt({ rBot: 24, rTop: 13, height: 72, segments: 10, bottom: [0, 0, Z] }, M),
    cylinderAt({ rBot: 13, rTop: 11, height: 26, segments: 10, bottom: [0, 0, Z + 72] }, M),
    sphereCenter(10, [-1, 0, Z + 108], M, 10),
    sphereCenter(7, [6, 0, Z + 112], M, 8),
    cylinderBetween([0, -12, Z + 94], [-8, -18, Z + 104], 4, 6, M),
    cylinderBetween([0, 12, Z + 94], [-12, 0, Z + 108], 4, 6, M),
    urn,
    cylinderBetween([-32, -10, Z + 96], [-56, -14, 340], 3.5, 6, "Eden_Spray", 6),
  );
  return merge(...out);
}

// A hero of the kingdom in verdigris bronze, sword raised to the sky, on a tall plinth.
function heroStatue(): Geo {
  const Z = 262, M = "CopperGreen";
  return merge(
    boxAt([310, 310, 24], [0, 0, 0], "StoneGrey", 4),
    boxAt([260, 260, 28], [0, 0, 24], "StoneLight", 3),
    wuv(boxAt([200, 200, 168], [0, 0, 52], "StoneWhite", 2)),
    boxAt([228, 228, 22], [0, 0, 220], "StoneLight", 3),
    boxAt([190, 190, 20], [0, 0, 242], "StoneWhite", 2),
    boxBounds([-104, -56, 106], [-100, 56, 172], "GoldTrim", 1),
    ...[150, 136, 122].map((z) => boxBounds([-105, -40, z], [-104, 40, z + 4], "Eden_Dark")),
    translate(rotateY(torus(20, 3.5, 14, 6, "GoldTrim"), 90), [-104, 0, 194]),
    // the figure
    boxBounds([-32, 6, Z], [12, 34, Z + 18], M, 3),
    boxBounds([-8, -34, Z], [26, -8, Z + 18], M, 3),
    cylinderBetween([-12, 20, Z + 14], [-4, 18, Z + 92], 12, 8, M, 14),
    cylinderBetween([10, -21, Z + 14], [2, -17, Z + 92], 12, 8, M, 14),
    cylinderAt({ rBot: 46, rTop: 30, height: 52, segments: 10, bottom: [0, 0, Z + 78] }, M),
    scale(cylinderAt({ rBot: 27, rTop: 35, height: 76, segments: 10, bottom: [0, 0, Z + 122] }, M), [0.72, 1, 1], [0, 0, 0]),
    cylinderAt({ radius: 31, height: 9, segments: 10, bottom: [0, 0, Z + 124] }, "GoldTrim"),
    sphereCenter(19, [0, -38, Z + 190], M, 10),
    sphereCenter(19, [0, 38, Z + 190], M, 10),
    cylinderAt({ radius: 10, height: 14, segments: 8, bottom: [0, 0, Z + 194] }, M),
    sphereCenter(21, [-2, 0, Z + 222], M, 10),
    cylinderAt({ rBot: 23, rTop: 20, height: 16, segments: 10, bottom: [0, 0, Z + 226] }, M),
    beamBetween([-18, 0, Z + 250], [24, 0, Z + 246], 6, 18, "GoldTrim"),
    hullGeo([[16, -34, Z + 202], [16, 34, Z + 202], [24, -34, Z + 202], [24, 34, Z + 202], [38, -58, Z + 28], [38, 58, Z + 28], [48, -58, Z + 28], [48, 58, Z + 28]], M),
    cylinderBetween([0, -40, Z + 190], [-8, -54, Z + 232], 9, 8, M),
    cylinderBetween([-8, -54, Z + 232], [-8, -44, Z + 276], 8, 8, M),
    sphereCenter(10, [-8, -44, Z + 280], M, 8),
    sphereCenter(6, [-8, -44, Z + 266], "GoldTrim", 6),
    boxBounds([-12, -66, Z + 286], [-4, -22, Z + 294], "GoldTrim", 1),
    boxBounds([-11, -50, Z + 294], [-5, -38, Z + 420], "IronLight", 1),
    translate(rotateZ(cylinderAt({ rBot: 8, rTop: 0.5, height: 24, segments: 4, bottom: [0, 0, Z + 420] }, "IronLight"), 45), [-8, -44, 0]),
    cylinderBetween([0, 40, Z + 190], [-14, 50, Z + 152], 9, 8, M),
    cylinderBetween([-14, 50, Z + 152], [-30, 40, Z + 140], 8, 8, M),
    translate(rotateY(cylinderAt({ radius: 42, height: 6, segments: 14, bottom: [0, 0, 0] }, M), 90), [-48, 40, Z + 140]),
    translate(rotateY(torus(42, 3.5, 16, 5, "GoldTrim"), 90), [-48, 40, Z + 140]),
    sphereCenter(10, [-49, 40, Z + 140], "GoldTrim", 8),
  );
}

// A market stall: counter at the front (-X), table behind, a striped awning sloping forward.
function stall(a: string, b: string, goods: Geo): Geo {
  const out: Geo[] = [
    boxBounds([-92, -125, 0], [-30, 125, 88], "WoodWarm", 2),
    boxBounds([-100, -132, 88], [-24, 132, 96], "WoodPale", 1.5),
    boxBounds([-95, -112, 22], [-92, 112, 84], a),
    boxBounds([40, -120, 0], [90, 120, 70], "WoodShade", 2),
    boxBounds([36, -124, 70], [94, 124, 76], "WoodPale", 1.5),
    translate(awning(272, 232, 54, a, b, false), [104, 0, 272]),
    goods,
  ];
  for (const y of [-128, 128]) {
    out.push(boxBounds([-104, y - 5, 0], [-94, y + 5, 226], "WoodDark", 1), boxBounds([94, y - 5, 0], [104, y + 5, 270], "WoodDark", 1));
    out.push(beamBetween([-99, y, 200], [99, y, 246], 5, 6, "WoodDark"));
  }
  return merge(...out);
}
function clothStall(): Geo {
  const cols = ["FabricRed", "FabricBlue", "FabricGold", "FabricPurple", "FabricGreen", "FabricWhite"];
  const out: Geo[] = [];
  cols.forEach((m, i) => out.push(cylinderBetween([-92, -100 + i * 40, 108], [-34, -100 + i * 40, 108], 12, 8, m)));
  for (let i = 0; i < 5; i++) out.push(cylinderBetween([-86, -80 + i * 40, 123], [-40, -80 + i * 40, 123], 11, 8, cols[(i + 3) % 6]));
  for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) out.push(boxBounds([44, -110 + i * 56, 76 + k * 8], [86, -62 + i * 56, 84 + k * 8], cols[(i * 2 + k) % 6], 1));
  out.push(cylinderBetween([99, -128, 240], [99, 128, 240], 2, 6, "WoodDark"));
  for (let i = 0; i < 4; i++) out.push(boxBounds([96, -105 + i * 56, 120], [99, -63 + i * 56, 238], cols[(i + 1) % 6]));
  return stall("FabricBlue", "FabricWhite", merge(...out));
}
function fruitStall(): Geo {
  const out: Geo[] = [];
  const heap = (x: number, y: number, z: number, fruit: string, r: number): Geo => {
    const g: Geo[] = [];
    for (let k = 0; k < 6; k++) g.push(sphereCenter(r, [x + Math.cos(k * 60 * D) * 12, y + Math.sin(k * 60 * D) * 12, z + r * 0.6], fruit, 5));
    g.push(sphereCenter(r, [x, y, z + r * 1.1], fruit, 5));
    return merge(...g);
  };
  const fruits = ["Eden_Apple", "Eden_Orange", "Eden_Lemon", "Eden_Pear"];
  fruits.forEach((f, i) => {
    const y = -96 + i * 64;
    out.push(cylinderAt({ rBot: 20, rTop: 27, height: 16, segments: 8, bottom: [-62, y, 96] }, "BambooDry"));
    out.push(heap(-62, y, 106, f, 7.5));
  });
  for (let i = 0; i < 3; i++) {
    const y = -78 + i * 78, f = fruits[(i + 2) % 4];
    out.push(boxBounds([46, y - 32, 76], [88, y + 32, 98], "WoodWarm", 1.5));
    for (let a = 0; a < 2; a++) for (let c = 0; c < 3; c++) out.push(sphereCenter(9, [57 + a * 20, y - 20 + c * 20, 99], f, 5));
  }
  for (const [y, s] of [[-150, 1], [152, 0.85]] as const) out.push(scale(sphereCenter(28, [-40, y, 28], "FabricSand", 7), [1, s, 1.1], [-40, y, 0]), cylinderAt({ rBot: 8, rTop: 6, height: 12, segments: 6, bottom: [-40, y, 56] }, "FabricSand"));
  out.push(scale(sphereCenter(22, [-120, -150, 22], "Eden_Orange", 8), [1, 1, 0.75], [-120, -150, 0]));
  return stall("FabricRed", "FabricGold", merge(...out));
}

// A tall banner pole: stone foot, iron pole with gold collars and spear tip, Eden's banner.
function bannerPole(): Geo {
  return merge(
    ring(46, 22, 0, "StoneGrey", 8),
    ring(34, 46, 22, "StoneLight", 8),
    ring(40, 8, 68, "StoneWhite", 8),
    cylinderAt({ rBot: 8, rTop: 5.5, height: 640, segments: 8, bottom: [0, 0, 76] }, "IronDark"),
    ring(11, 10, 76, "GoldTrim", 8),
    ring(9, 8, 420, "GoldTrim", 8),
    sphereCenter(9, [0, 0, 722], "GoldTrim", 8),
    cylinderAt({ rBot: 7, rTop: 0.5, height: 42, segments: 4, bottom: [0, 0, 728] }, "GoldTrim"),
    beamBetween([0, 0, 686], [-18, 0, 686], 5, 5, "IronDark"),
    translate(bannerGeo(120, 380), [-18, 0, 684]),
  );
}

// A double street lamp: cast-iron post on a stone block, scrolled arms and two lanterns.
function streetLamp(): Geo {
  const out: Geo[] = [
    boxAt([60, 60, 16], [0, 0, 0], "StoneGrey", 3),
    cylinderAt({ rBot: 20, rTop: 11, height: 56, segments: 8, bottom: [0, 0, 16] }, "IronDark"),
    cylinderAt({ radius: 6, height: 236, segments: 8, bottom: [0, 0, 72] }, "IronDark"),
    ring(9, 6, 72, "GoldTrim", 8),
    ring(8.5, 6, 200, "GoldTrim", 8),
    ring(9, 8, 300, "IronDark", 8),
    sphereCenter(8, [0, 0, 316], "GoldTrim", 8),
    cylinderAt({ rBot: 4, rTop: 0.5, height: 22, segments: 4, bottom: [0, 0, 322] }, "GoldTrim"),
  ];
  for (const s of [-1, 1])
    out.push(
      beamBetween([0, 0, 298], [0, s * 64, 306], 5, 5, "IronDark"),
      translate(rotateY(torus(12, 2, 12, 4, "IronDark"), 90), [0, s * 24, 286]),
      translate(lantern(), [0, s * 64, 260]),
    );
  return merge(...out);
}

// A long stone planter of flowers with ivy trailing over the front.
function flowerPlanter(): Geo {
  const cards = new Cards(), rnd = rng(5);
  const out: Geo[] = [
    boxAt([70, 190, 6], [0, 0, 0], "StoneGrey", 2),
    wuv(boxAt([62, 180, 44], [0, 0, 6], "StoneWhite", 2)),
    boxAt([72, 192, 8], [0, 0, 50], "StoneLight", 2),
    boxAt([52, 170, 3], [0, 0, 56], "Eden_Soil"),
  ];
  // three rows of clumps, the back one tallest
  const rows: [number, number, number[]][] = [[-15, 24, [FC.roseRed, FC.daisy]], [0, 30, [FC.buttercup, FC.cosmosPink, FC.buttercup]], [15, 36, [FC.pansy, FC.daisy, FC.pansy]]];
  for (const [x, h, cells] of rows)
    for (let i = 0; i < 8; i++) flowerClump(cards, [x + (rnd() - 0.5) * 6, -76 + i * 21.7 + (rnd() - 0.5) * 6, 58], 30, h, [cells[i % cells.length]], 2, rnd, [-0.5, 0]);
  // ivy over the front lip: strands of small leaf sprays, some long, some short
  const front = new THREE.Vector3(-0.6, 0, 0.8).normalize();
  for (let i = 0; i < 9; i++) {
    let y = -82 + i * 20.5 + (rnd() - 0.5) * 10;
    const n = 1 + Math.floor(rnd() * 3.5);
    for (let k = 0; k <= n; k++) {
      y += (rnd() - 0.5) * 7;
      cards.facing(rnd() < 0.5 ? "LeafCardDark" : "LeafCard", [-38 - k * 1.2, y, 57 - k * 10], new THREE.Vector3(-1, (rnd() - 0.5) * 0.8, 0.3 + rnd() * 0.3), rnd() * 6.28, 15 + rnd() * 6, 15 + rnd() * 6, front);
    }
  }
  return merge(...out, cards.geo());
}

// ---- paving (4 m squares, 5 cm thick) ----
function plazaTile(): Geo {
  return merge(
    boxBounds([-180, -180, 0], [180, 180, 5], "Cobble"),
    boxBounds([-200, -200, 0], [200, -180, 5.6], "StoneLight"),
    boxBounds([-200, 180, 0], [200, 200, 5.6], "StoneLight"),
    boxBounds([-200, -180, 0], [-180, 180, 5.6], "StoneLight"),
    boxBounds([180, -180, 0], [200, 180, 5.6], "StoneLight"),
  );
}
// A street running along X (tiles end to end): cobbled carriageway, kerbs, flagged pavements.
function roadTile(): Geo {
  return merge(
    boxBounds([-200, -150, 0], [200, 150, 5], "CobbleDark"),
    boxBounds([-200, -168, 0], [200, -150, 9], "StoneLight"),
    boxBounds([-200, 150, 0], [200, 168, 9], "StoneLight"),
    boxBounds([-200, -200, 0], [200, -168, 7], "StoneGrey"),
    boxBounds([-200, 168, 0], [200, 200, 7], "StoneGrey"),
  );
}
// Six steps rising toward +X to a landing 150 cm up, between stone cheeks with ball finials.
function stoneStairs(): Geo {
  const out: Geo[] = [];
  for (let i = 0; i < 6; i++) out.push(boxBounds([-170 + i * 45, -180, 0], [170, 180, (i + 1) * 25], "StoneLight", 2));
  for (const s of [-1, 1]) {
    const y0 = s * 180, y1 = s * 214, yc = s * 197;
    const pts: V3[] = [];
    for (const y of [y0, y1]) pts.push([-180, y, 0], [170, y, 0], [170, y, 200], [70, y, 200], [-180, y, 60]);
    out.push(hullGeo(pts, "StoneWhite"));
    out.push(beamBetween([-186, yc, 66], [72, yc, 206], 44, 10, "StoneLight"), boxBounds([66, yc - 22, 198], [176, yc + 22, 208], "StoneLight", 2));
    out.push(boxAt([46, 46, 100], [-170, yc, 0], "StoneLight", 3), boxAt([54, 54, 8], [-170, yc, 100], "StoneWhite", 2), sphereCenter(18, [-170, yc, 124], "StoneWhite", 10));
  }
  return merge(...out);
}

// ---- the harbour ----
// An 800 cm stone quay along Y (tiles end to end), the sea to -X: cobbled top at z = 8, coping,
// the sea wall down to z = -260 with a weed line, bollards, mooring rings and a ladder.
function quayWall(): Geo {
  const L = 400, out: Geo[] = [
    wuv(boxBounds([-200, -L, -260], [200, L, 4], "StoneGrey"), 1.5),
    boxBounds([-176, -L, 4], [200, L, 8], "Cobble"),
    boxBounds([-212, -L, -10], [-176, L, 16], "StoneLight"),
    boxBounds([-206, -L, -90], [-199, L, -14], "MossStone"),
  ];
  for (const y of [-220, 220]) {
    out.push(translate(bollard(), [-140, y, 8]));
    out.push(translate(rotateY(torus(13, 2.5, 12, 5, "IronDark"), 90), [-216, y, -40]), boxBounds([-216, y - 4, -30], [-206, y + 4, -22], "IronDark"));
  }
  for (const y of [-22, 22]) out.push(cylinderBetween([-218, y, 22], [-218, y, -220], 2.5, 6, "IronDark"), cylinderBetween([-218, y, 22], [-205, y, 22], 2.5, 6, "IronDark"));
  for (let z = -200; z <= 0; z += 30) out.push(cylinderBetween([-218, -22, z], [-218, 22, z], 2, 5, "IronDark"));
  return merge(...out);
}
// A 400 cm length of timber pier along X (joins end to end), 240 wide: planked deck at z = 46 on
// stringers and braced posts that go down to z = -280; the posts stand up as mooring posts.
function pier(): Geo {
  const out: Geo[] = [], n = 16, pw = 400 / n;
  for (let i = 0; i < n; i++) out.push(boxBounds([-200 + i * pw + 1, -120, 37], [-200 + (i + 1) * pw - 1, 120, 46], "WoodGrey", 1));
  for (const y of [-104, 104]) out.push(boxBounds([-200, y - 9, 18], [200, y + 9, 37], "WoodDark"));
  for (const y of [-124, 124]) out.push(boxBounds([-200, y - 4, 24], [200, y + 4, 44], "WoodGrey"));
  for (const x of [-100, 100]) {
    for (const y of [-116, 116]) out.push(cylinderAt({ radius: 11, height: 364, segments: 8, bottom: [x, y, -280] }, "WoodDark"), translate(ring(12.5, 4, 84, "IronDark", 8), [x, y, 0]));
    out.push(beamBetween([x, -116, -160], [x, 116, 16], 7, 10, "WoodDark"), beamBetween([x, 116, -160], [x, -116, 16], 7, 10, "WoodDark"));
    out.push(boxBounds([x - 9, -128, 6], [x + 9, 128, 18], "WoodDark"));
  }
  out.push(translate(torus(14, 3, 12, 5, "RopeTan"), [100, -116, 62]), translate(torus(13.5, 3, 12, 5, "RopeTan"), [100, -116, 68]));
  return merge(...out);
}

// A small sailing boat, 6.3 m: white topsides, blue bottom, a planked deck with a cuddy cabin
// and cockpit, mast, boom, a bellied mainsail and jib, stays and a pennant. Keel on z = 0, the
// bow to -X; it floats at z = -42.
function sailboat(): Geo {
  const GZ = 116;
  const st: [number, number, number, number][] = [[-200, 62, 34, 8], [-80, 94, 70, 0], [60, 100, 76, 0], [200, 86, 60, 2]];
  const pts: V3[] = [[-312, 0, GZ], [-290, 0, 70], [-250, 0, 22], [272, 70, GZ], [272, -70, GZ], [272, 48, 56], [272, -48, 56], [266, 0, 40]];
  for (const [x, hb, bb, kz] of st) pts.push([x, hb, GZ], [x, -hb, GZ], [x, bb, 34], [x, -bb, 34], [x, 0, kz]);
  const low = pts.filter((p) => p[2] <= 60).map(([x, y, z]): V3 => [x * 1.006, y * 1.035, z - 1]);
  const deck: V3[] = [[-298, 0, GZ + 1.5], [-298, 0, GZ - 12], [266, 63, GZ + 1.5], [266, -63, GZ + 1.5], [266, 63, GZ - 12], [266, -63, GZ - 12]];
  for (const [x, hb] of st) deck.push([x, hb - 7, GZ + 1.5], [x, -(hb - 7), GZ + 1.5], [x, hb - 7, GZ - 12], [x, -(hb - 7), GZ - 12]);
  const out: Geo[] = [hullGeo(pts, "Eden_HullWhite"), hullGeo(low, "Eden_HullBlue"), hullGeo(deck, "WoodPale")];
  const line: [number, number][] = [[-312, 0], [-200, 62], [-80, 94], [60, 100], [200, 86], [272, 70]];
  for (const s of [-1, 1]) for (let i = 0; i < line.length - 1; i++) out.push(beamBetween([line[i][0], s * (line[i][1] + 1), GZ - 3], [line[i + 1][0], s * (line[i + 1][1] + 1), GZ - 3], 5, 9, "WoodDark"));
  out.push(beamBetween([-312, 0, GZ - 30], [-324, 0, GZ + 22], 9, 10, "WoodDark"));
  // cabin and cockpit
  out.push(boxBounds([-176, -50, GZ], [-30, 50, GZ + 36], "Eden_HullWhite", 3), boxBounds([-182, -56, GZ + 36], [-24, 56, GZ + 44], "Eden_PaintBlue", 3));
  for (const x of [-140, -80]) for (const f of ["-y", "+y"] as const) out.push(onFace(merge(panel(circleShape(8), -2, 2, "IronDark"), panel(circleShape(6), -3, 1, "GlassBlue")), f, 50, x, GZ + 18));
  out.push(boxBounds([92, -50, GZ + 1], [228, 50, GZ + 2.5], "WoodDark"));
  for (const s of [-1, 1]) out.push(boxBounds([88, s * 50 - 4, GZ], [232, s * 50 + 4, GZ + 10], "WoodWarm", 1));
  out.push(boxBounds([88, -54, GZ], [96, 54, GZ + 10], "WoodWarm", 1), boxBounds([224, -54, GZ], [232, 54, GZ + 10], "WoodWarm", 1));
  // rudder and tiller
  out.push(boxBounds([270, -4, 8], [302, 4, GZ - 6], "Eden_HullBlue", 1), beamBetween([296, 0, GZ + 6], [200, 0, GZ + 16], 5, 5, "WoodWarm"));
  // rig
  out.push(
    cylinderAt({ rBot: 7, rTop: 4.5, height: 762, segments: 8, bottom: [-60, 0, GZ] }, "WoodWarm"),
    cylinderBetween([-58, 0, 206], [-60 + 298 * Math.cos(24 * D), 298 * Math.sin(24 * D), 216], 4.5, 6, "WoodWarm"),
    sheet([-54, 0, 214], [-54, 0, 862], [-60 + 294 * Math.cos(24 * D), 294 * Math.sin(24 * D), 222], 22, "Eden_Sail", 5),
    sheet([-66, 0, 760], [-302, 0, GZ + 10], [-110, 46, 150], -16, "Eden_Sail", 4),
    cylinderBetween([-62, 0, 872], [-310, 0, GZ + 6], 1, 4, "IronLight"),
    cylinderBetween([-60, 0, 872], [272, 0, GZ + 2], 1, 4, "IronLight"),
    cylinderBetween([-60, 0, 760], [-60, 94, GZ], 0.9, 4, "IronLight"),
    cylinderBetween([-60, 0, 760], [-60, -94, GZ], 0.9, 4, "IronLight"),
    cylinderBetween([-60, 0, 878], [-60, 0, 904], 1.5, 4, "WoodDark"),
    sheet([-60, 0, 904], [-60, 0, 880], [-60, -70, 893], 0, "FabricBlue", 1),
  );
  return merge(...out);
}
// A blue rowing boat, 3 m, with thwarts, oars and a coil of rope. Keel on z = 0; floats at z = -30.
function rowboat(): Geo {
  const GZ = 52;
  const st: [number, number, number, number][] = [[-90, 42, 24, 4], [0, 58, 40, 0], [90, 50, 34, 3]];
  const pts: V3[] = [[-150, 0, GZ], [-140, 0, 24], [-118, 0, 6], [140, 40, GZ], [140, -40, GZ], [140, 28, 22], [140, -28, 22], [136, 0, 16]];
  for (const [x, hb, bb, kz] of st) pts.push([x, hb, GZ], [x, -hb, GZ], [x, bb, 14], [x, -bb, 14], [x, 0, kz]);
  const inner: V3[] = [[-134, 0, GZ + 1], [-134, 0, GZ - 14], [134, 33, GZ + 1], [134, -33, GZ + 1], [134, 33, GZ - 14], [134, -33, GZ - 14]];
  for (const [x, hb] of st) inner.push([x, hb - 7, GZ + 1], [x, -(hb - 7), GZ + 1], [x, hb - 7, GZ - 14], [x, -(hb - 7), GZ - 14]);
  const out: Geo[] = [hullGeo(pts, "Eden_HullBlue"), hullGeo(inner, "WoodShade")];
  const line: [number, number][] = [[-150, 0], [-90, 42], [0, 58], [90, 50], [140, 40]];
  for (const s of [-1, 1]) for (let i = 0; i < line.length - 1; i++) out.push(beamBetween([line[i][0], s * (line[i][1] - 2), GZ + 1], [line[i + 1][0], s * (line[i + 1][1] - 2), GZ + 1], 7, 5, "Eden_PaintWhite"));
  for (const [x, hb] of [[-50, 44], [40, 52]]) out.push(boxBounds([x - 12, -hb, GZ - 2], [x + 12, hb, GZ + 4], "WoodPale", 1));
  out.push(boxBounds([112, -34, GZ - 2], [134, 34, GZ + 4], "WoodPale", 1));
  for (const s of [-1, 1]) {
    out.push(cylinderBetween([-120, s * 18, GZ + 9], [110, s * 30, GZ + 9], 2.4, 6, "WoodPale"));
    out.push(translate(rotateZ(box([46, 14, 2.5], [0, 0, 0], "WoodPale"), s * 3), [-140, s * 17, GZ + 9]));
    out.push(boxBounds([-2, s * 56 - 3, GZ + 2], [6, s * 56 + 3, GZ + 12], "IronDark"));
  }
  out.push(translate(torus(12, 3.5, 12, 5, "RopeTan"), [-104, 0, GZ + 4]), translate(torus(9, 3, 12, 5, "RopeTan"), [-104, 0, GZ + 10]));
  return merge(...out);
}
// The lighthouse at the harbour mouth: rocks round an octagonal stone plinth, a tapering white
// tower with blue bands, a gallery with an iron railing, the glowing lantern room, a blue cap.
function lighthouse(): Geo {
  const r = (z: number) => 195 - (50 * (z - 146)) / 970, fr = (z: number) => r(z) * Math.cos(Math.PI / 16), out: Geo[] = [];
  [[0, 252, 1], [62, 236, 2], [128, 262, 3], [196, 240, 4], [250, 258, 5], [312, 244, 6]].forEach(([a, rr, s]) =>
    out.push(translate(rotateZ(rock([180, 140, 110], 0.45, s, s % 2 ? "StoneGrey" : "MossStone"), a + 30), [rr * Math.cos(a * D), rr * Math.sin(a * D), -30])));
  out.push(
    ring(270, 130, 0, "StoneGrey", 8),
    ring(282, 16, 130, "StoneLight", 8),
    ring(195, 970, 146, "Eden_Plaster", 16, 145),
    ring(r(420) + 3, 80, 420, "Eden_PaintBlue", 16, r(500) + 3),
    ring(r(780) + 3, 80, 780, "Eden_PaintBlue", 16, r(860) + 3),
    ring(222, 20, 1116, "StoneLight", 16),
    ring(122, 40, 1136, "Eden_PaintBlue", 16),
    ring(112, 150, 1176, "Eden_LampGlass", 16),
    sphereCenter(52, [0, 0, 1250], "LanternGlow", 10),
    ring(130, 14, 1326, "IronDark", 16),
    ring(140, 120, 1340, "RoofBlue", 16, 4),
    sphereCenter(14, [0, 0, 1466], "GoldTrim", 8),
    cylinderBetween([0, 0, 1476], [0, 0, 1545], 2.5, 6, "GoldTrim"),
    beamBetween([-34, 0, 1520], [34, 0, 1520], 3, 3, "GoldTrim"),
    boxBounds([22, -1.5, 1508], [40, 1.5, 1532], "GoldTrim"),
    translate(torus(214, 2.5, 32, 4, "IronDark"), [0, 0, 1206]),
    translate(torus(214, 2, 32, 4, "IronDark"), [0, 0, 1170]),
    onRound(doorGeo(90, 200, { arch: true, step: false }), fr(146), 180, 146),
  );
  for (let k = 0; k < 16; k++) {
    out.push(rotateZ(merge(boxBounds([r(1116) - 6, -9, 1072], [214, 9, 1116], "StoneLight", 1.5), boxAt([4, 4, 70], [214, 0, 1136], "IronDark")), k * 22.5));
  }
  for (let k = 0; k < 8; k++) out.push(rotateZ(boxAt([5, 5, 150], [112, 0, 1176], "IronDark"), k * 45 + 11.25));
  for (const [z, a] of [[520, 180], [700, 60], [640, 300], [900, 120], [960, 240]]) out.push(onRound(windowGeo(36, 64, { arch: true, frame: "StoneLight" }), fr(z), a, z));
  for (let i = 0; i < 6; i++) out.push(boxBounds([-380 + i * 22, -70, 0], [-240, 70, (i + 1) * 24], "StoneLight", 2));
  return merge(...out);
}

// ======== the city quarter ========
// More of the capital for the starting city: corner and terraced houses, the shops, the
// adventurers' guild, a harbour warehouse, garden pieces and street furniture. The buildings are
// terrace houses: their side walls (±Y) are flat and nothing passes them (no eaves, cornices or
// sills), so they stand wall to wall in a row along Y with no gap. Walls are Eden_Plaster /
// StoneLight / StoneWhite and every roof is RoofBlue, so a street can swap the colours.

const toY = (g: Geo): Geo => rotateZ(g, 90); // a piece built facing -X turned to face -Y

// Roof texture coordinates for any slab: U along the eaves, V up the slope, in metres (as
// gableRoof's slabs have them), so the tile courses lie level on hips and lean-tos too.
function roofUv(g: Geo, s = 1): Geo {
  const n = new THREE.Vector3(), e = new THREE.Vector3(), t = new THREE.Vector3(), p = new THREE.Vector3();
  return g.map(({ geo, mat }) => {
    const out = geo.clone();
    const pos = out.getAttribute("position"), nor = out.getAttribute("normal");
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      n.set(nor.getX(i), nor.getY(i), nor.getZ(i));
      p.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      const h = Math.hypot(n.x, n.y);
      if (h < 1e-3) {
        e.set(1, 0, 0);
        t.set(0, 1, 0);
      } else {
        e.set(-n.y / h, n.x / h, 0);
        t.crossVectors(n, e).normalize();
      }
      uv[i * 2] = p.dot(e) / (100 * s);
      uv[i * 2 + 1] = p.dot(t) / (100 * s);
    }
    out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    return { geo: out, mat };
  });
}
// A round rope or stem through some points.
function tube(pts: V3[], r: number, mat: string, seg = 32, radial = 6): Geo {
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, radial, false);
  return wuv([{ geo: g.toNonIndexed(), mat }]);
}
// A rectangle in a wall's plane (world y0..y1, z0..z1).
function rectAt(y0: number, y1: number, z0: number, z1: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(y0, z0);
  s.lineTo(y1, z0);
  s.lineTo(y1, z1);
  s.lineTo(y0, z1);
  s.lineTo(y0, z0);
  return s;
}
// Hang pieces on a box building: walls at ±HX / ±HY, the plaster above G set in by P.
function placer(out: Geo[], HX: number, HY: number, G: number, P = 4) {
  return (g: Geo, face: Face, u: number, z: number): void => {
    out.push(onFace(g, face, (face.endsWith("x") ? HX : HY) - (z >= G ? P : 0), u, z));
  };
}

// The body of a terrace house, HX deep either way and flush at ±HY: stone plinth, ashlar ground
// storey to G, plaster to the eaves E (set in by P at the front and back), white string courses
// and a cornice that run to the party walls, white pilaster strips at the four corners.
function terrace(HX: number, HY: number, G: number, E: number, floors: number[], o: { wall?: string; P?: number; ground?: boolean; pilasters?: boolean } = {}): Geo {
  const P = o.P ?? 4, wall = o.wall ?? "Eden_Plaster", out: Geo[] = [];
  const mason = [boxBounds([-HX - 8, -HY, 0], [HX + 8, HY, 40], "StoneGrey")];
  if (o.ground !== false) mason.push(boxBounds([-HX, -HY, 40], [HX, HY, G], "StoneLight"));
  out.push(wuv(merge(...mason), 1.1));
  out.push(
    boxBounds([-HX + P, -HY, G], [HX - P, HY, E], wall),
    boxBounds([-HX - 10, -HY, G - 6], [HX + 10, HY, G + 12], "StoneWhite", 3),
    ...floors.map((f) => boxBounds([-HX - 1, -HY, f - 6], [HX + 1, HY, f + 6], "StoneWhite")),
    boxBounds([-HX - 12, -HY, E - 24], [HX + 12, HY, E + 2], "StoneWhite", 3),
  );
  if (o.pilasters !== false)
    for (const sx of [-1, 1])
      for (const sy of [-1, 1]) {
        const x0 = sx < 0 ? -HX - 4 : HX - P, y0 = sy < 0 ? -HY : HY - 30;
        out.push(boxBounds([x0, y0, G + 12], [x0 + P + 4, y0 + 30, E - 24], "StoneWhite"));
      }
  return merge(...out);
}

// A tiled gable roof, ridge along X, over ±hx, ±hy with its eaves at E: `ovx` past the gables,
// `ovy` past the eaves ("flush" keeps it inside ±hy and adds stone gutters), plaster gables at
// ±gx (half-width gw), ridge tiles and white bargeboards. rotateZ(…, 90) puts the ridge along Y.
interface RoofOpt { ovx?: number; ovy?: number | "flush"; gx?: number; gw?: number; wall?: string; th?: number; barge?: boolean }
function roofX(hx: number, hy: number, E: number, RH: number, o: RoofOpt = {}): Geo {
  const th = o.th ?? 22, ang = Math.atan2(RH, hy), ovx = o.ovx ?? 30, flush = o.ovy === "flush";
  const ovy = o.ovy === "flush" ? -th * Math.sin(ang) - 0.5 : o.ovy ?? 30;
  const slope = (hy + ovy) / Math.cos(ang), len = 2 * (hx + ovx), wall = o.wall ?? "Eden_Plaster";
  const gx = o.gx ?? hx - 4, gw = o.gw ?? hy - 4, rz = E + RH + th / Math.cos(ang) - 3;
  const slab = (s: number): Geo => rotateX(box([len, slope, th], [0, (s * slope) / 2, th / 2], "RoofBlue"), (-s * ang) / D);
  const out: Geo[] = [
    translate(merge(slab(1), slab(-1)), [0, 0, E + RH]),
    ridge([-hx - ovx, 0, rz], [hx + ovx, 0, rz], 11),
    wuv(merge(gableWall(-gx, gw, E, RH - 4, wall), gableWall(gx, gw, E, RH - 4, wall))),
  ];
  if (o.barge !== false)
    for (const x of [-hx - ovx + 3, hx + ovx - 3])
      for (const s of [-1, 1]) out.push(beamBetween([x, s * (hy + ovy), E - (RH * ovy) / hy - 8], [x, 0, E + RH - 4], 6, 20, "Eden_PaintWhite"));
  if (flush)
    for (const s of [-1, 1]) out.push(boxBounds([-hx - ovx, s < 0 ? -hy : hy - 20, E - 2], [hx + ovx, s < 0 ? -hy + 20 : hy, E + (RH * 22) / hy + 6], "StoneWhite"));
  return merge(...out);
}

// A tiled hipped roof over ±hx, ±hy: eaves `ovx` / `ovy` past the walls at z (0 keeps it flush),
// `th` thick, rising h to a ridge along the longer side (a point when square), ridge and hip tiles.
function hipRoof(hx: number, hy: number, z: number, h: number, ovx: number, ovy: number, th = 22): Geo {
  const ax = hx + ovx, ay = hy + ovy, zt = z + th, zr = zt + h;
  const ends: V3[] = ax - ay > 2 ? [[ay - ax, 0, zr], [ax - ay, 0, zr]] : ay - ax > 2 ? [[0, ax - ay, zr], [0, ay - ax, zr]] : [[0, 0, zr]];
  const pts = ends.map((e) => new THREE.Vector3(...e));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) pts.push(new THREE.Vector3(sx * ax, sy * ay, z), new THREE.Vector3(sx * ax, sy * ay, zt));
  const out: Geo[] = [roofUv([{ geo: new ConvexGeometry(pts), mat: "RoofBlue" }])];
  if (ends.length === 2) out.push(ridge([ends[0][0], ends[0][1], zr + 3], [ends[1][0], ends[1][1], zr + 3], 10));
  const alongX = ends.length === 2 && ends[0][0] !== 0;
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) {
      const e = ends.length === 1 ? ends[0] : ends[(alongX ? sx : sy) < 0 ? 0 : 1], c: V3 = [sx * ax, sy * ay, zt + 2];
      out.push(cylinderBetween([c[0] + (e[0] - c[0]) * 0.05, c[1] + (e[1] - c[1]) * 0.05, c[2] + (e[2] + 3 - c[2]) * 0.05], [e[0], e[1], zr + 3], 7, 6, "StoneBlueDark"));
    }
  return merge(...out);
}

// A hanging sign on a scrolled iron bracket out from a -X facing wall (bracket at z = 0): a framed
// board across the bracket (faces to ±Y) with `front` (built facing -Y) on one face and its
// mirror on the other; with board null the emblem hangs on its own and `core` is hung once.
function hangingSign(front: Geo, o: { len?: number; bw?: number; bh?: number; board?: string | null; core?: Geo } = {}): Geo {
  const len = o.len ?? 140, bw = o.bw ?? 96, bh = o.bh ?? 84, cx = -len * 0.56, zc = -16 - bh / 2;
  const out: Geo[] = [
    boxBounds([-3, -9, -len * 0.42], [1, 9, 10], "IronDark"),
    beamBetween([0, 0, 0], [-len, 0, 0], 6, 6, "IronDark"),
    beamBetween([0, 0, -len * 0.38], [-len * 0.6, 0, -2], 3.5, 3.5, "IronDark"),
    translate(rotateX(torus(len * 0.12, 1.6, 10, 4, "IronDark"), 90), [-len * 0.2, 0, -len * 0.13]),
    sphereCenter(5, [-len - 3, 0, 0], "GoldTrim", 6),
    cylinderBetween([cx - bw / 2 + 10, 0, 0], [cx - bw / 2 + 10, 0, -16], 1.2, 4, "IronDark"),
    cylinderBetween([cx + bw / 2 - 10, 0, 0], [cx + bw / 2 - 10, 0, -16], 1.2, 4, "IronDark"),
  ];
  const off = o.board === null ? 0 : 4.5;
  if (o.board !== null) out.push(boxBounds([cx - bw / 2, -3.5, -16 - bh], [cx + bw / 2, 3.5, -16], "WoodDark", 1.5), boxBounds([cx - bw / 2 + 4, -4.5, -12 - bh], [cx + bw / 2 - 4, 4.5, -20], o.board ?? "Eden_PaintBlue"));
  out.push(translate(front, [cx, -off, zc]), translate(rotateZ(front, 180), [cx, off, zc]));
  if (o.core) out.push(translate(o.core, [cx, 0, zc]));
  return merge(...out);
}

// A shop's projecting display window facing -X (its back on x = 0, the glass from z = 0 to h): a
// painted frame, stone sill and cap, clear glass to the front and sides, a back board, and the
// `goods` on show behind the glass (x between -depth and 0).
function displayWindow(w: number, h: number, depth: number, frame: string, goods: Geo, bars = 3): Geo {
  const hw = w / 2, out: Geo[] = [
    boxBounds([-depth - 10, -hw - 12, -14], [2, hw + 12, 0], "StoneWhite", 2),
    boxBounds([-depth - 4, -hw - 6, -60], [0, hw + 6, -14], frame),
    boxBounds([-depth - 8, -hw - 10, h], [2, hw + 10, h + 16], frame),
    boxBounds([-depth - 14, -hw - 16, h + 16], [2, hw + 16, h + 24], "StoneWhite", 1.5),
    boxBounds([-2, -hw, 0], [0, hw, h], "WoodShade"),
    boxBounds([-depth, -hw, 0], [-depth + 1, hw, h], "Eden_ShopGlass"),
    boxBounds([-depth, -hw - 1, 0], [-2, -hw, h], "Eden_ShopGlass"),
    boxBounds([-depth, hw, 0], [-2, hw + 1, h], "Eden_ShopGlass"),
    boxBounds([-depth - 3, -hw, h * 0.8 - 2], [-depth, hw, h * 0.8 + 2], frame),
    goods,
  ];
  for (const y of [-hw - 6, hw]) out.push(boxBounds([-depth - 4, y, 0], [-depth + 2, y + 6, h], frame));
  for (let i = 1; i < bars; i++) out.push(boxBounds([-depth - 3, -hw + (w * i) / bars - 2, 0], [-depth, -hw + (w * i) / bars + 2, h], frame));
  return merge(...out);
}

// A potion on z = 0 (kind 0 a round flask, 1 a tall bottle, 2 a square phial), glowing glass, a cork.
const POTIONS = ["Eden_PotionRed", "Eden_PotionBlue", "Eden_PotionGreen", "Eden_PotionViolet", "Eden_PotionGold"];
function bottle(kind: number, mat: string, s = 1): Geo {
  if (kind === 0)
    return merge(sphereCenter(8 * s, [0, 0, 8 * s], mat, 8), cylinderAt({ radius: 3 * s, height: 8 * s, segments: 6, bottom: [0, 0, 14 * s] }, mat), cylinderAt({ radius: 3.6 * s, height: 3.5 * s, segments: 6, bottom: [0, 0, 21 * s] }, "WoodWarm"));
  if (kind === 1)
    return merge(
      cylinderAt({ radius: 5 * s, height: 15 * s, segments: 8, bottom: [0, 0, 0] }, mat),
      cylinderAt({ rBot: 5 * s, rTop: 2.2 * s, height: 4 * s, segments: 8, bottom: [0, 0, 15 * s] }, mat),
      cylinderAt({ radius: 2.2 * s, height: 5 * s, segments: 6, bottom: [0, 0, 19 * s] }, mat),
      cylinderAt({ radius: 2.7 * s, height: 3 * s, segments: 6, bottom: [0, 0, 24 * s] }, "WoodWarm"),
    );
  return merge(boxAt([10 * s, 10 * s, 12 * s], [0, 0, 0], mat), cylinderAt({ radius: 2.6 * s, height: 5 * s, segments: 6, bottom: [0, 0, 12 * s] }, mat), sphereCenter(3.4 * s, [0, 0, 19 * s], "GoldTrim", 6));
}
// A round flask outline (the body centred on the origin, the neck up to 1.75 r).
function flaskShape(r: number): THREE.Shape {
  const s = new THREE.Shape(), a = Math.asin(0.34);
  s.moveTo(-0.34 * r, 1.75 * r);
  s.lineTo(-0.34 * r, r * Math.cos(a));
  s.absarc(0, 0, r, Math.PI / 2 + a, Math.PI / 2 - a + 2 * Math.PI, false);
  s.lineTo(0.34 * r, 1.75 * r);
  s.lineTo(-0.34 * r, 1.75 * r);
  return s;
}
// A sword standing on its pommel at the origin, the blade up +Z, flat to X (for -X facing emblems).
function sword(len: number): Geo {
  const b = len * 0.72;
  return merge(
    sphereCenter(4, [0, 0, 4], "GoldTrim", 6),
    boxBounds([-2.5, -3, 7], [2.5, 3, 26], "WoodDark"),
    boxBounds([-3, -17, 26], [3, 17, 32], "GoldTrim", 1),
    boxBounds([-1.5, -4.5, 32], [1.5, 4.5, 32 + b], "IronLight"),
    translate(scale(cylinderAt({ rBot: 4.5, rTop: 0.2, height: 14, segments: 4, bottom: [0, 0, 0] }, "IronLight"), [0.33, 1, 1]), [0, 0, 32 + b]),
  );
}
function crossedSwords(len: number): Geo {
  const s = translate(sword(len), [0, 0, -len * 0.55]);
  return merge(rotateX(s, 38), rotateX(translate(s, [0.5, 0, 0]), -38));
}
// The adventurers' badge facing -X: a shield of `field` edged in gold with a gold crown, two
// swords crossed behind it.
function guildBadge(s: number, field = "LacquerRed"): Geo {
  return merge(
    translate(crossedSwords(s * 2.6), [1, 0, -s * 0.2]),
    panel(shieldShape(s + 4), -8, 6, "GoldTrim"),
    panel(shieldShape(s), -10, 2, field),
    panel(crownShape(s * 0.42), -11, 1, "GoldTrim", { seg: 2 }),
  );
}
// A wooden crate on z = 0 with dark battens on its edges and braces across two faces.
function crate(sx: number, sy: number, sz: number, wood = "WoodWarm"): Geo {
  const t = 5, hx = sx / 2, hy = sy / 2, out: Geo[] = [boxAt([sx - 2, sy - 2, sz - 2], [0, 0, 1], wood)];
  for (const x of [-hx, hx - t]) for (const y of [-hy, hy - t]) out.push(boxBounds([x, y, 0], [x + t, y + t, sz], "WoodDark"));
  for (const z of [0, sz - t]) {
    for (const y of [-hy, hy - t]) out.push(boxBounds([-hx, y, z], [hx, y + t, z + t], "WoodDark"));
    for (const x of [-hx, hx - t]) out.push(boxBounds([x, -hy, z], [x + t, hy, z + t], "WoodDark"));
  }
  for (const s of [-1, 1]) out.push(beamBetween([s * (hx - 0.5), -hy + t, t], [s * (hx - 0.5), hy - t, sz - t], 2, 7, "WoodDark"));
  return merge(...out);
}
// A tied grain sack standing on z = 0.
function sack(r: number, mat = "FabricSand"): Geo {
  return translate(merge(
    scale(sphereCenter(r, [0, 0, 0], mat, 8), [0.85, 1.15, 0.72], [0, 0, 0]),
    cylinderAt({ rBot: r * 0.32, rTop: r * 0.18, height: r * 0.45, segments: 6, bottom: [0, 0, r * 0.6] }, mat),
    translate(torus(r * 0.22, 1.6, 8, 4, "RopeTan"), [0, 0, r * 0.82]),
  ), [0, 0, r * 0.66]);
}
// A bronze bell hanging from z = 0.
function bell(r: number): Geo {
  return merge(
    cylinderBetween([0, 0, 0], [0, 0, -r * 0.3], r * 0.12, 6, "IronDark"),
    sphereCenter(r * 0.55, [0, 0, -r * 0.6], "Bronze", 8),
    cylinderAt({ rBot: r, rTop: r * 0.55, height: r, segments: 10, bottom: [0, 0, -r * 1.6] }, "Bronze"),
    translate(torus(r, r * 0.09, 10, 4, "Bronze"), [0, 0, -r * 1.6]),
    sphereCenter(r * 0.2, [0, 0, -r * 1.75], "IronDark", 6),
  );
}
// A clock face facing -X centred on the origin: stone surround, white dial, hours, hands at ten past ten.
function clockFace(r: number): Geo {
  const out: Geo[] = [
    panel(circleShape(r + 12), -6, 6, "StoneLight", { seg: 8 }),
    panel(circleShape(r + 3), -8, 2, "GoldTrim", { seg: 8 }),
    panel(circleShape(r), -9, 1, "Eden_PaintWhite", { seg: 8 }),
    rotateX(boxBounds([-12, -2.5, -4], [-10, 2.5, r * 0.5], "IronDark"), -60),
    rotateX(boxBounds([-13, -1.8, -4], [-11, 1.8, r * 0.76], "IronDark"), 62),
    sphereCenter(3.5, [-13, 0, 0], "GoldTrim", 6),
  ];
  for (let i = 0; i < 12; i++) out.push(rotateX(boxBounds([-10.5, -1.8, r * 0.76], [-9, 1.8, r * 0.92], i % 3 ? "Eden_Dark" : "GoldTrim"), i * 30));
  return merge(...out);
}
// A park bench facing -X, 180 cm along Y: cast-iron ends with scrolled arms, wooden slats, seat at 44.
function parkBench(): Geo {
  const out: Geo[] = [];
  for (let i = 0; i < 5; i++) out.push(boxBounds([-24 + i * 9.6, -90, 40], [-24 + i * 9.6 + 8, 90, 44], "WoodWarm", 1));
  for (let i = 0; i < 3; i++) {
    const z = 58 + i * 12, x = 20 + (14 * (z - 38)) / 54 - 4;
    out.push(translate(rotateY(box([3, 182, 9], [0, 0, 0], "WoodWarm", 1), 14), [x, 0, z]));
  }
  for (const y of [-80, 0, 80]) {
    out.push(
      beamBetween([-26, y, 0], [-20, y, 40], 4, 4, "IronDark"),
      beamBetween([26, y, 0], [20, y, 40], 4, 4, "IronDark"),
      beamBetween([-24, y, 38], [22, y, 38], 3, 4, "IronDark"),
      beamBetween([20, y, 38], [34, y, 92], 4, 4, "IronDark"),
    );
    if (y !== 0)
      out.push(
        beamBetween([-22, y, 40], [-30, y, 62], 3.5, 3.5, "IronDark"),
        beamBetween([-34, y, 65], [28, y, 67], 5, 3, "IronDark"),
        translate(rotateX(torus(6, 1.6, 10, 4, "IronDark"), 90), [-33, y, 58]),
        translate(rotateX(torus(5, 1.4, 10, 4, "IronDark"), 90), [-29, y, 6]),
        translate(rotateX(torus(5, 1.4, 10, 4, "IronDark"), 90), [29, y, 6]),
        sphereCenter(3, [-38, y, 66], "GoldTrim", 6),
      );
  }
  return merge(...out);
}

// ---- city houses (terraces: flat, flush side walls at ±Y) ----
// A three-storey corner house, 7.6 x 7.6 m (8.9 m deep with its turret): a round turret on the
// front's -Y end with the door in its foot and a tall conical roof with a weathervane, a shop
// window under an awning, shuttered windows and flower boxes, a hipped roof with a dormer.
// Its -Y side carries shallow windows for a street corner; its +Y side is flat.
function cornerHouse(): Geo {
  const HX = 380, HY = 380, G = 340, F2 = 660, E = 980, P = 4, R = 150, out: Geo[] = [];
  const C: V3 = [-HX + 40, -HY + R + 46, 0], fr = (R - 3) * Math.cos(Math.PI / 16), TT = E + 240;
  const on = placer(out, HX, HY, G, P);
  out.push(terrace(HX, HY, G, E, [F2]));
  // the turret
  const tur: Geo[] = [
    ring(R + 10, 40, 0, "StoneGrey"),
    ring(R, G - 40, 40, "StoneLight"),
    ring(R + 10, 18, G - 6, "StoneWhite"),
    ring(R - 3, TT - G, G, "Eden_Plaster"),
    ring(R + 1, 12, F2 - 6, "StoneWhite"),
    ring(R + 12, 26, E - 24, "StoneWhite"),
    ring(R + 14, 24, TT - 24, "StoneWhite"),
    ring(R + 46, 8, TT - 2, "StoneBlueDark"),
    ring(R + 42, 560, TT, "RoofBlue", 16, 3),
    sphereCenter(11, [0, 0, TT + 556], "GoldTrim", 8),
    cylinderBetween([0, 0, TT + 540], [0, 0, TT + 700], 2.5, 6, "IronDark"),
    sphereCenter(5, [0, 0, TT + 702], "GoldTrim", 6),
    beamBetween([-30, 0, TT + 630], [30, 0, TT + 630], 2, 2, "IronDark"),
    beamBetween([0, -30, TT + 630], [0, 30, TT + 630], 2, 2, "IronDark"),
    beamBetween([-40, 0, TT + 666], [36, 0, TT + 666], 2.5, 2.5, "IronDark"),
    sheet([-56, 0, TT + 666], [-38, 0, TT + 676], [-38, 0, TT + 656], 0, "GoldTrim", 1),
    sheet([32, 0, TT + 666], [54, 0, TT + 684], [54, 0, TT + 650], 0, "GoldTrim", 1),
  ];
  for (let k = 0; k < 16; k++) tur.push(rotateZ(boxBounds([R - 6, -8, TT - 60], [R + 10, 8, TT - 24], "StoneLight"), k * 22.5 + 11.25));
  tur.push(onRound(doorGeo(110, 240, { arch: true }), R * Math.cos(Math.PI / 16), 180, 0));
  for (const a of [135, 225]) tur.push(onRound(windowGeo(56, 110, { arch: true }), R * Math.cos(Math.PI / 16), a, 110));
  for (const a of [135, 180, 225]) {
    tur.push(onRound(windowGeo(70, 150, { arch: true, flowers: a === 180 ? 2 : undefined }), fr, a, G + 56));
    tur.push(onRound(windowGeo(64, 140, { arch: true }), fr, a, F2 + 44));
    tur.push(onRound(windowGeo(40, 70, { arch: true, frame: "StoneLight" }), fr, a, E + 70));
  }
  out.push(translate(merge(...tur), C));
  // the front: shop window, awning, a second door, windows
  on(windowGeo(170, 170), "-x", 60, 70);
  out.push(translate(awning(210, 100, 40, "FabricBlue", "FabricWhite"), [-HX, 60, 318]));
  on(doorGeo(100, 240, { arch: true }), "-x", 270, 0);
  on(wallLantern(), "-x", 180, 290);
  for (const u of [40, 240]) {
    on(windowGeo(86, 160, { shutters: true, flowers: u === 40 ? 0 : 3 }), "-x", u, G + 56);
    on(windowGeo(86, 150, { shutters: true }), "-x", u, F2 + 44);
  }
  // the -Y street side (shallow windows) and the back
  for (const u of [-60, 200]) {
    on(windowGeo(90, 140), "-y", u, 100);
    on(windowGeo(80, 150), "-y", u, G + 56);
    on(windowGeo(80, 140), "-y", u, F2 + 44);
  }
  on(doorGeo(100, 230), "+x", -220, 0);
  on(windowGeo(110, 150), "+x", 160, 90);
  for (const z of [G + 56, F2 + 44]) for (const u of [-200, 180]) on(windowGeo(86, 150, { shutters: true }), "+x", u, z);
  // the roof
  out.push(hipRoof(HX, HY, E, 340, 30, 0));
  out.push(dormer(-HX + 10, 60, E + 20, 140, 200));
  out.push(chimney(160, 200, E + 150, E + 430));
  return merge(...out);
}

// ตึกแถว: a terrace of three joined narrow houses, exactly 14.0 m along Y (y -700..700) and
// 7.6 m deep: a cream three-storey shop house with its gable to the street, a pale yellow
// two-storey shop with its eaves to the street and a dormer, a rose-pink house with a stepped
// gable. Shop fronts on the first two, a door each; flat end walls.
function rowHouses(): Geo {
  const HX = 380, G = 330, P = 4, out: Geo[] = [];
  const on = placer(out, HX, 700, G, P);
  out.push(wuv(merge(boxBounds([-HX - 8, -700, 0], [HX + 8, 700, 40], "StoneGrey"), boxBounds([-HX, -700, 40], [HX, 700, G], "StoneLight")), 1.1));
  out.push(boxBounds([-HX - 10, -700, G - 6], [HX + 10, 700, G + 12], "StoneWhite", 3));
  const units = [
    { y0: -700, y1: -240, E: 1000, wall: "PlasterCream", F: [660] },
    { y0: -240, y1: 240, E: 660, wall: "Eden_PlasterYellow", F: [] as number[] },
    { y0: 240, y1: 700, E: 1060, wall: "Eden_PlasterRose", F: [690] },
  ];
  for (const u of units) {
    out.push(boxBounds([-HX + P, u.y0, G], [HX - P, u.y1, u.E], u.wall));
    for (const f of u.F) out.push(boxBounds([-HX - 1, u.y0, f - 6], [HX + 1, u.y1, f + 6], "StoneWhite"));
    out.push(boxBounds([-HX - 12, u.y0, u.E - 24], [HX + 12, u.y1, u.E + 2], "StoneWhite", 3));
  }
  // white strips on the party lines and the end corners
  for (const [y0, y1, top] of [[-700, -672, 976], [-256, -224, 636], [224, 256, 636], [672, 700, 1036]] as const)
    for (const x0 of [-HX - 4, HX - P]) out.push(boxBounds([x0, y0, G + 12], [x0 + P + 4, y1, top], "StoneWhite"));

  // A: cream, gable to the street
  out.push(translate(roofX(HX, 230, 1000, 420, { ovx: 24, ovy: "flush", gx: HX - P, gw: 230, wall: "PlasterCream" }), [0, -470, 0]));
  on(windowGeo(180, 170), "-x", -545, 60);
  out.push(translate(awning(220, 100, 36, "FabricGreen", "FabricWhite"), [-HX, -545, 312]));
  on(doorGeo(96, 240, { arch: true }), "-x", -335, 0);
  for (const u of [-560, -380]) {
    on(windowGeo(80, 160, { shutters: true, flowers: 0 }), "-x", u, G + 56);
    on(windowGeo(80, 150, { arch: true }), "-x", u, 660 + 44);
  }
  const oculus = merge(panel(circleShape(44), -6, 8, "StoneWhite"), panel(circleShape(32), -8, 2, "GlassBlue"), boxBounds([-10, -32, -2], [-8, 32, 2], "Eden_PaintWhite"), boxBounds([-10, -2, -32], [-8, 2, 32], "Eden_PaintWhite"));
  out.push(onFace(oculus, "-x", HX - P, -470, 1000 + 150), onFace(oculus, "+x", HX - P, 470, 1000 + 150));
  out.push(chimney(150, -600, 1150, 1480));

  // B: pale yellow, eaves to the street, a dormer front and back, a tailor's sign
  out.push(rotateZ(roofX(240, HX, 660, 250, { ovx: 0, ovy: 30, gx: 240, gw: HX - P, wall: "Eden_PlasterYellow", barge: false }), 90));
  on(windowGeo(220, 170), "-x", -60, 60);
  out.push(translate(awning(260, 100, 36, "FabricRed", "FabricWhite"), [-HX, -60, 312]));
  on(doorGeo(100, 240), "-x", 140, 0);
  const shears = merge(
    translate(rotateX(torus(9, 2.4, 10, 4, "GoldTrim"), 90), [-12, -2, -22]),
    translate(rotateX(torus(9, 2.4, 10, 4, "GoldTrim"), 90), [12, -2, -22]),
    translate(rotateY(boxBounds([-3, -3, 0], [3, 0, 56], "IronLight"), -22), [-8, 0, -14]),
    translate(rotateY(boxBounds([-3, -3, 0], [3, 0, 56], "IronLight"), 22), [8, 0, -14]),
    sphereCenter(3, [0, -3, 7], "GoldTrim", 6),
  );
  on(hangingSign(shears, { len: 130, bw: 84, bh: 84 }), "-x", -205, 320);
  for (const u of [-115, 115]) on(windowGeo(80, 150, { shutters: true, flowers: u < 0 ? 1 : 4 }), "-x", u, G + 56);
  const dB = dormer(-HX + 6, 0, 670, 130, 240, 110);
  out.push(dB, rotateZ(dB, 180));

  // C: rose, a stepped gable front and back
  const SN = 5, hw = 230, CE = 1060, CR = 440, sh = (CR + 70) / SN, sw = hw / SN, steps: Geo[] = [], cope: Geo[] = [];
  for (let k = 0; k < SN; k++) {
    const w = hw - k * sw, z0 = CE + k * sh, z1 = z0 + sh;
    steps.push(boxBounds([-HX + P, -w, z0], [-HX + P + 34, w, z1], "Eden_PlasterRose"));
    cope.push(boxBounds([-HX + P - 6, -w + (k ? 0 : 6), z1], [-HX + P + 40, w - (k ? 0 : 6), z1 + 9], "StoneWhite", 2));
  }
  const gableC = merge(wuv(merge(...steps)), ...cope, sphereCenter(12, [-HX + P + 17, 0, CE + SN * sh + 21], "StoneWhite", 8));
  const roofC = merge(
    gableC,
    rotateZ(gableC, 180),
    roofX(HX - P - 34, hw, CE, CR, { ovx: 18, ovy: "flush", gx: HX - P - 34, gw: hw, wall: "Eden_PlasterRose", barge: false }),
    onFace(windowGeo(60, 90, { arch: true }), "-x", HX - P, 0, CE + 100),
    onFace(windowGeo(60, 90, { arch: true }), "+x", HX - P, 0, CE + 100),
  );
  out.push(translate(roofC, [0, 470, 0]));
  on(doorGeo(110, 250, { arch: true }), "-x", 570, 0);
  on(windowGeo(110, 150, { flowers: 4 }), "-x", 370, 90);
  on(wallLantern(), "-x", 468, 290);
  for (const u of [360, 560]) {
    on(windowGeo(80, 160, { shutters: true }), "-x", u, G + 56);
    on(windowGeo(80, 160, { shutters: true, flowers: 1 }), "-x", u, 690 + 50);
  }
  out.push(chimney(200, 330, 1180, 1620));

  // the back
  on(doorGeo(96, 230), "+x", -560, 0);
  on(windowGeo(110, 150), "+x", -370, 90);
  on(doorGeo(100, 230), "+x", 120, 0);
  on(windowGeo(110, 150), "+x", -100, 90);
  on(doorGeo(100, 230), "+x", 380, 0);
  on(windowGeo(110, 150), "+x", 575, 90);
  for (const u of [-560, -380, 360, 560]) on(windowGeo(80, 150), "+x", u, G + 56);
  for (const u of [-560, -380]) on(windowGeo(80, 140), "+x", u, 660 + 44);
  for (const u of [360, 560]) on(windowGeo(80, 150), "+x", u, 690 + 50);
  for (const u of [-115, 115]) on(windowGeo(80, 150), "+x", u, G + 56);
  return merge(...out);
}

// ---- the shops ----
// A smith's anvil on a stump with a hammer on its face (the horn to -Y).
function anvil(): Geo {
  return merge(
    cylinderAt({ rBot: 32, rTop: 28, height: 48, segments: 10, bottom: [0, 0, 0] }, "WoodShade"),
    cylinderAt({ radius: 28.5, height: 1, segments: 10, bottom: [0, 0, 48] }, "WoodPale"),
    boxAt([34, 52, 8], [0, 0, 49], "IronDark", 1.5),
    boxAt([20, 30, 16], [0, 0, 57], "IronDark"),
    boxAt([28, 64, 14], [0, 4, 73], "IronDark", 2),
    translate(rotateX(cylinderAt({ rBot: 7, rTop: 1, height: 34, segments: 8, bottom: [0, 0, 0] }, "IronDark"), 90), [0, -28, 80]),
    beamBetween([4, 10, 89], [8, 46, 90], 3.5, 3.5, "WoodWarm"),
    boxAt([10, 8, 9], [3, 8, 87], "IronLight", 1),
  );
}
// A painted round shield facing +Z on z = 0.
function roundShield(r: number, field = "LacquerRed"): Geo {
  return merge(
    cylinderAt({ radius: r, height: 4, segments: 12, bottom: [0, 0, 0] }, field),
    translate(torus(r, 2.5, 14, 4, "IronDark"), [0, 0, 2]),
    sphereCenter(r * 0.24, [0, 0, 4], "GoldTrim", 6),
  );
}
// A timber weapon rack, 160 cm along Y: spears and swords in it, a round shield leaning in front.
function weaponRack(): Geo {
  const out: Geo[] = [];
  for (const y of [-72, 72]) out.push(beamBetween([-22, y, 0], [0, y, 150], 7, 7, "WoodDark"), beamBetween([22, y, 0], [0, y, 150], 7, 7, "WoodDark"));
  out.push(boxBounds([-4, -82, 144], [4, 82, 152], "WoodDark"), boxBounds([-18, -76, 50], [-10, 76, 58], "WoodWarm"), boxBounds([-24, -76, 6], [24, 76, 14], "WoodWarm"));
  for (const [y, h] of [[-52, 205], [-30, 190], [52, 212]] as const)
    out.push(cylinderBetween([-12, y, 14], [-4, y, h], 2.2, 6, "WoodWarm"), translate(scale(cylinderAt({ rBot: 5.5, rTop: 0.3, height: 24, segments: 4, bottom: [0, 0, 0] }, "IronLight"), [0.4, 1, 1]), [-4, y, h]));
  for (const y of [-6, 20]) out.push(translate(rotateX(sword(80), 180), [-16, y, 156]));
  out.push(translate(rotateY(roundShield(34), -72), [-44, -12, 42]));
  return merge(...out);
}

// The weapon shop, 9 m along Y and 9.6 m deep with its smithy: an ashlar ground storey open to
// the street over a stone counter (blades and a shield on the wall inside), a plank shutter
// propped up as a canopy, an anvil and a weapon rack by the door, a shield-and-swords sign; a
// smithy lean-to behind with a glowing hearth under the forge chimney, which glows at the top.
function weaponShop(): Geo {
  const HX = 340, HY = 450, G = 360, E = 680, RH = 330, P = 4, out: Geo[] = [];
  const on = placer(out, HX, HY, G, P);
  const Y0 = -390, Y1 = 10, ZB = 100, ZT = 280, D0 = -HX + 40, D1 = -HX + 170;
  out.push(terrace(HX, HY, G, E, [], { ground: false }));
  const front = rectAt(-HY, HY, 40, G);
  front.holes.push(rectAt(Y0, Y1, ZB, ZT));
  out.push(panel(front, -HX, 40, "StoneLight", { s: 1.1 }));
  out.push(wuv(merge(
    boxBounds([D0, -HY, 40], [D1, Y0, G], "StoneLight"),
    boxBounds([D0, Y1, 40], [D1, HY, G], "StoneLight"),
    boxBounds([D0, Y0, ZT], [D1, Y1, G], "StoneLight"),
    boxBounds([D0, Y0, 40], [D1, Y1, ZB], "StoneLight"),
    boxBounds([D1, -HY, 40], [HX, HY, G], "StoneLight"),
  ), 1.1));
  // the counter, the opening's timbers, the inside
  out.push(
    boxBounds([-HX - 16, Y0 - 4, ZB], [-HX + 60, Y1 + 4, ZB + 10], "WoodWarm", 2),
    boxBounds([-HX - 6, Y0 - 16, ZT], [-HX + 30, Y1 + 16, ZT + 24], "WoodDark", 2),
    boxBounds([-HX - 4, -202, ZB + 10], [-HX + 20, -178, ZT], "WoodDark", 1.5),
    boxBounds([D1 - 4, Y0, ZB], [D1, Y1, ZT], "WoodShade"),
    ...[-300, -100].map((y) => boxBounds([D0, y - 8, ZT - 12], [D1, y + 8, ZT], "WoodDark")),
    translate(crossedSwords(90), [D1 - 6, -300, 200]),
    translate(rotateY(roundShield(34), -90), [D1 - 4, -80, 196]),
    translate(rotateY(sword(70), 0), [D1 - 6, -20, 130]),
    translate(rotateZ(rotateY(sword(70), 90), 20), [-HX + 10, -300, ZB + 14]),
    sphereCenter(16, [-HX + 24, -90, ZB + 10], "IronLight", 10),
    boxBounds([-HX + 6, -92, ZB + 10], [-HX + 10, -88, ZB + 24], "IronLight"),
  );
  // the plank shutter propped up over the counter
  out.push(
    roofUv(beamBetween([-HX - 6, (Y0 + Y1) / 2, ZT + 26], [-HX - 112, (Y0 + Y1) / 2, ZT + 74], Y1 - Y0 + 40, 6, "WoodWarm")),
    ...[Y0 + 10, (Y0 + Y1) / 2, Y1 - 10].map((y) => beamBetween([-HX - 8, y, ZT + 32], [-HX - 110, y, ZT + 79], 6, 4, "WoodDark")),
    ...[Y0 + 30, Y1 - 30].map((y) => cylinderBetween([-HX - 4, y, ZT - 40], [-HX - 100, y, ZT + 70], 1.6, 5, "IronDark")),
  );
  on(doorGeo(110, 250, { arch: true }), "-x", 180, 0);
  out.push(translate(anvil(), [-HX - 70, 60, 0]));
  out.push(translate(weaponRack(), [-HX - 36, 360, 0]));
  const shieldFace = toY(merge(panel(shieldShape(34), -9, 6, "GoldTrim"), panel(shieldShape(30), -11, 2, "Eden_PaintBlue"), panel(crownShape(14), -12, 1, "GoldTrim", { seg: 2 })));
  on(hangingSign(shieldFace, { board: null, core: toY(crossedSwords(78)), len: 150, bw: 90, bh: 80 }), "-x", 300, 340);
  // upper storey
  for (const u of [-300, 0, 300]) on(windowGeo(86, 160, { shutters: true, flowers: u === 0 ? 2 : undefined }), "-x", u, G + 60);
  for (const u of [-300, 300]) on(windowGeo(86, 150, { shutters: true }), "+x", u, G + 60);
  on(windowGeo(86, 150, { shutters: true }), "+x", 0, G + 60);
  // roof, eaves to the street, a dormer
  out.push(rotateZ(roofX(HY, HX, E, RH, { ovx: 0, ovy: 30, gx: HY, gw: HX - P }), 90));
  out.push(dormer(-HX + 10, 0, E + 20, 150, 220));
  // the smithy behind: a lean-to on posts over the hearth, the forge chimney up the back wall
  const CY0 = 120, CY1 = 240, CT = E + RH + 120, cy = (CY0 + CY1) / 2;
  out.push(
    roofUv(beamBetween([HX + 2, 80, 346], [HX + 184, 80, 262], 520, 8, "RoofBlue")),
    boxBounds([HX, -182, 332], [HX + 12, 342, 346], "WoodDark"),
    boxBounds([HX + 150, -176, 250], [HX + 166, 336, 268], "WoodDark"),
    ...[-160, 320].map((y) => boxAt([16, 16, 250], [HX + 158, y, 0], "WoodDark")),
    wuv(merge(boxBounds([HX, CY0 - 14, 0], [HX + 110, CY1 + 14, 80], "StoneLight"), boxBounds([HX, CY0, 200], [HX + 90, CY1, CT], "StoneLight")), 1.1),
    boxBounds([HX + 10, CY0 - 4, 80], [HX + 100, CY1 + 4, 86], "FireGlow"),
    ...[[HX + 40, cy - 25], [HX + 62, cy + 18], [HX + 30, cy + 30], [HX + 80, cy - 10]].map(([x, y]) => sphereCenter(9, [x, y, 86], "FireGlow", 5)),
    ...[CY0 - 14, CY1 + 2].map((y) => boxBounds([HX + 70, y, 80], [HX + 110, y + 12, 160], "StoneLight")),
    translate(rotateZ(cylinderAt({ rBot: 100, rTop: 64, height: 54, segments: 4, bottom: [0, 0, 0] }, "StoneLight"), 45), [HX + 45, cy, 156]),
    boxBounds([HX - 8, CY0 - 8, CT], [HX + 98, CY1 + 8, CT + 16], "StoneGrey", 2),
    boxBounds([HX + 16, CY0 + 16, CT + 4], [HX + 74, CY1 - 16, CT + 17], "FireGlow"),
    sphereCenter(5, [HX + 40, cy, CT + 40], "FireGlow", 5),
    sphereCenter(4, [HX + 56, cy - 14, CT + 66], "FireGlow", 5),
    sphereCenter(3, [HX + 34, cy + 10, CT + 92], "FireGlow", 5),
    translate(barrel(), [HX + 110, -40, 0]),
    cylinderAt({ radius: 26, height: 1, segments: 12, bottom: [HX + 110, -40, 78] }, "Eden_Water"),
    // bellows on a stand by the hearth
    boxAt([60, 44, 56], [HX + 60, CY1 + 60, 0], "WoodShade", 2),
    hullGeo([[HX + 30, CY1 + 44, 58], [HX + 30, CY1 + 76, 58], [HX + 90, CY1 + 50, 58], [HX + 90, CY1 + 70, 58], [HX + 30, CY1 + 44, 76], [HX + 30, CY1 + 76, 76], [HX + 90, CY1 + 56, 62], [HX + 90, CY1 + 64, 62]], "FeltRed"),
    cylinderBetween([HX + 30, CY1 + 60, 64], [HX + 14, CY1 + 20, 74], 3, 6, "IronDark"),
  );
  on(doorGeo(100, 230), "+x", -60, 0);
  on(windowGeo(90, 120), "+x", -300, 110);
  return merge(...out);
}

// The tool shop (potions and sundries), 7.2 m deep and 7 m along Y: a projecting shop window
// crammed with glowing bottles under a purple-and-white awning, a sign with a red flask, a
// shuttered plaster storey, a hipped blue roof with a dormer and a chimney.
function toolShop(): Geo {
  const HX = 360, HY = 350, G = 340, E = 680, P = 4, out: Geo[] = [];
  const on = placer(out, HX, HY, G, P);
  out.push(terrace(HX, HY, G, E, []));
  const goods: Geo[] = [];
  for (let k = 0; k < 4; k++) {
    const z = k * 52;
    if (k) goods.push(boxBounds([-46, -140, z - 4], [-2, 140, z], "WoodPale"));
    for (let i = 0; i < 8; i++) {
      const kind = (i + k) % 3;
      goods.push(translate(bottle(kind, POTIONS[(i * 3 + k) % 5], kind === 1 ? 1.3 : 1.15), [-26 + ((i + k) % 2) * 10, -122 + i * 34 + (k % 2) * 8, z]));
    }
  }
  on(displayWindow(290, 200, 52, "Eden_PaintBlue", merge(...goods)), "-x", -70, 76);
  out.push(translate(awning(320, 100, 32, "FabricPurple", "FabricWhite"), [-HX - 10, -70, G + 26]));
  on(doorGeo(100, 240, { arch: true }), "-x", 240, 0);
  const flask = toY(merge(
    panel(flaskShape(30), -2, 2, "GoldTrim"),
    panel(flaskShape(26), -4, 2, "Eden_PotionRed"),
    panel(rectAt(-11, 11, 44, 58), -5, 3, "WoodWarm"),
    panel(circleShape(6, -10, 8), -5, 1, "Eden_PaintWhite"),
  ));
  on(hangingSign(translate(flask, [0, 0, -12]), { len: 130, bw: 90, bh: 100 }), "-x", -300, 330);
  out.push(translate(barrel(), [-HX - 46, -300, 0]));
  out.push(shrub({ seed: 47, leaf: 13, ragged: 0.5, core: 0.8, lobes: [[-HX - 52, -312, 90, 16, 16, 13], [-HX - 39, -286, 88, 14, 14, 11], [-HX - 46, -300, 98, 12, 12, 10]], flowers: { cells: [FC.marigold], n: 4, size: 10 } }));
  // upper storey and the back
  for (const u of [-210, 210]) on(windowGeo(80, 160, { shutters: true, flowers: u < 0 ? 0 : 3 }), "-x", u, G + 56);
  on(windowGeo(90, 180, { arch: true, flowers: 4 }), "-x", 0, G + 50);
  on(doorGeo(100, 230), "+x", -180, 0);
  on(windowGeo(110, 140), "+x", 150, 100);
  for (const u of [-180, 160]) on(windowGeo(80, 150, { shutters: true }), "+x", u, G + 56);
  // the roof
  out.push(hipRoof(HX, HY, E, 320, 30, 0));
  out.push(dormer(-HX + 10, 0, E + 20, 140, 200));
  out.push(chimney(150, 200, E + 150, E + 410));
  return merge(...out);
}

// A small two-storey cafe and bakery, 7.2 m deep and 6.6 m along Y, its gable to the street: a
// painted blue shop front with a window of loaves and cakes under a red-and-white awning, a
// golden pretzel on a scrolled bracket, a chalk menu board and pots of flowers by the door.
function pretzel(s: number): Geo {
  const P: V3[] = [[-16, -4, -18], [-7, -4, -5], [0, -5, 6], [8, -3, 16], [18, 0, 24], [30, 0, 20], [35, 0, 6], [30, 0, -12], [17, 0, -24], [0, 0, -28], [-17, 0, -24], [-30, 0, -12], [-35, 0, 6], [-30, 0, 20], [-18, 0, 24], [-8, 3, 16], [0, 5, 6], [7, 4, -5], [16, 4, -18]];
  return tube(P.map(([x, y, z]): V3 => [x * s, y * s, z * s]), 5.5 * s, "GoldTrim", 64, 6);
}
function cafe(): Geo {
  const HX = 360, HY = 330, G = 360, E = 680, RH = 380, P = 4, out: Geo[] = [];
  const on = placer(out, HX, HY, G, P);
  out.push(terrace(HX, HY, G, E, []));
  // the painted shop front
  out.push(
    boxBounds([-HX - 12, -HY + 2, 292], [-HX, HY - 2, 346], "Eden_PaintBlue", 2),
    boxBounds([-HX - 15, -HY + 2, 346], [-HX, HY - 2, 352], "GoldTrim"),
    boxBounds([-HX - 15, -HY + 2, 288], [-HX, HY - 2, 292], "GoldTrim"),
  );
  for (const [y, w] of [[-120, 22], [-92, 16], [-70, 26], [-36, 14], [-14, 22], [20, 18], [44, 26], [78, 16], [100, 22]] as const) out.push(boxBounds([-HX - 13.5, y, 306], [-HX - 12, y + w, 332], "GoldTrim"));
  for (const y of [-HY + 2, -46, HY - 30]) out.push(boxBounds([-HX - 14, y, 0], [-HX, y + 28, 292], "Eden_PaintBlue", 1.5), boxBounds([-HX - 18, Math.max(-HY, y - 3), 0], [-HX, Math.min(HY, y + 31), 26], "Eden_PaintBlue", 1.5));
  // the window of bread and cakes
  const goods: Geo[] = [boxBounds([-38, -112, 52], [-2, 112, 56], "WoodPale"), boxBounds([-38, -112, 104], [-2, 112, 108], "WoodPale")];
  for (let i = 0; i < 5; i++) goods.push(translate(scale(sphereCenter(14, [0, 0, 0], "Eden_Bread", 8), [0.8, 1.3, 0.62]), [-20, -88 + i * 44, 3]));
  for (let i = 0; i < 4; i++) {
    const y = -78 + i * 52;
    goods.push(
      cylinderAt({ radius: 15, height: 13, segments: 10, bottom: [-20, y, 56] }, i % 2 ? "Eden_Bread" : "FeltCream"),
      cylinderAt({ radius: 15.6, height: 3, segments: 10, bottom: [-20, y, 69] }, i % 2 ? "FeltCream" : "Eden_FlowerPink"),
      sphereCenter(3, [-20, y, 74], "Eden_Apple", 5),
    );
  }
  for (let i = 0; i < 6; i++) goods.push(translate(scale(sphereCenter(8, [0, 0, 0], "Eden_Bread", 6), [1, 1.4, 0.7]), [-20 + (i % 2) * 6, -95 + i * 38, 113]));
  on(displayWindow(230, 160, 40, "Eden_PaintBlue", merge(...goods)), "-x", -168, 70);
  out.push(translate(awning(250, 110, 34, "FabricRed", "FabricWhite"), [-HX - 12, -168, 286]));
  on(doorGeo(110, 240, { frame: "Eden_PaintBlue" }), "-x", 130, 0);
  for (const y of [30, 230]) out.push(cylinderAt({ rBot: 13, rTop: 17, height: 30, segments: 8, bottom: [-HX - 30, y, 0] }, "Eden_Terracotta"), translate(blooms(26, 2, y === 30 ? 0 : 1, 8), [-HX - 30, y, 26]));
  // the menu board
  const leaf = rotateY(merge(boxBounds([-2, -30, 0], [2, 30, 92], "WoodPale"), boxBounds([-3, -25, 8], [-2, 25, 84], "Eden_Chalk"), ...[70, 56, 42, 28].map((z, i) => boxBounds([-3.5, -18, z], [-3, 18 - i * 6, z + 2.5], "Eden_PaintWhite"))), 12, [0, 0, 92]);
  out.push(translate(rotateZ(merge(leaf, rotateZ(leaf, 180)), -15), [-HX - 90, -250, -2]));
  // the pretzel and the upper storey
  on(hangingSign([], { board: null, core: pretzel(1.25), len: 130, bw: 70, bh: 70 }), "-x", 300, 420);
  for (const u of [-150, 150]) on(windowGeo(86, 160, { shutters: true, flowers: u < 0 ? 0 : 3 }), "-x", u, G + 50);
  on(windowGeo(70, 110, { arch: true }), "-x", 0, E + 40);
  // the back
  on(doorGeo(100, 230), "+x", -150, 0);
  on(windowGeo(110, 140), "+x", 120, 100);
  for (const u of [-150, 150]) on(windowGeo(86, 150, { shutters: true }), "+x", u, G + 50);
  on(windowGeo(70, 110, { arch: true }), "+x", 0, E + 40);
  // the roof, gable to the street, and the oven chimney
  out.push(roofX(HX, HY, E, RH, { ovx: 30, ovy: "flush", gx: HX - P, gw: HY }));
  out.push(chimney(200, -170, E + 150, E + 450));
  return merge(...out);
}

// ---- the guild ----
// The adventurers' guild, 13 m along Y and 9.8 m deep: three storeys behind a two-storey porch
// of four marble columns under a pediment with the guild's badge, blue banners, red guild flags
// on the corners, a hipped roof with dormers and a clock and bell turret on the ridge.
function guildHall(): Geo {
  const HX = 360, HY = 650, G = 380, F2 = 720, E = 1080, RH = 380, P = 4, out: Geo[] = [];
  const on = placer(out, HX, HY, G, P);
  out.push(terrace(HX, HY, G, E, [F2]));
  // the porch: podium and steps, columns, entablature, pediment
  const PX = -HX - 180, PY = 300, TOP = 600;
  out.push(
    wuv(boxBounds([PX - 10, -PY - 20, 0], [-HX, PY + 20, 50], "StoneLight", 3), 1.1),
    boxBounds([PX - 70, -PY, 0], [PX - 10, PY, 17], "StoneGrey", 2),
    boxBounds([PX - 40, -PY, 17], [PX - 10, PY, 34], "StoneGrey", 2),
    boxBounds([PX - 6, -PY + 8, TOP], [-HX, PY - 8, TOP + 32], "StoneLight"),
    boxBounds([PX - 2, -PY + 4, TOP + 32], [-HX, PY - 4, TOP + 68], "StoneWhite"),
    boxBounds([PX - 3, -200, TOP + 40], [PX - 2, 200, TOP + 60], "Eden_PaintBlue"),
    boxBounds([PX - 14, -PY - 8, TOP + 68], [-HX, PY + 8, TOP + 84], "StoneLight", 3),
    gableRoof([200, 2 * PY + 16, 16], [PX + 90, 0, TOP + 84], 150, 14, "RoofBlue"),
    ridge([PX - 24, 0, TOP + 84 + 150 + 20], [-HX, 0, TOP + 84 + 150 + 20], 9),
    gableWall(PX - 2, PY + 4, TOP + 84, 146, "StoneWhite"),
    translate(guildBadge(40), [PX - 2, 0, TOP + 150]),
  );
  for (let i = -6; i <= 6; i += 2) out.push(boxBounds([PX - 3.5, i * 26 - 9, TOP + 44], [PX - 2, i * 26 + 9 + (i % 4 ? 6 : 0), TOP + 56], "GoldTrim"));
  for (const s of [-1, 1]) out.push(beamBetween([PX - 8, s * (PY + 16), TOP + 86], [PX - 8, 0, TOP + 84 + 156], 12, 14, "StoneLight"));
  for (const y of [-255, -85, 85, 255]) {
    const x = PX + 40;
    out.push(
      boxAt([58, 58, 14], [x, y, 50], "StoneLight", 2),
      cylinderAt({ rBot: 27, rTop: 25, height: 8, segments: 12, bottom: [x, y, 64] }, "StoneLight"),
      cylinderAt({ rBot: 24, rTop: 21, height: 506, segments: 12, bottom: [x, y, 72] }, "MarbleWhite"),
      cylinderAt({ rBot: 21, rTop: 29, height: 10, segments: 12, bottom: [x, y, 578] }, "StoneLight"),
      boxAt([64, 64, 12], [x, y, 588], "StoneLight", 2),
    );
  }
  // hanging lanterns in the porch
  for (const y of [-170, 170]) out.push(cylinderBetween([PX + 90, y, TOP], [PX + 90, y, TOP - 60], 1.2, 4, "IronDark"), translate(lantern(), [PX + 90, y, TOP - 104]));
  // the front
  on(doorGeo(160, 300, { arch: true, double: true, step: false }), "-x", 0, 50);
  for (const s of [-1, 1]) {
    on(windowGeo(100, 200, { arch: true }), "-x", s * 170, 120);
    on(windowGeo(90, 210, { arch: true }), "-x", s * 170, G + 60);
    on(windowGeo(80, 150, { shutters: false }), "-x", s * 170, 830);
    for (const u of [400, 540]) {
      on(windowGeo(90, 170, { flowers: u === 400 ? (s < 0 ? 0 : 3) : undefined }), "-x", s * u, 110);
      on(windowGeo(90, 200, { arch: true, flowers: u === 400 ? 1 : undefined }), "-x", s * u, G + 60);
      on(windowGeo(90, 160), "-x", s * u, 800);
    }
    out.push(translate(bannerGeo(90, 260), [-HX - 8, s * 285, 1040]));
    out.push(onFace(wallLantern(), "-x", HX, s * 470, 330));
    // the guild flags on the corners
    const pole = merge(cylinderBetween([0, 0, 0], [-190, 0, 170], 3, 6, "WoodDark"), sphereCenter(6, [-192, 0, 172], "GoldTrim", 6), boxBounds([-2, -8, -20], [4, 8, 20], "IronDark"));
    out.push(translate(merge(pole, sheet([-60, 0, 54], [-176, 0, 158], [-136, 0, -10], 8, "FabricRed", 4), sheet([-176, 0, 158], [-136, 0, -10], [-176, 0, 30], 6, "FabricRed", 3)), [-HX + P, s * 605, 880]));
  }
  out.push(onFace(guildBadge(70), "-x", HX - P, 0, 960));
  // the back
  on(doorGeo(140, 270, { arch: true, double: true }), "+x", 0, 0);
  for (const u of [-470, -220, 220, 470]) {
    on(windowGeo(90, 170), "+x", u, 110);
    on(windowGeo(90, 190, { arch: true }), "+x", u, G + 60);
    on(windowGeo(90, 160), "+x", u, 800);
  }
  on(windowGeo(90, 190, { arch: true }), "+x", 0, G + 60);
  on(windowGeo(90, 160), "+x", 0, 800);
  // the roof, dormers, chimneys
  out.push(hipRoof(HX, HY, E, RH, 30, 0));
  for (const s of [-1, 1]) {
    const d = dormer(-HX + 10, s * 330, E + 30, 140, 200);
    out.push(d, rotateZ(d, 180));
    out.push(chimney(150, s * 420, E + 150, E + 470));
  }
  // the clock and bell turret on the ridge
  const TZ = E + 22 + RH, tw: Geo[] = [
    boxBounds([-110, -110, E + 200], [110, 110, TZ + 220], "Eden_Plaster"),
    boxBounds([-118, -118, TZ + 10], [118, 118, TZ + 24], "StoneWhite", 2),
    boxBounds([-122, -122, TZ + 210], [122, 122, TZ + 236], "StoneWhite", 3),
    boxBounds([-104, -104, TZ + 236], [104, 104, TZ + 244], "StoneLight"),
    boxBounds([-124, -124, TZ + 420], [124, 124, TZ + 444], "StoneWhite", 3),
    boxBounds([-108, -108, TZ + 396], [108, 108, TZ + 420], "StoneLight"),
    rotateZ(cylinderAt({ rBot: 170, rTop: 3, height: 340, segments: 8, bottom: [0, 0, TZ + 444] }, "RoofBlue"), 22.5),
    sphereCenter(12, [0, 0, TZ + 786], "GoldTrim", 8),
    cylinderBetween([0, 0, TZ + 780], [0, 0, TZ + 900], 2.5, 6, "IronDark"),
    sheet([0, 0, TZ + 896], [0, 0, TZ + 850], [-110, 0, TZ + 874], 6, "FabricRed", 3),
    beamBetween([0, -70, TZ + 390], [0, 70, TZ + 390], 8, 8, "WoodDark"),
    translate(bell(34), [0, 0, TZ + 386]),
  ];
  for (const [x, y] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    tw.push(boxBounds([x * 104 - 22, y * 104 - 22, TZ + 244], [x * 104 + 22, y * 104 + 22, TZ + 396], "StoneWhite", 2));
    tw.push(boxBounds([x * 110 - 16, y * 110 - 16, E + 220], [x * 110 + 16, y * 110 + 16, TZ + 210], "StoneWhite"));
  }
  for (const f of ["-x", "+x", "-y", "+y"] as const) {
    tw.push(onFace(clockFace(62), f, 110, 0, TZ + 120));
    tw.push(onFace(merge(panel(rectAt(-60, 60, TZ + 370, TZ + 396), -6, 6, "StoneLight"), boxBounds([-12, -64, TZ + 244], [0, 64, TZ + 256], "StoneLight")), f, 104, 0, 0));
  }
  out.push(...tw);
  return merge(...out);
}

// ---- the harbour ----
// The harbour warehouse, exactly 12 m along Y and 7.7 m deep: an ashlar ground storey with two
// great arched double doors onto a timber loading platform, a half-timbered upper storey, a
// hoist gable with loft doors, a hoist beam with a pulley and a crate on the rope, crates,
// barrels and sacks, an anchor sign, lanterns; gable ends flat at ±Y.
function warehouse(): Geo {
  const HX = 290, HY = 600, G = 360, E = 640, RH = 300, P = 4, out: Geo[] = [];
  const on = placer(out, HX, HY, G, P);
  out.push(terrace(HX, HY, G, E, [], { pilasters: false }));
  // half-timbering on the upper storey, front and back
  const tim: Geo[] = [];
  const posts = [-593, -450, -300, -150, 150, 300, 450, 593];
  for (const y of posts) tim.push(boxBounds([-HX - 1, y - 7, G + 12], [-HX + P, y + 7, E - 24], "WoodDark"));
  for (const [a, b] of [[-593, -450], [450, 593]]) tim.push(beamBetween([-HX - 0.5, a + 7, G + 14], [-HX - 0.5, b - 7, E - 26], 5, 12, "WoodDark"));
  for (const [a, b] of [[-450, -300], [300, 450]]) tim.push(beamBetween([-HX - 0.5, a + 7, E - 26], [-HX - 0.5, b - 7, G + 14], 5, 12, "WoodDark"));
  const timber = merge(...tim);
  out.push(timber, rotateZ(timber, 180));
  for (const s of [-1, 1]) for (const u of [225, 375]) {
    on(windowGeo(66, 100, { frame: "WoodDark" }), "-x", s * u, G + 90);
    on(windowGeo(66, 100, { frame: "WoodDark" }), "+x", s * u, G + 90);
  }
  // the great doors on the platform, lanterns, the anchor sign
  for (const s of [-1, 1]) {
    on(doorGeo(230, 270, { arch: true, double: true, step: false }), "-x", s * 300, 60);
    on(wallLantern(), "-x", s * 140, 300);
  }
  const anchor = merge(
    translate(rotateY(torus(9, 2.4, 10, 4, "GoldTrim"), 90), [-8, 0, 36]),
    boxBounds([-9, -3, -28], [-6, 3, 28], "GoldTrim"),
    boxBounds([-9, -18, 14], [-6, 18, 19], "GoldTrim"),
    translate(rotateY(torus(24, 3, 14, 4, "GoldTrim"), 90), [-8, 0, -6]),
  );
  on(merge(boxBounds([-6, -66, -44], [0, 66, 44], "WoodDark", 1.5), boxBounds([-7, -60, -38], [-6, 60, 38], "Eden_PaintBlue"), boxBounds([-12, -60, 20], [-6, 60, 30], "Eden_PaintBlue"), translate(scale(anchor, [1, 0.9, 0.62]), [-2, 0, 4])), "-x", 0, 250);
  // the loading platform and its steps
  const PX0 = -HX - 180;
  for (let i = 0; i < 8; i++) out.push(boxBounds([PX0 + i * 22.5 + 1, -560, 50], [PX0 + (i + 1) * 22.5 - 0.5, 560, 60], "WoodGrey"));
  out.push(boxBounds([PX0 - 4, -560, 26], [PX0 + 10, 560, 50], "WoodDark"));
  for (let y = -540; y <= 540; y += 154) out.push(boxAt([16, 16, 50], [PX0 + 6, y, 0], "WoodDark"));
  out.push(boxBounds([PX0, -600, 0], [-HX, -580, 20], "StoneGrey", 2), boxBounds([PX0, -580, 0], [-HX, -560, 40], "StoneGrey", 2));
  for (const y of [-560, 560]) out.push(boxBounds([PX0, y - (y < 0 ? 0 : 6), 26], [-HX, y + (y < 0 ? 6 : 0), 60], "WoodDark"));
  // goods on the platform
  out.push(
    translate(crate(80, 80, 72), [-HX - 90, -500, 60]),
    translate(rotateZ(crate(60, 60, 54), 14), [-HX - 92, -496, 132]),
    translate(barrel(), [-HX - 50, -80, 60]),
    translate(barrel(), [-HX - 50, 80, 60]),
    translate(rotateZ(sack(30), 80), [-HX - 70, 500, 60]),
    translate(rotateZ(sack(28), 100), [-HX - 130, 490, 60]),
    translate(rotateZ(sack(26), 90), [-HX - 100, 500, 100]),
  );
  // the hoist gable: loft doors, the beam, pulley, rope and a crate in the air
  const HG = 150, HZ = E + 180;
  out.push(
    boxBounds([-HX + P, -HG, E - 24], [-HX + 220, HG, HZ], "Eden_Plaster"),
    boxBounds([-HX + P - 2, -HG, E - 24], [-HX + 220, -HG + 14, HZ], "WoodDark"),
    boxBounds([-HX + P - 2, HG - 14, E - 24], [-HX + 220, HG, HZ], "WoodDark"),
    boxBounds([-HX + P - 2, -HG, HZ - 14], [-HX + 8, HG, HZ], "WoodDark"),
    gableRoof([250, 2 * HG, 16], [-HX + 95, 0, HZ], 120, 18, "RoofBlue"),
    ridge([-HX - 30, 0, HZ + 140], [-HX + 220, 0, HZ + 140], 9),
    gableWall(-HX + P, HG, HZ, 116, "Eden_Plaster"),
    boxBounds([-HX + P - 4, -56, E + 40], [-HX + P, 56, HZ - 20], "DoorWood"),
    boxBounds([-HX + P - 5, -1.5, E + 40], [-HX + P - 4, 1.5, HZ - 20], "WoodDark"),
    ...[E + 64, HZ - 50].map((z) => boxBounds([-HX + P - 6, -50, z], [-HX + P - 4, 50, z + 7], "IronDark")),
    boxBounds([-HX + P - 8, -64, E + 30], [-HX + P, 64, E + 40], "WoodDark"),
  );
  for (const s of [-1, 1]) out.push(beamBetween([-HX - 18, s * (HG + 18), HZ - 14], [-HX - 18, 0, HZ + 116], 6, 18, "Eden_PaintWhite"));
  const BZ = HZ + 70, PXh = -HX - 150;
  out.push(
    boxBounds([PXh - 20, -9, BZ], [-HX + 40, 9, BZ + 18], "WoodDark", 1.5),
    beamBetween([-HX + 2, 0, HZ - 10], [-HX - 70, 0, BZ + 2], 9, 9, "WoodDark"),
    boxBounds([PXh - 9, -8, BZ - 30], [PXh + 9, -5, BZ], "IronDark"),
    boxBounds([PXh - 9, 5, BZ - 30], [PXh + 9, 8, BZ], "IronDark"),
    translate(rotateX(torus(12, 3, 12, 5, "WoodWarm"), 90), [PXh, 0, BZ - 18]),
    cylinderBetween([PXh, -8, BZ - 18], [PXh, 8, BZ - 18], 3, 6, "IronDark"),
    cylinderBetween([PXh - 14, 0, BZ - 18], [PXh - 14, 0, 290], 1.5, 5, "RopeTan"),
    cylinderBetween([PXh + 4, 0, BZ - 6], [-HX + P, 0, E + 120], 1.5, 5, "RopeTan"),
    translate(rotateY(torus(6, 1.6, 8, 4, "IronDark"), 90), [PXh - 14, 0, 284]),
    translate(crate(70, 70, 64), [PXh - 14, 0, 196]),
  );
  for (const [dx, dy] of [[-30, -30], [-30, 30], [30, -30], [30, 30]]) out.push(cylinderBetween([PXh - 14, 0, 280], [PXh - 14 + dx, dy, 260], 1.2, 4, "RopeTan"));
  // the back: a door and barred windows below
  on(doorGeo(110, 240), "+x", -300, 0);
  for (const u of [0, 300]) on(windowGeo(80, 80), "+x", u, 180);
  // the main roof, eaves front and back
  out.push(rotateZ(roofX(HY, HX, E, RH, { ovx: 0, ovy: 30, gx: HY, gw: HX - P }), 90));
  return merge(...out);
}

// ---- garden pieces and street furniture ----
// A cafe table for the street: a round marble top on an iron stem, two bistro chairs, a striped parasol.
function cafeTable(): Geo {
  const out: Geo[] = [
    cylinderAt({ rBot: 26, rTop: 22, height: 4, segments: 10, bottom: [0, 0, 0] }, "IronDark"),
    cylinderAt({ rBot: 6, rTop: 3.5, height: 68, segments: 8, bottom: [0, 0, 4] }, "IronDark"),
    cylinderAt({ radius: 40, height: 4, segments: 14, bottom: [0, 0, 72] }, "MarbleWhite"),
    translate(torus(40, 1.6, 16, 4, "GoldTrim"), [0, 0, 74]),
    cylinderAt({ radius: 2.6, height: 240, segments: 6, bottom: [0, 0, 4] }, "WoodPale"),
    sphereCenter(4.5, [0, 0, 246], "GoldTrim", 6),
    cylinderAt({ radius: 7, height: 1, segments: 8, bottom: [14, -14, 76] }, "Eden_PaintWhite"),
    cylinderAt({ rBot: 3.5, rTop: 4.5, height: 7, segments: 8, bottom: [14, -14, 77] }, "Eden_PaintWhite"),
    cylinderAt({ radius: 7, height: 1, segments: 8, bottom: [-12, 16, 76] }, "Eden_PaintWhite"),
    cylinderAt({ rBot: 3.5, rTop: 4.5, height: 7, segments: 8, bottom: [-12, 16, 77] }, "Eden_PaintWhite"),
    cylinderAt({ rBot: 3, rTop: 2, height: 10, segments: 6, bottom: [-16, -16, 76] }, "GlassBlue"),
    vaseRose([-16, -16, 85]),
  ];
  const n = 8, R = 125, zr = 214, zt = 250;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2, m = (a + b) / 2;
    out.push(sheet([0, 0, zt], [R * Math.cos(a), R * Math.sin(a), zr], [R * Math.cos(b), R * Math.sin(b), zr], -3, i % 2 ? "FabricWhite" : "FabricRed", 2));
    out.push(translate(rotateZ(box([3, 2 * R * Math.sin(Math.PI / n) * 0.96, 14], [0, 0, 0], i % 2 ? "FabricWhite" : "FabricRed"), (m * 180) / Math.PI), [R * 0.93 * Math.cos(m), R * 0.93 * Math.sin(m), zr - 6]));
    out.push(cylinderBetween([0, 0, zt - 6], [R * 0.98 * Math.cos(a), R * 0.98 * Math.sin(a), zr - 2], 1, 4, "WoodPale"));
  }
  const chair = merge(
    cylinderAt({ radius: 20, height: 4, segments: 10, bottom: [0, 0, 42] }, "WoodPale"),
    translate(torus(20, 1.4, 12, 4, "IronDark"), [0, 0, 43]),
    ...[[-14, -14], [-14, 14], [14, -14], [14, 14]].map(([x, y]) => cylinderBetween([x * 1.2, y * 1.2, 0], [x * 0.8, y * 0.8, 42], 1.4, 4, "IronDark")),
    translate(rotateY(torus(15, 1.6, 12, 4, "IronDark"), 90), [19, 0, 76]),
    ...[-12, 12].map((y) => cylinderBetween([17, y, 44], [19, y, 66], 1.4, 4, "IronDark")),
    boxBounds([16, -10, 64], [20, 10, 82], "WoodPale"),
  );
  out.push(translate(rotateZ(chair, -90), [0, -72, 0]), translate(rotateZ(chair, 95), [6, 72, 0]));
  return merge(...out);
}

// A 400 cm length of clipped box hedge along Y on a low stone kerb; tiles end to end. The hedge
// is a clipped profile run along Y that bulges in and out in waves repeating every 400 cm (so
// the ends of neighbouring pieces meet), its face a mat of small leaves, with leaf sprays
// standing out of it along the top and down the sides.
function hedge(): Geo {
  const L = 200, rnd = rng(23);
  const prism = (pts: [number, number][], mat: string): Geo => hullGeo(pts.flatMap(([x, z]): V3[] => [[x, -L, z], [x, L, z]]), mat);
  const out: Geo[] = [prism([[-50, 0], [50, 0], [50, 14], [45, 20], [-45, 20], [-50, 14]], "StoneLight")];
  const prof: [number, number][] = [[-39, 18], [-40, 48], [-40, 78], [-38, 102], [-33, 118], [-21, 127], [0, 129], [21, 127], [33, 118], [38, 102], [40, 78], [40, 48], [39, 18]];
  const nrm = prof.map((_, j) => {
    const a = prof[Math.max(0, j - 1)], b = prof[Math.min(prof.length - 1, j + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
    return [dz / l, -dx / l];
  });
  const waves = Array.from({ length: 4 }, (_, m) => ({ m: m + 1, ph: rnd() * 6.28, tw: 0.5 + rnd() * 0.8, a: 4.2 / (1 + m * 0.7) }));
  const bulge = (y: number, j: number) => {
    const t = ((y + L) / (2 * L)) * Math.PI * 2, top = prof[j][1] > 100 ? 1.25 : prof[j][1] < 30 ? 0.3 : 1;
    return top * waves.reduce((sum, w) => sum + w.a * Math.sin(w.m * t + w.ph + j * w.tw), 0);
  };
  const at = (y: number, j: number): V3 => {
    const d = bulge(y, j);
    return [prof[j][0] + nrm[j][0] * d, y, prof[j][1] + nrm[j][1] * d];
  };
  const NY = 16, NP = prof.length, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  let arc = 0;
  const arcs = prof.map((p, j) => (arc += j ? Math.hypot(p[0] - prof[j - 1][0], p[1] - prof[j - 1][1]) : 0));
  for (let i = 0; i <= NY; i++)
    for (let j = 0; j < NP; j++) {
      const y = -L + (2 * L * i) / NY;
      pos.push(...at(y, j));
      uv.push(y / 70, arcs[j] / 70);
    }
  const topIdx: number[] = [];
  for (let i = 0; i < NY; i++)
    for (let j = 0; j < NP - 1; j++) {
      const a = i * NP + j, b = a + NP;
      (j >= 4 && j < 8 ? topIdx : idx).push(a, a + 1, b + 1, a, b + 1, b);
    }
  // the ends, closed with a fan
  for (const [i, flip] of [[0, true], [NY, false]] as const) {
    const c = pos.length / 3;
    pos.push(0, -L + (2 * L * i) / NY, 70);
    uv.push(0, 0);
    for (let j = 0; j < NP - 1; j++) idx.push(...(flip ? [c, i * NP + j + 1, i * NP + j] : [c, i * NP + j, i * NP + j + 1]));
  }
  // (the sunlit top a lighter green than the sides)
  for (const [list, mat] of [[idx, "Eden_Hedge"], [topIdx, "Eden_HedgeTop"]] as const) {
    const body = new THREE.BufferGeometry();
    body.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    body.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    body.setIndex([...idx, ...topIdx]);
    body.computeVertexNormals();
    body.setIndex(list);
    out.push([{ geo: body.toNonIndexed(), mat }]);
  }
  // leaf sprays standing out of it, thickest along the top (inside the kerb's footprint)
  const cards = new Cards();
  cards.clip = { min: [-50, -L, 0], max: [50, L, 136] };
  for (let k = 0; k < 250; k++) {
    const y = -L + 6 + rnd() * (2 * L - 12);
    const t = rnd() < 0.6 ? 3.5 + rnd() * 5 : 1 + rnd() * 10, j = Math.floor(t), f = t - j;
    const p0 = at(y, j), p1 = at(y, j + 1), n = new THREE.Vector3(nrm[j][0] * (1 - f) + nrm[j + 1][0] * f, 0, nrm[j][1] * (1 - f) + nrm[j + 1][1] * f).normalize();
    const lift = 2 + rnd() * 5;
    const c: V3 = [p0[0] + (p1[0] - p0[0]) * f + n.x * lift, y, p0[2] + (p1[2] - p0[2]) * f + n.z * lift];
    const face = n.clone().add(new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.9)).normalize();
    const sun = 0.55 * (n.z * 0.5 + 0.5) + 0.4 * (c[2] / 131) + 0.25 * (rnd() - 0.5);
    cards.facing(sun < 0.42 ? "LeafCardDark" : sun < 0.68 ? "LeafCard" : "LeafCardLight", c, face, rnd() * 6.28, 17 + rnd() * 8, 17 + rnd() * 8, n.clone().multiplyScalar(0.7).add(SKY.clone().multiplyScalar(0.6)).normalize());
  }
  return merge(...out, cards.geo());
}

// A clipped ball of box on a stem in a white stone urn, 1.25 m.
function topiary(): Geo {
  return merge(
    boxAt([54, 54, 10], [0, 0, 0], "StoneGrey", 2),
    cylinderAt({ rBot: 16, rTop: 11, height: 14, segments: 10, bottom: [0, 0, 10] }, "StoneWhite"),
    cylinderAt({ rBot: 12, rTop: 29, height: 28, segments: 12, bottom: [0, 0, 24] }, "StoneWhite"),
    translate(torus(21, 2.2, 12, 4, "StoneLight"), [0, 0, 36]),
    translate(torus(29, 3.5, 14, 5, "StoneWhite"), [0, 0, 52]),
    cylinderAt({ radius: 27, height: 2, segments: 12, bottom: [0, 0, 50] }, "Eden_Soil"),
    cylinderAt({ rBot: 4, rTop: 3, height: 26, segments: 6, bottom: [0, 0, 52] }, "BarkWarm"),
    shrub({ seed: 33, lobes: [[0, 0, 98, 25, 25, 24]], leaf: 14, ragged: 0.12, core: 0.94, coreDetail: 1, density: 1.1, sun: 0.04, look: { core: "Eden_Hedge", dark: "LeafCardDark", mid: "LeafCard", light: "LeafCardLight" } }),
    urnMoss(),
  );
}
// low leaves over the soil in the urn round the stem
function urnMoss(): Geo {
  const cards = new Cards(), rnd = rng(35);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + rnd() * 0.5, d = 9 + rnd() * 10;
    cards.facing(i % 2 ? "LeafCardDark" : "LeafCard", [Math.cos(a) * d, Math.sin(a) * d, 54 + rnd() * 2], new THREE.Vector3(Math.cos(a) * 0.4, Math.sin(a) * 0.4, 1), rnd() * 6.28, 20, 20, SKY);
  }
  return cards.geo();
}

// A round flower bed, 3 m across: a stone kerb, soil, rings of mixed flowers round a little
// flowering shrub.
function flowerBed(): Geo {
  const cards = new Cards(), rnd = rng(9);
  const out: Geo[] = [
    ring(150, 22, 0, "StoneLight", 16),
    translate(torus(145, 8, 24, 5, "StoneWhite"), [0, 0, 24]),
    cylinderAt({ radius: 140, height: 5, segments: 16, bottom: [0, 0, 22] }, "Eden_Soil"),
    scale(sphereCenter(70, [0, 0, 22], "Eden_Soil", 10), [1, 1, 0.3], [0, 0, 22]),
  ];
  // three bands of flowers, each two staggered rows of clumps, leaning out toward the kerb
  const bands: [number, number, number[], number][] = [[118, 26, [FC.roseRed, FC.roseRed, FC.daisy], 34], [87, 29, [FC.buttercup, FC.marigold], 26], [58, 35, [FC.cosmosPink, FC.pansy], 18]];
  for (const [r, z, cells, n] of bands)
    for (let i = 0; i < n; i++) {
      const a = ((i + 0.5 * (i % 2)) / n) * Math.PI * 2 + (rnd() - 0.5) * 0.08, rr = r + (i % 2 ? 8 : -8) + (rnd() - 0.5) * 6;
      flowerClump(cards, [Math.cos(a) * rr, Math.sin(a) * rr, z], 40, 27 + rnd() * 9, [cells[Math.floor(i / 2) % cells.length]], 2, rnd, [Math.cos(a) * 0.5, Math.sin(a) * 0.5]);
    }
  // low leaves over the soil between them
  for (let i = 0; i < 40; i++) {
    const a = rnd() * Math.PI * 2, rr = 45 + Math.sqrt(rnd()) * 90;
    cards.facing(rnd() < 0.5 ? "LeafCardDark" : "LeafCard", [Math.cos(a) * rr, Math.sin(a) * rr, 30 + rnd() * 6], new THREE.Vector3((rnd() - 0.5) * 0.8, (rnd() - 0.5) * 0.8, 1), rnd() * 6.28, 30, 30, SKY);
  }
  out.push(shrub({ seed: 21, lobes: [[0, 0, 66, 29, 29, 23], [0, 0, 46, 26, 26, 15]], leaf: 16, ragged: 0.35, core: 0.85, flowers: { cells: [FC.blossom, FC.rosePink], n: 10, size: 13 }, cards }));
  return merge(...out, cards.geo());
}

// A white stone pergola, 4 m along Y and 3 m deep, wisteria and vines over it, a bench under it.
function pergola(): Geo {
  const out: Geo[] = [boxBounds([-150, -205, 0], [150, 205, 4], "Cobble")];
  for (const x of [-115, 115])
    for (const y of [-165, 165]) out.push(boxAt([44, 44, 16], [x, y, 4], "StoneLight", 2), wuv(boxAt([30, 30, 226], [x, y, 20], "StoneWhite")), boxAt([42, 42, 12], [x, y, 246], "StoneLight", 2));
  for (const x of [-115, 115]) out.push(boxBounds([x - 13, -215, 258], [x + 13, 215, 284], "StoneWhite", 2));
  for (let i = 0; i < 9; i++) {
    const y = -184 + i * 46;
    out.push(boxBounds([-160, y - 5, 284], [160, y + 5, 300], "StoneWhite", 1));
  }
  // vines up two columns: a twisting stem clad in leaves, a few roses
  const cards = new Cards(), rnd = rng(41);
  cards.clip = { min: [-166, -212, 0], max: [166, 212, 320] };
  for (const [cx, cy, ph] of [[-115, -165, 0], [115, 165, 2]] as const) {
    const pts: V3[] = [];
    for (let k = 0; k <= 16; k++) pts.push([cx + 20 * Math.cos(ph + k * 0.8), cy + 20 * Math.sin(ph + k * 0.8), 6 + k * 17]);
    out.push(tube(pts, 2.4, "BarkWarm", 40, 4));
    for (let k = 1.5; k <= 16.5; k += 0.9) {
      const a = ph + k * 0.8, out1 = new THREE.Vector3(Math.cos(a), Math.sin(a), 0.3).normalize();
      const c: V3 = [cx + 24 * Math.cos(a) + (rnd() - 0.5) * 8, cy + 24 * Math.sin(a) + (rnd() - 0.5) * 8, 6 + k * 17];
      cards.facing(rnd() < 0.4 ? "LeafCardDark" : "LeafCard", c, out1.clone().add(new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.8)), rnd() * 6.28, 26, 26, out1.clone().add(SKY).normalize());
      if (Math.floor(k * 10) % 4 === 1) cards.facing("FlowerCards", [c[0] + out1.x * 6, c[1] + out1.y * 6, c[2] + 4], out1.clone().add(SKY), rnd() * 6.28, 15, 15, SKY, flowerCell(FC.rosePink));
    }
  }
  // leaves over the top in two loose layers, wisteria hanging down between the beams
  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 7; j++) {
      const y = -184 + i * 46 + ((j * 7) % 3) * 8 - 8, x = -138 + j * 46 + ((i * 11) % 5) * 5 - 10;
      if ((i * 2 + j) % 5 !== 0)
        for (let k = 0; k < 3; k++) {
          const face = new THREE.Vector3((rnd() - 0.5) * 1.2, (rnd() - 0.5) * 1.2, 1);
          const edge = Math.max(Math.abs(x) / 150, Math.abs(y) / 200);
          const m = k === 2 && rnd() < 0.55 ? "LeafCardLight" : k === 0 || edge > 0.85 ? "LeafCardDark" : "LeafCard";
          cards.facing(m, [x + (rnd() - 0.5) * 34, y + (rnd() - 0.5) * 34, 297 + k * 6 + rnd() * 4], face, rnd() * 6.28, 32 + rnd() * 10, 32 + rnd() * 10, SKY);
        }
      if ((i * 3 + j) % 3 === 1) {
        const h = 50 + ((i + j) % 3) * 9, cell = flowerCell((i + j) % 5 ? FC.wisteria : FC.blossom);
        const flip: [number, number, number, number] = [cell[0], cell[3], cell[2], cell[1]];
        for (const r of [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)])
          cards.add("FlowerCards", [x + (rnd() - 0.5) * 6, y + 23, 290], r, new THREE.Vector3(0, 0, -1), 30, h, SKY, flip, true);
      }
    }
  // a few leaf sprays hanging over the long sides
  for (let i = 0; i < 12; i++) {
    const s = i % 2 ? 1 : -1, y = -190 + (i / 11) * 380 + (rnd() - 0.5) * 20;
    cards.facing("LeafCardDark", [s * (155 + rnd() * 6), y, 280 + rnd() * 10], new THREE.Vector3(s, 0, 0.5), rnd() * 6.28, 30, 30, new THREE.Vector3(s * 0.5, 0, 1).normalize());
  }
  out.push(cards.geo());
  out.push(translate(parkBench(), [40, 0, 4]));
  return merge(...out);
}

// A small service booth, 3 x 3 m, for a town-service NPC standing behind its counter: a blue
// counter, a peaked blue-and-white canopy on white posts, a sign board with the arms of Eden, a
// bell on a bracket and one on the counter, a ledger and quill, a back cabinet of scrolls.
function kiosk(): Geo {
  const out: Geo[] = [];
  for (const x of [-125, 125]) for (const y of [-125, 125]) out.push(boxAt([22, 22, 12], [x, y, 0], "StoneLight", 2), boxAt([10, 10, 250], [x, y, 12], "Eden_PaintWhite", 1));
  out.push(
    boxBounds([-132, -114, 0], [-98, 114, 96], "Eden_PaintBlue", 2),
    boxBounds([-142, -128, 96], [-88, 128, 104], "WoodPale", 2),
    boxBounds([-134, -114, 10], [-132, 114, 16], "GoldTrim"),
    ...[-74, 0, 74].map((y) => boxBounds([-134, y - 28, 26], [-132, y + 28, 82], "Eden_PaintWhite")),
  );
  for (const s of [-1, 1]) out.push(boxBounds([-98, s < 0 ? -128 : 106, 0], [60, s < 0 ? -106 : 128, 92], "Eden_PaintBlue", 2), boxBounds([-98, s < 0 ? -132 : 102, 92], [64, s < 0 ? -102 : 132, 98], "WoodPale", 1.5));
  // the canopy
  const half = translate(awning(300, 150, 46, "FabricBlue", "FabricWhite", false), [0, 0, 300]);
  out.push(half, rotateZ(half, 180), cylinderBetween([0, -154, 301], [0, 154, 301], 3.5, 6, "Eden_PaintWhite"), sphereCenter(5, [0, -156, 301], "GoldTrim", 6), sphereCenter(5, [0, 156, 301], "GoldTrim", 6));
  for (const y of [-150, 150]) out.push(sheet([-150, y, 254], [150, y, 254], [0, y, 300], 0, "FabricWhite", 2));
  // the sign board on the ridge
  out.push(...[-80, 80].map((y) => boxAt([8, 8, 24], [0, y, 300], "Eden_PaintWhite")), boxBounds([-6, -112, 318], [6, 112, 380], "WoodDark", 2), boxBounds([-7.5, -104, 324], [7.5, 104, 374], "Eden_PaintBlue"), translate(crest(20), [-7.5, 0, 349]), translate(rotateZ(crest(20), 180), [7.5, 0, 349]));
  for (const s of [-1, 1]) out.push(boxBounds([-8, s * 70 - 22, 343], [8, s * 70 + 22, 355], "GoldTrim"));
  // bells, ledger and quill, the cabinet behind
  out.push(beamBetween([-125, 118, 226], [-160, 118, 226], 3, 3, "IronDark"), translate(bell(9), [-154, 118, 226]), cylinderBetween([-154, 118, 208], [-154, 118, 170], 0.8, 4, "RopeTan"));
  out.push(cylinderAt({ radius: 7, height: 2, segments: 8, bottom: [-118, -70, 104] }, "IronDark"), translate(scale(sphereCenter(6, [0, 0, 0], "GoldTrim", 8), [1, 1, 0.75]), [-118, -70, 106]), sphereCenter(1.8, [-118, -70, 111], "GoldTrim", 5));
  out.push(
    translate(rotateZ(merge(boxBounds([-14, -20, 0], [14, 0, 3], "WoodRed"), boxBounds([-14, 0, 0], [14, 20, 3], "WoodRed"), boxBounds([-13, -19, 3], [13, -1, 4.5], "FeltCream"), boxBounds([-13, 1, 3], [13, 19, 4.5], "FeltCream")), 8), [-112, 30, 104]),
    cylinderBetween([-110, 50, 106], [-122, 66, 128], 0.8, 4, "Eden_PaintWhite"),
    boxBounds([80, 40, 0], [125, 120, 130], "WoodWarm", 2),
    boxBounds([78, 38, 128], [127, 122, 134], "WoodPale", 1.5),
  );
  for (let i = 0; i < 6; i++) out.push(cylinderBetween([82, 50 + i * 12, 136 + (i % 2) * 6], [122, 50 + i * 12, 136 + (i % 2) * 6], 5, 6, "Eden_Parchment"));
  return merge(...out);
}

// A roofed notice board, 2 m along Y, with papers pinned to both faces.
function noticeBoard(): Geo {
  const out: Geo[] = [];
  for (const y of [-100, 100]) out.push(boxAt([34, 34, 16], [0, y, 0], "StoneLight", 2), boxAt([14, 14, 236], [0, y, 16], "WoodDark", 1.5));
  out.push(
    boxBounds([-6, -94, 76], [6, 94, 204], "WoodDark", 1.5),
    boxBounds([-8, -86, 84], [8, 86, 196], "WoodWarm"),
    boxBounds([-12, -96, 70], [12, 96, 80], "WoodDark", 1.5),
    boxBounds([-9, -114, 238], [9, 114, 252], "WoodDark", 1.5),
    rotateZ(gableRoof([236, 44, 6], [0, 0, 252], 36, 14, "RoofBlue"), 90),
    ridge([0, -132, 294], [0, 132, 294], 6),
  );
  for (const s of [-1, 1]) out.push(rotateZ(gableWall(s * 117, 22, 252, 34, "WoodPale"), 90));
  const papers: [number, number, number, number, number, string][] = [
    [-62, 160, 34, 44, -4, "Eden_Parchment"], [-20, 168, 30, 30, 3, "PaperShoji"], [20, 154, 38, 50, -2, "FeltCream"], [62, 162, 30, 40, 5, "Eden_Parchment"],
    [-58, 112, 36, 40, 2, "PaperShoji"], [-14, 116, 28, 36, -6, "Eden_Parchment"], [28, 108, 40, 32, 1, "PaperShoji"], [66, 114, 26, 34, -3, "FeltCream"],
  ];
  for (const [y, z, w, h, r, m] of papers) {
    out.push(translate(rotateX(boxBounds([-1, -w / 2, -h / 2], [0, w / 2, h / 2], m), r), [-8, y, z]));
    out.push(sphereCenter(1.8, [-9.5, y, z + h / 2 - 5], (y + z) % 3 ? "LacquerRed" : "GoldTrim", 5));
  }
  // a wanted poster: a face and a red line
  out.push(boxBounds([-9.6, 10, 156], [-9, 30, 176], "WoodShade"), boxBounds([-9.6, 8, 146], [-9, 32, 150], "LacquerRed"));
  for (const [y, z, w, h] of [[-50, 140, 40, 50], [10, 150, 34, 40], [55, 120, 36, 44]]) out.push(translate(boxBounds([0, -w / 2, -h / 2], [1, w / 2, h / 2], "Eden_Parchment"), [8, y, z]), sphereCenter(1.8, [9.5, y, z + h / 2 - 5], "LacquerRed", 5));
  return merge(...out);
}

// The public well, 2.4 m: a round stone well head with a coping, dark water, a blue roof on four
// posts, a winch with a crank and rope, one bucket hanging and one on the step.
function publicWell(): Geo {
  const bucket = merge(
    cylinderAt({ rBot: 11, rTop: 14, height: 22, segments: 10, bottom: [0, 0, 0] }, "WoodWarm"),
    cylinderAt({ radius: 11.6, height: 2.5, segments: 10, bottom: [0, 0, 3] }, "IronDark"),
    cylinderAt({ radius: 13.8, height: 2.5, segments: 10, bottom: [0, 0, 17] }, "IronDark"),
    translate(rotateX(torus(14, 1, 10, 4, "IronDark"), 90), [0, 0, 22]),
  );
  const out: Geo[] = [
    ring(118, 14, 0, "StoneGrey", 12),
    ring(84, 66, 14, "StoneLight", 12),
    translate(torus(80, 9, 16, 6, "StoneWhite"), [0, 0, 82]),
    cylinderAt({ radius: 74, height: 1, segments: 12, bottom: [0, 0, 79] }, "WaterDark"),
    rotateZ(gableRoof([220, 160, 8], [0, 0, 236], 66, 16, "RoofBlue"), 90),
    ridge([0, -126, 322], [0, 126, 322], 7),
    translate(bucket, [0, 0, 102]),
    cylinderBetween([0, 0, 150], [0, 0, 124], 0.9, 4, "RopeTan"),
    translate(bucket, [98, -30, 14]),
  ];
  for (const x of [-62, 62]) {
    for (const y of [-92, 92]) out.push(boxAt([14, 14, 236], [x, y, 14], "WoodDark", 1.5));
    out.push(boxBounds([x - 7, -112, 226], [x + 7, 112, 238], "WoodDark", 1.5));
  }
  for (const y of [-92, 92]) out.push(boxBounds([-70, y - 7, 160], [70, y + 7, 170], "WoodDark", 1.5));
  out.push(
    cylinderBetween([0, -100, 175], [0, 112, 175], 3, 6, "IronDark"),
    cylinderBetween([0, -50, 175], [0, 50, 175], 10, 8, "WoodWarm"),
    ...[-36, -24, -12, 0, 12, 24].map((y) => translate(rotateX(torus(11, 2, 10, 4, "RopeTan"), 90), [0, y, 175])),
    cylinderBetween([0, -2, 165], [0, -2, 152], 1, 4, "RopeTan"),
    beamBetween([0, 112, 175], [0, 112, 148], 4, 4, "IronDark"),
    cylinderBetween([0, 112, 150], [0, 128, 150], 2.2, 6, "WoodPale"),
  );
  for (const s of [-1, 1]) out.push(rotateZ(gableWall(s * 108, 80, 238, 60, "WoodPale"), 90));
  return merge(...out);
}

// A stack of harbour cargo, 3 m: crates, barrels and sacks on a pallet, a net over a crate, a coil of rope.
function cargoStack(): Geo {
  const out: Geo[] = [];
  for (const x of [-105, 0, 105]) out.push(boxBounds([x - 9, -120, 0], [x + 9, 120, 9], "WoodShade"));
  for (let i = 0; i < 9; i++) out.push(boxBounds([-120, -120 + i * 26.8 + 1, 9], [120, -120 + (i + 1) * 26.8 - 1, 14], "WoodPale"));
  out.push(
    translate(crate(100, 100, 90), [-55, -55, 14]),
    translate(rotateZ(crate(70, 70, 60), 12), [-52, -50, 104]),
    translate(crate(80, 80, 70), [58, -62, 14]),
    translate(barrel(), [62, 62, 14]),
    translate(scale(barrel(), [0.85, 0.85, 0.85]), [-32, 74, 14]),
    translate(rotateZ(sack(28), 20), [-80, 60, 14]),
    translate(rotateZ(sack(26), -70), [-98, 98, 14]),
    translate(rotateZ(sack(24), 40), [30, -40, 84]),
    translate(torus(22, 4.5, 14, 5, "RopeTan"), [-150, 110, 4]),
    translate(torus(18, 4.5, 14, 5, "RopeTan"), [-150, 110, 12]),
    translate(torus(13, 4, 12, 5, "RopeTan"), [-150, 110, 19]),
    cylinderBetween([-128, 104, 6], [-110, 60, 14], 3.5, 5, "RopeTan"),
  );
  // the net over the crate and sack
  const x0 = 16, x1 = 100, y0 = -104, y1 = -20, zt = 84, zb = 26;
  for (let k = 0; k <= 6; k++) {
    const y = y0 + ((y1 - y0) * k) / 6, x = x0 + ((x1 - x0) * k) / 6;
    out.push(cylinderBetween([x0 - 1.5, y, zb], [x0 - 1.5, y, zt + 1.5], 0.9, 4, "RopeTan"), cylinderBetween([x0 - 1.5, y, zt + 1.5], [x1 + 1.5, y, zt + 1.5], 0.9, 4, "RopeTan"), cylinderBetween([x1 + 1.5, y, zt + 1.5], [x1 + 1.5, y, zb], 0.9, 4, "RopeTan"));
    out.push(cylinderBetween([x, y0 - 1.5, zb], [x, y0 - 1.5, zt + 1.5], 0.9, 4, "RopeTan"), cylinderBetween([x, y0 - 1.5, zt + 1.5], [x, y1 + 1.5, zt + 1.5], 0.9, 4, "RopeTan"), cylinderBetween([x, y1 + 1.5, zt + 1.5], [x, y1 + 1.5, zb], 0.9, 4, "RopeTan"));
  }
  return merge(...out);
}

// A stone sentry box for the gate guards, 1.9 x 1.9 m: an arched opening to -X with the arms of
// Eden over it, a bench inside, slits, a hipped blue roof with a gold finial, a lantern and a spear.
function guardPost(): Geo {
  const H = 85, T = 18, SP = 150, hw = 46, top = 270, out: Geo[] = [];
  const front = new THREE.Shape();
  front.moveTo(-H, 20);
  front.lineTo(-hw, 20);
  front.lineTo(-hw, SP);
  front.absarc(0, SP, hw, Math.PI, 0, true);
  front.lineTo(hw, 20);
  front.lineTo(H, 20);
  front.lineTo(H, top);
  front.lineTo(-H, top);
  front.lineTo(-H, 20);
  const band = new THREE.Shape();
  band.moveTo(-hw - 12, 20);
  band.lineTo(-hw, 20);
  band.lineTo(-hw, SP);
  band.absarc(0, SP, hw, Math.PI, 0, true);
  band.lineTo(hw, 20);
  band.lineTo(hw + 12, 20);
  band.lineTo(hw + 12, SP);
  band.absarc(0, SP, hw + 12, 0, Math.PI, false);
  band.lineTo(-hw - 12, 20);
  out.push(
    boxBounds([-H - 8, -H - 8, 0], [H + 8, H + 8, 20], "StoneGrey", 2),
    panel(front, -H, T, "StoneWhite", { s: 1.1 }),
    wuv(merge(boxBounds([-H + T, -H, 20], [H, -H + T, top], "StoneWhite"), boxBounds([-H + T, H - T, 20], [H, H, top], "StoneWhite"), boxBounds([H - T, -H + T, 20], [H, H - T, top], "StoneWhite")), 1.1),
    panel(band, -H - 4, 4, "StoneLight"),
    boxBounds([-H - 7, -9, SP + hw - 4], [-H + 2, 9, SP + hw + 16], "StoneLight"),
    quoins(H, H, 30, top - 20),
    boxBounds([-H - 10, -H - 10, top], [H + 10, H + 10, top + 16], "StoneLight", 3),
    boxBounds([-H + T, -H + T, top - 8], [H - T, H - T, top], "WoodShade"),
    hipRoof(H, H, top + 16, 120, 22, 22, 12),
    sphereCenter(9, [0, 0, top + 16 + 12 + 120 + 6], "GoldTrim", 8),
    cylinderAt({ rBot: 3, rTop: 0.5, height: 34, segments: 6, bottom: [0, 0, top + 160] }, "GoldTrim"),
    translate(crest(16), [-H, 0, 240]),
    boxBounds([H - T - 30, -H + T, 20], [H - T, H - T, 62], "WoodWarm", 1.5),
    onFace(wallLantern(), "-y", H, -36, 220),
    cylinderBetween([-H - 22, 62, 0], [-H - 8, 66, 232], 2, 6, "WoodWarm"),
    translate(scale(cylinderAt({ rBot: 6, rTop: 0.3, height: 26, segments: 4, bottom: [0, 0, 0] }, "IronLight"), [0.4, 1, 1]), [-H - 8, 66, 232]),
  );
  for (const f of ["+y", "+x"] as const) out.push(onFace(slitGeo(80), f, H, 0, 110));
  return merge(...out);
}

// ---- the sample: a corner of Eden ----
function sample(put: Put): void {
  // paving: the plaza, the street from the gate down to the harbour, the waterfront
  for (let x = -2000; x <= 800; x += 400) for (let y = 0; y <= 1200; y += 400) put("plaza_tile", [x, y, 0]);
  for (const y of [2000, 1600, -400, -800, -1200, -1600]) put("road_tile", [-200, y, 0], 90);
  for (let x = -1800; x <= 1800; x += 400) put("plaza_tile", [x, -2000, 0]);

  // the city wall and its gate along the +Y edge (outside to +Y)
  put("city_gate", [-200, 2250, 0], -90);
  for (const x of [920, 1720, -1320, -2120]) put("city_wall", [x, 2250, 0], -90);
  put("wall_tower", [2300, 2250, 0], -90);
  put("wall_tower", [-2600, 2250, 0], -90);
  // outside the gate: the road out to the plains between trees
  for (const y of [2800, 3200]) put("road_tile", [-200, y, 0], 90);
  for (const x of [-520, 120]) put("banner_pole", [x, 2720, 0], 180);
  for (const x of [-560, 160]) put("street_lamp", [x, 3150, 0]);
  put("common:sign_post", [180, 2900, 0], 200);
  for (const [x, y, k, h, sc] of [[-1300, 2950, "BigOak", 20, 0.9], [-2100, 3100, "RoundTree", 80, 1], [-900, 3350, "SmallTree", 140, 1], [800, 2950, "RoundTree", 200, 1.1], [1600, 3150, "BigOak", 300, 0.8], [2400, 2900, "SmallTree", 30, 1]] as const)
    put(`flora:${k}`, [x, y, 0], h, sc);
  for (const [x, y, sc] of [[-1700, 2650, 1.4], [-2300, 2700, 1.2], [1200, 2650, 1.3], [2000, 2700, 1.5], [-700, 2650, 1.1], [500, 2700, 1.2]] as const) put("flora:Bush", [x, y, 0], x, sc);
  for (const x of [-470, 70]) put("banner_pole", [x, 1520, 0]);

  // houses along the wall, facing the plaza
  put("townhouse_narrow", [-2200, 1780, 0], 90);
  put("townhouse_narrow", [-1700, 1780, 0], 90);
  put("townhouse", [-1000, 1780, 0], 90);
  put("townhouse", [600, 1780, 0], 90);
  for (const x of [-1250, -750, 350, 850]) put("flower_planter", [x, 1380, 0], 90);

  // the cathedral closes the far side of the plaza, a little garden beside it
  put("cathedral", [2170, 600, 0]);
  put("flora:BigOak", [1550, 1850, 0], 30, 0.85);
  put("flora:RoundTree", [2050, 1650, 0], 120);
  put("flora:Bush", [1300, 1500, 0], 0, 1.3);
  put("common:bench", [1700, 1500, 0], 90);

  // the fountain, the hero and seats in the middle of the plaza
  put("fountain", [-200, 650, 0]);
  put("hero_statue", [-200, 20, 0]);
  put("common:bench", [360, 650, 0], 0);
  put("common:bench", [-760, 650, 0], 180);
  put("common:bench", [-200, 1210, 0], 90);
  for (const [dx, dy, h] of [[400, 400, 45], [-400, 400, -45], [-400, -400, 45], [400, -400, -45]]) put("flower_planter", [-200 + dx, 650 + dy, 0], h);
  for (const [x, y] of [[-760, 120], [360, 120], [-760, 1150], [360, 1150]]) put("street_lamp", [x, y, 0]);

  // the market at the near end of the plaza
  put("market_stall_cloth", [-1350, 300, 0], 0);
  put("market_stall_fruit", [-1350, 820, 0], 0);
  put("market_stall_fruit", [-1950, 420, 0], 180);
  put("market_stall_cloth", [-1950, 950, 0], 180);
  put("common:market_cart", [-1620, 1220, 0], 95);
  for (const [x, y, h] of [[-1500, 40, 10], [-1540, -20, 35], [-1840, 140, 0], [-2050, 700, 20], [-1180, 560, 15]]) put("common:crate", [x, y, 5], h);
  put("street_lamp", [-1650, -150, 0]);
  for (const [x, y, k, h, sc] of [[-2650, 300, "RoundTree", 40, 1], [-2700, 1200, "BigOak", 160, 0.8], [-2600, -700, "SmallTree", 90, 1.1], [-2450, -1500, "RoundTree", 250, 0.9], [3100, -300, "RoundTree", 10, 1.1], [3000, 1700, "BigOak", 220, 0.85]] as const)
    put(`flora:${k}`, [x, y, 0], h, sc);
  for (const [x, y, sc] of [[-2350, 50, 1.3], [-2400, 900, 1.1], [-2250, -1100, 1.4], [2600, -900, 1.3], [3200, 800, 1.2]] as const) put("flora:Bush", [x, y, 0], y, sc);

  // between the plaza and the harbour: a green with trees
  for (const x of [-470, 70]) put("banner_pole", [x, -280, 0]);
  put("flora:RoundTree", [-900, -650, 0], 40);
  put("flora:SmallTree", [-1500, -500, 0], 200);
  put("flora:BigOak", [700, -650, 0], 10, 0.8);
  put("flora:Birch", [1500, -350, 0], 70);
  put("flora:RoundTree", [2700, -500, 0], 160);
  put("flora:Bush", [-560, -900, 0], 0, 1.2);
  put("flora:Bush", [160, -1150, 0], 50, 1.1);
  put("flora:Bush", [-2050, -400, 0], 90, 1.4);
  put("common:bench", [-560, -620, 0], 180);
  put("street_lamp", [-470, -1100, 0]);
  put("street_lamp", [70, -800, 0]);

  // the harbour front: the inn and houses facing the sea
  put("inn", [-1300, -1350, 0], 90);
  put("townhouse_narrow", [450, -1400, 0], 90);
  put("townhouse", [1250, -1400, 0], 90);
  put("common:bench", [-700, -1880, 5], 90);
  put("common:sign_post", [-460, -1860, 5], 80);
  for (const x of [-1950, -700, 300, 1500]) put("street_lamp", [x, -2140, 5]);

  // quays, the pier and the water stairs
  for (const x of [-1600, -800, 0, 800, 1600]) put("quay_wall", [x, -2400, 0], 90);
  put("pier", [-200, -2800, -30], 90);
  put("pier", [-200, -3200, -30], 90);
  for (const x of [-420, 20]) put("banner_pole", [x, -2520, 8]);
  put("stone_stairs", [700, -2770, -142], 90);
  for (const [x, y, h] of [[-1000, -2330, 10], [-940, -2390, 40], [-1060, -2410, 0], [1150, -2340, 20]]) put("common:crate", [x, y, 8], h);

  // boats and the lighthouse
  put("sailboat", [-500, -3060, -42], 90);
  put("sailboat", [1080, -3150, -42], 64);
  put("rowboat", [120, -2900, -30], 96);
  put("rowboat", [-1300, -2760, -30], 18);
  put("lighthouse", [2000, -3150, -60]);
  for (const [x, y, s, h] of [[1980, -2660, 4, 0], [2050, -2780, 4.5, 60], [1940, -2880, 4, 120], [2080, -2960, 5, 200]]) put("common:rock_small", [x, y, -40], h, s);
}

export const KIT: Kit = {
  id: "eden",
  name: "อีเดน",
  region: "ที่ราบภาคกลาง",
  desc: "เมืองหลวงของอาณาจักรและเมืองเริ่มต้น หินสีนวลกับผนังปูนขาวใต้หลังคาสีฟ้า มีมหาวิหาร ลานน้ำพุ ตลาด และท่าเรือริมทะเล",
  ground: "grass",
  sea: true,
  items: [
    { id: "city_wall", name: "กำแพงเมือง (8 ม.)", make: cityWall, tags: ["wall", "defence"] },
    { id: "wall_tower", name: "หอคอยกำแพง", make: wallTower, tags: ["tower", "defence"] },
    { id: "city_gate", name: "ประตูเมือง", make: cityGate, tags: ["gate", "defence", "landmark"] },
    { id: "townhouse", name: "บ้านตึกในเมือง", make: townhouse, tags: ["building"] },
    { id: "townhouse_narrow", name: "บ้านทรงสูงแคบ", make: townhouseNarrow, tags: ["building", "market"] },
    { id: "inn", name: "โรงเตี๊ยม", make: inn, tags: ["building"] },
    { id: "cathedral", name: "มหาวิหาร", make: cathedral, tags: ["building", "landmark"] },
    { id: "fountain", name: "น้ำพุ", make: fountain, tags: ["landmark", "decor"] },
    { id: "hero_statue", name: "อนุสาวรีย์วีรบุรุษ", make: heroStatue, tags: ["landmark", "decor"] },
    { id: "market_stall_cloth", name: "แผงขายผ้า", make: clothStall, tags: ["market"] },
    { id: "market_stall_fruit", name: "แผงขายผลไม้", make: fruitStall, tags: ["market"] },
    { id: "banner_pole", name: "เสาธงอีเดน", make: bannerPole, tags: ["decor"] },
    { id: "street_lamp", name: "โคมไฟถนนคู่", make: streetLamp, tags: ["light"] },
    { id: "flower_planter", name: "กระบะดอกไม้", make: flowerPlanter, tags: ["decor", "plant"] },
    { id: "plaza_tile", name: "ลานหินปู (4 ม.)", make: plazaTile, tags: ["ground"] },
    { id: "road_tile", name: "ถนนหินปู (4 ม.)", make: roadTile, tags: ["ground"] },
    { id: "stone_stairs", name: "บันไดหิน", make: stoneStairs, tags: ["ground"] },
    { id: "quay_wall", name: "เขื่อนท่าเรือ (8 ม.)", make: quayWall, tags: ["dock", "wall"] },
    { id: "pier", name: "สะพานท่าเรือไม้ (4 ม.)", make: pier, tags: ["dock"] },
    { id: "sailboat", name: "เรือใบ", make: sailboat, tags: ["boat"] },
    { id: "rowboat", name: "เรือพาย", make: rowboat, tags: ["boat"] },
    { id: "lighthouse", name: "ประภาคาร", make: lighthouse, tags: ["tower", "dock", "light", "landmark"] },
    // the city quarter (buildings join wall to wall along Y)
    { id: "corner_house", name: "บ้านมุมหอคอย", make: cornerHouse, tags: ["building"] },
    { id: "row_houses", name: "ตึกแถวสามห้อง", make: rowHouses, tags: ["building", "market"] },
    { id: "weapon_shop", name: "ร้านอาวุธ", make: weaponShop, tags: ["building", "market"] },
    { id: "tool_shop", name: "ร้านเครื่องมือ", make: toolShop, tags: ["building", "market"] },
    { id: "guild_hall", name: "กิลด์นักผจญภัย", make: guildHall, tags: ["building", "landmark"] },
    { id: "warehouse", name: "โกดังท่าเรือ", make: warehouse, tags: ["building", "dock"] },
    { id: "cafe", name: "ร้านกาแฟ", make: cafe, tags: ["building", "market"] },
    { id: "cafe_table", name: "โต๊ะร้านกาแฟ", make: cafeTable, tags: ["decor", "market"] },
    { id: "hedge", name: "แนวพุ่มไม้ (4 ม.)", make: hedge, tags: ["plant", "decor", "wall"] },
    { id: "topiary", name: "ต้นไม้ตัดแต่ง", make: topiary, tags: ["plant", "decor"] },
    { id: "flower_bed", name: "แปลงดอกไม้", make: flowerBed, tags: ["plant", "decor"] },
    { id: "pergola", name: "ซุ้มไม้เลื้อย", make: pergola, tags: ["decor", "plant"] },
    { id: "park_bench", name: "ม้านั่งสวน", make: parkBench, tags: ["decor"] },
    { id: "kiosk", name: "ซุ้มบริการ", make: kiosk, tags: ["market", "decor"] },
    { id: "notice_board", name: "ป้ายประกาศ", make: noticeBoard, tags: ["decor"] },
    { id: "public_well", name: "บ่อน้ำสาธารณะ", make: publicWell, tags: ["decor"] },
    { id: "cargo_stack", name: "กองสินค้าท่าเรือ", make: cargoStack, tags: ["dock", "decor"] },
    { id: "guard_post", name: "ป้อมยาม", make: guardPost, tags: ["defence", "light"] },
  ],
  sample,
};
