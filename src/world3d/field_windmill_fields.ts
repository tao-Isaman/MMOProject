// ทุ่งกังหันลม (the windmill fields), monsters Lv 20-28: wheat country south of the first meadow,
// between Eden's savanna and the lavender hills, where the village grinds its corn in the wind.
// The farm track from the savanna comes in north of the middle of the east side (where the
// savanna's track west leaves it), runs south-west past the foot of the windmill down to the
// village at the crossroads in the middle and on west to the lavender hills at the middle of the
// west side. The windmill down rises north-east of the village: a ramp up its south side, another
// up its higher step, where the great windmill turns its sails over the whole field, the miller's
// sacks round its door. Round the crossroads: the stone granary, the well, a farmhouse and its
// hen house, haystacks; up the lane north-west, the sheep's round stone fold by the woods. Wheat
// stands in blocks of fields on every side, some of it cut and stooked on the stubble. To the
// south-west a ridge carries two wooden post mills, a ramp up its north side; a third stands out
// in the wheat south-east of the village, at the end of a lane from the granary. The stream that
// turned the old water mill has dried: its bed winds across the south, cracked mud in the
// hollows, the mill standing idle beside it at the end of a lane, and the land dries towards the
// south edge into the dry plains' grass. East and south-east the savanna's golden grass comes in,
// north the first meadow's woods, west the lavender's rows.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: east -> south_savanna (n 0.62), west -> lavender_hills (n 0.50)

import { FieldBuilder } from "./field";
import { buildPaved } from "./paved";
import type { Town } from "./town";
import { useKits } from "./town";
import { KIT as HEART } from "./kits/heartland";
import { KIT as WESTFARM, smooth, band, dense, toLine, towards, along, lengthwise } from "./kits/westfarm";
import type { XY } from "./kits/westfarm";
import { KIT as PLAINS } from "./kits/plains";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { KIT as DESERT } from "./kits/desert";
import { KIT as STEPPE } from "./kits/steppe";
import { KIT as EDEN } from "./kits/eden";
import { rampOff } from "./kits/ruins";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(HEART, WESTFARM, PLAINS, TRUNRADA, DESERT, STEPPE, EDEN);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the ways out ----
const E_EXIT: XY = [1350, -5150], E_BACK: XY = [1290, -4440];
const W_EXIT: XY = [0, 5150], W_BACK: XY = [40, 4430];

// ---- the levels ----
// PM: the windmill down (280) and its higher step PM2 (540) north-east of the village; PW: the
// post mills' ridge (260) in the south-west.
const PM: XY[] = [[1200, -200], [1500, -1300], [1900, -2000], [2700, -2600], [3700, -2700], [4500, -2000], [4800, -600], [4500, 700], [3600, 1300], [2500, 1300], [1700, 1000]];
const PM2: XY[] = [[2500, -1500], [3200, -1950], [3900, -1550], [4100, -600], [3700, 200], [2900, 250], [2450, -500]];
const PW: XY[] = [[-1300, 2500], [-1100, 4000], [-2000, 4900], [-3500, 4900], [-4100, 3700], [-3500, 2400], [-2300, 2100]];
const RPM = rampOff(PM, 0, 0.5, 850, 460);
const RPM2 = rampOff(PM2, 5, 0.5, 800, 440);
const RPW = rampOff(PW, 0, 0.4, 800, 440);

// ---- the places ----
const J: XY = [-150, 0]; // the crossroads
const MILL: XY = [3300, -800];
const OLD_MILL: XY = [-3150, -300];
const POSTS: XY[] = [[-2300, 3750], [-3250, 3050], [-2100, -2700]];

// ---- the dry stream: a chain of shallow hollows across the south ----
const WASH: XY[] = smooth([[-3000, -A], [-3100, -4500], [-3700, -3200], [-3450, -1800], [-3850, -650], [-4400, 600], [-5000, 1400], [-6000, 1800], [-A, 2000]], 700);

// ---- the tracks ----
const MAIN: XY[] = smooth([[1400, -A], E_EXIT, [1150, -4200], [650, -3200], [250, -2100], [0, -1000], J, [-200, 1200], [50, 2500], [200, 3700], [80, 4500], W_EXIT, [0, 7000], [0, A]]);
const MILL_WAY: XY[] = [
  ...smooth([[60, -900], along(RPM.bottom, RPM.top, -320)]), RPM.bottom, RPM.top,
  ...smooth([along(RPM.bottom, RPM.top, 1150), [1750, -150], along(RPM2.bottom, RPM2.top, -320)]), RPM2.bottom, RPM2.top,
  ...smooth([along(RPM2.bottom, RPM2.top, 1100), [2950, -700]]),
];
const POST_WAY: XY[] = [...smooth([[120, 3000], along(RPW.bottom, RPW.top, -320)]), RPW.bottom, RPW.top, ...smooth([along(RPW.bottom, RPW.top, 1100), [-2350, 3200], [-2900, 3350]])];
// the lane past the granary to the idle water mill by the dry stream
const MILL_LANE: XY[] = smooth([J, [-1300, -200], [-2300, -250], [OLD_MILL[0] + 400, OLD_MILL[1] - 100]]);
// the lane from the granary out to the third post mill in the wheat
const POST_LANE: XY[] = smooth([[-1500, -250], [-1950, -1100], [-2050, -2150]]);
// the lane north-west through the wheat to the sheep's fold by the woods
const FOLD: XY = [4050, 3950];
const PEN_LANE: XY[] = smooth([[-180, 1500], [800, 2100], [1700, 2500], [2600, 2700], [3300, 3200], [3550, 3600]]);
const TRACKS = [MAIN, MILL_WAY, POST_WAY, MILL_LANE, POST_LANE, PEN_LANE];

// ---- what lies next door ----
const ss = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// south: the dry plains' grass, from a wavering line across the south (it falls back past the
// south-west corner, where the dry plains green again towards Venezia); east: the savanna's gold,
// from a line down the east side (it falls back past the north-east corner, green towards Eden)
const SOUTH_LINE = (y: number) => -3950 + 260 * Math.sin(y / 700) + 150 * Math.sin(y / 260 + 1) - Math.max(0, y - 2400) * 1.3;
const EAST_LINE = (x: number) => -4350 + 240 * Math.sin(x / 650 + 2) + 130 * Math.sin(x / 230 + 2) - Math.max(0, x - 2300) * 1.3;
const dryS = (x: number, y: number) => ss(SOUTH_LINE(y) + 500, SOUTH_LINE(y) - 500, x);
const goldE = (x: number, y: number) => ss(EAST_LINE(x) + 500, EAST_LINE(x) - 500, y);
const dry = (x: number, y: number) => Math.max(dryS(x, y), goldE(x, y));

// A polygon with holes as one outline: each hole wound the other way and joined to the outline's
// first point, so the ground's mask leaves it out when it fills the outline.
function withHoles(outer: XY[], holes: XY[][]): XY[] {
  const area = (p: XY[]) => p.reduce((t, [x, y], i) => t + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0);
  const out: XY[] = [...outer, outer[0]];
  for (const h of holes) {
    const ring = Math.sign(area(h)) === Math.sign(area(outer)) ? [...h].reverse() : h;
    out.push(...ring, ring[0], outer[0]);
  }
  return out;
}

export function build(quality: { flowers: number }): Town {
  const f = new FieldBuilder(512, {
    hills: [
      // the dry stream's bed
      ...WASH.filter((_, i) => i % 2 === 0).map(([x, y], i) => ({ x, y, r: 560 + (i % 2) * 120, h: -60 - (i % 3) * 10 })),
      // rolling ground
      { x: -4600, y: 3900, r: 700, h: 70 }, { x: 3600, y: -4300, r: 900, h: 90 },
      // past the edge
      { x: 7600, y: 2600, r: 2200, h: 240 }, { x: 7400, y: -2500, r: 2000, h: 220 }, { x: -7600, y: -3800, r: 2000, h: 180 },
      { x: 3400, y: -7500, r: 1800, h: 200 }, { x: -2800, y: 7600, r: 1800, h: 200 },
    ],
    plateaus: [
      { poly: dense(PM), h: 280, ramps: [RPM] },
      { poly: dense(PM2), h: 540, ramps: [RPM2] },
      { poly: dense(PW), h: 260, ramps: [RPW] },
    ],
    rock: "CliffMoss",
  });
  const { put, rnd } = f;

  // ---- the ground: green over the fields, drying to the south and to gold on the east ----
  const roads = [band(MAIN, 470), band(MILL_WAY, 420), band(POST_WAY, 400), band(MILL_LANE, 360), band(POST_LANE, 320), band(PEN_LANE, 340)];
  const ROAD: [number, number, number] = [0.96, 0.88, 0.74];
  const ground = f.ground({ area: { x0: -A, y0: -A, x1: A, y1: A }, roads, plazas: [], water: [], base: "steppe", tint: "#ecdcaa", road: ROAD });
  // another ground a little over this one, on the same grid, following the cliffs the same way
  const over = (area: { x0: number; x1: number; y0: number; y1: number }, base: string, cut: XY[][], lift: number, tint?: string) => {
    const g = buildPaved({
      area, roads: [], plazas: [], water: cut, base, cell: 100, ...(tint ? { tint } : {}),
      height: (x, y) => f.h(x, y) + lift,
      place: (x, y, cell) => {
        const [px, py, h, k] = f.terrain.place(x, y, cell);
        return [px, py, h + lift, k];
      },
    });
    g.mesh.renderOrder = 1;
    return g;
  };
  // the green laid over it all, cut away past the two lines (dry grass on the south, the savanna's
  // gold on the east) and in patches before them; the dry stream's bed of bare earth (another
  // ground over this one, following the cliffs the same way)
  const ys: number[] = [], xs: number[] = [];
  for (let v = -A - 400; v <= A + 400; v += 200) ys.push(v), xs.push(v);
  const DRY_S: XY[] = [[-A - 400, -A - 400], ...ys.map((y) => [SOUTH_LINE(y), y] as XY), [-A - 400, A + 400]];
  const DRY_E: XY[] = [[-A - 400, -A - 400], ...xs.map((x) => [x, EAST_LINE(x)] as XY), [A + 400, -A - 400]];
  const dryPatches: XY[][] = [];
  {
    let sd = 5121;
    const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 400 && dryPatches.length < 46; i++) {
      const x = -A + r() * 2 * A, y = -A + r() * 2 * A, d = dry(x, y);
      if (d > 0.45 || d < 0.04 || r() > d * 2) continue;
      const rr = 160 + r() * 260;
      dryPatches.push(Array.from({ length: 12 }, (_, k) => {
        const a = (k / 12) * Math.PI * 2, w = 1 + 0.25 * Math.sin(a * 3 + i);
        return [x + Math.cos(a) * rr * w * 1.3, y + Math.sin(a) * rr * w] as XY;
      }));
    }
  }
  const grass = over({ x0: -A, x1: A, y0: -A, y1: A }, "grass", [DRY_S, DRY_E, ...dryPatches, ...roads], 3);
  const bed = over({ x0: -A, x1: -1500, y0: -A, y1: A }, "dirt", [withHoles([[-A - 400, -A - 400], [-A - 400, A + 400], [A + 400, A + 400], [A + 400, -A - 400]], [band(WASH, 360)]), ...roads], 5, "#d2c3a8");

  // ---- placing things: clear of the tracks, the cliffs and each other ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine(x, y, t) < d);
  const free = (x: number, y: number, r: number, gap = 0) =>
    !nearTrack(x, y, r + 230) && f.level(x, y, Math.min(r, 220)) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    taken.push([at[0], at[1], r]);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] as SolidSpec[] });
  const inside = (x: number, y: number, m = 0) => Math.abs(x) < R - m && Math.abs(y) < R - m;
  const scatter = (refs: string[], n: number, box: { x0: number; x1: number; y0: number; y1: number }, rad: number, o: { s?: [number, number]; solid?: SolidSpec[] | "none"; keep?: (x: number, y: number) => boolean; gap?: number } = {}) => {
    for (let i = 0, made = 0; i < n * 30 && made < n; i++) {
      const x = box.x0 + rnd() * (box.x1 - box.x0), y = box.y0 + rnd() * (box.y1 - box.y0);
      if (!free(x, y, rad, o.gap ?? 40) || (o.keep && !o.keep(x, y))) continue;
      const s = o.s ? o.s[0] + rnd() * (o.s[1] - o.s[0]) : 1;
      prop(refs[Math.floor(rnd() * refs.length)], [x, y], rnd() * 360, rad * s, { s, ...(o.solid ? { solid: o.solid } : {}) });
      made++;
    }
  };
  const IN = { x0: -R + 250, x1: R - 250, y0: -R + 250, y1: R - 250 };
  const tree = (kind: string, at: XY, s = 1, r = 40) => prop(kind.includes(":") ? kind : `flora:${kind}`, at, rnd() * 360, 190 * s, { s, solid: [{ kind: "tree", x: 0, y: 0, r: r * s }] });
  const hurdles = (pts: XY[], closed = false) => {
    const P = closed ? [...pts, pts[0]] : pts;
    for (let i = 0; i + 1 < P.length; i++) {
      const [ax, ay] = P[i], [bx, by] = P[i + 1], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / 400));
      for (let k = 0; k < n; k++) {
        const c: XY = [ax + ((bx - ax) * (k + 0.5)) / n, ay + ((by - ay) * (k + 0.5)) / n];
        if (nearTrack(c[0], c[1], 260) || !f.level(c[0], c[1], 120)) continue;
        put("heartland:wattle_fence", c, lengthwise(bx - ax, by - ay), { sy: L / n / 400, solid: [{ kind: "fence", x: 0, y: 0, w: 20, d: 400, rot: 0 }] });
      }
    }
  };

  // ---- the ways out ----
  f.exit("south_savanna", E_EXIT, E_BACK);
  f.exit("lavender_hills", W_EXIT, W_BACK);
  prop("plains:signpost", [900, -4800], 90, 80);
  prop("trunrada:cairn", [1850, -4950], 0, 120);
  prop("plains:signpost", [450, 4800], -90, 80);
  prop("plains:milestone", [-450, 4700], 180, 60);
  // where the tracks part
  prop("plains:signpost", [350, -700], 160, 80);
  prop("plains:signpost", [-650, 2900], 0, 80);

  // ---- the great windmill on the down's higher step: its sails turn over the whole field ----
  prop("heartland:great_windmill", MILL, towards(-1, 0.25), 520, { solid: [{ kind: "tower", x: 0, y: 0, r: 350 }, { kind: "tower", x: 0, y: 0, r: 470 }] });
  prop("trunrada:cart", [MILL[0] - 200, MILL[1] + 650], 30, 230);
  prop("plains:hay_bales", [MILL[0] + 450, MILL[1] + 500], 60, 240);
  for (const at of [[MILL[0] - 750, MILL[1] - 400], [MILL[0] - 820, MILL[1] - 330]] as XY[]) prop("common:crate", at, rnd() * 90, 60);
  // the down below it: the miller's house, wheat, a lone oak
  prop("common:house", [1150, -2400], 0, 560);
  tree("BigOak", [3900, 700], 1.2, 48);
  tree("BigOak", [2000, 700], 1, 44);

  // ---- the post mills on the south-west ridge ----
  prop("heartland:post_mill", POSTS[0], towards(-1, -0.2), 380, { solid: [{ kind: "mill", x: 0, y: 0, w: 520, d: 520, rot: 0 }, { kind: "post", x: 400, y: 0, r: 60 }] });
  prop("heartland:post_mill", POSTS[1], towards(-1, 0.3), 380, { solid: [{ kind: "mill", x: 0, y: 0, w: 520, d: 520, rot: 0 }, { kind: "post", x: 400, y: 0, r: 60 }] });
  // and one out in the wheat south-east of the village, its own lane to it
  prop("heartland:post_mill", POSTS[2], towards(-1, -0.5), 380, { solid: [{ kind: "mill", x: 0, y: 0, w: 520, d: 520, rot: 0 }, { kind: "post", x: 400, y: 0, r: 60 }] });
  prop("trunrada:haystack", [-3750, 3900], 0, 200);

  // ---- the village round the crossroads: the granary, the well, the farmhouse and its hens, hay ----
  prop("heartland:stone_granary", [-1250, -1050], 180, 520, { solid: [{ kind: "building", x: 0, y: 0, w: 560, d: 820, rot: 0 }, { kind: "building", x: -150, y: 0, w: 260, d: 160, rot: 0 }] });
  prop("heartland:village_well", [-650, 550], 15, 200, { solid: [{ kind: "well", x: 0, y: 0, r: 100 }, { kind: "box", x: 0, y: 180, w: 130, d: 90, rot: 0 }] });
  prop("westfarm:farmhouse", [1150, 1250], towards(-1, 0.3), 900, {
    solid: [{ kind: "building", x: 0, y: -210, w: 660, d: 840, rot: 0 }, { kind: "building", x: 10, y: 520, w: 620, d: 660, rot: 0 }, { kind: "box", x: -375, y: -330, w: 120, d: 560, rot: 0 }],
  });
  prop("heartland:chicken_coop", [-900, 1500], towards(1, -0.6), 300, { solid: [{ kind: "coop", x: 0, y: 0, w: 470, d: 300, rot: 0 }] });
  prop("trunrada:haystack", [-1650, 800], 0, 200);
  prop("trunrada:haystack", [-1700, 1350], 0, 200);
  prop("plains:hay_bales", [-2550, -1000], 70, 240);
  prop("trunrada:cart", [-600, -1700], 120, 230);
  prop("heartland:flower_cart", [500, 1700], 200, 230);
  // sacks of grain in crates at the granary door
  for (const at of [[-1300, -1700], [-1480, -1760]] as XY[]) prop("common:crate", at, rnd() * 90, 260);
  prop("eden:park_bench", [-300, -450], 90, 100);
  tree("RoundTree", [-900, -400], 1, 40);
  tree("Cherry", [700, -300], 0.9, 36);
  // the sheep's round stone fold at the end of the lane, by the woods: the flock out on the grass
  // round it, the trough, the shepherd's hut, hurdles penning the lambs
  const foldSolid: SolidSpec[] = [];
  for (let k = 0; k < 22; k++) {
    const a = Math.PI + 0.3 + (k / 21) * (Math.PI * 2 - 0.6);
    foldSolid.push({ kind: "wall", x: Math.cos(a) * 420, y: Math.sin(a) * 420, r: 62 });
  }
  prop("westfarm:sheepfold", FOLD, towards(-1, -0.7), 520, { solid: foldSolid });
  for (const at of [[FOLD[0] - 1000, FOLD[1] + 350], [FOLD[0] - 300, FOLD[1] - 950]] as XY[]) prop("westfarm:sheep_flock", at, rnd() * 360, 330, { solid: "none" });
  prop("steppe:water_trough", [FOLD[0] - 700, FOLD[1] - 250], 30, 140);
  prop("westfarm:shepherd_hut", [FOLD[0] - 250, FOLD[1] + 1150], towards(-1, -0.2), 420);
  hurdles([[FOLD[0] + 500, FOLD[1] - 700], [FOLD[0] + 100, FOLD[1] - 1450], [FOLD[0] - 500, FOLD[1] - 1700]]);
  taken.push([FOLD[0] - 100, FOLD[1] - 1100, 450]);

  // ---- the dry stream: cracked mud in its bed, dead reeds, the idle water mill by it ----
  prop("plains:water_mill", OLD_MILL, 90, 620);
  for (let i = 1; i < WASH.length - 1; i += 2) {
    const [x, y] = WASH[i];
    if (!inside(x, y, 300) || Math.hypot(x - OLD_MILL[0], y - OLD_MILL[1]) < 900 || nearTrack(x, y, 300)) continue;
    put("westfarm:cracked_earth", [x + (rnd() - 0.5) * 200, y + (rnd() - 0.5) * 200], rnd() * 360, { s: 0.7 + rnd() * 0.3 });
    if (rnd() < 0.6) put(rnd() < 0.5 ? "desert:reeds" : "desert:dry_bush", [x + (rnd() - 0.5) * 900, y + (rnd() - 0.5) * 900], rnd() * 360, { s: 0.8, solid: "none" });
  }
  // stones left in the bed where the water ran, dead reeds along its banks
  for (let i = 0; i + 1 < WASH.length; i++) {
    const [ax, ay] = WASH[i], [bx, by] = WASH[i + 1], L = Math.hypot(bx - ax, by - ay) || 1;
    for (let t = 0; t < 1; t += 0.5) {
      const x = ax + (bx - ax) * t, y = ay + (by - ay) * t, o = (rnd() - 0.5) * 220;
      if (!inside(x, y, 200) || nearTrack(x, y, 260) || Math.hypot(x - OLD_MILL[0], y - OLD_MILL[1]) < 700) continue;
      put("plains:flat_rock", [x - ((by - ay) / L) * o, y + ((bx - ax) / L) * o], rnd() * 360, { s: 0.3 + rnd() * 0.25, solid: "none" });
      const sd = rnd() < 0.5 ? -1 : 1, w = 260 + rnd() * 80;
      put("desert:reeds", [x - ((by - ay) / L) * sd * w, y + ((bx - ax) / L) * sd * w], rnd() * 360, { s: 0.7 + rnd() * 0.3, solid: "none" });
    }
  }
  prop("desert:dead_tree", [-3100, -2400], 30, 150, ring(26, "tree"));
  prop("desert:dead_tree", [-4500, 1100], 140, 150, ring(26, "tree"));

  // ---- the wheat: fields of it in blocks wherever they lie level, a few cut and stooked ----
  // whether a field (hx across it, north-south; 400 along it, east-west, each way) lies whole there
  const laid: [number, number, number][] = [];
  const fieldAt = (x: number, y: number, hx: number) => {
    if (Math.hypot(x - J[0], y - J[1]) < 950) return false;
    if (laid.some(([lx, ly, lh]) => Math.abs(lx - x) < lh + hx + 20 && Math.abs(ly - y) < 820)) return false;
    for (const [dx, dy] of [[0, 0], [hx, 400], [-hx, 400], [hx, -400], [-hx, -400], [0, 400], [0, -400]]) {
      const px = x + dx, py = y + dy;
      if (!inside(px, py, 200) || !f.level(px, py, 120) || nearTrack(px, py, 235) || Math.abs(f.h(px, py) - f.h(x, y)) > 30 || dry(px, py) > 0.6) return false;
      if (taken.some(([tx, ty, tr]) => Math.hypot(tx - px, ty - py) < tr)) return false;
    }
    return true;
  };
  // the land in blocks of 4 x 3 fields (8 x 6 m each, end to end): standing wheat, wheat cut and
  // stooked on the stubble, or (seldom) left to meadow; along each row of a block the fields
  // shift to fit round whatever is in the way, and narrow strips of wheat (3 m) fill the gaps after
  const kinds: string[] = [];
  for (let k = 0; k < 25; k++) {
    const r = rnd();
    kinds.push(r < 0.66 ? "wheat" : r < 0.94 ? "cut" : "meadow");
  }
  const kindAt = (x: number, y: number) => kinds[Math.min(4, Math.max(0, Math.floor((x + 5120) / 2560))) * 5 + Math.min(4, Math.max(0, Math.floor((y + 5040) / 2520)))];
  for (const hx of [300, 150])
    for (let bx = -5120; bx < R; bx += 4 * 640)
      for (let by = -5040; by < R; by += 3 * 840) {
        const kind = kindAt(bx + 1, by + 1);
        if (kind === "meadow") continue;
        for (let j = 0; j < 3; j++) {
          const y = by + 420 + j * 840;
          for (let x = bx + 20 + hx; x <= bx + 4 * 640 - 20 - hx; ) {
            if (!fieldAt(x, y, hx)) {
              x += 80;
              continue;
            }
            if (kind === "cut" && hx === 300) put("heartland:wheat_stooks", [x, y], rnd() < 0.5 ? 90 : -90, { solid: "none" });
            else put("plains:wheat_field", [x, y], 90, { solid: "none", sy: hx / 300 });
            laid.push([x, y, hx]);
            x += 2 * hx + 40;
          }
        }
      }
  for (const [x, y, hx] of laid) for (const o of [-250, 250]) taken.push([x, y + o, hx + 60]);
  for (const at of [[3300, 1900], [-400, -3700], [-1900, 1100], [2600, -4000]] as XY[]) if (free(at[0], at[1], 40)) prop("plains:scarecrow", at, rnd() * 360, 40);

  // ---- trees, rocks and the meadow's growth; the savanna's acacias and gold coming in ----
  scatter(["flora:BigOak", "flora:RoundTree", "flora:RoundTree", "flora:SmallTree"], 22, IN, 230, { s: [0.85, 1.15], solid: [{ kind: "tree", x: 0, y: 0, r: 44 }], gap: 300, keep: (x, y) => dry(x, y) < 0.5 });
  scatter(["desert:acacia"], 7, IN, 260, { s: [0.8, 1.05], solid: [{ kind: "tree", x: 0, y: 0, r: 34 }], keep: (x, y) => dry(x, y) > 0.4 });
  scatter(["heartland:meadow_boulder", "heartland:field_stones", "heartland:field_stones"], 8, IN, 200, { s: [0.6, 0.9], solid: [{ kind: "rock", x: 0, y: 0, r: 110 }] });
  scatter(["heartland:flower_bush"], 8, IN, 110, { s: [0.7, 1], solid: [{ kind: "bush", x: 0, y: 0, r: 60 }], keep: (x, y) => dry(x, y) < 0.4 });
  scatter(["desert:dry_bush", "steppe:scrub"], 20, IN, 110, { s: [0.7, 1.1], solid: "none", keep: (x, y) => dry(x, y) > 0.35 });
  // the first meadow's woods coming in on the north
  scatter(["flora:BigOak", "flora:RoundTree", "flora:SmallTree"], 20, { x0: 4200, x1: R - 150, y0: -R + 200, y1: R - 200 }, 210, { s: [0.85, 1.2], solid: [{ kind: "tree", x: 0, y: 0, r: 44 }], keep: (x) => rnd() < ss(4300, 5400, x) + 0.2 });
  const grassOut = (x: number, y: number) => nearTrack(x, y, 60) || !f.level(x, y, 90) || taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr * 0.8);
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["tall_grass", "tall_grass", "fern_clump"], (x, y) => grassOut(x, y) || dry(x, y) > 0.5, { count: 140, tries: 4000, spacing: 420, kit: "plains" });
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["poppy_patch", "poppy_patch", "lavender_clump"], (x, y) => grassOut(x, y) || dry(x, y) > 0.4, { count: 50, tries: 2000, spacing: 650, kit: "heartland" });
  f.woods({ x0: -R, x1: R, y0: -R, y1: R }, ["grass_patch", "grass_tuft", "grass_patch"], (x, y) => grassOut(x, y) || dry(x, y) < 0.45, { count: 150, tries: 4000, spacing: 380, kit: "desert" });

  // ---- past the edge: the first meadow's woods north, the savanna east, the dry plains south,
  // the lavender's rows west ----
  // the lavender hills' rows over the west edge
  const rimRows: XY[] = [];
  for (let x = -2600; x <= 2600; x += 220)
    for (let y = 5900; y + 800 <= 7900; y += 800) {
      const m: XY = [x, y + 400];
      if (nearTrack(m[0], m[1], 560) || Math.abs(f.h(x, y) - f.h(x, y + 800)) > 18) continue;
      put("heartland:lavender_row", m, lengthwise(0, 1), { solid: "none" });
      rimRows.push(m);
    }
  const rim = (x: number, y: number) =>
    (Math.abs(x) < R + 250 && Math.abs(y) < R + 250) || nearTrack(x, y, 330) || rimRows.some(([px, py]) => Math.abs(px - x) < 260 && Math.abs(py - y) < 560);
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["BigOak", "RoundTree", "RoundTree", "SmallTree", "BigOak"], (x, y) => rim(x, y) || dry(x, y) > 0.45, { count: 380, tries: 7000, spacing: 480 });
  f.woods({ x0: -A, x1: A, y0: -A, y1: A }, ["acacia", "acacia", "grass_patch", "grass_patch", "dry_bush", "grass_patch"], (x, y) => rim(x, y) || dry(x, y) < 0.45, { count: 260, tries: 6000, spacing: 420, kit: "desert" });
  for (const at of [[-6800, -1500], [-6800, -2400], [6600, 3500], [6600, 2700]] as XY[]) put("plains:wheat_field", at, 90, { solid: "none" });

  // ---- monsters: the fields, the farmyards, the down and the ridge ----
  const busy = (x: number, y: number) => Math.hypot(x - J[0], y - J[1]) < 1100 || Math.hypot(x - MILL[0], y - MILL[1]) < 600 || Math.hypot(x - OLD_MILL[0], y - OLD_MILL[1]) < 700;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 820, keepOut: busy, max: 50 });

  // ---- people ----
  const npcs: NpcSpec[] = [
    {
      id: "windmill_fields_miller", x: MILL[0] - 650, y: MILL[1] + 200, face: 180, name: "ลุงฟริตซ์", title: "คนโม่แป้งกังหันลมใหญ่", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "amber", top: "top_warrior", bottom: "bottom_warrior_cocoa" },
      lines: [
        "ใบพัดนี่หมุนทั้งวันทั้งคืน ลมบนเนินนี้ไม่เคยขาด แป้งของข้าส่งไปถึงอีเดน",
        "แต่ก่อนหมู่บ้านใช้โรงสีน้ำริมลำธารทางใต้ พอลำธารแห้งก็ต้องหันมาพึ่งลมกันหมด",
        "หนูโรงสีขึ้นมาแทะกระสอบแป้งทุกคืน ไก่ชนที่หลุดออกจากเล้าก็ดุขึ้นทุกวัน ระวังตัวด้วย",
      ],
    },
    {
      id: "windmill_fields_farmwife", x: -650, y: 1200, face: 0, name: "ป้ากรีเทอ", title: "แม่บ้านไร่ข้าวสาลี", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "gold", eyes: "teal", top: "top_adventurer_ochre", bottom: "bottom_adventurer_sand" },
      lines: [
        "ยุ้งฉางหินนั่นเก็บข้าวสาลีทั้งหมู่บ้าน ปีนี้ข้าวดีจนต้องตั้งกองฟางไว้ข้างนอก",
        "ไก่ของฉันกลายเป็นไก่ชนป่าไปหลายตัวแล้ว หงอนแดงเหมือนไฟ พุ่งชนใครก็ล้ม",
        "ทางตะวันออกไปทุ่งสะวันนาใต้ ทางตะวันตกข้ามเนินไปทุ่งลาเวนเดอร์ หอมทั้งทุ่งเลย",
      ],
    },
  ];

  return f.finishField({
    ground,
    scenery: [grass.mesh, bed.mesh],
    sky: "#86a35a",
    flowers: { box: { x: -R, y: -R, w: 2 * R, h: 2 * R }, open: (x, y) => ground.kind(x, y) === 0 && dry(x, y) < 0.4, density: 0.3 * quality.flowers },
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 1250, y: -4250 },
    npcs,
    labels: [
      { x: E_EXIT[0], y: E_EXIT[1] + 250, text: "ทางไปทุ่งสะวันนาใต้", kind: "gate" },
      { x: W_EXIT[0], y: W_EXIT[1] - 250, text: "ทางไปทุ่งลาเวนเดอร์", kind: "gate" },
      { x: MILL[0] - 600, y: MILL[1], text: "กังหันลมใหญ่" },
      { x: 2000, y: -400, text: "เนินกังหันลม", kind: "small" },
      { x: -2700, y: 3400, text: "สันเขากังหันลมไม้" },
      { x: -250, y: -200, text: "หมู่บ้านกังหันลม" },
      { x: -1250, y: -1600, text: "ยุ้งฉางหิน", kind: "small" },
      { x: -650, y: 750, text: "บ่อน้ำหมู่บ้าน", kind: "small" },
      { x: OLD_MILL[0] + 600, y: OLD_MILL[1], text: "โรงสีน้ำร้าง", kind: "small" },
      { x: -3500, y: -1800, text: "ลำธารแห้ง", kind: "small" },
      { x: FOLD[0] - 650, y: FOLD[1], text: "คอกแกะหิน", kind: "small" },
      { x: -1800, y: -3600, text: "ทุ่งข้าวสาลี" },
    ],
  });
}
