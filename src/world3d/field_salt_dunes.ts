// เนินทรายริมทะเลใน (the salt dunes), monsters Lv 30-40: where the red sand east of the desert's
// edge runs down to the inner sea. The coast crosses the field from its north-west corner to its
// south-east corner, the sea on the north and the east. From the way in from the desert's edge
// (the middle of the west side, through a cut in the mesa wall that walls that side) the track
// comes down over red dunes to a fork: north-east to a fishing hamlet on the beach (driftwood huts
// on stilts, nets drying, boats drawn up, more moored off it), south to the salt works behind the
// bay: white flats of salt crust, the pans, the heaps raked up and the salters' shelter, and past
// them out along a sand spit to a two-masted trader wrecked at its tip. Between the hamlet and the
// bay a headland stands out into the sea, sea cliffs round it, the bones of a whale on its top.
// South-west a mesa of red rock climbs in two steps: a window worn through the rock on the first,
// the salt boats' old beacon on the second, looking out over the inner sea. The track south goes
// by a spring under palms in a hollow of the dunes and on to the way out to the great desert (the
// middle of the south side), the red sand paling toward it into the desert's gold.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: west (middle) -> desert_edge, south (middle) -> great_desert

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Poly } from "./paved";
import type { Town } from "./town";
import { useKits } from "./town";
import { material } from "./textures";
import { smooth, band, dense, blob, inPoly, toLine, nearestOn, towards, along } from "./kits/westfarm";
import type { XY } from "./kits/westfarm";
import { KIT as WESTFARM } from "./kits/westfarm";
import { KIT as SOUTHSANDS } from "./kits/southsands";
import { KIT as DESERT } from "./kits/desert";
import { KIT as BAHAMAS } from "./kits/bahamas";
import { KIT as JUNGLE } from "./kits/jungle";
import { KIT as YODIA } from "./kits/yodia";
import { KIT as STEPPE, SHAPES as STEPPE_SHAPES } from "./kits/steppe";
import { KIT as TRUNRADA } from "./kits/trunrada";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(WESTFARM, SOUTHSANDS, DESERT, BAHAMAS, JUNGLE, YODIA, STEPPE, TRUNRADA);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the coast: from past the north-west corner round the hamlet's beach, the headland, the bay
// and the spit, down to past the south-east corner; the sea north-east of it ----
const SHORE: XY[] = smooth([
  [9600, 7600], [7200, 6500], [5800, 5500], [4900, 4700], [4450, 3700], [4300, 2700], [4450, 1900], [4550, 1000], [4150, 150], [3400, -350],
  [2500, -450], [1900, -900], [1700, -1600], [2100, -2150], [2800, -2450], [3500, -2800], [3950, -3300], [3700, -3750], [3000, -3700],
  [2200, -3450], [1400, -3500], [600, -3900], [-300, -4300], [-1300, -4700], [-2400, -5050], [-3500, -5400], [-4600, -5800], [-5800, -6300],
  [-7500, -7100], [-9600, -8000],
], 220);
const SEA: Poly = [...SHORE, [-9600, -9600], [9600, -9600]];

// ---- the levels ----
// M1: the red mesa (420) in the south-west, M1B its summit step (760); M2: the headland (320)
// between the hamlet and the bay, its sea faces just inside the shore; past the west edge the mesa
// wall that walls the desert's edge on its east, cut where the track comes through.
const M1: XY[] = [[-900, 1000], [-1000, 2500], [-800, 4200], [-1500, 5000], [-3200, 5300], [-4600, 4700], [-5000, 3200], [-4600, 1500], [-3500, 700], [-2000, 600]];
const M1B: XY[] = [[-2300, 2300], [-2100, 3500], [-2700, 4300], [-3700, 4300], [-4200, 3400], [-3800, 2400]];
const M2: XY[] = [[2500, 2300], [3500, 2500], [4100, 2200], [4250, 1500], [4280, 900], [3900, 300], [3300, -60], [2600, 100], [2200, 800], [2150, 1600]];
const RIM_W: XY[] = [[-A, 6300], [-5000, 6500], [-2500, 6200], [0, 6450], [650, 6600], [600, 8200], [1400, 8200], [1350, 6650], [1800, 6400], [3200, 6300], [4300, 6700], [5600, 7600], [6500, A], [-A, A]];
const RM1 = { top: [-950, 1750] as XY, bottom: [350, 1750] as XY, width: 460 };
const RM1B = { top: [-3000, 2347] as XY, bottom: [-3000, 1300] as XY, width: 420 };
const RM2 = { top: [2175, 1200] as XY, bottom: [1176, 1138] as XY, width: 440 };
const len = (r: { top: XY; bottom: XY }) => Math.hypot(r.top[0] - r.bottom[0], r.top[1] - r.bottom[1]);
// a ramp up from the ground or a step: the track leading to its foot, up it, and on past its top
const climb = (r: { top: XY; bottom: XY }, inn = 400, out = 400): XY[] => [along(r.bottom, r.top, -inn), r.bottom, r.top, along(r.bottom, r.top, len(r) + out)];

// ---- the places ----
const W_EXIT: XY = [1000, 5150], S_EXIT: XY = [-5150, 0];
const HAMLET: XY = [3250, 3450];
const SALT: XY = [300, -2200]; // the salters' shelter
const WRECK: XY = [3250, -3200];
const WHALE: XY = [3350, 1250];
const BEACON: XY = [-3250, 3450];
const WINDOW: XY = [-1700, 4100];
const SPRING: XY = [-2700, -1750];

// ---- the tracks ----
const T_W: XY[] = smooth([[1050, 7600], W_EXIT, [1000, 4300], [1100, 3500], [1150, 2700], [1000, 1900], [750, 1100], [500, 300], [450, -400]]);
const T_HAM: XY[] = smooth([[1000, 3250], [1600, 3500], [2300, 3600], [2900, 3500], [3600, 3300], [4000, 3150]]);
const T_HEAD: XY[] = [...smooth([[780, 1300], climb(RM2)[0]]), ...climb(RM2).slice(1), ...smooth([climb(RM2)[3], [2900, 1350], [WHALE[0] - 250, WHALE[1] + 150]])];
const T_SALT: XY[] = smooth([[450, -400], [700, -1100], [800, -1700], [1100, -2400], [1700, -2700], [2300, -2900], [2800, -3050]]);
const T_S: XY[] = smooth([[450, -400], [-300, -700], [-1100, -950], [-1900, -950], [-2800, -650], [-3700, -200], [-4400, -20], S_EXIT, [-7600, 50]]);
const T_MESA: XY[] = [
  ...smooth([[950, 1900], climb(RM1)[0]]), ...climb(RM1).slice(1),
  ...smooth([climb(RM1)[3], [-1700, 1500], [-2400, 1150], climb(RM1B, 350)[0]]), ...climb(RM1B, 350).slice(1),
  ...smooth([climb(RM1B, 350, 300)[3], [-2950, 3000], [BEACON[0] + 450, BEACON[1] - 250]]),
];
const T_WINDOW: XY[] = smooth([[-1450, 1700], [-1500, 2600], [-1450, 3400], [WINDOW[0] + 200, WINDOW[1] - 400]]);
const TRACKS = [T_W, T_HAM, T_HEAD, T_SALT, T_S, T_MESA, T_WINDOW];

// how far into the bands along the south and west edges, where the red sand pales into the gold
// of the great desert's and the desert's edge (0 at a band's inner side, 1 at the edge and past)
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const ease = (t: number) => t * t * (3 - 2 * t);
const goldS = (x: number) => clamp01((-3300 - x) / 2200), goldW = (y: number) => clamp01((y - 3300) / 2200);
const gold = (x: number, y: number) => Math.max(goldS(x), goldW(y));

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(517, {
    hills: [
      // the red dunes rolling between the mesa, the salt works and the coast
      { x: -3600, y: -3700, r: 1300, h: 280 }, { x: -3000, y: -4300, r: 750, h: 180 }, { x: -4200, y: -1500, r: 800, h: 170 },
      { x: -1100, y: 300, r: 800, h: 140 }, { x: 1900, y: 4600, r: 800, h: 150 }, { x: 2000, y: 2300, r: 550, h: 90 },
      { x: 4200, y: 5200, r: 500, h: 80 },
      { x: SPRING[0], y: SPRING[1], r: 700, h: -70 },
      // the great dunes past the south edge, and the desert past the west running up to its wall
      { x: -7400, y: -2500, r: 2300, h: 460 }, { x: -7300, y: 2800, r: 2200, h: 420 }, { x: -7600, y: 6800, r: 1800, h: 300 },
      { x: -6800, y: -6300, r: 1300, h: 220 },
    ],
    plateaus: [
      { poly: dense(M1), h: 420, ramps: [RM1] },
      { poly: dense(M1B), h: 760, ramps: [RM1B] },
      { poly: dense(M2), h: 320, ramps: [RM2] },
      { poly: dense(RIM_W), h: 820 },
    ],
    rock: "CliffRed",
  });
  const { rnd } = f;

  // the hamlet's yard (beaten sand), the salters' yard
  const YARD = blob(HAMLET, 520, 650, 3, 16, 0.1), SALT_YARD = blob(SALT, 380, 480, 7, 14, 0.1);
  const roads: Poly[] = [band(T_W, 470), band(T_HAM, 400), band(T_HEAD, 400), band(T_SALT, 420), band(T_S, 450), band(T_MESA, 400), band(T_WINDOW, 360), YARD, SALT_YARD];
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, cell: 60, roads, plazas: [], water: [SEA], base: "sand", road: [0.97, 0.86, 0.74] });

  // ---- the sand's colour, point by point (a factor on its own): wet and dark at the water's edge,
  // pale on the beach, red over the dunes and the mesa, paling to the desert's gold over the bands
  // along the south and west edges ----
  {
    const geo = ground.mesh.geometry, pos = geo.getAttribute("position"), col = new Float32Array(pos.count * 3);
    const RED = [1.0, 0.7, 0.54], ROCK = [0.9, 0.6, 0.46], PALE = [1.02, 0.96, 0.86], WET = [0.76, 0.66, 0.56];
    const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
    for (let i = 0; i < pos.count; i++) {
      const x = ground.mesh.position.x + pos.getX(i), y = -(ground.mesh.position.z + pos.getZ(i));
      const d = toLine(x, y, SHORE), h = f.h(x, y);
      let c = mix(RED, ROCK, clamp01((h - 250) / 300));
      c = mix(c, [1, 1, 1], ease(gold(x, y)));
      c = mix(c, PALE, ease(clamp01((900 - d) / 600)) * (h < 60 ? 1 : 0.3));
      c = mix(c, WET, ease(clamp01((260 - d) / 200)));
      if (ground.kind(x, y) === 1) c = mix(c, [1, 1, 1], 0.6);
      col.set(c, i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    (ground.mesh.material as THREE.MeshStandardMaterial).vertexColors = true;
  }

  // ---- the sea: its sheet from a little under the beach out past the picture's edge, the shore
  // closed by solids all along it ----
  const seaward = (i: number, d: number): XY => {
    const a = SHORE[Math.max(0, i - 1)], b = SHORE[Math.min(SHORE.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let n: XY = [-(b[1] - a[1]) / L, (b[0] - a[0]) / L];
    if (!inPoly(SEA, SHORE[i][0] + n[0] * 120, SHORE[i][1] + n[1] * 120)) n = [-n[0], -n[1]];
    return [SHORE[i][0] + n[0] * d, SHORE[i][1] + n[1] * d];
  };
  const shoreIn = SHORE.map((_, i) => i).filter((i) => Math.abs(SHORE[i][0]) < R + 700 && Math.abs(SHORE[i][1]) < R + 700);
  f.blockBand(shoreIn.map((i) => seaward(i, 260)), 520, { kind: "sea" });
  const seaShape = new THREE.Shape();
  [...SHORE.map((_, i) => seaward(i, -220)), [-20000, -9600], [-20000, -20000], [20000, -20000], [20000, 9600]].forEach(([x, y], i) => (i ? seaShape.lineTo(x, y) : seaShape.moveTo(x, y)));
  const seaSheet = new THREE.Mesh(new THREE.ShapeGeometry(seaShape).applyMatrix4(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1)), material("WaterSea"));
  seaSheet.position.y = -14;
  seaSheet.receiveShadow = true;

  // ---- the ways out ----
  f.exit("desert_edge", W_EXIT, [950, 4450]);
  f.exit("great_desert", S_EXIT, [-4450, -20]);

  // ---- placing things: clear of the tracks, the cliffs, the water and each other ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine(x, y, t) < d) || ground.kind(x, y) !== 0;
  const wet = (x: number, y: number, r: number) => [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].some(([dx, dy]) => ground.kind(x + dx, y + dy) === 3);
  const free = (x: number, y: number, r: number, gap = 0) =>
    !nearTrack(x, y, r + 200) && !wet(x, y, r + 120) && f.level(x, y, Math.min(r, 220)) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof f.put>[3] = {}) => {
    f.put(ref, at, h, o);
    taken.push([at[0], at[1], r]);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] as SolidSpec[] });
  const IN = { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 };
  const scatter = (refs: string[], n: number, box: { x0: number; x1: number; y0: number; y1: number }, rad: number, o: { s?: [number, number]; solid?: SolidSpec[] | "none"; keep?: (x: number, y: number) => boolean } = {}) => {
    for (let i = 0, made = 0; i < n * 30 && made < n; i++) {
      const x = box.x0 + rnd() * (box.x1 - box.x0), y = box.y0 + rnd() * (box.y1 - box.y0);
      if (!free(x, y, rad, 40) || (o.keep && !o.keep(x, y))) continue;
      const s = o.s ? o.s[0] + rnd() * (o.s[1] - o.s[0]) : 1;
      prop(refs[Math.floor(rnd() * refs.length)], [x, y], rnd() * 360, rad * s, { s, ...(o.solid ? { solid: o.solid } : {}) });
      made++;
    }
  };
  const nearExit = (x: number, y: number) => [W_EXIT, S_EXIT].some((w) => Math.hypot(x - w[0], y - w[1]) < 1100);
  const DUNE_SOLID: SolidSpec[] = [{ kind: "dune", x: 40, y: 0, r: 240 }, { kind: "dune", x: 110, y: -290, r: 180 }, { kind: "dune", x: 110, y: 290, r: 180 }];

  // ---- the ways out: the desert's signposts, rocks either side of the cut in the mesa wall ----
  prop("desert:signpost", [W_EXIT[0] - 380, W_EXIT[1] - 320], 0, 80);
  prop("desert:boulder_big", [W_EXIT[0] + 520, W_EXIT[1] + 250], 40, 230, { s: 0.65, ...ring(150) });
  prop("desert:rock_cluster", [W_EXIT[0] - 600, W_EXIT[1] + 350], 10, 200, { s: 0.7, ...ring(130) });
  prop("southsands:cow_skull", [W_EXIT[0] + 420, W_EXIT[1] - 520], 210, 80, { solid: "none" });
  prop("desert:signpost", [S_EXIT[0] + 380, S_EXIT[1] + 330], 90, 80);
  prop("desert:boulder_flat", [S_EXIT[0] + 650, S_EXIT[1] - 500], 30, 230, { s: 0.7, ...ring(140) });
  prop("desert:dune_ridge", [S_EXIT[0] + 300, S_EXIT[1] + 1150], 160, 420, { s: 0.65, solid: DUNE_SOLID });
  prop("desert:signpost", [700, 3050], 140, 80);
  prop("desert:signpost", [180, -150], 60, 80);

  // ---- the fishing hamlet: three driftwood huts round a yard of beaten sand, nets drying, boats
  // drawn up on the beach and more moored off it, a fire, crates and fish baskets ----
  prop("southsands:fisher_hut", [3700, 4200], towards(-0.6, -1), 420, { solid: [{ kind: "building", x: 0, y: 0, w: 450, d: 360, rot: 0 }, { kind: "post", x: -310, y: 0, r: 40 }] });
  prop("southsands:fisher_hut", [2700, 4150], towards(0.5, -1), 420, { s: 0.9, solid: [{ kind: "building", x: 0, y: 0, w: 450, d: 360, rot: 0 }, { kind: "post", x: -310, y: 0, r: 40 }] });
  prop("southsands:fisher_hut", [3750, 2850], towards(-0.4, 1), 420, { s: 0.95, solid: [{ kind: "building", x: 0, y: 0, w: 450, d: 360, rot: 0 }, { kind: "post", x: -310, y: 0, r: 40 }] });
  prop("southsands:net_rack", [2650, 2900], 75, 330, { solid: [{ kind: "post", x: 0, y: -240, r: 50 }, { kind: "post", x: 0, y: 240, r: 50 }] });
  prop("southsands:net_rack", [4200, 4600], 40, 330, { s: 0.9, solid: [{ kind: "post", x: 0, y: -240, r: 50 }, { kind: "post", x: 0, y: 240, r: 50 }] });
  prop("trunrada:campfire", [3150, 3350], 0, 170);
  prop("common:crate", [3500, 3850], 20, 60);
  prop("common:crate", [3560, 3920], 55, 60);
  prop("bahamas:pottery_set", [2950, 3800], 30, 90);
  prop("southsands:salt_heap", [2600, 3700], 80, 200, { s: 0.45, solid: "none" });
  for (const [x, y, h] of [[4150, 3900, -110], [4080, 3150, -70], [4500, 4500, -140]] as [number, number, number][])
    prop("southsands:beached_boat", [x, y], h, 260, { solid: [{ kind: "boat", x: 0, y: 0, w: 470, d: 150, rot: 0 }] });
  for (const [x, y, h] of [[5200, 3300, 60], [4950, 2050, 100], [5600, 4700, 20]] as [number, number, number][]) f.put("yodia:fishing_boat", [x, y], h, { z: -16, solid: "none" });
  for (const [x, y] of [[2250, 3000], [4050, 3600], [2750, 4550], [3400, 4600]] as XY[]) prop(rnd() < 0.5 ? "flora:PalmBent" : "flora:Palm", [x, y], towards(-1, 0.3) + (rnd() - 0.5) * 50, 160, { s: 0.85 + rnd() * 0.25 });

  // ---- the headland: the whale's bones on its top, rocks, a cairn at the point ----
  prop("westfarm:giant_skeleton", WHALE, 60, 650, {
    s: 0.95, solid: [{ kind: "bone", x: -560, y: -30, r: 120 }, { kind: "bone", x: -250, y: 0, r: 60 }, { kind: "bone", x: 100, y: 0, r: 60 }, { kind: "bone", x: 350, y: 0, r: 50 }],
  });
  prop("trunrada:cairn", [3950, 700], 0, 90);
  prop("desert:rock_cluster", [2600, 1900], 70, 200, { s: 0.7, ...ring(130) });
  prop("southsands:cow_skull", [3700, 1900], 120, 80, { solid: "none" });
  prop("desert:dry_bush", [2700, 600], 0, 100);
  prop("desert:dry_bush", [3900, 1500], 50, 100);

  // ---- the salt works behind the bay: flats of salt crust, the pans, heaps raked up, the
  // salters' shelter (a sail over sacks of salt), a cart to carry it ----
  for (const [x, y, s, h] of [[-1150, -2900, 0.9, 20], [-200, -3500, 0.6, 70], [-1300, -1900, 0.7, 120]] as number[][]) {
    f.put("southsands:salt_flat", [x, y], h, { s, solid: "none" });
    taken.push([x, y, 820 * s]);
  }
  prop("southsands:salt_pans", [650, -3150], 25, 560, { solid: "none" });
  prop("southsands:salt_pans", [-450, -2250], 70, 560, { solid: "none" });
  prop("southsands:salt_heap", [-100, -1650], 30, 260, ring(150, "heap"));
  prop("southsands:salt_heap", [1150, -3000], 110, 240, { s: 0.85, ...ring(130, "heap") });
  prop("southsands:salt_heap", [-1900, -2500], 200, 220, { s: 0.8, ...ring(120, "heap") });
  prop("bahamas:shade_sail", [SALT[0] + 100, SALT[1] + 200], towards(-0.3, -1), 280);
  prop("trunrada:cart", [SALT[0] - 250, SALT[1] - 300], 30, 160);
  prop("common:crate", [SALT[0] + 330, SALT[1] - 120], 15, 60);
  prop("bahamas:pottery_set", [SALT[0] + 300, SALT[1] + 420], 70, 90);

  // ---- the spit: the trader wrecked at its tip, timbers along the beach, bones ----
  prop("southsands:sail_wreck", WRECK, 152, 950, { solid: [{ kind: "wreck", x: 50, y: 0, w: 1700, d: 520, rot: 0 }, { kind: "wreck", x: 150, y: -460, w: 760, d: 120, rot: -12 }] });
  prop("jungle:wreck_debris", [2350, -2650], 40, 260, { solid: "none" });
  prop("southsands:cow_skull", [2650, -3350], 70, 80, { solid: "none" });
  prop("southsands:beached_boat", [2050, -3150], 170, 260, { s: 0.9, solid: [{ kind: "boat", x: 0, y: 0, w: 470, d: 150, rot: 0 }] });

  // ---- the sea: stacks off the headland and the coast, fish stakes in the bay ----
  for (const [x, y, h, s] of [[5600, 1300, 20, 0.9], [4900, -1500, 120, 1.1], [5200, -4300, 200, 1], [1800, -5100, 70, 0.8], [-2000, -6300, 300, 1.2]] as number[][])
    f.put("jungle:sea_stack", [x, y], h, { s, z: -10, solid: "none" });
  f.put("jungle:fish_stakes", [2600, -1350], 100, { solid: "none" });
  f.put("jungle:fish_stakes", [5900, 4000], 30, { solid: "none" });
  // the headland's feet: boulders along the water
  for (let i = 0; i < SHORE.length; i++) {
    const [x, y] = SHORE[i];
    if (x < 2600 || y < -300 || y > 2500 || i % 2) continue;
    const n = seaward(i, -60);
    f.put("yodia:shore_rocks", n, towards(x - n[0], y - n[1]), { solid: "none", s: 0.9 });
  }

  // ---- the red mesa: the window in the rock on its first step, the beacon on its summit, bones
  // and scrub ----
  prop("desert:rock_arch_big", WINDOW, 60, 480, {
    s: 0.6, solid: [{ kind: "rock", x: -10, y: -560, w: 420, d: 440, rot: 0 }, { kind: "rock", x: 10, y: 560, w: 420, d: 440, rot: 0 }],
  });
  prop("steppe:beacon_tower", BEACON, towards(1, -1), 420, { solid: STEPPE_SHAPES.beacon_tower });
  prop("trunrada:cairn", [BEACON[0] + 600, BEACON[1] + 500], 0, 90);
  prop("southsands:cow_skull", [BEACON[0] + 500, BEACON[1] - 650], 300, 80, { solid: "none" });
  prop("desert:bones", [-2300, 4300], 40, 200, { solid: "none" });
  prop("desert:hoodoo", [-4300, 2400], 20, 180, { s: 0.8 });
  prop("desert:hoodoo", [-1400, 3200], 140, 160, { s: 0.65 });
  scatter(["desert:dry_bush", "desert:grass_tuft", "desert:boulder_flat"], 14, { x0: -4900, x1: -900, y0: 700, y1: 5200 }, 100, { s: [0.6, 1], keep: (x, y) => f.h(x, y) > 300 });

  // ---- the spring under palms in its hollow ----
  prop("southsands:spring_pool", SPRING, 30, 300, { s: 1.15, solid: [{ kind: "water", x: 0, y: 0, r: 200 }] });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3, d = 420 + rnd() * 180;
    const at: XY = [SPRING[0] + Math.cos(a) * d, SPRING[1] + Math.sin(a) * d];
    if (nearTrack(at[0], at[1], 220)) continue;
    prop(["flora:Palm", "flora:PalmTall", "flora:PalmBent"][i % 3], at, rnd() * 360, 160, { s: 0.85 + rnd() * 0.3 });
  }
  prop("desert:reeds", [SPRING[0] - 330, SPRING[1] + 120], 0, 60, { solid: "none" });
  prop("desert:reeds", [SPRING[0] + 280, SPRING[1] - 200], 70, 60, { solid: "none" });
  prop("bahamas:camel_trough", [SPRING[0] + 380, SPRING[1] + 420], 60, 140);

  // ---- the dunes: crescents of red sand, rocks, bones and skulls, beach grass, scrub; cacti and
  // the desert's rocks thickening toward the west and south ----
  scatter(["southsands:red_dune"], 22, IN, 470, { s: [0.6, 1.05], solid: DUNE_SOLID, keep: (x, y) => !nearExit(x, y) && f.h(x, y) < 300 && gold(x, y) < 0.7 && toLine(x, y, SHORE) > 900 });
  scatter(["desert:dune_ridge"], 6, IN, 460, { s: [0.6, 0.9], solid: DUNE_SOLID, keep: (x, y) => !nearExit(x, y) && gold(x, y) > 0.3 });
  scatter(["desert:rock_cluster", "desert:boulder_flat", "desert:boulder_big"], 26, IN, 220, { s: [0.5, 0.9], solid: [{ kind: "rock", x: 0, y: 0, r: 120 }], keep: (x, y) => !nearExit(x, y) && toLine(x, y, SHORE) > 500 });
  scatter(["desert:hoodoo"], 4, IN, 180, { s: [0.55, 0.8], keep: (x, y) => !nearExit(x, y) && toLine(x, y, SHORE) > 1500 });
  scatter(["southsands:cow_skull", "southsands:cow_skull", "desert:bones"], 18, IN, 120, { solid: "none", keep: (x, y) => !nearExit(x, y) });
  scatter(["desert:dry_bush", "desert:dry_bush", "desert:grass_tuft"], 60, IN, 100, { s: [0.7, 1.1] });
  scatter(["flora:Cactus", "flora:CactusRound"], 18, IN, 90, { s: [0.7, 1.05], keep: (x, y) => rnd() < gold(x, y) + 0.15 });
  scatter(["desert:dead_tree"], 7, IN, 150, { s: [0.8, 1.1], solid: [{ kind: "tree", x: 0, y: 0, r: 26 }], keep: (x, y) => toLine(x, y, SHORE) > 700 });
  scatter(["flora:PalmBent", "flora:Palm"], 10, IN, 160, { s: [0.8, 1.05], keep: (x, y) => toLine(x, y, SHORE) < 1200 && toLine(x, y, SHORE) > 350 });
  // what the sea leaves on the beach: driftwood, timbers off the wreck, skulls the crabs left behind
  scatter(["jungle:wreck_debris", "desert:fallen_log", "southsands:cow_skull"], 14, IN, 160, { s: [0.6, 1], solid: "none", keep: (x, y) => toLine(x, y, SHORE) < 650 });
  // beach grass on the dunes behind the beach, dry tufts everywhere else
  const grassOut = (x: number, y: number) => nearTrack(x, y, 60) || wet(x, y, 200) || !f.level(x, y, 90) || taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < (tr > 500 ? tr : tr * 0.8));
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["grass_tuft", "grass_tuft", "grass_patch"], (x, y) => grassOut(x, y) || toLine(x, y, SHORE) > 1600, { count: 160, tries: 4000, spacing: 280, kit: "desert" });
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["grass_tuft", "dry_bush", "grass_patch"], grassOut, { count: 170, tries: 5000, spacing: 420, kit: "desert" });

  // ---- past the edges: the desert's rocks, cacti and dune crests to the west and south, red dunes
  // where the land runs on along the coast, nothing on the sea ----
  const rim = (x: number, y: number) => (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || ground.kind(x, y) !== 0 || toLine(x, y, SHORE) < 300;
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["dune_ridge", "dune_ridge", "boulder_big", "rock_cluster", "boulder_flat", "hoodoo", "dry_bush", "butte"], rim, { count: 150, tries: 4000, spacing: 700, kit: "desert" });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["red_dune", "cow_skull"], (x, y) => rim(x, y) || gold(x, y) > 0.8, { count: 40, tries: 1500, spacing: 900, kit: "southsands" });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["Cactus", "CactusRound", "PalmBent"], rim, { count: 60, tries: 2000, spacing: 700 });

  // ---- monsters: the dunes, the beaches, the salt flats, the spit, the headland and the mesa ----
  const busy = (x: number, y: number) => Math.hypot(x - HAMLET[0], y - HAMLET[1]) < 1000 || Math.hypot(x - SALT[0], y - SALT[1]) < 600 || Math.hypot(x - BEACON[0], y - BEACON[1]) < 500;
  f.monsterSpots(ground, IN, { step: 600, keepOut: busy, max: 52 });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "salt_dunes_fisher", x: HAMLET[0] - 120, y: HAMLET[1] + 330, face: 200, name: "ลุงซาลิม", title: "ชาวประมงทะเลใน", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_warrior_navy", bottom: "bottom_warrior_cocoa" },
      lines: [
        "ทะเลในนี้คลื่นลมสงบ ปลาชุม แต่ตอนน้ำลงพวกปูเสฉวนหัวกะโหลกจะขึ้นมาเดินเต็มหาด",
        "มันใช้กะโหลกวัวที่ตายกลางทะเลทรายเป็นเปลือก ตีไม่ค่อยเข้าหรอก ทุบแรงไปเดี๋ยวโดนสะท้อนกลับมาเอง",
        "เรือใบที่เกยปลายสันทรายนั่นเป็นเรือขนเกลือ พายุพัดเข้ามาเมื่อสามปีก่อน ลูกเรือรอดมาได้ครึ่งเดียว",
      ],
    },
    {
      id: "salt_dunes_salter", x: SALT[0] - 200, y: SALT[1] + 380, face: 30, name: "ฟาติมา", title: "คนทำนาเกลือ", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "amber", top: "top_adventurer_ochre", bottom: "bottom_adventurer_sand" },
      lines: [
        "เกลือจากลานนี้ขาวที่สุดในอาณาจักร กองคาราวานขนไปขายถึงบาฮามัสกับเมืองหลวง",
        "ระวังแมงป่องทรายแดงตามเนินทรายนะ พวกมันลงมาจากขอบทะเลทรายทุกหน้าแล้ง",
        "หอไฟบนผาทรายแดงเคยจุดนำทางเรือเกลือกลับฝั่งทุกคืน เดี๋ยวนี้ไม่มีใครขึ้นไปจุดแล้ว",
      ],
    },
  ];

  const sand = nearestOn(T_W, [1100, 4000]).at;
  return f.finishField({
    ground,
    scenery: [seaSheet],
    sky: "#dcb98e",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 950, y: 4300 },
    npcs,
    labels: [
      { x: W_EXIT[0], y: W_EXIT[1] - 250, text: "ทางไปขอบทะเลทราย", kind: "gate" },
      { x: S_EXIT[0] + 250, y: S_EXIT[1], text: "ทางไปทะเลทรายใหญ่", kind: "gate" },
      { x: HAMLET[0] - 300, y: HAMLET[1], text: "หมู่บ้านชาวประมง" },
      { x: WRECK[0] - 500, y: WRECK[1] + 300, text: "ซากเรือใบเกยตื้น" },
      { x: -700, y: -2700, text: "ลานเกลือขาว" },
      { x: WHALE[0] - 500, y: WHALE[1], text: "แหลมกระดูกวาฬ" },
      { x: BEACON[0] + 450, y: BEACON[1], text: "หอไฟบนผาทรายแดง" },
      { x: WINDOW[0] - 300, y: WINDOW[1], text: "หน้าต่างหินแดง", kind: "small" },
      { x: SPRING[0] + 450, y: SPRING[1], text: "น้ำพุใต้กอปาล์ม" },
      { x: 2100, y: -2800, text: "สันทรายปลายแหลม", kind: "small" },
      { x: sand[0] - 900, y: sand[1] - 1500, text: "เนินทรายแดง", kind: "small" },
    ],
  });
}
