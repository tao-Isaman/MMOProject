// ป่าล่าสัตว์หลวง (the royal hunting forest), monsters Lv 28-36: the king's hunting grounds east
// of the palace, snowy pine hills under the royal mountains. The bridle path comes in from the
// palace's east gate (west edge) under the gateway of antlers and runs east through the pines to
// the valley of the frozen falls (east edge). North of it stands the king's hunting lodge, its
// porch hung with banners, archery butts beside it, and behind it a little frozen pond under a
// frozen cascade off the mountain wall. In the east the path crosses the stag meadow, an open
// glade with hay racks for the deer; over it rises the hunt's rise, a plateau climbed by a ramp
// from the path, where the game-watching tower looks out over the meadow, and on its higher step
// the horn dais from which the royal huntsman sounds the start of the hunt. South of the path a
// stream comes in over the east edge from the frozen falls, winds through a frozen marsh pond and
// runs out over the south edge to the falls of the pine forest by the river; a track parts from
// the path at the meadow, crosses it on a plank bridge and goes down to that forest. On a knoll of
// old pines in the south-west the hunters keep a camp. The royal mountains wall the north (the
// ridge beyond); toward the south edge the snow thins into the green pine forest by the river.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: west -> palace (middle of the edge), east -> frozen_falls (middle of the edge),
//   south -> pine_river (where the pine forest's own way north meets the edge, e 0.64)

import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits, seeded } from "./town";
import { KIT as ROYAL } from "./kits/royalmount";
import { KIT as SNOW, blobPoly } from "./kits/snowland";
import { KIT as PLAINS } from "./kits/plains";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { KIT as NORTHCOLD } from "./kits/northcold";
import { smooth, band, sheet, inPoly, toLine, nearestOn, pieces, dense, towards, runAlong, rampOff, beyond } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(ROYAL, SNOW, PLAINS, TRUNRADA, NORTHCOLD);

const R = 5500; // the walkable box
const A = 9000; // the ground

const ss = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// A strip along a polyline, `w` across at each point, as a polygon.
function bandAlong(pts: XY[], w: (p: XY) => number): XY[] {
  const left: XY[] = [], right: XY[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, h = w(p) / 2;
    left.push([p[0] - ((b[1] - a[1]) / L) * h, p[1] + ((b[0] - a[0]) / L) * h]);
    right.push([p[0] + ((b[1] - a[1]) / L) * h, p[1] - ((b[0] - a[0]) / L) * h]);
  });
  return [...left, ...right.reverse()];
}

// ---- the stream: in over the east edge from the frozen falls (where their stream leaves them),
// through the frozen marsh pond, out over the south edge where the pine forest's falls are ----
const STREAM: XY[] = smooth([[-1800, -9400], [-1800, -6676], [-1820, -5500], [-1980, -4400], [-2450, -3300], [-2280, -2200], [-2760, -1150], [-3350, -480], [-3750, -120], [-4300, 140], [-4800, 260], [-5500, 300], [-6676, 300], [-9400, 300]], 5);
const SW = 520;
const MARSH: XY = [-3800, -150];
const MARSH_P = blobPoly(MARSH, 760, 620, 31, 0.1, 26);
// the little pond behind the lodge, under the frozen cascade off the mountain wall
const POND: XY = [3500, 2750];
const POND_P = blobPoly(POND, 640, 520, 37, 0.1, 24);
const CASCADE: XY = [4520, 2780];

// ---- the levels ----
// the hunt's rise (400) east of the meadow and its higher step (750) with the horn dais
const P1: XY[] = [[1600, -1200], [2700, -900], [3800, -1100], [4600, -1700], [4900, -2800], [4800, -3900], [4300, -4800], [3200, -5100], [2200, -4800], [1600, -4100], [1400, -3100], [1450, -2000]];
const RP1 = rampOff([1400, -3100], [1450, -2000], [3000, -3000], 1200, 460);
const P1B: XY[] = [[3300, -1500], [4200, -1700], [4600, -2600], [4400, -3500], [3700, -3700], [3100, -3200], [3000, -2300]];
const RP1B = rampOff([3700, -3700], [3100, -3200], [3800, -2600], 1060, 440);
// the knoll of old pines (300) in the south-west, its ramp toward the path
const P2: XY[] = [[-1400, 2000], [-1000, 3300], [-1600, 4600], [-2900, 4900], [-3900, 4300], [-4000, 3000], [-3200, 2100]];
const RP2 = rampOff([-1400, 2000], [-1000, 3300], [-2500, 3500], 960, 440);
// the royal mountains along the north (no way up): the wall (700) and the heights behind (1300)
const N1: XY[] = [[A, A], [4900, A], [4700, 4300], [4500, 3400], [4520, 2200], [4900, 1000], [5150, -200], [5300, -1500], [5350, -3000], [5250, -4500], [5600, -6000], [5450, -A], [A, -A]];
const N2: XY[] = [[A, A], [6300, A], [6100, 4200], [6400, 1500], [6200, -1200], [6500, -3800], [6300, -A], [A, -A]];
// low hills rolling on past the west and south edges
const HILLS = [
  { x: -1200, y: -500, r: 1200, h: 90 }, { x: 600, y: 4000, r: 1300, h: 140 }, { x: 2800, y: 4300, r: 1200, h: 110 }, { x: 900, y: -4400, r: 1100, h: 90 },
  { x: -3600, y: -3700, r: 1500, h: 160 }, { x: -4700, y: 1800, r: 1000, h: 80 }, { x: 2500, y: 900, r: 900, h: 70 }, { x: -1900, y: 800, r: 800, h: -60 },
  { x: 7600, y: 0, r: 3000, h: 300 }, { x: -7600, y: 5000, r: 2800, h: 260 }, { x: 0, y: 7700, r: 2600, h: 240 }, { x: -2000, y: -7700, r: 2600, h: 260 },
];

// ---- the snow: how much of the ground lies under it, thinning toward the south edge (the pine
// forest by the river is green; the world map's picture reaches 6676 out) ----
const snowCover = (x: number) => 1 - 0.82 * ss(-2600, -6400, x);
// Patches where the snow still lies on the grass: blobs on a jittered grid, each there with the
// chance snowCover gives and the bigger the likelier (their own seed).
function snowPatches(box: { x0: number; x1: number; y0: number; y1: number }, seed: number, step = 420): XY[][] {
  const rnd = seeded(seed), out: XY[][] = [];
  for (let x = box.x0; x < box.x1; x += step)
    for (let y = box.y0; y < box.y1; y += step) {
      const cx = x + rnd() * step, cy = y + rnd() * step, k = snowCover(cx), r = step * (0.35 + 0.5 * k) * (0.8 + rnd() * 0.4);
      if (k > 0.01 && rnd() < k) out.push(blobPoly([cx, cy], r * (0.8 + rnd() * 0.5), r * (0.7 + rnd() * 0.4), seed + out.length, 0.22, 16));
    }
  return out;
}

// the scattered pieces block only their heart
const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] as SolidSpec[] });

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(503, {
    hills: HILLS,
    plateaus: [
      { poly: dense(P1), h: 400, ramps: [RP1] },
      { poly: dense(P1B), h: 750, ramps: [RP1B] },
      { poly: dense(P2), h: 300, ramps: [RP2] },
      { poly: dense(N1, 700), h: 700 },
      { poly: dense(N2, 900), h: 1300 },
    ],
    rock: "Royalmount_CliffGranite",
    keep: [CASCADE],
  });
  const { put, rnd } = f;

  // ---- the plank bridge where the south track crosses the stream ----
  const nb = nearestOn(STREAM, [-2700, -1200]);
  let bax: XY = [-nb.dir[1], nb.dir[0]];
  if (bax[0] < 0) bax = [-bax[0], -bax[1]]; // (from the south bank to the north)
  const BR = { at: nb.at, off: (k: number): XY => [nb.at[0] + bax[0] * k, nb.at[1] + bax[1] * k] };

  // ---- the ways out ----
  const W_EXIT: XY = [0, 5150], E_EXIT: XY = [0, -5150], S_EXIT: XY = [-5150, -1500];
  const FORK: XY = [-400, -900];
  // the bridle path, from the palace's gate to the frozen falls
  const PATH: XY[] = smooth([[0, 9400], [0, 6676], W_EXIT, [-120, 4300], [260, 3300], [900, 2400], [720, 1300], [120, 380], FORK, [-80, -1900], RP1.bottom, [520, -3300], [260, -4300], E_EXIT, [0, -6676], [0, -9400]]);
  // the track down to the pine forest, over the plank bridge
  const SOUTH: XY[] = [...smooth([FORK, [-1300, -1050], BR.off(900), BR.off(600)]), ...smooth([BR.off(-600), BR.off(-900), [-3800, -1750], [-4500, -1500], S_EXIT, [-6676, -1500], [-9400, -1500]])];
  // up the hunt's rise past the tower, and up again to the horn dais
  const RISE: XY[] = [RP1.bottom, RP1.top, ...smooth([beyond(RP1.bottom, RP1.top, 350), [2450, -2900], [2650, -3700], beyond(RP1B.top, RP1B.bottom, 380)]), RP1B.bottom, RP1B.top, ...smooth([beyond(RP1B.bottom, RP1B.top, 330), [3820, -2850]])];
  // to the lodge's door, and up the knoll to the hunters' camp
  const LODGE: XY = [2150, 2250];
  const YARD: XY[] = smooth([[880, 2350], [1250, 2300], [LODGE[0] - 660, LODGE[1]]]);
  const KNOLL: XY[] = [...smooth([[820, 2700], [300, 2520], beyond(RP2.top, RP2.bottom, 300)]), RP2.bottom, RP2.top, ...smooth([beyond(RP2.bottom, RP2.top, 300), [-2000, 3100], [-2500, 3400]])];
  const TRACKS = [PATH, SOUTH, RISE, YARD, KNOLL];
  const roads = TRACKS.map((t, i) => band(t, i === 0 ? 480 : i === 1 ? 440 : 400));

  // ---- the ground: snow, the green of the pine forest coming in along the south, the water ----
  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const streamBand = bandAlong(STREAM, () => SW);
  const water = [streamBand, MARSH_P, POND_P];
  const ROAD: [number, number, number] = [0.82, 0.76, 0.7];
  const ground = f.ground({ area, roads, plazas: [], water, base: "snow", road: ROAD });
  const patches = snowPatches({ x0: -A, x1: -2200, y0: -A, y1: A }, 5031);
  const grass = f.ground({ area: { x0: -A, x1: -2200, y0: -A, y1: A }, roads, plazas: [], water: [...water, ...patches], base: "grass", road: ROAD });
  grass.mesh.position.y += 3;
  grass.mesh.renderOrder = 1;

  // ---- the water: the stream open and dark, the ponds frozen over ----
  const scenery = [
    grass.mesh,
    sheet(bandAlong(STREAM, () => SW + 160), -70, "Royalmount_CliffDark"),
    sheet(bandAlong(STREAM, () => SW + 110), -14, "Royalmount_ColdWater"),
    sheet(blobPoly(MARSH, 800, 660, 31, 0.1, 26), -11, "Royalmount_LakeIce"),
    sheet(blobPoly(POND, 680, 560, 37, 0.1, 24), -11, "Royalmount_LakeIce"),
  ];
  for (const part of pieces(STREAM.filter(([x, y]) => Math.abs(x) < R + 1500 && Math.abs(y) < R + 1500), [BR.at], 260)) f.blockBand(part, SW + 60, { step: 230 });
  for (const [c, p, r] of [[MARSH, MARSH_P, 560], [POND, POND_P, 440]] as [XY, XY[], number][]) {
    f.blockBand([...p, p[0]], 200, { step: 220 });
    f.blockDisc(c, r);
  }
  put("plains:wood_bridge", BR.at, runAlong(bax[0], bax[1]), { solid: [{ kind: "rail", x: 0, y: -190, w: 940, d: 26, rot: 0 }, { kind: "rail", x: 0, y: 190, w: 940, d: 26, rot: 0 }] });

  f.exit("palace", W_EXIT, [-100, 4450]);
  f.exit("frozen_falls", E_EXIT, [-40, -4450]);
  f.exit("pine_river", S_EXIT, [-4450, -1520]);

  // ---- placing things ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine([x, y], t) < d);
  const wet = (x: number, y: number, d: number) => toLine([x, y], STREAM) < SW / 2 + d || inPoly(MARSH_P, x, y) || inPoly(POND_P, x, y) || Math.hypot(x - MARSH[0], y - MARSH[1]) < 820 + d || Math.hypot(x - POND[0], y - POND[1]) < 700 + d;
  const free = (x: number, y: number, r: number, gap = 0) =>
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    !wet(x, y, r * 0.5) && f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const take = (x: number, y: number, r: number) => taken.push([x, y, r]);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    take(at[0], at[1], r);
  };
  const inBox = (x: number, y: number) => Math.abs(x) < R - 150 && Math.abs(y) < R - 150;
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120, o: (s: number) => Parameters<typeof put>[3] = () => ({}), where = inBox) => {
    for (let i = 0, made = 0; i < n * 12 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!where(x, y) || nearTrack(x, y, rad + 230) || !free(x, y, rad, 40)) continue;
      const s = 0.8 + rnd() * 0.4;
      put(ref, [x, y], rnd() * 360, { s, ...o(s) });
      take(x, y, rad * s);
      made++;
    }
  };
  for (const t of TRACKS) for (let i = 0; i < t.length; i += 2) take(t[i][0], t[i][1], 200);
  take(BR.at[0], BR.at[1], 700);

  // ---- the ways in: the gateway of antlers over the path from the palace, waystones ----
  const archAt = nearestOn(PATH, [-110, 4250]);
  prop("royalmount:antler_arch", archAt.at, runAlong(archAt.dir[0], archAt.dir[1]), 420, { solid: [-1, 1].map((s) => ({ kind: "post", x: 0, y: s * 310, r: 50 })) });
  prop("royalmount:royal_waystone", [-480, 4850], towards(1, 0.2), 80, ring(45, "post"));
  prop("royalmount:royal_waystone", [-460, -4800], towards(0.6, 1), 80, ring(45, "post"));
  prop("royalmount:royal_waystone", [-4700, -1000], towards(1, -0.3), 80, ring(45, "post"));
  prop("snowland:trail_sign", [-1100, -650], towards(1, 0.4), 80, ring(30, "post"));
  prop("snowland:trail_sign", [420, -1900], towards(-1, -0.2), 80, ring(30, "post"));

  // ---- the king's hunting lodge, its yard, the butts, the pond and the cascade behind ----
  prop("royalmount:hunting_lodge", LODGE, 0, 760, { solid: [{ kind: "building", x: 45, y: 0, w: 900, d: 720, rot: 0 }, { kind: "porch", x: -490, y: 0, w: 200, d: 700, rot: 0 }, { kind: "chimney", x: 195, y: 395, w: 140, d: 100, rot: 0 }, { kind: "woodpile", x: 520, y: 0, w: 140, d: 500, rot: 0 }] });
  for (const y of [1700, 2800]) prop("trunrada:hitching_post", [1330, y], 90, 120);
  prop("trunrada:horse", [1180, 1600], 200, 0);
  prop("royalmount:archery_butts", [2650, 3950], 15, 330, { solid: [{ kind: "butt", x: 0, y: 0, w: 200, d: 520, rot: 0 }] });
  prop("snowland:log_pile", [2950, 1300], 70, 260);
  prop("common:crate", [1450, 1450], 20, 60);
  prop("common:crate", [1500, 1380], 60, 60);
  prop("snowland:frozen_falls", [CASCADE[0] - 200, CASCADE[1]], 0, 420, { solid: "none" });
  for (const [g, h, s] of [[[3000, 2200], 40, 1], [[3600, 3400], 160, 0.9], [[2950, 3200], 300, 0.8], [[4000, 2150], 200, 0.8]] as [XY, number, number][]) {
    const n = nearestOn([...POND_P, POND_P[0]], g);
    put("royalmount:ice_shelf", n.at, h, { s, solid: "none" });
  }

  // ---- the stag meadow: hay racks and salt licks, a deadfall at its edge ----
  for (const [at, h] of [[[950, -1650], 20], [[-900, -3250], 110], [[1050, -4250], 70]] as [XY, number][]) prop("royalmount:deer_feeder", at, h, 230, { solid: [{ kind: "rack", x: 0, y: -40, w: 170, d: 260, rot: 0 }] });
  prop("royalmount:deadfall", [-1200, -4300], 30, 380, { solid: [{ kind: "log", x: 0, y: 0, w: 560, d: 140, rot: 78 }] });

  // ---- the hunt's rise: the game-watching tower over the meadow; the horn dais on the step ----
  const TOWER: XY = [1950, -3750];
  prop("royalmount:game_tower", TOWER, towards(-1, 0.2), 300, { solid: [-1, 1].flatMap((sx) => [-1, 1].map((sy) => ({ kind: "post", x: sx * 150, y: sy * 150, r: 24 }))) });
  const HORN: XY = [3880, -2600];
  prop("royalmount:horn_platform", HORN, towards(RP1B.top[0] - HORN[0], RP1B.top[1] - HORN[1]), 330, { solid: [{ kind: "dais", x: 0, y: 0, r: 230 }] });
  prop("snowland:cairn", [2500, -1500], 0, 70, ring(45));
  prop("royalmount:icicle_crag", [4300, -4100], 200, 260, { s: 0.8, ...ring(170) });
  prop("royalmount:silver_boulder", [3500, -1350], 60, 200, { s: 0.8, ...ring(110) });
  // the huntsmen's things up on the rise: a hay rack, a hide of deadfall, the stones they rest on
  if (free(2900, -4500, 220)) prop("royalmount:deer_feeder", [2900, -4500], 40, 230, { solid: [{ kind: "rack", x: 0, y: -40, w: 170, d: 260, rot: 0 }] });
  if (free(3700, -4300, 300)) prop("royalmount:deadfall", [3700, -4300], 150, 380, { s: 0.8, solid: [{ kind: "log", x: 0, y: 0, w: 560, d: 140, rot: 78 }] });
  for (const at of [[2300, -1700], [4200, -2000], [2600, -2400]] as XY[]) if (free(at[0], at[1], 130)) prop("snowland:snow_boulder", at, rnd() * 360, 170, ring(110));
  if (free(3100, -1400, 80)) prop("royalmount:royal_waystone", [3100, -1400], towards(-1, 0), 80, ring(45, "post"));

  // ---- the knoll of old pines and the hunters' camp on it ----
  const CAMP: XY = [-2600, 3600];
  prop("snowland:lean_to", [CAMP[0] - 350, CAMP[1] + 300], towards(1, -0.6), 280);
  prop("trunrada:campfire", CAMP, 0, 150, ring(70));
  prop("snowland:log_pile", [CAMP[0] + 200, CAMP[1] + 650], 20, 260);
  prop("snowland:fallen_log", [CAMP[0] + 450, CAMP[1] - 250], 40, 260);
  prop("royalmount:deer_feeder", [-3300, 2500], 60, 230, { solid: [{ kind: "rack", x: 0, y: -40, w: 170, d: 260, rot: 0 }] });

  // ---- rocks, deadfall, stumps over the forest floor ----
  const ROCKS: [string, XY, number][] = [
    ["royalmount:silver_boulder", [-2200, 1500], 120], ["snowland:snow_boulder", [1800, 600], 130], ["snowland:rock_cluster", [-4200, 4600], 170],
    ["royalmount:icicle_crag", [-600, 1700], 170], ["snowland:snow_boulder", [3300, 4700], 130], ["snowland:rock_cluster", [-1400, -2400], 170],
    ["royalmount:silver_boulder", [1900, -400], 120], ["snowland:snow_boulder", [-3300, -4300], 130], ["snowland:flat_slabs", [400, -2900], 150],
    ["snowland:rock_cluster", [4100, 800], 170], ["snowland:snow_boulder", [-4700, 3300], 130], ["royalmount:silver_boulder", [-200, 3600], 120],
  ];
  for (const [id, at, r] of ROCKS) if (free(at[0], at[1], r)) prop(id, at, rnd() * 360, r + 40, ring(r * 0.8));
  for (const [at, h] of [[[-2000, -500], 120], [[1300, 4700], 60], [[3000, -500], 10], [[-4400, -3000], 170]] as [XY, number][])
    if (free(at[0], at[1], 300)) prop("royalmount:deadfall", at, h, 380, { s: 0.85, solid: [{ kind: "log", x: 0, y: 0, w: 560, d: 140, rot: 78 }] });
  scatter("snowland:snowy_stump", [0, 0], 5200, 10, 80, () => ring(40, "tree"));
  scatter("snowland:fallen_log", [0, 0], 5200, 5, 220, () => ({ solid: [{ kind: "log", x: 0, y: 0, w: 120, d: 520, rot: 0 }] }));

  // ---- the forest: snowy pines, thick round the glades, green pines and birches in the south ----
  const glades: [XY, number][] = [
    [LODGE, 1000], [[2700, 3700], 650], [[600, -2900], 1500], [[-300, -3800], 900], [TOWER, 500], [HORN, 650], [CAMP, 700],
    [W_EXIT, 900], [E_EXIT, 800], [S_EXIT, 900], [[200, 1000], 500], [[-2500, -2600], 500],
  ];
  const inGlade = (x: number, y: number) => glades.some(([c, r]) => Math.hypot(x - c[0], y - c[1]) < r);
  for (let x = -R + 150; x < R; x += 420)
    for (let y = -R + 150; y < R; y += 420) {
      const px = x + (rnd() - 0.5) * 320, py = y + (rnd() - 0.5) * 320;
      const south = 1 - snowCover(px), up = f.h(px, py) > 250;
      if (rnd() < (up ? 0.45 : 0.18) || inGlade(px, py) || nearTrack(px, py, 380) || !free(px, py, 150, 30)) continue;
      const kinds = rnd() < south ? ["Pine", "Pine", "PineSmall", "Birch"] : ["SnowPine", "SnowPine", "SnowPineSmall", "SnowPine", "FrostOak"];
      put(`flora:${kinds[Math.floor(rnd() * kinds.length)]}`, [px, py], rnd() * 360, { s: 0.75 + rnd() * 0.5 });
      take(px, py, 160);
    }

  // ---- ground cover: red-twigged dogwood and juniper, drifts, dry grass, ice along the stream ----
  scatter("royalmount:red_osier", [0, 0], 5300, 26, 90, () => ({ solid: "none" }));
  scatter("royalmount:snow_juniper", [0, 0], 5300, 30, 110, () => ({ solid: "none" }));
  scatter("snowland:snow_drift", [1500, 0], 4000, 10, 200, () => ({ solid: "none" }), (x, y) => inBox(x, y) && snowCover(x) > 0.8);
  scatter("snowland:dry_grass", [0, 0], 5300, 30, 70, () => ({ solid: "none" }));
  scatter("snowland:frost_shrub", [0, 0], 5300, 14, 90, () => ring(45, "bush"));
  scatter("snowland:dead_branches", [0, 0], 5300, 10, 110, () => ({ solid: "none" }));
  scatter("plains:fern_clump", [-4300, 0], 1800, 14, 70, () => ({ solid: "none" }), (x, y) => inBox(x, y) && snowCover(x) < 0.6);
  for (let i = 3; i < STREAM.length - 3; i += 2) {
    const [ax, ay] = STREAM[i], [bx, by] = STREAM[i + 1], L = Math.hypot(bx - ax, by - ay) || 1;
    for (const s of [-1, 1]) {
      if (rnd() < 0.45) continue;
      const o = SW / 2 + 40 + rnd() * 60, x = ax - ((by - ay) / L) * s * o, y = ay + ((bx - ax) / L) * s * o;
      if (!inBox(x, y) || nearTrack(x, y, 300) || Math.hypot(x - BR.at[0], y - BR.at[1]) < 700 || !f.level(x, y, 100)) continue;
      put(rnd() < 0.5 ? "royalmount:ice_shelf" : "northcold:frozen_reeds", [x, y], rnd() * 360, { s: 0.55 + rnd() * 0.3, solid: "none" });
    }
  }
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2, at: XY = [MARSH[0] + Math.cos(a) * 880, MARSH[1] + Math.sin(a) * 720];
    if (!nearTrack(at[0], at[1], 280) && toLine(at, STREAM) > SW / 2 + 60) put(k % 3 ? "northcold:frozen_reeds" : "royalmount:ice_shelf", at, rnd() * 360, { s: 0.6 + rnd() * 0.3, solid: "none" });
  }

  // ---- past the edge: the royal mountains' woods north, the pine forests round the rest ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const onTrack = (x: number, y: number) => [[0, 0], [280, 0], [-280, 0], [0, 280], [0, -280]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  f.woods(area, ["SnowPine", "SnowPine", "SnowPineSmall", "SnowPine", "FrostOak"], (x, y) => inside(x, y) || onTrack(x, y) || wet(x, y, 150) || snowCover(x) < 0.55, { count: 460, spacing: 380, tries: 7000 });
  f.woods(area, ["Pine", "Pine", "PineSmall", "Birch", "SnowPineSmall"], (x, y) => inside(x, y) || onTrack(x, y) || wet(x, y, 150) || snowCover(x) >= 0.55, { count: 260, spacing: 360, tries: 5000 });
  // and a few on the mountain wall inside the box, where nobody walks
  f.woods({ x0: 4300, x1: R, y0: -R, y1: R }, ["SnowPine", "SnowPineSmall"], (x, y) => f.h(x, y) < 650 || onTrack(x, y), { count: 26, spacing: 520, tries: 1200 });

  // ---- monsters: the meadow, the forest's glades, the rise and its step, the knoll ----
  const quiet = (x: number, y: number) => Math.hypot(x - LODGE[0], y - LODGE[1]) < 1000 || Math.hypot(x - CAMP[0], y - CAMP[1]) < 650;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 760, keepOut: quiet, max: 52 });

  const npcs: NpcSpec[] = [
    { id: "royal_hunt_huntsman", x: LODGE[0] - 830, y: LODGE[1] - 260, face: 200, name: "ท่านกุนเธอร์", title: "หัวหน้าพรานหลวง", role: "talk",
      look: { gender: "male", hair: "", hairColor: "auburn", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "ป่านี้เป็นที่ล่าสัตว์ของกษัตริย์มาแต่โบราณ ใครล่ากวางเขาเงินได้ต้องนำเขามาถวายพระราชาก่อน",
        "กวางพวกนั้นพุ่งชนแรงนัก พอใกล้ตายมันจะวิ่งหนีเข้าป่าสน อย่าตามลึกเกินไป ฝูงหมาป่ารออยู่",
        "ตามทางม้าไปทางตะวันออกคือหุบน้ำตกเยือกแข็ง ส่วนทางใต้ข้ามสะพานไม้ลงไปป่าสนริมแม่น้ำ",
      ] },
    { id: "royal_hunt_warden", x: TOWER[0] - 380, y: TOWER[1] + 260, face: 160, name: "เอลีน", title: "ผู้เฝ้าป่าหลวง", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "ink", eyes: "teal", top: "top_adventurer_teal", bottom: "bottom_adventurer_cocoa" },
      lines: [
        "จากบนหอนี้ข้ามองเห็นทั้งทุ่งกวาง ฝูงไหนเข้ามากินหญ้าที่รางข้าเห็นหมด",
        "บนแท่นหินข้างบนนั่น หัวหน้าพรานเป่าแตรเปิดการล่าทุกต้นฤดูหนาว เสียงก้องไปถึงพระราชวัง",
        "ลำธารที่ไหลผ่านป่ามาจากน้ำตกเยือกแข็ง ไหลลงไปเป็นน้ำตกของป่าสนริมแม่น้ำ",
      ] },
  ];

  return f.finishField({
    ground,
    scenery,
    sky: "#a9bccb",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -150, y: 4350 },
    npcs,
    labels: [
      { x: W_EXIT[0] - 250, y: W_EXIT[1] - 200, text: "ทางไปพระราชวังหลวง", kind: "gate" },
      { x: E_EXIT[0] - 250, y: E_EXIT[1] + 200, text: "ทางไปหุบน้ำตกเยือกแข็ง", kind: "gate" },
      { x: S_EXIT[0] + 200, y: S_EXIT[1] + 250, text: "ทางไปป่าสนริมแม่น้ำ", kind: "gate" },
      { x: LODGE[0] - 300, y: LODGE[1] + 600, text: "กระท่อมล่าสัตว์หลวง" },
      { x: archAt.at[0] - 350, y: archAt.at[1], text: "ซุ้มประตูเขากวาง", kind: "small" },
      { x: 300, y: -3000, text: "ทุ่งกวาง" },
      { x: TOWER[0] - 300, y: TOWER[1] + 350, text: "หอดูสัตว์", kind: "small" },
      { x: HORN[0] - 400, y: HORN[1], text: "แท่นเป่าแตรล่าสัตว์" },
      { x: POND[0] - 900, y: POND[1] + 500, text: "บึงน้ำแข็งหลังกระท่อม", kind: "small" },
      { x: MARSH[0] + 700, y: MARSH[1] + 600, text: "บึงน้ำแข็งกลางป่า", kind: "small" },
      { x: BR.at[0] + 350, y: BR.at[1] + 350, text: "สะพานไม้ข้ามลำธาร", kind: "small" },
      { x: CAMP[0] + 400, y: CAMP[1], text: "เนินสนเฒ่า" },
      { x: 2700, y: 3500, text: "ลานซ้อมยิงธนู", kind: "small" },
    ],
  });
}
