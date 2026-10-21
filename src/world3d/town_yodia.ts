// โยเดีย (Yodia), the second port of the kingdom, on the southern coast where the plains meet the
// jungle. Laid out as if drawn on the player's paper: a box of log palisade open to the sea on the
// south, cut into four by Harbour Road (from the north gate down to the quay) and Trade Road (from
// the jungle gate in the west to the east gate), with three gates and watchtowers. Arcaded
// shophouses line both roads, the market square at their crossing and the lanes south of it; the
// temple stands in its court in the north-east; the stilt houses of the jungle folk fill the west
// under palms and bamboo along plank paths. Along the quay the warehouses and the customs house
// face the sea in a row behind the stone wharf, with cranes, cargo, piers, fishing boats and two
// merchant ships; the fish market opens onto the quay at the west end, and a stone mole runs out
// to the lighthouse in the east. Ragnarok's Ayothaya and the old ports of the south set the mood.
//
// The plan is read in its own pixels (u right, v down, as drawn): north (up the page) is +X, east
// (right) is -Y, so the starting camera sees it as drawn. One plan pixel is 26 cm; the walled town
// is 164 x 153 m before TOWN_SCALE.

import * as THREE from "three";
import { material, defineMaterial } from "./textures";
import { buildPaved } from "./paved";
import type { Poly } from "./paved";
import { KIT as YODIA } from "./kits/yodia";
import { KIT as EDEN } from "./kits/eden";
import { Plan, TownBuilder, useKits, colourways, facing, FACE, travelGuide, protoOf, solidsOf } from "./town";
import type { Side, Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";

useKits(YODIA, EDEN);

// Colourways: the shophouses in the pastel plasters of the old southern ports, the warehouses in
// weathered, pale or tarred timber.
defineMaterial("YodiaTown_Pink", { map: "plaster", tint: "#efb7a8", bump: 0.6 });
defineMaterial("YodiaTown_Mint", { map: "plaster", tint: "#b4dcc4", bump: 0.6 });
defineMaterial("YodiaTown_Sky", { map: "plaster", tint: "#b3cfe3", bump: 0.6 });
defineMaterial("YodiaTown_White", { map: "plaster", tint: "#f4efe2", bump: 0.6 });
defineMaterial("YodiaTown_Peach", { map: "plaster", tint: "#f4c48e", bump: 0.6 });
defineMaterial("YodiaTown_Jade", { map: "wood", tint: "#3d7a5a", bump: 1.2 });
defineMaterial("YodiaTown_Navy", { map: "wood", tint: "#33507a", bump: 1.2 });
defineMaterial("YodiaTown_Oxblood", { map: "wood", tint: "#8a3328", bump: 1.2 });
defineMaterial("YodiaTown_RoofBrown", { map: "tiles", tint: "#9a5236", bump: 2.5 });
defineMaterial("YodiaTown_RoofClay", { map: "tiles", tint: "#d39a66", bump: 2.5 });
colourways({
  pink: { Yodia_Ochre: "YodiaTown_Pink", Yodia_Teal: "YodiaTown_Jade" },
  mint: { Yodia_Ochre: "YodiaTown_Mint", Yodia_Teal: "YodiaTown_Oxblood" },
  sky: { Yodia_Ochre: "YodiaTown_Sky", Yodia_Teal: "YodiaTown_Navy", RoofTerracotta: "YodiaTown_RoofBrown" },
  white: { Yodia_Ochre: "YodiaTown_White", RoofTerracotta: "YodiaTown_RoofClay" },
  peach: { Yodia_Ochre: "YodiaTown_Peach", Yodia_Teal: "YodiaTown_Navy", RoofTerracotta: "RoofRed" },
  grey: { WoodWarm: "WoodGrey", RoofTerracotta: "YodiaTown_RoofBrown" },
  pale: { WoodWarm: "WoodPale", Yodia_Teal: "YodiaTown_Oxblood" },
  tarred: { WoodWarm: "WoodShade", Yodia_Teal: "WoodRed" },
  // Eden's inn as the sailors' inn on the quay
  sailors: { RoofBlue: "RoofTerracotta", Eden_Plaster: "Yodia_Ochre", Eden_Shutter: "Yodia_Teal", Eden_PaintBlue: "LacquerRed", FabricBlue: "FabricRed" },
});

// ---- the plan's pixels -> the world: 26 cm a pixel, the crossroads near the origin ----
const { P, rect } = new Plan(26, 425, 405);
// the palisade (west, east, north) and the wharf's edge on the sea (south)
const W = 110, E = 740, N = 110, Q = 700;
const SEA = -60; // the water's surface, under the ground
const STEPS = [148, 262]; // dock steps down into the water by the fish market

export function buildYodia(quality: { flowers: number }): Town {
  const town = new TownBuilder(7);
  const { put, rnd, extra } = town;
  const post = (r = 22): SolidSpec[] => [{ kind: "post", x: 0, y: 0, r }];

  // ---- ground: roads (cobbles), plazas (flagstones), the sea (water) ----
  const roads: Poly[] = [
    rect(398, 110, 442, 640),   // Harbour Road, from the north gate down to the quay
    rect(396, 596, 444, 650),   // its foot, between the warehouses and the customs house
    rect(110, 318, 740, 354),   // Trade Road, from the jungle gate to the east gate
    rect(294, 354, 324, 640),   // Fish Lane, down to the fish market and the quay
    rect(618, 354, 648, 640),   // East Lane, down to the quay
    rect(442, 450, 740, 480),   // Market Street
    rect(442, 568, 740, 607),   // the lane behind the warehouses
    rect(355, 210, 398, 232),   // an alley into the stilt-house village
    rect(442, 210, 526, 232),   // an alley into the temple court
    rect(324, 470, 398, 490),   // an alley between Harbour Road and Fish Lane
    rect(528, 480, 548, 568),   // an alley from Market Street to the warehouses
    rect(398, -400, 442, 110),  // outside the gates
    rect(-400, 318, 110, 354),
    rect(740, 318, 1250, 354),
  ];
  const plazas: Poly[] = [
    rect(110, 640, 740, Q),     // the quay
    rect(690, Q, 730, 812),     // the mole out to the lighthouse
    rect(442, 354, 582, 450),   // the market square
    rect(130, 532, 294, 640),   // the fish market
    rect(526, 140, 596, 252),   // the temple court round the hall
    rect(540, 252, 582, 318),   // the path up to it from Trade Road
    rect(596, 150, 708, 228),   // the chedi's court
  ];
  const water: Poly[] = [rect(-600, Q, 690, 1100), rect(730, Q, 1450, 1100), rect(690, 812, 730, 1100), ...STEPS.map((u) => rect(u - 4.6, Q - 12.4, u + 4.6, Q))];
  const area = { x0: P(0, 1000)[0], x1: P(0, -420)[0], y0: P(1300, 0)[1], y1: P(-450, 0)[1] };
  const ground = buildPaved({ area, roads, plazas, water, base: "jungle", road: [0.80, 0.72, 0.60], plaza: [0.93, 0.87, 0.75] });

  // ---- the palisade: 6 m lengths of logs between watchtowers, three gates (all shut for now) ----
  const NORTH = P(0, N)[0], SHORE = P(0, Q)[0], WEST = P(W, 0)[1], EAST = P(E, 0)[1];
  const END = P(0, Q - 8)[0]; // the walls run down onto the quay to the water's edge
  const GATE_N: [number, number] = [NORTH, P(420, 0)[1]];
  const GATE_W: [number, number] = [P(0, 336)[0], WEST];
  const GATE_E: [number, number] = [P(0, 336)[0], EAST];
  const run = (a: [number, number], b: [number, number], out: Side, gaps: number[] = []) => town.wall(a, b, out, "yodia:palisade", { gaps, len: 600, gap: 800 });
  run([NORTH, WEST], [NORTH, EAST], "n", [WEST - GATE_N[1]]);
  run([NORTH, WEST], [END, WEST], "w", [NORTH - GATE_W[0]]);
  run([NORTH, EAST], [END, EAST], "e", [NORTH - GATE_E[0]]);
  const tower = (u: number, v: number, du: number, dv: number) => put("yodia:watchtower", P(u, v), facing(du, dv), { solid: [{ kind: "tower", x: 0, y: 0, w: 250, d: 250, rot: 0 }] });
  tower(W, N, -1, -1);
  tower(E, N, 1, -1);
  tower(W, Q - 10, -1, 0);
  tower(E, Q - 10, 1, 0);
  for (const u of [255, 585]) tower(u, N, 0, -1);
  for (const v of [210, 480]) {
    tower(W, v, -1, 0);
    tower(E, v, 1, 0);
  }
  // gates: log watchtowers either side of an open passage along the gate's own X
  const gateSolid: SolidSpec[] = [
    { kind: "gate", x: 0, y: -215, w: 190, d: 190, rot: 0 },
    { kind: "gate", x: 0, y: 215, w: 190, d: 190, rot: 0 },
  ];
  put("yodia:palisade_gate", GATE_N, FACE.n, { s: 1.3, solid: gateSolid });
  put("yodia:palisade_gate", GATE_W, FACE.w, { s: 1.3, solid: gateSolid });
  put("yodia:palisade_gate", GATE_E, FACE.e, { s: 1.3, solid: gateSolid });
  // guardian posts and torches just inside each gate
  for (const [u, v] of [[404, 128], [436, 128]]) put("yodia:guardian_post", P(u, v), FACE.s, { solid: post(48) });
  for (const [u, v] of [[128, 322], [128, 350]]) put("yodia:guardian_post", P(u, v), FACE.e, { solid: post(48) });
  for (const [u, v] of [[722, 322], [722, 350]]) put("yodia:guardian_post", P(u, v), FACE.w, { solid: post(48) });
  for (const [u, v] of [[402, 152], [438, 152], [152, 322], [152, 350], [698, 322], [698, 350]]) put("yodia:tiki_torch", P(u, v), rnd() * 360, { solid: post(16) });

  // ---- houses: shophouses wall to wall along the streets (alleys left open), the warehouses
  // and the customs house along the quay ----
  const STREET = ["shophouse", "shophouse_tall", "shophouse", "shophouse_narrow", "shophouse", "shophouse_tall", "shophouse_narrow", "shophouse"];
  const TINTS = ["", "pink", "mint", "sky", "white", "peach", "pink", "", "mint"];
  const HARBOUR = ["warehouse", "warehouse", "warehouse", "shophouse_tall"];
  const DOCK_TINTS = ["", "grey", "pale", "tarred", ""];
  // a row with the fronts on the plan line a -> b, facing `side`, the pieces in turn from `start`
  const terrace = (a: [number, number], b: [number, number], side: Side, pieces = STREET, start = 0, tints = TINTS) =>
    town.terrace(P(a[0], a[1]), P(b[0], b[1]), side, pieces, { start, kit: "yodia", tints, narrow: "shophouse_narrow", gap: pieces === HARBOUR || pieces[0] === "customs_house" ? 4 : 0 });
  // Harbour Road, north of the crossing (an alley each side: the village, the temple)
  terrace([398, 130], [398, 210], "e", STREET, 0);
  terrace([398, 232], [398, 318], "e", STREET, 4);
  terrace([442, 130], [442, 210], "w", STREET, 2);
  terrace([442, 232], [442, 318], "w", STREET, 5);
  // Trade Road, north side, west of the crossing
  terrace([250, 318], [360, 318], "s", STREET, 1);
  // Harbour Road, south of the crossing, and Fish Lane behind it
  terrace([398, 356], [398, 470], "e", STREET, 3);
  terrace([398, 490], [398, 594], "e", ["shophouse_tall", "shophouse", "shophouse", "shophouse_narrow"]);
  terrace([324, 356], [324, 470], "w", STREET, 6);
  terrace([324, 490], [324, 594], "w", STREET, 1);
  // round the market square, Trade Road and Market Street east of it
  terrace([582, 356], [582, 450], "w", ["shophouse_tall", "shophouse", "shophouse"]);
  terrace([648, 354], [730, 354], "n", STREET, 4);
  terrace([648, 450], [730, 450], "s", STREET, 2);
  // Market Street south side, and the row facing the lane behind the warehouses
  terrace([444, 480], [528, 480], "n", STREET, 5);
  terrace([548, 480], [618, 480], "n", STREET, 0);
  terrace([648, 480], [730, 480], "n", STREET, 3);
  terrace([444, 568], [528, 568], "s", STREET, 7);
  terrace([548, 568], [618, 568], "s", STREET, 2);
  terrace([648, 568], [730, 568], "s", STREET, 6);
  // the waterfront: warehouses, the customs house at the foot of Harbour Road
  terrace([335, 650], [398, 650], "s", HARBOUR, 0, DOCK_TINTS);
  terrace([444, 650], [618, 650], "s", ["customs_house", ...HARBOUR], 0, DOCK_TINTS);
  terrace([648, 650], [730, 650], "s", ["eden:inn", "warehouse"], 0, ["sailors"]);

  // ---- the stilt-house village of the jungle folk (west), along plank paths ----
  const stilt = (u: number, v: number, f: number) => put("yodia:stilt_house", P(u, v), f + (rnd() - 0.5) * 8);
  // along the path in from the alley (north of Trade Road)
  for (const [u, v] of [[332, 196], [291, 191], [249, 198], [207, 192], [163, 197]]) stilt(u, v, FACE.s);
  for (const [u, v] of [[320, 248], [278, 251], [236, 247]]) stilt(u, v, FACE.n);
  put("yodia:longhouse", P(178, 290), FACE.s);
  for (let u = 356; u > 140; u -= 15.4) put("yodia:plank_path", P(u, 221), 0);
  for (let v = 236; v < 268; v += 15.4) put("yodia:plank_path", P(178, v), 90);
  for (const [u, v] of [[345, 212], [300, 232], [258, 212], [216, 232], [174, 212], [150, 240]]) put("yodia:tiki_torch", P(u, v), rnd() * 360, { solid: post(16) });
  put("yodia:guardian_post", P(200, 238), FACE.n, { solid: post(48) });
  put("yodia:spirit_house", P(140, 205), FACE.e, { solid: post(30) });
  // south of Trade Road, between the jungle gate and Fish Lane
  for (const u of [152, 200, 248]) stilt(u, 378, FACE.n);
  for (const v of [418, 458]) stilt(277, v, FACE.e);
  for (const u of [158, 210]) stilt(u, 496, FACE.s);
  put("yodia:longhouse", P(190, 440), FACE.e);
  for (let v = 400; v < 512; v += 15.4) put("yodia:plank_path", P(240, v), 90);
  for (let u = 226; u > 140; u -= 15.4) put("yodia:plank_path", P(u, 470), 0);
  for (const [u, v] of [[232, 410], [248, 450], [232, 490], [150, 462]]) put("yodia:tiki_torch", P(u, v), rnd() * 360, { solid: post(16) });
  put("yodia:spirit_house", P(140, 408), FACE.e, { solid: post(30) });
  put("yodia:guardian_post", P(262, 498), FACE.w, { solid: post(48) });

  // ---- plants scattered over a plan box on the open ground, clear of everything standing and
  // of the plank paths in `keep` ----
  const keep: [number, number, number, number][] = [
    [140, 216, 362, 226], [174, 226, 183, 274], [235, 395, 245, 515], [140, 465, 232, 475], // plank paths
  ];
  const scatter = (u0: number, v0: number, u1: number, v1: number, n: number, kinds: string[], clear = 150, size: [number, number] = [0.7, 1.05]) => {
    const solids = town.puts.flatMap((pl) => solidsOf(pl, protoOf(pl.ref, pl.colours)));
    const blocked = (x: number, y: number, r: number) => solids.some((sp) => {
      if ("r" in sp) return Math.hypot(sp.x - x, sp.y - y) < sp.r + r;
      const a = (sp.rot * Math.PI) / 180, dx = x - sp.x, dy = y - sp.y;
      return Math.abs(dx * Math.cos(a) + dy * Math.sin(a)) < sp.w / 2 + r && Math.abs(-dx * Math.sin(a) + dy * Math.cos(a)) < sp.d / 2 + r;
    });
    for (let i = 0, placed = 0; i < n * 10 && placed < n; i++) {
      const u = u0 + rnd() * (u1 - u0), v = v0 + rnd() * (v1 - v0), [x, y] = P(u, v);
      if ([[0, 0], [160, 0], [-160, 0], [0, 160], [0, -160]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0)) continue;
      if (keep.some(([a0, b0, a1, b1]) => u > a0 - 4 && u < a1 + 4 && v > b0 - 4 && v < b1 + 4) || blocked(x, y, clear)) continue;
      const kind = kinds[Math.floor(rnd() * kinds.length)];
      const low = kind === "JungleBush";
      put(`flora:${kind}`, [x, y], rnd() * 360, { s: size[0] + rnd() * (size[1] - size[0]), solid: low ? "none" : "auto" });
      solids.push({ kind: "tree", x, y, r: low ? 60 : 90 });
      placed++;
    }
  };

  // ---- streets: palms and red lantern posts ----
  const lanterns = (a: [number, number], b: [number, number], step: number, palms = true, skip: (u: number, v: number) => boolean = () => false) => {
    const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let i = 0; i <= n; i++) {
      const u = a[0] + ((b[0] - a[0]) * i) / n, v = a[1] + ((b[1] - a[1]) * i) / n;
      if (skip(u, v)) continue;
      const along = facing(b[0] - a[0], b[1] - a[1]) + 90; // the crossarm along the street
      if (i % 2 || !palms) put("yodia:lantern_post", P(u, v), along, { solid: post(22) });
      else put(rnd() < 0.5 ? "flora:PalmTall" : "flora:Palm", P(u, v), rnd() * 360, { s: 0.8 + rnd() * 0.2 });
    }
  };
  const nearCross = (_u: number, v: number) => (v > 205 && v < 238) || (v > 310 && v < 362) || (v > 465 && v < 495);
  lanterns([409, 170], [409, 590], 30, true, nearCross);
  lanterns([431, 170], [431, 590], 30, true, (u, v) => nearCross(u, v) || (v > 352 && v < 452));
  lanterns([260, 342], [395, 342], 34, false);
  lanterns([590, 330], [730, 330], 35, false, (u) => u > 612 && u < 652);
  lanterns([450, 465], [730, 465], 40, false, (u) => (u > 520 && u < 556) || (u > 612 && u < 652));
  lanterns([299, 372], [299, 622], 50, false, (_u, v) => v > 462 && v < 498);
  lanterns([623, 372], [623, 622], 50, false, (_u, v) => v > 445 && v < 485);
  lanterns([460, 601], [720, 601], 52, false, (u) => u > 612 && u < 652);
  // palms along Trade Road through the village, to the jungle gate
  for (const [u, v] of [[170, 314], [212, 312], [240, 312], [170, 358], [222, 360], [270, 360]]) put(rnd() < 0.5 ? "flora:PalmTall" : "flora:PalmBent", P(u, v), rnd() * 360, { s: 0.85 });

  // ---- the market square: fruit stalls in two rows, a sala in the middle ----
  for (let u = 452; u <= 570; u += 16.5) {
    put("yodia:fruit_stall", P(u, 366), FACE.s);
    if (u < 500 || u > 530) put("yodia:fruit_stall", P(u, 440), FACE.n);
  }
  put("yodia:sala", P(512, 404), FACE.e);
  put("flora:JungleTree", P(462, 404), 40, { s: 0.75 });
  put("flora:PalmTall", P(545, 404), 200, { s: 0.85 });
  put("common:market_cart", P(552, 382), FACE.w);
  put("yodia:cargo_pile", P(558, 426), 30, { s: 0.7 });
  put("yodia:spirit_house", P(573, 402), FACE.w, { solid: post(30) });
  for (const [u, v] of [[446, 358], [576, 358]]) put("yodia:lantern_post", P(u, v), 0, { solid: post(22) });
  for (const [u, v] of [[484, 386], [484, 424]]) put("common:bench", P(u, v), FACE.e);

  // ---- the fish market: stalls back to back down the middle and along both sides, the catch
  // in crates and barrels, torches ----
  for (const v of [552, 573, 594, 615]) {
    put("yodia:fish_stall", P(206, v), FACE.w);
    put("yodia:fish_stall", P(222, v), FACE.e);
  }
  for (const v of [556, 584, 612]) {
    put("yodia:fish_stall", P(145, v), FACE.e);
    put("yodia:fish_stall", P(280, v), FACE.w);
  }
  put("yodia:fruit_stall", P(214, 538), FACE.n);
  for (const [u, v] of [[175, 541], [252, 541], [175, 630], [252, 630]]) put("yodia:tiki_torch", P(u, v), rnd() * 360, { solid: post(16) });
  for (const [u, v] of [[140, 538], [146, 630], [286, 538], [282, 630], [190, 625]]) put("common:crate", P(u, v), rnd() * 90);
  put("yodia:cargo_pile", P(160, 655), 80, { s: 0.8 });
  put("yodia:cargo_pile", P(268, 652), 10, { s: 0.75 });

  // ---- the jungle's edge: thick planting round the village and along the palisade ----
  const JUNGLE = ["JungleTree", "Bamboo", "PalmTall", "JungleBush", "Palm", "JungleBush", "Bamboo"];
  const VILLAGE = ["Palm", "PalmBent", "JungleBush", "Bamboo", "PalmTall", "JungleBush"];
  scatter(118, 118, 360, 172, 30, JUNGLE, 120);
  scatter(118, 172, 360, 300, 26, VILLAGE, 110, [0.6, 0.9]);
  scatter(118, 358, 292, 516, 26, VILLAGE, 110, [0.6, 0.9]);

  // ---- the temple (north-east): the hall facing Trade Road across its forecourt, the great
  // chedi in its own court with a little chedi at each corner, salas, a monk's stilt house and
  // a bodhi tree ----
  put("yodia:wat_hall", P(561, 205), FACE.s);
  put("yodia:chedi", P(655, 189), FACE.s);
  for (const u of [614, 696]) for (const v of [164, 216]) put("yodia:chedi", P(u, v), FACE.s, { s: 0.36 });
  put("yodia:sala", P(503, 292), FACE.e);
  put("yodia:sala", P(620, 292), FACE.w);
  put("yodia:stilt_house", P(688, 268), FACE.w + 4);
  put("yodia:spirit_house", P(530, 312), FACE.s, { solid: post(30) });
  put("flora:JungleTree", P(700, 305), 120, { s: 1.0 });
  put("flora:JungleTree", P(500, 160), 30, { s: 0.9 });
  put("flora:JungleTree", P(503, 238), 200, { s: 0.75 });
  for (const [u, v, k] of [[600, 262, "PalmTall"], [528, 270, "Palm"], [598, 310, "JungleBush"], [490, 312, "JungleBush"], [650, 312, "PalmTall"]] as [number, number, string][]) put(`flora:${k}`, P(u, v), rnd() * 360, { s: 0.85 });
  for (const v of [262, 286, 310]) for (const u of [546, 576]) put("yodia:lantern_post", P(u, v), FACE.s, { solid: post(22) });
  for (const [u, v] of [[536, 150], [586, 150], [612, 190], [698, 190]]) put("yodia:tiki_torch", P(u, v), rnd() * 360, { solid: post(16) });

  // ---- the harbour: the wharf, the mole, piers, ships, cranes, cargo, the lighthouse ----
  // stone wharf along plan a -> b, its sea face on that line facing `out`, cut to length; dock
  // steps where `steps` says (plan positions along the line, 4 m each)
  const wharf = (a: [number, number], b: [number, number], out: Side, steps: number[] = []) => {
    const A = P(a[0], a[1]), B = P(b[0], b[1]);
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L;
    const r = (FACE[out] * Math.PI) / 180, back = 250; // the piece's middle 2.5 m back from its face
    const at = (t: number): [number, number] => [A[0] + ux * t + Math.cos(r) * back, A[1] + uy * t + Math.sin(r) * back];
    const cuts = steps.map((s) => Math.abs(P(s, a[1])[1] - A[1])).sort((p, q) => p - q); // (along an east-west line)
    const spans: [number, number][] = [];
    let from = 0;
    for (const c of cuts) {
      spans.push([from, c - 200]);
      put("yodia:dock_steps", at(c), FACE[out], { z: -34, solid: "none" });
      // the steps go down into the water: a hole in the quay over them, kept off with a solid
      const [x, y] = at(c);
      extra.push({ kind: "sea", x: x - 100, y, w: 330, d: 250, rot: 0 });
      from = c + 200;
    }
    spans.push([from, L]);
    for (const [s0, s1] of spans)
      for (let t = s0; t < s1 - 20; t += 800) {
        const len = Math.min(800, s1 - t);
        put("yodia:wharf", at(t + len / 2), FACE[out], { z: -34, sy: len / 800, solid: "none" });
      }
  };
  wharf([W - 4, Q], [690, Q], "s", STEPS);
  wharf([730, Q], [E + 4, Q], "s");
  wharf([690, Q + 4], [690, 812], "w");
  wharf([730, Q + 4], [730, 812], "e");
  wharf([686, 812], [734, 812], "s");
  // the shore outside the walls: boulders along the water's edge
  for (let u = W - 12; u > -120; u -= 15.4) put("yodia:shore_rocks", P(u, Q - 4), FACE.s + (rnd() - 0.5) * 20, { z: -30, solid: "none", s: 0.9 + rnd() * 0.3 });
  for (let u = E + 12; u < 970; u += 15.4) put("yodia:shore_rocks", P(u, Q - 4), FACE.s + (rnd() - 0.5) * 20, { z: -30, solid: "none", s: 0.9 + rnd() * 0.3 });
  // timber piers out into the sea
  const PIERS: [number, number][] = [[200, 5], [345, 6], [600, 6]];
  for (const [u, n] of PIERS) for (let i = 0; i < n; i++) put("yodia:pier", [SHORE - 200 - 400 * i, P(u, 0)[1]], 90, { z: -36, solid: "none" });
  // the lighthouse at the mole's end, its door toward the town
  put("yodia:lighthouse", P(710, 836), FACE.n, { z: -20, solid: [{ kind: "tower", x: -130, y: 0, r: 420 }, { kind: "tower", x: 275, y: 0, w: 440, d: 420, rot: 0 }] });
  // ships: a merchantman along the main wharf by the customs house, another at the east pier
  put("yodia:ship", P(480, 718), FACE.e, { z: SEA });
  put("yodia:ship", P(625, 752), FACE.s, { z: SEA });
  // fishing boats and canoes by the fish market, a sailboat and rowboats at the middle pier
  put("yodia:fishing_boat", P(186, 735), 180 + 4, { z: SEA - 8 });
  put("yodia:fishing_boat", P(214, 750), 3, { z: SEA - 8 });
  put("yodia:fishing_boat", P(186, 770), 176, { z: SEA - 8 });
  put("yodia:outrigger_canoe", P(150, 712), 92, { z: SEA });
  put("yodia:outrigger_canoe", P(262, 712), 86, { z: SEA });
  put("yodia:outrigger_canoe", P(240, 760), 10, { z: SEA });
  put("eden:sailboat", P(363, 760), 0, { z: SEA - 30 });
  put("eden:rowboat", P(330, 730), 175, { z: SEA - 18 });
  put("yodia:fishing_boat", P(560, 760), 182, { z: SEA - 8 });
  put("yodia:outrigger_canoe", P(660, 780), 8, { z: SEA });
  // cranes on the quay's edge, their jibs out over the water
  for (const u of [520, 588, 365]) put("yodia:crane", P(u, Q - 7), FACE.s, { solid: [{ kind: "crane", x: 0, y: 0, w: 300, d: 300, rot: 0 }] });
  // cargo, crates and barrels on the quay
  for (const [u, v, h] of [[470, 672, 0], [556, 668, 90], [636, 676, 10], [372, 668, 80], [300, 672, 0], [705, 690, 0]]) put("yodia:cargo_pile", P(u, v), h);
  for (const [u, v] of [[490, 662], [575, 680], [310, 660], [640, 663], [724, 678], [395, 690], [262, 660], [232, 672]]) put("common:crate", P(u, v), rnd() * 90);
  for (const [u, v] of [[598, 676], [338, 664], [726, 664], [130, 660]]) put("eden:cargo_stack", P(u, v), rnd() * 90);
  put("common:market_cart", P(615, 668), 70);
  for (const [u, v] of [[540, 658], [600, 658]]) put("common:bench", P(u, v), FACE.s);
  // the foot of Harbour Road: lanterns, a sign, a fruit seller for the sailors
  for (const u of [403, 437]) put("yodia:lantern_post", P(u, 646), 90, { solid: post(22) });
  put("common:sign_post", P(398, 644), 200);
  put("yodia:fruit_stall", P(521, 665), FACE.s);
  put("yodia:cargo_pile", P(398, 684), 100, { s: 0.85 });
  put("eden:cargo_stack", P(450, 684), 15);
  for (const [u, v] of [[386, 676], [462, 676]]) put("common:crate", P(u, v), rnd() * 90);
  put("yodia:spirit_house", P(489, 657), FACE.s, { solid: post(30) });
  // harbour lamps along the edge and on the mole
  for (const u of [128, 205, 305, 412, 452, 548, 630, 680]) put("yodia:harbour_lamp", P(u, Q - 10), FACE.s, { solid: post(26) });
  for (const v of [730, 770, 800]) for (const u of [696, 724]) put("yodia:harbour_lamp", P(u, v), FACE.s, { solid: post(26) });
  // the sea is solid except along the piers and the mole
  {
    const x0 = P(0, 1000)[0], x1 = SHORE;
    const cuts = [...PIERS.map(([u, n]) => [u - 6, u + 6, Q + n * 15.4] as [number, number, number]), [690, 730, 812] as [number, number, number]];
    let u = -700;
    for (const [c0, c1, end] of cuts) {
      const [ya, yb] = [P(u, 0)[1], P(c0, 0)[1]];
      extra.push({ kind: "sea", x: (x0 + x1) / 2, y: (ya + yb) / 2, w: x1 - x0, d: ya - yb, rot: 0 });
      const xe = P(0, end)[0], [ca, cb] = [P(c0, 0)[1], P(c1, 0)[1]];
      extra.push({ kind: "sea", x: (x0 + xe) / 2, y: (ca + cb) / 2, w: xe - x0, d: ca - cb, rot: 0 });
      u = c1;
    }
    const [ya, yb] = [P(u, 0)[1], P(1500, 0)[1]];
    extra.push({ kind: "sea", x: (x0 + x1) / 2, y: (ya + yb) / 2, w: x1 - x0, d: ya - yb, rot: 0 });
  }

  // ---- the back gardens between the rows and the strips along the palisade ----
  const GARDEN = ["Palm", "JungleBush", "PalmBent", "JungleBush", "Bamboo"];
  scatter(444, 504, 732, 532, 14, GARDEN, 60, [0.55, 0.8]);
  scatter(648, 390, 732, 414, 4, GARDEN, 60, [0.55, 0.8]);
  scatter(700, 118, 734, 320, 8, JUNGLE, 90);
  scatter(700, 356, 734, 640, 8, GARDEN, 60, [0.6, 0.9]);
  scatter(478, 118, 524, 320, 6, VILLAGE, 90);

  // ---- the greens left between: palms, jungle trees, bamboo ----
  town.greens(ground, { x0: SHORE, x1: NORTH, y0: EAST, y1: WEST }, { trees: ["Palm", "PalmTall", "JungleTree", "PalmBent", "Bamboo", "PalmTall"], other: "flora:JungleBush", chance: 0.75, step: 430 });

  // ---- outside the walls: thick jungle ----
  town.woods({ x0: SHORE + 300, x1: NORTH + 4500, y0: EAST - 4500, y1: WEST + 4500 }, ["JungleTree", "JungleTree", "PalmTall", "Bamboo", "JungleBush", "JungleTree", "Palm", "JungleBush", "PalmBent"], (x, y) => {
    const inside = x < NORTH + 800 && y > EAST - 800 && y < WEST + 800;
    const road = (Math.abs(y - GATE_N[1]) < 750 && x > NORTH) || (Math.abs(x - GATE_W[0]) < 700 && (y > WEST || y < EAST));
    return inside || road || x < SHORE + 500;
  }, { count: 700, tries: 9000, spacing: 330 });

  // ---- build ----
  // the sea reaches a little under the land, for the steps and the edges cut into it
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(16000, 50000).rotateX(-Math.PI / 2), material("WaterSea"));
  sea.position.set(SHORE - 7000, SEA, 0);
  sea.receiveShadow = true;
  const pt = (u: number, v: number) => ({ x: P(u, v)[0], y: P(u, v)[1] });
  return town.finish({
    ground,
    scenery: [sea],
    sky: "#35582c",
    flowers: {
      box: { x: SHORE, y: EAST, w: NORTH - SHORE, h: WEST - EAST },
      open: (x, y) => ground.kind(x, y) === 0 && x < NORTH - 400 && x > SHORE + 400 && y < WEST - 400 && y > EAST + 400,
      density: 0.3 * quality.flowers,
    },
    // all three gates are shut for now: a bar across the far end of each passage (the gate
    // towers' solids reach 124 cm out from the palisade's line)
    late: [
      { kind: "closed", x: GATE_N[0] + 220, y: GATE_N[1], w: 200, d: 600, rot: 0 },
      { kind: "closed", x: GATE_W[0], y: GATE_W[1] + 220, w: 600, d: 200, rot: 0 },
      { kind: "closed", x: GATE_E[0], y: GATE_E[1] - 220, w: 600, d: 200, rot: 0 },
    ],
    bounds: { minX: P(0, 870)[0], maxX: NORTH + 700, minY: EAST - 700, maxY: WEST + 700 },
    spawn: pt(422, 660),
    npcs: yodiaNpcs(),
    warps: [],
    closed: [
      { x: GATE_N[0] + 60, y: GATE_N[1], r: 260, text: "ประตูเหนือยังไม่เปิด ทางขึ้นไปทะเลทรายบาฮามัสกำลังสำรวจอยู่" },
      { x: GATE_W[0], y: GATE_W[1] + 60, r: 260, text: "ประตูป่ายังไม่เปิด ป่าแดนใต้ข้างนอกรกและอันตราย กำลังถางทางอยู่" },
      { x: GATE_E[0], y: GATE_E[1] - 60, r: 260, text: "ประตูตะวันออกยังไม่เปิด ทางเลียบชายฝั่งกำลังสำรวจ" },
    ],
    // names on the map window
    labels: [
      { ...pt(560, 660), text: "ท่าเรือโยเดีย" },
      { ...pt(486, 656), text: "ด่านศุลกากร", kind: "small" },
      { ...pt(510, 385), text: "ลานตลาด" },
      { ...pt(215, 580), text: "ตลาดปลา" },
      { ...pt(560, 270), text: "วัดท่าโยเดีย" },
      { ...pt(250, 230), text: "หมู่บ้านใต้ถุนสูง" },
      { ...pt(710, 800), text: "ประภาคาร", kind: "small" },
      { ...pt(420, 260), text: "ถนนท่าเรือ", kind: "small" },
      { ...pt(300, 336), text: "ถนนการค้า", kind: "small" },
      { ...pt(680, 465), text: "ถนนตลาด", kind: "small" },
      { ...pt(530, 588), text: "แนวโกดัง", kind: "small" },
      { ...pt(668, 664), text: "โรงเตี๊ยมชาวเรือ", kind: "small" },
      { x: GATE_N[0] - 150, y: GATE_N[1], text: "ประตูเหนือ (ปิด)", kind: "gate" },
      { x: GATE_W[0], y: GATE_W[1] - 150, text: "ประตูป่า (ปิด)", kind: "gate" },
      { x: GATE_E[0], y: GATE_E[1] + 150, text: "ประตูตะวันออก (ปิด)", kind: "gate" },
    ],
  });
}

// ---- townsfolk ----
function yodiaNpcs(): NpcSpec[] {
  const at = (u: number, v: number) => {
    const [x, y] = P(u, v);
    return { x, y };
  };
  const guard = (top: string) => ({ gender: "male", hair: "", hairColor: "ink", eyes: "amber", top, bottom: "bottom_warrior_cocoa" });
  // face: degrees in the world (0 = north, 90 = west, -90 = east, 180 = south)
  return [
    travelGuide("yodia", P(441, 658), 160, "เอลซ่า"),
    { id: "yodia_healer", ...at(402, 660), face: 170, name: "แม่หมอลำดวน", title: "หมอยาสมุนไพร · รักษาฟรี", role: "heal",
      look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "amber", top: "top_priestess_white", bottom: "bottom_priestess_white" },
      lines: ["ยาสมุนไพรจากป่าแดนใต้ หายเหนื่อยทันใจ", "เดินทางทางเรือมาไกล พักให้หายเมาคลื่นก่อนนะ"] },
    { id: "yodia_shop", ...at(403, 545), face: -90, name: "เจ๊กิมหงษ์", title: "ร้านเครื่องมือ", role: "shop", sprite: "merchant",
      lines: ["ของจากเรือสินค้าทุกทิศ มีครบที่ร้านนี้", "ยา เชือก คัมภีร์ ราคาท่าเรือ ไม่โก่งนะ"] },
    { id: "yodia_guard_n1", ...at(413, 140), face: 180, name: "ทหารยามพยัคฆ์", title: "ทหารยามประตูเหนือ", role: "talk", look: guard("top_warrior_forest"),
      lines: ["ประตูเหนือยังไม่เปิด ทางขึ้นไปทะเลทรายบาฮามัสกำลังสำรวจ", "ถนนท่าเรือตรงลงไปถึงท่าเรือเลย"] },
    { id: "yodia_guard_n2", ...at(427, 140), face: 180, name: "ทหารยามเสือดาว", title: "ทหารยามประตูเหนือ", role: "talk", look: guard("top_warrior_forest"),
      lines: ["พ้นทะเลทรายขึ้นไปอีกไกลถึงจะเป็นอีเดน เมืองหลวงของอาณาจักร", "กลางคืนอย่าออกไปนอกค่ายคนเดียว เสือในป่าดุนัก"] },
    { id: "yodia_guard_w", ...at(140, 330), face: -90, name: "ทหารยามเหยี่ยว", title: "ทหารยามประตูป่า", role: "talk", look: guard("top_warrior"),
      lines: ["นอกประตูนี้คือป่าแดนใต้ รกจนแสงแดดส่องไม่ถึงพื้น", "เสาเทพารักษ์สองต้นนี้คุ้มครองประตูมาตั้งแต่ตั้งเมือง"] },
    { id: "yodia_guard_e", ...at(710, 330), face: 90, name: "ทหารยามกระทิง", title: "ทหารยามประตูตะวันออก", role: "talk", look: guard("top_warrior"),
      lines: ["ทางเลียบชายฝั่งตะวันออกยังไม่เปิด", "ถ้าจะไปเกาะโอซากิ ต้องไปทางเรือเท่านั้น"] },
    { id: "yodia_fishwife", ...at(256, 580), face: 90, name: "ป้าจำปี", title: "แม่ค้าปลา", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "auburn", eyes: "amber", top: "top_adventurer_ochre", bottom: "bottom_adventurer_cocoa" },
      lines: ["ปลาสดเพิ่งขึ้นจากเรือเมื่อเช้า ปลากะพงตัวโตๆ ทั้งนั้น", "เรือประมงออกตอนตีสี่ กลับมาก็ขายกันตรงนี้เลย", "กุ้งกับปูจากป่าชายเลนก็มีนะ"] },
    { id: "yodia_fruit", ...at(500, 384), face: 180, name: "มะปราง", title: "แม่ค้าผลไม้", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "mint", eyes: "teal", top: "top_mint", bottom: "bottom_forest" },
      lines: ["มะม่วง สับปะรด มะพร้าว กล้วย ส่งตรงจากสวนชายป่า", "ลานตลาดนี้คึกคักที่สุดตอนเรือสินค้าเข้าเทียบท่า"] },
    { id: "yodia_captain", ...at(505, 690), face: -45, name: "กัปตันสมุทร", title: "นายเรือสำเภา", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "blue", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: ["โยเดียเป็นเมืองท่าใหญ่อันดับสองของอาณาจักร รองจากอีเดนเท่านั้น", "เรือข้ามมหาสมุทรใต้ไปเกาะโอซากิยังไม่ออก รอลมมรสุมเปลี่ยนก่อน", "ไม้สักกับเครื่องเทศจากโยเดียขายดีทุกท่า"] },
    { id: "yodia_customs", ...at(470, 658), face: 180, name: "ขุนด่านเพชร", title: "นายด่านศุลกากร", role: "talk",
      look: { gender: "male", hair: "", hairColor: "ink", eyes: "teal", top: "top_warrior_navy", bottom: "bottom_warrior_cocoa" },
      lines: ["สินค้าทุกหีบที่ขึ้นท่าต้องผ่านด่านศุลกากรก่อน", "นาฬิกาบนด่านนี้ตีบอกเวลาให้ทั้งท่าเรือ"] },
    { id: "yodia_nun", ...at(560, 268), face: 180, name: "แม่ชีมะลิ", title: "แม่ชีวัดท่าโยเดีย", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "silver", eyes: "teal", top: "top_priestess_white", bottom: "bottom_priestess_white" },
      lines: ["วิหารหลังนี้สร้างคู่กับเมือง ชาวเรือมาไหว้ขอพรก่อนออกทะเลทุกครั้ง", "เจดีย์ทรงระฆังองค์นั้นเก่าแก่กว่าท่าเรือเสียอีก"] },
    { id: "yodia_elder", ...at(240, 221), face: -90, name: "ตาเหล็ก", title: "ผู้เฒ่าหมู่บ้านชายป่า", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: ["บ้านใต้ถุนสูงกันน้ำหลากกับสัตว์ป่าได้ดีนัก", "พวกเราตัดไม้สักในป่าแดนใต้ ล่องลงมาขายที่ท่าเรือ", "เสาเทพารักษ์รูปนกเงือกคอยเฝ้าหมู่บ้านอยู่"] },
    { id: "yodia_osaki", ...at(650, 690), face: 90, name: "ฮานะ", title: "พ่อค้าจากโอซากิ", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "rose", eyes: "violet", top: "top_lilac", bottom: "bottom_wine" },
      lines: ["ฉันล่องเรือมาจากเกาะโอซากิทางตะวันออก มาซื้อเครื่องเทศกับไม้หอม", "ที่นี่ร้อนกว่าบ้านฉันเยอะเลย แต่ผลไม้อร่อยมาก"] },
    { id: "yodia_docker", ...at(345, 680), face: 135, name: "บุญมา", title: "กุลีท่าเรือ", role: "talk", look: guard("top_warrior_navy"),
      lines: ["ขนหีบขึ้นลงเรือทั้งวัน ปั้นจั่นช่วยได้เยอะ", "โกดังริมท่าเต็มไปด้วยข้าว ไม้สัก และผ้าไหม"] },
    { id: "yodia_keeper", ...at(710, 790), face: 0, name: "ลุงประทีป", title: "ผู้เฝ้าประภาคาร", role: "talk",
      look: { gender: "male", hair: "", hairColor: "gold", eyes: "blue", top: "top_warrior", bottom: "bottom_warrior_black" },
      lines: ["ไฟประภาคารนี้นำเรือเข้าท่ามาร้อยปีแล้ว", "จากยอดประภาคารมองเห็นป่าแดนใต้สุดลูกหูลูกตา"] },
  ];
}
