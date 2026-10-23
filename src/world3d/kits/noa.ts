// โนอา (Noa): the first capital of the kingdom, older than Eden and built the same way (stone,
// plaster, tiled roofs) but worn by centuries: grey-green stone furred with moss, plaster faded
// and fallen away from the brick, bleached and mossy roofs, ivy on everything. Its own pieces are
// the old things Eden has none of: the ruined palace (an arcade of arches and columns round an
// overgrown court, and the roofless throne hall behind it), the clock tower, the statue of the
// first king, the archive hall, the aqueduct that strides across the town, the old city gate,
// the broken inner wall and its ruined tower, old townhouses, the caravan inn, and the furniture
// of an old market town (the old fountain, stalls, milestones, lamps, rubble, a caravan wagon).
// The town uses Eden's pieces too, in weathered colourways (src/world3d/town_noa.ts).
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front to -X.
// Runs join end to end along Y: the aqueduct's bays (7 m, half a pier at each end) and the
// ruined wall (8 m, 560 high where pieces meet). The pieces people walk through (the palace,
// the aqueduct, the gate, the wall's breach) come with their solids in SOLIDS.

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
import type { SolidSpec } from "../../world";

// ---- materials ----
// Eden's palette aged: the white stone gone grey-green, the plaster and the paint faded, the
// blue roofs washed out (or the terracotta bleached), moss over everything that faces the sky.
const NOA_MATS: Record<string, Recipe> = {
  Noa_Stone: { map: "stone", tint: "#c3c1ab", bump: 2.3 },
  Noa_StoneLight: { map: "stone", tint: "#d9d4c0", bump: 2.1 },
  Noa_StoneDark: { map: "stone", tint: "#929382", bump: 2.3 },
  Noa_Moss: { map: "stone", tint: "#8e9c66", bump: 2.4 },                     // stone furred with moss
  Noa_MossCap: { map: "foliage", tint: "#7f9c4c", rough: 0.95, bump: 1.5 },   // turf on broken tops
  Noa_Grass: { map: "foliage", tint: "#93ad5e", rough: 0.95, bump: 1.2 },     // grass over old paving
  Noa_Plaster: { map: "plaster", tint: "#e5dbc2", bump: 0.9 },
  Noa_PlasterOchre: { map: "plaster", tint: "#dcc391", bump: 0.9 },
  Noa_PlasterRose: { map: "plaster", tint: "#dbbfae", bump: 0.9 },
  Noa_PaintOld: { map: "plaster", tint: "#e6dfcd", bump: 0.4, rough: 0.8 },
  Noa_PaintBlue: { map: "plaster", tint: "#5f7898", bump: 0.5, rough: 0.8 },
  Noa_RoofFaded: { map: "tiles", tint: "#b98d70", bump: 2.6 },                // terracotta bleached by the sun
  Noa_RoofBlue: { map: "tiles", tint: "#7b8ea5", bump: 2.6 },                 // Eden's blue, faded to grey
  Noa_RoofMoss: { map: "tiles", tint: "#8f8d6b", bump: 2.6 },                 // old tiles going green
  Noa_Ridge: { map: "stone", tint: "#7b7d6f", bump: 2 },
  Noa_Shutter: { map: "wood", tint: "#6f8a70", bump: 1.3 },                   // green paint worn to the grain
  Noa_ShutterBlue: { map: "wood", tint: "#6a83a0", bump: 1.3 },
  Noa_Timber: { map: "wood", tint: "#6b5946", bump: 1.3 },                    // old grey-brown beams
  Noa_Verdigris: { map: "metal", tint: "#5f9784", rough: 0.65, metal: 0.25 },
  Noa_VerdigrisDark: { map: "metal", tint: "#41705f", rough: 0.75, metal: 0.2 },
  Noa_Gilt: { map: "metal", tint: "#b89a54", rough: 0.5, metal: 0.55 },       // what gilding is left
  Noa_Water: { tint: "#5d9c98", rough: 0.08, opacity: 0.86 },
  Noa_Spray: { tint: "#e2f4f0", rough: 0.1, opacity: 0.55, glow: "#a6dcd2", glowI: 0.3 },
  Noa_Dark: { tint: "#24262a", rough: 1 },
  Noa_Glass: { tint: "#4e6676", rough: 0.3 },
  Noa_ClockDial: { map: "plaster", tint: "#efe6cf", bump: 0.4, rough: 0.7 },
  Noa_Canvas: { map: "fabric", tint: "#ddd1b3", rough: 0.95 },
  Noa_CanvasRed: { map: "fabric", tint: "#ad6c5d", rough: 0.95 },
  Noa_CanvasBlue: { map: "fabric", tint: "#71889f", rough: 0.95 },
  Noa_CanvasGreen: { map: "fabric", tint: "#7f9269", rough: 0.95 },
  Noa_Parchment: { map: "paper", tint: "#ebdcb7", rough: 0.95 },
  Noa_BookRed: { map: "felt", tint: "#8e3b32", rough: 0.9 },
  Noa_BookBlue: { map: "felt", tint: "#3d5578", rough: 0.9 },
  Noa_BookGreen: { map: "felt", tint: "#4c6a42", rough: 0.9 },
  Noa_Soil: { map: "felt", tint: "#5b4a36", rough: 1 },
  Noa_Clay: { map: "plaster", tint: "#bf7a51", bump: 0.6 },                   // pots and amphorae
  Noa_Bread: { map: "felt", tint: "#c98a46", rough: 0.75 },
  Noa_Cheese: { map: "felt", tint: "#e5c25d", rough: 0.7 },
  Noa_Hay: { map: "thatch", tint: "#d2b469", bump: 1.5 },
  Noa_Ruby: { tint: "#b8384a", rough: 0.25, glow: "#801828", glowI: 0.3 },
  Noa_Apple: { tint: "#c4473a", rough: 0.5 },
  Noa_Pear: { tint: "#a8b84c", rough: 0.55 },
};
for (const [name, recipe] of Object.entries(NOA_MATS)) defineMaterial(name, recipe);

// ---- helpers (Eden's, in Noa's materials) ----
const D = Math.PI / 180;
const SKY = new THREE.Vector3(0, 0, 1);
const FC = FLOWER_CELLS;
const WILD = [FC.daisy, FC.buttercup, FC.tinyYellow, FC.forgetMeNot, FC.cosmosPink];

function rng(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

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
// ... or onto a round tower: `r` out from its axis, facing the compass angle `deg` (0 = +X).
function onRound(g: Geo, r: number, deg: number, z: number): Geo {
  return rotateZ(translate(g, [-r, 0, z]), deg - 180);
}
// A round (or polygonal) drum turned so a flat face looks along +X, -X, +Y and -Y.
function ring(r: number, h: number, z: number, mat: string, seg = 16, rTop = r): Geo {
  return rotateZ(cylinderAt({ rBot: r, rTop, height: h, segments: seg, bottom: [0, 0, z] }, mat), 180 / seg);
}
// Hang pieces on a box building: walls at ±HX / ±HY, the plaster above G set in by P.
function placer(out: Geo[], HX: number, HY: number, G: number, P = 4) {
  return (g: Geo, face: Face, u: number, z: number): void => {
    out.push(onFace(g, face, (face.endsWith("x") ? HX : HY) - (z >= G ? P : 0), u, z));
  };
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
// Straight sides up to `spring`, then a round head.
function archShape(hw: number, spring: number, bottom = 0): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-hw, bottom);
  s.lineTo(hw, bottom);
  s.lineTo(hw, spring);
  s.absarc(0, spring, hw, 0, Math.PI, false);
  s.lineTo(-hw, bottom);
  return s;
}
function circleShape(r: number, cy = 0, cz = 0): THREE.Shape {
  const s = new THREE.Shape();
  s.absarc(cy, cz, r, 0, Math.PI * 2, false);
  return s;
}
// An irregular blob round (cy, cz): a stain of moss, a patch where the plaster has fallen.
function blobShape(cy: number, cz: number, rw: number, rh: number, seed: number, n = 9): THREE.Shape {
  const rnd = rng(seed), s = new THREE.Shape();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, k = 0.68 + rnd() * 0.5;
    const p: [number, number] = [cy + Math.cos(a) * rw * k, cz + Math.sin(a) * rh * k];
    if (i === 0) s.moveTo(...p);
    else s.lineTo(...p);
  }
  s.closePath();
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
// A solid wrapped around some points (capes, sloped stones).
function hullGeo(pts: V3[], mat: string): Geo {
  return wuv([{ geo: new ConvexGeometry(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))), mat }]);
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
// An arch between two supports in the plane x = 0, `d` deep along X: the opening `r` either side
// of y = 0 springing at sp, a ring of voussoirs, and the wall over it (the spandrels in 20 cm
// slices, and over the supports out to ±hw) up to `top`.
function archBay(hw: number, r: number, sp: number, top: number, d: number, o: { wall?: string; ring?: string; n?: number; thick?: number } = {}): Geo {
  const wall = o.wall ?? "Noa_Stone", thick = o.thick ?? 40, R = r + thick * 0.8, slices: Geo[] = [];
  if (hw > r + 1) slices.push(boxBounds([-d / 2, -hw, sp], [d / 2, -r, top], wall), boxBounds([-d / 2, r, sp], [d / 2, hw, top], wall));
  for (let y = -r; y < r - 0.1; y += 20) {
    const y1 = Math.min(r, y + 20), m = Math.max(Math.abs(y), Math.abs(y1));
    const z0 = sp + Math.sqrt(Math.max(0, R * R - m * m));
    if (z0 < top - 2) slices.push(boxBounds([-d / 2, y, z0], [d / 2, y1, top], wall));
  }
  return merge(arcStones([0, 0, sp], r, 0, 180, o.n ?? 11, thick, d + 4, o.ring ?? "Noa_StoneLight", 2), wuv(merge(...slices), 1.2));
}

// ---- growing things ----
const LEAF = ["LeafCardDark", "LeafCard", "LeafCardLight"];
// Ivy on a -X facing wall (the plane x = 0) between y0 and y1: strands climbing from z0 to about
// z0 + h (or, `hang`, falling from z0 by about h), each a wandering chain of leaf cards held just
// off the wall, fullest near the root.
function ivy(y0: number, y1: number, z0: number, h: number, seed: number, o: { hang?: boolean; n?: number; leaf?: number; spread?: number } = {}): Geo {
  const cards = new Cards(), rnd = rng(seed), leaf = o.leaf ?? 22, dir = o.hang ? -1 : 1;
  const n = o.n ?? Math.max(2, Math.round((y1 - y0) / 50));
  const nrm = new THREE.Vector3(-0.75, 0, 0.66).normalize();
  for (let i = 0; i < n; i++) {
    let y = y0 + ((y1 - y0) * (i + 0.2 + rnd() * 0.6)) / n;
    const len = h * (0.5 + rnd() * 0.5);
    for (let t = 0; t < len; t += 11 + rnd() * 8) {
      const k = 1 - (t / len) * 0.55;
      const per = rnd() < k ? 3 : 2;
      for (let j = 0; j < per; j++) {
        const yy = y + (rnd() - 0.5) * (o.spread ?? 34) * k, zz = z0 + dir * t + (rnd() - 0.5) * 14;
        if (yy < y0 - 6 || yy > y1 + 6 || zz < 2) continue;
        const face = new THREE.Vector3(-1, (rnd() - 0.5) * 1.2, (rnd() - 0.3) * 1.1);
        const sz = leaf * (0.75 + rnd() * 0.5), c = rnd();
        cards.facing(c < 0.4 ? LEAF[0] : c < 0.8 ? LEAF[1] : LEAF[2], [-2 - rnd() * 6, yy, zz], face, rnd() * Math.PI * 2, sz, sz, nrm);
      }
      y += (rnd() - 0.5) * 18;
    }
  }
  return cards.geo();
}
// Tufts of grass standing on the given points (now and then a wild flower among them).
function tufts(pts: V3[], seed: number, h = 26, flowers = 0.25): Geo {
  const cards = new Cards(), rnd = rng(seed);
  for (const p of pts) {
    const a0 = rnd() * Math.PI;
    for (let k = 0; k < 2; k++) {
      const a = a0 + (k * Math.PI) / 2;
      cards.add(k ? "TuftCard" : "TuftCardDark", p, new THREE.Vector3(Math.cos(a), Math.sin(a), 0), SKY, h * (1 + rnd() * 0.3), h * (0.8 + rnd() * 0.4), SKY, [0, 0, 1, 1], true);
    }
    if (rnd() < flowers) cards.facing("FlowerCards", [p[0], p[1], p[2] + h * 0.8], new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, 1), rnd() * 6.28, h * 0.55, h * 0.55, SKY, flowerCell(WILD[Math.floor(rnd() * WILD.length)]));
  }
  return cards.geo();
}
// Points scattered over a box at height z (for tufts).
function scatter(x0: number, x1: number, y0: number, y1: number, z: number, n: number, seed: number): V3[] {
  const rnd = rng(seed);
  return Array.from({ length: n }, (): V3 => [x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0), z]);
}
// A flat patch (grass over paving, moss on a step) round (cx, cy) lying at height z.
function flatPatch(cx: number, cy: number, rw: number, rh: number, seed: number, z: number, mat = "Noa_MossCap"): Geo {
  const g = new THREE.ExtrudeGeometry(blobShape(cx, cy, rw, rh, seed), { depth: 1.5, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, z);
  const geo = g.index ? g.toNonIndexed() : g;
  geo.clearGroups();
  return wuv([{ geo, mat }]);
}
// A stain of moss on a -X facing wall, just proud of the plane x = 0.
function mossStain(cy: number, cz: number, rw: number, rh: number, seed: number, mat = "Noa_Moss"): Geo {
  return panel(blobShape(cy, cz, rw, rh, seed), -1.2, 1.2, mat);
}
// A clump of flowers standing on `at` (leaves in two crossed cards, flower heads over them).
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
// A row of flower clumps along Y, centred on the origin, on z = 0, leaning out to -X.
function blooms(len: number, n: number, seed: number, r = 7): Geo {
  const cards = new Cards(), rnd = rng(seed + 11);
  const cols = [FC.roseRed, FC.cosmosPink, FC.buttercup, FC.daisy, FC.pansy, FC.marigold];
  for (let i = 0; i < n; i++) {
    const y = -len / 2 + (len * (i + 0.5)) / n;
    flowerClump(cards, [1, y + (rnd() - 0.5) * 3, 0], r * 3.6, r * 3, [cols[(seed + (i % 3 === 1 ? 3 : 0)) % cols.length]], 2, rnd, [-0.7, 0]);
  }
  return cards.geo();
}
// Fallen stones over a box on the ground: ashlar blocks lying at odd angles, half sunk.
function rubble(x0: number, x1: number, y0: number, y1: number, n: number, seed: number, big = 1, mat = "Noa_Stone"): Geo {
  const rnd = rng(seed), out: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const sx = (36 + rnd() * 40) * big, sy = (26 + rnd() * 30) * big, sz = (20 + rnd() * 22) * big;
    let b = box([sx, sy, sz], [0, 0, sz / 2 - 5], i % 3 ? mat : "Noa_StoneDark", 2.5);
    b = rotateX(rotateY(b, (rnd() - 0.5) * 24), (rnd() - 0.5) * 18);
    out.push(translate(rotateZ(b, rnd() * 180), [x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0), 0]));
  }
  return merge(...out);
}

// ---- small parts ----
interface WinOpt { arch?: boolean; shutters?: string; askew?: boolean; flowers?: number; frame?: string; glass?: string; bars?: boolean }
// A window facing -X: stone surround, glass, glazing bars, sill and lintel with a keystone (or a
// round head); old painted shutters (one hanging from a single hinge if `askew`), iron bars and a
// box of flowers if asked. Bottom of the glass at z = 0.
function windowGeo(w: number, h: number, o: WinOpt = {}): Geo {
  const hw = w / 2, fm = o.frame ?? "Noa_StoneLight", spring = o.arch ? h - hw : h;
  const out: Geo[] = [
    panel(o.arch ? archShape(hw + 12, spring, -6) : rectShape(hw + 12, h + 6, -6), -8, 10, fm),
    panel(o.arch ? archShape(hw, spring) : rectShape(hw, h), -10, 2, o.glass ?? "Noa_Glass"),
    boxBounds([-12, -2, 0], [-10, 2, h - 2], "Noa_PaintOld"),
    boxBounds([-12, -hw, (o.arch ? spring : h * 0.6) - 2], [-10, hw, (o.arch ? spring : h * 0.6) + 2], "Noa_PaintOld"),
    boxBounds([-17, -hw - 16, -16], [2, hw + 16, -5], fm, 2),
  ];
  if (o.arch) out.push(boxBounds([-13, -8, h + 2], [2, 8, h + 22], fm));
  else out.push(boxBounds([-13, -hw - 16, h + 6], [2, hw + 16, h + 20], fm, 2), boxBounds([-15, -9, h + 2], [2, 9, h + 26], fm));
  if (o.shutters)
    for (const sy of [-1, 1]) {
      const a = sy * (hw + 14), b = sy * (hw + 14 + hw * 0.95), lo = Math.min(a, b), hi = Math.max(a, b);
      let leaf = merge(boxBounds([-7, lo, 0], [-2, hi, spring], o.shutters), ...[spring * 0.16, spring * 0.78].map((z) => boxBounds([-9, lo + 3, z], [-7, hi - 3, z + 6], o.shutters!)));
      if (o.askew && sy > 0) leaf = rotateX(leaf, -10, [-4, lo, spring]);
      out.push(leaf);
    }
  if (o.bars) for (let y = -hw + 16; y < hw - 6; y += 20) out.push(boxBounds([-15, y - 1.5, 0], [-13, y + 1.5, spring], "IronDark"));
  if (o.flowers !== undefined)
    out.push(translate(merge(boxBounds([-30, -(w + 18) / 2, -24], [-2, (w + 18) / 2, 0], "Noa_Timber"), translate(blooms(w + 10, Math.max(3, Math.round(w / 15)), o.flowers, 6), [-16, 0, -2])), [0, 0, -16]));
  return merge(...out);
}
// A slit window for walls and towers (facing -X, bottom at z = 0).
function slitGeo(h = 100): Geo {
  return merge(
    panel(rectShape(17, h + 10, -10), -6, 8, "Noa_StoneLight"),
    panel(rectShape(5, h), -8, 2, "Noa_Dark"),
    panel(rectShape(14, h * 0.55 + 3, h * 0.55 - 3), -8, 2, "Noa_Dark"),
  );
}
// A door facing -X: stone frame, plank leaf (or two), iron straps, a ring handle, a worn step.
function doorGeo(w: number, h: number, o: { arch?: boolean; double?: boolean; frame?: string; step?: boolean; wood?: string } = {}): Geo {
  const hw = w / 2, fm = o.frame ?? "Noa_StoneLight", spring = o.arch ? h - hw : h;
  const out: Geo[] = [
    panel(o.arch ? archShape(hw + 16, spring) : rectShape(hw + 16, h + 8), -8, 10, fm),
    panel(o.arch ? archShape(hw, spring) : rectShape(hw, h), -11, 3, o.wood ?? "DoorWood", { vertical: true }),
  ];
  for (const z of [h * 0.18, spring * 0.74]) out.push(boxBounds([-13, -hw + 4, z], [-11, hw - 4, z + 7], "IronDark"));
  if (o.double) out.push(boxBounds([-12.5, -1.5, 0], [-11, 1.5, h - 2], "Noa_Timber"), translate(rotateY(torus(6, 1.5, 10, 4, "IronDark"), 90), [-14, -12, h * 0.45]), translate(rotateY(torus(6, 1.5, 10, 4, "IronDark"), 90), [-14, 12, h * 0.45]));
  else out.push(translate(rotateY(torus(6, 1.5, 10, 4, "IronDark"), 90), [-14, hw * 0.6, h * 0.45]));
  if (o.arch) out.push(boxBounds([-12, -9, h + 4], [2, 9, h + 26], fm, 1.5));
  else out.push(boxBounds([-13, -hw - 22, h + 8], [2, hw + 22, h + 24], fm, 2));
  if (o.step !== false) out.push(boxBounds([-48, -hw - 24, 0], [2, hw + 24, 13], "Noa_StoneDark", 3));
  return merge(...out);
}
// A lantern standing on z = 0 (about 44 cm high).
function lantern(): Geo {
  return merge(
    rotateZ(cylinderAt({ rBot: 10, rTop: 12, height: 4, segments: 4, bottom: [0, 0, 0] }, "IronDark"), 45),
    boxAt([13, 13, 22], [0, 0, 4], "LanternGlow"),
    ...[[-7, -7], [7, -7], [-7, 7], [7, 7]].map(([x, y]) => boxAt([2.5, 2.5, 22], [x, y, 4], "IronDark")),
    rotateZ(cylinderAt({ rBot: 14, rTop: 2, height: 13, segments: 4, bottom: [0, 0, 26] }, "IronDark"), 45),
    translate(rotateX(torus(4, 1.2, 8, 4, "IronDark"), 90), [0, 0, 42]),
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
// A banner gone thin and ragged: a rod, the cloth, and its bottom torn into tails of odd lengths.
function raggedBanner(w: number, h: number, mat: string): Geo {
  const hw = w / 2, out: Geo[] = [
    cylinderBetween([0, -hw - 10, 4], [0, hw + 10, 4], 2.5, 6, "IronDark"),
    boxBounds([-1.5, -hw, -h * 0.62], [1.5, hw, 0], mat),
    boxBounds([-2, -hw, -12], [2, hw, -6], "Noa_Gilt"),
  ];
  const tails = [0.95, 0.72, 1.0, 0.8];
  tails.forEach((k, i) => out.push(boxBounds([-1.5, -hw + (w * i) / 4 + 1, -h * (0.62 + 0.38 * k)], [1.5, -hw + (w * (i + 1)) / 4 - 1, -h * 0.62 + 1], mat)));
  return merge(...out, translate(panel(crownShape(w * 0.22), -3, 1, "Noa_Gilt", { seg: 2 }), [0, 0, -h * 0.3]));
}
// Ridge tiles along a line.
function ridge(a: V3, b: V3, r = 12): Geo {
  return cylinderBetween(a, b, r, 8, "Noa_Ridge");
}
// A stone chimney, cap and old pots (one cracked down short), from z0 (inside the roof) to `top`.
function chimney(x: number, y: number, z0: number, top: number): Geo {
  return merge(
    wuv(boxBounds([x - 45, y - 38, z0], [x + 45, y + 38, top], "Noa_Stone"), 1.1),
    boxBounds([x - 53, y - 46, top], [x + 53, y + 46, top + 16], "Noa_StoneDark", 2),
    cylinderAt({ radius: 11, height: 26, segments: 8, bottom: [x - 18, y, top + 16] }, "Noa_Clay"),
    cylinderAt({ rBot: 11, rTop: 12, height: 12, segments: 8, bottom: [x + 18, y, top + 16] }, "Noa_Clay"),
    boxBounds([x - 40, y - 34, top + 16], [x + 4, y + 30, top + 18], "Noa_MossCap"),
  );
}
// Corner stones up the corners of a box building between z0 and z1, alternating long and short.
function quoins(hx: number, hy: number, z0: number, z1: number, corners: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]], mat = "Noa_StoneLight"): Geo {
  const out: Geo[] = [];
  for (const [cx, cy] of corners)
    for (let i = 0, z = z0; z + 40 <= z1; i++, z += 50) {
      const ax = i % 2 ? 28 : 46, ay = i % 2 ? 46 : 28, x = cx * hx, y = cy * hy;
      out.push(boxBounds([cx < 0 ? x - 3 : x - ax, cy < 0 ? y - 3 : y - ay, z], [cx < 0 ? x + ax : x + 3, cy < 0 ? y + ay : y + 3, z + 40], mat));
    }
  return merge(...out);
}
// The body of a house HX deep either way and HY wide: footing, stone ground storey to G,
// plaster to the eaves E (set in by P), string courses and a cornice; `flush` keeps the ends at
// ±HY plain for a terrace (no quoins there).
function houseBody(HX: number, HY: number, G: number, E: number, floors: number[], o: { wall?: string; P?: number; flush?: boolean } = {}): Geo {
  const P = o.P ?? 4, wall = o.wall ?? "Noa_Plaster", ey = o.flush ? 0 : 10;
  return merge(
    wuv(merge(boxBounds([-HX - 8, -HY - (o.flush ? 0 : 8), 0], [HX + 8, HY + (o.flush ? 0 : 8), 44], "Noa_StoneDark"), boxBounds([-HX, -HY, 44], [HX, HY, G], "Noa_Stone")), 1.1),
    boxBounds([-HX + P, -HY + (o.flush ? 0 : P), G], [HX - P, HY - (o.flush ? 0 : P), E], wall),
    boxBounds([-HX - 10, -HY - ey, G - 6], [HX + 10, HY + ey, G + 12], "Noa_StoneLight", 3),
    ...floors.map((f) => boxBounds([-HX - 1, -HY - (o.flush ? 0 : 1), f - 6], [HX + 1, HY + (o.flush ? 0 : 1), f + 6], "Noa_StoneLight")),
    boxBounds([-HX - 12, -HY - (o.flush ? 0 : 12), E - 24], [HX + 12, HY + (o.flush ? 0 : 12), E + 2], "Noa_StoneLight", 3),
  );
}
// Where the plaster has fallen away from the brick underneath (on a -X facing wall).
function bareBrick(cy: number, cz: number, rw: number, rh: number, seed: number): Geo {
  return panel(blobShape(cy, cz, rw, rh, seed, 8), -1, 1, "BrickRed", { s: 0.5 });
}

// A tiled gable roof, ridge along X, over ±hx, ±hy with its eaves at E: `ovx` past the gables,
// `ovy` past the eaves, gables at ±gx (half-width gw), ridge tiles, timber bargeboards, and
// moss creeping over the old tiles in `moss` patches. rotateZ(…, 90) puts the ridge along Y.
interface RoofOpt { ovx?: number; ovy?: number; gx?: number; gw?: number; wall?: string; th?: number; barge?: boolean; mat?: string; moss?: number; seed?: number }
function roofX(hx: number, hy: number, E: number, RH: number, o: RoofOpt = {}): Geo {
  const th = o.th ?? 22, ang = Math.atan2(RH, hy), ovx = o.ovx ?? 30, ovy = o.ovy ?? 30;
  const slope = (hy + ovy) / Math.cos(ang), len = 2 * (hx + ovx), wall = o.wall ?? "Noa_Plaster", mat = o.mat ?? "Noa_RoofFaded";
  const gx = o.gx ?? hx - 4, gw = o.gw ?? hy - 4, rz = E + RH + th / Math.cos(ang) - 3, rnd = rng(o.seed ?? 7);
  const slab = (s: number): Geo => {
    const parts: Geo[] = [box([len, slope, th], [0, (s * slope) / 2, th / 2], mat)];
    for (let i = 0; i < (o.moss ?? 3); i++) {
      const w = 50 + rnd() * Math.min(150, len * 0.3), h = 40 + rnd() * Math.min(90, slope * 0.3);
      const x = (rnd() - 0.5) * (len - w - 30), a = Math.min(slope - h / 2 - 6, slope * (0.4 + rnd() * 0.5));
      parts.push(box([w, h, 2], [x, s * a, th + 0.8], "Noa_MossCap"));
    }
    return rotateX(merge(...parts), (-s * ang) / D);
  };
  const out: Geo[] = [
    translate(merge(slab(1), slab(-1)), [0, 0, E + RH]),
    ridge([-hx - ovx, 0, rz], [hx + ovx, 0, rz], 11),
    wuv(merge(gableWall(-gx, gw, E, RH - 4, wall), gableWall(gx, gw, E, RH - 4, wall))),
  ];
  if (o.barge !== false)
    for (const x of [-hx - ovx + 3, hx + ovx - 3])
      for (const s of [-1, 1]) out.push(beamBetween([x, s * (hy + ovy), E - (RH * ovy) / hy - 8], [x, 0, E + RH - 4], 6, 20, "Noa_Timber"));
  return merge(...out);
}
// A tiled hipped roof over ±hx, ±hy: eaves `ov` past the walls at z, `th` thick, rising h to a
// ridge along the longer side (a point when square), ridge and hip tiles.
function hipRoof(hx: number, hy: number, z: number, h: number, ov: number, mat = "Noa_RoofBlue", th = 22): Geo {
  const ax = hx + ov, ay = hy + ov, zt = z + th, zr = zt + h;
  const ends: V3[] = ax - ay > 2 ? [[ay - ax, 0, zr], [ax - ay, 0, zr]] : ay - ax > 2 ? [[0, ax - ay, zr], [0, ay - ax, zr]] : [[0, 0, zr]];
  const pts = ends.map((e) => new THREE.Vector3(...e));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) pts.push(new THREE.Vector3(sx * ax, sy * ay, z), new THREE.Vector3(sx * ax, sy * ay, zt));
  const out: Geo[] = [wuv([{ geo: new ConvexGeometry(pts), mat }])];
  if (ends.length === 2) out.push(ridge([ends[0][0], ends[0][1], zr + 3], [ends[1][0], ends[1][1], zr + 3], 10));
  const alongX = ends.length === 2 && ends[0][0] !== 0;
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) {
      const e = ends.length === 1 ? ends[0] : ends[(alongX ? sx : sy) < 0 ? 0 : 1], c: V3 = [sx * ax, sy * ay, zt + 2];
      out.push(cylinderBetween([c[0] + (e[0] - c[0]) * 0.05, c[1] + (e[1] - c[1]) * 0.05, c[2] + (e[2] + 3 - c[2]) * 0.05], [e[0], e[1], zr + 3], 7, 6, "Noa_Ridge"));
    }
  return merge(...out);
}
// A gabled dormer facing -X on a roof: its front at x, a window inside (h high to the eaves).
function dormer(x: number, y: number, z0: number, w: number, depth: number, h = 150, roof = "Noa_RoofFaded"): Geo {
  const hw = w / 2;
  return translate(merge(
    boxBounds([0, -hw, 0], [depth, hw, h], "Noa_Plaster"),
    gableRoof([depth + 10, w, 8], [depth / 2 - 5, 0, h], 60, 10, roof),
    gableWall(0, hw, h, 56, "Noa_Plaster"),
    onFace(windowGeo(w - 76, 70, { frame: "Noa_PaintOld" }), "-x", 0, 0, Math.round((h - 70) / 2) + 4),
  ), [x, y, z0]);
}
// A hanging sign on a scrolled iron bracket out from a -X facing wall (bracket at z = 0): a board
// across it (faces to ±Y) with `front` (built facing -Y) on one face and turned on the other.
function hangingSign(front: Geo, o: { len?: number; bw?: number; bh?: number; board?: string } = {}): Geo {
  const len = o.len ?? 140, bw = o.bw ?? 96, bh = o.bh ?? 84, cx = -len * 0.56, zc = -16 - bh / 2;
  return merge(
    boxBounds([-3, -9, -len * 0.42], [1, 9, 10], "IronDark"),
    beamBetween([0, 0, 0], [-len, 0, 0], 6, 6, "IronDark"),
    beamBetween([0, 0, -len * 0.38], [-len * 0.6, 0, -2], 3.5, 3.5, "IronDark"),
    translate(rotateX(torus(len * 0.12, 1.6, 10, 4, "IronDark"), 90), [-len * 0.2, 0, -len * 0.13]),
    cylinderBetween([cx - bw / 2 + 10, 0, 0], [cx - bw / 2 + 10, 0, -16], 1.2, 4, "IronDark"),
    cylinderBetween([cx + bw / 2 - 10, 0, 0], [cx + bw / 2 - 10, 0, -16], 1.2, 4, "IronDark"),
    boxBounds([cx - bw / 2, -3.5, -16 - bh], [cx + bw / 2, 3.5, -16], "Noa_Timber", 1.5),
    boxBounds([cx - bw / 2 + 4, -4.5, -12 - bh], [cx + bw / 2 - 4, 4.5, -20], o.board ?? "Noa_PaintBlue"),
    translate(front, [cx, -4.5, zc]),
    translate(rotateZ(front, 180), [cx, 4.5, zc]),
  );
}
// A striped cloth awning out from a -X facing wall: its back edge at the origin, its front
// `depth` out and `drop` lower, the front edge cut in flaps.
function awning(width: number, depth: number, drop: number, a: string, b: string, stays = true): Geo {
  const n = Math.max(3, Math.round(width / 32)), sw = width / n, len = Math.hypot(depth, drop), ang = Math.atan2(drop, depth) / D;
  const out: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const y = -width / 2 + sw * (i + 0.5), m = i % 2 ? b : a;
    out.push(rotateY(box([len, sw, 3], [-len / 2, y, 0], m), -ang));
    out.push(box([3, sw - 2, 14 + (i % 3) * 4], [-depth - 1, y, -drop - 7 - (i % 3) * 2], m));
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
// A wooden crate on z = 0 with dark battens on its edges.
function crate(sx: number, sy: number, sz: number, wood = "WoodWarm"): Geo {
  const t = 5, hx = sx / 2, hy = sy / 2, out: Geo[] = [boxAt([sx - 2, sy - 2, sz - 2], [0, 0, 1], wood)];
  for (const x of [-hx, hx - t]) for (const y of [-hy, hy - t]) out.push(boxBounds([x, y, 0], [x + t, y + t, sz], "WoodDark"));
  for (const z of [0, sz - t]) {
    for (const y of [-hy, hy - t]) out.push(boxBounds([-hx, y, z], [hx, y + t, z + t], "WoodDark"));
    for (const x of [-hx, hx - t]) out.push(boxBounds([x, -hy, z], [x + t, hy, z + t], "WoodDark"));
  }
  return merge(...out);
}
// A tied sack standing on z = 0.
function sack(r: number, mat = "FabricSand"): Geo {
  return translate(merge(
    scale(sphereCenter(r, [0, 0, 0], mat, 8), [0.85, 1.15, 0.72], [0, 0, 0]),
    cylinderAt({ rBot: r * 0.32, rTop: r * 0.18, height: r * 0.45, segments: 6, bottom: [0, 0, r * 0.6] }, mat),
    translate(torus(r * 0.22, 1.6, 8, 4, "RopeTan"), [0, 0, r * 0.82]),
  ), [0, 0, r * 0.66]);
}
// An amphora (or a fat jar if `jar`) on z = 0.
function amphora(h: number, jar = false, mat = "Noa_Clay"): Geo {
  const r = jar ? h * 0.36 : h * 0.24;
  return merge(
    cylinderAt({ rBot: r * 0.45, rTop: r, height: h * 0.4, segments: 10, bottom: [0, 0, 0] }, mat),
    cylinderAt({ rBot: r, rTop: r * 0.38, height: h * 0.4, segments: 10, bottom: [0, 0, h * 0.4] }, mat),
    cylinderAt({ rBot: r * 0.32, rTop: r * 0.38, height: h * 0.2, segments: 10, bottom: [0, 0, h * 0.8] }, mat),
    ...(jar ? [] : [-1, 1].map((s) => translate(rotateX(torus(h * 0.1, 1.8, 8, 4, mat), 90), [0, s * r * 0.55, h * 0.78]))),
  );
}
// A bronze bell hanging from z = 0.
function bell(r: number): Geo {
  return merge(
    cylinderBetween([0, 0, 0], [0, 0, -r * 0.3], r * 0.12, 6, "IronDark"),
    sphereCenter(r * 0.55, [0, 0, -r * 0.6], "Noa_Verdigris", 8),
    cylinderAt({ rBot: r, rTop: r * 0.55, height: r, segments: 10, bottom: [0, 0, -r * 1.6] }, "Noa_Verdigris"),
    translate(torus(r, r * 0.09, 10, 4, "Noa_Verdigris"), [0, 0, -r * 1.6]),
    sphereCenter(r * 0.2, [0, 0, -r * 1.75], "IronDark", 6),
  );
}
// A clock face facing -X centred on the origin: stone surround, gilt ring, a faded dial, the
// hours, the hands (stopped at twenty to four, as the townsfolk say they have been for a century).
function clockFace(r: number): Geo {
  const out: Geo[] = [
    panel(circleShape(r + 16), -6, 6, "Noa_StoneLight", { seg: 8 }),
    panel(circleShape(r + 4), -8, 2, "Noa_Gilt", { seg: 8 }),
    panel(circleShape(r), -9, 1, "Noa_ClockDial", { seg: 8 }),
    rotateX(boxBounds([-12, -3, -4], [-10, 3, r * 0.52], "IronDark"), 120),
    rotateX(boxBounds([-13, -2, -4], [-11, 2, r * 0.78], "IronDark"), -120),
    sphereCenter(4, [-13, 0, 0], "Noa_Gilt", 6),
  ];
  for (let i = 0; i < 12; i++) out.push(rotateX(boxBounds([-10.5, -2.2, r * 0.74], [-9, 2.2, r * 0.92], i % 3 ? "Noa_Dark" : "Noa_Gilt"), i * 30));
  return merge(...out);
}
// A column on z = 0: a square plinth, a round base, a shaft of radius r tapering a little up to
// h, and a capital whose top is at h + 36. `broken`: the shaft snaps off at that height (a jagged
// stump, no capital).
function column(r: number, h: number, o: { mat?: string; broken?: number; seed?: number } = {}): Geo {
  const m = o.mat ?? "Noa_StoneLight", top = o.broken ?? h;
  const rt = r * (1 - (0.12 * (top - 36)) / (h - 36));
  const out: Geo[] = [
    boxAt([r * 2.8, r * 2.8, 18], [0, 0, 0], "Noa_Stone", 2),
    cylinderAt({ rBot: r * 1.28, rTop: r * 1.12, height: 12, segments: 12, bottom: [0, 0, 18] }, m),
    translate(torus(r * 1.06, 5, 12, 4, m), [0, 0, 32]),
    cylinderAt({ rBot: r, rTop: rt, height: top - 36, segments: 12, bottom: [0, 0, 36] }, m),
  ];
  if (o.broken !== undefined) out.push(translate(rock([rt * 2.1, rt * 2.1, 36], 0.55, o.seed ?? 3, m), [0, 0, top - 18]));
  else
    out.push(
      translate(torus(rt + 2, 3.5, 12, 4, m), [0, 0, h - 6]),
      cylinderAt({ rBot: rt * 1.02, rTop: r * 1.45, height: 18, segments: 12, bottom: [0, 0, h] }, m),
      boxAt([r * 3.1, r * 3.1, 18], [0, 0, h + 18], m, 2),
    );
  return merge(...out);
}
// A drum of a fallen column lying along Y at (x, y), radius r, length l.
function drum(x: number, y: number, r: number, l: number, turn: number, mat = "Noa_StoneLight"): Geo {
  return translate(rotateZ(cylinderBetween([0, -l / 2, r - 4], [0, l / 2, r - 4], r, 12, mat), turn), [x, y, 0]);
}

// ---- the aqueduct ----
// One 700 cm bay along Y (bays join end to end: half a pier at each end makes a whole one with
// the next). A great round arch 520 wide on rusticated piers (its crown 820 up, room for any cart
// beneath), a string course, two small arches above, and on top the water channel under its
// cover slabs (the water shows where one has fallen in). 300 across at the piers. "ivy": ivy up
// the piers and over the arch, grass and a bush on the channel. "broken": the end of a run, the
// +Y half fallen (a stump of pier, a half arch reaching out into nothing, the fallen stones below).
const AQ = { L: 700, PIER: 90, SP: 560, R: 260, W: 130, T1: 900, T2: 1210 };
function aqueduct(kind: "plain" | "ivy" | "broken"): Geo {
  const { L, PIER, SP, R, W, T1, T2 } = AQ, hl = L / 2, broken = kind === "broken", out: Geo[] = [], mason: Geo[] = [];
  const W2 = 100, S2 = T1 + 110, r2 = 125, seed = kind === "ivy" ? 31 : 13;
  for (const s of [-1, 1]) {
    const lo = s < 0 ? -hl : hl - PIER, hi = s < 0 ? -hl + PIER : hl, inLo = s < 0 ? lo : lo - 18, inHi = s < 0 ? hi + 18 : hi;
    const stump = broken && s > 0;
    mason.push(boxBounds([-W - 22, inLo, 0], [W + 22, inHi, 64], "Noa_StoneDark"));
    mason.push(boxBounds([-W - 6, lo, 64], [W + 6, hi, stump ? 300 : SP - 26], "Noa_Stone"));
    for (const z of [200, 380]) if (!stump || z < 300) out.push(boxBounds([-W - 9, lo + (s < 0 ? 0 : 3), z], [W + 9, hi - (s < 0 ? 3 : 0), z + 10], "Noa_StoneLight"));
    if (stump) out.push(translate(rock([2 * W + 30, PIER + 30, 80], 0.55, 11, "Noa_Stone"), [0, (lo + hi) / 2 - 10, 270]));
    else {
      out.push(boxBounds([-W - 14, inLo + (s < 0 ? 0 : 3), SP - 26], [W + 14, inHi - (s < 0 ? 3 : 0), SP], "Noa_StoneLight", 2));
      if (!broken) mason.push(boxBounds([-W, lo, SP], [W, hi, T1 - 40], "Noa_Stone"));
    }
    // moss up the foot of each pier, both faces
    for (const f of [-1, 1]) out.push(onFace(mossStain(0, 90, PIER * 0.4, 70, seed + s * 3 + f, f < 0 ? "Noa_Moss" : "Noa_MossCap"), f < 0 ? "-x" : "+x", W + 6, (lo + hi) / 2, 0));
  }
  if (!broken) {
    out.push(archBay(R, R, SP, T1 - 40, 2 * W, { n: 13, thick: 58 }));
    out.push(boxBounds([-W - 12, -hl, T1 - 40], [W + 12, hl, T1], "Noa_StoneLight", 2));
    // the upper arcade: piers over the great piers and one between, two small arches
    for (const [a, b] of [[-hl, -hl + 50], [-50, 50], [hl - 50, hl]]) mason.push(boxBounds([-W2, a, T1], [W2, b, T2 - 30], "Noa_Stone"));
    for (const c of [-175, 175]) out.push(translate(archBay(r2, r2, S2, T2 - 30, 2 * W2, { n: 9, thick: 32 }), [0, c, 0]));
    out.push(boxBounds([-W2 - 10, -hl, T2 - 30], [W2 + 10, hl, T2], "Noa_StoneLight", 2));
    // the channel: its walls, the water, the cover slabs (one fallen in)
    out.push(
      boxBounds([-W2, -hl, T2], [-W2 + 30, hl, T2 + 100], "Noa_Stone"),
      boxBounds([W2 - 30, -hl, T2], [W2, hl, T2 + 100], "Noa_Stone"),
      boxBounds([-W2 + 30, -hl, T2], [W2 - 30, hl, T2 + 52], "Noa_Water"),
    );
    const slabs = kind === "ivy" ? [0, 2, 3] : [0, 1, 3];
    for (const i of slabs) out.push(boxBounds([-W2 - 8, -hl + i * 175 + 2, T2 + 100], [W2 + 8, -hl + (i + 1) * 175 - 2, T2 + 120], "Noa_StoneLight", 2));
    for (const i of slabs) out.push(boxBounds([-W2 + 10, -hl + i * 175 + 30, T2 + 120], [W2 - 30, -hl + i * 175 + 110, T2 + 122], "Noa_MossCap"));
    out.push(tufts([...scatter(-W2, W2, -hl + 10, hl - 10, T2 + 120, kind === "ivy" ? 9 : 4, seed), ...scatter(-W - 10, -W, -hl, hl, T1, 4, seed + 1)], seed + 2, 30, 0.35));
    if (kind === "ivy") {
      out.push(translate(ivy(hl - PIER - 18, hl, 64, 700, seed, { n: 3 }), [-W - 6, 0, 0]));
      out.push(onFace(ivy(hl - PIER - 18, hl, 64, 560, seed + 4, { n: 3 }), "+x", W + 6, 0, 0));
      out.push(translate(ivy(-150, 170, T1 - 30, 300, seed + 5, { hang: true, n: 6 }), [-W - 12, 0, 0]));
      out.push(shrub({ seed: 7, lobes: [[0, 90, T2 + 150, 46, 50, 34], [10, 40, T2 + 140, 34, 34, 26]], leaf: 18, core: 0.7 }));
    }
  } else {
    // what is left: the -Y pier to its full height, the haunch of the arch, a shoulder of the
    // upper arcade and a stub of the channel; the rest on the ground
    out.push(arcStones([0, 0, SP], R, 116, 180, 5, 58, 2 * W + 4, "Noa_StoneLight", 2));
    const rnd = rng(9), Rx = R + 46;
    for (let y = -R; y < -R + 130; y += 20) {
      const m = Math.abs(y), z0 = SP + Math.sqrt(Math.max(0, Rx * Rx - m * m)), top = T1 - 40 - (y + R) * 2.4 - rnd() * 40;
      if (top > z0 + 10) mason.push(boxBounds([-W, y, z0], [W, y + 20, top], "Noa_Stone"));
    }
    mason.push(boxBounds([-W, -hl, SP], [W, -hl + PIER, T1 - 40], "Noa_Stone"));
    out.push(boxBounds([-W - 12, -hl, T1 - 40], [W + 12, -hl + PIER + 50, T1], "Noa_StoneLight", 2));
    mason.push(boxBounds([-W2, -hl, T1], [W2, -hl + 50, T2 - 70], "Noa_Stone"));
    out.push(arcStones([0, -175, S2], r2, 148, 180, 2, 32, 2 * W2 + 4, "Noa_StoneLight", 1.5));
    out.push(translate(rock([2 * W2 + 20, 90, 60], 0.5, 7, "Noa_Stone"), [0, -hl + 30, T2 - 100]));
    out.push(boxBounds([-W - 12, -10, T1 - 40], [W + 12, 30, T1 - 20], "Noa_MossCap"));
    out.push(rubble(-W - 160, W + 160, -60, hl - 20, 14, 21, 1.1));
    out.push(drum(-W - 70, 160, 34, 90, 70, "Noa_StoneLight"));
    out.push(tufts([...scatter(-W - 150, W + 150, -80, hl - 10, 0, 12, 5), [0, -hl + 20, T2 - 70]], 6, 32, 0.4));
    out.push(translate(ivy(-hl, -hl + PIER + 18, 64, 600, 41, { n: 3 }), [-W - 6, 0, 0]));
  }
  out.push(wuv(merge(...mason), 1.25));
  return merge(...out);
}

// ---- the old city gate ----
// A deep arched passage, 440 wide, through a gatehouse of weathered stone: the voussoirs worn
// round and the keystone slipped a hand's breadth, the old kingdom's arms above the arch worn
// almost smooth, the great doors left open for a century (one sagging off its lower hinge), square
// towers either side under faded roofs, battlements broken, grass and ivy on everything.
// 1560 along Y (the wall line), the outside to -X; the passage is open between y = ±220.
const GATE = { HX: 270, HY: 360, R: 220, TW: 200, TY: 560 };
function oldGate(): Geo {
  const { HX, HY, R, TW, TY } = GATE, SP = 380, TOP = 940, TH = 1180, out: Geo[] = [];
  const mason: Geo[] = [
    boxBounds([-HX, -HY, 60], [HX, -R, TOP], "Noa_Stone"),
    boxBounds([-HX, R, 60], [HX, HY, TOP], "Noa_Stone"),
    boxBounds([-HX, -R, SP + R + 70], [HX, R, TOP], "Noa_Stone"),
  ];
  for (let y0 = -R; y0 < R; y0 += 20) {
    const m = Math.max(Math.abs(y0), Math.abs(y0 + 20));
    mason.push(boxBounds([-HX, y0, SP + Math.sqrt((R + 52) ** 2 - m * m)], [HX, y0 + 20, SP + R + 70], "Noa_Stone"));
  }
  out.push(wuv(merge(...mason), 1.35));
  const step = 180 / 13, depth = 2 * HX + 14;
  out.push(
    arcStones([0, 0, SP], R, 0, step * 6, 6, 62, depth, "Noa_StoneLight", 3),
    arcStones([0, 0, SP], R, step * 7, 180, 6, 62, depth, "Noa_StoneLight", 3),
    translate(arcStones([0, 0, SP], R, step * 6, step * 7, 1, 62, depth, "Noa_StoneLight", 3), [0, 0, -16]),
    boxBounds([-HX - 40, -R, 0], [HX + 40, R, 5], "CobbleDark"),
    boxBounds([-HX - 12, -HY - 12, 0], [HX + 12, -R, 60], "Noa_StoneDark", 3),
    boxBounds([-HX - 12, R, 0], [HX + 12, HY + 12, 60], "Noa_StoneDark", 3),
    boxBounds([-HX - 8, -HY, 660], [HX + 8, HY, 676], "Noa_StoneLight", 2),
  );
  for (const s of [-1, 1]) out.push(boxBounds([-HX - 6, s < 0 ? -R - 8 : R - 4, SP - 18], [HX + 6, s < 0 ? -R + 4 : R + 8, SP], "Noa_StoneLight", 2));
  // the battlements: the outer parapet with merlons, several of them fallen; the inner parapet
  // low; turf along the walk
  out.push(boxBounds([-HX - 16, -HY, TOP], [-HX + 44, HY, TOP + 56], "Noa_Stone"), boxBounds([HX - 40, -HY, TOP], [HX + 8, HY, TOP + 44], "Noa_Stone"));
  [76, 76, 0, 76, 40, 0, 76].forEach((h, i) => {
    if (h) out.push(boxBounds([-HX - 16, -HY + 18 + i * 103, TOP + 56], [-HX + 44, -HY + 76 + i * 103, TOP + 56 + h], "Noa_Stone", 2));
  });
  out.push(boxBounds([-HX + 44, -HY, TOP], [HX - 40, HY, TOP + 6], "Noa_MossCap"));
  out.push(tufts([...scatter(-HX + 50, HX - 50, -HY + 10, HY - 10, TOP + 6, 12, 3), ...scatter(-HX - 10, -HX + 40, -HY, HY, TOP + 56, 4, 4)], 5, 32, 0.3));
  // the old arms over the arch: a shield and a crown, worn soft, a little gilt left in the crown
  const arms = merge(
    panel(shieldShape(70), -4, 4, "Noa_StoneLight"),
    panel(shieldShape(60), -6, 2, "Noa_Moss"),
    panel(crownShape(36), -7, 1, "Noa_StoneLight", { seg: 2 }),
    translate(panel(crownShape(44), -6, 6, "Noa_Gilt"), [0, 0, 92]),
  );
  out.push(translate(arms, [-HX, 0, 770]), translate(rotateZ(arms, 180), [HX, 0, 770]));
  // the great doors, open against the passage walls (the right-hand one sagging)
  for (const s of [-1, 1]) {
    const y0 = s < 0 ? -R + 1 : R - 9;
    let door = merge(boxBounds([40, y0, 6], [230, y0 + 8, 400], "DoorWood"), ...[80, 220, 350].map((z) => boxBounds([44, s < 0 ? y0 + 8 : y0 - 2, z], [226, s < 0 ? y0 + 10 : y0, z + 10], "IronDark")));
    if (s > 0) door = rotateY(door, -4, [230, 0, 400]);
    out.push(door);
  }
  // flanking towers
  for (const s of [-1, 1]) {
    const t: Geo[] = [];
    t.push(wuv(merge(boxBounds([-262, -TW - 22, 0], [262, TW + 22, 70], "Noa_StoneDark"), boxBounds([-240, -TW, 70], [240, TW, TH], "Noa_Stone")), 1.35));
    for (const z of [420, 860]) t.push(boxBounds([-248, -TW - 8, z], [248, TW + 8, z + 14], "Noa_StoneLight", 2));
    t.push(boxBounds([-262, -TW - 22, TH], [262, TW + 22, TH + 30], "Noa_StoneLight", 3));
    t.push(array(boxBounds([-262, -TW + 10, TH - 50], [-240, -TW + 40, TH], "Noa_StoneLight", 1.5), 6, [0, 70, 0]));
    t.push(translate(hipRoof(262, TW + 22, TH + 30, 300, 24, "Noa_RoofBlue"), [0, 0, 0]));
    t.push(beamBetween([0, 0, TH + 350], [6, 4, TH + 470], 3, 3, "IronDark"), sphereCenter(7, [0, 0, TH + 358], "Noa_Gilt", 6));
    for (const f of ["-x", "+x"] as const) for (const z of [260, 640]) t.push(onFace(slitGeo(), f, 240, 0, z));
    t.push(onFace(slitGeo(), s < 0 ? "-y" : "+y", TW, 0, 500));
    t.push(onFace(windowGeo(60, 100, { arch: true, glass: "Noa_Dark" }), "-x", 240, 0, 960));
    t.push(onFace(mossStain(0, 110, 160, 80, 61 + s), "-x", 240, 0, 0), onFace(mossStain(0, 100, 150, 70, 63 + s), "+x", 240, 0, 0));
    t.push(translate(raggedBanner(110, 360, "Noa_CanvasBlue"), [-250, 0, 1100]));
    const iy: [number, number] = s > 0 ? [40, TW] : [-TW, -40];
    t.push(translate(ivy(iy[0], iy[1], 70, 900, 71 + s, { n: 4 }), [-241, 0, 0]));
    out.push(translate(merge(...t), [0, s * TY, 0]));
    out.push(onFace(wallLantern(), "-x", HX, s * (R + 80), 330), onFace(wallLantern(), "+x", HX, s * (R + 80), 330));
  }
  // ivy hanging over the outer face from the parapet, grass at the foot
  out.push(translate(ivy(-HY + 10, -R + 40, TOP + 40, 420, 77, { hang: true, n: 4 }), [-HX - 17, 0, 0]));
  out.push(translate(ivy(R + 60, HY, TOP + 40, 260, 79, { hang: true, n: 3 }), [-HX - 17, 0, 0]));
  out.push(tufts([...scatter(-HX - 60, -HX - 10, -HY, -R - 10, 0, 4, 8), ...scatter(HX + 10, HX + 60, R + 10, HY, 0, 4, 9)], 10, 30, 0.3));
  return merge(...out);
}

// ---- the old inner wall ----
// An 800 cm run of the old inner wall along Y (runs join end to end, 560 high where they meet),
// 240 thick, its top broken down unevenly toward the middle (to `low`), or, with `breach`, fallen
// right down to a gap of rubble in the middle that anyone can walk through. Turf and grass on the
// broken top, ivy and moss outside (-X), the corbels of the old wall-walk inside.
function ruinedWall(o: { low: number; breach?: boolean; seed: number }): Geo {
  const HX = 120, L = 400, END = 560, rnd = rng(o.seed), out: Geo[] = [], mason: Geo[] = [], tops: V3[] = [];
  const gap = o.breach ? 170 : 0;
  for (let y = -L; y < L - 0.1; y += 40) {
    const y1 = y + 40, mid = (y + y1) / 2, t = Math.abs(mid) / L;
    if (Math.abs(mid) < gap) continue;
    let h = o.low + (END - o.low) * Math.pow(o.breach ? (Math.abs(mid) - gap) / (L - gap) : t, 1.5);
    if (Math.abs(mid) < L - 60) h = Math.max(110, h + (rnd() - 0.5) * 80);
    else h = END;
    mason.push(boxBounds([-HX, y, 60], [HX, y1, h], "Noa_Stone"));
    out.push(boxBounds([-HX + 4 + rnd() * 12, y, h], [HX - 4 - rnd() * 12, y1, h + 6], "Noa_MossCap"));
    if (rnd() < 0.6) tops.push([(rnd() - 0.5) * 120, mid, h + 6]);
    if (h > 260) out.push(boxBounds([-HX - 8, y, 220], [-HX, y1, 232], "Noa_StoneLight"));
    if (h > 470 && ((Math.round(mid) % 120) + 120) % 120 === 20) out.push(boxBounds([HX, mid - 15, 400], [HX + 30, mid + 15, 440], "Noa_StoneLight", 1.5));
  }
  for (const [a, b] of gap ? [[-L, -gap], [gap, L]] : [[-L, L]]) mason.push(boxBounds([-HX - 16, a, 0], [HX + 16, b, 60], "Noa_StoneDark"));
  out.push(wuv(merge(...mason), 1.25));
  out.push(tufts(tops, o.seed + 1, 30, 0.3));
  out.push(translate(merge(mossStain(-180, 120, 120, 70, o.seed + 2), mossStain(230, 100, 90, 60, o.seed + 3)), [-HX, 0, 0]));
  out.push(translate(mossStain(-100, 110, 110, 60, o.seed + 4, "Noa_MossCap"), [-HX - 0.5, 0, 0]));
  out.push(translate(ivy(o.breach ? 200 : -340, o.breach ? 380 : -60, 60, 460, o.seed + 5, { n: 5 }), [-HX, 0, 0]));
  out.push(rubble(-HX - 150, -HX - 20, -L + 40, L - 40, 5, o.seed + 6), rubble(HX + 20, HX + 140, -L + 40, L - 40, 4, o.seed + 7));
  if (gap) {
    out.push(rubble(-HX - 80, HX + 80, -gap, gap, 9, o.seed + 8, 0.75));
    out.push(tufts(scatter(-HX - 60, HX + 60, -gap, gap, 0, 10, o.seed + 9), o.seed + 10, 28, 0.4));
  }
  return merge(...out);
}

// A ruined round tower of the inner wall: the shell of a tower 640 across with no roof, broken
// down from 1100 on its north side to 420 on the south, grass and a young tree inside, the
// stubs of its floor beams, slits, the doorway choked with fallen stone.
function ruinedTower(): Geo {
  const R = 320, T = 80, N = 18, out: Geo[] = [], rnd = rng(29), chord = 2 * R * Math.sin(Math.PI / N) + 8;
  out.push(ring(R + 24, 60, 0, "Noa_StoneDark", N), cylinderAt({ radius: R - T + 2, height: 8, segments: N, bottom: [0, 0, 60] }, "Noa_Soil"));
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 360, h = 420 + 680 * (0.5 + 0.5 * Math.cos((a - 40) * D)) + (rnd() - 0.5) * 100;
    const seg: Geo[] = [
      wuv(boxBounds([R - T, -chord / 2, 60], [R, chord / 2, h], "Noa_Stone"), 1.25),
      boxBounds([R - T + 6, -chord / 2 + 3, h], [R - 6, chord / 2 - 3, h + 7], "Noa_MossCap"),
    ];
    if (h > 320) seg.push(boxBounds([R - 2, -chord / 2, 280], [R + 9, chord / 2, 294], "Noa_StoneLight"));
    if (i % 3 === 0 && h > 500) seg.push(onFace(slitGeo(90), "+x", R, 0, 340));
    if (i % 3 === 1 && h > 860) seg.push(onFace(slitGeo(90), "+x", R, 0, 700));
    if (h > 640 && i % 2 === 0) seg.push(beamBetween([R - T, 0, 560], [R - T - 70 - rnd() * 60, (rnd() - 0.5) * 20, 548], 16, 18, "Noa_Timber"));
    if (h > 780 && i % 4 === 1) seg.push(onFace(ivy(-chord / 2, chord / 2, 60, h - 120, 90 + i, { n: 2 }), "+x", R, 0, 0));
    out.push(rotateZ(merge(...seg), a));
  }
  // the doorway, choked
  out.push(onFace(merge(panel(archShape(70, 170, 0), -6, 6, "Noa_StoneLight"), panel(archShape(56, 170, 0), -8, 2, "Noa_Dark")), "-x", R, 0, 60));
  out.push(rubble(-R - 120, -R + 20, -110, 110, 8, 33, 1), tufts(scatter(-R - 140, -R, -140, 140, 0, 6, 34), 35, 28, 0.3));
  out.push(tufts(scatter(-R + T + 40, R - T - 40, -R + T + 40, R - T - 40, 68, 16, 36), 37, 34, 0.4));
  out.push(shrub({ seed: 41, lobes: [[20, -10, 300, 110, 100, 80], [-40, 40, 360, 80, 80, 66], [40, 30, 250, 70, 70, 60]], leaf: 28, stems: { mat: "BarkWarm", r: 7, n: 3 }, core: 0.75 }));
  out.push(onRound(mossStain(0, 110, 160, 80, 38), R, 180, 0), onRound(mossStain(0, 120, 140, 70, 39), R, 230, 0));
  return merge(...out);
}

// ---- the ruined palace ----
// The palace of the first kings, 25 x 22 m: a court 18 x 18 m paved and gone to grass, a dry
// basin in the middle and shrubs and a young tree in the corners, an arcade of round arches on
// columns round three sides (the front, -X, with a wide arch in the middle for the way in), some
// columns broken and their drums lying where they fell, low broken walls behind the side
// arcades; at the back (+X) the roofless throne hall behind three arches, its great niche, the
// dais and the broken throne under fallen beams. Solids in SOLIDS.palace_ruins.
const PAL = { X0: -1150, X1: 700, Y: 900, OUT: 1100, HX1: 1250, CR: 34, CH: 440 };
const PAL_FRONT = [-900, -580, -260, 260, 580, 900];            // the front columns (y)
const PAL_SIDE = [-1150, -790, -430, -70, 290, 650];            // the side columns (x)
const PAL_BROKEN: Record<string, number> = { "f:-900": 150, "+y:-70": 230, "-y:290": 330 };
function palaceRuins(): Geo {
  const { X0, Y, OUT, HX1, CR, CH } = PAL, SP = CH + 36, out: Geo[] = [], rnd = rng(51);
  // the floor: worn flags over the court and the hall, grass breaking through
  out.push(boxBounds([X0 - 120, -OUT, 0], [HX1, OUT, 4], "Noa_Stone"));
  for (let i = 0; i < 10; i++) {
    const x = X0 + rnd() * (PAL.X1 - X0), y = (rnd() - 0.5) * 2 * Y, w = 90 + rnd() * 220;
    out.push(flatPatch(x, y, w, w * (0.6 + rnd() * 0.4), 200 + i, 4, "Noa_Grass"));
  }
  out.push(tufts(scatter(X0, PAL.X1, -Y + 60, Y - 60, 4, 40, 52), 53, 30, 0.35));
  // columns: the front row and the two side rows (the corners shared)
  const cols: { x: number; y: number; key: string }[] = [];
  for (const y of PAL_FRONT) cols.push({ x: X0, y, key: `f:${y}` });
  for (const s of [-1, 1]) for (const x of PAL_SIDE.slice(1)) cols.push({ x, y: s * Y, key: `${s < 0 ? "-y" : "+y"}:${x}` });
  for (const c of cols) out.push(translate(column(CR, CH, { broken: PAL_BROKEN[c.key], seed: Math.abs(c.x + c.y) % 17 }), [c.x, c.y, 0]));
  const standing = (key: string) => PAL_BROKEN[key] === undefined;
  // the arches between them, and the wall band over them to 720 (840 over the front's middle)
  const bay = (y0: number, y1: number, top: number): Geo => {
    const hw = (y1 - y0) / 2, r = hw - 52;
    const g = merge(archBay(hw, r, SP, top, 2 * CR + 30, { n: r > 150 ? 13 : 9, thick: 38 }), boxBounds([-CR - 22, -hw, top], [CR + 22, hw, top + 22], "Noa_StoneLight", 2));
    return translate(g, [0, (y0 + y1) / 2, 0]);
  };
  // the front (-X): five bays, the middle one wide and taller, the -Y end bay fallen in
  for (let i = 0; i < PAL_FRONT.length - 1; i++) {
    const y0 = PAL_FRONT[i], y1 = PAL_FRONT[i + 1];
    if (!standing(`f:${y0}`) || !standing(`f:${y1}`)) continue;
    out.push(translate(bay(y0, y1, i === 2 ? 840 : 720), [X0, 0, 0]));
  }
  // over the way in, an attic with the worn crown of the old kings
  out.push(boxBounds([X0 - CR - 22, -340, 862], [X0 + CR + 22, 340, 1010], "Noa_Stone"), boxBounds([X0 - CR - 30, -360, 1010], [X0 + CR + 30, 360, 1030], "Noa_StoneLight", 2));
  out.push(translate(merge(panel(circleShape(70), -4, 4, "Noa_StoneLight"), panel(crownShape(46), -6, 3, "Noa_Gilt")), [X0 - CR - 22, 0, 936]));
  // the sides (±Y): bays along X, the arcade turned to face the court
  for (const s of [-1, 1]) {
    const key = (x: number) => (x === X0 ? `f:${s * Y}` : `${s < 0 ? "-y" : "+y"}:${x}`);
    for (let i = 0; i < PAL_SIDE.length - 1; i++) {
      const x0 = PAL_SIDE[i], x1 = PAL_SIDE[i + 1];
      if (!standing(key(x0)) || !standing(key(x1))) continue;
      out.push(translate(rotateZ(bay(x0, x1, 720), -90), [0, s * Y, 0]));
    }
    // the outer wall behind, broken low and uneven; turf on its top
    const wall: Geo[] = [];
    for (let x = X0 - 50; x < PAL.X1 + 80; x += 50) {
      const h = 220 + 260 * Math.abs(Math.sin((x + s * 300) * 0.0021)) + rnd() * 70;
      wall.push(boxBounds([x, s * OUT - 35, 0], [x + 50, s * OUT + 35, h], "Noa_Stone"));
      out.push(boxBounds([x, s * OUT - 30, h], [x + 50, s * OUT + 30, h + 6], "Noa_MossCap"));
    }
    out.push(wuv(merge(...wall), 1.25));
    out.push(onFace(ivy(-500, 300, 0, 380, 55 + s, { n: 6, leaf: 26 }), s < 0 ? "-y" : "+y", OUT + 35, 0, 0));
  }
  // drums where the broken columns fell
  out.push(drum(X0 - 60, -760, CR, 110, 20), drum(X0 + 120, -700, CR, 90, 75), drum(X0 - 160, -980, CR, 70, 50));
  out.push(drum(-70, Y - 180, CR, 120, 10), drum(60, Y - 260, CR, 100, 60));
  out.push(translate(rotateY(boxAt([CR * 3.1, CR * 3.1, 18], [0, 0, 0], "Noa_StoneLight", 2), 14), [-10, Y - 120, 10]));
  out.push(drum(330, -Y + 170, CR, 110, -30), rubble(150, 520, -Y + 60, -Y + 300, 7, 57));
  out.push(rubble(X0 - 260, X0 - 30, -1000, -650, 6, 58), rubble(-300, 160, Y - 330, Y - 80, 7, 59));
  // the dry basin in the court, grown over
  const BX = -250;
  out.push(translate(merge(
    ring(210, 16, 0, "Noa_StoneDark", 8), ring(196, 46, 16, "Noa_StoneLight", 8), ring(206, 8, 58, "Noa_Stone", 8),
    cylinderAt({ radius: 176, height: 6, segments: 8, bottom: [0, 0, 50] }, "Noa_Soil"),
    boxAt([70, 70, 60], [0, 0, 56], "Noa_Stone", 3),
    translate(rock([60, 60, 40], 0.5, 4, "Noa_StoneLight"), [0, 0, 112]),
  ), [BX, 0, 0]));
  out.push(tufts(scatter(BX - 150, BX + 150, -150, 150, 56, 22, 60), 61, 36, 0.6));
  // shrubs in the corners of the court and a young tree
  out.push(shrub({ seed: 63, density: 0.75, lobes: [[X0 + 180, -Y + 170, 70, 90, 80, 70], [X0 + 260, -Y + 110, 50, 70, 70, 50]], leaf: 24 }));
  out.push(shrub({ seed: 64, density: 0.75, lobes: [[480, Y - 180, 80, 100, 90, 80], [380, Y - 130, 55, 70, 70, 55]], leaf: 24 }));
  out.push(shrub({ seed: 65, density: 0.75, lobes: [[X0 + 140, Y - 160, 60, 70, 70, 60]], leaf: 22 }));
  out.push(shrub({ seed: 66, lobes: [[300, -420, 330, 140, 130, 110], [240, -360, 420, 100, 100, 90], [370, -480, 280, 110, 100, 90]], leaf: 34, density: 0.7, stems: { mat: "BarkWarm", r: 9, n: 3 }, core: 0.8 }));
  // ---- the throne hall ----
  const HF = PAL.X1, HD = 90, HY = 1000;
  const hall: Geo[] = [];
  // its front wall to the court: three arches; broken down toward the ends
  for (const [a, b] of [[-HY - 40, -590], [-310, -140], [140, 310], [590, HY + 40]]) hall.push(boxBounds([HF, a, 0], [HF + HD, b, 380], "Noa_Stone"));
  for (const c of [-450, 0, 450]) out.push(translate(archBay(225, 140, 380, 900, HD, { n: 9, thick: 44 }), [HF + HD / 2, c, 0]));
  for (const s of [-1, 1]) for (let y = 675; y < HY + 40; y += 40) hall.push(boxBounds([HF, s < 0 ? -y - 40 : y, 380], [HF + HD, s < 0 ? -y : y + 40, 900 - (y - 675) * 0.9 - rnd() * 60], "Noa_Stone"));
  for (let y = -600; y < 600; y += 40) hall.push(boxBounds([HF, y, 900], [HF + HD, y + 40, 900 + 160 * Math.cos((y + 20) * 0.0026) + rnd() * 50], "Noa_Stone"));
  // the side walls, broken; the back wall standing to its full height with the great niche
  for (const s of [-1, 1]) for (let x = HF + HD; x < HX1 - 80; x += 40) hall.push(boxBounds([x, s * HY - 40, 0], [x + 40, s * HY + 40, 520 + (x - HF) * (s > 0 ? 0.5 : 0.9) + rnd() * 60], "Noa_Stone"));
  hall.push(boxBounds([HX1 - 80, -HY - 40, 0], [HX1, HY + 40, 1180], "Noa_Stone"));
  for (let y = -HY - 40; y < HY + 40; y += 40) hall.push(boxBounds([HX1 - 80, y, 1180], [HX1, y + 40, 1180 + 170 * Math.cos(y * 0.0016) + rnd() * 40], "Noa_Stone"));
  out.push(wuv(merge(...hall), 1.3));
  out.push(boxBounds([HF - 8, -HY - 40, 372], [HF + HD + 8, -590, 388], "Noa_StoneLight"), boxBounds([HF - 8, 590, 372], [HF + HD + 8, HY + 40, 388], "Noa_StoneLight"));
  out.push(onFace(merge(panel(archShape(320, 640), -4, 4, "Noa_StoneDark"), arcStones([0, 0, 640], 320, 0, 180, 15, 44, 14, "Noa_StoneLight", 2), panel(circleShape(70, 0, 1090), -4, 4, "Noa_Dark")), "-x", -(HX1 - 80), 0, 0));
  for (const s of [-1, 1]) for (const x of [880, 1060]) out.push(onFace(merge(panel(archShape(50, 160, 0), -4, 4, "Noa_StoneLight"), panel(archShape(40, 160, 0), -6, 2, "Noa_Dark")), s < 0 ? "-y" : "+y", HY + 40, x, 260));
  // the dais and the broken throne, a faded red cloth over its arm
  for (let i = 0; i < 3; i++) out.push(boxBounds([960 + i * 40, -340 + i * 30, 0], [HX1 - 80, 340 - i * 30, 20 + i * 20], "Noa_StoneLight", 2));
  const TX = 1090;
  out.push(
    boxBounds([TX - 50, -70, 60], [TX + 50, 70, 120], "Noa_StoneLight", 3),
    boxBounds([TX + 30, -70, 120], [TX + 60, 70, 300], "Noa_StoneLight", 3),
    translate(rock([40, 150, 50], 0.4, 8, "Noa_StoneLight"), [TX + 45, 0, 290]),
    boxBounds([TX - 50, -86, 60], [TX + 40, -66, 180], "Noa_StoneLight", 3),
    sphereCenter(18, [TX - 54, -76, 186], "Noa_StoneLight", 8),
    boxBounds([TX - 30, 66, 60], [TX + 10, 86, 130], "Noa_StoneLight", 3),
    hullGeo([[TX - 56, -90, 190], [TX - 20, -90, 192], [TX - 60, -98, 90], [TX - 20, -94, 110], [TX - 50, -80, 194], [TX - 64, -94, 60]], "Noa_CanvasRed"),
    translate(rock([60, 50, 40], 0.5, 12, "Noa_StoneLight"), [TX - 90, 120, 60]),
  );
  // fallen roof beams, ivy down the back wall, moss
  out.push(beamBetween([HF + 160, -HY + 40, 560], [HF + 380, -HY + 420, 10], 26, 30, "Noa_Timber"), beamBetween([1150, HY - 40, 700], [900, HY - 380, 20], 24, 28, "Noa_Timber"));
  out.push(beamBetween([HF + HD + 10, 640, 860], [HX1 - 90, 640, 1000], 22, 26, "Noa_Timber"));
  out.push(onFace(ivy(-HY, -360, 1240, 900, 67, { hang: true, n: 6, leaf: 26 }), "-x", -(HX1 - 80), 0, 0), onFace(ivy(380, HY, 0, 900, 68, { n: 5, leaf: 26 }), "-x", -(HX1 - 80), 0, 0));
  out.push(onFace(ivy(-HY, HY, 0, 700, 69, { n: 9, leaf: 28 }), "+x", HX1, 0, 0));
  out.push(onFace(ivy(-HY - 40, -620, 0, 520, 70, { n: 4, leaf: 26 }), "-x", -HF, 0, 0), onFace(ivy(330, 560, 0, 500, 71, { n: 3, hang: true }), "-x", -HF, 0, 900));
  out.push(tufts(scatter(HF + 120, HX1 - 120, -HY + 80, HY - 80, 4, 16, 72), 73, 34, 0.4));
  return merge(...out);
}
// What the palace blocks (its own frame): the columns, the outer walls, the hall's walls, the
// dais and the basin; the court, the arcades and the hall stay open to walk in.
function palaceSolids(): SolidSpec[] {
  const { X0, Y, OUT, X1, HX1 } = PAL, s: SolidSpec[] = [];
  for (const y of PAL_FRONT) s.push({ kind: "column", x: X0, y, r: 52 });
  for (const sy of [-1, 1]) for (const x of PAL_SIDE.slice(1)) s.push({ kind: "column", x, y: sy * Y, r: 52 });
  for (const sy of [-1, 1]) {
    s.push({ kind: "wall", x: (X0 - 50 + X1 + 80) / 2, y: sy * OUT, w: X1 + 80 - (X0 - 50), d: 80, rot: 0 });
    s.push({ kind: "wall", x: (X1 + HX1) / 2, y: sy * 1000, w: HX1 - X1, d: 90, rot: 0 });
  }
  for (const [a, b] of [[-1040, -590], [-310, -140], [140, 310], [590, 1040]]) s.push({ kind: "wall", x: X1 + 45, y: (a + b) / 2, w: 96, d: b - a, rot: 0 });
  s.push({ kind: "wall", x: HX1 - 40, y: 0, w: 90, d: 2080, rot: 0 });
  s.push({ kind: "dais", x: (960 + HX1 - 80) / 2, y: 0, w: HX1 - 80 - 960, d: 690, rot: 0 });
  s.push({ kind: "basin", x: -250, y: 0, r: 215 });
  return s;
}

// ---- the clock tower ----
// The old town's clock tower, 6.4 m square and 28 m to its vane: a rusticated foot with an arched
// door, a tall shaft with string courses and windows, the clock stage with a dial on every side,
// an open belfry with its bell, a faded spire. Moss at its foot, ivy up one corner.
function clockTower(): Geo {
  const H = 300, out: Geo[] = [], Z1 = 440, Z2 = 1400, Z3 = 1720, Z4 = 2140;
  out.push(wuv(merge(
    boxBounds([-H - 26, -H - 26, 0], [H + 26, H + 26, 60], "Noa_StoneDark"),
    boxBounds([-H - 12, -H - 12, 60], [H + 12, H + 12, Z1], "Noa_Stone"),
    boxBounds([-H, -H, Z1], [H, H, Z2], "Noa_StoneLight"),
    boxBounds([-H - 14, -H - 14, Z2 + 26], [H + 14, H + 14, Z3], "Noa_StoneLight"),
  ), 1.3));
  for (let z = 120; z < Z1 - 20; z += 64) out.push(boxBounds([-H - 15, -H - 15, z], [H + 15, H + 15, z + 4], "Noa_StoneDark"));
  out.push(
    boxBounds([-H - 22, -H - 22, Z1 - 6], [H + 22, H + 22, Z1 + 14], "Noa_Stone", 3),
    boxBounds([-H - 8, -H - 8, 960], [H + 8, H + 8, 976], "Noa_Stone", 2),
    boxBounds([-H - 26, -H - 26, Z2], [H + 26, H + 26, Z2 + 26], "Noa_Stone", 3),
    boxBounds([-H - 30, -H - 30, Z3], [H + 30, H + 30, Z3 + 24], "Noa_Stone", 3),
    quoins(H, H, Z1 + 20, Z2, undefined, "Noa_Stone"),
  );
  for (let i = 0; i < 4; i++) out.push(rotateZ(array(boxBounds([-H - 32, -H + 20, Z2 - 40], [-H, -H + 56, Z2], "Noa_Stone", 1.5), 7, [0, 88, 0]), i * 90));
  // the door and the windows on every face
  out.push(onFace(doorGeo(150, 290, { arch: true, double: true }), "-x", H + 12, 0, 0));
  out.push(onFace(merge(panel(rectShape(80, 30, 0), -6, 6, "Noa_StoneLight"), panel(rectShape(70, 22, 4), -8, 2, "Noa_PaintBlue")), "-x", H + 12, 0, 340));
  for (const f of ["-x", "+x", "-y", "+y"] as const) {
    if (f !== "-x") out.push(onFace(windowGeo(70, 120, { arch: true, bars: true }), f, H + 12, 0, 160));
    out.push(onFace(slitGeo(110), f, H, 0, 640));
    out.push(onFace(windowGeo(90, 220, { arch: true }), f, H, 0, 1120));
    out.push(onFace(clockFace(118), f, H + 14, 0, Z2 + 180));
    out.push(onFace(boxBounds([-14, -150, -8], [0, 150, 8], "Noa_Stone"), f, H + 14, 0, Z2 + 40));
  }
  // the belfry: four corner piers, open arches, the bell; a cornice and the spire
  for (const [sx, sy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) out.push(wuv(boxBounds([sx < 0 ? -H : H - 90, sy < 0 ? -H : H - 90, Z3 + 24], [sx < 0 ? -H + 90 : H, sy < 0 ? -H + 90 : H, Z4], "Noa_StoneLight"), 1.3));
  for (let i = 0; i < 4; i++) out.push(rotateZ(translate(archBay(H, H - 90, Z3 + 110, Z4, 70, { n: 11, thick: 34 }), [-H + 35, 0, 0]), i * 90));
  for (let i = 0; i < 4; i++) out.push(rotateZ(boxBounds([-H - 4, -H + 90, Z3 + 24], [-H + 70, H - 90, Z3 + 110], "Noa_StoneLight", 2), i * 90));
  out.push(beamBetween([0, -H + 60, Z4 - 60], [0, H - 60, Z4 - 60], 22, 26, "Noa_Timber"), translate(bell(80), [0, 0, Z4 - 74]));
  out.push(boxBounds([-H - 30, -H - 30, Z4], [H + 30, H + 30, Z4 + 30], "Noa_Stone", 3));
  out.push(rotateZ(cylinderAt({ rBot: (H + 40) * Math.SQRT2, rTop: 6, height: 560, segments: 4, bottom: [0, 0, Z4 + 30] }, "Noa_RoofBlue"), 45));
  out.push(cylinderBetween([0, 0, Z4 + 540], [0, 0, Z4 + 740], 3, 6, "IronDark"), sphereCenter(10, [0, 0, Z4 + 580], "Noa_Gilt", 8));
  out.push(translate(rotateZ(merge(boxBounds([-2, -60, -12], [2, 50, 12], "IronDark"), hullGeo([[0, 50, -22], [0, 50, 22], [0, 78, 0], [2, 50, 0]], "IronDark")), 25), [0, 0, Z4 + 690]));
  for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) out.push(beamBetween([0, 0, Z4 + 650], [a * 40, b * 40, Z4 + 650], 2, 2, "IronDark"));
  // age: moss round the foot, ivy up the south-west corner, grass at the footing
  for (const f of ["-x", "+x", "-y", "+y"] as const) out.push(onFace(mossStain(f === "-x" ? 220 : 0, 110, 190, 70, f.length + f.charCodeAt(1)), f, H + 12, 0, 0));
  out.push(onFace(ivy(H - 160, H + 12, 60, 1100, 81, { n: 4 }), "-x", H + 12, 0, 0), onFace(ivy(-H - 12, -H + 140, 60, 900, 82, { n: 3 }), "-y", H + 12, 0, 0));
  out.push(tufts(scatter(-H - 60, H + 60, -H - 60, H + 60, 0, 30, 83).filter(([x, y]) => Math.max(Math.abs(x), Math.abs(y)) > H + 30), 84, 28, 0.3));
  return merge(...out);
}

// ---- the first king ----
// The first king of the land in bronze gone green, crowned and bearded, cloaked to his feet, his
// hands folded on the pommel of a great sword standing point down before him; on a tall stepped
// plinth with a bronze tablet, the bronze's run-off streaking the stone, a wreath at its foot.
function kingStatue(): Geo {
  const Z = 0, ZP = 380, M = "Noa_Verdigris", MD = "Noa_VerdigrisDark", out: Geo[] = [], fig: Geo[] = [];
  out.push(
    boxAt([460, 460, 22], [0, 0, 0], "Noa_StoneDark", 4),
    boxAt([400, 400, 24], [0, 0, 22], "Noa_Stone", 3),
    wuv(boxAt([290, 290, 270], [0, 0, 46], "Noa_StoneLight", 2)),
    boxAt([330, 330, 24], [0, 0, 316], "Noa_Stone", 3),
    boxAt([300, 300, 40], [0, 0, 340], "Noa_StoneLight", 2),
  );
  // the tablet, its lines of letters, a wreath of faded flowers on the step
  out.push(onFace(merge(panel(rectShape(80, 120, 0), -3, 3, M), ...[22, 44, 66, 88].map((z) => panel(rectShape(z === 22 ? 40 : 62, z + 6, z), -4, 1, MD))), "-x", 145, 0, 100));
  const wreath = new Cards(), wr = rng(3);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    flowerClump(wreath, [-172 + Math.cos(a) * 26, Math.sin(a) * 26, 46], 22, 14, [FC.daisy, FC.roseRed, FC.lavender], 1, wr, [Math.cos(a), Math.sin(a)]);
  }
  out.push(wreath.geo());
  // streaks of green where the rain runs off the bronze
  for (const f of ["-x", "+x", "-y", "+y"] as const) for (const u of [-70, 40]) out.push(onFace(panel(blobShape(u, 240, 14, 70, u + f.charCodeAt(1)), -1, 1, MD), f, 145, 0, 0));
  for (const f of ["-x", "+x", "-y", "+y"] as const) out.push(onFace(mossStain(0, 30, 170, 26, f.charCodeAt(1) + 7, "Noa_MossCap"), f, 200, 0, 22));
  // the figure (built life-size on z = 0, then raised onto the plinth a third bigger): robe to
  // the feet, belt, cloak behind, shoulders, head, beard, crown
  fig.push(
    scale(cylinderAt({ rBot: 64, rTop: 47, height: 112, segments: 12, bottom: [0, 0, Z] }, M), [0.9, 1, 1], [0, 0, 0]),
    scale(cylinderAt({ rBot: 47, rTop: 45, height: 70, segments: 12, bottom: [0, 0, Z + 112] }, M), [0.8, 1, 1], [0, 0, 0]),
    translate(scale(torus(42, 5, 14, 5, "Noa_Gilt"), [0.82, 1, 1], [0, 0, 0]), [0, 0, Z + 118]),
    hullGeo([[8, -46, Z + 184], [8, 46, Z + 184], [22, -50, Z + 186], [22, 50, Z + 186], [52, -76, Z + 4], [52, 76, Z + 4], [70, -66, Z + 4], [70, 66, Z + 4], [40, 0, Z + 4]], MD),
    sphereCenter(23, [0, -44, Z + 176], M, 10),
    sphereCenter(23, [0, 44, Z + 176], M, 10),
    cylinderAt({ radius: 11, height: 16, segments: 8, bottom: [0, 0, Z + 182] }, M),
    sphereCenter(23, [-2, 0, Z + 214], M, 10),
    scale(sphereCenter(16, [-16, 0, Z + 198], MD, 8), [0.7, 1, 1.35], [-16, 0, Z + 198]),
    cylinderAt({ rBot: 22, rTop: 25, height: 14, segments: 12, bottom: [0, 0, Z + 226] }, "Noa_Gilt"),
  );
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    fig.push(cylinderAt({ rBot: 6, rTop: 0.5, height: 16, segments: 4, bottom: [Math.cos(a) * 22, Math.sin(a) * 22, Z + 240] }, "Noa_Gilt"));
  }
  fig.push(sphereCenter(4, [-25, 0, Z + 233], "Noa_Ruby", 6));
  // the arms down to the hands on the pommel, the sword point down on the plinth
  for (const s of [-1, 1]) {
    fig.push(cylinderBetween([0, s * 46, Z + 176], [-22, s * 42, Z + 132], 12, 8, M), cylinderBetween([-22, s * 42, Z + 132], [-50, s * 12, Z + 128], 10, 8, M));
    fig.push(sphereCenter(11, [-54, s * 8, Z + 128], M, 8));
  }
  fig.push(
    boxBounds([-58, -6, Z + 4], [-52, 6, Z + 102], "Noa_StoneLight"),
    translate(scale(cylinderAt({ rBot: 6, rTop: 0.5, height: 18, segments: 4, bottom: [0, 0, -18] }, "Noa_StoneLight"), [0.4, 1, 1]), [-55, 0, Z + 20]),
    boxBounds([-62, -28, Z + 102], [-48, 28, Z + 112], M, 1),
    boxBounds([-59, -5, Z + 112], [-51, 5, Z + 140], MD),
    sphereCenter(9, [-55, 0, Z + 146], "Noa_Gilt", 8),
  );
  out.push(translate(scale(merge(...fig), [1.35, 1.35, 1.35]), [0, 0, ZP]));
  return merge(...out);
}

// ---- the archive ----
// The archive hall (the old royal library), 14 x 15.5 m on a podium: a portico of six columns
// under a pediment with an open book carved in it, an inscription along the frieze, bronze
// doors between niches with scholars in them, tall arched windows down the sides, a faded roof
// with an octagonal lantern over the reading room. Moss on the steps, ivy up one side.
function archiveHall(): Geo {
  const HX = 520, HY = 680, PX = 300, Z0 = 90, E = 980, out: Geo[] = [];
  const FX = -HX - PX; // the portico's front
  out.push(wuv(merge(boxBounds([FX - 20, -HY - 20, 0], [HX + 20, HY + 20, Z0], "Noa_StoneDark"), boxBounds([-HX, -HY, Z0], [HX, HY, E], "Noa_StoneLight")), 1.3));
  out.push(boxBounds([FX - 28, -HY - 28, Z0 - 14], [HX + 28, HY + 28, Z0], "Noa_Stone", 3));
  for (let i = 0; i < 5; i++) out.push(boxBounds([FX - 20 - (5 - i) * 40, -HY + 60, i * 18], [FX - 20, HY - 60, (i + 1) * 18], i % 2 ? "Noa_StoneLight" : "Noa_Stone", 2));
  for (let i = 0; i < 5; i++) out.push(flatPatch(FX - 40 - (4 - i) * 40, -420 + ((i * 197) % 700), 34, 70, 91 + i, (i + 1) * 18));
  out.push(tufts(scatter(FX - 220, FX - 30, -HY + 70, HY - 70, 0, 14, 92), 93, 22, 0.2));
  // the walls: string course, cornice, pilasters between the windows
  out.push(boxBounds([-HX - 10, -HY - 10, Z0 + 110], [HX + 10, HY + 10, Z0 + 126], "Noa_Stone", 2));
  out.push(boxBounds([-HX - 20, -HY - 20, E - 30], [HX + 20, HY + 20, E], "Noa_Stone", 3));
  for (const s of [-1, 1]) for (const x of [-450, -270, -90, 90, 270, 450]) out.push(boxBounds([x - 24, s < 0 ? -HY - 12 : HY, Z0], [x + 24, s < 0 ? -HY : HY + 12, E - 30], "Noa_Stone"));
  for (const f of ["-y", "+y"] as const) for (const x of [-360, -180, 0, 180, 360]) out.push(onFace(windowGeo(100, 440, { arch: true, bars: true }), f, HY, x, Z0 + 150));
  for (const y of [-400, 0, 400]) out.push(onFace(windowGeo(100, 380, { arch: true, bars: true }), "+x", HX, y, Z0 + 180));
  // the portico: columns, the entablature with its inscription, the pediment over it all
  for (const y of [-600, -360, -120, 120, 360, 600]) out.push(translate(column(42, E - 120 - Z0 - 36), [FX + 50, y, Z0]));
  out.push(
    boxBounds([FX - 20, -HY - 20, E - 120], [-HX, HY + 20, E - 30], "Noa_StoneLight", 2),
    boxBounds([FX, -HY, E - 34], [-HX, HY, E - 30], "Noa_Stone"),
    boxBounds([FX - 24, -HY - 24, E - 70], [FX - 20, HY + 24, E - 64], "Noa_Stone"),
  );
  for (let i = 0; i < 18; i++) out.push(boxBounds([FX - 23, -360 + i * 40, E - 104], [FX - 20, -360 + i * 40 + (i % 4 === 3 ? 14 : 30), E - 84], "Noa_Dark"));
  const PH = 380;
  out.push(gableRoof([HX - FX + 40, 2 * HY, 24], [(FX + HX) / 2, 0, E], PH, 30, "Noa_RoofBlue"));
  out.push(ridge([FX - 50, 0, E + PH + 32], [HX + 50, 0, E + PH + 32], 12));
  out.push(wuv(merge(gableWall(FX - 20, HY + 20, E, PH - 6, "Noa_StoneLight"), gableWall(HX, HY, E, PH - 6, "Noa_StoneLight")), 1.3));
  for (const s of [-1, 1]) out.push(beamBetween([FX - 26, s * (HY + 40), E - 6], [FX - 26, 0, E + PH + 10], 14, 26, "Noa_Stone"));
  // in the tympanum: an open book
  out.push(translate(merge(
    rotateX(boxBounds([-6, 0, -4], [0, 130, 90], "Noa_StoneLight"), -14),
    rotateX(boxBounds([-6, -130, -4], [0, 0, 90], "Noa_StoneLight"), 14),
    ...[18, 36, 54].map((z) => rotateX(boxBounds([-7, 16, z], [-5, 110, z + 4], "Noa_Stone"), -14)),
    ...[18, 36, 54].map((z) => rotateX(boxBounds([-7, -110, z], [-5, -16, z + 4], "Noa_Stone"), 14)),
  ), [FX - 22, 0, E + 70]));
  for (const s of [-1, 1]) out.push(translate(amphora(90, false, "Noa_StoneLight"), [FX - 10, s * (HY + 10), E + 6]));
  out.push(translate(amphora(90, false, "Noa_StoneLight"), [FX - 10, 0, E + PH + 30]));
  // the doors and the niches with their scholars
  out.push(onFace(doorGeo(200, 400, { arch: true, double: true, wood: "Noa_VerdigrisDark" }), "-x", HX, 0, Z0));
  for (const s of [-1, 1]) {
    const scholar = merge(
      panel(archShape(52, 210, -10), -6, 6, "Noa_Stone"), panel(archShape(42, 210, 0), -7, 1, "Noa_Dark"),
      boxBounds([-40, -40, -10], [0, 40, 0], "Noa_Stone"),
      cylinderAt({ rBot: 30, rTop: 22, height: 150, segments: 10, bottom: [-22, 0, 0] }, "Noa_StoneLight"),
      sphereCenter(18, [-22, 0, 168], "Noa_StoneLight", 8),
      boxBounds([-52, -20, 96], [-36, 20, 124], "Noa_StoneLight", 2),
    );
    out.push(onFace(scholar, "-x", HX, s * 420, Z0 + 90));
    out.push(onFace(wallLantern(), "-x", HX, s * 190, Z0 + 330));
  }
  // the lantern over the reading room
  const LZ = E + PH * 0.78;
  out.push(translate(merge(
    ring(190, 160, LZ - 120, "Noa_StoneLight", 8), ring(200, 16, LZ + 40, "Noa_Stone", 8),
    ring(170, 190, LZ + 56, "Noa_StoneLight", 8), ring(186, 18, LZ + 246, "Noa_Stone", 8),
    ring(196, 210, LZ + 264, "Noa_RoofBlue", 8, 14), sphereCenter(16, [0, 0, LZ + 486], "Noa_Gilt", 8),
    ...Array.from({ length: 8 }, (_, i) => onRound(windowGeo(56, 110, { arch: true, frame: "Noa_Stone" }), 170 * Math.cos(Math.PI / 8), i * 45 + 22.5, LZ + 90)),
  ), [140, 0, 0]));
  // age
  out.push(onFace(ivy(-HX + 40, 300, Z0, 760, 95, { n: 12 }), "+y", HY + 12, 0, 0));
  out.push(onFace(mossStain(-200, Z0 + 40, 300, 50, 96), "-y", HY + 12, 0, 0), onFace(mossStain(100, Z0 + 30, 260, 40, 97), "+x", HX + 20, 0, 0));
  return merge(...out);
}

// ---- old townhouses (terraces: flush side walls at ±Y) ----
// A three-storey townhouse of the old town, 8 m wide: the ground storey of mossy stone with an
// arched door and a barred window, faded plaster above where patches have fallen from the brick,
// shutters with the paint worn off (one hanging by a hinge), a box of flowers, ivy climbing the
// front to the eaves, a roof of bleached tiles going green, a dormer and a chimney.
function oldTownhouse(): Geo {
  const HX = 380, HY = 400, G = 330, F2 = 630, E = 930, RH = 300, P = 4, out: Geo[] = [];
  const on = placer(out, HX, HY, G, P);
  out.push(houseBody(HX, HY, G, E, [F2], { flush: true }));
  on(doorGeo(130, 250, { arch: true }), "-x", -240, 0);
  on(windowGeo(150, 170, { bars: true }), "-x", 150, 90);
  on(wallLantern(), "-x", -340, 290);
  on(windowGeo(90, 160, { shutters: "Noa_Shutter" }), "-x", -250, G + 56);
  on(windowGeo(90, 160, { shutters: "Noa_Shutter", flowers: 2 }), "-x", 0, G + 56);
  on(windowGeo(90, 160, { shutters: "Noa_Shutter", askew: true }), "-x", 250, G + 56);
  for (const u of [-250, 0, 250]) on(windowGeo(80, 140, { shutters: "Noa_Shutter" }), "-x", u, F2 + 44);
  on(bareBrick(-130, G + 230, 50, 40, 3), "-x", 0, 0);
  on(bareBrick(140, F2 + 210, 40, 30, 4), "-x", 0, 0);
  on(mossStain(60, 70, 260, 40, 5), "-x", 0, 0);
  on(ivy(260, 392, 44, 860, 6, { n: 4 }), "-x", 0, 0);
  // the back
  on(doorGeo(110, 230), "+x", 200, 0);
  on(windowGeo(100, 140), "+x", -150, 90);
  for (const z of [G + 56, F2 + 44]) for (const u of [-200, 200]) on(windowGeo(90, 150, { shutters: "Noa_Shutter" }), "+x", u, z);
  on(bareBrick(0, G + 120, 60, 40, 8), "+x", 0, 0);
  // the roof, ridge along Y
  out.push(rotateZ(roofX(HY, HX, E, RH, { ovx: 0, ovy: 34, gx: HY, gw: HX - 4, moss: 4, seed: 9 }), 90));
  out.push(dormer(-260, 120, E + 60, 150, 190, 150), chimney(140, -250, E + 80, E + 420));
  return merge(...out);
}
// A narrow old house, 5.2 m wide, its gable to the street: a shop front under a faded awning
// with a hanging sign (a jug), plaster faded ochre, and a top storey of old timber framing jutting
// out over the street; the gable timbered too.
function oldTownhouseNarrow(): Geo {
  const HX = 380, HY = 260, G = 330, F2 = 640, E = 940, RH = 400, P = 4, J = 34, out: Geo[] = [];
  const on = placer(out, HX, HY, G, P);
  out.push(houseBody(HX, HY, G, F2, [], { flush: true, wall: "Noa_PlasterOchre" }));
  on(windowGeo(170, 170), "-x", -60, 70);
  on(doorGeo(90, 236, { arch: true }), "-x", 160, 0);
  out.push(translate(awning(210, 90, 34, "Noa_CanvasRed", "Noa_Canvas"), [-HX, -60, 306]));
  const jug = merge(cylinderAt({ rBot: 12, rTop: 16, height: 24, segments: 10, bottom: [0, 0, -22] }, "Noa_Clay"), cylinderAt({ rBot: 16, rTop: 8, height: 14, segments: 10, bottom: [0, 0, 2] }, "Noa_Clay"), translate(rotateX(torus(9, 2.2, 10, 4, "Noa_Clay"), 90), [0, 17, -4]));
  on(hangingSign(jug, { bw: 70, bh: 70, board: "Noa_CanvasGreen" }), "-x", 210, 300);
  on(windowGeo(80, 160, { shutters: "Noa_ShutterBlue", flowers: 1 }), "-x", -100, G + 50);
  on(windowGeo(80, 160, { shutters: "Noa_ShutterBlue" }), "-x", 110, G + 50);
  on(bareBrick(0, G + 240, 36, 28, 11), "-x", 0, 0);
  // the jettied top storey: plaster between old beams, out over the street
  const jet: Geo[] = [
    boxBounds([-HX - J + 4, -HY, F2], [HX + J - 4, HY, E], "Noa_PlasterOchre"),
    boxBounds([-HX - J - 6, -HY, F2 - 22], [HX + J + 6, HY, F2 + 4], "Noa_Timber"),
    boxBounds([-HX - J - 8, -HY, E - 14], [HX + J + 8, HY, E + 4], "Noa_Timber"),
  ];
  for (const s of [-1, 1]) {
    for (const y of [-HY + 8, -90, 90, HY - 8]) jet.push(boxBounds([s < 0 ? -HX - J : HX + J - 8, y - 8, F2], [s < 0 ? -HX - J + 8 : HX + J, y + 8, E], "Noa_Timber"));
    jet.push(boxBounds([s < 0 ? -HX - J : HX + J - 8, -HY, F2 + 140], [s < 0 ? -HX - J + 8 : HX + J, HY, F2 + 152], "Noa_Timber"));
    for (const y of [-HY + 8, HY - 8]) jet.push(beamBetween([s * (HX + J - 4), y, F2 + 140], [s * (HX + J - 4), y * 0.4, E - 10], 12, 8, "Noa_Timber"));
    for (const y of [-200, 0, 200]) jet.push(beamBetween([s * (HX - 10), y, F2 - 70], [s * (HX + J), y, F2 - 18], 10, 12, "Noa_Timber"));
  }
  out.push(merge(...jet));
  for (const f of ["-x", "+x"] as const) out.push(onFace(windowGeo(110, 110, { frame: "Noa_Timber", flowers: f === "-x" ? 4 : undefined }), f, HX + J - 4, 0, F2 + 160));
  // the gable, timbered to the ridge
  out.push(roofX(HX + J, HY, E, RH, { ovx: 24, ovy: 0, gx: HX + J - 4, gw: HY, wall: "Noa_PlasterOchre", mat: "Noa_RoofMoss", moss: 3, seed: 12 }));
  for (const s of [-1, 1]) {
    const x = s * (HX + J - 2);
    out.push(beamBetween([x, -HY + 10, E + 6], [x, 0, E + RH - 30], 12, 8, "Noa_Timber"), beamBetween([x, HY - 10, E + 6], [x, 0, E + RH - 30], 12, 8, "Noa_Timber"));
    out.push(beamBetween([x, -HY * 0.6, E + RH * 0.38], [x, HY * 0.6, E + RH * 0.38], 12, 8, "Noa_Timber"));
  }
  out.push(onFace(windowGeo(60, 70, { frame: "Noa_Timber" }), "-x", HX + J - 2, 0, E + 30));
  // the back, and age
  on(doorGeo(100, 230), "+x", -120, 0);
  on(windowGeo(90, 140), "+x", 100, 100);
  on(windowGeo(80, 150, { shutters: "Noa_ShutterBlue" }), "+x", 0, G + 50);
  on(mossStain(-150, 60, 120, 40, 13), "-x", 0, 0);
  out.push(chimney(160, 140, E + 100, E + 470));
  return merge(...out);
}

// ---- the caravan inn ----
// The inn where the caravans stop, 14 x 9 m, two storeys: a timber gallery along the upper
// floor on posts (the porch beneath for the carters), the double door under a sign with a cart
// wheel, the wagon arch at the end with its stable doors, barrels, crates, sacks and a water
// trough, a roof of faded tiles with dormers and two chimneys.
function caravanInn(): Geo {
  const HX = 450, HY = 700, G = 340, E = 720, RH = 400, P = 4, GX = 170, out: Geo[] = [];
  const on = placer(out, HX, HY, G, P);
  out.push(houseBody(HX, HY, G, E, [], { wall: "Noa_PlasterOchre" }), quoins(HX - P, HY - P, G + 16, E - 24));
  // ground floor front: door, windows, the wagon arch at the +Y end
  on(doorGeo(160, 260, { arch: true, double: true }), "-x", -120, 0);
  for (const u of [-470, 160]) on(windowGeo(130, 150, { shutters: "Noa_Shutter" }), "-x", u, 90);
  on(doorGeo(300, 330, { arch: true, double: true, wood: "Noa_Timber" }), "-x", 500, 0);
  // the gallery: posts, the deck at the upper floor, its rail, a lean-to roof over it
  const gal: Geo[] = [];
  for (let y = -HY + 20; y <= 300; y += 160) {
    gal.push(boxBounds([-HX - GX - 10, y - 10, 0], [-HX - GX + 10, y + 10, E - 120], "Noa_Timber", 1.5));
    gal.push(boxBounds([-HX - GX - 14, y - 14, 0], [-HX - GX + 14, y + 14, 20], "Noa_StoneDark", 2));
    gal.push(beamBetween([-HX - GX, y, G - 60], [-HX - GX + 60, y, G - 4], 8, 8, "Noa_Timber"));
  }
  gal.push(
    boxBounds([-HX - GX - 14, -HY + 4, G - 4], [-HX, 314, G + 14], "Noa_Timber"),
    boxBounds([-HX - GX - 16, -HY + 4, G + 96], [-HX - GX + 6, 314, G + 104], "Noa_Timber"),
    array(boxAt([5, 5, 82], [-HX - GX - 5, -HY + 20, G + 14], "Noa_Timber"), Math.floor((314 + HY - 20) / 22), [0, 22, 0]),
  );
  out.push(merge(...gal));
  {
    const len = Math.hypot(GX + 40, 100), ang = Math.atan2(100, GX + 40) / D;
    out.push(translate(rotateY(merge(box([len, HY + 330, 12], [-len / 2, 0, 6], "Noa_RoofFaded"), box([60, 180, 2], [-len / 2, -200, 13], "Noa_MossCap")), -ang), [-HX + P, (-HY + 330) / 2 + 2, E - 30]));
  }
  for (const u of [-400, -120, 160]) on(doorGeo(100, 220, { frame: "Noa_Timber", step: false }), "-x", u, G + 14);
  on(windowGeo(90, 140, { shutters: "Noa_Shutter", flowers: 5 }), "-x", -560, G + 70);
  on(windowGeo(90, 140, { shutters: "Noa_Shutter" }), "-x", 20, G + 70);
  on(windowGeo(90, 150, { shutters: "Noa_Shutter", flowers: 2 }), "-x", 500, G + 70);
  // the sign: a cart wheel on a board
  const wheel = merge(torus(26, 4, 16, 5, "Noa_Timber"), cylinderAt({ radius: 7, height: 8, segments: 8, bottom: [0, 0, -4] }, "IronDark"), ...[0, 45, 90, 135].map((a) => rotateZ(boxBounds([-26, -2, -2], [26, 2, 2], "Noa_Timber"), a)));
  on(hangingSign(rotateX(wheel, 90), { len: 160, bw: 100, bh: 90, board: "Noa_CanvasRed" }), "-x", 680, 560);
  for (const u of [-300, 60]) on(wallLantern(), "-x", u, 290);
  // the ends, the back
  for (const f of ["-y", "+y"] as const) {
    on(windowGeo(100, 140, { shutters: "Noa_Shutter" }), f, -200, 100);
    on(windowGeo(90, 150, { shutters: "Noa_Shutter" }), f, 200, G + 70);
    on(mossStain(0, 60, 300, 40, f.charCodeAt(1)), f, 0, 0);
  }
  on(doorGeo(110, 230), "+x", 300, 0);
  for (const u of [-450, -150, 150, 450]) on(windowGeo(90, 150, { shutters: "Noa_Shutter" }), "+x", u, G + 70);
  for (const u of [-300, 0]) on(windowGeo(110, 140), "+x", u, 90);
  // roof: ridge along Y, dormers, chimneys
  out.push(rotateZ(roofX(HY, HX, E, RH, { ovx: 30, ovy: 36, gx: HY - P, gw: HX - P, wall: "Noa_PlasterOchre", moss: 5, seed: 21 }), 90));
  for (const y of [-400, 0, 400]) out.push(dormer(-330, y, E + 90, 150, 200, 150));
  out.push(chimney(150, -480, E + 100, E + 540), chimney(150, 420, E + 100, E + 500));
  // the yard things at the front
  for (const [x, y] of [[-HX - 60, -620], [-HX - 60, -560], [-HX - 100, -590]]) out.push(translate(barrel(), [x, y, 0]));
  out.push(translate(crate(70, 70, 60), [-HX - 70, 260, 0]), translate(rotateZ(crate(60, 60, 50), 20), [-HX - 80, 270, 60]), translate(sack(26), [-HX - 120, 200, 0]), translate(sack(24, "Noa_Canvas"), [-HX - 60, 190, 0]));
  out.push(translate(merge(boxAt([60, 200, 50], [0, 0, 0], "Noa_Timber", 2), boxAt([48, 186, 2], [0, 0, 44], "Noa_Water")), [-HX - GX - 60, 120, 0]));
  out.push(translate(merge(boxAt([70, 170, 46], [0, 0, 0], "Noa_Hay", 4), boxAt([70, 110, 40], [0, -20, 46], "Noa_Hay", 4)), [-HX - 50, 600, 0]));
  out.push(onFace(ivy(-300, 160, 44, 600, 23, { n: 6 }), "-y", HY, 0, 0));
  return merge(...out);
}

// ---- in the streets ----
// The old fountain: a low eight-sided basin with a rim broken in one place and mended with moss,
// green water, a pillar with four lion masks spouting into it, a mossy bowl and a stone pine cone
// on top.
function oldFountain(): Geo {
  const out: Geo[] = [], rx = 300 * Math.cos(22.5 * D), ry = 300 * Math.sin(22.5 * D);
  out.push(ring(330, 16, 0, "Noa_StoneDark", 8), ring(300, 54, 16, "Noa_Stone", 8), ring(276, 2, 70, "Noa_Water", 8));
  for (let k = 0; k < 8; k++) {
    if (k === 5) out.push(rotateZ(merge(boxBounds([rx - 30, -ry - 6, 58], [rx + 4, -ry * 0.2, 70], "Noa_StoneLight", 2), boxBounds([rx - 28, ry * 0.3, 58], [rx + 4, ry + 6, 66], "Noa_StoneLight", 2), boxBounds([rx - 26, -ry * 0.2, 56], [rx, ry * 0.3, 62], "Noa_MossCap")), k * 45));
    else out.push(rotateZ(boxBounds([rx - 30, -ry - 6, 66], [rx + 6, ry + 6, 82], "Noa_StoneLight", 2), k * 45));
    if (k % 2 === 0) out.push(rotateZ(boxBounds([rx - 24, -ry * 0.6, 82], [rx - 2, -ry * 0.1, 84], "Noa_MossCap"), k * 45));
  }
  for (let k = 0; k < 8; k++) out.push(rotateZ(onFace(mossStain(0, 30, 70, 20, k + 3, k % 2 ? "Noa_Moss" : "Noa_MossCap"), "-x", rx + 0.5, 0, 16), k * 45));
  out.push(ring(70, 30, 60, "Noa_StoneDark", 8), ring(56, 150, 90, "Noa_Stone", 8), ring(64, 14, 240, "Noa_StoneLight", 8));
  for (let k = 0; k < 4; k++) {
    const mask = merge(
      sphereCenter(20, [-4, 0, 0], "Noa_Verdigris", 8),
      sphereCenter(9, [-20, 0, -6], "Noa_VerdigrisDark", 6),
      ...[-1, 1].map((s) => sphereCenter(6, [-14, s * 10, 8], "Noa_VerdigrisDark", 6)),
      cylinderBetween([-24, 0, -8], [-90, 0, -60], 3.5, 5, "Noa_Spray", 7),
      cylinderBetween([-90, 0, -60], [-120, 0, -96], 7, 5, "Noa_Spray", 10),
    );
    out.push(rotateZ(translate(mask, [-56 * Math.cos(22.5 * D) - 2, 0, 170]), k * 90));
  }
  out.push(
    cylinderAt({ rBot: 50, rTop: 120, height: 36, segments: 16, bottom: [0, 0, 254] }, "Noa_StoneLight"),
    translate(torus(120, 6, 20, 5, "Noa_Stone"), [0, 0, 290]),
    cylinderAt({ radius: 114, height: 2, segments: 16, bottom: [0, 0, 286] }, "Noa_Water"),
    translate(torus(98, 10, 20, 5, "Noa_MossCap"), [0, 0, 292]),
    ring(22, 50, 288, "Noa_Stone", 8),
    scale(sphereCenter(26, [0, 0, 360], "Noa_StoneLight", 10), [1, 1, 1.5], [0, 0, 360]),
    translate(torus(130, 4, 24, 5, "Noa_Spray"), [0, 0, 64]),
  );
  for (let k = 0; k < 10; k++) {
    const a = k * 36 * D;
    out.push(cylinderBetween([118 * Math.cos(a), 118 * Math.sin(a), 290], [146 * Math.cos(a), 146 * Math.sin(a), 64], 3, 5, "Noa_Spray", 4));
  }
  out.push(tufts(scatter(-340, 340, -340, 340, 0, 26, 7).filter(([x, y]) => Math.hypot(x, y) > 318), 8, 26, 0.35));
  return merge(...out);
}

// A market stall of the old kind: a stone counter and a timber frame under a little roof of old
// tiles, loaves, cheeses and jars on the counter, baskets on the ground, a lantern hung under the
// eaves.
function stallOld(): Geo {
  const out: Geo[] = [
    wuv(boxBounds([-100, -140, 0], [-36, 140, 86], "Noa_Stone", 2)),
    boxBounds([-108, -148, 86], [-28, 148, 96], "Noa_StoneLight", 2),
    boxBounds([40, -130, 0], [92, 130, 72], "Noa_Timber", 2),
    boxBounds([36, -134, 72], [96, 134, 78], "WoodPale", 1.5),
  ];
  for (const x of [-104, 96]) for (const y of [-142, 142]) out.push(boxBounds([x - 7, y - 7, 0], [x + 7, y + 7, x < 0 ? 250 : 290], "Noa_Timber", 1.5));
  for (const y of [-142, 142]) out.push(boxBounds([-112, y - 6, 246], [104, y + 6, 258], "Noa_Timber"), beamBetween([-104, y, 196], [-60, y, 250], 6, 6, "Noa_Timber"));
  for (const x of [-104, 96]) out.push(boxBounds([x - 6, -150, x < 0 ? 244 : 284], [x + 6, 150, x < 0 ? 256 : 296], "Noa_Timber"));
  // a lean-to of tiles sloping to the front
  {
    const run = 240, rise = 46, len = Math.hypot(run, rise), ang = Math.atan2(rise, run) / D;
    out.push(translate(rotateY(merge(box([len, 330, 10], [-len / 2, 0, 5], "Noa_RoofFaded"), box([70, 90, 1.5], [-len * 0.6, 60, 10.6], "Noa_MossCap")), -ang), [118, 0, 300]));
  }
  // the goods
  const rnd = rng(4);
  for (let i = 0; i < 6; i++) out.push(scale(sphereCenter(14, [-70 + (i % 2) * 22, -110 + i * 20, 104], "Noa_Bread", 8), [1.4, 0.8, 0.6], [-70 + (i % 2) * 22, -110 + i * 20, 98]));
  for (let i = 0; i < 3; i++) out.push(cylinderAt({ radius: 22, height: 14, segments: 12, bottom: [-64, 40 + i * 6, 96 + i * 14] }, "Noa_Cheese"));
  for (let i = 0; i < 3; i++) out.push(translate(amphora(34 + rnd() * 10, true), [-60, 100 + (i - 1) * 24, 96]));
  for (let i = 0; i < 4; i++) out.push(translate(amphora(50 + rnd() * 16, i % 2 === 1), [66, -100 + i * 64, 78]));
  for (const [x, y] of [[-150, -110], [-150, 120]]) out.push(cylinderAt({ rBot: 24, rTop: 30, height: 30, segments: 10, bottom: [x, y, 0] }, "BambooDry"), ...Array.from({ length: 5 }, (_, k) => sphereCenter(8, [x + Math.cos(k * 1.3) * 12, y + Math.sin(k * 1.3) * 12, 32], k % 2 ? "Noa_Apple" : "Noa_Pear", 6)));
  out.push(translate(lantern(), [-60, 0, 196]), cylinderBetween([-60, 0, 240], [-60, 0, 252], 1, 4, "IronDark"));
  return merge(...out);
}
// A stall under a patched canvas awning on poles: rolled rugs and cloth on the counter, pots and
// amphorae of every size in front.
function stallCanvas(): Geo {
  const out: Geo[] = [
    boxBounds([-92, -125, 0], [-30, 125, 84], "Noa_Timber", 2),
    boxBounds([-100, -132, 84], [-24, 132, 92], "WoodPale", 1.5),
    boxBounds([40, -120, 0], [90, 120, 66], "WoodShade", 2),
    translate(awning(272, 232, 54, "Noa_Canvas", "Noa_CanvasRed", false), [104, 0, 272]),
  ];
  for (const y of [-128, 128]) {
    out.push(boxBounds([-104, y - 5, 0], [-94, y + 5, 226], "Noa_Timber", 1), boxBounds([94, y - 5, 0], [104, y + 5, 270], "Noa_Timber", 1));
    out.push(beamBetween([-99, y, 200], [99, y, 246], 5, 6, "Noa_Timber"));
  }
  const cloth = ["Noa_CanvasRed", "Noa_CanvasBlue", "Noa_CanvasGreen", "FabricGold", "Noa_Canvas", "FabricPurple"];
  cloth.forEach((m, i) => out.push(cylinderBetween([-90, -100 + i * 40, 104], [-34, -100 + i * 40, 104], 12, 8, m)));
  for (let i = 0; i < 3; i++) out.push(boxBounds([44, -100 + i * 70, 66], [86, -40 + i * 70, 80 + i * 6], cloth[(i + 2) % 6], 1));
  for (const [x, y, h, jar] of [[-140, -100, 70, false], [-150, -40, 48, true], [-136, 40, 60, false], [-150, 100, 40, true], [-180, 0, 34, true]] as const) out.push(translate(amphora(h, jar), [x, y, 0]));
  out.push(translate(rotateY(amphora(60), 80), [-200, 70, 14]));
  return merge(...out);
}

// A milestone of the old roads: a round stone post on a square foot, banded, its distances cut
// in rows, leaning a little; moss round its foot.
function milestone(): Geo {
  const post = merge(
    cylinderAt({ rBot: 26, rTop: 23, height: 150, segments: 12, bottom: [0, 0, 30] }, "Noa_Stone"),
    cylinderAt({ radius: 28, height: 10, segments: 12, bottom: [0, 0, 120] }, "Noa_StoneLight"),
    scale(sphereCenter(23, [0, 0, 180], "Noa_Stone", 10), [1, 1, 0.5], [0, 0, 180]),
    ...[60, 76, 92].map((z) => boxBounds([-26.5, -14, z], [-20, 14, z + 6], "Noa_Dark")),
    boxBounds([-27, -8, 136], [-22, 8, 160], "Noa_Dark"),
    hullGeo([[-27, -14, 150], [-27, 14, 150], [-27, 0, 166], [-23, 0, 166], [-23, -14, 150], [-23, 14, 150]], "Noa_Dark"),
  );
  return merge(
    boxAt([76, 76, 30], [0, 0, 0], "Noa_StoneDark", 3),
    rotateY(post, 3, [0, 0, 30]),
    ring(32, 14, 26, "Noa_MossCap", 10),
    tufts(scatter(-50, 50, -50, 50, 0, 6, 3).filter(([x, y]) => Math.max(Math.abs(x), Math.abs(y)) > 40), 4, 24, 0.4),
  );
}

// An old street lamp: a fluted stone foot, an iron post leaning a little, a scrolled arm and one
// lantern hanging from it.
function oldLamp(): Geo {
  const pole = merge(
    cylinderAt({ radius: 6, height: 230, segments: 8, bottom: [0, 0, 110] }, "IronDark"),
    ring(9, 8, 110, "IronDark", 8),
    ring(8, 6, 250, "IronDark", 8),
    sphereCenter(8, [0, 0, 344], "IronDark", 8),
    beamBetween([0, 0, 330], [-70, 0, 334], 5, 5, "IronDark"),
    beamBetween([0, 0, 290], [-40, 0, 330], 3, 3, "IronDark"),
    translate(rotateX(torus(12, 2, 10, 4, "IronDark"), 90), [-22, 0, 312]),
    cylinderBetween([-66, 0, 334], [-66, 0, 316], 1, 4, "IronDark"),
    translate(lantern(), [-66, 0, 272]),
  );
  return merge(
    boxAt([56, 56, 20], [0, 0, 0], "Noa_StoneDark", 3),
    cylinderAt({ rBot: 22, rTop: 15, height: 90, segments: 10, bottom: [0, 0, 20] }, "Noa_Stone"),
    ring(19, 8, 106, "Noa_StoneLight", 10),
    rotateY(pole, 2, [0, 0, 110]),
    ring(24, 10, 18, "Noa_MossCap", 10),
  );
}

// Ruins in the grass: fallen column drums, a broken capital, ashlar blocks, grass between.
function ruinRubble(): Geo {
  return merge(
    drum(-40, -80, 34, 110, 30), drum(60, 60, 34, 90, 100), drum(-100, 120, 30, 70, 160),
    translate(rotateY(boxAt([100, 100, 20], [0, 0, 0], "Noa_StoneLight", 2), 16), [90, -90, 6]),
    translate(rotateX(cylinderAt({ rBot: 34, rTop: 50, height: 18, segments: 12, bottom: [0, 0, 0] }, "Noa_StoneLight"), 70), [100, -90, 30]),
    rubble(-170, 170, -170, 170, 7, 3, 1.1),
    tufts(scatter(-180, 180, -180, 180, 0, 18, 4), 5, 30, 0.4),
  );
}

// A broken column standing alone, snapped at 2.6 m, ivy up its shaft and grass round its foot.
function brokenColumn(): Geo {
  return merge(
    column(36, 440, { broken: 260, seed: 5 }),
    translate(rotateZ(ivy(-30, 30, 30, 220, 6, { n: 2, spread: 26 }), 0), [-34, 0, 0]),
    translate(rotateZ(ivy(-30, 30, 30, 160, 7, { n: 2, spread: 26 }), 180), [34, 0, 0]),
    tufts(scatter(-80, 80, -80, 80, 0, 10, 8).filter(([x, y]) => Math.max(Math.abs(x), Math.abs(y)) > 54), 9, 28, 0.4),
  );
}

// A caravan wagon at rest, 4.6 m from its shafts to its tail: a box bed on four spoked wheels, a
// canvas tilt on hoops, the shafts down on a block at the front (-X), barrels and sacks aboard,
// a lantern on the tail.
function caravanWagon(): Geo {
  const out: Geo[] = [], BZ = 70, HL = 170, HW = 80;
  const wheel = (r: number): Geo => merge(
    rotateX(torus(r, 5, 18, 5, "Noa_Timber"), 90),
    rotateX(cylinderAt({ radius: 12, height: 20, segments: 8, bottom: [0, 0, -10] }, "IronDark"), 90),
    ...Array.from({ length: 6 }, (_, i) => rotateY(boxBounds([-2.5, -3, 0], [2.5, 3, r], "Noa_Timber"), i * 60)),
  );
  for (const x of [-HL + 30, HL - 40]) for (const s of [-1, 1]) out.push(translate(wheel(x < 0 ? 46 : 56), [x, s * (HW + 14), x < 0 ? 46 : 56]));
  for (const x of [-HL + 30, HL - 40]) out.push(cylinderBetween([x, -HW - 20, x < 0 ? 46 : 56], [x, HW + 20, x < 0 ? 46 : 56], 5, 6, "IronDark"));
  out.push(
    boxBounds([-HL, -HW, BZ], [HL, HW, BZ + 12], "Noa_Timber"),
    boxBounds([-HL, -HW - 4, BZ + 12], [HL, -HW + 4, BZ + 60], "WoodWarm"),
    boxBounds([-HL, HW - 4, BZ + 12], [HL, HW + 4, BZ + 60], "WoodWarm"),
    boxBounds([HL - 6, -HW, BZ + 12], [HL + 2, HW, BZ + 60], "WoodWarm"),
    boxBounds([-HL - 2, -HW, BZ + 12], [-HL + 6, HW, BZ + 70], "WoodWarm"),
  );
  for (const x of [-120, -40, 40, 120]) for (const s of [-1, 1]) out.push(boxBounds([x - 3, s * HW - 5, BZ + 12], [x + 3, s * HW + 5, BZ + 60], "Noa_Timber"));
  // the tilt: a canvas half-tube along X on hoops (three.js builds it round Y; turned to run along X)
  const tilt = new THREE.CylinderGeometry(HW + 10, HW + 10, 2 * HL - 40, 12, 1, true, -Math.PI / 2, Math.PI).rotateZ(-Math.PI / 2).translate(0, 0, BZ + 60);
  out.push(wuv([{ geo: tilt.toNonIndexed(), mat: "Noa_Canvas" }]));
  for (const x of [-HL + 26, -50, 50, HL - 26]) {
    const hoop = new THREE.TorusGeometry(HW + 12, 3, 4, 10, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2).translate(x, 0, BZ + 60);
    out.push([{ geo: hoop.toNonIndexed(), mat: "Noa_Timber" }]);
  }
  out.push(boxBounds([-60, -HW - 11, BZ + 110], [20, -HW - 10, BZ + 140], "Noa_CanvasRed"));
  // the shafts on a block, the load, a lantern
  for (const s of [-1, 1]) out.push(beamBetween([-HL + 10, s * 50, BZ + 4], [-HL - 200, s * 56, 30], 8, 10, "Noa_Timber"));
  out.push(boxBounds([-HL - 214, -70, 0], [-HL - 180, 70, 26], "Noa_Timber", 2));
  out.push(translate(scale(barrel(), [0.7, 0.7, 0.7]), [HL - 60, -40, BZ + 12]), translate(sack(24), [HL - 60, 40, BZ + 12]), translate(rotateZ(crate(50, 60, 46), 12), [HL + 60, 20, 0]));
  out.push(translate(lantern(), [HL + 6, -HW + 10, BZ + 80]), boxBounds([HL + 2, -HW + 6, BZ + 76], [HL + 10, -HW + 14, BZ + 82], "IronDark"));
  return merge(...out);
}

// A 4 m square of old paving: big worn flags of two greys, some sunk a little, grass in the
// joints (for a square or a street that the ground does not pave).
function oldPaving(): Geo {
  const out: Geo[] = [], rnd = rng(17), pts: V3[] = [];
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const w = 96 + (rnd() - 0.5) * 6, d = 96 + (rnd() - 0.5) * 6;
      out.push(boxBounds([-200 + i * 100 + 2, -200 + j * 100 + 2, 0], [-200 + i * 100 + 2 + w, -200 + j * 100 + 2 + d, 4 + rnd() * 2], rnd() < 0.5 ? "Noa_Stone" : "Noa_StoneLight", 1.5));
      if (rnd() < 0.45) pts.push([-200 + i * 100 + (rnd() < 0.5 ? 0 : 50), -200 + j * 100 + (rnd() < 0.5 ? 0 : 50), 2]);
    }
  out.push(boxBounds([-200, -200, 0], [200, 200, 2], "Noa_MossCap"));
  return merge(...out, tufts(pts, 18, 18, 0.2));
}

// ---- the sample: a corner of the old town ----
// The fountain square under the clock tower, the first king on his plinth, the market at its
// edge, old houses facing it, the caravan inn and a wagon; the aqueduct striding along the back
// and breaking off; the broken inner wall and its ruined tower on the far side.
function sample(put: Put): void {
  for (let x = -1200; x <= 800; x += 400) for (let y = -1000; y <= 600; y += 400) put("old_paving", [x, y, 0]);
  put("old_fountain", [-200, -200, 0]);
  put("clock_tower", [700, 900, 0]);
  put("king_statue", [-1000, 500, 0]);
  for (const [x, y] of [[-1200, -1150], [700, -1150], [-1250, 1000]]) put("old_lamp", [x, y, 0], 90);
  put("milestone", [-1650, -700, 0]);
  put("market_stall_old", [600, -400, 0], 180);
  put("market_stall_canvas", [600, 180, 0], 180);
  put("market_stall_old", [-1000, -700, 0], 0);
  for (const [x, y, h] of [[1100, -560, 10], [1080, -460, 40]] as const) put("common:crate", [x, y, 0], h);
  // old houses down the +Y side facing the square
  put("old_townhouse_narrow", [-1500, 1650, 0], 90);
  put("old_townhouse", [-810, 1650, 0], 90);
  put("old_townhouse_narrow", [-130, 1650, 0], 90);
  // the inn and a wagon by it at the -X end
  put("caravan_inn", [-2400, -400, 0], 0);
  put("caravan_wagon", [-1650, -1500, 0], 100);
  // the aqueduct along the -Y edge, breaking off to the east
  [-2100, -1400, -700, 0, 700].forEach((x, i) => put(i === 2 ? "aqueduct_ivy" : "aqueduct", [x, -2000, 0], 90));
  put("aqueduct_broken", [1400, -2000, 0], -90);
  // the broken inner wall and its tower along the +X edge
  put("ruined_wall", [2100, -900, 0], 180);
  put("ruined_wall_breach", [2100, -100, 0], 180);
  put("ruined_tower", [2100, 1000, 0], 180);
  put("broken_column", [1500, 300, 0]);
  put("ruin_rubble", [1550, -400, 0]);
  for (const [x, y, k, s] of [[1300, 1900, "BigOak", 0.8], [-2600, 1700, "RoundTree", 1], [1600, -1300, "SmallTree", 1], [-1900, 1000, "RoundTree", 0.8], [2700, 300, "BigOak", 0.7]] as const) put(`flora:${k}`, [x, y, 0], x, s);
  for (const [x, y, sc] of [[-2200, 1300, 1.2], [1000, 1700, 1.1], [2700, -1500, 1.3]] as const) put("flora:Bush", [x, y, 0], y, sc);
}

export const SOLIDS: Record<string, SolidSpec[]> = {
  palace_ruins: palaceSolids(),
  // the inner wall's masonry (its fallen stones lie loose); the breach open between y = ±180
  ruined_wall: [{ kind: "wall", x: 0, y: 0, w: 260, d: 800, rot: 0 }],
  ruined_wall_breach: [-1, 1].map((s) => ({ kind: "wall", x: 0, y: s * 290, w: 260, d: 220, rot: 0 })),
  // the gate's two halves either side of its passage (y = ±220 open)
  old_gate: [-1, 1].map((s) => ({ kind: "gate", x: 0, y: s * (GATE.R + (GATE.TY + GATE.TW + 22 - GATE.R) / 2), w: 540, d: GATE.TY + GATE.TW + 22 - GATE.R, rot: 0 })),
};

export const KIT: Kit = {
  id: "noa",
  name: "โนอา",
  region: "เมืองหลวงเก่าทางตะวันตกของอีเดน",
  desc: "เมืองหลวงแรกของอาณาจักร สร้างแบบอีเดนแต่เก่ากว่ามาก หินเทาอมเขียวมีมอส หลังคาซีด ซากวัง ท่อส่งน้ำโบราณ หอนาฬิกา",
  ground: "grass",
  items: [
    { id: "palace_ruins", name: "ซากวังเก่า", make: palaceRuins, tags: ["landmark", "ruin"] },
    { id: "clock_tower", name: "หอนาฬิกา", make: clockTower, tags: ["landmark", "tower"] },
    { id: "king_statue", name: "รูปปั้นกษัตริย์องค์แรก", make: kingStatue, tags: ["landmark", "decor"] },
    { id: "archive_hall", name: "หอจดหมายเหตุ", make: archiveHall, tags: ["building", "landmark"] },
    { id: "aqueduct", name: "ท่อส่งน้ำโบราณ (7 ม.)", make: () => aqueduct("plain"), tags: ["aqueduct", "landmark"] },
    { id: "aqueduct_ivy", name: "ท่อส่งน้ำคลุมไม้เลื้อย (7 ม.)", make: () => aqueduct("ivy"), tags: ["aqueduct", "landmark"] },
    { id: "aqueduct_broken", name: "ปลายท่อส่งน้ำที่พัง (7 ม.)", make: () => aqueduct("broken"), tags: ["aqueduct", "ruin"] },
    { id: "old_gate", name: "ประตูเมืองเก่า", make: oldGate, tags: ["gate", "defence", "landmark"] },
    { id: "ruined_wall", name: "กำแพงชั้นในที่พัง (8 ม.)", make: () => ruinedWall({ low: 330, seed: 3 }), tags: ["wall", "ruin"] },
    { id: "ruined_wall_breach", name: "กำแพงพังเป็นช่อง (8 ม.)", make: () => ruinedWall({ low: 260, breach: true, seed: 5 }), tags: ["wall", "ruin"] },
    { id: "ruined_tower", name: "หอคอยร้าง", make: ruinedTower, tags: ["tower", "ruin"] },
    { id: "old_townhouse", name: "บ้านตึกเก่า", make: oldTownhouse, tags: ["building"] },
    { id: "old_townhouse_narrow", name: "บ้านเก่าหน้าแคบ", make: oldTownhouseNarrow, tags: ["building", "market"] },
    { id: "caravan_inn", name: "โรงเตี๊ยมกองคาราวาน", make: caravanInn, tags: ["building"] },
    { id: "old_fountain", name: "น้ำพุเก่า", make: oldFountain, tags: ["decor", "landmark"] },
    { id: "market_stall_old", name: "แผงตลาดเก่า", make: stallOld, tags: ["market"] },
    { id: "market_stall_canvas", name: "แผงผ้าใบเก่า", make: stallCanvas, tags: ["market"] },
    { id: "milestone", name: "หลักไมล์", make: milestone, tags: ["decor"] },
    { id: "old_lamp", name: "โคมไฟเก่า", make: oldLamp, tags: ["light"] },
    { id: "ruin_rubble", name: "ซากเสาหักในพงหญ้า", make: ruinRubble, tags: ["decor", "ruin"] },
    { id: "broken_column", name: "เสาหัก", make: brokenColumn, tags: ["decor", "ruin"] },
    { id: "caravan_wagon", name: "เกวียนกองคาราวาน", make: caravanWagon, tags: ["decor", "market"] },
    { id: "old_paving", name: "ลานหินเก่า (4 ม.)", make: oldPaving, tags: ["ground"] },
  ],
  sample,
};
