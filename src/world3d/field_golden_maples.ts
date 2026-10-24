// ป่าเมเปิลทอง (golden_maples), monsters Lv 68-78: a wood of golden maples by the sea, west of
// the border woods, the sea along its west and its south. The way in from the caravan road (the
// middle of the north edge) comes down to a fork in the gold:
//   - up a ramp west onto the long bluff (4 m) that runs the west coast, its cliffs falling to the
//     sea, and on it a knoll (7.5 m) where the fairy stone stands in its ring of little stones,
//     lights drifting through the hole in its head; the oldest maple of the wood on the bluff too;
//   - east over the stream on a log bridge and on to the border woods (the east edge, where the
//     border woods' own way out is), past the woodcutters' camp by their cabin;
//   - south of the stream a glade where the fairies dance in a ring of red toadstools, and a ramp
//     up onto the red ridge (3.8 m) in the south-east, where the maples turn crimson as the border
//     woods come near, a Kradia patrol's lookout over the sea at its end;
//   - south-west down to where the stream runs out over a beach of golden sand into the sea.
// The stream comes in from the caravan road's grassland at the north edge (where it leaves that
// field) and runs south-west to the sea. Eastward the gold turns to red into the border woods.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: north (the middle) -> caravan_road, east (n 0.55, where the border woods' west way
//   out is) -> border_woods

import * as THREE from "three";
import { FieldBuilder } from "./field";
import { useKits } from "./town";
import type { Town } from "./town";
import { buildPaved } from "./paved";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";
import { KIT as EAST, smooth, band, inPoly, distTo, nearestOn, every, inland, faceDir, faceTo, bevel, seaSheet, COAST } from "./kits/eastcoast";
import type { XY, Poly } from "./kits/eastcoast";
import { KIT as FRONTIER } from "./kits/frontier";
import { KIT as PLAINS } from "./kits/plains";
import { KIT as WESTMOUNT } from "./kits/westmount";
import { KIT as KRADIA } from "./kits/kradia";
import { KIT as TRUNRADA } from "./kits/trunrada";

useKits(EAST, FRONTIER, PLAINS, WESTMOUNT, KRADIA, TRUNRADA);

const R = 5500; // the walkable bounds, +-R
const A = 9000; // the ground's area, +-A

// ---- the coast: down the west, round the south-west, along the south (the land on its left) ----
const SHORE: XY[] = smooth([
  [9500, 4900], [6000, 4850], [4500, 4750], [3000, 4850], [1500, 4700], [0, 4850], [-1500, 4700], [-2700, 4400], [-3600, 3800],
  [-4200, 3000], [-4550, 2000], [-4650, 1000], [-4550, 0], [-4650, -1000], [-4700, -2200], [-4650, -3400], [-4750, -4600], [-4650, -5800], [-4700, -9500],
], 4);
const SEA: Poly = [...SHORE, [-9500, -9500], [-9500, 9500], [9500, 9500]];

// ---- the levels: P1 the bluff along the west coast (4 m) and P2 the fairy stone's knoll on it
// (7.5 m); P3 the red ridge in the south-east (3.8 m), on out into the border woods' bluff ----
const P1: Poly = bevel([
  [A, 4550], [6000, 4500], [4500, 4400], [3000, 4500], [1500, 4350], [0, 4500], [-1300, 4350], [-2000, 4050], [-2300, 3500], [-2000, 2900],
  [-1100, 2300], [500, 2350], [2000, 1950], [3500, 2250], [4800, 1850], [A, 2050],
]);
const P2: Poly = [[2300, 3900], [1200, 4000], [600, 3500], [900, 2900], [1900, 2750], [2600, 3200]];
const P3: Poly = bevel([
  [-900, -2600], [-1600, -2100], [-2700, -2300], [-3600, -2000], [-4300, -2400], [-4350, -3500], [-4300, -4600], [-4350, -A],
  [-2700, -A], [-2400, -5200], [-1500, -4300], [-900, -3400],
]);
const RAMP_P1 = { top: [2750, 2050] as XY, bottom: [2970, 972] as XY, width: 460 };
const RAMP_P2 = { top: [2450, 3550] as XY, bottom: [3324, 3920] as XY, width: 420 };
const RAMP_P3 = { top: [-900, -3000] as XY, bottom: [200, -3000] as XY, width: 440 };

// ---- the stream: in at the north edge where it leaves the caravan road, out to the sea ----
const STREAM: XY[] = smooth([[A + 300, -2250], [5000, -2250], [4300, -2000], [3700, -2050], [3100, -1600], [2500, -1350], [1800, -1150], [1200, -950], [600, -600], [0, -650], [-700, -350], [-1300, -450], [-2000, -150], [-2700, 0], [-3500, 150], [-4500, 250], [-5600, 250]], 5);
const SW = 440;
const BRIDGE: XY = nearestOn(STREAM, 1950, -1150).q;
const ALONG: XY = nearestOn(STREAM, 1950, -1150).dir; // the stream's way at the bridge
const ACROSS: XY = ALONG[0] > 0 ? [ALONG[1], -ALONG[0]] : [-ALONG[1], ALONG[0]]; // across it, toward the east (the far bank)
const overBridge = (k: number): XY => [BRIDGE[0] + ACROSS[0] * k, BRIDGE[1] + ACROSS[1] * k];

// ---- the tracks ----
const N_EXIT: XY = [5150, 0], E_EXIT: XY = [600, -5150];
const J: XY = [2500, 300];
const NROAD = smooth([[A + 200, 0], N_EXIT, [4300, 150], [3300, 300], J]);
const EROAD = [...smooth([J, [2300, -400], overBridge(-650)]), BRIDGE, ...smooth([overBridge(650), [1500, -2100], [1100, -3200], [800, -4300], E_EXIT, [600, -A - 200]])];
const UP = [...smooth([J, [2800, 650], RAMP_P1.bottom]), RAMP_P1.top, ...smooth([[2950, 2600], [3350, 3300], RAMP_P2.bottom]), RAMP_P2.top, ...smooth([[2050, 3450], [1850, 3400]])];
const SPATH = smooth([J, [1600, 650], [300, 900], [-1000, 1100], [-2300, 1000], [-3300, 800], [-3900, 700]]);
const TO_CAMP = smooth([[1500, -2100], [2300, -2500], [2950, -2800]]);
const TO_RING = smooth([[1500, -2100], [800, -1950], [250, -1900]]);
const TO_P3 = [...smooth([[1100, -3200], [600, -3050], RAMP_P3.bottom]), RAMP_P3.top, ...smooth([[-1800, -3350], [-2700, -3850], [-3200, -4250]])];

// ---- the beach where the stream runs out ----
const BEACH: Poly = [[-3300, 2950], [-3450, 2500], [-3700, 2050], [-3600, 1600], [-3800, 1150], [-3650, 750], [-3550, 300], [-3700, -150], [-3850, -600], [-3700, -1050], [-3900, -1450], [-4150, -1800], [-5200, -1800], [-5300, 3200]];

const STONE: XY = [1600, 3400];
const RING: XY = [-200, -1950];
const CAMP: XY = [3300, -3000];
const LOOKOUT: XY = [-3500, -4450];

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(524, {
    hills: [
      { x: 4200, y: -3800, r: 1300, h: 150 }, { x: -3000, y: 3200, r: 900, h: 90 }, { x: 4000, y: 900, r: 900, h: 90 },
      { x: 0, y: -4500, r: 900, h: 110 }, { x: -2400, y: 1900, r: 800, h: -70 }, { x: 1300, y: 1300, r: 700, h: 70 },
      { x: -1000, y: -1600, r: 600, h: 50 }, { x: 2600, y: -4600, r: 900, h: 120 },
      // the land rolling on past the north and east edges
      { x: 7400, y: -1000, r: 2400, h: 200 }, { x: 1000, y: -7600, r: 2400, h: 220 },
    ],
    plateaus: [
      { poly: P1, h: 400, ramps: [RAMP_P1] },
      { poly: P2, h: 750, ramps: [RAMP_P2] },
      { poly: P3, h: 380, ramps: [RAMP_P3] },
    ],
    rock: COAST.cliff,
  });
  const { put, rnd } = f;

  // ---- the ground: an autumn floor of moss warmed toward gold, tracks, the stream, the sea ----
  const roads = [band(NROAD, 480), band(EROAD, 460), band(UP, 400), band(SPATH, 420), band(TO_CAMP, 360), band(TO_RING, 340), band(TO_P3, 380)];
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], water: [SEA, band(STREAM, SW)], base: "moss", road: [0.78, 0.7, 0.58] });
  (ground.mesh.material as THREE.MeshStandardMaterial).color.set("#d9b48c");
  // the golden sand where the stream runs out
  const BOX: Poly = [[-5600, -2000], [-3000, -2000], [-3000, 3300], [-5600, 3300]];
  const areaOf = (p: Poly) => p.reduce((t, [x, y], i) => t + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0);
  const hole = Math.sign(areaOf(BOX)) === Math.sign(areaOf(BEACH)) ? [...BEACH].reverse() : BEACH;
  const sand = buildPaved({
    area: { x0: -5500, y0: -1900, x1: -3100, y1: 3200 }, roads, plazas: [], base: "sand", track: true, road: [0.86, 0.8, 0.66],
    water: [[...BOX, BOX[0], ...hole, hole[0]], SEA, band(STREAM, SW)], height: (x, y) => f.h(x, y) + 4, cell: 50,
  });
  sand.mesh.renderOrder = 1;

  // ---- the water: the sea from a little under the shore out past the horizon, the stream; the
  // shore and the stream's banks closed (open at the bridge) ----
  const sea = seaSheet([...inland(SHORE, 200), [-30000, -9500], [-30000, 30000], [9500, 30000]]);
  const streamSheet = f.waterSheet({ x0: -5000, x1: A + 500, y0: -2700, y1: 600 }, -14, "WaterSea");
  f.blockBand(inland(SHORE.filter(([x, y]) => Math.abs(x) < R + 900 && Math.abs(y) < R + 900), -280), 520, { kind: "sea" });
  f.blockBand(STREAM.filter(([x]) => x > -4700), SW + 60, { gaps: [BRIDGE], gapR: 330, step: 220 });

  // ---- the ways out ----
  f.exit("caravan_road", N_EXIT, [4450, 40]);
  f.exit("border_woods", E_EXIT, [620, -4450]);

  // ---- placing things clear of each other, the tracks and the water ----
  const taken: [number, number, number][] = [];
  const onTrack = (x: number, y: number, m: number) => [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const free = (x: number, y: number, r: number) => !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r);
  const wet = (x: number, y: number, m: number) => inPoly(SEA, x, y) || distTo(SHORE, x, y) < m || distTo(STREAM, x, y) < SW / 2 + m;
  const fits = (x: number, y: number, r: number, m = r) => f.level(x, y, r) && !onTrack(x, y, m) && free(x, y, r) && !wet(x, y, r + 80);
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
  for (const ex of [N_EXIT, E_EXIT]) taken.push([ex[0], ex[1], 650]);

  // ---- the ways out: a signpost north, Kradia's patrol banners east ----
  place("frontier:signpost", [4650, 600], faceDir(-1, 0), 60, { solid: ring(25, "post") });
  place("eastcoast:milestone", [4700, -520], faceDir(0, 1), 70, { solid: ring(40, "post") });
  place("kradia:banner_pole", [950, -5000], 90, 60, { solid: ring(20, "post") });
  place("kradia:banner_pole", [250, -5000], 90, 60, { solid: ring(20, "post") });
  place("frontier:signpost", [1150, -4550], faceDir(0, 1), 60, { solid: ring(25, "post") });
  place("frontier:signpost", [2950, -150], faceTo([2950, -150], J), 60, { solid: ring(25, "post") });

  // ---- the log bridge over the stream ----
  const bridgeH = (Math.atan2(ACROSS[1], ACROSS[0]) * 180) / Math.PI;
  place("westmount:log_bridge", BRIDGE, bridgeH, 600, { solid: [{ kind: "rail", x: 0, y: -128, w: 900, d: 24, rot: 0 }, { kind: "rail", x: 0, y: 128, w: 900, d: 24, rot: 0 }] });

  // ---- the fairy stone on its knoll, the oldest maple on the bluff ----
  place("eastcoast:fairy_stone", STONE, faceTo(STONE, RAMP_P2.top), 330, { s: 1.2, solid: [{ kind: "rock", x: 0, y: 0, r: 120 }] });
  for (const [x, y] of [[1100, 3700], [2100, 3050], [1000, 3150]] as XY[]) tryPlace("eastcoast:golden_bush", [x, y], rnd() * 360, 140, { s: 0.8, solid: "none" });
  place("eastcoast:golden_maple", [4400, 3400], 30, 260, { s: 1.6, solid: [{ kind: "tree", x: 0, y: 0, r: 70 }] });
  place("eastcoast:maple_litter", [4300, 3200], 0, 1, { s: 1.4, solid: "none" });
  place("common:bench", [4000, 3050], faceTo([4000, 3050], [4400, 3400]) + 180, 90);

  // ---- the fairy ring in its glade ----
  place("eastcoast:mushroom_ring", RING, 0, 300, { s: 1.25, solid: "none" });
  for (const [x, y] of [[-650, -2350], [250, -2450], [-700, -1500]] as XY[]) tryPlace("westmount:glow_mushrooms", [x, y], rnd() * 360, 90, { solid: "none" });

  // ---- the woodcutters' camp ----
  place("eastcoast:woodcutter_hut", [CAMP[0] + 500, CAMP[1] - 200], faceTo([CAMP[0] + 500, CAMP[1] - 200], [2950, -2800]), 380, { s: 0.95 });
  place("plains:lumber_camp", [CAMP[0] - 350, CAMP[1] - 450], faceDir(0, 1), 300);
  for (const [at, h] of [[[CAMP[0] - 300, CAMP[1] + 450], 10], [[CAMP[0] + 900, CAMP[1] + 500], 80]] as [XY, number][]) tryPlace("plains:log_pile", at, h, 260);
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2, d = 900 + rnd() * 700, at: XY = [CAMP[0] + Math.cos(a) * d, CAMP[1] + Math.sin(a) * d];
    tryPlace("frontier:stump", at, rnd() * 360, 100, { solid: ring(55, "log") });
  }
  tryPlace("frontier:fallen_log", [CAMP[0] - 1100, CAMP[1] - 800], 40, 320, { solid: [{ kind: "log", x: 0, y: 0, w: 110, d: 560, rot: 0 }] });
  tryPlace("trunrada:cart", [CAMP[0] - 900, CAMP[1] + 100], 90, 200);

  // ---- the red ridge: the patrol's lookout over the sea ----
  place("frontier:watchtower", LOOKOUT, faceTo(LOOKOUT, RAMP_P3.top), 300, { solid: ring(190, "tower") });
  place("frontier:campfire", [LOOKOUT[0] + 500, LOOKOUT[1] + 400], 0, 140, { solid: ring(90, "fire") });
  tryPlace("kradia:supplies", [LOOKOUT[0] + 200, LOOKOUT[1] + 700], 30, 120);

  // ---- the beach: driftwood, rocks, a boat drawn up ----
  const onBeach = (x: number, y: number) => inPoly(BEACH, x, y) && !wet(x, y, 120);
  for (let i = 0; i < 8; i++) {
    const x = -3700 - rnd() * 1000, y = -1700 + rnd() * 4400;
    if (onBeach(x, y)) tryPlace(i % 3 ? "eastcoast:shore_rocks" : "frontier:fallen_log", [x, y], rnd() * 360, 220, { s: 0.6 + rnd() * 0.3, solid: ring(120) });
  }
  tryPlace("eastcoast:rowboat", [-4050, 1500], 40, 220, { solid: [{ kind: "boat", x: 0, y: 0, w: 380, d: 140, rot: 0 }] });
  // reeds, flat rocks and ferns along the stream's banks
  for (const { p, d } of every(STREAM, 330, 150)) {
    if (!inBox(p[0], p[1], 200) || Math.hypot(p[0] - BRIDGE[0], p[1] - BRIDGE[1]) < 800 || p[0] < -3400) continue;
    for (const s of [-1, 1]) {
      if (rnd() < 0.35) continue;
      const o = SW / 2 + 50 + rnd() * 150, at: XY = [p[0] - d[1] * s * o, p[1] + d[0] * s * o];
      if (onTrack(at[0], at[1], 180) || !f.level(at[0], at[1], 80) || !free(at[0], at[1], 70)) continue;
      const k = rnd();
      place(k < 0.5 ? "plains:reeds" : k < 0.75 ? "plains:flat_rock" : "plains:fern_clump", at, rnd() * 360, 70, { s: 0.6 + rnd() * 0.4, solid: "none" });
    }
  }
  // rocks where the sea meets the cliffs, stacks out past them
  for (const { p, d } of every(SHORE, 400)) {
    if (Math.abs(p[0]) > R + 1500 || Math.abs(p[1]) > R + 1500 || inPoly(BEACH, p[0] + d[1] * 300, p[1] - d[0] * 300) || rnd() < 0.3) continue;
    put("eastcoast:shore_rocks", [p[0] + d[1] * 120, p[1] - d[0] * 120], faceDir(d[1], -d[0]) + rnd() * 40, { s: 0.6 + rnd() * 0.5, solid: "none", z: -6 });
  }
  for (const [x, y, h, s] of [[-6000, 2600, 20, 0.9], [-6300, -1500, 140, 1], [-5800, -4300, 80, 0.8], [-3600, 6300, 200, 0.85], [800, 6400, 300, 1], [4400, 6200, 60, 0.75]] as number[][])
    put("eastcoast:sea_stack", [x, y], h, { s, solid: "none", z: -14 });

  // ---- the wood: golden maples everywhere, thinner in the glades, turning red toward the border
  // woods (the east); gold bushes, fallen leaves, logs and mossy boulders beneath ----
  const GLADES: [number, number, number][] = [[RING[0], RING[1], 900], [STONE[0], STONE[1], 750], [CAMP[0], CAMP[1], 1200], [-1500, 1800, 700], [3600, 1100, 600], [-2800, -3300, 700], [2300, -4200, 700], [500, 3300, 500], [-500, 300, 600]];
  const view = (x: number, y: number, cx: number, cy: number, r: number) => Math.hypot(x - cx, y - cy) < r || (x < cx && x > cx - r * 1.6 && Math.abs(y - cy) < r * 0.8);
  const keep = (x: number, y: number) => onTrack(x, y, 420) || view(x, y, STONE[0], STONE[1], 600) || view(x, y, RING[0], RING[1], 500) || view(x, y, LOOKOUT[0], LOOKOUT[1], 500) || Math.hypot(x - CAMP[0], y - CAMP[1]) < 1100 || inPoly(BEACH, x, y) || wet(x, y, 250);
  const kindAt = (y: number) => {
    const red = Math.max(0, Math.min(1, (-y - 1800) / 3200)); // 0 in the west .. 1 at the east edge
    const k = rnd();
    if (k < red * 0.55) return "frontier:red_maple";
    if (k < red * 0.75) return "flora:AutumnTree";
    return rnd() < 0.85 ? "eastcoast:golden_maple" : rnd() < 0.5 ? "flora:AutumnTree" : "flora:Birch";
  };
  for (let x = -R + 260; x < R; x += 560)
    for (let y = -R + 260; y < R; y += 560) {
      const px = x + (rnd() - 0.5) * 400, py = y + (rnd() - 0.5) * 400;
      if (!inBox(px, py, 150) || keep(px, py) || !f.level(px, py, 200) || !free(px, py, 200)) continue;
      const glade = GLADES.some(([gx, gy, gr]) => Math.hypot(gx - px, gy - py) < gr);
      if (glade ? rnd() < 0.88 : rnd() < 0.3) continue;
      const kind = kindAt(py);
      place(kind, [px, py], rnd() * 360, 200, { s: 0.72 + rnd() * 0.36, solid: kind.startsWith("flora:") ? "auto" : ring(kind.endsWith("red_maple") ? 48 : 50, "tree") });
    }
  for (let x = -R + 200; x < R; x += 430)
    for (let y = -R + 200; y < R; y += 430) {
      const px = x + (rnd() - 0.5) * 340, py = y + (rnd() - 0.5) * 340;
      if (!inBox(px, py, 100) || onTrack(px, py, 280) || wet(px, py, 150) || inPoly(BEACH, px, py) || !f.level(px, py, 150) || !free(px, py, 70)) continue;
      const red = py < -3000 && rnd() < 0.6, k = rnd();
      if (k < 0.36) put(red ? "frontier:leaf_litter" : "eastcoast:maple_litter", [px, py], rnd() * 360, { s: 0.8 + rnd() * 0.6, solid: "none" });
      else if (k < 0.5) put("frontier:grass_tuft", [px, py], rnd() * 360, { s: 0.8 + rnd() * 0.5, solid: "none" });
      else if (k < 0.62 && !onTrack(px, py, 420)) put(red ? "frontier:red_bush" : "eastcoast:golden_bush", [px, py], rnd() * 360, { s: 0.5 + rnd() * 0.35, solid: "none" });
      else if (k < 0.66 && !onTrack(px, py, 480)) put("frontier:boulder", [px, py], rnd() * 360, { s: 0.45 + rnd() * 0.35, solid: ring(100 * 0.6) });
      else if (k < 0.69 && !onTrack(px, py, 520) && f.level(px, py, 260)) put("frontier:fallen_log", [px, py], rnd() * 360, { s: 0.8 + rnd() * 0.3, solid: [{ kind: "log", x: 0, y: 0, w: 90, d: 480, rot: 0 }] });
      else if (k < 0.72) put("frontier:stump", [px, py], rnd() * 360, { s: 0.8 + rnd() * 0.3, solid: ring(45, "log") });
      else continue;
      taken.push([px, py, 70]);
    }

  // ---- past the edges: the wood on north toward the grassland, red into the border woods east ----
  const outside = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || onTrack(x, y, 300) || wet(x, y, 350);
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["golden_maple", "golden_maple", "golden_bush"], (x, y) => outside(x, y) || y < -R, { count: 170, spacing: 520, tries: 6000, kit: "eastcoast" });
  f.woods({ x0: -A, x1: A, y0: -A, y1: -R }, ["red_maple", "red_maple", "red_bush"], outside, { count: 120, spacing: 500, tries: 5000, kit: "frontier" });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["AutumnTree", "Birch", "AutumnTree", "Pine"], outside, { count: 120, spacing: 480, tries: 5000 });

  // ---- monsters: the wood's glades, the bluff and the knoll, the ridge, the beach ----
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, {
    step: 760, max: 52,
    keepOut: (x, y) => Math.hypot(x - CAMP[0], y - CAMP[1]) < 1000 || Math.hypot(x - STONE[0], y - STONE[1]) < 450 || Math.hypot(x - RING[0], y - RING[1]) < 300,
  });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "gm_woodcutter", x: CAMP[0] - 100, y: CAMP[1] + 200, face: 120, name: "ลุงโอ๊ค", title: "คนตัดไม้ป่าเมเปิล", role: "talk",
      look: { gender: "male", hair: "", hairColor: "auburn", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "ไม้เมเปิลทองเนื้อแข็งที่สุดในแคว้น ช่างที่คราเดียรับซื้อไปทำด้ามหอกทั้งหมด",
        "หมีใบเมเปิลพวกนั้นชอบมานอนเกลือกใบไม้ร่วง ใบไม้ติดหลังมันจนดูเหมือนกองใบไม้เดินได้ อย่าเข้าไปปลุกมันเชียว",
        "ข้ามสะพานซุงไปทางเหนือคือถนนคาราวาน ทางตะวันออกต้นไม้จะแดงขึ้นเรื่อยๆ จนถึงป่าชายแดนของคราเดีย",
      ],
    },
    {
      id: "gm_seeker", x: STONE[0] + 300, y: STONE[1] - 400, face: 150, name: "ลิเลีย", title: "นักกวีตามรอยภูต", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "amber", eyes: "violet", top: "top_priestess_forest", bottom: "bottom_priestess_forest" },
      lines: [
        "เขาว่าถ้ามองลอดรูของหินภูตตอนพระจันทร์เต็มดวง จะเห็นเมืองของภูตอีกฝั่งหนึ่ง",
        "แสงเล็กๆ ที่ลอยอยู่นั่นคือภูต พวกมันชอบเต้นรำในวงเห็ดแดงในป่าทางใต้ของลำธาร",
        "ฉันแต่งเพลงเรื่องป่านี้มาเจ็ดเพลงแล้ว แต่ยังไม่มีเพลงไหนงามเท่าใบไม้ตอนต้องแดดเย็น",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery: [sea, streamSheet, sand.mesh],
    sky: "#7d6a3e",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 4300, y: 60 },
    npcs,
    labels: [
      { x: N_EXIT[0] - 250, y: N_EXIT[1], text: "ทางไปถนนคาราวานตะวันออก", kind: "gate" },
      { x: E_EXIT[0], y: E_EXIT[1] + 250, text: "ทางไปป่าชายแดน", kind: "gate" },
      { x: STONE[0] - 600, y: STONE[1], text: "หินภูต" },
      { x: RING[0] - 500, y: RING[1], text: "วงเห็ดภูต" },
      { x: CAMP[0] - 700, y: CAMP[1], text: "ค่ายคนตัดไม้" },
      { x: BRIDGE[0] + 400, y: BRIDGE[1], text: "สะพานซุง", kind: "small" },
      { x: 4000, y: 3700, text: "เมเปิลทองพันปี", kind: "small" },
      { x: -2500, y: -3200, text: "สันเขาใบแดง" },
      { x: LOOKOUT[0] + 600, y: LOOKOUT[1], text: "หอเฝ้าระวังริมทะเล", kind: "small" },
      { x: -3900, y: 600, text: "ปากลำธาร", kind: "small" },
      { x: 300, y: 3700, text: "ผาเมเปิลริมทะเล", kind: "small" },
    ],
  });
}
