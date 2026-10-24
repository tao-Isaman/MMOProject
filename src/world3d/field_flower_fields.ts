// ทุ่งดอกไม้หลวง (the royal flower fields), monsters Lv 24-32: the fields north-west of Eden where
// flowers are grown for the palace and the cathedral, in blocks of rows: sunflowers taller than a
// man, red poppies, the white flowers that go to the cathedral's altars. The road from the Noa
// downs comes in at the middle of the west side, runs east past the foot of the west down, where a
// ramp climbs to the little chapel on its spur looking out over the fields, through the flowers to
// the plank bridge over the stream and on along the beekeepers' village to the royal road at the
// middle of the east side (the two maps' tracks meet there, and the stream goes on east to the
// royal road's mill). From the middle a track runs north between the sunflowers and the stream to
// the snowy foothills. The stream rises at a spring under the snowy knoll in the north-east, which
// carries pines and the last of the snow, a ramp up its west side; it runs south through the
// fields and out of the east side. The royal apiary keeps the south-west: two terraces stepped up
// one over the other, rows of painted hives along them, and on the upper one the royal bee house
// where the king's honey is made; a ramp off the road to the first, another to the second.
//
// The field lies between the snow and the green. North of it the snowy foothills: towards the north
// edge snow lies in patches, pines and birches among the oaks. West of it the Noa downs: the west
// down runs on past the edge as their far down does, old dry-stone walls cross the grass south of
// it. East of it the royal road's woods and its bluff (the knoll runs on past the edge, stepping up
// as the bluff does), south of it the woods round the first meadow.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: west -> noa_meadow (n 0.47), east -> royal_road (n 0.44), north -> snow_foothills (e 0.48)

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits, colourways, seeded } from "./town";
import { KIT as HEART } from "./kits/heartland";
import { KIT as WESTFARM, smooth, band, dense, blob, inPoly, toLine, towards, along, lengthwise, nearestOn, wallRun } from "./kits/westfarm";
import type { XY } from "./kits/westfarm";
import { KIT as PLAINS } from "./kits/plains";
import { KIT as SNOW, blobPoly } from "./kits/snowland";
import { KIT as EDEN } from "./kits/eden";
import { rampOff } from "./kits/ruins";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(HEART, WESTFARM, PLAINS, SNOW, EDEN);
// the hives in their colours
colourways({
  hive_blue: { Heartland_Hive: "Heartland_HiveBlue" },
  hive_yellow: { Heartland_Hive: "Heartland_HiveYellow" },
  hive_green: { Heartland_Hive: "Heartland_HiveGreen" },
  hive_rose: { Heartland_Hive: "Heartland_HiveRose" },
});
const HIVES = ["", "hive_blue", "hive_yellow", "hive_green", "hive_rose", "hive_blue"];

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the ways out (each where the map next door has its way out to here) ----
const W_EXIT: XY = [-300, 5150], W_BACK: XY = [-270, 4430];
const E_EXIT: XY = [-700, -5150], E_BACK: XY = [-690, -4430];
const N_EXIT: XY = [5150, 200], N_BACK: XY = [4430, 220];

// ---- the levels ----
// PW: the west down (280), running on west past the edge like the Noa downs' far down, the chapel
// on its spur; KN: the snowy knoll (340) in the north-east, running on east past the edge like the
// royal road's bluff and stepping up past it (KN2, 620); PA, PA2: the apiary's terraces (220, 440).
const PW: XY[] = [[4700, A], [4650, 4600], [4300, 3500], [3600, 2800], [2700, 2350], [1800, 2050], [1150, 2250], [800, 3000], [650, 4100], [550, A]];
const KN: XY[] = [[4600, -A], [4550, -3900], [4300, -2900], [3800, -2150], [3000, -1950], [2200, -2300], [1500, -2650], [950, -3200], [700, -4300], [650, -A]];
const KN2: XY[] = [[3500, -A], [3400, -6000], [2400, -5800], [1300, -6100], [1200, -A]];
const PA: XY[] = [[-2000, 1300], [-1950, 2500], [-2050, 3900], [-2600, 4700], [-3900, 4950], [-4900, 4300], [-5100, 2700], [-4800, 1500], [-4100, 900], [-2900, 850]];
const PA2: XY[] = [[-3000, 1900], [-3000, 3500], [-3500, 4100], [-4400, 4050], [-4600, 2800], [-4200, 1700]];
const RPW = rampOff(PW, 7, 0.35, 900, 460);
const RKN = rampOff(KN, 3, 0.3, 1000, 460);
const RPA = rampOff(PA, 1, 0.45, 800, 440);
const RPA2 = rampOff(PA2, 0, 0.4, 750, 420);

// ---- the water: the spring under the knoll, the stream from it south and out east ----
const SPRING: XY = [2800, -1250];
const STREAM: XY[] = smooth([
  [2800, -1250], [2050, -1150], [1150, -1300], [250, -1650], [-500, -1900], [-1200, -2300], [-1800, -3000], [-2150, -3900], [-2300, -4800], [-2320, -5500], [-2420, -7000], [-2500, -A - 400],
], 150);
const SW = 460;
// where a track crosses the stream near `guess`: the point, the way across it (pointing west) and
// the heading that lays a bridge's length (its own X) along that way
function crossing(guess: XY): { at: XY; ax: XY; h: number } {
  const n = nearestOn(STREAM, guess);
  let ax: XY = [-n.dir[1], n.dir[0]];
  if (ax[1] < 0) ax = [-ax[0], -ax[1]];
  return { at: n.at, ax, h: (Math.atan2(ax[1], ax[0]) * 180) / Math.PI };
}
const BR1 = crossing([-480, -1900]), BR2 = crossing([-2080, -3650]);
const off = (c: { at: XY; ax: XY }, k: number): XY => [c.at[0] + c.ax[0] * k, c.at[1] + c.ax[1] * k];

// ---- the tracks ----
const J2: XY = [-300, 400];
const MAIN: XY[] = smooth([[-350, A], W_EXIT, [-250, 4300], [-100, 3400], [-300, 2400], [-450, 1400], J2, [-300, -500], off(BR1, 750), BR1.at, off(BR1, -750), [-560, -3300], [-700, -4300], E_EXIT, [-700, -7000], [-650, -A]]);
const NORTH: XY[] = smooth([J2, [600, 450], [1500, 300], [2500, 450], [3500, 260], N_EXIT, [7000, 320], [A, 360]]);
const CHAPEL_WAY: XY[] = [along(RPW.bottom, RPW.top, -200), RPW.bottom, RPW.top, ...smooth([along(RPW.bottom, RPW.top, 1150), [1000, 3420]])];
const KNOLL_WAY: XY[] = [...smooth([[3500, 260], [3700, -350], along(RKN.bottom, RKN.top, -350)]), RKN.bottom, RKN.top, ...smooth([along(RKN.bottom, RKN.top, 1300), [3250, -2900], [3000, -3500]])];
const APIARY_WAY: XY[] = [
  ...smooth([[-200, 2950], [-650, 3150], along(RPA.bottom, RPA.top, -350)]), RPA.bottom, RPA.top,
  ...smooth([along(RPA.bottom, RPA.top, 1150), [-2250, 2700], along(RPA2.bottom, RPA2.top, -300)]), RPA2.bottom, RPA2.top,
  ...smooth([along(RPA2.bottom, RPA2.top, 1050), [-3550, 2850]]),
];
// the village lane off the road, between the cottages; the lane off the road over the footbridge
// into the sunflowers of the south-east corner
const VILLAGE: XY[] = smooth([[-300, -2750], [150, -2620], [600, -2750]]);
const FOOT: XY[] = smooth([[-620, -3550], [-1100, -3750], off(BR2, -650), BR2.at, off(BR2, 650), [-3300, -3550], [-4300, -3750]]);
// lanes between the blocks of flowers
const LANE_S: XY[] = smooth([[-350, -250], [-1400, -200], [-2600, -320], [-3800, -200], [-4800, -300]]);
const LANE_E: XY[] = smooth([[2500, 450], [2350, -300], [2200, -800]]);
const TRACKS = [MAIN, NORTH, CHAPEL_WAY, KNOLL_WAY, APIARY_WAY, VILLAGE, FOOT, LANE_S, LANE_E];

// ---- the places ----
const CHAPEL: XY = [1650, 3350];
const BEEHOUSE: XY = [-3950, 2900];
const VILLAGE_C: XY = [300, -2700];
// the blocks of flowers, each a region filled with rows (they do not overlap)
const RB1: XY[] = [[600, 900], [3600, 700], [3700, 1950], [2700, 2150], [1800, 1850], [1100, 2000], [600, 1700]];
const RB2: XY[] = [[700, -100], [3150, -100], [3150, -700], [2200, -850], [1200, -950], [700, -800]];
const RB3N: XY[] = [[-850, 0], [-850, 1250], [-1900, 1250], [-1900, 0]];
const RB3W: XY[] = [[-2150, 50], [-4600, 50], [-4600, 650], [-4100, 700], [-2900, 650], [-2150, 1000]];
const RB3S: XY[] = [[-850, -550], [-4700, -550], [-4700, -2000], [-2600, -2100], [-1900, -2450], [-1300, -1950], [-850, -1500]];
const RBW: XY[] = [[2500, 3300], [3700, 3600], [4000, 5100], [2600, 5100]];
const RB4: XY[] = [[-2650, -2350], [-2750, -3000], [-2550, -4300], [-2650, -5300], [-5300, -5300], [-5300, -2350]];

// ---- what lies next door: snow coming on towards the north edge ----
const ss = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const snowy = (x: number, y: number) => Math.max(0.55 * ss(3500, 6400, x), inPoly(KN, x, y) ? 0.2 + 0.35 * ss(1500, 4400, x) : 0);

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(511, {
    hills: [
      // rolling ground: under the south woods, by the west edge south of the road, in the north
      { x: -4700, y: -1400, r: 900, h: 90 }, { x: -1600, y: 5200, r: 1100, h: 110 }, { x: 4200, y: 1700, r: 800, h: 70 },
      { x: 2200, y: -4600, r: 700, h: -60 }, { x: 300, y: 2600, r: 600, h: 60 }, { x: 4900, y: -1000, r: 700, h: 80 },
      // the land rolling on past the edge (not where the road, the track and the stream go on)
      { x: -7600, y: 2500, r: 2200, h: 260 }, { x: -7400, y: -3800, r: 2000, h: 220 }, { x: 7600, y: 3600, r: 2000, h: 240 },
      { x: 7500, y: -2600, r: 1800, h: 200 }, { x: -2800, y: 7600, r: 1600, h: 180 },
    ],
    plateaus: [
      { poly: dense(PW), h: 280, ramps: [RPW] },
      { poly: dense(KN), h: 340, ramps: [RKN] },
      { poly: dense(KN2), h: 620 },
      { poly: dense(PA), h: 220, ramps: [RPA] },
      { poly: dense(PA2), h: 440, ramps: [RPA2] },
    ],
    rock: "CliffMoss",
  });
  const { put, rnd } = f;

  // ---- the ground: snow under everything, the green over it cut open where the snow patches
  // lie; tracks of trodden earth, the stream and the spring's pool ----
  const roads = [band(MAIN, 470), band(NORTH, 420), band(CHAPEL_WAY, 400), band(KNOLL_WAY, 400), band(APIARY_WAY, 400), band(VILLAGE, 360), band(FOOT, 330), band(LANE_S, 320), band(LANE_E, 300)];
  const POOL = blob(SPRING, 430, 480, 5, 18, 0.1);
  const water = [band(STREAM, SW), POOL];
  const ROAD: [number, number, number] = [0.95, 0.87, 0.76];
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], water, base: "snow", road: ROAD });
  // the snow patches: few and small where they begin, more and bigger towards the north edge
  const pr = seeded(5111), patches: XY[][] = [];
  for (let x = 2800; x < A; x += 480)
    for (let y = -A; y < A; y += 480) {
      const px = x + (pr() - 0.5) * 380, py = y + (pr() - 0.5) * 380, a = snowy(px, py);
      if (pr() > a || toLine(px, py, MAIN) < 400 || toLine(px, py, NORTH) < 380) continue;
      const r = (130 + 260 * a) * (0.7 + 0.3 * pr());
      patches.push(blobPoly([px, py], r, r * (0.55 + 0.4 * pr()), 600 + patches.length, 0.28, 16));
    }
  const grass = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], water: [...water, ...patches], base: "grass", road: ROAD });
  grass.mesh.position.y += 6;
  grass.mesh.renderOrder = 2;
  const green = (x: number, y: number) => grass.kind(x, y) === 0;

  // ---- placing things: clear of the tracks, the water, the cliffs and each other ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine(x, y, t) < d);
  const wet = (x: number, y: number, d: number) => toLine(x, y, STREAM) < SW / 2 + d || Math.hypot(x - SPRING[0], y - SPRING[1]) < 480 + d;
  const free = (x: number, y: number, r: number, gap = 0) =>
    !nearTrack(x, y, r + 230) && !wet(x, y, r) && f.level(x, y, Math.min(r, 220)) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    taken.push([at[0], at[1], r]);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] as SolidSpec[] });
  const inside = (x: number, y: number, m = 0) => Math.abs(x) < R - m && Math.abs(y) < R - m;
  const scatter = (refs: string[], n: number, box: { x0: number; x1: number; y0: number; y1: number }, rad: number, o: { s?: [number, number]; solid?: SolidSpec[] | "none"; keep?: (x: number, y: number) => boolean; gap?: number } = {}) => {
    for (let i = 0, made = 0; i < n * 30 && made < n; i++) {
      const x = box.x0 + rnd() * (box.x1 - box.x0), y = box.y0 + rnd() * (box.y1 - box.y0);
      if (!free(x, y, rad, o.gap ?? 40) || (o.keep && !o.keep(x, y))) continue;
      const s = o.s ? o.s[0] + rnd() * (o.s[1] - o.s[0]) : 1;
      prop(refs[Math.floor(rnd() * refs.length)], [x, y], rnd() * 360, rad * s, { s, ...(o.solid ? { solid: o.solid } : {}) });
      made++;
    }
  };
  const IN = { x0: -R + 250, x1: R - 250, y0: -R + 250, y1: R - 250 };
  const tree = (kind: string, at: XY, s = 1, r = 40) => prop(kind.includes(":") ? kind : `flora:${kind}`, at, rnd() * 360, 190 * s, { s, solid: [{ kind: "tree", x: 0, y: 0, r: r * s }] });

  // ---- the ways out: signposts, a cairn by the snowy way ----
  f.exit("noa_meadow", W_EXIT, W_BACK);
  f.exit("royal_road", E_EXIT, E_BACK);
  f.exit("snow_foothills", N_EXIT, N_BACK);
  prop("plains:signpost", [150, 4700], -90, 80);
  prop("plains:milestone", [-750, 4800], 180, 60);
  prop("plains:signpost", [-1150, -4700], 90, 80);
  prop("plains:milestone", [-250, -4800], 0, 60);
  prop("snowland:trail_sign", [4800, 650], 180, 80, ring(30, "post"));
  prop("snowland:cairn", [4900, -350], 0, 70, ring(45));
  // where the north track leaves the road
  prop("plains:signpost", [100, 700], 200, 80);

  // ---- the water: the stream's banks closed, the bridges, the spring in its ring of stones ----
  const scenery: THREE.Object3D[] = [grass.mesh, f.waterSheet({ x0: -A - 500, x1: 3400, y0: -A - 500, y1: -500 }, -14, "WaterSea")];
  const cuts = [BR1.at, BR2.at];
  const parts: XY[][] = [[]];
  for (const p of STREAM) {
    if (cuts.some((c) => Math.hypot(p[0] - c[0], p[1] - c[1]) < 210)) {
      if (parts[parts.length - 1].length) parts.push([]);
    } else parts[parts.length - 1].push(p);
  }
  for (const part of parts) if (part.length > 1) f.blockBand(part.filter(([x, y]) => Math.abs(x) < R + 900 && Math.abs(y) < R + 900), SW + 60, { step: 220 });
  f.blockDisc(SPRING, 470);
  const rail: SolidSpec[] = [{ kind: "rail", x: 0, y: -190, w: 940, d: 26, rot: 0 }, { kind: "rail", x: 0, y: 190, w: 940, d: 26, rot: 0 }];
  for (const c of [BR1, BR2]) prop("plains:wood_bridge", c.at, c.h, 520, { solid: rail });
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2, at: XY = [SPRING[0] + Math.cos(a) * 520, SPRING[1] + Math.sin(a) * 560];
    put(k % 3 ? "plains:flat_rock" : "plains:boulder", at, rnd() * 360, { s: k % 3 ? 0.55 : 0.4, solid: "none" });
  }
  taken.push([SPRING[0], SPRING[1], 650]);
  // reeds, stones and wild flowers along the banks
  for (let i = 2; i < STREAM.length - 2; i += 2) {
    const [ax, ay] = STREAM[i], [bx, by] = STREAM[i + 1], L = Math.hypot(bx - ax, by - ay) || 1;
    if (Math.abs(ax) > R + 2000 || Math.abs(ay) > R + 2000) continue;
    for (const sd of [-1, 1]) {
      if (rnd() < 0.3) continue;
      const o = SW / 2 + 60 + rnd() * 80, x = ax - ((by - ay) / L) * sd * o, y = ay + ((bx - ax) / L) * sd * o;
      if (nearTrack(x, y, 300) || cuts.some((c) => Math.hypot(x - c[0], y - c[1]) < 700)) continue;
      const k = rnd();
      put(k < 0.5 ? "plains:reeds" : k < 0.75 ? "heartland:poppy_patch" : "plains:flat_rock", [x, y], rnd() * 360, { s: k < 0.75 ? 0.8 + rnd() * 0.4 : 0.5, solid: "none" });
    }
  }

  // ---- the chapel on the down's spur, roses round it, a bench looking out over the fields ----
  prop("heartland:field_chapel", CHAPEL, 0, 620, {
    solid: [{ kind: "building", x: 0, y: 0, w: 920, d: 580, rot: 0 }, { kind: "building", x: -150, y: 0, w: 60, d: 700, rot: 0 }, { kind: "building", x: 150, y: 0, w: 60, d: 700, rot: 0 }],
  });
  prop("eden:park_bench", [CHAPEL[0] - 300, CHAPEL[1] - 650], 90, 100);
  prop("eden:park_bench", [CHAPEL[0] + 300, CHAPEL[1] - 650], 90, 100);
  for (const [dx, dy] of [[-700, 480], [-650, -500], [600, 520], [700, -450]] as XY[]) prop("heartland:flower_bush", [CHAPEL[0] + dx, CHAPEL[1] + dy], rnd() * 360, 110, { s: 0.75, solid: [{ kind: "bush", x: 0, y: 0, r: 60 }] });
  tree("BigOak", [CHAPEL[0] + 900, CHAPEL[1] + 900], 1.2, 48);
  tree("westfarm:cypress", [CHAPEL[0] - 900, CHAPEL[1] + 650], 1, 34);
  tree("westfarm:cypress", [CHAPEL[0] - 900, CHAPEL[1] - 650], 1.1, 34);

  // ---- the royal apiary: rows of hives along both terraces, the bee house on the upper one ----
  prop("heartland:bee_house", BEEHOUSE, 180, 520, { solid: [{ kind: "building", x: 0, y: 0, w: 330, d: 680, rot: 0 }] });
  const hiveSolid: SolidSpec[] = [{ kind: "post", x: 0, y: 0, r: 40 }];
  // a row of hives from a to b (their fronts toward `face`), every `step`, skipping the ramps
  const hiveRow = (a: XY, b: XY, step: number, face: number, poly: XY[], not?: XY[]) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L / step);
    for (let i = 0; i <= n; i++) {
      const at: XY = [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n];
      if (!inPoly(poly, at[0], at[1]) || (not && inPoly(not, at[0], at[1])) || !f.level(at[0], at[1], 90) || nearTrack(at[0], at[1], 250) || taken.some(([tx, ty, tr]) => Math.hypot(tx - at[0], ty - at[1]) < tr + 50)) continue;
      put("heartland:beehive", at, face + (rnd() - 0.5) * 12, { colours: HIVES[Math.floor(rnd() * HIVES.length)] || undefined, solid: hiveSolid });
      taken.push([at[0], at[1], 60]);
    }
  };
  // the lower terrace: rows along its north and east sides, facing out to the morning sun
  for (const [d, k] of [[0, 0], [260, 1]] as [number, number][]) {
    hiveRow([-2300 - d, 1300], [-2350 - d, 4200], 170, 180, PA, PA2);
    if (k === 0) hiveRow([-4500, 1250 + d], [-2600, 1150 + d], 170, 90, PA, PA2);
  }
  // the upper terrace: two rows before the bee house
  for (const x of [-3300, -3550]) hiveRow([x, 2000], [x, 3600], 160, 180, PA2);
  // wattle hurdles round the terrace edges, skeps, a bench, the honey frames
  const hurdles = (pts: XY[]) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / 400));
      for (let k = 0; k < n; k++) {
        const c: XY = [ax + ((bx - ax) * (k + 0.5)) / n, ay + ((by - ay) * (k + 0.5)) / n];
        if (nearTrack(c[0], c[1], 260) || !f.level(c[0], c[1], 120)) continue;
        put("heartland:wattle_fence", c, lengthwise(bx - ax, by - ay), { sy: L / n / 400, solid: [{ kind: "fence", x: 0, y: 0, w: 20, d: 400, rot: 0 }] });
      }
    }
  };
  hurdles([[-4600, 4500], [-4500, 3300], [-4650, 1900], [-4300, 1350]]);
  prop("heartland:bee_stump", [-4300, 4300], 30, 130);
  prop("common:bench", [BEEHOUSE[0] + 450, BEEHOUSE[1] - 800], 180, 100);
  prop("heartland:honey_stall", [-2700, 4200], 30, 200, { solid: [{ kind: "market", x: 0, y: 0, w: 120, d: 280, rot: 0 }] });
  scatter(["heartland:flower_bush", "heartland:poppy_patch", "heartland:lavender_clump"], 12, { x0: -5000, x1: -2000, y0: 900, y1: 4900 }, 110, { solid: "none", keep: (x, y) => inPoly(PA, x, y) });
  tree("BigOak", [-4500, 2200], 1.1, 46);
  tree("RoundTree", [-2600, 4300], 0.9, 40);

  // ---- the beekeepers' village over the bridge, between the road and the knoll: cottages
  // facing the lane, the well, the honey stall by the road, hives in the gardens ----
  prop("heartland:beekeeper_cottage", [700, -2300], towards(-1, 0.1), 560);
  prop("heartland:beekeeper_cottage", [350, -3300], towards(-0.2, 1), 560);
  prop("heartland:village_well", [100, -2300], 20, 200, { solid: [{ kind: "well", x: 0, y: 0, r: 100 }, { kind: "box", x: 0, y: 180, w: 130, d: 90, rot: 0 }] });
  prop("heartland:honey_stall", [-80, -3050], towards(-0.4, 1), 200, { solid: [{ kind: "market", x: 0, y: 0, w: 120, d: 280, rot: 0 }] });
  prop("heartland:flower_cart", [-250, -2100], 120, 230);
  for (const at of [[1150, -2750], [1050, -3050], [900, -3650]] as XY[]) prop("heartland:beehive", at, 90, 60, { colours: "hive_blue", solid: hiveSolid });
  hurdles([[1250, -2500], [1150, -3300], [850, -3950]]);
  tree("Cherry", [-150, -3650], 0.85, 36);
  tree("RoundTree", [1000, -1900], 0.9, 40);
  // on the stream's far bank, by the footbridge: hay, the drying of the cut flowers
  prop("plains:hay_bales", [-2600, -2900], 30, 240);
  prop("heartland:drying_rack", [-1300, -4250], 60, 220, { solid: [{ kind: "rack", x: 0, y: 0, w: 160, d: 360, rot: 0 }] });

  // ---- the flowers: each block a region filled with rows of 8 m pieces end to end along `dir`
  // (degrees), `gap` apart; a piece only where it lies whole on level open ground ----
  const fits = (a: XY, b: XY, region: XY[]) => {
    for (let t = 0.02; t <= 0.99; t += 0.24) {
      const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
      if (!inPoly(region, x, y) || !inside(x, y, 250) || !f.level(x, y, 150) || nearTrack(x, y, 340) || wet(x, y, 150) || Math.abs(f.h(x, y) - f.h(a[0], a[1])) > 10) return false;
      if (taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + 120)) return false;
    }
    return true;
  };
  const fillRows = (region: XY[], dir: number, gap: number, pick: (row: number) => string) => {
    const ux = Math.cos((dir * Math.PI) / 180), uy = Math.sin((dir * Math.PI) / 180), vx = -uy, vy = ux;
    let a0 = Infinity, a1 = -Infinity, c0 = Infinity, c1 = -Infinity;
    for (const [x, y] of region) {
      const a = x * ux + y * uy, c = x * vx + y * vy;
      [a0, a1, c0, c1] = [Math.min(a0, a), Math.max(a1, a), Math.min(c0, c), Math.max(c1, c)];
    }
    const laid: XY[][] = [];
    for (let c = c0 + gap / 2, row = 0; c < c1; c += gap, row++) {
      const ref = `heartland:${pick(row)}`;
      for (let a = a0; a + 800 <= a1; ) {
        const p0: XY = [ux * a + vx * c, uy * a + vy * c], p1: XY = [ux * (a + 800) + vx * c, uy * (a + 800) + vy * c];
        if (!fits(p0, p1, region)) {
          a += 100;
          continue;
        }
        put(ref, [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], lengthwise(ux, uy), { solid: "none" });
        laid.push([p0, p1]);
        a += 800;
      }
    }
    // (the pieces keep the trees and the rest off them from now on)
    for (const [p0, p1] of laid) for (let t = 0.1; t < 1; t += 0.2) taken.push([p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, 120]);
  };
  const SUN = () => "sunflower_row";
  // north of the road between the north track and the down: sunflowers, rows running north
  fillRows(RB1, 0, 150, SUN);
  // up on the down beyond the chapel: the cathedral's white flowers
  fillRows(RBW, 0, 300, () => "white_bed");
  // between the north track and the stream: poppies and the cathedral's white flowers
  fillRows(RB2, 0, 300, (r) => (r % 3 === 1 ? "white_bed" : "poppy_bed"));
  // south of the road: beds by the road, sunflowers under the apiary, beds and sunflowers in
  // turn down to the stream
  fillRows(RB3N, 90, 300, (r) => ["poppy_bed", "white_bed", "poppy_bed"][r % 3]);
  fillRows(RB3W, 90, 150, SUN);
  fillRows(RB3S, 90, 300, (r) => (r % 4 === 3 ? "white_bed" : r % 4 === 1 ? "poppy_bed" : "sunflower_row"));
  // the south-east corner, past the stream: sunflowers to the woods' edge
  fillRows(RB4, 0, 150, SUN);
  // scarecrows and hay among them
  for (const at of [[2200, 950], [-2600, -1300], [-3900, -4600], [1300, -600]] as XY[]) prop("plains:scarecrow", at, rnd() * 360, 40);
  // hay at the end of the lane down the middle, by the woods
  prop("plains:hay_bales", [-4950, -700], 20, 240);
  // up on the down: lone oaks and birches, grass and flowers, walls running on west
  scatter(["flora:BigOak", "flora:RoundTree", "flora:Birch"], 9, { x0: 1200, x1: 4600, y0: 2200, y1: R - 200 }, 220, { s: [0.85, 1.15], solid: [{ kind: "tree", x: 0, y: 0, r: 44 }], keep: (x, y) => inPoly(PW, x, y) && Math.hypot(x - CHAPEL[0], y - CHAPEL[1]) > 1300 });
  scatter(["heartland:poppy_patch", "westfarm:wildflowers", "plains:tall_grass"], 22, { x0: 1000, x1: 4600, y0: 2200, y1: R - 200 }, 90, { solid: "none", keep: (x, y) => inPoly(PW, x, y) });
  scatter(["westfarm:sheep_flock"], 3, { x0: 2400, x1: 4400, y0: 3200, y1: R - 300 }, 200, { solid: "none", keep: (x, y) => inPoly(PW, x, y) });

  // ---- the snowy knoll: pines and birches in the snow, the wild bees' old stump, a cairn at its
  // lookout over the fields ----
  scatter(["flora:SnowPine", "flora:Pine", "flora:SnowPineSmall", "flora:Birch", "flora:Pine"], 26, { x0: 700, x1: 4600, y0: -R + 150, y1: -1900 }, 190, { s: [0.8, 1.2], solid: [{ kind: "tree", x: 0, y: 0, r: 38 }], keep: (x, y) => inPoly(KN, x, y) && toLine(x, y, KNOLL_WAY) > 380 });
  prop("snowland:cairn", [3000, -3500], 0, 70, ring(45));
  prop("heartland:bee_stump", [2300, -3300], 120, 130);
  prop("heartland:meadow_boulder", [1700, -4300], 40, 260, { s: 0.8, solid: [{ kind: "rock", x: 0, y: 0, r: 150 }] });
  scatter(["snowland:snow_drift", "snowland:frost_shrub", "snowland:snow_patch"], 14, { x0: 700, x1: 4600, y0: -R + 150, y1: -1900 }, 150, { solid: "none", keep: (x, y) => inPoly(KN, x, y) });

  // ---- the north: pines, birches and oaks, snow lying in patches, frosted shrubs ----
  scatter(["flora:Pine", "flora:Birch", "flora:PineSmall", "flora:BigOak", "flora:SnowPineSmall"], 20, { x0: 3600, x1: R - 200, y0: -R + 200, y1: R - 200 }, 200, { s: [0.8, 1.15], solid: [{ kind: "tree", x: 0, y: 0, r: 40 }], keep: (x, y) => !inPoly(PW, x, y) && !inPoly(KN, x, y) });
  scatter(["snowland:snow_patch", "snowland:frost_shrub", "snowland:dry_grass"], 24, { x0: 3400, x1: R, y0: -R, y1: R }, 160, { solid: "none", keep: (x, y) => rnd() < snowy(x, y) });

  // ---- the west: the Noa downs' old dry-stone walls crossing the grass south of the down ----
  const gapAt = (x: number, y: number) => nearTrack(x, y, 330) || wet(x, y, 120) || taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + 150) || inPoly(PA, x, y);
  for (const w of [[[300, 5900], [100, 4700], [400, 3700]], [[-1300, 5900], [-1150, 4800], [-1500, 4000]], [[4600, 1200], [4100, -200]]] as XY[][]) wallRun(f, w, { skip: gapAt, broken: 0.2 });

  // ---- trees and the meadow's growth over the open ground ----
  scatter(["flora:BigOak", "flora:RoundTree", "flora:RoundTree"], 14, IN, 230, { s: [0.85, 1.15], solid: [{ kind: "tree", x: 0, y: 0, r: 44 }], gap: 400 });
  scatter(["heartland:meadow_boulder"], 3, IN, 260, { s: [0.6, 0.85], solid: [{ kind: "rock", x: 0, y: 0, r: 140 }] });
  scatter(["heartland:field_stones"], 5, IN, 170, { s: [0.8, 1], solid: [{ kind: "rock", x: 0, y: 0, r: 90 }] });
  scatter(["heartland:flower_bush"], 10, IN, 110, { s: [0.7, 1], solid: [{ kind: "bush", x: 0, y: 0, r: 60 }] });
  // the south woods' edge (towards the first meadow): oaks thickening to the edge
  scatter(["flora:BigOak", "flora:RoundTree", "flora:SmallTree", "flora:BigOak"], 26, { x0: -R + 150, x1: -4300, y0: -R + 200, y1: R - 200 }, 210, { s: [0.85, 1.2], solid: [{ kind: "tree", x: 0, y: 0, r: 44 }], keep: (x) => rnd() < ss(-4000, -5300, x) + 0.15 });
  // and the royal road's woods coming in on the east, south of the knoll
  scatter(["flora:BigOak", "flora:RoundTree", "flora:Birch"], 14, { x0: -R + 200, x1: 700, y0: -R + 150, y1: -4300 }, 210, { s: [0.85, 1.15], solid: [{ kind: "tree", x: 0, y: 0, r: 44 }] });
  // grass and wild flowers wherever they fit, thick under the flowers' rows' ends
  const grassOut = (x: number, y: number) => nearTrack(x, y, 60) || wet(x, y, 40) || !f.level(x, y, 90) || taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr * 0.8);
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["tall_grass", "tall_grass", "fern_clump"], (x, y) => grassOut(x, y) || !green(x, y), { count: 170, tries: 4000, spacing: 420, kit: "plains" });
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["poppy_patch", "poppy_patch", "lavender_clump"], (x, y) => grassOut(x, y) || !green(x, y), { count: 60, tries: 2000, spacing: 600, kit: "heartland" });
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["wildflowers"], (x, y) => grassOut(x, y) || !green(x, y), { count: 60, tries: 2000, spacing: 600, kit: "westfarm" });

  // ---- past the edge: oaks to the south and east, the snowy pines and birches to the north,
  // the downs and their walls to the west ----
  const rim = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || nearTrack(x, y, 330) || wet(x, y, 150);
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["BigOak", "RoundTree", "RoundTree", "SmallTree", "BigOak", "Birch"], (x, y) => rim(x, y) || x > 5600 || (y > 5600 && x > 400), { count: 420, tries: 7000, spacing: 470 });
  f.woods({ x0: 5600, x1: A, y0: -A, y1: A }, ["Pine", "Birch", "SnowPineSmall", "Pine", "PineSmall", "SnowPine"], rim, { count: 110, tries: 2500, spacing: 520 });
  f.woods({ x0: 5600, x1: A, y0: -A, y1: A }, ["snow_patch", "snow_drift", "frost_shrub"], rim, { count: 40, tries: 1200, spacing: 650, kit: "snowland" });
  f.woods({ x0: -A, x1: A, y0: 5600, y1: A }, ["sheep_flock", "wildflowers", "wildflowers"], rim, { count: 26, tries: 1200, spacing: 800, kit: "westfarm" });
  f.woods({ x0: -A, x1: A, y0: 5600, y1: A }, ["RoundTree", "BigOak", "Birch"], (x, y) => rim(x, y) || inPoly(PW, x, y) === false && x > 500, { count: 30, tries: 1200, spacing: 700 });
  for (const w of [[[-1200, 6300], [-600, 7400], [200, 8600]], [[-3200, 6000], [-3600, 7800]], [[1200, 6200], [2500, 7600]]] as XY[][]) wallRun(f, w, { broken: 0.25, skip: (x, y) => nearTrack(x, y, 330) });

  // ---- monsters: the flower blocks, the meadows, the terraces, the down and the knoll ----
  const busy = (x: number, y: number) => Math.hypot(x - CHAPEL[0], y - CHAPEL[1]) < 900 || Math.hypot(x - VILLAGE_C[0], y - VILLAGE_C[1]) < 1300 || Math.hypot(x - BEEHOUSE[0], y - BEEHOUSE[1]) < 650;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 820, keepOut: busy, max: 50 });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "flower_fields_apiarist", x: BEEHOUSE[0] + 420, y: BEEHOUSE[1] - 380, face: 200, name: "ลุงโยฮัน", title: "นายสวนผึ้งหลวง", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "น้ำผึ้งจากสวนนี้ขึ้นโต๊ะเสวยทุกเช้า ผึ้งของที่นี่กินแต่ดอกไม้ที่ปลูกให้วัง",
        "ช่วงนี้ผึ้งหลวงตัวโตผิดปกติ ใหญ่เท่าแมวเลยทีเดียว แถมรุมต่อยใครก็ตามที่เข้าใกล้รัง",
        "ทานตะวันในแปลงก็แปลกไป มันหันหน้าตามคนเดินผ่านแทนที่จะหันตามดวงอาทิตย์",
      ],
    },
    {
      id: "flower_fields_florist", x: CHAPEL[0] - 520, y: CHAPEL[1] - 950, face: 240, name: "มารีแอนน์", title: "คนปลูกดอกไม้ส่งวัง", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "auburn", eyes: "teal", top: "top_adventurer_teal", bottom: "bottom_adventurer_cocoa" },
      lines: [
        "ดอกไม้ขาวพวกนั้นส่งไปประดับแท่นในมหาวิหารที่อีเดน ป๊อปปี้แดงกับทานตะวันส่งเข้าวัง",
        "โบสถ์น้อยนี้สร้างไว้ให้คนในทุ่งสวดขอฟ้าฝน ระฆังตีทุกเย็นตอนเลิกงาน",
        "ถนนตะวันออกไปถนนหลวง ขึ้นเหนือตามลำธารไปเชิงเขาหิมะ ทางตะวันตกออกไปทุ่งหญ้าโนอา",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery,
    sky: "#6f9150",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && green(x, y) && !wet(x, y, 60), density: 0.4 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -350, y: 4350 },
    npcs,
    labels: [
      { x: W_EXIT[0], y: W_EXIT[1] - 250, text: "ทางไปทุ่งหญ้าโนอา", kind: "gate" },
      { x: E_EXIT[0], y: E_EXIT[1] + 250, text: "ทางไปถนนหลวง", kind: "gate" },
      { x: N_EXIT[0] - 250, y: N_EXIT[1], text: "ทางไปเชิงเขาหิมะ", kind: "gate" },
      { x: CHAPEL[0] - 650, y: CHAPEL[1], text: "โบสถ์น้อยกลางทุ่ง" },
      { x: -2600, y: 2400, text: "สวนผึ้งหลวง" },
      { x: BEEHOUSE[0] + 450, y: BEEHOUSE[1], text: "โรงรังผึ้งหลวง", kind: "small" },
      { x: VILLAGE_C[0] + 300, y: VILLAGE_C[1], text: "หมู่บ้านคนเลี้ยงผึ้ง" },
      { x: 1650, y: 1450, text: "แปลงทานตะวัน", kind: "small" },
      { x: 1700, y: -380, text: "แปลงป๊อปปี้และดอกไม้ขาว", kind: "small" },
      { x: -2700, y: -400, text: "ทุ่งดอกไม้หลวง" },
      { x: SPRING[0] - 500, y: SPRING[1], text: "ตาน้ำเชิงเนิน", kind: "small" },
      { x: 3000, y: -3200, text: "เนินหิมะ" },
      { x: 400, y: -1600, text: "ลำธารเขาหิมะ", kind: "small" },
    ],
  });
}
