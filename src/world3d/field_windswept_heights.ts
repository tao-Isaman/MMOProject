// ที่ราบสูงลมแรง (windswept_heights), monsters Lv 56-66: the high grassland east of the horse
// meadow, where the wind comes in off the northern sea and lays the grass over all one way. The
// land stands in three tablelands round a sheltered basin:
//   - the north heights (4.2 m) run the whole length of the coast and end in cliffs over the sea,
//     narrow in the west where they go on as the horse meadow's bluffs, broad in the east toward
//     the storm cape; on them crooked pines, heather and tors, the spring whose stream drops off
//     their edge in a waterfall into the tarn below, and on their higher step (7.8 m) the
//     warrior's face carved in a standing block, looking out over the tablelands;
//   - the barrow field (4.5 m) in the south-west, the tableland the old horse lords buried their
//     dead on: the great barrow in its kerb of carved stones with its passage and its row of
//     stone idols, lesser kurgans, and on its tip over the basin the nomads' ovoo, heaped with
//     stones and hung with blue scarves;
//   - the wind garden (5.5 m) in the south-east, its stone carved by the wind into mushrooms and an
//     arch, the arch on a higher step (8.3 m);
//   - the basin between them: wind-laid grass, the tarn under the waterfall, the black tents of the
//     yak herders by it, and the river running out of it south through a canyon (the one that
//     comes out on the plain of old stones) under a plank bridge.
// The sea lies along the whole north; the meadow goes on west, the canyon south, the pass east
// between the north heights and the wind garden runs on to the storm cape. The yaks graze
// everywhere, the eagles hang over the tablelands.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: west (n 0.47, where horse_meadow's way east meets it) -> horse_meadow,
//             south (e 0.57, the canyon track, as stone_plain's way north) -> stone_plain,
//             east (the middle, n 0.50) -> storm_cape

import * as THREE from "three";
import { FieldBuilder } from "./field";
import { useKits } from "./town";
import type { Town } from "./town";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";
import { KIT as HEIGHTS } from "./kits/eastheights";
import { smooth, band, inPoly, distTo, faceDir, faceTo, seaSheet } from "./kits/eastcoast";
import type { XY, Poly } from "./kits/eastcoast";
import { KIT as STEPPE, fieldReport, fenceRun } from "./kits/steppe";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { KIT as SOUTHSANDS } from "./kits/southsands";

useKits(HEIGHTS, STEPPE, TRUNRADA, SOUTHSANDS);

// the last build's own check (see fieldReport), for building the field; the game never calls it
export let REPORT: () => string[] = () => [];

const R = 5500; // the walkable bounds, +-R
const A = 9000; // the ground's area, +-A

// ---- the levels ----
// the north heights' cliff top over the sea, west to east (past both edges)
const COAST: XY[] = [[4250, A + 400], [4200, 5500], [4300, 4300], [4550, 3100], [4450, 1900], [4650, 700], [4500, -500], [4750, -1700], [4600, -2900], [4800, -4000], [4550, -5000], [4500, -5800], [4550, -A - 400]];
// and their foot on the land side, east to west
const HN_S: XY[] = [[600, -A - 400], [700, -5500], [850, -4500], [1300, -3700], [2050, -2900], [2350, -2000], [2300, -1100], [2500, -200], [2900, 800], [3250, 1900], [3400, 3000], [3500, 4100], [3550, 5300], [3600, A + 400]];
const HN: Poly = [...COAST, ...HN_S];
// the warrior's step on them
const HN2: Poly = [[2600, -2500], [3500, -2300], [4050, -2900], [4000, -4100], [3200, -4600], [2400, -4200], [2350, -3300]];
// the barrow field (its canyon side matching the plain of old stones' henge plateau)
const HSW: Poly = [[-A - 400, -330], [-5500, -330], [-4000, -150], [-2800, -250], [-2100, -20], [-1700, 800], [-1650, 1800], [-2150, 2800], [-3000, 3550], [-3900, 4150], [-4700, 4850], [-5150, 5700], [-5300, A + 400], [-A - 400, A + 400]];
// the wind garden (its canyon side matching the plain's east plateau) and its step
const HSE: Poly = [[-A - 400, -A - 400], [-1550, -A - 400], [-1500, -5500], [-1550, -4600], [-1400, -3700], [-1500, -2900], [-1900, -2440], [-2700, -2230], [-4000, -2430], [-5500, -2270], [-A - 400, -2250]];
const HSE2: Poly = [[-2900, -3200], [-2800, -4300], [-3600, -5000], [-4700, -4600], [-4800, -3500], [-3900, -2950]];

// A ramp off the edge a -> b of a plateau, `t` along it: its top on the edge, its foot `len` out
// from it, square to the edge.
function rampOn(poly: Poly, a: XY, b: XY, t: number, len: number, width: number): { top: XY; bottom: XY; width: number } {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), top: XY = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
  if (inPoly(poly, top[0] + nx * 60, top[1] + ny * 60)) [nx, ny] = [-nx, -ny];
  return { top, bottom: [top[0] + nx * len, top[1] + ny * len], width };
}
const R_N = rampOn(HN, [3250, 1900], [3400, 3000], 0.55, 1350, 460);
const R_N2 = rampOn(HN2, [2600, -2500], [3500, -2300], 0.5, 1150, 440);
const R_SW = rampOn(HSW, [-1700, 800], [-1650, 1800], 0.5, 1400, 460);
const R_SE = rampOn(HSE, [-1400, -3700], [-1500, -2900], 0.5, 1650, 460);
const R_SE2 = rampOn(HSE2, [-2900, -3200], [-2800, -4300], 0.5, 950, 420);
const lenOf = (r: { top: XY; bottom: XY }) => Math.hypot(r.top[0] - r.bottom[0], r.top[1] - r.bottom[1]);
const toward = (a: XY, b: XY, d: number): XY => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [a[0] + ((b[0] - a[0]) / L) * d, a[1] + ((b[1] - a[1]) / L) * d];
};
// a ramp's way: from `inn` before its foot, up it, and `out` on past its top
const climb = (r: { top: XY; bottom: XY }, inn = 350, out = 350): XY[] => [toward(r.bottom, r.top, -inn), r.bottom, r.top, toward(r.bottom, r.top, lenOf(r) + out)];

// ---- water: the tarn under the falls, the river out of it south through the canyon ----
const FALL: XY = [2580, 0]; // the lip, on the north heights' edge
const FALL_H = faceDir(-0.93, 0.37); // the falls face out over the tarn
const TARN: Poly = [[2440, 170], [2440, -160], [2050, -560], [1600, -680], [1200, -480], [1020, 0], [1180, 520], [1650, 780], [2120, 660], [2400, 400]];
const RIVER: XY[] = smooth([[1250, -350], [500, -620], [-300, -960], [-1200, -1200], [-2200, -1350], [-3300, -1460], [-4400, -1460], [-5500, -1400], [-A - 600, -1400]], 4);
const RIVER_W = 620;

// ---- the tracks and the ways out ----
const W_EXIT: XY = [-380, 5150], S_EXIT: XY = [-5150, -760], E_EXIT: XY = [0, -5150];
const J: XY = [-800, -150]; // where the way south leaves the main track
const BRIDGE: XY = [-1150, -1190];
const MAIN: XY[] = smooth([[-380, A + 200], W_EXIT, [-320, 4300], [-60, 3300], [140, 2300], [-120, 1350], [-500, 500], J, [-1000, -650], BRIDGE, [-1000, -1800], [-500, -2500], [150, -3050], [180, -3700], [40, -4400], E_EXIT, [0, -A - 200]]);
const SOUTH: XY[] = smooth([J, [-1700, -450], [-2700, -780], [-3700, -800], [-4500, -770], S_EXIT, [-A - 200, -760]]);
const UP_SW: XY[] = [...smooth([[-120, 1350], climb(R_SW, 200)[0]]), ...climb(R_SW, 200).slice(1), ...smooth([climb(R_SW, 200, 300)[3], [-2100, 1350], [-2350, 1800], [-2300, 2400]])];
const OVOO: XY = [-2650, 450];
const TO_OVOO: XY[] = smooth([[-2100, 1350], [-2250, 900], [-2300, 720]]);
const BARROW: XY = [-4000, 2400];
const CAMP: XY = [1100, 1800];
const UP_N: XY[] = [...smooth([[-60, 3300], [700, 3150], [1400, 2950], climb(R_N, 300)[0]]), ...climb(R_N, 300).slice(1), ...smooth([climb(R_N)[3], [3800, 1900], [3950, 900], [4100, -200], [3800, -1000], climb(R_N2, 300)[0]]), ...climb(R_N2, 300).slice(1), ...smooth([climb(R_N2)[3], [2950, -3000], [2900, -3450]])];
const WARRIOR: XY = [3350, -3450];
const UP_SE: XY[] = [...smooth([[150, -3050], climb(R_SE, 150)[0]]), ...climb(R_SE, 150).slice(1), ...smooth([climb(R_SE, 150, 350)[3], [-1700, -3500], R_SE2.bottom]), R_SE2.top, ...smooth([climb(R_SE2)[3], [-3500, -3750], [-3750, -3450]])];
const TO_TARN: XY[] = smooth([[-500, 500], [300, 450], [800, 300]]);
const TRACKS = [MAIN, SOUTH, UP_SW, TO_OVOO, UP_N, UP_SE, TO_TARN];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(526, {
    hills: [
      // the basin and the meadow rolling, swells on the tablelands
      { x: 600, y: 3900, r: 1300, h: 130 }, { x: -1100, y: 2600, r: 1000, h: 110 }, { x: 1800, y: 4300, r: 900, h: 90 },
      { x: -200, y: -2200, r: 900, h: 80 }, { x: 1200, y: -2900, r: 700, h: 70 }, { x: -800, y: 3900, r: 800, h: -70 },
      { x: -4300, y: 3000, r: 1300, h: 120 }, { x: -3300, y: 600, r: 900, h: 90 }, { x: 3600, y: -5000, r: 900, h: 80 },
      { x: -2600, y: -4600, r: 900, h: 90 }, { x: 1600, y: -4600, r: 900, h: 100 },
      // the meadow rolling on west, toward the horse meadow's hills
      { x: 300, y: 7600, r: 2400, h: 260 }, { x: -2600, y: 7200, r: 1800, h: 200 },
    ],
    plateaus: [
      { poly: HN, h: 420, ramps: [R_N] },
      { poly: HN2, h: 780, ramps: [R_N2] },
      { poly: HSW, h: 450, ramps: [R_SW] },
      { poly: HSE, h: 550, ramps: [R_SE] },
      { poly: HSE2, h: 830, ramps: [R_SE2] },
    ],
    rock: "Eastheights_CliffHeath",
    keep: [FALL],
  });
  const { put, rnd } = f;

  // ---- the ground: steppe grass, tracks of bare earth, the sea, the tarn and the river ----
  const SEA_EDGE: XY[] = COAST.map(([x, y]) => [x + 280, y]);
  const SEA: Poly = [...SEA_EDGE, [A + 600, -A - 600], [A + 600, A + 600]];
  const river = band(RIVER, RIVER_W);
  const roads = [band(MAIN, 480), band(SOUTH, 440), band(UP_SW, 420), band(TO_OVOO, 360), band(UP_N, 420), band(UP_SE, 420), band(TO_TARN, 360)];
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], water: [SEA, TARN, river], base: "steppe", road: [0.86, 0.8, 0.68] });
  // the grass browned by the wind on the tablelands, greener in the basin's shelter
  {
    const geo = ground.mesh.geometry, pos = geo.getAttribute("position"), col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = ground.mesh.position.x + pos.getX(i), y = -(ground.mesh.position.z + pos.getZ(i)), z = pos.getY(i);
      // (and combed into long streaks running with the wind, north to south)
      const up = Math.min(1, Math.max(0, (z - 200) / 300)), n = (Math.sin(x / 830 + y / 610) + Math.sin(x / 270 - y / 390)) * 0.02 + 0.045 * Math.sin(y / 260 + 2.2 * Math.sin(x / 900)) + 0.025 * Math.sin(y / 120 + x / 1300);
      col.set([1 + 0.04 * up + n, 0.98 - 0.05 * up + n, 0.93 - 0.08 * up + n], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    (ground.mesh.material as THREE.MeshStandardMaterial).vertexColors = true;
  }

  // the sea, the tarn and the river: the water, and solids along the edges
  const sea = seaSheet([...SEA_EDGE.map(([x, y]) => [x - 120, y] as XY), [30000, -30000], [30000, 30000]], -14, "WaterSea");
  const fresh = f.waterSheet({ x0: -A - 800, x1: 2600, y0: -2000, y1: 1000 }, -14, "WaterSea");
  f.blockBand(SEA_EDGE.filter(([, y]) => Math.abs(y) < R + 1500).map(([x, y]) => [x - 40, y] as XY), 260, { kind: "sea" });
  f.blockBand(RIVER.filter(([x]) => x > -R - 900), RIVER_W + 80, { gaps: [BRIDGE], gapR: 230 });
  const TARN_IN = TARN.map(([x, y]): XY => [1700 + (x - 1700) * 0.86, 50 + (y - 50) * 0.86]);
  f.blockBand([...TARN_IN, TARN_IN[0]], 300);

  // ---- placing things clear of each other, the tracks, the water and the cliffs ----
  const taken: [number, number, number][] = [];
  const onTrack = (x: number, y: number, m: number) => TRACKS.some((t) => distTo(t, x, y) < m) || [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const wet = (x: number, y: number, m = 0) => inPoly(SEA, x, y) || inPoly(TARN, x, y) || distTo(RIVER, x, y) < RIVER_W / 2 + m || distTo([...TARN, TARN[0]], x, y) < m;
  const free = (x: number, y: number, r: number) => !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r);
  const fits = (x: number, y: number, r: number, m = r) => f.level(x, y, Math.min(r, 260)) && !onTrack(x, y, m + 230) && free(x, y, r) && !wet(x, y, r + 120);
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
  // the wind lays everything over toward the south (-X): grass, heather and pines all face it
  const downwind = () => (rnd() - 0.5) * 30;
  const low = (x: number, y: number) => ![HN, HSW, HSE].some((p) => inPoly(p, x, y));

  // ---- the ways out ----
  f.exit("horse_meadow", W_EXIT, [-330, 4450]);
  f.exit("stone_plain", S_EXIT, [-4450, -770]);
  f.exit("storm_cape", E_EXIT, [40, -4450]);
  place("steppe:signpost", [-900, 4700], faceDir(-1, 0), 60, { solid: ring(25, "post") });
  place("trunrada:cairn", [200, 4850], 0, 150, { solid: ring(90) });
  place("eastheights:prayer_flags", [250, 4300], 0, 330, { s: 0.9, solid: [{ kind: "post", x: 0, y: -300, r: 22 }, { kind: "post", x: 0, y: 300, r: 22 }] });
  taken.push([W_EXIT[0], W_EXIT[1], 650]);
  place("steppe:signpost", [-4350, -1030], faceDir(0, 1), 60, { solid: ring(25, "post") });
  taken.push([S_EXIT[0], S_EXIT[1], 650]);
  place("steppe:signpost", [-550, -4700], faceDir(0, 1), 60, { solid: ring(25, "post") });
  place("trunrada:cairn", [500, -4800], 0, 120, { solid: ring(80) });
  taken.push([E_EXIT[0], E_EXIT[1], 650]);

  // ---- the river and its bridge, the tarn and the falls ----
  {
    const d = RIVER.findIndex(([x]) => x < BRIDGE[0]), a = RIVER[Math.max(0, d - 1)], b = RIVER[d];
    const across: XY = [-(b[1] - a[1]), b[0] - a[0]], L = Math.hypot(across[0], across[1]);
    const h = (Math.atan2(across[1] / L, across[0] / L) * 180) / Math.PI;
    place("steppe:plank_bridge", BRIDGE, h, 0, { solid: [{ kind: "rail", x: 0, y: -205, w: 1100, d: 24, rot: 0 }, { kind: "rail", x: 0, y: 205, w: 1100, d: 24, rot: 0 }] });
    taken.push([BRIDGE[0], BRIDGE[1], 560]);
  }
  for (const p of RIVER) taken.push([p[0], p[1], RIVER_W / 2 + 60]);
  put("southsands:waterfall", FALL, FALL_H, { s: 0.84, solid: [{ kind: "rock", x: 60, y: 0, w: 140, d: 440, rot: 0 }] });
  taken.push([FALL[0], FALL[1], 350], [FALL[0] + 500, FALL[1] - 200, 380]);
  const SPRING: XY = [FALL[0] + Math.cos((FALL_H * Math.PI) / 180) * 1060, FALL[1] + Math.sin((FALL_H * Math.PI) / 180) * 1060];
  place("southsands:spring_pool", SPRING, FALL_H + 20, 260, { s: 0.75, solid: ring(150, "water") });
  for (const [x, y, h, s] of [[1500, -700, 30, 0.7], [1050, 600, 120, 0.6], [2250, 650, 200, 0.6]] as number[][]) tryPlace("southsands:river_rocks", [x, y], h, 120, { s, solid: "none" });

  // ---- the herders' camp by the tarn: black tents, the dung walls, flags, a fire ----
  const tent: SolidSpec[] = [{ kind: "tent", x: 0, y: 0, w: 640, d: 500, rot: 0 }, { kind: "wall", x: 470, y: 0, w: 70, d: 420, rot: 0 }];
  place("eastheights:herder_tent", CAMP, faceTo(CAMP, [500, 2300]), 520, { solid: tent });
  place("eastheights:herder_tent", [2050, 2150], faceTo([2050, 2150], [1400, 1900]), 480, { s: 0.85, solid: tent });
  place("eastheights:prayer_flags", [1650, 1300], 70, 320, { solid: [{ kind: "post", x: 0, y: -300, r: 22 }, { kind: "post", x: 0, y: 300, r: 22 }] });
  place("trunrada:campfire", [1600, 1950], 0, 160, { solid: ring(90, "fire") });
  place("trunrada:drying_rack", [2450, 1450], faceDir(-1, 0.4), 160);
  for (const [x, y, h] of [[1700, 2550, 20], [1850, 2620, 70]] as number[][]) tryPlace("common:crate", [x, y], h, 60);
  // the yak pen by the camp, empty since the herd went wild, its gate hanging open
  {
    const P: XY[] = [[180, 700], [780, 700], [780, 1250], [180, 1250]], mid: XY = [480, 975];
    for (let i = 0; i < 4; i++) fenceRun(f, P[i], P[(i + 1) % 4], mid, i === 1 ? { gates: [0.5] } : i === 3 ? { broken: [0] } : {});
    taken.push([mid[0], mid[1], 420]);
    tryPlace("steppe:water_trough", [620, 1400], 90, 120);
  }

  // ---- the north heights: the falls' spring, crooked pines, heather, tors, a kurgan, flags ----
  for (const [ref, at, h, r] of [
    ["eastheights:granite_tor", [3900, 3300], 30, 320], ["eastheights:granite_tor", [1800, -4700], 140, 320], ["eastheights:heath_boulder", [3650, 1150], 60, 180],
    ["eastheights:heath_boulder", [4100, -1200], 200, 180], ["eastheights:rock_scatter", [3300, -2000], 90, 230], ["eastheights:rock_scatter", [2700, -5100], 30, 230],
  ] as [string, XY, number, number][]) tryPlace(ref, at, h, r, { solid: ring(r * 0.62) });
  place("steppe:kurgan", [1700, -3600], 80, 760, { s: 0.8, solid: [{ kind: "landmark", x: 0, y: 0, r: 600 }, { kind: "stone", x: -680, y: 0, w: 150, d: 120, rot: 0 }] });
  tryPlace("eastheights:prayer_flags", [4000, -500], 90, 330, { solid: [{ kind: "post", x: 0, y: -300, r: 22 }, { kind: "post", x: 0, y: 300, r: 22 }] });
  tryPlace("trunrada:cairn", [4200, 2400], 0, 120, { solid: ring(80) });
  // the warrior's face on its step, looking out to sea; cairns and flags round it
  place("eastheights:warrior_stone", WARRIOR, 0, 240, { solid: [{ kind: "stone", x: 0, y: 0, w: 150, d: 190, rot: 0 }] });
  place("eastheights:prayer_flags", [3700, -4000], 90, 330, { solid: [{ kind: "post", x: 0, y: -300, r: 22 }, { kind: "post", x: 0, y: 300, r: 22 }] });
  for (const at of [[3650, -2700], [3700, -4100], [2700, -3000]] as XY[]) tryPlace("trunrada:cairn", at, rnd() * 90, 120, { solid: ring(80) });

  // ---- the barrow field: the great barrow and its idols, lesser kurgans, the ovoo on the tip ----
  const BH = 180; // the barrow's passage faces north, over the basin
  place("eastheights:burial_mound", BARROW, BH, 900, {
    solid: [{ kind: "landmark", x: 0, y: 0, r: 730 }, { kind: "wall", x: -840, y: 0, w: 420, d: 260, rot: 0 }, { kind: "stone", x: -1000, y: -98, r: 40 }, { kind: "stone", x: -1000, y: 98, r: 40 }, { kind: "stone", x: -1280, y: -280, r: 45 }, { kind: "stone", x: -1280, y: 280, r: 45 }],
  });
  taken.push([BARROW[0] + 1150, BARROW[1], 450]);
  for (let k = 0; k < 4; k++) {
    // a row of idols beside the barrow's forecourt, looking out north the way the dead lord did
    const at: XY = [-3550 + k * 220, 3250 + (k % 2) * 40];
    tryPlace("steppe:stone_idol", at, 180 + (rnd() - 0.5) * 16, 80, { solid: ring(40, "stone") });
  }
  place("steppe:kurgan", [-4500, 500], 200, 760, { s: 0.85, solid: [{ kind: "landmark", x: 0, y: 0, r: 620 }, { kind: "stone", x: -680, y: 0, w: 150, d: 120, rot: 0 }] });
  place("steppe:kurgan", [-4700, 3700], 150, 700, { s: 0.7, solid: [{ kind: "landmark", x: 0, y: 0, r: 620 }, { kind: "stone", x: -680, y: 0, w: 150, d: 120, rot: 0 }] });
  for (const [x, y, h] of [[-3300, 3500, 20], [-5000, 2000, 100], [-2400, 2500, 200], [-4900, -100, 60]] as number[][]) tryPlace("trunrada:standing_stone", [x, y], h, 90, { solid: ring(50, "stone") });
  place("eastheights:nomad_shrine", OVOO, faceTo(OVOO, [-1800, 600]), 300, { solid: [{ kind: "cairn", x: 0, y: 0, r: 200 }, { kind: "stone", x: -245, y: 0, r: 55 }] });
  taken.push([OVOO[0], OVOO[1], 480]);
  tryPlace("eastheights:granite_tor", [-5000, 3300], 60, 320, { solid: ring(200) });
  tryPlace("eastheights:heath_boulder", [-3200, -0], 100, 180, { solid: ring(120) });
  tryPlace("eastheights:rock_scatter", [-1950, 3200], 0, 230, { solid: ring(150) });

  // ---- the wind garden: rocks the wind has carved, the arch on its step ----
  place("eastheights:wind_rock_arch", [-3850, -4050], 15, 420, { solid: [{ kind: "rock", x: 0, y: -255, r: 120 }, { kind: "rock", x: 0, y: 255, r: 120 }] });
  for (const [at, h, s] of [[[-2200, -4800], 30, 1], [[-4700, -2900], 120, 0.85], [[-2250, -2850], 250, 0.75], [[-4300, -5200], 80, 0.8], [[-1900, -5300], 190, 0.7]] as [XY, number, number][])
    tryPlace("eastheights:wind_rock_mushroom", at, h, 260 * s, { s, solid: ring(110 * s) });
  tryPlace("eastheights:granite_tor", [-3300, -4600], 200, 300, { s: 0.8, solid: ring(170) });
  tryPlace("eastheights:rock_scatter", [-4600, -3800], 0, 230, { solid: ring(150) });

  // ---- the basin and the meadow: boulders, rock shelves, a cart left by the herders ----
  for (const [ref, at, h] of [
    ["eastheights:heath_boulder", [-1300, 3400], 30], ["eastheights:rock_scatter", [1900, 4100], 120], ["eastheights:heath_boulder", [-600, -2900], 200],
    ["eastheights:rock_scatter", [-1400, 600], 60], ["steppe:boulder", [1000, -2700], 80], ["eastheights:heath_boulder", [2300, 3300], 140], ["steppe:boulder_flat", [-200, -1700], 20],
  ] as [string, XY, number][]) tryPlace(ref, at, h, 220, { solid: ring(140) });
  tryPlace("trunrada:cart", [600, 3600], faceDir(-0.4, 1), 220);
  // smaller rocks the wind has worn into odd shapes, out on the open grass
  for (const [at, h, s] of [[[-1100, 2300], 40, 0.55], [[1500, 3700], 160, 0.6], [[-600, -2100], 250, 0.5], [[2700, 4400], 80, 0.6], [[3300, -5000], 10, 0.55]] as [XY, number, number][])
    tryPlace("eastheights:wind_rock_mushroom", at, h, 260 * s, { s, solid: ring(110 * s) });

  // ---- crooked pines in the lee of the tablelands, heather, grass laid over by the wind ----
  const pine = (x: number, y: number, s: number) => {
    place("eastheights:bent_pine", [x, y], downwind(), 230 * s, { s, solid: [{ kind: "tree", x: 170, y: 0, r: 30 }] });
  };
  for (const [c, r, n] of [
    [[3900, 4600], 500, 3], [[3700, -100], 600, 3], [[2900, -4800], 700, 4], [[1400, -4200], 500, 2], [[4100, -3600], 400, 2],
    [[-1600, 2600], 500, 2], [[2000, 3900], 500, 2], [[-2700, -2800], 600, 3], [[-4900, 1200], 600, 3], [[-3500, 4500], 500, 2], [[700, -2200], 400, 2],
  ] as [XY, number, number][])
    for (let i = 0, made = 0; i < n * 20 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!inBox(x, y, 250) || !fits(x + 170, y, 260) || !f.level(x - 80, y, 220)) continue;
      pine(x, y, 0.8 + rnd() * 0.35);
      made++;
    }
  scatter({ x0: -R, x1: R, y0: -R, y1: R }, 70, ["eastheights:heather"], 110, (x, y) => inBox(x, y, 200) && (!low(x, y) || rnd() < 0.3), { s: [0.75, 1.2], solid: "none", tries: 6000, head: downwind });
  scatter({ x0: -R, x1: R, y0: -R, y1: R }, 14, ["steppe:scrub"], 100, (x, y) => inBox(x, y, 200) && low(x, y), { s: [0.7, 1], solid: "none" });
  scatter({ x0: -R, x1: R, y0: -R, y1: R }, 16, ["steppe:boulder_flat", "steppe:rock_cluster", "eastheights:heath_boulder"], 180, (x, y) => inBox(x, y, 250), { s: [0.55, 0.9], solid: 110 });
  scatter({ x0: -R, x1: R, y0: -R, y1: R }, 6, ["steppe:bones"], 150, (x, y) => inBox(x, y, 300), { solid: "none" });
  // (the grass: as thick as the flowers are on the greener fields)
  scatter({ x0: -R - 400, x1: R + 400, y0: -R - 400, y1: R + 400 }, Math.round(330 + 160 * quality.flowers), ["eastheights:bent_grass", "eastheights:bent_grass", "steppe:grass_tuft"], 60, (x, y) => !wet(x, y, 80), { s: [0.75, 1.3], solid: "none", tries: 12000, head: downwind });

  // ---- past the edges: the meadow's birches and pines west, the tablelands' rocks and crooked
  // pines south and east, the canyon's trees; stacks out in the sea ----
  const outside = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || onTrack(x, y, 300) || wet(x, y, 250);
  f.woods({ x0: -A, x1: 3300, y0: R, y1: A }, ["Birch", "Birch", "Pine", "PineSmall", "AutumnTree"], (x, y) => outside(x, y) || (!low(x, y) && rnd() < 0.7), { count: 90, spacing: 480, tries: 4000 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["bent_pine", "heath_boulder", "heather", "heather", "bent_grass", "bent_grass"], (x, y) => outside(x, y) || (low(x, y) && y > R), { count: 170, spacing: 520, tries: 6000, kit: "eastheights" });
  f.woods({ x0: -A, x1: -R, y0: -2300, y1: -300 }, ["Pine", "PineSmall", "Birch"], (x, y) => outside(x, y) || !low(x, y), { count: 26, spacing: 450, tries: 1500 });
  for (const [x, y, h, s] of [[5600, 3600, 30, 1.1], [6400, 1200, 140, 1.3], [5500, -800, 250, 0.9], [6800, -2600, 60, 1.4], [5600, -4300, 200, 1], [7300, 4800, 100, 1.2], [5300, 2300, 300, 0.7], [7600, -5600, 20, 1.2]] as number[][])
    put("steppe:sea_stack", [x, y], h, { s, solid: "none", z: -14 });
  for (const p of COAST.filter(([, y]) => Math.abs(y) < A - 300)) {
    // fallen rock along the foot of the sea cliffs
    for (let k = 0; k < 2; k++) put("steppe:boulder", [p[0] + 200 + rnd() * 120, p[1] + (rnd() - 0.5) * 900], rnd() * 360, { s: 0.4 + rnd() * 0.4, solid: "none", z: -10 });
  }

  // ---- monsters: the basin, the meadow, all three tablelands and both steps (not in the camp
  // or on the barrow) ----
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, {
    step: 760, max: 54,
    keepOut: (x, y) => Math.hypot(x - CAMP[0] + 400, y - CAMP[1] + 400) < 1100 || Math.hypot(x - BARROW[0], y - BARROW[1]) < 950 || Math.hypot(x - OVOO[0], y - OVOO[1]) < 550,
  });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "wh_herder", x: 1450, y: 1700, face: 200, name: "โซลองโก", title: "คนเลี้ยงจามรีเร่ร่อน", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "ink", eyes: "amber", top: "top_adventurer_teal", bottom: "bottom_adventurer_cocoa" },
      lines: [
        "จามรีที่เห็นเดินอยู่บนที่ราบนั่น แต่ก่อนเป็นของพวกเรา พู่แดงที่เขามันคือเครื่องหมายของเผ่า",
        "พอลมเปลี่ยนทิศ ฝูงก็แตกกระเจิง ตอนนี้พวกมันดุกว่าหมาป่า เข้าใกล้ระวังโดนขวิด",
        "น้ำในบึงใต้น้ำตกนั่นไหลลงหุบผาไปถึงที่ราบหินโบราณ ใครหลงทางก็เดินตามแม่น้ำลงใต้ไปเถอะ",
      ],
    },
    {
      id: "wh_shrine_keeper", x: OVOO[0] + 380, y: OVOO[1] - 260, face: 160, name: "ผู้เฒ่าบาตู", title: "ผู้เฝ้าศาลกองหิน", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "teal", top: "top_warrior_navy", bottom: "bottom_warrior_cocoa" },
      lines: [
        "ใครผ่านมาก็วางหินไว้หนึ่งก้อน แล้วผูกผ้าสีฟ้าไว้ ลมจะพาคำอธิษฐานไปถึงฟ้า",
        "เนินใหญ่ข้างหลังข้าคือที่ฝังเจ้าม้าองค์แรก คนเฝ้าศาลรุ่นก่อน ๆ ว่ากันว่าทางเข้าไม่เคยมีใครกล้าเดินลึก",
        "หินหน้านักรบบนผาเหนือหันหน้ามองลงมาที่ราบนี้ คอยเฝ้าดูว่าพายุจากแหลมตะวันออกจะพัดอะไรมาอีก",
      ],
    },
  ];

  REPORT = () => [`placements ${f.puts.length}`, ...fieldReport(f, ground)];
  return f.finishField({
    ground,
    scenery: [sea, fresh],
    sky: "#9fb2b8",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && low(x, y), density: 0.08 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -320, y: 4300 },
    npcs,
    labels: [
      { x: W_EXIT[0] + 250, y: W_EXIT[1] - 300, text: "ทางไปทุ่งเลี้ยงม้า", kind: "gate" },
      { x: S_EXIT[0] + 300, y: S_EXIT[1], text: "ทางไปที่ราบหินโบราณ", kind: "gate" },
      { x: E_EXIT[0], y: E_EXIT[1] + 300, text: "ทางไปแหลมพายุ", kind: "gate" },
      { x: 300, y: 1000, text: "ทุ่งหญ้าลู่ลม" },
      { x: CAMP[0] - 500, y: CAMP[1], text: "ค่ายคนเลี้ยงจามรี", kind: "small" },
      { x: 1150, y: -1000, text: "บึงใต้น้ำตก" },
      { x: BARROW[0] + 900, y: BARROW[1] - 600, text: "เนินสุสานเจ้าม้า" },
      { x: -3700, y: 600, text: "ทุ่งสุสานโบราณ", kind: "small" },
      { x: OVOO[0] + 500, y: OVOO[1], text: "ศาลกองหินเร่ร่อน", kind: "small" },
      { x: WARRIOR[0] + 300, y: WARRIOR[1] + 400, text: "หินสลักหน้านักรบ" },
      { x: 3400, y: 2200, text: "ผาริมทะเลเหนือ", kind: "small" },
      { x: -3300, y: -3300, text: "สวนหินลมกัด" },
      { x: -3600, y: -1100, text: "หุบผาแม่น้ำ", kind: "small" },
    ],
  });
}
