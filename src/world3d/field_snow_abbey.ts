// ผาอารามหิมะ (the snow abbey cliffs), monsters Lv 136-146: a snowy mountain at the corner of the
// land, the northern sea along its north and the western sea along its west, and on the crag at its
// very corner, over both seas, the abbey its brothers left. The mountain climbs from the snow pine
// forest that fills the south of the field in three steps: the lower terrace, a broad shelf all
// along the western sea; the upper terrace on it, where the abbey's great bell now hangs in its
// pavilion; and the crag, ten metres over the sea, where the empty church stands with the monks'
// cells behind its walls. A ramp climbs to the lower terrace and the abbey's stone stairs zigzag on
// up the other two, prayer flags strung beside them. The ascetics who stayed on meditate on the
// ledges of the terraces, barefoot in the snow; snow leopards hunt the rocks at their feet.
//
// The way in from the highland downs comes over the east edge through a gap in the ridge there
// onto the east down (the downs' long low down running on), and down a ramp into the forest. The
// way in from the primeval forest comes over the south edge through the pass between the two
// rims there, the forest's green showing through the thinning snow. The paths meet in a clearing
// in the forest; from there one goes north between the down and the mountain to the bay under the
// crag, where the abbey's old stone jetty runs out broken into the sea and stacks of rock stand in
// the water below the cliffs.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: east -> highland_downs (through the ridge's gap, n 0.645, where the downs' own way
//   west meets the edge), south -> primeval_forest (through the pass, the middle of the edge)

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits, seeded } from "./town";
import { material } from "./textures";
import { KIT as CLIFFS, ABBEY_STAIRS } from "./kits/westcliffs";
import { KIT as SNOW, blobPoly } from "./kits/snowland";
import { KIT as NORTHCOLD } from "./kits/northcold";
import { KIT as WESTHILLS } from "./kits/westhills";
import { KIT as ICEBERG } from "./kits/iceberg";
import { KIT as PLAINS } from "./kits/plains";
import { KIT as WESTMOUNT, smooth, band, inPoly, toLine, dense, towards, runAlong, rampOff, beyond } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(CLIFFS, SNOW, NORTHCOLD, WESTHILLS, ICEBERG, PLAINS, WESTMOUNT);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the sea: the north shore from the east edge into the bay under the crag, round the crag and
// down the whole west coast to the south edge (the primeval forest's shore) ----
const SHORE: XY[] = smooth([
  [6400, -A - 400], [6300, -6676], [5600, -6000], [5000, -5300], [4800, -4400], [4700, -3400], [4500, -2500], [4100, -1900], [3700, -1300], [3550, -500], [3650, 300], [3900, 900], [4300, 1300],
  [4900, 1700], [5150, 2500], [5250, 3500], [5100, 4500], [4700, 5100], [4000, 5300], [3000, 5250], [2000, 5350], [1000, 5200], [0, 5300], [-1000, 5150], [-2000, 5250], [-3000, 5100],
  [-4000, 5250], [-5000, 5200], [-5800, 5300], [-6676, 5320], [-A - 400, 5350],
], 3);
const SEA: XY[] = [...SHORE, [-A - 400, A + 400], [A + 400, A + 400], [A + 400, -A - 400]];
// the shingle at the head of the bay
const BEACH: XY[] = [[2500, -1700], [3500, -1900], [4100, -1600], [3800, -900], [3700, -200], [3750, 500], [4000, 1100], [3500, 1050], [3150, 600], [2850, -100], [2700, -900]];

// ---- the levels ----
// ED: the east down (280), the highland downs' long low down running on over the edge; M1: the
// lower terrace along the western sea (350); M2: the upper terrace on it (700); M3: the abbey's
// crag (1050), out to the sea on the north and the west. Past the edges: the ridge along the east
// (the downs' west ridge) with the gap for the way east, the two rims along the south (the
// primeval forest's north rims) with the pass between them.
const ED: XY[] = [[-250, -A], [-200, -6000], [-300, -5000], [-150, -4200], [300, -3500], [900, -3000], [1700, -2700], [2700, -2600], [3500, -2700], [4100, -2900], [4350, -3400], [4500, -4400], [4700, -5300], [5250, -6000], [5800, -6676], [5900, -A]];
const M1: XY[] = [
  [-2700, 5050], [-3000, 4000], [-2800, 3000], [-2200, 2200], [-1500, 1400], [-500, 800], [600, 350], [1600, 150], [2500, 250], [3100, 700], [3550, 1250], [4200, 1550], [4700, 1950],
  [4900, 2600], [5000, 3500], [4850, 4400], [4550, 4950], [3900, 5100], [3000, 5050], [2000, 5130], [1000, 5000], [0, 5080], [-1000, 4950], [-2000, 5050],
];
const M2: XY[] = [[-300, 2800], [400, 2100], [1500, 1700], [2600, 1800], [3300, 2100], [3700, 2700], [3900, 3600], [3600, 4500], [2800, 4750], [1500, 4700], [400, 4600], [-400, 3800]];
// (out past the terrace's coast a little, so its cliffs fall straight to the sea)
const M3: XY[] = [[2900, 3000], [3300, 2300], [3900, 2050], [4500, 1950], [4800, 2050], [5000, 2600], [5100, 3500], [4950, 4400], [4620, 5000], [3950, 5180], [3300, 5120], [2900, 4400]];
const RIDGE_S: XY[] = [[-A, -6300], [-3000, -6200], [0, -6600], [1000, -6550], [1000, -A], [-A, -A]];
const RIDGE_N: XY[] = [[2300, -A], [2300, -6450], [3000, -6300], [4500, -6400], [5400, -6250], [6000, -6900], [6100, -A]];
const RIM_W: XY[] = [[-A, 900], [-5900, 900], [-6300, 2500], [-5900, 4200], [-6200, 5050], [-A, 5100]];
const RIM_E: XY[] = [[-A, -900], [-5900, -900], [-6400, -2200], [-6100, -4500], [-6300, -A], [-A, -A]];

// ramps: top on the edge, bottom out below; the abbey's stairs are straight flights
const RD = rampOff([-150, -4200], [300, -3500], [1500, -4500], 900, 460);
const RM1 = rampOff([-500, 800], [600, 350], [-500, 3000], 1100, 460);
const SM2 = { ...rampOff([1500, 1700], [2600, 1800], [2000, 3000], ABBEY_STAIRS.run, ABBEY_STAIRS.width), straight: true };
const SM3 = { ...rampOff([2900, 3000], [3300, 2300], [4000, 3500], ABBEY_STAIRS.run, ABBEY_STAIRS.width), straight: true };

// the places
const CHURCH: XY = [4050, 3420];
const CELLS: XY = [3900, 4560];
const PAVILION: XY = [1450, 2750];
const JETTY: XY = [4050, -700];
const HUB: XY = [-1300, -1650];

// the snow thinning toward the primeval forest (south) and toward the downs (east): how likely a
// patch of the ground under it is, from the edge (1) to about a fifth of the way in (0)
const ss = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const thawS = (x: number) => 0.7 * ss(-3000, -6676, x);
const thawE = (y: number) => 0.55 * ss(-3200, -6676, y);
// south of a ragged line the ground under the snow is the forest's green, north of it the downs'
// winter olive
const GREENLINE: XY[] = (() => {
  const pts: XY[] = [];
  for (let y = A + 500; y >= -A - 500; y -= 300) pts.push([-3600 + 200 * Math.sin(y / 700) + 120 * Math.sin(y / 260 + 1), y]);
  return [[A + 500, A + 500], ...pts, [A + 500, -A - 500]];
})();

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(513, {
    hills: [
      { x: -2600, y: -2700, r: 1300, h: 110 }, { x: -4300, y: 1500, r: 1200, h: 90 }, { x: -800, y: -4800, r: 1000, h: 100 }, { x: 1400, y: -1600, r: 900, h: 70 },
      { x: -3800, y: 3500, r: 1000, h: 80 }, { x: -2000, y: -500, r: 700, h: -50 }, { x: -4600, y: -3400, r: 1100, h: 120 },
    ],
    plateaus: [
      { poly: dense(ED), h: 280, ramps: [RD] },
      { poly: dense(M1), h: 350, ramps: [RM1] },
      { poly: dense(M2), h: 700, ramps: [SM2] },
      { poly: dense(M3), h: 1050, ramps: [SM3] },
      { poly: dense(RIDGE_S, 700), h: 1000 },
      { poly: dense(RIDGE_N, 700), h: 1000 },
      { poly: dense(RIM_W, 700), h: 1400 },
      { poly: dense(RIM_E, 700), h: 1400 },
    ],
    rock: "Westcliffs_CliffGrey",
  });
  const { put, rnd } = f;

  // ---- the tracks ----
  const S_EXIT: XY = [-5150, 0], E_EXIT: XY = [1600, -5150];
  const climb = (r: { top: XY; bottom: XY }, inn = 400, out = 400): XY[] => [beyond(r.bottom, r.top, inn), r.top, r.bottom, beyond(r.top, r.bottom, out)];
  const up = (r: { top: XY; bottom: XY }, inn = 400, out = 400): XY[] => [beyond(r.top, r.bottom, inn), r.bottom, r.top, beyond(r.bottom, r.top, out)];
  // from the primeval forest up through the pass to the clearing
  const SOUTH: XY[] = smooth([[-9400, 0], [-6676, 0], S_EXIT, [-4300, -150], [-3300, -700], [-2300, -1250], HUB]);
  // from the downs through the ridge's gap, over the east down and down its ramp to the clearing
  const cd = climb(RD);
  const EAST: XY[] = [...smooth([[1600, -9400], [1600, -6676], E_EXIT, [1250, -4550], [800, -4200], cd[0]]), cd[1], cd[2], ...smooth([cd[3], [-1250, -2600], HUB])];
  // up the mountain: the ramp to the lower terrace, the stairs to the upper, the stairs to the crag
  const u1 = up(RM1), u3 = up(SM3, 150, 380);
  const ABBEY_WAY: XY[] = [
    ...smooth([HUB, [-900, -1050], u1[0]]), u1[1], u1[2], ...smooth([u1[3], [900, 700], [1700, 620], SM2.bottom]), SM2.top, [2090, 1930], SM3.bottom, SM3.top,
    ...smooth([u3[3], [3330, 3150], [CHURCH[0] - 760, CHURCH[1]]]),
  ];
  // from the clearing north between the down and the mountain to the bay and the jetty
  const BAY_WAY: XY[] = smooth([[-1150, -1850], [0, -1650], [1200, -1350], [2200, -1050], [2900, -750], [3350, -650]]);
  // out along the lower terrace to the ascetics' ledges over the western sea
  const LEDGE_WAY: XY[] = smooth([u1[3], [-200, 1700], [-900, 2600], [-1700, 3500], [-2100, 4300]]);
  const TRACKS = [SOUTH, EAST, ABBEY_WAY, BAY_WAY, LEDGE_WAY];
  const roads = TRACKS.map((t, i) => band(t, i < 2 ? 460 : i === 2 ? 430 : 380));

  // ---- the ground: winter grass under the snow (olive toward the downs, the forest's green toward
  // the south), coming through in patches toward those edges; the bay's shingle ----
  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ROAD: [number, number, number] = [0.72, 0.74, 0.92];
  const ground = f.ground({ area, roads, plazas: [], water: [SEA], base: "moss", road: [ROAD[0] / 0.82, ROAD[1] / 0.78, ROAD[2] / 0.64], tint: "#d2c6a4" });
  const green = f.ground({ area: { x0: -A, y0: -A, x1: -2600, y1: A }, roads, plazas: [], water: [SEA, GREENLINE], base: "grass", road: ROAD });
  green.mesh.position.y += 3;
  green.mesh.renderOrder = 1;
  const rndP = seeded(5131), patches: XY[][] = [];
  for (let x = -A; x < A; x += 420)
    for (let y = -A; y < A; y += 420) {
      const cx = x + rndP() * 420, cy = y + rndP() * 420, k = Math.max(thawS(cx), thawE(cy)), r = 420 * (0.35 + 0.45 * k) * (0.8 + rndP() * 0.4);
      if (k > 0.02 && rndP() < k) patches.push(blobPoly([cx, cy], r * (0.8 + rndP() * 0.5), r * (0.7 + rndP() * 0.4), 5400 + patches.length, 0.22, 14));
    }
  const snow = f.ground({ area, roads, plazas: [], water: [SEA, ...patches], base: "snow", road: ROAD });
  snow.mesh.position.y += 6;
  snow.mesh.renderOrder = 2;
  const grassy = (x: number, y: number) => snow.kind(x, y) === 3 && !inPoly(SEA, x, y);
  const areaOf = (p: XY[]) => p.reduce((t, [x, y], i) => t + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0);
  const sbox: XY[] = [[2300, -2100], [4400, -2100], [4400, 1300], [2300, 1300]];
  const hole = Math.sign(areaOf(sbox)) === Math.sign(areaOf(BEACH)) ? [...BEACH].reverse() : BEACH;
  const shingle = f.ground({ area: { x0: 2400, y0: -2000, x1: 4300, y1: 1200 }, roads, plazas: [], water: [[...sbox, sbox[0], ...hole, hole[0]], SEA], base: "rock", road: ROAD });
  shingle.mesh.position.y += 9;
  shingle.mesh.renderOrder = 3;

  // ---- the ways out ----
  f.exit("primeval_forest", S_EXIT, [-4450, -90]);
  f.exit("highland_downs", E_EXIT, [1330, -4500]);

  // ---- the sea: cold dark water, the shore closed; the stacks under the crag, an arch, a reef ----
  const shape = new THREE.Shape();
  SHORE.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  [[-30000, 5350], [-30000, 30000], [30000, 30000], [30000, -30000], [6400, -30000]].forEach(([x, y]) => shape.lineTo(x, y));
  const seaSheet = new THREE.Mesh(new THREE.ShapeGeometry(shape).applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1)), material("Westcliffs_WestSea"));
  seaSheet.position.y = -14;
  seaSheet.receiveShadow = true;
  const seaward = (i: number, d: number): XY => {
    const a = SHORE[Math.max(0, i - 1)], b = SHORE[Math.min(SHORE.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let n: XY = [-(b[1] - a[1]) / L, (b[0] - a[0]) / L];
    if (!inPoly(SEA, SHORE[i][0] + n[0] * 150, SHORE[i][1] + n[1] * 150)) n = [-n[0], -n[1]];
    return [SHORE[i][0] + n[0] * d, SHORE[i][1] + n[1] * d];
  };
  const near = SHORE.map((_, i) => i).filter((i) => Math.abs(SHORE[i][0]) < R + 1600 && Math.abs(SHORE[i][1]) < R + 1600);
  f.blockBand(near.map((i) => seaward(i, 120)), 320, { kind: "sea" });
  // the stacks in the sea below the abbey, more along the coasts
  for (const [x, y, h, s] of [[5900, 3200, 30, 1.2], [6400, 4300, 150, 1], [5600, 5600, 250, 1.3], [6900, 2000, 60, 0.9], [4800, 6200, 100, 1.1], [3300, 6100, 200, 0.8], [5800, 1000, 300, 0.9], [7400, 5800, 40, 1.2],
    [1500, 6200, 120, 0.9], [-1500, 6300, 220, 1], [-4200, 6200, 90, 0.8], [5800, -1600, 10, 1], [6800, -4200, 180, 1.1]] as number[][])
    put("northcold:sea_stack", [x, y], h, { z: -14, s, solid: "none" });
  put("westcliffs:sea_arch", [6300, 3700], 60, { z: -14, s: 1.1, solid: "none" });
  put("westcliffs:sea_arch", [4300, 6500], 150, { z: -14, s: 0.85, solid: "none" });
  for (const [x, y, h, s] of [[5500, 2700, 20, 1], [5400, 4600, 110, 0.9], [4900, -900, 60, 0.8], [5300, -3500, 200, 1], [500, 5700, 300, 0.9], [-2600, 5700, 140, 0.8], [3700, 5800, 30, 1]] as number[][])
    put("westcliffs:surf_rocks", [x, y], h, { z: -14, s, solid: "none" });
  for (const [x, y, h, s] of [[4600, 200, 40, 0.8], [6100, -2500, 130, 1], [7300, 1200, 240, 1], [6900, 6600, 60, 1.1], [2000, 7000, 300, 0.9], [-3000, 7100, 200, 1]] as number[][])
    put("northcold:drift_floes", [x, y], h, { z: -14, s, solid: "none" });

  // ---- placing things: clear of tracks, the sea, cliffs and each other ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine([x, y], t) < d);
  const free = (x: number, y: number, r: number, gap = 0) =>
    Math.abs(x) < A - 200 && Math.abs(y) < A - 200 && !inPoly(SEA, x, y) && toLine([x, y], SHORE) > r + 120 &&
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const take = (x: number, y: number, r: number) => taken.push([x, y, r]);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    take(at[0], at[1], r);
  };
  const disc = (r: number, kind = "rock", x = 0, y = 0): SolidSpec => ({ kind, x, y, r });
  const box = (w: number, d: number, x = 0, y = 0, kind = "building"): SolidSpec => ({ kind, x, y, w, d, rot: 0 });
  const ring = (r: number, kind = "rock") => ({ solid: [disc(r, kind)] });
  const inBox = (x: number, y: number) => Math.abs(x) < R - 150 && Math.abs(y) < R - 150;
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120, o: (s: number) => Parameters<typeof put>[3] = () => ({ solid: "none" }), where = inBox) => {
    for (let i = 0, made = 0; i < n * 12 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!where(x, y) || nearTrack(x, y, rad + 230) || !free(x, y, rad, 40)) continue;
      const s = 0.8 + rnd() * 0.4;
      put(ref, [x, y], rnd() * 360, { s, ...o(s) });
      take(x, y, rad * s);
      made++;
    }
  };
  for (const t of TRACKS) for (let i = 0; i < t.length; i += 2) take(t[i][0], t[i][1], 180);

  // ---- the abbey on the crag: the church facing the stairs' head, the cells along the west cliff
  // facing it, the walls along the east brink with the gate at the stairs ----
  prop("westcliffs:abbey_church", CHURCH, 0, 800, { s: 0.85, solid: [box(1300, 760, -50, 0), box(150, 240, -720, 0, "wall"), disc(300, "building", 600, 0), ...[-570, -280, 10, 300, 560].flatMap((x) => [box(70, 70, x, -415, "wall"), box(70, 70, x, 415, "wall")])] });
  prop("westcliffs:abbey_cells", CELLS, 90, 700, { solid: [box(450, 1200, 75, 0), box(60, 1100, -320, 40, "wall")] });
  const brink: XY[] = [[3450, 2560], [4000, 2330], [4560, 2250]];
  for (let i = 0; i + 1 < brink.length; i++) {
    const [a, b] = [brink[i], brink[i + 1]], m: XY = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], h = runAlong(b[0] - a[0], b[1] - a[1]) - 90;
    prop(i === 0 ? "westcliffs:abbey_wall_ruin" : "westcliffs:abbey_wall", m, h, 330, { sy: Math.hypot(b[0] - a[0], b[1] - a[1]) / 600, solid: [box(90, Math.hypot(b[0] - a[0], b[1] - a[1]), 0, 0, "wall")] });
  }
  const gateAt = beyond(SM3.bottom, SM3.top, 330), gh = runAlong(SM3.top[0] - SM3.bottom[0], SM3.top[1] - SM3.bottom[1]);
  prop("westcliffs:abbey_gate", gateAt, gh, 330, { solid: [box(300, 160, 0, -205, "wall"), box(300, 160, 0, 205, "wall")] });
  // the wall on from the gate's west pier along the crag's south brink
  const gw: XY = [-Math.sin((gh * Math.PI) / 180), Math.cos((gh * Math.PI) / 180)];
  prop("westcliffs:abbey_wall_ruin", [gateAt[0] + gw[0] * 580, gateAt[1] + gw[1] * 580], gh, 330, { sy: 0.8, solid: [box(90, 480, 0, 0, "wall")] });
  prop("westcliffs:abbey_waystone", [CHURCH[0] - 950, CHURCH[1] + 450], 0, 70, ring(45, "post"));
  prop("westcliffs:prayer_flags", [4600, 3000], 0, 100, { solid: [disc(14, "post", 0, -430), disc(14, "post", 0, 430)] });
  prop("westcliffs:meditation_ledge", [4600, 4300], 200, 220, { solid: [disc(130)] });
  prop("iceberg:snowy_barrels", [CELLS[0] - 700, CELLS[1] - 450], 30, 120);
  prop("snowland:log_pile", [CELLS[0] + 750, CELLS[1] - 500], 90, 220);

  // ---- the stairs, the bell pavilion on the upper terrace, flags along the climb ----
  for (const s of [SM2, SM3]) put("westcliffs:abbey_stairs", [(s.top[0] + s.bottom[0]) / 2, (s.top[1] + s.bottom[1]) / 2], runAlong(s.top[0] - s.bottom[0], s.top[1] - s.bottom[1]), { solid: "none" });
  prop("westcliffs:bell_pavilion", PAVILION, towards(SM2.top[0] - PAVILION[0], SM2.top[1] - PAVILION[1]), 450, { solid: [box(560, 560, 0, 0, "building")] });
  // (one line strung beside the upper flight, two more over the terraces)
  for (const [at, h, s] of [[[2420, 2740], -60, 0.8], [[700, 3400], 40, 1], [[-500, 1300], 70, 1]] as [XY, number, number][]) prop("westcliffs:prayer_flags", at, h, 100, { s, solid: [disc(14, "post", 0, -430), disc(14, "post", 0, 430)] });
  for (const at of [[2700, 3700], [1800, 4200], [400, 4000], [-1200, 3500], [-2200, 4500], [-2600, 3300], [-200, 1900]] as XY[]) if (free(at[0], at[1], 160)) prop("westcliffs:meditation_ledge", at, rnd() * 360, 220, { solid: [disc(130)] });

  // ---- the bay: the old jetty out into the sea, a boat frozen in, shingle and driftwood ----
  prop("westcliffs:ruined_jetty", JETTY, 0, 600, { z: -14, solid: [box(960, 280, -90, 0, "wall")] });
  prop("northcold:icebound_boat", [4300, -1400], 60, 280, { z: -8, solid: "none" });
  for (const [x, y, h] of [[3300, -1300, 30], [3350, 300, 100], [3100, -400, 160]] as number[][]) if (free(x, y, 150)) prop("northcold:shingle_bank", [x, y], h, 250, { solid: "none" });
  prop("westcliffs:abbey_waystone", [3400, -900], 90, 70, ring(45, "post"));
  for (const at of [[3700, -1700], [3800, 800], [2900, 900]] as XY[]) if (free(at[0], at[1], 140)) prop("northcold:iced_rocks", at, rnd() * 360, 200, { s: 0.8, ...ring(140) });
  scatter("westcliffs:sea_grass", [3200, -400], 900, 6, 110, () => ({ solid: "none" }), (x, y) => inPoly(BEACH, x, y) && x < 3500);

  // ---- the ways out: a waystone and a cairn at each; cairns where the paths part ----
  prop("westcliffs:abbey_waystone", [-4850, -500], 90, 70, ring(45, "post"));
  prop("snowland:cairn", [-4900, 480], 0, 70, ring(45));
  prop("westcliffs:abbey_waystone", [1250, -4950], 180, 70, ring(45, "post"));
  prop("snowland:cairn", [1950, -4900], 0, 70, ring(45));
  prop("westcliffs:abbey_waystone", [HUB[0] - 300, HUB[1] + 450], towards(1, -0.3), 70, ring(45, "post"));
  for (const at of [[-3000, -600], [-600, -2300], [700, -4400], [1100, -1100], [-200, 300], [2000, 2050]] as XY[]) if (free(at[0], at[1], 70)) prop("snowland:cairn", at, rnd() * 90, 70, ring(45));

  // ---- the clearing where the paths meet: a lean-to where travellers shelter, its fire gone cold ----
  prop("snowland:lean_to", [HUB[0] - 650, HUB[1] - 700], towards(1, 1), 300);
  prop("snowland:cold_campfire", [HUB[0] - 250, HUB[1] - 380], 0, 120, ring(70));
  prop("snowland:log_pile", [HUB[0] - 900, HUB[1] - 250], 70, 220);
  prop("snowland:supply_cache", [HUB[0] + 520, HUB[1] - 650], 200, 220, { solid: [box(330, 140, -10, 0, "box")] });

  // ---- the east down: dry-stone walls running on from the downs, lone pines, heather ----
  const wallRun = (pts: XY[]) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay), dx = (bx - ax) / L, dy = (by - ay) / L;
      const h = (Math.atan2(-dx, dy) * 180) / Math.PI;
      for (let d = 150; d < L - 60; d += 300) {
        const x = ax + dx * d, y = ay + dy * d;
        if (Math.abs(x) > A - 400 || Math.abs(y) > A - 400 || nearTrack(x, y, 380) || rnd() < 0.05) continue;
        if (![[0, 0], [dx * 150, dy * 150], [-dx * 150, -dy * 150]].every(([ex, ey]) => ground.kind(x + ex, y + ey) === 0) || !f.level(x, y, 150)) continue;
        if (taken.some(([tx, ty, tr]) => tr > 90 && Math.hypot(tx - x, ty - y) < tr + 60)) continue;
        put("westhills:drystone_wall", [x, y], h);
        take(x, y, 160);
      }
    }
  };
  wallRun([[600, -6800], [700, -5600], [1000, -4800], [1600, -4000], [2400, -3500], [3400, -3300], [4200, -3700]]);
  wallRun([[2800, -6400], [3000, -5300], [3500, -4700], [4300, -4800]]);
  for (const at of [[2500, -4300], [3800, -4200], [600, -5300], [3200, -5800], [1800, -3200]] as XY[]) if (free(at[0], at[1], 160, 120)) prop("westhills:ragged_pine", at, -100 + (rnd() - 0.5) * 40, 220, { s: 0.8 + rnd() * 0.3, solid: [disc(30, "tree")] });
  scatter("westhills:heather", [2300, -4300], 1800, 14, 90, () => ({ solid: "none" }), (x, y) => inBox(x, y) && grassy(x, y));
  scatter("westhills:gorse", [2300, -4600], 1600, 5, 110, () => ({ solid: [disc(55, "bush")] }), (x, y) => inBox(x, y) && grassy(x, y));

  // ---- rocks: granite and spires at the mountain's foot and on its terraces, wind-holed boulders ----
  const ROCKS: [string, XY, number][] = [
    ["westcliffs:rock_spire", [-1900, 600], 150], ["westcliffs:coast_granite", [-800, -100], 170], ["westcliffs:rock_spire", [900, -400], 150], ["westcliffs:coast_granite", [2000, -300], 170],
    ["westcliffs:wind_hole_rock", [-3600, 2100], 150], ["westcliffs:coast_granite", [-2900, -3700], 170], ["westcliffs:rock_spire", [-4300, -1500], 150], ["westcliffs:coast_granite", [-1700, -4200], 170],
    ["westcliffs:wind_hole_rock", [2300, -1900], 150], ["westcliffs:coast_granite", [-4400, 3800], 170],
    // up on the terraces
    ["westcliffs:rock_spire", [-1700, 2600], 150], ["westcliffs:coast_granite", [-2500, 4000], 170], ["westcliffs:wind_hole_rock", [-800, 4300], 150], ["westcliffs:coast_granite", [300, 1300], 170],
    ["westcliffs:rock_spire", [900, 3800], 150], ["westcliffs:coast_granite", [2200, 3300], 170], ["westcliffs:rock_spire", [3100, 4300], 150], ["westcliffs:coast_granite", [4500, 2500], 170],
    // on the down
    ["westcliffs:coast_granite", [3200, -4500], 170], ["westcliffs:wind_hole_rock", [1000, -3600], 150], ["westcliffs:rock_spire", [4100, -5200], 150],
  ];
  for (const [id, at, r] of ROCKS) if (free(at[0], at[1], r)) prop(id, at, rnd() * 360, r + 40, ring(r * 0.85));
  // fallen rock at the feet of the cliffs
  for (const poly of [ED, M1, M2, M3]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (inPoly(poly, mx + nx * 50, my + ny * 50)) [nx, ny] = [-nx, -ny];
      for (let t = 300; t < L - 200; t += 700) {
        const out = 300 + rnd() * 150, x = a[0] + ((b[0] - a[0]) * t) / L + nx * out, y = a[1] + ((b[1] - a[1]) * t) / L + ny * out;
        if (rnd() < 0.45 || !inBox(x, y) || nearTrack(x, y, 380) || !free(x, y, 130, 60)) continue;
        const s = 0.6 + rnd() * 0.35;
        prop("westcliffs:scree_slabs", [x, y], rnd() * 360, 200 * s, { s, solid: [disc(150 * s)] });
      }
    }
  }

  // ---- the snow pine forest over the south and the middle: groves with glades between, fallen
  // trees and stumps; toward the primeval forest pines without snow and broadleaves among them ----
  const kindsAt = (x: number) => (x < -3600 ? ["Pine", "SnowPine", "PineSmall", "Birch", "SnowPineSmall"] : x < -2400 ? ["SnowPine", "Pine", "SnowPineSmall", "SnowPine"] : ["SnowPine", "SnowPineSmall", "SnowPine", "SnowPineSmall"]);
  const GLADES: [XY, number][] = [[HUB, 650], [[-3000, -2600], 700], [[-3600, 2500], 800], [[-500, -3300], 600], [[-4300, -4200], 700], [[700, -2200], 600], [[-2400, 1000], 500]];
  for (let x = -R + 150; x < R; x += 420)
    for (let y = -R + 150; y < R; y += 420) {
      const px = x + (rnd() - 0.5) * 340, py = y + (rnd() - 0.5) * 340;
      const floor = f.h(px, py) < 200, edge = Math.min(R - Math.abs(px), R - Math.abs(py));
      const want = !floor ? (px < 2500 ? 0.12 : 0.04) : edge < 800 ? 0.65 : 0.46;
      if (rnd() > want || GLADES.some(([c, r]) => Math.hypot(px - c[0], py - c[1]) < r) || inPoly(BEACH, px, py) || nearTrack(px, py, 330) || !free(px, py, 160, 40)) continue;
      const kinds = kindsAt(px);
      put(`flora:${kinds[Math.floor(rnd() * kinds.length)]}`, [px, py], rnd() * 360, { s: 0.75 + rnd() * 0.35 });
      take(px, py, 170);
    }
  scatter("snowland:fallen_log", [-2000, -1500], 3500, 7, 260, () => ({ solid: [{ kind: "log", x: 0, y: 0, w: 120, d: 520, rot: 0 }] }), (x, y) => inBox(x, y) && f.h(x, y) < 200);
  scatter("westcliffs:snapped_pine", [-1500, -2000], 3500, 6, 160, () => ({ solid: [disc(28, "tree")] }), (x, y) => inBox(x, y) && f.h(x, y) < 200);
  scatter("snowland:snowy_stump", [-2500, -2500], 3000, 8, 80, () => ({ solid: [disc(40, "tree")] }));
  scatter("plains:fern_clump", [-4500, -500], 1500, 10, 90, () => ({ solid: "none" }), (x, y) => inBox(x, y) && x < -3800 && grassy(x, y));

  // ---- ground cover: grass bent by the wind and thrift up on the terraces, drifts, dry grass ----
  scatter("westcliffs:sea_grass", [800, 3500], 3200, 14, 110, () => ({ solid: "none" }), (x, y) => inBox(x, y) && f.h(x, y) > 300);
  scatter("westcliffs:thrift_cushions", [500, 3500], 3200, 10, 100, () => ({ solid: "none" }), (x, y) => inBox(x, y) && f.h(x, y) > 300);
  scatter("northcold:flattened_grass", [1500, -3800], 2500, 12, 170);
  scatter("snowland:snow_drift", [-1500, -1500], 3800, 10, 220);
  scatter("snowland:snow_drift", [800, 3000], 2500, 6, 220);
  scatter("snowland:dry_grass", [-1000, -2000], 4000, 12, 80);
  scatter("snowland:dead_branches", [-2000, -1500], 3500, 8, 110);

  // ---- past the edge: snowy pines on the ridges and rims, the forest's trees to the south;
  // nothing on the sea ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const onTrack = (x: number, y: number) => [[0, 0], [280, 0], [-280, 0], [0, 280], [0, -280]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const wet = (x: number, y: number) => inPoly(SEA, x, y) || toLine([x, y], SHORE) < 350;
  f.woods(area, ["SnowPine", "SnowPine", "SnowPineSmall", "SnowPineSmall"], (x, y) => inside(x, y) || onTrack(x, y) || wet(x, y) || x < -5600, { count: 230, spacing: 450, tries: 6000 });
  f.woods(area, ["Pine", "SnowPine", "Birch", "BigOak", "Pine"], (x, y) => inside(x, y) || onTrack(x, y) || wet(x, y) || x >= -5600, { count: 70, spacing: 450, tries: 3000 });

  // ---- monsters: the forest's glades, the down, the three terraces; not in the abbey's yard ----
  const quiet = (x: number, y: number) => Math.hypot(x - CHURCH[0] + 800, y - CHURCH[1]) < 700 || (x > 3300 && y < 3050 && f.h(x, y) > 1000) || Math.hypot(x - PAVILION[0], y - PAVILION[1]) < 600 || inPoly(BEACH, x, y);
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 760, keepOut: quiet, max: 52 });

  // ---- people ----
  const npcs: NpcSpec[] = [
    { id: "snow_abbey_brother", x: CHURCH[0] - 820, y: CHURCH[1] - 420, face: 20, name: "ภราดาเบเนดิกต์", title: "ผู้เฝ้าอารามคนสุดท้าย", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "blue", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: [
        "พี่น้องในอารามลงเขาไปหมดแล้วตั้งแต่หน้าหนาวที่หลังคาโบสถ์ถล่ม เหลือข้าคนเดียวที่ยังเฝ้าอยู่",
        "ระฆังใหญ่เราหามลงไปแขวนที่ศาลาบนลานผาชั้นบน เสียงมันยังดังไปถึงทะเลทุกเช้า",
        "นักพรตบนผาเคยเป็นพี่น้องของเรา พวกเขานั่งสมาธิในหิมะนานจนลืมคำพูดของคน อย่าเข้าใกล้ถ้าไม่จำเป็น",
      ] },
    { id: "snow_abbey_pilgrim", x: u1[3][0] + 250, y: u1[3][1] + 300, face: 200, name: "ฮันนา", title: "นักแสวงบุญ", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "auburn", eyes: "teal", top: "top_adventurer_navy", bottom: "bottom_adventurer_sand" },
      lines: [
        "ฉันเดินมาจากที่ราบเนินเขาเพื่อขึ้นไปตีระฆังที่อารามสักครั้ง บันไดหินสองช่วงนั่นชันกว่าที่คิดไว้มาก",
        "ระวังเสือดาวหิมะในป่าสนนะ ขนมันขาวกลืนไปกับหิมะ กว่าจะเห็นตัวมันก็กระโจนมาแล้ว",
        "ทางใต้ผ่านช่องเขาลงไปคือป่าดึกดำบรรพ์ ที่นั่นอุ่นจนหิมะไม่เกาะเลย",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [green.mesh, snow.mesh, shingle.mesh, seaSheet],
    sky: "#aebccb",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => grassy(x, y) && ground.kind(x, y) === 0 && x < -3800, density: 0.04 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 1350, y: -4450 },
    npcs,
    labels: [
      { x: S_EXIT[0] + 150, y: S_EXIT[1] + 300, text: "ทางไปป่าดึกดำบรรพ์", kind: "gate" },
      { x: E_EXIT[0] - 200, y: E_EXIT[1] + 250, text: "ทางไปที่ราบเนินเขา", kind: "gate" },
      { x: CHURCH[0] - 720, y: CHURCH[1] - 450, text: "อารามร้างบนผา" },
      { x: PAVILION[0] - 500, y: PAVILION[1], text: "ศาลาระฆัง" },
      { x: (SM2.top[0] + SM2.bottom[0]) / 2, y: (SM2.top[1] + SM2.bottom[1]) / 2 - 450, text: "บันไดหินขึ้นอาราม", kind: "small" },
      { x: -2000, y: -2400, text: "ป่าสนหิมะ" },
      { x: JETTY[0] - 600, y: JETTY[1] - 200, text: "ท่าเรือเก่าของอาราม", kind: "small" },
      { x: 1500, y: 4250, text: "แท่งหินกลางทะเล", kind: "small" },
      { x: -1500, y: 3300, text: "ลานผาชั้นล่าง", kind: "small" },
      { x: 1800, y: 3600, text: "ลานผาชั้นบน", kind: "small" },
      { x: 2600, y: -4300, text: "เนินตะวันออก", kind: "small" },
    ],
  });
}
