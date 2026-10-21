// อีเดน (Eden), the starting city, laid out from the player's own plan (a hand-drawn map:
// a walled city cut into four quarters by two avenues that cross in the middle, a stone plaza
// in each quarter with houses round it, three gates, and a harbour quarter by the sea on the
// east). Ragnarok's Prontera and Alberta set the scale: wide tree-lined avenues, a cathedral,
// a market, a fountain plaza, piers with ships.
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
import { Plan, TownBuilder, useKits, fallbacks, colourways, facing, FACE, travelGuide } from "./town";
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
const { P, rect, quarter } = new Plan(18, 625, 565);

export function buildEden(quality: { flowers: number }): Town {
  const town = new TownBuilder(11);
  const { put, rnd, extra } = town;

  // ---- ground: roads (cobbles), plazas (flagstones) and the harbour basin (water) ----
  const roads: Poly[] = [
    rect(70, 520, 610, 605),    // the west avenue, from the west gate to the crossroads
    rect(585, 75, 655, 560),    // the north avenue, from the north gate
    rect(585, 520, 680, 615),   // the crossroads
    rect(610, 560, 680, 1045),  // the south avenue, to the south gate
    rect(610, 560, 920, 615),   // round the fountain plaza
    rect(610, 920, 920, 1005),
    rect(860, 560, 920, 1005),
    rect(905, 20, 1085, 1095),  // the harbour quarter, paved between its warehouses
    rect(-200, 520, 70, 605),   // outside the gates
    rect(585, -200, 655, 75),
    rect(610, 1045, 680, 1300),
    // the alleys between the houses into the plazas
    rect(537, 280, 585, 305), rect(290, 470, 315, 520), rect(655, 230, 708, 255), rect(655, 400, 708, 425),
    rect(760, 505, 800, 560), rect(290, 605, 315, 655), rect(560, 780, 610, 805),
  ];
  const P1 = quarter(175, 145, 310, 255);   // the cathedral plaza
  const P2 = rect(708, 150, 846, 508);      // the market
  const P3 = quarter(150, 900, 280, -200);  // the hero's garden
  const P4 = rect(680, 615, 860, 920);      // the fountain plaza
  const BASIN = { u0: 1040, v0: 250, u1: 1140, v1: 420 }; // the harbour basin, open to the sea
  const plazas: Poly[] = [P1, P2, P3, P4, rect(1080, 20, 1140, 1095)]; // and the quay
  const SHORE = P(1140, 0)[1];
  const area = { x0: -15000, x1: 15500, y0: SHORE, y1: 17000 };
  const ground = buildPaved({ area, roads, plazas, water: [rect(BASIN.u0, BASIN.v0, BASIN.u1 + 40, BASIN.v1)] });

  // ---- the city wall: 8 m pieces between towers, gates cut into it ----
  const NORTH = P(0, 75)[0], SOUTH = P(0, 1045)[0], WEST = P(75, 0)[1], EAST = P(905, 0)[1];
  const EAST_END = P(0, 545)[0]; // the east wall stops short of the road down to the harbour
  const GATE_N: [number, number] = [NORTH, P(620, 0)[1]];
  const GATE_S: [number, number] = [SOUTH, P(645, 0)[1]];
  const GATE_W: [number, number] = [P(0, 562)[0], WEST];
  // a straight run of wall from a to b (world), its outside facing `out`, skipping gaps
  const run = (a: [number, number], b: [number, number], out: Side, gaps: number[] = []) => town.wall(a, b, out, "eden:city_wall", { gaps });
  const corner = (x: number, y: number) => put("eden:wall_tower", [x, y], 0, { solid: [{ kind: "tower", x: 0, y: 0, r: 330 }] });
  run([NORTH, WEST], [NORTH, EAST], "n", [GATE_N[1] < WEST ? WEST - GATE_N[1] : 0]);
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

  // ---- houses: terraces wall to wall along the streets (the plan's rows of boxes), with
  // alleys left open into the plazas behind them ----
  const STREET = ["townhouse", "townhouse_narrow", "corner_house", "townhouse_narrow", "row_houses", "townhouse", "townhouse_narrow"];
  const HARBOUR = ["warehouse", "yodia:warehouse", "townhouse_narrow", "warehouse", "townhouse"];
  const TINTS = ["", "red", "slate", "cream", "yellow", "red", "cream"];
  // a row with the fronts on the plan line a -> b, facing `side`, the pieces in turn from `start`
  const terrace = (a: [number, number], b: [number, number], side: Side, pieces = STREET, start = 0) =>
    town.terrace(P(a[0], a[1]), P(b[0], b[1]), side, pieces, { start, kit: "eden", tints: TINTS, narrow: "townhouse_narrow" });
  // north-west: down the north avenue and along the west avenue (an alley into the cathedral
  // plaza in each), and round the back of the plaza
  terrace([583, 98], [583, 280], "e");
  terrace([583, 305], [583, 518], "e", STREET, 3);
  terrace([95, 518], [290, 518], "s", STREET, 1);
  terrace([315, 518], [530, 518], "s", STREET, 4);
  terrace([330, 146], [530, 146], "s", STREET, 2);
  terrace([146, 330], [146, 460], "e", STREET, 5);
  // north-east: shop houses down the north avenue (two ways into the market), round the market
  terrace([657, 98], [657, 230], "w", STREET, 2);
  terrace([657, 255], [657, 400], "w", STREET, 5);
  terrace([657, 425], [657, 558], "w", STREET, 1);
  terrace([708, 146], [844, 146], "s", STREET, 3);
  terrace([848, 100], [848, 500], "w", STREET, 6);
  terrace([708, 558], [760, 558], "s", STREET, 1);
  terrace([800, 558], [894, 558], "s", STREET, 4);
  // south-west: along the west avenue and down the south avenue (alleys into the garden), along
  // the walls behind the garden
  terrace([95, 607], [290, 607], "n", ["row_houses", "townhouse", "guild_hall", "townhouse_narrow"]);
  terrace([315, 607], [556, 607], "n", STREET, 2);
  terrace([608, 660], [608, 780], "e", ["weapon_shop", "townhouse", "townhouse_narrow"]);
  terrace([608, 805], [608, 1030], "e", STREET, 4);
  terrace([146, 660], [146, 1030], "e", STREET, 6);
  terrace([150, 986], [556, 986], "n", STREET, 0);
  // the fountain plaza: the inn and the tool shop along its north side
  terrace([683, 680], [857, 680], "s", ["inn", "tool_shop", "cafe", "townhouse_narrow"]);
  // the harbour quarter: warehouses facing the quay and the basin, houses facing the lanes
  terrace([1078, 30], [1078, 245], "e", HARBOUR);
  terrace([948, 85], [948, 245], "w", STREET, 3);
  terrace([1017, 255], [1017, 415], "e", ["yodia:customs_house", "warehouse", "yodia:warehouse"]);
  terrace([1078, 445], [1078, 555], "e", HARBOUR, 2);
  terrace([948, 445], [948, 555], "w", STREET, 5);
  terrace([922, 620], [922, 1000], "w", STREET, 2);
  terrace([1078, 620], [1078, 995], "e", HARBOUR, 1);
  terrace([1078, 1052], [1078, 1092], "e", HARBOUR, 3);
  put("eden:notice_board", P(540, 532), FACE.s);

  // ---- avenues: trees and lamps down both sides ----
  const avenue = (a: [number, number], b: [number, number], step: number, skip: (u: number, v: number) => boolean = () => false) => {
    const n = Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / step);
    for (let i = 0; i <= n; i++) {
      const u = a[0] + ((b[0] - a[0]) * i) / n, v = a[1] + ((b[1] - a[1]) * i) / n;
      if (skip(u, v)) continue;
      if (i % 2) put("eden:street_lamp", P(u, v), 0, { solid: [{ kind: "post", x: 0, y: 0, r: 22 }] });
      else put(rnd() < 0.5 ? "flora:RoundTree" : "flora:SmallTree", P(u, v), rnd() * 360, { s: 0.7 + rnd() * 0.15 });
    }
  };
  avenue([150, 534], [560, 534], 55);
  avenue([150, 591], [560, 591], 55);
  avenue([600, 140], [600, 500], 55);
  avenue([641, 140], [641, 500], 55);
  avenue([624, 650], [624, 1000], 55);
  avenue([666, 650], [666, 880], 55);
  // the crossroads: a lamp on each corner and banners
  for (const [u, v] of [[598, 532], [668, 532], [598, 603], [668, 603]]) put("eden:street_lamp", P(u, v), 45, { solid: [{ kind: "post", x: 0, y: 0, r: 22 }] });
  for (const [u, v] of [[578, 610], [672, 524]]) put("eden:banner_pole", P(u, v), facing(625 - u, 565 - v));

  // ---- the cathedral plaza (north-west) ----
  put("eden:cathedral", P(262, 232), facing(1, 1));
  for (const t of [0.12, 0.35, 0.6, 0.85]) {
    const a = t * (Math.PI / 2);
    put("eden:street_lamp", P(175 + 0.9 * 310 * Math.cos(a), 145 + 0.9 * 255 * Math.sin(a)), 0, { solid: [{ kind: "post", x: 0, y: 0, r: 22 }] });
    put(t < 0.5 ? "eden:park_bench" : "eden:flower_bed", P(175 + 0.75 * 310 * Math.cos(a + 0.2), 145 + 0.75 * 255 * Math.sin(a + 0.2)), facing(-Math.cos(a), -Math.sin(a)));
  }
  for (const [u, v] of [[310, 250], [270, 300]]) put("eden:banner_pole", P(u, v), facing(1, 1));
  put("eden:hero_statue", P(330, 300), facing(1, 1));
  // trees in the corner behind it
  for (const [u, v] of [[160, 160], [165, 260], [250, 125], [300, 120]])
    put(rnd() < 0.6 ? "flora:BigOak" : "flora:RoundTree", P(u, v), rnd() * 360, { s: 0.7 + rnd() * 0.2 });
  // the green between the plaza and the houses
  for (const [u, v] of [[430, 300], [400, 360], [500, 230], [470, 420]]) put(rnd() < 0.5 ? "flora:RoundTree" : "flora:Cherry", P(u, v), rnd() * 360, { s: 0.7 });
  for (const [u, v] of [[380, 420], [450, 395], [300, 430]]) put("eden:flower_bed", P(u, v), 0);
  for (const [u, v] of [[470, 230], [470, 330], [415, 445], [230, 440]]) put("eden:topiary", P(u, v), 0);

  // ---- the market (north-east) ----
  for (let v = 180; v <= 480; v += 32) {
    put(v % 64 === 52 ? "eden:market_stall_fruit" : "eden:market_stall_cloth", P(734, v), FACE.e);
    put(v % 64 === 52 ? "eden:market_stall_cloth" : "eden:market_stall_fruit", P(820, v), FACE.w);
  }
  for (const v of [260, 420]) put("common:market_cart", P(777, v), FACE.s);
  for (const v of [210, 340, 470]) put("eden:street_lamp", P(777, v), 90, { solid: [{ kind: "post", x: 0, y: 0, r: 22 }] });
  put("eden:public_well", P(777, 172), 0);
  for (const u of [764, 796]) put("eden:banner_pole", P(u, 530), FACE.s);
  for (const [u, v] of [[770, 548], [790, 548]]) put("eden:flower_bed", P(u, v), 0);

  // ---- the hero's garden (south-west) ----
  put("eden:pergola", P(205, 760), FACE.e);
  for (const [u, v, f] of [[260, 790, "s"], [330, 840, "w"], [220, 860, "e"], [300, 760, "n"]] as [number, number, Side][]) put("eden:park_bench", P(u, v), FACE[f]);
  for (const [u, v] of [[190, 820], [360, 870], [280, 880]]) put("eden:flower_bed", P(u, v), 0);
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2);
    put("eden:hedge", P(150 + 300 * Math.cos(a), 900 - 220 * Math.sin(a)), facing(Math.cos(a), -Math.sin(a)) + 90);
  }
  for (const [u, v] of [[175, 700], [400, 760], [430, 860], [200, 940], [320, 945], [450, 940], [520, 700]])
    put(rnd() < 0.5 ? "flora:RoundTree" : "flora:Cherry", P(u, v), rnd() * 360, { s: 0.75 });
  for (const [u, v] of [[240, 715], [330, 715], [400, 700]]) put("eden:topiary", P(u, v), 0);

  // ---- the fountain plaza (south-east) ----
  put("eden:fountain", P(770, 800), 0, { s: 1.6, solid: [{ kind: "fountain", x: 0, y: 0, r: 320 }] });
  for (const [u, v] of [[700, 700], [855, 700], [700, 905], [855, 905]]) put("eden:street_lamp", P(u, v), 45, { solid: [{ kind: "post", x: 0, y: 0, r: 22 }] });
  // a ring round the fountain: lamps on the diagonals, benches and flower beds between
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, du = Math.cos(a), dv = Math.sin(a);
    if (i % 2) put("eden:street_lamp", P(770 + du * 48, 800 + dv * 48), 45, { solid: [{ kind: "post", x: 0, y: 0, r: 22 }] });
    else put("eden:park_bench", P(770 + du * 44, 800 + dv * 44), facing(-du, -dv));
    put("eden:flower_bed", P(770 + Math.cos(a + 0.39) * 52, 800 + Math.sin(a + 0.39) * 52), facing(-Math.cos(a + 0.39), -Math.sin(a + 0.39)) + 90);
  }
  for (const [u, v] of [[700, 770], [700, 860], [845, 770], [845, 860]]) put("flora:Cherry", P(u, v), rnd() * 360, { s: 0.65 });
  for (const [u, v] of [[700, 815], [845, 815]]) put("eden:flower_bed", P(u, v), 0);
  for (const [u, v] of [[800, 702], [830, 708], [770, 708], [815, 722]]) put("eden:cafe_table", P(u, v), rnd() * 90);
  put("eden:kiosk", P(830, 900), FACE.n);
  put("eden:kiosk", P(712, 900), FACE.n);
  for (const [u, v] of [[690, 700], [692, 712]]) put("common:crate", P(u, v), rnd() * 90);

  // ---- gates: guard posts ----
  put("eden:guard_post", P(598, 108), FACE.s);
  put("eden:guard_post", P(643, 108), FACE.s);
  put("eden:guard_post", P(108, 532), FACE.e);
  put("eden:guard_post", P(108, 594), FACE.e);
  put("eden:guard_post", P(622, 1018), FACE.n);
  put("eden:guard_post", P(668, 1018), FACE.n);

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
  for (let v = 60; v < 1090; v += 110) if (v < BASIN.v0 - 20 || v > BASIN.v1 + 20) put("yodia:harbour_lamp", P(1128, v), 90, { solid: [{ kind: "post", x: 0, y: 0, r: 22 }] });
  for (const v of [270, 335, 400]) put("yodia:harbour_lamp", P(1028, v), 90, { solid: [{ kind: "post", x: 0, y: 0, r: 22 }] });
  for (const [u, v] of [[1100, 180], [1100, 470], [1000, 590], [1100, 760], [1095, 990], [1095, 1060]]) put("eden:cargo_stack", P(u, v), rnd() * 90);
  for (const [u, v] of [[1110, 210], [1110, 640], [1110, 880], [1030, 245]]) put("common:crate", P(u, v), rnd() * 90);
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
    if (i < 5) put("eden:street_lamp", P(150 + 240 * Math.cos(a + 0.15), 900 - 165 * Math.sin(a + 0.15)), 0, { solid: [{ kind: "post", x: 0, y: 0, r: 22 }] });
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
    // the north and south gates are shut for now: a bar across the far end of each passage
    late: [
      { kind: "closed", x: GATE_N[0] + 420, y: GATE_N[1], w: 200, d: 520, rot: 0 },
      { kind: "closed", x: GATE_S[0] - 420, y: GATE_S[1], w: 200, d: 520, rot: 0 },
    ],
    bounds: { minX: SOUTH - 700, maxX: NORTH + 700, minY: SHORE - 2800, maxY: WEST + 1400 },
    spawn: pt(780, 740),
    npcs: edenNpcs(town.doors),
    warps: [{ x: GATE_W[0], y: WEST + 1050, r: 160, to: "field", arrive: { x: 420, y: -520 } }],
    closed: [
      { x: GATE_N[0] + 250, y: GATE_N[1], r: 260, text: "ประตูเหนือปิดซ่อมอยู่ ทางไปปราสาทยังไม่เปิด" },
      { x: GATE_S[0] - 250, y: GATE_S[1], r: 260, text: "ประตูใต้ยังไม่เปิด ทางไปทะเลทรายบาฮามัสกำลังสำรวจ" },
    ],
    // names on the map window
    labels: [
      { ...pt(262, 232), text: "มหาวิหาร" },
      { ...pt(777, 330), text: "ตลาด" },
      { ...pt(255, 760), text: "สวนวีรบุรุษ" },
      { ...pt(770, 860), text: "ลานน้ำพุ" },
      { ...pt(625, 640), text: "สี่แยกกลางเมือง", kind: "small" },
      { ...pt(1110, 720), text: "ท่าเรือ" },
      { ...pt(1090, 335), text: "อู่จอดเรือ", kind: "small" },
      { x: GATE_N[0] + 150, y: GATE_N[1], text: "ประตูเหนือ (ปิด)", kind: "gate" },
      { x: GATE_S[0] - 150, y: GATE_S[1], text: "ประตูใต้ (ปิด)", kind: "gate" },
    ],
  });
}

// ---- townsfolk, where the plan put its red dots ----
function edenNpcs(doors: Record<string, [number, number]>): NpcSpec[] {
  const at = (u: number, v: number) => {
    const [x, y] = P(u, v);
    return { x, y };
  };
  const shopAt = doors.tool_shop ?? P(760, 700);
  const guard = (top: string) => ({ gender: "male", hair: "", hairColor: "ink", eyes: "blue", top, bottom: "bottom_warrior_black" });
  return [
    { id: "guard_n1", ...at(600, 125), face: 180, name: "ทหารยามโรแลนด์", title: "ทหารยามประตูเหนือ", role: "talk", look: guard("top_warrior_navy"),
      lines: ["ประตูเหนือปิดซ่อมอยู่ ทางไปปราสาทยังไม่เปิดนะ", "ถ้าจะออกไปล่ามอนสเตอร์ ใช้ประตูตะวันตกสิ"] },
    { id: "guard_n2", ...at(641, 125), face: 180, name: "ทหารยามเกรเกอร์", title: "ทหารยามประตูเหนือ", role: "talk", look: guard("top_warrior_navy"),
      lines: ["อีเดนเป็นเมืองหลวงของอาณาจักร ยินดีต้อนรับ", "เดินตรงลงไปจะเจอสี่แยกกลางเมือง"] },
    { id: "guard_w1", ...at(140, 530), face: -90, name: "ทหารยามเฮนริก", title: "ทหารยามประตูตะวันตก", role: "talk", look: guard("top_warrior"),
      lines: ["ออกประตูนี้ไปเป็นทุ่งหญ้าตะวันตก มีสไลม์อยู่เยอะ", "เดินเข้าวงแสงสีฟ้าตรงหน้าประตูเพื่อออกไปข้างนอก"] },
    { id: "guard_w2", ...at(140, 596), face: -90, name: "ทหารยามอลัน", title: "ทหารยามประตูตะวันตก", role: "talk", look: guard("top_warrior"),
      lines: ["สไลม์สีม่วงแรงกว่าสีอื่นนะ ระวังด้วย", "ถ้าบาดเจ็บ กลับมาหานักบวชที่สี่แยกได้"] },
    { id: "guide", ...at(560, 545), face: -135, name: "ลีน่า", title: "ผู้นำทาง", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "gold", eyes: "blue", top: "top_adventurer_teal", bottom: "bottom_adventurer_sand" },
      lines: ["ที่นี่คือสี่แยกกลางเมืองอีเดน", "มหาวิหารอยู่ทางตะวันตกเฉียงเหนือ ตลาดอยู่ตะวันออกเฉียงเหนือ", "ลานน้ำพุกับร้านเครื่องมืออยู่ทางตะวันออกเฉียงใต้ ท่าเรืออยู่ริมทะเลฝั่งตะวันออก", "ทุ่งล่าสไลม์ออกทางประตูตะวันตก"] },
    { id: "healer", ...at(548, 590), face: -45, name: "ซิสเตอร์มาเรีย", title: "นักบวช · รักษาฟรี", role: "heal",
      look: { gender: "female", hair: "twintail", hairColor: "silver", eyes: "teal", top: "top_priestess_white", bottom: "bottom_priestess_white" },
      lines: ["ขอพรแห่งแสงจงคุ้มครองท่าน", "หายเหนื่อยแล้วนะ ไปผจญภัยต่อได้"] },
    { id: "adventurer", ...at(645, 512), face: 135, name: "คาร่า", title: "นักผจญภัย", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "rose", eyes: "amber", top: "top_adventurer", bottom: "bottom_adventurer" },
      lines: ["ได้ยินว่าโยเดียทางใต้มีเรือสินค้าลำใหญ่มาก", "ฉันกำลังรอเรือไปเกาะโอซากิ แต่ยังไม่ออกสักที"] },
    { id: "merchant_boy", ...at(672, 560), face: 90, name: "ทอม", title: "เด็กส่งของ", role: "talk", look: guard("top_warrior_forest"),
      lines: ["ร้านอาวุธอยู่ถนนใต้ ร้านเครื่องมืออยู่ลานน้ำพุ", "ตลาดทางเหนือมีผ้ากับผลไม้ขายเยอะเลย"] },
    { id: "guard_s", ...at(630, 700), face: -90, name: "ทหารยามบรูโน", title: "ทหารยามลาดตระเวน", role: "talk", look: guard("top_warrior_navy"),
      lines: ["ประตูใต้ยังไม่เปิด ทางไปทะเลทรายกำลังสำรวจอยู่", "ระวังของหายนะ ตลาดคนเยอะ"] },
    travelGuide("eden", P(748, 728), -150),
    { id: "shop", x: shopAt[0], y: shopAt[1], face: 180, name: "ลิเลีย", title: "ร้านเครื่องมือ", role: "shop", sprite: "merchant",
      lines: ["ยา เสื้อผ้า คัมภีร์ มีครบ เข้ามาดูก่อนได้"] },
    { id: "sailor", ...at(1112, 470), face: 90, name: "กัปตันมาร์โก", title: "กะลาสี", role: "talk",
      look: { gender: "male", hair: "", hairColor: "auburn", eyes: "amber", top: "top_warrior", bottom: "bottom_warrior" },
      lines: ["ท่าเรืออีเดนรับเรือจากทุกทิศ", "เรือไปโยเดีย ไอซ์เบิร์ก และโอซากิ ยังไม่เปิดให้บริการนะ รออีกหน่อย"] },
  ];
}
