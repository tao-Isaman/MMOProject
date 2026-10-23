// โนอา (Noa), the old capital of the west lands: the kingdom's first and once greatest city.
// When it outgrew itself the court moved to Eden on the sea, but Noa is still the crossroads of
// the western continent, busy and old: Eden built the same way (stone, plaster, tiled roofs) but
// centuries older, grey-green stone furred with moss, faded plaster, bleached roofs, ivy.
//
// The plan (plan pixels, u right = east, v down = south; 20 cm a pixel; the walls a box
// u 0..850, v 0..735, so 170 x 147 m):
//   - the city wall with five open gates: north (the cardo out to the frozen river and on to
//     Highland Hill), south (the cardo out to the plains and Venezia), west (the west road out to
//     the elder forest and over the mountains to Suzhou), and two in the east wall: the meadow
//     road through its north part to the Noa meadow, the caravan road through its south part to
//     the west woods and Eden;
//   - the two old roads crossing in the middle: the cardo from the north gate to the south gate
//     (u 395..445), and the west road from the west gate (v 342.5..392.5) into the clock square,
//     the big square at the crossing (u 330..510, v 285..450), with the old fountain where the
//     roads cross, the spawn and the travel guide beside it, the clock tower on its north-west
//     corner and the archive (the old royal library) along its north side facing it;
//   - the aqueduct striding across the whole town from north to south along u 320, over both
//     walls, past the square's west side and over the west road on one of its arches; outside
//     the walls it breaks off a bay or two on (its ruins go on across the plains to the south);
//   - north-west, behind the broken inner wall along the west road (a breach on the palace's
//     axis, the ruined tower at its east end by the aqueduct): the palace precinct, the ruined
//     palace (its arcaded court gone to grass, the roofless throne hall behind), its forecourt
//     lined with the stumps of a colonnade and the statue of the first king in the middle, the
//     old palace gardens gone wild round it (great oaks, fallen columns, rubble);
//   - east of the square: the caravan road out of its south-east corner to the old market (u
//     600..730, v 405..590: stalls in three lines round the old well) and on to the caravan yard
//     inside the south-east gate (wagons drawn up either side of the road, their loads stacked
//     by them), the caravan inn on the yard's north side;
//   - north of the square: the meadow road from the cardo east to its gate (v 115..165), and on
//     west under the aqueduct into the palace precinct;
//   - houses everywhere else, in rows wall to wall along the streets and lanes: the north-east
//     quarter (a lane north-south at u 670..692 and one east-west at v 285..307), houses down both
//     sides of the cardo, and the south-west quarter (a lane down from the west road at u 140..162
//     and one across at v 560..582, on under the aqueduct to the cardo), the smithy by the west
//     gate; Eden's houses in faded colourways and Noa's own old townhouses among them;
//   - greens between the rows full of old trees and fallen columns, orchards and garden wells
//     between the southern rows and the wall; outside, milestones and lamps by the five roads,
//     and woods.
//
// The plan is read in its own pixels and turned into the world (north is +X, east is -Y); the
// whole town is built at full size and drawn at TOWN_SCALE.

import { buildPaved } from "./paved";
import type { Poly } from "./paved";
import { KIT as EDEN } from "./kits/eden";
import { KIT as NOA, SOLIDS as NOA_SOLIDS } from "./kits/noa";
import { Plan, TownBuilder, useKits, colourways, protoOf, facing, FACE, travelGuide, gateWay, waysOut } from "./town";
import type { Side, Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";

useKits(EDEN, NOA);

// Colourways: Eden's pieces aged into Noa's (the stone gone grey-green, the plaster and paint
// faded, the blue roofs washed out, bleached terracotta or mossy), and Noa's own old houses in
// other plasters and roofs.
const AGED: Record<string, string> = {
  StoneWhite: "Noa_StoneLight", StoneLight: "Noa_Stone", StoneGrey: "Noa_StoneDark", StoneBlueDark: "Noa_Ridge",
  Eden_PaintWhite: "Noa_PaintOld", Eden_PaintBlue: "Noa_PaintBlue", GlassBlue: "Noa_Glass", Eden_Terracotta: "Noa_Clay", GoldTrim: "Noa_Gilt",
  Eden_PlasterYellow: "Noa_PlasterOchre", Eden_PlasterRose: "Noa_PlasterRose",
};
colourways({
  "noa-blue": { ...AGED, RoofBlue: "Noa_RoofBlue", Eden_Plaster: "Noa_Plaster", Eden_Shutter: "Noa_ShutterBlue", FabricBlue: "Noa_CanvasBlue" },
  "noa-terra": { ...AGED, RoofBlue: "Noa_RoofFaded", Eden_Plaster: "Noa_PlasterOchre", Eden_Shutter: "Noa_Shutter", FabricBlue: "Noa_CanvasRed", Eden_PlasterYellow: "Noa_Plaster" },
  "noa-moss": { ...AGED, RoofBlue: "Noa_RoofMoss", Eden_Plaster: "Noa_PlasterRose", Eden_Shutter: "Noa_Shutter", FabricBlue: "Noa_CanvasGreen" },
  // the city wall and its towers: the masonry itself grey-green
  "noa-wall": { ...AGED, StoneWhite: "Noa_Stone", StoneLight: "Noa_StoneLight", RoofBlue: "Noa_RoofBlue", FabricBlue: "Noa_CanvasBlue", Eden_Plaster: "Noa_Plaster" },
  "noa-ochre": { Noa_Plaster: "Noa_PlasterOchre", Noa_RoofFaded: "Noa_RoofBlue", Noa_Shutter: "Noa_ShutterBlue" },
  "noa-rose": { Noa_Plaster: "Noa_PlasterRose", Noa_RoofFaded: "Noa_RoofMoss" },
  "noa-plain": { Noa_PlasterOchre: "Noa_Plaster", Noa_RoofMoss: "Noa_RoofFaded", Noa_CanvasRed: "Noa_CanvasBlue", Noa_ShutterBlue: "Noa_Shutter" },
});
// which colourways each house may take ("" = its own colours)
const TINTS: Record<string, string[]> = {
  "noa:old_townhouse": ["", "noa-ochre", "noa-rose", "", "noa-ochre"],
  "noa:old_townhouse_narrow": ["", "noa-plain", ""],
};
const EDEN_TINTS = ["noa-blue", "noa-terra", "noa-moss", "noa-terra", "noa-blue", "noa-moss"];

// ---- the plan's pixels -> the world: 20 cm a pixel, the walls' middle at the origin ----
const PX = 20;
const { P, rect } = new Plan(PX, 425, 367.5);
type UV = [number, number];

// ---- the plan (plan pixels) ----
const WALL = { u0: 0, u1: 850, v0: 0, v1: 735 };
const G_N: UV = [420, 0], G_S: UV = [420, 735], G_W: UV = [0, 367.5], G_EN: UV = [850, 140], G_ES: UV = [850, 560];
const CARDO: UV = [395, 445];        // u, from gate to gate
const WEST_RD: UV = [342.5, 392.5];  // v, from the west gate into the square
const MEADOW_RD: UV = [115, 165];    // v, from the precinct under the aqueduct to the meadow gate
const SQ = { u0: 330, u1: 510, v0: 285, v1: 450 };
const MARKET = { u0: 600, u1: 730, v0: 405, v1: 590 };
const YARD = { u0: 745, u1: 842, v0: 500, v1: 650 };
const AQ_U = 320, BAY = 35;          // the aqueduct's line, and a bay (7 m) in plan pixels
const FOUNTAIN: UV = [420, 367.5];
const PALACE: UV = [150, 128];
const STATUE: UV = [150, 262];
const ARCHIVE: UV = [485, 229];
const CLOCK: UV = [350, 305];
const INN: UV = [796.5, 466];
const INNER = 330;                   // the broken inner wall along the west road (v)
const F = 2;                         // house fronts stand this far back from a street's edge

export function buildNoa(quality: { flowers: number }): Town {
  const town = new TownBuilder(41);
  const { put, rnd, extra } = town;
  const at = (u: number, v: number) => P(u, v);
  const post = (r = 22): SolidSpec[] => [{ kind: "post", x: 0, y: 0, r }];
  const lamp = (u: number, v: number, face = 0) => put("noa:old_lamp", at(u, v), face, { solid: post() });

  // ---- ground: grass; worn cobbled roads and flagged squares ----
  const roads: Poly[] = [
    rect(CARDO[0], -250, CARDO[1], WALL.v1 + 250),       // the cardo, out of both gates
    rect(-250, WEST_RD[0], SQ.u0, WEST_RD[1]),           // the west road
    rect(290, MEADOW_RD[0], WALL.u1 + 250, MEADOW_RD[1]), // the meadow road
    rect(SQ.u1, 405, MARKET.u0, 450),                    // the caravan road: the square to the market
    rect(MARKET.u1, 535, WALL.u1 + 250, 585),            // ... the market to the yard and its gate
    // the lanes
    rect(670, MEADOW_RD[1], 692, MARKET.v0), rect(SQ.u1, 285, 842, 307),
    rect(140, WEST_RD[1], 162, 727), rect(8, 560, CARDO[0], 582),
  ];
  const plazas: Poly[] = [
    rect(SQ.u0, SQ.v0, SQ.u1, SQ.v1), rect(MARKET.u0, MARKET.v0, MARKET.u1, MARKET.v1), rect(YARD.u0, YARD.v0, YARD.u1, YARD.v1),
    rect(106, 196, 194, INNER - 6), // the palace forecourt
  ];
  const ground = buildPaved({ area: { x0: -16000, x1: 16000, y0: -17500, y1: 17500 }, roads, plazas, road: [0.68, 0.67, 0.6], plaza: [0.83, 0.82, 0.74] });

  // ---- the city wall: Eden's wall and towers gone grey-green, the old gates open ----
  const NORTH = at(0, WALL.v0)[0], SOUTH = at(0, WALL.v1)[0], WEST = at(WALL.u0, 0)[1], EAST = at(WALL.u1, 0)[1];
  // a straight run of wall from a to b (world), outside facing `out`, in 8 m pieces cut to fit,
  // leaving the gaps given as [distance along, width]
  const wallRun = (a: [number, number], b: [number, number], out: Side, gaps: [number, number][]) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
    const spans: [number, number][] = [];
    let from = 0;
    for (const [g, w] of [...gaps].sort((p, q) => p[0] - q[0])) {
      spans.push([from, g - w / 2]);
      from = g + w / 2;
    }
    spans.push([from, L]);
    for (const [s0, s1] of spans)
      for (let t = s0; t < s1 - 20; t += 800) {
        const l = Math.min(800, s1 - t), mid = t + l / 2;
        put("eden:city_wall", [a[0] + ux * mid, a[1] + uy * mid], FACE[out], { sy: l / 800, colours: "noa-wall" });
      }
  };
  const GATE_W = 1564, AQ_W = 300; // the gaps for a gate and for the aqueduct's pier
  const along = (uv: UV, from: UV) => Math.hypot(at(...uv)[0] - at(...from)[0], at(...uv)[1] - at(...from)[1]);
  wallRun(at(0, 0), at(850, 0), "n", [[along(G_N, [0, 0]), GATE_W], [along([AQ_U, 0], [0, 0]), AQ_W]]);
  wallRun(at(0, 735), at(850, 735), "s", [[along(G_S, [0, 735]), GATE_W], [along([AQ_U, 735], [0, 735]), AQ_W]]);
  wallRun(at(0, 0), at(0, 735), "w", [[along(G_W, [0, 0]), GATE_W]]);
  wallRun(at(850, 0), at(850, 735), "e", [[along(G_EN, [850, 0]), GATE_W], [along(G_ES, [850, 0]), GATE_W]]);
  const tower = (u: number, v: number) => put("eden:wall_tower", at(u, v), 0, { colours: "noa-wall", solid: [{ kind: "tower", x: 0, y: 0, r: 330 }] });
  for (const [u, v] of [[0, 0], [850, 0], [0, 735], [850, 735], [170, 0], [640, 0], [170, 735], [640, 735], [0, 180], [0, 560], [850, 350]] as UV[]) tower(u, v);
  for (const [g, side] of [[G_N, "n"], [G_S, "s"], [G_W, "w"], [G_EN, "e"], [G_ES, "e"]] as [UV, Side][]) put("noa:old_gate", at(...g), FACE[side], { solid: NOA_SOLIDS.old_gate });

  // ---- the aqueduct: 7 m bays from outside the north wall to outside the south wall, a pier
  // standing in each wall's line; the two ends broken off ----
  for (let k = -2; k <= 22; k++) {
    const v = BAY * k + BAY / 2, end = k === -2 || k === 22;
    const ref = end ? "noa:aqueduct_broken" : [3, 4, 9, 14, 15, 19].includes(k) ? "noa:aqueduct_ivy" : "noa:aqueduct";
    put(ref, at(AQ_U, v), k === -2 ? -90 : 90, { solid: "none" });
  }
  // its piers (one at every joint; the arches between are open)
  for (let k = -1; k <= 22; k++) extra.push({ kind: "aqueduct", x: at(0, BAY * k)[0], y: at(AQ_U, 0)[1], w: 190, d: 310, rot: 0 });

  // ---- houses: rows wall to wall, their fronts on a plan line, centred on it ----
  const NARROW = "noa:old_townhouse_narrow";
  const doors: Record<string, [number, number]> = {};
  const pick = (ref: string) => {
    const tints = TINTS[ref] ?? (ref.startsWith("eden:") ? EDEN_TINTS : [""]);
    const colours = tints[Math.floor(rnd() * tints.length)] || undefined;
    return { ref, colours, f: protoOf(ref, colours).foot };
  };
  const row = (a: UV, b: UV, side: Side, pieces: string[], start = 0) => {
    const A = at(...a), B = at(...b);
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]), dx = (B[0] - A[0]) / L, dy = (B[1] - A[1]) / L;
    const r = (FACE[side] * Math.PI) / 180, fx = -Math.cos(r), fy = -Math.sin(r);
    const fwd = -Math.sin(r) * dx + Math.cos(r) * dy > 0;
    const picks: ReturnType<typeof pick>[] = [];
    let t = 0;
    for (let i = start; ; i++) {
      let p = pick(pieces[i % pieces.length]);
      if (t + (p.f.y1 - p.f.y0) > L + 40) {
        p = pick(NARROW);
        if (t + (p.f.y1 - p.f.y0) > L + 40) break;
      }
      picks.push(p);
      t += p.f.y1 - p.f.y0 + 4;
    }
    let s = Math.max(0, (L - (t - 4)) / 2);
    for (const p of picks) {
      const w = p.f.y1 - p.f.y0, c = fwd ? s - p.f.y0 : s + p.f.y1;
      put(p.ref, [A[0] + dx * c + fx * p.f.x0, A[1] + dy * c + fy * p.f.x0], FACE[side], { colours: p.colours });
      if (!doors[p.ref]) doors[p.ref] = [A[0] + dx * (s + w / 2) + fx * 170, A[1] + dy * (s + w / 2) + fy * 170];
      s += w + 4;
    }
  };
  const OLD = ["noa:old_townhouse", "eden:townhouse_narrow", "noa:old_townhouse_narrow", "eden:townhouse", "noa:old_townhouse", "eden:corner_house", NARROW];
  const MIX = ["eden:townhouse", NARROW, "noa:old_townhouse", "eden:row_houses", "eden:townhouse_narrow", "noa:old_townhouse", "eden:corner_house"];
  const [c0, c1] = [CARDO[0] - F, CARDO[1] + F];
  // north of the meadow road: both sides of the cardo, and along the road to the east wall
  row([c0, 16], [c0, MEADOW_RD[0] - F], "e", OLD, 0);
  row([c1, 16], [c1, MEADOW_RD[0] - F], "w", MIX, 2);
  row([497, MEADOW_RD[0] - F], [828, MEADOW_RD[0] - F], "s", MIX, 0);
  // the cardo's west side down to the square (the aqueduct lane behind)
  row([c0, MEADOW_RD[1] + F], [c0, SQ.v0 - F], "e", OLD, 3);
  // the north-east quarter: rows along the meadow road, the lanes and the square's east side
  for (const [u0, u1] of [[527, 668], [694, 828]]) {
    row([u0, MEADOW_RD[1] + F], [u1, MEADOW_RD[1] + F], "n", MIX, u0 % 5);
    row([u0, 283], [u1, 283], "s", OLD, u0 % 4);
  }
  for (const [u0, u1] of [[562, 668], [694, 828]]) {
    row([u0, 309], [u1, 309], "n", MIX, u0 % 3 + 1);
    row([u0, 403], [u1, 403], "s", OLD, u0 % 6);
  }
  row([SQ.u1 + F, 309], [SQ.u1 + F, 403], "w", ["eden:tool_shop", "eden:townhouse", NARROW]);
  // round the square's south side and down the cardo to the south wall
  row([332, SQ.v1 + F], [c0, SQ.v1 + F], "n", ["eden:townhouse_narrow", "noa:old_townhouse"]);
  row([c1, SQ.v1 + F], [MARKET.u0 - 2, SQ.v1 + F], "n", ["eden:row_houses", "noa:old_townhouse", "eden:cafe", NARROW]);
  row([c0, 499], [c0, 558], "e", OLD, 1);
  row([c0, 584], [c0, 718], "e", OLD, 4);
  row([c1, 499], [c1, 718], "w", MIX, 3);
  row([MARKET.u0 - 2, 501], [MARKET.u0 - 2, MARKET.v1 - 2], "e", ["eden:corner_house", "noa:old_townhouse_narrow", "eden:townhouse"]);
  row([494, MARKET.v1 + F], [YARD.u0 - 4, MARKET.v1 + F], "n", MIX, 5);
  // the south-west quarter: along the west road (the smithy by the gate) and the lanes
  row([20, WEST_RD[1] + F], [138, WEST_RD[1] + F], "n", ["eden:weapon_shop", "noa:old_townhouse"]);
  row([164, WEST_RD[1] + F], [310, WEST_RD[1] + F], "n", OLD, 2);
  for (const [u0, u1] of [[22, 138], [164, 310]]) {
    row([u0, 558], [u1, 558], "s", MIX, u0 % 4);
    row([u0, 584], [u1, 584], "n", OLD, u0 % 5 + 1);
  }

  // ---- the clock square ----
  put("noa:old_fountain", at(...FOUNTAIN), 0, { solid: [{ kind: "fountain", x: 0, y: 0, r: 330 }] });
  put("noa:clock_tower", at(...CLOCK), FACE.e);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4, du = Math.cos(a), dv = Math.sin(a);
    lamp(FOUNTAIN[0] + du * 44, FOUNTAIN[1] + dv * 44, 45);
    put("common:bench", at(FOUNTAIN[0] + Math.cos(a + Math.PI / 4) * 30, FOUNTAIN[1] + Math.sin(a + Math.PI / 4) * 30), facing(-Math.cos(a + Math.PI / 4), -Math.sin(a + Math.PI / 4)));
  }
  for (const [u, v] of [[372, 293], [338, 442], [500, 442]] as UV[]) lamp(u, v);
  put("noa:milestone", at(474, 360), facing(-1, 0));
  for (const u of [346, 376, 464, 494]) put("eden:flower_planter", at(u, SQ.v1 - 6), FACE.n, { colours: "noa-blue" });
  for (const u of [452, 518]) put("eden:banner_pole", at(u, SQ.v0 + 6), FACE.s, { colours: "noa-wall" });
  put("eden:notice_board", at(339, 405), FACE.e, { colours: "noa-terra" });
  for (const [u, v, s] of [[346, 425, 0.75], [494, 425, 0.7]] as [number, number, number][]) put("flora:BigOak", at(u, v), rnd() * 360, { s });
  for (const [u, v, f] of [[372, 445, "n"], [468, 445, "n"], [500, 330, "w"]] as [number, number, Side][]) put("common:bench", at(u, v), FACE[f]);

  // ---- the palace precinct ----
  put("noa:palace_ruins", at(...PALACE), FACE.s, { solid: NOA_SOLIDS.palace_ruins });
  put("noa:king_statue", at(...STATUE), FACE.s);
  // the forecourt lined with what is left of a colonnade, lamps between
  for (let v = 204; v < INNER - 10; v += 24) for (const u of [100, 200]) put("noa:broken_column", at(u, v), rnd() * 360, { solid: post(48) });
  for (const [u, v] of [[112, 222], [188, 222], [112, 300], [188, 300]] as UV[]) lamp(u, v);
  // the broken inner wall along the west road: two runs either side of the breach on the
  // palace's axis, the ruined tower at its east end
  const inner = (u0: number, u1: number) => {
    for (let u = u0; u < u1 - 1; u += 40) {
      const k = Math.min(40, u1 - u) / 40;
      put("noa:ruined_wall", at(u + 20 * k, INNER), FACE.s, { sy: k, solid: [{ kind: "wall", x: 0, y: 0, w: 260, d: 800 * k, rot: 0 }] });
    }
  };
  inner(14, PALACE[0] - 20);
  put("noa:ruined_wall_breach", at(PALACE[0], INNER), FACE.s, { solid: NOA_SOLIDS.ruined_wall_breach });
  inner(PALACE[0] + 20, 250);
  put("noa:ruined_tower", at(268, INNER - 8), FACE.s, { solid: [{ kind: "tower", x: 0, y: 0, r: 345 }] });
  // the old palace gardens round it, long gone wild: great oaks, fallen columns, rubble
  for (const [u, v, k] of [[40, 70, "broken_column"], [52, 250, "broken_column"], [252, 70, "broken_column"], [258, 205, "broken_column"], [30, 160, "broken_column"], [228, 300, "broken_column"],
    [62, 200, "ruin_rubble"], [244, 262, "ruin_rubble"], [272, 30, "ruin_rubble"], [118, 30, "ruin_rubble"], [40, 300, "ruin_rubble"], [232, 120, "ruin_rubble"]] as [number, number, string][])
    put(`noa:${k}`, at(u, v), rnd() * 360, k === "broken_column" ? { solid: post(48) } : { solid: "none" });
  for (const [u, v, s] of [[34, 32, 1], [62, 116, 0.9], [36, 230, 1.1], [70, 290, 0.8], [250, 160, 1], [282, 92, 0.9], [236, 40, 0.8], [270, 250, 0.85], [196, 36, 0.75], [104, 50, 0.8]] as [number, number, number][])
    put(rnd() < 0.7 ? "flora:BigOak" : "flora:RoundTree", at(u, v), rnd() * 360, { s });
  for (const [u, v] of [[18, 190], [78, 252], [226, 220], [292, 300], [214, 290]] as UV[]) put("flora:Bush", at(u, v), rnd() * 360, { s: 1.2 + rnd() * 0.4 });

  // ---- the archive ----
  put("noa:archive_hall", at(...ARCHIVE), FACE.s);
  for (const [u, v] of [[455, 180], [520, 180]] as UV[]) put("flora:BigOak", at(u, v), rnd() * 360, { s: 0.7 });

  // ---- the old market: stalls along both sides facing the middle, carts and crates at its ends ----
  const STALLS = ["noa:market_stall_old", "eden:market_stall_cloth", "noa:market_stall_canvas", "eden:market_stall_fruit"];
  [462, 482, 502, 522, 542, 562].forEach((v, i) => put(STALLS[i % 4], at(MARKET.u0 + 15, v), FACE.e, { colours: STALLS[i % 4].startsWith("eden") ? "noa-terra" : undefined }));
  [420, 440, 460, 480, 500, 520].forEach((v, i) => put(STALLS[(i + 2) % 4], at(MARKET.u1 - 15, v), FACE.w, { colours: STALLS[(i + 2) % 4].startsWith("eden") ? "noa-blue" : undefined }));
  // down the middle, stalls back to back either side of the old well
  [440, 460, 540, 560].forEach((v, i) => {
    put(STALLS[(i + 1) % 4], at(657, v), FACE.w, { colours: STALLS[(i + 1) % 4].startsWith("eden") ? "noa-blue" : undefined });
    put(STALLS[(i + 3) % 4], at(673, v), FACE.e, { colours: STALLS[(i + 3) % 4].startsWith("eden") ? "noa-terra" : undefined });
  });
  put("eden:public_well", at(665, 500), 0, { colours: "noa-wall" });
  put("common:market_cart", at(690, 412), FACE.w);
  put("common:market_cart", at(640, 584), FACE.e);
  for (const [u, v] of [[628, 414], [700, 584], [612, 582], [722, 412], [650, 590]] as UV[]) put("common:crate", at(u, v), rnd() * 90);
  for (const [u, v] of [[640, 470], [690, 530]] as UV[]) lamp(u, v);

  // ---- the caravan yard and the inn ----
  put("noa:caravan_inn", at(...INN), FACE.s);
  // wagons drawn up either side of the road through the yard, their loads stacked by them
  for (const [u, v, h] of [[768, 620, 95], [812, 628, 80], [770, 514, 100], [818, 516, 85], [790, 640, 92]] as [number, number, number][]) put("noa:caravan_wagon", at(u, v), h);
  for (const [u, v] of [[838, 604], [836, 642], [752, 596], [752, 646]] as UV[]) put("eden:cargo_stack", at(u, v), rnd() * 90, { colours: "noa-terra" });
  for (const [u, v] of [[750, 622], [838, 532], [792, 600], [796, 598]] as UV[]) put("common:crate", at(u, v), rnd() * 90);
  for (const [u, v] of [[750, 505], [838, 588]] as UV[]) lamp(u, v);

  // ---- lamps down the old roads ----
  for (let v = 40; v < WALL.v1 - 20; v += 60) if (v < SQ.v0 - 10 || v > SQ.v1 + 10) for (const u of [CARDO[0] + 6, CARDO[1] - 6]) if (Math.abs(v - MEADOW_RD[0] - 25) > 35 && Math.abs(v - 571) > 20) if (v + (u > 420 ? 30 : 0) < 700) lamp(u, v + (u > 420 ? 30 : 0));
  for (let u = 40; u < SQ.u0 - 30; u += 60) if (Math.abs(u - AQ_U) > 20 && Math.abs(u - PALACE[0]) > 20 && Math.abs(u - 151) > 20) lamp(u, WEST_RD[1] - 6);
  for (let u = 480; u < 800; u += 70) if (Math.abs(u - 681) > 20) lamp(u, MEADOW_RD[1] - 6);

  // ---- the greens left between: old trees, and now and then a fallen column ----
  // gardens and orchards on the open ground in the south, between the rows and the wall
  const orchard = (u0: number, u1: number, v0: number, v1: number, kinds: string[]) => {
    for (let u = u0; u <= u1; u += 26) for (let v = v0; v <= v1; v += 24) put(`flora:${kinds[Math.floor(rnd() * kinds.length)]}`, at(u + (rnd() - 0.5) * 6, v + (rnd() - 0.5) * 6), rnd() * 360, { s: 0.55 + rnd() * 0.15 });
  };
  orchard(30, 120, 652, 700, ["RoundTree", "SmallTree", "Cherry"]);
  orchard(180, 290, 652, 700, ["SmallTree", "RoundTree", "RoundTree"]);
  orchard(520, 720, 664, 700, ["Cherry", "SmallTree", "RoundTree"]);
  for (const [u, v] of [[150, 675], [620, 650]] as UV[]) put("eden:public_well", at(u, v), 0, { colours: "noa-wall" });
  for (const [u, v, f] of [[150, 642, "n"], [620, 680, "s"]] as [number, number, Side][]) put("common:bench", at(u, v), FACE[f]);
  // the greens left between: old trees, and now and then a fallen column
  town.greens(ground, { x0: SOUTH, x1: NORTH, y0: EAST, y1: WEST }, { trees: ["RoundTree", "BigOak", "SmallTree", "BigOak", "Birch", "RoundTree"], other: "noa:broken_column", chance: 0.8, step: 420 });

  // ---- outside the walls: milestones and lamps by the roads, the aqueduct's ends, woods ----
  for (const [g, side] of [[G_N, "n"], [G_S, "s"], [G_W, "w"], [G_EN, "e"], [G_ES, "e"]] as [UV, Side][]) {
    const d: UV = side === "n" ? [0, -1] : side === "s" ? [0, 1] : side === "w" ? [-1, 0] : [1, 0];
    const n: UV = [d[1], d[0]];
    const p = (k: number, s: number): UV => [g[0] + d[0] * k + n[0] * s, g[1] + d[1] * k + n[1] * s];
    put("noa:milestone", at(...p(60, 34)), FACE[side]);
    for (const s of [-33, 33]) lamp(...p(30, s));
  }
  const walled = (x: number, y: number) => x > SOUTH - 900 && x < NORTH + 900 && y > EAST - 900 && y < WEST + 900;
  const nearRoad = (x: number, y: number) => {
    const [cx, wy, my, ey] = [at(420, 0)[1], at(0, 367.5)[0], at(0, 140)[0], at(0, 560)[0]];
    return Math.abs(y - cx) < 1000 || (Math.abs(x - wy) < 1000 && y > 0) || ((Math.abs(x - my) < 1000 || Math.abs(x - ey) < 1000) && y < 0) || Math.abs(y - at(AQ_U, 0)[1]) < 700;
  };
  town.woods({ x0: -15000, x1: 15000, y0: -16500, y1: 16500 }, ["RoundTree", "BigOak", "SmallTree", "RoundTree", "Pine", "Birch"], (x, y) => walled(x, y) || nearRoad(x, y), { count: 170 });

  // ---- build ----
  const pt = (u: number, v: number) => ({ x: at(u, v)[0], y: at(u, v)[1] });
  return town.finish({
    ground,
    sky: "#566f3d",
    flowers: {
      box: { x: SOUTH, y: EAST, w: NORTH - SOUTH, h: WEST - EAST },
      open: (x, y) => ground.kind(x, y) === 0 && x < NORTH - 400 && x > SOUTH + 400 && y < WEST - 400 && y > EAST + 400,
      density: 0.35 * quality.flowers,
    },
    bounds: { minX: SOUTH - 700, maxX: NORTH + 700, minY: EAST - 700, maxY: WEST + 700 },
    spawn: pt(420, 418),
    npcs: noaNpcs(doors),
    ...waysOut([
      gateWay(at(...G_N), "n", "frozen_river", 480, 450),
      gateWay(at(...G_S), "s", "noa_plains", 480, 450),
      gateWay(at(...G_W), "w", "elder_forest", 480, 450),
      gateWay(at(...G_EN), "e", "noa_meadow", 480, 450),
      gateWay(at(...G_ES), "e", "west_woods", 480, 450),
    ]),
    closed: [],
    labels: [
      { ...pt(420, 310), text: "จัตุรัสหอนาฬิกา" },
      { ...pt(150, 228), text: "ซากวังเก่า" },
      { ...pt(485, 160), text: "หอจดหมายเหตุ" },
      { ...pt(665, 470), text: "ตลาดเก่า" },
      { ...pt(795, 575), text: "ลานกองคาราวาน" },
      { ...pt(700, 230), text: "ย่านตะวันออก" },
      { ...pt(150, 470), text: "ย่านตะวันตก" },
      { ...pt(CLOCK[0], CLOCK[1] + 26), text: "หอนาฬิกา", kind: "small" },
      { ...pt(STATUE[0], STATUE[1] + 26), text: "รูปปั้นกษัตริย์องค์แรก", kind: "small" },
      { ...pt(AQ_U, 195), text: "ท่อส่งน้ำโบราณ", kind: "small" },
      { ...pt(INN[0], INN[1] - 40), text: "โรงเตี๊ยมกองคาราวาน", kind: "small" },
      { ...pt(60, 420), text: "โรงตีเหล็ก", kind: "small" },
      { x: at(...G_N)[0] - 300, y: at(...G_N)[1], text: "ประตูเหนือ · แม่น้ำเยือกแข็ง", kind: "gate" },
      { x: at(...G_S)[0] + 300, y: at(...G_S)[1], text: "ประตูใต้ · ที่ราบใต้โนอา", kind: "gate" },
      { x: at(...G_W)[0], y: at(...G_W)[1] - 300, text: "ประตูตะวันตก · ป่าโบราณ", kind: "gate" },
      { x: at(...G_EN)[0], y: at(...G_EN)[1] + 300, text: "ประตูตะวันออก · ทุ่งหญ้าโนอา", kind: "gate" },
      { x: at(...G_ES)[0], y: at(...G_ES)[1] + 300, text: "ประตูตะวันออก · ป่าใหญ่ตะวันตก", kind: "gate" },
    ],
  });
}

// ---- the townsfolk ----
function noaNpcs(doors: Record<string, [number, number]>): NpcSpec[] {
  const spot = (u: number, v: number) => {
    const [x, y] = P(u, v);
    return { x, y };
  };
  // the way someone at (u, v) looks towards plan point (tu, tv), in world degrees
  const toward = (u: number, v: number, tu: number, tv: number) => {
    const [x0, y0] = P(u, v), [x1, y1] = P(tu, tv);
    return (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
  };
  const man = (top: string, hairColor = "ink", bottom = "bottom_warrior_cocoa") => ({ gender: "male", hair: "", hairColor, eyes: "amber", top, bottom });
  const guard = (top: string, hairColor = "ink") => man(top, hairColor, "bottom_warrior_black");
  const shop = doors["eden:tool_shop"] ?? P(500, 360);
  const smithy = doors["eden:weapon_shop"] ?? P(60, 420);
  return [
    // the north gate
    { id: "noa_guard_n1", ...spot(404, 24), face: 180, name: "ทหารยามเบอร์นาร์ด", title: "ทหารยามประตูเหนือ", role: "talk", look: guard("top_warrior_navy"),
      lines: ["ออกประตูเหนือไปคือแม่น้ำเยือกแข็ง ข้ามสะพานหินเก่าขึ้นไปจะถึงไฮแลนด์ ฮิล", "ยิ่งขึ้นเหนือยิ่งหนาว เตรียมเสื้อผ้าให้พร้อมก่อนออกเดินทาง"] },
    { id: "noa_guard_n2", ...spot(436, 24), face: 180, name: "ทหารยามออสวัลด์", title: "ทหารยามประตูเหนือ", role: "talk", look: guard("top_warrior_navy", "auburn"),
      lines: ["ท่อส่งน้ำนั่นพาน้ำจากภูเขาทางเหนือเข้าเมืองมาตั้งแต่สมัยกษัตริย์องค์แรก", "สะพานบนแม่น้ำพังไปครึ่งหนึ่งแล้ว เดินระวังน้ำแข็งด้วย"] },
    // the south gate
    { id: "noa_guard_s1", ...spot(404, 711), face: 0, name: "ทหารยามคอนราด", title: "ทหารยามประตูใต้", role: "talk", look: guard("top_warrior_forest"),
      lines: ["ออกประตูใต้ไปคือที่ราบใต้โนอา เดินตามถนนหินโบราณลงไปจะถึงเวนิชเซีย เมืองแห่งสายน้ำ", "หลักไมล์ริมทางนับระยะจากจัตุรัสหอนาฬิกาทั้งนั้น"] },
    { id: "noa_guard_s2", ...spot(436, 711), face: 0, name: "ทหารยามลีโอโปลด์", title: "ทหารยามประตูใต้", role: "talk", look: guard("top_warrior_forest", "gold"),
      lines: ["ไร่องุ่นกับทุ่งข้าวสาลีทางใต้เลี้ยงคนทั้งโนอามาหลายร้อยปี", "ซากท่อส่งน้ำยังพาดไปกลางทุ่ง เมื่อก่อนมันส่งน้ำไปถึงไร่ทางใต้"] },
    // the west gate
    { id: "noa_guard_w1", ...spot(24, 352), face: -90, name: "ทหารยามแมทเธียส", title: "ทหารยามประตูตะวันตก", role: "talk", look: guard("top_warrior"),
      lines: ["ออกประตูตะวันตกไปคือป่าโบราณ ต้นไม้ที่นั่นอายุนับพันปี", "ผ่านป่าไปแล้วต้องข้ามช่องเขาตะวันตกถึงจะไปถึงซูโจวเมืองท่าปลายทวีป"] },
    { id: "noa_guard_w2", ...spot(24, 383), face: -90, name: "ทหารยามรูเพิร์ต", title: "ทหารยามประตูตะวันตก", role: "talk", look: guard("top_warrior", "silver"),
      lines: ["ในป่ามีศาลหินยุคโนอาซ่อนอยู่ ว่ากันว่าสร้างก่อนกำแพงเมืองนี้เสียอีก", "เห็ดเรืองแสงในป่าสวยก็จริง แต่อย่าเก็บมากินเชียว"] },
    // the east gates
    { id: "noa_guard_en1", ...spot(826, 124), face: 90, name: "ทหารยามเฟลิกซ์", title: "ทหารยามประตูตะวันออก", role: "talk", look: guard("top_warrior_navy", "gold"),
      lines: ["ประตูนี้ออกไปทุ่งหญ้าโนอา ลมแรงทั้งปี มีกังหันลมกับฝูงแกะ", "มือใหม่ล่ามอนสเตอร์ที่ทุ่งหญ้าก่อนเถอะ แถวนั้นยังไม่อันตรายนัก"] },
    { id: "noa_guard_en2", ...spot(826, 156), face: 90, name: "ทหารยามเกออร์ก", title: "ทหารยามประตูตะวันออก", role: "talk", look: guard("top_warrior_navy"),
      lines: ["ถนนทุ่งหญ้าวิ่งตรงจากประตูนี้ไปถึงถนนใหญ่กลางเมือง", "ถ้าจะไปอีเดน ใช้ประตูตะวันออกอีกบานทางใต้ ประตูกองคาราวานนั่นแหละ"] },
    { id: "noa_guard_es1", ...spot(826, 544), face: 90, name: "ทหารยามโทเบียส", title: "ทหารยามประตูตะวันออก", role: "talk", look: guard("top_warrior_forest", "auburn"),
      lines: ["ออกประตูนี้ไปคือป่าใหญ่ตะวันตก ทะลุป่าไปเป็นทุ่งหญ้าตะวันตกแล้วก็ถึงอีเดน", "กองคาราวานเข้าออกประตูนี้ทุกวัน ถนนสายนี้คือถนนสู่อีเดนมาแต่โบราณ"] },
    { id: "noa_guard_es2", ...spot(826, 576), face: 90, name: "ทหารยามแอนเซล์ม", title: "ทหารยามประตูตะวันออก", role: "talk", look: guard("top_warrior_forest"),
      lines: ["ตอนราชสำนักย้ายไปอีเดน ขบวนเกวียนออกประตูนี้ไปไม่ขาดสายอยู่สามเดือน", "ในป่าใหญ่มีหมาป่า อย่าเดินคนเดียวตอนค่ำ"] },
    // the square: the way in, the guide, the healer, the shop
    travelGuide("noa", P(442, 418), toward(442, 418, 420, 418)),
    { id: "noa_guide", ...spot(398, 420), face: toward(398, 420, 420, 418), name: "มาร์ธา", title: "ผู้นำทาง", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "auburn", eyes: "teal", top: "top_adventurer_teal", bottom: "bottom_adventurer_sand" },
      lines: ["ยินดีต้อนรับสู่โนอา เมืองหลวงแรกของอาณาจักร ที่นี่คือจัตุรัสหอนาฬิกา", "ซากวังเก่าอยู่หลังกำแพงพังทางตะวันตกเฉียงเหนือ หอจดหมายเหตุอยู่ด้านเหนือของจัตุรัส",
        "ตลาดเก่ากับลานกองคาราวานอยู่ทางตะวันออก ตามถนนคาราวานออกไปทางมุมจัตุรัส", "ประตูเมืองมีห้าบาน เหนือ ใต้ ตะวันตก และตะวันออกอีกสองบาน ทุกบานเปิดหมดแล้ว"] },
    { id: "noa_healer", ...spot(382, 352), face: toward(382, 352, ...FOUNTAIN), name: "ซิสเตอร์อิซาเบล", title: "นักบวช · รักษาฟรี", role: "heal",
      look: { gender: "female", hair: "twintail", hairColor: "silver", eyes: "blue", top: "top_priestess_white", bottom: "bottom_priestess_white" },
      lines: ["น้ำพุนี้ศักดิ์สิทธิ์มาตั้งแต่ก่อนสร้างเมือง ขอพรให้ท่านปลอดภัย", "หายเหนื่อยแล้ว ไปเดินทางต่อได้เลย"] },
    { id: "noa_shop", x: shop[0], y: shop[1], face: 90, name: "เกรตา", title: "ร้านเครื่องมือ", role: "shop", sprite: "merchant",
      lines: ["ยา เสบียง คัมภีร์ มีครบสำหรับการเดินทาง แวะดูก่อนได้"] },
    { id: "noa_smith", x: smithy[0], y: smithy[1], face: 0, name: "บรูโน", title: "ช่างตีเหล็ก · ตีบวก สร้างไอเทม", role: "smith", look: man("top_warrior", "ink"),
      lines: ["เตาของข้าเผาไฟมาตั้งแต่สมัยปู่ทวด ตีดาบให้ทหารวังมาก่อนราชสำนักจะย้ายไป", "เอาหินนภามาตีบวกอาวุธ หินดารามาตีบวกชุด มีแร่กับหนังพอเมื่อไรข้าสร้างอุปกรณ์ให้"] },
    // the archive, the palace, the clock
    { id: "noa_archivist", ...spot(470, 292), face: toward(470, 292, 420, 367.5), name: "ท่านอัลบริช", title: "นักปราชญ์ · หอจดหมายเหตุ", role: "talk", look: man("top_warrior_navy", "silver", "bottom_warrior_black"),
      lines: ["หอจดหมายเหตุเก็บพงศาวดารของอาณาจักรไว้ตั้งแต่กษัตริย์องค์แรก ราชสำนักย้ายไปแต่หนังสือยังอยู่ที่นี่", "แผนที่ทวีปตะวันตกฉบับแรกก็วาดขึ้นในห้องอ่านใต้โดมนี้",
        "ถ้าเจ้าเจออักษรโบราณในป่าหรือในสุสานหลวง จดมาให้ข้าดูด้วย"] },
    { id: "noa_storyteller", ...spot(135, 160), face: toward(135, 160, 150, 128), name: "ยายเฮเลนา", title: "คนเล่าเรื่องวังเก่า", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "silver", eyes: "violet", top: "top_priestess_forest", bottom: "bottom_priestess_forest" },
      lines: ["ลานนี้เคยมีน้ำพุและสวนกุหลาบ ราชินีองค์แรกทรงเดินเล่นที่นี่ทุกเย็น", "ห้องโถงด้านหลังคือท้องพระโรง บัลลังก์หินยังอยู่ แต่ไม่มีใครกล้านั่ง",
        "พอราชสำนักย้ายไปอีเดน วังก็ถูกทิ้งร้าง หลังคาพังลงในพายุใหญ่เมื่อร้อยปีก่อน"] },
    { id: "noa_clockkeeper", ...spot(374, 314), face: toward(374, 314, ...FOUNTAIN), name: "ลุงอ็อตโต", title: "คนดูแลหอนาฬิกา", role: "talk", look: man("top_warrior_forest", "silver"),
      lines: ["นาฬิกาเรือนนี้เดินมาสามร้อยปี ข้าขึ้นไปไขลานทุกเช้า", "ระฆังบนยอดหอตีบอกเวลาเปิดตลาดกับเวลาปิดประตูเมืองมาแต่โบราณ"] },
    // the market and the caravans
    { id: "noa_caravan", ...spot(794, 540), face: toward(794, 540, 794, 500), name: "หัวหน้าโยฮัน", title: "หัวหน้ากองคาราวาน", role: "talk", look: man("top_warrior", "auburn"),
      lines: ["กองคาราวานของข้าวิ่งระหว่างโนอากับอีเดนมาสามสิบปีแล้ว", "จากที่นี่มีถนนไปได้ทุกทิศ เหนือไปไฮแลนด์ ใต้ไปเวนิชเซีย ตะวันตกข้ามเขาไปซูโจว",
        "โรงเตี๊ยมนี้ของเพื่อนข้า เตียงนุ่ม เบียร์เย็น พักให้หายเมื่อยก่อนออกเดินทาง"] },
    { id: "noa_market", ...spot(665, 520), face: toward(665, 520, 615, 520), name: "ป้าโรซา", title: "แม่ค้าตลาดเก่า", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "amber", eyes: "amber", top: "top_adventurer_ochre", bottom: "bottom_adventurer_cocoa" },
      lines: ["ตลาดนี้เปิดทุกวันมาตั้งแต่สมัยยังเป็นเมืองหลวง คนจากทุกทิศมาซื้อขายกันที่นี่", "ชีสจากไฮแลนด์ ไหมจากซูโจว ไวน์จากที่ราบใต้ มีครบ ลองชิมดูสิ"] },
    // townsfolk about the old town and the roads out
    { id: "noa_waterwarden", ...spot(AQ_U, 472), face: toward(AQ_U, 472, 360, 472), name: "ลุงคาสปาร์", title: "คนเฝ้าท่อส่งน้ำ", role: "talk", look: man("top_warrior_navy", "ink"),
      lines: ["ท่อส่งน้ำพาน้ำจากภูเขาทางเหนือมาถึงน้ำพุกลางเมืองได้ทุกวันโดยไม่มีปั๊มสักตัว", "บางช่วงหินหลุดไปบ้าง ข้าต้องปีนขึ้นไปอุดรอยรั่วทุกฤดูใบไม้ผลิ"] },
    { id: "noa_traveller", ...spot(484, 344), face: toward(484, 344, 474, 360), name: "เดเมียน", title: "นักเดินทาง", role: "talk", look: man("top_warrior_forest", "gold"),
      lines: ["หลักไมล์ต้นนี้คือหลักแรกของอาณาจักร ระยะทางทุกสายในแดนตะวันตกนับจากตรงนี้", "ข้าเดินมาจากเวนิชเซีย กำลังจะข้ามเขาไปซูโจว โนอานี่แหละทางแยกของทุกเส้นทาง"] },
    { id: "noa_girl", ...spot(150, 288), face: toward(150, 288, ...STATUE), name: "ลิซ่า", title: "ชาวเมือง", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "gold", eyes: "blue", top: "top_rose", bottom: "bottom_navy" },
      lines: ["รูปปั้นนี้คือกษัตริย์องค์แรก ท่านปักดาบลงตรงนี้แล้วสั่งให้สร้างเมือง", "ทุกปีคนทั้งเมืองเอาพวงมาลัยมาวางที่ฐานรูปปั้น วันนั้นสนุกที่สุดเลย"] },
    { id: "noa_elder", ...spot(300, 380), face: toward(300, 380, AQ_U, 367.5), name: "ปู่วิลเฮล์ม", title: "ผู้เฒ่าชาวเมือง", role: "talk", look: man("top_warrior", "silver", "bottom_warrior_black"),
      lines: ["สมัยข้ายังหนุ่ม โนอายังคึกคักกว่านี้อีก ตอนนี้คนหนุ่มสาวย้ายไปอีเดนกันหมด", "กำแพงชั้นในพังตั้งแต่สงครามครั้งก่อน ไม่มีใครซ่อม ปล่อยให้ไม้เลื้อยคลุมไปหมดแล้ว"] },
    { id: "noa_carter", ...spot(758, 560), face: toward(758, 560, 850, 560), name: "แฮนนา", title: "สาวเลี้ยงม้าคาราวาน", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "amber", top: "top_adventurer_plum", bottom: "bottom_adventurer_black" },
      lines: ["ม้าคาราวานต้องพักที่ลานนี้หนึ่งคืนก่อนเข้าป่าใหญ่ตะวันตก", "ไปอีเดนใช้เวลาสามวันถ้าอากาศดี ถ้าฝนตกถนนในป่าจะเป็นโคลนไปหมด"] },
  ];
}
