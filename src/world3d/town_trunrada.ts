// ทรุนราดา (Trunrada), the clan town of the cold north-eastern steppe, laid out from the player's
// own plan and set square on a grid: a square palisade with three gates (west, east and north);
// the broad main road straight from the west gate to the east gate; the north road straight down
// from the north gate to the main road, where the chief's great yurt and the clan's long hall
// face each other across it halfway down; the lane up on the left to the north back street, and
// the two lanes going down to the south back street; houses in rows along all of them, the same
// distance back from the street; the yurts in tidy rows inside the blocks and along the back
// streets; and the gathering ground in the north-east, a rectangle of trampled earth where the
// ancient standing stones ring their altar and the windmill turns on its mound.
//
// The plan is read in its own pixels (u right, v down, as drawn): north (up the page) is +X,
// east (right) is -Y. One plan pixel is 27 cm, so the walled town is about 158 x 150 m before
// TOWN_SCALE.

import { KIT } from "./kits/trunrada";
import { buildPaved } from "./paved";
import type { Poly } from "./paved";
import { defineMaterial } from "./textures";
import { Plan, TownBuilder, useKits, colourways, facing, FACE, travelGuide, protoOf, gateWay, waysOut } from "./town";
import type { Placement, Side, Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";

useKits(KIT);

// Colourways: the same yurts with red, green or gold bands on cream, grey or tan felt; the same
// stone houses under turf instead of thatch, with red, yellow or green shutters; the same horses
// chestnut, grey, dun or black.
defineMaterial("TrunradaTown_FeltGrey", { map: "felt", tint: "#cbc4b6", rough: 1 });
defineMaterial("TrunradaTown_FeltTan", { map: "felt", tint: "#d2b68a", rough: 1 });
defineMaterial("TrunradaTown_FeltGreen", { map: "felt", tint: "#4d7748", rough: 1 });
defineMaterial("TrunradaTown_FeltGold", { map: "felt", tint: "#c8973a", rough: 1 });
defineMaterial("TrunradaTown_PaintGreen", { map: "wood", tint: "#4f7d4a", bump: 1 });
defineMaterial("TrunradaTown_HorseChestnut", { map: "felt", tint: "#a0582c", rough: 0.75 });
defineMaterial("TrunradaTown_HorseGrey", { map: "felt", tint: "#bdb6aa", rough: 0.75 });
defineMaterial("TrunradaTown_HorseDun", { map: "felt", tint: "#c9a46a", rough: 0.75 });
defineMaterial("TrunradaTown_HorseBlack", { map: "felt", tint: "#3a302a", rough: 0.75 });
colourways({
  tr_red: { Trunrada_FeltBlue: "FeltRed", Thatch: "Trunrada_Turf", Trunrada_PaintBlue: "WoodRed", Trunrada_HorseBay: "TrunradaTown_HorseChestnut", FeltRed: "Trunrada_FeltBlue" },
  tr_green: { Trunrada_FeltBlue: "TrunradaTown_FeltGreen", FeltCream: "TrunradaTown_FeltGrey", Trunrada_PaintBlue: "Trunrada_PaintYellow", Trunrada_HorseBay: "TrunradaTown_HorseGrey" },
  tr_gold: { Trunrada_FeltBlue: "TrunradaTown_FeltGold", FeltCream: "TrunradaTown_FeltTan", Thatch: "Trunrada_Turf", Trunrada_PaintWhite: "WoodRed", Trunrada_HorseBay: "TrunradaTown_HorseDun", FeltRed: "TrunradaTown_FeltGreen" },
  tr_grey: { FeltCream: "TrunradaTown_FeltGrey", Trunrada_PaintBlue: "TrunradaTown_PaintGreen", Trunrada_PaintWhite: "Trunrada_PaintYellow", Trunrada_HorseBay: "TrunradaTown_HorseBlack" },
});
const TINTS = ["", "tr_red", "tr_green", "tr_gold", "tr_grey"];
const TINTED = ["trunrada:yurt_small", "trunrada:stone_house", "trunrada:longhouse_small"];

// ---- the plan's pixels -> the world: 27 cm a pixel, the middle crossroads at the origin ----
const S = 27;
const { P, rect } = new Plan(S, 435, 440);
type XY = [number, number];

// ---- the grid (plan pixels) ----
// the palisade's lines
const WL = 120, EL = 707, NL = 150, SL = 705;
// the main road, gate to gate, 52 px (14 m); the north road, gate to the main road, 40 px (11 m)
const MAIN = { v0: 414, v1: 466 };
const NROAD = { u0: 422, u1: 462 };
// the lanes and back streets, 30 px (8 m): the north back street from the west wall to the north
// road and the lane up on the left to it; the south back street wall to wall and the two lanes
// going down to it
const BACK_N = { v0: 192, v1: 222 };
const LANE_NW = { u0: 220, u1: 250 };
const BACK_S = { v0: 636, v1: 666 };
const LANE_SW = { u0: 331, u1: 361 };
const LANE_SE = { u0: 555, u1: 585 };
// the gathering ground: 11 x 13 squares of trampled earth and flat stones, 4 m each; a street in
// to it from the north road (between the chief's stable and the row on the main road) and a lane
// up to it from the main road along the east wall
const TILE = 400 / S, SQ_U = 528, SQ_V = 162, SQ_COLS = 11, SQ_ROWS = 13;
const SQ_U1 = SQ_U + SQ_COLS * TILE, SQ_V1 = SQ_V + SQ_ROWS * TILE;
const WAY_IN = { v0: SQ_V1 - 30, v1: SQ_V1 };
const LANE_E = { u0: SQ_U1 - 30, u1: SQ_U1 };
// every front this far back from its street
const SET = 5;

export function buildTrunrada(quality: { flowers: number }): Town {
  const town = new TownBuilder(7);
  const { put, rnd } = town;
  const pt = (u: number, v: number) => ({ x: P(u, v)[0], y: P(u, v)[1] });

  // ---- ground: the steppe, the streets (packed earth and cobbles), the gathering ground ----
  const roads: Poly[] = [
    rect(WL, MAIN.v0, EL, MAIN.v1),
    rect(NROAD.u0, NL, NROAD.u1, MAIN.v0),
    rect(WL, BACK_N.v0, NROAD.u0, BACK_N.v1),
    rect(LANE_NW.u0, BACK_N.v1, LANE_NW.u1, MAIN.v0),
    rect(WL, BACK_S.v0, EL, BACK_S.v1),
    rect(LANE_SW.u0, MAIN.v1, LANE_SW.u1, BACK_S.v0),
    rect(LANE_SE.u0, MAIN.v1, LANE_SE.u1, BACK_S.v0),
    rect(NROAD.u1, WAY_IN.v0, SQ_U, WAY_IN.v1),
    rect(LANE_E.u0, SQ_V1, LANE_E.u1, MAIN.v0),
    // the tracks on out of the gates
    rect(-700, 427, WL + 2, 453), rect(EL - 2, 427, 1600, 453), rect(429, -700, 455, NL + 2),
  ];
  const ground = buildPaved({
    area: { x0: -16500, x1: 17000, y0: -16500, y1: 17500 }, roads, plazas: [rect(SQ_U, SQ_V, SQ_U1, SQ_V1)], base: "steppe",
    road: [0.72, 0.64, 0.54], plaza: [0.68, 0.6, 0.48],
  });
  const paved = (x: number, y: number) => ground.kind(x, y) !== 0;

  // ---- the palisade: 6 m runs of sharpened logs, watchtowers at the corners and along the runs,
  // a gate with its watch platform at each of the three gates ----
  const NORTH = P(0, NL)[0], SOUTH = P(0, SL)[0], WEST = P(WL, 0)[1], EAST = P(EL, 0)[1];
  const GATE_N: XY = [NORTH, P((NROAD.u0 + NROAD.u1) / 2, 0)[1]];
  const GATE_W: XY = [P(0, (MAIN.v0 + MAIN.v1) / 2)[0], WEST];
  const GATE_E: XY = [P(0, (MAIN.v0 + MAIN.v1) / 2)[0], EAST];
  const run = (a: XY, b: XY, out: Side, gaps: number[] = []) => town.wall(a, b, out, "trunrada:palisade", { gaps, len: 600, gap: 600 });
  run([NORTH, WEST], [NORTH, EAST], "n", [WEST - GATE_N[1]]);
  run([NORTH, EAST], [SOUTH, EAST], "e", [NORTH - GATE_E[0]]);
  run([NORTH, WEST], [SOUTH, WEST], "w", [NORTH - GATE_W[0]]);
  run([SOUTH, WEST], [SOUTH, EAST], "s");
  const tower = (x: number, y: number, inward: Side) => put("trunrada:watchtower", [x, y], FACE[inward]);
  tower(NORTH, WEST, "s"); tower(NORTH, EAST, "s"); tower(SOUTH, WEST, "n"); tower(SOUTH, EAST, "n");
  for (const u of [280, 600]) tower(NORTH, P(u, 0)[1], "s");
  for (const u of [270, 420, 570]) tower(SOUTH, P(u, 0)[1], "n");
  for (const v of [290, 575]) {
    tower(P(0, v)[0], WEST, "e");
    tower(P(0, v)[0], EAST, "w");
  }
  // the gates: the posts, the swung-open doors and the ladder are solid, the passage between open
  const gateSolid: SolidSpec[] = [
    { kind: "gate", x: 70, y: -220, w: 240, d: 170, rot: 0 },
    { kind: "gate", x: 120, y: 220, w: 340, d: 170, rot: 0 },
  ];
  put("trunrada:palisade_gate", GATE_N, FACE.n, { solid: gateSolid });
  put("trunrada:palisade_gate", GATE_W, FACE.w, { solid: gateSolid });
  put("trunrada:palisade_gate", GATE_E, FACE.e, { solid: gateSolid });

  // ---- houses: rows with their fronts SET back from the street, evenly spaced from one end of
  // the block to the other; the yurts in rows of their own ----
  const homes: { x0: number; x1: number; y0: number; y1: number }[] = [];
  const boxOf = (ref: string, colours: string | undefined, x: number, y: number, h: number, s: number) => {
    const f = protoOf(ref, colours).foot, a = (h * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
    const xs: number[] = [], ys: number[] = [];
    for (const lx of [f.x0, f.x1]) for (const ly of [f.y0, f.y1]) {
      xs.push(x + (lx * c - ly * sn) * s);
      ys.push(y + (lx * sn + ly * c) * s);
    }
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  };
  // a piece's footprint facing `side`, in plan pixels about its own origin
  type Piece = string | [string, number]; // a kit piece, or a piece and its scale
  const refOf = (p: Piece): [string, number] => {
    const [ref, s] = typeof p === "string" ? [p, 1] : p;
    return [ref.includes(":") ? ref : `trunrada:${ref}`, s];
  };
  const planBox = (ref: string, colours: string | undefined, side: Side, s: number) => {
    const b = boxOf(ref, colours, 0, 0, FACE[side], s);
    return { u0: -b.y1 / S, u1: -b.y0 / S, v0: -b.x1 / S, v1: -b.x0 / S };
  };
  const across = (side: Side) => side === "n" || side === "s";
  // one building facing `side`, its front on the plan line `line` (a v for n/s, a u for e/w), its
  // middle at `at` along the row
  const place = (piece: Piece, side: Side, line: number, at: number): XY => {
    const [r, s] = refOf(piece);
    const colours = TINTED.includes(r) ? TINTS[Math.floor(rnd() * TINTS.length)] || undefined : undefined;
    const b = planBox(r, colours, side, s);
    const u = across(side) ? at - (b.u0 + b.u1) / 2 : line - (side === "e" ? b.u1 : b.u0);
    const v = across(side) ? line - (side === "s" ? b.v1 : b.v0) : at - (b.v0 + b.v1) / 2;
    const [x, y] = P(u, v);
    homes.push(boxOf(r, colours, x, y, FACE[side], s));
    put(r, [x, y], FACE[side], { colours, s });
    return [u, v];
  };
  // a row from a to b along the street (the first flush with a, the last with b, the gaps even);
  // the middles along the row
  const row = (side: Side, line: number, a: number, b: number, pieces: Piece[]): number[] => {
    const ws = pieces.map((p) => {
      const [r, s] = refOf(p), bx = planBox(r, undefined, side, s);
      return across(side) ? bx.u1 - bx.u0 : bx.v1 - bx.v0;
    });
    const spare = b - a - ws.reduce((p, q) => p + q, 0);
    const gap = pieces.length > 1 ? spare / (pieces.length - 1) : 0;
    let t = pieces.length > 1 ? a : a + spare / 2;
    return pieces.map((p, i) => {
      const mid = t + ws[i] / 2;
      place(p, side, line, mid);
      t += ws[i] + gap;
      return mid;
    });
  };
  const Y = "yurt_small", H = "stone_house", L = "longhouse_small";
  // the fronts' lines along each street
  const onMainN = MAIN.v0 - SET, onMainS = MAIN.v1 + SET;     // the rows north and south of the main road
  const onNRoadW = NROAD.u0 - SET, onNRoadE = NROAD.u1 + SET; // either side of the north road
  const onBackN = BACK_N.v0 - SET, belowBackN = BACK_N.v1 + SET;
  const onBackS = BACK_S.v0 - SET;
  // where the blocks end at the palisade
  const IN_W = WL + 12, IN_E = EL - 9;

  // north-east: down the north road two houses, the chief's great yurt and his stable, the
  // gathering ground behind them; the row along the main road
  const east = row("w", onNRoadE, NL + 8, WAY_IN.v0 - SET, [H, H, ["yurt_chief", 1.15], "stable"]);
  const CHIEF_V = east[2];
  row("s", onMainN, onNRoadE, LANE_E.u0 - SET, [H, L, H, L, H]);
  // north-west, the old quarter: the long hall facing the chief across the north road, houses
  // down the road below it and one at the top by the gate
  place("longhouse", "e", onNRoadW, CHIEF_V);
  row("e", onNRoadW, 280, onMainN - 44, [H, H]);
  place(H, "e", onNRoadW, (NL + BACK_N.v0) / 2 + 1);
  // yurts in two rows along the north back street, under the palisade
  row("s", onBackN, 145, 235, [Y, Y, Y]);
  row("s", onBackN, 303, 361, [Y, Y]);
  // the lane up on the left: houses down both sides of it, the row along the main road either side
  // of its mouth, a row of yurts behind the west side and two more facing the back street
  row("e", LANE_NW.u0 - SET, belowBackN, onMainN - 44, [H, L, H]);
  row("w", LANE_NW.u1 + SET, belowBackN, onMainN - 44, [H, L, H]);
  row("s", onMainN, IN_W, LANE_NW.u0 - SET, [H, L]);
  row("s", onMainN, LANE_NW.u1 + SET, NROAD.u0 - SET, [H, L, H, H]);
  row("e", 165, 250, 330, [Y, Y]);
  row("n", belowBackN, LANE_NW.u1 + 49, 356, [Y, Y]);
  // south-west, the horse quarter: the row along the main road, houses up the lane, the stable and
  // two houses on the back street, a row of yurts between
  row("n", onMainS, IN_W, LANE_SW.u0 - SET, [H, L, H, L, H]);
  row("e", LANE_SW.u0 - SET, onMainS + 43, onBackS, [H, L, H]);
  row("s", onBackS, IN_W, LANE_SW.u0 - SET - 42, [L, "stable", L]);
  row("s", 570, 160, 256, [Y, Y, Y]);
  // between the lanes, the tanners: the row along the main road, houses down both lanes, yurts on
  // the back street
  row("n", onMainS, LANE_SW.u1 + SET, LANE_SE.u0 - SET, [H, L, L, H]);
  row("w", LANE_SW.u1 + SET, onMainS + 43, onBackS, [H, L, H]);
  row("e", LANE_SE.u0 - SET, onMainS + 43, onBackS, [H, L, H]);
  row("s", onBackS, 426, 490, [Y, Y]);
  // south-east: the row along the main road, houses down the lane, yurts on the back street
  row("n", onMainS, LANE_SE.u1 + SET, IN_E, [H, L, H]);
  row("w", LANE_SE.u1 + SET, onMainS + 43, onBackS, [H, L, H]);
  row("s", onBackS, 635.5, 695.5, [Y, Y]);

  // ---- the gathering ground: the windmill on its mound, the ring of standing stones ----
  const MILL = P(652, 200);
  put("trunrada:windmill", MILL, facing(-50, 70), {
    solid: [{ kind: "landmark", x: 0, y: 0, r: 600 }, { kind: "landmark", x: -585, y: 0, w: 110, d: 230, rot: 0 }, { kind: "post", x: 836, y: 0, r: 75 }],
  });
  const RING = P(607, 312);
  {
    const stones: SolidSpec[] = [{ kind: "landmark", x: 0, y: 0, r: 240 }];
    for (const deg of [60, 100, 140, 157, 203, 220, 260, 300]) stones.push({ kind: "landmark", x: 590 * Math.cos((deg * Math.PI) / 180), y: 590 * Math.sin((deg * Math.PI) / 180), r: 72 });
    for (const y of [-110, 110]) stones.push({ kind: "landmark", x: 590, y, r: 55 });
    put("trunrada:stone_circle", RING, FACE.n, { solid: stones });
  }

  // ---- props: kept clear of the houses and of each other ----
  const props: [number, number, number][] = [];
  const clear = (x: number, y: number, r: number) =>
    !homes.some((b) => x > b.x0 - r && x < b.x1 + r && y > b.y0 - r && y < b.y1 + r) && !props.some(([px, py, pr]) => Math.hypot(px - x, py - y) < pr + r);
  const prop = (ref: string, u: number, v: number, h = 0, r = 120, o: Partial<Placement> = {}): boolean => {
    const [x, y] = P(u, v);
    if (!clear(x, y, r)) return false;
    props.push([x, y, r]);
    put(ref.includes(":") ? ref : `trunrada:${ref}`, [x, y], h, o);
    return true;
  };
  // (in a yard: only on the grass)
  const yard = (ref: string, u: number, v: number, h = 0, r = 120, o: Partial<Placement> = {}): boolean => {
    const [x, y] = P(u, v);
    if ([[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].some(([dx, dy]) => paved(x + dx, y + dy))) return false;
    return prop(ref, u, v, h, r, o);
  };
  props.push([MILL[0], MILL[1], 700], [RING[0], RING[1], 760]);
  const BANNER: SolidSpec[] = [{ kind: "post", x: 0, y: -54, r: 36 }];
  const banner = (u: number, v: number, side: Side | number) => prop("banner_pole", u, v, typeof side === "number" ? side : FACE[side], 90, { solid: BANNER });
  const coat = () => TINTS[Math.floor(rnd() * TINTS.length)] || undefined;
  // a hitching rail, its trough to `side`, with saddled horses drinking at it
  const tether = (u: number, v: number, side: Side, ys: number[] = [-85, 85]): boolean => {
    const h = FACE[side], a = (h * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
    const [x, y] = P(u, v);
    const at = (lx: number, ly: number): XY => [x + lx * c - ly * sn, y + lx * sn + ly * c];
    const mid = at(-110, 0);
    if (!clear(mid[0], mid[1], 250)) return false;
    props.push([mid[0], mid[1], 250]);
    put("trunrada:hitching_post", [x, y], h);
    for (const ly of ys) put("trunrada:horse", at(-222, ly), h + 180 + (rnd() - 0.5) * 14, { colours: coat() });
    return true;
  };
  // a horse loose in the grass
  const graze = (u: number, v: number, h: number) => yard("horse_grazing", u, v, h, 150, { colours: coat() });
  const within = (t: number, spans: [number, number][]) => spans.some(([a, b]) => t > a && t < b);

  // the trader's stall on the main road, under the row
  prop("fur_stall", 568, MAIN.v0 + 6, FACE.s, 150);
  // braziers down both sides of the main road, a hitching rail now and then, skipping the mouths
  // of the side streets, the crossroads and the gates
  {
    let i = 0;
    for (let u = 150; u <= 680; u += 44, i++) {
      if (!within(u, [[LANE_NW.u0 - 8, LANE_NW.u1 + 8], [372, 474], [LANE_E.u0 - 8, 700]])) {
        if (i % 3 === 1) tether(u, MAIN.v0 + 5, "s", i % 2 ? [-85, 85] : [40]);
        else prop("brazier_post", u, MAIN.v0 + 4, 0, 60);
      }
      if (!within(u, [[LANE_SW.u0 - 8, LANE_SW.u1 + 8], [400, 480], [LANE_SE.u0 - 8, LANE_SE.u1 + 8]])) {
        if (i % 3 === 2 && u < 650) tether(u, MAIN.v1 - 5, "n", i % 2 ? [-60] : [-85, 85]);
        else prop("brazier_post", u, MAIN.v1 - 4, 0, 60);
      }
    }
  }
  // carts left at the roadside
  prop("cart", 300, MAIN.v1 - 9, FACE.e, 200);
  prop("cart", 612, MAIN.v0 + 8, FACE.w, 200);
  prop("cart", 520, MAIN.v1 - 9, FACE.e, 200);
  // the north road, the way to the chief: clan banners either side of the chief's door and the
  // long hall's, braziers down both sides
  for (const dv of [-20, 20]) {
    banner(NROAD.u0 + 4, CHIEF_V + dv, "e");
    banner(NROAD.u1 - 4, CHIEF_V + dv, "w");
  }
  for (let v = 190; v <= 400; v += 34) {
    if (Math.abs(v - CHIEF_V) < 30) continue;
    if (!within(v, [[BACK_N.v0 - 6, BACK_N.v1 + 6]])) prop("brazier_post", NROAD.u0 + 4, v, 0, 60);
    if (!within(v, [[WAY_IN.v0 - 6, WAY_IN.v1 + 6]])) prop("brazier_post", NROAD.u1 - 4, v, 0, 60);
  }
  // the lanes and back streets: braziers down their sides, by turns
  for (const [u, v] of [[LANE_NW.u0 + 4, 262], [LANE_NW.u1 - 4, 322], [LANE_NW.u0 + 4, 382],
    [LANE_SW.u0 + 4, 490], [LANE_SW.u1 - 4, 550], [LANE_SW.u0 + 4, 610],
    [LANE_SE.u1 - 4, 490], [LANE_SE.u0 + 4, 550], [LANE_SE.u1 - 4, 610],
    [170, BACK_N.v1 - 4], [300, BACK_N.v0 + 4], [390, BACK_N.v1 - 4],
    [180, BACK_S.v0 + 4], [280, BACK_S.v1 - 4], [458, BACK_S.v0 + 4], [520, BACK_S.v1 - 4], [640, BACK_S.v1 - 4]] as XY[]) prop("brazier_post", u, v, 0, 60);
  // the crossroads: the town's ovoo, a cairn hung with scarves, braziers either side
  const OVOO: XY = [(NROAD.u0 + NROAD.u1) / 2, (MAIN.v0 + MAIN.v1) / 2 + 6];
  prop("cairn", OVOO[0], OVOO[1], 30, 200, { s: 1.3 });
  for (const du of [-17, 17]) prop("brazier_post", OVOO[0] + du, OVOO[1], 0, 60);
  // the gates: braziers either side of the way in, clan standards outside
  for (const [g, side] of [[GATE_N, "n"], [GATE_W, "w"], [GATE_E, "e"]] as [XY, Side][]) {
    const a = (FACE[side] * Math.PI) / 180, ox = -Math.cos(a), oy = -Math.sin(a); // outward
    for (const s of [-1, 1]) {
      const bx = g[0] - ox * 470 - oy * s * 360, by = g[1] - oy * 470 + ox * s * 360;
      put("trunrada:brazier_post", [bx, by], 0);
      const sx = g[0] + ox * 420 - oy * s * 430, sy = g[1] + oy * 420 + ox * s * 430;
      put("trunrada:banner_pole", [sx, sy], FACE[side], { solid: BANNER });
    }
  }

  // ---- the gathering ground ----
  // the clan totem in the middle, ringed by standards, a fire beside it
  prop("totem", 600, 240, FACE.s, 120, { solid: [{ kind: "post", x: 0, y: 0, r: 80 }] });
  for (const [du, dv] of [[-16, -14], [16, -14], [-16, 14], [16, 14]]) banner(600 + du, 240 + dv, facing(-du, -dv));
  prop("campfire", 572, 280, 20, 150);
  // the fur market along the back of the chief's yurt, carts and crates by it
  for (const v of [190, 222, 254]) prop("fur_stall", 541, v, FACE.e, 160);
  for (const v of [196, 228]) prop("fur_stall", 569, v, FACE.w, 160);
  for (const [u, v] of [[555, 172], [558, 268], [552, 240], [534, 282], [538, 288], [534, 312]] as XY[]) prop("common:crate", u, v, rnd() * 90, 40);
  prop("cart", 552, 300, FACE.s + 20, 200);
  prop("cart", 545, 338, FACE.n - 10, 200);
  // the horse lines and hay by the windmill
  prop("haystack", 682, 248, 10, 160);
  prop("haystack", 678, 276, 60, 160);
  for (const v of [304, 334]) tether(674, v, "w");
  prop("haystack", 562, 176, 0, 160);
  prop("cart", 600, 176, FACE.e, 200);
  // its ground of trampled earth and flat stones
  for (let i = 0; i < SQ_COLS; i++) for (let j = 0; j < SQ_ROWS; j++) put("trunrada:path_tile", P(SQ_U + (i + 0.5) * TILE, SQ_V + (j + 0.5) * TILE), 90 * Math.floor(rnd() * 4));
  // the grass between it and the row on the main road
  graze(640, 362, 120);
  yard("drying_rack", 600, 362, FACE.n, 150);

  // ---- the yards: hay, carts, drying racks, fires, the old stones ----
  // north-west, the old quarter: lone standing stones older than the town by the palisade, a
  // drying rack between the yurts, hay; a fire in the yard behind the long hall
  yard("standing_stone", 252, 176, FACE.s + 15, 90);
  yard("standing_stone", 136, 180, FACE.e - 10, 90);
  yard("drying_rack", 152, 290, FACE.e, 150);
  yard("haystack", 152, 356, 0, 160);
  yard("campfire", 330, 300, 0, 150);
  yard("drying_rack", 306, 345, FACE.n, 150);
  yard("cart", 350, 346, FACE.w, 200);
  // south-west, the horse quarter: hay, loose horses, the horse lines by the lane row
  yard("haystack", 150, 528, 0, 160);
  graze(190, 526, 40);
  yard("haystack", 230, 524, 40, 160);
  tether(274, 545, "w", [-85]);
  graze(208, 590, -30);
  // between the lanes, the tanners: a row of drying racks, a fire before the yurts
  for (const u of [430, 458, 486]) yard("drying_rack", u, 548, FACE.n, 150);
  yard("campfire", 458, 580, 0, 150);
  // south-east
  yard("drying_rack", 662, 545, FACE.e, 150);
  yard("haystack", 668, 580, 0, 160);
  yard("standing_stone", 650, 524, FACE.w, 90);
  // the strip behind the south back street, under the palisade
  yard("haystack", 150, 684, 0, 160);
  yard("campfire", 232, 685, 0, 150);
  yard("cart", 305, 684, FACE.w, 200);
  graze(360, 684, -30);
  yard("haystack", 470, 684, 0, 160);
  yard("cart", 515, 684, FACE.w, 200);
  yard("drying_rack", 620, 684, FACE.n, 150);
  yard("haystack", 662, 684, 0, 160);

  // ---- outside the walls: the herds on the open steppe, ovoos and old stones by the tracks,
  // birch and pine here and there ----
  const herds: XY[] = [];
  for (const [u0, v0, n] of [[800, 300, 5], [790, 590, 4], [290, 70, 4], [40, 600, 3]] as [number, number, number][])
    for (let i = 0; i < n; i++) {
      const at = P(u0 + (rnd() - 0.5) * 70, v0 + (rnd() - 0.5) * 70);
      herds.push(at);
      put(i % 3 === 2 ? "trunrada:horse" : "trunrada:horse_grazing", at, rnd() * 360, { colours: coat(), solid: "none" });
    }
  for (const [u, v] of [[760, 400], [470, 95], [70, 475]] as XY[]) put("trunrada:cairn", P(u, v), rnd() * 90, { solid: "none" });
  for (const [u, v, h] of [[860, 470, 20], [880, 395, -15], [395, 60, 80], [-10, 400, 5], [20, 492, -20]] as [number, number, number][])
    put("trunrada:standing_stone", P(u, v), h, { solid: "none" });
  for (const [u, v] of [[760, 180], [80, 250], [90, 690], [760, 660]] as XY[]) put("trunrada:haystack", P(u, v), rnd() * 90, { solid: "none" });
  town.woods({ x0: -15500, x1: 16000, y0: -15500, y1: 16500 }, ["Birch", "Pine", "PineSmall", "Bush", "Birch"], (x, y) => {
    const inside = x > SOUTH - 1000 && x < NORTH + 1000 && y > EAST - 1000 && y < WEST + 1000;
    const road = (Math.abs(x - GATE_W[0]) < 900 && (y > WEST || y < EAST)) || (Math.abs(y - GATE_N[1]) < 900 && x > NORTH);
    return inside || road || herds.some(([hx, hy]) => Math.hypot(hx - x, hy - y) < 700);
  }, { count: 160, spacing: 600 });

  // ---- inside: birch groves in the yards and under the palisade, then a few more trees and
  // stones on the grass left between ----
  const TREES = ["Birch", "Birch", "Bush", "PineSmall", "Bush", "Birch", "Pine"];
  const grove = (u: number, v: number, n: number, spread = 20) => {
    for (let i = 0, k = 0; i < n && k < n * 6; k++) {
      const tu = u + (rnd() - 0.5) * 2 * spread, tv = v + (rnd() - 0.5) * 2 * spread, [x, y] = P(tu, tv);
      if (tu < 134 || tu > 692 || tv < 164 || tv > 692 || paved(x, y) || paved(x + 250, y) || paved(x - 250, y) || paved(x, y + 250) || paved(x, y - 250)) continue;
      if (prop(`flora:${TREES[Math.floor(rnd() * TREES.length)]}`, tu, tv, rnd() * 360, 130, { s: 0.7 + rnd() * 0.35 })) i++;
    }
  };
  for (const [u, v, n] of [
    [190, 686, 2], [400, 688, 2], [560, 688, 2], [690, 690, 1], [340, 270, 2], [470, 522, 2], [150, 236, 1], [690, 522, 1],
  ] as [number, number, number][]) grove(u, v, n);
  // and one in a corner of a yard here and there
  for (const [u, v] of [[296, 178], [516, 174], [508, 586], [412, 586], [150, 562], [265, 585], [372, 296], [688, 596]] as XY[]) grove(u, v, 1, 4);
  town.greens(ground, { x0: SOUTH, x1: NORTH, y0: EAST, y1: WEST }, { trees: ["Birch", "Bush", "Birch", "PineSmall", "Bush"], other: "common:rock_small", chance: 0.55, step: 480, margin: 500 });

  return town.finish({
    ground,
    sky: "#8d955f",
    flowers: {
      box: { x: SOUTH, y: EAST, w: NORTH - SOUTH, h: WEST - EAST },
      open: (x, y) => ground.kind(x, y) === 0 && x > SOUTH + 300 && x < NORTH - 300 && y > EAST + 300 && y < WEST - 300,
      density: 0.22 * quality.flowers,
    },
    bounds: { minX: SOUTH - 700, maxX: NORTH + 700, minY: EAST - 700, maxY: WEST + 700 },
    spawn: pt(412, 440),
    npcs: trunradaNpcs(CHIEF_V),
    // north to the horse meadows by the sea, west across the steppe, east to the old stone plain
    ...waysOut([
      gateWay(GATE_N, "n", "horse_meadow", 420, 420),
      gateWay(GATE_W, "w", "west_steppe", 420, 420),
      gateWay(GATE_E, "e", "stone_plain", 420, 420),
    ]),
    closed: [],
    labels: [
      { ...pt(456, CHIEF_V + 34), text: "กระโจมหัวหน้าเผ่า" },
      { ...pt(428, CHIEF_V - 30), text: "โถงบ้านยาว" },
      { ...pt(595, 268), text: "ลานชุมนุม" },
      { ...pt(607, 288), text: "วงหินโบราณ", kind: "small" },
      { ...pt(632, 232), text: "กังหันลม", kind: "small" },
      { ...pt(330, 290), text: "ย่านบ้านยาว", kind: "small" },
      { ...pt(210, 535), text: "ย่านคอกม้า" },
      { ...pt(458, 530), text: "ย่านช่างหนัง" },
      { ...pt(OVOO[0], OVOO[1] + 14), text: "โอโบกลางเมือง", kind: "small" },
      { x: GATE_N[0] - 60, y: GATE_N[1], text: "ประตูเหนือ · ทุ่งเลี้ยงม้า", kind: "gate" },
      { x: GATE_W[0], y: GATE_W[1] - 60, text: "ประตูตะวันตก · สเตปป์ตะวันตก", kind: "gate" },
      { x: GATE_E[0], y: GATE_E[1] + 60, text: "ประตูตะวันออก · ที่ราบหินโบราณ", kind: "gate" },
    ],
  });
}

// ---- the townsfolk, where the plan put its red dots (and a guard at the east gate, where it
// put none), moved onto the new streets ----
function trunradaNpcs(chiefV: number): NpcSpec[] {
  const at = (u: number, v: number) => {
    const [x, y] = P(u, v);
    return { x, y };
  };
  const guard = (top: string, hairColor = "ink") => ({ gender: "male", hair: "", hairColor, eyes: "amber", top, bottom: "bottom_warrior_cocoa" });
  return [
    { id: "trunrada_guard_n", ...at(454, 176), face: 180, name: "บาตาร์", title: "ทหารยามประตูเหนือ", role: "talk", look: guard("top_warrior_navy"),
      lines: ["ออกประตูเหนือไปคือทุ่งเลี้ยงม้าริมทะเลเหนือ คอกม้าเก่าที่นั่นร้างไปนานแล้ว", "เดินตรงลงไปตามถนนนี้ กระโจมแดงทางซ้ายมือคือกระโจมหัวหน้าเผ่า"] },
    { id: "trunrada_guard_w", ...at(143, 456), face: -90, name: "กันบาตาร์", title: "ทหารยามประตูตะวันตก", role: "talk", look: guard("top_warrior"),
      lines: ["ออกประตูตะวันตกไปคือสเตปป์ตะวันตก เดินต่อไปจนถึงป่าสนริมแม่น้ำ แล้วก็ถนนหลวงของอีเดน", "ถ้าจะไปเมืองอื่น ไปหาผู้นำทางที่ทางแยกกลางเมืองสิ"] },
    { id: "trunrada_guard_e", ...at(684, 432), face: 90, name: "โบลด์", title: "ทหารยามประตูตะวันออก", role: "talk", look: guard("top_warrior_forest", "auburn"),
      lines: ["นอกประตูนี้คือทุ่งสเตปป์สุดลูกหูลูกตา ฝูงม้าป่าวิ่งอยู่ทั้งปี", "ออกประตูนี้ไปคือที่ราบหินโบราณ ข้ามไปทางใต้จะถึงประตูเหนือของคราเดีย ป้อมที่กันอสูรไว้"] },
    travelGuide("trunrada", P(399, 420), -150),
    { id: "trunrada_healer", ...at(382, 422), face: -60, name: "แม่หมอโอยุน", title: "หมอสมุนไพร · รักษาฟรี", role: "heal",
      look: { gender: "female", hair: "hime", hairColor: "silver", eyes: "teal", top: "top_priestess_forest", bottom: "bottom_priestess_forest" },
      lines: ["ควันสมุนไพรจากทุ่งหญ้าจะไล่ความเหนื่อยออกไปจากตัวเจ้า", "หายดีแล้ว ขอให้วิญญาณแห่งทุ่งหญ้าคุ้มครองเจ้า"] },
    { id: "trunrada_shop", ...at(569, 433), face: 180, name: "นารัน", title: "ร้านเครื่องมือ", role: "shop", sprite: "merchant",
      lines: ["ขนสัตว์ เชือก ยา และเสบียงเดินทาง มีครบในร้านนี้"] },
    { id: "trunrada_herder", ...at(235, 404), face: 180, name: "อัลตัน", title: "คนเลี้ยงม้า", role: "talk", look: guard("top_warrior_forest", "amber"),
      lines: ["ม้าของทรุนราดาวิ่งได้ทั้งวันไม่รู้จักเหนื่อย", "เด็กที่นี่ขี่ม้าเป็นก่อนเดินเป็นเสียอีก", "คอกม้าอยู่ย่านตะวันตกเฉียงใต้ ข้ามถนนใหญ่ไปนั่นแหละ"] },
    { id: "trunrada_elder", ...at(235, 296), face: 0, name: "ผู้เฒ่าเออร์เดเน", title: "ผู้เฒ่าเล่าตำนาน", role: "talk", look: guard("top_warrior_navy", "silver"),
      lines: ["วงหินในลานชุมนุมตั้งอยู่มาก่อนจะมีเมืองนี้ ไม่มีใครรู้ว่าใครตั้งไว้", "อักษรบนหินเรืองแสงสีฟ้าในคืนเดือนมืด", "บรรพบุรุษของเราตั้งกระโจมรอบหินนั้น แล้วเมืองก็โตขึ้นมาเอง"] },
    { id: "trunrada_girl", ...at(420, 460), face: -50, name: "ทูยา", title: "เด็กเลี้ยงแกะ", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "auburn", eyes: "amber", top: "top_rose", bottom: "bottom_cocoa" },
      lines: ["กังหันลมบนเนินบดแป้งให้ทั้งเมืองเลยนะ", "โตขึ้นฉันจะเป็นนักธนูบนหลังม้าเหมือนพี่ๆ", "โอโบตรงทางแยกนี่ ใครผ่านต้องวางหินเพิ่มหนึ่งก้อนแล้วเดินวนสามรอบ"] },
    { id: "trunrada_tanner", ...at(570, 498), face: 180, name: "ซอลองโก", title: "ช่างฟอกหนัง", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "blue", top: "top_adventurer_ochre", bottom: "bottom_adventurer_cocoa" },
      lines: ["ย่านนี้ตากหนังกับปลาไว้เต็มราว กลิ่นแรงหน่อยนะ", "ขนหมาป่าสีเทาจากทุ่งเหนืออุ่นที่สุดในหน้าหนาว", "หนังดีๆ ส่งลงใต้ไปขายถึงอีเดนเลย"] },
    { id: "trunrada_saddler", ...at(346, 597), face: -90, name: "บัตตูลกา", title: "ช่างทำอานม้า", role: "talk", look: guard("top_warrior", "teal"),
      lines: ["อานม้าทุกตัวในเมืองนี้ผ่านมือข้ามาแล้ว", "ถ้าจะออกทุ่ง อย่าลืมพกถุงน้ำกับเนื้อตากแห้งไปด้วย"] },
    { id: "job_ranger", ...at(465, chiefV), face: 90, name: "นายพรานเตมูร์", title: "นายพรานแห่งทุ่งหญ้า · เปลี่ยนอาชีพนายพราน", role: "talk", look: guard("top_warrior_forest", "ink"),
      lines: ["นักธนูหรือนักรบเลเวล 30 ที่อยากเป็นนายพราน มาคุยกับข้า", "เหยี่ยว กับดัก หรือยาพิษ นายพรานแต่ละคนมีทางของตัวเอง"] },
    { id: "trunrada_chief", ...at(449, chiefV), face: 90, name: "หัวหน้าเผ่าบาตู", title: "หัวหน้าเผ่าทรุนราดา", role: "talk", look: guard("top_warrior_navy", "crimson"),
      lines: ["ยินดีต้อนรับสู่ทรุนราดา เมืองของชนเผ่าแห่งทุ่งหญ้า", "พวกเราเฝ้าชายแดนตะวันออกเฉียงเหนือมาหลายชั่วคน", "ทุกฤดูใบไม้ร่วง เผ่าต่างๆ จะมาชุมนุมกันที่ลานกว้างหลังกระโจมของข้า"] },
  ];
}
