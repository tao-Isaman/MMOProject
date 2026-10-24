// ป่าดึกดำบรรพ์ (the primeval forest), monsters Lv 120-130: the forest no one has touched since
// before there were people, on the western sea north of the western pass. Cycads taller than a
// house stand in beds of ferns under mossy giants far bigger than the ancient forest's, moss
// hanging from their limbs in curtains; trunks lie where they fell, glowing caps round their roots,
// mist in the hollows. Feathered raptors hunt in packs through the fern glades and three-horned
// beasts graze the open ground; their tracks are pressed into the mud everywhere.
//
// The ways in meet in the middle of the forest: from the karst peaks (east) a track comes in under
// the limestone towers that stand along the east edge, from the snowy abbey cliffs (north) down
// between the rock shoulders of the north rim, the first snow lying in patches in the woods up
// there, and from the western pass (south) up through the
// cleft in the mountain wall that closes the forest's south side, the land falling to the sea
// beside it. Three heights to climb: in the north-east the ridge of the giants (4.5 m), where the
// skeleton of a long-necked giant lies turned to stone, a naturalist's camp below its ramp; in the
// south the nesting ledge (3.2 m), where a nest of great speckled eggs lies under the cycads; and
// on the coast in the north-west the falls head (6.5 m), a headland whose cliffs drop into the
// sea: a stream runs across its top and pours off its south face into the cove below, where a
// brook from a spring in the forest comes out on a beach. The sea runs along the whole west.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: north -> snow_abbey, east -> karst_peaks, south -> west_pass

import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits, seeded } from "./town";
import { KIT as OLDGROWTH, FALLS_H, seaSheet } from "./kits/oldgrowth";
import { KIT as WESTMOUNT, smooth, band, blob, inPoly, toLine, dense, towards, rampOff, beyond, sheet } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import { KIT as JUNGLE } from "./kits/jungle";
import { KIT as PLAINS } from "./kits/plains";
import { KIT as WESTHILLS } from "./kits/westhills";
import { blobPoly } from "./kits/snowland";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(OLDGROWTH, WESTMOUNT, JUNGLE, PLAINS, WESTHILLS);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the sea: the shore from the north edge down under the falls head, round the cove, and on
// south along a beach to the south-west corner, where it meets the western pass's shore ----
const SHORE: XY[] = smooth([
  [A + 400, 5350], [7000, 5300], [5800, 5250], [4900, 5150], [4400, 5380], [3500, 5520], [2500, 5560], [1700, 5420],
  [1240, 5000], [1190, 4500], [1150, 4150], [820, 3960], [420, 4000], [40, 4180], [-260, 4560], [-480, 5000],
  [-900, 5420], [-1700, 5640], [-2600, 5700], [-3600, 5660], [-4600, 5700], [-5600, 5720], [-6676, 5700], [-A - 400, 5720],
], 3);
const SEA: XY[] = [...SHORE, [-A - 400, A + 400], [A + 400, A + 400]];

// ---- the levels ----
// H: the falls head on the coast (its top just under the falls' lip); G: the ridge of the giants;
// N: the nesting ledge. Past the edges: the mountain wall along the south (two steps) with the
// cleft the way south runs up, the rib between the cleft and the sea; the north rim either side of
// the pass to the abbey cliffs; limestone towers past the east edge, like the karst country's.
const H_TOP = FALLS_H - 14;
const H: XY[] = [[1300, 3300], [2600, 3150], [4400, 3300], [4700, 4100], [4500, 4700], [4300, 5150], [3500, 5300], [2500, 5350], [1700, 5200], [1290, 4800], [1270, 4100]];
const RH = { top: [2900, 3200] as XY, bottom: [2900, 1250] as XY, width: 460 };
const G: XY[] = [[1700, -1500], [2800, -1300], [4100, -1500], [4500, -2400], [4300, -3600], [3600, -4300], [2400, -4300], [1600, -3600], [1500, -2500]];
const RG = rampOff([1600, -3600], [1500, -2500], [3000, -2800], 1350, 440);
const N: XY[] = [[-1500, -2600], [-1300, -1500], [-1500, -300], [-2400, 200], [-3500, -100], [-3900, -1200], [-3600, -2400], [-2600, -2900]];
const RN = rampOff([-1300, -1500], [-1500, -300], [-2600, -1200], 960, 440);
const S_WALL: XY[] = [[-4850, -A], [-4950, -3000], [-4800, -1000], [-5000, 1000], [-4900, 2800], [-5050, 4000], [-5300, 4330], [-A, 4400], [-A, -A]];
const S_WALL2: XY[] = [[-6300, -A], [-6400, -2000], [-6200, 1000], [-6500, 3700], [-A, 3800], [-A, -A]];
const S_RIB: XY[] = [[-5150, 5230], [-6000, 5200], [-A, 5250], [-A, 6200], [-6300, 6100], [-5500, 5900]];
const N_RIM_W: XY[] = [[5900, 900], [6300, 2500], [5900, 4200], [6200, 5150], [A, 5250], [A, 900]];
const N_RIM_E: XY[] = [[5900, -900], [A, -900], [A, -A], [6300, -A], [6100, -4500], [6400, -2200]];
const TOWERS: [XY, number, number][] = [
  [[-3900, -7300], 1000, 2200], [[-1100, -7000], 900, 2600], [[2100, -7300], 1100, 2400], [[5000, -7100], 1000, 2300],
  [[700, -6300], 550, 1800], [[-2500, -6250], 520, 1700], [[3700, -6200], 500, 1600], [[7400, -6800], 1100, 2500],
];

// ---- the brook: out of a spring pool in the forest, down to the cove ----
const SPRING: XY = [1000, 900];
const SPRING_POOL = blob(SPRING, 560, 460, 3, 22);
const BROOK: XY[] = smooth([[880, 1300], [740, 2000], [620, 2800], [640, 3500], [760, 3900], [800, 4250]], 5);
const BW = 380;

// ---- the places ----
const SKELETON: XY = [3050, -2850];
const NEST: XY = [-2650, -1300];
const FALLS: XY = [1290 - 160, 4520]; // the item's foot in the cove, its lip on the falls head's edge
const CAMP: XY = [800, -3700];
const COVE: XY = [-300, 3700];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(514, {
    hills: [
      { x: -1200, y: 2200, r: 1100, h: 90 }, { x: 2400, y: 600, r: 900, h: -60 }, { x: -3400, y: 1600, r: 900, h: 80 },
      { x: 3600, y: 1800, r: 800, h: 70 }, { x: -1800, y: -4200, r: 900, h: 70 }, { x: 1600, y: -5200, r: 900, h: 80 },
      { x: -3700, y: 3900, r: 800, h: -50 }, { x: 4600, y: -1600, r: 700, h: 60 },
    ],
    plateaus: [
      { poly: dense(H), h: H_TOP, ramps: [RH] },
      { poly: dense(G), h: 450, ramps: [RG] },
      { poly: dense(N), h: 320, ramps: [RN] },
      { poly: dense(S_WALL, 700), h: 1200 },
      { poly: dense(S_WALL2, 900), h: 1900 },
      { poly: dense(S_RIB, 600), h: 900 },
      { poly: dense(N_RIM_W, 700), h: 1400 },
      { poly: dense(N_RIM_E, 700), h: 1400 },
      ...TOWERS.map(([c, r, h], i) => ({ poly: dense(blob(c, r, r * (0.8 + (i % 3) * 0.1), 31 + i, 18), 450), h })),
    ],
    rock: "Oldgrowth_CliffMoss",
    keep: [[1290, 4520]], // the falls pour over the edge just where it is drawn
  });
  const { put, rnd } = f;

  // ---- the tracks: the three ways in to the middle of the forest, branches up the three heights
  // and down to the cove ----
  const E_EXIT: XY = [700, -5150], N_EXIT: XY = [5150, 0], S_EXIT: XY = [-5150, 4800];
  const J: XY = [300, -600]; // where the ways meet
  const EAST_WAY: XY[] = smooth([[700, -7600], E_EXIT, [600, -4300], [150, -3600], [-150, -2800], [-150, -1700], J]);
  const NORTH_WAY: XY[] = smooth([J, [1100, -800], [2050, -700], [3000, -380], [4000, -150], N_EXIT, [7600, 0]]);
  const SOUTH_WAY: XY[] = smooth([J, [-500, 200], [-1300, 900], [-2300, 1700], [-3300, 2700], [-4200, 3900], [-4700, 4600], S_EXIT, [-7600, 4800]]);
  const G_WAY: XY[] = [...smooth([[-150, -2900], beyond(RG.top, RG.bottom, 300)]), RG.bottom, RG.top, ...smooth([beyond(RG.bottom, RG.top, 450), [2500, -2700], [SKELETON[0] - 600, SKELETON[1] + 250]])];
  const H_WAY: XY[] = [...smooth([[3000, -380], [2950, 400], beyond(RH.top, RH.bottom, 380)]), RH.bottom, RH.top, ...smooth([beyond(RH.bottom, RH.top, 400), [2700, 3900], [2300, 4250], [1750, 4300]])];
  const N_WAY: XY[] = [...smooth([[-600, 100], [-300, -500], beyond(RN.top, RN.bottom, 300)]), RN.bottom, RN.top, ...smooth([beyond(RN.bottom, RN.top, 350), [NEST[0] + 500, NEST[1] + 100]])];
  const COVE_WAY: XY[] = smooth([[-1300, 900], [-900, 1800], [-600, 2700], [-450, 3300], COVE]);
  const SPRING_WAY: XY[] = smooth([[-500, 200], [100, 400], [SPRING[0] - 650, SPRING[1] - 100]]);
  const TRACKS = [EAST_WAY, NORTH_WAY, SOUTH_WAY, G_WAY, H_WAY, N_WAY, COVE_WAY, SPRING_WAY];
  const roads = TRACKS.map((t, i) => band(t, i < 3 ? 430 : 370));

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const brookBand = band(BROOK, BW);
  const ground = f.ground({ area, roads, plazas: [], water: [SEA, brookBand, SPRING_POOL], base: "jungle", road: [0.66, 0.56, 0.44], tint: "#c9d6bf" });
  // the mossy floor: a second ground a hair over the jungle's, cut away in patches where the
  // fern-floor shows through (their own seed, so nothing else moves); toward the mountain wall in
  // the south it gives way to the western pass's dry ground, and the pass's own ground runs in up
  // the cleft
  const mossy: XY[][] = [], prnd = seeded(5141);
  for (let x = -A; x < A; x += 700)
    for (let y = -A; y < A; y += 700) if (prnd() < 0.45) mossy.push(blobPoly([x + prnd() * 700, y + prnd() * 700], 260 + prnd() * 220, 200 + prnd() * 160, 5142 + mossy.length, 0.25, 14));
  const moss = f.ground({ area, roads, plazas: [], water: [SEA, brookBand, SPRING_POOL, ...mossy], base: "moss", road: [0.66, 0.56, 0.44], tint: "#bcc9a6" });
  moss.mesh.position.y += 3;
  moss.mesh.renderOrder = 1;
  const rag = (t: number) => 380 * Math.sin(t / 620 + 1.3) + 220 * Math.sin(t / 260 + 0.4) + 110 * Math.sin(t / 105 + 2.2);
  const dryLine: XY[] = [];
  for (let y = -A - 400; y <= A + 400; y += 120) dryLine.push([-3600 + rag(y), y]);
  const DRY_OFF: XY[] = [...dryLine, [A + 400, A + 400], [A + 400, -A - 400]];
  const dryPatches: XY[][] = [];
  for (let i = 0; i < 30; i++) {
    const u = (i + 0.5) / 30, r = 150 + 240 * (1 - u) * Math.abs(Math.sin(i * 2.3));
    dryPatches.push(blob([-3400 - u * 1700, -R + ((u * 7919) % 1) * 2 * R], r, r * 0.8, 70 + i, 12));
  }
  const dry = f.ground({ area: { x0: -A, x1: -1600, y0: -A, y1: A }, roads, plazas: [], water: [DRY_OFF, SEA, ...dryPatches], base: "steppe", road: [0.66, 0.56, 0.44], tint: "#d8dac6" });
  dry.mesh.position.y += 5;
  dry.mesh.renderOrder = 2;
  // snow lying on the high woods past the north edge, in patches thinning southward, where the
  // snowy heights of the abbey begin (its own seed, so nothing else in the field moves)
  const snowLine: XY[] = [];
  for (let y = A + 400; y >= -A - 400; y -= 120) snowLine.push([5350 + rag(y + 2000) * 0.9, y]);
  const SNOW_OFF: XY[] = [...snowLine, [-A - 400, -A - 400], [-A - 400, A + 400]];
  const srnd = seeded(5151), melt: XY[][] = [];
  for (let x = 4900; x < A; x += 420)
    for (let y = -A; y < A; y += 420) {
      const k = Math.min(1, (x - 4900) / 2600);
      if (srnd() < 0.62 - 0.5 * k) melt.push(blobPoly([x + srnd() * 420, y + srnd() * 420], 150 + srnd() * 140, 120 + srnd() * 110, 5160 + melt.length, 0.25, 14));
    }
  const snow = f.ground({ area: { x0: 4000, x1: A, y0: -A, y1: A }, roads, plazas: [], water: [SNOW_OFF, SEA, ...melt], base: "snow", road: [0.66, 0.56, 0.44], tint: "#eef1f2" });
  snow.mesh.position.y += 7;
  snow.mesh.renderOrder = 3;

  // ---- the sea, the brook and its spring ----
  const sea = seaSheet(SHORE, [[-A - 400, A + 400], [A + 400, A + 400]], 250, -14, "Oldgrowth_Sea"); // (over the sea only, so the hollows inland stay dry)
  // (the brook's own water only as far as the cove, so it never shows over the sea's)
  const BROOK_IN = BROOK.slice(0, BROOK.findIndex(([x, y]) => inPoly(SEA, x, y)) + 1);
  const brook = sheet(band(BROOK_IN, BW + 100), -14, "Oldgrowth_Stream");
  const brookBed = sheet(band(BROOK_IN, BW + 160), -60, "Oldgrowth_RockDark");
  const pool = sheet(blob(SPRING, 600, 500, 3, 22), -14, "Oldgrowth_Stream");
  const poolBed = sheet(blob(SPRING, 640, 540, 3, 22), -60, "Oldgrowth_RockDark");
  // the shore closed: along the beaches and under the cliffs (the stretch of it within reach)
  const near = SHORE.filter(([x, y]) => Math.abs(x) < R + 1200 && Math.abs(y) < R + 1200);
  f.blockBand(near.map(([x, y]) => [x, y + 180] as XY), 360, { kind: "sea", step: 220 });
  f.blockBand(BROOK.filter(([x]) => x < 4300), BW - 40, { step: 200 });
  f.blockBand([...SPRING_POOL, SPRING_POOL[0]], 160, { step: 200 });
  f.blockDisc(SPRING, 380);

  // ---- ways out ----
  f.exit("karst_peaks", E_EXIT, [650, -4400]);
  f.exit("snow_abbey", N_EXIT, [4400, -140]);
  f.exit("west_pass", S_EXIT, [-4500, 4380]);

  // ---- placing things ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine([x, y], t) < d);
  const wet = (x: number, y: number, d: number) => inPoly(SEA, x, y) || toLine([x, y], SHORE) < d + 150 || toLine([x, y], BROOK) < BW / 2 + d || Math.hypot(x - SPRING[0], y - SPRING[1]) < 600 + d;
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
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120, o: (s: number) => Parameters<typeof put>[3] = () => ({}), where = inBox, gap = 40) => {
    for (let i = 0, made = 0; i < n * 12 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!where(x, y) || nearTrack(x, y, rad + 230) || !free(x, y, rad, gap)) continue;
      const s = 0.8 + rnd() * 0.4;
      put(ref, [x, y], rnd() * 360, { s, ...o(s) });
      take(x, y, rad * s);
      made++;
    }
  };
  for (const t of TRACKS) for (let i = 0; i < t.length; i += 2) take(t[i][0], t[i][1], 200);

  // ---- the falls head: the falls pouring into the cove, a cairn and a lookout over the sea ----
  put("oldgrowth:sea_falls", FALLS, 0, { z: -14, solid: "none" });
  take(FALLS[0] + 500, FALLS[1], 520);
  for (const at of [[2500, 4900], [3700, 4700], [3300, 3700]] as XY[]) if (free(at[0], at[1], 120)) prop("westmount:prayer_cairn", at, rnd() * 360, 140, { s: 0.55, ...ring(70) });
  prop("oldgrowth:moss_boulders", [4000, 4200], 30, 260, { s: 0.7, ...ring(160) });
  prop("oldgrowth:cycad", [2200, 3700], 40, 160, ring(55, "tree"));
  prop("oldgrowth:cycad", [3900, 3600], 200, 160, { s: 0.8, ...ring(50, "tree") });
  prop("oldgrowth:fern_bed", [3100, 4400], 60, 200, { solid: "none" });
  prop("oldgrowth:fern_bed", [4300, 4800], 10, 200, { solid: "none", s: 0.8 });
  // the cove: rocks at the falls' foot, the brook's mouth on the beach, a sea stack off it
  put("jungle:sea_stack", [600, 5200], 30, { s: 0.8, z: -12, solid: "none" });
  put("jungle:sea_stack", [2200, 6300], 140, { s: 1.1, z: -12, solid: "none" });
  put("jungle:sea_stack", [-2600, 6400], 250, { s: 0.9, z: -12, solid: "none" });
  put("jungle:sea_stack", [4700, 6200], 80, { s: 1, z: -12, solid: "none" });
  for (const [x, y, h, s] of [[-300, 4300, 20, 0.8], [-150, 4900, 140, 0.7], [-1600, 5450, 60, 0.9], [-3600, 5500, 200, 0.8], [-4800, 5550, 300, 0.9]] as [number, number, number, number][])
    put("westhills:storm_rocks", [x, y], h, { s, z: -14, solid: "none" });
  for (const [x, y] of [[-2400, 5350], [-3200, 5450], [-4300, 5400]] as XY[]) if (free(x, y, 120)) prop("jungle:wreck_debris", [x, y], rnd() * 360, 200, { s: 0.6, solid: "none" });

  // ---- the ridge of the giants: the stone skeleton, the camp below its ramp ----
  prop("oldgrowth:stone_skeleton", SKELETON, 18, 1100, {
    solid: [
      { kind: "rock", x: 0, y: 0, w: 640, d: 1500, rot: 0 }, { kind: "rock", x: -200, y: -980, r: 120 },
      { kind: "rock", x: 40, y: 760, r: 110 },
    ],
  });
  prop("oldgrowth:moss_giant", [3900, -2300], 140, 900, { s: 0.75, solid: [{ kind: "tree", x: 0, y: 0, r: 280 }] });
  prop("oldgrowth:cycad", [2200, -3900], 80, 160, ring(55, "tree"));
  prop("oldgrowth:cycad", [3800, -3700], 300, 160, { s: 0.85, ...ring(50, "tree") });
  prop("oldgrowth:fern_bed", [2000, -1800], 30, 200, { solid: "none" });
  prop("jungle:explorer_camp", CAMP, -60, 450, { solid: [{ kind: "camp", x: 150, y: 140, w: 320, d: 280, rot: 0 }, { kind: "camp", x: -180, y: -160, w: 270, d: 270, rot: 0 }, { kind: "camp", x: -200, y: 170, r: 60 }] });

  // ---- the nesting ledge: the nest under the cycads, shells, tracks going up to it ----
  prop("oldgrowth:egg_nest", NEST, 20, 420, ring(230));
  for (const [x, y, h, s] of [[-2000, -2300, 30, 1], [-3200, -600, 200, 0.85], [-3300, -2100, 120, 0.9]] as [number, number, number, number][]) prop("oldgrowth:cycad", [x, y], h, 160, { s, ...ring(55 * s, "tree") });
  prop("oldgrowth:dino_tracks", [-2350, -2050], 110, 300, { solid: "none", s: 0.75 });
  prop("oldgrowth:fern_bed", [-3500, -1500], 70, 200, { solid: "none" });

  // ---- the giants of the forest floor ----
  const GIANTS: [XY, number, number][] = [[[-1500, -4100], 30, 1], [[1900, 2300], 200, 0.9], [[-2300, 4400], 120, 0.9], [[3900, 1600], 300, 0.85], [[-3800, -3500], 80, 0.85], [[3200, -5000], 250, 0.85]];
  for (const [at, h, s] of GIANTS) if (free(at[0], at[1], 300)) prop("oldgrowth:moss_giant", at, h, 1000 * s, { s, solid: [{ kind: "tree", x: 0, y: 0, r: 300 }] });
  for (const [at, h, s] of [[[-1600, -1800], 60, 0.8], [[4500, 600], 200, 0.8], [[2300, -5000], 140, 0.75]] as [XY, number, number][]) if (free(at[0], at[1], 250)) prop("westmount:elder_tree", at, h, 700 * s, { s, solid: [{ kind: "tree", x: 0, y: 0, r: 200 }] });
  // fallen giants and stumps, glowing caps in the shade
  for (const [at, h, s] of [[[-2200, 600], 70, 0.85], [[3200, -800], 160, 0.75], [[-600, 1500], 20, 0.7]] as [XY, number, number][]) if (free(at[0], at[1], 300)) prop("oldgrowth:fallen_moss_giant", at, h, 850 * s, { s, solid: [{ kind: "log", x: 0, y: 0, w: 260, d: 1450, rot: 0 }] });
  for (const [at, h] of [[[-3600, 1000], 40], [[1700, -2800], 100], [[4200, 2800], 200]] as [XY, number][]) if (free(at[0], at[1], 250)) prop("oldgrowth:giant_stump", at, h, 320, ring(190, "log"));
  scatter("westmount:glow_mushrooms", [0, 0], 5200, 9, 150, () => ({ solid: "none" }));

  // ---- the ways out: signs, cairns, the cleft's foot ----
  prop("jungle:trail_sign", [1100, -4700], towards(1, 0.4), 90, ring(20, "post"));
  prop("jungle:trail_sign", [4750, 450], towards(-1, 0.3), 90, ring(20, "post"));
  prop("jungle:trail_sign", [-4700, 4250], towards(1, -0.6), 90, ring(20, "post"));
  prop("jungle:trail_sign", [700, -300], towards(-1, 1), 90, ring(20, "post"));
  prop("westmount:prayer_cairn", [-4850, 5200], 0, 140, { s: 0.5, ...ring(60) });
  for (const [x, y, s] of [[-4900, 3900, 0.8], [-4600, 5150, 0.7], [5000, -900, 0.75], [5100, 850, 0.8]] as [number, number, number][]) if (free(x, y, 200)) prop("westmount:rockfall", [x, y], rnd() * 360, 360 * s, { s, ...ring(260 * s) });

  // ---- the tracks of the giants across the forest, the mist in the hollows ----
  for (const [at, h, s] of [[[-1400, -200], 75, 0.85], [[1900, 700], 160, 0.8], [[-3700, 2400], 40, 0.8], [[1300, -2000], 20, 0.75]] as [XY, number, number][])
    if (free(at[0], at[1], 120)) prop("oldgrowth:dino_tracks", at, h, 250, { s, solid: "none" });
  const MIST: [XY, number, number][] = [
    [[2400, 600], 20, 1], [[-3700, 3900], 100, 1], [[-1800, -4200], 40, 0.8], [[4400, -800], 0, 0.7], [[-200, 2600], 70, 0.8],
    [[2900, 2400], 120, 0.7], [[-4000, -2600], 60, 0.8], [[1200, 4000], 0, 0.9], [[-2600, 1800], 20, 0.7],
  ];
  for (const [at, h, s] of MIST) put("westmount:mist_bank", at, h, { solid: "none", s });

  // ---- the karst country coming in along the east edge: limestone spires and bamboo ----
  for (const [at, h, s] of [[[-3600, -5000], 30, 0.7], [[2900, -5100], 80, 0.6], [[4600, -4500], 200, 0.75], [[-1500, -5100], 150, 0.55], [[-4200, -4100], 10, 0.5]] as [XY, number, number][])
    if (free(at[0], at[1], 300 * s)) prop("westmount:karst_spire", at, h, 330 * s, { s, ...ring(280 * s) });
  for (const [c, r, n] of [[[-2700, -4700], 600, 6], [[1800, -4500], 500, 5], [[4100, -5000], 500, 4], [[-200, -4800], 400, 3]] as [XY, number, number][]) scatter("flora:Bamboo", c, r, n, 120, () => ({}), inBox, 60);

  // ---- the forest: cycads and fern beds, giant ferns, rocks, broadleaves; thicker toward the
  // edges, pines coming in toward the north rim, dry pines toward the mountain wall ----
  scatter("oldgrowth:cycad", [0, 0], 5300, 22, 160, (s) => ring(55 * s, "tree"));
  scatter("oldgrowth:fern_bed", [0, 0], 5300, 30, 200, () => ({ solid: "none" }));
  scatter("oldgrowth:moss_boulders", [0, 0], 5200, 9, 230, (s) => ring(170 * s));
  scatter("oldgrowth:moss_slabs", [0, 0], 5200, 8, 200, () => ({ solid: "none" }));
  scatter("jungle:tree_fern", [0, 0], 5300, 26, 110, () => ({ solid: [{ kind: "post", x: 0, y: 0, r: 22 }] }));
  scatter("jungle:giant_fern", [0, 0], 5300, 50, 90, () => ({ solid: "none" }));
  scatter("plains:fern_clump", [0, 0], 5300, 60, 70, () => ({ solid: "none" }));
  scatter("flora:JungleTree", [0, 0], 5200, 16, 380, () => ({}));
  scatter("jungle:vine_tree", [0, 0], 5200, 7, 400, () => ({ solid: [{ kind: "tree", x: 0, y: 0, r: 50 }] }));
  scatter("flora:BigOak", [0, 0], 5200, 7, 400, () => ({}));
  scatter("flora:Pine", [4600, 0], 1000, 9, 160, () => ({}));
  scatter("flora:PineSmall", [4700, 2000], 900, 6, 140, () => ({}));
  scatter("flora:Pine", [-4300, -800], 1000, 8, 160, () => ({}));
  scatter("flora:PineSmall", [-4300, 2200], 800, 5, 140, () => ({}));
  scatter("jungle:boulder_mossy", [0, 0], 5200, 8, 140, (s) => ring(110 * s));
  // the edges thick with growth (within the box: their trunks solid)
  for (let i = 0; i < 900; i++) {
    const x = (rnd() - 0.5) * 2 * (R - 150), y = (rnd() - 0.5) * 2 * (R - 150), edge = Math.min(R - Math.abs(x), R - Math.abs(y));
    if (rnd() > (edge < 700 ? 0.9 : edge < 1300 ? 0.4 : 0.06) || nearTrack(x, y, 420) || !free(x, y, 180, 120)) continue;
    const k = rnd(), kind = x > 3800 ? (k < 0.5 ? "flora:Pine" : k < 0.75 ? "flora:BigOak" : "oldgrowth:cycad") : x < -3800 ? (k < 0.4 ? "flora:Pine" : k < 0.7 ? "flora:RoundTree" : "flora:JungleTree") : k < 0.45 ? "flora:JungleTree" : k < 0.65 ? "oldgrowth:cycad" : k < 0.85 ? "flora:BigOak" : "jungle:vine_tree";
    prop(kind, [x, y], rnd() * 360, 200, { s: 0.8 + rnd() * 0.35, solid: kind === "oldgrowth:cycad" ? [{ kind: "tree", x: 0, y: 0, r: 55 }] : kind === "jungle:vine_tree" ? [{ kind: "tree", x: 0, y: 0, r: 50 }] : "auto" });
  }

  // ---- past the edge: the forest goes on north and east, pines on the mountain wall and the rim,
  // nothing on the sea ----
  const onTrack = (x: number, y: number) => [[0, 0], [300, 0], [-300, 0], [0, 300], [0, -300]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const inside = (x: number, y: number) => Math.abs(x) < R + 300 && Math.abs(y) < R + 300;
  const atSea = (x: number, y: number) => inPoly(SEA, x, y) || toLine([x, y], SHORE) < 250;
  f.woods(area, ["JungleTree", "BigOak", "JungleTree", "RoundTree", "JungleTree", "Bamboo"], (x, y) => inside(x, y) || onTrack(x, y) || atSea(x, y) || f.h(x, y) > 100 || x < -4800, { count: 420, spacing: 400, tries: 8000 });
  f.woods(area, ["cycad", "cycad", "fern_bed"], (x, y) => inside(x, y) || onTrack(x, y) || atSea(x, y) || f.h(x, y) > 100 || x < -4800 || Math.abs(x) > 7000 || Math.abs(y) > 7000, { count: 50, spacing: 800, tries: 3000, kit: "oldgrowth" });
  f.woods(area, ["moss_giant"], (x, y) => inside(x, y) || onTrack(x, y) || atSea(x, y) || f.h(x, y) > 100 || x < -4800 || Math.abs(x) > 6900 || Math.abs(y) > 6900 || (Math.abs(x) < R + 900 && Math.abs(y) < R + 900), { count: 9, spacing: 2200, tries: 2000, kit: "oldgrowth" });
  f.woods(area, ["Pine", "PineSmall", "Pine", "RoundTree"], (x, y) => (inside(x, y) && f.h(x, y) < 600) || onTrack(x, y) || atSea(x, y) || (f.h(x, y) < 600 && x > -4800), { count: 300, spacing: 480, tries: 6000 });
  f.woods(area, ["wind_pine"], (x, y) => (inside(x, y) && f.h(x, y) < 600) || onTrack(x, y) || atSea(x, y) || f.h(x, y) < 800, { count: 80, spacing: 700, tries: 3000, kit: "westmount" });
  f.woods(area, ["Bush", "SmallTree", "JungleBush"], (x, y) => onTrack(x, y) || atSea(x, y) || f.h(x, y) < 1300 || (inside(x, y) && f.h(x, y) < 600), { count: 120, spacing: 380, tries: 4000 });

  // ---- monsters: the glades of the forest floor, the ridge, the ledge, the falls head ----
  const quiet = (x: number, y: number) => Math.hypot(x - CAMP[0], y - CAMP[1]) < 800 || Math.hypot(x - COVE[0], y - COVE[1]) < 500;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 860, max: 50, keepOut: quiet });

  const npcs: NpcSpec[] = [
    { id: "primeval_naturalist", x: CAMP[0] + 350, y: CAMP[1] + 250, face: 150, name: "อาจารย์ภูผา", title: "นักธรรมชาติวิทยาแห่งราชบัณฑิต", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_adventurer_ochre", bottom: "bottom_adventurer_cocoa" },
      lines: [
        "สัตว์ในป่านี้ไม่มีในตำราเล่มไหนเลย ข้าวาดรูปมาสามเล่มแล้วยังไม่หมด",
        "บนสันเขานั่นมีโครงกระดูกยักษ์คอยาวกลายเป็นหินทั้งตัว ข้าวัดได้สิบเก้าเมตรเชียวนะ",
        "แรปเตอร์ขนนกล่าเป็นฝูง ถ้าเห็นตัวหนึ่ง อีกสองตัวอยู่ในดงเฟิร์นข้าง ๆ แน่",
        "ทางตะวันออกไปภูผาหินปูน ทางเหนือขึ้นผาอารามหิมะ ทางใต้ลอดซอกเขาไปช่องเขาตะวันตก",
      ] },
    { id: "primeval_fisher", x: COVE[0] - 200, y: COVE[1] - 300, face: 20, name: "แม่ทะเล", title: "ชาวเลผู้เก็บไข่", role: "talk",
      look: { gender: "female", hair: "twintail", hairColor: "teal", eyes: "teal", top: "top_adventurer_teal", bottom: "bottom_adventurer_sand" },
      lines: [
        "น้ำตกนั่นไหลลงอ่าวมาทั้งปีไม่เคยแห้ง ปลาชุมที่สุดก็ตรงฟองน้ำนั่นแหละ",
        "บนลานหินทางใต้มีรังไข่ใบเท่าตัวคน อย่าแตะนะ แม่ของมันอยู่ไม่ไกลหรอก",
        "รอยเท้าใหญ่ ๆ ในโคลนนั่นของไดโนสามเขา มันเดินลงมากินน้ำที่ลำธารทุกเย็น",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [moss.mesh, dry.mesh, snow.mesh, sea, brookBed, brook, poolBed, pool],
    sky: "#9db7a8",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && moss.kind(x, y) !== 0 && f.h(x, y) < 120 && !wet(x, y, 200), density: 0.08 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 650, y: -4300 },
    npcs,
    labels: [
      { x: E_EXIT[0] - 250, y: E_EXIT[1], text: "ทางไปภูผาหินปูน", kind: "gate" },
      { x: N_EXIT[0] - 200, y: N_EXIT[1], text: "ทางไปผาอารามหิมะ", kind: "gate" },
      { x: S_EXIT[0] + 250, y: S_EXIT[1], text: "ทางไปช่องเขาตะวันตก", kind: "gate" },
      { x: SKELETON[0] + 300, y: SKELETON[1] + 600, text: "โครงกระดูกยักษ์กลายเป็นหิน" },
      { x: 3000, y: -1800, text: "สันเขาสัตว์ยักษ์", kind: "small" },
      { x: NEST[0] - 500, y: NEST[1], text: "ลานรังไข่ยักษ์" },
      { x: 2600, y: 4300, text: "ผาน้ำตกลงทะเล" },
      { x: COVE[0] - 300, y: COVE[1] + 300, text: "อ่าวน้ำตก", kind: "small" },
      { x: SPRING[0] - 700, y: SPRING[1] - 200, text: "ตาน้ำกลางป่า", kind: "small" },
      { x: CAMP[0] - 300, y: CAMP[1], text: "ค่ายนักธรรมชาติวิทยา", kind: "small" },
      { x: -1400, y: -200, text: "รอยเท้ายักษ์", kind: "small" },
      { x: -2000, y: 2600, text: "ป่าปรงและเฟิร์นยักษ์" },
      { x: -4600, y: 4600, text: "ซอกเขาทางใต้", kind: "small" },
    ],
  });
}
