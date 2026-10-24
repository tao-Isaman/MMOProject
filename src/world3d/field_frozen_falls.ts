// หุบน้ำตกเยือกแข็ง (the valley of the frozen falls), monsters Lv 46-56: a valley under the royal
// mountains east of the hunting forest. Across its head the mountain wall stands nine metres
// sheer, and down the middle of it the great waterfall hangs frozen in columns of ice over a lake
// frozen hard enough to walk on (the snow otters slide over it on their bellies). From the lake's
// south-west corner the one stretch of open water runs off as a stream, west through the snow to
// the hunting forest; the path from the forest crosses it on a bridge of old ice. West of the lake
// a ledge against the wall, climbed by a ramp from the path, carries a terrace of ice pillars
// where the spray of the falls once froze, looking out over the falls and the lake. In the
// north-east the wall breaks down to a lower bluff that goes on east above the sea's inlet (the
// bluff of the horse meadow next door): up there hot springs steam in their terraces at the
// cliff's edge, and the hermit keeps his stone hut beside them. Paths part at a waystone south of
// the stream: south through a pass in the mesas to the west steppe, east to the horse meadow, and
// north to the lake shore where a fisherman sits by his hole in the ice. Toward the south and the
// east the snow wears thin and the dry grass of the steppe and the meadow comes through.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: west -> royal_hunt (middle of the edge), south -> west_steppe (through the mesas'
//   pass, where the steppe's own way north meets the edge), east -> horse_meadow (where the
//   meadow's own way west meets the edge)

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits, seeded } from "./town";
import { KIT as ROYAL } from "./kits/royalmount";
import { KIT as SNOW, blobPoly } from "./kits/snowland";
import { KIT as NORTHCOLD } from "./kits/northcold";
import { KIT as STEPPE } from "./kits/steppe";
import { KIT as ICEBERG } from "./kits/iceberg";
import { material } from "./textures";
import { smooth, band, sheet, inPoly, toLine, nearestOn, pieces, dense, towards, runAlong, rampOff, beyond } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(ROYAL, SNOW, NORTHCOLD, STEPPE, ICEBERG);

const R = 5500; // the walkable box
const A = 9000; // the ground

function bandAlong(pts: XY[], w: (p: XY) => number): XY[] {
  const left: XY[] = [], right: XY[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, h = w(p) / 2;
    left.push([p[0] - ((b[1] - a[1]) / L) * h, p[1] + ((b[0] - a[0]) / L) * h]);
    right.push([p[0] + ((b[1] - a[1]) / L) * h, p[1] - ((b[0] - a[0]) / L) * h]);
  });
  return [...left, ...right.reverse()];
}

// ---- the sea's inlet in the north-east corner: the horse meadow's coast comes in over the east
// edge and runs north to meet the mountains (the land on its left) ----
const SHORE: XY[] = smooth([[4450, -A - 400], [4450, -6676], [4480, -5500], [4650, -4900], [5000, -4450], [5600, -4150], [6676, -3900], [A + 400, -3800]], 5);
const SEA: XY[] = [...SHORE, [A + 400, -A - 400]];

// ---- the levels ----
// the mountain wall across the valley's head (900), the heights behind it (1500)
const GW: XY[] = [[A, A], [4300, A], [4500, 4200], [4000, 2600], [3800, 1200], [3720, 300], [3750, -600], [3850, -1500], [4100, -2300], [4600, -3200], [5100, -3880], [5700, -3920], [6676, -3650], [A, -3550]];
const GW2: XY[] = [[A, A], [5600, A], [5800, 3000], [5400, 500], [5500, -2000], [6200, -2700], [A, -2900]];
// the bluff of the hot springs (420) in the north-east, going on east over the edge as the horse
// meadow's bluff, its north side cliffs into the inlet (it runs in under the wall)
const L1: XY[] = [[3000, -A], [3100, -6000], [3000, -5000], [3150, -4000], [2900, -3000], [3200, -2500], [3800, -2250], [4500, -2600], [5100, -3500], [4950, -4250], [4560, -4680], [4380, -5150], [4320, -5600], [4300, -6676], [4300, -A]];
const RL1 = rampOff([3150, -4000], [2900, -3000], [3700, -3500], 1300, 460);
// the terrace of ice pillars (450) west of the lake against the wall
const L2: XY[] = [[2500, 1700], [3500, 1350], [4100, 1500], [4600, 2600], [4900, 3800], [4700, 4900], [3000, 5000], [2300, 4300], [2100, 3000]];
const RL2 = rampOff([2300, 4300], [2100, 3000], [3100, 3200], 1350, 440);
// the mesas along the south, past the edge (the steppe's north wall), the pass between them
const MESA_W: XY[] = [[-A, A], [-6000, A], [-6200, 4000], [-5850, 2300], [-6000, 1100], [-A, 1100]];
const MESA_E: XY[] = [[-A, -500], [-6050, -500], [-5800, -2500], [-6300, -5000], [-6000, -A], [-A, -A]];

// ---- the frozen lake under the falls (walked on), the stream off it, its open water ----
const LAKE_C: XY = [2400, -300];
const LAKE: XY[] = blobPoly(LAKE_C, 1200, 1650, 41, 0.08, 36);
const STREAM: XY[] = smooth([[1750, 250], [1300, 700], [850, 1200], [300, 1850], [-300, 2600], [-900, 3300], [-1400, 4300], [-1780, 5500], [-1800, 6676], [-1800, 9400]], 5);
const SW = 520;
const FALLS: XY = [3700, -150];

// ---- the dry grass coming through toward the steppe (south) and the meadow (east): all of it
// past a ragged line a fifth of the way in, patches of it in the snow inside the line that thin
// out away from it ----
const rag = (t: number, k: number) => 380 * Math.sin(t / 700 + k) + 220 * Math.sin(t / 290 + 2 * k) + 50 * Math.sin(t / 130 + 3 * k);
const southLine = (y: number) => -4300 + rag(y, 1.3);
const eastLine = (x: number) => -4300 + rag(x, 2.1);
const DRY: XY[] = [];
for (let y = A + 400; y >= -4300; y -= 120) DRY.push([southLine(y), y]);
for (let x = -4300; x <= 4600; x += 120) DRY.push([x, eastLine(x)]);
DRY.push([4600, -A - 400], [-A - 400, -A - 400], [-A - 400, A + 400]);
const dryness = (x: number, y: number) =>
  inPoly(DRY, x, y) ? 1 : Math.max(0, 1 - Math.max(0, x - southLine(y)) / 2600, 1 - Math.max(0, y - eastLine(x)) / 2600);

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(504, {
    hills: [
      { x: -2600, y: 2200, r: 1300, h: 120 }, { x: -3400, y: -2300, r: 1500, h: 150 }, { x: 600, y: -2600, r: 1100, h: 100 }, { x: -1000, y: -4200, r: 1000, h: 80 },
      { x: 600, y: 3900, r: 1100, h: 90 }, { x: -4300, y: 4300, r: 1200, h: 140 }, { x: 2000, y: -4400, r: 900, h: 70 }, { x: -2200, y: -800, r: 900, h: -60 },
      { x: -7500, y: 0, r: 2600, h: 200 }, { x: 0, y: 7700, r: 2600, h: 260 }, { x: -1500, y: -7600, r: 2400, h: 220 },
    ],
    plateaus: [
      { poly: dense(L1), h: 420, ramps: [RL1] },
      { poly: dense(L2), h: 450, ramps: [RL2] },
      { poly: dense(GW, 600), h: 900 },
      { poly: dense(GW2, 900), h: 1500 },
      { poly: dense(MESA_W, 800), h: 680 },
      { poly: dense(MESA_E, 800), h: 680 },
    ],
    rock: "Royalmount_CliffGranite",
    keep: [[3720, -560], [3720, -150], [3725, 260]],
  });
  const { put, rnd } = f;

  // ---- the ice bridge where the path from the forest crosses the stream ----
  const nb = nearestOn(STREAM, [-560, 2950]);
  let bax: XY = [-nb.dir[1], nb.dir[0]];
  if (bax[1] < 0) bax = [-bax[0], -bax[1]]; // (from the south bank to the north)
  const BR = { at: nb.at, off: (k: number): XY => [nb.at[0] + bax[0] * k, nb.at[1] + bax[1] * k] };

  // ---- the paths ----
  const W_EXIT: XY = [0, 5150], S_EXIT: XY = [-5150, 300], E_EXIT: XY = [1240, -5150];
  const HUB: XY = [-1400, 900];
  const WEST: XY[] = [...smooth([[0, 9400], [0, 6676], W_EXIT, [60, 4300], [-80, 3700], BR.off(760), BR.off(560)]), ...smooth([BR.off(-560), BR.off(-760), [-1300, 1900], HUB])];
  const SOUTH: XY[] = smooth([HUB, [-2500, 650], [-3700, 350], [-4500, 260], S_EXIT, [-6676, 300], [-9400, 300]]);
  const EAST: XY[] = smooth([HUB, [-800, -300], [80, -1600], [700, -2900], [1050, -4150], E_EXIT, [1240, -6676], [1240, -9400]]);
  const SHORE_WAY: XY[] = smooth([[-1050, 650], [-200, 350], [600, 100], [1080, -150]]);
  const TERRACE: XY[] = [...smooth([[60, 4300], [500, 4000], beyond(RL2.top, RL2.bottom, 380)]), RL2.bottom, RL2.top, ...smooth([beyond(RL2.bottom, RL2.top, 350), [3100, 3000], [3400, 2300]])];
  const SPRINGS: XY[] = [...smooth([[750, -3150], [1300, -3700], beyond(RL1.top, RL1.bottom, 380)]), RL1.bottom, RL1.top, ...smooth([beyond(RL1.bottom, RL1.top, 350), [3700, -3600], [3800, -4300]])];
  const TRACKS = [WEST, SOUTH, EAST, SHORE_WAY, TERRACE, SPRINGS];
  const roads = TRACKS.map((t, i) => band(t, i < 3 ? 470 : 400));

  // ---- the ground: snow, the dry grass coming through it south and east, the water ----
  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const streamBand = bandAlong(STREAM, () => SW);
  const ROAD: [number, number, number] = [0.84, 0.77, 0.68];
  const ground = f.ground({ area, roads, plazas: [], water: [streamBand, SEA], base: "snow", road: ROAD });
  // the steppe's grass: a second ground a hair over the snow wherever the drifts have blown off,
  // patches of it out in the snow that grow and run together toward the south and east edges
  const rndP = seeded(5041), dry: XY[][] = [];
  for (let x = -A; x < A; x += 360)
    for (let y = -A; y < A; y += 360) {
      const cx = x + rndP() * 360, cy = y + rndP() * 360, k = dryness(cx, cy), r = 360 * (0.3 + 0.5 * k) * (0.8 + rndP() * 0.4);
      if (k <= 0.02 || k >= 1 || rndP() > k * 0.9 || inPoly(LAKE, cx, cy)) continue;
      const p = blobPoly([cx, cy], r * (0.8 + rndP() * 0.5), r * (0.7 + rndP() * 0.4), 6000 + dry.length, 0.22, 16);
      if (p.every(([px, py]) => !inPoly(DRY, px, py))) dry.push(p);
    }
  const holes = (patches: XY[][]) => {
    // a polygon with holes, as one outline (each hole wound the other way, joined to its first point)
    const ar = (p: XY[]) => p.reduce((t, [x, y], i) => t + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0);
    const outer: XY[] = [[-A - 400, -A - 400], [A + 400, -A - 400], [A + 400, A + 400], [-A - 400, A + 400]], out: XY[] = [...outer, outer[0]];
    for (const h of patches) {
      const ringP = Math.sign(ar(h)) === Math.sign(ar(outer)) ? [...h].reverse() : h;
      out.push(...ringP, ringP[0], outer[0]);
    }
    return out;
  };
  const steppe = f.ground({ area, roads, plazas: [], water: [streamBand, SEA, LAKE, holes([DRY, ...dry])], base: "steppe", road: ROAD });
  steppe.mesh.position.y += 3;
  steppe.mesh.renderOrder = 1;
  const isDry = (x: number, y: number) => inPoly(DRY, x, y) || dry.some((p) => inPoly(p, x, y));

  // ---- the lake's ice, the stream's open water, the inlet of the sea ----
  const lakeIce = sheet(LAKE, 2, "Royalmount_LakeIce");
  lakeIce.renderOrder = 2;
  const seaSheet = (() => {
    const shape = new THREE.Shape();
    [...SHORE.map(([x, y]): XY => [x + 220, y]), [30000, -3800], [30000, -30000], [4670, -30000]].forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
    const m = new THREE.Mesh(new THREE.ShapeGeometry(shape).applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1)), material("Royalmount_NorthSea"));
    m.position.y = -14;
    m.receiveShadow = true;
    return m;
  })();
  const scenery = [
    steppe.mesh, lakeIce, seaSheet,
    sheet(bandAlong(STREAM, () => SW + 160), -70, "Royalmount_CliffDark"),
    sheet(bandAlong(STREAM, () => SW + 110), -14, "Royalmount_ColdWater"),
  ];
  for (const part of pieces(STREAM.filter(([x, y]) => Math.abs(x) < R + 1500 && Math.abs(y) < R + 1500 && !inPoly(LAKE, x, y)), [BR.at], 330)) f.blockBand(part, SW + 60, { step: 230 });
  // (the open water where the lake drains into the stream)
  f.blockDisc([1600, 400], 330);
  f.blockBand(SHORE.filter(([x, y]) => Math.abs(x) < R + 1600 && Math.abs(y) < R + 1600).map(([x, y]): XY => [x + 120, y]), 300, { kind: "sea" });
  put("royalmount:ice_bridge", BR.at, runAlong(bax[0], bax[1]), { solid: [-1, 1].map((s) => ({ kind: "rail", x: 0, y: s * 168, w: 900, d: 40, rot: 0 })) });

  // ---- the ways out ----
  f.exit("royal_hunt", W_EXIT, [-40, 4450]);
  f.exit("west_steppe", S_EXIT, [-4450, 280]);
  f.exit("horse_meadow", E_EXIT, [1150, -4450]);

  // ---- placing things ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine([x, y], t) < d);
  const wet = (x: number, y: number, d: number) => toLine([x, y], STREAM) < SW / 2 + d || inPoly(SEA, x - d, y);
  const onLake = (x: number, y: number, d = 0) => inPoly(LAKE, x, y) || Math.hypot((x - LAKE_C[0]) / 1200, (y - LAKE_C[1]) / 1650) < 1 + d / 1300;
  const free = (x: number, y: number, r: number, gap = 0) =>
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    !wet(x, y, r * 0.5) && f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const take = (x: number, y: number, r: number) => taken.push([x, y, r]);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    take(at[0], at[1], r);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] as SolidSpec[] });
  const inBox = (x: number, y: number) => Math.abs(x) < R - 150 && Math.abs(y) < R - 150;
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120, o: (s: number) => Parameters<typeof put>[3] = () => ({}), where = inBox) => {
    for (let i = 0, made = 0; i < n * 12 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!where(x, y) || nearTrack(x, y, rad + 230) || onLake(x, y, rad) || !free(x, y, rad, 40)) continue;
      const s = 0.8 + rnd() * 0.4;
      put(ref, [x, y], rnd() * 360, { s, ...o(s) });
      take(x, y, rad * s);
      made++;
    }
  };
  for (const t of TRACKS) for (let i = 0; i < t.length; i += 2) take(t[i][0], t[i][1], 200);
  take(BR.at[0], BR.at[1], 700);

  // ---- the great frozen falls down the wall, the plunge pool's ice, the lake ----
  prop("royalmount:great_icefall", [FALLS[0] - 30, FALLS[1]], towards(-1, -0.04), 900, { solid: [{ kind: "ice", x: -110, y: 0, w: 280, d: 980, rot: 0 }] });
  // pillars of ice standing out on the lake, the fisherman's hole and his sled, shore ice
  for (const [at, h, s] of [[[2900, 900], 30, 0.8], [[2700, -1500], 120, 0.7], [[3100, -800], 250, 0.6]] as [XY, number, number][]) prop("royalmount:ice_columns", at, h, 260 * s, { s, ...ring(150 * s, "ice") });
  const HOLE: XY = [1550, -900];
  prop("snowland:ice_hole", HOLE, 30, 160, { solid: [{ kind: "hole", x: 0, y: 0, r: 70 }] });
  prop("iceberg:sled", [1350, -1250], 60, 130);
  for (let k = 0; k < 22; k++) {
    const a = (k / 22) * Math.PI * 2, at: XY = [LAKE_C[0] + Math.cos(a) * 1230, LAKE_C[1] + Math.sin(a) * 1690];
    if (at[0] > 3300 || nearTrack(at[0], at[1], 300) || toLine(at, STREAM) < SW) continue;
    put(k % 3 ? "royalmount:ice_shelf" : "northcold:frozen_reeds", at, rnd() * 360, { s: 0.6 + rnd() * 0.35, solid: "none" });
  }
  for (const at of [[1900, 900], [3100, 1000], [3300, -1700], [1500, -1900]] as XY[]) put("northcold:drift_floes", at, rnd() * 360, { s: 0.6, z: 2, solid: "none" });

  // ---- the terrace of ice pillars west of the lake ----
  const PILLARS: XY = [3600, 2900];
  for (const [at, h, s] of [[[3600, 2900], 0, 1], [[3200, 3700], 140, 0.85], [[4000, 2300], 70, 0.75], [[2700, 4400], 200, 0.8], [[3900, 3900], 300, 0.9]] as [XY, number, number][])
    if (free(at[0], at[1], 220 * s)) prop("royalmount:ice_columns", at, h, 280 * s, { s, ...ring(160 * s, "ice") });
  for (const at of [[3300, 2400], [2800, 3200], [4200, 4500], [3500, 4600]] as XY[]) if (free(at[0], at[1], 90)) prop("snowland:ice_crystals", at, rnd() * 360, 140, ring(70, "crystal"));
  prop("royalmount:royal_waystone", [2350, 3300], towards(-1, 0.3), 80, ring(45, "post"));

  // ---- the hot springs on the bluff, the hermit's hut beside them ----
  const SPRING1: XY = [4000, -3250], SPRING2: XY = [3650, -4250], HUT: XY = [3500, -5000];
  prop("royalmount:hot_spring", SPRING1, 40, 380, { solid: [{ kind: "pool", x: 0, y: 0, r: 250 }] });
  prop("royalmount:hot_spring", SPRING2, 200, 330, { s: 0.85, solid: [{ kind: "pool", x: 0, y: 0, r: 250 }] });
  prop("royalmount:hermit_hut", HUT, towards(-1, 0.6), 420, { solid: [{ kind: "building", x: 0, y: 0, w: 500, d: 420, rot: 0 }] });
  prop("snowland:cairn", [3350, -4450], 0, 70, ring(45));
  // the hermit's bench and firewood by the springs, his drying rack
  prop("snowland:log_pile", [3150, -5350], 80, 260);
  if (free(3300, -2900, 120)) prop("snowland:lean_to", [3300, -2900], towards(0.3, 1), 260);
  prop("royalmount:icicle_crag", [4300, -2900], 30, 240, { s: 0.75, ...ring(160) });

  // ---- the waystone where the paths part, the ways out ----
  prop("royalmount:royal_waystone", [HUB[0] - 100, HUB[1] - 420], towards(1, 0.3), 80, ring(45, "post"));
  prop("royalmount:royal_waystone", [-380, 4800], towards(1, 0.1), 80, ring(45, "post"));
  prop("royalmount:royal_waystone", [-4700, 700], towards(1, -0.3), 80, ring(45, "post"));
  prop("royalmount:royal_waystone", [1650, -4800], towards(-0.2, 1), 80, ring(45, "post"));
  prop("steppe:signpost", [-4600, -150], 90, 60);
  prop("steppe:signpost", [800, -4700], 180, 60);

  // ---- rocks and the stony ground under the wall ----
  const ROCKS: [string, XY, number][] = [
    ["royalmount:icicle_crag", [3300, -2200], 170], ["royalmount:icicle_crag", [3150, 1500], 170], ["snowland:snow_boulder", [-600, 2000], 130],
    ["royalmount:silver_boulder", [-2700, 3700], 120], ["snowland:rock_cluster", [-3000, -3600], 170], ["steppe:boulder", [-4200, -2400], 160],
    ["snowland:snow_boulder", [1800, 2600], 130], ["royalmount:silver_boulder", [-200, -3600], 120], ["steppe:rock_cluster", [-2300, -4600], 200],
    ["snowland:flat_slabs", [-3300, 1300], 150], ["snowland:rock_cluster", [500, 2900], 170], ["steppe:boulder_flat", [2200, -3600], 180],
    ["snowland:snow_boulder", [2500, -2600], 130], ["royalmount:silver_boulder", [-1300, -2000], 120],
  ];
  for (const [id, at, r] of ROCKS) if (free(at[0], at[1], r)) prop(id, at, rnd() * 360, r + 40, ring(r * 0.8));
  scatter("royalmount:deadfall", [-2000, 2500], 2500, 3, 320, () => ({ solid: [{ kind: "log", x: 0, y: 0, w: 560, d: 140, rot: 78 }] }), (x, y) => inBox(x, y) && dryness(x, y) < 0.4);
  scatter("snowland:snowy_stump", [0, 0], 5200, 8, 80, () => ring(40, "tree"));
  // the valley floor round the waystone: crags with icicles, boulders, dogwood
  for (const at of [[-2400, -300], [-200, 1300], [-2800, 2400], [300, -3200], [-3700, 1800], [-1000, -3100]] as XY[])
    if (free(at[0], at[1], 170)) prop(rnd() < 0.5 ? "royalmount:icicle_crag" : "snowland:rock_cluster", at, rnd() * 360, 230, { s: 0.7 + rnd() * 0.3, ...ring(130) });

  // ---- the trees: snowy pines in the west and up on the ledges, birches and pines out on the dry
  // ground toward the steppe and the meadow ----
  const glades: [XY, number][] = [[HUB, 900], [S_EXIT, 800], [E_EXIT, 800], [W_EXIT, 800], [[3700, -3800], 1100], [PILLARS, 800], [[-3000, -1000], 900], [[-500, -1800], 700]];
  const inGlade = (x: number, y: number) => glades.some(([c, r]) => Math.hypot(x - c[0], y - c[1]) < r);
  for (let x = -R + 150; x < R; x += 440)
    for (let y = -R + 150; y < R; y += 440) {
      const px = x + (rnd() - 0.5) * 340, py = y + (rnd() - 0.5) * 340, k = dryness(px, py);
      if (rnd() < 0.42 + k * 0.25 || inGlade(px, py) || onLake(px, py, 250) || nearTrack(px, py, 380) || !free(px, py, 150, 30)) continue;
      const kinds = rnd() < k ? ["Birch", "PineSmall", "Birch", "Pine"] : ["SnowPine", "SnowPine", "SnowPineSmall", "FrostOak"];
      put(`flora:${kinds[Math.floor(rnd() * kinds.length)]}`, [px, py], rnd() * 360, { s: 0.75 + rnd() * 0.45 });
      take(px, py, 160);
    }

  // ---- ground cover ----
  scatter("royalmount:snow_juniper", [0, 0], 5300, 20, 110, () => ({ solid: "none" }));
  scatter("royalmount:red_osier", [-1500, 2500], 3000, 10, 90, () => ({ solid: "none" }));
  scatter("snowland:snow_drift", [800, 2500], 3200, 8, 200, () => ({ solid: "none" }), (x, y) => inBox(x, y) && dryness(x, y) < 0.3);
  scatter("snowland:dry_grass", [0, 0], 5300, 30, 70, () => ({ solid: "none" }));
  scatter("steppe:grass_tuft", [0, 0], 5300, 120, 60, () => ({ solid: "none" }), (x, y) => inBox(x, y) && isDry(x, y));
  scatter("steppe:scrub", [-2000, -2000], 4000, 16, 90, () => ({ solid: "none" }), (x, y) => inBox(x, y) && dryness(x, y) > 0.4);
  scatter("snowland:frost_shrub", [0, 0], 5300, 12, 90, () => ring(45, "bush"));
  for (let i = 3; i < STREAM.length - 3; i += 2) {
    const [ax, ay] = STREAM[i], [bx, by] = STREAM[i + 1], L = Math.hypot(bx - ax, by - ay) || 1;
    for (const s of [-1, 1]) {
      if (rnd() < 0.4) continue;
      const o = SW / 2 + 40 + rnd() * 60, x = ax - ((by - ay) / L) * s * o, y = ay + ((bx - ax) / L) * s * o;
      if (!inBox(x, y) || nearTrack(x, y, 320) || Math.hypot(x - BR.at[0], y - BR.at[1]) < 800 || onLake(x, y) || !f.level(x, y, 100)) continue;
      put(rnd() < 0.55 ? "royalmount:ice_shelf" : "northcold:frozen_reeds", [x, y], rnd() * 360, { s: 0.55 + rnd() * 0.3, solid: "none" });
    }
  }
  // the inlet's foot: iced rocks along the shore under the cliffs, floes out on the water
  for (let i = 0; i + 1 < SHORE.length; i += 2) {
    const [x, y] = SHORE[i];
    if (Math.abs(x) > R + 1500 || Math.abs(y) > R + 1600 || rnd() < 0.3) continue;
    put("northcold:iced_rocks", [x + 60 + rnd() * 80, y + (rnd() - 0.5) * 100], rnd() * 360, { s: 0.6 + rnd() * 0.4, solid: "none" });
  }
  for (const [x, y, h, s] of [[5600, -5200, 30, 1], [6400, -4700, 200, 0.8], [5300, -6300, 120, 1.1], [6800, -6000, 60, 0.9]] as number[][]) put("northcold:drift_floes", [x, y], h, { z: -14, s, solid: "none" });
  put("northcold:sea_stack", [6200, -5600], 40, { z: -14, s: 0.8, solid: "none" });

  // ---- past the edge: snowy pines west and on the wall, birch and pine woods east and south ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const onTrack = (x: number, y: number) => [[0, 0], [280, 0], [-280, 0], [0, 280], [0, -280]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const out = (x: number, y: number) => inside(x, y) || onTrack(x, y) || wet(x, y, 200) || inPoly(SEA, x - 300, y);
  f.woods(area, ["SnowPine", "SnowPine", "SnowPineSmall", "FrostOak"], (x, y) => out(x, y) || dryness(x, y) > 0.45, { count: 480, spacing: 400, tries: 7000 });
  f.woods(area, ["Birch", "Birch", "Pine", "PineSmall", "AutumnTree"], (x, y) => out(x, y) || dryness(x, y) <= 0.45 || f.h(x, y) > 500, { count: 300, spacing: 420, tries: 6000 });
  f.woods({ x0: 3600, x1: R, y0: -R, y1: R }, ["SnowPine", "SnowPineSmall"], (x, y) => f.h(x, y) < 880 || onTrack(x, y), { count: 24, spacing: 520, tries: 1200 });
  for (let i = 0; i < 160; i++) {
    const x = (rnd() * 2 - 1) * A, y = (rnd() * 2 - 1) * A;
    if (out(x, y) || dryness(x, y) < 0.5 || !f.level(x, y, 60)) continue;
    put(i % 6 ? "steppe:grass_tuft" : "steppe:scrub", [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.6, solid: "none" });
  }

  // ---- monsters: the lake's ice and its shores, the valley, the terrace and the bluff ----
  const quiet = (x: number, y: number) => Math.hypot(x - HUT[0], y - HUT[1]) < 700 || Math.hypot(x - HOLE[0], y - HOLE[1]) < 500;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 760, keepOut: quiet, max: 52 });

  const npcs: NpcSpec[] = [
    { id: "frozen_falls_hermit", x: HUT[0] - 520, y: HUT[1] + 200, face: 170, name: "ท่านโยฮัน", title: "ฤๅษีแห่งน้ำตกเยือกแข็ง", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "blue", top: "top_priestess_white", bottom: "bottom_warrior_black" },
      lines: [
        "น้ำตกนั้นแข็งค้างมาตั้งแต่ปีที่ราชินีหิมะตื่นขึ้นทางเหนือ ไม่เคยละลายอีกเลย",
        "บ่อน้ำร้อนพวกนี้คือของขวัญจากภูเขา แช่ตัวสักครู่ความหนาวก็หายไปจากกระดูก",
        "นางไม้ที่ล่องลอยแถวเสาน้ำแข็งเคยเป็นวิญญาณของน้ำตก เมื่อน้ำหยุดไหล พวกนางก็โกรธเกรี้ยว",
      ] },
    { id: "frozen_falls_fisher", x: HOLE[0] - 260, y: HOLE[1] + 160, face: 30, name: "แม็กนัส", title: "คนตกปลาใต้น้ำแข็ง", role: "talk",
      look: { gender: "male", hair: "", hairColor: "auburn", eyes: "amber", top: "top_warrior_navy", bottom: "bottom_warrior_cocoa" },
      lines: [
        "น้ำแข็งบนทะเลสาบหนาพอให้เกวียนวิ่งข้ามได้ แต่ระวังตรงที่น้ำไหลออกเป็นลำธาร ตรงนั้นไม่เคยแข็ง",
        "พวกนากหิมะไถลท้องมาขโมยปลาข้าไปทีละตัว ๆ มันมาเป็นฝูงเสมอ",
        "ทางใต้ผ่านช่องผาไปสเตปป์ตะวันตก ทางตะวันออกไปทุ่งเลี้ยงม้า ส่วนสะพานน้ำแข็งพาไปป่าล่าสัตว์หลวง",
      ] },
  ];

  return f.finishField({
    ground,
    scenery,
    sky: "#b3c3cf",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -80, y: 4350 },
    npcs,
    labels: [
      { x: W_EXIT[0] - 250, y: W_EXIT[1] - 200, text: "ทางไปป่าล่าสัตว์หลวง", kind: "gate" },
      { x: S_EXIT[0] + 200, y: S_EXIT[1] - 250, text: "ทางไปสเตปป์ตะวันตก", kind: "gate" },
      { x: E_EXIT[0] - 250, y: E_EXIT[1] + 200, text: "ทางไปทุ่งเลี้ยงม้า", kind: "gate" },
      { x: FALLS[0] - 900, y: FALLS[1], text: "น้ำตกเยือกแข็ง" },
      { x: LAKE_C[0] - 500, y: LAKE_C[1] + 500, text: "ทะเลสาบน้ำแข็ง" },
      { x: BR.at[0] - 300, y: BR.at[1] - 300, text: "สะพานน้ำแข็ง", kind: "small" },
      { x: PILLARS[0] - 500, y: PILLARS[1] + 300, text: "ลานเสาน้ำแข็ง" },
      { x: SPRING1[0] - 500, y: SPRING1[1] - 300, text: "บ่อน้ำพุร้อน" },
      { x: HUT[0] - 500, y: HUT[1] + 400, text: "กระท่อมหินของฤๅษี", kind: "small" },
      { x: -2200, y: 3200, text: "ลำธารเยือกแข็ง", kind: "small" },
      { x: HUB[0] - 400, y: HUB[1] - 300, text: "ทางแยกหลักหิน", kind: "small" },
      { x: -4300, y: -2500, text: "ทุ่งหญ้าแห้งริมผา", kind: "small" },
    ],
  });
}
