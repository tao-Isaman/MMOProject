// อีเดน (Eden), the starting city, laid out from the player's own plan (a hand-drawn map:
// a walled city cut into four quarters by two avenues that cross in the middle, a stone plaza
// in each quarter with houses round it, three gates, and a harbour quarter by the sea on the
// east). Ragnarok's Prontera and Alberta set the scale: wide tree-lined avenues, a cathedral,
// a market, a fountain plaza, piers with ships.
//
// The streets are an orderly grid: one straight cross of avenues of one width (the north-south
// avenue from gate to gate, the west-east avenue from the west gate through the crossroads to the
// quay and the ship's pier), a ring of the same width round the fountain plaza (its east side is
// the harbour street), alleys of one width centred on the rows into the plazas, and in the
// harbour quarter the harbour street and the quay side by side, joined by cross streets, with
// houses facing the street and warehouses facing the quay back to back between them.
//
// The plan is read in its own pixels (u right, v down, as drawn) and turned into the world:
// north (up the page) is +X, east (right) is -Y, so the starting camera sees it as drawn.
// One plan pixel is 18 cm, and the whole town (layout, houses, trees, everything in it) is then
// drawn at TOWN_SCALE, which makes the walled city about 150 x 128 m.
//
// Everything placed here comes from the town kits (src/world3d/kits); repeated pieces are drawn
// as instanced meshes in 50 m blocks, so a block off screen costs nothing.

import * as THREE from "three";
import { material, defineMaterial } from "./textures";
import { buildPaved } from "./paved";
import type { Poly } from "./paved";
import { KIT as EDEN } from "./kits/eden";
import { KIT as YODIA } from "./kits/yodia";
import { Plan, TownBuilder, useKits, fallbacks, colourways, facing, FACE, travelGuide, gateWay, waysOut, protoOf } from "./town";
import type { Side, Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";

useKits(EDEN, YODIA);

// Pieces the Eden kit may not have yet stand in for each other.
fallbacks({
  "eden:corner_house": "eden:townhouse", "eden:row_houses": "eden:townhouse", "eden:weapon_shop": "eden:townhouse_narrow",
  "eden:tool_shop": "eden:townhouse_narrow", "eden:guild_hall": "eden:inn", "eden:warehouse": "yodia:warehouse",
  "eden:cafe": "eden:townhouse_narrow", "eden:cafe_table": "common:bench", "eden:hedge": "flora:Bush", "eden:topiary": "flora:Bush",
  "eden:flower_bed": "eden:flower_planter", "eden:pergola": "common:bench", "eden:park_bench": "common:bench",
  "eden:kiosk": "eden:market_stall_cloth", "eden:notice_board": "common:sign_post", "eden:public_well": "common:gazebo",
  "eden:cargo_stack": "yodia:cargo_pile", "eden:guard_post": "eden:street_lamp",
});

// Colourways: the same houses with Prontera's red roofs, slate roofs, cream or yellow walls.
defineMaterial("EdenTown_PlasterCream", { map: "plaster", tint: "#f3e6c8", bump: 0.6 });
defineMaterial("EdenTown_PlasterYellow", { map: "plaster", tint: "#f4dfa0", bump: 0.6 });
defineMaterial("EdenTown_ShutterGreen", { map: "wood", tint: "#4f7d4a", bump: 1 });
defineMaterial("EdenTown_ShutterRed", { map: "wood", tint: "#a8453a", bump: 1 });
colourways({
  red: { RoofBlue: "RoofTerracotta", Eden_Shutter: "EdenTown_ShutterGreen", FabricBlue: "FabricRed" },
  slate: { RoofBlue: "RoofSlate", Eden_Plaster: "EdenTown_PlasterCream", Eden_Shutter: "EdenTown_ShutterRed" },
  cream: { RoofBlue: "RoofTerracotta", Eden_Plaster: "EdenTown_PlasterCream", Eden_Shutter: "EdenTown_ShutterRed", FabricBlue: "FabricGreen" },
  yellow: { Eden_Plaster: "EdenTown_PlasterYellow", FabricBlue: "FabricGold" },
});

// ---- the plan's pixels -> the world: 18 cm a pixel, the crossroads at the origin ----
const PX = 18;
const { P, rect, quarter } = new Plan(PX, 625, 565);

// ---- the grid, in plan pixels ----
// avenues 70 wide (12.6 m): the cross, the fountain plaza's ring and the harbour street
const NS: [number, number] = [590, 660]; // the north-south avenue (u), from the north gate to the south gate
const WE: [number, number] = [530, 600]; // the west-east avenue (v), from the west gate to the quay
const HS: [number, number] = [914, 984]; // the harbour street (u), outside the east wall: the ring's east side
const RS: [number, number] = [898, 968]; // the ring's south side (v), on through the harbour to the quay
const QUAY = 1080;                       // the quay's edge on the land side (u)
// alleys 25 wide (4.5 m), each in the middle of its row
const A_N: [number, number] = [299, 324];     // across the north avenue (v): into the cathedral green and the market
const A_W: [number, number] = [301, 326];     // across the west avenue (u): into the cathedral green and the hero's garden
const A_S: [number, number] = [802, 827];     // off the south avenue (v): into the hero's garden
const A_M: [number, number] = [760.5, 785.5]; // off the east avenue (u): into the market
// the harbour's blocks between the harbour street and the quay (v), and the cross streets 40
// wide (7.2 m) between them: one at each end, one between the two blocks south of the avenue
const DOCKS: [number, number][] = [[60, 225], [600, 729], [769, 898], [968, 1055]];
const CROSS: [number, number][] = [[20, 60], [729, 769], [1055, 1095]];
const F = 2; // the fronts of the rows stand this far back from a street's edge

export function buildEden(quality: { flowers: number }): Town {
  const town = new TownBuilder(11);
  const { put, rnd, extra } = town;
  const post = (r = 22): SolidSpec[] => [{ kind: "post", x: 0, y: 0, r }];

  // ---- ground: roads (cobbles), plazas (flagstones) and the harbour basin (water) ----
  const roads: Poly[] = [
    rect(-200, WE[0], QUAY, WE[1]),     // the west-east avenue, through the crossroads to the quay
    rect(NS[0], -200, NS[1], 1300),     // the north-south avenue, from outside the north gate to outside the south gate
    rect(HS[0], 20, HS[1], 1095),       // the harbour street
    rect(NS[1], RS[0], QUAY, RS[1]),    // the fountain plaza's ring, south side, on to the quay
    ...CROSS.map(([v0, v1]) => rect(HS[1], v0, QUAY, v1)), // the harbour's cross streets
    // the alleys, through the rows to the plazas
    rect(390, A_N[0], NS[0], A_N[1]), rect(NS[1], A_N[0], 720, A_N[1]),
    rect(A_W[0], 360, A_W[1], WE[0]), rect(A_W[0], WE[1], A_W[1], 750),
    rect(390, A_S[0], NS[0], A_S[1]),
    rect(A_M[0], 470, A_M[1], WE[0]),
  ];
  const P1 = quarter(150, 150, 335, 255);       // the cathedral plaza
  const P2 = rect(716, 150, 830, 474);          // the market
  const P3 = quarter(150, 900, 280, -200);      // the hero's garden
  const P4 = rect(NS[1], 667, HS[0], RS[0]);    // the fountain plaza (the inn's row along its top)
  const BASIN = { u0: 1040, v0: 250, u1: 1140, v1: 420 }; // the harbour basin, open to the sea
  const plazas: Poly[] = [P1, P2, P3, P4, rect(QUAY, 20, 1140, 1095), rect(HS[1], 225, 1140, 445)]; // and the quay, round the basin
  const SHORE = P(1140, 0)[1];
  const area = { x0: -15000, x1: 15500, y0: SHORE, y1: 17000 };
  const ground = buildPaved({ area, roads, plazas, water: [rect(BASIN.u0, BASIN.v0, BASIN.u1 + 40, BASIN.v1)] });
  // whether plan point (u, v) and r pixels round it are open grass (no road, plaza or water)
  const grass = (u: number, v: number, r = 6) => [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([du, dv]) => ground.kind(...P(u + du, v + dv)) === 0);

  // ---- the city wall: 8 m pieces between towers, gates cut into it where the avenues meet it ----
  const NORTH = P(0, 75)[0], SOUTH = P(0, 1045)[0], WEST = P(75, 0)[1], EAST = P(905, 0)[1];
  const EAST_END = P(0, 505)[0]; // the east wall stops short of the avenue down to the harbour
  const GATE_N: [number, number] = [NORTH, P(625, 0)[1]];
  const GATE_S: [number, number] = [SOUTH, P(625, 0)[1]];
  const GATE_W: [number, number] = [P(0, 565)[0], WEST];
  // a straight run of wall from a to b (world), its outside facing `out`, skipping gaps
  const run = (a: [number, number], b: [number, number], out: Side, gaps: number[] = []) => town.wall(a, b, out, "eden:city_wall", { gaps });
  const corner = (x: number, y: number) => put("eden:wall_tower", [x, y], 0, { solid: [{ kind: "tower", x: 0, y: 0, r: 330 }] });
  run([NORTH, WEST], [NORTH, EAST], "n", [WEST - GATE_N[1]]);
  run([NORTH, EAST], [EAST_END, EAST], "e");
  run([NORTH, WEST], [SOUTH, WEST], "w", [NORTH - GATE_W[0]]);
  run([SOUTH, WEST], [SOUTH, EAST], "s", [WEST - GATE_S[1]]);
  for (const [x, y] of [[NORTH, WEST], [NORTH, EAST], [SOUTH, WEST], [SOUTH, EAST], [EAST_END, EAST]] as [number, number][]) corner(x, y);
  // towers between: every 48 m or so along the long runs
  for (const y of [WEST - 4000, WEST - 8000, GATE_N[1] - 4000]) if (y > EAST + 1500) corner(NORTH, y);
  for (const x of [NORTH - 4400, GATE_W[0] - 4400]) corner(x, WEST);
  for (const y of [WEST - 4000, GATE_S[1] - 3000]) if (y > EAST + 1500) corner(SOUTH, y);
  corner((NORTH + EAST_END) / 2, EAST);
  // gates: towers either side of an open passage along the gate's own X
  const gateSolid: SolidSpec[] = [
    { kind: "gate", x: 0, y: -470, w: 640, d: 580, rot: 0 },
    { kind: "gate", x: 0, y: 470, w: 640, d: 580, rot: 0 },
  ];
  put("eden:city_gate", GATE_N, 180, { solid: gateSolid });
  put("eden:city_gate", GATE_S, 0, { solid: gateSolid });
  put("eden:city_gate", GATE_W, -90, { solid: gateSolid });

  // ---- houses: terraces wall to wall with their fronts along the streets, an alley left open
  // in the middle of each row along the avenues ----
  const STREET = ["townhouse", "townhouse_narrow", "corner_house", "townhouse_narrow", "row_houses", "townhouse", "townhouse_narrow"];
  // the harbour's blocks (as DOCKS): the houses facing the harbour street and the warehouses
  // facing the quay stand back to back, 96 px deep together, so only the shallower pieces
  const HOUSES = [["townhouse", "warehouse", "townhouse_narrow"], ["townhouse", "townhouse_narrow", "townhouse_narrow"], ["townhouse_narrow", "townhouse", "townhouse_narrow"], ["townhouse", "townhouse_narrow"]];
  const DOCK = [["warehouse", "warehouse"], ["warehouse", "townhouse"], ["townhouse", "warehouse"], ["warehouse"]];
  const TINTS = ["", "red", "slate", "cream", "yellow", "red", "cream"];
  const NARROW = "townhouse_narrow";
  const ref = (pc: string) => (pc.includes(":") ? pc : `eden:${pc}`);
  const width = (pc: string) => {
    const f = protoOf(ref(pc)).foot;
    return f.y1 - f.y0;
  };
  // a row with the fronts on the plan line a -> b, facing `side`, the pieces in turn from `start`;
  // centred on the line (what is left over split between the two ends) unless `centre` is false
  const terrace = (a: [number, number], b: [number, number], side: Side, pieces = STREET, start = 0, centre = true) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) * PX;
    let t = 0; // (as TownBuilder.terrace fills it)
    for (let i = start; ; i++) {
      let w = width(pieces[i % pieces.length]);
      if (t + w > L + 40) {
        w = width(NARROW);
        if (t + w > L + 40) break;
      }
      t += w + 4;
    }
    const k = centre && t > 0 ? (L - (t - 4)) / 2 / L : 0;
    const A: [number, number] = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    const B: [number, number] = [b[0] - (b[0] - a[0]) * k, b[1] - (b[1] - a[1]) * k];
    town.terrace(P(A[0], A[1]), P(B[0], B[1]), side, pieces, { start, kit: "eden", tints: TINTS, narrow: NARROW });
  };
  const [n0, n1] = [NS[0] - F, NS[1] + F], [w0, w1] = [WE[0] - F, WE[1] + F]; // the avenues' building lines
  // north-west: down the north avenue and along the west avenue, round the back of the
  // cathedral plaza
  terrace([n0, 98], [n0, A_N[0]], "e");
  terrace([n0, A_N[1]], [n0, w0], "e", STREET, 3);
  terrace([97, w0], [A_W[0], w0], "s", STREET, 1);
  terrace([A_W[1], w0], [n0 - 52, w0], "s", STREET, 4);
  terrace([330, 150], [532, 150], "s", STREET, 2);
  terrace([150, 330], [150, 466], "e", STREET, 5);
  // north-east: shop houses down the north avenue, round the market
  terrace([n1, 98], [n1, A_N[0]], "w", STREET, 2);
  terrace([n1, A_N[1]], [n1, w0], "w", STREET, 5);
  terrace([716, 150], [830, 150], "s", STREET, 3);
  terrace([830, 98], [830, 480], "w", STREET, 6);
  terrace([716, w0], [A_M[0], w0], "s", ["corner_house"]);
  terrace([A_M[1], w0], [830, w0], "s", ["corner_house"]);
  terrace([832, w0], [880, w0], "s", [NARROW]); // (on the corner by the end of the east wall)
  // south-west: along the west avenue (the guild hall) and down the south avenue (the weapon
  // shop), along the walls round the back of the garden
  terrace([97, w1], [A_W[0], w1], "n", ["row_houses", "townhouse", "guild_hall", "townhouse_narrow"]);
  terrace([A_W[1], w1], [n0 - 56, w1], "n", STREET, 2);
  terrace([n0, w1], [n0, A_S[0]], "e", ["weapon_shop", "townhouse", "townhouse_narrow", "corner_house"]);
  terrace([n0, A_S[1]], [n0, 1024], "e", STREET, 4);
  terrace([150, 660], [150, 1020], "e", STREET, 6);
  terrace([154, 970], [532, 970], "n", STREET, 0);
  // south-east: the inn, the tool shop and the café in a row along the top of the fountain
  // plaza; houses along the wall facing the ring
  terrace([n1, 667], [HS[0] - F, 667], "s", ["inn", "tool_shop", "cafe", "townhouse_narrow", "townhouse"], 0, false);
  terrace([670, RS[1] + F], [880, RS[1] + F], "n", STREET, 3);
  // the harbour quarter: in each block houses facing the harbour street and warehouses facing
  // the quay, back to back; the customs house on the corner of the avenue and the quay
  DOCKS.forEach(([v0, v1], i) => {
    terrace([HS[1] + F, v0 + F], [HS[1] + F, v1 - F], "w", HOUSES[i]);
    terrace([QUAY - F, v0 + F], [QUAY - F, v1 - F], "e", DOCK[i]);
  });
  terrace([HS[1], w0], [QUAY - F, w0], "s", ["townhouse_narrow", "yodia:customs_house"], 0, false);
  put("eden:notice_board", P(556, 536), FACE.s);

  // ---- the avenues: lamps and trees by turns down both sides, the alley mouths left open ----
  // a line every `step` from plan a to b (along u or v), leaving out what falls in `gaps`
  const avenue = (a: [number, number], b: [number, number], step: number, gaps: [number, number][] = []) => {
    const n = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step);
    for (let i = 0; i <= n; i++) {
      const u = a[0] + ((b[0] - a[0]) * i) / n, v = a[1] + ((b[1] - a[1]) * i) / n;
      const s = a[0] === b[0] ? v : u;
      if (gaps.some(([g0, g1]) => s > g0 && s < g1)) continue;
      if (i % 2) put("eden:street_lamp", P(u, v), a[0] === b[0] ? 0 : 90, { solid: post() });
      else put(rnd() < 0.5 ? "flora:RoundTree" : "flora:SmallTree", P(u, v), rnd() * 360, { s: 0.7 + rnd() * 0.15 });
    }
  };
  const [lw, le] = [NS[0] + 13, NS[1] - 13], [ln, ls] = [WE[0] + 13, WE[1] - 13]; // the lines, 13 px in from the edges
  for (const v of [ln, ls]) avenue([163.5, v], [513.5, v], 50, [[A_W[0] - 2, A_W[1] + 2]]);        // west
  for (const u of [lw, le]) avenue([u, 161.5], [u, 511.5], 50, [[A_N[0] - 2, A_N[1] + 2]]);        // north
  avenue([lw, 664.5], [lw, 964.5], 50, [[A_S[0] - 2, A_S[1] + 2]]);                                 // south
  avenue([le, 664.5], [le, 964.5], 50, [[RS[0] - 8, RS[1] + 8]]);
  avenue([673, ln], [873, ln], 50, [[A_M[0] - 2, A_M[1] + 2]]);                                     // east
  avenue([673, ls], [873, ls], 50);
  for (const v of [RS[0] + 13, RS[1] - 13]) avenue([673, v], [873, v], 50);                         // the ring's south side
  // the crossroads: a lamp on each corner and banners
  for (const u of [lw, le]) for (const v of [ln, ls]) put("eden:street_lamp", P(u, v), 45, { solid: post() });
  for (const [u, v] of [[594, 606], [656, 524]]) put("eden:banner_pole", P(u, v), facing(625 - u, 565 - v));
  // the harbour street: harbour lamps along its east side, by the houses
  for (const v of [100, 185, 487, 642, 687, 812, 855, 1011]) put("yodia:harbour_lamp", P(HS[1] - 9, v), 90, { solid: post() });

  // ---- the cathedral plaza (north-west) ----
  put("eden:cathedral", P(262, 232), facing(1, 1));
  for (const t of [0.12, 0.35, 0.6, 0.85]) {
    const a = t * (Math.PI / 2);
    put("eden:street_lamp", P(150 + 0.9 * 335 * Math.cos(a), 150 + 0.9 * 255 * Math.sin(a)), 0, { solid: post() });
    put(t < 0.5 ? "eden:park_bench" : "eden:flower_bed", P(150 + 0.75 * 335 * Math.cos(a + 0.2), 150 + 0.75 * 255 * Math.sin(a + 0.2)), facing(-Math.cos(a), -Math.sin(a)));
  }
  for (const [u, v] of [[310, 250], [270, 300]]) put("eden:banner_pole", P(u, v), facing(1, 1));
  put("eden:hero_statue", P(330, 300), facing(1, 1));
  // trees in the corner behind it, between the plaza and the walls
  for (const [u, v] of [[122, 125], [122, 210], [122, 290], [210, 122], [280, 122]])
    put(rnd() < 0.6 ? "flora:BigOak" : "flora:RoundTree", P(u, v), rnd() * 360, { s: 0.7 + rnd() * 0.2 });
  // the green between the plaza and the houses: trees along the alleys, flower beds and topiary
  for (const [u, v] of [[455, 288], [505, 288], [455, 335], [505, 335], [290, 420], [290, 455], [337, 420], [337, 455]])
    put(rnd() < 0.5 ? "flora:RoundTree" : "flora:Cherry", P(u, v), rnd() * 360, { s: 0.7 });
  for (const [u, v] of [[400, 415], [460, 415]]) put("eden:flower_bed", P(u, v), 0);
  for (const [u, v] of [[430, 385], [490, 385], [430, 445], [490, 445], [200, 445], [250, 445]]) put("eden:topiary", P(u, v), 0);

  // ---- the market (north-east): stalls in two rows facing the middle, the way in from the
  // north avenue left open ----
  for (let v = 182; v <= 438; v += 32) {
    if (v < A_N[0] - 8 || v > A_N[1] + 8) put(v % 64 === 54 ? "eden:market_stall_fruit" : "eden:market_stall_cloth", P(732, v), FACE.e);
    put(v % 64 === 54 ? "eden:market_stall_cloth" : "eden:market_stall_fruit", P(814, v), FACE.w);
  }
  for (const v of [270, 440]) put("common:market_cart", P(773, v), FACE.s);
  for (const v of [230, 355]) put("eden:street_lamp", P(773, v), 90, { solid: post() });
  put("eden:public_well", P(773, 178), 0);
  for (const u of [A_M[0] - 6, A_M[1] + 6]) put("eden:banner_pole", P(u, WE[0] + 3), FACE.s);

  // ---- the hero's garden (south-west) ----
  put("eden:pergola", P(205, 760), FACE.e);
  for (const [u, v, f] of [[260, 790, "s"], [330, 840, "w"], [220, 860, "e"], [300, 760, "n"]] as [number, number, Side][]) put("eden:park_bench", P(u, v), FACE[f]);
  for (const [u, v] of [[190, 820], [360, 870], [280, 880]]) put("eden:flower_bed", P(u, v), 0);
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2), u = 150 + 300 * Math.cos(a), v = 900 - 220 * Math.sin(a);
    if (grass(u, v, 12)) put("eden:hedge", P(u, v), facing(Math.cos(a), -Math.sin(a)) + 90);
  }
  for (const [u, v] of [[175, 700], [400, 760], [430, 860], [200, 940], [320, 945], [450, 940], [520, 700]])
    put(rnd() < 0.5 ? "flora:RoundTree" : "flora:Cherry", P(u, v), rnd() * 360, { s: 0.75 });
  for (const [u, v] of [[240, 715], [345, 712], [400, 700]]) if (grass(u, v, 3)) put("eden:topiary", P(u, v), 0);

  // ---- the fountain plaza (south-east), where newcomers arrive ----
  const FU = (NS[1] + HS[0]) / 2, FV = 795; // the fountain
  put("eden:fountain", P(FU, FV), 0, { s: 1.6, solid: [{ kind: "fountain", x: 0, y: 0, r: 320 }] });
  for (const u of [NS[1] + 14, HS[0] - 14]) for (const v of [682, RS[0] - 14]) put("eden:street_lamp", P(u, v), 45, { solid: post() });
  // a ring round the fountain: lamps on the diagonals, benches and flower beds between
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, du = Math.cos(a), dv = Math.sin(a);
    if (i % 2) put("eden:street_lamp", P(FU + du * 48, FV + dv * 48), 45, { solid: post() });
    else put("eden:park_bench", P(FU + du * 44, FV + dv * 44), facing(-du, -dv));
    put("eden:flower_bed", P(FU + Math.cos(a + 0.39) * 52, FV + Math.sin(a + 0.39) * 52), facing(-Math.cos(a + 0.39), -Math.sin(a + 0.39)) + 90);
  }
  // cherry trees and flower beds either side of it, trees down the plaza's sides
  for (const u of [FU - 65, FU + 65]) {
    for (const v of [FV - 35, FV + 35]) put("flora:Cherry", P(u, v), rnd() * 360, { s: 0.65 });
    put("eden:flower_bed", P(u, FV), 0);
  }
  for (const u of [NS[1] + 16, HS[0] - 16]) for (const v of [735, 835]) put("flora:RoundTree", P(u, v), rnd() * 360, { s: 0.7 });
  for (const [u, v] of [[770, 684], [796, 688]]) put("eden:cafe_table", P(u, v), rnd() * 90);
  for (const u of [NS[1] + 40, HS[0] - 40]) put("eden:kiosk", P(u, RS[0] - 18), FACE.n);
  for (const [u, v] of [[712, 683], [714, 695]]) put("common:crate", P(u, v), rnd() * 90);

  // ---- gates: guard posts ----
  for (const u of [lw, le]) {
    put("eden:guard_post", P(u, 108), FACE.s);
    put("eden:guard_post", P(u, 1018), FACE.n);
  }
  for (const v of [WE[0] + 8, WE[1] - 8]) put("eden:guard_post", P(108, v), FACE.e);

  // ---- the harbour: the quay, the basin, piers, ships, cargo, the lighthouse ----
  // quay walls (8 m each, the sea side facing `out`) from plan a to b, cut to length
  const quay = (a: [number, number], b: [number, number], out: Side) => {
    const A = P(a[0], a[1]), B = P(b[0], b[1]);
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L;
    const r = (FACE[out] * Math.PI) / 180;
    for (let t = 0; t < L - 20; t += 800) {
      const len = Math.min(800, L - t), mid = t + len / 2;
      // the piece is 4.2 m deep: its middle 2.1 m back from the water's edge
      put("eden:quay_wall", [A[0] + ux * mid + Math.cos(r) * 210, A[1] + uy * mid + Math.sin(r) * 210], FACE[out], { sy: len / 800, solid: "none" });
    }
  };
  quay([1140, 20], [1140, BASIN.v0], "e");
  quay([1140, BASIN.v1], [1140, 1095], "e");
  quay([BASIN.u0, BASIN.v0], [BASIN.u0, BASIN.v1], "e");
  quay([BASIN.u0, BASIN.v0], [1140, BASIN.v0], "s");
  quay([BASIN.u0, BASIN.v1], [1140, BASIN.v1], "n");
  const PIERS = [130, 560, 830];
  for (const v of PIERS) for (let i = 0; i < 6; i++) put("eden:pier", [P(0, v)[0], SHORE - 200 - 400 * i], 90, { z: -30, solid: "none" });
  put("yodia:ship", [P(0, 560)[0] - 470, SHORE - 1500], 90, { z: -12 });
  put("eden:sailboat", [P(0, 130)[0] + 380, SHORE - 900], 90, { z: -42 });
  put("eden:sailboat", [P(0, 830)[0] - 380, SHORE - 1300], -90, { z: -42 });
  put("eden:rowboat", [P(0, 830)[0] + 260, SHORE - 500], 80, { z: -30 });
  put("eden:rowboat", [P(0, 130)[0] - 260, SHORE - 700], 100, { z: -30 });
  // boats moored in the basin
  put("eden:sailboat", P(1060, 300), 0, { z: -42 });
  put("yodia:fishing_boat", P(1060, 385), 180, { z: -20 });
  put("eden:rowboat", P(1105, 300), 20, { z: -30 });
  put("eden:rowboat", P(1110, 380), -30, { z: -30 });
  put("eden:lighthouse", [P(0, 30)[0] - 300, SHORE - 900], 0, { z: -60 });
  put("yodia:crane", [P(0, 600)[0], SHORE + 300], 90);
  put("yodia:crane", P(1030, 430), 0);
  for (let v = 60; v < 1090; v += 110) if (v < BASIN.v0 - 20 || v > BASIN.v1 + 20) put("yodia:harbour_lamp", P(1128, v), 90, { solid: post() });
  for (const v of [270, 335, 400]) put("yodia:harbour_lamp", P(1028, v), 90, { solid: post() });
  for (const [u, v] of [[1100, 180], [1100, 470], [1100, 625], [1100, 760], [1095, 990], [1095, 1060]]) put("eden:cargo_stack", P(u, v), rnd() * 90);
  for (const [u, v] of [[1110, 210], [1110, 650], [1110, 880], [1030, 245], [1000, 300], [1000, 380]]) put("common:crate", P(u, v), rnd() * 90);
  // the sea is solid except along the piers, and so is the basin
  const seaX0 = P(0, 1100)[0], seaX1 = P(0, 10)[0];
  const cuts = PIERS.map((v) => P(0, v)[0]).sort((p, q) => p - q);
  let x = seaX0;
  for (const cx of [...cuts, seaX1 + 200]) {
    const x1 = Math.min(cx - 150, seaX1);
    if (x1 > x) extra.push({ kind: "sea", x: (x + x1) / 2, y: SHORE - 1400, w: x1 - x, d: 2800, rot: 0 });
    x = cx + 150;
  }
  // the pier ends
  for (const cx of cuts) extra.push({ kind: "sea", x: cx, y: SHORE - 2700, w: 400, d: 200, rot: 0 });
  {
    const [bx0, by0] = P(BASIN.u0, BASIN.v1), [bx1, by1] = P(BASIN.u1, BASIN.v0);
    extra.push({ kind: "sea", x: (bx0 + bx1) / 2, y: (by0 + by1) / 2, w: Math.abs(bx1 - bx0), d: Math.abs(by1 - by0), rot: 0 });
  }

  // ---- the garden's middle: a great oak ringed with flower beds, cherry trees, lamps ----
  put("flora:BigOak", P(255, 815), 30, { s: 1.25 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    put("eden:flower_bed", P(255 + Math.cos(a) * 30, 815 + Math.sin(a) * 30), facing(Math.cos(a), Math.sin(a)) + 90);
  }
  for (let i = 0; i < 6; i++) {
    const a = 0.15 + (i / 5) * (Math.PI / 2 - 0.3);
    put("flora:Cherry", P(150 + 220 * Math.cos(a), 900 - 150 * Math.sin(a)), rnd() * 360, { s: 0.6 + rnd() * 0.15 });
    if (i < 5) put("eden:street_lamp", P(150 + 240 * Math.cos(a + 0.15), 900 - 165 * Math.sin(a + 0.15)), 0, { solid: post() });
  }

  // ---- the greens left between: trees and flower beds wherever there is room ----
  town.greens(ground, { x0: SOUTH, x1: NORTH, y0: EAST, y1: WEST }, { trees: ["RoundTree", "SmallTree", "Cherry", "RoundTree", "BigOak"], other: "eden:flower_bed" });

  // ---- outside the walls: woods ----
  town.woods({ x0: -14000, x1: 14500, y0: SHORE + 200, y1: 17000 }, ["RoundTree", "BigOak", "SmallTree", "RoundTree", "Pine"], (x, y) => {
    const inside = x > SOUTH - 900 && x < NORTH + 900 && y < WEST + 900;
    const harbour = y < EAST + 300 && x > SOUTH - 1500;
    const road = (Math.abs(y - GATE_N[1]) < 900 && x > NORTH) || (Math.abs(y - GATE_S[1]) < 900 && x < SOUTH) || (Math.abs(x - GATE_W[0]) < 900 && y > WEST);
    return inside || harbour || road;
  });

  // ---- build ----
  // the sea reaches a little under the land too, for the basin cut into it
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(40000, 15000).rotateX(-Math.PI / 2), material("WaterSea"));
  sea.position.set(0, -12, -(SHORE - 4500));
  sea.receiveShadow = true;
  const pt = (u: number, v: number) => ({ x: P(u, v)[0], y: P(u, v)[1] });
  return town.finish({
    ground,
    scenery: [sea],
    sky: "#4f6e36",
    // flowers on the open grass inside the walls
    flowers: {
      box: { x: SOUTH, y: SHORE, w: NORTH - SOUTH, h: WEST - SHORE },
      open: (x, y) => ground.kind(x, y) === 0 && x < NORTH - 500 && x > SOUTH + 500 && y < WEST - 500 && y > EAST - 3000,
      density: 0.35 * quality.flowers,
    },
    bounds: { minX: SOUTH - 700, maxX: NORTH + 700, minY: SHORE - 2800, maxY: WEST + 1400 },
    spawn: pt(FU, 718),
    npcs: edenNpcs(town.doors),
    // out of the west gate to the first field; north up the royal road, south to the savanna
    ...waysOut([
      { warp: { x: GATE_W[0], y: WEST + 1050, r: 160, to: "field" }, back: { x: GATE_W[0], y: 8550 } },
      gateWay(GATE_N, "n", "royal_road", 480, 450),
      gateWay(GATE_S, "s", "south_savanna", 480, 450),
    ]),
    closed: [],
    // names on the map window
    labels: [
      { ...pt(262, 232), text: "มหาวิหาร" },
      { ...pt(773, 330), text: "ตลาด" },
      { ...pt(255, 760), text: "สวนวีรบุรุษ" },
      { ...pt(FU, 860), text: "ลานน้ำพุ" },
      { ...pt(625, 640), text: "สี่แยกกลางเมือง", kind: "small" },
      { ...pt(1110, 720), text: "ท่าเรือ" },
      { ...pt(1090, 335), text: "อู่จอดเรือ", kind: "small" },
      { x: GATE_N[0] + 150, y: GATE_N[1], text: "ประตูเหนือ · ถนนหลวง", kind: "gate" },
      { x: GATE_S[0] - 150, y: GATE_S[1], text: "ประตูใต้ · ทุ่งสะวันนา", kind: "gate" },
    ],
  });
}

// ---- townsfolk, where the plan put its red dots ----
function edenNpcs(doors: Record<string, [number, number]>): NpcSpec[] {
  const at = (u: number, v: number) => {
    const [x, y] = P(u, v);
    return { x, y };
  };
  const shopAt = doors.tool_shop ?? P(744, 677);
  const guard = (top: string) => ({ gender: "male", hair: "", hairColor: "ink", eyes: "blue", top, bottom: "bottom_warrior_black" });
  return [
    { id: "guard_n1", ...at(603, 125), face: 180, name: "ทหารยามโรแลนด์", title: "ทหารยามประตูเหนือ", role: "talk", look: guard("top_warrior_navy"),
      lines: ["ออกประตูเหนือไปคือถนนหลวงสู่ปราสาท แต่ปราสาทยังปิดซ่อมอยู่นะ", "ถนนหลวงแยกไปเชิงเขาหิมะทางเหนือ กับป่าสนริมแม่น้ำทางตะวันออก", "มือใหม่ล่าสไลม์ที่ทุ่งหญ้าตะวันตกก่อนดีกว่า"] },
    { id: "guard_n2", ...at(647, 125), face: 180, name: "ทหารยามเกรเกอร์", title: "ทหารยามประตูเหนือ", role: "talk", look: guard("top_warrior_navy"),
      lines: ["อีเดนเป็นเมืองหลวงของอาณาจักร ยินดีต้อนรับ", "เดินตรงลงไปจะเจอสี่แยกกลางเมือง"] },
    { id: "guard_w1", ...at(140, 540), face: -90, name: "ทหารยามเฮนริก", title: "ทหารยามประตูตะวันตก", role: "talk", look: guard("top_warrior"),
      lines: ["ออกประตูนี้ไปเป็นทุ่งหญ้าตะวันตก มีสไลม์อยู่เยอะ", "เดินเข้าวงแสงสีฟ้าตรงหน้าประตูเพื่อออกไปข้างนอก"] },
    { id: "guard_w2", ...at(140, 590), face: -90, name: "ทหารยามอลัน", title: "ทหารยามประตูตะวันตก", role: "talk", look: guard("top_warrior"),
      lines: ["สไลม์สีม่วงแรงกว่าสีอื่นนะ ระวังด้วย", "ถ้าบาดเจ็บ กลับมาหานักบวชที่สี่แยกได้"] },
    { id: "guide", ...at(572, 547), face: -135, name: "ลีน่า", title: "ผู้นำทาง", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "gold", eyes: "blue", top: "top_adventurer_teal", bottom: "bottom_adventurer_sand" },
      lines: ["ที่นี่คือสี่แยกกลางเมืองอีเดน", "มหาวิหารอยู่ทางตะวันตกเฉียงเหนือ ตลาดอยู่ตะวันออกเฉียงเหนือ", "ลานน้ำพุกับร้านเครื่องมืออยู่ทางตะวันออกเฉียงใต้ ท่าเรืออยู่ริมทะเลฝั่งตะวันออก",
        "ทุ่งล่าสไลม์ออกทางประตูตะวันตก ประตูเหนือไปถนนหลวง ประตูใต้ไปทุ่งสะวันนาและทะเลทราย", "ที่ท่าเรือมีเรือไปโยเดียกับเกาะโอซากิ"] },
    { id: "job_bishop", ...at(596, 584), face: 180, name: "มารดาเซเลสต์", title: "หัวหน้าบาทหลวง · เปลี่ยนอาชีพบาทหลวง", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "silver", eyes: "blue", top: "top_priestess_white", bottom: "bottom_priestess_white" },
      lines: ["แสงศักดิ์สิทธิ์เลือกผู้ที่มีศรัทธา นักบวชที่เลเวล 30 แล้วมาคุยกับข้าได้", "บาทหลวงมีสองทาง ขับไล่อันเดดด้วยแสง หรือรักษาและปกป้องผู้อื่น"] },
    { id: "healer", ...at(572, 584), face: -45, name: "ซิสเตอร์มาเรีย", title: "นักบวช · รักษาฟรี", role: "heal",
      look: { gender: "female", hair: "twintail", hairColor: "silver", eyes: "teal", top: "top_priestess_white", bottom: "bottom_priestess_white" },
      lines: ["ขอพรแห่งแสงจงคุ้มครองท่าน", "หายเหนื่อยแล้วนะ ไปผจญภัยต่อได้"] },
    { id: "job_jester", ...at(664, 522), face: 135, name: "ปิแอร์ตัวตลก", title: "หัวหน้าคณะละครเร่ · เปลี่ยนอาชีพตัวตลก", role: "talk",
      look: { gender: "male", hair: "", hairColor: "rose", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: ["ฮ่าๆ! มาดูโชว์ไหม หรืออยากขึ้นเวทีเอง?", "ตัวตลกเล่นกับโชคเก่ง ใครก็เป็นได้ เลเวล 30 แล้วมาหาข้า"] },
    { id: "adventurer", ...at(632, 505), face: 135, name: "คาร่า", title: "นักผจญภัย", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "rose", eyes: "amber", top: "top_adventurer", bottom: "bottom_adventurer" },
      lines: ["ได้ยินว่าโยเดียทางใต้มีเรือสินค้าลำใหญ่มาก", "เรือไปเกาะโอซากิออกจากท่าเรือนี่แหละ ไปหากัปตันมาร์โกสิ"] },
    { id: "merchant_boy", ...at(682, 562), face: 90, name: "ทอม", title: "เด็กส่งของ", role: "talk", look: guard("top_warrior_forest"),
      lines: ["ร้านอาวุธอยู่ถนนใต้ ร้านเครื่องมืออยู่ลานน้ำพุ", "ตลาดทางเหนือมีผ้ากับผลไม้ขายเยอะเลย"] },
    { id: "guard_s", ...at(630, 700), face: -90, name: "ทหารยามบรูโน", title: "ทหารยามลาดตระเวน", role: "talk", look: guard("top_warrior_navy"),
      lines: ["ออกประตูใต้ไปเป็นทุ่งสะวันนา เดินต่อลงไปถึงขอบทะเลทรายกับเมืองบาฮามัส", "ระวังของหายนะ ตลาดคนเยอะ"] },
    travelGuide("eden", P(755, 722), -150),
    { id: "shop", x: shopAt[0], y: shopAt[1], face: 180, name: "ลิเลีย", title: "ร้านเครื่องมือ", role: "shop", sprite: "merchant",
      lines: ["ยา เสื้อผ้า คัมภีร์ มีครบ เข้ามาดูก่อนได้"] },
    { id: "eden_smith", ...at(708, 700), face: 90, name: "กุนเธอร์", title: "ช่างตีเหล็ก · ตีบวก สร้างไอเทม", role: "smith", look: guard("top_warrior"),
      lines: ["เอาหินนภามาตีบวกอาวุธ หินดารามาตีบวกชุด ข้าคิดค่าจ้างไม่แพง", "มีแร่ หนัง หรือเศษอัญมณีพอเมื่อไร ข้าสร้างอุปกรณ์ให้ได้ ไม่เกินเลเวลของเจ้านะ"] },
    { id: "sailor", ...at(1105, 515), face: 90, name: "กัปตันมาร์โก", title: "เรือโดยสาร · โยเดีย โอซากิ", role: "travel", ports: ["yodia", "osaki"],
      look: { gender: "male", hair: "", hairColor: "auburn", eyes: "amber", top: "top_warrior", bottom: "bottom_warrior" },
      lines: ["ขึ้นเรือไหม ลงใต้ไปโยเดีย หรือข้ามทะเลไปเกาะโอซากิ", "เรือไปไอซ์เบิร์กยังไม่เปิด ทะเลเหนือน้ำแข็งเยอะเกินไป"] },
  ];
}
