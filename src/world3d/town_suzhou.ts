// ซูโจว (Suzhou): the merchant port at the western tip of the continent, where the junks of the
// western sea come in with tea, silk and porcelain. A Chinese canal town (Jiangnan): whitewashed
// houses with horse-head gables under grey tiles, crimson columns, red lanterns strung across the
// streets, stone hump bridges over the canals, willows on their banks, and the octagonal pagoda
// on the headland by the harbour mouth, which is the harbour's lighthouse.
//
// The plan (plan pixels, u right = east, v down = south; 20 cm a pixel; the sea on the west):
//   - the harbour along the west shore: a granite quay (u 200) from the north wall down to the
//     Grand Canal's mouth, three wooden piers out into the sea with junks alongside (the main
//     pier, where the captain stands, in the middle), warehouses and shophouses facing the quay;
//     the landing square at the main pier (the spawn and the travel guide), the silk market just
//     south of it, the temple of the sea goddess north of it;
//   - the main street running east from the landing square under the pailou, over the north
//     canal on a hump bridge (the tea house on the far bank, its balcony over the water), through
//     the crossroads with the avenue, past shophouses under strings of lanterns, to the gate of
//     the governor's yamen at its east end;
//   - the avenue from the north gate (over the mountains to Noa) to the south gate (the rice
//     terraces), crossing the Grand Canal on a hump bridge;
//   - two canals: the north canal (u 395-430) from near the north wall south into the Grand
//     Canal (v 470-505), which runs from the harbour east almost to the east wall; walks along
//     their banks with willows and lantern posts, bridges where the streets and lanes cross;
//   - north-east: lantern lane between rows of townhouses; south-west: rows of townhouses along
//     the canal, the fish lane and the west road; the smith's forge by the west gate;
//   - the headland at the south-west corner of the harbour, with the pagoda on it; south of it
//     the west wall stands right on the shore, and out of its gate a causeway runs west over
//     the sea toward the western cape, lined with willows and lanterns;
//   - south-east: a walled garden entered through a moon gate off the avenue (lotus ponds,
//     pavilions, Taihu rocks, willows).
// A grey brick city wall with corner towers on the north, east and south, three open gates
// (north, south, and the causeway gate on the west).
//
// The water (sea and canals) is one sheet 110 cm below the ground, showing through holes cut in
// it; the quay and canal walls drop to it. Everything placed here comes from the town kits; the
// whole town is built at full size and drawn at TOWN_SCALE.

import * as THREE from "three";
import { material, defineMaterial } from "./textures";
import { buildPaved } from "./paved";
import type { Poly } from "./paved";
import { KIT } from "./kits/suzhou";
import { Plan, TownBuilder, useKits, colourways, FACE, facing, travelGuide, gateWay, waysOut } from "./town";
import type { Side, Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";

useKits(KIT);

// Colourways: the same houses with warmer or greyer whitewash, other woodwork, darker tiles; the
// great hall as the sea goddess's temple (green glazed tiles).
defineMaterial("SuzhouTown_Cream", { map: "plaster", tint: "#efe6d2", bump: 0.5 });
defineMaterial("SuzhouTown_Grey", { map: "plaster", tint: "#dcdad3", bump: 0.6 });
defineMaterial("SuzhouTown_TileDark", { map: "tiles", tint: "#43484f", bump: 2.5 });
defineMaterial("SuzhouTown_TileWarm", { map: "tiles", tint: "#6a6763", bump: 2.5 });
colourways({
  "sz-warm": { WoodShade: "WoodWarm", Suzhou_White: "SuzhouTown_Cream" },
  "sz-dark": { Suzhou_Tile: "SuzhouTown_TileDark", WoodShade: "WoodDark" },
  "sz-grey": { Suzhou_White: "SuzhouTown_Grey", Suzhou_Tile: "SuzhouTown_TileWarm", Suzhou_Red: "WoodRed" },
  "sz-red": { WoodShade: "WoodRed", Suzhou_Indigo: "FabricRed" },
  temple: { Suzhou_Tile: "Suzhou_TileGreen", Suzhou_TileEnd: "Suzhou_TileEndGreen", Suzhou_Ridge: "Suzhou_RidgeGreen" },
});

// ---- the plan's pixels -> the world: 20 cm a pixel, the crossroads at the origin ----
const { P, rect } = new Plan(20, 560, 325);
const SEA = -110;                        // the water's surface
const QUAY = 200;                        // the harbour quay (u); the sea west of it
const N = 100, S = 820, E = 900;         // the north and south walls (v), the east wall (u)
const WW = 208;                          // the west wall (u), on the shore south of the headland
const AV: [number, number] = [535, 585]; // the avenue (u)
const MS: [number, number] = [300, 350]; // the main street (v)
const CA: [number, number] = [470, 505]; // the Grand Canal (v), from the harbour east to CA_END
const CB: [number, number] = [395, 430]; // the north canal (u), from CB_END south into the Grand Canal
const CA_END = 880, CB_END = 140;
const LL: [number, number] = [195, 215]; // lantern lane (v)
const FL: [number, number] = [605, 620]; // the fish lane (v)
const WR: [number, number] = [705, 735]; // the west road and the causeway (v)
const HEAD = { u0: 105, u1: QUAY, v0: 525, v1: 625 }; // the pagoda's headland
const PIERS: [number, number][] = [[175, 4], [325, 6], [430, 5]]; // piers (v, 4 m sections)
const GATE_U = 560, GATE_W_V = 720;
// bridges: over the Grand Canal (u) and the north canal (v)
const BRIDGES_A = [222, 330, 560, 720];
const BRIDGES_B = [240, 325, 420];

export function buildSuzhou(quality: { flowers: number }): Town {
  const town = new TownBuilder(31);
  const { put, rnd, extra } = town;
  const post = (r = 24): SolidSpec[] => [{ kind: "post", x: 0, y: 0, r }];

  // ---- ground: streets (cobbles), squares and quays (flagstones), the sea and the canals ----
  const roads: Poly[] = [
    // (each paved right up to the house fronts along it)
    rect(330, MS[0] - 5, 742, MS[1] + 5),        // the main street, from the pailou to the yamen
    rect(AV[0] - 4, -500, AV[1] + 4, 1400),      // the avenue, out of both gates
    rect(AV[1], LL[0] - 4, E - 6, LL[1] + 4),    // lantern lane
    rect(QUAY + 42, CA[0] - 19, CA_END, CA[0]),  // the Grand Canal's north walk
    rect(250, CA[1], CA_END, CA[1] + 19),        // and its south walk
    rect(CB[0] - 15, CB_END, CB[0], CA[0]),      // the north canal's west walk
    rect(CB[1], CB_END, CB[1] + 19, CA[0]),      // and its east walk
    rect(250, FL[0] - 4, AV[0], FL[1] + 4),      // the fish lane
    rect(-420, WR[0], QUAY, WR[1]),              // the causeway
    rect(QUAY, WR[0] - 4, AV[0], WR[1] + 4),     // the west road
    rect(320, CA[1] + 15, 342, FL[0]),           // an alley from the canal to the fish lane
    rect(AV[1], 642, 630, 662),                  // the path to the garden's moon gate
    rect(708, CA[0] - 15, 732, CA[1] + 15), rect(708, CA[1] + 15, 732, 572), // the lane over the canal to the garden's other moon gate
  ];
  const plazas: Poly[] = [
    rect(QUAY, N - 20, QUAY + 42, CA[0]),        // the quay promenade
    rect(QUAY, CA[1], 250, HEAD.v1),             // and on round the canal mouth to the headland
    rect(HEAD.u0, HEAD.v0, HEAD.u1, HEAD.v1),    // the pagoda's headland
    rect(QUAY + 42, 255, 330, 398),              // the landing square
    rect(290, MS[1], CB[0] - 15, CA[0] - 15),    // the silk market
    rect(287, 224, CB[0] - 15, 255),             // the temple court
    rect(515, 280, 605, 370),                    // the crossroads
    rect(700, 280, 742, 370),                    // before the yamen gate
    rect(772, 240, 822, 410),                    // the yamen court
    rect(630, 645, 770, 659), rect(756, 655, 770, 790), rect(712, 576, 728, 645), // the garden's paths
  ];
  const AREA = { x0: P(0, 1500)[0], x1: P(0, -800)[0], y0: P(1500, 0)[1], y1: P(-700, 0)[1] };
  const water: Poly[] = [
    // the sea north of the causeway, round the headland, and south of it
    [P(-700, -800), P(QUAY, -800), P(QUAY, HEAD.v0), P(HEAD.u0, HEAD.v0), P(HEAD.u0, HEAD.v1), P(QUAY, HEAD.v1), P(QUAY, WR[0]), P(-700, WR[0])],
    [P(-700, WR[1]), P(QUAY, WR[1]), P(QUAY, 1500), P(-700, 1500)],
    rect(QUAY - 2, CA[0], CA_END, CA[1]),
    rect(CB[0], CB_END, CB[1], CA[0] + 1),
    rect(-700, WR[0] - 1, -420, WR[1] + 1),      // (the sea past the causeway's end)
  ];
  const ground = buildPaved({ area: AREA, roads, plazas, water, base: "grass", road: [0.70, 0.69, 0.67], plaza: [0.86, 0.85, 0.82] });

  // a row of 4 m pieces along the plan line a -> b facing `out`, their origin `inset` cm back
  // from the line (the quay, canal walls and shore along a water's edge)
  const edge = (a: [number, number], b: [number, number], out: Side, piece: string, inset: number, z = 0) => {
    const A = P(a[0], a[1]), B = P(b[0], b[1]);
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(1, Math.round(L / 400));
    const r = (FACE[out] * Math.PI) / 180, ix = Math.cos(r) * inset, iy = Math.sin(r) * inset;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      put(piece, [A[0] + (B[0] - A[0]) * t + ix, A[1] + (B[1] - A[1]) * t + iy], FACE[out], { sy: L / n / 400, z, solid: "none" });
    }
  };

  // ---- the city wall: 8 m lengths of grey brick, towers at the corners and along the runs,
  // gate towers over the three gates ----
  const GATE_N: [number, number] = P(GATE_U, N), GATE_S: [number, number] = P(GATE_U, S), GATE_W: [number, number] = P(WW, GATE_W_V);
  const run = (a: [number, number], b: [number, number], out: Side, gaps: number[] = []) =>
    town.wall(P(a[0], a[1]), P(b[0], b[1]), out, "suzhou:city_wall", { gaps: gaps.map((g) => g * 20), len: 800, gap: 1700 });
  run([QUAY + 18, N], [E, N], "n", [GATE_U - QUAY - 18]);
  run([WW, S], [E, S], "s", [GATE_U - WW]);
  run([E, N], [E, S], "e");
  run([WW, HEAD.v1 + 18], [WW, S], "w", [GATE_W_V - HEAD.v1 - 18]);
  const tower = (u: number, v: number) => put("suzhou:wall_tower", P(u, v), 0, { solid: [{ kind: "tower", x: 0, y: 0, w: 740, d: 740, rot: 0 }] });
  for (const [u, v] of [[QUAY + 18, N], [E, N], [E, S], [WW, S], [WW, HEAD.v1 + 18], [380, N], [740, N], [380, S], [740, S], [E, 487], [E, 700]] as const) tower(u, v);
  const gateSolid: SolidSpec[] = [
    { kind: "gate", x: 0, y: -540, w: 1000, d: 620, rot: 0 },
    { kind: "gate", x: 0, y: 540, w: 1000, d: 620, rot: 0 },
  ];
  put("suzhou:city_gate", GATE_N, FACE.n, { solid: gateSolid });
  put("suzhou:city_gate", GATE_S, FACE.s, { solid: gateSolid });
  put("suzhou:city_gate", GATE_W, FACE.w, { solid: gateSolid });

  // ---- the harbour: the quay, piers, the headland, the shore, boats ----
  edge([QUAY, N - 30], [QUAY, CA[0]], "w", "suzhou:quay", 10);
  edge([QUAY, CA[1]], [QUAY, HEAD.v0], "w", "suzhou:quay", 10);
  edge([HEAD.u0, HEAD.v0], [QUAY, HEAD.v0], "n", "suzhou:quay", 10);
  edge([HEAD.u0, HEAD.v0], [HEAD.u0, HEAD.v1], "w", "suzhou:quay", 10);
  edge([HEAD.u0, HEAD.v1], [QUAY, HEAD.v1], "s", "suzhou:quay", 10);
  edge([QUAY, HEAD.v1], [QUAY, WR[0]], "w", "suzhou:quay", 10);
  edge([QUAY, WR[1]], [QUAY, S + 10], "w", "suzhou:quay", 10);
  // the causeway's two edges, out to sea
  edge([-420, WR[0]], [QUAY, WR[0]], "n", "suzhou:quay", 10);
  edge([-420, WR[1]], [QUAY, WR[1]], "s", "suzhou:quay", 10);
  edge([-420, WR[0]], [-420, WR[1]], "w", "suzhou:quay", 10);
  // natural shore beyond the walls
  edge([QUAY, -600], [QUAY, N - 30], "w", "suzhou:shore_rocks", 30);
  edge([QUAY, S + 10], [QUAY, 1450], "w", "suzhou:shore_rocks", 30);
  // the piers
  for (const [v, n] of PIERS) for (let i = 0; i < n; i++) put("suzhou:pier", [P(0, v)[0], P(QUAY - 10 - 20 * i, 0)[1]], 0, { solid: "none" });
  for (const [v, n] of PIERS) put("suzhou:lantern_post", P(QUAY - 20 * n + 4, v - 5), FACE.w, { z: 10, solid: post() });
  // the sea is solid, but for the piers
  const seaBox = (u0: number, u1: number, v0: number, v1: number) => {
    const [xa, ya] = P(u0, v0), [xb, yb] = P(u1, v1);
    extra.push({ kind: "sea", x: (xa + xb) / 2, y: (ya + yb) / 2, w: Math.abs(xb - xa), d: Math.abs(yb - ya), rot: 0 });
  };
  {
    let v = N - 70;
    for (const [pv] of PIERS) {
      seaBox(-20, QUAY, v, pv - 8);
      v = pv + 8;
    }
    seaBox(-20, QUAY, v, HEAD.v0);
    for (const [pv, n] of PIERS) seaBox(-20, QUAY - 20 * n, pv - 8, pv + 8);
    seaBox(-20, HEAD.u0, HEAD.v0, HEAD.v1);
    seaBox(-20, QUAY, HEAD.v1, WR[0]);
    seaBox(-20, QUAY, WR[1], S + 80);
  }
  // junks alongside the piers and out at anchor, sampans about the harbour
  put("suzhou:junk", P(128, 298), FACE.w, { z: SEA - 62 });
  put("suzhou:junk", P(142, 454), FACE.w, { z: SEA - 62 });
  put("suzhou:junk", P(30, 225), -70, { z: SEA - 62 });
  put("suzhou:junk", P(10, 575), -100, { z: SEA - 62 });
  for (const [u, v, h] of [[150, 196, 95], [120, 150, 80], [175, 360, -85], [60, 350, 100], [165, 505, 90], [80, 680, 40], [120, 760, -60]] as const)
    put("suzhou:sampan", P(u, v), h, { z: SEA - 30 });
  // cargo and lamps on the quay
  for (let v = 120; v <= 460; v += 50) if (!PIERS.some(([p]) => Math.abs(p - v) < 14)) put("suzhou:lantern_post", P(QUAY + 6, v), FACE.w, { solid: post() });
  for (const [u, v, h] of [[222, 145, 0], [226, 268, 90], [226, 392, 0]] as const) put("suzhou:tea_chests", P(u, v), h);
  for (const [u, v, h] of [[224, 418, 20], [222, 205, -10]] as const) put("suzhou:porcelain_jars", P(u, v), h);
  for (const [u, v] of [[214, 240], [236, 236], [214, 440]] as const) put("common:crate", P(u, v), rnd() * 90);

  // ---- the headland: the pagoda lighthouse, lanterns round it ----
  put("suzhou:pagoda", P(150, 575), FACE.e, { solid: [{ kind: "tower", x: 0, y: 0, r: 620 }] });
  for (const [u, v] of [[112, 532], [112, 618], [192, 532], [192, 618]] as const) put("suzhou:lantern_post", P(u, v), facing(150 - u, 575 - v), { solid: post() });
  put("suzhou:stone_lion", P(212, 556), FACE.e);
  put("suzhou:stone_lion", P(212, 594), FACE.e);
  put("common:bench", P(238, 575), FACE.w);

  // ---- the canals: walls along both banks, bridges, willows and lamps on the walks ----
  edge([QUAY + 2, CA[0]], [CB[0], CA[0]], "s", "suzhou:canal_wall", 16);
  edge([CB[1], CA[0]], [CA_END, CA[0]], "s", "suzhou:canal_wall", 16);
  edge([QUAY + 2, CA[1]], [CA_END, CA[1]], "n", "suzhou:canal_wall", 16);
  edge([CA_END, CA[0]], [CA_END, CA[1]], "w", "suzhou:canal_wall", 16);
  edge([CB[0], CB_END], [CB[0], CA[0]], "e", "suzhou:canal_wall", 16);
  edge([CB[1], CB_END], [CB[1], CA[0]], "w", "suzhou:canal_wall", 16);
  edge([CB[0], CB_END], [CB[1], CB_END], "s", "suzhou:canal_wall", 16);
  // the hump bridges: rails along the water's span, the way over open
  const rails: SolidSpec[] = [{ kind: "rail", x: 0, y: -199, w: 780, d: 24, rot: 0 }, { kind: "rail", x: 0, y: 199, w: 780, d: 24, rot: 0 }];
  for (const u of BRIDGES_A) put("suzhou:hump_bridge", P(u, (CA[0] + CA[1]) / 2), FACE.s, { solid: rails });
  for (const v of BRIDGES_B) put("suzhou:hump_bridge", P((CB[0] + CB[1]) / 2, v), FACE.e, { solid: rails });
  // the canals are solid but for the bridges
  {
    const cut = (from: number, to: number, gaps: number[]) => {
      const out: [number, number][] = [];
      let a = from;
      for (const g of [...gaps].sort((p, q) => p - q)) {
        if (g - 10 > a) out.push([a, g - 10]);
        a = g + 10;
      }
      if (to > a) out.push([a, to]);
      return out;
    };
    for (const [u0, u1] of cut(QUAY, CA_END, BRIDGES_A)) {
      const [x0, y1] = P(u0, CA[1]), [x1, y0] = P(u1, CA[0]);
      extra.push({ kind: "water", x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: Math.abs(x1 - x0), d: Math.abs(y1 - y0), rot: 0 });
    }
    for (const [v0, v1] of cut(CB_END, CA[0], BRIDGES_B)) {
      const [x0, y0] = P(CB[0], v1), [x1, y1] = P(CB[1], v0);
      extra.push({ kind: "water", x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: Math.abs(x1 - x0), d: Math.abs(y1 - y0), rot: 0 });
    }
  }
  // willows and lamps along the walks
  const willow = (u: number, v: number, s = 0.85 + rnd() * 0.25) => put("suzhou:willow", P(u, v), rnd() * 360, { s, solid: [{ kind: "tree", x: 18, y: -4, r: 36 }] });
  const lamp = (u: number, v: number, f: number) => put("suzhou:lantern_post", P(u, v), f, { solid: post() });
  for (let u = 262; u <= CA_END - 10; u += 46) {
    if (BRIDGES_A.some((b) => Math.abs(b - u) < 22)) continue;
    const i = Math.round((u - 262) / 46);
    if (i % 2) lamp(u, CA[0] - 4, FACE.s), lamp(u + 23, CA[1] + 4, FACE.n);
    else willow(u, CA[0] - 6), willow(u + 23, CA[1] + 6);
  }
  for (let v = CB_END + 22; v <= CA[0] - 20; v += 42) {
    if (BRIDGES_B.some((b) => Math.abs(b - v) < 22)) continue;
    const i = Math.round((v - CB_END - 22) / 42);
    if (i % 2) lamp(CB[0] - 4, v, FACE.e), lamp(CB[1] + 4, v + 21, FACE.w);
    else willow(CB[0] - 6, v), willow(CB[1] + 6, v + 21);
  }
  for (const [u, v] of [[412, 130], [CA_END + 8, 487]] as const) willow(u, v);
  // boats in the canals
  for (const [u, v, h] of [[290, 487, 90], [455, 482, -88], [640, 492, 92], [800, 485, -90], [412, 190, 0], [412, 380, 180]] as const)
    put("suzhou:sampan", P(u, v), h, { z: SEA - 28, s: 0.85 });

  // ---- houses: terraces wall to wall along the streets, canals and lanes ----
  const STREET = ["shophouse", "townhouse", "shophouse", "townhouse", "townhouse", "shophouse"];
  const HOMES = ["townhouse", "townhouse", "shophouse", "townhouse"];
  const TINTS = ["", "sz-warm", "sz-dark", "", "sz-grey", "sz-red", "sz-warm", "sz-dark"];
  const terrace = (a: [number, number], b: [number, number], side: Side, pieces: string[], start = 0) =>
    town.terrace(P(a[0], a[1]), P(b[0], b[1]), side, pieces, { start, kit: "suzhou", tints: TINTS, narrow: "townhouse", gap: 8 });
  // the harbour front: shophouses facing the quay
  terrace([QUAY + 43, 108], [QUAY + 43, 252], "w", ["shophouse", "townhouse", "shophouse"]);
  terrace([QUAY + 43, 400], [QUAY + 43, 456], "w", ["shophouse"]);
  // the main street
  terrace([337, MS[0] - 2], [379, MS[0] - 2], "s", ["shophouse"]);
  terrace([590, MS[0] - 2], [738, MS[0] - 2], "s", STREET, 0);
  terrace([447, MS[1] + 2], [533, MS[1] + 2], "n", STREET, 2);
  terrace([590, MS[1] + 2], [738, MS[1] + 2], "n", STREET, 4);
  // lantern lane
  terrace([590, LL[0] - 2], [889, LL[0] - 2], "s", HOMES, 0);
  terrace([590, LL[1] + 1], [738, LL[1] + 1], "n", HOMES, 1);
  // north of the main street between the canal and the avenue; up the avenue's north end
  terrace([AV[0] - 2, 128], [AV[0] - 2, 240], "e", HOMES, 2);
  terrace([CB[1] + 17, 145], [CB[1] + 17, 240], "w", HOMES, 1);
  // along the Grand Canal's north bank
  terrace([447, CA[0] - 17], [533, CA[0] - 17], "s", HOMES, 0);
  terrace([590, CA[0] - 17], [708, CA[0] - 17], "s", HOMES, 3);
  // south-west: the canal's south bank, both sides of the fish lane, both sides of the west road
  terrace([252, CA[1] + 17], [318, CA[1] + 17], "n", STREET, 1);
  terrace([344, CA[1] + 17], [533, CA[1] + 17], "n", STREET, 3);
  terrace([252, FL[0] - 2], [318, FL[0] - 2], "s", HOMES, 0);
  terrace([344, FL[0] - 2], [533, FL[0] - 2], "s", HOMES, 2);
  terrace([252, FL[1] + 2], [533, FL[1] + 2], "n", HOMES, 1);
  terrace([300, WR[0] - 2], [533, WR[0] - 2], "s", STREET, 2);
  terrace([252, WR[1] + 2], [533, WR[1] + 2], "n", HOMES, 3);
  // south-east: the canal's south bank, the avenue's east side
  terrace([590, CA[1] + 17], [708, CA[1] + 17], "n", HOMES, 2);
  terrace([732, CA[1] + 17], [878, CA[1] + 17], "n", HOMES, 0);
  terrace([AV[1] + 2, 578], [AV[1] + 2, 640], "w", ["townhouse"]);
  terrace([AV[1] + 2, 664], [AV[1] + 2, 792], "w", HOMES, 1);

  // ---- the landing square and the pailou over the main street ----
  put("suzhou:pailou", P(336, (MS[0] + MS[1]) / 2), FACE.w, { solid: [-590, -230, 230, 590].map((y) => ({ kind: "post", x: 0, y, r: 42 })) });
  for (const [u, v] of [[252, 262], [252, 390], [326, 262], [326, 392]] as const) lamp(u, v, facing(290 - u, 325 - v));
  for (const v of [290, 360]) put("common:bench", P(304, v), FACE.w);
  put("common:sign_post", P(322, 308), FACE.w);
  put("flora:RoundTree", P(300, 270), rnd() * 360, { s: 0.6 });
  // stone lions at the head of the main pier, cargo waiting by the steps
  for (const v of [316, 334]) put("suzhou:stone_lion", P(QUAY + 8, v), FACE.w, { s: 0.85 });
  put("suzhou:market_stall", P(262, 390), FACE.n);
  put("suzhou:porcelain_jars", P(300, 392), 70, { s: 0.8 });

  // ---- the silk market south of the main street ----
  for (const u of [302, 328, 354]) put("suzhou:market_stall", P(u, MS[1] + 20), FACE.s, { colours: u === 328 ? "sz-red" : undefined });
  for (const u of [302, 358]) put("suzhou:market_stall", P(u, CA[0] - 36), FACE.n, { colours: u === 302 ? "sz-red" : undefined });
  put("suzhou:tea_chests", P(372, 400), 90);
  put("suzhou:porcelain_jars", P(296, 404), 30);
  for (const [u, v] of [[340, 398], [345, 412]] as const) put("common:crate", P(u, v), rnd() * 90);

  // ---- the temple of the sea goddess (the healer's), facing its court off the landing ----
  put("suzhou:great_hall", P(336, 187), FACE.s, { colours: "temple", s: 0.9 });
  put("suzhou:incense_burner", P(335, 245), 0);
  for (const u of [302, 368]) put("suzhou:stone_lion", P(u, 232), FACE.s);
  for (const u of [292, 378]) lamp(u, 248, FACE.s);
  for (const [u, v] of [[300, 125], [335, 120], [370, 128], [290, 148]] as const) put("flora:Pine", P(u, v), rnd() * 360, { s: 0.75 });

  // ---- the tea house by the north canal, on the main street ----
  put("suzhou:tea_house", P(477, 270), FACE.s);
  put("common:bench", P(512, 292), FACE.s);
  put("suzhou:market_stall", P(520, 262), FACE.e);

  // ---- the crossroads ----
  for (const [u, v] of [[520, 285], [600, 285], [520, 365], [600, 365]] as const) lamp(u, v, facing(560 - u, 325 - v));
  put("suzhou:incense_burner", P(560, 325), 0, { s: 0.9 });
  put("common:bench", P(596, 300), FACE.e);
  put("common:bench", P(524, 350), FACE.w);
  put("suzhou:market_stall", P(598, 350), FACE.w, { colours: "sz-red" });

  // ---- strings of lanterns across the main street and the avenue ----
  const across = (u: number, v: number, along: "u" | "v", width: number) => put("suzhou:lantern_string", P(u, v), along === "u" ? FACE.w : FACE.s, { sy: (width * 20) / 1200, solid: "none" });
  for (const u of [470, 612, 656, 700]) across(u, (MS[0] + MS[1]) / 2, "u", 56);
  for (const v of [228, 560, 700, 760]) across((AV[0] + AV[1]) / 2, v, "v", 56);
  for (const u of [640, 720, 800, 870]) lamp(u, LL[0] + 3, FACE.s);
  // lamps up the avenue and along the lanes
  for (const v of [150, 250, 420, 560, 600, 690, 770]) lamp(AV[0] + 4, v, FACE.e), lamp(AV[1] - 4, v + 20, FACE.w);
  for (const u of [280, 380, 470]) lamp(u, FL[0] + 3, FACE.s), lamp(u + 30, WR[0] + 3, FACE.s);

  // ---- the governor's yamen at the east end of the main street ----
  put("suzhou:gate_hall", P(756, 325), FACE.w, { solid: [{ kind: "wall", x: 0, y: -280, w: 470, d: 300, rot: 0 }, { kind: "wall", x: 0, y: 280, w: 470, d: 300, rot: 0 }] });
  put("suzhou:great_hall", P(862, 325), FACE.w);
  const cwall = (a: [number, number], b: [number, number], out: Side) => town.wall(P(a[0], a[1]), P(b[0], b[1]), out, "suzhou:courtyard_wall", { len: 400 });
  cwall([742, 222], [742, 302], "w");
  cwall([742, 348], [742, 428], "w");
  cwall([742, 222], [E - 8, 222], "n");
  cwall([742, 428], [E - 8, 428], "s");
  for (const v of [302, 348]) put("suzhou:stone_lion", P(728, v), FACE.w);
  for (const [u, v] of [[704, 286], [704, 364]] as const) lamp(u, v, FACE.w);
  for (const [u, v] of [[790, 250], [790, 400], [812, 250], [812, 400]] as const) put("flora:Pine", P(u, v), rnd() * 360, { s: 0.7 });
  for (const v of [270, 380]) put("suzhou:taihu_rock", P(798, v), rnd() * 360);

  // ---- the smith's forge by the west gate ----
  put("suzhou:forge", P(272, 684), FACE.s);
  put("suzhou:tea_chests", P(250, 692), 0, { s: 0.6 });

  // ---- the walled garden (south-east), through the moon gate ----
  cwall([628, 572], [628, 640], "w");
  cwall([628, 665], [628, 812], "w");
  town.wall(P(628, 572), P(E - 8, 572), "n", "suzhou:courtyard_wall", { len: 400, gaps: [(720 - 628) * 20], gap: 500 });
  put("suzhou:moon_gate", P(720, 572), FACE.n, { solid: [{ kind: "wall", x: 0, y: -190, w: 60, d: 120, rot: 0 }, { kind: "wall", x: 0, y: 190, w: 60, d: 120, rot: 0 }] });
  put("suzhou:moon_gate", P(628, 652.5), FACE.w, { solid: [{ kind: "wall", x: 0, y: -190, w: 60, d: 120, rot: 0 }, { kind: "wall", x: 0, y: 190, w: 60, d: 120, rot: 0 }] });
  put("suzhou:lotus_pond", P(700, 720), 10);
  put("suzhou:lotus_pond", P(840, 620), 80, { s: 0.75 });
  put("suzhou:pavilion", P(800, 690), FACE.w);
  put("suzhou:pavilion", P(855, 770), facing(-1, -1), { s: 0.85 });
  for (const [u, v] of [[660, 600], [680, 778], [742, 610], [866, 722], [730, 790], [800, 610], [652, 690]] as const) put("suzhou:taihu_rock", P(u, v), rnd() * 360, { s: 0.8 + rnd() * 0.4 });
  for (const [u, v] of [[735, 690], [668, 735], [790, 760], [878, 590], [690, 600]] as const) willow(u, v);
  for (const [u, v, k] of [[640, 585, "Bamboo"], [640, 800, "Bamboo"], [866, 792, "Bamboo"], [770, 600, "Pine"], [880, 735, "Pine"], [700, 662, "RoundTree"]] as const)
    put(`flora:${k}`, P(u, v), rnd() * 360, { s: k === "Bamboo" ? 1 : 0.75 });
  for (const [u, v, f] of [[745, 660, FACE.n], [775, 735, FACE.w], [700, 670, FACE.s]] as const) put("common:bench", P(u, v), f);
  for (const [u, v, k] of [[655, 760, "AutumnTree"], [705, 772, "Cherry"], [830, 655, "AutumnTree"], [870, 640, "Cherry"], [820, 800, "AutumnTree"], [690, 625, "Cherry"], [650, 615, "Bamboo"], [885, 760, "Bamboo"]] as const)
    put(`flora:${k}`, P(u, v), rnd() * 360, { s: k === "Bamboo" ? 1 : 0.7 });
  for (const [u, v] of [[742, 700], [757, 790], [815, 640], [670, 790]] as const) put("suzhou:taihu_rock", P(u, v), rnd() * 360, { s: 0.6 });
  for (const s of [-1, 1]) put("suzhou:stone_lion", P(619, 652.5 + s * 8.5), FACE.w, { s: 0.7 }), put("suzhou:stone_lion", P(720 + s * 8.5, 562), FACE.n, { s: 0.7 });
  for (const [u, v] of [[640, 640], [640, 666]] as const) lamp(u, v, FACE.w);

  // ---- the causeway out of the west gate: willows and lanterns over the sea ----
  for (let u = WW - 64; u >= -400; u -= 36) {
    const i = Math.round((WW - 64 - u) / 36);
    if (i % 2) lamp(u, WR[0] + 4, FACE.s), lamp(u - 18, WR[1] - 4, FACE.n);
    else willow(u, WR[0] + 5, 0.8), willow(u - 18, WR[1] - 5, 0.8);
  }

  // ---- the greens left between: trees and garden rocks wherever there is room ----
  town.greens(ground, { x0: P(0, S)[0], x1: P(0, N)[0], y0: P(E, 0)[1], y1: P(QUAY + 40, 0)[1] }, { trees: ["RoundTree", "Bamboo", "Pine", "SmallTree", "Bamboo"], other: "suzhou:taihu_rock", chance: 0.75, step: 460, margin: 300 });

  // ---- outside the walls: pine woods on the hills, bamboo and willows down by the fields ----
  const toPlan = (x: number, y: number) => [560 - y / 20, 325 - x / 20] as const;
  const keepOut = (x: number, y: number) => {
    const [u, v] = toPlan(x, y);
    const inside = u > QUAY - 10 && u < E + 25 && v > N - 25 && v < S + 25;
    const road = Math.abs(u - GATE_U) < 45 && (v < N || v > S);
    return inside || road || u < QUAY + 25 || Math.abs(v - GATE_W_V) < 30;
  };
  const WOODS = { x0: P(0, 1400)[0], x1: P(0, -700)[0], y0: P(1450, 0)[1], y1: P(QUAY, 0)[1] };
  town.woods(WOODS, ["Pine", "Pine", "PineSmall", "Bamboo", "RoundTree", "Pine"], keepOut, { count: 520, tries: 30000, spacing: 360 });
  // (thicker close round the walls)
  town.woods({ x0: P(0, S + 260)[0], x1: P(0, N - 260)[0], y0: P(E + 260, 0)[1], y1: P(QUAY, 0)[1] }, ["Pine", "RoundTree", "Bamboo", "PineSmall", "SmallTree"], keepOut, { count: 260, tries: 12000, spacing: 300 });
  town.woods(WOODS, ["willow"], (x, y) => keepOut(x, y) || toPlan(x, y)[1] < S + 40, { count: 30, tries: 3000, spacing: 600, kit: "suzhou" });

  // ---- build ----
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(90000, 90000).rotateX(-Math.PI / 2), material("WaterSea"));
  sea.position.set(0, SEA, 0);
  sea.receiveShadow = true;
  const pt = (u: number, v: number) => ({ x: P(u, v)[0], y: P(u, v)[1] });
  return town.finish({
    ground,
    scenery: [sea],
    sky: "#2f6f8f",
    flowers: {
      box: { x: P(0, S)[0], y: P(E, 0)[1], w: (S - N) * 20, h: (E - QUAY) * 20 },
      open: (x, y) => {
        const [u, v] = toPlan(x, y);
        return ground.kind(x, y) === 0 && u > QUAY + 20 && u < E - 15 && v > N + 15 && v < S - 15;
      },
      density: 0.3 * quality.flowers,
    },
    bounds: { minX: P(0, S + 50)[0], maxX: P(0, N - 50)[0], minY: P(E + 35, 0)[1], maxY: P(60, 0)[1] },
    spawn: pt(268, 332),
    npcs: suzhouNpcs(),
    // north over the mountains toward Noa, south to the rice terraces, west along the causeway
    // to the cape
    ...waysOut([gateWay(GATE_N, "n", "west_pass", 760, 760), gateWay(GATE_S, "s", "rice_terraces", 760, 760), gateWay(GATE_W, "w", "west_cape", 900, 760)]),
    closed: [],
    labels: [
      { ...pt(215, 352), text: "ท่าเรือซูโจว" },
      { ...pt(290, 340), text: "ลานท่าเรือ", kind: "small" },
      { ...pt(335, 245), text: "ศาลเจ้าแม่ทับทิม" },
      { ...pt(335, 420), text: "ตลาดผ้าไหม" },
      { ...pt(345, 340), text: "ซุ้มประตูไผ่ไหล", kind: "small" },
      { ...pt(650, 325), text: "ถนนสายไหม" },
      { ...pt(477, 305), text: "โรงน้ำชาริมคลอง", kind: "small" },
      { ...pt(560, 340), text: "สี่แยกกลางเมือง", kind: "small" },
      { ...pt(720, 325), text: "จวนเจ้าเมือง" },
      { ...pt(660, 512), text: "คลองใหญ่", kind: "small" },
      { ...pt(437, 300), text: "คลองเหนือ", kind: "small" },
      { ...pt(215, 600), text: "เจดีย์ประภาคาร" },
      { ...pt(750, 652), text: "สวนหลิว" },
      { ...pt(740, 205), text: "ตรอกโคมแดง", kind: "small" },
      { ...pt(400, 612), text: "ตรอกปลา", kind: "small" },
      { ...pt(140, 724), text: "ทำนบหลิว", kind: "small" },
      { ...pt(272, 700), text: "โรงตีเหล็ก", kind: "small" },
      { x: GATE_N[0] - 650, y: GATE_N[1] - 300, text: "ประตูเหนือ · ช่องเขาตะวันตก", kind: "gate" },
      { x: GATE_S[0] + 650, y: GATE_S[1] - 300, text: "ประตูใต้ · นาขั้นบันได", kind: "gate" },
      { x: GATE_W[0], y: GATE_W[1] + 650, text: "ประตูตะวันตก · แหลมทะเลตะวันตก", kind: "gate" },
    ],
  });
}

// ---- the people of Suzhou ----
function suzhouNpcs(): NpcSpec[] {
  const at = (u: number, v: number) => {
    const [x, y] = P(u, v);
    return { x, y };
  };
  const man = (top: string, hairColor = "ink", bottom = "bottom_warrior_black") => ({ gender: "male", hair: "", hairColor, eyes: "amber", top, bottom });
  const woman = (top: string, bottom: string, hairColor = "ink", hair = "hime", eyes = "amber") => ({ gender: "female", hair, hairColor, eyes, top, bottom });
  const guard = (top = "top_warrior_navy") => man(top, "ink", "bottom_warrior_black");
  return [
    travelGuide("suzhou", P(284, 304), facing(-1, 1), "เสี่ยวหลาน"),
    { id: "suzhou_captain", ...at(94, 325), face: -90, name: "กัปตันเจิ้ง", title: "เรือโดยสาร · อีเดน เวนิชเซีย", role: "travel", ports: ["eden", "venezia"], look: man("top_warrior_navy", "silver"),
      lines: ["ข้าล่องสำเภาเลียบฝั่งตะวันตกมาสามสิบปี จะไปอีเดนหรือเวนิชเซียก็ขึ้นมาเลย", "ขาไปขนใบชากับผ้าไหม ขากลับขนเหล็กกับข้าวสาลีจากแผ่นดินใหญ่", "เห็นเจดีย์บนแหลมนั่นไหม คืนไหนพายุแรง แสงจากยอดเจดีย์พาเรือข้ากลับบ้านทุกครั้ง"] },
    { id: "suzhou_healer", ...at(320, 236), face: 0, name: "แม่หมอเซียงหลิน", title: "ศาลเจ้าแม่ทับทิม · รักษาฟรี", role: "heal",
      look: woman("top_priestess_wine", "bottom_priestess_white"),
      lines: ["ขอเจ้าแม่ทับทิมคุ้มครองท่านทั้งบนบกและในทะเล", "ชาวเรือทุกคนมาจุดธูปที่นี่ก่อนออกทะเล หายเจ็บแล้วก็เดินทางต่อได้เลยนะ"] },
    { id: "suzhou_shop", ...at(357, 304), face: 0, name: "เถ้าแก่เนี้ยหลิน", title: "ร้านเครื่องมือ · ของใช้เดินทาง", role: "shop", sprite: "merchant",
      lines: ["ยา เสบียง ผ้าพันแผล ของใช้เดินทาง ร้านข้ามีครบ ราคาคนกันเอง"] },
    { id: "suzhou_smith", ...at(272, 699), face: 0, name: "ช่างเหล็กหวัง", title: "ช่างตีเหล็ก · ตีบวก สร้างไอเทม", role: "smith", look: man("top_warrior", "ink", "bottom_warrior_cocoa"),
      lines: ["เหล็กที่เรือขนมาจากแผ่นดินใหญ่ ข้าตีเป็นดาบให้ทหารยามทั้งเมือง", "เอาหินนภามาตีบวกอาวุธ หินดารามาตีบวกชุด มีวัตถุดิบพอเมื่อไรข้าสร้างอุปกรณ์ให้ได้"] },
    { id: "suzhou_teahouse", ...at(470, 305), face: 0, name: "นายหญิงหยุน", title: "เจ้าของโรงน้ำชาริมคลอง", role: "talk", look: woman("top_lilac", "bottom_wine"),
      lines: ["เชิญขึ้นไปนั่งระเบียงชั้นบนสิคะ มองเห็นเรือประทุนแล่นผ่านใต้สะพานพอดี", "ชาเขียวจากนาขั้นบันไดทางใต้ หอมที่สุดต้องชงด้วยน้ำค้างยามเช้า", "พ่อค้าจากเวนิชเซียมาทีไรก็ขนชาของร้านเรากลับไปทีละหลายหีบ"] },
    { id: "suzhou_guard_n1", ...at(544, 134), face: 180, name: "ทหารยามหลี่", title: "ทหารยามประตูเหนือ", role: "talk", look: guard(),
      lines: ["ออกประตูเหนือไปคือช่องเขาตะวันตก ทางคดเคี้ยวเลียบหน้าผา ข้ามเขาไปถึงเมืองโนอา", "ช่องเขามีด่านเก่ากับสะพานเชือก อย่าข้ามตอนลมแรงล่ะ"] },
    { id: "suzhou_guard_n2", ...at(576, 134), face: 180, name: "ทหารยามจาง", title: "ทหารยามประตูเหนือ", role: "talk", look: guard("top_warrior_forest"),
      lines: ["ของบนช่องเขาดุร้ายนัก ถ้ายังไม่แกร่งพออย่าเพิ่งออกไป", "พ่อค้าที่จะไปโนอาส่วนมากนั่งเรือไปอีเดนแล้วเดินบกต่อ ปลอดภัยกว่า"] },
    { id: "suzhou_guard_s1", ...at(544, 788), face: 0, name: "ทหารยามเฉิน", title: "ทหารยามประตูใต้", role: "talk", look: guard(),
      lines: ["ออกประตูใต้ไปเป็นนาขั้นบันได ข้าวกับใบชาของซูโจวปลูกที่นั่นทั้งหมด", "เดินเลยนาไปทางตะวันออกจะถึงบึงลากูน หมอกพิษหนาจนมองไม่เห็นทาง"] },
    { id: "suzhou_guard_s2", ...at(576, 788), face: 0, name: "ทหารยามโจว", title: "ทหารยามประตูใต้", role: "talk", look: guard("top_warrior_forest"),
      lines: ["ช่วงนี้มีของแปลกๆ ลงมากินข้าวในนาตอนกลางคืน ชาวนาบ่นกันทั้งหมู่บ้าน", "ถ้าบาดเจ็บกลับมา ไปหาแม่หมอที่ศาลเจ้าแม่ทับทิมริมท่าเรือนะ"] },
    { id: "suzhou_guard_w1", ...at(250, 708), face: -90, name: "ทหารยามหม่า", title: "ทหารยามประตูตะวันตก", role: "talk", look: guard(),
      lines: ["ทำนบหลิวนี้ทอดยาวกลางทะเลไปถึงแหลมทะเลตะวันตก ปลายสุดของทวีป", "ที่แหลมทะเลคลั่งทั้งปี มีซากเรือแตกเต็มหาด กับศาลมังกรทะเลเก่าแก่"] },
    { id: "suzhou_guard_w2", ...at(250, 732), face: -90, name: "ทหารยามซ่ง", title: "ทหารยามประตูตะวันตก", role: "talk", look: guard("top_warrior_forest"),
      lines: ["ของที่แหลมนั่นแข็งแกร่งที่สุดในแดนตะวันตก ขนาดทหารเก่าๆ ยังไม่กล้าไป", "เดินบนทำนบระวังลื่น คลื่นซัดขึ้นมาถึงต้นหลิวเลยบางคืน"] },
    { id: "suzhou_pagoda_keeper", ...at(204, 576), face: -90, name: "ตาเฒ่าโหลว", title: "ผู้เฝ้าเจดีย์ประภาคาร", role: "talk", look: man("top_warrior_navy", "silver", "bottom_warrior_cocoa"),
      lines: ["ข้าจุดไฟบนยอดเจดีย์นี้ทุกคืนมาสี่สิบปีแล้ว เรือสำเภาทุกลำมองหาแสงนี้กลับบ้าน", "ตำนานว่ามังกรทะเลนอนอยู่ใต้คลื่นที่แหลมทะเลตะวันตก ใครลบหลู่ศาลของมัน ทะเลจะคลั่งเจ็ดวันเจ็ดคืน", "คืนเดือนมืดข้าเคยเห็นเกล็ดสีเขียวมรกตเป็นประกายกลางทะเล ยาวกว่าเรือสำเภาสามลำต่อกัน", "ชาวเรือเชื่อว่ามังกรคุ้มครองซูโจวอยู่ ตราบใดที่ไฟบนเจดีย์ยังไม่ดับ"] },
    { id: "suzhou_silk", ...at(338, 425), face: 0, name: "เถ้าแก่ซู", title: "พ่อค้าผ้าไหม", role: "talk", look: man("top_warrior_navy", "ink", "bottom_warrior_cocoa"),
      lines: ["ผ้าไหมซูโจวเนื้อบางเบาเหมือนเมฆ พ่อค้าเวนิชเซียยอมจ่ายเป็นทองคำ", "หนอนไหมเลี้ยงในหมู่บ้านทางใต้ ทอกันทุกบ้านริมคลอง", "ลายมังกรนี่ต้องสั่งล่วงหน้าสามเดือนนะ ช่างทอเหลืออยู่ไม่กี่คนแล้ว"] },
    { id: "suzhou_porcelain", ...at(232, 432), face: -90, name: "นายวาณิชหวง", title: "พ่อค้าเครื่องเคลือบและใบชา", role: "talk", look: man("top_warrior", "ink"),
      lines: ["เครื่องเคลือบลายครามพวกนี้จะลงสำเภาไปอีเดนพรุ่งนี้เช้า ระวังอย่าเดินชนนะ", "ใบชาต้องอัดหีบให้แน่น ไม่งั้นลมทะเลเค็มจะกินกลิ่นหมด", "ได้ยินว่าเมืองเวนิชเซียมีคลองมากกว่าซูโจวอีก ข้าไม่เชื่อหรอก"] },
    { id: "suzhou_fisher", ...at(160, 175), face: -90, name: "อาเฉียง", title: "ชาวประมง", role: "talk", look: man("top_warrior_forest", "auburn", "bottom_warrior_cocoa"),
      lines: ["ปลาทะเลตะวันตกตัวโตกว่าที่ไหน แต่ห้ามออกไปไกลเกินแหลมเด็ดขาด", "เมื่อเดือนก่อนอวนข้าติดเกล็ดใหญ่เท่าฝ่ามือขึ้นมา สีเขียววาวเหมือนหยก ตาเฒ่าโหลวบอกว่าเป็นของมังกร"] },
    { id: "suzhou_clerk", ...at(722, 318), face: 90, name: "ขุนเหวิน", title: "เสมียนจวนเจ้าเมือง", role: "talk", look: man("top_warrior_navy", "ink", "bottom_warrior_black"),
      lines: ["นี่คือจวนท่านเจ้าเมือง ผู้ดูแลท่าเรือและภาษีการค้าทั้งหมดของซูโจว", "เรือที่เข้าท่าต้องเสียภาษีเป็นใบชาหนึ่งหีบต่อสิบหีบ ท่านเจ้าเมืองเคร่งครัดนัก", "ประตูเหนือไปช่องเขา ประตูใต้ไปนาขั้นบันได ประตูตะวันตกออกทำนบไปแหลม จำไว้ให้ดี"] },
    { id: "suzhou_meimei", ...at(700, 652), face: 90, name: "เสี่ยวเหมย", title: "เด็กหญิงในสวนหลิว", role: "talk", look: woman("top_rose", "bottom_wine", "ink", "twintail", "teal"),
      lines: ["ลอดประตูพระจันทร์เข้ามาแล้วอธิษฐาน ว่ากันว่าจะสมหวังนะ", "ดอกบัวในสระบานตอนเช้า ส่วนหินไท่หูรูพรุนนั่นมาจากก้นทะเลสาบเชียวนะ"] },
  ];
}
