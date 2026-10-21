// ไอซ์เบิร์ก (Iceberg), the snow port of the far north, laid out from the player's own plan (a
// hand-drawn map: a palisade along the north, west and south with a gate in the north and one in
// the south, white roads of packed snow winding between clusters of log houses, an open square in
// the upper right, and the whole east side open to the river that runs down to the sea, with the
// harbour at the head of its reach). Cold all year: log houses under steep roofs heavy with snow,
// the great timber hall with its dragon-headed gables, a frozen fountain, ice drifting past the
// quays.
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

// ---- the plan's pixels -> the world: 28 cm a pixel, the fork below the great hall near the origin ----
const { P, poly, band } = new Plan(28, 440, 400);
type UV = [number, number];
const pairs = (a: number[]): UV[] => {
  const out: UV[] = [];
  for (let i = 0; i + 1 < a.length; i += 2) out.push([a[i], a[i + 1]]);
  return out;
};

// the palisade (plan v, v, u), the river's town bank (u), the head of its reach (v), the harbour's
// shore on the east (u), the two gates (u)
const NORTH = 184, SOUTH = 622, WEST = 126, RIVER = 620, BANK = 372, HARBOUR_E = 772;
const GATE_N_U = 363, GATE_S_U = 437;

// The white roads as the plan draws them (traced from its green hatching): in from the north
// gate, one road off west along the hall block, one east past the square to the harbour, and down
// past the great hall to a wide fork, whose west arm winds round to the south gate and whose east
// arm runs down to the river.
const ROADS = pairs([
  165, 338, 164, 342, 172, 343, 177, 348, 176, 380, 179, 382, 218, 333, 243, 306, 265, 287, 297, 268,
  306, 265, 326, 265, 334, 260, 349, 260, 387, 294, 392, 303, 396, 320, 397, 346, 394, 363, 364, 393,
  360, 400, 351, 402, 323, 428, 306, 462, 303, 475, 303, 496, 309, 513, 324, 529, 325, 537, 330, 541,
  359, 549, 379, 560, 398, 584, 409, 605, 415, 622, 459, 622, 454, 604, 441, 586, 417, 567, 388, 549,
  380, 539, 372, 536, 363, 527, 351, 497, 351, 483, 357, 469, 372, 457, 402, 441, 431, 439, 446, 446,
  482, 457, 495, 468, 510, 486, 521, 504, 523, 517, 535, 532, 555, 550, 583, 561, 590, 555, 597, 543,
  596, 536, 591, 530, 553, 509, 525, 483, 506, 451, 489, 410, 481, 397, 447, 367, 445, 353, 440, 343,
  440, 321, 447, 303, 470, 281, 480, 267, 510, 249, 546, 240, 592, 241, 620, 248, 627, 253, 652, 253,
  674, 264, 695, 263, 707, 257, 701, 250, 702, 223, 694, 221, 672, 226, 644, 226, 610, 218, 573, 201,
  533, 202, 492, 217, 462, 237, 425, 268, 411, 270, 407, 266, 396, 218, 396, 197, 390, 184, 350, 184,
  354, 217, 348, 226, 333, 227, 322, 223, 299, 224, 288, 227, 264, 240, 228, 270, 200, 303,
]);

// Every square on the plan: [name, u0, u1, v0, v1, kit piece, scale, the side its front faces
// (the nearest road)]. The big one in the hall block is the great hall.
type House = [string, number, number, number, number, string, number, Side];
const HOUSES: House[] = [
  // cottages between the west road and the walls
  ["h1", 153, 175, 232, 255, "timber_house", 0.85, "s"],
  ["h2", 190, 213, 235, 257, "stone_cottage", 0.8, "s"],
  ["h3", 220, 241, 212, 235, "timber_house", 0.8, "s"],
  ["h4", 258, 276, 210, 230, "log_cabin", 1.0, "s"],
  ["h5", 158, 181, 280, 305, "log_cabin", 1.1, "e"],
  // the little cabins between the gate road and the harbour road
  ["t1", 414, 427, 201, 226, "log_cabin", 0.95, "w"],
  ["t2", 439, 454, 195, 216, "log_cabin", 0.9, "s"],
  ["t3", 462, 479, 201, 225, "log_cabin", 1.0, "s"],
  ["t4", 414, 431, 235, 257, "log_cabin", 0.95, "w"],
  ["t5", 439, 455, 224, 244, "log_cabin", 0.9, "s"],
  // the hall block
  ["m1", 281, 312, 279, 310, "timber_house", 1.0, "n"],
  ["m2", 330, 350, 271, 296, "timber_house", 0.8, "n"],
  ["hall", 329, 389, 300, 341, "great_hall", 0.78, "e"],
  ["m4", 241, 277, 307, 359, "longhouse", 1.0, "w"],
  ["m5", 290, 319, 320, 353, "stone_cottage", 0.9, "n"],
  ["m6", 359, 386, 344, 376, "timber_house", 0.9, "e"],
  ["m7", 217, 247, 370, 407, "stone_cottage", 1.0, "n"],
  ["m8", 275, 309, 380, 420, "timber_house", 1.05, "s"],
  ["m9", 313, 346, 367, 403, "stone_cottage", 1.0, "s"],
  ["m10", 244, 271, 417, 444, "timber_house", 0.85, "s"],
  ["m11", 284, 305, 434, 465, "log_cabin", 1.15, "e"],
  // round the open square and on the harbour road
  ["e1", 446, 470, 308, 326, "stone_cottage", 0.75, "e"],
  ["e2", 449, 469, 338, 360, "log_cabin", 1.0, "e"],
  ["n1", 515, 538, 260, 288, "timber_house", 0.85, "s"],
  ["n2", 580, 605, 261, 293, "timber_house", 0.9, "n"],
  ["n3", 695, 721, 273, 299, "stone_cottage", 0.85, "e"],
  // the fishermen's huts along the river
  ["r1", 578, 594, 357, 382, "fisher_hut", 1.0, "e"],
  ["r2", 576, 598, 405, 434, "fisher_hut", 1.1, "e"],
  ["r3", 568, 592, 465, 488, "fisher_hut", 1.1, "e"],
  // the west, among the pines
  ["w1", 147, 168, 442, 470, "timber_house", 0.85, "e"],
  ["w2", 190, 208, 457, 477, "log_cabin", 1.0, "e"],
  ["w3", 153, 174, 517, 537, "igloo", 1.0, "e"],
  ["w4", 238, 256, 500, 525, "log_cabin", 1.05, "e"],
  ["w5", 203, 225, 563, 591, "stone_cottage", 0.8, "n"],
  ["w6", 293, 314, 565, 594, "timber_house", 0.85, "n"],
  ["w7", 340, 362, 576, 604, "log_cabin", 1.1, "n"],
  // the lower town between the two arms of the fork: the smithy at its head
  ["smithy", 361, 379, 473, 503, "smithy", 0.85, "n"],
  ["l2", 389, 411, 466, 499, "timber_house", 0.85, "n"],
  ["l3", 424, 452, 458, 494, "timber_house", 1.0, "n"],
  ["l4", 467, 492, 465, 498, "stone_cottage", 0.85, "n"],
  ["l5", 383, 407, 512, 535, "log_cabin", 1.1, "s"],
  ["l6", 419, 453, 517, 552, "stone_cottage", 1.0, "s"],
  ["l7", 458, 488, 502, 546, "longhouse", 0.85, "e"],
  ["l8", 458, 491, 557, 587, "timber_house", 0.95, "w"],
  ["l9", 501, 530, 529, 574, "longhouse", 0.85, "e"],
  // along the south wall by the river
  ["s1", 499, 524, 582, 603, "log_cabin", 1.1, "w"],
  ["s2", 532, 565, 571, 601, "timber_house", 0.95, "n"],
  ["s3", 574, 601, 572, 599, "stone_cottage", 0.85, "e"],
];

export function buildIceberg(quality: { flowers: number }): Town {
  const town = new TownBuilder(17);
  const { put, rnd, extra } = town;

  // ---- ground: snow everywhere, the white roads, the square and the quays (flagstones), the
  // river (water) ----
  const roads: Poly[] = [
    poly(ROADS),
    band([[GATE_N_U, 186], [GATE_N_U, 120], [360, 40], [352, -60]], 40),   // out of the north gate
    band([[GATE_S_U, 620], [GATE_S_U, 690], [430, 760], [420, 860]], 40),  // out of the south gate
    band([[690, 240], [748, 240]], 34),                                     // the harbour road on to the quay
  ];
  const SQUARE: UV[] = [[476, 300], [512, 296], [566, 298], [566, 360], [562, 452], [548, 470], [528, 470], [512, 448], [498, 412], [478, 380], [470, 330]];
  const plazas: Poly[] = [
    poly(SQUARE),
    poly([[598, 338], [740, 338], [740, 196], [HARBOUR_E, 196], [HARBOUR_E, BANK], [598, BANK]]), // the harbour quay
    poly([[598, BANK], [RIVER, BANK], [RIVER, 612], [598, 612]]),                                 // the river quay
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
  // and one in the south; the east lies open to the river ----
  const xN = P(0, NORTH)[0], xS = P(0, SOUTH)[0], yW = P(WEST, 0)[1], yR = P(RIVER, 0)[1], yH = P(HARBOUR_E, 0)[1];
  const GN: [number, number] = [xN, P(GATE_N_U, 0)[1]];
  const GS: [number, number] = [xS, P(GATE_S_U, 0)[1]];
  const run = (a: [number, number], b: [number, number], out: Side, gaps: number[] = []) => town.wall(a, b, out, "iceberg:palisade", { gaps, gap: 1040 });
  run([xN, yW], [xN, yH + 150], "n", [yW - GN[1]]);
  run([xN, yW], [xS, yW], "w");
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

  // ---- the houses, each on its square of the plan with its front to the road; one whose porch
  // or steps would stand on the road is pushed back off it ----
  const placed: { x: number; y: number; h: number; s: number; f: { x0: number; x1: number; y0: number; y1: number }; piece: string }[] = [];
  for (const [, u0, u1, v0, v1, piece, s, side] of HOUSES) {
    const ref = `iceberg:${piece}`, f = protoOf(ref).foot, h = FACE[side];
    const c = Math.cos((h * Math.PI) / 180), sn = Math.sin((h * Math.PI) / 180);
    let [x, y] = P((u0 + u1) / 2, (v0 + v1) / 2);
    const onWay = () => {
      for (let i = 0; i <= 8; i++)
        for (let j = 0; j <= 8; j++) {
          const lx = (f.x0 + ((f.x1 - f.x0) * i) / 8) * 0.95 * s, ly = (f.y0 + ((f.y1 - f.y0) * j) / 8) * 0.95 * s;
          if (!snow(x + lx * c - ly * sn, y + lx * sn + ly * c)) return true;
        }
      return false;
    };
    for (let k = 0; k < 16 && onWay(); k++) {
      x += c * 30;
      y += sn * 30;
    }
    put(ref, [x, y], h, { s });
    placed.push({ x, y, h, s, f, piece });
  }

  // ---- the great hall: braziers burn either side of its steps, ice bears stand guard, a
  // woodpile and barrels round the back ----
  prop("iceberg:ice_sculpture", 400, 300, FACE.e, 90, true);
  prop("iceberg:ice_sculpture", 400, 338, FACE.e, 90, true);
  prop("iceberg:woodpile", 318, 302, FACE.s, 120);
  prop("iceberg:snowy_barrels", 322, 348, rnd() * 360, 110);

  // ---- the north gate: braziers either side inside, a lantern, a woodpile against the palisade ----
  prop("iceberg:brazier", 349, 198, 0, 60, true);
  prop("iceberg:brazier", 378, 198, 0, 60, true);
  lamp(400, 202);
  prop("iceberg:woodpile", 318, 197, FACE.s, 100);
  prop("iceberg:snowy_barrels", 404, 228, 30, 100, true);

  // ---- the open square: the frozen fountain in the middle ringed with benches and lanterns, a
  // great pine at its head, fur traders down its east side, ice bears, a sled and a snowman ----
  const FC: UV = [521, 372];
  put("iceberg:frozen_fountain", P(FC[0], FC[1]), 22.5, { solid: [{ kind: "fountain", x: 0, y: 0, r: 280 }] });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2, du = Math.cos(a), dv = Math.sin(a);
    put("common:bench", P(FC[0] + du * 19, FC[1] + dv * 19), facing(-du, -dv));
    const b = a + Math.PI / 4;
    lamp(FC[0] + Math.cos(b) * 21, FC[1] + Math.sin(b) * 21);
  }
  for (const v of [312, 340, 404, 432]) put("iceberg:fur_stall", P(553, v), FACE.w);
  // the great pine at its head, braziers either side
  put("flora:SnowPine", P(522, 311), 20, { s: 1.45 });
  prop("iceberg:brazier", 506, 318, 0, 60, true);
  prop("iceberg:brazier", 538, 318, 0, 60, true);
  prop("iceberg:snowy_barrels", 556, 455, 10, 100, true);
  prop("iceberg:snowy_barrels", 556, 372, 80, 100, true);
  prop("iceberg:ice_sculpture", 490, 336, FACE.e, 90, true);
  prop("iceberg:ice_sculpture", 498, 410, FACE.e, 90, true);
  prop("iceberg:snowman", 489, 307, facing(1, 1), 90, true);
  prop("iceberg:sled", 520, 452, FACE.w - 15, 120, true);
  for (const [u, v] of [[481, 302], [561, 301], [553, 465], [489, 372]] as UV[]) lamp(u, v);

  // ---- the fork below the hall (where travellers arrive): braziers to warm them, a sign post,
  // the shop's sled ----
  prop("iceberg:brazier", 404, 404, 0, 60, true);
  prop("iceberg:brazier", 452, 410, 0, 60, true);
  prop("common:sign_post", 454, 377, facing(-1, 0.4), 60);
  prop("iceberg:sled", 410, 446, FACE.e + 10, 110, true);
  prop("iceberg:snowy_barrels", 446, 448, 0, 100, true);

  // ---- the smithy's yard and the lower town ----
  prop("iceberg:woodpile", 352, 470, FACE.e, 110);
  prop("iceberg:snowy_barrels", 414, 508, 40, 100);
  prop("iceberg:woodpile", 497, 520, FACE.w, 110);
  prop("iceberg:snowman", 412, 555, facing(-1, 0), 100);

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
  prop("iceberg:woodpile", 600, 315, FACE.n, 110);
  prop("iceberg:snowy_barrels", 728, 310, 50, 110);
  prop("iceberg:sled", 655, 300, 200, 120);
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

  // ---- lanterns along the white roads: every 13 m down each edge, just off the road on the snow
  // wherever nothing else stands ----
  {
    let carry = 600;
    for (let i = 0; i < ROADS.length; i++) {
      const a = P(...ROADS[i]), b = P(...ROADS[(i + 1) % ROADS.length]);
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (!L) continue;
      const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
      let t = carry;
      for (; t < L; t += 1300) {
        const px = a[0] + ux * t, py = a[1] + uy * t;
        for (const s of [1, -1]) {
          const x = px - uy * s * 120, y = py + ux * s * 120;
          if (snow(x, y) && snow(px - uy * s * 60, py + ux * s * 60) && clear(x, y, 170)) {
            put("iceberg:lantern_post", [x, y], 0, { solid: LAMP });
            break;
          }
        }
      }
      carry = t - L;
    }
  }

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
    spawn: pt(428, 374),
    npcs: icebergNpcs(),
    // north out onto the icefield by the North Sea, south down the ice pass
    ...waysOut([gateWay(GN, "n", "north_icefield", 480, 420), gateWay(GS, "s", "ice_pass", 480, 420)]),
    closed: [],
    // names on the map window
    labels: [
      { ...pt(404, 319), text: "โถงใหญ่" },
      { ...pt(522, 340), text: "ลานกว้าง" },
      { ...pt(680, 356), text: "ท่าเรือ" },
      { ...pt(686, 455), text: "แม่น้ำ" },
      { ...pt(744, 352), text: "หอไฟสัญญาณ", kind: "small" },
      { ...pt(522, 392), text: "น้ำพุน้ำแข็ง", kind: "small" },
      { ...pt(371, 458), text: "โรงตีเหล็ก", kind: "small" },
      { ...pt(608, 430), text: "หมู่บ้านชาวประมง", kind: "small" },
      { ...pt(418, 400), text: "ทางแยกกลางเมือง", kind: "small" },
      { ...pt(225, 495), text: "ย่านบ้านซุง", kind: "small" },
      { x: GN[0] - 220, y: GN[1], text: "ประตูเหนือ · ทุ่งน้ำแข็ง", kind: "gate" },
      { x: GS[0] + 220, y: GS[1], text: "ประตูใต้ · ช่องเขาน้ำแข็ง", kind: "gate" },
    ],
  });
}

// ---- townsfolk, where the plan put its red dots ----
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
  const guard = (top: string, hairColor = "ink") => ({ gender: "male", hair: "", hairColor, eyes: "blue", top, bottom: "bottom_warrior_black" });
  return [
    { id: "ice_guard_n", ...at(382, 201), face: 180, name: "ทหารยามกุนนาร์", title: "ทหารยามประตูเหนือ", role: "talk", look: guard("top_warrior_navy", "gold"),
      lines: ["ออกประตูเหนือไปคือทุ่งน้ำแข็งริมทะเลเหนือ มอนสเตอร์แถวนั้นแข็งแกร่งนัก", "เหนือขึ้นไปคือทะเลเหนือ ลมหนาวพัดลงมาทั้งปี ใส่เสื้อขนสัตว์ให้หนาเข้าไว้"] },
    travelGuide("iceberg", P(436, 358), toward(436, 358, 428, 374)),
    { id: "ice_healer", ...at(393, 361), face: toward(393, 361, 417, 386), name: "แม่ชีซิกรุน", title: "นักบวช · รักษาฟรี", role: "heal",
      look: { gender: "female", hair: "twintail", hairColor: "silver", eyes: "teal", top: "top_priestess_white", bottom: "bottom_priestess_white" },
      lines: ["ขอให้ไฟในเตาผิงอบอุ่นหัวใจท่าน", "หายหนาวหายเหนื่อยแล้วนะ ระวังน้ำแข็งลื่นตอนเดินริมท่าเรือด้วย"] },
    { id: "ice_elder", ...at(359, 398), face: toward(359, 398, 417, 386), name: "ผู้เฒ่าทอร์วัลด์", title: "ผู้อาวุโสแห่งโถงใหญ่", role: "talk", look: guard("top_warrior_forest", "silver"),
      lines: ["โถงใหญ่นั่นสร้างมาตั้งแต่รุ่นทวด หัวมังกรบนหน้าจั่วคอยไล่วิญญาณพายุหิมะ", "คืนกลางฤดูหนาว ชาวไอซ์เบิร์กมาร่วมงานเลี้ยงในโถง ดื่มน้ำผึ้งหมัก เล่านิทานกันจนรุ่งเช้า", "ไกลลงไปทางใต้คือที่ราบภาคกลางกับเมืองหลวงอีเดน ส่วนตะวันออกคือทุ่งสเตปป์ของทรุนราดา"] },
    { id: "ice_shop", ...at(427, 435), face: toward(427, 435, 417, 386), name: "แอสทริด", title: "ร้านเครื่องมือ", role: "shop", sprite: "merchant",
      lines: ["เชือก ตะเกียง ยาแก้หนาว มีครบ เข้ามาดูก่อนได้"] },
    { id: "ice_smith", ...at(382, 445), face: toward(382, 445, 417, 386), name: "บียอร์น", title: "ช่างตีเหล็ก", role: "talk", look: guard("top_warrior", "auburn"),
      lines: ["เหล็กที่ตีในความหนาวแบบนี้แกร่งที่สุด", "ขวานหรือดาบบิ่นเมื่อไร เอามาให้ข้าดูได้ โรงตีเหล็กอยู่ข้างหลังข้านี่เอง"] },
    { id: "ice_fisher", ...at(606, 452), face: -90, name: "ไลฟ์", title: "ชาวประมง", role: "talk", look: guard("top_warrior_forest", "amber"),
      lines: ["ปลาแซลมอนว่ายขึ้นแม่น้ำมาเยอะช่วงน้ำแข็งเริ่มละลาย", "ระวังก้อนน้ำแข็งที่ลอยมาตามน้ำ ชนเรือทีเดียวรูรั่วเลย"] },
    { id: "ice_captain", ...at(607, 518), face: -90, name: "กัปตันฮาราลด์", title: "นายท่าเรือ", role: "talk", look: guard("top_warrior_navy", "crimson"),
      lines: ["แม่น้ำสายนี้ไหลลงทะเลเหนือ เรือประมงออกหาปลาทุกเช้ามืด", "เรือไปอีเดน โยเดีย และโอซากิ ยังไม่เปิดให้บริการ ไปหาเอลซ่าผู้นำทางที่ทางแยกกลางเมืองก่อนนะ"] },
    { id: "ice_netmender", ...at(606, 558), face: 90, name: "อิงกริด", title: "ช่างซ่อมแห", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "gold", eyes: "blue", top: "top_adventurer_teal", bottom: "bottom_adventurer_cocoa" },
      lines: ["แหผืนนี้ต้องซ่อมให้เสร็จก่อนเรือกลับเข้าท่า", "ที่ลานกว้างมีพ่อค้าขนสัตว์ ขนหมีขาวอุ่นที่สุดในแดนเหนือเลยนะ"] },
    { id: "ice_guard_s", ...at(444, 601), face: 0, name: "ทหารยามโอลาฟ", title: "ทหารยามประตูใต้", role: "talk", look: guard("top_warrior_navy"),
      lines: ["ออกประตูใต้ลงไปคือช่องเขาน้ำแข็ง ผ่านเชิงเขาหิมะลงไปถึงถนนหลวงของอีเดน", "คืนไหนพายุหิมะมา เราจะปิดประตูแล้วจุดไฟบนหอสัญญาณริมท่าเรือ"] },
  ];
}
