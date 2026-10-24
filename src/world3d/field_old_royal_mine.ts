// เหมืองหลวงเก่า (the old royal mine), monsters Lv 62-72: the silver mine behind the palace whose
// silver made the dynasty's crown, given up when its great tunnel fell in. It is cut into the
// mountains at the end of the land: along the whole north they stand fifteen metres over the
// sea and fall sheer into it, and from them the diggings step down south in benches. The way in
// from the ice pass comes through a canyon in the western mountains onto the upper bench, where
// the headframe still stands over the old shaft and rails run along the bench past carts left on
// them, stuck where they stopped. A ramp climbs from there to the top bench against the mountain
// wall, and in the wall the royal adit, its portal of dressed stone carrying the crest, sealed with
// an iron grille behind which the tunnel is full of fallen rock. Down a haul ramp the quarry floor
// spreads south and east under the benches' cliffs: the ruined smelter and the miners' shack,
// spoil heaps, crystals of ore breaking out at the cliffs' feet, rails to the smelter. From the
// floor one track goes south to the palace's back gate and one east toward the royal peaks.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: south -> palace (middle of the edge), east -> royal_peaks (middle of the edge),
//   west -> ice_pass (through the canyon, where the ice pass's own canyon meets the edge, n 0.82)

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits, seeded } from "./town";
import { material } from "./textures";
import { KIT as ROYAL } from "./kits/royalmount";
import { KIT as SNOW, blobPoly } from "./kits/snowland";
import { KIT as NORTHCOLD } from "./kits/northcold";
import { KIT as ICEBERG } from "./kits/iceberg";
import { KIT as WESTMOUNT, smooth, band, inPoly, toLine, dense, towards, runAlong, rampOff, beyond } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(ROYAL, SNOW, NORTHCOLD, ICEBERG, WESTMOUNT);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the sea along the whole north, under the mountains' cliffs ----
const SHORE: XY[] = smooth([[5450, A + 400], [5450, 6676], [5380, 5000], [5500, 3500], [5350, 2000], [5450, 500], [5300, -1000], [5450, -2500], [5350, -4000], [5450, -5500], [5400, -6676], [5400, -A - 400]], 5);
const SEA: XY[] = [...SHORE, [A + 400, -A - 400], [A + 400, A + 400]];

// ---- the levels ----
// the mountains along the coast (1200): their south face the mine's back wall, their north side
// sheer into the sea
const MN: XY[] = [[4200, A], [4100, 4200], [4150, 3300], [4300, 2700], [4250, 1500], [4200, 300], [4300, -900], [4500, -2000], [4300, -3500], [4500, -4800], [4400, -A],
  [5260, -A], [5260, -5500], [5200, -4000], [5300, -2500], [5150, -1000], [5300, 500], [5200, 2000], [5350, 3500], [5230, 5000], [5300, A]];
// the mountains of the west (1200), the canyon from the ice pass between them and the coast's
const MW: XY[] = [[-A, A], [3000, A], [2950, 4800], [3000, 3900], [2200, 3600], [1000, 3800], [-500, 4100], [-2000, 3900], [-3500, 4300], [-5000, 4100], [-A, 4200]];
// the upper bench (350), running in up the canyon to the west edge; the top bench (700) on it
// against the mountain wall
const B1: XY[] = [[3050, A], [4050, A], [4000, 4300], [4300, 3300], [4400, 2400], [4450, 1000], [4450, -500], [4600, -1600], [4700, -2600], [3800, -3200], [3200, -3100], [2100, -2700], [1100, -1800], [500, -500], [400, 900], [900, 2400], [1800, 3700], [2800, 4300]];
const RB1 = rampOff([1100, -1800], [500, -500], [2500, 0], 1100, 480);
const B2: XY[] = [[2700, 2500], [3500, 2900], [4500, 2600], [4500, 1000], [4500, -400], [3700, -1000], [2800, -700], [2400, 300], [2400, 1500]];
const RB2 = rampOff([3700, -1000], [2800, -700], [3400, 1000], 1050, 440);
const ADIT: XY = [4000, 900];

// how much the ground has been worked (bare stone and spoil, 1) round the diggings
const worked = (x: number, y: number) => Math.max(
  1 - Math.hypot((x - 2600) / 2600, (y - 500) / 3600),
  1 - Math.hypot((x + 1800) / 2000, (y - 1400) / 2000),
  1 - Math.hypot((x - 200) / 1500, (y + 2600) / 1600),
);

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(505, {
    hills: [
      { x: -3200, y: -2600, r: 1600, h: 150 }, { x: -3800, y: 2200, r: 1200, h: 120 }, { x: 1800, y: -4400, r: 1100, h: 100 }, { x: -1000, y: -900, r: 800, h: -50 },
      { x: -2000, y: -4200, r: 1200, h: 120 }, { x: -7600, y: 0, r: 2800, h: 260 }, { x: 0, y: -7700, r: 2600, h: 240 },
    ],
    plateaus: [
      { poly: dense(B1), h: 350, ramps: [RB1] },
      { poly: dense(B2), h: 700, ramps: [RB2] },
      { poly: dense(MN, 600), h: 1200 },
      { poly: dense(MW, 700), h: 1200 },
    ],
    rock: "Royalmount_CliffDark",
    keep: [[4220, 700], [4220, 1100]],
  });
  const { put, rnd } = f;

  // ---- the tracks ----
  const W_EXIT: XY = [3550, 5150], S_EXIT: XY = [-5150, 0], E_EXIT: XY = [0, -5150];
  const HUB: XY = [-1300, -1550];
  // from the ice pass down the canyon onto the upper bench, across it and down the haul ramp
  const WEST: XY[] = [...smooth([[3550, 9400], [3550, 6676], W_EXIT, [3550, 4300], [3300, 3300], [2400, 2500], [1850, 1400], [1650, 200], beyond(RB1.bottom, RB1.top, 380)]), RB1.top, RB1.bottom, ...smooth([beyond(RB1.top, RB1.bottom, 380), HUB])];
  const SOUTH: XY[] = smooth([HUB, [-2700, -900], [-4200, -200], S_EXIT, [-6676, 0], [-9400, 0]]);
  const EAST: XY[] = smooth([HUB, [-1200, -3000], [-450, -4250], E_EXIT, [0, -6676], [0, -9400]]);
  const TOP: XY[] = [...smooth([[1650, -500], [2300, -1500], beyond(RB2.top, RB2.bottom, 380)]), RB2.bottom, RB2.top, ...smooth([beyond(RB2.bottom, RB2.top, 350), [3400, 200], [ADIT[0] - 650, ADIT[1]]])];
  const SMELTER_WAY: XY[] = smooth([[-1500, -1250], [-1800, -200], [-2000, 700]]);
  const TRACKS = [WEST, SOUTH, EAST, TOP, SMELTER_WAY];
  const roads = TRACKS.map((t, i) => band(t, i < 3 ? 470 : 400));

  // ---- the ground: snow, worn to bare stone round the diggings; the sea ----
  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ROAD: [number, number, number] = [0.78, 0.74, 0.72];
  const ground = f.ground({ area, roads, plazas: [], water: [SEA], base: "snow", road: ROAD });
  // (the worked ground: the benches and the floor round the smelter and under the ramp, worn
  // bare, ragged patches of it round their edges)
  const WORKED: XY[][] = [blobPoly([2700, 600], 2100, 3300, 5052, 0.14, 40), blobPoly([-1900, 1500], 1500, 1500, 5053, 0.16, 30), blobPoly([100, -2500], 1100, 1300, 5054, 0.16, 26)];
  const rndP = seeded(5051), bare: XY[][] = [...WORKED], centres: [number, number, number][] = [];
  for (let x = -A; x < A; x += 340)
    for (let y = -A; y < A; y += 340) {
      const cx = x + rndP() * 340, cy = y + rndP() * 340, k = Math.max(0, worked(cx, cy) + 0.35), r = 340 * (0.3 + 0.5 * Math.min(1, k)) * (0.8 + rndP() * 0.4);
      if (k <= 0.05 || rndP() > Math.min(1, k) * 0.8) continue;
      const p = blobPoly([cx, cy], r * (0.8 + rndP() * 0.5), r * (0.7 + rndP() * 0.4), 7000 + bare.length, 0.22, 16);
      if (p.every(([px, py]) => !WORKED.some((w) => inPoly(w, px, py))) && centres.every(([qx, qy, qr]) => Math.hypot(qx - cx, qy - cy) > 1.4 * (qr + r))) {
        bare.push(p);
        centres.push([cx, cy, r]);
      }
    }
  const ar = (p: XY[]) => p.reduce((t, [x, y], i) => t + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0);
  const outer: XY[] = [[-A - 400, -A - 400], [A + 400, -A - 400], [A + 400, A + 400], [-A - 400, A + 400]], notBare: XY[] = [...outer, outer[0]];
  for (const h of bare) {
    const ringP = Math.sign(ar(h)) === Math.sign(ar(outer)) ? [...h].reverse() : h;
    notBare.push(...ringP, ringP[0], outer[0]);
  }
  const stone = f.ground({ area, roads, plazas: [], water: [SEA, notBare], base: "rock", road: ROAD, tint: "#bcc0c8" });
  stone.mesh.position.y += 3;
  stone.mesh.renderOrder = 1;

  // ---- the sea: dark water out past the edge, floes, stacks; the cliffs keep everyone out ----
  const shape = new THREE.Shape();
  [...SHORE.map(([x, y]): XY => [x + 220, y]), [30000, -30000], [30000, 30000]].forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  const seaSheet = new THREE.Mesh(new THREE.ShapeGeometry(shape).applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1)), material("Royalmount_NorthSea"));
  seaSheet.position.y = -14;
  seaSheet.receiveShadow = true;
  f.blockBand(SHORE.filter(([x, y]) => Math.abs(x) < R + 1600 && Math.abs(y) < R + 1600).map(([x, y]): XY => [x + 100, y]), 300, { kind: "sea" });
  for (const [x, y, h, s] of [[6200, 2600, 30, 1.2], [6900, -1800, 160, 1], [6000, -4300, 260, 0.9], [7300, 4800, 90, 1.3], [6400, 600, 200, 0.7]] as number[][]) put("northcold:sea_stack", [x, y], h, { z: -14, s, solid: "none" });
  for (const [x, y, h, s] of [[5900, 1200, 20, 0.9], [6300, -3000, 120, 1], [6800, 3600, 240, 1.1], [5800, -5600, 60, 0.8], [7200, -200, 300, 1]] as number[][]) put("northcold:drift_floes", [x, y], h, { z: -14, s, solid: "none" });
  for (let i = 0; i + 1 < SHORE.length; i += 2) {
    const [x, y] = SHORE[i];
    if (Math.abs(y) > R + 1600 || rnd() < 0.35) continue;
    put("northcold:iced_rocks", [x + 80 + rnd() * 90, y + (rnd() - 0.5) * 120], rnd() * 360, { s: 0.7 + rnd() * 0.5, z: -10, solid: "none" });
  }

  // ---- the ways out ----
  f.exit("ice_pass", W_EXIT, [3500, 4450]);
  f.exit("palace", S_EXIT, [-4450, -60]);
  f.exit("royal_peaks", E_EXIT, [-80, -4450]);

  // ---- placing things ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine([x, y], t) < d);
  const free = (x: number, y: number, r: number, gap = 0) =>
    Math.abs(x) < A - 200 && Math.abs(y) < A - 200 && !inPoly(SEA, x - r, y) &&
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
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
      if (!where(x, y) || nearTrack(x, y, rad + 230) || !free(x, y, rad, 40)) continue;
      const s = 0.8 + rnd() * 0.4;
      put(ref, [x, y], rnd() * 360, { s, ...o(s) });
      take(x, y, rad * s);
      made++;
    }
  };
  // rails along a line: 4 m pieces turned along it, a cart left standing here and there
  const rails = (pts: XY[], carts: number[] = []) => {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = cum[cum.length - 1], n = Math.floor(L / 400);
    for (let k = 0; k < n; k++) {
      const s = (k + 0.5) * (L / n);
      let i = 1;
      while (i < pts.length - 1 && cum[i] < s) i++;
      const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1), a = pts[i - 1], b = pts[i];
      const at: XY = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], h = runAlong(b[0] - a[0], b[1] - a[1]);
      if (carts.includes(k)) prop("royalmount:minecart", at, h, 220, { solid: [{ kind: "cart", x: 0, y: 0, w: 200, d: 140, rot: 0 }] });
      else prop("royalmount:mine_rails", at, h, 200, { solid: "none", sy: L / n / 400 });
    }
  };
  for (const t of TRACKS) for (let i = 0; i < t.length; i += 2) take(t[i][0], t[i][1], 200);

  // ---- the top bench: the sealed royal adit in the mountain wall, a guard's brazier ----
  prop("royalmount:sealed_adit", ADIT, towards(-1, 0), 520, { s: 0.85, solid: [{ kind: "rock", x: 60, y: 0, w: 300, d: 760, rot: 0 }, { kind: "rock", x: 20, y: 300, r: 140 }, { kind: "rock", x: 20, y: -300, r: 140 }] });
  rails([[3450, 1300], [3150, 1750], [2800, 2200]], [1]);
  prop("iceberg:brazier", [ADIT[0] - 650, ADIT[1] - 420], 0, 60, ring(40, "post"));
  prop("iceberg:brazier", [ADIT[0] - 650, ADIT[1] + 420], 0, 60, ring(40, "post"));
  prop("royalmount:ore_crystals", [4000, -400], 200, 260, { s: 0.85, ...ring(170, "crystal") });
  prop("royalmount:ore_crystals", [3600, 2600], 30, 240, { s: 0.75, ...ring(150, "crystal") });
  prop("royalmount:spoil_heap", [2850, 300], 60, 300, { s: 0.75, ...ring(200) });

  // ---- the upper bench: the headframe over the old shaft, rails along the bench, carts ----
  const HEAD: XY = [1100, 1300];
  prop("royalmount:headframe", HEAD, 90, 600, { s: 0.9, solid: [{ kind: "tower", x: -380, y: 0, w: 320, d: 320, rot: 0 }, { kind: "shed", x: 400, y: 0, w: 260, d: 320, rot: 0 }, { kind: "stay", x: 0, y: 0, w: 380, d: 280, rot: 0 }] });
  rails([[1300, 2050], [1700, 2900], [2300, 3400]], [0]);
  prop("snowland:log_pile", [800, 2250], 60, 260);
  prop("northcold:ore_cart", [2700, -3300], 200, 260, { s: 0.8 });
  prop("iceberg:lantern_post", [2150, 1000], 0, 50, ring(25, "post"));
  prop("iceberg:lantern_post", [3050, 3700], 0, 50, ring(25, "post"));
  rails([[2300, -2300], [3300, -2600], [4100, -2300]], [1]);
  prop("royalmount:spoil_heap", [3300, -2050], 20, 320, { s: 0.85, ...ring(220) });
  prop("royalmount:spoil_heap", [1300, -1100], 200, 300, { s: 0.7, ...ring(190) });
  prop("northcold:ore_cart", [1450, 2500], 40, 260, { s: 0.8 });
  prop("royalmount:silver_boulder", [2700, 3500], 10, 200, { s: 0.8, ...ring(110) });
  prop("royalmount:royal_waystone", [3150, 4600], towards(-1, -0.2), 80, ring(45, "post"));

  // ---- the quarry floor: the smelter, the miners' shack, rails to the smelter, spoil, crystals ----
  const SMELTER: XY = [-2300, 1800];
  prop("royalmount:smelter_ruin", SMELTER, towards(1, -0.7), 760, { solid: [{ kind: "furnace", x: 260, y: -60, w: 440, d: 440, rot: 0 }, { kind: "wall", x: -160, y: -420, w: 470, d: 60, rot: 0 }, { kind: "wall", x: -380, y: -60, w: 60, d: 720, rot: 0 }, { kind: "slag", x: 320, y: 340, r: 180 }] });
  prop("northcold:miners_shack", [-500, 2700], towards(1, -1), 380);
  prop("northcold:mine_adit", [-200, 3650], towards(-1, 0.25), 420);
  rails([[-500, -400], [-1100, 300], [-1300, 1000]], [1]);
  for (const [at, h, s] of [[[-3600, 3300], 40, 1], [[100, 1200], 140, 0.8], [[-300, -2700], 300, 0.9], [[1400, -3300], 60, 0.85], [[-3900, -1700], 100, 0.8]] as [XY, number, number][]) if (free(at[0], at[1], 240 * s)) prop("royalmount:spoil_heap", at, h, 320 * s, { s, ...ring(220 * s) });
  for (const [at, h, s] of [[[-1500, 3700], 20, 0.9], [[-3300, 3800], 160, 0.8], [[800, 3500], 300, 0.75], [[1200, -2500], 80, 0.8], [[3700, -3500], 230, 0.85]] as [XY, number, number][]) if (free(at[0], at[1], 200 * s)) prop("royalmount:ore_crystals", at, h, 260 * s, { s, ...ring(170 * s, "crystal") });
  prop("northcold:ore_cart", [-700, -2900], 60, 260, { s: 0.85 });
  prop("iceberg:lantern_post", [-1700, -900], 0, 50, ring(25, "post"));
  prop("iceberg:lantern_post", [-800, -2200], 0, 50, ring(25, "post"));
  for (const [at, h] of [[[-100, 400], 30], [[200, -900], 120], [[-600, 2000], 200]] as [XY, number][]) if (free(at[0], at[1], 200)) prop("royalmount:spoil_heap", at, h, 280, { s: 0.65, ...ring(180) });
  prop("common:crate", [-1000, 2400], 20, 60);
  prop("common:crate", [-930, 2470], 60, 60);
  prop("iceberg:snowy_barrels", [-1100, 2950], 90, 120);

  // ---- the ways out ----
  prop("royalmount:royal_waystone", [-4600, 500], towards(1, -0.3), 80, ring(45, "post"));
  prop("royalmount:royal_waystone", [-480, -4700], towards(0.6, 1), 80, ring(45, "post"));
  prop("snowland:trail_sign", [-800, -1200], towards(1, 0.5), 80, ring(30, "post"));

  // ---- rocks over the floor and the benches, rubble at the cliffs' feet ----
  const ROCKS: [string, XY, number][] = [
    ["royalmount:silver_boulder", [-2400, -2800], 120], ["snowland:rock_cluster", [-3800, 900], 170], ["royalmount:silver_boulder", [600, -3900], 120],
    ["snowland:snow_boulder", [-4300, -3600], 130], ["northcold:iced_rocks", [-1800, -4400], 170], ["royalmount:silver_boulder", [-3200, -600], 120],
    ["snowland:rock_cluster", [2600, -3700], 170], ["northcold:iced_rocks", [3800, 1900], 170], ["snowland:snow_boulder", [1800, 300], 130],
    ["royalmount:icicle_crag", [3700, -4300], 170], ["royalmount:icicle_crag", [-4600, 3600], 170], ["snowland:flat_slabs", [-2700, 600], 150],
  ];
  for (const [id, at, r] of ROCKS) if (free(at[0], at[1], r)) prop(id, at, rnd() * 360, r + 40, ring(r * 0.8));
  scatter("northcold:iced_rocks", [0, 0], 5200, 10, 150, (s) => ring(110 * s));
  scatter("snowland:snowy_stump", [-2500, -2500], 2500, 5, 80, () => ring(40, "tree"));

  // ---- a few pines, wind-bent, on the floor's edges; ground cover ----
  for (let x = -R + 150; x < R; x += 520)
    for (let y = -R + 150; y < R; y += 520) {
      const px = x + (rnd() - 0.5) * 400, py = y + (rnd() - 0.5) * 400;
      if (rnd() < 0.62 + worked(px, py) * 0.6 || nearTrack(px, py, 380) || !free(px, py, 150, 40)) continue;
      put(`flora:${["SnowPine", "SnowPineSmall", "SnowPine", "SnowPineSmall"][Math.floor(rnd() * 4)]}`, [px, py], rnd() * 360, { s: 0.7 + rnd() * 0.4 });
      take(px, py, 160);
    }
  scatter("snowland:snow_drift", [-2000, -1000], 3500, 8, 200, () => ({ solid: "none" }));
  scatter("snowland:dry_grass", [0, 0], 5300, 20, 70, () => ({ solid: "none" }));
  scatter("snowland:dead_branches", [0, 0], 5300, 8, 110, () => ({ solid: "none" }));
  scatter("royalmount:snow_juniper", [-2500, -2500], 3000, 12, 110, () => ({ solid: "none" }));

  // ---- past the edge: snowy pines over the mountains and on round the south ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const onTrack = (x: number, y: number) => [[0, 0], [280, 0], [-280, 0], [0, 280], [0, -280]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  f.woods(area, ["SnowPine", "SnowPine", "SnowPineSmall", "FrostOak"], (x, y) => inside(x, y) || onTrack(x, y) || inPoly(SEA, x - 300, y), { count: 520, spacing: 400, tries: 8000 });
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["SnowPine", "SnowPineSmall"], (x, y) => f.h(x, y) < 1150 || onTrack(x, y) || inPoly(SEA, x - 300, y), { count: 60, spacing: 520, tries: 2500 });
  f.woods(area, ["wind_pine"], (x, y) => f.h(x, y) < 1150 || onTrack(x, y) || inPoly(SEA, x - 300, y), { count: 40, spacing: 900, tries: 2000, kit: "westmount" });

  // ---- monsters: the floor, the upper bench and the top bench ----
  const quiet = (x: number, y: number) => Math.hypot(x - SMELTER[0], y - SMELTER[1]) < 900 || Math.hypot(x - ADIT[0], y - ADIT[1]) < 700;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 720, keepOut: quiet, max: 52 });

  const npcs: NpcSpec[] = [
    { id: "old_royal_mine_miner", x: SMELTER[0] + 300, y: SMELTER[1] - 900, face: 160, name: "ปู่ทอร์บยอร์น", title: "อดีตหัวหน้าคนงานเหมืองหลวง", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_warrior", bottom: "bottom_warrior_cocoa" },
      lines: [
        "เงินที่หลอมเป็นมงกุฎของกษัตริย์องค์แรกขุดขึ้นมาจากเหมืองนี้ ข้าเคยทำงานในอุโมงค์หลวงก่อนมันถล่ม",
        "คืนที่อุโมงค์ถล่ม รถเหมืองทั้งขบวนติดอยู่ข้างใน ตอนนี้พวกมันวิ่งเองได้ มีไฟผีสีเขียวลอยอยู่ในตัว",
        "โกเลมแร่เงินเกิดจากสายแร่ที่ตื่นขึ้นมา ตีมันแรง ๆ ระวังเถอะ มันสะท้อนแรงกลับมาด้วย",
      ] },
    { id: "old_royal_mine_guard", x: ADIT[0] - 850, y: ADIT[1] - 250, face: 180, name: "ทหารหลวงเบอร์โทลด์", title: "ทหารเฝ้าอุโมงค์หลวง", role: "talk",
      look: { gender: "male", hair: "", hairColor: "ink", eyes: "blue", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: [
        "พระราชาสั่งให้ปิดอุโมงค์หลวงด้วยประตูเหล็ก ห้ามผู้ใดเข้าไปจนกว่าจะเคลียร์หินที่ถล่มได้",
        "ทางใต้ลงไปคือประตูหลังของพระราชวัง ทางตะวันตกผ่านหุบผาไปช่องเขาน้ำแข็ง",
        "ทางตะวันออกขึ้นไปสันเขาหลวง ที่นั่นอันตรายกว่าเหมืองนี้มาก มีแต่ยักษ์น้ำแข็งกับนกรอค",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [stone.mesh, seaSheet],
    sky: "#a7b3bf",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -4350, y: -60 },
    npcs,
    labels: [
      { x: W_EXIT[0] - 300, y: W_EXIT[1] - 250, text: "ทางไปช่องเขาน้ำแข็ง", kind: "gate" },
      { x: S_EXIT[0] + 200, y: S_EXIT[1] + 250, text: "ทางไปพระราชวังหลวง", kind: "gate" },
      { x: E_EXIT[0] - 250, y: E_EXIT[1] + 200, text: "ทางไปสันเขาหลวง", kind: "gate" },
      { x: ADIT[0] - 800, y: ADIT[1] + 300, text: "ปากอุโมงค์หลวงที่ถูกปิด" },
      { x: HEAD[0] - 600, y: HEAD[1], text: "หอกว้านเหมือง", kind: "small" },
      { x: SMELTER[0] - 900, y: SMELTER[1], text: "โรงหลอมพัง" },
      { x: 2600, y: -1500, text: "ลานเหมืองขั้นบน" },
      { x: -1500, y: -2600, text: "ลานเหมืองเชิงผา", kind: "small" },
      { x: 3550, y: 4300, text: "หุบผาสู่ช่องเขาน้ำแข็ง", kind: "small" },
      { x: 4000, y: -1800, text: "หน้าผาริมทะเลเหนือ", kind: "small" },
      { x: -500, y: 3200, text: "กระท่อมคนงานเหมือง", kind: "small" },
    ],
  });
}
