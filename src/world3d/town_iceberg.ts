// ไอซ์เบิร์ก (Iceberg), the snow port of the far north, laid out from the player's own plan (a
// hand-drawn map: a palisade along the north, west and south with a gate in the north and one in
// the south, white roads of packed snow between the log houses, an open square in the upper right,
// and the whole east side open to the river that runs down to the sea, with the harbour at the
// head of its reach). A third gate, in the west wall at the end of Cross Street, opens on the way
// to the west glacier. Cold all year: log houses under steep roofs heavy with snow, the great
// timber hall with its dragon-headed gables, a frozen fountain, ice drifting past the quays.
//
// The streets are laid on a grid: Main Street runs straight from the north gate down to the south
// gate; Harbour Road runs along under the north palisade from the west wall to the harbour quay;
// Cross Street runs from the west gate through the crossroads in the middle of the town to the
// river quay; South Lane runs along above the south palisade to the river quay, in line with the
// south pier; West Street joins them through the west quarter. The open square sits on the corner
// of Main Street and Harbour Road, the great hall faces it across Main Street, and the detached
// log houses stand in rows along the streets, evenly spaced, every front the same way back.
//
// The plan is read in its own pixels (u right, v down, as drawn) and turned into the world:
// north (up the page) is +X, east (right) is -Y, so the starting camera sees it as drawn.
// One plan pixel is 28 cm; the whole town is then drawn at TOWN_SCALE.
//
// Everything placed here comes from the town kits (src/world3d/kits); repeated pieces are drawn
// as instanced meshes in 50 m blocks, so a block off screen costs nothing.

import * as THREE from "three";
import { material, defineMaterial } from "./textures";
import { buildPaved } from "./paved";
import type { Poly } from "./paved";
import { KIT } from "./kits/iceberg";
import { Plan, TownBuilder, useKits, facing, FACE, travelGuide, protoOf, solidsOf, gateWay, waysOut } from "./town";
import type { Side, Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";

useKits(KIT);

// the river: dark, cold and clear
defineMaterial("IcebergTown_River", { tint: "#2b5f7a", rough: 0.07, opacity: 0.92 });

// ---- the plan's pixels -> the world: 28 cm a pixel ----
const { P, rect, poly } = new Plan(28, 440, 400);
type UV = [number, number];

// the palisade (plan v, v, u), the river's town bank (u), the head of its reach (v), the harbour's
// shore on the east (u); the river quay's and the harbour quay's town edges (u)
const NORTH = 184, SOUTH = 622, WEST = 126, RIVER = 620, BANK = 372, HARBOUR_E = 772;
const QUAY = 598, HARBOUR_W = 740;

// ---- the grid (plan pixels; [from, to] across each street) ----
const MAIN: UV = [380, 420];       // Main Street (u), gate to gate
const GATE_U = 400;                // both gates stand on it
const HARBOUR_RD: UV = [238, 268]; // Harbour Road (v), the west wall to the harbour quay
const CROSS: UV = [404, 436];      // Cross Street (v), the west wall to the river quay
const S_LANE: UV = [534, 556];     // South Lane (v), the west wall to the river quay
const W_ST: UV = [250, 276];       // West Street (u), Harbour Road to South Lane
// the open square, on the corner of Main Street and Harbour Road, down to Cross Street
const SQUARE = { u0: MAIN[1], v0: HARBOUR_RD[1], u1: 560, v1: CROSS[0] };
const FC: UV = [(SQUARE.u0 + SQUARE.u1) / 2, (SQUARE.v0 + SQUARE.v1) / 2]; // the frozen fountain
const CROSSING: UV = [GATE_U, (CROSS[0] + CROSS[1]) / 2];                  // the crossroads
// every house front stands this far back from its street
const SET = 9;

// The houses, detached, in rows evenly spaced along the street edges: [the side the fronts face,
// the front line (v for n/s, u for e/w), the row from, to (along it), the pieces in turn]. Each
// kind of house has one size all over town.
const SCALE: Record<string, number> = { timber_house: 0.9, stone_cottage: 0.9, log_cabin: 1.1, longhouse: 0.85, fisher_hut: 1.05, smithy: 0.9, igloo: 1, great_hall: 0.78 };
const TH = "timber_house", SC = "stone_cottage", LC = "log_cabin", LH = "longhouse", FH = "fisher_hut";
const W0 = WEST + 20, WA = W_ST[0] - SET, WB = W_ST[1] + SET, MA = MAIN[0] - SET, MB = MAIN[1] + SET;
type Row = [Side, number, number, number, string[]];
const ROWS: Row[] = [
  // under the north palisade, facing Harbour Road: cottages west of the gate, cabins east of it
  ["s", HARBOUR_RD[0] - SET, W0, MA, [TH, SC, LC, TH, SC]],
  ["s", HARBOUR_RD[0] - SET, MB, HARBOUR_W - 8, [LC, LC, TH, LC, LC, TH]],
  // the hall block: a pair of houses either side of the great hall
  ["n", HARBOUR_RD[1] + SET, WB, MA, [TH, SC]],
  ["s", CROSS[0] - SET, WB, MA, [SC, TH]],
  // west of West Street
  ["n", HARBOUR_RD[1] + SET, W0, WA, [LC, TH]],
  ["s", CROSS[0] - SET, W0, WA, [LH, LC]],
  // down the east side of the square, facing it
  ["w", SQUARE.u1 + SET, SQUARE.v0 + SET, SQUARE.v1 - SET, [SC, LC, SC]],
  // the harbour quarter, between Harbour Road and the fish market
  ["n", HARBOUR_RD[1] + SET, QUAY + 8, HARBOUR_W - 8, [TH, LC, SC]],
  // the log-house quarter, between Cross Street and South Lane
  ["n", CROSS[1] + SET, W0, WA, [TH, "igloo", LC]],
  ["s", S_LANE[0] - SET, W0, WA, [LC, SC]],
  ["n", CROSS[1] + SET, WB, MA, [LH, LC]],
  ["s", S_LANE[0] - SET, WB, MA, [TH, SC]],
  // along the south palisade, facing South Lane
  ["n", S_LANE[1] + SET, W0, MA, [SC, TH, LC, TH, SC]],
  // the lower town: the smithy at its head on Cross Street, by the crossroads
  ["n", CROSS[1] + SET, MB, 560, ["smithy", TH, SC]],
  ["s", S_LANE[0] - SET, MB, 560, [LH, TH, LC]],
  ["n", S_LANE[1] + SET, MB, 560, [LC, TH, SC]],
  // the fishermen's huts, facing the river quay
  ["e", QUAY - SET, CROSS[1] + SET, S_LANE[0] - SET, [FH, FH, FH]],
  ["e", QUAY - SET, S_LANE[1] + SET, 608, [FH]],
];
// the great hall faces the square across Main Street, midway between Harbour Road and Cross Street
const HALL_V = (HARBOUR_RD[1] + CROSS[0]) / 2;

export function buildIceberg(quality: { flowers: number }): Town {
  const town = new TownBuilder(17);
  const { put, rnd, extra } = town;

  // ---- ground: snow everywhere, the white roads, the square and the quays (flagstones), the
  // river (water) ----
  const roads: Poly[] = [
    rect(MAIN[0], -80, MAIN[1], 880),                    // Main Street, and on out of both gates
    rect(WEST, HARBOUR_RD[0], HARBOUR_W, HARBOUR_RD[1]), // Harbour Road
    rect(-250, CROSS[0], QUAY, CROSS[1]),                // Cross Street, and on out of the west gate
    rect(WEST, S_LANE[0], QUAY, S_LANE[1]),              // South Lane
    rect(W_ST[0], HARBOUR_RD[1], W_ST[1], S_LANE[0]),    // West Street
  ];
  const plazas: Poly[] = [
    rect(SQUARE.u0, SQUARE.v0, SQUARE.u1, SQUARE.v1),
    poly([[QUAY, 338], [HARBOUR_W, 338], [HARBOUR_W, 196], [HARBOUR_E, 196], [HARBOUR_E, BANK], [QUAY, BANK]]), // the harbour quay
    rect(QUAY, BANK, RIVER, 612),                                                                               // the river quay
  ];
  // the river: down past the harbour quarter, along the town's east side, and out to the sea
  const water: Poly[] = [poly([
    [762, -400], [HARBOUR_E, NORTH], [HARBOUR_E, BANK], [RIVER, BANK], [RIVER, 663], [628, 760], [600, 900], [560, 1000], [520, 1100],
    [1000, 1100], [1000, 880], [950, 800], [880, 700], [850, 600], [842, 450], [846, 300], [852, 150], [862, 0], [872, -400],
  ])];
  const area = { x0: P(0, 1000)[0], x1: P(0, -300)[0], y0: P(1000, 0)[1], y1: P(-250, 0)[1] };
  const ground = buildPaved({ area, roads, plazas, water, base: "snow", road: [1.04, 1.09, 1.18], plaza: [0.86, 0.9, 0.96] });
  const snow = (x: number, y: number) => ground.kind(x, y) === 0;

  // what already stands, to keep the lamps and props clear of it
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
  // a prop at plan (u, v) only where it stands clear on open snow (or paving, with `paved`)
  const prop = (ref: string, u: number, v: number, h: number, r: number, paved = false, o: { s?: number } = {}) => {
    const [x, y] = P(u, v);
    if ((paved || snow(x, y)) && ground.kind(x, y) !== 3 && clear(x, y, r)) put(ref, [x, y], h, o);
  };
  const LAMP: SolidSpec[] = [{ kind: "post", x: 0, y: 0, r: 26 }];
  const lamp = (u: number, v: number, paved = true) => {
    const [x, y] = P(u, v);
    if ((paved || snow(x, y)) && clear(x, y, 150)) put("iceberg:lantern_post", [x, y], 0, { solid: LAMP });
  };

  // ---- the palisade: 8 m lengths of sharpened logs between watchtowers, a gate in the north
  // and one in the south, both on Main Street, and one in the west at the end of Cross Street;
  // the east lies open to the river ----
  const xN = P(0, NORTH)[0], xS = P(0, SOUTH)[0], yW = P(WEST, 0)[1], yR = P(RIVER, 0)[1], yH = P(HARBOUR_E, 0)[1];
  const GN: [number, number] = [xN, P(GATE_U, 0)[1]];
  const GS: [number, number] = [xS, P(GATE_U, 0)[1]];
  const GW: [number, number] = [P(0, (CROSS[0] + CROSS[1]) / 2)[0], yW];
  const run = (a: [number, number], b: [number, number], out: Side, gaps: number[] = []) => town.wall(a, b, out, "iceberg:palisade", { gaps, gap: 1040 });
  run([xN, yW], [xN, yH + 150], "n", [yW - GN[1]]);
  run([xN, yW], [xS, yW], "w", [xN - GW[0]]);
  run([xS, yW], [xS, yR + 150], "s", [yW - GS[1]]);
  const tower = (u: number, v: number, face: Side) => put("iceberg:watch_tower", P(u, v), FACE[face], { solid: [{ kind: "tower", x: 0, y: 0, r: 235 }] });
  tower(WEST, NORTH, "s");
  tower(WEST, SOUTH, "n");
  tower(HARBOUR_E - 9, NORTH, "s");
  tower(RIVER - 9, SOUTH, "n");
  for (const u of [245, 505, 650]) tower(u, NORTH, "s");
  for (const v of [330, 476]) tower(WEST, v, "e");
  for (const u of [280, 530]) tower(u, SOUTH, "n");
  // the gates: towers either side of an open passage along the gate's own X, the doors standing
  // open inward
  const gateSolid: SolidSpec[] = [
    { kind: "gate", x: 0, y: -360, w: 300, d: 300, rot: 0 },
    { kind: "gate", x: 0, y: 360, w: 300, d: 300, rot: 0 },
    { kind: "gate", x: 172, y: -195, w: 210, d: 16, rot: 14 },
    { kind: "gate", x: 172, y: 195, w: 210, d: 16, rot: -14 },
  ];
  put("iceberg:town_gate", GN, FACE.n, { solid: gateSolid });
  put("iceberg:town_gate", GS, FACE.s, { solid: gateSolid });
  put("iceberg:town_gate", GW, FACE.w, { solid: gateSolid });

  // ---- the houses: each with its front on its row's line, the rows evenly spaced ----
  const placed: { x: number; y: number; h: number; s: number; f: { x0: number; x1: number; y0: number; y1: number }; piece: string }[] = [];
  const width = (piece: string) => {
    const f = protoOf(`iceberg:${piece}`).foot;
    return ((f.y1 - f.y0) * SCALE[piece]) / 28;
  };
  // a house with its front on plan line `line` facing `side`, its middle at `at` along the row
  const house = (piece: string, side: Side, line: number, at: number) => {
    const ref = `iceberg:${piece}`, f = protoOf(ref).foot, s = SCALE[piece], back = (-f.x0 * s) / 28;
    const [u, v] = side === "s" ? [at, line - back] : side === "n" ? [at, line + back] : side === "e" ? [line - back, at] : [line + back, at];
    const [x, y] = P(u, v), h = FACE[side];
    put(ref, [x, y], h, { s });
    placed.push({ x, y, h, s, f, piece });
  };
  for (const [side, line, from, to, pieces] of ROWS) {
    const ws = pieces.map(width);
    const gap = (to - from - ws.reduce((a, b) => a + b, 0)) / pieces.length;
    let t = from + gap / 2;
    pieces.forEach((p, i) => {
      house(p, side, line, t + ws[i] / 2);
      t += ws[i] + gap;
    });
  }
  house("great_hall", "e", MA, HALL_V);
  // ---- the great hall: ice bears stand guard either side of its steps, a woodpile and barrels
  // round the back ----
  prop("iceberg:ice_sculpture", MA + 5, HALL_V - 14, FACE.e, 60);
  prop("iceberg:ice_sculpture", MA + 5, HALL_V + 14, FACE.e, 60);
  prop("iceberg:woodpile", W_ST[1] + 15, HALL_V - 8, FACE.w, 110);
  prop("iceberg:snowy_barrels", W_ST[1] + 15, HALL_V + 10, rnd() * 360, 110);

  // ---- the north gate: braziers either side inside, a woodpile and barrels against the
  // palisade ----
  prop("iceberg:brazier", MAIN[0] - 5, NORTH + 12, 0, 60);
  prop("iceberg:brazier", MAIN[1] + 5, NORTH + 12, 0, 60);
  prop("iceberg:woodpile", MAIN[1] + 16, NORTH + 9, FACE.s, 100);
  prop("iceberg:snowy_barrels", MAIN[0] - 14, NORTH + 11, 30, 100);
  // and the south gate: braziers either side inside
  prop("iceberg:brazier", MAIN[0] - 5, SOUTH - 12, 0, 60);
  prop("iceberg:brazier", MAIN[1] + 5, SOUTH - 12, 0, 60);
  // and the west gate (out to the west glacier): braziers either side inside
  prop("iceberg:brazier", WEST + 12, CROSS[0] - 5, 0, 60);
  prop("iceberg:brazier", WEST + 12, CROSS[1] + 5, 0, 60);

  // ---- the open square: the frozen fountain in the middle ringed with benches and lanterns, a
  // great pine at its head, fur traders down its east side, ice bears at its mouth on Main
  // Street, a sled and a snowman ----
  put("iceberg:frozen_fountain", P(FC[0], FC[1]), 22.5, { solid: [{ kind: "fountain", x: 0, y: 0, r: 280 }] });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2, du = Math.cos(a), dv = Math.sin(a);
    put("common:bench", P(FC[0] + du * 19, FC[1] + dv * 19), facing(-du, -dv));
    const b = a + Math.PI / 4;
    lamp(FC[0] + Math.cos(b) * 21, FC[1] + Math.sin(b) * 21);
  }
  // the fur stalls stand between the doors of the houses down the east side
  for (const v of [283, 317, 355, 389]) put("iceberg:fur_stall", P(SQUARE.u1 - 10, v), FACE.w);
  put("flora:SnowPine", P(FC[0], SQUARE.v0 + 20), 20, { s: 1.45 });
  prop("iceberg:brazier", FC[0] - 16, SQUARE.v0 + 22, 0, 60, true);
  prop("iceberg:brazier", FC[0] + 16, SQUARE.v0 + 22, 0, 60, true);
  prop("iceberg:ice_sculpture", SQUARE.u0 + 10, SQUARE.v0 + 14, FACE.w, 90, true);
  prop("iceberg:ice_sculpture", SQUARE.u0 + 10, SQUARE.v1 - 26, FACE.w, 90, true);
  prop("iceberg:snowman", FC[0] + 30, SQUARE.v0 + 20, facing(-1, 1), 90, true);
  prop("iceberg:sled", FC[0] + 24, SQUARE.v1 - 12, FACE.w - 15, 120, true);
  prop("iceberg:snowy_barrels", FC[0] - 30, SQUARE.v0 + 14, 10, 100, true);
  prop("iceberg:snowy_barrels", SQUARE.u1 - 26, SQUARE.v1 - 8, 80, 100, true);
  // lanterns along its north and south edges (the corner on the crossroads is the travel guide's)
  for (const [u, v] of [[SQUARE.u0 + 4, SQUARE.v0 + 4], [FC[0] - 35, SQUARE.v0 + 4], [FC[0] + 35, SQUARE.v0 + 4], [FC[0] - 35, SQUARE.v1 - 4], [FC[0] + 35, SQUARE.v1 - 4]] as UV[]) lamp(u, v);

  // ---- the crossroads (where travellers arrive): braziers to warm them, a sign post, the
  // shop's sled; the smithy's yard ----
  prop("iceberg:brazier", MAIN[1] + 5, CROSS[1] + 5, 0, 60);
  prop("iceberg:brazier", MAIN[1] + 16, CROSS[0] - 6, 0, 60, true);
  prop("common:sign_post", MAIN[0] - 5, CROSS[0] - 5, facing(1, 1), 60);
  prop("iceberg:sled", MAIN[0] - 8, CROSS[1] + 5, FACE.e, 80);
  prop("iceberg:woodpile", MB + 2, CROSS[1] + 26, FACE.e, 90);
  prop("iceberg:snowy_barrels", MB + 2, CROSS[1] + 40, 40, 90);

  // ---- the harbour: stone quays along the river and round the harbour, snowy piers out into the
  // reach, fishing boats moored, the beacon tower on the point, ice drifting down to the sea ----
  // quay walls (8 m each, the water side facing `out`) from plan a to b, cut to length
  const quay = (a: UV, b: UV, out: Side) => {
    const A = P(a[0], a[1]), B = P(b[0], b[1]);
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L, r = (FACE[out] * Math.PI) / 180;
    for (let t = 0; t < L - 20; t += 800) {
      const len = Math.min(800, L - t), mid = t + len / 2;
      // the piece is 3 m deep: its middle 1.5 m back from the water's edge
      put("iceberg:harbour_quay", [A[0] + ux * mid + Math.cos(r) * 150, A[1] + uy * mid + Math.sin(r) * 150], FACE[out], { sy: len / 800, solid: "none" });
    }
  };
  quay([RIVER, BANK], [RIVER, SOUTH + 6], "e");
  quay([RIVER, BANK], [HARBOUR_E, BANK], "s");
  quay([HARBOUR_E, NORTH + 6], [HARBOUR_E, BANK], "e");
  // piers: 4 m lengths out from the bank at (u, v) toward `dir`
  const pier = (u: number, v: number, dir: Side, n: number) => {
    const [x, y] = P(u, v), r = (FACE[dir] * Math.PI) / 180, dx = -Math.cos(r), dy = -Math.sin(r);
    for (let i = 0; i < n; i++) put("iceberg:snow_pier", [x + dx * (200 + 400 * i), y + dy * (200 + 400 * i)], FACE[dir], { z: -32, solid: "none" });
  };
  pier(RIVER, 455, "e", 5);
  pier(RIVER, 545, "e", 5);
  pier(735, BANK, "s", 4);
  pier(HARBOUR_E, 250, "e", 2);
  // the boats: moored along the piers, two out on the river
  const boat = (u: number, v: number, h: number) => put("iceberg:fishing_boat", P(u, v), h, { z: -50 });
  boat(656, 467, FACE.e);
  boat(670, 443, FACE.w);
  boat(652, 557, FACE.e);
  boat(748, 408, FACE.s);
  boat(790, 262, FACE.e + 8);
  boat(735, 515, 150);
  boat(705, 600, -160);
  // the beacon on the point, lanterns along the quays
  put("iceberg:beacon_tower", P(761, 361), 135, { solid: [{ kind: "tower", x: 0, y: 0, r: 255 }] });
  for (const u of [630, 668, 704]) lamp(u, 365);
  // the fish market along the head of the reach
  for (const u of [616, 640, 716]) put("iceberg:fish_stall", P(u, 347), FACE.s);
  for (const v of [212, 290]) lamp(752, v);
  for (const v of [392, 500, 592]) lamp(603, v);
  // cargo and gear on the quays
  prop("iceberg:snowy_barrels", 664, 345, 20, 110, true);
  prop("iceberg:snowy_barrels", 760, 230, 70, 110, true);
  prop("iceberg:sled", 690, 352, FACE.e, 120, true);
  prop("iceberg:snowy_barrels", 606, 602, 0, 100, true);
  prop("iceberg:woodpile", 602, 316, FACE.n, 110);
  prop("iceberg:snowy_barrels", 728, 310, 50, 110);
  prop("iceberg:sled", 666, 322, 200, 120);
  // drifting ice: in the reach, down the river and out toward the sea
  const floe = (u: number, v: number, s: number, h: number) => put("iceberg:ice_floe", P(u, v), h, { s, z: -45 * s, solid: "none" });
  floe(705, 505, 0.42, 20);
  floe(790, 470, 0.7, 140);
  floe(815, 565, 0.5, 260);
  floe(760, 650, 0.6, 80);
  floe(660, 640, 0.3, 300);
  floe(815, 340, 0.45, 200);
  floe(810, 120, 0.4, 30);
  floe(800, 760, 0.9, 120);
  floe(690, 790, 0.65, 330);
  floe(880, 900, 1.1, 60);
  floe(640, 940, 0.8, 190);
  // the river is solid but for the piers
  const sea = (u0: number, v0: number, u1: number, v1: number) => {
    const [xa, ya] = P(u0, v0), [xb, yb] = P(u1, v1);
    extra.push({ kind: "sea", x: (xa + xb) / 2, y: (ya + yb) / 2, w: Math.abs(xb - xa), d: Math.abs(yb - ya), rot: 0 });
  };
  sea(RIVER, BANK, 729, 449);
  sea(741, BANK, 900, 449);
  sea(729, 430, 741, 449);
  sea(692, 449, 900, 461);
  sea(RIVER, 461, 900, 539);
  sea(692, 539, 900, 551);
  sea(RIVER, 551, 900, 900);
  sea(HARBOUR_E, -300, 900, 244);
  sea(802, 244, 900, 256);
  sea(HARBOUR_E, 256, 900, BANK);


  // ---- lanterns down both sides of every street, every 13 m a side (staggered), just off the
  // road on the snow wherever nothing else stands ----
  const lamps = (u0: number, v0: number, u1: number, v1: number) => {
    const ew = u1 - u0 > v1 - v0, [a0, a1] = ew ? [u0, u1] : [v0, v1];
    for (let t = a0 + 23, i = 0; t < a1 - 4; t += 23, i++) {
      const off = i % 2 ? (ew ? v1 : u1) + 3.5 : (ew ? v0 : u0) - 3.5;
      if (ew) lamp(t, off, false);
      else lamp(off, t, false);
    }
  };
  lamps(MAIN[0], NORTH, MAIN[1], SOUTH);
  lamps(WEST, HARBOUR_RD[0], HARBOUR_W, HARBOUR_RD[1]);
  lamps(WEST, CROSS[0], QUAY, CROSS[1]);
  lamps(WEST, S_LANE[0], QUAY, S_LANE[1]);
  lamps(W_ST[0], HARBOUR_RD[1], W_ST[1], S_LANE[0]);

  // ---- the open snow inside the walls: a woodpile or barrels against the side of most houses,
  // then pines, frost oaks and birches wherever there is room ----
  placed.forEach((p, i) => {
    if (i % 3 === 2 || p.piece === "fisher_hut" || p.piece === "great_hall" || p.piece === "igloo") return;
    const side = i % 2 ? 1 : -1, c = Math.cos((p.h * Math.PI) / 180), sn = Math.sin((p.h * Math.PI) / 180);
    const lx = (p.f.x0 + p.f.x1) * 0.5 * p.s + 60, ly = side * ((side > 0 ? p.f.y1 : -p.f.y0) * 0.94 * p.s + 170);
    const x = p.x + lx * c - ly * sn, y = p.y + lx * sn + ly * c;
    if ([[0, 0], [150, 0], [-150, 0], [0, 150], [0, -150]].some(([dx, dy]) => !snow(x + dx, y + dy)) || !clear(x, y, 130)) return;
    if (i % 4 === 3) put("iceberg:snowy_barrels", [x, y], p.h + rnd() * 60);
    else put("iceberg:woodpile", [x, y], p.h - side * 90);
  });
  const TREES = ["SnowPine", "SnowPineSmall", "SnowPine", "FrostOak", "Birch", "SnowPineSmall", "SnowPine"];
  for (let x = xS + 450; x < xN - 400; x += 600)
    for (let y = yH + 400; y < yW - 400; y += 600) {
      const px = x + (rnd() - 0.5) * 380, py = y + (rnd() - 0.5) * 380;
      if ([[0, 0], [260, 0], [-260, 0], [0, 260], [0, -260]].some(([dx, dy]) => !snow(px + dx, py + dy))) continue;
      if (rnd() > 0.8 || !clear(px, py, 250)) continue;
      put(`flora:${TREES[Math.floor(rnd() * TREES.length)]}`, [px, py], rnd() * 360, { s: 0.65 + rnd() * 0.3 });
    }

  // ---- outside the walls: snowy woods, kept off the roads and back from the river ----
  const wet = (x: number, y: number) => [[0, 0], [500, 0], [-500, 0], [0, 500], [0, -500]].some(([dx, dy]) => ground.kind(x + dx, y + dy) === 3);
  town.woods({ x0: xS - 6500, x1: xN + 6500, y0: area.y0 + 600, y1: yW + 6500 }, ["SnowPine", "SnowPine", "SnowPineSmall", "FrostOak", "Birch", "SnowPine"], (x, y) => {
    const inside = x > xS - 900 && x < xN + 900 && y > yH - 400 && y < yW + 900;
    const road = [[0, 0], [600, 0], [-600, 0], [0, 600], [0, -600]].some(([dx, dy]) => ground.kind(x + dx, y + dy) === 1);
    return inside || road || wet(x, y);
  }, { count: Math.round(220 + 100 * Math.min(1, quality.flowers)), tries: 6000, spacing: 480 });

  // ---- build ----
  // the river: one plane of cold water under the ground, showing through where the ground is cut
  const [rx0, ry0] = P(560, 1100), [rx1, ry1] = P(1000, -400);
  const river = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(rx1 - rx0), Math.abs(ry1 - ry0)).rotateX(-Math.PI / 2), material("IcebergTown_River"));
  river.position.set((rx0 + rx1) / 2, -14, -(ry0 + ry1) / 2);
  river.receiveShadow = true;
  const pt = (u: number, v: number) => ({ x: P(u, v)[0], y: P(u, v)[1] });
  return town.finish({
    ground,
    scenery: [river],
    sky: "#c9d6e4",
    bounds: { minX: xS - 700, maxX: xN + 700, minY: yH - 700, maxY: yW + 700 },
    // at the crossroads, a step down Main Street from the travel guide
    spawn: pt(CROSSING[0] + 4, CROSSING[1] - 2),
    npcs: icebergNpcs(),
    // north out onto the icefield by the North Sea, south down the ice pass, west to the glacier
    ...waysOut([gateWay(GN, "n", "north_icefield", 480, 420), gateWay(GS, "s", "ice_pass", 480, 420), gateWay(GW, "w", "west_glacier", 480, 420)]),
    closed: [],
    // names on the map window
    labels: [
      { ...pt(MAIN[0] + 12, HALL_V), text: "โถงใหญ่" },
      { ...pt(FC[0], SQUARE.v0 + 34), text: "ลานกว้าง" },
      { ...pt(680, 356), text: "ท่าเรือ" },
      { ...pt(686, 455), text: "แม่น้ำ" },
      { ...pt(744, 352), text: "หอไฟสัญญาณ", kind: "small" },
      { ...pt(FC[0], FC[1] + 22), text: "น้ำพุน้ำแข็ง", kind: "small" },
      { ...pt(450, CROSS[1] + 2), text: "โรงตีเหล็ก", kind: "small" },
      { ...pt(608, 490), text: "หมู่บ้านชาวประมง", kind: "small" },
      { ...pt(CROSSING[0], CROSSING[1]), text: "ทางแยกกลางเมือง", kind: "small" },
      { ...pt((W_ST[0] + W_ST[1]) / 2, 485), text: "ย่านบ้านซุง", kind: "small" },
      { x: GN[0] - 220, y: GN[1], text: "ประตูเหนือ · ทุ่งน้ำแข็ง", kind: "gate" },
      { x: GS[0] + 220, y: GS[1], text: "ประตูใต้ · ช่องเขาน้ำแข็ง", kind: "gate" },
      { x: GW[0], y: GW[1] - 220, text: "ประตูตะวันตก · ธารน้ำแข็ง", kind: "gate" },
    ],
  });
}

// ---- townsfolk, where the plan put its red dots (moved onto the new streets) ----
function icebergNpcs(): NpcSpec[] {
  const at = (u: number, v: number) => {
    const [x, y] = P(u, v);
    return { x, y };
  };
  // the heading (world degrees, 0 = +X) from plan (u, v) toward plan (tu, tv)
  const toward = (u: number, v: number, tu: number, tv: number) => {
    const [x, y] = P(u, v), [tx, ty] = P(tu, tv);
    return (Math.atan2(ty - y, tx - x) * 180) / Math.PI;
  };
  const [cu, cv] = CROSSING;
  const guard = (top: string, hairColor = "ink") => ({ gender: "male", hair: "", hairColor, eyes: "blue", top, bottom: "bottom_warrior_black" });
  return [
    { id: "ice_guard_n", ...at(GATE_U + 15, NORTH + 18), face: 180, name: "ทหารยามกุนนาร์", title: "ทหารยามประตูเหนือ", role: "talk", look: guard("top_warrior_navy", "gold"),
      lines: ["ออกประตูเหนือไปคือทุ่งน้ำแข็งริมทะเลเหนือ มอนสเตอร์แถวนั้นแข็งแกร่งนัก", "เหนือขึ้นไปคือทะเลเหนือ ลมหนาวพัดลงมาทั้งปี ใส่เสื้อขนสัตว์ให้หนาเข้าไว้"] },
    travelGuide("iceberg", P(MAIN[1] + 8, CROSS[0] - 6), toward(MAIN[1] + 8, CROSS[0] - 6, cu, cv)),
    { id: "ice_healer", ...at(MAIN[0] + 7, HALL_V + 12), face: toward(MAIN[0] + 7, HALL_V + 12, cu, cv), name: "แม่ชีซิกรุน", title: "นักบวช · รักษาฟรี", role: "heal",
      look: { gender: "female", hair: "twintail", hairColor: "silver", eyes: "teal", top: "top_priestess_white", bottom: "bottom_priestess_white" },
      lines: ["ขอให้ไฟในเตาผิงอบอุ่นหัวใจท่าน", "หายหนาวหายเหนื่อยแล้วนะ ระวังน้ำแข็งลื่นตอนเดินริมท่าเรือด้วย"] },
    { id: "job_warlord", ...at(MAIN[0] + 23, HALL_V - 12), face: toward(MAIN[0] + 23, HALL_V - 12, cu, cv), name: "ราโกนาร์ผู้คลั่ง", title: "ขุนศึกเหนือ · เปลี่ยนอาชีพนักรบคลั่ง", role: "talk", look: guard("top_warrior_forest", "crimson"),
      lines: ["นักรบเลเวล 30 ที่อยากรู้รสความคลั่ง มาหาข้า", "ศาสตราวุธสองมือ หรือเลือดที่เดือดพล่าน ทางไหนก็ไม่มีถอย"] },
    { id: "ice_elder", ...at(MAIN[0] + 7, HALL_V - 12), face: toward(MAIN[0] + 7, HALL_V - 12, cu, cv), name: "ผู้เฒ่าทอร์วัลด์", title: "ผู้อาวุโสแห่งโถงใหญ่", role: "talk", look: guard("top_warrior_forest", "silver"),
      lines: ["โถงใหญ่นั่นสร้างมาตั้งแต่รุ่นทวด หัวมังกรบนหน้าจั่วคอยไล่วิญญาณพายุหิมะ", "คืนกลางฤดูหนาว ชาวไอซ์เบิร์กมาร่วมงานเลี้ยงในโถง ดื่มน้ำผึ้งหมัก เล่านิทานกันจนรุ่งเช้า", "ไกลลงไปทางใต้คือที่ราบภาคกลางกับเมืองหลวงอีเดน ส่วนตะวันออกคือทุ่งสเตปป์ของทรุนราดา"] },
    { id: "ice_shop", ...at(MAIN[0] + 6, CROSS[1] - 6), face: toward(MAIN[0] + 6, CROSS[1] - 6, cu, cv), name: "แอสทริด", title: "ร้านเครื่องมือ", role: "shop", sprite: "merchant",
      lines: ["เชือก ตะเกียง ยาแก้หนาว มีครบ เข้ามาดูก่อนได้"] },
    { id: "ice_smith", ...at(450, CROSS[1] + 4), face: toward(450, CROSS[1] + 4, cu, cv), name: "บียอร์น", title: "ช่างตีเหล็ก · ตีบวก สร้างไอเทม", role: "smith", look: guard("top_warrior", "auburn"),
      lines: ["เหล็กที่ตีในความหนาวแบบนี้แกร่งที่สุด", "ขวานหรือดาบบิ่นเมื่อไร เอามาให้ข้าดูได้ โรงตีเหล็กอยู่ข้างหลังข้านี่เอง"] },
    { id: "job_inventor", ...at(472, CROSS[1] + 4), face: toward(472, CROSS[1] + 4, cu, cv), name: "ซิกริดนักประดิษฐ์", title: "นักประดิษฐ์ · เปลี่ยนอาชีพนักประดิษฐ์", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "auburn", eyes: "blue", top: "top_adventurer_navy", bottom: "bottom_adventurer_black" },
      lines: ["เฟืองตัวนี้... ไม่ใช่ ตัวนั้นต่างหาก!", "อยากสร้างอาวุธ ชุด หรือเครื่องประดับเองไหม เลเวล 30 แล้วมาเป็นนักประดิษฐ์กับข้า"] },
    { id: "ice_fisher", ...at(606, 452), face: -90, name: "ไลฟ์", title: "ชาวประมง", role: "talk", look: guard("top_warrior_forest", "amber"),
      lines: ["ปลาแซลมอนว่ายขึ้นแม่น้ำมาเยอะช่วงน้ำแข็งเริ่มละลาย", "ระวังก้อนน้ำแข็งที่ลอยมาตามน้ำ ชนเรือทีเดียวรูรั่วเลย"] },
    { id: "ice_captain", ...at(607, 518), face: -90, name: "กัปตันฮาราลด์", title: "นายท่าเรือ", role: "talk", look: guard("top_warrior_navy", "crimson"),
      lines: ["แม่น้ำสายนี้ไหลลงทะเลเหนือ เรือประมงออกหาปลาทุกเช้ามืด", "เรือไปอีเดน โยเดีย และโอซากิ ยังไม่เปิดให้บริการ ไปหาเอลซ่าผู้นำทางที่ทางแยกกลางเมืองก่อนนะ"] },
    { id: "ice_netmender", ...at(606, 562), face: 90, name: "อิงกริด", title: "ช่างซ่อมแห", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "gold", eyes: "blue", top: "top_adventurer_teal", bottom: "bottom_adventurer_cocoa" },
      lines: ["แหผืนนี้ต้องซ่อมให้เสร็จก่อนเรือกลับเข้าท่า", "ที่ลานกว้างมีพ่อค้าขนสัตว์ ขนหมีขาวอุ่นที่สุดในแดนเหนือเลยนะ"] },
    { id: "ice_guard_s", ...at(GATE_U + 15, SOUTH - 20), face: 0, name: "ทหารยามโอลาฟ", title: "ทหารยามประตูใต้", role: "talk", look: guard("top_warrior_navy"),
      lines: ["ออกประตูใต้ลงไปคือช่องเขาน้ำแข็ง ผ่านเชิงเขาหิมะลงไปถึงถนนหลวงของอีเดน", "คืนไหนพายุหิมะมา เราจะปิดประตูแล้วจุดไฟบนหอสัญญาณริมท่าเรือ"] },
  ];
}
