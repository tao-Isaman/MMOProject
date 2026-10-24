// เชิงเขาหิมะ (the snowy foothills): where the royal road climbs out of the green country into the
// mountains of the north. The south is still grass (pines, birches, a pond, snow lying in patches
// where the snow begins); north of a ragged snow line the ground is white and rises in terraces:
// a first pine terrace across the whole field (the hunters' woods to the north-east), a second
// higher one where the trail runs on through a gap in the mountains to the ice pass, and on a
// knoll above it the ruin of an old border watchtower looking out over everything. A rocky
// outcrop in the south-east carries a mountain shrine; woodcutters work the edge of the pines.
// Past the woodcutters' camp a track runs west along the snow line, under the first terrace, out
// to the tangled hills on the way to Highland Hill. The way in from the royal road is at the
// south-east corner (the two maps meet only there, the royal castle standing between): the track
// comes up from it under the outcrop's south face and turns in across the grass. Off it, below
// the outcrop, a track turns south-west over the grass and out of the middle of the south side to
// the royal flower fields.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: south-east corner -> royal_road, north -> ice_pass, west -> tangled_hills,
//   south -> flower_fields (e 0.48, the flower fields' north way out)

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits } from "./town";
import { material } from "./textures";
import { KIT as SNOW, densify, smooth, band, blobPoly, inPoly, towards, flatSheet } from "./kits/snowland";
import type { XY } from "./kits/snowland";
import { KIT as ICEBERG } from "./kits/iceberg";
import type { NpcSpec } from "../npcs";

useKits(SNOW, ICEBERG);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the levels ----
// T1: the first terrace (260) across the north; T2: the second (540) in the north-west, the trail
// to the pass on it; T3: the watchtower knoll (820) on T2; E1: the shrine outcrop (320) in the
// south-east. M1..M4: mountains past the edge (scenery).
const T1: XY[] = [[A, -A], [A, A], [1500, A], [1400, 5600], [900, 4200], [1300, 2600], [600, 1400], [700, 200], [200, -900], [500, -2600], [-200, -3800], [300, -5200], [100, -A]];
const T2: XY[] = [[A, -1800], [A, A], [3000, A], [2400, 4800], [2700, 3000], [2400, 1600], [2700, 200], [2300, -800], [3200, -1800]];
const T3: XY[] = [[4000, 3000], [5000, 2800], [5300, 4300], [4600, 5100], [3700, 4500]];
const E1: XY[] = [[-4300, -2300], [-3200, -1900], [-1900, -2500], [-1500, -3800], [-2200, -5000], [-3600, -5200], [-4500, -4000]];
const M1: XY[] = [[6000, 2400], [7300, 2200], [A, 2700], [A, A], [6200, A], [5900, 6000], [6400, 4200]];
const M2: XY[] = [[5900, 700], [7200, 900], [A, 500], [A, -A], [6300, -A], [5800, -6000], [6200, -3000], [5800, -1000]];
const M3: XY[] = [[-2500, 6600], [0, 6300], [2500, 6900], [5000, 6400], [6200, 6600], [6200, A], [-2500, A]];
const M4: XY[] = [[-2000, -6400], [500, -6100], [3000, -6600], [5800, -6300], [5800, -A], [-2000, -A]];

// ramps: top on the edge, bottom out below
const R1 = { top: [450, -350] as XY, bottom: [-369, 19] as XY, width: 460 };
const R2 = { top: [2550, 900] as XY, bottom: [1621, 701] as XY, width: 460 };
const R3 = { top: [4500, 2900] as XY, bottom: [4314, 1969] as XY, width: 420 };
const RE = { top: [-3750, -2100] as XY, bottom: [-4092, -1160] as XY, width: 440 };

// the pond in the grass
const POND_C: XY = [-4100, 3900];
const POND = blobPoly(POND_C, 700, 900, 21, 0.1);

// the snow line: everything north of it is snow (the grass ground is cut away there)
const SNOW_LINE: XY[] = (() => {
  const pts: XY[] = [];
  for (let y = -A; y <= A; y += 500) pts.push([-1500 + 350 * Math.sin(y / 1300) + 220 * Math.sin(y / 570 + 1) + (y > 2500 ? -350 : 0), y]);
  return [...pts, [0, A], [0, -A]];
})();
const snowy = (x: number, y: number) => inPoly(SNOW_LINE, x, y) || inPoly(E1, x, y) || x > -200;

// a track through points, smoothed; ramps are kept straight between them
const along = (a: XY, b: XY, d: number): XY => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [a[0] + ((b[0] - a[0]) / L) * d, a[1] + ((b[1] - a[1]) / L) * d];
};

// the plateaus' edges in short pieces near the walkable box
const dz = (p: XY[]) => densify(p, (x, y) => Math.abs(x) < R + 1500 && Math.abs(y) < R + 1500);

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(202, {
    hills: [
      { x: -3000, y: 2200, r: 1500, h: 140 },
      { x: -1200, y: -1500, r: 1300, h: 110 },
      { x: -2300, y: 700, r: 1100, h: -70 },
      { x: -600, y: 4300, r: 1300, h: 130 },
      { x: -400, y: -4300, r: 1200, h: 100 },
      { x: -5000, y: -500, r: 1200, h: 90 },
      { x: -7000, y: 3000, r: 2500, h: 300 },
      { x: -7200, y: -3500, r: 2200, h: 260 },
    ],
    plateaus: [
      { poly: dz(T1), h: 260, ramps: [R1] },
      { poly: dz(T2), h: 540, ramps: [R2] },
      { poly: dz(T3), h: 820, ramps: [R3] },
      { poly: dz(E1), h: 320, ramps: [RE] },
      { poly: dz(M1), h: 1300 },
      { poly: dz(M2), h: 1250 },
      { poly: dz(M3), h: 950 },
      { poly: dz(M4), h: 800 },
    ],
    rock: "CliffSnow",
  });
  const { put, rnd } = f;

  // ---- tracks ----
  // the way to the royal road at the south-east corner, the track running on past it towards the
  // road's own corner
  const S_EXIT: XY = [-5200, -5200], N_EXIT: XY = [5150, 1450];
  const r1in = along(R1.bottom, R1.top, -650), r1out = along(R1.bottom, R1.top, Math.hypot(R1.top[0] - R1.bottom[0], R1.top[1] - R1.bottom[1]) + 450);
  const r2in = along(R2.bottom, R2.top, -600), r2out = along(R2.bottom, R2.top, Math.hypot(R2.top[0] - R2.bottom[0], R2.top[1] - R2.bottom[1]) + 450);
  const MAIN: XY[] = [
    ...smooth([[-7600, -7600], S_EXIT, [-4950, -4300], [-5000, -3100], [-4900, -1900], [-4650, -900], [-4100, -150], [-3200, 250], [-2300, 450], [-1500, 150], r1in]),
    R1.bottom, R1.top,
    ...smooth([r1out, [1000, 0], r2in]),
    R2.bottom, R2.top,
    ...smooth([r2out, [3600, 1150], [4400, 1500], N_EXIT, [7600, 1550]]),
  ];
  const reIn = along(RE.bottom, RE.top, -500), reOut = along(RE.bottom, RE.top, 1450);
  const SHRINE_WAY: XY[] = [...smooth([[-4150, -200], reIn]), RE.bottom, RE.top, ...smooth([reOut, [-3300, -2950], [-3150, -3250]])];
  const CAMP_WAY: XY[] = smooth([[-1500, 150], [-1300, 900], [-900, 1700], [-450, 2350], [-200, 2700]]);
  // west from the camp's track, past the fallen pine and over the hill, to the tangled hills
  const W_EXIT: XY = [-1200, 5150];
  const WEST_WAY: XY[] = smooth([[-900, 1700], [-1400, 2500], [-1750, 3300], [-1800, 3900], [-1500, 4600], W_EXIT, [-1150, 7600]]);
  const HUNT_WAY: XY[] = smooth([r1out, [1300, -1400], [1900, -2500], [2250, -3250]]);
  // ---- (v0.4) the way south to the royal flower fields: off the road below the outcrop, south-west
  // over the grass and out of the middle of the south side ----
  const S2_EXIT: XY = [-5150, 200];
  const FLOWER_WAY: XY[] = smooth([[-4400, -520], [-4750, -150], S2_EXIT, [-5900, 260], [-7600, 320]]);
  const r3in = along(R3.bottom, R3.top, -450);
  const KNOLL_WAY: XY[] = [...smooth([[4000, 1350], r3in]), R3.bottom, R3.top, ...smooth([along(R3.bottom, R3.top, 1250), [4500, 3600], [4400, 3750]])];
  const roads = [band(MAIN, 470), band(SHRINE_WAY, 400), band(CAMP_WAY, 380), band(HUNT_WAY, 380), band(KNOLL_WAY, 400), band(WEST_WAY, 400), band(FLOWER_WAY, 420)];

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ROAD: [number, number, number] = [0.7, 0.76, 1.05]; // trodden earth and slush
  const ground = f.ground({ area, roads, plazas: [], water: [POND], base: "snow", road: ROAD });
  // the grass of the lower slopes: a second ground a hair above the snow over the south, cut away
  // north of the snow line (and on the outcrop's top), so the snow shows through there
  const grass = f.ground({ area: { x0: -A, y0: -A, x1: -100, y1: A }, roads, plazas: [], water: [SNOW_LINE, E1, POND], base: "grass", road: ROAD });
  grass.mesh.position.y += 3;
  grass.mesh.renderOrder = 1;

  // ---- ways out ----
  f.exit("royal_road", S_EXIT, [-4990, -4430]);
  f.exit("ice_pass", N_EXIT, [4450, 1480]);
  f.exit("tangled_hills", W_EXIT, [-1580, 4450]);
  f.exit("flower_fields", S2_EXIT, [-4620, -270]);

  // ---- the pond: water, ice at its edges, rocks and reeds round it ----
  const pondSheet = f.waterSheet({ x0: POND_C[0] - 1100, x1: POND_C[0] + 1100, y0: POND_C[1] - 1300, y1: POND_C[1] + 1300 }, -14, "Snowland_PondWater");
  const iceMat = material("Snowland_Ice");
  const floes: THREE.Object3D[] = [];
  for (const [dx, dy, r, s] of [[480, 300, 260, 31], [-300, 620, 220, 32], [-540, -260, 200, 33], [250, -700, 180, 34]] as [number, number, number, number][])
    floes.push(flatSheet(blobPoly([POND_C[0] + dx, POND_C[1] + dy], r, r * 0.7, s, 0.2, 14), -11, iceMat));
  f.blockDisc(POND_C, 560);
  f.blockDisc([POND_C[0], POND_C[1] - 420], 420);
  f.blockDisc([POND_C[0], POND_C[1] + 420], 420);

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
  // a solid ring for round things
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] });
  const treeKind = (x: number, y: number): string => {
    const k = rnd();
    if (snowy(x, y)) return k < 0.55 ? "SnowPine" : k < 0.82 ? "SnowPineSmall" : k < 0.93 ? "FrostOak" : "Birch";
    return k < 0.45 ? "Pine" : k < 0.7 ? "PineSmall" : k < 0.92 ? "Birch" : "SnowPineSmall";
  };
  // a grove of n trees within r of c
  const grove = (c: XY, r: number, n: number, kinds?: string[]) => {
    for (let i = 0, made = 0; i < n * 8 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (Math.abs(x) > R - 150 || Math.abs(y) > R - 150 || !free(x, y, 170, 180)) continue;
      const kind = kinds ? kinds[Math.floor(rnd() * kinds.length)] : treeKind(x, y);
      put(`flora:${kind}`, [x, y], rnd() * 360, { s: 0.75 + rnd() * 0.4 });
      take(x, y, 170);
      made++;
    }
  };
  // a few of a ground cover piece within r of c (they block nothing)
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120) => {
    for (let i = 0, made = 0; i < n * 8 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (Math.abs(x) > R + 2500 || Math.abs(y) > R + 2500 || !free(x, y, rad, 40)) continue;
      put(ref, [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.4 });
      take(x, y, rad);
      made++;
    }
  };

  // ---- the ways out: signs and cairns ----
  prop("snowland:trail_sign", [-4750, -4950], 90, 80, ring(30, "post"));
  prop("snowland:cairn", [-5400, -4500], 0, 70, ring(45));
  prop("snowland:trail_sign", [4850, 1080], -90, 80, ring(30, "post"));
  prop("snowland:cairn", [4900, 1850], 0, 70, ring(45));
  for (const at of [[-3400, -380], [-1900, 820], [1450, 300], [3200, 1500]] as XY[]) prop("snowland:cairn", at, rnd() * 90, 70, ring(45));
  prop("snowland:trail_sign", [W_EXIT[0] - 420, W_EXIT[1] - 200], 0, 80, ring(30, "post"));
  prop("snowland:cairn", [W_EXIT[0] + 400, W_EXIT[1] - 180], 0, 70, ring(45));
  prop("snowland:cairn", [-1350, 2950], 0, 70, ring(45));
  // (v0.4) the way to the flower fields: a sign and a cairn where it leaves
  prop("snowland:trail_sign", [-4800, 650], 0, 80, ring(30, "post"));
  prop("snowland:cairn", [-5250, -400], 0, 70, ring(45));

  // ---- the shrine on the outcrop ----
  const SHRINE: XY = [-2850, -3750];
  prop("snowland:mountain_shrine", SHRINE, towards(-1, 1.6), 520, { solid: [{ kind: "shrine", x: 30, y: 0, w: 420, d: 360, rot: 0 }, { kind: "shrine", x: -10, y: 0, w: 500, d: 440, rot: 0 }] });
  for (const at of [[-3500, -3050], [-2200, -3000], [-3600, -4300]] as XY[]) prop("snowland:cairn", at, rnd() * 90, 70, ring(45));
  prop("snowland:flat_slabs", [-2100, -4500], 30, 220, ring(150));
  prop("snowland:snow_boulder", [-3900, -4500], 0, 170, ring(130));
  grove([-2000, -4300], 400, 3, ["SnowPine", "SnowPineSmall"]);
  scatter("snowland:frost_shrub", [-2900, -3300], 1200, 4, 90);

  // ---- the watchtower ruin on the knoll ----
  const RUIN: XY = [4600, 3950];
  prop("snowland:watch_ruin", RUIN, 200, 560, { solid: [{ kind: "tower", x: 0, y: 0, r: 340 }] });
  prop("snowland:snow_boulder", [5000, 3200], 60, 170, ring(130));
  grove([4100, 4600], 300, 2, ["SnowPineSmall"]);

  // ---- the woodcutters' camp at the edge of the pines ----
  const CABIN: XY = [-150, 3350];
  prop("iceberg:log_cabin", CABIN, towards(-1, -0.3), 330);
  prop("snowland:log_pile", [-700, 3050], 100, 230);
  prop("snowland:log_pile", [300, 2500], 160, 230);
  prop("iceberg:woodpile", [400, 3500], -90, 180);
  prop("iceberg:sled", [-1000, 2300], 40, 130);
  prop("iceberg:brazier", [-380, 2900], 0, 60, ring(40, "post"));
  prop("snowland:fallen_log", [-1100, 3600], 70, 280, { solid: [{ kind: "log", x: 0, y: 0, w: 120, d: 520, rot: 0 }] });
  for (const at of [[-1000, 2700], [-850, 3900], [-300, 4200], [450, 2100], [0, 1900], [-1200, 3200], [550, 3000], [-500, 4500]] as XY[]) if (free(at[0], at[1], 70)) prop("snowland:snowy_stump", at, rnd() * 360, 80, ring(45, "stump"));

  // ---- the hunter's lean-to in the north-east woods ----
  const LEAN: XY = [2500, -3800];
  prop("snowland:lean_to", LEAN, towards(-1, 0.6), 330, { solid: [{ kind: "camp", x: 80, y: 0, w: 360, d: 400, rot: 0 }, { kind: "camp", x: -105, y: -255, w: 160, d: 20, rot: 0 }] });
  prop("snowland:snowy_stump", [2100, -4300], 0, 80, ring(45, "stump"));
  prop("snowland:fallen_log", [3300, -3300], 20, 280, { solid: [{ kind: "log", x: 0, y: 0, w: 120, d: 520, rot: 0 }] });

  // ---- rocks and drifts over the whole field ----
  const ROCKS: [string, XY, number][] = [
    ["snow_boulder", [-4300, 1500], 130], ["rock_cluster", [-2600, -1100], 190], ["flat_slabs", [-4700, -2600], 150], ["snow_boulder", [-1800, 3400], 130],
    ["rock_cluster", [-3200, 4900], 190], ["snow_boulder", [-200, -2300], 130], ["flat_slabs", [-900, -4800], 150], ["rock_cluster", [1100, 1700], 190],
    ["snow_boulder", [1700, -1000], 130], ["rock_cluster", [3900, -2600], 190], ["snow_boulder", [4800, -4400], 130], ["flat_slabs", [3100, -4900], 150],
    ["snow_boulder", [3300, 300], 130], ["rock_cluster", [4900, -600], 190], ["flat_slabs", [3600, 2400], 150], ["snow_boulder", [2000, 4600], 130],
    ["rock_cluster", [1800, 2700], 190], ["snow_boulder", [-5000, 4800], 130], ["snow_boulder", [-3700, 2800], 130], ["flat_slabs", [700, 4900], 150],
  ];
  for (const [id, at, r] of ROCKS) if (free(at[0], at[1], r)) prop(`snowland:${id}`, at, rnd() * 360, r + 40, ring(r));

  // ---- trees: pines and birches on the grass, snowy pines on the terraces ----
  for (const [c, r, n] of [
    [[-4900, 2400], 800, 6], [[-2500, 4500], 900, 7], [[-5000, -1700], 600, 4], [[-1900, 2500], 600, 4], [[-4800, -4900], 700, 5], [[-3600, 1100], 500, 3],
    [[-1300, -2900], 700, 5], [[-700, 4900], 700, 6], [[-500, -4800], 800, 6], [[600, -3500], 500, 3], [[-800, 1200], 400, 2],
    [[3300, -4300], 1100, 10], [[1500, -4700], 700, 5], [[4600, -2900], 900, 7], [[1900, 3600], 600, 5], [[1900, 5000], 500, 4], [[2200, -2000], 600, 4],
    [[3600, -1000], 700, 5], [[5000, -1000], 600, 4], [[3000, 5100], 500, 4], [[5100, 5100], 400, 3], [[3300, 3200], 400, 2], [[5000, 300], 400, 2],
    [[4300, -4900], 600, 5], [[1200, -2600], 500, 4], [[3900, 2500], 400, 3], [[2200, 1800], 300, 2], [[-1100, -1000], 400, 3], [[-2600, -400], 300, 2],
    [[1300, 1100], 400, 3], [[4300, -1300], 700, 5], [[-3000, -1700], 600, 4], [[-2200, 3600], 500, 3], [[-5000, 1000], 400, 2], [[2600, -800], 400, 3],
  ] as [XY, number, number][]) grove(c, r, n);

  // pines along the tops of the terraces' edges, a few metres back from the drop
  for (const poly of [T1, T2, E1]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (!inPoly(poly, mx + nx * 50, my + ny * 50)) [nx, ny] = [-nx, -ny];
      for (let t = 300; t < L - 300; t += 520) {
        const back = 330 + rnd() * 260, x = a[0] + ((b[0] - a[0]) * t) / L + nx * back, y = a[1] + ((b[1] - a[1]) * t) / L + ny * back;
        if (rnd() < 0.35 || Math.abs(x) > R - 150 || Math.abs(y) > R - 150 || !free(x, y, 170, 150)) continue;
        put(`flora:${treeKind(x, y)}`, [x, y], rnd() * 360, { s: 0.75 + rnd() * 0.4 });
        take(x, y, 170);
      }
    }
  }

  // fallen rock at the foot of the cliffs
  for (const poly of [T1, T2, T3, E1]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (inPoly(poly, mx + nx * 50, my + ny * 50)) [nx, ny] = [-nx, -ny];
      for (let t = 400; t < L - 400; t += 700) {
        const out = 260 + rnd() * 150, x = a[0] + ((b[0] - a[0]) * t) / L + nx * out, y = a[1] + ((b[1] - a[1]) * t) / L + ny * out;
        if (rnd() < 0.55 || Math.abs(x) > R - 150 || Math.abs(y) > R - 150 || !free(x, y, 110, 60)) continue;
        const s = 0.55 + rnd() * 0.3;
        prop(rnd() < 0.6 ? "snowland:snow_boulder" : "snowland:flat_slabs", [x, y], rnd() * 360, 140 * s, { s, solid: [{ kind: "rock", x: 0, y: 0, r: 110 }] });
      }
    }
  }

  // ---- ground cover: snow patches on the grass by the snow line, dry grass, drifts, shrubs ----
  for (let y = -5200; y <= 5200; y += 900) {
    const sx = -1500 + 350 * Math.sin(y / 1300) + 220 * Math.sin(y / 570 + 1) + (y > 2500 ? -350 : 0);
    scatter("snowland:snow_patch", [sx - 650, y], 450, 1, 260);
    scatter("snowland:dry_grass", [sx + 300, y + 300], 400, 1, 90);
  }
  scatter("snowland:dry_grass", [-3800, 0], 2200, 10, 90);
  scatter("snowland:dry_grass", [POND_C[0], POND_C[1]], 1200, 6, 90);
  scatter("snowland:snow_drift", [2600, -2200], 2800, 7, 230);
  scatter("snowland:snow_drift", [3900, 1200], 1600, 3, 230);
  scatter("snowland:snow_drift", [-600, 0], 1400, 3, 230);
  scatter("snowland:frost_shrub", [2500, -2500], 2600, 6, 90);
  scatter("snowland:frost_shrub", [3800, 2000], 1600, 3, 90);
  scatter("snowland:frost_shrub", [1500, 0], 1400, 3, 90);
  scatter("snowland:snow_drift", [4400, -3500], 1200, 3, 230);
  scatter("snowland:dead_branches", [3500, -3000], 1800, 3, 120);
  scatter("snowland:snow_patch", [-2800, -800], 900, 3, 260);
  scatter("snowland:snow_patch", [-2600, 2600], 900, 3, 260);
  scatter("snowland:dead_branches", [0, -1000], 4000, 6, 120);
  scatter("snowland:ice_crystals", [4700, 2200], 700, 2, 110);

  // ---- outside the walkable box: woods all round, on the ridges too ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const onTrack = (x: number, y: number) => ground.kind(x, y) !== 0 || ground.kind(x + 250, y) !== 0 || ground.kind(x - 250, y) !== 0 || ground.kind(x, y + 250) !== 0 || ground.kind(x, y - 250) !== 0;
  f.woods({ x0: -A, x1: -R, y0: -A, y1: A }, ["Pine", "Pine", "PineSmall", "Birch"], (x, y) => inside(x, y) || onTrack(x, y), { count: 120, spacing: 380 });
  f.woods({ x0: -R, x1: A, y0: -A, y1: A }, ["SnowPine", "SnowPine", "SnowPineSmall", "FrostOak"], (x, y) => inside(x, y) || onTrack(x, y), { count: 330, spacing: 420, tries: 5000 });

  // ---- monsters ----
  const nearCamp = (x: number, y: number) => Math.hypot(x - CABIN[0], y - CABIN[1]) < 1300 || Math.hypot(x - LEAN[0], y - LEAN[1]) < 700 || Math.hypot(x - SHRINE[0], y - SHRINE[1]) < 700;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 880, keepOut: nearCamp });

  // ---- people ----
  const npcs: NpcSpec[] = [
    { id: "foothills_woodcutter", x: -480, y: 2700, face: 200, name: "ลุงบียอร์น", title: "คนตัดไม้แห่งเชิงเขา", role: "talk",
      look: { gender: "male", hair: "", hairColor: "auburn", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "ไม้สนเชิงเขานี่แหละที่ส่งไปสร้างบ้านทั้งไอซ์เบิร์ก ทนหนาวกว่าไม้ไหน ๆ",
        "ขึ้นลานหิมะไปเรื่อย ๆ ทางเหนือจะถึงช่องเขาน้ำแข็ง ระวังสะพานเชือกตรงหุบเหวด้วยนะ",
        "ตกค่ำอย่าเดินออกนอกทาง พวกสัตว์ป่าบนลานชั้นบนดุกว่าข้างล่างเยอะ",
      ] },
    { id: "foothills_hunter", x: 2200, y: -3500, face: 120, name: "ซิกริด", title: "นักล่าแห่งป่าสน", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "silver", eyes: "teal", top: "top_adventurer_teal", bottom: "bottom_adventurer_cocoa" },
      lines: [
        "ป่าสนบนลานชั้นแรกเป็นที่ล่าของฉัน รอยเท้าบนหิมะบอกทุกอย่าง",
        "ซากหอบนเนินนั่นเคยเป็นด่านของอาณาจักร ขึ้นไปแล้วจะเห็นทุ่งทั้งหมดเลย",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [grass.mesh, pondSheet, ...floes],
    sky: "#c3d1de",
    flowers: {
      box: { x: -R, y: -R, w: 2 * R, h: 2 * R },
      open: (x, y) => !snowy(x, y) && grass.kind(x, y) === 0 && ground.kind(x, y) === 0 && x < -1900,
      density: 0.18 * quality.flowers,
    },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -4880, y: -4050 },
    npcs,
    labels: [
      { x: S_EXIT[0] + 250, y: S_EXIT[1] + 250, text: "ทางไปถนนหลวง", kind: "gate" },
      { x: N_EXIT[0] - 150, y: N_EXIT[1], text: "ทางไปช่องเขาน้ำแข็ง", kind: "gate" },
      { x: W_EXIT[0], y: W_EXIT[1] - 150, text: "ทางไปเนินเขาวงกต", kind: "gate" },
      { x: S2_EXIT[0] + 250, y: S2_EXIT[1] - 200, text: "ทางไปทุ่งดอกไม้หลวง", kind: "gate" },
      { x: -3500, y: 1500, text: "ทุ่งหญ้าเชิงเขา" },
      { x: SHRINE[0] + 350, y: SHRINE[1] + 500, text: "ศาลเจ้าภูเขา" },
      { x: RUIN[0] - 500, y: RUIN[1] - 300, text: "ซากหอสังเกตการณ์" },
      { x: -700, y: 2600, text: "ค่ายคนตัดไม้" },
      { x: 2000, y: -3300, text: "เพิงพักนักล่า", kind: "small" },
      { x: POND_C[0] - 1000, y: POND_C[1], text: "บ่อน้ำเชิงเขา", kind: "small" },
      { x: 2900, y: -1600, text: "ป่าสนลานชั้นล่าง" },
      { x: 3800, y: -200, text: "ลานหิมะชั้นบน" },
    ],
  });
}
