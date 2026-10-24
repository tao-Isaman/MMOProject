// หุบหินร้องเพลง (the valley of the humming stones), monsters Lv 148-158: a valley at the end of the
// land north-west of the highland downs, open to the northern sea on its north and to the western
// sea along its west. The sea wind blows up it all day, and where it passes through the pillars of
// soft stone that stand in it, worn hollow and pierced with holes, they hum, each its own note;
// the bats of the cliffs answer them with their own cries.
//
// The way in from the highland downs comes over the south edge through a gap in the snowy ridge
// there, onto the west down, a long shelf of the land along the western sea, and down a ramp into
// the valley. The way in from the north sea cliffs comes over the east edge onto the east heights
// (the sea cliffs' west headland running on), through the shell of an old checkpoint the gargoyles
// keep now, down a ramp to the middle shelf under them and down again to the valley. In the middle
// of the valley floor, on a low rise, stands the grove of the humming stones; lone pillars stand
// all down it, more hidden in the snow pines. The floor runs north to a cove of shingle on the sea,
// and south-east into a moor under the heights, where a cave opens in the shelf's face; two more
// caves open in the faces over the valley, the bats' roosts. Up on the west down the old poet keeps
// his hermitage, looking out over the western sea, his verses cut in stones along the path; north
// of it the down rises again to the harp headland over the cove, where the giant harp of rock
// stands against the sky. Out in the sea: stacks, a reef where it breaks, an arch of rock.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: south -> highland_downs (through the ridge's gap, e 0.47, where the downs' own way
//   north meets the edge), east -> north_cliffs (on the heights, n 0.645, where the cliffs' west
//   headland carries its own way west)

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits, seeded, colourways } from "./town";
import { material } from "./textures";
import { KIT as CLIFFS, GROVE_PILLARS } from "./kits/westcliffs";
import { KIT as SNOW, blobPoly } from "./kits/snowland";
import { KIT as NORTHCOLD } from "./kits/northcold";
import { KIT as WESTHILLS } from "./kits/westhills";
import { KIT as WESTMOUNT, FORT_SOLIDS, smooth, band, inPoly, toLine, dense, towards, runAlong, rampOff, beyond } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(CLIFFS, SNOW, NORTHCOLD, WESTHILLS, WESTMOUNT);
// the old checkpoint's turf-topped walls under snow here
colourways({ westcliffs_snowfort: { Westmount_FortMoss: "Snow" } });

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the sea: the north shore from the east edge (the north sea cliffs' sea), round the cove,
// round the harp headland and down the whole west coast to the south-west corner ----
const SHORE: XY[] = smooth([
  [4950, -A - 400], [4950, -6676], [4880, -5500], [4750, -4600], [4800, -3700], [4650, -2900], [4350, -2200], [3900, -1700], [3500, -1200], [3350, -500], [3300, 200], [3400, 900], [3650, 1500], [4050, 1900],
  [4600, 2300], [5000, 2800], [5150, 3500], [4900, 4100], [4400, 4500], [3600, 4700], [2600, 4800], [1600, 4700], [600, 4850], [-400, 4750], [-1400, 4900], [-2400, 4800], [-3400, 5000],
  [-4300, 5300], [-5000, 5700], [-5600, 6100], [-6676, 6400], [-A - 400, 6500],
], 3);
const SEA: XY[] = [...SHORE, [-A - 400, A + 400], [A + 400, A + 400], [A + 400, -A - 400]];
// the shingle of the cove between the middle shelf's end and the west down
const BEACH: XY[] = [[2350, -1500], [3300, -1650], [3750, -1250], [3600, -500], [3550, 300], [3650, 1000], [3700, 1550], [3200, 1500], [2750, 1650], [2450, 1000], [2300, 100], [2450, -800]];

// ---- the levels ----
// EL: the middle shelf under the east heights (400), EH: the east heights (750) on it, the sea
// cliffs' west headland running on over the edge; WD: the west down along the western sea (300),
// the downs' long low down running on; HP: the harp headland (650) on its north end. Past the
// south edge: the snowy ridge (the downs' north ridge), the gap in it where the way runs south.
const EL: XY[] = [[-3400, -A], [-3400, -6000], [-3300, -5000], [-3150, -4200], [-2600, -3500], [-1700, -3150], [-500, -2950], [700, -2800], [1800, -2600], [2900, -2350], [3500, -2150], [3850, -2050], [4100, -2350], [4400, -2950], [4550, -3700], [4500, -4600], [4630, -5500], [4700, -6676], [4700, -A]];
const EH: XY[] = [[-1600, -A], [-1600, -6200], [-1300, -5600], [-1200, -4800], [-1150, -4200], [-600, -3900], [800, -3700], [2000, -3500], [3000, -3400], [3700, -3500], [3950, -4200], [3900, -5000], [3950, -6000], [3950, -A]];
const WD: XY[] = [
  [-A, -950], [-5000, -950], [-4300, -700], [-3500, -150], [-2800, 600], [-2300, 1400], [-1700, 2100], [-800, 2500], [300, 2700], [1300, 2650], [2100, 2300], [2700, 1950], [3250, 1650], [3600, 1750], [3950, 2150],
  [4350, 2350], [4800, 2800], [4900, 3500], [4650, 4050], [4200, 4350], [3500, 4500], [2600, 4550], [1600, 4450], [600, 4600], [-400, 4500], [-1400, 4650], [-2400, 4550], [-3400, 4750], [-4300, 5050],
  [-5000, 5450], [-5600, 5850], [-6676, 6150], [-A, 6250],
];
// (its seaward side a little out past the down's, so its cliffs go straight down to the sea)
const HP: XY[] = [[2700, 3700], [2800, 2500], [3300, 2250], [3800, 2200], [4400, 2270], [4880, 2750], [5000, 3500], [4730, 4110], [4250, 4430], [3500, 4580], [3050, 4400]];
// (the gap between them just where the downs' own ridge leaves its gap, so the two run on as one)
const RIDGE_E: XY[] = [[-6250, -250], [-6400, -2000], [-6200, -3500], [-6500, -5000], [-6300, -A], [-A, -A], [-A, -250]];
const RIDGE_W: XY[] = [[-A, 900], [-6250, 900], [-6450, 2500], [-6250, 4000], [-6400, 5200], [-6600, 6100], [-A, 6300]];

// ramps: top on the edge, bottom out below
const RE1 = rampOff([-500, -2950], [700, -2800], [0, -4000], 1250, 460);
const RE2 = rampOff([-1200, -4800], [-1150, -4200], [1000, -4600], 1100, 440);
const RW1 = rampOff([-4300, -700], [-3500, -150], [-4500, 2000], 950, 460);
const RW2 = rampOff([-800, 2500], [300, 2700], [0, 3800], 950, 440);
const RHP = rampOff([2700, 3700], [2800, 2500], [3800, 3300], 1050, 440);

// the places
const GROVE: XY = [900, 350];
const HARP: XY = [4150, 3350];
const HERMIT: XY = [450, 3750];
const FORT: XY = [750, -4680];
const CAVES: [XY, number, number][] = [
  // the cave in the shelf's south face over the moor, the two in the faces over the valley
  [[-3530, -4620], 0, 1], [[-1150, -2800], towards(-0.164, 0.986), 0.95], [[2480, -3180], towards(-0.1, 0.995), 0.8],
];

// the olive grass of the downs coming through the snow toward the south edge: how likely a patch
// is, from the downs' edge (1) to about a fifth of the way in (0)
const ss = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const thaw = (x: number) => 0.62 * ss(-3200, -6676, x);

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(512, {
    hills: [
      { x: 700, y: 300, r: 1000, h: 90 }, { x: -2300, y: -2400, r: 1300, h: 110 }, { x: 1600, y: -1500, r: 900, h: 70 }, { x: -4600, y: -3300, r: 1200, h: 150 },
      { x: -1500, y: 900, r: 800, h: 60 }, { x: 2000, y: 700, r: 600, h: -40 }, { x: -4700, y: -5200, r: 1100, h: 110 },
    ],
    plateaus: [
      { poly: dense(EL), h: 400, ramps: [RE1] },
      { poly: dense(EH), h: 750, ramps: [RE2] },
      { poly: dense(WD), h: 300, ramps: [RW1, RW2] },
      { poly: dense(HP), h: 650, ramps: [RHP] },
      { poly: dense(RIDGE_E, 700), h: 1100 },
      { poly: dense(RIDGE_W, 700), h: 1100 },
    ],
    rock: "Westcliffs_CliffSea",
    keep: CAVES.map(([c, h]) => [c[0] + Math.cos((h * Math.PI) / 180) * 250, c[1] + Math.sin((h * Math.PI) / 180) * 250] as XY),
  });
  const { put, rnd } = f;

  // ---- the tracks ----
  const S_EXIT: XY = [-5150, 300], E_EXIT: XY = [1600, -5150];
  const HUB: XY = [-1300, -1050];
  const climb = (r: { top: XY; bottom: XY }, inn = 400, out = 400): XY[] => [beyond(r.bottom, r.top, inn), r.top, r.bottom, beyond(r.top, r.bottom, out)];
  const down = (r: { top: XY; bottom: XY }, inn = 400, out = 400): XY[] => [beyond(r.top, r.bottom, inn), r.bottom, r.top, beyond(r.bottom, r.top, out)];
  // from the downs through the ridge's gap, over the west down and down its ramp into the valley
  const c1 = climb(RW1);
  const SOUTH: XY[] = [...smooth([[-9400, 300], [-6676, 300], S_EXIT, [-4650, 220], c1[0]]), c1[1], c1[2], ...smooth([c1[3], [-2500, -1500], HUB])];
  // from the sea cliffs over the heights, through the checkpoint, down to the shelf, along it and
  // down to the valley
  const c2 = climb(RE2), c3 = climb(RE1);
  const EAST: XY[] = [
    ...smooth([[1600, -9400], [1600, -6676], E_EXIT, [1250, -4760], FORT, [-150, -4560], c2[0]]), c2[1], c2[2],
    ...smooth([c2[3], [-2620, -3950], [-2250, -3700], [-1300, -3480], [-450, -3380], c3[0]]), c3[1], c3[2], ...smooth([c3[3], [-700, -1100], HUB]),
  ];
  // down the valley past the grove to the cove
  const VALLEY: XY[] = smooth([HUB, [-400, -680], [500, -700], [1350, -380], [2150, -150], [2850, 0]]);
  // up to the west down, the hermitage, on along the down and up to the harp
  const d1 = down(RW2), c4 = climb(RHP);
  const HERMIT_WAY: XY[] = [...smooth([[-650, -780], [-620, 0], [-350, 700], d1[0]]), d1[1], d1[2], ...smooth([d1[3], [150, 3220], [800, 3180], [1250, 3020], c4[0]]), c4[1], c4[2], ...smooth([c4[3], [3650, 3250]])];
  // out over the moor to the cave in the shelf's face
  const MOOR: XY[] = smooth([[-1500, -1250], [-2300, -2050], [-3050, -3000], [-3750, -3850], [-4150, -4560]]);
  const TRACKS = [SOUTH, EAST, VALLEY, HERMIT_WAY, MOOR];
  const roads = TRACKS.map((t, i) => band(t, i < 2 ? 460 : 400));

  // ---- the ground: winter grass under snow, the grass coming through in patches toward the
  // downs in the south; the cove's shingle ----
  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ROAD: [number, number, number] = [0.72, 0.74, 0.9];
  const ground = f.ground({ area, roads, plazas: [], water: [SEA], base: "moss", road: [ROAD[0] / 0.82, ROAD[1] / 0.78, ROAD[2] / 0.64], tint: "#d2c6a4" });
  const rndP = seeded(5121), patches: XY[][] = [];
  for (let x = -A; x < -2800; x += 420)
    for (let y = -A; y < A; y += 420) {
      const cx = x + rndP() * 420, cy = y + rndP() * 420, k = thaw(cx), r = 420 * (0.35 + 0.45 * k) * (0.8 + rndP() * 0.4);
      if (rndP() < k) patches.push(blobPoly([cx, cy], r * (0.8 + rndP() * 0.5), r * (0.7 + rndP() * 0.4), 5200 + patches.length, 0.22, 14));
    }
  // and here and there all over, where the wind has blown the snow thin and the grass shows
  for (let i = 0; i < 46; i++) {
    const c: XY = [-5200 + rndP() * 9400, -5200 + rndP() * 9800], r = 160 + rndP() * 340;
    if (!inPoly(SEA, c[0], c[1]) && toLine(c, SHORE) > r + 200) patches.push(blobPoly(c, r * (0.9 + rndP() * 0.5), r * (0.7 + rndP() * 0.4), 5300 + patches.length, 0.22, 14));
  }
  const snow = f.ground({ area, roads, plazas: [], water: [SEA, ...patches], base: "snow", road: ROAD });
  snow.mesh.position.y += 4;
  snow.mesh.renderOrder = 1;
  const areaOf = (p: XY[]) => p.reduce((t, [x, y], i) => t + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0);
  const sbox: XY[] = [[2000, -2000], [4200, -2000], [4200, 2100], [2000, 2100]];
  const hole = Math.sign(areaOf(sbox)) === Math.sign(areaOf(BEACH)) ? [...BEACH].reverse() : BEACH;
  const shingle = f.ground({ area: { x0: 2100, y0: -1900, x1: 4100, y1: 2000 }, roads, plazas: [], water: [[...sbox, sbox[0], ...hole, hole[0]], SEA], base: "rock", road: ROAD });
  shingle.mesh.position.y += 8;
  shingle.mesh.renderOrder = 2;

  // ---- the ways out ----
  f.exit("highland_downs", S_EXIT, [-4450, 250]);
  f.exit("north_cliffs", E_EXIT, [1320, -4500]);

  // ---- the sea: cold dark water out to the edge, the shore closed; stacks, a reef, an arch, floes ----
  const shape = new THREE.Shape();
  SHORE.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  [[-30000, 6500], [-30000, 30000], [30000, 30000], [30000, -30000], [4950, -30000]].forEach(([x, y]) => shape.lineTo(x, y));
  const seaSheet = new THREE.Mesh(new THREE.ShapeGeometry(shape).applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1)), material("Westcliffs_WestSea"));
  seaSheet.position.y = -14;
  seaSheet.receiveShadow = true;
  // (a band of solids just out from the water's edge all along)
  const seaward = (i: number, d: number): XY => {
    const a = SHORE[Math.max(0, i - 1)], b = SHORE[Math.min(SHORE.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let n: XY = [-(b[1] - a[1]) / L, (b[0] - a[0]) / L];
    if (!inPoly(SEA, SHORE[i][0] + n[0] * 150, SHORE[i][1] + n[1] * 150)) n = [-n[0], -n[1]];
    return [SHORE[i][0] + n[0] * d, SHORE[i][1] + n[1] * d];
  };
  const near = SHORE.map((_, i) => i).filter((i) => Math.abs(SHORE[i][0]) < R + 1600 && Math.abs(SHORE[i][1]) < R + 1600);
  f.blockBand(near.map((i) => seaward(i, 120)), 320, { kind: "sea" });
  for (const [x, y, h, s] of [[6300, -1200, 30, 1.1], [5900, 1400, 140, 0.8], [7200, 3600, 250, 1.2], [6600, 6200, 60, 1], [4200, 6300, 200, 0.9], [7600, -3800, 100, 1.1], [1500, 6700, 300, 0.8], [-2600, 6600, 40, 1]] as number[][])
    put("northcold:sea_stack", [x, y], h, { z: -14, s, solid: "none" });
  put("westcliffs:sea_arch", [6150, 4700], 135, { z: -14, s: 1.05, solid: "none" });
  put("westcliffs:sea_arch", [-900, 6900], 80, { z: -14, s: 0.8, solid: "none" });
  for (const [x, y, h, s] of [[4300, -500, 20, 0.9], [5200, 2100, 120, 1], [5700, -2600, 60, 0.8], [3900, 5400, 200, 0.9], [-4000, 5900, 300, 0.8], [600, 5500, 160, 0.85], [5600, 4000, 10, 0.9]] as number[][])
    put("westcliffs:surf_rocks", [x, y], h, { z: -14, s, solid: "none" });
  for (const [x, y, h, s] of [[4700, 900, 20, 0.8], [5900, -400, 130, 1], [6800, 2400, 240, 0.9], [5200, -4600, 60, 1], [6900, -2000, 300, 1.1], [2600, 6200, 90, 0.9], [-3200, 7200, 200, 1]] as number[][])
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

  // ---- the grove of the humming stones on its rise in the middle of the valley ----
  const gh = towards(HUB[0] - GROVE[0], HUB[1] - GROVE[1]);
  prop("westcliffs:pillar_grove", GROVE, gh, 650, { solid: GROVE_PILLARS.map(([x, y, r]) => disc(r, "stone", x, y)) });
  prop("westcliffs:wind_chime_post", [GROVE[0] - 700, GROVE[1] - 250], gh, 90, ring(30, "post"));
  prop("westcliffs:poem_stele", [GROVE[0] - 560, GROVE[1] + 420], gh + 20, 90, { solid: [{ kind: "stone", x: 0, y: 0, w: 120, d: 160, rot: 0 }] });
  // lone pillars all down the valley, on the shelves and the down
  const LONE: [XY, number, number][] = [
    [[2000, 900], 20, 1], [[-600, 1500], 80, 0.9], [[-2500, -600], 140, 1.05], [[1900, -1050], 200, 0.85], [[-200, -1900], 260, 0.95], [[-3800, -2400], 30, 1.1],
    [[2700, -1100], 100, 0.8], [[-4500, -1900], 300, 0.9], [[-1900, 3500], 60, 1], [[-3700, 3900], 210, 0.9], [[1100, 4050], 120, 0.85],
    [[2400, -2900], 40, 0.9], [[-2300, -4700], 170, 1], [[3300, -4300], 250, 0.9], [[-500, -5000], 70, 0.85], [[4000, 2700], 330, 0.8],
  ];
  for (const [at, h, s] of LONE) if (free(at[0], at[1], 160 * s, 60)) prop("westcliffs:hollow_pillar", at, h, 200 * s, { s, ...ring(100 * s, "stone") });

  // ---- the harp on its headland over the cove, an offering stone, a stele ----
  const hh = towards(c4[3][0] - HARP[0], c4[3][1] - HARP[1]) * 0.4;
  prop("westcliffs:harp_rock", HARP, hh, 700, { solid: [{ kind: "stone", x: 0, y: 0, w: 440, d: 1150, rot: 0 }, disc(75, "stone", -330, 0)] });
  prop("westcliffs:poem_stele", [3400, 2750], towards(-1, -0.4), 90, { solid: [{ kind: "stone", x: 0, y: 0, w: 120, d: 160, rot: 0 }] });
  prop("westcliffs:wind_hole_rock", [4400, 2700], 120, 220, { s: 0.8, ...ring(150) });
  prop("westcliffs:thrift_cushions", [3550, 3900], 40, 120, { solid: "none" });

  // ---- the old poet's hermitage on the west down, his chimes, his verses along the path ----
  const hf = towards(d1[3][0] + 100 - HERMIT[0], d1[3][1] - HERMIT[1]);
  prop("westcliffs:poet_hermitage", HERMIT, hf, 520, { solid: [{ kind: "building", x: 17, y: 0, w: 675, d: 480, rot: 0 }, disc(10, "post", -40, 490)] });
  const hr = (hf * Math.PI) / 180, hx = (lx: number, ly: number): XY => [HERMIT[0] + lx * Math.cos(hr) - ly * Math.sin(hr), HERMIT[1] + lx * Math.sin(hr) + ly * Math.cos(hr)];
  prop("westcliffs:wind_chime_post", hx(-520, -360), hf, 90, ring(30, "post"));
  prop("snowland:log_pile", hx(150, -480), hf + 90, 220);
  for (const [at, h] of [[[-500, 900], 30], [[150, 2950], 200], [[1000, 3400], 160], [[2300, 2850], 120]] as [XY, number][]) if (free(at[0], at[1], 90)) prop("westcliffs:poem_stele", at, h, 90, { solid: [{ kind: "stone", x: 0, y: 0, w: 120, d: 160, rot: 0 }] });
  prop("westcliffs:thrift_cushions", hx(-200, 520), 0, 120, { solid: "none" });

  // ---- the old checkpoint on the heights, its walls run out either side; rubble ----
  const fh = runAlong(FORT[0] - 1250, FORT[1] + 4760);
  prop("westmount:frontier_fort", FORT, fh, 1150, { solid: FORT_SOLIDS, colours: "westcliffs_snowfort" });
  const fr = (fh * Math.PI) / 180, fx = (lx: number, ly: number): XY => [FORT[0] + lx * Math.cos(fr) - ly * Math.sin(fr), FORT[1] + lx * Math.sin(fr) + ly * Math.cos(fr)];
  prop("westmount:fort_wall", fx(0, 1460), fh, 420, { sy: 0.7, colours: "westcliffs_snowfort" });
  prop("westcliffs:abbey_wall_ruin", fx(0, -1500), fh + 180, 330, { s: 0.9, solid: [{ kind: "wall", x: 0, y: 0, w: 90, d: 600, rot: 0 }] });
  prop("snowland:trail_sign", [1200, -4350], towards(1, 1), 80, ring(30, "post"));
  prop("snowland:cairn", [1950, -4800], 0, 70, ring(45));

  // ---- the caves: in the shelf's face over the moor, in the faces over the valley ----
  for (const [c, h, s] of CAVES) prop("westcliffs:echo_cave", c, h, 450 * s, { s, solid: [{ kind: "rock", x: 10, y: 0, w: 460, d: 760, rot: 0 }] });

  // ---- the ways out: a sign and a cairn at each ----
  prop("snowland:trail_sign", [-4950, 720], 90, 80, ring(30, "post"));
  prop("snowland:cairn", [-4950, -150], 0, 70, ring(45));
  prop("snowland:cairn", [1900, -5000], 0, 70, ring(45));
  for (const at of [[-2150, -1150], [-450, -1350], [400, -2300], [-2800, -2500], [1700, -300], [-850, 1250], [-2600, 400], [600, 2950]] as XY[]) if (free(at[0], at[1], 70)) prop("snowland:cairn", at, rnd() * 90, 70, ring(45));

  // ---- the cove: shingle banks and driftwood, a boat left up the beach, rocks at the water ----
  for (const [x, y, h] of [[3000, -1000, 30], [3150, 500, 100], [2850, 1200, 160], [3200, -300, 60]] as number[][]) if (free(x, y, 150)) prop("northcold:shingle_bank", [x, y], h, 250, { solid: "none" });
  put("northcold:icebound_boat", [3620, -900], 70, { z: -12, solid: "none" });
  for (const at of [[3300, -1300], [3350, 1250], [2700, 1500]] as XY[]) if (free(at[0], at[1], 140)) prop("northcold:iced_rocks", at, rnd() * 360, 200, { s: 0.8, ...ring(140) });
  scatter("westcliffs:sea_grass", [2900, 0], 900, 8, 110, () => ({ solid: "none" }), (x, y) => inPoly(BEACH, x, y) && x < 3200);

  // ---- rocks: granite, spires, wind-holed boulders over the valley and up on the levels ----
  const ROCKS: [string, XY, number][] = [
    ["westcliffs:coast_granite", [-3300, 2000], 170], ["westcliffs:rock_spire", [-1700, -2600], 150], ["westcliffs:wind_hole_rock", [300, -1200], 150], ["westcliffs:coast_granite", [2300, -2000], 170],
    ["westcliffs:rock_spire", [-4100, -800], 150], ["westcliffs:coast_granite", [-2900, -4200], 170], ["westcliffs:wind_hole_rock", [-1200, 300], 150], ["westcliffs:rock_spire", [1600, 1700], 150],
    // up on the shelf and the heights
    ["westcliffs:rock_spire", [-2800, -5000], 150], ["westcliffs:coast_granite", [3600, -2700], 170], ["westcliffs:wind_hole_rock", [2900, -5000], 150], ["westcliffs:coast_granite", [-800, -4100], 170],
    ["westcliffs:rock_spire", [3600, -3900], 150], ["westcliffs:coast_granite", [2000, -4300], 170], ["westcliffs:wind_hole_rock", [3300, -5800], 150],
    // on the west down and the headland
    ["westcliffs:coast_granite", [-3900, 2700], 170], ["westcliffs:wind_hole_rock", [-2900, 4000], 150], ["westcliffs:rock_spire", [-1000, 4100], 150], ["westcliffs:coast_granite", [1800, 4000], 170],
    ["westcliffs:coast_granite", [-5000, 3600], 170], ["westcliffs:rock_spire", [-4600, 1600], 150], ["westcliffs:coast_granite", [4200, 3900], 170],
  ];
  for (const [id, at, r] of ROCKS) if (free(at[0], at[1], r)) prop(id, at, rnd() * 360, r + 40, ring(r * 0.85));
  scatter("northcold:iced_rocks", [0, 0], 5200, 10, 150, (s) => ring(110 * s));
  // fallen rock at the feet of the cliffs
  for (const poly of [EL, EH, WD, HP]) {
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

  // ---- snow pines: thick at the field's edges and in stands down the valley's sides, thin out
  // in the middle and up on the levels; glades kept round the landmarks; a few snapped ----
  const GLADES: [XY, number][] = [[GROVE, 1250], [HARP, 900], [HERMIT, 900], [FORT, 1300], [HUB, 600], [E_EXIT, 900], [S_EXIT, 900], ...CAVES.map(([c]): [XY, number] => [c, 650])];
  const STANDS: [XY, number][] = [
    [[-2600, -3300], 900], [[-4400, -4300], 1000], [[-1700, 1900], 800], [[1800, -2200], 700], [[-300, -3500], 600], [[2500, -4500], 900], [[-3300, 3300], 900], [[-4800, 900], 700],
    [[2200, 1300], 600], [[-2700, -800], 600], [[1700, 2100], 500], [[-500, 1500], 550], [[2600, -1700], 450], [[1500, 3700], 600], [[-1500, 3900], 650], [[-600, -2400], 450], [[3300, -5000], 600],
  ];
  for (let x = -R + 150; x < R; x += 360)
    for (let y = -R + 150; y < R; y += 360) {
      const px = x + (rnd() - 0.5) * 300, py = y + (rnd() - 0.5) * 300;
      const edge = Math.min(R - Math.abs(px), R - Math.abs(py)), stand = STANDS.some(([c, r]) => Math.hypot(px - c[0], py - c[1]) < r);
      const want = edge < 650 ? 0.45 : stand ? 0.78 : f.h(px, py) > 200 ? 0.09 : 0.15;
      if (rnd() > want || GLADES.some(([c, r]) => Math.hypot(px - c[0], py - c[1]) < r) || inPoly(BEACH, px, py) || nearTrack(px, py, 330) || !free(px, py, 140, 20)) continue;
      put(`flora:${["SnowPine", "SnowPineSmall", "SnowPine", "SnowPineSmall", "PineSmall"][Math.floor(rnd() * 5)]}`, [px, py], rnd() * 360, { s: 0.7 + rnd() * 0.4 });
      take(px, py, 170);
    }
  for (const [at, h] of [[[-3300, -1600], 30], [[200, -2500], 150], [[-2000, 2900], 260], [[2900, -4700], 80], [[-4200, 2100], 200]] as [XY, number][]) if (free(at[0], at[1], 150, 60)) prop("westcliffs:snapped_pine", at, h, 220, { solid: [disc(28, "tree", 0, 0)] });
  for (const at of [[-3700, 500], [1200, 2300], [-1900, -1800], [3300, -4600], [-300, 4200], [-5000, -3800]] as XY[]) if (free(at[0], at[1], 160, 120)) prop("westhills:ragged_pine", at, -100 + (rnd() - 0.5) * 40, 220, { s: 0.8 + rnd() * 0.3, solid: [disc(30, "tree")] });

  // ---- ground cover: grass bent by the wind, thrift, drifts, the grass of the downs in the south ----
  scatter("westcliffs:sea_grass", [-1500, 3600], 2500, 10, 110);
  scatter("westcliffs:sea_grass", [3700, 3300], 900, 4, 110);
  scatter("westcliffs:thrift_cushions", [-2000, 3500], 2600, 8, 100);
  scatter("westcliffs:thrift_cushions", [0, -500], 3000, 5, 100);
  scatter("northcold:flattened_grass", [-1000, -1000], 4000, 18, 170);
  scatter("northcold:flattened_grass", [1500, -4400], 1800, 6, 170);
  scatter("snowland:snow_drift", [-1000, -1500], 3800, 10, 220);
  scatter("snowland:snow_drift", [1500, -4500], 1800, 4, 220);
  scatter("snowland:snow_drift", [-1500, 3600], 2400, 5, 220);
  scatter("snowland:dry_grass", [-4200, -1500], 1800, 10, 80, () => ({ solid: "none" }), (x, y) => inBox(x, y) && x < -2600);
  scatter("westhills:heather", [-4500, 1000], 1500, 8, 90, () => ({ solid: "none" }), (x, y) => inBox(x, y) && x < -3000);
  scatter("westhills:heather", [-4300, -2800], 1500, 6, 90, () => ({ solid: "none" }), (x, y) => inBox(x, y) && x < -3000);
  scatter("snowland:dead_branches", [0, 0], 5200, 6, 110);

  // ---- past the edge: snowy pines over the ridge and the heights, on the moor; nothing on the sea ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const onTrack = (x: number, y: number) => [[0, 0], [280, 0], [-280, 0], [0, 280], [0, -280]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const wet = (x: number, y: number) => inPoly(SEA, x, y) || toLine([x, y], SHORE) < 350;
  f.woods(area, ["SnowPine", "SnowPine", "SnowPineSmall", "SnowPineSmall"], (x, y) => inside(x, y) || onTrack(x, y) || wet(x, y), { count: 300, spacing: 430, tries: 7000 });
  f.woods(area, ["wind_pine"], (x, y) => inside(x, y) || onTrack(x, y) || wet(x, y), { count: 30, spacing: 900, tries: 1500, kit: "westmount" });

  // ---- monsters: the valley floor, the moor, the shelf and the heights, the down and the headland ----
  const quiet = (x: number, y: number) => Math.hypot(x - HERMIT[0], y - HERMIT[1]) < 800 || Math.hypot(x - GROVE[0], y - GROVE[1]) < 650 || inPoly(BEACH, x, y);
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 760, keepOut: quiet, max: 52 });

  // ---- people ----
  const npcs: NpcSpec[] = [
    { id: "humming_poet", x: hx(-470, 140)[0], y: hx(-470, 140)[1], face: hf + 180, name: "ตาเอเลียส", title: "กวีเฒ่าแห่งหุบหินร้องเพลง", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "teal", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "ฟังสิ ลมทะเลพัดผ่านเสาหินกลวงทีไร มันร้องเพลงคนละเสียง ข้าเขียนเพลงพวกนั้นลงกระดาษมาสี่สิบปีแล้ว",
        "หินรูปพิณบนแหลมโน่นเล่นเพลงเพราะที่สุดตอนพายุเข้า แต่ไม่มีใครกล้าไปฟังใกล้ ๆ หรอก",
        "ค้างคาวในถ้ำร้องตอบเสาหิน เสียงของมันกระแทกหูจนมึนได้ ระวังตัวไว้เถอะ",
      ] },
    { id: "humming_minstrel", x: GROVE[0] - 820, y: GROVE[1] + 80, face: gh, name: "ลีร่า", title: "นักพิณพเนจร", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "auburn", eyes: "violet", top: "top_adventurer_teal", bottom: "bottom_adventurer_cocoa" },
      lines: [
        "ฉันเดินทางมาจากไฮแลนด์ ฮิล เพื่อจำทำนองของดงหินนี้ไปเล่นให้คนในเมืองฟัง",
        "บนผาตะวันออกมีด่านเก่าที่พังไปแล้ว ตอนนี้มีแต่การ์กอยล์หินเกาะอยู่เต็ม พวกมันบินมาจากช่องเขาตะวันตก",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [snow.mesh, shingle.mesh, seaSheet],
    sky: "#a5b5c4",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -4400, y: 260 },
    npcs,
    labels: [
      { x: S_EXIT[0] + 150, y: S_EXIT[1] + 250, text: "ทางไปที่ราบเนินเขา", kind: "gate" },
      { x: E_EXIT[0] - 200, y: E_EXIT[1] + 250, text: "ทางไปหน้าผาทะเลเหนือ", kind: "gate" },
      { x: GROVE[0] - 700, y: GROVE[1] - 500, text: "ดงหินร้องเพลง" },
      { x: HARP[0] - 650, y: HARP[1] - 300, text: "หินรูปพิณยักษ์" },
      { x: HERMIT[0] - 700, y: HERMIT[1] - 300, text: "อาศรมกวีเฒ่า" },
      { x: FORT[0] - 900, y: FORT[1], text: "ซากด่านบนผาตะวันออก" },
      { x: 2900, y: 300, text: "อ่าวหินกรวด", kind: "small" },
      { x: CAVES[0][0][0] - 500, y: CAVES[0][0][1], text: "ถ้ำค้างคาว", kind: "small" },
      { x: CAVES[1][0][0] - 300, y: CAVES[1][0][1] + 300, text: "ถ้ำเสียงสะท้อน", kind: "small" },
      { x: 2000, y: -3000, text: "ลานผาชั้นกลาง", kind: "small" },
      { x: -2600, y: 3200, text: "เนินริมทะเลตะวันตก", kind: "small" },
      { x: -3800, y: -3600, text: "ทุ่งหญ้าใต้ผา", kind: "small" },
    ],
  });
}
