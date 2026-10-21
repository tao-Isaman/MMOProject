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
import { defineMaterial } from "../textures";
import type { Recipe } from "../textures";
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
const BLOOM = ["Eden_FlowerRed", "Eden_FlowerPink", "Eden_FlowerYellow", "Eden_FlowerWhite", "Eden_FlowerViolet"];
// A row of flower heads over leaves along Y, centred on the origin, sitting on z = 0.
function blooms(len: number, n: number, seed: number, r = 7): Geo {
  const out: Geo[] = [];
  const main = BLOOM[seed % 5], alt = BLOOM[(seed + 3) % 5];
  for (let i = 0; i < n; i++) {
    const y = -len / 2 + (len * (i + 0.5)) / n, dz = ((i * 7 + seed) % 3) * 2;
    out.push(sphereCenter(r * 1.25, [3, y, r * 0.9], "LeafGreen", 5));
    out.push(sphereCenter(r, [-2, y + (i % 2 ? 3 : -3), r * 1.5 + dz], i % 3 === 1 ? alt : main, 5));
  }
  return merge(...out);
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
    out.push(translate(rotateY(cylinderAt({ radius: sw / 2, height: 2.4, segments: 10, bottom: [0, 0, 0] }, m), 90), [-depth - 2.2, y, -drop - 18]));
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
// A small gabled dormer facing -X on a roof: its front at x, window inside.
function dormer(x: number, y: number, z0: number, w: number, depth: number): Geo {
  const hw = w / 2, h = 150;
  return translate(merge(
    boxBounds([0, -hw, 0], [depth, hw, h], "Eden_Plaster"),
    gableRoof([depth + 10, w, 8], [depth / 2 - 5, 0, h], 60, 10, "RoofBlue"),
    gableWall(0, hw, h, 56, "Eden_Plaster"),
    onFace(windowGeo(w - 76, 70, { frame: "Eden_PaintWhite" }), "-x", 0, 0, 44),
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
    boxBounds([-104, -56, 106], [-100, 56, 172], "Bronze", 1),
    ...[150, 136, 122].map((z) => boxBounds([-105, -40, z], [-104, 40, z + 4], "Eden_Dark")),
    translate(rotateY(torus(20, 3.5, 14, 6, "GoldTrim"), 90), [-104, 0, 194]),
    // the figure
    boxBounds([-32, 6, Z], [12, 34, Z + 18], M, 3),
    boxBounds([-8, -34, Z], [26, -8, Z + 18], M, 3),
    cylinderBetween([-12, 20, Z + 14], [-4, 18, Z + 92], 12, 8, M, 14),
    cylinderBetween([10, -21, Z + 14], [2, -17, Z + 92], 12, 8, M, 14),
    cylinderAt({ rBot: 46, rTop: 30, height: 52, segments: 10, bottom: [0, 0, Z + 78] }, M),
    box([46, 66, 72], [0, 0, Z + 160], M, 8),
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
    for (let k = 0; k < 6; k++) g.push(sphereCenter(r, [x + Math.cos(k * 60 * D) * 12, y + Math.sin(k * 60 * D) * 12, z + r * 0.6], fruit, 6));
    g.push(sphereCenter(r, [x, y, z + r * 1.1], fruit, 6));
    return merge(...g);
  };
  const fruits = ["Eden_Apple", "Eden_Orange", "Eden_Lemon", "Eden_Pear"];
  fruits.forEach((f, i) => {
    const y = -96 + i * 64;
    out.push(cylinderAt({ rBot: 20, rTop: 27, height: 16, segments: 10, bottom: [-62, y, 96] }, "BambooDry"));
    out.push(heap(-62, y, 106, f, 7.5));
  });
  for (let i = 0; i < 3; i++) {
    const y = -78 + i * 78, f = fruits[(i + 2) % 4];
    out.push(boxBounds([46, y - 32, 76], [88, y + 32, 98], "WoodWarm", 1.5));
    for (let a = 0; a < 2; a++) for (let c = 0; c < 3; c++) out.push(sphereCenter(9, [57 + a * 20, y - 20 + c * 20, 99], f, 6));
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
  const out: Geo[] = [
    boxAt([70, 190, 6], [0, 0, 0], "StoneGrey", 2),
    wuv(boxAt([62, 180, 44], [0, 0, 6], "StoneWhite", 2)),
    boxAt([72, 192, 8], [0, 0, 50], "StoneLight", 2),
    boxAt([52, 170, 3], [0, 0, 56], "Eden_Soil"),
    translate(blooms(160, 9, 0, 9), [-8, 0, 58]),
    translate(blooms(150, 8, 1, 8), [12, 6, 58]),
  ];
  for (let i = 0; i < 6; i++) out.push(sphereCenter(8, [-37, -75 + i * 30, 46 - (i % 2) * 10], "LeafGreen", 6));
  return merge(...out);
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
  ],
  sample,
};
