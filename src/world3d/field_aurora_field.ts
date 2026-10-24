// ทุ่งแสงเหนือ (the aurora field), monsters Lv 78-88: the last land in the north-east of the
// world, a cape of snow east of the north ice field, the sea on its north, east and south. A wall
// of glacier stands along its west side (the same that closes the ice field's east), and the way
// in from the ice field comes through a gap in it. Past the gap the land opens into a wide, flat
// field of snow where the aurora's light lies in long green and violet streaks, and its curtains
// hang over the eastern end of the cape. Here and there pipes of ice stand out of the snow and
// whistle when the wind blows through them; on a low terrace of blue ice in the south the
// greatest of them stand together like an organ.
//
// Along the north the land rises in a headland that falls sheer into the northern sea, and on the
// headland's top, on a hill of its own, the astronomer who came to watch the aurora built his
// observatory; it stands in ruin now, its dome broken open to the sky, the great telescope still
// on its pier, his armillary sphere and his tablet of the stars outside. On the south shore a
// beach of shingle and ice where the floes come in; out at the cape's tip, the field ends in low
// rocks over the sea.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   way out: west -> north_icefield (through the gap in the glacier wall, where the ice field's
//   own way east meets the edge, n 0.455)

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits, seeded } from "./town";
import { material } from "./textures";
import { KIT as SKY, OBSERVATORY_SOLIDS, ORGAN_SOLIDS, auroraRibbon, auroraCurtain } from "./kits/skypeaks";
import { KIT as SNOW, densify, blobPoly, flatSheet } from "./kits/snowland";
import { KIT as WESTMOUNT, smooth, band, inPoly, toLine, rampOff, beyond, towards, sheet } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import { KIT as NORTHCOLD } from "./kits/northcold";
import { KIT as ICEBERG } from "./kits/iceberg";
import { KIT as TRUNRADA } from "./kits/trunrada";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(SKY, SNOW, NORTHCOLD, ICEBERG, WESTMOUNT, TRUNRADA);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the coast: from the glacier wall's foot on the north, round the cape's tip, back along the
// south shore to the wall again ----
const SHORE: XY[] = smooth([
  [A + 400, 6000], [6676, 5950], [5500, 5650], [4750, 4900], [4600, 3800], [4700, 2500], [4500, 1000], [4600, -400], [4300, -1800], [3800, -3000],
  [3000, -3900], [1900, -4500], [900, -4700], [450, -5050], [-200, -4700], [-1800, -4300], [-2900, -3700], [-3800, -2700], [-4400, -1500], [-4650, 0], [-4700, 1500],
  [-4250, 2250], [-4000, 2900], [-4450, 3500], [-4700, 4300], [-5300, 5300], [-6676, 5950], [-A - 400, 6000],
], 4);
const SEA: XY[] = [...SHORE, [-A - 400, -A - 400], [A + 400, -A - 400]];

// ---- the levels ----
// the glacier wall (900) along the west past the edge, the gap in it for the way in; the north
// headland (400) with its sea cliffs, the observatory's hill (750) on it; the ice terrace (250) in
// the south
const GAP = { x0: -1250, x1: 300 };
const WG_N: XY[] = [[GAP.x1, A], [GAP.x1 + 50, 7400], [GAP.x1 - 60, 6400], [500, 6050], [1800, 5900], [3200, 6150], [4500, 5950], [5600, 6050], [A, 6000], [A, A]];
const WG_S: XY[] = [[GAP.x0, A], [GAP.x0 - 40, 7400], [GAP.x0 + 50, 6400], [-1500, 6050], [-2900, 6200], [-4300, 5950], [-5600, 6100], [-A, 6000], [-A, A]];
const N1: XY[] = [[4450, 4700], [4300, 3800], [4400, 2500], [4200, 1000], [4300, -400], [3900, -1700], [3100, -1900], [2500, -1300], [2300, 0], [2100, 1300], [2300, 2600], [2600, 3700], [3200, 4500], [3900, 4900]];
const N2: XY[] = [[3850, 2300], [3900, 1100], [3700, 200], [3100, -200], [2600, 400], [2700, 1600], [3100, 2400]];
const S1: XY[] = [[-1500, -500], [-1000, -1500], [-1300, -2700], [-2200, -3200], [-3000, -2700], [-3200, -1500], [-2700, -600]];
const RN1 = rampOff([2300, 0], [2100, 1300], [3300, 800], 1250, 460);
const RN2 = rampOff([3850, 2300], [3100, 2400], [3300, 1100], 1150, 440);
const RS1 = rampOff([-1500, -500], [-1000, -1500], [-2200, -1700], 900, 440);

// ---- the places ----
const W_EXIT: XY = [-475, 5150];
const OBS: XY = [3350, 1050];
const ORGAN: XY = [-2200, -1950];
const TIP: XY = [800, -3700];
const BEACH: XY = [-3400, 1200];

const climb = (r: { top: XY; bottom: XY }, inn = 400, out = 350): XY[] => [beyond(r.top, r.bottom, inn), r.bottom, r.top, beyond(r.bottom, r.top, out)];

export function build(_quality: { flowers: number }): Town {
  const dz = (p: XY[]) => densify(p, (x, y) => Math.abs(x) < R + 1500 && Math.abs(y) < R + 1500);
  const f = new FieldBuilder(510, {
    hills: [
      { x: 600, y: 2600, r: 1400, h: 90 }, { x: -1600, y: 2200, r: 1200, h: 70 }, { x: 1200, y: -1200, r: 1100, h: 60 }, { x: -600, y: -3000, r: 1000, h: 80 },
      { x: 300, y: 600, r: 900, h: -40 }, { x: 1700, y: -3300, r: 800, h: 50 }, { x: -3200, y: 3400, r: 900, h: 60 }, { x: 0, y: 7600, r: 2200, h: 200 },
    ],
    plateaus: [
      { poly: dz(WG_N), h: 900 },
      { poly: dz(WG_S), h: 900 },
      { poly: dz(N1), h: 400, ramps: [RN1] },
      { poly: dz(N2), h: 750, ramps: [RN2] },
      { poly: dz(S1), h: 250, ramps: [RS1] },
    ],
    rock: "Skypeaks_CliffNorth",
  });
  const { put, rnd } = f;

  // ---- the tracks: in through the gap, across the field to the cape's tip; up the headland to
  // the observatory; onto the ice terrace; down to the beach ----
  const MAIN: XY[] = smooth([[-475, 9400], [-475, 6676], W_EXIT, [-450, 4300], [-200, 3300], [200, 2300], [500, 1200], [450, 0], [600, -1200], [900, -2400], [TIP[0], TIP[1] + 300]]);
  const OBS_WAY: XY[] = [...smooth([[480, 1000], [420, 600], climb(RN1)[0]]), ...climb(RN1).slice(1), ...smooth([climb(RN1)[3], [2480, 1500], [2650, 2800], [3250, 3650], climb(RN2, 380)[0]]), ...climb(RN2, 380, 300).slice(1), ...smooth([climb(RN2, 380, 300)[3], [OBS[0] + 30, OBS[1] + 700]])];
  const ICE_WAY: XY[] = [...smooth([[450, 0], [180, -250], climb(RS1)[0]]), ...climb(RS1, 400, 300).slice(1), ...smooth([climb(RS1, 400, 300)[3], [ORGAN[0] + 650, ORGAN[1] + 200]])];
  const BEACH_WAY: XY[] = smooth([[-200, 3300], [-1300, 2600], [-2400, 1700], [BEACH[0] + 400, BEACH[1] + 100]]);
  const TRACKS = [MAIN, OBS_WAY, ICE_WAY, BEACH_WAY];
  const roads = TRACKS.map((t, i) => band(t, i === 0 ? 440 : 380));

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const ROAD_TINT: [number, number, number] = [0.74, 0.77, 0.88];
  const ground = f.ground({ area, roads, plazas: [], water: [SEA], base: "snow", road: ROAD_TINT });

  // ---- the way out ----
  f.exit("north_icefield", W_EXIT, [-470, 4450]);

  // ---- the sea: dark cold water, floes, the shore closed ----
  const sea = sheet(SEA, -14, "Skypeaks_SeaNorth"); // (over the sea only: the hollows inland stay dry)
  {
    const near = SHORE.filter(([x, y]) => Math.abs(x) < R + 1500 && Math.abs(y) < R + 1500);
    f.blockBand(near.map(([x, y], i) => {
      const a = near[Math.max(0, i - 1)], b = near[Math.min(near.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      let n: XY = [-(b[1] - a[1]) / L, (b[0] - a[0]) / L];
      if (inPoly(SEA, x + n[0] * 150, y + n[1] * 150)) n = [-n[0], -n[1]];
      return [x - n[0] * 70, y - n[1] * 70] as XY;
    }), 240, { kind: "sea" });
  }
  for (const [x, y, h, s] of [[6200, 2300, 30, 1], [6700, -2600, 150, 1.2], [3600, -5800, 250, 0.9], [-1500, -6300, 80, 1.1], [-5600, -3300, 200, 1], [-6300, 2200, 120, 0.9]] as number[][])
    put("northcold:sea_stack", [x, y], h, { z: -14, s, solid: "none" });
  for (const [x, y, h, s] of [[5600, -1000, 20, 0.6], [4700, -4300, 300, 0.5], [-500, -5700, 140, 0.55], [-5400, -900, 60, 0.6], [-5600, 3600, 200, 0.45], [6400, 4300, 100, 0.5]] as number[][])
    put("iceberg:ice_floe", [x, y], h, { z: -20 - 25 * s, s, solid: "none" });
  const floeMat = material("Snowland_Ice"), floes: THREE.Object3D[] = [];
  for (const [x, y, r, s] of [[5000, 1800, 300, 81], [4900, -1600, 260, 82], [3600, -3900, 320, 83], [-2600, -4400, 280, 84], [-4900, -400, 300, 85], [-5000, 2800, 260, 86], [1400, -5300, 300, 87]] as number[][])
    floes.push(flatSheet(blobPoly([x, y], r, r * 0.75, s, 0.25, 12), -10, floeMat));

  // ---- placing things ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine([x, y], t) < d);
  const free = (x: number, y: number, r: number, gap = 0) =>
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const take = (x: number, y: number, r: number) => taken.push([x, y, r]);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    take(at[0], at[1], r);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] as SolidSpec[] });
  const inBox = (x: number, y: number) => Math.abs(x) < R - 150 && Math.abs(y) < R - 150;
  const ashore = (x: number, y: number) => !inPoly(SEA, x, y) && toLine([x, y], SHORE) > 350;
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120, o: (s: number) => Parameters<typeof put>[3] = () => ({}), where = (x: number, y: number) => inBox(x, y) && ashore(x, y)) => {
    for (let i = 0, made = 0; i < n * 12 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!where(x, y) || nearTrack(x, y, rad + 200) || !free(x, y, rad, 40)) continue;
      const s = 0.8 + rnd() * 0.4;
      put(ref, [x, y], rnd() * 360, { s, ...o(s) });
      take(x, y, rad * s);
      made++;
    }
  };
  for (const t of TRACKS) for (let i = 0; i < t.length; i += 2) take(t[i][0], t[i][1], 180);

  // ---- the way in through the gap: a sign, cairns, ice crystals in the gap's walls ----
  prop("snowland:trail_sign", [-850, 4750], 90, 80, ring(30, "post"));
  prop("snowland:cairn", [-50, 4950], 0, 70, ring(45));
  prop("snowland:cairn", [400, 3500], 0, 70, ring(45));
  prop("snowland:ice_crystals", [-1350, 5050], 30, 130, ring(70, "crystal"));
  prop("snowland:ice_crystals", [450, 5100], 200, 130, ring(70, "crystal"));
  // and round the arrival, close by the road
  for (const [ref, at, s] of [
    ["snowland:snow_drift", [-20, 4300], 0.7], ["common:rock_small", [-900, 4500], 1], ["skypeaks:singing_ice", [-1000, 4050], 0.6], ["snowland:dry_grass", [0, 3900], 0.9],
    ["northcold:iced_rocks", [-950, 3650], 0.5],
  ] as [string, XY, number][]) if (free(at[0], at[1], 60)) prop(ref, at, rnd() * 360, 90, { s, solid: ref.includes("ice") ? ring(80 * s + 20).solid : "none" });

  // ---- the observatory on its hill over the sea cliffs: the tower, the armillary, the tablet
  // of the stars, the astronomer's sled and stores ----
  prop("skypeaks:observatory_ruin", OBS, towards(-0.75, 0.66), 520, { s: 0.85, solid: OBSERVATORY_SOLIDS });
  prop("skypeaks:armillary", [OBS[0] - 620, OBS[1] - 500], 30, 140, ring(70, "post"));
  prop("skypeaks:star_tablet", [OBS[0] - 300, OBS[1] + 800], towards(-1, -0.3), 160, { solid: [{ kind: "box", x: 0, y: 0, w: 90, d: 230, rot: 0 }] });
  prop("iceberg:sled", [OBS[0] - 900, OBS[1] + 250], 60, 120);
  prop("snowland:supply_cache", [OBS[0] + 200, OBS[1] - 800], 110, 210, { solid: [{ kind: "box", x: -10, y: 0, w: 330, d: 140, rot: 0 }] });
  prop("snowland:expedition_flag", [OBS[0] + 450, OBS[1] + 700], 0, 120, ring(40, "post"));
  // the headland: cornices, drifts and rocks along the sea cliffs
  for (const [at, h, s] of [[[3900, 3800], 250, 0.85], [[3800, -900], 280, 0.8], [[3000, 3800], 230, 0.7], [[2900, -1300], 300, 0.7]] as [XY, number, number][])
    if (free(at[0], at[1], 200)) prop("skypeaks:snow_cornice", at, h, 260, { s, solid: "none" });
  for (const at of [[3900, 2800], [4000, -300], [2700, 3100], [3500, -1400], [2650, -600]] as XY[]) if (free(at[0], at[1], 130)) prop("northcold:iced_rocks", at, rnd() * 360, 180, { s: 0.7, ...ring(120) });

  // ---- the ice terrace: the organ of ice, singing pipes round it ----
  prop("skypeaks:ice_organ", ORGAN, towards(1, 0.4), 620, { s: 0.85, solid: ORGAN_SOLIDS });
  for (const [dx, dy] of [[-500, 950], [600, -900], [-700, -800]] as number[][]) if (free(ORGAN[0] + dx, ORGAN[1] + dy, 120)) prop("skypeaks:singing_ice", [ORGAN[0] + dx, ORGAN[1] + dy], rnd() * 360, 150, { s: 0.8, ...ring(110, "crystal") });

  // ---- the field: singing ice standing out of the snow, the fox dens among drifts and rocks ----
  scatter("skypeaks:singing_ice", [500, 0], 4000, 18, 150, (s) => ring(110 * s, "crystal"), (x, y) => inBox(x, y) && ashore(x, y) && f.h(x, y) < 200);
  scatter("snowland:ice_spire", [500, -500], 4000, 3, 200, (s) => ring(120 * s, "crystal"), (x, y) => inBox(x, y) && ashore(x, y) && f.h(x, y) < 200);
  scatter("snowland:ice_crystals", [0, 0], 4500, 8, 110, () => ring(70, "crystal"));
  scatter("snowland:snow_drift", [0, 500], 4500, 18, 230);
  scatter("skypeaks:snow_cornice", [0, 0], 4200, 5, 260, () => ({ solid: "none" }));
  scatter("northcold:iced_rocks", [0, 0], 4500, 7, 150, (s) => ring(110 * s));
  scatter("snowland:rock_cluster", [0, 0], 4500, 5, 190, (s) => ring(140 * s));
  scatter("snowland:snow_boulder", [0, 0], 4500, 6, 130, (s) => ring(100 * s));
  scatter("northcold:flattened_grass", [-500, 1500], 4000, 16, 170, () => ({ solid: "none" }));
  scatter("snowland:dry_grass", [-500, 1500], 4000, 10, 90, () => ({ solid: "none" }));
  scatter("snowland:frost_shrub", [-1500, 3000], 2500, 6, 90, () => ({ solid: [{ kind: "bush", x: 0, y: 0, r: 50 }] }));
  // the cape's tip: low rocks over the sea, a cairn for those who watch the lights
  prop("snowland:cairn", [TIP[0] - 300, TIP[1] - 300], 0, 70, ring(45));
  prop("westmount:prayer_cairn", [TIP[0] + 300, TIP[1] - 200], 20, 150, { s: 0.6, ...ring(80) });
  for (const at of [[1700, -4100], [-200, -4100], [2600, -3500], [-1200, -3800]] as XY[]) if (free(at[0], at[1], 130)) prop("northcold:iced_rocks", at, rnd() * 360, 180, { s: 0.75, ...ring(120) });
  // the beach on the south shore: shingle and ice pushed up, a fisherman's sled
  for (const [x, y, h] of [[-3900, 1700, 20], [-4000, 600, 140], [-3700, 2600, 70], [-3800, -400, 200]] as number[][])
    if (free(x, y, 140)) prop(rnd() < 0.6 ? "northcold:shingle_bank" : "northcold:iced_rocks", [x, y], h, 230, { solid: "none" });
  prop("snowland:ice_hole", [BEACH[0] - 300, BEACH[1] - 500], 30, 120, { solid: "none" });
  prop("iceberg:sled", [BEACH[0] + 100, BEACH[1] - 350], 200, 120);

  // ---- the trapper's camp: his igloo, sled, a rack of pelts, a brazier ----
  const TRAP: XY = [-1300, 3250];
  prop("iceberg:igloo", [TRAP[0] - 250, TRAP[1] + 300], towards(1, -0.5), 260, { solid: [{ kind: "igloo", x: 0, y: 0, r: 230 }] });
  prop("trunrada:drying_rack", [TRAP[0] + 250, TRAP[1] + 450], 70, 160);
  prop("iceberg:sled", [TRAP[0] + 350, TRAP[1] - 200], 20, 120);
  prop("iceberg:snowy_barrels", [TRAP[0] - 450, TRAP[1] - 150], 50, 100);
  prop("iceberg:brazier", [TRAP[0] + 100, TRAP[1] + 50], 0, 60, ring(40, "post"));
  // fox dens among drifts and rocks, old marker flags out on the field
  for (const at of [[1600, 2200], [-2600, 900], [1000, -2600], [-500, -1800], [2400, -1700], [-2700, 3700]] as XY[]) {
    if (!free(at[0], at[1], 160)) continue;
    prop("snowland:rock_cluster", at, rnd() * 360, 200, { s: 0.6, ...ring(110) });
    prop("snowland:snow_drift", [at[0] + 220, at[1] - 160], rnd() * 360, 160, { s: 0.7 });
  }
  for (const at of [[1900, 900], [-1800, 2100], [300, -2900], [-3300, -900]] as XY[]) if (free(at[0], at[1], 60)) prop("snowland:expedition_flag", at, rnd() * 360, 100, ring(35, "post"));

  // ---- a few pines, wind-bent, in the lee of the glacier wall; none out on the field ----
  const grove = (c: XY, r: number, n: number) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!inBox(x, y) || !ashore(x, y) || nearTrack(x, y, 330) || !free(x, y, 160, 180)) continue;
      put(`flora:${rnd() < 0.6 ? "SnowPineSmall" : "SnowPine"}`, [x, y], rnd() * 360, { s: 0.65 + rnd() * 0.3 });
      take(x, y, 160);
      made++;
    }
  };
  for (const [c, r, n] of [[[-3300, 4700], 700, 5], [[-2200, 4900], 500, 3], [[1700, 4900], 600, 4], [[3300, 5100], 400, 2], [[-4000, 3800], 400, 2]] as [XY, number, number][]) grove(c, r, n);

  // ---- past the edge: the glacier wall bare, a few pines at its foot ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const onTrack = (x: number, y: number) => [[0, 0], [300, 0], [-300, 0], [0, 300], [0, -300]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  f.woods(area, ["SnowPine", "SnowPineSmall"], (x, y) => inside(x, y) || onTrack(x, y) || f.h(x, y) > 200 || !ashore(x, y) || y < 4000, { count: 40, spacing: 500, tries: 2000 });
  f.woods(area, ["ice_crystals", "snow_boulder", "rock_cluster"], (x, y) => onTrack(x, y) || f.h(x, y) < 800 || inside(x, y), { count: 30, spacing: 900, tries: 1500, kit: "snowland" });

  // ---- the aurora's light: streaks of it lying over the snow, curtains of it hanging over the
  // cape's east end (its own seed, so nothing else in the field moves) ----
  const lights: THREE.Object3D[] = [];
  {
    const r3 = seeded(5101), h = (x: number, y: number) => f.h(x, y);
    const STREAKS: [XY, XY, number, number, number][] = [
      [[2000, 3600], [-2600, -500], 520, 0, 0.9], [[1400, 4200], [-3600, 2400], 420, 0.2, 1], [[1800, 300], [-1600, -3200], 560, 0.1, 0.8],
      [[600, 2000], [-3800, 600], 380, 0.4, 1], [[2600, -800], [200, -4200], 460, 0, 0.7], [[-200, 4400], [-3200, 3300], 340, 0.3, 0.9],
      [[1900, 2700], [600, -1200], 400, 0.5, 1], [[-800, 1200], [-2600, -2600], 340, 0.2, 0.9], [[3300, -300], [1200, -3000], 360, 0.6, 1],
    ];
    for (const [a, b, w, u0, u1] of STREAKS) {
      const n = 46, bend = (r3() - 0.5) * 1800, ph = r3() * 6;
      const pts: XY[] = Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1), L = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
        const off = bend * Math.sin(Math.PI * t) + 160 * Math.sin(t * 9 + ph);
        return [a[0] + (b[0] - a[0]) * t + nx * off, a[1] + (b[1] - a[1]) * t + ny * off] as XY;
      });
      lights.push(auroraRibbon(pts, w, h, { strength: 0.62, u0, u1 }));
    }
    // the curtains hang out over the sea, north, east and south of the cape
    const CURTAINS: [XY, XY, number, number][] = [[[6300, 4200], [6000, -1800], 1500, 700], [[4800, -3800], [800, -6400], 1400, 800], [[-2400, -5800], [-6200, -1800], 1300, 700]];
    for (const [a, b, tall, z0] of CURTAINS) {
      const n = 80, ph = r3() * 6;
      const pts: XY[] = Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1), L = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
        const off = 600 * Math.sin(Math.PI * t * 1.3 + ph) + 140 * Math.sin(t * 23 + ph);
        return [a[0] + (b[0] - a[0]) * t + nx * off, a[1] + (b[1] - a[1]) * t + ny * off] as XY;
      });
      lights.push(auroraCurtain(pts, tall, z0, () => 0, 0.5));
    }
  }

  // ---- monsters: the foxes over the open snow, the wisps where the light lies, on the terrace
  // and up on the headland ----
  const quiet = (x: number, y: number) => Math.hypot(x - OBS[0], y - OBS[1]) < 750 || !ashore(x, y) || x < -4500 || inPoly(WG_N, x, y) || inPoly(WG_S, x, y);
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 820, keepOut: quiet, max: 50 });

  // ---- people ----
  const npcs: NpcSpec[] = [
    { id: "aurora_apprentice", x: OBS[0] - 900, y: OBS[1] - 200, face: 250, name: "ลูมิ", title: "ศิษย์นักดาราศาสตร์", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "silver", eyes: "violet", top: "top_adventurer_navy", bottom: "bottom_adventurer_sand" },
      lines: [
        "อาจารย์ของฉันสร้างหอดูดาวนี้เพื่อนับว่าแสงเหนือขึ้นกี่คืนในหนึ่งปี วันหนึ่งท่านเดินตามแสงออกไปทางปลายแหลมแล้วไม่กลับมาอีก",
        "กล้องตัวใหญ่ยังส่องได้อยู่นะ ถ้าเช็ดน้ำแข็งออกจากเลนส์ได้เมื่อไหร่ ฉันจะเขียนบันทึกต่อจากท่าน",
        "ภูตแสงเหนือไม่ได้ร้ายนักหรอก มันแค่ไม่ชอบให้ใครเดินเหยียบแสงของมัน",
      ] },
    { id: "aurora_trapper", x: -1150, y: 2850, face: 120, name: "ตาวัลเดมาร์", title: "พรานจากไอซ์เบิร์ก", role: "talk",
      look: { gender: "male", hair: "", hairColor: "amber", eyes: "blue", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "จิ้งจอกสามหางพวกนี้หางเรืองแสงเหมือนแสงเหนือเลย หนังของมันขายที่ไอซ์เบิร์กได้ราคาดีมาก",
        "แต่จับยากชะมัด มันหลบเร็วกว่าลูกธนูข้าอีก",
        "ฟังสิ ได้ยินไหม เสียงหวีดนั่นคือแท่งน้ำแข็งร้องเพลงตอนลมพัด ทั้งทุ่งร้องพร้อมกันตอนพายุมา",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [sea, ...floes, ...lights],
    sky: "#8e9ec0",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -470, y: 4450 },
    npcs,
    labels: [
      { x: W_EXIT[0] + 250, y: W_EXIT[1] - 100, text: "ทางไปทุ่งน้ำแข็งเหนือ", kind: "gate" },
      { x: OBS[0] - 700, y: OBS[1], text: "ซากหอดูดาว" },
      { x: 3600, y: -1100, text: "หน้าผาริมทะเลเหนือ", kind: "small" },
      { x: ORGAN[0] + 700, y: ORGAN[1], text: "ดงแท่งน้ำแข็งร้องเพลง" },
      { x: 0, y: 1000, text: "ทุ่งแสงเหนือ" },
      { x: TIP[0] - 200, y: TIP[1], text: "ปลายแหลมแสงเหนือ", kind: "small" },
      { x: BEACH[0], y: BEACH[1] - 300, text: "หาดน้ำแข็งใต้", kind: "small" },
      { x: TRAP[0] - 500, y: TRAP[1], text: "ค่ายพรานไอซ์เบิร์ก", kind: "small" },
    ],
  });
}
