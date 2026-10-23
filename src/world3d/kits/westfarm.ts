// ทุ่งและที่ราบแดนตะวันตก (westfarm): the open country round Noa down to the desert's edge, for
// three fields. The windy downs north-east of Noa (ทุ่งหญ้าโนอา): dry-stone walls (whole and
// tumbled), a round sheepfold, the shepherd's hut, a flock of sheep, the old stone windmill, a
// ruined watchtower and clumps of wildflowers. The farmland south of Noa (ที่ราบใต้โนอา): rows of
// vines on their trellises, the old aqueduct (its tall double arcade over the plain, a single one
// for the ridges, a fallen bay), a farmstead with its barn, a wayside shrine, a humpbacked stone
// bridge for the royal road and the cypresses that line it. The dry plains at the desert's edge
// (ที่ราบแห้งแล้ง): cracked mud, a post for tethering camels, an abandoned stone fort (its wall,
// corner tower and gatehouse) and the bleached skeleton of some huge beast.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, its front to -X. The
// walls, vines and aqueduct pieces tile end to end along their own Y (their length in the name).
// The stone bridge's deck humps up from its ends (it is meant to sit on a low rise of the ground
// over a river: see stoneBridge) and its piers reach down into the water.

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, sphereCenter, gableRoof, gableWall, rock,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial, FLOWER_CELLS } from "../textures";
import type { Recipe } from "../textures";
import { coverTop } from "../nature";
import { lump, shrub, crownTreeObject } from "../trees";
import type { ShrubLook, Lobe } from "../trees";
import type { Kit, KitItem, Put } from "./types";
import type { FieldBuilder } from "../field";

// ---- materials ----
const MATS: Record<string, Recipe> = {
  // fieldstone, grey with a green cast like Noa's old walls
  Westfarm_Stone: { map: "crag", tint: "#aaa794", bump: 3 },
  Westfarm_StoneDark: { map: "crag", tint: "#878574", bump: 3 },
  Westfarm_StonePale: { map: "crag", tint: "#c2bfab", bump: 3 },
  Westfarm_Masonry: { map: "stone", tint: "#b5b29f", bump: 2 },
  Westfarm_MasonryDark: { map: "stone", tint: "#959282", bump: 2 },
  Westfarm_Moss: { map: "felt", tint: "#6a8a38", rough: 1, bump: 1.5 },
  Westfarm_Lichen: { map: "felt", tint: "#bdb36e", rough: 1, bump: 1 },
  Westfarm_Thatch: { map: "thatch", tint: "#b09a62", bump: 2 },
  Westfarm_ThatchDark: { map: "thatch", tint: "#8a764a", bump: 2 },
  Westfarm_Render: { map: "plaster", tint: "#e7dfca", bump: 0.8 },
  Westfarm_RenderOchre: { map: "plaster", tint: "#dcb27a", bump: 0.8 },
  Westfarm_RoofFaded: { map: "tiles", tint: "#c08066", bump: 2.5 },
  Westfarm_Shutter: { map: "wood", tint: "#5d7a52", bump: 1 },
  Westfarm_OldWood: { map: "wood", tint: "#8a7a66", bump: 1.4 },
  Westfarm_Sail: { map: "fabric", tint: "#ece2c8", rough: 1 },
  Westfarm_Wool: { map: "felt", tint: "#eee7d6", rough: 1, bump: 2.5 },
  Westfarm_WoolGrey: { map: "felt", tint: "#d3cab4", rough: 1, bump: 2.5 },
  Westfarm_Face: { map: "felt", tint: "#2e2824", rough: 0.9 },
  Westfarm_Dark: { tint: "#1f1d1a", rough: 1 },
  Westfarm_Hay: { map: "thatch", tint: "#d8bb6a", bump: 2 },
  Westfarm_Flour: { map: "fabric", tint: "#ece2c9", rough: 1 },
  Westfarm_Soil: { map: "felt", tint: "#80603e", rough: 1, bump: 1.5 },
  Westfarm_Grape: { map: "felt", tint: "#4b2b63", rough: 0.45 },
  Westfarm_GrapePale: { map: "felt", tint: "#9aa64a", rough: 0.5 },
  Westfarm_VineWood: { map: "bark", tint: "#6b5240", bump: 2 },
  Westfarm_Travertine: { map: "sandstone", tint: "#d8cdb0", bump: 1.6 },
  Westfarm_TravertineDark: { map: "sandstone", tint: "#b2a585", bump: 1.6 },
  Westfarm_Water: { tint: "#6db3c8", rough: 0.08, opacity: 0.85, glow: "#2f7f9a", glowI: 0.15 },
  Westfarm_ChannelWater: { tint: "#3f6f78", rough: 0.1, opacity: 0.9 },
  Westfarm_Cobble: { map: "cobble", tint: "#b4ad9c", bump: 2 },
  Westfarm_Gilt: { map: "metal", tint: "#d8b04a", rough: 0.35, metal: 0.6 },
  Westfarm_Mud: { map: "adobe", tint: "#c4ab86", bump: 1.6 },
  Westfarm_MudDark: { map: "adobe", tint: "#9a7a58", bump: 1.6 },
  Westfarm_FortStone: { map: "sandstone", tint: "#d2b78c", bump: 1.8 },
  Westfarm_FortStoneDark: { map: "sandstone", tint: "#ae9068", bump: 1.8 },
  Westfarm_Sand: { map: "sandstone", tint: "#dcc49a", bump: 0.8, rough: 1 },
  Westfarm_Bone: { map: "felt", tint: "#efe7d4", rough: 0.75, bump: 1 },
  Westfarm_BoneShade: { map: "felt", tint: "#cdbf9e", rough: 0.85, bump: 1 },
  Westfarm_Camel: { map: "felt", tint: "#c99c64", rough: 1, bump: 1.2 },
  Westfarm_CamelDark: { map: "felt", tint: "#9b7044", rough: 1, bump: 1.2 },
  Westfarm_Blanket: { map: "fabric", tint: "#b8432f", rough: 0.95 },
  // card materials: leaves of vines and meadow herbs
  Westfarm_VineDark: { card: "leaves", tint: "#41702c", rough: 0.85 },
  Westfarm_VineLeaf: { card: "leaves", tint: "#5c9238", rough: 0.8 },
  Westfarm_VineLight: { card: "leaves", tint: "#8cba4c", rough: 0.75 },
  Westfarm_HerbDark: { card: "leaves", tint: "#56873a", rough: 0.85 },
  Westfarm_Herb: { card: "leaves", tint: "#76a84a", rough: 0.8 },
  Westfarm_HerbLight: { card: "leaves", tint: "#a2c862", rough: 0.75 },
};
for (const [name, recipe] of Object.entries(MATS)) defineMaterial(name, recipe);

const VINE: ShrubLook = { core: "CanopyCoreDeep", dark: "Westfarm_VineDark", mid: "Westfarm_VineLeaf", light: "Westfarm_VineLight" };
const HERB: ShrubLook = { core: "FoliageCore", dark: "Westfarm_HerbDark", mid: "Westfarm_Herb", light: "Westfarm_HerbLight" };

// ---- helpers ----
const D = Math.PI / 180;

function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// World-aligned texture coordinates (metres / s): masonry courses stay level across pieces.
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

// Outlines drawn in a wall's own plane: (shape x, shape y) = (along the wall, up).
function rectShape(hw: number, top: number, bottom = 0): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-hw, bottom);
  s.lineTo(hw, bottom);
  s.lineTo(hw, top);
  s.lineTo(-hw, top);
  s.closePath();
  return s;
}
function rectPath(x0: number, z0: number, x1: number, z1: number): THREE.Path {
  const p = new THREE.Path();
  p.moveTo(x0, z0);
  p.lineTo(x1, z0);
  p.lineTo(x1, z1);
  p.lineTo(x0, z1);
  p.lineTo(x0, z0);
  return p;
}
// A polygon (along, up) as a shape, with holes.
function polyShape(pts: [number, number][], holes: THREE.Path[] = []): THREE.Shape {
  const s = new THREE.Shape();
  pts.forEach(([a, b], i) => (i ? s.lineTo(a, b) : s.moveTo(a, b)));
  s.closePath();
  s.holes.push(...holes);
  return s;
}
// A wall's outline from y0 to y1 along its foot (at `bottom`) with round-topped openings cut up
// into it from the foot (each centred on c, hw either side, its arch springing at `spring`), then
// its top: flat at `top`, or the points given (from y1 back to y0).
interface Notch { c: number; hw: number; spring: number }
function notched(y0: number, y1: number, bottom: number, notches: Notch[], top: number | [number, number][], seg = 10): [number, number][] {
  const pts: [number, number][] = [[y0, bottom]];
  for (const n of [...notches].sort((a, b) => a.c - b.c)) {
    pts.push([n.c - n.hw, bottom], [n.c - n.hw, n.spring]);
    for (let i = 1; i < seg; i++) {
      const t = Math.PI * (1 - i / seg);
      pts.push([n.c + n.hw * Math.cos(t), n.spring + n.hw * Math.sin(t)]);
    }
    pts.push([n.c + n.hw, n.spring], [n.c + n.hw, bottom]);
  }
  pts.push([y1, bottom]);
  if (typeof top === "number") pts.push([y1, top], [y0, top]);
  else pts.push(...top);
  return pts;
}
// Quoins up a corner at (x, y) whose outside is toward (sx, sy): big blocks, long and short in
// turn, standing a little proud of both faces.
function quoins(x: number, y: number, sx: number, sy: number, z0: number, z1: number, o: { long?: number; short?: number; h?: number; mats?: string[] } = {}): Geo {
  const L = o.long ?? 54, S = o.short ?? 32, H = o.h ?? 36, mats = o.mats ?? ["Westfarm_StonePale", "Westfarm_StonePale", "Westfarm_Stone"];
  const out: Geo[] = [];
  for (let z = z0, k = 0; z < z1 - H / 2; z += H + 2, k++) {
    const lx = k % 2 ? S : L, ly = k % 2 ? L : S;
    const xa = sx > 0 ? x - lx : x - 3, xb = sx > 0 ? x + 3 : x + lx;
    const ya = sy > 0 ? y - ly : y - 3, yb = sy > 0 ? y + 3 : y + ly;
    out.push(boxBounds([xa, ya, z], [xb, yb, Math.min(z + H, z1)], mats[k % mats.length], 2.5));
  }
  return merge(...out);
}
// A flat piece cut to a shape in a -X facing wall (shape x along world Y), from x0 to x0 + depth.
function panelX(shape: THREE.Shape, x0: number, depth: number, mat: string, seg = 8): Geo {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: seg });
  g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, x0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  const geo = g.index ? g.toNonIndexed() : g;
  geo.clearGroups();
  return wuv([{ geo, mat }]);
}
// The same in a wall facing -Y (shape x along world X), from y0 to y0 + depth.
function panelY(shape: THREE.Shape, y0: number, depth: number, mat: string, seg = 8): Geo {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: seg });
  g.applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, y0, 0, 1, 0, 0, 0, 0, 0, 1));
  const geo = g.index ? g.toNonIndexed() : g;
  geo.clearGroups();
  return wuv([{ geo, mat }]);
}
// Wedge stones round a round arch in a -X facing wall: centre c (x, y, z), radius r, from angle
// a0 to a1 (degrees, 0 = +Y, 90 = up), `n` stones.
function voussoirs(c: V3, r: number, n: number, thick: number, depth: number, mat: string, a0 = 0, a1 = 180): Geo {
  const out: Geo[] = [];
  const step = (a1 - a0) / n, chord = 2 * (r + thick) * Math.sin((step * D) / 2) * 1.03, rm = r + thick / 2;
  for (let i = 0; i < n; i++) {
    const a = (a0 + step * (i + 0.5)) * D;
    out.push(translate(rotateX(box([depth, chord, thick], [0, 0, 0], mat, 2), a / D - 90), [c[0], c[1] + rm * Math.cos(a), c[2] + rm * Math.sin(a)]));
  }
  return merge(...out);
}
// A flat triangle seen from both sides (a sail, a gable).
function tri(a: V3, b: V3, c: V3, mat: string): Geo {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([...a, ...b, ...c, ...a, ...c, ...b]), 3));
  geo.computeVertexNormals();
  const ab = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), ac = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
  geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 0, ab / 100, 0, 0, ac / 100, 0, 0, 0, ac / 100, ab / 100, 0]), 2));
  return [{ geo, mat }];
}
// A fieldstone: a small rock (20 faces), broken flat where it split.
function fieldstone(size: V3, seed: number, mat = "Westfarm_Stone", rough = 0.2): Geo {
  return rock(size, rough, seed, mat, false, 0);
}
// Moss settled on the stonework's faces that look up (not on roofs, hay or wood).
const STONY = /Westfarm_(Stone|Masonry|Travertine)/;
const mossed = (g: Geo, seed: number, amount = 0.18, patches = 0.55): Geo => merge(g, coverTop(g.filter((p) => STONY.test(p.mat)), "Westfarm_Moss", { amount, thick: 1.6, seed, grain: 30, patches }));

// ---- the dry-stone walls ----
// Fieldstones laid in rough courses from y0 to y1 along Y, battered from t0 thick at the foot to
// t1 under the coping, `hb` to the coping and a coping of stones on edge on top; heights(y) lowers
// the wall along it (a tumbled stretch: 0 leaves nothing). Each stone a rock from its own seed.
function courses(y0: number, y1: number, hb: number, t0: number, t1: number, rnd: () => number, heights: (y: number) => number = () => 1): Geo {
  const out: Geo[] = [];
  const n = Math.max(2, Math.round(hb / 27)), ch = hb / n;
  const mats = ["Westfarm_Stone", "Westfarm_Stone", "Westfarm_StonePale", "Westfarm_StoneDark"];
  for (let k = 0; k < n; k++) {
    const z0 = k * ch, t = t0 + ((t1 - t0) * (z0 + ch / 2)) / hb;
    let y = y0 - rnd() * 20;
    while (y < y1 - 6) {
      let L = 32 + rnd() * 40;
      if (y + L > y1 - 14) L = y1 - y;
      const a = Math.max(y, y0), b = Math.min(y + L, y1);
      const keep = heights((a + b) / 2);
      if (b - a > 10 && keep * hb > z0 + ch * 0.4) {
        const s: V3 = [t * (0.94 + rnd() * 0.12), (b - a) * 1.1, ch * (1.2 + rnd() * 0.25)];
        out.push(translate(rotateZ(fieldstone(s, Math.floor(rnd() * 9000), mats[Math.floor(rnd() * mats.length)]), (rnd() - 0.5) * 6), [(rnd() - 0.5) * 6, (a + b) / 2, z0 - ch * 0.12]));
      }
      y += L;
    }
  }
  // the coping: flat stones on edge, leaning a little
  for (let y = y0 + 8; y < y1 - 4; y += 15 + rnd() * 5) {
    if (heights(y) < 0.98) continue;
    const s: V3 = [t1 + 10 + rnd() * 6, 13 + rnd() * 5, 26 + rnd() * 8];
    out.push(translate(rotateX(fieldstone(s, Math.floor(rnd() * 9000), rnd() < 0.3 ? "Westfarm_StoneDark" : "Westfarm_Stone", 0.15), (rnd() - 0.5) * 18), [(rnd() - 0.5) * 4, y, hb - 6]));
  }
  return merge(...out);
}

// กำแพงหินเรียง: a dry-stone wall 4 m long, 1.1 m high, moss and yellow lichen on its coping.
function drystoneWall(): Geo {
  const rnd = seeded(101);
  const g = courses(-200, 200, 86, 68, 50, rnd);
  const out: Geo[] = [mossed(g, 7, 0.14, 0.45)];
  for (let i = 0; i < 6; i++) out.push(translate(scale(sphereCenter(7 + rnd() * 6, [0, 0, 0], "Westfarm_Lichen", 6), [1, 1, 0.25]), [(rnd() - 0.5) * 50, -180 + rnd() * 360, 30 + rnd() * 50]));
  return out.flat();
}

// กำแพงหินพัง: the same wall fallen in the middle: a gap, stones tumbled out either side.
function drystoneWallBroken(): Geo {
  const rnd = seeded(103);
  const keep = (y: number) => {
    const d = Math.abs(y - 20);
    return d < 70 ? 0 : d < 150 ? (d - 70) / 80 : 1;
  };
  const out: Geo[] = [mossed(courses(-200, 200, 86, 68, 50, rnd, keep), 9, 0.16, 0.5)];
  // the tumbled stones, more on the side it fell to
  for (let i = 0; i < 16; i++) {
    const side = rnd() < 0.7 ? -1 : 1, s: V3 = [26 + rnd() * 26, 30 + rnd() * 30, 16 + rnd() * 14];
    out.push(translate(rotateY(rotateZ(fieldstone(s, 500 + i, rnd() < 0.3 ? "Westfarm_StonePale" : "Westfarm_Stone"), rnd() * 360), (rnd() - 0.5) * 30), [side * (30 + rnd() * 110), 20 + (rnd() - 0.5) * 240, -3]));
  }
  for (let i = 0; i < 3; i++) out.push(translate(rotateZ(rotateY(fieldstone([62, 16, 30], 600 + i), 80), rnd() * 360), [-60 - rnd() * 60, -40 + rnd() * 120, 6]));
  return merge(...out);
}

// คอกแกะหินกลม: a round sheepfold of dry stone about 9 m across, open on its front (-X) where a
// hurdle gate stands swung back; inside a lean-to of slates over hay, a stone trough.
function sheepfold(): Geo {
  const rnd = seeded(107), R = 420, open = 95; // half the opening, cm of the circle
  const out: Geo[] = [];
  // the wall: courses round the circle (built straight along y, bent round piece by piece)
  const C = 2 * Math.PI * R, seg = 120;
  for (let s = open; s < C - open - 10; s += seg) {
    const len = Math.min(seg, C - open - s), mid = s + len / 2, a = mid / R + Math.PI; // 0 at -X
    const piece = courses(-len / 2 - 2, len / 2 + 2, 76, 62, 46, rnd);
    out.push(translate(rotateZ(piece, (a * 180) / Math.PI), [R * Math.cos(a), R * Math.sin(a), 0]));
  }
  // gateposts: two tall stones either side of the opening
  for (const sgn of [-1, 1]) {
    const a = Math.PI + (sgn * open) / R;
    out.push(translate(rotateZ(fieldstone([46, 40, 150], 710 + sgn, "Westfarm_StonePale", 0.12), sgn * 10), [R * Math.cos(a), R * Math.sin(a), 0]));
  }
  // the hurdle gate, swung in against the wall
  const hurdle = (): Geo => {
    const g: Geo[] = [];
    for (const y of [-80, 0, 80]) g.push(boxAt([7, 7, 105], [0, y, 0], "Westfarm_OldWood", 1.5));
    for (const z of [22, 50, 78, 98]) g.push(box([5, 175, 6], [0, 0, z], "Westfarm_OldWood", 1));
    g.push(beamBetween([0, -80, 22], [0, 80, 98], 5, 5, "Westfarm_OldWood"));
    return merge(...g);
  };
  // (swung in from the post at +Y, lying along the inside of the wall)
  out.push(translate(rotateZ(hurdle(), 90), [-R + 150, open + 14, 0]));
  // the lean-to on the far side: a higher back wall of its own, posts, a roof of slates sloping
  // down from it
  const lx = R - 150;
  out.push(translate(courses(-205, 205, 175, 52, 40, rnd), [lx + 96, 0, 0]));
  for (const y of [-170, 170]) out.push(cylinderAt({ radius: 8, height: 150, segments: 6, bottom: [lx - 80, y, 0] }, "Westfarm_OldWood"));
  out.push(box([10, 380, 10], [lx - 80, 0, 152], "Westfarm_OldWood"));
  for (const y of [-160, -55, 55, 160]) out.push(beamBetween([lx - 100, y, 150], [lx + 100, y, 196], 7, 7, "Westfarm_OldWood"));
  out.push(translate(rotateY(box([236, 410, 7], [0, 0, 0], "RoofSlate", 1.5), -12.6), [lx + 5, 0, 178]));
  // hay under it, a rack, a trough
  out.push(translate(scale(lump([0, 0, 0], [60, 120, 40], 41, "Westfarm_Hay", 1, 0.2), [1, 1, 1]), [lx + 40, -40, 0]));
  out.push(translate(lump([0, 0, 0], [40, 50, 30], 43, "Westfarm_Hay", 1, 0.2), [lx - 10, 110, 0]));
  out.push(boxBounds([-60, -100, 0], [-20, 100, 14], "Westfarm_StoneDark", 2), boxBounds([-62, -100, 14], [-18, -88, 42], "Westfarm_Stone", 2), boxBounds([-62, 88, 14], [-18, 100, 42], "Westfarm_Stone", 2));
  out.push(boxBounds([-62, -88, 14], [-56, 88, 40], "Westfarm_Stone", 1.5), boxBounds([-24, -88, 14], [-18, 88, 40], "Westfarm_Stone", 1.5), boxBounds([-56, -88, 14], [-24, 88, 30], "Westfarm_Water"));
  return mossed(merge(...out), 11, 0.12, 0.4);
}

// ---- the shepherd's hut ----
// A window facing -X, the bottom of the opening at z = 0: a dark hole, a timber frame, a sill
// and lintel of stone, shutters open either side.
function windowX(w: number, h: number, o: { shutters?: string; sill?: string; frame?: string; glass?: boolean } = {}): Geo {
  const hw = w / 2, fr = o.frame ?? "WoodDark", st = o.sill ?? "Westfarm_StonePale";
  const out: Geo[] = [
    boxBounds([-4, -hw, 0], [2, hw, h], o.glass ? "GlassBlue" : "Westfarm_Dark"),
    boxBounds([-8, -hw - 7, -4], [0, -hw, h + 4], fr), boxBounds([-8, hw, -4], [0, hw + 7, h + 4], fr),
    boxBounds([-8, -hw, h], [0, hw, h + 7], fr), boxBounds([-8, -2, 0], [-5, 2, h], fr),
    boxBounds([-16, -hw - 14, -12], [2, hw + 14, -2], st, 2), boxBounds([-12, -hw - 16, h + 6], [2, hw + 16, h + 22], st, 2),
  ];
  if (o.shutters)
    for (const s of [-1, 1]) {
      const a = s * (hw + 9), b = s * (hw + 9 + hw);
      out.push(boxBounds([-6, Math.min(a, b), 0], [-2, Math.max(a, b), h], o.shutters, 1));
      for (const z of [h * 0.2, h * 0.75]) out.push(boxBounds([-8, Math.min(a, b) + 3, z], [-6, Math.max(a, b) - 3, z + 6], o.shutters));
    }
  return merge(...out);
}
// A plank door facing -X in a stone frame (bottom at z = 0), its top square or round.
function doorX(w: number, h: number, o: { arch?: boolean; frame?: string; wood?: string } = {}): Geo {
  const hw = w / 2, fr = o.frame ?? "Westfarm_StonePale", spring = o.arch ? h - hw : h;
  const out: Geo[] = [];
  const opening = o.arch ? polyShape([[-hw, 0], [hw, 0], [hw, spring], ...Array.from({ length: 9 }, (_, i) => [hw * Math.cos(((i + 1) / 10) * Math.PI), spring + hw * Math.sin(((i + 1) / 10) * Math.PI)] as [number, number]), [-hw, spring]]) : rectShape(hw, h);
  out.push(panelX(opening, -6, 4, o.wood ?? "DoorWood"));
  for (let y = -hw + 15; y < hw; y += 17) out.push(boxBounds([-7, y - 0.8, 2], [-6, y + 0.8, spring - 4], "WoodDark"));
  for (const z of [h * 0.18, spring * 0.8]) out.push(boxBounds([-9, -hw + 4, z], [-6, hw - 4, z + 7], "IronDark"));
  if (o.arch) out.push(voussoirs([-6, 0, spring], hw, 7, 18, 16, fr));
  else out.push(boxBounds([-14, -hw - 18, h], [4, hw + 18, h + 22], fr, 2));
  for (const s of [-1, 1]) out.push(boxBounds([-12, s < 0 ? -hw - 16 : hw, 0], [2, s < 0 ? -hw : hw + 16, spring], fr, 2));
  out.push(translate(rotateY(cylinderBetween([0, 0, 0], [0, 0, 1], 6, 8, "IronDark"), 90), [-10, hw * 0.6, h * 0.45]));
  return merge(...out);
}

// กระท่อมคนเลี้ยงแกะ: a low cottage of rough stone (4.6 x 3.8 m) under a thatch, its chimney on
// the back gable, the door in the front one; a bench, a water butt, a woodpile, a crook.
function shepherdHut(): Geo {
  const rnd = seeded(113), X = 230, Y = 190, H = 235, T = 42;
  const S = "Westfarm_Masonry";
  const out: Geo[] = [
    boxBounds([-X - 12, -Y - 12, 0], [X + 12, Y + 12, 22], "Westfarm_StoneDark", 3),
    // walls (the door and windows are cut by their own pieces standing proud)
    wuv(merge(
      boxBounds([-X, -Y, 22], [X, -Y + T, H], S), boxBounds([-X, Y - T, 22], [X, Y, H], S),
      boxBounds([-X, -Y + T, 22], [-X + T, Y - T, H], S), boxBounds([X - T, -Y + T, 22], [X, Y - T, H], S),
    ), 1.3),
    gableWall(-X, Y, H, 160, S), gableWall(X, Y, H, 160, S),
  ];
  // quoins: big blocks up the corners, long and short in turn
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) out.push(quoins(sx * X, sy * Y, sx, sy, 22, H, { h: 32 }));
  // the thatch: thick, rounded at the ridge, eaves low
  out.push(gableRoof([2 * X + 30, 2 * Y, 30], [0, 0, H - 30], 190, 48, "Westfarm_Thatch"));
  out.push(translate(rotateY(cylinderBetween([-X - 40, 0, 0], [X + 40, 0, 0], 26, 8, "Westfarm_ThatchDark"), 0), [0, 0, H + 160]));
  for (const s of [-1, 1]) out.push(beamBetween([-X - 44, s * (Y + 46), H - 26], [X + 44, s * (Y + 46), H - 26], 14, 10, "Westfarm_ThatchDark"));
  // the chimney on the back gable
  out.push(wuv(boxBounds([X - 20, -40, 0], [X + 46, 40, H + 260], "Westfarm_MasonryDark", 3), 1.2), boxBounds([X - 26, -46, H + 248], [X + 52, 46, H + 268], "Westfarm_StonePale", 2));
  out.push(cylinderAt({ radius: 14, height: 30, segments: 8, bottom: [X + 13, 0, H + 266] }, "BrickRed"));
  // the door in the front gable, a little window beside it, windows down the sides
  out.push(translate(doorX(96, 196, { arch: false }), [-X, -40, 22]));
  out.push(translate(windowX(52, 56, { shutters: "Westfarm_Shutter" }), [-X, 120, 120]));
  out.push(translate(rotateZ(windowX(60, 62, { shutters: "Westfarm_Shutter" }), 90), [40, -Y, 112]));
  out.push(translate(rotateZ(windowX(60, 62, { shutters: "Westfarm_Shutter" }), -90), [-40, Y, 112]));
  // by the door: a bench of a slab on two stones, the water butt, the crook against the wall
  out.push(boxBounds([-X - 70, 60, 40], [-X - 28, 200, 50], "Westfarm_StonePale", 2), boxAt([36, 30, 40], [-X - 49, 80, 0], "Westfarm_Stone", 3), boxAt([36, 30, 40], [-X - 49, 180, 0], "Westfarm_Stone", 3));
  out.push(cylinderAt({ rBot: 30, rTop: 33, height: 92, segments: 10, bottom: [-X - 46, -170, 0] }, "Westfarm_OldWood"));
  for (const z of [16, 76]) out.push(translate(cylinderAt({ radius: 34, height: 6, segments: 10, bottom: [0, 0, 0] }, "IronDark"), [-X - 46, -170, z]));
  out.push(cylinderAt({ radius: 27, height: 2, segments: 10, bottom: [-X - 46, -170, 88] }, "Westfarm_Water"));
  out.push(cylinderBetween([-X - 14, 10, 0], [-X - 6, 34, 170], 2.5, 5, "WoodDark"));
  // the crook's hook
  for (let i = 0; i < 5; i++) {
    const a0 = (i / 5) * Math.PI * 1.2, a1 = ((i + 1) / 5) * Math.PI * 1.2;
    out.push(cylinderBetween([-X - 6, 34 - 11 + 11 * Math.cos(a0), 170 + 11 * Math.sin(a0)], [-X - 6, 34 - 11 + 11 * Math.cos(a1), 170 + 11 * Math.sin(a1)], 2.5, 5, "WoodDark"));
  }
  // the woodpile against the side
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 7 - i; j++) {
      const x = -150 + j * 30 + i * 15, z = 10 + i * 19;
      out.push(cylinderBetween([x, Y + 12, z], [x, Y + 70, z], 9.5, 7, "Westfarm_OldWood"));
    }
  out.push(translate(rotateY(box([260, 80, 6], [0, 0, 0], "RoofSlate", 1), -12), [-60, Y + 50, 84]));
  // a few stones and tufts of moss along the foot
  for (let i = 0; i < 5; i++) out.push(translate(fieldstone([30 + rnd() * 20, 26 + rnd() * 16, 18], 120 + i), [(rnd() - 0.5) * 380, (rnd() < 0.5 ? -1 : 1) * (Y + 26), 0]));
  return mossed(merge(...out), 13, 0.1, 0.35);
}

// ---- sheep ----
// One sheep: a woolly body, a dark face and legs; grazing with its head down or looking up.
function sheep(seed: number, grazing: boolean, grey = false): Geo {
  const rnd = seeded(seed), W = grey ? "Westfarm_WoolGrey" : "Westfarm_Wool";
  const out: Geo[] = [lump([0, 0, 64], [56, 33, 30], seed, W, 1, 0.16, 30)];
  for (let i = 0; i < 3; i++) out.push(lump([-26 + i * 26, (rnd() - 0.5) * 10, 86], [22, 20, 14], seed + i + 1, W, 0, 0.2, 30));
  out.push(lump([52, 0, 66], [14, 16, 16], seed + 9, W, 0, 0.2, 30));
  // legs
  for (const [x, y] of [[-30, -15], [-30, 15], [30, -15], [30, 15]] as [number, number][]) out.push(cylinderAt({ rBot: 3.5, rTop: 4.5, height: 46, segments: 5, bottom: [x, y, 0] }, "Westfarm_Face"));
  // the head and its wool cap
  const hx = grazing ? -66 : -64, hz = grazing ? 28 : 84, tilt = grazing ? -55 : 10;
  const head = merge(
    translate(scale(sphereCenter(13, [0, 0, 0], "Westfarm_Face", 8), [1.5, 0.85, 0.95]), [-6, 0, 0]),
    lump([8, 0, 8], [13, 13, 10], seed + 5, W, 0, 0.2, 30),
    translate(rotateX(scale(sphereCenter(6, [0, 0, 0], "Westfarm_Face", 6), [0.6, 1.7, 0.4]), 20), [4, -15, 4]),
    translate(rotateX(scale(sphereCenter(6, [0, 0, 0], "Westfarm_Face", 6), [0.6, 1.7, 0.4]), -20), [4, 15, 4]),
  );
  out.push(translate(rotateY(head, tilt), [hx, 0, hz]));
  out.push(beamBetween([-40, 0, grazing ? 60 : 72], [hx + 10, 0, hz + 4], 16, 14, W));
  return merge(...out);
}
// ฝูงแกะ: four sheep grazing together.
function sheepFlock(): Geo {
  return merge(
    sheep(201, true),
    translate(rotateZ(sheep(203, false), 40), [140, -110, 0]),
    translate(rotateZ(sheep(207, true, true), -30), [-40, 150, 0]),
    translate(rotateZ(sheep(211, true), 160), [190, 90, 0]),
  );
}

// ---- the old windmill ----
// กังหันลมหินเก่า: a round tower mill of limewashed rubble on its stone plinth, tapering to a
// conical cap of thatch; eight spokes with jib sails on the front (-X), three of them furled, one
// snapped, stays from their tips to a bowsprit. About 14 m tall to the hub, the sails 12 m across.
function stoneWindmill(): Geo {
  const rnd = seeded(131), Z0 = 34, H = 960, RB = 330, RT = 268;
  const r = (z: number) => RB + ((RT - RB) * (z - Z0)) / H;
  const lean = (Math.atan2(RB - RT, H) * 180) / Math.PI;
  const ring = (rb: number, rt: number, h: number, z: number, mat: string, seg = 18) => rotateZ(cylinderAt({ rBot: rb, rTop: rt, height: h, segments: seg, bottom: [0, 0, z] }, mat), 10);
  const out: Geo[] = [
    ring(420, 410, Z0, 0, "Westfarm_StoneDark"),
    wuv(ring(RB + 16, RB + 12, 46, Z0, "Westfarm_Masonry"), 1.2),
    wuv(ring(RB, RT, H, Z0, "Westfarm_Render"), 1.4),
    ring(r(Z0 + 520) + 9, r(Z0 + 540) + 9, 20, Z0 + 520, "Westfarm_StonePale"),
    ring(RT + 16, RT + 22, 30, Z0 + H - 6, "Westfarm_StonePale"),
  ];
  // streaks down the limewash under the windows and the cap, where the rain runs
  for (let i = 0; i < 7; i++) {
    const a = rnd() * 360, z = Z0 + 260 + rnd() * (H - 420), rr = r(z);
    out.push(rotateZ(translate(rotateY(boxBounds([-2, -14 - rnd() * 10, -110 - rnd() * 80], [2, 14 + rnd() * 10, 0], "Westfarm_StonePale"), -lean), [rr - 1, 0, z]), a));
  }
  // the door over four steps, small deep windows up the tower
  const ZD = Z0 + 46;
  out.push(translate(rotateY(doorX(104, 210, { arch: true }), lean), [-r(ZD) + 2, 0, ZD]));
  for (let i = 0; i < 4; i++) out.push(boxBounds([-RB - 30 - (3 - i) * 26, -84, 0], [-RB + 10, 84, (i + 1) * 20], "Westfarm_StonePale", 2));
  for (const [a, z] of [[150, 300], [215, 520], [90, 680], [270, 640], [180, 820], [0, 420]] as [number, number][]) {
    out.push(rotateZ(translate(rotateY(windowX(44, 58, { frame: "WoodDark", sill: "Westfarm_StonePale" }), lean), [-r(z) + 2, 0, z]), a));
  }
  // the cap: a wooden curb, the cone of thatch, a finial
  const ZC = Z0 + H + 24;
  out.push(ring(RT + 28, RT + 28, 26, ZC - 4, "WoodDark"));
  out.push(ring(RT + 40, 18, 320, ZC + 20, "Westfarm_Thatch", 16));
  out.push(ring(RT + 44, RT + 30, 26, ZC + 14, "Westfarm_ThatchDark", 16));
  out.push(cylinderAt({ radius: 5, height: 90, segments: 6, bottom: [0, 0, ZC + 320] }, "WoodDark"), sphereCenter(12, [0, 0, ZC + 410], "Westfarm_Gilt", 8));
  // the windshaft and hub, out of the cap toward the front
  const HZ = ZC + 120, HX = -RT - 150;
  out.push(cylinderBetween([-RT + 40, 0, HZ - 6], [HX, 0, HZ], 20, 10, "WoodDark"));
  out.push(cylinderBetween([HX + 20, 0, HZ], [HX - 30, 0, HZ], 40, 12, "Westfarm_OldWood"), cylinderBetween([HX - 30, 0, HZ], [HX - 44, 0, HZ], 24, 10, "IronDark"));
  // the bowsprit and its stays to the spoke tips
  const BX = HX - 260, SL = 600, N = 8;
  out.push(cylinderBetween([HX - 40, 0, HZ], [BX, 0, HZ + 6], 6, 6, "WoodDark"));
  for (let k = 0; k < N; k++) {
    const a = (k / N) * Math.PI * 2 + 0.2, broken = k === 5, furled = k === 1 || k === 4 || k === 6;
    const len = broken ? 250 : SL;
    const tip: V3 = [HX - 36, Math.cos(a) * len, HZ + Math.sin(a) * len];
    out.push(cylinderBetween([HX - 36, Math.cos(a) * 30, HZ + Math.sin(a) * 30], tip, 6, 6, "WoodDark", 4));
    if (broken) {
      // the snapped end hangs down from the stump
      const end: V3 = [tip[0] - 20, tip[1] + 60, tip[2] - 240];
      out.push(cylinderBetween(tip, end, 4.5, 5, "WoodDark"));
      continue;
    }
    out.push(cylinderBetween(tip, [BX, 0, HZ + 6], 1.2, 3, "RopeTan"));
    const next = a + (Math.PI * 2) / N;
    if (furled) {
      // the sail wrapped round its spoke
      out.push(cylinderBetween([HX - 34, Math.cos(a) * 60, HZ + Math.sin(a) * 60], [HX - 34, Math.cos(a) * (SL - 30), HZ + Math.sin(a) * (SL - 30)], 9, 6, "Westfarm_Sail", 5));
    } else {
      // a jib sail from the tip back to the next spoke's foot
      const foot: V3 = [HX - 32, Math.cos(next) * 70, HZ + Math.sin(next) * 70], inner: V3 = [HX - 32, Math.cos(a) * 70, HZ + Math.sin(a) * 70];
      const belly: V3 = [HX - 52, Math.cos(a + 0.42) * SL * 0.55, HZ + Math.sin(a + 0.42) * SL * 0.55];
      out.push(tri([tip[0] - 2, tip[1], tip[2]], belly, inner, "Westfarm_Sail"), tri(belly, foot, inner, "Westfarm_Sail"));
    }
  }
  // round the foot: a millstone leaning on the tower, sacks of flour, a cart wheel
  out.push(translate(rotateY(cylinderAt({ radius: 70, height: 20, segments: 14, bottom: [0, 0, -10] }, "Westfarm_StonePale"), 74), [-40, -RB - 32, 72]));
  for (const [x, y, s] of [[-140, -RB - 40, 1], [-190, -RB - 10, 0.85], [-160, -RB + 10, 0.8]] as [number, number, number][]) out.push(translate(lump([0, 0, 0], [24 * s, 18 * s, 30 * s], 300 + x, "Westfarm_Flour", 0, 0.12, 40), [x, y, Z0]));
  const wheel = merge(
    cylinderAt({ radius: 58, height: 8, segments: 14, bottom: [0, 0, -4] }, "Westfarm_OldWood"),
    cylinderAt({ radius: 48, height: 10, segments: 14, bottom: [0, 0, -5] }, "Westfarm_Dark"),
    cylinderAt({ radius: 12, height: 18, segments: 8, bottom: [0, 0, -9] }, "WoodDark"),
    ...Array.from({ length: 8 }, (_, i) => beamBetween([0, 0, 0], [Math.cos((i * Math.PI) / 4) * 50, Math.sin((i * Math.PI) / 4) * 50, 0], 5, 4, "Westfarm_OldWood")),
  );
  out.push(translate(rotateY(wheel, 70), [120, RB + 34, 62]));
  return merge(...out);
}

// ---- the ruined watchtower ----
// ซากหอสังเกตการณ์โบราณ: the shell of a square tower of Noa's old grey-green stone, 5.6 m a side:
// its walls stand to different heights, highest at the back-left corner (about 10 m), broken down
// at the front-right; an arched doorway, arrow slits, the line of the floor that was, a few of its
// joists left; fallen blocks and rubble round it, moss on every ledge.
function watchtowerRuin(): Geo {
  const rnd = seeded(137), X = 280, T = 72, S = "Westfarm_Masonry";
  const out: Geo[] = [];
  // a jagged top: from height a at one end to b at the other, broken in steps
  const top = (a: number, b: number, n: number, jag: number): [number, number][] => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, y = -X + t * 2 * X;
      const z = a + (b - a) * t + (i > 0 && i < n ? (rnd() - 0.5) * jag : 0);
      pts.push([y, Math.round(z / 30) * 30]);
    }
    // stepped: each point holds its height to the next
    const steps: [number, number][] = [];
    pts.forEach(([y, z], i) => {
      if (i > 0) steps.push([y, pts[i - 1][1]]);
      steps.push([y, z]);
    });
    return steps.reverse();
  };
  const wall = (a: number, b: number, holes: THREE.Path[], doors: Notch[] = []): Geo => panelX(polyShape(notched(-X, X, 0, doors, top(a, b, 7, 160)), holes), 0, T, S);
  // the front (-X): the doorway; the back; the two sides with slits
  const slit = (y: number, z: number) => rectPath(y - 9, z, y + 9, z + 110);
  const front = wall(820, 300, [slit(150, 420)], [{ c: -60, hw: 70, spring: 170 }]);
  const back = wall(1000, 760, [slit(-120, 300), slit(120, 600)]);
  const left = wall(980, 640, [slit(0, 280), rectPath(-60, 560, 40, 700)]);
  const right = wall(560, 300, [slit(-60, 260)]);
  out.push(voussoirs([-X - 2, -60, 170], 70, 9, 24, 10, "Westfarm_StonePale"));
  out.push(translate(front, [-X, 0, 0]), translate(rotateZ(back, 180), [X, 0, 0]));
  out.push(translate(rotateZ(left, -90), [0, X, 0]), translate(rotateZ(right, 90), [0, -X, 0]));
  // quoins up the standing corners, a plinth, the string course where the floor was
  for (const [sx, sy, h] of [[1, 1, 960], [-1, 1, 780], [1, -1, 700], [-1, -1, 290]] as [number, number, number][])
    out.push(quoins(sx * X, sy * X, sx, sy, 30, h, { long: 72, short: 44, h: 44, mats: ["Westfarm_StonePale", "Westfarm_Stone", "Westfarm_Stone"] }));
  out.push(boxBounds([-X - 18, -X - 18, 0], [X + 18, X + 18, 34], "Westfarm_MasonryDark", 3));
  // inside: the floor's beam holes and three joists still across, one fallen
  for (const y of [-160, 40, 190]) out.push(beamBetween([-X + T - 10, y, 360], [X - T + 10, y + 10, 366], 22, 24, "WoodDark"));
  out.push(beamBetween([-X + 110, -100, 20], [X - 120, -200, 200], 22, 22, "WoodDark"));
  for (let y = -X + 110; y < X - 80; y += 90) out.push(boxBounds([X - T - 2, y - 11, 352], [X - T + 6, y + 11, 376], "Westfarm_Dark"));
  // rubble inside and out, fallen blocks
  for (let i = 0; i < 9; i++) out.push(translate(fieldstone([60 + rnd() * 60, 50 + rnd() * 50, 30 + rnd() * 30], 140 + i, rnd() < 0.4 ? "Westfarm_StonePale" : "Westfarm_Stone", 0.3), [(rnd() - 0.5) * 300, (rnd() - 0.5) * 300, -6]));
  for (let i = 0; i < 12; i++) {
    const a = rnd() * Math.PI * 2, d = X + 80 + rnd() * 200, front = Math.cos(a) < 0.2;
    if (!front && rnd() < 0.5) continue;
    out.push(translate(rotateZ(rotateY(box([70 + rnd() * 30, 42, 40], [0, 0, 18], rnd() < 0.5 ? "Westfarm_Masonry" : "Westfarm_StonePale", 4), (rnd() - 0.5) * 30), rnd() * 360), [Math.cos(a) * d - 40, Math.sin(a) * d * 0.9 - 80, -4]));
  }
  for (let i = 0; i < 6; i++) out.push(translate(fieldstone([90 + rnd() * 80, 80 + rnd() * 60, 40 + rnd() * 30], 160 + i, "Westfarm_Stone", 0.35), [-X - 60 - rnd() * 140, -X + rnd() * 2 * X * 0.8, -8]));
  // ivy up the high corner
  out.push(shrub({ seed: 141, leaf: 22, look: VINE, ragged: 0.7, core: 0.6, density: 0.9, lobes: [[X + 10, X - 40, 200, 30, 70, 160], [X + 8, X - 120, 420, 26, 60, 140], [X - 40, X + 12, 600, 60, 26, 130]] }));
  return mossed(merge(...out), 17, 0.16, 0.55);
}

// ดงดอกไม้ป่า: a patch of meadow flowers about 2 m across: poppies, cornflowers, buttercups and
// daisies over clumps of leafy herbs.
function wildflowers(): Geo {
  const clump = (seed: number, x: number, y: number, s: number, cells: number[]): Geo =>
    translate(shrub({
      seed, leaf: 15 * s, look: HERB, core: 0, ragged: 0.95, density: 0.75,
      lobes: [[0, 0, 22 * s, 34 * s, 30 * s, 20 * s], [18 * s, 12 * s, 16 * s, 22 * s, 20 * s, 14 * s], [-16 * s, -10 * s, 14 * s, 22 * s, 20 * s, 13 * s]],
      flowers: { cells, n: Math.round(16 * s), size: 13 * s, up: 0.9 },
    }), [x, y, 0]);
  const F = FLOWER_CELLS;
  return merge(
    clump(151, 0, 0, 1.1, [F.roseRed, F.roseRed, F.daisy]),
    clump(153, 60, -50, 0.9, [F.forgetMeNot, F.buttercup]),
    clump(157, -50, 55, 1, [F.daisy, F.tinyYellow, F.roseRed]),
    clump(159, -70, -40, 0.75, [F.lavender, F.buttercup]),
    clump(161, 70, 60, 0.8, [F.buttercup, F.cosmosPink]),
  );
}

// ---- the farmland ----
// แถวเถาองุ่น: a row of vines 8 m long on a ridge of earth: weathered posts every 2 m, two wires,
// gnarled trunks every metre, the leaves trained along the wires and bunches of dark grapes.
function vineyardRow(): Geo {
  const rnd = seeded(171), L = 400, out: Geo[] = [];
  out.push(translate(scale(cylinderBetween([0, -L, 0], [0, L, 0], 40, 8, "Westfarm_Soil"), [1, 1, 0.35]), [0, 0, 0]));
  for (let y = -300; y <= 300; y += 200) {
    out.push(boxAt([9, 9, 150], [0, y, 0], "Westfarm_OldWood", 1.5));
    out.push(boxAt([12, 12, 4], [0, y, 150], "Westfarm_OldWood", 1));
  }
  for (const z of [72, 118]) out.push(cylinderBetween([0, -L, z], [0, L, z], 0.8, 3, "IronLight"));
  const lobes: Lobe[] = [];
  for (let y = -L + 50; y < L; y += 100) {
    // the trunk, twisting up to the lower wire, two canes along it
    const tx = (rnd() - 0.5) * 10;
    out.push(cylinderBetween([tx, y, 0], [tx * 0.4, y + (rnd() - 0.5) * 10, 40], 5, 5, "Westfarm_VineWood", 4.5));
    out.push(cylinderBetween([tx * 0.4, y, 40], [0, y, 72], 4.5, 5, "Westfarm_VineWood", 3.5));
    for (const s of [-1, 1]) out.push(cylinderBetween([0, y, 72], [0, y + s * 48, 74], 2.5, 4, "Westfarm_VineWood", 1.8));
    lobes.push([0, y, 104, 26, 54, 34]);
    // bunches hanging under the leaves: a tapering cluster with a few grapes standing out
    for (let b = 0; b < 2; b++) {
      const by = y + (rnd() - 0.5) * 70, bx = (rnd() < 0.5 ? -1 : 1) * (12 + rnd() * 8), bz = 66 + rnd() * 12;
      out.push(cylinderAt({ rBot: 2, rTop: 7.5, height: 20, segments: 6, bottom: [bx, by, bz - 22] }, "Westfarm_Grape"));
      out.push(sphereCenter(5, [bx + (rnd() - 0.5) * 6, by + (rnd() - 0.5) * 6, bz - 6], "Westfarm_Grape", 5));
    }
  }
  out.push(shrub({ seed: 173, leaf: 30, look: VINE, ragged: 0.55, core: 0.62, density: 0.7, lobes }));
  return merge(...out);
}

// ---- the aqueduct ----
// Piers at both ends (half piers, so bays set end to end along Y make whole ones), the arch
// between: one bay 8 m long. The tall piece has two tiers (a big arch below, two small ones
// above) under the water channel; the low one only the upper tier on a plinth, its channel at the
// same height when it stands on ground 4 m higher (a ridge). Channel top 11.8 m / 7.8 m.
const AQ = { half: 400, d0: 250, d1: 196, upper: 380 }; // half a bay; the lower and upper tiers' depths; the upper tier's height
function upperTier(z0: number, rnd: () => number, broken = false): Geo {
  const T = "Westfarm_Travertine", TD = "Westfarm_TravertineDark", d = AQ.d1, out: Geo[] = [];
  // two arches of 3 m between piers 1 m wide (half at the ends)
  const arches = [{ c: -200, hw: 150, spring: 190 }, { c: 200, hw: 150, spring: 190 }];
  out.push(translate(panelX(polyShape(notched(-AQ.half, AQ.half, 0, arches, 340)), -d / 2, d, T), [0, 0, z0]));
  for (const y of [-200, 200]) out.push(translate(voussoirs([-d / 2 - 1, y, 190], 150, 9, 30, 6, TD), [0, 0, z0]), translate(voussoirs([d / 2 - 5, y, 190], 150, 9, 30, 6, TD), [0, 0, z0]));
  // imposts at the springing, the cornice over the arches
  for (const y of [-AQ.half + 25, 0, AQ.half - 25])
    out.push(boxBounds([-d / 2 - 8, y - (Math.abs(y) > 300 ? 25 : 56), z0 + 176], [d / 2 + 8, y + (Math.abs(y) > 300 ? 25 : 56), z0 + 192], TD, 2));
  out.push(boxBounds([-d / 2 - 14, -AQ.half, z0 + 340], [d / 2 + 14, AQ.half, z0 + 362], TD, 2));
  // the channel: two side walls, the water between, cover slabs (some gone)
  const cw = 150;
  out.push(boxBounds([-cw / 2 - 26, -AQ.half, z0 + 362], [-cw / 2 + 4, AQ.half, z0 + AQ.upper + 80], T, 2));
  out.push(boxBounds([cw / 2 - 4, -AQ.half, z0 + 362], [cw / 2 + 26, AQ.half, z0 + AQ.upper + 80], T, 2));
  out.push(boxBounds([-cw / 2 + 4, -AQ.half, z0 + 362], [cw / 2 - 4, AQ.half, z0 + 380], TD));
  if (!broken) out.push(boxBounds([-cw / 2 + 4, -AQ.half, z0 + 380], [cw / 2 - 4, AQ.half, z0 + 404], "Westfarm_ChannelWater"));
  // the cover slabs, a few fallen in or gone
  for (let y = -AQ.half + 50; y < AQ.half; y += 100) {
    const k = rnd();
    if (k < 0.72) out.push(box([cw + 64, 96, 14], [(rnd() - 0.5) * 6, y, z0 + AQ.upper + 87], rnd() < 0.5 ? T : TD, 2));
    else if (k < 0.82) out.push(translate(rotateX(box([cw + 40, 90, 12], [0, 0, 0], TD, 2), 22), [0, y, z0 + AQ.upper + 30]));
  }
  return merge(...out);
}
function aqueductTall(): Geo {
  const rnd = seeded(181), T = "Westfarm_Travertine", TD = "Westfarm_TravertineDark", d = AQ.d0, out: Geo[] = [];
  // the lower tier: piers 1.8 m wide with a plinth, one great arch of 6.2 m
  out.push(panelX(polyShape(notched(-AQ.half, AQ.half, 0, [{ c: 0, hw: 310, spring: 300 }], 700, 16)), -d / 2, d, T));
  out.push(voussoirs([-d / 2 - 1, 0, 300], 310, 15, 40, 8, TD), voussoirs([d / 2 - 7, 0, 300], 310, 15, 40, 8, TD));
  for (const s of [-1, 1]) {
    out.push(boxBounds([-d / 2 - 12, s < 0 ? -AQ.half : AQ.half - 90, 0], [d / 2 + 12, s < 0 ? -AQ.half + 90 : AQ.half, 60], TD, 3));
    out.push(boxBounds([-d / 2 - 10, s < 0 ? -AQ.half : AQ.half - 102, 282], [d / 2 + 10, s < 0 ? -AQ.half + 102 : AQ.half, 302], TD, 2));
    // the cutwater-like buttress on each face of the pier
    for (const sx of [-1, 1]) out.push(boxBounds([sx < 0 ? -d / 2 - 24 : d / 2, s < 0 ? -AQ.half : AQ.half - 60, 0], [sx < 0 ? -d / 2 : d / 2 + 24, s < 0 ? -AQ.half + 60 : AQ.half, 230], T, 3));
  }
  out.push(boxBounds([-d / 2 - 16, -AQ.half, 700], [d / 2 + 16, AQ.half, 724], TD, 2));
  // the upper tier on top; darker weathered blocks here and there on the piers' faces
  out.push(upperTier(724, rnd));
  for (let i = 0; i < 6; i++) {
    const y = (i % 2 ? 1 : -1) * (AQ.half - 20 - rnd() * 50), z = 80 + rnd() * 520, sx = i < 3 ? -1 : 1;
    out.push(boxBounds([sx * (d / 2) - 2, y - 22, z], [sx * (d / 2) + 2, y + 22, z + 30], TD));
  }
  return merge(...out);
}
function aqueductLow(): Geo {
  const rnd = seeded(183), out: Geo[] = [];
  // a plinth wall with a culvert through it, then the upper tier: its channel 4 m lower than
  // the tall piece's
  out.push(panelX(polyShape(notched(-AQ.half, AQ.half, 0, [{ c: 0, hw: 70, spring: 60 }], 300)), -AQ.d0 / 2 + 10, AQ.d0 - 20, "Westfarm_Travertine"));
  out.push(voussoirs([-AQ.d0 / 2 + 9, 0, 60], 70, 7, 22, 6, "Westfarm_TravertineDark"), voussoirs([AQ.d0 / 2 - 15, 0, 60], 70, 7, 22, 6, "Westfarm_TravertineDark"));
  out.push(boxBounds([-AQ.d0 / 2, -AQ.half, 0], [AQ.d0 / 2, AQ.half, 40], "Westfarm_TravertineDark", 3));
  out.push(boxBounds([-AQ.d0 / 2 + 4, -AQ.half, 300], [AQ.d0 / 2 - 4, AQ.half, 324], "Westfarm_TravertineDark", 2));
  out.push(upperTier(324, rnd));
  return merge(...out);
}
// ซากท่อส่งน้ำพัง: a fallen bay: the pier at its -Y end standing whole with the stub of its
// arches, the other worn down to a stump, the fallen blocks heaped below and scattered.
function aqueductRuin(): Geo {
  const rnd = seeded(187), T = "Westfarm_Travertine", TD = "Westfarm_TravertineDark", d = AQ.d0, out: Geo[] = [];
  // the standing half pier at -Y and the springing of the great arch from it
  const stand = polyShape([[-AQ.half, 0], [-310, 0], [-310, 300], [-298, 380], [-270, 450], [-230, 500], [-200, 530], [-200, 620], [-150, 700], [-120, 760], [-110, 900], [-160, 980], [-200, 1060], [-280, 1100], [-330, 1180], [-AQ.half, 1180]]);
  out.push(panelX(stand, -d / 2, d, T));
  out.push(voussoirs([-d / 2 - 1, 0, 300], 310, 15, 40, 8, TD, 135, 180), voussoirs([d / 2 - 7, 0, 300], 310, 15, 40, 8, TD, 140, 180));
  out.push(boxBounds([-d / 2 - 16, -AQ.half, 700], [d / 2 + 16, -240, 724], TD, 2));
  // the channel wall's stub up top
  out.push(boxBounds([-d / 2 + 30, -AQ.half, 1100], [-d / 2 + 60, -320, 1180], T, 2));
  // the far pier, worn down
  out.push(panelX(polyShape([[310, 0], [AQ.half, 0], [AQ.half, 330], [370, 360], [330, 300], [310, 240]]), -d / 2, d, T));
  out.push(boxBounds([-d / 2 - 12, AQ.half - 90, 0], [d / 2 + 12, AQ.half, 60], TD, 3), boxBounds([-d / 2 - 12, -AQ.half, 0], [d / 2 + 12, -AQ.half + 90, 60], TD, 3));
  // the fallen blocks: a heap in the bay and some thrown wide
  for (let i = 0; i < 22; i++) {
    const heap = i < 12, x = heap ? (rnd() - 0.5) * 300 : (rnd() - 0.5) * 900, y = heap ? -100 + rnd() * 340 : -350 + rnd() * 800;
    const s: V3 = [80 + rnd() * 50, 50 + rnd() * 30, 40 + rnd() * 20];
    out.push(translate(rotateZ(rotateY(box(s, [0, 0, s[2] / 2], rnd() < 0.6 ? T : TD, 4), (rnd() - 0.5) * (heap ? 40 : 16)), rnd() * 360), [x, y, heap ? rnd() * 50 - 10 : -6]));
  }
  // a voussoir or two still in its curve on the ground, grass grown over the heap's foot
  out.push(translate(rotateX(voussoirs([0, 0, 0], 150, 5, 30, 40, TD, 30, 110), 90), [-260, 120, 20]));
  out.push(translate(fieldstone([200, 160, 50], 191, "Westfarm_TravertineDark", 0.3), [40, 60, -10]));
  return mossed(merge(...out), 19, 0.12, 0.5);
}

// บ้านไร่หินโนอา: a farmstead under one long roofline: the two-storey house (stone below, ochre
// render above, green shutters, an outside stair to the upper door under a vine) and its barn
// stepping down from it (two great arches, one with doors, one open on the hay; a loft door).
// About 14.6 x 6.4 m.
function farmhouse(): Geo {
  const S = "Westfarm_Masonry", R = "Westfarm_RenderOchre", X = 320, out: Geo[] = [];
  const Y0 = -620, Y1 = 200, Y2 = 840; // the house from Y0 to Y1, the barn on to Y2
  const H = 640, HB = 450;
  const turn = (g: Geo, deg: number, at: V3): Geo => translate(rotateZ(g, deg), at);
  out.push(boxBounds([-X - 14, Y0 - 14, 0], [X + 14, Y2 + 14, 24], "Westfarm_StoneDark", 3));
  // the house: stone to the first floor, render above, a string course between, quoins
  out.push(wuv(boxBounds([-X, Y0, 24], [X, Y1, 330], S), 1.2), wuv(boxBounds([-X + 2, Y0 + 2, 330], [X - 2, Y1, H], R), 1.4));
  out.push(boxBounds([-X - 8, Y0 - 8, 322], [X + 8, Y1, 340], "Westfarm_StonePale", 2));
  for (const sx of [-1, 1]) out.push(quoins(sx * X, Y0, sx, -1, 24, H, { h: 38 }));
  // its roof: faded terracotta, the ridge along Y, gables at both ends, a chimney
  out.push(translate(rotateZ(gableRoof([Y1 - Y0 + 10, 2 * X, 20], [0, 0, H], 230, 50, "Westfarm_RoofFaded"), 90), [0, (Y0 + Y1) / 2, 0]));
  for (const y of [Y0, Y1]) out.push(turn(gableWall(0, X, H, 230, R), 90, [0, y, 0]));
  out.push(beamBetween([0, Y0 - 60, H + 236], [0, Y1 + 60, H + 236], 22, 16, "Westfarm_StoneDark"));
  out.push(wuv(boxBounds([60, Y0 + 120, H + 60], [140, Y0 + 210, H + 330], "Westfarm_MasonryDark", 2), 1.2), boxBounds([50, Y0 + 110, H + 322], [150, Y0 + 220, H + 342], "Westfarm_StonePale", 2));
  out.push(gableRoof([110, 120, 8], [100, Y0 + 165, H + 342], 30, 4, "Westfarm_RoofFaded"));
  // the front (-X): the door and a window below; the outside stair rising toward -Y to a landing
  // before the upper door (a cellar arch under the landing); windows above
  out.push(translate(doorX(110, 220, { arch: true }), [-X, 80, 24]));
  out.push(translate(windowX(70, 100, { shutters: "Westfarm_Shutter", glass: true }), [-X, -40, 130]));
  const steps = 15, rise = 330 / steps, run = 22, yBot = -100, yLand = yBot - steps * run;
  for (let i = 0; i < steps; i++) out.push(boxBounds([-X - 110, yBot - (i + 1) * run, 24], [-X, yBot - i * run + 1, 24 + (i + 1) * rise], "Westfarm_StonePale", 1.5));
  out.push(wuv(boxBounds([-X - 120, Y0 + 10, 24], [-X, yLand + 1, 354], S), 1.2));
  out.push(boxBounds([-X - 122, (Y0 + yLand) / 2 - 50, 24], [-X - 118, (Y0 + yLand) / 2 + 50, 145], "Westfarm_Dark"));
  out.push(voussoirs([-X - 124, (Y0 + yLand) / 2, 100], 50, 7, 18, 8, "Westfarm_StonePale"));
  out.push(translate(doorX(96, 210), [-X, (Y0 + yLand) / 2, 354]));
  // a low parapet up the stair and along the landing's edge
  out.push(beamBetween([-X - 110, yBot, 64], [-X - 110, yLand, 386], 16, 30, "Westfarm_StonePale"));
  out.push(boxBounds([-X - 126, Y0 + 10, 354], [-X - 108, yLand, 392], "Westfarm_StonePale", 2));
  // the pergola over the landing, a vine trained over it
  for (const y of [Y0 + 20, yLand - 10]) out.push(cylinderAt({ radius: 6, height: 230, segments: 6, bottom: [-X - 112, y, 354] }, "Westfarm_OldWood"));
  for (let y = Y0 + 20; y <= yLand; y += 55) out.push(beamBetween([-X - 132, y, 584], [-X + 6, y, 596], 7, 7, "Westfarm_OldWood"));
  out.push(shrub({ seed: 197, leaf: 24, look: VINE, ragged: 0.6, core: 0.55, lobes: [[-X - 70, (Y0 + yLand) / 2, 604, 70, 110, 24], [-X - 112, yLand - 10, 470, 18, 22, 110]] }));
  for (const y of [-470, -140, 120]) out.push(translate(windowX(66, 110, { shutters: "Westfarm_Shutter", glass: true }), [-X, y, 430]));
  // the barn: stone, lower, two great arches on its front (doors in one, hay in the other), a
  // loft door between them, its own roof
  out.push(wuv(boxBounds([-X + 28, Y1, 24], [X - 10, Y2, HB], S), 1.2));
  const barnArches = [{ c: 370, hw: 120, spring: 176 }, { c: 650, hw: 120, spring: 176 }];
  out.push(translate(panelX(polyShape(notched(Y1 + 1, Y2, 0, barnArches, HB - 24)), -X, 28, S), [0, 0, 24]));
  for (const n of barnArches) out.push(voussoirs([-X - 2, n.c, 24 + n.spring], 120, 11, 26, 10, "BrickRed"));
  for (const n of barnArches) out.push(boxBounds([-X + 24, n.c - 121, 24], [-X + 27, n.c + 121, 24 + n.spring + 121], "Westfarm_Dark"));
  out.push(boxBounds([-X + 6, 252, 24], [-X + 12, 368, 290], "DoorWood"), translate(rotateZ(boxBounds([0, 0, 24], [6, 116, 290], "DoorWood"), -50), [-X + 6, 372, 0]));
  out.push(translate(lump([0, 0, 0], [34, 108, 96], 199, "Westfarm_Hay", 1, 0.2), [-X + 30, 650, 24]));
  out.push(translate(windowX(90, 90, { frame: "WoodDark" }), [-X, 510, 334]), translate(lump([0, 0, 0], [20, 40, 24], 203, "Westfarm_Hay", 0, 0.2), [-X - 4, 510, 340]));
  out.push(translate(rotateZ(gableRoof([Y2 - Y1 + 30, 2 * X - 20, 18], [0, 0, HB], 170, 46, "Westfarm_RoofFaded"), 90), [0, (Y1 + Y2) / 2 + 10, 0]));
  out.push(turn(gableWall(0, X - 10, HB, 170, S), 90, [0, Y2, 0]));
  out.push(beamBetween([0, Y1, HB + 174], [0, Y2 + 40, HB + 174], 20, 14, "Westfarm_StoneDark"));
  for (const sx of [-1, 1]) out.push(quoins(sx * (sx < 0 ? X : X - 10), Y2, sx, 1, 24, HB, { h: 38 }));
  // round the back and the far end: windows, a small one in the barn
  for (const y of [-400, -100]) out.push(turn(windowX(60, 90, { shutters: "Westfarm_Shutter", glass: true }), 180, [X, y, 430]));
  out.push(turn(windowX(70, 50, {}), 180, [X - 10, 560, 300]));
  out.push(turn(windowX(60, 90, { shutters: "Westfarm_Shutter", glass: true }), 90, [0, Y0, 430]), turn(windowX(60, 80, { shutters: "Westfarm_Shutter", glass: true }), 90, [0, Y0, 130]));
  return merge(...out);
}

// ศาลพระริมทาง: a wayside shrine: a stone pier with a niche under a little tiled gable, a gilt
// figure in it, candles and flowers on the ledge, a kneeling step before it. About 3.2 m tall.
function waysideShrine(): Geo {
  const S = "Westfarm_StonePale", out: Geo[] = [];
  out.push(boxBounds([-70, -70, 0], [70, 70, 26], "Westfarm_StoneDark", 3), boxBounds([-56, -56, 26], [56, 56, 50], S, 3));
  out.push(wuv(boxBounds([-44, -44, 50], [44, 44, 260], "Westfarm_Masonry"), 1));
  // the niche: an arched recess facing -X, a ledge before it
  out.push(boxBounds([-47, -30, 130], [-40, 30, 222], "Westfarm_Dark"));
  out.push(voussoirs([-46, 0, 196], 30, 7, 10, 8, S));
  for (const s of [-1, 1]) out.push(boxBounds([-50, s * 30 - (s < 0 ? 10 : 0), 130], [-42, s * 30 + (s > 0 ? 10 : 0), 196], S, 1));
  out.push(boxBounds([-62, -44, 120], [-38, 44, 132], S, 2));
  // the figure: a small gilt saint
  out.push(cylinderAt({ rBot: 13, rTop: 8, height: 46, segments: 8, bottom: [-30, 0, 132] }, "Westfarm_Gilt"), sphereCenter(8, [-30, 0, 186], "Westfarm_Gilt", 8));
  out.push(translate(rotateY(cylinderAt({ radius: 13, height: 1.5, segments: 12, bottom: [0, 0, 0] }, "Westfarm_Gilt"), 90), [-22, 0, 190]));
  // candles and a jar of flowers on the ledge
  for (const y of [-30, 30]) out.push(cylinderAt({ radius: 3, height: 14, segments: 6, bottom: [-52, y, 132] }, "FabricWhite"), sphereCenter(2.4, [-52, y, 149], "LanternGlow", 5));
  out.push(cylinderAt({ rBot: 6, rTop: 8, height: 14, segments: 8, bottom: [-50, 14, 132] }, "RoofTerracotta"));
  out.push(shrub({ seed: 211, leaf: 9, look: HERB, core: 0, ragged: 0.9, lobes: [[-50, 14, 156, 10, 10, 10]], flowers: { cells: [FLOWER_CELLS.roseRed, FLOWER_CELLS.daisy], n: 6, size: 8, up: 0.8 } }));
  // the cornice and the little gable roof
  out.push(boxBounds([-56, -56, 256], [56, 56, 272], S, 2));
  out.push(gableRoof([140, 124, 8], [0, 0, 272], 50, 10, "Westfarm_RoofFaded"));
  for (const x of [-70, 70]) out.push(gableWall(x, 62, 272, 50, S));
  out.push(cylinderAt({ radius: 3, height: 40, segments: 6, bottom: [0, 0, 320] }, "IronDark"), box([3, 22, 3], [0, 0, 348], "IronDark"));
  // the kneeling step and posies left on it
  out.push(boxBounds([-130, -50, 0], [-80, 50, 16], S, 2));
  out.push(shrub({ seed: 213, leaf: 10, look: HERB, core: 0, ragged: 0.9, lobes: [[-100, -30, 22, 12, 12, 8]], flowers: { cells: [FLOWER_CELLS.buttercup, FLOWER_CELLS.forgetMeNot], n: 5, size: 9, up: 0.8 } }));
  return mossed(merge(...out), 23, 0.1, 0.4);
}

// ---- the stone bridge ----
// สะพานหินโค้ง: a humpbacked bridge for the royal road, 13 m long (along X) and 5.4 m wide: one
// wide segmental arch over the water, pilasters at its ends, a cobbled way between parapets
// ending in pillars with stone balls, wing walls along both banks. Its deck rises from 0 at the
// ends to about 1 m in the middle along BRIDGE.deck, the rise of a hill of height BRIDGE.H and
// radius BRIDGE.R with the bridge's middle on its top: a field puts that hill where the bridge
// goes (so whoever walks over it follows the deck), sinks the bridge by BRIDGE.sink (the hill's
// height at the bridge's ends) and runs a river BRIDGE.river wide under it. Below 0 its body
// reaches down into the water.
const HILL = (d: number) => 75 * (1 + Math.cos((Math.PI * Math.min(d, 1100)) / 1100));
export const BRIDGE = {
  H: 150, R: 1100, L: 650, river: 560,
  hill: HILL,
  sink: HILL(650),
  deck: (x: number): number => HILL(Math.abs(x)) - HILL(650),
};
function stoneBridge(): Geo {
  const S = "Westfarm_Masonry", SP = "Westfarm_StonePale", SD = "Westfarm_StoneDark", out: Geo[] = [];
  const L = BRIDGE.L, W = 270, deck = BRIDGE.deck, water = -14 - BRIDGE.sink, foot = water - 60;
  // the body seen from the side (x along, z up), the arch cut up into it from below the water
  const half = BRIDGE.river / 2 + 20; // the arch's ends, just past the banks
  const crown = deck(0) - 34, sag = crown - water;
  const Rm = (half * half + sag * sag) / (2 * sag), cz = crown - Rm, a0 = Math.asin(half / Rm);
  const prof: [number, number][] = [];
  for (let i = 26; i >= 0; i--) {
    const x = -L + (i / 26) * 2 * L;
    prof.push([x, deck(x) - 6]);
  }
  const arc: [number, number][] = [];
  for (let i = 0; i <= 16; i++) {
    const t = Math.PI / 2 + a0 - (i / 16) * 2 * a0;
    arc.push([Rm * Math.cos(t), cz + Rm * Math.sin(t)]);
  }
  const body = polyShape([[-L, foot], [-half, foot], ...arc, [half, foot], [L, foot], ...prof]);
  out.push(panelY(body, -W, 2 * W, S));
  // the arch ring on both faces, a pilaster at each end of it
  const n = 15, step = (2 * a0) / n;
  for (const y of [-W - 4, W - 6]) {
    for (let i = 0; i < n; i++) {
      const a = Math.PI / 2 - a0 + step * (i + 0.5), rm = Rm + 17;
      out.push(translate(rotateY(box([2 * (Rm + 34) * Math.sin(step / 2) * 1.04, 10, 34], [0, 0, 0], SP, 2), 90 - a / D), [Math.cos(a) * rm, y + 5, cz + Math.sin(a) * rm]));
    }
    for (const sx of [-1, 1]) {
      const x = sx * (half + 46), top = deck(x) - 4;
      out.push(boxBounds([x - 34, y < 0 ? -W - 34 : W - 2, foot], [x + 34, y < 0 ? -W + 2 : W + 34, top], SP, 3));
      out.push(boxBounds([x - 40, y < 0 ? -W - 40 : W - 2, top], [x + 40, y < 0 ? -W + 2 : W + 40, top + 14], SD, 2));
    }
  }
  // the deck: cobbles between kerbs (a hair over the ground the bridge is set into), the
  // parapets with their coping, in short straight runs along the hump
  for (let i = 0; i < 26; i++) {
    const xa = -L + (i / 26) * 2 * L, xb = -L + ((i + 1) / 26) * 2 * L;
    const za = deck(xa) + 5, zb = deck(xb) + 5;
    out.push(beamBetween([xa - 1, 0, za - 4], [xb + 1, 0, zb - 4], 2 * W - 60, 8, "Westfarm_Cobble"));
    for (const s of [-1, 1]) {
      out.push(beamBetween([xa - 1, s * (W - 15), za + 36], [xb + 1, s * (W - 15), zb + 36], 30, 80, S));
      out.push(beamBetween([xa - 1, s * (W - 15), za + 80], [xb + 1, s * (W - 15), zb + 80], 40, 12, SP));
      out.push(beamBetween([xa - 1, s * (W - 36), za + 2], [xb + 1, s * (W - 36), zb + 2], 14, 10, SD));
    }
  }
  // pillars at the four ends of the parapets, with stone balls
  for (const sx of [-1, 1]) for (const s of [-1, 1]) {
    out.push(boxAt([56, 56, 112], [sx * (L - 24), s * (W - 15), -6], SP, 3), boxAt([66, 66, 12], [sx * (L - 24), s * (W - 15), 106], SD, 2));
    out.push(sphereCenter(20, [sx * (L - 24), s * (W - 15), 136], SP, 10));
  }
  // wing walls along both banks, standing in the water's edge, their tops following the rise
  for (const sx of [-1, 1]) for (const s of [-1, 1]) {
    const x = sx * (BRIDGE.river / 2 - 6);
    for (let k = 0; k < 9; k++) {
      const ya = s * (W + k * 60), yb = s * (W + (k + 1) * 60);
      const top = Math.max(BRIDGE.hill(Math.hypot(x, ya)), BRIDGE.hill(Math.hypot(x, yb))) - BRIDGE.sink + 4;
      out.push(boxBounds([x - 26, Math.min(ya, yb), foot], [x + 26, Math.max(ya, yb), top], S, 2));
      out.push(boxBounds([x - 32, Math.min(ya, yb) - 1, top], [x + 32, Math.max(ya, yb) + 1, top + 10], SP, 2));
    }
  }
  return merge(...out);
}

// ต้นสนไซเปรส: a tall narrow cypress, dark and dense, a flame of a tree (about 9 m).
function cypress(): THREE.Object3D {
  return crownTreeObject({
    seed: 223, trunk: [[0, 0, 0], [0, 0, 160]], radius: 15, leaf: 30,
    look: { card: "fine", dark: [30, 60, 34], mid: [46, 88, 46], light: [90, 132, 66], core: "CanopyCoreFir" },
    crowns: [[0, 0, 250, 92, 88, 170], [4, -2, 450, 80, 78, 150], [-2, 4, 640, 62, 60, 130], [2, 0, 800, 36, 36, 90]],
    lobes: 5, twigs: 0, density: 1.15,
  });
}

// ---- the dry plains ----
// ดินแตกระแหง: a patch of dried mud about 6 x 5 m split into plates, their edges curling up.
function crackedEarth(): Geo {
  const rnd = seeded(229), step = 34, pos: number[] = [];
  const nx = 19, ny = 16, P: V3[][] = [];
  for (let i = 0; i <= nx; i++) {
    P.push([]);
    for (let j = 0; j <= ny; j++) P[i].push([-nx * step / 2 + i * step + (rnd() - 0.5) * step * 0.8, -ny * step / 2 + j * step + (rnd() - 0.5) * step * 0.8, 0]);
  }
  const inside = (x: number, y: number) => (x / 300) ** 2 + (y / 250) ** 2 < 0.9 + 0.2 * Math.sin(Math.atan2(y, x) * 3 + 1);
  const quad = (a: V3, b: V3, c: V3, d: V3) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++) {
      const c = [P[i][j], P[i + 1][j], P[i + 1][j + 1], P[i][j + 1]];
      const mx = c.reduce((t, p) => t + p[0], 0) / 4, my = c.reduce((t, p) => t + p[1], 0) / 4;
      if (!inside(mx, my) || (!inside(mx * 1.15, my * 1.15) && rnd() < 0.5)) continue;
      // the plate: shrunk from its corners (the crack), the corners curled up a little
      const k = 0.84 - rnd() * 0.08, h = 2 + rnd() * 2;
      const top = c.map((p) => [mx + (p[0] - mx) * k, my + (p[1] - my) * k, h + rnd() * 2.5] as V3);
      const bot = c.map((p) => [mx + (p[0] - mx) * k, my + (p[1] - my) * k, -1] as V3);
      quad(top[0], top[1], top[2], top[3]);
      for (let e = 0; e < 4; e++) {
        const f = (e + 1) % 4;
        quad(bot[e], bot[f], top[f], top[e]);
      }
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  const parts: Geo = [{ geo, mat: "Westfarm_Mud" }];
  return merge(wuv(parts, 1.5), translate(fieldstone([30, 24, 10], 231, "Westfarm_MudDark"), [120, -80, -2]), translate(fieldstone([22, 18, 8], 233, "Westfarm_MudDark"), [-160, 90, -2]));
}

// A camel kneeling to rest, its legs folded under it, a saddle blanket and bags on its hump.
function camel(): Geo {
  const C = "Westfarm_Camel", CD = "Westfarm_CamelDark", out: Geo[] = [];
  out.push(lump([0, 0, 52], [92, 44, 40], 241, C, 1, 0.08, 40), lump([-6, 0, 92], [42, 34, 34], 243, C, 1, 0.1, 40));
  // the folded legs under it
  for (const [x, y] of [[-50, -36], [-50, 36], [50, -36], [50, 36]] as [number, number][]) out.push(translate(scale(sphereCenter(22, [0, 0, 0], CD, 8), [1.6, 0.6, 0.55]), [x, y, 12]));
  // the neck curving up, the head
  out.push(cylinderBetween([-70, 0, 66], [-112, 0, 110], 18, 8, C, 14), cylinderBetween([-112, 0, 110], [-118, 0, 150], 14, 8, C, 12));
  out.push(translate(scale(sphereCenter(18, [0, 0, 0], C, 10), [1.7, 0.85, 0.9]), [-136, 0, 160]));
  out.push(translate(scale(sphereCenter(9, [0, 0, 0], CD, 8), [1.2, 1, 0.8]), [-160, 0, 154]));
  for (const s of [-1, 1]) out.push(translate(scale(sphereCenter(5, [0, 0, 0], CD, 6), [0.8, 0.6, 1.4]), [-124, s * 14, 176]));
  // the blanket and the bags, a rope halter
  out.push(translate(scale(cylinderAt({ radius: 50, height: 6, segments: 10, bottom: [0, 0, 0] }, "Westfarm_Blanket"), [1, 1.05, 1]), [-6, 0, 118]));
  for (const s of [-1, 1]) out.push(translate(lump([0, 0, 0], [26, 14, 30], 245 + s, "FabricSand", 0, 0.15, 30), [-8, s * 46, 48]));
  out.push(beamBetween([-146, -12, 160], [-146, 12, 160], 3, 3, "RopeTan"));
  return merge(...out);
}
// หลักผูกอูฐ: a hitching rail for camels: two posts and a crossbar worn smooth, ropes, a stone
// trough, one camel resting by it.
function camelPost(): Geo {
  const W = "Westfarm_OldWood", out: Geo[] = [];
  for (const y of [-140, 140]) out.push(cylinderAt({ rBot: 11, rTop: 9, height: 130, segments: 7, bottom: [0, y, 0] }, W), cylinderAt({ radius: 16, height: 10, segments: 7, bottom: [0, y, 0] }, "Westfarm_FortStoneDark"));
  out.push(cylinderBetween([0, -158, 112], [0, 158, 112], 7, 7, W));
  for (const [y, len] of [[-90, 60], [-30, 90], [60, 70]] as [number, number][]) out.push(cylinderBetween([0, y, 112], [-8, y + 6, 112 - len], 1.6, 4, "RopeTan"));
  // the trough
  out.push(boxBounds([60, -120, 0], [120, 120, 48], "Westfarm_FortStone", 3), boxBounds([66, -112, 30], [114, 112, 44], "Westfarm_Water"));
  // the camel, kneeling beside it
  out.push(translate(rotateZ(camel(), 15), [-110, 40, 0]));
  return merge(...out);
}

// ---- the abandoned fort ----
// A jagged top for a wall seen from its side: merlons along it (some fallen), lower where `low`.
function battlement(y0: number, y1: number, z: number, rnd: () => number, low: (y: number) => number = () => 0): [number, number][] {
  const pts: [number, number][] = [];
  const pitch = 100, n = Math.round((y1 - y0) / pitch);
  for (let i = 0; i < n; i++) {
    const a = y0 + i * pitch, b = a + pitch, m = a + pitch * 0.45;
    const drop = low((a + b) / 2), gone = rnd() < 0.22 || drop > 0;
    const zt = z - drop;
    if (gone) {
      pts.push([a, zt - rnd() * 20], [b, zt - rnd() * 20]);
    } else {
      pts.push([a, zt], [m, zt], [m, zt + 62 - rnd() * 10], [b - 6, zt + 62 - rnd() * 10], [b - 6, zt], [b, zt]);
    }
  }
  return pts;
}
// กำแพงป้อมร้าง: a stretch of the fort's curtain wall, 6 m long, 5.3 m to the merlons: dressed
// sandstone on a battered plinth, a walkway's corbels inside, merlons along the top (some gone),
// a breach worn into its top, sand drifted against its foot.
function fortWall(): Geo {
  const rnd = seeded(251), F = "Westfarm_FortStone", FD = "Westfarm_FortStoneDark", L = 300, T = 120, Z = 470, out: Geo[] = [];
  const low = (y: number) => Math.max(0, 140 - Math.abs(y - 90) * 1.4);
  const topPts = battlement(-L, L, Z, rnd, low);
  out.push(panelX(polyShape([[-L, 0], [L, 0], ...[...topPts].reverse()], [rectPath(-170, 280, -158, 360), rectPath(150, 250, 162, 330)]), -T / 2, T, F));
  out.push(boxBounds([-T / 2 - 22, -L, 0], [T / 2 + 22, L, 60], FD, 4), boxBounds([-T / 2 - 12, -L, 60], [T / 2 + 12, L, 90], FD, 3));
  // a string course outside, corbels for the walkway inside
  out.push(boxBounds([-T / 2 - 8, -L, 330], [-T / 2, L, 344], FD, 2));
  for (let y = -L + 50; y < L; y += 100) if (low(y) < 40) out.push(boxBounds([T / 2, y - 14, 360], [T / 2 + 34, y + 14, 386], FD, 2));
  // eroded blocks: some faces fallen in, the drift of sand at the foot both sides
  for (let i = 0; i < 5; i++) out.push(boxBounds([-T / 2 - 2, -L + 40 + rnd() * (2 * L - 120), 100 + rnd() * 260], [-T / 2 + 6, -L + 100 + rnd() * (2 * L - 120), 130 + rnd() * 280], FD));
  for (const s of [-1, 1]) out.push(translate(scale(lump([0, 0, 0], [70, L + 20, 34], 253 + s, "Westfarm_Sand", 1, 0.2, 60), [1, 1, 1]), [s * (T / 2 + 30), 0, -6]));
  for (let i = 0; i < 4; i++) out.push(translate(rotateZ(box([60, 40, 34], [0, 0, 14], rnd() < 0.5 ? F : FD, 4), rnd() * 360), [-T / 2 - 60 - rnd() * 120, 40 + (rnd() - 0.5) * 220, -4]));
  return merge(...out);
}
// หอมุมป้อมร้าง: a corner tower of the fort, 5.2 m square and 7 m tall: battered base, slits,
// merlons on top with one corner fallen and its stones heaped below.
function fortTower(): Geo {
  const rnd = seeded(257), F = "Westfarm_FortStone", FD = "Westfarm_FortStoneDark", X = 260, Z = 640, out: Geo[] = [];
  for (let k = 0; k < 4; k++) {
    const low = (y: number) => (k === 1 ? Math.max(0, 220 - (y + X) * 0.9) : 0);
    const slit = (y: number, z: number) => rectPath(y - 8, z, y + 8, z + 100);
    const face = panelX(polyShape([[-X, 0], [X, 0], ...[...battlement(-X, X, Z, rnd, low)].reverse()], [slit(-60, 250), slit(80, 420)]), -X, 90, F);
    out.push(rotateZ(face, k * 90));
  }
  out.push(boxBounds([-X - 40, -X - 40, 0], [X + 40, X + 40, 70], FD, 5), boxBounds([-X - 22, -X - 22, 70], [X + 22, X + 22, 120], FD, 4));
  out.push(boxBounds([-X - 10, -X - 10, Z - 70], [X + 10, X + 10, Z - 52], FD, 2));
  for (let i = 0; i < 9; i++) out.push(translate(rotateZ(rotateY(box([70, 46, 40], [0, 0, 18], rnd() < 0.5 ? F : FD, 4), (rnd() - 0.5) * 30), rnd() * 360), [-X - 70 - rnd() * 150, X - rnd() * 300, -4]));
  out.push(translate(lump([0, 0, 0], [120, 200, 50], 259, "Westfarm_Sand", 1, 0.2, 60), [-X - 80, 60, -10]));
  return merge(...out);
}
// ประตูป้อมร้าง: the fort's gatehouse, 6.4 m wide: a round-arched passage 3.2 m wide through a
// block crowned with merlons, flanking buttresses, one leaf of the gate fallen in, the other
// hanging on a single hinge.
function fortGate(): Geo {
  const rnd = seeded(263), F = "Westfarm_FortStone", FD = "Westfarm_FortStoneDark", Y = 320, T = 300, Z = 560, out: Geo[] = [];
  out.push(panelX(polyShape(notched(-Y, Y, 0, [{ c: 0, hw: 160, spring: 240 }], [...battlement(-Y, Y, Z, rnd)].reverse(), 14)), -T / 2, T, F));
  for (const x of [-T / 2 - 4, T / 2 - 6]) out.push(voussoirs([x, 0, 240], 160, 11, 34, 10, FD));
  for (const s of [-1, 1]) {
    out.push(boxBounds([-T / 2 - 50, s < 0 ? -Y : Y - 70, 0], [-T / 2, s < 0 ? -Y + 70 : Y, 420], FD, 4));
    out.push(boxBounds([-T / 2 - 14, s < 0 ? -Y + 70 : 160, 0], [-T / 2, s < 0 ? -160 : Y - 70, 60], FD, 3));
  }
  out.push(boxBounds([-T / 2 - 12, -Y, 470], [T / 2 + 12, Y, 488], FD, 2));
  // the gate: one leaf down on the ground inside, the other hanging askew
  const leaf = (): Geo => merge(boxBounds([0, 0, 0], [10, 150, 290], "WoodDark"), ...[40, 140, 240].map((z) => boxBounds([-3, 6, z], [0, 144, z + 12], "IronDark")));
  out.push(translate(rotateY(leaf(), 82), [40, -150, 4]));
  out.push(translate(rotateZ(rotateX(leaf(), 8), -40), [-T / 2 + 30, 150, 10]));
  // sand blown in through the passage, stones fallen
  out.push(translate(lump([0, 0, 0], [T / 2 + 40, 110, 12], 265, "Westfarm_Sand", 1, 0.2, 60), [20, 30, -6]));
  for (let i = 0; i < 5; i++) out.push(translate(rotateZ(box([60, 40, 34], [0, 0, 14], rnd() < 0.5 ? F : FD, 4), rnd() * 360), [-T / 2 - 80 - rnd() * 100, (rnd() < 0.5 ? -1 : 1) * (200 + rnd() * 150), -4]));
  return merge(...out);
}

// โครงกระดูกสัตว์ยักษ์: the bleached skeleton of some huge beast, about 11 m long, half sunk in
// the dust: the spine arching out of the ground, great ribs curving up over head height, the
// horned skull lying at its front (-X) end, bones scattered.
function giantSkeleton(): Geo {
  const rnd = seeded(271), B = "Westfarm_Bone", BS = "Westfarm_BoneShade", out: Geo[] = [];
  const spine = (t: number): V3 => [-420 + t * 900, Math.sin(t * 2.4) * 40, 40 + Math.sin(t * Math.PI) * 170 - t * 60];
  for (let i = 0; i <= 26; i++) {
    const t = i / 26, p = spine(t), s = 1 - t * 0.55;
    out.push(translate(box([30 * s, 36 * s, 34 * s], [0, 0, 0], B, 3), p));
    out.push(translate(box([10 * s, 10 * s, 44 * s], [0, 0, 26 * s], BS, 2), p));
    if (i > 0) out.push(cylinderBetween(spine((i - 1) / 26), p, 9 * s, 6, BS));
  }
  // the ribs: arcs from the spine curving out and down into the ground, a few broken
  for (let k = 0; k < 9; k++) {
    const t = 0.12 + k * 0.075, p = spine(t), span = 230 - Math.abs(k - 3) * 18, rise = 120 - k * 6;
    for (const s of [-1, 1]) {
      if ((k === 5 && s > 0) || (k === 7 && s < 0)) continue;
      const pts: V3[] = [];
      const end = k === 2 && s > 0 ? 0.55 : 1;
      for (let j = 0; j <= 8; j++) {
        const u = (j / 8) * end, a = u * Math.PI * 0.95;
        pts.push([p[0] + u * 30, p[1] + s * Math.sin(a) * span * 0.9, p[2] + Math.sin(a * 0.75 + 0.35) * rise - u * (p[2] + rise * 0.3) - 8]);
      }
      for (let j = 0; j < 8; j++) out.push(cylinderBetween(pts[j], pts[j + 1], 11 - j * 0.8, 6, j % 3 ? B : BS, 10.2 - j * 0.8));
    }
  }
  // the skull: long, horned, its jaw apart, half in the dust
  const sk: V3 = [-560, -30, 40];
  out.push(translate(rotateZ(scale(sphereCenter(70, [0, 0, 0], B, 12), [1.6, 1, 0.75]), 8), sk));
  out.push(translate(rotateZ(scale(sphereCenter(42, [0, 0, 0], B, 10), [1.6, 0.8, 0.6]), 8), [sk[0] - 110, sk[1] - 14, sk[2] - 10]));
  for (const s of [-1, 1]) {
    out.push(sphereCenter(18, [sk[0] - 30, sk[1] + s * 52, sk[2] + 20], "Westfarm_Dark", 8));
    out.push(cylinderBetween([sk[0] + 30, sk[1] + s * 50, sk[2] + 30], [sk[0] + 120, sk[1] + s * 150, sk[2] + 110], 16, 7, BS, 10));
    out.push(cylinderBetween([sk[0] + 120, sk[1] + s * 150, sk[2] + 110], [sk[0] + 110, sk[1] + s * 200, sk[2] + 210], 10, 7, B, 2));
  }
  out.push(translate(rotateZ(rotateY(scale(box([200, 40, 22], [0, 0, 0], BS, 4), [1, 1, 1]), -12), 30), [sk[0] - 70, sk[1] + 120, 12]));
  // scattered bones and the dust heaped against them
  for (let i = 0; i < 6; i++) out.push(translate(rotateZ(merge(cylinderBetween([-50, 0, 8], [50, 0, 8], 7, 6, B), sphereCenter(11, [-52, 0, 8], B, 6), sphereCenter(11, [52, 0, 8], B, 6)), rnd() * 360), [-300 + rnd() * 800, (rnd() - 0.5) * 520, 0]));
  out.push(translate(lump([0, 0, 0], [260, 140, 36], 273, "Westfarm_Sand", 1, 0.2, 60), [-80, 0, -14]), translate(lump([0, 0, 0], [140, 110, 30], 275, "Westfarm_Sand", 1, 0.2, 60), [sk[0] + 20, sk[1], -12]));
  return merge(...out);
}

// ================= helpers for the west lands' fields =================
export type XY = [number, number];

// a smooth line through the points (Catmull-Rom), a point every ~step cm
export function smooth(pts: XY[], step = 200): XY[] {
  const out: XY[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const n = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// a strip `width` across along a polyline
export function band(pts: XY[], width: number): XY[] {
  const left: XY[] = [], right: XY[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    left.push([pts[i][0] - (dy / L) * (width / 2), pts[i][1] + (dx / L) * (width / 2)]);
    right.push([pts[i][0] + (dy / L) * (width / 2), pts[i][1] - (dx / L) * (width / 2)]);
  }
  return [...left, ...right.reverse()];
}
// A plateau's outline cut into short sides near the walkable box (each side is one cliff solid,
// and the monsters keep clear of a solid's whole length), long ones far out in the rim.
export function dense(poly: XY[], max = 600, bound = 5500): XY[] {
  const out: XY[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const far = Math.max(Math.abs((a[0] + b[0]) / 2), Math.abs((a[1] + b[1]) / 2)) > bound + 1500;
    const n = Math.max(1, Math.ceil(L / (far ? max * 3 : max)));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}
// an uneven ellipse
export function blob(c: XY, rx: number, ry: number, seed: number, n = 20, wob = 0.1): XY[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, w = 1 + wob * Math.sin(a * 3 + seed) + wob * 0.6 * Math.cos(a * 5 + seed * 2);
    return [c[0] + Math.cos(a) * rx * w, c[1] + Math.sin(a) * ry * w] as XY;
  });
}
export function inPoly(poly: XY[], x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// the distance from a point to a polyline
export function toLine(x: number, y: number, pts: XY[]): number {
  let d = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / L2));
    d = Math.min(d, Math.hypot(ax + (bx - ax) * t - x, ay + (by - ay) * t - y));
  }
  return d;
}
// the point of a polyline nearest p, and the line's direction there
export function nearestOn(pts: XY[], p: XY): { at: XY; dir: XY } {
  let best = { d: Infinity, at: p, dir: [1, 0] as XY };
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay) || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - ax) * (bx - ax) + (p[1] - ay) * (by - ay)) / (L * L)));
    const q: XY = [ax + (bx - ax) * t, ay + (by - ay) * t], d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < best.d) best = { d, at: q, dir: [(bx - ax) / L, (by - ay) / L] };
  }
  return { at: best.at, dir: best.dir };
}
// the heading that turns an item's front (-X) toward (dx, dy), and the one that lays its own Y
// along (dx, dy)
export const towards = (dx: number, dy: number): number => (Math.atan2(-dy, -dx) * 180) / Math.PI;
export const lengthwise = (dx: number, dy: number): number => (Math.atan2(-dx, dy) * 180) / Math.PI;
// a point d along from a toward b
export function along(a: XY, b: XY, d: number): XY {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [a[0] + ((b[0] - a[0]) / L) * d, a[1] + ((b[1] - a[1]) / L) * d];
}

// A dry-stone wall along a polyline in pieces of about 4 m: none where `skip` says (a track
// crossing, a cliff), none where the ground falls away too much along a piece, a tumbled one
// where it falls a little (and now and then anyway); each piece sunk by half the fall along it,
// so its low end still meets the ground.
export function wallRun(f: FieldBuilder, pts: XY[], o: { skip?: (x: number, y: number) => boolean; broken?: number } = {}): void {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.round(L / 400)), len = L / n, ux = (bx - ax) / L, uy = (by - ay) / L;
    for (let k = 0; k < n; k++) {
      const c: XY = [ax + ux * len * (k + 0.5), ay + uy * len * (k + 0.5)];
      if (o.skip?.(c[0], c[1]) || !f.level(c[0], c[1], 120)) continue;
      const h0 = f.h(c[0] - (ux * len) / 2, c[1] - (uy * len) / 2), h1 = f.h(c[0] + (ux * len) / 2, c[1] + (uy * len) / 2), fall = Math.abs(h1 - h0);
      if (fall > 50) continue;
      const broken = fall > 28 || f.rnd() < (o.broken ?? 0.12);
      f.put(broken ? "westfarm:drystone_wall_broken" : "westfarm:drystone_wall", c, lengthwise(ux, uy) + (f.rnd() < 0.5 ? 180 : 0), { sy: len / 400, z: -fall / 2 - 3 });
    }
  }
}

// ---- the sample: a corner of the downs where they meet the farmland south of Noa ----
function sample(put: Put): void {
  const rnd = seeded(301);
  // the aqueduct striding across the back, its last bay fallen
  for (const y of [-1600, -800, 0, 800]) put("aqueduct", [1750, y, 0], 0);
  put("aqueduct_ruin", [1750, 1600, 0], 0);
  // vines in rows on the west side, the farmstead beyond them
  for (let i = 0; i < 5; i++) put("vineyard_row", [-50 + i * 250, 1450, 0], 0);
  put("farmhouse", [-1500, 1750, 0], 90);
  put("cypress", [-650, 2050, 0], 0, 1.05);
  put("cypress", [-650, 900, 0], 40, 0.95);
  // a dry-stone wall across the middle (one stretch tumbled), the sheepfold and the flocks
  for (const y of [-1700, -1300, -500, -100, 300]) put("drystone_wall", [300, y, 0], 0);
  put("drystone_wall_broken", [300, -900, 0], 0);
  put("sheepfold", [1000, -1000, 0], 90);
  put("sheep_flock", [-250, -500, 0], 30);
  put("sheep_flock", [750, 50, 0], -60, 0.9);
  // the shepherd's hut and the old windmill on the east side, the shrine by the way
  put("shepherd_hut", [-350, -1750, 0], 0);
  put("stone_windmill", [-1350, -1550, 0], 20, 0.6);
  put("wayside_shrine", [-700, 300, 0], 0);
  put("flora:BigOak", [-350, 1050, 0], 30, 0.75);
  for (let i = 0; i < 12; i++) put("wildflowers", [-2000 + rnd() * 1900, -2000 + rnd() * 2600, 0], rnd() * 360, 0.7 + rnd() * 0.5);
  // and in front, the dry plains beginning: cracked mud, a camel at its post, old bones
  put("cracked_earth", [-1950, -650, 0], 20);
  put("camel_post", [-1900, 150, 0], 90);
  put("giant_skeleton", [-1950, 950, 0], 80, 0.5);
}

const items: KitItem[] = [
  { id: "drystone_wall", name: "กำแพงหินเรียง (4 ม.)", make: drystoneWall, tags: ["wall"] },
  { id: "drystone_wall_broken", name: "กำแพงหินพัง (4 ม.)", make: drystoneWallBroken, tags: ["wall"] },
  { id: "sheepfold", name: "คอกแกะหินกลม", make: sheepfold, tags: ["fence", "landmark"] },
  { id: "shepherd_hut", name: "กระท่อมคนเลี้ยงแกะ", make: shepherdHut, tags: ["building"] },
  { id: "sheep_flock", name: "ฝูงแกะ", make: sheepFlock, tags: ["decor", "animal"] },
  { id: "stone_windmill", name: "กังหันลมหินเก่า", make: stoneWindmill, tags: ["landmark", "building"] },
  { id: "watchtower_ruin", name: "ซากหอสังเกตการณ์โบราณ", make: watchtowerRuin, tags: ["landmark", "tower"] },
  { id: "wildflowers", name: "ดงดอกไม้ป่า", make: wildflowers, tags: ["ground", "plant"] },
  { id: "vineyard_row", name: "แถวเถาองุ่น (8 ม.)", make: vineyardRow, tags: ["fence", "plant"] },
  { id: "aqueduct", name: "ท่อส่งน้ำโบราณ (8 ม.)", make: aqueductTall, tags: ["landmark", "wall"] },
  { id: "aqueduct_low", name: "ท่อส่งน้ำบนสันเนิน (8 ม.)", make: aqueductLow, tags: ["landmark", "wall"] },
  { id: "aqueduct_ruin", name: "ซากท่อส่งน้ำพัง", make: aqueductRuin, tags: ["landmark", "ruin"] },
  { id: "farmhouse", name: "บ้านไร่หินโนอา", make: farmhouse, tags: ["building"] },
  { id: "wayside_shrine", name: "ศาลพระริมทาง", make: waysideShrine, tags: ["decor", "magic"] },
  { id: "stone_bridge", name: "สะพานหินโค้ง (13 ม.)", make: stoneBridge, tags: ["bridge"] },
  { id: "cypress", name: "ต้นสนไซเปรส", make: cypress, tags: ["plant"] },
  { id: "cracked_earth", name: "ดินแตกระแหง", make: crackedEarth, tags: ["ground"] },
  { id: "camel_post", name: "หลักผูกอูฐ", make: camelPost, tags: ["decor", "market"] },
  { id: "fort_wall", name: "กำแพงป้อมร้าง (6 ม.)", make: fortWall, tags: ["wall", "ruin"] },
  { id: "fort_tower", name: "หอมุมป้อมร้าง", make: fortTower, tags: ["tower", "ruin"] },
  { id: "fort_gate", name: "ประตูป้อมร้าง", make: fortGate, tags: ["gate", "ruin"] },
  { id: "giant_skeleton", name: "โครงกระดูกสัตว์ยักษ์", make: giantSkeleton, tags: ["landmark", "decor"] },
];

export const KIT: Kit = {
  id: "westfarm",
  name: "ทุ่งและที่ราบแดนตะวันตก",
  region: "รอบโนอาลงไปถึงขอบทะเลทราย",
  desc: "ทุ่งหญ้าลมแรงกับกำแพงหินเรียง คอกแกะ กังหันลมหินเก่า ไร่องุ่นกับท่อส่งน้ำโบราณ สะพานหินโค้งบนถนนหลวง และป้อมร้างกลางที่ราบแห้งแล้ง",
  ground: "grass",
  items,
  sample,
};
