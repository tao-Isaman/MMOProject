// ช่องเขาตะวันตก (the western pass), monsters Lv 134-146: the old road over the western range,
// from the ancient forest down to the coast, where Suzhou lies to the south and the neck of land
// to the west cape runs out west. Mountain walls stand over it on both sides, rising in steps to
// peaks past the edge, and the road climbs between them in switchbacks; at the west the walls end
// in cliffs dropping into the western sea, the north one at the north-west corner, the south one
// round a headland at the south-west.
//
// From the forest it comes in at the east foot (north along it), turns up the first ramp onto a
// terrace, doubles back south along it and climbs again onto the crest. On the crest, where a spur
// of rock reaches out from each wall, the old frontier gatehouse stands across the pass: the road
// runs through its gate, between the tower still standing and the one fallen in. Past it the road
// drops in two more switchbacks down the west side into the valley under the peaks, and there it
// parts: west across the valley floor onto the neck of land to the cape, and south over a gorge
// that cuts across from the terrace's cliff to the headland's, so deep its bottom is lost in
// shadow (two rope bridges hung with prayer flags cross it), then down the open slopes south of
// the range to Suzhou. Rockfalls lie at the feet of the walls, wind-bent pines cling to the
// terraces, and pilgrims' cairns mark the crest and the valley. The dry olive ground greens toward
// the forest on the east and toward Suzhou's fields on the south.
//
// Laid out at full size (north +X, west +Y) and scaled by TOWN_SCALE in finishField.
//   ways out: east -> elder_forest, south -> suzhou, west -> west_cape

import { FieldBuilder } from "./field";
import type { Town } from "./town";
import { useKits } from "./town";
import { KIT as WESTMOUNT, FORT_SOLIDS, BRIDGE_SOLIDS, CHASM_DEPTH, smooth, band, toLine, nearestOn, pieces, dense, towards, runAlong, rampOff, beyond, inPoly, blob, sheet } from "./kits/westmount";
import type { XY } from "./kits/westmount";
import { KIT as SNOW } from "./kits/snowland";
import { KIT as STEPPE } from "./kits/steppe";
import { KIT as TRUNRADA } from "./kits/trunrada";
import { KIT as ICEBERG } from "./kits/iceberg";
import { KIT as WESTHILLS } from "./kits/westhills";
import type { NpcSpec } from "../npcs";
import type { SolidSpec } from "../world";

useKits(WESTMOUNT, SNOW, STEPPE, TRUNRADA, ICEBERG, WESTHILLS);

const R = 5500; // the walkable box
const A = 9000; // the ground

// ---- the levels: one shelf (350) over the whole pass with the crest (700) a step on it, so the
// east foot (0), terrace A (the shelf east of the crest), the crest, terrace B (the shelf west of
// it), the west valley (0) and the slopes south of the range (0); both run in under the north wall
// and the south wall's east end, and drop in cliffs to the slopes south of them ----
const SHELF: XY[] = [[-2200, -3300], [-800, -3400], [600, -3250], [2000, -3400], [3200, -3250], [4400, -3350], [4400, 2100], [3000, 2200], [1600, 2050], [200, 2150], [-1000, 2050], [-1500, 1900], [-1850, 1600], [-1800, 1000], [-1650, 300], [-1550, -500], [-1650, -1300], [-2200, -1950]];
const CREST: XY[] = [[-2000, -1600], [-600, -1650], [800, -1550], [2200, -1700], [3400, -1550], [4200, -1600], [4200, 400], [3200, 450], [1800, 350], [400, 450], [-1000, 350], [-1250, 300], [-1200, -400], [-1350, -1100], [-2000, -1600]];
const RA1 = rampOff([2000, -3400], [3200, -3250], [2600, -2000], 1100, 460);
const RC1 = rampOff([-600, -1650], [800, -1550], [100, -500], 950, 440);
const RC2 = rampOff([1800, 350], [3200, 450], [2500, -500], 950, 440);
const RB1 = rampOff([-1000, 2050], [200, 2150], [-400, 800], 1000, 460);
// the walls: the south (S1) and north (N1) massifs, their spurs at the gatehouse, the peaks behind
// them (S2, N2); the north wall's west end and the headland at the south-west (SW_HEAD) stand on
// the sea, their cliffs falling into it
const S1: XY[] = [[-A, -A], [-1500, -A], [-1400, -6000], [-1700, -4600], [-1300, -3400], [-1600, -2200], [-1650, -1700], [-2700, -1450], [-4000, -1600], [-5300, -1400], [-6600, -1550], [-A, -1450]];
const S_SPUR: XY[] = [[-1700, -1700], [-1200, -1450], [-100, -1150], [50, -500], [-150, 150], [-1200, 450], [-1800, 300], [-1900, -800]];
const N1: XY[] = [[3800, -A], [A, -A], [A, 5500], [6600, 5550], [5600, 5650], [4800, 5800], [4300, 5950], [4100, 5000], [3700, 3200], [4000, 1800], [3800, 900], [3800, -300], [3900, -1600], [4000, -2600], [3800, -3600], [4100, -4800], [3700, -6000]];
const N_SPUR: XY[] = [[4200, -1900], [3400, -1500], [2700, -1250], [2600, -800], [2700, -150], [3500, 250], [4300, -300], [4600, -1100]];
const S2: XY[] = [[-A, -A], [-3200, -A], [-3000, -5000], [-3400, -3300], [-3900, -2400], [-6000, -2300], [-A, -2400]];
const N2: XY[] = [[5400, -A], [A, -A], [A, 4500], [6300, 4600], [5800, 4000], [5300, 1500], [5600, -500], [5200, -3000], [5600, -6000]];
const SW_HEAD: XY[] = [[-4600, 6150], [-4100, 5600], [-3750, 4900], [-3750, 4200], [-4100, 3500], [-4900, 3150], [-6100, 2950], [-7600, 2850], [-A, 2850], [-A, 3700], [-7600, 3700], [-6700, 3900], [-5650, 4400], [-5050, 4950], [-4720, 5650]];

// ---- the western sea: in the north-west corner under the north wall, and round the headland at
// the south-west; between them the neck of land runs on west to the cape (its shores meet the
// west edge where the cape's do) ----
const NW_SEA: XY[] = [[3700, A + 400], [3950, 6676], [4250, 6150], [4750, 5980], [5600, 5800], [6600, 5700], [7600, 5650], [A + 400, 5650], [A + 400, A + 400]];
const SW_SEA: XY[] = [[-A - 400, 3750], [-7600, 3800], [-6676, 4006], [-5600, 4500], [-5000, 5100], [-4650, 5900], [-4540, 6676], [-4500, A + 400], [-A - 400, A + 400]];

// ---- the gorge across the valley's foot, from the terrace's cliff to the headland's ----
const GORGE: XY[] = smooth([[-2150, 500], [-2200, 1300], [-2350, 2000], [-2600, 2700], [-2700, 3400], [-2900, 4000], [-3300, 4400], [-3650, 4650]], 6);
const GW = 650; // between its walls

const FORT: XY = [1200, -500];
const CAIRNS: XY = [1600, 4100];

export function build(_quality: { flowers: number }): Town {
  const f = new FieldBuilder(310, {
    hills: [
      { x: 1500, y: -4600, r: 900, h: 80 }, { x: -600, y: -4300, r: 700, h: 60 }, { x: 1800, y: 4200, r: 1200, h: 120 },
      { x: -1200, y: 4800, r: 800, h: -80 }, { x: 2800, y: 2700, r: 700, h: 70 }, { x: -3700, y: 1700, r: 900, h: 90 }, { x: -4300, y: -600, r: 800, h: 60 },
    ],
    plateaus: [
      { poly: dense(SHELF), h: 350, ramps: [RA1, RB1] },
      { poly: dense(CREST), h: 700, ramps: [RC1, RC2] },
      { poly: dense(S1, 700), h: 1000 },
      { poly: dense(N1, 700), h: 1200 },
      { poly: dense(S_SPUR), h: 1150 },
      { poly: dense(N_SPUR), h: 1350 },
      { poly: dense(S2, 900), h: 1800 },
      { poly: dense(N2, 900), h: 1900 },
      { poly: dense(SW_HEAD, 500), h: 650 },
    ],
    rock: "Westmount_CliffGranite",
  });
  const { put, rnd } = f;

  // ---- the crossings of the gorge ----
  const cross = (guess: XY) => {
    const n = nearestOn(GORGE, guess);
    let ax: XY = [-n.dir[1], n.dir[0]];
    if (ax[0] > 0) ax = [-ax[0], -ax[1]]; // (from the north side to the south)
    return { at: n.at, ax, off: (k: number): XY => [n.at[0] + ax[0] * k, n.at[1] + ax[1] * k] };
  };
  const B1 = cross([-2650, 3350]), B2 = cross([-3050, 4150]);

  // ---- the road and the paths: over the pass, then west to the cape and south to Suzhou ----
  const E_EXIT: XY = [600, -5150], S_EXIT: XY = [-5150, -770], W_EXIT: XY = [0, 5150];
  const ROAD: XY[] = [
    ...smooth([[400, -7600], E_EXIT, [1200, -4950], [2300, -4850], beyond(RA1.top, RA1.bottom, 400)]), RA1.bottom, RA1.top,
    ...smooth([beyond(RA1.bottom, RA1.top, 350), [2300, -2750], [1300, -2600], [600, -2850], beyond(RC1.top, RC1.bottom, 330)]), RC1.bottom, RC1.top,
    ...smooth([beyond(RC1.bottom, RC1.top, 300), [500, -1150], [1150, -950], [FORT[0], FORT[1] - 300]]), [FORT[0], FORT[1] + 300],
    ...smooth([[1250, -150], [1900, 150], beyond(RC2.bottom, RC2.top, 350)]), RC2.top, RC2.bottom,
    ...smooth([beyond(RC2.top, RC2.bottom, 330), [1900, 1550], [800, 1500], [-100, 1650], beyond(RB1.bottom, RB1.top, 300)]), RB1.top, RB1.bottom, beyond(RB1.top, RB1.bottom, 350),
  ];
  const FORK = beyond(RB1.top, RB1.bottom, 350);
  const SOUTH_WAY: XY[] = [
    ...smooth([FORK, [-1100, 3500], [-1700, 3450], B1.off(-950)]),
    ...smooth([B1.off(950), [-3800, 2600], [-4300, 1500], [-4800, 300], S_EXIT, [-7600, -820]]),
  ];
  const WEST_WAY: XY[] = smooth([FORK, [-250, 4300], W_EXIT, [0, 7600]]);
  const LOOP: XY[] = [...smooth([[-1700, 3450], [-1650, 4250], [-2000, 4750], B2.off(-950)]), ...smooth([B2.off(950), [-3950, 3000], [-3800, 2600]])];
  const CAIRN_WAY: XY[] = smooth([[-1100, 3500], [0, 3700], [900, 3900], [CAIRNS[0] - 300, CAIRNS[1] - 100]]);
  const TRACKS = [ROAD, SOUTH_WAY, WEST_WAY, LOOP, CAIRN_WAY];
  const roads = TRACKS.map((t, i) => band(t, i < 3 ? 460 : 380));

  const area = { x0: -A, y0: -A, x1: A, y1: A };
  const gorgeHole = band(GORGE, GW + 50);
  const atSea = (x: number, y: number) => inPoly(NW_SEA, x, y) || inPoly(SW_SEA, x, y);
  const ground = f.ground({ area, roads, plazas: [], water: [gorgeHole, NW_SEA, SW_SEA], base: "steppe", road: [0.8, 0.74, 0.66], tint: "#d4d6c8" });
  // the greener ground toward the forest (east) and Suzhou's fields (south): second grounds a hair
  // over the dry earth, cut away inland of a ragged line a fifth of the way in, and in patches
  // that thin out toward the edge (so the dry ground frays into the green)
  const rag = (t: number, k: number) => 420 * Math.sin(t / 640 + k) + 260 * Math.sin(t / 270 + 2 * k) + 120 * Math.sin(t / 110 + 3 * k);
  const patches = (inBand: (u: number) => XY, n: number, seed: number): XY[][] => {
    const out: XY[][] = [];
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, p = inBand(u), r = 160 + 260 * (1 - u) * Math.abs(Math.sin(i * 2.7 + seed));
      out.push(blob(p, r, r * 0.8, seed + i, 12));
    }
    return out;
  };
  const eastLine: XY[] = [];
  for (let x = -A - 400; x <= A + 400; x += 120) eastLine.push([x, -3500 + rag(x, 0.7)]);
  const EAST_INLAND: XY[] = [...eastLine, [A + 400, A + 400], [-A - 400, A + 400]];
  const eastPatches = patches((u) => [-R + ((u * 7919) % 1) * 2 * R, -3300 - u * 1900], 34, 3);
  const greenE = f.ground({ area: { x0: -A, x1: A, y0: -A, y1: -1800 }, roads, plazas: [], water: [EAST_INLAND, gorgeHole, NW_SEA, ...eastPatches], base: "jungle", road: [0.8, 0.74, 0.66], tint: "#e4ead8" });
  greenE.mesh.position.y += 3;
  greenE.mesh.renderOrder = 1;
  const southLine: XY[] = [];
  for (let y = -A - 400; y <= A + 400; y += 120) southLine.push([-3500 + rag(y, 2.3), y]);
  const SOUTH_INLAND: XY[] = [...southLine.slice().reverse(), [A + 400, -A - 400], [A + 400, A + 400]];
  const southPatches = patches((u) => [-3300 - u * 1900, -R + ((u * 6271) % 1) * 2 * R], 34, 11);
  const greenS = f.ground({ area: { x0: -A, x1: -1800, y0: -A, y1: A }, roads, plazas: [], water: [SOUTH_INLAND, gorgeHole, SW_SEA, ...southPatches], base: "grass", road: [0.8, 0.74, 0.66] });
  greenS.mesh.position.y += 4;
  greenS.mesh.renderOrder = 1;

  // ---- the western sea: dark water out to the edge, its shore closed ----
  const seas = [sheet(NW_SEA, -14, "Westhills_StormSea"), sheet(SW_SEA, -14, "Westhills_StormSea")];
  for (const coast of [NW_SEA.slice(0, 8), SW_SEA.slice(0, 8)]) f.blockBand(coast.filter(([x, y]) => Math.abs(x) < R + 1500 && Math.abs(y) < R + 1500), 300, { kind: "sea" });

  // ---- the gorge: its walls going down out of sight, a torrent far below, the bridges ----
  const torrent = f.waterSheet({ x0: -4100, x1: -1700, y0: 100, y1: 5100 }, -560, "Westmount_Torrent");
  const sunk = { solid: "none" as const, z: -CHASM_DEPTH };
  {
    const cum = [0];
    for (let i = 1; i < GORGE.length; i++) cum.push(cum[i - 1] + Math.hypot(GORGE[i][0] - GORGE[i - 1][0], GORGE[i][1] - GORGE[i - 1][1]));
    const L = cum[cum.length - 1];
    for (let s = 200; s < L - 150; s += 400) {
      let i = 1;
      while (i < GORGE.length - 1 && cum[i] < s) i++;
      const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1), a = GORGE[i - 1], b = GORGE[i];
      const p: XY = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const n: XY = [-(b[1] - a[1]) / dl, (b[0] - a[0]) / dl];
      for (const sg of [-1, 1]) put("westmount:chasm_wall", [p[0] + n[0] * sg * GW / 2, p[1] + n[1] * sg * GW / 2], towards(-n[0] * sg, -n[1] * sg), sunk);
    }
    // its two ends, shut (each a wall across, facing back along the gorge)
    const n = GORGE.length, e0 = GORGE[0], e1 = GORGE[n - 1];
    const d0 = [GORGE[1][0] - e0[0], GORGE[1][1] - e0[1]], d1 = [e1[0] - GORGE[n - 2][0], e1[1] - GORGE[n - 2][1]];
    const l0 = Math.hypot(d0[0], d0[1]), l1 = Math.hypot(d1[0], d1[1]);
    put("westmount:chasm_wall", [e0[0] - (d0[0] / l0) * 40, e0[1] - (d0[1] / l0) * 40], towards(d0[0], d0[1]), sunk);
    put("westmount:chasm_wall", [e1[0] + (d1[0] / l1) * 40, e1[1] + (d1[1] / l1) * 40], towards(-d1[0], -d1[1]), sunk);
  }
  {
    const n = GORGE.length, e0 = GORGE[0], e1 = GORGE[n - 1];
    const d0 = beyond(GORGE[1], e0, 350), d1 = beyond(GORGE[n - 2], e1, 350);
    for (const part of pieces([d0, ...GORGE, d1], [B1.at, B2.at], 140)) f.blockBand(part, GW + 120, { step: 220, kind: "chasm" });
  }
  put("westmount:gorge_bridge", B1.at, runAlong(B1.ax[0], B1.ax[1]), { solid: BRIDGE_SOLIDS });
  put("westmount:gorge_bridge", B2.at, runAlong(B2.ax[0], B2.ax[1]), { solid: BRIDGE_SOLIDS });

  // ---- ways out ----
  f.exit("elder_forest", E_EXIT, [800, -4450]);
  f.exit("suzhou", S_EXIT, [-4450, -720]);
  f.exit("west_cape", W_EXIT, [-80, 4450]);

  // ---- placing things ----
  const taken: [number, number, number][] = [];
  const nearTrack = (x: number, y: number, d: number) => TRACKS.some((t) => toLine([x, y], t) < d);
  const deep = (x: number, y: number, d: number) => toLine([x, y], GORGE) < GW / 2 + 120 + d;
  const free = (x: number, y: number, r: number, gap = 0) =>
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ground.kind(x + dx, y + dy) === 0) &&
    !deep(x, y, r) && f.level(x, y, r) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + r + gap);
  const take = (x: number, y: number, r: number) => taken.push([x, y, r]);
  const prop = (ref: string, at: XY, h = 0, r = 150, o: Parameters<typeof put>[3] = {}) => {
    put(ref, at, h, o);
    take(at[0], at[1], r);
  };
  const ring = (r: number, kind = "rock") => ({ solid: [{ kind, x: 0, y: 0, r }] as SolidSpec[] });
  const inBox = (x: number, y: number) => Math.abs(x) < R - 150 && Math.abs(y) < R - 150;
  const scatter = (ref: string, c: XY, r: number, n: number, rad = 120, o: (s: number) => Parameters<typeof put>[3] = () => ({}), where = inBox) => {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!where(x, y) || nearTrack(x, y, rad + 230) || !free(x, y, rad, 40)) continue;
      const s = 0.8 + rnd() * 0.4;
      put(ref, [x, y], rnd() * 360, { s, ...o(s) });
      take(x, y, rad * s);
      made++;
    }
  };
  for (const t of TRACKS) for (let i = 0; i < t.length; i += 2) take(t[i][0], t[i][1], 200);
  take(B1.at[0], B1.at[1], 950);
  take(B2.at[0], B2.at[1], 950);

  // ---- the gatehouse across the crest, walls from it to the spurs ----
  prop("westmount:frontier_fort", FORT, 90, 1100, { solid: FORT_SOLIDS });
  prop("westmount:fort_wall", [2420, FORT[1]], 90, 300, { sy: 0.62 });
  prop("westmount:fort_wall", [80, FORT[1]], 90, 200, { sy: 0.4 });
  prop("iceberg:brazier", [FORT[0] - 400, FORT[1] - 650], 0, 60, ring(40, "post"));
  prop("iceberg:brazier", [FORT[0] + 400, FORT[1] - 650], 0, 60, ring(40, "post"));
  if (free(-200, -1350, 90)) prop("westmount:prayer_cairn", [-200, -1350], 40, 160, { s: 0.75, ...ring(90) });
  prop("trunrada:cart", [2200, -1250], 120, 200);
  prop("common:crate", [2450, -1050], 20, 60);
  prop("common:crate", [2380, -980], 65, 60);
  prop("trunrada:banner_pole", [1900, -1350], 0, 60, ring(25, "post"));

  // ---- the cairns in the valley: a pilgrims' ground under the north wall ----
  prop("westmount:prayer_cairn", CAIRNS, 0, 260, ring(110));
  for (const [dx, dy, s] of [[700, 500, 0.7], [-500, 700, 0.6], [400, -700, 0.65], [900, -200, 0.55]] as const) prop("westmount:prayer_cairn", [CAIRNS[0] + dx, CAIRNS[1] + dy], rnd() * 360, 200 * s, { s, ...ring(110 * s) });
  for (const [dx, dy] of [[-300, -500], [200, 900], [-700, 200]] as const) prop("snowland:cairn", [CAIRNS[0] + dx, CAIRNS[1] + dy], rnd() * 90, 70, ring(45));
  // at the bridges and the turns of the road
  for (const at of [B1.off(-1150), B1.off(1150), B2.off(-1150), B2.off(1150)]) {
    const side: XY = [at[0] + (rnd() - 0.5) * 100, at[1] + 380];
    if (free(side[0], side[1], 80)) prop("snowland:cairn", side, rnd() * 90, 70, ring(45));
  }
  for (const at of [[3100, -3800], [-300, -2400], [600, -1900], [2900, 1000], [-700, 1300], [-600, 2700]] as XY[]) if (free(at[0], at[1], 80)) prop("snowland:cairn", at, rnd() * 90, 70, ring(45));

  // ---- the ways out ----
  prop("snowland:trail_sign", [350, -4800], 90, 80, ring(30, "post"));
  prop("westmount:prayer_cairn", [1000, -5000], 0, 160, { s: 0.6, ...ring(70) });
  prop("snowland:trail_sign", [-4650, -420], 0, 80, ring(30, "post"));
  prop("steppe:signpost", [-4500, -1150], 0, 80, ring(30, "post"));
  prop("steppe:signpost", [350, 4750], -90, 80, ring(30, "post"));
  prop("westmount:prayer_cairn", [-450, 5000], 0, 160, { s: 0.55, ...ring(65) });
  // the headland's cliffs and the north wall's foot in the sea: storm rocks, spray breaking
  for (const [x, y, h, s] of [[-5300, 5000, 30, 0.9], [-4950, 5800, 120, 0.7], [-6300, 4500, 200, 1], [4500, 6400, 60, 0.8], [5400, 6100, 160, 0.9], [6500, 6000, 250, 0.7]] as [number, number, number, number][])
    put("westhills:storm_rocks", [x, y], h, { s, z: -14, solid: "none" });
  for (const [x, y] of [[-5100, 5300], [-5900, 4600], [-4800, 6200], [4700, 6150], [5800, 5950]] as XY[]) put("westhills:sea_spray", [x, y], rnd() * 360, { s: 0.8, z: -14, solid: "none" });

  // ---- rockfalls under the walls, boulders over the floors ----
  const ROCKFALLS: [XY, number, number][] = [
    [[-800, -4600], 0.8, 30], [[3300, -4500], 0.9, 100], [[2800, 2700], 0.9, 200], [[3200, 4800], 1.0, 300], [[-1700, 2500], 0.7, 60],
    [[-4600, 2500], 0.75, 150], [[-3500, 5100], 0.8, 250], [[-200, 5200], 0.85, 10], [[3200, -2200], 0.7, 90], [[-900, 700], 0.6, 0],
    [[-2300, -1200], 0.8, 120], [[-4500, -1200], 0.75, 300],
  ];
  for (const [at, s, h] of ROCKFALLS) if (free(at[0], at[1], 330 * s)) prop("westmount:rockfall", at, h, 460 * s, { s, ...ring(320 * s) });
  // (and one heaped where the gorge's rim meets the terrace's cliff, closing the gap between)
  prop("westmount:rockfall", [-1820, 1450], 40, 380, { s: 0.85, ...ring(280) });
  scatter("snowland:snow_boulder", [0, 0], 5200, 5, 130, (s) => ring(110 * s));
  scatter("steppe:boulder", [0, 0], 5200, 7, 130, (s) => ring(110 * s));
  scatter("steppe:rock_cluster", [0, 0], 5200, 5, 160, (s) => ring(130 * s));
  scatter("steppe:boulder_flat", [0, 0], 5200, 8, 140, () => ({ solid: "none" }));

  // ---- wind-bent pines on the terraces and in the valley, leaning away from the west wind ----
  const pine = (at: XY, s: number) => prop("westmount:wind_pine", at, 180 + (rnd() - 0.5) * 40, 200, { s, ...ring(40) });
  for (const [c, r, n] of [
    [[1500, -4100], 900, 4], [[2300, -2300], 600, 3], [[-500, -2600], 500, 2], [[2900, -900], 400, 2], [[-500, -400], 400, 2],
    [[1400, 900], 500, 3], [[-800, 900], 400, 2], [[300, 3000], 800, 4], [[2400, 3800], 900, 4], [[-1300, 4200], 500, 2],
    [[-4400, 1500], 500, 2], [[-3300, -400], 500, 2], [[700, 5000], 600, 3], [[3300, 2000], 400, 2], [[-200, -5000], 400, 2],
  ] as [XY, number, number][]) {
    for (let i = 0, made = 0; i < n * 10 && made < n; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r, x = c[0] + Math.cos(a) * d, y = c[1] + Math.sin(a) * d;
      if (!inBox(x, y) || nearTrack(x, y, 380) || !free(x, y, 200, 150)) continue;
      pine([x, y], 0.75 + rnd() * 0.45);
      made++;
    }
  }
  scatter("flora:PineSmall", [0, 0], 5200, 14, 150, () => ({}));
  scatter("steppe:grass_tuft", [0, 0], 5300, 60, 60, () => ({ solid: "none" }));
  scatter("snowland:dry_grass", [0, 0], 5300, 40, 60, () => ({ solid: "none" }));
  scatter("steppe:scrub", [0, 0], 5300, 20, 90, () => ({ solid: "none" }));
  scatter("steppe:dead_tree", [0, 0], 5200, 5, 120, () => ring(35, "tree"));

  // ---- toward the edges the green comes in: the forest's broadleaves on the east, Suzhou's pines,
  // bamboo and round trees on the south, thicker the nearer the edge ----
  const fringe = (kinds: string[], n: number, at: () => [XY, number]) => {
    for (let i = 0, made = 0; i < n * 30 && made < n; i++) {
      const [[x, y], w] = at();
      if (rnd() > w || !inBox(x, y) || nearTrack(x, y, 330) || !free(x, y, 170, 110)) continue;
      prop(`flora:${kinds[Math.floor(rnd() * kinds.length)]}`, [x, y], rnd() * 360, 200, { s: 0.8 + rnd() * 0.4 });
      made++;
    }
  };
  fringe(["BigOak", "RoundTree", "JungleTree", "SmallTree", "RoundTree"], 46, () => {
    const d = rnd() * 2400;
    return [[-R + 200 + rnd() * (2 * R - 400), -R + 150 + d], 1 - d / 2400];
  });
  fringe(["Pine", "RoundTree", "Bamboo", "PineSmall", "Bamboo"], 40, () => {
    const d = rnd() * 2400;
    return [[-R + 150 + d, -R + 200 + rnd() * (2 * R - 400)], 1 - d / 2400];
  });

  // ---- the walls' tops and the ways on past the edge: pines bent by the wind ----
  const onTrack = (x: number, y: number) => [[0, 0], [300, 0], [-300, 0], [0, 300], [0, -300]].some(([dx, dy]) => ground.kind(x + dx, y + dy) !== 0);
  const inside = (x: number, y: number) => Math.abs(x) < R + 300 && Math.abs(y) < R + 300;
  // (past the east and south edges the woods of the land beyond instead: broadleaves, Suzhou's mix)
  const past = (x: number, y: number) => inside(x, y) || onTrack(x, y) || deep(x, y, 200);
  f.woods({ x0: -A, x1: A, y0: -A, y1: -R - 300 }, ["BigOak", "RoundTree", "JungleTree", "BigOak", "SmallTree"], past, { count: 150, spacing: 440, tries: 3000 });
  f.woods({ x0: -A, x1: -R - 300, y0: -A, y1: A }, ["Pine", "RoundTree", "Bamboo", "Pine", "PineSmall"], (x, y) => past(x, y) || atSea(x, y) || inPoly(SW_HEAD, x, y), { count: 140, spacing: 440, tries: 3000 });
  f.woods(area, ["Pine", "PineSmall", "Pine", "SnowPineSmall"], (x, y) => (inside(x, y) && f.h(x, y) < 950) || onTrack(x, y) || deep(x, y, 200) || atSea(x, y), { count: 380, spacing: 520, tries: 6000 });
  f.woods(area, ["wind_pine"], (x, y) => (inside(x, y) && f.h(x, y) < 950) || onTrack(x, y) || deep(x, y, 200) || atSea(x, y), { count: 70, spacing: 900, tries: 2000, kit: "westmount" });
  for (let i = 0; i < 40; i++) {
    const x = (rnd() - 0.5) * 2 * A, y = (rnd() - 0.5) * 2 * A;
    if (inside(x, y) || onTrack(x, y) || atSea(x, y) || !f.level(x, y, 300)) continue;
    put(rnd() < 0.5 ? "westmount:rockfall" : "snowland:snow_boulder", [x, y], rnd() * 360, { solid: "none", s: 0.6 + rnd() * 0.5 });
  }

  // ---- monsters ----
  const quiet = (x: number, y: number) => Math.hypot(x - FORT[0], y - FORT[1]) < 900 || Math.hypot(x - CAIRNS[0], y - CAIRNS[1]) < 700;
  f.monsterSpots(ground, { x0: -R + 300, x1: R - 300, y0: -R + 300, y1: R - 300 }, { step: 600, keepOut: quiet });

  const npcs: NpcSpec[] = [
    { id: "west_pass_veteran", x: 500, y: -1250, face: 200, name: "เกรเกอร์", title: "ยามเฒ่าแห่งด่านชายแดน", role: "talk",
      look: { gender: "male", hair: "", hairColor: "silver", eyes: "blue", top: "top_warrior_navy", bottom: "bottom_warrior_black" },
      lines: [
        "ด่านนี้เคยกั้นพรมแดนระหว่างโนอากับเมืองท่าทางตะวันตก ตอนนี้เหลือแค่ข้ากับลมหนาว",
        "หอฝั่งเหนือถล่มลงมาในศึกครั้งสุดท้าย ก้อนหินยังกองอยู่อย่างนั้นตั้งแต่วันนั้น",
        "ลงทางตะวันตกไปจะเจอหุบเหว ข้ามสะพานเชือกแล้วเดินลงใต้ก็ถึงซูโจว",
        "ส่วนทางตะวันตกสุดหุบเขา คอแผ่นดินทอดลงไปถึงแหลมทะเลตะวันตก ของที่นั่นดุร้ายกว่าบนช่องเขานี้หลายเท่า",
      ] },
    { id: "west_pass_pilgrim", x: CAIRNS[0] - 450, y: CAIRNS[1] - 300, face: 160, name: "เหม่ยหลิง", title: "ผู้แสวงบุญแห่งช่องเขา", role: "talk",
      look: { gender: "female", hair: "hime", hairColor: "ink", eyes: "amber", top: "top_priestess_white", bottom: "bottom_priestess_wine" },
      lines: [
        "ธงมนต์ทุกผืนฝากคำอธิษฐานไปกับลม ให้คนข้ามเขาไปถึงปลายทางโดยปลอดภัย",
        "ใต้สะพานเชือกนั่นลึกจนมองไม่เห็นก้นเหว อย่าก้มมองนานนักล่ะ",
        "สัตว์ประหลาดบนช่องเขานี้แข็งแกร่งยิ่งกว่าที่ใดในแดนตะวันตก อย่าประมาทเชียว",
      ] },
  ];

  return f.finishField({
    ground,
    scenery: [torrent, greenE.mesh, greenS.mesh, ...seas],
    sky: "#a3b0bb",
    bounds: { minX: -R, maxX: R, minY: -R, maxY: R },
    spawn: { x: 900, y: -4300 },
    npcs,
    labels: [
      { x: E_EXIT[0], y: E_EXIT[1] + 250, text: "ทางไปป่าโบราณ", kind: "gate" },
      { x: S_EXIT[0] + 200, y: S_EXIT[1], text: "ทางไปซูโจว", kind: "gate" },
      { x: W_EXIT[0] + 250, y: W_EXIT[1] - 200, text: "ทางไปแหลมทะเลตะวันตก", kind: "gate" },
      { x: -900, y: 4700, text: "คอแผ่นดินสู่แหลม", kind: "small" },
      { x: FORT[0] + 500, y: FORT[1] - 750, text: "ด่านชายแดนเก่า" },
      { x: B1.at[0] + 300, y: B1.at[1] + 900, text: "หุบเหวสะพานเชือก" },
      { x: CAIRNS[0] + 300, y: CAIRNS[1] + 300, text: "ลานธงมนต์" },
      { x: 1500, y: -2300, text: "ทางขึ้นช่องเขา", kind: "small" },
      { x: 600, y: 150, text: "สันช่องเขา", kind: "small" },
      { x: 1000, y: 3000, text: "หุบเขาตะวันตก" },
      { x: 1500, y: -4300, text: "เชิงเขาตะวันออก", kind: "small" },
    ],
  });
}
