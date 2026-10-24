// แดนที่อสูรกลืน (demonmarch): the lands the demons have taken round their own, in the far east of
// the kingdom. Three lands in one kit:
//   - the thornland north of the demon lands: black thorn vines crawling over the ground and
//     heaped into thickets, violet crystals sprouting out of blighted rock, grass burnt grey,
//     black trees twisted by the demons' power with glowing pods on their thorns, the great black
//     tree with a crystal heart in its trunk, and cages the thorns have grown round the beasts
//     they caught;
//   - the burnt villages south of the border line: houses burnt to their stone walls (the
//     chimneys still standing), a burnt barn, the chapel with its roof fallen in, walls scored by
//     claws, the well, fields left to die, charred trees, burnt fences, and the new graveyard the
//     priest never finished digging;
//   - the demon army's camp by the sea: fences of great curved ribs, the gate under a beast's
//     skull, black hide tents on bone poles, the war drum on its dais, cages for prisoners,
//     banners of the horned sigil, braziers of hellfire, and the broken ring of the gate the army
//     came through, the rift in it still open.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, front towards -X.
// The claw wall, the burnt fence and the bone fence are 400 cm long along Y and tile end to end.
// Trees (mutant_tree, black_heart_tree, charred_tree) want a trunk solid of their own; the thorn
// cage a ring (r 190); the bone gate a post either side of its way (posts at y = +-330); the war
// drum a disc (r 320); the chapel, the houses and the barn their walls (see the fields). Ground
// pieces (thorn_vines, ash_grass, dead_crops) block nothing.
//
// The fields' shared helpers (tracks, shores, the sea, tinting the ground) are at the end.

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, cylinderCenter, sphereCenter, torus, rock,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { defineMaterial, material } from "../textures";
import { limb as tube, grow, lump, shrub } from "../trees";
import type { ShrubLook } from "../trees";
import { snag, endGrain } from "../nature";
import type { Kit, Put } from "./types";
import type { Paved, Poly as PavedPoly } from "../paved";

// ---- materials ----
// the thornland: black thorn and its glowing tips, black bark and pods, blighted rock and soil,
// violet crystal, ashen grass, bone and hide
defineMaterial("Demonmarch_Thorn", { map: "bark", tint: "#2e2532", bump: 2.5 });
defineMaterial("Demonmarch_ThornGlow", { tint: "#b65cf0", rough: 0.4, glow: "#8a1cf0", glowI: 1.2 });
defineMaterial("Demonmarch_ThornTip", { tint: "#e7a6ff", rough: 0.3, glow: "#b43cff", glowI: 2 });
defineMaterial("Demonmarch_BlackBark", { map: "bark", tint: "#2b2329", bump: 3 });
defineMaterial("Demonmarch_Pod", { tint: "#d27bff", rough: 0.35, glow: "#9c2cf2", glowI: 1.5 });
defineMaterial("Demonmarch_Hollow", { tint: "#120c16", rough: 1 });
defineMaterial("Demonmarch_Blight", { map: "crag", tint: "#544a58", bump: 3 });
defineMaterial("Demonmarch_BlightSoil", { map: "felt", tint: "#2f2732", rough: 1 });
defineMaterial("Demonmarch_BlightEdge", { map: "felt", tint: "#4c424c", rough: 1 });
defineMaterial("Demonmarch_Crystal", { tint: "#9a5ae6", rough: 0.12, glow: "#7428e0", glowI: 0.95, opacity: 0.93 });
defineMaterial("Demonmarch_CrystalCore", { tint: "#f4c6ff", rough: 0.2, glow: "#d064ff", glowI: 1.9 });
defineMaterial("Demonmarch_AshGrass", { map: "felt", tint: "#a39d92", rough: 1 });
defineMaterial("Demonmarch_AshGrassDark", { map: "felt", tint: "#6f6962", rough: 1 });
defineMaterial("Demonmarch_LeafDark", { card: "leaves", tint: "#2c2032", rough: 0.9 });
defineMaterial("Demonmarch_Leaf", { card: "leaves", tint: "#4a3258", rough: 0.85 });
defineMaterial("Demonmarch_LeafLight", { card: "leaves", tint: "#76508a", rough: 0.8 });
defineMaterial("Demonmarch_Bone", { map: "marble", tint: "#ddd1b4", rough: 0.75 });
defineMaterial("Demonmarch_BoneDark", { map: "marble", tint: "#a9997c", rough: 0.8 });
defineMaterial("Demonmarch_Hide", { map: "felt", tint: "#5a4636", rough: 1 });
// the burnt villages: charred timber, soot and ash, embers, field stone, the chapel's stone and
// slate, plaster, fresh earth and the dark of a dug grave, dead crops, the claws' gouges
defineMaterial("Demonmarch_Char", { map: "wood", tint: "#2f2723", bump: 1.6 });
defineMaterial("Demonmarch_CharBark", { map: "bark", tint: "#2c2522", bump: 3 });
defineMaterial("Demonmarch_Ember", { tint: "#ff8a3a", rough: 1, glow: "#ff4a12", glowI: 1.8 });
defineMaterial("Demonmarch_EmberDim", { tint: "#a8401a", rough: 1, glow: "#c0300a", glowI: 1.1 });
defineMaterial("Demonmarch_Soot", { map: "felt", tint: "#2e2a28", rough: 1 });
defineMaterial("Demonmarch_Ash", { map: "felt", tint: "#625d58", rough: 1 });
defineMaterial("Demonmarch_FieldStone", { map: "stone", tint: "#b8af9f", bump: 2 });
defineMaterial("Demonmarch_FieldStoneDark", { map: "stone", tint: "#80786e", bump: 2 });
defineMaterial("Demonmarch_ChapelStone", { map: "stone", tint: "#cdc4b2", bump: 2 });
defineMaterial("Demonmarch_Slate", { map: "shingles", tint: "#58555e", bump: 2.5 });
defineMaterial("Demonmarch_Timber", { map: "wood", tint: "#5a4130", bump: 1.3 });
defineMaterial("Demonmarch_Weathered", { map: "wood", tint: "#8f8270", bump: 1.3 });
defineMaterial("Demonmarch_Earth", { map: "adobe", tint: "#6e5844", bump: 1.5 });
defineMaterial("Demonmarch_EarthFresh", { map: "adobe", tint: "#8c6c4e", bump: 1.5 });
defineMaterial("Demonmarch_PitDark", { tint: "#1e1612", rough: 1 });
defineMaterial("Demonmarch_Straw", { map: "thatch", tint: "#8f7d58", bump: 1.5 });
defineMaterial("Demonmarch_StrawBurnt", { map: "thatch", tint: "#3e342a", bump: 1.5 });
defineMaterial("Demonmarch_DeadStalk", { map: "felt", tint: "#a89a78", rough: 1 });
defineMaterial("Demonmarch_DeadStalkDark", { map: "felt", tint: "#6e6250", rough: 1 });
defineMaterial("Demonmarch_Claw", { tint: "#191318", rough: 1 });
defineMaterial("Demonmarch_ClawGlow", { tint: "#6a3a8a", rough: 0.6, glow: "#5a10a0", glowI: 0.7 });
defineMaterial("Demonmarch_StainedGlass", { tint: "#6a3a5e", rough: 0.2, glow: "#3a1438", glowI: 0.4, opacity: 0.85 });
defineMaterial("Demonmarch_WellWater", { tint: "#1c2a2a", rough: 0.08 });
// the demon camp: dark timber, black hide and red cloth, the horned sigil, black iron, the drum's
// skin, hellfire, dark stone, the rift and the runes on its broken ring
defineMaterial("Demonmarch_DarkWood", { map: "wood", tint: "#3b2d26", bump: 1.3 });
defineMaterial("Demonmarch_TentBlack", { map: "fabric", tint: "#2c262b", rough: 0.95 });
defineMaterial("Demonmarch_TentPatch", { map: "felt", tint: "#45383b", rough: 1 });
defineMaterial("Demonmarch_TentDoor", { tint: "#3a0c08", rough: 1, glow: "#7a1408", glowI: 0.9 });
defineMaterial("Demonmarch_ClothRed", { map: "fabric", tint: "#7a1c1c", rough: 0.9 });
defineMaterial("Demonmarch_ClothDark", { map: "fabric", tint: "#2b1a1c", rough: 0.9 });
defineMaterial("Demonmarch_Sigil", { tint: "#ff5a3a", rough: 0.6, glow: "#e0200a", glowI: 1.4 });
defineMaterial("Demonmarch_IronBlack", { map: "metal", tint: "#3a373c", rough: 0.55, metal: 0.5 });
defineMaterial("Demonmarch_Rust", { map: "metal", tint: "#6e4a36", rough: 0.7, metal: 0.3 });
defineMaterial("Demonmarch_DrumSkin", { map: "felt", tint: "#c6ab84", rough: 0.9 });
defineMaterial("Demonmarch_Hellfire", { tint: "#ff7a3a", rough: 1, glow: "#ff3010", glowI: 2.2 });
defineMaterial("Demonmarch_HellCore", { tint: "#ffd27a", rough: 1, glow: "#ff9a2a", glowI: 2.4 });
defineMaterial("Demonmarch_CampStone", { map: "crag", tint: "#4e444c", bump: 3 });
defineMaterial("Demonmarch_Rift", { tint: "#9a4cff", rough: 0.3, glow: "#8a2cff", glowI: 2, opacity: 0.9 });
defineMaterial("Demonmarch_RiftCore", { tint: "#f2d2ff", rough: 0.3, glow: "#e28cff", glowI: 2.6 });
defineMaterial("Demonmarch_RiftDeep", { tint: "#1c0838", rough: 1, glow: "#3a0c7a", glowI: 1 });
defineMaterial("Demonmarch_RiftStone", { map: "crag", tint: "#5c5262", bump: 3 });
defineMaterial("Demonmarch_Rune", { tint: "#ff8ae0", rough: 0.4, glow: "#d02cff", glowI: 1.8 });
// cliff faces and the sea for the fields: burnt grey rock by the villages, the blighted rock of
// the thornland, a dark grey sea
defineMaterial("Demonmarch_CliffAsh", { map: "crag", tint: "#857b72", bump: 4 });
defineMaterial("Demonmarch_CliffBlight", { map: "crag", tint: "#5e5360", bump: 4 });
defineMaterial("Demonmarch_DarkSea", { tint: "#2b5269", rough: 0.08, opacity: 0.95 });

const TAU = Math.PI * 2;
const DEG = 180 / Math.PI;

// ---- helpers ----
function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

// Flat shading (each triangle its own normal): crisp crystal facets.
function facet(g: Geo): Geo {
  return g.map((p) => {
    const geo = p.geo.clone();
    geo.computeVertexNormals();
    return { geo, mat: p.mat };
  });
}
// A six-sided crystal standing on `bottom`: a short point, the prism, a long point.
function crystal(r: number, h: number, bottom: V3, mat = "Demonmarch_Crystal", seg = 6): Geo {
  const [x, y, z] = bottom, lo = h * 0.2, mid = h * 0.45;
  return facet(merge(
    cylinderAt({ rBot: 0.5, rTop: r, height: lo, segments: seg, bottom: [x, y, z] }, mat),
    cylinderAt({ rBot: r, rTop: r * 0.9, height: mid, segments: seg, bottom: [x, y, z + lo] }, mat),
    cylinderAt({ rBot: r * 0.9, rTop: 0.5, height: h - lo - mid, segments: seg, bottom: [x, y, z + lo + mid] }, mat),
  ));
}
// A crystal tilted about its foot (tilt away from upright, then turned about Z), set at `at`.
const shard = (r: number, h: number, at: V3, tilt: number, turn: number, mat = "Demonmarch_Crystal"): Geo =>
  translate(rotateZ(rotateY(crystal(r, h, [0, 0, -h * 0.1], mat), tilt), turn), at);
// A cone (a thorn, a spike, a fang) from `base` along `dir`, `len` long.
const spike = (base: V3, dir: V3, len: number, r: number, mat: string, seg = 4): Geo =>
  cylinderBetween(base, add(base, mul(norm(dir), len)), r, seg, mat, 0.3);
// A flat surface from triangles (x y z flattened), texture in metres; `twoSided` adds the backs.
function tris(pos: number[], mat: string, twoSided = false): Geo {
  const all = [...pos];
  if (twoSided) for (let i = 0; i < pos.length; i += 9) all.push(pos[i], pos[i + 1], pos[i + 2], pos[i + 6], pos[i + 7], pos[i + 8], pos[i + 3], pos[i + 4], pos[i + 5]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(all, 3));
  geo.computeVertexNormals();
  const uv: number[] = [];
  for (let i = 0; i < all.length; i += 3) uv.push((all[i] + all[i + 1] * 0.3) / 100, (all[i + 2] + all[i + 1] * 0.7) / 100);
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return [{ geo, mat }];
}
// An irregular flat patch lying at height z (soot, blight, hide), its rim jittered.
function patch(r: number, jit: number, seed: number, z: number, mat: string, o: { n?: number; sx?: number; sy?: number; at?: [number, number] } = {}): Geo {
  const rr = seeded(seed), n = o.n ?? 22, sx = o.sx ?? 1, sy = o.sy ?? 1, [cx, cy] = o.at ?? [0, 0];
  const k0 = Array.from({ length: n }, () => 1 + (rr() - 0.5) * jit);
  const k = k0.map((v, i) => (k0[(i + n - 1) % n] + 2 * v + k0[(i + 1) % n]) / 4);
  const rim = k.map((f, i): [number, number] => [cx + Math.cos((i / n) * TAU) * r * f * sx, cy + Math.sin((i / n) * TAU) * r * f * sy]);
  const pos: number[] = [];
  for (let i = 0; i < n; i++) {
    const [ax, ay] = rim[i], [bx, by] = rim[(i + 1) % n];
    pos.push(cx, cy, z, ax, ay, z, bx, by, z);
  }
  return tris(pos, mat);
}
// A squashed sphere (radii r) at c.
const ellipsoid = (r: V3, c: V3, mat: string, seg = 10): Geo => translate(scale(sphereCenter(1, [0, 0, 0], mat, seg), r), c);
// A ring standing in the plane x = c[0] (its axis along X).
const ringX = (r: number, tube_: number, c: V3, mat: string, seg = 20): Geo => translate(rotateY(torus(r, tube_, seg, 4, mat), 90), c);
// Flames: a few cones standing on `at`.
function flames(at: V3, size: number, mat = "Demonmarch_Hellfire", core = "Demonmarch_HellCore"): Geo {
  const f = (r: number, h: number, dx: number, dy: number, tilt: number, turn: number, m: string) =>
    translate(rotateZ(rotateY(facet(cylinderAt({ rBot: r, rTop: 0.5, height: h, segments: 7, bottom: [0, 0, 0] }, m)), tilt), turn), [at[0] + dx, at[1] + dy, at[2]]);
  const s = size;
  return merge(
    f(0.42 * s, 1.0 * s, 0, 0, 0, 0, mat),
    f(0.26 * s, 0.7 * s, 0.22 * s, 0.1 * s, 16, 20, mat),
    f(0.24 * s, 0.62 * s, -0.2 * s, -0.16 * s, 18, 210, mat),
    f(0.2 * s, 0.55 * s, -0.06 * s, 0.24 * s, 14, 120, core),
    f(0.18 * s, 0.48 * s, 0.16 * s, -0.24 * s, 18, 300, core),
  );
}

// A thorny vine: a tube through `pts` (r0 at its root to r1 at its tip), thorns every `gap` cm
// round it pointing out and a little toward the tip (one in four glowing), and a glowing bud at
// the tip when `bud` (its radius).
function vine(pts: V3[], r0: number, r1: number, seed: number, o: { gap?: number; thorn?: number; bud?: number; mat?: string } = {}): Geo {
  const mat = o.mat ?? "Demonmarch_Thorn", rr = seeded(seed + 5);
  const out: Geo[] = [tube(pts, r0, r1, mat, { seg: r0 > 9 ? 6 : r0 > 4 ? 5 : 4, gnarl: 0.4, seed, step: Math.max(20, r0 * 3), maxRings: 14 })];
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "centripetal");
  const L = curve.getLength(), gap = o.gap ?? 24;
  for (let s = gap * (0.4 + rr() * 0.6); s < L - gap * 0.4; s += gap * (0.75 + rr() * 0.5)) {
    const t = s / L, p = curve.getPointAt(t), tan = curve.getTangentAt(t), r = r0 + (r1 - r0) * t;
    const side = new THREE.Vector3(rr() - 0.5, rr() - 0.5, rr() - 0.5).cross(tan);
    if (side.lengthSq() < 1e-4) continue;
    side.normalize();
    if (side.z < -0.3 && p.z < r * 2.5) side.z = -side.z; // not down into the ground
    const dir = side.clone().addScaledVector(tan, 0.45).normalize();
    const len = (o.thorn ?? 1) * (5 + r * 1.7) * (0.7 + rr() * 0.6);
    const base = p.clone().addScaledVector(side, r * 0.8);
    out.push(cylinderBetween(base.toArray() as V3, base.clone().addScaledVector(dir, len).toArray() as V3, Math.max(1.1, r * 0.42), 3, rr() < 0.25 ? "Demonmarch_ThornGlow" : mat, 0.2));
  }
  if (o.bud) out.push(ellipsoid([o.bud, o.bud, o.bud * 1.4], pts[pts.length - 1], "Demonmarch_ThornTip", 6));
  return merge(...out);
}
// A creeping run of vine along the ground from `from`, heading `a`: lying on the ground at every
// other point and arching up between.
function creep(rr: () => number, from: [number, number], a: number, len: number, r: number, n = 5): V3[] {
  const pts: V3[] = [];
  let [x, y] = from;
  for (let i = 0; i <= n; i++) {
    pts.push([x, y, r + (i % 2 ? 18 + rr() * 34 : 0)]);
    a += (rr() - 0.5) * 1.1;
    x += (Math.cos(a) * len) / n;
    y += (Math.sin(a) * len) / n;
  }
  return pts;
}

// The demons' sign, painted or burnt on: a ring with horns and a slit eye, in the plane x = c[0]
// facing -X, `s` its radius.
function sigil(c: V3, s: number, mat = "Demonmarch_Sigil"): Geo {
  const [x, y, z] = c;
  return merge(
    ringX(s, s * 0.08, c, mat, 24),
    ...[-1, 1].map((k) => tube([[x, y + k * s * 0.55, z + s * 0.8], [x, y + k * s * 1.0, z + s * 1.2], [x, y + k * s * 0.82, z + s * 1.7]], s * 0.09, s * 0.02, mat, { seg: 4, maxRings: 4 })),
    box([2, s * 0.14, s * 1.15], [x, y, z], mat),
    box([2, s * 0.6, s * 0.12], [x, y, z - s * 0.25], mat),
  );
}
// A chain hanging from `top`: n links, each turned a quarter from the last.
function chain(top: V3, n: number, link = 6): Geo {
  const out: Geo[] = [];
  for (let j = 0; j < n; j++) {
    const ring = torus(link, link * 0.27, 8, 4, "Demonmarch_IronBlack");
    out.push(translate(j % 2 ? rotateX(ring, 90) : rotateY(ring, 90), [top[0], top[1], top[2] - j * link * 1.75]));
  }
  return merge(...out);
}
// A beast's horned skull facing -X (a demon's trophy), about 70 cm long at s = 1.
function hornedSkull(s = 1, mat = "Demonmarch_Bone"): Geo {
  return scale(merge(
    ellipsoid([34, 30, 28], [0, 0, 0], mat),
    ellipsoid([30, 18, 15], [-30, 0, -10], mat, 8),
    ...[-1, 1].map((k) => ellipsoid([8, 9, 8], [-24, k * 13, 6], "Demonmarch_Hollow", 6)),
    ...[-1, 1].map((k) => tube([[-5, k * 22, 14], [5, k * 50, 38], [30, k * 62, 66], [62, k * 52, 84]], 9, 1.5, "Demonmarch_BoneDark", { seg: 6, maxRings: 8 })),
    ...[0, 1, 2, 3].map((i) => spike([-46 + i * 6, i % 2 ? 7 : -7, -20], [0, 0, -1], 11, 2.4, mat, 3)),
  ), [s, s, s]);
}

// ---- the thornland ----

// Black thorn vines creeping over a patch of blighted soil, arching up off it, two shoots
// standing up with glowing buds; about 3.6 x 3 m.
function thornVines(): Geo {
  const rr = seeded(11), out: Geo[] = [
    patch(130, 0.85, 12, 0.8, "Demonmarch_BlightEdge", { sx: 1.25, n: 28 }),
    patch(80, 0.8, 13, 1.4, "Demonmarch_BlightSoil", { at: [30, -20], n: 18 }),
  ];
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * TAU + rr() * 0.6, d0 = 20 + rr() * 50;
    out.push(vine(creep(rr, [Math.cos(a0) * d0, Math.sin(a0) * d0], a0 + (rr() - 0.5) * 1.4, 130 + rr() * 70, 5), 5.5, 2.2, 20 + i, { gap: 24, bud: i % 2 ? 4 : 0 }));
  }
  for (let i = 0; i < 2; i++) {
    const a = rr() * TAU, x = Math.cos(a) * 40, y = Math.sin(a) * 40;
    out.push(vine([[x, y, 0], [x + 8, y - 5, 40], [x - 6, y + 10, 76], [x + 10, y + 4, 102]], 4, 1.5, 40 + i, { gap: 18, bud: 4.5 }));
  }
  return merge(...out);
}

// A thicket of black thorn: vines looping up out of a dark tangle and down again, shoots whipping
// up out of its top glowing at their tips; about 3 x 2.6 m, 2 m tall.
function thornThicket(): Geo {
  const rr = seeded(31), out: Geo[] = [
    patch(170, 0.5, 32, 0.8, "Demonmarch_BlightSoil", { n: 24 }),
    lump([0, 0, 30], [120, 100, 72], 33, "Demonmarch_Thorn", 1, 0.25),
  ];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + rr() * 0.4, b = a + Math.PI * (0.6 + rr() * 0.6);
    const ra = 70 + rr() * 60, rb = 60 + rr() * 70, top = 110 + rr() * 80;
    const A: V3 = [Math.cos(a) * ra * 1.15, Math.sin(a) * ra, 3], B: V3 = [Math.cos(b) * rb * 1.15, Math.sin(b) * rb, 3];
    const mid: V3 = [(A[0] + B[0]) / 2 + (rr() - 0.5) * 60, (A[1] + B[1]) / 2 + (rr() - 0.5) * 60, top];
    const q = (P: V3): V3 => [P[0] * 0.72 + mid[0] * 0.28, P[1] * 0.72 + mid[1] * 0.28, top * 0.68];
    out.push(vine([A, q(A), mid, q(B), B], 7, 3, 50 + i, { gap: 26 }));
  }
  for (let i = 0; i < 6; i++) {
    const a = rr() * TAU, d = rr() * 50, x = Math.cos(a) * d, y = Math.sin(a) * d, h = 150 + rr() * 70;
    out.push(vine([[x, y, 60], [x + Math.cos(a) * 25, y + Math.sin(a) * 25, h * 0.6], [x + Math.cos(a) * 55, y + Math.sin(a) * 50, h]], 5, 1.6, 70 + i, { gap: 20, bud: 5 }));
  }
  return merge(...out);
}

// A stag's bones lying on their side, the hide rotted off them (inside the thorn cage).
function stagBones(): Geo {
  const out: Geo[] = [patch(80, 0.6, 140, 1.6, "Demonmarch_Hide", { sx: 1.5, at: [10, 6] })];
  // the spine, the ribs arching over, the pelvis
  for (let i = 0; i < 10; i++) out.push(ellipsoid([7, 6, 6], [-70 + i * 15, 12, 9], "Demonmarch_Bone", 6));
  for (let i = 0; i < 7; i++) {
    const x = -50 + i * 13;
    out.push(tube([[x, 12, 10], [x + 2, -12, 34], [x + 5, -40, 32], [x + 7, -58, 8]], 2.8, 1.4, "Demonmarch_Bone", { seg: 4, maxRings: 5 }));
  }
  out.push(ellipsoid([18, 14, 10], [80, 12, 12], "Demonmarch_Bone", 8));
  // the skull, the antlers branching off it
  out.push(ellipsoid([24, 11, 11], [-104, 16, 11], "Demonmarch_Bone", 8), ellipsoid([5, 5, 4], [-110, 6, 16], "Demonmarch_Hollow", 5));
  for (const k of [-1, 1]) {
    const b: V3 = [-92, 16 + k * 8, 18], m: V3 = [-80, 16 + k * 40, 60], t: V3 = [-60, 16 + k * 52, 104];
    out.push(tube([b, m, t], 3.2, 1.2, "Demonmarch_BoneDark", { seg: 4, maxRings: 5 }));
    out.push(cylinderBetween(m, [-96, 16 + k * 58, 82], 2, 3, "Demonmarch_BoneDark", 0.6), cylinderBetween([-72, 16 + k * 46, 82], [-54, 16 + k * 70, 108], 1.8, 3, "Demonmarch_BoneDark", 0.6));
  }
  // the legs, folded where it fell
  for (const [x, a] of [[-40, 0.3], [-25, -0.2], [70, 0.4], [86, -0.1]] as [number, number][])
    out.push(cylinderBetween([x, 12, 8], [x + Math.sin(a) * 60, 70, 6], 2.6, 4, "Demonmarch_Bone"), cylinderBetween([x + Math.sin(a) * 60, 70, 6], [x + Math.sin(a) * 60 + 30, 96, 5], 2, 4, "Demonmarch_Bone"));
  return merge(...out);
}

// A cage the thorns grew round a beast they caught: nine thick vines rising out of the ground in
// a ring, bowing out and curling in to a knotted crown, two bands of thinner vine bound round
// them, glowing pods on the crown, a stag's bones inside; about 4 m across, 3 m tall.
function thornCage(): Geo {
  const rr = seeded(91), out: Geo[] = [patch(230, 0.4, 92, 0.8, "Demonmarch_BlightSoil", { n: 28 })];
  const n = 9, R = 165, H = 290;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + (rr() - 0.5) * 0.15, tw = 0.28;
    const p = (r: number, z: number, t: number): V3 => [Math.cos(a + tw * t) * r, Math.sin(a + tw * t) * r, z];
    out.push(vine([p(R + 45, -4, 0), p(R + 12, 50, 0.15), p(R + 16, 140, 0.4), p(R - 25, 222, 0.7), p(70, 276, 0.9), p(16, H + 8, 1)], 13, 5, 100 + i, { gap: 30, thorn: 1.3 }));
  }
  for (const [z, r, k] of [[70, R + 15, 0], [175, R + 4, 1]] as [number, number, number][]) {
    const pts: V3[] = [];
    for (let j = 0; j <= 18; j++) {
      const a = (j / 18) * TAU + k * 0.3;
      pts.push([Math.cos(a) * r, Math.sin(a) * r, z + Math.sin(j * 1.7) * 12]);
    }
    out.push(vine(pts, 4.5, 4, 120 + k, { gap: 22 }));
  }
  out.push(lump([0, 0, H - 10], [44, 44, 30], 130, "Demonmarch_Thorn", 1, 0.3));
  for (let i = 0; i < 6; i++) {
    const a = rr() * TAU;
    out.push(ellipsoid([9, 9, 13], [Math.cos(a) * 30, Math.sin(a) * 30, H + 14 + rr() * 12], "Demonmarch_Pod", 8));
  }
  out.push(stagBones());
  return merge(...out);
}

// Violet crystals sprouting out of cracked, blighted ground; about 2.2 m across, 1.8 m tall.
function crystalCluster(): Geo {
  return merge(
    patch(110, 0.6, 61, 0.9, "Demonmarch_BlightSoil", { sx: 1.2, n: 20 }),
    translate(rock([90, 70, 34], 0.4, 62, "Demonmarch_Blight", true), [-40, 30, 0]),
    translate(rock([60, 50, 26], 0.4, 63, "Demonmarch_Blight", true), [45, -35, 0]),
    shard(24, 180, [0, 0, 6], 8, 40),
    shard(9, 120, [0, 0, 10], 8, 40, "Demonmarch_CrystalCore"),
    shard(15, 110, [-35, 25, 6], 30, 150),
    shard(13, 95, [38, 30, 4], 34, 60),
    shard(12, 80, [30, -40, 4], 38, 300),
    shard(10, 60, [-40, -30, 2], 44, 220),
    shard(7, 38, [-70, 0, 0], 52, 180, "Demonmarch_CrystalCore"),
    shard(6, 32, [70, 10, 0], 55, 0),
    shard(6, 30, [0, 70, 0], 55, 90),
  );
}

// A spire of violet crystal bursting out of a mound of blighted rock, smaller ones splayed round
// it, glowing cores in the biggest; about 5 m across, 6.5 m tall.
function crystalSpire(): Geo {
  return merge(
    patch(260, 0.5, 71, 0.9, "Demonmarch_BlightSoil", { n: 28 }),
    translate(rock([360, 300, 150], 0.35, 72, "Demonmarch_Blight"), [0, 0, -10]),
    translate(rock([180, 150, 90], 0.4, 73, "Demonmarch_Blight"), [150, -120, -6]),
    translate(rock([150, 140, 70], 0.4, 74, "Demonmarch_Blight"), [-150, 130, -6]),
    shard(70, 640, [0, 0, 70], 5, 20),
    shard(24, 400, [0, 0, 90], 5, 20, "Demonmarch_CrystalCore"),
    shard(46, 420, [-80, -60, 50], 20, 210),
    shard(40, 360, [80, 70, 50], 24, 40),
    shard(32, 280, [100, -90, 40], 32, 320),
    shard(28, 240, [-100, 90, 40], 34, 140),
    shard(14, 160, [-80, -60, 60], 20, 210, "Demonmarch_CrystalCore"),
    shard(20, 150, [-170, -40, 10], 46, 190), shard(16, 120, [170, 40, 10], 48, 10),
    shard(14, 100, [40, 180, 6], 50, 80), shard(14, 110, [-30, -180, 6], 50, 270),
    shard(9, 60, [-220, 60, 0], 56, 160, "Demonmarch_CrystalCore"), shard(9, 55, [200, -120, 0], 56, 330, "Demonmarch_CrystalCore"),
  );
}

// A tuft of grass burnt grey, a few charred stalks standing in it; about 60 cm across.
function ashGrass(): Geo {
  const rr = seeded(81), out: Geo[] = [];
  for (let i = 0; i < 16; i++) {
    const a = rr() * TAU, d = rr() * 24, h = 30 + rr() * 34, tilt = 14 + rr() * 34;
    const blade = cylinderAt({ rBot: 3, rTop: 0.3, height: h, segments: 3, bottom: [0, 0, 0] }, i % 3 ? "Demonmarch_AshGrass" : "Demonmarch_AshGrassDark");
    out.push(translate(rotateZ(rotateY(blade, tilt), a * DEG), [Math.cos(a) * d, Math.sin(a) * d, 0]));
  }
  for (let i = 0; i < 3; i++) {
    const a = rr() * TAU, d = 6 + rr() * 14, h = 55 + rr() * 25, x = Math.cos(a) * d, y = Math.sin(a) * d, top: V3 = [x + Math.cos(a) * 10, y + Math.sin(a) * 10, h];
    out.push(cylinderBetween([x, y, 0], top, 1.2, 3, "Demonmarch_Soot"), ellipsoid([2.5, 2.5, 7], [top[0], top[1], h + 5], "Demonmarch_Soot", 4));
  }
  return merge(...out);
}

// A boulder of blighted rock with violet crystals breaking out of its cracks; about 3 x 2.6 m.
function blightBoulder(): Geo {
  return merge(
    translate(rock([250, 200, 160], 0.38, 151, "Demonmarch_Blight"), [0, 0, -8]),
    translate(rock([110, 90, 60], 0.4, 152, "Demonmarch_Blight"), [110, -100, -4]),
    translate(rock([70, 60, 30], 0.4, 153, "Demonmarch_Blight", true), [-120, 80, 0]),
    shard(18, 110, [-70, -60, 30], 40, 220), shard(12, 80, [-90, -30, 20], 48, 180), shard(7, 45, [-60, -95, 10], 52, 260, "Demonmarch_CrystalCore"),
    shard(10, 70, [60, 70, 80], 36, 50), shard(6, 40, [80, 50, 60], 46, 20, "Demonmarch_CrystalCore"),
  );
}

const DARK_LEAVES: ShrubLook = { core: "Demonmarch_Thorn", dark: "Demonmarch_LeafDark", mid: "Demonmarch_Leaf", light: "Demonmarch_LeafLight" };

// A tree the demons' power has twisted: a black trunk winding up into clawing branches, thorns
// jutting from the trunk and at every twig's end, glowing pods hanging off them, tatters of
// violet-black leaves; about 7 m tall.
function mutantTree(): Geo {
  const tips: { p: V3; d: V3; r: number }[] = [];
  const rr = seeded(162);
  const out: Geo[] = [grow({
    mat: "Demonmarch_BlackBark", seed: 161, at: [0, 0, -8], dir: [0.12, 0.05, 1], len: 300, r: 30, depth: 4, spread: 0.95, shrink: 0.66, thin: 0.8,
    wobble: 1.05, rise: -0.06, flare: 0.9, roots: 6, gnarl: 1, tipR: 0.12, kids: (d) => (d >= 3 ? 3 : 2), tips,
  })];
  const lobes: [number, number, number, number, number, number][] = [];
  tips.forEach((t, i) => {
    out.push(spike(t.p, t.d, 24 + rr() * 18, Math.max(1.6, t.r * 1.2), "Demonmarch_Thorn", 4));
    if (i % 3 === 0) {
      const hang: V3 = [t.p[0], t.p[1], t.p[2] - 20];
      out.push(cylinderBetween(t.p, hang, 0.8, 3, "Demonmarch_Thorn"), ellipsoid([8, 8, 12], [hang[0], hang[1], hang[2] - 10], "Demonmarch_Pod", 7));
    }
    if (i % 4 === 1) lobes.push([t.p[0], t.p[1], t.p[2] + 6, 46, 46, 26]);
  });
  out.push(shrub({ seed: 163, lobes, leaf: 30, look: DARK_LEAVES, core: 0, density: 0.45, ragged: 0.9, sun: -0.05 }));
  for (let i = 0; i < 9; i++) {
    const a = rr() * TAU, z = 60 + rr() * 220, r = 30 * (1 - z / 700);
    out.push(spike([0.12 * z + Math.cos(a) * r * 0.8, 0.05 * z + Math.sin(a) * r * 0.8, z], [Math.cos(a), Math.sin(a), 0.35], 30 + rr() * 20, 6, "Demonmarch_Thorn", 4));
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + rr() * 0.4, L = 120 + rr() * 60;
    out.push(tube([[Math.cos(a) * 18, Math.sin(a) * 18, 26], [Math.cos(a) * 48, Math.sin(a) * 48, 10], [Math.cos(a + 0.15) * L, Math.sin(a + 0.15) * L, -6]], 12, 3, "Demonmarch_BlackBark", { seg: 6, maxRings: 5, gnarl: 0.6, seed: 165 + i }));
  }
  return merge(...out);
}

// The great black tree at the heart of the blight: a massive gnarled bole split open on its front
// where a heart of crystal glows, four great limbs clawing out of its top, roots spreading 6 m,
// thorn vines crawling out from among them and crystals sprouting at its foot; about 15 m tall,
// 14 m across.
function blackHeartTree(): Geo {
  const rr = seeded(171), out: Geo[] = [patch(600, 0.7, 172, 0.8, "Demonmarch_BlightEdge", { n: 40 }), patch(330, 0.6, 176, 1.4, "Demonmarch_BlightSoil", { n: 28 })];
  out.push(tube([[0, 0, -10], [10, 6, 200], [-6, 14, 420], [14, 4, 620]], 96, 58, "Demonmarch_BlackBark", { flare: 1.1, roots: 7, gnarl: 1, seed: 173, step: 60, maxRings: 14, seg: 12 }));
  const tips: { p: V3; d: V3; r: number }[] = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.4 + rr() * 0.3;
    out.push(grow({ mat: "Demonmarch_BlackBark", seed: 180 + i, at: [14, 4, 590], dir: [Math.cos(a), Math.sin(a), 0.85], len: 380, r: 42, depth: 3, spread: 0.85, shrink: 0.7, thin: 0.82, wobble: 0.9, rise: -0.04, gnarl: 0.9, tipR: 0.12, kids: (d) => (d >= 2 ? 3 : 2), tips }));
  }
  const lobes: [number, number, number, number, number, number][] = [];
  tips.forEach((t, i) => {
    out.push(spike(t.p, t.d, 40 + rr() * 30, Math.max(2.5, t.r * 1.2), "Demonmarch_Thorn", 4));
    if (i % 2 === 0) {
      const hang: V3 = [t.p[0], t.p[1], t.p[2] - 30];
      out.push(cylinderBetween(t.p, hang, 1.2, 3, "Demonmarch_Thorn"), ellipsoid([13, 13, 19], [hang[0], hang[1], hang[2] - 15], "Demonmarch_Pod", 8));
    }
    if (i % 3 === 1) lobes.push([t.p[0], t.p[1], t.p[2] + 10, 80, 80, 44]);
  });
  out.push(shrub({ seed: 175, lobes, leaf: 44, look: DARK_LEAVES, core: 0, density: 0.4, ragged: 0.9, sun: -0.05 }));
  // big thorns jutting out of the bole
  for (let i = 0; i < 14; i++) {
    const a = rr() * TAU, z = 120 + rr() * 440, r = 96 - (38 * z) / 620;
    out.push(spike([Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85 + 6, z], [Math.cos(a), Math.sin(a), 0.4], 60 + rr() * 40, 11, "Demonmarch_Thorn", 5));
  }
  // the cleft on its front and the crystal heart glowing in it, lips of bark either side
  out.push(ellipsoid([26, 44, 120], [-76, 8, 330], "Demonmarch_Hollow", 10));
  for (const k of [-1, 1]) out.push(tube([[-70, 8 + k * 30, 200], [-92, 8 + k * 48, 300], [-90, 8 + k * 44, 400], [-70, 8 + k * 22, 460]], 16, 9, "Demonmarch_BlackBark", { seg: 6, maxRings: 6, gnarl: 0.8 }));
  out.push(
    shard(22, 170, [-98, 8, 255], 0, 0, "Demonmarch_CrystalCore"),
    shard(14, 110, [-100, -10, 265], 22, 200), shard(13, 100, [-100, 26, 270], 24, 150), shard(10, 70, [-104, 8, 380], 160, 0),
    ellipsoid([16, 26, 30], [-104, 8, 340], "Demonmarch_Pod", 10),
  );
  // roots spreading out over the ground
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + rr() * 0.3, L = 430 + rr() * 220;
    out.push(tube([[Math.cos(a) * 70, Math.sin(a) * 70, 70], [Math.cos(a) * 190, Math.sin(a) * 190, 26], [Math.cos(a + 0.1) * L * 0.7, Math.sin(a + 0.1) * L * 0.7, 10], [Math.cos(a + 0.18) * L, Math.sin(a + 0.18) * L, -6]], 36, 6, "Demonmarch_BlackBark", { seg: 7, maxRings: 9, gnarl: 0.8, seed: 190 + i }));
  }
  // thorn vines crawling out between the roots, crystals at its foot
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + 0.35;
    out.push(vine(creep(rr, [Math.cos(a) * 160, Math.sin(a) * 160], a + (rr() - 0.5) * 0.6, 360 + rr() * 160, 7, 6), 8, 3, 200 + i, { gap: 28, bud: 6 }));
  }
  for (const [x, y, s, t] of [[-260, -200, 1, 30], [240, 260, 0.8, 140], [-180, 300, 0.7, 250], [300, -180, 0.9, 320]] as number[][])
    out.push(translate(rotateZ(scale(crystalCluster().slice(3), [s, s, s]), t), [x, y, 0]));
  return merge(...out);
}

// ---- the burnt villages ----

// A tree burnt black where it stood, its top snapped off, embers still glowing in its hollow and
// ash on its limbs; about 5.6 m tall.
function charredTree(): Geo {
  return snag({ seed: 201, h: 560, r: 28, bark: "Demonmarch_CharBark", wood: endGrain("#3b302a"), lean: 0.14, snapped: true, roots: 5, depth: 3, spread: 0.75, rise: 0.25, hollow: "Demonmarch_EmberDim", cover: { mat: "Demonmarch_Ash", amount: 0.25, thick: 2 } });
}

// A run of wall along an axis, `t` thick: in the plane x = at spanning y from a to b ("x"), or in
// the plane y = at spanning x ("y"); its top at top(s) (s along the wall), in columns `col` wide
// (a ragged top where it broke), with openings [centre, width, bottom, top] left in it.
type Hole = [number, number, number, number];
function brokenWall(axis: "x" | "y", at: number, t: number, a: number, b: number, z0: number, top: (s: number) => number, mat: string, holes: Hole[] = [], col = 60): Geo {
  const out: Geo[] = [];
  const piece = (s0: number, s1: number, za: number, zb: number) => {
    if (zb - za < 3 || s1 - s0 < 3) return;
    out.push(axis === "x" ? boxBounds([at - t / 2, s0, za], [at + t / 2, s1, zb], mat) : boxBounds([s0, at - t / 2, za], [s1, at + t / 2, zb], mat));
  };
  const cuts = [a, b];
  for (const [c, w] of holes) cuts.push(Math.max(a, c - w / 2), Math.min(b, c + w / 2));
  const sorted = [...new Set(cuts)].sort((p, q) => p - q);
  for (let i = 0; i + 1 < sorted.length; i++) {
    const s0 = sorted[i], s1 = sorted[i + 1];
    const hole = holes.find(([c, w]) => c - w / 2 <= s0 + 0.5 && c + w / 2 >= s1 - 0.5);
    const n = Math.max(1, Math.round((s1 - s0) / col));
    for (let k = 0; k < n; k++) {
      const u0 = s0 + ((s1 - s0) * k) / n, u1 = s0 + ((s1 - s0) * (k + 1)) / n, h = top((u0 + u1) / 2);
      if (hole) {
        piece(u0, u1, z0, Math.min(h, hole[2]));
        if (hole[3] < h) piece(u0, u1, hole[3], h);
      } else piece(u0, u1, z0, h);
    }
  }
  return merge(...out);
}
// soft noise along a wall, -1..1
const wob = (s: number, seed: number) => 0.6 * Math.sin(s / 37 + seed) + 0.4 * Math.sin(s / 13 + seed * 2.3);
// Claw marks raked across a wall in the plane x = x0 (facing -X): `n` deep gouges, each a dark
// furrow with a faint violet glow at its bottom, running from (y, z) `len` cm down at `slant` deg.
function clawMarks(x0: number, y: number, z: number, len: number, slant: number, n = 4, gap = 22): Geo {
  const out: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const g = translate(rotateX(merge(box([5, 15, len], [0, 0, 0], "Demonmarch_Claw"), box([3, 3, len * 0.75], [-2, 0, 0], "Demonmarch_ClawGlow")), slant), [x0 - 1, y + i * gap, z - Math.abs(i - (n - 1) / 2) * 8]);
    out.push(g);
  }
  return merge(...out);
}

// A cottage burnt to its stone walls: the timber storey and the roof gone, the walls' tops broken,
// soot over the windows, the +Y gable and its chimney still standing, charred rafters and a patch
// of slate left on the back slope, the ridge beam fallen in across rubble still glowing, the door
// hanging off one hinge and a demon's claws raked across the front; about 8.6 x 6.4 m.
function burntHouse(): Geo {
  const rr = seeded(211), out: Geo[] = [];
  const X0 = -300, X1 = 300, Y0 = -410, Y1 = 410, T = 44, H = 290, RISE = 240;
  const S = "Demonmarch_FieldStone";
  out.push(boxBounds([X0 - 14, Y0 - 14, 0], [X1 + 14, Y1 + 14, 24], "Demonmarch_FieldStoneDark", 3));
  // the four walls
  out.push(brokenWall("x", X0 + T / 2, T, Y0, Y1, 24, (s) => H - 14 + 12 * wob(s, 1) - 110 * Math.max(0, 1 - Math.abs(s - 250) / 120), S, [[-170, 120, 0, 228], [90, 100, 115, 220], [300, 90, 115, 220]]));
  out.push(brokenWall("x", X1 - T / 2, T, Y0, Y1, 24, (s) => H - 24 + 16 * wob(s, 2), S, [[-200, 100, 115, 220], [150, 100, 115, 220]]));
  out.push(brokenWall("y", Y0 + T / 2, T, X0 + T, X1 - T, 24, (s) => H - 70 + 26 * wob(s, 3), S, [[0, 90, 115, 215]]));
  out.push(brokenWall("y", Y1 - T / 2, T, X0 + T, X1 - T, 24, (s) => H + Math.max(0, RISE * (1 - Math.abs(s) / 300)) * (s > 80 ? 0.62 : 1) - 8 + 8 * wob(s, 4), S, [[0, 80, 140, 220]], 40));
  // lintels and sills, charred; soot fanning up over the openings
  for (const [y, w, z0, z1] of [[-170, 120, 0, 228], [90, 100, 115, 220], [300, 90, 115, 220]] as Hole[]) {
    out.push(boxBounds([X0 - 4, y - w / 2 - 12, z1], [X0 + T + 2, y + w / 2 + 12, z1 + 16], "Demonmarch_Char"));
    if (z0 > 0) out.push(boxBounds([X0 - 8, y - w / 2 - 6, z0 - 8], [X0 + 10, y + w / 2 + 6, z0], "Demonmarch_FieldStoneDark"));
    out.push(boxBounds([X0 - 2, y - w * 0.6, z1 + 16], [X0, y + w * 0.6, Math.min(H - 20, z1 + 70)], "Demonmarch_Soot"));
  }
  for (const y of [-200, 150]) out.push(boxBounds([X1, y - 60, 236], [X1 + 2, y + 60, H - 30], "Demonmarch_Soot"), boxBounds([X1 - T - 2, y - 62, 220], [X1 + 4, y + 62, 236], "Demonmarch_Char"));
  // the chimney on the +Y gable, sooted at its top
  out.push(boxBounds([-62, Y1 - 6, 0], [62, Y1 + 64, H + 330], S, 3), boxBounds([-70, Y1 - 10, H + 330], [70, Y1 + 72, H + 350], "Demonmarch_FieldStoneDark", 2), boxBounds([-40, Y1 + 10, H + 350], [40, Y1 + 50, H + 362], "Demonmarch_Soot"));
  // the door hanging off one hinge, a charred frame
  out.push(boxBounds([X0 - 4, -232, 0], [X0 + 6, -228, 228], "Demonmarch_Char"), boxBounds([X0 - 4, -112, 0], [X0 + 6, -108, 228], "Demonmarch_Char"));
  out.push(translate(rotateZ(boxBounds([-4, 0, 0], [4, 104, 206], "Demonmarch_Char", 1), 62), [X0 + 2, -228, 6]));
  // the roof that is left: rafters on the +Y half, a patch of slate on the back slope, the ridge beam
  // fallen in from the gable's peak, rafters broken short and fallen
  const peak = H + RISE - 6, ang = (Math.atan2(RISE, (X1 - X0) / 2) * 180) / Math.PI;
  for (const y of [Y1 - 70, Y1 - 180]) for (const k of [-1, 1]) out.push(beamBetween([k * (X1 - 10), y, H - 8], [0, y, peak], 14, 16, "Demonmarch_Char"));
  out.push(beamBetween([X0 + 10, Y1 - 290, H - 8], [-150, Y1 - 290, H + 116], 14, 16, "Demonmarch_Char"));
  const slope = Math.hypot(RISE, (X1 - X0) / 2) + 40;
  out.push(translate(rotateY(box([slope, 220, 9], [0, 0, 0], "Demonmarch_Slate"), ang), [(X1 - X0) / 4 + 12, Y1 - 150, H + RISE / 2 + 6]));
  out.push(beamBetween([0, Y1 - 40, peak], [30, -60, 60], 18, 20, "Demonmarch_Char"));
  out.push(beamBetween([-220, -330, 40], [180, -130, 26], 16, 18, "Demonmarch_Char"), beamBetween([-60, -300, 30], [120, 60, 110], 14, 16, "Demonmarch_Char"));
  // the rubble inside: stone, charred timber, slates, embers
  out.push(patch(230, 0.5, 212, 25, "Demonmarch_Ash", { sx: 1.1, n: 20 }));
  for (let i = 0; i < 9; i++) {
    const x = (rr() - 0.5) * 380, y = (rr() - 0.5) * 600;
    out.push(translate(rock([60 + rr() * 50, 50 + rr() * 40, 26 + rr() * 20], 0.4, 213 + i, i % 3 ? S : "Demonmarch_FieldStoneDark", true), [x, y, 22]));
  }
  for (let i = 0; i < 10; i++) {
    const x = (rr() - 0.5) * 360, y = (rr() - 0.5) * 560;
    out.push(boxAt([8 + rr() * 8, 8 + rr() * 8, 3], [x, y, 26 + rr() * 10], "Demonmarch_Ember"));
  }
  for (let i = 0; i < 8; i++) out.push(translate(rotateZ(rotateY(box([32, 22, 2], [0, 0, 0], "Demonmarch_Slate"), (rr() - 0.5) * 30), rr() * 360), [X1 + 30 + rr() * 60, (rr() - 0.5) * 700, 2]));
  // the claws raked across the front, between the windows
  out.push(clawMarks(X0, 170, 140, 130, -32, 4, 20));
  return merge(...out);
}

// A barn burnt to its frame: a low stone footing, charred posts (some broken short), two bents
// still standing with their rafters, the ridge between them, the rest of the roof fallen in a heap
// of charred planks against the back, burnt hay still smouldering; about 10.4 x 7.4 m.
function burntBarn(): Geo {
  const rr = seeded(231), out: Geo[] = [];
  const XH = 330, YH = 500, H = 400, RISE = 300;
  // the footing: stone round all four sides, the doorway in the front
  out.push(brokenWall("x", -XH, 40, -YH, YH, 0, (s) => 70 + 12 * wob(s, 5), "Demonmarch_FieldStoneDark", [[0, 320, 0, 200]], 90));
  out.push(brokenWall("x", XH, 40, -YH, YH, 0, (s) => 70 + 12 * wob(s, 6), "Demonmarch_FieldStoneDark", [], 90));
  out.push(brokenWall("y", -YH, 40, -XH + 20, XH - 20, 0, (s) => 70 + 12 * wob(s, 7), "Demonmarch_FieldStoneDark", [], 90));
  out.push(brokenWall("y", YH, 40, -XH + 20, XH - 20, 0, (s) => 70 + 12 * wob(s, 8), "Demonmarch_FieldStoneDark", [], 90));
  // posts
  const ys = [-460, -230, 0, 230, 460];
  ys.forEach((y, i) => {
    for (const k of [-1, 1]) {
      const h = i === 0 || (i === 4 && k > 0) ? 120 + rr() * 80 : i === 3 && k < 0 ? 230 : H;
      out.push(boxAt([24, 24, h], [k * (XH - 10), y, 60], "Demonmarch_Char", 2));
      if (h < H) out.push(boxAt([18, 18, 14], [k * (XH - 10), y, 60 + h], "Demonmarch_Ember"));
    }
  });
  // the two bents still standing: tie beams, rafters, a king post; the ridge between them
  for (const y of [-230, 0]) {
    out.push(beamBetween([-XH, y, H + 50], [XH, y, H + 50], 22, 24, "Demonmarch_Char"));
    for (const k of [-1, 1]) out.push(beamBetween([k * XH, y, H + 50], [0, y, H + 50 + RISE], 18, 20, "Demonmarch_Char"));
    out.push(boxAt([16, 16, RISE], [0, y, H + 50], "Demonmarch_Char"));
  }
  out.push(beamBetween([0, -260, H + 40 + RISE], [0, 30, H + 40 + RISE], 20, 20, "Demonmarch_Char"));
  out.push(beamBetween([XH, 230, H + 50], [80, 230, H + 50 + RISE * 0.8], 18, 20, "Demonmarch_Char"));
  // a rafter fallen across the floor, the fallen roof's planks heaped against the back
  out.push(beamBetween([-XH + 40, 380, 20], [60, 120, 340], 18, 20, "Demonmarch_Char"));
  for (let i = 0; i < 9; i++) {
    const y = 120 + i * 40 + (rr() - 0.5) * 16;
    out.push(translate(rotateZ(rotateY(box([300, 36, 6], [0, 0, 0], "Demonmarch_Char", 1), -38 + (rr() - 0.5) * 10), (rr() - 0.5) * 12), [XH - 150, y, 110 + rr() * 10]));
  }
  // burnt hay, still smouldering
  for (const [x, y, s] of [[-120, -330, 1], [150, -280, 0.8], [-60, 300, 0.9]] as number[][]) {
    out.push(lump([x, y, 0], [110 * s, 90 * s, 60 * s], 232 + x, "Demonmarch_StrawBurnt", 1, 0.2));
    out.push(boxAt([14, 14, 4], [x + 20, y - 10, 58 * s], "Demonmarch_Ember"), boxAt([10, 10, 4], [x - 30, y + 26, 50 * s], "Demonmarch_Ember"));
  }
  out.push(patch(300, 0.5, 233, 1.5, "Demonmarch_Ash", { sx: 1.4, n: 24 }));
  // a wagon wheel leaning on the footing
  out.push(translate(rotateY(merge(torus(55, 5, 16, 4, "Demonmarch_Char"), ...Array.from({ length: 8 }, (_, i) => cylinderBetween([0, 0, 0], [Math.cos((i / 8) * TAU) * 52, Math.sin((i / 8) * TAU) * 52, 0], 2.5, 4, "Demonmarch_Char"))), 70), [-XH - 40, -380, 54]));
  return merge(...out);
}

// The village chapel, its roof burnt and fallen in: the tower over the door still standing with
// its slate spire, the bell in its belfry and a round window over the door; the nave's walls with
// their buttresses and tall windows (shards of red glass left in some), the tops broken; three
// charred trusses and a patch of slate left over the nave, the rest down inside among the toppled
// pews; the apse behind the altar; claw marks raked down the south wall; about 18 x 9 m, the
// spire 15.5 m.
function ruinedChapel(): Geo {
  const rr = seeded(241), out: Geo[] = [];
  const S = "Demonmarch_ChapelStone", Sd = "Demonmarch_FieldStoneDark";
  const NX0 = -560, NX1 = 640, NY = 380, T = 54, H = 620, RISE = 330;
  // plinth
  out.push(boxBounds([NX0 - 380, -NY - 30, 0], [NX1 + 30, NY + 30, 26], Sd, 3));
  // ---- the tower: x from -900 to -560, y +-200 ----
  const TX0 = -900, TX1 = NX0, TY = 200, TH = 1060;
  out.push(brokenWall("x", TX0 + T / 2, T, -TY, TY, 26, () => TH, S, [[0, 170, 0, 300], [0, 110, 790, 960]], 400));
  out.push(brokenWall("x", TX1 - T / 2, T, -TY, TY, 26, () => TH, S, [[0, 170, 0, 300], [0, 110, 790, 960]], 400));
  out.push(brokenWall("y", -TY + T / 2, T, TX0 + T, TX1 - T, 26, () => TH, S, [[-730, 110, 790, 960]], 400));
  out.push(brokenWall("y", TY - T / 2, T, TX0 + T, TX1 - T, 26, () => TH, S, [[-730, 110, 790, 960]], 400));
  // its corner buttresses, string courses, the cornice
  for (const [x, y] of [[TX0, -TY], [TX0, TY], [TX1, -TY], [TX1, TY]] as [number, number][]) out.push(boxBounds([x - 26, y - 26, 26], [x + 26, y + 26, 640], Sd, 3), boxBounds([x - 18, y - 18, 640], [x + 18, y + 18, 760], Sd, 3));
  for (const z of [380, 760]) out.push(boxBounds([TX0 - 8, -TY - 8, z], [TX1 + 8, TY + 8, z + 16], Sd, 2));
  out.push(boxBounds([TX0 - 16, -TY - 16, TH], [TX1 + 16, TY + 16, TH + 26], Sd, 3));
  // the spire: four slate faces rising from the cornice, an iron finial bent by the heat
  out.push(translate(rotateZ(cylinderAt({ rBot: (TY + 30) * Math.SQRT2, rTop: 6, height: 500, segments: 4, bottom: [0, 0, 0] }, "Demonmarch_Slate"), 45), [(TX0 + TX1) / 2, 0, TH + 26]));
  out.push(cylinderBetween([(TX0 + TX1) / 2, 0, TH + 500], [(TX0 + TX1) / 2 + 20, 10, TH + 590], 4, 6, "Demonmarch_IronBlack"), cylinderBetween([(TX0 + TX1) / 2 + 12, 6, TH + 560], [(TX0 + TX1) / 2 + 12, 40, TH + 552], 3, 5, "Demonmarch_IronBlack"));
  // the bell in its belfry, on a charred beam
  out.push(beamBetween([(TX0 + TX1) / 2, -TY + 30, 950], [(TX0 + TX1) / 2, TY - 30, 950], 18, 20, "Demonmarch_Char"));
  out.push(cylinderAt({ rBot: 48, rTop: 30, height: 70, segments: 14, bottom: [(TX0 + TX1) / 2, 0, 862] }, "Bronze"), ellipsoid([30, 30, 18], [(TX0 + TX1) / 2, 0, 932], "Bronze", 12));
  // the door through the tower, an arch over it, the doors burnt (one fallen in)
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * Math.PI, y = Math.cos(a) * 100, z = 300 + Math.sin(a) * 100;
    out.push(translate(rotateX(box([T + 8, 34, 22], [0, 0, 0], Sd, 2), (a * DEG) - 90), [TX0 + T / 2, y, z]));
  }
  out.push(boxBounds([TX0 + 10, -85, 0], [TX0 + 18, -2, 290], "Demonmarch_Char"), translate(rotateY(boxBounds([0, 2, 0], [8, 85, 290], "Demonmarch_Char"), 76), [TX0 + 30, 0, 30]));
  out.push(boxBounds([TX0 - 3, -100, 400], [TX0, 100, 470], "Demonmarch_Soot"));
  // the round window over the door: its stone ring, tracery, a few shards of glass
  out.push(ringX(80, 12, [TX0 - 4, 0, 560], Sd, 20), ringX(30, 6, [TX0 - 4, 0, 560], Sd, 12));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    out.push(beamBetween([TX0 - 4, Math.cos(a) * 30, 560 + Math.sin(a) * 30], [TX0 - 4, Math.cos(a) * 74, 560 + Math.sin(a) * 74], 8, 8, Sd));
  }
  out.push(box([3, 50, 40], [TX0 + 2, 30, 530], "Demonmarch_StainedGlass"), box([3, 40, 30], [TX0 + 2, -36, 590], "Demonmarch_StainedGlass"));
  // ---- the nave: its walls broken at the top, tall windows, buttresses ----
  const wins = [-380, -120, 140, 400];
  const winHoles = wins.map((x): Hole => [x, 96, 210, 480]);
  out.push(brokenWall("y", -NY + T / 2, T, NX0, NX1, 26, (s) => H - 30 + 26 * wob(s, 9) - 160 * Math.max(0, 1 - Math.abs(s - 260) / 170), S, winHoles));
  out.push(brokenWall("y", NY - T / 2, T, NX0, NX1, 26, (s) => H - 20 + 30 * wob(s, 10) - 220 * Math.max(0, 1 - Math.abs(s + 300) / 150), S, winHoles));
  // the front gable behind the tower, the back wall into the apse
  out.push(brokenWall("x", NX0 + T / 2, T, -NY + T, NY - T, 26, (s) => H + Math.max(0, RISE * (1 - Math.abs(s) / NY)) - 30 + 20 * wob(s, 11), S, [[0, 170, 0, 300]], 50));
  out.push(brokenWall("x", NX1 - T / 2, T, -NY + T, NY - T, 26, (s) => H - 60 + 30 * wob(s, 12), S, [[0, 300, 0, 470]], 60));
  for (const k of [-1, 1]) {
    // the pointed heads of the windows, soot above them, glass left in the bottoms of some
    for (const x of wins) {
      const face = k * (NY + 3);
      out.push(beamBetween([x - 60, face, 478], [x, face, 548], 12, 12, Sd), beamBetween([x + 60, face, 478], [x, face, 548], 12, 12, Sd));
      out.push(boxBounds(k < 0 ? [x - 60, -NY - 2, 500] : [x - 60, NY, 500], k < 0 ? [x + 60, -NY, 600] : [x + 60, NY + 2, 600], "Demonmarch_Soot"));
      // (a few shards of the glass left in the frame's bottom corners)
      if (rr() < 0.6) out.push(boxBounds([x - 46, k * (NY - T / 2) - 2, 212], [x - 46 + 30 + rr() * 30, k * (NY - T / 2) + 2, 212 + 30 + rr() * 50], "Demonmarch_StainedGlass"));
      if (rr() < 0.5) out.push(boxBounds([x + 16 - rr() * 20, k * (NY - T / 2) - 2, 212], [x + 46, k * (NY - T / 2) + 2, 212 + 20 + rr() * 40], "Demonmarch_StainedGlass"));
    }
    // buttresses
    for (const x of [-500, -250, 10, 270, 520]) {
      out.push(boxBounds([x - 30, k > 0 ? NY : -NY - 70, 26], [x + 30, k > 0 ? NY + 70 : -NY, 400], Sd, 3));
      out.push(translate(rotateX(box([56, 60, 90], [0, 0, 0], Sd, 2), k * 35), [x, k * (NY + 22), 420]));
    }
  }
  // the apse: a half-round wall behind the altar
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + ((i + 0.5) / 7) * Math.PI, r = 250, x = NX1 - 20 + Math.cos(a) * r, y = Math.sin(a) * r;
    const h = H - 140 + 40 * Math.sin(i * 2.1);
    out.push(translate(rotateZ(boxAt([T, 2 * r * Math.sin(Math.PI / 14) + 8, h], [0, 0, 0], S, 2), a * DEG), [x, y, 26]));
  }
  out.push(boxBounds([NX1 + 20, -330, 0], [NX1 + 270, 330, 26], Sd, 3));
  // the roof that is left: three trusses, the ridge between two, slates on the north slope
  for (const x of [-430, -160, 350]) {
    out.push(beamBetween([x, -NY + 20, H - 30], [x, NY - 20, H - 30], 22, 26, "Demonmarch_Char"));
    out.push(beamBetween([x, -NY + 20, H - 30], [x, 0, H - 30 + RISE], 18, 22, "Demonmarch_Char"));
    if (x !== 350) out.push(beamBetween([x, NY - 20, H - 30], [x, 0, H - 30 + RISE], 18, 22, "Demonmarch_Char"));
    else out.push(beamBetween([x, NY - 20, H - 30], [x, 150, H + 80], 18, 22, "Demonmarch_Char"));
  }
  out.push(beamBetween([-470, 0, H - 26 + RISE], [-120, 0, H - 26 + RISE], 20, 22, "Demonmarch_Char"));
  const ang = (Math.atan2(RISE, NY) * 180) / Math.PI, slope = Math.hypot(RISE, NY) + 40;
  out.push(translate(rotateX(box([340, slope, 10], [0, 0, 0], "Demonmarch_Slate"), -ang), [-330, NY / 2 + 10, H - 30 + RISE / 2 + 8]));
  out.push(translate(rotateX(box([200, slope * 0.6, 10], [0, 0, 0], "Demonmarch_Slate"), ang), [-380, -NY * 0.62, H - 30 + RISE * 0.33]));
  // inside: the floor of ash and rubble, fallen beams and slates, the pews toppled, the altar
  out.push(patch(420, 0.4, 242, 27, "Demonmarch_Ash", { sx: 1.35, sy: 0.75, n: 26 }));
  for (let i = 0; i < 10; i++) {
    const x = NX0 + 120 + i * 100 + (rr() - 0.5) * 30, y = (i % 2 ? 1 : -1) * (120 + rr() * 60);
    out.push(translate(rotateZ(rotateY(merge(boxBounds([-18, -110, 30], [18, 110, 36], "Demonmarch_Char"), boxBounds([16, -110, 36], [20, 110, 80], "Demonmarch_Char"), boxBounds([-14, -104, 0], [-8, -98, 30], "Demonmarch_Char"), boxBounds([-14, 98, 0], [-8, 104, 30], "Demonmarch_Char")), rr() < 0.4 ? 70 : 0), (rr() - 0.5) * 30), [x, y, 26]));
  }
  for (let i = 0; i < 7; i++) {
    const x = NX0 + 100 + rr() * (NX1 - NX0 - 200), y = (rr() - 0.5) * 2 * (NY - 120);
    out.push(translate(rock([90 + rr() * 60, 70 + rr() * 50, 30 + rr() * 30], 0.4, 243 + i, i % 2 ? S : Sd, true), [x, y, 26]));
    out.push(boxAt([10, 10, 3], [x + 30, y - 20, 50], "Demonmarch_Ember"));
  }
  out.push(beamBetween([-300, -200, 30], [200, 120, 210], 20, 22, "Demonmarch_Char"), beamBetween([100, 250, 30], [480, -60, 60], 18, 20, "Demonmarch_Char"));
  out.push(boxBounds([NX1 + 60, -90, 26], [NX1 + 140, 90, 130], S, 3), boxBounds([NX1 + 54, -96, 130], [NX1 + 146, 96, 142], Sd, 2), boxBounds([NX1 + 56, -70, 100], [NX1 + 58, 70, 132], "Demonmarch_ClothRed"));
  // the claws raked down the south wall
  out.push(rotateZ(clawMarks(-NY, -230, 120, 150, -30, 4, 30), 90));
  return merge(...out);
}

// A stretch of field-stone garden wall, 400 cm along Y, broken down at its +Y end, a demon's
// claws raked across its front (-X) and the stones it knocked out lying at its foot.
function clawWall(): Geo {
  const rr = seeded(251), out: Geo[] = [];
  const top = (y: number) => (y > 110 ? 160 - (y - 110) * 0.45 : 160);
  for (let row = 0; row < 4; row++) {
    let y = -200 + (row % 2 ? 30 : 0);
    if (row % 2) out.push(boxBounds([-24, -200, row * 40], [24, -170, row * 40 + 38], "Demonmarch_FieldStone", 2));
    while (y < 200 - 5) {
      const l = Math.min(200 - y, 50 + rr() * 40), z = row * 40;
      if (z + 38 <= top(y + l / 2) + 4) out.push(boxBounds([-24 + (rr() - 0.5) * 6, y + 1, z], [24 + (rr() - 0.5) * 6, y + l - 1, z + 38], rr() < 0.25 ? "Demonmarch_FieldStoneDark" : "Demonmarch_FieldStone", 2));
      y += l;
    }
  }
  for (let y = -200; y < 110; y += 62) out.push(boxBounds([-30, y + 1, 160], [30, Math.min(110, y + 61), 172], "Demonmarch_FieldStoneDark", 2));
  out.push(clawMarks(-24, -150, 95, 120, -40, 4, 20));
  for (let i = 0; i < 4; i++) out.push(translate(rock([40 + rr() * 20, 30 + rr() * 16, 26], 0.3, 252 + i, "Demonmarch_FieldStone"), [-60 - rr() * 40, 120 + rr() * 80, 0]));
  return merge(...out);
}

// The village well: a round wall of dressed stone with dark water down in it, its little roof
// burnt away to a charred A of rafters over the windlass, the bucket still hanging on its rope;
// about 2.4 m across.
function burntWell(): Geo {
  const rr = seeded(261), out: Geo[] = [];
  for (let c = 0; c < 2; c++)
    for (let i = 0; i < 12; i++) {
      const a = ((i + c * 0.5) / 12) * TAU;
      out.push(translate(rotateZ(box([26, 44, 34], [0, 0, 0], "Demonmarch_FieldStone", 2), a * DEG), [Math.cos(a) * 82, Math.sin(a) * 82, 17 + c * 35]));
    }
  for (let i = 0; i < 12; i++) {
    const a = ((i + 0.25) / 12) * TAU;
    out.push(translate(rotateZ(box([36, 46, 10], [0, 0, 0], "Demonmarch_FieldStoneDark", 2), a * DEG), [Math.cos(a) * 84, Math.sin(a) * 84, 75]));
  }
  out.push(cylinderAt({ radius: 70, height: 50, segments: 16, bottom: [0, 0, 6] }, "Demonmarch_PitDark"), cylinderAt({ radius: 69, height: 2, segments: 16, bottom: [0, 0, 56] }, "Demonmarch_WellWater"));
  // posts, windlass, the rafters left of its roof
  for (const k of [-1, 1]) out.push(boxAt([16, 16, 250], [0, k * 104, 0], k > 0 ? "Demonmarch_Char" : "Demonmarch_Timber", 1.5), beamBetween([0, k * 104, 248], [0, 0, 330], 12, 14, "Demonmarch_Char"));
  out.push(cylinderBetween([0, -112, 170], [0, 112, 170], 8, 8, "Demonmarch_Timber"), boxBounds([-4, -124, 150], [4, -116, 190], "Demonmarch_IronBlack"));
  out.push(cylinderBetween([0, 0, 170], [0, 0, 112], 1.2, 4, "RopeTan"), cylinderAt({ rBot: 13, rTop: 16, height: 26, segments: 10, bottom: [0, 0, 86] }, "Demonmarch_Timber"));
  out.push(beamBetween([-60, 0, 330], [60, 0, 330], 10, 10, "Demonmarch_Char"));
  // the roof's boards lying where they fell, a second bucket
  for (let i = 0; i < 4; i++) out.push(translate(rotateZ(box([110, 18, 4], [0, 0, 0], "Demonmarch_Char", 1), 20 + rr() * 50), [130 + rr() * 50, -60 + i * 34, 2 + i * 0.5]));
  out.push(translate(rotateY(cylinderAt({ rBot: 13, rTop: 16, height: 26, segments: 10, bottom: [0, 0, 0] }, "Demonmarch_Timber"), 90), [-130, 70, 16]));
  return merge(...out);
}

// The new graveyard: two rows of filled graves under crude crosses, a third row dug and waiting,
// spoil heaped behind each pit with a spade left standing in one, plain coffins stacked, a barrow
// and a lantern on a post; about 7.4 x 8 m.
function freshGraves(): Geo {
  const rr = seeded(271), out: Geo[] = [];
  const cross = (x: number, y: number, h: number, tilt: number, mat = "Demonmarch_Weathered") =>
    translate(rotateX(merge(boxAt([8, 8, h], [0, 0, -16], mat), boxAt([7, 52, 8], [0, 0, h * 0.62], mat)), tilt), [x, y, 0]);
  for (let row = 0; row < 2; row++)
    for (let i = 0; i < 4; i++) {
      const x = -160 + row * 230, y = -300 + i * 200 + (rr() - 0.5) * 20;
      out.push(lump([x, y, -8], [104, 48, 24], 272 + row * 5 + i, row ? "Demonmarch_EarthFresh" : "Demonmarch_Earth", 1, 0.1));
      out.push(cross(x - 118, y, 100 + rr() * 20, (rr() - 0.5) * 14, row ? "Demonmarch_Weathered" : "Demonmarch_Timber"));
      if (rr() < 0.4) out.push(ellipsoid([10, 14, 6], [x - 70, y + 10, 18], "Demonmarch_DeadStalk", 6));
    }
  // the third row: three pits dug and waiting, their spoil heaped behind them
  for (let i = 0; i < 3; i++) {
    const x = 300, y = -250 + i * 230;
    out.push(boxBounds([x - 92, y - 42, 0.6], [x + 92, y + 42, 1.6], "Demonmarch_PitDark"));
    out.push(boxBounds([x - 104, y - 54, 0], [x + 104, y - 42, 12], "Demonmarch_EarthFresh"), boxBounds([x - 104, y + 42, 0], [x + 104, y + 54, 12], "Demonmarch_EarthFresh"));
    out.push(boxBounds([x - 104, y - 42, 0], [x - 92, y + 42, 12], "Demonmarch_EarthFresh"), boxBounds([x + 92, y - 42, 0], [x + 104, y + 42, 12], "Demonmarch_EarthFresh"));
    out.push(lump([x + 160, y, 0], [60, 70, 46], 290 + i, "Demonmarch_EarthFresh", 1, 0.18));
  }
  // the spade stuck in a heap, a pick lying by a pit
  out.push(translate(rotateY(merge(cylinderAt({ radius: 3, height: 110, segments: 6, bottom: [0, 0, 0] }, "Demonmarch_Timber"), boxAt([4, 24, 30], [0, 0, -30], "Demonmarch_IronBlack"), boxAt([6, 16, 4], [0, 0, 108], "Demonmarch_Timber")), -16), [460, -230, 40]));
  out.push(translate(rotateZ(merge(cylinderBetween([0, -50, 4], [0, 50, 4], 3, 6, "Demonmarch_Timber"), beamBetween([-30, 46, 4], [30, 46, 4], 6, 6, "Demonmarch_IronBlack")), 30), [380, 160, 0]));
  // coffins: two stacked, one by the middle pit
  const coffin = (x: number, y: number, z: number, turn: number) =>
    translate(rotateZ(merge(
      boxAt([180, 52, 30], [0, 0, 0], "Demonmarch_Weathered", 2), boxAt([186, 56, 6], [0, 0, 30], "Demonmarch_Timber", 1.5),
    ), turn), [x, y, z]);
  out.push(coffin(140, 330, 0, 90), coffin(140, 330, 36, 84), coffin(230, -20, 0, 2));
  // the barrow with earth in it, the lantern on its post
  out.push(translate(rotateZ(merge(
    boxBounds([-50, -30, 30], [50, 30, 62], "Demonmarch_Timber", 2), lump([0, 0, 58], [44, 26, 16], 299, "Demonmarch_EarthFresh", 0, 0.15),
    translate(rotateX(torus(17, 4, 12, 4, "Demonmarch_IronBlack"), 90), [-62, 0, 18]),
    cylinderBetween([40, -26, 44], [110, -30, 50], 3, 5, "Demonmarch_Timber"), cylinderBetween([40, 26, 44], [110, 30, 50], 3, 5, "Demonmarch_Timber"),
    boxAt([5, 5, 30], [30, -26, 0], "Demonmarch_Timber"), boxAt([5, 5, 30], [30, 26, 0], "Demonmarch_Timber"),
  ), 200), [-20, 390, 0]));
  out.push(boxAt([10, 10, 170], [-300, -360, 0], "Demonmarch_Timber"), boxAt([30, 6, 6], [-290, -360, 164], "Demonmarch_Timber"), boxAt([16, 16, 22], [-278, -360, 140], "Demonmarch_IronBlack"), boxAt([10, 10, 14], [-278, -360, 144], "LanternGlow"));
  return merge(...out);
}

// A stretch of fence burnt in the fire, 400 cm along Y: charred posts (one burnt short), rails
// broken and fallen.
function burntFence(): Geo {
  const post = (y: number, h: number) => merge(boxAt([13, 13, h], [0, y, 0], "Demonmarch_Char", 1.5), boxAt([10, 10, 6], [0, y, h], "Demonmarch_Soot"));
  return merge(
    post(-195, 118), post(-2, 64), post(195, 112),
    boxBounds([-5, -195, 86], [5, -40, 98], "Demonmarch_Char"), boxBounds([-5, 30, 86], [5, 195, 98], "Demonmarch_Timber"),
    boxBounds([-5, -195, 40], [5, 195, 52], "Demonmarch_Timber"),
    beamBetween([-10, -40, 92], [-30, 40, 6], 10, 12, "Demonmarch_Char"),
    boxAt([12, 12, 3], [0, -2, 64], "Demonmarch_Ember"),
  );
}

// A field left to die: six furrows of earth, 8 m along Y, the crop on them withered grey and
// brown, broken and flattened in places.
function deadCrops(): Geo {
  const rr = seeded(281), out: Geo[] = [];
  for (let r = 0; r < 6; r++) {
    const x = -250 + r * 100;
    out.push(boxBounds([x - 30, -400, -4], [x + 30, 400, 14], "Demonmarch_Earth", 7));
    for (let y = -380; y < 380; y += 32 + rr() * 16) {
      if (rr() < 0.2) continue;
      for (let k = 0; k < 2; k++) {
        const h = 46 + rr() * 44, lean = 10 + rr() * 32 + (rr() < 0.2 ? 45 : 0), a = rr() * 360;
        out.push(translate(rotateZ(rotateY(cylinderAt({ rBot: 2.4, rTop: 0.6, height: h, segments: 3, bottom: [0, 0, 0] }, rr() < 0.35 ? "Demonmarch_DeadStalkDark" : "Demonmarch_DeadStalk"), lean), a), [x + (rr() - 0.5) * 18, y + (rr() - 0.5) * 10, 12]));
      }
    }
  }
  return merge(...out);
}

// ---- the demon camp ----

// A fence of the camp, 400 cm along Y: great ribs driven into the ground and curling out over the
// outside (-X), lashed to two rails of dark timber on the camp side, iron spikes between them and
// a horned skull on the middle rib.
function boneFence(): Geo {
  const rr = seeded(301), out: Geo[] = [];
  out.push(boxBounds([20, -205, 58], [38, 205, 78], "Demonmarch_DarkWood", 2), boxBounds([20, -205, 178], [38, 205, 198], "Demonmarch_DarkWood", 2));
  for (let i = 0; i < 7; i++) {
    const y = -180 + i * 60 + (rr() - 0.5) * 10, h = 270 + rr() * 60, r0 = 13 + rr() * 3;
    out.push(tube([[12, y, -20], [8, y, h * 0.4], [-12, y, h * 0.78], [-50, y + (rr() - 0.5) * 12, h]], r0, 3, i % 3 === 1 ? "Demonmarch_BoneDark" : "Demonmarch_Bone", { seg: 6, maxRings: 7, seed: 302 + i }));
    for (const z of [68, 188]) out.push(translate(torus(r0 + 2, 2.6, 8, 4, "RopeTan"), [8 - (z > 100 ? 4 : 0), y, z]));
  }
  for (let i = 0; i < 6; i++) out.push(spike([4, -150 + i * 60, 110 + (i % 2) * 60], [-1, 0, 0.25], 64, 4.5, "Demonmarch_IronBlack", 4));
  out.push(translate(hornedSkull(0.6), [-34, 0, 262]));
  return merge(...out);
}

// The camp's gate: two columns of great vertebrae on stone feet either side of a 5 m way, horns
// sweeping up off them, a timber beam across with a giant beast's skull on it, its eyes glowing
// red, braziers of hellfire on the columns' spurs and chains hanging with small skulls; about
// 8 m across, 8.5 m tall.
function boneGate(): Geo {
  const out: Geo[] = [];
  for (const k of [-1, 1]) {
    const y = k * 330;
    out.push(boxBounds([-82, y - 82, 0], [82, y + 82, 60], "Demonmarch_CampStone", 4));
    for (let i = 0; i < 7; i++) {
      const z = 60 + i * 72;
      out.push(cylinderAt({ rBot: 54, rTop: 46, height: 46, segments: 10, bottom: [0, y, z] }, i % 2 ? "Demonmarch_BoneDark" : "Demonmarch_Bone"));
      out.push(cylinderAt({ radius: 36, height: 26, segments: 8, bottom: [0, y, z + 46] }, "Demonmarch_BoneDark"));
      out.push(translate(rotateZ(box([128, 20, 14], [0, 0, 0], "Demonmarch_Bone", 3), 25 + i * 40), [0, y, z + 30]));
    }
    out.push(tube([[0, y, 560], [0, y + k * 50, 660], [-20, y + k * 30, 760], [-60, y - k * 30, 820]], 32, 3, "Demonmarch_BoneDark", { seg: 8, maxRings: 9, seed: 310 + k }));
    // a brazier on a spur out over the way's front
    out.push(beamBetween([0, y, 420], [-110, y - k * 10, 440], 16, 16, "Demonmarch_IronBlack"), cylinderAt({ rBot: 16, rTop: 30, height: 24, segments: 8, bottom: [-118, y - k * 10, 440] }, "Demonmarch_IronBlack"), flames([-118, y - k * 10, 462], 44));
  }
  // the beam and the skull on it
  out.push(beamBetween([0, -330, 560], [0, 330, 560], 46, 50, "Demonmarch_DarkWood"));
  out.push(
    ellipsoid([110, 130, 92], [20, 0, 660], "Demonmarch_Bone", 12),
    translate(rotateY(scale(cylinderAt({ rBot: 70, rTop: 34, height: 190, segments: 6, bottom: [0, 0, 0] }, "Demonmarch_Bone"), [1, 1.15, 1]), -95), [-40, 0, 640]),
    ...[-1, 1].map((k) => translate(rotateZ(box([90, 40, 26], [0, 0, 0], "Demonmarch_Bone", 6), k * 18), [-50, k * 58, 712])),
    ...[-1, 1].map((k) => ellipsoid([20, 22, 16], [-70, k * 56, 688], "Demonmarch_Hollow", 8)),
    ...[-1, 1].map((k) => ellipsoid([8, 8, 7], [-80, k * 56, 688], "Demonmarch_Sigil", 6)),
    ...[-1, 1].map((k) => tube([[0, k * 100, 700], [10, k * 210, 760], [-40, k * 300, 830], [-110, k * 330, 860]], 26, 3, "Demonmarch_BoneDark", { seg: 8, maxRings: 9 })),
  );
  for (let i = 0; i < 6; i++) out.push(spike([-200 + i * 12, (i % 2 ? 1 : -1) * (14 + i * 4), 610], [0.1, 0, -1], 30 - i * 2, 6, "Demonmarch_Bone", 4));
  // chains hanging from the beam, a small skull at the end of each
  for (const y of [-200, 200]) {
    out.push(chain([-10, y, 532], 7, 7));
    out.push(translate(hornedSkull(0.32), [-10, y, 440]));
  }
  return merge(...out);
}

// A war tent of the demon army: black hides on bone poles that cross and jut out over its peak,
// the door flap folded back on a red glow, the horned sigil painted above it, ropes to stakes;
// about 5.2 m across (7 m with its ropes), 5.6 m tall.
function blackTent(): Geo {
  const out: Geo[] = [];
  const R = 260, H = 430, ap = R * Math.cos(Math.PI / 6);
  const a = (z: number) => ap - (ap - 22) * (z / H);
  out.push(rotateZ(cylinderAt({ rBot: R, rTop: 26, height: H, segments: 6, bottom: [0, 0, 0] }, "Demonmarch_TentBlack"), 30));
  // patches of other hides sewn on
  for (const [turn, z, w, h] of [[60, 120, 90, 70], [120, 200, 70, 60], [240, 90, 100, 60], [300, 240, 60, 50]] as number[][])
    out.push(rotateZ(translate(rotateY(box([3, w, h], [0, 0, 0], "Demonmarch_TentPatch"), (Math.atan2(ap - 22, H) * 180) / Math.PI), [-a(z) - 1, 0, z]), turn));
  // the door on the front face, its flap folded back
  const d0 = a(0) + 2, d1 = a(220) + 2;
  out.push(tris([-d0, -72, 0, -d1, 0, 220, -d0, 72, 0], "Demonmarch_TentDoor", true));
  out.push(tris([-d0, -72, 0, -d1, 0, 220, -d0 - 46, -150, 14], "Demonmarch_TentPatch", true));
  out.push(translate(rotateY(sigil([0, 0, 0], 38), (Math.atan2(ap - 22, H) * 180) / Math.PI), [-a(300) - 3, 0, 300]));
  // the poles: four bones crossing at the peak and jutting out over it
  for (let i = 0; i < 4; i++) {
    const t = (i / 4) * TAU + Math.PI / 4, base: V3 = [Math.cos(t) * (R - 10), Math.sin(t) * (R - 10), -10], apex: V3 = [0, 0, H - 10];
    const over = add(apex, mul([apex[0] - base[0], apex[1] - base[1], apex[2] - base[2]], 0.3));
    out.push(cylinderBetween(base, apex, 9, 6, "Demonmarch_Bone", 6), cylinderBetween(apex, over, 6, 6, "Demonmarch_Bone", 2.5));
  }
  // ropes out to stakes
  for (let i = 0; i < 6; i++) {
    const t = (i / 6) * TAU + Math.PI / 6;
    if (Math.abs(Math.cos(t) + 1) < 0.15) continue;
    const from: V3 = [Math.cos(t) * a(190), Math.sin(t) * a(190), 190], to: V3 = [Math.cos(t) * 360, Math.sin(t) * 360, 14];
    out.push(cylinderBetween(from, to, 1.2, 3, "RopeTan"), cylinderBetween([to[0], to[1], -10], [to[0] * 0.98, to[1] * 0.98, 30], 4, 4, "Demonmarch_Bone"));
  }
  return merge(...out);
}

// The war drum the army marches to: a great drum of dark staves bound in black iron, its head
// facing -X painted with the sigil, on trestles on a round dais of dark stone; two bone posts
// with skulls at its front corners and two thigh bones for beating it leaning on it; the dais
// about 6.6 m across, the drum 4.2 m tall.
function warDrum(): Geo {
  const out: Geo[] = [];
  out.push(cylinderAt({ radius: 330, height: 30, segments: 22, bottom: [0, 0, 0] }, "Demonmarch_CampStone"), cylinderAt({ radius: 290, height: 22, segments: 22, bottom: [0, 0, 30] }, "Demonmarch_CampStone"));
  const zc = 240, R = 150;
  out.push(cylinderBetween([-110, 0, zc], [110, 0, zc], R, 20, "Demonmarch_DarkWood"));
  for (const x of [-104, -40, 40, 104]) out.push(ringX(R + 3, 5, [x, 0, zc], "Demonmarch_IronBlack", 24));
  out.push(cylinderBetween([-115, 0, zc], [-110, 0, zc], R - 6, 20, "Demonmarch_DrumSkin"), cylinderBetween([110, 0, zc], [115, 0, zc], R - 6, 20, "Demonmarch_DrumSkin"));
  out.push(sigil([-117, 0, zc - 10], 62));
  // the cords strung between the hoops
  for (let i = 0; i < 12; i++) {
    const t0 = (i / 12) * TAU, t1 = ((i + 0.5) / 12) * TAU;
    out.push(cylinderBetween([-104, Math.cos(t0) * (R + 6), zc + Math.sin(t0) * (R + 6)], [104, Math.cos(t1) * (R + 6), zc + Math.sin(t1) * (R + 6)], 1.6, 3, "RopeTan"));
  }
  // trestles under it
  for (const x of [-70, 70]) {
    for (const k of [-1, 1]) out.push(beamBetween([x, k * 200, 52], [x, k * 60, zc - R + 30], 18, 18, "Demonmarch_DarkWood"));
    out.push(beamBetween([x, -150, 140], [x, 150, 140], 14, 14, "Demonmarch_DarkWood"));
  }
  // bone posts with skulls at its front corners, the beaters leaning on it
  for (const k of [-1, 1]) {
    out.push(tube([[-200, k * 200, 52], [-205, k * 205, 300], [-190, k * 200, 470]], 14, 8, "Demonmarch_Bone", { seg: 6, maxRings: 6 }));
    out.push(translate(rotateZ(hornedSkull(0.55), 0), [-200, k * 200, 500]));
    const bone = (from: V3, to: V3) => merge(cylinderBetween(from, to, 8, 6, "Demonmarch_Bone"), ellipsoid([16, 16, 14], from, "Demonmarch_Bone", 8), ellipsoid([14, 14, 13], to, "Demonmarch_Bone", 8));
    out.push(bone([-170, k * 120, 60], [-150, k * 80, 250]));
  }
  // skulls round the dais' rim
  for (let i = 0; i < 6; i++) {
    const t = (i / 6) * TAU + Math.PI / 6;
    out.push(translate(rotateZ(hornedSkull(0.3), t * DEG + 180), [Math.cos(t) * 300, Math.sin(t) * 300, 40]));
  }
  return merge(...out);
}

// A cage for prisoners on the sled it is dragged on: black iron bars, its door at the front swung
// open, spikes on its corners, chains, a padlock hanging open; inside straw, shackles and a
// broken helmet; about 3 x 2.8 m, 3 m tall.
function prisonerCage(): Geo {
  const rr = seeded(321), out: Geo[] = [];
  const W = 120, H = 240, Z = 36;
  out.push(boxBounds([-150, -140, 0], [150, -110, 24], "Demonmarch_DarkWood", 3), boxBounds([-150, 110, 0], [150, 140, 24], "Demonmarch_DarkWood", 3));
  out.push(translate(rotateY(box([40, 30, 24], [0, 0, 0], "Demonmarch_DarkWood", 3), -30), [-160, -125, 16]), translate(rotateY(box([40, 30, 24], [0, 0, 0], "Demonmarch_DarkWood", 3), -30), [-160, 125, 16]));
  out.push(boxBounds([-132, -132, 24], [132, 132, Z], "Demonmarch_DarkWood", 2));
  for (const x of [-W, W]) for (const y of [-W, W]) out.push(boxAt([12, 12, H + 10], [x, y, Z], "Demonmarch_IronBlack", 1.5), spike([x, y, Z + H + 10], [Math.sign(x) * 0.3, Math.sign(y) * 0.3, 1], 34, 5, "Demonmarch_IronBlack"));
  for (const z of [Z, Z + H]) {
    out.push(boxBounds([-W, -W - 5, z], [W, -W + 5, z + 10], "Demonmarch_IronBlack"), boxBounds([-W, W - 5, z], [W, W + 5, z + 10], "Demonmarch_IronBlack"));
    out.push(boxBounds([W - 5, -W, z], [W + 5, W, z + 10], "Demonmarch_IronBlack"), boxBounds([-W - 5, -W, z], [-W + 5, -60, z + 10], "Demonmarch_IronBlack"));
  }
  const bar = (x: number, y: number) => cylinderAt({ radius: 3, height: H, segments: 6, bottom: [x, y, Z] }, "Demonmarch_IronBlack");
  for (let s = -W + 22; s < W - 10; s += 22) {
    out.push(bar(s, -W), bar(s, W), bar(W, s));
    if (s < -60) out.push(bar(-W, s));
  }
  for (let s = -W + 22; s < W - 10; s += 30) out.push(cylinderBetween([s, -W, Z + H + 5], [s, W, Z + H + 5], 3, 6, "Demonmarch_IronBlack"));
  // the door, swung open about its hinge at y = -60
  const door: Geo[] = [boxBounds([-5, 0, 0], [5, 172, 10], "Demonmarch_IronBlack"), boxBounds([-5, 0, H - 10], [5, 172, H], "Demonmarch_IronBlack"), boxAt([10, 10, H], [0, 172, 0], "Demonmarch_IronBlack")];
  for (let s = 22; s < 170; s += 22) door.push(cylinderAt({ radius: 3, height: H, segments: 6, bottom: [0, s, 0] }, "Demonmarch_IronBlack"));
  out.push(translate(rotateZ(merge(...door), 50), [-W, -60, Z]));
  out.push(translate(merge(boxAt([10, 6, 14], [0, 0, 0], "Demonmarch_Rust"), translate(rotateY(torus(5, 1.5, 8, 4, "Demonmarch_Rust"), 90), [0, 0, 18])), [-W - 14, 40, 110]));
  // chains hanging from the top corners
  for (const [x, y] of [[-W, -W], [W, W]] as [number, number][])
    out.push(chain([x + Math.sign(x) * 8, y + Math.sign(y) * 8, Z + H - 10], 6));
  // straw, shackles, a helmet inside
  out.push(patch(90, 0.6, 322, Z + 1, "Demonmarch_Straw", { sx: 1.2, n: 18 }), lump([30, 40, Z], [50, 40, 14], 323, "Demonmarch_Straw", 0, 0.2));
  out.push(translate(torus(10, 2, 10, 4, "Demonmarch_IronBlack"), [-40, -30, Z + 3]), translate(torus(10, 2, 10, 4, "Demonmarch_IronBlack"), [-20, -36, Z + 3]), cylinderBetween([-30, -33, Z + 3], [W - 4, -60, Z + 30], 1.4, 3, "Demonmarch_IronBlack"));
  out.push(translate(rotateY(merge(ellipsoid([17, 17, 15], [0, 0, 0], "IronLight", 10), cylinderAt({ radius: 18, height: 3, segments: 10, bottom: [0, 0, -2] }, "IronDark")), 100), [50, -60, Z + 16]));
  out.push(cylinderBetween([60, 70 + rr() * 20, Z + 4], [100, 30, Z + 4], 4, 5, "Demonmarch_Bone"));
  return merge(...out);
}

// What is left of the gate the army came through: a ring of carved dark stone 7.6 m across, broken
// into pieces (two standing, one fallen, two hanging in the air where the magic holds them), runes
// still glowing on them; in its middle the rift itself, a tear of violet light facing -X, stone and
// crystal chips hanging round it and cracks of light running over the scorched ground; about
// 9 m across, 8 m tall.
function riftShard(): Geo {
  const rr = seeded(331), out: Geo[] = [];
  out.push(patch(430, 0.4, 332, 0.8, "Demonmarch_BlightSoil", { n: 32 }));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + rr() * 0.4, L = 220 + rr() * 200, pts: number[] = [];
    let x = Math.cos(a) * 60, y = Math.sin(a) * 60, b = a;
    for (let s = 0; s < 4; s++) {
      const nx = x + (Math.cos(b) * L) / 4, ny = y + (Math.sin(b) * L) / 4, w = 9 - s * 2;
      const px = -Math.sin(b) * w, py = Math.cos(b) * w;
      pts.push(x + px, y + py, 1.6, nx, ny, 1.6, x - px, y - py, 1.6);
      x = nx;
      y = ny;
      b += (rr() - 0.5) * 0.7;
    }
    out.push(tris(pts, "Demonmarch_Rift"));
  }
  const zc = 380;
  // the rift: rings and layers of light in the plane x = 0, its dark heart
  out.push(translate(scale(rotateY(torus(1, 0.1, 32, 6, "Demonmarch_Rift"), 90), [60, 150, 250]), [0, 0, zc]));
  out.push(translate(scale(rotateY(torus(1, 0.07, 28, 5, "Demonmarch_RiftCore"), 90), [60, 118, 205]), [0, 0, zc]));
  out.push(translate(scale(rotateY(cylinderCenter(1, 6, 28, [0, 0, 0], "Demonmarch_Rift"), 90), [1, 140, 236]), [0, 0, zc]));
  for (const x of [-5, 5]) out.push(translate(scale(rotateY(cylinderCenter(1, 2, 24, [0, 0, 0], "Demonmarch_RiftDeep"), 90), [1, 86, 160]), [x, 0, zc]));
  for (let i = 0; i < 5; i++) {
    const t0 = (i / 5) * TAU, pts: V3[] = [];
    for (let s = 0; s <= 6; s++) {
      const t = t0 + s * 0.5, r = 1 - s * 0.13;
      pts.push([-8, Math.cos(t) * 120 * r, zc + Math.sin(t) * 210 * r]);
    }
    out.push(tube(pts, 6, 1.5, "Demonmarch_RiftCore", { seg: 4, maxRings: 10 }));
  }
  // the broken ring: arcs of voussoirs, in the plane x = 0 round the rift (some moved off it)
  const RING = 390;
  const arc = (a0: number, a1: number, shift: V3, tilt: number, spin: number): Geo => {
    const parts: Geo[] = [];
    const n = Math.max(2, Math.round(((a1 - a0) * RING) / 72));
    for (let i = 0; i < n; i++) {
      const a = a0 + ((i + 0.5) / n) * (a1 - a0), seg = ((a1 - a0) * RING) / n - 4;
      parts.push(translate(rotateX(box([70, seg, 84], [0, 0, 0], "Demonmarch_RiftStone", 4), a * DEG - 90), [0, Math.cos(a) * RING, Math.sin(a) * RING]));
      if (i % 2 === 0) parts.push(translate(rotateX(box([3, seg * 0.5, 20], [0, 0, 0], "Demonmarch_Rune"), a * DEG - 90), [-37, Math.cos(a) * RING, Math.sin(a) * RING]));
      parts.push(translate(rotateX(box([78, seg + 2, 14], [0, 0, 0], "Demonmarch_CampStone", 2), a * DEG - 90), [0, Math.cos(a) * (RING + 46), Math.sin(a) * (RING + 46)]));
    }
    // turned about the arc's middle, then moved
    const am = (a0 + a1) / 2, mid: V3 = [0, Math.cos(am) * RING, Math.sin(am) * RING];
    const g = translate(merge(...parts), mul(mid, -1));
    return translate(rotateZ(rotateX(g, tilt), spin), add(add(mid, shift), [0, 0, zc]));
  };
  out.push(arc(Math.PI * 1.06, Math.PI * 1.36, [10, 0, -10], 4, 8));
  out.push(arc(Math.PI * 1.62, Math.PI * 1.95, [-14, 0, -16], -6, -10));
  out.push(arc(Math.PI * 0.6, Math.PI * 0.86, [40, 50, 90], 14, 16));
  out.push(arc(Math.PI * 0.12, Math.PI * 0.36, [-30, -60, 110], -18, -12));
  // the fallen piece, lying on its side behind
  const am = Math.PI * 0.47;
  out.push(translate(rotateY(translate(arc(Math.PI * 0.38, Math.PI * 0.56, [0, 0, 0], 0, 0), [0, -Math.cos(am) * RING, -(zc + Math.sin(am) * RING)]), 78), [250, 170, 40]));
  // chips of stone and crystal hanging round it
  for (let i = 0; i < 12; i++) {
    const a = rr() * TAU, r = 240 + rr() * 200, z = 140 + rr() * 520, c: V3 = [(rr() - 0.5) * 160, Math.cos(a) * r, z];
    out.push(i % 3 ? translate(rock([30 + rr() * 30, 26 + rr() * 22, 24 + rr() * 16], 0.4, 333 + i, "Demonmarch_RiftStone"), c) : shard(8, 50, c, rr() * 90, rr() * 360));
  }
  out.push(translate(rock([120, 90, 50], 0.4, 350, "Demonmarch_RiftStone", true), [30, -330, 0]), translate(rock([90, 80, 40], 0.4, 351, "Demonmarch_RiftStone", true), [-20, 340, 0]));
  return merge(...out);
}

// A standard of the demon army: a tall pole of dark timber in a cairn of black stones, a crossbar
// hung with a ragged red banner bearing the horned sigil, a horned skull on top and chains off
// the crossbar's ends; about 7.4 m tall.
function demonBanner(): Geo {
  const rr = seeded(341), out: Geo[] = [];
  out.push(translate(rock([120, 110, 60], 0.4, 342, "Demonmarch_CampStone", true), [0, 0, 0]), translate(rock([70, 60, 40], 0.4, 343, "Demonmarch_CampStone"), [40, 50, 0]), translate(rock([60, 50, 34], 0.4, 344, "Demonmarch_CampStone"), [-30, -50, 0]));
  out.push(cylinderAt({ rBot: 9, rTop: 7, height: 640, segments: 8, bottom: [0, 0, 20] }, "Demonmarch_DarkWood"));
  out.push(cylinderBetween([-12, -124, 560], [-12, 124, 560], 5, 6, "Demonmarch_DarkWood"));
  for (let i = 0; i < 5; i++) {
    const y = -100 + i * 50, h = 300 - (i % 2 ? 40 : 0) - rr() * 60;
    out.push(boxBounds([-16, y - 24, 560 - h], [-12, y + 25, 556], i === 0 || i === 4 ? "Demonmarch_ClothDark" : "Demonmarch_ClothRed"));
    out.push(translate(rotateX(box([4, 30, 30], [0, 0, 0], i === 0 || i === 4 ? "Demonmarch_ClothDark" : "Demonmarch_ClothRed"), 45), [-14, y, 560 - h]));
  }
  out.push(boxBounds([-17, -124, 520], [-11, 124, 556], "Demonmarch_ClothDark"));
  out.push(sigil([-18, 0, 420], 50));
  out.push(translate(hornedSkull(0.7), [-6, 0, 680]));
  for (const y of [-118, 118]) {
    out.push(chain([-12, y, 548], 8));
    out.push(ellipsoid([6, 6, 8], [-12, y, 452], "Demonmarch_Bone", 6));
  }
  return merge(...out);
}

// A brazier of the camp: a black iron bowl on three bone legs, spikes round its rim, hellfire
// burning on its coals, a small skull on its front; about 1.2 m across, 2 m tall.
function hellBrazier(): Geo {
  const out: Geo[] = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.5;
    out.push(tube([[Math.cos(a) * 56, Math.sin(a) * 56, -4], [Math.cos(a) * 46, Math.sin(a) * 46, 60], [Math.cos(a) * 26, Math.sin(a) * 26, 112]], 6.5, 4, "Demonmarch_Bone", { seg: 5, maxRings: 4 }));
    out.push(ellipsoid([10, 10, 9], [Math.cos(a) * 56, Math.sin(a) * 56, 6], "Demonmarch_Bone", 6));
  }
  out.push(cylinderAt({ rBot: 24, rTop: 52, height: 40, segments: 10, bottom: [0, 0, 104] }, "Demonmarch_IronBlack"));
  out.push(translate(torus(52, 4, 14, 4, "Demonmarch_IronBlack"), [0, 0, 144]));
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU;
    out.push(spike([Math.cos(a) * 52, Math.sin(a) * 52, 144], [Math.cos(a), Math.sin(a), 1.2], 20, 3.2, "Demonmarch_IronBlack", 4));
  }
  out.push(lump([0, 0, 136], [44, 44, 12], 351, "Demonmarch_Ember", 0, 0.2));
  out.push(flames([0, 0, 144], 66));
  out.push(translate(hornedSkull(0.34), [-50, 0, 118]));
  return merge(...out);
}

// ---- the kit ----
export const KIT: Kit = {
  id: "demonmarch",
  name: "แดนที่อสูรกลืน",
  region: "รอบดินแดนอสูร",
  desc: "แผ่นดินรอบดินแดนอสูรที่ถูกกลืน · ทุ่งหนามดำกับผลึกม่วงและต้นไม้ดำกลายพันธุ์ หมู่บ้านชายแดนที่ถูกเผากับโบสถ์หลังคาพังและสุสานใหม่ และค่ายทัพอสูรริมทะเล รั้วกระดูก กระโจมดำ กลองศึก กรงเชลย กับเศษประตูมิติที่ยังเปิดอยู่",
  ground: "dirt",
  items: [
    // the thornland
    { id: "thorn_vines", name: "เถาหนามดำ", make: thornVines, tags: ["ground", "plant"] },
    { id: "thorn_thicket", name: "พุ่มหนามดำ", make: thornThicket, tags: ["plant", "decor"] },
    { id: "thorn_cage", name: "กรงหนามขังซากสัตว์", make: thornCage, tags: ["landmark", "plant"] },
    { id: "crystal_cluster", name: "กลุ่มผลึกม่วง", make: crystalCluster, tags: ["crystal", "magic"] },
    { id: "crystal_spire", name: "ยอดผลึกม่วงยักษ์", make: crystalSpire, tags: ["landmark", "crystal", "magic"] },
    { id: "ash_grass", name: "หญ้าไหม้สีเทา", make: ashGrass, tags: ["ground", "plant"] },
    { id: "blight_boulder", name: "หินดำผลึกงอก", make: blightBoulder, tags: ["rock", "decor"] },
    { id: "mutant_tree", name: "ต้นไม้ดำกลายพันธุ์", make: mutantTree, tags: ["tree", "plant"] },
    { id: "black_heart_tree", name: "ต้นไม้ดำหัวใจผลึก", make: blackHeartTree, tags: ["landmark", "tree"] },
    // the burnt villages
    { id: "charred_tree", name: "ต้นไม้ไหม้ดำ", make: charredTree, tags: ["tree", "plant"] },
    { id: "burnt_house", name: "บ้านไหม้", make: burntHouse, tags: ["building", "ruin"] },
    { id: "burnt_barn", name: "โรงนาไหม้", make: burntBarn, tags: ["building", "ruin"] },
    { id: "ruined_chapel", name: "โบสถ์หลังคาพัง", make: ruinedChapel, tags: ["landmark", "building", "ruin"] },
    { id: "claw_wall", name: "กำแพงรอยกรงเล็บ (4 ม.)", make: clawWall, tags: ["wall", "ruin"] },
    { id: "burnt_well", name: "บ่อน้ำหมู่บ้าน", make: burntWell, tags: ["decor"] },
    { id: "fresh_graves", name: "สุสานใหม่ที่ขุดไม่เสร็จ", make: freshGraves, tags: ["decor", "landmark"] },
    { id: "burnt_fence", name: "รั้วไม้ไหม้ (4 ม.)", make: burntFence, tags: ["fence"] },
    { id: "dead_crops", name: "ไร่ร้าง (8x6 ม.)", make: deadCrops, tags: ["ground", "crop"] },
    // the demon camp
    { id: "bone_fence", name: "รั้วกระดูก (4 ม.)", make: boneFence, tags: ["wall", "defence"] },
    { id: "bone_gate", name: "ประตูค่ายหัวกะโหลก", make: boneGate, tags: ["gate", "landmark", "defence"] },
    { id: "black_tent", name: "กระโจมดำ", make: blackTent, tags: ["building", "camp"] },
    { id: "war_drum", name: "กลองศึก", make: warDrum, tags: ["landmark", "camp"] },
    { id: "prisoner_cage", name: "กรงเชลย", make: prisonerCage, tags: ["camp", "decor"] },
    { id: "rift_shard", name: "เศษประตูมิติ", make: riftShard, tags: ["landmark", "magic"] },
    { id: "demon_banner", name: "ธงทัพอสูร", make: demonBanner, tags: ["decor", "camp"] },
    { id: "hell_brazier", name: "กระถางไฟนรก", make: hellBrazier, tags: ["light", "camp"] },
  ],
  sample,
};

// A corner of the march: a burnt cottage with its well, fence and clawed garden wall, a field left
// to die and the new graves (south-west); the thorns creeping in from the south-east with a
// twisted tree, crystals and a cage of thorn; the demon camp's rib fence and gate across the north
// with tents, banners, braziers, a prisoners' cage, the war drum and a shard of the rift.
function sample(put: Put): void {
  // the village corner
  put("burnt_house", [-1100, 1100, 0], 0);
  put("burnt_well", [-300, 400, 0], 30);
  put("claw_wall", [-1800, 300, 0], 0);
  put("claw_wall", [-1800, -100, 0], 180);
  put("burnt_fence", [-350, 1500, 0], 0);
  put("burnt_fence", [-350, 1900, 0], 0);
  put("dead_crops", [-1400, 1950, 0], 90, 0.8);
  put("charred_tree", [-200, 1000, 0], 30);
  put("charred_tree", [-1900, 1500, 0], 200, 0.85);
  put("fresh_graves", [-1650, -1650, 0], 0, 0.7);
  // the thorns creeping in
  put("mutant_tree", [-500, -1700, 0], 0);
  put("thorn_cage", [-900, -800, 0], 20);
  put("thorn_thicket", [-200, -300, 0], 0, 0.8);
  put("thorn_vines", [100, -1100, 0], 40);
  put("thorn_vines", [-1500, -600, 0], 160);
  put("crystal_cluster", [-100, -2000, 0], 0);
  put("crystal_spire", [-1300, -2150, 0], 30, 0.55);
  put("blight_boulder", [100, -1600, 0], 60, 0.7);
  for (const [x, y] of [[0, 400], [200, -300], [-600, -900], [-800, 300], [-200, 1700], [-1000, -1300], [-1500, 700], [-700, 2000]] as [number, number][]) put("ash_grass", [x, y, 0], x + y);
  // the camp
  for (let y = -2000; y <= 2000; y += 400) if (Math.abs(y) > 400) put("bone_fence", [600, y, 0], 0);
  put("bone_gate", [600, 0, 0], 0);
  put("black_tent", [1500, 1300, 0], 200);
  put("black_tent", [1700, -1000, 0], 160, 0.9);
  put("demon_banner", [350, 750, 0], 0);
  put("demon_banner", [350, -750, 0], 0);
  put("hell_brazier", [200, 350, 0], 0);
  put("hell_brazier", [200, -350, 0], 0);
  put("prisoner_cage", [1200, 300, 0], 270, 0.8);
  put("war_drum", [1700, 200, 0], 90, 0.6);
  put("rift_shard", [1800, -1900, 0], 180, 0.45);
  put("common:crate", [1100, -500, 0], 20);
}

// ---- the fields' shared helpers (full-size centimetres, north +X, west +Y) ----
export type XY = [number, number];
export type Poly = PavedPoly;

// A smooth winding line through `pts` (Catmull-Rom, `per` points a span).
export function smooth(pts: XY[], per = 4): XY[] {
  const out: XY[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// A strip `w` wide along a line.
export function band(pts: XY[], w: number): Poly {
  const L: XY[] = [], R: XY[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    L.push([pts[i][0] + (nx * w) / 2, pts[i][1] + (ny * w) / 2]);
    R.push([pts[i][0] - (nx * w) / 2, pts[i][1] - (ny * w) / 2]);
  }
  return [...L, ...R.reverse()];
}
export function inPoly(poly: Poly, x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// The nearest point of a polyline to (x, y): the segment it is on, the point and how far.
export function nearestOn(pts: XY[], x: number, y: number): { i: number; q: XY; d: number } {
  let best = { i: 0, q: pts[0], d: Infinity };
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    const q: XY = [ax + dx * t, ay + dy * t], d = Math.hypot(q[0] - x, q[1] - y);
    if (d < best.d) best = { i, q, d };
  }
  return best;
}
export const distTo = (pts: XY[], x: number, y: number): number => nearestOn(pts, x, y).d;
// Points every `step` along a polyline, with the way it runs there.
export function every(pts: XY[], step: number, from = 0): { p: XY; d: XY }[] {
  const out: { p: XY; d: XY }[] = [];
  let carry = from;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
    if (L < 1) continue;
    const d: XY = [(bx - ax) / L, (by - ay) / L];
    for (let s = carry; s < L; s += step) out.push({ p: [ax + d[0] * s, ay + d[1] * s], d });
    carry = (((carry - L) % step) + step) % step;
  }
  return out;
}
// A rough oval round c (rx along X, ry along Y).
export function blob(c: XY, rx: number, ry: number, seed: number, n = 22, wob_ = 0.1): Poly {
  const rr = seeded(seed), out: Poly = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, k = 1 + (rr() - 0.5) * 2 * wob_;
    out.push([c[0] + Math.cos(a) * rx * k, c[1] + Math.sin(a) * ry * k]);
  }
  return out;
}
// A line `d` in from a line with the land on its left (out on its right for d < 0).
export function inland(line: XY[], d: number): XY[] {
  return line.map((p, i): XY => {
    const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [p[0] - (dy / l) * d, p[1] + (dx / l) * d];
  });
}
// The heading that turns a piece's front (-X) toward the world direction (dx, dy), or from a point to another.
export const faceDir = (dx: number, dy: number): number => (Math.atan2(-dy, -dx) * 180) / Math.PI;
export const faceTo = (from: XY, to: XY): number => faceDir(to[0] - from[0], to[1] - from[1]);
// A point `d` along a line from a toward b.
export const toward = (a: XY, b: XY, d: number): XY => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [a[0] + ((b[0] - a[0]) / L) * d, a[1] + ((b[1] - a[1]) / L) * d];
};
// The sea: a flat sheet over a polygon at z (three.js space, for the field's scenery).
export function seaSheet(poly: Poly, z = -14, mat = "Demonmarch_DarkSea"): THREE.Mesh {
  const shape = new THREE.Shape();
  poly.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape).applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1)), material(mat));
  m.position.y = z;
  m.receiveShadow = true;
  return m;
}
// The ground's colour shaded point by point: `tint(x, y)` a factor on its linear colour at each
// of its mesh's points (world cm); on the tracks lifted `trackLift` of the way back to the track's
// own colour (1: left as it is).
export function tintGround(ground: Paved, tint: (x: number, y: number) => [number, number, number], trackLift = 1): void {
  const geo = ground.mesh.geometry, pos = geo.getAttribute("position"), col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = ground.mesh.position.x + pos.getX(i), y = -(ground.mesh.position.z + pos.getZ(i));
    // (how much of the ground round the point is track, so the lift fades in over a couple of metres)
    let on = 0;
    for (const dx of [-120, 0, 120]) for (const dy of [-120, 0, 120]) if (ground.kind(x + dx, y + dy) === 1) on++;
    const c = tint(x, y), k = (trackLift * on) / 9;
    col.set(on ? c.map((v) => v + (1 - v) * k) : c, i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  (ground.mesh.material as THREE.MeshStandardMaterial).vertexColors = true;
}
// smoothstep
export const ease = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// Mild value noise for the fields (0..1).
export function fieldNoise(x: number, y: number, seed: number): number {
  return 0.5 + 0.25 * Math.sin(x / 910 + seed) * Math.cos(y / 770 - seed * 0.7) + 0.15 * Math.sin((x + y) / 430 + seed * 1.9) + 0.1 * Math.cos((x - y) / 260 + seed * 2.7);
}
