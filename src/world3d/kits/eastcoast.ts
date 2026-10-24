// ชายฝั่งตะวันออกและป่าเมเปิลทอง (eastcoast): the fields of the east coast, between Trunrada,
// Kradia and the inner sea. Four lands in one kit:
//   - the inner sea cliffs: grassy clifftops where cushions of pink sea thrift grow, granite rocks
//     and sea stacks along the shore, and the fishing village below them: houses on tall tarred
//     stilts in the shallows, a jetty, rowboats, racks of seaweed drying in the wind, and the
//     little whitewashed lighthouse that watches the coast;
//   - the caravan road: the old road between the clan town and the fortress, its milestones, a
//     wagon broken down by the way, the ruined coaching inn, the toll bridge over the stream, and
//     the quarry in the east (cut stone stacked by the treadwheel crane);
//   - the golden maples: maples of gold by the sea, gold bushes and fallen leaves, the fairy ring
//     of red toadstools, the holed fairy stone in its glade, the woodcutter's log cabin;
//   - the witch's cape: twisted trees, a dead tree hung with charms, the witch's crooked hut and
//     her cauldron, the ring of standing stones over the sea, and the low fog that hangs there.
//
// Centimetres, Z up; every item stands on z = 0, centred on its footprint, front towards -X.
// The jetty is 400 cm long along X and tiles end to end. Trees (golden_maple, twisted_tree,
// charm_tree) should be placed with a trunk solid of their own; the stilt house and the jetty
// stand in shallow water (their posts reach down to -160), the rowboat and the sea stack sit in it
// (place the boat about 12 cm down, the stack 14). The toll bridge's deck is centred on the origin and
// runs along X (its parapets at y = +-215); its toll house stands off the +X end at -Y.

import * as THREE from "three";
import {
  merge, translate, rotateX, rotateY, rotateZ, scale, box, boxAt, boxBounds, beamBetween,
  cylinderBetween, cylinderAt, cylinderCenter, sphereCenter, torus, gableRoof, gableWall, rock, noise3,
} from "../geo";
import type { Geo, V3 } from "../geo";
import { toThree } from "../geo";
import { defineMaterial, leafClump, material } from "../textures";
import type { LeafPalette } from "../textures";
import { leafMaterials, shrub, crownTreeObject, grow, limb, lump } from "../trees";
import type { ShrubLook, CanopyLook } from "../trees";
import { fallenTrunk, stumpOf, coverTop, endGrain, pebbles } from "../nature";
import type { Kit, Put } from "./types";

// ---- materials ----
// the coast: granite dry and wet, weed, kelp, barnacles, silvered and tarred wood, reed thatch
defineMaterial("Eastcoast_Granite", { map: "crag", tint: "#aaa69f", bump: 3 });
defineMaterial("Eastcoast_GranitePink", { map: "crag", tint: "#b39a8c", bump: 3 });
defineMaterial("Eastcoast_GraniteWet", { map: "crag", tint: "#66615c", rough: 0.4, bump: 3 });
defineMaterial("Eastcoast_Weed", { map: "felt", tint: "#4b5a26", rough: 0.55 });
defineMaterial("Eastcoast_Kelp", { map: "fabric", tint: "#5e4f22", rough: 0.5 });
defineMaterial("Eastcoast_KelpGreen", { map: "fabric", tint: "#3f5a2c", rough: 0.5 });
defineMaterial("Eastcoast_Barnacle", { map: "stone", tint: "#d9d3c6", bump: 2 });
defineMaterial("Eastcoast_Drift", { map: "wood", tint: "#a89f90", bump: 1.4 });
defineMaterial("Eastcoast_DriftDark", { map: "wood", tint: "#7d7466", bump: 1.4 });
defineMaterial("Eastcoast_Tar", { map: "wood", tint: "#3f3631", bump: 1.2 });
defineMaterial("Eastcoast_Reed", { map: "thatch", tint: "#b59b63", bump: 2 });
defineMaterial("Eastcoast_Net", { map: "fabric", tint: "#6e7f72", rough: 1 });
defineMaterial("Eastcoast_Float", { map: "plaster", tint: "#d8582e", rough: 0.6 });
defineMaterial("Eastcoast_Hull", { map: "wood", tint: "#3f6b86", bump: 1.2 });
defineMaterial("Eastcoast_HullRed", { map: "wood", tint: "#a6432f", bump: 1.2 });
// sea thrift on the clifftops
defineMaterial("Eastcoast_Thrift", { map: "felt", tint: "#f08fbf", rough: 0.85 });
defineMaterial("Eastcoast_ThriftDeep", { map: "felt", tint: "#c95893", rough: 0.85 });
defineMaterial("Eastcoast_Cushion", { map: "foliage", tint: "#7a9e4c", rough: 1, bump: 1.5 });
defineMaterial("Eastcoast_Stalk", { map: "felt", tint: "#7c8f4a", rough: 1 });
// the lighthouse: whitewash, its red bands, the light
defineMaterial("Eastcoast_Lime", { map: "plaster", tint: "#f2ede3", bump: 0.8 });
defineMaterial("Eastcoast_RedBand", { map: "plaster", tint: "#b9432f", bump: 0.6 });
defineMaterial("Eastcoast_Beam", { tint: "#fff4c8", rough: 0.5, glow: "#ffd76a", glowI: 2.2 });
defineMaterial("Eastcoast_Guano", { map: "plaster", tint: "#ebe7dc", bump: 0.5 });
// the road: rubble stone, timber framing, the quarry's cut stone, canvas, sacking
defineMaterial("Eastcoast_Rubble", { map: "stone", tint: "#b4ab9b", bump: 2.2 });
defineMaterial("Eastcoast_Timber", { map: "wood", tint: "#4c3626", bump: 1.3 });
defineMaterial("Eastcoast_Shingle", { map: "shingles", tint: "#7a5a40", bump: 2.5 });
defineMaterial("Eastcoast_RoofOld", { map: "shingles", tint: "#8a4a36", bump: 2.5 });
defineMaterial("Eastcoast_Quarry", { map: "sandstone", tint: "#e2d9c6", bump: 1.2 });
defineMaterial("Eastcoast_Canvas", { map: "fabric", tint: "#d9ccae", rough: 0.95 });
defineMaterial("Eastcoast_Sack", { map: "fabric", tint: "#b49a6a", rough: 1 });
defineMaterial("Eastcoast_Hay", { map: "thatch", tint: "#cdb062", bump: 1.5 });
defineMaterial("Eastcoast_Moss", { map: "felt", tint: "#5f7b38", rough: 1 });
defineMaterial("Eastcoast_Lichen", { map: "felt", tint: "#b3ad6a", rough: 1 });
defineMaterial("Eastcoast_Sign", { map: "plaster", tint: "#2f5872", rough: 0.8 });
// the golden maples: bark, the crowns' cores and cards, the fairies' glow, toadstools
defineMaterial("Eastcoast_MapleBark", { map: "bark", tint: "#6a5546", bump: 3 });
defineMaterial("Eastcoast_GoldCore", { map: "foliage", tint: "#e8b640", rough: 0.95, bump: 1.5 });
defineMaterial("Eastcoast_GoldBushCore", { map: "foliage", tint: "#b67a22", rough: 0.95, bump: 1.5 });
defineMaterial("Eastcoast_GoldCardDark", { card: "leaves", tint: "#c27a1e", rough: 0.85 });
defineMaterial("Eastcoast_GoldCard", { card: "leaves", tint: "#e5a92c", rough: 0.8 });
defineMaterial("Eastcoast_GoldCardLight", { card: "leaves", tint: "#ffd862", rough: 0.75 });
defineMaterial("Eastcoast_Cap", { map: "plaster", tint: "#c8352a", rough: 0.55 });
defineMaterial("Eastcoast_CapSpot", { map: "plaster", tint: "#f6efe0", rough: 0.6 });
defineMaterial("Eastcoast_Stem", { map: "plaster", tint: "#efe4cc", rough: 0.8 });
defineMaterial("Eastcoast_FairyRing", { map: "felt", tint: "#4c7a30", rough: 1 });
defineMaterial("Eastcoast_Fairy", { tint: "#d6ffe8", rough: 0.5, glow: "#7dffc4", glowI: 2.4 });
defineMaterial("Eastcoast_FairyGold", { tint: "#fff2b0", rough: 0.5, glow: "#ffd25a", glowI: 2.2 });
defineMaterial("Eastcoast_Rune", { tint: "#9ff7d8", rough: 0.4, glow: "#3fe6b0", glowI: 1.8 });
defineMaterial("Eastcoast_FairyStone", { map: "crag", tint: "#8f948a", bump: 3 });
defineMaterial("Eastcoast_LogWood", { map: "bark", tint: "#7a5a3e", bump: 2.5 });
// the witch's cape: twisted bark, dead wood, dark thatch, the brew, charms
defineMaterial("Eastcoast_TwistBark", { map: "bark", tint: "#4b4247", bump: 3 });
defineMaterial("Eastcoast_DeadWood", { map: "bark", tint: "#8f877c", bump: 2.5 });
defineMaterial("Eastcoast_DarkLeaf", { map: "foliage", tint: "#3d4732", rough: 1, bump: 1.5 });
defineMaterial("Eastcoast_DarkCardDark", { card: "leaves", tint: "#3a4430", rough: 0.9 });
defineMaterial("Eastcoast_DarkCard", { card: "leaves", tint: "#56603f", rough: 0.85 });
defineMaterial("Eastcoast_DarkCardLight", { card: "leaves", tint: "#7f8456", rough: 0.8 });
defineMaterial("Eastcoast_HangMoss", { map: "felt", tint: "#7d8670", rough: 1 });
defineMaterial("Eastcoast_WitchWood", { map: "wood", tint: "#4a4039", bump: 1.4 });
defineMaterial("Eastcoast_WitchThatch", { map: "thatch", tint: "#6a5c43", bump: 2 });
defineMaterial("Eastcoast_Brew", { tint: "#9dff6a", rough: 0.3, glow: "#4cff2a", glowI: 1.6 });
defineMaterial("Eastcoast_BrewMist", { tint: "#c6ffb0", rough: 1, glow: "#6cff4a", glowI: 0.8, opacity: 0.38 });
defineMaterial("Eastcoast_WindowGlow", { tint: "#d6ff9a", rough: 0.6, glow: "#9cff4a", glowI: 1.2 });
defineMaterial("Eastcoast_Bottle", { tint: "#6fd0a0", rough: 0.15, glow: "#2fa070", glowI: 0.7, opacity: 0.85 });
defineMaterial("Eastcoast_BottleViolet", { tint: "#b48cff", rough: 0.15, glow: "#7a3cff", glowI: 0.9, opacity: 0.85 });
defineMaterial("Eastcoast_Bone", { map: "marble", tint: "#ddd3ba", rough: 0.75 });
defineMaterial("Eastcoast_Patch", { map: "fabric", tint: "#8d6a8c", rough: 1 });
defineMaterial("Eastcoast_PatchGreen", { map: "fabric", tint: "#6f7d55", rough: 1 });
defineMaterial("Eastcoast_Pumpkin", { map: "felt", tint: "#d9792a", rough: 0.8 });
defineMaterial("Eastcoast_CircleStone", { map: "crag", tint: "#8b8780", bump: 3.5 });
defineMaterial("Eastcoast_Gravel", { map: "cobble", tint: "#a59f93", bump: 1.5 });
defineMaterial("Eastcoast_Ember", { tint: "#ff8a3a", rough: 1, glow: "#ff4a12", glowI: 1.8 });
defineMaterial("Eastcoast_Flame", { tint: "#ffb04a", rough: 1, glow: "#ff6a1a", glowI: 2 });
defineMaterial("Eastcoast_Soot", { map: "felt", tint: "#2e2a28", rough: 1 });
defineMaterial("Eastcoast_BlackWater", { tint: "#2c4842", rough: 0.06, opacity: 0.93 });
// cliff faces for the fields: the coast's granite, the witch's cape's dark rock
defineMaterial("Eastcoast_CliffGranite", { map: "crag", tint: "#a0968a", bump: 4 });
defineMaterial("Eastcoast_CliffDark", { map: "crag", tint: "#6e6a6c", bump: 4 });

const TAU = Math.PI * 2;
const DEG = 180 / Math.PI;

// ---- helpers ----
function seeded(seed: number): () => number {
  let s = (seed * 16807) % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
// a squashed sphere (radii x y z) at c
const ellipsoid = (r: V3, c: V3, mat: string, seg = 10): Geo => scale(sphereCenter(1, [0, 0, 0], mat, seg), r).map((p) => ({ geo: p.geo.translate(c[0], c[1], c[2]), mat: p.mat }));
// a turned shape round Z: a profile of [radius, z] points from the bottom up
function lathe(profile: [number, number][], segs: number, mat: string): Geo {
  const geo = new THREE.LatheGeometry(profile.map(([r, z]) => new THREE.Vector2(r, z)), segs);
  geo.rotateX(Math.PI / 2);
  return [{ geo, mat }];
}
// rocks' feet darkened where the sea wets them (after they are moved into place)
function wetFoot(g: Geo, z: number, k = 0.52): Geo {
  for (const part of g) {
    const pos = part.geo.getAttribute("position"), col = part.geo.getAttribute("color");
    if (!col) continue;
    for (let i = 0; i + 2 < pos.count; i += 3) {
      const cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3, f = cz < z ? k : cz < z + 18 ? k + ((1 - k) * (cz - z)) / 18 : 1;
      for (let j = 0; j < 3; j++) col.setXYZ(i + j, col.getX(i + j) * f, col.getY(i + j) * f, col.getZ(i + j) * f);
    }
  }
  return g;
}
// a rock moved into place
const stone = (size: V3, rough: number, seed: number, mat: string, at: V3, turn = 0, flat = false): Geo => translate(rotateZ(rock(size, rough, seed, mat, flat), turn), at);
// a plank floor along X between x0 and x1, across Y (y0..y1), its top at z, planks `w` wide
function planks(x0: number, x1: number, y0: number, y1: number, z: number, w: number, seed: number, mats: string[], th = 6): Geo {
  const rnd = seeded(seed), out: Geo[] = [];
  for (let x = x0; x < x1 - 1; x += w) {
    const j = (rnd() - 0.5) * 8, x2 = Math.min(x1, x + w - 2);
    out.push(boxBounds([x, y0 + j * 0.4, z - th - rnd() * 1.5], [x2, y1 + j, z - rnd() * 1.2], mats[Math.floor(rnd() * mats.length)], 1.2));
  }
  return merge(...out);
}
// a window: frame, glass, sill and a pair of shutters open against the wall, in the plane x
// (facing -X when `out` is -1); centred at (y, z), w x h
function windowX(x: number, y: number, z: number, w: number, h: number, out: 1 | -1, o: { frame?: string; glass?: string; shutter?: string; broken?: boolean } = {}): Geo {
  const fr = o.frame ?? "Eastcoast_Timber", f = 8, d = 10, xo = x + out * 4, parts: Geo[] = [];
  parts.push(box([d, w + f * 2, f], [xo, y, z + h / 2 + f / 2], fr, 1), box([d + 6, w + f * 2 + 10, f], [xo + out * 3, y, z - h / 2 - f / 2], fr, 1));
  parts.push(box([d, f, h], [xo, y - w / 2 - f / 2, z], fr, 1), box([d, f, h], [xo, y + w / 2 + f / 2, z], fr, 1));
  parts.push(box([4, w, h], [x + out * 1, y, z], o.broken ? "Eastcoast_Soot" : o.glass ?? "GlassBlue"));
  if (!o.broken) parts.push(box([5, 4, h], [xo, y, z], fr), box([5, w, 4], [xo, y, z], fr));
  if (o.shutter) for (const s of [-1, 1]) parts.push(box([4, w / 2, h + 4], [x + out * 6, y + s * (w * 0.75 + f + 2), z], o.shutter, 0.8));
  return merge(...parts);
}
// the same in the plane y (facing -Y when out = -1)
const windowY = (y: number, x: number, z: number, w: number, h: number, out: 1 | -1, o: Parameters<typeof windowX>[6] = {}): Geo =>
  rotateZ(windowX(y, -x, z, w, h, out === 1 ? 1 : -1, o), 90);
// a rope or chain between two points
const rope = (a: V3, b: V3, r = 1.6, mat = "RopeTan"): Geo => cylinderBetween(a, b, r, 4, mat);
// a spoked wheel standing in the XZ plane (axle along Y) centred at c
function wheel(c: V3, r: number, mat = "Eastcoast_Timber", spokes = 8, w = 9): Geo {
  const out: Geo[] = [translate(rotateX(torus(r - 5, 5.5, 16, 5, mat), 90), c), cylinderBetween([c[0], c[1] - w, c[2]], [c[0], c[1] + w, c[2]], r * 0.18, 8, "IronDark")];
  out.push(translate(rotateX(torus(r - 1, 2.2, 16, 4, "IronDark"), 90), c));
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * TAU;
    out.push(cylinderBetween([c[0] + Math.cos(a) * r * 0.16, c[1], c[2] + Math.sin(a) * r * 0.16], [c[0] + Math.cos(a) * (r - 7), c[1], c[2] + Math.sin(a) * (r - 7)], 2.4, 4, mat));
  }
  return merge(...out);
}
// little glowing motes drifting over a spot
function motes(seed: number, n: number, rx: number, z0: number, z1: number, mat = "Eastcoast_Fairy", r = 3.2): Geo {
  const rnd = seeded(seed), out: Geo[] = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * rx;
    out.push(sphereCenter(r * (0.7 + rnd() * 0.6), [Math.cos(a) * d, Math.sin(a) * d, z0 + rnd() * (z1 - z0)], mat, 5));
  }
  return merge(...out);
}
// A flat surface from triangles (x y z flattened); `twoSided` adds the back faces.
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
// a quad (two-sided) through four corners
const quad = (a: V3, b: V3, c: V3, d: V3, mat: string): Geo => tris([...a, ...b, ...c, ...a, ...c, ...d], mat, true);

// =================================== the coast ===================================

// A fisherman's house on tall tarred stilts in the shallows (7.2 x 6.6 m, 6.9 m to the ridge):
// a deck of silvered planks on nine posts braced cross-wise, a plank hut under a steep reed
// thatch with its door and porch to the front, a window with blue shutters each side, a ladder
// down from the porch into the water, nets and floats hung on the rail, baskets, a lantern.
function stiltHouse(): Geo {
  const out: Geo[] = [], DECK = 215, rnd = seeded(7);
  const xs = [-350, -20, 310], ys = [-310, 0, 310];
  for (const x of xs) for (const y of ys) out.push(cylinderAt({ rBot: 16, rTop: 13, height: DECK + 160 - 10, segments: 8, bottom: [x, y, -160] }, "Eastcoast_Tar"));
  // bracing on the outside faces, and the joists under the deck
  for (const y of [-310, 310]) for (let i = 0; i < 2; i++) out.push(beamBetween([xs[i], y, -30], [xs[i + 1], y, DECK - 40], 8, 10, "Eastcoast_DriftDark"), beamBetween([xs[i], y, DECK - 40], [xs[i + 1], y, -30], 8, 10, "Eastcoast_DriftDark"));
  for (const x of [-350, 310]) for (let i = 0; i < 2; i++) out.push(beamBetween([x, ys[i], -20], [x, ys[i + 1], DECK - 45], 8, 10, "Eastcoast_DriftDark"));
  for (const x of xs) out.push(boxBounds([x - 10, -335, DECK - 34], [x + 10, 335, DECK - 8], "Eastcoast_Tar", 1.5));
  for (const y of [-310, 0, 310]) out.push(boxBounds([-370, y - 8, DECK - 22], [330, y + 8, DECK - 8], "Eastcoast_DriftDark", 1));
  // weed and barnacles where the water laps the posts
  for (const x of xs) for (const y of ys) out.push(cylinderAt({ rBot: 18, rTop: 16.5, height: 26, segments: 8, bottom: [x, y, -24] }, rnd() < 0.5 ? "Eastcoast_Weed" : "Eastcoast_Barnacle"));
  // the deck
  out.push(planks(-370, 330, -335, 335, DECK, 26, 11, ["Eastcoast_Drift", "Eastcoast_Drift", "Eastcoast_DriftDark"]));
  // the hut: plank walls on a sill beam, corner posts, battens
  const X0 = -160, X1 = 290, Y = 250, W0 = DECK, W1 = DECK + 270;
  out.push(boxBounds([X0, -Y, W0], [X1, Y, W0 + 16], "Eastcoast_Tar", 1.5));
  for (const [x0, x1, y0, y1] of [[X0, X0 + 12, -Y, Y], [X1 - 12, X1, -Y, Y], [X0, X1, -Y, -Y + 12], [X0, X1, Y - 12, Y]] as number[][]) out.push(boxBounds([x0, y0, W0 + 16], [x1, y1, W1], "Eastcoast_Drift", 1));
  for (const [x, y] of [[X0, -Y], [X0, Y], [X1, -Y], [X1, Y]]) out.push(boxAt([22, 22, W1 - W0 + 10], [x, y, W0], "Eastcoast_Tar", 2));
  for (let y = -Y + 40; y < Y - 20; y += 52) if (Math.abs(y + 60) > 70 && Math.abs(y - 140) > 60) out.push(box([4, 7, W1 - W0 - 20], [X0 - 3, y, (W0 + W1) / 2 + 6], "Eastcoast_DriftDark"));
  for (let x = X0 + 45; x < X1 - 20; x += 52) for (const s of [-1, 1]) if (Math.abs(x - 60) > 70) out.push(box([7, 4, W1 - W0 - 20], [x, s * (Y + 3), (W0 + W1) / 2 + 6], "Eastcoast_DriftDark"));
  out.push(boxBounds([X0 - 6, -Y - 6, W1 - 14], [X1 + 6, Y + 6, W1 + 4], "Eastcoast_Tar", 1.5));
  // the door, the windows
  out.push(boxBounds([X0 - 8, -115, W0 + 14], [X0 + 2, -105, W0 + 228], "Eastcoast_Tar", 1), boxBounds([X0 - 8, -15, W0 + 14], [X0 + 2, -5, W0 + 228], "Eastcoast_Tar", 1));
  out.push(boxBounds([X0 - 9, -120, W0 + 222], [X0 + 2, 0, W0 + 236], "Eastcoast_Tar", 1), boxBounds([X0 - 5, -105, W0 + 14], [X0, -15, W0 + 220], "DoorWood", 1));
  out.push(sphereCenter(3, [X0 - 8, -28, W0 + 110], "IronDark", 6));
  out.push(windowX(X0, 140, W0 + 140, 70, 70, -1, { shutter: "Eastcoast_Hull" }));
  out.push(windowY(-Y, 60, W0 + 140, 80, 64, -1, { shutter: "Eastcoast_Hull" }), windowY(Y, 60, W0 + 140, 80, 64, 1, { shutter: "Eastcoast_Hull" }));
  // the roof: steep reed thatch, ridge along X, the gables boarded, a ridge roll
  out.push(gableRoof([X1 - X0, Y * 2, 16], [(X0 + X1) / 2, 0, W1], 230, 55, "Eastcoast_Reed"));
  out.push(gableWall(X0 + 2, Y, W1, 228, "Eastcoast_Drift"), gableWall(X1 - 2, Y, W1, 228, "Eastcoast_Drift"));
  out.push(cylinderBetween([X0 - 70, 0, W1 + 238], [X1 + 70, 0, W1 + 238], 16, 8, "Eastcoast_Reed"));
  for (const x of [X0 - 60, X1 + 60]) out.push(beamBetween([x, -18, W1 + 250], [x, 18, W1 + 250], 6, 34, "Eastcoast_Tar"));
  // the porch rail (open at the ladder) and the ladder down into the water
  for (const [a, b] of [[[-365, -330], [-365, -60]], [[-365, 60], [-365, 330]], [[-365, -330], [X0, -330]], [[-365, 330], [X0, 330]]] as [number, number][][]) {
    out.push(beamBetween([a[0], a[1], DECK + 95], [b[0], b[1], DECK + 95], 8, 9, "Eastcoast_Drift"), beamBetween([a[0], a[1], DECK + 50], [b[0], b[1], DECK + 50], 5, 5, "Eastcoast_DriftDark"));
    for (const t of [0, 0.5, 1]) out.push(boxAt([10, 10, 100], [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, DECK], "Eastcoast_Tar", 1));
  }
  for (const s of [-1, 1]) out.push(beamBetween([-375, s * 42, DECK + 60], [-470, s * 42, -60], 8, 10, "Eastcoast_Drift"));
  for (let k = 1; k < 9; k++) {
    const t = k / 9, x = -375 + (-470 + 375) * t, z = DECK + 60 + (-60 - DECK - 60) * t;
    out.push(cylinderBetween([x, -42, z], [x, 42, z], 3.2, 5, "Eastcoast_DriftDark"));
  }
  // a net hung over the south rail with its floats, another over a pole on the north side
  out.push(quad([-360, -335, DECK + 98], [-170, -335, DECK + 98], [-180, -352, DECK + 10], [-350, -350, DECK + 18], "Eastcoast_Net"));
  for (let x = -350; x < -180; x += 28) out.push(sphereCenter(6, [x, -350, DECK + 16 + rnd() * 6], "Eastcoast_Float", 6));
  out.push(quad([0, 345, DECK + 120], [250, 345, DECK + 120], [240, 360, DECK - 60], [10, 356, DECK - 40], "Eastcoast_Net"));
  out.push(cylinderBetween([-20, 340, DECK + 122], [270, 340, DECK + 122], 3, 5, "Eastcoast_Drift"));
  for (const x of [-20, 270]) out.push(boxAt([8, 8, 125], [x, 340, DECK], "Eastcoast_Tar"));
  for (let x = 20; x < 240; x += 30) out.push(sphereCenter(6, [x, 358, DECK - 50 + rnd() * 8], "Eastcoast_Float", 6));
  // baskets and a pot of rope on the porch, a lantern by the door
  for (const [x, y, r] of [[-250, -260, 28], [-205, -220, 22], [-300, 250, 26]]) out.push(lathe([[r * 0.8, 0], [r, 8], [r * 1.05, 34], [r * 1.1, 36]], 10, "Eastcoast_Reed").map((p) => ({ geo: p.geo.translate(x, y, DECK), mat: p.mat })));
  out.push(translate(torus(16, 6, 12, 5, "RopeTan"), [-300, 250, DECK + 40]));
  out.push(beamBetween([X0 - 2, -140, W0 + 205], [X0 - 30, -140, W0 + 205], 4, 4, "IronDark"), rope([X0 - 28, -140, W0 + 205], [X0 - 28, -140, W0 + 180], 1, "IronDark"));
  out.push(box([14, 14, 18], [X0 - 28, -140, W0 + 168], "IronDark"), box([10, 10, 13], [X0 - 28, -140, W0 + 168], "LanternGlow"));
  return merge(...out);
}

// Racks of seaweed drying in the wind (1.4 x 5.6 m, 1.9 m): two A-frame trestles with a ridge
// pole and two side poles, strands of brown and green weed draped over them, a basket of fresh
// weed and a bundle tied up on the sand.
function seaweedRack(): Geo {
  const out: Geo[] = [], rnd = seeded(23), TOP = 185;
  for (const y of [-260, 0, 260]) {
    for (const s of [-1, 1]) out.push(cylinderBetween([s * 62, y, -6], [s * 4, y, TOP + 8], 4.5, 6, "Eastcoast_Drift"));
    out.push(cylinderBetween([-40, y, 70], [40, y, 70], 3, 5, "Eastcoast_DriftDark"));
  }
  out.push(cylinderBetween([0, -290, TOP], [0, 290, TOP], 4, 6, "Eastcoast_Drift"));
  for (const s of [-1, 1]) out.push(cylinderBetween([s * 38, -280, 128], [s * 38, 280, 128], 3.2, 6, "Eastcoast_Drift"));
  // the strands: over the ridge pole down both sides, and hung from the side poles
  for (let y = -270; y <= 270; y += 15) {
    const mat = rnd() < 0.6 ? "Eastcoast_Kelp" : "Eastcoast_KelpGreen", w = 9 + rnd() * 6, j = (rnd() - 0.5) * 6;
    for (const s of [-1, 1]) {
      const low = 70 + rnd() * 45;
      out.push(quad([0, y + j - w / 2, TOP + 3], [0, y + j + w / 2, TOP + 3], [s * (24 + rnd() * 8), y + j + w / 2 + 2, low], [s * (24 + rnd() * 8), y + j - w / 2 + 1, low + 4], mat));
      if (rnd() < 0.55) {
        const low2 = 30 + rnd() * 40;
        out.push(quad([s * 38, y + j - w / 2 + 4, 128], [s * 38, y + j + w / 2 + 4, 128], [s * (44 + rnd() * 6), y + j + w / 2 + 6, low2], [s * (44 + rnd() * 6), y + j - w / 2 + 4, low2 + 3], mat));
      }
    }
  }
  // the basket and the bundle
  out.push(lathe([[22, 0], [28, 6], [30, 38], [31, 40]], 10, "Eastcoast_Reed").map((p) => ({ geo: p.geo.translate(-110, 180, 0), mat: p.mat })));
  for (let i = 0; i < 6; i++) out.push(ellipsoid([16, 11, 8], [-110 + (rnd() - 0.5) * 24, 180 + (rnd() - 0.5) * 24, 38 + rnd() * 6], i % 2 ? "Eastcoast_Kelp" : "Eastcoast_KelpGreen", 7));
  out.push(rotateZ(merge(ellipsoid([60, 18, 14], [0, 0, 13], "Eastcoast_Kelp", 8), cylinderCenter(15.5, 6, 8, [0, 0, 0], "RopeTan").map((p) => ({ geo: p.geo.rotateY(Math.PI / 2).translate(-20, 0, 13), mat: p.mat })), cylinderCenter(15.5, 6, 8, [0, 0, 0], "RopeTan").map((p) => ({ geo: p.geo.rotateY(Math.PI / 2).translate(22, 0, 13), mat: p.mat }))), 30).map((p) => ({ geo: p.geo.translate(100, -150, 0), mat: p.mat })));
  return merge(...out);
}

// The little lighthouse that watches the coast (8.6 x 6 m, 13.4 m to its vane): an octagonal
// plinth of granite, a tapering whitewashed tower with two red bands, slit windows up it and an
// arched door to the front, a corbelled gallery with an iron rail, the lantern room glazed all
// round with the light burning in it, a copper dome; the keeper's cottage built on behind.
function lighthouse(): Geo {
  const out: Geo[] = [], TX = -130, Z0 = 70, H = 880, R0 = 190, R1 = 142;
  const rAt = (z: number) => R0 + ((R1 - R0) * (z - Z0)) / H;
  out.push(cylinderAt({ rBot: 300, rTop: 285, height: Z0 - 10, segments: 8, bottom: [TX, 0, 0] }, "Eastcoast_Granite"));
  out.push(cylinderAt({ rBot: 270, rTop: 262, height: 12, segments: 8, bottom: [TX, 0, Z0 - 10] }, "StoneGrey"));
  out.push(cylinderAt({ rBot: R0, rTop: R1, height: H, segments: 18, bottom: [TX, 0, Z0] }, "Eastcoast_Lime"));
  for (const [a, b] of [[330, 440], [690, 790]]) out.push(cylinderAt({ rBot: rAt(a) + 2.5, rTop: rAt(b) + 2.5, height: b - a, segments: 18, bottom: [TX, 0, a] }, "Eastcoast_RedBand"));
  // the door (an arch of granite) and the slit windows climbing round
  const dr = rAt(Z0) + 4;
  out.push(boxBounds([TX - dr - 10, -62, Z0], [TX - dr + 18, -46, Z0 + 230], "Eastcoast_Granite", 2), boxBounds([TX - dr - 10, 46, Z0], [TX - dr + 18, 62, Z0 + 230], "Eastcoast_Granite", 2));
  out.push(translate(rotateY(rotateX(torus(54, 9, 12, 5, "Eastcoast_Granite"), 90), 0), [TX - dr - 2, 0, Z0 + 230]).map((p) => p));
  out.push(boxBounds([TX - dr - 2, -46, Z0], [TX - dr + 12, 46, Z0 + 228], "DoorWood", 1), cylinderBetween([TX - dr + 4, -46, Z0 + 228], [TX - dr + 4, 46, Z0 + 228], 46, 10, "DoorWood"));
  out.push(boxBounds([TX - dr - 40, -80, 0], [TX - dr + 10, 80, Z0 - 2], "StoneGrey", 2), boxBounds([TX - dr - 70, -80, 0], [TX - dr - 40, 80, Z0 - 32], "StoneGrey", 2));
  for (const [z, a] of [[360, 200], [560, 120], [770, 230], [880, 160]]) {
    const r = rAt(z) + 1, ang = a / DEG;
    const c: V3 = [TX + Math.cos(ang) * r, Math.sin(ang) * r, z];
    out.push(translate(rotateZ(merge(box([10, 34, 74], [0, 0, 0], "Eastcoast_Granite", 2), box([4, 20, 60], [-3, 0, 0], "GlassBlue")), a + 180), c));
  }
  // the gallery: corbel ring, floor, rail and posts
  const G = Z0 + H;
  out.push(cylinderAt({ rBot: R1 + 4, rTop: 205, height: 36, segments: 18, bottom: [TX, 0, G - 36] }, "Eastcoast_Granite"));
  out.push(cylinderAt({ radius: 212, height: 14, segments: 18, bottom: [TX, 0, G] }, "StoneGrey"));
  out.push(translate(torus(204, 3.2, 28, 5, "IronDark"), [TX, 0, G + 96]), translate(torus(204, 2.2, 28, 4, "IronDark"), [TX, 0, G + 52]));
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    out.push(cylinderAt({ radius: 2.6, height: 96, segments: 4, bottom: [TX + Math.cos(a) * 204, Math.sin(a) * 204, G + 14] }, "IronDark"));
  }
  // the lantern room: a low wall, glass between iron mullions, the light, the dome and vane
  out.push(cylinderAt({ radius: 118, height: 50, segments: 8, bottom: [TX, 0, G + 14] }, "Eastcoast_Lime"));
  out.push(cylinderAt({ radius: 112, height: 150, segments: 8, bottom: [TX, 0, G + 64] }, "GlassBlue"));
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * TAU;
    out.push(boxAt([9, 9, 150], [TX + Math.cos(a) * 112, Math.sin(a) * 112, G + 64], "IronDark"));
  }
  out.push(cylinderAt({ rBot: 46, rTop: 40, height: 90, segments: 10, bottom: [TX, 0, G + 80] }, "Eastcoast_Beam"));
  out.push(cylinderAt({ radius: 122, height: 12, segments: 8, bottom: [TX, 0, G + 214] }, "IronDark"));
  out.push(lathe([[124, 0], [118, 20], [96, 58], [60, 88], [24, 104], [8, 110], [0, 112]], 12, "CopperGreen").map((p) => ({ geo: p.geo.translate(TX, 0, G + 226), mat: p.mat })));
  out.push(sphereCenter(13, [TX, 0, G + 344], "GoldTrim", 8), cylinderAt({ radius: 2.5, height: 60, segments: 4, bottom: [TX, 0, G + 350] }, "IronDark"));
  out.push(beamBetween([TX - 34, 0, G + 396], [TX + 34, 0, G + 396], 2, 14, "IronDark"), box([4, 22, 4], [TX + 30, 0, G + 396], "IronDark"));
  // the keeper's cottage behind: granite walls, slate roof (ridge along X), a chimney, its door
  // and windows to the sides
  const CX0 = 40, CX1 = 450, CY = 210, CH = 260;
  out.push(boxBounds([CX0, -CY, 0], [CX1, CY, 24], "StoneGrey", 2));
  out.push(boxBounds([CX0 + 8, -CY + 8, 24], [CX1 - 8, CY - 8, CH], "Eastcoast_Lime", 1));
  for (const [x, y] of [[CX0 + 8, -CY + 8], [CX0 + 8, CY - 8], [CX1 - 8, -CY + 8], [CX1 - 8, CY - 8]]) out.push(boxAt([30, 30, CH - 20], [x, y, 24], "Eastcoast_Granite", 3));
  out.push(gableRoof([CX1 - CX0, CY * 2, 14], [(CX0 + CX1) / 2, 0, CH], 150, 30, "RoofSlate"));
  out.push(gableWall(CX1 - 8, CY - 8, CH, 148, "Eastcoast_Lime"));
  out.push(boxAt([70, 80, 240], [CX1 - 70, CY - 70, CH + 20], "Eastcoast_Granite", 3), boxAt([84, 94, 14], [CX1 - 70, CY - 70, CH + 260], "StoneGrey", 2));
  out.push(windowY(-CY + 8, 330, 150, 70, 80, -1, { shutter: "Eastcoast_Hull" }), windowY(CY - 8, 200, 150, 70, 80, 1, { shutter: "Eastcoast_Hull" }));
  out.push(windowX(CX1 - 8, 0, 150, 70, 80, 1, { shutter: "Eastcoast_Hull" }));
  out.push(boxBounds([150, -CY - 4, 24], [240, -CY + 6, 234], "DoorWood", 1), boxBounds([140, -CY - 10, 230], [250, -CY + 6, 246], "Eastcoast_Granite", 2));
  out.push(boxBounds([130, -CY - 70, 0], [260, -CY, 24], "StoneGrey", 2));
  return merge(...out);
}

// A section of fishing jetty 4 m long (along X, tiling end to end), 2.4 m wide: planks across on
// two stringers, four tarred posts driven into the bed with their tops standing proud, a bollard.
function fishingJetty(): Geo {
  const out: Geo[] = [], D = 70;
  out.push(planks(-200, 200, -118, 118, D, 25, 31, ["Eastcoast_Drift", "Eastcoast_Drift", "Eastcoast_DriftDark", "WoodGrey"]));
  for (const y of [-80, 80]) out.push(boxBounds([-200, y - 9, D - 30], [200, y + 9, D - 6], "Eastcoast_DriftDark", 1.5));
  for (const x of [-185, 185]) for (const y of [-112, 112]) {
    out.push(cylinderAt({ rBot: 13, rTop: 12, height: D + 175, segments: 8, bottom: [x, y, -160] }, "Eastcoast_Tar"));
    out.push(cylinderAt({ rBot: 14, rTop: 13, height: 24, segments: 8, bottom: [x, y, -26] }, "Eastcoast_Weed"));
  }
  for (const x of [-185, 185]) out.push(beamBetween([x, -112, -10], [x, 112, D - 30], 7, 9, "Eastcoast_DriftDark"));
  out.push(cylinderAt({ rBot: 13, rTop: 11, height: 34, segments: 8, bottom: [0, 100, D] }, "IronDark"), cylinderAt({ radius: 15, height: 6, segments: 8, bottom: [0, 100, D + 30] }, "IronDark"));
  return merge(...out);
}

// A boat's hull: a smooth shell from stem to stern, its sides curving down into the keel, the
// sheer rising to both ends; painted outside (a band of `band` along the top), bare boards inside.
function hullShell(L: number, B: number, D: number, zTop: number, paint: string, band: string, inside: string): Geo {
  const N = 18, M = 12;
  const w = (x: number) => B * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / L, 2.2)), 0.55);
  const sheer = (x: number) => zTop + 24 * Math.pow(Math.abs(x) / L, 3);
  const depth = (x: number) => D * Math.pow(Math.max(0.04, 1 - Math.pow(Math.abs(x) / L, 3)), 0.5);
  const at = (i: number, j: number, k: number): V3 => {
    const x = -L + (2 * L * i) / N, th = -Math.PI / 2 + (Math.PI * j) / M;
    return [x, w(x) * k * Math.sin(th), sheer(x) - depth(x) * k * Math.cos(th) + (1 - k) * 30];
  };
  const faces: Record<string, number[]> = { [paint]: [], [band]: [], [inside]: [] };
  for (let i = 0; i < N; i++)
    for (let j = 0; j < M; j++) {
      const outMat = j === 0 || j === M - 1 ? band : paint;
      const a = at(i, j, 1), b = at(i + 1, j, 1), c = at(i + 1, j + 1, 1), d = at(i, j + 1, 1);
      faces[outMat].push(...a, ...c, ...b, ...a, ...d, ...c);
      const ai = at(i, j, 0.9), bi = at(i + 1, j, 0.9), ci = at(i + 1, j + 1, 0.9), di = at(i, j + 1, 0.9);
      faces[inside].push(...ai, ...bi, ...ci, ...ai, ...ci, ...di);
    }
  const out: Geo = [];
  for (const [mat, pos] of Object.entries(faces)) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    const uv: number[] = [];
    for (let i = 0; i < pos.length; i += 3) uv.push(pos[i] / 100, (pos[i + 2] + Math.abs(pos[i + 1])) / 60);
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    out.push({ geo, mat });
  }
  return out;
}

// A fisherman's rowboat (3.8 x 1.5 m), painted blue with a red sheer strake: a smooth planked
// hull, a gunwale capping it, three thwarts, oars laid in it, a coil of rope and a heap of net with
// its floats. It floats high, its boards inside above its own z = 0: place it about 12 cm down
// on the water (its keel then just under the surface).
function rowboat(): Geo {
  const out: Geo[] = [], L = 185, B = 72, TOP = 62;
  out.push(hullShell(L, B, 70, TOP, "Eastcoast_Hull", "Eastcoast_HullRed", "Eastcoast_DriftDark"));
  const w = (x: number) => B * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / L, 2.2)), 0.55);
  const sheer = (x: number) => TOP + 24 * Math.pow(Math.abs(x) / L, 3);
  for (const s of [-1, 1])
    for (let i = 0; i < 12; i++) {
      const xa = -L + (2 * L * i) / 12, xb = -L + (2 * L * (i + 1)) / 12;
      out.push(beamBetween([xa, s * w(xa), sheer(xa) + 2], [xb, s * w(xb), sheer(xb) + 2], 7, 6, "Eastcoast_Drift"));
    }
  for (const x of [-100, -10, 90]) out.push(boxBounds([x - 12, -w(x) * 0.92, TOP - 10], [x + 12, w(x) * 0.92, TOP - 4], "Eastcoast_Drift", 1));
  out.push(boxBounds([-L * 0.7, -26, 5], [L * 0.7, 26, 9], "Eastcoast_Drift", 1));
  out.push(cylinderBetween([L - 4, 0, TOP + 10], [L + 8, 0, TOP + 36], 5, 6, "Eastcoast_HullRed"), cylinderBetween([-L + 4, 0, TOP + 10], [-L - 6, 0, TOP + 32], 5, 6, "Eastcoast_HullRed"));
  for (const s of [-1, 1]) {
    out.push(cylinderBetween([-120, s * 26, TOP - 2], [140, s * 18, TOP], 2.6, 5, "Eastcoast_Drift"));
    out.push(translate(rotateZ(box([60, 12, 2], [0, 0, 0], "Eastcoast_Drift"), -2 * s), [160, s * 17, TOP]));
    out.push(cylinderAt({ radius: 2.5, height: 10, segments: 4, bottom: [10, s * (w(10) - 2), sheer(10) + 4] }, "IronDark"));
  }
  out.push(translate(torus(14, 4.5, 10, 4, "RopeTan"), [-130, 0, 14]));
  out.push(ellipsoid([44, 30, 12], [40, 8, 12], "Eastcoast_Net", 8));
  for (let i = 0; i < 4; i++) out.push(sphereCenter(5, [20 + i * 14, -12 + (i % 2) * 22, 22], "Eastcoast_Float", 6));
  return merge(...out);
}

// Cushions of pink sea thrift on the clifftop turf (a patch about 2 m across): low mounds of
// fine leaves, each bristling with round pink flower heads on thin stalks.
function seaPinks(): Geo {
  const out: Geo[] = [], rnd = seeded(41);
  const mounds: [number, number, number][] = [[0, 0, 34], [52, 30, 26], [-48, 26, 28], [-20, -48, 24], [44, -40, 22], [86, -6, 16], [-80, -20, 18], [10, 66, 18]];
  mounds.forEach(([x, y, r], i) => {
    out.push(lump([x, y, 2], [r, r * 0.9, r * 0.55], 300 + i, "Eastcoast_Cushion", 1, 0.18));
    const n = Math.round(r / 3.4);
    for (let k = 0; k < n; k++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * r * 0.8, bx = x + Math.cos(a) * d, by = y + Math.sin(a) * d, bz = r * 0.5 * Math.sqrt(Math.max(0, 1 - (d / r) ** 2)), h = 10 + rnd() * 9;
      const top: V3 = [bx + (rnd() - 0.5) * 6, by + (rnd() - 0.5) * 6, bz + h];
      out.push(cylinderBetween([bx, by, bz], top, 0.9, 3, "Eastcoast_Stalk"));
      out.push(sphereCenter(4.6 + rnd() * 1.8, top, rnd() < 0.3 ? "Eastcoast_ThriftDeep" : "Eastcoast_Thrift", 6));
    }
  });
  return merge(...out);
}

// Granite rocks on the shore (about 4.4 x 3.2 m, 1.7 m): rounded boulders, dark and wet at their
// feet where the tide reaches, weed and barnacles in the cracks, pebbles round them.
function shoreRocks(): Geo {
  const out: Geo[] = [];
  const parts: [V3, number, V3, number][] = [
    [[210, 170, 170], 51, [0, 0, 0], 20], [[150, 130, 120], 52, [-150, 70, 0], 70], [[130, 120, 90], 53, [120, -90, 0], 130],
    [[90, 80, 60], 54, [-110, -100, 0], 10], [[70, 60, 44], 55, [180, 80, 0], 200], [[60, 54, 40], 56, [-210, -20, 0], 90],
  ];
  parts.forEach(([s, seed, at, t], i) => out.push(wetFoot(stone(s, 0.26, seed, i % 3 === 1 ? "Eastcoast_GranitePink" : "Eastcoast_Granite", [at[0], at[1], -6], t), 32 + i * 2)));
  for (const [x, y, r] of [[-60, 70, 26], [80, 40, 22], [30, -80, 20], [-180, 40, 16]]) out.push(lump([x, y, 0], [r * 1.6, r, r * 0.45], x + 900, "Eastcoast_Weed", 1, 0.2));
  for (let i = 0; i < 14; i++) out.push(translate(rock([9, 8, 5], 0.4, 70 + i, "Eastcoast_Barnacle", true, 0), [Math.cos(i * 2.1) * (90 + (i % 4) * 20), Math.sin(i * 2.1) * (70 + (i % 3) * 18), 8 + (i % 3) * 4]));
  out.push(pebbles(57, [0, 0], 230, 170, 12, 16, "Eastcoast_Granite"));
  return merge(...out);
}

// A pillar of bedded rock: rings of faceted stone `beds` high, each bed's face leaning back a
// little and stepping in at its top, the outline wandering bed to bed; flat-shaded, darker and
// wet at its foot, the seabirds' white streaks down its upper beds.
function strataPillar(seed: number, h: number, r0: number, r1: number, mat: string, beds = 7, seg = 11): Geo {
  const rnd = seeded(seed), rows: { z: number; r: number; b: number }[] = [];
  for (let b = 0; b < beds; b++) {
    const t = b / beds, z0 = (h * b) / beds, z1 = (h * (b + 1)) / beds, r = (r0 + (r1 - r0) * t) * (0.92 + rnd() * 0.16);
    rows.push({ z: z0 + (b ? 6 : -20), r: r * 1.0, b }, { z: z1 - 6, r: r * 0.93, b }, { z: z1, r: r * 0.86, b });
  }
  const ring = rows.map((row) => Array.from({ length: seg }, (_, j) => {
    const a = (j / seg) * TAU + Math.sin(j * 2.3 + seed) * 0.12, k = 1 + 0.32 * (noise3(Math.cos(a) * 1.4 + 5, Math.sin(a) * 1.4, row.b * 0.55, seed) - 0.5);
    return new THREE.Vector3(Math.cos(a) * row.r * k, Math.sin(a) * row.r * k * 0.88, row.z);
  }));
  const pos: number[] = [], col: number[] = [];
  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    const cz = (a.z + b.z + c.z) / 3, cx = (a.x + b.x + c.x) / 3, cy = (a.y + b.y + c.y) / 3;
    let v = cz < 70 ? 0.5 + (0.5 * cz) / 70 : 0.86 + 0.14 * Math.min(1, cz / h) + (rnd() - 0.5) * 0.1;
    if (cz > h * 0.55 && noise3(cx / 60, cy / 60, cz / 140, seed + 3) > 0.62) v = 1.35;
    for (let k = 0; k < 3; k++) col.push(v, v, v * 0.98);
  };
  for (let i = 0; i + 1 < ring.length; i++)
    for (let j = 0; j < seg; j++) {
      const a = ring[i][j], b = ring[i][(j + 1) % seg], c = ring[i + 1][(j + 1) % seg], d = ring[i + 1][j];
      tri(a, b, c);
      tri(a, c, d);
    }
  const top = ring[ring.length - 1], mid = new THREE.Vector3(0, 0, h + 14);
  for (let j = 0; j < seg; j++) tri(top[j], top[(j + 1) % seg], mid);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  // texture across each face: along its own horizontal, up the height (no seam round the pillar)
  const uv: number[] = [], nor = geo.getAttribute("normal");
  for (let i = 0; i < pos.length; i += 9) {
    const nx = nor.getX(i / 3), ny = nor.getY(i / 3), L = Math.hypot(nx, ny) || 1, tx = -ny / L, ty = nx / L;
    for (let k = 0; k < 9; k += 3) uv.push((pos[i + k] * tx + pos[i + k + 1] * ty) / 100, pos[i + k + 2] / 100);
  }
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return [{ geo, mat }];
}

// A sea stack (6.4 x 5.6 m, 9.6 m): a pillar of bedded granite standing in the surf, its beds
// stepping in toward the top, boulders heaped round its foot, a cap of turf with sea thrift on
// it, the seabirds' white streaks down its upper part. Stands in the sea: place it about 14 cm down.
function seaStack(): Geo {
  const out: Geo[] = [], H = 900;
  out.push(strataPillar(81, H, 250, 165, "Eastcoast_Granite", 8));
  out.push(lump([0, 0, H + 6], [150, 130, 26], 84, "Eastcoast_Cushion", 1, 0.2));
  for (const [x, y, r] of [[40, 20, 26], [-60, 50, 22], [70, -60, 20], [-40, -60, 18], [10, 80, 16]]) {
    out.push(lump([x, y, H + 20], [r, r, r * 0.5], 860 + x, "Eastcoast_Cushion", 0, 0.2));
    for (let k = 0; k < 5; k++) out.push(sphereCenter(5.5, [x + Math.cos(k * 1.3) * r * 0.6, y + Math.sin(k * 1.3) * r * 0.6, H + 20 + r * 0.5 + 8], k % 3 ? "Eastcoast_Thrift" : "Eastcoast_ThriftDeep", 6));
  }
  for (const [sz, seed, at] of [[[220, 180, 130], 87, [-260, 140, -30]], [[180, 150, 100], 88, [230, -220, -30]], [[150, 120, 80], 89, [-120, -270, -30]], [[120, 100, 70], 90, [280, 150, -30]], [[90, 80, 50], 91, [-300, -80, -30]]] as [V3, number, V3][]) out.push(wetFoot(stone(sz, 0.3, seed, "Eastcoast_Granite", at), 50, 0.45));
  return merge(...out);
}

// =================================== the road ===================================

// The ruined coaching inn (12 x 13 m, 10 m to its chimney): a ground floor of rubble stone with
// its door under a little porch roof and windows with broken shutters, a timber-framed upper
// floor jettied out over the front, a steep roof with a great hole fallen in on the north side
// (the bare rafters showing), the north gable broken down to its frame and the rubble heaped
// below; a stable lean-to on the south whose roof has slid to the ground at one end; the inn's
// sign hanging by one chain, a water trough, barrels, a cart wheel against the wall.
function ruinedInn(): Geo {
  const out: Geo[] = [], rnd = seeded(97);
  const X0 = -420, X1 = 420, Y0 = -480, Y1 = 380, G = 320, U = 260, T = 50;
  // the plinth and the stone ground floor, its openings left open
  out.push(boxBounds([X0 - 15, Y0 - 15, 0], [X1 + 15, Y1 + 15, 22], "StoneGrey", 3));
  const wallRun = (fixed: "x" | "y", at: number, from: number, to: number, holes: [number, number, number, number][]) => {
    // holes: [from, to, zBottom, zTop] along the run
    const cuts = [from, ...holes.flatMap((h) => [h[0], h[1]]), to];
    for (let i = 0; i < cuts.length - 1; i += 2) {
      const a = cuts[i], b = cuts[i + 1];
      if (b > a) out.push(fixed === "x" ? boxBounds([at - T / 2, a, 22], [at + T / 2, b, G], "Eastcoast_Rubble", 3) : boxBounds([a, at - T / 2, 22], [b, at + T / 2, G], "Eastcoast_Rubble", 3));
    }
    for (const [a, b, z0, z1] of holes) {
      if (z0 > 22) out.push(fixed === "x" ? boxBounds([at - T / 2, a, 22], [at + T / 2, b, z0], "Eastcoast_Rubble", 3) : boxBounds([a, at - T / 2, 22], [b, at + T / 2, z0], "Eastcoast_Rubble", 3));
      out.push(fixed === "x" ? boxBounds([at - T / 2 - 4, a - 15, z1], [at + T / 2 + 4, b + 15, z1 + 22], "Eastcoast_Timber", 2) : boxBounds([a - 15, at - T / 2 - 4, z1], [b + 15, at + T / 2 + 4, z1 + 22], "Eastcoast_Timber", 2));
      if (z1 + 22 < G) out.push(fixed === "x" ? boxBounds([at - T / 2, a, z1 + 22], [at + T / 2, b, G], "Eastcoast_Rubble", 3) : boxBounds([a, at - T / 2, z1 + 22], [b, at + T / 2, G], "Eastcoast_Rubble", 3));
    }
  };
  wallRun("x", X0, Y0, Y1, [[-350, -250, 120, 220], [-120, 30, 22, 250], [170, 270, 120, 220]]);
  wallRun("x", X1, Y0, Y1, [[-300, -200, 120, 220], [120, 220, 120, 220]]);
  wallRun("y", Y0, X0, X1, [[-150, -50, 120, 220], [160, 260, 120, 220]]);
  wallRun("y", Y1, X0, X1, [[-80, 60, 22, 240]]);
  // quoins at the corners
  for (const [x, y] of [[X0, Y0], [X0, Y1], [X1, Y0], [X1, Y1]]) for (let z = 30; z < G - 20; z += 56) out.push(boxAt([T + 14, T + 14, 30], [x, y, z], z % 112 < 56 ? "Eastcoast_Granite" : "StoneGrey", 3));
  // glass in the window holes, some broken; shutters hanging askew
  for (const [y, broken] of [[-300, true], [220, false]] as [number, boolean][]) {
    out.push(box([4, 96, 96], [X0 - 2, y, 170], broken ? "Eastcoast_Soot" : "GlassBlue"));
    out.push(translate(rotateX(box([5, 52, 104], [0, 0, 0], "Eastcoast_Timber", 1), broken ? 18 : -6), [X0 - 30, y - 74, 162]));
  }
  out.push(translate(rotateY(box([5, 50, 100], [0, 0, 0], "Eastcoast_Timber", 1), 72), [X0 - 50, 300, 34]));
  out.push(box([6, 140, 228], [X0 + 10, -45, 22 + 114], "Eastcoast_Soot"));
  out.push(translate(rotateZ(boxBounds([0, 0, 22], [6, 140, 240], "DoorWood", 1), -62), [X0 - 2, 30, 0]));
  // the porch roof over the door on two posts
  for (const y of [-150, 60]) out.push(boxAt([16, 16, 250], [X0 - 150, y, 22], "Eastcoast_Timber", 2));
  out.push(beamBetween([X0 - 150, -170, 272], [X0 - 150, 80, 272], 14, 16, "Eastcoast_Timber"));
  out.push(translate(rotateY(box([180, 270, 10], [0, 0, 0], "Eastcoast_RoofOld", 1), -16), [X0 - 80, -45, 290]));
  // the upper floor: jettied out over the front, timber framed, plaster between
  const UX0 = X0 - 30, UZ = G;
  out.push(boxBounds([UX0, Y0 - 10, UZ], [X1 + 10, Y1 + 10, UZ + 20], "Eastcoast_Timber", 2));
  for (let y = Y0 + 70; y < Y1; y += 140) out.push(boxBounds([UX0 - 12, y - 10, UZ - 30], [X0 + 30, y + 10, UZ - 8], "Eastcoast_Timber", 1.5));
  const panel = (x0: number, x1: number, y0: number, y1: number) => out.push(boxBounds([x0, y0, UZ + 20], [x1, y1, UZ + U], "PlasterCream", 1));
  panel(UX0 + 6, UX0 + 22, Y0, Y1 - 260);
  panel(X1 - 16, X1, Y0, Y1 - 200);
  panel(UX0 + 6, X1, Y0 - 6, Y0 + 10);
  // the frame on the front: posts, rails, braces (the north end of it broken away)
  for (let y = Y0; y <= Y1 - 240; y += 110) out.push(boxBounds([UX0, y - 9, UZ + 20], [UX0 + 14, y + 9, UZ + U], "Eastcoast_Timber", 1));
  out.push(boxBounds([UX0 - 2, Y0, UZ + U - 16], [UX0 + 14, Y1 - 180, UZ + U], "Eastcoast_Timber", 1), boxBounds([UX0 - 2, Y0, UZ + 120], [UX0 + 14, Y1 - 240, UZ + 136], "Eastcoast_Timber", 1));
  for (let y = Y0; y < Y1 - 300; y += 220) out.push(beamBetween([UX0 + 4, y + 8, UZ + 24], [UX0 + 4, y + 102, UZ + 118], 10, 12, "Eastcoast_Timber"), beamBetween([UX0 + 4, y + 118, UZ + 138], [UX0 + 4, y + 212, UZ + 240], 10, 12, "Eastcoast_Timber"));
  out.push(windowX(UX0 + 6, -250, UZ + 150, 70, 70, -1, { frame: "Eastcoast_Timber" }), windowX(UX0 + 6, -30, UZ + 150, 70, 70, -1, { frame: "Eastcoast_Timber", broken: true }));
  out.push(windowY(Y0 - 6, 0, UZ + 150, 70, 70, -1, { frame: "Eastcoast_Timber" }));
  // the broken end: posts standing with nothing between, a rail hanging
  for (const y of [Y1 - 180, Y1 - 60]) out.push(boxBounds([UX0, y - 9, UZ + 20], [UX0 + 14, y + 9, UZ + 120 + (y > Y1 - 100 ? 0 : 110)], "Eastcoast_Timber", 1));
  out.push(beamBetween([UX0 + 6, Y1 - 180, UZ + 230], [UX0 - 10, Y1 - 40, UZ + 70], 12, 12, "Eastcoast_Timber"));
  for (const x of [X1 - 8, 0]) out.push(boxBounds([x - 9, Y1 - 9, UZ + 20], [x + 9, Y1 + 9, UZ + 200], "Eastcoast_Timber", 1));
  // the roof: ridge along Y, the back slope whole, the front slope whole only on its south part
  const RZ = UZ + U, RH = 300, half = (X1 - UX0) / 2 + 40, cx = (X1 + UX0) / 2, ang = Math.atan2(RH, half - 40), slope = half / Math.cos(ang);
  const slab = (side: 1 | -1, y0: number, y1: number) => translate(rotateY(box([slope, y1 - y0, 14], [(side * slope) / 2, (y0 + y1) / 2, 7], "Eastcoast_RoofOld", 1), side * ang * DEG), [cx, 0, RZ + RH]);
  out.push(slab(1, Y0 - 40, Y1 - 120), slab(-1, Y0 - 40, Y1 - 330));
  // the bare rafters where the front slope fell in, and the back slope's last rafters
  for (let y = Y1 - 300; y <= Y1 + 20; y += 64) out.push(beamBetween([cx, y, RZ + RH - 4], [cx - (half - 20), y, RZ + 20], 10, 14, "Eastcoast_Timber"));
  for (let y = Y1 - 90; y <= Y1 + 20; y += 64) out.push(beamBetween([cx, y, RZ + RH - 4], [cx + (half - 30), y, RZ + 24], 10, 14, "Eastcoast_Timber"));
  out.push(beamBetween([cx, Y0 - 40, RZ + RH + 6], [cx, Y1 + 30, RZ + RH + 6], 16, 16, "Eastcoast_Timber"));
  // purlins across the bare rafters, one of them broken and hanging
  for (const t of [0.35, 0.7]) out.push(beamBetween([cx - (half - 20) * t, Y1 - 330, RZ + RH - 4 - (RH - 24) * t + 10], [cx - (half - 20) * t, t > 0.5 ? Y1 + 30 : Y1 - 60, RZ + RH - 4 - (RH - 24) * t + 10], 12, 12, "Eastcoast_Timber"));
  out.push(beamBetween([cx - (half - 20) * 0.35, Y1 - 60, RZ + RH - 4 - (RH - 24) * 0.35 + 10], [cx - (half - 20) * 0.55, Y1 + 40, RZ + 60], 12, 12, "Eastcoast_Timber"));
  out.push(beamBetween([cx + (half - 30) * 0.5, Y1 - 140, RZ + RH * 0.5 + 18], [cx + (half - 30) * 0.5, Y1 + 30, RZ + RH * 0.5 + 18], 12, 12, "Eastcoast_Timber"));
  // a last few tiles clinging to the rafters
  for (const [t, y] of [[0.8, Y1 - 280], [0.86, Y1 - 220], [0.62, Y1 - 290]]) out.push(translate(rotateY(box([90, 60, 6], [0, 0, 0], "Eastcoast_RoofOld", 1), -ang * DEG), [cx - (half - 20) * t, y, RZ + RH - (RH - 20) * t + 14]));
  out.push(gableWall(0, half - 40, RZ, RH - 10, "PlasterCream").map((p) => ({ geo: p.geo.rotateZ(Math.PI / 2).translate(cx, Y0 - 4, 0), mat: p.mat })));
  // the chimney at the south gable
  out.push(boxAt([110, 80, 1020], [cx + 120, Y0 - 50, 0], "Eastcoast_Rubble", 3), boxAt([126, 96, 20], [cx + 120, Y0 - 50, 1000], "Eastcoast_Granite", 3));
  for (const dx of [-24, 24]) out.push(cylinderAt({ radius: 13, height: 34, segments: 8, bottom: [cx + 120 + dx, Y0 - 50, 1020] }, "BrickRed"));
  // the rubble of the fallen gable heaped at the north end, roof tiles, a beam
  for (let i = 0; i < 8; i++) out.push(stone([60 + rnd() * 60, 50 + rnd() * 50, 30 + rnd() * 30], 0.4, 400 + i, i % 3 ? "Eastcoast_Rubble" : "PlasterCream", [-260 + rnd() * 500, Y1 + 60 + rnd() * 120, 0], rnd() * 360));
  for (let i = 0; i < 5; i++) out.push(translate(rotateZ(rotateY(box([60, 40, 4], [0, 0, 0], "Eastcoast_RoofOld"), 10 + rnd() * 20), rnd() * 360), [-200 + rnd() * 400, Y1 + 80 + rnd() * 120, 8]));
  out.push(beamBetween([-150, Y1 + 40, 4], [140, Y1 + 210, 30], 16, 16, "Eastcoast_Timber"));
  // the stable lean-to on the south side: posts, a manger, its roof slid down at the front end
  const SY = Y0 - 330;
  for (const x of [-300, 0, 300]) out.push(boxAt([18, 18, 230], [x, SY, 0], "Eastcoast_Timber", 2));
  out.push(beamBetween([-300, SY, 230], [300, SY, 230], 16, 16, "Eastcoast_Timber"));
  out.push(translate(rotateX(box([440, 360, 10], [0, 0, 0], "Eastcoast_Shingle", 1), -14), [120, (SY + Y0) / 2, 268]));
  out.push(translate(rotateY(rotateX(box([230, 360, 10], [0, 0, 0], "Eastcoast_Shingle", 1), -10), 32), [-280, (SY + Y0) / 2, 120]));
  out.push(boxBounds([-200, SY + 30, 0], [260, SY + 90, 70], "Eastcoast_Timber", 1.5), boxBounds([-190, SY + 36, 62], [250, SY + 84, 74], "Eastcoast_Hay", 1));
  for (let i = 0; i < 4; i++) out.push(ellipsoid([50, 40, 30], [-120 + i * 110, Y0 - 120, 20], "Eastcoast_Hay", 8));
  // the sign on its bracket at the front corner, hanging from one chain
  out.push(beamBetween([X0 - 30, Y0 + 20, UZ + 40], [X0 - 160, Y0 + 20, UZ + 40], 8, 10, "IronDark"), beamBetween([X0 - 30, Y0 + 20, UZ - 30], [X0 - 120, Y0 + 20, UZ + 36], 5, 5, "IronDark"));
  out.push(rope([X0 - 150, Y0 + 20, UZ + 38], [X0 - 150, Y0 + 20, UZ - 40], 1.2, "IronDark"));
  // (the board swung down on its one chain: hung from its corner, turned about X)
  const board = merge(box([6, 90, 60], [0, -45, -30], "Eastcoast_Timber", 1), box([8, 70, 40], [0, -45, -30], "Eastcoast_Sign"), sphereCenter(10, [-5, -55, -26], "GoldTrim", 8), box([10, 30, 4], [-2, -30, -38], "GoldTrim"));
  out.push(translate(rotateX(board, -28), [X0 - 150, Y0 + 20, UZ - 40]));
  // the trough, barrels, a cart wheel
  out.push(boxBounds([X0 - 120, 120, 0], [X0 - 60, 330, 60], "Eastcoast_Timber", 2), boxBounds([X0 - 112, 128, 40], [X0 - 68, 322, 54], "WaterSea"));
  for (const [x, y, tipped] of [[X0 - 80, -380, false], [X0 - 50, -300, false], [X0 - 190, -330, true]] as [number, number, boolean][]) {
    const b = merge(lathe([[28, 0], [33, 30], [34, 45], [33, 60], [28, 90]], 12, "WoodWarm"), translate(torus(31, 2, 12, 4, "IronDark"), [0, 0, 18]), translate(torus(31, 2, 12, 4, "IronDark"), [0, 0, 72]), cylinderAt({ radius: 27, height: 2, segments: 12, bottom: [0, 0, 88] }, "WoodShade"));
    out.push(tipped ? translate(rotateY(b, 90), [x, y, 33]) : translate(b, [x, y, 0]));
  }
  out.push(translate(rotateY(wheel([0, 0, 0], 60), -12), [X0 - 30, 330, 60]));
  return merge(...out);
}

// A milestone of the caravan road (0.9 x 0.7 m, 1.8 m): a granite post with a rounded head on a
// footing slab, a carved band and a dark plaque cut with the distances, an iron tether ring,
// lichen and moss on its head.
function milestone(): Geo {
  const out: Geo[] = [];
  out.push(boxBounds([-45, -36, 0], [45, 36, 16], "StoneGrey", 4));
  const body = merge(boxBounds([-24, -20, 16], [24, 20, 150], "Eastcoast_Granite", 4), cylinderBetween([0, -20, 150], [0, 20, 150], 24, 12, "Eastcoast_Granite"));
  out.push(body, coverTop(body, "Eastcoast_Lichen", { amount: 0.3, thick: 1.5, seed: 5, patches: 0.6, grain: 14 }));
  out.push(boxBounds([-26, -22, 118], [26, 22, 126], "StoneGrey", 1));
  out.push(boxBounds([-27, -14, 52], [-23, 14, 108], "Eastcoast_Sign"));
  for (const [y, z, w] of [[-6, 98, 10], [6, 98, 6], [-2, 84, 16], [0, 70, 12], [-6, 60, 6], [6, 60, 6]]) out.push(box([3, w, 4], [-28, y, z], "Eastcoast_Barnacle"));
  out.push(beamBetween([-28, 0, 136], [-28, -9, 145], 2, 3, "Eastcoast_Barnacle"), beamBetween([-28, 0, 136], [-28, 9, 145], 2, 3, "Eastcoast_Barnacle"), box([3, 3, 14], [-28, 0, 132], "Eastcoast_Barnacle"));
  out.push(translate(rotateY(torus(9, 2, 10, 4, "IronDark"), 90), [0, 22, 90]), box([6, 4, 6], [0, 21, 98], "IronDark"));
  out.push(pebbles(9, [0, 0], 50, 42, 6, 10, "Eastcoast_Granite"));
  return merge(...out);
}

// A covered wagon broken down by the road (5.2 x 3 m): its front wheel off and lying in the grass,
// the bed sagging down to the ground at that corner, two hoops still under a torn canvas, two bare,
// the shaft snapped, crates, sacks and a barrel spilled out of the back.
function brokenWagon(): Geo {
  const bed: Geo[] = [], out: Geo[] = [], L = 190, W = 82, Z = 82;
  bed.push(boxBounds([-L, -W, Z], [L, W, Z + 10], "Eastcoast_Timber", 2));
  for (const s of [-1, 1]) {
    bed.push(boxBounds([-L, s * W - 5, Z + 10], [L, s * W + 5, Z + 60], "WoodWarm", 1.5));
    for (const x of [-L + 10, -60, 60, L - 10]) bed.push(boxBounds([x - 6, s * W - 8, Z], [x + 6, s * W + 8, Z + 66], "Eastcoast_Timber", 1));
  }
  bed.push(boxBounds([-L - 4, -W, Z + 10], [-L + 6, W, Z + 56], "WoodWarm", 1.5));
  for (const x of [-120, -40]) bed.push(translate(rotateX(torus(W, 3, 14, 4, "Eastcoast_Timber"), 90).map((p) => p), [x, 0, Z + 60]).map((p) => ({ geo: p.geo, mat: p.mat })));
  // the canvas over the back two hoops, torn: half-cylinder panels with gaps
  for (let i = 0; i < 9; i++) {
    const a0 = (i / 9) * Math.PI, a1 = ((i + 1) / 9) * Math.PI;
    if (i === 6) continue;
    const p = (a: number, x: number): V3 => [x, Math.cos(a) * W, Z + 60 + Math.sin(a) * W];
    const xEnd = i === 2 || i === 3 ? 70 : L - 4;
    bed.push(quad(p(a0, 30), p(a1, 30), p(a1, xEnd), p(a0, xEnd), "Eastcoast_Canvas"));
  }
  for (const x of [40, L - 6]) bed.push(translate(rotateX(torus(W, 3.4, 14, 4, "Eastcoast_Timber"), 90), [x, 0, Z + 60]));
  out.push(rotateX(rotateY(merge(...bed), -9, [L, 0, Z]), -5, [0, W, Z]));
  // the wheels: three on their axles, the front-left one lying down
  out.push(wheel([140, -W - 12, 58], 58), wheel([140, W + 12, 58], 58), wheel([-130, W + 12, 52], 54));
  out.push(cylinderBetween([140, -W - 10, 58], [140, W + 10, 58], 6, 6, "Eastcoast_Timber"));
  out.push(translate(rotateX(wheel([0, 0, 0], 54), 90), [-170, -W - 110, 8]));
  out.push(beamBetween([-L + 10, -W + 10, 8], [-L + 30, W - 10, 40], 10, 10, "Eastcoast_Timber"));
  // the shaft snapped, half lying ahead
  out.push(beamBetween([-L - 10, -20, 30], [-L - 160, -40, 4], 9, 9, "Eastcoast_Timber"), beamBetween([-L - 190, 10, 4], [-L - 320, 40, 3], 9, 9, "Eastcoast_Timber"));
  // what spilled out of the back
  const crate = (s: number) => merge(boxBounds([-s, -s, 0], [s, s, s * 1.6], "WoodWarm", 1.5), boxBounds([-s - 2, -s - 2, s * 0.7], [s + 2, s + 2, s * 0.9], "Eastcoast_Timber", 1));
  out.push(translate(rotateZ(crate(30), 20), [L + 70, 40, 0]), translate(rotateZ(crate(26), -10), [L + 60, -50, 0]), translate(rotateX(rotateZ(crate(24), 40), 18), [L + 140, -10, 14]));
  for (const [x, y, r] of [[L + 40, 110, 0], [L + 120, 80, 40], [L + 10, -110, 100]]) out.push(translate(rotateZ(merge(ellipsoid([34, 24, 18], [0, 0, 17], "Eastcoast_Sack", 8), cylinderAt({ rBot: 8, rTop: 5, height: 12, segments: 6, bottom: [30, 0, 18] }, "Eastcoast_Sack")), r), [x, y, 0]));
  out.push(translate(rotateY(lathe([[24, 0], [29, 24], [30, 38], [29, 52], [24, 76]], 12, "WoodWarm"), 90), [L + 40, 170, 28]));
  return merge(...out);
}

// The toll bridge over the stream (13.4 x 7 m with its toll house): a stone deck 11 m long along
// X and 4.3 m across on two arches over a pier with cutwaters, low parapets with capstones flaring
// out to the banks; on the +X bank beside the way the toll keeper's little stone house with its
// window on the road and a pyramid roof, the barrier pole raised on its post, a lamp.
function tollBridge(): Geo {
  const out: Geo[] = [], L = 550, W = 200, BED = -110, rnd = seeded(131);
  const arches: [number, number][] = [[-200, 165], [200, 165]];
  const under = (x: number) => {
    for (const [c, r] of arches) if (Math.abs(x - c) < r) return BED + 20 + Math.sqrt(r * r - (x - c) ** 2) * 0.62;
    return BED;
  };
  // the spandrel walls and the vault under the deck, in columns following the arches
  for (let x = -L + 10; x < L; x += 20) {
    const z = under(x);
    for (const s of [-1, 1]) out.push(boxBounds([x - 10, s * W - 16, z], [x + 10, s * W + 16, 2], rnd() < 0.5 ? "Eastcoast_Rubble" : "Eastcoast_Granite", 1.2));
    if (z > BED) out.push(boxBounds([x - 10, -W + 16, z - 6], [x + 10, W - 16, z + 2], "Eastcoast_Rubble"));
  }
  // the arch rings of dressed stone
  for (const [c, r] of arches)
    for (let k = 0; k <= 12; k++) {
      const a = (k / 12) * Math.PI, x = c - Math.cos(a) * r, z = BED + 20 + Math.sin(a) * r * 0.62;
      for (const s of [-1, 1]) out.push(translate(rotateY(box([24, 36, 18], [0, 0, 0], "Eastcoast_Quarry", 2), (a - Math.PI / 2) * DEG), [x, s * (W + 2), z]));
    }
  // the pier's cutwaters upstream and down
  for (const s of [-1, 1]) out.push(translate(rotateZ(cylinderAt({ radius: 60, height: 130, segments: 4, bottom: [0, 0, BED - 10] }, "Eastcoast_Granite"), 45), [0, s * (W + 30), 0]), translate(rotateZ(cylinderAt({ rBot: 60, rTop: 4, height: 50, segments: 4, bottom: [0, 0, 20] }, "Eastcoast_Granite"), 45), [0, s * (W + 30), 0]));
  // the deck: flags across, edge kerbs
  for (let x = -L; x < L; x += 50) out.push(boxBounds([x + 1, -W, -6], [x + 49, W, 4 + rnd() * 1.5], rnd() < 0.5 ? "Cobble" : "Eastcoast_Quarry", 1.5));
  // the parapets, capstones, and their ends turned out to the banks
  for (const s of [-1, 1]) {
    out.push(boxBounds([-L + 60, s * (W + 15) - 15, 0], [L - 60, s * (W + 15) + 15, 66], "Eastcoast_Rubble", 3));
    for (let x = -L + 60; x < L - 60; x += 60) out.push(boxBounds([x + 1, s * (W + 15) - 20, 66], [x + 59, s * (W + 15) + 20, 80], "Eastcoast_Quarry", 3));
    for (const e of [-1, 1]) {
      const a: V3 = [e * (L - 60), s * (W + 15), 0], b: V3 = [e * (L + 70), s * (W + 100), 0];
      out.push(beamBetween([a[0], a[1], 32], [b[0], b[1], 22], 30, 66, "Eastcoast_Rubble"), beamBetween([a[0], a[1], 72], [b[0], b[1], 52], 38, 14, "Eastcoast_Quarry"));
      out.push(boxAt([48, 48, 96], [a[0], a[1], 0], "Eastcoast_Granite", 4), cylinderAt({ rBot: 20, rTop: 6, height: 26, segments: 8, bottom: [a[0], a[1], 96] }, "Eastcoast_Granite"));
    }
  }
  // the toll house on the +X bank, -Y side of the way
  const HX = L + 160, HY = -W - 190, HS = 120, HH = 250;
  out.push(boxBounds([HX - HS - 10, HY - HS - 10, 0], [HX + HS + 10, HY + HS + 10, 18], "StoneGrey", 3));
  out.push(boxBounds([HX - HS, HY - HS, 18], [HX + HS, HY + HS, HH], "Eastcoast_Rubble", 2));
  for (const [x, y] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) out.push(boxAt([30, 30, HH - 10], [HX + x * HS, HY + y * HS, 18], "Eastcoast_Granite", 3));
  out.push(translate(rotateZ(cylinderAt({ rBot: (HS + 46) * Math.SQRT2, rTop: 8, height: 170, segments: 4, bottom: [0, 0, 0] }, "RoofSlate"), 45), [HX, HY, HH]));
  out.push(sphereCenter(12, [HX, HY, HH + 176], "IronDark", 8));
  out.push(windowY(HY + HS, HX, 150, 90, 70, 1, { shutter: "Eastcoast_Sign" }), boxBounds([HX - 55, HY + HS, 108], [HX + 55, HY + HS + 34, 116], "Eastcoast_Timber", 1));
  out.push(boxBounds([HX + HS - 2, HY - 45, 18], [HX + HS + 8, HY + 45, 228], "DoorWood", 1), boxBounds([HX + HS - 4, HY - 56, 224], [HX + HS + 12, HY + 56, 240], "Eastcoast_Granite", 2));
  out.push(windowX(HX - HS, HY, 150, 70, 70, -1, {}));
  // the barrier: its post by the house, the pole raised, the counterweight
  const BX = L + 70, BY = -W - 50;
  out.push(boxAt([30, 30, 130], [BX, BY, 0], "Eastcoast_Timber", 2), cylinderBetween([BX, BY - 18, 118], [BX, BY + 18, 118], 7, 8, "IronDark"));
  out.push(beamBetween([BX, BY, 118], [BX - 120, BY + 300, 420], 12, 12, "Eastcoast_Sign"), beamBetween([BX, BY, 118], [BX + 30, BY - 70, 50], 14, 14, "Eastcoast_Timber"), box([40, 40, 40], [BX + 34, BY - 78, 44], "Eastcoast_Granite", 3));
  for (let k = 1; k < 5; k++) out.push(translate(box([14, 14, 30], [0, 0, 0], "FabricWhite"), [BX - 24 * k, BY + 60 * k, 118 + 60.5 * k]));
  // a lamp on its post at the bridge's end, a coin board
  out.push(boxAt([14, 14, 240], [L + 20, W + 70, 0], "Eastcoast_Timber", 2), beamBetween([L + 20, W + 70, 236], [L - 30, W + 70, 236], 5, 5, "IronDark"));
  out.push(box([18, 18, 24], [L - 30, W + 70, 212], "IronDark"), box([12, 12, 18], [L - 30, W + 70, 212], "LanternGlow"));
  out.push(boxAt([10, 10, 150], [HX - HS - 30, HY + HS + 30, 0], "Eastcoast_Timber"), box([6, 70, 50], [HX - HS - 30, HY + HS + 30, 160], "Eastcoast_Timber", 1), cylinderCenter(14, 2, 12, [0, 0, 0], "GoldTrim").map((p) => ({ geo: p.geo.rotateY(Math.PI / 2).translate(HX - HS - 34, HY + HS + 30, 162), mat: p.mat })));
  return merge(...out);
}

// A pile of cut stone at the quarry (4.4 x 3.4 m): blocks of pale stone stacked three high,
// others lying where they were dropped, one roped on a wooden sledge, chips and rubble.
function cutStonePile(): Geo {
  const out: Geo[] = [], rnd = seeded(141);
  const blk = (sx: number, sy: number, sz: number, at: V3, turn = 0) => out.push(translate(rotateZ(box([sx, sy, sz], [0, 0, sz / 2], "Eastcoast_Quarry", 4), turn), at));
  for (const y of [-80, 50]) blk(120, 110, 70, [0, y, 0], rnd() * 4);
  blk(120, 110, 70, [-10, 180, 0], 5);
  blk(116, 104, 66, [6, -20, 70], -4);
  blk(116, 104, 66, [-4, 110, 70], 6);
  blk(110, 100, 60, [0, 40, 136], 10);
  blk(100, 70, 60, [-150, -150, 0], 30);
  blk(80, 70, 50, [160, 160, 0], -20);
  // the sledge
  for (const s of [-1, 1]) out.push(translate(merge(boxBounds([-120, s * 45 - 7, 0], [120, s * 45 + 7, 16], "Eastcoast_Timber", 2), translate(rotateY(box([40, 14, 14], [0, 0, 0], "Eastcoast_Timber", 2), -30), [-130, s * 45, 16])), [-170, 110, 0]));
  for (const x of [-80, 0, 80]) out.push(boxBounds([-170 + x - 8, 50, 16], [-170 + x + 8, 170, 26], "Eastcoast_Timber", 1));
  out.push(translate(box([110, 90, 70], [0, 0, 61], "Eastcoast_Quarry", 4), [-170, 110, 0]));
  for (const x of [-30, 30]) out.push(translate(rotateX(torus(52, 2.4, 12, 4, "RopeTan"), 90), [-170 + x, 110, 60]));
  for (let i = 0; i < 10; i++) out.push(stone([20 + rnd() * 26, 16 + rnd() * 20, 10 + rnd() * 12], 0.4, 150 + i, "Eastcoast_Quarry", [(rnd() - 0.5) * 420, (rnd() - 0.5) * 320, 0], rnd() * 360));
  return merge(...out);
}

// The quarry's treadwheel crane (6.4 x 3.6 m, 7.4 m): a timber platform, an A-frame mast braced
// back to its sill, a boom reaching out over the -X side, the great treadwheel behind it with its
// spokes and treads, the rope over the boom's pulley down to a block hanging in its iron tongs.
function quarryCrane(): Geo {
  const out: Geo[] = [], T = "Eastcoast_Timber";
  out.push(boxBounds([-150, -170, 0], [250, 170, 22], T, 2));
  for (const y of [-150, 150]) out.push(boxBounds([-160, y - 12, 0], [260, y + 12, 30], T, 2));
  // the mast: two legs up to the apex, braces back to the sill
  const APEX: V3 = [0, 0, 640];
  for (const s of [-1, 1]) out.push(beamBetween([-60, s * 140, 30], APEX, 18, 18, T), beamBetween([220, s * 140, 30], [10, s * 20, 560], 12, 12, T));
  out.push(beamBetween([-50, -120, 250], [-50, 120, 250], 12, 12, T));
  // the boom out over the front
  const TIP: V3 = [-300, 0, 700];
  out.push(beamBetween([60, 0, 520], TIP, 16, 18, T), beamBetween(APEX, [-180, 0, 700], 8, 8, "RopeTan"));
  out.push(translate(rotateX(torus(16, 5, 10, 4, "IronDark"), 90), [TIP[0], 0, TIP[2] - 14]));
  // the treadwheel: two rims, spokes, treads between, its axle on two posts
  const C: V3 = [150, 0, 180], R = 160;
  for (const s of [-1, 1]) {
    out.push(translate(rotateX(torus(R, 6, 22, 5, T), 90), [C[0], s * 60, C[2]]));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      out.push(beamBetween([C[0], s * 60, C[2]], [C[0] + Math.cos(a) * R, s * 60, C[2] + Math.sin(a) * R], 6, 6, T));
    }
    out.push(boxAt([16, 16, C[2] + 10], [C[0], s * 92, 22], T, 2));
  }
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * TAU;
    out.push(boxBounds([C[0] + Math.cos(a) * R - 5, -64, C[2] + Math.sin(a) * R - 3], [C[0] + Math.cos(a) * R + 5, 64, C[2] + Math.sin(a) * R + 3], "WoodWarm"));
  }
  out.push(cylinderBetween([C[0], -100, C[2]], [C[0], 100, C[2]], 9, 8, "IronDark"));
  // the rope: from the wheel's drum up to the boom, down to the load
  out.push(rope([C[0], 0, C[2] + 12], [60, 0, 528]), rope([60, 0, 528], [TIP[0], 0, TIP[2] - 20]), rope([TIP[0], 0, TIP[2] - 20], [TIP[0], 0, 250]));
  out.push(beamBetween([TIP[0], 0, 250], [TIP[0] - 40, 0, 205], 4, 4, "IronDark"), beamBetween([TIP[0], 0, 250], [TIP[0] + 40, 0, 205], 4, 4, "IronDark"));
  out.push(box([100, 80, 70], [TIP[0], 0, 168], "Eastcoast_Quarry", 4));
  // guy ropes to stakes
  for (const [x, y] of [[420, -260], [420, 260]]) out.push(rope(APEX, [x, y, 10], 1.4), cylinderAt({ rBot: 5, rTop: 3, height: 26, segments: 5, bottom: [x, y, 0] }, T));
  return merge(...out);
}

// =================================== the golden maples ===================================

// The golden maple: a sturdy grey-brown trunk and a broad layered crown of gold leaves, amber in
// the shade and pale gold where the sun catches it; about 9.5 m tall and 9 m across.
const GOLD: CanopyLook = { card: "maple", dark: [218, 150, 38], mid: [252, 206, 72], light: [255, 244, 156], core: "Eastcoast_GoldCore" };
function goldenMaple(): THREE.Object3D {
  return crownTreeObject({
    seed: 211, trunk: [[0, 0, 0], [-15, 20, 170], [-30, 30, 330]], radius: 32, bark: "Eastcoast_MapleBark", leaf: 56, look: GOLD,
    crowns: [[-30, 30, 600, 340, 320, 200], [150, 160, 700, 220, 200, 150], [-200, -120, 660, 230, 220, 150], [120, -200, 520, 200, 180, 120], [-60, 40, 820, 180, 170, 110]],
    density: 0.95, clip: { min: [-450, -440, 0], max: [440, 440, 960] },
  });
}

// A low bush of gold leaves (2.4 m across): lobes of gold sprays over an amber core on dark stems.
const GOLD_BUSH: ShrubLook = { core: "Eastcoast_GoldBushCore", dark: "Eastcoast_GoldCardDark", mid: "Eastcoast_GoldCard", light: "Eastcoast_GoldCardLight" };
function goldenBush(): Geo {
  return shrub({
    seed: 223, leaf: 32, look: GOLD_BUSH, ragged: 0.6, stems: { mat: "WoodDark", r: 4, n: 6 },
    lobes: [[0, 0, 80, 74, 66, 50], [54, 20, 58, 52, 48, 42], [-46, 36, 56, 50, 46, 40], [-40, -44, 58, 52, 46, 40], [60, -50, 52, 52, 46, 40], [10, -6, 112, 46, 42, 30]],
  });
}

// Fallen gold and amber leaves in a patch about 4 m across (cards lying flat on the ground).
const GOLD_LITTER: LeafPalette = { dark: [168, 84, 22], light: [252, 206, 80], leaves: 9 };
function mapleLitter(): THREE.Object3D {
  const rr = seeded(229);
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], col: number[] = [];
  for (let i = 0; i < 52; i++) {
    const a = rr() * TAU, d = Math.sqrt(rr()) * 180, cx = Math.cos(a) * d * 1.1, cy = Math.sin(a) * d * 0.9;
    const size = 38 + rr() * 34, rot = rr() * TAU, z = 1.4 + i * 0.05, tx = (rr() - 0.5) * 0.08, ty = (rr() - 0.5) * 0.08, shade = 0.75 + rr() * 0.35;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) {
      const lx = (sx * size) / 2, ly = (sy * size) / 2, x = cx + lx * Math.cos(rot) - ly * Math.sin(rot), y = cy + lx * Math.sin(rot) + ly * Math.cos(rot);
      pos.push(x, z + (x - cx) * tx + (y - cy) * ty, -y);
      nor.push(0, 1, 0);
      uv.push((sx + 1) / 2, (sy + 1) / 2);
      col.push(shade, shade * 0.96, shade * 0.9);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  const [mat] = leafMaterials("eastcoast_litter", () => leafClump(GOLD_LITTER));
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = true;
  const g = new THREE.Group();
  g.add(m);
  return g;
}

// A toadstool: a pale stem, a red cap with white spots
function toadstool(at: V3, h: number, r: number, seed: number, tilt = 0): Geo {
  const rnd = seeded(seed), out: Geo[] = [];
  out.push(cylinderAt({ rBot: r * 0.42, rTop: r * 0.3, height: h, segments: 8, bottom: [0, 0, 0] }, "Eastcoast_Stem"));
  out.push(translate(torus(r * 0.36, r * 0.07, 10, 4, "Eastcoast_Stem"), [0, 0, h * 0.7]));
  out.push(lathe([[r, h - r * 0.08], [r * 0.98, h + r * 0.08], [r * 0.82, h + r * 0.38], [r * 0.5, h + r * 0.58], [0, h + r * 0.64]], 12, "Eastcoast_Cap"));
  out.push(lathe([[r * 0.3, h], [r * 0.98, h - r * 0.07]], 12, "Eastcoast_Stem"));
  for (let k = 0; k < 6; k++) {
    const a = rnd() * TAU, e = 0.25 + rnd() * 0.9, cr = r * (0.9 - e * 0.4);
    out.push(sphereCenter(r * 0.1, [Math.cos(a) * cr, Math.sin(a) * cr, h + r * (0.1 + e * 0.42)], "Eastcoast_CapSpot", 5));
  }
  return translate(rotateY(rotateZ(merge(...out), rnd() * 360), tilt), at);
}

// A fairy ring (4.4 m across): a circle of darker grass ringed by red spotted toadstools of every
// size, two big ones at its edge, and little lights of the fairies drifting over its middle.
function mushroomRing(): Geo {
  const out: Geo[] = [], rnd = seeded(233), R = 175;
  out.push(scale(torus(R, 22, 32, 6, "Eastcoast_FairyRing"), [1, 1, 0.12]));
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU + (rnd() - 0.5) * 0.2, d = R + (rnd() - 0.5) * 30, big = i === 3 || i === 11;
    const h = big ? 52 + rnd() * 10 : 12 + rnd() * 20, r = big ? 30 : 8 + rnd() * 9;
    out.push(toadstool([Math.cos(a) * d, Math.sin(a) * d, 0], h, r, 240 + i, (rnd() - 0.5) * 14));
    if (rnd() < 0.5) out.push(toadstool([Math.cos(a + 0.09) * (d + 18), Math.sin(a + 0.09) * (d + 18), 0], 8 + rnd() * 6, 5 + rnd() * 3, 280 + i, 10));
  }
  out.push(motes(237, 16, R * 0.8, 30, 150), motes(239, 6, R * 0.5, 20, 90, "Eastcoast_FairyGold", 2.6));
  return merge(...out);
}

// The fairy stone (3.2 x 3 m, 4.3 m): a tall standing stone with a round hole worn through its
// head, mossy on top, glowing spirals carved on its face; a ring of small stones round its foot,
// glowing flowers between them and the fairies' lights drifting through the hole.
function fairyStone(): Geo {
  const out: Geo[] = [], rnd = seeded(251);
  const body = stone([150, 96, 300], 0.16, 252, "Eastcoast_FairyStone", [0, 0, 0], 8);
  // the holed head: a ring of stone (a torus roughed up into facets), standing across X
  const ring = new THREE.TorusGeometry(64, 36, 10, 18);
  const p = ring.getAttribute("position"), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const k = 1 + 0.16 * (noise3(v.x / 40 + 3, v.y / 40, v.z / 40, 253) - 0.5);
    p.setXYZ(i, v.x * k, v.y * k, v.z * (0.85 + 0.15 * k));
  }
  ring.deleteAttribute("normal");
  ring.deleteAttribute("uv");
  const rg = ring.toNonIndexed();
  rg.computeVertexNormals();
  const uvs: number[] = [];
  const q = rg.getAttribute("position");
  for (let i = 0; i < q.count; i++) uvs.push(q.getX(i) / 100, q.getY(i) / 100);
  rg.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  const head: Geo = translate(rotateZ(rotateX([{ geo: rg, mat: "Eastcoast_FairyStone" }], 90), 90), [0, 0, 318]);
  out.push(body, head, coverTop(merge(body, head), "Eastcoast_Moss", { amount: 0.28, thick: 3, seed: 254, grain: 40 }));
  // the glowing spirals on its face and round the hole
  for (const [z, r0] of [[120, 26], [210, 18]]) {
    for (let k = 0; k < 22; k++) {
      const t0 = k / 22, t1 = (k + 1) / 22, a0 = t0 * TAU * 2, a1 = t1 * TAU * 2, r = (t: number) => 4 + r0 * t;
      out.push(cylinderBetween([-62, Math.cos(a0) * r(t0), z + Math.sin(a0) * r(t0)], [-62, Math.cos(a1) * r(t1), z + Math.sin(a1) * r(t1)], 1.6, 4, "Eastcoast_Rune"));
    }
  }
  out.push(translate(rotateY(torus(70, 1.8, 24, 4, "Eastcoast_Rune"), 90), [-38, 0, 318]));
  out.push(translate(rotateY(cylinderCenter(52, 2, 16, [0, 0, 0], "Eastcoast_Fairy"), 90), [0, 0, 318]).map((p2) => ({ geo: p2.geo, mat: "Eastcoast_BrewMist" })));
  // the ring of small stones, glowing flowers, the lights
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + 0.3, d = 150 + rnd() * 20;
    out.push(stone([34 + rnd() * 20, 30 + rnd() * 16, 24 + rnd() * 20], 0.35, 260 + i, "Eastcoast_FairyStone", [Math.cos(a) * d, Math.sin(a) * d, 0], rnd() * 360));
    const fa = a + 0.35, fd = 110 + rnd() * 40, f: V3 = [Math.cos(fa) * fd, Math.sin(fa) * fd, 0];
    for (let k = 0; k < 3; k++) {
      const top: V3 = [f[0] + (rnd() - 0.5) * 20, f[1] + (rnd() - 0.5) * 20, 22 + rnd() * 16];
      out.push(cylinderBetween(f, top, 1, 3, "Eastcoast_Stalk"), sphereCenter(4, top, k % 2 ? "Eastcoast_Fairy" : "Eastcoast_FairyGold", 6));
    }
  }
  out.push(motes(257, 14, 140, 60, 380), translate(motes(258, 6, 40, 0, 40, "Eastcoast_FairyGold", 2.6), [0, 0, 300]));
  return merge(...out);
}

// The woodcutter's log cabin (6.4 x 5.4 m, 5 m): walls of round logs crossed at the corners, a
// plank door and a shuttered window to the front, a shingle roof, a stone chimney at the back,
// firewood stacked under the eaves on the south side, the chopping block with the axe in it.
function woodcutterHut(): Geo {
  const out: Geo[] = [], X = 250, Y = 200, R = 13, C = 26, N = 9, Z0 = 20, rnd = seeded(271);
  const wood = endGrain("#c9a46e");
  out.push(boxBounds([-X - 20, -Y - 20, 0], [X + 20, Y + 20, Z0], "StoneGrey", 3));
  const log = (a: V3, b: V3) => {
    out.push(cylinderBetween(a, b, R, 8, "Eastcoast_LogWood"));
    for (const e of [a, b]) {
      const d = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(d[0], d[1]) || 1, s = e === a ? -1 : 1;
      out.push(cylinderBetween(e, [e[0] + (s * d[0] * 1.5) / L, e[1] + (s * d[1] * 1.5) / L, e[2]], R - 1, 8, wood));
    }
  };
  for (let k = 0; k < N; k++) {
    const z = Z0 + R + k * C, off = k % 2 ? 0 : 13;
    // the front wall (door at y -100..10, window at y 70..170 between z 100 and 180)
    const front: [number, number][] = z < 240 ? (z > 100 && z < 186 ? [[-Y - 28, -100], [10, 70], [170, Y + 28]] : [[-Y - 28, -100], [10, Y + 28]]) : [[-Y - 28, Y + 28]];
    for (const [a, b] of front) log([-X, a, z + off], [-X, b, z + off]);
    log([X, -Y - 28, z + off], [X, Y + 28, z + off]);
    const side: [number, number][] = z > 100 && z < 186 ? [[-X - 28, -60], [60, X + 28]] : [[-X - 28, X + 28]];
    for (const s of [-1, 1]) for (const [a, b] of side) log([a, s * Y, z + 13 - off], [b, s * Y, z + 13 - off]);
  }
  const TOP = Z0 + N * C + 10;
  // door and window
  out.push(boxBounds([-X - 4, -100, Z0], [-X + 6, 10, Z0 + 216], "DoorWood", 1));
  for (const z of [Z0 + 40, Z0 + 170]) out.push(box([4, 70, 6], [-X - 6, -60, z], "IronDark"));
  out.push(boxBounds([-X - 10, -108, Z0 + 214], [-X + 10, 18, Z0 + 230], "Eastcoast_Timber", 1));
  out.push(windowX(-X, 120, Z0 + 125, 90, 70, -1, { shutter: "WoodRed" }));
  for (const s of [-1, 1]) out.push(windowY(s * Y, 0, Z0 + 125, 90, 70, s as 1 | -1, { shutter: "WoodRed" }));
  // gables of short logs, the roof, its ridge
  out.push(gableWall(-X, Y + 13, TOP - 6, 170, "Eastcoast_LogWood"), gableWall(X, Y + 13, TOP - 6, 170, "Eastcoast_LogWood"));
  out.push(gableRoof([2 * X, 2 * Y, 14], [0, 0, TOP - 4], 170, 60, "Eastcoast_Shingle"));
  out.push(beamBetween([-X - 70, 0, TOP + 176], [X + 70, 0, TOP + 176], 18, 14, "Eastcoast_Timber"));
  // the chimney at the back gable
  out.push(boxAt([80, 100, TOP + 230], [X + 50, 60, 0], "Eastcoast_Rubble", 3), boxAt([94, 114, 16], [X + 50, 60, TOP + 230], "Eastcoast_Granite", 3));
  // firewood stacked along the south wall under a lean-to
  for (let row = 0; row < 4; row++) for (let i = 0; i < 12; i++) {
    const x = -X + 40 + i * 38 + (row % 2) * 14, z = 12 + row * 22 + rnd() * 2;
    out.push(cylinderBetween([x, -Y - 30, z], [x + (rnd() - 0.5) * 6, -Y - 92, z], 10 + rnd() * 2, 6, rnd() < 0.5 ? "Eastcoast_LogWood" : wood));
  }
  out.push(translate(rotateX(box([2 * X - 40, 90, 8], [0, 0, 0], "Eastcoast_Shingle", 1), 18), [0, -Y - 70, 140]));
  for (const x of [-X + 20, X - 20]) out.push(boxAt([12, 12, 140], [x, -Y - 108, 0], "Eastcoast_Timber"));
  // the chopping block, the axe, split wood round it
  out.push(translate(stumpOf({ seed: 273, r: 30, h: 46, bark: "Eastcoast_LogWood", wood, roots: 3 }), [-X - 140, -160, 0]));
  out.push(beamBetween([-X - 140, -150, 52], [-X - 150, -110, 110], 3.5, 3.5, "WoodPale"), translate(rotateX(box([5, 26, 18], [0, 0, 0], "IronLight", 1), -40), [-X - 140, -156, 52]));
  for (let i = 0; i < 5; i++) out.push(translate(rotateZ(rotateY(box([40, 10, 8], [0, 0, 4], wood, 1), rnd() * 20), rnd() * 360), [-X - 140 + (rnd() - 0.5) * 120, -160 + (rnd() - 0.5) * 120, 0]));
  return merge(...out);
}

// =================================== the witch's cape ===================================

const DARK_LEAVES: ShrubLook = { core: "Eastcoast_DarkLeaf", dark: "Eastcoast_DarkCardDark", mid: "Eastcoast_DarkCard", light: "Eastcoast_DarkCardLight" };
// A twisted tree of the cape (about 6.5 m): a trunk wrung round on itself, limbs writhing out and
// drooping, dark sparse leaves in clumps at their ends, grey moss hanging.
function twistedTree(): Geo {
  const out: Geo[] = [], rnd = seeded(301), path: V3[] = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6, a = t * TAU * 0.9;
    path.push([Math.cos(a) * 34 * t, Math.sin(a) * 34 * t, t * 330]);
  }
  out.push(limb(path, 34, 18, "Eastcoast_TwistBark", { flare: 0.8, roots: 5, gnarl: 1, seed: 302, step: 26, maxRings: 18 }));
  const tips: { p: V3; d: V3; r: number }[] = [];
  const top = path[path.length - 1];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * TAU + 0.4;
    out.push(grow({ mat: "Eastcoast_TwistBark", seed: 310 + k, at: [top[0], top[1], top[2] - 30], dir: [Math.cos(a), Math.sin(a), 0.6], len: 200, r: 14, depth: 2, wobble: 1.3, spread: 0.9, shrink: 0.75, rise: -0.25, gnarl: 0.8, tips }));
  }
  out.push(grow({ mat: "Eastcoast_TwistBark", seed: 320, at: [path[3][0], path[3][1], path[3][2]], dir: [-0.8, 0.4, 0.3], len: 170, r: 11, depth: 2, wobble: 1.2, rise: -0.2, tips }));
  for (const t of tips) {
    if (rnd() < 0.6) {
      const rx = 40 + rnd() * 18;
      out.push(shrub({ seed: 330 + tips.indexOf(t), leaf: 24, look: DARK_LEAVES, ragged: 0.8, density: 0.7, lobes: [[t.p[0], t.p[1], t.p[2] + 4, rx, rx * 0.9, 20 + rnd() * 8], [t.p[0] + rx * 0.4, t.p[1] - rx * 0.3, t.p[2] - 6, rx * 0.6, rx * 0.55, 16]] }));
    }
    if (rnd() < 0.55) {
      const n = 3 + Math.floor(rnd() * 3);
      for (let k = 0; k < n; k++) {
        const at: V3 = [t.p[0] + (rnd() - 0.5) * 50, t.p[1] + (rnd() - 0.5) * 50, t.p[2] - 4];
        const len = 50 + rnd() * 70, w = 6 + rnd() * 6;
        out.push(quad([at[0] - w, at[1], at[2]], [at[0] + w, at[1], at[2]], [at[0] + w * 0.3, at[1] + (rnd() - 0.5) * 10, at[2] - len], [at[0] - w * 0.3, at[1], at[2] - len * 0.9], "Eastcoast_HangMoss"));
      }
    }
  }
  return merge(...out);
}

// A dead tree hung with charms (about 5 m): bare grey limbs, and from their ends on strings the
// cape's warding charms: bones, little bottles glowing green and violet, crossed-twig wards in
// rings, stitched cloth dolls with button eyes, rags of red and purple cloth; a skull at its foot.
function charmTree(): Geo {
  const out: Geo[] = [], rnd = seeded(341), tips: { p: V3; d: V3; r: number }[] = [];
  out.push(grow({ mat: "Eastcoast_DeadWood", seed: 342, at: [0, 0, -6], dir: [0.15, -0.1, 1], len: 230, r: 22, depth: 3, wobble: 1, spread: 0.95, shrink: 0.7, thin: 0.8, rise: 0.05, flare: 0.8, roots: 5, gnarl: 0.9, tips }));
  const charms = ["bone", "bottle", "ward", "doll", "rag", "bottle2", "bone", "ward", "rag"];
  tips.forEach((t, i) => {
    if (t.p[2] < 200 || rnd() < 0.15) return;
    const kind = charms[i % charms.length], len = 30 + rnd() * 60, end: V3 = [t.p[0], t.p[1], t.p[2] - len];
    out.push(rope(t.p, end, 0.8, "Eastcoast_Soot"));
    const at = (g: Geo) => out.push(translate(rotateZ(g, rnd() * 360), end));
    if (kind === "bone") at(merge(cylinderBetween([0, 0, -4], [0, 0, -40], 3, 6, "Eastcoast_Bone"), sphereCenter(5, [-2, 0, -40], "Eastcoast_Bone", 6), sphereCenter(5, [2, 0, -40], "Eastcoast_Bone", 6), sphereCenter(5, [0, 0, -4], "Eastcoast_Bone", 6)));
    else if (kind === "bottle" || kind === "bottle2") at(merge(lathe([[0.1, -34], [9, -32], [10, -18], [4, -10], [3, -2]], 8, kind === "bottle" ? "Eastcoast_Bottle" : "Eastcoast_BottleViolet"), cylinderAt({ radius: 3.4, height: 4, segments: 6, bottom: [0, 0, -3] }, "Eastcoast_Timber")));
    else if (kind === "ward") at(merge(rotateX(torus(14, 1.4, 12, 4, "Eastcoast_DeadWood"), 90).map((p) => ({ geo: p.geo.translate(0, 0, -18), mat: p.mat })), beamBetween([0, -14, -32], [0, 14, -4], 2, 2, "Eastcoast_DeadWood"), beamBetween([0, -14, -4], [0, 14, -32], 2, 2, "Eastcoast_DeadWood"), sphereCenter(2.4, [0, 0, -18], "Eastcoast_BottleViolet", 5)));
    else if (kind === "doll") at(merge(ellipsoid([6, 5, 10], [0, 0, -22], "Eastcoast_Patch", 7), sphereCenter(6.5, [0, 0, -7], "Eastcoast_Sack", 7), beamBetween([0, -12, -16], [0, 12, -16], 3, 3, "Eastcoast_PatchGreen"), sphereCenter(1.6, [-6, -2.5, -6], "IronDark", 4), sphereCenter(1.6, [-6, 2.5, -6], "IronDark", 4), cylinderBetween([0, -3, -30], [0, -4, -40], 2, 4, "Eastcoast_Patch"), cylinderBetween([0, 3, -30], [0, 4, -40], 2, 4, "Eastcoast_Patch")));
    else at(quad([0, -6, 0], [0, 6, 0], [3, 7, -50], [-3, -5, -46], rnd() < 0.5 ? "FabricRed" : "FabricPurple"));
  });
  // the skull and a few bones at its foot, a ring of white pebbles
  out.push(sphereCenter(13, [-60, 30, 11], "Eastcoast_Bone", 8), ellipsoid([9, 9, 6], [-68, 30, 4], "Eastcoast_Bone", 7), sphereCenter(3.4, [-71, 25, 14], "IronDark", 5), sphereCenter(3.4, [-71, 35, 14], "IronDark", 5));
  for (const [a, b] of [[[-30, 70, 3], [10, 100, 3]], [[40, -60, 3], [60, -20, 3]]] as [V3, V3][]) out.push(cylinderBetween(a, b, 3, 6, "Eastcoast_Bone"));
  out.push(pebbles(343, [0, 0], 110, 110, 14, 10, "Eastcoast_Bone"));
  return merge(...out);
}

// The witch's crooked hut (6.6 x 5.6 m, 7.6 m): on a footing of rough stones, walls of dark warped
// planks leaning a little out of true, a steep tall roof of dark thatch sagging in the middle with
// its ridge bent up at the ends, a crooked chimney breathing green fumes, a round window glowing,
// the door under a little porch with a skull over it, herbs hung to dry under the eaves, shelves of
// jars, a broom by the door and pumpkins on the step.
function witchHut(): Geo {
  const out: Geo[] = [], rnd = seeded(361), X = 230, Y = 200, Z0 = 50, H = 250;
  for (let i = 0; i < 16; i++) {
    const t = i / 16, a = t * TAU;
    const x = Math.max(-X - 10, Math.min(X + 10, Math.cos(a) * X * 1.5)), y = Math.max(-Y - 10, Math.min(Y + 10, Math.sin(a) * Y * 1.5));
    out.push(stone([80, 70, 62], 0.35, 362 + i, "Eastcoast_CliffDark", [x, y, -8], rnd() * 360));
  }
  out.push(boxBounds([-X - 10, -Y - 10, 20], [X + 10, Y + 10, Z0], "Eastcoast_WitchWood", 2));
  // the walls: planks with gaps of dark between, leaning out of true
  const walls: Geo[] = [];
  walls.push(boxBounds([-X + 8, -Y + 8, Z0], [X - 8, Y - 8, Z0 + H], "Eastcoast_Soot"));
  for (const s of [-1, 1]) {
    for (let y = -Y; y < Y; y += 24) if (s > 0 || Math.abs(y + 20) > 70 || true) walls.push(box([7, 22, H + (rnd() - 0.5) * 12], [s * X, y + 12, Z0 + H / 2], rnd() < 0.3 ? "Eastcoast_DriftDark" : "Eastcoast_WitchWood", 1));
    for (let x = -X; x < X; x += 24) walls.push(box([22, 7, H + (rnd() - 0.5) * 12], [x + 12, s * Y, Z0 + H / 2], rnd() < 0.3 ? "Eastcoast_DriftDark" : "Eastcoast_WitchWood", 1));
  }
  for (const [x, y] of [[-X, -Y], [-X, Y], [X, -Y], [X, Y]]) walls.push(boxAt([20, 20, H + 10], [x, y, Z0], "Eastcoast_Tar", 2));
  out.push(rotateX(rotateY(merge(...walls), 2.5, [0, 0, Z0]), -1.5, [0, 0, Z0]));
  // the door and its porch, the skull over it
  out.push(boxBounds([-X - 8, -50, Z0], [-X + 4, 50, Z0 + 205], "DoorWood", 1), boxBounds([-X - 12, -62, Z0 + 200], [-X + 4, 62, Z0 + 218], "Eastcoast_Tar", 1));
  for (const z of [Z0 + 40, Z0 + 160]) out.push(box([4, 60, 7], [-X - 10, -16, z], "IronDark"));
  out.push(sphereCenter(4, [-X - 12, 34, Z0 + 104], "IronDark", 6));
  out.push(sphereCenter(15, [-X - 14, 0, Z0 + 238], "Eastcoast_Bone", 8), sphereCenter(4, [-X - 26, -6, Z0 + 240], "Eastcoast_WindowGlow", 5), sphereCenter(4, [-X - 26, 6, Z0 + 240], "Eastcoast_WindowGlow", 5));
  for (const y of [-110, 110]) out.push(cylinderBetween([-X - 130, y, 0], [-X - 124, y * 0.95, Z0 + 230], 8, 6, "Eastcoast_TwistBark"));
  out.push(translate(rotateY(box([160, 280, 10], [0, 0, 0], "Eastcoast_WitchThatch", 1), -22), [-X - 70, 0, Z0 + 260]));
  out.push(boxBounds([-X - 120, -120, 0], [-X, 120, 22], "Eastcoast_WitchWood", 1.5), boxBounds([-X - 150, -90, 0], [-X - 120, 90, 11], "Eastcoast_WitchWood", 1.5));
  // the round window on the front, square ones on the sides
  out.push(translate(rotateY(merge(torus(36, 7, 16, 5, "Eastcoast_Tar"), cylinderCenter(32, 4, 16, [0, 0, 0], "Eastcoast_WindowGlow"), box([3, 64, 4], [0, 0, 2], "Eastcoast_Tar"), box([64, 3, 4], [0, 0, 2], "Eastcoast_Tar")), 90), [-X - 6, 130, Z0 + 150]));
  for (const s of [-1, 1]) out.push(windowY(s * Y, 40, Z0 + 140, 60, 60, s as 1 | -1, { frame: "Eastcoast_Tar", glass: "Eastcoast_WindowGlow" }));
  // the roof: steep, sagging, ridge along X bent up at its ends, moss in patches on the thatch;
  // the whole of it set a little askew on the walls
  const RH = 330, OV = 60, slope = Math.hypot(Y + OV, RH), ang = Math.atan2(RH, Y + OV) * DEG, N = 6, roof: Geo[] = [];
  for (let i = 0; i < N; i++) {
    const x0 = -X - OV + ((2 * X + 2 * OV) * i) / N, x1 = -X - OV + ((2 * X + 2 * OV) * (i + 1)) / N, xm = (x0 + x1) / 2;
    const sag = -36 * (1 - Math.pow(Math.abs(xm) / (X + OV), 2));
    for (const s of [-1, 1]) roof.push(translate(rotateX(box([x1 - x0 + 4, slope, 22], [0, (s * slope) / 2, 0], "Eastcoast_WitchThatch", 4), -s * ang + (rnd() - 0.5) * 3), [xm, 0, Z0 + H + RH - 30 + sag]));
  }
  const thatch = merge(...roof);
  roof.push(coverTop(thatch, "Eastcoast_Moss", { amount: 0.25, thick: 3, seed: 365, patches: 0.4, grain: 40 }));
  for (const e of [-1, 1]) {
    roof.push(gableWall(e * (X - 4), Y - 6, Z0 + H - 6, RH - 40, "Eastcoast_WitchWood"));
    roof.push(cylinderBetween([e * (X + OV - 10), 0, Z0 + H + RH - 30], [e * (X + OV + 70), 0, Z0 + H + RH + 40], 14, 6, "Eastcoast_WitchThatch", 3));
  }
  // the round window glowing in the front gable
  roof.push(translate(rotateY(merge(torus(46, 8, 16, 5, "Eastcoast_Tar"), cylinderCenter(42, 4, 16, [0, 0, 0], "Eastcoast_WindowGlow"), box([3, 84, 4], [0, 0, 2], "Eastcoast_Tar"), box([84, 3, 4], [0, 0, 2], "Eastcoast_Tar")), 90), [-X - 6, 0, Z0 + H + 110]));
  out.push(rotateZ(rotateX(merge(...roof), 2.5, [0, 0, Z0 + H]), 3));
  // green lanterns hung from the porch roof
  for (const y of [-100, 100]) out.push(rope([-X - 120, y, Z0 + 238], [-X - 120, y, Z0 + 200], 1, "IronDark"), box([16, 16, 22], [-X - 120, y, Z0 + 188], "IronDark"), box([11, 11, 16], [-X - 120, y, Z0 + 188], "Eastcoast_WindowGlow"));
  // the crooked chimney: stones stacked askew, green fumes
  let cz = 0, cx = X - 70, cy = Y - 40;
  for (let i = 0; i < 7; i++) {
    const h = 70 + rnd() * 20;
    out.push(translate(rotateZ(box([60, 60, h], [0, 0, h / 2], "Eastcoast_CliffDark", 4), rnd() * 20), [cx, cy, cz]));
    cz += h - 4;
    cx += 4 + rnd() * 6;
    cy += (rnd() - 0.3) * 8;
  }
  for (let i = 0; i < 4; i++) out.push(sphereCenter(26 + i * 10, [cx + i * 16, cy - i * 6, cz + 30 + i * 46], "Eastcoast_BrewMist", 8));
  // herbs drying under the front eave, shelves of jars, the broom, pumpkins
  for (let y = -Y + 30; y < Y - 20; y += 34) {
    out.push(rope([-X - 50, y, Z0 + H + 10], [-X - 50, y, Z0 + H - 26], 0.8));
    out.push(cylinderAt({ rBot: 4, rTop: 13, height: 34, segments: 6, bottom: [-X - 50, y, Z0 + H - 62] }, rnd() < 0.5 ? "Eastcoast_Weed" : "Eastcoast_Hay"));
  }
  out.push(boxBounds([-X - 30, 70, Z0 + 90], [-X - 4, 190, Z0 + 96], "Eastcoast_WitchWood"));
  for (let i = 0; i < 5; i++) out.push(translate(lathe([[0.1, 0], [8, 2], [9, 18], [5, 26], [5, 30]], 8, i % 2 ? "Eastcoast_Bottle" : "Eastcoast_BottleViolet"), [-X - 16, 82 + i * 24, Z0 + 96]));
  out.push(beamBetween([-X - 30, -140, 0], [-X - 10, -150, 170], 3, 3, "WoodPale"), translate(cylinderAt({ rBot: 16, rTop: 4, height: 50, segments: 7, bottom: [0, 0, 0] }, "Eastcoast_Hay"), [-X - 32, -139, -6]));
  for (const [x, y, r] of [[-X - 100, 150, 24], [-X - 160, 110, 18], [-X - 90, -170, 20]]) {
    for (let k = 0; k < 6; k++) out.push(ellipsoid([r * 0.55, r * 0.55, r * 0.75], [x + Math.cos((k / 6) * TAU) * r * 0.5, y + Math.sin((k / 6) * TAU) * r * 0.5, r * 0.62], "Eastcoast_Pumpkin", 7));
    out.push(cylinderAt({ rBot: 3, rTop: 2, height: 10, segments: 5, bottom: [x, y, r * 1.2] }, "Eastcoast_Weed"));
  }
  return merge(...out);
}

// The witch's cauldron (2 x 2 m, 1.6 m): a black iron pot on three legs over a fire of crossed logs
// ringed with stones, its brew glowing green and bubbling, green steam over it, a ladle in it.
function cauldron(): Geo {
  const out: Geo[] = [], Z = 34;
  out.push(lathe([[22, Z], [50, Z + 12], [62, Z + 40], [62, Z + 66], [56, Z + 90], [58, Z + 96], [62, Z + 98], [58, Z + 102], [52, Z + 96]], 18, "IronDark"));
  out.push(cylinderAt({ radius: 54, height: 2, segments: 18, bottom: [0, 0, Z + 88] }, "Eastcoast_Brew"));
  for (const [x, y, r] of [[10, -14, 9], [-22, 18, 6], [24, 20, 7], [-8, -30, 5], [30, -6, 4]]) out.push(lathe([[r, 0], [r * 0.9, r * 0.5], [0, r * 0.8]], 8, "Eastcoast_Brew").map((p) => ({ geo: p.geo.translate(x, y, Z + 89), mat: p.mat })));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.5;
    out.push(cylinderBetween([Math.cos(a) * 46, Math.sin(a) * 46, Z + 30], [Math.cos(a) * 62, Math.sin(a) * 62, 0], 4.5, 6, "IronDark"));
    out.push(translate(rotateY(torus(8, 2.4, 10, 4, "IronDark"), 90), [Math.cos(a + 1) * 62, Math.sin(a + 1) * 62, Z + 80]).map((p) => p));
  }
  // the fire under it: logs, embers, flames; the ring of stones
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI + 0.3;
    out.push(cylinderBetween([Math.cos(a) * 50, Math.sin(a) * 50, 6], [-Math.cos(a) * 50, -Math.sin(a) * 50, 10], 7, 6, i % 2 ? "Eastcoast_LogWood" : "Eastcoast_Soot"));
  }
  out.push(ellipsoid([34, 34, 6], [0, 0, 3], "Eastcoast_Ember", 10));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    out.push(cylinderAt({ rBot: 9, rTop: 0.5, height: 22 + (i % 2) * 8, segments: 6, bottom: [Math.cos(a) * 14, Math.sin(a) * 14, 4] }, "Eastcoast_Flame"));
  }
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * TAU;
    out.push(stone([26, 22, 18], 0.4, 380 + i, "Eastcoast_CliffDark", [Math.cos(a) * 88, Math.sin(a) * 88, 0], i * 40));
  }
  // the ladle and the steam
  out.push(cylinderBetween([10, 10, Z + 70], [40, 40, Z + 150], 2.5, 5, "WoodPale"), sphereCenter(8, [8, 8, Z + 84], "IronDark", 6));
  for (let i = 0; i < 4; i++) out.push(sphereCenter(24 + i * 9, [i * 8, -i * 6, Z + 120 + i * 34], "Eastcoast_BrewMist", 8));
  return merge(...out);
}

// where the ring's standing stones are (item frame), for a field's solids
export const CIRCLE_STONES: [number, number][] = [1, 2, 3, 4, 5, 7, 8, 9].map((i) => [Math.cos(Math.PI + (i / 10) * TAU) * 480, Math.sin(Math.PI + (i / 10) * TAU) * 480]);
// The ring of standing stones over the sea (11 x 11 m, 3.6 m): nine weathered stones round a
// worn ring of gravel, two of them carrying a lintel over the way in from the front, one fallen;
// in the middle the altar slab with glowing runes cut in it and offerings of shells and candles;
// yellow lichen on the stones.
function seaStoneCircle(): Geo {
  const out: Geo[] = [], rnd = seeded(401), R = 480;
  out.push(scale(torus(R, 70, 36, 6, "Eastcoast_Gravel"), [1, 1, 0.06]));
  // (nine stones on the ring at tenths of the way round, the tenth place, at -X, left for the way in)
  for (let i = 1; i < 10; i++) {
    const a = Math.PI + (i / 10) * TAU, x = Math.cos(a) * R, y = Math.sin(a) * R;
    if (i === 6) {
      // the fallen one, lying outwards
      const g = stone([90, 70, 300], 0.18, 410, "Eastcoast_CircleStone", [0, 0, 0]);
      out.push(translate(rotateZ(rotateY(g, 84), a * DEG), [x + Math.cos(a) * 60, y + Math.sin(a) * 60, 30]));
      continue;
    }
    const h = 230 + rnd() * 110, g = stone([100 + rnd() * 30, 64 + rnd() * 20, h], 0.16, 411 + i, "Eastcoast_CircleStone", [0, 0, 0]);
    const lean = (rnd() - 0.5) * 10;
    const placed = translate(rotateZ(rotateY(g, lean), a * DEG + 90), [x, y, 0]);
    out.push(placed, coverTop(placed, "Eastcoast_Lichen", { amount: 0.5, thick: 1.4, seed: 420 + i, patches: 0.45, grain: 20 }));
  }
  // the trilithon at the way in (-X): two uprights and a lintel
  for (const s of [-1, 1]) out.push(translate(rock([90, 70, 330], 0.12, 430 + s, "Eastcoast_CircleStone"), [-R - 10, s * 130, 0]));
  out.push(translate(rock([110, 380, 70], 0.12, 433, "Eastcoast_CircleStone", true), [-R - 10, 0, 318]));
  // the altar, its runes and offerings
  const altar = stone([240, 150, 70], 0.12, 440, "Eastcoast_CircleStone", [0, 0, 0], 0, true);
  out.push(altar, coverTop(altar, "Eastcoast_Lichen", { amount: 0.3, thick: 1.2, seed: 441, patches: 0.4 }));
  for (let k = 0; k < 7; k++) {
    const x = -80 + k * 26;
    out.push(box([16, 4, 1.5], [x, -30, 59], "Eastcoast_Rune"), box([4, 22, 1.5], [x + 6, 10, 59], "Eastcoast_Rune"));
  }
  out.push(translate(torus(28, 1.6, 18, 4, "Eastcoast_Rune"), [60, 30, 59]));
  for (const [x, y] of [[-90, 50], [-60, 58], [90, -50]]) out.push(cylinderAt({ radius: 4.5, height: 14 + (x % 3) * 4, segments: 6, bottom: [x, y, 54] }, "Eastcoast_Stem"), sphereCenter(2.8, [x, y, 72 + (x % 3) * 4], "LanternGlow", 5));
  for (let i = 0; i < 6; i++) out.push(translate(lathe([[0.1, 0], [10, 1], [6, 8], [0.1, 10]], 7, "Eastcoast_Barnacle"), [-30 + i * 14, 50 + (i % 2) * 10, 54]));
  for (let i = 0; i < 14; i++) out.push(stone([24 + rnd() * 20, 20 + rnd() * 16, 12 + rnd() * 10], 0.4, 450 + i, "Eastcoast_CircleStone", [(rnd() - 0.5) * 1100, (rnd() - 0.5) * 1100, 0], rnd() * 360));
  return merge(...out);
}

// Low fog (about 11 x 6 m, under 1.3 m): soft flattened banks of grey-green mist lying on the
// ground (see-through, nothing to bump into).
function lowFog(): THREE.Group {
  const rnd = seeded(431), parts: Geo[] = [];
  for (let i = 0; i < 11; i++) {
    const x = (rnd() - 0.5) * 900, y = (rnd() - 0.5) * 380, rx = 170 + rnd() * 190, ry = 120 + rnd() * 120;
    parts.push(ellipsoid([rx, ry, 30 + rnd() * 30], [x, y, 18 + rnd() * 50], "fog", 12));
  }
  for (let i = 0; i < 3; i++) parts.push(ellipsoid([260 + rnd() * 140, 170 + rnd() * 70, 22], [(rnd() - 0.5) * 800, (rnd() - 0.5) * 260, 100 + rnd() * 30], "fog", 10));
  const mat = new THREE.MeshStandardMaterial({ color: "#cdd8d2", transparent: true, opacity: 0.12, roughness: 1, depthWrite: false, emissive: new THREE.Color("#7f8f86"), emissiveIntensity: 0.25 });
  const g = toThree(merge(...parts), () => mat);
  g.traverse((o) => {
    o.castShadow = false;
    o.receiveShadow = false;
  });
  return g;
}

// (kept for the fields: a big granite boulder for the clifftops, sea thrift at its foot)
export function graniteBoulder(seed: number): Geo {
  const big = rock([280, 230, 190], 0.3, seed, "Eastcoast_Granite");
  return merge(big, coverTop(big, "Eastcoast_Lichen", { amount: 0.25, thick: 1.5, seed: seed + 1, patches: 0.5 }), translate(rock([120, 100, 90], 0.36, seed + 2, "Eastcoast_GranitePink"), [-150, 80, 0]));
}

// =================================== the kit ===================================

export const KIT: Kit = {
  id: "eastcoast",
  name: "ชายฝั่งตะวันออกและป่าเมเปิลทอง",
  region: "ระหว่างทรุนราดา คราเดีย และทะเลใน",
  desc: "ทุ่งหญ้าบนผาริมทะเลในกับหมู่บ้านชาวประมงบ้านเสาสูง ถนนคาราวานเก่ากับซากโรงเตี๊ยมและสะพานเก็บค่าผ่านทาง ป่าเมเปิลใบทองกับวงเห็ดภูต และแหลมแม่มดที่หมอกลงต่ำ",
  ground: "grass",
  sea: true,
  items: [
    { id: "stilt_house", name: "บ้านเสาสูงชาวประมง", make: stiltHouse, tags: ["building", "dock"] },
    { id: "seaweed_rack", name: "ราวตากสาหร่าย", make: seaweedRack, tags: ["decor"] },
    { id: "lighthouse", name: "ประภาคารเล็ก", make: lighthouse, tags: ["landmark", "light"] },
    { id: "fishing_jetty", name: "สะพานปลา (4 ม.)", make: fishingJetty, tags: ["dock"] },
    { id: "rowboat", name: "เรือพายชาวประมง", make: rowboat, tags: ["boat"] },
    { id: "sea_pinks", name: "ดอกไม้ทะเลสีชมพู", make: seaPinks, tags: ["plant", "ground"] },
    { id: "shore_rocks", name: "หินแกรนิตชายหาด", make: shoreRocks, tags: ["rock"] },
    { id: "sea_stack", name: "เกาะหินกลางทะเล", make: seaStack, tags: ["rock", "landmark"] },
    { id: "ruined_inn", name: "ซากโรงเตี๊ยมพักม้า", make: ruinedInn, tags: ["landmark", "building"] },
    { id: "milestone", name: "หลักไมล์", make: milestone, tags: ["decor"] },
    { id: "broken_wagon", name: "เกวียนพัง", make: brokenWagon, tags: ["decor"] },
    { id: "toll_bridge", name: "สะพานเก็บค่าผ่านทาง", make: tollBridge, tags: ["landmark", "bridge"] },
    { id: "cut_stone_pile", name: "กองหินตัด", make: cutStonePile, tags: ["decor"] },
    { id: "quarry_crane", name: "ปั้นจั่นเหมืองหิน", make: quarryCrane, tags: ["landmark"] },
    { id: "golden_maple", name: "ต้นเมเปิลทอง", make: goldenMaple, tags: ["tree", "plant"] },
    { id: "golden_bush", name: "พุ่มใบทอง", make: goldenBush, tags: ["plant"] },
    { id: "maple_litter", name: "ใบเมเปิลร่วง", make: mapleLitter, tags: ["ground"] },
    { id: "mushroom_ring", name: "วงเห็ดภูต", make: mushroomRing, tags: ["magic", "ground"] },
    { id: "fairy_stone", name: "หินภูต", make: fairyStone, tags: ["landmark", "magic"] },
    { id: "woodcutter_hut", name: "กระท่อมคนตัดไม้", make: woodcutterHut, tags: ["building"] },
    { id: "twisted_tree", name: "ต้นไม้บิดเบี้ยว", make: twistedTree, tags: ["tree", "plant"] },
    { id: "charm_tree", name: "ต้นไม้แขวนเครื่องราง", make: charmTree, tags: ["tree", "magic"] },
    { id: "witch_hut", name: "กระท่อมแม่มด", make: witchHut, tags: ["landmark", "building"] },
    { id: "cauldron", name: "หม้อต้มแม่มด", make: cauldron, tags: ["magic"] },
    { id: "sea_stone_circle", name: "วงหินริมทะเล", make: seaStoneCircle, tags: ["landmark", "magic"] },
    { id: "low_fog", name: "หมอกต่ำ", make: lowFog, tags: ["ground", "decor"] },
  ],
  sample: (put: Put) => {
    // the shore: stilt houses in the shallows, the jetty out between them, boats, rocks, a stack
    put("stilt_house", [-900, -2950, -14], 0);
    put("stilt_house", [1500, -3100, -14], 15, 0.9);
    for (let i = 0; i < 4; i++) put("fishing_jetty", [300, -2350 - i * 400, -14], 90);
    put("rowboat", [700, -3000, -12], 80);
    put("rowboat", [-200, -2700, -12], 110, 0.9);
    put("sea_stack", [-1700, -3900, -16], 20, 0.8);
    put("shore_rocks", [-1900, -2150, 0], 30);
    put("shore_rocks", [2000, -2200, 0], 160, 0.8);
    put("seaweed_rack", [-900, -1500, 0], 10);
    put("seaweed_rack", [-400, -1450, 0], -5);
    put("lighthouse", [1500, -1300, 0], 0);
    put("sea_pinks", [-1800, -1200, 0], 0);
    put("sea_pinks", [600, -1700, 0], 70, 0.8);
    put("sea_pinks", [2200, -600, 0], 140);
    // the road across the middle: the milestone, the wagon, the inn
    put("ruined_inn", [-200, 600, 0], 0);
    put("milestone", [-1500, -500, 0], 0);
    put("broken_wagon", [1100, -200, 0], 20);
    put("cut_stone_pile", [-1900, 500, 0], 30);
    // the maples behind: the fairy ring, the stone, the woodcutter
    put("golden_maple", [-1700, 1800, 0], 0);
    put("golden_maple", [1700, 1900, 0], 120, 0.9);
    put("golden_maple", [400, 2200, 0], 60, 0.85);
    put("golden_bush", [-800, 1500, 0], 0);
    put("golden_bush", [1000, 1300, 0], 90, 0.8);
    put("maple_litter", [-1200, 1300, 0], 0);
    put("maple_litter", [1300, 1600, 0], 40);
    put("mushroom_ring", [600, 1400, 0], 0, 0.8);
    put("fairy_stone", [-1900, 1050, 0], 0, 0.8);
    put("woodcutter_hut", [2000, 600, 0], 180, 0.8);
    // the witch's corner
    put("witch_hut", [-2000, -200, 0], 30, 0.7);
    put("cauldron", [-1500, -100, 0], 0);
    put("twisted_tree", [-2100, -1100, 0], 0);
    put("charm_tree", [-1100, 200, 0], 0, 0.9);
    put("low_fog", [-1700, -400, 0], 20);
    // and between: more maples and bushes, thrift on the turf, rocks, a log
    for (const [x, y, h, sc] of [[-400, 1900, 30, 1], [1000, 2000, 200, 0.8], [-2100, 2100, 90, 0.85], [2100, 1500, 300, 0.9]]) put("golden_maple", [x, y, 0], h, sc);
    for (const [x, y, sc] of [[-100, 1200, 0.7], [1600, 1100, 0.8], [-2100, 1500, 0.7], [200, -800, 0.6]]) put("golden_bush", [x, y, 0], x, sc);
    for (const [x, y, sc] of [[-600, -1900, 0.9], [-1300, -1700, 1], [900, -1300, 0.8], [2100, -1700, 1], [-2100, -1700, 0.8], [1900, -900, 0.7]]) put("sea_pinks", [x, y, 0], x, sc);
    put("common:sign_post", [-1100, -300, 0], -90);
    put("common:rock_small", [400, -900, 0], 30);
    put("flora:AutumnTree", [2200, 2200, 0], 0, 0.9);
    put("flora:AutumnTree", [-2300, 600, 0], 70, 0.8);
  },
};

// (fallen trunks for the fields: maple logs with moss)
export function mapleLog(seed: number, len = 520): Geo {
  return fallenTrunk({ seed, len, r: 30, bark: "Eastcoast_MapleBark", wood: endGrain("#caa070"), moss: "Eastcoast_Moss", stubs: 2, broken: seed % 2 === 0 });
}

// =================================== for the fields ===================================
// Shapes the east coast's fields draw with (centimetres, north +X, west +Y).
export type XY = [number, number];
export type Poly = XY[];
// a Catmull-Rom curve through the points, `per` steps a span
export function smooth(pts: XY[], per = 4): XY[] {
  const out: XY[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const c = (j: 0 | 1) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
      out.push([c(0), c(1)]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// a strip `w` wide along a polyline
export function band(pts: XY[], w: number): Poly {
  const left: XY[] = [], right: XY[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    left.push([pts[i][0] + (nx * w) / 2, pts[i][1] + (ny * w) / 2]);
    right.push([pts[i][0] - (nx * w) / 2, pts[i][1] - (ny * w) / 2]);
  }
  return [...left, ...right.reverse()];
}
// whether a point is inside a polygon
export function inPoly(poly: Poly, x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// the nearest point of a polyline: its segment, the point, how far away
export function nearestOn(pts: XY[], x: number, y: number): { i: number; q: XY; d: number; dir: XY } {
  let best = { i: 0, q: pts[0], d: Infinity, dir: [1, 0] as XY };
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2));
    const q: XY = [ax + dx * t, ay + dy * t], d = Math.hypot(q[0] - x, q[1] - y);
    if (d < best.d) best = { i, q, d, dir: [dx / Math.sqrt(L2), dy / Math.sqrt(L2)] };
  }
  return best;
}
export const distTo = (pts: XY[], x: number, y: number): number => nearestOn(pts, x, y).d;
// points every `step` along a polyline, with the way it runs there
export function every(pts: XY[], step: number, from = 0): { p: XY; d: XY }[] {
  const out: { p: XY; d: XY }[] = [];
  let carry = from;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
    if (L < 1) continue;
    const d: XY = [(bx - ax) / L, (by - ay) / L];
    for (let s2 = carry; s2 < L; s2 += step) out.push({ p: [ax + d[0] * s2, ay + d[1] * s2], d });
    carry = (((carry - L) % step) + step) % step;
  }
  return out;
}
// a wobbly ellipse
export function blob(c: XY, rx: number, ry: number, seed: number, n = 22, wob = 0.08): Poly {
  const out: Poly = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, k = 1 + wob * Math.sin(a * 3 + seed) + wob * 0.6 * Math.cos(a * 5 + seed * 2);
    out.push([c[0] + Math.cos(a) * rx * k, c[1] + Math.sin(a) * ry * k]);
  }
  return out;
}
// a line `d` in from a line with the land on its left (out on its right for d < 0)
export function inland(line: XY[], d: number): XY[] {
  return line.map((p, i): XY => {
    const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [p[0] - (dy / l) * d, p[1] + (dx / l) * d];
  });
}
// the heading that turns a piece's front (-X) toward the world direction (dx, dy)
export const faceDir = (dx: number, dy: number): number => (Math.atan2(-dy, -dx) * 180) / Math.PI;
export const faceTo = (from: XY, to: XY): number => faceDir(to[0] - from[0], to[1] - from[1]);
// a polyline's length, and the point `d` along it with its direction
export const lengthOf = (pts: XY[]): number => pts.slice(1).reduce((t, p, i) => t + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
export function along(pts: XY[], d: number): { p: XY; dir: XY } {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
    if (d <= L || i + 2 === pts.length) {
      const t = Math.min(1, d / (L || 1));
      return { p: [ax + (bx - ax) * t, ay + (by - ay) * t], dir: [(bx - ax) / (L || 1), (by - ay) / (L || 1)] };
    }
    d -= L;
  }
  return { p: pts[0], dir: [1, 0] };
}
// A plateau's outline with its sharp corners cut (a turn over `maxTurn` degrees becomes two
// gentler ones), so the rock faces of its two edges meet without a gap.
export function bevel(poly: Poly, maxTurn = 35, cut = 260): Poly {
  const out: Poly = [], n = poly.length;
  for (let i = 0; i < n; i++) {
    const p = poly[(i + n - 1) % n], c = poly[i], q = poly[(i + 1) % n];
    const ax = c[0] - p[0], ay = c[1] - p[1], bx = q[0] - c[0], by = q[1] - c[1], la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    const turn = (Math.acos(Math.max(-1, Math.min(1, (ax * bx + ay * by) / (la * lb)))) * 180) / Math.PI;
    if (turn <= maxTurn) {
      out.push(c);
      continue;
    }
    const d = Math.min(cut, la * 0.3, lb * 0.3);
    out.push([c[0] - (ax / la) * d, c[1] - (ay / la) * d], [c[0] + (bx / lb) * d, c[1] + (by / lb) * d]);
  }
  return out;
}
// A flat sheet (the sea) filling a polygon at height z (world cm, Z up), in three.js space.
export function seaSheet(poly: Poly, z = -14, mat = "WaterSea"): THREE.Mesh {
  const shape = new THREE.Shape();
  poly.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape).applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1)), material(mat));
  m.position.y = z;
  m.receiveShadow = true;
  return m;
}

// the materials the fields paint the cliffs with
export const COAST = { cliff: "Eastcoast_CliffGranite", cliffDark: "Eastcoast_CliffDark" };
