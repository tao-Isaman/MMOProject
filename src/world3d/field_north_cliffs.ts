// หน้าผาทะเลเหนือ (the north sea cliffs), monsters Lv 182-192: the end of the land north of
// Highland Hill, where it breaks off in cliffs over the icy northern sea. From the way in on the
// south a moor of grass flattened under the snow runs north between two headlands and down into a
// cove. The west headland climbs in three steps from the moor to its tip, the highest of them
// carrying the ruined lighthouse that once warned ships off this coast; the east headland climbs
// in two to the cliffs where the seabirds nest. Down in the cove, on a beach of shingle under the
// cliffs, lies the wreck of a trader the lighthouse could not save. Out in the sea stand stacks of
// dark stone, ice round their feet. There is no way on from here: the land ends.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   way out: south -> highland

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits } from "./town";
import { defineMaterial, material } from "./textures";
import { KIT as SNOW, densify, smooth, band, blobPoly, inPoly, flatSheet } from "./kits/snowland";
import type { XY } from "./kits/snowland";
import { KIT as NORTHCOLD } from "./kits/northcold";
import type { NpcSpec } from "../npcs";

useKits(SNOW, NORTHCOLD);

defineMaterial("Northcold_NorthSea", { tint: "#1f4459", rough: 0.06, opacity: 0.95 });

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the sea: the cove's beach line, then round both headlands' feet ----
const SEA: XY[] = [
  [2900, -1550], [2900, -1500], [2980, -1100], [2860, -600], [2950, -100], [2850, 400], [2990, 900], [2900, 1500],
  [3200, 1580], [3500, 1520], [3800, 1600], [4100, 1750], [4500, 2050], [4800, 2400], [5050, 3000], [5100, 3800], [4950, 4500], [4850, 5200], [5000, 6000], [5000, A + 400],
  [A + 400, A + 400], [A + 400, -A - 400], [4800, -A - 400], [4700, -6000], [4650, -5000], [4900, -4400], [4950, -3800], [4900, -3000], [4700, -2400],
  [4300, -1950], [4000, -1700], [3700, -1620], [3400, -1680], [3100, -1600],
];
// the beach of shingle in the cove
const BEACH: XY[] = [[1450, -1950], [3300, -1750], [3300, 1750], [1600, 1950], [1450, 1500], [1650, 900], [1400, 300], [1650, -300], [1450, -900], [1700, -1500]];

// ---- the levels ----
// HW: the west headland (400), HW2 its second step (750), HW3 the lighthouse's top (1050);
// HE: the east headland (450), HE2 the seabird cliffs (750). Past the edge to the south: hills.
const HW: XY[] = [[-3500, A], [-3400, 5000], [-2800, 3600], [-1600, 2800], [0, 2400], [1200, 2000], [1900, 2150], [2600, 1900], [3300, 2050], [3900, 1900], [4500, 2600], [4700, 3800], [4400, 5200], [4600, A]];
const HW2: XY[] = [[-1800, A], [-1600, 5600], [-200, 5000], [900, 4600], [1500, 4100], [2300, 3500], [3500, 3000], [4000, 3300], [4200, 4100], [3900, 5400], [4000, A]];
const HW3: XY[] = [[2800, 3800], [3750, 3850], [3850, 4600], [3600, 5300], [2800, 5300]];
const HE: XY[] = [[-3200, -A], [-3000, -4600], [-2200, -3400], [-1000, -2600], [600, -2200], [2000, -1900], [2800, -2080], [3600, -1900], [4400, -2500], [4500, -3800], [4200, -5000], [4400, -A]];
const HE2: XY[] = [[1200, -3000], [2400, -2700], [3700, -2900], [4000, -3700], [3800, -4700], [2600, -5200], [1300, -4400]];
const MS: XY[] = [[-A, -A], [-6200, -A], [-6400, -4000], [-6100, -2300], [-7700, -1600], [-7800, 300], [-6400, 1000], [-6600, 2500], [-6100, 4500], [-6300, A], [-A, A]];

// ramps: top on the edge, bottom out below
const RHW = { top: [600, 2200] as XY, bottom: [205, 1014] as XY, width: 460 };
const RHW2 = { top: [1900, 3800] as XY, bottom: [1240, 2920] as XY, width: 440 };
const RHW3 = { top: [2800, 4500] as XY, bottom: [1800, 4500] as XY, width: 420 };
const RHE = { top: [-200, -2400] as XY, bottom: [-528, -1090] as XY, width: 460 };
const RHE2 = { top: [1250, -3700] as XY, bottom: [253, -3771] as XY, width: 440 };

const along = (a: XY, b: XY, d: number): XY => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [a[0] + ((b[0] - a[0]) / L) * d, a[1] + ((b[1] - a[1]) / L) * d];
};
const len = (r: { top: XY; bottom: XY }) => Math.hypot(r.top[0] - r.bottom[0], r.top[1] - r.bottom[1]);
const dz = (p: XY[]) => densify(p, (x, y) => Math.abs(x) < R + 1500 && Math.abs(y) < R + 1500);
// a ramp up from the ground or a step: the track leading to its foot, up it, and on past its top
const climb = (r: { top: XY; bottom: XY }, inn = 450, out = 400): XY[] => [along(r.bottom, r.top, -inn), r.bottom, r.top, along(r.bottom, r.top, len(r) + out)];

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(314, {
    hills: [
      { x: -3800, y: -1200, r: 1500, h: 140 },
      { x: -2200, y: 1200, r: 1300, h: 110 },
      { x: -4300, y: 2600, r: 1100, h: 90 },
      { x: -1200, y: -1000, r: 900, h: -60 },
      { x: 800, y: -600, r: 1000, h: 70 },
      { x: -4600, y: -3600, r: 1200, h: 120 },
      { x: 1500, y: 3600, r: 700, h: 60 },
      { x: -7400, y: 0, r: 2600, h: 240 },
    ],
    plateaus: [
      { poly: dz(HW), h: 400, ramps: [RHW] },
      { poly: dz(HW2), h: 750, ramps: [RHW2] },
      { poly: dz(HW3), h: 1050, ramps: [RHW3] },
      { poly: dz(HE), h: 450, ramps: [RHE] },
      { poly: dz(HE2), h: 750, ramps: [RHE2] },
      { poly: dz(MS), h: 700 },
    ],
    rock: "Northcold_SeaRock",
  });
  const { put, rnd } = f;

  // ---- tracks: north over the moor from the way in; west up the headland's three steps to the
  // lighthouse, east up two to the seabird cliffs, down into the cove to the wreck ----
  const S_EXIT: XY = [-5150, -600];
  const MOOR: XY[] = smooth([[-7600, -650], S_EXIT, [-4300, -560], [-3300, -250], [-2200, 150], [-1100, 350], [0, 300], [900, 100], [1700, 200], [2300, 450]]);
  const WEST: XY[] = [...smooth([[-1100, 350], [-300, 600], climb(RHW)[0]]), ...climb(RHW).slice(1), ...smooth([climb(RHW)[3], [900, 2700], climb(RHW2, 400)[0]]), ...climb(RHW2, 400).slice(1), ...smooth([climb(RHW2)[3], [1700, 4300], climb(RHW3, 350)[0]]), ...climb(RHW3, 350).slice(1), [3250, 4500]];
  const EAST: XY[] = [...smooth([[-2200, 150], [-1100, -400], climb(RHE)[0]]), ...climb(RHE).slice(1), ...smooth([climb(RHE)[3], [-400, -3300], climb(RHE2)[0]]), ...climb(RHE2).slice(1), ...smooth([climb(RHE2)[3], [2400, -3900], [3200, -3800]])];
  const roads = [band(MOOR, 460), band(WEST, 400), band(EAST, 400)];
  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ROAD: [number, number, number] = [0.72, 0.74, 0.84];
  const ground = f.ground({ area, roads, plazas: [], water: [SEA], base: "snow", road: ROAD });
  // the cove's shingle: a second ground a hair over the snow, cut away outside the beach
  const areaOf = (p: XY[]) => p.reduce((t, [x, y], i) => t + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0);
  const box: XY[] = [[900, -2700], [3700, -2700], [3700, 2700], [900, 2700]];
  const hole = Math.sign(areaOf(box)) === Math.sign(areaOf(BEACH)) ? [...BEACH].reverse() : BEACH;
  const OUTSIDE_BEACH: XY[] = [...box, box[0], ...hole, hole[0]];
  const shingle = f.ground({ area: { x0: 1000, y0: -2600, x1: 3600, y1: 2600 }, roads, plazas: [], water: [OUTSIDE_BEACH, SEA], base: "rock", road: ROAD });
  shingle.mesh.position.y += 3;
  shingle.mesh.renderOrder = 1;

  // ---- the way out ----
  f.exit("highland", S_EXIT, [-4400, -560]);

  // ---- the sea: cold dark water, the shore closed, floes and stacks out on it ----
  const sea = f.waterSheet({ x0: 2400, x1: A + 2500, y0: -A - 2500, y1: A + 2500 }, -14, "Northcold_NorthSea");
  // the water's edge all along the shore (the beach, and the stony feet of the headlands' cliffs)
  // (the shore's points in order from the far east round the cove to the far west)
  const near = SEA.filter(([x, y]) => Math.abs(x) < A && Math.abs(y) < A), cut = near.findIndex(([, y]) => y < -4000);
  const shoreLine = [...near.slice(cut), ...near.slice(0, cut)];
  f.blockBand(shoreLine.map(([x, y]) => [x - 80, y] as XY), 200, { kind: "sea" });
  for (const [x, y, h, s] of [[4100, -300, 20, 0.75], [5300, 900, 140, 1], [6200, -1500, 250, 1.2], [6000, 3600, 60, 1.1], [5600, -4400, 300, 0.9], [7300, 1000, 100, 1.3], [7000, -3400, 180, 1]] as number[][])
    put("northcold:sea_stack", [x, y], h, { z: -14, s, solid: "none" });
  for (const [x, y, h, s] of [[3600, 600, 20, 0.8], [4600, -800, 130, 1], [5100, 2400, 240, 0.9], [5400, -2600, 60, 1], [6600, 200, 300, 1.2], [6400, 4800, 90, 1], [5900, -5600, 200, 1]] as number[][])
    put("northcold:drift_floes", [x, y], h, { z: -14, s, solid: "none" });
  const floeMat = material("Northcold_Floe"), floes: THREE.Object3D[] = [];
  for (const [x, y, r, s] of [[3300, -1000, 120, 71], [3500, 1100, 100, 72], [4300, 200, 160, 73], [5000, -1600, 140, 74], [4700, 1700, 130, 75], [5600, 3300, 150, 76]] as number[][])
    floes.push(flatSheet(blobPoly([x, y], r, r * 0.7, s, 0.25, 10), -11, floeMat));

  // ---- placing things ----
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
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] });
  const inBox = (x: number, y: number) => Math.abs(x) < R - 150 && Math.abs(y) < R - 150;
  const grove = (c: XY, r: number, n: number, kinds = ["SnowPineSmall", "SnowPineSmall", "SnowPine", "PineSmall"]) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!inBox(x, y) || inPoly(BEACH, x, y) || !free(x, y, 170, 200)) continue;
      put(`flora:${kinds[Math.floor(rnd() * kinds.length)]}`, [x, y], rnd() * 360, { s: 0.65 + rnd() * 0.35 });
      take(x, y, 170);
      made++;
    }
  };
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120, solid?: number) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (Math.abs(x) > R + 2500 || Math.abs(y) > R + 2500 || !free(x, y, rad, 40)) continue;
      put(ref, [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.4, ...(solid ? ring(solid) : {}) });
      take(x, y, rad);
      made++;
    }
  };

  // ---- the lighthouse on the highest step of the west headland ----
  const LIGHT: XY = [3300, 4300];
  prop("northcold:ruined_lighthouse", LIGHT, 90, 700, { solid: [{ kind: "tower", x: -20, y: 0, r: 330 }, { kind: "wall", x: 470, y: -30, w: 420, d: 460, rot: 0 }] });
  prop("snowland:cairn", [3000, 3950], 0, 70, ring(45));
  prop("northcold:flattened_grass", [3500, 3950], 30, 160);
  prop("northcold:iced_rocks", [3650, 5050], 60, 220, { s: 0.7, solid: [{ kind: "rock", x: 0, y: 0, r: 150 }] });

  // ---- the wreck in the cove, the beach round it ----
  const WRECK: XY = [2350, 150];
  prop("northcold:shipwreck", WRECK, 82, 1000, { solid: [{ kind: "wreck", x: 0, y: 80, w: 1500, d: 520, rot: 0 }, { kind: "wreck", x: 200, y: -420, w: 1000, d: 100, rot: -11 }] });
  for (const [x, y, h] of [[1900, -1300, 10], [2550, -1100, 80], [1800, 1300, 160], [2600, 1350, 40], [2050, 900, 120], [2700, -500, 0], [1700, -500, 30]] as number[][])
    if (free(x, y, 150)) prop("northcold:shingle_bank", [x, y], h, 250, { solid: "none" });
  for (const at of [[2650, -1500], [2700, 1600], [1600, 1650]] as XY[]) if (free(at[0], at[1], 150)) prop("northcold:iced_rocks", at, rnd() * 360, 220, { s: 0.8, solid: [{ kind: "rock", x: 0, y: 0, r: 160 }] });
  prop("northcold:seabird_rock", [2700, -1900], 40, 260, { s: 0.9, solid: [{ kind: "rock", x: 0, y: 0, r: 220 }] });
  // snow lying thin over the top of the shingle where it meets the moor
  for (const [x, y] of BEACH.filter(([x]) => x < 2000)) {
    const at: XY = [x - 60 + (rnd() - 0.5) * 120, y + (rnd() - 0.5) * 200];
    if (free(at[0], at[1], 200)) prop("snowland:snow_patch", at, rnd() * 360, 220, { s: 0.8 });
  }

  // ---- the seabird cliffs on the east headland ----
  const COLONY: XY = [3200, -3700];
  for (const [at, h, s] of [[[3500, -3300], 30, 1], [[3400, -4300], 160, 0.9], [[2700, -4700], 260, 0.8], [[2600, -3200], 100, 0.7]] as [XY, number, number][])
    prop("northcold:seabird_rock", at, h, 300 * s, { s, solid: [{ kind: "rock", x: 0, y: 0, r: 240 }] });
  prop("snowland:cairn", [2000, -3600], 0, 70, ring(45));
  for (const [x, y] of [[4000, -2700], [4100, -4400], [3900, -2200]] as XY[]) if (free(x, y, 150)) prop("northcold:iced_rocks", [x, y], rnd() * 360, 200, { s: 0.7, solid: [{ kind: "rock", x: 0, y: 0, r: 140 }] });

  // ---- the moor: an old memorial cairn for the drowned, the way marked, rocks ----
  prop("snowland:trail_sign", [-4950, -1000], 90, 80, ring(30, "post"));
  prop("snowland:cairn", [-4950, -150], 0, 70, ring(45));
  for (const at of [[-3300, 250], [-2100, -350], [-600, 800], [700, -250], [100, 1500], [-900, -1700], [1300, 3300], [1400, -3300]] as XY[]) if (free(at[0], at[1], 70)) prop("snowland:cairn", at, rnd() * 90, 70, ring(45));
  const ROCKS: [string, XY, number][] = [
    ["northcold:iced_rocks", [-4200, 1300], 170], ["snowland:snow_boulder", [-2700, -1900], 130], ["snowland:flat_slabs", [-3800, -3300], 150], ["northcold:iced_rocks", [-1500, 1800], 170],
    ["snowland:rock_cluster", [-500, -1400], 190], ["snowland:snow_boulder", [-4500, 3800], 130], ["snowland:flat_slabs", [400, 900], 150], ["northcold:iced_rocks", [1100, -1200], 170],
    ["snowland:rock_cluster", [-2200, 3700], 190], ["snowland:snow_boulder", [-1700, -4200], 130], ["snowland:flat_slabs", [-4800, -2000], 150],
    // up on the headlands
    ["northcold:iced_rocks", [500, 3300], 170], ["snowland:snow_boulder", [-800, 4600], 130], ["snowland:rock_cluster", [2700, 2600], 190], ["northcold:iced_rocks", [3700, 2900], 170],
    ["snowland:flat_slabs", [-1500, -3300], 150], ["snowland:snow_boulder", [1500, -2600], 130], ["northcold:iced_rocks", [600, -4700], 170], ["snowland:rock_cluster", [3200, -2400], 190],
    ["snowland:snow_boulder", [-200, 5000], 130], ["northcold:iced_rocks", [2300, 5000], 170], ["snowland:flat_slabs", [3800, -4900], 150],
  ];
  for (const [id, at, r] of ROCKS) if (free(at[0], at[1], r)) prop(id, at, rnd() * 360, r + 40, ring(r));

  // ---- fallen rock at the foot of the cliffs on land ----
  for (const poly of [HW, HW2, HW3, HE, HE2]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (inPoly(poly, mx + nx * 50, my + ny * 50)) [nx, ny] = [-nx, -ny];
      for (let t = 300; t < L - 200; t += 650) {
        const out = 300 + rnd() * 150, x = a[0] + ((b[0] - a[0]) * t) / L + nx * out, y = a[1] + ((b[1] - a[1]) * t) / L + ny * out;
        if (rnd() < 0.5 || !inBox(x, y) || !free(x, y, 110, 60)) continue;
        const s = 0.55 + rnd() * 0.3;
        prop(rnd() < 0.5 ? "northcold:iced_rocks" : "snowland:snow_boulder", [x, y], rnd() * 360, 160 * s, { s, solid: [{ kind: "rock", x: 0, y: 0, r: 120 * s + 20 }] });
      }
    }
  }

  // ---- trees: few, small and bent by the wind; on the moor's lee and the headlands' backs ----
  for (const [c, r, n] of [
    [[-4600, -2700], 700, 5], [[-3400, -4600], 700, 5], [[-4800, 2000], 600, 4], [[-3000, 4600], 600, 4], [[-2400, -2600], 400, 2], [[-1600, 3600], 500, 3],
    [[-200, 3900], 500, 3], [[-1800, -4900], 500, 3], [[100, -3700], 400, 2], [[-4900, 4900], 400, 3], [[-5000, -4900], 400, 3], [[800, 5100], 400, 2],
  ] as [XY, number, number][]) grove(c, r, n);

  // ---- ground cover: grass flattened under the snow everywhere the wind reaches, drifts ----
  scatter("northcold:flattened_grass", [-2500, 0], 3200, 26, 170);
  scatter("northcold:flattened_grass", [0, 3600], 2200, 8, 170);
  scatter("northcold:flattened_grass", [1200, -3600], 2000, 8, 170);
  scatter("northcold:flattened_grass", [3200, 4500], 700, 2, 170);
  scatter("snowland:snow_drift", [-3000, -1500], 2500, 6, 230);
  scatter("snowland:snow_drift", [-500, 3800], 1500, 3, 230);
  scatter("snowland:snow_drift", [1500, -3800], 1500, 3, 230);
  scatter("snowland:dry_grass", [-2800, 1500], 2500, 8, 90);
  scatter("snowland:frost_shrub", [-3500, -2500], 2000, 4, 90, 50);
  scatter("snowland:dead_branches", [-1500, 0], 3500, 5, 120);

  // ---- past the edge: woods to the south, the headlands running on east and west ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const onTrack = (x: number, y: number) => [[0, 0], [250, 0], [-250, 0], [0, 250], [0, -250]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  f.woods({ x0: -A, x1: 3500, y0: -A, y1: A }, ["SnowPine", "SnowPineSmall", "SnowPineSmall", "PineSmall"], (x, y) => inside(x, y) || onTrack(x, y) || inPoly(SEA, x - 400, y) || (x > -R && rnd() < 0.5), { count: 260, spacing: 450, tries: 5000 });

  // ---- monsters ----
  const quiet = (x: number, y: number) => Math.hypot(x - WRECK[0], y - WRECK[1]) < 900 || Math.hypot(x - LIGHT[0], y - LIGHT[1]) < 800;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 1000, keepOut: quiet });

  // ---- people ----
  const npcs: NpcSpec[] = [
    { id: "north_cliffs_keeper", x: 2960, y: 4850, face: 150, name: "ตาโอลาฟ", title: "อดีตผู้ดูแลประภาคาร", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "teal", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: [
        "ไฟบนประภาคารดับไปตั้งแต่คืนพายุใหญ่ คืนเดียวกับที่เรือลำนั้นเกยหาดในอ่าวข้างล่าง",
        "ข้ายังขึ้นมาเฝ้าทะเลทุกเย็น ทั้งที่รู้ว่าไม่มีเรือลำไหนกล้าแล่นมาทางเหนืออีกแล้ว",
        "เลยหน้าผานี้ไปมีแต่ทะเลน้ำแข็ง แผ่นดินสุดทางแล้วล่ะพ่อหนุ่ม",
      ] },
    { id: "north_cliffs_scavenger", x: 1700, y: -650, face: 30, name: "ซิกรุน", title: "นักเก็บซากเรือ", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "teal", eyes: "violet", top: "top_adventurer_teal", bottom: "bottom_adventurer_cocoa" },
      lines: [
        "เรือสินค้าลำนี้บรรทุกอะไรมาไม่มีใครรู้ ฉันขุดหาในกรวดมาทั้งฤดูแล้ว",
        "นกทะเลบนหน้าผาตะวันออกส่งเสียงดังทั้งวัน ถ้ามันเงียบเมื่อไหร่ให้รีบหนี มีอะไรบางอย่างมาแน่",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [shingle.mesh, sea, ...floes],
    sky: "#a9b9c8",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -4300, y: -540 },
    npcs,
    labels: [
      { x: S_EXIT[0] + 150, y: S_EXIT[1], text: "ทางไปไฮแลนด์ ฮิล", kind: "gate" },
      { x: LIGHT[0] - 700, y: LIGHT[1] - 300, text: "ประภาคารร้าง" },
      { x: WRECK[0] - 700, y: WRECK[1] - 600, text: "ซากเรือบนหาดกรวด" },
      { x: 2300, y: -1500, text: "อ่าวหาดกรวด", kind: "small" },
      { x: COLONY[0] - 600, y: COLONY[1], text: "หน้าผานกทะเล" },
      { x: -2600, y: -600, text: "ทุ่งหญ้าลู่ลม" },
      { x: 300, y: 2900, text: "แหลมตะวันตก", kind: "small" },
      { x: -200, y: -3200, text: "แหลมตะวันออก", kind: "small" },
    ],
  });
}
