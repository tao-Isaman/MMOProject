// พระราชวังหลวง (the royal palace): the kings' palace on the hill north of Eden where the snow
// begins, built as Eden is (pale stone, white plaster, blue roofs) but grander. Its curtain wall
// with tall round towers and long royal banners, the great gatehouse the royal road looks up at
// (here with its portcullis raised and its doors open), the inner gate with its clock, a postern;
// the throne hall open to its court through a colonnade so the throne on its dais shows from
// the court, the royal chapel, library and treasury; the outer ward's barracks, stables, smithy,
// training dummies, a white horse and the royal coach; the court's three-tier fountain and the
// statues of the kings; the garden's hedge maze, topiary beasts, rose arbours, the pond's
// pavilion and its bridge, balustrades and lamps.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front to -X.
// SOLIDS gives the walls of the pieces people walk into or through (the gates' passages, the
// throne hall, the maze, the pavilion); DAIS is where the throne's dais stands in the hall.

import * as THREE from "three";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, array, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, sphereCenter, torus, gableRoof, gableWall,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial, flowerCell, FLOWER_CELLS } from "../textures";
import type { Recipe } from "../textures";
import { Cards, shrub } from "../trees";
import type { Kit, Put } from "./types";
import type { SolidSpec } from "../../world";

// ---- materials ----
const MATS: Record<string, Recipe> = {
  Palace_Plaster: { map: "plaster", tint: "#f8f5ee", bump: 0.6 },
  Palace_PaintWhite: { map: "plaster", tint: "#fdfcf7", bump: 0.3, rough: 0.7 },
  Palace_Blue: { map: "plaster", tint: "#2f5aa6", bump: 0.4, rough: 0.55 },
  Palace_RoyalBlue: { map: "fabric", tint: "#2b52a3", rough: 0.95 },
  Palace_Velvet: { map: "felt", tint: "#2a4894", rough: 0.85 },
  Palace_Carpet: { map: "felt", tint: "#a8293d", rough: 1 },
  Palace_Dark: { tint: "#22252d", rough: 1 },
  Palace_Shadow: { tint: "#4a4d57", rough: 1 },
  Palace_Statue: { map: "marble", tint: "#f1eee7", rough: 0.45 },
  Palace_Water: { tint: "#62b4de", rough: 0.05, opacity: 0.86 },
  Palace_Spray: { tint: "#e4f5ff", rough: 0.1, opacity: 0.6, glow: "#a6dcff", glowI: 0.35 },
  Palace_GlassBlue: { tint: "#4a78d6", rough: 0.2, glow: "#2a4caa", glowI: 0.6 },
  Palace_GlassRed: { tint: "#d4485a", rough: 0.2, glow: "#a8283a", glowI: 0.6 },
  Palace_GlassGold: { tint: "#f2c450", rough: 0.2, glow: "#c88a20", glowI: 0.6 },
  Palace_Hedge: { map: "foliage", tint: "#5a9744", rough: 0.95, bump: 1.5 },
  Palace_HedgeTop: { map: "foliage", tint: "#7fb956", rough: 0.9, bump: 1.5 },
  Palace_Soil: { map: "felt", tint: "#5b4232", rough: 1 },
  Palace_Coat: { map: "felt", tint: "#f3efe7", rough: 0.85 },
  Palace_CoatBay: { map: "felt", tint: "#8a5a36", rough: 0.85 },
  Palace_Mane: { map: "felt", tint: "#d6d0c4", rough: 1 },
  Palace_ManeDark: { map: "felt", tint: "#2e2520", rough: 1 },
  Palace_Hoof: { tint: "#3a332d", rough: 0.8 },
  Palace_Leather: { map: "felt", tint: "#6b3f24", rough: 0.85 },
  Palace_Straw: { map: "thatch", tint: "#d8b85a", bump: 1.5 },
  Palace_Sack: { map: "fabric", tint: "#c9ae7c", rough: 1 },
  Palace_Coal: { tint: "#2a2522", rough: 1 },
  Palace_Ember: { tint: "#ff8a3a", rough: 1, glow: "#ff5a12", glowI: 2.2 },
  Palace_ClockFace: { map: "plaster", tint: "#fbf8ef", rough: 0.6 },
  Palace_BookRed: { map: "felt", tint: "#9c3330", rough: 0.9 },
  Palace_BookGreen: { map: "felt", tint: "#3e6b45", rough: 0.9 },
  Palace_BookBlue: { map: "felt", tint: "#34508c", rough: 0.9 },
  Palace_Parchment: { map: "paper", tint: "#f0e2bd", rough: 0.95 },
};
for (const [name, recipe] of Object.entries(MATS)) defineMaterial(name, recipe);

// ---- helpers ----
const D = Math.PI / 180;
const FC = FLOWER_CELLS;
const SKY = new THREE.Vector3(0, 0, 1);
function rng(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// World-aligned texture coordinates (metres / s): masonry courses stay level and run on across
// neighbouring boxes.
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
// Roof texture coordinates for any slab: U along the eaves, V up the slope (as gableRoof's).
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

// Put a piece built facing -X (its back on x = 0, centred on y = 0) onto one face of a box
// building: `d` from the centre to that wall, `u` along the wall, bottom at z.
type Face = "-x" | "+x" | "-y" | "+y";
function onFace(g: Geo, face: Face, d: number, u: number, z: number): Geo {
  if (face === "-x") return translate(g, [-d, u, z]);
  if (face === "+x") return translate(rotateZ(g, 180), [d, u, z]);
  if (face === "-y") return translate(rotateZ(g, 90), [u, -d, z]);
  return translate(rotateZ(g, -90), [u, d, z]);
}
// ... or onto a round tower: `r` out from its axis, facing the compass angle `deg` (0 = +X).
function onRound(g: Geo, r: number, deg: number, z: number): Geo {
  return rotateZ(translate(g, [-r, 0, z]), deg - 180);
}
// A round (or polygonal) drum turned so a flat face looks along the axes.
function ring(r: number, h: number, z: number, mat: string, seg = 16, rTop = r): Geo {
  return rotateZ(cylinderAt({ rBot: r, rTop, height: h, segments: seg, bottom: [0, 0, z] }, mat), 180 / seg);
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
// A swallowtail: w wide, hanging h from the top edge (z = 0) down to its notch.
function tailShape(w: number, h: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, -h);
  s.lineTo(0, -h + w * 0.42);
  s.lineTo(-w / 2, -h);
  s.lineTo(-w / 2, 0);
  return s;
}
// A flat piece cut to a shape, facing -X, from x0 to x0 + depth.
function panel(shape: THREE.Shape, x0: number, depth: number, mat: string, o: { s?: number; vertical?: boolean; seg?: number } = {}): Geo {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: o.seg ?? 6 });
  g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, x0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  const geo = g.index ? g.toNonIndexed() : g;
  geo.clearGroups();
  return wuv([{ geo, mat }], o.s ?? 1, o.vertical);
}
// A solid wrapped around some points.
function hullGeo(pts: V3[], mat: string): Geo {
  return wuv([{ geo: new ConvexGeometry(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))), mat }]);
}
// A cloth triangle a-b-c bellied out by `bulge` in the middle, finished on both sides (pennants).
function sheet(a: V3, b: V3, c: V3, bulge: number, mat: string, n = 3): Geo {
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
// Voussoirs: `n` wedge stones round a half circle in a -X facing wall, centre c, from radius r
// out to r + thick, `depth` through the wall.
function arcStones(c: V3, r: number, n: number, thick: number, depth: number, mat: string, bevel = 2): Geo {
  const out: Geo[] = [];
  const step = 180 / n, chord = 2 * (r + thick) * Math.sin((step * D) / 2) * 1.04, rm = r + thick / 2;
  for (let i = 0; i < n; i++) {
    const a = step * (i + 0.5) * D;
    out.push(translate(rotateX(box([depth, chord, thick], [0, 0, 0], mat, bevel), a / D - 90), [c[0], c[1] + rm * Math.cos(a), c[2] + rm * Math.sin(a)]));
  }
  return merge(...out);
}
// The stepped vault of a passage along X through a block (x0..x1), the arch springing at sp,
// half-width hw, in 20 cm slices; up to `top`.
function vault(x0: number, x1: number, hw: number, sp: number, top: number, mat: string): Geo {
  const out: Geo[] = [];
  for (let y0 = -hw; y0 < hw; y0 += 20) {
    const m = Math.max(Math.abs(y0), Math.abs(y0 + 20));
    out.push(boxBounds([x0, y0, sp + Math.sqrt(Math.max(0, (hw + 20) ** 2 - m * m))], [x1, y0 + 20, top], mat));
  }
  return out.flat();
}

interface WinOpt { arch?: boolean; shutters?: boolean; frame?: string; glass?: string; bars?: boolean }
// A window facing -X: stone surround, glass, white glazing bars, sill and a lintel with a
// keystone (or a round head). Bottom of the glass at z = 0.
function windowGeo(w: number, h: number, o: WinOpt = {}): Geo {
  const hw = w / 2, fm = o.frame ?? "StoneWhite", spring = o.arch ? h - hw : h;
  const out: Geo[] = [
    panel(o.arch ? archShape(hw + 12, spring, false, -6) : rectShape(hw + 12, h + 6, -6), -8, 10, fm),
    panel(o.arch ? archShape(hw, spring) : rectShape(hw, h), -10, 2, o.glass ?? "GlassBlue"),
    boxBounds([-12, -2, 0], [-10, 2, h - 2], "Palace_PaintWhite"),
    boxBounds([-12, -hw, (o.arch ? spring : h * 0.6) - 2], [-10, hw, (o.arch ? spring : h * 0.6) + 2], "Palace_PaintWhite"),
    boxBounds([-17, -hw - 16, -16], [2, hw + 16, -5], fm, 2),
  ];
  if (o.arch) out.push(boxBounds([-13, -8, h + 2], [2, 8, h + 22], fm));
  else out.push(boxBounds([-13, -hw - 16, h + 6], [2, hw + 16, h + 20], fm, 2), boxBounds([-15, -9, h + 2], [2, 9, h + 26], fm));
  if (o.bars) for (let y = -hw + 12; y < hw - 4; y += 16) out.push(boxBounds([-15, y - 1.5, 0], [-12, y + 1.5, spring], "IronDark"));
  if (o.shutters)
    for (const sy of [-1, 1]) {
      const a = sy * (hw + 14), b = sy * (hw + 14 + hw * 0.95), lo = Math.min(a, b), hi = Math.max(a, b);
      out.push(boxBounds([-7, lo, 0], [-2, hi, spring], "Palace_Blue"));
      for (const z of [spring * 0.16, spring * 0.78]) out.push(boxBounds([-9, lo + 3, z], [-7, hi - 3, z + 6], "Palace_Blue"));
    }
  return merge(...out);
}
// A slit window for walls and towers (facing -X, bottom at z = 0).
function slitGeo(h = 100): Geo {
  return merge(
    panel(rectShape(17, h + 10, -10), -6, 8, "StoneLight"),
    panel(rectShape(5, h), -8, 2, "Palace_Dark"),
    panel(rectShape(14, h * 0.55 + 3, h * 0.55 - 3), -8, 2, "Palace_Dark"),
  );
}
// A door facing -X: stone frame, plank leaf (or two), iron straps, gold handles, a step.
function doorGeo(w: number, h: number, o: { arch?: boolean; double?: boolean; frame?: string; step?: boolean; leaf?: string } = {}): Geo {
  const hw = w / 2, fm = o.frame ?? "StoneLight", spring = o.arch ? h - hw : h;
  const out: Geo[] = [
    panel(o.arch ? archShape(hw + 16, spring) : rectShape(hw + 16, h + 8), -8, 10, fm),
    panel(o.arch ? archShape(hw, spring) : rectShape(hw, h), -11, 3, o.leaf ?? "DoorWood", { vertical: true }),
  ];
  for (const z of [h * 0.18, spring * 0.74]) out.push(boxBounds([-13, -hw + 4, z], [-11, hw - 4, z + 7], "IronDark"));
  if (o.double) out.push(boxBounds([-12.5, -1.5, 0], [-11, 1.5, h - 2], "WoodDark"), sphereCenter(4, [-15, -9, h * 0.42], "GoldTrim", 6), sphereCenter(4, [-15, 9, h * 0.42], "GoldTrim", 6));
  else out.push(sphereCenter(4.5, [-15, hw * 0.6, h * 0.42], "GoldTrim", 6));
  if (o.arch) out.push(boxBounds([-12, -9, h + 4], [2, 9, h + 26], fm, 1.5));
  else out.push(boxBounds([-13, -hw - 22, h + 8], [2, hw + 22, h + 24], fm, 2));
  if (o.step !== false) out.push(boxBounds([-48, -hw - 24, 0], [2, hw + 24, 10], "StoneGrey", 2));
  return merge(...out);
}
// A Gothic lancet of stained glass facing -X: `h` up to the springing, the point above it.
function lancet(w: number, h: number, glass = "Palace_GlassBlue"): Geo {
  const hw = w / 2;
  const out: Geo[] = [
    panel(archShape(hw + 14, h, true, -10), -8, 10, "StoneLight"),
    panel(archShape(hw, h, true), -10, 2, glass),
    boxBounds([-18, -hw - 18, -18], [2, hw + 18, -6], "StoneLight", 2),
  ];
  if (glass !== "Palace_Dark") {
    out.push(panel(circleShape(hw * 0.45, 0, h + w * 0.32), -11, 1, "Palace_GlassRed"));
    out.push(boxBounds([-12, -2, 0], [-10, 2, h + w * 0.8], "Palace_Dark"));
    for (const t of [0.3, 0.62]) out.push(boxBounds([-12, -hw, h * t], [-10, hw, h * t + 4], "Palace_Dark"));
  } else for (let z = h * 0.25; z < h + w * 0.5; z += 26) out.push(boxBounds([-14, -hw, z], [-10, hw, z + 6], "WoodDark"));
  return merge(...out);
}
// A round window: stone ring, stained glass in petals.
function rose(R: number): Geo {
  const out: Geo[] = [
    panel(circleShape(R + 22), -10, 12, "StoneLight", { seg: 10 }),
    panel(circleShape(R), -12, 2, "Palace_GlassBlue", { seg: 10 }),
    panel(circleShape(R * 0.28), -13, 1, "Palace_GlassGold", { seg: 8 }),
  ];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    out.push(panel(circleShape(R * 0.2, Math.cos(a) * R * 0.62, Math.sin(a) * R * 0.62), -13, 1, i % 2 ? "Palace_GlassRed" : "Palace_GlassGold"));
    out.push(rotateX(boxBounds([-16, -3, R * 0.28], [-12, 3, R], "StoneWhite"), i * 45 + 22.5));
  }
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
// The king's arms: a blue shield edged in gold with a gold crown, a crown over it, facing -X.
function arms(s: number): Geo {
  return merge(
    panel(shieldShape(s), -4, 4, "GoldTrim"),
    panel(shieldShape(s * 0.88), -6, 2, "Palace_Blue"),
    panel(crownShape(s * 0.5), -7, 1, "GoldTrim", { seg: 2 }),
    translate(panel(crownShape(s * 0.62), -6, 6, "GoldTrim"), [0, 0, s * 1.38]),
  );
}
// A small round crest (a gold crown on white ringed in gold), facing -X.
function crest(r: number): Geo {
  return merge(
    panel(circleShape(r + 4), -1.5, 1.5, "GoldTrim"),
    panel(circleShape(r), -2.5, 1, "Palace_PaintWhite"),
    panel(crownShape(r * 0.62), -3.5, 1, "GoldTrim"),
  );
}
// A long royal banner (ธงยาว) hanging from a gold rod at z = 0 in the plane x = 0: royal blue,
// gold edges and a band, a swallowtail, the crown and the arms on both faces.
function longBanner(w: number, h: number, field = "Palace_RoyalBlue"): Geo {
  const front = merge(
    panel(tailShape(w, h), -1.5, 3, field),
    panel(rectShape(w / 2, -18, -26), -2.2, 0.7, "GoldTrim"),
    panel(rectShape(w / 2, -h * 0.82 + 4, -h * 0.82 - 4), -2.2, 0.7, "GoldTrim"),
    translate(panel(crownShape(w * 0.26), -2.6, 1, "GoldTrim"), [0, 0, -h * 0.22]),
    translate(merge(panel(shieldShape(w * 0.2), -2.4, 0.9, "GoldTrim"), panel(shieldShape(w * 0.16), -2.8, 0.4, "Palace_PaintWhite")), [0, 0, -h * 0.5]),
  );
  const out: Geo[] = [
    front,
    translate(rotateZ(merge(
      panel(rectShape(w / 2, -18, -26), -2.2, 0.7, "GoldTrim"),
      translate(panel(crownShape(w * 0.26), -2.6, 1, "GoldTrim"), [0, 0, -h * 0.22]),
    ), 180), [0, 0, 0]),
    cylinderBetween([0, -w / 2 - 14, 4], [0, w / 2 + 14, 4], 3, 6, "GoldTrim"),
    sphereCenter(5, [0, -w / 2 - 16, 4], "GoldTrim", 6),
    sphereCenter(5, [0, w / 2 + 16, 4], "GoldTrim", 6),
  ];
  // gold edges down both sides
  for (const s of [-1, 1]) out.push(boxBounds([-2, s * w / 2 - 4, -h], [2, s * w / 2 + 4, 0], "GoldTrim"));
  return merge(...out);
}
// A blue roof's ridge tiles.
function ridge(a: V3, b: V3, r = 12): Geo {
  return cylinderBetween(a, b, r, 8, "StoneBlueDark");
}
// Corner stones up the corners of a box building between z0 and z1.
function quoins(hx: number, hy: number, z0: number, z1: number, corners: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]]): Geo {
  const out: Geo[] = [];
  for (const [cx, cy] of corners)
    for (let i = 0, z = z0; z + 40 <= z1; i++, z += 50) {
      const ax = i % 2 ? 28 : 46, ay = i % 2 ? 46 : 28, x = cx * hx, y = cy * hy;
      out.push(boxBounds([cx < 0 ? x - 3 : x - ax, cy < 0 ? y - 3 : y - ay, z], [cx < 0 ? x + ax : x + 3, cy < 0 ? y + ay : y + 3, z + 40], "StoneWhite"));
    }
  return merge(...out);
}
// A tiled hipped roof over ±hx, ±hy: eaves past the walls at z, `th` thick, rising h to a ridge
// along the longer side (a point when square), ridge and hip tiles.
function hipRoof(hx: number, hy: number, z: number, h: number, ovx: number, ovy: number, th = 22, mat = "RoofBlue"): Geo {
  const ax = hx + ovx, ay = hy + ovy, zt = z + th, zr = zt + h;
  const ends: V3[] = ax - ay > 2 ? [[ay - ax, 0, zr], [ax - ay, 0, zr]] : ay - ax > 2 ? [[0, ax - ay, zr], [0, ay - ax, zr]] : [[0, 0, zr]];
  const pts = ends.map((e) => new THREE.Vector3(...e));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) pts.push(new THREE.Vector3(sx * ax, sy * ay, z), new THREE.Vector3(sx * ax, sy * ay, zt));
  const out: Geo[] = [roofUv([{ geo: new ConvexGeometry(pts), mat }])];
  if (ends.length === 2) out.push(ridge([ends[0][0], ends[0][1], zr + 3], [ends[1][0], ends[1][1], zr + 3], 10));
  const alongX = ends.length === 2 && ends[0][0] !== 0;
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) {
      const e = ends.length === 1 ? ends[0] : ends[(alongX ? sx : sy) < 0 ? 0 : 1], c: V3 = [sx * ax, sy * ay, zt + 2];
      out.push(cylinderBetween([c[0] + (e[0] - c[0]) * 0.05, c[1] + (e[1] - c[1]) * 0.05, c[2] + (e[2] + 3 - c[2]) * 0.05], [e[0], e[1], zr + 3], 7, 6, "StoneBlueDark"));
    }
  return merge(...out);
}
// Merlons along a run from a to b on top of a parapet at z, `depth` thick.
function merlons(a: [number, number], b: [number, number], z: number, depth: number, mat = "StoneWhite", pitch = 100, h = 70): Geo {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / pitch));
  const rot = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI, out: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    out.push(translate(rotateZ(box([pitch * 0.58, depth, h], [0, 0, h / 2], mat, 2), rot), [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, z]));
  }
  return merge(...out);
}
// A classical column standing on z = 0, `h` tall: a square plinth, a moulded base, a shaft
// tapering a little, a gold necking and a capital under a square abacus.
function column(r: number, h: number, mat = "MarbleWhite"): Geo {
  return merge(
    boxAt([r * 2.7, r * 2.7, 16], [0, 0, 0], "StoneLight", 2),
    ring(r * 1.3, 10, 16, "StoneWhite", 12),
    ring(r * 1.18, 8, 26, "StoneWhite", 12, r * 1.05),
    cylinderAt({ rBot: r, rTop: r * 0.88, height: h - 34 - 50, segments: 12, bottom: [0, 0, 34] }, mat),
    ring(r * 0.95, 6, h - 50, "GoldTrim", 12),
    cylinderAt({ rBot: r * 0.92, rTop: r * 1.32, height: 30, segments: 12, bottom: [0, 0, h - 44] }, "StoneWhite"),
    boxAt([r * 2.8, r * 2.8, 14], [0, 0, h - 14], "StoneLight", 2),
  );
}
// A row of balusters along Y from y0 to y1 at x, standing on z (each 60 tall), with a top rail.
function balusters(x: number, y0: number, y1: number, z: number, pitch = 20, h = 60): Geo {
  const out: Geo[] = [];
  const n = Math.max(1, Math.round((y1 - y0) / pitch));
  for (let i = 0; i < n; i++) {
    const y = y0 + ((y1 - y0) * (i + 0.5)) / n;
    out.push(
      cylinderAt({ rBot: 6, rTop: 4.5, height: h * 0.32, segments: 6, bottom: [x, y, z] }, "StoneWhite"),
      sphereCenter(7.5, [x, y, z + h * 0.42], "StoneWhite", 6),
      cylinderAt({ rBot: 4.5, rTop: 6.5, height: h * 0.42, segments: 6, bottom: [x, y, z + h * 0.5] }, "StoneWhite"),
    );
  }
  return merge(...out);
}

// A round tower: a battered footing, white stone shaft, a corbelled gallery with arched windows,
// a tall blue cone with a gold finial and a pennant; slits facing `slits`; a long banner hung
// from the gallery facing `banner` (compass degrees) when given.
function roundTower(r: number, h: number, roofH: number, o: { slits?: number[]; windows?: number[]; banner?: number[] } = {}): Geo {
  const fr = (rr: number) => rr * Math.cos(Math.PI / 16);
  const top = h + 150 + roofH;
  const out: Geo[] = [
    ring(r + 40, 120, 0, "StoneGrey", 16, r + 8),
    wuv(ring(r, h - 120, 120, "StoneWhite"), 1.4),
    ring(r + 7, 14, Math.round(h * 0.45), "StoneLight"),
    ring(r + 30, 150, h, "StoneWhite"),
    ring(r + 36, 12, h + 138, "StoneLight"),
    ring(r + 74, roofH, h + 150, "RoofBlue", 16, 3),
    ring(r + 78, 8, h + 146, "StoneBlueDark"),
    cylinderBetween([0, 0, top - 30], [0, 0, top + 160], 3.5, 6, "IronDark"),
    sphereCenter(13, [0, 0, top + 4], "GoldTrim", 8),
    sphereCenter(6, [0, 0, top + 162], "GoldTrim", 6),
    sheet([0, 0, top + 154], [0, 0, top + 100], [0, -150, top + 124], 6, "Palace_RoyalBlue", 3),
  ];
  for (let i = 0; i < 16; i++)
    out.push(rotateZ(merge(boxBounds([r - 6, -12, h - 64], [r + 30, 12, h], "StoneLight", 1.5), boxBounds([r - 6, -9, h - 96], [r + 14, 9, h - 64], "StoneLight", 1.5)), i * 22.5));
  for (const a of o.windows ?? [0, 90, 180, 270]) out.push(onRound(windowGeo(46, 80, { arch: true, frame: "StoneLight" }), fr(r + 30), a, h + 36));
  for (const a of o.slits ?? []) {
    out.push(onRound(slitGeo(90), fr(r), a, Math.round(h * 0.24)));
    out.push(onRound(slitGeo(90), fr(r), a + 22.5, Math.round(h * 0.6)));
  }
  for (const a of o.banner ?? []) out.push(rotateZ(translate(longBanner(140, Math.round(h * 0.55)), [-(r + 44), 0, h - 20]), a - 180));
  return merge(...out);
}

// A flower clump standing on `at` (leaves in two crossed cards, flower heads over them).
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
// A stone urn of flowers standing on z (about 90 cm high with the flowers), for parapets and
// gate piers.
function urn(z: number, seed: number): Geo {
  const cards = new Cards(), rnd = rng(seed);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    flowerClump(cards, [Math.cos(a) * 9, Math.sin(a) * 9, z + 50], 22, 20, [i % 2 ? FC.roseRed : FC.daisy], 2, rnd, [Math.cos(a) * 0.6, Math.sin(a) * 0.6]);
  }
  return merge(
    ring(14, 8, z, "StoneLight", 10),
    cylinderAt({ rBot: 9, rTop: 7, height: 14, segments: 10, bottom: [0, 0, z + 8] }, "StoneWhite"),
    cylinderAt({ rBot: 9, rTop: 24, height: 26, segments: 12, bottom: [0, 0, z + 22] }, "StoneWhite"),
    translate(torus(23, 3, 12, 4, "StoneLight"), [0, 0, z + 48]),
    cylinderAt({ radius: 21, height: 2, segments: 12, bottom: [0, 0, z + 47] }, "Palace_Soil"),
    cards.geo(),
  );
}

// ===================================================================== the walls and gates
// ---- the curtain wall: 800 cm along Y (pieces join end to end), the outside to -X ----
// A footing, the white wall to 7.8 m, a crenellated parapet out on corbels, a paved wall-walk,
// buttresses and slits outside with a long royal banner between them, pilasters and a lantern
// inside.
function palaceWall(): Geo {
  const L = 400, H = 780, out: Geo[] = [];
  const mason: Geo[] = [
    boxBounds([-172, -L, 0], [172, L, 100], "StoneGrey"),
    boxBounds([-148, -L, 100], [148, L, H], "StoneWhite"),
    boxBounds([-160, -L, H - 70], [-92, L, H + 90], "StoneWhite"),
    boxBounds([100, -L, H], [148, L, H + 62], "StoneWhite"),
  ];
  for (const y of [-300, 300])
    mason.push(boxBounds([-206, y - 42, 100], [-148, y + 42, 360], "StoneWhite"), boxBounds([-182, y - 36, 360], [-148, y + 36, 540], "StoneWhite"));
  out.push(wuv(merge(...mason), 1.4));
  out.push(
    boxBounds([-92, -L, H], [100, L, H + 4], "Cobble"),
    boxBounds([-160, -L, 420], [-148, L, 436], "StoneLight"),
    boxBounds([148, -L, 420], [160, L, 436], "StoneLight"),
    boxBounds([-166, -L, H + 90], [-86, L, H + 98], "StoneLight"),
    array(boxBounds([-166, -L + 20, H + 98], [-86, -L + 80, H + 176], "StoneWhite", 2), 8, [0, 100, 0]),
    array(boxBounds([-180, -L + 35, H - 120], [-160, -L + 65, H - 70], "StoneLight", 1.5), 8, [0, 100, 0]),
    boxBounds([96, -L, H + 62], [152, L, H + 70], "StoneLight"),
    array(boxBounds([148, -330, 100], [164, -290, 420], "StoneLight"), 4, [0, 200, 0]),
  );
  for (const y of [-300, 300])
    out.push(
      translate(rotateY(box([84, 90, 14], [0, 0, 0], "StoneLight", 2), -32), [-212, y, 364]),
      translate(rotateY(box([54, 78, 12], [0, 0, 0], "StoneLight", 2), -32), [-186, y, 544]),
    );
  for (const y of [-160, 160]) out.push(onFace(slitGeo(), "-x", 148, y, 300));
  out.push(translate(longBanner(160, 520), [-172, 0, H + 30]));
  out.push(onFace(wallLantern(), "+x", 164, 0, 380));
  return merge(...out);
}

function palaceTower(): Geo {
  return roundTower(330, 1250, 860, { slits: [180, 135, 225, 90, 270], banner: [180] });
}

// ---- the great gatehouse: the royal castle's gate as the royal road shows it, open ----
// A white stone block 9.6 m along Y with an arched passage 4.8 m wide through it (a stepped
// vault), the portcullis raised into the arch, the great doors open against the passage walls,
// the king's arms over the arch, arched windows, banners from the machicolated parapet, and two
// great round towers either side with blue cones. About 22 m along Y, the outside to -X.
const GH = { HX: 350, HY: 480, AW: 240, SP: 420, TOP: 1250, TY: 760, TR: 290 };
function greatGatehouse(): Geo {
  const { HX, HY, AW, SP, TOP } = GH, out: Geo[] = [];
  const mason: Geo[] = [
    boxBounds([-HX, -HY, 0], [HX, -AW, TOP], "StoneWhite"),
    boxBounds([-HX, AW, 0], [HX, HY, TOP], "StoneWhite"),
    boxBounds([-HX, -AW, SP + AW + 20], [HX, AW, TOP], "StoneWhite"),
    vault(-HX, HX, AW, SP, SP + AW + 20, "StoneWhite"),
  ];
  out.push(wuv(merge(...mason), 1.4));
  out.push(
    boxBounds([-HX - 20, -HY - 20, -10], [HX + 20, -AW, 110], "StoneGrey", 3),
    boxBounds([-HX - 20, AW, -10], [HX + 20, HY + 20, 110], "StoneGrey", 3),
    boxBounds([-HX - 30, -AW, 0], [HX + 30, AW, 4], "Cobble"),
    arcStones([-HX + 30, 0, SP], AW, 13, 52, 64, "StoneLight"),
    arcStones([HX - 30, 0, SP], AW, 13, 52, 64, "StoneLight"),
    boxBounds([-HX - 10, -HY - 4, 760], [-HX + 6, HY + 4, 780], "StoneLight", 2),
    boxBounds([HX - 6, -HY - 4, 760], [HX + 10, HY + 4, 780], "StoneLight", 2),
  );
  // impost blocks at the springing, front and back
  for (const x of [-HX + 30, HX - 30]) for (const s of [-1, 1]) out.push(boxBounds([x - 36, s < 0 ? -AW - 10 : AW - 4, SP - 20], [x + 36, s < 0 ? -AW + 4 : AW + 10, SP], "StoneLight", 1.5));
  // the portcullis, raised: its bottom rail and spikes show under the crown of the front arch
  {
    const XP = -HX + 72, zr = SP + 176, half = Math.sqrt(AW * AW - 176 * 176) - 4;
    out.push(boxBounds([XP - 5, -half, zr], [XP + 5, half, zr + 10], "IronDark"));
    for (let y = -half + 20; y < half; y += 40) {
      out.push(boxBounds([XP - 5, y - 5, zr], [XP + 5, y + 5, SP + AW + 30], "IronDark"));
      out.push(cylinderAt({ rBot: 1, rTop: 7, height: 26, segments: 4, bottom: [XP, y, zr - 26] }, "IronDark"));
    }
    out.push(boxBounds([XP - 4, -half + 20, zr + 52], [XP + 4, half - 20, zr + 60], "IronDark"));
  }
  // the great doors, open back against the passage walls near the inner end
  for (const s of [-1, 1]) {
    const y0 = s < 0 ? -AW + 2 : AW - 12;
    out.push(boxBounds([HX - 300, y0, 4], [HX - 60, y0 + 10, SP + 120], "DoorWood"));
    for (const z of [60, 220, 380]) out.push(boxBounds([HX - 296, s < 0 ? y0 + 10 : y0 - 2, z], [HX - 64, s < 0 ? y0 + 12 : y0, z + 14], "IronDark"));
    out.push(translate(rotateY(torus(14, 3, 12, 4, "GoldTrim"), 90), [HX - 90, s < 0 ? y0 + 16 : y0 - 6, 240]));
  }
  // the king's arms over the arch, windows above, banners from the parapet; a crest at the back
  out.push(translate(arms(90), [-HX, 0, 820]));
  out.push(translate(rotateZ(crest(60), 180), [HX, 0, 900]));
  for (const y of [-330, 330]) {
    out.push(translate(windowGeo(60, 120, { arch: true, frame: "StoneLight" }), [-HX, y, 840]));
    out.push(translate(rotateZ(windowGeo(60, 120, { arch: true, frame: "StoneLight" }), 180), [HX, y, 840]));
    out.push(translate(longBanner(150, 480), [-HX - 46, y, TOP - 40]));
  }
  // machicolations, the parapet and merlons along front and back
  for (const x of [-HX, HX]) {
    const sx = Math.sign(x);
    out.push(boxBounds([x - (sx < 0 ? 40 : 0), -HY, TOP - 60], [x + (sx > 0 ? 40 : 0), HY, TOP + 70], "StoneWhite", 2));
    for (let y = -HY + 30; y < HY; y += 60) out.push(boxBounds([x - (sx < 0 ? 40 : 0), y - 14, TOP - 120], [x + (sx > 0 ? 40 : 0), y + 14, TOP - 60], "StoneLight", 1.5));
    out.push(merlons([x + sx * 20, -HY], [x + sx * 20, HY], TOP + 70, 40, "StoneWhite", 100, 80));
  }
  out.push(boxBounds([-HX + 20, -HY, TOP], [HX - 20, HY, TOP + 6], "Cobble"));
  // lanterns either side of the gate, outside and in
  for (const s of [-1, 1]) out.push(translate(wallLantern(), [-HX, s * 330, 430]), translate(rotateZ(wallLantern(), 180), [HX, s * 330, 430]));
  // the two great towers
  for (const s of [-1, 1]) out.push(translate(roundTower(GH.TR, 1500, 900, { slits: [180, s * 90, 0], windows: [180, s * 90, 0, s * 135], banner: [180] }), [-60, s * GH.TY, 0]));
  return merge(...out);
}

// ---- the inner gate: a gate pavilion between the outer ward and the court ----
// An arched passage 4.6 m wide through a rusticated stone storey, a plaster upper storey with a
// balcony and three arched windows each way, a clock in a pediment over the front, a hipped blue
// roof crowned by an open cupola; square turrets with blue spires either side. 16 m along Y.
const IG = { HX: 320, HY: 560, AW: 230, SP: 380, G: 900, E: 1420, TW: 130 };
function innerGate(): Geo {
  const { HX, HY, AW, SP, G, E, TW } = IG, out: Geo[] = [];
  out.push(wuv(merge(
    boxBounds([-HX, -HY, 0], [HX, -AW, G], "StoneWhite"),
    boxBounds([-HX, AW, 0], [HX, HY, G], "StoneWhite"),
    boxBounds([-HX, -AW, SP + AW + 20], [HX, AW, G], "StoneWhite"),
    vault(-HX, HX, AW, SP, SP + AW + 20, "StoneWhite"),
  ), 1.3));
  out.push(
    boxBounds([-HX - 16, -HY - 16, 0], [HX + 16, -AW, 70], "StoneGrey", 3),
    boxBounds([-HX - 16, AW, 0], [HX + 16, HY + 16, 70], "StoneGrey", 3),
    boxBounds([-HX - 20, -AW, 0], [HX + 20, AW, 4], "Cobble"),
    arcStones([-HX + 26, 0, SP], AW, 11, 50, 56, "StoneLight"),
    arcStones([HX - 26, 0, SP], AW, 11, 50, 56, "StoneLight"),
  );
  // rustication: deep joints in the stone storey's faces
  for (const x of [-HX, HX]) for (let z = 140; z < G - 40; z += 110) for (const s of [-1, 1]) out.push(boxBounds([x - 3, s < 0 ? -HY : AW + 20, z], [x + 3, s < 0 ? -AW - 20 : HY, z + 8], "StoneLight"));
  // the upper storey
  out.push(
    boxBounds([-HX + 6, -HY + 6, G], [HX - 6, HY - 6, E], "Palace_Plaster"),
    boxBounds([-HX - 14, -HY - 14, G - 10], [HX + 14, HY + 14, G + 14], "StoneWhite", 3),
    boxBounds([-HX - 16, -HY - 16, E - 30], [HX + 16, HY + 16, E + 4], "StoneWhite", 3),
    quoins(HX - 6, HY - 6, G + 20, E - 30),
  );
  for (const f of ["-x", "+x"] as const) {
    for (const u of [-300, 0, 300]) out.push(onFace(windowGeo(110, 230, { arch: true }), f, HX - 6, u, G + 90));
    // the balcony over the arch
    const bal = merge(
      boxBounds([-90, -260, -16], [0, 260, 0], "StoneWhite", 2),
      ...[-200, -100, 0, 100, 200].map((y) => translate(rotateY(box([40, 30, 60], [0, 0, 0], "StoneLight", 2), 30), [-40, y, -46])),
      balusters(-80, -250, 250, 0),
      boxBounds([-88, -260, 60], [-72, 260, 70], "StoneWhite", 1.5),
      boxBounds([-88, -262, 0], [0, -246, 70], "StoneWhite"),
      boxBounds([-88, 246, 0], [0, 262, 70], "StoneWhite"),
    );
    out.push(onFace(bal, f, HX - 6, 0, G + 40));
  }
  for (const f of ["-y", "+y"] as const) out.push(onFace(windowGeo(100, 210, { arch: true }), f, HY - 6, 0, G + 100));
  // the roof, the clock pediment on the front and the crest pediment at the back
  out.push(hipRoof(HX, HY, E, 360, 40, 40));
  const ped = (face: "-x" | "+x", clock: boolean): Geo => {
    const g: Geo[] = [
      wuv(merge(boxBounds([-60, -170, 0], [0, 170, 220], "StoneWhite"), gableWall(-60, 190, 220, 150, "StoneWhite")), 1.2),
      rotateZ(gableRoof([90, 400, 16], [-40, 0, 220], 156, 18, "RoofBlue"), 90),
      boxBounds([-70, -190, 206], [6, 190, 224], "StoneLight", 2),
    ];
    if (clock) {
      g.push(
        translate(panel(circleShape(78), -4, 6, "StoneLight", { seg: 10 }), [-60, 0, 110]),
        translate(panel(circleShape(68), -6, 2, "Palace_ClockFace", { seg: 10 }), [-60, 0, 110]),
        translate(panel(circleShape(72), -5, 1, "GoldTrim", { seg: 10 }), [-60, 0, 110]),
      );
      for (let i = 0; i < 12; i++) g.push(translate(rotateX(boxBounds([-8, -3, 54], [-6, 3, 64], i % 3 ? "Palace_Dark" : "GoldTrim"), i * 30), [-60, 0, 110]));
      g.push(translate(merge(boxBounds([-9, -3, -4], [-7, 3, 50], "Palace_Dark"), rotateX(boxBounds([-9, -3, -4], [-7, 3, 36], "Palace_Dark"), -110)), [-60, 0, 110]));
    } else g.push(translate(crest(70), [-60, 0, 110]));
    g.push(translate(merge(sphereCenter(10, [0, 0, 0], "GoldTrim", 8), cylinderAt({ rBot: 4, rTop: 0.5, height: 40, segments: 4, bottom: [0, 0, 6] }, "GoldTrim")), [-60, 0, 380]));
    return onFace(merge(...g), face, HX - 20, 0, E);
  };
  out.push(ped("-x", true), ped("+x", false));
  // the cupola: an open octagonal lantern on columns, a little dome and the crown
  const CZ = E + 360 + 22;
  out.push(ring(130, 30, CZ - 20, "StoneLight", 8), ring(120, 10, CZ + 10, "StoneWhite", 8));
  for (let i = 0; i < 8; i++) out.push(rotateZ(translate(column(10, 190, "StoneWhite"), [108, 0, CZ + 20]), i * 45 + 22.5));
  out.push(ring(132, 26, CZ + 210, "StoneWhite", 8), translate(scale(sphereCenter(122, [0, 0, 0], "RoofBlue", 12), [1, 1, 0.8]), [0, 0, CZ + 236]));
  out.push(ring(18, 40, CZ + 320, "GoldTrim", 8, 10), translate(panel(crownShape(30), -3, 6, "GoldTrim"), [0, 0, CZ + 380]), translate(rotateZ(panel(crownShape(30), -3, 6, "GoldTrim"), 90), [0, 0, CZ + 380]));
  out.push(translate(lantern(), [0, 0, CZ + 30]));
  // lanterns either side of the arch, each way
  for (const s of [-1, 1]) out.push(translate(wallLantern(), [-HX, s * 330, 360]), translate(rotateZ(wallLantern(), 180), [HX, s * 330, 360]));
  // the turrets either side
  for (const s of [-1, 1]) {
    const y = s * (HY + TW), T = 1500, t: Geo[] = [];
    t.push(wuv(merge(boxBounds([-TW, y - TW, 0], [TW, y + TW, T], "StoneWhite")), 1.3));
    t.push(boxBounds([-TW - 14, y - TW - 14, 0], [TW + 14, y + TW + 14, 70], "StoneGrey", 3));
    for (const z of [G - 10, T - 30]) t.push(boxBounds([-TW - 12, y - TW - 12, z], [TW + 12, y + TW + 12, z + 26], "StoneLight", 2));
    t.push(translate(quoins(TW, TW, 80, T - 40), [0, y, 0]));
    t.push(translate(rotateZ(cylinderAt({ rBot: TW * 1.62, rTop: 3, height: 620, segments: 4, bottom: [0, 0, T - 4] }, "RoofBlue"), 45), [0, y, 0]));
    t.push(sphereCenter(12, [0, y, T + 610], "GoldTrim", 8), cylinderBetween([0, y, T + 610], [0, y, T + 720], 3, 6, "GoldTrim"));
    for (const f of ["-x", "+x"] as const) t.push(onFace(slitGeo(110), f, TW, y, 420), onFace(windowGeo(50, 110, { arch: true }), f, TW, y, 1100));
    t.push(onFace(slitGeo(110), s < 0 ? "-y" : "+y", HY + 2 * TW, 0, 420));
    out.push(merge(...t));
  }
  return merge(...out);
}

// ---- a postern: a square gate tower for the back and side gates ----
// An arched passage 3.8 m wide through a square tower 8 m along Y, corner bartizans with blue
// cones, a crenellated parapet, a blue pyramid roof behind it, the arms over the arch.
const PG = { HX: 300, HY: 400, AW: 190, SP: 320, TOP: 1000 };
function posternGate(): Geo {
  const { HX, HY, AW, SP, TOP } = PG, out: Geo[] = [];
  out.push(wuv(merge(
    boxBounds([-HX, -HY, 0], [HX, -AW, TOP], "StoneWhite"),
    boxBounds([-HX, AW, 0], [HX, HY, TOP], "StoneWhite"),
    boxBounds([-HX, -AW, SP + AW + 20], [HX, AW, TOP], "StoneWhite"),
    vault(-HX, HX, AW, SP, SP + AW + 20, "StoneWhite"),
  ), 1.3));
  out.push(
    boxBounds([-HX - 16, -HY - 16, 0], [HX + 16, -AW, 80], "StoneGrey", 3),
    boxBounds([-HX - 16, AW, 0], [HX + 16, HY + 16, 80], "StoneGrey", 3),
    boxBounds([-HX - 20, -AW, 0], [HX + 20, AW, 4], "Cobble"),
    arcStones([-HX + 24, 0, SP], AW, 11, 46, 52, "StoneLight"),
    arcStones([HX - 24, 0, SP], AW, 11, 46, 52, "StoneLight"),
    boxBounds([-HX - 30, -HY - 30, TOP - 40], [HX + 30, HY + 30, TOP + 40], "StoneWhite", 2),
    boxBounds([-HX + 10, -HY + 10, TOP + 40], [HX - 10, HY - 10, TOP + 44], "Cobble"),
  );
  for (const x of [-HX - 30, HX + 30]) for (let y = -HY + 20; y < HY; y += 56) out.push(boxBounds([x - 10, y - 12, TOP - 90], [x + 10, y + 12, TOP - 40], "StoneLight", 1.5));
  for (const [a, b] of [[[-HX - 18, -HY - 18], [HX + 18, -HY - 18]], [[HX + 18, -HY - 18], [HX + 18, HY + 18]], [[HX + 18, HY + 18], [-HX - 18, HY + 18]], [[-HX - 18, HY + 18], [-HX - 18, -HY - 18]]] as [[number, number], [number, number]][]) out.push(merlons(a, b, TOP + 40, 26, "StoneWhite", 90, 64));
  out.push(hipRoof(HX - 40, HY - 40, TOP + 40, 460, 0, 0, 20));
  out.push(sphereCenter(11, [0, 0, TOP + 530], "GoldTrim", 8), cylinderBetween([0, 0, TOP + 530], [0, 0, TOP + 640], 3, 6, "IronDark"), sheet([0, 0, TOP + 636], [0, 0, TOP + 590], [0, -110, TOP + 612], 5, "Palace_RoyalBlue", 3));
  // bartizans on the corners
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) {
      const c = [sx * (HX + 10), sy * (HY + 10)];
      out.push(translate(merge(
        cylinderAt({ rBot: 20, rTop: 86, height: 120, segments: 12, bottom: [0, 0, TOP - 170] }, "StoneLight"),
        ring(86, 200, TOP - 50, "StoneWhite", 12),
        ring(92, 12, TOP + 146, "StoneLight", 12),
        ring(100, 230, TOP + 156, "RoofBlue", 12, 3),
        sphereCenter(8, [0, 0, TOP + 392], "GoldTrim", 6),
      ), [c[0], c[1], 0]));
    }
  for (const f of ["-x", "+x"] as const) {
    out.push(onFace(arms(54), f, HX, 0, 640), onFace(slitGeo(90), f, HX, -280, 640), onFace(slitGeo(90), f, HX, 280, 640));
    for (const s of [-1, 1]) out.push(onFace(wallLantern(), f, HX, s * 270, 330));
  }
  out.push(translate(longBanner(120, 360), [-HX - 46, 0, TOP - 50]));
  return merge(...out);
}

// ===================================================================== the court's buildings
// ---- the throne hall (ท้องพระโรง) ----
// A hall 30 m across whose whole front (-X) is a colonnade of eight tall columns under a pediment
// with the king's arms, so from the court the eye runs between the columns down the red carpet
// to the throne on its three-step dais against the back wall (the hall is kept shallow and its
// columns tall so that the dais shows under the entablature from the camera's 45 degrees). Behind
// the back wall the king's rooms, closed; a dome over them with an open lantern; square towers
// with blue spires on the front corners carrying long banners. Inside: marble floor, braziers,
// chandeliers, banners down the side walls and the back wall, a canopy over the throne.
// X from -800 (the colonnade's steps) to 900, Y ±1520 (±1820 with the towers).
const TH = { X0: -800, X1: 900, HY: 1520, CX: -720, CR: 52, CZ: 1300, E: 1500, BACK: 380, DAIS: -60, DY: 540, DH: 120 };
const COLS = [-1240, -900, -560, -220, 220, 560, 900, 1240];
function throneHall(): Geo {
  const { X0, X1, HY, CX, CR, CZ, E, BACK, DAIS, DY } = TH, IN = HY - 60, out: Geo[] = [];
  // the floor: marble, a band of blue lozenges either side of the red carpet
  out.push(
    boxBounds([X0 - 20, -IN, 0], [BACK, IN, 6], "MarbleWhite"),
    boxBounds([X0 - 70, -1340, 0], [X0 - 20, 1340, 3], "StoneLight", 1),
    boxBounds([X0 - 70, -150, 6], [DAIS, 150, 7.5], "Palace_Carpet"),
    boxBounds([X0 - 70, -162, 6], [DAIS, -150, 8], "GoldTrim"),
    boxBounds([X0 - 70, 150, 6], [DAIS, 162, 8], "GoldTrim"),
  );
  for (let x = X0 + 40; x < DAIS - 60; x += 150) for (const y of [-300, 300, -900, 900]) out.push(translate(rotateZ(boxAt([62, 62, 1], [0, 0, 6], "StoneBlueDark"), 45), [x, y, 0]));
  // the dais: three marble steps with gold nosings and the carpet up them
  for (let i = 0; i < 3; i++) {
    const x0 = DAIS + i * 30, y = DY - i * 30, z0 = i * 40;
    out.push(wuv(boxBounds([x0, -y, z0], [BACK, y, z0 + 40], "MarbleWhite", 2)));
    out.push(boxBounds([x0 - 2, -y - 2, z0 + 33], [x0 + 6, y + 2, z0 + 40], "GoldTrim"));
    out.push(boxBounds([x0 - 1, -150, z0], [x0 + 30, 150, z0 + 41], "Palace_Carpet"));
  }
  out.push(boxBounds([DAIS + 90, -150, 120], [BACK, 150, 121.5], "Palace_Carpet"));
  // the throne: gilt frame, blue velvet, lion arms, a crown on its back, a footstool
  out.push(
    boxBounds([120, -112, 120], [262, 112, 136], "GoldTrim", 2),
    boxBounds([132, -78, 136], [222, 78, 186], "GoldTrim", 3),
    boxBounds([126, -68, 186], [218, 68, 200], "Palace_Velvet", 3),
    boxBounds([214, -86, 136], [252, 86, 450], "GoldTrim", 3),
    boxBounds([208, -66, 206], [214, 66, 428], "Palace_Velvet"),
    translate(panel(crownShape(52), -4, 8, "GoldTrim"), [233, 0, 470]),
    sphereCenter(9, [233, -86, 456], "GoldTrim", 8), sphereCenter(9, [233, 86, 456], "GoldTrim", 8),
    boxBounds([76, -44, 120], [114, 44, 142], "Palace_Velvet", 3),
  );
  for (const s of [-1, 1]) out.push(boxBounds([128, s * 78 - 9, 136], [236, s * 78 + 9, 236], "GoldTrim", 2), sphereCenter(13, [124, s * 78, 238], "GoldTrim", 8), sphereCenter(6, [113, s * 78, 236], "GoldTrim", 6));
  // the canopy over the throne, hung from the back wall: a velvet tester with a gold fringe and
  // curtains caught back at its sides, the crown on top
  out.push(
    boxBounds([110, -260, 700], [BACK, 260, 740], "Palace_Velvet", 3),
    boxBounds([106, -264, 684], [BACK, 264, 700], "GoldTrim"),
    translate(panel(crownShape(60), -4, 8, "GoldTrim"), [110, 0, 790]),
  );
  for (const s of [-1, 1]) out.push(hullGeo([[BACK, s * 250, 690], [BACK, s * 190, 690], [130, s * 250, 690], [150, s * 236, 690], [BACK, s * 236, 140], [BACK, s * 210, 140], [300, s * 244, 140], [300, s * 230, 140]], "Palace_Velvet"), cylinderBetween([300, s * 252, 360], [300, s * 226, 360], 4, 6, "GoldTrim"));
  // the back wall of the hall (the king's rooms behind it): pilasters, the arms over the throne,
  // long banners, two doors, braziers before the dais, chandeliers
  out.push(wuv(boxBounds([BACK, -IN, 0], [X1, IN, E], "Palace_Plaster"), 1.2));
  out.push(boxBounds([BACK - 6, -IN, 0], [BACK, IN, 130], "StoneLight"), boxBounds([BACK - 10, -IN, 1380], [BACK, IN, 1440], "StoneWhite"));
  for (const y of [-1300, -760, 760, 1300]) out.push(boxBounds([BACK - 22, y - 34, 0], [BACK, y + 34, 1380], "StoneWhite"), boxBounds([BACK - 30, y - 42, 1330], [BACK, y + 42, 1380], "StoneLight", 2), boxBounds([BACK - 30, y - 42, 0], [BACK, y + 42, 40], "StoneLight", 2));
  out.push(translate(arms(140), [BACK - 2, 0, 900]));
  for (const y of [-520, 520, -1030, 1030]) out.push(translate(longBanner(150, 560), [BACK - 30, y, 1330]));
  for (const y of [-1150, 1150]) out.push(onFace(doorGeo(130, 260, { arch: true, step: false, frame: "StoneWhite" }), "-x", -BACK, y, 0));
  for (const s of [-1, 1]) {
    const b = merge(
      boxAt([70, 70, 14], [0, 0, 6], "StoneGrey", 2),
      ...[0, 120, 240].map((a) => rotateZ(beamBetween([26, 0, 18], [12, 0, 130], 6, 6, "IronDark"), a)),
      cylinderAt({ rBot: 20, rTop: 40, height: 22, segments: 10, bottom: [0, 0, 124] }, "IronDark"),
      ring(36, 4, 140, "Palace_Coal", 10),
      cylinderAt({ rBot: 30, rTop: 4, height: 46, segments: 7, bottom: [0, 0, 144] }, "FireGlow"),
    );
    out.push(translate(b, [-150, s * 660, 0]));
    // a chandelier: a gold ring of candles on chains
    const ch: Geo[] = [cylinderBetween([0, 0, E - 10], [0, 0, 1040], 2, 4, "IronDark"), translate(torus(70, 5, 16, 5, "GoldTrim"), [0, 0, 1000]), sphereCenter(14, [0, 0, 990], "GoldTrim", 8)];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ch.push(cylinderAt({ radius: 3, height: 16, segments: 5, bottom: [Math.cos(a) * 70, Math.sin(a) * 70, 1004] }, "Palace_PaintWhite"), sphereCenter(3.5, [Math.cos(a) * 70, Math.sin(a) * 70, 1024], "LanternGlow", 5));
      ch.push(cylinderBetween([Math.cos(a) * 66, Math.sin(a) * 66, 1004], [0, 0, 1130], 0.8, 3, "IronDark"));
    }
    out.push(translate(merge(...ch), [-260, s * 760, 0]));
  }
  // the side walls: a stone plinth, white plaster, arched windows of stained glass inside and
  // out, pilasters, banners hung between the windows inside
  for (const s of [-1, 1]) {
    const y0 = s < 0 ? -HY : IN, y1 = s < 0 ? -IN : HY, f: Face = s < 0 ? "-y" : "+y", fi: Face = s < 0 ? "+y" : "-y";
    out.push(wuv(merge(boxBounds([X0, y0, 0], [X1, y1, 150], "StoneLight"), boxBounds([X0, y0 - 10 * (s < 0 ? 1 : 0), 0], [X1, y1 + 10 * (s > 0 ? 1 : 0), 60], "StoneGrey")), 1.2));
    out.push(boxBounds([X0, y0, 150], [X1, y1, E], "Palace_Plaster"));
    out.push(boxBounds([X0, s < 0 ? -HY - 12 : HY - 2, E - 70], [X1 + 14, s < 0 ? -HY + 2 : HY + 12, E], "StoneLight", 2));
    for (const x of [-300, 50, 420, 740]) out.push(onFace(merge(windowGeo(130, 560, { arch: true, glass: "Palace_GlassBlue" }), translate(crest(22), [-6, 0, 640])), f, HY, x, 330));
    for (const x of [-480, -120, 240, 600, 880]) out.push(onFace(boxBounds([-14, -30, 0], [0, 30, E - 70], "StoneWhite"), f, HY, x, 150));
    for (const x of [-300, 50]) out.push(onFace(windowGeo(130, 560, { arch: true, glass: "Palace_GlassBlue" }), fi, -IN, x, 330));
    // outside: a string course over the windows, round windows above it, grooves in the plinth
    const ys0 = s < 0 ? -HY - 10 : HY - 2, ys1 = s < 0 ? -HY + 2 : HY + 10;
    out.push(boxBounds([X0 + 300, ys0, 980], [X1 + 10, ys1, 1004], "StoneWhite", 2));
    for (const z of [52, 102]) out.push(boxBounds([X0 + 300, s < 0 ? -HY - 4 : HY - 2, z], [X1 + 4, s < 0 ? -HY + 2 : HY + 4, z + 6], "StoneGrey"));
    for (const x of [-300, 50, 420, 740]) out.push(onFace(merge(panel(circleShape(46), -6, 8, "StoneLight", { seg: 10 }), panel(circleShape(35), -8, 2, "Palace_GlassBlue", { seg: 10 }), boxBounds([-10, -35, -2], [-8, 35, 2], "Palace_PaintWhite"), boxBounds([-10, -2, -35], [-8, 2, 35], "Palace_PaintWhite")), f, HY, x, 1190));
    // dormers along the roof's slope, each with a round window
    for (const x of [-420, 60, 660]) {
      const dm = merge(
        boxBounds([0, -90, 0], [220, 90, 170], "Palace_Plaster"),
        boxBounds([-6, -96, 160], [6, 96, 176], "StoneWhite"),
        gableRoof([250, 210, 10], [110, 0, 172], 74, 12, "RoofBlue"),
        gableWall(0, 90, 172, 70, "Palace_Plaster"),
        translate(merge(panel(circleShape(40), -6, 8, "StoneWhite", { seg: 10 }), panel(circleShape(30), -8, 2, "GlassBlue", { seg: 10 })), [0, 0, 90]),
      );
      out.push(translate(rotateZ(dm, s < 0 ? 90 : -90), [x, s * 1310, 1556]));
    }
    for (const x of [-480, -120, 230]) out.push(onFace(merge(boxBounds([-14, -30, 0], [0, 30, CZ], "StoneWhite"), translate(longBanner(110, 380), [-30, 0, CZ - 120])), fi, -IN, x, 0));
  }
  // the ceiling, the front entablature (architrave, gold band, frieze with crests, cornice)
  out.push(boxBounds([CX + 70, -IN, E - 12], [BACK, IN, E], "Palace_PaintWhite"));
  out.push(
    wuv(boxBounds([X0 + 8, -HY, CZ], [CX + 70, HY, CZ + 66], "StoneWhite", 2), 1.3),
    boxBounds([X0 + 4, -HY, CZ + 66], [CX + 70, HY, CZ + 74], "GoldTrim"),
    boxBounds([X0 + 10, -HY, CZ + 74], [CX + 70, HY, CZ + 150], "Palace_Plaster"),
    boxBounds([X0 - 14, -HY - 14, CZ + 150], [CX + 84, HY + 14, E], "StoneLight", 3),
  );
  for (const y of COLS) out.push(translate(crest(26), [X0 + 10, y, CZ + 112]));
  // the colonnade
  for (const y of COLS) out.push(translate(column(CR, CZ - 6), [CX, y, 6]));
  // the pediment, the arms in it, raking cornices; the roof and the back gable
  out.push(wuv(gableWall(X0 + 4, HY, E, 600, "StoneWhite"), 1.3));
  out.push(translate(arms(120), [X0 + 4, 0, E + 130]));
  for (const s of [-1, 1]) out.push(beamBetween([X0 - 6, s * (HY + 30), E + 6], [X0 - 6, 0, E + 626], 34, 44, "StoneLight"));
  out.push(translate(merge(sphereCenter(16, [0, 0, 0], "GoldTrim", 8), cylinderAt({ rBot: 6, rTop: 0.5, height: 70, segments: 4, bottom: [0, 0, 10] }, "GoldTrim")), [X0 - 6, 0, E + 650]));
  out.push(gableRoof([X1 - X0 + 20, 2 * HY + 20, 30], [(X0 + X1) / 2, 0, E], 600, 40, "RoofBlue"));
  out.push(ridge([X0 - 30, 0, E + 640], [X1 + 30, 0, E + 640], 14));
  for (let x = X0 + 40; x < X1; x += 140) out.push(cylinderAt({ rBot: 7, rTop: 0.5, height: 44, segments: 4, bottom: [x, 0, E + 648] }, "GoldTrim"), sphereCenter(5, [x, 0, E + 654], "GoldTrim", 6));
  out.push(wuv(gableWall(X1 - 4, HY, E, 596, "Palace_Plaster"), 1.2), translate(rotateZ(rose(80), 180), [X1, 0, E + 230]));
  // the back (+X): tall windows, the king's door to the garden under a balcony, lanterns
  for (const y of [-1100, -600, 600, 1100]) out.push(onFace(windowGeo(120, 520, { arch: true }), "+x", X1, y, 330));
  out.push(onFace(doorGeo(180, 320, { arch: true, double: true, frame: "StoneWhite" }), "+x", X1, 0, 0));
  out.push(onFace(merge(
    boxBounds([-120, -300, -18], [0, 300, 0], "StoneWhite", 2),
    ...[-220, 0, 220].map((y) => translate(rotateY(box([50, 34, 70], [0, 0, 0], "StoneLight", 2), 30), [-46, y, -52])),
    balusters(-110, -290, 290, 0),
    boxBounds([-120, -300, 60], [-100, 300, 72], "StoneWhite", 1.5),
    translate(windowGeo(120, 260, { arch: true }), [0, 0, 40]),
  ), "+x", X1, 0, 520));
  for (const s of [-1, 1]) out.push(onFace(wallLantern(), "+x", X1, s * 260, 300));
  out.push(boxBounds([X1 - 2, -HY - 10, 980], [X1 + 10, HY + 10, 1004], "StoneWhite", 2), translate(quoins(X1, HY, 160, E - 70, [[1, -1], [1, 1]]), [0, 0, 0]));
  for (const y of [-1100, -600, 600, 1100]) out.push(onFace(merge(panel(circleShape(46), -6, 8, "StoneLight", { seg: 10 }), panel(circleShape(35), -8, 2, "Palace_GlassBlue", { seg: 10 })), "+x", X1, y, 1190));
  for (const y of [-1350, -850, -350, 350, 850, 1350]) out.push(onFace(boxBounds([-14, -30, 0], [0, 30, E - 70], "StoneWhite"), "+x", X1, y, 150));
  // the dome over the king's rooms: a drum with arched windows, a blue dome with gold ribs, an
  // open lantern with the crown
  {
    const DX = 520, Z0 = 1700, R = 420, d: Geo[] = [];
    d.push(wuv(ring(R, 520, Z0, "StoneWhite", 16), 1.3), ring(R + 20, 28, Z0 + 500, "StoneLight", 16), ring(R + 8, 20, Z0 + 230, "StoneLight", 16));
    for (let i = 0; i < 8; i++) d.push(onRound(windowGeo(70, 170, { arch: true, frame: "StoneLight" }), R * Math.cos(Math.PI / 16), i * 45 + 22.5, Z0 + 270));
    for (let i = 0; i < 16; i++) d.push(rotateZ(boxBounds([R - 4, -14, Z0 + 20], [R + 12, 14, Z0 + 500], "StoneWhite"), i * 22.5));
    d.push(translate(scale(sphereCenter(R + 6, [0, 0, 0], "RoofBlue", 16), [1, 1, 0.82]), [0, 0, Z0 + 528]));
    for (let i = 0; i < 8; i++) {
      const pts: V3[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = (k / 6) * (Math.PI / 2) * 0.92;
        pts.push([Math.cos(t) * (R + 10), 0, Z0 + 528 + Math.sin(t) * (R + 10) * 0.82]);
      }
      for (let k = 0; k < 6; k++) d.push(rotateZ(beamBetween(pts[k], pts[k + 1], 12, 8, "GoldTrim"), i * 45));
    }
    const LZ = Z0 + 528 + (R + 6) * 0.8;
    d.push(ring(96, 16, LZ - 10, "StoneLight", 8));
    for (let i = 0; i < 8; i++) d.push(rotateZ(translate(column(9, 150, "StoneWhite"), [80, 0, LZ + 6]), i * 45 + 22.5));
    d.push(translate(lantern(), [0, 0, LZ + 20]), ring(100, 18, LZ + 156, "StoneWhite", 8), ring(104, 110, LZ + 174, "RoofBlue", 8, 14));
    d.push(sphereCenter(18, [0, 0, LZ + 300], "GoldTrim", 8), translate(panel(crownShape(36), -3, 6, "GoldTrim"), [0, 0, LZ + 330]), translate(rotateZ(panel(crownShape(36), -3, 6, "GoldTrim"), 90), [0, 0, LZ + 330]));
    out.push(translate(merge(...d), [DX, 0, 0]));
  }
  // the corner towers either side of the colonnade
  for (const s of [-1, 1]) {
    const cy = s * (HY + 150), H = 1750, T: Geo[] = [];
    T.push(wuv(boxBounds([X0, cy - 150, 0], [X0 + 300, cy + 150, H], "StoneWhite"), 1.3));
    T.push(boxBounds([X0 - 14, cy - 164, 0], [X0 + 314, cy + 164, 90], "StoneGrey", 3));
    for (const z of [CZ, H - 30]) T.push(boxBounds([X0 - 12, cy - 162, z], [X0 + 312, cy + 162, z + 30], "StoneLight", 2));
    T.push(translate(quoins(150, 150, 100, H - 40), [X0 + 150, cy, 0]));
    // the belfry stage and the spire
    T.push(wuv(boxBounds([X0 + 20, cy - 130, H], [X0 + 280, cy + 130, H + 300], "StoneWhite"), 1.3));
    T.push(boxBounds([X0 + 6, cy - 144, H + 290], [X0 + 294, cy + 144, H + 320], "StoneLight", 2));
    for (const f of ["-x", "+x", "-y", "+y"] as const) T.push(translate(onFace(lancet(70, 160, "Palace_Dark"), f, 130, 0, H + 60), [X0 + 150, cy, 0]));
    T.push(translate(rotateZ(cylinderAt({ rBot: 210, rTop: 3, height: 760, segments: 4, bottom: [0, 0, H + 316] }, "RoofBlue"), 45), [X0 + 150, cy, 0]));
    T.push(sphereCenter(13, [X0 + 150, cy, H + 1066], "GoldTrim", 8), cylinderBetween([X0 + 150, cy, H + 1066], [X0 + 150, cy, H + 1220], 3, 6, "IronDark"), sheet([X0 + 150, cy, H + 1214], [X0 + 150, cy, H + 1160], [X0 + 150, cy - 140, H + 1186], 6, "Palace_RoyalBlue", 3));
    for (const f of ["-x", s < 0 ? "-y" : "+y"] as const) T.push(translate(onFace(windowGeo(70, 200, { arch: true }), f, 150, 0, 700), [X0 + 150, cy, 0]));
    T.push(translate(longBanner(150, 760), [X0 - 30, cy, CZ - 40]));
    T.push(translate(onFace(wallLantern(), "-x", 150, s * -100, 330), [X0 + 150, cy, 0]));
    out.push(merge(...T));
  }
  return merge(...out);
}

// ---- the royal chapel (โบสถ์หลวง) ----
// A Gothic chapel 13 m wide: a square front tower over the portal with a rose window, a louvred
// belfry and a tall blue spire; a nave of four bays with lancets, buttresses and pinnacles; a
// round apse at the back. About 24 m long.
function royalChapel(): Geo {
  const S = 1.3, NY = 460, X0 = -640, X1 = 600, W = 860, RH = 470, out: Geo[] = [];
  out.push(wuv(merge(
    boxBounds([X0, -NY - 12, 0], [X1, NY + 12, 70], "StoneGrey"),
    boxBounds([X0, -NY, 70], [X1, NY, W], "StoneWhite"),
    gableWall(X0, NY, W, RH - 4, "StoneWhite"),
  ), S));
  out.push(
    boxBounds([X0, -NY - 10, 330], [X1, NY + 10, 346], "StoneLight"),
    boxBounds([X0 - 6, -NY - 18, W - 26], [X1, NY + 18, W + 2], "StoneLight", 3),
    gableRoof([X1 - X0, 2 * NY, 26], [(X0 + X1) / 2, 0, W], RH, 40, "RoofBlue"),
    ridge([X0 - 20, 0, W + RH + 34], [X1 + 40, 0, W + RH + 34], 14),
  );
  // the bays, both sides
  for (const s of [-1, 1]) {
    const f: Face = s < 0 ? "-y" : "+y";
    for (const x of [-500, -170, 160, 470]) {
      const yb = s * NY, o = s;
      out.push(wuv(merge(boxBounds([x - 32, Math.min(yb, yb + o * 150), 0], [x + 32, Math.max(yb, yb + o * 150), 560], "StoneWhite"), boxBounds([x - 26, Math.min(yb, yb + o * 80), 560], [x + 26, Math.max(yb, yb + o * 80), 820], "StoneWhite")), S));
      out.push(boxBounds([x - 40, Math.min(yb, yb + o * 162), 0], [x + 40, Math.max(yb, yb + o * 162), 70], "StoneGrey", 2));
      out.push(translate(rotateZ(cylinderAt({ rBot: 28, rTop: 1, height: 110, segments: 4, bottom: [0, 0, 820] }, "StoneWhite"), 45), [x, yb + o * 40, 0]), sphereCenter(5, [x, yb + o * 40, 932], "GoldTrim", 6));
    }
    for (const x of [-335, -5, 315]) out.push(onFace(lancet(110, 380), f, NY, x, 360));
  }
  // the apse
  const AR = 380, apse: Geo[] = [ring(AR + 12, 70, 0, "StoneGrey", 12), wuv(ring(AR, 790, 70, "StoneWhite", 12), S), ring(AR + 10, 16, 330, "StoneLight", 12), ring(AR + 18, 24, 840, "StoneLight", 12), ring(AR + 46, 380, 864, "RoofBlue", 12, 4), sphereCenter(11, [0, 0, 1248], "GoldTrim", 8)];
  for (const a of [-55, 0, 55]) apse.push(onRound(lancet(90, 300), AR * Math.cos(15 * D), a, 380));
  out.push(translate(merge(...apse), [X1, 0, 0]));
  // the front tower: portal, rose window, clock-less belfry with louvred lancets, spire, cross
  const TX0 = -1060, TX1 = X0 + 20, TY = 230, T = 1500, tw: Geo[] = [];
  tw.push(wuv(merge(boxBounds([TX0, -TY, 0], [TX1, TY, T], "StoneWhite"), ...[[-1, -1], [-1, 1]].map(([, sy]) => boxBounds([TX0 - 30, sy * TY - 30, 0], [TX0 + 30, sy * TY + 30, 1150], "StoneWhite"))), S));
  tw.push(boxBounds([TX0 - 40, -TY - 40, 0], [TX1, TY + 40, 80], "StoneGrey", 3));
  for (const z of [640, 1150, T - 20]) tw.push(boxBounds([TX0 - 12, -TY - 12, z], [TX1, TY + 12, z + 20], "StoneLight", 2));
  for (const sy of [-1, 1]) tw.push(translate(rotateZ(cylinderAt({ rBot: 40, rTop: 6, height: 80, segments: 4, bottom: [0, 0, 1150] }, "StoneLight"), 45), [TX0, sy * TY, 0]));
  // the portal: pointed arch in three orders, a gable over it, the crest in its tympanum
  {
    const hw = 100, sp = 260;
    tw.push(panel(archShape(hw + 40, sp, true), TX0 - 30, 4, "StoneLight"), panel(archShape(hw + 26, sp, true), TX0 - 26, 4, "StoneWhite"), panel(archShape(hw + 12, sp, true), TX0 - 22, 4, "StoneLight"));
    tw.push(panel(archShape(hw, sp, true, sp - 4), TX0 - 20, 2, "StoneGrey"), translate(crest(30), [TX0 - 20, 0, sp + 70]));
    tw.push(panel(rectShape(hw, sp - 12), TX0 - 18, 4, "DoorWood", { vertical: true }), boxBounds([TX0 - 20, -1.5, 0], [TX0 - 18, 1.5, sp - 12], "WoodDark"));
    for (const z of [40, 130, 210]) tw.push(boxBounds([TX0 - 21, -hw + 6, z], [TX0 - 18, -6, z + 8], "IronDark"), boxBounds([TX0 - 21, 6, z], [TX0 - 18, hw - 6, z + 8], "IronDark"));
    tw.push(gableRoof([60, 2 * (hw + 60), 12], [TX0 - 30, 0, sp + 2 * hw + 30], 90, 6, "StoneLight"));
    for (let i = 0; i < 3; i++) tw.push(boxBounds([TX0 - 90 + i * 20, -hw - 70, i * 6], [TX0 - 30, hw + 70, (i + 1) * 6], "StoneLight", 1));
    for (const sy of [-1, 1]) tw.push(onFace(wallLantern(), "-x", -TX0, sy * (hw + 70), 300));
  }
  tw.push(translate(rose(110), [TX0, 0, 900]));
  // the belfry and spire
  tw.push(wuv(boxBounds([TX0 + 30, -TY + 30, T], [TX1 - 30, TY - 30, T + 340], "StoneWhite"), S));
  for (const f of ["-x", "+x", "-y", "+y"] as const) {
    const cx = (TX0 + TX1) / 2, half = (TX1 - TX0) / 2 - 30;
    tw.push(translate(onFace(lancet(80, 180, "Palace_Dark"), f, f.endsWith("x") ? half : TY - 30, 0, T + 70), [cx, 0, 0]));
  }
  {
    const cx = (TX0 + TX1) / 2;
    tw.push(translate(merge(ring(240, 26, T + 330, "StoneLight", 8), ring(220, 1100, T + 356, "RoofBlue", 8, 3), sphereCenter(12, [0, 0, T + 1450], "GoldTrim", 8), boxBounds([-5, -5, T + 1456], [5, 5, T + 1580], "GoldTrim"), boxBounds([-5, -30, T + 1530], [5, 30, T + 1542], "GoldTrim")), [cx, 0, 0]));
    for (const [sx, sy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) tw.push(translate(rotateZ(cylinderAt({ rBot: 30, rTop: 2, height: 160, segments: 4, bottom: [0, 0, T + 340] }, "StoneWhite"), 45), [cx + sx * 180, sy * 180, 0]));
  }
  out.push(merge(...tw));
  return merge(...out);
}

// ---- the royal library (หอสมุดหลวง) ----
// Two storeys, 19 m along its front: a rusticated stone ground storey with arched windows,
// plaster above with tall windows, a hipped blue roof; a pedimented middle bay with the great
// door and an open book over it; a copper dome on a windowed drum with an armillary sphere on top.
function royalLibrary(): Geo {
  const HX = 620, HY = 940, G = 450, E = 920, out: Geo[] = [];
  out.push(wuv(merge(boxBounds([-HX - 10, -HY - 10, 0], [HX + 10, HY + 10, 60], "StoneGrey"), boxBounds([-HX, -HY, 60], [HX, HY, G], "StoneLight")), 1.2));
  for (let z = 120; z < G - 30; z += 80) out.push(boxBounds([-HX - 3, -HY - 3, z], [HX + 3, HY + 3, z + 6], "StoneGrey"));
  out.push(
    boxBounds([-HX + 4, -HY + 4, G], [HX - 4, HY - 4, E], "Palace_Plaster"),
    boxBounds([-HX - 12, -HY - 12, G - 8], [HX + 12, HY + 12, G + 14], "StoneWhite", 3),
    boxBounds([-HX - 16, -HY - 16, E - 30], [HX + 16, HY + 16, E + 4], "StoneWhite", 3),
    quoins(HX - 4, HY - 4, G + 20, E - 30),
    hipRoof(HX, HY, E, 360, 40, 40),
  );
  const on = (g: Geo, f: Face, u: number, z: number) => out.push(onFace(g, f, (f.endsWith("x") ? HX : HY) - (z >= G ? 4 : 0), u, z));
  for (const f of ["-x", "+x"] as const)
    for (const u of [-780, -540, 540, 780]) {
      on(windowGeo(100, 220, { arch: true }), f, u, 130);
      on(windowGeo(90, 260, { arch: true, shutters: false }), f, u, G + 110);
    }
  for (const u of [-300, 0, 300]) on(windowGeo(100, 220, { arch: true }), "+x", u, 130);
  for (const u of [-300, 0, 300]) on(windowGeo(90, 260, { arch: true }), "+x", u, G + 110);
  for (const f of ["-y", "+y"] as const)
    for (const u of [-340, 0, 340]) {
      on(windowGeo(100, 220, { arch: true }), f, u, 130);
      on(windowGeo(90, 260, { arch: true }), f, u, G + 110);
    }
  // the middle bay: rusticated piers, the great door, an open book over it, a pediment
  const BX = -HX - 110, BY = 340, B: Geo[] = [];
  B.push(wuv(merge(boxBounds([BX, -BY, 0], [-HX + 10, BY, E + 60], "StoneWhite"), gableWall(BX, BY + 20, E + 60, 250, "StoneWhite")), 1.3));
  B.push(gableRoof([150, 2 * BY + 40, 16], [BX + 70, 0, E + 60], 260, 22, "RoofBlue"));
  B.push(boxBounds([BX - 14, -BY - 14, E + 30], [-HX + 10, BY + 14, E + 64], "StoneLight", 2), boxBounds([BX - 10, -BY - 10, 0], [-HX + 10, BY + 10, 60], "StoneGrey", 3));
  for (const y of [-BY + 40, BY - 40, -150, 150]) B.push(boxBounds([BX - 20, y - 26, 60], [BX, y + 26, E + 30], "StoneLight"));
  B.push(onFace(doorGeo(200, 330, { arch: true, double: true, frame: "StoneLight" }), "-x", -BX, 0, 0));
  for (let i = 0; i < 3; i++) B.push(boxBounds([BX - 80 + i * 20, -220, i * 6], [BX, 220, (i + 1) * 6], "StoneLight", 1));
  // the open book: two leaves of parchment on a gilt cover, a ribbon
  B.push(translate(merge(
    rotateX(boxBounds([-4, 0, -40], [0, 70, 40], "GoldTrim", 1), 14), rotateX(boxBounds([-4, -70, -40], [0, 0, 40], "GoldTrim", 1), -14),
    rotateX(boxBounds([-8, 2, -36], [-4, 66, 36], "Palace_Parchment"), 14), rotateX(boxBounds([-8, -66, -36], [-4, -2, 36], "Palace_Parchment"), -14),
    ...[-20, 0, 20].map((z) => rotateX(boxBounds([-9, 10, z - 1], [-8, 58, z + 1], "Palace_Dark"), 14)),
    ...[-20, 0, 20].map((z) => rotateX(boxBounds([-9, -58, z - 1], [-8, -10, z + 1], "Palace_Dark"), -14)),
    boxBounds([-10, -3, -60], [-8, 3, 0], "Palace_BookRed"),
  ), [BX, 0, 560]));
  B.push(onFace(windowGeo(140, 220, { arch: true }), "-x", -BX, 0, 640));
  for (const s of [-1, 1]) B.push(onFace(wallLantern(), "-x", -BX, s * 170, 300));
  B.push(translate(crest(40), [BX, 0, E + 150]));
  out.push(merge(...B));
  // the dome and the armillary sphere
  {
    const Z0 = E + 240, R = 290, d: Geo[] = [];
    d.push(wuv(ring(R, 360, Z0, "StoneWhite", 16), 1.3), ring(R + 18, 24, Z0 + 350, "StoneLight", 16), ring(R + 30, 30, Z0 - 10, "StoneLight", 16));
    for (let i = 0; i < 8; i++) d.push(onRound(windowGeo(56, 150, { arch: true, frame: "StoneLight" }), R * Math.cos(Math.PI / 16), i * 45, Z0 + 110));
    d.push(translate(scale(sphereCenter(R + 4, [0, 0, 0], "RoofCopper", 14), [1, 1, 0.78]), [0, 0, Z0 + 372]));
    const AZ = Z0 + 372 + R * 0.78;
    d.push(ring(30, 40, AZ - 10, "StoneLight", 8), cylinderAt({ rBot: 10, rTop: 6, height: 60, segments: 8, bottom: [0, 0, AZ + 30] }, "GoldTrim"));
    const ac = AZ + 150;
    d.push(sphereCenter(26, [0, 0, ac], "Palace_GlassBlue", 10), translate(torus(64, 3.5, 20, 5, "GoldTrim"), [0, 0, ac]), translate(rotateX(torus(64, 3.5, 20, 5, "GoldTrim"), 90), [0, 0, ac]), translate(rotateY(rotateX(torus(60, 3, 20, 5, "GoldTrim"), 90), 60), [0, 0, ac]), cylinderBetween([0, 0, ac - 80], [0, 0, ac + 80], 2.5, 6, "GoldTrim"));
    out.push(translate(merge(...d), [60, 0, 0]));
  }
  return merge(...out);
}

// ---- the treasury (คลังหลวง) ----
// A squat, heavy block of rusticated stone with round corner turrets under blue cones, a
// crenellated parapet, small barred windows, an iron-bound double door with the arms over it.
function treasury(): Geo {
  const HX = 500, HY = 600, H = 820, TR = 150, out: Geo[] = [];
  out.push(wuv(merge(boxBounds([-HX - 14, -HY - 14, 0], [HX + 14, HY + 14, 90], "StoneGrey"), boxBounds([-HX, -HY, 90], [HX, HY, H], "StoneLight")), 1.6));
  for (let z = 160, i = 0; z < H - 60; z += 74, i++) {
    out.push(boxBounds([-HX - 3, -HY - 3, z], [HX + 3, HY + 3, z + 7], "StoneGrey"));
    for (let y = -HY + 60 + (i % 2) * 70; y < HY - 30; y += 140) for (const x of [-HX - 3, HX - 4]) out.push(boxBounds([x, y - 3, z + 7], [x + 7, y + 3, z + 74], "StoneGrey"));
  }
  out.push(boxBounds([-HX - 30, -HY - 30, H - 40], [HX + 30, HY + 30, H + 50], "StoneWhite", 2));
  for (const x of [-HX - 30, HX + 30]) for (let y = -HY + 30; y < HY; y += 60) out.push(boxBounds([x - 10, y - 12, H - 100], [x + 10, y + 12, H - 40], "StoneLight", 1.5));
  for (const [a, b] of [[[-HX - 18, -HY - 18], [HX + 18, -HY - 18]], [[HX + 18, -HY - 18], [HX + 18, HY + 18]], [[HX + 18, HY + 18], [-HX - 18, HY + 18]], [[-HX - 18, HY + 18], [-HX - 18, -HY - 18]]] as [[number, number], [number, number]][]) out.push(merlons(a, b, H + 50, 26, "StoneWhite", 90, 66));
  out.push(hipRoof(HX - 70, HY - 70, H + 50, 300, 0, 0, 20));
  for (const sx of [-1, 1])
    for (const sy of [-1, 1])
      out.push(translate(merge(
        ring(TR + 20, 90, 0, "StoneGrey", 12, TR + 6), wuv(ring(TR, H + 150, 90, "StoneLight", 12), 1.6), ring(TR + 22, 30, H + 220, "StoneWhite", 12),
        ring(TR + 40, 520, H + 250, "RoofBlue", 12, 3), sphereCenter(10, [0, 0, H + 778], "GoldTrim", 8),
        onRound(slitGeo(80), TR * Math.cos(Math.PI / 12), sx < 0 ? 180 : 0, 380),
      ), [sx * HX, sy * HY, 0]));
  // the front: the iron door, the arms over it, barred windows, lanterns, a step
  out.push(onFace(merge(doorGeo(200, 290, { arch: true, double: true, frame: "StoneWhite", leaf: "IronDark" }), ...[60, 130, 200].flatMap((z) => [-70, -35, 35, 70].map((y) => sphereCenter(4, [-15, y, z], "GoldTrim", 5)))), "-x", HX, 0, 0));
  out.push(onFace(arms(70), "-x", HX, 0, 440));
  for (const y of [-330, 330]) out.push(onFace(windowGeo(60, 110, { bars: true, frame: "StoneWhite" }), "-x", HX, y, 300), onFace(wallLantern(), "-x", HX, y * 0.62, 330));
  for (const f of ["+x", "-y", "+y"] as const) for (const u of [-250, 250]) out.push(onFace(windowGeo(60, 110, { bars: true, frame: "StoneWhite" }), f, f.endsWith("x") ? HX : HY, u, 330));
  return merge(...out);
}

// ===================================================================== the outer ward
// ---- the barracks (โรงทหาร) ----
// A long two-storey block, 24 m along Y: a stone ground storey with two arched doors, plaster
// above, painted shields between the upper windows, a royal banner over the middle, a blue roof
// with dormers and chimneys, racks of spears and a bench before it.
function shieldOn(r: number, field: string): Geo {
  return merge(
    rotateY(cylinderAt({ radius: r, height: 5, segments: 14, bottom: [0, 0, 0] }, field), -90),
    rotateY(translate(torus(r, 2.6, 16, 4, "GoldTrim"), [0, 0, 5]), -90),
    sphereCenter(r * 0.22, [-6, 0, 0], "GoldTrim", 8),
    boxBounds([-6, -2, -r * 0.8], [-5, 2, r * 0.8], "GoldTrim"),
  );
}
function spearRack(): Geo {
  const out: Geo[] = [boxAt([12, 12, 180], [0, -80, 0], "WoodShade"), boxAt([12, 12, 180], [0, 80, 0], "WoodShade"), beamBetween([0, -86, 160], [0, 86, 160], 10, 10, "WoodDark"), beamBetween([0, -86, 40], [0, 86, 40], 10, 10, "WoodDark")];
  for (let i = 0; i < 5; i++) {
    const y = -60 + i * 30;
    out.push(cylinderBetween([6, y, 0], [-6, y, 240], 2.5, 5, "WoodWarm"), cylinderAt({ rBot: 5, rTop: 0.5, height: 26, segments: 4, bottom: [-6, y, 238] }, "IronLight"));
  }
  out.push(translate(shieldOn(32, "Palace_Blue"), [-12, 0, 90]));
  return out.flat();
}
function barracks(): Geo {
  const HX = 470, HY = 1200, G = 360, E = 700, RH = 380, out: Geo[] = [];
  out.push(wuv(merge(boxBounds([-HX - 10, -HY - 10, 0], [HX + 10, HY + 10, 50], "StoneGrey"), boxBounds([-HX, -HY, 50], [HX, HY, G], "StoneLight")), 1.2));
  out.push(
    boxBounds([-HX + 4, -HY + 4, G], [HX - 4, HY - 4, E], "Palace_Plaster"),
    boxBounds([-HX - 12, -HY - 12, G - 6], [HX + 12, HY + 12, G + 14], "StoneWhite", 3),
    boxBounds([-HX - 14, -HY - 14, E - 24], [HX + 14, HY + 14, E + 2], "StoneWhite", 3),
    quoins(HX - 4, HY - 4, G + 20, E - 24),
    rotateZ(gableRoof([2 * HY, 2 * HX, 24], [0, 0, E], RH, 40, "RoofBlue"), 90),
    ridge([0, -HY - 40, E + RH + 30], [0, HY + 40, E + RH + 30]),
    wuv(merge(rotateZ(gableWall(HY - 4, HX - 4, E, RH - 6, "Palace_Plaster"), 90), rotateZ(gableWall(-(HY - 4), HX - 4, E, RH - 6, "Palace_Plaster"), 90))),
  );
  const on = (g: Geo, f: Face, u: number, z: number) => out.push(onFace(g, f, (f.endsWith("x") ? HX : HY) - (z >= G ? 4 : 0), u, z));
  // front: the doors, windows, shields, the banner
  for (const y of [-520, 520]) {
    on(doorGeo(150, 260, { arch: true, double: true }), "-x", y, 0);
    on(wallLantern(), "-x", y + 140, 280);
  }
  for (const y of [-1000, -780, -260, 0, 260, 780, 1000]) on(windowGeo(90, 150, { shutters: true }), "-x", y, 120);
  for (let y = -1040; y <= 1040; y += 260) on(windowGeo(86, 160, { shutters: true }), "-x", y, G + 80);
  for (let y = -910; y <= 910; y += 260) if (Math.abs(y) > 200) on(shieldOn(36, Math.abs(y) % 520 < 260 ? "Palace_Blue" : "FabricRed"), "-x", y, G + 160);
  out.push(translate(longBanner(140, 300), [-HX - 20, 0, E - 10]));
  // the back and the ends
  for (let y = -1040; y <= 1040; y += 260) {
    on(windowGeo(86, 150, { shutters: true }), "+x", y, 120);
    on(windowGeo(86, 160, { shutters: true }), "+x", y, G + 80);
  }
  for (const f of ["-y", "+y"] as const) for (const u of [-200, 200]) {
    on(windowGeo(86, 150), f, u, 120);
    on(windowGeo(86, 160, { shutters: true }), f, u, G + 80);
  }
  // dormers on both slopes, chimneys
  for (const s of [-1, 1])
    for (const y of [-700, 0, 700]) {
      const dm = merge(boxBounds([0, -90, 0], [150, 90, 140], "Palace_Plaster"), gableRoof([170, 200, 8], [70, 0, 140], 60, 10, "RoofBlue"), gableWall(0, 90, 140, 56, "Palace_Plaster"), onFace(windowGeo(70, 80, { frame: "Palace_PaintWhite" }), "-x", 0, 0, 30));
      out.push(translate(s < 0 ? dm : rotateZ(dm, 180), [s * (HX - 20), y, E + 30]));
    }
  for (const y of [-900, 900]) out.push(wuv(boxBounds([60, y - 46, E + 100], [150, y + 46, E + RH + 140], "StoneLight"), 1.1), boxBounds([52, y - 54, E + RH + 140], [158, y + 54, E + RH + 156], "StoneGrey", 2));
  // racks of spears and a bench before it
  for (const y of [-220, 220]) out.push(translate(spearRack(), [-HX - 70, y, 0]));
  out.push(translate(merge(boxBounds([-24, -100, 0], [24, 100, 44], "WoodWarm", 2), boxBounds([-28, -104, 44], [28, 104, 50], "WoodShade", 2)), [-HX - 50, -820, 0]));
  return merge(...out);
}

// ---- a horse (ม้า): stylised, standing, head to -X, coat and mane colours given ----
function horseBody(coat: string, mane: string, o: { cloth?: boolean } = {}): Geo {
  const out: Geo[] = [
    translate(scale(sphereCenter(50, [0, 0, 0], coat, 12), [1.7, 0.84, 0.86]), [0, 0, 112]),
    translate(scale(sphereCenter(40, [0, 0, 0], coat, 10), [1, 0.94, 1.04]), [-64, 0, 118]),
    translate(scale(sphereCenter(42, [0, 0, 0], coat, 10), [1.02, 0.98, 1]), [60, 0, 118]),
    cylinderBetween([-74, 0, 132], [-112, 0, 202], 24, 10, coat, 17),
  ];
  out.push(horseHead(coat, mane, [-112, 0, 202]));
  // the mane along the neck, the forelock, the tail
  for (let i = 0; i < 6; i++) {
    const t = i / 5, x = -70 - 42 * t, z = 150 + 74 * t;
    out.push(translate(rotateY(box([16, 10, 26], [0, 0, 0], mane, 2), -55), [x + 6, 0, z + 14]));
  }
  out.push(cylinderBetween([88, 0, 140], [112, 0, 100], 9, 6, mane, 11), cylinderBetween([112, 0, 100], [116, 0, 48], 11, 6, mane, 6));
  // the legs: thighs, cannons, hooves
  for (const [x, y, back] of [[-60, -22, 0], [-60, 22, 0], [58, -22, 1], [58, 22, 1]] as const) {
    out.push(cylinderBetween([x, y, 112], [x + (back ? 6 : -2), y, 58], back ? 15 : 12, 8, coat, 9));
    out.push(cylinderBetween([x + (back ? 6 : -2), y, 58], [x, y, 12], 8, 7, coat, 7.5));
    out.push(cylinderAt({ rBot: 10, rTop: 8.5, height: 12, segments: 8, bottom: [x, y, 0] }, "Palace_Hoof"));
  }
  if (o.cloth !== false) {
    // the royal caparison over its back, gold-edged, a saddle on it
    out.push(hullGeo([[-44, -44, 156], [-44, 44, 156], [50, -44, 156], [50, 44, 156], [-44, -52, 92], [-44, 52, 92], [52, -52, 92], [52, 52, 92], [-20, 0, 168], [30, 0, 168]], "Palace_RoyalBlue"));
    for (const s of [-1, 1]) out.push(boxBounds([-46, s * 52 - 2, 88], [54, s * 52 + 2, 98], "GoldTrim"), translate(rotateZ(panel(crownShape(14), -1, 1, "GoldTrim"), s < 0 ? 90 : -90), [4, s * 54, 128]));
    out.push(hullGeo([[-20, -26, 166], [-20, 26, 166], [26, -26, 166], [26, 26, 166], [-30, 0, 186], [34, 0, 182], [-14, -20, 176], [-14, 20, 176]], "Palace_Leather"));
  }
  return merge(...out);
}
// A horse's head from the top of its neck at `at`, looking to -X: skull, muzzle, ears, eyes,
// the bridle.
function horseHead(coat: string, mane: string, at: V3): Geo {
  const [x, y, z] = at;
  return merge(
    hullGeo([[x + 8, y - 13, z + 22], [x + 8, y + 13, z + 22], [x + 8, y - 12, z - 6], [x + 8, y + 12, z - 6], [x - 26, y - 13, z + 18], [x - 26, y + 13, z + 18], [x - 60, y - 9, z - 6], [x - 60, y + 9, z - 6], [x - 60, y - 8, z - 30], [x - 60, y + 8, z - 30], [x - 18, y - 11, z - 26], [x - 18, y + 11, z - 26]], coat),
    ...[-1, 1].map((s) => cylinderAt({ rBot: 5, rTop: 1, height: 20, segments: 4, bottom: [x + 2, y + s * 8, z + 20] }, coat)),
    ...[-1, 1].map((s) => sphereCenter(3.2, [x - 22, y + s * 12, z + 10], "Palace_Dark", 6)),
    boxBounds([x - 18, y - 4, z + 18], [x + 4, y + 4, z + 30], mane, 2),
    boxBounds([x - 50, y - 10, z - 22], [x - 46, y + 10, z - 4], "Palace_Leather"),
    boxBounds([x - 16, y - 13, z - 20], [x - 12, y + 13, z + 22], "Palace_Leather"),
    sphereCenter(3, [x - 48, y - 11, z - 13], "GoldTrim", 5), sphereCenter(3, [x - 48, y + 11, z - 13], "GoldTrim", 5),
  );
}
function horse(): Geo {
  return merge(horseBody("Palace_Coat", "Palace_Mane"), cylinderAt({ rBot: 3, rTop: 7, height: 26, segments: 6, bottom: [-112, 0, 226] }, "GoldTrim"), sphereCenter(10, [-112, 0, 258], "Palace_RoyalBlue", 8));
}

// ---- the royal stables (คอกม้าหลวง) ----
// A stone stable block 32 m along Y: stall doors in a row each side of a pedimented carriage
// arch with a clock, horses looking out over some of the half doors, hay doors in the gables,
// a cupola with a gilt horse weathervane on the ridge.
function royalStables(): Geo {
  const HX = 460, HY = 1600, G = 400, RH = 360, CY = 340, out: Geo[] = [];
  out.push(wuv(merge(boxBounds([-HX - 10, -HY - 10, 0], [HX + 10, HY + 10, 50], "StoneGrey"), boxBounds([-HX, -HY, 50], [HX, HY, G], "StoneLight")), 1.2));
  out.push(
    boxBounds([-HX - 14, -HY - 14, G - 24], [HX + 14, HY + 14, G + 2], "StoneWhite", 3),
    quoins(HX, HY, 60, G - 30),
    rotateZ(gableRoof([2 * HY, 2 * HX, 24], [0, 0, G], RH, 40, "RoofBlue"), 90),
    ridge([0, -HY - 40, G + RH + 30], [0, HY + 40, G + RH + 30]),
    wuv(merge(rotateZ(gableWall(HY, HX, G, RH - 6, "Palace_Plaster"), 90), rotateZ(gableWall(-HY, HX, G, RH - 6, "Palace_Plaster"), 90))),
  );
  // the stalls: half doors, the top halves open, horses looking out of some
  const stall = (y: number, who: number): Geo => {
    const g: Geo[] = [
      panel(rectShape(78, 236, -6), -8, 10, "StoneWhite"),
      panel(rectShape(66, 230), -9, 2, "Palace_Dark"),
      panel(rectShape(66, 128), -14, 5, "Palace_Blue", { vertical: true }),
      boxBounds([-16, -66, 124], [-8, 66, 132], "WoodDark"),
      boxBounds([-15, -60, 20], [-14, 60, 26], "Palace_PaintWhite"), boxBounds([-15, -60, 104], [-14, 60, 110], "Palace_PaintWhite"),
      beamBetween([-15, -60, 26], [-15, 60, 104], 4, 2, "Palace_PaintWhite"),
      boxBounds([-12, -76, 236], [2, 76, 252], "StoneWhite", 2),
      translate(rotateY(torus(10, 2, 10, 4, "IronDark"), 90), [-10, 0, 186]),
    ];
    if (who === 1) g.push(horseHead("Palace_Coat", "Palace_Mane", [12, 0, 156]));
    if (who === 2) g.push(horseHead("Palace_CoatBay", "Palace_ManeDark", [12, 0, 156]));
    return onFace(merge(...g), "-x", HX, y, 50);
  };
  [520, 800, 1080, 1360].forEach((y, i) => out.push(stall(-y, [1, 0, 2, 0][i]), stall(y, [0, 2, 0, 1][i])));
  for (const u of [-1220, -940, -660, 660, 940, 1220]) out.push(onFace(windowGeo(70, 80), "+x", HX, u, 220));
  // the carriage block in the middle: a pediment with a clock, the arch, a cupola on the ridge
  const CX0 = -HX - 90, CB: Geo[] = [];
  CB.push(wuv(merge(boxBounds([CX0, -CY, 0], [-HX + 10, CY, 760], "StoneWhite"), gableWall(CX0, CY + 20, 760, 240, "StoneWhite")), 1.3));
  CB.push(gableRoof([130, 2 * CY + 40, 16], [CX0 + 60, 0, 760], 250, 22, "RoofBlue"));
  CB.push(boxBounds([CX0 - 14, -CY - 14, 730], [-HX + 10, CY + 14, 764], "StoneLight", 2));
  CB.push(panel(archShape(170, 270), CX0 - 2, 4, "Palace_Dark"), arcStones([CX0 - 4, 0, 270], 170, 11, 40, 14, "StoneLight"));
  CB.push(translate(merge(panel(circleShape(64), -4, 6, "StoneLight", { seg: 10 }), panel(circleShape(55), -6, 2, "Palace_ClockFace", { seg: 10 }), boxBounds([-8, -3, -4], [-7, 3, 44], "Palace_Dark"), rotateX(boxBounds([-8, -3, -4], [-7, 3, 30], "Palace_Dark"), 120)), [CX0, 0, 820]));
  CB.push(translate(rotateZ(crest(30), 0), [CX0, 0, 600]));
  for (const s of [-1, 1]) CB.push(onFace(wallLantern(), "-x", -CX0, s * 250, 300));
  out.push(merge(...CB));
  const cup = merge(
    boxAt([150, 150, 120], [0, 0, 0], "Palace_PaintWhite", 3),
    ...[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sy]) => boxAt([20, 20, 110], [sx * 62, sy * 62, 120], "Palace_PaintWhite")),
    boxAt([140, 140, 60], [0, 0, 120], "Palace_Dark"),
    rotateZ(cylinderAt({ rBot: 120, rTop: 4, height: 120, segments: 4, bottom: [0, 0, 230] }, "RoofBlue"), 45),
    cylinderBetween([0, 0, 340], [0, 0, 440], 2.5, 5, "IronDark"),
    translate(scale(horseBody("GoldTrim", "GoldTrim", { cloth: false }), [0.22, 0.22, 0.22]), [0, 0, 420]),
  );
  out.push(translate(cup, [0, 0, G + RH - 70]));
  // hay doors and hoists in the gable ends
  for (const s of [-1, 1]) {
    const f: Face = s < 0 ? "-y" : "+y";
    out.push(onFace(merge(panel(rectShape(70, 150), -6, 6, "Palace_Blue", { vertical: true }), boxBounds([-10, -80, -8], [2, 80, 0], "StoneWhite"), boxBounds([-90, -6, 190], [2, 6, 204], "WoodDark"), cylinderBetween([-80, 0, 190], [-80, 0, 90], 1, 4, "RopeTan")), f, HY, 0, G + 30));
    out.push(onFace(doorGeo(150, 250, { arch: true, double: true, leaf: "Palace_Blue" }), f, HY, 0, 0));
  }
  return merge(...out);
}

// ---- the royal smithy (โรงตีเหล็กหลวง) ----
// A stone forge house with a great chimney, an open shed before it under a blue lean-to roof on
// stone piers: the hearth glowing under its hood, bellows, an anvil, a quench trough, a
// grindstone, swords on the wall and a suit of armour on its stand.
function royalSmithy(): Geo {
  const HX = 440, HY = 600, out: Geo[] = [];
  // the house (x 0..HX)
  out.push(wuv(merge(boxBounds([-10, -HY - 10, 0], [HX + 10, HY + 10, 50], "StoneGrey"), boxBounds([0, -HY, 50], [HX, HY, 620], "StoneLight")), 1.1));
  out.push(boxBounds([-12, -HY - 12, 596], [HX + 12, HY + 12, 622], "StoneWhite", 3), rotateZ(gableRoof([2 * HY, HX, 22], [HX / 2, 0, 620], 260, 36, "RoofBlue"), 90));
  out.push(ridge([HX / 2, -HY - 36, 900], [HX / 2, HY + 36, 900]), wuv(merge(rotateZ(gableWall(HY, HX / 2, 620, 254, "StoneLight"), 90), rotateZ(gableWall(-HY, HX / 2, 620, 254, "StoneLight"), 90))));
  for (const u of [-300, 300]) out.push(onFace(windowGeo(80, 120, { shutters: true }), "+x", HX, u, 160));
  out.push(onFace(doorGeo(110, 230), "+y", HY, HX / 2, 0));
  // the chimney
  out.push(wuv(merge(boxBounds([60, -HY + 40, 0], [260, -HY + 220, 1150], "StoneLight")), 1.1), boxBounds([50, -HY + 30, 1150], [270, -HY + 230, 1176], "StoneGrey", 2), boxBounds([100, -HY + 80, 1176], [220, -HY + 180, 1210], "Palace_Coal"));
  // the shed: piers, beam, lean-to roof
  for (const y of [-HY + 20, 0, HY - 20]) out.push(wuv(boxAt([60, 60, 400], [-HX + 30, y, 0], "StoneWhite", 2), 1.2), boxAt([74, 74, 20], [-HX + 30, y, 0], "StoneGrey", 2));
  out.push(beamBetween([-HX + 30, -HY - 10, 410], [-HX + 30, HY + 10, 410], 30, 30, "WoodDark"));
  {
    const len = Math.hypot(HX + 60, 180), ang = Math.atan2(180, HX + 60) / D;
    out.push(translate(rotateY(box([len, 2 * HY + 60, 18], [0, 0, 0], "RoofBlue"), -ang), [-(HX + 60) / 2 + 10, 0, 520]));
  }
  out.push(boxBounds([-HX, -HY, 0], [0, HY, 3], "Cobble"));
  // the hearth and its hood against the house wall
  out.push(
    wuv(boxBounds([-180, -HY + 40, 0], [0, -HY + 240, 90], "StoneLight", 2), 1),
    boxBounds([-170, -HY + 50, 90], [-10, -HY + 230, 96], "Palace_Coal"),
    ...[[-120, -HY + 110], [-70, -HY + 160], [-110, -HY + 180], [-60, -HY + 100]].map(([x, y]) => sphereCenter(14, [x, y, 96], "Palace_Ember", 6)),
    hullGeo([[-190, -HY + 30, 220], [-190, -HY + 250, 220], [0, -HY + 30, 220], [0, -HY + 250, 220], [-60, -HY + 90, 430], [-60, -HY + 190, 430], [0, -HY + 90, 430], [0, -HY + 190, 430]], "StoneWhite"),
  );
  // bellows
  out.push(translate(rotateZ(merge(hullGeo([[0, -40, 60], [0, 40, 60], [0, -40, 90], [0, 40, 90], [-110, -10, 70], [-110, 10, 70], [-110, -10, 80], [-110, 10, 80]], "Palace_Leather"), boxBounds([-130, -6, 72], [-100, 6, 78], "IronDark"), boxAt([10, 60, 60], [0, 0, 0], "WoodShade")), -20), [-60, -HY + 330, 0]));
  // the anvil on its block, a hammer on it
  out.push(translate(merge(
    cylinderAt({ radius: 34, height: 54, segments: 10, bottom: [0, 0, 0] }, "WoodShade"),
    boxBounds([-18, -36, 54], [18, 36, 66], "IronDark", 1), boxBounds([-12, -24, 66], [12, 24, 82], "IronDark", 1), boxBounds([-22, -40, 82], [22, 34, 98], "IronDark", 2),
    translate(rotateX(cylinderAt({ rBot: 14, rTop: 1, height: 34, segments: 6, bottom: [0, 0, 0] }, "IronDark"), -90), [0, 34, 90]),
    boxBounds([-6, -12, 98], [6, 12, 108], "IronLight", 1), cylinderBetween([0, 10, 104], [-40, 50, 104], 2.5, 5, "WoodWarm"),
  ), [-230, 40, 0]));
  // the quench trough, the grindstone, the armour stand, swords on the wall, a royal sign
  out.push(translate(merge(boxBounds([-40, -90, 0], [40, 90, 60], "StoneLight", 2), boxBounds([-32, -82, 50], [32, 82, 54], "Palace_Water")), [-330, 380, 0]));
  out.push(translate(merge(beamBetween([0, -40, 0], [0, -30, 90], 8, 8, "WoodShade"), beamBetween([0, 40, 0], [0, 30, 90], 8, 8, "WoodShade"), translate(rotateX(cylinderAt({ radius: 46, height: 18, segments: 14, bottom: [0, 0, -9] }, "StoneGrey"), 90), [0, 0, 96])), [-120, 330, 0]));
  out.push(translate(merge(
    boxAt([40, 40, 8], [0, 0, 0], "WoodShade", 1), cylinderAt({ radius: 4, height: 150, segments: 6, bottom: [0, 0, 8] }, "WoodShade"),
    translate(scale(sphereCenter(30, [0, 0, 0], "IronLight", 10), [0.75, 1, 1.15]), [0, 0, 120]),
    sphereCenter(18, [0, 0, 172], "IronLight", 10), boxBounds([-20, -4, 166], [-16, 4, 176], "Palace_Dark"), cylinderAt({ rBot: 2, rTop: 1, height: 26, segments: 5, bottom: [0, 0, 186] }, "FabricRed"),
    ...[-1, 1].map((s) => sphereCenter(12, [0, s * 30, 142], "IronLight", 8)),
    hullGeo([[-20, -26, 100], [-20, 26, 100], [16, -26, 100], [16, 26, 100], [-24, -30, 60], [-24, 30, 60], [20, -30, 60], [20, 30, 60]], "IronLight"),
  ), [-60, 200, 0]));
  for (let i = 0; i < 5; i++) {
    const y = 120 + i * 50;
    out.push(boxBounds([-10, y - 2, 140], [-6, y + 2, 300], "IronLight"), boxBounds([-12, y - 16, 290], [-4, y + 16, 296], "GoldTrim"), boxBounds([-10, y - 3, 296], [-6, y + 3, 330], "Palace_Leather"));
  }
  out.push(beamBetween([-12, 100, 300], [-12, 360, 300], 6, 6, "WoodDark"));
  {
    const bar = merge(boxBounds([-10, -3, -36], [-9, 3, 36], "GoldTrim"), boxBounds([-10, -16, 24], [-9, 16, 40], "GoldTrim"));
    out.push(translate(merge(
      boxBounds([-6, -80, 300], [0, 80, 390], "WoodDark", 1.5), boxBounds([-8, -74, 306], [-6, 74, 384], "Palace_Blue"),
      translate(rotateX(bar, 40), [0, -14, 345]), translate(rotateX(bar, -40), [0, 14, 345]),
      cylinderBetween([-3, -60, 390], [-3, -60, 410], 1.2, 4, "IronDark"), cylinderBetween([-3, 60, 390], [-3, 60, 410], 1.2, 4, "IronDark"),
    ), [-HX + 14, 300, 0]));
  }
  return merge(...out);
}

// ---- a training dummy (หุ่นฝึกดาบ) ----
function trainingDummy(): Geo {
  return merge(
    boxAt([70, 70, 16], [0, 0, 0], "StoneGrey", 3),
    cylinderAt({ radius: 7, height: 200, segments: 8, bottom: [0, 0, 16] }, "WoodShade"),
    beamBetween([0, -70, 150], [0, 70, 150], 10, 10, "WoodWarm"),
    cylinderAt({ rBot: 26, rTop: 30, height: 74, segments: 10, bottom: [0, 0, 82] }, "Palace_Sack"),
    ...[90, 120, 148].map((z) => translate(torus(28.5, 2, 12, 3, "RopeTan"), [0, 0, z])),
    sphereCenter(20, [0, 0, 178], "Palace_Sack", 8),
    translate(scale(sphereCenter(23, [0, 0, 0], "IronLight", 10), [1, 1, 0.7]), [0, 0, 186]),
    boxBounds([-24, -14, 178], [-18, 14, 184], "Palace_Dark"),
    translate(panel(circleShape(16), -1, 2, "FabricRed"), [-28, 0, 128]), translate(panel(circleShape(9), -2, 2, "Palace_PaintWhite"), [-28, 0, 128]), translate(panel(circleShape(4), -3, 2, "FabricRed"), [-28, 0, 128]),
    translate(rotateZ(shieldOn(30, "Palace_Blue"), 90), [0, -76, 130]),
    ...[[-1, 60], [1, 20]].map(([s, a]) => translate(rotateZ(merge(boxBounds([-3, -3, 0], [3, 3, 100], "WoodPale"), boxBounds([-10, -3, 96], [10, 3, 102], "WoodShade"), boxBounds([-2.5, -2.5, 102], [2.5, 2.5, 124], "Palace_Leather")), a), [s * 34, 50, 0])),
  );
}

// ===================================================================== the court
// ---- the three-tier fountain (น้ำพุสามชั้น) ----
// An octagonal marble basin 8.8 m across on two steps, three bowls one over another spilling
// into each other, jets from the rim arching in, a gilt crown on a globe at the top.
function tieredFountain(): Geo {
  const out: Geo[] = [
    ring(440, 16, 0, "StoneGrey", 8),
    ring(412, 16, 16, "StoneLight", 8),
    wuv(ring(384, 58, 32, "MarbleWhite", 8), 1.2),
    ring(392, 8, 88, "StoneLight", 8),
    ring(360, 2, 82, "Palace_Water", 8),
    ring(84, 14, 84, "StoneLight", 8),
    ring(66, 112, 98, "MarbleWhite", 8),
    translate(torus(70, 5, 16, 5, "GoldTrim"), [0, 0, 150]),
  ];
  // the bowls from the bottom up: where the bowl's foot is, its radius and its lip, the stem it
  // stands on, and where its water falls (the radius and height of the bowl or basin below)
  const bowls = [
    { foot: 210, r: 214, lip: 260, stem: 0, fall: [300, 88] },
    { foot: 330, r: 144, lip: 376, stem: 34, fall: [196, 258] },
    { foot: 440, r: 84, lip: 466, stem: 22, fall: [124, 374] },
  ];
  bowls.forEach((b, i) => {
    if (i) {
      const z0 = bowls[i - 1].lip - 6;
      out.push(ring(b.stem, b.foot - z0, z0, "MarbleWhite", 10, b.stem * 0.75), translate(torus(b.stem * 0.8, 4, 12, 4, "StoneLight"), [0, 0, z0 + 14]));
    }
    out.push(cylinderAt({ rBot: i ? b.stem * 0.75 : 36, rTop: b.r, height: b.lip - b.foot, segments: 16, bottom: [0, 0, b.foot] }, "MarbleWhite"));
    out.push(translate(torus(b.r, 6, 24, 6, "MarbleWhite"), [0, 0, b.lip]), cylinderAt({ radius: b.r - 4, height: 2, segments: 16, bottom: [0, 0, b.lip - 2] }, "Palace_Water"));
    out.push(translate(torus(b.r * 0.97, 2, 24, 3, "GoldTrim"), [0, 0, b.lip - 14]));
    // the water spilling over the lip, the splash ring where it lands
    const [fr, fz] = b.fall;
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + i * 0.26;
      out.push(cylinderBetween([Math.cos(a) * (b.r + 4), Math.sin(a) * (b.r + 4), b.lip - 2], [Math.cos(a) * fr, Math.sin(a) * fr, fz], 4.5, 5, "Palace_Spray", 7));
    }
    out.push(translate(torus(fr, 6, 24, 4, "Palace_Spray"), [0, 0, fz - 2]));
  });
  // the crown on a globe at the top, water springing from it
  out.push(ring(18, 34, 466, "MarbleWhite", 10, 12), sphereCenter(24, [0, 0, 522], "GoldTrim", 10), translate(panel(crownShape(30), -3, 6, "GoldTrim"), [0, 0, 556]), translate(rotateZ(panel(crownShape(30), -3, 6, "GoldTrim"), 90), [0, 0, 556]));
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    out.push(cylinderBetween([Math.cos(a) * 18, Math.sin(a) * 18, 540], [Math.cos(a) * 60, Math.sin(a) * 60, 500], 2.5, 5, "Palace_Spray"), cylinderBetween([Math.cos(a) * 60, Math.sin(a) * 60, 500], [Math.cos(a) * 80, Math.sin(a) * 80, 470], 2.5, 5, "Palace_Spray"));
  }
  // jets from gilt spouts on the basin's rim, arching in
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8, c = Math.cos(a), s = Math.sin(a);
    out.push(cylinderAt({ radius: 9, height: 12, segments: 6, bottom: [c * 372, s * 372, 92] }, "GoldTrim"));
    out.push(cylinderBetween([c * 372, s * 372, 104], [c * 330, s * 330, 168], 3, 5, "Palace_Spray"), cylinderBetween([c * 330, s * 330, 168], [c * 280, s * 280, 150], 3, 5, "Palace_Spray"), cylinderBetween([c * 280, s * 280, 150], [c * 250, s * 250, 86], 3, 5, "Palace_Spray"));
  }
  const rx = 384 * Math.cos(22.5 * D), ry = 384 * Math.sin(22.5 * D);
  for (let k = 0; k < 8; k++) out.push(rotateZ(boxBounds([rx - 30, -ry - 6, 82], [rx + 6, ry + 6, 96], "StoneLight", 2), k * 45));
  return merge(...out);
}

// ---- the statues of the kings (รูปปั้นกษัตริย์) ----
// A king in marble (the material Palace_Statue, so a colourway can cast him in bronze) on a tall
// moulded plinth with a gilt plaque: crowned, bearded, robed and caped; `pose` 0 rests both hands
// on a sword standing point down before him, 1 raises a sceptre and holds an orb.
function kingStatue(pose: number): Geo {
  const Z = 264, M = "Palace_Statue", out: Geo[] = [
    boxAt([200, 200, 30], [0, 0, 0], "StoneGrey", 3),
    boxAt([168, 168, 30], [0, 0, 30], "StoneLight", 3),
    wuv(boxAt([128, 128, 170], [0, 0, 60], "StoneWhite", 2)),
    boxAt([154, 154, 20], [0, 0, 230], "StoneLight", 3),
    boxAt([134, 134, 14], [0, 0, 250], "StoneWhite", 2),
    boxBounds([-66, -40, 120], [-64, 40, 190], "GoldTrim", 1),
    ...[170, 155, 140].map((z) => boxBounds([-67, -30, z], [-66, 30, z + 4], "Palace_Dark")),
    translate(panel(crownShape(14), -1, 1, "GoldTrim"), [-67, 0, 100]),
  ];
  // the figure: robe, belt, chest, shoulders, cape, head, beard, crown
  out.push(
    scale(cylinderAt({ rBot: 58, rTop: 34, height: 150, segments: 12, bottom: [0, 0, Z] }, M), [0.86, 1, 1]),
    cylinderAt({ radius: 36, height: 10, segments: 12, bottom: [0, 0, Z + 118] }, "GoldTrim"),
    scale(cylinderAt({ rBot: 34, rTop: 40, height: 64, segments: 12, bottom: [0, 0, Z + 150] }, M), [0.74, 1, 1]),
    sphereCenter(18, [0, -40, Z + 206], M, 8), sphereCenter(18, [0, 40, Z + 206], M, 8),
    hullGeo([[6, -52, Z + 214], [6, 52, Z + 214], [26, -54, Z + 200], [26, 54, Z + 200], [44, -74, Z + 6], [44, 74, Z + 6], [58, -60, Z + 2], [58, 60, Z + 2], [20, -66, Z + 40], [20, 66, Z + 40]], M),
    translate(torus(30, 7, 14, 6, M), [0, 0, Z + 212]),
    cylinderAt({ radius: 11, height: 16, segments: 8, bottom: [0, 0, Z + 212] }, M),
    sphereCenter(24, [-2, 0, Z + 248], M, 10),
    translate(scale(sphereCenter(16, [0, 0, 0], M, 8), [0.8, 1, 1.3]), [-18, 0, Z + 228]),
    cylinderAt({ rBot: 24, rTop: 26, height: 18, segments: 10, bottom: [0, 0, Z + 262] }, "GoldTrim"),
    ...Array.from({ length: 6 }, (_, i) => rotateZ(cylinderAt({ rBot: 6, rTop: 0.5, height: 18, segments: 4, bottom: [24, 0, Z + 278] }, "GoldTrim"), i * 60 + 30)),
  );
  if (pose === 0) {
    // the sword before him, both hands on its pommel
    out.push(
      boxBounds([-50, -4, Z], [-44, 4, Z + 116], M, 1),
      boxBounds([-52, -26, Z + 114], [-42, 26, Z + 124], "GoldTrim", 1),
      cylinderAt({ radius: 4, height: 22, segments: 6, bottom: [-47, 0, Z + 124] }, "Palace_Leather"),
      sphereCenter(7, [-47, 0, Z + 150], "GoldTrim", 6),
      cylinderBetween([0, -42, Z + 202], [-24, -24, Z + 160], 11, 8, M, 9), cylinderBetween([-24, -24, Z + 160], [-46, -8, Z + 146], 9, 8, M, 8),
      cylinderBetween([0, 42, Z + 202], [-24, 24, Z + 160], 11, 8, M, 9), cylinderBetween([-24, 24, Z + 160], [-46, 8, Z + 146], 9, 8, M, 8),
      sphereCenter(10, [-48, 0, Z + 142], M, 8),
    );
  } else {
    // a sceptre raised in his right hand, an orb in his left
    out.push(
      cylinderBetween([0, -42, Z + 202], [-30, -50, Z + 230], 11, 8, M, 9), cylinderBetween([-30, -50, Z + 230], [-36, -52, Z + 276], 9, 8, M, 8),
      sphereCenter(10, [-36, -52, Z + 280], M, 8),
      cylinderBetween([-36, -52, Z + 220], [-36, -52, Z + 380], 3.5, 6, "GoldTrim"),
      sphereCenter(10, [-36, -52, Z + 386], "GoldTrim", 8), translate(panel(crownShape(10), -2, 4, "GoldTrim"), [-36, -52, Z + 400]),
      cylinderBetween([0, 42, Z + 202], [-14, 52, Z + 160], 11, 8, M, 9), cylinderBetween([-14, 52, Z + 160], [-40, 40, Z + 150], 9, 8, M, 8),
      sphereCenter(17, [-50, 38, Z + 166], "GoldTrim", 10), translate(torus(17, 1.6, 14, 3, M), [-50, 38, Z + 166]),
      boxBounds([-52, 36, Z + 182], [-48, 40, Z + 204], "GoldTrim"), boxBounds([-52, 30, Z + 194], [-48, 46, Z + 198], "GoldTrim"),
    );
  }
  return merge(...out);
}

// ===================================================================== the garden
// ---- topiary beasts (ไม้ดัดรูปสัตว์): clipped box shaped by lobes of leaves on a plinth ----
const TOPIARY = { core: "Palace_Hedge", dark: "LeafCardDark", mid: "LeafCard", light: "LeafCardLight" };
function topiaryLion(): Geo {
  return merge(
    boxAt([280, 130, 18], [0, 0, 0], "StoneGrey", 3),
    wuv(boxAt([260, 112, 30], [0, 0, 18], "StoneWhite", 2)),
    boxAt([250, 102, 3], [0, 0, 48], "Palace_Soil"),
    shrub({
      seed: 61, leaf: 15, ragged: 0.1, core: 0.95, coreDetail: 1, density: 0.85, sun: 0.04, look: TOPIARY,
      lobes: [
        [30, 0, 104, 74, 40, 42], [84, 0, 100, 42, 44, 46], [-34, 0, 112, 42, 44, 52],
        [-70, 0, 160, 44, 46, 44], [-108, 0, 146, 18, 20, 16], [-62, 0, 200, 22, 24, 14],
        [-104, -22, 64, 32, 13, 14], [-104, 22, 64, 32, 13, 14], [70, -30, 66, 34, 14, 16], [70, 30, 66, 34, 14, 16],
        [126, 22, 82, 12, 12, 12], [132, 30, 120, 13, 13, 13],
      ],
    }),
  );
}
function topiarySwan(): Geo {
  return merge(
    ring(90, 20, 0, "StoneGrey", 12),
    wuv(ring(80, 36, 20, "StoneWhite", 12), 1),
    translate(torus(80, 4, 20, 4, "StoneLight"), [0, 0, 56]),
    cylinderAt({ radius: 76, height: 2, segments: 12, bottom: [0, 0, 54] }, "Palace_Soil"),
    shrub({
      seed: 63, leaf: 14, ragged: 0.1, core: 0.95, coreDetail: 1, density: 0.85, sun: 0.04, look: TOPIARY,
      lobes: [
        [16, 0, 106, 70, 42, 40], [74, 0, 126, 26, 26, 22], [-34, 0, 112, 30, 32, 34],
        [12, -34, 130, 52, 12, 24], [12, 34, 130, 52, 12, 24],
        [-44, 0, 158, 15, 15, 20], [-50, 0, 192, 13, 13, 18], [-46, 0, 224, 12, 12, 16], [-58, 0, 250, 20, 12, 12],
      ],
    }),
    translate(rotateY(cylinderAt({ rBot: 6, rTop: 1, height: 20, segments: 5, bottom: [0, 0, 0] }, "GoldTrim"), -100), [-76, 0, 250]),
  );
}

// ---- a rose arbour (ซุ้มกุหลาบ): a white trellis arch 3 m wide (along Y), walked through
// along X, climbing roses over it ----
function roseArbour(): Geo {
  const out: Geo[] = [], cards = new Cards(), rnd = rng(71), HW = 150, R = 150, Z = 230;
  cards.clip = { min: [-120, -HW - 34, 0], max: [120, HW + 34, Z + R + 40] };
  for (const s of [-1, 1]) {
    const y = s * HW;
    for (const x of [-80, 80]) out.push(boxAt([30, 30, 14], [x, y, 0], "StoneLight", 2), boxAt([12, 12, Z], [x, y, 14], "Palace_PaintWhite", 1));
    for (const z of [30, Z - 10]) out.push(beamBetween([-80, y, z], [80, y, z], 6, 6, "Palace_PaintWhite"));
    for (const x of [-40, 0, 40]) out.push(beamBetween([x, y, 30], [x, y, Z - 10], 3, 3, "Palace_PaintWhite"));
    for (const z of [74, 118, 162]) out.push(beamBetween([-80, y, z], [80, y, z], 3, 3, "Palace_PaintWhite"));
  }
  // the hoops over the top: five arcs from side to side
  for (const x of [-80, -40, 0, 40, 80]) {
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI * (i / n), a1 = Math.PI * ((i + 1) / n);
      out.push(beamBetween([x, -Math.cos(a0) * R, Z + Math.sin(a0) * R * 0.6], [x, -Math.cos(a1) * R, Z + Math.sin(a1) * R * 0.6], x % 80 === 0 ? 7 : 4, x % 80 === 0 ? 7 : 4, "Palace_PaintWhite"));
    }
  }
  for (const y of [-100, 0, 100]) out.push(beamBetween([-90, y, Z + Math.sqrt(R * R - y * y) * 0.6], [90, y, Z + Math.sqrt(R * R - y * y) * 0.6], 4, 4, "Palace_PaintWhite"));
  // the roses: stems up the posts, leaves over the sides and the top, the flowers
  for (const [x, s] of [[-80, -1], [80, 1], [-80, 1], [80, -1]] as const) out.push(cylinderBetween([x, s * HW, 0], [x * 0.6, s * HW * 0.9, Z + 40], 3, 5, "BarkWarm"));
  const leafAt = (c: V3, n: THREE.Vector3) => {
    cards.facing(rnd() < 0.35 ? "LeafCardDark" : rnd() < 0.8 ? "LeafCard" : "LeafCardLight", c, n.clone().add(new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.9)), rnd() * 6.28, 22 + rnd() * 8, 22 + rnd() * 8, n.clone().add(SKY).normalize());
    if (rnd() < 0.3) cards.facing("FlowerCards", [c[0] + n.x * 5, c[1] + n.y * 5, c[2] + n.z * 5], n.clone().add(SKY), rnd() * 6.28, 15, 15, SKY, flowerCell(rnd() < 0.6 ? FC.roseRed : rnd() < 0.5 ? FC.rosePink : FC.daisy));
  };
  for (let i = 0; i < 260; i++) {
    const a = rnd() * Math.PI, x = -100 + rnd() * 200, r = R + 6 + rnd() * 10;
    const n = new THREE.Vector3(0, -Math.cos(a), Math.sin(a) * 0.6 + 0.3).normalize();
    leafAt([x, -Math.cos(a) * r, Z + Math.sin(a) * r * 0.6], n);
  }
  for (const s of [-1, 1])
    for (let i = 0; i < 110; i++) {
      const x = -95 + rnd() * 190, z = 20 + Math.pow(rnd(), 0.7) * (Z - 10);
      leafAt([x, s * (HW + 6 + rnd() * 8), z], new THREE.Vector3(0, s, 0.2));
    }
  return merge(...out, cards.geo());
}

// ---- the hedge maze (เขาวงกตพุ่มไม้) ----
// A 9 x 9 maze of clipped hedges 1.5 m high, 19.8 m square, entered from the middle of its -X side
// and left by the middle of its +X side, a clearing of 3 x 3 cells in the middle with a sundial on
// a stepped round base and four benches. The walls are worked out once, the same for the hedges
// and their solids.
const MZ = { N: 9, C: 220, T: 64, H: 150 };
function mazeWalls(): [number, number, number, number][] {
  const { N, C } = MZ, half = (N * C) / 2, rnd = rng(77);
  // wx[i][j]: the wall on the line x = -half + i*C across cell j (i 0..N); wy[j][i]: the line y = -half + j*C across cell i
  const wx = Array.from({ length: N + 1 }, () => Array<boolean>(N).fill(true));
  const wy = Array.from({ length: N + 1 }, () => Array<boolean>(N).fill(true));
  const seen = Array.from({ length: N }, () => Array<boolean>(N).fill(false));
  const stack: [number, number][] = [[4, 4]];
  seen[4][4] = true;
  while (stack.length) {
    const [i, j] = stack[stack.length - 1];
    const next = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]).map(([di, dj]) => [i + di, j + dj, di, dj]).filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && !seen[a][b]);
    if (!next.length) {
      stack.pop();
      continue;
    }
    const [a, b, di, dj] = next[Math.floor(rnd() * next.length)];
    if (di === 1) wx[i + 1][j] = false;
    if (di === -1) wx[i][j] = false;
    if (dj === 1) wy[j + 1][i] = false;
    if (dj === -1) wy[j][i] = false;
    seen[a][b] = true;
    stack.push([a, b]);
  }
  // the clearing in the middle, the way in and the way out
  for (let i = 4; i <= 5; i++) for (let j = 3; j <= 5; j++) wx[i][j] = false;
  for (let j = 4; j <= 5; j++) for (let i = 3; i <= 5; i++) wy[j][i] = false;
  wx[0][4] = false;
  wx[N][4] = false;
  // runs: consecutive wall pieces on one line joined
  const runs: [number, number, number, number][] = [];
  for (let i = 0; i <= N; i++)
    for (let j = 0; j < N; j++) {
      if (!wx[i][j] || (j > 0 && wx[i][j - 1])) continue;
      let k = j;
      while (k + 1 < N && wx[i][k + 1]) k++;
      const x = -half + i * C;
      runs.push([x, -half + j * C, x, -half + (k + 1) * C]);
    }
  for (let j = 0; j <= N; j++)
    for (let i = 0; i < N; i++) {
      if (!wy[j][i] || (i > 0 && wy[j][i - 1])) continue;
      let k = i;
      while (k + 1 < N && wy[j][k + 1]) k++;
      const y = -half + j * C;
      runs.push([-half + i * C, y, -half + (k + 1) * C, y]);
    }
  return runs;
}
const MAZE = mazeWalls();
// A clipped hedge from (x0, y0) to (x1, y1) (along one axis), T thick, H high, its ends rounded
// past the line by half its thickness so the corners close: a leafy core and leaf sprays over it.
function hedgeRun(x0: number, y0: number, x1: number, y1: number, rnd: () => number, cards: Cards): Geo {
  const { T, H } = MZ, h = T / 2, alongX = y0 === y1;
  const a: V3 = [Math.min(x0, x1) - (alongX ? h : h), Math.min(y0, y1) - h, 0], b: V3 = [Math.max(x0, x1) + h, Math.max(y0, y1) + h, H];
  const out: Geo[] = [boxBounds(a, [b[0], b[1], H - 6], "Palace_Hedge", 8), boxBounds([a[0] + 4, a[1] + 4, H - 14], [b[0] - 4, b[1] - 4, H], "Palace_HedgeTop", 8)];
  const L = alongX ? b[0] - a[0] : b[1] - a[1];
  for (let k = 0; k < (L / 100) * 26; k++) {
    const t = rnd(), side = rnd();
    let c: V3, n: THREE.Vector3;
    if (side < 0.34) {
      c = [a[0] + (b[0] - a[0]) * (alongX ? t : rnd()), a[1] + (b[1] - a[1]) * (alongX ? rnd() : t), H + 1];
      n = new THREE.Vector3(0, 0, 1);
    } else {
      const s = side < 0.67 ? -1 : 1, z = 14 + rnd() * (H - 24);
      c = alongX ? [a[0] + (b[0] - a[0]) * t, s < 0 ? a[1] - 1 : b[1] + 1, z] : [s < 0 ? a[0] - 1 : b[0] + 1, a[1] + (b[1] - a[1]) * t, z];
      n = alongX ? new THREE.Vector3(0, s, 0.15) : new THREE.Vector3(s, 0, 0.15);
    }
    const sun = 0.5 * n.z + 0.35 * (c[2] / H) + 0.3 * (rnd() - 0.5);
    cards.facing(sun < 0.3 ? "LeafCardDark" : sun < 0.62 ? "LeafCard" : "LeafCardLight", c, n.clone().add(new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.7)), rnd() * 6.28, 18 + rnd() * 6, 18 + rnd() * 6, n.clone().multiplyScalar(0.7).add(SKY.clone().multiplyScalar(0.6)).normalize());
  }
  return merge(...out);
}
function hedgeMaze(): Geo {
  const cards = new Cards(), rnd = rng(79), out: Geo[] = [];
  for (const [x0, y0, x1, y1] of MAZE) out.push(hedgeRun(x0, y0, x1, y1, rnd, cards));
  // the clearing: a sundial on a stepped round base, four benches
  out.push(ring(120, 12, 0, "StoneLight", 12), ring(96, 12, 12, "StoneWhite", 12), ring(30, 80, 24, "StoneWhite", 8, 22), ring(40, 8, 104, "StoneLight", 8));
  out.push(cylinderAt({ radius: 36, height: 3, segments: 16, bottom: [0, 0, 112] }, "Bronze"), hullGeo([[-24, -2, 114], [-24, 2, 114], [20, -2, 114], [20, 2, 114], [-24, -2, 146], [-24, 2, 146]], "Bronze"));
  for (let k = 0; k < 12; k++) out.push(rotateZ(boxBounds([30, -1.5, 115], [34, 1.5, 116], "Palace_Dark"), k * 30));
  for (let k = 0; k < 4; k++) {
    const bench = merge(boxBounds([-22, -80, 0], [22, 80, 42], "StoneWhite", 2), boxBounds([-26, -84, 42], [26, 84, 50], "StoneLight", 2));
    out.push(rotateZ(translate(bench, [210, 0, 0]), k * 90 + 45));
  }
  return merge(...out, cards.geo());
}

// ---- the pavilion in the pond (ศาลากลางสระ) ----
// An octagonal stone island reaching down into the water, eight white columns under a flared
// blue roof with a lantern and a gilt finial, a balustrade round it open on the -X side where the
// bridge comes in, a round stone table in the middle.
const PV = { R: 380, CR: 300 };
function pondPavilion(): Geo {
  const { R, CR } = PV, out: Geo[] = [
    ring(R + 30, 70, -90, "StoneGrey", 8),
    ring(R, 100, -90, "StoneLight", 8),
    ring(R + 6, 12, 2, "StoneWhite", 8),
    ring(R - 20, 2, 12, "MarbleWhite", 8),
  ];
  for (let k = 0; k < 8; k++) out.push(rotateZ(translate(column(22, 330, "MarbleWhite"), [CR, 0, 12]), k * 45 + 22.5));
  // the balustrade between the outer columns (not on the -X side)
  for (let k = 0; k < 8; k++) {
    const a0 = (k * 45 + 22.5) * D, a1 = ((k + 1) * 45 + 22.5) * D, mid = (a0 + a1) / 2;
    if (Math.abs(Math.cos(mid) + 1) < 0.1) continue;
    const p0: [number, number] = [Math.cos(a0) * CR, Math.sin(a0) * CR], p1: [number, number] = [Math.cos(a1) * CR, Math.sin(a1) * CR];
    const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) - 50;
    const rail = merge(balusters(0, -L / 2, L / 2, 14, 18, 56), boxBounds([-10, -L / 2, 70], [10, L / 2, 80], "StoneWhite", 1.5), boxBounds([-12, -L / 2, 12], [12, L / 2, 18], "StoneLight"));
    out.push(translate(rotateZ(rail, mid / D), [Math.cos(mid) * CR * Math.cos(22.5 * D), Math.sin(mid) * CR * Math.cos(22.5 * D), 0]));
  }
  // the roof: a ring beam, the flared eaves, the bell of the roof, the lantern
  const Z = 342;
  out.push(ring(CR + 30, 30, Z, "StoneWhite", 8), ring(CR + 36, 10, Z + 30, "GoldTrim", 8));
  out.push(ring(CR + 110, 40, Z + 40, "RoofBlue", 8, CR + 40), ring(CR + 40, 120, Z + 80, "RoofBlue", 8, 170), ring(170, 90, Z + 200, "RoofBlue", 8, 50), ring(54, 10, Z + 290, "StoneBlueDark", 8));
  for (let k = 0; k < 8; k++) out.push(rotateZ(beamBetween([CR + 112, 0, Z + 42], [52, 0, Z + 292], 10, 10, "StoneBlueDark"), k * 45));
  out.push(ring(44, 70, Z + 300, "Palace_PaintWhite", 8), ring(52, 50, Z + 370, "RoofBlue", 8, 4), sphereCenter(14, [0, 0, Z + 430], "GoldTrim", 8), cylinderAt({ rBot: 5, rTop: 0.5, height: 60, segments: 4, bottom: [0, 0, Z + 440] }, "GoldTrim"));
  for (let k = 0; k < 4; k++) out.push(onRound(merge(panel(archShape(14, 30), -2, 2, "LanternGlow")), 41, k * 90 + 45, Z + 314));
  for (let k = 0; k < 8; k++) out.push(rotateZ(translate(merge(lantern(), cylinderBetween([0, 0, 40], [0, 0, 86], 1, 4, "IronDark")), [CR + 66, 0, Z - 46]), k * 45));
  // the table and the benches round it
  out.push(ring(40, 60, 12, "StoneWhite", 10, 26), ring(70, 10, 72, "MarbleWhite", 12));
  return merge(...out);
}

// ---- the garden bridge (สะพานสวน): white stone, 6 m along X, walked over at deck level, a
// balustrade both sides, urns on the end posts, a blind arch down each side into the water ----
function gardenBridge(): Geo {
  const L = 300, W = 150, out: Geo[] = [
    boxBounds([-L, -W, -30], [L, W, 10], "StoneLight", 2),
    boxBounds([-L, -W + 34, 10], [L, W - 34, 11], "MarbleWhite"),
  ];
  for (const s of [-1, 1]) {
    const y = s * (W - 16);
    out.push(
      boxBounds([-L + 40, y - 14, 10], [L - 40, y + 14, 22], "StoneLight"),
      translate(rotateZ(balusters(0, -L + 40, L - 40, 22, 20, 56), 90), [0, y, 0]),
      boxBounds([-L + 40, y - 12, 78], [L - 40, y + 12, 90], "StoneWhite", 2),
    );
    for (const e of [-1, 1]) {
      const x = e * (L - 20);
      out.push(boxBounds([x - 22, y - 22, 10], [x + 22, y + 22, 100], "StoneWhite", 2), boxBounds([x - 26, y - 26, 100], [x + 26, y + 26, 108], "StoneLight", 2), translate(urn(0, 81 + e + 2 * s), [x, y, 108]));
    }
    // cutwaters under the deck, down into the water
    for (const x of [-110, 110]) out.push(translate(rotateZ(boxAt([60, 60, 70], [0, 0, -90], "StoneLight", 2), 45), [x, s * W, 0]));
  }
  return merge(...out);
}

// ===================================================================== the outer ward's life
// Moves a Geo so its footprint is centred on the origin.
function centred(g: Geo): Geo {
  const b = new THREE.Box3();
  for (const p of g) {
    p.geo.computeBoundingBox();
    b.union(p.geo.boundingBox!);
  }
  return translate(g, [-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0]);
}
// A spoked wheel standing in the plane y = at[1], radius r, its hub at `at`.
function wheel(r: number, at: V3): Geo {
  const out: Geo[] = [
    rotateX(torus(r, 4.5, 20, 5, "GoldTrim"), 90),
    rotateX(torus(r + 3, 3, 20, 4, "IronDark"), 90),
    cylinderBetween([0, -9, 0], [0, 9, 0], 11, 8, "Palace_Blue"),
    cylinderBetween([0, -12, 0], [0, 12, 0], 5, 6, "GoldTrim"),
  ];
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    out.push(beamBetween([Math.cos(a) * 10, 0, Math.sin(a) * 10], [Math.cos(a) * (r - 3), 0, Math.sin(a) * (r - 3)], 3.5, 2.5, "Palace_Blue"));
  }
  return translate(merge(...out), at);
}
// ---- the royal coach (รถม้าหลวง): a blue and gold coach with the arms on its door, glazed,
// a gilt crown and rail on its roof, lanterns, the coachman's box, two white horses in harness
// with blue plumes. About 9.5 m long, the horses to -X ----
function royalCoach(): Geo {
  const out: Geo[] = [];
  for (const s of [-1, 1]) {
    out.push(translate(horseBody("Palace_Coat", "Palace_Mane"), [-470, s * 56, 0]));
    out.push(cylinderAt({ rBot: 3, rTop: 7, height: 26, segments: 6, bottom: [-582, s * 56, 226] }, "GoldTrim"), sphereCenter(10, [-582, s * 56, 258], "Palace_RoyalBlue", 8));
    // the traces from the collars back to the swingletree
    out.push(cylinderBetween([-530, s * 56, 150], [-60, s * 40, 84], 2, 4, "Palace_Leather"), translate(rotateY(torus(30, 6, 12, 5, "Palace_Leather"), 70), [-548, s * 56, 160]));
  }
  out.push(cylinderBetween([-30, 0, 66], [-560, 0, 120], 5, 6, "WoodDark"), beamBetween([-60, -70, 84], [-60, 70, 84], 8, 8, "WoodDark"));
  // the undercarriage, the axles and the wheels
  out.push(beamBetween([-20, 0, 72], [300, 0, 72], 14, 14, "WoodDark"));
  out.push(cylinderBetween([0, -104, 55], [0, 104, 55], 4, 6, "IronDark"), cylinderBetween([290, -104, 75], [290, 104, 75], 4, 6, "IronDark"));
  for (const s of [-1, 1]) out.push(wheel(55, [0, s * 96, 55]), wheel(75, [290, s * 96, 75]));
  for (const s of [-1, 1]) out.push(beamBetween([60, s * 60, 92], [20, s * 60, 64], 6, 4, "IronDark"), beamBetween([250, s * 60, 92], [290, s * 60, 80], 6, 4, "IronDark"));
  // the body
  out.push(hullGeo([[74, -62, 92], [74, 62, 92], [246, -62, 92], [246, 62, 92], [44, -80, 172], [44, 80, 172], [276, -80, 172], [276, 80, 172]], "Palace_Blue"));
  out.push(boxBounds([48, -80, 172], [272, 80, 292], "Palace_Blue", 4), boxBounds([42, -84, 166], [278, 84, 176], "GoldTrim", 2));
  out.push(boxBounds([36, -88, 292], [284, 88, 304], "Palace_Blue", 4), boxBounds([34, -90, 288], [286, 90, 294], "GoldTrim"));
  for (const s of [-1, 1]) {
    const y = s * 81;
    for (const [x0, x1] of [[70, 128], [192, 250]]) out.push(boxBounds([x0 - 5, y - 1.5, 196], [x1 + 5, y + 1.5, 274], "GoldTrim"), boxBounds([x0, y - 2, 200], [x1, y + 2, 270], "GlassBlue"), boxBounds([x0 + 2, y - 2.5, 236], [x1 - 2, y + 2.5, 270], "FabricWhite"));
    out.push(boxBounds([136, y - 1.5, 96], [184, y + 1.5, 280], "GoldTrim"), boxBounds([140, y - 2, 100], [180, y + 2, 276], "Palace_Blue"));
    out.push(translate(rotateZ(crest(20), s < 0 ? 90 : -90), [160, y + s * 2, 150]));
    for (const x of [48, 272]) out.push(boxBounds([x - 4, y - 4, 172], [x + 4, y + 4, 292], "GoldTrim"));
    out.push(translate(lantern(), [40, s * 92, 236]), beamBetween([46, s * 82, 250], [40, s * 92, 250], 3, 3, "IronDark"));
  }
  for (const x of [46, 274]) out.push(boxBounds([x - 2, -60, 200], [x + 2, 60, 272], "GlassBlue"), boxBounds([x - 3, -64, 196], [x + 3, 64, 200], "GoldTrim"));
  // the roof rail and the crown
  for (const s of [-1, 1]) out.push(boxBounds([44, s * 84 - 2, 316], [276, s * 84 + 2, 320], "GoldTrim"), boxBounds([s < 0 ? 44 : 272, -84, 316], [s < 0 ? 48 : 276, 84, 320], "GoldTrim"));
  for (let x = 44; x <= 276; x += 29) for (const s of [-1, 1]) out.push(cylinderAt({ radius: 1.6, height: 14, segments: 4, bottom: [x, s * 84, 304] }, "GoldTrim"));
  out.push(cylinderAt({ rBot: 26, rTop: 20, height: 14, segments: 10, bottom: [160, 0, 304] }, "GoldTrim"), translate(panel(crownShape(32), -3, 6, "GoldTrim"), [160, 0, 340]), translate(rotateZ(panel(crownShape(32), -3, 6, "GoldTrim"), 90), [160, 0, 340]), sphereCenter(8, [160, 0, 366], "Palace_RoyalBlue", 8));
  // the coachman's box and its footboard, the footman's step behind
  out.push(boxBounds([-44, -64, 168], [24, 64, 196], "Palace_Blue", 3), boxBounds([-40, -60, 196], [20, 60, 206], "Palace_Velvet", 3), boxBounds([-70, -56, 128], [-36, 56, 134], "WoodDark", 1));
  for (const s of [-1, 1]) out.push(beamBetween([-60, s * 52, 130], [-10, s * 50, 72], 5, 5, "IronDark"), beamBetween([0, s * 58, 168], [20, s * 50, 74], 5, 5, "IronDark"));
  out.push(boxBounds([290, -60, 118], [330, 60, 124], "WoodDark", 1), beamBetween([310, -58, 124], [290, -58, 280], 3, 3, "GoldTrim"), beamBetween([310, 58, 124], [290, 58, 280], 3, 3, "GoldTrim"));
  return centred(merge(...out));
}

// ---- the palace lamp (โคมไฟวัง): a fluted iron post on a white stone pedestal, two lanterns
// hung from scrolled arms and a third on top under a gilt crown ----
function palaceLamp(): Geo {
  const out: Geo[] = [
    boxAt([76, 76, 20], [0, 0, 0], "StoneGrey", 3),
    wuv(boxAt([58, 58, 52], [0, 0, 20], "StoneWhite", 2)),
    boxAt([66, 66, 8], [0, 0, 72], "StoneLight", 2),
    cylinderAt({ rBot: 17, rTop: 10, height: 42, segments: 8, bottom: [0, 0, 80] }, "IronDark"),
    cylinderAt({ radius: 7, height: 250, segments: 8, bottom: [0, 0, 122] }, "IronDark"),
    ring(10, 8, 122, "GoldTrim", 8), ring(9.5, 6, 250, "GoldTrim", 8), ring(11, 10, 362, "IronDark", 8),
    translate(lantern(), [0, 0, 372]),
    translate(panel(crownShape(12), -2, 4, "GoldTrim"), [0, 0, 424]), translate(rotateZ(panel(crownShape(12), -2, 4, "GoldTrim"), 90), [0, 0, 424]),
  ];
  for (const s of [-1, 1])
    out.push(
      beamBetween([0, 0, 340], [0, s * 70, 350], 5, 5, "IronDark"),
      translate(rotateY(torus(14, 2, 12, 4, "IronDark"), 90), [0, s * 26, 324]),
      cylinderBetween([0, s * 70, 350], [0, s * 70, 336], 1.2, 4, "IronDark"),
      translate(lantern(), [0, s * 70, 292]),
    );
  return merge(...out);
}

// ---- a stone balustrade (ราวระเบียงหิน), 400 cm along Y (pieces join end to end, their end
// posts meeting as one), 1 m high ----
function balustrade(): Geo {
  const out: Geo[] = [
    boxBounds([-24, -200, 0], [24, 200, 16], "StoneLight", 2),
    balusters(0, -170, 170, 16, 20, 60),
    boxBounds([-26, -200, 76], [26, 200, 90], "StoneWhite", 2),
  ];
  for (const e of [-1, 1]) out.push(boxBounds([-26, e < 0 ? -200 : 178, 0], [26, e < 0 ? -178 : 200, 100], "StoneWhite", 1), boxBounds([-30, e < 0 ? -200 : 174, 100], [30, e < 0 ? -174 : 200, 108], "StoneLight", 1));
  return merge(...out);
}

// ===================================================================== the sample, solids, kit
// A corner of the inner court: the throne hall (scaled down to fit) across the back, the
// fountain before it, statues of the kings down both sides, lamps, balustrades and topiary, the
// royal coach waiting by the gate and a horse.
function sample(put: Put): void {
  put("throne_hall", [1500, 0, 0], 0, 0.55);
  put("tiered_fountain", [-300, 0, 0], 0, 0.75);
  [-1800, -1000, -200, 600].forEach((x, i) => {
    put(i % 2 ? "king_statue_sceptre" : "king_statue", [x, -760, 0], -90, 0.8);
    put(i % 2 ? "king_statue" : "king_statue_sceptre", [x, 760, 0], 90, 0.8);
  });
  for (const y of [-1300, 1300]) for (const x of [-1900, -1100, -300, 500]) put("palace_lamp", [x, y, 0], 0);
  for (const y of [-1700, 1700]) for (let x = -2000; x < 1000; x += 400) put("balustrade", [x + 200, y, 0], 90);
  put("topiary_lion", [-1500, -1450, 0], 0, 0.8);
  put("topiary_swan", [-700, 1450, 0], 0, 0.9);
  put("topiary_lion", [100, 1450, 0], 180, 0.8);
  put("rose_arbour", [-2100, 0, 0], 0);
  put("royal_coach", [-1300, -2100, 0], 90, 0.9);
  put("horse", [400, -2100, 0], 60);
  put("training_dummy", [1100, -2000, 0], 30);
  for (const [x, y, k] of [[-2100, -2100, "Cherry"], [-2100, 2100, "RoundTree"], [900, 2000, "Cherry"], [-900, 2100, "RoundTree"]] as const) put(`flora:${k}`, [x, y, 0], x, 0.8);
}

const solidsOf = {
  gate: (hx: number, hy: number, aw: number): SolidSpec[] => [-1, 1].map((s) => ({ kind: "gate", x: 0, y: (s * (aw + hy)) / 2, w: 2 * hx + 30, d: hy - aw + 10, rot: 0 })),
};
// The shapes people bump into, in each piece's own frame (front to -X).
export const SOLIDS: Record<string, SolidSpec[]> = {
  palace_tower: [{ kind: "tower", x: 0, y: 0, r: 360 }],
  // the gatehouses' piers either side of their passages, the towers and turrets
  great_gatehouse: [...solidsOf.gate(GH.HX, GH.HY, GH.AW), ...[-1, 1].map((s) => ({ kind: "tower", x: -60, y: s * GH.TY, r: GH.TR + 40 }))],
  inner_gate: [...solidsOf.gate(IG.HX, IG.HY, IG.AW), ...[-1, 1].map((s) => ({ kind: "tower", x: 0, y: s * (IG.HY + IG.TW), w: 2 * IG.TW + 30, d: 2 * IG.TW + 30, rot: 0 }))],
  postern_gate: [...solidsOf.gate(PG.HX, PG.HY, PG.AW), ...[-1, 1].flatMap((sx) => [-1, 1].map((sy) => ({ kind: "tower", x: sx * (PG.HX + 10), y: sy * (PG.HY + 10), r: 60 })))],
  // the throne hall: its side walls, the king's rooms behind the back wall, the corner towers,
  // the columns of the front, the dais and the braziers
  throne_hall: [
    ...[-1, 1].map((s) => ({ kind: "wall", x: (TH.X0 + TH.X1) / 2, y: s * (TH.HY - 30), w: TH.X1 - TH.X0, d: 60, rot: 0 })),
    { kind: "wall", x: (TH.BACK + TH.X1) / 2, y: 0, w: TH.X1 - TH.BACK, d: 2 * (TH.HY - 60), rot: 0 },
    ...[-1, 1].map((s) => ({ kind: "tower", x: TH.X0 + 150, y: s * (TH.HY + 150), w: 330, d: 330, rot: 0 })),
    ...COLS.map((y) => ({ kind: "post", x: TH.CX, y, r: TH.CR + 6 })),
    { kind: "dais", x: (TH.DAIS + TH.BACK) / 2, y: 0, w: TH.BACK - TH.DAIS, d: 2 * TH.DY, rot: 0 },
    ...[-1, 1].map((s) => ({ kind: "post", x: -150, y: s * 660, r: 40 })),
  ],
  tiered_fountain: [{ kind: "fountain", x: 0, y: 0, r: 450 }],
  hedge_maze: MAZE.map(([x0, y0, x1, y1]) => ({ kind: "hedge", x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: Math.abs(x1 - x0) + MZ.T, d: Math.abs(y1 - y0) + MZ.T, rot: 0 })),
  // the pavilion's columns and its balustrade (open to -X, where the bridge comes in)
  pond_pavilion: [
    ...Array.from({ length: 8 }, (_, k) => ({ kind: "post", x: Math.cos((k * 45 + 22.5) * D) * PV.CR, y: Math.sin((k * 45 + 22.5) * D) * PV.CR, r: 30 })),
    ...Array.from({ length: 8 }, (_, k) => (k * 45 + 45) * D).filter((a) => Math.abs(Math.cos(a) + 1) > 0.1).map((a) => ({ kind: "rail", x: Math.cos(a) * PV.CR * 0.92, y: Math.sin(a) * PV.CR * 0.92, w: 30, d: 2 * PV.CR * Math.sin(22.5 * D), rot: a / D })),
  ],
  garden_bridge: [-1, 1].map((s) => ({ kind: "rail", x: 0, y: s * 134, w: 600, d: 40, rot: 0 })),
  rose_arbour: [-1, 1].flatMap((sx) => [-1, 1].map((sy) => ({ kind: "post", x: sx * 80, y: sy * 150, r: 16 }))),
  // the smithy: the forge house and its chimney, the hearth, the shed's piers, the anvil, the
  // trough, the grindstone and the armour stand; the shed itself is open to walk into
  royal_smithy: [
    { kind: "building", x: 220, y: 0, w: 460, d: 1220, rot: 0 },
    { kind: "forge", x: -95, y: -460, w: 210, d: 220, rot: 0 },
    ...[-580, 0, 580].map((y) => ({ kind: "post", x: -410, y, r: 40 })),
    { kind: "post", x: -230, y: 40, r: 42 },
    { kind: "box", x: -330, y: 380, w: 90, d: 190, rot: 0 },
    { kind: "post", x: -120, y: 330, r: 50 },
    { kind: "post", x: -60, y: 200, r: 30 },
  ],
};
// Where the gates' walls leave off (the width the curtain wall leaves open for each gate).
export const GATE_GAP = { great_gatehouse: 1800, inner_gate: 1500, postern_gate: 780 };
// The top of the throne's dais in the hall's frame (the king stands on it at `king`), its height.
export const DAIS = { x0: TH.DAIS + 60, x1: TH.BACK, hy: TH.DY - 60, h: 120, king: [30, 0] as [number, number] };

export const KIT: Kit = {
  id: "palace",
  name: "พระราชวังหลวง",
  region: "เหนือเมืองอีเดน บนเนินที่หิมะเริ่มตก",
  desc: "พระราชวังของกษัตริย์ หินขาว ฉาบปูน หลังคาสีฟ้า กำแพงและหอคอยพร้อมธงยาว ท้องพระโรงแนวเสา น้ำพุสามชั้น รูปปั้นกษัตริย์ และอุทยานหลวง",
  ground: "grass",
  items: [
    { id: "palace_wall", name: "กำแพงวัง (8 ม.)", make: palaceWall, tags: ["wall", "defence"] },
    { id: "palace_tower", name: "หอคอยวังพร้อมธงยาว", make: palaceTower, tags: ["tower", "defence"] },
    { id: "great_gatehouse", name: "ป้อมประตูใหญ่", make: greatGatehouse, tags: ["gate", "defence", "landmark"] },
    { id: "inner_gate", name: "ประตูชั้นใน", make: innerGate, tags: ["gate", "landmark"] },
    { id: "postern_gate", name: "ประตูหลังและประตูข้าง", make: posternGate, tags: ["gate", "defence"] },
    { id: "throne_hall", name: "ท้องพระโรง", make: throneHall, tags: ["landmark", "building"] },
    { id: "royal_chapel", name: "โบสถ์หลวง", make: royalChapel, tags: ["building", "landmark"] },
    { id: "royal_library", name: "หอสมุดหลวง", make: royalLibrary, tags: ["building", "landmark"] },
    { id: "treasury", name: "คลังหลวง", make: treasury, tags: ["building"] },
    { id: "barracks", name: "โรงทหาร", make: barracks, tags: ["building"] },
    { id: "royal_stables", name: "คอกม้าหลวง", make: royalStables, tags: ["building"] },
    { id: "royal_smithy", name: "โรงตีเหล็กหลวง", make: royalSmithy, tags: ["building", "market"] },
    { id: "tiered_fountain", name: "น้ำพุสามชั้น", make: tieredFountain, tags: ["landmark", "decor"] },
    { id: "king_statue", name: "รูปปั้นกษัตริย์ (ถือดาบ)", make: () => kingStatue(0), tags: ["statue", "decor"] },
    { id: "king_statue_sceptre", name: "รูปปั้นกษัตริย์ (ถือคทา)", make: () => kingStatue(1), tags: ["statue", "decor"] },
    { id: "topiary_lion", name: "ไม้ดัดรูปสิงโต", make: topiaryLion, tags: ["plant", "decor"] },
    { id: "topiary_swan", name: "ไม้ดัดรูปหงส์", make: topiarySwan, tags: ["plant", "decor"] },
    { id: "rose_arbour", name: "ซุ้มกุหลาบ", make: roseArbour, tags: ["plant", "decor"] },
    { id: "hedge_maze", name: "เขาวงกตพุ่มไม้", make: hedgeMaze, tags: ["landmark", "plant"] },
    { id: "pond_pavilion", name: "ศาลากลางสระ", make: pondPavilion, tags: ["landmark", "building"] },
    { id: "garden_bridge", name: "สะพานหินในสวน (6 ม.)", make: gardenBridge, tags: ["bridge"] },
    { id: "training_dummy", name: "หุ่นฝึกดาบ", make: trainingDummy, tags: ["decor"] },
    { id: "horse", name: "ม้าหลวง", make: () => centred(horse()), tags: ["decor"] },
    { id: "royal_coach", name: "รถม้าหลวง", make: royalCoach, tags: ["decor", "landmark"] },
    { id: "palace_lamp", name: "โคมไฟวัง", make: palaceLamp, tags: ["light"] },
    { id: "balustrade", name: "ราวระเบียงหิน (4 ม.)", make: balustrade, tags: ["wall", "decor"] },
  ],
  sample,
};
