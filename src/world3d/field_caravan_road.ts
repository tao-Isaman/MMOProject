// ถนนคาราวานตะวันออก (caravan_road), monsters Lv 52-62: the old caravan road between the clan
// town and the fortress, across the grassland south of Trunrada and west of Kradia. The road
// comes down from Trunrada's south gate (the north edge, a little west of its middle) to a
// crossroads where the old coaching inn stands in ruins, a caravan camped in its yard; from there
// it runs on west to the inner sea cliffs, south to the golden maples, and east to Kradia's west
// gate: over the stream on the old toll bridge and between the rocks into the quarry country.
//   - The stream rises in a pool under the quarry's cliffs in the north-east and runs west
//     under the bridge and south out of the field toward the maple woods.
//   - The quarry (4.8 m, its upper bench 8.2 m) fills the north-east: cut faces, stacks of cut
//     stone, the treadwheel crane, carts; a ramp up from the north road and another to the bench.
//   - South-west a grassy ridge (3.6 m) with the stump of an old watchtower over the road.
//   - Milestones along every road, a wagon broken down on the way from Trunrada.
// North the steppe rolls on to Trunrada's palisade; east the rock and the pines toward Kradia;
// south the first maples; west the grassland of the sea cliffs.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: north (e 0.39, Trunrada's new south gate) -> trunrada, east (n 0.48, Kradia's west
//   gate) -> kradia, south (the middle) -> golden_maples, west (the middle) -> inner_sea_cliffs

import { FieldBuilder } from "./field";
import { useKits } from "./town";
import type { Town } from "./town";
import { buildPaved } from "./paved";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";
import { KIT as EAST, smooth, band, inPoly, distTo, nearestOn, every, blob, inland, faceDir, faceTo, bevel, seaSheet } from "./kits/eastcoast";
import type { XY, Poly } from "./kits/eastcoast";
import { KIT as STEPPE } from "./kits/steppe";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { KIT as FRONTIER } from "./kits/frontier";
import { KIT as PLAINS } from "./kits/plains";

useKits(EAST, STEPPE, TRUNRADA, FRONTIER, PLAINS);

const R = 5500; // the walkable bounds, +-R
const A = 9000; // the ground's area, +-A

// ---- the ways out, where the maps next door have theirs ----
const N_EXIT: XY = [5150, 1170], E_EXIT: XY = [-190, -5150], S_EXIT: XY = [-5150, 0], W_EXIT: XY = [0, 5150];
const C: XY = [1500, 900]; // the crossroads before the inn

// ---- the levels ----
// Q1 the quarry (4.8 m) and Q2 its upper bench (8.2 m); RIDGE the grassy ridge in the south-west
const Q1: Poly = bevel([[5200, -1700], [4400, -1500], [3600, -1900], [3100, -2700], [3200, -3600], [2600, -4400], [2300, -5300], [2400, -A], [5300, -A], [5100, -6000], [5300, -4000], [5000, -2600]]);
const Q2: Poly = [[4600, -3100], [3900, -3300], [3700, -4000], [3900, -4700], [4700, -4900], [5100, -4000]];
const RIDGE: Poly = bevel([[-1300, 1700], [-1000, 3000], [-1600, 4300], [-2600, 4700], [-3800, 4500], [-4500, 3600], [-4300, 2300], [-3300, 1500], [-2200, 1300]]);
const RAMP_Q1 = { top: [4000, -1700] as XY, bottom: [3415, -543] as XY, width: 460 };
const RAMP_Q2 = { top: [4250, -3200] as XY, bottom: [3980, -2240] as XY, width: 420 };
const RAMP_RIDGE = { top: [-1750, 1500] as XY, bottom: [-1300, 500] as XY, width: 440 };
// the quarry floor's bare rock, a little in from its edges
const Q_FLOOR: Poly = [[4900, -2000], [4300, -1850], [3700, -2150], [3450, -2750], [3500, -3600], [2950, -4400], [2700, -5300], [2750, -A], [5000, -A], [4800, -6000], [5000, -4000], [4750, -2600]];

// ---- the stream: from its pool under the quarry west under the bridge and south away ----
const POOL: XY = [2350, -3100];
const STREAM: XY[] = smooth([POOL, [1500, -2700], [700, -2450], [100, -2300], [-800, -2250], [-1900, -2050], [-3000, -2150], [-4100, -2300], [-5200, -2250], [-A - 300, -2250]], 5);
const SW = 520;
const BRIDGE: XY = [100, -2300];
// the bridge's own X: across the stream there (toward Kradia), and a point in its frame
const ACROSS: XY = (() => {
  const d = nearestOn(STREAM, BRIDGE[0], BRIDGE[1]).dir;
  return [-d[1], d[0]];
})();
const onBridge = (lx: number, ly: number): XY => [BRIDGE[0] + ACROSS[0] * lx - ACROSS[1] * ly, BRIDGE[1] + ACROSS[1] * lx + ACROSS[0] * ly];

// ---- the roads ----
const NROAD = smooth([[A + 200, 1180], N_EXIT, [4400, 1120], [3600, 1050], [2600, 950], C]);
const WROAD = smooth([C, [1100, 1700], [700, 2800], [300, 3900], [60, 4500], W_EXIT, [0, A + 200]]);
const EROAD = [...smooth([C, [1200, 0], [700, -1000], onBridge(-900, 0)]), BRIDGE, ...smooth([onBridge(900, 0), [-150, -4200], E_EXIT, [-200, -A - 200]])];
const SROAD = smooth([C, [700, 500], [-400, 350], [-1600, 150], [-2900, -50], [-4100, 0], S_EXIT, [-A - 200, 0]]);
const TO_QUARRY = [...smooth([[3600, 1050], [3500, 300], RAMP_Q1.bottom]), RAMP_Q1.top, RAMP_Q2.bottom, RAMP_Q2.top, ...smooth([[4350, -3600], [4300, -4000]])];
const TO_RIDGE = [...smooth([[-1600, 150], RAMP_RIDGE.bottom]), RAMP_RIDGE.top, ...smooth([[-2300, 2300], [-2900, 3100], [-3300, 3500]])];
const TO_POOL = smooth([[800, -1250], [1500, -1900], [1900, -2400]]);

// ---- the sea's corner: where the inner sea cliffs' south coast and the golden maples' west coast
// meet past the south-west corner, a cove of the sea comes in (the land on the shore's left) ----
const COVE_SHORE: XY[] = smooth([[-4750, A + 300], [-4800, 6300], [-5000, 5500], [-5400, 5000], [-6100, 4750], [-A - 300, 4700]], 4);
const COVE: Poly = [...COVE_SHORE, [-A - 300, A + 300]];

// ---- the ground's colour toward the neighbours: the golden maples' autumn floor across the south
// (round the foot of the ridge), Kradia's bare rock along the east; ragged edges, a few patches
// of each out past them and of the steppe left within ----
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// a ragged line: points along a base line pushed out along `normal` by a few waves together
const ragged = (a: number, b: number, n: number, at: (t: number) => XY, amp: (t: number) => number, normal: XY, seed: number): XY[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = a + ((b - a) * i) / n, k = amp(t) * (0.5 * Math.sin(t / 900 + seed) + 0.3 * Math.sin(t / 340 + seed * 2.1) + 0.2 * Math.sin(t / 130 + seed * 3.7)), p = at(t);
    return [p[0] + normal[0] * k, p[1] + normal[1] * k];
  });
const dip = (y: number) => smoothstep(300, 1300, y) * (1 - smoothstep(5300, 6300, y)); // where the ridge's foot comes south
const SOUTH_BAND: Poly = [...ragged(-A - 300, A + 300, 180, (y) => [-3500 - 1550 * dip(y), y], (y) => 440 - 220 * dip(y), [1, 0], 3), [-A - 300, A + 300], [-A - 300, -A - 300]];
const SOUTH_PATCHES: Poly[] = [blob([-2500, -3600], 330, 420, 1, 16, 0.12), blob([-2550, 300], 300, 380, 2, 16, 0.12), blob([-2450, -5000], 280, 340, 3, 16, 0.12), blob([-3000, 6000], 280, 380, 4, 16, 0.12)];
const SOUTH_HOLES: Poly[] = [blob([-4400, -3100], 380, 300, 5, 16, 0.12), blob([-4700, 900], 300, 260, 6, 16, 0.12)];
const EAST_BAND: Poly = [
  ...ragged(-A - 300, 1600, 130, (x) => [x, -4500], () => 420, [0, 1], 7),
  ...ragged(-4500, -A - 300, 40, (y) => [1600, y], () => 240, [1, 0], 9).slice(1),
  [-A - 300, -A - 300],
];
const EAST_PATCHES: Poly[] = [blob([-1500, -3650], 300, 260, 8, 16, 0.12), blob([900, -3700], 260, 300, 9, 16, 0.12), blob([-3000, -3650], 250, 280, 10, 16, 0.12)];

const INN: XY = [2000, 2200];
const TOWER: XY = [-3300, 3700];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(523, {
    hills: [
      { x: 3800, y: 3200, r: 1500, h: 150 }, { x: 4300, y: 4500, r: 1200, h: 110 }, { x: -1600, y: -4300, r: 1100, h: 120 },
      { x: -3700, y: -4100, r: 1300, h: 150 }, { x: -4300, y: -800, r: 900, h: 80 }, { x: 600, y: 3300, r: 900, h: -70 },
      { x: 2600, y: -500, r: 800, h: 70 }, { x: -800, y: 1600, r: 700, h: 60 }, { x: 1100, y: -4300, r: 1000, h: 110 },
      // the land rolling on past the edges
      { x: 7600, y: 2000, r: 2600, h: 200 }, { x: -7600, y: 2500, r: 2600, h: 220 }, { x: 1000, y: 7600, r: 2400, h: 180 },
    ],
    plateaus: [
      { poly: Q1, h: 480, ramps: [RAMP_Q1] },
      { poly: Q2, h: 820, ramps: [RAMP_Q2] },
      { poly: RIDGE, h: 360, ramps: [RAMP_RIDGE] },
    ],
    rock: "CliffRock",
  });
  const { put, rnd } = f;

  // ---- the ground: steppe grass, the roads, the stream and its pool ----
  const POOLP = blob(POOL, 520, 420, 5, 20);
  const roads = [band(NROAD, 520), band(WROAD, 480), band(EROAD, 500), band(SROAD, 480), band(TO_QUARRY, 400), band(TO_RIDGE, 380), band(TO_POOL, 340)];
  const water = [band(STREAM, SW), POOLP, COVE];
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], water, base: "steppe", road: [0.82, 0.74, 0.6] });
  // the quarry floor's bare rock: a second ground a hair over the grass, cut away outside it
  const QB: Poly = [[2100, -1200], [5600, -1200], [5600, -A], [2100, -A]];
  const areaOf = (p: Poly) => p.reduce((t, [x, y], i) => t + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0);
  const hole = Math.sign(areaOf(QB)) === Math.sign(areaOf(Q_FLOOR)) ? [...Q_FLOOR].reverse() : Q_FLOOR;
  const rockFloor = buildPaved({
    area: { x0: 2200, y0: -A, x1: 5500, y1: -1300 }, roads, plazas: [], base: "rock", track: true, road: [0.82, 0.74, 0.6],
    // (and none up the bench's rock face or its ramp, where it would not lie on the ground)
    water: [[...QB, QB[0], ...hole, hole[0]], blob([4400, -4000], 1050, 1250, 3, 24, 0.04), band([RAMP_Q2.bottom, RAMP_Q2.top], 900)],
    height: (x, y) => f.h(x, y) + 4, cell: 50,
  });
  rockFloor.mesh.renderOrder = 1;
  // the bands toward the neighbours: the same ground's roads in each band's own colours
  // (a layer kept only inside `keeps`: the box with each of them cut out of what is thrown away)
  const bandLayer = (keeps: Poly[], box: Poly, base: "moss" | "rock", tint: string | undefined, road: [number, number, number], holes: Poly[]) => {
    const outside: Poly = [...box, box[0]], turn = -Math.sign(areaOf(box));
    for (const k of keeps) {
      const h = Math.sign(areaOf(k)) === turn ? k : [...k].reverse();
      outside.push(...h, h[0], box[0]);
    }
    const xs = box.map((p) => p[0]), ys = box.map((p) => p[1]);
    const layer = buildPaved({
      area: { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }, roads, plazas: [], base, tint, track: true, road,
      water: [outside, ...water, ...holes], height: (x, y) => f.h(x, y) + 4, cell: 80,
    });
    layer.mesh.renderOrder = 1;
    return layer.mesh;
  };
  const autumnFloor = bandLayer([SOUTH_BAND, ...SOUTH_PATCHES], [[-A, -A], [-2000, -A], [-2000, A], [-A, A]], "moss", "#d9b48c", [0.76, 0.69, 0.6], SOUTH_HOLES);
  const rockLand = bandLayer([EAST_BAND, ...EAST_PATCHES], [[-A, -A], [2000, -A], [2000, -3200], [-A, -3200]], "rock", undefined, [0.8, 0.74, 0.64], [SOUTH_BAND, ...SOUTH_PATCHES]);
  // the water, and solids along the banks (open where the bridge crosses)
  const streamSheet = f.waterSheet({ x0: -A - 400, x1: 3000, y0: -3700, y1: -1600 }, -14, "WaterSea");
  f.blockBand(STREAM, SW + 60, { gaps: [BRIDGE], gapR: 380, step: 220 });
  f.blockDisc(POOL, 380);
  // the cove: its shore closed, the sea out past it
  const coveSea = seaSheet([...inland(COVE_SHORE, 200), [-30000, 4700], [-30000, 30000], [-4750, 30000]]);
  f.blockBand(inland(COVE_SHORE.filter(([x, y]) => x > -R - 900 && y < R + 900), -280), 520, { kind: "sea" });
  for (const [x, y] of POOLP) f.blockDisc([x + (POOL[0] - x) * 0.18, y + (POOL[1] - y) * 0.18], 140);

  // ---- the ways out ----
  f.exit("trunrada", N_EXIT, [4450, 1130]);
  f.exit("kradia", E_EXIT, [-170, -4450]);
  f.exit("golden_maples", S_EXIT, [-4450, 20]);
  f.exit("inner_sea_cliffs", W_EXIT, [40, 4450]);

  // ---- placing things clear of each other, the roads and the cliffs ----
  const taken: [number, number, number][] = [];
  const onTrack = (x: number, y: number, m: number) => [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const free = (x: number, y: number, r: number) => !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r);
  const wet = (x: number, y: number, m: number) => distTo(STREAM, x, y) < SW / 2 + m || Math.hypot(x - POOL[0], y - POOL[1]) < 560 + m || inPoly(COVE, x, y) || distTo(COVE_SHORE, x, y) < m;
  const fits = (x: number, y: number, r: number, m = r) => f.level(x, y, r) && !onTrack(x, y, m) && free(x, y, r) && !wet(x, y, r + 60);
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
  // the heading along a road at a point (its front across the road)
  const roadside = (road: XY[], at: XY) => {
    const n = nearestOn(road, at[0], at[1]);
    return faceDir(n.q[0] - at[0], n.q[1] - at[1]);
  };
  for (const ex of [N_EXIT, E_EXIT, S_EXIT, W_EXIT]) taken.push([ex[0], ex[1], 600]);

  // ---- the ways out: Trunrada's banners and cairn to the north, Kradia's barricades and lamp to
  // the east, signposts south and west ----
  place("trunrada:banner_pole", [5000, 600], 180, 60, { solid: ring(20, "post") });
  place("trunrada:banner_pole", [5000, 1750], 180, 60, { solid: ring(20, "post") });
  place("trunrada:cairn", [4600, 1850], 30, 150, { solid: ring(90) });
  place("steppe:signpost", [4500, 520], faceDir(-1, 0), 60, { solid: ring(25, "post") });
  place("frontier:signpost", [-650, -4600], faceDir(0, 1), 60, { solid: ring(25, "post") });
  place("frontier:signpost", [-4550, 550], faceDir(1, 0), 60, { solid: ring(25, "post") });
  place("steppe:signpost", [-550, 4550], faceDir(0, -1), 60, { solid: ring(25, "post") });

  // ---- the toll bridge over the stream, its keeper ----
  const bridgeH = (Math.atan2(ACROSS[1], ACROSS[0]) * 180) / Math.PI; // its own X across the stream, along the road
  place("eastcoast:toll_bridge", BRIDGE, bridgeH, 700, {
    solid: [
      { kind: "rail", x: 0, y: -222, w: 1000, d: 40, rot: 0 }, { kind: "rail", x: 0, y: 222, w: 1000, d: 40, rot: 0 },
      { kind: "wall", x: 710, y: -390, w: 280, d: 280, rot: 0 }, { kind: "post", x: 620, y: -250, r: 24 }, { kind: "post", x: 570, y: 270, r: 14 },
    ],
  });
  taken.push([BRIDGE[0], BRIDGE[1], 900]);

  // ---- the ruined inn at the crossroads, the caravan camped in its yard ----
  const innH = faceTo(INN, [INN[0] - 300, INN[1] - 1000]);
  place("eastcoast:ruined_inn", INN, innH, 900, { solid: [{ kind: "building", x: 0, y: -50, w: 860, d: 880, rot: 0 }, { kind: "wall", x: 0, y: -660, w: 620, d: 300, rot: 0 }] });
  const yard: XY = [2200, 1250];
  place("trunrada:campfire", yard, 0, 160, { solid: ring(90, "fire") });
  place("trunrada:yurt_small", [2950, 1650], faceTo([2950, 1650], yard), 380);
  place("trunrada:cart", [1500, 1550], faceDir(-0.3, -1), 220);
  place("trunrada:hitching_post", [2900, 2900], faceDir(-1, 0), 120);
  for (const [x, y, h] of [[3050, 2700, 200], [3080, 3100, 170]] as number[][]) put("trunrada:horse", [x, y], h, { solid: "none" });
  for (const [x, y, h] of [[2500, 1650, 20], [2650, 1700, 70], [1700, 1250, 0]] as number[][]) tryPlace("common:crate", [x, y], h, 60);
  tryPlace("trunrada:drying_rack", [2800, 1100], faceDir(-1, 0), 150);
  tryPlace("trunrada:haystack", [3000, 2300], 30, 180);

  // ---- milestones along the roads, the broken wagon, an old cart wreck ----
  const mile = (road: XY[], near: XY, side: 1 | -1) => {
    const n = nearestOn(road, near[0], near[1]), at: XY = [n.q[0] - n.dir[1] * side * 340, n.q[1] + n.dir[0] * side * 340];
    tryPlace("eastcoast:milestone", at, roadside(road, at), 80, { solid: ring(40, "post") });
  };
  mile(NROAD, [3800, 1050], 1);
  mile(EROAD, [800, -900], -1);
  mile(EROAD, [-150, -3800], 1);
  mile(WROAD, [500, 3300], 1);
  mile(SROAD, [-2600, 0], -1);
  place("eastcoast:broken_wagon", [3400, 1950], faceDir(0.2, 1), 320, { solid: [{ kind: "wagon", x: 0, y: 0, w: 380, d: 180, rot: 0 }] });
  tryPlace("frontier:fallen_log", [-2300, -900], 70, 300, { solid: [{ kind: "log", x: 0, y: 0, w: 110, d: 560, rot: 0 }] });

  // ---- the quarry: the crane at the bench's face, stone cut and stacked, rubble, a cart ----
  place("eastcoast:quarry_crane", [3500, -3200], faceDir(-1, 0.2), 340, { solid: [{ kind: "crane", x: 50, y: 0, w: 400, d: 340, rot: 0 }, { kind: "post", x: -300, y: 0, r: 60 }] });
  for (const [at, h] of [[[3100, -3900], 20], [[3900, -2500], 70], [[4700, -2400], 160], [[3350, -4600], 110]] as [XY, number][]) tryPlace("eastcoast:cut_stone_pile", at, h, 260, { solid: [{ kind: "stone", x: 0, y: 30, w: 380, d: 340, rot: 0 }] });
  tryPlace("trunrada:cart", [4200, -2700], 60, 220);
  for (const at of [[4400, -4200], [4700, -4500], [4200, -3700]] as XY[]) tryPlace("eastcoast:cut_stone_pile", at, rnd() * 360, 240, { s: 0.75, solid: [{ kind: "stone", x: 0, y: 30, w: 300, d: 260, rot: 0 }] });
  scatter({ x0: 2300, x1: R, y0: -R, y1: -1500 }, 14, ["steppe:rock_cluster", "steppe:boulder_flat", "frontier:rubble_pile", "steppe:boulder"], 180, (x, y) => inPoly(Q1, x, y), { s: [0.6, 1], solid: 120 });

  // ---- the pool where the stream rises: rocks and reeds round it ----
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2, at: XY = [POOL[0] + Math.cos(a) * 640, POOL[1] + Math.sin(a) * 540];
    if (!onTrack(at[0], at[1], 120) && f.level(at[0], at[1], 80)) put(k % 3 ? "plains:reeds" : "plains:flat_rock", at, rnd() * 360, { s: 0.7 + rnd() * 0.3, solid: "none" });
  }
  // reeds, flat rocks and birches along the stream's banks
  for (const { p, d } of every(STREAM, 360, 200)) {
    if (!inBox(p[0], p[1], 200) || Math.hypot(p[0] - BRIDGE[0], p[1] - BRIDGE[1]) < 900) continue;
    for (const s of [-1, 1]) {
      if (rnd() < 0.4) continue;
      const o = SW / 2 + 60 + rnd() * 160, at: XY = [p[0] - d[1] * s * o, p[1] + d[0] * s * o];
      if (onTrack(at[0], at[1], 200) || !f.level(at[0], at[1], 90) || !free(at[0], at[1], 80)) continue;
      const k = rnd();
      if (k < 0.5) place("plains:reeds", at, rnd() * 360, 70, { solid: "none" });
      else if (k < 0.7) place("plains:flat_rock", at, rnd() * 360, 120, { s: 0.6 + rnd() * 0.3, solid: "none" });
      else if (k < 0.85 && !wet(at[0], at[1], 120)) place("flora:Birch", at, rnd() * 360, 160, { s: 0.8 + rnd() * 0.3 });
      else place("plains:tall_grass", at, rnd() * 360, 70, { solid: "none" });
    }
  }

  // rocks along the cove's shore
  for (const { p, d } of every(COVE_SHORE, 380)) {
    if (p[0] > -4400 || p[1] < 3500 || p[0] < -A || p[1] > A) continue;
    put("eastcoast:shore_rocks", [p[0] + d[1] * 120, p[1] - d[0] * 120], faceDir(d[1], -d[0]) + rnd() * 40, { s: 0.6 + rnd() * 0.4, solid: "none", z: -6 });
  }

  // ---- the ridge: the stump of the old watchtower, stones, wind-bent pines ----
  place("frontier:ruined_tower", TOWER, faceTo(TOWER, RAMP_RIDGE.top), 420, { solid: ring(260, "tower") });
  for (const [ref, at, h] of [["steppe:rock_cluster", [-2400, 4200], 30], ["steppe:boulder", [-4000, 2600], 80], ["frontier:rubble_pile", [-3700, 4100], 110], ["trunrada:standing_stone", [-2000, 2600], 10]] as [string, XY, number][])
    tryPlace(ref, at, h, 220, { solid: ring(140) });
  scatter({ x0: -4600, x1: -1000, y0: 1300, y1: 4800 }, 9, ["flora:Pine", "flora:PineSmall", "flora:Birch"], 200, (x, y) => inPoly(RIDGE, x, y) && !onTrack(x, y, 380), { s: [0.8, 1.1] });

  // ---- the land: steppe in the north, the first maples in the south, rock and pines toward
  // Kradia in the east; boulders and grass everywhere ----
  const low = (x: number, y: number) => inBox(x, y, 250) && ![Q1, RIDGE].some((p) => inPoly(p, x, y));
  for (const [ref, at, h] of [["trunrada:standing_stone", [4600, 3200], 20], ["steppe:stone_idol", [3900, 300], 120], ["steppe:fallen_menhir", [-600, 2500], 60], ["trunrada:cairn", [1200, 4300], 0], ["steppe:dead_tree", [-1200, -3500], 30], ["steppe:bones", [1300, -3600], 100]] as [string, XY, number][])
    tryPlace(ref, at, h, 220, { solid: ref.endsWith("bones") ? "none" : ring(120) });
  // copses: birch and pine in the north, golden maples coming in from the south, pine and autumn
  // trees toward Kradia
  for (const [c, r, n, kinds] of [
    [[4200, 3800], 700, 5, ["flora:Birch", "flora:Birch", "flora:PineSmall"]], [[2700, 4300], 500, 3, ["flora:Birch", "flora:Pine"]], [[4700, -800], 500, 3, ["flora:Birch", "flora:PineSmall"]],
    [[-3200, -1000], 700, 5, ["eastcoast:golden_maple", "eastcoast:golden_bush", "flora:Birch"]], [[-4500, 1200], 600, 4, ["eastcoast:golden_maple", "eastcoast:golden_bush"]],
    [[-4400, -3600], 800, 6, ["eastcoast:golden_maple", "flora:AutumnTree", "eastcoast:golden_bush"]], [[-2300, -4300], 700, 5, ["flora:Pine", "flora:AutumnTree", "eastcoast:golden_maple"]],
    [[600, -3600], 700, 5, ["flora:Pine", "flora:AutumnTree", "flora:PineSmall"]], [[1500, -4700], 500, 4, ["flora:Pine", "flora:PineSmall"]], [[-1000, 3700], 500, 3, ["flora:Birch", "flora:PineSmall"]],
  ] as [XY, number, number, string[]][])
    scatter({ x0: c[0] - r, x1: c[0] + r, y0: c[1] - r, y1: c[1] + r }, n, kinds, 200, (x, y) => low(x, y) && !onTrack(x, y, 420), { s: [0.75, 1.05], solid: 45 });
  scatter({ x0: -R, x1: R, y0: -R, y1: R }, 14, ["steppe:boulder", "steppe:boulder_flat", "steppe:rock_cluster"], 200, low, { s: [0.6, 1], solid: 140 });
  // the bare rock toward Kradia: flat slabs, rubble and stones lying on it
  const onRock = (x: number, y: number) => (inPoly(EAST_BAND, x, y) || EAST_PATCHES.some((p) => inPoly(p, x, y))) && !inPoly(SOUTH_BAND, x, y);
  scatter({ x0: -R, x1: 1800, y0: -R, y1: -3300 }, 16, ["steppe:boulder_flat", "frontier:rubble_pile", "frontier:flat_rocks", "steppe:rock_cluster", "frontier:flat_rocks"], 170, (x, y) => low(x, y) && onRock(x, y), { s: [0.55, 0.95], solid: 110 });
  scatter({ x0: -R, x1: 0, y0: -R, y1: R }, 10, ["eastcoast:maple_litter"], 180, low, { solid: "none" });
  scatter({ x0: -R, x1: R, y0: -R, y1: R }, 34, ["steppe:scrub", "frontier:grass_tuft"], 100, low, { s: [0.7, 1.2], solid: "none" });
  scatter({ x0: -R, x1: R, y0: -R, y1: R }, 230, ["steppe:grass_tuft"], 60, (x, y) => inBox(x, y, 200) && !inPoly(Q2, x, y), { s: [0.7, 1.4], solid: "none", tries: 9000 });

  // ---- past the edges: birch and pine on the steppe north, maples south, pines and autumn trees
  // on the rock east; grass and boulders west ----
  const outside = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || onTrack(x, y, 320) || wet(x, y, 250);
  f.woods({ x0: R, x1: A, y0: -A, y1: A }, ["Birch", "Birch", "PineSmall", "Pine"], outside, { count: 70, spacing: 600 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: -R }, ["Pine", "PineSmall", "AutumnTree", "Pine"], outside, { count: 110, spacing: 480 });
  f.woods({ x0: -A, x1: -R, y0: -R, y1: A }, ["golden_maple", "golden_bush"], outside, { count: 60, spacing: 600, kit: "eastcoast" });
  f.woods({ x0: -A, x1: -R, y0: -R, y1: A }, ["AutumnTree", "Birch"], outside, { count: 30, spacing: 600 });
  f.woods({ x0: -R, x1: R, y0: R, y1: A }, ["PineSmall", "Birch"], outside, { count: 30, spacing: 800 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["boulder", "boulder_flat", "scrub", "scrub", "grass_tuft", "grass_tuft", "grass_tuft"], outside, { count: 170, spacing: 400, tries: 6000, kit: "steppe" });

  // ---- monsters: the steppe, the quarry and its bench, the ridge, the south (not in the
  // caravan's camp or on the bridge) ----
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, {
    step: 760, max: 52,
    keepOut: (x, y) => Math.hypot(x - yard[0], y - yard[1]) < 1100 || Math.hypot(x - BRIDGE[0], y - BRIDGE[1]) < 800 || Math.hypot(x - INN[0], y - INN[1]) < 900,
  });

  // ---- people ----
  const xy = (p: XY) => ({ x: p[0], y: p[1] });
  const bridgeFace = (Math.atan2(ACROSS[0], -ACROSS[1]) * 180) / Math.PI; // facing the road from the toll house
  const npcs: NpcSpec[] = [
    {
      id: "cr_caravan", x: 2350, y: 1550, face: 200, name: "นายกองคาราวานบาตบายาร์", title: "หัวหน้ากองคาราวาน", role: "talk",
      look: { gender: "male", hair: "", hairColor: "ink", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "กองคาราวานของข้าขนขนสัตว์จากทรุนราดาไปแลกผลึกที่คราเดีย เดินถนนสายนี้มาตั้งแต่ข้ายังเด็ก",
        "โรงเตี๊ยมหลังนี้เคยคึกคักที่สุดบนถนน จนวันที่แรดเกราะเหล็กฝูงหนึ่งพุ่งชนจนหลังคาพังลงมา",
        "เจอแรดเกราะเหล็กอย่าวิ่งหนีเป็นเส้นตรง มันพุ่งเร็วกว่าม้าอีก หลบไปข้างๆ แล้วตีตอนมันเลี้ยวกลับ",
      ],
    },
    {
      id: "cr_tollkeeper", ...xy(onBridge(700, -250)), face: bridgeFace, name: "ลุงดอลกอร์", title: "นายด่านสะพานเก็บค่าผ่านทาง", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "teal", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: [
        "สมัยก่อนใครข้ามสะพานต้องจ่ายหนึ่งเหรียญทอง เดี๋ยวนี้ข้าเฝ้าไว้เฉยๆ ไม่มีใครเก็บแล้ว",
        "ลำธารนี้ไหลมาจากบ่อใต้ผาเหมืองหิน ไหลลงใต้ไปจนถึงป่าเมเปิลทองริมทะเล",
        "ข้ามสะพานไปทางตะวันออกก็ถึงประตูตะวันตกของคราเดีย ป้อมของพวกจอมเวท",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery: [streamSheet, rockFloor.mesh, autumnFloor, rockLand, coveSea],
    sky: "#8d955f",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && !inPoly(Q1, x, y), density: 0.14 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 4300, y: 1100 },
    npcs,
    labels: [
      { x: N_EXIT[0] - 250, y: N_EXIT[1], text: "ทางไปทรุนราดา", kind: "gate" },
      { x: E_EXIT[0], y: E_EXIT[1] + 250, text: "ทางไปคราเดีย", kind: "gate" },
      { x: S_EXIT[0] + 250, y: S_EXIT[1], text: "ทางไปป่าเมเปิลทอง", kind: "gate" },
      { x: W_EXIT[0], y: W_EXIT[1] - 250, text: "ทางไปทุ่งผาริมทะเลใน", kind: "gate" },
      { x: INN[0] - 900, y: INN[1], text: "ซากโรงเตี๊ยมพักม้า" },
      { x: yard[0] + 300, y: yard[1] + 500, text: "ค่ายคาราวาน", kind: "small" },
      { x: BRIDGE[0] - 500, y: BRIDGE[1], text: "สะพานเก็บค่าผ่านทาง" },
      { x: 4000, y: -3400, text: "เหมืองหินร้าง" },
      { x: POOL[0] - 600, y: POOL[1], text: "บ่อต้นลำธาร", kind: "small" },
      { x: TOWER[0] + 700, y: TOWER[1], text: "เนินหอเฝ้าทางเก่า" },
      { x: -2000, y: -3300, text: "ทุ่งหญ้าริมลำธาร", kind: "small" },
    ],
  });
}
