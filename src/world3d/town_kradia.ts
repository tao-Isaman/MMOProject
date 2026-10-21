// คราเดีย (Kradia), the fortress city of magic on the eastern frontier, laid out from the
// player's own plan (a hand-drawn map: a square town inside a fortress wall with a gate in each
// side; the roads from the gates meet a wide ring road round the middle; the mage tower stands
// alone on a rune plaza in the very centre with four blocks of houses round it like the blades of
// a pinwheel; an outer ring of houses lines the ring road with lanes behind them along the
// walls). The east wall faces the demon lands: an artillery yard and a training yard sit in its
// corners, a ballista watches from every gatehouse and barricades bar the way out east.
//
// The plan is read in its own pixels (u right, v down, as drawn) and turned into the world:
// north (up the page) is +X, east (right) is -Y, so the starting camera sees it as drawn. One
// plan pixel is 28 cm, which makes the walled town about 153 x 138 m before TOWN_SCALE.
//
// The fortress pieces show their TOWN side to -X, so every wall, tower and gate is turned to
// face into the town; the ballistae and catapults aim at -X, so they are turned to face out.

import { defineMaterial } from "./textures";
import { buildPaved } from "./paved";
import type { Poly } from "./paved";
import { KIT } from "./kits/kradia";
import { Plan, TownBuilder, useKits, colourways, FACE, travelGuide, protoOf } from "./town";
import type { Side, Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";

useKits(KIT);

// Colourways: the same stone houses under plum or dusk-blue slate, in warm or pale stone.
defineMaterial("KradiaTown_RoofPlum", { map: "shingles", tint: "#6e5a8c", bump: 2.5 });
defineMaterial("KradiaTown_RoofDusk", { map: "shingles", tint: "#4a5468", bump: 2.5 });
defineMaterial("KradiaTown_StoneWarm", { map: "stone", tint: "#cbbfab", bump: 2 });
defineMaterial("KradiaTown_StonePale", { map: "stone", tint: "#d9d6cf", bump: 2 });
defineMaterial("KradiaTown_StoneSlate", { map: "stone", tint: "#5e6678", bump: 2 });
colourways({
  kradia_plum: { RoofSlate: "KradiaTown_RoofPlum" },
  kradia_warm: { StoneGrey: "KradiaTown_StoneWarm", RoofSlate: "KradiaTown_RoofDusk" },
  kradia_pale: { StoneGrey: "KradiaTown_StonePale", StoneBlueDark: "KradiaTown_StoneSlate", RoofSlate: "KradiaTown_RoofPlum" },
});

// ---- the plan's pixels -> the world: 28 cm a pixel, the mage tower at the origin ----
const S = 28;
const { P, rect } = new Plan(S, 395, 410);
type XY = [number, number];
type Box = [number, number, number, number]; // u0, v0, u1, v1

// the wall lines, and where each gate stands along its wall
const WALL = { n: 163, s: 655, w: 145, e: 692 };
const GATE = { n: 370, s: 422, w: 418, e: 420 };
// the ring road's outer edge, where the outer houses have their fronts (the west side steps out
// south of the west road, where the houses stand two deep)
const RING = { n: 245, s: 562, w: 212, sw: 230, e: 578, step: 446 };
// the four blocks round the tower, each sharing one side with the plaza
const BLOCK: Record<"nw" | "ne" | "se" | "sw", Box> = {
  nw: [250, 290, 337, 382],
  ne: [420, 288, 502, 352],
  se: [453, 438, 530, 506],
  sw: [288, 468, 378, 530],
};
// the rune plaza: 8 x 8 tiles of 4 m round the tower
const TOWER: XY = [395, 410];
const HALF = 1600 / S;

export function buildKradia(quality: { flowers: number }): Town {
  const town = new TownBuilder(7);
  const { put, rnd } = town;
  const T = P(TOWER[0], TOWER[1]);
  // a heading that turns a piece's front (-X) toward world direction (dx, dy)
  const aim = (dx: number, dy: number) => (Math.atan2(-dy, -dx) * 180) / Math.PI;
  const post = (r = 22): SolidSpec[] => [{ kind: "post", x: 0, y: 0, r }];
  const lamp = (u: number, v: number) => put("kradia:arcane_lamp", P(u, v), 0, { solid: post() });
  const tree = (u: number, v: number, kind = rnd() < 0.6 ? "AutumnTree" : "Pine", s = 0.7 + rnd() * 0.15) => put(`flora:${kind}`, P(u, v), rnd() * 360, { s });

  // ---- ground: rock, cobbled roads, the rune plaza ----
  // the ring: everything between the house fronts and the blocks is paved, cut into cells
  const inBox = (u: number, v: number, [u0, v0, u1, v1]: Box) => u > u0 && u < u1 && v > v0 && v < v1;
  const blocks = Object.values(BLOCK);
  const us = [...new Set([RING.w, RING.sw, RING.e, ...blocks.flatMap((b) => [b[0], b[2]])])].sort((a, b) => a - b);
  const vs = [...new Set([RING.n, RING.s, RING.step, ...blocks.flatMap((b) => [b[1], b[3]])])].sort((a, b) => a - b);
  const roads: Poly[] = [];
  for (let i = 0; i + 1 < us.length; i++)
    for (let j = 0; j + 1 < vs.length; j++) {
      const cu = (us[i] + us[i + 1]) / 2, cv = (vs[j] + vs[j + 1]) / 2;
      if (cu < (cv < RING.step ? RING.w : RING.sw) || blocks.some((b) => inBox(cu, cv, b))) continue;
      roads.push(rect(us[i], vs[j], us[i + 1], vs[j + 1]));
    }
  // the four roads from the gates (on out past them a little) to the ring
  roads.push(
    rect(340, 60, 400, RING.n + 2),
    rect(395, RING.s - 2, 450, 760),
    rect(40, 390, RING.w + 2, 446),
    rect(RING.e - 2, 392, 790, 448),
  );
  const PLAZA = rect(TOWER[0] - HALF, TOWER[1] - HALF, TOWER[0] + HALF, TOWER[1] + HALF);
  const ground = buildPaved({
    area: { x0: -16500, x1: 17000, y0: -18000, y1: 16500 },
    roads,
    plazas: [PLAZA],
    base: "rock",
    road: [0.70, 0.69, 0.73],
    plaza: [0.84, 0.80, 0.93],
  });

  // ---- the fortress wall: 7 m pieces between round towers, a gate in each side ----
  const NORTH = P(0, WALL.n)[0], SOUTH = P(0, WALL.s)[0], WEST = P(WALL.w, 0)[1], EAST = P(WALL.e, 0)[1];
  const GN: XY = [NORTH, P(GATE.n, 0)[1]], GS: XY = [SOUTH, P(GATE.s, 0)[1]];
  const GW: XY = [P(0, GATE.w)[0], WEST], GE: XY = [P(0, GATE.e)[0], EAST];
  // a straight run of wall from a to b (world), its town side facing `inward`, a gate gap at `gap`
  const run = (a: XY, b: XY, inward: Side, gap: number) => town.wall(a, b, inward, "kradia:fortress_wall", { gaps: [gap], len: 700, gap: 1520 });
  run([NORTH, WEST], [NORTH, EAST], "s", WEST - GN[1]);
  run([SOUTH, WEST], [SOUTH, EAST], "n", WEST - GS[1]);
  run([NORTH, WEST], [SOUTH, WEST], "e", NORTH - GW[0]);
  run([NORTH, EAST], [SOUTH, EAST], "w", NORTH - GE[0]);
  // round towers on the corners and halfway between each corner and its gates, doors to the town
  const tower = (x: number, y: number) => put("kradia:wall_tower", [x, y], aim(T[0] - x, T[1] - y), { solid: [{ kind: "tower", x: 0, y: 0, r: 390 }] });
  for (const x of [NORTH, SOUTH]) for (const y of [WEST, EAST]) tower(x, y);
  for (const [g, x] of [[GN, NORTH], [GS, SOUTH]] as [XY, number][]) {
    tower(x, (WEST + g[1] + 790) / 2);
    tower(x, (EAST + g[1] - 790) / 2);
  }
  for (const [g, y] of [[GW, WEST], [GE, EAST]] as [XY, number][]) {
    tower((NORTH + g[0] + 790) / 2, y);
    tower((SOUTH + g[0] - 790) / 2, y);
  }
  // gates: square towers either side of an open passage along the gate's own X, a ballista on
  // each gatehouse roof aiming out
  const gateSolid: SolidSpec[] = [
    { kind: "gate", x: 0, y: -475, w: 620, d: 610, rot: 0 },
    { kind: "gate", x: 0, y: 475, w: 620, d: 610, rot: 0 },
  ];
  for (const [g, side] of [[GN, "s"], [GS, "n"], [GW, "e"], [GE, "w"]] as [XY, Side][]) {
    put("kradia:fortress_gate", g, FACE[side], { solid: gateSolid });
    const a = (FACE[side] * Math.PI) / 180;
    put("kradia:ballista", [g[0] - Math.cos(a) * 20, g[1] - Math.sin(a) * 20], FACE[side] + 180, { z: 936, solid: "none" });
  }

  // ---- the outer ring of houses: terraces wall to wall along the ring road, two deep in the
  // south and east, where the back row faces the lane along the wall ----
  const TINTS = ["", "kradia_plum", "kradia_warm", "", "kradia_pale", "kradia_plum"];
  const HOUSE = ["stone_house"];
  const terrace = (a: XY, b: XY, side: Side, pieces = HOUSE) =>
    town.terrace(P(a[0], a[1]), P(b[0], b[1]), side, pieces, { kit: "kradia", tints: TINTS, narrow: "stone_house", gap: 30 });
  terrace([174, RING.n], [336, RING.n], "s");
  terrace([408, RING.n], [572, RING.n], "s");
  terrace([RING.w, 250], [RING.w, 388], "e");
  terrace([RING.sw, 452], [RING.sw, 561], "e", ["barracks", "stone_house", "stone_house"]);
  terrace([168, 470], [168, 560], "w");
  terrace([234, RING.s], [394, RING.s], "n");
  terrace([452, RING.s], [574, RING.s], "n");
  terrace([244, 624], [392, 624], "s");
  terrace([462, 624], [574, 624], "s");
  terrace([RING.e, 250], [RING.e, 388], "w", ["stone_house", "stone_house", "stone_house", "barracks"]);
  terrace([640, 300], [640, 388], "e");
  terrace([RING.e, 452], [RING.e, 560], "w", ["smithy", "stone_house", "stone_house"]);
  terrace([640, 452], [640, 548], "e");

  // ---- the four inner blocks: two rows of two houses back to back, fronts to the streets ----
  // a piece with its footprint centred on plan (u, v), its front to `side`
  const centred = (ref: string, u: number, v: number, side: Side, colours?: string) => {
    const f = protoOf(ref, colours).foot, h = FACE[side], a = (h * Math.PI) / 180;
    const cx = (f.x0 + f.x1) / 2, cy = (f.y0 + f.y1) / 2, [x, y] = P(u, v);
    put(ref, [x - (cx * Math.cos(a) - cy * Math.sin(a)), y - (cx * Math.sin(a) + cy * Math.cos(a))], h, { colours });
  };
  const deep = (protoOf("kradia:stone_house").foot.x1 - protoOf("kradia:stone_house").foot.x0) / S;
  for (const [u0, v0, u1, v1] of blocks)
    for (const k of [0.25, 0.75]) {
      const u = u0 + (u1 - u0) * k;
      centred("kradia:stone_house", u, v0 + deep / 2, "n", TINTS[Math.floor(rnd() * TINTS.length)] || undefined);
      centred("kradia:stone_house", u, v1 - deep / 2, "s", TINTS[Math.floor(rnd() * TINTS.length)] || undefined);
    }
  // the yard in the middle of the north-west block
  tree(294, 336, "Pine", 0.8);
  put("kradia:supplies", P(262, 336), 20);
  put("kradia:supplies", P(326, 338), -40);

  // ---- the rune plaza and the mage tower ----
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 8; j++) put("kradia:rune_plaza_tile", [T[0] + (i - 3.5) * 400, T[1] + (j - 3.5) * 400], 0, { solid: "none" });
  put("kradia:mage_tower", T, FACE.s, { s: 1.15, solid: [{ kind: "tower", x: 0, y: 0, r: 640 }] });
  // ward stones on the diagonals, lamps round the edge, banners and braziers before the door
  for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) put("kradia:crystal_obelisk", [T[0] + sx * 1050, T[1] + sy * 1050], 45);
  for (const [dx, dy] of [[1480, 1480], [1480, -1480], [-1480, 1480], [-1480, -1480], [0, 1480], [0, -1480], [1480, 0], [-1480, 0]])
    put("kradia:arcane_lamp", [T[0] + dx, T[1] + dy], 0, { solid: post() });
  for (const sy of [-1, 1]) {
    put("kradia:banner_pole", [T[0] - 900, T[1] + sy * 420], FACE.s);
    put("kradia:banner_pole", [T[0] + 900, T[1] + sy * 420], FACE.n);
    put("kradia:brazier", [T[0] - 900, T[1] + sy * 860], 0);
  }
  // benches round the plaza facing the tower
  put("common:bench", [T[0] + 1250, T[1] + 650], FACE.s);
  for (const sx of [-1, 1]) put("common:bench", [T[0] + sx * 600, T[1] + 1250], FACE.e);
  put("common:bench", [T[0] + 600, T[1] - 1250], FACE.w);
  // a rune circle in each street from the plaza to the ring
  for (const [u, v] of [[378, 302], [416, 516], [300, 425], [515, 395]]) put("kradia:rune_circle", P(u, v), 0, { solid: [{ kind: "dais", x: 0, y: 0, r: 420 }] });

  // ---- the shop's stalls by the plaza, the crystal market up the east side of the ring ----
  for (const u of [424, 456]) put("kradia:crystal_stall", P(u, 361), FACE.s);
  for (const v of [266, 285, 304, 323]) {
    put("kradia:crystal_stall", P(523, v), FACE.e);
    put("kradia:crystal_stall", P(557, v), FACE.w);
  }
  for (const v of [276, 314]) lamp(540, v);
  put("common:market_cart", P(540, 334), FACE.n);

  // ---- along the streets: lamps before the houses, lamps and banners along the blocks ----
  // a row of pieces from a to b (plan) every `step` pixels, skipping where `skip` says
  const row = (a: XY, b: XY, step: number, make: (u: number, v: number, i: number) => void, skip: (u: number, v: number) => boolean = () => false) => {
    const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let i = 0; i <= n; i++) {
      const u = a[0] + ((b[0] - a[0]) * i) / n, v = a[1] + ((b[1] - a[1]) * i) / n;
      if (!skip(u, v)) make(u, v, i);
    }
  };
  // keep clear of the townsfolk and the stalls
  const CLEAR: XY[] = [[241, 252], [440, 362], [476, 360], [283, 390], [326, 390], [294, 460], [330, 460], [460, 430], [488, 430], [568, 506]];
  const clear = (u: number, v: number) => CLEAR.some(([cu, cv]) => Math.hypot(cu - u, cv - v) < 14) || (u > 512 && u < 568 && v > 256 && v < 340);
  const lamps = (u: number, v: number) => lamp(u, v);
  const lampBanner = (u: number, v: number, i: number) =>
    i % 2 ? put("kradia:banner_pole", P(u, v), 0) : lamp(u, v);
  // the house side of the ring road
  row([222, 252], [326, 252], 35, lamps, clear);
  row([418, 252], [566, 252], 46, lamps, clear);
  row([219, 262], [219, 380], 40, lamps, clear);
  row([237, 462], [237, 552], 45, lamps, clear);
  row([248, 555], [388, 555], 46, lamps, clear);
  row([462, 555], [566, 555], 52, lamps, clear);
  row([571, 352], [571, 380], 30, lamps, clear);
  row([571, 462], [571, 552], 45, lamps, clear);
  // the block side of the ring road: lamps and banner poles in turn
  row([256, 283], [330, 283], 18.5, lampBanner, clear);
  row([428, 281], [496, 281], 17, lampBanner, clear);
  row([244, 298], [244, 374], 19, lampBanner, clear);
  row([282, 476], [282, 524], 16, lampBanner, clear);
  row([296, 537], [372, 537], 19, lampBanner, clear);
  row([460, 513], [524, 513], 16, lampBanner, clear);
  row([508, 296], [508, 346], 16.7, lampBanner, clear);
  row([536, 446], [536, 500], 18, lampBanner, clear);
  // the streets between the blocks: autumn trees and lamps
  const treeLamp = (u: number, v: number, i: number) => (i % 2 ? lamp(u, v) : tree(u, v, "AutumnTree", 0.65 + rnd() * 0.1));
  row([344, 296], [344, 346], 25, treeLamp, clear);
  row([413, 294], [413, 344], 25, treeLamp, clear);
  row([385, 476], [385, 552], 25, treeLamp, clear);
  row([446, 476], [446, 552], 25, treeLamp, clear);
  row([256, 389], [330, 389], 24, treeLamp, clear);
  row([296, 461], [330, 461], 34, treeLamp, clear);
  lamp(498, 358);
  row([510, 431], [526, 431], 16, treeLamp, clear);

  // ---- the gates: braziers either side inside, banners ----
  for (const [u, v] of [[345, 183], [395, 183], [400, 638], [445, 638], [163, 395], [163, 441], [674, 397], [674, 443]]) put("kradia:brazier", P(u, v), 0);
  for (const [u, v, f] of [[333, 178, "s"], [407, 178, "s"], [389, 646, "n"], [456, 646, "n"], [158, 384, "e"], [158, 452, "e"], [679, 386, "w"], [679, 454, "w"]] as [number, number, Side][])
    put("kradia:banner_pole", P(u, v), FACE[f]);
  // the roads in from the gates: lamps either side, weapon racks by the guards
  for (const v of [212, 238]) for (const u of [345, 395]) lamp(u, v);
  for (const v of [600]) for (const u of [400, 445]) lamp(u, v);
  for (const u of [192]) for (const v of [395, 441]) lamp(u, v);
  for (const u of [628, 652]) for (const v of [397, 443]) lamp(u, v);
  put("kradia:weapon_rack", P(333, 200), FACE.e);
  put("kradia:weapon_rack", P(407, 200), FACE.w);
  put("kradia:weapon_rack", P(662, 384), FACE.s);
  put("kradia:supplies", P(178, 382), 15);
  put("kradia:supplies", P(406, 606), -20);
  // carts and crates by the gates, as if a convoy had just come in
  put("common:market_cart", P(330, 228), FACE.s);
  put("common:market_cart", P(186, 456), FACE.w);
  put("common:market_cart", P(458, 612), FACE.n);
  for (const [u, v] of [[326, 214], [404, 225], [181, 465], [190, 382], [455, 600], [632, 452]]) put("common:crate", P(u, v), rnd() * 90);
  // outside the east gate, facing the demon lands: rows of spiked barricades
  for (const [u, v] of [[712, 380], [712, 460], [730, 372], [730, 468], [748, 380], [748, 460], [770, 390], [770, 450]]) put("kradia:barricade", P(u, v), FACE.e);

  // ---- the artillery yard (north-east corner): catapults and ballistae aimed east ----
  for (const [u, v] of [[650, 196], [650, 232], [650, 268]]) put("kradia:catapult", P(u, v), FACE.e);
  for (const [u, v] of [[622, 214], [622, 252]]) put("kradia:ballista", P(u, v), FACE.e);
  for (const [u, v] of [[604, 186], [676, 292], [610, 290]]) put("kradia:supplies", P(u, v), rnd() * 90);
  for (const [u, v] of [[628, 180], [674, 180]]) put("kradia:brazier", P(u, v), 0);
  put("kradia:weapon_rack", P(600, 230), FACE.e);
  put("kradia:weapon_rack", P(598, 208), FACE.e);
  for (const [u, v] of [[676, 214], [676, 250], [618, 186]]) put("common:crate", P(u, v), rnd() * 90);
  for (const v of [205, 280]) put("kradia:banner_pole", P(612, v), FACE.e);
  // spare barricades stacked by the wall, ready to go out
  for (const v of [304, 318]) put("kradia:barricade", P(676, v), FACE.s);

  // ---- the training yard (south-east corner): dummies, weapon racks ----
  for (const u of [612, 634, 656]) for (const v of [584, 606]) put("kradia:training_dummy", P(u, v), FACE.w);
  for (const v of [578, 600, 622]) put("kradia:weapon_rack", P(678, v), FACE.w);
  put("kradia:supplies", P(596, 636), 30);
  put("kradia:brazier", P(596, 572), 0);
  put("kradia:brazier", P(670, 640), 0);

  // ---- the lanes along the walls: rows of pines and autumn trees, braziers now and then ----
  const FIRES: XY[] = [[200, 182], [290, 182], [470, 182], [560, 182], [160, 300], [160, 520], [300, 640], [520, 640], [680, 340], [680, 500]];
  for (const [u, v] of FIRES) put("kradia:brazier", P(u, v), 0);
  const lane = (a: XY, b: XY, step: number) => row(a, b, step, (u, v) => tree(u, v, rnd() < 0.5 ? "Pine" : "AutumnTree", 0.6 + rnd() * 0.2), (u, v) =>
    FIRES.some(([bu, bv]) => Math.hypot(bu - u, bv - v) < 16));
  lane([184, 196], [322, 196], 34);
  lane([420, 196], [566, 196], 34);
  lane([166, 262], [166, 372], 36);
  lane([662, 470], [662, 540], 35);
  lane([664, 316], [664, 372], 28);
  town.greens(ground, { x0: SOUTH, x1: NORTH, y0: EAST, y1: WEST }, { trees: ["AutumnTree", "Pine", "PineSmall", "AutumnTree"], other: "common:rock_small", chance: 0.7, step: 560 });

  // ---- outside the walls: pine and autumn woods on the rock ----
  town.woods({ x0: -12500, x1: 13000, y0: -14000, y1: 12500 }, ["Pine", "PineSmall", "AutumnTree", "Pine"], (x, y) => {
    const inside = x > SOUTH - 1300 && x < NORTH + 1300 && y > EAST - 1300 && y < WEST + 1300;
    const road = (Math.abs(y - GN[1]) < 1100 && x > NORTH) || (Math.abs(y - GS[1]) < 1100 && x < SOUTH) || (Math.abs(x - GW[0]) < 1100 && y > WEST) || (Math.abs(x - GE[0]) < 1100 && y < EAST);
    return inside || road;
  }, { count: 230, spacing: 480 });

  // ---- build ----
  const pt = (u: number, v: number) => ({ x: P(u, v)[0], y: P(u, v)[1] });
  // a bar across the far end of each gate's passage (none of them leads anywhere yet)
  const OUT = 420;
  return town.finish({
    ground,
    sky: "#77726a",
    // a few hardy flowers on the open ground inside the walls
    flowers: {
      box: { x: SOUTH, y: EAST, w: NORTH - SOUTH, h: WEST - EAST },
      open: (x, y) => ground.kind(x, y) === 0 && x < NORTH - 500 && x > SOUTH + 500 && y < WEST - 500 && y > EAST + 500,
      density: 0.12 * quality.flowers,
    },
    late: [
      { kind: "closed", x: GN[0] + OUT, y: GN[1], w: 200, d: 520, rot: 0 },
      { kind: "closed", x: GS[0] - OUT, y: GS[1], w: 200, d: 520, rot: 0 },
      { kind: "closed", x: GW[0], y: GW[1] + OUT, w: 520, d: 200, rot: 0 },
      { kind: "closed", x: GE[0], y: GE[1] - OUT, w: 520, d: 200, rot: 0 },
    ],
    bounds: { minX: SOUTH - 700, maxX: NORTH + 700, minY: EAST - 700, maxY: WEST + 700 },
    spawn: pt(446, 436),
    npcs: kradiaNpcs(),
    warps: [],
    closed: [
      { x: GN[0] + 250, y: GN[1], r: 260, text: "ประตูเหนือยังไม่เปิด ทางไปทุ่งสเตปป์ทรุนราดากำลังสำรวจ" },
      { x: GS[0] - 250, y: GS[1], r: 260, text: "ประตูใต้ยังไม่เปิด ทางลงชายแดนใต้กำลังสำรวจ" },
      { x: GW[0], y: GW[1] + 250, r: 260, text: "ประตูตะวันตกยังไม่เปิด ทางกลับอีเดนกำลังสำรวจ" },
      { x: GE[0], y: GE[1] - 250, r: 260, text: "ประตูตะวันออกปิดตาย เบื้องหลังคือดินแดนอสูร ห้ามผ่านเด็ดขาด" },
    ],
    // names on the map window
    labels: [
      { ...pt(395, 453), text: "หอคอยจอมเวท" },
      { ...pt(348, 362), text: "ลานรูน", kind: "small" },
      { ...pt(540, 295), text: "ตลาดผลึก" },
      { ...pt(564, 357), text: "ค่ายทหาร", kind: "small" },
      { ...pt(244, 474), text: "ค่ายทหาร", kind: "small" },
      { ...pt(564, 468), text: "โรงตีเหล็ก", kind: "small" },
      { ...pt(640, 240), text: "ลานเครื่องยิงหิน", kind: "small" },
      { ...pt(634, 595), text: "ลานฝึกทหาร", kind: "small" },
      { ...pt(300, 268), text: "ถนนวงแหวน", kind: "small" },
      { x: GN[0] + 100, y: GN[1], text: "ประตูเหนือ (ปิด)", kind: "gate" },
      { x: GS[0] - 100, y: GS[1], text: "ประตูใต้ (ปิด)", kind: "gate" },
      { x: GW[0], y: GW[1] + 100, text: "ประตูตะวันตก (ปิด)", kind: "gate" },
      { x: GE[0], y: GE[1] - 100, text: "ประตูตะวันออก (ปิด)", kind: "gate" },
    ],
  });
}

// ---- townsfolk, where the plan put its red dots ----
function kradiaNpcs(): NpcSpec[] {
  const at = (u: number, v: number) => {
    const [x, y] = P(u, v);
    return { x, y };
  };
  // the heading (world degrees, 0 = +X) from plan point a toward plan point b
  const look = (a: XY, b: XY) => {
    const [ax, ay] = P(a[0], a[1]), [bx, by] = P(b[0], b[1]);
    return (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
  };
  const guard = (top: string, hairColor = "ink") => ({ gender: "male", hair: "", hairColor, eyes: "blue", top, bottom: "bottom_warrior_black" });
  return [
    { id: "kradia_guard_n", ...at(390, 194), face: 180, name: "ทหารยามดราแกน", title: "ทหารยามประตูเหนือ", role: "talk", look: guard("top_warrior_navy"),
      lines: ["ประตูเหนือยังไม่เปิด ทางไปทุ่งสเตปป์ทรุนราดากำลังสำรวจ", "ชาวเผ่าทรุนราดาขี่ม้าเก่งมาก บางทีก็ลงมาแลกขนสัตว์กับผลึกที่นี่"] },
    { id: "kradia_guard_e", ...at(664, 402), face: 90, name: "ทหารยามคาสปาร์", title: "ทหารยามประตูตะวันออก", role: "talk", look: guard("top_warrior_navy", "auburn"),
      lines: ["ประตูตะวันออกปิดตาย หลังกำแพงนี้คือดินแดนอสูร", "เมื่อคืนเห็นแสงสีแดงวูบวาบอยู่ไกลๆ ทางตะวันออกอีกแล้ว", "ถ้าได้ยินระฆังจากหอคอยจอมเวท ให้รีบหลบเข้าบ้านทันที"] },
    { id: "kradia_guard_w", ...at(176, 434), face: -90, name: "ทหารยามวิคเตอร์", title: "ทหารยามประตูตะวันตก", role: "talk", look: guard("top_warrior"),
      lines: ["ประตูตะวันตกยังไม่เปิด ทางกลับอีเดนกำลังสำรวจอยู่", "อยากไปอีเดนเร็วๆ ก็ไปหาผู้นำทางที่ลานรูนกลางเมืองสิ"] },
    { id: "kradia_guard_s", ...at(408, 628), face: 0, name: "ทหารยามบอริส", title: "ทหารยามประตูใต้", role: "talk", look: guard("top_warrior", "silver"),
      lines: ["ประตูใต้ยังไม่เปิด ทางลงชายแดนใต้กำลังสำรวจ", "ได้ยินว่าลงใต้ไปจนสุดฝั่ง มีเรือข้ามไปเกาะโอซากิได้"] },
    travelGuide("kradia", P(460, 430), look([460, 430], [446, 436])),
    { id: "kradia_healer", ...at(488, 430), face: look([488, 430], [446, 436]), name: "ซิสเตอร์เซเลสต์", title: "นักบวช · รักษาฟรี", role: "heal",
      look: { gender: "female", hair: "twintail", hairColor: "silver", eyes: "violet", top: "top_priestess_wine", bottom: "bottom_priestess_white" },
      lines: ["แสงแห่งผลึกจงรักษาท่าน", "หายดีแล้ว อย่าเข้าใกล้กำแพงตะวันออกนักล่ะ"] },
    { id: "kradia_shop", ...at(440, 362), face: 180, name: "มาดามอีโวนา", title: "ร้านเครื่องมือ", role: "shop", sprite: "merchant",
      lines: ["ยา ผลึกเวท คัมภีร์ มีครบ เข้ามาดูก่อนได้", "ผลึกสีม่วงพวกนี้ขุดมาจากหน้าผาชายแดน ส่องสว่างได้ทั้งคืน"] },
    { id: "kradia_apprentice", ...at(476, 360), face: look([476, 360], TOWER), name: "ลีเรีย", title: "ศิษย์หอคอยจอมเวท", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "violet", eyes: "violet", top: "top_lilac", bottom: "bottom_navy" },
      lines: ["หอคอยจอมเวทกลางเมืองคือหัวใจของคราเดีย ท่านอาร์คเมจเฝ้าม่านเวทอยู่บนยอดทุกคืน", "ผลึกบนยอดหอคอยส่งพลังไปยังเสาผลึกรอบลาน ค้ำม่านเวทไว้ทั้งเมือง", "สักวันฉันจะสอบเป็นจอมเวทให้ได้!"] },
    { id: "kradia_knight", ...at(283, 390), face: look([283, 390], TOWER), name: "เซอร์ไรน์ฮาร์ท", title: "อัศวินแห่งป้อมคราเดีย", role: "talk", look: guard("top_warrior_navy", "silver"),
      lines: ["คราเดียไม่เคยแตกมาสามร้อยปี ด้วยกำแพงหินกับเวทมนตร์", "อสูรกลัวแสงผลึก เราจึงจุดโคมผลึกไว้ทุกถนนทั้งคืน"] },
    { id: "kradia_scout", ...at(326, 390), face: look([326, 390], TOWER), name: "นาเดีย", title: "หน่วยสอดแนมชายแดน", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "crimson", eyes: "amber", top: "top_adventurer_plum", bottom: "bottom_adventurer_black" },
      lines: ["ข้ามกำแพงตะวันออกไปมีแต่หินดำกับหมอกแดง นั่นแหละดินแดนอสูร", "ทางเหนือเป็นทุ่งสเตปป์ของชาวทรุนราดา ข้ามทะเลในไปทางตะวันตกคืออีเดน เมืองหลวง", "เกาะโอซากิอยู่ไกลออกไปทางใต้ ต้องนั่งเรือเท่านั้น"] },
    { id: "kradia_miner", ...at(294, 460), face: 0, name: "ทอร์วัลด์", title: "คนขุดผลึก", role: "talk",
      look: { gender: "male", hair: "", hairColor: "auburn", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: ["ผลึกพวกนี้ขุดจากหน้าผาชายแดน เรืองแสงได้เองทั้งคืนเลยนะ", "เวลาอสูรเข้าใกล้ ผลึกจะกะพริบเตือน คนที่นี่ถึงรักมันยิ่งกว่าทองคำ"] },
    { id: "kradia_runner", ...at(330, 460), face: look([330, 460], TOWER), name: "มิชา", title: "เด็กส่งสาร", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "amber", eyes: "teal", top: "top_sky", bottom: "bottom_cocoa" },
      lines: ["ลานฝึกทหารอยู่มุมตะวันออกเฉียงใต้ ลานเครื่องยิงหินอยู่มุมตะวันออกเฉียงเหนือ", "ตลาดผลึกอยู่ถนนวงแหวนฝั่งตะวันออก ของสวยๆ เยอะเลย"] },
    { id: "kradia_witch", ...at(241, 254), face: 180, name: "ยายกริเซลดา", title: "แม่มดเฒ่า", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "silver", eyes: "violet", top: "top_priestess_black", bottom: "bottom_priestess_black" },
      lines: ["ข้าเฝ้ากำแพงเมืองนี้มาตั้งแต่ยังสาว เห็นอสูรบุกมาแล้วสามครั้ง", "ธงสีม่วงคือสีของสภาจอมเวท สีทองคือคำสัตย์ที่จะปกป้องแผ่นดิน"] },
    { id: "kradia_smith", ...at(568, 506), face: 90, name: "ฮันส์", title: "ช่างตีเหล็ก", role: "talk",
      look: { gender: "male", hair: "", hairColor: "ink", eyes: "amber", top: "top_warrior", bottom: "bottom_warrior_cocoa" },
      lines: ["โรงตีเหล็กข้างหลังนี้ตีดาบให้ทหารทั้งป้อม", "ดาบที่ชุบน้ำผลึกฟันอสูรเข้า ดาบธรรมดาน่ะทำได้แค่ข่วน"] },
  ];
}
