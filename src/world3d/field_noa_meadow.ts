// ทุ่งหญ้าโนอา (the Noa downs), monsters Lv 30-40: wide windy grassland north of the west woods
// (north-east of Noa, which is reached through the woods). The road up from the woods
// comes in at the middle of the south edge and climbs gently north-east over rolling pasture cut
// up by old dry-stone walls to the mouth of a valley between two raised downs. Off it a lane loops
// south through the sheep pastures: the shepherd's hut, two round sheepfolds, the pond, whose
// overflow runs south as a brook out of the field into the woods (the head of their stream). The
// north-west down carries the old stone windmill, its sails turning over the whole field; the far
// down in the east is the reward for the climb: a wide high pasture with its own walls and flocks,
// and on its higher step the ruined watchtower that once guarded Noa's border, old relics round
// its foot and the best view of the downs. Higher downs close the valley's end and the east; from
// the pasture lane's far corner a lane runs east past the second fold, over the shoulder of the
// hill and through a gap in those downs, out of the middle of the east side to the royal flower
// fields.
//
// The field lies between the snow and the green. North of it the tangled hills stand under snow:
// over the last fifth of the field towards the north edge frost and snow patches thicken on the
// downs until the snow lies whole past the edge, snow pines among the oaks. West of it is the
// frozen river's country: the windmill down runs on west as the river's snowy north bank, and the
// river itself comes in under it and dies in a frozen mere at the west edge, reeds frozen into its
// shore; south of the mere the grass goes pale and dry towards the west edge as on the river's
// south bank, snow lying in patches, pines and birches past it. East and south it is grassland.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: south -> west_woods (e 0.50, the woods' north way out), east -> flower_fields (n 0.47,
//   the flower fields' west way out)

import * as THREE from "three";
import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits, seeded } from "./town";
import { defineMaterial, material } from "./textures";
import { KIT as WESTFARM, smooth, band, dense, blob, inPoly, toLine, towards, along, wallRun } from "./kits/westfarm";
import type { XY } from "./kits/westfarm";
import { KIT as PLAINS } from "./kits/plains";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { KIT as STEPPE } from "./kits/steppe";
import { KIT as FRONTIER } from "./kits/frontier";
import { KIT as SNOW, blobPoly, flatSheet } from "./kits/snowland";
import { KIT as NORTHCOLD } from "./kits/northcold";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(WESTFARM, PLAINS, TRUNRADA, STEPPE, FRONTIER, SNOW, NORTHCOLD);

// the frozen river's open water, as in its own field
defineMaterial("Northcold_RiverWater", { tint: "#1d4054", rough: 0.05, opacity: 0.95 });

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the levels ----
// P1: the windmill down (280) in the north-west, running on west past the edge as the frozen
// river's north bank (its cliff meets the west edge where the river's does); P2: the far down
// (300) over the whole north-east, its higher step P3 (580) with the watchtower; past the edge,
// higher downs close the valley between them (MV) and the south-east (ME).
const P1: XY[] = [[1700, 2700], [2500, 1500], [3600, 1150], [5000, 1500], [6300, 1300], [A, 1600], [A, A], [1640, A], [1600, 6676], [1700, 6150], [1560, 5600], [1720, 4950], [1500, 4200]];
const P2: XY[] = [[700, -900], [1900, -900], [3500, -800], [5600, -1000], [A, -1300], [A, -A], [300, -A], [400, -5600], [700, -4000], [1000, -2400]];
const P3: XY[] = [[2400, -2400], [3900, -2000], [4800, -2900], [4600, -4400], [3300, -4700], [2300, -3700]];
const MV: XY[] = [[6100, -1700], [6500, 0], [6200, 1900], [A, 2100], [A, -1900]];
// (v0.4: ME stops short of the gap the lane east to the flower fields goes through)
const ME: XY[] = [[-A, -6300], [-4500, -6100], [-1700, -6500], [-1000, -6700], [-1050, -A], [-A, -A]];
const R1 = { top: [2100, 2100] as XY, bottom: [1351, 1600] as XY, width: 460 };
const R2 = { top: [1300, -900] as XY, bottom: [1300, 0] as XY, width: 460 };
const R3 = { top: [2350, -3050] as XY, bottom: [1453, -2981] as XY, width: 440 };

// ---- the places ----
const WAY: XY = [-5150, 0], ARRIVE: XY = [-4430, 200];
const JUNCTION: XY = [900, 500];
const MILL: XY = [3300, 2950];
const TOWER: XY = [3700, -3300];
const HUT: XY = [-3100, -1700];
const FOLD_A: XY = [-3300, -2750], FOLD_B: XY = [-1700, -4700];
const POND_C: XY = [-3300, -450];
const POND = blob(POND_C, 430, 520, 3, 18, 0.08);
// the pond's overflow: a brook south out of the field, the head of the west woods' stream (it
// leaves the south edge where the stream comes in on the woods' north edge)
const BROOK: XY[] = smooth([[-3600, -620], [-4350, -900], [-5000, -1180], [-5700, -1400], [-6680, -1550], [-9000, -1800]]);
const BW = 480;

// ---- what lies next door ----
const ss = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const wav = (v: number, k: number) => 140 * Math.sin(v / 640 + k) + 80 * Math.sin(v / 230 + 2 * k);
// north: the tangled hills' snow. Over the last fifth of the field it comes on in patches,
// thicker towards the edge; past SNOW_X it lies whole.
const SNOW_X = (y: number) => 5650 + wav(y, 0);
const snowy = (x: number) => ss(3300, 5500, x);
// west: the frozen river's country. South of the mere the grass goes pale and dry the same way
// (patches, then whole past PALE_Y); north of it, on the down, it is snow.
const PALE_Y = (x: number) => 5700 + wav(x, 1);
const pale = (y: number) => ss(3300, 5600, y);
const BANK_X = 1300; // the river's north bank (the snowy down) north of this, on the west side

// the frozen river coming in at the west edge (where it leaves its own field: open water x
// -1040..1090, the down's cliff behind a strip of shore) and dying in a frozen mere: open water
// out to a ragged edge of ice past the walkable box, the ice reaching a little way in
const MERE: XY[] = [
  [-1060, A + 400], [-1040, 6676], [-990, 6150], [-860, 5600], [-640, 5200], [-330, 4950], [50, 4800], [450, 4760],
  [800, 4800], [1050, 4950], [1220, 5250], [1260, 5700], [1170, 6150], [1090, 6676], [1100, A + 400],
];
const ICE_Y = 6150;
const iceEdge = (x: number) => ICE_Y + 160 * Math.sin(x / 260) + 90 * Math.sin(x / 97 + 1);
const ICE_LINE: XY[] = Array.from({ length: 17 }, (_, k) => {
  const x = -990 + (2160 * k) / 16;
  return [x, iceEdge(x)] as XY;
});
const MERE_WATER: XY[] = [...ICE_LINE, [1090, 6676], [1100, A + 400], [-1060, A + 400], [-1040, 6676]];
const MERE_ICE: XY[] = [...MERE.slice(2, 13), ...ICE_LINE.map(([x, y]) => [x, y + 40] as XY).reverse()];

// ---- the tracks ----
const MAIN: XY[] = [
  ...smooth([[-7500, -50], WAY, [-4300, 250], [-3400, 750], [-2400, 1050], [-1450, 1000], [-600, 620], [250, 420], JUNCTION, along(R2.bottom, R2.top, -450)]),
  R2.bottom, R2.top,
  ...smooth([along(R2.bottom, R2.top, 1350), [1500, -1700], [1480, -2400], along(R3.bottom, R3.top, -450)]),
  R3.bottom, R3.top,
  ...smooth([along(R3.bottom, R3.top, 1350), [3050, -3250], [3150, -3300]]),
];
const MILL_WAY: XY[] = [...smooth([JUNCTION, [1050, 1050], along(R1.bottom, R1.top, -450)]), R1.bottom, R1.top, ...smooth([along(R1.bottom, R1.top, 1350), [2650, 2500], [2850, 2650]])];
const PASTURE: XY[] = smooth([[-1450, 1000], [-2150, 150], [-2500, -800], [-2450, -1700], [-2150, -2550], [-1500, -3250], [-650, -3050], [-50, -1900], [200, -600], [250, 420]]);
// ---- (v0.4) the lane east to the royal flower fields, off the pasture lane's far corner ----
const E_WAY: XY = [-300, -5150], E_BACK: XY = [-410, -4400];
const FLOWER_WAY: XY[] = smooth([[-700, -3100], [-550, -3900], [-350, -4600], E_WAY, [-260, -6500], [-220, -A]]);
const TRACKS = [MAIN, MILL_WAY, PASTURE, FLOWER_WAY];

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(301, {
    hills: [
      { x: -1600, y: 3300, r: 1500, h: 150 }, { x: -4300, y: 2100, r: 1200, h: 110 }, { x: -200, y: -3600, r: 1400, h: 140 },
      { x: -4000, y: -3900, r: 1100, h: 110 }, { x: -900, y: 900, r: 900, h: -60 }, { x: 2700, y: 300, r: 800, h: 80 },
      { x: 4300, y: 0, r: 900, h: 110 }, { x: 100, y: 3100, r: 1000, h: 110 }, { x: -5000, y: 3600, r: 1000, h: 90 },
      { x: -1800, y: -1300, r: 700, h: 70 }, { x: -4800, y: 600, r: 900, h: 80 },
      // the downs rolling on past the edge (none where the road and the brook go on south, nor
      // over the river)
      { x: -7300, y: 2900, r: 2000, h: 280 }, { x: -7000, y: 5000, r: 2000, h: 240 }, { x: -7000, y: -4300, r: 2200, h: 280 },
      { x: -3300, y: 8000, r: 1800, h: 220 }, { x: 3000, y: 7800, r: 1600, h: 200 },
    ],
    plateaus: [
      { poly: dense(P1), h: 280, ramps: [R1] },
      { poly: dense(P2), h: 300, ramps: [R2] },
      { poly: dense(P3), h: 580, ramps: [R3] },
      { poly: dense(MV), h: 640 },
      { poly: dense(ME), h: 520 },
    ],
    rock: "CliffMoss",
  });
  const { put, rnd } = f;
  // ---- the ground in three layers: snow under everything (the snow the patches open onto),
  // the frozen river's pale dry grass over the west, and the meadow's green on top, each upper
  // layer a hair higher and cut away where what is under it shows ----
  const roads = [band(MAIN, 460), band(MILL_WAY, 400), band(PASTURE, 380), band(FLOWER_WAY, 400)];
  const ROAD: [number, number, number] = [0.94, 0.88, 0.8];
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], water: [POND, band(BROOK, BW), MERE_WATER], base: "snow", road: ROAD });
  // patches of what is under, `amount` of them (0..1) at each point of a jittered grid over a box
  const pr = seeded(3011);
  const patches = (box: { x0: number; x1: number; y0: number; y1: number }, amount: (x: number, y: number) => number, r0: number, r1: number, step = 520): XY[][] => {
    const out: XY[][] = [];
    for (let x = box.x0; x < box.x1; x += step)
      for (let y = box.y0; y < box.y1; y += step) {
        const px = x + (pr() - 0.5) * step * 0.8, py = y + (pr() - 0.5) * step * 0.8, a = amount(px, py);
        // few and small where they begin, more and bigger towards the edge, where they run together
        if (pr() > a) continue;
        const r = (r0 + (r1 - r0) * a) * (0.7 + 0.3 * pr());
        out.push(blobPoly([px, py], r, r * (0.55 + 0.4 * pr()), 500 + out.length, 0.28, 16));
      }
    return out;
  };
  const ys: number[] = [], xs: number[] = [];
  for (let v = -A; v <= A; v += 250) ys.push(v), xs.push(v);
  const SNOW_PAST: XY[] = [...ys.map((y) => [SNOW_X(y), y] as XY), [A + 500, A + 500], [A + 500, -A - 500]];
  const PALE_PAST: XY[] = [...xs.map((x) => [x, PALE_Y(x)] as XY), [A + 500, A + 500], [-A - 500, A + 500]];
  const SNOW_BANK: XY[] = [[1500, 3000], [1350, 4000], [1150, 4700], [1100, 5600], [1020, 6676], [1000, A + 500], [A + 500, A + 500], [A + 500, 3000]];
  const snowNorth = patches({ x0: 3000, x1: 5800, y0: -A, y1: A }, (x) => snowy(x), 140, 380);
  const snowBank = patches({ x0: BANK_X - 200, x1: 5800, y0: 3000, y1: 5800 }, (_x, y) => pale(y), 140, 380);
  const paleWest = patches({ x0: -A, x1: BANK_X, y0: 3000, y1: 5900 }, (_x, y) => pale(y), 150, 400);
  const snowOnPale = patches({ x0: -A, x1: 1000, y0: 3800, y1: A }, (_x, y) => 0.12 + 0.2 * pale(y), 110, 280, 700);
  const paleGround = f.ground({ area: { x0: -A, y0: 2600, x1: A, y1: A }, roads, plazas: [], water: [POND, MERE, SNOW_PAST, SNOW_BANK, ...snowNorth, ...snowOnPale], base: "steppe", road: ROAD, tint: "#e2e6da" });
  paleGround.mesh.position.y += 3;
  paleGround.mesh.renderOrder = 1;
  const grass = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], water: [POND, band(BROOK, BW), MERE, SNOW_PAST, PALE_PAST, ...snowNorth, ...snowBank, ...paleWest], base: "grass", road: ROAD });
  grass.mesh.position.y += 6;
  grass.mesh.renderOrder = 2;
  // where the meadow's own green shows (flowers grow only there)
  const green = (x: number, y: number) => grass.kind(x, y) === 0;

  // ---- placing things: clear of the tracks, the water, the cliffs and each other ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine(x, y, t) < d);
  const onMere = (x: number, y: number, d: number) => inPoly(MERE, x, y) || toLine(x, y, MERE) < d;
  const wet = (x: number, y: number, d: number) => Math.hypot(x - POND_C[0], y - POND_C[1]) < 560 + d || toLine(x, y, BROOK) < BW / 2 + d || onMere(x, y, d);
  const free = (x: number, y: number, r: number, gap = 0) =>
    !nearTrack(x, y, r + 230) && !wet(x, y, r) && f.level(x, y, Math.min(r, 220)) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    taken.push([at[0], at[1], r]);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] as SolidSpec[] });
  // a few of something within r of c, wherever they fit
  const scatter = (ref: string, c: XY, r: number, n: number, rad: number, o: { s?: [number, number]; solid?: SolidSpec[] | "none"; inside?: boolean } = {}) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if ((o.inside !== false && (Math.abs(x) > R - 150 || Math.abs(y) > R - 150)) || !free(x, y, rad, 30)) continue;
      const s = o.s ? o.s[0] + rnd() * (o.s[1] - o.s[0]) : 1;
      prop(ref, [x, y], rnd() * 360, rad * s, { s, ...(o.solid ? { solid: o.solid } : {}) });
      made++;
    }
  };

  // ---- the way out south to the west woods (and on through them to Noa): a signpost, a
  // milestone, a cairn ----
  f.exit("west_woods", WAY, ARRIVE);
  prop("plains:signpost", [-4750, -450], 100, 80);
  prop("plains:milestone", [-4550, 650], 170, 60);
  prop("trunrada:cairn", [-5250, 700], 0, 120);
  // (v0.4) the way out east to the flower fields: a signpost and a cairn
  f.exit("flower_fields", E_WAY, E_BACK);
  prop("plains:signpost", [150, -4750], 0, 80);
  prop("trunrada:cairn", [-750, -5250], 0, 120);
  // where the lanes meet: a signpost at the valley's mouth
  prop("plains:signpost", [600, 1000], 200, 80);

  // ---- the windmill on its down ----
  prop("westfarm:stone_windmill", MILL, towards(-1, -0.35), 520, ring(350, "tower"));
  prop("trunrada:cart", [2700, 3500], 120, 230);
  prop("plains:hay_bales", [3900, 2300], 30, 240);
  prop("common:crate", [2650, 3050], 10, 60);
  prop("common:crate", [2600, 3130], 50, 60);
  prop("trunrada:haystack", [4200, 3700], 0, 200);
  prop("flora:BigOak", [4500, 2700], 40, 300, { s: 1.15 });

  // ---- the far down: the ruined watchtower on its step, the old border stones, relics ----
  prop("westfarm:watchtower_ruin", TOWER, towards(-1, 0.2), 640, {
    solid: [
      { kind: "tower", x: -244, y: 145, w: 72, d: 270, rot: 0 }, { kind: "tower", x: -244, y: -205, w: 72, d: 150, rot: 0 },
      { kind: "tower", x: 244, y: 0, w: 72, d: 560, rot: 0 }, { kind: "tower", x: 0, y: 244, w: 560, d: 72, rot: 0 }, { kind: "tower", x: 0, y: -244, w: 560, d: 72, rot: 0 },
    ],
  });
  for (const [at, h] of [[[3000, -2600], 20], [[4400, -2500], 70], [[4300, -4000], 120]] as [XY, number][]) prop("trunrada:standing_stone", at, h, 100, ring(55, "stone"));
  prop("frontier:battle_relics", [3150, -3900], 40, 200, { solid: "none" });
  prop("frontier:rubble_pile", [4300, -3500], 10, 220, { s: 0.8 });
  prop("trunrada:cairn", [2800, -3700], 0, 120);
  prop("flora:BigOak", [4200, -1800], 120, 300, { s: 1.2 });
  prop("trunrada:standing_stone", [2400, -1800], 0, 100, ring(55, "stone"));
  prop("trunrada:standing_stone", [3800, -5100], 90, 100, ring(55, "stone"));

  // ---- the pastures: the shepherd's hut, two sheepfolds, the dew pond ----
  prop("westfarm:shepherd_hut", HUT, towards(1, 0.15), 420);
  prop("plains:hay_bales", [-3850, -1500], 60, 240);
  prop("steppe:water_trough", [-2700, -2200], 30, 140);
  prop("plains:log_pile", [-3550, -2050], 80, 260, { s: 0.6 });
  const foldSolid = (): SolidSpec[] => {
    const out: SolidSpec[] = [];
    for (let k = 0; k < 22; k++) {
      const a = Math.PI + 0.3 + (k / 21) * (Math.PI * 2 - 0.6);
      out.push({ kind: "wall", x: Math.cos(a) * 420, y: Math.sin(a) * 420, r: 62 });
    }
    return out;
  };
  prop("westfarm:sheepfold", FOLD_A, towards(1, 0.5), 520, { solid: foldSolid() });
  prop("westfarm:sheepfold", FOLD_B, towards(1, 0.2), 520, { solid: foldSolid() });
  prop("westfarm:sheep_flock", [FOLD_A[0] + 120, FOLD_A[1] + 60], 30, 10, { solid: "none" });
  const scenery: THREE.Object3D[] = [paleGround.mesh, grass.mesh, f.waterSheet({ x0: POND_C[0] - 700, x1: POND_C[0] + 700, y0: POND_C[1] - 800, y1: POND_C[1] + 800 }, -14, "WaterSea")];
  f.blockDisc(POND_C, 470);
  // the brook: water under its banks, closed to walkers, reeds and stones along it
  scenery.push(f.waterSheet({ x0: -A, x1: -3300, y0: -2200, y1: -300 }, -14, "WaterSea"));
  f.blockBand(BROOK.filter(([x]) => x > -R - 600), BW + 60, { step: 220 });
  for (let i = 1; i < BROOK.length - 1; i++) {
    const [ax, ay] = BROOK[i], [bx, by] = BROOK[i + 1], L = Math.hypot(bx - ax, by - ay) || 1;
    if (ax < -R - 1500) break;
    for (const sd of [-1, 1]) {
      if (rnd() < 0.35) continue;
      const t = rnd(), o = BW / 2 + 60 + rnd() * 80, x = ax + (bx - ax) * t - ((by - ay) / L) * sd * o, y = ay + (by - ay) * t + ((bx - ax) / L) * sd * o;
      if (nearTrack(x, y, 300)) continue;
      put(rnd() < 0.7 ? "plains:reeds" : "plains:flat_rock", [x, y], rnd() * 360, { s: 0.6 + rnd() * 0.4, solid: "none" });
    }
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rnd() * 0.3, x = POND_C[0] + Math.cos(a) * 520, y = POND_C[1] + Math.sin(a) * 620;
    if (nearTrack(x, y, 300)) continue;
    put(i % 3 ? "plains:reeds" : "plains:flat_rock", [x, y], rnd() * 360, { s: i % 3 ? 0.9 + rnd() * 0.3 : 0.5, solid: "none" });
  }
  taken.push([POND_C[0], POND_C[1], 650]);

  // ---- the frozen mere at the west edge: the river's open water past the edge, floes on it, a
  // ragged edge of heaved ice, the ice reaching in under the down, plates of darker ice in it,
  // reeds frozen into its shore ----
  scenery.push(f.waterSheet({ x0: -1500, x1: 1600, y0: 5700, y1: A + 400 }, -14, "Northcold_RiverWater"));
  const iceSheet = flatSheet(MERE_ICE, 3, material("Northcold_ShoreIce"));
  iceSheet.renderOrder = 3;
  scenery.push(iceSheet);
  const floeMat = material("Northcold_Floe");
  for (const [x, y, r, sd] of [[-500, 6900, 160, 71], [500, 7300, 130, 72], [-100, 8200, 180, 73], [700, 6600, 110, 74]] as number[][])
    scenery.push(flatSheet(blobPoly([x, y], r, r * 0.7, sd, 0.25, 10), -11, floeMat));
  for (const [x, y, h, s] of [[200, 6800, 40, 0.9], [-700, 7600, 200, 1], [600, 8000, 120, 0.8]] as number[][]) put("northcold:drift_floes", [x, y], h, { z: -14, s, solid: "none" });
  for (let k = 0; k < 4; k++) {
    const x = -700 + k * 560, y = iceEdge(x) - 240;
    put("northcold:ice_ridge", [x, y], -6 + (rnd() - 0.5) * 30, { solid: "none" });
  }
  const onIce = (x: number, y: number) => inPoly(MERE_ICE, x, y);
  const plates: XY[] = [];
  for (let i = 0; i < 300 && plates.length < 9; i++) {
    const x = -800 + rnd() * 2000, y = 4800 + rnd() * 1200, s = 0.45 + rnd() * 0.4, r = 430 * s;
    if (![[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => onIce(x + dx, y + dy)) || plates.some(([qx, qy]) => Math.hypot(qx - x, qy - y) < r * 1.9)) continue;
    plates.push([x, y]);
    put("northcold:river_ice", [x, y], rnd() * 360, { s, z: 1.5, solid: "none" });
  }
  // reeds frozen into the ice along its shore, and on the bank of the open water past it
  for (let i = 0; i + 1 < MERE.length; i++) {
    const [ax, ay] = MERE[i], [bx, by] = MERE[i + 1], L = Math.hypot(bx - ax, by - ay);
    for (let t = 150; t < L; t += 260) {
      const x = ax + ((bx - ax) * t) / L, y = ay + ((by - ay) * t) / L;
      if (rnd() < 0.3 || y > 7400) continue;
      // inward (onto the ice) where it is frozen, outward (onto the bank) along the open water
      const cx = 200, cy = Math.min(y, 6000), d = Math.hypot(cx - x, cy - y) || 1, n = (y > iceEdge(x) ? -1 : 1) * (70 + rnd() * 120);
      put("northcold:frozen_reeds", [x + ((cx - x) / d) * n, y + ((cy - y) / d) * n], rnd() * 360, { s: 0.7 + rnd() * 0.4, solid: "none" });
    }
  }

  // ---- lone oaks on the hills, a few birches and bushes ----
  for (const [at, s] of [[[-1600, 3350], 1.35], [[-200, -3650], 1.25], [[-4300, 2150], 1.1], [[200, 3250], 1.2], [[4300, 30], 1.15], [[-4000, -3950], 1.05], [[2700, 350], 0.95], [[4300, 4400], 1.2], [[2200, -4600], 1.1]] as [XY, number][]) {
    if (free(at[0], at[1], 200)) prop("flora:BigOak", at, rnd() * 360, 280 * s, { s, solid: [{ kind: "tree", x: 0, y: 0, r: 45 * s }] });
  }

  // ---- the dry-stone walls: old field boundaries, gaps where the lanes go through ----
  const gapAt = (x: number, y: number) => nearTrack(x, y, 330) || wet(x, y, 120) || taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + 150);
  const WALLS: XY[][] = [
    [[-5900, 3700], [-4500, 3250], [-2900, 2400], [-1900, 2000], [-600, 2650], [900, 3350], [1250, 3900]],
    [[-5900, 1900], [-4600, 2000], [-3300, 2050], [-2300, 2200]],
    [[-5900, -2000], [-4700, -1750], [-3800, -1950], [-4000, -3400], [-4400, -5900]],
    [[-2700, -3800], [-1900, -3450], [-500, -2900], [300, -2700]],
    [[-1600, -5900], [-1900, -4900], [-2700, -3800]],
    [[1800, -1600], [2600, -1750], [4100, -1450], [5900, -1650]],
    [[1900, -4200], [1500, -5000], [1400, -5900]],
    [[5000, -2500], [5900, -2900]],
    [[2500, 4300], [3600, 3900], [4800, 4300], [5900, 4000]],
    [[2900, 5900], [3300, 4700]],
    [[-700, -900], [-400, -1700], [-1200, -2200]],
    [[400, 1800], [-300, 1300]],
  ];
  for (const w of WALLS) wallRun(f, w, { skip: gapAt, broken: 0.14 });
  // and on past the edge
  for (const w of [[[-5800, 6000], [-3000, 6400], [-1600, 7400]], [[-6200, -5800], [-5800, -2000], [-6600, 1500], [-6000, 5400]], [[-5600, -6000], [-2400, -6000]]] as XY[][])
    wallRun(f, w, { broken: 0.25, skip: (x, y) => nearTrack(x, y, 330) || wet(x, y, 150) });

  // ---- flocks over the pastures and the downs ----
  for (const at of [[-2200, -900], [-3900, -400], [-1300, -3900], [-600, -2300], [-4400, 3000], [-1500, 2500], [-200, 3300], [2500, -2300], [4300, -2700], [2900, -1400], [3900, 2000], [4300, 3300], [-4700, -2400]] as XY[])
    scatter("westfarm:sheep_flock", at, 450, 1, 180, { solid: "none" });

  // ---- rocks: mossy boulders, clusters, slabs ----
  const ROCKS: [string, XY, number][] = [
    ["plains:boulder", [-2300, 4300], 230], ["plains:rock_cluster", [-4800, 1500], 260], ["plains:flat_rock", [-800, 2000], 230], ["steppe:boulder", [600, -1700], 200],
    ["plains:rock_cluster", [-4900, -4600], 260], ["plains:boulder", [-2500, -4800], 230], ["plains:flat_rock", [-200, -4900], 230], ["steppe:boulder_flat", [1700, 2400], 180],
    ["plains:boulder", [4900, 800], 230], ["plains:rock_cluster", [3400, 700], 260], ["steppe:rock_cluster", [5000, -3900], 230], ["plains:boulder", [2000, -5200], 230],
    ["plains:flat_rock", [4600, 5000], 230], ["steppe:boulder", [-5000, 4900], 200], ["plains:rock_cluster", [1900, 4900], 260], ["plains:boulder", [-1700, 4800], 230],
  ];
  for (const [ref, at, r] of ROCKS) if (free(at[0], at[1], r)) prop(ref, at, rnd() * 360, r, { s: 0.75 + rnd() * 0.3 });
  // boulders at the foot of the downs' cliffs, birches and bushes along their tops
  for (const poly of [P1, P2, P3]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (inPoly(poly, mx + nx * 60, my + ny * 60)) [nx, ny] = [-nx, -ny];
      for (let t = 300; t < L - 300; t += 650) {
        const px = a[0] + ((b[0] - a[0]) * t) / L, py = a[1] + ((b[1] - a[1]) * t) / L;
        const out = 300 + rnd() * 150, x = px + nx * out, y = py + ny * out;
        if (rnd() < 0.5 && Math.abs(x) < R - 200 && Math.abs(y) < R - 200 && free(x, y, 110, 40)) {
          const s = 0.45 + rnd() * 0.3;
          prop(rnd() < 0.6 ? "plains:boulder" : "plains:flat_rock", [x, y], rnd() * 360, 160 * s, { s, solid: [{ kind: "rock", x: 0, y: 0, r: 120 * s }] });
        }
        const back = 380 + rnd() * 250, bx2 = px - nx * back, by2 = py - ny * back;
        if (rnd() < 0.35 && Math.abs(bx2) < R - 200 && Math.abs(by2) < R - 200 && free(bx2, by2, 160, 80)) {
          const kind = rnd() < 0.5 ? "Birch" : "RoundTree";
          prop(`flora:${kind}`, [bx2, by2], rnd() * 360, 170, { s: 0.7 + rnd() * 0.3 });
        }
      }
    }
  }

  // ---- ground cover: meadow flowers in drifts, tall grass, bushes along the walls; towards the
  // north and the west the cold's: snow patches, frosted shrubs, dry grass, drifts by the edge ----
  const IN = { x0: -R + 200, x1: R - 200, y0: -R + 200, y1: R - 200 };
  // how cold a point is: 0 in the meadow, 1 at the north or west edge
  const cold = (x: number, y: number) => Math.max(snowy(x), pale(y));
  for (let i = 0; i < 140; i++) {
    const x = IN.x0 + rnd() * (IN.x1 - IN.x0), y = IN.y0 + rnd() * (IN.y1 - IN.y0);
    if (!green(x, y) || rnd() < cold(x, y) * 1.3 || !free(x, y, 90)) continue;
    put("westfarm:wildflowers", [x, y], rnd() * 360, { s: 0.7 + rnd() * 0.6, solid: "none" });
    taken.push([x, y, 60]);
  }
  for (let i = 0; i < 160; i++) {
    const x = IN.x0 + rnd() * (IN.x1 - IN.x0), y = IN.y0 + rnd() * (IN.y1 - IN.y0);
    if (!free(x, y, 70)) continue;
    const k = rnd();
    put(!green(x, y) || rnd() < cold(x, y) ? "snowland:dry_grass" : k < 0.7 ? "plains:tall_grass" : "flora:Bush", [x, y], rnd() * 360, { s: 0.8 + rnd() * 0.5, solid: "none" });
    taken.push([x, y, 50]);
  }
  // in the bands by the north and west edges, thicker towards them
  const sprinkle = (ref: string, n: number, rad: number, amount: (x: number, y: number) => number, o: { s?: [number, number]; solid?: SolidSpec[] } = {}) => {
    for (let i = 0; i < n * 4; i++) {
      const x = IN.x0 + rnd() * (IN.x1 - IN.x0 + 600), y = IN.y0 + rnd() * (IN.y1 - IN.y0 + 600);
      if (rnd() > amount(x, y) || !free(x, y, rad, 20)) continue;
      const s = o.s ? o.s[0] + rnd() * (o.s[1] - o.s[0]) : 1;
      prop(ref, [x, y], rnd() * 360, rad * s, { s, ...(o.solid ? { solid: o.solid } : {}) });
    }
  };
  const northOrBank = (x: number, y: number) => Math.max(snowy(x), x > BANK_X ? pale(y) : 0);
  sprinkle("snowland:snow_patch", 40, 260, (x, y) => northOrBank(x, y) * 0.9, { s: [0.7, 1.2] });
  sprinkle("snowland:snow_patch", 14, 260, (x, y) => (x < BANK_X ? pale(y) * 0.45 : 0), { s: [0.5, 0.9] });
  sprinkle("snowland:frost_shrub", 18, 90, (x, y) => northOrBank(x, y) * 0.8);
  sprinkle("snowland:dry_grass", 40, 90, (x, y) => cold(x, y));
  sprinkle("snowland:snow_drift", 10, 230, (x) => ss(4700, 5600, x), { s: [0.7, 1] });

  // ---- past the edge: the downs roll on, walled, with trees in their hollows and on the higher
  // downs; more flowers. North of the field the hills' snow and snow pines; west of it the
  // frozen river: snow pines on its north bank, pines and birches on the pale south bank ----
  const inside = (x: number, y: number) => Math.abs(x) < R + 250 && Math.abs(y) < R + 250;
  const keepOut = (x: number, y: number) => inside(x, y) || nearTrack(x, y, 330) || wet(x, y, 150);
  const coldRim = (x: number, y: number) => x > SNOW_X(y) - 150 || y > PALE_Y(x) - 150;
  const SNOWY = ["SnowPine", "SnowPineSmall", "SnowPine", "FrostOak", "Birch"];
  f.woods({ x0: 5400, x1: A, y0: -A, y1: A }, SNOWY, (x, y) => keepOut(x, y) || x < SNOW_X(y) - 150, { count: 150, spacing: 520, tries: 3000 });
  f.woods({ x0: BANK_X, x1: A, y0: 5400, y1: A }, SNOWY, (x, y) => keepOut(x, y) || y < PALE_Y(x) - 150, { count: 40, spacing: 520, tries: 1200 });
  f.woods({ x0: -A, x1: -1100, y0: 5400, y1: A }, ["Pine", "PineSmall", "Birch", "Birch", "SnowPineSmall"], (x, y) => keepOut(x, y) || y < PALE_Y(x) - 150, { count: 70, spacing: 520, tries: 1500 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["BigOak", "RoundTree", "RoundTree", "Birch", "SmallTree"], (x, y) => keepOut(x, y) || coldRim(x, y), { count: 280, spacing: 520, tries: 6000 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["Bush", "Bush", "SmallTree"], (x, y) => keepOut(x, y) || coldRim(x, y), { count: 100, spacing: 420, tries: 2000 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["snow_drift", "frost_shrub", "dry_grass"], (x, y) => keepOut(x, y) || !coldRim(x, y), { count: 60, spacing: 600, tries: 1500, kit: "snowland" });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["wildflowers", "sheep_flock"], (x, y) => keepOut(x, y) || coldRim(x, y), { count: 60, spacing: 700, tries: 2000, kit: "westfarm" });

  // ---- monsters: the pastures, the valley, both downs ----
  const busy = (x: number, y: number) => Math.hypot(x - HUT[0], y - HUT[1]) < 900 || Math.hypot(x - MILL[0], y - MILL[1]) < 800 || Math.hypot(x - TOWER[0], y - TOWER[1]) < 650;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 880, keepOut: busy, max: 52 });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "noa_meadow_shepherd", x: HUT[0] + 420, y: HUT[1] + 330, face: 0, name: "ลุงโทมัส", title: "คนเลี้ยงแกะแห่งทุ่งโนอา", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_warrior_forest", bottom: "bottom_warrior_cocoa" },
      lines: [
        "ลมบนทุ่งโนอาไม่เคยหยุดพัด แกะของข้าเลยขนหนากว่าที่ไหน ๆ",
        "กำแพงหินพวกนี้คนรุ่นปู่ทวดเรียงไว้ทีละก้อน ไม่มีปูนสักนิด แต่ยืนมาได้ร้อยปี",
        "เนินฝั่งตะวันออกมีซากหอยามสมัยโนอายังเป็นเมืองหลวง ช่วงนี้มีตัวอะไรไม่รู้ไปทำรังอยู่แถวนั้น",
        "ทางตะวันตกแม่น้ำเยือกแข็งไหลมาสุดที่บึงน้ำแข็ง หน้าหนาวทั้งบึงแข็งเป็นลานน้ำแข็ง แกะชอบลงไปเลียน้ำแข็งเล่น",
      ],
    },
    {
      id: "noa_meadow_miller", x: MILL[0] - 520, y: MILL[1] - 200, face: 200, name: "ป้าเบียทริซ", title: "คนเฝ้ากังหันลมเก่า", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "auburn", eyes: "teal", top: "top_adventurer_teal", bottom: "bottom_adventurer_cocoa" },
      lines: [
        "กังหันลมนี้บดแป้งส่งเข้าเมืองโนอามาตั้งแต่สมัยยังเป็นเมืองหลวง",
        "ใบพัดหักไปใบหนึ่งแล้ว ยังหาช่างขึ้นไปซ่อมไม่ได้ ลมแรงขนาดนี้ใครจะกล้า",
        "ยืนตรงนี้มองเห็นทั้งทุ่ง ถนนลงใต้ไปป่าใหญ่ตะวันตก ผ่านป่าไปทางตะวันตกก็ถึงโนอานะจ๊ะ",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery,
    sky: "#6f8f4c",
    flowers: {
      box: { x: -R, y: -R, w: 2 * R, h: 2 * R },
      open: (x, y) => ground.kind(x, y) === 0 && green(x, y) && !wet(x, y, 60),
      density: 0.42 * quality.flowers,
    },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: -4200, y: 330 },
    npcs,
    labels: [
      { x: WAY[0] + 50, y: WAY[1] - 300, text: "ทางไปป่าใหญ่ตะวันตก", kind: "gate" },
      { x: E_WAY[0] + 300, y: E_WAY[1] + 250, text: "ทางไปทุ่งดอกไม้หลวง", kind: "gate" },
      { x: -1800, y: 1300, text: "ทุ่งหญ้าโนอา" },
      { x: MILL[0] - 450, y: MILL[1], text: "เนินกังหันลม" },
      { x: TOWER[0] - 600, y: TOWER[1], text: "ซากหอยามโบราณ" },
      { x: 3200, y: -1800, text: "เนินหญ้าฝั่งตะวันออก" },
      { x: HUT[0] + 450, y: HUT[1], text: "กระท่อมคนเลี้ยงแกะ", kind: "small" },
      { x: FOLD_A[0], y: FOLD_A[1], text: "คอกแกะ", kind: "small" },
      { x: POND_C[0] - 700, y: POND_C[1], text: "บ่อน้ำค้าง", kind: "small" },
      { x: 3600, y: 200, text: "หุบลม", kind: "small" },
      { x: 300, y: 4400, text: "บึงน้ำแข็ง", kind: "small" },
    ],
  });
}
