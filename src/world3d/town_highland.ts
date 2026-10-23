// ไฮแลนด์ ฮิล (Highland Hill), the ancient snow town at the foot of the mountains, where the legend
// says the ancestors of everyone in the land first settled. Snow lies on it most of the year, yet
// its farmers still grow potatoes, cabbages and barley in glasshouses and walled plots. Built like
// Noa and Eden (stone, plaster, tiled roofs) but for the cold: steep roofs heavy with snow, thick
// stone walls, big stone chimneys, small deep windows and a covered porch before every door.
//
// The plan (in plan pixels, u right, v down, north up the page):
//   - the town wall is a square about 151 m a side, of grey stone with snow on the wall-walk, round
//     towers at the corners and along the runs, a gate in each side: north (to the sea cliffs),
//     south (down the frozen river to Noa), west (the downs) and east (the tangled hills);
//   - the mountains rise in the north-east, so the north-east of the town is a high terrace 5 m up,
//     its edge a rock face that runs down from the north wall and along under it to the east wall
//     (the wall carries on round the terrace on top). On the terrace stands the Ancestors' Temple,
//     facing south down the temple stair onto Temple Street; east of the temple are the high
//     plots and a shepherd's croft, reached by the upper lane and a cart ramp at its east end.
//     Beyond the wall the mountains climb in two great steps of snowy rock with crags on top;
//   - in the middle is the Ancestor Square with the Ancestor Stone, the elders' hall on its north
//     side, Temple Street running north from it to the foot of the stair, South Street south to
//     the south gate, and West Street and East Street straight out to the west and east gates;
//     Cliff Lane runs along the foot of the rock face from North Street to the cart ramp;
//   - the north-west is the farm quarter: three glasshouses with cold frames behind them, walled
//     plots, the farmhouse and its barn across North Street;
//   - the south-west and south-east are the houses: rows along the streets, Well Lane and Smith
//     Lane across the south, West Lane down to a little well square, the sheep pen in the
//     south-west corner, the smithy by the east gate, little plots and woodpiles in the yards;
//   - outside, snowy woods and dry-stone field walls on rolling ground; the roads run on out of
//     the gates.
//
// The plan is read in its own pixels and turned into the world: north (up the page) is +X, east
// (right) is -Y. One plan pixel is 26 cm; the whole town is then drawn at TOWN_SCALE.

import { defineMaterial } from "./textures";
import { buildPaved } from "./paved";
import type { Poly } from "./paved";
import { Terrain } from "./terrain";
import { KIT as HIGHLAND } from "./kits/highland";
import { KIT as ICEBERG } from "./kits/iceberg";
import { KIT as SNOWLAND } from "./kits/snowland";
import { Plan, TownBuilder, useKits, colourways, FACE, travelGuide, gateWay, waysOut, protoOf, solidsOf } from "./town";
import type { Side, Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";

useKits(HIGHLAND, ICEBERG, SNOWLAND);

// Colourways: the same houses under slate-grey or brown tiles, with red or blue shutters, ochre
// plaster, warmer stone.
defineMaterial("HighlandTown_RoofSlate", { map: "tiles", tint: "#5d6777", bump: 2.5 });
defineMaterial("HighlandTown_RoofBrown", { map: "tiles", tint: "#6c5242", bump: 2.5 });
defineMaterial("HighlandTown_RoofFaded", { map: "tiles", tint: "#9b5a43", bump: 2.5 });
defineMaterial("HighlandTown_ShutterRed", { map: "wood", tint: "#8a3b2f", bump: 1 });
defineMaterial("HighlandTown_ShutterBlue", { map: "wood", tint: "#3b5578", bump: 1 });
defineMaterial("HighlandTown_PlasterOchre", { map: "plaster", tint: "#e3cb9f", bump: 0.6 });
defineMaterial("HighlandTown_StoneWarm", { map: "stone", tint: "#b4aa99", bump: 2.2 });
colourways({
  slate: { Highland_Roof: "HighlandTown_RoofSlate", Highland_Shutter: "HighlandTown_ShutterRed" },
  brown: { Highland_Roof: "HighlandTown_RoofBrown", Highland_Shutter: "HighlandTown_ShutterBlue" },
  faded: { Highland_Roof: "HighlandTown_RoofFaded", Highland_Plaster: "HighlandTown_PlasterOchre" },
  warm: { Highland_Stone: "HighlandTown_StoneWarm", Highland_Roof: "HighlandTown_RoofSlate", Highland_Shutter: "HighlandTown_ShutterBlue" },
});
const TINTS = ["", "slate", "brown", "", "faded", "warm", "slate"];

// ---- the plan's pixels -> the world: 26 cm a pixel, (350, 350) at the origin ----
const PX = 26;
const { P, rect } = new Plan(PX, 350, 350);
type UV = [number, number];

// the town wall and its gates
const WALL = { u0: 60, u1: 640, v0: 60, v1: 640 };
const GATE_N: UV = [164, WALL.v0], GATE_S: UV = [340, WALL.v1], GATE_W: UV = [WALL.u0, 387], GATE_E: UV = [WALL.u1, 387];
// the high terrace: its edge (a rock face 5 m high) down u = 250 from the north wall and along
// v = 205 to the east wall
const SHELF = { u: 250, v: 205, h: 500 };
// the streets: [from, to] across each
const N_ST: UV = [150, 178];      // North Street (u): the north gate down to West Street
const WE_ST: UV = [372, 402];     // West Street and East Street (v): gate to gate through the square
const S_ST: UV = [326, 354];      // South Street (u), and Temple Street north of the square
const CLIFF: UV = [250, 270];     // Cliff Lane (v): North Street along the foot of the rock face to the cart ramp
const RAMP_LN: UV = [590, 612];   // Ramp Lane (u): Cliff Lane down to East Street
const W_LANE: UV = [195, 215];    // West Lane (u): West Street to the south wall
const LOW: UV = [520, 540];       // Well Lane (west of South Street) and Smith Lane (east of it) (v)
const UP_LN: UV = [168, 188];     // the upper lane on the terrace (v): the forecourt east to the cart ramp
const SQ = { u0: 260, u1: 420, v0: 330, v1: 445 };   // the Ancestor Square
const STONE: UV = [340, 382];
const WELL_SQ = { u0: 180, u1: 230, v0: 505, v1: 555 }; // the well square on West Lane
const HALL: UV = [293, SQ.v0 - 880 / PX];                // the elders' hall, its portico on the square
// the temple stair and the cart ramp: straight up the rock face from Cliff Lane
const STAIR = { u: 340, top: SHELF.v, bottom: SHELF.v + 1200 / PX };
const CART = { u: 601, top: SHELF.v, bottom: SHELF.v + 1150 / PX };
// the temple on the terrace, its forecourt before it
const TEMPLE: UV = [340, 130];
const FORE = { u0: 296, u1: 384, v0: 168, v1: SHELF.v };
// the mountains beyond the wall: two steps, nested in the terrace
const MOUNT1 = 1700, MOUNT2 = 2900;

export function buildHighland(quality: { flowers: number }): Town {
  const town = new TownBuilder(31);
  const { put, rnd, extra } = town;
  const at = (u: number, v: number) => P(u, v);

  // ---- the ground: the terrace and the mountains (plateaus with rock faces), rolling ground
  // outside ----
  const xs = (v: number) => P(0, v)[0], ys = (u: number) => P(u, 0)[1];
  const NORTH = xs(WALL.v0), SOUTH = xs(WALL.v1), WEST = ys(WALL.u0), EAST = ys(WALL.u1);
  const terrain = new Terrain({
    plateaus: [
      {
        poly: [P(SHELF.u, SHELF.v), P(SHELF.u, -330), P(1030, -330), P(1030, SHELF.v)],
        h: SHELF.h,
        ramps: [
          { top: P(STAIR.u, STAIR.top), bottom: P(STAIR.u, STAIR.bottom), width: 600, straight: true },
          { top: P(CART.u, CART.top), bottom: P(CART.u, CART.bottom), width: 440 },
        ],
      },
      // the first step of the mountains: from 7 m behind the upper wall
      { poly: [P(SHELF.u + 14, 33), P(668, 33), P(668, 186), P(1015, 186), P(1015, -315), P(SHELF.u + 14, -315)], h: MOUNT1 },
      // and the high peaks behind
      { poly: [P(330, -40), P(745, -40), P(745, 120), P(1000, 120), P(1000, -300), P(330, -300)], h: MOUNT2 },
    ],
    hills: [
      { x: P(0, 820)[0], y: P(-150, 0)[1], r: 2600, h: 260 },
      { x: P(0, 760)[0], y: P(820, 0)[1], r: 2400, h: 220 },
      { x: P(0, 280)[0], y: P(-170, 0)[1], r: 2200, h: 240 },
      { x: P(0, -140)[0], y: P(-60, 0)[1], r: 2600, h: 300 },
      { x: P(0, 520)[0], y: P(900, 0)[1], r: 2000, h: 180 },
    ],
    rock: "CliffSnow",
    detail: 8400,
  });
  town.terrain = terrain;

  // roads (cobbles under trodden snow) and the plazas (flagstones)
  const roads: Poly[] = [
    rect(N_ST[0], -500, N_ST[1], WE_ST[1]),                  // North Street, from outside the north gate
    rect(-500, WE_ST[0], 1200, WE_ST[1]),                    // West Street and East Street, out of both gates
    rect(S_ST[0], SQ.v1, S_ST[1], 1200),                     // South Street, out of the south gate
    rect(S_ST[0], CLIFF[0], S_ST[1], SQ.v0),                 // Temple Street
    rect(STAIR.u - 12, SHELF.v - 6, STAIR.u + 12, CLIFF[0]), // (under the stair)
    rect(N_ST[1], CLIFF[0], RAMP_LN[1], CLIFF[1]),           // Cliff Lane
    rect(RAMP_LN[0], CLIFF[0], RAMP_LN[1], WE_ST[0]),        // Ramp Lane
    rect(CART.u - 8, SHELF.v - 30, CART.u + 8, CLIFF[0]),    // up the cart ramp
    rect(FORE.u1, UP_LN[0], RAMP_LN[1], UP_LN[1]),           // the upper lane
    rect(RAMP_LN[0], UP_LN[0], RAMP_LN[1], SHELF.v - 10),
    rect(W_LANE[0], WE_ST[1], W_LANE[1], WALL.v1 - 14),      // West Lane
    rect(WALL.u0 + 14, LOW[0], S_ST[0], LOW[1]),             // Well Lane
    rect(S_ST[1], LOW[0], WALL.u1 - 14, LOW[1]),             // Smith Lane
  ];
  const plazas: Poly[] = [
    rect(SQ.u0, SQ.v0, SQ.u1, SQ.v1),
    rect(FORE.u0, FORE.v0, FORE.u1, FORE.v1),
    rect(WELL_SQ.u0, WELL_SQ.v0, WELL_SQ.u1, WELL_SQ.v1),
  ];
  const area = { x0: -15000, x1: 17000, y0: -17000, y1: 15000 };
  const ground = buildPaved({
    area, roads, plazas, base: "snow", road: [0.8, 0.83, 0.92], plaza: [0.76, 0.79, 0.86],
    height: (x, y) => terrain.height(x, y), place: (x, y, cell) => terrain.place(x, y, cell),
  });
  const kindAt = (u: number, v: number) => ground.kind(...P(u, v));
  const snow = (x: number, y: number) => ground.kind(x, y) === 0;

  // what already stands, to keep the lamps, trees and props clear of it
  const known: SolidSpec[] = [];
  let seen = 0;
  const clear = (x: number, y: number, r: number): boolean => {
    for (; seen < town.puts.length; seen++) known.push(...solidsOf(town.puts[seen], protoOf(town.puts[seen].ref, town.puts[seen].colours)));
    return [...known, ...extra].every((sp) => {
      const dx = x - sp.x, dy = y - sp.y;
      if ("r" in sp) return Math.hypot(dx, dy) > sp.r + r;
      const a = (sp.rot * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
      const lx = Math.abs(dx * c + dy * s) - sp.w / 2, ly = Math.abs(-dx * s + dy * c) - sp.d / 2;
      return Math.hypot(Math.max(lx, 0), Math.max(ly, 0)) > r;
    });
  };
  // a prop at plan (u, v) only where it stands clear, on level open snow (or paving, with `paved`)
  const prop = (ref: string, u: number, v: number, h: number, r: number, o: { paved?: boolean; s?: number; solid?: "none" } = {}) => {
    const [x, y] = P(u, v);
    if ((o.paved || snow(x, y)) && terrain.level(x, y, r * 0.6) && clear(x, y, r)) put(ref, [x, y], h, { ...(o.s ? { s: o.s } : {}), ...(o.solid ? { solid: o.solid } : {}) });
  };
  const LAMP: SolidSpec[] = [{ kind: "post", x: 0, y: 0, r: 30 }];
  const lamp = (u: number, v: number, paved = false) => {
    const [x, y] = P(u, v);
    if ((paved || snow(x, y)) && terrain.level(x, y, 60) && clear(x, y, 140)) put("highland:street_lamp", [x, y], 0, { solid: LAMP });
  };

  // ---- the town wall: 8 m lengths between round towers, the gates; on the terrace the wall
  // stands 5 m higher, its two runs meeting the rock face at towers top and bottom ----
  const run = (a: UV, b: UV, out: Side, gaps: number[] = []) => town.wall(P(a[0], a[1]), P(b[0], b[1]), out, "highland:city_wall", { gaps, gap: 1240 });
  const TOWER: SolidSpec[] = [{ kind: "tower", x: 0, y: 0, r: 320 }];
  const tower = (u: number, v: number) => put("highland:wall_tower", at(u, v), 0, { solid: TOWER });
  // the lower town: north (west of the terrace), west, south, east (south of the terrace)
  run([WALL.u0, WALL.v0], [SHELF.u - 18, WALL.v0], "n", [(GATE_N[0] - WALL.u0) * PX]);
  run([WALL.u0, WALL.v0], [WALL.u0, WALL.v1], "w", [(GATE_W[1] - WALL.v0) * PX]);
  run([WALL.u0, WALL.v1], [WALL.u1, WALL.v1], "s", [(GATE_S[0] - WALL.u0) * PX]);
  run([WALL.u1, SHELF.v + 20], [WALL.u1, WALL.v1], "e", [(GATE_E[1] - SHELF.v - 20) * PX]);
  // on the terrace
  run([SHELF.u + 20, WALL.v0], [WALL.u1, WALL.v0], "n");
  run([WALL.u1, WALL.v0], [WALL.u1, SHELF.v - 20], "e");
  for (const [u, v] of [[WALL.u0, WALL.v0], [WALL.u0, WALL.v1], [WALL.u1, WALL.v1], [WALL.u1, WALL.v0], [SHELF.u - 18, WALL.v0], [SHELF.u + 20, WALL.v0], [WALL.u1, SHELF.v + 20], [WALL.u1, SHELF.v - 20]] as UV[]) tower(u, v);
  for (const v of [220, 540]) tower(WALL.u0, v);
  for (const u of [210, 490]) tower(u, WALL.v1);
  tower(WALL.u1, 520);
  tower(450, WALL.v0);
  // the gates: square towers either side of an open passage along the gate's own X
  const gateSolid: SolidSpec[] = [
    { kind: "gate", x: 0, y: -380, w: 390, d: 390, rot: 0 },
    { kind: "gate", x: 0, y: 380, w: 390, d: 390, rot: 0 },
  ];
  put("highland:city_gate", at(...GATE_N), FACE.n, { solid: gateSolid });
  put("highland:city_gate", at(...GATE_S), FACE.s, { solid: gateSolid });
  put("highland:city_gate", at(...GATE_W), FACE.w, { solid: gateSolid });
  put("highland:city_gate", at(...GATE_E), FACE.e, { solid: gateSolid });

  // ---- the landmarks ----
  // the Ancestor Stone in the middle of the square, facing the way in from the south
  put("highland:ancestor_stone", at(...STONE), FACE.s, { s: 1.45, solid: [{ kind: "landmark", x: 0, y: 0, r: 360 }] });
  // the Ancestors' Temple on the terrace, facing south down the stair
  put("highland:ancestors_temple", at(...TEMPLE), FACE.s);
  // the temple stair: five flights of steps up the straight ramp
  {
    const [bx, by] = P(STAIR.u, STAIR.bottom), [tx] = P(STAIR.u, STAIR.top);
    for (let i = 0; i < 5; i++) put("highland:temple_stair", [bx + ((tx - bx) * (i + 0.5)) / 5, by], 0, { z: -50, solid: "none" });
  }
  // the elders' hall on the north side of the square, its portico on the square
  put("highland:elders_hall", at(...HALL), FACE.s);

  // ---- the houses: rows along the streets, their fronts on a line, spread evenly ----
  // A row facing `side` with the fronts on plan line `line` (v for n/s, u for e/w), from `from` to
  // `to` along it; each piece in a colourway; pieces that do not fit are left off the end.
  const ref = (pc: string) => (pc.includes(":") ? pc : `highland:${pc}`);
  const row = (side: Side, line: number, from: number, to: number, pieces: string[], o: { tints?: string[]; even?: boolean } = {}) => {
    const refs = pieces.map(ref), width = (r: string) => { const f = protoOf(r).foot; return (f.y1 - f.y0) / PX; };
    while (refs.length > 1 && refs.reduce((t, r) => t + width(r), 0) > to - from + 2) refs.pop();
    const ws = refs.map(width), gap = (to - from - ws.reduce((t, w) => t + w, 0)) / refs.length;
    let t = from + gap / 2;
    refs.forEach((r, i) => {
      const f = protoOf(r).foot, back = -f.x0 / PX, mid = t + ws[i] / 2 + ((f.y0 + f.y1) / 2 / PX) * (side === "n" || side === "e" ? -1 : 1);
      const [u, v] = side === "s" ? [mid, line - back] : side === "n" ? [mid, line + back] : side === "e" ? [line - back, mid] : [line + back, mid];
      const tints = o.tints ?? TINTS, colours = r.startsWith("highland:") ? tints[Math.floor(rnd() * tints.length)] || undefined : undefined;
      put(r, at(u, v), FACE[side], { colours });
      t += ws[i] + gap;
    });
  };
  const SH = "stone_house", TL = "stone_house_tall", CT = "cottage";
  // the square: the north side east of Temple Street, the west side south of West Street, the
  // south side either side of South Street
  row("s", SQ.v0 - 4, S_ST[1] + 4, SQ.u1, [TL, TL]);
  row("e", SQ.u0 - 4, WE_ST[1] + 4, SQ.v1 - 4, [CT]);
  row("n", SQ.v1 + 4, SQ.u0, S_ST[0] - 4, [TL, CT]);
  row("n", SQ.v1 + 4, S_ST[1] + 4, 460, [TL, SH]);
  // North Street: the farmhouse and houses down its east side, facing west
  put("highland:farmhouse", at(N_ST[1] + 4 + 534 / PX, 112), FACE.w);
  row("w", N_ST[1] + 4, 158, CLIFF[0] - 4, [TL, CT]);
  row("w", N_ST[1] + 4, CLIFF[1] + 4, WE_ST[0] - 4, [SH, TL]);
  // Cliff Lane: cottages under the rock face, houses along its south side
  row("s", CLIFF[0] - 4, S_ST[1] + 50, RAMP_LN[0] - 4, [CT, CT, CT, CT, CT]);
  row("n", CLIFF[1] + 4, SQ.u1 + 6, RAMP_LN[0] - 4, [SH, TL, SH, TL]);
  // East Street: the north side (back to back with Cliff Lane's), the south side to the smithy
  row("s", WE_ST[0] - 4, SQ.u1 + 6, RAMP_LN[0] - 4, [TL, SH, TL, SH]);
  row("n", WE_ST[1] + 4, 464, 562, [SH, TL]);
  put("iceberg:smithy", at(600, WE_ST[1] + 4 + 384 / PX), FACE.n);
  // West Street's south side, back to back with Well Lane's north side
  row("n", WE_ST[1] + 4, WALL.u0 + 24, W_LANE[0] - 4, [SH, TL]);
  row("s", LOW[0] - 4, WALL.u0 + 20, W_LANE[0] - 4, [CT, SH]);
  // West Lane: both sides
  row("w", W_LANE[1] + 4, WE_ST[1] + 50, WELL_SQ.v0 - 4, [CT]);
  row("w", W_LANE[1] + 4, WELL_SQ.v1 + 4, WALL.v1 - 20, [TL, CT]);
  row("e", W_LANE[0] - 4, WELL_SQ.v1 + 4, WALL.v1 - 20, [CT, TL]);
  // South Street below the lanes, both sides
  row("e", S_ST[0] - 4, LOW[1] + 4, WALL.v1 - 30, [TL, TL]);
  row("w", S_ST[1] + 4, LOW[1] + 4, WALL.v1 - 30, [TL, TL]);
  // Smith Lane: both sides
  row("s", LOW[0] - 4, 466, WALL.u1 - 20, [SH, TL, CT, SH]);
  row("n", LOW[1] + 4, S_ST[1] + 70, WALL.u1 - 20, [CT, SH, TL, CT]);

  // ---- the farm quarter (north-west): glasshouses facing North Street, cold frames behind them,
  // walled plots down to West Street ----
  for (const v of [92, 146, 200]) {
    put("highland:glasshouse", at(N_ST[0] - 4 - 659 / PX, v), FACE.e);
    put("highland:cold_frames", at(WALL.u0 + 16, v + (v === 146 ? -6 : 6)), FACE.e);
  }
  // the walled plots: a grid of beds inside dry-stone walls
  const PLOT_V = [250, 278, 306, 334];
  for (const v of PLOT_V) for (const u of [82, 122]) put("highland:veg_plot", at(u, v), FACE.e);
  const fw = (u0: number, v0: number, u1: number, v1: number) => {
    const A = P(u0, v0), B = P(u1, v1), L = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(1, Math.round(L / 400));
    const h = v0 === v1 ? 0 : 90;
    for (let i = 0; i < n; i++) put("highland:field_wall", [A[0] + ((B[0] - A[0]) * (i + 0.5)) / n, A[1] + ((B[1] - A[1]) * (i + 0.5)) / n], h, { sy: L / n / 400 });
  };
  fw(WALL.u0 + 8, 232, N_ST[0] - 6, 232);
  fw(N_ST[0] - 6, 232, N_ST[0] - 6, 290);
  fw(N_ST[0] - 6, 316, N_ST[0] - 6, WE_ST[0] - 6);
  fw(WALL.u0 + 8, WE_ST[0] - 6, N_ST[0] - 6, WE_ST[0] - 6);
  prop("highland:barley_stooks", N_ST[0] - 14, 300, 20, 60);
  prop("highland:barley_stooks", N_ST[0] - 16, 306, 70, 60);
  // the farmyard: stooks, a woodpile, barrels; a sled
  prop("iceberg:woodpile", 230, 92, FACE.w, 130);
  prop("iceberg:snowy_barrels", 232, 120, 20, 110);
  prop("highland:barley_stooks", 224, 140, 0, 60);
  prop("iceberg:sled", 190, 152, FACE.w + 20, 120);

  // ---- the high terrace ----
  // the forecourt: braziers either side of the stair head, lamps, the keeper's bench
  prop("iceberg:brazier", STAIR.u - 18, SHELF.v - 14, 0, 50, { paved: true });
  prop("iceberg:brazier", STAIR.u + 18, SHELF.v - 14, 0, 50, { paved: true });
  for (const u of [FORE.u0 + 6, FORE.u1 - 6]) lamp(u, FORE.v0 + 8, true);
  prop("common:bench", FORE.u0 + 10, 190, FACE.e, 80, { paved: true });
  // a sacred grove of pines west of the temple
  for (const [u, v, s] of [[268, 80, 1], [282, 112, 0.85], [266, 140, 1.1], [288, 170, 0.8], [270, 192, 0.9], [300, 84, 0.75]] as const) prop(`flora:${v % 2 ? "SnowPineSmall" : "SnowPine"}`, u, v, rnd() * 360, 120, { s });
  // the high plots east of the temple: walled beds, a glasshouse, the shepherd's croft and pen
  for (const u of [418, 448]) for (const v of [92, 124]) put("highland:veg_plot", at(u, v), FACE.s);
  fw(402, 74, 466, 74);
  fw(402, 74, 402, 142);
  fw(466, 74, 466, 142);
  put("highland:glasshouse", at(500, 104), FACE.s);
  put("highland:cottage", at(555, 100), FACE.s);
  put("highland:sheep_pen", at(604, 112), FACE.s);
  prop("iceberg:woodpile", 532, 152, 0, 110);
  prop("highland:barley_stooks", 480, 156, 30, 60);
  prop("highland:barley_stooks", 470, 150, 80, 60);
  prop("highland:cold_frames", 566, 140, FACE.s, 120);
  prop("iceberg:sled", 584, 150, FACE.e, 110);
  for (const [u, v] of [[628, 80], [392, 150], [470, 76]] as UV[]) prop("flora:SnowPineSmall", u, v, rnd() * 360, 120, { s: 0.8 });

  // ---- the square: the stone in the middle, lamps round it, the market stalls, the well ----
  {
    const [cu, cv] = STONE;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      lamp(cu + Math.cos(a) * 30, cv + Math.sin(a) * 30, true);
    }
    for (const [u, v] of [[SQ.u0 + 6, SQ.v0 + 6], [SQ.u1 - 6, SQ.v0 + 6], [SQ.u0 + 6, SQ.v1 - 6], [SQ.u1 - 6, SQ.v1 - 6]] as UV[]) lamp(u, v, true);
    // the market: stalls of the winter's crops along the square's east and west ends
    for (const v of [WE_ST[0] - 22, WE_ST[1] + 22]) {
      prop("highland:veg_stall", SQ.u1 - 16, v, FACE.w, 120, { paved: true });
      prop("highland:veg_stall", SQ.u0 + 16, v, FACE.e, 120, { paved: true });
    }
    for (const u of [SQ.u0 + 34, SQ.u1 - 34]) prop("highland:veg_stall", u, SQ.v1 - 16, FACE.n, 120, { paved: true });
    for (const [u, v] of [[SQ.u0 + 30, SQ.v0 + 18], [SQ.u1 - 30, SQ.v0 + 18]] as UV[]) prop("flora:FrostOak", u, v, rnd() * 360, 150, { paved: true, s: 0.8 });
    for (const [u, v, h] of [[SQ.u1 - 12, SQ.v0 + 40, 10], [SQ.u1 - 10, SQ.v0 + 46, 50], [SQ.u0 + 12, SQ.v0 + 42, 30]] as const) prop("common:crate", u, v, h, 50, { paved: true });
    prop("common:market_cart", SQ.u1 - 34, SQ.v1 - 12, FACE.n, 100, { paved: true });
    prop("iceberg:snowy_barrels", SQ.u0 + 12, SQ.v1 - 14, 30, 100, { paved: true });
    prop("iceberg:sled", SQ.u0 + 36, SQ.v1 - 10, FACE.n + 10, 110, { paved: true });
    for (const [u, v, h] of [[cu - 50, cv - 26, FACE.s], [cu + 50, cv - 26, FACE.s], [cu - 50, cv + 34, FACE.n], [cu + 50, cv + 34, FACE.n]] as const) prop("common:bench", u, v, h, 80, { paved: true });
  }
  put("highland:well", at((WELL_SQ.u0 + WELL_SQ.u1) / 2, (WELL_SQ.v0 + WELL_SQ.v1) / 2), 0, { solid: [{ kind: "well", x: 0, y: 0, r: 150 }] });
  for (const [u, v] of [[WELL_SQ.u0 + 4, WELL_SQ.v0 + 4], [WELL_SQ.u1 - 4, WELL_SQ.v1 - 4]] as UV[]) lamp(u, v, true);
  // the stair foot: lamps either side; the smithy's yard
  for (const u of [S_ST[0] - 4, S_ST[1] + 4]) lamp(u, CLIFF[1] + 4, true);
  prop("iceberg:snowy_barrels", 574, WE_ST[1] + 12, 0, 100, { paved: true });
  prop("iceberg:woodpile", 628, 440, FACE.w, 110);

  // ---- the sheep pen by the west gate, the shepherd's ricks ----
  put("highland:sheep_pen", at(96, 586), FACE.e);
  prop("highland:barley_stooks", 128, 560, 10, 60);
  prop("iceberg:snowy_barrels", 126, 612, 40, 100);

  // ---- lamps down the streets, every 12 m a side by turns, on the snow just off the road ----
  const lamps = (u0: number, v0: number, u1: number, v1: number) => {
    const ew = u1 - u0 > v1 - v0, [a0, a1] = ew ? [u0, u1] : [v0, v1];
    for (let t = a0 + 24, i = 0; t < a1 - 6; t += 23, i++) {
      const off = i % 2 ? (ew ? v1 : u1) + 4 : (ew ? v0 : u0) - 4;
      if (ew) lamp(t, off);
      else lamp(off, t);
    }
  };
  lamps(N_ST[0], WALL.v0 + 20, N_ST[1], WE_ST[0]);
  lamps(WALL.u0 + 20, WE_ST[0], SQ.u0, WE_ST[1]);
  lamps(SQ.u1, WE_ST[0], WALL.u1 - 20, WE_ST[1]);
  lamps(S_ST[0], SQ.v1, S_ST[1], WALL.v1 - 20);
  lamps(N_ST[1], CLIFF[0], RAMP_LN[0], CLIFF[1]);
  lamps(W_LANE[0], WE_ST[1], W_LANE[1], WALL.v1 - 20);
  lamps(WALL.u0 + 20, LOW[0], S_ST[0], LOW[1]);
  lamps(S_ST[1], LOW[0], WALL.u1 - 20, LOW[1]);
  lamps(FORE.u1, UP_LN[0], RAMP_LN[1], UP_LN[1]);

  // ---- the yards behind the houses: little walled plots, cold frames, woodpiles ----
  for (const [u, v] of [[100, 466], [150, 466], [245, 474], [282, 596], [480, 470], [530, 466], [440, 596], [530, 600], [590, 596], [470, 300], [520, 302], [96, 630]] as UV[]) {
    const k = Math.floor(rnd() * 4);
    if (k === 0) prop("highland:veg_plot", u, v, rnd() < 0.5 ? FACE.s : FACE.e, 330);
    else if (k === 1) prop("highland:cold_frames", u, v, rnd() < 0.5 ? FACE.s : FACE.e, 260);
    else if (k === 2) prop("iceberg:woodpile", u, v, rnd() * 360, 200);
    else prop("iceberg:snowy_barrels", u, v, rnd() * 360, 150);
  }

  // ---- snow drifted against the walls, trees on the open snow inside ----
  for (let i = 0; i < 26; i++) {
    const side = i % 4, t = 80 + rnd() * 480;
    const [u, v] = side === 0 ? [t, WALL.v0 + 12] : side === 1 ? [t, WALL.v1 - 12] : side === 2 ? [WALL.u0 + 12, t] : [WALL.u1 - 12, t];
    prop("highland:snow_drift", u, v, side < 2 ? 0 : 90, 130, { solid: "none" });
  }
  const TREES = ["SnowPine", "SnowPineSmall", "FrostOak", "SnowPine", "SnowPineSmall"];
  for (let u = WALL.u0 + 20; u < WALL.u1 - 16; u += 22)
    for (let v = WALL.v0 + 20; v < WALL.v1 - 16; v += 22) {
      const pu = u + (rnd() - 0.5) * 14, pv = v + (rnd() - 0.5) * 14;
      if ([[0, 0], [10, 0], [-10, 0], [0, 10], [0, -10]].some(([du, dv]) => kindAt(pu + du, pv + dv) !== 0)) continue;
      if (rnd() > 0.72) continue;
      prop(`flora:${TREES[Math.floor(rnd() * TREES.length)]}`, pu, pv, rnd() * 360, 260, { s: 0.65 + rnd() * 0.35 });
    }

  // ---- outside: the mountains' crags, snowy woods, field walls on the downs ----
  // crags along the brows of the two steps and on the peaks behind
  const crag = (u: number, v: number, s: number) => put("highland:mountain_crag", at(u, v), rnd() * 360, { s, solid: "none" });
  for (const [u, v, s] of [[300, 0, 0.9], [372, -6, 1.1], [452, 0, 0.95], [530, -8, 1.15], [610, -2, 1], [690, -10, 1.1], [704, 70, 1.05], [708, 140, 0.95], [760, 160, 1], [850, 160, 1.1]] as const) crag(u, v, s);
  for (const [u, v, s] of [[420, -110, 2.2], [540, -130, 2.6], [660, -110, 2.4], [800, -40, 2.5], [830, 70, 2], [930, 40, 2.6], [760, -220, 3], [560, -260, 3], [380, -230, 2.6]] as const) crag(u, v, s);
  // the woods round the town, off the roads and the rock
  town.woods({ x0: area.x0 + 600, x1: area.x1 - 600, y0: area.y0 + 600, y1: area.y1 - 600 }, ["SnowPine", "SnowPine", "SnowPineSmall", "FrostOak", "SnowPine"], (x, y) => {
    const inside = x > SOUTH - 900 && x < NORTH + 900 && y > EAST - 900 && y < WEST + 900;
    const road = [[0, 0], [600, 0], [-600, 0], [0, 600], [0, -600]].some(([dx, dy]) => ground.kind(x + dx, y + dy) === 1);
    return inside || road;
  }, { count: Math.round(260 + 120 * Math.min(1, quality.flowers)), tries: 7000, spacing: 520 });
  // the downs west of the wall: fields walled with dry stone, stooks in the snow
  const fieldRun = (a: UV, b: UV) => {
    const A = P(a[0], a[1]), B = P(b[0], b[1]), L = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.round(L / 400);
    const h = (Math.atan2(B[1] - A[1], B[0] - A[0]) * 180) / Math.PI - 90;
    for (let i = 0; i < n; i++) {
      const x = A[0] + ((B[0] - A[0]) * (i + 0.5)) / n, y = A[1] + ((B[1] - A[1]) * (i + 0.5)) / n;
      if (ground.kind(x, y) === 0 && terrain.level(x, y, 150)) put("highland:field_wall", [x, y], h, { sy: L / n / 400, solid: "none" });
    }
  };
  fieldRun([20, 80], [-160, 80]);
  fieldRun([20, 240], [-160, 260]);
  fieldRun([20, 520], [-170, 500]);
  fieldRun([-60, 80], [-70, 340]);
  fieldRun([-60, 420], [-60, 640]);
  fieldRun([20, 680], [-140, 690]);
  fieldRun([700, 450], [860, 460]);
  fieldRun([700, 620], [880, 600]);
  fieldRun([780, 300], [780, 600]);
  for (const [u, v] of [[-20, 160], [-110, 200], [-30, 600], [-100, 560], [760, 520], [820, 540], [-120, 300]] as UV[]) prop("highland:barley_stooks", u, v, rnd() * 360, 80, { solid: "none" });
  // boulders and cairns on the open ground, a trail sign by the road out of each gate
  for (const [u, v, k] of [[-90, 120, "rock_cluster"], [-140, 430, "snow_boulder"], [30, 720, "rock_cluster"], [700, 700, "snow_boulder"], [760, 330, "rock_cluster"], [80, -60, "snow_boulder"], [250, 760, "flat_slabs"], [520, 720, "rock_cluster"], [-60, 380, "cairn"], [740, 400, "cairn"], [190, -150, "cairn"]] as const)
    prop(`snowland:${k}`, u, v, rnd() * 360, 200, { solid: "none" });
  for (const [u, v, h] of [[GATE_S[0] + 26, WALL.v1 + 40, FACE.s], [GATE_N[0] + 26, WALL.v0 - 40, FACE.n], [WALL.u0 - 40, GATE_W[1] - 26, FACE.w], [WALL.u1 + 40, GATE_E[1] + 26, FACE.e]] as const)
    prop("snowland:trail_sign", u, v, h, 60, { solid: "none" });

  // ---- build ----
  // a piece that ended up on a rock face stands on its top or at its foot instead
  for (const pl of town.puts) {
    const z = terrain.standAt(pl.x, pl.y);
    if (z !== null) pl.z += z - terrain.height(pl.x, pl.y);
  }
  const pt = (u: number, v: number) => ({ x: P(u, v)[0], y: P(u, v)[1] });
  const built = town.finish({
    ground,
    sky: "#b9c7d8",
    bounds: { minX: SOUTH - 700, maxX: NORTH + 700, minY: EAST - 700, maxY: WEST + 700 },
    // in the square, south of the stone by the travel guide
    spawn: pt(STONE[0] - 14, STONE[1] + 46),
    npcs: highlandNpcs(),
    ...waysOut([
      gateWay(at(...GATE_S), "s", "frozen_river", 480, 420),
      gateWay(at(...GATE_N), "n", "north_cliffs", 480, 420),
      gateWay(at(...GATE_W), "w", "highland_downs", 480, 420),
      gateWay(at(...GATE_E), "e", "tangled_hills", 480, 420),
    ]),
    closed: [],
    labels: [
      { ...pt(STONE[0], STONE[1] + 40), text: "ลานหินบรรพบุรุษ" },
      { ...pt(TEMPLE[0], FORE.v0 + 14), text: "วิหารบรรพบุรุษ" },
      { ...pt(HALL[0], SQ.v0 + 14), text: "หอผู้อาวุโส", kind: "small" },
      { ...pt(110, 120), text: "เรือนกระจก" },
      { ...pt(102, 300), text: "แปลงผักใต้หิมะ", kind: "small" },
      { ...pt(214, 112), text: "ฟาร์มเฮาส์", kind: "small" },
      { ...pt(500, UP_LN[0] - 6), text: "ไร่บนเนิน", kind: "small" },
      { ...pt(STAIR.u + 22, CLIFF[0] - 14), text: "บันไดวิหาร", kind: "small" },
      { ...pt(600, WE_ST[1] + 26), text: "โรงตีเหล็ก", kind: "small" },
      { ...pt((WELL_SQ.u0 + WELL_SQ.u1) / 2, WELL_SQ.v1 + 6), text: "ลานบ่อน้ำ", kind: "small" },
      { ...pt(130, 560), text: "คอกแกะ", kind: "small" },
      { ...pt(GATE_N[0], WALL.v0 + 22), text: "ประตูเหนือ · หน้าผาทะเลเหนือ", kind: "gate" },
      { ...pt(GATE_S[0], WALL.v1 - 22), text: "ประตูใต้ · แม่น้ำเยือกแข็ง", kind: "gate" },
      { ...pt(WALL.u0 + 22, GATE_W[1]), text: "ประตูตะวันตก · ที่ราบเนินเขา", kind: "gate" },
      { ...pt(WALL.u1 - 22, GATE_E[1]), text: "ประตูตะวันออก · เนินเขาวงกต", kind: "gate" },
    ],
  });
  // the rock faces' solids far out past the edge of the walkable box keep nobody out of anything
  const b = built.bounds, m = 900;
  built.solids = built.solids.filter((sp) => sp.x > b.minX - m && sp.x < b.maxX + m && sp.y > b.minY - m && sp.y < b.maxY + m);
  return built;
}

// ---- the townsfolk ----
function highlandNpcs(): NpcSpec[] {
  const at = (u: number, v: number) => {
    const [x, y] = P(u, v);
    return { x, y };
  };
  // the heading (world degrees, 0 = +X) from plan (u, v) toward plan (tu, tv)
  const toward = (u: number, v: number, tu: number, tv: number) => {
    const [x, y] = P(u, v), [tx, ty] = P(tu, tv);
    return (Math.atan2(ty - y, tx - x) * 180) / Math.PI;
  };
  const man = (top: string, hairColor = "ink", bottom = "bottom_warrior_black", eyes = "blue") => ({ gender: "male", hair: "", hairColor, eyes, top, bottom });
  const woman = (top: string, bottom: string, hairColor: string, hair = "hime", eyes = "teal") => ({ gender: "female", hair, hairColor, eyes, top, bottom });
  const [su, sv] = STONE;
  return [
    travelGuide("highland", P(su + 16, sv + 44), toward(su + 16, sv + 44, su, sv), "เอลซ่า"),
    // the gate guards: two inside each gate, facing into the town
    { id: "highland_guard_s1", ...at(GATE_S[0] - 16, WALL.v1 - 20), face: 0, name: "ทหารยามแบรนด์", title: "ทหารยามประตูใต้", role: "talk", look: man("top_warrior_navy", "auburn"),
      lines: ["ออกประตูใต้ไปคือแม่น้ำเยือกแข็ง เดินเลียบฝั่งลงไปจะถึงเมืองโนอา", "สะพานหินเก่าข้ามแม่น้ำพังไปครึ่งหนึ่งแล้ว เดินบนน้ำแข็งต้องดูให้ดี"] },
    { id: "highland_guard_s2", ...at(GATE_S[0] + 16, WALL.v1 - 20), face: 0, name: "ทหารยามโคลิน", title: "ทหารยามประตูใต้", role: "talk", look: man("top_warrior_navy", "ink"),
      lines: ["ไฮแลนด์ ฮิลยินดีต้อนรับ เดินตรงขึ้นไปคือลานหินบรรพบุรุษ", "พ่อค้าจากโนอาขึ้นมาซื้อมันฝรั่งกับขนแกะทุกต้นฤดูหนาว"] },
    { id: "highland_guard_n1", ...at(GATE_N[0] - 16, WALL.v0 + 20), face: 180, name: "ทหารยามดันแคน", title: "ทหารยามประตูเหนือ", role: "talk", look: man("top_warrior", "gold"),
      lines: ["ออกประตูเหนือไปคือหน้าผาทะเลเหนือ ลมจากทะเลน้ำแข็งแรงจนยืนแทบไม่อยู่", "ประภาคารร้างบนหน้าผานั่น มีคนเห็นแสงไฟวูบวาบตอนกลางคืน"] },
    { id: "highland_guard_n2", ...at(GATE_N[0] + 16, WALL.v0 + 20), face: 180, name: "ทหารยามอีวาน", title: "ทหารยามประตูเหนือ", role: "talk", look: man("top_warrior", "ink"),
      lines: ["มอนสเตอร์แถวหน้าผาแกร่งที่สุดในแดนตะวันตก ไม่ถึงเลเวลร้อยแปดสิบอย่าเพิ่งไป", "ฟาร์มกับเรือนกระจกอยู่ตามถนนเหนือนี่เอง"] },
    { id: "highland_guard_w1", ...at(WALL.u0 + 20, GATE_W[1] - 16), face: -90, name: "ทหารยามแองกัส", title: "ทหารยามประตูตะวันตก", role: "talk", look: man("top_warrior_forest", "auburn", "bottom_warrior_cocoa"),
      lines: ["ออกประตูตะวันตกไปคือที่ราบเนินเขา ทุ่งหิมะบางๆ กับกำแพงหินแห้งของชาวไร่", "ลงใต้ต่อจากที่ราบเนินเขาไปเป็นภูผาหินปูน ทางไปซูโจวต้องผ่านตรงนั้น"] },
    { id: "highland_guard_w2", ...at(WALL.u0 + 20, GATE_W[1] + 16), face: -90, name: "ทหารยามเฟอร์กัส", title: "ทหารยามประตูตะวันตก", role: "talk", look: man("top_warrior_forest", "ink", "bottom_warrior_cocoa"),
      lines: ["วงหินบนเนินทางตะวันตกเก่าแก่พอๆ กับหินบรรพบุรุษเลยนะ", "คนเลี้ยงแกะต้อนแกะกลับเข้าคอกก่อนมืดทุกวัน"] },
    { id: "highland_guard_e1", ...at(WALL.u1 - 20, GATE_E[1] - 16), face: 90, name: "ทหารยามรอรี่", title: "ทหารยามประตูตะวันออก", role: "talk", look: man("top_warrior_navy", "silver"),
      lines: ["ออกประตูตะวันออกไปคือเนินเขาวงกต เนินกับหุบซ้อนกันจนหลงทางง่ายมาก", "ข้ามเนินเขาวงกตไปได้จะออกเชิงเขาหิมะ ทางไปถนนหลวงของอีเดน"] },
    { id: "highland_guard_e2", ...at(WALL.u1 - 20, GATE_E[1] + 16), face: 90, name: "ทหารยามคีแรน", title: "ทหารยามประตูตะวันออก", role: "talk", look: man("top_warrior_navy", "ink"),
      lines: ["โรงตีเหล็กของเบรนนาอยู่ตรงนี้เอง อาวุธบิ่นก็เอาไปให้นางดู", "จำทางเดินในเนินเขาวงกตไว้ให้ดี ทางลาดขึ้นที่ราบสูงมีหลายทาง แต่ไม่ใช่ทุกทางที่ลงได้"] },
    // the square
    { id: "highland_elder", ...at(293, SQ.v0 + 10), face: toward(293, SQ.v0 + 10, su, sv), name: "ผู้เฒ่าอัลดริก", title: "ผู้อาวุโสแห่งไฮแลนด์ ฮิล", role: "talk", look: man("top_warrior_forest", "silver", "bottom_warrior_cocoa", "amber"),
      lines: [
        "นานมาแล้ว ก่อนมีอาณาจักร ก่อนมีโนอาและอีเดน บรรพบุรุษของพวกเราลงมาจากภูเขาหิมะ",
        "พวกเขาตั้งหินก้อนนั้นไว้ตรงที่หยุดพักครั้งแรก แล้วจารึกชื่อของทุกครอบครัวลงไป ชื่อที่ลงทองไว้คือผู้นำทั้งเจ็ดรุ่นแรก",
        "ลูกหลานแยกย้ายลงไปทางใต้ สร้างเมืองริมแม่น้ำ ริมทะเล แต่ทุกคนในแผ่นดินนี้ล้วนมีชื่ออยู่บนหินนั้นทั้งสิ้น",
        "ข้าเฝ้าเรื่องเล่าพวกนี้ไว้ให้คนรุ่นหลัง อยากฟังอีกเมื่อไรก็มาหาข้าที่หอผู้อาวุโสนะ",
      ] },
    { id: "highland_shop", ...at(SQ.u1 - 30, WE_ST[1] + 22), face: toward(SQ.u1 - 30, WE_ST[1] + 22, su, sv), name: "แม่ค้ามอยรา", title: "ร้านเครื่องมือ", role: "shop", sprite: "merchant",
      lines: ["ยา ผ้าพันคอขนแกะ ตะเกียง มีครบ เข้ามาดูก่อนได้", "มันฝรั่งจากเรือนกระจกหวานกว่าที่ไหน ลองชิมดูสิ"] },
    { id: "highland_child", ...at(su - 34, sv + 10), face: toward(su - 34, sv + 10, su, sv), name: "ไอลี", title: "เด็กหญิงชาวเมือง", role: "talk", look: woman("top_sky", "bottom_navy", "gold", "twintail", "blue"),
      lines: ["ชื่อทวดของทวดของหนูอยู่บนหินนั่นด้วยนะ แถวที่สามจากล่าง!", "ปู่บอกว่าถ้าแตะหินแล้วอธิษฐาน บรรพบุรุษจะคุ้มครองเราตอนเดินทาง"] },
    { id: "highland_bard", ...at(su + 30, sv - 34), face: toward(su + 30, sv - 34, su, sv), name: "ฟินเลย์นักเล่าเรื่อง", title: "นักดนตรีพเนจร", role: "talk", look: man("top_warrior_navy", "rose", "bottom_warrior_cocoa", "amber"),
      lines: ["ข้าเดินทางไปทั่วแผ่นดินเพื่อเก็บเพลงเก่า และทุกเพลงก็พาข้ากลับมาที่หินก้อนนี้", "เพลงที่เก่าที่สุดเล่าว่าบรรพบุรุษข้ามภูเขามาโดยเดินตามดาวเหนือ"] },
    // the temple: the healer at the foot of the stair, the keeper up on the forecourt
    { id: "highland_healer", ...at(S_ST[1] - 6, CLIFF[1] + 22), face: toward(S_ST[1] - 6, CLIFF[1] + 22, su, sv), name: "แม่ชีไอโอนา", title: "นักบวช · รักษาฟรี", role: "heal",
      look: woman("top_priestess_white", "bottom_priestess_white", "silver", "twintail", "teal"),
      lines: ["ขอให้บรรพบุรุษคุ้มครองท่าน", "หายหนาวหายเหนื่อยแล้วนะ ขึ้นบันไดไปวิหารระวังลื่นด้วย"] },
    { id: "highland_keeper", ...at(TEMPLE[0] - 18, FORE.v0 + 14), face: 180, name: "ผู้เฝ้าวิหารเอเวน", title: "ผู้ดูแลวิหารบรรพบุรุษ", role: "talk", look: man("top_warrior_forest", "silver", "bottom_warrior_black", "teal"),
      lines: ["วิหารนี้สร้างไว้บนที่สูงเพื่อให้บรรพบุรุษมองเห็นเมืองทั้งเมือง", "ระฆังบนหอนี้ตีทุกเช้า เสียงก้องไปถึงหุบเขาฝั่งโน้น ว่ากันว่าวิญญาณบรรพบุรุษตื่นมาฟัง", "ไฟในกระถางสองข้างบันไดไม่เคยดับเลยตั้งแต่สร้างวิหาร ข้ากับคนเฝ้าก่อนหน้าข้าเติมฟืนกันมาไม่รู้กี่ร้อยปี"] },
    // the smith by the east gate
    { id: "highland_smith", ...at(588, WE_ST[1] - 2), face: 0, name: "เบรนนา", title: "ช่างตีเหล็ก · ตีบวก สร้างไอเทม", role: "smith", look: woman("top_adventurer_ochre", "bottom_adventurer_cocoa", "crimson", "hime", "amber"),
      lines: ["เหล็กจากเหมืองบนภูเขานี่แกร่งที่สุดในแดนตะวันตก ข้าตีให้ได้ทั้งดาบทั้งเกราะ", "เอาหินนภามาตีบวกอาวุธ หินดารามาตีบวกชุด มีแร่ หนัง หรือเศษอัญมณีพอเมื่อไร ข้าสร้างอุปกรณ์ให้ได้"] },
    // the farmers at the glasshouses and the high plots
    { id: "highland_farmer1", ...at(N_ST[0] - 8, 118), face: toward(N_ST[0] - 8, 118, N_ST[0] - 30, 118), name: "ชาวไร่ดักลาส", title: "ชาวไร่เรือนกระจก", role: "talk", look: man("top_warrior_forest", "auburn", "bottom_warrior_cocoa", "amber"),
      lines: ["ข้างนอกหิมะท่วมเข่า แต่ในเรือนกระจกอุ่นพอให้กะหล่ำโตได้ทั้งปี", "เตาในเรือนกระจกต้องเติมฟืนทั้งคืน ถ้าไฟดับคืนเดียว ผักตายหมดทั้งเรือน"] },
    { id: "highland_farmer2", ...at(N_ST[0] - 8, 172), face: toward(N_ST[0] - 8, 172, N_ST[0] - 30, 172), name: "ชาวไร่เอลสเปธ", title: "ชาวไร่เรือนกระจก", role: "talk", look: woman("top_adventurer_teal", "bottom_adventurer_cocoa", "auburn", "hime", "amber"),
      lines: ["มันฝรั่ง กะหล่ำ แล้วก็ข้าวบาร์เลย์ ที่นี่ปลูกได้แค่พืชทนหนาว แต่ก็พอเลี้ยงคนทั้งเมือง", "กระบะเพาะกล้าหลังเรือนกระจกน่ะ เปิดฝาตอนกลางวันให้ต้นกล้ารับแดด ปิดตอนกลางคืนกันน้ำค้างแข็ง"] },
    { id: "highland_farmer3", ...at(432, UP_LN[0] - 6), face: 180, name: "ชาวไร่แคมป์เบล", title: "ชาวไร่บนเนิน", role: "talk", look: man("top_warrior", "gold", "bottom_warrior_cocoa", "blue"),
      lines: ["แปลงบนเนินได้แดดเช้าก่อนใคร ผักบนนี้เลยหวานกว่าแปลงข้างล่าง", "ขนข้าวบาร์เลย์ขึ้นลงต้องใช้ทางลาดสำหรับเกวียนทางตะวันออก บันไดวิหารไว้ให้คนเดินเท่านั้น"] },
    // more townsfolk
    { id: "highland_shepherd", ...at(130, 584), face: toward(130, 584, 96, 584), name: "คนเลี้ยงแกะเกรเกอร์", title: "คนเลี้ยงแกะ", role: "talk", look: man("top_warrior_forest", "ink", "bottom_warrior_cocoa", "amber"),
      lines: ["แกะที่นี่ขนหนาที่สุดในแผ่นดิน หนาวแค่ไหนก็ไม่สะท้าน", "ขนแกะไฮแลนด์ทอเป็นผ้าคลุมได้อุ่นนัก พ่อค้าโนอาซื้อไปขายถึงอีเดน"] },
    { id: "highland_weaver", ...at((WELL_SQ.u0 + WELL_SQ.u1) / 2 + 14, WELL_SQ.v0 + 8), face: toward((WELL_SQ.u0 + WELL_SQ.u1) / 2 + 14, WELL_SQ.v0 + 8, (WELL_SQ.u0 + WELL_SQ.u1) / 2, (WELL_SQ.v0 + WELL_SQ.v1) / 2), name: "แม่เฒ่าเมอร์เรน", title: "ช่างทอผ้าขนแกะ", role: "talk", look: woman("top_lilac", "bottom_wine", "silver", "hime", "violet"),
      lines: ["บ่อน้ำนี้ขุดตั้งแต่สมัยบรรพบุรุษ หน้าหนาวน้ำข้างบนแข็ง แต่ข้างล่างไม่เคยแข็งเลย", "ลายตารางบนผ้าทอบอกว่าเจ้าเป็นลูกหลานตระกูลไหน ทุกตระกูลมีลายของตัวเอง"] },
    { id: "highland_hunter", ...at(601, CLIFF[1] + 24), face: toward(601, CLIFF[1] + 24, su, sv), name: "นักล่าอีโอน", title: "นักล่าแห่งภูเขา", role: "talk", look: man("top_warrior_navy", "ink", "bottom_warrior_cocoa", "teal"),
      lines: ["ภูเขาข้างหลังเมืองสูงจนไม่มีใครเคยปีนถึงยอด แม้แต่บรรพบุรุษเองก็ลงมาจากช่องเขา ไม่ใช่จากยอด", "ทางตะวันออกเลยเนินเขาวงกตไปคือเชิงเขาหิมะ มีหมาป่ากับหมีขาวเยอะ"] },
  ];
}
