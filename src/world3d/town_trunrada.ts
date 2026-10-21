// ทรุนราดา (Trunrada), the clan town of the cold north-eastern steppe, laid out from the player's
// own plan: a square palisade with three gates (west, east and north); the broad main road from
// the west gate to the east gate; the north road down from the north gate to the middle, where
// the chief's great yurt and the clan's long hall face each other across it; a lane up on the
// left that ends and two lanes going down that end, with rows of houses along all of them;
// yurts and houses scattered in each quarter; and the open gathering ground in the north-east,
// where the ancient standing stones ring their altar and the windmill turns on its mound.
//
// The plan is read in its own pixels (u right, v down, as drawn): north (up the page) is +X,
// east (right) is -Y. One plan pixel is 27 cm, so the walled town is about 158 x 150 m before
// TOWN_SCALE.

import { KIT } from "./kits/trunrada";
import { buildPaved } from "./paved";
import type { Poly } from "./paved";
import { defineMaterial } from "./textures";
import { Plan, TownBuilder, useKits, colourways, facing, FACE, travelGuide, protoOf } from "./town";
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

// ---- the plan's pixels -> the world: 27 cm a pixel, the middle crossroads at the origin ----
const S = 27;
const { P, rect, poly } = new Plan(S, 435, 440);
type XY = [number, number];

// the roads as drawn (plan pixels)
const MAIN: XY[] = [
  [120, 418], [210, 417], [262, 410], [400, 407], [466, 412], [690, 412], [712, 416],
  [712, 464], [690, 468], [650, 481], [610, 494], [545, 496], [480, 491], [400, 487], [372, 485], [372, 466], [318, 465], [150, 463], [120, 463],
];
const NORTH_ROAD: XY[] = [[424, 140], [460, 140], [462, 250], [464, 330], [466, 414], [399, 412], [402, 370], [408, 320], [416, 260], [421, 200]];
const LANE_NW: XY[] = [[215, 414], [215, 240], [219, 229], [228, 222], [240, 222], [249, 230], [252, 245], [255, 330], [258, 414]];
const LANE_SW: XY[] = [[318, 458], [374, 458], [372, 560], [368, 640], [362, 664], [348, 675], [334, 666], [326, 645], [321, 560]];
const LANE_SE: XY[] = [[543, 488], [590, 488], [596, 560], [600, 640], [597, 664], [582, 676], [566, 668], [559, 640], [551, 560]];
// the gathering ground: 11 x 14 squares of trampled earth and flat stones, 4 m each
const TILE = 400 / S, SQ_U = 526, SQ_V = 165;
const SQUARE: XY[] = [[SQ_U, SQ_V], [SQ_U + 11 * TILE, SQ_V], [SQ_U + 11 * TILE, SQ_V + 14 * TILE], [SQ_U, SQ_V + 14 * TILE]];

export function buildTrunrada(quality: { flowers: number }): Town {
  const town = new TownBuilder(7);
  const { put, rnd } = town;
  const pt = (u: number, v: number) => ({ x: P(u, v)[0], y: P(u, v)[1] });

  // ---- ground: the steppe, the roads (packed earth and cobbles), the gathering ground ----
  const roads: Poly[] = [
    poly(MAIN), poly(NORTH_ROAD), poly(LANE_NW), poly(LANE_SW), poly(LANE_SE),
    // the tracks on out of the gates
    rect(-700, 427, 122, 453), rect(705, 427, 1600, 453), rect(429, -700, 455, 152),
  ];
  const ground = buildPaved({
    area: { x0: -16500, x1: 17000, y0: -16500, y1: 17500 }, roads, plazas: [poly(SQUARE)], base: "steppe",
    road: [0.72, 0.64, 0.54], plaza: [0.68, 0.6, 0.48],
  });
  const paved = (x: number, y: number) => ground.kind(x, y) !== 0;

  // ---- the palisade: 6 m runs of sharpened logs, watchtowers at the corners and along the runs,
  // a gate with its watch platform at each of the three gates ----
  const NORTH = P(0, 150)[0], SOUTH = P(0, 705)[0], WEST = P(120, 0)[1], EAST = P(707, 0)[1];
  const GATE_N: XY = [NORTH, P(442, 0)[1]];
  const GATE_W: XY = [P(0, 440)[0], WEST];
  const GATE_E: XY = [P(0, 440)[0], EAST];
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

  // ---- houses: every square on the plan, its front to the nearest road, nudged off the paving
  // and clear of its neighbours ----
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
  const GAP = 90;
  // a building centred on plan (u, v) facing `side`
  const home = (ref: string, u: number, v: number, side: Side | number, o: { colours?: string; s?: number; solid?: SolidSpec[] } = {}) => {
    const r = ref.includes(":") ? ref : `trunrada:${ref}`;
    const colours = o.colours ?? (r === "trunrada:yurt_small" || r === "trunrada:stone_house" || r === "trunrada:longhouse_small" ? TINTS[Math.floor(rnd() * TINTS.length)] || undefined : undefined);
    const h = typeof side === "number" ? side : FACE[side], s = o.s ?? 1;
    // the footprint's own middle onto the drawn square's middle
    const b0 = boxOf(r, colours, 0, 0, h, s);
    const [cx, cy] = P(u, v);
    let x = cx - (b0.x0 + b0.x1) / 2, y = cy - (b0.y0 + b0.y1) / 2;
    for (let k = 0; k < 40; k++) {
      const b = boxOf(r, colours, x, y, h, s);
      let mx = 0, my = 0, n = 0, px = 0, py = 0;
      for (let sx = b.x0 - 60; sx <= b.x1 + 60; sx += 50) for (let sy = b.y0 - 60; sy <= b.y1 + 60; sy += 50) if (paved(sx, sy)) { n++; px += sx; py += sy; }
      if (n) {
        const dx = (b.x0 + b.x1) / 2 - px / n, dy = (b.y0 + b.y1) / 2 - py / n, L = Math.hypot(dx, dy) || 1;
        mx += (dx / L) * 30;
        my += (dy / L) * 30;
      }
      for (const q of homes) {
        const ox = Math.min(b.x1 + GAP, q.x1) - Math.max(b.x0 - GAP, q.x0), oy = Math.min(b.y1 + GAP, q.y1) - Math.max(b.y0 - GAP, q.y0);
        if (ox <= 0 || oy <= 0) continue;
        if (ox < oy) mx += (b.x0 + b.x1 < q.x0 + q.x1 ? -1 : 1) * Math.min(ox, 30);
        else my += (b.y0 + b.y1 < q.y0 + q.y1 ? -1 : 1) * Math.min(oy, 30);
      }
      if (!mx && !my) break;
      x += mx;
      y += my;
    }
    homes.push(boxOf(r, colours, x, y, h, s));
    put(r, [x, y], h, { colours, s, ...(o.solid ? { solid: o.solid } : {}) });
  };

  // north-west: the long hall facing the north road; houses down the north road, down both
  // sides of the lane that ends, along the main road; yurts scattered behind
  home("longhouse", 382, 256, "e");
  home("stone_house", 399, 215, "e");
  home("stone_house", 392, 302, "e");
  home("stone_house", 383, 341, "e");
  home("yurt_small", 209, 192, "s");
  home("stone_house", 272, 206, "s");
  home("yurt_small", 345, 197, "s");
  home("yurt_small", 322, 255, "s");
  home("yurt_small", 321, 322, "s");
  home("yurt_small", 180, 250, "e");
  home("yurt_small", 157, 305, "s");
  home("stone_house", 271, 276, "w");
  home("longhouse_small", 268, 311, "w");
  home("stone_house", 270, 346, "w");
  home("stone_house", 195, 296, "e");
  home("yurt_small", 192, 323, "e", { s: 0.7 });
  home("stone_house", 191, 349, "e");
  home("stone_house", 167, 390, "s");
  home("yurt_small", 193, 388, "s", { s: 0.8 });
  home("stone_house", 276, 384, "s");
  home("longhouse_small", 309, 383, "s");
  home("stone_house", 343, 385, "s");
  home("stone_house", 374, 389, "s");
  // north-east: houses and the stable down the north road, the chief's yurt between them, the
  // row along the main road with the gathering ground behind
  home("yurt_chief", 498, 288, "w", { s: 1.15 });
  home("stone_house", 482, 196, "w");
  home("stone_house", 482, 234, "w");
  home("stable", 481, 341, "w");
  for (const u of [488, 522, 562, 603, 643]) home(u === 522 || u === 603 ? "longhouse_small" : "stone_house", u, 395, "s");
  // south-west, the horse quarter: the row along the main road, houses up the lane, stables and
  // yurts behind
  for (const u of [167, 200, 234, 269, 299]) home(u === 200 || u === 269 ? "longhouse_small" : "stone_house", u, 486, "n");
  for (const v of [521, 558, 594]) home(v === 558 ? "longhouse_small" : "stone_house", 300, v, "e");
  home("yurt_small", 192, 546, "s");
  home("stable", 255, 550, "e");
  home("yurt_small", 210, 598, "s");
  home("longhouse_small", 258, 630, "e");
  home("yurt_small", 189, 646, "s", { s: 1.25 });
  // between the lanes, the tanners: the row along the main road, houses down both lanes, yurts
  for (const [u, v] of [[391, 508], [430, 514], [472, 516], [513, 520]]) home(u === 430 || u === 513 ? "longhouse_small" : "stone_house", u, v, "n");
  for (const v of [553, 592, 634]) home(v === 592 ? "longhouse_small" : "stone_house", 391, v, "w");
  home("stone_house", 536, 562, "e");
  home("stone_house", 529, 614, "e");
  home("yurt_small", 480, 582, "s");
  home("yurt_small", 434, 623, "s");
  // south-east: down the other side of the lane
  home("stone_house", 609, 525, "w");
  home("yurt_small", 645, 514, "n");
  home("longhouse_small", 615, 574, "w");
  home("yurt_small", 621, 619, "w");

  // ---- the gathering ground: the windmill on its mound, the ring of standing stones ----
  const MILL = P(652, 200);
  put("trunrada:windmill", MILL, facing(-50, 70), {
    solid: [{ kind: "landmark", x: 0, y: 0, r: 600 }, { kind: "landmark", x: -585, y: 0, w: 110, d: 230, rot: 0 }, { kind: "post", x: 836, y: 0, r: 75 }],
  });
  const RING = P(607, 318);
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
    if (!clear(x, y, r)) {
      console.log("skip", ref, u, v);
      return false;
    }
    props.push([x, y, r]);
    put(ref.includes(":") ? ref : `trunrada:${ref}`, [x, y], h, o);
    return true;
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
    if (!clear(mid[0], mid[1], 250)) {
      console.log("skip tether", u, v);
      return false;
    }
    props.push([mid[0], mid[1], 250]);
    put("trunrada:hitching_post", [x, y], h);
    for (const ly of ys) put("trunrada:horse", at(-222, ly), h + 180 + (rnd() - 0.5) * 14, { colours: coat() });
    return true;
  };
  // a horse loose in the grass
  const graze = (u: number, v: number, h: number) => prop("horse_grazing", u, v, h, 150, { colours: coat() });
  // the edges of the paving, scanning a plan line from a point (u, v) one way
  const edge = (u: number, v: number, du: number, dv: number) => {
    for (let i = 0; i < 200; i++, u += du, v += dv) if (paved(...P(u, v))) return [u, v] as XY;
    return [u, v] as XY;
  };

  // the trader's stall on the main road, under the row
  prop("fur_stall", 568, 420, FACE.s, 150);
  // braziers down both sides of the main road, a hitching rail now and then, skipping the
  // mouths of the side roads
  {
    let i = 0;
    for (let u = 150; u <= 680; u += 44, i++) {
      const top = edge(u, 380, 0, 1)[1], bot = edge(u, 530, 0, -1)[1];
      if (!(u > 200 && u < 272) && !(u > 388 && u < 476)) {
        if (i % 3 === 1 && u < 650) tether(u, top + 5, "s", i % 2 ? [-85, 85] : [40]);
        else prop("brazier_post", u, top + 8, 0, 60);
      }
      if (!(u > 306 && u < 386) && !(u > 530 && u < 606)) {
        if (i % 3 === 2 && u < 650) tether(u, bot - 5, "n", i % 2 ? [-60] : [-85, 85]);
        else prop("brazier_post", u, bot - 8, 0, 60);
      }
    }
  }
  // the north road, the way to the chief: braziers, and clan banners before the chief's yurt
  // and the long hall
  for (let v = 190; v <= 396; v += 34) {
    const l = edge(380, v, 1, 0)[0], r = edge(490, v, -1, 0)[0];
    if (v > 230 && v < 285) banner(l + 7, v, "e");
    else prop("brazier_post", l + 7, v, 0, 60);
    if (v > 255 && v < 330) banner(r - 7, v, "w");
    else prop("brazier_post", r - 7, v, 0, 60);
  }
  // the lanes: a brazier at each mouth and down their sides
  for (const [u, v] of [[221, 300], [250, 370], [222, 250], [325, 520], [367, 580], [330, 640], [550, 530], [593, 590], [562, 645]] as XY[]) prop("brazier_post", u, v, 0, 60);
  // the crossroads: the town's ovoo, a cairn hung with scarves, braziers either side
  prop("cairn", 434, 452, 30, 200, { s: 1.3 });
  for (const [u, v] of [[418, 470], [452, 432]] as XY[]) prop("brazier_post", u, v, 0, 60);
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
  prop("campfire", 578, 282, 20, 150);
  // the fur market along the back of the chief's yurt, carts and crates by it
  for (const v of [190, 222, 254]) prop("fur_stall", 541, v, FACE.e, 160);
  for (const v of [196, 228]) prop("fur_stall", 569, v, FACE.w, 160);
  for (const [u, v] of [[555, 172], [558, 268], [552, 240]] as XY[]) prop("common:crate", u, v, rnd() * 90, 40);
  prop("cart", 552, 300, FACE.s + 20, 200);
  prop("cart", 545, 345, FACE.n - 10, 200);
  for (const [u, v] of [[530, 285], [534, 290], [531, 318]] as XY[]) prop("common:crate", u, v, rnd() * 90, 40);
  // the horse lines and hay by the windmill
  prop("haystack", 682, 248, 10, 160);
  prop("haystack", 678, 278, 60, 160);
  for (const v of [302, 336]) tether(672, v, "w");
  graze(640, 362, 120);
  prop("drying_rack", 662, 355, FACE.n, 150);
  prop("haystack", 562, 176, 0, 160);
  prop("cart", 600, 176, FACE.e, 200);

  // the ways in: a path from the north road between the stable and the row, and one up from
  // the main road along the east wall
  for (let i = 0; i < 11; i++) for (let j = 0; j < 14; j++) put("trunrada:path_tile", P(SQ_U + (i + 0.5) * TILE, SQ_V + (j + 0.5) * TILE), 90 * Math.floor(rnd() * 4));
  for (let u = 470; u <= 520; u += TILE) put("trunrada:path_tile", P(u, 368), 90 * Math.floor(rnd() * 4));
  for (let v = 409; v >= 380; v -= TILE) put("trunrada:path_tile", P(674, v), 90 * Math.floor(rnd() * 4));

  // ---- the quarters: hay, carts, drying racks, fires, the old stones ----
  // north-west, the old quarter: lone standing stones older than the town
  prop("standing_stone", 240, 192, FACE.s + 15, 90);
  prop("standing_stone", 165, 178, FACE.e - 10, 90);
  prop("cairn", 305, 168, 0, 140);
  prop("drying_rack", 168, 212, FACE.e, 150);
  prop("campfire", 340, 290, 0, 150);
  prop("haystack", 150, 352, 0, 160);
  prop("cart", 300, 240, FACE.w, 200);
  // south-west, the horse quarter
  tether(255, 590, "n", [-85]);
  graze(172, 572, 40);
  graze(285, 655, -30);
  prop("haystack", 155, 530, 0, 160);
  prop("haystack", 225, 515, 40, 160);
  prop("drying_rack", 160, 600, FACE.e, 150);
  prop("cart", 280, 676, FACE.w, 200);
  prop("haystack", 150, 670, 0, 160);
  prop("campfire", 232, 676, 0, 150);
  // between the lanes, the tanners
  prop("drying_rack", 452, 550, FACE.n, 150);
  prop("drying_rack", 500, 552, FACE.n, 150);
  prop("drying_rack", 470, 660, FACE.e, 150);
  prop("campfire", 482, 630, 0, 150);
  prop("haystack", 425, 676, 0, 160);
  prop("cart", 515, 672, FACE.w, 200);
  // south-east
  prop("drying_rack", 662, 560, FACE.e, 150);
  prop("haystack", 666, 630, 0, 160);
  prop("cart", 648, 674, FACE.w, 200);
  prop("standing_stone", 672, 520, FACE.w, 90);

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
  }, { count: 110, spacing: 650 });

  // ---- inside: a few birches and bushes on the grass left between, stones in the grass ----
  // birch groves and bushes in the quarters, along the palisade and in the corners
  const TREES = ["Birch", "Birch", "Bush", "PineSmall", "Bush", "Birch", "Pine"];
  const grove = (u: number, v: number, n: number, spread = 22) => {
    for (let i = 0, k = 0; i < n && k < n * 6; k++) {
      const tu = u + (rnd() - 0.5) * 2 * spread, tv = v + (rnd() - 0.5) * 2 * spread, [x, y] = P(tu, tv);
      if (tu < 134 || tu > 692 || tv < 164 || tv > 690 || paved(x, y) || paved(x + 250, y) || paved(x - 250, y) || paved(x, y + 250) || paved(x, y - 250)) continue;
      if (prop(`flora:${TREES[Math.floor(rnd() * TREES.length)]}`, tu, tv, rnd() * 360, 130, { s: 0.7 + rnd() * 0.35 })) i++;
    }
  };
  for (const [u, v, n] of [
    [150, 200, 4], [300, 175, 3], [355, 165, 2], [150, 270, 2], [235, 335, 3], [340, 355, 2], [160, 430, 1],
    [150, 470, 0], [230, 640, 3], [160, 630, 3], [285, 690, 3], [345, 525, 0], [420, 560, 3], [440, 670, 3], [510, 690, 3],
    [500, 600, 2], [665, 600, 3], [680, 680, 4], [640, 540, 2], [690, 500, 2], [600, 690, 2], [530, 180, 0],
  ] as [number, number, number][]) grove(u, v, n);
  town.greens(ground, { x0: SOUTH, x1: NORTH, y0: EAST, y1: WEST }, { trees: ["Birch", "Bush", "Birch", "PineSmall", "Bush"], other: "common:rock_small", chance: 0.55, step: 480, margin: 500 });

  return town.finish({
    ground,
    sky: "#8d955f",
    flowers: {
      box: { x: SOUTH, y: EAST, w: NORTH - SOUTH, h: WEST - EAST },
      open: (x, y) => {
        // not on the earth paths into the gathering ground
        const u = 435 - y / S, v = 440 - x / S;
        if ((u > 460 && u < 530 && v > 359 && v < 377) || (u > 665 && u < 683 && v > 372 && v < 418)) return false;
        return ground.kind(x, y) === 0 && x > SOUTH + 300 && x < NORTH - 300 && y > EAST + 300 && y < WEST - 300;
      },
      density: 0.22 * quality.flowers,
    },
    // every gate is shut for now: a bar across the outer end of each passage
    late: [
      { kind: "closed", x: GATE_N[0] + 140, y: GATE_N[1], w: 100, d: 460, rot: 0 },
      { kind: "closed", x: GATE_W[0], y: GATE_W[1] + 140, w: 460, d: 100, rot: 0 },
      { kind: "closed", x: GATE_E[0], y: GATE_E[1] - 140, w: 460, d: 100, rot: 0 },
    ],
    bounds: { minX: SOUTH - 700, maxX: NORTH + 700, minY: EAST - 700, maxY: WEST + 700 },
    spawn: pt(412, 440),
    npcs: trunradaNpcs(),
    warps: [],
    closed: [
      { x: GATE_N[0] + 20, y: GATE_N[1], r: 220, text: "ประตูเหนือยังไม่เปิด ทางลงไปชายฝั่งทะเลเหนือกำลังสำรวจ" },
      { x: GATE_W[0], y: GATE_W[1] + 20, r: 220, text: "ประตูตะวันตกยังไม่เปิด ทางข้ามเขาไปไอซ์เบิร์กกำลังสำรวจ" },
      { x: GATE_E[0], y: GATE_E[1] - 20, r: 220, text: "ประตูตะวันออกยังไม่เปิด ทุ่งสเตปป์ตะวันออกกับทางลงไปคราเดียกำลังสำรวจ" },
    ],
    labels: [
      { ...pt(452, 300), text: "กระโจมหัวหน้าเผ่า" },
      { ...pt(424, 236), text: "โถงบ้านยาว" },
      { ...pt(595, 274), text: "ลานชุมนุม" },
      { ...pt(607, 292), text: "วงหินโบราณ", kind: "small" },
      { ...pt(632, 232), text: "กังหันลม", kind: "small" },
      { ...pt(300, 300), text: "ย่านบ้านยาว", kind: "small" },
      { ...pt(225, 575), text: "ย่านคอกม้า" },
      { ...pt(470, 555), text: "ย่านช่างหนัง" },
      { ...pt(432, 470), text: "โอโบกลางเมือง", kind: "small" },
      { x: GATE_N[0] - 60, y: GATE_N[1], text: "ประตูเหนือ (ปิด)", kind: "gate" },
      { x: GATE_W[0], y: GATE_W[1] - 60, text: "ประตูตะวันตก (ปิด)", kind: "gate" },
      { x: GATE_E[0], y: GATE_E[1] + 60, text: "ประตูตะวันออก (ปิด)", kind: "gate" },
    ],
  });
}

// ---- the townsfolk, where the plan put its red dots (and a guard at the east gate, where it
// put none) ----
function trunradaNpcs(): NpcSpec[] {
  const at = (u: number, v: number) => {
    const [x, y] = P(u, v);
    return { x, y };
  };
  const guard = (top: string, hairColor = "ink") => ({ gender: "male", hair: "", hairColor, eyes: "amber", top, bottom: "bottom_warrior_cocoa" });
  return [
    { id: "trunrada_guard_n", ...at(454, 180), face: 180, name: "บาตาร์", title: "ทหารยามประตูเหนือ", role: "talk", look: guard("top_warrior_navy"),
      lines: ["ประตูเหนือยังไม่เปิด ทางลงไปชายฝั่งทะเลเหนือยังมีหมาป่าชุม", "เดินตรงลงไปตามถนนนี้ กระโจมแดงทางซ้ายมือคือกระโจมหัวหน้าเผ่า"] },
    { id: "trunrada_guard_w", ...at(143, 458), face: -90, name: "กันบาตาร์", title: "ทหารยามประตูตะวันตก", role: "talk", look: guard("top_warrior"),
      lines: ["ประตูตะวันตกปิดอยู่ ทางข้ามเขาไปไอซ์เบิร์กหิมะยังถล่มไม่หยุด", "ถ้าจะไปเมืองอื่น ไปหาผู้นำทางที่ทางแยกกลางเมืองสิ"] },
    { id: "trunrada_guard_e", ...at(688, 432), face: 90, name: "โบลด์", title: "ทหารยามประตูตะวันออก", role: "talk", look: guard("top_warrior_forest", "auburn"),
      lines: ["นอกประตูนี้คือทุ่งสเตปป์สุดลูกหูลูกตา ฝูงม้าป่าวิ่งอยู่ทั้งปี", "ลงใต้ไปตามชายแดนจะถึงคราเดีย ป้อมที่กันอสูรไว้ แต่ทางนั้นยังไม่เปิด"] },
    travelGuide("trunrada", P(399, 418), -150),
    { id: "trunrada_healer", ...at(382, 421), face: -60, name: "แม่หมอโอยุน", title: "หมอสมุนไพร · รักษาฟรี", role: "heal",
      look: { gender: "female", hair: "hime", hairColor: "silver", eyes: "teal", top: "top_priestess_forest", bottom: "bottom_priestess_forest" },
      lines: ["ควันสมุนไพรจากทุ่งหญ้าจะไล่ความเหนื่อยออกไปจากตัวเจ้า", "หายดีแล้ว ขอให้วิญญาณแห่งทุ่งหญ้าคุ้มครองเจ้า"] },
    { id: "trunrada_shop", ...at(569, 433), face: 180, name: "นารัน", title: "ร้านเครื่องมือ", role: "shop", sprite: "merchant",
      lines: ["ขนสัตว์ เชือก ยา และเสบียงเดินทาง มีครบในร้านนี้"] },
    { id: "trunrada_herder", ...at(267, 404), face: 0, name: "อัลตัน", title: "คนเลี้ยงม้า", role: "talk", look: guard("top_warrior_forest", "amber"),
      lines: ["ม้าของทรุนราดาวิ่งได้ทั้งวันไม่รู้จักเหนื่อย", "เด็กที่นี่ขี่ม้าเป็นก่อนเดินเป็นเสียอีก", "คอกม้าอยู่ย่านตะวันตกเฉียงใต้ ข้ามถนนใหญ่ไปนั่นแหละ"] },
    { id: "trunrada_elder", ...at(248, 276), face: 0, name: "ผู้เฒ่าเออร์เดเน", title: "ผู้เฒ่าเล่าตำนาน", role: "talk", look: guard("top_warrior_navy", "silver"),
      lines: ["วงหินในลานชุมนุมตั้งอยู่มาก่อนจะมีเมืองนี้ ไม่มีใครรู้ว่าใครตั้งไว้", "อักษรบนหินเรืองแสงสีฟ้าในคืนเดือนมืด", "บรรพบุรุษของเราตั้งกระโจมรอบหินนั้น แล้วเมืองก็โตขึ้นมาเอง"] },
    { id: "trunrada_girl", ...at(391, 478), face: 180, name: "ทูยา", title: "เด็กเลี้ยงแกะ", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "auburn", eyes: "amber", top: "top_rose", bottom: "bottom_cocoa" },
      lines: ["กังหันลมบนเนินบดแป้งให้ทั้งเมืองเลยนะ", "โตขึ้นฉันจะเป็นนักธนูบนหลังม้าเหมือนพี่ๆ", "โอโบตรงทางแยกนี่ ใครผ่านต้องวางหินเพิ่มหนึ่งก้อนแล้วเดินวนสามรอบ"] },
    { id: "trunrada_tanner", ...at(581, 500), face: 180, name: "ซอลองโก", title: "ช่างฟอกหนัง", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "blue", top: "top_adventurer_ochre", bottom: "bottom_adventurer_cocoa" },
      lines: ["ย่านนี้ตากหนังกับปลาไว้เต็มราว กลิ่นแรงหน่อยนะ", "ขนหมาป่าสีเทาจากทุ่งเหนืออุ่นที่สุดในหน้าหนาว", "หนังดีๆ ส่งลงใต้ไปขายถึงอีเดนเลย"] },
    { id: "trunrada_saddler", ...at(346, 597), face: -90, name: "บัตตูลกา", title: "ช่างทำอานม้า", role: "talk", look: guard("top_warrior", "teal"),
      lines: ["อานม้าทุกตัวในเมืองนี้ผ่านมือข้ามาแล้ว", "ถ้าจะออกทุ่ง อย่าลืมพกถุงน้ำกับเนื้อตากแห้งไปด้วย"] },
    { id: "trunrada_chief", ...at(455, 290), face: 90, name: "หัวหน้าเผ่าบาตู", title: "หัวหน้าเผ่าทรุนราดา", role: "talk", look: guard("top_warrior_navy", "crimson"),
      lines: ["ยินดีต้อนรับสู่ทรุนราดา เมืองของชนเผ่าแห่งทุ่งหญ้า", "พวกเราเฝ้าชายแดนตะวันออกเฉียงเหนือมาหลายชั่วคน", "ทุกฤดูใบไม้ร่วง เผ่าต่างๆ จะมาชุมนุมกันที่ลานกว้างหลังกระโจมของข้า"] },
  ];
}
