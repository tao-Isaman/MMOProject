// แหลมพายุ (storm_cape), monsters Lv 92-102: the north-east corner of the land, a cape the
// storms off the northern sea never leave. The windswept heights come in from the west as two
// tablelands with the pass between them; past them the land opens into a moor of grass beaten
// flat, crooked pines all leaning away from the sea, trees split by lightning, scorched rings and
// glassy fulgurites where the bolts came down. Iron masts stand over it to draw the lightning.
//   - the west heights (4.2 m), the north heights of the windswept heights going on to the sea
//     cliffs, a lightning mast and a lookout on them;
//   - the south-west tableland (5.5 m), the wind garden's going on, a mast on its brow;
//   - the cove between the west heights and the headland: a beach of grey shingle where a brig lies
//     broken in two on the rocks, a castaway's camp by her;
//   - the headland (5 m) to the north-east, the cape itself, its cliffs falling into the sea, masts
//     on it and on its tip a higher crag (8.5 m) with the broken signal tower that once warned
//     ships off this coast; sea stacks out past it in the surf.
// The sea fills the north and the east; the moor runs on south to the floating rocks.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: west (the middle, n 0.50) -> windswept_heights, south (the middle, e 0.50) ->
//             floating_rocks

import * as THREE from "three";
import { FieldBuilder } from "./field";
import { useKits } from "./town";
import type { Town } from "./town";
import { buildPaved } from "./paved";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";
import { KIT as HEIGHTS } from "./kits/eastheights";
import { KIT as EASTCOAST, smooth, band, inPoly, distTo, every, faceDir, faceTo, seaSheet } from "./kits/eastcoast";
import type { XY, Poly } from "./kits/eastcoast";
import { KIT as STEPPE, fieldReport } from "./kits/steppe";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { KIT as SOUTHSANDS } from "./kits/southsands";
import { KIT as WESTHILLS } from "./kits/westhills";
import { KIT as WESTFARM } from "./kits/westfarm";

useKits(HEIGHTS, STEPPE, TRUNRADA, SOUTHSANDS, WESTHILLS, WESTFARM, EASTCOAST);

// the last build's own check (see fieldReport), for building the field; the game never calls it
export let REPORT: () => string[] = () => [];

const R = 5500; // the walkable bounds, +-R
const A = 9000; // the ground's area, +-A

// ---- the shore: from past the west edge along the north (round the cove and the headland) and
// down the east to past the south edge; the land south-west of it ----
const SHORE: XY[] = [
  [4500, A + 400], [4500, 5500], [4350, 4300], [4550, 3200], [4250, 2300], [3500, 1700], [2750, 1100], [2550, 300], [2800, -500],
  [3600, -900], [4400, -1300], [4900, -2300], [4800, -3300], [4200, -3900], [3200, -4300], [2000, -4450], [1300, -4150], [800, -4300], [100, -4700],
  [-500, -4450], [-1100, -4200], [-1800, -4400], [-2600, -4800], [-3200, -4500], [-3900, -4300], [-4500, -4550], [-5500, -4550], [-A - 400, -4600],
];
const SEA: Poly = [...SHORE, [-A - 400, -A - 400], [A + 400, -A - 400], [A + 400, A + 400]];

// ---- the levels ----
// HW: the west heights (4.2 m, as the windswept heights' north heights), HSW: the south-west
// tableland (5.5 m, as their wind garden), C1: the headland (5 m), C2: its crag (8.5 m)
const HW: Poly = [[4500, A + 400], [4500, 5500], [4350, 4300], [4550, 3200], [4250, 2300], [3700, 2100], [2900, 2500], [2000, 2900], [1100, 3500], [750, 4500], [700, 5500], [650, A + 400]];
const HSW: Poly = [[-A - 400, A + 400], [-1500, A + 400], [-1500, 5500], [-1700, 4300], [-2300, 3300], [-3300, 2500], [-4400, 1800], [-5500, 1500], [-A - 400, 1450]];
const C1: Poly = [[2650, -350], [3600, -900], [4400, -1300], [4900, -2300], [4800, -3300], [4200, -3900], [3200, -4300], [2600, -3900], [2000, -3100], [1750, -2000], [1950, -1000]];
const C2: Poly = [[3650, -1900], [4250, -2050], [4350, -2700], [4000, -3150], [3450, -3150], [3250, -2500]];

function rampOn(poly: Poly, a: XY, b: XY, t: number, len: number, width: number): { top: XY; bottom: XY; width: number } {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), top: XY = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
  if (inPoly(poly, top[0] + nx * 60, top[1] + ny * 60)) [nx, ny] = [-nx, -ny];
  return { top, bottom: [top[0] + nx * len, top[1] + ny * len], width };
}
const R_W = rampOn(HW, [1100, 3500], [2000, 2900], 0.5, 1350, 460);
const R_SW = rampOn(HSW, [-2300, 3300], [-3300, 2500], 0.5, 1650, 460);
const R_C1 = rampOn(C1, [1750, -2000], [1950, -1000], 0.5, 1550, 460);
const R_C2 = rampOn(C2, [3250, -2500], [3650, -1900], 0.5, 1100, 420);
const lenOf = (r: { top: XY; bottom: XY }) => Math.hypot(r.top[0] - r.bottom[0], r.top[1] - r.bottom[1]);
const toward = (a: XY, b: XY, d: number): XY => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [a[0] + ((b[0] - a[0]) / L) * d, a[1] + ((b[1] - a[1]) / L) * d];
};
const climb = (r: { top: XY; bottom: XY }, inn = 350, out = 350): XY[] => [toward(r.bottom, r.top, -inn), r.bottom, r.top, toward(r.bottom, r.top, lenOf(r) + out)];

// ---- the tracks ----
const W_EXIT: XY = [0, 5150], S_EXIT: XY = [-5150, 0];
const J: XY = [300, -200]; // where the ways part on the moor
const MAIN: XY[] = smooth([[0, A + 200], W_EXIT, [-100, 4300], [150, 3200], [450, 2200], [650, 1000], J, [-700, -150], [-1900, 100], [-3000, 50], [-4100, -30], S_EXIT, [0 - A - 200, 0]]);
const UP_W: XY[] = [...smooth([[450, 2200], climb(R_W, 200)[0]]), ...climb(R_W, 200).slice(1), ...smooth([climb(R_W)[3], [2400, 3800], [3200, 4000], [3700, 3600]])];
const UP_SW: XY[] = [...smooth([[-1900, 100], [-1900, 900], climb(R_SW, 250)[0]]), ...climb(R_SW, 250).slice(1), ...smooth([climb(R_SW)[3], [-3500, 3600], [-3900, 4300]])];
const TO_CAPE: XY[] = [...smooth([J, [450, -700], climb(R_C1, 250)[0]]), ...climb(R_C1, 250).slice(1), ...smooth([climb(R_C1, 250, 300)[3], R_C2.bottom]), R_C2.top, climb(R_C2, 350, 150)[3]];
const ALONG_C1: XY[] = smooth([[2300, -1650], [2500, -2600], [2850, -3400], [3200, -3750]]);
const TO_COVE: XY[] = smooth([[650, 1000], [1400, 950], [2000, 900], [2250, 700]]);
const TRACKS = [MAIN, UP_W, UP_SW, TO_CAPE, ALONG_C1, TO_COVE];
const TOWER: XY = [3850, -2550];
const WRECK: XY = [2850, 600];

// ---- the cove's shingle: from the foot of the west heights round to the headland's ----
const BEACH: Poly = [[3700, 1950], [2950, 2300], [2200, 1900], [1950, 1100], [2000, 300], [2250, -350], [2700, -400], [2550, 300], [2750, 1100], [3500, 1700]];

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(527, {
    hills: [
      // the moor rolling, beaten low by the wind
      { x: -800, y: 2600, r: 1100, h: 110 }, { x: 1300, y: -800, r: 900, h: 80 }, { x: -2300, y: -1900, r: 1300, h: 120 },
      { x: 700, y: -3000, r: 1000, h: 100 }, { x: -3700, y: -3200, r: 1000, h: 90 }, { x: -1000, y: -3500, r: 800, h: -60 },
      { x: -4200, y: 700, r: 900, h: 80 }, { x: 1300, y: 1500, r: 700, h: -50 },
      // the moor going on south toward the floating rocks
      { x: -7400, y: -1500, r: 2400, h: 200 },
    ],
    plateaus: [
      { poly: HW, h: 420, ramps: [R_W] },
      { poly: HSW, h: 550, ramps: [R_SW] },
      { poly: C1, h: 500, ramps: [R_C1] },
      { poly: C2, h: 850, ramps: [R_C2] },
    ],
    rock: "Eastheights_CliffStorm",
  });
  const { put, rnd } = f;

  // ---- the ground: steppe grass gone grey in the salt wind, tracks, the sea cut out ----
  const roads = [band(MAIN, 480), band(UP_W, 420), band(UP_SW, 420), band(TO_CAPE, 420), band(ALONG_C1, 360), band(TO_COVE, 400)];
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], water: [SEA], base: "steppe", road: [0.78, 0.75, 0.68] });
  // (greyed by the salt wind out on the cape; the bands along the west and south edges keep the
  // colour of the heights and the floating rocks' grass they run into)
  {
    const geo = ground.mesh.geometry, pos = geo.getAttribute("position"), col = new Float32Array(pos.count * 3);
    const ease = (t: number) => t * t * (3 - 2 * t), clamp01 = (t: number) => Math.min(1, Math.max(0, t));
    for (let i = 0; i < pos.count; i++) {
      const x = ground.mesh.position.x + pos.getX(i), y = -(ground.mesh.position.z + pos.getZ(i));
      const t = ease(Math.min(clamp01((5500 - y) / 2200), clamp01((x + 5500) / 2200)));
      col.set([1 - 0.3 * t, 1 - 0.3 * t, 1 - 0.45 * t], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    (ground.mesh.material as THREE.MeshStandardMaterial).vertexColors = true;
  }
  // the cove's shingle: a second ground a hair over the grass, cut away outside the beach
  const BOX: Poly = [[1700, -700], [4000, -700], [4000, 2600], [1700, 2600]];
  const areaOf = (p: Poly) => p.reduce((t, [x, y], i) => t + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0);
  const hole = Math.sign(areaOf(BOX)) === Math.sign(areaOf(BEACH)) ? [...BEACH].reverse() : BEACH;
  const shingle = buildPaved({
    area: { x0: 1750, y0: -650, x1: 3950, y1: 2550 }, roads, plazas: [], base: "rock", track: true, road: [0.78, 0.75, 0.68],
    water: [[...BOX, BOX[0], ...hole, hole[0]], SEA], height: (x, y) => f.h(x, y) + 4, cell: 50,
  });
  shingle.mesh.renderOrder = 1;

  // ---- the sea: dark storm water out past the horizon, a band along the water's edge ----
  const sea = seaSheet([...SHORE.map(([x, y]): XY => [x + 60, y - 60]), [-30000, -30000], [30000, -30000], [30000, 30000]], -14, "Eastheights_StormSea");
  const near = SHORE.filter(([x, y]) => Math.abs(x) < R + 900 && Math.abs(y) < R + 900);
  f.blockBand(near, 420, { kind: "sea" });

  // ---- the ways out ----
  f.exit("windswept_heights", W_EXIT, [-80, 4450]);
  f.exit("floating_rocks", S_EXIT, [-4450, -20]);

  // ---- placing things clear of each other, the tracks, the water and the cliffs ----
  const taken: [number, number, number][] = [];
  const onTrack = (x: number, y: number, m: number) => TRACKS.some((t) => distTo(t, x, y) < m) || [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const wet = (x: number, y: number, m = 0) => inPoly(SEA, x, y) || distTo(SHORE, x, y) < m;
  const free = (x: number, y: number, r: number) => !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r);
  const fits = (x: number, y: number, r: number, m = r) => f.level(x, y, Math.min(r, 260)) && !onTrack(x, y, m + 230) && free(x, y, r) && !wet(x, y, r + 150);
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
  const scatter = (box: { x0: number; x1: number; y0: number; y1: number }, n: number, refs: string[], r: number, ok: (x: number, y: number) => boolean, o: { s?: [number, number]; solid?: number | "none"; tries?: number; head?: () => number } = {}) => {
    for (let t = 0, made = 0; t < (o.tries ?? n * 30) && made < n; t++) {
      const x = box.x0 + rnd() * (box.x1 - box.x0), y = box.y0 + rnd() * (box.y1 - box.y0);
      if (!ok(x, y) || !fits(x, y, r)) continue;
      const s = o.s ? o.s[0] + rnd() * (o.s[1] - o.s[0]) : 1;
      place(refs[Math.floor(rnd() * refs.length)], [x, y], o.head ? o.head() : rnd() * 360, r * s, { s, ...(o.solid === "none" ? { solid: "none" } : o.solid ? { solid: ring(o.solid * s) } : {}) });
      made++;
    }
  };
  // the gales come in off the sea from the north-east: everything leans away south-west
  const lee = () => -45 + (rnd() - 0.5) * 30;
  const onBeach = (x: number, y: number) => inPoly(BEACH, x, y);

  // ---- the ways out marked ----
  place("steppe:signpost", [550, 4600], faceDir(0, 1), 60, { solid: ring(25, "post") });
  place("trunrada:cairn", [-650, 4800], 0, 120, { solid: ring(80) });
  taken.push([W_EXIT[0], W_EXIT[1], 650]);
  place("steppe:signpost", [-4600, 550], faceDir(1, 0), 60, { solid: ring(25, "post") });
  place("trunrada:cairn", [-4750, -600], 0, 120, { solid: ring(80) });
  taken.push([S_EXIT[0], S_EXIT[1], 650]);
  place("steppe:signpost", [900, -500], faceTo([900, -500], J), 60, { solid: ring(25, "post") });

  // ---- the headland and its crag: the signal tower, masts, rocks ----
  place("eastheights:signal_tower", TOWER, faceTo(TOWER, R_C2.top), 650, { solid: [{ kind: "tower", x: 0, y: 0, r: 345 }, { kind: "rubble", x: 520, y: 0, r: 220 }, { kind: "rubble", x: 420, y: 330, r: 150 }, { kind: "rubble", x: 420, y: -330, r: 150 }] });
  const rod: SolidSpec[] = [{ kind: "post", x: 0, y: 0, r: 125 }, ...[0, 1, 2].map((k) => ({ kind: "rock", x: Math.cos(0.5 + (k * Math.PI * 2) / 3) * 360, y: Math.sin(0.5 + (k * Math.PI * 2) / 3) * 360, r: 45 }))];
  for (const [at, h] of [[[3600, -3700], 10], [[2650, -800], 40], [[1500, -2900], 0], [[3500, 3300], 0], [[-3300, 3700], 20], [[-900, -2600], 60], [[1200, -3400], 30], [[-3000, -1500], 80]] as [XY, number][])
    tryPlace("eastheights:lightning_rod", at, h, 400, { solid: rod });
  for (const [ref, at, h, r] of [
    ["westhills:storm_rocks", [4400, -2300], 30, 260], ["eastheights:heath_boulder", [3300, -3700], 120, 180], ["southsands:scorched_rock", [2300, -2300], 200, 220],
    ["eastheights:rock_scatter", [3800, -1500], 70, 230], ["southsands:fulgurite", [3200, -1300], 0, 120], ["southsands:fulgurite", [2700, -3800], 90, 120],
  ] as [string, XY, number, number][]) tryPlace(ref, at, h, r, { solid: ring(r * 0.6) });

  // ---- the cove: the wreck on the rocks, the castaway's camp, driftwood, spray ----
  place("eastheights:storm_wreck", WRECK, -104, 900, {
    solid: [{ kind: "wreck", x: -420, y: -40, w: 760, d: 520, rot: -5 }, { kind: "wreck", x: 420, y: 40, w: 760, d: 500, rot: 4 }, { kind: "mast", x: 340, y: 470, w: 800, d: 40, rot: 63 }],
  });
  place("trunrada:campfire", [2250, 1350], 0, 150, { solid: ring(80, "fire") });
  tryPlace("southsands:beached_boat", [2400, 1800], faceDir(1, 0.3), 260);
  place("trunrada:drying_rack", [2100, 1600], faceDir(0, -1), 150);
  for (const [x, y, h] of [[2300, 1050, 30], [2350, 980, 80], [2100, 2000, 10]] as number[][]) tryPlace("common:crate", [x, y], h, 60);
  for (const { p } of every(SHORE.slice(3, 10), 380)) if (rnd() < 0.7) put("westhills:sea_spray", [p[0] + 120, p[1] - 60], rnd() * 360, { s: 0.7 + rnd() * 0.5, solid: "none", z: -10 });

  // ---- the west heights: a lookout cairn, a mast, crooked pines ----
  tryPlace("trunrada:cairn", [3900, 3700], 0, 120, { solid: ring(80) });
  tryPlace("eastheights:prayer_flags", [3300, 4600], 80, 330, { solid: [{ kind: "post", x: 0, y: -300, r: 22 }, { kind: "post", x: 0, y: 300, r: 22 }] });
  tryPlace("eastheights:granite_tor", [2200, 4600], 30, 320, { solid: ring(200) });

  // ---- the south-west tableland ----
  tryPlace("eastheights:wind_rock_mushroom", [-3600, 4600], 100, 260, { solid: ring(110) });
  tryPlace("eastheights:granite_tor", [-4700, 2600], 60, 320, { solid: ring(200) });
  tryPlace("eastheights:rock_scatter", [-2400, 4600], 20, 230, { solid: ring(150) });

  // ---- the moor: split trees, scorched rocks, fulgurites, boulders ----
  for (const [at, h] of [[[-500, 1800], 20], [[1500, -2200], 120], [[-2500, -3000], 200], [[-1300, 3500], 60], [[-3900, -1100], 300], [[300, -4000], 140], [[-4500, -3300], 40], [[1800, 2600], 220]] as [XY, number][])
    tryPlace("eastheights:struck_tree", at, h, 200, { solid: ring(30, "tree") });
  for (const [ref, at, h] of [
    ["southsands:scorched_rock", [-1500, -1000], 30], ["southsands:fulgurite", [-2200, 1400], 0], ["southsands:fulgurite", [100, -2400], 60], ["eastheights:heath_boulder", [-3300, 900], 150],
    ["eastheights:rock_scatter", [-1600, -3900], 70], ["southsands:scorched_rock", [-4000, 1900], 200], ["westhills:storm_rocks", [-200, 3600], 120], ["eastheights:heath_boulder", [1600, 400], 10],
    ["southsands:fulgurite", [-3600, -2500], 140], ["eastheights:rock_scatter", [-500, -1400], 40],
  ] as [string, XY, number][]) tryPlace(ref, at, h, 220, { solid: ring(140) });
  // the signal keepers' cottage at the foot of the headland, roofless, its hearth cold
  {
    const C: XY = [950, -2150], h = faceTo(C, [450, -700]);
    const wall = (dx: number, dy: number, turn: number, sy = 1) => {
      const a = (h * Math.PI) / 180, x = C[0] + dx * Math.cos(a) - dy * Math.sin(a), y = C[1] + dx * Math.sin(a) + dy * Math.cos(a);
      put("steppe:ruined_wall", [x, y], h + turn, { sy, solid: [{ kind: "wall", x: 0, y: 0, w: 70, d: 400 * sy, rot: 0 }] });
    };
    wall(-260, 0, 0, 0.7);
    wall(260, 0, 0);
    wall(0, -330, 90, 1.3);
    wall(0, 330, 90, 0.9);
    put("trunrada:campfire", [C[0] + 40, C[1] + 60], 0, { solid: "none" });
    put("steppe:fallen_log", [C[0] - 520, C[1] - 260], h + 30, { s: 0.8 });
    taken.push([C[0], C[1], 620]);
  }
  // old dykes across the moor, broken by the storms
  for (const [a, b] of [[[-600, -2500], [-3400, -2600]], [[-1300, 2300], [-1400, 1100]], [[-3900, -1300], [-4400, -3300]]] as [XY, XY][]) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 400), h = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI - 90;
    for (let i = 0; i < n; i++) {
      if (rnd() < 0.18) continue;
      const at: XY = [a[0] + ((b[0] - a[0]) * (i + 0.5)) / n, a[1] + ((b[1] - a[1]) * (i + 0.5)) / n];
      tryPlace(rnd() < 0.5 ? "westfarm:drystone_wall_broken" : "westfarm:drystone_wall", at, h, 200, { solid: [{ kind: "wall", x: 0, y: 0, w: 60, d: 400, rot: 0 }] });
    }
  }
  for (const [at, h] of [[[-1900, -3500], 30], [[-3800, -3900], 160], [[1400, 2800], 80]] as [XY, number][]) tryPlace("eastheights:granite_tor", at, h, 300, { s: 0.85, solid: ring(180) });
  for (const at of [[1700, -400], [2100, -900], [-1200, 3100]] as XY[]) tryPlace("trunrada:cairn", at, rnd() * 90, 120, { solid: ring(80) });

  // the rocky shore of the moor to the east, spray on it, stacks out in the sea
  for (const { p } of every(SHORE.slice(14), 340)) {
    if (Math.abs(p[0]) > R + 1500) continue;
    put(rnd() < 0.5 ? "westhills:storm_rocks" : "steppe:boulder", [p[0] + (rnd() - 0.5) * 120, p[1] - 80 + (rnd() - 0.5) * 80], rnd() * 360, { s: 0.4 + rnd() * 0.4, solid: "none", z: -8 });
    if (rnd() < 0.35) put("westhills:sea_spray", [p[0], p[1] - 160], rnd() * 360, { s: 0.6 + rnd() * 0.4, solid: "none", z: -10 });
  }
  for (const [x, y, h, s] of [[5600, 3800, 30, 1.1], [6100, 900, 140, 1.4], [5700, -1100, 250, 1], [6000, -3900, 60, 1.5], [4400, -5300, 200, 1.1], [2300, -5600, 100, 1.3], [-800, -5500, 300, 0.9], [-3200, -6000, 20, 1.2], [7000, -2400, 110, 1.6], [3600, -6600, 40, 1.4]] as number[][])
    put(rnd() < 0.5 ? "steppe:sea_stack" : "eastcoast:sea_stack", [x, y], h, { s, solid: "none", z: -14 });
  for (const p of SHORE.slice(0, 13).filter(([x, y]) => Math.abs(x) < A - 300 && Math.abs(y) < A - 300 && !onBeach(x - 200, y)))
    for (let k = 0; k < 2; k++) put("steppe:boulder", [p[0] + 220 + rnd() * 120, p[1] + (rnd() - 0.5) * 700], rnd() * 360, { s: 0.4 + rnd() * 0.4, solid: "none", z: -10 });

  // ---- crooked pines in the lee, heather, grass beaten flat ----
  for (const [c, r, n] of [
    [[1500, 4300], 700, 4], [[-800, 4200], 500, 2], [[-2800, -3800], 700, 4], [[1000, -2300], 600, 3], [[-4400, -2200], 600, 3], [[-2700, 3900], 600, 3],
    [[2900, -2500], 500, 2], [[-1200, 2300], 500, 2], [[3300, 4800], 400, 2], [[-500, -3300], 600, 3], [[1800, -3800], 500, 3], [[-3900, 3000], 500, 2],
  ] as [XY, number, number][])
    for (let i = 0, made = 0; i < n * 20 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      const h = lee(), tx = x + Math.cos((h * Math.PI) / 180) * 170, ty = y + Math.sin((h * Math.PI) / 180) * 170;
      if (!inBox(x, y, 250) || !fits(tx, ty, 260) || !f.level(x, y, 220)) continue;
      const s = 0.8 + rnd() * 0.35;
      place("eastheights:bent_pine", [x, y], h, 230 * s, { s, solid: [{ kind: "tree", x: 170, y: 0, r: 30 }] });
      made++;
    }
  scatter({ x0: -R, x1: R, y0: -R, y1: R }, 95, ["eastheights:heather"], 110, (x, y) => inBox(x, y, 200) && !onBeach(x, y), { s: [0.75, 1.15], solid: "none", tries: 5000, head: lee });
  scatter({ x0: -R, x1: R, y0: -R, y1: R }, 26, ["steppe:boulder_flat", "steppe:rock_cluster", "eastheights:heath_boulder", "eastheights:rock_scatter"], 180, (x, y) => inBox(x, y, 250) && !onBeach(x, y), { s: [0.55, 0.9], solid: 110 });
  scatter({ x0: -R - 400, x1: R + 400, y0: -R - 400, y1: R + 400 }, 420, ["eastheights:bent_grass", "eastheights:bent_grass", "steppe:grass_tuft"], 60, (x, y) => !onBeach(x, y) && !wet(x, y, 100), { s: [0.7, 1.2], solid: "none", tries: 12000, head: lee });
  // the beach: stones, weed, driftwood
  scatter({ x0: 1900, x1: 3800, y0: -500, y1: 2400 }, 12, ["eastheights:rock_scatter", "steppe:boulder", "steppe:fallen_log"], 150, onBeach, { s: [0.5, 0.8], solid: 90 });

  // ---- past the edges: the heights going on west, the moor south (crooked pines, rocks) ----
  const outside = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || onTrack(x, y, 300) || wet(x, y, 300);
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["bent_pine", "bent_pine", "heath_boulder", "heather", "bent_grass", "bent_grass", "struck_tree"], outside, { count: 190, spacing: 520, tries: 6000, kit: "eastheights" });

  // ---- monsters: the moor, both tablelands, the headland and its crag, the beach ----
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, {
    step: 760, max: 52,
    keepOut: (x, y) => Math.hypot(x - 2250, y - 1400) < 700 || Math.hypot(x - TOWER[0], y - TOWER[1]) < 650,
  });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "sc_storm_mage", x: 2650, y: -1400, face: 120, name: "อิกนาซ", title: "นักเวทศึกษาสายฟ้าจากคราเดีย", role: "talk",
      look: { gender: "male", hair: "", hairColor: "blue", eyes: "violet", top: "top_priestess_black", bottom: "bottom_priestess_black" },
      lines: [
        "เสาเหล็กพวกนี้ข้าปักไว้ล่อฟ้า ทุกครั้งที่สายฟ้าฟาดลงมา ข้าจดไว้ว่าพลังมันแรงแค่ไหน",
        "ภูตพายุหมุนเกิดจากฟ้าผ่าที่ไม่มีที่ลง มันหมุนวนอยู่บนทุ่งจนกว่าจะเจอเหยื่อ อย่าไปยืนใกล้เสาตอนพายุเข้า",
        "หอส่งสัญญาณบนปลายแหลมเคยจุดไฟเตือนเรือ ตั้งแต่มันพัง เรือก็มาเกยหินในอ่าวไม่เว้นแต่ละปี",
      ],
    },
    {
      id: "sc_castaway", x: 2150, y: 1200, face: 200, name: "ตาเฒ่ากัสปาร์", title: "กะลาสีเรือแตก", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_warrior_navy", bottom: "bottom_warrior_cocoa" },
      lines: [
        "เรือข้าหักกลางลำตั้งแต่คืนพายุใหญ่ ลูกเรือคนอื่นไปไหนหมดก็ไม่รู้ เหลือข้าเฝ้าซากมันอยู่คนเดียว",
        "ฮาร์ปีลมหนาวมันบินมาจากหน้าผาทางเหนือ ชอบมาคุ้ยซากเรือหาของแวววาว",
        "ข้ามทุ่งลงใต้ไปจะเจอที่ที่ก้อนหินลอยอยู่กลางฟ้า ข้าเห็นกับตาตอนเดินหาน้ำจืด",
      ],
    },
  ];

  REPORT = () => [`placements ${f.puts.length}`, ...fieldReport(f, ground)];
  return f.finishField({
    ground,
    scenery: [sea, shingle.mesh],
    sky: "#6d7a84",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -80, y: 4300 },
    npcs,
    labels: [
      { x: W_EXIT[0], y: W_EXIT[1] - 300, text: "ทางไปที่ราบสูงลมแรง", kind: "gate" },
      { x: S_EXIT[0] + 300, y: S_EXIT[1], text: "ทางไปทุ่งหินลอย", kind: "gate" },
      { x: TOWER[0] - 700, y: TOWER[1], text: "หอส่งสัญญาณพัง" },
      { x: 4000, y: -3500, text: "ปลายแหลมพายุ", kind: "small" },
      { x: 2300, y: 1500, text: "อ่าวเรือแตก" },
      { x: -1200, y: -500, text: "ทุ่งเสาล่อฟ้า" },
      { x: 3000, y: 3900, text: "ผาลมตะวันตก", kind: "small" },
      { x: -3300, y: 3300, text: "ที่ราบสูงลมกรรโชก", kind: "small" },
    ],
  });
}
