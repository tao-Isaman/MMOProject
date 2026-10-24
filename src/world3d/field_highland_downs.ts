// ที่ราบเนินเขา (the highland downs), monsters Lv 86-98: the rolling downs west of Highland Hill,
// under a thin snow with the heather and the winter grass showing through. The way in from
// Highland Hill comes over the east edge and down through broad round hills to a fork in the
// middle: south-west the track runs on past a cold tarn to the way down to the karst peaks; north
// it climbs a ramp onto the long low down that fills the north-west, and up again onto the
// highest down, where the old stone circle stands looking out over everything. Dry-stone walls
// run over the hills, cutting the land into pastures; in the north-east the shepherd's bothy and
// the stone fold of his shaggy highland cattle, the beasts out grazing round it; on a second, lower
// down in the south-east an old burial cairn. Lone pines stand bent by the wind; heather and gorse
// grow in the hollows; cairns mark the tracks. High snowy ridges close the north and the west,
// snowy land running up to them. Towards the south edge the snow thins and the grass under it
// grows greener, birches and broadleaf trees among the pines, down to the karst country.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: east -> highland, south -> karst_peaks

import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits, seeded } from "./town";
import { material } from "./textures";
import { KIT as WEST, CIRCLE_STONES } from "./kits/westhills";
import { KIT as SNOW, smooth, band, blobPoly, inPoly, towards, flatSheet, densify } from "./kits/snowland";
import type { XY } from "./kits/snowland";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { distToPath } from "./kits/frontier";
import type { SolidSpec } from "../world";
import type { NpcSpec } from "../npcs";

useKits(WEST, SNOW, TRUNRADA);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the levels ----
// D1: the long low down over the north-west (280); D2: the highest down on it (560), the stone
// circle on top; D3: the lower down in the south-east (320), the burial cairn. N, W, S1, S2:
// snowy ridges past the edge (scenery), the southern two well back so the thawing ground runs
// on to the edge.
const D1: XY[] = [[A, -1300], [A, A], [-300, A], [-200, 6200], [500, 5200], [300, 4300], [900, 3300], [700, 2200], [1500, 1300], [1900, 200], [3200, -600], [5000, -900], [6500, -1400]];
const D2: XY[] = [[2200, 2000], [3600, 1500], [4800, 2100], [5200, 3400], [4600, 4700], [3200, 5000], [2000, 4300], [1700, 3100]];
const D3: XY[] = [[-1700, -2300], [-2900, -1700], [-4300, -2200], [-4900, -3400], [-4300, -4700], [-2900, -5000], [-1800, -4300], [-1400, -3200]];
const MN: XY[] = [[6400, -A], [A, -A], [A, A], [6700, A], [6300, 5000], [6600, 2500], [6200, 0], [6500, -3000]];
const MW: XY[] = [[-A, 6400], [-3000, 6200], [0, 6600], [3000, 6300], [6000, 6500], [A, 6400], [A, A], [-A, A]];
const S1: XY[] = [[-A, -A], [-7100, -A], [-7400, -3000], [-7000, 0], [-7300, 600], [-A, 600]];
const S2: XY[] = [[-A, 3200], [-7200, 3200], [-7000, 4800], [-7400, A], [-A, A]];

// a ramp off an edge a -> b at t, `len` long, away from the point `inside`
function rampOn(a: XY, b: XY, t: number, len: number, width: number, inside: XY): { top: XY; bottom: XY; width: number } {
  const top: XY = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
  if ((inside[0] - top[0]) * nx + (inside[1] - top[1]) * ny > 0) [nx, ny] = [-nx, -ny];
  return { top, bottom: [top[0] + nx * len, top[1] + ny * len], width };
}
const RAMP1 = rampOn([700, 2200], [1500, 1300], 0.55, 950, 460, [3000, 3000]);
const RAMP2 = rampOn([2200, 2000], [3600, 1500], 0.5, 950, 440, [3450, 3250]);
const RAMP3 = rampOn([-1700, -2300], [-2900, -1700], 0.5, 1000, 440, [-3100, -3300]);

const CIRCLE: XY = [3450, 3250];
const TARN_C: XY = [-2300, 2700];
const TARN = blobPoly(TARN_C, 1150, 900, 41, 0.12);

// a point d along a -> b (negative: back before a)
const along = (a: XY, b: XY, d: number): XY => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [a[0] + ((b[0] - a[0]) / L) * d, a[1] + ((b[1] - a[1]) / L) * d];
};
const rampLen = (r: { top: XY; bottom: XY }) => Math.hypot(r.top[0] - r.bottom[0], r.top[1] - r.bottom[1]);

// the edges in short pieces near the walkable box
const dz = (p: XY[]) => densify(p, (x, y) => Math.abs(x) < R + 1500 && Math.abs(y) < R + 1500);

// ---- the thaw to the south ----
const ss = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// Towards the south edge (the world map's picture of the field reaches 6676 out) the snow opens
// up more and more, and of the grass under it more and more is green rather than winter olive.
const thaw = (x: number) => 0.68 * ss(-2800, -6676, x);
const olive = (x: number) => 0.9 - 0.75 * ss(-3600, -6676, x);
// Patches: blobs on a jittered grid over the south, each there with the chance `p` gives and the
// bigger the likelier, so they run together where it nears 1 (their own seed, so nothing else
// in the field moves).
function patchesOf(p: (x: number) => number, seed: number, step = 400): XY[][] {
  const rnd = seeded(seed), out: XY[][] = [];
  for (let x = -A; x < -2800; x += step)
    for (let y = -A; y < A; y += step) {
      const cx = x + rnd() * step, cy = y + rnd() * step, k = p(cx), r = step * (0.35 + 0.45 * k) * (0.8 + rnd() * 0.4);
      if (rnd() < k) out.push(blobPoly([cx, cy], r * (0.8 + rnd() * 0.5), r * (0.7 + rnd() * 0.4), seed + out.length, 0.22, 16));
    }
  return out;
}
// north of where the green begins (ragged), all winter olive
const OLIVE: XY[] = (() => {
  const pts: XY[] = [];
  for (let y = A + 500; y >= -A - 500; y -= 300) pts.push([-3500 + 180 * Math.sin(y / 650) + 120 * Math.sin(y / 240 + 2), y]);
  return [[A + 500, A + 500], ...pts, [A + 500, -A - 500]];
})();

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(306, {
    hills: [
      { x: -3300, y: -700, r: 1600, h: 230 },
      { x: 1900, y: -1600, r: 1500, h: 220 },
      { x: 3700, y: -3100, r: 1300, h: 160 },
      { x: -1100, y: -4500, r: 1200, h: 170 },
      { x: -4500, y: 4700, r: 1500, h: 220 },
      { x: -300, y: 4300, r: 1100, h: 150 },
      { x: -600, y: 1200, r: 800, h: 100 },
      { x: 300, y: -2600, r: 900, h: 110 },
      { x: -4000, y: -4300, r: 900, h: 120 },
      // past the edge
      { x: -7200, y: -3500, r: 2600, h: 380 },
      { x: -7400, y: 4400, r: 2400, h: 340 },
      { x: 1500, y: -7400, r: 2600, h: 360 },
      { x: -3500, y: -7300, r: 2200, h: 300 },
      { x: 5200, y: -7200, r: 2300, h: 380 },
    ],
    plateaus: [
      { poly: dz(D1), h: 280, ramps: [RAMP1] },
      { poly: dz(D2), h: 560, ramps: [RAMP2] },
      { poly: dz(D3), h: 320, ramps: [RAMP3] },
      { poly: dz(MN), h: 1150 },
      { poly: dz(MW), h: 1000 },
      { poly: dz(S1), h: 900 },
      { poly: dz(S2), h: 850 },
    ],
    rock: "CliffSnow",
  });
  const { put, rnd } = f;

  // ---- tracks ----
  const E_EXIT: XY = [600, -5150], S_EXIT: XY = [-5150, 1800];
  const J: XY = [-300, -500];
  const MAIN_E = smooth([[600, -7600], E_EXIT, [700, -4400], [400, -3500], [-100, -2600], [-350, -1600], J]);
  const MAIN_S = smooth([J, [-900, 100], [-1700, 600], [-2700, 950], [-3600, 1300], [-4400, 1700], S_EXIT, [-7600, 1900]]);
  const r1in = along(RAMP1.bottom, RAMP1.top, -600), r1out = along(RAMP1.bottom, RAMP1.top, rampLen(RAMP1) + 450);
  const r2in = along(RAMP2.bottom, RAMP2.top, -350), r2out = along(RAMP2.bottom, RAMP2.top, rampLen(RAMP2) + 420);
  const circleIn = along(CIRCLE, RAMP2.top, 1080);
  const UP = [...smooth([J, [-150, 200], r1in]), RAMP1.bottom, RAMP1.top, ...smooth([r1out, [1900, 1700], [2200, 900], r2in]), RAMP2.bottom, RAMP2.top, ...smooth([r2out, circleIn])];
  const r3in = along(RAMP3.bottom, RAMP3.top, -550), r3out = along(RAMP3.bottom, RAMP3.top, rampLen(RAMP3) + 500);
  const CAIRN: XY = [-3150, -3350];
  const DOWN = [...smooth([[-330, -1350], [-900, -900], r3in]), RAMP3.bottom, RAMP3.top, ...smooth([r3out, along(CAIRN, r3out, 420)])];
  const BOTHY: XY = [2550, -2750];
  const FOLD: XY = [3550, -4000];
  const SHEP = smooth([[400, -3500], [900, -3050], [1500, -2850], [2000, -2850]]);
  const roads = [band(MAIN_E, 470), band(MAIN_S, 450), band(UP, 420), band(DOWN, 400), band(SHEP, 380)];
  const tracks = [MAIN_E, MAIN_S, UP, DOWN, SHEP];

  // ---- the ground: winter grass, and over it a thin snow with the grass showing through in
  // patches (holes in the snow) ----
  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ROAD: [number, number, number] = [0.7, 0.74, 1.0]; // trodden earth and slush
  // (the grass is tinted toward winter's olive; its tracks are lifted to match the snow's)
  const ground = f.ground({ area, roads, plazas: [], water: [TARN], base: "moss", road: [ROAD[0] / 0.82, ROAD[1] / 0.78, ROAD[2] / 0.64], tint: "#d2c6a4" });
  const patches: XY[][] = [];
  for (let i = 0; i < 110; i++) {
    const c: XY = [-A + 600 + rnd() * (2 * A - 1200), -A + 600 + rnd() * (2 * A - 1200)];
    const r = 180 + rnd() * 480;
    patches.push(blobPoly(c, r * (0.8 + rnd() * 0.5), r * (0.7 + rnd() * 0.4), 60 + i, 0.22, 18));
  }
  // and a ring of grass round the tarn, where the snow has melted back from the water
  patches.push(blobPoly(TARN_C, 1600, 1300, 43, 0.15));
  // towards the south the green grass a hair over the olive (cut away in olive patches thinning
  // out to the south), the snow opening up over both
  const green = f.ground({ area: { x0: -A, y0: -A, x1: -2500, y1: A }, roads, plazas: [], water: [TARN, OLIVE, ...patchesOf(olive, 3061)], base: "grass", road: ROAD });
  green.mesh.position.y += 3;
  green.mesh.renderOrder = 1;
  const snow = f.ground({ area, roads, plazas: [], water: [TARN, ...patches, ...patchesOf(thaw, 3062)], base: "snow", road: ROAD });
  snow.mesh.position.y += 6;
  snow.mesh.renderOrder = 2;
  const grassy = (x: number, y: number) => snow.kind(x, y) === 3 && !inPoly(TARN, x, y);

  // ---- ways out ----
  f.exit("highland", E_EXIT, [640, -4450]);
  f.exit("karst_peaks", S_EXIT, [-4450, 1720]);

  // ---- the tarn: dark still water, ice along its edges ----
  const tarnSheet = f.waterSheet({ x0: TARN_C[0] - 1500, x1: TARN_C[0] + 1500, y0: TARN_C[1] - 1300, y1: TARN_C[1] + 1300 }, -14, "Westhills_TarnWater");
  const iceMat = material("Westhills_TarnIce");
  const floes = [[700, 350, 300, 51], [-500, 520, 240, 52], [-700, -380, 280, 53], [300, -640, 220, 54], [900, -200, 180, 55]].map(([dx, dy, r, s]) => flatSheet(blobPoly([TARN_C[0] + dx, TARN_C[1] + dy], r, r * 0.65, s, 0.12, 16), -11, iceMat));
  f.blockDisc(TARN_C, 700);
  for (const [dx, dy] of [[0, 500], [0, -500], [450, 300], [-450, 300], [450, -300], [-450, -300], [800, 0], [-800, 0]] as XY[]) f.blockDisc([TARN_C[0] + dx, TARN_C[1] + dy], 380);

  // ---- placing things: clear of tracks, water, cliffs and each other ----
  const taken: [number, number, number][] = [];
  const free = (x: number, y: number, r: number, gap = 0) =>
    Math.abs(x) < A - 200 && Math.abs(y) < A - 200 &&
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const take = (x: number, y: number, r: number) => taken.push([x, y, r]);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    take(at[0], at[1], r);
  };
  const disc = (r: number, kind = "rock", x = 0, y = 0): SolidSpec => ({ kind, x, y, r });
  const ring = (r: number, kind = "rock") => ({ solid: [disc(r, kind)] });
  const onTrack = (x: number, y: number, m = 0) => tracks.some((t) => distToPath(t, x, y) < 260 + m);
  // a few of a piece within r of c (nothing solid)
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120, where: (x: number, y: number) => boolean = () => true) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (Math.abs(x) > R + 2500 || Math.abs(y) > R + 2500 || !where(x, y) || !free(x, y, rad, 30)) continue;
      put(ref, [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.4, solid: "none" });
      take(x, y, rad);
      made++;
    }
  };

  // ---- the ways out: a sign and a cairn at each ----
  prop("snowland:trail_sign", [1000, -4950], 180, 80, ring(30, "post"));
  prop("snowland:cairn", [180, -4900], 0, 70, ring(45));
  prop("snowland:trail_sign", [-4900, 1350], 90, 80, ring(30, "post"));
  prop("snowland:cairn", [-4850, 2250], 0, 70, ring(45));
  // cairns along the tracks and where they part
  for (const at of [[-200, -3000], [-700, -1500], [-100, -80], [-2200, 1250], [-3900, 1050], [-280, 650], [2100, 1250], [-700, -1250], [1600, -2600]] as XY[]) if (free(at[0], at[1], 70)) prop("snowland:cairn", at, rnd() * 90, 70, ring(45));

  // ---- the stone circle on the highest down ----
  const ch = towards(RAMP2.top[0] - CIRCLE[0], RAMP2.top[1] - CIRCLE[1]);
  const ca = (ch * Math.PI) / 180, cc = Math.cos(ca), cs = Math.sin(ca);
  put("westhills:stone_circle", CIRCLE, ch, { solid: CIRCLE_STONES.map(([x, y, r]) => disc(r, "stone", x, y)) });
  take(CIRCLE[0], CIRCLE[1], 900);
  // the old guardian's wind-bent pines and cairns round the summit
  for (const [dx, dy] of [[1400, 500], [-300, 1500], [900, -1300], [1500, -600]] as XY[]) {
    const x = CIRCLE[0] + dx * cc - dy * cs, y = CIRCLE[1] + dx * cs + dy * cc;
    if (free(x, y, 120, 60)) prop("snowland:cairn", [x, y], rnd() * 90, 70, ring(45));
  }

  // ---- the burial cairn on the south-east down ----
  prop("trunrada:cairn", CAIRN, 30, 200, ring(125));
  for (const [dx, dy] of [[600, 300], [-500, 500], [200, -650], [-650, -350]] as XY[]) if (free(CAIRN[0] + dx, CAIRN[1] + dy, 80)) prop("trunrada:standing_stone", [CAIRN[0] + dx, CAIRN[1] + dy], rnd() * 360, 90, ring(40, "stone"));
  for (const [dx, dy] of [[1100, 900], [-1000, 1000], [-1200, -800], [900, -1100]] as XY[]) if (free(CAIRN[0] + dx, CAIRN[1] + dy, 80)) prop("snowland:cairn", [CAIRN[0] + dx, CAIRN[1] + dy], rnd() * 90, 70, ring(45));

  // ---- the shepherd's bothy and the cattle fold ----
  prop("westhills:shepherd_bothy", BOTHY, towards(-1, -0.25), 500, { solid: [{ kind: "building", x: 0, y: 0, w: 470, d: 660, rot: 0 }, { kind: "building", x: 0, y: -390, w: 160, d: 130, rot: 0 }] });
  const foldH = towards(-1, 0.6);
  {
    // the fold's walls as solids (the yard inside open, the gap at its front)
    const W: SolidSpec[] = [
      { kind: "wall", x: 430, y: 0, w: 80, d: 760, rot: 0 }, { kind: "wall", x: 0, y: 340, w: 930, d: 80, rot: 0 }, { kind: "wall", x: 0, y: -340, w: 930, d: 80, rot: 0 },
      { kind: "wall", x: -430, y: 235, w: 80, d: 230, rot: 0 }, { kind: "wall", x: -430, y: -235, w: 80, d: 230, rot: 0 },
    ];
    prop("westhills:cattle_pen", FOLD, foldH, 620, { solid: W });
  }
  prop("snowland:log_pile", [BOTHY[0] - 400, BOTHY[1] + 650], 20, 220);
  // the herd: some in the fold, the rest grazing round it
  const fa = (foldH * Math.PI) / 180;
  for (const [dx, dy, h] of [[120, 160, 20], [-60, -150, 200], [250, -60, 120]] as [number, number, number][])
    put("westhills:highland_cow", [FOLD[0] + dx * Math.cos(fa) - dy * Math.sin(fa), FOLD[1] + dx * Math.sin(fa) + dy * Math.cos(fa)], foldH + h, { solid: [{ kind: "animal", x: 0, y: 0, w: 230, d: 90, rot: 0 }] });
  for (const [x, y, h] of [[1900, -3900, 40], [2200, -4700, 200], [3100, -2000, 120], [4300, -2600, 300], [4800, -4600, 60], [1300, -4400, 250], [3900, -5000, 160], [2700, -1500, 10]] as [number, number, number][])
    if (free(x, y, 140, 80)) prop("westhills:highland_cow", [x, y], h, 160, { solid: [{ kind: "animal", x: 0, y: 0, w: 230, d: 90, rot: 0 }] });

  // ---- the tarn's shore: rocks, dry reeds, a fallen pine ----
  for (const [dx, dy, ref, r] of [[1050, 650, "snowland:snow_boulder", 130], [-1150, 300, "snowland:rock_cluster", 190], [-300, -1100, "snowland:flat_slabs", 150], [600, -1000, "snowland:snow_boulder", 130], [-900, 900, "snowland:flat_slabs", 150], [1300, -300, "snowland:rock_cluster", 190]] as [number, number, string, number][]) {
    const x = TARN_C[0] + dx, y = TARN_C[1] + dy;
    if (free(x, y, r)) prop(ref, [x, y], rnd() * 360, r + 40, ring(r));
  }
  scatter("snowland:dry_grass", TARN_C, 1500, 12, 90, (x, y) => !inPoly(TARN, x, y) && Math.hypot(x - TARN_C[0], y - TARN_C[1]) > 800);
  prop("snowland:fallen_log", [TARN_C[0] - 1300, TARN_C[1] - 700], 60, 280, { solid: [{ kind: "log", x: 0, y: 0, w: 120, d: 520, rot: 0 }] });

  // ---- dry-stone walls over the hills, in 3 m pieces, broken where a track crosses (and here
  // and there where they have fallen) ----
  const nearRamp = (x: number, y: number) => [RAMP1, RAMP2, RAMP3].some((r) => distToPath([r.top, r.bottom], x, y) < r.width / 2 + 250);
  const wallRun = (pts: XY[]) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay), dx = (bx - ax) / L, dy = (by - ay) / L;
      const h = (Math.atan2(-dx, dy) * 180) / Math.PI;
      for (let d = 150; d < L - 60; d += 300) {
        const x = ax + dx * d, y = ay + dy * d;
        if (Math.abs(x) > A - 400 || Math.abs(y) > A - 400 || onTrack(x, y, 120) || nearRamp(x, y) || inPoly(TARN, x, y) || rnd() < 0.04) continue;
        if (![[0, 0], [dx * 150, dy * 150], [-dx * 150, -dy * 150]].every(([ex, ey]) => ground.kind(x + ex, y + ey) === 0) || !f.level(x, y, 150)) continue;
        if (taken.some(([tx, ty, tr]) => tr > 90 && Math.hypot(tx - x, ty - y) < tr + 60)) continue;
        put("westhills:drystone_wall", [x, y], h);
        take(x, y, 160);
      }
    }
  };
  wallRun([[1300, -6800], [1400, -5200], [1500, -4400], [1250, -3400], [1600, -2200], [2300, -1500], [3300, -1300], [4500, -1600], [6000, -1700]]);
  wallRun([[-6800, -1300], [-5400, -900], [-4300, -500], [-3200, -900], [-2100, -500], [-1000, -300]]);
  wallRun([[-6900, 5000], [-5600, 4700], [-4400, 4800], [-3000, 4500], [-1800, 4100], [-1100, 3300], [-900, 2100]]);
  wallRun([[-200, 1500], [300, 2600], [100, 3600], [-200, 4800], [-500, 6800]]);
  wallRun([[-6600, -5400], [-5000, -5300], [-3800, -5600]]);
  wallRun([[2600, -5600], [2400, -4600], [3000, -3300], [4300, -3200], [5600, -3600], [6800, -3400]]);
  wallRun([[1700, 5200], [2600, 5500], [4000, 5600], [5400, 5300], [6800, 5600]]);
  wallRun([[5600, 600], [4900, 1200], [5600, 2000]]);

  // ---- lone pines bent by the wind (leaning east, away from the sea) ----
  const lean = -90 + (rnd() - 0.5) * 30;
  for (const [x, y] of [[-1600, -2300], [-4200, 300], [-3500, 3600], [-800, 2900], [2800, -800], [4300, -4300], [1000, -1700], [-2200, -4000], [3800, 600], [1200, 4300], [4400, 5000], [-4600, -1900], [-1700, 4700], [2600, 4300]] as XY[])
    if (free(x, y, 160, 120)) prop("westhills:ragged_pine", [x, y], lean + (rnd() - 0.5) * 40, 220, { s: 0.75 + rnd() * 0.35, solid: [disc(30, "tree")] });

  // ---- rocks and drifts ----
  const ROCKS: [string, XY, number][] = [
    ["snow_boulder", [-4300, -1500], 130], ["rock_cluster", [-1800, -1600], 190], ["flat_slabs", [-4200, 2600], 150], ["snow_boulder", [-2900, 4200], 130],
    ["rock_cluster", [-500, -4200], 190], ["snow_boulder", [-200, 3500], 130], ["flat_slabs", [1300, 300], 150], ["rock_cluster", [4100, -1100], 190],
    ["snow_boulder", [2000, -3600], 130], ["flat_slabs", [4900, -2700], 150], ["snow_boulder", [-5000, -4600], 130], ["rock_cluster", [-3800, -2700], 190],
    ["snow_boulder", [3900, 4400], 130], ["flat_slabs", [1600, 3600], 150], ["snow_boulder", [5000, 600], 130], ["rock_cluster", [-4000, 5000], 190],
  ];
  for (const [id, at, r] of ROCKS) if (free(at[0], at[1], r)) prop(`snowland:${id}`, at, rnd() * 360, r + 40, ring(r));
  // fallen stones at the foot of the downs' faces
  for (const poly of [D1, D2, D3]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (inPoly(poly, mx + nx * 50, my + ny * 50)) [nx, ny] = [-nx, -ny];
      for (let t = 400; t < L - 400; t += 800) {
        const out = 270 + rnd() * 150, x = a[0] + ((b[0] - a[0]) * t) / L + nx * out, y = a[1] + ((b[1] - a[1]) * t) / L + ny * out;
        if (rnd() < 0.5 || Math.abs(x) > R - 150 || Math.abs(y) > R - 150 || !free(x, y, 110, 60)) continue;
        const s = 0.55 + rnd() * 0.3;
        prop(rnd() < 0.6 ? "snowland:snow_boulder" : "snowland:flat_slabs", [x, y], rnd() * 360, 140 * s, { s, solid: [disc(110)] });
      }
    }
  }

  // ---- heather and gorse in the grass patches, snow drifts and dry grass on the snow ----
  for (let i = 0; i < 900; i++) {
    const x = -R - 1500 + rnd() * (2 * R + 3000), y = -R - 1500 + rnd() * (2 * R + 3000);
    const g = grassy(x, y);
    if (!g && rnd() < 0.7) continue;
    const k = rnd();
    const ref = g ? (k < 0.6 ? "westhills:heather" : k < 0.85 ? "westhills:gorse" : "snowland:dry_grass") : k < 0.5 ? "snowland:dry_grass" : k < 0.8 ? "snowland:snow_drift" : "snowland:frost_shrub";
    const rad = ref.endsWith("gorse") ? 110 : ref.endsWith("drift") ? 230 : 90;
    if (onTrack(x, y, 60) || !free(x, y, rad, 30)) continue;
    put(ref, [x, y], rnd() * 360, { s: 0.75 + rnd() * 0.5, solid: ref.endsWith("gorse") ? [disc(55, "bush")] : "none" });
    take(x, y, rad);
  }

  // ---- past the edge: snowy pines and birches on the ridges and hills, lone pines nearer ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const nearTrack = (x: number, y: number) => onTrack(x, y, 200);
  f.woods(area, ["SnowPine", "SnowPine", "SnowPineSmall", "Birch", "FrostOak"], (x, y) => inside(x, y) || nearTrack(x, y) || x < -5000, { count: 240, spacing: 480, tries: 6000 });
  f.woods(area, ["Pine", "Pine", "Birch", "RoundTree", "SnowPineSmall"], (x, y) => inside(x, y) || nearTrack(x, y) || x >= -5000, { count: 60, spacing: 480, tries: 3000 });
  f.woods({ x0: -R - 2200, x1: R + 2200, y0: -R - 2200, y1: R + 2200 }, ["ragged_pine", "heather", "gorse"], (x, y) => inside(x, y) || nearTrack(x, y), { count: 90, spacing: 500, kit: "westhills" });

  // ---- monsters ----
  const quiet = (x: number, y: number) => Math.hypot(x - BOTHY[0], y - BOTHY[1]) < 1000 || Math.hypot(x - FOLD[0], y - FOLD[1]) < 800 || Math.hypot(x - CIRCLE[0], y - CIRCLE[1]) < 1500;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 860, keepOut: quiet });

  // ---- people ----
  const npcs: NpcSpec[] = [
    { id: "downs_shepherd", x: BOTHY[0] - 420, y: BOTHY[1] - 150, face: 200, name: "ลุงดันแคน", title: "คนเลี้ยงวัวแห่งเนินเขา", role: "talk",
      look: { gender: "male", hair: "", hairColor: "auburn", eyes: "teal", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "วัวขนยาวพวกนี้ทนหิมะได้ดีกว่าคนเสียอีก ขนหนาขนาดนี้ลมหนาวแค่ไหนก็ไม่สะเทือน",
        "กำแพงหินที่เห็นทั่วเนิน ปู่ของปู่ข้าก่อไว้ทีละก้อน ไม่มีปูนสักนิด ก็ยังยืนอยู่จนทุกวันนี้",
        "อย่าเข้าใกล้วงหินบนเนินสูงตอนหมอกลง ว่ากันว่าบรรพบุรุษยังเฝ้าอยู่ที่นั่น",
      ] },
    { id: "downs_keeper", x: CIRCLE[0] - 1050 * cc - 250 * cs, y: CIRCLE[1] - 1050 * cs + 250 * cc, face: ch + 90, name: "ยายมอยรา", title: "ผู้เฝ้าวงหินโบราณ", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "silver", eyes: "violet", top: "top_priestess_forest", bottom: "bottom_priestess_forest" },
      lines: [
        "วงหินนี้ตั้งมาก่อนจะมีเมืองไฮแลนด์ ฮิล เสียอีก บรรพบุรุษของพวกเรามาชุมนุมกันที่นี่ทุกกลางฤดูหนาว",
        "แท่นหินกลางวงคือที่วางของเซ่น จะผ่านไปก็ทิ้งหินก้อนเล็กไว้สักก้อนเถอะ",
        "ทางใต้ลงไปคือภูผาหินปูน ทางนั้นหมอกจัด เดินตามกองหินไว้จะไม่หลง",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [green.mesh, snow.mesh, tarnSheet, ...floes],
    sky: "#c5d0d8",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => grassy(x, y) && ground.kind(x, y) === 0 && !inPoly(TARN, x, y), density: 0.05 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 560, y: -4300 },
    npcs,
    labels: [
      { x: E_EXIT[0], y: E_EXIT[1] + 150, text: "ทางไปไฮแลนด์ ฮิล", kind: "gate" },
      { x: S_EXIT[0] + 150, y: S_EXIT[1], text: "ทางไปภูผาหินปูน", kind: "gate" },
      { x: circleIn[0] - 200 * cc, y: circleIn[1] - 200 * cs, text: "วงหินบนเนิน" },
      { x: TARN_C[0] - 1300, y: TARN_C[1] - 900, text: "ทะเลสาบน้ำเย็น" },
      { x: BOTHY[0] - 650, y: BOTHY[1], text: "กระท่อมคนเลี้ยงวัว", kind: "small" },
      { x: FOLD[0] - 700, y: FOLD[1] + 300, text: "คอกวัวขนยาว", kind: "small" },
      { x: CAIRN[0] + 700, y: CAIRN[1] + 200, text: "เนินกองหินโบราณ" },
      { x: 1700, y: 2600, text: "ที่ราบเนินสูง" },
      { x: -2600, y: -1200, text: "ทุ่งเนินลอนคลื่น", kind: "small" },
    ],
  });
}
