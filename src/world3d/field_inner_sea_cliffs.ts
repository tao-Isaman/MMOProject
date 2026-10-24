// ทุ่งผาริมทะเลใน (inner_sea_cliffs), monsters Lv 38-48: the grassland south of the west steppe
// where the land breaks off in granite cliffs over the inner sea, the sea along the west and the
// south. The way in from the steppe (the middle of the north edge) and the way in from the
// caravan road (the middle of the east edge) meet in a rolling meadow of steppe grass and grey
// boulders. From there:
//   - west, a ramp climbs the long clifftop (4.2 m) that runs the whole west coast: turf thick
//     with pink sea thrift, old drystone walls, cairns; at its south end it reaches out in a
//     headland, and on the headland's higher step (7.8 m) stands the little whitewashed lighthouse
//     with its keeper's cottage, looking out over the sea;
//   - south-west, the track runs down to the bay between the headland and the south cliffs, to a
//     beach of grey shingle under the cliffs where the fishing village stands: houses on tall
//     stilts out in the shallows, a jetty between them, racks of seaweed and fish drying, boats
//     drawn up on the shingle (the sea kraits crawl up out of the bay onto it);
//   - south, a ramp up onto the south cliffs (3.8 m) over the open sea, and on them a higher
//     knoll (7 m) where the gulls nest round an old beacon, sea stacks standing off the cliffs.
// The cliffs fall straight into the sea along the west and the south; the shingle runs round
// the bay under them. North the steppe goes on past the edge; east the grassland toward the
// caravan road.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: north (the middle, e 0.50) -> west_steppe, east (the middle, n 0.50) -> caravan_road

import { FieldBuilder } from "./field";
import { useKits } from "./town";
import type { Town } from "./town";
import { buildPaved } from "./paved";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";
import { KIT as EAST, smooth, band, inPoly, distTo, every, inland, faceDir, faceTo, bevel, seaSheet, COAST } from "./kits/eastcoast";
import type { XY, Poly } from "./kits/eastcoast";
import { KIT as STEPPE } from "./kits/steppe";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { KIT as WESTFARM } from "./kits/westfarm";

useKits(EAST, STEPPE, TRUNRADA, WESTFARM);

const R = 5500; // the walkable bounds, +-R
const A = 9000; // the ground's area, +-A

// ---- the coast: from the far north-west down the west coast, round the headland, into the bay
// and out of it, along the south coast to the far south-east (the land on its left) ----
const SHORE: XY[] = smooth([
  [9500, 4950], [7000, 4900], [5500, 4850], [4300, 4950], [3000, 4800], [1500, 4900], [0, 4800], [-1500, 4900], [-2800, 4800],
  [-3800, 4600], [-4500, 4100], [-4800, 3300],
  [-4300, 2800], [-3700, 2400], [-3100, 1950], [-2850, 1300], [-2850, 500], [-3100, -200], [-3700, -700], [-4300, -1100],
  [-4650, -1800], [-4800, -3200], [-4700, -4400], [-4800, -5500], [-4750, -7000], [-4800, -9500],
], 4);
const SEA: Poly = [...SHORE, [-9500, -9500], [-9500, 9500], [9500, 9500]];

// ---- the levels ----
// W1: the west clifftop (4.2 m), the length of the west coast and out to the headland; W2 the
// headland's higher step (7.8 m) with the lighthouse. S1: the south cliffs (3.8 m); S2 the gulls'
// knoll on them (7 m).
const W1: Poly = bevel([
  [A, 4650], [5500, 4550], [4300, 4650], [3000, 4500], [1500, 4600], [0, 4500], [-1500, 4600], [-2800, 4500], [-3700, 4300], [-4250, 3850], [-4450, 3250],
  [-4010, 3210], [-3410, 2810], [-2810, 2360], [-2350, 2300], [-1200, 2000], [0, 2200], [1300, 1900], [2600, 2150], [4000, 1900], [5600, 2200], [A, 2100],
]);
const W2: Poly = [[-1900, 3850], [-2700, 3900], [-3400, 3700], [-3750, 3450], [-3400, 3150], [-2800, 2950], [-2200, 3050], [-1800, 3350]];
const S1: Poly = bevel([
  [-3300, -900], [-3900, -1250], [-4350, -1750], [-4450, -2700], [-4500, -3800], [-4400, -5000], [-4500, -6500], [-4450, -A],
  [-2600, -A], [-2500, -6000], [-2200, -4700], [-2400, -3500], [-2100, -2400], [-2400, -1500],
]);
const S2: Poly = [[-3300, -3300], [-3900, -3200], [-4150, -3800], [-4050, -4600], [-3500, -4900], [-3000, -4500], [-2900, -3800]];
const RAMP_W1 = { top: [1950, 2025] as XY, bottom: [2160, 950] as XY, width: 460 };
const RAMP_W2 = { top: [-1850, 3600] as XY, bottom: [-850, 3600] as XY, width: 420 };
const RAMP_S1 = { top: [-2250, -1950] as XY, bottom: [-1200, -1600] as XY, width: 440 };
const RAMP_S2 = { top: [-3600, -3250] as XY, bottom: [-3440, -2260] as XY, width: 420 };

// ---- the tracks ----
const N_EXIT: XY = [5150, 0], E_EXIT: XY = [0, -5150];
const J: XY = [1500, -700]; // where the two ways in meet
const NORTH = smooth([[A + 200, 30], N_EXIT, [4400, -60], [3500, -350], [2500, -520], J]);
const EASTW = smooth([[-80, -A - 200], E_EXIT, [100, -4400], [400, -3400], [900, -2400], [1250, -1500], J]);
const TO_BAY = smooth([J, [700, -300], [-200, 200], [-1200, 500], [-1900, 750], [-2450, 900]]);
const UP_W = [...smooth([J, [1900, 0], [2130, 550], RAMP_W1.bottom]), RAMP_W1.top, ...smooth([[1900, 2350], [1500, 2800], [700, 3150], [-300, 3500], RAMP_W2.bottom]), RAMP_W2.top, ...smooth([[-2050, 3580], [-2300, 3520]])];
const UP_S = [...smooth([[-200, 200], [-500, -500], [-900, -1250], RAMP_S1.bottom]), RAMP_S1.top, ...smooth([[-2600, -2150], [-3100, -2250], RAMP_S2.bottom]), RAMP_S2.top, ...smooth([[-3650, -3600], [-3600, -3950]])];
const ALONG_W1 = smooth([[1900, 2350], [3000, 2900], [4200, 3100], [5000, 3500]]);

// ---- the bay's shingle: between the shore and a line well clear of the cliffs ----
const BEACH: Poly = [
  [-4500, 3000], [-4240, 2880], [-3640, 2480], [-3040, 2030], [-2580, 1870], [-2250, 1500], [-2150, 1000], [-2120, 500], [-2250, -100],
  [-2600, -450], [-3050, -590], [-3650, -940], [-4100, -1440], [-4700, -1300], [-5300, 800], [-5000, 2600],
];

const LIGHT: XY = [-2950, 3420];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(522, {
    hills: [
      { x: 3200, y: -2600, r: 1800, h: 160 }, { x: 600, y: -3700, r: 1300, h: 120 }, { x: 3900, y: 900, r: 1300, h: 120 },
      { x: -600, y: -1500, r: 900, h: 90 }, { x: 300, y: 1100, r: 1000, h: -90 }, { x: 4800, y: -4300, r: 1300, h: 140 },
      { x: -1300, y: -4300, r: 1200, h: 130 }, { x: 2400, y: 3300, r: 1300, h: 90 }, { x: -1000, y: 3300, r: 1000, h: 70 },
      // the land rolls on past the north and east edges
      { x: 7600, y: -2500, r: 2600, h: 260 }, { x: 7400, y: 1500, r: 2000, h: 200 }, { x: -1500, y: -7600, r: 2400, h: 240 }, { x: 2600, y: -7400, r: 2400, h: 220 },
    ],
    plateaus: [
      { poly: W1, h: 420, ramps: [RAMP_W1] },
      { poly: W2, h: 780, ramps: [RAMP_W2] },
      { poly: S1, h: 380, ramps: [RAMP_S1] },
      { poly: S2, h: 700, ramps: [RAMP_S2] },
    ],
    rock: COAST.cliff,
  });
  const { put, rnd } = f;

  // ---- the ground: steppe grass, tracks of bare earth, the sea cut out ----
  const roads = [band(NORTH, 480), band(EASTW, 480), band(TO_BAY, 440), band(UP_W, 400), band(UP_S, 400), band(ALONG_W1, 340)];
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], water: [SEA], base: "steppe", road: [0.86, 0.8, 0.68] });
  // the bay's grey shingle: a second ground a hair over the grass, cut away outside the beach
  const BOX: Poly = [[-5600, -1700], [-1900, -1700], [-1900, 3300], [-5600, 3300]];
  const areaOf = (p: Poly) => p.reduce((t, [x, y], i) => t + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0);
  const hole = Math.sign(areaOf(BOX)) === Math.sign(areaOf(BEACH)) ? [...BEACH].reverse() : BEACH;
  const shingle = buildPaved({
    area: { x0: -5500, y0: -1600, x1: -2000, y1: 3200 }, roads, plazas: [], base: "rock", track: true, road: [0.86, 0.8, 0.68],
    water: [[...BOX, BOX[0], ...hole, hole[0]], SEA], height: (x, y) => f.h(x, y) + 4, cell: 50,
  });
  shingle.mesh.renderOrder = 1;

  // ---- the sea: the water from a little under the shore out past the horizon, a band along the
  // water's edge that keeps everyone out of it ----
  const sea = seaSheet([...inland(SHORE, 200), [-30000, -9500], [-30000, 30000], [9500, 30000]]);
  f.blockBand(inland(SHORE.filter(([x, y]) => Math.abs(x) < R + 900 && Math.abs(y) < R + 900), -280), 520, { kind: "sea" });

  // ---- the ways out ----
  f.exit("west_steppe", N_EXIT, [4450, -40]);
  f.exit("caravan_road", E_EXIT, [60, -4450]);

  // ---- placing things clear of each other, the tracks and the cliffs ----
  const taken: [number, number, number][] = [];
  const onTrack = (x: number, y: number, m: number) => [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const free = (x: number, y: number, r: number) => !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r);
  const wet = (x: number, y: number, m = 0) => inPoly(SEA, x, y) || distTo(SHORE, x, y) < m;
  const fits = (x: number, y: number, r: number, m = r) => f.level(x, y, r) && !onTrack(x, y, m) && free(x, y, r) && !wet(x, y, r + 150);
  const place = (ref: string, at: XY, h: number, r: number, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    taken.push([at[0], at[1], r]);
  };
  const tryPlace = (ref: string, at: XY, h: number, r: number, o: Parameters<typeof put>[3] = {}) => {
    if (!fits(at[0], at[1], r)) return false;
    place(ref, at, h, r, o);
    return true;
  };
  const ring = (r: number, kind = "rock"): SolidSpec[] => [{ kind, x: 0, y: 0, r }];
  const inBox = (x: number, y: number, m = 0) => Math.abs(x) < R - m && Math.abs(y) < R - m;
  const scatter = (box: { x0: number; x1: number; y0: number; y1: number }, n: number, refs: string[], r: number, ok: (x: number, y: number) => boolean, o: { s?: [number, number]; solid?: number | "none"; tries?: number } = {}) => {
    for (let t = 0, made = 0; t < (o.tries ?? n * 30) && made < n; t++) {
      const x = box.x0 + rnd() * (box.x1 - box.x0), y = box.y0 + rnd() * (box.y1 - box.y0);
      if (!ok(x, y) || !fits(x, y, r)) continue;
      const s = o.s ? o.s[0] + rnd() * (o.s[1] - o.s[0]) : 1;
      place(refs[Math.floor(rnd() * refs.length)], [x, y], rnd() * 360, r * s, { s, ...(o.solid === "none" ? { solid: "none" } : o.solid ? { solid: ring(o.solid * s) } : {}) });
      made++;
    }
  };

  // ---- the north way: the steppe's cairn and banner, a signpost ----
  place("trunrada:cairn", [4900, 600], 20, 150, { solid: ring(90) });
  place("steppe:signpost", [4700, -620], faceDir(-1, 0), 60, { solid: ring(25, "post") });
  place("trunrada:banner_pole", [5000, -600], 180, 60, { solid: ring(20, "post") });
  taken.push([N_EXIT[0], N_EXIT[1], 600]);
  // the east way: a milestone of the caravan road
  place("eastcoast:milestone", [500, -4700], faceDir(0, 1), 70, { solid: ring(40, "post") });
  place("steppe:signpost", [-450, -4500], faceDir(0, 1), 60, { solid: ring(25, "post") });
  taken.push([E_EXIT[0], E_EXIT[1], 600]);
  // where they meet, a signpost and a cairn
  place("steppe:signpost", [1900, -1150], faceTo([1900, -1150], [700, -300]), 60, { solid: ring(25, "post") });
  place("trunrada:cairn", [1100, -1250], 0, 150, { solid: ring(90) });

  // ---- the lighthouse on the headland's step, the keeper's things round it ----
  const lightH = faceTo(LIGHT, RAMP_W2.top);
  place("eastcoast:lighthouse", LIGHT, lightH, 620, { solid: [{ kind: "tower", x: -130, y: 0, r: 280 }, { kind: "wall", x: 245, y: 0, w: 440, d: 450, rot: 0 }] });
  tryPlace("trunrada:drying_rack", [-2200, 3700], faceDir(1, 0), 150);
  tryPlace("eastcoast:sea_pinks", [-2400, 3150], 0, 120, { solid: "none" });
  tryPlace("eastcoast:sea_pinks", [-3300, 3650], 90, 120, { solid: "none" });
  tryPlace("common:crate", [-2350, 3000], 20, 60);
  tryPlace("trunrada:cairn", [-3550, 3200], 0, 120, { solid: ring(70) });

  // ---- the clifftop: sea thrift everywhere, boulders, old walls, cairns ----
  const onW1 = (x: number, y: number) => inPoly(W1, x, y) && !inPoly(W2, x, y);
  const wall = (a: XY, b: XY, broken: number[] = []) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 400), h = faceDir(-(b[1] - a[1]), b[0] - a[0]);
    for (let i = 0; i < n; i++) {
      const at: XY = [a[0] + ((b[0] - a[0]) * (i + 0.5)) / n, a[1] + ((b[1] - a[1]) * (i + 0.5)) / n];
      if (onTrack(at[0], at[1], 230)) continue;
      const br = broken.includes(i);
      put(br ? "westfarm:drystone_wall_broken" : "westfarm:drystone_wall", at, h, { solid: [{ kind: "wall", x: 0, y: 0, w: 60, d: 400, rot: 0 }] });
      taken.push([at[0], at[1], 220]);
    }
  };
  wall([4800, 2500], [4800, 4100], [1]);
  wall([3300, 2600], [3300, 4200], [0, 3]);
  wall([600, 2500], [500, 3900], [2]);
  for (const at of [[4300, 3700], [2200, 4000], [-200, 4100], [-1500, 3000]] as XY[]) tryPlace("trunrada:cairn", at, rnd() * 90, 140, { solid: ring(80) });
  for (const [ref, at, h] of [["steppe:boulder", [4000, 2700], 30], ["steppe:rock_cluster", [2600, 3900], 100], ["steppe:boulder_flat", [1300, 3600], 200], ["steppe:boulder", [-600, 2800], 60], ["eastcoast:shore_rocks", [-1700, 4200], 250], ["steppe:rock_spire", [5300, 3000], 20]] as [string, XY, number][])
    tryPlace(ref, at, h, 240, { solid: ring(170) });
  scatter({ x0: -3600, x1: R, y0: 2100, y1: 4700 }, 46, ["eastcoast:sea_pinks", "eastcoast:sea_pinks", "steppe:grass_tuft"], 110, onW1, { s: [0.7, 1.25], solid: "none", tries: 4000 });
  scatter({ x0: -3600, x1: R, y0: 2100, y1: 4700 }, 10, ["flora:PineSmall", "flora:Birch"], 200, (x, y) => onW1(x, y) && y < 3900 && !onTrack(x, y, 380), { s: [0.75, 1] });

  // ---- the bay: the stilt houses out in the shallows, the jetty, boats; racks and boats on the
  // shingle ----
  const bayFace = faceDir(1, 0); // the houses' porches and ladders toward the beach
  put("eastcoast:stilt_house", [-3650, 1650], bayFace + 25, { solid: "none", z: -10 });
  put("eastcoast:stilt_house", [-3700, 150], bayFace - 10, { solid: "none", z: -10 });
  put("eastcoast:stilt_house", [-4250, 900], bayFace + 5, { s: 0.9, solid: "none", z: -10 });
  for (let i = 0; i < 3; i++) put("eastcoast:fishing_jetty", [-3020 - i * 400, 880], 0, { solid: "none", z: -10 });
  put("eastcoast:rowboat", [-3500, 1100], 70, { solid: "none", z: -12 });
  put("eastcoast:rowboat", [-3350, 500], 120, { solid: "none", z: -12 });
  put("eastcoast:rowboat", [-4400, -300], 30, { s: 0.9, solid: "none", z: -12 });
  // on the shingle
  const onBeach = (x: number, y: number) => inPoly(BEACH, x, y) && !wet(x, y, 120);
  place("eastcoast:seaweed_rack", [-2500, 1600], faceDir(1, 0.3), 320, { solid: [{ kind: "rack", x: 0, y: 0, w: 120, d: 560, rot: 0 }] });
  place("eastcoast:seaweed_rack", [-2350, -150], faceDir(1, -0.3), 320, { solid: [{ kind: "rack", x: 0, y: 0, w: 120, d: 560, rot: 0 }] });
  place("trunrada:drying_rack", [-2400, 300], faceDir(1, 0), 150);
  place("eastcoast:rowboat", [-2700, 2000], 75, 200, { solid: [{ kind: "boat", x: 0, y: 0, w: 380, d: 140, rot: 0 }] });
  place("eastcoast:rowboat", [-2620, -450], 105, 200, { s: 0.9, solid: [{ kind: "boat", x: 0, y: 0, w: 380, d: 140, rot: 0 }] });
  place("trunrada:campfire", [-2250, 1150], 0, 150, { solid: ring(80, "fire") });
  for (const [x, y, h] of [[-2150, 1450, 10], [-2050, 650, 40], [-2600, 2250, 70]] as [number, number, number][]) tryPlace("common:crate", [x, y], h, 60);
  for (let i = 0; i < 9; i++) {
    const x = -2900 - rnd() * 1500, y = -1300 + rnd() * 4300;
    if (onBeach(x, y) && fits(x, y, 160)) place("eastcoast:shore_rocks", [x, y], rnd() * 360, 230, { s: 0.6 + rnd() * 0.4, solid: ring(150 * 0.8) });
  }
  // rocks where the water meets the foot of the cliffs, sea stacks out past them
  for (const { p, d } of every(SHORE, 420)) {
    if (Math.abs(p[0]) > R + 1500 || Math.abs(p[1]) > R + 1500 || inPoly(BEACH, p[0] + d[1] * 300, p[1] - d[0] * 300)) continue;
    if (rnd() < 0.3) continue;
    put("eastcoast:shore_rocks", [p[0] + d[1] * 120, p[1] - d[0] * 120], faceDir(d[1], -d[0]) + rnd() * 40, { s: 0.6 + rnd() * 0.5, solid: "none", z: -6 });
  }
  for (const [x, y, h, s] of [[-6200, 3800, 20, 1], [-5600, 1200, 140, 0.75], [-6500, -2600, 80, 1.1], [-5900, -4900, 200, 0.85], [-6800, 5600, 300, 0.9], [-1000, 6400, 60, 0.8], [3000, 6300, 250, 1]] as number[][])
    put("eastcoast:sea_stack", [x, y], h, { s, solid: "none", z: -14 });

  // ---- the south cliffs and the gulls' knoll: an old beacon, rocks, thrift ----
  place("steppe:beacon_tower", [-3550, -4250], faceTo([-3550, -4250], RAMP_S2.top), 300, { solid: ring(180, "tower") });
  for (const [at, h, s] of [[[-3900, -3600], 40, 0.9], [[-3200, -4700], 160, 0.8], [[-3850, -4600], 260, 0.7]] as [XY, number, number][]) tryPlace("eastcoast:shore_rocks", at, h, 240 * s, { s, solid: ring(150 * s) });
  scatter({ x0: -4500, x1: -2100, y0: -R, y1: -900 }, 22, ["eastcoast:sea_pinks", "steppe:grass_tuft", "eastcoast:sea_pinks"], 110, (x, y) => inPoly(S1, x, y), { s: [0.7, 1.2], solid: "none" });
  scatter({ x0: -4500, x1: -2100, y0: -R, y1: -900 }, 6, ["steppe:boulder", "steppe:boulder_flat"], 200, (x, y) => inPoly(S1, x, y) && !inPoly(S2, x, y), { s: [0.7, 1], solid: 140 });
  tryPlace("trunrada:cairn", [-2800, -2900], 30, 140, { solid: ring(80) });

  // ---- the meadow: boulders, wind-bent trees in clumps, scrub, grass ----
  const meadow = (x: number, y: number) => inBox(x, y, 250) && ![W1, S1].some((p) => inPoly(p, x, y)) && !inPoly(BEACH, x, y);
  for (const [ref, at, h] of [["steppe:rock_cluster", [3000, -3300], 20], ["steppe:boulder", [-300, -3000], 80], ["steppe:boulder_flat", [2800, 600], 140], ["steppe:fallen_menhir", [3600, -1300], 30], ["trunrada:standing_stone", [4200, -2400], 0], ["steppe:dead_tree", [-1300, -800], 50]] as [string, XY, number][])
    tryPlace(ref, at, h, 240, { solid: ring(150) });
  for (const [c, r, n] of [[[4100, -4300], 700, 5], [[3700, 1500], 500, 3], [[-800, -4500], 600, 4], [[2300, -3800], 500, 3], [[-1400, 1200], 400, 2], [[4900, -2000], 500, 3]] as [XY, number, number][])
    scatter({ x0: c[0] - r, x1: c[0] + r, y0: c[1] - r, y1: c[1] + r }, n, ["flora:Pine", "flora:PineSmall", "flora:Birch", "flora:PineSmall"], 190, (x, y) => meadow(x, y) && !onTrack(x, y, 400), { s: [0.8, 1.1] });
  // the shepherds of the coast: their fold and hut on the meadow north-east, the flock out on the
  // grass; a wayside shrine where the ways meet
  const FOLD: XY = [3300, -2900];
  place("westfarm:sheepfold", FOLD, faceTo(FOLD, [2500, -2000]), 520);
  tryPlace("westfarm:shepherd_hut", [4100, -2300], faceTo([4100, -2300], [3300, -1800]), 320);
  for (const [x, y, h] of [[2600, -3600, 30], [2300, -2700, 200]] as number[][]) tryPlace("westfarm:sheep_flock", [x, y], h, 260, { solid: "none" });
  tryPlace("westfarm:wayside_shrine", [1050, -150], faceTo([1050, -150], J), 120);
  // a fish cart left by the track down to the bay, horses from the steppe grazing the north end
  tryPlace("trunrada:cart", [-1500, 1100], faceDir(-1, 0.4), 220);
  for (const [x, y, h] of [[4600, 1200, 30], [4300, 1500, 200], [4800, 1600, 120]] as number[][]) tryPlace("trunrada:horse_grazing", [x, y], h, 150, { solid: "none" });
  scatter({ x0: -R, x1: R, y0: -R, y1: R }, 12, ["steppe:boulder", "steppe:boulder_flat", "steppe:rock_cluster"], 200, meadow, { s: [0.6, 1], solid: 140 });
  scatter({ x0: -R, x1: R, y0: -R, y1: R }, 30, ["steppe:scrub", "eastcoast:sea_pinks"], 100, meadow, { s: [0.7, 1.2], solid: "none" });
  scatter({ x0: -R, x1: R, y0: -R, y1: R }, 220, ["steppe:grass_tuft"], 60, (x, y) => meadow(x, y) || onW1(x, y) || inPoly(S1, x, y), { s: [0.7, 1.4], solid: "none", tries: 9000 });

  // ---- past the edges: the steppe rolling on north, the grassland east (trees and boulders,
  // nobody gets there) ----
  const outside = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || ground.kind(x, y) !== 0 || onTrack(x, y, 300) || wet(x, y, 350);
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["Pine", "PineSmall", "Birch", "PineSmall", "Pine"], outside, { count: 150, spacing: 600, tries: 6000 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["boulder", "boulder_flat", "rock_cluster", "scrub", "scrub", "grass_tuft", "grass_tuft"], outside, { count: 160, spacing: 420, tries: 6000, kit: "steppe" });

  // ---- monsters: the meadow, the clifftops, the shingle, the knolls (not on the village's
  // doorstep or the lighthouse's) ----
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, {
    step: 760, max: 52,
    keepOut: (x, y) => Math.hypot(x - LIGHT[0], y - LIGHT[1]) < 700 || Math.hypot(x + 2350, y - 1000) < 650 || Math.hypot(x - 3500, y + 2700) < 900,
  });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "isc_fisher", x: -2150, y: 900, face: 180, name: "ลุงปลาเค็ม", title: "ชาวประมงหมู่บ้านเสาสูง", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_warrior_navy", bottom: "bottom_warrior_cocoa" },
      lines: [
        "บ้านพวกเราปักเสาลงไปในทะเล น้ำขึ้นแค่ไหนก็ไม่ท่วม แต่ลมทะเลในหน้าหนาวนี่เย็นถึงกระดูกเลย",
        "ระวังงูสมิงทะเลบนหาดหินนะ มันเลื้อยขึ้นมาจากอ่าวตอนน้ำลง ถูกมันกัดทีเดียวพิษขึ้นทั้งตัว",
        "สาหร่ายบนราวนั่นตากไว้ส่งไปขายถึงทรุนราดา พวกเผ่าบนทุ่งชอบเอาไปต้มกับเนื้อแกะ",
      ],
    },
    {
      id: "isc_keeper", x: -2350, y: 3420, face: -90, name: "ป้ามาริน", title: "ผู้ดูแลประภาคาร", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "silver", eyes: "teal", top: "top_adventurer_teal", bottom: "bottom_adventurer_sand" },
      lines: [
        "ฉันจุดไฟบนประภาคารนี้ทุกคืนมาสามสิบปีแล้ว เรือประมงจะได้กลับเข้าอ่าวได้ไม่หลง",
        "นกนางนวลยักษ์บนผาใต้มันชอบโฉบมาแย่งปลาจากเรือ ตัวใหญ่กว่าคนเสียอีก",
        "จากบนนี้มองเห็นทะเลในสุดตา อีกฝั่งโน้นคืออีเดน เมืองหลวงของพวกเรา",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery: [sea, shingle.mesh],
    sky: "#8aa6a8",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && !inPoly(BEACH, x, y), density: 0.16 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 4300, y: -60 },
    npcs,
    labels: [
      { x: N_EXIT[0] - 250, y: N_EXIT[1], text: "ทางไปสเตปป์ตะวันตก", kind: "gate" },
      { x: E_EXIT[0], y: E_EXIT[1] + 250, text: "ทางไปถนนคาราวานตะวันออก", kind: "gate" },
      { x: 2600, y: 3300, text: "ทุ่งดอกไม้ทะเลบนผา" },
      { x: LIGHT[0] + 700, y: LIGHT[1], text: "ประภาคารเล็ก" },
      { x: -3000, y: 900, text: "หมู่บ้านชาวประมงบ้านเสาสูง" },
      { x: -2500, y: 2300, text: "หาดหินใต้ผา", kind: "small" },
      { x: -3300, y: -4000, text: "เนินนางนวล" },
      { x: -2900, y: -2300, text: "ผาริมทะเลใต้", kind: "small" },
      { x: 2200, y: -1800, text: "ทุ่งหญ้าริมผา", kind: "small" },
      { x: 3300, y: -2300, text: "คอกแกะริมทุ่ง", kind: "small" },
    ],
  });
}
